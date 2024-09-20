const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // A-Z
const digits = '0123456789'; // 0-9
const punct = '.,:?\'-/()"=+×@';
const lcwoLessons = 'KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X';
const HTML_TEMPLATE = getElement('template', HTMLElement).innerText;

/** @type {IDBDatabase | null} */
let db = null;

/** @type {import("./types").SentCharacter[]} */
const played = [];
let copiedText = '';
let inSession = false;
let sessionId = '';
let infoMessage = '';
/** @type {Date} */
let sessionStart;
let sessionDurationUpdater = 0;

/** @type {keyof typeof translations} */
let activeLanguage = 'en';

let domReady = false;
let dbReady = false;

// @ts-ignore
const cwPlayer = new jscw();
cwPlayer.q = 13;

const stats = readStats();

const defaultSettings = {
    wpm: 20,
    tone: 600,
    error_tone: 200,
    min_group_size: 5,
    max_group_size: 5,
    charset: lcwoLessons,
    session_debounce_time: 1,
};

/** @type{import("./types").Settings} */
const settings = (() => {
    try {
        const settings = JSON.parse(localStorage.getItem('settings') || '');
        // migrations
        if (settings.hasOwnProperty("word_length")) {
            settings.min_group_size = settings.word_length;
            settings.max_group_size = settings.word_length;
            delete settings["word_length"];
        }
        if (!settings.hasOwnProperty("session_debounce_time")) {
            settings.session_debounce_time = 1;
        }
        if (settings.hasOwnProperty("min_word_length")) {
            settings.min_group_size = settings.min_word_length;
            delete settings["min_word_length"];
        }
        if (settings.hasOwnProperty("max_word_length")) {
            settings.max_group_size = settings.max_word_length;
            delete settings["max_word_length"];
        }
        return settings;
    } catch (e) {
        return Object.assign({}, defaultSettings);
    }
})();

