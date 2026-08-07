---
id: TASK-145.1
title: 'Skiva: Registret som EN lista — steg-hinkar, steg-märken, FIFO'
status: Done
assignee: []
created_date: '2026-08-07 08:57'
updated_date: '2026-08-07 15:40'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-145
ordinal: 233000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta öppnar ett event och ser alla anmälda i en enda lista, sorterad efter vad som återstår: de som väntar på bekräftelse överst, sedan de som saknar anmälningsavgift, sedan de som saknar slutbetalning, sist de klara. Inom varje grupp ligger den som anmälde sig först överst. Hon ser var varje person står på personens eget märke — inga rubriker behövs. Listan scrollar som förut när den blir lång.

Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 10, 25
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Obekräftade- och Bekräftade-rubrikerna är rivna; registret renderas som EN deltagarlista
- [x] #2 Listan sorteras på fyra steg-hinkar i ordningen väntar på bekräftelse → anmälningsavgift saknas → slutbetalning saknas → klara, med inställt/på-väg-till-väntelista sist
- [x] #3 Inom varje hink sorteras personerna i anmälningsordning (äldst registrerad först)
- [x] #4 Steg-märket ÄR grupperingen — inga sektionsrubriker renderas
- [x] #5 Exakt ETT märke per person även när flera steg är ogjorda; undantagen (Avbokad, Inställt, På väg till väntelistan) bär egna ärliga märken
- [x] #6 Inline-scrollen är återanvänd med samma klipphöjd som kön hade — ingen ny höjd mintas
- [x] #7 Scroll-ytans tillgänglighetsetikett följer sektionen och ärver INTE köns hårdkodade namn
- [x] #8 Summeringsblocket lämnas ORÖRT av denna skiva — steg-raderna OCH logistik-gruppen (Eventinfo-signalraden, Bor över, Avbokade) står kvar exakt som förut; blocket ägs av TASK-145.2
- [x] #9 Markera-lägets kandidatmängd är den RENDERADE listan, inte den gamla obekräftade-kön — samma form facit redan bär (registerListaA), så att senare filtrering följer med automatiskt
- [x] #10 Markera-knappen har en egen förankring utanför de rivna sektionsrubrikerna; ingen del av markera-lägets ÖVRIGA form (batch-barens knapptext, bekräfta-flödets rivning, interim-utgången) rörs här — den ägs av TASK-145.3
- [x] #11 Ingen befintlig E2E-fil RADERAS. Assertioner som prövar den yta skivan medvetet ändrat SKA däremot uppdateras — att lämna dem röda är inte samma sak som att bevara täckning. Undantag: tester vars SUBJEKT flyttar till en annan skiva (avprickningen → TASK-145.3) lämnas orörda och röda, med ägaren namngiven
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Byggagent — implementation notes (tredje försöket)

