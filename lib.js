const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // A-Z
const digits = '0123456789'; // 0-9
const punct = '.,:?\'-/()"=+×@';
const lcwoLessons = 'KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X';
const settings = JSON.parse(localStorage.getItem('settings')) || {
    wpm: 20,
    tone: 600,
    error_tone: 200,
    word_length: 5,
    charset: lcwoLessons,
};
const history = JSON.parse(localStorage.getItem('history')) || [];

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

// stats
let statsUpdated = localStorage.getItem('statsUpdated');
// CHARACTERS
let totalCopiedCharacters = localStorage.getItem('totalCopiedCharacters') ^ 0;
let sessionCopiedCharacters = localStorage.getItem('sessionCopiedCharacters') ^ 0;
let dayCopiedCharacters = localStorage.getItem('dayCopiedCharacters') ^ 0;
let bestSessionCopiedCharacters = localStorage.getItem('bestSessionCopiedCharacters') ^ 0;
let bestDayCopiedCharacters = localStorage.getItem('bestDayCopiedCharacters') ^ 0;
// WORDS
let totalCopiedWords = localStorage.getItem('totalCopiedWords') ^ 0;
let sessionCopiedWords = localStorage.getItem('sessionCopiedWords') ^ 0;
let dayCopiedWords = localStorage.getItem('dayCopiedWords') ^ 0;
let bestSessionCopiedWords = localStorage.getItem('bestSessionCopiedWords') ^ 0;
let bestDayCopiedWords = localStorage.getItem('bestDayCopiedWords') ^ 0;
// SCORE
let totalScore = localStorage.getItem('totalScore') ^ 0;
let sessionScore = localStorage.getItem('sessionScore') ^ 0;
let dayScore = localStorage.getItem('dayScore') ^ 0;
let bestSessionScore = localStorage.getItem('bestSessionScore') ^ 0;
let bestDayScore = localStorage.getItem('bestDayScore') ^ 0;
// TIME
let totalTime = localStorage.getItem('totalTime') ^ 0;
let sessionTime = localStorage.getItem('sessionTime') ^ 0;
let dayTime = localStorage.getItem('dayTime') ^ 0;
let bestSessionTime = localStorage.getItem('bestSessionTime') ^ 0;
let bestDayTime = localStorage.getItem('bestDayTime') ^ 0;

let historyElement;
let feedbackEleemnt;
let feedbacWrongCharacterElement;
let feedbackCharacterElement;
let feedbackCwElement;
let statsElement;
let infoElement;

function setElements() {
    historyElement = document.getElementById('history');
    feedbackEleemnt = document.getElementById('feedback');
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
    return s.size == 0 && i > 0 ? i - 1 : 0;
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
    const lcwoLesson = document.getElementById('settings-lcwo-lesson').value ^ 0;
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
        localStorage.setItem('dayCopiedCharacters', dayCopiedCharacters);
        dayCopiedWords = 0;
        localStorage.setItem('dayCopiedWOrds', dayCopiedWords);
        dayScore = 0;
        localStorage.setItem('dayScore', dayScore);
        dayTime = 0;
        localStorage.setItem('dayTime', dayTime);
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
    const entries = history.slice(-10);
    const formattedEntries = [...entries.map(formatHistoryEntry)];
    historyElement.innerHTML = `<li>${copiedText}</li>${formattedEntries.reverse().join('')}`;
}

