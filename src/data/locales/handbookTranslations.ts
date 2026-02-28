import { HANDBOOK_DATA, HandbookChapter, HandbookSection, HandbookEntry } from '../handbookData';

// ─── DICTIONARIES ───

import EN_DICT from './en_dict.json';
import DE_DICT from './de_dict.json';
import ES_DICT from './es_dict.json';
import ZH_DICT from './zh_dict.json';
import JA_DICT from './ja_dict.json';
import KO_DICT from './ko_dict.json';
import AR_DICT from './ar_dict.json';

// ─── TRANSLATOR ENGINE ───

function translateText(text: string, dict: Record<string, string>, fallbackDict?: Record<string, string>): string {
    if (!text) return text;
    // 1. Try Primary Dictionary
    if (dict && dict[text]) return dict[text];
    // 2. Try Fallback Dictionary (English)
    if (fallbackDict && fallbackDict[text]) return fallbackDict[text];

    // Fallback original text (Turkish)
    return text;
}

function processEntry(entry: HandbookEntry, dict: Record<string, string>, fallbackDict: Record<string, string>): HandbookEntry {
    return {
        ...entry,
        title: translateText(entry.title, dict, fallbackDict),
        content: translateText(entry.content, dict, fallbackDict),
        tags: entry.tags ? entry.tags.map(t => translateText(t, dict, fallbackDict)) : [],
        table: entry.table ? {
            headers: entry.table.headers.map(h => translateText(h, dict, fallbackDict)),
            rows: entry.table.rows.map(row => row.map(cell => translateText(cell, dict, fallbackDict)))
        } : undefined
    };
}

function processSection(section: HandbookSection, dict: Record<string, string>, fallbackDict: Record<string, string>): HandbookSection {
    return {
        ...section,
        title: translateText(section.title, dict, fallbackDict),
        entries: section.entries.map(e => processEntry(e, dict, fallbackDict))
    };
}

function processChapter(chapter: HandbookChapter, dict: Record<string, string>, fallbackDict: Record<string, string>): HandbookChapter {
    return {
        ...chapter,
        title: translateText(chapter.title, dict, fallbackDict),
        sections: chapter.sections.map(s => processSection(s, dict, fallbackDict))
    };
}

export function getLocalizedHandbookData(lang: string): HandbookChapter[] {
    if (lang === 'tr') return HANDBOOK_DATA;

    let dict: Record<string, string> = {};
    switch (lang) {
        case 'en': dict = EN_DICT; break;
        case 'de': dict = DE_DICT; break;
        case 'es': dict = ES_DICT; break;
        case 'zh': dict = ZH_DICT; break;
        case 'ja': dict = JA_DICT; break;
        case 'ko': dict = KO_DICT; break;
        case 'ar': dict = AR_DICT; break;
        default: dict = {}; break;
    }

    // Deep clone and translate with English as fallback for missing items
    return HANDBOOK_DATA.map(chapter => processChapter(chapter, dict, EN_DICT));
}
