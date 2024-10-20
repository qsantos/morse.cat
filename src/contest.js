const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

let theirRealCallSign = null;
let youSending = false;

/**
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function randrange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function randint(min, max) {
    return randrange(min, max + 1);
}

/**
 * @template { { [key: number]: any, length: number } } T
 * @param {T} charset
 * @return {T[number]}
 */
function choice(charset) {
    return charset[randrange(0, charset.length)];
}

/**
 * @template { { [key: number]: any, length: number } } T
 * @param {T} charset
 * @param {number} count
 * @return {T[number][]}
 */
function choices(charset, count) {
    return Array.from({ length: count }, () => choice(charset));
}

function randomCallSign() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefixLength = randint(1, 2);
    const suffixLength = randint(1, 3);

    const prefix = choices(charset, prefixLength).join("");
    const numeral = choice("0123456789");
    const suffix = choices(charset, suffixLength).join("");

    return prefix + numeral + suffix;
}

/**
 *  @param {number} delay
 */
async function sleep(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

function sendMorse(sender, message) {
    return new Promise((accept) => {
        // Set up cwPlayer
        const cwPlayer = new jscw();
        cwPlayer.q = 13;
        cwPlayer.setText(message);
        cwPlayer.setWpm(30);
        cwPlayer.setEff(30);
        cwPlayer.setFreq(600);

        // Log Entry
        const log = document.getElementById("log");
        const logEntry = document.createElement("LI");
        log.appendChild(logEntry);

        // Sender label
        const callSign = document.getElementById("their-call-sign").value;
        const callSignLabel = document.createElement("SPAN");
        callSignLabel.innerHTML = `${sender}: `;
        logEntry.appendChild(callSignLabel);

        // Decoded Morse
        const decodedMorse = document.createElement("SPAN");
        logEntry.appendChild(decodedMorse);
        let played = [""];
        cwPlayer.onCharacterPlay = (c) => {
            played.push(c.c);
            decodedMorse.innerHTML = played.join("").toUpperCase();
        };

        // Promise handling
        cwPlayer.onFinished = () => {
            accept();
        };

        // Start
        cwPlayer.play();
    });
}

async function youSend(message) {
    if (youSending) {
        return false;
    }
    youSending = true;
    await sendMorse('You', message);
    youSending = false;
    return true;
}

async function theySend(message) {
    await sendMorse('Them', message);
}

async function cq() {
    document.getElementById("their-call-sign").focus();

    const yourCallSign = document.getElementById("your-call-sign").value
    if (!await youSend(`CQCQ TEST ${yourCallSign}`)) {
        return;
    }
    await sleep(1000);

    const callSign = randomCallSign();
    await theySend(`${callSign}`);
    // only set this after sending the call sign to prevent the user from guessing
    theirRealCallSign = callSign;
}

async function repeatCallSign() {
    const theirCallSign = document.getElementById("their-call-sign").value;
    if (!await youSend(theirCallSign)) {
        return;
    }
    if (theirCallSign === theirRealCallSign) {
        document.getElementById("their-report").focus();
        await sleep(1000);
        await theySend('599 042');
    } else if (theirRealCallSign) {
        await sleep(1000);
        await theySend(`${theirRealCallSign}`);
    }
}

async function sendReportAndNumber() {
    const yourReport = document.getElementById("your-report").value;
    const yourNumber = document.getElementById("your-number").value;
    if (!await youSend(`${yourReport} ${yourNumber}`)) {
        return;
    }
}

function yourCallSignKeyDown(event) {
    if (event.key == "Enter") {
        const yourCallSign = document.getElementById("your-call-sign").value
        if (yourCallSign) {
            cq();
        }
    }
}

function theirCallSignKeyDown(event) {
    if (event.key == "Enter") {
        repeatCallSign();
    }
}

function theirNumberKeyDown(event) {
    if (event.key == "Enter") {
        sendReportAndNumber();
    }
}
