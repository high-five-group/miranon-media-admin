# Processauditen prototyp→skarp — syntes och grillningsunderlag

**Datum:** 2026-08-08 · **Session:** S93 (sjunde resumen) · **Författare:**
orkestreraren (Fable), på Marcus order: *"full audit på hela processen. Vi
behöver grilla varje lösning på varje rotorsak."* Målbilden, Marcus egna ord:
prototyp→skarp ska vara *"en rolig och enkel process, problemfri och tydlig"*.

**Detta dokument är en KARTA över auditens tre underlagsrapporter plus
orkestrerarens egna stickprov — inte en kopia av dem** (ADR-100). Läs
detaljbelägg i källfilerna:

| Rapport | Fil | Utförare |
|---|---|---|
| Tidslinjen (56 poster, transkript-utvidgad) | `prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md` | Sonnet-agent |
| R1–R6-verifieringen (adversarial) | `adr-102-rotorsaksverifiering-r1-r6-2026-08-08.md` | Opus-agent |
| R7–R9-verifieringen (adversarial) | `adr-102-rotorsaksverifiering-r7-r9-2026-08-08.md` | Opus-agent |

Orkestrerarens stickprov 2026-08-08 (agentfynd är hypoteser tills prövade,
ADR-086): `EventDetail.tsx:284` saknar `import.meta.env.DEV`-grind medan
`:356` bär den — **bekräftat**; `facit.json` deklarerar exakt fyra ytor
(`anteckningar`, `betalningar`, `gruppdynamik`, `atgarder`), registret saknas
och `godkand: null` — **bekräftat**.

---

## Del 1 — Verdikt-kartan: R1–R9 efter adversarial prövning

Ingen rotorsak falsifierades i sin kärna, men FEM av nio bar belägg som inte
höll, och tre är större än ADR-102 säger. Detaljerna med kommandon och utfall
står i verifierings-rapporterna.

| R# | Verdikt | Vad som ÅTERSTÅR olöst (grillnings-stoffet) |
|---|---|---|
| R1 facit försvinner i skill-kedjan | HÅLLER DELVIS — siffran höll, orsakskedjan föll | Kedjan tappade aldrig begreppet: PRD-kortet nämner facit fem gånger, DoD propagerade, AC pekade — utförarna skrev ändå *"bilderna finns inte i repot"*. Problemet är ADRESS/upptäckbarhet. Hub 1.32.0:s facit-regler (landade 2026-08-07 20:41) är aldrig körda skarpt. Orkestrerarens egen facit-hantering styrs av ingen skill |
| R2 AC beskriver defekter | HÅLLER DELVIS — exemplet äkta, generaliseringen körsbärsplockad (32 av 38 AC var mål-formade) | Ingen mekanism prövar AC-form; B5 är prosa; `145.5` AC #4 står kvar |
| R3 facit-granskningen är bock utan spärr | HÅLLER (omformulerad kärna) | Kryssad-utan-granskning helt oskyddad — `145.2`:s kryss bokfördes mot en konvergens-bild tre dygn före låsningen. Stängningsgrinden är nightly-only och röd (19 kort) |
| R4 facit förväxlingsbart | HÅLLER — UNDERSKATTAD | Fyra namnklasser, inte två. `check-facit.sh` täcker 1 av 22 bilage-kataloger och är prefix-grindad: `s96-auth-prototyp-facit` bär låst facit och passerar grön |
| R5 täckningsluckor osynliga | HÅLLER DELVIS | 36 av 106 prototyp-grenar ligger i ytor manifestet inte nämner — inkl. registret där 4–5 av 6 kända avvikelser sitter (stickprovs-bekräftat) |
| R6 "frågan är besvarad" odefinierat | FALSIFIERAD SOM NULÄGE (1.32.0 ändrade texten) | `godkand` är självbetjäning utan koppling till Marcus-kvittens; en rivning som lämnar en kommentarsrad med markörnamn passerar grön |
| R7 delad kod | HÅLLER DELVIS — talen slarviga (8 filer, 6 form-grenar, 5 `?variant`-läsare) | Options-rymd O1–O4 kartlagd men obeslutad (ADR-102 lämnar den öppet). `EventDetail.tsx:284` produktions-nåbar utan DEV-grind. Död kod (`Betalningar()`) mekaniskt osynlig |
| R8 ingen mekanisk jämförelse | HÅLLER — stödmeningen FALSIFIERAD | En färsk visual-baslinje hade inte fällt EN av A1–A6 (testet går till ett läge, utan `?variant`); DoD #6 styr alltså mot fel åtgärd. Options-rymd O1–O4 kartlagd. Visual-sviten körs inte i CI (`T87` pausad) |
| R9 skivsnittet följde funktionsytan | HÅLLER — trippel-belagd + Marcus realtids-citat | Åtgärds-ytan saknar ägande kort ÄN IDAG — enda kortet som nämner den är rivningskortet `145.6` |

