---
owner: marcus803
updated: 2026-05-27
review_by: 2026-11-15
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->
<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk. Brand-text-fix tillämpad K3.5-A (Brand-drift-rader "Miranon" → "Miranon Media", empiriska positioner per Block I.4). Brand-rule-aktivering bevarad — endast Vale.Terms täcks av helfil-disable. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# tasks/lessons.md

> Projektets organisatoriska minne. Denna fil växer kontinuerligt.
> Varje korrigering, insikt och mönster fångas här.
> Claude läser denna fil vid varje sessionsstart.
> Lärdomar märkta [UNIVERSAL] bör lyftas till meta-repot.
> **Senaste lyft:** Session 7 (2026-05-27) — L38–L50, 13 [UNIVERSAL]-lyft → hub K7.1–K7.13 (Fas 2 11/10-verification: plugin-scope, grind-arkitektur, auth-render-gate, router-fel, fixtur-pensionering, defer-omklassning, konventions-koppling)

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
- [UNIVERSAL] **Research-beslut som inte implementeras i specen är värdelösa.** Varje research-rekommendation som accepteras MÅSTE spåras hela vägen till implementation. Om specen avviker från researchen, dokumentera VARFÖR — annars ärvs avvikelsen tyst vidare. Miranon Media hittade detta 2026-04-13: research §4 rekommenderade Tailwind v4 `@theme`, men DESIGN-SYSTEM-SPEC §8 hade en full `tailwind.config.ts` utan motivering. Gap-analysen missade avvikelsen, conversion-plan ärvde den, todo.md ärvde den. Fix: krav på "research-trace" i varje spec — "denna sektion kommer från research §X, avvikelse: ingen/[skäl]".
- Airtable rollup med IF-filtrering inuti aggregeringsformeln (COUNTALL(IF(values="X",1))) fungerar opålitligt. Använd istället inbyggda "Only include linked records that meet certain conditions"-filtret + COUNTA(values). [UNIVERSAL]
- Projektkunskap (Claude Projects) kan inte indexera filer > ~5000 rader. Stora filer måste brytas upp innan de laddas upp. Psionautics Admin.tsx var oåtkomlig tills den extraherades till 19 separata filer. [UNIVERSAL]
- [UNIVERSAL] **Hävda aldrig en specifik versionsorsak utan att först verifiera installerad version med faktiskt kommando.** I Fas 0 motiverade Claude borttagning av `baseUrl` från tsconfig med "TS 7.0 deprecated" — utan att köra `tsc --version`. Den installerade versionen var TS 6.0.2, som bara visar en varning om framtida borttagning, inte en hård deprecation. Regel: innan du skriver "enligt version X" i en motivering eller commit, kör verifieringskommandot (`tsc --version`, `node --version`, `npm ls <paket>`). Motiveringar som bygger på antagen version blir lätt fel och urholkar förtroendet för övriga beslut.
- [UNIVERSAL] **Kodprojekt ska ha `docs/BUILD-LOG.md` och `docs/decisions/` från dag ett.** BUILD-LOG dokumenterar plan vs. verklighet per fas (avvikelser, faktisk output, uppskjutna beslut, miljödata, Definition of Done). `docs/decisions/` innehåller numrerade ADR:er (Architecture Decision Records) med Context → Decision → Alternatives → Consequences. Utan dessa lever beslut bara i chathistorik som ingen hittar när det verkligen behövs. Infördes i miranon-media-admin Session 1 (React) med 10 ADR:er — Session 2 och framåt ska följa samma mönster. Sessionsstart och sessionsavslut i CLAUDE.md pekar explicit på båda dokumenten så att varje session startar och slutar med uppdatering.
- [UNIVERSAL] **Hypotes om UI-flöden måste valideras mot faktisk implementation, inte mot specs.** Discovery-fasen i Fas A M4 antog att Vue-versionen var en sanningskälla för skrivflöden — vid inventering visade sig 8/11 Vue-views vara 19-radiga MmMessageBox-placeholders ("Byggs i V8/V9/V10/V12") och de riktiga (Dashboard, MinaSidor, Login) vara read-only. Hypotes-listan från Gate A1 (8 operations baserade på data-model.md + sannolika Lotta-flöden) kunde inte verifieras empiriskt eftersom det inte fanns någon UI-kod att verifiera mot. Mönster: när du ber någon "inventera vad X gör", verifiera först att X faktiskt gör det. När empiri saknas — bygg infrastruktur med tom allowlist (Marcus M4-justering 2026-05-04) snarare än att deploya oförankrade hypoteser. Att bygga icke-bevisade kapabilitetsytor är onödig attack-yta. Källa: Fas A M4 discovery 2026-05-04.

- [UNIVERSAL] **Supabase Edge Functions har två-stegs auth-check.** Gateway-nivå (`verify_jwt` i `config.toml`) fångar saknad/ogiltig JWT med eget felformat (`{"code":"UNAUTHORIZED_*","message":"..."}`) INNAN funktion-koden körs. Funktion-nivå (egen `requireUser`-helper i koden) fångar role-check (anon-key passerar gateway eftersom det ÄR ett valid JWT, missing claims, custom-policy) med eget format (`{"error":"..."}`). Båda är legitima 401-svar. Deny-path-tester och klient-felhantering måste acceptera båda formaten — annars bryts båda när gateway-toggling sker (t.ex. `verify_jwt = false` på en funktion för testbarhet). Mekanismen är inte specifik för Supabase — alla gateway+function-arkitekturer (AWS API Gateway + Lambda Authorizer, Cloudflare Workers + custom auth, etc.) har samma två-stegs-mönster. Lärt under Fas A M2 staging-verifiering 2026-05-04 (commit 605502f). Värdet ligger i att Passionslyftet och framtida SaaS kommer att möta samma arkitekturdetalj.

- [UNIVERSAL] **Test-only-endpoints (prefix `test-*`) får ALDRIG nå produktion.** När en helper behöver isolerad runtime-testning är en minimal test-endpoint (som `supabase/functions/test-auth/` för `requireUser`) det renaste sättet att köra deny-path-tester utan att gå via en datafunktion där fel kan komma från flera lager. Men sådana endpoints exponerar test-ytor (auth-bypass-konfig, debug-output) som inte hör hemma i prod — även om de i sig är "harmlösa" är dom attack-yta. Regel: deploy-pipelinen måste filtrera bort `test-*`-funktioner från prod-deploy explicit (deploy-script med funktion-allowlist, `.deployignore`-konvention, eller `supabase functions deploy --project-ref <prod>` med uttrycklig lista). Konventionen `test-`-prefix gör filtreringen mekanisk. Spårbarhet: miranon-media-admin Fas A M2 (2026-05-04) — `test-auth` infördes för Marcus utökade DoD; TODO Fas 7-not skriven i `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md` §F så det inte tappas innan deploy-pipelinen byggs. Naming-not: ursprungligt prefix var `_test_*` (underscore) men Supabase CLI accepterar inte underscore-prefix på funktionsnamn (regex `^[A-Za-z][A-Za-z0-9_-]*$`) — använd hyphen.

### Sessionsdokument från första klunga vid flerstegs-Chat-arbete [UNIVERSAL]
>
> Datum: 2026-05-04 | Källa: P1-sessionen byggplan-revision

Vid flerstegs-Chat-arbete där varje steg matar nästa (P0/P1/P2/P3-faser, multi-klunga-beslutsarbete, gates med flera milstolpar): skapa sessionsdokument vid första leverans-bit, inte i slutet. Chat-only är fel form även när context window är stort — risken är inte tappade tokens i sessionen utan tappad spårbarhet vid sessionsslut, oförmåga att granska parallellt mellan turer, och Code kan inte konsumera Chat-historik direkt.

**Mönstret:** vid sessionsstart, efter kontext-läsning men före första leverans, föreslå arbetsfilen explicit. Två varianter:

- (a) Eget sessionsdokument om leveransen är multi-del — `tasks/sessions/YYYY-MM-DD-arbete.md`
- (b) Direktredigering av målfilen om leveransen är en enskild dokumentuppdatering

Kostnaden är 5 minuters Code-anrop vid sessionsstart. Vinsten är granskbarhet per klunga, recovery-säkerhet, och Code-konsumerbar leverans.

**Anti-mönster att undvika:** "Jag levererar i chatten och vi konsoliderar i slutet" — sista-steg-konsolideringen är då en single-point-of-failure.

### Scenariobeslut när indata saknas [UNIVERSAL]
>
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
>
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
>
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
>
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
>
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
>
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
| 2026-04-04 | CSS | [UNIVERSAL] **FK:s globala CSS skapar mer problem än den löser när man byggt egna komponenter.** Tre lager fokusregler som krockade (FK :focus, Miranon Media override, komponent :focus-visible). Lösning: ta bort FK:s CSS helt, behåll paketen som referens. -81 rader, EN ren fokusregel. |
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
| 2026-04-05 | Design | [UNIVERSAL] **Skriv designfilosofi tidigt — men verifiera att implementationen följer den.** Miranon Media Admin hade en scenariopoesi som beskrev "Hej Lotta + 3 val + 4 sekunder". Sedan byggdes en sidebar med 6 sektioner, typewriter, scroll-track och resize. Referensbilder (FK-app) hade tvingat fram rätt design från start. |
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
  Symptom: Vid sekventiell merge av flera Dependabot-PR:er som rör `package-lock.json` blir kvarvarande PR:er CONFLICTING efter första merge. `@dependabot rebase` försöker uppdatera den befintliga branchen mot ny `main` men fastnar ofta på conflicts i lock-filen. `@dependabot recreate` stänger PR:en och återskapar den med fresh lock-fil mot aktuell `main`. Generaliserbar regel: vid Dependabot-inbox-cleanup, använd `gh pr comment <N> --body "@dependabot recreate"` på CONFLICTING-PR:er, inte rebase. Recreate är robustare för package-lock-conflicts. Källa: Pre-Fas-2 K3 åg vite #9 CONFLICTING-hicka 2026-05-06.

## 2026-05-11 — Fas 2 K0 startvillkoren (Session 4)

> Källa: `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 (Fas 2 K0 startvillkor 1-3: nuqs, typecheck:tests, falsk-grön-fix).
> Sub-klungor: K1 (skelett), K0åa (nuqs), K0åb.1+K0åb.2 (typecheck:tests + @types/node + APIResponse + dold isberg 8 fel), K1.2 (early bake-in K1+K0åa), K1.3 (early bake-in K0åb), K0åc.1+K0åc.2 (Strategi 1.5 split + STAGING_REQUIRED + CI env-block), K1.4 (early bake-in K0åc + milstolpe-not + retroaktiv drift-fix).
> Commit-trail: 6af3927, 13cdf86, a5a477b, 1d02b3b, fc6f43e, 3b29f41, 3015d08, 1138e38, 3927a24 (9 commits över K1→K1.4). CI grön på första försök efter K0åc.2-pushen (run 25663357991, 36s).
> Antal poster: 12, alla UNIVERSAL.
> Lyft till hub: 2026-05-11 (samma session, separat commit per cross-repo-disciplin).

- [UNIVERSAL] **Semantisk path-ref vs mekanisk prefix-fix vid sessionsdok-arkivering**
  Symptom: Vid arkivering av sessionsdok klassificeras ref-träffar i andra filer inte. Mekanisk path-prefix på roll-refs ("just nu aktiv: ...") producerar nonsens där archive-prefix motsäger "aktiv". Generaliserbar regel: skilj *identitets-refs* (peka på dokumentet — får mekanisk archive-prefix per ADR-022 kategori 2) från *roll-refs* (peka på rollen "aktiv session" — får semantisk uppdatering till nya rollens innehavare). Gäller alla "aktiv X"-pekare som någonsin arkiveras (sessionsdok, ADR-status, fas-status, dokumentversioner). Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 1 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **STOPPA-OCH-FRÅGA-mönster i Code-prompter fungerar**
  Symptom: Code-prompt med explicit STOPPA-checkpoint vid förväntat-osäkra utfall fångar dolda isberg som annars hade fortsatt orörda. K0åb-prompten innehöll "STOPPA OCH FRÅGA om typecheck:tests visar fler än 0 fel" — Code stannade exakt rätt vid 8 fel istället för att maskera dem. Generaliserbar regel: när en åtgärd avslöjar tidigare osynliga delar av kodbasen (typecheck över ny path, lint över ny mapp, test över ny domän), bygg in STOPPA-OCH-FRÅGA i prompten innan IMPLEMENTERA-blocket. Förväntat: scope växer 5-10× när luckor öppnas. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 2 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Implicit transitiv dep → explicit när direkt-användning kommer**
  Symptom: tests/ använde `process`/`URL`-globaler via implicit `@types/node` (transitiv peer-dep via `@playwright/test`). Risk: Dependabot ser inte uppdateringar, version-fluktuation om peer-providern uppgraderas, tyst-bryt om peer slutar peera. Generaliserbar regel: vid varje "varför fungerar det här?" om en typ/funktion som inte är explicit deklarerad — lyft till explicit dep/devDep. Logisk ägandelogik: om koden använder direkt, äger paketet sin position i package.json. Konsistent med Fas A "operations-baserat API explicit istället för fritt tableId"-mönster: explicit > implicit i alla riktningar. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 3 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Code applicerar tidigare commit-mönster automatiskt utan explicit instruktion när scope matchar**
  Symptom: K0åb-prompten skrev inte "dela i två commits". Code applicerade spontant K0åa-mönstret (deps-install separerat från fix-commit) utan att fråga — resultatet följde best practice (`a5a477b` + `1d02b3b`). Generaliserbar regel: Code internaliserar commit-mönster över sessioner; om K_N använder ett mönster, K_(N+1) med liknande scope följer det utan explicit prompt. Implikation för prompt-design: behöver inte upprepa fungerande mönster i varje prompt; men avvikelse från etablerat mönster MÅSTE vara explicit, tystnad = mönster-igenkänning. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 4 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Sessionsdok-disciplin revideras när avvikelse-volym kräver det**
  Symptom: Ursprunglig P3a-disciplin var "K1 + K-sista". Fas 2:s K1 + K0åa + K0åb genererade tillsammans 4 commits + 8 dolda type-fel + 5 lärdomskandidater + 3 avvikelser — för mycket för K-sista att baka in från Chat-kontext utan tappad detalj. Praktiskt mönster blev "K1 (skelett) + K1.N early bake-ins efter substantiella K0-sub-klungor + K-sista (full retrospektiv)". Generaliserbar regel: sessionsdok-disciplin är inte universell — beror på faktisk avvikelse-volym per K. Lågvolym → "K1 + K-sista"; högvolym → "K1 + K1.N + K-sista". Beslutskriterium: när Chat-kontextens minne av exakta detaljer börjar tunnas, är det dags för bake-in. Disciplin tjänar dokumentet, inte tvärtom. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 5 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Verifieringsräkning i str_replace-prompter ska räkna alla refs i ny string**
  Symptom: K1.2-prompten specificerade `grep -c "Kandidat 1" → 1 träff`. Faktisk: 2 träffar (rubriken i Del 7.2 + korslänk från Del 2 — båda specificerade i samma str_replace). Räkningsmisstaget triggade falsk-positiv "STOPPA OCH FRÅGA" som bröt flödet. Generaliserbar regel: när en str_replace-patch lägger till en identifierare på flera ställen (rubrik + korslänkar + commit-message-mention etc.), räkna alla förekomster i den nya texten innan verifieringsgreparna formuleras. Bättre: använd "minst X träffar" istället för "exakt X" när osäkerhet finns — Code STOPPAR bara på färre träffar, inte fler. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 6 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Refactor → Semantik-separation som 11/10-disciplin för flerstegs-ändringar**
  Symptom: K0åc-ändringen var både strukturell (split tests/ i pure/staging-projekt utan beteende-ändring) och semantisk (STAGING_REQUIRED → hard-fail istället för tyst skip). I monolitisk commit hade granskaren behövt resonera om båda samtidigt. Splittet i K0åc.1 (refactor, `3015d08`) + K0åc.2 (semantik, `1138e38`) gav två rena diffar. Generaliserbar regel: vid varje multi-fil-ändring, fråga: "kan jag splitta detta i en commit som bevarar utfall (refactor) + en commit som ändrar utfall (semantik)?" Om ja → gör det. 10/10-praxis är monolit; 11/10 är separation. Granskbarhet vinner stort. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 7 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Beteende-invariant som hård test-check i refactor-commits**
  Symptom: K0åc.1-prompten specificerade `npm run test:api` 72 passed + 41 skipped som hård invariant + STOPPA-OCH-FRÅGA på avvikelse. Code stannade om aggregatet brutits. Refactorn bevisades ren-strukturell, inte hypotetiskt. Generaliserbar regel: refactor-commits ska ha minst en hård test-invariant + explicit STOPPA-checkpoint, annars är "refactor" bara påstående. Test-invarianten är vad som skiljer "jag tror jag inte ändrade beteendet" från "jag har bevisat att beteendet är oförändrat". Generaliserar bortom test-suite till alla mätbara invariants (build-storlek, lint-warnings, dep-count, etc.). Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 8 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Förebyggande extern-resurs-verifiering mellan refactor och semantik**
  Symptom: K0åc.2 krävde extern resurs (GitHub repo-secrets) för att fungera i CI. Reaktiv approach hade varit "kör K0åc.2, se vad som händer, fixa secrets om CI failar". Förebyggande approach (verifiera secrets manuellt MELLAN K0åc.1 och K0åc.2) sparade en falsk-röd CI-körning. Generaliserbar regel: när semantik-commit kräver extern resurs (secrets, env, deployerad endpoint, externa API-keys, DNS-records), bygg in verifierings-steg FÖRE push i prompt-flödet. Pre-flight-prompt är billig (~5 min); falsk-röd CI är dyr (förvirring, debugging-runda, extra commits). Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 9 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Pre-flight verifiering avslöjar dokumentations-drift**
  Symptom: Codex' analys 2026-05-07 dokumenterade "41 deployade deny-path-tester skippas". Verklighet 4 dagar senare (vid K0åc pre-flight): 38 körbara + 3 intentional M4-defer = 41 totalt. Codex hade rätt på sammanräkningen, fel på fördelningen (~7% drift). Fjärde gången samma session att "siffran är subtilare än rapporten påstod" (K0åb 1→8 fel, K1 ref-räkningen 4 vs 3+4, K1.2 grep-count 1→2, K0åc 41→38+3). Generaliserbar regel: när en analys är 1+ vecka gammal och implementations-design hänger på dess siffror, kör samma verifierings-kommando lokalt FÖRE du litar på dem. Speciellt viktigt för räkningar (X tester, Y filer, Z fel) som lätt driver. Mönstret är universellt: "verkligheten på pushtid > analys vid skrivtid". Pre-flight som disciplin, inte extra-steg. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 10 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Designnoter i prompter ska vara verifierade, inte påstådda**
  Symptom: K0åc.2-promtens designnot påstod att de 3 M4-defer-tester i `update-record.staging.test.ts` "inte går via getApiConfig()". Påstående baserat på antagande. Code:s strikta RAPPORTERA visade tvärtom (rad 41/66/89 anropar getApiConfig() FÖRE test.skip(true, ...)). Code's interactive popup tvingade designval. Påstående klätt som faktum men byggt på antagande är 9/10-praxis. Generaliserbar regel: designnoter i prompter ska antingen (a) hänvisa till verifierad data från RAPPORTERA-block ("per Block 1 rad 17"), eller (b) markeras explicit som "förmodad — Code verifierar i RAPPORTERA". Påståenden utan källa eller modaliterad osäkerhet är fällor. Mönsterförstärkning av Kandidat 2: över K0åa-K0åc fångade STOPPA-OCH-FRÅGA 3 substantiella problem (K0åb 1→8 fel, K0åc.2 M4-defer-design, K0åc.2 GitHub-secrets-saknad) — basinstrument, inte luxus. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 11 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Multipla sanningskällor inom samma sessionsdok driver**
  Symptom: Sessionsdokets touch-count fanns på 3 ställen (header disciplin-not, Del 1 K5-cell rad 67, Del 7.1 Sessionsdok-låst-rad). K1.2 + K1.3 uppdaterade 2 av 3 — Del 1 K5-cell missades och driftade till "touch nr 2" medan andra sa "4". K1.4-pre-flight fångade glömskan + fixade retroaktivt. Generaliserbar regel: när samma faktum dokumenteras på flera ställen i ett dokument, finns två giltiga vägar — (1) en sanningskälla + korslänkar, eller (2) uppdatera alla ställen i atomisk str_replace-pass. Mixed approach ger drift inom samma fil. Praktiskt: vid varje sessionsdok-bake-in, gör en `grep`-pass på det faktum som ändras för att hitta alla mentions innan str_replace-uppsättningen skrivs. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 12 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

- [UNIVERSAL] **Drift-fix-grep ska exkludera meta-dokumentation om driften själv**
  Symptom: grep-verifiering för att en bug är fixad rapporterar falsk positiv eftersom lessons-poster och historiska referenser också matchar. Generaliserbar regel: när text-fix grep:as för verifiering, exkludera meta-träffar via `grep -v "<meta-kontext>"` eller använd "minst X inom meta, 0 utanför" per Kandidat 6:s "minst X"-mönster. För exakt-formulerade greps (t.ex. ord med specifik ändelse) — använd bredare match. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 13 för expanderat resonemang (Mönstret / praktisk variant från Steg 4-anomali).

- [UNIVERSAL] **Sessionsdok-format vs lessons.md-format ska klargöras innan första lyft i ny session**
  Symptom: lyft-prompt skrev "verbatim, behåll allt" mellan multi-paragraph-sessionsdok och kompakt-1-paragraph-lessons.md, vilket bryter mot lessons.md-konventionen. Generaliserbar regel: vid första lyft till en katalog i ny session (lessons, ADR, BUILD-LOG, decisions/README), börja med explicit format-bridge-anmärkning: "Källformat är X, mål-format är Y, här är bridge-mallen". Mönster-förstärkning av Kandidat 11 (designnoter ska vara verifierade). Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 14 för expanderat resonemang (Hybrid-val-motivering från 3-alternativs-popup).

- [UNIVERSAL] **Chat-kontext lever inte över sessionsbyte; "fångas i Chat-kontexten" är ALDRIG giltig fångst-strategi**
  Symptom: Chat sade "fångas senare i Chat-kontexten" om lärdomskandidater mitt under mini-överlämnings-förberedelse — logisk självmotsägelse eftersom överlämningen finns EXAKT för att Chat-kontext inte överlever sessionsbyte. Generaliserbar regel: tre giltiga fångst-vägar finns: (a) sessionsdok-bake-in, (b) lessons.md-lyft, (c) ADR-skapande. "Chat-kontext" är ALDRIG en av dem för information som ska överleva sessionsbyte. Mönster-förstärkning av Kandidat 5 (sessionsdok-disciplin revideras vid avvikelse-volym). Meta-observation: att ha skrivit en regel innebär inte att den följs i samma session — kräver aktiv vakthållning. Källa: 2026-05-11 Fas 2 K0 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 15 för expanderat resonemang (3 inom-sessions-överträdelser + Marcus' fångst).

- [UNIVERSAL] **Grep -v exklusion av filnamn fångar både filen själv OCH markdown-länkmål i andra dokument**
  Symptom: K0åf Block 2-grep `grep -v "docs/specs/X.md"` missade 2 aktiva refs i CLAUDE.md + CONTRIBUTING.md eftersom samma substring fångade både fil-output OCH markdown-länkmål `[text](docs/specs/X.md)` i andra dokument. VERIFIERA-stegets Check 8 (oberoende formulerad grep) fångade missan. Generaliserbar regel: vid grep-exklusion av filpath, använd path-prefix-disciplin (`grep -v "^docs/specs/X.md:"` med leading `^` + trailing `:` matchar bara `grep -n`-fil-prefix) istället för naken substring. Praktisk konsekvens: VERIFIERA-stegets checks ska aldrig återanvända samma filter som RAPPORTERA — annars är de bara samma kontroll i nytt format. Källa: 2026-05-11 Fas 2 K0åf — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 16 för expanderat resonemang (Mönstret/Anti-mönster/Generaliserbar).

---

## 2026-05-12 — Fas 2 Session 5 (K2-K4 + K3.5)

> Källa: `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 4 + Del 5 + Del 6 (K2-K4 fullständig bake-in). Commit-trail: 14 commits från `5709f26` (K2.1) till `d0eab46` (K4.3). K0åg-kandidater 17-23 hänskjutna till Session 5b K5 final.
> Antal poster: 13 (K24-K36). UNIVERSAL-värdiga (K34 + K36 särskilt starka hub-lyft-kandidater).
> Lyft till hub: defer till Session 5b K5 final (cross-repo-disciplin per ADR-023-pattern).

