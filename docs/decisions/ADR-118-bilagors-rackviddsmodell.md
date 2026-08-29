# ADR-118: Bilagornas räckviddsmodell — en räckvidd per bilaga, kurstyp ärver framtida event

- **Status:** Accepted (S107-grillningen 2026-08-17, Marcus slutkvittens
  "Yes, kvitterar")
- **Datum:** 2026-08-17
- **Rör:** `Bilagor`-tabellen (prod + staging) · Dokument-ytan ·
  `get-event-attachments`/`upload-attachment`-familjen · Åtgärds-sidans
  bilageväljare · `ORDLISTA.md` § Bilaga + Gemensam bilaga
- **Numreringsnot:** ADR-116 är fortsatt reserverad av S102:s numreringsrad
  och aldrig mintad; 117 är förbrukad. Detta kort tar därför 118 — samma
  medvetna lucka som ADR-117 bokförde.

## Kontext

Dokument-ytan byggdes medvetet event-scopad (S102, `task-147`-kedjan):
varje bilaga laddas upp mot exakt ett event, och adaptern har ingen
"alla bilagor oavsett event"-metod — filhuvudet i ytans komponent bokför
det som avsiktlig avgränsning, inte förbiseende. Men Roger & Lottas
verkliga bestånd är till stor del statiska standarddokument (hörlursinfo,
meny — ordlistans egna klass A-exempel) som gäller varje event av en
kurstyp. Per-event-uppladdning betyder samma fil om och om igen, och ett
byte måste göras en gång per event i stället för en gång totalt. Frågan
om delning över event hade aldrig designats, beslutats eller deferrats
(S107-utredningen 2026-08-17: obruten mark — noll träffar i docs/,
tasks/, backlog/). Samtidigt landade `Kursfamilj`/`Kursnivå` som riktiga
dimensionsfält på Eventplanering i S104 (ADR-115-sfären) — basen bär
alltså redan kurstyps-dimensionen som räckviddsmodellen behöver.

## Beslut

1. **Varje bilaga bär exakt EN räckvidd** (radioval vid uppladdning,
   aldrig kombinerbart): **Event** (dagens koppling) · **Kurstyp**
   (`Kursfamilj` obligatorisk + `Kursnivå` valfri — tom nivå betyder hela
   familjen; nivålösa familjer lämnar alltid nivån tom, samma regel som
   eventen) · **Alla event**.
2. **Ett events dokumentmängd är unionen av tre mängder**: eventets egna +
   kurstyps-matchande + alla-event. Gemensamma bilagor visas
   **sammanflätade med räckviddsbadge** i eventets dokumentlista och i
   Åtgärds-sidans bilageväljare — de bara finns där, utan handpåläggning.
3. **Ersätt/radera görs ENDAST i bilagans räckviddsläge** på Dokument-ytan.
   Ur ett enskilt events kontext är gemensamma bilagor läsbara och
   bifogbara, aldrig raderbara — badgen bär förklaringen. Skälet är
   olycksskyddet: att "städa ett events lista" får aldrig radera
   kursfamiljens dokument överallt. Behov av event-undantag är signalen
   att bilagan egentligen ska vara event-specifik.
4. **Basform: nya fält på befintliga `Bilagor`** — `Räckvidd`-select
   (Event / Kurstyp / Alla event) + `Kursfamilj`/`Kursnivå` med samma
   valslag som Eventplanering. Ingen ny tabell. `Dokumentklass` (A/B/C)
   förblir **ortogonal**: klassen beskriver innehållets ursprung,
   räckvidden beskriver spridningen.
5. **Administration i Dokument-ytan** (utbyggd, inte klonad — ett hus för
   alla dokument): räckviddsval i befintliga uppladdningsflödet + ett läge
   som visar gemensamma dokument utan valt event. **Initialbeståndet**
   laddas upp av Marcus via det nya flödet — den uppladdningen ÄR
   QA-vandringen.

## Alternativ som vägdes

- **Manuell multi-event-länkning** (`Bilagor.Event` är redan tekniskt
  multi-link): förkastad som huvudmodell — inget arv till framtida event,
  per-event-slitet återuppstår i ny kostym. Kvarstår tekniskt som
  event-räckviddens mekanism med en länk.
- **Separat tabell/yta för globala dokument**: förkastad — två
  sanningskällor och två snarlika ytor för samma sak.
- **Enbart global räckvidd utan kurstyp**: förkastad — ingen granularitet
  ("bara RIM-kurser") utan en tredje mekanism ovanpå.

## Konsekvenser

- (+) Byt en gång, effekt överallt — även kommande event: arvet går via
  dimensionen, ingen länk-administration per nytt event.
- (+) Modellen talar basens redan beslutade dimensionsspråk (ADR-063:
  resolution i basen; ADR-115-fälten återanvänds i stället för att ett
  nytt begrepp uppfinns).
