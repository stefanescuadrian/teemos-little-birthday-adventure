export type ItemKind = 'mushroom' | 'water' | 'sun' | 'flower' | 'firefly' | 'chest' | 'sign' | 'gift';
export type MissionItem = { id: string; x: number; y: number; kind: ItemKind };
export const missions = [
  { title: 'Ciupercuțele lui Teemo', short: 'Ciupercuțele', location: 'Pădurea șoaptelor', icon: '🍄', hint: 'Cinci ciupercuțe s-au ascuns prin pădure. Apropie-te de ele ca să le aduni.', goal: 5 },
  { title: 'Floarea magică', short: 'Floarea magică', location: 'Grădina razelor blânde', icon: '🌼', hint: 'Găsește stropitoarea și raza de soare, apoi ajută floarea să înflorească.', goal: 3 },
  { title: 'Răscrucea drumurilor', short: 'Răscrucea', location: 'Potecile curajului', icon: '🧭', hint: 'Alege poteca cu flori sau poteca cu ferigi. Amândouă duc mai departe.', goal: 1 },
  { title: 'Licuricii cu mesaje', short: 'Licuricii', location: 'Luminișul licuricilor', icon: '✨', hint: 'Patru luminițe poartă patru gânduri bune. Lasă-le să-ți lumineze aventura.', goal: 4 },
  { title: 'Cadoul ascuns', short: 'Cadoul ascuns', location: 'Poiana micilor comori', icon: '🎁', hint: 'Apropie-te de cufăr. Amintirile adunate îți vor arăta cum se deschide.', goal: 1 },
  { title: 'Floarea de ziua ta', short: 'Surpriza finală', location: 'Poiana aniversară', icon: '🎂', hint: 'O ultimă margaretă te așteaptă în poiană. Teemo a păstrat-o special pentru tine.', goal: 1 },
] as const;

const items: MissionItem[][] = [
  [{ id: 'm1', x: 270, y: 245, kind: 'mushroom' }, { id: 'm2', x: 730, y: 240, kind: 'mushroom' }, { id: 'm3', x: 820, y: 470, kind: 'mushroom' }, { id: 'm4', x: 320, y: 510, kind: 'mushroom' }, { id: 'm5', x: 490, y: 180, kind: 'mushroom' }],
  [{ id: 'water', x: 240, y: 360, kind: 'water' }, { id: 'sun', x: 770, y: 250, kind: 'sun' }, { id: 'flower', x: 550, y: 300, kind: 'flower' }],
  [{ id: 'path-flowers', x: 270, y: 260, kind: 'sign' }, { id: 'path-ferns', x: 740, y: 270, kind: 'sign' }],
  [{ id: 'f1', x: 250, y: 250, kind: 'firefly' }, { id: 'f2', x: 720, y: 230, kind: 'firefly' }, { id: 'f3', x: 820, y: 480, kind: 'firefly' }, { id: 'f4', x: 320, y: 490, kind: 'firefly' }],
  [{ id: 'chest', x: 520, y: 290, kind: 'chest' }],
  [{ id: 'birthday-flower', x: 540, y: 270, kind: 'flower' }],
];
export const itemsForStage = (stage: number): MissionItem[] => items[Math.max(0, Math.min(stage, 5))];
