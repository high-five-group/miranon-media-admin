# tasks/lessons.md

> Projektets organisatoriska minne. Denna fil växer kontinuerligt.
> Varje korrigering, insikt och mönster fångas här.
> Claude läser denna fil vid varje sessionsstart.
> Lärdomar märkta [UNIVERSAL] bör lyftas till meta-repot.
> Senast uppdaterad: 2026-05-04 (Fas A säkerhetshardening M2+M8+M4 — 3 [UNIVERSAL]: test-only-endpoints får aldrig nå produktion + Supabase två-stegs auth-check + hypotes om UI-flöden ska valideras empiriskt)

---

## Så här används denna fil

1. Efter varje korrigering: lägg till en ny post under rätt kategori
2. Formulera som en **regel** – inte en berättelse. "Gör X" eller "Gör aldrig Y"
3. Om samma misstag händer två gånger: uppgradera till **Kritisk regel**
4. Granska vid sessionsstart – speciellt kritiska regler

---

## Kritiska regler

> Misstag som hänt mer än en gång. Dessa har högsta prioritet.

- Claude Code-prompts ska ALLTID ange fullständig sökväg till repot. Brist på detta slösade tid i session 6. [UNIVERSAL]
- [UNIVERSAL] **Sessionsavslut: implementera EXAKT vad prompten specificerar.** Jämför punkt för punkt — hoppa inte över poster. Session 14 tappade 2 av 8 punkter i "Nästa steg" för att Claude inte jämförde promptens lista med det som skrevs. Alltid: läs prompten → skriv → jämför rad för rad.
- [UNIVERSAL] **Härleda aldrig slicad data som om den vore komplett.** `kommandeEvent` (top 5) ≠ alla kommande event. `kommandeEventIds` måste härledas från den ofiltrerade källan (`allaKommandeEvents`), inte den slicade. DashboardView Batch 2 hittade och fixade denna bugg.
- [UNIVERSAL] **Varje ny komponent ska genomgå fullständig 3-delad audit innan den anses klar.** Del 1: Tillgänglighet (axe-core + Lighthouse + manuell WCAG 2.2 AA + tangentbord + skärmläsare + EU-krav). Del 2: Teknisk kvalitet (arkitektur, !important, hårdkodade värden, dead code, BEM, beroenden, prestanda, branschstandardjämförelse). Del 3: Återanvändbarhet (lageroberoende, props/emits, generiska vs projektspecifika rader, npm-paket-redo). Betyg 1-10 på varje del. Ingen komponent passerar under 9. Mall: docs/COMPONENT-AUDIT-MALL.md.

---

## Stack-specifika lärdomar

### FK Designsystem (Vue 3)
- FK:s FNavigationMenu är designad för horisontell top-nav — inte vertikal sidebar. Bygg FK-inspirerat istället för att tvinga fel komponent. [UNIVERSAL]

### Vue 3
- [UNIVERSAL] **Eliminera mellanliggande computed-lager om template-uttrycken är enkla.** Vue 3:s template-compiler trackar beroenden individuellt — en monolitisk computed som samlar state för N element tvingar omberäkning av alla vid varje ändring. Direkta uttryck eller enkla funktioner är renare och snabbare.
- [UNIVERSAL] **Specificitetsnästling (parent prefix) slår !important.** `.fk-menu .fk-menu__header` (0,3,0) overridar `[tabindex]:focus` (0,2,0) utan !important. Enklare, mer underhållbart, inga sidoeffekter.
- [UNIVERSAL] **Referens ≠ beroende.** Att studera ett professionellt komponentbiblioteks källkod och bygga eget baserat på lärdomarna ger bättre resultat än att importera och wrappa. FK:s 500+ rader treegrid är en ritning, inte en import.
- [UNIVERSAL] **Bygg bibliotek, inte bara app.** Varje komponent och composable ska bedömas utifrån: "kan detta återanvändas i nästa produkt utan ändringar?" Om svaret är nej — refaktorera tills svaret är ja. Kostnaden betalas en gång, vinsten multipliceras.
- [UNIVERSAL] **11/11/11 för bibliotekskomponenter, 11/10/10 för vyer.** Composables och komponenter som delas mellan produkter ska hålla world-class-nivå. Vyer är appspecifika och bedöms med produktfokus.
- [UNIVERSAL] **Viewmodel-composable per vy.** All affärslogik (filtrering, sortering, summering) lever i en composable — vyn gör bara layout och databindning. Bevisat mönster i 2+ vyer (DashboardView, MinaSidorView).
- [UNIVERSAL] **Delade composables framför duplicering.** `useDashboardData` konsumeras av båda vyer utan kodduplicering. `useUserDisplayName` likaså. Om två vyer behöver samma logik — extrahera, duplicera aldrig.

### Airtable
- [Formler, automations, schemadesign, API-quirks]

### Make.com
- [Scenariodesign, felhantering, modulval, datastruktur]

### Supabase
- Supabase Edge Functions som Airtable-proxy: exakt samma mönster som Psionautics. `callEdgeFunction<T>()` i frontend → Edge Function med AIRTABLE_TOKEN → Airtable REST API. Bevisat robust. [UNIVERSAL]
- Edge Functions läser query params (GET) men `supabase.functions.invoke()` skickar body (POST). Använd `fetch()` med manuellt byggd URL istället för SDK:ns invoke för GET-anrop.

### Framer
- [CMS, responsivitet, publicering, custom code]

### Resend
- [E-postmallar, leveransbarhet, API-anrop]

### Plausible
- [Event-tracking, custom properties, integration]

### Tailwind v4 / CSS
- [UNIVERSAL] **CSS custom properties: undvik perioder i namn (`--p-space-0.5`).** Biome och Lightning CSS avvisar dem — CSS-specifikationen tillåter inte perioder i `<custom-ident>` utan escaping, och strikta parsers (Biome, Lightning CSS) kraschar med kaskaderande parse-fel. Använd bindestreck: `--p-space-0-5`, `--p-space-1-5`. Browsers är permissiva men bygg-pipelinen är det inte. Hittades i Fas 0 när DESIGN-SYSTEM-SPEC-tokens kopierades och Biome kastade 244 fel.

---

## Design och UI

- Status-enums ska ALLTID verifieras mot Airtable MCP live-data — inte gissas från dokumentation. Värdena i session 6 stämde inte med verkligheten. [UNIVERSAL]
- [PROJEKT] FK:s komponenter ger tillgänglighet i sig själva, men EGNA komponenter (meny, StatCards, dashboard-listor) behöver explicit ARIA-granskning. Slide-in-menyn saknade aria-expanded, aria-current, focus trap. Skeletons saknade aria-busy. Dashboard-listor saknade aria-live.
- [PROJEKT] prefers-reduced-motion måste respekteras på ALLA animationer — meny-slide, blink, skeleton-shimmer, animerad counter, progress bar transitions.
- [PROJEKT] Ny regel: ingen ny vy påbörjas förrän Lighthouse ≥ 95 och axe visar 0 critical/0 serious.
- **Breadcrumbs-mönster:** `<nav aria-label>` + `<ol>` + `aria-current="page"` + underline. Redo att extrahera till MmBreadcrumbs.
- **Kort som `<article>`** med h2-rubrik — inte `<div>`.

---

## Arbetsflöde och process

- Sessionsavslut: gå igenom HELA checklistan — inte bara CLAUDE.md utan även lessons.md, todo.md och referensfiler. Claude missade detta i session 6 och behövde korrigeras.
- [UNIVERSAL] Tillgänglighetsdokument (checklista, audit-mall, session-checklista) ska finnas INNAN byggfasen börjar. Vi hittade 13 a11y-problem i V0–V7 som hade undvikits med checklistor på plats.
- [UNIVERSAL] Stora Code-prompts som kombinerar audit + fix + commit i ett svep kan hänga sig. Dela upp i Del 1 (läs/rapportera), Del 2 (fixa), Del 3 (verifiera/committa).
- [UNIVERSAL] **Research-beslut som inte implementeras i specen är värdelösa.** Varje research-rekommendation som accepteras MÅSTE spåras hela vägen till implementation. Om specen avviker från researchen, dokumentera VARFÖR — annars ärvs avvikelsen tyst vidare. Miranon hittade detta 2026-04-13: research §4 rekommenderade Tailwind v4 `@theme`, men DESIGN-SYSTEM-SPEC §8 hade en full `tailwind.config.ts` utan motivering. Gap-analysen missade avvikelsen, conversion-plan ärvde den, todo.md ärvde den. Fix: krav på "research-trace" i varje spec — "denna sektion kommer från research §X, avvikelse: ingen/[skäl]".
- Airtable rollup med IF-filtrering inuti aggregeringsformeln (COUNTALL(IF(values="X",1))) fungerar opålitligt. Använd istället inbyggda "Only include linked records that meet certain conditions"-filtret + COUNTA(values). [UNIVERSAL]
- Projektkunskap (Claude Projects) kan inte indexera filer > ~5000 rader. Stora filer måste brytas upp innan de laddas upp. Psionautics Admin.tsx var oåtkomlig tills den extraherades till 19 separata filer. [UNIVERSAL]
- [UNIVERSAL] **Hävda aldrig en specifik versionsorsak utan att först verifiera installerad version med faktiskt kommando.** I Fas 0 motiverade Claude borttagning av `baseUrl` från tsconfig med "TS 7.0 deprecated" — utan att köra `tsc --version`. Den installerade versionen var TS 6.0.2, som bara visar en varning om framtida borttagning, inte en hård deprecation. Regel: innan du skriver "enligt version X" i en motivering eller commit, kör verifieringskommandot (`tsc --version`, `node --version`, `npm ls <paket>`). Motiveringar som bygger på antagen version blir lätt fel och urholkar förtroendet för övriga beslut.
- [UNIVERSAL] **Kodprojekt ska ha `docs/BUILD-LOG.md` och `docs/decisions/` från dag ett.** BUILD-LOG dokumenterar plan vs. verklighet per fas (avvikelser, faktisk output, uppskjutna beslut, miljödata, Definition of Done). `docs/decisions/` innehåller numrerade ADR:er (Architecture Decision Records) med Context → Decision → Alternatives → Consequences. Utan dessa lever beslut bara i chathistorik som ingen hittar när det verkligen behövs. Infördes i miranon-media-admin Session 1 (React) med 10 ADR:er — Session 2 och framåt ska följa samma mönster. Sessionsstart och sessionsavslut i CLAUDE.md pekar explicit på båda dokumenten så att varje session startar och slutar med uppdatering.
- [UNIVERSAL] **Hypotes om UI-flöden måste valideras mot faktisk implementation, inte mot specs.** Discovery-fasen i Fas A M4 antog att Vue-versionen var en sanningskälla för skrivflöden — vid inventering visade sig 8/11 Vue-views vara 19-radiga MmMessageBox-placeholders ("Byggs i V8/V9/V10/V12") och de riktiga (Dashboard, MinaSidor, Login) vara read-only. Hypotes-listan från Gate A1 (8 operations baserade på data-model.md + sannolika Lotta-flöden) kunde inte verifieras empiriskt eftersom det inte fanns någon UI-kod att verifiera mot. Mönster: när du ber någon "inventera vad X gör", verifiera först att X faktiskt gör det. När empiri saknas — bygg infrastruktur med tom allowlist (Marcus M4-justering 2026-05-04) snarare än att deploya oförankrade hypoteser. Att bygga icke-bevisade kapabilitetsytor är onödig attack-yta. Källa: Fas A M4 discovery 2026-05-04.

- [UNIVERSAL] **Supabase Edge Functions har två-stegs auth-check.** Gateway-nivå (`verify_jwt` i `config.toml`) fångar saknad/ogiltig JWT med eget felformat (`{"code":"UNAUTHORIZED_*","message":"..."}`) INNAN funktion-koden körs. Funktion-nivå (egen `requireUser`-helper i koden) fångar role-check (anon-key passerar gateway eftersom det ÄR ett valid JWT, missing claims, custom-policy) med eget format (`{"error":"..."}`). Båda är legitima 401-svar. Deny-path-tester och klient-felhantering måste acceptera båda formaten — annars bryts båda när gateway-toggling sker (t.ex. `verify_jwt = false` på en funktion för testbarhet). Mekanismen är inte specifik för Supabase — alla gateway+function-arkitekturer (AWS API Gateway + Lambda Authorizer, Cloudflare Workers + custom auth, etc.) har samma två-stegs-mönster. Lärt under Fas A M2 staging-verifiering 2026-05-04 (commit 605502f). Värdet ligger i att Passionslyftet och framtida SaaS kommer att möta samma arkitekturdetalj.

