const keyer = new MorseKeyer({
    wpm: 20,
    elementCallback,
    characterCallback,
    wordCallback,
});

const elements = [];
const characters = [];
const words = [];

function elementCallback(element) {
    elements.push(element);
    document.getElementById("elements").innerHTML = elements.join("");
}

function characterCallback(character) {
    elements.length = 0;
    characters.push(character);
    document.getElementById("elements").innerHTML = "";
    document.getElementById("characters").innerHTML = characters.join("");
}

function wordCallback(word) {
    characters.length = 0;
    words.push(word);
    document.getElementById("elements").innerHTML = "";
    document.getElementById("characters").innerHTML = "";
    document.getElementById("words").innerHTML = words.join(" ");
}

function onKeyDown(event) {
    if (event.code === "Space") {
        keyer.pressStraightKey();
    } else if (event.code === "ControlLeft") {
        keyer.pressDitKey();
    } else if (event.code === "ControlRight") {
        keyer.pressDahKey();
    }
}

function onKeyUp(event) {
    if (event.code === "Space") {
        keyer.releaseStraightKey();
    } else if (event.code === "ControlLeft") {
        keyer.releaseDitKey();
    } else if (event.code === "ControlRight") {
        keyer.releaseDahKey();
    }
}

function onBlur(event) {
    keyer.releaseDitKey();
    keyer.releaseDahKey();
    keyer.releaseStraightKey();
}

document.addEventListener("blur", onBlur);
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);
