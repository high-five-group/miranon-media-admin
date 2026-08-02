---
id: TASK-126
title: 'PRD: Riktig app-känslan — PWA maxad (T95 Spår A)'
status: To Do
assignee: []
created_date: '2026-08-02 14:15'
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

- Install-ytans externa beteende (rätt väg per plattform, prompt-flödet,
  instruktionens tillstånd) testas i acceptance-skarven — hermetiskt,
  utan staging.
- Tillgängligheten testas i a11y-skarven; ribban är 11, inga undantag.
- Manifest-fälten verifieras i preview-skarven som redan bygger appen och
  granskar bundlen — fälten är byggda artefakter och testas där de uppstår.
- Förebild: Mer-flikens befintliga acceptance-/a11y-mönster.

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
- Ingen ny ADR ur detta kort. R2-researchen kan föda en desktop-form-ADR —
  den refereras då härifrån, mintas aldrig inline.

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
