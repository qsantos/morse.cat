// based on jscwlib (MIT license) by Fabian Kurz, DJ5CW
// https://fkurz.net/ham/jscwlib.html
// https://git.fkurz.net/dj1yfk/jscwlib
// https://github.com/dj1yfk/jscwlib/
//
// simplified to allow playing arbitrary Morse code elements and remove all UI-related code

// biome-ignore format: having two columns is very convenient here
/** @type {{[key: string]: string}} */
const morseOfCharacter = {
    " ": " ",  // word space

    // International Morse code, as per ITU-R M.1677-1

    // 1. Morse code signals
    // 1.1.1. Letters (Latin script)
    // Uppercase Lowercase
    "A": ".-",   "a": ".-",
    "B": "-...", "b": "-...",
    "C": "-.-.", "c": "-.-.",
    "D": "-..",  "d": "-..",
    "E": ".",    "e": ".",
    "F": "..-.", "f": "..-.",
    "G": "--.",  "g": "--.",
    "H": "....", "h": "....",
    "I": "..",   "i": "..",  "ı": "..",  // dotless i (see https://en.wikipedia.org/wiki/Dotless_I)
    "J": ".---", "j": ".---",
    "K": "-.-",  "k": "-.-",
    "L": ".-..", "l": ".-..",
    "M": "--",   "m": "--",
    "N": "-.",   "n": "-.",
    "O": "---",  "o": "---",
    "P": ".--.", "p": ".--.",
    "Q": "--.-", "q": "--.-",
    "R": ".-.",  "r": ".-.",
    "S": "...",  "s": "...", "ſ": "...",  // long s (see https://en.wikipedia.org/wiki/Long_s)
    "T": "-",    "t": "-",
    "U": "..-",  "u": "..-",
    "V": "...-", "v": "...-",
    "W": ".--",  "w": ".--",
    "X": "-..-", "x": "-..-",
    "Y": "-.--", "y": "-.--",
    "Z": "--..", "z": "--..",

    // 1.1.2. Figures (Hindu-Arab digits)
    "0": "-----",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",

    // 1.1.3. Punctuation marks and miscellaneous signs
    ".": ".-.-.-",  // Full stop (period)
    ",": "--..--",  // Comma
    ":": "---...",  // Colon r division sign
    "?": "..--..",  // Question mark
    "'": ".----.",  // Apostrophe
    "-": "-....-",  // Hyphen
    "/": "-..-.",  // Fraction bar or division sign
    "(": "-.--.",  // Left-hand bracket (parenthesis)
    ")": "-.--.-",  // Right-hand bracket (parenthesis)
    // Inverted commas (before and after the words)
    // Straight quotes
    '"': ".-..-.",
    // English quotes
    "“": ".-..-.",
    "”": ".-..-.",
    // French quotes
    "«": ".-..-.",
    "»": ".-..-.",
    "=": "-...-",  // Double hyphen
    // NA  // Understood
    // NA  // Error
    "+": ".-.-.",  // Cross or addition sign
    // NA  // Invitation to transmit
    // NA  // Wait
    // NA  // End of work
    // NA  // Starting signal
    "×": "-..-",  // Multiplication sign (same as letter X)
    "@": ".--.-.",  // Commercial at

    // 3. Transmission of signs for which there is no corresponding signal in the Morse code
    // 3.1. Signs that have no corresponding signal in the Morse code,
    //      but that are acceptable in the writing of telegrams, shall
    //      be sent as follows:
    // 3.2. Multiplication sign
    // 3.2.1. For the multiplication sign, the signal corresponding to
    //        the letter X shall be transmitted.
    // NOTE: already listed in 1.1.3
    // 3.3. Percentage or per thousand sign
    // 3.3.1. To indicate the signal % or ‰, the figure 0, the fraction
    //        bar and the figures 0 or 00 shall be transmitted
    //        successively (i.e. 0/0, 0/00).
    "%": "----- -..-. -----",
    "‰": "----- -..-. ----- -----",
    // 3.3.2 A whole number, a fractional number, or a fraction,
    //       followed by a % or ‰ sign, shall be transmitted by joining
    //       up the whole number, the fraction number, or the fraction
    //       to the % or ‰ by a single hyphen.
    // TODO: This is not implemented
    // 3.4 Inverted commas (quotation marks)
    // 3.4.1 The special signal for inverted commas shall be transmitted
    //       before and after the word or words. However, where code
    //       converters are used, the apostrophe may be transmitted
    //       twice before and twice after the word or words to signal
    //       inverted commas (quotation marks).
    // NOTE: NA
    // 3.5 Minute and second signs
    // 3.5.1 To transmit the minute ( ′ ) or second ( ″ ) signs, when
    //       such signs follow figures – for example 1′15″ – the
    //       apostrophe signal (. − − − −.) must be used once or twice
    //       as appropriate. The signal (.− . . −.) reserved for
    //       inverted commas may not be used for the second sign.
    "′": ".----.",
    "″": ".----. .----.",

    // Non-standard punctuation marks
    "!": "-.-.--",
    "$": "...-..-",
    "`": ".-----.",
    ";": "-.-.-.",
    "&": ". ...",  // "es"

    // non-Latin extensions (from https://en.wikipedia.org/wiki/Morse_code#Letters,_numbers,_punctuation,_prosigns_for_Morse_code_and_non-Latin_variants)
    // Uppercase    Lowercase
    "À": ".--.-",   "à": ".--.-",
    "Ä": ".-.-",    "ä": ".-.-",
    "Å": ".--.-",   "å": ".--.-",
    "Ą": ".-.-",    "ą": ".-.-",
    "Æ": ".-.-",    "æ": ".-.-",
    "Ć": "-.-..",   "ć": "-.-..",
    "Ĉ": "-.-..",   "ĉ": "-.-..",
    "Ç": "-.-..",   "ç": "-.-..",
    /* "CH": "----", "ch": "----" */
    "Đ": "..-..",   "đ": "..-..",
    "Ð": "..--.",   "ð": "..--.",
    "É": "..-..",   "é": "..-..",
    "È": ".-..-",   "è": ".-..-",
    "Ę": "..-..",   "ę": "..-..",
    "Ĝ": "--.-.",   "ĝ": "--.-.",
    "Ĥ": "----",    "ĥ": "----",
    "Ĵ": ".---.",   "ĵ": ".---.",
    "Ł": ".-..-",   "ł": ".-..-",
    "Ń": "--.--",   "ń": "--.--",
    "Ñ": "--.--",   "ñ": "--.--",
    "Ó": "---.",    "ó": "---.",
    "Ö": "---.",    "ö": "---.",
    "Ø": "---.",    "ø": "---.",
    "Ś": "...-...", "ś": "...-...",
    "Ŝ": "...-.",   "ŝ": "...-.",
    "Š": "----",    "š": "----",
    "Þ": ".--..",   "þ": ".--..",
    "Ü": "..--",    "ü": "..--",
    "Ŭ": "..--",    "ŭ": "..--",
    "Ź": "--..-.",  "ź": "--..-.",
    "Ż": "--..-.",  "ż": "--..-.",

    // other characters without a reference
    // Uppercase    Lowercase
    /* "SS" */      "ß": "...--..",
    "Á": ".--.-",   "á": ".--.-",
    "Œ": "---.",    "œ": "---.",
    "Ì": ".---.",   "ì": ".---.",

    // mapping of other Latin characters with diacritics to standard characters
    // Uppercase    Lowercase
    // A
    "Â": ".-",      "â": ".-",
    "Ã": ".-",      "ã": ".-",
    "Ā": ".-",      "ā": ".-",
    "Ă": ".-",      "ă": ".-",
    // C
    "Ċ": "-.-.",    "ċ": "-.-.",
    "Č": "-.-.",    "č": "-.-.",
    // D
    "Ď": "-..",     "ď": "-..",
    // E
    "Ê": ".",       "ê": ".",
    "Ë": ".",       "ë": ".",
    "Ē": ".",       "ē": ".",
    "Ĕ": ".",       "ĕ": ".",
    "Ė": ".",       "ė": ".",
    "Ě": ".",       "ě": ".",
    // G
    "Ğ": "--.",     "ğ": "--.",
    "Ġ": "--.",     "ġ": "--.",
    "Ģ": "--.",     "ģ": "--.",
    // H
    "Ħ": "....",    "ħ": "....",
    // I
    "Í": "..",      "í": "..",
    "Î": "..",      "î": "..",
    "Ï": "..",      "ï": "..",
    "Ĩ": "..",      "ĩ": "..",
    "Ī": "..",      "ī": "..",
    "Ĭ": "..",      "ĭ": "..",
    "Į": "..",      "į": "..",
    // IJ
    "Ĳ": ".. .---", "ĳ": ".. .---",
    // K
    "Ķ": "-.-",     "ķ": "-.-",
    /* NA */        "ĸ": "-.-",
    // L
    "Ĺ": ".-..",    "ĺ": ".-..",
    "Ļ": ".-..",    "ļ": ".-..",
    "Ľ": ".-..",    "ľ": ".-..",
    "Ŀ": ".-..",    "ŀ": ".-..",
    // N
    "Ņ": "-.",      "ņ": "-.",
    "Ň": "-.",      "ň": "-.",
    /* "ʼN" */      "ŉ": "-.",
    "Ŋ": "-.",      "ŋ": "-.",
    // O
    "Ò": "---",     "ò": "---",
    "Ô": "---",     "ô": "---",
    "Õ": "---",     "õ": "---",
    "Ō": "---",     "ō": "---",
    "Ŏ": "---",     "ŏ": "---",
    "Ő": "---",     "ő": "---",
    // R
    "Ŕ": ".-.",     "ŕ": ".-.",
    "Ŗ": ".-.",     "ŗ": ".-.",
    "Ř": ".-.",     "ř": ".-.",
    // S
    "Ş": "...",     "ş": "...",
    // T
    "Ţ": "-",       "ţ": "-",
    "Ť": "-",       "ť": "-",
    "Ŧ": "-",       "ŧ": "-",
    // U
    "Ù": "..-",     "ù": "..-",
    "Ú": "..-",     "ú": "..-",
    "Û": "..-",     "û": "..-",
    "Ũ": "..-",     "ũ": "..-",
    "Ū": "..-",     "ū": "..-",
    "Ů": "..-",     "ů": "..-",
    "Ű": "..-",     "ű": "..-",
    "Ų": "..-",     "ų": "..-",
    // W
    "Ŵ": ".--",     "ŵ": ".--",
    // Y
    "Ý": "-.--",    "ý": "-.--",
    "Ŷ": "-.--",    "ŷ": "-.--",
    "Ÿ": "-.--",    "ÿ": "-.--",
    // Z
    "Ž": "--..",    "ž": "--..",

    // Greek Morse code
    // Wikipedia: The Greek Morse code alphabet is very similar to the
    //            Latin alphabet. It uses one extra letter for Greek
    //            letter Χ and no longer uses the codes for Latin
    //            letters "J", "U" and "V".
    // https://en.wikipedia.org/wiki/Morse_code_for_non-Latin_alphabets#Greek
    // Uppercase  Lowercase     Lowercase in word-final position
    "Α": ".-",    "α": ".-",
    "Β": "-...",  "β": "-...",
    "Γ": "--.",   "γ": "--.",
    "Δ": "-..",   "δ": "-..",
    "Ε": ".",     "ε": ".",
    "Ζ": "--..",  "ζ": "--..",
    "Η": "....",  "η": "....",
    "Θ": "-.-.",  "θ": "-.-.",
    "Ι": "..",    "ι": "..",
    "Κ": "-.-",   "κ": "-.-",
    "Λ": ".-..",  "λ": ".-..",
    "Μ": "--",    "μ": "--",
    "Ν": "-.",    "ν": "-.",
    "Ξ": "-..-",  "ξ": "-..-",
    "Ο": "---",   "ο": "---",
    "Π": ".--.",  "π": ".--.",
    "Ρ": ".-.",   "ρ": ".-.",
    "Σ": "...",   "σ": "...",   "ς": "...",
    "Τ": "-",     "τ": "-",
    "Υ": "-.--",  "υ": "-.--",
    "Φ": "..-.",  "φ": "..-.",
    "Χ": "----",  "χ": "----",
    "Ψ": "--.-",  "ψ": "--.-",
    "Ω": ".--",   "ω": ".--",

    // Russian Morse code for Cyrillic
    // https://en.wikipedia.org/wiki/Russian_Morse_code (1857)
    // Полное собрание законов Российской Империи. Собрание Второе
    // These are listed in the order of the Wikipedia page (alphabetical
    // order of the corresponding latin script character)
    // Uppercase  Lowercase
    "А": ".-",    "а": ".-",    // a
    "Б": "-...",  "б": "-...",  // be
    "В": ".--",   "в": ".--",   // ve
    "Г": "--.",   "г": "--.",   // ghe
    "Д": "-..",   "д": "-..",   // de
    "Е": ".",     "е": ".",     // ie
    "Ж": "...-",  "ж": "...-",  // zhe
    "З": "--..",  "з": "--..",  // ze
    "И": "..",    "и": "..",    // i
    "Й": ".---",  "й": ".---",  // short i
    "К": "-.-",   "к": "-.-",   // ka
    "Л": ".-..",  "л": ".-..",  // el
    "М": "--",    "м": "--",    // em
    "Н": "-.",    "н": "-.",    // en
    "О": "---",   "о": "---",   // o
    "П": ".--.",  "п": ".--.",  // pe
    "Р": ".-.",   "р": ".-.",   // er
    "С": "...",   "с": "...",   // es
    "Т": "-",     "т": "-",
    "У": "..-",   "у": "..-",   // u
    "Ф": "..-.",  "ф": "..-.",  // ef
    "Х": "....",  "х": "....",  // ha
    "Ц": "-.-.",  "ц": "-.-.",  // tse
    "Ч": "---.",  "ч": "---.",  // che
    "Ш": "----",  "ш": "----",  // sha
    "Щ": "--.-",  "щ": "--.-",  // shcha
    "Ъ": "-..-",  "ъ": "-..-",  // hard sign
    "Ы": "-.--",  "ы": "-.--",  // yeru
    "Ь": "-..-",  "ь": "-..-",  // soft sign
    "Ѣ": "..-..", "ѣ": "..-..", // yat, in Wikipedia article and in Russian law document
    "Э": "..-..", "э": "..-..", // e, in Wikipedia article only
    "Ю": "..--",  "ю": "..--",  // yu
    "Я": ".-.-",  "я": ".-.-",  // ya

    // mapping of other Cyrillic characters to standard ones
    "Ѐ": ".",     "ѐ": ".",    // ie with grave
    "Ё": ".",     "ё": ".",    // io
    "Є": ".",     "є": ".",    // ukrainian  ie
    "І": "..",    "і": "..",   // byelorussian-ukrainian i
    "Ї": "..",    "ї": "..",   // yi
    "Ј": ".---",  "ј": ".---", // je
    "Ћ": "-.-.",  "ћ": "-.-.", // tshe
    "Ѝ": "..",    "ѝ": "..",   // i with grave
    "Ў": "..-",   "ў": "..-",  // short u

    // phonetic decomposition of other Cyrillic characters
    "Ђ": "-.. .---",  "ђ": "-.. .---",  // dje
    "Ѓ": "--. .---",  "ѓ": "--. .---",  // gje
    "Ѕ": "-.. --..",  "ѕ": "-.. --..",  // dze
    "Љ": ".-.. .---", "љ": ".-.. .---", // lje
    "Њ": "-. .---",   "њ": "-. .---",   // nje
    "Ќ": "-.- .---",  "ќ": "-.- .---",  // kje
    "Џ": "-.. --..",  "џ": "-.. --..",  // dzhe

    // Wabun code for Japanese, tnx JE1TRV
    // https://en.wikipedia.org/wiki/Wabun_code
    // https://www.rfcafe.com/references/qst/japanese-morse-telegraph-code-sep-1942-qst.htm (1942)
    // https://web.archive.org/web/20220129114408/https://elaws.e-gov.go.jp/data/325M50080000017_20200622_502M60000008061/pict/S25F30901000017-001.pdf (1945?)
    // 1. Kanas without any diacritics (dakuten or handakuten)
    // Katakana    Hiragana
    "イ": ".-",    "い": ".-",     // i
    "ロ": ".-.-",  "ろ": ".-.-",   // ro
    "ハ": "-...",  "は": "-...",   // ha
    "ニ": "-.-.",  "に": "-.-.",   // ni
    "ホ": "-..",   "ほ": "-..",    // ho
    "ヘ": ".",     "へ": ".",      // he
    "ト": "..-..", "と": "..-..",  // to
    "チ": "..-.",  "ち": "..-.",   // ti
    "リ": "--.",   "り": "--.",    // ri
    "ヌ": "....",  "ぬ": "....",   // nu
    "ル": "-.--.", "る": "-.--.",  // ru
    "ヲ": ".---",  "を": ".---",   // wo
    "ワ": "-.-",   "わ": "-.-",    // wa
    "カ": ".-..",  "か": ".-..",   // ka
    "ヨ": "--",    "よ": "--",     // yo
    "ョ": "--",    "ょ": "--",     // yo
    "タ": "-.",    "た": "-.",     // ta
    "レ": "---",   "れ": "---",    // re
    "ソ": "---.",  "そ": "---.",   // so
    "ツ": ".--.",  "つ": ".--.",   // tu
    "ッ": ".--.",  "っ": ".--.",   // tu
    "ネ": "--.-",  "ね": "--.-",   // ne
    "ナ": ".-.",   "な": ".-.",    // na
    "ラ": "...",   "ら": "...",    // ra
    "ム": "-",     "む": "-",      // mu
    "ウ": "..-",   "う": "..-",    // u
    "ヰ": ".-..-", "ゐ": ".-..-",  // wi
    "ノ": "..--",  "の": "..--",   // no
    "オ": ".-...", "お": ".-...",  // o
    "ク": "...-",  "く": "...-",   // ku
    "ヤ": ".--",   "や": ".--",    // ya
    "ャ": ".--",   "ゃ": ".--",    // ya
    "マ": "-..-",  "ま": "-..-",   // ma
    "ケ": "-.--",  "け": "-.--",   // ke
    "フ": "--..",  "ふ": "--..",   // fu
    "コ": "----",  "こ": "----",   // ko
    "エ": "-.---", "え": "-.---",  // e
    "テ": ".-.--", "て": ".-.--",  // te
    "ア": "--.--", "あ": "--.--",  // a
    "サ": "-.-.-", "さ": "-.-.-",  // sa
    "キ": "-.-..", "き": "-.-..",  // ki
    "ユ": "-..--", "ゆ": "-..--",  // yu
    "ュ": "-..--", "ゅ": "-..--",  // yu
    "メ": "-...-", "め": "-...-",  // me
    "ミ": "..-.-", "み": "..-.-",  // mi
    "シ": "--.-.", "し": "--.-.",  // si
    "ヱ": ".--..", "ゑ": ".--..",  // we
    "ヒ": "--..-", "ひ": "--..-",  // hi
    "モ": "-..-.", "も": "-..-.",  // mo
    "セ": ".---.", "せ": ".---.",  // se
    "ス": "---.-", "す": "---.-",  // su
    "ン": ".-.-.", "ん": ".-.-.",  // n
    // 2. Kanas with dakuten
    "゛": "..", // Dakuten modifier
    // Katakanas        Hiraganas
    "ガ": ".-.. ..",     "が": ".-.. ..",    // ga
    "ギ": "-.-.. ..",    "ぎ": "-.-.. ..",   // gi
    "グ": "...- ..",     "ぐ": "...- ..",    // gu
    "ゲ": "-.-- ..",     "げ": "-.-- ..",    // ge
    "ゴ": "---- ..",     "ご": "---- ..",    // go
    "ザ": "-.-.- ..",    "ざ": "-.-.- ..",   // za
    "ジ": "--.-. ..",    "じ": "--.-. ..",   // zi
    "ズ": "---.- ..",    "ず": "---.- ..",   // zu
    "ゼ": ".---. ..",    "ぜ": ".---. ..",   // ze
    "ゾ": "---. ..",     "ぞ": "---. ..",    // zo
    "ダ": "-. ..",       "だ": "-. ..",      // da
    "ヂ": "..-. ..",     "ぢ": "..-. ..",    // di
    "ヅ": ".--. ..",     "づ": ".--. ..",    // du
    "デ": ".-.-- ..",    "で": ".-.-- ..",   // de
    "ド": "..-.. ..",    "ど": "..-.. ..",   // do
    "バ": "-... ..",     "ば": "-... ..",    // ba
    "ビ": "--..- ..",    "び": "--..- ..",   // bi
    "ブ": "--.. ..",     "ぶ": "--.. ..",    // bu
    "ベ": ". ..",        "べ": ". ..",       // be
    "ボ": "-.. ..",      "ぼ": "-.. ..",     // bo
    // 3. Kanas with handakuten
    "゜": "..--.", // Handakuten modifier
    // Katakanas        Hiraganas
    "パ": "-... ..--.",  "ぱ": "-... ..--.", // pa
    "ピ": "--..- ..--.", "ぴ": "--..- ..--.",// pi
    "プ": "--.. ..--.",  "ぷ": "--.. ..--.", // pu
    "ペ": ". ..--.",     "ぺ": ". ..--.",    // pe
    "ポ": "-.. ..--.",   "ぽ": "-.. ..--.",  // po
    // 4. Other characters in the Wabun code
    "－": ".--.-",   // -
    "ー": ".--.-",   // -
    "（": "-.--.-",  // (
    "）": ".-..-.",  // )
    "、": ".-.-.-",  // .
    "」": ".-.-..",  // \n

    // SKATS for Korean
    // The ARRL handbook for the radio amateur, 19-3 (1985)
    // https://archive.org/details/arrlhandbookforr0000unse_w7j4/page/n415/mode/2up
    "ㄱ": ".-..",    // kiyeok
    "ㄴ": "..-.",    // nieun
    "ㄷ": "-...",    // tikeut
    "ㄹ": "...-",    // rieul
    "ㅁ": "--",      // mieum
    "ㅂ": ".--",     // pieup
    "ㅅ": "--.",     // sios
    "ㅇ": "-.-",     // ieung
    "ㅈ": ".--.",    // cieuc
    "ㅊ": "-.-.",    // chieuch
    "ㅋ": "-..-",    // khieukh
    "ㅌ": "--..",    // thieuth
    "ㅍ": "---",     // phieuph
    "ㅎ": ".---",    // hieuh
    "ㅏ": ".",       // a
    "ㅐ": "--.-",    // ae
    "ㅑ": "..",      // ya
    "ㅒ": ".. ..-",  // yae
    "ㅓ": "-",       // eo
    "ㅔ": "-.--",    // e
    "ㅕ": "...",     // yeo
    "ㅖ": "... ..-", // ye
    "ㅗ": ".-",      // o
    "ㅛ": "-.",      // yo
    "ㅜ": "....",    // u
    "ㅠ": ".-.",     // yu
    "ㅡ": "-..",     // eu
    "ㅣ": "..-",     // i

    // Hebrew
    // The ARRL handbook for the radio amateur, 19-3 (1985)
    // https://archive.org/details/arrlhandbookforr0000unse_w7j4/page/n415/mode/2up
    "א": ".-",    // alef
    "ב": "-...",  // bet
    "בּ": "-...",  // dotted bet
    "ג": "--.",   // gimel
    "גּ": "--.",   // dotted gimel
    "ד": "-..",   // dalet
    "דּ": "-..",   // dotted dalet
    "ה": "---",   // he
    "ו": ".",     // vav
    "ז": "--..",  // zayin
    "ח": "....",  // chet
    "ט": "..-",   // tet
    "י": "..",    // yod
    "ך": "-.-",   // final kaf
    "ךּ": "-.-",   // dotted final kaf
    "כ": "-.-",   // kaf
    "כּ": "-.-",   // dotted kaf
    "ל": ".-..",  // lamed
    "ם": "--",    // final mem
    "מ": "--",    // mem
    "ן": "-.",    // final nun
    "נ": "-.",    // nun
    "ס": "-.-.",  // samekh
    "ע": ".---",  // ayin
    "ף": ".--.",  // final pe
    "ףּ": ".--.",  // final pe
    "פ": ".--.",  // pe
    "פּ": ".--.",  // dotted pe
    "ץ": ".--",   // final tsadi
    "צ": ".--",   // tsadi
    "ק": "--.-",  // qof
    "ר": ".-.",   // resh
    "ש": "...",   // dotless shin
    "שׁ": "...",   // right-dotted shin
    "שׂ": "...",   // left-dotted shin
    "ת": "-",     // dotless tav
    "תּ": "-",     // dotted tav

    // Arabic
    // The ARRL handbook for the radio amateur, 19-3 (1985)
    // https://archive.org/details/arrlhandbookforr0000unse_w7j4/page/n415/mode/2up
    // Unicode points were copied from “Isolated form”, and names from “Letter name” in
    // https://en.wikipedia.org/wiki/Arabic_alphabet#Table_of_basic_letters
    // TODO: add contextual forms
    "ا": ".-",     // ʾalif
    "ب": "-...",   // bāʾ/bah
    "ت": "-",      // tāʾ/tah
    "ث": "-.-.",   // thāʾ/thah
    "ج": ".---",   // jīm
    "ح": "....",   // ḥāʾ/ḥah
    "خ": "---",    // khāʾ/khah
    "د": "-..",    // dāl/dāʾ/dah
    "ذ": "--..",   // dhāl/dhāʾ/dhah
    "ر": ".-.",    // rāʾ/rah
    "ز": "---.",   // zāy/zayn/zāʾ/zah
    "س": "...",    // sīn
    "ش": "----",   // shīn
    "ص": "-..-",   // ṣād
    "ض": "...-",   // ḍād/ḍāʾ/ḍah
    "ط": "..-",    // ṭāʾ/ṭah
    "ظ": "-.--",   // ẓāʾ/ẓah
    "ع": ".-.-",   // ʿayn
    "غ": "--.",    // ghayn
    "ف": "..-.",   // fāʾ/fah
    "ق": "--.-",   // qāf
    "ڪ": "-.-",    // kāf/kāʾ/kah
    "ك": "-.-",    // kāf/kāʾ/kah
    "ل": ".-..",   // lām
    "م": "--",     // mīm
    "ن": "-.",     // nūn
    "ه": "..-..",  // hāʾ/hah
    "و": ".--",    // wāw
    "ے": "..",     // yāʾ/yah
    "ي": "..",     // yāʾ/yah
    "لا": ".-...-", // lām-alif (ligature)
    // other characters without a reference
    "ء": ".",      // hamzah
};

