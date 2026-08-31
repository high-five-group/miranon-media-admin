# ADR-115: Segmentets regelspråk — AND-primitiven, partitionen som generator, täckningen som kvittens

- **Status:** Accepted (S104:s designpass; Marcus slutkvittens 2026-08-16
  verbatim: *"Jag är helt nöjd på alla sidor i hela segment-ytan nu."*;
  facit-stämpel via `!`-kanalen enligt ADR-104, kvitto `sha a40f3543`,
  manifest `tasks/sessions/bilagor/s104-segment-divergens/facit.json`)
- **Datum:** 2026-08-17
- **Fas:** 6g (Segment-yta) — **andra förfiningen av ADR-062 beslut 3**
  (första: ADR-064, taxonomins form; denna: regelspråkets form)

## Kontext

ADR-062 beslut 3 gav segmentdefinitionen som strukturerad, typad data —
`include[]`/`exclude[]` över taxonomi-par — och ADR-064 förfinade
taxonomirymden till den domän-härledda sju-par-formen. Båda lämnade
regelspråkets UTTRYCKSKRAFT oprövad: `include[]` bar ren OR-semantik
("minst ett av paren").

S104:s designpass prövade språket mot verkliga mål — de fjorton
Skool-grupper Lotta faktiskt behöver
([`underlag-de-fjorton-skool-grupperna.md`](../../tasks/sessions/bilagor/s104-segment-divergens/underlag-de-fjorton-skool-grupperna.md)):

1. **Ren OR falsifierades empiriskt.** "RIM 1 + RIM 2" betyder *gått
   båda*; en platt `include`-lista kan aldrig säga det. **10 av 14
   grupper, 127 av 416 personer, var outtryckbara** (VariantD filhuvud
   § AND-PRIMITIVEN). En yta som ser ut att erbjuda uttrycket men räknar
   fel mängd är samma tysta felklass som modalitets-blandningen
   (S104 Del 2: det raderade segmentet "FS-deltagare" BESKREVS som
   utbildning men körde ett rollup-fält som blandar modaliteter).
2. **Grupperna är en UPPSÄTTNING, inte fjorton lösa segment.** Skool-målet
   är en partition: varje deltagare ska hamna i EXAKT en grupp. Att
   handbygga fjorton regler var för sig ger ingen garanti för
   disjunkthet eller fullständighet.
3. **Fullständigheten behöver en kvittens.** Frågan "täcker uppsättningen
   alla?" är en annan fråga än "vilka matchar regeln?" — den ställs mot
   HELA publiken och besvaras med ett mått, inte en lista.
4. **Branschresearch** ([`segment-byggare-branschmonster-2026-08-16.md`](../research/segment-byggare-branschmonster-2026-08-16.md),
   8 produkter + Hearst/Nielsen): rå AND/OR-terminologi missförstås
   mätbart; branschen exponerar begränsade, meningsbärande former (mallar
   som primär ingång, byggare som avancerat läge) — inte fri boolesk
   algebra.

## Beslut

1. **AND-primitiven: `med` är en lista av KONJUNKT-GRUPPER (disjunktiv
   normalform).** Minst en grupp ska uppfyllas; inom gruppen gäller alla
   villkor samtidigt. `utan` förblir PLATT — exklusiviteten behövde
   aldrig AND (0 av 14 verkliga mål). Villkorets form bär modaliteten som
   OBLIGATORISKT led (säkerhetskrav, Marcus verbatim: *"det finns
   material som är direkt olämpligt att skicka till människor som enbart
   gått föreläsning"*): ett villkor utan modalitetsval är ogiltigt och
   räknas inte; "Båda" är ett aktivt val, aldrig en tystnad. UI:t
   speglar regeln som människomeningar ur AVSIKTEN (`manniskoMening`
   via `byggGrupp`), aldrig som regeldump.
   **Promoveringsgräns:** prototypens konjunktion räknas som SNITT AV
   MEDLEMSMÄNGDER i klienten (`byggFrageplan`) eftersom motorn
   (`supabase/functions/_shared/segment-membership.ts`) bara kan OR.
   Klient-snittet är en prototyp-genväg och **får aldrig promoveras** —
   skarpt SKA AND-stödet in i motorn och därmed i både `compute-segment`
   och `send-email`, annars faller T50:s mottagarkontroll (servern äger
   sanningen om vilka som nås). Bokfört som EF-krav 4 i facit-manifestet.
2. **Partitionen som generator.** "Dela upp i grupper" tar en partition
   över valda kursatomer och GENERERAR en disjunkt segmentuppsättning —
   uppsättningen är resultatet av EN handling, inte fjorton handbyggen.
   De fjorton förskapade grupperna är uppsättningens facit-instans
   (`FACIT_KARTA`, juli 2026 års uppmätta Skool-antal 1–188);
   disjunktheten är live-bevisad (stagings avstämda personer föll i
   exakt varsin grupp, S104 Del 5).
3. **Täckningen som kvittens.** En uppsättning bär ett täckningsmått mot
   hela publiken — golvad procent med formen *"100 % - Full täckning.
   Alla deltagare som gått en eller flera utbildningar finns
   representerade i något av segmenten."* (modalitetsordet via
   `tacktaOrd`) och avvikelser i %-rubriker.
   Täckningsytan är en KVITTENS, inte ett arbetsläge (Del 6:
   "Kontrollera grupperna"-formen underkändes och revs).

