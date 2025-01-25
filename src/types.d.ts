export type Stat = {
    lastSession: number,
    bestSession: number,
    currentDay: number,
    bestDay: number,
    bestDayDate: string,
    total: number,
};

export type Stats = {
    updated: Date,
    lastSessionStarted: string,
    elapsed: Stat,
    copiedCharacters: Stat,
    copiedGroups: Stat,
    score: Stat,
};

export type Settings = {
    wpm: number,
    tone: number,
    error_tone: number,
    min_group_size: number,
    max_group_size: number,
    charset: string,
    session_debounce_time: number,
};

export type SentCharacter = {
    time: string,
    character: string,
    duration: number,
};

export type ReceivedCharacter = {
    time: string,
    character: string,
};

export enum TransmissionResult {
    Correct    = "Correct",    // character A sent, character A received
    Incorrect  = "Incorrect",  // character A sent, character B received
    Pending    = "Pending",    // character sent, but never received (too slow, out of focus, earlier error)
    Extraneous = "Extraneous", // no character sent, but one received
}

export type TransmittedCharacter = {
    id?: string,
    sessionId: string,
    result: "Correct" | "Incorrect" | "Pending" | "Extraneous",
    sent?: SentCharacter,
    received?: ReceivedCharacter,
};

export type Mistake = {
    expectedCharacter: string,
    mistakenCharacter: string,
};

export type HistoryEntry = {
    id: string,
    started: string,
    finished: string,
    copiedText: string,
    mistake: Mistake | null,
    settings: Settings,
    elapsed: number,
    copiedCharacters: number,
    copiedGroups: number,
    score: number,
};

export type History = HistoryEntry[];

export type HTMLFormFieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
