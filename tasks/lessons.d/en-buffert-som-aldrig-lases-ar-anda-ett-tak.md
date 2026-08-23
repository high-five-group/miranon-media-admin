# En buffert som aldrig läses är ändå ett tak

**Fråga alltid HUR LÅNGT en grind kom innan du frågar vad som är fel med koden.
En grind som föll utan att producera någon utdata föll inte på innehållet — den
föll innan den började.** `[UNIVERSAL]`

Mätt 2026-08-22 (S111), fem fällningar över fyra PR:er.

## Instansen

`scripts/hermetik-sjalvtest.mjs` körde Playwright via `spawnSync` med
`stdio: ['ignore', 'pipe', 'inherit']` och `encoding: 'utf8'`. Det pipade
stdout in i en minnesbuffert mot Nodes `maxBuffer`-default på 1 MB.

**Bufferten lästes aldrig.** Enda referensen till utfallet i hela filen var
`utfall.error`; rapporten kom från fil via `PLAYWRIGHT_JSON_OUTPUT_FILE`, och
skriptets eget docblock sade uttryckligen att stdout var oanvändbart som
JSON-kanal. Pipen fyllde alltså noll funktion — men den **behöll sitt tak**.

När acceptance-sviten växte förbi 1 MB utdata returnerade `spawnSync`
`ENOBUFS`, skriptet kastade *"kunde inte starta Playwright"*, och jobbet föll
rött **utan att ett enda test kört**.

## Vad som gjorde det svårt att se

Det såg ut som en flake, eftersom det slog ojämnt: `#1831`, `#1841` (två
gånger), `#1845` och `#1848` föll — men `#1840` passerade. Den naturliga
läsningen var "instabil miljö" eller "något i just de här testerna".

Det var i själva verket **deterministiskt**: `#1840` lade till få nya tester
och kom under taket; de andra lade till fler och kom över. En skalningsvägg
ser ut som en flake ända tills man mäter vad som skiljer fallen åt.

## De tre mätningarna som avgjorde

1. **Loggen innehöll noll testutdata.** Ingen `Running N tests`, inget
   passed/failed — bara installationssteget och felet. Ett innehållsfel är
   därmed uteslutet: inget test hann köra. **Detta var den enskilt viktigaste
   observationen**, och den kostade en `grep` att göra.
2. **Omkörning gav identiskt utfall.** Två fällningar på samma PR uteslöt
   transiens.
3. **`main` var grön och en PR passerade.** Det uteslöt miljön som ensam
   förklaring och pekade på diffens storlek.

## Bekräftelsen — låt fixen vara sitt eget experiment

Fixen (`'pipe'` → `'inherit'`) landades i en egen PR. **Den PR:ens egen
körning av samma jobb prövade fixen mot hela sviten** och gick grön där de
andra var röda. Diagnosen bekräftades alltså av CI självt, inte av
resonemang. Bygg fixen så att dess egen grind är beviset när det går.

## Den generella formen

**Död kod i en resursväg är inte harmlös — den bär sina begränsningar ändå.**
En oanvänd pipe, en oläst buffert, en kvarglömd `maxBuffer`: de kostar
ingenting i logik och allt i tak. Och när ett tak nås rapporteras det som ett
körfel någon annanstans, långt från orsaken.
