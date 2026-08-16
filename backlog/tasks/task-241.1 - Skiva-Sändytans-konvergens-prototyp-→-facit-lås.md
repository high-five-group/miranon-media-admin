---
id: TASK-241.1
title: 'Skiva: Sändytans konvergens-prototyp → facit-lås'
status: In Progress
assignee: []
created_date: '2026-08-16 14:39'
updated_date: '2026-08-16 15:47'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-241
ordinal: 452000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sändytan är Sveparnas ansikte och Marcus WOW-yta — den konvergeras till facit INNAN byggskivorna publiceras, samma rytm som hem-prototypen: agent bygger varv → Marcus granskar RENDERAD yta → iterera till 'lås facit'. Divergens bortvald (Marcus-kvitterad 2026-08-16): interaktionsformen är redan grillad och låst (overlay · EN triad cross-event · ett sändanrop per event-grupp, ADR-114 + Del 10 beslut 1/5/7), och Åtgärds-sidans triad är beprövad förebild (AtgardsSida.tsx + atgarder-*-send-acceptance-sviterna). Motorn återanvänds: useSendActionEmail/useSendActionTestEmail + EF send-action-email (registrationIds[] finns redan; testmail låst till 1 mottagare). Urvals-intag från hemmets pekning: history-state-precedentet mmAtgardsUrval (task-228). Prototypen bor i EGEN katalog (src/components/dev/svep-prototyp/) — hem-prototypens katalog rivs i task-243.5 och rivningarna får inte krocka. Husets sidkrom + NOLL meta-text på ytan (147.6-lärdomen); prototyp-verifiering per docs/reference/prototyp-verifiering-runbook.md (portkartan!). Ordlistan: Morgonkoll, Bevakningsrad. Utforskar användarberättelser 2, 3, 4, 5, 9 i PRD:n.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Konvergens-prototyp av sändytan som OVERLAY ovanpå hem-vyn (Del 10 beslut 1: handlingar påbörjas OCH slutförs utan att Lotta lämnar Hem; siffrorna uppdateras på plats) på egen dev-route med simulerade datalägen så alla tillstånd är dömbara
- [x] #2 Trygghetstriaden komplett i prototypform: adresslista grupperad per event · bläddringsbar per-event-förhandsvisning · testmail-momentet (simulerat, ingen skarp sändning ur prototypen)
- [x] #3 Båda svep-instanserna representerade: bekräftelsesvepet och påminnelsesvepet (urval ENDAST läge 1 'Att påminna' — mekaniskt spamsäkert per en-påminnelse-modellen)
- [x] #4 Övergången hem ↔ overlay skissad i prototypen (WOW-riktningen, prefers-reduced-motion respekterad)
- [ ] #5 Facit LÅST efter Marcus konvergensvarv: manifest under tasks/sessions/bilagor/ (godkand: null tills promoveringsstämpel), B3-markör satt — byggskivorna publiceras först mot detta facit (ADR-102 B5)
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
TASK-241.1 -- KONVERGENSVARV 1 (bygg-agent, Sonnet 5). Detta ar ETT konvergensvarv, inte kortets fardigstallande -- AC #5 (facit-las) rors INTE, kortet flippas ALDRIG till Done av bygg-agenten.

RORDA FILER: src/routes/dev/svep-prototyp.tsx (ny dev-route, ADR-044-monstret: beforeLoad redirect i prod. Monterar VariantRo som bakgrund med handbyggda fejk-queries -- inget natverksanrop for events/registrations -- overlayen via husets Modal+Dialog-primitiv, PrototypeSwitcher for variant + eget scenario-lage via ?data=).

src/components/dev/svep-prototyp/{types.ts,data.ts,Adresslista.tsx,Forhandsvisning.tsx,SvepOverlay.tsx} -- egen katalog (ny). data.ts: tre event-grupper for bekraftelsesvepet, tva for paminnelsesvepet (samtliga lage 1 'Att paminna' -- en-paminnelse-modellens invariant dokumenterad vid kallan), mailmallar med platshallar-ifyllnad, simuleraSand (ett sandanrop per event-grupp, ADR-114 beslut 3 -- fel-scenariot ger en PARTIAL-grupp och en FAILED-grupp). Adresslista.tsx: adresslista grupperad per event, accordion (MottagarYta-monstret fran AtgardsSida.tsx). Forhandsvisning.tsx: bladdringsbar per-event-forhandsvisning + testmail-raden (simulerat). SvepOverlay.tsx: tre lagen granska/skickar/resultat (samma grammatik som GranskningsSida), resultatlaget per event-grupp.