**Mönstret i verdikten:** ADR-102:s beslut (B1–B5) står oskadda — men fem av
nio rotorsakers BELÄGG behövde rättas, och de redan byggda mekaniseringarna
(`facit.json`, `check-facit.sh`) täcker en delmängd av det de ser ut att
täcka. Det är samma ADR-083-klass som rotorsakerna själva beskriver: text som
utlovar mer täckning än mekanismen håller.

---

## Del 2 — Gap-listan: kandidat-rotorsaker ur de ~46 OMAPPADE posterna

Tidslinjen fann 56 poster varav ~46 inte täcks av R1–R9. Klustrade blir de
åtta kandidat-rotorsaker (K1–K8). Beteckningen är auditens — de blir R10+
först om grillningen bekräftar dem.

| K# | Kandidat-rotorsak | Starkaste belägg | Frekvens/kostnad |
|---|---|---|---|
| K1 | **Stale dokumentkopia huvudkatalog↔worktree** — två versioner av samma dok samexisterar, fel läses som gällande | F16/F20/F28/F39 — tre uttryckligen namngivna som "samma fälla" i källan | 4× på 6 dagar, noll mekanisering; strukturellt släkt med R4 |
| K2 | **Regler som inte når sin inträdesväg** — en regel finns skriven men en viss startväg läser den aldrig | F13/`T126` (Marcus: *"de åtgärder vi införde då verkar ju inte bita alls"*); ägarlapp-regeln som `session-resume` inte laddade (S93-incidenten, nu inlinad i skillen) | Återkommande före S93; varje instans kostar en Marcus-eskalering |
| K3 | **Orkestrerarens rapportering ur minne i stället för verifierad källa** — fel bild kallad facit (F43), fel innehålls-påstående 15 min senare (F56, endast i transkriptet), sex spec-fel i uppdragstexter | F26/F29–F31/F36-serien; 72 av 150 min i `145.1` var spill från orkestrerarens spec-fel | Dyraste enskilda mätta posten; alla fångades EXTERNT |
| K4 | **Agent-apparatens kostnad utan proportion till ändringen** — kontext byggs från noll per skiva | `T134`: 500–620k tokens/skiva mot 510k för tre i ett svep (3×); netto −134 rader `src/` för hela passet | Marcus: *"Vi kodar ju inte ett nytt Google liksom"* |
| K5 | **Delad resurs mellan Marcus granskning och agenterna** — dev-servern 5173 är samtidigt granskningsyta och E2E-mål | Marcus (transkript, 17:56): *"Stänger du 5173 så kan jag ju inte se prototypen. Varför stör webbservern agenten?"* | Återkommande spänning, delvis fångad i F50 |
| K6 | **Parallellsessions-mekanikens friktion** — ägarlapp-förvirring, kortnummer-kollisioner, axlar som rör sig under paus | F55 ("ägarlapp-furyn" 2026-08-05, HELT odokumenterad utanför transkriptet — orsak/lösning outredd); `T127`→`T130`-kollisionen över sex filer | F55 kräver egen utredning (592 rader transkript oläst) |
| K7 | **Facit-framställningens integritet** — rotorsakerna R1–R9 förutsätter att facit redan EXISTERAR korrekt; inget skyddar själva framställningen | F19: layoutkollaps under bildstädningen, nära-krasch mot facit-artefakten | En instans, men träffar processens mest kritiska artefakt |
| K8 | **Granskningsbarhet från dag 1** — prototypen föddes mot tomt staging-event | F1, Marcus (transkript, endast där): *"tomt på varje event, så går ju inte kolla något"* — direkt orsak till att seed-fixturen byggdes reaktivt | En instans, men den kostade granskningsstart |

**Transkript-utvidgningens egenvärde, mätt:** av tretton tunga Marcus-citat
var fem helt nya och fem delvis nya mot den skrivna historiken — inklusive
F55 och F56 som inte finns som antydan i sessionsdoket. Sessionsdokens
paraphrasering FILTRERAR systematiskt bort emotionell kostnad och enskilda
felkällor. (Detta är i sig ett K-kandidat-fynd om dokumentations-kedjan, men
det ligger utanför prototyp→skarp-scopet — bokförs här öppet i stället för
att tappas.)

---

## Del 3 — Grillnings-klustringen: sex grillningar

Varje kluster är en egen `/grill-me`-kandidat med eget beslutsunderlag.
Ordningen är ett förslag — beroenden anges.

**G1 — Facit-kedjan: adress, AC-form, granskningsbevis** (R1+R2+R3+R5, K3).
Öppna beslut: hur facit-ADRESSEN tvingas in i varje uppdrag (1.32.0:s
oprövade regler är utgångsläge); mekanisk AC-form-prövning eller ej (B5 har
ingen mekanism); hur en facit-granskning BEVISAS i stället för bockas
(`145.2`-fallet: kryss mot fel bild); manifest-täckningskrav (36 grenar
utanför). Underlag: R1–R6-rapporten §R1–R3+R5.

