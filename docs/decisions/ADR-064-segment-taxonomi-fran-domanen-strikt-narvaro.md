# ADR-064: Segment-taxonomin härleds från event-domänen; medlemskap förblir strikt närvaro; basens ofullständighet är ärlig signal

- **Status:** Accepted
- **Datum:** 2026-06-25
- **Fas:** 6g (Segment-yta) — förfinar ADR-062.

## Kontext

6g-pre-passet (forensisk live-MCP-verifiering mot prod-basen app8uGPrVCVOm6LfD, Session 35) verifierade segment-källans schema och enumererade den EMPIRISKA taxonomin. Tre fynd bröt mot ADR-062:s idealiserade (kurs × modalitet)-modell:

1. **Taxonomins form.** ADR-062 beslut 3 antog fem kurser i ett "6×2"-rutnät. Live event-domänen (Eventplanering, 50 event) har SEX distinkta kursnamn, och (kursnamn × Typ) är OREGELBUNDET — **sju** distinkta par finns, inte ett fullt rutnät: RIM 1 (Utbildning), RIM 2 (Utbildning), RIM 3 (Utbildning), Psionautics (Utbildning), Fjärrskådning (Utbildning OCH Föreläsning — två par), samt ett naket "Resor i medvetandet" utan siffra (Föreläsning).
2. **Närvaro-snapshoten är en delmängd av domänen.** Av de sju paren bär `Närvaropoäng=1` just nu bara TRE (RIM 1, RIM 2, Fjärrskådning — alla Utbildning; 1012 rader). RIM 3 + Psionautics har noll genomförd närvaro (event finns, ännu ej genomförda/avstämda). Alla Föreläsningar har noll närvaro (16 Deltaganden-rader över 4 historiska event, samtliga Status="Ej avstämt" → Närvaropoäng=0).
3. **Namnkollisions-fälla.** Det nakna "Resor i medvetandet" (Föreläsning) är ett distinkt kursnamn skilt från RIM 1/2/3-serien — sammanblandningsrisk i regel-design och svensk klartext-spegling.

**Styrande princip (Marcus, Session 35):** Airtable-basen ses ALDRIG som fullständig. Appen byggs för att BÖRJA jobba basen — basens nuvarande ofullständighet (oavstämd närvaro) är förväntad och är precis det app-arbetet ska driva, inte något att designa runt eller dölja.

## Beslut

1. **Medlemskaps-filtret förblir strikt `Närvaropoäng=1`.** Golvet — identisk mängd som rollup-kedjans lynchpin (`Status ∈ {Närvarande, Deltog online}`, `EventAttendance.tsx`) — lättas INTE för att fylla tomma segment. Att räkna oavstämd/planerad data som närvaro vore att korrumpera korrekthets-golvet och dölja basens tillstånd. Tomma segment är en ärlig, korrekt utdata.
2. **include[]/exclude[]-rymden härleds från EVENT-DOMÄNEN (Eventplanering: distinkta (kursnamn × Typ)-par), inte från närvaro-snapshoten och inte hårdkodad.** Hela den planerade taxonomin är valbar även vid noll nuvarande närvaro; rymden växer automatiskt när nya event/kurser läggs i basen — utan kod-ändring. Typen för en taxonomi-dimension bär domän-VÄRDEN (kursnamn-sträng × Typ-sträng), inte en frusen enum.
3. **Dynamisk regel + on-demand-eval (ADR-062 beslut 1/6) gör tomma segment självläkande:** medlemmar dyker upp när närvaron stäms av, utan att regeln ändras. Segment-ytan SURFAR basens luckor och DRIVER därmed bas-arbetet — ett tomt "RIM 3"-segment är signalen "RIM 3-närvaron är inte avstämd ännu".
4. **De avtäckta bristerna registreras (ADR-063 / T16 / data-model §Kända fällor), böjs inte in i kontraktet:** (a) 16 oavstämda Föreläsnings-Deltaganden (4 historiska event); (b) den nakna "Resor i medvetandet"-namnkollisionen (kräver tydlig svensk klartext-etikett skild från RIM-serien). Dessa är kravspec för post-Fas-6-bas-maximeringen, inte app-fixar. RIM 3 + Psionautics noll-närvaro registreras INTE som defekt — ännu-ej-genomförda event är förväntat och täcks av beslut 2/3.

## Förfining av ADR-062 (öppen rivning med kvittens)

ADR-062 beslut 3:s "kurs ∈ {Fjärrskådning, RIM 1/2/3, Psionautics}" / "6×2" var en idealiserad modell formulerad FÖRE forensisk enumerering. Den korrigeras till den disk-/live-belagda oregelbundna **sju-par-taxonomin över sex kursnamn**. Sak-besluten 1, 2, 4–7 i ADR-062 står oförändrade; endast beslut 3:s taxonomi-uppräkning förfinas här. Original i ADR-062 bevaras; refinement-note tillagd (jfr ADR-062-erratum-mönstret från ADR-063).

## Alternativ som övervägdes

- **Lätta medlemskaps-filtret** (räkna oavstämd/planerad data) för att undvika tomma segment. Avvisat: korrumperar golvet, döljer basens tillstånd, motsäger styrande princip.
- **Hårdkoda/frysa taxonomin** till de tre nuvarande närvaro-paren. Avvisat: bygger ytan för datans ögonblicksbild, inte domänen; kräver kod-ändring varje gång basen växer.
- **Avstämma Föreläsningarna nu** som del av 6g. Avvisat som del av kontraktet: bas-data-arbete ≠ app-bygge; registrerat till post-Fas-6 (väg-beslut Session 35).

## Konsekvenser

**Positiva:** korrekt by construction; taxonomi-rymden domän-driven och självväxande; tomma segment driver bas-arbetet (ADR-063-spåret) i stället för att maskera det; portar rent mot Supabase (`definition jsonb` spänner domän-taxonomin).
**Negativa / skuld:** vissa segment är tomma tills basen stäms av (förväntat, ej bugg); de 4 Föreläsnings-eventen + RIM 3/Psionautics-närvaron är bas-arbete som återstår (T16).

## Relaterat

- [ADR-062](ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) — förfinas här (beslut 3).
- [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) — bas som leverabel; register = kravspec.
- [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) — triage av det oväntade; pre-passets STOPPA (oväntat fynd utanför scope → eskalering för väg-beslut) följde denna triage och gav upphov till denna landning.
- T16, data-model §Kända fällor — defekt-registret.
