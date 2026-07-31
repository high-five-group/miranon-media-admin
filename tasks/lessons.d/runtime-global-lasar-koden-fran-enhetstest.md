# En runtime-global i modulen låser hela filen från enhetstest-sviten

**Rör modulen `Deno.env` (eller motsvarande runtime-global) går den inte att
importera från en Node-buren testsvit — och då är ALL logik i filen otestbar,
inte bara den rad som rör globalen.** `[UNIVERSAL]`

**Empiri (S91, `TASK-53`, 2026-07-31):** 429-backoffen skulle enhetstestas med
mockad 429. En sondering visade att bara importera
`supabase/functions/_shared/airtable-client.ts` från `tests/api/` fäller
typecheck med **7 st `TS2304: Cannot find name 'Deno'`** — mätt, inte antaget.
Filen är i dag helt utanför alla `tsconfig`-program och därmed varken typkollad
eller testbar. Defekten hade kunnat leva i tre kopior i månader delvis av det
skälet.

**Motmedlet är inte en ambient-deklaration.** Att deklarera `Deno` i
tests-scopet hade dolt gränsen och dragit in hela filen i tests-programmet med
allt vad den bär. Rätt drag är att flytta den **rena kärnan** till en
runtime-fri modul: backoffen bor nu i `_shared/airtable-retry.ts` utan
`Deno.env` och utan global `fetch` (anropet injiceras), och blir därmed både
typkollad och enhetstestbar. Klienten behåller sina runtime-beroenden — de hör
hemma i adaptern, inte i logiken.

Bonusen är att en mekanism som fanns i tre copy-pastade kopior blev **en**:
"alla tre väntar lika" är efter flytten en egenskap hos koden i stället för ett
påstående om den. Testbarhets-tvånget pekade alltså på samma ställe som
djup-modul-principen redan pekade.

**Generaliseringen:** när en fil vägrar låta sig testas, läs vägran som en
uppgift om var modulgränsen borde gå — inte som ett hinder att kringgå.