- [UNIVERSAL] **Test-only-endpoints (prefix `test-*`) får ALDRIG nå produktion.** När en helper behöver isolerad runtime-testning är en minimal test-endpoint (som `supabase/functions/test-auth/` för `requireUser`) det renaste sättet att köra deny-path-tester utan att gå via en datafunktion där fel kan komma från flera lager. Men sådana endpoints exponerar test-ytor (auth-bypass-konfig, debug-output) som inte hör hemma i prod — även om de i sig är "harmlösa" är dom attack-yta. Regel: deploy-pipelinen måste filtrera bort `test-*`-funktioner från prod-deploy explicit (deploy-script med funktion-allowlist, `.deployignore`-konvention, eller `supabase functions deploy --project-ref <prod>` med uttrycklig lista). Konventionen `test-`-prefix gör filtreringen mekanisk. Spårbarhet: miranon-media-admin Fas A M2 (2026-05-04) — `test-auth` infördes för Marcus utökade DoD; TODO Fas 7-not skriven i `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md` §F så det inte tappas innan deploy-pipelinen byggs. Naming-not: ursprungligt prefix var `_test_*` (underscore) men Supabase CLI accepterar inte underscore-prefix på funktionsnamn (regex `^[A-Za-z][A-Za-z0-9_-]*$`) — använd hyphen.

### Sessionsdokument från första klunga vid flerstegs-Chat-arbete [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P1-sessionen byggplan-revision

Vid flerstegs-Chat-arbete där varje steg matar nästa (P0/P1/P2/P3-faser, multi-klunga-beslutsarbete, gates med flera milstolpar): skapa sessionsdokument vid första leverans-bit, inte i slutet. Chat-only är fel form även när context window är stort — risken är inte tappade tokens i sessionen utan tappad spårbarhet vid sessionsslut, oförmåga att granska parallellt mellan turer, och Code kan inte konsumera Chat-historik direkt.

**Mönstret:** vid sessionsstart, efter kontext-läsning men före första leverans, föreslå arbetsfilen explicit. Två varianter:
- (a) Eget sessionsdokument om leveransen är multi-del — `tasks/sessions/YYYY-MM-DD-arbete.md`
- (b) Direktredigering av målfilen om leveransen är en enskild dokumentuppdatering

Kostnaden är 5 minuters Code-anrop vid sessionsstart. Vinsten är granskbarhet per klunga, recovery-säkerhet, och Code-konsumerbar leverans.

**Anti-mönster att undvika:** "Jag levererar i chatten och vi konsoliderar i slutet" — sista-steg-konsolideringen är då en single-point-of-failure.

### Scenariobeslut när indata saknas [UNIVERSAL]
> Datum: 2026-05-04 | Källa: A1 i P1, ekar Sentry-DSN-mönstret från Fas A Gate A1

När ett beslut mår bra av indata som inte finns ännu — lås beslutskriterierna nu och defer:a själva valet till indata-punkten. Inte "vi tar det senare" (vag), inte "vi gissar nu" (ovetenskaplig). Skarpa trigger-kriterier som aktiveras av en namngiven framtida observation.

**Mönstret:**
1. Identifiera vilken indata som saknas och var den kommer från (vilken fas, vilket dokument).
2. Skriv 3-5 dimensions-rader med tröskelvärden för varje utfall.
3. Definiera binär trigger-regel ("om minst en av rad 2 eller rad 3 är JA → utfall X, annars utfall Y").
4. Lägg krav på indata-leveranspunkten ("P2 *måste* rapportera (a), (b), (c)").

**Två konkreta instanser i projektet:**
- Sentry-DSN i Fas A Gate A1 — beslutskriterier låsta, valet gjordes med faktisk DSN-info
- Fas 3.5 egen-fas-vs-integrerad i P1 A1 — beslutskriterier låsta, aktiveras av P2:s första `ACCESSIBILITY-CHECKLIST.md`-bedömning

**Anti-mönster:** "Vi får se" + ingen kriteriebeskrivning + ingen trigger-punkt = bara uppskjutet beslut, samma osäkerhet kvar.

### Beroendegraf före beslutsserier [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P1 Klunga 0-strukturering (8 beslut med korsberoenden)

Innan en serie beslut fattas (5+ beslut med inbördes beroenden): kartlägg hård vs mjuk koppling i en explicit graf. Hårda kopplingar = ett beslut kräver ett annat som indata. Mjuka kopplingar = ett beslut informerar ett annat men låser inte.

**Mönstret:**
1. Lista alla beslut som ska fattas.
2. För varje par av beslut (X, Y): finns det en koppling? Om ja, är den hård eller mjuk?
3. Identifiera om det finns en central beroende-nod (ett beslut som flera andra beror på).
4. Välj ordning: "fyra klungors-ordning" (lättviktigt först → nav → kedja → städning) ELLER "kritisk-väg-först" (nav först, sedan resten i valfri ordning).
5. Verifiera grafen mot källdokument innan beslut fattas — beroenden måste ha källspår, inte gissningar.

**Anti-mönster:** "Vi tar besluten i listordning" — det fungerar bara om besluten är oberoende, vilket de sällan är när det handlar om sekvens, scope eller sub-fas-allokering.

**Konkret instans:** P1:s 8 beslut hade A5 som central nod. Fyra-klungors-ordning över kritisk-väg-först eftersom A5 var energikrävande (förtjänade två lättare beslut före).

### Stödspec-synk via tillägg, inte omskrivning [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P2-sessionen stödspec-synk

När en specs-fil ska synkas mot ny implementation eller nytt beslut: prefer **tillägg av ny sektion + uppdatering av status-kolumner i befintliga tabeller** över omskrivning. Tillägg ger spårbarhet (commit-historiken visar exakt vad som tillkommit), bevarar tidigare resonemang som förblir giltigt, och minskar risk för otidsenlig "förbättring" av redan korrekt prosa.

Omskrivning är rätt **endast** när filens tekniska premiss är fel — t.ex. ACCESSIBILITY-CHECKLIST som vägledde mot fel UI-stack (Vue/FKUI). Då blir punktinsatser otillräckliga eftersom *vilken stack filen vägleder mot* är hjärtat, inte enskilda punkter.

**Beslutsregel:**
- Är >50% av filens prosa giltig idag? → Tillägg + status-uppdateringar.
- Är filens primära rekommendations-yta fel teknik-stack? → Omskrivning.
- Är driften terminologisk men arkitekturen rätt? → Lämna orörd, dokumentera observation, planera "naturligt synlig"-uppdatering vid nästa relevanta fas.

Tillägg-mönstret i SECURITY-SPEC P2: ny §6 "Fas A — etablerade arkitekturmönster" + status-kolumn-byten i §5 OWASP-tabellen. Inga befintliga sektioner togs bort. Diff:en är tydlig och granskbar.

**Kostnad om man väljer fel:** Omskrivning där tillägg räcker → tappad spårbarhet + risk för regression i tidigare korrekta beslut. Tillägg där omskrivning behövs → halvuppdaterad fil där läsaren får navigera mellan giltig och otidsenlig prosa, vilket ofta är värre än ingen synk alls.

### Trigger-beslut med självaktiverande indata [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P2 A1-utfallsleverans

A1 (Fas 3.5 egen fas eller integrerad) löstes inte av Chat-diskussion utan av att P2:s första leverans i ACCESSIBILITY-CHECKLIST-omskrivningen *aktiverade* trigger-tabellen. Mönstret är generaliserbart: scenariobeslut med skarpa kriterier kopplas till en *mätbar leveransmoment* så att utfallet faller ut av leveransen själv, inte av separat beslutsmöte.

**Konstruktion av trigger-beslut:**
1. **Skarpa kriterier i förväg** — varje trigger-rad har testbar tröskel (timmar, ja/nej, kvantifierbart krav). Inte vag "bedömning" eller "magkänsla".
2. **Binär aggregation** — hur kombineras raderna till ett utfall? "Minst en JA → utfall A" är skarpt. "Övervägande indikatorer pekar mot..." är inte.
3. **Aktiverande leverans** — vilken konkret artefakt avgör? (P2:s ACCESSIBILITY-CHECKLIST-leverans, inte "vi pratar om det igen").
4. **Spårbar rapport** — leveransen producerar en rapport per trigger-rad: rad 1 = X timmar (uppmätt), rad 2 = JA/NEJ (med bevis), rad 3 = JA/NEJ (med bevis).

**Anti-mönster:** "Vi tar A1-beslutet i P3 när vi ser hur det blir." Det är scenariobeslut utan kriterier — ger samma osäkerhet som inget beslut alls, men maskerat som "flexibelt".

**Spårbarhet:** Sentry-DSN-beslutet i Fas A löstes med samma princip — kriterier låstes före Gate A1, *valet* gjordes med faktisk indata. P2 A1 är det andra exemplet av samma mönster i samma projekt; mönstret fungerar.

### Korsreferens > duplicering vid synk-arbete [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P2 ACCESSIBILITY-CHECKLIST × ARIA-UPGRADE

Vid omskrivning av en spec som har överlappande domän med en annan spec: **bygg korsreferens, inte duplicering.** ACCESSIBILITY-CHECKLIST.md skulle kunna ha kopierat in ARIA-UPGRADE:s ARIA 1.3-detaljer per komponent, men det skulle skapa två versioner av samma sanning som driftar isär över tid (samma drift-mönster som lager 4 i fyra-lager-drift-lärdomen från REG 2026-04-19).

**Regel:** Varje sanning lever på *ett* ställe. Andra dokument refererar dit, kopierar inte. När en spec genomgår omskrivning: identifiera vilka sektioner som överlappar med andra specs *innan* omskrivningen, och välj per överlapp vilken fil som äger sanningen.

**Tillämpning P2:**
- ARIA 1.3-attribut per komponent → äger ARIA-UPGRADE.md. ACCESSIBILITY-CHECKLIST refererar dit.
- Operations-baserat API → server-definition i SECURITY-SPEC §6.1, klient-mönster i STATE-STRATEGY §8. Båda korsrefererar varandra.
- Strangler-fig-ordning → äger docs/research/datamodell-research/07-migration-plan.md §A2. STATE-STRATEGY refererar dit.

**Kostnad om man väljer duplicering:** Initial leverans är snabbare (copy-paste) men varje framtida ändring måste göras på N ställen, och drift fångas inte förrän en konsument läser fel version.

**Korsreferens-disciplin:** Pekarna ska vara konkreta sökvägar + sektion (`SECURITY-SPEC.md §6.1`), inte vaga ("se SECURITY-SPEC"). Konkret pekare gör att ändringar i målfilen visar sig som referens-rot om sektionen flyttas — vag pekare maskerar driften.

### Källa-vs-implementation-skiktning vid stack-byte [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P2 E (data-model.md vs Status.ts)

När en sanningskälla (specifikation/datamodell) speglas i implementation (kod/typer) och driftar isär: ändra inte källan för att matcha implementationen, även om implementationen är "närmare verkligheten". Källan ska vara avsiktlig, implementationen ska följa.

**P2 E-fallet:**
- `data-model.md` listar 6 statusvärden för Anmälningar (källa, uppdaterad 2026-04-26)
- `src/domain/types/Status.ts` listar 4 (implementation, header daterad 2026-03-30 — 30 dagar gammal)
- Frestelsen: uppdatera data-model.md till 4 värden för att "matcha verkligheten"
- Rätt: data-model.md är källan; Status.ts ska utökas till 6 värden i Fas 2.5

