const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

let cwPlayer = undefined;

function cq() {
    cwPlayer = new jscw();
    cwPlayer.q = 13;
    cwPlayer.q = 13;
    cwPlayer.setText('CQCQ TEST G4FON');
    cwPlayer.setWpm(30);
    cwPlayer.setEff(30);
    cwPlayer.setFreq(600);
    cwPlayer.play();
}