- [UNIVERSAL] **Prompt-räknings-fel ≠ tillstånds-fel — 3-alternativs popup snabbare än re-prompt** [K24]
  Symptom: K2.1-prompten antog ett befintligt `npm audit`-steg i ci.yml att byta ut. Block B avslöjade 0 audit-rader. Det är prompt-räknings-fel (vad Chat antagit), inte tillstånds-fel (vad är trasigt i repot). Generaliserbar regel: vid STOPPA-villkor i prompt-implementation, klassificera om det är räknings-fel eller tillstånds-fel innan respons-design. Räknings-fel löses snabbast via Marcus' 3-alternativs-popup (placering, design-val) snarare än långgrundad re-prompt från Chat. 8:e räknings-felet sedan Session 4 — konsistent mönster. Källa: 2026-05-12 Session 5 K2.1 — se sessionsdok Del 4.

- [UNIVERSAL] **biome format !== biome check — `check --write` täcker organizeImports + safe assist** [K25, aktiverad K3.0]
  Symptom: K2.2 + K2.3 fick båda CI-fail på `assist/source/organizeImports` trots lokal `npx @biomejs/biome format --write` exit=0. `format`-kommandot täcker bara formatter-actions; `check --write` täcker även organizeImports + safe assist + safe linter-fixes som CI använder. Aktiverad disciplin K3.0 (CLAUDE.md sessionsstart-not + pre-commit-mönster). Empiriskt fungerat: K3.1, K3.3, K4.1, K4.2, K4.3 alla CI-grön första försöket efter aktivering. Generaliserbar regel: för commits med nya filer/imports, kör `biome check --write` (inte bara `format --write`) som sista pre-commit-steg. Källa: 2026-05-12 Session 5 K2.2 + K2.3 dubbel-bekräftad — se sessionsdok Del 4.

- [UNIVERSAL] **routeTree.gen.ts behövs för tsc-typecheck — pre-generera via tsr generate** [K26]
  Symptom: K2.2 CI Build failade på TypeScript TS2345 för `createFileRoute('/_authenticated')`-typer. Lokalt grön. Grundorsak: `routeTree.gen.ts` .gitignored → CI:s `npm ci` ger ingen, men Vite-plugin genererar bara vid `npm run dev`/`vite build`. `tsc -b` körs FÖRE `vite build` i build-scriptet → tsc saknar typer. Lokalt fanns gammal `routeTree.gen.ts` från tidigare dev-körning. Generaliserbar regel: TanStack Router file-based routing kräver `routeTree.gen.ts` för tsc-typecheck — pre-generera via `@tanstack/router-cli` (`tsr generate &&` framför `tsc -b`). Lokal-vs-CI-mismatch är klassiskt "fungerar på min maskin"-symptom. Mönster-förstärkning av Kandidat 10 (verkligheten på pushtid > analys vid skrivtid). Källa: 2026-05-12 Session 5 K2.2-fix2 — se sessionsdok Del 4.

- [UNIVERSAL] **Trippel-commit-resolution vid CI-kaskad — egen commit per fix, INTE amend** [K27]
  Symptom: K2.2 utlöste CI-fail-kaskad: `135ff6a` (skelett) → `b32ec51` (biome organize-imports) → `0194787` (tsr generate pre-build). Tre commits, varje med distinkt fix, varje med ren spårbarhet i git log. CLAUDE.md säger explicit "skapa ny commit istället för amend" — det fungerar i praktiken vid kaskad-fails. Generaliserbar regel: vid CI-fail-kaskad, motstå impulsen att amend. Egen commit per fix. Spårbarheten i git log är värd repeterat noise — git blame och `git log -S` kan navigera till exakt bug-fix om regression dyker upp senare. Motsatsen ("stor opak commit som löser flera saker") är feltolerant-i-kort-sikt men ohanterbar-i-långt-sikt. Källa: 2026-05-12 Session 5 K2.2 (3 commits) — se sessionsdok Del 4.

- [UNIVERSAL] **Sub-klung-uppdelning baserad på arkitektur-impact, inte fil-räkning** [K28]
  Symptom: K3 uppdelades i K3.0 (disciplin-fix CLAUDE.md), K3.1 (arkitektur-förberedelse router-extract), K3.2 (arkitekturkritisk core AuthProvider + InnerApp), K3.3 (routes-aktivering). 4 naturliga reversibilitets-punkter. Inte fil-räkning ("3 filer per sub-klunga") utan arkitektur-impact (disciplin/förberedelse/core/aktivering). Mönster-förstärkning av Kandidat 23 (sub-klung-splitt vid scope-tillväxt). Generaliserbar regel: vid K-klunga >2-3 timmar med mer än en arkitekturpunkt, splittra på naturliga gränser: disciplin-fix, förberedelse, core-arbete, aktivering. Varje gräns är en reversibilitets-punkt + en commit-möjlighet. Källa: 2026-05-12 Session 5 K3.0-K3.3 (4 sub-klungor, 5 commits) — se sessionsdok Del 5.

- [UNIVERSAL] **Router-extract-disciplin för router.invalidate från Provider** [K29]
  Symptom: K3.2 AuthProvider behöver anropa `router.invalidate()` vid auth-state-byte så `beforeLoad`-guarder re-evalueras. AuthProvider importeras AV `main.tsx` → cirkulär import om AuthProvider importerar router från `main.tsx`. K3.1 bröt ut router + queryClient till `src/router.ts` som båda main.tsx och AuthProvider importerar — ingen cirkulär. Generaliserbar regel: när Provider behöver imperativ access till router-instans (invalidate, navigate utanför komponent-tree), separat router-modul är default-disciplin, INTE specialfall. Etablerat 11/10-mönster för TanStack Router auth-pattern. Källa: 2026-05-12 Session 5 K3.1 — se sessionsdok Del 5.

- [UNIVERSAL] **Supabase getSession() räcker för SPA med server-side requireUser — getClaims() är overkill** [K30]
  Symptom: AuthProvider i K3.2 använde `getSession()` för initial mount + `onAuthStateChange` för reactive updates. `getClaims()` övervägdes som 11/10+ klient-side identity-validation men avvisades — server-sidans `requireUser` (Fas A M2) är slutgiltig auth-validator. Defense-in-depth-arkitektur (klient-guard + server-validation) tillåter pragmatiska klient-side-val. JSDoc-not på `sessionToUser` flaggar `getClaims()` som Fas 2.5+ alternativ. Generaliserbar regel: för SPA med server-side auth-validation, klient-side identity-validation är overkill — getSession() från local storage är snabbt och tillräckligt. Spårbar disciplin via JSDoc utan scope-tillväxt nu. Källa: 2026-05-12 Session 5 K3.2 — se sessionsdok Del 5.

- [UNIVERSAL] **Lokal biome exit=0 !== CI-grön på strict-mode-regler — explicit errors-grep krävs** [K31, aktiverad K5.3]
  Symptom: K3.2 lokal `biome check` rapporterade exit=0 + "× Some errors emitted" som visuell text. CI failade på `lint/style/noNonNullAssertion` (router.ts:33 `undefined!`) + `lint/correctness/useExhaustiveDependencies` (main.tsx:35 `[auth.isAuthenticated]`). Båda var nya rule-träffar som inte fanns i baseline. Lokal exit-mappning skiljde från CI:s strict-mode. Distinkt komplement till Kandidat 25 (K25 = format !== check, K31 = check exit=0 !== CI-grön på strict-mode). Generaliserbar regel: kör `npx @biomejs/biome check . 2>&1 | grep -E "^Found .* error"` lokalt FÖRE push. Om träff > 0, fixa innan commit. För nya filer som introducerar nya rule-träffar är lokal verifiering otillräcklig signal — explicit errors-räkning via grep är säkrare. Aktiverad disciplin i K5.3 CLAUDE.md-uppdatering. Källa: 2026-05-12 Session 5 K3.2 (2 fix-commits) — se sessionsdok Del 5.

- [UNIVERSAL] **AuthProvider Supabase-integration triggar ~200 kB bundle-bumpa — auth-paket är tystmördare** [K32]
  Symptom: K3.2 AuthProvider full integration triggade 440→637 kB main JS bumpa (+197 kB raw / +50 kB gzip). 20× större än Chats prognos (~5-10 kB). Källa: hela `@supabase/supabase-js` runtime-stack (gotrue/auth-helpers + onAuthStateChange-listener-runtime + Supabase-client-Realtime-tree-shake-failure). Tidigare deklarerat men runtime-paths inte aktiverade. Generaliserbar regel: Auth-Provider-paket (Supabase, Firebase, Auth0) har tunga runtime-stacks som tree-shake-failar. Förväntad bumpa vid introduktion är INTE ~10 kB — det är ~150-200 kB raw. Om publika routes finns, planera lazy-import-arkitektur från första början. Konkreta åtgärder (defer Fas 7 perf-budget): `lazyRouteComponent` på `_authenticated`-trädet, tree-shake-verifikation av Realtime-modulen, `chunkSizeWarningLimit: 600` om 500-warning är permanent. Källa: 2026-05-12 Session 5 K3.2 — se sessionsdok Del 5.

- [UNIVERSAL] **Code-splitting via TanStack autoCodeSplitting fungerar utan special-konfiguration** [K33]
  Symptom: K3.3 login.tsx genererade separat 1.91 kB chunk. K4.1 test-nuqs.tsx genererade 12.21 kB chunk + react-chunk 7.52 kB. `autoCodeSplitting: true` (aktiverat i K2.2 vite.config) fungerar för route-tree-extraktion utan extra arbete. Validering: Fas 7 behöver INTE omarbete för code-splitting-grundinfrastruktur. Generaliserbar regel: TanStack Router file-based routing + autoCodeSplitting = automatisk per-route chunking utan special-konfiguration. Fas 7-perf-arbete blir "lazy-load auth-trädet" snarare än "etablera code-splitting-pipeline". Mönster-förstärkning av K32 (auth-paket-bumpa har bra fundament för lazy-fix). Källa: 2026-05-12 Session 5 K3.3 + K4.1 — se sessionsdok Del 5 + Del 6.

- [UNIVERSAL] **Aldrig-läcka-disciplin gäller även test-credentials (förlängning K0åc.2)** [K34, hub-lyft-kandidat]
  Symptom: K4.2 etablerade Playwright auth-fixture som loggar in TEST_USER. Disciplin från K0åc.2 (production-secrets aldrig ekas) förlängdes: `TEST_USER_EMAIL`/`PASSWORD` läses från `process.env` (`.env.test` lokalt, GitHub Actions secrets remote), ALDRIG hårdkoda i source. Playwright maskerar `input[type=password]` i screenshots/videos by default — explicit verifierat i config. `playwright/.auth/user.json` helt `.gitignored` (innehåller session-tokens). Hard-fail om env-vars saknas matchar `STAGING_REQUIRED`-pattern. Generaliserbar regel: test-credentials är INTE "lägre risk-klass" än production-credentials. Samma aldrig-läcka-disciplin: env-vars + maskering + gitignore + hard-fail. UNIVERSAL-värdig — gäller alla projekt med automatiserad auth-testning, inte miranon-specifikt. Stark hub-lyft-kandidat. Källa: 2026-05-12 Session 5 K4.2 — se sessionsdok Del 6.

- [UNIVERSAL] **Automatiserad arkitektur-regression > engångs-manuell verifikation** [K35]
  Symptom: K4.3 ersatte K3.3 manuell-checklista med automatiserad Playwright-suite (6 tester). Skillnaden är inte bara "snabbare" — det är "körbar vid varje commit" vs "engångs-Marcus-säger-att-det-fungerade". Test 5 (INGA functions/v1-anrop med anon-key) är konkret exempel — defense-in-depth-disciplin från sessionsdok Del 5.0 nu körbar och fångas vid varje framtida commit. Sessionsdok-förbud blir levande regression-test. Generaliserbar regel: vid "förbjudet 1, 2, 3..."-listor i sessionsdok eller spec, skriv automatiserad test som fångar varje förbud separat. Spårbarhet × disciplin. Källa: 2026-05-12 Session 5 K4.3 — se sessionsdok Del 6.

- [UNIVERSAL] **Automatiserad test fångar timing-bugs som manuell test missar pga människa-tid** [K36, hub-lyft-kandidat]
  Symptom: K3.2 InnerApp-pattern hade race-condition vid initial mount: `useState`-default `{ isAuthenticated: false, isLoading: true }` → `beforeLoad` ser `isLoading: true` → return → `getSession()` settles → `setUser(null)` → `isAuthenticated: false` (oförändrat) → `useEffect([auth.isAuthenticated])` triggar INTE → `router.invalidate()` körs inte → utloggad ser /hem. Människa-tid mellan manuell test-handlingar (5-10s) maskerar race-fönstret (~50-200ms). K3.3 manuell-checklista hade missat. K4.3 Test 4 + Test 6 fångade omedelbart eftersom Playwright kör utan paus. K3.5 1-rads-fix (deps `[auth.isAuthenticated, auth.isLoading]`) löste — 7/7 gröna empiriskt FÖRE commit. Distinkt från K35: K35 = automatiserad > engångs-manuell (frekvens-argument), K36 = automatiserad > människa-tid (timing-argument). Generaliserbar regel: för auth-arkitektur + async-state-management där initial-state och settled-state kan vara identiska värden, automatiserad test är inte bara bekvämlighet utan nödvändighet. Manuell test ger falsk trygghet. UNIVERSAL-värdig — gäller alla projekt med React useEffect-deps mot async settling-state. Stark hub-lyft-kandidat. Källa: 2026-05-12 Session 5 K3.5 + K4.3 — se sessionsdok Del 5 + Del 6.