AC-STATUS (avbockade 1-4, 5 UTANFOR scope denna varv): AC1 overlay+simulerade datalagen -- verifierat i egen browser (port 5180): normalt urval, tomt urval, fel-lage samtliga renderade och dombara. AC2 trygghetstriaden -- adresslista grupperad per event, bladdringsbar forhandsvisning (ifylld ur forsta mottagaren per grupp), testmail (visar verklig inloggad e-post, 'Skickat till staging-user@miranon.test' i egen-verifieringen). AC3 bada instanserna -- bekraftelsesvepet (3 event, 9 mottagare) och paminnelsesvepet (2 event, 3 mottagare, samtliga Att paminna) verifierade. AC4 overgangen skissad -- Modal-primitivens befintliga fade+scale-transition (data-entering/data-exiting) anvands rakt av, INGEN bespoke fortsattning-av-Morgonkollen-koreografi byggd i detta varv (--animate-mm-*-familjen namns i uppdraget som precedent men konsumeras inte har -- kandidat for varv 2). prefers-reduced-motion neutraliserar transitionen globalt (base.css).

KAND KANT, OPPET BOKFORD: resultatvyns scroll-position ateranvander dialogens befintliga scrollTop nar lage vaxlar granska->resultat (ingen scrollToTop-fix analogt AtgardsSida.tsx window.scrollTo(0,0) -- dar galler window, har galler Modal-primitivens egna overflow-auto-container, som inte exponerar en ref-krok fran Dialog/Modal-primitiverna idag). Paverkar bara lange sidor med manga event-grupper. Fix kraver antingen en ref-utokning av Modal.tsx (delad primitiv, utanfor denna skivas scope) eller en runtime DOM-query -- ingendera byggd i detta varv.

RIVNINGSBEROENDE (task-243.5 river components/dev/hem-prototyp/): src/routes/dev/svep-prototyp.tsx importerar VariantRo + demoUniversum darifran for bakgrunden. Nar katalogen rivs maste importen pekas om -- antingen mot den da-skarpa /hem-vyn eller mot en frusen egen kopia om svepytan fortfarande ar i prototypform. src/components/dev/svep-prototyp/Adresslista.tsx importerar dessutom InitialAvatar fran samma katalogs ui.tsx (samma bokforing).

VERIFIERING (DoD-kvartetten): npm run typecheck exit 0. npx @biomejs/biome check . exit 0 (0 fynd efter autofix av import-ordning/formatering). npm run build exit 0. npm run test:api 768/768 gront. node scripts/check-langa-streck.mjs: OK, 0 ofangade langa streck.

EGEN-VERIFIERING I BROWSER (port 5180, INTE 5173/5174 -- de ar Marcus, docs/reference/prototyp-verifiering-runbook.md): Playwright-skript med chromium.launch() (runbookens barande kringgang, INTE Playwright test-runner), inloggad som TEST_USER. 14 skarmdumpar -- bakgrund stangd, bekraftelse (granska/adresslista-oppen/forhandsvisning-bladdrad/testmail-skickat/armerad/skickar/resultat-allt-ok), tomt urval, fel-lage (granska+resultat med delresultat per event-grupp), paminnelse, Escape-stangning (URL-parametern ?variant= raderas korrekt), fokusfalla (25 Tab-tryckningar -- aktivt element stannar inuti [role=dialog] hela vagen).

KAND MILJO-KANT, MATT: appens globala startvarmning (ADR-112) gor CORS-blockerade anrop mot events/registrations/leads/waitlist/activity-log pa icke-allowlistade portar (5173/4173 ar de enda CORS_ALLOWED_ORIGINS). Storde INTE renderingen -- bakgrunden (VariantRo) matas med egna, natverksfria fejk-queries for events/registrations, sa BARA Senaste aktivitet (SenasteAktivitetKompakt's egen useLatestActivity, som inte kan mockas utan att andra hem-prototyp-katalogen) paverkas: visar sitt skeleton i nagra sekunder (React Query-retry) och faller sedan tillbaka till sitt EGET, redan inbyggda fellage (Kunde inte hamta senaste aktiviteten.) -- bekraftat efter 15 s vantan, inget krasch, ingen JS-exception.
<!-- SECTION:NOTES:END -->
