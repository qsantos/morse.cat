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
    const callSign = document.getElementById("contest-call-sign").value;
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
    sendMorse('You', 'CQCQ TEST G4FON');
}