**Regel:**
1. **Identifiera vilken artefakt som är källan** — typiskt den som har explicit datum-spårbarhet, ändringslogg, eller refereras från flera implementations-ställen.
2. **Skikta target-shape vs source-shape** — när ny implementation introduceras (t.ex. SupabaseAdapter mot Airtable-source) ska target ha *separat* enum/typ, inte unifiering med source. Per P2 E: AirtableAdapter använder Airtable-shape, framtida SupabaseAdapter använder target-shape, DataSourceAdapter-gränsen översätter mellan dem.
3. **Korsverifiering över tid** — när en spec uppdateras (data-model.md 2026-04-26), markera vilka implementations-filer som måste följa (Status.ts, eventuella Zod-scheman). Sätt det som todo med spårbarhet — annars driftar implementationerna oupptäckt.

**K9-respekt** (från datamodell-research-projektets lessons): stable identifiers separeras från displaynamn vid integrationskanter. Airtable-värdet `"Bekräftad (mail skickat)"` är displaynamn, target-värdet `"confirmed"` är stable key. De ska inte blandas i samma enum-konstant.

**Kostnad om man väljer unifiering:** UI som konsumerar AirtableAdapter får target-värden som inte matchar live-datat → filter, badge-färger, status-knappar bryts. Senare migration (Fas E) blir omkull-skrivning av varje konsument istället för isolerad adapter-byte.

---

## Klient-specifikt

- [Lärdomar om klientens preferenser, kommunikation, krav]

---

## Mönster som fungerar

> Inte bara misstag – fånga också saker som fungerade bra.
> "Gör mer av X" är lika värdefullt som "gör aldrig Y".

- Extrahera komponentfiler från monoliter via Claude Code INNAN designarbete påbörjas — ger konkret referens istället för dokumentation om referensen.
- Dubbel granskningsrunda på planer (strukturell + djupgranskning) fångar olika typer av problem. Första rundan hittar praktiska frågor, andra hittar konceptuella brister.
- MCP-verifiering av Airtable-fält innan implementation — bekräftade att Betalningspåminnelse skickad var dateTime (inte checkbox), vilket påverkar UI-design.
- Spike-driven utveckling: testa ny stack med minimal implementation innan du committar till den. Vår Vue+FK-spike tog 15 minuter och sparade veckor av osäkerhet. [UNIVERSAL]
- [UNIVERSAL] **Använd alltid tredjepartskomponenter rakt av först.** Testa. Om de inte passar — iterera. Bygg ALDRIG egna varianter innan du bevisat att originalet inte fungerar. Att bygga kopior av fungerande komponenter är slöseri och ger sämre resultat.
- Chrome DevTools mot en live-sajt ger sanningen om hur något är byggt. Repo/dokumentation visar bara byggstenarna — inte hur de sätts ihop i produktion.
- [UNIVERSAL] **Inspektera alltid referensimplementationen live.** Att läsa ett komponentbiblioteks API bevisar inte hur organisationen själv använder sina komponenter. DevTools > dokumentation.
- [UNIVERSAL] **Visuella CSS-effekter: eliminera systematiskt.** border-left, box-shadow, outline, background-gradient, ::before/::after — sök aldrig bara en teknik. Dölj element (display:none) och se om effekten försvinner. Gör det efter 10 minuter, inte 40.
- [UNIVERSAL] **Outline och ::after måste leva på SAMMA element.** Outline renderas ovanpå sitt eget elements innehåll, men kan täckas av ett förälderelements ::after. position:static-tricket: static på fokusbart barn + relative på förälder = barnets ::after spänner föräldern.
- [UNIVERSAL] **FK:s globala _focus.scss sätter box-shadow.** `[tabindex]:focus { box-shadow: var(--f-focus-box-shadow); outline: 3px solid transparent; }` — alla custom fokusregler måste overrida med !important. Specificiteten `[tabindex]:focus` (0-1-0) slår klassnamn (0-1-0) via cascade-ordning.
- [UNIVERSAL] **"Funkar inte" kräver bevis.** En komponent som saknar en prop betyder inte att den inte kan kombineras med andra komponenter för att uppnå målet. Undersök kombinationer innan du bygger eget.
- [UNIVERSAL] **TA ALDRIG BORT FK-komponenter för att felsöka krasch.** Felsök VARFÖR den kraschar. Att ersätta FMessageBox med rå HTML bryter princip 10 (FK:s komponenter rakt av först) och ger sämre kvalitet. Om en FK-komponent verkar krasha — kontrollera imports, slot-mönster, och Vite-cache innan du byter approach.
- [UNIVERSAL] **Nativ HTML-element framför ARIA-roller.** `<button>` ger Enter/Space/focus/click gratis — `role="button"` kräver manuell `tabindex="0"` + `keydown` Enter + `keydown` Space. Använd alltid det semantiska elementet om det finns.
- [UNIVERSAL] **aria-label med faktiskt värde, inte animerat.** Skärmläsare ska få det riktiga talet (props.value), inte interpolerade mellanvärden från animering. Dölj det animerade displayValue med `aria-hidden="true"`.
- [UNIVERSAL] **cancelAnimationFrame vid unmount OCH vid target-ändring.** Utan cancel fortsätter `requestAnimationFrame` tick-loopen med stale ref efter komponent-unmount. Tracka `animationFrameId`, nollställ vid animation-complete, cancel i `onUnmounted`.
- [UNIVERSAL] **Skeleton-komponenter ska ha props för antal element.** Hårdkodad layout (v-for="n in 4") = 0% återanvändbarhet. Props med defaults (`statCount: 4, cardCount: 2`) kostar ingenting och gör komponenten generisk.
- [UNIVERSAL] **Duplicerad CSS mellan sibling-komponenter — extrahera omedelbart.** card-section.css (5 klasser) duplicerades i 2 filer (24 rader × 2). Importera via `<style src="./card-section.css" scoped>`. Netto -13 rader.
- [UNIVERSAL] **FK använder "negative" inte "error" för feedback-tokens.** `--fkds-color-feedback-background-negative`, `--fkds-color-feedback-text-negative`. Verifiera ALLTID tokennamn mot FK:s faktiska tema (grep i fkui.css), gissa aldrig.
- [UNIVERSAL] **var()-fallbacks maskerar saknade tokens.** En token som inte existerar ska synas som ett visuellt fel, inte tyst fallbacka till hårdkodat värde. Bevisat: StatusBadge hade 4 fallbacks som dolde att 2 tokens inte existerade i FK.
- [UNIVERSAL] **Auditprompter ska ALLTID specificera output-fil och sökväg.** Utan explicit filsökväg skrivs rapporten ut i terminalen istället för att sparas som referensdokument. Mönster: "Skriv till docs/audits/[datum]-[komponent].md".
- [UNIVERSAL] **Gruppaudit av sibling-komponenter avslöjar duplicering som enskilda audits missar.** card-section.css (24 rader × 2) hittades först när NewRegistrationsList och UnpaidSummary granskades tillsammans. Granska alltid relaterade komponenter i samma audit.
- [UNIVERSAL] **Bygg ALLTID generiska arkitekturer som återanvänds.** Hade vi byggt EN MenuSection-modell från början (istället för separat user-sektion + kategorilista) hade vi sparat 10+ iterationer. Om du märker att du bygger samma mönster för hand två gånger — stanna och generalisera.
- [UNIVERSAL] **Patcha inte buggar individuellt — identifiera det fungerande mönstret och kopiera det.** "Mina sidor fungerar perfekt → kopiera exakt till alla sektioner" är alltid rätt approach. Jämför element-för-element, inte gissa.
- [UNIVERSAL] **::after (position:absolute) målas ALLTID ovanpå barns outline/box-shadow.** Använd `border-left` för vertikala kanter istället för ::after — eliminerar z-order-problem helt.
- [UNIVERSAL] **Separatorer som behöver gå utanför elementets box:** Använd ::after med negativ `left`-position, inte negativ margin (som flyttar hela boxen och påverkar outline-position).
- [UNIVERSAL] **Fokus vs separator-konflikten:** `z-index:1` på `:focus-visible` + `visibility:hidden` på egen ::after-separator. Använd `:has()` för att dölja föregående elements separator.
- [UNIVERSAL] **Inga fallback-värden i `var()`.** `var(--fkds-color-border-weak, #e1e3e1)` döljer saknade tokens. Utan fallback syns felet direkt. Bevisat i 2 vyer.
- [UNIVERSAL] **Font-token-policy:** FK-token om den finns, hårdkodat med `/* TODO */`-kommentar om inte. Verifiera med grep innan byte — gissa aldrig tokennamn.
- [UNIVERSAL] **Elementbyten (div→button, a→button) kräver explicit CSS-reset.** appearance:none, border:none, margin:0, text-align:left, background:transparent, width:100%. Utan reset ändras visuellt utseende. Verifiera alltid pixel för pixel efter elementbyte.
- [UNIVERSAL] **inert-attribut på bakomliggande innehåll vid modala UI:n.** Säkrare än enbart focus trap — webbläsaren hanterar fokus, skärmläsare och klick. Behåll focus trap som fallback (~96% browserstöd).
- [UNIVERSAL] **Type-ahead i menyer: stöd flerkaraktärssökning + cykling + svenska tecken.** Buffert med 500ms timeout. Alla professionella komponentbibliotek har det.
- [UNIVERSAL] **Auditera befintliga komponenter INNAN nya byggs.** Bygg aldrig på en grund som inte möter standarden. Triage först (audit nu / efter ändring / infrastruktur / temporär), sedan auditera selektivt.
- [UNIVERSAL] **Batch-strategi för komponentförbättringar.** Dela upp i logiska batcher med verifiering (axe-core + screenshot) efter varje. Aldrig en megaprompt. AppMenu tog 8 batcher — varje verifierbar och reversibel.
- [UNIVERSAL] **Vue 3 känner inte igen `<search>` som HTML-element.** Det renderas som SVG (Lucide-ikonens Search-komponent tar över). Använd `<form role="search">` istället — universellt stöd, samma ARIA-semantik.
- [UNIVERSAL] **PointerEvent + setPointerCapture = mus + touch + pen i ETT API.** Behöver inte separata mousedown/touchstart-handlers. setPointerCapture fångar pointer till elementet — smooth drag även utanför handtaget. Bevisat i useResizable (session 25).
- [UNIVERSAL] **Kontrastgranskning med beräkningsskript FÖRE implementation.** Verifiera WCAG-kontrast med sRGB→luminance→ratio-beräkning i Python/JS innan du committar färgvärden. Session 25: alla amber-färger kontrastgranskade innan någon CSS skrevs.
- [UNIVERSAL] **Två-lagers designsystem: vacker default + prefers-contrast:more.** Default-läget optimerar för estetik (subtila vita overlays, tunnare borders). prefers-contrast:more förstärker ALLT (mörka overlays, tjockare borders, all-ink text, font-weight 700). Två separata uppsättningar — inte en kompromiss.
- [UNIVERSAL] **design-tokens.ts som central sanningskälla.** Alla hex-värden definieras i tokens.ts. CSS custom properties (--miranon-*) i main.scss speglar tokens.ts. Komponenter använder var(). TypeScript importerar direkt. Ändra ALDRIG ett hex-värde i CSS utan att uppdatera tokens.ts först.
- [UNIVERSAL] **Inter Display via variabel font opsz-axel (inget separat typsnitt).** Google Fonts `Inter:opsz,wght@14..32,300..700` + `font-variation-settings: "opsz" 32` på rubriker. En font-request, noll extra filer, automatisk Display-variant.
- [UNIVERSAL] **Fokusring-färg: välj en exklusiv färg som INTE används till något annat.** Session 25 valde #1B4965 (mörkblå) — ingen relation till amber, copper, info eller text. Exklusivitet förhindrar visuell förväxling och gör fokusringen igenkännbar.
- [UNIVERSAL] **Theme-override-test vid varje token-extraktion.** Byt tillfälligt till mörkt tema (3 tokens) och ta screenshot. Om det inte ändras → tokens refereras inte korrekt. Enkel verifiering som fångar missade hårdkodade värden.
- [UNIVERSAL] **"Beyond standard"-features skiljer 10 från 11.** Route announcer (aria-live), prefers-reduced-motion, prefers-contrast: more, print styles, inert — dessa bör vara standard i alla shell/layout-komponenter.
- [UNIVERSAL] **Batch-by-batch med verifiering mellan varje steg.** Förhindrar regressioner och behåller fokus. En batch = ett ansvarsområde = en commit. AppMenu (8 batcher) och AdminShell (7 batcher) bevisar att metoden fungerar.
- [UNIVERSAL] **Menyknapp ska alltid vara utanför header-end-slot.** Den styr menyöppning, fokusretur och inert — kärnfunktionalitet som aldrig ska bytas ut via slot.