- (−) Union-hämtningen gör dokumentlistan beroende av att eventens
  `Kursfamilj`/`Kursnivå` är satta — redan ett S104-krav, men nu bär det
  ytterligare en konsument.
- (−) Raderingsskyddet tar bort en frihet ur eventkontexten — medvetet:
  olycksskyddet väger tyngre än symmetrin.

## ADR-bar

Alla tre villkor håller: (1) räckviddsmodellen är ett konventionslås som
dokumentflöden, EF-kontrakt och basstruktur byggs ovanpå — svår att
återställa i koherens; (2) union-semantiken och raderingsskyddet är
överraskande utan denna kontext; (3) tre genuina alternativ vägdes och
förkastades av konkreta skäl.

## Updates

### 2026-08-29 — Beslut 1/4/5 ersatta av tre-axel-modellen; beslut 2 amenderat (pillen bort ur Åtgärds-sidan); beslut 3 gäller vidare

**TASK-338.5.** Grillningen S108 Del 2 § D (frågorna 4 och 9) beslutade
räckvidden om till ett AND-filter över tre kombinerbara axlar — Familj ·
Event · Plats — och det beslutet kvitterades i
[ADR-125](ADR-125-bilagornas-modell-och-promoveringsvag.md) § Beslut 1
("räckvidden bär tre axlar"). Beslutet nådde aldrig koden förrän
`TASK-338` (PRD: Platsbundna delade bilagor, forensiken 2026-08-29, S113):
appen, EF-kontrakten och basen implementerade fram till dess fortfarande
denna ADR:s ursprungliga modell rakt av.

- **Beslut 1 (exakt EN räckvidd, radioval Event/Kurstyp/Alla event) —
  ERSATT.** Räckvidden är sedan ADR-125 § Beslut 1 ett filter över tre
  VALFRIA, kombinerbara axlar (Familj · Event · Plats — familjen kan smalnas
  till ett Steg); en tom axel begränsar inte, och "inga axlar satta" är den
  nya formen av "alla event". Lagringsformen: `Bilagor.Räckvidd` fick en
  fjärde option **"Gemensam"** som ersätter (inte kompletterar) de gamla
  "Kurstyp"/"Alla event"-valen, plus en ny länk `Bilagor.Plats` → `Platser`
  och ett lookup-fält `Bilagor.Platsnamn`. Kedjan: S108 Del 2 § D →
  ADR-125 § Beslut 1 → `TASK-338`.
- **Beslut 4 (basform: `Räckvidd`-select Event/Kurstyp/Alla event +
  Kursfamilj/Kursnivå, ingen ny tabell) — ERSATT** av samma tre-axel-form:
  `Kursfamilj`/`Kursnivå` återanvänds oförändrade, men bär nu bara TVÅ av
  tre axlar; `Plats`-länken är den tredje. Ingen ny tabell tillkom heller
  här — additivt på samma `Bilagor`-tabell (ADR-063).
- **Beslut 5 (administration i Dokument-ytan: räckviddsval i
  uppladdningsflödet + ett läge som visar gemensamma dokument) — ERSATT** i
  sin KONKRETA form (radioval blir tre valfria Select-fält: Familj/Steg/
  Plats), men principen — utbyggd Dokument-yta, ett räckviddsläge för
  gemensamma dokument, inget klonat hus — gäller oförändrad.
- **Beslut 2 (unionen av tre mängder, gemensamma bilagor "sammanflätade med
  räckviddsbadge … i Åtgärds-sidans bilageväljare") — AMENDERAT, inte
  ersatt.** Unionssemantiken (eventets egna + gemensamma bilagor i
  dokumentlistan) gäller vidare, bara mängderna är nu två i stället för tre
  (eventets egna + `Räckvidd ≠ Event`, matchade i kod — `TASK-338.2`). Men
  räckviddsbadgen visas INTE längre i Åtgärds-sidans bilageväljare — Marcus
  röktest 2026-08-29 ("blir inte snyggt", bokfört i `TASK-339`, landad
  `PR #2082`, `main 51e22c69`). Badgen kvarstår i Dokument-ytans
  listor, där den förklarar varför en delad bilaga inte går att radera från
  ett enskilt event (beslut 3).
- **Beslut 3 (ersätt/radera endast i räckviddsläget, olycksskyddet) —
  GÄLLER VIDARE, oförändrat.** Ingen del av tre-axel-modellen eller
  badge-amenderingen rör raderingsskyddet.

Fältmodell, matchningsregel och legacy-toleransen (skrivvägen accepterar
fortfarande "Kurstyp"/"Alla event" och mappar dem till "Gemensam") är
detaljerade i [ADR-125](ADR-125-bilagornas-modell-och-promoveringsvag.md)
§ Updates 2026-08-29 och `data-model.md` § "Bilagornas Gemensam-räckvidd —
Plats-axel". `ORDLISTA.md` § Räckvidd/§ Gemensam bilaga bär den kanoniska
vokabulären (värdet "Gemensam", badge-formerna).
