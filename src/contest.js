const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

function sendMorse(sender, message) {
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

    // Start
    cwPlayer.play();
}

function cq() {
    const yourCallSign = document.getElementById("your-call-sign").value
    document.getElementById("their-call-sign").focus();
    sendMorse('You', `CQCQ TEST ${yourCallSign}`);
}

function repeatCallSign() {
    const theirCallSign = document.getElementById("their-call-sign").value;
    sendMorse('You', theirCallSign);
}

function sendReport() {
    const yourReport = document.getElementById("your-report").value;
    const yourNumber = document.getElementById("your-number").value;
    sendMorse('You', `${yourReport} ${yourNumber}`);
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
