# Exempelfiler — Handelsbankens Swishrapport (CSV)

> Del av research-passet
> [`swish-rapport-exportformat-2026-08-30.md`](../swish-rapport-exportformat-2026-08-30.md).
> Filerna här är hämtade direkt från Handelsbankens egen webbplats
> 2026-08-30 (`curl`, verifierad HTTP 200 + `Content-Type`) — INTE
> handskrivna eller gissade. De beskriver **Handelsbankens** format.
> Miranon Media Admins bank är obelagd i detta pass (se huvuddokumentets
> § Vad jag inte kunde belägga) — filerna är alltså en konkret,
> verifierad ARTEFAKT av hur en svensk storbank löser samma problem, inte
> ett facit för Lottas egen bank.

## Källa

Handelsbanken, sidan
["Other/local file formats – corporate payments"](https://www.handelsbanken.com/en/our-services/digital-services/global-gateway/local-formats),
läst 2026-08-30. Sidan listar nedladdningsbara PDF-specifikationer och
exempelfiler för samtliga lokala filformat banken stödjer för
företagskunder, inklusive Swish. Varje fil nedan hämtades från bankens
egen dokumentserver (`www.handelsbanken.com/tron/xgpu/info/contents/v1/document/<id>`)
med `curl`, och `Content-Type`-headern verifierades (`application/pdf`
respektive `text/plain`) innan filen sparades.

## Filerna

| Fil | Innehåll | Dokument-ID hos Handelsbanken |
|---|---|---|
| `handelsbanken-formatbeskrivning-swishrapport-sv-v3.1.2.pdf` | Fullständig formatspecifikation, svenska, version 3.1.2 (publicerad 2024-06-05) | `72-111525` |
| `handelsbanken-implementation-guide-swishreport-en-v3.1.3.pdf` | Samma specifikation, engelska, version 3.1.3 (publicerad 2024-06-05) | `72-111526` |
| `handelsbanken-swishrapport-kommaseparerad-daglig.csv` | Exempelfil, dagsrapport, kommaseparerad | `72-111551` |
| `handelsbanken-swishrapport-semikolonseparerad-daglig.csv` | Exempelfil, dagsrapport, semikolonseparerad | `72-111552` |
| `handelsbanken-swishrapport-kommaseparerad-intradag.csv` | Exempelfil, intradagsrapport, kommaseparerad | `72-111553` |
| `handelsbanken-swishrapport-semikolonseparerad-intradag.csv` | Exempelfil, intradagsrapport, semikolonseparerad | `72-111554` |

CSV-filerna är exakt de bytes Handelsbanken publicerar som exempel (388–395
byte var) — testdata med fiktiva personer ("Anna Swish", "Sven Svensson"),
inte verkliga transaktioner. De speglar formatet som beskrivs i PDF:en:
tre posttyper (`01` startpost, `02` informationspost — en rad per
Swish-transaktion, `03` slutpost), där varje informationspost bär
kontoägarens organisationsnummer, kontonummer, BIC, Swish-nummer,
transaktionsdatum, transaktionstyp (`SWH`/`SWR`/`SWT`/`SWU`/`SWZ`),
belopp, valuta, **mobilnummer**, **namn**, **betalningsreferens** (unik,
satt av Getswish/Riksbanken), **meddelande**, Order ID, tidsstämpel,
bokföringsdatum, Instruction ID och End to End ID. Full fältlista med
exempelvärden och kommentarer: huvuddokumentets § 2 (delfråga 2).

## Vad filerna INTE visar

- Hur Swedbanks, Nordeas, SEB:s, Danske Banks eller Länsförsäkringars
  motsvarande rapport ser ut — ingen av dessa banker publicerar en
  motsvarande öppen specifikation eller exempelfil (sökt men inte
  hittad, se huvuddokumentets § Vad jag inte kunde belägga).
- Hur Miranon Media faktiskt tar emot sin Swish-rapport i dag — Lottas
  bank är okänd i detta pass.
