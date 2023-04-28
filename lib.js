const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // A-Z
const digits = '0123456789'; // 0-9
const punct = '.,:?\'-/()"=+×@';
const lcwoLessons = 'KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X';
const settings = (() => {
    try {
        return JSON.parse(localStorage.getItem('settings') || '');
    } catch (e) {
        return {
            wpm: 20,
            tone: 600,
            error_tone: 200,
            word_length: 5,
            charset: lcwoLessons,
        };
    }
})();
const sessionHistory = (() => {
    try {
        return JSON.parse(localStorage.getItem('history') || '');
    } catch (e) {
        return [];
    }
})();

const m = new jscw();

function pushWord() {
    const word = Array.from({ length: settings.word_length }, () => settings.charset[Math.floor(Math.random() * settings.charset.length)]).join('');
    m.setText(` ${word}`);
}

const played = [];
let copiedText = '';
let inSession = false;
let sessionStart;
let sessionDurationUpdater;

function loadInteger(name) {
    return parseInt(localStorage.getItem(name), 10) || 0;
}

function saveInteger(name, value) {
    localStorage.setItem(name, JSON.stringify(value));
}

// stats
let statsUpdated = localStorage.getItem('statsUpdated');
// CHARACTERS
let totalCopiedCharacters = loadInteger('totalCopiedCharacters');
let sessionCopiedCharacters = loadInteger('sessionCopiedCharacters');
let dayCopiedCharacters = loadInteger('dayCopiedCharacters');
let bestSessionCopiedCharacters = loadInteger('bestSessionCopiedCharacters');
let bestDayCopiedCharacters = loadInteger('bestDayCopiedCharacters');
// WORDS
let totalCopiedWords = loadInteger('totalCopiedWords');
let sessionCopiedWords = loadInteger('sessionCopiedWords');
let dayCopiedWords = loadInteger('dayCopiedWords');
let bestSessionCopiedWords = loadInteger('bestSessionCopiedWords');
let bestDayCopiedWords = loadInteger('bestDayCopiedWords');
// SCORE
let totalScore = loadInteger('totalScore');
let sessionScore = loadInteger('sessionScore');
let dayScore = loadInteger('dayScore');
let bestSessionScore = loadInteger('bestSessionScore');
let bestDayScore = loadInteger('bestDayScore');
// TIME
let totalTime = loadInteger('totalTime');
let sessionTime = loadInteger('sessionTime');
let dayTime = loadInteger('dayTime');
let bestSessionTime = loadInteger('bestSessionTime');
let bestDayTime = loadInteger('bestDayTime');

let historyElement;
let feedbackElement;
let feedbacWrongCharacterElement;
let feedbackCharacterElement;
let feedbackCwElement;
let statsElement;
let infoElement;

function setElements() {
    historyElement = document.getElementById('history');
    feedbackElement = document.getElementById('feedback');
    feedbacWrongCharacterElement = document.getElementById('feedback_wrong_character');
    feedbackCharacterElement = document.getElementById('feedback_character');
    feedbackCwElement = document.getElementById('feedback_cw');
    statsElement = document.getElementById('stats');
    infoElement = document.getElementById('info');
}

function onSettingsChange() {
    stop();
    settings.wpm = document.getElementById('settings-wpm').value;
    settings.tone = document.getElementById('settings-tone').value;
    settings.error_tone = document.getElementById('settings-error-tone').value;
    settings.word_length = document.getElementById('settings-word-length').value;
    settings.charset = document.getElementById('settings-charset').value;
    localStorage.setItem('settings', JSON.stringify(settings));
}

function lcwoLessonFromCharset(charset) {
    const s = new Set(charset.toUpperCase());
    let i = 0;
    while (i < lcwoLessons.length) {
        const c = lcwoLessons[i];
        if (s.has(c)) {
            s.delete(c);
        } else {
            break;
        }
        i += 1;
    }
    return s.size === 0 && i > 0 ? i - 1 : 0;
}

function updateLCWOLessonFromCharset() {
    const lcwoLesson = lcwoLessonFromCharset(settings.charset);
    document.getElementById('settings-lcwo-lesson').value = lcwoLesson;
}

