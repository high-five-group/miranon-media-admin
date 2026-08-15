---
id: TASK-219.2
title: 'Skiva: Button isLoading + auth-migreringen'
status: In Progress
assignee: []
created_date: '2026-08-15 08:49'
updated_date: '2026-08-15 09:32'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-219
ordinal: 421000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Button-primitiven får en isLoading-prop som bär trappsteg 2 komplett — knapp-intern spinner, spärrat klickläge (inga dubbelklick), skärmläsarbesked — för alla knappvarianter; de sex handkodade spinner-ihopsättningarna på auth-ytorna migreras till propen. Täcker användarberättelser: 2, 6 (PRD TASK-219).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Button-primitiven exponerar isLoading med spinner + spärrat klickläge + sr-besked, fungerande för samtliga varianter/intents; granskningsbar i dev-primitives
- [x] #2 Sex auth-ställen migrerade; ingen lokal spinner-ikon-ihopsättning kvar i auth-routes (grep-bevis)
- [x] #3 Hermetiska visual-sviten + a11y-svepet gröna med de nya lägena
- [x] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Button.tsx (src/components/primitives/Button.tsx): isLoading + loadingText-props. MEDVETET INTE react-aria-components' isPending — verifierat i källkod (node_modules/react-aria-components/dist/private/Button.js) att isPending internt kör announce(message, 'assertive') hårdkodat vid focus-transition, samma aggressiva klass som FK:s role="alert" som ADR-113 §Beslut punkt 2 + research-passet (loading-indikator-branschpraxis-2026-08-15.md §4) uttryckligen valde BORT till förmån för polite. Egen implementation i stället: aria-disabled (INTE isDisabled — native disabled tar bort knappen ur tabordningen, verifierat i node_modules/react-aria/dist/private/button/useButton.js rad 26 "disabled: isDisabled" för elementType=button; aria-disabled bevarar fokus) + onPress kopplas bort + type nedgraderas submit→button under isLoading (stoppar webbläsarens implicita form-resubmit via Enter i ett annat fält, samma teknik som isPending men utan assertive-biverkan) + sr-besked via <span role="status" aria-live="polite"> runt loadingText (samma Roselli-mönster som Skeleton.tsx/Waitlist.tsx redan använder i repot). data-loading-attribut + data-[loading]:cursor-progress i CVA-basen (ingen opacity-dimning under isLoading — bevarar textkontrast, en avsiktlig, dokumenterad skillnad mot den gamla native-disabled-dimningen).

Auth-migrering (6 ställen, grep-bevis noll Loader2-importer kvar i src/routes/{login,glomt-losenord,nytt-losenord,passkey,valkommen}.tsx): login.tsx submit-knappen och passkey-knappen, glomt-losenord.tsx, nytt-losenord.tsx, passkey.tsx (Skapa en passkey-knappen), valkommen.tsx. login.tsx:s passkey-knapp har en genuin cross-dependency (ska vara spärrad NÄR ANDRA formuläret submittar) — löst som isDisabled={isSubmitting} (native, oförändrad — knappen är inte den som laddar) + isLoading={passkeyLaddar} (aria-disabled, egen laddning), i stället för det gamla isDisabled={isSubmitting || passkeyLaddar} som blandade ihop de två. passkey.tsx:s "Inte nu"-knapp orörd (isDisabled={sparar}, samma cross-dependency-logik, ingen egen laddning).

dev/primitives.tsx: ny isLoading-demo-knapp per intent-sektion (parallell med befintliga "Inaktiverad"), fångas automatiskt av tests/a11y/primitives.spec.ts "Button — alla fem intent-sektioner" (körd, 0 violations, se AC3).

Grindar (alla körda lokalt, exit-koder mätta separat från pipe): typecheck exit=0, biome check . exit=0 (6 pre-existing warnings + 42 infos i orörda filer, verifierat att de fanns innan mina ändringar), build exit=0, test:api 750 passed exit=0, test:a11y 88 passed exit=0 (inkl. de nya isLoading-lägena), test:visual 204 passed / 12 "failed" — samtliga 12 är "-darwin.png saknas" (gitignorad, CI föder bara -linux.png), EMPIRISKT verifierat pre-existing genom git stash + omkörning av samma test på ORÖRD kod (identiskt fel), inte en regression.

Miljöfynd under bygget: en orphanad (PPID=1) vite-devserver från ett syskon-worktree (.claude/worktrees/s102-resume) höll hårdkodad port 5199 (A11Y_DEV_PORT, ej env-styrbar) upptagen och blockerade test:a11y. Terminerad (SIGTERM) efter verifiering att den var föräldralös/detached — ingen annan åtgärd i det worktreet.
<!-- SECTION:NOTES:END -->
