---
id: TASK-126
title: 'PRD: Riktig app-känslan — PWA maxad (T95 Spår A)'
status: To Do
assignee: []
created_date: '2026-08-02 14:15'
updated_date: '2026-08-03 12:28'
labels: []
dependencies: []
ordinal: 198000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Roger & Lotta ska uppleva Miranon Media Admin som en riktig app på sina
enheter — Rogers Mac och iPad, Lottas iPad och mobil. I dag ger en
installation Chromes anonyma infobar utan beskrivning eller skärmbilder,
appen innehåller ingen som helst vägledning för att installera den, och på
hushållets huvudplattform (iPad/iPhone) finns ingen automatisk
installations-prompt överhuvudtaget — den som inte redan vet vägen hittar
den aldrig.

### Lösning

PWA:n maxas till app-butiks-känsla (S95-grillningens beslut 9, B2):
manifestet kompletteras med alla fält som ger den rika
installationsdialogen, och en "Installera appen"-yta byggs i Mer-fliken —
med iOS/iPadOS-instruktionen som huvudperson (pedagogik i Gunilla-klass:
Lotta ska FÖRSTÅ varje steg), Mac-Safari "Lägg till i Dock" och
Chromium-prompten som sekundära vägar. Install-ytan är det konkreta behov
som aktiverar tråd T47:s vilande Inställnings-hemvist.

### Användarberättelser

1. Som Lotta vill jag ha appen som egen ikon på min iPads hemskärm, så att
   jag öppnar den som vilken app som helst utan att leta i webbläsaren.
2. Som Lotta vill jag ha en steg-för-steg-instruktion med bilder för exakt
   min enhet, så att jag klarar installationen själv på första försöket.
3. Som Lotta vill jag att appen öppnas i eget fönster utan
   webbläsarens adressfält, så att den känns som en riktig app och inget
   distraherar.
4. Som Roger vill jag lägga appen i Dock på min Mac, så att den är ett
   klick bort i mitt dagliga arbete.
5. Som Roger vill jag att installationsdialogen visar namn, beskrivning
   och skärmbilder, så att det jag installerar ser genomarbetat och
   förtroendeingivande ut.
6. Som Roger vill jag ha genvägar i appikonens högerklicksmeny till de
   vanligaste handlingarna, så att jag når dem utan mellansteg.
7. Som användare vill jag att ett klick på en app-länk fokuserar det
   redan öppna app-fönstret i stället för att öppna ett till, så att jag
   aldrig får dubbla fönster med olika tillstånd.
8. Som Marcus vill jag att install-ytan bara erbjuder vägar som faktiskt
   fungerar på besökarens plattform, så att ingen möts av en död knapp.
9. Som Marcus vill jag kunna verifiera installationsupplevelsen på riktiga
   enheter efter deployen, så att "det ser rätt ut" är bevisat och inte
   antaget.
10. Som framtida produktbyggare vill jag att install-prompt-logiken är
    bibliotekskod, så att nästa produkt får samma yta utan omskrivning.

### Implementationsbeslut

- Manifestet kompletteras med: stabil identitet och scope, beskrivning,
  skärmbilder i både stående och liggande format (identisk aspect ratio
  per formatkrav — tas ur den deployade appen), kategorier,
  fokusera-befintligt-fönster-beteende vid start, samt 2–3 genvägar till
  de vanligaste handlingarna (exakt urval avgörs vid skivningen mot
  UI-spårets nuläge).
- Install-ytan bor i Mer-fliken och aktiverar T47:s parkerade
  Inställnings-hemvist; den deferrerade konto-uppgifts-visningen (T69-B2)
  följer med om skivningen finner den billig, annars kvarstår den i T47.
- Plattformsdetektering styr vilken väg som visas: iOS/iPadOS får den
  manuella Dela-vägen (ingen prompt existerar där — plattformsfakta, inte
  vårt val), Mac-Safari får Lägg-till-i-Dock-vägen, Chromium får riktig
  installations-prompt gated bakom användarklick.
- Install-prompt-komponenten är bibliotekskod och bär 11/11/11-ribban.
- Enhetsprofilen (S95 Del 2) styr prioriteringen: iOS/iPadOS-instruktionen
  är kärnleveransen, Chromium-prompten sekundär.
- Fönster-guldkanten (window-controls-overlay) byggs INTE i denna
  arbetsenhet — öppet skjuten, omprövas efter R2.

### Testbeslut