## 2026-05-13 — Fas 2 Session 5b (K3.4 + K0åg-skörd)

> Källa: `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 3.7 (K17-K19 från K0åg-defer) + Del 7.2 (K37-K38 från K3.4 + K5.4/K5.5a-meta-fynd). Commit-trail: K3.4 `1d3fc21` + K5.4 `f9328f7` + K5.5a `7b3b693`.
> Antal poster: 5 (K17 + K18 + K19 + K37 + K38). Alla hub-lyft-kandidater per Gate 2 (a) 2026-05-13.
> Lyft till hub: defer till K5.7 (cross-repo-disciplin per ADR-023-pattern), parallellt med K24-K36-hub-lyft från föregående H2.

- [UNIVERSAL] **Live security-state ska verifieras vid sessionsstart, inte antas vara samma som senaste session** [K17, hub-lyft-kandidat]
  Symptom: K1.7 RAPPORTERA Block B (sessionsstart-baseline-audit) körde `npm audit` ~9h efter GHSA-rmmr-r34h-pfm5-publicering 2026-05-11 23:39 UTC och fångade 6 critical innan K2:s `npm install` skulle ha dragit in malware-versioner inom `^1.168.19`-range. Utan Block B-disciplinen hade Marcus' maskin installerat malware-byte. Generaliserbar regel: varje sessionsstart ska inkludera live security-state-verifikation (`npm audit` eller motsvarande för stack:en) FÖRE några `install`-steg. Live state ≠ snapshot från senaste sessionen — advisories publiceras asynkront. Mönsterförstärkning av Kandidat 10 (verkligheten på pushtid > analys vid skrivtid) generaliserat till säkerhetsdimensionen. Hub-lyft-kandidat: ja — gäller alla projekt med externa deps, inte miranon-specifik. Källa: 2026-05-12 Session 5 K0åg — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 3.7 Kandidat 17 för expanderat resonemang (upptäcktssekvens + diagnostik-tabell).

- [UNIVERSAL] **Audit-output är signal, inte sanning — integrity-MATCH bevisar säker artefakt** [K18, hub-lyft-kandidat]
  Symptom: GHSA-rmmr-r34h-pfm5 advisory `vulnerable_versions: >=0` ger false-positive för installerade pre-malware-versioner. `npm audit` fortsätter rapportera 6 critical även när artefakterna är säkra (verifierat via pre/post-install integrity-hash MATCH mot `package-lock.json.pre-k0åg`-backup). Generaliserbar regel: vid security-advisory mot installerade versioner, audit-output är signal som triggar verifiering, inte sanning som bevisar kompromett. Faktisk säkerhets-bedömning kräver integrity-MATCH pre/post + postinstall-hook-scan + runtime-mönster-scan + tidsfönster-analys. Hanteras kirurgiskt via `audit-ci`-whitelist för känd-tillstånd, inte permanent-röd CI som förstör signal-systemets värde. Hub-lyft-kandidat: ja — universell för supply chain-incident-respons oavsett stack. Källa: 2026-05-12 Session 5 K0åg — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 3.7 Kandidat 18 för expanderat resonemang (artefakt-kontinuitet-verifikation).

- [UNIVERSAL] **Pin exakt + overrides är reversibel supply chain-respons; downgrade-force är destruktiv** [K19, hub-lyft-kandidat]
  Symptom: K0åg övervägde tre strategier för @tanstack/*-incident: uppgradera till patched (ej tillgängligt), pin exakt + overrides (vald), `npm audit fix --force` (downgrade till `@tanstack/router-plugin@1.111.6`, 56 versioner bak, sannolika breaking changes). Pin exakt + overrides bevarade fungerande versioner, blockerade oavsiktlig uppgradering, tvang transitiva till säkra versioner — alla reversibelt när patched publiceras (ta bort overrides, återinför `^`-prefix, vanlig uppgradering). `npm audit fix --force` är destruktivt default-svar som rutinmässigt föreslår major-downgrades. Generaliserbar regel: vid security-advisory utan patched version, pin exakt + overrides är default-respons; `audit fix --force` är förbjuden default, OK endast som sista utväg med explicit ADR. Hub-lyft-kandidat: ja — respons-disciplinen (pin exakt + overrides reversibelt > destruktiv downgrade-force) generaliserar till alla package managers med equivalent funktionalitet (pip pins, cargo overrides, go.mod replace, gem locks). NPM-mekanismen är exempel, regeln är bredare. Källa: 2026-05-12 Session 5 K0åg — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 3.7 Kandidat 19 för expanderat resonemang (strategi-analys + ADR-028).

- [UNIVERSAL] **Test-runner-konvention ska verifieras i RAPPORTERA, aldrig antas i PLANERA** [K37, hub-lyft-kandidat]
  Symptom: K3.4 Chat-prompt skrev vitest-syntax (`vi.spyOn`, `describe/it`) i PLANERA Fil 3 baserat på antagande om projektets test-runner. Block F i RAPPORTERA verifierade `package.json` deps + befintliga `*.test.ts`-imports och rapporterade Playwright-only — ingen vitest, ingen jest. 3-alternativs popup tvingade designbeslut; Marcus valde skippa unit-test, kvalitetsklyfta för Fas 3.5. Generaliserbar regel: när PLANERA innehåller test-kod, RAPPORTERA-blocket ska ha explicit verifiering: `grep -E "(vitest|jest):" package.json` + inspektion av befintlig `*.test.ts` för dess imports. Block F-mönstret är färdig mall. Mönsterförstärkning av Kandidat 11 (designnoter ska verifieras) + Kandidat 14 (format-bridge): alla projekt-specifika konventioner som påverkar PLANERA-output ska verifieras i RAPPORTERA, aldrig antas. Hub-lyft-kandidat: ja — gäller alla Chat-Code-arbetsflöden, inte miranon-specifik. Källa: 2026-05-13 Session 5b K3.4 Gate 1 — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 37 för expanderat resonemang (Block F-mall + regel-familj-syntes).

- [UNIVERSAL] **VERIFIERA-grep-kriterier ska vara form-toleranta, inte exakt-fras** [K38, hub-lyft-kandidat]
  Symptom: K5.4-prompts VERIFIERA-grep `rg -c "Kandidat 37" = 2` och `rg -c "touch nr 10" = 4` gav 1 respektive 3 träffar — innehållet korrekt, men kortform "K37" och alt-form "post-K5.4 = 10" missades av exakt-fras-kriterier. Båda var kriterie-fel, inte innehållsfel. Generaliserbar regel: VERIFIERA-grep ska antingen (a) använda alternation för kända form-varianter (`Kandidat 37|K37`, `touch nr 10|= 10`), eller (b) använda "minst X" istället för "exakt X" när varianter är möjliga. Snäv fras + exakt räkning är giltig endast för automatiserat innehåll (commit-meddelanden, structured JSON, generated routes). Plus: meta-exklusion av kandidat-blocket självt när kandidat-content refererar K-fas-incidenten som exempel (K13-tillämpning). Mönsterförstärkning av Kandidat 6 (verifieringsräkning ska räkna alla refs) + Kandidat 13 (meta-exklusion av drift-fix-grep): K38 är konsekvensen för prompt-författande. Hub-lyft-kandidat: ja — universell för alla Chat-Code-arbetsflöden. Källa: 2026-05-13 Session 5b K5.4 + K5.5a VERIFIERA-utfall — se `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 7.2 Kandidat 38 för expanderat resonemang (kriterie-fel-mönster + andra-ordnings-meta-not från K5.5a).

## 2026-05-14 — Session 6 (K1.D CI-optimering, K1.1-K1.17)

Session 6 etablerade Strategi E (Vite-mönstret) som kanonisk CI-arkitektur per ADR-029. Empirisk verifikation: doc-only-commits ~34s vs ~95s baseline (~64 % besparing); lychee broken-link-grindvakt etablerad. 17 UNIVERSAL-lessons skördade — största enskilda session-skörd. 10 av dessa hub-lyfta till `marcus-system/tasks/lessons.md`.

### K1.1 [UNIVERSAL, hub-lyft] — K17/K18 är paradigm-spanning, inte ekosystem-specifik

Datum: 2026-05-14 | Källa: Session 6 K0åh + K1.C Block 2.4 + K1.D Commit 1.5 cache-key-val

K0åh-resolutionen tillämpade K18 på npm-audit (GHSA-rmmr-r34h-pfm5: vulnerable_range snävades; vår 1.161.6 utanför range → 0 critical trots advisory finns). K1.C Block 2.4 tillämpade samma K18 på GitHub Actions-advisories (tj-actions v47.0.6 post-patched för båda historiska high-advisories GHSA-mrrh-fwg8-r2c3 + GHSA-mcph-m25j-8j63 → ingen aktiv risk). K1.D Commit 1.5 utvidgade till cache-domän (hashFiles vs jq cache-key-val: cache-hit är signal, inte sanning; key-design är där correctness säkerställs). Generaliserbar regel: vid advisory-träff eller security-output i ETT supply-chain-ekosystem, applicera samma `first_patched_version`-analys-disciplin i ALLA ekosystem (npm, GitHub Actions, cargo, pypi, gem, helm-charts, Docker base images). K17 (live security-state) + K18 (audit-output är signal, inte sanning) är **paradigm-spanning**, inte ekosystem-specifik. Identifierar inte unique policy per ekosystem — utvidga befintlig ADR (ADR-028 → ADR-029 § 6 Actions-policy).

### K1.2 [UNIVERSAL, hub-lyft] — Branschledar-mönster är golvet, inte taket; verifiera empiriskt

Datum: 2026-05-14 | Källa: Session 6 K1.C Vite-research + K1.D Commit 1.6 ci-passed-bug + K1.D Commit 1.6 --with-deps-drop

Vite-research vid Gate 1 ändrade Chat-rekommendation från Pure C till Strategi E — branschledar-validering är värdefullt golv. Men: Vite har **bug** i `cancelled() && !failure()`-pattern (workflow-level cancelled() fångar inte per-job-cancellation; empiriskt bekräftat Commit 1.5 timeout-run där ci-passed rapporterade success felaktigt). Vite har också **default-vana** att inkludera `--with-deps` på Playwright install — fragilt mot azure-mirror-hängningar (Commit 1.5 timeout 615s); Vite själva droppade det senare i sin ci.yml men det fanns i historisk research-pass. Generaliserbar regel: branschledar-mönster är **golvet, inte taket** — adoptera som default, men verifiera empiriskt mot vår kontext. Vid divergens: ändra dig hellre än följa blint. Mönster-förstärkning av K11 (designnoter ska verifieras): research-pass ska gå djupare än ytligt-mönster-igenkänning. Källa: Session 6 K1.D Commit 1.5/1.6 dubbel-bekräftad.

### K1.3 [lokalt] — Aggregator-jobb-mönster löser branch-protection vs conditional-skip-elegant

Datum: 2026-05-14 | Källa: Session 6 K1.C Strategi E-val

Strategi A (paths-ignore på jobb) bryter branch protection eftersom required check inte rapporterar. Vite-mönstret med `ci-passed`-aggregator (`if: always() && !contains(needs.*.result, 'failure') && !contains(needs.*.result, 'cancelled')`) löser detta genom att rapportera grön status om alla föregående jobb passerade eller skippades. CI-specifikt mönster — lokalt skördat. Generaliserbar regel inom CI-domän: vid villkorad-skip av kostsamma steg där required-status ska bibehållas, etablera aggregator-jobb istället för att modifiera trigger-paths.

### K1.4 [konsoliderat med K1.1 i hub] — Supply-chain-disciplin är paradigm-spanning (ADR-028 → ADR-029-utvidgning)

Datum: 2026-05-14 | Källa: Session 6 K1.C ADR-029 §6 design

Konsoliderat med K1.1 i hub-lyft. ADR-028 etablerades för npm-supply-chain. K1.C avslöjade att exakt samma SHA-pin + veckovis-granskning + advisory-monitoring-mönster gäller GitHub Actions-marketplace. Utvidgade ADR-028 till ADR-029 § Third-party Actions-policy istället för att skapa separat ADR. Generaliserbar regel: när en disciplin etableras för ett supply-chain-ekosystem, kontrollera om den gäller andra (cargo, pypi, gem, helm-charts, Docker base images) och utvidga befintlig ADR istället för att skapa separat.

### K1.5 [UNIVERSAL, hub-lyft] — Preventiv exklusion utan empirisk basis är genväg, inte försiktighet

Datum: 2026-05-14 | Källa: Session 6 K1.C Gate 2-kvalitetscheck (Marcus)

K1.C-planens initial lychee-scope utelämnade `tasks/*.md` med motiveringen "risk för broken links". Riskpåståendet var antagande, inte data — exakt det K11 förbjuder. Marcus' Gate 2-kvalitetscheck ("genväg = disciplin-brott") fångade det. Generaliserbar regel: vid scope-avgränsning, fråga (a) vilken empirisk data motiverar utelämning, (b) skulle senior-team utelämna detta, (c) är konsekvensen att förflyttning till framtiden acceptabel kostnad. Om något "nej" — det är genväg. K7-disciplin applicerad på scope: utelämning är semantik-beslut som ska kunna stå ensam, inte vara bekvämlighet smyggömd som design. Källa: Session 6 K1.C Gate 2 review 2026-05-13.

### K1.6 [lokalt] — Job-isolering kräver explicit cache för delade artefakter

Datum: 2026-05-14 | Källa: Session 6 K1.D Commit 1 regression (228s vs 95s)

Strategi E:s job-splittring från Vite-research isolerar test-jobbet från lint-jobbets runner-instans. Playwright-browsers (~150MB) cachas i `~/.cache/ms-playwright` och delades automatiskt mellan steg i monolit-jobb-arkitekturen. Vid job-splittring tappas automatik-cache → install måste ladda från scratch (+120s regression i K1.D Commit 1). Vite hanterar detta explicit med `actions/cache@v4` + `hashFiles('package-lock.json')`-key. CI-specifik insikt — lokalt skördat. Generaliserbar regel inom CI-domän: när CI-arkitektur splittas till parallella jobb, identifiera ALLA delade artefakter (binärer, build-cache, downloaded deps) och konfigurera explicit cache med stable-keys.

### K1.7 [UNIVERSAL, hub-lyft konsoliderat med K1.10] — K-disciplin-deklaration ≠ K-disciplin-tillämpning (meta)

Datum: 2026-05-14 | Källa: Session 6 K1.D fyra K11-fångster + K-sista-paket femte K11-fångst

K11 ("designnoter ska vara verifierade, inte påstådda") skördades i Fas 2 K0åc.2 (2026-05-11) och refererats 3+ gånger sedan. Trots det **fem K11-anti-mönster** i Session 6: (1) preventiv lychee-utelämning baserad på antagande (Marcus' Gate 2-fångst); (2) missad actions/cache för Playwright trots research-fynd (Commit 1 regression); (3) `--with-deps`-inkludering av default-vana (Commit 1.5 timeout); (4) Verify-4b Alt B "logisk slutsats"-frestelse (Marcus' val av Alt A); (5) K-sista-paket §1 antog sessionsdok-struktur tematiskt utan att verifiera mot K1-skelett-commit `120ef50` (Code:s STOPPA-OCH-FRÅGA fångade). Alla fångades externt — av Marcus' kvalitetscheck eller Code:s empiriska data. Mönster: **deklarerad disciplin ≠ tillämpad disciplin är inte automatisk översättning**. Generaliserbar regel: K-disciplinär checklist FÖRE PLANERA/IMPLEMENTERA-leverans = "Har jag verifierat varje icke-trivialt val mot empirisk data eller upstream-mönster? Varje utelämning mot senior-team-test? Varje strukturellt antagande mot etablerad konvention?". Disciplinär checklist är tyngre än disciplin-deklaration. Bekräftar Kandidat 15 (Chat-kontext lever inte över sessionsbyte) på meta-nivå: deklaration inom sessionen lever inte automatiskt vidare till nästa beslutspunkt utan aktiv re-applicering. Femte fångst i K-sista visar att även explicit "osäkerhets-flagga" (§0 i K-sista-paketet) inte är samma som stoppa-och-verifiera FÖRE leverans-design. Hub-lyft-värdighet: hög — meta-disciplin-mönster gäller alla K-tillämpningar oavsett domän.

### K1.8 [UNIVERSAL, hub-lyft] — Cache-key-strategy bör prioritera korrekthet över optimering

Datum: 2026-05-14 | Källa: Session 6 K1.D Commit 1.5 cache-key-val (jq vs hashFiles vs npm ls)

Tre kandidater övervägdes: (a) jq mot package.json semver-range, (b) hashFiles på lock-file (Vite-mönster), (c) npm ls efter npm ci. Trade-off: optimering (cache-miss-frekvens) vs korrekthet (cache-hit-validitet). Alt A:s "fel-version-cache-hit vid `^`-range-bump" är silent correctness violation — Playwright minor-bump via Dependabot ger jq-extract `1.60.0` men semver-range-rensning kan ge tidigare cache-key-träff på fel browser-binärer. Generaliserbar regel: vid CI-cache-design, prioritera **invalidation-correctness över invalidation-frequency**. Silent correctness violations är dyrare än explicit cache-miss-kostnad eftersom de manifesterar som mystiska runtime-fel utan tydlig orsak. Mönster-förstärkning av K18 i cache-domänen: cache-hit är **signal**, inte **sanning**; key-design är där korrektheten säkerställs. Källa: Session 6 K1.D Commit 1.5 override till Vite-konsekvent hashFiles-cache-key 2026-05-14.

### K1.9 [konsoliderat med K1.2] — Research mot upstream ändrar rekommendation 11/10 → mer-11/10

Konsoliderat med K1.2 i hub-lyft. Min ursprungliga Pure C-rekommendation byggde på generisk arkitektur-resonemang utan upstream-validering. Vite-research avslöjade Strategi E som branschledar-mönster. Att revidera rekommendation efter ny data är K11-disciplin, inte vacklande.

### K1.10 [konsoliderat med K1.7] — Default-vanor överlever K-deklaration

Konsoliderat med K1.7 i hub-lyft. K1.D §1.1 inkluderade `--with-deps` på Playwright install av default-vana — inte verifierat mot Vite-mönstret som droppat det. Tredje K11-anti-mönstret i K1.D. Empirisk fångst: 615s timeout på Commit 1.5 pga apt-hängning. Default-vanor överlever K-deklaration om aktiv re-verifiering inte sker.

### K1.11 [lokalt] — GHA `cancelled()` är workflow-level, inte per-job

Datum: 2026-05-14 | Källa: Session 6 K1.D Commit 1.5 timeout-bug-analys

Vites pattern (`!cancelled() && !failure()`) fungerar för dem mestadels pga failure-propagation i deras pipeline, men det är inte garanti. K1.D Commit 1.5 timeout cancellerade test-jobbet men ci-passed rapporterade success felaktigt. Korrekt pattern är `always() && !contains(needs.*.result, 'failure') && !contains(needs.*.result, 'cancelled')` — needs.*.result-array fångar per-job-cancellation explicit. GHA-specifik insikt — lokalt skördat.

