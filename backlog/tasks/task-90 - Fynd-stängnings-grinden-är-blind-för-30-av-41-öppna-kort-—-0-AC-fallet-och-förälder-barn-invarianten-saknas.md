---
id: TASK-90
title: >-
  Fynd: stängnings-grinden är blind för 30 av 41 öppna kort — 0-AC-fallet och
  förälder/barn-invarianten saknas
status: To Do
assignee: []
created_date: '2026-07-29 17:36'
updated_date: '2026-07-30 20:00'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`scripts/check-backlog-closure.sh` invariant 1 kräver `ac_totalt > 0`. Ett kort UTAN egna acceptanskriterier hoppas därför över helt.

**MÄTT 2026-07-29: 30 av 41 öppna kort har noll AC.** Grinden utvärderar alltså elva. Utskriften säger *"160 kort prövade, 1 inkonsistent"*, vilket läses som full täckning. Det är den inte.

**Beviset att fläcken kostar:** fyra föräldrakort hittades med samtliga skivor Done men själva `To Do` — `TASK-17` (6/6), `TASK-19` (4/4), `TASK-54` (3/3), `TASK-59` (8/8). Grinden var tyst om alla fyra. Två av dem (`54`, `59`) är dokumenterat avsiktliga; `17` och `19` var det inte, och stängdes på Marcus besked samma dag.

**Två invarianter saknas:**

1. **0-AC-fallet.** Ett öppet kort utan AC kan aldrig fällas. Vad som ska gälla i stället är en designfråga skivan ska svara på — DoD-bockarna är en kandidat, men de bockas först vid stängning, så formen måste tänkas igenom.
2. **Förälder/barn.** Ett föräldrakort vars samtliga barn är Done men som själv är öppet är internt inkonsistent, på samma sätt som ett kort med alla AC bockade och status To Do. Grinden ser inte relationen alls.

**Krav på formen:** samma tvåsidiga testdisciplin som originalet — `scripts/test-check-backlog-closure.sh` har tio testfall i PAR (ett som ska fälla, ett som inte ska). Nya invarianter ska bära samma.

**Falskt rött är dyrare än tyst grönt här.** Grinden ska köras i natten, inte i PR-grinden, och ett falskt larm devalverar nästa. Kort som är avsiktligt öppna (som `TASK-54`/`59`) måste kunna deklarera det.

