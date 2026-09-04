# Facit-pensionering s102-dokument-konvergens — underlag för TASK-309.21

- **Kort:** `TASK-309.21` (parent `TASK-309`)
- **Datum:** 2026-08-26
- **Utredare:** bygg-agent, docs-only pass — rör ALDRIG `godkand`-fält, stämplar
  eller pensionerar inget själv
- **Källmärkning:** varje faktapåstående nedan bär fil/rad/kommando. Ett
  påstående utan källa är markerat HYPOTES.

## 0. Premiss-pass — origin/main rörde sig under detta pass (ADR-086)

Denna utrednings worktree skapades ur `192bbd29`. Ett `git fetch origin
main` inför landningen visade att `origin/main` (`9d15fa0a`) hade rört sig
med 27 commits under tiden, inklusive **`515028c4` "fix(dokument):
[TASK-309.20] retagning av s108-generering-facit på orkestrerarorder"** —
en landning som rör EXAKT de två manifest denna utredning analyserar.

**Diff-verifierat** (`git diff 192bbd29..origin/main -- tasks/sessions/bilagor/s108-generering/facit.json tasks/sessions/bilagor/s108-dokumentytan/facit.json`):
endast `not`-fälten ändrades (ett tillägg vardera); `godkand` (fortsatt
`null` i båda), `bilder`, `kallor` och `referenser` (0 resp. 12,
oförändrat) rörs INTE. **Denna utrednings AC #3-räkning (24 ytor) och
AC #1/#2-analys (gap-bedömningen, rekommendationerna) påverkas därför
INTE strukturellt** — men ett sakförhållande jag citerade som öppet är nu
delvis åtgärdat:

