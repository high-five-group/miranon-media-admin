---
id: TASK-411
title: >-
  Fynd: inkorgens markerade kort ska bära hela gröna plattan som
  bekräftelsesteget och eventdetaljer — success-notisen i kortet får vit
  bakgrund, grön kontur och grön ikon
status: Done
assignee: []
created_date: '2026-09-06 09:25'
updated_date: '2026-09-07 15:53'
labels:
  - ready-for-agent
dependencies: []
ordinal: 713000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-granskning 2026-09-06 (S121 resume 4, QA-vandringen TASK-402.7 påbörjad i prod): markeringen på inkorgens kort är inte samma gröna som på bekräftelsesteget; bekräftelsesteget har rätt grön, och rätt är samma som eventdetaljer. Mätt: inkorgen bär --mm-betalningskort-markerad-bg = color-mix(--mm-success-bg 50 %, --mm-surface) ≈ #f8fefa (src/styles/tokens/components.css:313) medan bekräftelsesteget (VariantC.tsx:180–186) och eventdetaljernas MarkerbartKort (src/components/events/detail/Deltagare.tsx:1053–1055) bär hela --mm-success-bg = #f0fdf4; kanten --mm-success = #606b57 är identisk i alla tre. Utspädningen är Marcus dom 2026-09-01 (kommentarblocket components.css:289–312): success-notisen i det öppna kortet (MessageBox intent success, --mm-messagebox-success-bg = --mm-success-bg, samma hex) blev osynlig mot ett markerat kort i samma gröna. Marcus beslut 2026-09-06 som löser spänningen: kortet får hela plattan, och success-notisen i kortet får VIT bakgrund (--mm-surface), behåller den gröna konturen (--mm-messagebox-success-border = --mm-success, plus konsumentens border-y border-r) och ikonen i samma gröna som konturen (--mm-messagebox-success-text = --mm-success, redan så — verifiera). SCOPE: ändra INTE MessageBox-primitiven eller de globala messagebox-tokens (~30 konsumenter, ADR-103 B2-låst form) — den vita bakgrunden sätts hos konsumenten i src/components/betalningar/RegistreraForm.tsx (rad ~759–787, samma ställe som border-y border-r), och bara för success-utfallet om inte Marcus säger annat. Kortets platta: sätt --mm-betalningskort-markerad-bg till var(--mm-success-bg) (eller riv tokenen till förmån för --mm-success-bg) och skriv om kommentarblocket i components.css så att 2026-09-01-beslutet och dess upphävande 2026-09-06 båda står kvar — aldrig tyst rivning. RegistreraForm är det delade formuläret, så notisens vita bakgrund följer med in i bekräftelsestegets öppna kort — bokför om någon facit-bild i s121-bekraftelsesteget-konvergens visar notisen (AMENDERING per ADR-102), annars notera att ingen gör det. Inkorgen har inget facit-lås. Kontrast räknas om (WCAG 1.4.11: #606b57 mot vitt och mot #f0fdf4, båda ≥ 3:1 — bokför talen) och contrast-more-läget kontrolleras.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Inkorgens markerade kort bär samma bakgrund som bekräftelsestegets och eventdetaljernas markerade kort (mätt token/hex bokfört i kortet); kanten oförändrad
- [x] #2 Success-notisen i det öppna kortet har vit bakgrund, grön kontur runt om och grön ikon; kontrasttalen mot vitt bokförda; övriga MessageBox-konsumenter oförändrade (primitiven och de globala tokens orörda)
- [x] #3 Kommentarblocket för --mm-betalningskort-markerad-bg i components.css beskriver både 2026-09-01-beslutet och Marcus omprövning 2026-09-06 med skälet
- [x] #4 Befintliga acceptans-/visual-tester gröna; ett test eller en bild täcker notisen i ett markerat kort; eventuell facit-bild för bekräftelsesteget som visar notisen amenderad, annars bokfört att ingen gör det
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Divergens mot uppdraget (ADR-086, verifierad mot disk 2026-09-06): uppdraget påstod 'Ikonens färg är redan --mm-success — verifiera'. FALSKT: Ikon (CircleCheck) i RegistreraForm.tsx rad ~790 hade INGEN egen färgklass och ärvde MessageBox-containerns --mm-messagebox-body-text (= --mm-text, neutral mörk, INTE grön). Åtgärdat: Ikon får text-(color:--mm-messagebox-success-text) villkorat på intent==='success'. Kontraster omräknade med script (WCAG-formel, sRGB relativ luminans): #606b57 mot #ffffff (notisens nya botten) = 5,62:1; #606b57 mot #f0fdf4 (kortets platta, oförändrad hex sedan 2026-09-01) = 5,37:1. Båda ≥ 3:1-golvet (WCAG 1.4.11). contrast-more kontrollerad: MessageBox-primitivens contrast-more:border (full intent-färg) är oförändrad av mina ändringar — ingen ny contrast-more-gren behövdes. Facit-bild-kontroll (ADR-102): tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/ har FEM kanoniska facit-bilder (facit-bekraftelsesteget{,-pagar,-efter,-efter-skicka,-angra}.png; k02-k19 är enligt manifestets EGEN text 'mellanled, inte facit'). Visuellt verifierat facit-bekraftelsesteget-efter.png: Gunnar Falks felrad visar en RÖD textrad ('Beloppet kunde inte sparas. Försök igen.'), INGEN MessageBox/notisruta. Ingen av de fem facit-bilderna visar ett öppet formulär med utfallsrutan synlig (manifestets egen beskrivning bekräftar: utgångsläge/pågår/efter/efter-skicka/ångra-dialog — ingen 'öppen rad'-vy). SLUTSATS: ingen AMENDERING behövs, bokfört att ingen facit-bild visar notisen. Implementation: --mm-betalningskort-markerad-bg pekar nu på var(--mm-success-bg) (var color-mix 50%). RegistreraForm.tsx: MessageBox className och Ikon className är villkorade på intent==='success' (bg-(--mm-surface) resp. text-(color:--mm-messagebox-success-text)); warning/info-boxar oförändrade. Kommentarblock uppdaterade i components.css (BESLUT 1/BESLUT 2) och i BetalningsInkorg.tsx (två ställen som refererade den gamla 'svagare tint'-motiveringen). Nytt test: tests/e2e/betalningar-inkorg-markerat-kort-notis.staging.test.ts (mäter computed background-color/border-color på kortet och notisen samt ikonens color).