const translations = {
    en: {
        languageName: 'English',
        dir: 'ltr',
        pageTitle: 'Sharpen your claws and learn Morse code!',
        description: 'Practice Morse code with instant feedback to guide your learning. If you\'re familiar with <a href="https://lcwo.net/">LCWO</a>, you\'ll find this tool a fun and helpful way to keep building your skills.',
        spaceKey: 'Space',
        secondsSuffix: ' s',
        'history.title': 'History',
        'history.started': 'Start time',
        'history.copiedText': 'Copied Text',
        'history.elapsed': 'Duration',
        'history.characters': 'Characters',
        'history.groups': 'Groups',
        'history.score': 'Score',
        'stats.title': 'Statistics',
        'stats.elapsed': 'Time',
        'stats.copiedCharacters': 'Characters',
        'stats.copiedGroups': 'Groups',
        'stats.score': 'Score',
        'stats.lastSession': 'Last Session',
        'stats.bestSession': 'Best Session',
        'stats.currentDay': 'Today',
        'stats.bestDay': 'Best Day',
        'stats.total': 'Total',
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
        'settings.minGroupSize.title': 'Min. Group Size',
        'settings.maxGroupSize.title': 'Max. Group Size',
        'settings.groupSize.unit': 'chars.',
        'settings.groupSize.details': 'characters',
        'settings.lcwo.title': '<a href="https://lcwo.net/" title="Learn CW Online">LCWO</a> Lesson',
        'settings.charset.title': 'Customize Charset',
        'settings.sessionDebounceTime.title': 'Post-Session Cooldown',
        'settings.sessionDebounceTime.unit': 's.',
        'settings.sessionDebounceTime.details': 'seconds',
        'settings.export': 'Export Data',
        'settings.import': 'Import Data',
        'settings.delete': 'Delete Data',
        'settings.delete.warning': 'Are you sure you want to delete all data? You will lose your practice history, as well as the statistics.',
        'settings.delete.cancel': 'Close',
        'acknowledgements.title': 'Acknowledgements',
        'acknowledgements.mit-license': 'MIT License',
        'acknowledgements.cc-by-license': 'CC-BY License',
        'acknowledgements.jscwlib': 'JavaScript library for Morse Code',
        'acknowledgements.cat-icon': 'Cat icon',
        'info.incorrect': 'You typed ${typed} but the next character played was ${played}!',
        'info.tooFast': 'You typed ${typed} before the next character was played!',
        'info.tooSlow': 'Too slow!',
        'info.lostFocus': 'Focus lost!',
        'info.emptyCharset': 'Empty charset! You must select at least one character in the settings.',
    },
    fr: {
        languageName: 'French',
        dir: 'ltr',
        pageTitle: 'Aiguisez vos griffes et apprenez le code Morse !',
        description: 'Entraînez-vous au code Morse avec un feedback immédiat pour vous aider à progresser. Si vous connaissez déjà <a href="https://lcwo.net/">LCWO</a>, vous trouverez cet outil amusant et pratique pour continuer à améliorer vos compétences.',
        spaceKey: 'Espace',
        secondsSuffix: ' s',
        'history.title': 'Historique',
        'history.started': 'Heure de début',
        'history.copiedText': 'Texte copié',
        'history.elapsed': 'Durée',
        'history.characters': 'Caractères',
        'history.groups': 'Groupes',
        'history.score': 'Score',
        'stats.title': 'Statistiques',
        'stats.elapsed': 'Temps',
        'stats.copiedCharacters': 'Caractères',
        'stats.copiedGroups': 'Groupes',
        'stats.score': 'Score',
        'stats.lastSession': 'Dernière Session',
        'stats.bestSession': 'Meilleure Session',
        'stats.currentDay': "Aujourd'hui",
        'stats.bestDay': 'Meilleur jour',
        'stats.total': 'Total',
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
        'settings.minGroupSize.title': 'Taille min. des groupes',
        'settings.maxGroupSize.title': 'Taille max. des groupes',
        'settings.groupSize.unit': 'car.',
        'settings.groupSize.details': 'caractères',
        'settings.lcwo.title': 'Leçon <a href="https://lcwo.net/" title="Learn CW Online">LCWO</a>',
        'settings.charset.title': 'Jeu de caractères',
        'settings.sessionDebounceTime.title': 'Délai après session',
        'settings.sessionDebounceTime.unit': 's.',
        'settings.sessionDebounceTime.details': 'secondes',
        'settings.export': 'Exporter les données',
        'settings.import': 'Importer les données',
        'settings.delete': 'Supprimer les données',
        'settings.delete.warning': 'Êtes-vous sûr de vouloir supprimer toutes les données ? Vous perdrez votre historique de pratique ainsi que les statistiques.',
        'settings.delete.cancel': 'Fermer',
        'acknowledgements.title': 'Remerciements',
        'acknowledgements.mit-license': 'Licence MIT',
        'acknowledgements.cc-by-license': 'Licence CC-BY',
        'acknowledgements.jscwlib': 'Bibliothèque JavaScript pour le code Morse',
        'acknowledgements.cat-icon': 'Icône de chat',
        'info.incorrect': 'Vous avez tapé ${typed}, mais le caractère suivant était ${played} !',
        'info.tooFast': 'Vous avez tapé ${typed} avant que le caractère suivant ne soit joué !',
        'info.tooSlow': 'Trop lent !',
        'info.lostFocus': 'Focus perdu !',
        'info.emptyCharset': 'Jeu de caractères vide ! Vous devez sélectionner au moins un caractère dans les paramètres.',
    },
    ja: {
        languageName: '日本語',
        dir: 'ltr',
        pageTitle: '爪とぎしてモールス信号を学びましょう！',
        description: 'モールス符号の練習をしながら、即時フィードバックで学習をサポートします。<a href="https://lcwo.net/">LCWO</a>を知っているなら、このツールは楽しく役立つ方法でスキルを伸ばすのにぴったりです。',
        spaceKey: 'スペース',
        secondsSuffix: '秒',
        'history.title': '履歴',
        'history.started': '開始時間',
        'history.copiedText': 'コピーしたテキスト',
        'history.elapsed': '期間',
        'history.characters': '文字',
        'history.groups': 'グループ',
        'history.score': 'スコア',
        'stats.title': '統計',
        'stats.elapsed': '時間',
        'stats.copiedCharacters': '文字数',
        'stats.copiedGroups': 'グループ',
        'stats.score': 'スコア',
        'stats.lastSession': '前セッション',
        'stats.bestSession': 'ベストセッション',
        'stats.currentDay': '今日',
        'stats.bestDay': 'ベスト日',
        'stats.total': '総数',
        'start': '開始する',
        'settings.title': '設定',
        'settings.speed.title': '再生速度',
        'settings.speed.unit': 'WPM',
        'settings.speed.details': '1分あたりの単語数 (Words Per Minute)',
        'settings.tone.title': 'トーン',
        'settings.tone.unit': 'Hz',
        'settings.tone.details': 'ヘルツ',
        'settings.errorTone.title': 'エラートーン',
        'settings.errorTone.unit': 'Hz',
        'settings.errorTone.details': 'ヘルツ',
        'settings.minGroupSize.title': 'グループの最小サイズ',
        'settings.maxGroupSize.title': 'グループの最大サイズ',
        'settings.groupSize.unit': '字',
        'settings.groupSize.details': 'グループごとの文字数',
        'settings.lcwo.title': '<a href="https://lcwo.net/" title="Learn CW Online">LCWO</a> レッスン',
        'settings.charset.title': '文字セット',
        'settings.sessionDebounceTime.title': 'セッション後のクールダウン',
        'settings.sessionDebounceTime.unit': '秒',
        'settings.sessionDebounceTime.details': '秒',
        'settings.export': 'データをエクスポートする',
        'settings.import': 'データをインポートする',
        'settings.delete': 'データを削除する',
        'settings.delete.warning': 'すべてのデータを削除しますか？ 練習履歴および統計が失われます。',
        'settings.delete.cancel': '閉じる',
        'acknowledgements.title': '謝辞',
        'acknowledgements.mit-license': 'MIT ライセンス',
        'acknowledgements.cc-by-license': 'CC-BY ライセンス',
        'acknowledgements.jscwlib': 'モールス信号用JavaScriptライブラリ',
        'acknowledgements.cat-icon': '猫アイコン',
        'info.incorrect': 'あなたが入力したのは ${typed} ですが、次に再生された文字は ${played} です！',
        'info.tooFast': '次の文字が再生される前に ${typed} を入力しました！',
        'info.tooSlow': '遅すぎます！',
        'info.lostFocus': 'フォーカスが外れました！',
        'info.emptyCharset': '空の文字セットです！設定で少なくとも1つの文字を選択する必要があります。',
    },
    es: {
        languageName: 'Español',
        dir: 'ltr',
        pageTitle: '¡Afilen sus garras y aprendan el código Morse!',
        description: 'Practica código Morse con retroalimentación instantánea para guiar tu aprendizaje. Si ya conoces <a href="https://lcwo.net/">LCWO</a>, encontrarás que esta herramienta es divertida y útil para seguir mejorando tus habilidades.',
        spaceKey: 'Espacio',
        secondsSuffix: ' s',
        'history.title': 'Historial',
        'history.started': 'Hora de inicio',
        'history.copiedText': 'Texto copiado',
        'history.elapsed': 'Duración',
        'history.characters': 'Caracteres',
        'history.groups': 'Grupos',
        'history.score': 'Puntuación',
        'stats.title': 'Estadísticas',
        'stats.elapsed': 'Tiempo',
        'stats.copiedCharacters': 'Caracteres',
        'stats.copiedGroups': 'Grupos',
        'stats.score': 'Puntuación',
        'stats.lastSession': 'Sesión anterior',
        'stats.bestSession': 'Mejor sesión',
        'stats.currentDay': 'Hoy',
        'stats.bestDay': 'Mejor día',
        'stats.total': 'Total',
        'start': 'Iniciar',
        'settings.title': 'Configuración',
        'settings.speed.title': 'Velocidad',
        'settings.speed.unit': 'PPM',
        'settings.speed.details': 'Palabras Por Minuto',
        'settings.tone.title': 'Tono',
        'settings.tone.unit': 'Hz',
        'settings.tone.details': 'Hertz',
        'settings.errorTone.title': 'Tono de error',
        'settings.errorTone.unit': 'Hz',
        'settings.errorTone.details': 'Hertz',
        'settings.minGroupSize.title': 'Tamaño mín. de los grupos',
        'settings.maxGroupSize.title': 'Tamaño máx. de los grupos',
        'settings.groupSize.unit': 'car.',
        'settings.groupSize.details': 'caracteres',
        'settings.lcwo.title': 'Lección <a href="https://lcwo.net/" title="Learn CW Online">LCWO</a>',
        'settings.charset.title': 'Juego de caracteres',
        'settings.sessionDebounceTime.title': 'Tiempo de espera después de la sesión',
        'settings.sessionDebounceTime.unit': 's.',
        'settings.sessionDebounceTime.details': 'segundos',
        'settings.export': 'Exportar los datos',
        'settings.import': 'Importar los datos',
        'settings.delete': 'Eliminar los datos',
        'settings.delete.warning': '¿Estás seguro de que deseas eliminar todos los datos? Perderás tu historial de práctica, así como las estadísticas.',
        'settings.delete.cancel': 'Cerrar',
        'acknowledgements.title': 'Agradecimientos',
        'acknowledgements.mit-license': 'Licencia MIT',
        'acknowledgements.cc-by-license': 'Licencia CC-BY',
        'acknowledgements.jscwlib': 'Biblioteca JavaScript para código Morse',
        'acknowledgements.cat-icon': 'Ícono de gato',
        'info.incorrect': 'Has escrito ${typed}, pero el siguiente carácter jugado fue ${played}.',
        'info.tooFast': 'Escribiste ${typed} antes de que se jugara el siguiente carácter.',
        'info.tooSlow': '¡Demasiado lento!',
        'info.lostFocus': '¡Se perdió el foco!',
        'info.emptyCharset': '¡Juego de caracteres vacío! Debes seleccionar al menos un carácter en la configuración.',
    },
    ca: {
        languageName: 'Català',
        dir: 'ltr',
        pageTitle: 'Esmola les urpes i aprèn codi Morse!',
        description: 'Practica codi Morse amb comentaris instantanis per guiar el teu aprenentatge. Si ja coneixes <a href="https://lcwo.net/">LCWO</a>, trobaràs que aquesta eina és divertida i útil per seguir millorant les teves habilitats.',
        spaceKey: 'Espai',
        secondsSuffix: ' s',
        'history.title': 'Historial',
        'history.started': "Hora d'inici",
        'history.copiedText': 'Text copiat',
        'history.elapsed': 'Durada',
        'history.characters': 'Caràcters',
        'history.groups': 'Grups',
        'history.score': 'Puntuació',
        'stats.title': 'Estadístiques',
        'stats.elapsed': 'Temps',
        'stats.copiedCharacters': 'Caràcters',
        'stats.copiedGroups': 'Grups',
        'stats.score': 'Puntuació',
        'stats.lastSession': 'Sessió anterior',
        'stats.bestSession': 'Millor sessió',
        'stats.currentDay': 'Avui',
        'stats.bestDay': 'Millor dia',
        'stats.total': 'Total',
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
        'settings.minGroupSize.title': 'Mida mín. dels grups',
        'settings.maxGroupSize.title': 'Mida màx. dels grups',
        'settings.groupSize.unit': 'car.',
        'settings.groupSize.details': 'caràcters',
        'settings.lcwo.title': 'Lliçó <a href="https://lcwo.net/" title="Learn CW Online">LCWO</a>',
        'settings.charset.title': 'Joc de caràcters',
        'settings.sessionDebounceTime.title': "Temps d'espera després de la sessió",
        'settings.sessionDebounceTime.unit': 's.',
        'settings.sessionDebounceTime.details': 'segons',
        'settings.export': 'Exportar les dades',
        'settings.import': 'Importar les dades',
        'settings.delete': 'Eliminar les dades',
        'settings.delete.warning': "Estàs segur que vols eliminar totes les dades? Perdràs l'historial de pràctica i també les estadístiques.",
        'settings.delete.cancel': 'Tancar',
        'acknowledgements.title': 'Agraïments',
        'acknowledgements.mit-license': 'Llicència MIT',
        'acknowledgements.cc-by-license': 'Llicència CC-BY',
        'acknowledgements.jscwlib': 'Biblioteca JavaScript per al codi Morse',
        'acknowledgements.cat-icon': 'Icona de gat',
        'info.incorrect': 'Has escrit ${typed}, però el següent caràcter jugat ha estat ${played}!',
        'info.tooFast': 'Has escrit ${typed} abans que es jugués el següent caràcter!',
        'info.tooSlow': 'Massa lent!',
        'info.lostFocus': "S'ha perdut el focus!",
        'info.emptyCharset': 'Joc de caràcters buit! Has de seleccionar almenys un caràcter a la configuració.',
    },
    zh: {
        languageName: '中文',
        dir: 'ltr',
        pageTitle: '磨利爪子，学习摩尔斯电码！',
        description: '通过即时反馈练习摩尔斯电码，帮助你更好地学习。如果你熟悉 <a href=\'https://lcwo.net/\'>LCWO</a>，你会发现这个工具既有趣又实用，可以帮助你不断提升技能。',
        spaceKey: '空格键',
        secondsSuffix: '秒',
        'history.title': '历史记录',
        'history.started': '开始时间',
        'history.copiedText': '复制的文本',
        'history.elapsed': '时长',
        'history.characters': '字符',
        'history.groups': '字符组',
        'history.score': '得分',
        'stats.title': '统计',
        'stats.elapsed': '时间',
        'stats.copiedCharacters': '复制的字符',
        'stats.copiedGroups': '字符组',
        'stats.score': '得分',
        'stats.lastSession': '上次练习',
        'stats.bestSession': '最佳练习',
        'stats.currentDay': '今天',
        'stats.bestDay': '最佳日',
        'stats.total': '总计',
        'start': '开始',
        'settings.title': '设置',
        'settings.speed.title': '速度',
        'settings.speed.unit': '字/分',
        'settings.speed.details': '每分钟单词数',
        'settings.tone.title': '音调',
        'settings.tone.unit': '赫兹',
        'settings.tone.details': '赫兹',
        'settings.errorTone.title': '错误音调',
        'settings.errorTone.unit': '赫兹',
        'settings.errorTone.details': '赫兹',
        'settings.minGroupSize.title': '最小字符组大小',
        'settings.maxGroupSize.title': '最大字符组大小',
        'settings.groupSize.unit': '字符',
        'settings.groupSize.details': '字符',
        'settings.lcwo.title': '<a href=\'https://lcwo.net/\' title=\'Learn CW Online\'>LCWO</a> 课程',
        'settings.charset.title': '自定义字符集',
        'settings.sessionDebounceTime.title': '会话结束冷却时间',
        'settings.sessionDebounceTime.unit': '秒',
        'settings.sessionDebounceTime.details': '秒',
        'settings.export': '导出数据',
        'settings.import': '导入数据',
        'settings.delete': '删除数据',
        'settings.delete.warning': '你确定要删除所有数据吗？你将丢失所有练习记录及统计数据。',
        'settings.delete.cancel': '关闭',
        'acknowledgements.title': '致谢',
        'acknowledgements.mit-license': 'MIT 许可证',
        'acknowledgements.cc-by-license': 'CC-BY 许可证',
        'acknowledgements.jscwlib': '摩尔斯电码的 JavaScript 库',
        'acknowledgements.cat-icon': '猫图标',
        'info.incorrect': '你输入了 ${typed}，但播放的下一个字符是 ${played}！',
        'info.tooFast': '你输入了 ${typed}，但字符还没播放完！',
        'info.tooSlow': '太慢了！',
        'info.lostFocus': '焦点丢失！',
        'info.emptyCharset': '字符集为空！请在设置中至少选择一个字符。'
    },
    hi: {
        languageName: 'हिन्दी',
        dir: 'ltr',
        pageTitle: 'अपने पंजों को तेज करो, मोर्स कोड सीखो!',
        description: 'तुरंत प्रतिक्रिया के साथ मोर्स कोड का अभ्यास करें, जो आपको बेहतर ढंग से सीखने में मदद करेगा। यदि आप <a href=\'https://lcwo.net/\'>LCWO</a> से परिचित हैं, तो आपको यह टूल मजेदार और उपयोगी लगेगा, जो आपकी क्षमताओं को निखारने में मदद करेगा।',
        spaceKey: 'स्पेस कुंजी',
        secondsSuffix: ' सेकंड',
        'history.title': 'इतिहास',
        'history.started': 'शुरुआत का समय',
        'history.copiedText': 'प्रतिलिपि किया गया टेक्स्ट',
        'history.elapsed': 'बीता समय',
        'history.characters': 'अक्षर',
        'history.groups': 'अक्षर समूह',
        'history.score': 'स्कोर',
        'stats.title': 'सांख्यिकी',
        'stats.elapsed': 'समय',
        'stats.copiedCharacters': 'प्रतिलिपि किए गए अक्षर',
        'stats.copiedGroups': 'अक्षर समूह',
        'stats.score': 'स्कोर',
        'stats.lastSession': 'अंतिम अभ्यास',
        'stats.bestSession': 'सर्वश्रेष्ठ अभ्यास',
        'stats.currentDay': 'आज',
        'stats.bestDay': 'सर्वश्रेष्ठ दिन',
        'stats.total': 'कुल',
        'start': 'शुरू करें',
        'settings.title': 'सेटिंग्स',
        'settings.speed.title': 'गति',
        'settings.speed.unit': 'शब्द/मिनट',
        'settings.speed.details': 'प्रति मिनट शब्द',
        'settings.tone.title': 'स्वर',
        'settings.tone.unit': 'हर्ट्ज',
        'settings.tone.details': 'हर्ट्ज',
        'settings.errorTone.title': 'त्रुटि स्वर',
        'settings.errorTone.unit': 'हर्ट्ज',
        'settings.errorTone.details': 'हर्ट्ज',
        'settings.minGroupSize.title': 'न्यूनतम समूह आकार',
        'settings.maxGroupSize.title': 'अधिकतम समूह आकार',
        'settings.groupSize.unit': 'अक्षर',
        'settings.groupSize.details': 'अक्षर',
        'settings.lcwo.title': '<a href=\'https://lcwo.net/\' title=\'Learn CW Online\'>LCWO</a> पाठ्यक्रम',
        'settings.charset.title': 'कस्टम कैरेक्टर सेट',
        'settings.sessionDebounceTime.title': 'सत्र समाप्ति शीतलन समय',
        'settings.sessionDebounceTime.unit': 'सेकंड',
        'settings.sessionDebounceTime.details': 'सेकंड',
        'settings.export': 'डेटा निर्यात करें',
        'settings.import': 'डेटा आयात करें',
        'settings.delete': 'डेटा हटाएं',
        'settings.delete.warning': 'क्या आप वाकई सभी डेटा हटाना चाहते हैं? आप सभी अभ्यास इतिहास और सांख्यिकी खो देंगे।',
        'settings.delete.cancel': 'बंद करें',
        'acknowledgements.title': 'आभार',
        'acknowledgements.mit-license': 'MIT लाइसेंस',
        'acknowledgements.cc-by-license': 'CC-BY लाइसेंस',
        'acknowledgements.jscwlib': 'मोर्स कोड के लिए जावास्क्रिप्ट लाइब्रेरी',
        'acknowledgements.cat-icon': 'बिल्ली का आइकन',
        'info.incorrect': 'आपने ${typed} टाइप किया, लेकिन अगला अक्षर ${played} चलाया जा रहा था!',
        'info.tooFast': 'आपने ${typed} टाइप किया, लेकिन अक्षर अभी तक पूरी तरह से बजा नहीं है!',
        'info.tooSlow': 'बहुत धीमा!',
        'info.lostFocus': 'ध्यान खो गया!',
        'info.emptyCharset': 'कैरेक्टर सेट खाली है! कृपया सेटिंग्स में कम से कम एक कैरेक्टर चुनें।'
    },
    ar: {
        languageName: 'العربية',
        dir: 'rtl',
        pageTitle: 'اشحذ مخالبك، تعلم شفرة مورس!',
        description: 'مارس شفرة مورس مع ردود فعل فورية لمساعدتك على التعلم بشكل أفضل. إذا كنت معتادًا على <a href=\'https://lcwo.net/\'>LCWO</a>، فستجد هذه الأداة ممتعة وعملية لتحسين مهاراتك.',
        spaceKey: 'مفتاح المسافة',
        secondsSuffix: ' ثانية',
        'history.title': 'السجل',
        'history.started': 'وقت البدء',
        'history.copiedText': 'النص المنسوخ',
        'history.elapsed': 'المدة',
        'history.characters': 'الأحرف',
        'history.groups': 'مجموعات الأحرف',
        'history.score': 'النتيجة',
        'stats.title': 'الإحصائيات',
        'stats.elapsed': 'الوقت',
        'stats.copiedCharacters': 'الأحرف المنسوخة',
        'stats.copiedGroups': 'مجموعات الأحرف',
        'stats.score': 'النتيجة',
        'stats.lastSession': 'آخر جلسة',
        'stats.bestSession': 'أفضل جلسة',
        'stats.currentDay': 'اليوم',
        'stats.bestDay': 'أفضل يوم',
        'stats.total': 'المجموع',
        'start': 'ابدأ',
        'settings.title': 'الإعدادات',
        'settings.speed.title': 'السرعة',
        'settings.speed.unit': 'كلمة/دقيقة',
        'settings.speed.details': 'عدد الكلمات في الدقيقة',
        'settings.tone.title': 'النغمة',
        'settings.tone.unit': 'هرتز',
        'settings.tone.details': 'الهرتز',
        'settings.errorTone.title': 'نغمة الخطأ',
        'settings.errorTone.unit': 'هرتز',
        'settings.errorTone.details': 'الهرتز',
        'settings.minGroupSize.title': 'الحد الأدنى لحجم المجموعة',
        'settings.maxGroupSize.title': 'الحد الأقصى لحجم المجموعة',
        'settings.groupSize.unit': 'أحرف',
        'settings.groupSize.details': 'أحرف',
        'settings.lcwo.title': '<a href=\'https://lcwo.net/\' title=\'Learn CW Online\'>دورة LCWO</a>',
        'settings.charset.title': 'مجموعة أحرف مخصصة',
        'settings.sessionDebounceTime.title': 'وقت التبريد بعد الجلسة',
        'settings.sessionDebounceTime.unit': 'ثواني',
        'settings.sessionDebounceTime.details': 'ثواني',
        'settings.export': 'تصدير البيانات',
        'settings.import': 'استيراد البيانات',
        'settings.delete': 'حذف البيانات',
        'settings.delete.warning': 'هل أنت متأكد من أنك تريد حذف جميع البيانات؟ ستفقد جميع سجلات التدريب والإحصائيات.',
        'settings.delete.cancel': 'إغلاق',
        'acknowledgements.title': 'الشكر والتقدير',
        'acknowledgements.mit-license': 'رخصة MIT',
        'acknowledgements.cc-by-license': 'رخصة CC-BY',
        'acknowledgements.jscwlib': 'مكتبة جافا سكريبت لشيفرة مورس',
        'acknowledgements.cat-icon': 'رمز القطة',
        'info.incorrect': 'لقد كتبت ${typed}، ولكن الحرف التالي الذي يتم تشغيله هو ${played}!',
        'info.tooFast': 'لقد كتبت ${typed}، ولكن الحرف لم ينتهِ تشغيله بعد!',
        'info.tooSlow': 'بطيء جدًا!',
        'info.lostFocus': 'فقدان التركيز!',
        'info.emptyCharset': 'مجموعة الأحرف فارغة! الرجاء اختيار حرف واحد على الأقل في الإعدادات.'
    },
    bn: {
        languageName: 'বাংলা',
        dir: 'ltr',
        pageTitle: 'তোমার নখ ধার দাও, মর্স কোড শিখো!',
        description: 'তাৎক্ষণিক প্রতিক্রিয়া সহ মর্স কোড অনুশীলন করুন, যা আপনাকে আরও ভালোভাবে শিখতে সহায়তা করবে। আপনি যদি <a href=\'https://lcwo.net/\'>LCWO</a> এর সাথে পরিচিত হন, তবে এই টুলটি মজাদার এবং দক্ষতা বৃদ্ধির জন্য কার্যকরী হবে।',
        spaceKey: 'স্পেস কী',
        secondsSuffix: ' সেকেন্ড',
        'history.title': 'ইতিহাস',
        'history.started': 'শুরুর সময়',
        'history.copiedText': 'কপি করা লেখা',
        'history.elapsed': 'অতিবাহিত সময়',
        'history.characters': 'অক্ষর',
        'history.groups': 'অক্ষর দল',
        'history.score': 'স্কোর',
        'stats.title': 'পরিসংখ্যান',
        'stats.elapsed': 'সময়',
        'stats.copiedCharacters': 'কপি করা অক্ষর',
        'stats.copiedGroups': 'অক্ষর দল',
        'stats.score': 'স্কোর',
        'stats.lastSession': 'শেষ সেশন',
        'stats.bestSession': 'সেরা সেশন',
        'stats.currentDay': 'আজ',
        'stats.bestDay': 'সেরা দিন',
        'stats.total': 'মোট',
        'start': 'শুরু করুন',
        'settings.title': 'সেটিংস',
        'settings.speed.title': 'গতি',
        'settings.speed.unit': 'শব্দ/মিনিট',
        'settings.speed.details': 'প্রতি মিনিটে শব্দ সংখ্যা',
        'settings.tone.title': 'সুর',
        'settings.tone.unit': 'হার্টজ',
        'settings.tone.details': 'হার্টজ',
        'settings.errorTone.title': 'ভুল সুর',
        'settings.errorTone.unit': 'হার্টজ',
        'settings.errorTone.details': 'হার্টজ',
        'settings.minGroupSize.title': 'ন্যূনতম অক্ষর দলের আকার',
        'settings.maxGroupSize.title': 'সর্বাধিক অক্ষর দলের আকার',
        'settings.groupSize.unit': 'অক্ষর',
        'settings.groupSize.details': 'অক্ষর',
        'settings.lcwo.title': '<a href=\'https://lcwo.net/\' title=\'Learn CW Online\'>LCWO</a> কোর্স',
        'settings.charset.title': 'নিজস্ব অক্ষর সেট',
        'settings.sessionDebounceTime.title': 'সেশন শেষের শীতল সময়',
        'settings.sessionDebounceTime.unit': 'সেকেন্ড',
        'settings.sessionDebounceTime.details': 'সেকেন্ড',
        'settings.export': 'তথ্য রপ্তানি',
        'settings.import': 'তথ্য আমদানি',
        'settings.delete': 'তথ্য মুছুন',
        'settings.delete.warning': 'আপনি কি সত্যিই সমস্ত তথ্য মুছে ফেলতে চান? আপনি সমস্ত অনুশীলনের ইতিহাস এবং পরিসংখ্যান হারাবেন।',
        'settings.delete.cancel': 'বন্ধ করুন',
        'acknowledgements.title': 'কৃতজ্ঞতা',
        'acknowledgements.mit-license': 'MIT লাইসেন্স',
        'acknowledgements.cc-by-license': 'CC-BY লাইসেন্স',
        'acknowledgements.jscwlib': 'মর্স কোডের জন্য জাভাস্ক্রিপ্ট লাইব্রেরি',
        'acknowledgements.cat-icon': 'বিড়ালের আইকন',
        'info.incorrect': 'আপনি ${typed} টাইপ করেছেন, কিন্তু পরবর্তী অক্ষর ${played} চলছে!',
        'info.tooFast': 'আপনি ${typed} টাইপ করেছেন, কিন্তু অক্ষর এখনও শেষ হয়নি!',
        'info.tooSlow': 'খুব ধীর!',
        'info.lostFocus': 'ফোকাস হারানো গেছে!',
        'info.emptyCharset': 'অক্ষর সেট খালি! অনুগ্রহ করে সেটিংস থেকে অন্তত একটি অক্ষর নির্বাচন করুন।'
    },
    pt: {
        languageName: 'Português',
        dir: 'ltr',
        pageTitle: 'Afiar suas garras, aprender código Morse!',
        description: 'Pratique o código Morse com feedback instantâneo para ajudá-lo a aprender melhor. Se você está familiarizado com <a href=\'https://lcwo.net/\'>LCWO</a>, encontrará esta ferramenta divertida e prática para aprimorar suas habilidades.',
        spaceKey: 'Tecla Espaço',
        secondsSuffix: ' s',
        'history.title': 'Histórico',
        'history.started': 'Hora de Início',
        'history.copiedText': 'Texto Copiado',
        'history.elapsed': 'Tempo Decorrido',
        'history.characters': 'Caracteres',
        'history.groups': 'Grupos de Caracteres',
        'history.score': 'Pontuação',
        'stats.title': 'Estatísticas',
        'stats.elapsed': 'Tempo',
        'stats.copiedCharacters': 'Caracteres Copiados',
        'stats.copiedGroups': 'Grupos de Caracteres',
        'stats.score': 'Pontuação',
        'stats.lastSession': 'Última Sessão',
        'stats.bestSession': 'Melhor Sessão',
        'stats.currentDay': 'Hoje',
        'stats.bestDay': 'Melhor Dia',
        'stats.total': 'Total',
        'start': 'Começar',
        'settings.title': 'Configurações',
        'settings.speed.title': 'Velocidade',
        'settings.speed.unit': 'Palavras/Minuto',
        'settings.speed.details': 'Palavras por minuto',
        'settings.tone.title': 'Tom',
        'settings.tone.unit': 'Hz',
        'settings.tone.details': 'Hertz',
        'settings.errorTone.title': 'Tom de Erro',
        'settings.errorTone.unit': 'Hz',
        'settings.errorTone.details': 'Hertz',
        'settings.minGroupSize.title': 'Tamanho Mínimo do Grupo',
        'settings.maxGroupSize.title': 'Tamanho Máximo do Grupo',
        'settings.groupSize.unit': 'Caracteres',
        'settings.groupSize.details': 'Caracteres',
        'settings.lcwo.title': '<a href=\'https://lcwo.net/\' title=\'Learn CW Online\'>Curso LCWO</a>',
        'settings.charset.title': 'Conjunto de Caracteres Personalizado',
        'settings.sessionDebounceTime.title': 'Tempo de Resfriamento após Sessão',
        'settings.sessionDebounceTime.unit': 'Segundos',
        'settings.sessionDebounceTime.details': 'Segundos',
        'settings.export': 'Exportar Dados',
        'settings.import': 'Importar Dados',
        'settings.delete': 'Excluir Dados',
        'settings.delete.warning': 'Você tem certeza de que deseja excluir todos os dados? Você perderá todo o histórico de práticas e estatísticas.',
        'settings.delete.cancel': 'Fechar',
        'acknowledgements.title': 'Agradecimentos',
        'acknowledgements.mit-license': 'Licença MIT',
        'acknowledgements.cc-by-license': 'Licença CC-BY',
        'acknowledgements.jscwlib': 'Biblioteca JavaScript para Código Morse',
        'acknowledgements.cat-icon': 'Ícone de Gato',
        'info.incorrect': 'Você digitou ${typed}, mas o próximo caractere tocado foi ${played}!',
        'info.tooFast': 'Você digitou ${typed}, mas o caractere ainda não terminou de tocar!',
        'info.tooSlow': 'Muito lento!',
        'info.lostFocus': 'Foco perdido!',
        'info.emptyCharset': 'O conjunto de caracteres está vazio! Selecione pelo menos um caractere nas configurações.'
    },
};

