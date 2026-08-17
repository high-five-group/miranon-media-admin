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
