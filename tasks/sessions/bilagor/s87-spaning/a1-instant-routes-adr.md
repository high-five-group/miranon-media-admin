# a1-instant-routes-adr

## FRÅGA
Borde "Routes"-ADR:n som avböjdes i S83 (manuell anmälan-sidan nåbar från två platser, samma sida men olika presenterad) mintas nu efter nattbygget?

## SVAR
Nej — S83-beslutet håller för den SMALA route-ADR:n, men avböjandet vilar på svagare grund än det ser ut, och kunskapen saknar hem. Avböjandet var aldrig en bar-prövning: S83-doket säger bara att Marcus valde INSTANT-regeln av de två kandidaterna, och jag hittar ingen plats där de tre ADR-villkoren prövades mot route-frågan. Prövar man dem nu håller villkor 2 (överraskande utan kontext) och villkor 3 (verklig avvägning: alternativ b vs c, tre precedent, c förkastat med skäl) — men villkor 1 faller: återställningen är att radera en 21-radersfil och kollapsa en ternär, och mönstret har INTE fått fler konsumenter sedan S83. 18.19 lade till noll route-filer, och /anmalan/ny har fortfarande ingen levande ingång (hem-vy-knappen är obyggd). Dubbel-output-beviset gäller KOMPONENTEN EventValjare via en additiv form-prop, inte route-mönstret. Baren kräver alla tre villkor — alltså ingen ADR. Men det finns ett verkligt koherens-problem som inte är route-beslutet självt: repot bär nu tre route-grammatik-beslut i tre olika hemvister (C1 "separata routes, inte flikar" i URL-STATE-SPEC, 19.2:s "EN hemvist + redirect, inga döda URL:er" i en kod-kommentar, 18.18:s "två routes, samma komponent" i ett backlog-kort), och de två sistnämnda ser motsägelsefulla ut utan sin rationale. Dessutom är URL-STATE-SPEC bevisligt föråldrad: den listar en /event/$eventId/betalning som inte finns på disk och saknar samtliga routes nattbygget rörde. Rätt fordon är därför en spec-sektion i URL-STATE-SPEC — som ADR-074 redan utsett till adress-grammatikens hem — inte en ADR. Den app-breda route-grammatik-frågan hör hemma i konventions-hemmets grillning som Marcus redan har köad.

## FYND
- **S83:s avböjande var ett val MELLAN två kandidater, inte en prövning mot ADR-baren. Ingen decline-rationale mot de tre villkoren finns nedskriven.**
  BEVIS: tasks/sessions/archive/2026-07/2026-07-24-session-83.md:496-498: 'Route-mönstret mintades INTE — Marcus valde INSTANT-regeln av de två kandidaterna; route-beslutet står kvar som byggkrav i 18.18-kortet med sina tre precedent.'
- **ADR-078 (syskon-ADR:n) nämner inte route-frågan med ett ord — den handlar uteslutande om cache/placeholder/prefetch/skeleton. Ingen överlappning, ingen krock.**
  BEVIS: docs/decisions/ADR-078-instant-regeln.md, hela filen (108 rader) läst: Beslut 1-5 rör placeholderData, partiellt fält-skydd, prefetch på avsikt, skeleton-slutgeometri, deklarerat golv.
- **Alternativ b = /event/$eventId/ny-anmalan behålls oförändrad + en TUNN /anmalan/ny som renderar SAMMA komponent i tomt läge och navigerar in i den nästlade routen vid val. Alternativ c (search-param) förkastat: bryter path-param-grammatiken för en enda sida. Precedent: Linear (/new + /team/LIN/new), Rails nested creation, Jira gating-fält.**
  BEVIS: backlog/tasks/task-18.18 ... .md:60 (Implementation Notes punkt 13, fulltext) + BUILD-LOG.md:2957 (sammanfattningsrad)
- **Presentations-skillnaden är implementerad som EN prop-nullability-gren i komponenten — inte search-param, inte context, inte layout-route, inte separata vyer.**
  BEVIS: src/components/events/ManuellAnmalanForm.tsx:100-102: 'export function ManuellAnmalanForm({ eventId }: { eventId?: string }) { return eventId != null ? <ValtLage eventId={eventId} /> : <TomtLage />; }'
- **Båda route-filerna är rena en-radskomponenter; /anmalan/ny har ingen egen vy alls. Hela route-rationalen lever som kod-kommentar i den tunna routen.**
  BEVIS: src/routes/_authenticated/anmalan/ny.tsx:9-21 (kommentar + '<ManuellAnmalanForm />') och src/routes/_authenticated/event/$eventId/ny-anmalan.tsx:14-17 ('<ManuellAnmalanForm eventId={eventId} />')
