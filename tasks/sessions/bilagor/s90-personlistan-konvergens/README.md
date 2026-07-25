# S90 — Personer-listan, KONVERGENS-pass

**Frågan som prototypen besvarar:**

> "Hur ska Personer-listan se ut när den talar samma visuella språk som resten
> av appen efter facit-vågen?"

EN variant (`?variant=a`), elva steg. Prototypkoden bor i
`src/components/persons/PersonsListPrototyp.tsx` + prototyp-grenen i
`src/routes/_authenticated/personer/index.tsx` — kastbar, DEV-grindad, aldrig
befordrad (throwaway-kontraktet klausul iv). Stegen adresseras aldrig i URL:en:
**historiken bor i PNG:erna nedan**, koden bär bara sista steget.

**Så här läser du:** varje rad nedan är ett fryst steg. Jämförelseparet är
alltid `kNN` mot `kNN-1` i samma bredd. Två forkar ligger kvar för ditt val
(k03 kortytan, och slutläget i båda formerna).

**Bilderna:** `-mobil` = 430 px (Lottas verkliga arbetsläge), `-desktop` =
1440 px. Helsidesbild. Tab baren är bortmaskad i bilderna — den är `fixed` och
ritas mitt i en helsidesbild, där den skymmer just de rader passet handlar om.
Prototyp-railen och devtools-knapparna är likaså bortmaskade.

**Datan är den frusna fixturvärlden** (17 personer, live-verifierade fältformer
ur prod 2026-07-26): tre personer utan e-post, två utan telefon, en utan båda,
en namnlös lead ("Ej tillgängligt"), badge-värden upp till 28 tecken. Sidan
visar 10 — "Ladda fler" hämtar de sista 7.

---

## Stegen

| Steg | Bild | Vad ändrades | Varför |
|---|---|---|---|
| **k01** | `k01-*` | Ingenting — **exakt kopia** av dagens vy. | Baslinjen. Utan den bedöms varje förfining mot fel utgångsläge. **Bevisad exakt:** samma bild renderad ur skarpa vyn gav identisk SHA-256 i båda bredderna. |
| **k02** | `k02-*` | Sid-insetens dubbelkant bort (`p-4` i routen ovanpå skalets `px-4`), topp-luft `pt-2 lg:pt-10`, h1 får sid-rubrikformen 30/600. | Person-ytorna stod på 32 px inset mot facitets 16 px — M6:s dubbelkants-fynd, oreparerat. Måste ligga först: allt kortmått mäts annars mot fel bredd. |
| **k03** | `k03a-*` **fork A**<br>`k03b-*` **fork B** | Raden slutar vara ett `border-b`-fragment och blir en yta. **A** = en tonal kortyta med tunna avdelare (eventsidans `DetaljGrupp`-facit). **B** = samma kortyta med zebra-tintade rader utan avdelare (Hem-kortets facit). | Den svarta linjen under varje rad i k01/k02 var en defekt: `border-b` bar ingen färgklass och Tailwind v4 ritade den i **textfärg**. Aldrig 50 fristående kort — den formen bär 3–12 poster, inte en scanlista för 200 rader. |
| **k04** | `k04-*` | `·`-kedjan delas i tre nivåer: namnet bär raden, kontakten är dämpad, statusen bärs av **pillar**. | Metadata ska läsas som språk. Här dör också defekten **"Aktiv anmälan: Ingen aktiv anmälan"** (syns i k01–k03): fältet är en formel som aldrig är tom, så dagens truthiness-gren skrev ut icke-statusen ordagrant. Pillen jämför mot värdet och **tiger** när det inte finns någon aktiv anmälan. |
| **k05** | `k05-*` | Hela raden blir klickyta (`after:inset-0` på namnlänken), understrykningen flyttar till hover, chevron 18 px höger. | En länk, rent länknamn, hela raden träffbar. Chevron betyder att raden leder vidare (app-regeln efter rivningen 2026-07-21). |
| **k06** | `k06-laddar-*` | "Laddar personer…"-texten bort → skeleton i radernas slutgeometri, 10 rader. Sökfältet ritas direkt (statiskt känd chrome). | Spec §15 förbjuder ordagrant "Laddar…"-textrader. Inget ska hoppa när data landar. *(Bilden visar laddläget, inte listan — listan är oförändrad sedan k05.)* |
| **k07** | `k07-*` | Persondetaljen värms på hover/fokus (prefetch på avsikt). | **Osynlig i bild, störst kännbar effekt** — `get-person` batch-hämtar hela kurshistoriken och hinner aldrig bli instant om den startar först vid klicket. Bilden är byte-identisk med k05: bevis på att inget syntes och inget regredierade. |
| **k08** | `k08-*` | Sökfältet byter form: 40 px hög i stället för 48, appens input-tokens, **kryss-knapp** för att rensa. | Appens enda faktiska sökfälts-facit är eventväljarens (ditt beslut 2026-07-25). Fältet slutar dominera sidan. Krysset syns i `k11-tomt-*`. |
| **k09** | `k09-*` | Räknar-raden blir **meta ovanför kortet** i kortets inner-inset, och copyn byter från "10 personer laddade" till "Visar 10 personer". | "Laddade" är maskin-svenska. Grammatikbuggen **"1 person laddade"** försvinner genom konstruktion när verbet inte längre böjs efter antalet. |
| **k10** | `k10-*` | "Ladda fler" blir mjuk kapsel, centrerad — och byter **inte längre namn** under laddning. | Solid knapp hör inte hemma under en kortyta (spec §19). Dagens namnbyte `Ladda fler` → `Laddar…` sker på ett element som behåller fokus → skärmläsaren omannonserar knappen mitt i handlingen; laddningen bärs nu av `aria-busy` + dämpning. |
| **k11** | `k11-tomt-*` | Tomläget blir strukturerat och centrerat i stället för en grå metarad. | En ensam grå rad ser ut som om sidan gick sönder tyst. *(Bilden visar tomläget vid sökning på "zzz" — listan är oförändrad sedan k10.)* |
| **slutläge** | `slutlage-tonal-*`<br>`slutlage-zebra-*` | Samma sista steg i k03:s **båda** kortformer. | Så du kan välja fork på färdig grammatik i stället för på halvfärdig. |

