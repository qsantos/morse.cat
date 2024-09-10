const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // A-Z
const digits = '0123456789'; // 0-9
const punct = '.,:?\'-/()"=+×@';
const lcwoLessons = 'KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X';

/** @type {IDBDatabase | null} */
let db = null;
/** @param {() => void} callback */
function prepareDB(callback) {
    const request = indexedDB.open("morse.cat", 1);
    request.onerror = () => {
        alert("Failed to open IndexedDB; histroy won't be saved");
    }
    request.onupgradeneeded = () => {
        const db = request.result;
        const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionsStore.createIndex('started', 'started');
        db.createObjectStore('characters', { keyPath: 'id' });
    };
    request.onsuccess = () => {
        db = request.result;
        callback();
    }
}

/**
 * @param {import("./types").HistoryEntry} session
*/
function saveSession(session) {
    if (!db) {
        return;
    }
    const transaction = db.transaction(['sessions'], 'readwrite');
    const objectStore = transaction.objectStore('sessions');
    objectStore.add(session);
}

/**
 * @param {import("./types").TransmittedCharacter} character
*/
function saveCharacter(character) {
    if (!db) {
        return;
    }
    const transaction = db.transaction(['characters'], 'readwrite');
    const objectStore = transaction.objectStore('characters');
    if (!character.id) {
        character.id = crypto.randomUUID();
    }
    objectStore.add(character);
}

/**
 * @param {number} count
 * @param {(sessions: import("./types").HistoryEntry[]) => void} callback
*/
function getLastSessions(count, callback) {
    if (!db) {
        return;
    }
    // IndexedBD must be a joke
    const transaction = db.transaction('sessions');
    const objectStore = transaction.objectStore('sessions');
    const index = objectStore.index('started');
    const request = index.openCursor(null, 'prev');
    /** @type{import("./types").HistoryEntry[]} */
    const sessions = [];
    request.onsuccess = () => {
        const result = request.result;
        if (result) {
            sessions.push(result.value);
        }
        if (result && sessions.length < count) {
            result.continue();
        } else {
            sessions.reverse();
            callback(sessions);
        }
    }
}

/** @type{import("./types").Settings} */
const settings = (() => {
    try {
        const settings = JSON.parse(localStorage.getItem('settings') || '');
        if (settings.hasOwnProperty("word_length")) {
            settings.min_word_length = settings.word_length;
            settings.max_word_length = settings.word_length;
            delete settings["word_length"];
        }
        return settings;
    } catch (e) {
        return {
            wpm: 20,
            tone: 600,
            error_tone: 200,
            min_word_length: 5,
            max_word_length: 5,
            charset: lcwoLessons,
        };
    }
})();

// @ts-ignore
const cwPlayer = new jscw();
cwPlayer.q = 13;

function pushWord() {
    const word_length = randint(settings.min_word_length, settings.max_word_length);
    const word = Array.from(
        { length: word_length },
        () => settings.charset[Math.floor(Math.random() * settings.charset.length)],
    ).join('');
    cwPlayer.setText(` ${word}`);
}

/** @type {import("./types").SentCharacter[]} */
const played = [];
let copiedText = '';
let inSession = false;
let sessionId = '';
/** @type {Date} */
let sessionStart;
/** @type {number} */
let sessionDurationUpdater = 0;

