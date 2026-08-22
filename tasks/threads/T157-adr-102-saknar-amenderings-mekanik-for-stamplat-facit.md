---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-21
status: stable
lifecycle: closed
---

# T157 — ADR-102 saknar amenderings-mekanik för ett stämplat facit

> **STÄNGD 2026-08-22** av
> [`ADR-102` § Updates 2026-08-22](../../docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md#2026-08-22--amenderings-mekaniken-för-ett-stämplat-facit-t157).
> Amenderingen besvarar trådens fyra frågor nedan: A1 ger de tre klasserna
> (a/b/c), A2 klassningens bar och eskaleringsregeln, A3 den kanoniska
> sidofils-formen — kanoniserad mot de FEM `AMENDERING-*.md` som redan fanns
> i repot — och A4 hur B1/B5 ska läsas för en yta som växer. Mekaniserat i
> samma landning: `check-facit.sh` invariant (d) (innehållslås av en stämplad
> ytas deklarerade referenser, tvåsidigt bevisad) och ett sant neka-skäl i
> `deny-facit-godkand-skrivning.sh`. Vad som INTE mekaniserades står i A6.
>
> Registrerad i S109 (2026-08-21) på Marcus order (*"OCH regga tråden om
> luckan."*). Avtäckt i `/to-prd`-passets första steg — utforska repot innan
> syntes — som blockerade kortskrivningen. Triagerad enligt `ADR-053`:
> blockerar inte längre (Marcus valde väg för DENNA yta), men den generella
> mekaniken är fortfarande oskriven och nästa yta möter samma sak.

## Vad som saknas

`ADR-102` reglerar hur man **bygger** mot ett facit och **när prototypen får
rivas**. Den säger ingenting om hur ett **stämplat** facit amenderas när en ny
funktion medvetet läggs till ytan.

`ADR-103` reglerar promoveringen från prototyp till skarp yta — alltså vägen
IN. Inte vad som händer efteråt när ytan ska växa.

Mellan dem finns ett hål: **en godkänd yta kan inte utvecklas vidare utan att
någon bryter ett lås, och ingen text säger vem som får göra det eller hur.**

## Instansen som avtäckte den

`tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json` bär en
fullständig stämpel:

```json
"godkand": { "av": "marcus", "datum": "2026-08-10",
             "citat": "Ser bra ut, godkänner",
             "sha": "4ebdcfc85a78df14c47cff058472d1b4da0d8adf" }
```

`tests/visual/personer-promoverings-grind.spec.ts` beskriver sig själv i
klartext som **REGRESSIONSLÅS** — *"att ytan fortsätter rendera exakt den
låsta formen, för alla framtida ändringar i `PersonsList.tsx`"*.

Grinden ankrar på `[data-testid="personer-yta"]`, och referensernas första nod
är `- searchbox "Sök person"` följd av `- status`. Ett bokstavsindex **under
sökrutan** landar bokstavligen mellan de två noderna, och fäller därmed
**samtliga sex** referenser (listläge · sökning med träff · tomläge × desktop +
mobil).

**Låset gör exakt rätt.** Problemet är att det inte finns någon dokumenterad
väg förbi det när förändringen är avsiktlig och godkänd.

## Den skarpaste formuleringen av problemet

`ADR-102` B1, verbatim:

> *"Vid motsägelse mellan prototyp och kravtext vinner prototypen, och
> kravtexten är buggen."*

Bokstavligt läst gör den regeln **varje ny funktion på en låst yta till
"buggen"**. Det är uppenbart inte avsikten — B1 skrevs om att bygga en yta
till dess låsta form, inte om att frysa den för all framtid — men texten säger
det ändå, och en agent som läser den i god tro landar fel.

`ADR-102` B5 skärper knuten: acceptanskriterier ska ha formen *"ytan är
identisk med prototypen i läge X"*. För en tillagd funktion finns inget X att
peka på förrän facit amenderats — alltså kan kortet inte ens skrivas först.

## Vad Marcus beslutade för DENNA yta (2026-08-21)

Väg **A — additiv amendering**, av tre framlagda:

- **A (vald):** bokstavsraden behandlas som ett tillägg **ovanför en orörd
  lista**. Ingen av de formbeslut facit faktiskt låser (tonal kortyta,
  `divide-y`, låst radhöjd, statuskolumnen med reserverad plats, e-postraden,
  4 px före interaktionsraden) rörs. Marcus godkänner raden visuellt, och
  **först då** regenereras de sex ARIA-referenserna i egen commit, med hans
  citat inskrivet i `facit.json` som daterad amendering.
- **B (ej vald):** fullt konvergens-pass per `ADR-103`. Bedömdes som ceremoni
  över vad en tillagd rad kräver — precis det över-engineering-vakten skär.
- **C (avrådd):** låt bygget regenerera referenserna själv. Då återställs låset
  av samma PR som bröt det, och låset kan per definition aldrig fånga den
  förändring det finns för.

**Beslutet gäller instansen, inte klassen.** Nästa låsta yta som ska växa
möter samma fråga utan skriven regel.

## Grannfallet, redan registrerat

`TASK-247`s slutrapport noterar att varken `ADR-102` eller `ADR-103` ger en
mekanik för att amendera ett **låst-men-EJ-stämplat** facit (`lasning` satt,
`godkand: null`) mitt i granskningsfönstret. Detta är den **stämplade**
varianten av samma lucka. De bör lösas ihop, inte var för sig — annars får de
två närliggande tillstånden två olika procedurer av en slump.

## Vad ett beslut skulle behöva täcka

1. **Vem får amendera ett stämplat facit, och på vilken signal?** (Marcus
   citat i manifestet är formen väg A använder — är det den generella regeln?)
2. **Ordningen mellan godkännande och referens-regenerering.** Väg A:s
   enkelriktning speglar promoverings-grindens egen historik: FÖRE-halvan
   låstes i egen commit före flippen, just för att den annars inte hade gått
   att konstruera i efterhand.
3. **Skillnaden mellan additivt tillägg och formändring.** Väg A vilar helt på
   att raden inte rör låsta formbeslut. Vem avgör det, och hur bevisas det?
4. **Hur `ADR-102` B1 och B5 ska läsas för en yta som växer.** B1:s
   "kravtexten är buggen" behöver en gräns; B5:s AC-form behöver ett X att peka
   på.

## Belägg

`docs/decisions/ADR-102-*.md` B1/B5 · `docs/decisions/ADR-103-*.md` ·
`tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json` ·
`tests/visual/personer-promoverings-grind.spec.ts` filhuvud +
`tests/visual/__aria__/personer-promoverings-grind.spec.ts/` (sex referenser) ·
`TASK-247` slutrapport (grannfallet) · S109 Del 4.

## Hur tråden stängdes (2026-08-22)

Beslutet bor i `ADR-102` § Updates 2026-08-22. Tre saker är värda att ta med
in i nästa yta, eftersom de INTE var kända när tråden registrerades:

1. **Frågan "vem får amendera" har ett strukturellt svar, inte ett valfritt.**
   Ett stämplat manifest är agent-fruset i sin HELHET — `ADR-104`-hooken prövar
   det simulerade resultatet av en Edit/Write, och ett stämplat manifest bär
   per definition ett satt `godkand`, så även en ändring som inte rör fältet
   nekas. Mätt 2026-08-22 (exit 2 på en Edit som enbart lade till en nyckel);
   samma utfall bokfört i S106 (*"ADR-104-hooken nekade ×2, korrekt"*).
2. **Bokföringen bor därför i en sidofil**, `AMENDERING-<datum>-<slug>.md`
   bredvid manifestet — en form som redan var etablerad i praktiken (FEM
   filer i repot) men **oskriven**, vilket är exakt varför en agent 2026-08-22
   gick rakt in i hooken i stället för att skriva sidofilen direkt.
3. **Skillnaden ogodkänt/stämplat är inte längre omdöme.** `check-facit.sh`
   invariant (d) innehållslåser en stämplad ytas deklarerade referenser och
   hoppar över låset för ett ogodkänt manifest — precis den gräns S109 drog för
   hand två gånger på ett dygn.

**Kvar efter stängningen, öppet bokfört i `ADR-102` § Updates A6:** klass (b)
mot (c) är konvention utan spärr (domen är Marcus öga), och invariant (d) har
noll levande täckning tills `referenser` deklarerats — 22 av 22 stämplade ytor
saknar nyckeln, och backfillen är ett Marcus-moment eftersom hooken fryser
manifesten. Grinden skriver ut den siffran vid varje körning.
