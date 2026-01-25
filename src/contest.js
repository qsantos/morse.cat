const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));

let yourRealNumber = 1;
let theirRealCallSign = null;
let theirRealNumber = null;
let youSending = false;

/**
 * @param {number} min -- inclusive
 * @param {number} max -- exclusive
 * @return {number}
 */
function randrange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * @param {number} min -- inclusive
 * @param {number} max -- inclusive
 * @return {number}
 */
function randint(min, max) {
    return randrange(min, max + 1);
}

/**
 * @template { { [key: number]: any, length: number } } T
 * @param {T} charset -- array of characters
 * @return {T[number]} -- random character
 */
function choice(charset) {
    return charset[randrange(0, charset.length)];
}

/**
 * @param {number} mu -- mean
 * @param {number} sigma -- standard deviation
 * @return {number}
 */
function gauss(mu, sigma) {
    // TODO: compute, cache and use the one with sin()
    const x2pi = Math.random() * 2.0 * Math.PI;
    const g2rad = Math.sqrt(-2.0 * Math.log(Math.random()));
    const z = Math.cos(x2pi) * g2rad;
    return mu + z * sigma;
}

/**
 * @param {number} mu -- mean
 * @param {number} sigma -- standard deviation
 * @return {number}
 */
function lognormvariate(mu, sigma) {
    return Math.exp(gauss(mu, sigma));
}

/**
 * @template { { [key: number]: any, length: number } } T
 * @param {T} charset -- array of characters
 * @param {number} count -- number of characters to choose
 * @return {T[number][]} -- random characters
 */
function choices(charset, count) {
    return Array.from({ length: count }, () => choice(charset));
}

/**
 * @return {string} -- random call sign
 */
function randomCallSign() {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const prefixLength = randint(1, 2);
    const suffixLength = randint(1, 3);

    const prefix = choices(charset, prefixLength).join("");
    const numeral = choice("0123456789");
    const suffix = choices(charset, suffixLength).join("");

    return prefix + numeral + suffix;
}

/**
 * @param {number} number -- number to format
 * @return {string} -- formatted number
 */
function formatNumber(number) {
    return String(number).padStart(3, "0");
}

/**
 * @param {string} number -- number to normalize
 * @return {string} -- normalized number
 */
function normalizeNumber(number) {
    return formatNumber(Number.parseInt(number));
}

/**
 *  @param {number} delay -- milliseconds
 */
