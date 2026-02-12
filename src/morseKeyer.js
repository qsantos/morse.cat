// depends on morsePlayer.js

/**
 * @param {import("./types").MorseKeyerParams | undefined} params
 */
function MorseKeyer(params) {
    // Map Morse code to characters, using the first match from morseOfCharacter
    /** @type {{[key: string]: string}} */
    const characterOfMorse = {};
    for (const character in morseOfCharacter) {
        const morse = morseOfCharacter[character];
        if (morse !== undefined && characterOfMorse[morse] === undefined) {
            characterOfMorse[morse] = character;
        }
    }

    const wpm = params?.wpm || 20;

    /** @type {MorsePlayer} */
    // @ts-ignore
    let cwPlayer = null;

    // For iambic keying, remember when both paddles are pressed, remember whether
    // the last element sent was a dot or a dash, to send the other one next
    /** @type {string | null} */
    let lastElementSent = null;
    // Whether the dot paddle is active (e.g. Control Left key pressed)
    let dotKeyPressed = false;
    // Whether the dash paddle is active (e.g. Control Right key pressed)
    let dashKeyPressed = false;
    // Timeout handle when we should check the state of the paddles to decide
    // whether to send a new element (and which)
    /** @type {number | undefined} */
    let maybePlayElementTimeout = undefined;
    // Accumulates elements until a full character is identified
    /** @type {string[]} */
    const characterElements = [];
    // Accumulates character until a full word is formed
    /** @type {string[]} */
    const wordCharacters = [];
    /** @type {number | undefined} */
    let interCharacterTimeout = undefined;
    /** @type {number | undefined} */
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

    /**
     *  @param {string} element
     */
    function endElement(element) {
        characterElements.push(element);
        params?.elementCallback?.(element);
    }

    function endCharacter() {
        const morse = characterElements.join("");
        const character = characterOfMorse[morse];
        characterElements.length = 0;
        if (character !== undefined) {
            wordCharacters.push(character);
        }
        params?.characterCallback?.(character);
    }

    function endWord() {
        const word = wordCharacters.join("");
        wordCharacters.length = 0;
        params?.wordCallback?.(word);
    }

    function onOn() {
        clearTimeout(interCharacterTimeout);
        clearTimeout(wordSpaceTimeout);
        params?.onOn?.();
    }

    /**
     *  @param {number} elementDuration
     */
    function onOff(elementDuration) {
        if (elementDuration < dotDuration * 1.5) {
            // dot
            endElement(".");
        } else {
            // dash
            endElement("-");
        }
        // Schedule detecting an inter-character gap and an word space
        // TODO: make it less dependent on JavaScript timeout scheduling (including that of onOff)
        // decide on inter-character gap half-way between inter-element gap (1 dot) and inter-character gap (3 dots)
        interCharacterTimeout = setTimeout(endCharacter, dotDuration * 2000);
        // decide on word space half-way between inter-character gap (3 dots) and word space (7 dots)
        wordSpaceTimeout = setTimeout(endWord, dotDuration * 5000);
        params?.onOff?.(elementDuration);
    }

    /** Push a new element to the Morse player, and schedule the next element decision */
    /**
     *  @param {string} element
     */
    function playElement(element) {
        initCwPlayer();
        cwPlayer.push(element);
        lastElementSent = element;
        clearTimeout(maybePlayElementTimeout);
        // TODO: do not use player remainingTime as a reference
        // cwPlayer.remainingTime() includes the time needed for a inter-element
        // gap (one dot long); we need to keep some margin in case the timeout is
        // scheduled late
        maybePlayElementTimeout = setTimeout(maybePlayElement, (cwPlayer.remainingTime() - dotDuration / 2) * 1000);
    }

    /** To be called when we need to decide whether sending a new element */
    function maybePlayElement() {
        if (dotKeyPressed && dashKeyPressed) {
            playElement(lastElementSent === "-" ? "." : "-");
        } else if (dotKeyPressed) {
            playElement(".");
        } else if (dashKeyPressed) {
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

    this.pressDotKey = () => {
        dotKeyPressed = true;
        maybePlayElement();
    };

    this.releaseDotKey = () => {
        dotKeyPressed = false;
    };

    this.pressDashKey = () => {
        dashKeyPressed = true;
        maybePlayElement();
    };

    this.releaseDashKey = () => {
        dashKeyPressed = false;
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