- [UNIVERSAL] **Bygg composables INNAN komponenter.** Composable-lagret måste existera för att komponenter ska kunna komponeras. Bevisad ordning: grund (useId, useFocusStack) → primitiver (useFocusScope, useDismissable) → komponenter (MmDialog, MmDataTable). Att hoppa direkt till komponent-bygge utan primitiver ger monolitisk kod.
- [UNIVERSAL] **Research referensimplementation INNAN egen implementation.** Studera FK:s/Radix/Headless källkod, extrahera ARIA-mönster och fokushantering, bygg sedan eget. FK:s fokusstack, alertScreenReader och semantiska tabell-mönster portades och förbättrades — inte omuppfunna.
- [UNIVERSAL] **pushFocus FÖRE applyInert.** Ordningen spelar roll: om inert appliceras på siblings först kan `document.activeElement` redan ha blivit `<body>` (det aktiva elementet blev inert). Spara fokus FÖRST, sedan applicera inert.
- [UNIVERSAL] **Max 1-2 composable-integrationer per prompt till Claude Code.** Kvaliteten sjunker med promptlängd. Session 18: 2 composables per prompt gav hög kvalitet. Session 19: 1-2 composable-integrationer per batch fungerade. Fler → tänk-loop.
- [UNIVERSAL] **CLAUDE.md > 40k chars degraderar Claude Code-prestanda.** VS Code-extensionen kan loopa vid komplexa uppgifter — terminalen är mer stabil. Flagga med varning vid > 40k.
- [UNIVERSAL] **Skriv domänspecifika adapter-metoder (updateRegistration) som delegerar till generiska (updateRecord).** Ger typsäkerhet utan extra Edge Functions. Tabell-ID:n som konstanter, inte spridda i anropande kod.
- [UNIVERSAL] **Byt från anon key till session-token i Edge Function-anrop så tidigt som möjligt.** `getSession()` + `access_token`, fallback till anon key om ej inloggad. Extrahera `getAuthHeader()` som delad hjälpfunktion.
- [UNIVERSAL] **Vue 3.3+ `generic="T"` i script setup ger full typinferens till konsumenter utan explicit typparameter.** Använd det för alla bibliotekskomponenter som tar data-arrayer. `<script setup lang="ts" generic="T extends Record<string, unknown>">` + `defineProps<Props<T>>()`.
- [UNIVERSAL] **Skicka inte analysrapporter till Claude Code — ge planen, låt den läsa koden själv.** Analysrapporter triggar omplanering istället för handling. Bättre: "Läs fil X, gör ändring Y". Claude Code ska göra sin egen analys.
- [UNIVERSAL] **useTableFeatures-mönster — extrahera feature-logik till intern composable.** Komplex feature-logik (sort, selection, expand, keyboard) lever i en intern composable, vue-filen förblir template-fokuserad. MmDataTable.vue 296 rader, useTableFeatures.ts 334 rader — istället för en 600-raders monolitfil.
- [UNIVERSAL] **Nativa formulärelement (checkbox, radio) i tabeller.** Ger gratis tangentbordsstöd, AT-stöd och formulärsemantik utan custom-implementation. Nativt indeterminate-stöd. Inga extra ARIA-attribut krävs.
- [UNIVERSAL] **usePresence ersätter Vue `<Transition>` med bättre kontroll.** data-state-attribut + forced reflow (`void el.offsetHeight`) ger entry-animation. usePresence väntar på transitionend innan unmount. Ger data-attribut-baserad styling (CSS kan styla `[data-state="open"]`) utan Vue-specifika klasser.
- [UNIVERSAL] **Batch-uppgradering av befintlig komponent: läs → integrera → verifiera.** AppMenu 11/10/10 → 11/11/11 i 5 batcher med en composable-integration per batch. Varje batch: vue-tsc → commit. Aldrig allt på en gång.
- [UNIVERSAL] **Rundade hörn på items med border-left skapar problem.** border-radius: 0 10px 10px 0 löser det delvis, men separatorlinjer, expanderade grupper och sammanhängande border-left kräver fler specialfall. Raka kanter på nav-items är enklare — behåll rundning bara för fristående element (user-sektion, popups).
- [UNIVERSAL] **Scroll-track med pseudo-element — noll DOM-noder.** ::after = track, ::before = thumb. Position via CSS custom property --thumb-index. Kräver att all bakgrundsfärg sitter på button (inte li) med padding-right på li.
- [UNIVERSAL] **Sektionsfärg via color-mix istället för global active-bg.** `color-mix(in srgb, var(--section-border) 8%, transparent)` ger varje sektion sin egen highlight-nyans. Eliminerar amber-blinkar vid felaktiga overrides.
- [UNIVERSAL] **v-show → klassbaserad med max-height för smooth collapse.** v-show togglar display:none instant = layout-hopp. max-height: 500px + transition: 0.2s + overflow: hidden = smooth. Kräver ingen DOM-ändring.
- [UNIVERSAL] **Extrahera specialfall till egna element.** User-sektionen var sections[0] med showUserName-flagga. Eget element med egna props/CSS = renare, enklare att styla, inga index-beroenden.
- [UNIVERSAL] **Solid bakgrund på sidepanel äter kontrast.** Amber #FFBA05 gjorde kategori-färger osynliga. Ljus bakgrund + färgaccenter som border-left/highlight = bättre kontrast och läsbarhet.
- [UNIVERSAL] **Gap-analys mot research avslöjar blinda fläckar.** Research-rapport + konverteringsplan → systematisk granskning → 36 åtgärdspunkter + 11 tvärgående gap. Metoden: (1) bygg plan, (2) forska brett, (3) granska plan mot forskning, (4) integrera. Avslöjade att säkerhet, resilience och performance helt saknades.
- [UNIVERSAL] **Stale-while-error > "Något gick fel".** Visa senaste kända data med timestamp + "Vi försöker igen automatiskt" istället för tom skärm med felmeddelande. Lotta behöver aldrig se ingenting.
- **transitionend bubblar.** Barn-elements transitions kan trigga parent `transitionend`-listener. Lös med `event.target === el`-check i onEnd, eller bind presenceRef till rätt element. Bevisad i MmDialog (presenceRef → content).
- **pointerdown istället för click för dismiss.** Triggar före click → förhindrar att bakgrundselement interageras med. Hanterar drag-utanför korrekt (pointerdown inuti → mouseup utanför ≠ click-outside).
- **splice istället för pop i dismiss-stack.** Mellanlager kan avregistreras (tooltip stängs medan dialog är öppen). `splice(findIndex)` hanterar godtycklig ordning, `pop()` kräver strikt LIFO.

---

## Audit och kvalitetsprocess

> Lärdomar specifika för komponentaudits och kvalitetssäkring.

- [UNIVERSAL] **Theme-override-test vid varje token-extraktion.** Se ovan (Mönster som fungerar).
- [UNIVERSAL] **"Beyond standard"-features bör vara standard i alla layout-komponenter.** Route announcer, prefers-reduced-motion, prefers-contrast, print styles, inert.
- [UNIVERSAL] **Menyknapp utanför slot — kärnfunktionalitet skyddas.** Menyöppning, fokusretur, inert-hantering = kärnlogik som inte ska vara utbytbar.
- [UNIVERSAL] **Oberoende research med Code + Chat ger bättre resultat än endera ensam.** Code hittar tekniska risker (Radix underhåll, npm-data, bundle size). Chat driver designfilosofi (manifesto, scenariopoesi, sensorisk kalibrering). Jämförelsen producerar bättre beslut — teknisk pragmatism + designintention i samma stack-val.
- [UNIVERSAL] **Designfilosofi måste bäddas IN i prompts — inte bara refereras.** "Läs DESIGN-MANIFESTO.md" räcker inte. Scenariopoesi, orsakskedjor och beteendeprinciper ska stå direkt i prompten. Claude Code agerar annorlunda när Lottas rädslor finns i prompten jämfört med när de finns i en fil som "bör läsas".
- [UNIVERSAL] **Verklig användardata slår persona-antaganden.** Lottas rädslor (tappa bort information, inte förstå, tappa kontrollen, mer krångel) är verifierade — inte antagna. Prata med användaren. Skriv ner. Bädd in i varje designbeslut. Persona-abstraktioner ("icke-teknisk användare") ger slapp design. Konkreta rädslor ger skarpa beslut.
- [UNIVERSAL] **Designsystem behöver fyra skyddslager.** (1) Token-arkitektur gör fel svårt (primitiv → semantisk → komponent). (2) Tailwind-begränsning gör fel omöjligt (inga arbitrary values). (3) Lint-regler fångar drift (no-hardcoded-colors, no-arbitrary-value). (4) Visuell verifiering/design-audit fångar det regler inte kan (spacing-balans, typografisk hierarki, sensorisk koherens).
- [UNIVERSAL] **Separera filosofi från process.** Manifesto (vad vi tror) + Operating System (hur vi arbetar) fungerar bättre än ett hybriddokument. Manifestet ger riktning vid osäkerhet. Operating System ger reproducerbar kvalitet dag för dag. Ingen av dem ersätter den andra.

---

## Arkiv: Vue-projektets lärdomar (referens)

> Poster nedan är från Vue-projektet (`~/Repon/miranon-media-os/`). Relevanta som referens vid konvertering men inte direkt tillämpliga på React-bygget. Bevarade för att inte tappa kontext kring varför vissa beslut togs i Vue-bygget.

### FK Designsystem (Vue 3)

