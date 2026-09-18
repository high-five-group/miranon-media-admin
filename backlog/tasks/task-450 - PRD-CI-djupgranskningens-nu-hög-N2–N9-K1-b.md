---
id: TASK-450
title: 'PRD: CI-djupgranskningens nu-hög (N2–N9 + K1 b)'
status: To Do
assignee: []
created_date: '2026-09-18 09:51'
labels: []
dependencies: []
ordinal: 774000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Djupgranskningen av CI-, test-, Git- och grindvaktsarkitekturen (S126, 2026-09-17) fann en välmotiverad kvalitetsplattform med fel proportioner: grinden FÖRE merge håller, nätet EFTER merge läcker. Marcus märker det på tre sätt. (1) Nattkontrollen har varit röd 51 av 52 nätter eftersom projektets egen bokföring delar lampa med de verkliga produkttesterna — på 25 av 52 nätter var ett produktskyddande jobb rött utan att någon kunde se det. (2) Efterkontrollen tittar bara på den översta ändringen när kön landar flera samtidigt — 60 gånger på nitton dagar hoppades proven mot riktig databas och riktig inloggning över trots att kod låg under. (3) Ett enda jobb äger 92–98 procent av väntan på varje kodändring. Därtill: en lista i produktionsdatabasen tar slut vid december 2026 (säker produktstörning), styrande text bär falska tal och falsifierade motiveringar, och återställningsvägen för frontenden är oövad och odokumenterad.

### Lösning

Nu-högens åtgärder N2–N9 ur granskningens åtgärdsplan (leverabel 11) genomförs, var och en som egen skiva med egen landning: nattlarmet delas i kanaler så att rött betyder en sak; efterkontrollen klassar hela det pushade spannet; paraplyets lista över vad den bryr sig om får en vakt; två falsifierade motiveringar rättas; det dyraste testet delas i tre med bevarat tvåsidigt bevis; databasens lista fylls på; fyra falska påståenden rättas och granskarens missar börjar bokföras; rollback-runbooken skrivs. Marcus beslut K1 (väg b) läggs som egen skiva efter att nattlarmet delats.

### Användarberättelser

1. Som ägare vill jag att ett rött nattlarm betyder att ett produkttest gått sönder, så att jag kan lita på lampan igen.
2. Som ägare vill jag att bokföringsfynd samlas i ETT stående ärende, så att de inte dränker produktlarmen.
3. Som ägare vill jag att beroendesäkerhetens nattliga avläsning har en egen kanal, så att den kan bära ansvaret när dagsgranskningen villkoras (K1 b).
4. Som ägare vill jag att efterkontrollen kör full svit när en grupplandning bär kod under en texttopp, så att proven mot riktig databas och inloggning aldrig hoppas över tyst.
5. Som utvecklare vill jag att efterkontrollen faller till full svit vid varje osäkerhet (tom eller onåbar bas, API-fel), så att klassningen är fail-closed.
6. Som utvecklare vill jag att ett nytt toppnivåjobb som glöms i paraplyets lista fäller CI med jobbets namn, så att felklassen blir omöjlig i stället för osannolik.
7. Som nästa läsare vill jag att dedupens sundhet motiveras med det skäl som faktiskt gäller, så att jag inte bygger på ett villkor som stängdes av 2026-08-05.
8. Som ägare vill jag att väntan före landning ungefär halveras, utan att något skydd tas bort.
9. Som utvecklare vill jag att det delade självtestet bevisar att skärvorna TILLSAMMANS täckte hela klassen, så att det tvåsidiga beviset består.
10. Som Lotta vill jag kunna skapa ett event med startdatum 2027, så att vårens planering inte möts av ett tekniskt fel.
11. Som läsare av styrande text vill jag att tal ersätts av kommandot som räknar, så att påståendet aldrig kan bli inaktuellt igen.
12. Som ägare vill jag att fel som review-grinden MISSADE bokförs, så att dess träffsäkerhet blir mätbar.
13. Som den som hanterar en incident vill jag ha en skriven och övad återställningsväg för frontenden, med steget som slår PÅ automatisk utrullning igen, så att appen inte tyst står kvar på en gammal version.
14. Som ägare vill jag att en textändring inte väntar på en beroendegranskning som per definition inte kan hitta något nytt i den diffen, så att en extern varning inte fryser hela flödet i nio dagar igen.
15. Som ägare vill jag att varje ändring som rör beroendeträdet fortfarande granskas blockerande, så att K1 (b) inte försvagar skyddet där det hör hemma.

