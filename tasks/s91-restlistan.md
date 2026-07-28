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

## VAR VI ÄR — den reviderade ordningen (2026-07-27)

Ordningen fastställdes efter att merge queue-, push-kadens- och
branschpraxis-passen lästs mot Marcus premisser. Den ersätter tidigare
prioritering inom Spår A.

| # | Steg | Läge |
|---|---|---|
| 1 | **A3 · MSW-bytet** — kritiska vägen, ej sidopost | ✅ **KLART 2026-07-27** — `TASK-54.1` · `54.2` · `54.3` alla **Done** |
| 1b | **`TASK-55` · Baselines regenererade** | ✅ **KLART 2026-07-27** — 6 bilder granskade + mergade; bevis-dispatch `30297097792` loggar *"Inga baseline-ändringar"* |
| 2 | **`TASK-58` + `TASK-57` · Fixturens bruksvärde** | ✅ **KLART 2026-07-27** — båda **Done**, båda gröna per jobb 8/8 (`#292` · `#293`). Klassades `ready-for-agent` samma dag |
| 3 | **A5 · De 18 acceptance-filerna** — här faller taket | ✅ **MIGRERINGEN KLAR 2026-07-28** (`59.7` mätning + `59.8` QA kvar) — `TASK-59` (PRD) + sju skivor + QA publicerade. **`59.1`–`59.6` Done — SAMTLIGA 18 filer ute.** Checksumman gick ihop exakt: e2e **14** / acceptance **18**, de fjorton mot namnlista. Staging-sviten **9,10 → 6,50 min** vid landning (formell mätning är `59.7`:s). **NY RISK: acceptance-jobbet 6,7 min mot tak 8** — sviten växte 51→152 tester och självtestet kör dem en gång till. Acceptance-klassen LEVER som eget mutexfritt CI-jobb; kontraktsvakten i drift. **`TASK-60` inskjutet och Done** (`T104`): hermetikens andra led körbart — och det bar sin första skarpa användning i `59.5` (90/90/90, ingen fil behövde skrivas om). **`TASK-61` DONE 2026-07-28** (PR `#323`) — kontraktsvaktens race stängt med permanent anteckning-fixtur på arbetskö-eventet; purge-immuniteten prövad mot policyns egna funktioner, ej antagen. Ärende `#312` stängt med åtgärd. Acceptance-jobbet mätt **6m47s** i den landningen — tak-risken bekräftad live. **⚠️ TAK-MARGINALEN HAR KRYMPT MÄTBART:** acceptance-jobbet `6m47s` (`#323`) → `7m32s` (`#324`) mot tak **8 min** — samma testmängd, ~45 s varians mellan två körningar. Marginalen 28 s ligger INOM variansen; falsk röd är inte längre teoretisk. **NÄST: `59.7` mätningen (tar `T105` + tak-marginalen, nu högst prioriterad)** |
| 4 | **Kadens-regeln (A2:5)** — sju färdiga rader, billig | ⬜ kan landa när som helst |
| 5 | **A2:7 · Partitionerings-regeln** — grillas, EFTER steg 3 | ⬜ medvetet sist |

**Varför A3 var kritiska vägen och inte hygien:** staging-sviten tar 9,25 min
under global mutex, och **74 % (410 s)** bärs av tester som redan mockar sina
EF:er. Bryts de ut faller sviten till **~2,4 min** — utan att täckning skärs.
MSW är verktyget som gör de 19 filerna byggbara, alltså förkravet för hela
vinsten. Per-körning-isolering är permanent stängd av Airtable (P26/P27), så
detta är den enda öppna vägen att lyfta taket före Fas E.

**Varför steg 2 sköts in före A5 (Marcus-beslut 2026-07-27):** båda fynden kom
ur `TASK-54.3`:s QA och träffar precis den yta de 19 filerna ska byggas på.
`TASK-58` är mönstret filerna ska luta sig mot — odokumenterat, alltså
nitton chanser att göra fel på samma sätt. `TASK-57` är vaktens felmeddelande,
som skalar dåligt just när handlers blir många, vilket är exakt vad A5 gör.
Båda är billigare att laga före filerna än efter. Korten är **oetiketterade**
och ska klassas innan de plockas.

**Ärlighet om A5:s natur (Marcus fråga 2026-07-27, besvarad ur ADR-080 §
Ärlighet om underlaget):** hermetisk utbrytning är **inte** branschens
förstahandsval — Supabase, PostHog och cal.com mockar aldrig sina egna
tjänster. Vår grund är att branschens väg ut, efemär skarp backend, är delvis
stängd eftersom Airtable inte är självhostbar. A5 är alltså en dokumenterad
**Airtable-kompromiss**, korrekt utförd enligt branschledarnas andrahandsval
(Ghost, crates.io, Camunda, Coveo). Nuvarande topologi är samtidigt sämre än
standard — Googles lägst rankade, Thoughtworks HOLD. Omprövning är inritad
vid **Fas E**, när datakällan blir klonbar. Marcus kvitterade 2026-07-27.

