# a8-systemmeddelanden-design

## FRÅGA
Hur designar vi appens systemmeddelanden — de två skärmavbilderna Marcus visar plus meddelande-ytorna i stort — så de matchar appens stil och håller branschledarnivå?

## SVAR
Båda skärmavbilderna visar EN och samma app-egna yta: `AppErrorBoundary`-fallbacken (src/components/ErrorBoundary/AppError.tsx:39–65). Ingen webbläsardialog inblandad — allt är designbart. Den ser ostylad ut därför att den är MEDVETET beroende-snål (docstring rad 18–22: "inline-stilar utan tokens/CSS ... ska rendera även när stylesheet/design-system är trasigt"), men det designvalet kolliderar med verkligheten: Tailwind Preflight laddas alltid (main.tsx:12) och nollställer knappen (`border: 0 solid` + `background-color: transparent`), så "Ladda om" renderas som naken brödtext utan ram, bakgrund eller radie — exakt vad bilderna visar. Dessutom tvingar inline `fontFamily: 'system-ui'` (rad 45) fram ett synligt typsnittsbyte mot appens Inter. Bakom fel-ytan syns i bild A eventsidan Fjärrskådning och i bild B Hem-vyn. Zoomar man ut från just den rutan är den verkliga bilden: appen har EN meddelande-primitiv (`MessageBox`, ~48 skarpa call-sites i 27 filer) som i praktiken bara används som felruta (41 av 47 anrop `intent="error"`), noll toast-/bekräftelselager, ad hoc-tomtillstånd, och två governing-dokument som uttryckligen förbjuder den rubrik båda fel-lagren faktiskt bär ("Något gick fel"). Kontrasterna håller (alla intent-par 5,1–7,8:1, uträknat), så problemet är inte tillgänglighetsgolvet utan att meddelande-systemet aldrig fått en egen designad grammatik: tre av fyra bakgrundstoner är råa Tailwind-defaults, radien är 4 px i en app där kort kör 16 px, det finns ingen ikon-bärare, ingen emphasis-dimension som §19 annars etablerat, och ingen skärmläsar-typkontext som FK:s förlaga (FMessageBox) har. Rekommendationen är en meddelande-taxonomi i fyra lager + spec-§ + prototyp-pass, INTE en punktfix på fel-rutan.

## FYND
- **Båda skärmavbilderna visar AppErrorBoundary-fallbacken — app-egen React-yta, ingen webbläsardialog. Texten matchar koden ord för ord.**
  BEVIS: src/components/ErrorBoundary/AppError.tsx:52–63 ('Något gick fel' / 'Appen kunde inte återhämta sig från ett fel. Ladda om sidan för att fortsätta — ingenting du har sparat går förlorat.' / knapp 'Ladda om'). Bild B (1238×794 @144 dpi) visar sista raden 'Ladda om' + Hem-vyn; bild A (1458×1492) visar hela blocket + eventsidan Fjärrskådning/Event-796.
- **GRUNDORSAK till att 'Ladda om' ser ut som brödtext: Tailwind Preflight nollställer knappen och AppError sätter medvetet inga klasser/tokens — bara marginal, min-höjd och padding inline.**
  BEVIS: node_modules/tailwindcss/preflight.css:15 `border: 0 solid` + :238–250 `button { … background-color: transparent }`; AppError.tsx:57–63 (inline style enbart marginTop/minHeight/padding); AppError.tsx:18–22 docstring 'Medvetet beroende-snål: klasskomponent, inline-stilar utan tokens/CSS'.
- **Fel-ytan bryter mot TVÅ governing-dokument som uttryckligen förbjuder just den rubriken.**
  BEVIS: docs/specs/DESIGN-SYSTEM-SPEC.md:889 'Lotta ska aldrig se "Något gick fel" utan kontext'; docs/specs/ACCESSIBILITY-CHECKLIST.md:134 'hanteras med tydligt meddelande, inte bara generisk "Något gick fel"'. Kod: AppError.tsx:52 och SectionError.tsx:23 bär båda exakt 'Något gick fel'.