- **RÄTTAT 2026-08-03 (TASK-131).** Install-ytans externa beteende UTAN
  databeteende — rätt plattformsväg, prompt-flödet, redan-installerad-
  övergången — testas i **webbläsarbeteende-klassen**
  (`tests/webblasarbeteende/`, projektet `webblasarbeteende`; TASK-131/
  ADR-094), hermetiskt, utan staging och utan fixturvärld. Raden pekade
  ursprungligen mot "acceptance-skarven"; `scripts/hermetik-sjalvtest.mjs`
  (ADR-080 beslut 3, VILLKOR för den klassens existens) fällde alla 11
  tester som landade där (TASK-126.2, PR #628) eftersom `InstallPrompt`/
  `useInstallPrompt` saknar databeteende att bevisa formen av — vakten
  gjorde rätt, denna rad styrde fel. ADR-080:s vakt och acceptance-klassens
  kontrakt är ORÖRDA av rättelsen.
- Tillgängligheten testas i a11y-skarven; ribban är 11, inga undantag.
- **RÄTTAT 2026-08-03 (TASK-130).** Manifest-fälten verifieras i
  `.github/workflows/ci-suite.yml`:s **Pure + Build**-jobb, direkt efter
  Build, i det jobb som redan producerar `dist/` ovillkorligt. Raden pekade
  ursprungligen mot "preview-skarven som redan bygger appen och granskar
  bundlen" — verifierat (TASK-130) att den skarven ALDRIG anropas av CI
  (noll träffar i samtliga `.github/workflows/*.yml` på
  `test:preview:staging`, `staging-preview` eller `verify:staging-bundle`);
  tests/preview/ + scripts/check-staging-bundle.sh är ett lokalt
  verifieringsverktyg, inte en grind, och en grind som aldrig körs är ingen
  grind. TASK-126.1:s agent placerade manifest-fältgrinden i Pure+Build i
  stället, motiverat i en kommentar på plats i ci-suite.yml; detta beslut
  (TASK-130, på Marcus breda delegation) bokför Pure+Build som STÅENDE
  hemvist för mekaniska manifest-/bundle-grindar framåt, så nästa skiva i
  detta spår inte möter samma vägg.
- Förebild: Mer-flikens befintliga acceptance-/a11y-mönster; install-ytans
  plattformsdetektering har dessutom webbläsarbeteende-klassen som egen
  förebild (TASK-131/ADR-094) för framtida datalösa beteendetester.

### Utanför omfattningen

- Desktop-wrapper (Tauri/Electron) — avgörs på research-pass R2:s underlag
  som eget ADR-beslut; detta kort är oberoende av utfallet.
- Window-controls-overlay (öppet skjuten guldkant).
- Push-notiser och badging (T77 notis-centret är egen tråd).
- Publik deploy, DNS och CORS-utökning — Grind 0, bokförd i T46:s
  go-live-karta som Marcus/Code-prod-moment, inte backlog-materia.
- Inbjudnings- och auth-flödet — systerkortet (Spår B).

### Estimat

4–6 skivor, klass S/M. Mest konfiguration + en pedagogisk UI-yta + en
skärmbilds-runda; PWA-grunden (ADR-047) är redan betald.

### ADR-koppling

- Styrande: ADR-047 (PWA-arkitekturen — detta kort fullbordar dess
  användarupplevelse, ändrar inte dess arkitektur).
- Samsynen: sessionsdok S95 Del 2 (nio beslut + enhetsprofilen).
- Denna PRD myntar ingen egen ny ADR. Testbeslut-raden ovan refererar två:
  ADR-094 (ny, TASK-131) och ADR-080 (redan myntad av ett systerspår,
  oförändrad av denna rättelse). R2-researchen kan föda en desktop-form-ADR
  — den refereras då härifrån, mintas aldrig inline.

### Ytterligare anteckningar

- Grind 0 (publik HTTPS-URL) blockerar slutverifikatet på riktiga enheter
  — skivorna byggs och testas hermetiskt före deployen, men kortets Done
  kräver Marcus-verifikat på riktig enhet per huvudväg.
- Skärmbilds-assets kan inte tas förrän UI-spåret (S93) nått stabil yta —
  skivningen lägger den skivan sist.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Marcus-verifikat på riktig enhet per huvudväg (iPad-hemskärm, Mac-Safari Dock, Chromium-prompt) efter Grind 0
- [ ] #6 Install-ytans instruktioner klarar Gunilla-principen: begriplig utan tekniska förkunskaper
<!-- DOD:END -->