### K1.12 [UNIVERSAL, hub-lyft] — Grindvakt-baseline avslöjar dold skuld; det är success-signal, inte session-blocker

Datum: 2026-05-14 | Källa: Session 6 K1.D Commit 2 lychee 81 errors

Strategi E etablerade lychee som ny markdown-link-grindvakt. Första körningen (Commit 2) avslöjade 81 broken links i 79 .md-filer — befintlig skuld som K3 åe manuellt-arbete missade. Detta är **kvalitetshöjning, inte session-blocker**. Per Marcus' Gate 2-disciplin + K7 (refactor/semantik-separation): defer batch-fix till egen mini-session (Session 6.5), fortsätt med ursprunglig session-scope. Generaliserbar regel: när ny automatiserad grindvakt etableras, accept-and-defer-mönstret är 11/10 — dokumentera fynden, defer batch-fix till egen mini-session, fortsätt med ursprunglig scope. Anti-mönster: panic-fix all findings i samma session bryter K7. Mönster-förstärkning: automatiserade kvalitets-checker etablerade vid lugn tid (mellan-fas-arbete) avslöjar skuld från tidigare arbete utan stress. Källa: Session 6 K1.D Commit 2 lychee-baseline + Marcus' Gate 2-defer-beslut 2026-05-14.

### K1.13 [UNIVERSAL, hub-lyft] — DEFERRED-FIX-MARKER-pattern > blanket fail-suppression

Datum: 2026-05-14 | Källa: Session 6 K1.D Commit 3 .lycheeignore design-beslut

För Session 6.5-defer av ~71 broken links: alternativ A (blanket `fail: false` på lychee), alternativ B (`.lycheeignore`-patterns med DEFERRED-FIX-MARKER-kommentar). Alt A tystar lychee helt under defer-fönstret — 10/10. Alt B är **per-rad spårbar TODO med tydlig borttagnings-trigger** — 11/10. Varje DEFERRED-FIX-MARKER-rad är scope-explicit och blir obsolet när motsvarande fix landar. När alla rader borttagna = Session 6.5 ✅ KLAR. Generaliserbar regel: vid defer-paket av flera distinkta items, föredra per-item-spårbart-defer över blanket-suppression. Spårbarhet är 11/10-disciplinens kärna. Mönster-förstärkning av K7 (refactor/semantik-separation): defer ska kunna stå ensam med tydligt scope, inte vara bekvämlighet smyggömd som design.

### K1.14 [UNIVERSAL, hub-lyft] — lychee + cross-doc-grep är komplementära kvalitetsverktyg vid fas-avslut

Datum: 2026-05-14 | Källa: Session 6 K1.D Commit 2 ADR-027-stack-skifte-drift-fångst

Bland kategori A-fynden i lychee-baseline: `KVALITETSDEFINITIONER-11.md` refererad istället för `KVALITETSDEFINITIONER-11-REACT.md`. Direkt drift från ADR-027 (Vue → React stack-skifte, Session 5b K3.5/K5) som K5.9c cross-doc-grep-rutinen inte fångade (rutinen sökte efter Vue-specifika strängar, inte länkmål-validering). Mönster: lychee fångar **referensdrift** (samma ord, fel länkmål); cross-doc-grep fångar **innehållsdrift** (samma faktum, olika ord). Båda missade automatiskt av varandra. Generaliserbar regel: fas-avsluts-disciplin ska köra båda check-typer parallellt. lychee i CI på docs-touching commits; cross-doc-grep manuellt vid fas-avslut (eller automatiserat i Fas 7-konsolidering). Mönster-förstärkning av K5.9c-rutinen — utvidgning från content-domän till referens-domän.

### K1.15 [lokalt] — Arkivzoner ska behandlas konsekvent över repo-domäner

Datum: 2026-05-14 | Källa: Session 6 K1.D Commit 3 lychee-baseline scope-inkonsekvens

K1.D Commit 3-baseline avslöjade scope-inkonsekvens: `tasks/sessions/archive/**` utelämnades från lychee-scope per ADR-023 frozen-zone-mall, men `docs/archive/**` ingick. Båda är samma arkiv-natur. Code:s rapport flaggade det; Commit 4a normaliserade. Generaliserbar regel (men CI-domän-specifik): när policy etableras för en arkiv-subkatalog (typ ADR-023 för sessions-arkiv), generalisera över alla arkiv-subkataloger vid samma tillfälle. Annars drar policy-drift gradvis. Mönster-förstärkning av K5.9c "cross-doc-konsekvens"-rutinen, applicerat på scope-policy-domän. Lokalt skördat — närliggande UNIVERSAL men hub-lyft-värdig endast vid bredare paradigm-bekräftelse.

### K1.16 [UNIVERSAL, hub-lyft] — Automatiserad grindvakt avslöjar oväntade drift-kategorier (emergent värde)

Datum: 2026-05-14 | Källa: Session 6 K1.D Commit 2 + Commit 3 lychee-baseline

K1.D-design förväntade content-drift-fynd (~30 stale refs efter ADR-021/K5.8b). lychee-baseline avslöjade **också**: (a) ~46 path-konstruktion-fel i `docs/analysis/`-rapporter (relativ-path-bug, oförväntad kategori); (b) scope-policy-drift (`docs/archive/**` vs `tasks/sessions/archive/**`-inkonsekvens, oförväntad kategori). Inga av dessa sökta efter mänskligt — alla fångades av grindvakten. Generaliserbar regel: automatiserad kvalitets-grindvakt designad för X-kategori-fångst tenderar att avslöja Y-kategori-drift som mänsklig review missat. Det är **success-signal av investeringen**, inte scope-creep. Mönster-förstärkning av K1.12 ("grindvakt avslöjar dold skuld") — utvidgning från känt-okänt (förväntade kategorier) till okänt-okänt (oförväntade kategorier). Källa: Session 6 K1.D Commit 2 + Commit 3 lychee-baseline 2026-05-14.

### K1.17 [UNIVERSAL, hub-lyft] — tj-actions/changed-files@v47.0.6 UTF-8-glob-bug för non-ASCII-paths

Datum: 2026-05-14 | Källa: Session 6 K1.D Commit 4b UTF-8-glob-fail + Commit 4c ASCII-trigger

tj-actions/changed-files v47.0.6 returnerade `should_skip_tests:false` + `docs_changed:false` för Commit 4b trots .md-ändring (`docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` med svenska tecken Ä). `git show --name-only` returnerade UTF-8-escape `BYGGPLAN-L\303\204TTL\303\204ST-v3.md`. Glob-pattern `**/*.md` i `files`-input matchade inte — antagligen pga UTF-8-encoding-skillnad mellan git-output och tj-actions-glob-engine. Verifierat: ASCII-path-ändringar (Commit 4c tasks/todo.md) triggade korrekt. Generaliserbar regel: vid val av third-party Action med glob-pattern-matching mot filnamn, verifiera empiriskt mot non-ASCII-paths om repot har internationaliserade filnamn. Hub-lyft-värdighet: hög — alla repos med internationaliserade dokument-namn riskerar samma bugg. Reproducerbarhet bör testas separat före ev. ADR-030 eller upstream-issue. Källa: Session 6 K1.D Commit 4b UTF-8-glob-fail 2026-05-14.

### Sammanfattning Session 6

17 lessons-kandidater skördade. 10 hub-lyfta (K1.1, K1.2, K1.5, K1.7, K1.8, K1.12, K1.13, K1.14, K1.16, K1.17), varav K1.1+K1.4 konsoliderade och K1.7+K1.10 konsoliderade i hub. 5 lokala (K1.3, K1.6, K1.11, K1.15 + sub-fragment), 2 konsoliderade in i hub-rader. K-paradigm-spannande sammanfattning: supply-chain (K1.1+K1.4), meta-disciplin (K1.7+K1.10), branschledar-verifikation (K1.2+K1.9), anti-genväg (K1.5+K1.13), grindvakts-värde (K1.12+K1.16), tooling-bug-medvetenhet (K1.17). Strategi E etablerad som kanonisk CI-arkitektur per ADR-029.

### Retroaktiv-skörd 2026-05-14 (post-K-sista, process-uppdaterings-commits)

Två lessons-kandidater som inte fanns på K-sista lessons-skördens radar (17 ursprungliga). Skördade retroaktivt efter Marcus' process-feedback-runda och Code:s symlänk-tooling-quirk under process-uppdaterings-commits. Mönster bekräftar K1.19 — meta-process-observation kräver post-session-distance.

### K1.18 [lokalt] — Edit-verktyget vägrar skriva via symlänk; använd real-path

Datum: 2026-05-14 | Källa: Session 6 retrospektiv process-uppdaterings-commits 2026-05-14

Hub-CLAUDE.md är symlänkad från `~/.claude/CLAUDE.md → ~/Repon/marcus-system/CLAUDE.md` (Claude Code globala-konfig-konvention). Vid hub-edits via Edit-verktyg: edit-anropet vägrar skriva genom symlänk-path. Workaround: redigera real-path direkt (`~/Repon/marcus-system/CLAUDE.md`). Symlänken läser sedan rätt innehåll vid filresolution. Generaliserbar regel: vid edits mot konfig-filer som har symlänk-aliases, peka edit-verktyget mot real-path, inte alias. Operativ tooling-kunskap för hub-disciplin — inte regel-nivå, inte ADR-värdig.

### K1.19 [UNIVERSAL, hub-lyft] — Process-friction blir synligt först i retrospektiv

Datum: 2026-05-14 | Källa: Session 6 retrospektiv post-K-sista process-feedback-runda

Tre process-friction-punkter (Chat-output-otydlighet, popup-friction, sessionsdok-visibility-förlust) blev synliga FÖRST när Session 6 var formellt avslutad och Marcus fick distans till workflow:et. Inga av dem fanns på radarn för K-sista lessons-skörden (17 kandidater) trots intensiv K-disciplin-iteration. Mönster: meta-process-observation kräver post-session-distance; lessons-skörd inom sessionen fångar bara fenomen Code/Chat identifierar under arbete. Generaliserbar regel: sessionsslut är inte sluttillstånd för lessons-skörd — det är checkpoint för första-meta-observation. Lessons-skörd ska revisiteras vid nästa sessions K0 efter Marcus haft tid att reflektera. Bekräftar K15 (Chat-kontext lever inte över sessionsbyte) på meta-meta-nivå: även sessionens egen meta-observation kräver utanför-sessionen-perspektiv för att bli synlig. Hub-lyft-värdighet: hög — gäller alla projekt med session-arbetsflöde.

## 2026-05-14 — Session 6.5 (Broken-links-batch + recovery)

Session 6.5 etablerade DEFERRED-FIX-MARKER-eliminations-arbete: 54 broken refs fixade i 6 fix-commits + 1 disciplin-utvidgning (ADR-022 kategori 4) + 1 revert (K3 v1 path-matematik-fel). 15 lessons-kandidater skördade — majoritet mönsterförstärkningar av tidigare regler (K10, K11, K15, K16, K38, K1.16, K1.19). 13 av 15 [UNIVERSAL] för hub-lyft.

### K2.1 [UNIVERSAL, hub-lyft] — Pattern-baseline-klassning kan visa sig vara förenklad efter empirisk grep

Datum: 2026-05-14 | Källa: Session 6.5 K3 RAPPORTERA Block 2 (B.1+B.2 = samma skuld)

ADR-029 baseline klassade B.1 ("path-konstruktion utan ../") och B.2 ("analys-internal bare-name") som separata kategorier. Empirisk verifikation visade att de var samma skuld (path-konstruktion utan korrekt prefix); B.2 var bara 5-6 B.1-refs felklassade. Mönsterförstärkning av K1.16: grindvakts-baseline-klassning är hypotes, inte sanning. Generaliserbar regel: baseline-klassning bör formuleras som "pattern-grupp X" snarare än "X separata kategorier". Faktisk fördelning per pattern-rad verifieras empiriskt vid implementation, inte vid baseline-design.

### K2.2 [UNIVERSAL, hub-lyft] — Chat-prompt-spec driver mot faktisk repo-state (K10-Chat-sidan)

Datum: 2026-05-14 | Källa: Session 6.5 K3 filnamn-glitch (Code-verification-of-codex-analysis.md vs -2026-05-07.md)

Min K3-prompt skrev `Code-verification-of-codex-analysis-2026-05-07.md`, faktisk B.1-skuld-fil var utan datum-suffix. Code:s K11-disciplin fångade glitchet. Generaliserbar regel: K10-disciplin gäller även Chat-sidans prompt-spec — siffror, filnamn, paths driver mellan analyssession och implementations-prompt. K-prompter som refererar specifika filer/paths/rader ska antingen (a) re-verifieras mot HEAD innan prompt levereras, eller (b) inkludera explicit `LÄS först — verifiera fil-existens innan IMPLEMENTERA`-steg. Default-antagande "Chat-kontext synkad med repo-HEAD" är fel.

### K2.3 [UNIVERSAL, hub-lyft] — Visa-text-uppdatering utan länkmål-uppdatering är klassisk markdown-drift-bug

Datum: 2026-05-14 | Källa: Session 6.5 K2.3 STOPPA-OCH-FRÅGA (tasks/todo.md:92)

K5.8 av Session 5b sessionsdok-arkivering uppdaterade visa-text i markdown-länk `[archive/2026-05/...](mål)` men missade länkmål. Klassisk markdown-drift: visa-text är vad läsaren ser i prosa, länkmål är "osynligt" tills någon klickar. lychee fångar; cross-doc-grep missar (matchar visa-text och exkluderar raden). Generaliserbar regel: strukturell svaghet i markdown-formatet, inte mänsklig disciplin-svaghet. Mönsterförstärkning av K1.14 (lychee + cross-doc-grep är komplementära) — applicerat på samma-fil-divergens-fall.

### K2.4 [UNIVERSAL, hub-lyft] — Path-matematik i markdown-länkar: djup N kräver N ".."

Datum: 2026-05-14 | Källa: Session 6.5 K3 v1 broken (../-prefix istället för ../../)

K3 v1-prompt designade sed-pattern med `../`-prefix för docs/analysis/-djup. Korrekt path-matematik: djup 2 från repo-root kräver `../../` (en .. per nivå upp). Banal regel som missades pga prompt-design utan empirisk verifikation. Generaliserbar regel: vid pattern-design för markdown-länkar, räkna nivåer från fil-position till mål — en `..` per nivå upp. Verifiera empiriskt via dry-resolv av en stickprov-länk INNAN pattern-applicering. Mönsterförstärkning av K11 ("verifiera, inte påstå") — applicerat på path-matematik.

### K2.5 [UNIVERSAL, hub-lyft] — Form-tolerant grep: filändelse-pattern måste tolerera (#Lxx)?-anchor

Datum: 2026-05-14 | Källa: Session 6.5 K3 v1 B.2-grep missade 3 träffar

K3 v1 B.2-grep krävde `)` direkt efter filändelse: `\.(ts|tsx|css|js)\)`. Faktisk form i flera refs: `\.(ts|tsx|css|js)#Lxx)`. 3 träffar förbisedda → exposed vid `.lycheeignore` B.2-borttagning. Generaliserbar regel: filändelse-pattern i grep ska tolerera optional anchor mellan filändelse och stängande `)`: `\.(ts|tsx|css|js)(#[^)]+)?\)`. Tillämpning av K38 (VERIFIERA-grep form-tolerant) på path-pattern-domän.

### K2.6 [UNIVERSAL, hub-lyft] — Dry-run-disciplin: diff-räkning ≠ resolution-test

Datum: 2026-05-14 | Källa: Session 6.5 K3 v1 broken (24 ändringar dry-run, 25 errors lychee)

K3 v1 dry-run visade 21 ändrade rader vilket matchade förväntan — Code stämplade pattern som säker. Men "diff-räkning matchar" säger inget om huruvida de N ändringarna producerade KORREKTA länkar. K3 v2 introducerade resolution-test: cd till fil-position + `test -f` för 5 stickprov post-fix. 5/5 grön = empiriskt bevis. Generaliserbar regel: vid sed-pass på path-pattern, dry-run-disciplin kräver TVÅ separata checks: (a) substitution-räkning (diff matchar förväntan), (b) resolution-test (fixade refs resolvar till existerande filer). Skillnaden är 9/10 vs 11/10-disciplin.

### K2.7 [UNIVERSAL, hub-lyft] — Chat-prompt med pattern-design bär K11-disciplin

Datum: 2026-05-14 | Källa: Session 6.5 K3 v1 mönstrad-design-fel

K3 v1-prompten levererade sed-pattern utan empirisk verifikation av path-matematik. Code följde prompten korrekt; mitt fel propagerade. Generaliserbar regel: när Chat designar pattern (sed-regex, glob, classifier, lint-rule) som Code ska exekvera mekaniskt, Chat:s K11-disciplin innebär empirisk dry-resolv mot stickprov INNAN prompt levereras. Mönsterförstärkning av K15 (nedskriven regel ≠ tillämpad regel): K11 är skriven, men tillämpades inte konsekvent i K3-prompten.

### K2.8 [UNIVERSAL, hub-lyft] — "Broken CI på main"-handover-disciplin

Datum: 2026-05-14 | Källa: Session 6.5 K3 v1 STOPPA-OCH-FRÅGA-mönster

När Code:s K3 v1 producerade 25 lychee-errors var första-instinkten "fixa det själv" tillgänglig. Code valde STOPPA-OCH-FRÅGA istället, med 3 alternativ klassificerade per destruktivitet (A icke-destruktiv revert / B forward-fix / C destruktiv force-push avvisad per Git Safety Protocol). Generaliserbar regel: när invariant brutits (CI grön på main), recovery-strategi-val ska lyftas till Marcus, inte autonomt försökas. Mönsterförstärkning av K1.13 (per-item spårbar defer > blanket-suppression) — applicerat på recovery-strategi-domän.

### K2.9 [lokalt] — .lycheeignore-ändringar triggar Test+Build via Strategi E

Datum: 2026-05-14 | Källa: Session 6.5 K2.1 + K2.3 + K2.4 + K3 v2 + K2.2 CI-mönster

`.lycheeignore` är på repo-rot-nivå och inte i changed-files-pattern `docs/`-glob. Per Strategi E (ADR-029) klassas det som non-docs → Test + Build körs istället för doc-only-skip. Empiriskt: alla 6 K2.x/K3-commits hade ~80-95s CI-tid istället för ~35s doc-only-mönstret. Inte fel — design-konsekvens. Generaliserbar regel inom CI-domän: rot-level config-filer som påverkar docs-validation (lychee-config, prettier-config för markdown, etc.) klassas som non-docs i Strategi E. Empiriskt observable men inte blocker. CI-specifikt mönster — lokalt skördat.

### K2.10 [lokalt] — .lycheeignore-rad-numrering driver inom samma session — K10-tillämpning

Datum: 2026-05-14 | Källa: Session 6.5 K2.3/K2.4/K3-progressionen

