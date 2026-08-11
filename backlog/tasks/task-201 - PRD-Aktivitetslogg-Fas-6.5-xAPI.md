---
id: TASK-201
title: 'PRD: Aktivitetslogg (Fas 6.5, xAPI)'
status: To Do
assignee: []
created_date: '2026-08-11 20:08'
labels: []
dependencies: []
ordinal: 365000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lottas största rädsla är att tappa bort information — i dag lever "vad har jag gjort?" i hennes minne, på papper och i lösa anteckningar. Appen utför nu hennes åtgärder (markera betalning, bekräfta anmälan, skicka mail, kvitton …) men lämnar inga spår hon kan gå tillbaka till. När appen tar över uppgifterna måste den bevisa att den minns bättre än papperet — annars vågar hon aldrig släppa det. Framtidsmotivet (adaptiv lärning i Passionslyftet) kräver dessutom att spåren föds i standardformat, inte i ett eget påhittat.

### Lösning

Varje åtgärd som förändrar data skriver automatiskt en loggpost — Lotta gör ingenting själv. Posterna är xAPI-statements med aktör, händelse och objekt, visade i naturligt språk på Lottas språk: "Lotta markerade betalning — Anna Andersson (Fjärrskådning 2)". Hon möter historiken på två ställen: hem-vyns "Senaste aktivitet"-spalt (desktop, K10-facit-formen) och den fulla aktivitetshistoriken med filterrad (kategori/event/tidsperiod); på mobil/platta nås historiken via Mer. Loggen lagras i Supabase (`activity_log`), utanför Airtable-basen.

### Användarberättelser

1. Som Lotta vill jag att allt jag gör som ändrar något loggas automatiskt, så att jag aldrig behöver anteckna själv vad jag gjort.
2. Som Lotta vill jag se de senaste händelserna direkt på hem-vyn, så att jag ser att appen minns utan att leta.
3. Som Lotta vill jag öppna hela aktivitetshistoriken via "Se all aktivitetshistorik", så att jag kan gå tillbaka hur långt jag vill.
4. Som Lotta vill jag läsa posterna i naturligt språk med namn på person och event, så att jag förstår utan teknisk översättning.
5. Som Lotta vill jag se när något hände (relativ tid nyss, klockslag/datum längre bak), så att jag kan svara på "vad gjorde jag i går?".
6. Som Lotta vill jag se vem som gjorde något (jag, Roger eller Marcus), så att vi kan arbeta parallellt utan förvirring.
7. Som Lotta vill jag filtrera historiken på kategori, event och tidsperiod, så att jag hittar en specifik händelse med max ett klick.
8. Som Lotta vill jag klicka på en post och komma till personen eller eventet det gällde, så att jag kan agera direkt på det jag hittar.
9. Som Lotta vill jag att betalningar, bekräftelser, anmälningar, boende, mail, kvitton, event-ändringar, flaggor och anteckningar alla syns i loggen, så att det inte finns luckor som får mig att tvivla på att appen minns.
10. Som Lotta vill jag att en antecknings-post visar att jag antecknade — inte innehållet, så att känsligt innehåll aldrig exponeras i historiken.
11. Som Lotta vill jag ett vänligt tomläge första gången historiken är tom, så att en tom lista inte ser trasig ut.
12. Som Roger vill jag se samma historik som Lotta, så att jag kan följa verksamheten utan att fråga.
13. Som Marcus vill jag att varje loggpost bär requestId, så att jag kan korrelera en post mot serverloggarna vid felsökning.
14. Som Marcus vill jag att loggen lagras utanför Airtable-basen, så att den växande volymen aldrig hotar basens radtak eller rate-budget.
15. Som Passionslyftet (framtida konsument) vill jag att posterna är strikta xAPI-statements, så att adaptiv lärning och Open Badges kan byggas utan ombyggnad.

### Implementationsbeslut