### Implementationsbeslut

- Spec per åtgärd = granskningens åtgärdsplan, leverabel 11 (docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md § Nu + § Två vägval). Varje skiva pekar på sitt avsnitt; planens tio fält (problem, förändring, effekt, risk, berörda filer, beroenden, verifieringsmetod, rollback) är skivans kontrakt. Bygg-agenten prövar planens premisser mot disk före bygge (ADR-086) — radnummer i planen är 2026-09-17:s och kan ha glidit.
- Marcus beslut 2026-09-18 (sessionsdok S126 Del 7): K1 = väg (b), först när N2 landat; K2 = (1) med (2) inbyggt för bokföringskanalen, (3) inte alls; B3 = behåll planen; GO på nu-högen; SE1–SE21 utförs efter nu-högen.
- N2 byggs i ADR-082-mönstrets form (samma som länkkontrollens stående ärende). Eftersom K1 = (b) får den nattliga beroendegranskningen en tredje, egen kanal i samma skiva.
- N3 = tråd T166 vägval 2 (räkna stegen från pushens topp till dess bas; mer än ett steg ⇒ full svit). Ingen ny klassnings-implementation; ADR-077 beslut 1 orörd.
- N4 = CI-wirat invariant-skript i samma form som repots befintliga fetch-depth-invariant; hör INTE hemma i paritetsverktyget (körs inte i CI).
- N6 = befintliga kortet TASK-366. Designfrågan besvarad här: täckningskontrollen byggs FÖRST, delningen sedan, i samma ändringsförslag — varje skärva skriver ned antalet prövade tester och ett sammanfattande steg kräver att summan är lika med klassens listade antal. Ingen takhöjning.
- N7 är en skrivning i produktionsbasen (ägarens kanal; agenter mekaniskt spärrade). Den riktiga lösningen (formelhärlett fält) är SE14, utanför detta PRD.
- K1 (b): beroendegranskningen på ändringsförslag villkoras mot beroendeträdet; jobbet står kvar i paraplyets lista; ADR-028:s undantagsflöde orört; natten granskar hela trädet med strängare tröskel.
- Kritisk väg N2 → N3. N4, N5, N6, N9 parallellt. N8 sist (bär resultatet av N2 och N3). K1 (b) efter N2.

### Testbeslut

Befintliga skarvar, ingen ny: (1) repots gatekeeper-testsviter (en tvåsidig svit per skript, CI-wirad) för N3 och N4; (2) nattworkflowens egen simulate_failure-ingång för N2, tvåsidigt — bokföringsgrind röd ⇒ bara nya kanalen, produktjobb rött ⇒ bara ci-natt; (3) TASK-366:s tre befintliga acceptanskriterier plus "summakontrollen fäller om en skärva tas bort" för N6; (4) skarpa verkliga SHA:n ur granskningens mätning för N3. Ett bra test här prövar externt beteende (vilket ärende skapas, vilken klassning returneras, fäller grinden) — aldrig skriptens inre form. Varje ny vakt bevisas tvåsidigt: ska fälla på planterat fel, ska passera på verkligt tillstånd.

### Utanför omfattningen

SE1–SE21 (eget PRD efter nu-högen — beslutat att utföras). I1–I11 (dömda inte alls). B1:s brytdag för ADR-131 (Marcus ger datumet). Rollback-övningen mot produktion (Marcus beslutar när; N9 levererar dokumentet). Den stående, aktuella dokumentationsytan över CI-arkitekturen (eget designarbete, research-pass pågår). Wizarden (huvudrapporten § 11).

### Estimat

Nio skivor plus avslutande QA-kort: N2 (M), N3 (M), N4 (S), N5 (S), N6 = TASK-366 (M–L), N7 (S, HITL), N8 (S), N9 (S), K1 b (S–M).

### ADR-koppling

ADR-082 (stående ärende-mönstret; amenderas av N2), ADR-077 (klassning, dedup, nightly; amenderas av N5 och K1 b), ADR-076 (merge-grinden), ADR-028 (audit-undantagsflödet), ADR-083 (prosa som påstår mekanism), ADR-100 (sanningshierarkin), ADR-105 (review-grinden — varje kod-skiva går genom loopen), ADR-131 (B1, utanför).

### Ytterligare anteckningar

N1 löstes av #2491 samma dag som granskningen. Granskningens leverabler är en daterad ögonblicksbild — skivorna rättar dem inte i efterhand.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