- Sass `!default` palette-override fungerar INTE med `@use`. Override semantiska CSS custom properties (`--fkds-*`) i `:root` EFTER FK:s tema istället. Enklare och mer robust.
- FK:s 54 Vue-komponenter har CSS i separata SCSS-filer (`packages/design/src/components/`). Dessa kan studeras oberoende av Vue-koden och kopieras till valfritt ramverk.
- FK:s focus-ring är `box-shadow`, inte `outline` eller `border`. Värde: `0 0 0 2px white, 0 0 0 4px focus-color, 0 0 0 6px white`. Variabel: `--f-focus-box-shadow`. Fokus-färgen i FK: `$palette-color-fk-black-100` (#1b1e23). Vår override: sage (#6B7050).
- FK:s aktiva menyrad på live-sajten har INGEN outline/border-ram — bara `background-color` (kategorispecifik) + `.fkBold` (bold text) + `a::after` (4px vänsterkant). Den "mörkgråa ramen" var DevTools element-highlight, inte CSS.
- [PROJEKT] FK:s meny har tunna 1px separatorer, vit kategori-bakgrund, normal font-weight — inte bold headers eller tjocka separatorer.

### Vue 3-specifikt

- Vue `provide/inject`: providern MÅSTE köras i en parent INNAN barnet anropar inject. Ordningen spelar roll — annars kraschar appen med "No adapter provided".
- `onMounted` i composables med singleton-pattern (initialized-flagga) skapar race conditions med router guards. Initiera auth direkt vid modulimport istället.
- Vue SFC med >300 rader: bryt ut CSS till separat `.css`-fil och referera med `<style src="./Komponent.css" />`. Håller SFC-filen fokuserad på logik+template.
- FK:s FNavigationMenu är en platt lista (bara label+route) — den driver INTE deras "Mina sidor"-meny. Deras meny är ren HTML+CSS med kategori-klasser. Lärdom: läs inte bara komponent-props — inspektera den faktiska sajten.
- [PROJEKT] Dual `<script>` + `<script setup>` krävs i Vue 3 när `defineProps` behöver referera exporterade konstanter. `defineProps()` hoistas utanför `setup()` — lokala variabler är inte tillgängliga.

### Vue/CSS-detaljer

- **FMessageBox renderar intern h2.** Placera alltid h1 OVANFÖR FMessageBox i DOM-ordningen, annars bryts rubrikhierarkin.
- `box-shadow` på `<a>` inuti `<li>` med `position: relative` klipps av angränsande syskon-element (varje `<li>` skapar egen stacking context). Lösning: ta bort `position: relative` från `<li>`, eller (bättre) byt till `<div>` header-mönster utanför listan.

### Vue-projektets designval

- [PROJEKT] Global sage ändrad till #606B57 (mörkare, mer dämpat). User-sektion hover: #D4DBCC.
- [PROJEKT] Typewriter-effekt i brand-header: 500ms fördröjning, 40-80ms per tecken (varierat), cursor blinkar 3x, text fadar ut 0.8s. prefers-reduced-motion: visa direkt.
- [PROJEKT] Meny default-bredd beräknas dynamiskt: (100vw - contentMaxWidth) / 2 + contentPadding. Möter contentytan kant-i-kant. useResizable behållen för manuell justering.

### Ändringslogg (Vue-projektet, 2026-03-19 → 2026-04-07)

> Automatisk logg av när lärdomar lades till under Vue-bygget.
> Format: datum | kategori | kort beskrivning

| Datum | Kategori | Lärdom |
|-------|----------|--------|
| 2026-03-19 | Arbetsflöde | Claude Code-prompts ska ange fullständig sökväg |
| 2026-03-19 | Airtable | Rollup-filtrering: använd inbyggt filter, inte IF inuti formel |
| 2026-03-19 | Arbetsflöde | Projektkunskap kan inte indexera filer > 5000 rader |
| 2026-03-19 | Mönster | Extrahera komponenter från monoliter före designarbete |
| 2026-03-19 | Mönster | Dubbel granskningsrunda fångar olika problemtyper |
| 2026-03-19 | Arbetsflöde | Sessionsavslut: gå igenom hela checklistan, inte bara CLAUDE.md |
| 2026-03-30 | FK Designsystem | FNavigationMenu passar inte för vertikal sidebar — bygg FK-inspirerat |
| 2026-03-30 | FK Designsystem | Sass !default fungerar inte med @use — override CSS custom properties istället |
| 2026-03-30 | Vue 3 | provide/inject: provider måste köras i parent innan inject i child |
| 2026-03-30 | Vue 3 | onMounted i singleton-composables → race conditions. Initiera vid modulimport |
| 2026-03-30 | Supabase | Edge Functions som Airtable-proxy: bevisat robust mönster |
| 2026-03-30 | Supabase | supabase.functions.invoke skickar POST, inte GET. Använd fetch() för query params |
| 2026-03-30 | Design | Status-enums: verifiera alltid mot MCP live-data, gissa aldrig |
| 2026-03-30 | Mönster | Spike-driven utveckling: testa ny stack minimalt innan commit |
| 2026-03-30 | Mönster | Använd tredjepartskomponenter rakt av först — iterera sedan |
| 2026-03-30 | FK Designsystem | FNavigationMenu saknar grupper/ikoner/expand — bekräftat via typdefinitioner |
| 2026-03-30 | Vue 3 | Bryt ut CSS till separat fil vid >300 rader i SFC |
| 2026-03-30 | FK Designsystem | FNavigationMenu driver INTE FK:s "Mina sidor"-meny — den är ren HTML+CSS |
| 2026-03-30 | Arbetsflöde | Chrome DevTools mot live-sajt > repo/dokumentation för att förstå implementation |
| 2026-03-30 | Mönster | Inspektera referensimplementation live — DevTools > dokumentation |
| 2026-03-30 | Mönster | "Funkar inte" kräver bevis — undersök kombinationer innan du bygger eget |
| 2026-03-31 | Arbetsflöde | TA ALDRIG BORT FK-komponenter för att felsöka — felsök VARFÖR den kraschar |
| 2026-03-31 | Arbetsflöde | Bygg alltid generiska arkitekturer — EN MenuSection-modell sparade 10+ iterationer |
| 2026-03-31 | Arbetsflöde | Patcha inte buggar individuellt — identifiera fungerande mönster och kopiera |
| 2026-03-31 | FK Designsystem | FK:s focus-ring = box-shadow, inte outline. --f-focus-box-shadow med 3 lager |
| 2026-03-31 | CSS | box-shadow klipps av sibling li med position:relative — ta bort eller byt till div-header |
| 2026-03-31 | FK Designsystem | FK:s aktiva menyrad har ingen ram — bara bakgrundsfärg + bold + a::after vänsterkant |
| 2026-04-01 | Arbetsflöde | A11Y-dokument ska finnas INNAN byggfasen — 13 problem i V0–V7 hade undvikits |
| 2026-04-01 | Arbetsflöde | Stora Code-prompts (audit+fix+commit): dela upp i Del 1/2/3 |
| 2026-04-01 | Tillgänglighet | Egna komponenter behöver explicit ARIA-granskning — FK ger det gratis, eget bygge gör det inte |
| 2026-04-01 | Tillgänglighet | prefers-reduced-motion måste respekteras på ALLA animationer |
| 2026-04-01 | Tillgänglighet | Ny regel: ingen ny vy förrän Lighthouse ≥ 95 och axe 0 critical/serious |
| 2026-04-01 | CSS | [UNIVERSAL] Eliminering slår sökning — display:none efter 10 min, inte 40 |
| 2026-04-01 | CSS | [UNIVERSAL] Pipett → hex → grep hittar saker selector-matching missar |
| 2026-04-01 | CSS | [UNIVERSAL] getComputedStyle() fångar inte pseudo-element — använd getComputedStyle(el, '::after') |
| 2026-04-01 | CSS | [UNIVERSAL] Outline + ::after måste leva på SAMMA element. Annars täcker ::after outlinen |
| 2026-04-01 | CSS | [UNIVERSAL] position:static-tricket: static på barn + relative på förälder = barnets ::after spänner föräldern |
| 2026-04-01 | FK | FK:s globala _focus.scss ([tabindex]:focus) sätter box-shadow — overrida med !important |
| 2026-04-01 | DevTools | copy() fungerar inte i async/promise — använd console.log() |
| 2026-04-01 | CSS | [UNIVERSAL] ::after (position:absolute) målas ovanpå barns outline — använd border-left |
| 2026-04-01 | CSS | [UNIVERSAL] Separatorer utanför box: ::after med negativ left, inte negativ margin |
| 2026-04-01 | CSS | [UNIVERSAL] Fokus vs separator: z-index:1 + visibility:hidden + :has() |
| 2026-04-01 | FK | FK:s meny: tunna 1px separatorer, vit bakgrund, normal font-weight |
| 2026-04-01 | Design | Global sage: #6B7050 → #606B57, user-sektion hover: #D4DBCC |
| 2026-04-02 | Arbetsflöde | [UNIVERSAL] 3-delad komponentaudit (a11y/teknik/återanvändbarhet) med 9/10 minimum |
| 2026-04-02 | CSS | [UNIVERSAL] Elementbyten kräver explicit CSS-reset (appearance, border, margin, text-align, bg, width) |
| 2026-04-02 | Tillgänglighet | [UNIVERSAL] inert-attribut på bakomliggande innehåll vid modala UI:n |
| 2026-04-02 | Tillgänglighet | [UNIVERSAL] Type-ahead i menyer: flerkaraktär + cykling + svenska tecken |
| 2026-04-02 | Arbetsflöde | [UNIVERSAL] Auditera befintliga komponenter INNAN nya byggs |
| 2026-04-02 | Arbetsflöde | [UNIVERSAL] Batch-strategi: logiska batcher med verifiering efter varje |
| 2026-04-03 | Vue 3 | [UNIVERSAL] `<search>` renderas som SVG i Vue 3 (Lucide Search tar över) — använd `<form role="search">` |
| 2026-04-03 | Audit | [UNIVERSAL] Theme-override-test vid token-extraktion — mörkt tema → screenshot → verifiera |
| 2026-04-03 | Audit | [UNIVERSAL] Beyond-standard features (announcer, reduced-motion, contrast, print) bör vara standard |
| 2026-04-03 | Audit | [UNIVERSAL] Batch-by-batch: en batch = ett ansvar = en commit. AdminShell 7 batcher → 10/10/10 |
| 2026-04-03 | Audit | [UNIVERSAL] Menyknapp utanför slot — kärnfunktionalitet (inert, fokusretur) skyddas |
| 2026-04-03 | Vue 3 | [UNIVERSAL] Eliminera mellanliggande computed-lager — direkta uttryck renare i Vue 3 |
| 2026-04-03 | CSS | [UNIVERSAL] Specificitetsnästling (.parent .child) slår !important — enklare och underhållbart |
| 2026-04-03 | Arkitektur | [UNIVERSAL] Referens ≠ beroende — studera källkod, bygg eget, ger bättre resultat än import+wrap |
| 2026-04-03 | Arkitektur | [UNIVERSAL] Bygg bibliotek, inte bara app — varje komponent ska kunna återanvändas utan ändringar |
| 2026-04-03 | Arkitektur | [UNIVERSAL] 11/11/11 för bibliotek, 11/10/10 för vyer — differentierad kvalitetsribba |
| 2026-04-03 | Arkitektur | [UNIVERSAL] Härleda aldrig slicad data som om den vore komplett — kommandeEvent (top 5) ≠ alla |
| 2026-04-03 | Arkitektur | [UNIVERSAL] Viewmodel-composable per vy — affärslogik i composable, vy gör bara layout |
| 2026-04-03 | Arkitektur | [UNIVERSAL] Delade composables framför duplicering — useDashboardData + useUserDisplayName |
| 2026-04-03 | CSS | [UNIVERSAL] Inga fallback-värden i var() — döljer saknade tokens |
| 2026-04-03 | CSS | [UNIVERSAL] Font-token-policy — FK-token om den finns, kommentar om inte |
| 2026-04-03 | Tillgänglighet | Breadcrumbs: nav + ol + aria-current + underline |
| 2026-04-03 | Tillgänglighet | Kort som article med h2 — inte div |
| 2026-04-03 | Tillgänglighet | FMessageBox renderar h2 — placera h1 ovanför i DOM |
| 2026-04-03 | Tillgänglighet | [UNIVERSAL] Nativ HTML-element framför ARIA-roller — button ger Enter/Space/focus gratis |
| 2026-04-03 | Tillgänglighet | [UNIVERSAL] aria-label med faktiskt värde, inte animerat — skärmläsare ska få riktiga talet |
| 2026-04-03 | Vue 3 | [UNIVERSAL] cancelAnimationFrame vid unmount OCH target-ändring — annars stale ref |
| 2026-04-03 | Arkitektur | [UNIVERSAL] Skeleton-komponenter ska ha props för antal element — hårdkodad layout = 0% reuse |
| 2026-04-03 | CSS | [UNIVERSAL] Duplicerad CSS mellan sibling-komponenter — extrahera till delad fil omedelbart |
| 2026-04-03 | FK Designsystem | [UNIVERSAL] FK använder "negative" inte "error" för feedback-tokens — verifiera alltid mot fkui.css |
| 2026-04-03 | CSS | [UNIVERSAL] var()-fallbacks maskerar saknade tokens — ska synas som visuellt fel, inte tyst fallbacka |
| 2026-04-03 | Vue 3 | [PROJEKT] Dual script + script setup krävs när defineProps refererar exporterade konstanter |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] Auditprompter ska specificera output-fil — annars skrivs rapporten i terminalen |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] Gruppaudit av siblings avslöjar duplicering som enskilda audits missar |
| 2026-04-03 | Arkitektur | [UNIVERSAL] Bygg composables INNAN komponenter — grund → primitiver → komponenter |
| 2026-04-03 | Arkitektur | [UNIVERSAL] Research referensimplementation INNAN egen — studera FK/Radix, portera mönster |
| 2026-04-03 | Tillgänglighet | [UNIVERSAL] pushFocus FÖRE applyInert — annars activeElement → body |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] Max 2 composables per Claude Code-prompt — kvalitet sjunker med längd |
| 2026-04-03 | Arkitektur | [UNIVERSAL] useTableFeatures-mönster — extrahera feature-logik till intern composable |
| 2026-04-03 | Tillgänglighet | [UNIVERSAL] Nativa checkbox/radio i tabeller — gratis AT-stöd, tangentbord, indeterminate |
| 2026-04-03 | Vue 3 | transitionend bubblar — lös med event.target === el check |
| 2026-04-03 | CSS | pointerdown istället för click för dismiss — triggar före, hanterar drag |
| 2026-04-03 | Arkitektur | splice istället för pop i dismiss-stack — mellanlager kan försvinna |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] CLAUDE.md >40k chars degraderar Claude Code — VS Code looper, terminal stabilare |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] Skicka inte analysrapporter till Claude Code — ge planen, låt den läsa |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] Max 1-2 composable-integrationer per prompt — annars tänk-loop |
| 2026-04-03 | Vue 3 | [UNIVERSAL] usePresence ersätter Vue Transition — data-state + forced reflow + transitionend |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] Batch-uppgradering: en composable per batch, vue-tsc + commit varje gång |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] Inventera INNAN du granskar — `find` först, analysera sedan. Session 13:s inventering (16 filer) var inaktuell efter 7 sessioner (44 filer). Gammal inventering ger falskt förtroende. |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] Infrastruktur-granskning ska täcka ALLA icke-komponent-filer — inte bara de som fanns vid förra inventeringen. |
| 2026-04-03 | Arkitektur | [PROJEKT] AdminShell: useControllable för open-state ger v-model:open gratis — 0 extra rader för konsumenten. |
| 2026-04-03 | Arkitektur | [PROJEKT] alertScreenReader ersätter manuella announcer-divar — sparar ~20 rader per komponent och centraliserar skärmläsar-logiken. |
| 2026-04-03 | Säkerhet | [UNIVERSAL] Edge Functions med anon key = ingen användarverifiering serverside. Byt till session-token (JWT) så tidigt som möjligt. |
| 2026-04-03 | Arkitektur | [UNIVERSAL] Adapter-interface ska utökas just-in-time per vy — men specen ska vara komplett i arkitekturdokumentet. |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] Spara detaljerad sessionsplan som egen fil (docs/SESSION-X-PLAN.md) — todo.md-rader räcker inte för att återskapa kontext nästa session. |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] **Stanna upp och revidera planen innan stor fas.** Session 22 stannade upp innan V8a för att jämföra Marcus nya tänk med befintlig plan — hittade 3 saknade scenarier, en ny menystruktur, och terminologi som inte matchade användarens språk. Hade vi kört rakt in i V8a hade vi byggt fel saker. |
| 2026-04-03 | Design | [UNIVERSAL] **Skriv menyer och navigation med användarens ord, inte tekniktermer.** "Deltagare" istället för "Personregister", "Intresserade" istället för "Leads", ingen rubrik där ingen behövs. Fråga: "Pratar denna meny Lottas språk?" |
| 2026-04-03 | Design | [PROJEKT] Eventläge och Närvaro nås inifrån Event-listan som flikar — inte som egna menyval. Färre menyval = enklare. |
| 2026-04-03 | Design | [PROJEKT] Deltagare = personer med minst ett deltagande. Intresserade = personer utan deltaganden men med leads/touchpoints. Lottas mentala modell, inte databastabeller. |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] **Interaktivt formulär för beslut sparar tid.** 20 beslutspunkter avklarade på några minuter istället för diskussion fram och tillbaka. React-artifact med sendPrompt() för att skicka tillbaka svaren. |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] **Allt som flaggas i chatten måste in i dokumenten.** Om det inte står i CLAUDE.md, todo.md, lessons.md eller byggplanen så existerar det inte nästa session. Chatten är flyktigt minne. |
| 2026-04-03 | Arkitektur | [UNIVERSAL] **Gör label valfri, inte dold.** Istället för showLabel: false → gör label optional i interfacet. Ingen label = ingen header renderas. Renare API, inget dolt state. |
| 2026-04-03 | CSS | [UNIVERSAL] **Border per rad, inte per wrapper.** Left-border på wrappern ger EN sammanhängande linje. Flytta till varje barn (header + li) → separata segment med gap. Mycket mer professionellt. |
| 2026-04-03 | CSS | [UNIVERSAL] **Transitions under 100ms upplevs som omedelbara.** 0.15s på bakgrund/border skapar lagg-känsla. 0.08s är snapp men inte abrupt. Panel-slide (0.35s) behåller mjukhet. |
| 2026-04-03 | CSS | [UNIVERSAL] **Kopiera FK:s exakta värden via källkoden.** Gissa aldrig CSS-värden — grep i node_modules/@fkui/ ger exakta text-decoration-thickness, text-underline-offset etc. |
| 2026-04-03 | Design | [PROJEKT] Vardagsgruppen (läge C) visar grupperad left-border på alla items när någon är aktiv. Skapar visuell grupptillhörighet utan header. |
| 2026-04-03 | Design | [PROJEKT] 6 sektioner × 6 kategorifärger: sage, daily (=sage), people (copper), comm (blå), stats (brons), more (grå). |
| 2026-04-03 | Vue 3 | [UNIVERSAL] **Vue 3 boolean-castar frånvarande boolean-props till false, inte undefined.** Detta bryter `value !== undefined`-detektering för controlled/uncontrolled mode. Lösning: `getCurrentInstance().vnode.props` innehåller bara explicit skickade props — kolla där. Hantera BÅDE camelCase och kebab-case. |
| 2026-04-03 | Arbetsflöde | [UNIVERSAL] **Claude Code Effort = High som default.** Medium bara för triviala uppgifter (textbyten, grep, enkla kommandon). Allt som involverar felsökning, arkitektur eller flera filer kräver High. Medium i 22 sessioner ledde till fler iterationer och efterarbete. |
| 2026-04-03 | Arkitektur | [UNIVERSAL] **En enda källa per konfiguration — dubblering är en bugg.** props+key-API:t i useControllable eliminerar möjligheten att propName och modelValue hamnar ur synk. Om två värden alltid måste matcha, härled det ena från det andra. |
| 2026-04-04 | CSS | [UNIVERSAL] **FK:s globala CSS skapar mer problem än den löser när man byggt egna komponenter.** Tre lager fokusregler som krockade (FK :focus, Miranon override, komponent :focus-visible). Lösning: ta bort FK:s CSS helt, behåll paketen som referens. -81 rader, EN ren fokusregel. |
| 2026-04-04 | CSS | [UNIVERSAL] **En enda global fokusregel räcker.** `*:focus:not(:focus-visible) { outline: none }` + `*:focus-visible { outline: 2px solid }`. Inga per-komponent-regler, inga !important. Outline följer border-radius i moderna browsers. |
| 2026-04-04 | CSS | [UNIVERSAL] **Sökfält med input + knapp: fokusring på wrapper via :focus-within.** Input och knapp får outline: none, wrappern visar EN fokusring runt hela gruppen. |
| 2026-04-04 | Layout | [UNIVERSAL] **Content i centrerad kolumn med max-width ger Word-dokument-känsla.** Grå bakgrund + vit kolumn + header-innehåll alignerat med kolumnens kanter. CSS custom properties (--content-max-width, --content-padding-x) delas mellan header och content. |
| 2026-04-04 | Arbetsflöde | [UNIVERSAL] **Teoretisk CSS-analys bevisar ingenting.** "Browsern ljuger aldrig, koden ljuger ibland." Code rapporterade 9/9 OK baserat på CSS-analys — verkligheten visade 4 buggar. Kräv alltid visuell verifiering. |
| 2026-04-04 | Arbetsflöde | [UNIVERSAL] **Lappa inte fokusregler — riv och bygg en regel.** Tre rundor av lappning gjorde det värre varje gång. Ett proffs river allt och lägger EN global regel. |
| 2026-04-04 | Design | [PROJEKT] Airtable-stil meny-header: Leaf-ikon + brand-namn i klickbar pill med hover-highlight + ChevronDown + dropdown. |
| 2026-04-04 | Design | [PROJEKT] Favicon: logga på vit bakgrund med rundade hörn (rx/ry 20% av viewBox), logga skalad till 75%. |
| 2026-04-05 | Arbetsflöde | [UNIVERSAL] Code + Chat oberoende research → bättre stack-beslut |
| 2026-04-05 | Arbetsflöde | [UNIVERSAL] Designfilosofi direkt i prompts — inte bara refererad fil |
| 2026-04-05 | Design | [UNIVERSAL] Verklig användardata (Lottas rädslor) slår persona-antaganden |
| 2026-04-05 | Arkitektur | [UNIVERSAL] Designsystem: 4 skyddslager (tokens → Tailwind → lint → visuell audit) |
| 2026-04-05 | Arbetsflöde | [UNIVERSAL] Separera filosofi (Manifesto) från process (Operating System) |
| 2026-04-05 | Arbetsflöde | [UNIVERSAL] **Påstå aldrig att ett verktyg är trasigt baserat på gammal dokumentation.** Lessons.md dokumenterade ett problem med 21st.dev från mars 2026. Claude Chat påstod att verktyget var trasigt — Marcus korrigerade. Verifiera aktuell status innan du uttalar dig. |
| 2026-04-05 | Design | [UNIVERSAL] **Skriv designfilosofi tidigt — men verifiera att implementationen följer den.** Miranon Admin hade en scenariopoesi som beskrev "Hej Lotta + 3 val + 4 sekunder". Sedan byggdes en sidebar med 6 sektioner, typewriter, scroll-track och resize. Referensbilder (FK-app) hade tvingat fram rätt design från start. |
| 2026-04-05 | Design | [UNIVERSAL] **Förenklad design ≠ förenklad kvalitet.** FK:s app har noll animation och noll effekter men extremt genomtänkt tillgänglighet. 11/11/11 gäller oavsett hur avskalad designen är. |
| 2026-04-05 | Process | [UNIVERSAL] **Arkivera alltid före omskrivning.** Innan conversion-plan v2 skrevs kopierades v1 till conversion-plan-v1-sidebar.md och committades separat. Originalet finns alltid kvar. |
| 2026-04-07 | Arkitektur | [UNIVERSAL] **Säkerhet, performance och resilience är infrastruktur — inte polish.** CSP, error boundaries, retry-logik, performance-budget och service workers ska finnas från Fas 0. Gap-analysen (2026-04-06) avslöjade att tre hela forskningskapitel (säkerhet, resilience, performance) var helt frånvarande i planen. |
| 2026-04-07 | Arkitektur | [UNIVERSAL] **Mät eller det existerar inte.** Utan web-vitals i produktion, Sentry/Faro för errors, och strukturerad loggning med trace-ID — flyger du blint. Lighthouse i dev ≠ verklighet. RUM är obligatoriskt. |
| 2026-04-07 | Arkitektur | [UNIVERSAL] **Validera vid systemgränser.** Zod-schema på alla externa API-svar (Airtable, Supabase). TypeScript-typer är compile-time — runtime-fel kräver runtime-validering. |
| 2026-04-07 | Design | [UNIVERSAL] **"Den osynliga skillnaden" — fem kvaliteter som skiljer bra från magi.** (1) Omedelbarhet: data redan där (SW + staleTime). (2) Kontinuitet: navigering som "flytta fokus" (View Transitions). (3) Transparens: systemet bevisar sig ("0 tappade"). (4) Odödlighet: appen dör aldrig (offline → stale data). (5) Profetia: appen vet vad du ska göra (Speculation Rules + prefetch). |
| 2026-04-07 | Arbetsflöde | [UNIVERSAL] **Dokument-driven development: skriv specen före koden.** 7 spec-dokument (SECURITY-SPEC, PERFORMANCE-BUDGET, STATE-STRATEGY, URL-STATE-SPEC, ARIA-UPGRADE, FUTURE-COMPAT, SPA-ARCHITECTURE-DECISION) skapades INNAN implementation. Varje arkitekturbeslut ska ha ett hem. |
| 2026-04-07 | Arbetsflöde | [PROJEKT] **CLAUDE.md ska ha en ## Filstruktur-sektion som uppdateras vid sessionsavslut.** Claude Chat kan inte lista filer — utan fillista är Chat blind för filer den inte vet om. Kostar 5 sekunder, förhindrar att Chat missar styrande dokument. |
| 2026-04-07 | Arbetsflöde | [PROJEKT] **Migreringsplaner ska inventera ALLA filer — inte bara src/.** Conversion-plan missade docs/ (16 spec-dokument), CLAUDE.md, tasks/, .claude/ och supabase/. Styrfilerna är viktigare än koden. |
| 2026-04-07 | Arbetsflöde | [UNIVERSAL] **Skriv en lättläst version av tekniska planer.** Tekniska konverteringsplaner är obegripliga för icke-tekniska intressenter. En "byggplan" som förklarar varje fas med metaforer, "vad du märker"-sektioner och ordförklaringar bygger förtroende och förankring. Skriv den TILL personen, inte OM personen. |

