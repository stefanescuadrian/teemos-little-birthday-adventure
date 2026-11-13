import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Code2, Compass, Flower2, HelpCircle, Leaf, Link, Map, RotateCcw, Settings2, Sparkles, Sprout, Volume2, VolumeX, X } from 'lucide-react';
import GameCanvas from './game/GameCanvas';
import { audio, speak, stopSpeech, speechSupported } from './game/audio';
import { renderBirthdayCard, saveBirthdayCard } from './game/card';
import { missions } from './game/missions';
import { gameReducer, readProgress, readSettings, stageReady, STORAGE_KEY, SETTINGS_KEY, type Settings } from './game/model';
import { config, messageTitles, messageIcons, migrateLegacyAttribution, type MessageId } from './config';
import Modal from './components/Modal';
import TeemoPortrait from './components/TeemoPortrait';
import Typewriter from './components/Typewriter';

type Dialog = { text: string; message?: MessageId; action?: 'start' | 'next' | 'birthday'; label?: string };
type Panel = 'journal' | 'settings' | 'help' | 'puzzle' | 'birthday' | 'reset' | null;
const entryIds = Object.keys(config.messages).filter(id => id !== 'secret') as MessageId[];

function loadSettings(): Settings {
  const settings = readSettings();
  try {
    if (!location.hash.startsWith('#cadou=')) return settings;
    const encoded = location.hash.slice(7);
    if (encoded.length > 65000) return settings;
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const shared = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof shared.recipientName === 'string') settings.recipientName = shared.recipientName.slice(0, 40);
    if (typeof shared.senderName === 'string') settings.senderName = migrateLegacyAttribution(shared.senderName.slice(0, 40)).trim() || config.senderName;
    for (const id of Object.keys(config.messages) as MessageId[]) {
      if (typeof shared.messages?.[id] === 'string' && shared.messages[id].trim()) settings.messages[id] = migrateLegacyAttribution(shared.messages[id].slice(0, 5000));
    }
  } catch { /* A damaged gift link falls back to the local/default configuration. */ }
  return settings;
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, readProgress);
  const [settings, setSettings] = useState(loadSettings);
  const [dialog, setDialog] = useState<Dialog | null>(() => state.started ? null : { text: config.intro, action: 'start' });
  const [panel, setPanel] = useState<Panel>(null);
  const [instant, setInstant] = useState(false);
  const [notice, setNotice] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);
  const [hint, setHint] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [puzzle, setPuzzle] = useState<string[]>([]);
  const [puzzleHint, setPuzzleHint] = useState('');
  const [cardError, setCardError] = useState('');
  const [savingCard, setSavingCard] = useState(false);
  const birthdayCanvas = useRef<HTMLCanvasElement>(null);
  const dialogButton = useRef<HTMLButtonElement>(null);
  const mission = missions[state.stage];
  const collected = state.collected[state.stage];
  const ready = stageReady(state);
  const completedCount = state.completed ? 6 : state.stage;
  const journalCount = state.journal.filter(id => id !== 'secret').length;
  const counter = state.stage === 4 ? Number(state.chestSolved) : state.stage === 2 ? Number(!!state.route) : collected.length;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { setStorageWarning(true); }
  }, [state]);
  useEffect(() => {
    audio.setEnabled(settings.sound);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
    catch { setStorageWarning(true); }
  }, [settings]);
  useEffect(() => () => { audio.dispose(); stopSpeech(); }, []);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 3800); return () => clearTimeout(timer); } }, [notice]);
  useEffect(() => {
    setInstant(false);
    if (dialog) {
      const frame = requestAnimationFrame(() => dialogButton.current?.focus({ preventScroll: true }));
      if (settings.voice && state.started && speechSupported) speak(dialog.text + (dialog.message ? ' ' + settings.messages[dialog.message] : ''));
      return () => { cancelAnimationFrame(frame); stopSpeech(); };
    }
  }, [dialog]); // Speaking follows the current dialogue; changing a preference never restarts it.
  useEffect(() => {
    if (panel === 'birthday' && birthdayCanvas.current) renderBirthdayCard(birthdayCanvas.current, settings.recipientName, settings.senderName);
  }, [panel, settings.recipientName, settings.senderName]);

  function showDialog(d: Dialog) { stopSpeech(); setDialog(d); setInstant(false); }
  function closePanel() {
    stopSpeech(); setPanel(null);
    requestAnimationFrame(() => {
      if (dialog) dialogButton.current?.focus({ preventScroll: true });
      else document.querySelector<HTMLCanvasElement>('.world-canvas')?.focus({ preventScroll: true });
    });
  }
  function returnToGame() { requestAnimationFrame(() => document.querySelector<HTMLCanvasElement>('.world-canvas')?.focus({ preventScroll: true })); }
  function advanceDialog() {
    audio.unlock(); audio.effect('click'); stopSpeech();
    if (dialog?.action === 'start') dispatch({ type: 'start' });
    if (dialog?.action === 'next') { dispatch({ type: 'next' }); setHint(false); }
    if (dialog?.action === 'birthday') setPanel('birthday');
    setDialog(null); returnToGame();
  }
  function complete(text: string, message: MessageId) { audio.effect('complete'); showDialog({ text, message, action: 'next' }); }
  function bloom() {
    dispatch({ type: 'bloom' }); audio.effect('bloom'); complete(config.dialogue.flower, 'flower');
  }
  function onItem(id: string) {
    audio.unlock();
    if (state.stage === 1 && id === 'flower') {
      if (collected.includes('water') && collected.includes('sun')) bloom();
      else showDialog({ text: 'Floarea noastră e puțin somnoroasă. O stropitoare și o rază de soare o vor ajuta să înflorească. Le căutăm împreună?' });
      return;
    }
    if (state.stage === 4) { setPuzzle([]); setPuzzleHint(''); setPanel('puzzle'); return; }
    if (collected.includes(id) || ready) return;
    dispatch({ type: 'collect', id }); audio.effect('collect');
    if (state.stage === 0) {
      if (collected.length === 4) complete(config.dialogue.mushrooms, 'mushrooms');
      else setNotice(['Una găsită! Patru mici experte în camuflaj rămase. 🍄', 'Două! Le-am numărat. De două ori. 🍄', 'Trei ciupercuțe! Coșulețul începe să se bucure.', 'Patru! Ultima sigur se crede invizibilă.'][collected.length]);
    }
    if (state.stage === 1) {
      if (collected.length === 1) showDialog({ text: 'Apă? Avem! Lumină? Avem! Acum întoarce-te la floare sau apasă „Ajută floarea”. Aici începe magia.' });
      else setNotice(id === 'water' ? 'Un strop de apă pentru un strop de magie. 💧' : 'O rază de soare, prinsă cu mare grijă. ☀️');
    }
    if (state.stage === 2) complete(config.dialogue.paths, 'paths');
    if (state.stage === 3) {
      const message = `firefly${id.slice(1)}` as MessageId;
      if (collected.length === 3) { audio.effect('magic'); showDialog({ text: config.dialogue.fireflies, message, action: 'next' }); }
      else showDialog({ text: ['Uite un licurici! Are un gând bun pentru tine.', 'Încă o luminiță. Pădurea parcă zâmbește.', 'Un mesaj mic, cu multă lumină în el.'][collected.length], message });
    }
    if (state.stage === 5) {
      audio.effect('surprise'); showDialog({ text: config.dialogue.final, action: 'birthday', label: 'Deschide surpriza' });
    }
  }
  function findSurprise() {
    if (state.surpriseFound) { setNotice('Fluturașul te recunoaște. Bine ai revenit! 🦋'); return; }
    dispatch({ type: 'surprise' }); audio.effect('surprise'); showDialog({ text: 'Hei! Ai descoperit fluturașul auriu. Prin puterea căștii mele, te declar exploratoare cu ochi de vultur!', message: 'secret' });
  }
  function solvePuzzle() {
    if (puzzle.join(',') === 'mushroom,flower,firefly') {
      dispatch({ type: 'unlock' }); closePanel(); complete(config.dialogue.compass, 'compass');
    } else {
      setPuzzleHint('Cufărul chicotește. Amintește-ți aventura: ciupercuțele, floarea, apoi licuricii. Mai încercăm!'); setPuzzle([]);
    }
  }
  async function saveCard() {
    setSavingCard(true); setCardError('');
    try { await saveBirthdayCard(settings.recipientName, settings.senderName); setNotice('Floarea ta e pregătită pentru a fi păstrată. 🌼'); }
    catch { setCardError('Imaginea nu a putut fi salvată. Încearcă din nou într-un browser complet, precum Chrome sau Safari.'); }
    finally { setSavingCard(false); }
  }
  async function copyGiftLink() {
    const customMessages = Object.fromEntries((Object.keys(config.messages) as MessageId[]).filter(id => settings.messages[id] !== config.messages[id]).map(id => [id, settings.messages[id]]));
    const bytes = new TextEncoder().encode(JSON.stringify({ recipientName: settings.recipientName.trim(), senderName: settings.senderName.trim(), messages: customMessages }));
    const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
    const url = `${location.origin}${location.pathname}#cadou=${encoded}`;
    setLinkText(url);
    try { await navigator.clipboard.writeText(url); setNotice('Linkul cadoului a fost copiat!'); }
    catch { setNotice('Selectează și copiază linkul din câmpul de mai jos.'); }
  }
  const updateMessage = (id: MessageId, text: string) => setSettings(s => ({ ...s, messages: { ...s.messages, [id]: text } }));
  const toggleSound = () => { audio.unlock(); setSettings(s => ({ ...s, sound: !s.sound })); };
  const toggleVoice = () => { stopSpeech(); setSettings(s => ({ ...s, voice: !s.voice })); };

  return <div className="app-shell" onPointerDown={() => audio.unlock()}>
    <header className="site-header">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); closePanel(); }} aria-label="Teemo's Little Birthday Adventure, aventura"><span className="brand-flower"><Flower2 size={28} strokeWidth={1.7} /></span><span><strong>Teemo's</strong><small>LITTLE BIRTHDAY ADVENTURE</small></span></a>
      <nav aria-label="Navigație principală"><button className={`nav-link ${!panel ? 'active' : ''}`} onClick={closePanel}><Map size={16} /> Aventură</button><button className={`nav-link ${panel === 'journal' ? 'active' : ''}`} onClick={() => setPanel('journal')}><BookOpen size={16} /> Jurnal <span className="nav-count">{state.journal.length}</span></button><button className="nav-link help-link" onClick={() => setPanel('help')}>Cum se joacă</button></nav>
      <div className="header-actions"><button className={`sound-toggle ${settings.sound ? 'on' : ''}`} onClick={toggleSound} aria-label={settings.sound ? 'Dezactivează sunetul' : 'Activează sunetul'} aria-pressed={settings.sound}>{settings.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}<span>Sunet {settings.sound ? 'pornit' : 'oprit'}</span></button><button className="icon-button settings-button" onClick={() => setPanel('settings')} aria-label="Personalizează cadoul"><Settings2 size={19} /></button></div>
    </header>

    <main>
      <section className="intro-heading" aria-labelledby="main-title">
        <div><div className="eyebrow"><span /> O MICĂ SURPRIZĂ, DIN SUFLET</div><h1 id="main-title">O aventură mică.<br />Un zâmbet <span>doar pentru tine.</span><svg className="title-sparkle" viewBox="0 0 40 50" aria-hidden="true"><path d="M15 2v14M2 12l9 5M31 8l-10 9M28 30l8 9" /></svg></h1><p>{settings.recipientName ? `${settings.recipientName}, Teemo ți-a pregătit` : 'Teemo ți-a pregătit'} o pădure plină de surprize și gânduri bune.<br className="desktop-break" /> Fără grabă. Fără griji. Doar puțină magie de ziua ta.</p></div>
        <div className="birthday-note"><span className="note-tape" /><Flower2 size={26} strokeWidth={1.3} /><p>Astăzi, aventura<br />e despre zâmbetul tău.</p><span className="note-signature">La mulți ani!</span><svg className="note-flourish" viewBox="0 0 60 20" aria-hidden="true"><path d="M2 15Q18 0 31 12T57 5" /></svg></div>
      </section>

      <div className="adventure-layout">
        <section className="game-section" aria-label="Aventura interactivă">
          <div className="game-frame">
            <GameCanvas stage={state.stage} collected={collected} paused={!state.started || !!dialog || !!panel} flowerBloomed={state.stage === 5 ? state.completed : state.flowerBloomed} celebrating={(state.stage === 3 && ready) || state.completed} route={state.route} onItem={onItem} onSurprise={findSurprise} />
            <div className="map-label"><span className="map-label-icon"><Leaf size={17} /></span><span><small>CAPITOLUL {String(state.stage + 1).padStart(2, '0')}</small><strong>{mission.location}</strong></span></div>
            <div className="map-badge"><span className="live-dot" /> În ritmul tău</div>
            <button className="map-help icon-button" onClick={() => setPanel('help')} aria-label="Ajutor pentru explorare"><HelpCircle size={20} /></button>
            <span className="world-caption">un loc bun pentru o mică pauză</span>
            {dialog && <div className={`dialogue ${dialog.message ? 'dialogue-message' : ''}`} role="dialog" aria-label="Teemo spune" onClick={() => setInstant(true)}>
              <div className="dialogue-avatar"><TeemoPortrait /><span className="avatar-sparkle">✦</span></div>
              <div className="dialogue-content"><div className="dialogue-name">TEEMO <span>•</span> <small>micul tău ghid</small>{speechSupported && <button className="read-button" onClick={e => { e.stopPropagation(); speak(dialog.text + (dialog.message ? ' ' + settings.messages[dialog.message] : '')); }} aria-label="Ascultă dialogul"><Volume2 size={15} /></button>}</div><p className="dialogue-text"><Typewriter text={dialog.text} instant={instant} /></p>
                {dialog.message && <div className="discovered-message"><span className="discovered-title"><Sparkles size={12} /> UN GÂND BUN PENTRU TINE</span><p><Typewriter text={settings.messages[dialog.message]} instant={instant} /></p><small><BookOpen size={11} /> Păstrat în jurnalul tău</small></div>}
                <div className="dialogue-footer"><span>Atinge textul pentru a-l afișa complet</span><button ref={dialogButton} className="primary-button small" onClick={e => { e.stopPropagation(); advanceDialog(); }}>{dialog.label || (dialog.action === 'start' ? 'Să explorăm!' : dialog.action === 'next' ? 'Următorul capitol' : 'Continuă')}<ArrowRight size={15} /></button></div>
              </div>
            </div>}
          </div>
          <div className="game-toolbar"><div className="keyboard-hint"><span className="key-arrows">↑<br />← ↓ →</span><span><strong>W A S D</strong> sau săgeți <i /> click / atingere pentru a merge</span></div><div className="autosave"><span className={storageWarning ? 'warning-dot' : 'live-dot'} />{storageWarning ? 'Salvarea locală indisponibilă' : 'Progres salvat automat'}</div></div>
          <div className="backpack"><span className="backpack-title"><Compass size={17} /> În rucsăcelul tău</span><div className={`keepsake ${state.collected[0].length ? 'found' : ''}`}><span>🍄</span><small>{state.collected[0].length}/5</small></div><div className={`keepsake ${state.flowerBloomed ? 'found' : ''}`}><span>🌼</span><small>{state.flowerBloomed ? 'Grijă' : 'Floare'}</small></div><div className={`keepsake ${state.collected[3].length ? 'found' : ''}`}><span>✨</span><small>{state.collected[3].length}/4</small></div><div className={`keepsake ${state.chestSolved ? 'found' : ''}`}><span>🧭</span><small>Busolă</small></div><span className="backpack-note">Amintiri mici, bucurii mari.</span></div>
        </section>

        <aside className="sidebar">
          <section className="mission-card"><div className="card-eyebrow"><span>JURNAL DE CĂLĂTORIE</span><Sprout size={18} /></div><h2>Mici pași, mici bucurii.</h2><div className="journey-progress"><div><span>Aventura ta</span><strong>{completedCount}<span> / 6 capitole</span></strong></div><div className="progress-track"><div style={{ width: `${completedCount / 6 * 100}%` }} /></div></div>
            <ol className="mission-list">{missions.map((m, i) => <li key={m.short} className={`${i === state.stage && !state.completed ? 'current' : ''} ${i < state.stage || state.completed ? 'done' : ''}`}><span className="mission-number">{i < state.stage || state.completed ? <Check size={14} /> : String(i + 1).padStart(2, '0')}</span><div><span>{m.short}</span>{i === state.stage && !state.completed && <small>O mică misiune te așteaptă</small>}</div><span className="mission-emoji">{m.icon}</span></li>)}</ol>
            <div className="current-mission"><div className="current-mission-title"><span>{mission.icon}</span><span>{state.completed ? 'Aventură îndeplinită!' : mission.title}</span></div><p>{state.completed ? 'Ai adunat gânduri bune și o floare de păstrat. Poiana te așteaptă oricând.' : mission.hint}</p><div className="mission-goal"><span>{ready ? 'Misiune îndeplinită' : state.stage === 1 ? 'Apă, lumină și puțină grijă' : state.stage === 2 ? 'Urmează-ți curiozitatea' : state.stage === 4 ? 'O comoară plină de gânduri bune' : state.stage === 5 ? 'O floare special pentru tine' : `${counter} din ${mission.goal} ${state.stage === 3 ? 'licurici' : 'ciupercuțe'} găsite`}</span>{ready ? <Check size={15} /> : <span className="goal-count">{counter}/{mission.goal}</span>}</div>
              {state.stage === 1 && !ready && <div className="ingredients"><span className={collected.includes('water') ? 'gathered' : ''}>💧 Apă {collected.includes('water') && '✓'}</span><span className={collected.includes('sun') ? 'gathered' : ''}>☀️ Lumină {collected.includes('sun') && '✓'}</span></div>}
              {state.stage === 1 && !ready && collected.includes('water') && collected.includes('sun') && <button className="primary-button full" onClick={bloom}><Flower2 size={15} /> Ajută floarea</button>}
              {state.stage === 2 && !ready && state.started && !dialog && <div className="path-choices"><button onClick={() => onItem('path-flowers')}>🌸 Poteca florilor</button><button onClick={() => onItem('path-ferns')}>🌿 Poteca ferigilor</button></div>}
              {state.stage === 4 && !ready && state.started && !dialog && <button className="text-button" onClick={() => { setPuzzle([]); setPuzzleHint(''); setPanel('puzzle'); }}>Privește cufărul <ArrowRight size={14} /></button>}
              {ready && state.stage < 5 && !dialog && <button className="primary-button full" onClick={() => { dispatch({ type: 'next' }); setHint(false); returnToGame(); }}>Mai departe <ArrowRight size={15} /></button>}
              {state.completed && <button className="primary-button full" onClick={() => setPanel('birthday')}><Flower2 size={16} /> Surpriza ta</button>}
            </div>
          </section>
          <button className="journal-card" onClick={() => setPanel('journal')}><span className="journal-icon"><BookOpen size={25} strokeWidth={1.5} /></span><span><strong>Jurnalul exploratoarei</strong><small>{journalCount ? `${journalCount} gânduri bune de recitit` : 'Gândurile bune rămân cu tine'}</small></span><ChevronRight size={17} /></button>
          <div className="gentle-note"><span>✦</span><p>Nu trebuie să te grăbești.<br />Surprizele frumoase te așteaptă.</p></div>
        </aside>
      </div>

      <div className="below-game"><span><Leaf size={14} /> O aventură de 5–10 minute, de savurat în ritmul tău.</span><button className="text-button" onClick={() => setHint(!hint)}><Sparkles size={14} /> {hint ? 'Ascunde indiciul' : 'Un mic indiciu?'}</button></div>
      {hint && <div className="hint-note" role="status">{['Caută printre flori: în stânga sus, lângă copacul de sus, spre dreapta și în cele două colțuri de jos. Ciupercuțele de adunat au un cerc luminos.', 'Stropitoarea e în stânga pârâului, raza de soare în dreapta sus. Floarea așteaptă în mijloc.', 'Indicatoarele sunt la stânga și la dreapta. Orice alegere e bună; poți folosi și butoanele de lângă hartă.', 'Licuricii strălucesc în cele patru colțuri ale poienii. Apropie-te și ascultă ce au de spus.', 'Amintește-ți ordinea aventurii: ciupercuță, floare, licurici. Cufărul te așteaptă în centrul poienii.', 'Margareta albă crește lângă poteca din mijloc. O ultimă plimbare până la ea și surpriza e gata!'][state.stage]}<span> Psst… fluturașul auriu de sus ascunde și el ceva.</span></div>}
    </main>

    <footer className="site-footer"><span className="footer-daisy">✿</span> Creat cu grijă, pentru un zâmbet.<span className="footer-right">O aventură de la {settings.senderName || config.senderName} <span>✦</span></span></footer>
    {notice && <div className="toast" role="status"><Sparkles size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Închide notificarea"><X size={15} /></button></div>}

    {panel === 'journal' && <Modal title="Jurnalul exploratoarei" subtitle="Gânduri bune, adunate pe potecă. Le poți reciti oricând." onClose={closePanel} wide><div className="journal-summary"><BookOpen size={17} /><span>{journalCount} din 9 mesaje descoperite{state.surpriseFound ? ' + o surpriză ascunsă' : ''}</span><span className="journal-saved">Păstrate în acest browser</span></div><div className="journal-entries">{[...entryIds, 'secret' as MessageId].filter(id => id !== 'secret' || state.surpriseFound).map((id, i) => { const found = state.journal.includes(id); return <article className={`journal-entry ${found ? '' : 'locked-entry'}`} key={id}><span className="entry-icon">{found ? messageIcons[id] : '✧'}</span><div><small>PAGINA {String(i + 1).padStart(2, '0')}</small><h3>{found ? messageTitles[id] : 'Un gând bun te așteaptă'}</h3>{found ? <p>{settings.messages[id]}</p> : <p>Îl vei descoperi pe parcursul aventurii.</p>}{found && speechSupported && <button className="text-button" onClick={() => speak(settings.messages[id])}><Volume2 size={14} /> Ascultă mesajul</button>}{id === 'final' && found && <button className="text-button" onClick={() => setPanel('birthday')}><Flower2 size={14} /> Păstrează floarea</button>}</div></article>; })}</div><div className="modal-bottom"><button className="secondary-button" onClick={() => { closePanel(); returnToGame(); }}><ArrowLeft size={15} /> Înapoi în poiană</button><button className="text-button" onClick={stopSpeech}><VolumeX size={14} /> Oprește lectura</button></div></Modal>}

    {panel === 'help' && <Modal title="Un mic ghid de explorare" subtitle="Aici nu există grabă, cronometru sau pași greșiți." onClose={closePanel}><div className="help-content"><div className="help-step"><span>01</span><div><h3>Plimbă-te prin pădure</h3><p>Folosește <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> sau săgețile. Poți da click ori atinge locul în care vrei să ajungă Teemo. Pe telefon ai și butoane cu direcții.</p></div></div><div className="help-step"><span>02</span><div><h3>Lasă curiozitatea să te ghideze</h3><p>Apropie-te de obiectele cu cerc luminos ca să le aduni. <kbd>E</kbd> sau <kbd>Spațiu</kbd> interacționează cu obiectele apropiate. Următoarea misiune se deschide după dialog.</p></div></div><div className="help-step"><span>03</span><div><h3>Păstrează gândurile bune</h3><p>Mesajele apar în jurnal și rămân acolo și după final. Progresul se salvează automat în acest browser. Muzica și vocea pot fi pornite separat.</p></div></div><div className="help-note"><Sprout size={22} /><p>Ai nevoie de un indiciu? Butonul de sub hartă e mereu aici. Teemo e un ghid răbdător. Aproape la fel de răbdător ca o ciupercă.</p></div><button className="primary-button full" onClick={() => { closePanel(); returnToGame(); }}>Gata de explorare <ArrowRight size={16} /></button></div></Modal>}

    {panel === 'settings' && <Modal title="Un cadou, în felul tău" subtitle="Personalizează numele, gândurile bune și sunetul aventurii." onClose={closePanel}><div className="settings-content"><div className="form-grid"><label>Numele destinatarei<input value={settings.recipientName} maxLength={40} placeholder="De exemplu, Andreea" onChange={e => setSettings(s => ({ ...s, recipientName: e.target.value }))} /></label><label>Din partea cui<input value={settings.senderName} maxLength={40} placeholder={config.senderName} onChange={e => setSettings(s => ({ ...s, senderName: e.target.value }))} /></label></div><div className="preference-row"><span><strong>Muzică și sunete</strong><small>O melodie originală, cântată în șoaptă</small></span><button className={`switch ${settings.sound ? 'checked' : ''}`} role="switch" aria-checked={settings.sound} aria-label="Muzică și sunete" onClick={toggleSound}><span /></button></div><div className="preference-row"><span><strong>Vocea lui Teemo</strong><small>{speechSupported ? 'Lectură automată; vocea depinde de browser' : 'Lectura vocală nu este disponibilă în acest browser'}</small></span><button className={`switch ${settings.voice ? 'checked' : ''}`} role="switch" aria-checked={settings.voice} aria-label="Lectură automată" disabled={!speechSupported} onClick={toggleVoice}><span /></button></div><details className="message-editor"><summary>Editează gândurile bune <Settings2 size={16} /></summary><p>Păstrează tonul prietenesc. Modificările se salvează automat.</p>{(Object.keys(config.messages) as MessageId[]).map(id => <label key={id}>{messageIcons[id]} {messageTitles[id]}<textarea value={settings.messages[id]} maxLength={3000} rows={id === 'final' ? 9 : 4} onChange={e => updateMessage(id, e.target.value)} /></label>)}</details><div className="share-box"><h3>Trimite personalizarea împreună cu jocul</h3><p>Numele și mesajele se păstrează în acest browser. Linkul cadoului include personalizarea și poate fi trimis după publicarea site-ului.</p><button className="secondary-button full" onClick={copyGiftLink}><Link size={15} /> Copiază linkul cadoului</button>{linkText && <label className="copy-link-label">Linkul tău<input readOnly value={linkText} onFocus={e => e.target.select()} /></label>}</div><div className="source-download"><a className="text-button" href="./downloads/teemo-birthday.zip" download><Code2 size={15} /> Descarcă proiectul complet</a><small>Surse React + TypeScript, instrucțiuni și configurări Vercel / Netlify.</small></div><div className="settings-reset"><button className="text-button" onClick={() => setPanel('reset')}><RotateCcw size={14} /> Reîncepe aventura</button><span>Setările se salvează automat</span></div></div></Modal>}

    {panel === 'reset' && <Modal title="O nouă plimbare prin pădure?" onClose={closePanel}><div className="reset-content"><p>Vei începe de la prima misiune. Progresul și paginile jurnalului se resetează; numele și mesajele personalizate se păstrează.</p><button className="primary-button full" onClick={() => { dispatch({ type: 'reset' }); closePanel(); showDialog({ text: config.intro, action: 'start' }); setNotice('O aventură nouă te așteaptă.'); }}>Da, pornește o nouă aventură <ArrowRight size={15} /></button><button className="text-button" onClick={closePanel}>Păstrez aventura de acum</button></div></Modal>}

    {panel === 'puzzle' && <Modal title="O cheiță din amintiri" subtitle="Cufărul se deschide cu trei mici comori din aventura ta." onClose={closePanel}><div className="puzzle-content"><div className="chest-illustration">🎁<span>✦</span></div><p>Mai întâi ai găsit ceva mic în pădure.<br />Apoi ai oferit grijă. La final, ai adunat lumină.</p><p className="puzzle-instruction">Atinge simbolurile în ordinea poveștii.</p><div className="puzzle-slots" aria-label="Ordinea aleasă">{[0, 1, 2].map(i => <span key={i}>{({ mushroom: '🍄', flower: '🌼', firefly: '✨' } as Record<string, string>)[puzzle[i]] || <small>{i + 1}</small>}</span>)}</div><div className="puzzle-pieces">{[['firefly', '✨', 'Licurici'], ['mushroom', '🍄', 'Ciupercuță'], ['flower', '🌼', 'Floare']].map(([id, icon, label]) => <button key={id} disabled={puzzle.includes(id)} onClick={() => { audio.effect('click'); setPuzzle(p => [...p, id]); }}><span>{icon}</span>{label}</button>)}</div>{puzzleHint && <p className="puzzle-hint" role="status">{puzzleHint}</p>}<div className="puzzle-actions"><button className="text-button" onClick={() => { setPuzzle([]); setPuzzleHint(''); }}><RotateCcw size={14} /> Așază din nou</button><button className="primary-button" disabled={puzzle.length !== 3} onClick={solvePuzzle}>Deschide cufărul <Sparkles size={16} /></button></div></div></Modal>}

    {panel === 'birthday' && <Modal title={settings.recipientName ? `La mulți ani, ${settings.recipientName}!` : 'La mulți ani!'} subtitle="O floare, câteva gânduri bune și un zâmbet de păstrat." onClose={closePanel} wide><div className="birthday-content"><div className="birthday-letter"><span className="birthday-eyebrow">PENTRU TINE, CU GÂNDURI BUNE</span><div className="birthday-message">{settings.messages.final}</div>{settings.senderName && <p className="sender-signature">Cu gânduri bune,<br /><strong>{settings.senderName}</strong></p>}<div className="birthday-actions"><button className="primary-button" disabled={savingCard} onClick={saveCard}><ArrowDownToLine size={17} />{savingCard ? 'Pregătim floarea…' : 'Păstrează floarea 🌼'}</button>{speechSupported && <button className="icon-button" onClick={() => speak(settings.messages.final)} aria-label="Ascultă urarea de ziua ta"><Volume2 size={19} /></button>}</div><small className="download-note">Felicitarea se salvează ca imagine PNG.</small>{cardError && <p role="alert">{cardError}</p>}</div><div className="birthday-card-preview"><canvas ref={birthdayCanvas} aria-label="Felicitare digitală: Teemo oferind o margaretă, La mulți ani!" role="img" /><span>O mică amintire din aventura ta</span></div></div><div className="modal-bottom"><button className="text-button" onClick={() => setPanel('journal')}><BookOpen size={15} /> Toate gândurile bune</button><button className="secondary-button" onClick={() => { closePanel(); returnToGame(); }}>Mai stau puțin în poiană <Leaf size={15} /></button></div></Modal>}
  </div>;
}
