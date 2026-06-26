---
owner: marcus803
updated: 2026-06-26
review_by: 2026-09-25
status: stable
---

# Segment-ytans arkitektur — branschledar-mönstret + var basen möter sina gränser

> Syfte: en sammanhållen, läsbar bild av HUR segment-ytan (Fas 6g) är byggd till branschledar-standard, och VAR den möter Airtable-basens nuvarande gränser. Uppslagsverk/orientering — sak-besluten lever i ADR-062/063/064 + data-model §Kända fällor; detta dok binder dem, fryser dem inte. Vid konflikt gäller ADR:erna.

## Tesen i en mening

App-sidan är byggd som branschledande CDP:er bygger segment — och den når dit *på grund av* Airtable-basens brister, inte genom att kompromissa med dem.

## 1 — Branschledar-mönstret (vad, och hur vi matchar det) [STABIL ARKITEKTUR]

ADR-062:s research (HubSpot, Klaviyo, Adobe Real-Time CDP, Salesforce Data Cloud, Twilio Segment, AWS CDP) konvergerade mot ett mönster: segment = sparad REGEL med BERÄKNAT medlemskap (ej en lagrad lista), dynamisk default + snapshot för frysning, byggt på beteende-KÄLLAN (ej förberäknade kumulativa flaggor), on-demand-eval i rätt skala.

Vår motor (`compute-segment`, Fas 6g L1): regel in → medlemskap beräknat från Deltaganden (källan) → ut. Inga lagrade medlemskaps-listor, inga materialiserade tabeller, on-demand. Det är CDP-mönstret nerskalat korrekt till en sju-par-taxonomi — en streaming-/materialiserings-pipeline här vore över-engineering och avvisades uttryckligen (ADR-062).

## 2 — Det avgörande arkitektur-valet: läs källan, lappa inte projektionen [STABIL ARKITEKTUR]

Personers förberäknade rollups är en LOSSY projektion av en ren källa, med tre strukturella luckor (data-model §Kända fällor 31–33): (A) totalen saknar RIM 3; (B) Fjärrskådning blandar utbildning + föreläsning via sträng-match; (C) föreläsning + Psionautics surfar inte per person.

Amatör-vägen (Väg A) lappar projektionen: fler per-person-fält, fördubblad lossiness, korrekthet byggd på sträng-matchning. Den avvisades (ADR-062). Branschledar-vägen läser KÄLLAN (Deltaganden, (kurs × modalitet) filtrerat på närvaro) → stänger alla tre luckorna BY CONSTRUCTION; de kan inte återuppstå eftersom motorn läser sanningen.

Slutsatsen är den viktiga: basens brister tvingade fram den BÄTTRE arkitekturen, inte en sämre. En lossy projektions luckor är en signal att routa till källan, inte ett skäl att kompromissa (lessons L192/L195).

## 3 — Var vi faktiskt möter basens gränser (de två ärliga ställena) [AKTUELLT BAS-TILLSTÅND]

> Detta avsnitt ändras när basen maxas (ADR-063, post-Fas-6) — det beskriver basens tillstånd, inte arkitekturen.

(a) **Tomma segment för noll-närvaro-kurser** (RIM 3, Psionautics, alla Föreläsningar). Inte en app-kompromiss — basen saknar avstämd närvaro ännu, och ytan SURFAR det korrekt. Golvet (strikt `Närvaropoäng=1`, identiskt med rollup-kedjans lynchpin) lättas aldrig för att fylla tomma segment (ADR-064 beslut 1/3) — det vore att korrumpera korrektheten och maskera basens tillstånd. Ett tomt segment = ärlig signal om var bas-arbetet återstår; det fylls självt när närvaron stäms av (dynamisk regel, on-demand-eval).

(b) **16 oavstämda Föreläsnings-Deltaganden** (4 historiska event) + **naket "Resor i medvetandet"-namnkollision** — registrerade (data-model §Kända fällor 34/35, tråd T16) som KRAVSPEC för post-Fas-6-bas-maximeringen (ADR-063), inte som app-fixar.

RIM 3/Psionautics noll-närvaro är INTE en defekt — ännu-ej-genomförda event är förväntat och täcks av kontraktet (ADR-064 beslut 2/3).

## 4 — Var detaljen lever (frys-disciplin)

Sak-besluten fryses inte här; de lever i:

- **ADR-062** — segment-arkitekturen + branschledar-research + avvisade vägar (Väg A, streaming).
- **ADR-063** — Airtable-basen som förstklassig leverabel; register = kravspec; resolution I BASEN.
- **ADR-064** — taxonomi från event-domänen + strikt närvaro-golv + förfining av ADR-062:s taxonomi.
- **data-model §Kända fällor 31–35 + T16** — varje avtäckt brist, live-verifierad, med resolutions-väg.

Detta dok binder dem till en bild. Vid konflikt mellan detta dok och en ADR gäller ADR:n.
