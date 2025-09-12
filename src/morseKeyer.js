// depends on morsePlayer.js

/**
 * @param {import("./types").MorseKeyerParams} params
 */
function MorseKeyer(params) {
    // Map Morse code to characters, using the first match from morseOfCharacter
    /** @type {{[key: string]: string}} */
    const characterOfMorse = {};
    for (const character in morseOfCharacter) {
        const morse = morseOfCharacter[character];
        if (characterOfMorse[morse] === undefined) {
            characterOfMorse[morse] = character;
        }
    }

    const wpm = params?.wpm || 20;

    /** @type {MorsePlayer} */
    // @ts-ignore
    let cwPlayer = null;

    // For iambic keying, remember when both paddles are pressed, remember whether
    // the last element sent was a dit or a dah, to send the other one next
    let lastElementSent = null;
    // Whether the dit paddle is active (e.g. Control Left key pressed)
    let ditKeyPressed = false;
    // Whether the dah paddle is active (e.g. Control Right key pressed)
    let dahKeyPressed = false;
    // Timeout handle when we should check the state of the paddles to decide
    // whether to send a new element (and which)
    let maybePlayElementTimeout = undefined;
    // Accumulates elements until a full character is identified
    const characterElements = [];
    // Accumulates character until a full word is formed
    const wordCharacters = [];
    let interCharacterTimeout = undefined;
    let wordSpaceTimeout = undefined;

    const dotDuration = 1.2 / wpm;

    function initCwPlayer() {
        if (cwPlayer !== null) {
            return;
        }
        cwPlayer = new MorsePlayer({
            ...params,
            onOn,
            onOff,
        });
    }

    function endElement(element) {
        characterElements.push(element);
        params?.characterCallback?.(element);
    }

    function endCharacter() {
        const morse = characterElements.join("");
        const character = characterOfMorse[morse]
        characterElements.length = 0;
        wordCharacters.push(character);
        params?.characterCallback?.(character);
    }

    function endWord() {
        const word = wordCharacters.join("");
        wordCharacters.length = 0;
        params?.wordCallback?.(word);
    }

    function onOn(gapDuration) {
        clearTimeout(interCharacterTimeout);
        clearTimeout(wordSpaceTimeout);
        params?.onOn?.();
    }

    function onOff(elementDuration) {
        if (elementDuration < dotDuration * 1.5) {
            // dit
            endElement(".");
        } else {
            // dah
            endElement("-");
        }
        // Schedule detecting an inter-character gap and an word space
        // TODO: make it less dependent on JavaScript timeout scheduling (including that of onOff)
        // decide on inter-character gap half-way between inter-element gap (1 dot) and inter-character gap (3 dot)
        interCharacterTimeout = setTimeout(endCharacter, dotDuration * 2000);
        // decide on word space half-way between inter-character gap (3 dots) and word space (7 dots)
        wordSpaceTimeout = setTimeout(endWord, dotDuration * 5000);
        params?.onOff?.();
    }

    /** Push a new element to the Morse player, and schedule the next element decision */
    function playElement(element) {
        initCwPlayer();
        cwPlayer.push(element);
        lastElementSent = element;
        clearTimeout(maybePlayElementTimeout);
        // cwPlayer.remainingTime() includes the time needed for a inter-element
        // gap (one dot long); we need to keep some margin in case the timeout is
        // scheduled late
        maybePlayElementTimeout = setTimeout(maybePlayElement, (cwPlayer.remainingTime() - dotDuration / 2) * 1000);
    }

    /** To be called when we need to decide whether sending a new element */
    function maybePlayElement() {
        if (ditKeyPressed && dahKeyPressed) {
            playElement(lastElementSent === "-" ? "." : "-");
        } else if (ditKeyPressed) {
            playElement(".");
        } else if (dahKeyPressed) {
            playElement("-");
        } else {
            // stop
        }
    }

    this.pressStraightKey = () => {
        initCwPlayer();
        cwPlayer.on();
    };

    this.releaseStraightKey = () => {
        cwPlayer?.off();
    };

    this.pressDitKey = () => {
        ditKeyPressed = true;
        maybePlayElement();
    };

    this.releaseDitKey = () => {
        ditKeyPressed = false;
    };

    this.pressDahKey = () => {
        dahKeyPressed = true;
        maybePlayElement();
    };

    this.releaseDahKey = () => {
        dahKeyPressed = false;
    };

    function resetTimeouts() {
        clearTimeout(maybePlayElementTimeout);
        clearTimeout(interCharacterTimeout);
        clearTimeout(wordSpaceTimeout);
    }

    this.stop = () => {
        resetTimeouts();
        cwPlayer?.stop();
    };

    this.close = () => {
        resetTimeouts();
        cwPlayer?.close();
    };
}
