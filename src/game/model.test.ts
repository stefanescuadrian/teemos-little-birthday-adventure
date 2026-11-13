import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gameReducer,
  initialProgress,
  readProgress,
  readSettings,
  SETTINGS_KEY,
  stageReady,
  STORAGE_KEY,
  validateProgress,
  type Progress,
} from './model';
import { itemsForStage } from './missions';
import { config, migrateLegacyAttribution } from '../config';

function collectStage(state: Progress): Progress {
  return itemsForStage(state.stage).reduce((progress, item) =>
    gameReducer(progress, { type: 'collect', id: item.id }), state);
}

function playToCrossroads(): Progress {
  let state = gameReducer(initialProgress(), { type: 'start' });
  state = collectStage(state);
  state = gameReducer(state, { type: 'next' });
  state = gameReducer(state, { type: 'collect', id: 'water' });
  state = gameReducer(state, { type: 'collect', id: 'sun' });
  state = gameReducer(state, { type: 'bloom' });
  return gameReducer(state, { type: 'next' });
}

test('the adventure gates each mission until its objective is complete', () => {
  let state = initialProgress();
  assert.equal(gameReducer(state, { type: 'next' }), state);
  assert.equal(gameReducer(state, { type: 'collect', id: 'm1' }), state);
  state = gameReducer(state, { type: 'start' });
  assert.equal(state.started, true);

  for (let index = 0; index < 4; index++) {
    state = gameReducer(state, { type: 'collect', id: `m${index + 1}` });
    assert.equal(stageReady(state), false);
    assert.equal(gameReducer(state, { type: 'next' }), state);
    assert.deepEqual(state.journal, []);
  }
  state = gameReducer(state, { type: 'collect', id: 'm5' });
  assert.equal(stageReady(state), true);
  assert.deepEqual(state.journal, ['mushrooms']);
  state = gameReducer(state, { type: 'next' });
  assert.equal(state.stage, 1);
  assert.equal(stageReady(state), false);
  assert.deepEqual(state.collected[0], ['m1', 'm2', 'm3', 'm4', 'm5']);
});

test('collection is idempotent and only accepts current mission items', () => {
  let state = gameReducer(initialProgress(), { type: 'start' });
  assert.equal(gameReducer(state, { type: 'collect', id: 'water' }), state);
  assert.equal(gameReducer(state, { type: 'collect', id: 'unknown' }), state);
  state = gameReducer(state, { type: 'collect', id: 'm1' });
  assert.equal(gameReducer(state, { type: 'collect', id: 'm1' }), state);
  assert.deepEqual(state.collected[0], ['m1']);
  state = collectStage(state);
  const completed = collectStage(state);
  assert.equal(completed, state);
  assert.deepEqual(completed.journal, ['mushrooms']);
});

test('the flower requires both water and sunlight before it can bloom', () => {
  let state = gameReducer(initialProgress(), { type: 'start' });
  assert.equal(gameReducer(state, { type: 'bloom' }), state);
  state = gameReducer(collectStage(state), { type: 'next' });
  assert.equal(gameReducer(state, { type: 'collect', id: 'flower' }), state);
  assert.equal(gameReducer(state, { type: 'bloom' }), state);
  state = gameReducer(state, { type: 'collect', id: 'water' });
  assert.equal(gameReducer(state, { type: 'bloom' }), state);
  assert.equal(gameReducer(state, { type: 'next' }), state);
  state = gameReducer(state, { type: 'collect', id: 'sun' });
  assert.equal(stageReady(state), false);
  state = gameReducer(state, { type: 'bloom' });
  assert.equal(stageReady(state), true);
  assert.equal(state.flowerBloomed, true);
  assert.deepEqual(state.collected[1], ['water', 'sun', 'flower']);
  assert.deepEqual(state.journal, ['mushrooms', 'flower']);
  state = gameReducer(state, { type: 'bloom' });
  assert.equal(state.collected[1].length, 3);
  assert.equal(state.journal.filter(id => id === 'flower').length, 1);
});

