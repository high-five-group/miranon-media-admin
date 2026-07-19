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

Nästa öppna spår: kalendervy-frågan (vy-växling lista ↔ kalender,
FK-kalenderns form IMG_1590-serien) — Marcus-väckt vid steg 2-låset.
