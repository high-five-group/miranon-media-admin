---
id: TASK-275
title: 'PRD: Bilagornas räckviddsmodell'
status: To Do
assignee: []
created_date: '2026-08-17 15:33'
labels: []
dependencies: []
ordinal: 495000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Roger & Lottas standarddokument (hörlursinfo, meny — dokumentklass A) gäller varje event av en kurstyp, men dokument-ytan är event-scopad: samma fil måste laddas upp om och om igen, och ett byte måste göras en gång per event. Lotta kan inte underhålla beståndet EN gång med effekt överallt, och kommande event föds utan sina standarddokument.

### Lösning

Räckviddsmodellen (ADR-118, grillad samsyn S107): varje bilaga bär exakt EN räckvidd — event-specifik, kurstyp (Kursfamilj + valfri Kursnivå) eller alla event. Ett events dokumentmängd är unionen av tre mängder; gemensamma bilagor syns automatiskt med räckviddsbadge överallt de gäller (även på framtida event), och byts/raderas en gång i sitt räckviddsläge på dokument-sidan.

### Användarberättelser

1. Som Lotta vill jag ladda upp hörlursinfon en gång för alla RIM-kurser, så att den finns på varje RIM-event — även de som skapas nästa år.
2. Som Lotta vill jag byta en gemensam bilaga en gång, så att alla event direkt bär den nya versionen.
3. Som Lotta vill jag se ett events alla dokument i EN lista med tydlig märkning av vad som är gemensamt, så att jag aldrig letar på två ställen.
4. Som Lotta vill jag kunna bifoga gemensamma dokument i utskick från åtgärdssidan, precis som eventets egna.
5. Som Lotta vill jag INTE kunna råka radera kursfamiljens dokument när jag städar ett enskilt events lista, så att en olycka aldrig slår mot alla event.
6. Som Marcus vill jag ladda upp hela initialbeståndet själv via det nya flödet, så att uppladdningen samtidigt är QA-vandringen av ytan.
7. Som Marcus vill jag att den utbyggda ytan talar husets etablerade formspråk, så att appen känns som EN produkt.

### Implementationsbeslut

- ADR-118 styr helheten: räckvidd = radioval (Event / Kurstyp / Alla event), kurstyp = Kursfamilj obligatorisk + Kursnivå valfri (tom nivå = hela familjen), union-hämtning, ersätt/radera endast i räckviddsläget, Dokumentklass ortogonal mot räckvidd.
- Basform: nya fält på Bilagor-tabellen i BÅDA baserna (Räckvidd-select · Kursfamilj · Kursnivå med exakt Eventplanerings valslag) + registrering i data-model-referensen. Resolution i basen (ADR-063). Befintliga rader default-migreras till Räckvidd = Event (dagens sanning).
- EF-lagret: hämtningen utökas till unionen av tre mängder; upload-vägarna (både små-fils- och ticket/finalize-vägen) tar räckviddsparametrar; allowlist-registrering per DoD-disciplinen; radera/ersätt-skyddet för gemensamma bilagor upprätthålls SERVER-SIDE — golvet är servern, aldrig enbart gömda knappar.
- UI: dokument-ytan utbyggd (ett hus, aldrig klonad) — räckviddsval i befintliga uppladdningsflödet, ett läge för gemensamma dokument utan valt event, räckviddsbadge i eventets lista och i åtgärdssidans bilageväljare; Ersätt/Radera visas inte i eventkontext för gemensamma bilagor.
- KVALITETSDIREKTIV (Marcus 2026-08-17, hårt krav, verbatim): "snälla gör det bra vid första försöket. Håll design och formspråket som redan är etablerat." Formen återanvänder husets stämplade grammatik — dokument-sidans krom och listform per facit, badge via husets Pill-grammatik, radioval via husets primitiv. Inga nya formuppfinningar.
- Facit-manifest: tasks/sessions/bilagor/s102-dokument-konvergens/facit.json — ytan "Dokument-ytan /mer/dokument, lista med filter + Visa-overlayens tre klasser" (godkänd 2026-08-16). Utbyggnaden är en beslutad avvikelse: amenderings-sidofil + Marcus omstämpling via !-kanalen; godkand-fältet är agent-fruset (ADR-104). OBS: task-273.4 amenderar samma yta parallellt — denna PRD:s UI-skiva förhåller sig till den SENAST stämplade formen.
- SEKVENSKRAV: UI-skivan startar först när task-273.4 landat på main (samma komponentfil).

### Testbeslut

Befintliga skarvar, inga nya: API-sviterna (staging-klassen) bär EF-unionen + räckviddsparametrarna + server-sidiga radera-skyddet; acceptance-/a11y-sviterna bär UI-läget. Skarv-kvittens: grillningens slutkvittens 2026-08-17 ("Yes, kvitterar") + detta korts publicering i samma landning som sessionsdok Del 3 — bokfört öppet i stället för separat runda.

### Utanför omfattningen

Mall-editor · dokumentklass B/C-genereringen (orörd) · initialbeståndets uppladdning (Marcus moment = QA-kortet) · Elfsight/webbplatsens formulär (F.2-spåret) · Visa-/nedladdningsikonerna (task-273.4).

### Estimat

4 skivor: 1 S (basstruktur) + 1 M (EF-lagret) + 1 M (UI) + 1 QA.

### ADR-koppling

ADR-118 (styrande, mintad i samma landning) · ADR-063 (resolution i basen) · ADR-102/103/104 (facit/promovering/stämpelkanal) · ADR-115-sfären (Kursfamilj/Kursnivå-dimensionen).

### Ytterligare anteckningar

Modellpolicy per Marcus kvot-direktiv 2026-08-17: bygg-agenter på Sonnet, orkestrering på huvudloopen. Ordlistetermerna Räckvidd (bilagas) och Gemensam bilaga landade tillsammans med ADR-118.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
