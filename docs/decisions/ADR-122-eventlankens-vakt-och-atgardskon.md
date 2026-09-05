# ADR-122: Eventlänkens vakt — A1 verifierar mot facit, och avvikelsen blir en åtgärdskö

- **Status:** Accepted (Marcus GO 2026-08-21, *"Anser du att du har koll på
  läget så kvitterar jag helheten!"*, efter en grillning i fem frågor där han
  begärde Code:s eget ställningstagande på hemvist-frågan)
- **Datum:** 2026-08-21
- **Fas:** Fas 6 (go-live-förberedelse)
- **Rör:** Airtable-automation `A1` (`wflDCKPAv2P6Yu9U6`) ·
  `Anmälningar` (`tbloOcrppVoyrHbrq`) — nytt lookup- och formelfält ·
  `supabase/functions/_shared/field-allowlists.ts` ·
  `src/components/registrations/` · `docs/specs/DESIGN-SYSTEM-SPEC.md` § 22
- **Relation till tidigare beslut:** supersederar INGET.
  [`ADR-063`](ADR-063-airtable-bas-som-forstklassig-leverabel.md) är den
  bärande premissen — resolution sker I BASEN, inte som kompensation ovanpå.
  [`ADR-121`](ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md) och dess
  `§ 21 Notistrappa` står **orörda**; detta beslut lägger en klass **vid sidan
  av** trappan och motiverar nedan varför den inte hör hemma i den.

## Kontext

Anmälan ID 989 (Fredrik Björk, `recGoVBQBI1bo66jG`, 2026-08-20) landade utan
Event-länk tre dagar efter att S107 sanerat samma felklass. Utredningen (S110
Del 1–2) lokaliserade roten och mätte omfattningen över hela basen.

**Roten ligger utanför vårt system.** Anmälningsknapparna på miranon.se ligger
i en Elfsight Event Calendar-widget (`8d8c059d-05b7-4f64-8468-ab24d7c9cc57`).
Varje kalenderposts länk är **handskriven**; när en gammal post dupliceras
följer URL-parametrarna med oredigerade medan den synliga texten redigeras.
Basen har hela tiden burit den kanoniska länken i
`Eventplanering.AnmälningsURL (kopiera denna)` — den har bara inte använts.

**Felklassen är dubbel, och den farliga halvan är tyst.**

| Form | Vad A1 gör | Synlighet |
|---|---|---|
| `EventKey="10"` (utan prefix) | 0 träffar → ingen länk | **Syns** — appen visar `'Utan event'` |
| `EventKey="Event-10"` (fel nummer) | träff på **fel** event | **Osynlig** — inget led jämför |

Mätt över 304 Huvudformulär-anmälningar 2026-08-21: **1 orphan + 64
felmatchade**, varav 52 legat obekförda sedan maj under ett *genomfört*
mars-event. April-saneringen 2026-04-26 var själv fel — den läste `"11"` som
Event-11 i stället för Event-60.

### Tre fynd som formade beslutet

1. **Facit och påstående ligger redan sida vid sida.** `Anmälningar` bär både
   formulärets textkopior (`Datum` `fldsROcE2FFTGCL3W`, `Ort`
   `fldP1LSzbyOJxrOGP`, `Typ` `fldGyYPbxkgS3BqVb`, `Vill anmäla sig till`
   `fld6RC3r0R9tuKgdF` — och `Event (namn)` `fldK1aYEm3iCg8OOh`, som är en
   **formel** `{fld6RC3r0R9tuKgdF}` som ekar `Vill anmäla sig till`, inte ett
   uppslag) och lookup-fält från det länkade eventet (`Ort (from Event)`
   `fld5560T3pQZSUBaJ`, `Kurs (from Event)` `fldfqU6MfBQdaeLUk`).
   Korsfältsvalidering kräver alltså **ett** nytt lookup-fält, inte en ny
   mekanism. *(Rättat 2026-08-22, `T161` — se § Updates: den ursprungliga
   meningen listade `Event (namn)` på facit-sidan och påstod
   `describe_table`-verifiering; fält-ID:na ovan är prod-basens, staging bär
   andra ID:n för de två uppslagen — se `data-model.md`.)*