// returns true when setA contains setB
function contains(setA, setB) {
    return [...setB].every((x) => setA.has(x));
}

// returns true when setA and setB intersects
function intersects(setA, setB) {
    return [...setB].some((x) => setA.has(x));
}

function updateToggleFromCharset(id, chars) {
    const toggleChars = new Set(chars);
    const selectedChars = new Set(settings.charset.toUpperCase());
    const element = document.getElementById(id);
    if (contains(selectedChars, toggleChars)) {
        element.checked = true;
        element.indeterminate = false;
    } else if (intersects(selectedChars, toggleChars)) {
        element.indeterminate = true;
    } else {
        element.checked = false;
        element.indeterminate = false;
    }
}

function updateTogglesFromCharset() {
    updateToggleFromCharset('settings-charset-latin', latin);
    updateToggleFromCharset('settings-charset-digits', digits);
    updateToggleFromCharset('settings-charset-punct', punct);
}

function onCustomCharsetInput() {
    onSettingsChange();
    updateLCWOLessonFromCharset();
    updateTogglesFromCharset();
}

function onLCWOLessonInput() {
    const lcwoLesson = parseInt(document.getElementById('settings-lcwo-lesson').value, 10) || 0;
    if (lcwoLesson === 0) {
        return;
    }
    document.getElementById('settings-charset').value = lcwoLessons.slice(0, lcwoLesson + 1);
    onSettingsChange();
    updateTogglesFromCharset();
}

function onToggleChars(event, chars) {
    const s = new Set(chars);
    const charsetWithoutChars = [...settings.charset].filter((c) => !s.has(c.toUpperCase())).join('');
    if (event.target.checked) {
        settings.charset = chars + charsetWithoutChars;
    } else {
        settings.charset = charsetWithoutChars;
    }
    document.getElementById('settings-charset').value = settings.charset;
    onSettingsChange();
    updateLCWOLessonFromCharset();
}

function restoreSettings() {
    document.getElementById('settings-wpm').value = settings.wpm;
    document.getElementById('settings-tone').value = settings.tone;
    document.getElementById('settings-error-tone').value = settings.error_tone;
    document.getElementById('settings-word-length').value = settings.word_length;
    document.getElementById('settings-charset').value = settings.charset;
    updateLCWOLessonFromCharset();
    updateTogglesFromCharset();
}

function updateStats() {
    // reset day stats when UTC midnight passes
    const now = new Date();
    const today = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    if (statsUpdated < today) {
        dayCopiedCharacters = 0;
        saveInteger('dayCopiedCharacters', dayCopiedCharacters);
        dayCopiedWords = 0;
        saveInteger('dayCopiedWords', dayCopiedWords);
        dayScore = 0;
        saveInteger('dayScore', dayScore);
        dayTime = 0;
        saveInteger('dayTime', dayTime);
    }
    statsUpdated = now;
    localStorage.setItem('statsUpdated', statsUpdated.toISOString());

    statsElement.innerHTML = `
    <h3>Statistics</h3>
    <table>
        <thead>
            <tr>
                <th></th>
                <th>Time</th>
                <th>Characters</th>
                <th>Words</th>
                <th>Score</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>Current Session</th>
                <td>${sessionTime} s</td>
                <td>${sessionCopiedCharacters}</td>
                <td>${sessionCopiedWords}</td>
                <td>${sessionScore}</td>
            </tr>
            <tr>
                <th>Best Session</th>
                <td>${bestSessionTime} s</td>
                <td>${bestSessionCopiedCharacters}</td>
                <td>${bestSessionCopiedWords}</td>
                <td>${bestSessionScore}</td>
            </tr>
            <tr>
                <th>Current Day</th>
                <td>${dayTime} s</td>
                <td>${dayCopiedCharacters}</td>
                <td>${dayCopiedWords}</td>
                <td>${dayScore}</td>
            </tr>
            <tr>
                <th>Best Day</th>
                <td>${bestDayTime} s</td>
                <td>${bestDayCopiedCharacters}</td>
                <td>${bestDayCopiedWords}</td>
                <td>${bestDayScore}</td>
            </tr>
            <tr>
                <th>Total</th>
                <td>${totalTime} s</td>
                <td>${totalCopiedCharacters}</td>
                <td>${totalCopiedWords}</td>
                <td>${totalScore}</td>
            </tr>
        </tbody>
    </table>

    `;
}