/** Load the stats from the local storage
 *  @return { import("./types").Stats } - The stats
*/
function readStats() {
    const json = localStorage.getItem('stats');
    if (json) {
        const stats = JSON.parse(json);
        stats.updated = new Date(stats.updated);
        return stats;
    }
    return {
        updated: new Date(),
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
const stats = readStats();

/** @type {HTMLDivElement} */
let settingsElement;
/** @type {HTMLElement} */
let acknowledgementsElement;
/** @type {HTMLElement} */
let currentSessionElement;
/** @type {HTMLElement} */
let historyElement;
/** @type {HTMLElement} */
let statisticsElement;
/** @type {HTMLElement} */
let infoElement;

const translations = {
    en: {
        languageName: 'English',
        pageTitle: 'Sharpen your claws and learn Morse code!',
        'key.space': 'Space',
        'stats.title': 'Statistics',
        'stats.elapsed': 'Time',
        'stats.copiedCharacters': 'Characters',
        'stats.copiedWords': 'Words',
        'stats.score': 'Score',
        'stats.lastSession': 'Last Session',
        'stats.bestSession': 'Best Session',
        'stats.currentDay': 'Today',
        'stats.bestDay': 'Best Day',
        'stats.total': 'Total',
        'history.startSession': 'Press Return to start',
        'start': 'Start',
        'settings.title': 'Settings',
        'settings.speed.title': 'Speed',
        'settings.speed.unit': 'WPM',
        'settings.speed.details': 'Words Per Minute',
        'settings.tone.title': 'Tone',
        'settings.tone.unit': 'Hz',
        'settings.tone.details': 'Hertz',
        'settings.errorTone.title': 'Error Tone',
        'settings.errorTone.unit': 'Hz',
        'settings.errorTone.details': 'Hertz',
        'settings.minWordLength.title': 'Min. Word Length',
        'settings.maxWordLength.title': 'Max. Word Length',
        'settings.wordLength.unit': 'chars.',
        'settings.wordLength.details': 'characters',
        'settings.lcwo.title': '<a href="https://lcwo.net/" title="Learn CW Online">LCWO</A> Lesson',
        'settings.charset.title': 'Customize Charset',
        'settings.export': 'Export Data',
        'settings.import': 'Import Data',
        'settings.delete': 'Delete Data',
        'settings.delete.warning': 'Are you sure you want to delete all data? You will lose your practice history, as well as the statistics.',
        'settings.delete.cancel': 'Close',
        'acknowledgements.title': 'Acknowledgements',
        'acknowledgements.mit-license': 'MIT License',
        'acknowledgements.cc0-license': 'CC0 License',
        'acknowledgements.cc-by-license': 'CC-BY License',
        'acknowledgements.jscwlib': 'JavaScript library for Morse Code',
        'acknowledgements.cat-icon': 'Cat icon',
        'info.tooSlow': 'Too slow!',
        'info.lostFocus': 'Focus lost!',
    },
    fr: {
        languageName: 'French',
        pageTitle: 'Aiguisez vos griffes et apprenez le code Morse !',
        'key.space': 'Espace',
        'stats.title': 'Statistiques',
        'stats.elapsed': 'Temps',
        'stats.copiedCharacters': 'Caractères',
        'stats.copiedWords': 'Mots',
        'stats.score': 'Score',
        'stats.lastSession': 'Dernière Session',
        'stats.bestSession': 'Meilleure Session',
        'stats.currentDay': "Aujourd'hui",
        'stats.bestDay': 'Meilleur jour',
        'stats.total': 'Total',
        'history.startSession': 'Appuyez sur Entrée pour commencer',
        'start': 'Démarrer',
        'settings.title': 'Paramètres',
        'settings.speed.title': 'Vitesse',
        'settings.speed.unit': 'MPM',
        'settings.speed.details': 'Mots Par Minute',
        'settings.tone.title': 'Ton',
        'settings.tone.unit': 'Hz',
        'settings.tone.details': 'Hertz',
        'settings.errorTone.title': "Ton d'erreur",
        'settings.errorTone.unit': 'Hz',
        'settings.errorTone.details': 'Hertz',
        'settings.minWordLength.title': 'Longueur min. des mots',
        'settings.maxWordLength.title': 'Longueur max. des mots',
        'settings.wordLength.unit': 'car.',
        'settings.wordLength.details': 'caractères',
        'settings.lcwo.title': 'Leçon <a href="https://lcwo.net/" title="Learn CW Online">LCWO</A>',
        'settings.charset.title': 'Choisir les caractères',
        'settings.export': 'Exporter les données',
        'settings.import': 'Importer les données',
        'settings.delete': 'Supprimer les données',
        'settings.delete.warning': 'Êtes-vous sûr de vouloir supprimer toutes les données ? Vous perdrez votre historique de pratique ainsi que les statistiques.',
        'settings.delete.cancel': 'Fermer',
        'acknowledgements.title': 'Remerciements',
        'acknowledgements.mit-license': 'Licence MIT',
        'acknowledgements.cc0-license': 'Licence CC0',
        'acknowledgements.cc-by-license': 'Licence CC-BY',
        'acknowledgements.jscwlib': 'Bibliothèque JavaScript pour le code Morse',
        'acknowledgements.cat-icon': 'Icône de chat',
        'info.tooSlow': 'Trop lent !',
        'info.lostFocus': 'Focus perdu !',
    },
    ja: {
        languageName: '日本語',
        pageTitle: '爪とぎしてモールス信号を学びましょう！',
        'key.space': '空白',
        'stats.title': '統計',
        'stats.elapsed': '時間',
        'stats.copiedCharacters': '文字数',
        'stats.copiedWords': '語数',
        'stats.score': 'スコア',
        'stats.lastSession': '前セッション',
        'stats.bestSession': 'ベストセッション',
        'stats.currentDay': '今日',
        'stats.bestDay': 'ベスト日',
        'stats.total': '総数',
        'history.startSession': '開始するには、リターンキーを押してください。',
        'start': '開始する',
        'settings.title': '設定',
        'settings.speed.title': '速度',
        'settings.speed.unit': 'WPM',
        'settings.speed.details': '一分ずつ語数 (Words Per Minute)',
        'settings.tone.title': 'トーン',
        'settings.tone.unit': 'Hz',
        'settings.tone.details': 'ヘルツ',
        'settings.errorTone.title': 'エラートーン',
        'settings.errorTone.unit': 'Hz',
        'settings.errorTone.details': 'ヘルツ',
        'settings.minWordLength.title': '最小語長',
        'settings.maxWordLength.title': '最大語長',
        'settings.wordLength.unit': '字',
        'settings.wordLength.details': '言葉ずつの文字数',
        'settings.lcwo.title': '<a href="https://lcwo.net/" title="Learn CW Online">LCWO</A> レッスン',
        'settings.charset.title': '文字セット',
        'settings.export': 'データをエクスポートする',
        'settings.import': 'データをエクスポートする',
        'settings.delete': 'データを削除する',
        'settings.delete.warning': 'すべてのデータを削除してもよろしいですか？ 練習履歴および統計情報が失われます。',
        'settings.delete.cancel': '閉じる',
        'acknowledgements.title': '謝辞',
        'acknowledgements.mit-license': 'MIT ライセンス',
        'acknowledgements.cc0-license': 'CC0 ライセンス',
        'acknowledgements.cc-by-license': 'CC-BY ライセンス',
        'acknowledgements.jscwlib': 'モールス信号用JavaScriptライブラリ',
        'acknowledgements.cat-icon': '猫アイコン',
        'info.tooSlow': '遅すぎます！',
        'info.lostFocus': 'フォーカスが外れました！',
    },
    es: {
        languageName: 'Español',
        pageTitle: '¡Afilen sus garras y aprendan el código Morse!',
        'key.space': 'Espacio',
        'stats.title': 'Estadísticas',
        'stats.elapsed': 'Tiempo',
        'stats.copiedCharacters': 'Caracteres',
        'stats.copiedWords': 'Palabras',
        'stats.score': 'Puntuación',
        'stats.lastSession': 'Sesión anterior',
        'stats.bestSession': 'Mejor sesión',
        'stats.currentDay': 'Hoy',
        'stats.bestDay': 'Mejor día',
        'stats.total': 'Total',
        'history.startSession': 'Presione Return para empezar',
        'start': 'Iniciar',
        'settings.title': 'Configuración',
        'settings.speed.title': 'Velocidad',
        'settings.speed.unit': 'PPM',
        'settings.speed.details': 'Palabras Per Minuto',
        'settings.tone.title': 'Tono',
        'settings.tone.unit': 'Hz',
        'settings.tone.details': 'Hertz',
        'settings.errorTone.title': 'Tono de error',
        'settings.errorTone.unit': 'Hz',
        'settings.errorTone.details': 'Hertz',
        'settings.minWordLength.title': 'Longitud mín. de las palabras',
        'settings.maxWordLength.title': 'Longitud máx. de las palabras',
        'settings.wordLength.unit': 'car.',
        'settings.wordLength.details': 'caracteres',
        'settings.lcwo.title': 'Leccíon <a href="https://lcwo.net/" title="Learn CW Online">LCWO</A>',
        'settings.charset.title': 'Seleccionar los caracteres',
        'settings.export': 'Exportar los datos',
        'settings.import': 'Exportar los datos',
        'settings.delete': 'Eliminar los datos',
        'settings.delete.warning': '¿Estás seguro de que deseas eliminar todos los datos? Perderás tu historial de práctica, así como las estadísticas.',
        'settings.delete.cancel': 'Cerrar',
        'acknowledgements.title': 'Agradecimientos',
        'acknowledgements.mit-license': 'Licencia MIT',
        'acknowledgements.cc0-license': 'Licencia CC0',
        'acknowledgements.cc-by-license': 'Licencia CC-BY',
        'acknowledgements.jscwlib': 'Biblioteca JavaScript para código Morse',
        'acknowledgements.cat-icon': 'Ícono de gato',
        'info.tooSlow': '¡Demasiado lento!',
        'info.lostFocus': '¡Se perdió el foco!',
    },
    ca: {
        languageName: 'Català',
        pageTitle: 'Esmola les urpes i aprèn codi Morse!',
        'key.space': 'Espai',
        'stats.title': 'Estadístiques',
        'stats.elapsed': 'Temps',
        'stats.copiedCharacters': 'Caràcters',
        'stats.copiedWords': 'Paraules',
        'stats.score': 'Puntuació',
        'stats.lastSession': 'Sessió anterior',
        'stats.bestSession': 'Millor sesió',
        'stats.currentDay': 'Avui',
        'stats.bestDay': 'Millor dia',
        'stats.total': 'Total',
        'history.startSession': 'Premeu Return per començar',
        'start': 'Iniciar',
        'settings.title': 'Configuració',
        'settings.speed.title': 'Velocitat',
        'settings.speed.unit': 'PPM',
        'settings.speed.details': 'Paraules Per Minut',
        'settings.tone.title': 'To',
        'settings.tone.unit': 'Hz',
        'settings.tone.details': 'Hertz',
        'settings.errorTone.title': "To d'error",
        'settings.errorTone.unit': 'Hz',
        'settings.errorTone.details': 'Hertz',
        'settings.minWordLength.title': 'Mida mín. de les paraules',
        'settings.maxWordLength.title': 'Mida màx. de les paraules',
        'settings.wordLength.unit': 'car.',
        'settings.wordLength.details': 'caràcters',
        'settings.lcwo.title': 'Lliçó <a href="https://lcwo.net/" title="Learn CW Online">LCWO</A>',
        'settings.charset.title': 'Seleccionar els caràcters',
        'settings.export': 'Exportar les dades',
        'settings.import': 'Exportar les dades',
        'settings.delete': 'Eliminar les dades',
        'settings.delete.warning': 'Estàs segur que vols eliminar totes les dades? Perdràs l\'historial de pràctica i també les estadístiques.',
        'settings.delete.cancel': 'Tancar',
        'acknowledgements.title': 'Agraïments',
        'acknowledgements.mit-license': 'Llicència MIT',
        'acknowledgements.cc0-license': 'Llicència CC0',
        'acknowledgements.cc-by-license': 'Llicència CC-BY',
        'acknowledgements.jscwlib': 'Biblioteca JavaScript per al codi Morse',
        'acknowledgements.cat-icon': 'Icona de gat',
        'info.tooSlow': 'Massa lent!',
        'info.lostFocus': "S'ha perdut el focus!",
    },
};

/** @type {keyof typeof translations} */
let activeLanguage = 'en';

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

/** Provide a translation string for the given key
 *  @param {keyof typeof translations.en} key - The translation key
 *  @return {string} - The translated string
*/
function t(key) {
    const translated = translations[activeLanguage][key];
    if (translated) {
        return translated;
    } else {
        return key;
    }
}

/** Get an HTML element by id and throw if it does not exist
 *  @template T
 *  @param {string} id - The element's id
 *  @param {new() => T} type - The type of HTML ELement
 *  @return {T} - The element
*/
function getElement(id, type) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Expected HTML element with id ${id} but none found`);
    }
    if (!(element instanceof type)) {
        throw new Error(`Expected ${type.name} with id ${id} but found ${element} instead`);
    }
    return element;
}

function setElements() {
    settingsElement = getElement('settings', HTMLDivElement);
    acknowledgementsElement = getElement('acknowledgements', HTMLElement);
    currentSessionElement = getElement('current-session', HTMLElement);
    historyElement = getElement('history', HTMLElement);
    statisticsElement = getElement('statistics', HTMLElement);
    infoElement = getElement('info', HTMLElement);
}

function onSettingsChange() {
    // eslint-disable-next-line no-use-before-define
    stopSession();
    settings.wpm = parseFloat(getElement('settings-wpm', HTMLInputElement).value);
    settings.tone = parseFloat(getElement('settings-tone', HTMLInputElement).value);
    settings.error_tone = parseFloat(getElement('settings-error-tone', HTMLInputElement).value);
    settings.min_word_length = parseInt(getElement('settings-word-length-min', HTMLInputElement).value, 10);
    settings.max_word_length = parseInt(getElement('settings-word-length-max', HTMLInputElement).value, 10);
    settings.charset = getElement('settings-charset', HTMLTextAreaElement).value;
    localStorage.setItem('settings', JSON.stringify(settings));
}

/** Update the current LCWO lesson depending on the characters in the charset
 *  @param {string} charset - The current charset
*/
function lcwoLessonFromCharset(charset) {
    const s = new Set(charset.toUpperCase());
    let i = 0;
    while (i < lcwoLessons.length) {
        const c = lcwoLessons[i];
        if (c !== undefined && s.has(c)) {
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
    getElement('settings-lcwo-lesson', HTMLSelectElement).value = lcwoLesson.toString();
}

/** Returns true when the first set contains the second
 *  @template T
 *  @param {Set<T>} setA - First set
 *  @param {Set<T>} setB - Second set
 *  @return {boolean} - Whether the first set contains the second
*/
function contains(setA, setB) {
    return [...setB].every((x) => setA.has(x));
}

/** Returns true when the sets intersects
 *  @template T
 *  @param {Set<T>} setA - First set
 *  @param {Set<T>} setB - Second set
 *  @return {boolean} - Whether the sets intersect
*/
function intersects(setA, setB) {
    return [...setB].some((x) => setA.has(x));
}

/** Update the status of a toggle depending on the characters included in the charset
 *  @param {string} id - The element's id
 *  @param {string} chars - The characters represented by the toggle
*/
function updateToggleFromCharset(id, chars) {
    const toggleChars = new Set(chars);
    const selectedChars = new Set(settings.charset.toUpperCase());
    const element = getElement(id, HTMLInputElement);
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
    const lcwoLesson = parseInt(getElement('settings-lcwo-lesson', HTMLSelectElement).value, 10) || 0;
    if (lcwoLesson === 0) {
        return;
    }
    getElement('settings-charset', HTMLTextAreaElement).value = lcwoLessons.slice(0, lcwoLesson + 1);
    onSettingsChange();
    updateTogglesFromCharset();
}

/** Update the status of a toggle depending on the characters included in the charset
 *  @param {InputEvent} event - The event that changed the state of the toggle
 *  @param {string} chars - The characters represented by the toggle
*/
function onToggleChars(event, chars) {
    const s = new Set(chars);
    const charsetWithoutChars = [...settings.charset].filter((c) => !s.has(c.toUpperCase())).join('');
    const { target } = event;
    if (!target || !(target instanceof HTMLInputElement)) {
        throw new Error('Event does not contain the expected target');
    }
    if (target.checked) {
        settings.charset = chars + charsetWithoutChars;
    } else {
        settings.charset = charsetWithoutChars;
    }
    getElement('settings-charset', HTMLTextAreaElement).value = settings.charset;
    onSettingsChange();
    updateLCWOLessonFromCharset();
}

function restoreSettings() {
    getElement('settings-wpm', HTMLInputElement).value = settings.wpm.toString();
    getElement('settings-tone', HTMLInputElement).value = settings.tone.toString();
    getElement('settings-error-tone', HTMLInputElement).value = settings.error_tone.toString();
    getElement('settings-word-length-min', HTMLInputElement).value = settings.min_word_length.toString();
    getElement('settings-word-length-max', HTMLInputElement).value = settings.max_word_length.toString();
    getElement('settings-charset', HTMLTextAreaElement).value = settings.charset;
    updateLCWOLessonFromCharset();
    updateTogglesFromCharset();
}

function renderStatistics() {
    const lang = activeLanguage;
    statisticsElement.innerHTML = `
    <h3>${t('stats.title')}</h3>
    <table class="table">
        <thead>
            <tr>
                <th></th>
                <th scope="col">${t('stats.elapsed')}</th>
                <th scope="col">${t('stats.copiedCharacters')}</th>
                <th scope="col">${t('stats.copiedWords')}</th>
                <th scope="col">${t('stats.score')}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th scope="row">${t('stats.lastSession')}</th>
                <td>${stats.elapsed.lastSession.toLocaleString(lang)} s</td>
                <td>${stats.copiedCharacters.lastSession.toLocaleString(lang)}</td>
                <td>${stats.copiedWords.lastSession.toLocaleString(lang)}</td>
                <td>${stats.score.lastSession.toLocaleString(lang)}</td>
            </tr>
            <tr>
                <th scope="row">${t('stats.bestSession')}</th>
                <td>${stats.elapsed.bestSession.toLocaleString(lang)} s</td>
                <td>${stats.copiedCharacters.bestSession.toLocaleString(lang)}</td>
                <td>${stats.copiedWords.bestSession.toLocaleString(lang)}</td>
                <td>${stats.score.bestSession.toLocaleString(lang)}</td>
            </tr>
            <tr>
                <th scope="row">${t('stats.currentDay')}</th>
                <td>${stats.elapsed.currentDay.toLocaleString(lang)} s</td>
                <td>${stats.copiedCharacters.currentDay.toLocaleString(lang)}</td>
                <td>${stats.copiedWords.currentDay.toLocaleString(lang)}</td>
                <td>${stats.score.currentDay.toLocaleString(lang)}</td>
            </tr>
            <tr>
                <th scope="row">${t('stats.bestDay')}</th>
                <td>${stats.elapsed.bestDay.toLocaleString(lang)} s</td>
                <td>${stats.copiedCharacters.bestDay.toLocaleString(lang)}</td>
                <td>${stats.copiedWords.bestDay.toLocaleString(lang)}</td>
                <td>${stats.score.bestDay.toLocaleString(lang)}</td>
            </tr>
            <tr>
                <th scope="row">${t('stats.total')}</th>
                <td>${stats.elapsed.total.toLocaleString(lang)} s</td>
                <td>${stats.copiedCharacters.total.toLocaleString(lang)}</td>
                <td>${stats.copiedWords.total.toLocaleString(lang)}</td>
                <td>${stats.score.total.toLocaleString(lang)}</td>
            </tr>
        </tbody>
    </table>
    `;
}

/** Format the current session
 *  @return {string} - The formatted current session
*/
function formatCurrentSession() {
    let ret;
    if (inSession) {
        const started = sessionStart.toISOString();
        ret = `<span class="meta active"><time datetime="${started}">${started}</time>:</span> ${copiedText}…`;
    } else {
        ret = t('history.startSession');
    }
    return `<li>${ret}<li>`;
}

/** Format an history entry
 *  @param {import("./types").HistoryEntry} entry - The entry to format
 *  @return {string} - The formatted entry
*/
function formatHistoryEntry(entry) {
    let ret = `<span class="meta"><time datetime="${entry.started}">${entry.started}</time>:</span> ${entry.copiedText}`;
    if (entry.mistake) {
        const { expectedCharacter, mistakenCharacter } = entry.mistake;
        ret += `<span class="strike">${mistakenCharacter}</span>${expectedCharacter}`;
    }
    return `<li>${ret}<li>`;
}

function renderHistory() {
    currentSessionElement.innerHTML = formatCurrentSession();
    getLastSessions(10, (sessions) => {
        const formattedEntries = [...sessions.map(formatHistoryEntry)];
        historyElement.innerHTML = formattedEntries.reverse().join('');
    });
}

function renderSettings() {
    settingsElement.innerHTML = `
    <div class="offcanvas-header">
        <h3 class="offcanvas-title">${t('settings.title')}</h3>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body">
        <div class="row mb-3">
            <label class="col-form-label col-sm-5" for="settings-wpm">${t('settings.speed.title')}</label>
            <div class="col-sm-5">
                <input class="form-control" id="settings-wpm" oninput="onSettingsChange()" type="number" value="20" min="1" step="0.5" />
            </div>
            <abbr class="col-sm-2" title="${t('settings.speed.details')}">${t('settings.speed.unit')}</abbr>
        </div>
        <div class="row mb-3">
            <label class="col-form-label col-sm-5" for="settings-tone">${t('settings.tone.title')}</label>
            <div class="col-sm-5">
                <input class="form-control" id="settings-tone" oninput="onSettingsChange()" type="number" value="600" min="10" step="10" />
            </div>
            <abbr class="col-sm-2" title="${t('settings.tone.details')}">${t('settings.tone.unit')}</abbr>
        </div>
        <div class="row mb-3">
            <label class="col-form-label col-sm-5" for="settings-error-tone">${t('settings.errorTone.title')}</label>
            <div class="col-sm-5">
                <input class="form-control" id="settings-error-tone" oninput="onSettingsChange()" type="number" value="200" min="10" step="10" />
            </div>
            <abbr class="col-sm-2" title="${t('settings.errorTone.details')}">${t('settings.errorTone.unit')}</abbr>
        </div>
        <div class="row mb-3">
            <label class="col-form-label col-sm-5" for="settings-word-length-min">${t('settings.minWordLength.title')}</label>
            <div class="col-sm-5">
                <input class="form-control" id="settings-word-length-min" oninput="onSettingsChange()" type="number" value="5" min="1" />
            </div>
            <abbr class="col-sm-2" title="${t('settings.wordLength.details')}">${t('settings.wordLength.unit')}</abbr>
        </div>
        <div class="row mb-3">
            <label class="col-form-label col-sm-5" for="settings-word-length-max">${t('settings.maxWordLength.title')}</label>
            <div class="col-sm-5">
                <input class="form-control" id="settings-word-length-max" oninput="onSettingsChange()" type="number" value="5" min="1" />
            </div>
            <abbr class="col-sm-2" title="${t('settings.wordLength.details')}">${t('settings.wordLength.unit')}</abbr>
        </div>
        <div class="row mb-3">
            <label class="col-form-label col-sm-5" for="settings-lcwo-lesson">${t('settings.lcwo.title')}</label>
            <div class="col-sm-5">
                <select class="form-select" id="settings-lcwo-lesson" oninput="onLCWOLessonInput()">
                    <option value="0">-</option>
                    <option value="1">1 - K, M</option>
                    <option value="2">2 - U</option>
                    <option value="3">3 - R</option>
                    <option value="4">4 - E</option>
                    <option value="5">5 - S</option>
                    <option value="6">6 - N</option>
                    <option value="7">7 - A</option>
                    <option value="8">8 - P</option>
                    <option value="9">9 - T</option>
                    <option value="10">10 - L</option>
                    <option value="11">11 - W</option>
                    <option value="12">12 - I</option>
                    <option value="13">13 - .</option>
                    <option value="14">14 - J</option>
                    <option value="15">15 - Z</option>
                    <option value="16">16 - =</option>
                    <option value="17">17 - F</option>
                    <option value="18">18 - O</option>
                    <option value="19">19 - Y</option>
                    <option value="20">20 - ,</option>
                    <option value="21">21 - V</option>
                    <option value="22">22 - G</option>
                    <option value="23">23 - 5</option>
                    <option value="24">24 - /</option>
                    <option value="25">25 - Q</option>
                    <option value="26">26 - 9</option>
                    <option value="27">27 - 2</option>
                    <option value="28">28 - H</option>
                    <option value="29">29 - 3</option>
                    <option value="30">30 - 8</option>
                    <option value="31">31 - B</option>
                    <option value="32">32 - ?</option>
                    <option value="33">33 - 4</option>
                    <option value="34">34 - 7</option>
                    <option value="35">35 - C</option>
                    <option value="36">36 - 1</option>
                    <option value="37">37 - D</option>
                    <option value="38">38 - 6</option>
                    <option value="39">39 - 0</option>
                    <option value="40">40 - X</option>
                </select>
            </div>
        </div>
        <div class="row mb-3">
            <label class="col-form-label col-sm-5" for="settings-charset">${t('settings.charset.title')}</label>
            <div class="col-sm-5">
                <textarea class="form-control" style="word-break:break-all; font-family:mono" rows="3" id="settings-charset" oninput="onCustomCharsetInput()"></textarea>
            </div>
        </div>
        <fieldset class="row mb-3">
            <legend class="col-form-label col-sm-5 pt-0">Charset</legend>
            <div class="col-sm-7">
                <div class="form-check">
                    <input class="form-check-input" id="settings-charset-latin" type="checkbox" oninput="onToggleChars(event, latin)">
                    <label class="form-check-label" for="settings-charset-latin"><code>A-Z</code></label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" id="settings-charset-digits" type="checkbox" oninput="onToggleChars(event, digits)">
                    <label class="form-check-label" for="settings-charset-digits"><code>0-9</Code></label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" id="settings-charset-punct" type="checkbox" oninput="onToggleChars(event, punct)">
                    <label class="form-check-label" for="settings-charset-punct"><code>.,:?'-/()"=+×@</code></label>
                </div>
            </div>
        </fieldset>
        <div class="row mb-3">
            <button class="btn btn-primary" onclick="exportData()">${t('settings.export')}</button>
        </div>
        <div class="row mb-3">
            <button class="btn btn-primary" onclick="importData()">${t('settings.import')}</button>
        </div>
        <div class="row mb-3">
            <button class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#delete-confirm">${t('settings.delete')}</button>
        </div>
    </div>
    `;
    restoreSettings();
}

function renderDeleteConfirm() {
    const modal = getElement('delete-confirm', HTMLDivElement);
    modal.innerHTML = `
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">${t('settings.delete')}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>${t('settings.delete.warning')}</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${t('settings.delete.cancel')}</button>
                <button type="button" class="btn btn-danger" onclick="deleteData()">${t('settings.delete')}</button>
            </div>
        </div>
    </div>
    `;
}

function renderAcknowledgements() {
    acknowledgementsElement.innerHTML = `
    <h3>${t('acknowledgements.title')}</h3>
    <ul>
        <li>
            ${t('acknowledgements.jscwlib')}:
            <a href="https://fkurz.net/ham/jscwlib.html">jscwlib</a>
            (${t('acknowledgements.mit-license')})
        </li>
        <li>
            <img src="cat.svg" class="inline-button">
            ${t('acknowledgements.cat-icon')}:
            <a href="https://github.com/twitter/twemoji">Twemoji</a>
            (${t('acknowledgements.cc-by-license')})
        </li>
    </ul>
    `;
}

/** Type assertion that lang is a language key
 *  @param {any} lang - The candidate language key
 *  @return {keyof typeof translations | null} lang - The language key or null
*/
function asLanguage(lang) {
    if (lang && translations.hasOwnProperty(lang)) {
        return lang;
    } else {
        return null;
    }
}

/** Detect the preferred language of the user
 *  @return {keyof typeof translations} lang - The preferred language
*/
function getPreferredLanguage() {
    /** @type {keyof typeof translations | null} */
    let lang = null;
    lang ||= asLanguage(new URL(document.location.href).searchParams.get('lang'));
    lang ||= asLanguage(localStorage.getItem('language'));
    lang ||= asLanguage(navigator.language.slice(0, 2));
    lang ||= 'en';
    return lang;
}

/** Set the language of the page
 *  @param {keyof typeof translations} lang - The selected language
*/
function setLanguage(lang) {
    document.documentElement.lang = lang;
    getElement('language-select', HTMLSelectElement).value = lang;
    activeLanguage = lang;
    document.title = 'Morse Cat - ' + t('pageTitle');
    localStorage.setItem('language', lang);
    getElement('settings-button', HTMLElement).innerText = t('settings.title');
    getElement('start-button', HTMLElement).innerText = t('start');
    renderHistory();
    renderSettings();
    renderStatistics();
    renderAcknowledgements();
    renderDeleteConfirm();
}

/** Refresh the stats as needed
 *  @param {boolean} [modified] - Where the stats recently modified?
*/
function refreshStatistics(modified) {
    // update day stats
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0);
    if (stats.updated < today) {
        // reset on new day
        stats.elapsed.currentDay = 0;
        stats.copiedCharacters.currentDay = 0;
        stats.copiedWords.currentDay = 0;
        stats.score.currentDay = 0;
        modified = true;
    }
    if (modified) {
        stats.updated = now;
        localStorage.setItem('stats', JSON.stringify(stats));
    }
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

/** Compute the duration of a character with the current settings
 *  @param {string} c - The character
 *  @param {number} [wpm] - Length of a dot in seconds
 *  @return {number} - Duration of the character, in seconds
*/
function characterDuration(c, wpm) {
    if (cwPlayer.alphabet === undefined) {
        throw new Error('characterDuration called before JSCWlib initialized');
    }
    const dotlen = wpm ? 60 / (wpm * 50) : cwPlayer.dotlen;
    let time = 0;
    const elements = cwPlayer.alphabet[c] || " ";
    for (const element of elements) {
        // add duration of dots or dits
        // NOTE: to make things slightly more regular in some cases, a space
        // will count as a regular character of length 1 dit; when adding the
        // previous and next inter-character gap, this totals a gap of 7 dits,
        // which is the actual duration of the inter-word gap
        const dits = element == "-" ? 3 : 1;
        time += dotlen * dits;
    }
    // add duration of inter-element gaps
    time += dotlen * (elements.length - 1);
    return time;
}

/** Update the stats after a character was copied
 *  @param {import("./types").SentCharacter} sent - The copied character
*/
function incrementCopiedCharacters(sent) {
    copiedText += sent.character;

    const now = new Date();
    const elapsedSinceStart = Math.round((now.getTime() - sessionStart.getTime()) / 1000);
    const newElapsed = elapsedSinceStart - stats.elapsed.lastSession;

    const received = {
        time: now.toISOString(),
        character: sent.character,
    };

    saveCharacter({
        sessionId,
        result: "Correct",
        sent,
        received,
    });

    increaseStat(stats.elapsed, newElapsed);
    increaseStat(stats.copiedCharacters, 1);
    if (sent.character === ' ') {
        increaseStat(stats.copiedWords, 1);
    }
    increaseStat(stats.score, stats.copiedWords.lastSession + 1);

    refreshStatistics(true);
}

function onFinished() {
    pushWord();
    cwPlayer.play();
}

function startSession() {
    if (Array.from(settings.charset).filter((c) => c.trim() !== '').length === 0) {
        infoElement.innerText = 'Empty charset!';
        return;
    }
    pushWord();
    played.length = 0;
    copiedText = '';
    inSession = true;
    sessionId = crypto.randomUUID(),
    sessionStart = new Date();
    sessionDurationUpdater = setInterval(refreshStatistics, 1000);
    stats.elapsed.lastSession = 0;
    stats.copiedCharacters.lastSession = 0;
    stats.copiedWords.lastSession = 0;
    stats.score.lastSession = 0;
    cwPlayer.setWpm(settings.wpm);
    cwPlayer.setEff(settings.wpm);
    cwPlayer.setFreq(settings.tone);
    cwPlayer.onFinished = onFinished;
    cwPlayer.play();
    infoElement.innerText = '';
    historyElement.focus();
    renderStatistics();
    renderHistory();
}

/** End the current session
 *  @param {import("./types").SentCharacter} [sent] - The character initially sent (if any)
 *  @param {string} [userInput] - What the user copied (if any)
*/
function stopSession(sent, userInput) {
    if (!inSession) {
        return;
    }

    let lastReceivedIndex = stats.copiedCharacters.lastSession;
    if (userInput) {
        // save incorrectly received character
        const received = {
            time: new Date().toISOString(),
            character: userInput,
        };
        if (sent) {
            // should always be "Incorrect", but just in case
            const result = sent.character === received.character ? "Correct" : "Incorrect";
            saveCharacter({ sessionId, result, sent, received });
        } else {
            saveCharacter({ sessionId, result: "Extraneous", received });
        }
        lastReceivedIndex += 1;
    }
    // save characters that were sent but not received at all
    for (const sent of played.slice(lastReceivedIndex)) {
        saveCharacter({ sessionId, result: "Pending", sent })
    }

    cwPlayer.stop();
    inSession = false;
    cwPlayer.onFinished = undefined;
    clearInterval(sessionDurationUpdater);
    sessionDurationUpdater = 0;

    saveSession({
        id: sessionId,
        started: sessionStart.toISOString(),
        finished: new Date().toISOString(),
        copiedText,
        mistake: !sent || !userInput ? null : {
            expectedCharacter: sent.character,
            mistakenCharacter: userInput,
        },
        settings,
        elapsed: stats.elapsed.lastSession,
        copiedCharacters: stats.copiedCharacters.lastSession,
        copiedWords: stats.copiedWords.lastSession,
        score: stats.score.lastSession,
    });

    renderStatistics();
    renderHistory();
}

/** Play a buzzer and then replay the correct character
 *  @param {string} [c] - The expected character (if any)
*/
function replayAfterMistake(c) {
    cwPlayer.onFinished = () => {
        cwPlayer.onFinished = undefined;
        cwPlayer.setFreq(settings.tone);
        if (c !== undefined) {
            cwPlayer.play(` ${c}`);
        }
    };
    cwPlayer.setFreq(settings.error_tone);
    cwPlayer.play('T');
}

/** Format a character for display
 *  @param {string | undefined} c - The character to format
 *  @return {string} - The formatted character
*/
function formatCharacter(c) {
    if (c === undefined) {
        return '-';
    } else if (c === ' ') {
        return t('key.space');
    } else {
        return c;
    }
}

/** Interrupt a session due to an user error
 *  @param {import("./types").SentCharacter} [sent] - The expected character (if any)
 *  @param {string} [userInput] - What the user copied (if any)
*/
function fail(sent, userInput) {
    stopSession(sent, userInput);
    replayAfterMistake(sent?.character);
}

document.addEventListener('keydown', (event) => {
    const userInput = event.key.toLowerCase();

    // disable Firefox's quick search when pressing forward slash
    if (userInput === '/') {
        event.preventDefault();
    }

    // hitting Return starts the keying
    if (!inSession && userInput === 'enter') {
        startSession();
    }

    // ignore other inputs when not in session
    if (!inSession) {
        return;
    }

    // ignore modified keys, except Shift and AltGraph, that can be used to compose characters
    if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
    }

    // stop space from scrolling the page while in session, tab for losing the focus, etc.
    event.preventDefault();

    // stop when user hits Escape key
    if (userInput === 'escape') {
        stopSession();
    }

    // ignore non-copy user inputs (not in the charset, and not a space)
    if (userInput !== ' ' && settings.charset.toLowerCase().indexOf(userInput) === -1) {
        return;
    }

    // played[nextIndex] is undefined if nextIndex >= played.length
    const sent = played[stats.copiedCharacters.lastSession];
    const expected = sent?.character.toLowerCase();
    if (sent && userInput === expected) {
        // correct
        incrementCopiedCharacters(sent);
        renderHistory();
        renderStatistics();
    } else {
        // incorrect
        // play sound, replay character, and end session
        fail(sent, userInput);
    }

});

/** Event handler for when a character has been fully played
 *  @param {{c: string}} c - The character played
*/
cwPlayer.onCharacterPlay = (c) => {
    if (!inSession) {
        return;
    }

    // skip leading space
    if (played.length === 0 && c.c === ' ') {
        return;
    }

    // add character
    played.push({
        time: new Date().toISOString(),
        character: c.c,
        duration: characterDuration(c.c),
    });

    // detect when user has stopped copying
    if (played.length - copiedText.length > 5) {
        fail();
        infoElement.innerText = t('info.tooSlow');
    }
};

// inspired from https://stackoverflow.com/a/48968694/4457767
/** Let the user save some data as a file
 *  @param {Blob} data
 *  @param {string} filename
*/
function saveFile(data, filename) {
    // @ts-ignore
    if (window.navigator.msSaveOrOpenBlob) {
        // Chrome-only
        // @ts-ignore
        window.navigator.msSaveOrOpenBlob(data, filename);
        return;
    }
    // generic
    const a = document.createElement('a');
    document.body.appendChild(a);
    const url = window.URL.createObjectURL(data);
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 0)
}

function exportData() {
    if (!db) {
        return;
    }
    const transaction = db.transaction(['sessions', 'characters']);
    /** @type {import("./types").HistoryEntry[] | null} */
    let sessions = null;
    /** @type {import("./types").TransmittedCharacter[] | null} */
    let characters = null;
    function exportAsJsonWhenReady() {
        if (!sessions || !characters) {
            return;
        }
        const data = JSON.stringify({sessions, characters});
        saveFile(new Blob([data]), "morse-cat-data.json");
    }
    {
        const objectStore = transaction.objectStore('sessions');
        const request = objectStore.getAll();
        request.onsuccess = () => { sessions = request.result; exportAsJsonWhenReady(); };
    }
    {
        const objectStore = transaction.objectStore('characters');
        const request = objectStore.getAll();
        request.onsuccess = () => { characters = request.result; exportAsJsonWhenReady(); };
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.oninput = function(event) {
        /** @type {HTMLInputElement | null} */
        // @ts-ignore
        const element = event.target;
        const file = element?.files?.[0];
        if (!file) {
            return;
        }
        if (file.type != "application/json") {
            // TODO
            console.error("no!");
            return;
        }
        file.text().then(function (data){
            if (!db) {
                return;
            }
            const j = JSON.parse(data);
            const transaction = db.transaction(['sessions', 'characters'], 'readwrite');
            {
                const objectStore = transaction.objectStore('sessions');
                for (const session of j['sessions']) {
                    objectStore.put(session);
                }
            }
            {
                const objectStore = transaction.objectStore('characters');
                for (const character of j['characters']) {
                    objectStore.put(character);
                }
            }
            transaction.oncomplete = function() {
                document.location.reload();
            };
        })
    }
    input.click();
}

function deleteData() {
    indexedDB.deleteDatabase('morse.cat');
    document.location.reload();
}

function recalculateCharacterDurations() {
    if (!db) {
        return;
    }
    const transaction = db.transaction(['sessions', 'characters']);
    /** @type {import("./types").HistoryEntry[] | null} */
    let sessions = null;
    /** @type {import("./types").TransmittedCharacter[] | null} */
    let characters = null;
    function fixCharacterDurations() {
        if (!db || !sessions || !characters) {
            return;
        }
        const transaction = db.transaction(['characters'], 'readwrite');
        const objectStore = transaction.objectStore('characters');
        /** @type { { [id: string]: import("./types").HistoryEntry } | null} */
        const sessionById = {};
        for (const session of sessions) {
            sessionById[session.id] = session;
        }
        for (const character of characters) {
            if (!character.sent) {
                continue;
            }
            const session = sessionById[character.sessionId];
            if (!session) {
                console.warn(`Could not find session for characer ${character.id}`);
                continue;
            }
            const wpm = session.settings.wpm;
            const newDuration = characterDuration(character.sent.character, wpm);
            if (newDuration == character.sent.duration) {
                continue;
            }
            console.info(`Updated characer ${character.id}: ${character.sent.duration} -> ${newDuration}`);
            character.sent.duration = newDuration;
            objectStore.put(character);
        }
        transaction.commit();
    }
    {
        const objectStore = transaction.objectStore('sessions');
        const request = objectStore.getAll();
        request.onsuccess = () => { sessions = request.result; fixCharacterDurations(); };
    }
    {
        const objectStore = transaction.objectStore('characters');
        const request = objectStore.getAll();
        request.onsuccess = () => { characters = request.result; fixCharacterDurations(); };
    }
}

function main() {
    const catNose = getElement('nose', SVGElement);
    cwPlayer.onLampOff = () => catNose.style.fill = '#E75A70';
    cwPlayer.onLampOn = () => catNose.style.fill = 'yellow';
    setElements();
    refreshStatistics();
    historyElement.addEventListener('blur', () => {
        if (inSession) {
            infoElement.innerText = t('info.lostFocus');
            stopSession();
        }
    });
    setLanguage(getPreferredLanguage());
    restoreSettings();
}

let domReady = false;
let dbReady = false;
document.addEventListener('DOMContentLoaded', () => {
    if (dbReady) {
        main();
    } else {
        domReady = true;
    }
});
prepareDB(() => {
    if (domReady) {
        main();
    } else {
        dbReady = true;
    }
});