**G2 — Facit-identitet, godkännande och rivning** (R4+R6+K7). Öppna beslut:
namnklass-sanering och manifest-scope (1 av 22 kataloger; prefix-grindningen);
`godkand`-fältets koppling till Marcus faktiska kvittens (självbetjäning
idag); rivningsgrindens djup (kommentarsrad passerar); skydd för
facit-FRAMSTÄLLNINGEN (F19). Underlag: R1–R6-rapporten §R4+R6 +
tidslinjens F19.

**G3 — Prototyp-arkitekturen: delad kod och mekanisk jämförelse** (R7+R8+K5).
Öppna beslut: variant-form för FRAMTIDA prototyper (O1 behåll / O2 separata
routes / O3 hybrid med en läspunkt / O4 minimal härdning — ADR-074:s
live-växlingsvärde är mätt och ska vägas, inte antas); mekanisk jämförelse
(O1 tvåfönster-diff med repo-precedent / O2 visual per läge, blockerad av
`T87` / O3 DOM-diff / O4 mekaniserad ögon-checklista — O1/O3 fäller ATT ytor
skiljer sig, endast Marcus öga avgör VILKEN som är rätt); dev-serverns
delade-resurs-fråga. Research-behov: branschprecedent för båda
options-rymderna är OMÄTT (ingen webresearch gjord — deklarerat öppet, inte
tunt). Underlag: R7–R9-rapporten.

**G4 — Skivning och spec-disciplin** (R9+K3:s spec-fel-serie). Öppna beslut:
skivsnitt prövas mot kodens kopplingar (fragmentet finns; mekanism saknas);
regeln "varje facit-yta har ett ÄGANDE kort" (åtgärds-ytan saknar ännu ett);
spec-fels-vakt i uppdragsledet (sex fel i rad, alla fångade externt).
Underlag: R7–R9-rapporten §R9 + tidslinjens F26-serie.

**G5 — Apparatens ekonomi och leveransvägen** (K4+K2/F13). Öppna beslut: när
agent-apparat kontra direkt redigering (T134:s 3×-mätning är första
datapunkten; fyra hypoteser oprövade); kontext-återanvändning mellan skivor;
push-/leverans-kadensen som inte "bet" trots åtgärder (`T126`). Underlag:
`T134`-kortet + tidslinjens F13/F34/F35.

**G6 — Parallellitet och kontinuitet** (K1+K6, delar av K2). Öppna beslut:
mekanisering av stale-dok-vakten (tidslinjens rekommendation 1: billigaste
högfrekvens-fixen); ägarlapp-UX efter F55 (kräver först egen utredning av
`s93-agarlapp-regelbarare`-transkriptet); axel-rörlighet under paus
(nummer-reservation). Underlag: tidslinjen §Sammanställning + F55.

K8 (granskningsbarhet dag 1) är för smal för egen grillning — föreslås som
punkt i G3 (prototyp-passets förkrav) eller direkt i `/prototype`-skillens
nästa iteration.

---

## Del 4 — Akuta punkter som INTE väntar på grillning (spår B-kandidater)

1. **`EventDetail.tsx:284` saknar DEV-grind** — enda produktions-nåbara
   prototypgrenen (stickprovs-bekräftad). Liten, avgränsad härdning.
2. **`145.3`/`145.5` DoD #6 styr mot fel åtgärd** — "ta om baslinjen"
   adresserar inte R8; posten ska skrivas om innan den betalas.
3. **Åtgärds-ytan saknar ägande kort** — R9:s lucka står öppen även för det
   KOMMANDE A1–A6-arbetet; skivningen av A1–A6 måste ge den en ägare.
4. **Backlog-stängningsgrindens 19 inkonsistenta kort** (nightly röd) — våra
   `145.x`/`146.x` bland dem; bokföringsstädning + fråga om grinden ska
   kunna köra oftare än nightly.
5. **`facit.json` saknar registret** — manifest-scopet måste utvidgas INNAN
   A1–A6 byggs, annars byggs mot ett manifest som inte ser ytan där 4–5 av 6
   avvikelser sitter.

---

## Del 5 — Öppet outrett (carry)

Från rapporternas egna osäkerhets-sektioner, samlat: ~194 Marcus-turer i
transkriptet ogranskade (filter-urval); F55:s orsak/lösning (592 rader
oläst); `T135`:s rotorsak; produktions-bundle-beviset för `:284`-grenen
(inferens, mätning utskriven i R7–R9-rapporten); facit-mekanismens
förebyggande effekt (byggd sist i fönstret, aldrig prövad på ny händelse);
S100-underleveransens rotorsaks-släktskap (HYPOTES); branschprecedent för
G3:s options-rymder; aggregerad totalkostnad för hela arcen (ingen källa
summerar Del 2–8 i jämförbara enheter).