**Varför A2:7 medvetet ligger sist:** den är delvis en arbetsomgång runt ett
problem steg 2 krymper. Två av dess fem axlar är redan lösta (lesson-nummer via
ADR-081, kort-ID via backlog-CLI:t) och en tredje avlastas av merge queue.
Designas regeln före steg 2 kodas den mot ett problem som håller på att ändra
storlek.

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
- [x] **ADR-080 RÄTTAD 2026-07-27** — § Konsekvenser bar samma
      `skipAssetRequests`-felläsning som restlistans A3-post ("måste sättas
      `false`"). Upptäckt vid `TASK-54.1`:s review-pass, alltså EFTER att
      restlistan rättats — felet hade två hemvister och bara en var känd.
      Riven med öppen rättelse-not; ursprungstexten bevarad. Villkoret som gör
      defaultvärdet säkert står nu både i ADR:n och i koden
- [x] **`CONTRIBUTING.md` — acceptance-klassen inskriven. KLART 2026-07-28** i
      `TASK-59.3` (commit `109f846`), inte som egen post. Filen bär nu
      `## Acceptance-klassen` med ADR-080-referens, hemvist, söm och
      körkommando — sju förekomster totalt. **Posten stod kvar som öppen i tre
      dygn efter att den stängts**, eftersom skivan som stängde den inte var den
      som ägde raden. Fångat vid dok-genomgången 2026-07-28; värt att veta att
      restlistans poster kan stängas av arbete på annat håll

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
      parallella sessioner, ej bara agenternas).
      **KONVERGERAR DELVIS med worktree-isoleringen (`#327`, 2026-07-28) — men
      bockas INTE av mot den.** Fil- och gren-partitionen är nu mekanisk
      (`isolation: worktree` i `.claude/agents/`-frontmatter). Kvar står
      nummerserier, delade statusfiler och LÄSANDE agenter (fragmentet
      `partition-maste-omfatta-lasande-agenter`).
      **Och regeln VÄXER i en dimension:** två isolerade agenter som båda
      skriver i `todo.md` ser inte varandra alls — merge-konflikt, eller värre,
      tyst överskrivning vid sekventiell landning. Före isolering delade de
      åtminstone arbetsträd. Isoleringen löser alltså en del av A2:7 och
      förvärrar en annan; det gör regeln mer angelägen, inte mindre
- [ ] Punkt 5 — landnings-ordningen som regel, ej omdöme (tillämpad, ej kodad).
      **KONVERGERAR INTE med worktree-isoleringen** — `BEHIND` är en annan
      felmekanism och `#327` rör den inte alls. Regeln blir tvärtom VIKTIGARE:
      fler isolerade agenter ⇒ fler parallella PR:er ⇒ mer BEHIND-tryck.
      Empiri 2026-07-28: orkestreraren gick i fällan TVÅ gånger under samma
      resume, trots att `L328` varit nedskriven sedan S81.
      Formen som fungerade när den tillämpades: låt den tyngre PR:en landa
      först, eller kör `gh pr update-branch` på nästa FÖRE armering i stället
      för att laga `BEHIND` efteråt. Bikostnad: en CI-vakt startad mot en SHA
      blir felaktig i samma stund grenen uppdateras — stoppa och starta om
      mot den nya SHA:n

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
> **Status 2026-07-27:** punkt 1 är PÅBÖRJAD (`TASK-54.1` Done), punkt 2–4
> ännu ej utförda.

