# s73-eventsida-konvergens — facit-kanon för eventdetaljsidan

Konvergens-passet på eventsidan (detaljvyn `/event/$eventId`), Session 73
— 72 iterationer (K1–K72) över fyra pass med tre pauser/resumes.
Skärmdumpar tagna på 390×844 (mobilformen, S72-precedenten), demo-data,
prototyp-växlaren minimerad (K59). Återupplivningsvägen: varje pass bär
sitt commit-spann — koden kan återuppstå ur git-historiken.
FullPage-artefakt öppet bokförd: fixerade element (tab-baren) målas på
sin viewport-position mitt i helsides-dumparna.

## FACIT — deklarerat 2026-07-20

Marcus: **"Jag är nöjd med eventdetalj-sidan nu efter 72 iterationer.
… Detta ska ju bli facit nu."** Facit-SHA för koden: `9826278` (K72).
Därmed är HELA event-familjens konvergerade yta låst: listan +
kalendervyn (S72-facitet, bilagan `s72-event-lista-konvergens/`) +
eventdetaljsidan (detta facit). Nästa led i kedjan: PRD → skivor.

## Sidans form (uppifrån och ned)

Topprad (chevron ensam + h1 = eventnamnet + EventKey-pill +
tidKvar-rad) → CHECK-IN-kortet (NavCard-form i åtgärdsradens mått) →
ÅTGÄRDER (6 rader, kuvert-grammatiken, hover-plattan K72) → OM EVENTET
(key-value + Ändra-läget) → BELÄGGNING (Marcus-modellen K16 +
segmenterad mätare + Ändra-morfen Δ=0 px) → ANMÄLDA DELTAGARE
(summeringsrader med hover K56 + Bekräfta alla-pillen + Bor över-raden
+ kategori-flikar + Obekräftade/Bekräftade-accordions + personkortens
metayta K45 + hantera-flödet K46 + Anmäld-länken K62) → BETALNINGAR
(röda deltan + inline-ARBETSYTAN) → NÄRVARO (REGISTRET K60,
LMS-mönstret) → GRUPPDYNAMIK (erfarenhetsmix-mätare + nivå-accordions
med per-person-kurshistorik i kalenderfärgerna K63–K64 + motiveringarna
med Läs mer K65) → ANTECKNINGAR (K66–K71: tidsstämplad ström med
författare + härledd Under/Efter-fas [Innan omärkt per tysta normen] +
auto-grow-composer). Sage-gröna `#606B57` app-brett (K49, skarp).

## Skärmdumpar

| Fil | Läge |
|---|---|
| `FACIT-eventsidan-helsida.png` | Hela sidan, kommande event (demo-1) — grundläget |
| `FACIT-om-eventet-andralaget.png` | Om eventet i Ändra-läget (Select/Input/DateRangePicker, morf 0 px) |
| `FACIT-belaggning-andralaget.png` | Beläggning i Ändra-läget (likbredda fält, "ändrar från"-mönstret) |
| `FACIT-betalningar-arbetsytan.png` | Betalningar med inline-arbetsytan öppen (flikar · kryss · notering · påminn) |
| `FACIT-gruppdynamik-expanderad.png` | Gruppdynamik med nivå-accordions öppna (personkort + kurshistorik) + motiveringar |
| `FACIT-anteckningar.png` | Anteckningar: nyskriven anteckning överst (Lotta + tidpunkt) + demo-strömmen |
| `FACIT-atgarder-hover.png` | Åtgärder med hovrad rad (K56/K72-plattan) |
| `FACIT-tidigare-event-helsida.png` | Hela sidan, genomfört event (demo-6): närvaro ifylld + anteckningarnas Under/Efter-etiketter |

## Konvergens-trailen (fyra pass, tre pauser)

| Pass | Spann | Commits | Kärnbeslut |
|---|---|---|---|
| 1 | K1–K13 | dok-födelse `fc9f2fb` → `64f906f` | substratet + T78a-lyftet · **SKARP: headern riven app-brett** (`ac3f198`) · IMG_1542-formen · identiteten som sidhuvud · Ändra-morfen |
| 2 | K14–K44 | `bbce0b4` → `92c0d97` | beläggnings-morfen + innehållsmodellen · manuell anmälan-sidan (K17) · åtgärds-gruppen · check-in-ingången · betalnings-arbetsytan · deltagar-kortet + mail-flödet |
| 3 | K45–K65 | `e9e11ed` → `b97f75a` | metayta-avbrusningen · hantera-flödet · **SKARP: sage-gröna** (K49) · Bor över-kryssen · Obekräftade-språket (K53) · närvaro-REGISTRET (K60) · GRUPPDYNAMIK ersätter Anmälda (K63–K65) |
| 4 | K66–K72 | `04e9b86` → `9826278` | ANTECKNINGAR-strömmen (K66) · Innan-etiketten riven/tysta normen (K67) · kant-inset 16 px (K68) · knapp-radien åter primitiv (K69 + läkning `2cbcaed`) · grepp prövat-och-rivet → AUTO-GROW (K70–K71) · åtgärdsradernas hover-platta (K72) |

## Öppet bokfört till skarpa skivorna

- **Chevron-beslutet (K25-prövningen):** facitet LÅSTES med chevroner på
  åtgärdsraderna. Per prövnings-kontraktet ska då app-regeln (S64,
  M6-facitet: chevron = navigation) RIVAS ÖPPET + Mer-menyn följa med
  (koherens) — **konsekvens-beslut som kräver Marcus-kvittens, ej
  auto-utfört.**
- **K56-följdfrågans rest:** Ändra-/Öppna-raderna + betalningarnas
  detalj-rad saknar hover-plattan (åtgärdsklassen fick den K72).
- print-CSS · tomläges-/felformer på detaljsidan · tidKvarTillEvent-
  raden (demo saknar värde på kommande event).
- Firefox/äldre Safari: auto-grow-composern faller till fast 3-radig
  (`field-sizing` saknas) — skarp cross-browser-form + ev. auto-grow-
  variant i TextArea-primitiven.
- **PRD-kraven** bor som kod-kommentarer i `EventDetailPrototype.tsx`
  (write-operationer + eventKey · send-email confirmation + server-side
  status-flip K46 · bor över-kryssfältet K50/K52 · get-attendance-shapen
  K60 · anmälan-sidan/get-registration K62 · gruppdynamik-shapen +
  Erfarenhetsbadge [RIM 3-blindheten → T16] K63–K65 · schemalagt
  eventinfo-utskick K44 · anteckningar-strömmen: backend-vägvalet
  Airtable record comments vs additiv tabell + författare = inloggad
  användare K66).

## Prototypens lifecycle

Klausul v (S72-triaget) fortsätter gälla: prototypen BEHÅLLS som
familje-substrat tills skarpa bygget startar; skarp form är NYSKRIVEN
implementation (klausul iv) — koden absorberas aldrig. Facit-SHA:n +
denna bilaga är kanon; skärmdumparna är bedömningsunderlaget som
PRD:erna och skivorna refererar.