2. **Jämförelsen är en ren strängjämförelse.** `Eventplanering.Datum (visas i
   länk)` bär exakt den sträng formuläret pre-fillas med
   (`"12–13 september 2026"`) — inget datumfält, ingen parsning. De 18 rader
   som låg felmatchade under Event-10 bar `Datum: "12–13 september 2026"` mot
   Event-10:s facit `"7–8 mars 2026"` (live-stickprov, 4 rader, 2026-08-21).
3. **Appen kan inte omlänka en anmälan.** `OPERATIONS`-registret i
   `field-allowlists.ts` har 20 operationer mot `Anmälningar`; ingen sätter
   `Event`. Endast `create-registration` sätter länken, och bara vid skapande.

### Branschmönstret

Att samla poster som kräver mänsklig hantering i en dedikerad, räknad kö —
**exception queue** / review queue — är likformigt hos Stripe (Radar review
queue), Shopify (Order risk + flaggad order), UiPath Orchestrator, Oracle och
Pega. Mönstret har tre delar som samverkar: kön, markören på posten, och en
**resolution-väg** som gör att posten lämnar kön genom en handling. Den
bärande regeln ur operations-litteraturen är att dashboarden ska bära *direct
links to the work item so the user can resolve the issue without hunting
through another system*.

NN/g avvisar uttryckligen notis-formen för detta: en notis som skickas
oberoende av vad användaren gör *"would likely be ignored, and may even annoy
users"*; för information knuten till ett objekt föreskrivs i stället
**indicators** — *"associated with a UI element or with a piece of content"*,
visade *"in close proximity to that element."*

## Beslut

### 1. Rotfixen görs, men vakten byggs oavsett

Kalenderposternas länkar på miranon.se byts mot `AnmälningsURL` ur basen
(Marcus/Roger). Det eliminerar felklassen vid källan — men det är en **rutin**,
inte en grind, och rutinen har brustit tre gånger (2026-04-26, 2026-08-17,
2026-08-21). Vakten byggs som grinden under rutinen, inte som ersättning för
den.

### 2. A1 vägrar länka vid avvikelse — aldrig länka-och-flagga

A1 får ett skript-steg som normaliserar `"10"` → `"Event-10"`, jämför
formulärets textkopior mot det tilltänkta eventets facit, och **lämnar `Event`
tomt** när de inte går ihop. Raden blir därmed en orphan — vilket appen redan
visar som `'Utan event'` (`hem-derivations.ts:93`,
`AnmalningarSida.tsx`, f.d. `AnmalningarList.tsx`). *(Rättat 2026-08-26,
`TASK-309.18` — se § Updates: filen döptes om i `TASK-299.5`.)*

**Skälet är att den formen är fail-closed by construction.**
[`airtable-constraints.md`](../reference/airtable-constraints.md) `P16`
klassar automations-status som ⚠️ TYST KORRUPTION: A1–A11 rapporterar *"Ran
successfully"* även när ett action-steg tyst uteblev, och föreskriver att
sidoeffekter verifieras **direkt på recordet**, aldrig via run-status. En vakt
vars enda spår är en Error-log-rad är sårbar för exakt det. Denna vakt har
motsatt egenskap: kör skriptet inte, eller kraschar det halvvägs, blir `Event`
tomt — samma utfall som en medveten fällning. Det finns inget fel-läge där en
felmatchad rad slinker igenom för att vakten inte kördes.

Följdskadan uteblir också: A3 (`wfl4qb2eP28SfKlck`) kräver
`Event isNotEmpty`, så inga Deltaganden skapas på fel event, ingen felaktig
beläggning, inga felaktiga A7-restlistor. Det var huvuddelen av S110:s
städjobb — 61 omlänkningar och ~130 Deltaganden.

