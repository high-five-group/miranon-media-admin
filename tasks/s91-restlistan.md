# S91-restlistan — avbockningsbar karta över allt öppnat i Session 91

> **Syfte.** Marcus order 2026-07-27: *"Allt det här ska lösas ut! […] Ha koll på
> eller skriv ner den här inventeringen så du strukturerat kan bocka av punkt för
> punkt."* Denna fil är den durabla bäraren — chatten är efemär.
>
> **Formen är ett INDEX, inte en dubblett.** Poster som redan bor i ett register
> pekas ut med sitt ID (`TASK-nn`, `Tnn`, sessionsdok-Del) i stället för att
> kopieras hit. Kopior driftar; pekare gör det inte. Enda innehållet som är
> unikt för denna fil är status, ordning och beroenden.
>
> **Underhåll:** bockas av löpande i takt med landningar, i samma commit som
> arbetet där det är möjligt. Filen dör när alla spår är stängda — den är en
> arbetsyta, inte en permanent artefakt.

## Beslutade premisser — ändra inte utan Marcus

Dessa styr alla prioriteringar nedan och är fattade 2026-07-27:

1. **Fas 6 stängs INTE.** Appens sidor är inte byggda som Marcus vill ha dem.
2. **Alla fem facit-lösa ytor ska genom samma kedja** som eventsidan fick
   (prototyp → Marcus väljer → facit → PRD → skivor): Personer · Hem ·
   Mer/Intresserade/Maillogg · Segment · Mail-handling.
3. **CI-/grind-arkitekturen görs klar FÖRE app-arbetet och hållplatsfrågan.**
4. **Fas E (Supabase) kommer efter att alla sidor är klara.** Två veckor är
   **önskan, inte deadline** — *"får bli som det blir"*.
5. **90/10-kravet:** CI-arkitekturen ska vara 110 % toppdesignad med väl
   underbyggda Airtable-anpassningar, men **~90 % ska överleva Supabase-bytet**
   oförändrat och lika förstklassigt. Vid övergången ska resultatet vara i
   absolut topp senior frontier-klass.
6. **Airtable-basen bevisas av att appen byggs färdig** — det är ADR-063:s egen
   logik (kontext punkt 3). Därför kan AT-Max inte dekomponeras meningsfullt
   förrän sidorna är klara: milstolpens kravspec *är* defekt-registret.

**Konsekvens av premiss 4 + 5 som måste bäras in i grillningen:** S91:s
grillningsbeslut vilade på att migreringen skulle städa upp de icke-hermetiska
testerna inom två veckor (sessionsdok Del 7 § Grillningens läge, rad 1098).
Den premissen gäller inte längre, och 90/10-kravet fanns inte när grillningen
kördes. Snittet ska därför **omprövas**, inte kvitteras.

## Spår A — CI-/grind-arkitekturen (AKTIVT)

### A1 · Grillningen — återupptas med nya premisser

- [ ] Ompröva fråga 1: håller 19-filers-snittet när migreringen inte städar upp
      resten inom överskådlig tid?
- [ ] Avgör vad som är de portabla ~90 % och de Airtable-specifika ~10 %
- [ ] Vakten i avbrytande läge (`abort`), ej rapporterande — *rek. ja*
- [ ] Klassen heter **acceptance**, ej e2e — *rek. ja*, in i `ORDLISTA.md`
- [ ] ADR mintas (ADR-080) — **utan** tvåveckorshorisonten som premiss

### A2 · Mekaniseringen (sessionsdok Del 4, punkt 1–4 klara)

- [ ] **Punkt 6 — lesson-nummer måste RESERVERAS.** Spärrar hela Spår C.
      Två agenter mintade båda `L354`/`L355` samma dag. Gäller även ADR-,
      tråd- och kortnummer. **Högsta prioritet efter A1.**
- [ ] Punkt 7 — partitionerings-regeln (ADR-073 utsträckt till Marcus egna
      parallella sessioner, ej bara agenternas)
- [ ] Punkt 5 — landnings-ordningen som regel, ej omdöme (tillämpad, ej kodad)

### A3 · Verktygs-åtgärderna