- **Övergången tomt→valt bär sin avsikt i routerns history-state (för avslöjnings-animationen), inte i URL:en — ytterligare ett odokumenterat grammatik-val.**
  BEVIS: src/components/events/ManuellAnmalanForm.tsx:151-161 (state: (prev) => ({...prev, mmAvsloja: true})) läst på :178 via useLocation-select; typdeklarationen på :40-44
- **Route-mönstret har INTE fått fler konsumenter sedan S83. 18.19 lade till noll filer under src/routes/ — den navigerar bara /event/$eventId med behållna sökparametrar.**
  BEVIS: git show 1f950d6 --stat: 17 filer, ingen under src/routes/. Kortets punkt 4: 'Bytet navigerar routen (beslut a): /event/$eventId med behållna sökparametrar.'
- **Dubbel-output-beviset gäller KOMPONENTEN, inte routen: EventValjare fick en additiv form-prop ('kontextrad' | 'rubrik'), list-/sök-/popover-maskineriet delas oförändrat.**
  BEVIS: src/components/events/EventValjare.tsx:112-114 (prop-deklarationen) + :152 (const rubrikForm = form === 'rubrik'); task-18.19 Implementation Notes, AVVIKELSER punkt 1
- **Den andra ingången är ännu inte byggd — /anmalan/ny nås idag bara via direkt-URL och e2e. Hem-vyns knapp är explicit utanför skivan.**
  BEVIS: grep -rn 'anmalan/ny' src/ tests/ → endast routeTree.gen.ts, route-filen själv, JSDoc i ManuellAnmalanForm och tests/e2e/event-ny-anmalan.staging.test.ts:678,707 (page.goto). src/routes/_authenticated/anmalan/ny.tsx:18: 'Hem-vyns kommande knapp är denna routes tänkta ingång (utanför skivan).'
- **Repot bär ett motsatt-SEENDE route-beslut i en kod-kommentar: skapa-event flyttades till EN hemvist och den gamla URL:en står kvar som ren redirect. Utan rationale läser 18.18 (två routes) och 19.2 (en hemvist) som en motsägelse.**
  BEVIS: src/routes/_authenticated/mer/skapa-event.tsx:3-12: 'RIVEN HEMVIST ... Routen behålls som ren omdirigering så PWA-historik och bokmärken aldrig dör (inga döda URL:er)' → redirect till /event/skapa
- **URL-STATE-SPEC.md är repots utsedda hem för adress-grammatik och bär redan ett beslutsblock av EXAKT denna klass (routes-inte-flikar med Reconcilierad-rationale) — men den är föråldrad: den listar en route som inte finns och saknar fyra som finns.**
  BEVIS: docs/specs/URL-STATE-SPEC.md:104-126 (C1-blocket) + :114,:225 listar /event/$eventId/betalning; ls -R src/routes/ visar anmalda.tsx, narvaro.tsx, ny-anmalan.tsx, anmalan/$registrationId.tsx — ingen betalning.tsx. Hemvist-precedenten: ADR-074 beslut 4 ('hemvist URL-STATE-SPEC §Dev-parametrar') + byggplan.md:274
- **Konventions-hemmet är redan öppen Marcus-order av ADR-bar-klass, med den exakta skiktning som gör spec-sektionen till rätt fordon här. Batch-ordern deklarerar öppet att konventions-bilagan bara är en läskopia.**
  BEVIS: tasks/sessions/archive/2026-07/2026-07-24-session-83.md:424-458 (Del 7, Marcus-citatet + öppen fråga) · tasks/lessons.md:4965-4982 (L337) · tasks/sessions/bilagor/s85-nattbygget/batch-order.md:60-66 ('Detta är en batch-lokal LÄSKOPIA, inte konventionernas hem')

