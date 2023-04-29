export type Stat = {
    lastSession: number,
    bestSession: number,
    currentDay: number,
    bestDay: number,
    total: number,
};

export type Stats = {
    updated: Date,
    elapsed: Stat,
    copiedCharacters: Stat,
    copiedWords: Stat,
    score: Stat,
};

export type Settings = {
    wpm: number,
    tone: number,
    error_tone: number,
    word_length: number,
    charset: string,
};

export type Mistake = {
    expectedCharacter: string,
    mistakenCharacter: string,
};

export type HistoryEntry = {
    id: string,
    started: Date,
    finished: Date,
    copiedText: string,
    mistake: Mistake | null,
    settings: Settings,
    elapsed: number,
    copiedCharacters: number,
    copiedWords: number,
    score: number,
};

export type History = HistoryEntry[];
