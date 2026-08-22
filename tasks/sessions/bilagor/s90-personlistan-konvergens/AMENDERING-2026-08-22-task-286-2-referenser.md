# Amendering 2026-08-22 — TASK-286.2:s referensuppdatering (PR #1715)

**Pass:** TASK-286.2 (Skiva: Listan byter källa — tracer bullet, registret i
cachen, sök i klienten med bevisad paritet, paginerad rendering), barn av PRD
TASK-286 (personregistret).

**Berört manifest:** `tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json`,
yta `personlistan` (godkänd 2026-08-10, citat "Ser bra ut, godkänner", sha
`4ebdcfc85a78df14c47cff058472d1b4da0d8adf`).

**Skäl för sidofilen, inte ett fält i manifestet:** uppdraget till denna agent
bad ursprungligen om ett nytt `amendering`-fält direkt i `facit.json`. Det
visade sig mekaniskt omöjligt: `scripts/deny-facit-godkand-skrivning.sh`
(ADR-104 § Beslut 2) nekar VARJE `Edit`/`Write` mot ett facit-manifest vars
RESULTERANDE `godkand` är icke-null — oavsett om fältet själv rörs eller ej,
eftersom hjälparen (`scripts/lib/facit-godkand-skrivning.mjs`) bara läser
sluttillståndet, inte en diff. Prövat skarpt i denna session: ett `Edit`-försök
som enbart lade till ett obelaterat `amendering`-fält i `ytor[0]` nekades med
"Edit mot … skulle sätta 'godkand' till ett icke-null-värde." Samma utfall,
samma mekanism, som `s102-hem-konvergens`-precedentet
(`AMENDERING-2026-08-17-hover-och-etikett.md`, "ADR-104-hooken nekade ×2,
korrekt") — ett redan godkänt manifest är agent-fruset för ALLA skrivningar,
inte bara `godkand` självt. Denna fil beskriver avvikelsen och lämnar
inbakningen i manifestet till Marcus via `!`-kanalen; agenten skriver aldrig
`godkand` själv, och kan för närvarande inte heller skriva något annat fält i
ett redan godkänt manifest.

**Öppen tråd, samma yta:** `T157` — "ADR-102 saknar amenderings-mekanik för
ett STÄMPLAT facit" — registrerades 2026-08-21 (S109) för exakt detta gap, på
en ANNAN förändring av samma manifest (bokstavsindexet, TASK-283-serien; väg
A där var att Marcus egna citat skrivs in i `facit.json` som daterad
amendering EFTER hans visuella godkännande, inte att en agent skriver det).
Tråden är `paused`/olöst per `tasks/threads/T157-adr-102-saknar-amenderings-
mekanik-for-stamplat-facit.md` (läst 2026-08-22) — denna instans är samma
generella lucka, en andra gång, på samma yta.

## Avvikelsen

**Facit visar (mekaniskt facit, manifestets `not`-fält):** ariaSnapshot-
referenserna under
`tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-listlage-visual-{desktop,mobile}.aria.yml`
slutade tidigare med en knapp `button "Ladda fler"` efter
Ingrid Isaksson-raden (`recVisualPers00009`).

**Skarpt bygge visar (efter PR #1715 / TASK-286.2):** knappraden är borttagen
ur båda filerna och sju listitems tillagda (Johan Jonsson, Karin Kvist, Leila
Khoury, Mikael Malm, Nina Nyström, Oskar Olsson, Petra Palm — `recVisualPers00010`
till `recVisualPers00016`). Enda borttagningen i de två filernas diff
(`gh pr diff 1715`) är raden `- button "Ladda fler"`.

**Orsak, mätt:** `tests/support/fixturvarld/fixture-data.ts` deklarerar
(kommentar ovanför `PERSONS_RESPONSE`, "get-persons-världen") "HELA
personmängden (17 personer)". Disk-räknat 2026-08-22: 15 poster med literal
`id: 'recVisualPers…'` i `PERSONS_RESPONSE.persons` plus `PERSON_RIK`
(`recVisualPers00009`) och `PERSON_TUNN` (`recVisualPers00017`) spreadade in
i samma array — totalt 17, matchar kommentaren. TASK-286.2:s klient-render-
fönster visar 50 rader initialt (ADR-123 beslut 5): 17 < 50, så alla
fixturpersoner ryms i första renderingen och knappen "Ladda fler" visas
därför aldrig i testmiljön. Detta är en FIXTUR-ARTEFAKT, ingen
produktregression: i prod (~559 personer, > 50-radersfönstret) finns knappen
kvar.

**Beslut:** Marcus, väg B (uppdrag till denna agent, 2026-08-22) —
referenserna får stå uppdaterade, stämpeln 2026-08-10 behålls orörd, och
ändringen bokförs öppet i stället för att kräva en ny granskningsrunda.

**Formen i övrigt oförändrad:** tonal kortyta med `divide-y`-avdelare, låst
radhöjd, statuskolumnen ("Aktiv anmälan") med reserverad plats, e-post ensam
på kontaktraden, interaktionsraden avskild med 4 px utan ikon — samtliga
formbeslut manifestets `not`-fält låser är obeörda av PR #1715. Bara
fixturens antal listitems i de två referensfilerna växte. Ingen ny visuell
granskning av Marcus krävdes av det skälet.

## Föreslagen inbakning

Marcus väg framåt (via `!`-kanalen, utanför agentens Edit/Write-yta): lägg
till fältet `amendering` (array) på ytan `personlistan` i `facit.json`, en
post enligt uppdragets ursprungliga specifikation:

```json
{
  "datum": "2026-08-22",
  "beslut": "Marcus, väg B — referenserna uppdateras, stämpeln 2026-08-10 behålls, ändringen bokförs öppet",
  "skiva": "TASK-286.2 + PR #1715",
  "vad": "PR #1715 (TASK-286.2) ändrade två av de mekaniska facit-referenserna: personer-listlage-visual-desktop.aria.yml och -mobile.aria.yml. Enda borttagningen i de två filernas diff är raden - button \"Ladda fler\"; sju listitems (Johan Jonsson … Petra Palm) lades till i stället.",
  "varfor": "Fixtur-artefakt, ingen produktregression: get-persons-fixturvärlden bär exakt 17 personer, under TASK-286.2:s 50-radersfönster (ADR-123 beslut 5) — knappen 'Ladda fler' visas därför aldrig i testmiljön. I prod (~559 personer) finns knappen kvar.",
  "ej_omstamplat": "Formen (tonal kortyta, divide-y, radhöjd, statuskolumn, kontaktrad, interaktionsrad) är oförändrad — bara fixturens antal listitems växte, så ingen ny granskning av Marcus krävdes."
}
```

`godkand`-blocket rörs inte av inbakningen — datum, citat och sha står kvar
exakt som de är.

---

## Tillägg 2026-08-22 — ytan stämplas om, och vad det betyder för DENNA post

**Klassningen står fast: detta är och förblir klass (b).** Marcus väg B-beslut
(§ Avvikelsen ovan) gäller oförändrat — `button "Ladda fler"` föll bort ur
referensen därför att fixturvärlden bär 17 personer mot render-fönstrets 50,
knappen finns kvar i prod, och stämpeln 2026-08-10 behölls med avsikt. Ingen
omstämpling har någonsin krävts för denna post, och den kräver ingen nu.

**Men ytan stämplas om ändå, av andra skäl.** Tre SENARE amenderingar på samma
manifest och samma yta är klass (c) och har begärt Marcus omstämpling:

| sidofil | skiva | vad |
|---|---|---|
| `AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md` | `TASK-286.3` | sentinel-raden sorteras sist |
| `AMENDERING-2026-08-22-bokstavsraden-ovanfor-listan.md` | `TASK-283.2` | bokstavsraden ovanför listan |
| `AMENDERING-2026-08-22-tomma-bokstaver-nedtonade.md` | `TASK-283.3` | tomma bokstäver tonas ned |

Marcus har sett den samlade formen i körande app (`localhost:5173/personer`,
`main` `a7dd94c5`) och godkänt den i klartext:

> *"Ser ju skitbra ut! Bra jobb Claude!"*

Omstämplingen verkställs av honom i hans egen `!`-kanal (`godkand` rörs aldrig
av en agent, `ADR-104` § Beslut 2):

```bash
npm run facit:godkann -- --pass s90-personlistan-konvergens --citat "Ser ju skitbra ut! Bra jobb Claude!" --ersatt
```

**Följden för denna post: § Föreslagen inbakning ovan blir överspelad.** Den
skrevs för en värld där stämpeln 2026-08-10 stod kvar och avvikelsen behövde
bokföras vid sidan av den. När den nya stämpeln landar attesterar den den
form som FAKTISKT finns — inklusive den `Ladda fler`-frånvaro denna post
förklarar — och den föreslagna `amendering`-nyckeln behöver inte längre bakas
in någonstans. Posten står kvar som HISTORIK: den förklarar varför de två
listlage-referenserna såg ut som de gjorde mellan 2026-08-22 och omstämplingen,
och den är prejudikatet för hur en klass (b) skiljs från en klass (c) på
samma yta (`ADR-102` § A2, som citerar just denna instans).

**Referensernas läge efter `TASK-283.4`.** De två filer denna post beskriver
har regenererats tillsammans med de fyra andra
(`--update-snapshots=all`, `TASK-283.4`). `button "Ladda fler"` är fortfarande
frånvarande — fixturens 17 personer ryms alltjämt i 50-radersfönstret, så
förklaringen ovan gäller oförändrat. Deras nya hashar:

| referens | sha256 |
|---|---|
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-listlage-visual-desktop.aria.yml` | `373a81a21615b5c8c98d57a08ebde106299cd49b84374eeaec91b25cf6a16c9f` |
| `tests/visual/__aria__/personer-promoverings-grind.spec.ts/personer-listlage-visual-mobile.aria.yml` | `373a81a21615b5c8c98d57a08ebde106299cd49b84374eeaec91b25cf6a16c9f` |

**Vad som INTE ändrats av `TASK-283.4`:** rad- och listformen. Nodmängden inuti
`list "Personer"` är byte-identisk före och efter regenereringen — mätt med
`diff` på det sorterade listblocket, exit 0 på båda vyporterna. Ingen nod är
tillagd, borttagen eller omdöpt; bara sentinel-radens position skiljer, vilket
är `TASK-286.3`:s ändring och inte denna. De formbeslut manifestets `not`-fält
låser (tonal kortyta med `divide-y`, låst radhöjd, statuskolumnen med
reserverad plats, e-post ensam på kontaktraden, interaktionsraden med 4 px utan
ikon) är samtliga orörda.
