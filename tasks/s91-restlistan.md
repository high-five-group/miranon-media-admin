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

### A1 · Grillningen — AVSLUTAD 2026-07-27 (ADR-080)

Marcus delegerade de fem besluten i klump: *"Du har all kontext samt målbild
från mig för att kunna ta rätt beslut. Kör på det du rekommenderar."* Besluten är
därmed Codes, fattade på delegering — öppet bokfört i ADR-080:s ingress.

- [x] Fråga 1 omprövad — snittet **står**, och den längre horisonten gör det
      **mer** värt: vinsten tas ut per körning under hela perioden
- [x] Portabilitetsgränsen deklarerad — snittet ÄR 90/10-snittet (gränsen går
      vid protokollet, ej läs/skriv)
- [x] Vakten i avbrytande läge, skärpt till Ghosts statuskod-med-instruktionstext
- [x] Klassen heter **acceptance**. Hemvist rättad: ADR-080 + `CONTRIBUTING.md`,
      **ej** `ORDLISTA.md` (produktdomän-avgränsningen utesluter testklasser)
- [x] **ADR-080 mintad** — premisserna är öppen horisont + 90/10-kravet
- [ ] `CONTRIBUTING.md` — acceptance-klassen skrivs in (termens andra hemvist)

### A2 · Mekaniseringen (sessionsdok Del 4, punkt 1–4 klara)

- [x] **Punkt 6 — LÖST 2026-07-27 (ADR-081).** Nummer tilldelas vid landning,
      ej vid skrivning: nummerlösa fragment i `tasks/lessons.d/`, numret sätts
      vid konsolidering — ett ögonblick merge-grinden redan serialiserar.
      Grind + config + self-test-svit (6/6) + tvåsidigt rött-först-bevis.
      **Spärren på Spår C är lyft.** Kort var redan löst (backlog-CLI:t äger
      allokeringen); ADR/tråd omprövas OM en kollision faktiskt inträffar.
- [ ] `lessons-hub-sync`-skillen (hub) uppdateras med konsolideringssteget —
      kräver plugin-bump (öppen post ur ADR-081)
- [ ] Punkt 7 — partitionerings-regeln (ADR-073 utsträckt till Marcus egna
      parallella sessioner, ej bara agenternas)
- [ ] Punkt 5 — landnings-ordningen som regel, ej omdöme (tillämpad, ej kodad)

### A3 · Verktygs-åtgärderna

