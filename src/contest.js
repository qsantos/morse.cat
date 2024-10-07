const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

function cq() {
    // set up cwPlayer
    const cwPlayer = new jscw();
    cwPlayer.q = 13;
    cwPlayer.setText('CQCQ TEST G4FON');
    cwPlayer.setWpm(30);
    cwPlayer.setEff(30);
    cwPlayer.setFreq(600);

    // set up decoder
    const log = document.getElementById("log");
    const logEntry = document.createElement("LI");
    log.appendChild(logEntry);

    let played = [""];
    cwPlayer.onCharacterPlay = (c) => {
        played.push(c.c);
        logEntry.innerHTML = played.join("").toUpperCase();
    };
    cwPlayer.play();
}