for (const route of ['path-flowers', 'path-ferns']) {
  test(`all six missions complete through ${route}, preserving the journal and secret`, () => {
    let state = playToCrossroads();
    assert.equal(state.stage, 2);
    assert.equal(gameReducer(state, { type: 'next' }), state);
    state = gameReducer(state, { type: 'surprise' });
    state = gameReducer(state, { type: 'surprise' });
    assert.equal(state.journal.filter(id => id === 'secret').length, 1);
    state = gameReducer(state, { type: 'collect', id: route });
    assert.equal(state.route, route);
    assert.equal(stageReady(state), true);
    assert.equal(gameReducer(state, { type: 'collect', id: route === 'path-flowers' ? 'path-ferns' : 'path-flowers' }), state);

    state = gameReducer(state, { type: 'next' });
    for (let number = 1; number <= 4; number++) {
      state = gameReducer(state, { type: 'collect', id: `f${number}` });
      assert.ok(state.journal.includes(`firefly${number}` as keyof typeof config.messages));
      assert.equal(stageReady(state), number === 4);
    }
    state = gameReducer(state, { type: 'next' });
    assert.equal(state.stage, 4);
    assert.equal(gameReducer(state, { type: 'collect', id: 'chest' }), state);
    assert.equal(gameReducer(state, { type: 'next' }), state);
    // The UI dispatches unlock only after the keepsake puzzle is solved.
    state = gameReducer(state, { type: 'unlock' });
    assert.equal(state.chestSolved, true);
    assert.ok(state.journal.includes('compass'));
    assert.equal(stageReady(state), true);

    state = gameReducer(state, { type: 'next' });
    assert.equal(state.stage, 5);
    assert.equal(state.completed, false);
    assert.equal(gameReducer(state, { type: 'next' }), state);
    state = gameReducer(state, { type: 'collect', id: 'birthday-flower' });
    assert.equal(state.completed, true);
    assert.equal(stageReady(state), true);
    assert.ok(state.journal.includes('final'));
    assert.equal(gameReducer(state, { type: 'next' }), state);
    assert.equal(state.journal.length, Object.keys(config.messages).length);

    const restored = validateProgress(JSON.parse(JSON.stringify(state)));
    assert.deepEqual(restored, state);
    assert.deepEqual(restored.journal.map(id => config.messages[id]), state.journal.map(id => config.messages[id]));
  });
}

test('unlock is ignored outside the chest mission and reset returns a fresh adventure', () => {
  const pristine = initialProgress();
  assert.equal(gameReducer(pristine, { type: 'unlock' }), pristine);
  const played = gameReducer(playToCrossroads(), { type: 'surprise' });
  assert.deepEqual(gameReducer(played, { type: 'reset' }), initialProgress());
  const first = initialProgress();
  first.collected[0].push('m1');
  assert.deepEqual(initialProgress().collected[0], []);
});

test('save validation rejects malformed data and filters unknown or duplicate IDs', () => {
  for (const malformed of [null, 4, 'broken', [], {}, { version: 2 },
    { ...initialProgress(), stage: -1 },
    { ...initialProgress(), stage: 6 },
    { ...initialProgress(), stage: 0.5 },
    { ...initialProgress(), collected: [] },
    { ...initialProgress(), collected: [[], [], null, [], [], []] },
    { ...initialProgress(), collected: [[123], [], [], [], [], []] },
  ]) {
    assert.deepEqual(validateProgress(malformed), initialProgress());
  }
  const safe = validateProgress({
    ...initialProgress(),
    started: true,
    collected: [['m1', 'm1', 'water', 'unknown'], [], [], [], [], []],
    journal: ['secret', 'secret', '<script>bad</script>', 42],
    route: 'unexpected-road',
    flowerBloomed: 'yes', chestSolved: 1, completed: true,
  });
  assert.deepEqual(safe.collected[0], ['m1']);
  assert.deepEqual(safe.journal, ['secret']);
  assert.equal(safe.route, null);
  assert.equal(safe.flowerBloomed, false);
  assert.equal(safe.chestSolved, false);
  assert.equal(safe.completed, false);
});

test('progress loading tolerates unavailable storage and invalid JSON', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let saved: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem(key: string) { assert.equal(key, STORAGE_KEY); return saved; } },
  });
  try {
    assert.deepEqual(readProgress(), initialProgress());
    saved = '{not JSON';
    assert.deepEqual(readProgress(), initialProgress());
    const played = gameReducer(playToCrossroads(), { type: 'surprise' });
    saved = JSON.stringify(played);
    assert.deepEqual(readProgress(), played);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem() { throw new Error('Storage disabled'); } },
    });
    assert.deepEqual(readProgress(), initialProgress());
  } finally {
    if (originalDescriptor) Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});


test('previous attribution is migrated in saved settings without changing other preferences', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem(key: string) {
    assert.equal(key, SETTINGS_KEY);
    return JSON.stringify({ recipientName: 'BTY', senderName: 'un prieten', sound: true, voice: false, messages: {
      final: 'La mulți ani, din partea unui prieten!',
      firefly1: 'Un mesaj personalizat, păstrat exact.',
    } });
  } } });
  try {
    const restored = readSettings();
    assert.equal(restored.senderName, 'TDD Team');
    assert.equal(restored.recipientName, 'BTY');
    assert.equal(restored.sound, true);
    assert.equal(restored.voice, false);
    assert.equal(restored.messages.final, 'La mulți ani, din partea TDD Team!');
    assert.equal(restored.messages.firefly1, 'Un mesaj personalizat, păstrat exact.');
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('attribution migration handles old links and preserves other custom names', () => {
  assert.equal(migrateLegacyAttribution('un prieten'), 'TDD Team');
  assert.equal(migrateLegacyAttribution('Din partea unui prieten'), 'Din partea TDD Team');
  assert.equal(migrateLegacyAttribution('UN PRIETEN'), 'TDD Team');
  assert.equal(migrateLegacyAttribution('Echipa de exploratori'), 'Echipa de exploratori');
  assert.equal(migrateLegacyAttribution('TDD Team'), 'TDD Team');
});