Dimensionsmodellen (Familj × Nivå) som mallvyn och generatorn bygger på
SIMULERAS av den hårdkodade `KURS_KARTA` tills basstrukturen (familj +
nivå som fält på Eventplanering) är byggd — det är nästa steg i
Marcus-sekvensen, en separat landning, inte en del av detta beslut.

## Alternativ som övervägdes

- **Fullt booleskt regelspråk** (fritt nästlade AND/OR/NOT). Avvisat:
  research-passets dom är att rå boolesk terminologi missförstås mätbart;
  DNF räckte för samtliga fjorton verkliga mål; människomeningarna
  (Gunilla-principen) kräver en form som kan läsas som EN svensk mening.
- **Behålla platt OR och lösa Skool-målen med handplockade listor.**
  Avvisat: bryter ADR-062 beslut 1 (segment = dynamisk regel med beräknat
  medlemskap, aldrig lagrad lista) och ADR-062:s anti-mönster; dessutom
  strukturellt omöjligt utan person-gren i schemat (DUKNING § 7).
- **AND även i `utan`.** Avvisat: ingen av de fjorton behövde det —
  spekulativ komplexitet ovanför golvet (över-engineering-vakten).
- **Bygga AND-stödet i EF:n direkt under designpasset.** Avvisat:
  prototyp-kontraktet är read-only förstärkt (ingen mutation, ingen
  EF-ändring); motor-ändringen bär T50-implikationer och hör i
  promoverings-skivorna med egna grindar.

## Konsekvenser

**Positiva:** de fjorton verkliga målen uttryckbara — kombinatoriken bor
i algebran, inte i extra motor-anrop (de fjorton delar FYRA
villkor-frågor); ett predikat utan flerledade grupper går exakt dagens
väg (ingen regression för enkla segment); partitionen ger disjunkthet
by construction; täckningen gör fullständigheten verifierbar; formen
portar rent mot Supabase (`definition jsonb` spänner DNF-formen).

**Negativa / skuld:** klient-snittet lever i prototypen tills EF-krav 4
byggs (promoverings-skiva; får aldrig promoveras som det är) ·
`compute-segment`-svaret saknar `via: Par[]` (EF-krav 1 — fördelningen
kräver i dag en andra fråga) · `KURS_KARTA` hårdkodad tills
basstrukturen byggs · expansionen predikat→par-lista sker i klienten
(EF-krav 3, samma T50-skäl som AND-stödet).

## Relaterat

- [ADR-062](ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) —
  förfinas här (beslut 3, regelspråkets form; andra förfiningen).
- [ADR-064](ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md) —
  första förfiningen (taxonomirymden); medlemskaps-golvet
  `Närvaropoäng=1` ORÖRT av detta beslut.
- [ADR-102](ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md) /
  [ADR-103](ADR-103-promoveringsformen-prototypen-promoveras-skarpa-bygget-avskaffas.md) /
  [ADR-104](ADR-104-godkannande-mekaniken-kanalseparation.md) —
  facit-/promoverings-/stämpel-kontrakten som styr vägen till skarp yta.
- Facit-manifestet
  (`tasks/sessions/bilagor/s104-segment-divergens/facit.json`) — de fem
  EF-kraven + rivningslistan på pass-nivå.
- `docs/research/segment-byggare-branschmonster-2026-08-16.md` —
  research-underlaget för mall-lagret och terminologi-domen.
- T50 (utskicks-härdningen) — lager (b) är skälet till att server-sidan
  äger både expansion och konjunktion.

## Updates

### 2026-08-31 — Domängränsen mot populationer utan deltaganden (S114 våg B-grillningen)

**Beslut (Marcus, S114 Del 3 beslut 2):** regelspråket och
membership-motorn modellerar **deltagarhistorik enbart**. Populationer
utan deltaganden — i dag *Intresserade* (hämtat erbjudande, noll
anmälningar; ORDLISTA § Intresserad) — blir ALDRIG en källtyp i
regelspråket. De nås som **egna publiktyper i utskicksvyn** (först ut:
"Alla intresserade", byggs i 6h/`task-271`:s sändningsdel), serverlöst
ur sina egna läsvägar (`get-leads`).

**Skäl:** en källtyp för "aldrig deltagit" böjer grammatiken runt sin
egen motsats, gör täckningskvittensen suddig (täckning resonerar över
deltagarpopulationen) och inför en permanent specialgren i motor,
server och täckningsmodell. ORDLISTA:ns segment-definition bar redan
gränsen ("medlemskap beräknas on-demand från Deltaganden — aldrig en
lagrad mottagarlista", ADR-062) — detta beslut bekräftar den öppet.

**Decline-rationale (durabel):** alternativet "ny källtyp i
regelspråket" avböjdes efter grillning; det återföreslås inte utan ny
evidens, och rivs i så fall öppet. T35 (winback) är en FRAMTIDA
deltagar-population (avbokade-som-aldrig-deltog) och prövas mot denna
gräns när den designas. Full kontext: sessionsdok S114 Del 3.