K1 RAPPORTERA listade `.lycheeignore`-rader 35/38/41/44 som A.1/A.2/A.3/A.4-positioner. Varje commit som tog bort en rad skiftade resterande raders position. Code:s re-verifiering mot HEAD vid varje K-start var korrekt disciplin. Generaliserbar regel: vid sekventiella edits mot samma config-fil, rad-numrering är endast giltig vid läs-tillfället. K-prompter ska be om re-verifiering mot HEAD, inte återanvända rad-pekare från tidigare K. CI-specifikt mönster — lokalt skördat (men generaliserar till alla iterativa config-fil-edits).

### K2.11 [UNIVERSAL, hub-lyft] — Källa-pekare till etablerings-session i nya disciplin-regler

Datum: 2026-05-14 | Källa: Session 6.5 K2.2 ADR-022 kategori 4-utvidgning

ADR-022 kategori 4-text inkluderade explicit "(Etablerad i Session 6.5 2026-05-14 efter empirisk K3-fångst...)" — källa-pekare till sessionsdok där disciplinen empiriskt etablerades. Generaliserbar regel: nya disciplin-regler i ADR ska ha källa-pekare till sessionsdok där de empiriskt etablerades. Annars driver "varför finns regeln?" snabbt bortom återhämtbar historik. Mönsterförstärkning av sessions-trail-disciplin: ADR är what + how, sessionsdok är why + when.

### K2.12 [UNIVERSAL, hub-lyft] — Polish-uppdatering inom samma semantik-domän är 11/10

Datum: 2026-05-14 | Källa: Session 6.5 K2.2 .lycheeignore fil-header-uppdatering

Code:s K2.2-implementation upptäckte att Block 2-borttagning gjorde `.lycheeignore` fil-header-noten internt inkonsekvent (gamla noten refererade Block 2-baseline). Code uppdaterade headern proaktivt inom samma commit. Generaliserbar regel: när huvud-ändring i en fil har konsekvenser för annan del av samma fil i samma semantik-domän, polish-uppdateringen INOM commit-scope är 11/10, inte scope-creep. K7-tillämpning omvänd: scope-disciplin är inte "lämna allt utanför primär-ändring orört", det är "ta med konsekvenser av primär-ändring som är semantiskt sammanhängande". Mönsterförstärkning av K15 (internalisera disciplin, inte bara deklarera den).

### K2.13 [UNIVERSAL, hub-lyft] — Projektkunskap i Claude.ai är inte synkad med HEAD per default

Datum: 2026-05-14 | Källa: Session 6.5 process-feedback om 4-zoner-mall

Vid sessionsstart läste Chat marcus-system + miranon-media-admin CLAUDE.md men hittade inte nyligen-etablerad ## Chat output-disciplin (commit `c06d3ff` samma dag). Chat uppfann egen regel parallellt med befintlig, skapade förvirring. Generaliserbar regel: projektkunskap i Claude.ai är ETL-batch-synkad, inte realtid-synkad mot HEAD. Vid sessionsstart om CLAUDE.md-tilläggen kan ha tillkommit nyligen, verifiera explicit (a) "när uppdaterades projektkunskapen senast?" till Marcus, eller (b) Marcus får sessionsstart-not "klicka Update om CLAUDE.md ändrats sedan senaste session". Default-antagande "projektkunskap = HEAD" är fel. Mönsterförstärkning av K1.18 (symlänk-edits) + K1.19 (process-friction synligt först i retrospektiv): projektkunskaps-synk är liknande tooling-quirk.

### K2.14 [UNIVERSAL, hub-lyft] — Chat-output 4-zoner-mall fanns redan; jag uppfann egen parallellt

