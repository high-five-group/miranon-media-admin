---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: stable
lifecycle: active
---

# T170 — Rogers kvittoförlaga besvarar tre öppna punkter i kvittospåret

> Registrerad i S108 (2026-08-22) när Marcus pekade ut
> `~/Desktop/Miranon Media/exempelpdokument/` och en av filerna visade sig
> vara ett SKARPT kvitto ur Rogers fakturasystem. **`active`** — två av
> posterna rör kod som i dag skulle skicka platshållartext till en kund.
>
> **Numret blev 170, inte 169.** T169 hann tas av en parallell session
> (S109:s CLS-tråd) mellan min mätning och min skrivning. Mätningen läste
> FILNAMN i `tasks/threads/`; den andra sessionens rad fanns bara i registret.
> Exakt den kollisionsklass `CLAUDE.md` § Kortnummer beskriver — rättad genom
> omnumrering, aldrig genom att röra den andres rad.

## Vad som faktiskt lästes

`2026-08-03 Ulrika Berge.pdf` (A4, `Creator: PowerPoint`, Quartz PDFContext).
Läst med `pdftotext -layout`. Ett riktigt kvitto för en genomförd utbildning,
inte ett utkast.

## Post 1 — MOMSSTATUSEN ÄR BESVARAD AV DOKUMENTET (kräver kvittens)

[`ADR-109`](../../docs/decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
beslut (c), verbatim: *"MOMSRADEN UTELÄMNAS — öppen Roger-punkt, momsstatus
måste bekräftas innan kvitton går skarpt till kunder."*

Rogers kvitto redovisar moms öppet:

```text
Netto        Exkl. moms    Moms      Öresavr              BETALT
2 000,00     2 000,00      500,00    0,00          SEK    2 500,00
```

500 / 2 000 = **25 %**. Sidfoten bär `Momsreg.nr. SE559540549801` och
**Godkänd för F-skatt**.

**Detta STÄNGER inte punkten av sig självt.** Ett dokument visar vad Rogers
system gjorde för EN post; att momssatsen gäller alla eventtyper — och att
appens kvitton ska redovisa den likadant — är Marcus och Rogers att kvittera.
Men premissen "momsstatus är okänd" håller inte längre, och det var den som
motiverade utelämnandet.

## Post 2 — ORG-UPPGIFTERNA FINNS (appen skulle i dag skicka hakparenteser)

`supabase/functions/_shared/receipt-content.ts` rad 22–26:

```ts
export const MIRANON_ORG_PLACEHOLDER = {
  namn: 'Miranon Media',
  orgnummer: '[ORGANISATIONSNUMMER EJ BEKRÄFTAT — se ADR-109 § Öppna punkter]',
  adress: '[POSTADRESS EJ BEKRÄFTAD — se ADR-109 § Öppna punkter]',
};
```

Kvittots sidfot ger båda, och mer:

| Fält | Värde ur förlagan |
|---|---|
| Firma | **Miranon Media AB** (inte "Miranon Media") |
| Organisationsnr | 559540-5498 |
| Postadress | Uttringe Hages väg 17, 144 63 Rönninge, Sverige |
| Momsreg.nr | SE559540549801 |
| Plusgiro | 216 10 05-0 |
| Swish | 123 061 65 08 |
| Webb | `www.miranon.se` |
| E-post | `roger@outsidereality.se` · `lotta@outsidereality.se` |
| Telefon | 070-88 58 021 · 070-635 45 85 |

**Bonusfynd:** `Uttringe Hages väg 17, 144 63 Rönninge` är exakt den adress
sessionsdokets Del 2 § B bokförde som *"bor i Rogers PowerPoint och nås av
ingen generator"* — den som gjorde `{{plats}}` körbar-lös även för Rönninge.
Den har nu en läsbar källa.

Uppgifterna ska ändå kvitteras av Marcus innan de skrivs in — en firma-
ändring (`AB`) och ett organisationsnummer är inget en agent gissar sig till
ur ett enda dokument.

## Post 3 — FORMEN skiljer sig mer än innehållet

Vårt kvitto (`kvittoRader()`, samma fil) är **åtta textrader**. Rogers är ett
strukturerat dokument:

- Referensblock: `Vår referens` · `Er referens` · `Förfallodatum` · `Vårt ordernr`
- Separat `Fakturaadress`-block med kundens e-post
- **Radtabell**: `Benämning | Antal | Enhet | A-pris | Summa`
- **Summeringsrad**: `Netto | Exkl. moms | Moms | Öresavr | SEK | BETALT`
- Fyrkolumns sidfot med adress, telefon, betalvägar och skatteuppgifter

Benämningen bär dessutom eventets datum inuti sig:
*"Utbildning, 2026-07-25,26 personlig utveckling, meditation"*.

Noterat, ej beslutat: `Förfallodatum` på ett KVITTO (värde `-`) tyder på att
Rogers system använder samma mall för faktura och kvitto. Att ärva det fältet
till appens kvitto vore att ärva en artefakt, inte en avsikt.

**Nummerserien bekräftar däremot `ADR-109` beslut (b) skarpt:** Rogers nummer
är `32771-26` (`<löpnr>-<år>`), vårt `MM-2026-1001`. Serierna är visuellt
oförväxlingsbara, vilket var hela poängen.

## Varför tråd och inte åtgärd nu

Blockerar inte pågående arbete (kvittots form väntar ändå på Marcus dom om
vilken av Rogers delar som ska ärvas). Värdefullt och lätt att tappa — därför
registrerat i stället för att bäras i en sessions minne (ADR-053).

## Nästa steg

1. Marcus/Roger kvitterar momssatsen och att appens kvitton ska redovisa moms.
2. Marcus kvitterar org-uppgifterna → `MIRANON_ORG_PLACEHOLDER` ersätts och
   `ADR-109` § Öppna punkter amenderas.
3. Formfrågan (vilka av Rogers block appens kvitto ska bära) tas när
   förhandsgransknings-researchen landat — den avgör hur kvittot visas.
