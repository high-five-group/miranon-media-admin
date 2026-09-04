---
id: TASK-393
title: >-
  Fynd: inkorgens Förhandsgranska-knapp byter text till "Förhandsgranska alla N"
  vid flera kvitton. Alltid "Förhandsgranska" med upphöjd räknare i chip med
  reserverad plats (filterknappens form)
status: To Do
assignee: []
created_date: '2026-09-04 10:52'
updated_date: '2026-09-04 13:11'
labels:
  - ready-for-agent
dependencies: []
ordinal: 687000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (Marcus 2026-09-04, S121 sessionsstart, verbatim i sessionsdoket): "när jag reggar fler än 1 betalning så ändrar förhandsgranska-knappen till Förhandsgranska alla 2, jag vill att den alltid ska vara Förhandsgranska X. X:et ska vara en dynamisk siffra på ett chip som det är reserverad plats för. Siffran i chippet ska vara upphöjd, vi har redan en form för det på exempelvis filterknappen."

FORENSIK (disk 2026-09-04, origin/main 90cc3ac1, som inkluderar #2264):
- Etiketten: src/components/betalningar/BetalningsInkorg.tsx rad 1191 (enSamKo = vantande.length === 1), rad 2035 till 2047 (ensam kandidat, texten "Förhandsgranska"), rad 2083 till 2096 (N >= 2, texten "Förhandsgranska alla" + vantande.length på rad 2092, aria-label rad 2089, loadingText rad 2088). Laddnyckel FORHANDSGRANSKA_ALLA_NYCKEL rad 322.
- Chip-formen som ska återanvändas: src/components/primitives/FilterRad.tsx rad 251 till 275. Badgen är en absolut placerad span (-top-1 -right-1, rounded-full, bg-accent, text-[10px]) med aria-hidden; det tillgängliga namnet bärs av en sr-only-span. Ingen Badge- eller Chip-primitiv finns i src/components/primitives, och inga badge-tokens i src/styles/tokens/components.css. Docblocken rad 260 till 264 bokför text-[10px] som öppen avvikelse från typografiskalan och säger att ett badge-skalsteg mintas först vid en andra konsument. Förhandsgranska-knappen ÄR den andra konsumenten.
- Tester som asserterar den gamla texten: tests/e2e/betalningar-inkorg-forhandsgranska-alla.staging.test.ts rad 267, 269, 315 ("Förhandsgranska alla 3"; N = 1 ger ingen alla-knapp, rad 286 till 297); tests/api/kvitto-forhandsgranskning.test.ts rad 305, 428, 443, 471; tests/api/betalningar-inkorg-statusyta-form.test.ts rad 159 (radbrytning mobilbredd). #2264 (TASK-370.3) lade även till tests/api/preview-receipt-forhandsgranska-alla.staging.test.ts; grep alla tester efter "Förhandsgranska alla" innan bygget.

AVGRÄNSNING: bara etiketten och chippet. Beteendet bakom knappen är orört: N = 1 förhandsgranskar det enskilda kvittot som i dag, N >= 2 kombinerar till ett dokument med försättsblad (TASK-370.1, tak 30). Ordet "alla" försvinner ur både synlig text och aria-label.

DESIGN: bryt ut chippet till en delad primitiv i src/components/primitives (namn i husets språk, t.ex. RaknarChip) som FilterRad och Förhandsgranska-knappen båda konsumerar. Reserverad plats betyder att knappens bredd inte hoppar när N går från en till två siffror; tvåsiffrigt N (upp till 30) ska rymmas. Inga hårdkodade färger; om text-[10px] blir ett skalsteg bokförs det i tokens och FilterRads avvikelse-not stängs, annars står noten kvar med hänvisning till detta kort. prefers-contrast: more och prefers-reduced-motion respekteras. Facit: inkorgen har ingen egen stämplad facit-bilaga enligt 346.6 AC #1 (endast AMENDERING i s64-mer-konvergens för Mer-listan); verifiera med grep i tasks/sessions/bilagor och bokför utfallet i notes. Källor: S121 sessionsdok Del 1 · TASK-370.4 (knappen) · TASK-346.6 (inkorgen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Knappen lyder "Förhandsgranska" för alla N >= 1, med N som siffra i ett upphöjt chip i filterknappens form; ordet "alla" förekommer varken i synlig text eller aria-label; loadingText oförändrad.
- [x] #2 Chippet är en delad primitiv i src/components/primitives som både FilterRad och Förhandsgranska-knappen konsumerar; FilterRads inline-badge är ersatt utan visuell regression (bilder före och efter i PR-kroppen).
- [x] #3 Reserverad plats: knappens bredd är identisk vid N = 1, N = 9 och N = 12, mätt i browsern och bokförd i PR-kroppen; tvåsiffrigt N ryms.
- [x] #4 Tillgängligt namn bär antalet i klartext (t.ex. "Förhandsgranska 2 kvitton", singular vid 1); chippets siffra är aria-hidden; axe 0 överträdelser på inkorgen.
- [x] #5 Alla tester som asserterar "Förhandsgranska alla N" är uppdaterade (e2e-stagingtestet inklusive N = 1-fallet, kvitto-forhandsgranskning.test.ts, betalningar-inkorg-statusyta-form.test.ts, preview-receipt-forhandsgranska-alla.staging.test.ts om berörd); rörda sviter gröna, test:api grön.
- [x] #6 Skärmdumpar desktop och iPad 820 px i PR-kroppen med N = 1, 2 och 12; prefers-contrast: more verifierad för chippet.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Facit-grep (verifierat 2026-09-04, ADR-086-pass): grep -rn 'BetalningsInkorg|betalningsinkorg' tasks/sessions/bilagor/ ger endast AMENDERING-sidofiler (s102-hem-konvergens, s64-mer-konvergens, s103-persondetalj-konvergens, s93-atgardssida-promovering) — ingen egen stämplad facit-bilaga för inkorgen. TASK-346.6 AC #1 bekräftar: bara en AMENDERING-sidofil i s64-mer-konvergens (Mer-listans rad), inga andra ytor i manifestet. Kortets premiss BEKRÄFTAD, ej falsifierad.

FilterRad-flytt (RaknarChip, ADR-126 B4 flytt-utan-ombyggnad): mekaniskt bevisad byte-identisk klass-mängd via runtime-cn() (node-skript, sorterad diff = tom). Facit-grind: tests/visual/anmalningssidan-promoverings-grind.spec.ts 10/10 gröna (visual-desktop), inklusive ariaSnapshot-testerna OCH axe-testet med filterpanelen öppen/dimension aktiv (exakt scenariot som visar badgen) — 0 violations, ingen regression.

REVIEW RUNDA 2 (2026-09-04, PR #2320): tre fynd åtgärdade.

FYND 1 (warning, blockerar) — skärmdumparna: sessionens scratchpad-ID matchade fortfarande disk (samma agent-session), så bilderna fanns kvar. Kopierade (inte regenererade) till tasks/sessions/bilagor/s121-forhandsgranska-chip/ (8 filer: N1/N9/N12 desktop+ipad820, contrast-more.png, filterrad-badge.png), committade path-scopat, prosa-beskrivning per bild i PR-kroppen.

FYND 2 (warning, blockerar) — test:api kördes om fristående (naken exitkod): 2190/2191 gröna, 1 röd (exit 1). Den röda skiljer sig från round 1:s rapporterade par (send-registration-confirmation.staging.test.ts var denna gång HELT grön) — nu bara generate-event-attachment.staging.test.ts, ett ANNAT test i samma fil (AC #2 hash-mismatch mot skarp staging, Källhash stämmer inte mot bekräftelsens kallhash). git grep -n BetalningsInkorg|FilterRad|RaknarChip mot filen gav 0 träffar — obesläktad med diffen. Klassat öppet i PR-kroppen som staging-datatransient, inte en regression.

FYND 3 (info) — negativ kontroll för AC #4:s axe-test: PRÖVAD, uppdragets premiss (TASK-362:s redan negativ-kontrollerade axe-test i systerfilen) FALSIFIERAD — betalningar-inkorg-utskicksflode.staging.test.ts rad 424-457 har INGEN negativ-kontroll-motpart till sitt axe-test (grep negativ i den filen: 0 träffar). Den faktiska TASK-362-negativkontrollen (commit d6d7f5f9) sitter på en annan grind (tests/api/betalningar-inkorg-statusyta-form.test.ts's treOberoendeGrenar). Byggde i stället en EGEN negativ kontroll i betalningar-inkorg-forhandsgranska-alla.staging.test.ts: injicerar en verklig button-name-överträdelse (aria-label + textContent borttaget från alla-knappen) i den levande DOM:en innan axe-scanningen, bevisar att scopet FÄLLER (violations.length > 0, innehåller button-name). 9/9 gröna i den rörda filen inklusive det nya testet.

Grindar körda i denna worktree (detached HEAD på PR-huvudet, 54055c46 — grenen var redan uppcheckad i en syskon-worktree): npm run typecheck exit 0, npx biome check . exit 0 (0 fel, samma 14 pre-existing warnings/82 infos som round 1, inga i rörda filer), npm run build exit 0, npm run test:api exit 1 (2190/2191, se ovan), tests/e2e/betalningar-inkorg-forhandsgranska-alla.staging.test.ts 9/9 gröna (egen dev-server port 5180 + kopierad e2e-storageState från syskon-worktreets färska inloggning, --no-deps för att undvika TASK-77-preflighten som blockerade en NY live-inloggning medan post-merge CI höll staging).
<!-- SECTION:NOTES:END -->