async function sleep(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * @param {string} sender -- call sign of sender
 * @param {string} message -- message to send
 * @return {Promise<void>} -- resolved when message is sent
 */
function sendMorse(sender, message) {
    return new Promise((accept) => {
        // Set up cwPlayer
        const cwPlayer = new MorsePlayer({
            wpm: 30,
            frequency: 600,
            q: 13,
            onCharacterPlay: (c) => {
                played.push(c.c);
                decodedMorse.innerHTML = played.join("").toUpperCase();
            },
            onFinished: accept,
        });
        cwPlayer.pushText(message);

        // Log Entry
        const log = document.getElementById("log");
        const logEntry = document.createElement("LI");
        log.appendChild(logEntry);

        // Sender label
        const callSign = document.getElementById("their-call-sign").value;
        const callSignLabel = document.createElement("SPAN");
        callSignLabel.innerHTML = `${sender}: `;
        logEntry.appendChild(callSignLabel);

        // Scroll to bottom of decoded Morse log
        logEntry.scrollIntoView();

        // Decoded Morse
        const decodedMorse = document.createElement("SPAN");
        logEntry.appendChild(decodedMorse);
        const played = [""];
    });
}

/**
 * @param {string} message -- message to send
 * @return {Promise<void>} -- resolved when message is sent
 */
async function youSend(message) {
    if (youSending) {
        return false;
    }
    youSending = true;
    await sendMorse("You", message);
    youSending = false;
    return true;
}

/**
 * @param {string} message -- message to send
 * @return {Promise<void>} -- resolved when message is sent
 */
async function theySend(message) {
    await sendMorse("Them", message);
}

/**
 * @return {Promise<void>} -- resolved when contact is initiated
 */
async function initiateContact() {
    const callSign = randomCallSign();
    await theySend(`${callSign}`);
    // only set this after sending the call sign to prevent the user from guessing
    theirRealCallSign = callSign;
    theirRealNumber = Math.floor(lognormvariate(3, 1.2));
}

/**
 * @return {Promise<void>} -- resolved when contact is initiated
 */
async function cq() {
    document.getElementById("their-call-sign").focus();
    const yourCallSign = document.getElementById("your-call-sign").value;
    if (!(await youSend(`CQCQ TEST ${yourCallSign}`))) {
        return;
    }
    await sleep(1000);
    await initiateContact();
}

/**
 * @return {Promise<void>} -- resolved when contact is initiated
 */
async function repeatCallSign() {
    const theirCallSign = document.getElementById("their-call-sign").value;
    if (!(await youSend(theirCallSign))) {
        return;
    }
    await sleep(1000);
    const paddedNumber = formatNumber(theirRealNumber);
    if (theirCallSign === theirRealCallSign) {
        await theySend(`599 ${paddedNumber}`);
        document.getElementById("their-number").focus();
    } else if (theirRealCallSign) {
        await theySend(`DE ${theirRealCallSign} 599 ${paddedNumber}`);
    }
}

/**
 * @param {string} provided
 * @param {string} expected
 * @return {string}
 */
function correctify(provided, expected) {
    if (provided === expected) {
        return provided;
    } else {
        return `<span class="strike">${provided}</span> ${expected}`;
    }
}

/**
 * @return {Promise<void>} -- resolved when contact is initiated
 */
async function sendReportAndNumber() {
    const yourReport = document.getElementById("your-report");
    const yourNumber = document.getElementById("your-number");
    const theirCallSign = document.getElementById("their-call-sign");
    const theirReport = document.getElementById("their-report");
    const theirNumber = document.getElementById("their-number");
    // Complete exchange
    if (!(await youSend(`${yourReport.value} ${yourNumber.value}`))) {
        return;
    }
    // Log contact
    const time = new Date().toISOString();
    const contactLogEntry = document.createElement("TR");
    contactLogEntry.innerHTML = `
        <td>${yourNumber.value}</td>
        <td><time datetime="${time}" title="${time}">${time.slice(11, 16)}</time></td>
        <td>${correctify(theirCallSign.value, theirRealCallSign)}</td>
        <td>${yourReport.value}</td>
        <td>${correctify(normalizeNumber(theirReport.value), "599")}</td>
        <td>${correctify(normalizeNumber(theirNumber.value), formatNumber(theirRealNumber))}</td>
`;
    document.getElementById("contact-log").appendChild(contactLogEntry);
    await theySend("TU GL");
    // Reset inputs
    theirCallSign.value = "";
    theirNumber.value = "";
    theirCallSign.focus();
    // Increment your number
    yourRealNumber += 1;
    yourNumber.value = formatNumber(yourRealNumber);
    await sleep(1000);
    await initiateContact();
}

/**
 * @param {KeyboardEvent} event -- key down event
 */
function yourCallSignKeyDown(event) {
    if (event.key === "Enter" && event.target.value) {
        cq();
    }
}

/**
 * @param {KeyboardEvent} event -- key down event
 */
function theirCallSignKeyDown(event) {
    if (event.key === "Enter" && event.target.value) {
        repeatCallSign();
    }
}

/**
 * @param {KeyboardEvent} event -- key down event
 */
function theirReportKeyDown(event) {
    if (event.key === "Enter" && event.target.value) {
        document.getElementById("their-number").focus();
    }
}

/**
 * @param {KeyboardEvent} event -- key down event
 */
function theirNumberKeyDown(event) {
    if (event.key === "Enter" && event.target.value) {
        sendReportAndNumber();
    }
}
