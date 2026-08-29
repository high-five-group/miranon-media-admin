---
id: TASK-309.38
title: >-
  Fynd: väntetexten i PDF-fönstret personlig och Gunilla-begriplig, och
  'Förhandsgranska först' blir 'Förhandsgranska'
status: To Do
assignee: []
created_date: '2026-08-29 07:34'
updated_date: '2026-08-29 08:16'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 609000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-29 (S113 sessionsstart, TASK-309.11 punkt 1, event RIM 1 Rönninge 12–13 sept), ordagrant: "Det kommer upp en text i det nya 'pdf-fönstret' typ 'detta fönster byter till pdf:en när den skapats', jag skulle vilja byta ut den till typ 'Ett ögonblick XX (Username: Lotta), pdf:en skapas och visas här om några sekunder' … I mitt fall så skulle det stå alltså 'Ett ögonblick Marcus, bilagan skapas och visas här om några sekunder'." och "Förhandsgranska-knappen har texten 'Förhandsgranska först', jag vill byta till bara 'Förhandsgranska'."

VERIFIERAT LÄGE (main 10c0cedf, läst av orkestreraren 2026-08-29): laddningssidan skrivs av skrivLaddningssida (src/lib/skriv-laddningssida.ts:139) från src/components/dokument/GenereringsVy.tsx:735–738 (förhandsgranskning: 'Skapar förhandsgranskningen. Sidan byter till PDF:en när den är klar.') och :780–783 (skapa: 'Skapar ${meta.namn.toLowerCase()}n. Sidan byter till PDF:en när den är klar.'). Knappen: GenereringsVy.tsx:1132 ('Förhandsgranska först'; pending-etikett 'Skapar PDF …'). Förnamnet finns redan i klienten: user.displayName (src/auth/AuthProvider.tsx:45–47, user_metadata.display_name) + fornamn() (src/components/hem/hem-derivations.ts:127) — samma källa och form som Hem-hälsningen (TASK-220). Pröva varje adress mot disk före bygge (ADR-086).

SCOPE-GRÄNS — ENDAST texter och etiketter. Flödet i sig (nytt fönster även vid Skapa, dubbelrendering, återvändo till dokumentvyn med markerad rad, kvittots form) är ett separat designarbete under research + grillning och rörs INTE här. Skriv inga nya mekanismer.