function formatHistoryEntry(entry) {
    let ret = `<span class="meta"><time datetime="${entry.started}">${entry.started}</time>:</span> ${entry.copiedText}`;
    if (entry.mistake) {
        const { expectedCharacter, mistakenCharacter } = entry.mistake;
        ret += `<span class="strike">${mistakenCharacter}</span>${expectedCharacter}`;
    }
    return `<li>${ret}<li>`;
}

function updateHistory() {
    const entries = sessionHistory.slice(-10);
    const formattedEntries = [...entries.map(formatHistoryEntry)];
    historyElement.innerHTML = `<li>${copiedText}</li>${formattedEntries.reverse().join('')}`;
}

function incrementCopiedCharacters(c) {
    copiedText += c;

    // CHARACTERS
    // total
    totalCopiedCharacters += 1;
    saveInteger('totalCopiedCharacters', totalCopiedCharacters);
    // session
    sessionCopiedCharacters += 1;
    saveInteger('sessionCopiedCharacters', sessionCopiedCharacters);
    // day
    dayCopiedCharacters += 1;
    saveInteger('dayCopiedCharacters', dayCopiedCharacters);
    // best session
    if (sessionCopiedCharacters > bestSessionCopiedCharacters) {
        bestSessionCopiedCharacters = sessionCopiedCharacters;
        saveInteger('bestSessionCopiedCharacters', bestSessionCopiedCharacters);
    }
    // best day
    if (dayCopiedCharacters > bestDayCopiedCharacters) {
        bestDayCopiedCharacters = dayCopiedCharacters;
        saveInteger('bestDayCopiedCharacters', bestDayCopiedCharacters);
    }

    // WORDS
    if (c === ' ') {
        // total
        totalCopiedWords += 1;
        saveInteger('totalCopiedWords', totalCopiedWords);
        // session
        sessionCopiedWords += 1;
        saveInteger('sessionCopiedWords', sessionCopiedWords);
        // day
        dayCopiedWords += 1;
        saveInteger('dayCopiedWords', dayCopiedWords);
        // best session
        if (sessionCopiedWords > bestSessionCopiedWords) {
            bestSessionCopiedWords = sessionCopiedWords;
            saveInteger('bestSessionCopiedWords', bestSessionCopiedWords);
        }
        // best day
        if (dayCopiedWords > bestDayCopiedWords) {
            bestDayCopiedWords = dayCopiedWords;
            saveInteger('bestDayCopiedWords', bestDayCopiedWords);
        }
    }

    // SCORE
    const score = sessionCopiedWords + 1;
    // total
    totalScore += score;
    saveInteger('totalScore', totalScore);
    // session
    sessionScore += score;
    saveInteger('sessionScore', sessionScore);
    // day
    dayScore += score;
    saveInteger('dayScore', dayScore);
    // best session
    if (sessionScore > bestSessionScore) {
        bestSessionScore = sessionScore;
        saveInteger('bestSessionScore', bestSessionScore);
    }
    // best day
    if (dayScore > bestDayScore) {
        bestDayScore = dayScore;
        saveInteger('bestDayScore', bestDayScore);
    }

    // TIME
    const now = new Date();
    const elapsedSinceStart = Math.round((now.getTime() - sessionStart.getTime()) / 1000);
    const newElapsed = elapsedSinceStart - sessionTime;
    // total
    totalTime += newElapsed;
    saveInteger('totalTime', totalTime);
    // session
    sessionTime += newElapsed;
    saveInteger('sessionTime', sessionTime);
    // day
    dayTime += newElapsed;
    saveInteger('dayTime', dayTime);
    // best session
    if (sessionTime > bestSessionTime) {
        bestSessionTime = sessionTime;
        saveInteger('bestSessionTime', bestSessionTime);
    }
    // best day
    if (dayTime > bestDayTime) {
        bestDayTime = dayTime;
        saveInteger('bestDayTime', bestDayTime);
    }
}

function onFinished() {
    pushWord();
    m.play();
}