## LUCKOR
- Ingen bar-prövning av route-frågan finns nedskriven någonstans. Jag sökte i hela S83-doket (513 rader), i ADR-078, i docs/decisions/README.md, i tasks/threads/README.md och via grep i tasks/lessons.md — HITTADE INTE. Det enda som finns är meningen på S83:496-498.
- Route-researchen (Linear/Rails/Jira) finns INTE som research-fil. ls docs/research/ visar filer för filtervy och detaljsida-postvy från 2026-07-24, men ingen för route-semantik. Källorna lever som tre meningar i task-18.18 punkt 13 + kod-kommentaren i ny.tsx — utan URL-citat, utan datum per källa. En ADR eller spec-sektion som ska bära dem behöver dem re-verifierade.
- Jag har inte läst S83:s transkript-JSONL (två fönster, 3 362 rader totalt per doket Del 8). Marcus exakta formulering av avböjandet i stunden kan därför skilja sig från dokets sammanfattning — men doket är den durabla artefakten och det är den jag citerar.
- Jag har inte kunnat verifiera om Check-in/Personer/persondetalj faktiskt kommer att ärva mönstret. grep på 'Check-in|Incheckning|persondetalj' i docs/byggplan.md ger NOLL träffar; check-in existerar bara som 'check-in-ingången' i task-18.3 och /event/$eventId/narvaro. Påståendet att nästa bygge ärver mönstret är alltså en rimlig prognos, inte ett belagt faktum.
- Jag har inte granskat om URL-STATE-SPEC omfattas av någon CI-grind (frontmatter-vakt, länkgrind, governing-status). Om den inte har tänder är 'samma grind-yta som övriga specar' ett svagare argument än det låter.

## REKOMMENDATION
Mint INTE den smala Routes-ADR:n. S83-beslutet håller — men av delvis andra skäl än de som gavs, och det bör sägas rakt: villkor 1 (svårt att återställa) faller på att mönstret har exakt en instans, noll nya konsumenter sedan S83, och en andra ingång som ännu inte är byggd. Att skriva en ADR för ett mönster med en konsument är precis den spekulativa komplexitet över-engineering-vakten skär bort.

Gör i stället två saker, i den ordningen:

1. NU (litet, självständigt): en ny sektion "Manuell anmälan (/anmalan/ny + /event/$eventId/ny-anmalan)" i docs/specs/URL-STATE-SPEC.md, skriven i samma form som det befintliga C1-blocket (beslut + Reconcilierad-rationale + precedent). Den bär tre saker: (a) path bär föräldrakontext, query bär vy-state — search-param-formen förkastad; (b) två ingångar betyder TVÅ TILLSTÅND, inte två sidor, och ej-tillämpliga kontroller döljs i stället för att disablas; (c) den tunna ingångs-routen är INTE en andra hemvist — den har ingen egen vy, vilket är exakt vad som skiljer den från 19.2:s rivna hemvist. Samma landning rättar spec-staleness (betalning-raden bort; ny-anmalan, anmalan/$registrationId, anmalda, /anmalan/ny, /event/skapa + redirecten in). Det är detta som gör kunskapen läsbar för nästa agent, vilket är hela poängen med L337.

2. SENARE (Marcus startar): lyft "vad är appens route-grammatik?" som en explicit delfråga in i konventions-hemmets grillning. DEN frågan klarar alla tre bar-villkoren — den är app-bred, den är svår att riva i koherens när fem ytor väl valt olika, och den har redan utövats i tre olika riktningar. Blir utfallet en ADR mintas den där, med spec-sektionen ovan som underlag. Att minta en smal 18.18-ADR nu skulle föregripa den grillningen och riskera att låsa fel abstraktionsnivå.

Om Marcus ändå vill ha ADR:n nu (under-bar-ADR på explicit beslut är tillåtet, öppet noterat i Kontext): skriv den app-brett, inte som 18.18:s alternativ b. Titel: "ADR-079 — Appens route-grammatik: path bär identitet och kontext, query bär vy-state". Tre beslutspunkter: (1) föräldrakontext i path, aldrig i query; en skapa-/detaljsida som också nås utan förälder får en tunn top-level-route som renderar samma komponent i tomt läge (Linear/Rails/Jira). (2) Två ingångar = två tillstånd, inte två sidor; progressive disclosure, aldrig disabled. (3) En sida har en hemvist; flyttas den står gamla URL:en kvar som ren redirect — tunn ingångs-route är inget undantag eftersom den saknar egen vy.

## ARBETSFORM
Spec-sektion + do-work-kort för punkt 1 (litet, self-contained: URL-STATE-SPEC-sektionen + staleness-rättningen som ETT kort). Punkt 2 är grillning — den redan köade konventions-hemmets grillning, med route-grammatiken som namngiven delfråga. Ingen ADR nu.