- **Facit-manifest:** `tasks/sessions/bilagor/s55-hem-konvergens/facit.json` (retroaktivt mintat S105 ur S55 Del 12-låsningen). Ytor: (1) **hem-vyn i helhet** — BYGGD, ingår inte i denna arbetsenhet; (2) **hem-historikspalten "Senaste aktivitet"** — OBYGGD, denna arbetsenhets facit-yta (bild: k10-facit-desktop; spalten visas inte på mobil). AC för spalten PEKAR på facit (ADR-102 B5), aldrig problembeskrivningar.
- **Spaltens synlighet:** endast ≥xl; mobil/platta når historiken ENDAST via Mer (S55 byggkrav B7). Brytpunktsgapet lg↔xl är odefinierat i S55-prosan — avgörs mot facit-bilderna/Marcus i skivan, bokfört öppet i manifestet. INGA ikoner i spalten (facit vinner över FEATURE-dokens ikonidé, ADR-102 B1).
- **Lagring:** Supabase-tabell `activity_log` i BÅDA miljöerna (staging + prod), RLS aktiv, write endast via service-role i EF. ALDRIG Airtable (S105 Del 2 beslut 3). Lagringsvals-ADR mintas som egen skiva (nummer re-deriveras vid mint).
- **Statement-form:** strikt xAPI-konform (actor/verb/object/context/timestamp; IRI-nycklade verb och extensions), Zod-validerad runtime. Svenska sammanfattningar på Lotta-språket (Gunilla-principen); IRI-verb under huven. Aktörsnamn ur inloggad användare.
- **Korrelation:** requestId (Fas A M7-arvet) är ENDA korrelations-ID:t, buret i context.extensions. INGET trace_id — bonus-ADR med tvådelad omprövningstrigger (OTel/W3C Trace Context införs · en användaråtgärd börjar orkestrera flera EF-anrop från klienten) mintas som egen skiva.
- **Skrivväg:** onSuccess-instrumentering per BEFINTLIG mutation — samtliga (~11: betalningar, bekräftelse, skapa anmälan, boende, mail-åtgärderna, kvitto, uppdatera event, person-flagga, event-/person-anteckningar). Anteckningar loggar ATT — aldrig innehåll. "Lade till person" ingår i skapa-anmälan tills person-skapande får egen mutation.
- **Läsväg:** ny `get-activity-log`-EF under EF-ribban (SECURITY-SPEC §6.10).
- **Vy-form:** full historikvy MED filterrad är målet (B), skivad kärnvy (tidsgrupperad lista) → filterrad (additiv skiva); samma postkomponent bär spalt och vy. Filterraden återbrukar befintliga primitiver (Select, ToggleButtonGroup).
- **Byggplans-amendering ÖPPET i denna arbetsenhet:** § Fas 6.5-lagringsraden + AT-Max-blockets premiss ("Activity Log-write = sista Airtable-interaktionen" utgår med Supabase-valet).

### Testbeslut

Testa externt beteende, aldrig implementationsdetaljer. **api-skarven** (test:api): Zod-schemats form (förebild: attendance-schema-testet), EF-kontrakten för write och läsning (förebild: confirm-registrations-testet), staging-pin i befintlig staging-testform. **e2e-skarven** (staging-testkonventionen): en åtgärd utförs → posten syns i spalten och historikvyn med rätt aktör, språk och tid. A11y per vyribban 11 inom varje skiva (spaltens aria-label-namn, scrollregion, filterradens kontroller). Inga nya skarvar.

### Utanför omfattningen

- Adaptiv lärning-engine, LiveKit/Cal.com, Open Badges-KOD — Passionslyftet (xAPI-konformansen ÄR hela förberedelsen; S105 Del 2 beslut 5).
- Real-time activity-stream — Fas E.
- Person-skapande som egen loggtyp (väntar på egen mutation).
- Airtable-lagring (beslutat bort, S105 Del 2 beslut 3).
- Retroaktiv backfill — loggen börjar vid driftsättning; händelser före födelsen har ingen källa.
- Hem-vyns övriga sektioner (byggda; manifestets yta 1).

### Estimat

7 skivor + QA-kort, dag 1-först-ordning (infrastruktur → instrumentering → spalten → kärnvy → filterrad). Arbetsenhet ~1 session (byggplanens estimat).

### ADR-koppling

Styrande: ADR-063 (medveten bokförd avvikelse för systemdata — byggplans-amenderingen ingår) · ADR-102/ADR-103 (facit-styrning + AC-form för spalten) · ADR-100 (sanningshierarkin) · ADR-109 (kvitto-EF:n som skrivvägs-förebild) · ADR-086 (källmärkning i skiv-uppdragen). Två nya ADR:er mintas som skivor och refereras därifrån, aldrig inline: lagringsvalet (Supabase) och korrelationsbeslutet (requestId, tvådelad trigger).

### Ytterligare anteckningar

Dag 1-deadlinen till Lotta styr skivordningen: A-formen (kärnvy utan filterrad) är en hel mellanstation om klockan tar slut — inget rivs i något utfall (S105 Del 2 beslut 1). FEATURE-ACTIVITY-LOG-doken uppdateras efter ADR-mintningen (byggplanens korsreferens). Grillad samsyn: sessionsdok S105 Del 2 (fem kvitterade beslut). ORDLISTA: Aktivitetslogg och Aktivitetshistorik kanoniserade S105 — använd dem, inte "audit log"/"händelselogg"/"aktivitetsström".
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Byggplanen amenderad öppet i denna arbetsenhet: § Fas 6.5-lagringsraden + AT-Max-premissen (Supabase-beslutet)
- [ ] #6 Hem-spalten identisk mot facit-manifestets k10-bild (ADR-102 B5) — Marcus-granskad
- [ ] #7 Zod-schemat validerar varje statement runtime — ogiltigt statement når aldrig activity_log
- [ ] #8 requestId propageras klient → EF → activity_log-rad, läsbar i devtools (byggplanens DoD 3–4)
<!-- DOD:END -->