Datum: 2026-05-14 | Källa: Session 6.5 process-feedback (Marcus' fångst)

Efter Marcus' feedback om format-otydlighet (prosa-resonemang vs Code-prompter blandade) försökte jag uppfinna nytt format `═══` istället för att söka efter befintlig regel. Marcus pekade på hub-CLAUDE.md ## Chat output-disciplin (commit `c06d3ff` samma dag) som etablerar 4-zoner-mall med `═══ <ZON-NAMN> ═══`-markörer. Generaliserbar regel: vid första instinkt att uppfinna ny disciplin-regel som svar på feedback, sök först om befintlig regel finns. Disciplinerad regel-katalog tenderar att redan ha svaret — uppfinnandet är genväg, sökningen är 11/10. Mönsterförstärkning av K1.19 (process-friction blir synligt i retrospektiv): nya regler är ofta redan dokumenterade men ovetenskap-internaliserade.

### K2.15 [UNIVERSAL, hub-lyft] — Disciplin-arbete kräver Gate 2-review innan IMPLEMENTERA

Datum: 2026-05-14 | Källa: Session 6.5 K2.2 RAPPORTERA+PLANERA-mönster

K2.1/K2.3/K2.4/K3 v2 var mekanisk fix-disciplin (sed + verifiering, en commit). K2.2 var disciplin-utvidgning (ADR-022 text-redigering + `.lycheeignore`-strukturell-omflyttning). För disciplin-arbete delades K2.2 i RAPPORTERA+PLANERA → STOPPA → IMPLEMENTERA, även om scope (1 fil + 1 config-fil) var mindre än K3 v2 (1 fil + 1 config-fil + 24 sed-fixes). Generaliserbar regel: scope-storlek ≠ Gate 2-behov. Mekanisk fix kan gå direkt till IMPLEMENTERA med dry-run-disciplin. Text-design + policy-utvidgning kräver Gate 2-review oavsett scope-storlek, eftersom konsekvenser är icke-mekaniska (framtida läsare måste förstå disciplin-tillämpning). Mönsterförstärkning av K7 (refactor/semantik-separation) applicerat på K-fas-design: disciplin-arbete är semantik-fas, kräver review.

### Sammanfattning Session 6.5

15 lessons-kandidater skördade — större skörd än K1-baseline antagit. 13 hub-lyfta (K2.1, K2.2, K2.3, K2.4, K2.5, K2.6, K2.7, K2.8, K2.11, K2.12, K2.13, K2.14, K2.15). 2 lokala (K2.9, K2.10). Mönsterförstärkning av K1.16 (grindvakt avslöjar oväntade kategorier): Session 6.5 var planerad som mini-städning (~3-5 lessons förväntan), faktisk skörd 15 — emergent värde av defer-arbetet i sig. K3 v1-revert var pivotal: utan failet hade K2.4/K2.5/K2.6/K2.7/K2.8 inte funnits. "Försök som behövde reverteras" var lessons-rikast del av sessionen.

## 2026-05-14 — Session 6.6 (Docs-grindvakter + frontmatter-policy + observations-pass)

### K7.1 [UNIVERSAL, hub-lyft] — Frontmatter-migration är möjligt-omöjligt-test för befintlig prosa

Datum: 2026-05-14 | Källa: Session 6.6 K7.A pre-flight Fångst #1

Innan föreslå "behåll info i ny form" vid metadata-migration, verifiera empiriskt om infon redan finns annorstans. Generaliserbar regel: vid metadata-konsolidering är pre-flight-fråga "är denna prosa unik eller duplicerad?" — om duplicerad, ta bort utan ersättning; om unik, bevara/transformera. Mönsterförstärkning av K2.14 (sök befintliga lösningar) tillämpad på domän-migration.

### K7.2 [UNIVERSAL, hub-lyft] — Migration är möjlighet för stale-detection

Datum: 2026-05-14 | Källa: Session 6.6 K7.A Fångst #2 bonus-fynd

Frontmatter-migration auditerar manuella metadata-värden mot faktisk state. I K7-empirisk audit visade 3 av 10 filer stale "Senast uppdaterad"-värden — CLAUDE.md (8 dagar stale + fundamentalt fel kontext), BYGGPLAN-LÄTTLÄST (1 dag), SECURITY-SPEC (potentiellt). Generaliserbar regel: bulk-migration av metadata är gratis tillfälle för stale-detection eftersom varje fil tvingas öppnas. Pre-flight-disciplin: vid migration, jämför pre-värde mot ground-truth FÖRE skriv-pass.

### K7.3 [UNIVERSAL, hub-lyft] — Verifiera både INNEHÅLL och ROLL innan borttagning av metadata-prosa

Datum: 2026-05-14 | Källa: Session 6.6 K7.A Fångst #1 reviderad

Rader har funktioner, inte bara substans. tasks/lessons.md rad 12 hade datum-stämpel (substans → ersätts av frontmatter) OCH quick-reference/orienterings-anchor (roll → unik, måste bevaras). Generaliserbar regel: vid metadata-migration, klassificera per-rad i (a) substans-roll, (b) struktur-roll, (c) navigations-roll. Bara substans-roll får ersättas av frontmatter; struktur + navigation kräver behållning eller eksplicit re-routing.

### K7.4 [UNIVERSAL, hub-lyft] — Roll-bevarande > substans-renhet vid migration

Datum: 2026-05-14 | Källa: Session 6.6 K7.A Fångst #2

Per-fil-empirisk-analys > generalisering. 10-fil-audit visade 4 distinkta roll-kategorier: (1) datum-stämpel (frontmatter ersätter), (2) roll-flagga (bevara, ta bort datum-del), (3) quick-reference med stale-fix (bumpa + reformulera), (4) ingen prosa (bara frontmatter-add). Generaliserbar regel: vid migration, refaktorera per-fil enligt roll, inte enligt en-storlek-passar-alla-pattern. Mönsterförstärkning av K7 (refactor/semantik-separation) tillämpat på doc-migration.

### K7.5 [UNIVERSAL, hub-lyft] — Frontmatter auto-bump täcker datum-drift, INTE kontext-drift

Datum: 2026-05-14 | Källa: Session 6.6 K7-design

Pre-commit hook auto-bumpar `updated:` mekaniskt. Det löser datum-drift (manuell "Senast uppdaterad"-fält som glöms). Det löser INTE kontext-drift — kontext-rader (typ projekt-CLAUDE.md rad 3 "Fas 2 startar nästa session") kräver semantisk uppdatering vid relevant händelse. Generaliserbar regel: mekanisk auto-hook kan inte vara semantisk validator; kontext-rader hör hemma i sessionsavslut-checklista eller periodisk review_by-prompt. Mönsterförstärkning av "tooling-quirk vs review-disciplin"-distinktionen (K1.18 + K2.13).

### K7.6 [UNIVERSAL, hub-lyft] — Hub-spoke-portabilitet är default-arkitektur, hårdkodning kräver explicit motivering

Datum: 2026-05-14 | Källa: Session 6.6 K7.B Fångster #3 + #4 (Marcus' Gate 2)

Skriptens LOGIK är universell (kan dupliceras till andra spokes utan refactor); VÄRDEN lever i `.<grindvakt>-policy.conf` per-projekt. Hardkodning av projekt-specifika paths/listor i skript är anti-mönster. Branschpraxis-bevisning: `.eslintrc` + `.prettierrc` + `.markdownlintrc` + `.vale.ini` är alla separata config-filer per grindvakt — vår konvention följer samma separation. Generaliserbar regel: vid CI-grindvakt-design, default är "config-driven från start"; hårdkodning är genväg som propagerar systematiskt om inte fångad tidigt (klass-tänkande). Etablerad som "Ristat i sten" i hub-CLAUDE.md vid Session 6.6 K-sista commit #2.

### K7.7 [UNIVERSAL, hub-lyft] — Datum-stämplar i Code-prompter måste verifieras mot TODAY vid exekverings-tid

Datum: 2026-05-15 | Källa: Session 6.6 K7.C Fångst #5 (Code Gate 2)

Code-prompter med datum-stämplar måste kategoriseras: "historisk-stabil" (etablerings-datum, ADR-domän) vs "löpande-mekanisk" (frontmatter `updated:`, TODAY-relativ). Båda är korrekta i sina respektive domäner. Anti-mönster: ärva datum från föregående K-fas utan kategori-klassning. K7.C-prompten ärvde `updated: 2026-05-14` från ADR-030 men exekverades 2026-05-15 — Code fångade att TODAY-validering hade failat. Generaliserbar regel: vid Code-prompt-design, fråga per datum-stämpel "är detta etablerings-datum (fixt) eller bump-datum (TODAY)?".

### K7.8 [UNIVERSAL, hub-lyft] — Gate 2-disciplin är inte aktör-specifik

Datum: 2026-05-15 | Källa: Session 6.6 K7.C Fångst #5 generaliserad

Gate 2-review (K2.15) är inte begränsad till Marcus. Code + ev. andra aktörer med ground-truth-tillgång + skarp empirisk fråga är legitima Gate 2-utövare. K7.C-Fångst #5 var Code-fångad datum-drift. K7.5 Block A var Code-fångad handoff-fil-strukturell-drift ("Del 1.5"). Generaliserbar regel: design för Gate 2 från alla aktörer som har ground-truth-perspektiv — Chat (hög-nivå design), Code (filsystem + CI ground-truth), Marcus (intentions-ground-truth + cross-projekt-konsekvens). Mönsterförstärkning av K2.15-generalisering.

### K7.5.1 [UNIVERSAL, hub-lyft] — Handoff-fil-design med fil-strukturella referenser kräver empirisk verifikation FÖRE bake-in

Datum: 2026-05-15 | Källa: Session 6.6 fortsättning #2 K7.5 Block A Gate 2-fångst (Code)

Code fångade vid K7.5 Block A att handoff-fil refererade "ADR-030 § Del 1.5" som inte existerade i ADR-030 (Del 1-4). Ärvt från ci.yml-kommentar-drift som propagerades i K7.D-bake-in utan empirisk verifikation. Generaliserbar regel: handoff-fil-design som refererar specifika doc-sektioner/rader/IDs ska antingen (a) verifieras empiriskt mot HEAD vid bake-in, eller (b) använda neutral referens ("position #5 i Del 1" istället för "Del 1.5"). Mönsterförstärkning av K7.7 (verifiera vid exekverings-tid) + Disciplin #6 (empirisk verifikation FÖRE design-ratifikation).

### K7.5.2 [UNIVERSAL, hub-lyft] — CI-kommentarer som refererar interna doc-sektioner kan drifta utan grindvakt-fångst

Datum: 2026-05-15 | Källa: Session 6.6 fortsättning #2 K7.5 Block A bonus-fynd

ci.yml rad 124 har refererat icke-existerande "ADR-030 § Del 1.5" sedan K5-implementationen f408469 (2026-05-14) — ej fångat av någon av 5 grindvakter eftersom lychee fångar URL/file-refs men inte text-referenser till ADR-sektionsrubriker. Mitigation-domän: ny grindvakt-kategori (CI-kommentar-referens-validator) eller manuell sessionsavslut-disciplin. Mönsterförstärkning av K1.16 (grindvakt avslöjar oväntade kategorier — här FRÅNVARO av grindvakt avslöjar drift-domän). Generaliserbar regel: CI-konfig-filer behöver egen "drift mot doc-referens"-validator om de innehåller doc-sektion-pekare.

### K7.5.3 [UNIVERSAL, hub-lyft] — Chat ska ifrågasätta ramen, inte bara rangordna inom den

Datum: 2026-05-15 | Källa: Session 6.6 fortsättning #2 K7.5 Block A (Marcus' "vad hade ett seniorproffs valt?"-fångst)

Vid A/B/C-fråga är default-instinkt "välj bästa av A/B/C" — instans-tänkande. Klass-tänkande är "är A/B/C rätt klass av svar, finns alt D utanför ramen?". I K7.5 Block A presenterade Chat A/B/C för ADR-030 § Del 1.5-fråga; Marcus' "11/10?"-fråga avslöjade Alt D (root cause-fix + minimal ADR-pekare + ci.yml-fix). Generaliserbar regel: när Chat presenterar alternativ till Marcus, default-pre-check är "är någon av dessa fel klass, finns 11/10-alt utanför ramen?". Mönsterförstärkning av K2.14 + Meta-lesson #3 (klass-tänkande > instans-tänkande).

### K7.5.4 [UNIVERSAL, hub-lyft] — Pre-existerande warning-profil ≠ normativ standard

Datum: 2026-05-15 | Källa: Session 6.6 fortsättning #2 K7.5 slutrapport (Marcus' 11/10-påminnelse)

När nya filer skapas i samma klass som befintlig-med-warnings, lyfter 11/10-disciplin hela klassen — INTE matchar pre-existerande 9/10-nivå. "Identisk warning-profil som X" är motivering vid första instans men anti-mönster vid replikering. K7.5 reproducerade SC2034-warning-profil från `.frontmatter-policy.conf` (K7.C 2026-05-15) i ny `.checklist-policy.conf`; Marcus 11/10-fångade och båda filerna fick file-level disable-fix. Mönsterförstärkning av K7.6 (klass-tänkande, hub-spoke-portabilitet inkluderar kvalitets-baseline). Mitigation-domän: shellcheck-strict-grindvakt (Session 6.6.7) bör inkludera "0 warnings + 0 errors", inte bara "0 errors".

### K9.1 [UNIVERSAL, hub-lyft] — Mekanism-installation ≠ mekanism-aktivering, och ibland är gap MEDVETET i ADR

Datum: 2026-05-15 | Källa: Session 6.6 fortsättning #2 K9 Block C

K9 avslöjade att `ci-passed`-aggregator finns sedan ADR-029 men gate:as inte på main (404 "Branch not protected"). Initial klassning (Chat-eskalering) "arkitektur-bug på ADR-029-nivå". Korrekt klassning efter ADR-verifikation: design-medveten defer per ADR-029 § Konsekvenser ("om Marcus aktiverar senare"). Generaliserbar regel: verifiera ADR-status FÖRE klassificering — "saknas och borde finnas" (bug) vs "saknas och ADR planerar manuell aktivering" (design-medveten gap). Mitigation skiljer sig: bug → scope-utvidgning + ADR-utvidgning; design-medveten gap → tasks/todo.md-pinpoint för manuell action. Mönsterförstärkning av K7.7 + Disciplin #6.

### K-sista.1 [UNIVERSAL, hub-lyft] — Chat:s 11/10-disciplin på Code:s output måste appliceras LIKA på Chat:s egen analys

Datum: 2026-05-15 | Källa: Session 6.6 fortsättning #2 K9 post-rapport (Marcus' "tänk alltid 11/10"-påminnelse → self-review)

Chat kritiserade Code:s "K17-policy"-referens som odefinierad (11/10 på Code) medan Chat samtidigt eskalerade "arkitektur-bug på ADR-029-nivå" utan att verifiera ADR-029 (9/10 på sig själv). Meta-klass-blindhet: 11/10-disciplin på output appliceras INTE lika på self-analys. Generaliserbar regel: Chat:s default-klassningstendens behöver hårdare guard — sök projektkunskap för relevant ADR/spec FÖRE klass-eskalering, inte EFTER Gate 2-påminnelse. Marcus' 11/10-påminnelser fångar meta-blindhet konsekvent (Session 6.6 fortsättning #2: 3 instanser inom samma session). Mönsterförstärkning av K7.5.3 (ifrågasätt ramen) + Meta-lesson #3 (klass-tänkande). Mitigation-domän: Chat self-review-skill (Session 6.7 skills-arkitektur-kandidat).

### K-sista.2 [UNIVERSAL, hub-lyft] — Forward-pekare i todo.md mellan arkiverings-commit och pre-arkiv-state är ny drift-domän

Datum: 2026-05-15 | Källa: Session 6.6 fortsättning #2 K-sista commit #1-hotfix 4e80647

K-sista commit #1 (01f5cbb) lade till todo.md-pekare med post-arkiv-path för Session 6.6 sessionsdok, men sessionsdok arkiveras INTE förrän commit #3. lychee fångade broken link i CI (path existerade inte än). Hotfix 4e80647 fixade pekaren till pre-arkiv-path; denna commit #3 re-pointar till post-arkiv-path atomiskt med arkiveringen. Drift-domän: trail-link-pekare som "ser framåt" mot framtida arkiverings-state är broken vid pre-arkiv-commit. Mitigation: arkiverings-pekare i andra docs committas EFTER faktisk arkivering, eller två-fas-update (pre-arkiv path, post-arkiv re-point atomiskt med arkivering). Generaliserbar regel: vid multi-commit-arkiveringssekvenser, trail-links får inte peka mot framtida path-state. Mönsterförstärkning av K1.16 (grindvakt avslöjar oväntade kategorier — lychee avslöjar tidsförskjuten-pekare-drift) + K7.5.1 (handoff-fil-strukturella-referenser empiriskt verifierade FÖRE bake-in). Mitigation-domän: K-sista-disciplin "ordna commits så att arkiverings-pekare alltid är post-arkiv inom samma commit som arkiveringen själv".

### Sammanfattning Session 6.6

15 lessons-kandidater skördade (alla [UNIVERSAL] för hub-lyft). Domän-fördelning: K7-fasen 8 (handoff-fil-skördade vid K7.D), K7.5-fasen 4 (Code Gate 2 + Marcus 11/10-fångster), K9-fasen 1 (branch-protection ADR-029-status-verifikation), K-sista 2 (Chat meta-klass-blindhet + forward-pekare drift-domän). Mönsterförstärkning av K1.16 (grindvakt avslöjar oväntade kategorier) på meta-nivå: process-investering-session avslöjar både domän-lessons OCH meta-lessons om Chat/Code/Marcus-trippel-Gate 2-disciplin. 4 Gate 2-fångster av Marcus, 2 av Code, 1 av Chat self-review (efter Marcus' 11/10-påminnelse), 1 av lychee-grindvakt (commit #1-hotfix → K-sista.2). Konsoliderad till 5 hub-rader vid K-sista commit #2 hub-sync (commit 173e75b). K-sista.2 är retroaktiv skapelse i commit #3 — hub-K6.6.4-rad refererar inte K-sista.2 explicit (framtida polish-flagga, ej blocker).

---

## 2026-05-16 — Session 6.6.5 (Dependabot-strategi 2026)

### L1 [UNIVERSAL, hub-lyft] — Pre-K-implementation forensisk-pass GLOBAL regel

Datum: 2026-05-16 | Källa: Session 6.6.5 K1.5 Marcus' stopp-och-fångst pre-K2.1

Vid varje förslag som modifierar filer eller config som rörts i senaste 1-2 sessioner: sök projektkunskap för relevant trail + Code rekonstruerar fil-historik FÖRE förslag-formulering. "Pre-existing"-klassning är inte ursäkt — den är signal att läsa varför state är som det är. Disciplinen tillämpas särskilt på CI-config, grindvakts-design, frontmatter-policy och liknande nyligt-etablerad infrastruktur där designval kan vara medvetna men ej dokumenterade i prosa. Anti-mönster: "Det här ser ut som en bugg, vi fixar det" → riskerar att riva ner medvetet designval från igår. Mönster: "Det här ser ut som en bugg → vad sa K-sista-trail om detta? Vad sa ADR? Vad sa lessons? FÖRST då formulera fix-förslag." Mönsterförstärkning av K-sista.1 (Chat:s self-review-disciplin) + Disciplin #6 (empirisk verifikation FÖRE klassificering).

### L2 [UNIVERSAL, hub-lyft] — Web-research FÖRE strategi-resonemang vid tooling-frågor

Datum: 2026-05-16 | Källa: Session 6.6.5 K2 reframe efter Marcus' "tänk seniorproffs"-fångst

Vid tooling-val / arkitektur-beslut / process-disciplin: web-research med fokus på branschstandard 2026 FÖRE strategi-presentation. Aldrig konstruera mot gissning. Branschstandard ÄR utgångsläge — våra A/B/C/D-utredningar är instans-rangordning inom gammal ram, inte klass-svar mot aktuell praxis. Vid Session 6.6.5 inverterade web-research hela strategi-ramen (instans: "Hur fixar vi secrets-skulden?" → klass: "Vad är 2026-mönstret för Dependabot för klient-app med solo-dev?"). Mönsterförstärkning av K2.14 (sök befintliga lösningar) tillämpat på extern branschstandard, inte bara intern regel-katalog.

### L3 [UNIVERSAL, hub-lyft] — Empirisk config-verifikation FÖRE strategi-presentation

Datum: 2026-05-16 | Källa: Session 6.6.5 Marcus' "vet du hur Dependabot är konfigurerad?"-fångst

Chat:s strategi-spekulation utan att läsa faktisk config-fil är K-sista.1-mönster. Vid varje "lägg till X / ändra Y / konfigurera Z"-förslag: läs faktisk fil-state FÖRST via Code-rapport, sedan strategi-formulering. Antagande att "vi grupperade igår" är inte data — `.github/dependabot.yml` är data. Generaliserbar regel: aldrig påstå om aktuellt config-state utan empirisk verifiering. Mönsterförstärkning av Disciplin #6 + L1 (pre-K forensisk-pass).

### L4 [UNIVERSAL, hub-lyft] — Policy-konflikt-fångst FÖRE implementation

Datum: 2026-05-16 | Källa: Session 6.6.5 K1 Code:s PLANERA-rapport (3 frontmatter-konflikter + 1 README-skuld)

Code:s K1 PLANERA-rapport identifierade 3 policy-konflikter i Chat:s ursprungliga K1-prompt (status: active enum-violation + sessionsdok-frontmatter + ADR-frontmatter) + 1 pre-existing skuld (ADR-030 saknas i README). Gate 2-disciplin är aktör-agnostisk (K7.8) — Code agerar legitim Gate 2 vid filsystem-ground-truth-perspektiv. Generaliserbar regel: vid disciplin-arbete / policy-tillämpning / config-edit, designa för Gate 2 från alla aktörer (Chat hög-nivå, Code filsystem, Marcus intentions). Mönsterförstärkning av K2.15 + K7.8.

### L5 [UNIVERSAL, hub-lyft] — Reframing från instans-tänkande till klass-tänkande

Datum: 2026-05-16 | Källa: Session 6.6.5 K2 Marcus' "tänk seniorproffs"-fångst + 11/10-pre-check

Chat:s A/B/C/D-rangordning post-prep-dok var instans-tänkande inom gammal ram. Marcus' "tänk 11/10 seniorproffs" tvingade klass-reframe: "är A/B/C/D rätt klass av svar, finns alt utanför ramen?". Resultat: 4-lager-strategi (grouping + cooldown + CI-yta + manuell review) istället för secrets-frågans 4 alternativ. Generaliserbar regel: vid alternativ-presentation, default-pre-check är "är någon av dessa fel klass, finns 11/10-alt utanför ramen?". Mönsterförstärkning av K7.5.3.

### L6 [UNIVERSAL, hub-lyft] — 11/10 som GOLV-disciplin, inte tak

Datum: 2026-05-16 | Källa: Session 6.6.5 Marcus' explicit krav 2026-05-16

Branschstandard verifierad via web-research är vårt utgångsläge. 11/10 = beyond branschstandard, byggd på verifierbar fakta. Gäller samarbete, verifikationer, analyser, kod, dokumentation, ADR:er, sessionsdok — allt. Aldrig "good enough", aldrig "det funkar lokalt". Vid varje leverans-beslut: är detta beyond branschstandard? Om nej → fortsätt arbeta tills det är det. Förstärks i hub-CLAUDE.md "Ristat i sten"-rad vid K-sista #4. Mönsterförstärkning av Marcus' Gate 2-kvalitetsregel 2026-05-13 ("genväg = disciplin-brott") + K7.5.4 (pre-existerande warning-profil ≠ normativ standard).

### L7 [UNIVERSAL, hub-lyft] — Chat skördar lessons löpande, Marcus administrerar inte

Datum: 2026-05-16 | Källa: Session 6.6.5 Marcus' rollfördelnings-direktiv 2026-05-16

Vid lessons-flaggning under session: Chat bär löpande lista (L1, L2, ...) och bake:ar in vid K-sista. Marcus ska INTE behöva administrera lessons-skörd — det är Chat:s ansvar att disciplin-trail produceras. Mönsterförstärkning av rollfördelning: Chat ansvarar för disciplin-trail + sessions-dok-design, Code ansvarar för filsystem + git-state, Marcus ansvarar för beslut + cross-projekt-konsekvens.

### L8 [UNIVERSAL, hub-lyft] — Frontmatter-validator shallow-clone-incompatibility (latent bug-klass)

Datum: 2026-05-16 | Källa: Session 6.6.5 K1.5 forensisk-pass + K2.1 rotorsak-fix

scripts/check-frontmatter.sh Check 2 anropar `git log -1 --format=%cs -- <fil>` vilket på shallow clone (fetch-depth: 1) returnerar HEAD-commit-datum istället för filens senaste touch-datum. ADR-030 § Del 3-spec antog full git-history utan att kravställa fetch-depth eller verifiera mot CI:s shallow-clone-state. Test-suite (scripts/test-check-frontmatter.sh) testar inte shallow-clone-scenarier. K7.C 2026-05-15 etablerade falsk-grön baseline via sammanträffande invariant (alla 9 docs samma datum som HEAD). Dag-rollover 2026-05-16 bröt invariansen för första gången. Generaliserbar regel: vid CI-grindvakts-design som anropar `git log -- <fil>`: säkerställ tillräckligt stor fetch-depth på alla relevanta jobs ELLER detektera shallow-clone i skriptet och degradera Check gracefully. Empirisk test-suite måste inkludera shallow-clone-scenario. Mönsterförstärkning av K1.16 (grindvakt avslöjar oväntade kategorier) + Disciplin #6.

### L9 [UNIVERSAL, hub-lyft] — Falsk-grön via sammanträffande invariant

Datum: 2026-05-16 | Källa: Session 6.6.5 K1.5 forensisk-pass-fynd

Session 6.6 K9 empirisk verifikation (run 25923521145) passerade 2026-05-15 inte för att designen var korrekt utan för att alla 9 styrande docs hade samma datum som HEAD pga atomisk K7.C-bake-in. Sammanträffande invariant gömde shallow-clone-bugg i 24 timmar tills dag-rollover bröt invariansen. Generaliserbar regel: vid CI-grindvakts-K-sista-verifikation, identifiera invarianter som kan dölja bugs (t.ex. "alla bumpade samma dag" eller "kör endast på main"). Lägg in explicit test för invariansens motsats (dag-rollover, feature-branch med selective bumps). Mönsterförstärkning av K7.7 (verifiera vid exekverings-tid) + Disciplin #6.

### L10 [UNIVERSAL, hub-lyft] — Pre-K forensisk-pass-disciplin bekräftad i praktiken (meta-lesson)

Datum: 2026-05-16 | Källa: Session 6.6.5 K1.5 → K2.1 R1 vs R3-beslut

Utan K1.5 forensisk-pass hade K2.1 körts som R3 (manuell frontmatter-bump på 8 docs) = symptom-fix istället för R1 (fetch-depth: 50 på 3 jobs) = rotorsak-fix. Marcus' stopp-och-fångst pre-K2.1 ("vi satt 10h igår och fixade hela CI-setupen, det sista var frontmatter") var avgörande för att tvinga forensisk-pass. Generaliserbar regel: pre-K forensisk-pass (L1) producerar inte bara säkerhet utan helt annan klass av lösning. Mönsterförstärkning av L1 + Disciplin #6 + K-sista.1.

### L11 [UNIVERSAL, hub-lyft] — Verifikations-design-fel via mekanism-missförstånd

Datum: 2026-05-16 | Källa: Session 6.6.5 K3 Code:s Alt V1-rättning

Chat:s ursprungliga Alt V1-design för K3-verifiering antog att `git commit --author='dependabot[bot]'` populerar `github.actor`, men de är två olika kontexter: commit-author är git-metadata (synlig i `git log`), github.actor är workflow-trigger-metadata (vem pushade / öppnade PR). På privat repo blir github.actor = marcus803 oavsett commit-author. Falsk-grön-risk: spoofed-author-test skulle ge "alla checks körs som vanligt" utan att verifiera if-villkoret alls. Generaliserbar regel: vid empirisk verifikations-design, verifiera FÖRST att test-mekanismen faktiskt påverkar variabeln som testas. Commit-metadata ≠ workflow-trigger-metadata. Mönsterförstärkning av L9 (falsk-grön via sammanträffande invariant) tillämpat på test-design + K7.8 (Gate 2 från Code).

### L12 [UNIVERSAL, hub-lyft] — github.actor-villkor: defensiv skip säker, offensiv aktivering är Deputy Confusion-attackyta

Datum: 2026-05-16 | Källa: Session 6.6.5 K3 Chat:s säkerhets-analys + Synacktiv 2024-research

`github.actor`-baserade if-villkor är säkra för defensiv skip (privilege-DRAGS) men osäkra för offensiv aktivering (privilege-GES, t.ex. auto-merge via pull_request_target med GITHUB_TOKEN-write). Deputy Confusion-attack (Synacktiv 2024) utnyttjar `if: github.actor == 'dependabot[bot]'` på auto-merge-workflows. Vid varje `github.actor`-villkor: fråga "ger detta privilege till någon eller drar det privilege från någon?". Privilege-DRAGS (skip) är säkert. Privilege-GES (auto-merge med write-access) är Deputy Confusion-attackyta. Mönsterförstärkning av ADR-031 Lager 4 (explicit non-auto-merge per supply-chain-medvetenhet) + ADR-028 supply-chain-respons.

### L13 [UNIVERSAL, hub-lyft] — Verifierad branschstandard är 11/10:s GOLV, inte tak

Datum: 2026-05-16 | Källa: Session 6.6.5 Marcus' explicit krav 2026-05-16 + Dependabot 4-lager-tillämpning

Web-research returnerar "vad branschen gör 2026". 11/10 är beyond det. Generaliserbar regel: vid tooling-design / arkitektur-beslut / process-disciplin — branschstandard ÄR utgångsläge, inte slutmål. Vid varje förslag fråga "är detta beyond branschstandard?" Om nej → fortsätt arbeta tills det är det. Session 6.6.5:s tillämpning: Dependabot 4-lager-strategi (grouping + cooldown + minimal CI-yta + manuell review) > GitHub Docs basic-skip-mönster (1 lager). Mönsterförstärkning av L2 + L6.

### L14 [UNIVERSAL, hub-lyft] — Scope-minimal kommentar-text med källa-referens > datum-specifik prognos

Datum: 2026-05-16 | Källa: Session 6.6.5 K4 Chat-justering av PR-close-kommentar

K4-close-kommentar refererade ursprungligen "måndag 2026-05-18 06:00 Europe/Stockholm" som specifik datum-prognos. Risk: om Dependabot kör annan dag av infra-skäl är kommentaren permanent fel (comments kan inte ändras silent post-close). Justerad: "weekly schedule per .github/dependabot.yml" — refererar källa istället för prognos. Generaliserbar regel: vid permanent-text (kommentarer, ADR-er, commit-meddelanden, README), aldrig påståenden som kan drifta. Refererera källa, inte snapshot. Mönsterförstärkning av Kandidat 1 (atomic trail-link-disciplin, Session 6.6 K-sista #1 hotfix) + K7.5.1 (handoff-fil med fil-strukturella referenser kräver empirisk verifikation).

### Sammanfattning Session 6.6.5

14 lessons-kandidater skördade (alla [UNIVERSAL] för hub-lyft). Domän-fördelning: empirisk verifikation & forensisk-pass (L1, L3, L9, L10) + branschstandard & 11/10 GOLV-disciplin (L2, L5, L6, L13) + verifikations-design & policy-fångst (L4, L11, L12) + CI-grindvakts-design & trail-disciplin (L7, L8, L14). 4 Gate 2-fångster av Marcus (pre-K2.1 stopp + "tänk seniorproffs" + "vet du hur Dependabot är konfigurerad?" + 11/10-GOLV-direktiv), 3 av Code (K1 PLANERA-policy-konflikter + K1.5 forensisk-pass + K3 Alt V1-rättning), 1 av Chat self-review (K3 säkerhets-analys efter web-research). L8 motiverar potentiell ADR-030-tillägg (beslutas K-sista #3). L6 + L1 förstärks som "Ristat i sten" i hub-CLAUDE.md K-sista #4. Alla 14 hub-lyfts till `~/Repon/marcus-system/tasks/lessons.md` vid K-sista #5.

## 2026-05-16 — Session 6.6.7 (shellcheck-strict-grindvakt + shallow-clone-detection)

### L_A [UNIVERSAL] — JSON-räkning över grep-räkning för shellcheck-output

Datum: 2026-05-16 | Källa: K3.1 A.1.a-pass empirisk re-verifikation

K1-grep miss-räknade SC2034 (var 0, grep:ade 2) + SC2148 (var 2, grep:ade 3) + SC2312 (var 2, grep:ade 3) + SC2248 (var 22, grep:ade 23) via cluster-info-footer-rader + kontext-grep:ar runt `# shellcheck disable=SC2034`-direktiv. Auktoritativ räkning via `shellcheck -f json | jq '...'`. Generaliserbar regel: vid räkning av strukturerad-output-verktyg (linter, test-runner, build-tool) — JSON-format > textual-format för exakt mätning. `grep`-mot-text är icke-tillförlitlig pga cluster-headers + multi-line-detalj-formatering. Tillämpning: alla shellcheck-räkningar, alla pytest-räkningar, alla Vitest-räkningar. Mönsterförstärkning av L3 (Session 6.6.5) tillämpat på output-tolknings-domänen.

### L_B [UNIVERSAL] — Lesson-applicerings-scope: domän-specifik vs universell

Datum: 2026-05-16 | Källa: K3.1 A.1.a-pass Codes feltolkning av K7.5.4

K7.5.4 ("pre-existerande warning-profil ≠ normativ standard") är SC2034-domän-specifik (om en specifik SC-kod's "disable"-strategi vs "fix"-strategi), INTE universell minimal-edit-disciplin. Codes generalisering till "alla shellcheck-fix:ar ska vara minimal-edit" var feltolkning. Per-fynd-bedömning krävs — vilket är exakt vad A.1.a-pass-disciplinen gör (Marcus' refactor-över-`|| true`-val bevisar). Generaliserbar regel: vid lesson-applicering, först fråga "vad var lesson-scope när det skördades?" innan re-användning. Mönsterförstärkning av L4 (Session 6.6.5 — policy-konflikt-fångst FÖRE implementation) tillämpat på lessons-domänen själv.

### L_C [UNIVERSAL] — Tre fix-kvalitets-nivåer för linter-fynd

Datum: 2026-05-16 | Källa: K3.1 A.1.a-pass Marcus' refactor-val över `|| true`-suffix

Linter-fynd har tre fix-kvalitets-nivåer:

1. **Refactor som löser orsaken** (nivå 1, 11/10 GOLV) — adresserar varför verktyget flaggar; bevarar verktygets diagnostik-värde
2. **Suffix-ignore som explicit ignorerar** (nivå 2, branschstandard-fix-syntax) — verktyget rekommenderar ofta detta som "second-best"; tystar diagnostik medvetet
3. **Per-rad disable som gömmer från linter** (nivå 3, anti-pattern) — verktyget kan inte rapportera; risk för silent regression

shellcheck-officiella fix-suggestions är ofta nivå 2 (`|| true`-suffix för SC2312) — branschstandard-fix-syntax, INTE branschstandard-best-practice. 11/10 GOLV pekar mot nivå 1. K3.1 A.1.a SC2312-fix: refactor till `CURRENT_DIR=$(pwd)`-variabel pre-echo (nivå 1) över `$(pwd || true)`-suffix (nivå 2). Bevarar `set -euo pipefail`-semantiken (om pwd failar exiterar scriptet). Mönsterförstärkning av L6 (11/10 är GOLV, inte tak) tillämpat på fix-strategi-domänen.

### L_D [UNIVERSAL] — Empirisk fynd-räkning post-fix måste inkludera nya fynd introducerade av själva fix:en

Datum: 2026-05-16 | Källa: K3.1 A.1.a-pass delta-rapport (Marcus-fångst post-K3.1-commit)

K3.1 rapporterade 366 → 364 vs förväntat 362. Delta = 2 nya SC2250-fynd från `$CURRENT_DIR`-variabel-referens utan brace-wrap (förväntad konsekvens av A.1.a refactor; tillhör A.1.b mekanik-domän). Generaliserbar rapport-format: **"X fixade, Y nya, Z netto."** Aldrig bara "X fixade" — det maskerar fixarna som introducerar nya fynd (typ refactor som lägger till variabel-referens som triggar separat SC-kod). Tillämpning: alla fix-paket-rapporter (shellcheck, ESLint, mypy, etc.). Mönsterförstärkning av L_A (auktoritativ räkning via JSON) + L7 (Chat skördar lessons löpande) — räknings-rapport är fångst-domän, inte räknings-domän.

### L_E [UNIVERSAL] — `shellcheck --format=diff` auto-fix är icke-fullständig för cross-syntax-fall

Datum: 2026-05-16 | Källa: K3.2 SC2292 rad-99 `\<` → `<`-konvertering

`shellcheck --format=diff` auto-fix är icke-fullständig för cross-syntax-fall. När en operator har olika syntax mellan `[ ]` (POSIX) och `[[ ]]` (bash) — t.ex. `\<` POSIX-escape vs `<` bash-direkt — spelar `--format=diff` säkert och konverterar inte. Sådana fall kräver manuell L_C nivå 1-fix post-auto-apply. Generaliserbar regel: efter auto-mekanisk fix-pass, verifiera 0-fynd-state empiriskt; en `git apply` som "lyckas" är inte bevis på fullständig fix-täckning. Trigger: K3.2 SC2292 rad-99 i `scripts/check-frontmatter.sh` — auto-fix konverterade andra `[ ]`-clausen i `||`-kedjan men hoppade första clausen med `\<`. Manuell fix: `[[ "${REVIEW_BY}" < "${TODAY}" ]]` (inom `[[ ]]` är `<` bash-direkt lexikografisk less-than per `man bash`). Mönsterförstärkning av L_A (auktoritativ räkning) + L_D (post-fix-räkning inkluderar nya fynd) + L_C (3 fix-kvalitets-nivåer).

### L_F [UNIVERSAL] — Runner-image-version-mismatch är falsk-grön-risk-klass per L9

Datum: 2026-05-16 | Källa: K3.3 VILLKOR A pre-flight ubuntu-latest shellcheck 0.9.0 vs lokal 0.11.0

ubuntu-latest pre-installerade verktyg lagrar OS-paket-pinnade versioner som drift:ar bakom upstream-release-cadence (shellcheck 0.9.0-1 i Ubuntu 24.04 vs 0.11.0 upstream per maj 2026). Pre-installerade verktyg utan version-pinning är teknisk skuld disguised som convenience. Falsk-grön-risk: nyare optional checks (v0.10+: SC2310 m.fl.) finns lokalt men inte i CI — framtida code-edit som triggar v0.10+-check är röd lokalt + grön CI. Generaliserbar regel: vid CI-grindvakts-aktivering av verktyg X, empirisk pre-flight via runner-image-manifest FÖRE edit + version-pin till exakt upstream-release matching lokal dev-environment. Empirisk verifikations-källa: `https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md` (auktoritativ manifest). Mönsterförstärkning av L9 (CI-runner-flakiness) + L_E (auto-fix icke-fullständig).

### L_G [UNIVERSAL] — Supply-chain-policy-täckning kräver fallback-strategi för upstream-utan-officiell-checksum

Datum: 2026-05-16 | Källa: K3.3 STEG 1 Metod 2 failed för koalaman/shellcheck

ADR-028 etablerade SHA-pin-policy; ADR-029 § Third-party Actions-policy förstärkte. Båda antog implicit att upstream publicerar officiella `.sha256sum`-filer per release-asset. Empirisk verifikation 2026-05-16 (koalaman/shellcheck v0.11.0): många populära upstream-projekt publicerar BARA binär-tarballs utan separata checksums. Fallback-strategi: Metod 1 SHA (downstream-beräknad mot GitHub-release-immutability-garanti) är teknisk-ekvivalent med Metod 2 så länge upstream-release är immutable. Trail-disciplin kräver explicit dokumentation att SHA är downstream-beräknad (CI-step-kommentar + ADR-033 § Säkerhet sub-bullet + § Medvetna utelämningar punkt). Mönsterförstärkning av L_F (runner-image-version-mismatch) + ADR-028 + ADR-029 § Medvetna utelämningar #3 actionlint-precedent.

### L_H [UNIVERSAL] — Defense-in-depth lager N ska fela hårt när lager <N har failat

Datum: 2026-05-16 | Källa: K4.1 shallow-clone-detection designval-analys (Codes initial B-rekommendation flippades till A per Chat-mediated 11/10-granskning)

Warn-skip-by-default på defensive-programming-lager N är invertet defense-in-depth: lager N förlitar sig då på lager <N istället för att skydda mot lager <N-failure. Trigger-villkoret för lager N är "kompromettering av föregående skyddslager" — rätt-respons är hard-fail, inte gracefull degradering. Generaliserbar regel: vid design av defensive-programming-lager, fråga "vad är trigger-tillståndet?" — om svaret är "lager <N har failat", då är hard-fail rätt-respons. Gracefull degradering är rätt-respons när trigger-tillståndet är "operationell kontext är degraded (typ network down)" — INTE när det är "skyddslager har failat". Konkret K4.1-tillämpning: shallow-clone är inte "operationell-degradering" utan "lager 1 (fetch-depth: 50) har failat eller saknas" → hard-fail. Mönsterförstärkning av L_C (3 fix-kvalitets-nivåer) applicerat på defense-in-depth-domän.

### L_I [UNIVERSAL] — Defense-in-depth lager N kräver empirisk-pre-flight-test av detection-semantik mot ALLA relevanta konfigurationer

Datum: 2026-05-16 | Källa: K4.1 CI-röd-state (commit `b2970fd`) + K4.1.1 hot-fix

K4.1 testade detection-logik (`git rev-parse --is-shallow-repository`) bara mot fetch-depth: 1 (worst-case) och missade fetch-depth: 50 (ADR-030-safe-state). `--is-shallow-repository` returnerar `true` för BÅDA — design-bug inte fångad utan empirisk truth-table-test över ALLA relevanta konfigurationer. Generaliserbar regel: vid design av detection-logik, lista ALLA scenarier (safe + unsafe + edge-case) + truth-table-test FÖRE implementation. Inte bara worst-case-test (vilket ger falskt-säkert "detection fungerar"); test också safe-cases och edge-cases (typ nytt-repo med <threshold commits men full clone). Mönsterförstärkning av L1 (pre-K-implementation forensisk-pass) tillämpat på detection-logik-design-domän. K4.1.1 hot-fix (commit `4dc55e5`) implementerade hybrid-check (IS_SHALLOW + COMMIT_DEPTH < threshold) efter empirisk 4-scenario truth-table-test.

### L_J [UNIVERSAL] — Chat-side 11/10-argumentation kräver empirisk grund för tekniska antaganden

Datum: 2026-05-16 | Källa: K4.1 designval-flipp (Codes B → Marcus A) utan empirisk verifikation av detection-semantik

Att flippa Codes rekommendation med disciplin-baserade argument (L_C-nivå, defense-in-depth-paradigm) är retorik utan substans om det tekniska fundamentet inte är empiriskt verifierat. K4.1 Chat-flipp av Codes Alt B → Marcus' Alt A användte 4 starka discipline-argument (L_C nivå 1, defense-in-depth korrekt-logik, ADR-033-strict-paradigm, branschstandard "warn on degradation") — men ingen av dem ifrågasatte tekniska fundamentet "returnerar `is-shallow-repository` `false` på fetch-depth: 50?". Generaliserbar regel: när Chat applicerar 11/10-filter på tekniskt-detalj-rekommendation, första frågan ska vara "är detection/implementation/påstående empiriskt verifierat mot ALLA relevanta scenarier?" FÖRE argumentation. Disciplin-argument är multiplicerande, inte additiv: ×0 substans-verifikation = 0 värde av disciplin-argumentation oavsett antal. Mönsterförstärkning av L_B (lesson-applicerings-scope) + L1 (forensisk-pass) + L_I tillämpat på Chat-side-domän.

### L_K [UNIVERSAL] — ADR-skapelse-tidsstämpel-konvention bevarar pre-implementations-state-referens

Datum: 2026-05-16 | Källa: K4.3 ADR-033-referens-disciplin (Codes egen explicit-dokumentation av disciplinen i K4.3-rapport)

När en ADR refererar en annan ADR:s defer-bullet ("X (defer)") och den senare implementeras (uppdaterad till "X (implementerad)"), ska källans referens INTE uppdateras retroaktivt. Annars skapas referens-paradox där båda ADR:erna pekar på "implementerad"-state utan att dokumentera tidslinjen (vid källans-ADR-skapelse var det defer). Generaliserbar regel: ADR-referenser är tidsstämplade observationer av state vid skapelse-tidpunkt; retroaktiv uppdatering bryter trail-disciplin. Konkret tillämpning K4.3: ADR-033 rad 26 säger fortfarande "ADR-030 § Del 3 'Defensive programming (defer)'-bullet pekar till denna implementation" — bevarat trots ADR-030 K4.3-uppdatering till "(implementerad)". Codes egen explicit-dokumentation av disciplinen i K4.3-commit-message var pre-flight-medvetenhet (förhindrade retroaktiv-uppdaterings-impuls). Skiljs från L_E (cross-syntax-fall i auto-fix-domän): L_K är cross-ADR-tidsstämpel-disciplin i dokumentations-domän. Mönsterförstärkning av L1 (forensisk-pass FÖRE förslag) + Kandidat 1 (atomic trail-link-disciplin) tillämpat på cross-ADR-referens-domän.

### L_L [UNIVERSAL] — K-sista-status-bump-checklista kräver explicit per-fil-coverage-verifikation

Datum: 2026-05-16 | Källa: K-sista #3 pre-flight A3-grep-rapport (CLAUDE.md status-drift för Session 6.6 + 6.6.5)

Sessions 6.6 + 6.6.5 K-sista-pass uppdaterade BUILD-LOG men hoppade CLAUDE.md status-rad-bump trots att det ingår i K-sista DoD per projekt-CLAUDE.md "Sessionsavslut"-checklistan rad 14. Fångad K-sista #3 pre-flight Session 6.6.7 via `grep "Session 6" CLAUDE.md` (visade endast Session 6 + 6.5 — Session 6.6 + 6.6.5 saknades). Drift = 12+ dagar utan upptäckt. Generaliserbar regel: K-sista-checklista-poster (BUILD-LOG + todo.md + lessons.md + CLAUDE.md + ADR-bumps + hub-sync + arkivering) ska verifieras per-fil empiriskt vid K-sista-start, inte antas baserat på "föregående K-sista var komplett". Driften från Session 6.6 + 6.6.5 visar att check-list-skip:ar är icke-uppenbara utan empirisk verifikation. Mönsterförstärkning av L1 (forensisk-pass FÖRE implementation) + principen att projektkunskaps-index inte är filsystem-live-state, tillämpat på K-sista-process-domänen.

### Sammanfattning Session 6.6.7

12 lessons-kandidater skördade (alla [UNIVERSAL] för hub-lyft). Domän-fördelning: räknings-disciplin (L_A, L_D) + lessons-meta (L_B, L_J) + fix-strategi & defense-in-depth (L_C, L_H, L_I) + CI-grindvakts-aktivering (L_F, L_G) + cross-syntax & cross-ADR (L_E, L_K) + K-sista-process-disciplin (L_L). 5 Code-fångster (K3.1 räknings-klargörande + K3.3 SHA-strategi + K4.1.1 truth-table + K4.3 ADR-disciplin + K-sista #3 drift-fynd), 2 Chat-mediated-fångster (Marcus refactor-val + Marcus design-flipp), 1 CI-feedback-fångst (K4.1 design-bug → K4.1.1 hot-fix). L_I + L_J par-mönsterförstärker varandra (empirisk truth-table FÖRE implementation + Chat-argumentation kräver empirisk grund). L_K kompletterar L_E som distinkt cross-domän-disciplin (cross-syntax vs cross-ADR-tidsstämpel). L_L tillkom som K-sista #3-fynd (CLAUDE.md status-drift för Session 6.6 + 6.6.5). Alla 12 hub-lyfts till `~/Repon/marcus-system/tasks/lessons.md` vid K-sista #6.

## 2026-05-23 — Session 6.6.6 (Vale-cleanup + K-sista-0 lessons-konsolidering)

> Antal poster: 13 konsoliderade hub-lessons. Konsoliderade från 125 lessons-
> kandidater (rå-katalog + fulltext-supplement 2026-05-23) via 13 klass-pattern.
> Bas-not: 125 = korrigerad räkning; rå-katalogens "124" vilade på v2-finals
> miscountade §3.6 (25 vs faktiskt 26). Fullständig kandidat-trail: rå-katalogen.

### L15 [UNIVERSAL, hub-lyft] — Empirisk verifikation före påstående, klassning och commit

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Empirisk-disciplin)

Namnge den empiriska källan innan du klassificerar, hävdar eller committar — källa före antagande. Körning och faktisk data är auktoritativa över skrivet protokoll och över projektkunskaps-index, som inte är filsystem-live-state.

### L16 [UNIVERSAL, hub-lyft] — Linter- och grindvakts-quirks är en klass av latenta upstream-buggar

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Verktygs-quirk / latent bugg)

Ett oväntat verktygsfynd behandlas som quirk-kandidat: bygg minimal-repro och klassa quirk-typ före "fix". En grindvakts-fix får inte regressera en annan — verifiera cross-grindvakt efter varje config-ändring.

### L17 [UNIVERSAL, hub-lyft] — Upstream-bugg-klassning måste förtjänas

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Upstream-bugg-klassning)

Att klassa något som upstream-bugg kräver minimal-repro + uttömd mitigerings-familj + branschstandard-precedent. Utan alla tre är "upstream-bugg" en overifierad gissning.

### L18 [UNIVERSAL, hub-lyft] — En princip som inte operationaliserats är design-skuld

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Disciplin-meta (operationalisering))

En lärdom som erkänts verbalt men inte omsatts till ett konkret procedursteg är inte operationell — bara dokumenterad. Varje ny prompt ska köra en explicit tillämpbarhets-check mot etablerade lessons.

### L19 [UNIVERSAL, hub-lyft] — Extern fångst slår intern självkontroll

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Code-pair-programming-fångst)