---

## 2026-05-06 — Pre-Fas-2-verifiering (Session 3)

> Källa: `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md` (Pre-Fas-2-verifiering inför Fas 2 Routing+Auth).
> Sub-klungor: K1 (sessionsdok + Code-RAPPORTERA), K2 (klassificering + åtgärdsplan), K3 åa-åf + åg (åtgärds-implementation över 8 sub-klungor + 17 commits), K4 (denna lärdomslyft).
> Antal poster: 14, alla UNIVERSAL.
> Lyft till hub: 2026-05-06 (samma session, K4b).

- [UNIVERSAL] **Senior AI tar tekniska beslut, frågar inte**
  Symptom: AI-aktör frågar Marcus välja mellan tekniska implementations-alternativ när all data för beslut finns. Frågar multiplicerar Marcus' kognitiva belastning och outsourcar ansvaret. Generaliserbar regel: skilj *preferensfrågor* (vad vill du?) som ska frågas från *beslutsfrågor* (vad är rätt?) som ska beslutas. När data finns → besluta. När data saknas → samla först, sedan besluta. Källa: P3b K4 Lighthouse-design-iteration 2026-05-05; bekräftad i Pre-Fas-2 K2 där Chat fattade alla tekniska beslut själv (K2.1 MAXAT-tolkning, K2.2 INTE MAXAT, K2.3 analys-flyttning, K2.4 BYGGPLAN-LÄTTLÄST v1, K2.5 features/, K2.6 engines, K2.7 licens).