- [x] **MSW-bytet — KLART 2026-07-27** (dom: BYT) — `msw` + `@msw/playwright` med
      `defineNetworkFixture`. Speccat som **`TASK-54`** + skivor 2026-07-27.
      **`TASK-54.1` DONE** (`56e9064`, CI 8/8, ekvivalens pixel-bevisad A/B) ·
      **`54.2` DONE** (`a1c78f9`) — vakten sitter i `onUnhandledRequest`,
      sid-vakten OCH EF-catch-allen borttagna, tvåsidigt rött-först ·
      **`54.3` DONE** — QA:ns sex steg körda av Code på Marcus delegering
      2026-07-27; två fynd registrerade (`TASK-57`, `TASK-58`). **Hela A3:s
      MSW-punkt är därmed stängd.**

      > **RÄTTELSE 2026-07-27.** Denna post sa tidigare att
      > **`skipAssetRequests: false` krävs**. Det är fel — posten bar passets
      > *varning* som om den vore dess *slutsats*, och stod dessutom i
      > motsägelse mot sin egen andra mening. Passets faktiska rekommendation
      > (`verktygsval-fyra-egenbyggen-2026-07-27.md` rad 170–174): behåll
      > typsnitts-routen som **egen page-route** och låt MSW köra med **default
      > `skipAssetRequests: true`** för API-lagret — *"då undviks båda
      > fällorna"*. Page-routes vinner över context-routes, så en egen font-route
      > lämnar ingen font-trafik kvar för optionen att släppa igenom. `false`
      > hade kostat **~3× slowdown** (msw issue #13) utan vinst.
      >
      > Felet var mitt: posten skrevs samma dag som en sammanfattning av passet
      > och drifade från källan. Fångad vid A3:s LÄS-fas, före kodskrivning.
      > Klassen är skördad som fragment — *ett uppdrag kan peka på fel adress*.

      Gäller: `skipAssetRequests` **true** · MSW bär endast API-lagret
      (`**/functions/v1/**`) · font-routerna kvar som page-routes (de gör redan
      rätt — `fulfill` ur incheckade filer, inte bara block) · vakten som
      `onUnhandledRequest`-callback i Ghosts form · handlers mot
      **EF-protokollet** per ADR-080:s snitt, vilket gör passets öppna fråga 2
      (dubbelportering vid Postgres-skiftet) obsolet i stället för uppskjuten.
      Omfattning mätt mot disk 2026-07-27: **141 route-anrop i 33 filer**
      (passet uppgav 136/31 — sviten har växt). `msw` 2.15.0 +
      `@msw/playwright` 0.6.7 **installerade** i 54.1.

      > **KRAVET ÄR INFRIAT 2026-07-27 i `54.2` — och omprövningen vände
      > beslutet.** `skipAssetRequests` står nu på **`false`**, inte default.
      > Källkodsläsning (`@msw/playwright` `fixture.ts` rad 98–103) visade att
      > optionen kortsluter tillgångs-formade anrop med `route.fallback()`
      > FÖRE `handleRequest`, alltså före callbacken; en probe med `.txt`-URL
      > nådde aldrig vakten och gick ut på nätet. Med sid-vakten borttagen var
      > defaultvärdet därmed exakt det tysta genomsläpp vakten finns för att
      > stoppa.
      >
      > **3x-kostnaden materialiserades inte:** sviten gick 17,3 s med
      > defaultvärdet och 14,9 s utan det. Issue #13:s varning gäller
      > Vite-projekt med fler moduler än fixturvärlden laddar — den ärvdes som
      > premiss i PRD-beslut 1 och rivs här med mätning.
      >
      > **WebSocket-vägen är fortsatt oskyddad** — bindningen registrerar
      > `context.routeWebSocket` med match-all och `connectToServer()`:ar när
      > inga WS-handlers finns (`fixture.ts` rad 156–166). Sid-vakten skyddade
      > den aldrig heller (`page.route` fångar inte WS), så det är ingen
      > regression — men det är den enda kvarvarande vägen ut ur
      > fixturvärlden. Ofarlig så länge appen saknar realtime; **blir skarp den
      > dagen den får det.** Ej åtgärdad i 54.2: den kräver en WS-handler eller
      > ett explicit avvisande, och ingendera bar kortets scope.
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

- [x] **Länkgrinden delad — VERKSTÄLLT 2026-07-28 ([ADR-082](../docs/decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md), PR `#324`).**
      Besluten Codes, på Marcus explicita delegering (*"du är den som sitter på
      kompetensen … tar branschledande seniora beslut åt mig"*). `ci.yml` kör
      `--offline` · nattnätet behåller full yta + `--accept-timeouts` ·
      cache-maskineriet rivet ur presubmit · `nightly-links` UT ur `alarm.needs`
      med **egen stående ärende-kanal** (etikett `lankrota`, byggd på repots
      `gh issue`-mönster — att bara ta ut jobbet vore fail-open, L321/L322) ·
      `.lycheeignore` roll-bytt till brusfilter, **add-only-policyn upphävd åt
      båda håll** (ADR-029 amenderad) · två faktafel rättade.
      **Tvåsidigt bevisat:** trasig INTERN länk → exit 2 (fäller) · död EXTERN
      länk → exit 0 (släpps) · presubmit `1979 Total, 0 Errors, 36 ms`.
      Underlaget och den korrigerade motiveringen står kvar nedan.
      **RESEARCH KLAR 2026-07-28:**
      [`docs/research/lankgrindens-form-2026-07-28.md`](../docs/research/lankgrindens-form-2026-07-28.md).
      **Domen: formen är branschens mönster med marginal** — av nio projekt som
      faktiskt öppnades låter **noll** externa länkar blockera en PR, och lychees
      egen dokumentation rekommenderar exakt `schedule` + `fail: false` +
      create-issue. `nuxt/nuxt` kör **samma pinnade SHA som vi** men exkluderar
      `^https?://` i PR.
      **MEN MOTIVERINGEN NEDAN VAR FEL OCH ÄR KORRIGERAD.** Påståendet *"17 av 19
      undantag blir onödiga"* håller inte: `.lycheeignore` bär **22 mönster, 21
      externa, 1 internt** (räknat mekaniskt mot disk, oberoende verifierat).
      Under `--offline` blir alla 21 verkningslösa **i PR-grinden**, men **noll**
      blir onödiga i repot om nattrapporten ska vara läsbar — `github/docs`
      underhåller 155 rader och `nuxt` 31 poster FÖR SINA ICKE-BLOCKERANDE
      körningar. **Uppdelningen tar bort PR-blockeringen, inte listan.**
      **Tre fynd utöver frågan:** `--accept-timeouts` (lychee PR #2063) hade
      lagat `cs.umd.edu`-instansen utan någon uppdelning alls · **två av våra
      egna undantag vilar på ett faktafel** — felcachningen togs bort i lychee
      v0.24.0 och vi kör v0.24.2 (verifierat mot den SHA-pinnade `action.yml`),
      så sched.com-postens motivering är ogiltig och `--cache-exclude-status
      '429'` är en no-op · 403 återförsöks **aldrig** (bara 5xx/408/429), vilket
      förklarar varför merparten av listan är just den klassen.
      **ADR-baren nås smalt** — inte för formen (den är ADR-077:s
      presubmit/postsubmit-beslut) utan för att **ADR-029 § Medvetna
      utelämningar punkt 2 (add-only-policyn) rivs öppet**. Marcus väljer mellan
      kort ADR och `§`-not i ADR-077 med explicit *"ersatt av"*-rad.
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
      en URL-ändring i agentkonfig kostade full staging-svit.
      Verifierat fortfarande öppen 2026-07-27: `.claude` förekommer inte i
      `ci.yml`
- [ ] Merge queue-aktiveringen — **lager 1 upphävt** 2026-07-27, lager 2 står.
      Aktivera ej före mätning av `concurrency` × `merge_group`

### A5 · Efter grillningen

- [x] **`TASK-58` + `TASK-57` — BÅDA DONE 2026-07-27** (Marcus-beslut samma dag).
      Klassades `ready-for-agent` av Code på delegering; klassningen avtäckte att
      **alla 66 befintliga `ready-for-agent`-kort har AC — noll undantag** — och
      att fynd-korten hade noll. 13 AC skrevs mot läst kod. `#292` · `#293`,
      båda gröna per jobb 8/8
- [~] **De acceptance-filerna, byggda med MSW — SPECCAT 2026-07-27, PÅGÅR.**
      `TASK-59` (PRD) + sju skivor + QA-kort. **`59.1` (prefaktorering) · `59.2`
      (kontraktsvakten) · `59.3` (klassen + Hem-piloten) · `59.4` (Personer-ytan)
      · `59.5` (Mer-ytan, sex filer) alla Done — 11 av 18 filer flyttade.**
      Kvar: `59.6` Event (7, PÅGÅR) · `59.7` mätningen (tar `T105`) · `59.8` QA.
      **`59.5` bar självtestets första skarpa användning:** 90 tester / 90 fällda
      / 90 med vakten som orsak — alla 39 nya tester hängde på fixturen direkt.
      Pre-flight-kontrollen gav ett äkta fynd: en levande pekare i ett
      research-dokument mot den form skivan ersatte, lagad med historiken bevarad.
      **Antalet är 18, inte 19:** klassningen
      räknades om ur hermetik-mätningens rådata (863 poster, 32 filer) i stället
      för att ärvas. Den mekaniska räkningen reproducerar ADR-080 exakt (19 rena
      / 13 skarpa), men `pwa-offline` är mekaniskt ren och doktrinärt undantagen
      — riktigt undantag, eftersom testet kräver byggd preview och är EF-rent
      bara för att det kör oautentiserat. ADR-080 noterad med korrigeringen.
      **Skarven är belagd mot primärkälla:** EN delad hermetisk fixturvärld, per
      MSW:s egen designavsikt (*"a single source of truth for your network
      across the entire stack"*) och Playwrights fixtur-återanvändning
      (`mergeTests`, verifierad exporterad i 1.61.1). Två fixturvärldar vore emot
      båda bibliotekens uttalade avsikt OCH mot ADR-080:s eget divergens-villkor
- [x] **`TASK-60` — hermetik-självtestet, KLART 2026-07-28** (`T104` åtgärdad).
      Förkrav som sköts in före `59.5` på Marcus beslut: de tretton filer som
      återstår i `59.5`+`59.6` får ett permanent tvåsidigt bevis i stället för
      tretton manuella patcha-kör-återställ-cykler. Kör i CI, och grinden bevisar
      själv att den kan fälla
- [ ] `TASK-36.8` — QA-vandringen (manuell testplan, riskanpassad CI)

### A6 · Schemalagt till AT-Max (ADR-063 S81-not) — rör ej nu

- [ ] `T85` våg 3 — staging-per-run-isolering. **Taket för allt annat.**
- [ ] `T87` — visual-grindens aktivering. **Blockeraren är BORTA 2026-07-27**
      (`TASK-55` Done: baselines regenererade, granskade, mergade; bevis-dispatch
      `30297097792` loggar *"Inga baseline-ändringar"*). **Triggern står dock
      kvar** — Marcus-beslut A från S81 flyttas inte av att ett hinder
      försvinner; grinden aktiveras när UI-takten lugnar sig. Tråden uppdaterad
      med den distinktionen

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
- [ ] **Konsolideringen** — de **19** fragmenten flyttas in i `tasks/lessons.md`
      med nummer från `L360` (disk-verifierat 2026-07-27: sista numrerade post
      är `L359`). Kräver `lessons-hub-sync`-skillens konsolideringssteg (öppen
      post i A2). **Räkningen steg 17 → 19** under sjätte pausens resume: två
      fragment tillkom (`*/` i citerat glob-mönster stänger blockkommentaren ·
      en repo-inställning kan vara låst tre nivåer upp), båda `[UNIVERSAL]`

**Utfall 2026-07-27: 16 nya fragment skrivna, grind-verifierade** (`check:docs`
9/9, grinden räknar **17 nummerlösa fragment** = 16 nya plus det som landade
i PR 273). Räkningen blev 16, inte elva — handoffen varnade uttryckligen
*"summera dem inte i förväg, tre källor räknar olika"*, och det höll: Del 10.8:s
kvarvarande punkt, en kandidat född vid skörden, och en som återuppstod samma
dag tillkom alla utöver de elva.

### STOPP — två kandidater kunde inte beläggas

Dessa två bokfördes i PAUSLÄGE **enbart som stikkord** och finns ingenstans
annars. Sessionsdokets Del-text, dagens fem commit-meddelanden och
configdiffarna för `.markdownlint-cli2.jsonc` genomsöktes utan träff.

1. *"autofix förvärrar en falsk-positiv"*
2. *"husets `>`-separerade blockquote-stapling"*

De skrivs **inte** på gissning — det vore att uppfinna empiri. Kandidaten
*lesson-kandidat som stikkord* ovan är den skördade lärdomen av just detta.

**AVGJORT 2026-07-27.** Marcus: *"Jag minns inget om de obelagda kandidaterna,
gör inte du det heller så får du väl låta dem hänga."* Ingen av oss minns, och
sökningen var uttömmande. De **hänger som registrerad post** — inte förkastade,
inte skrivna. Posten står kvar här som sitt eget kvitto: det som gick förlorat
är synligt, vilket är hela poängen med ADR-053:s *registrera, förkasta aldrig
tyst.* Dyker empirin upp i en framtida läsning kan de skrivas då.

**KANDIDAT 2 ÅTERUPPSTOD SAMMA DAG — och är nu skriven.** Två timmar efter
beskedet ovan fälldes `check:docs` på **MD028** i ADR-063: två blockquote-block
separerade med en tom rad i stället för husets `>`-rad. Det var exakt vad
stikkordet syftade på. Empirin kom alltså genom att **samma fel begicks igen**,
nu med logg och regel-ID. Fragment:
`blockquote-stapling-separeras-med-kolon-inte-tom-rad.md`. Kvar hängande: endast
*"autofix förvärrar en falsk-positiv"*.

Det gör bokföringen till sin egen empiri: en kandidat utan nedskriven empiri
kostar att den måste återupptäckas genom att felet upprepas.

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
- [ ] **Färgsystemets migrering ligger parkerad i S92** (egen session, eget dok,
      `lifecycle: paused`). Grunden är landad och **additiv** — 72 nya
      primitiver i `--p-*`-namnrymden utan konsumenter, appen renderar
      oförändrad så när som på ett tokenvärde. **Migreringen (att låta
      `--mm-*`-rollerna peka på skalorna) ÄNDRAR appens utseende** och har egna
      steg A–E, varav steg C kräver Marcus-beslut. Noteras här enbart så att
      Spår D:s app-arbete inte planeras som om färgsystemet vore orört —
      arbetet ägs av S92, inte av denna lista

## Spår E — Hygien och skuld

- [x] **Actions-flaggan efter ägarbytet — LÖST 2026-07-27.** Ägarbytets
      städning (sessionsdok Del 9.8) missade en post:
      `can_approve_pull_request_reviews` stod `false` och blockerade
      baseline-workflowen (`gh pr create` avvisad, run `30292488425`).
      Låset satt på **enterprise**, inte repo — org-nivån gav
      `409 Conflict: "The enterprise does not allow GitHub Actions to approve
      pull requests"`. Satt uppifrån och ned (enterprise → org → repo ärver),
      `default_workflow_permissions` kvar på `read` överallt. Workflowens
      filhuvud kallade förutsättningen en *repo-inställning* — den
      faktarättelsen är gjord i samma landning, så nästa läsare slipper
      utredningen. Lesson-fragment skrivet
- [x] **Byggplanen uppdaterad med Fas E-horisonten — KLART 2026-07-27** (v1.14).
      Ankaret flyttat från *"aktualiseras post-Fas 7"* till **appens sidor
      klara** (premiss 4), med *"får bli som det blir"* inskrivet så att
      två-veckors-önskan inte kan läsas som åtagande. Premiss 1 + 2 lagda som
      **överordnat förkrav** i Fas 6:s closeout-block — de fem ytorna genom hela
      kedjan, ett krav OVANPÅ bygg-status och arch-audit. Premiss 5 (90/10)
      inskrivet i Fas E med snittet vid protokollet (ADR-080) och omprövningen
      av hermetik-topologin inritad i fasen. **Fas 7-beroendet lämnat
      OFÖRÄNDRAT** och förhållandet till det nya ankaret öppet noterat som ej
      avgjort — premiss 4 flyttade horisonten, inte Fas 7:s roll, och att
      härleda ett svar ur den vore att besluta mer än premissen bär.
      **Grinden för planering mot ny horisont är därmed lyft**
- [ ] 109 mergade fjärrgrenar på origin. **Även ~60 lokala grenar** ligger kvar
      (mätt 2026-07-27) — samma klass, egen städning
- [ ] `save-segment`-läckan — `app-segment-test+<uuid>` saknar target i
      `.purge-staging-policy.json`, städas aldrig
- [ ] `ZZ-GRANSKNING-S91` lever i staging (ej självstädande):
      `npm run seed:review:clean -- --ort ZZ-GRANSKNING-S91`.
      Verifierat 2026-07-27: `.purge-staging-policy.json` nämner den inte
- [ ] `person-detail` kontra `TASK-52` — orsakskedjan ej verifierad
- [ ] **`T105` — hermetik-rapporten skrivs ut ur en gammal mätning som om den
      vore färsk.** Upptäckt 2026-07-28 under `TASK-60`: en HERMETISK körning
      skrev ut anrop mot skarpa staging-värden, vilket är strukturellt omöjligt.
      Asymmetrin är verifierad i koden — `global-setup.ts` rad 23 nollställer
      rapporten ENDAST i mätläge, `global-teardown.ts` skriver ut den UTAN att
      pröva flaggan. Inbjuder till fel slutsats åt båda håll: att hermetiken
      läcker, eller att en färsk mätning finns. **Fixen ser ut som en rad men
      hör till `TASK-59.7`**, som äger mätinstrumentet — deferat medvetet ur
      `TASK-60` per DoD 4 (inga orelaterade filer i diffen)

## Kort födda i S91 — utanför spåren ovan

Registrerade som backlog-kort, inte som restliste-poster. Här bara som index.

- [ ] **`TASK-53`** — 429-backoffen väntar 1 s där Airtable kräver 30 s, tre
      ställen i `airtable-client.ts`. MEDIUM. Enda posten i dag som är en defekt
      i **produktionskod**, inte i dokumentation eller CI. Korsrefererad från
      `airtable-constraints.md` P4
- [x] **`TASK-55` — DONE 2026-07-27.** Baselines regenererade ur CI, **granskade
      och godkända av Marcus** (PR #287, grön per jobb 8/8), bevis-dispatch
      `30297097792` loggar *"Inga baseline-ändringar"*. Utfallet blev **tre vyer
      × två vyportar = sex bilder**, inte de fyra kortet trodde: `personer`
      (S90:s prototyp-pass), `eventsida` (task-48 rev per-kort-knapparna, därav
      att filen KRYMPTE) och `event-lista` (filterknappen ur `f11cc37`,
      task-17.7). Den sista feldiagnostiserades först som hover-ändringen
      `0f8860a` — hover fotograferas inte, och felet syntes först när bilderna
      faktiskt öppnades och jämfördes

**Nya kort ur sjätte resumens QA + arbete — alla KLASSADE `ready-for-agent`
2026-07-27** (Code på Marcus delegering; se § Beslut som väntar):

- [ ] **`TASK-56`** — WebSocket-vägen går förbi hermetik-vakten; bindningen
      `connectToServer()`:ar när inga WS-handlers finns. Ingen regression
      (sid-vakten fångade aldrig WS heller), men den enda kvarvarande vägen ut
      ur fixturvärlden. Latent tills appen får realtime
- [ ] **`TASK-57`** — vaktens felmeddelande skalar dåligt: stavfel lyfts inte
      fram ur listan, och en extern domän får EF-råd. **Steg 2 i VAR VI ÄR**
- [ ] **`TASK-58`** — överskuggningsmönstret `network.use()` är odokumenterat.
      Mönstret A5:s nitton filer ska luta sig mot. **Steg 2 i VAR VI ÄR**

- [ ] **`TASK-61`** — kontraktsvakten för `get-event-notes` mäter mot data som
      purge raderar. Nattkörning `30328246805` föll på `[TOMT-UNDERLAG]`.
      **Race bevisat med sekundprecision:** vakten har inget `needs:` och kör
      parallellt med purge — grön dispatch läste 2 s FÖRE purge, röd natt läste
      8 s EFTER. **Rotorsaken är dock designluckan:** `get-event-notes` mäter mot
      sentinel-data som purge är designad att radera, medan `get-events` och
      `get-registrations` har permanenta fixturer (`ZZ-belaggning-fixtur`,
      *"STÄDA INTE"*). Ett `needs:` flyttar bara racet. Vaktens FÖRSTA
      schemalagda nattkörning — dispatchen som bokfördes som *"larmkedjan
      bevisad"* hade grön vakt på timing-tur. Ärende `#312` öppet med skriven
      diagnos; tas efter `59.5` (rör `fixture-data.ts`)

## Beslut som väntar på Marcus

- [ ] `--mm-btn-*` eller `--mm-button-*`? Nio oanvända tokens i `semantic.css`
      mot 48 `--mm-button-*` i `components.css`. **UNDERLAG FINNS NU:** den
      parallella sessionen S92 mätte frågan under sitt färgsystem-arbete
      (sessionsdok S92, sök `--mm-btn-`) — hämta deras räkning innan frågan
      besvaras, gör inte om mätningen
- [x] **Klassning av `TASK-56`, `TASK-57`, `TASK-58` — KLAR 2026-07-27**, av Code
      på Marcus delegering (*"Klassa dem du är du snäll"*). Alla tre
      **`ready-for-agent`**: samtliga är avgränsade ändringar i
      testinfrastrukturen med mekaniskt verifierbart utfall, medan repots
      `ready-for-human` uteslutande bär QA-planer och PRD:er som kräver
      mänskligt omdöme (6 kort, samtliga av den formen). **Klassningen avtäckte
      en invariant etiketten bär men ingen skrivit ner:** alla 66 befintliga
      `ready-for-agent`-kort har acceptanskriterier — **noll undantag** — och de
      tre fynd-korten hade noll. Etiketten utan AC hade gjort DoD 1 (*"alla
      acceptanskriterier avbockade"*) innehållslös. AC skrevs därför mot **läst
      kod**, inte mot korttexten: 13 kriterier totalt (`56`: 4 · `57`: 5 ·
      `58`: 4). `TASK-56`:s källkodspåstående verifierades om i samma pass —
      `@msw/playwright/src/fixture.ts` rad 156–166 bär `route.connectToServer()`
      vid noll WS-handlers, ordagrant som kortet uppgav
- [x] **`T104` FÖRE `59.5` — BESLUTAT OCH VERKSTÄLLT 2026-07-28.** Marcus tog
      Codes rekommendation (*"Kör som du föreslår"*). Levererat som **`TASK-60`**:
      `HERMETIK_SJALVTEST=1` bär **båda** leden — normalläget tömt OCH testens
      egna `network.use()` verkningslösa; vartdera ensamt lämnar en klass av
      tester obevisade, vilket `persons-list` (överskuggar allt den behöver)
      visar konkret. `scripts/hermetik-sjalvtest.mjs` kräver att alla tester
      fälls **med `OmockadRequestError` som orsak** — utfallet ensamt räcker
      inte, eftersom en trasig assertion också gör en svit röd. **Mätt:
      51/51 fällda, 51/51 av vakten, noll timeouts.** Negativ kontroll bevisar
      att grinden kan fälla, och ett prov med en avsiktlig överlevare bevisar
      att den fångar sitt målfall. **KOSTNADEN BLEV FEL FÖRST:** prognosen ~50 s
      var en LOKAL mätning projicerad till CI; skarpt utfall 289 s, jobbet 6,5
      min mot tak 8. Rotorsak `retries: CI ? 2 : 0` — i självtestläget är rött
      det förväntade utfallet, så varje test kördes tre gånger med video.
      Lagat i samma pass (`--retries=0` + artefakter av i regimen): **297 s →
      73 s**, jobbet ~2,5 min. **`test.fail()`-formen förkastades aktivt** — den
      kontrollerar att ett test fälls, aldrig varför, och hade i en delad modul
      körts en enda gång av ESM-cachen. `59.5`/`59.6` har därmed ett permanent
      bevis i stället för tretton manuella cykler
- [ ] **Review-pilotens kadens** (T86-friktionen) — passet uteblev även på
      `TASK-54.2`, märkt i pilotloggen. Beslutskriterierna räknar skivor, inte
      pass, så varje omärkt uteblivet pass underskattar träffkvoten
- [ ] `IDENTITET.md`-destillatet (= Spår B steg 4)
- [x] **Länkgrindens form (= A4) — AVGJORD OCH VERKSTÄLLD 2026-07-28**
      (ADR-082, PR `#324`). Marcus delegerade beslutet till Code i klartext;
      utfallet står i A4-posten ovan. Ursprungstexten bevarad nedan.
      **SKÄRPT 2026-07-28.** `danger.systems` blev
      undantag **nummer 20**, och `.lycheeignore` bär redan husets egen dom att
      grinden är fel designad. **Dagens tre länkfel hade tre olika rätta svar** —
      `danger.systems` (värden avvisar CI-nätet → undantag) · `martinfowler.com`
      (lycheens parallellism mot strypande värd → **ingenting**, CI var grön) ·
      en död intern pekare efter filflytt (→ **laga**). Grinden fäller likadant
      i alla tre. A5:s tre återstående skivor rör dokumentation i varje steg
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
| 2026-07-27 | Tillstånds-återställningen (resume 4) + **Spår C: 14 fragment** | `8a79987` · `#274` |
| 2026-07-27 | **Airtable-kostnaden dokumenterad** — ADR-063 § S91-not + `airtable-constraints.md` sektion F (P26/P27 + P4-utvidgning) | `bc888d3` · `#275` |
| 2026-07-27 | `CLAUDE.md`-pekare till constraints-katalogen + **`TASK-53`** för 429-backoffen | `8006d54` · `#276` |
| 2026-07-27 | **A3 speccat** — `TASK-54` + två skivor + QA; restlistans `skipAssetRequests`-krav rättat | `920a3ef` · `#277` |
| 2026-07-27 | **`TASK-54.1` levererad** — MSW bär API-lagret; ekvivalens pixel-bevisad A/B | `56e9064` · `#278` |
| 2026-07-27 | `TASK-54.1` stängd (Done efter CI) + **`TASK-55`** registrerat | `34a3ea6` · `#279` |
| 2026-07-27 | **T86-friktionen bokförd** + 54.1:s pilotrad + review-fixarna (ADR-080 rättad) | `c5c1dc0` · `#280` |
| 2026-07-27 | Femte pausen — lifecycle paused, handoff, todo-kadens | `4b087bc` · `#281` |
| 2026-07-27 | Tillstånds-återställningen (resume 5) | `85b7c07` · `#282` |
| 2026-07-27 | **`TASK-54.2` levererad** — vakten till `onUnhandledRequest`; `skipAssetRequests` VÄND till `false` efter källkodsmätning; sid-vakt + EF-catch-all rivna; tvåsidigt rött-först | `a1c78f9` · `#283` |
| 2026-07-27 | `TASK-54.2` stängd + **`TASK-56`** (WS-vägen) + fragment `*/`-i-blockkommentar | `d681f3e` · `#284` |
| 2026-07-27 | **`TASK-54.3` QA körd av Code på Marcus delegering** — sex steg; **`TASK-57`** + **`TASK-58`** registrerade | `b31fc3b` · `#286` |
| 2026-07-27 | **Baselines regenererade** — 6 bilder, Marcus-granskade och godkända | `37e638d` · `#287` |
| 2026-07-27 | **`TASK-55` löst** + Actions-flaggan satt enterprise→org→repo; workflowens filhuvud faktarättat; fragment *låst tre nivåer upp* | `ed984c1` · `#288` |
| 2026-07-27 | **Sjätte pausen** — A3 stängd, lifecycle paused, VAR VI ÄR omskriven, `T87` avblockerad | `8ee8b34` · `#289` |
| 2026-07-27 | Restlistan genomgången post för post mot resumens faktiska utfall (Marcus-order) | `c1ea2e3` · `#290` |
| 2026-07-27 | Tillstånds-återställningen (resume 7) + **klassningen av `TASK-56`/`57`/`58`** — alla `ready-for-agent`, 13 AC skrivna mot läst kod | `a478d1b` · `#291` |
| 2026-07-27 | **`TASK-58` DONE** — överskuggningsmönstret `network.use()` dokumenterat i fixturmodulen; precedens + isolering lästa ur biblioteket, exemplet kört som kastbart bevis | `6910d02` · `#292` |
| 2026-07-27 | **`TASK-57` DONE** — vakten lyfter närmaste träff (Levenshtein, TypeScripts 0,4-tröskel) och skiljer extern adress från omockad EF; **`T101`** registrerad | `59b8391` · `187d4e8` · `#293` |
| 2026-07-27 | **Byggplanen v1.14** — Fas E-horisonten omankrad, Fas 6:s stängning medvetet hållen; **ADR-080:s `skipAssetRequests`-omprövning fick sitt utfall infört** | `277174e` · `ff179d8` · `#294` |
| 2026-07-27 | **A5 SPECCAT — `TASK-59`** (PRD-kort, 14 användarberättelser, 9 DoD). Klassningen omräknad ur rådata → **18/14**, ADR-080 noterad; skarv-valet belagt mot MSW:s och Playwrights primärkällor | `b881c63` · `#295` |
| 2026-07-27 | **A5 NEDBRUTET — sju skivor + QA** (`TASK-59.1`–`59.8`), vågorna delade efter YTA ej antal; linjär beroendekedja, Marcus delegerade uppdelningen | `b881c63` · `#296` |
| 2026-07-27 | **`TASK-59.1` DONE** — fixturvärlden till delad hemvist `tests/support/fixturvarld/`; 24 baselines md5-oförändrade | `d52d6c8` · `#297` |
| 2026-07-27 | **ci-wait härdad** — `--commit` kräver full SHA; fällde direkt två självtest-fall som anropat förkortat | `eaebec6` · `#298` |
| 2026-07-28 | **Sjunde pausen** — `lifecycle: paused`, Del 14 (orkestreringen), HANDOFF, todo-kadens | `#306` |
| 2026-07-28 | Restlistan ikapp pausen — steg 3 → PÅGÅR, A5-punkterna avbockade, `T104`-ordningen + A4 skärpta i § Beslut | (denna PR) |
| 2026-07-28 | **`TASK-59.4` DONE — Personer-ytan** (3 filer, e2e 30→27). Tvåsidigt bevis per fil; agenten fann ett hål i sin EGEN bevismetod (vakten fäller på `get-person` innan `update-record` nås) och körde ett separat skrivvägs-prov. **`T104`** registrerad. Enabling-detour: död pekare i sessionsdok S23 efter flytten | `#304` |
| 2026-07-27 | **`TASK-59.3` DONE — acceptance-klassen LEVER.** Eget projekt + mutexfritt jobb (placering, ej flagga) + `mergeTests`-komponerad söm; Hem-ytans två filer flyttade med tvåsidigt bevis (`hem` 28 fällda / 56 vakt-fel när mockarna neutraliserades). CI visar `Acceptance (hermetisk): success` som eget jobb. **`T102`** + **`T103`** registrerade | `#302` |
| 2026-07-27 | **`TASK-59.2` DONE — kontraktsvakten i drift.** Larmkedjan bevisad skarpt (dispatch `30309427472`: `Kontraktsvakt: success` + `Larm: success`, ärende `#300` stängt med motivering). **Vakten larmade på RIKTIG drift vid första körningen** — 11 fält som `get-registrations` skickar i 43/43 poster saknades i fixturen. Tre enabling-detourer krävdes: fixturen ikapp · `L264`-tidszonsfixen · `danger.systems`-undantaget | `95157a5` · `4644041` · `8728e1f` · `#299` |

**Två dispatcher utöver PR-raderna:** `30295150783` (genererade de sex
bilderna) och `30297097792` (**beviset** — *"Inga baseline-ändringar"*, som
stängde `TASK-54.2` DoD 7 och `TASK-54.3` DoD 5).