> **Historiken, förtydligad på Marcus fråga 2026-07-27.** Den ursprungliga
> ordern var *"behåll men INAKTIVERA det byggda, bygg om som proffsen"* — fyra
> egenbyggen där mogna verktyg fanns. **Verktygs-passet rev premissen**, och
> Marcus korrigerade scopet efter belägget. Utfallet är alltså INTE "avaktivera
> fyra", utan:
>
> |# |Egenbygge|Dom|
> |---|---|---|
> |1|Hermetiska mockar + catch-all-vakt|**BYT** → `msw` + `@msw/playwright`|
> |2|`check-docs.sh`|**BEHÅLL** — inget verktyg uttrycker tri-state grön/röd/**skippad**; Wireits enda nyhet (caching) har cache-träff nära noll när indata per definition är det som just ändrats|
> |3|`ci-wait.sh`|**BEHÅLL** — `gh run watch --exit-status` fäller på topp-nivåns conclusion och saknar timeout helt; `gh pr checks --watch` är **fail-open** på både `cancelled` och `skipped`. Ett byte vore en regression mot ADR-071 §2(iii)|
> |4|Två handsynkade allowlists|**BEHÅLL verktyget, LAGA bristen** — `tj-actions/changed-files` är rätt val; bristen är att paritetsinvarianten står i en kommentar i stället för att vara grindad|
>
> Passets egen slutsats, ordagrant: *"Endast punkt 1 är ett äkta försummat
> verktygsval."* Källa:
> [verktygsval-fyra-egenbyggen-2026-07-27.md](../docs/research/verktygsval-fyra-egenbyggen-2026-07-27.md)
> § Beslutstabell + § Behåll ändå.
>
> **Ingen av de fyra åtgärderna är ännu utförd.** Punkterna nedan är dem.

- [ ] **MSW-bytet** (dom: BYT) — `msw` + `@msw/playwright` med
      `defineNetworkFixture`. **`skipAssetRequests: false`** krävs; default
      `true` släpper igenom 86,4 % av mätt restrafik TYST — exakt det vakten
      finns för att se. Räkna med ~3× slowdown (msw issue #13). Samexistens är
      belagd, så migrering går fil för fil. Typsnitts-routen behålls som egen
      route (passets öppna fråga 1: avgörs med **mätning**, ej resonemang).
- [ ] **Listparitets-grinden** (dom: LAGA) — ~20 rader skript + policy-fil.
      **Utvidgad räckvidd 2026-07-27:** samma klass gäller **lychee-globarna**,
      som står i BÅDA `ci.yml` och `scripts/check-docs.sh` och hålls synkade för
      hand — ADR-081:s landning ökade duplikationen med en rad
      (`tasks/lessons.d/*.md`). Grinden ska täcka **båda** listparen.
      Passets öppna fråga 3: `PARITY_PATHS` är inte härledd ännu.
- [ ] **Dokumentera varför** `check-docs.sh` + `ci-wait.sh` behålls (dom:
      BEHÅLL ×2), så nästa läsare — eller nästa agent — inte återupptar samma
      kritik. Detta är den enda åtgärden som följer av de två BEHÅLL-domarna.
- [ ] **Rätta en rad i `ci-wait.sh`:s filhuvud** — passet fann att
      "terminal-kontroll före första sömnen" inte längre är något `gh` saknar.

### A3b · Verktygsvals-prövningen som STÅENDE krav (ny 2026-07-27)

Marcus fråga avtäckte att kravet inte var inskrivet någonstans som återkommande
— bara som en engångs-order mot fyra namngivna egenbyggen.

- [ ] **Skriv in kravet durabelt:** innan ett nytt skript/verktyg byggs ska
      verktygsvals-prövningen göras och **utfallet redovisas** — även när domen
      blir "bygg eget". Hör sannolikt i `CONTRIBUTING.md` eller som hub-regel.
- [ ] **Retroaktiv redovisning för `check-lesson-numbers.sh`** (byggd i dag,
      ADR-081). Prövningen gjordes delvis: towncrier, MADR #28 och Rust RFC 0002
      lästes, och **mönstret** lånades — men ADR:n redovisar inte explicit varför
      towncrier inte togs som *verktyg*. De ärliga skälen (Python-verktyg i ett
      Node-projekt · genererar changelogs vid release, vår `lessons.md` har inga
      releaser · löser inte kollisionen utan undviker nummer helt, vilket ÄR
      mönstret vi lånade) är ett **resonemang, inte en mätning** — och det ska
      stå i ADR-081 hellre än att antas. Amendera ADR:n.

### A4 · Grindarnas form

- [ ] Länkgrinden delas — interna blockerande, externa nattlig rapport.
      `--offline` finns inbyggt; 17 av 19 undantag blir onödiga.
      **Empirin är nu TRE oberoende instanser samma dag (2026-07-27)**, alla med
      samma form — extern yta fäller en PR som inte rör den:
      1. `nx.dev`-paret (Del 8.2) — giltiga länkar, transient, överlevde lychees
         tre default-retries
      2. Issue-länkarna efter ägarbytet — **CI såg dem inte** (autentiserad
         lychee följer överföringen; lokal grind var ärligare)
      3. `cs.umd.edu`-PDF:en i `hallplats-modellen`-passet — **`0 Errors,
         1 Timeout` gav exit 2** och fällde ADR-081:s PR, som inte rör filen
      Instans 3 skärper diagnosen: det är inte bara 404 utan **timeout** som
      blockerar, och en akademisk server vi inte rår över styr då vår
      leveranstakt. Tystas EJ i `.lycheeignore` — Del 8.2 slog fast att
      retry-/scope-härdning är rätt verktyg, och uppdelningen är den härdningen.
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

## Spår C — Lesson-skulden (AVBLOCKERAD 2026-07-27 av ADR-081)

Nästa lediga nummer är **L360**. Tre källor räknar olika; konsolideras seriellt
vid landning — summera dem inte i förväg. **Vägen är nu öppen:** skriv varje
kandidat som nummerlöst fragment i `tasks/lessons.d/`, konsolidera sedan.

- [x] Sessionsdok Del 8.8 — **fem landade** som fragment (2026-07-27)
- [x] Andra pausens carry — **fyra ur Del 6 + två ur Del 7 landade** (2026-07-27)
- [x] Nya 2026-07-27 — **en av tre landad** (`.claude/**`-luckan). **De två
      andra kunde INTE beläggas** — se stopp-posten nedan.
- [x] **FÖRSTA FRAGMENTET LANDAT** (2026-07-27) — *verifiera med CI:s exakta
      kommando, inte en svagare lokal variant* `[UNIVERSAL]`. Skördat i samma PR
      som byggde mekanismen; grinden räknade det korrekt (`1 nummerlösa
      fragment`). Vägen är prövad skarpt, ej bara byggd.
- [x] **Ny kandidat, född vid skörden** — *en lesson-kandidat som bokförs som
      stikkord överlever pausen som ord, inte som innehåll* `[UNIVERSAL]`.
      Empirin är de två obelagda posterna direkt ovanför.
- [ ] Hub-lyftet `L284–L359`
- [ ] **Konsolideringen** — de 15 fragmenten flyttas in i `tasks/lessons.md`
      med nummer från `L360`. Kräver `lessons-hub-sync`-skillens
      konsolideringssteg (öppen post i A2)

**Utfall 2026-07-27: 14 nya fragment skrivna, grind-verifierade** (`check:docs`
9/9, `15 nummerlösa fragment`). Räkningen blev 14, inte elva — handoffen varnade
uttryckligen *"summera dem inte i förväg, tre källor räknar olika"*, och det
höll: Del 10.8:s kvarvarande punkt och en ny kandidat tillkom vid skörden.

### STOPP — två kandidater kunde inte beläggas

Dessa två bokfördes i PAUSLÄGE **enbart som stikkord** och finns ingenstans
annars. Sessionsdokets Del-text, dagens fem commit-meddelanden och
configdiffarna för `.markdownlint-cli2.jsonc` genomsöktes utan träff.

1. *"autofix förvärrar en falsk-positiv"*
2. *"husets `>`-separerade blockquote-stapling"*

De skrivs **inte** på gissning — det vore att uppfinna empiri. **Marcus avgör:**
minns du vad de var, skrivs de; annars förkastas de explicit per ADR-053
(registrera — förkasta aldrig tyst). Kandidaten *lesson-kandidat som stikkord*
ovan är den skördade lärdomen av just detta.

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
| 2026-07-27 | **A1 grillningen avslutad — ADR-080 mintad** | `#272` |
| 2026-07-27 | **A2:6 nummer-tilldelningen löst — ADR-081; Spår C avblockerat** | `#273` |
| 2026-07-27 | Tillstånds-återställningen (resume 4) + **Spår C: 14 fragment** | (denna PR) |