- [UNIVERSAL] **DoD-formulering ska skilja "körda" från "definierade" tester**
  Symptom: DoD säger "113 tester (förväntat)". Verifiering visar 72 passed + 41 skipped = 113. Skenbar diskrepans skapar förvirring. Generaliserbar regel: när en testsvit innehåller villkorligt skipped tester (staging-only, OS-specifika, env-beroende) ska DoD specificera "X körda lokalt + Y skipped under villkor Z" istället för "N passed". Annars uppstår skenbar regression vid lokal verifiering. Exempel: "113 tester totalt — 72 körda lokalt + 41 skipped (staging-only, kräver staging-credentials)". Källa: P3b K4 commit 5 verifierings-rapport 2026-05-05.

- [UNIVERSAL] **Inline-källor i Code-prompter när sessionsdok-disciplin förbjuder löpande uppdatering**
  Symptom: Chat refererar "Del 3.2 i sessionsdoket" som källa i Code-prompt. Code stoppar vid körning eftersom sessionsdoket vid den tidpunkten är K1-skelett (per P3a-mönstret bakas innehåll in först i K-sista). Generaliserbar regel: när sessionsdok-disciplin innebär att doket inte uppdateras under arbetets gång (K1 skelett + K-sista bakar in), måste innehåll som behövs i Code-prompter levereras INLINE i prompten — inte refereras från sessionsdoket. Sessionsdoket är retrospektiv referens, inte källa under körning. Källa: P3b K2 v1→v2-felet 2026-05-05; tillämpat genomgående i Pre-Fas-2 utan repris av problemet.

- [UNIVERSAL] **Chat-prompter ska skilja "projektkunskap" från "Code-filsystem"**
  Symptom: Sessionsstart-prompt säger "läs CLAUDE.md via view-verktyget" men listar sedan "(Chat-projektkunskap)". I Chat-gränssnittet finns filerna bara som projektkunskap; `view` är ett `/mnt/`-sandbox-verktyg, inte ett filsystem-verktyg mot `~/Repon/...`. Generaliserbar regel: prompter som går till Chat ska specificera projektkunskap-sökning; prompter som går till Code ska specificera `view`/`bash` mot lokala paths. Käll-nivån ska anges explicit per mottagare — inte blandas. Källa: Pre-Fas-2 sessionsstart 2026-05-06.

- [UNIVERSAL] **Code:s K1.B-rapport ska flagga befintliga sektioner som kolliderar, inte bara frånvaro**
  Symptom: K1.B-rapport sade "README saknar Documentation map". Vid K3 åd-implementation upptäcks att README *redan* hade en `## Dokumentation`-sektion (rad 46) som koliderade med planerat tillägg. K1.B hade fångat frånvaron men inte kollisionen. Generaliserbar regel: pre-skanning av filer som ska modifieras ska rapportera *både* "vad saknas" och "vilka befintliga sektioner finns och vad innehåller de". Frånvaro-rapportering ensam ger falsk säkerhet vid implementation. Källa: Pre-Fas-2 K3 åd README-kollision 2026-05-06.

- [UNIVERSAL] **Broken-ref-räkning ≠ sträng-räkning. K1.B ska klargöra vilken sort som rapporteras**
  Symptom: K1.B Block 5.1 räknade "5+1=6 conversion-plan-refs i styrande filer". K2 tolkade det som "alla strängförekomster". Vid K3 åe-implementation visade sig räkningen vara *broken refs* (refs som pekar på filer som inte finns på den platsen) — alla strängförekomster var 28+. Generaliserbar regel: ref-skanning ska explicit kategorisera "broken klickbara links", "broken backtick-paths", "text-mentions där pathen är del av semantik" och "historiskt korrekta path-citat". Räkning per kategori, aldrig en total siffra. Källa: Pre-Fas-2 K3 åe commit 2 första STOP 2026-05-06.

- [UNIVERSAL] **ADR ska dokumentera fix-disciplin OCH skip-disciplin när skips är aktiva val**
  Symptom: ADR dokumenterar typiskt vad som åtgärdats men inte vad som *medvetet inte* åtgärdats. När skip är ett aktivt val (t.ex. "denna ref ska INTE fixas pga arkiv-disciplin") försvinner motiveringen i framtida läsning. Generaliserbar regel: ADR med skip-beslut ska ha explicit `Skip-disciplin`-sektion som listar vad som inte fixades och varför, lika rigoröst som fix-listan. "Att inte fixa allt mekaniskt är ett aktivt val som skyddar trail-integritet och historisk korrekthet" är hela poängen — den måste skrivas ut. Källa: ADR-021 Skip-disciplin-sektion (Pre-Fas-2 K3 åe commit 2 andra STOP 2026-05-06).

- [UNIVERSAL] **Bred sed-pass är farlig på filer som beskriver sina egna refs**
  Symptom: Mekanisk sed-pass `s|docs/conversion-plan.md|docs/archive/conversion-plan-2026-04-14.md|g` på alla `*.md` skapade nonsens-rader i `docs/byggplan.md` ("X arkiveras till X") och semantisk drift i `tasks/byggplan-direktiv.md` ("byggplanen ersätter arkiv-versionen" istället för "ersätter levande conversion-plan"). Generaliserbar regel: när en fil refererar till en annan i historisk-relationskontext ("ersätter X", "föregångare X", "arkiveras till X") är path-strängen *del av semantiken*, inte en pekare. Per-rad-analys är default för styrande filer. Backtick-path = path-citat ≠ länk. Källa: Pre-Fas-2 K3 åe commit 2 backsteg + per-rad-skanning 2026-05-06.

- [UNIVERSAL] **Skanning vid struktur-omflyttning ska upptäcka relativa refs i grannfält**
  Symptom: Bred sed-pass på `docs/<fil>.md`-mönster fångade absolut-paths men missade relativa refs (`../<fil>.md`) i grann-mappar. Konkret: `docs/decisions/README.md:52` hade `[gap-analysis.md](../gap-analysis.md)` som blev broken efter `gap-analysis.md` flyttades till `docs/logs/`. Sed:en exkluderade decisions/-mappen pga ADR-disciplin men missade README:n där. Generaliserbar regel: vid struktur-omflyttningar — vid varje destinationsmapp, kontrollera om grannmappars filer har relativa refs som behöver uppdateras separat. `find . -name "*.md" -exec grep -l "../<gammal-path>"` är checken. Källa: Pre-Fas-2 K3 åe commit 2 (Code-fångad bonus-fynd) 2026-05-06.

- [UNIVERSAL] **Skip-disciplinen är inte binär — den har tre kategorier**
  Symptom: Skip vs fix tolkades som binärt val. Vid K3 åf upptäcktes en tredje kategori. Generaliserbar regel: vid mekanisk pass på flyttade filer, klassificera refs i tre kategorier — (1) **Relationskontext** ("ersätter X", "föregångare X") där substitution förvränger semantik = SKIP; (2) **Källhänvisning** ("se rad N i Y", `[fil](path)`) där substitution bevarar exakt intention = FIX mekaniskt; (3) **Beskrivning av flytt** ("X flyttad till Y") där substitution skapar nonsens = SKIP. Före mekanisk pass: kör relations-stickprov med fras-grep "ersätter|föregångare|fortsättning|tidigare|ursprungligen|innan" intill path-refs. 0 träffar → kategori 2 säker. Träffar → per-rad-bedömning. Källa: Pre-Fas-2 K3 åf D-strategi-beslut 2026-05-06.

- [UNIVERSAL] **Code:s pre-skanning ska visa fullständigt fil-innehåll för styrande filer**
  Symptom: Code rapporterade `grep -nE "Filstruktur" CLAUDE.md` istället för `cat CLAUDE.md` när styrande fil skulle modifieras. Det skapade falsk avgränsning av scope — Marcus + Chat hade ingen visibilitet i resten av CLAUDE.md, vilket innebar risk för missade out-of-date-sektioner. Generaliserbar regel: för styrande filer (CLAUDE.md, byggplan.md, todo.md, byggplan-direktiv.md, ADR README) är `cat <fil>` default vid pre-skanning, inte träff-fokuserad grep. Träff-grep är OK för referens-filer som inte modifieras. Källa: Pre-Fas-2 K3 åf commit 2 LÄS-fas 2026-05-06.

- [UNIVERSAL] **Kommando som ändrar filsystem-state men inte git-state ska identifieras innan klassning**
  Symptom: K1.B Block 7.3 rapporterade "ADR-011..020 har 600-permissions istället för 644" som åtgärdsbart fynd. K3 åf-implementation visade att git lagrar bara executable-biten (100644 vs 100755), inte hela permissions-masken. Lokal `chmod 644` är osynligt för git, ingen commit-effekt. Generaliserbar regel: K1.B-rapport ska kategorisera fynd som "lokal filsystem-hygien" vs "git-trackat tillstånd" innan klassificering. Detta gäller chmod, mtime, ägarskap, xattrs — git ser dem inte utöver executable-biten. Källa: Pre-Fas-2 K3 åf commit 2 chmod-noteringen 2026-05-06.

- [UNIVERSAL] **Defer-logik gäller paket med aktiv användningsyta**
  Symptom: Defer-listan sade "major-bumps på React/Tailwind/TypeScript/Vite/TanStack". Vid lucide-react 1.8.0→1.14.0 (6 minor-versioner) blev klassningen tvetydig — paketet var inte på defer-listan men hoppet var ovanligt stort. Verifiering: `grep -rln "from 'lucide-react'" src/` gav 0 träffar. Paketet var installerat men oanvänt. Generaliserbar regel: defer-logik gäller paket med aktiv användningsyta. Paket utan kod-yta (`grep -rln` = 0) har risk = 0 oavsett deras position på defer-listan eller storleken på version-hopp. Klassificeringen ska kolla användning, inte bara paketnamn. Källa: Pre-Fas-2 K3 åg lucide-beslut 2026-05-06.