Strukturera roller så att Code och Marcus fångar fel pre-commit; ren självkontroll i Chat är empiriskt svag (~9 % fångst). Bygg externt verifierbar struktur — transparens-rapport, STOPPA-OCH-FRÅGA — framför intern disciplin.

### L20 [UNIVERSAL, hub-lyft] — Verktygs- och kommando-korrekthet verifieras före användning

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Tooling-/kommando-disciplin)

Mental dry-run av shell- och portabilitets-detaljer (BSD vs GNU, strict-mode) före leverans; CI-troget anrop framför approximation; UTF-8-medvetenhet vid filnamns-iteration.

### L21 [UNIVERSAL, hub-lyft] — Namn och katalog-integritet är arkitektur

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Namn-/katalog-integritet)

Grep alla föregående filartefakter för namnkollision FÖRE varje namntilldelning — namn är globalt namespace inom en sessions-serie. Klass-namn är designval, och cross-referenser propageras vid varje edit.

### L22 [UNIVERSAL, hub-lyft] — Hub-spoke-portabilitet är default

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Hub-spoke-portabilitet)

Bygg config-driven framför hårdkodat. Flagga universella lärdomar vid skörd och lyft dem till hubben; spoke-specifikt stannar i spoke. Hub-sync inom 7 dagar är acceptabelt för icke-akuta lärdomar.

### L23 [UNIVERSAL, hub-lyft] — K-fas-strategi och atomic-commit-disciplin

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: K-fas-strategi)

En commit per semantisk domän; en prompt levererar sina källor inline framför multi-del. Pre-existing skuld som upptäcks defereras till mini-session, inte in i pågående scope. Empirisk omprioritering vid >50 % systemisk-hit-rate.

### L24 [UNIVERSAL, hub-lyft] — Rätt klassning beror på scope och kontext

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Klassificerings-kontext)

Läs ADR, sessionsdok och frontmatter-scope före klassning. "CI grön" kan vara instabilt state under aktiv cleanup; governing vs non-governing fil avgör hook-beteende; upstream vs egen bugg beror på kontext.

### L25 [UNIVERSAL, hub-lyft] — Web-research före strategi-, arkitektur- och tool-version-beslut

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Web-research-disciplin)

Extern research är obligatorisk 11/10-disciplin före strategi-val, arkitektur-claim och tool-version-beslut — inte ett optional steg.

### L26 [UNIVERSAL, hub-lyft] — Filartefakter är enda sanningskällan (kontinuitet-arkitektur)

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Kontinuitet-arkitektur)

Chat-trail är efemär; endast filartefakter överlever sessions-byte. Allt nytt — lessons, designval, beslut — måste säkras i fil INNAN sessions-byte. Pre-byte-verifikation: "är allt nytt säkrat i fil?".

### L27 [PROJEKT] — Vale-config-arkitektur och Brand-/domän-specifika fynd

Datum: 2026-05-23 | Källa: Session 6.6.6 K-sista-0-konsolidering (klass: Vale-config-arkitektur (spoke-lokal))

Vale-configens lager-arkitektur följer ADR-032; Brand-namn-quirks (t.ex. Aria/ARIA) och brand-pivot-narrativ är miranon-specifika. Spoke-lokal lärdom — lyfts inte till hub.

## 2026-05-26 — Session 6.7 (CLAUDE.md-audit + skills-extraktion)

