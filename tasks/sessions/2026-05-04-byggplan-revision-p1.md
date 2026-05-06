# Byggplan-revision — P1 Fas-sekvens-revision

> **Status:** ✅ KLAR — alla fyra klungor genomförda, stop-test passerat.
> **Skapat:** 2026-05-04
> **Ägare:** Marcus + Claude Chat
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-byggplan-revision-p1.md`
> **Styrande:** `tasks/byggplan-direktiv.md` §6 P1
> **Föregångare:** `docs/logs/byggplan-revision-inventory.md` (P0, slutförd 2026-05-04)
> **Stop-test:** Slutgiltig fas-lista för byggplanen. Beslut på alla "NEW" och "modified scope"-faser i direktiv §5 fas-tabell.

---

## Del 1 — Prolog

### Syfte

Detta dokument är arbetstrailen för P1-steget i byggplan-revisionen. Dess uppgift är att fatta beslut på alla "NEW" och "modified scope"-faser i direktiv §5, leverera en kort design-not per beslut (scope, inte scope, beroenden, estimat), och konsolidera resultaten till en uppdatering av §5-tabellen som P3 (byggplanen) kan utgå från.

Sessionsdokumentet är den auktoritativa trailen; den faktiska §5-uppdateringen i `tasks/byggplan-direktiv.md` är "current truth" efter att Code har applicerat ändringarna i P3-fönstret. Detta matchar Fas A:s mönster där `2026-05-04-security-hardening.md` är trailen och M1–M8-commits är kodbasen.

### Indata-kontext

Lästa i denna ordning vid sessionsstart:

| # | Fil | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution, principer |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projektkonstitution, kvalitetsribba |
| 3 | `~/Repon/marcus-system/tasks/lessons.md` | Universella lärdomar |
| 4 | `docs/logs/byggplan-revision-inventory.md` | P0-leveransen — primär indata |
| 5 | `tasks/byggplan-direktiv.md` §3, §5, §6 P1, §8.5 | Direktivets ram + frusen kontext + uppgift |
| 6 | `analys/06b-supabase-target.md` | Target-modell för adapter-debt-klassningens 06b-impact-bedömning |
| 7 | `analys/07-migration-plan.md` §A2 | Strangler-fig-sekvens (Persons → Events → Registrations) |
| 8 | `src/data/adapters/AirtableAdapter.ts` | Verifiering av 9 TODO-metoder direkt mot kod |
| 9 | `docs/research/vue-project-analysis.md` | Korsverifiering av adapter-metod-status |
| 10 | `analys/01-extraction.md` §I, §J | Edge Function-kontrakt + mail-flöden |
| 11 | `analys/02-live-state.md` §A | Faktiskt deployade Airtable-automationer |
| 12 | `docs/reference/data-model.md` §F.4 | F.4-dubblettbuggen i create-registration |
| 13 | `docs/conversion-plan.md` §D Fas 6, §L | Hem-flikens scope + 4-flikars-design |

### Källprioritet vid konflikt

1. `tasks/byggplan-direktiv.md` §3 (åtta luckor) + §8.5 (Fas A-fynd) — auktoritativ för revisionen
2. `docs/logs/byggplan-revision-inventory.md` (P0, klar 2026-05-04) — klassad drift mellan conversion-plan och verklighet
3. `analys/06b-supabase-target.md` + `analys/07-migration-plan.md` — låsta target-kontrakt och migrations-sekvens (Gate 4B passerad, Gate 5 underlag)
4. `analys/02-live-state.md` — observerad Airtable-status (MCP-läst 2026-04-28)
5. `src/data/adapters/AirtableAdapter.ts` — kodverkligheten

### Beslutsstrukturen — fyra klungor

P1 består av åtta beslut (fem explicita från direktiv §6 P1 + tre från P0-inventoriets öppna frågor). De är inte symmetriska — vissa beslut är hårdt beroende av andra (kräver dem som indata), andra är mjukt beroende (informeras av men låses inte). Min struktureringsanalys identifierade A5 (adapter-debt) som central beroende-nod.

| Klunga | Beslut | Karaktär | Status |
|---|---|---|---|
| **1 — Fristående uppvärmning** | A4 (Fas B parallell), A1 (Fas 3.5 egen?) | Inga yttre beroenden | ✅ KLAR |
| **2 — Navet** | A5 (adapter-debt-klassning) | Centrala beroende-noden | ✅ KLAR |
| **3 — Sekvensen** | A3 (Fas 6-sekvens), A2 (Fas 5.5 write-flow), B1 (Realtime) | Hård kedja: A5 → A3 → A2; A3 → B1 | ✅ KLAR |
| **4 — Fas 7-konsolidering** | B3 (Fas 5 förenkling), B2 (Background Sync) | B3 → B2 (Fas 7-scope) | ✅ KLAR |

### Beroendegrafen (verifierad mot källor)

```
                          A5  (adapter-debt-klassning)
                          │
                          ▼
   A1                    A3  (Fas 6-sekvens) ──────► B1  (Realtime)
   │                     │
   │ (svagt)             │
   ▼                     ▼
   A2  (Fas 5.5 write-flow) ◄── från A5 (vilken metod är deployad)


   A4  (Fas B parallell)         — fristående
   B3  (Fas 5 förenkling)  ──►   B2  (Background Sync) — Fas 7-scope-kedja
