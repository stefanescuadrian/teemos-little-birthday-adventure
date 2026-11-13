# Teemo's Little Birthday Adventure 🌼

O mică aventură 2D de ziua de naștere, în limba română. Teemo explorează o pădure, adună ciupercuțe și licurici, ajută o floare să înflorească și pregătește o surpriză. Mesajele sunt prietenești și încurajatoare.

Proiectul folosește **React + TypeScript + Vite** și **HTML5 Canvas**. Nu are nevoie de server, bază de date, cont sau chei API. Este potrivit pentru publicare statică pe Vercel și Netlify.

## Instalare și rulare

Ai nevoie de [Node.js](https://nodejs.org/) — versiunea **22 LTS** sau mai nouă — și de npm.

```bash
npm install
npm run dev
```

Deschide adresa locală afișată de Vite în terminal. Pentru a testa și de pe telefon, pornește serverul în rețeaua locală:

```bash
npm run dev -- --host 0.0.0.0
```

Telefonul și calculatorul trebuie să fie în aceeași rețea Wi-Fi. Folosește adresa `Network` afișată de Vite.

Verificarea și construirea versiunii de publicat:

```bash
npm test
npm run build
npm run preview
```

`npm run build` verifică TypeScript și produce site-ul în directorul **`dist/`**. `npm run preview` servește local această versiune construită.

## Cum se joacă

- **Calculator:** WASD sau săgeți pentru deplasare; `E` sau `Spațiu` pentru interacțiune.
- **Mouse / telefon:** apasă pe locul din pădure în care vrei să ajungă Teemo. Pe telefon sunt disponibile și controale direcționale.
- Obiectele se colectează când Teemo ajunge lângă ele. Pentru dialoguri și puzzle-uri, folosește butoanele afișate.
- **Jurnalul exploratorului** poate fi deschis oricând. Păstrează toate mesajele descoperite și rămâne disponibil după final.
- Muzica și vocea pot fi activate sau dezactivate. Browserul cere o primă interacțiune înainte de a reda sunet.
- La final, **„Păstrează floarea 🌼”** generează o felicitare PNG care poate fi salvată ca imagine.

Nu există cronometru, vieți, pierdere sau alegeri greșite. Poți face pauză și reveni în ritmul tău.

### Cele șase etape

1. **Ciupercuțele lui Teemo:** găsește cele cinci ciupercuțe.
2. **Floarea magică:** adună apă și lumină și ajută floarea să înflorească.
3. **Răscrucea drumurilor:** alege oricare dintre cele două poteci; ambele continuă aventura.
4. **Licuricii cu mesaje:** descoperă cele patru mesaje și luminează pădurea.
5. **Cadoul ascuns:** folosește amintirile aventurii pentru puzzle-ul cufărului.
6. **Floarea de ziua ei:** descoperă poiana aniversară, primește floarea și salvează felicitarea.

## Personalizare

Poți personaliza cadoul direct din **Setări**: completează numele destinatarei, expeditorul și mesajele, apoi apasă **„Copiază linkul cadoului”**. Linkul include personalizarea într-un fragment `#cadou=…`, astfel încât aceasta să fie aplicată și în browserul destinatarei. Trimite linkul complet, inclusiv fragmentul, după publicarea site-ului. Numele și mesajele sunt incluse în link; evită detaliile pe care nu ai vrea să le vadă cineva care îl primește.

Pentru a modifica valorile implicite din surse, fișierele importante sunt:

| Fișier | Ce personalizezi |
| --- | --- |
| `src/config.ts` | Numele destinatarei (`recipientName`), numele expeditorului (`senderName`), introducerea, replicile și mesajele. |
| `src/game/missions.ts` | Etapele, obiectele și pozițiile lor în pădure. |
| `src/styles.css` | Culorile, fonturile, spațierea și aspectul interfeței. |
| `src/game/art.ts` | Ilustrațiile originale Canvas, personajul și atmosfera pădurii. |
| `src/game/audio.ts` | Muzica ambientală originală, efectele și funcțiile de citire cu voce. |

Începe cu `src/config.ts`: completează numele destinatarei și citește toate mesajele înainte de a trimite jocul. Păstrează textul în ghilimele și structura TypeScript existentă. După modificări, rulează `npm run build` pentru a verifica proiectul.

Pentru schimbări de poziție, lumea Canvas folosește coordonate logice de **1000 × 640**. Ține obiectele departe de margini, astfel încât să poată fi atinse ușor și pe telefon.

Dacă personalizezi mesajele, păstrează tonul firesc al unui cadou din partea TDD Team. Nu este nevoie să adaugi referiri la dificultățile personale ale destinatarei.

## Salvarea progresului

Progresul, jurnalul și preferințele sunt păstrate în **localStorage**, în browserul și pe dispozitivul folosit pentru joc. Reîncărcarea paginii păstrează aventura.

- Progresul nu se sincronizează între telefon și calculator.
- **„Reîncepe aventura”** resetează progresul și paginile jurnalului; numele și mesajele personalizate se păstrează.
- Ștergerea datelor site-ului șterge și progresul.
- În modul privat, salvarea poate dispărea la închiderea sesiunii.
- O adresă de publicare diferită are propriile date locale. Testarea locală nu afectează progresul de pe linkul trimis.

## Voce și muzică

Muzica și efectele sunt generate original prin **Web Audio API**, fără înregistrări preluate din League of Legends sau alte jocuri.

Citirea mesajelor folosește **Web Speech API**. Disponibilitatea și calitatea unei voci românești depind de browser și de sistemul de operare. Jocul preferă o voce `ro-RO`, când există; toate mesajele pot fi citite pe ecran și dacă browserul nu oferă voce. Unele voci sunt furnizate de sistem sau de serviciile browserului, care își aplică propriile condiții de conectivitate.

## Publicare pe Vercel

1. Pune proiectul într-un repository GitHub, GitLab sau Bitbucket. Include sursele, `package.json` și fișierul lock; exclude `node_modules/` și datele locale.
2. În [Vercel](https://vercel.com/), alege **Add New → Project** și importă repository-ul.
3. Alege presetarea **Vite**, comanda de build **`npm run build`** și directorul de ieșire **`dist`**. Fișierul `vercel.json` inclus declară deja aceste opțiuni. Nu sunt necesare variabile de mediu.
4. Apasă **Deploy**, deschide linkul rezultat și testează jocul de pe telefon. Trimite destinatarei URL-ul public al deployment-ului.

Pentru modificări ulterioare, publică un nou commit în branch-ul conectat; Vercel reconstruiește automat site-ul.

## Publicare pe Netlify

1. Pune proiectul într-un repository Git și, în [Netlify](https://www.netlify.com/), alege **Add new site → Import an existing project**.
2. Conectează repository-ul și branch-ul dorit.
3. Folosește comanda de build **`npm run build`** și directorul de publicare **`dist`**. Fișierul `netlify.toml` inclus configurează aceste valori și redirecționarea către pagina aplicației.
4. Apasă **Deploy**, testează linkul și trimite URL-ul public destinatarei. Nu sunt necesare variabile de mediu.

Alternativ, rulează `npm run build` pe calculator și încarcă directorul **`dist`** în Netlify Drop. La fiecare actualizare, reconstruiește și încarcă din nou directorul.

**Accesul destinatarei:** o previzualizare sau o publicare prin Sites poate avea acces privat, doar pentru proprietar. Pentru un cadou accesibil printr-un link simplu, folosește un deployment public Vercel/Netlify sau configurează explicit accesul dorit în serviciul de găzduire. Verifică linkul într-o fereastră privată înainte de a-l trimite.

## Grafică și resurse

Ilustrațiile și animațiile sunt desenate original în Canvas, într-un stil chibi fantasy. Nu sunt incluse sprite-uri, muzică, voci sau alte asseturi oficiale extrase din League of Legends.

Fonturile **DM Sans** și **Lora** sunt găzduite local, din proiectele Google Fonts, sub **SIL Open Font License 1.1**. Fișierele fonturilor și textele licențelor sunt incluse în `public/fonts/`; pagina nu cere fonturi de la Google Fonts la deschidere.

Teemo și League of Legends aparțin Riot Games. Acesta este un proiect fan-made, personal, fără afiliere sau aprobare oficială din partea Riot Games. Dacă intenționezi să îl distribui pe scară largă sau să îl folosești comercial, verifică separat regulile actuale pentru creații ale fanilor.

## Arhiva proiectului

În panoul de personalizare, **Descarcă proiectul complet** oferă o arhivă ZIP cu sursele, instrucțiunile și configurările de publicare. Arhiva este regenerată automat înainte de `npm run dev` și `npm run build`, prin `scripts/package-source.mjs`. Nu include `node_modules`, date locale sau metadatele private ale găzduirii.