- **Spec §11:s designform för sektions-fel är inte den byggda: specen säger vänsterkant + warning-ton, koden ger full 1px röd ram via MessageBox error.**
  BEVIS: DESIGN-SYSTEM-SPEC.md:900 'Sektion-fel: border-left: 3px solid var(--mm-warning), bg: var(--mm-warning-bg)'; src/components/ErrorBoundary/SectionError.tsx:23 `<MessageBox intent="error" …>` → MessageBox.tsx:8 'rounded border px-4 py-3' + :15 error-varianten.
- **MessageBox är i praktiken en felruta: 41 av 47 intent-angivelser är error, 4 success, 1 warning, 1 info — spridda över 27 filer, ~48 skarpa call-sites.**
  BEVIS: `grep -rn -A0 "<MessageBox" src/ --include="*.tsx" | grep -o 'intent="[a-z]*"' | sort | uniq -c` → 41 error / 4 success / 1 warning / 1 info; 50 träffar totalt varav JSDoc-exempel (MessageBox.tsx:50) + demo-route (routes/dev/primitives.tsx:168) + 1 dynamisk (SegmentMailCompose.tsx:321).
- **Ingen toast/snackbar finns i appen — planerad till Fas 5 men aldrig levererad, och avvikelsen är redan öppet bokförd i byggplanen.**
  BEVIS: docs/byggplan.md:362 'Toast/Notification — Fas 5 (app-shell-leverans)'; docs/byggplan.md:565 '…fel-yta via MessageBox role="alert" (avvikelse från DoD 6:s "toast"-ord — ingen toast-infra finns; medveten, dokumenterad)'; noll träffar på Toast/Snackbar i src/.