Källa: sessionsdok S91 Del 27 § 27.2 punkt 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 0-AC-fallet: öppna kort utan AC utvärderas — formen VALD och motiverad, inte antagen; alternativ som förkastas bär sina skäl
- [x] #2 Förälder/barn-invarianten: ett föräldrakort vars alla barn är Done men som själv är öppet fälls
- [x] #3 Avsiktligt öppna kort kan deklarera det och fälls INTE — TASK-54 och TASK-59 är testfallen
- [x] #4 Tvåsidiga testfall i PAR för varje ny invariant, i scripts/test-check-backlog-closure.sh — samma disciplin som de tio befintliga
- [x] #5 Skarp körning före och efter redovisad med siffror: hur många kort utvärderas nu mot 11 av 41
- [x] #6 Fail-closed bevarat: noll kort ur CLI:t ⇒ exit 2, saknad policy ⇒ exit 2
- [x] #7 shellcheck rent på ändrade skript
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FORM VALD FÖR 0-AC-FALLET (AC #1): fäll på bevis, REDOVISA frånvaron av bevis.

0-AC-fallet är inte ett fall utan två, och de skiljs av vilket bevis kortet faktiskt bär:
- 0 AC MED barn (6 av 30 vid b8ca291) — barnens status ÄR beviset. Ny invariant 3.
- 0 AC UTAN barn (24 av 30) — kortet bär inget maskinläsbart färdig-bevis. Här fäller
  grinden INTE; den redovisar siffran öppet i ett täcknings-block. Det svarar mot fyndets
  egentliga defekt: utskriften "N kort prövade, 0 inkonsistenta" lästes som full täckning.

FÖRKASTADE ALTERNATIV (med skäl, samtliga mätta vid b8ca291):
1. DoD-bockarna som fällande signal. NOLL av 46 öppna kort bär en icke-tom, fullt bockad
   DoD. De nio kort där dod_obockat==0 (TASK-20..28) har noll DoD-rader ÖVERHUVUDTAGET —
   en naiv form hade gett nio falska röda direkt. Korrekt kodad utvärderar den 15 kort och
   fäller på noll, eftersom stängningsflödet (ADR-073 beslut 5) bockar DoD och sätter Done
   i SAMMA CLI-anrop. Att räkna de 15 som "täckta" hade blåst upp täckningssiffran — exakt
   den defekt kortet finns för att laga.
2. "Varje öppet kort utan AC fälls". Hade fällt på 30 kort. Massivt falskt rött, och det är
   en kort-HYGIEN-invariant, inte en STÄNGNINGS-invariant.
3. Härled barn ur ID-mönstret TASK-N.M. Numreringen är gles (17.6 och 18.14 finns inte);
   CLI:ts Subtasks-block är den auktoritativa relationen.
4. Kort-ID-lista i policy-filen för avsiktligt öppna. Andra sanningskälla som driftar, och
   deklarationen hade bott borta från kortet.
5. Ny status Parked/Blocked. backlog/config.yml deklarerar exakt tre statusar; en ny status
   ändrar tavlan för varje kort och verktyg.
VALT för AC #3: ETIKETT (intentionally-open), namnet ägt av policy-filen, matchad exakt per
token (aldrig delsträng). Deklarationen bor PÅ kortet och sätts med verktyget.

TVÅ DEFEKTER FUNNA UNDER BYGGET, BÅDA FIXADE:
A. Barn-uppslaget jämförde kort-ID NUMERISKT. awk behandlar 18.2 och 18.20 som lika tal, så
   TASK-18.20:s status lästes ur TASK-18.2:s rad och TASK-18 rapporterades som "samtliga 19
   barn Done" fastän 18.20 stod To Do — ett FALSKT RÖTT. Fixat med strängjämförelse; regressions-
   par T17/T18 låser fast det. Upptäckt bara för att barnstatusarna mättes oberoende FÖRE bygget.
B. Ofullständig policy gav exit 1, inte exit 2. Formen ${VAR:?...} avslutar skalet med 1, och
   grindens kontrakt säger "1 = drift funnen, 2 = anropsfel" — en trasig konfiguration
   rapporterades alltså som ett inkonsistent KORT. MÄTT mot originalet vid b8ca291: exitkod 1.
   Fil-saknas-vägen gav korrekt 2 hela tiden, vilket är varför luckan aldrig syntes: testfallet
   prövade filen, inte variabeln. Fixat med explicita kontroller; T23/T25/T26 täcker båda
   obligatoriska variablerna.

BEDÖMNING PÅ SYSKONAGENTENS FRÅGA (invariant 1 fäller på varje nyss levererat kort):
ARBETSLISTA, inte brus — men bara i grindens AVSEDDA KADENS. Skriptets eget huvud avgör saken
redan: "Ett kort som är obockat direkt efter landning är NORMALT. Felet är när det FÖRBLIR
obockat." Grinden är en inaktuellt-tillstånd-kontroll och hör i natten. Ett kort som bockas
21:00 och stängs 21:20 syns aldrig i en nattlig körning; ett kort som står kvar nästa natt är
precis det fel grinden byggdes för. Sex samtidiga fällningar uppstår bara om grinden körs MITT I
en våg, vilket är off-design-användning — då är utskriften en arbetslista över kort som väntar
på stängning, inte ett larm.
ROTEN, om det ändå ska åtgärdas: invariant 1 har ingen tidsdimension. Den kan inte skilja ett
kort som bockades för fyra minuter sedan från ett som bockades för fyra dagar sedan. CLI:t
exponerar Updated: i --plain-utdata, så ett karens-fönster i policy-filen är mekaniskt möjligt.
Det är ett SCOPE-BESLUT och byggs inte här — rapporterat till orkestreraren.
INTERAKTION MED AC #1-FORMEN: ingen försämring, och delvis en förbättring. Invariant 3 kan
strukturellt INTE utlösas av en bygg-agents korrekta mellantillstånd — en agent som avslutar
sista skivan lämnar barnet obockat/ej-Done, alltså "inte alla barn Done", alltså ingen fällning.
Invariant 3 kan bara utlösas efter att orkestreraren stängt samtliga barn men glömt föräldern.
0-AC-utan-barn-klassen fäller aldrig alls. Nettobidraget till en våg-burst är noll.

MÄTNING AV KÖRKOSTNAD (relevant för T107): 170 CLI-anrop per körning (1 listning + 169 kort),
oförändrat av denna ändring — barn-uppslaget sker mot insamlad data i minnet, inte via nya anrop.
Väggtid lokalt 154-155 s vid loadavg 3.9-5.1 (2 körningar). LOKALA TAL — ingen CI-mätning gjord.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