- [UNIVERSAL] **Dependabot-PR-merges i sekvens kräver `recreate` på CONFLICTING — inte rebase**
  Symptom: Vid sekventiell merge av flera dependabot-PR:er som rör `package-lock.json` blir kvarvarande PR:er CONFLICTING efter första merge. `@dependabot rebase` försöker uppdatera den befintliga branchen mot ny `main` men fastnar ofta på conflicts i lock-filen. `@dependabot recreate` stänger PR:en och återskapar den med fresh lock-fil mot aktuell `main`. Generaliserbar regel: vid dependabot-inbox-cleanup, använd `gh pr comment <N> --body "@dependabot recreate"` på CONFLICTING-PR:er, inte rebase. Recreate är robustare för package-lock-conflicts. Källa: Pre-Fas-2 K3 åg vite #9 CONFLICTING-hicka 2026-05-06.

## 2026-05-11 — Fas 2 K0 startvillkoren (Session 4)

> Källa: `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 (Fas 2 K0 startvillkor 1-3: nuqs, typecheck:tests, falsk-grön-fix).
> Sub-klungor: K1 (skelett), K0åa (nuqs), K0åb.1+K0åb.2 (typecheck:tests + @types/node + APIResponse + dold isberg 8 fel), K1.2 (early bake-in K1+K0åa), K1.3 (early bake-in K0åb), K0åc.1+K0åc.2 (Strategi 1.5 split + STAGING_REQUIRED + CI env-block), K1.4 (early bake-in K0åc + milstolpe-not + retroaktiv drift-fix).
> Commit-trail: 6af3927, 13cdf86, a5a477b, 1d02b3b, fc6f43e, 3b29f41, 3015d08, 1138e38, 3927a24 (9 commits över K1→K1.4). CI grön på första försök efter K0åc.2-pushen (run 25663357991, 36s).
> Antal poster: 12, alla UNIVERSAL.
> Lyft till hub: 2026-05-11 (samma session, separat commit per cross-repo-disciplin).

- [UNIVERSAL] **Semantisk path-ref vs mekanisk prefix-fix vid sessionsdok-arkivering**
  Symptom: Vid arkivering av sessionsdok klassificeras ref-träffar i andra filer inte. Mekanisk path-prefix på roll-refs ("just nu aktiv: ...") producerar nonsens där archive-prefix motsäger "aktiv". Generaliserbar regel: skilj *identitets-refs* (peka på dokumentet — får mekanisk archive-prefix per ADR-022 kategori 2) från *roll-refs* (peka på rollen "aktiv session" — får semantisk uppdatering till nya rollens innehavare). Gäller alla "aktiv X"-pekare som någonsin arkiveras (sessionsdok, ADR-status, fas-status, dokumentversioner). Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 1 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **STOPPA-OCH-FRÅGA-mönster i Code-prompter fungerar**
  Symptom: Code-prompt med explicit STOPPA-checkpoint vid förväntat-osäkra utfall fångar dolda isberg som annars hade fortsatt orörda. K0åb-prompten innehöll "STOPPA OCH FRÅGA om typecheck:tests visar fler än 0 fel" — Code stannade exakt rätt vid 8 fel istället för att maskera dem. Generaliserbar regel: när en åtgärd avslöjar tidigare osynliga delar av kodbasen (typecheck över ny path, lint över ny mapp, test över ny domän), bygg in STOPPA-OCH-FRÅGA i prompten innan IMPLEMENTERA-blocket. Förväntat: scope växer 5-10× när luckor öppnas. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 2 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Implicit transitiv dep → explicit när direkt-användning kommer**
  Symptom: tests/ använde `process`/`URL`-globaler via implicit `@types/node` (transitiv peer-dep via @playwright/test). Risk: Dependabot ser inte uppdateringar, version-fluktuation om peer-providern uppgraderas, tyst-bryt om peer slutar peera. Generaliserbar regel: vid varje "varför fungerar det här?" om en typ/funktion som inte är explicit deklarerad — lyft till explicit dep/devDep. Logisk ägandelogik: om koden använder direkt, äger paketet sin position i package.json. Konsistent med Fas A "operations-baserat API explicit istället för fritt tableId"-mönster: explicit > implicit i alla riktningar. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 3 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Code applicerar tidigare commit-mönster automatiskt utan explicit instruktion när scope matchar**
  Symptom: K0åb-prompten skrev inte "dela i två commits". Code applicerade spontant K0åa-mönstret (deps-install separerat från fix-commit) utan att fråga — resultatet följde best practice (`a5a477b` + `1d02b3b`). Generaliserbar regel: Code internaliserar commit-mönster över sessioner; om K_N använder ett mönster, K_(N+1) med liknande scope följer det utan explicit prompt. Implikation för prompt-design: behöver inte upprepa fungerande mönster i varje prompt; men avvikelse från etablerat mönster MÅSTE vara explicit, tystnad = mönster-igenkänning. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 4 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Sessionsdok-disciplin revideras när avvikelse-volym kräver det**
  Symptom: Ursprunglig P3a-disciplin var "K1 + K-sista". Fas 2:s K1 + K0åa + K0åb genererade tillsammans 4 commits + 8 dolda type-fel + 5 lärdomskandidater + 3 avvikelser — för mycket för K-sista att baka in från Chat-kontext utan tappad detalj. Praktiskt mönster blev "K1 (skelett) + K1.N early bake-ins efter substantiella K0-sub-klungor + K-sista (full retrospektiv)". Generaliserbar regel: sessionsdok-disciplin är inte universell — beror på faktisk avvikelse-volym per K. Lågvolym → "K1 + K-sista"; högvolym → "K1 + K1.N + K-sista". Beslutskriterium: när Chat-kontextens minne av exakta detaljer börjar tunnas, är det dags för bake-in. Disciplin tjänar dokumentet, inte tvärtom. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 5 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Verifieringsräkning i str_replace-prompter ska räkna alla refs i ny string**
  Symptom: K1.2-prompten specificerade `grep -c "Kandidat 1" → 1 träff`. Faktisk: 2 träffar (rubriken i Del 7.2 + korslänk från Del 2 — båda specificerade i samma str_replace). Räkningsmisstaget triggade falsk-positiv "STOPPA OCH FRÅGA" som bröt flödet. Generaliserbar regel: när en str_replace-patch lägger till en identifierare på flera ställen (rubrik + korslänkar + commit-message-mention etc.), räkna alla förekomster i den nya texten innan verifieringsgreparna formuleras. Bättre: använd "minst X träffar" istället för "exakt X" när osäkerhet finns — Code STOPPAR bara på färre träffar, inte fler. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 6 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Refactor → Semantik-separation som 11/10-disciplin för flerstegs-ändringar**
  Symptom: K0åc-ändringen var både strukturell (split tests/ i pure/staging-projekt utan beteende-ändring) och semantisk (STAGING_REQUIRED → hard-fail istället för tyst skip). I monolitisk commit hade granskaren behövt resonera om båda samtidigt. Splittet i K0åc.1 (refactor, `3015d08`) + K0åc.2 (semantik, `1138e38`) gav två rena diffar. Generaliserbar regel: vid varje multi-fil-ändring, fråga: "kan jag splitta detta i en commit som bevarar utfall (refactor) + en commit som ändrar utfall (semantik)?" Om ja → gör det. 10/10-praxis är monolit; 11/10 är separation. Granskbarhet vinner stort. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 7 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Beteende-invariant som hård test-check i refactor-commits**
  Symptom: K0åc.1-prompten specificerade `npm run test:api` 72 passed + 41 skipped som hård invariant + STOPPA-OCH-FRÅGA på avvikelse. Code stannade om aggregatet brutits. Refactorn bevisades ren-strukturell, inte hypotetiskt. Generaliserbar regel: refactor-commits ska ha minst en hård test-invariant + explicit STOPPA-checkpoint, annars är "refactor" bara påstående. Test-invarianten är vad som skiljer "jag tror jag inte ändrade beteendet" från "jag har bevisat att beteendet är oförändrat". Generaliserar bortom test-suite till alla mätbara invariants (build-storlek, lint-warnings, dep-count, etc.). Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 8 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Förebyggande extern-resurs-verifiering mellan refactor och semantik**
  Symptom: K0åc.2 krävde extern resurs (GitHub repo-secrets) för att fungera i CI. Reaktiv approach hade varit "kör K0åc.2, se vad som händer, fixa secrets om CI failar". Förebyggande approach (verifiera secrets manuellt MELLAN K0åc.1 och K0åc.2) sparade en falsk-röd CI-körning. Generaliserbar regel: när semantik-commit kräver extern resurs (secrets, env, deployerad endpoint, externa API-keys, DNS-records), bygg in verifierings-steg FÖRE push i prompt-flödet. Pre-flight-prompt är billig (~5 min); falsk-röd CI är dyr (förvirring, debugging-runda, extra commits). Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 9 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Pre-flight verifiering avslöjar dokumentations-drift**
  Symptom: Codex' analys 2026-05-07 dokumenterade "41 deployade deny-path-tester skippas". Verklighet 4 dagar senare (vid K0åc pre-flight): 38 körbara + 3 intentional M4-defer = 41 totalt. Codex hade rätt på sammanräkningen, fel på fördelningen (~7% drift). Fjärde gången samma session att "siffran är subtilare än rapporten påstod" (K0åb 1→8 fel, K1 ref-räkningen 4 vs 3+4, K1.2 grep-count 1→2, K0åc 41→38+3). Generaliserbar regel: när en analys är 1+ vecka gammal och implementations-design hänger på dess siffror, kör samma verifierings-kommando lokalt FÖRE du litar på dem. Speciellt viktigt för räkningar (X tester, Y filer, Z fel) som lätt driver. Mönstret är universellt: "verkligheten på pushtid > analys vid skrivtid". Pre-flight som disciplin, inte extra-steg. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 10 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Designnoter i prompter ska vara verifierade, inte påstådda**
  Symptom: K0åc.2-promtens designnot påstod att de 3 M4-defer-tester i `update-record.staging.test.ts` "inte går via getApiConfig()". Påstående baserat på antagande. Code:s strikta RAPPORTERA visade tvärtom (rad 41/66/89 anropar getApiConfig() FÖRE test.skip(true, ...)). Code's interactive popup tvingade designval. Påstående klätt som faktum men byggt på antagande är 9/10-praxis. Generaliserbar regel: designnoter i prompter ska antingen (a) hänvisa till verifierad data från RAPPORTERA-block ("per Block 1 rad 17"), eller (b) markeras explicit som "förmodad — Code verifierar i RAPPORTERA". Påståenden utan källa eller modaliterad osäkerhet är fällor. Mönsterförstärkning av Kandidat 2: över K0åa-K0åc fångade STOPPA-OCH-FRÅGA 3 substantiella problem (K0åb 1→8 fel, K0åc.2 M4-defer-design, K0åc.2 GitHub-secrets-saknad) — basinstrument, inte luxus. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 11 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Multipla sanningskällor inom samma sessionsdok driver**
  Symptom: Sessionsdokets touch-count fanns på 3 ställen (header disciplin-not, Del 1 K5-cell rad 67, Del 7.1 Sessionsdok-låst-rad). K1.2 + K1.3 uppdaterade 2 av 3 — Del 1 K5-cell missades och driftade till "touch nr 2" medan andra sa "4". K1.4-pre-flight fångade glömskan + fixade retroaktivt. Generaliserbar regel: när samma faktum dokumenteras på flera ställen i ett dokument, finns två giltiga vägar — (1) en sanningskälla + korslänkar, eller (2) uppdatera alla ställen i atomisk str_replace-pass. Mixed approach ger drift inom samma fil. Praktiskt: vid varje sessionsdok-bake-in, gör en `grep`-pass på det faktum som ändras för att hitta alla mentions innan str_replace-uppsättningen skrivs. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 12 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).