### 3. Avvikelsen bärs av ett FORMELFÄLT, inte av en automation-satt flagga

Ett nytt lookup-fält (`Eventplanering.Datum (visas i länk)`) plus ett
formelfält `Eventmatchning` på `Anmälningar` med värdena `OK` / `Avviker` /
`Utan event`.

Ett formelfält kan inte tyst utebli (`P16`) och kan inte bli osynkat efter en
manuell ändring i basen. Det gör S110:s engångssvep **permanent**: i stället
för att någon kör ett kontrollsvep per kvartal *är* fältet svepet. Det bär
också den klass A1 aldrig ser — rader som redan är länkade men inte stämmer.

`P14` (formelfält kan vara tomma ~30 s efter automation-create) är utan
betydelse här: fältet läses av appen, inte av ett automationssteg i realtid.

### 4. Tomt är "kan inte avgöras" — aldrig "avviker"

Valideringen är trestegs. `data-model.md` noterar om `Ort (from Event)` att
*"Anmälans EGNA `Ort` duger inte — backfill-anmälningar har den tom."* En
regel som fäller på tomt fält skulle döma varje backfill-rad.

### 5. Scopet är `Från formulär = Huvudformulär`

Expressformuläret bär ingen `EventKey` — A1 matchar det via `Expresslabel`
(`fldCPCcfF87fEkUdy`) i sin gren 3. Vakten som fälls på hela flödet skulle
stoppa expressanmälningar som aldrig burit felet.

### 6. Vaktens hemvist är A1 — och dess kod checkas in i repot

A1 är en no-code-automation utan versionshantering, CI eller testtäckning, och
ändras av vem som helst med bas-access. Det är ett verkligt pris. Det betalas
ändå, av tre skäl: A1 kör där felet uppstår och kan inte kringgås; A3 är redan
ett skript-steg i samma kedja, så formen är etablerad; och `ADR-063` lägger
resolution i basen. **En EF-hemvist eliminerar inte A1** — Airtable kan inte
anropa en Edge Function vid record-create utan att en automation gör det, så
EF-vägen lägger till ett led i stället för att ersätta ett.

Motmedlet mot priset: **skriptets kod checkas in i repot som källa**, även om
Airtable kör sin egen kopia. Samma avvikelseform som
[`schema_reference.md`](../reference/schema_reference.md) redan bär för A1–A11.

### 7. Appen får en åtgärdskö — kö, markör och resolution

