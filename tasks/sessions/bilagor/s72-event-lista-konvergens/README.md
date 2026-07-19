# s72-event-lista-konvergens — bedömningsunderlag (T66-instansiering 3)

Konvergens-passet på event-listan (S72; grillad samsyn = sessionsdok
`2026-07-19-session-72.md` Del 2). Skärmdumpar tagna på 390×844
(mobilformen), demo-data. Återupplivningsvägen: varje läge bär sin
[PROTOTYPE]-commit-SHA — koden kan återuppstå ur git-historiken.

## Divergens-valet (2026-07-19)

Två varianter byggda på Marcus-beslut mitt i konvergensen (divergens-
återupptag; A var grillade baslinjen):

| Läge | Fil | Commit | Utfall |
|---|---|---|---|
| Variant A steg 1 — FK-raden (tre textrader, badge vid avvikelse) | `variant-A-steg1.png` | `a32c2c0` (K4) | FÖRLORARE |
| Variant B steg 1 — Hem-kortets grammatik (dagar-kvar-pill, ikonrader, långdatum, guldstapel) | `variant-B-steg1-guldstapel.png` | `7bb2a55` (K5) | **VINNARE** — Marcus: "Jag tycker variant B är bättre" |

Motiv-anteckning: B:s rikare kort-hierarki vann över A:s kompakta
FK-rad; jämförelsepunkten informationstäthet vs skanningsbarhet föll åt
B:s håll.

## Konvergens-iterationer på B (vinnaren)

- **Steg 2 — LÅST 2026-07-19** (Marcus: "Vi låser detta so far … ser
  bra ut"): `variant-B-steg2-slotmodellen-LAST.png`. Innehåll (commits
  `70f9d5e` → `26bacb6` K7 → `aee2982` K8): dämpat grå stapel
  (neutral-400; guld→grå→dämpad i två Marcus-drag) · hover-bakgrund
  (bg-emphasized, motion-safe; nytt beslut för kort-klassen — NavCards
  M3-avslag gällde Mer-raderna) · **slot-modellen**: likformiga kort
  (alla rader alltid, platshållare, 2-raders rubrik-reserv) ·
  badge-formen PRÖVAD OCH RIVEN (K7-badgarna förkastade av Marcus —
  vertikal stapling + badge-formen i sig) · semantisk status-slot
  topp-höger (Inställt/Flyttat ERSÄTTER dagar-kvar) · Inställt =
  dimmat kort + genomstruken rubrik + slot-text · Fullbokat = grön
  kontur + grön stapel (texten bär, färgen förstärker) · "bor
  över"-raden (BedDouble + antal; FÄLTET FINNS EJ I BASEN — PRD-krav:
  additivt bas-fält + EF-/modell-utökning). Steg 1-snapshotten hålls
  EJ växlingsbar (badge-formen är riven, jämförelsevärdet lågt — git
  och skärmdumparna bär historiken).

- **Steg 3 — KALENDERVYN LÅST 2026-07-19** (Marcus: "Toppen, vi låser
  kalendervyn här"): `variant-B-steg3-kalendervyn-LAST.png`
  (månadssummeringen) + `…-dagval.png` (vald dag). Commit-trail
  `8e7f2d9` (K9 RAC-motorn + FK-skinnet) → `9e2b82d` (K10
  vy-ikon-toggeln ÖVER period-toggeln, lista förvald, fast position =
  sömlös växling) → `4dd3322` (K11 kursfärgade dagar + legend +
  fre–lör-spann) → `bdd0cd0` (K12 SOLIDA 500-tiles == legend-kulören
  exakt [FK-precedent IMG_1596] + månadssummeringen/agenda-hybriden) →
  `c61a4b3` (K13 copy: "Annat" · "Juli" · korta kursnamn) → `90d1811`
  (K14 vertikala kursfärgs-streck i raderna, prickarna legendens).
  Formen: månadsnav ersätter period-toggeln i kalenderläget ·
  kursfärgerna Fjärrskådning=blå, RIM 1=grön, RIM 2=koppar,
  RIM 3=röd, Annat=grå (500-kulören; ≤5–7-riktvärdet) · dag-tryck →
  dagens kort i B-formen + "Visa hela månaden"-retur · vald dag =
  guld + mörk ring. ÖPPET BOKFÖRT till skarpa skivan: veckonummer-
  kolumnen (FK har den) utelämnad — aldrig efterfrågad i konvergensen ·
  namn-matchningen är demo-mekanik (skarp form = ADR-064-taxonomin) ·
  kursfärgerna behöver semantiska tokens · RAC Calendar = ny
  biblioteks-yta (minimaltest gjord i prototypen, bevisad).

## FACIT — deklarerat 2026-07-19

Marcus: **"Facit, vi låser hela event-listans yta."** Skärmdumpar:
`FACIT-listvyn.png` + `FACIT-kalendervyn.png` (demo-data, 390×844).
Helheten = vy-ikon-toggeln (lista förvald) · period-toggeln ·
månadsgrupper · B-kortens slot-modell (Steg 2) · kalendervyn med
kursfärger + månadssummering (Steg 3) · strukturerat text-tomläge ·
`?period`-kontraktet. Skarpt byggda i sessionen (utanför prototypen):
scrollbar-formen (`efeb288`: lg-scopad `stable both-edges` + diskret
thin-tumme, `--mm-scrollbar-thumb`).

Prototypens lifecycle (throwaway-kontraktets klausul v, öppet
triageat): prototypen BEHÅLLS aktiv över sessionsgränsen som
konvergens-substrat för resten av event-familjen — S73 tar
EVENTSIDAN (detaljvyn, Marcus-deklarerad riktning) och ärver
mönsterbesluten. List-PRD:ts födelsetidpunkt är ÖPPEN (S73-start
eller efter familje-konvergensen — Marcus-val i S73). Riven blir
prototypen först vid skarpa byggets start (klausul iv oförändrad:
NYSKRIVEN implementation, koden absorberas aldrig).