> Antal poster: 10, alla [UNIVERSAL] (L28–L37). Skördade ur sessionsdokets
> Del 6 (15 flaggade kandidater) + 2 utanför Del 6. Not: git-amend-stage-
> disciplin var flaggad (K1) men aldrig materialiserad — struken vid K-sista,
> ej konsoliderad (ingen rekonstruerbar substans). Hub-lyft sker i steg 6.

### L28 [UNIVERSAL] — Text-STOPPA-OCH-FRÅGA är default; popup är för preferensval

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: STOPPA-disciplin)

En fråga som gäller en disciplin- eller verifikations-grind ställs i text som STOPPA-OCH-FRÅGA, inte via popup-verktyg. Popup/strukturerad elicitering reserveras för genuina preferens-/beslutsval — fel verktyg döljer en grind som ska vara synlig.

### L29 [UNIVERSAL] — En regel bor på exakt ett ställe; placering avgörs av alltid-på vs ibland-relevant

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: Regel-placering / konstitution)

Alltid-på → konstitution (CLAUDE.md); ibland-relevant → skill eller lessons.md. Extraktions-principen har en additions-spegel: när det som SKA finnas saknas, adderar man.

### L30 [UNIVERSAL] — Ett låst beslut är inte immunt mot evidens

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: Locked-decision-override)

Ett "BESLUTAT"-item kan falsifieras av research; när det sker rivs beslutet öppet med medveten kvittens, inte tyst.

### L31 [UNIVERSAL] — Verifiera repo-egenskaper per prompt; en upprepad lärdom bevisar att flaggning inte räcker

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: Repo-egenskaps-verifiering)

Varje Chat-prompt måste ha ett explicit verifikationssteg för repo-egenskaper — fil-mekanismer (hook/governing/CI/lint), flytt-destinationer — mot faktiskt tillstånd, inte antaget. En lärdom som återkommer är bevis att flaggning utan operativt procedursteg är design-skuld.

### L32 [UNIVERSAL] — En prompts bokstavliga instruktioner approximerar intent; vid divergens styr rationale

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: Prompt-intent vs bokstav)

Verifiera att grind-mål är nåbara av promptens egna operationer och att radintervall matchar sitt beslut. Divergerar bokstaven från sitt rationale, styr rationale.

### L33 [UNIVERSAL] — Validera Chat-producerade artefakter före leverans

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: Artefakt-validering)

Klassningstabeller korsläses för interna motsägelser; inlinat promptinnehåll valideras mot projektets egna grindvakter; shell/kod kontrolleras som faktiskt giltig — inte antas.

### L34 [UNIVERSAL] — Arkitekturförslag kräver fullständiga inputs

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: Arkitektur-inputs)

Innan en arkitektur föreslås: läs den styrande ADR:n i sin helhet och kartlägg hela options-/yt-rymden.

### L35 [UNIVERSAL] — Research för arkitektur: förstapartskälla och mönster, inte bara mekanism

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: Research-disciplin)

Använd auktoritativ förstapartskälla före tredjeparts-källor, och researcha det etablerade mönstret — hur fältet strukturerar problemet — inte bara den lokala mekanismen.

### L36 [UNIVERSAL] — En check är trim-bar bara mot ovillkorlig enforcement

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: Checklist-trim / enforcement)

En verifikations-check kan tas bort ur en checklista endast om något ovillkorligt enforce:ar den (CI/hook). Villkorlig enforcement — t.ex. ett skill-anropat skript — är inte täckning.

### L37 [UNIVERSAL] — Skill-discovery matchar beteende-klass, inte trigger-ordval

Datum: 2026-05-26 | Källa: Session 6.7 K-sista (klass: Skill-discovery / leveransmekanism)

Discovery levererar tillförlitligt för kommando-utlösta operativa rutiner men inte för meta-disciplin som modellen redan gör nativt från konstitutionen. Verifiera leveransmekanism mot beteende-klass. Empirisk grund: K8 4/6.

## 2026-05-26 — Session 7 (plugin-scope-stängning + Fas 2-fynd-verifiering)

> Antal poster: 5, alla [UNIVERSAL] (L38–L42). Skördade ur Session 7 K0.0
> (plugin re-sync + scope-housekeeping). Hub-lyft sker vid K-sista lessons-skörd.

### L38 [UNIVERSAL] — Claude Codes plugin-CLI kan tyst skriva om project settings.json

Datum: 2026-05-26 | Källa: Session 7 K0.0 (klass: Plugin-CLI / config-säkerhet)

`claude plugin`-kommandon kan omserialisera och kollateralt tömma orelaterade block i project `.claude/settings.json` (t.ex. pre-commit-hooks) — #38271 — och lämna stale cache. Vid plugin-CLI-operationer: snapshotta `settings.json` före, `git diff` efter varje kommando, och verifiera mot disk-tillstånd, inte mot exit-status.

### L39 [UNIVERSAL] — "Repo rent" verifieras mot git status/git diff, inte mot "HEAD oförändrad"

Datum: 2026-05-26 | Källa: Session 7 K0.0 (klass: Repo-state-verifiering)

En unstaged working-tree-diff på en spårad fil är osynlig för en ren HEAD-jämförelse. "Rent" bevisas mot faktisk `git status`/`git diff`, inte mot att HEAD är oförändrad.

### L40 [UNIVERSAL] — Deklarativ config-ändring redigeras kirurgiskt, inte via verktyg med granne-fil-sidoeffekt

Datum: 2026-05-26 | Källa: Session 7 K0.0 (klass: Minsta-verktyg-för-operationen)

När en plugin-operation i grunden är en deklarativ config-ändring (t.ex. ta bort registreringsnycklar ur `settings.json`), redigera config:en kirurgiskt — kör inte ett verktyg med känd sidoeffekt på en granne-fil. Minsta verktyg för operationen.

### L41 [UNIVERSAL] — Plugin-state är spritt över flera filer; verifiera topologin före registry-resonemang

Datum: 2026-05-26 | Källa: Session 7 K0.0 (klass: State-topologi)

Plugin-state bor i flera filer: `installed_plugins.json` (auktoritativt install-register som `claude plugin list` läser scope ur), `known_marketplaces.json`, och `settings.json` (enable-deklaration). Anta inte en enfils-modell — verifiera den faktiska topologin mot disk innan registry-resonemang.

### L42 [UNIVERSAL] — Hub-plugin-skill-set-ändring kräver version-bump; manuell ren ominstallation är pålitlig re-sync

Datum: 2026-05-26 | Källa: Session 7 K0.0 (klass: Plugin-distribution / cache)

En ändring av en hub-plugins skill-set måste åtföljas av en version-bump i `plugin.json`; Claude Codes auto-invalidering av lokal cache är opålitlig, så en manuell ren ominstallation är den pålitliga re-sync-mekanismen.

### L43 [UNIVERSAL] — Ett config-block som ser ut som en grind är inte en grind förrän dess fyrning är empiriskt verifierad

Datum: 2026-05-27 | Källa: Session 7 K0.1b–c (klass: Enforcement-verifiering)

Ett enforcement-claim (hook, CI-steg, grind) ska bevisas, inte antas. `.claude/settings.json` `hooks.pre-commit` såg ut som en biome+tsc-grind men fyrade aldrig — dead config, eftersom Claude Codes hook-system inte har något `pre-commit`-event; ADR-001 + ADR-010 bar claimet overifierat sedan Fas 0. Verifiera fyrning empiriskt (injicera ett fel som grinden ska fånga → den måste blockera) innan ett config-block räknas som enforcement. Speglar L31 (verifiera repo-egenskaper mot faktiskt tillstånd) applicerat på grind-mekanik.

### L44 [UNIVERSAL] — En route-guards beforeLoad blockerar render endast via throw/await; auth-resolution gate:as strukturellt, ej per route

Datum: 2026-05-27 | Källa: Session 7 K0.2b (klass: Router-guard / auth-livscykel)

I TanStack Router blockerar `beforeLoad` barn-render endast genom att `throw`:a (redirect/error) eller `await`:a en promise — en synkron `return` är en no-op och tillåter skyddat innehåll att rendera (flash). Den robusta lösningen är inte en bättre per-route-guard utan en **strukturell render-gate**: montera `<RouterProvider>` först när auth är löst, så invarianten "context.auth är definitiv när varje beforeLoad körs" gäller globalt. Klass-invariant slår per-route-kontroll (speglar L29: en regel på exakt ett ställe).

### L45 [UNIVERSAL] — En render-gate framför en modul-scope-router kräver att inget fyrar mot routern förrän context är löst

Datum: 2026-05-27 | Källa: Session 7 K0.2b DEL 4b (klass: Monterings-ordning / router-context)

När en router skapas på modul-scope med en placeholder-context (`auth: undefined`) som fylls via `<RouterProvider context={…}>`, måste en render-gate som fördröjer mount också säkra att inget annat triggar router-bearbetning mot placeholdern. `router.invalidate()` i en `useEffect` fyrade på första rendern och körde `beforeLoad` mot `context.auth=undefined` → krasch. Att ändra monterings-ordningen tvingar en omprövning av **allt** som fyrar mot routern (invalidate, preload, navigering). Empiriskt funnet — antogs ej.

### L46 [UNIVERSAL] — Kräver det robusta regressionstestet deferrad infra, defer:a ärligt med konkret spec — inte en falsk-grön ersättning

Datum: 2026-05-27 | Källa: Session 7 K0.2b (klass: Test-disciplin / defer)

Det deterministiska no-flash-testet kräver komponent-test-infra (vitest, deferrad till Fas 3.5). En flakig E2E-ersättning som inte kan ge kontrast-bevis (falla mot pre-fix-koden) är en falsk-grön signal — samma klass som dead-config-grinden K0.1c rev ut. Rätt drag: defer:a testet ärligt med en spec detaljerad nog att framtida fas aktiverar utan att återuppfinna, och bevisa fixen idag med tillgängliga medel (strukturellt resonemang + befintlig svit). Verifiering = bevis, inte teater.

### L47 [UNIVERSAL] — En verifieringsdok-hypotes är en hypotes; empiriskt fel-test smalnar fyndet före fix-design

Datum: 2026-05-27 | Källa: Session 7 K0.3a–b (klass: Fynd-verifiering / empiri före design)

Ett fynd i ett verifieringsdokument är en hypotes tills den prövats. K0.3a:s empiriska fel-test smalnade Fynd 4 från "router-fel ofångade och osynliga för Sentry" till den faktiska defekten: **enbart root-route-render-fel** föll till en obrandad default; loader-/komponent-fel hanterades redan, och alla nådde Sentry. En fix designad mot den breda hypotesen hade adresserat fel sak. Kör ett empiriskt fel-test (injicera felet på varje relevant plats, observera vad som fångar + var det rapporteras) **före** fel-hanterings-design — och rikta fixen mot den verifierade, smalnade defekten. Speglar L43 (bevisa fyrning, anta inte) på fynd-nivå.

### L48 [UNIVERSAL] — Verifierings-fixturer pensioneras när deras verifiering är gjord och registrerad

Datum: 2026-05-27 | Källa: Session 7 K0.4 (klass: Fixtur-livscykel / falsk signal)

En fixtur skapad enbart för att bevisa något (test-route, probe, smoke-vy) ska tas bort när bevisningen är gjord och historiskt registrerad. En kvarlämnad fixtur i prod-route-tree/bundle är en falsk signal — den ser ut som funktionalitet men mäter inget (test-nuqs: inert dev-route + ~12.21 kB i prod-bundlen, "ej tillgänglig i produktion"-text men ändå närvarande). Knyt fixtur-borttagningen till den första riktiga användningen (här: nuqs-infra kvar, första `useQueryState` → Fas 6). Samma falsk-grön-signal-klass som dead-config-grinden (L43) och den deferrade-test-genvägen (L46), applicerad på verifierings-artefakter.

### L49 [UNIVERSAL] — Ett deferrat fynd registreras med sann status + konkret schemaläggning; annars är det en dold lucka, inte ett beslut

Datum: 2026-05-27 | Källa: Session 7 K0.5 (klass: Defer-disciplin / fas-status-ärlighet)

Ett fynd man skjuter upp måste registreras med (a) den sanna nuvarande statusen — vad som ÄR verifierat vs inte, med klyftan namngiven och ägd — och (b) en konkret schemaläggning (vilken fas/mekanism aktiverar åtgärden). "Deferrat" utan ägd klyfta och plan är en dold lucka maskerad som beslut. Dessutom: ett enskilt deferrat fynd får inte hålla en fas kvalitets-status gisslan — reclassa ärligt (Fynd 5:s logout-väg + Fynd 7:s bundle var äkta defer:ar, inte öppna 11/10-blockers) så statusen varken är falskt grön eller falskt blockerad. Falsk-grön-familjen (L43/L46/L48) lyft till fas-status-nivå.

### L50 [UNIVERSAL] — En parameter som via konvention ska spegla en annan kodkopplas eller får en invariant-not + test; annars driftar de tyst

Datum: 2026-05-27 | Källa: Session 7 K0.S2 (klass: Konventions-koppling / drift-prevention)

`FRONTMATTER_MIN_HISTORY_DEPTH` skulle per konvention spegla ci.yml:s `fetch-depth`. När fetch-depth bumpades 50→100 (2026-05-26) följde tröskeln inte med — den låg kvar på 50 i tre filer (ADR-030-text, `.frontmatter-policy.conf`, skript-default) → ett falsk-negativt detektionsfönster på commit-djup 50–99. Två parametrar som MÅSTE följas åt ska antingen **kodkopplas** (läs den ena ur den andra) eller, när det inte går (skild fil/yta), bära en **explicit invariant-not** ("håll tröskeln == fetch-depth") **+ en test som bevakar relationen**. En tyst konventions-koppling driftar isär vid första ensidiga ändring. Speglar L31 (verifiera mot faktiskt tillstånd) på parameter-relations-nivå.

## 2026-05-27 — Session 8 (K0b: process-retrospektivens åtgärdssteg)

> Antal poster: 4, alla [UNIVERSAL] (L51–L54). Skördade ur Session 8 K0b
> (konsistens-grindar + ADR-039). Hub-lyft sker INTE i K0b (ej fas-avslut) —
> flaggat för Marcus. K0a (kartläggningen) registrerad i sessionsdoket.

### L51 [UNIVERSAL] — Deterministiska konsistens-kontroller hör vid varje push, inte bara vid fas-avslut (kadens-principen)

Datum: 2026-05-27 | Källa: Session 8 K0b (klass: CI-kadens / drift-prevention)

En mekanisk drift-vakt vars körnings-kadens inte matchar artefaktens ändrings-kadens skapar ett tyst drift-fönster. K0a-roten: README:s ADR-räkning (28 vs faktiskt 38) vaktades enbart av `phase-end-verify.sh` som körs vid fas-avslut, medan ADR:er tillkommer varje session — tio ADR:er drev förbi den senaste fas-avslut-körningen oupptäckt. Regel: billiga, deterministiska, per-artefakt-ändring-konsistens-checks (antal, värde-invariant, token-unikhet) hör vid **varje push** (CI-grind med `set -euo pipefail`, exit≠0 vid drift); genuint fas-bundna checks (release-rubrik, arkivering, hub-sync, fas-status) stannar i fas-avsluts-rapporten. Frågan är inte "finns en grind?" utan "matchar grindens kadens artefaktens?". Formaliserad i [ADR-039](../docs/decisions/ADR-039-konsistens-grindar-kadens.md); utvidgar [ADR-036](../docs/decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md) (CI = enda enforcement-yta) med kadens-dimensionen. Etablerat verify-*-mönster (Kubernetes/KubeEdge/GitLab/OpenShift) + shift-left-balansen.

### L52 [UNIVERSAL] — En lesson som föreskriver en grind genererar en spårad todo, öppen tills grinden finns (lesson→grind-principen)

Datum: 2026-05-27 | Källa: Session 8 K0b (klass: Lessons→enforcement-bro)

Capture ≠ enforcement. En lesson lever som prosa i denna fil och appliceras bara om en agent minns den vid session-start — Chat-self-fångst är empiriskt ~9 % effektiv (hub-konstitutionen). L50 är precedensen: den föreskrev uttryckligen "invariant-not **+ en test**", men endast noten byggdes — den bevakande testen byggdes aldrig (upptäckt K0a). Regel: när en lesson föreskriver en mekanisk grind/test, skapa samtidigt en **spårad todo-punkt** (`tasks/todo.md`) med ett verifierbart sluttillstånd, och håll den öppen tills grinden faktiskt finns. Speglar postmortem-kulturen (Google SRE Workbook / Atlassian): en åtgärd utan formell spårning är oskiljbar från ingen åtgärd. Formaliserad i [ADR-039](../docs/decisions/ADR-039-konsistens-grindar-kadens.md); första tillämpningen är `tasks/todo.md`-punkten om CI-wiring av `test-check-frontmatter.sh` + `test-check-public-checklists.sh`.

### L53 [UNIVERSAL] — När en invariant spänner över levande config OCH frusen text får testet inte hävda värde-likhet blint

Datum: 2026-05-27 | Källa: Session 8 K0b (klass: Invariant-test-design / immutabilitet)

En enkelvärde-invariant kan ha bärare av två klasser: **levande** (muterbar config — ska alla hålla samma aktuella värde) och **frusen** (immutabel ADR-beslutstext, arkiv, sessionsdok — innehåller legitimt det gamla värdet). En naiv "alla bärare säger samma siffra"-grind fyrar falskt på frusen text. Rätt design: grinden riktar sig mot de **namngivna levande** platserna (hävdar ömsesidig värde-likhet) och hävdar för **frusna** bärare i stället att en **erratum-not** pekar på aktuellt värde. Konkret i fetch-depth-invariant-grinden: 6 levande bärare (ci.yml ×4, policy.conf, skript-default) hävdas lika; ADR-029/030 hävdas bära erratum. Bevisat av test T5 (ci.yml-kommentar säger "50", config-rader 100 → grinden exkluderar kommentaren, exit 0). Speglar immutabilitets-disciplinen (ADR-001/010/030-errata) applicerad på grind-design.

### L54 [UNIVERSAL] — Verifiera prompt-premisser mot faktiskt disk-tillstånd; ett projektkunskaps-index driftar

Datum: 2026-05-27 | Källa: Session 8 K0b DEL 0 (klass: Forensisk pre-pass / premiss-verifiering)

En prompts premisser om radnummer, värden och fil-mekanismer kan komma från ett stale index. K0b:s forensiska pre-pass (DEL 0, read-only, rapportera-verbatim före edit) fångade två fel-premisser före någon edit: (a) "3 ci.yml fetch-depth-värden" — faktiskt 4 (changed/lint/test/docs) → 6 levande bärare, ej 5; (b) "phase-end-verify matchar ingenting i README" — faktiskt matchade en stale `28` på en andra rad och hade larmat drift vid nästa fas-avslut. Regel: före edit mot nyligt-touchad config/infrastruktur, fastställ grundsanning mot disk (`grep`/`git`/läs källan) och STOPPA så fel-premisser korrigeras — propagera dem aldrig. Speglar L31 + L47 + Pre-K forensisk-pass (hub-konstitutionen) på prompt-premiss-nivå.