function start() {
    pushWord();
    played.length = 0;
    copiedText = '';
    inSession = true;
    sessionStart = new Date();
    sessionDurationUpdater = setInterval(updateStats, 100);
    sessionCopiedCharacters = 0;
    sessionCopiedWords = 0;
    sessionScore = 0;
    sessionTime = 0;
    m.setWpm(settings.wpm);
    m.setEff(settings.wpm);
    m.setFreq(settings.tone);
    m.onFinished = onFinished;
    m.play();
    feedbackElement.classList.add('success');
    feedbackElement.classList.remove('failure');
    feedbacWrongCharacterElement.innerText = '';
    feedbackCharacterElement.innerText = '';
    feedbackCwElement.innerText = '';
    infoElement.innerText = '';
    feedbackElement.focus();
    updateStats();
    updateHistory();
}

function stop(expected, userInput) {
    if (!inSession) {
        return;
    }

    const session = {
        id: crypto.randomUUID(),
        started: sessionStart.toISOString(),
        finished: new Date().toISOString(),
        copiedText,
        mistake: !expected ? null : {
            expectedCharacter: expected,
            mistakenCharacter: userInput,
        },
        settings,
        copiedCharacters: sessionCopiedCharacters,
        copiedWords: sessionCopiedWords,
        score: sessionScore,
    };
    sessionHistory.push(session);
    // NOTE: in the following scenario, the session from tab B will be lost
    // - open in tab A
    // - open in tab B
    // - play session in tab B
    // - play session in tab A
    localStorage.setItem('history', JSON.stringify(sessionHistory));

    inSession = false;
    m.onFinished = undefined;
    updateStats();
    clearInterval(sessionDurationUpdater);
    sessionDurationUpdater = undefined;
    m.stop();
}

function replayAfterMistake(c) {
    m.onFinished = () => {
        m.onFinished = undefined;
        m.setFreq(settings.tone);
        if (c !== undefined) {
            m.play(` ${c}`);
        }
    };
    m.setFreq(settings.error_tone);
    m.play('T');
}

function stringFromCharacter(c) {
    if (c === undefined) {
        return '-';
    } else if (c === ' ') {
        return 'Space';
    } else {
        return c;
    }
}

document.addEventListener('keydown', (event) => {
    const userInput = event.key.toLowerCase();

    // disable Firefox's quick search when pressing forward slash
    if (userInput === '/') {
        event.preventDefault();
    }

    // hitting space starts the keying
    if (!inSession && userInput === 'enter') {
        start();
    }

    // ignore other inputs when not in session
    if (!inSession) {
        return;
    }

    // stop space from scrolling the page while in session
    if (userInput === ' ') {
        event.preventDefault();
    }

    // stop when user hits Escape key
    if (userInput === 'escape') {
        stop();
    }

    // ignore non-copy user inputs (not in the charset, and not a space)
    if (userInput !== ' ' && settings.charset.toLowerCase().indexOf(userInput) === -1) {
        return;
    }

    // played[nextIndex] is undefined if nextIndex >= played.length
    const expected = played[sessionCopiedCharacters]?.toLowerCase();
    if (userInput === expected) {
        // correct
        incrementCopiedCharacters(expected);
        updateHistory();
    } else {
        // incorrect
        stop(expected, userInput);
        replayAfterMistake(expected);
        feedbackElement.classList.remove('success');
        feedbackElement.classList.add('failure');
        feedbacWrongCharacterElement.innerText = stringFromCharacter(userInput);
    }

    feedbackCharacterElement.innerText = stringFromCharacter(expected);
    feedbackCwElement.innerText = m.alphabet[expected] || '';
});

m.onCharacterPlay = (c) => {
    // skip leading space
    if (played.length === 0 && c.c === ' ') {
        return;
    }

    // add character
    played.push(c.c);

    // detect when user has stopped copying
    if (played.length - copiedText.length > 10) {
        infoElement.innerText = 'Are you still there?';
        stop();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setElements();
    feedbackElement.addEventListener('blur', () => {
        if (inSession) {
            infoElement.innerText = 'Focus lost!';
            stop();
        }
    });
    updateStats();
    updateHistory();
    restoreSettings();
});
