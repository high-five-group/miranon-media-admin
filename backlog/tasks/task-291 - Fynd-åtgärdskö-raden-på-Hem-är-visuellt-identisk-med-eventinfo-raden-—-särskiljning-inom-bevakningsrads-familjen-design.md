---
id: TASK-291
title: >-
  Fynd: åtgärdskö-raden på Hem är visuellt identisk med eventinfo-raden —
  särskiljning inom bevakningsrads-familjen (design)
status: To Do
assignee: []
created_date: '2026-08-22 10:54'
updated_date: '2026-08-22 23:24'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 533000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA-fynd 284.5 (Marcus, 2026-08-22, staging): raden '12 anmälningar kunde inte kopplas till rätt event' bär NOLL visuell särskiljning mot eventinfo-raden — samma tokens (--mm-navcard-*), samma chevron, ingen ikon (src/components/hem/Bevakningsrad.tsx:232-248 mot :191). Två radtyper med olika betydelse (eventinfo = 'det finns info att skicka'; åtgärdskö = 'något är fel, lös det') ser identiska ut. PLACERINGEN bland bevakningsraderna är LÅST (ADR-122 beslut 7, 284.4 AC #1/#2) och rörs inte. GRÄNS: notisfamiljens varningsfärg/ikon är FEL verktyg — ADR-122 beslut 8 + DESIGN-SYSTEM-SPEC §22 drar familjegränsen arbetsobjekt (tillståndsbundet) kontra notis (händelsebundet); särskiljningen ska leva INOM bevakningsrads-familjen, t.ex. en ledande 'kräver åtgärd'-ikon. Golv: 284.4 AC #5 — aldrig betydelse enbart genom färg. Form: litet divergenspass (2–3 varianter av raden på /dev/hem), Marcus väljer. BLOCKERAR 284.4 DoD #6 (facit-amenderingen av hem-facit) — facit stämplas inte förrän formen är vald. Registrerat per 284.5 AC #2 (nytt kort, ej retuschering).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 2–3 varianter av åtgärdskö-raden växlingsbara på /dev/hem, var och en inom bevakningsrads-familjens tokens — ingen lånar notistrappans varningsfärg/ikon
- [ ] #2 Marcus väljer EN variant i visuell granskning (desktop + mobil); valet citeras daterat på kortet
- [ ] #3 Vald form promoverad till Bevakningsrad.tsx; raden bär aldrig betydelse enbart genom färg (axe 0, 284.4 AC #5 håller)
- [ ] #4 Hem-facit (tasks/sessions/bilagor/s102-hem-konvergens/facit.json) amenderas FÖRST därefter, i egen commit med Marcus citat — det stänger 284.4 DoD #6
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
MARCUS VAL 2026-08-22 — variant A, med en amendering.

Verbatim: "jag tittade på åtgärdsraden/knappen och jag tycker A är bäst, men ikonen bakgrundsfärg kanske skulle vara knappens bakgrundsfärg istället? Så särskiljningen blir kraftigare?"

VALD FORM: variant A (ledande ikon, Link2Off) — men INTE med radens kortyta färgad. Hans egen förstärkningsidé prövades mot ADR-122 beslut 8 och avvisades där: en färgad kortyta ÄR notisfamiljens grepp, och familjegränsen går just vid att bevakningsraden är ett arbetsobjekt (tillståndsbundet) medan notisen är händelsebunden. Färgas hela raden lånas den signalen tillbaka.

ERSÄTTNINGEN, som Marcus ställde sig bakom ("Jag står vid dina rekommendationer på alla punkter"): behåll raden neutral och ge IKONEN en fylld cirkel-behållare i stället för att tona hela ytan. Märket blir starkare, raden förblir arbetsobjekt, och icke-färg-kanalen (ikonformen) står orörd så TASK-284.4 AC #5 håller.

AC #2 EJ AVBOCKAD — kriteriet kräver val i visuell granskning på BÅDE desktop och mobil. Marcus rapporterade att han tittat, men inte att båda vyportarna prövats, och den vald-med-amendering-formen finns ännu inte byggd att titta på. Bocka AC #2 när den fyllda cirkel-formen är byggd och sedd i båda vyportarna — valet ovan är citerat och står, men granskningen är inte belagd.

BEROENDE ATT NOTERA: TASK-303 (bevakningsradens höjdlås — anatomi i stället för radbrytning) föddes ur samma granskning och rör SAMMA rader. Promoveringen i AC #3 och facit-amenderingen i AC #4 bör sekvenseras mot 303, så hem-facit inte stämplas två gånger på två veckor.

BYGGT 2026-08-23 (orkestrerarens byggpass, kombinerat med TASK-303 på uttrycklig Marcus-order mitt i arbetet — "du bygger en prototyp som vi kan promovera till skarpa bevakningrad.tsx nu va? För det tar vi tag i direkt, problemet med höjd och radbrytning").

VARIANT A AMENDERAD: ikonen (Link2Off) bär nu en fylld cirkel-behållare via nya tokens --mm-atgardsko-markor-bg/-text (src/styles/tokens/components.css, alias mot --mm-btn-primary-bg/-text — "knappens bakgrundsfärg" som Marcus bad om). Mätt (WCAG-formeln, node): markör-bg mot --mm-navcard-bg 13,38:1; markör-text mot markör-bg 14,60:1. Ersatta tokens (--mm-primary-tint/--mm-primary) mätte 1,01:1 respektive 2,33:1 — under 1.4.11-golvet på båda leden.

<LI>-REGRESSIONEN FIXAD: routens variant-läge renderar nu EventinfoRadAnatomi (eget <li>) + variantens rad (eget <li>) i EN delad <ul aria-label="Bevakningar">, matchande skarpa vyns struktur. Live-mätt (Playwright): parentElement.tagName === "LI", li.parentElement.tagName === "UL" i alla tre varianter, före fixen var det "SECTION" rakt av.

VARIANT C FIXAD: cirkeln bär nu samma markör-tokens (var --mm-navcard-bg på --mm-navcard-bg, dvs 1,01:1 — praktiskt osynlig; nu 13,38:1).

TASK-303-ARBETET (kombinerat i samma commit/PR): ny delad radanatomi (RadInnehall, tvåradigt CSS-grid — badge/chevron bor ENDAST på rubrikradens grid-rad, undertexten spänner hela bredden på rad 2) för BÅDA radtyperna. Talet flyttat till en reserverad badge (RadBadge). Live-mätt höjdlås (Playwright, negativkontroll bekräftad): 70px, KONSTANT vid 375/390/768/1280px, vid 1/2/3-siffriga tal, och vid PR #1388s 91-teckens värsta-fall-eventnamn (som förväntat/accepterat truncerar RUBRIKEN, men höjden rör sig ALDRIG). Negativkontroll: en medvetet förlängd undertext ger overflow=true, återställd ger false — mätmetoden fäller när den ska.

STRÄNG-DIVERGENS (TASK-303 AC #5, EJ formellt avgjord här): prototypen använder nu skarpa appens fulla sträng "Nya deltagare saknar eventinfo" (versal N — rättad efter orkestrerarens observation att extraktionen av talet gjorde gemena "nya" till ett avhugget fragment). AC #5 kräver fortfarande ett separat, citerat Marcus-beslut innan de två ytorna (hem-derivations.ts vs dev/hem-prototyp/data.ts) räknas som synkade.

VERIFIERAT: axe 0 violations i alla 4 lägen (skarpa vyn, variant a/b/c) x 2 vyportar (375/1280px), sanity-kontrollerat med negativkontroll (alt-lös bild gav image-alt-fynd, korrekt fångat). prefers-contrast:more, prefers-reduced-motion:reduce, print — alla tre live-emulerade via Playwright emulateMedia, höjdlåset opåverkat i alla lägen.

Bevakningsrad.tsx: 0 rader i diffen, oförändrad. AC #2 fortsatt EJ avbockad — Marcus egen visuella granskning (desktop + mobil) av den nu byggda, förstärkta formen återstår.
<!-- SECTION:NOTES:END -->