Alla tre delarna, inte en delmängd. Resolution kräver en ny operation
`relink-registration` i `field-allowlists.ts` som sätter `Event` **och**
`EventKey` i samma skrivning — fälla 9:s idempotenskrav (*"A1 matchar varje
gång ... sätt EventKey OCH Event direkt"*), samma form som
`create-registration` redan använder.

Att bygga kön utan resolution förkastades uttryckligen: det gör Airtable till
en yta Lotta måste kunna, vilket är motsatsen till appens syfte, och strider
mot branschmönstrets egen bärande regel (se § Kontext).

**Formen på hem-vyn finns redan och ska återanvändas, inte uppfinnas.**
`Bevakningsrad` (`src/components/hem/Bevakningsrad.tsx`, ORDLISTA-term,
promoverad ur hem-konvergensen S102 Del 10 beslut 2–4) bär exakt den semantik
åtgärdskön behöver: **helt osynlig vid noll träffar** (asymmetrin mot block är
Marcus-låst), klickbar uppgiftsrad vid träff, och klicket öppnar en
förifiltrerad åtgärdsyta — `TASK-241.8` wirade den mot `SvepOverlay` med
`svepTyp='eventinfo'`, förfiltrerad på exakt de rader som saknar stämpeln för
det klickade eventet.

Åtgärdskön på Hem är alltså **en ny bevakningsrad-typ**, inte en ny form.
Vad som byggs är dess datakälla (beslut 3:s formelfält), dess egen
resolution-overlay (analog med `SvepOverlay`) och radmarkören i
`AnmalningarSida` (f.d. `AnmalningarList`). *(Rättat 2026-08-26,
`TASK-309.18` — se § Updates: filen döptes om i `TASK-299.5`.)* Detta
upptäcktes vid ordlistearbetet efter Marcus kvittens av helheten och bokförs
här i stället för att glida in tyst — det gör beslutet billigare, inte
annorlunda.

### 8. Åtgärdskön är en klass VID SIDAN av notistrappan, inte i den

`§ 21`s åtta klasser är alla **händelsebundna** — något hände nyss. En anmälan
utan event är **tillståndsbunden**: den ligger kvar tills någon åtgärdar den.
Skillnaden är inte en brist i trappan; den är en familjegräns, och den skrivs
ut i `DESIGN-SYSTEM-SPEC.md` § 22 så att nästa läsare inte försöker pressa in
arbetsobjekt i notisfamiljen.

## Öppet, och medvetet inte beslutat här

- **Driftdetektorn mot Elfsight-widgeten** är lyft till `T159`. Efter rotfix
  och A1-vakt är dess marginalvinst **en enda anmälan** — den fångar felet
  innan någon anmält sig, medan vakten fångar det vid första anmälan. Priset
  är ett research-pass mot en oofficiell endpoint
  (`core.service.elfsight.com`) med okänd stabilitet och okända villkor, plus
  löpande drift. Beslutas när rotfixens hållfasthet är observerad, inte innan.
- **Skivningen** avgörs i `/to-issues`. En skiva som bara ger synlighet är
  horisontell; den vertikala formen är sannolikt *en yta hela vägen* (markör →
  eventväljare → relink) före kön som egen ingång med räknare.
- **Om Lotta faktiskt använder kön** är obelagt — samma osäkerhet `ADR-121`
  bokförde för hörn-notisen. Observeras, antas inte.
- **Valideringens tröskel** mot de två kända falska positiva (Event-18,
  Event-59, klassade av S110 som ren textformatering) är inte fastställd
  rad-för-rad. De är facit för tröskeln och inspekteras vid spec.

## Alternativ som förkastades

**Alternativ 1 — länka ändå, flagga avvikelsen.** Ingen kund blockeras, ingen
falsk-positiv-risk stoppar flödet. **Förkastat:** det bevarar tystnaden, som
är hela felklassen — S110:s eget lesson-fragment lyder *"tyst felmatchning >
synlig orphan"*. Och det är sårbart för `P16`: flaggan kan tyst utebli medan
körningen ser grön ut. A3 skulle dessutom fortsätta skapa Deltaganden på fel
event vid varje instans.

**Alternativ 2 — auto-korrigera mot texten.** Länka till det event vars facit
matchar formulärtexten. **Förkastat:** det gissar. De 11 tvetydiga raderna på
Event-55 (3 okt eller 24 okt) visar att texten inte alltid pekar entydigt, och
en automation som skriver om användarens data utan spår är svår att felsöka i
efterhand — vilket April-saneringens egen felaktighet illustrerar.

**Alternativ 3 — vakten som Edge Function.** Versionshanterad, testtäckt,
inom repots grindar. **Förkastat:** den eliminerar inte A1 (se beslut 6),
lägger till ett led med egen felmängd, och flyttar resolution ut ur basen mot
`ADR-063`.

**Alternativ 4 — notiscenter i appen.** **Förkastat** på NN/g:s explicita
grund (se § Kontext) och på strukturell grund (beslut 8): en tillståndsbunden
avvikelse är inte en notis.

**Alternativ 5 — bara synlighet, resolution senare.** **Förkastat** av Marcus
i grillningen, verbatim: *"Vi tar aldrig genvägar, vi bygger alltid
ORDENTLIGT!"* Se beslut 7.

## Konsekvenser

- **Positivt:** felklassens skadebild går från 64 tysta rader upptäckta fyra
  månader senare till **1 rad, synlig vid första anmälan**. Kontrollsvepet
  blir permanent i stället för periodiskt. Lotta får en väg att lösa felet
  där hon ser det.
- **Kostnad:** ett skript-steg i A1 utanför repots grindar (mildrat av att
  koden checkas in), två nya fält i basen, en ny EF-operation, och en app-yta
  med kö och markör.
- **Risk:** en blockerad anmälan är en kund som inte kommer in i systemet
  förrän någon agerar. Falsk-positiv-raten mättes till 2 av 304 på
  *handskriven* text; efter rotfixen kommer texten ur `AnmälningsURL`-formeln,
  som byggs av samma fält valideringen jämför mot — matchningen blir då
  definitionsmässigt exakt. Risken är alltså högst innan rotfixen är
  genomförd, vilket är motsatt den ordning man intuitivt antar.

## Updates

### 2026-08-22 — § Fynd 1 rättat: `Event (namn)` är en formel, inte ett uppslag (`T161`)

Beslut 1–8 står orörda. Detta är en rättelse av ett **stödjande
faktapåstående** i § Kontext, kvitterad av Marcus (*"Ta T161 då"*, S110
Del 13) och gjord öppet — den gamla formuleringen är utbytt i § Fynd 1 med
en synlig markering, inte tyst.

**Vad som var fel.** Fynd 1 listade `Event (namn)` (`fldK1aYEm3iCg8OOh`)
bland *"lookup-fält från det länkade eventet"* och avslutade meningen med
*"live-verifierat via `describe_table` 2026-08-21"*. Basen säger något annat
(prod och staging, `describe_table` 2026-08-21 och 2026-08-22):

```json
{"name":"Event (namn)","type":"formula",
 "options":{"formula":"{fld6RC3r0R9tuKgdF}","referencedFieldIds":["fld6RC3r0R9tuKgdF"]},
 "id":"fldK1aYEm3iCg8OOh"}
```

`fld6RC3r0R9tuKgdF` är `Vill anmäla sig till` — anmälans **egen** text, som
samma mening listade på påstående-sidan. Fältet står alltså på båda sidor av
vaktens jämförelse: hade kursnamns-axeln jämförts mot det vore jämförelsen
en tautologi — alltid lika, aldrig en fällning, utan felmeddelande.

**Varför beslutet inte faller.** `TASK-284.1` byggdes mot mätta fält, inte
mot ADR-texten: kursnamns-axelns facit är `Kurs (from Event)`
(`fldfqU6MfBQdaeLUk`, prod; `fldcTDSzGBG0bHjl3`, staging), ett äkta uppslag
av `Eventplanering.Event (text)`. A1-skriptet läser likaså
`Eventplanering."Event (text)"` per namn. Vakten är därför korrekt i båda
ytorna — bevisat i staging (`284.2`, sex fall) och i prod (`284.6`, skarpt
prov 2026-08-22 där just kurs-axeln fällde: *"Fjärrskådning" vs "Resor i
medvetandet 1"*). Det är ADR-prosan som var fel, inte bygget.

**Det som är värt att minnas är inte fältet.** Felet stod i en ADR som
**påstod live-verifiering** i samma mening — och det var den egenskapen som
gjorde att ingen läste om. `ADR-086` säger att mottagaren prövar premisserna;
bygg-agenten gjorde det och avvek tyst från ADR:n i rätt riktning. Tråden
(`T161`) registrerades för att avvikelsen skulle bli synlig i stället för
att ADR:n fortsatte säga fel till nästa läsare. Sanningshierarkin
(`ADR-100` §1) gäller: för fält-data vinner `data-model.md`, som redan bar
fältets verkliga form sedan `284.1`:s commit.

**Bifynd bokfört samtidigt:** fält-ID:na i Fynd 1 är prod-basens. Staging
bär `Ort (from Event)` och `Kurs (from Event)` under andra ID:n — divergensen
är utskriven i `data-model.md` § Fält tillagda 2026-08-21 och i
A1-skriptets huvud, och var orsaken till att `284.6` mappade om tre ID:n
när formeln skapades i prod.

### 2026-08-26 — § 7/§ 2 rättade: `AnmalningarList` → `AnmalningarSida` (`TASK-309.18`)

Beslut 1–8 står orörda. Detta är en rättelse av två **stödjande
faktapåståenden** (§ 2 rad ~100, § 7 rad ~181) som refererade
`AnmalningarList.tsx` i presens, upptäckt av svep-passet efter S108:s
rivningar (`TASK-309.18`, angränsande fynd).

**Vad som var fel.** Filen döptes om till `AnmalningarSida.tsx` i
`TASK-299.5` (konvergenspassets promovering till skarp yta) — `git ls-files`
bekräftar att `AnmalningarList.tsx` inte längre existerar i repot. Varje
annan levande kodplats som nämner det gamla namnet gör det konsekvent med
en "f.d."/"riven/döpt om, `TASK-299.5`"-not (`Bevakningsrad.tsx`,
`hem-derivations.ts`, `AnmalningarSida.tsx` självt, `KopplaTillEventDialog.tsx`,
`registration-display.ts`, `registrationEventLink.ts`, `startvarmningen.ts`,
`Registration.ts`, `mer/anmalningar.tsx`) — ADR-122 var den enda kvarvarande
platsen utan den annoteringen.

**Åtgärd.** Bägge raderna pekar nu på `AnmalningarSida.tsx` (f.d.
`AnmalningarList.tsx`), med samma inline-markörkonvention som § Fynd 1 ovan.
Radnumren i den ursprungliga texten (100/181) stämde mot filnamnet, inte mot
en rad i den nya filen — ingen ny radreferens gissas här, eftersom filen
skrevs om vid promoveringen och en gammal rad-till-rad-mappning inte kan
antas hålla.

### 2026-09-05 — `KopplaTillEventDialog.tsx` riven som död kod (`TASK-400`)

Beslut 1–8 står orörda. Fillistan i § 2026-08-26-noten ovan är en historisk
ögonblicksbild av läget den dagen och rörs inte — den nämnde
`KopplaTillEventDialog.tsx` som en levande kodplats med en "f.d."-not om
`AnmalningarList`. Denna not gäller filens ÖDE, inte den listan.

**Vad som hände.** `KopplaTillEventDialog.tsx` (`AnmalningRadResolution.tsx`s
syskon, § "HISTORIK: TVÅ RESOLUTIONS-KOMPONENTER I SAMMA KATALOG" i
`AnmalningRadResolution.tsx`s eget docblock) importerades ingenstans —
`AnmalningRadResolution.tsx` hade redan tagit över rollen som radens
resolution-trigger (helradsteknik, `TASK-299.5` AC #4), och dialogen med
egen `"Koppla till event"`-etikett-knapp stod kvar utan anropsplats. Fyndet
gjordes i `TASK-394`:s forensik (S120 Del 2, 2026-09-04) och rivningen
genomfördes separat i `TASK-400` (2026-09-05) för att hålla eventväljar-PR:en
i sitt eget scope. Kommentarerna som pekade på filen (`AnmalningRadResolution.tsx`,
`Registration.ts`, `tests/support/fixturvarld/fixture-data.ts`) skrevs om i
samma landning.

**Beslutet berörs inte.** Vaktens mekanik (A1, formelfältet, åtgärdskön) är
oförändrad — det som försvann var en overksam UI-genväg till samma
mutation (`useRelinkRegistration`), inte vakten själv.