FORM (Gunilla-principen, ORDLISTA): förhandsgranskning → 'Ett ögonblick <Förnamn>, förhandsgranskningen av <dokumentnamnet i bestämd form> skapas och visas här om några sekunder.'; skapa → 'Ett ögonblick <Förnamn>, <dokumentnamnet i bestämd form> skapas och visas här om några sekunder.' Dokumentnamnet ur meta.namn (bekräftelsebilagan / deltagarinformationen) — aldrig hårdkodat 'bilagan'. Saknas displayName: 'Ett ögonblick, …' utan namn och utan tomt mellanslag/komma. Titeln (document.title) på laddningssidan uppdateras i samma anda. Svep alla anropare av skrivLaddningssida (grep) — kvittoförhandsgranskningen ska bära samma form, eller avvikelsen bokförs med skäl (jfr TASK-309.26 AC #4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Laddningssidans text är personlig med förnamnet ur user.displayName via fornamn(), i formen ovan, med korrekt fallback utan namn — bevisat med test för BÅDA fallen (med och utan displayName) och för båda dokumenttyperna (meta.namn)
- [x] #2 Knappen heter 'Förhandsgranska' och pending-etiketten 'Förhandsgranskar …' (inte 'Skapar PDF …'); primärknappen 'Skapa <dokumentnamn>' oförändrad; befintliga tester som matchar de gamla strängarna uppdaterade och gröna
- [x] #3 Alla anropare av skrivLaddningssida svepta: kvittoförhandsgranskningen bär samma form, eller avvikelsen är bokförd i Implementation Notes med skäl
- [x] #4 Gunilla-läsning av alla ändrade strängar: inga tekniska ord utöver 'PDF', ingen 'sidan byter'-formulering kvar (grep i src/ på 'byter till PDF' ger 0 träffar)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
IMPLEMENTATION NOTES (bygg-agent, 2026-08-29)

AC #1 (personlig väntetext, förnamn + fallback + båda dokumenttyper): löst i
GenereringsVy.tsx via ny delad `vantehalsning(forNamn)`-hjälpare ("Ett
ögonblick <Förnamn>, " / "Ett ögonblick, ") + `useAuth()`+`fornamn()` för
`forNamn`. FYRA test-bevis i dokument-generering-fonster-direkt.acceptance.
test.ts: :169 (förhandsgranskning, bekräftelsebilagan, "Lotta"), :274 (Skapa,
samma dokument, "Lotta"), samt två NYA tester tillagda i denna skiva —
"TASK-309.38 AC #1: väntetexten bär rätt dokumentnamn för deltagarinformation
också" (mall=deltagarinfo, med namn) och "... faller tillbaka till den
anonyma formen utan visningsnamn" (patchStoredDisplayName(page, null),
duplicerad lokal testhjälpare, samma teknik som hem.acceptance.test.ts:206).
Alla 7 tester i filen gröna (PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 npx
playwright test --project=acceptance
tests/acceptance/dokument-generering-fonster-direkt.acceptance.test.ts).

AC #2 (knapp "Förhandsgranska" + pending "Förhandsgranskar …"): löst,
GenereringsVy.tsx (raden med `forhandsgranska.isPending`). Alla fem
"Förhandsgranska först"-träffar i tester uppdaterade
(dokument-generering-fonster-direkt.acceptance.test.ts:
knapp-klicken; dokument-forhandsgranskning-popup-policy.acceptance.test.ts:
knapp-klicket) + 4 aria-snapshots regenererade (tests/visual/__aria__/
dokument-generering-promoverings-grind.spec.ts/generering-
{bekraftelse,deltagarinfo}-visual-{desktop,mobile}.aria.yml) via
`PLAYWRIGHT_VISUAL_DEV_SERVER=1 npx playwright test --project=visual-desktop
--project=visual-mobile tests/visual/dokument-generering-promoverings-
grind.spec.ts --update-snapshots` — diff visar ENDAST knapptexten, inget
annat drev.

AC #3 (svep alla anropare, formkonsekvens): tredje anroparen
(DokumentYta.tsx, DokumentAtgardsKnappar) bär NU också en personlig
väntetext, men med det GENERISKA "dokumentet" i stället för `namn` böjt i
bestämd form — bokfört beslut, se docblock vid call-siten. Skäl: knappen
delas mellan bilaga-rader (fritt uppladdat filnamn, t.ex.
"kontrakt_signerat.pdf" — ingen böjbar substantivfras) och generatorraden/
kvittot (GeneratorRad, namn={gen.namn}). GenereringsVy.tsx:s
`${meta.namn.toLowerCase()}n`-bildning förutsätter ett känt, fast substantiv
ur MALL_META — det antagandet håller inte för ett godtyckligt filnamn. Formen
"Ett ögonblick <Förnamn>, dokumentet öppnas här om några sekunder." (exakt
den kandidatform uppdraget föreslog). `titel` lämnades OFÖRÄNDRAD ("Öppnar
dokument…") — redan sann för den generiska formen; situationen är dessutom
en annan (öppnar ett REDAN lagrat dokument, inte "skapar").

DokumentYta.tsx:1110s kontext gäller INTE enbart kvittoförhandsgranskningen
trots GenereringsVy.tsx:706s docblock-benämning ("DELAD med DokumentYta.tsx:s
kvittoförhandsgranskning") — DokumentAtgardsKnappar är samma funktion för
BÅDA `typ: 'bilaga'`-rader och `typ: 'generator'` (kvitto). Den äldre
docblock-benämningen är en förenkling, inte fel i sak (funktionen bar
ursprungligen bara kvittot) — rörd inte, utanför scope.

fornamn() FLYTTAD (task-beskrivningens instruktion) från
src/components/hem/hem-derivations.ts till NY fil src/lib/fornamn.ts —
minsta möjliga flytt: Hem.tsx importerar den nu direkt från @/lib/fornamn i
stället för via hem-derivations, ingen annan ändring i Hem.tsx. Motiv:
dokument/ ska inte importera ur hem/ (feature→feature-beroende,
CLAUDE.md § "Bygg i oberoende lager"). Bevisat grönt: tests/acceptance/
hem.acceptance.test.ts (47/48 gröna i full-svit; den enda fällningen var en
orelaterad parallell-körnings-flake i Åtgärdskö-navigering — ombekräftad
grön ISOLERAT, se Slutrapport).

AC #4 (Gunilla-läsning, "byter till PDF" borta): `grep -rn "byter till PDF"
src/` gav 0 träffar (mätt). `grep -rn "sidan byter" src/` gav också 0
träffar. Prosa som nämnde den gamla etiketten uppdaterad: DokumentYta.tsx
(docblocket vid MallRad, "Förhandsgranska först" → "Förhandsgranska") och
src/data/mutations/dokumentKalla.ts (samma ändring).

OBSERVERAT, EJ ÅTGÄRDAT (utanför scope, uppdraget instruerade "återanvänd
samma bildning"): `${meta.namn.toLowerCase()}n` ger "deltagarinformationn"
(dubbel-n) för deltagarinfo-dokumentet — grammatiskt bör bestämd form av
"information" vara "informationen" (+en, inte +n, eftersom "information"
redan slutar på konsonant "n"). Detta är en PRE-EXISTING formel som redan
används på flera andra ställen i GenereringsVy.tsx ("Öppna …n", "…n är
skapad …") och rör alltså inte bara denna skiva. Den nya testen för
deltagarinfo-grenen (se AC #1 ovan) bevisar och LÅSER den befintliga
(ofullkomliga) formen — den fäller om formeln ändras, men rättar den inte.
Uppdraget instruerade explicit att återanvända SAMMA bildning, så den lämnas
orörd här — flaggas för ett eget kort om Marcus vill rätta böjningen (skulle
kräva en per-dokument bestämd-form-tabell i stället för mekanisk
toLowerCase()+n).
<!-- SECTION:NOTES:END -->