```

**Verifierade hårda beroenden (källspår):**
- A5 → A3: direktiv §5 ("Per-vy: registrera operation i `field-allowlists.ts`") + inventory 6.4 (Fas 6 förutsätter Fas 2.5 adapter-klassning).
- A5 → A2: §8.5.1 ("Allowlist växer organiskt med UI:t" + sliceens DoD kräver första operation registrerad).
- A3 → A2: sliceen blir *mall* för Fas 6:s första domän — sekvens styr sliceens ämne.
- A3 → B1: Realtime-frågan är primärt en Hem-flik-fråga; sekvensen avgör när Hem byggs.
- B3 → B2: båda flyttar arbete till Fas 7; B2:s defer-fråga är meningsfull först när Fas 7-scope efter B3 är känd.

**Mjukt beroende (verifierat och avhandlat):**
- A1 → A2 (Marcus' bäring-notering): A1 påverkar Fas 5.5:s *beroenderad* (om 3.5 är egen fas blir den ett namngivet beroende), inte sliceens *innehåll*. Påverkar dokumentation, inte beslutsordning.

---

## Del 2 — Klunga 1: Fristående beslut

### A4 — Fas B parallellitet

#### Beslut

**Fas B är ett parallell-spår med två synk-gates** — inte "helt parallell" och inte beroende av Fas A. Fas A är klar och dess leveranser är låsta; Fas B berör inte M1–M8. Däremot är Fas B inte fristående från resten av byggplanen — den korsar `field-allowlists.ts` och `Status.ts`/Zod-scheman, vilket kräver två specifika synk-punkter, inte kontinuerlig samordning.

#### Motivering

Genomgång av 06a + Fas 4a-prompten visar att A1–A12 är schema-, automation- och datakvalitetsarbete i Airtable-basen — utanför Edge Functions-skiktet som Fas A härdade. Inga av Fas A:s arkitekturmönster (operations-API, `corsHeadersFor(req)`, `requireUser`, INVARIANT round-trip) påverkas av Fas B. Däremot:

- Om Fas B byter fältnamn på ett fält som en operation i `field-allowlists.ts` refererar, smäller skrivvägen vid nästa anrop.
- Om Fas B ändrar status-värden eller option-listor för single-selects, drift:ar `Status.ts` och Zod mot verkligheten — vilket är exakt det Fas 2.5 ska fånga.

Dessa är handshake-relationer, inte blocking dependencies. Att deklarera Fas B "helt parallell" döljer dem; att deklarera den "blockerad av Fas A" är felaktigt och förlänger en drift som kan starta nu.

#### Design-not

**Scope (i Fas B):** A1–A12 enligt 06a Del A (driftkritiskt: A1–A3 ungefär), Del B (cleanup: A4–A8), Del C (preserve-beslut: A9–A12). Drift-arbete på Airtable-basen — fältnamn, automationer, datakvalitet, view-städning, option-listor, dokumentation av crosswalk-data inför Fas E.

**Inte scope:** Edge Function-ändringar (Fas A territorium, låst). UI-ändringar (Fas 5.5/6). Supabase-migration (Fas E). Ändringar i `field-allowlists.ts` eller `Status.ts` (Fas 2.5/5.5/6 äger dem; Fas B levererar bara *signaler* när schema ändras).

**Beroenden:**
- Inga hårda beroenden inåt eller utåt.
- **Synk-gate 1 (hard):** A1–A12-schemaändringar inventerade och kategoriserade som "redan applicerade" / "kommer appliceras före Fas 2.5" / "appliceras efter Fas 2.5" *innan* Fas 2.5 startar. Annars synkar Fas 2.5 mot fel verklighet.
- **Synk-gate 2 (handshake per operation):** vid varje Fas 5.5/6-leverans där en ny operation registreras i `field-allowlists.ts`, kontrollera fältnamn mot 06a-status. 5-min-check, inte blocking gate, men måste vara explicit i fas-prompten.

**Ägarskap:** Lotta + Roger primärt (Airtable Interface-arbete, automation-justeringar). Code stödjer punktvis när Airtable Automation-konfig kräver kodändring eller när `field-allowlists.ts` behöver synkas. Inte Chat-arbete.

**Estimat:** Parallell drift fördelad över byggplanens löptid. 06a Del A ca några dagars Lotta+Roger-arbete; Del B + Del C ytterligare 1–2 veckors fördelat arbete. Inte sessions. Räknas inte in i byggplanens session-totalsumma.

---

### A1 — Fas 3.5 (SCENARIOBESLUT)

#### Beslut

**A1 låses som scenariobeslut idag.** Trigger-kriterier sätts skarpa nedan. Utfallet aktiveras av P2:s första storleksbedömning av `ACCESSIBILITY-CHECKLIST.md`-omskrivningen — inte av ny Chat-diskussion. Samma princip som Sentry-DSN i Fas A: defer beslut som mår bra av bättre indata, lås kriterierna nu.

#### Motivering

A1:s rätta utfall beror på två observerbara fakta som inte är synliga från P0/P1: omfattningen av checklist-omskrivningen (innehållsvolym) och behovet av tillhörande infrastruktur (axe-core/jest-axe/Playwright a11y-setup, ARIA-mönster-bibliotek för React Aria-overlays/listbox/menyer/disclosure). Ingen av dessa kan bedömas pålitligt utan att P2 öppnar `ACCESSIBILITY-CHECKLIST.md`, jämför Vue/FKUI-anteckningarna mot React Aria-stacken, och rapporterar arbetsmängd. Sentry-DSN i Fas A löstes med samma princip — beslutskriterierna fanns före Gate A1, men *valet* gjordes med faktisk indata.

#### Trigger-kriterier (skarpa)

| Dimension | Tröskel **integrerat i Fas 3** | Tröskel **egen fas (Fas 3.5)** |
|---|---|---|
| Checklist-omskrivning ensam | ≤ 1 kväll (≈ 3–4 h) | > 1 kväll |
| Test-infrastruktur krävs | Nej, eller bara import av jest-axe i befintlig setup | Ja — ny axe-config, Playwright a11y-runner, fixture-mönster |
| ARIA-mönster-bibliotek krävs | Nej | Ja — kodexempel/test-mall per React Aria-pattern (overlay, listbox, disclosure, menubar, combobox) |
| Egen kvalitetsgrind motiverad | Nej — Fas 3:s DoD räcker | Ja — separat "a11y-baseline godkänd"-gate innan Fas 3 startar |

**Binär trigger-regel:** **Egen fas** om *minst en* av rad 2 (test-infrastruktur) eller rad 3 (mönster-bibliotek) är JA. Övriga konstellationer → **integrerat**. Rad 1 (volymen) är tie-breaker, inte primär drivare — en stor checklist utan tillhörande infrastruktur motiverar inte separat fas-prompt.

#### Design-not (gäller båda utfallen)

**Scope (oavsett utfall):** Omskrivning av `ACCESSIBILITY-CHECKLIST.md` från Vue/FKUI-mönster till React Aria + WCAG 2.2 AA. Ev. test-setup och ARIA-mönster-bibliotek (om utfallet blir egen fas).

**Inte scope:** Komponentimplementation (det är Fas 3). Specifika a11y-fixar i befintlig kod (Fas 7 vid behov). FUTURE-COMPAT-överväganden (egen spec, oförändrad).

**Beroenden:** Ingen mot tidigare faser. Blockerar Fas 3:s DoD oavsett utfall (Fas 3 kan inte kvalitetsgranskas mot en Vue-orienterad checklist). Vid integrerat utfall: ingen separat gate, omskrivningen är Fas 3:s första leverans. Vid egen fas: blockerar Fas 3 helt tills 3.5-gate passerad.

**Estimat:**
- Integrerat: 0 separat sessionstid (Fas 3 utvidgas marginellt — checklist-omskrivningen blir Fas 3-DoD-punkt).
- Egen fas: **0,5–1 session** (per nuvarande §5 — kvarstår oförändrat).

#### Krav på P2

P2:s första leverans i `ACCESSIBILITY-CHECKLIST.md`-omskrivningen *måste* rapportera:
1. Storlek på textomskrivningen (timmar)
2. Ja/nej på test-infrastruktur-behov
3. Ja/nej på mönster-bibliotek-behov

Detta är trigger-data för A1, inte en bonus. Ska vara explicit i P2-direktivet när det skrivs.

---

## Del 3 — Klunga 2: A5 adapter-debt-klassning

### Princip-position

**Fas 2.5 deployar noll Edge Functions.** Detta är den centrala observationen från Klunga 2. Fas 2.5:s scope blir renodlat schema-kontrakt-sync: `Status.ts`-omskrivning mot `data-model.md`, Zod-validering vid alla externa datagränser, **klassning** av alla 9 adapter-debt-metoder (tabellen nedan), och ev. borttagning av stub-metoder från `AirtableAdapter` som klassas som död kod. Inga EF-deploys.

Motiveringen är M4-principen ("operations utan empirisk användning är onödig attack-yta", Fas A-arkitekturmönster) kombinerad med strangler-fig-disciplinen från 07 §A2: en metod deployad i Fas 2.5 är en operation utan empirisk UI-konsument, och Fas 6:s strangler-fig-sekvens kommer att deploya den naturligt när domänen byggs. Att deploya i förskott sparar inte tid — det förlänger bara attack-ytan.

### Klassningstabell — alla 9 TODO-metoder

| # | Adapter-metod | Edge Function | Första UI-användning | Klass | 06b-impact | Anmärkning |
|---|---|---|---|---|---|---|
| 1 | `fetchEvent` | `get-event` | Fas 6 Events — `/event/[id]` | **Defer → Fas 6b (Events-domän)** | Liten — events-tabell lookup, snarlik fetchEvents | Trivial att deploya när Events-domänen byggs. Inget skäl till tidig deploy. |
| 2 | `fetchPerson` | `get-person` | Fas 6 Persons — `/personer/[id]` | **Defer → Fas 6a (Persons-domän, FÖRST i strangler-fig-sekvensen)** | Medel — target gör join över `persons` + `person_identifiers` + `lead_profiles` | Persons är *första* domän i 07 §A2. Alltså första TODO-metoden som deployas i Fas 6 (sub-fas 6a). |
| 3 | `createRegistration` | `create-registration` | Fas 6 Mer (väntelista-konvertering) ELLER Fas 5.5 om sliceen är skapa-anmälan | **Defer → Fas 6c (Registrations-domän)** med design-skuld-flagga | **STOR** — target har idempotency_key, registration_attendees, status-enum, transactional-design | F.4-dubblettbuggen är aktiv idag i psionautics. Om vi deployar samma flöde i React-versionen reproducerar vi buggen. **Krav:** EF-implementation MÅSTE inkludera *minimal* idempotency-mekanism (klient-genererad idempotency_key i header, server-deduplikering över 60 sek) — annars deployar vi en känd bugg. Tar 1–2h extra på EF-deploy, sparar dubblett-städning senare. |
| 4 | `fetchAttendance` | `get-attendance` | Fas 6 Events — `/event/[id]` Närvaro-flik (Scenario 3) | **Defer → Fas 6b (Events-domän, Närvaro-flik)** | Medel — bygger på FK-kedja `event` → `event_session` → `attendances` | Idag formel-baserad i Airtable (RECORD_ID-formler), target använder riktig FK. EF-implementationen läser bara — ingen arkitekturskuld. |
| 5 | `fetchWaitlist` | `get-waitlist` | Fas 6 Mer — väntelista | **Defer → Fas 6c (väntelista-konvertering tillsammans med Registrations)** | Liten — `waitlist_entries`-läsning, samma form post-Fas E | Lågfrekvent men kritisk när Lotta öppnar plats. Trivial deploy. |
| 6 | `fetchLeads` | `get-leads` | Fas 6 Mer — Leads-vy | **Villkorligt defer → Fas 6e (Mer)** ELLER **kandidat för död kod** | Medel — target splittar i `lead_magnets` + `offer_downloads` + `lead_profiles` | Lottas användning idag är låg (verifierat via interface-flöden i 02-live-state.md). Om Mer-fliken förenklas i Fas 6:s scope-arbete blir denna **död kod**. Behåll men skjut till slutet av Fas 6 (sub-fas 6e), omvärdera under Fas 6:s sub-fas-planering. |
| 7 | `fetchEngagements` | `get-engagements` | Fas 6 Persons — `/personer/[id]` historik | **Defer → efter Gate 4B-resolution (post-Fas E-fönster)** | **STOR + osäker** — Gate 4B fråga 4 är ÖPPEN: ska Touchpoints/Engagemang/Kontaktlogg vara en `interactions`-tabell eller separata? Vi vet inte target. | Lottas Persons-detaljvy klarar sig med basic person-info + registrationshistorik från befintliga `fetchRegistrations(filter:personId)`. Att deploya en EF som *garanterat* skrivs om post Gate 4B är fel investering. **Klart svagaste deploy-kandidaten av alla 9.** |
| 8 | `sendEmail` | `send-email` | Fas 6 (per-anmälan actions: påminnelse/bekräftelse-resend/plus-one) | **Defer → Fas 6e (Mer-fliken Mail eller per-anmälan actions)** med arkitekturskuld-ADR | **ENORM** — target använder `communication_outbox` + `communication_attempts` + `communication_templates`. Helt annan modell än direct Resend-call. | Implementation: kopiera från psionautics `send-email/index.ts` (commit `1a07d1b`) som direct Resend-call. **Krav:** ADR som dokumenterar att direct-Resend är medvetet skuld, migreras till outbox post-Fas E. Utan ADR förlorar vi spårbarheten på en *garanterad* omskrivning. |
| 9 | `fetchMailLog` | `get-mail-log` | Fas 6 Mer — Mail-vy (om Mer-fliken har Mail) | **Villkorligt defer → Fas 6e (Mer)** ELLER **kandidat för död kod** | Medel — target läser `communication_outbox` status-history | Lottas användning idag är låg-medel (kollar maillog när någon säger "fick ej mail"). Som leads — beror på Mer-flikens scope-beslut. Behåll, omvärdera. |

### Mönster som framkommer

**(1) Fas 2.5 deployar noll Edge Functions.** Renodlat schema-kontrakt-sync (se Princip-position ovan).

**(2) 7 av 9 deployas i Fas 6, sekvenserade per sub-fas.** Persons-domänen drar `fetchPerson` först (sub-fas 6a). Events-domänen drar `fetchEvent` + `fetchAttendance` (sub-fas 6b). Registrations-domänen drar `createRegistration` + `fetchWaitlist` (sub-fas 6c). Mer-fliken drar ev. `sendEmail` + ev. `fetchLeads` + ev. `fetchMailLog` (sub-fas 6e).

**(3) 1 metod skjuts utanför Fas 6 helt.** `fetchEngagements` — target-modellen är osäker (Gate 4B fråga 4 öppen). Persons-detaljvyn fungerar utan den.

**(4) 2 metoder är gränsfall för död kod.** `fetchLeads` och `fetchMailLog` beror på Mer-flikens scope. Beslutas under Fas 6:s sub-fas-planering — inte här.

### Två arkitekturskulder kräver explicita ADR:er

Båda noteras som krav på Fas 6:s prompt, inte beslut här:

#### ADR — `createRegistration` idempotency

**Innehåll:** EF-implementationen i Fas 6c ska ha klient-genererad `idempotency_key` (UUID v4 i request-header) + 60-sek server-deduplikering för att inte reproducera F.4-dubblettbuggen från psionautics.

**Argumentet:** Lottas väntelista-konvertering är ett kärnflöde, dubblettrisken är aktiv idag (verifierat i `data-model.md` §F.4), och idempotency-pattern är liten engångskostnad relativt potentiell datastädnings-kostnad.

**Defer-möjlighet:** Marcus kan välja att skjuta idempotency till Fas E (när communication_outbox-mönstret kommer ändå). Då måste createRegistration i Fas 6c medvetet ärva F.4-buggen *med ADR-spårning*.

#### ADR — `sendEmail` direct-Resend-skuld

**Innehåll:** EF-implementationen i Fas 6e är direct-Resend (kopia från psionautics commit `1a07d1b`). Detta är medvetet skuld — target är `communication_outbox`-arkitektur post-Fas E.

**Argumentet:** ADR krävs för att inte tappa spårbarhet på den garanterade omskrivningen. Utan ADR vet Code post-Fas E inte att den arkitekturen ska ersättas, inte iteratiivt förbättras.

---

## Del 4 — Klunga 3: Sekvensen

### A3 — Fas 6-sekvens

#### Beslut

**Strangler-fig vinner: Persons → Events → Registrations + Attendances + Väntelista → Hem-aggregering → Mer.** "Hem är viktigast" omformuleras som *kvalitetsprioritet* (mest scenario-mapping, mest polering, designerande Hem får mest tankearbete), inte som *byggordning*.

#### Motivering

Fyra konvergerande argument:

**(1) Auktoritativ källa redan nästan låst.** §5 i nuvarande direktiv säger "Sekvens följer 07 strangler-fig". Inventory 6.2 klassade Hem-först-byggordning som "behöver omformuleras". 07 §A2 listar Persons → Events → Registrations som auktoritativ migrationssekvens, motiverat: "identity och events måste finnas före registrations; attendees måste finnas före attendances". Att vrida tillbaka till Hem-först nu skulle motsäga tre dokument samtidigt.

**(2) Hem är aggregering, inte fundament.** Per conversion-plan §D Fas 6: Hem läser nya anmälningar (`fetchRegistrations`), nästa event (`fetchEvents`), obetalda (`fetchRegistrations` med statusfilter). Att bygga Hem mot tomma underliggande domäner = mocka-data eller halv-implementerade queries — det är *pseudo-värde*, inte tidigt värde. Hem som första domän skapar dessutom ett kortvarigt scope-tryck att leverera *delar* av tre domäner samtidigt, vilket motsäger strangler-fig-disciplinen.

**(3) Användarvärde-argumentet håller inte.** Lottas dagliga arbetsflöde startar i Hem (Scenario 1) men leder direkt till drill-down: Hem → klick på anmälan → Event-detalj (Scenario 2/3) eller Hem → klick på person → Persons-detalj (Scenario 4). Hem ensamt utan drill-down är halvt värde. Persons-fliken som fungerar fullt ut levererar omedelbar Scenario 4-nytta — Lotta kan börja söka personer dag ett av Fas 6.

**(4) Sliceens läransvar respekteras.** Fas 5.5 etablerar mutation-mönstret. Persons är *läs-tung* domän med en write (uppdatera personnotering eller flagga) — den är låg-risk-validering att Fas 5.5-mönstret håller. Att starta Fas 6 mot Hem skulle kräva att vi koordinerar mutations över tre domäner från första session. Det är fel ordning på risk.

#### Sekvenseringsdetaljer — sub-fas-allokering

Mer-fliken är inte en domän — den är en åtkomst-grupp av sub-vyer (väntelista, leads, mail, inställningar). Sub-allokeringen blir därför:

| Sub-fas | Domän/grupp | Estimat | Innehåll | TODO-EF som deployas |
|---|---|---|---|---|
| **6a** | Persons | 0,75 sess | `/personer` lista (befintlig fetchPersons) + `/personer/[id]` detaljvy + minimal write (uppdatera notering) | `fetchPerson` |
| **6b** | Events | 0,75 sess | `/event` lista (befintlig fetchEvents) + `/event/[id]` info-vy + Närvaro-flik | `fetchEvent`, `fetchAttendance` |
| **6c** | Registrations + Väntelista | 1 sess | Anmälda-flik på Event-detalj, väntelista-konvertering på Mer, `createRegistration` med idempotency-ADR | `createRegistration`, `fetchWaitlist` |
| **6d** | Hem-aggregering | 0,5 sess | `/hem` med greeting + nya anmälningar + info-cards + CTA. Polling-strategin från B1 implementeras här | (inga nya — använder befintliga read-EF) |
| **6e** | Mer-fliken (villkorlig) | 0,5 sess | Mail-vy om behållen, Leads-vy om behållen. Sub-fas är gränsen för dödkods-omvärderingen | `sendEmail`, ev. `fetchLeads`, ev. `fetchMailLog` |

**Total: 3,5 sessioner — oförändrat estimat mot nuvarande §5.**

**Per-sub-fas-DoD:** tillhörande EF deployad, operation registrerad i `field-allowlists.ts`, deny/allow-test grönt, vy-Playwright baseline.

#### Design-not

**Scope:** Strangler-fig-ordning enligt 07 §A2 + 06b FK-kedja, sub-fas-allokering enligt tabell ovan. Hem byggs med polling-baserad pseudo-realtid (B1 nedan).

**Inte scope:** Hem-först-byggordning. Mer-fliken som monolitisk leverans (den splittas i 6c för väntelista och 6e för resten). Mocka-data för domäner som inte är på plats — om en sub-fas behöver data från icke-byggd domän är det signal att sekvensen är fel.

**Beroenden:** Fas 5 + Fas 5.5 (mutation-mönster) + Fas 3 (UI-primitiver) + ev. Fas 3.5 + Fas 2.5 (adapter-debt klassad). Inom Fas 6: 6a → 6b → 6c är hård kedja; 6d kräver att 6a + 6b + 6c levererat data-EF:er; 6e är fristående och kan defer:as.

**Estimat:** 3,5 sessioner totalt, sub-fördelat enligt tabell.

---

### A2 — Fas 5.5 vertikal slice

#### Beslut

**Sliceen är "markera anmälan som betald" via befintlig `update-record` EF med ny operationKey (`mark-registration-paid` eller motsvarande, exakt namn finslipas i fas-prompt). Hostas i en minimal Event-detaljvy med Betalning-flik.**

#### Motivering

Givet Klunga 2-klassningen att inga TODO-metoder deployas före Fas 6, måste sliceens write-flow gå genom en redan deployad EF. Det isolerar sliceens läransvar till mutation-mönstret + operations-allowlist + tester — exakt vad §8.5.1 specar.

#### Kandidatjämförelse

| Kandidat | Ny EF krävs? | Arkitekturskuld? | Lottas värde | Sliceen-lämplighet |
|---|---|---|---|---|
| **Markera betalning** | Nej (`update-record` finns) | Ingen | Hög — kärnflöde, §A7-automation triggar idag på samma fält | ✅ **Vinner** |
| Markera närvaro | Indirekt — kräver `fetchAttendance` (TODO) för att visa data | Ingen | Hög — Scenario 3-flöde | Drar in TODO-metod, motsäger Klunga 2 |
| Skapa anmälan | Ja (`createRegistration` TODO) | Stor — F.4-dubblettrisk + idempotency-ADR | Medium | Drar in arkitekturskuld i fas vars syfte är *bevisa mönster* |
| Skicka påminnelse | Ja (`sendEmail` TODO) | Stor — direct-Resend-skuld + ADR | Hög | Drar in EF-deploy + Resend-credentials i sliceen |

Markera betalning vinner på fyra dimensioner samtidigt: ingen ny EF, ingen arkitekturskuld, omedelbart Lotta-värde, ren operations-allowlist-pedagogik.

**Bonus:** boolean-toggle (betald/ej betald) är idealisk för optimistic mutation-mönstret som conversion-plan §D Fas 6 [GA] specar. TanStack Query `useMutation` med `onMutate` (optimistic update) → `onError` (rollback) → `onSuccess` (invalidate) blir den exakta mall som Fas 6:s alla mutations sedan följer.

#### Sliceens DoD (11 punkter)

Per §8.5.1 + utvecklat med konkreta verifieringspunkter:

1. Operation `mark-registration-paid` (preliminärt namn) registrerad i `supabase/functions/_shared/field-allowlists.ts` med `tableId: tbl[Anmälningar]` och `allowedFields: ['Betald']` (eller exakt fältnamn — verifieras mot data-model.md i fas-prompt).
2. Playwright deny-test: anonym/ogiltig user → operation → 401.
3. Playwright deny-test: admin-user → operation med fält *utanför* allowlist → 400.
4. Playwright allow-test: admin-user → operation med rätt fält → 200, Airtable-rad uppdaterad.
5. UI-leverans: minimal Event-detaljvy (`/event/[id]`) med Betalning-flik som listar registrations(eventId) och visar per-rad "Markera betalad"-knapp.
6. TanStack mutation-mönster med optimistic update, error rollback, success invalidate på `['registrations', eventId]` query-key.
7. Felhantering: nätverksfel → rollback + Lotta-vänligt felmeddelande. 401 → redirect till login (auth-provider-pattern från Fas 2).
8. **ADR (#NN) för mutation-mönstret** — explicit mall som Fas 6:s alla mutations refererar.
9. BUILD-LOG-rad med faktiskt operation-namn + allowlist-utdrag + faktisk Edge Function-anropssignatur.
10. Fas 5.5-aktiveringsguidens 5 steg (§8.5.1 ref) körda och verifierade (lägg till operation, avskip 3 tester, byt TODO_REPLACE-token, re-deploya, kör tester).
11. Vy-Playwright baseline för Event-detalj minimal.

#### Design-not

**Scope:** Operations-baserad mutation från klient → `update-record` EF → Airtable. Optimistic UI-mönster. Operations-allowlist-utvidgning. Tre Playwright-tester (2 deny, 1 allow). Minimal Event-detaljvy som *host* — bara rubrik + registrations-lista + Betalning-flik. ADR för mutation-mönstret. Aktiveringsguide körd.

**Inte scope:** Full Event-detaljvy (kommer i Fas 6b). Närvaro-flik (kommer i Fas 6b). Anmälda-flik med all designkontext (kommer i Fas 6c). Andra mutations än markera-betalning. EF-deploy. Multi-record batch-uppdatering.

**Beroenden:** Fas 5 (app-shell) + Fas 3 (UI-primitiver, Button minst) + ev. Fas 3.5 + Fas 2.5 (Status.ts synkad så registrations-status kan visas korrekt + Zod på registrations response). Inte beroende av Fas 6-domänval — sliceens hostvy är minimal Event-detalj som senare *utvidgas* i 6b, inte ersätts.

**Estimat:** 2 sessioner — oförändrat mot §5.

- **Session 1:** TanStack mutation-setup + operations-allowlist-utvidgning + 3 Playwright-tester + EF-test mot staging.
- **Session 2:** Minimal Event-detaljvy + Betalning-flik UI + optimistic UI-integration + felhantering + ADR + BUILD-LOG + aktiveringsguide körd.

Tight men rimligt. **Mitigering om session 2 spiller över:** ADR + BUILD-LOG kan migreras till Fas 6a-start om tiden tar slut, men aktiveringsguidens 5 steg får inte skjutas — de är sliceens hela poäng.

---

### B1 — Realtime

#### Beslut

**Hybrid: polling + manuell refresh i Fas 6d. Realtime-subscription defer:as till Fas E.**

Specifikt: TanStack Query `refetchInterval: 60s` när Hem-tab är synlig, `refetchIntervalInBackground: false`, refetch på `visibilitychange → visible`, samt pull-to-refresh på `/hem`-routen. Timestamp för senaste refetch visas i Hem-flikens header ("Senast uppdaterat 08:14").

#### Motivering — alternativjämförelse

Tre alternativ jämförda mot Lotta-värde, arkitekturskuld och migrations-väg:

| Alternativ | Lotta-värde | Skuld | Migrations-väg post-Fas E |
|---|---|---|---|
| (a) Defer helt | Lågt — Hem-fliken statisk till Fas E. "3 nya sedan igår" blir inaktuellt mid-day. | Ingen | Trivial — lägg till Realtime-subscription |
| (b) Polling ren | Bra — nära-realtid 60s, pull-to-refresh för push-känsla | Liten — TanStack Query-config, ingen EF-skuld | Trivial — byt query-funktion bakom samma TanStack key |
| (c) Manuell refresh ren | Medium — Lotta måste aktivt refresha | Ingen | Trivial — lägg till bakgrundssubscription |
| **Hybrid (b)+(c)** | **Hög** — polling ger automatik + pull-to-refresh ger kontroll vid behov | **Liten** — samma som (b) | **Trivial** — samma som (b) |

Argumenten för hybrid över ren polling:

- Pull-to-refresh är iPad-standardgest. Att inte ha den när Lotta arbetar primärt på iPad är UX-skuld större än polling-overhead.
- Vid offline-läge (TanStack Query offline-config från Fas 5 [GA]) blir polling pausad. Pull-to-refresh som manuellt fallback är då enda sättet för Lotta att trigga retry när uppkopplingen är tillbaka.

#### Resursbedömningar

**Airtable-rate-limit:** 5 req/sec per base. Vid 60s polling × ~4 query-keys i Hem-fliken (events, registrations-recent, registrations-unpaid, persons-count) = 4 req per minut = 0,067 req/sec. Marginalen är 75x. Säkert.

**Batterilivslängds-bedömning på iPad:** Med `refetchIntervalInBackground: false` är polling helt pausad när Lotta växlar tab eller låser iPad. Endast när Hem-tab är aktivt synlig pollas. Försumbar batteripåverkan.

**Migrations-vägen post-Fas E:** TanStack Query-arkitekturen abstraherar bort underliggande data-källa. När Supabase blir primär DB byter vi `queryFn: () => airtableAdapter.fetchRegistrations(...)` mot `queryFn: () => supabaseAdapter.fetchRegistrations(...)` + ev. Realtime-subscription via TanStack Query `useEffect`-pattern. UI-komponenter rörs inte. **Detta är hela poängen med DataSourceAdapter-pattern** — bytet är en data-lager-ändring, inte en UI-ändring.

#### Design-not

**Scope:** TanStack Query polling-config på Hem-flikens query-keys (60s, visibility-aware, paus i bakgrund, 30s staleTime). Pull-to-refresh-komponent på `/hem`-routen (kan återanvändas för andra flikar senare men är inte krav nu). Timestamp-indikator i Hem-flikens header som visar senaste lyckade refetch-tid. ADR (#NN) som dokumenterar polling-vs-Realtime-valet och migration-vägen post-Fas E.

**Inte scope:** Polling i Event/Personer/Mer-flikarna (de pollar inte — TanStack staleTime räcker, Lotta navigerar fram och tillbaka och får färsk data via auto-refetch på navigation). Edge Function-trigger-bro Airtable → Supabase. WebSocket-infrastruktur. Realtime-subscription. Background sync (det är B2-frågan i Klunga 4).

**Beroenden:** Fas 5 (TanStack Query setup + offline-config). Fas 6a + 6b + 6c (Persons + Events + Registrations måste finnas innan Hem aggregerar dem). Strangler-fig-sekvensen från A3 är hård precondition: Hem byggs i 6d, sist.

**Estimat:** Inkluderat i 6d:s 0,5 session.

- Polling-config: ~30 min (TanStack QueryClient defaultOptions + per-query overrides).
- Pull-to-refresh: ~1h om vi använder en redan etablerad pattern, mer om vi måste designa själva.
- Timestamp-indikator + ADR + BUILD-LOG: ~30 min.

Total: ryms i 6d:s halv-sessionsbudget om Hem-flikens andra delar (greeting, info-cards, CTA) är tighta.

---

## Del 5 — Klunga 4: Fas 7-konsolidering

### B3 — Vad förenklas i Fas 5?

#### Beslut

**Selektiv förenkling — flytta tre [GA]-tillägg + widget-error-boundary till Fas 7. Behåll de essentiella.**

| [GA]-tillägg | Klass | Motivering |
|---|---|---|
| Error boundaries — app + sektion-nivå | **BEHÅLLS i Fas 5** | Essentiellt: Lotta får vänligt felmeddelande istället för vit skärm |
| Error boundaries — widget-nivå | **FLYTTAS till Fas 7** | Tyst degradering — kan göras när vi har production-data om vilka widgets är fragila |
| Service worker / Workbox (3 strategier) | **BEHÅLLS i Fas 5** | Essentiellt: Lottas eventdag på dålig uppkoppling — utan SW dör appen |
| TanStack Query offline-config | **BEHÅLLS i Fas 5** | Triviallt billigt (~30 min) + nödvändigt för att SW-cachen ska visas korrekt |
| View Transitions implementation | **FLYTTAS till Fas 7** | Visuellt nice (spatial continuity) men inte funktionellt — ingen Lotta-impact om frånvarande |
| Speculation Rules (prerender + prefetch) | **FLYTTAS till Fas 7** | Optimering — Lotta märker inte att prerender saknas, märker bara längre TTI |
| web-vitals rapportering | **FLYTTAS till Fas 7** | RUM mot Sentry — ingen Lotta-impact, naturligare där eftersom Fas 7 är nära deploy och production-trafik |

#### Motivering

Original-conversion-plan §D Fas 5 estimerar 1.5 sessioner inklusive sex [GA]-tillägg. Tilläggens fördelning i timmar (uppskattat från komponent-komplexitet):

| Tillägg | Estimat | Klass |
|---|---|---|
| Error boundaries app + sektion | 2h | Behålls |
| Error boundaries widget-nivå | 1–2h | Flyttas |
| Workbox SW (3 strategier + offline.html) | 3–4h | Behålls |
| web-vitals (paket + sendBeacon) | 1h | Flyttas |
| TanStack offline-config | 30 min | Behålls |
| View Transitions (CSS + JS + per-komponent) | 2h | Flyttas |
| Speculation Rules (prerender + prefetch-config) | 1h | Flyttas |

Att flytta widget-error + View Transitions + Speculation Rules + web-vitals = ~5h besparing → Fas 5 ner från 1.5 till **1 session**.

**Princip för urvalet:** essentiellt vs nice-to-have med Lotta som måttstock. Lottas eventdag på Borghamn-typ-event (dålig uppkoppling) är showstopper-scenariot. Service worker + offline-fallback + TanStack-cache + grundläggande error boundaries är vad som gör att appen *fungerar* där. View Transitions, Speculation Rules och web-vitals är polering — viktig polering, men inte essentiell för "appen fungerar".

**Källspår:** `gap-analysis.md` Fas 5-sektion bekräftar att error boundaries + service worker + stale-data-visning är "skillnaden mellan 'appen dog' och 'appen har koll även utan internet'". Det är just dessa som behålls. View Transitions kallas "blind fläck" men på Apple-nivå-ribba — inte showstopper för Lotta.

#### Design-not

**Scope (Fas 5):** Minimal app-shell + tab bar (4 flikar) + skip-to-content + route announcer + safe-area-inset-bottom + responsivt 375/768/1024 + `prefers-reduced-motion` + `prefers-contrast:more` + **error boundaries app/sektion-nivå** + **Workbox SW (cache-first/network-first/offline.html)** + **TanStack Query offline-config**.

**Inte scope (Fas 5, flyttas till Fas 7):** Error boundary widget-nivå. View Transitions implementation (`@view-transition`, `startViewTransition`, `view-transition-name`). Speculation Rules (prerender + prefetch). web-vitals rapportering till Sentry.

**Beroenden:** Fas 0 + 1 + 2 + 2.5 + 3 (+ ev. 3.5). Inte beroende av Fas 5.5 — sliceen kommer *efter* Fas 5.

**Estimat:** **1 session (förenklat från 1.5).**

**ADR krävs:** ADR (#NN) som dokumenterar vilka [GA]-tillägg som flyttades och varför, så Fas 7-prompten kan referera ett ställe.

---

### B2 — Background Sync i Fas 7 eller Fas 8?

#### Beslut

**Defer Background Sync till Fas 8.** Lägg till en Fas 8-rad i §5-tabellen som "Framtid (post-Fas E)" med Background Sync som första leverans.

#### Motivering — tre konvergerande argument

**(1) Fas 7-storlek efter B3.** Fas 7 ärver redan från B3: View Transitions (2h) + Speculation Rules (1h) + web-vitals (1h) + widget-error-boundary (1–2h) = ~5h. Plus Fas 7:s nuvarande scope (3 ADR:er från P0, DataTable villkorlig, CSP-plugin, test-prefix-exkludering, PostCSS-fix-bedömning, vy-namn i design-audit, chaos testing, deploy-prep). Original-estimat 2 sessioner blir realistiskt 2.5 sessioner. Att lägga till Background Sync (~0.5–1 session i sig) trycker Fas 7 till 3–3.5 sessioner — över rimlig fas-storlek.

**(2) Arkitekturskuld post-Fas E är garanterad.** Background Sync med Workbox + IndexedDB-baserad mutation-kö är en Airtable-eran-lösning. När Supabase blir primär DB (Fas E) hanteras offline-mutations annorlunda — Supabase-klienten har sin egen lokal-state-mekanism, och target-modellens `communication_outbox` + `audit_log` ändrar hur retry/dedup designas. Att bygga Background Sync mot Airtable, deploya, sedan skriva om post-Fas E är dubbelt arbete. Defer till Fas 8 betyder "bygg det när arkitekturen är slutlig".

**(3) Lottas eventdag-flow är hanterbar utan Background Sync i mellantiden.** Fas 6:s optimistic UI + rollback-mönster ger Lotta visuell feedback om en mutation misslyckades (rad återgår till "ej markerad" + felmeddelande). Manuell retry via re-klick fungerar. Det är inte perfekt UX, men det är *säkert* (ingen tyst dataförlust) och det är *kommunicerande* (Lotta vet vad som hände). Background Sync skulle göra det smidigare, inte funktionellt.

**Bonus-argument: Fas 8-namn matchar conversion-plan.** Original-conversion-plan §D Fas 8 är "Passkeys, push, offline". Background Sync är offline-mutation — hör dit semantiskt.

#### Design-not

**Scope (Fas 8):** Background Sync API-integration via `workbox-background-sync`. Mutation-kö-design baserad på Fas E:s slutliga arkitektur (Supabase eller hybrid). UI-feedback ("Synkas när du är online" + retry-indikator). Konflikthantering för raceconditions med Realtime-subscriptions från Fas E.

**Inte scope (Fas 8, denna Klunga):** Hela Fas 8:s innehåll. Klunga 4 låser bara att Background Sync hör hemma där — inte resten av Fas 8. Passkeys + push + ev. andra offline-features är separata beslut för en framtida revision.

**Beroenden:** Fas E klar (target-arkitektur låst). Fas 7 deploy klar (production-instrumentering existerar för att mäta hur ofta Background Sync skulle ha aktiverats — empirisk data för design).

**Estimat:** Inte fastställt. Klassas som "framtid" i §5 — likadant som Fas E är "DEFER". Estimering görs när Fas 8 aktualiseras.

**ADR krävs:** ADR (#NN) som dokumenterar varför Background Sync defer:as från Fas 7 till Fas 8 (arkitekturskuld + Fas 7-storlek + Lotta-flow-tolerans). Skrivs vid Fas 7-start så det är tydligt för framtida läsare att Fas 7 *inte* glömde det — det var ett medvetet val.

---

## Del 6 — Konsoliderad §5-uppdatering

Sammanställning av alla §5-rader som berörs av Klunga 1–3. Klunga 4-effekter läggs till efter att Klunga 4 körs.

| Fas | Status nu | Uppdaterad anmärkning efter Klunga 1–3 |
|---|---|---|
| 0 | KLAR | (oförändrat) |
| 1 | KLAR | (oförändrat) |
| A | KLAR | (oförändrat) |
| 2 | NY scope | (oförändrat) |
| **2.5** | NY | "Schema-kontrakt-sync — Status.ts mot data-model.md, Zod vid alla externa datagränser, **adapter-debt klassad (deployar 0 EF — se A5-klassningstabell i sessionsdok)**, ev. borttagning av död-kod-stubs". Estimat: 1 session (oförändrat). |
| 3 | NY scope | (oförändrat) |
| **3.5** | NY (villkorad) | "**Villkorad** — egen fas eller integrerad i Fas 3, triggas av P2:s checklist-bedömning enligt trigger-kriterier i sessionsdok. Estimat: **0,5–1 session (egen fas) ELLER 0 (integrerat i Fas 3)**." |
| **5** | NY scope | "**Förenklat** — minimal app-shell + tab bar + skip-to-content + route announcer + responsivt 375/768/1024 + `prefers-reduced-motion`/`prefers-contrast:more` + **error boundaries app/sektion-nivå** + **Workbox SW (cache-first/network-first/offline.html)** + **TanStack offline-config**. **View Transitions, Speculation Rules, web-vitals och widget-error-boundary flyttade till Fas 7.** **1 session** (förenklat från 1–2). ADR krävs för förenklingsbeslutet." |
| **5.5** | NY | "Vertikal write-slice: 'markera anmälan-betalning' via befintlig `update-record` EF med ny operationKey. **Inga nya EF-deploys.** Hostas i minimal Event-detaljvy med Betalning-flik. Etablerar TanStack optimistic mutation-mönster + operations-allowlist-utvidgning + 3 Playwright-tester (2 deny, 1 allow) + Fas A:s aktiveringsguides 5 steg. ADR-krav för mutation-mönstret som mall för Fas 6. **2 sessioner** (oförändrat)." |
| **6** | NY scope | "**Strangler-fig-sekvens i fem sub-faser:** **6a Persons** (0,75 sess, deployar `fetchPerson`) → **6b Events** (0,75 sess, deployar `fetchEvent` + `fetchAttendance`) → **6c Registrations + Väntelista** (1 sess, deployar `createRegistration` + `fetchWaitlist`, ADR för idempotency) → **6d Hem-aggregering** (0,5 sess, polling 60s + pull-to-refresh + visibility-trigger) → **6e Mer villkorlig** (0,5 sess, ev. `sendEmail` med direct-Resend-ADR + ev. `fetchLeads`/`fetchMailLog` om behållna). Per-sub-fas: registrera operation i `field-allowlists.ts` + deny/allow-test grönt. Realtime-subscription defer:ad till Fas E. **Total 3,5 sess oförändrat.**" |
| 6.5 | OFÖRÄNDRAD | (oförändrat) |
| **7** | NY scope | "Konsolidering — säkerhet redan i Fas A. **Ärver från B3:** View Transitions implementation, Speculation Rules, web-vitals rapportering, widget-error-boundary. **Plus existerande:** test-prefix-exkludering från prod-deploy, CSP-plugin (ADR), PostCSS-fix-bedömning (sidofix), DataTable villkorlig, 3 ADR:er från P0 (CSP-defer, conversion-plan→byggplan-skiftet, Fas 4-borttagning), vy-namn i design-audit-skriptet, chaos testing, deploy-prep. **Background Sync defer:ad till Fas 8** (separat ADR). **2,5 sessioner** (utökat från 2 pga B3-flyttar)." |
| **B** | NY | "**Parallell-spår, drift**. Fotnot: Synk-gate 1 — A1–A12 inventerade före Fas 2.5. Synk-gate 2 — handshake mot `field-allowlists.ts` per Fas 5.5/6-operation. Ägs av Lotta + Roger med Code-stöd punktvis. Inte session-räknad." |
| **E** | DEFER | "Pekar på 07 Del H. **Fas E-fönster inkluderar omskrivning av sendEmail till outbox-pattern + ev. fetchEngagements-deploy beroende på Gate 4B fråga 4-resolution.**" |
| **8** (NY rad) | FRAMTID | "**Framtid (post-Fas E).** Background Sync API (offline-mutationskö, defer:ad från Fas 7 — se ADR). Övrigt scope (Passkeys, push) ej låst i denna revision. Estimat fastställs vid aktualisering. Ersätter conversion-plans 'Fas 8 — Passkeys, push, offline'." |

**Borttagna fält i tabellen:** ingen.
**Tillagda fält i tabellen:** Fas 8 (ny — för Background Sync-defer).

---

## Del 7 — ADR-katalog för P3

ADR:er som *måste* skrivas under P3-byggplanen (eller refereras dit). Tre från P0-inventory + två från Klunga 2 + två från Klunga 3 + två från Klunga 4 = **nio totalt**.

| # | ADR-ämne | Källa | När skrivs | Refereras från |
|---|---|---|---|---|
| 1 | CSP-plugin-deferral i `vite.config.ts` | P0-inventory Fas 7 städnings-DoD | P3 | Fas 0.1 + Fas 7.3 + direktiv §8.5.6 |
| 2 | Conversion-plan → byggplan-skiftet | P0-inventory Fas 7 städnings-DoD | P3 | Direktiv §12 ("ramen 'konvertering' var efterlöpare") |
| 3 | Fas 4-borttagningen (DataTable flyttad till Fas 7) | P0-inventory Fas 7 städnings-DoD | P3 | Fas 4.1 + direktiv §12 (Numreringsnot) |
| 4 | **`createRegistration`-idempotency** | Klunga 2 (A5) | Fas 6c | Sessionsdok Del 3 |
| 5 | **`sendEmail`-direct-Resend-skuld** | Klunga 2 (A5) | Fas 6e | Sessionsdok Del 3 |
| 6 | **TanStack optimistic mutation-mönster** | Klunga 3 (A2) | Fas 5.5 | Sessionsdok Del 4, Fas 5.5 DoD punkt 8 |
| 7 | **Polling-vs-Realtime + migrations-vägen post-Fas E** | Klunga 3 (B1) | Fas 6d | Sessionsdok Del 4 |
| 8 | **Fas 5-förenklingen (vilka [GA]-tillägg flyttas till Fas 7)** | Klunga 4 (B3) | Fas 5 | Sessionsdok Del 5 |
| 9 | **Background Sync defer från Fas 7 till Fas 8** | Klunga 4 (B2) | Fas 7-start | Sessionsdok Del 5 |

**ADR-numrering:** Konkreta ADR-nummer (ADR-NNN) tilldelas av Code i P3 enligt projektets `docs/decisions/`-katalog och uppdateras i `docs/decisions/README.md`. Sessionsdoket refererar dem som `ADR (#NN)` tills numreringen är fastställd.

---

## Del 8 — Pass-status

| Klunga | Beslut | Status |
|---|---|---|
| 1 — Fristående uppvärmning | A4 (Fas B parallell) | ✅ KLAR |
| 1 — Fristående uppvärmning | A1 (Fas 3.5 scenariobeslut) | ✅ KLAR |
| 2 — Navet | A5 (adapter-debt-klassning) | ✅ KLAR |
| 3 — Sekvensen | A3 (Fas 6-sekvens, strangler-fig) | ✅ KLAR |
| 3 — Sekvensen | A2 (Fas 5.5 markera betalning) | ✅ KLAR |
| 3 — Sekvensen | B1 (Realtime: hybrid polling) | ✅ KLAR |
| 4 — Fas 7-konsolidering | B3 (Fas 5 selektiv förenkling) | ✅ KLAR |
| 4 — Fas 7-konsolidering | B2 (Background Sync defer till Fas 8) | ✅ KLAR |

**Stop-test enligt direktiv §6 P1:** Slutgiltig fas-lista för byggplanen + beslut på alla "NEW" och "modified scope"-faser i §5 + design-not per ny fas.

- ✅ Alla åtta beslut har design-not (A1, A2, A3, A4, A5, B1, B2, B3).
- ✅ §5-tabellen har konsoliderad uppdatering för alla berörda rader (Del 6).
- ✅ ADR-katalog färdig (9 ADR:er, Del 7) — Code i P3 äger numrering och implementation.
- ✅ **Stop-test PASSERAT.**

### Nästa steg

1. **Granskning av Marcus** (denna session eller nästa) — ev. justeringar appliceras till sessionsdoket.
2. **Code-uppgift i P3-fönstret:** Applicera Del 6:s konsoliderade §5-uppdatering till `tasks/byggplan-direktiv.md` §5 via `str_replace`. Commit-mall: `chore(byggplan): apply P1 §5-updates from session 2026-05-04`.
3. **P2 startar** — stödspec-synkning enligt direktiv §6 P2. Trigger-kriterier för A1 (i Del 2) gör att P2:s första leverans i `ACCESSIBILITY-CHECKLIST.md`-omskrivningen aktiverar A1-utfallet.
4. **P3 startar** — själva byggplanen skrivs, refererar denna sessionsdok för fas-strukturen och ADR-katalogen.

---

## Bilaga A — Beslutskedjan (visualisering)

Beroenden mellan beslut, verifierade i Klunga 0-strukturen:

```
                          A5  (adapter-debt-klassning)
                          │
                          ▼
   A1                    A3  (Fas 6-sekvens) ──────► B1  (Realtime)
   │                     │
   │ (svagt)             │
   ▼                     ▼
   A2  (Fas 5.5 write-flow) ◄── från A5 (vilken metod är deployad)


   A4  (Fas B parallell)         — fristående
   B3  (Fas 5 förenkling)  ──►   B2  (Background Sync) — Fas 7-scope-kedja
```

**Hårda kopplingar (5 st):**
1. A5 → A3
2. A5 → A2
3. A3 → A2
4. A3 → B1
5. B3 → B2

**Mjuk koppling (1 st):**
1. A1 → A2 (påverkar dokumentation, inte ordning)

---

## Bilaga B — Källspår per beslut

| Beslut | Primär källa | Korsverifiering |
|---|---|---|
| A4 — Fas B parallell-spår, drift | `analys/06a-airtable-redesign.md` Del A–C, `tasks/sessions/fas-4a-prompt.md` §3.4 | Direktiv §3.2, §5 fas-tabell rad B |
| A1 — Fas 3.5 scenariobeslut | Direktiv §3.5, §6 P1 fråga 1 | P0-inventory Fas 3 öppen P1-fråga, `docs/research/react-stack-research.md` (React Aria-mönster) |
| A5 — Adapter-debt-klassning | `src/data/adapters/AirtableAdapter.ts` (kodverifiering), `docs/research/vue-project-analysis.md` (status per metod) | Direktiv §3.4, §8.5.1 (M4-princip), `analys/06b-supabase-target.md` Del B+E (target-impact), `analys/01-extraction.md` §I (EF-kontrakt) |
| A3 — Fas 6 strangler-fig-sekvens | `analys/07-migration-plan.md` §A2 | Direktiv §5 ("Sekvens följer 07 strangler-fig"), P0-inventory 6.2, `docs/conversion-plan.md` §D Fas 6 + §L |
| A2 — Fas 5.5 markera betalning | Direktiv §8.5.1 (write-flow-krav), `analys/02-live-state.md` §A.7 (Synka ej mottagna slutbetalningar — bekräftar Betald-fältet) | Klunga 2-klassning (inga TODO-EF deployas före Fas 6) |
| B1 — Hybrid polling + manuell refresh | `docs/conversion-plan.md` §D Fas 6 [GA] (Realtime-tillägg), P0-inventory 6.5 (Realtime-frågan), `analys/01-extraction.md` (Airtable rate-limit) | Direktiv §5 (Fas E DEFER), `docs/specs/STATE-STRATEGY.md` (TanStack-arkitektur — refereras i P2) |
| B3 — Fas 5 selektiv förenkling | P0-inventory 5.2 (möjliga axlar), `docs/conversion-plan.md` §D Fas 5 [GA] (sex tilläggens originaldefinitioner) | `docs/logs/gap-analysis.md` Fas 5-sektion (kvalitetsbetyg + essentiellt-vs-nice-to-have-resonemang), Fas 0 BUILD-LOG (`sw.js`-skelett-leverans) |
| B2 — Background Sync defer till Fas 8 | `docs/conversion-plan.md` §D Fas 7 [GA] (Background Sync-tillägget), `docs/conversion-plan.md` §D Fas 8 (original "Passkeys, push, offline") | `analys/06b-supabase-target.md` Del B5 (`communication_outbox` + `communication_attempts` — visar varför post-Fas E-arkitektur skiljer sig) |

---

## Bilaga C — Glossar för läsare av detta dokument

| Term | Betydelse i detta dokument |
|---|---|
| **§5** | Fas-tabellen i `tasks/byggplan-direktiv.md`, sektion 5 (Föreslagen fasstruktur) |
| **§8.5.1** | M4 discovery-fyndet i `tasks/byggplan-direktiv.md`, sektion 8.5.1 (krav på vertikal slice som write-flow) |
| **`update-record` EF** | Befintlig deployad Edge Function som tar `{operationKey, recordId, fields}` (M4-pattern) |
| **operations-allowlist** | `supabase/functions/_shared/field-allowlists.ts` — sanningskälla för "vad får skrivas av vem" |
| **strangler-fig** | Migrations-pattern där gammal modell (Airtable) ersätts domän-för-domän, inte big bang |
| **Fas A** | Säkerhetshardening-fasen, M1–M8, slutförd 2026-05-04 |
| **Fas B** | Airtable hardening (A1–A12), drift-spår |
| **Fas E** | Supabase migration, DEFER (pekar på `analys/07-migration-plan.md` Del H) |
| **F.4-buggen** | Dubblettrisken i `data-model.md` §F.4 — väntelista-konvertering kan skapa både Anmälan-rad och kvarvarande Väntelista-rad om steg 3 (PATCH `Flyttad till anmälan`) misslyckas efter steg 2 (skapa anmälan) |
| **DoD** | Definition of Done |
| **ADR** | Architecture Decision Record (i `docs/decisions/`) |
