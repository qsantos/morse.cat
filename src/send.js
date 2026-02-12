// TODO: deduplicate with copy.js
/** Get an HTML element by id and throw if it does not exist
 *  @template T
 *  @param {string} id - The element’s id
 *  @param {new() => T} type - The type of HTML Element
 *  @return {T} - The element
 */
function getElement(id, type) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Expected HTML element with id ${id} but none found`);
    }
    if (!(element instanceof type)) {
        throw new Error(`Expected ${type.name} with id ${id} but found ${element} instead`);
    }
    return element;
}

const keyer = new MorseKeyer({
    wpm: 20,
    elementCallback,
    characterCallback,
    wordCallback,
});

/** @type string[] */
const elements = [];
/** @type string[] */
const characters = [];
/** @type string[] */
const words = [];

/**
 *  @param {string} element
 */
function elementCallback(element) {
    elements.push(element);
    getElement("elements", HTMLLIElement).innerHTML = elements.join("");
}

/**
 *  @param {string | undefined} character
 */
function characterCallback(character) {
    elements.length = 0;
    characters.push(character || "?");
    getElement("elements", HTMLLIElement).innerHTML = "";
    getElement("characters", HTMLLIElement).innerHTML = characters.join("");
}

/**
 *  @param {string} word
 */
function wordCallback(word) {
    words.push(word);
    characters.length = 0;
    getElement("elements", HTMLLIElement).innerHTML = "";
    getElement("characters", HTMLLIElement).innerHTML = "";
    getElement("words", HTMLLIElement).innerHTML = words.join(" ");
}

/**
 *  @param {KeyboardEvent} event
 */
function onKeyDown(event) {
    if (event.code === "Space") {
        keyer.pressStraightKey();
    } else if (event.code === "ControlLeft") {
        keyer.pressDotKey();
    } else if (event.code === "ControlRight") {
        keyer.pressDashKey();
    }
}

/**
 *  @param {KeyboardEvent} event
 */
function onKeyUp(event) {
    if (event.code === "Space") {
        keyer.releaseStraightKey();
    } else if (event.code === "ControlLeft") {
        keyer.releaseDotKey();
    } else if (event.code === "ControlRight") {
        keyer.releaseDashKey();
    }
}

function onBlur() {
    keyer.releaseDotKey();
    keyer.releaseDashKey();
    keyer.releaseStraightKey();
}

document.addEventListener("blur", onBlur);
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);