**Facit-review (DoD #5):** ingen `facit-*.png` i `tasks/sessions/bilagor/s93-hallplats-prototyp/`
täcker registret specifikt (endast anteckningar/betalningar/gruppdynamik har
egna facit-bilder) — verifierat på nytt (samma bedömning som föregående
agent gjorde, nu omprövad och bekräftad). Jämfört i stället mot
`konvergens-a-verklig.png` (variant A) för den delade badge-komponenten
(HallplatsMarke) — visuell paritet bekräftad. Produktionens EGEN
komposition (gamla summeringsblocket + flik-togglen orörda, ovanpå den nya
enade steg-märkta listan) saknar referensbild helt (ingen tidigare variant
kombinerat de två) — granskad via en riktig Playwright-screenshot av
fixturvärldens eventsida (`npm run test:visual`s eget `eventsida.spec.ts`,
se slutrapport) i stället för mot en bild.

**test:visual (DoD #6):** `-darwin.png`-baslinjer är gitignorerade och föds
först lokalt (CONTRIBUTING.md § Visuell regression — grinden är MEDVETET
INAKTIV i CI, S81; riktiga baslinjer föds via `visual-baselines.yml`, en
separat, granskad CI-PR). Körningen visade därför "snapshot doesn't exist"
för samtliga sex vyer — väntat på en färsk worktree, INTE en regression
(även helt orörda vyer som hem/personer visade samma). Drift GRANSKAD via
den faktiska renderade skärmdumpen (`eventsida-actual.png`): summeringsblock
+ flik oförändrade, badge + Markera-knappens nya position + kvarvarande
utskicksrader (Filip Forsberg: "Påminnelse 10 september") — matchar
avsikten. Ingen `-linux`-baseline att uppdatera lokalt; den föds i CI.

**DoD #7, öppet delutfall:** hela sidan är INTE skrivfri ännu (Bor
över-krysslaget och markera-lägets kort-checkboxar lever kvar, avsiktligt,
tills TASK-145.4/145.5). Vad SOM ÄR bevisat: registrets EGEN
default-rendering (markera-läget av) bär noll checkbox-affordanser — ny
test i `event-deltagare.staging.test.ts` ("TASK-145.1 — registret som EN
lista (DoD #7)"), verifierad i BÅDA riktningar (grön default → grön efter
riktig Markera-klick visar 4 checkboxar → grön efter Avbryt; samt en separat
temporär kod-injektion som fällde testet innan den reverterades — se
slutrapport). DoD #7 lämnas därför AVBOCKAD tills 145.4/145.5 landat, per
uppdragets egen instruktion.

**E2E-fallout, statiskt + EMPIRISKT körd (chromium-authenticated, egen
dev-server port 5174 p.g.a. att 5173 var upptaget av en över ett dygn gammal
process i worktree `s93-resume-2`, ej rörd):**
- `event-bor-over.staging.test.ts`: 6/6 GRÖNA (AC #9:s explicita krav).
- `event-bekraftelse.staging.test.ts`: 10 gröna / 11 röda (väntat —
  subjektet, markera-lägets ÖVRIGA form mot den rivna rubriken, ägs av
  TASK-145.3 per uppdraget). EJ raderad.
- `event-deltagare.staging.test.ts`: 6 gröna (inkl. den nya DoD#7-grinden) /
  5 röda — samtliga röda testar antingen den rivna GruppRubrik-headern
  (AC #1) eller kategori-pillen som nu ersätts av steg-märket på samma axel
  (AC #4/#5, samma redan Marcus-beslutade princip som variant A:s
  motsvarande rivning). EJ raderad, EJ omskriven.
- `event-detail.staging.test.ts` — describe-blocket "Personkorten — metaytan
  + historiken" (8 tester): 0/8 gröna, samtliga faller på `oppnaSidan()`s
  klick på "Bekräftade (2)" (AC #1). EJ raderad, EJ omskriven. Detta är EN
  fjärde fil utöver de två uppdraget namngav explicit — samma
  disposition (AC #9 klausul 2: subjektet flyttar/rivs, ägs inte av denna
  skiva) tillämpad symmetriskt, öppet bokfört här.

Ingen av de fyra filerna raderades eller skrevs om; endast EN ny test
lades till (event-deltagare.staging.test.ts, DoD #7-grinden).

## Strukturell koppling hittad OCH löst (inte blockerande, öppet bokförd)

`KortInnehall` (delad av produktionens vilande kort och `?variant=a`) hade
en BEFINTLIG, redan facit-godkänd koppling: `hallplatsMarke` satt döljer
INTE bara Obekräftad-pillen/kategori-pillen (rimligt — samma axel, en
avsiktlig defekt-3-fix) utan ÄVEN de tre utskicks-metaraderna
(Bekräftelse/Påminnelse/Eventinfo-datum), eftersom `?variant=a` flyttat
SAMMA info till `BetalningsDetaljer`/"Öppna detaljer" (en arbetsyta som
INTE är del av produktionen förrän en senare skiva). Att slå på
`hallplatsMarke` för produktionens register rakt av (AC #4/#5 kräver
badgen) hade därför TYST tagit bort information Lotta i dag ser på korten,
utan någon ersättning i produktion — en regression ingen AC bad om.

Löst med en ny, smalt scopad prop (`visaUtskicksRader`, default
`hallplatsMarke == null` — bevarar de TVÅ befintliga anropsplatsernas
beteende exakt, `?variant=a` orört): produktionens NYA registeranrop sätter
den explicit `true`, så metaraderna står kvar trots badgen. Kategori-pill-
ersättningen (badge tar dess plats) lämnades OFÖRÄNDRAD — den har redan
Marcus-precedens ("det räcker att den är filtrerbar", flik-togglen lever
kvar) och skapar ingen informationslucka. Se `Deltagare.tsx`s
`KortInnehall`-docblock för fullständig motivering.

## Uppföljning — AC #11 (fd #9) preciserad: uppdatera i stället för att lämna rött

Orkestrerarens rättelse (efter PR #885 landade på main, AC-numreringen skiftade
9→11 och texten omskrevs till "assertioner SKA uppdateras, inte lämnas röda"):
de två filerna vars subjekt DENNA skiva medvetet ändrat är nu uppdaterade i
stället för lämnade röda.

**`tests/e2e/event-deltagare.staging.test.ts` — FÖRE 6 gröna/11, EFTER
11 GRÖNA/11.** Fem tester omskrivna (samma djup, ny form):
- "kön är FAST och äldst först; arkivet är fällbart..." → "registret är EN
  steg-hink + FIFO-sorterad lista — ingen fällbar arkiv-rubrik längre"
  (regressionsvakt mot att GruppRubrik/accordion återuppstår + full
  ordnings-/märkes-verifiering).
- "arkivets default FÖLJER kön..." (fynd (b), tillståndet riven med
  accordionen) → "registret visar ALLA direkt när ingen väntar på
  bekräftelse — inget dolt tillstånd kvar" (samma Lotta-värde, ny mekanism).
- "summeringsradens klick FILTRERAR..." — tre `getByText('Obekräftade
  (2)'/'Bekräftade (2)')`-rader bytta mot `getByTestId('deltagar-register')`
  synlighet; SJÄLVA filter-/Rensa-mekaniken (`traffar`, oförändrad kod) var
  redan grön och rörs inte.
- "kategori-flikarna filtrerar..." — kategori-pill-assertioner bytta mot
  steg-märke (`.last()`, samma breddlås-mönster som event-detail.staging);
  "Bekräftade (1)"-klicket + "Inga obekräftade"-texten bytta mot direkt
  synlighet i registret.
- "axe 0 i grundläget, i filtrerat läge och med arkivet utfällt" → tredje
  a11y-läget bytt från "arkivet utfällt" (riven yta) till "markera-läget
  aktivt" (registrets NYA extra-interaktiva tillstånd — checkboxar,
  batch-baren — samma roll den gamla accordion-expansionen spelade).

Ny helper `kortet(page, namn)` tillagd (samma konvention som
`event-detail.staging.test.ts`).

**`tests/e2e/event-detail.staging.test.ts`, "Personkorten"-blocket — FÖRE
0 gröna/8, EFTER 8 GRÖNA/8.** `oppnaSidan()`s "Bekräftade (2)"-klick riven
(navigations-fix, matchar exakt det tidigare byggförsökets korrekta ansats).
Tre assertionsgrupper uppdaterade till steg-märkes-semantiken (Anna, David i
identitets-testet + Bertil i 390px-testet): kategori-/Obekräftad-pillen
`toHaveCount(0)`, steg-märket `.last().toBeVisible()`.

**Avsiktlig DIVERGENS från det tidigare byggförsökets mönster, öppet
bokförd:** "ENDAST utförda åtgärder renderas — ej-skickat visas aldrig"
(David: Bekräftelse/Påminnelse/Eventinfo-raderna) lämnades **HELT
OFÖRÄNDRAD** — bara `oppnaSidan()`-fixen krävdes. Det tidigare försöket
gjorde `hallplatsMarke` ovillkorlig utan `visaUtskicksRader`-motsvarigheten,
vilket TOG BORT de raderna (matchade inte produktionens verkliga beteende).
Denna skivas `visaUtskicksRader`-fynd (se ovan) håller dem kvar i
produktionens register, så testets URSPRUNGLIGA assertioner var redan
korrekta för den faktiska implementationen.

**`event-bekraftelse.staging.test.ts` — orörd, 10 gröna/11 röda, ALDRIG
raderad.** Subjektet (Markera-lägets ÖVRIGA form: batch-barens knapptext,
bekräfta-flödet, interim-utgången) rivs i `TASK-145.3`, som äger
dispositionen EXPLICIT via sin egen AC #2 ("bekräfta-flödet med
kontrollfråga är RIVET ur eventsidan, inte dolt") och AC #4
("Avprickningens E2E-täckning hanteras EXPLICIT när bekräfta-flödet rivs:
filen tas inte bort tyst utan att TASK-147 bär skulden att återupprätta
täckningen"). Verifierat mot `task-145.3`s kort — namngiven, inte glömd.

**`event-bor-over.staging.test.ts` — orörd, 6/6 GRÖNA, omkörd och
bekräftad oförändrad.**

Alla fyra siffror mätta EMPIRISKT mot `chromium-authenticated` (egen
dev-server port 5174), inte förväntade. Samtliga fyra lokala DoD-grindar
(typecheck/biome/build/test:api) omkörda gröna efter ändringarna.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [x] #6 test:visual omtagen med granskade baslinjer — drift är väntad, inte accepterad osedd
- [ ] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [ ] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->