FINAL SUMMARY (S121 resume 4, 2026-09-06): byggd AFK av bygg-agent (Sonnet 5) i egen worktree, staplad på TASK-410. Granskning runda 1: warning/ask-user (vit notis läckte till tre ytor utan grönt kort) → Marcus: 'Ja, begränsa till inkorgen.' → runda 2: error/ask-user (bekräftelsestegets gröna kort, fjärde konsumenten, tappade den vita notisen) → Marcus: 'Din rek' = vit notis i alla gröna markerade kort, grön standard på de tre ytorna utan kort → runda 3 (över taket på Marcus beslut): risk låg, 0 blockerande, konvergerad. Sidofynd rättat på vägen: ikonen i notisen ärvde neutral färg (bugg), nu grön överallt. Marcus godkännande på granskningsservern 2026-09-06 verbatim: 'Betalnings/inkorgs-sidan är bra nu.' Landad via merge-kön PR #2380 → main 93c3209a (2026-09-06 13:25 UTC). Post-merge CI på 93c3209a: run 34036044225, conclusion success (läst 2026-09-06 via gh run list). DoD #2/#3 håller enligt PR-kroppen och granskningarna; DoD #1 = alla AC bockade.

TASK-425: DoD bockad mot belägg — samtliga AC #1-#4 redan avbockade. Final Summary dokumenterar landning via PR #2380 → main 93c3209a (2026-09-06 13:25 UTC); post-merge CI run 34036044225 conclusion success; verbatim i kortet: 'DoD #2/#3 håller enligt PR-kroppen och granskningarna; DoD #1 = alla AC bockade'.
<!-- SECTION:NOTES:END -->
