---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: stable
lifecycle: paused
---

# T172 — Facit-regimernas täckning: de stämplade referenserna är inte wirade till någon vakt

> Registrerad i S111 (2026-08-22) på Marcus order (*"Ja!"* → *"A alltså"*),
> ur `TASK-292`:s grillning. Marcus utlösare, ordagrant: *"vi borde ju för
> tusan ha bildbaslinjer för alla facitstämplade ytor. Det är väl det som är
> hela grejen."* **`paused`** — den blockerar inte `TASK-292` och körs efter
> S111; mätningen registreras nu medan den är färsk.

## Vad som är mätt (2026-08-22, `origin/main` `3849ac5a`)

`bash scripts/check-facit.sh` → exit 0, slutraden verbatim:

```text
✅ Facit-manifest OK: 12 manifest, 27 ytor deklarerade, 0 ogodkända.
   Innehållslås (invariant d): 11 referenser låsta mot sha256 i stämplade
   manifest; 24 stämplade ytor saknar "referenser" och är därmed INTE
   innehållslåsta.
```

Tre artefakter blandas rutinmässigt ihop. De gör olika saker och har olika
täckning:

| Artefakt | Var | Täckning | Vad den fångar |
|---|---|---|---|
| **Facit-bilder** | `tasks/sessions/bilagor/*/facit.json` | **12 av 27 ytor** | vad Marcus sa ja till, som PNG |
| **Innehållslås** (sha256) | samma manifest, fältet `referenser` | **3 av 27 ytor** | att referensen inte ändras i smyg |
| **Pixel-baslinjer** | `tests/visual/__screenshots__/` | **6 vyer** | att den KÖRANDE appen inte driver |

Pixel-baslinjerna finns för `event-anmalda`, `event-lista`, `eventsida`,
`hem`, `mer-anmalningar`, `personer`. Överlappet mot facit-stämplade ytor är
**två** — Hem och personlistan. De fyra övriga vaktar ytor som **inte** är
facit-stämplade.

**Vakten pekar alltså till stor del bort från det den ska skydda.**

## Fyndets kärna — regimskillnaden, inte en lucka

15 av 27 ytor bär `bilder: []`. Det är **inte** försummelse utan en
deklarerad frånvaro (`check-facit` invariant b), och persondetaljens manifest
säger varför, verbatim:

> *"VILKA BILDER SOM ÄR FACIT: INGA — bildlistan är tom med avsikt, en
> deklarerad frånvaro (check-facit invariant b). … DET MEKANISKA FACIT är
> ariaSnapshot-referenserna under
> `tests/visual/__aria__/persondetalj-promoverings-grind.spec.ts/`"*

Samma val för segment-familjen (7 ytor), åtgärdssidan (3 ytor) och delar av
hållplats-prototypen.

**Konsekvensen är den som gör tråden värd att registrera:** ARIA-snapshots
fångar tillgänglighetsträdet — roller, namn, struktur. En marginal som går
från 16 px till 32 px rör dem inte alls. Persondetaljen och check-in har
därmed ett mekaniskt facit som per konstruktion inte kan se visuell drift.

Det upptäcktes när Marcus frågade hur `TASK-292`:s sidram-byte skulle
påverka just de två ytorna — och riggen inte kunde svara.

## Vad tråden ska leverera

1. **Karta över alla 27 ytor:** vilket regim var och en bär i dag
   (bild-facit · ARIA-facit · innehållslåst · pixel-baslinje), och vilket
   den BÖR bära. Regimvalet är per yta — en tidslinje och en kortlista har
   inte samma behov.
2. **Avgör regimbytet.** Att lyfta 15 ytor från ARIA- till pixel-regim är
   ett regimbyte, inte städning. Marcus-beslut, per yta eller per klass.
3. **Wira referenserna till vakten.** Kärnan i Marcus invändning: en stämplad
   PNG i en bilage-katalog jämförs aldrig mot den körande appen. Antingen
   får de stämplade referenserna en automatisk motsvarighet i
   `tests/visual/__screenshots__/`, eller så får `check-facit` en
   jämförande gren.
4. **Innehållslåset:** 24 av 27 ytor saknar `referenser` och är inte
   sha256-låsta. Avgör om fältet ska vara obligatoriskt för ett stämplat
   manifest.

## Avgränsning

`TASK-292`:s eget steg 3 — pixel-baslinjer för de fyra ytor det passet rör
(`PersonDetail`, check-in/dörrlistan, `AktivitetsHistorik`, `DokumentYta`) —
ingår i det passet och står kvar oavsett vad denna tråd landar i. Tråden
äger de ÖVRIGA ytorna och den principiella regimfrågan.

## Öppet

- Punkt 1–4 ovan. Punkt 1 är ett mät-/kartläggningspass; punkt 2 och 4 är
  Marcus-beslut; punkt 3 är bygge.
- Bärare: `TASK-297`. (Numret blev 297, inte 295 som re-deriveringen vid
  sessionsstart gav — `check_active_branches` fann 295 och 296 tagna på
  andra grenar vid allokeringen. Tredje serie-rörelsen samma dag.)