`TASK-309.20` (landad `515028c4`, 2026-08-26, EFTER denna worktrees bas)
fixade den ENA av de två 375 px-formdefekter `s108-generering`s manifest
ursprungligen flaggade som "inte åtgärdade av denna skiva" (§ 5 nedan,
citatet om "FORMOBSERVATION VID 375 px"): räckviddslägets ikonknappar som
låg delvis över `RackviddBadge`-pillen. `facit-dokumentyta-rackviddslage-mobil.png`
är omtagen och visar nu den fixade formen (källa:
`git show origin/main:tasks/sessions/bilagor/s108-dokumentytan/facit.json`,
`not`-fältets nya stycke "UPPDATERAT 2026-08-26 (TASK-309.20)"). **Den
ANDRA defekten — dokumentlistans radtrunkering vid fyra ikonknappar,
synlig i `s108-generering/facit-dokumentlista-inaktuell-rad-mobil.png` —
är explicit INTE åtgärdad av samma kort** ("VILKEN INTE ÄR OMTAGEN AV
DENNA SKIVA... bokfört som öppen fråga i TASK-309.20:s Final Summary, inte
tyst utelämnat", samma källa). Samma dags-svep mintade dessutom fyra nya
fynd-kort ur Marcus prod-röktest av just dokument-ytan (`TASK-309.24`–
`.28`, commits `d6d5b4bc`/`7b07d05b`) — ytan är alltså under FORTSATT aktiv
polering just nu, inte färdig-och-vilande.

**Konsekvens för denna utrednings leverans:** grenen från `192bbd29` är
övergiven; PR:en byggs mot `origin/main`s tipp (`9d15fa0a`) i stället, så
diffen är minimal och rätt. Citat i § 5 nedan (`s108-dokumentytan`s
"SUPERSEDERAR INTE..."-stycke) är hämtade och verifierade mot den FÄRSKA
filversionen på `origin/main` — den elidering (`...`) jag gjort i citatet
råkar hoppa över exakt den mening som ändrades, så citatet är sant i BÅDA
versionerna. **375 px-fixen och den event-scoped-lista-gap som § 5
beskriver är TVÅ SKILDA FYND** — 375px rör en renderings-defekt inom en
redan tagen bild (räckviddsläget), gapet i § 5 rör en HELT OSAKNAD
bild-uppsättning (event-scoped listan). Ingen av rekommendationerna i
§ 1–5 ändras av fyndet ovan.

## Sammanfattning

`s102-dokument-konvergens/facit.json` (stämplat 2026-08-16, sha `cc1d7c53`)
har **tre** bokförda avvikelser mot den levande ytan (två 2026-08-17-
amenderingar + en 2026-08-23) och täcks **delvis, inte helt**, av de två
nya `s108`-faciten. Ett verkligt gap finns: **ingen av de tre manifesten
(s102, s108-generering, s108-dokumentytan) visar dagens Visa/förhandsvisnings-
beteende för en befintlig bilaga/mall/kvitto INOM ett valt events fullt
filtrerbara lista** — s108-dokumentytan visar samma ikonpar men i
räckviddsläget (inget event valt), och s108-generering visar en annan lista
(genereringsvyns mallrader). Rekommendation: **pensionera s102 ändå, med
gapet explicit bokfört och ett uppföljningskort rekommenderat** (se § 5) —
inte omstämpla, eftersom s102:s "Visa-overlay"-beskrivning avser en
funktion som är RIVEN ur koden (dialog-baserad förhandsvisning, ersatt av
TASK-273.4:s ikonpar) och `--ersatt` inte kan reparera det (flaggan byter
bara `godkand`-blocket, aldrig `bilder`/`kallor`/`not`).

`--ersatt` är **inte** en "manifest A ersätter manifest B"-mekanism. Den är
en **omstämplings**-flagga för SAMMA manifest (skriver över ett redan satt
`godkand`-fält). Den kanoniska formen för att pensionera ett HELT manifest
till förmån för ett annat är **arkivflytt + `ARKIVERAD.md` + pekar-svep**
(etablerat prejudikat, [[L610]],
instans `s55-hem-konvergens` → `s102-hem-konvergens`, `TASK-243.1`, PR #1426).

24 stämplade ytor (av 28 totalt stämplade, i 15 manifest) saknar
`referenser`-nyckeln — mätt två gånger (grinden själv + oberoende
node-skript, identiskt resultat). Rekommendation för AC #4: **varna,
fäll inte** — se § 4 för fullt underlag.

De tre AMENDERING-filerna (AC #2) väntar samtliga uttryckligen på Marcus
omstämpling via `--ersatt` — men för s102:s del blir frågan moot om
pensionering väljs (arkivet fryser hela katalogen, ingen restämpling
behövs). Se § 3.

---

## 1. Mekaniken — vad `--ersatt` faktiskt gör, och vad pensionering kräver

**Källa:** `scripts/facit-godkann.mjs` rad 1–103 (filhuvud), 187–212
(`tillampaGodkannande`), 328–350 (`renderHelp`).

`npm run facit:godkann -- --pass <namn> --citat "..." --ersatt` kör
`tillampaGodkannande()`:

```js
const nyttGodkand = { av: 'marcus', datum: nu.toISOString().slice(0, 10), citat: args.citat, sha };
return { ...manifest, godkand: nyttGodkand };
```

**Det enda fältet som skrivs om är `godkand`.** `bilder`, `kallor`, `not`,
`ytor`-strukturen i övrigt lämnas exakt som de var (rad 211: spread av hela
det gamla manifestet, bara `godkand` byts ut). `--ersatt` krävs ENDAST för
att komma förbi guard-klausulen på rad 191–196 ("fältet 'godkand' är redan
satt. Använd --ersatt..."). Det är alltså en **omstämplings-form för samma
manifest**, inte en "det här manifestet ersätter/pensionerar ett annat"-
deklaration. Manifestet har inget fält för att peka på en föregångare eller
efterträdare — `prototyp`, `last`, `lasning`, `godkand`, `ytor` är hela
schemat (`scripts/lib/facit-validera.mjs`, verifierat mot samtliga 15
levande manifest).

**Kanonisk form för pensionering (ett HELT manifest tas ur bruk):**
arkivflytt. Källa: [[L610]]
(hel lärdomsfil, citerad i sin helhet nedan eftersom den ÄR svaret på
uppdragets fråga "finns ingen form: säg det och föreslå den minsta som
håller invarianterna"):

> "När en yta byggs om från grunden pekar det gamla, stämplade facitet på
> komponenter som inte längre finns, och facit-grinden fäller. Radering är
> fel svar: kvittot på en genomförd granskning är historik som ska
> överleva. Formen som gäller är ARKIVFLYTT — bilagekatalogen flyttas under
> `tasks/sessions/archive/bilagor/`, en `ARKIVERAD.md` förklarar varför och
> vad som ersatte den, och alla inpekningar svepas i SAMMA landning."

Instans, disk-verifierad: `tasks/sessions/archive/bilagor/s55-hem-konvergens/`
innehåller det ORÖRDA gamla manifestet + alla facit-bilder + en
`ARKIVERAD.md` (läst i sin helhet):

```text
# ARKIVERAD — superseded av s102-hem-konvergens

Detta facit (S55, K10-formen av hem-vyn, godkänt av Marcus och omstämplat
2026-08-15 med verb-copy-undantaget) beskrev den hem-form som ERSATTES av
Morgonkollen vid TASK-243.1-promoveringen (S102, 2026-08-16). Nya
hem-facitet: tasks/sessions/bilagor/s102-hem-konvergens/facit.json.

Katalogen flyttades hit ur tasks/sessions/bilagor/ på Marcus vägval
("Kör 1, arkiv-flytten", 2026-08-16) eftersom facit-grinden
(scripts/check-facit.sh invariant b) korrekt kräver att aktiva manifests
källfiler finns på disk — och K10-komponenterna raderades av
promoveringen. Arkivet ligger utanför grindens svep (FACIT_BILAGE_ROT).
Innehållet är FRUSET...
```

**Är denna form över ADR-baren (`~/.claude/CLAUDE.md` § ADR-BAR)?** Nej —
den är redan mekaniserad implicit genom `FACIT_BILAGE_ROT` (arkivet ligger
strukturellt UTANFÖR grindens svep, ingen kodändring krävs) och redan
prejudikat-bärande (en instans, samma mönster upprepningsbart). Ingen ny
ADR behövs; formen är redan skriven ned i lessons.d och räcker som
styrande norm.

**Görbart utan att röra `godkand`?** Ja, verifierat mot hooken.
`scripts/deny-facit-godkand-skrivning.sh` (rad 1–80 lästa) matchar Edit/
Write mot ett manifest ELLER Bash-kommandon som (Kanal A) direkt anropar
`facit:godkann`/`facit-godkann.mjs`, eller (Kanal B) nämner `godkand` OCH
ett skriv-vektor-mönster (redirect/`tee`/`sed -i`/`jq -i`) mot en
facit-sökväg. Ett `git mv tasks/sessions/bilagor/s102-dokument-konvergens
tasks/sessions/archive/bilagor/` nämner varken `godkand` eller ett
skriv-vektor-mönster — det är en filsystemsoperation, inte en JSON-mutation
— och matchar därför INGENDERA kanalen. Detta är konsekvent med att
`TASK-243.1`s stängande agent faktiskt utförde arkivflytten
([[L610]]:
"Två självfångade verktygsfel uppstod under själva flytten... båda rättade
öppet i samma pass" — flytten skedde, alltså blockerade hooken den inte).

**Vad en pensionerings-skiva konkret måste göra** (för uppföljningskortet,
INTE utfört i detta pass):

1. `git mv tasks/sessions/bilagor/s102-dokument-konvergens tasks/sessions/archive/bilagor/s102-dokument-konvergens`
2. Skriv `ARKIVERAD.md` i den nya katalogen (samma form som s55:s, se ovan)
   — pekar på `s108-generering` + `s108-dokumentytan`, och bokför GAPET
   (§ 5) explicit i texten så nästa läsare inte tror täckningen är fullständig.
3. Pekar-svep: kommentar-referenser i **levande, icke-historiska** filer
   (grep-verifierat, `grep -rln "s102-dokument-konvergens"` minus
   `backlog/tasks/*` och `tasks/sessions/2026-*` som är historiska
   sessionsdok/kort och INTE ska skrivas om):
   - `.facit-policy.conf` rad ~151 (kommentar om DOKUMENT-YTAN-markören —
     historisk, redan borttagen markör, troligen ingen ändring behövs men
     värd en blick)
   - `src/components/dokument/DokumentYta.tsx` rad 6, 86, 134, 419
     (docblock-kommentarer som pekar på manifestets sökväg och de tre
     AMENDERING-filerna — bör uppdateras till arkiv-sökvägen)
   - `tests/e2e/mer-index.staging.test.ts` rad 47, `tests/visual/dokument-visual.spec.ts`
     rad 10 (docblock-kommentarer, samma sak)
   - `docs/decisions/ADR-102-...md` rad 328 (redan historisk prosa om
     TASK-287-eran — sannolikt ingen ändring, bara läs igenom)
   Samtliga är KOMMENTARER/prosa, ingen är en programmatisk import eller
   testfixtur-sökväg — verifierat med `grep -n` mot var och en (inga
   `require`/`import`/`readFileSync`-träffar mot just den sökvägen hittades).
4. De tre AMENDERING-filerna i s102-dokument-konvergens (två 08-17 + en
   08-23) flyttar MED katalogen och förblir orörda — de blir en del av det
   frusna historiska facitet, exakt som s55:s
   `AMENDERING-2026-08-15-verbcopy.md` gjorde.

---

## 2. AC #3 — hur många stämplade ytor saknar `referenser`

**Mätt två gånger, identiskt resultat:**

1. `bash scripts/check-facit.sh` (fångad exitkod separat i en fil, se § 6):
   > "✅ Facit-manifest OK: 15 manifest, 30 ytor deklarerade, 2 ogodkända...
   > Innehållslås (invariant d): 11 referenser låsta mot sha256 i stämplade
   > manifest; **24 stämplade ytor saknar "referenser"** och är därmed INTE
   > innehållslåsta."
2. Oberoende node-skript som itererar samtliga 15 manifest under
   `tasks/sessions/bilagor/` och räknar `ytor` med `godkand` satt där
   `!("referenser" in yta)` — **24**, samma tal, samma ytor.

**Fullständig lista (manifest · yta), 24 poster:**

| # | Manifest | Yta |
|---|---|---|
| 1 | `s102-dokument-konvergens` | Dokument-ytan /mer/dokument, lista med filter + Visa-overlayens tre klasser |
| 2 | `s102-hem-konvergens` | hem-vyn V1 "Lugna morgonen" (dev-route /dev/hem-prototyp?variant=1) |
| 3 | `s102-svep-konvergens` | Sändytan — bekräftelse-/påminnelsesvepen som OVERLAY ovanpå Hem |
| 4 | `s103-checkin-konvergens` | check-in (dörrlistan, variant D) |
| 5 | `s103-persondetalj-konvergens` | persondetaljen |
| 6 | `s104-segment-divergens` | segment-listan |
| 7 | `s104-segment-divergens` | tackningsvyn |
| 8 | `s104-segment-divergens` | nytt-segment-mallvyn |
| 9 | `s104-segment-divergens` | verkstaden |
| 10 | `s104-segment-divergens` | segment-detaljvyn |
| 11 | `s104-segment-divergens` | generatorn |
| 12 | `s104-segment-divergens` | utskicksvyn |
| 13 | `s106-aktivitetslogg` | aktivitetshistorik-sidan |
| 14 | `s109-meddelandefamiljen-konvergens` | uppdateringsnotis |
| 15 | `s109-uppdateringsnotis-konvergens` | chunk-banner |
| 16 | `s90-personlistan-konvergens` | personlistan |
| 17 | `s93-atgardssida-promovering` | atgarder-tomt-lage |
| 18 | `s93-atgardssida-promovering` | atgarder-mottagarurval |
| 19 | `s93-atgardssida-promovering` | atgarder-granskning |
| 20 | `s93-hallplats-prototyp` | anteckningar |
| 21 | `s93-hallplats-prototyp` | betalningar |
| 22 | `s93-hallplats-prototyp` | gruppdynamik |
| 23 | `s93-hallplats-prototyp` | atgarder |
| 24 | `s93-hallplats-prototyp` | register |

**Två av dessa saknar `referenser` MED AVSIKT, inte som lucka** (fynd ur
`TASK-288` kommentar #1, 2026-08-22): `chunk-banner` (`s109-uppdateringsnotis-konvergens`,
manifestets `not`: *"Ingen facit-bild låstes... enbart som kontrast"*) och
`uppdateringsnotis` (`s109-meddelandefamiljen-konvergens`, manifestets
`not`: *"Ingen egen bild här — notisens facit bor i sitt eget manifest..."*).
Räkningen ovan följer `check-facit.sh`s egen (mekaniska, avsiktsblinda)
räkning — de två är alltså inbakade i talet 24, inte separat exkluderade,
i enlighet med vad grinden faktiskt mäter.

**Kontrastcheck (declared, ej saknad):** `s108-generering` (12 referenser,
ännu OGODKÄND — räknas inte i "stämplade ytor"), `s108-dokumentytan`
(`"referenser": []`, deklarerad frånvaro, ogodkänd), `s109-meddelandefamiljen-konvergens`
"meddelanderutan" (8 st) + "appfel-sidan" (2 st), `s109-uppdateringsnotis-konvergens`
"uppdateringsnotis" (1 st, se ovan — TVÅ olika ytor med snarlikt namn i
olika manifest), `s111-anmalningssidan-konvergens` "anmälningssidan"
(`"referenser": []`, deklarerad frånvaro men STÄMPLAD).

**Källmärkning för uppdragets eget påstående:** uppdraget citerade
`check:docs` som källa för talet 24 ("check:docs skrev nyligen '24
stämplade ytor saknar referenser' — verifiera talet själv"). Det talet
är VERIFIERAT ovan, oberoende, två gånger.

### Divergens från uppdragets premiss (ADR-086) — `TASK-288`

Uppdraget hänvisade till `TASK-288` med orden *"TASK-288 gjorde det för 22
ytor — läs det kortet"*. **Detta är FALSKT, mätt mot kortets faktiska
status:** `npm run bl -- task 288
--plain` visar `Status: ○ To Do`, samtliga fyra AC okryssade. TASK-288 har
**aldrig utförts** — det beskriver ett FÖRESLAGET agent-görbart förarbete
(AC #1: producera en karta yta→{fil,sha256}) plus ett Marcus-moment (AC #2:
skriv fältet via `!`-kanalen) som INGENDERA har inträffat. Talet "22" i
kortets titel var ett ÖGONBLICKSVÄRDE vid kortets skrivning 2026-08-22 —
och kortets EGEN kommentar #1 (samma dag, 10:43 UTC) bokför redan att
talet hade rört sig till 24 innan dagen ens var slut: *"Räkningen skiljer
heller INTE på 'otäckt' och 'medvetet inget att täcka'... läs alltid om
AC #1:s karta mot en färsk körning av scripts/check-facit.sh innan arbetet
startar, lita inte på det nedskrivna talet."* Dagens 24 är alltså INTE "22
gjorda + 2 nya" — det är "0 gjorda, talet har vandrat från 22 till 24 i takt
med att fler ytor stämplats", exakt det kortet självt varnade för.

Av de 24: fyra manifest (`s90-personlistan-konvergens`,
`s93-atgardssida-promovering`, `s93-hallplats-prototyp`,
`s103-persondetalj-konvergens` — 10 av de 24 ytorna) namnger redan sina
`__aria__`-sökvägar i fritext (`not`-fältet), verifierat med
`grep -l "__aria__" tasks/sessions/bilagor/*/facit.json`. Resterande 14
ytor (`s102-dokument-konvergens` [pensioneras, moot], `s102-hem-konvergens`,
`s102-svep-konvergens`, `s103-checkin-konvergens`, `s104-segment-divergens`
[7 ytor], `s106-aktivitetslogg`) kräver mätning per yta innan
`fil`+`sha256` kan fyllas i — samma slutsats `TASK-288` själv drog för sin
tids 22.

---

## 3. AC #2 — de tre öppna AMENDERING-filerna

Samtliga tre är lästa i sin helhet. Alla tre har KLASSNING **(c)** (formen
ändras faktiskt, prod-synligt) och samtliga bär i sin sista rad exakt samma
mening: *"Väntar på Marcus omstämpling (ADR-104 beslut 1–2, `!`-kanalen,
`--ersatt`-formen)."*

| Fil | Yta | Väntar på | Blir s102-pensioneringen berörd? |
|---|---|---|---|
| `s102-dokument-konvergens/AMENDERING-2026-08-23-sidram-promovering.md` | Dokument-ytans sidkrom (inline → `SidRam`-primitiv, `TASK-299.11`) | Omstämpling av `s102-dokument-konvergens` | **JA — blir moot.** Om AC #1 väljer pensionering flyttar hela katalogen (facit.json + alla tre AMENDERING-filer) till arkivet i FRUST skick. Ingen restämpling behövs längre: manifestet lever inte vidare, det blir historia. `s108-dokumentytan`s bilder är redan tagna 2026-08-24 (efter `TASK-299.11` landade 2026-08-23) och visar redan den nya `SidRam`-formen — den aktuella ytan är alltså redan täckt FRAMÅT av det nya facitet för just sidkroms-frågan, om än inte för hela s102-ytan (se § 5:s gap). |
| `s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md` | Aktivitetshistorik-sidans sidkrom (samma `TASK-299.11`-ändring) | Omstämpling av `s106-aktivitetslogg` | **NEJ — helt orört av s102-frågan.** Denna yta lever oförändrad vidare; amendeing väntar fortfarande på Marcus `--ersatt`. |
| `s111-anmalningssidan-konvergens/AMENDERING-2026-08-23-sidram.md` | Anmälningssidans sidkrom (textlänk → `SidRam`, `TASK-299.10`) | Omstämpling av `s111-anmalningssidan-konvergens` | **NEJ — helt orört.** Samma som ovan; dessutom redan bevisat att BILDERNA är omtagna (alla sju, ny hermetisk rigg) och att promoverings-grindens `ariaSnapshot`-referenser körts om grönt (18/18) utan regenerering, eftersom sidkromet ligger utanför testets scope. Väntar bara på `--ersatt`-stämpeln själv. |

**Rekommendation per fil:**

- **s102:s sidram-amendering:** stäng den genom pensionering (arkivflytt),
  inte genom omstämpling. Motivera i `ARKIVERAD.md`: manifestet fryses med
  ALLA tre kända avvikelser bokförda (visa-till-ikonpar, räckviddsval,
  sidram), ingen enskild av dem kräver längre ett separat Marcus-beslut om
  hela ytan pensioneras.
- **s106 + s111:** omstämpla via `--ersatt` — se § 6 för exakt kommandoform.
  Dessa två är HELT OBEROENDE av s102-beslutet och kräver ingen väntan på
  det.

---

## 4. AC #4 — ska `check-facit` larma på avsaknad av `referenser`?

**Kostnad att backfilla, mätt:** `TASK-288`s egen analys (§ 2 ovan) + denna
utrednings uppdaterade split: 10 av 24 ytor har redan sina `__aria__`-vägar
i fritext (billigare backfill — "bara" transkribering + `shasum -a 256`
per fil), 14 kräver mätning per yta (dyrare — agenten måste först
IDENTIFIERA vilken ariaSnapshot-fil, om någon, hör till respektive yta).
Ett agent-görbart förarbetes-pass (kartan) plus ETT Marcus-moment (skriva
in kartan via `!`-kanalen, eftersom `ADR-104`-hooken fryser varje stämplat
manifest) är den enda vägen — ingen agent kan skriva fältet direkt.

**Risken med tystnad (denna instans, `TASK-309.21` självt):** `s102`s
Visa-overlay-avvikelse gick 8 dagar (2026-08-17 → 2026-08-24, då `TASK-309.10`
skrev "s108"-faciten) utan att NÅGON grind fällde, eftersom `s102` aldrig
hade en `referenser`-nyckel att innehållslåsa i första läget — hade den
haft en, hade avvikelsen ANDÅ inte fångats av just DEN mekanismen
(`referenser`-nyckelns ARIA-referens låser en ACCESSIBILITY-TRÄD-sökväg,
inte "täcker denna yta
fortfarande allt facit-bilderna visar"). `referenser`-avsaknad är alltså
INTE rotorsaken till att denna instans smög förbi — rotorsaken är att
`check-facit.sh` uttryckligen ALDRIG jämför renderad yta mot bilderna
("VAD GRINDEN INTE GÖR", `check-facit.sh` rad 56–60: *"Den avgör INTE om
skarpa ytan SER UT som facit... Jämförelsen självt förblir mänsklig"*).
Att fälla på avsaknad av `referenser` hade INTE fångat denna specifika
instans — de tre amenderingarna i `s102` visar tvärtom att MEKANISMEN redan
fungerade som avsett: varje avvikelse bokfördes öppet i en sidofil så fort
den upptäcktes, precis som `ADR-102`s regelverk föreskriver.

**Branschmönster** (`docs/research/godkannande-mekanik-hitl-branschmonster-2026-08-08.md`
§ 1 + `docs/research/mekanisk-design-mot-yta-jamforelse-branschmonster-2026-08-08.md`,
båda redan i repot, återanvända här i stället för omresearchade):

- **Percy** (BrowserStack): *"A baseline is an approved snapshot … all
  future comparisons depend on this reference, so it must be reviewed and
  intentionally accepted."* Referensen ÄR den lagrade bilden själv —
  identiteten är implicit i lagringsplatsen (Percys egen molntjänst), inte
  en separat deklarerad hash-pekare i ett bredvidliggande metadata-fält.
- **Chromatic**: kopplad build/commit (implicit) — samma mönster, ingen
  dokumenterad separat referens-fil-mekanik.
- **BackstopJS**/**Storybook**: `approve` befordrar en ändrad bild direkt
  till ny baseline — återigen, bilden ÄR referensen, inget separat
  hash-fält att deklarera eller sakna.
- Ingen av de fyra granskade verktygen kräver ett fristående,
  manuellt underhållet "källa + hash"-fält utöver själva baseline-
  artefakten. Vårt `referenser`-fält (ariaSnapshot-hash, `ADR-103` B4) är
  en EGEN, striktare mekanism byggd OVANPÅ branschmönstret (bilderna själva
  = facit, Marcus öga = granskningen) — inte en implementation AV det.

**Rekommendation: VARNA, fäll inte — åtminstone inte retroaktivt.**
Skälen:

1. Ett omedelbart blockerande krav hade fällt `main`s egen CI redan i dag
   (24 av 28 stämplade ytor saknar fältet) — en total omkastning från grönt
   till rött över natten, utan migrations-fönster, för en mekanism som
   ADR-102 § A6 redan öppet dokumenterar som "täckningen är noll i dag, och
   det syns" (medvetet, inte ett förbiseende).
2. Branschprecedent kräver INTE denna specifika form (se ovan) — att bygga
   den är ett medvetet val UTÖVER golvet, inte en golv-brist att stänga.
3. Grinden skriver redan ut luckan vid VARJE körning (R5-disciplinen,
   `check-facit.sh` rad 279–283) — frånvaron är synlig, inte tyst, vilket
   är ADR-083s krav (en mekanism som INTE påstår mer täckning än den har).
4. Den faktiska rotorsaken till att `TASK-309.21`s instans smög förbi är en
   ANNAN mekanism (grinden jämför aldrig rendering mot bild, se ovan) —
   att fälla på `referenser` hade inte stoppat just detta fall, så det
   löser inte det problem uppdraget använder som motivering.

**Om Marcus ändå vill skärpa framåt** (inte retroaktivt): en billigare,
mer proportionerlig form är att `scripts/facit-godkann.mjs` varnar (inte
blockerar) om INGEN yta i manifestet som stämplas har en `referenser`-nyckel
(varken populerad eller `[]`) — det tvingar fram ett MEDVETET val ("ja, den
här ytan saknar mekaniskt lås, och det är okej") vid just LÅSNINGS-
ögonblicket (samma ändpunkts-disciplin som `.facit-policy.conf`s
markör-regel redan följer), utan att straffa de 24 redan stämplade. Detta
är en DESIGN-option, inte något denna utredning bygger — ADR-102-frågan
tillhör Marcus.

---

## 5. AC #1 — premiss-prövning: täcker s108-faciten allt s102 täckte?

**s102-dokument-konvergens** (EN yta): "Dokument-ytan /mer/dokument, lista
med filter + Visa-overlayens tre klasser" — 5 bilder: `facit-dokument-lista-{desktop,mobil}`
(den fullt filtrerbara listan i ETT events kontext, alla tre dokumentklasser
blandade) + `facit-dokument-visa-{bilaga,mall,kvitto}-desktop` (den GAMLA
dialog-baserade Visa-overlayen, `<iframe>`/`<img>`-inbäddad förhandsvisning).

**s108-generering** (EN yta): Genereringsvyn (`?vy=generering`) — listan i
genereringsläge (mallrader som ENTRY POINTS för att skapa nya dokument),
block-dialogens tre lägen, datum-morfen, resultat-efter-Skapa, den
inaktuella-radens badge. Detta är en ANNAN vy än s102:s lista — den
genererar nya dokument, den visar inte en befintlig bilagas Visa-beteende.

**s108-dokumentytan** (EN yta): räckviddsläget ("Delade dokument", inget
event valt — `GemensamtLage`) + eventväljaren öppen. Bilden
`facit-dokumentyta-rackviddslage-*` visar VISSERLIGEN en dokumentrad med
dagens ikonpar (Öppna/Ladda ner/Ersätt/Radera) — men i RÄCKVIDD-läget
(gemensamma dokument, inget event valt), inte i s102:s kontext (ett VALT
events fullt filtrerbara lista med alla tre dokumentklasser blandade).

**GAPET, konkret:** ingen av de tre manifesten visar **ett valt events
dokumentlista, med alla filterlägen, där en befintlig bilaga/mall/kvitto
öppnas/förhandsvisas med DAGENS ikonpar-beteende** (i stället för s102:s
gamla dialog). Detta är INTE en gissning — det är redan bokfört, källmärkt,
i `s108-dokumentytan/facit.json`s eget `not`-fält (läst i sin helhet ovan
i utredningen, citerat här ordagrant eftersom det ÄR svaret på uppdragets
egen fråga):

> "SUPERSEDERAR INTE s102-dokument-konvergens, MEN DIVERGERAR MÄTBART FRÅN
> DEN... Detta manifest RÖR INTE s102:s — ett stämplat manifest är
> agent-fruset (ADR-104-hooken) — utan bokför divergensen så att nästa
> läsare som jämför de två katalogerna inte tror sig ha hittat en
> regression i skiva 7. Att avgöra vad som ska hända med s102:s bilder
> (amendering, omstämpling, eller inget) är Marcus, inte en agents."

Med andra ord: skiva 9-agenten (TASK-309.10) SÅG redan detta gap och
lämnade det uttryckligen öppet för just detta beslut.

**Är omstämpling (väg b) en framkomlig alternativ väg?** Nej, av ett
strukturellt skäl utöver gapet: s102:s yta-BESKRIVNING ("...+ Visa-
overlayens tre klasser") pekar på en funktion som är RIVEN ur koden.
`src/components/dokument/DokumentYta.tsx` rad 75–87 (docblock, läst i sin
helhet): *"[ERSATT, TASK-273.4] VISA-BETEENDET nedan (dialog-baserad
Visa-knapp) är RIVET... Visa-dialogen ersatt av TVÅ ikonknappar per rad."*
Att omstämpla s102 (`--ersatt`) hade BARA bytt ut `godkand`-blocket — inte
`bilder`, `not` eller `kallor` (se § 1) — och därmed producerat ett
FÄRSKT-DATERAT kvitto som fortsatt visar en dialog som inte längre går att
klicka fram i appen. Det vore sämre än att lämna det stämplat med sina
öppna amenderingar, eftersom en ny datumstämpel signalerar "aktuellt
granskat" om något som är bevisligen inaktuellt.

**Rekommendation: (a) pensionera ändå, med gapet explicit bokfört.**
Underbyggnad:

1. s102 är redan tre generationer bakom (visa-till-ikonpar 08-17,
   räckviddsval 08-17, sidram 08-23) — samtliga tre klass (c),
   prod-synliga, samtliga väntande.
2. Dess kärnbeskrivna funktion (dialog-Visa) existerar inte längre i
   koden — det finns inget "identiskt" att jämföra mot.
3. `--ersatt` löser inte staleness (byter bara datumstämpeln, inte
   bilderna) — se ovan.
4. Arkivflytt är REDAN etablerat, mekaniskt fritt (§ 1), och kräver inget
   nytt beslut om HUR.
5. Gapet är redan en gång bokfört av skiva 9 (citatet ovan) — pensionering
   med ett andra, tydligt bokfört gap-omnämnande i `ARKIVERAD.md` fortsätter
   den disciplinen i stället för att låtsas att gapet inte finns.

**Vad pensioneringen INTE löser, och som bör bli ett eget uppföljningskort
(rekommenderat, INTE mintat av denna utredning):** en ny facit-fångst av
"ett valt events fulla dokumentlista + dagens ikonpar-Visa-beteende" —
antingen som en utökning av `s108-dokumentytan` (lägg till en tredje bild-
uppsättning för eventläget) eller ett helt nytt manifest. Detta är en
KOD-görbar skiva (screenshots + manifest-skrivning MEDAN `godkand` är
`null`, ingen ADR-104-friktion), inte ett Marcus-moment i sig — bara den
slutgiltiga stämplingen är det.

---

## 6. Marcus morgonsekvens — exakta `!`-kommandon i ordning

Kör i chatten, med `!`-prefixet (kanalseparation, `ADR-104` § Beslut 2).
Samtliga körs från repo-roten. Ordningen följer uppdragets egen (s108-
generering → s108-dokumentytan → AMENDERING-hanteringen); ingen av de tre
stegen beror tekniskt på ordningen mellan sig, förutom att s102-beslutet
(pensionera vs. omstämpla) bör vara AVGJORT innan steg 3 körs, eftersom det
avgör om steg 3a (pensionering, INTE en `!`-kommando) eller steg 3a'
(omstämpling, en `!`-kommando) ska köras.

**Steg 1 — stämpla s108-generering (första stämplingen, `godkand` är
`null` i dag, `--ersatt` varken behövs eller ska användas):**

```bash
! npm run facit:godkann -- --pass s108-generering --citat "<dina ord — t.ex. bekräfta att genereringsvyn i alla arton lägen är godkänd>"
```

**Steg 2 — stämpla s108-dokumentytan (första stämplingen, samma form):**

```bash
! npm run facit:godkann -- --pass s108-dokumentytan --citat "<dina ord — bekräfta räckviddsläget + eventväljaren>"
```

*(Innan du kör detta: manifestets egen not-text flaggar öppet att
räckviddslägets bild DIVERGERAR mätbart från s102 — se § 5. Det är
förväntat och bokfört, inte ett fel i denna skiva.)*

**Steg 3 — hantera s102-dokument-konvergens (AVGÖR FÖRST: pensionera eller
omstämpla — denna utrednings rekommendation är pensionera, § 5):**

- **Om pensionera (rekommenderat):** INGET `!`-kommando här. Detta är
  kod-arbete (git mv + `ARKIVERAD.md` + pekar-svep, § 1) för ett separat
  bygg-kort, inte en stämpling. Du behöver bara BESLUTA riktningen —
  orkestreraren mintar och kör uppföljningskortet.
- **Om omstämpla i stället** (avviker från rekommendationen — kräver att du
  medvetet accepterar att bilderna förblir de gamla dialog-baserade, se §
  5:s varning):

  ```bash
  ! npm run facit:godkann -- --pass s102-dokument-konvergens --citat "<dina ord>" --ersatt
  ```

**Steg 4 — s106-aktivitetslogg (omstämpling, OBEROENDE av s102-beslutet):**

```bash
! npm run facit:godkann -- --pass s106-aktivitetslogg --citat "<dina ord — bekräfta SidRam-sidkromet, TASK-299.11>" --ersatt
```

**Steg 5 — s111-anmalningssidan-konvergens (omstämpling, OBEROENDE av
s102-beslutet):**

```bash
! npm run facit:godkann -- --pass s111-anmalningssidan-konvergens --citat "<dina ord — bekräfta SidRam-sidkromet + listkortets undantag, TASK-299.10>" --ersatt
```

**Steg 6 — AC #4 (referenser-larm):** inget kommando — detta är ett
beslut ("varna" rekommenderat, se § 4) som orkestreraren/du fattar i ord,
inte något som stämplas. Ett JA på "fäll" blir ett eget bygg-kort
(ändring av `scripts/facit-godkann.mjs` eller `check-facit.sh`).

---

## Källor

- `scripts/facit-godkann.mjs` (hela filen läst)
- `scripts/check-facit.sh` (hela filen läst)
- `scripts/lib/facit-validera.mjs` (delvis, grep + strukturgenomgång)
- `scripts/deny-facit-godkand-skrivning.sh` rad 1–80
- `.facit-policy.conf` (hela filen läst)
- `docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md`
  (hela filen läst, inkl. båda 2026-08-22-amenderingarna)
- `docs/decisions/ADR-104-godkannande-mekaniken-kanalseparation.md` (hela
  filen läst)
- [[L610]] (hela
  filen läst)
- `tasks/sessions/archive/bilagor/s55-hem-konvergens/ARKIVERAD.md` (hela
  filen läst)
- `tasks/sessions/bilagor/s102-dokument-konvergens/facit.json` +
  samtliga tre AMENDERING-filer i samma katalog (alla lästa i sin helhet)
- `tasks/sessions/bilagor/s108-generering/facit.json` (hela filen läst)
- `tasks/sessions/bilagor/s108-dokumentytan/facit.json` (hela filen läst)
- `tasks/sessions/bilagor/s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md`
  (hela filen läst)
- `tasks/sessions/bilagor/s111-anmalningssidan-konvergens/AMENDERING-2026-08-23-sidram.md`
  (hela filen läst)
- `src/components/dokument/DokumentYta.tsx` rad 1–160, 419 (docblock +
  grep)
- `backlog/tasks/task-288 ...md` (`npm run bl -- task 288 --plain`, inkl.
  kommentar #1)
- `backlog/tasks/task-309.8 ...md` (`npm run bl -- task 309.8 --plain`,
  korsverifiering av manifestens AC #4-påstående)
- `docs/research/godkannande-mekanik-hitl-branschmonster-2026-08-08.md`
  § 1 (Percy/Chromatic/BackstopJS/Storybook-citaten)
- `docs/research/mekanisk-design-mot-yta-jamforelse-branschmonster-2026-08-08.md`
  (baseline-mönster, O1–O3-tabellen)
- `bash scripts/check-facit.sh` — körd, exit 0, utdata sparad
  (scratchpad, se slutrapport för sökväg)
- `node -e '...'` — oberoende räkning av 24-listan, körd i denna session