- **Seende användare får ingen synlig bekräftelse vid lyckade mutationer — 17 mutations-anrop annonserar bara för skärmläsare.**
  BEVIS: `grep -rn "alertScreenReader(" src/` → 17 anrop i src/data/mutations/* (useUpdateEvent.ts:45 'Ändringarna sparade.', useUpdatePersonNote.ts:63 'Anteckning sparad', registrationConfirmation.ts:98–215 m.fl.); endast 4 synliga `MessageBox intent="success"` i hela src/.
- **Feedback-tokens saknar kant-/ikon-lager: kanten ÄR textfärgen, och tre av fyra bakgrundstoner är identiska med Tailwinds default-50-toner, inte Miranon-egna.**
  BEVIS: src/styles/tokens/components.css:118–130 (info/success/warning/error: bg = --mm-*-bg, border = text = --mm-*); primitives.css:35–43 → --p-red-100 #fef2f2 = Tailwind red-50, --p-green-100 #f0fdf4 = green-50, --p-blue-100 #eff6ff = blue-50; endast --p-copper-100 #fdf4ee är egen.
- **Kontrast är INTE problemet — alla fyra intents klarar AA för text och 1.4.11 för kant.**
  BEVIS: Egen WCAG-beräkning (scratchpad/contrast.py): error 7,14:1 · warning 5,49:1 · success 5,37:1 · info 5,13:1 mot sin bg; kant mot vit 5,58–7,82:1; brödtext #242424 på tint-bg 14,2–14,8:1.
- **MessageBox bryter mot appens formspråk i radie: 4 px medan kort-ytorna genomgående kör 16 px.**
  BEVIS: MessageBox.tsx:8 'rounded …' → node_modules/tailwindcss/theme.css:398 (--radius-sm 0.25rem = 4 px); `grep -rno "rounded-[a-z0-9]*" src/components` → 25× rounded-2xl (1rem), 11× rounded-xl, 16× rounded-lg.
- **MessageBox saknar ikon och skärmläsar-typkontext, och `title` är valfri — färg blir enda bäraren om title utelämnas (WCAG 1.4.1-lucka i biblioteks-API:t, ej i nuvarande bruk).**
  BEVIS: src/components/primitives/MessageBox.tsx:31 `title?: string`, :64–79 (ingen ikon, ingen sr-only typ-etikett). Förlagan FK FMessageBox har fyra typer + standard/short-layout + inbyggd AT-kontext ('Informationsmeddelande') via `provideScreenReaderContext` — https://designsystem.forsakringskassan.se/latest/components/fmessagebox.html
- **Live-region-mönstret är riskabelt: varje MessageBox skapas villkorligt samtidigt som innehållet, medan branschpraxis kräver att regionen finns i DOM före uppdateringen. Appen har redan rätt mönster i alertScreenReader (alltid monterad) och i OfflineIndicator — men vyerna följer det inte.**
  BEVIS: src/components/events/detail/Deltagare.tsx:921 `{utfall != null && (<MessageBox …>)}` (samma mönster i 27 filer); motmönstret finns i src/lib/alert-screen-reader.ts:1–60 och src/components/AppShell/OfflineIndicator.tsx:9–21 ('Live-regionen är ALLTID monterad'). Källa: Sara Soueidan, Accessible notifications with ARIA Live Regions (del 2) — regionen måste finnas vid parse; max två regioner (en polite, en assertive); undvik interaktiva element i live-regioner.
- **React Arias toast-primitiv är fortfarande beta (UNSTABLE_-prefix) 2026 — men ger landmark-region med F6-navigering, timeout-paus vid hover/fokus och min 5 s.**
  BEVIS: https://react-aria.adobe.com/Toast — UNSTABLE_-prefix på ToastRegion/ToastQueue/Toast/ToastContent; 'toasts should have a minimum timeout of 5 seconds'; 'Only auto-dismiss toasts when the information is not critical'. (Domän-flytten är redan registrerad som T88.)
- **Två specade meddelande-ytor är aldrig byggda: SyncIndicator (§10 stale-data) och systemhälso-indikatorn (§12).**
  BEVIS: DESIGN-SYSTEM-SPEC.md:859–881 (§10 SyncIndicator + tokens) och :905–928 (§12); `grep -rn "SyncIndicator|Senast uppdaterat" src/` → noll träffar.
- **MessageBox är den enda nyare primitiven UTAN egen spec-sektion — NavCard, Skeleton, ToggleButtonGroup, SlideToConfirm och Button har alla en.**
  BEVIS: docs/specs/DESIGN-SYSTEM-SPEC.md rubriker: §14 NavCard, §15 Skeleton, §16 ToggleButtonGroup, §18 SlideToConfirm, §19 Button; ingen § för MessageBox/toast/banner. §11 täcker endast error-boundary-texterna.

## LUCKOR
- HITTADE INTE varför fel-fallbacken syns OVANFÖR appinnehåll i båda bilderna. AppErrorBoundary renderar antingen fallback ELLER children (AppError.tsx:39–68), och den monteras som yttersta lager i main.tsx:98–110 — ingen kodväg staplar dem. Jag letade i: main.tsx, index.html, __root.tsx, routes/dev/prototyper.tsx, routes/_authenticated/dev-fel.tsx, samt `grep -rn AppErrorBoundary src/ tests/`. Trolig förklaring är att Marcus beskurit två överlappande fönster/flikar i samma macOS-utsnitt (bilderna är crops, 144 dpi, ej helskärm) — men det är en hypotes, inte verifierat.
- Jag har inte kört appen (dev-server avsiktligt ej startad — nio agenter delar arbetsmappen), så jag har inte sett MessageBox renderad live. Formbedömningen bygger på klasser + tokens + beräknade kontraster, inte på pixlar.
- Carbon Design Systems notification-taxonomi (inline/toast/actionable) gick inte att hämta — WebFetch returnerade trunkerat innehåll från carbondesignsystem.com/components/notification/usage/. Underlaget vilar därför på React Aria, GOV.UK, USWDS, Polaris, Material 3, FK och Sara Soueidan.
- Jag har inte verifierat aktuell fas-status i docs/byggplan.md §2 — så jag uttalar mig inte om var i fasplanen ett meddelande-arbete skulle infogas.
- Jag har inte hittat någon befintlig tråd eller något kort som äger systemmeddelande-designen. Närmast är T77 (Notis-centret) som handlar om notiser till Lotta, inte om meddelande-primitivernas form. Sökt i tasks/threads/README.md (T01–T91) på toast/systemmeddelande/meddelande-primitiv/MessageBox → noll träffar.

## REKOMMENDATION
Behandla detta som ett SYSTEM, inte som en trasig felruta. Konkret förslag i fyra delar.

TAXONOMIN (fem lager, gränserna hämtade från GOV.UK + USWDS + Polaris):
1. SYSTEMBANNER — persistent, hela appen, en åt gången, alltid monterad live region. Offline, degraderad tjänst, stale data. Bygg genom att generalisera befintliga OfflineIndicator (som redan har rätt live-region-mönster) och absorbera §10:s SyncIndicator dit. USWDS site alert-klassen.
2. SIDBANNER / INLINE-MEDDELANDE — persistent, kontextbundet: MessageBox behålls (FK-arvet, namnet är rätt) men får (a) ikon-slot per intent, (b) `emphasis`-dimension enligt §19:s redan etablerade tvådimensionella grammatik (solid = sidnivå, outline/subtle = inuti kort — idag bryter MessageBox mot §19 genom att alltid ha samma vikt), (c) FK:s short-layout för rubrikslösa korta meddelanden, (d) sr-only typkontext ("Felmeddelande"/"Informationsmeddelande"), (e) app-koherent radie och dämpad kant.
3. TRANSIENT BEKRÄFTELSE (toast) — ENDAST icke-kritiska kvitton (sparat, skickat, kopierat). Detta är det saknade lagret som gör att seende användare idag inte får någon bekräftelse alls medan skärmläsare får 17 olika. Regler: ≥5 s, paus vid hover/fokus, max 3 i stapel, ALDRIG fel, aldrig enda bäraren av information (Material 3 + RAC).
4. FÄLTFEL — FieldError finns redan i Input/TextArea/Select. Rör inte. GOV.UK-regeln gäller: banner får aldrig ersätta fältvalidering, och banner + felsammanfattning visas aldrig samtidigt.
5. BLOCKERANDE BESLUT — Dialog/Modal finns. Regeln: kräver meddelandet en handling NU, är det alertdialog med fokusflytt — aldrig en toast med knapp i (Soueidans hårdaste regel).
Plus en sjätte, idag helt ospecad: TOMTILLSTÅND. Minst 9 ställen kör ad hoc `<p class="text-small text-text-muted">Inga …</p>`. En EmptyState-primitiv hör hemma i samma pass.

TOKENS SOM MÅSTE TILLKOMMA:
- Trio per intent i stället för dagens par: `--mm-<intent>-bg` (finns), `--mm-<intent>-border` (NY, dämpad ≥3:1 — idag är kanten textfärgen, vilket ger det "hårda" utseendet), `--mm-<intent>` (text, finns) + `--mm-<intent>-icon`.
- Ersätt de tre inlånade Tailwind-50-tonerna med Miranon-egna tinter härledda ur den varma paletten. Det är den enskilt största orsaken till att rutorna inte "känns som appen".
- `--mm-messagebox-radius` som möter kort-språket (16 px), `--mm-toast-*`, `--mm-banner-*`.

A11Y-KONTRAKTET (11-ribban, icke förhandlingsbart):
- Exakt två globala live-regioner: polite (befintliga alertScreenReader) + assertive. Toast-regionen är ett landmark med aria-label, F6-nåbart.
- error/warning → role="alert"; info/success → role="status" (behåll dagens regel, den matchar Polaris).
- Färg aldrig ensam bärare: ikon + rubrik/typord + sr-only typkontext. Gör `title` obligatorisk ELLER inför short-varianten med tvingande typord.
- Toast auto-dismiss aldrig för fel; timer pausas vid hover/fokus; prefers-reduced-motion → ingen in/ut-animation; prefers-contrast: more → 2px kant.
- Live-regionen monteras FÖRE innehållet, inte tillsammans med det.

RIBBA: MessageBox, Toast, SystemBanner, EmptyState = bibliotek → 11/11/11. AppError/SectionError = app-shell-vyer → 11/10/10, men tillgänglighet alltid 11. AppError behåller sin beroende-snålhet men får en liten självbärande CSS-fil (kritisk inline-CSS-mönstret) så den överlever ett trasigt designsystem OCH ser ut som appen — det löser den motsättning skärmbilden avslöjar utan att offra robustheten.

## ARBETSFORM
Prototyp-pass (UI-grenen, T66 tvåfas) FÖRST → sedan spec-utvidgning (ny §20 i DESIGN-SYSTEM-SPEC) → sedan PRD + skivor. Motivering: frågan Marcus ställer är visuell ("passar appens stil", "branschledarmässigt"), och den kan bara besvaras genom att se formerna bredvid varandra. Divergens-passet lägger sig väl på befintlig /dev/prototyper-yta: tre radikalt olika meddelande-grammatiker (t.ex. A = dämpad tonal yta utan kant à la FK · B = vänsterkant-accent enligt §11:s ursprungliga idé · C = kort-formad ruta med ikon-medaljong i app-språket), var och en visad i alla fyra intents × tre former (systembanner / inline / toast). Marcus väljer EN → konvergens till facit → facit blir §20 → §20 blir PRD-kort med skivor. ADR-baren: en ren omstyling av MessageBox ligger UNDER baren (spec-§ + kort-rationale räcker). Införs toast-lagret ligger beslutet ÖVER baren — (1) svårt att återställa i koherens (~48 call-sites plus en ny global region), (2) överraskande utan kontext (varför inte toast överallt, när Instant-regeln ADR-078 pekar mot persistent bekräftelse?), (3) verklig avvägning (RAC-beta vs egen primitiv; toast vs inline). Den ADR:n mintas i så fall i samma landning som taxonomin låses.

## OMFATTNING
Prototyp-passet: en session (divergens ~2 h, konvergens beror helt på Marcus iterationstakt — S86:s markera-läge tog 4 steg). Spec-§20: 2–3 timmar när facit är låst. Bygget: 3–5 skivor, uppskattningsvis 2 sessioner — tokens-skivan (isolerad, rör bara CSS + demo-route), MessageBox-utvidgningen (isolerad primitiv + tester), toast-/systembanner-skivan (ny primitiv + global region + a11y-tester), call-site-migrationen (27 filer, mekanisk men bred), samt visual-baseline-refresh. Den breda call-site-migrationen är den enda posten som verkligen kostar, och den är också den enda som krockar med parallella spår — se ror_vid.

## BEROENDEN
- BEROR PÅ: DESIGN-SYSTEM-SPEC §19 (intent × emphasis) — den tvådimensionella grammatiken är redan låst för Button och meddelande-taxonomin måste ärva den, inte uppfinna en parallell.
- BEROR PÅ: T87 (visual-grindens aktivering, parkerad på Marcus-beslut A) — 24 baselines i 6 spec-filer driftar avsiktligt när MessageBox byter form; refresh måste ingå i samma landning.
- BEROR PÅ (research): React Arias Toast är fortfarande UNSTABLE_ — beslut krävs om vi tar beta-beroendet (linjen i ADR-044 är react-aria-components som bas) eller bygger egen primitiv på alertScreenReader-grunden.
- BLOCKERAR/överlappar: T77 (Notis-centret, ringklockan på Hem) — notiser och systemmeddelanden är samma röst; bygger vi meddelande-taxonomin utan att läsa T77 riskerar notis-centret att få en egen konkurrerande form. T77 är paused med hård guard 'byggs ALDRIG som död ikon'.
- ÖVERLAPPAR: T90 (laddupplevelsen + INSTANT-regeln, ADR-078) och DESIGN-SYSTEM-SPEC §15 Lugnt laddläge — skeleton, stale-indikator och meddelanden är tre uttryck för samma systemröst. §10 SyncIndicator (specad, obyggd) hör hemma i systembanner-lagret.
- ÖVERLAPPAR: task-48 (markera-läget i Anmälda deltagare) — dess låsta byggkrav 3 inför en batch-bar med sr-only aria-live-count. Samma live-region-budget, samma yta.
- LÖSER SAMTIDIGT: dokumentations-driften §11 vs kod (fel-lagrens rubrik + sektions-felets form) och ACCESSIBILITY-CHECKLIST rad 127:s toast-rad som idag beskriver något som inte finns.

## RÖR VID
- src/components/primitives/MessageBox.tsx (+ index.ts) — DELAD PRIMITIV, högsta krockrisk
- src/components/primitives/Toast.tsx + SystemBanner.tsx + EmptyState.tsx (nya)
- src/styles/tokens/semantic.css (rad 47–55 Feedback-blocket) — DELAD FIL
- src/styles/tokens/components.css (rad 118–130 messagebox-blocket + nya toast/banner-tokens) — DELAD FIL
- src/styles/tailwind.css (@theme-mappning av nya färgtokens) — DELAD FIL
- src/components/ErrorBoundary/AppError.tsx + SectionError.tsx (+ ev. ny AppError.css)
- src/components/AppShell/OfflineIndicator.tsx (generaliseras till SystemBanner)
- src/lib/alert-screen-reader.ts (live-region-budgeten: polite + assertive)
- 27 call-site-filer om migrationen görs i samma pass — inkl. persons/PersonsList.tsx, persons/PersonDetail.tsx, persons/PersonNoteEditor.tsx (KROCK med Personer/persondetalj-spåret) och events/EventAttendance.tsx, events/detail/Narvaro.tsx, events/detail/Deltagare.tsx (KROCK med Check-in-spåret)
- docs/specs/DESIGN-SYSTEM-SPEC.md (ny §20 + revidering av §10/§11 + ändringsloggen) — DELAD GOVERNING-FIL
- docs/specs/ACCESSIBILITY-CHECKLIST.md (rad 122–135 Statushantering/Felsidor)
- src/routes/dev/primitives.tsx (demo-sektion per primitiv-konventionen)
- tests/a11y/primitives.spec.ts (rad 39–40 MessageBox-sektionen) + nya a11y-fall
- tests/visual/__screenshots__/ — 24 baseline-PNG i 6 spec-filer, inkl. personer.spec.ts och event-anmalda.spec.ts

## MARCUS-BESLUT
- TOAST ELLER INTE — ska appen få ett transient bekräftelselager alls, eller ska ALL feedback vara persistent (inline/banner)? Argument för toast: seende användare får idag noll bekräftelse där skärmläsare får 17. Argument emot: Instant-regeln (ADR-078) + Gunilla-principen talar för att ett kvitto ska stå kvar tills hon sett det, och toast som försvinner är den vanligaste a11y-fällan. A: inför toast · B: ingen toast, bygg i stället en persistent bekräftelse-yta per vy · C: toast bara för de tre mest triviala kvittona (kopierat/sparat/skickat).
- OM TOAST — React Arias UNSTABLE_ToastRegion (beta, följer ADR-044-linjen, ger F6-landmark och timeout-paus gratis) eller egen primitiv byggd på befintliga alertScreenReader-mönstret (noll beta-beroende, mer eget a11y-ansvar)?
- MESSAGEBOX FORM — ska rutan flyttas till app-språket (16 px radie, dämpad kant, ikon, Miranon-egna tinter) eller behålla dagens hårda 4 px-ram? Alternativ A river 24 visuella baselines och rör 27 filer; alternativ B lämnar den visuella främlingen kvar. Detta är den fråga skärmbilderna egentligen ställer.
- §11-DRIFTEN — rättas SPECEN till kodens form (röd ram, MessageBox) eller KODEN till specens form (vänsterkant, warning-ton)? Och ska fel-lagrens rubrik 'Något gick fel' skrivas om, vilket båda governing-dokumenten kräver? Vad ersätter den — kontextspecifik rubrik per fel-klass?
- APPERROR-PARADOXEN — ska app-fallbacken behålla sin totala beroende-snålhet (och därmed alltid se ostylad ut) eller få en liten självbärande CSS-fil så den både överlever ett trasigt designsystem OCH ser ut som appen? A: behåll som är · B: självbärande kritisk CSS · C: token-baserad som resten (ger snyggast resultat men tappar robustheten mot stylesheet-fel).
- ORDNINGSFÖLJD MOT PARALLELLA SPÅR — meddelande-arbetet rör MessageBox (27 filer inkl. Personer och Check-in-ytorna) plus tre delade token-filer. A: kör tokens+primitiv-skivan FÖRST och isolerat, och låt varje vy migrera sina call-sites i sitt eget spår · B: sekvensera hela arbetet EFTER att Check-in/Personer landat · C: kör allt nu och acceptera merge-konflikter + baseline-drift.
- SCOPE — ska tomtillstånds-primitiven (EmptyState, minst 9 ad hoc-ställen) och de två obyggda spec-ytorna (§10 SyncIndicator, §12 systemhälsa) ingå i samma pass, eller hållas isär?
