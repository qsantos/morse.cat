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

/** @type {string[]} */
const played = [];
let copiedText = '';
let inSession = false;
/** @type {Date} */
let sessionStart;
/** @type {number} */
let sessionDurationUpdater;

/** Load an integer from the local storage
 *  @param {string} key - The key to load from the local storage
 *  @return {number} - The value loaded and parsed from the local storage
*/
function loadInteger(key) {
    // parseInt may return NaN; we use 0 as the default value instead
    return parseInt(localStorage.getItem(key) || '', 10) || 0;
}

/** Save an integer to the local storage
 *  @param {string} key - The key to use in the local storage
 *  @param {number} value - The value to save
*/
function saveInteger(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/** Load the stats from the local storage
 *  @return { import("./types").Stats } - The stats
*/
function readStats() {
    const json = localStorage.getItem('stats');
    if (json) {
        const stats = JSON.parse(json);
        if (stats) {
            return stats;
        }
    }
    return {
        elapsed: {
            lastSession: 0,
            bestSession: 0,
            currentDay: 0,
            bestDay: 0,
            total: 0,
        },
        copiedCharacters: {
            lastSession: 0,
            bestSession: 0,
            currentDay: 0,
            bestDay: 0,
            total: 0,
        },
        copiedWords: {
            lastSession: 0,
            bestSession: 0,
            currentDay: 0,
            bestDay: 0,
            total: 0,
        },
        score: {
            lastSession: 0,
            bestSession: 0,
            currentDay: 0,
            bestDay: 0,
            total: 0,
        },
    };
}

// stats
let statsUpdated = localStorage.getItem('statsUpdated');
const stats = readStats();

function saveStats() {
    localStorage.setItem('stats', JSON.stringify(stats));
}

/** @type {Element} */
let historyElement;
/** @type {Element} */
let feedbackElement;
/** @type {Element} */
let feedbacWrongCharacterElement;
/** @type {Element} */
let feedbackCharacterElement;
/** @type {Element} */
let feedbackCwElement;
/** @type {Element} */
let statsElement;
/** @type {Element} */
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
        stats.elapsed.currentDay = 0;
        stats.copiedCharacters.currentDay = 0;
        stats.copiedWords.currentDay = 0;
        stats.score.currentDay = 0;
        saveStats();
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
                <th>Last Session</th>
                <td>${stats.elapsed.lastSession} s</td>
                <td>${stats.copiedCharacters.lastSession}</td>
                <td>${stats.copiedWords.lastSession}</td>
                <td>${stats.score.lastSession}</td>
            </tr>
            <tr>
                <th>Best Session</th>
                <td>${stats.elapsed.bestSession} s</td>
                <td>${stats.copiedCharacters.bestSession}</td>
                <td>${stats.copiedWords.bestSession}</td>
                <td>${stats.score.bestSession}</td>
            </tr>
            <tr>
                <th>Current Day</th>
                <td>${stats.elapsed.currentDay} s</td>
                <td>${stats.copiedCharacters.currentDay}</td>
                <td>${stats.copiedWords.currentDay}</td>
                <td>${stats.score.currentDay}</td>
            </tr>
            <tr>
                <th>Best Day</th>
                <td>${stats.elapsed.bestDay} s</td>
                <td>${stats.copiedCharacters.bestDay}</td>
                <td>${stats.copiedWords.bestDay}</td>
                <td>${stats.score.bestDay}</td>
            </tr>
            <tr>
                <th>Total</th>
                <td>${stats.elapsed.total} s</td>
                <td>${stats.copiedCharacters.total}</td>
                <td>${stats.copiedWords.total}</td>
                <td>${stats.score.total}</td>
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

/** Increase a stat by a given amount
 *  @param {import("./types").Stat} stat - The stat to be increased
 *  @param {number} amount - The amount by which the stat should be increased
*/
function increaseStat(stat, amount) {
    stat.total += amount;
    stat.lastSession += amount;
    stat.currentDay += amount;
    stat.bestSession = Math.max(stat.bestSession, stat.lastSession);
    stat.bestDay = Math.max(stat.bestDay, stat.currentDay);
}

function incrementCopiedCharacters(c) {
    copiedText += c;

    const now = new Date();
    const elapsedSinceStart = Math.round((now.getTime() - sessionStart.getTime()) / 1000);
    const newElapsed = elapsedSinceStart - stats.elapsed.lastSession;

    increaseStat(stats.elapsed, newElapsed);
    increaseStat(stats.copiedCharacters, 1);
    if (c === ' ') {
        increaseStat(stats.copiedWords, 1);
    }
    increaseStat(stats.score, stats.copiedWords.lastSession + 1);

    saveStats();
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
    stats.elapsed.lastSession = 0;
    stats.copiedCharacters.lastSession = 0;
    stats.copiedWords.lastSession = 0;
    stats.score.lastSession = 0;
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
        elapsed: stats.elapsed.lastSession,
        copiedCharacters: stats.copiedCharacters.lastSession,
        copiedWords: stats.copiedWords.lastSession,
        score: stats.score.lastSession,
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

function fail(expected, userInput) {
    stop(expected, userInput);
    replayAfterMistake(expected);
    feedbackElement.classList.remove('success');
    feedbackElement.classList.add('failure');
    feedbacWrongCharacterElement.innerText = stringFromCharacter(userInput);
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
    const expected = played[stats.copiedCharacters.lastSession]?.toLowerCase();
    if (userInput === expected) {
        // correct
        incrementCopiedCharacters(expected);
        updateHistory();
    } else {
        // incorrect
        fail(expected, userInput);
    }

    feedbackCharacterElement.innerText = stringFromCharacter(expected);
    feedbackCwElement.innerText = m.alphabet[expected] || '';
});

m.onCharacterPlay = (c) => {
    if (!inSession) {
        return;
    }

    // skip leading space
    if (played.length === 0 && c.c === ' ') {
        return;
    }

    // add character
    played.push(c.c);

    // detect when user has stopped copying
    if (played.length - copiedText.length > 3) {
        fail();
        infoElement.innerText = 'Too slow!';
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