/**
 * @param {import("./types").MorsePlayerParams} params
 */
function MorsePlayer(params) {
    const audioContext = new AudioContext();

    // default parameters
    const wpm = params?.wpm || 20;
    let frequency = params?.frequency || 600;
    const volume = params?.volume || 1;
    let filterFrequency = params?.filterFrequency || frequency;
    const q = params?.q || 10;
    const onOn = params?.onOn;
    const onOff = params?.onOff;
    const onCharacterPlayed = params?.onCharacterPlayed;
    let onFinished = params?.onFinished;

    // set audio rendering pipeline:
    // 1. oscillator
    // 2. modulationGain
    // 3. gainLimiter
    // 4. biquadFilter
    // 5. volumeGain
    // control volume
    const volumeGain = audioContext.createGain();
    volumeGain.gain.value = volume;
    volumeGain.connect(audioContext.destination);
    // biquad filter to set filter frequency and Q
    const biquadFilter = audioContext.createBiquadFilter();
    biquadFilter.type = "lowpass";
    biquadFilter.frequency.setValueAtTime(filterFrequency, 0);
    biquadFilter.Q.setValueAtTime(q, 0);
    biquadFilter.connect(volumeGain);
    // avoid clipping with high Q filters
    const gainLimiter = audioContext.createGain();
    gainLimiter.gain.value = 0.4; // TODO
    gainLimiter.connect(biquadFilter);
    // modulate the CW
    const modulationGain = audioContext.createGain();
    modulationGain.gain.value = 0;
    modulationGain.connect(gainLimiter);
    // generate the carrier
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, 0);
    oscillator.connect(modulationGain);
    oscillator.start();

    // end of the last pushed event (typically, end of the last dit or dah being played)
    let endTime = 0;
    // start of the last element that has been played (real time)
    /** @type {number | undefined} */
    let lastElementStartTime = undefined;

    // 1 word = "PARIS" = ".--. .- .-. .. ..." = duration of 50 dots
    // thus, at a given wpm, there are 50 * wpm / 60 dots per second
    // so a dot lasts for 1.2 / wpm seconds
    const dotDuration = 1.2 / wpm;

    /** @type {number | undefined} */
    let finishedTimeout = undefined;
    /** @type {number[]} */
    const otherTimeouts = [];

    this.on = () => {
        this.stop(); // clear timeouts and play schedule
        resetTimeouts();
        modulationGain.gain.setValueAtTime(0.5, endTime);
        onOn?.();
        lastElementStartTime = Date.now();
    };

    this.off = () => {
        resetTimeouts();
        modulationGain.gain.setValueAtTime(0, endTime);
        if (onOff !== undefined && lastElementStartTime !== undefined) {
            const elementDuration = (Date.now() - lastElementStartTime) / 1000;
            onOff(elementDuration);
        }
    };

    /**
     *  @param {number} now
     *  @param {number} elementDuration
     */
    function pushElement(now, elementDuration) {
        modulationGain.gain.setValueAtTime(0.5, endTime);
        if (onOn !== undefined) {
            otherTimeouts.push(setTimeout(onOn, (endTime - now) * 1000));
        }
        endTime += elementDuration;
        modulationGain.gain.setValueAtTime(0, endTime);
        if (onOff !== undefined) {
            otherTimeouts.push(setTimeout(onOff, (endTime - now) * 1000, elementDuration));
        }
        endTime += dotDuration; // inter-element gap
    }

    /**
     *  @param {string} rawMorse
     */
    // Example: morsePlayer.push("-- --- .-. ... . / -.-. --- -.. .");
    this.push = (rawMorse) => {
        // ignore spaces around "/"
        const morse = rawMorse.replace(/\s*\/\s*/g, "/");

        // if we are done playing stuff, start again
        const now = audioContext.currentTime;
        if (now > endTime) {
            // leave 10ms of delay to give room for the AudioContext to react,
            // and avoid clipping the start of the element
            endTime = now + 0.1;
        }

        // set gain to 0 or 0.5 to modulate CW
        // NOTE: use 0.5 to have the same volume as jscwlib
        for (const c of morse) {
            if (c === ".") {
                pushElement(now, dotDuration);
            } else if (c === "-") {
                pushElement(now, dotDuration * 3);
            } else if (c === " ") {
                // short gap / character space
                endTime += 3 * dotDuration;
            } else if (c === "/") {
                // medium gap / word space
                endTime += 7 * dotDuration;
            }
        }

        clearTimeout(finishedTimeout);
        if (onFinished !== undefined) {
            finishedTimeout = setTimeout(onFinished, (endTime - now) * 1000);
        }
    };

    /**
     *  @param {string} text
     */
    this.pushText = function (text) {
        // if we are done playing stuff, start again
        const now = audioContext.currentTime;
        if (now > endTime) {
            // leave 10ms of delay to give room for the AudioContext to react,
            // and avoid clipping the start of the first element
            endTime = now + 0.1;
        }

        for (const c of text) {
            if (c === " ") {
                // medium gap / word space
                endTime += 7 * dotDuration;
            } else {
                if (onCharacterPlayed !== undefined) {
                    otherTimeouts.push(setTimeout(onCharacterPlayed, (endTime - now) * 1000, c));
                }
                this.push(morseOfCharacter[c] || "?");
                // short gap / character space
                endTime += 3 * dotDuration;
            }
        }
    };

    function resetTimeouts() {
        clearTimeout(finishedTimeout);
        otherTimeouts.splice(0).forEach(clearTimeout);
    }

    this.stop = () => {
        endTime = 0;
        modulationGain.gain.cancelScheduledValues(audioContext.currentTime);
        modulationGain.gain.setValueAtTime(0, audioContext.currentTime);
        resetTimeouts();
    };

    this.close = () => {
        resetTimeouts();
        audioContext.close();
    };

    /**
     *  @param {number} newFrequency
     */
    this.setFrequency = (newFrequency) => {
        frequency = newFrequency;
        filterFrequency = newFrequency;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        biquadFilter.frequency.setValueAtTime(filterFrequency, audioContext.currentTime);
    };

    /**
     *  @param {(() => void) | undefined} callback
     */
    this.setOnFinishedCallback = (callback) => {
        onFinished = callback;
    };

    /**
     *  @return {number}
     */
    this.remainingTime = () => {
        return Math.max(endTime - audioContext.currentTime, 0);
    };
}
