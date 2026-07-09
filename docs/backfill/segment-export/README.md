---
owner: marcus803
updated: 2026-07-09
review_by: 2026-10-09
status: stable
---

# Segment-export — reproducerbara skript (Session 60)

Beräknar de fyra material-listorna + Skool-unionen **källäst** ur Deltaganden.
Skripten bevaras här för att exporten ska kunna återskapas; **CSV-utdata
committas ALDRIG** (bär 416 deltagares e-postadresser).

## Kör

```bash
AIRTABLE_API_KEY=<pat> node segments.mjs   # läser basen → segment-export.json
node export.mjs                            # → lista-*.csv (materiallistor + union)
SKOOL_OUT=~/Downloads/skool-export node skool-partition.mjs
```

`skool-partition.mjs` producerar den faktiska leveransen: **8 partitionerade
Skool-filer** (varje person i exakt en) + **2 disjunkta Resend-listor**. Den
**fäller med exit 1** om någon person hamnar i två filer eller om partitionen inte
är exakt lika med unionen.

**Varför partition:** Marcus laddade upp samma adress tre gånger i Skool och fick
tre inbjudningsmail — Skool dedupar inte och sätter åtkomst per uppladdning. Med
överlappande listor hade de 126 personer som gått flera kurser fått flera
inbjudningar var. Segment-modellen i basen är oförändrad (överlappande); det är
*leveransen* som partitioneras.

**Skool-filformatet** matchar Skools egen mall: ingen rubrikrad, en adress per rad,
ingen avslutande radbrytning. Följd: `cat skool/*.csv` klistrar ihop filgränserna —
läs en fil i taget om du vill räkna.

## Vad som är kanoniskt här

- **Källfrågan replikerar `supabase/functions/_shared/segment-resolution.ts` exakt:**
  Deltaganden filtrerade på `{Närvaropoäng}=1`, fälten `Person (länk)` /
  `Kursnamn (lookup)` / `Event typ`. Ingen rollup läses (fälla 32 — `Fjärrskådning ×`
  blandar Utbildning och Föreläsning).
- **Par-set per person** ⇒ Dag 1 + Dag 2 kollapsar; en person räknas en gång.
- **Taxonomin enumereras ur datan**, aldrig hårdkodad (ADR-064 beslut 2). Kursnamnen
  i basen är `Resor i medvetandet 1/2`, inte kortformen `RIM 1/2`.
- **Dedup-vid-utskick** på normaliserad e-post (`segment-arkitektur.md`).
- **Testartefakter identifieras via ORPHAN-egenskapen** (saknad `Anmälan`-länk), aldrig
  via adress-match — se [fälla 44](../../reference/data-model.md) och
  [`testkonton.md`](../../reference/testkonton.md). `TESTKONTON`-listan i `export.mjs`
  är ett **skyddsnät, inte en vägg**: verifierat 2026-07-09 att en körning utan den ger
  identiska listor, eftersom testartefakternas Deltaganden är `Ej avstämt`.

## Konvention

Referera personer med `recXXX`, aldrig med e-postadress — även i kommentarer (tråd **T73**).

## Utdata 2026-07-09

| Lista | Mottagare |
|---|--:|
| Resor i medvetandet 1 | 310 |
| Fjärrskådning | 134 |
| Resor i medvetandet 2 | 85 |
| Psionautics | 77 |
| Skool-union (access-grant) | 416 |

Enda exkluderade: två äkta testartefakter (`recIynU41be2DcYup`, `rec3iFLEHuRHl1QZH`) och
en person utan e-postadress (`recsqD7ZxM6c13KbC`). 186 av 416 saknar namn i basen (fälla 43).