---

## Två forkar som väntar på dig

1. **Kortytan — tonal (A) eller zebra (B).** Jämför `slutlage-tonal-mobil.png`
   mot `slutlage-zebra-mobil.png`. Tonal ger tunna avdelare och en lugnare yta;
   zebra ger starkare radseparation utan linjer men mer visuellt brus när varje
   rad redan bär pillar. Byte = en konstant i prototyp-filen (`KORTYTA`).

2. **"Ej påbörjat"-pillen.** Fem av tio rader bär den, och den säger att
   personen inte gjort något. Ska en badge som betyder *ingenting hänt* ta plats
   i scan-listan, eller ska pillen bara visas från "Fjärrskådare" och uppåt?
   Byggd som den är (badgen är alltid satt i basen) — inte bortdesignad utan
   ditt beslut.

---

## Byggt men värt att veta

- **Sökfältets fokusring.** Formen ärvdes ordagrant ur eventväljaren, inklusive
  klassen som visar fokusringen vid *all* fokus oavsett mus eller tangentbord.
  Den regeln föddes för en sökruta som autofokuseras i en popover — ett sidfält
  fokuseras inte automatiskt, så här hade appens vanliga fokusring räckt.
  Flaggad för det skarpa bygget, inte tyst ändrad.
- **Skeleton-radernas antal (10).** Skarp sidstorlek är 50 personer; exakt
  slutgeometri för en hel sida vore en 3 000 px hög skeleton-vägg. 10 ≈ det man
  faktiskt ser. Bekräfta talet mot verklig sidhöjd vid skarpt bygge.
- **Sju e2e-assertions hänger i status-radens gamla copy** (och en av dem
  asserterar just grammatikbuggen "1 person laddade"). De måste migreras i
  SAMMA landning som k09/k11 — aldrig lämnas röda. Prototypen rör dem inte:
  testerna kör den skarpa vyn utan `?variant=`.
- **`<ul aria-label="Personer">` behölls** genom hela passet, trots att raderna
  bytt form — sex e2e-assertions och hela listsemantiken hänger i den.

## Föreslaget, medvetet EJ byggt

- **Bokstavsgruppering (A, B, C …).** Byggunderlaget rankar den sist och
  markerar den som ditt beslut, så den är inte byggd. Invändningen som gör den
  svår: sidorna hämtas med cursor, så en grupp kan skäras mitt itu vid
  sidgränsen ("Ladda fler" fyller på under ett H som redan stängts). Den kräver
  antingen sidgruppering i EF:en eller att grupprubriken kan öppnas igen.

---

## Hur du tittar själv

Dev-servern kör på port 4183. Skarpa vyn: `/personer`. Prototypen:
`/personer?variant=a`. Railen till höger växlar mellan dem (kolv-ikonen =
prototypen, fönster-ikonen = skarpa vyn); badgen visar stegnumret.