## OMFATTNING
Punkt 1: 30-60 minuter i ett do-work-pass. Ren dokumentation, noll kod, noll tester — men kräver att route-tabellen verifieras mot ls -R src/routes/ och att de tre precedenten (Linear/Rails/Jira) re-verifieras med URL-citat eftersom research-filen saknas. Landas som branch + PR + auto-merge per ADR-076; länkgrinden är enda riskmomentet.

Punkt 2: ett grillnings-pass i egen session (Marcus startar), plus ADR-skrivning om utfallet blir ADR. Sessions-klass, redan schemalagd i det öppna konventions-hemmet — inte ett nytt spår.

## BEROENDEN
- Beror på: konventions-hemmets grillning (S83 Del 7 + L337) är öppen och ägs av Marcus — punkt 2 kan inte startas av Code. Punkt 1 är däremot självständig och behöver inte vänta.
- Beror på: route-researchens tre precedent saknar research-fil (docs/research/ har ingen route-fil) — måste re-verifieras med URL-citat innan de skrivs in i en spec eller ADR.
- Blockerar: hem-vyns 'Ny anmälan'-knapp. Det är den skivan som gör /anmalan/ny till en levande andra ingång, och därmed gör route-grammatiken observerbar för Lotta. Spec-sektionen bör landa före den.
- Blockerar: framtida skapa-/detaljytor som ärver grammatiken (Check-in, Personer, persondetalj). Ju fler ytor som väljer före beslutet, desto dyrare blir koherens-återställningen — det är den enda vägen villkor 1 kan börja hålla.
- Bör samordnas med: task-45 (kommande-filter/sort-dubbleringen) och task-47 (e2e-fixture-konsolidering) — samma lyft-klass av 'samma sak i två grammatiker', men olika lager.
- Krockar INTE med: ADR-078. Läst i sin helhet — noll överlappning med route-frågan.

## RÖR VID
- docs/specs/URL-STATE-SPEC.md — SKRIVS (ny sektion för manuell anmälan + route-grammatik-reglerna + rättning av den föråldrade route-tabellen på rad 104-126, 114 och 225). VARNING: filen skrevs 2026-07-25 02:28 av nattbygget (17.7:s URL-beslut) — kolla mtime och git log före edit, parallella spår kan ha rört den sedan dess.
- docs/decisions/ADR-079-*.md — SKRIVS ENDAST om Marcus väljer ADR-vägen (nästa lediga nummer 079 per S86-dokets numreringsrad; verifiera mot disk omedelbart före skrivning, inte vid start — S83:s numrerings-kollision med S84 är precedenten).
- docs/decisions/README.md — SKRIVS endast vid ADR (index-rad).
- backlog/tasks/ — nytt kort skapas för spec-sektionen (nästa lediga är task-49; task-48 är högsta på disk). Via backlog-CLI, aldrig direktredigering.
- tasks/sessions/2026-07-25-session-86.md — Del-rad vid landning (dokets lifecycle är active).
- SKRIVER INTE i: src/ (ingen kodändring föreslås), task-18.18/18.19-korten (deras facit står — spec-sektionen refererar dem, ändrar dem inte), ADR-078.

## MARCUS-BESLUT
- A) Håller S83-beslutet? Code-rek: JA för den smala Routes-ADR:n — villkor 1 faller (en konsument, noll nya sedan S83, andra ingången obyggd). Alternativet är att mint:a den ändå som under-bar-ADR på ditt explicita beslut, öppet noterat i ADR:ns Kontext. Vilket?
- B) Om kunskapen ska hem: spec-sektion i URL-STATE-SPEC nu (Code-rek), ELLER vänta tills konventions-hemmets grillning avgjort hemvisten och skriva allt på en gång? Rek:en är att inte vänta — spec-staleness (en route som inte finns, fyra som saknas) är en egen defekt oavsett hemvist-utfallet.
- C) Om ADR ändå: smal (18.18:s alternativ b) eller app-bred route-grammatik (Code-rek)? Den app-breda klarar alla tre bar-villkoren; den smala klarar två av tre. Men den app-breda föregriper konventions-hemmets grillning om den skrivs innan du kört den.
- D) Ska route-grammatiken skrivas in som en namngiven delfråga i konventions-hemmets grillning (utöver hemvist-valet UI-KONVENTIONER.md / DESIGN-SYSTEM-SPEC / Storybook)? Den frågan är inte samma sak som var konventionerna bor — den är vad de säger.
- E) URL-STATE-SPEC-staleness: eget litet kort nu, eller rider den med i spec-sektionens kort? Rek: samma kort — det är samma fil och samma läsning.
