---
owner: marcus803
updated: 2026-07-11
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

(a) **Tomma segment för noll-närvaro-kurser** (RIM 3, alla Föreläsningar; *Psionautics avstämdes i S60 2026-07-08/09 — Event-17: 156 Närvarande — och är inte längre tom, precis som kontraktet förutsade*). Inte en app-kompromiss — basen saknar avstämd närvaro ännu, och ytan SURFAR det korrekt. Golvet (strikt `Närvaropoäng=1`, identiskt med rollup-kedjans lynchpin) lättas aldrig för att fylla tomma segment (ADR-064 beslut 1/3) — det vore att korrumpera korrektheten och maskera basens tillstånd. Ett tomt segment = ärlig signal om var bas-arbetet återstår; det fylls självt när närvaron stäms av (dynamisk regel, on-demand-eval).

(b) **16 oavstämda Föreläsnings-Deltaganden** (4 historiska event) + **naket "Resor i medvetandet"-namnkollision** — registrerade (data-model §Kända fällor 34/35, tråd T16) som KRAVSPEC för post-Fas-6-bas-maximeringen (ADR-063), inte som app-fixar.

RIM 3/Psionautics noll-närvaro är INTE en defekt — ännu-ej-genomförda event är förväntat och täcks av kontraktet (ADR-064 beslut 2/3).

## Consent-allokering vid export (Fas 6g L4 + framåt mot 6h)

Segment-medlemmar bär flaggan `Ej godkänd för mailutskick` (buren av compute-segment, ej
filtrerad i medlemskaps-beräkningen — medlemskap = strikt närvaro per ADR-064). Golvet
(ADR-062 beslut 7) kräver consent-baslinje PÅ UTSKICK. Var golvet upprätthålls:

- SKOOL-export (L4): filtreras INTE på mail-consent. En SKOOL-inbjudan är community-ÅTKOMST
  (ADR-062 beslut 5 — åtkomst = union av per-(kurs,modalitet)-rättigheter), en transaktionell
  access-grant, ej ett marknadsutskick. Mail-opt-out gäller marknadsströmmen, inte access-
  strömmen (branschkanon skiljer dem: separata strömmar, separat suppression). Att utesluta en
  deltagande person från sin kursåtkomst för att de tackat nej till MAIL vore fel. SKOOL-export
  = alla kvalificerade medlemmar med giltig e-post, deduplicerade.
- Mail-utskick (6h): consent-golvet upprätthålls vid send-gaten. `Ej godkänd för mailutskick`
  === true exkluderas vid 6h:s utskick (suppression vid leverans). 6h löser mottagare on-demand
  ur segment-motorn (per byggplan) och applicerar consent-filtret där.
- Dedup-vid-handling (golv): sker i exporten/handlingen — normaliserad e-post (lowercase/trim,
  p.g.a. kända e-post-quirks) + unik. Poster utan giltig e-post exkluderas och räknas synligt.

Källa: ADR-062 beslut 5/7 + branschledar-research (HubSpot static-list-snapshot för event-
attendees; marknad/transaktionellt = separata suppression-strömmar; SKOOL bulk-invite =
e-post-CSV som grant access). Framåtpekare: 6h implementerar mail-consent-filtret vid send.

## Material-mappningen (Skool): utbildnings-gated per kurs [AFFÄRSREGEL, S60]

> Kanonisk hemvist sedan S60 session-end (2026-07-11); föddes i S60 Del 1 §Samsyn
> (Marcus 2026-07-08). ADR-bar-prövad → **under baren** (reversibel affärsregel som
> följer Skool-tillståndet; avvägningarna bakom är redan ADR-062/064). Fulltext-
> historik + grillnings-resonemang: S60-sessionsdoket Del 1 §Samsyn + Del 5–6.

**Regeln:** Skool-material är **utbildnings-gated per kurs**. En kurs gått som
*Utbildning* ger kursens material ("Mentala ankare <kurs>" i Skool); **alla
föreläsningar ger inget material**. Skool-inbjudan = **unionen av all
utbildningsnärvaro** (access-grant, ej consent-filtrerad — se §Consent-allokering
ovan); föreläsning-only-deltagare får därmed ingen Skool-inbjudan alls.

| Kurs (gått som Utbildning) | Skool-material |
|---|---|
| RIM 1 / RIM 2 / RIM 3 | Mentala ankare RIM1 / RIM2 / (RIM3 när event genomförts) |
| Fjärrskådning | Mentala ankare Fjärrskådning |
| Psionautics | Mentala ankare Psionautics (skapas när R&L:s material är klart) |
| **Alla föreläsningar** | **inget** |

**Källäsnings-kravet:** regeln kräver käll-läsning (kurs × modalitet ur Deltaganden,
`compute-segment`-mönstret) — rollupen `Fjärrskådning ×` blandar Utbildning och
Föreläsning (fälla 32) och skulle ge FS-material felaktigt till föreläsnings-deltagare.
"Mentala ankare" är **plural även för ett enskilt material** (ORDLISTA.md).

**Leverans-partition till Skool (empiri 2026-07-09):** Skool dedupar INTE (samma
adress ×3 = 3 inbjudningsmail) och sätter åtkomst per uppladdning → *leveransen*
partitioneras (varje person i exakt EN fil = sin exakta ankar-kombination), medan
segment-modellen i basen förblir överlappande (ADR-062 beslut 1). Generator med
fällande invarianter + reproducerbar pipeline: `docs/backfill/segment-export/`.

## 4 — Var detaljen lever (frys-disciplin)

Sak-besluten fryses inte här; de lever i:

- **ADR-062** — segment-arkitekturen + branschledar-research + avvisade vägar (Väg A, streaming).
- **ADR-063** — Airtable-basen som förstklassig leverabel; register = kravspec; resolution I BASEN.
- **ADR-064** — taxonomi från event-domänen + strikt närvaro-golv + förfining av ADR-062:s taxonomi.
- **data-model §Kända fällor 31–35 + T16** — varje avtäckt brist, live-verifierad, med resolutions-väg.

Detta dok binder dem till en bild. Vid konflikt mellan detta dok och en ADR gäller ADR:n.