- [ ] MSW-bytet — `msw` + `@msw/playwright`. **`skipAssetRequests: false`**
      krävs; default `true` släpper igenom 86,4 % av mätt restrafik TYST.
      Räkna med ~3× slowdown (msw issue #13). Migrering går fil för fil.
- [ ] Listparitets-grinden — behåll `tj-actions/changed-files`, bygg en
      mekanisk paritets-grind mellan de två listorna
- [ ] Dokumentera **varför** `check-docs.sh` + `ci-wait.sh` behålls, så nästa
      läsare inte återupptar samma kritik

### A4 · Grindarnas form

- [ ] Länkgrinden delas — interna blockerande, externa nattlig rapport.
      `--offline` finns inbyggt; 17 av 19 undantag blir onödiga
- [ ] `.claude/**` in i docs-allowlisten (`ci.yml`) — mätt 2026-07-27:
      en URL-ändring i agentkonfig kostade full staging-svit
- [ ] Merge queue-aktiveringen — **lager 1 upphävt** 2026-07-27, lager 2 står.
      Aktivera ej före mätning av `concurrency` × `merge_group`

### A5 · Efter grillningen

- [ ] De 19 acceptance-filerna, byggda med MSW
- [ ] `TASK-36.8` — QA-vandringen (manuell testplan, riskanpassad CI)

### A6 · Schemalagt till AT-Max (ADR-063 S81-not) — rör ej nu

- [ ] `T85` våg 3 — staging-per-run-isolering. **Taket för allt annat.**
- [ ] `T87` — visual-grindens aktivering

## Spår B — Instruktionsleveransen (`T100`)

- [x] Åtgärd 1 — `InstructionsLoaded`-hooken (plugin 1.21.0)
- [x] Åtgärd 2 — avvecklingen + ADR-079 (plugin 1.22.0)
- [x] Steg 3 — mekanisk verifiering. Mätt 2026-07-27: grönt på alla tre
      kontroller (logg · output style aktiv utan val · rapportform)
- [ ] Steg 4 — `IDENTITET.md`-destillatet. **Marcus-beslut.** Vad kärnan är kan
      bara han avgöra
- [ ] Hooken täcker CLAUDE.md-lagret men **inte** memory-lagret — `MEMORY.md`
      levererades utan att logga en rad (nytt fynd 2026-07-27)

## Spår C — Lesson-skulden (SPÄRRAD av A2 punkt 6)

Nästa lediga nummer är **L360**. Tre källor räknar olika; konsolideras när
spärren är löst — summera dem inte i förväg.

- [ ] Sessionsdok Del 8.8 — fem kandidater
- [ ] Andra pausens carry — fyra ur Del 6 plus två ur Del 7
- [ ] Nya 2026-07-27 — tre: autofix förvärrar en falsk-positiv · husets
      `>`-separerade blockquote-stapling · `.claude/**`-luckan
- [ ] Hub-lyftet `L284–L359`

## Spår D — App-arbetet (efter Spår A)

- [ ] **Fem facit-lösa ytor genom full kedja** (premiss 2). Referens:
      eventsidan tog 20 skivor + sex review-iterationer
- [ ] Hållplats-modellen — åtta öppna frågor, ska grillas. Rek. alternativ C
      (hållplats som etikett)
- [ ] `TASK-18.20` — enda öppna skivan i event-familjen, blockerad av
      hållplats-frågan
- [ ] Eventinfo saknar motor — krysset skriver två fält ingen kod läser.
      **Kort ej skapat**
- [ ] 31 övriga To Do-kort. HIGH: `TASK-24` · `TASK-25` · `TASK-27` · `TASK-28`

## Spår E — Hygien och skuld

- [ ] Byggplanen uppdateras med Fas E-horisonten enligt premiss 4 —
      **styrande dokument, ska göras före planering mot ny horisont**
- [ ] 109 mergade fjärrgrenar på origin
- [ ] `save-segment`-läckan — `app-segment-test+<uuid>` saknar target i
      `.purge-staging-policy.json`, städas aldrig
- [ ] `ZZ-GRANSKNING-S91` lever i staging (ej självstädande):
      `npm run seed:review:clean -- --ort ZZ-GRANSKNING-S91`
- [ ] `person-detail` kontra `TASK-52` — orsakskedjan ej verifierad

## Beslut som väntar på Marcus

- [ ] `--mm-btn-*` eller `--mm-button-*`? Nio oanvända tokens i `semantic.css`
      mot 48 `--mm-button-*` i `components.css`
- [ ] `IDENTITET.md`-destillatet (= Spår B steg 4)
- [ ] Länkgrindens form (= A4)
- [ ] Merge queue-aktiveringen (= A4)

**Klartecken räcker — inga beslut:** komponent-token-grinden (R1:s dom C) ·
agentdefinitioner i `.claude/agents/` (plugin-agenter stödjer ej `hooks`) ·
kontext-statuslinjen · de 18 återstående snitten.

## Avbockningslogg

| Datum | Post | Landning |
|---|---|---|
| 2026-07-27 | Tillstånds-återställningen (resume 3) | `0cfbc9f` |
| 2026-07-27 | Merge queue-falsifieringen bokförd | `07d766d` |
| 2026-07-27 | Ägarbytets städning (länkar · origin · marketplace) | `49c615a` |
| 2026-07-27 | Spår B åtgärd 1 + 2 + steg 3 | `#262` · `#263` · mätning |