function incrementCopiedCharacters(c) {
    copiedText += c;

    // CHARACTERS
    // total
    totalCopiedCharacters += 1;
    localStorage.setItem('totalCopiedCharacters', totalCopiedCharacters);
    // session
    sessionCopiedCharacters += 1;
    localStorage.setItem('sessionCopiedCharacters', sessionCopiedCharacters);
    // day
    dayCopiedCharacters += 1;
    localStorage.setItem('dayCopiedCharacters', dayCopiedCharacters);
    // best session
    if (sessionCopiedCharacters > bestSessionCopiedCharacters) {
        bestSessionCopiedCharacters = sessionCopiedCharacters;
        localStorage.setItem('bestSessionCopiedCharacters', bestSessionCopiedCharacters);
    }
    // best day
    if (dayCopiedCharacters > bestDayCopiedCharacters) {
        bestDayCopiedCharacters = dayCopiedCharacters;
        localStorage.setItem('bestDayCopiedCharacters', bestDayCopiedCharacters);
    }

    // WORDS
    if (c == ' ') {
        // total
        totalCopiedWords += 1;
        localStorage.setItem('totalCopiedWords', totalCopiedWords);
        // session
        sessionCopiedWords += 1;
        localStorage.setItem('sessionCopiedWords', sessionCopiedWords);
        // day
        dayCopiedWords += 1;
        localStorage.setItem('dayCopiedWords', dayCopiedWords);
        // best session
        if (sessionCopiedWords > bestSessionCopiedWords) {
            bestSessionCopiedWords = sessionCopiedWords;
            localStorage.setItem('bestSessionCopiedWords', bestSessionCopiedWords);
        }
        // best day
        if (dayCopiedWords > bestDayCopiedWords) {
            bestDayCopiedWords = dayCopiedWords;
            localStorage.setItem('bestDayCopiedWords', bestDayCopiedWords);
        }
    }

    // SCORE
    const score = sessionCopiedWords + 1;
    // total
    totalScore += score;
    localStorage.setItem('totalScore', totalScore);
    // session
    sessionScore += score;
    localStorage.setItem('sessionScore', sessionScore);
    // day
    dayScore += score;
    localStorage.setItem('dayScore', dayScore);
    // best session
    if (sessionScore > bestSessionScore) {
        bestSessionScore = sessionScore;
        localStorage.setItem('bestSessionScore', bestSessionScore);
    }
    // best day
    if (dayScore > bestDayScore) {
        bestDayScore = dayScore;
        localStorage.setItem('bestDayScore', bestDayScore);
    }

    // TIME
    const now = new Date();
    const elapsedSinceStart = Math.round((now.getTime() - sessionStart.getTime()) / 1000);
    const newElapsed = elapsedSinceStart - sessionTime;
    // total
    totalTime += newElapsed;
    localStorage.setItem('totalTime', totalTime);
    // session
    sessionTime += newElapsed;
    localStorage.setItem('sessionTime', sessionTime);
    // day
    dayTime += newElapsed;
    localStorage.setItem('dayTime', dayTime);
    // best session
    if (sessionTime > bestSessionTime) {
        bestSessionTime = sessionTime;
        localStorage.setItem('bestSessionTime', bestSessionTime);
    }
    // best day
    if (dayTime > bestDayTime) {
        bestDayTime = dayTime;
        localStorage.setItem('bestDayTime', bestDayTime);
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
    feedbackEleemnt.classList.add('success');
    feedbackEleemnt.classList.remove('failure');
    feedbacWrongCharacterElement.innerText = '';
    feedbackCharacterElement.innerText = '';
    feedbackCwElement.innerText = '';
    infoElement.innerText = '';
    feedbackEleemnt.focus();
    updateStats();
    updateHistory();
}

function stop(expected, userInput) {
    if (!inSession) {
        return;
    }

    const session = {
        id: self.crypto.randomUUID(),
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
    history.push(session);
    // NOTE: in the following scenario, the session from tab B will be lost
    // - open in tab A
    // - open in tab B
    // - play session in tab B
    // - play session in tab A
    localStorage.setItem('history', JSON.stringify(history));

    inSession = false;
    m.onFinished = undefined;
    updateStats();
    clearInterval(sessionDurationUpdater);
    sessionDurationUpdater = undefined;
    m.stop();
}

function replayAfterMistake(c) {
    m.onFinished = function() {
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
    } else if (c == ' ') {
        return 'Space';
    } else {
        return c;
    }
}

document.addEventListener('keydown', (event) => {
    const userInput = event.key.toLowerCase();

    // disable Firefox's quick search when pressing forward slash
    if (userInput == '/') {
        event.preventDefault();
    }

    // hitting space starts the keying
    if (!inSession && userInput == 'enter') {
        start();
    }

    // ignore other inputs when not in session
    if (!inSession) {
        return;
    }

    // stop space from scrolling the page while in session
    if (userInput == ' ') {
        event.preventDefault();
    }

    // stop when user hits Escape key
    if (userInput == 'escape') {
        stop();
    }

    // ignore non-copy user inputs (not in the charset, and not a space)
    if (userInput != ' ' && settings.charset.toLowerCase().indexOf(userInput) == -1) {
        return;
    }

    // played[nextIndex] is undefined if nextIndex >= played.length
    const expected = played[sessionCopiedCharacters]?.toLowerCase();
    if (userInput == expected) {
        // correct
        incrementCopiedCharacters(expected);
        updateHistory();
    } else {
        // incorrect
        stop(expected, userInput);
        replayAfterMistake(expected);
        feedbackEleemnt.classList.remove('success');
        feedbackEleemnt.classList.add('failure');
        feedbacWrongCharacterElement.innerText = stringFromCharacter(userInput);
    }

    feedbackCharacterElement.innerText = stringFromCharacter(expected);
    feedbackCwElement.innerText = m.alphabet[expected] || '';
});

m.onCharacterPlay = function(c) {
    // skip leading space
    if (played.length == 0 && c.c == ' ') {
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
    feedbackEleemnt.addEventListener('blur', () => {
        infoElement.innerText = 'Focus lost!';
        stop();
    });
    updateStats();
    updateHistory();
    restoreSettings();
});