/** @param {() => void} callback */
function prepareDB(callback) {
    const request = indexedDB.open("morse.cat", 2);
    request.onerror = () => {
        alert("Failed to open IndexedDB; history won't be saved");
    }
    request.onupgradeneeded = (event) => {
        const db = request.result;
        if (event.oldVersion == 0) {
            const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
            sessionsStore.createIndex('started', 'started');
            db.createObjectStore('characters', { keyPath: 'id' });
        }
        if (event.oldVersion <= 1) {
            // @ts-ignore
            const transaction = event.target.transaction;
            const objectStore = transaction.objectStore('sessions');
            const request2 = objectStore.getAll();
            request2.onsuccess = () => {
                for (const session of request2.result) {
                    session.copiedGroups = session.copiedWords;
                    delete session["copiedWords"];
                    objectStore.put(session);
                }
            }
        }
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

function pushGroup() {
    const groupLength = randint(settings.min_group_size, settings.max_group_size);
    const group = Array.from(
        { length: groupLength },
        () => settings.charset[Math.floor(Math.random() * settings.charset.length)],
    ).join('');
    cwPlayer.setText(` ${group}`);
}

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
        copiedGroups: {
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

function onSettingsChange() {
    // eslint-disable-next-line no-use-before-define
    stopSession();
    settings.wpm = parseFloat(getElement('settings-wpm', HTMLInputElement).value);
    settings.tone = parseFloat(getElement('settings-tone', HTMLInputElement).value);
    settings.error_tone = parseFloat(getElement('settings-error-tone', HTMLInputElement).value);
    settings.min_group_size = parseInt(getElement('settings-group-length-min', HTMLInputElement).value, 10);
    settings.max_group_size = parseInt(getElement('settings-group-length-max', HTMLInputElement).value, 10);
    settings.charset = getElement('settings-charset', HTMLTextAreaElement).value;
    settings.session_debounce_time = parseFloat(getElement('settings-session-debounce-time', HTMLInputElement).value);
    saveSettings();
}

function saveSettings() {
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
    getElement('settings-group-length-min', HTMLInputElement).value = settings.min_group_size.toString();
    getElement('settings-group-length-max', HTMLInputElement).value = settings.max_group_size.toString();
    getElement('settings-session-debounce-time', HTMLInputElement).value = settings.session_debounce_time.toString();
    getElement('settings-charset', HTMLTextAreaElement).value = settings.charset;
    updateLCWOLessonFromCharset();
    updateTogglesFromCharset();
}

/** Format an history entry
 *  @param {import("./types").HistoryEntry} entry - The entry to format
 *  @return {string} - The formatted entry
*/
function formatHistoryEntry(entry) {
    let mistake = '';
    if (entry.mistake) {
        const { expectedCharacter, mistakenCharacter } = entry.mistake;
        // make sure the expected character is visible even when it is a space
        const visibleExpectedCharacter = expectedCharacter === ' ' ? '⎵' : expectedCharacter;
        mistake = `<span class="strike">${mistakenCharacter}</span>${visibleExpectedCharacter}`;
    }
    const lang = activeLanguage;
    return `
    <tr>
        <td><time datetime="${entry.started}">${entry.started}</time></td>
        <td class="font-monospace text-uppercase">${entry.copiedText}${mistake}</td>
        <td class="text-end">${entry.elapsed.toLocaleString(lang)}${t('secondsSuffix')}</td>
        <td class="text-end">${entry.copiedCharacters.toLocaleString(lang)}</td>
        <td class="text-end">${entry.copiedGroups.toLocaleString(lang)}</td>
        <td class="text-end">${entry.score.toLocaleString(lang)}</td>
    </tr>`;
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
    activeLanguage = lang;
    const dir = t('dir');
    document.documentElement.dir = dir;
    if (dir == 'rtl') {
        getElement('bootstrap-css', HTMLLinkElement).href = 'bootstrap.rtl.min.css';
    } else {
        getElement('bootstrap-css', HTMLLinkElement).href = 'bootstrap.min.css';
    }
    document.title = 'Morse Cat - ' + t('pageTitle');
    localStorage.setItem('language', lang);
    infoMessage = '';
    render();
}

/**
 *  @param {string} message
*/
function setInfoMessage(message) {
    infoMessage = message;
    const infoElement = getElement('info', HTMLElement);
    infoElement.innerHTML = message;
    if (message) {
        infoElement.parentElement?.classList?.remove('d-none');
    } else {
        infoElement.parentElement?.classList?.add('d-none');
    }
}

/**
 *  @param {string} template
 *  @param {{[key: string]: any;}} vars
 *  @return {string}
*/
function evaluateTemplate(template, vars) {
    const f = new Function(...Object.keys(vars), 'return `' + template + '`');
    return f(...Object.values(vars))
}

function render() {
    getLastSessions(10, (sessions) => {
        getElement('root', HTMLDivElement).innerHTML = evaluateTemplate(HTML_TEMPLATE, {
            lang: activeLanguage,
            history: [...sessions.map(formatHistoryEntry)].reverse().join(''),
        });
        restoreSettings();
        getElement('language-select', HTMLSelectElement).value = activeLanguage;
        getElement('current-session', HTMLTextAreaElement).value = copiedText;
        if (infoMessage) {
            const infoElement = getElement('info', HTMLElement);
            infoElement.innerHTML = infoMessage;
            infoElement.parentElement?.classList.remove('d-none');
        }

        const startButton = getElement('start-button', HTMLButtonElement);
        startButton.disabled = true;
        setTimeout(function() {
            startButton.disabled = false;
            startButton.focus({preventScroll: true});
        }, settings.session_debounce_time * 1000);
    });
}

/** Refresh the stats as needed
 *  @param {boolean} [modified] - Where the stats recently modified?
*/
function refreshStatistics(modified) {
    // migration
    if (stats.hasOwnProperty("copiedWords")) {
        // @ts-ignore
        stats.copiedGroups = stats.copiedWords;
        // @ts-ignore
        delete stats["copiedWords"];
    }
    // update day stats
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0);
    if (stats.updated < today) {
        // reset on new day
        stats.elapsed.currentDay = 0;
        stats.copiedCharacters.currentDay = 0;
        stats.copiedGroups.currentDay = 0;
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
        // which is the actual duration of the inter-group gap
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
    getElement('current-session', HTMLTextAreaElement).value = copiedText;

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
        increaseStat(stats.copiedGroups, 1);
    }
    increaseStat(stats.score, stats.copiedGroups.lastSession + 1);

    refreshStatistics(true);
}

function onFinished() {
    pushGroup();
    cwPlayer.play();
}

function startSession() {
    const now = new Date();

    if (Array.from(settings.charset).filter((c) => c.trim() !== '').length === 0) {
        setInfoMessage(t('info.emptyCharset'));
        return;
    }
    pushGroup();
    played.length = 0;
    copiedText = '';
    getElement('current-session', HTMLTextAreaElement).value = copiedText;
    inSession = true;
    sessionId = crypto.randomUUID(),
    sessionStart = now;
    sessionDurationUpdater = setInterval(refreshStatistics, 1000);
    stats.elapsed.lastSession = 0;
    stats.copiedCharacters.lastSession = 0;
    stats.copiedGroups.lastSession = 0;
    stats.score.lastSession = 0;
    cwPlayer.setWpm(settings.wpm);
    cwPlayer.setEff(settings.wpm);
    cwPlayer.setFreq(settings.tone);
    cwPlayer.onFinished = onFinished;
    cwPlayer.play();
    setInfoMessage('');
    getElement('current-session', HTMLTextAreaElement).focus();
}

/** End the current session
 *  @param {import("./types").SentCharacter} [sent] - The character initially sent (if any)
 *  @param {string} [userInput] - What the user copied (if any)
*/
function stopSession(sent, userInput) {
    if (!inSession) {
        return;
    }

    const now = new Date();

    let lastReceivedIndex = stats.copiedCharacters.lastSession;
    if (userInput) {
        // save incorrectly received character
        const received = {
            time: now.toISOString(),
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
        finished: now.toISOString(),
        copiedText,
        mistake: !sent || !userInput ? null : {
            expectedCharacter: sent.character,
            mistakenCharacter: userInput,
        },
        settings,
        elapsed: stats.elapsed.lastSession,
        copiedCharacters: stats.copiedCharacters.lastSession,
        copiedGroups: stats.copiedGroups.lastSession,
        score: stats.score.lastSession,
    });

    render();
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

/** Interrupt a session due to an user error
 *  @param {import("./types").SentCharacter} [sent] - The expected character (if any)
 *  @param {string} [userInput] - What the user copied (if any)
*/
function fail(sent, userInput) {
    stopSession(sent, userInput);
    replayAfterMistake(sent?.character);
}

/**
 *  @param {string} character
 *  @return {string}
*/
function characterNameWithMorse(character) {
    if (character === ' ') {
        return `<code>${t('spaceKey')}</code>`;
    } else {
        const name = character.toUpperCase();
        const morse = cwPlayer.alphabet[character].replaceAll('.', '·').replaceAll('-', '−');
        return `<code>${name}</code> (<code>${morse}</code>)`;
    }
}

/**
 *  @param {KeyboardEvent} event
*/
function onKeyDown(event) {
    const userInput = event.key.toLowerCase();

    // ignore inputs when not in session
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
    } else {
        // incorrect
        // play sound, replay character, and end session
        fail(sent, userInput);
        // display info message
        if (sent) {
            const template = t('info.incorrect');
            setInfoMessage(evaluateTemplate(template, {
                played: characterNameWithMorse(sent.character),
                typed: characterNameWithMorse(userInput),
            }));
        } else {
            const template = t('info.tooFast');
            setInfoMessage(evaluateTemplate(template, {
                typed: characterNameWithMorse(userInput),
            }));
        }
    }
}

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
        setInfoMessage(t('info.tooSlow'));
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

    const button = getElement('export-button', HTMLButtonElement);
    button.classList.add('spinning');

    const transaction = db.transaction(['sessions', 'characters']);
    /** @type {import("./types").HistoryEntry[] | null} */
    let sessions = null;
    /** @type {import("./types").TransmittedCharacter[] | null} */
    let characters = null;
    function exportAsJsonWhenReady() {
        if (!sessions || !characters) {
            return;
        }
        const data = JSON.stringify({sessions, characters, settings});
        saveFile(new Blob([data]), "morse-cat-data.json");
        button.classList.remove('spinning');
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
            alert('Incorrect file type!');
            return;
        }

        const button = getElement('import-button', HTMLButtonElement);
        button.classList.add('spinning');
        const progressBar = getElement('progress-bar', HTMLDivElement);
        progressBar.style.width = '0%';

        file.text().then(function (data){
            progressBar.style.width = '5%';
            setTimeout(function() {
                let j;
                try {
                    j = JSON.parse(data);
                } catch (e) {
                    alert(`Failed to parse file: ${e}`);
                    button.classList.remove('spinning');
                    return;
                }
                const { sessions, characters, settings: newSettings } = j;
                progressBar.style.width = '10%';
                setTimeout(function() {
                    const total = sessions.length + characters.length;
                    progressBar.style.width = '15%';
                    setTimeout(function() {
                        if (!db) {
                            button.classList.remove('spinning');
                            return;
                        }
                        {
                            Object.assign(settings, newSettings);
                            restoreSettings();
                            saveSettings();
                        }
                        const transaction = db.transaction(['sessions', 'characters'], 'readwrite');
                        let processed = 0;
                        function updateProgress() {
                            processed += 1;
                            if (processed % 1000 == 0) {
                                const progress = 15 + (processed / total * 85);
                                progressBar.style.width = progress + '%';
                            }
                        }
                        // TODO: to avoid the slight pause after 15%, the loops
                        // below (and in particular the ones for characters)
                        // should be broken in chunks and scheduled with
                        // setTimeout; note that the commit should only happen
                        // once all the elements have been scheduled for put
                        {
                            const objectStore = transaction.objectStore('sessions');
                            for (const session of sessions) {
                                const request = objectStore.put(session);
                                request.onsuccess = updateProgress;
                            }
                        }
                        {
                            const objectStore = transaction.objectStore('characters');
                            for (const character of characters) {
                                const request = objectStore.put(character);
                                request.onsuccess = updateProgress;
                            }
                        }
                        transaction.oncomplete = function() {
                            progressBar.style.width = '100%';
                            button.classList.remove('spinning');
                            //document.location.reload();
                        };
                        transaction.commit();
                    }, 100);
                }, 100);
            }, 100);
        })
    }
    input.click();
}

function deleteData() {
    indexedDB.deleteDatabase('morse.cat');
    Object.assign(settings, defaultSettings);
    restoreSettings();
    saveSettings();
    document.location.reload();
}

function onCurrentSessionBlur() {
    if (inSession) {
        setInfoMessage(t('info.lostFocus'));
        stopSession();
    }
}

function main() {
    cwPlayer.onLampOff = () => getElement('nose', SVGElement).style.fill = '#E75A70';
    cwPlayer.onLampOn = () => getElement('nose', SVGElement).style.fill = 'yellow';
    refreshStatistics();
    setLanguage(getPreferredLanguage());
}

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
