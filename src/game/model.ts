import { config, type MessageId, type Personalization } from '../config';
import { itemsForStage } from './missions';

export type Progress = {
  version: 1; started: boolean; stage: number; collected: string[][]; journal: MessageId[];
  flowerBloomed: boolean; chestSolved: boolean; route: string | null; completed: boolean; surpriseFound: boolean;
};
export const initialProgress = (): Progress => ({ version: 1, started: false, stage: 0, collected: [[], [], [], [], [], []], journal: [], flowerBloomed: false, chestSolved: false, route: null, completed: false, surpriseFound: false });
export type GameAction = { type: 'start' } | { type: 'collect'; id: string } | { type: 'bloom' } | { type: 'unlock' } | { type: 'next' } | { type: 'surprise' } | { type: 'reset' };
const addMessage = (state: Progress, id: MessageId): Progress => ({ ...state, journal: [...new Set([...state.journal, id])] });
export const stageReady = (s: Progress): boolean => {
  const c = s.collected[s.stage];
  return [c.length >= 5, s.flowerBloomed, !!s.route, c.length >= 4, s.chestSolved, s.completed][s.stage];
};
export function gameReducer(state: Progress, action: GameAction): Progress {
  if (action.type === 'reset') return initialProgress();
  if (action.type === 'start') return { ...state, started: true };
  if (action.type === 'surprise') return addMessage({ ...state, surpriseFound: true }, 'secret');
  if (action.type === 'next') return stageReady(state) && state.stage < 5 ? { ...state, stage: state.stage + 1 } : state;
  if (action.type === 'bloom') {
    if (state.stage !== 1 || !state.collected[1].includes('water') || !state.collected[1].includes('sun')) return state;
    const collected = state.collected.map((c, i) => i === 1 ? [...new Set([...c, 'flower'])] : c);
    return addMessage({ ...state, collected, flowerBloomed: true }, 'flower');
  }
  if (action.type === 'unlock') return state.stage === 4 ? addMessage({ ...state, chestSolved: true, collected: state.collected.map((c, i) => i === 4 ? ['chest'] : c) }, 'compass') : state;
  if (action.type === 'collect') {
    if (!state.started || !itemsForStage(state.stage).some(i => i.id === action.id) || state.collected[state.stage].includes(action.id)) return state;
    if (state.stage === 1 && action.id === 'flower') return state;
    if (state.stage === 4) return state; // The chest requires the keepsake puzzle.
    if (state.stage === 2 && state.route) return state;
    const collected = state.collected.map((c, i) => i === state.stage ? [...c, action.id] : c);
    let next = { ...state, collected };
    if (state.stage === 0 && collected[0].length === 5) next = addMessage(next, 'mushrooms');
    if (state.stage === 2) next = addMessage({ ...next, route: action.id }, 'paths');
    if (state.stage === 3) next = addMessage(next, `firefly${action.id.slice(1)}` as MessageId);
    if (state.stage === 5) next = addMessage({ ...next, completed: true }, 'final');
    return next;
  }
  return state;
}

export const STORAGE_KEY = 'teemo-birthday-progress-v1';
export const SETTINGS_KEY = 'teemo-birthday-settings-v1';
export function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProgress();
    return validateProgress(JSON.parse(raw));
  } catch { return initialProgress(); }
}
export function validateProgress(value: unknown): Progress {
  if (!value || typeof value !== 'object') return initialProgress();
  const s = value as Partial<Progress>;
  if (s.version !== 1 || !Number.isInteger(s.stage) || s.stage! < 0 || s.stage! > 5 || !Array.isArray(s.collected) || s.collected.length !== 6) return initialProgress();
  if (!s.collected.every(c => Array.isArray(c) && c.every(id => typeof id === 'string'))) return initialProgress();
  const p = initialProgress();
  p.started = s.started === true;
  p.stage = s.stage!;
  p.collected = s.collected.map((c, i) => [...new Set(c)].filter(id => itemsForStage(i).some(item => item.id === id)));
  p.journal = Array.isArray(s.journal) ? [...new Set(s.journal)].filter((id): id is MessageId => typeof id === 'string' && Object.hasOwn(config.messages, id)) : [];
  p.flowerBloomed = s.flowerBloomed === true;
  p.chestSolved = s.chestSolved === true;
  p.route = ['path-flowers', 'path-ferns'].includes(s.route || '') ? s.route! : null;
  p.completed = s.completed === true && p.stage === 5;
  p.surpriseFound = s.surpriseFound === true;
  return p;
}
export type Settings = Personalization & { sound: boolean; voice: boolean };
export function readSettings(): Settings {
  const defaults: Settings = { recipientName: config.recipientName, senderName: config.senderName, messages: { ...config.messages }, sound: false, voice: false };
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (!s || typeof s !== 'object') return defaults;
    return { ...defaults, recipientName: typeof s.recipientName === 'string' ? s.recipientName.slice(0, 40) : defaults.recipientName, senderName: typeof s.senderName === 'string' ? s.senderName.slice(0, 40) : defaults.senderName, sound: s.sound === true, voice: s.voice === true, messages: Object.fromEntries(Object.entries(defaults.messages).map(([id, text]) => [id, typeof s.messages?.[id] === 'string' && s.messages[id].trim() ? s.messages[id].slice(0, 5000) : text])) as Record<MessageId, string> };
  } catch { return defaults; }
}
