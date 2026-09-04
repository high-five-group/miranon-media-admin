# Amendering 2026-09-01 — Pricka av-vertikalen riven, betalningssektionen i ny form

**Yta:** `atgarder-granskning` / `atgarder-tomt-lage` / `atgarder-mottagarurval`
i `tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json` (Marcus
2026-08-11: *"ser okej ut"*, stämpel-SHA `efc4091a`). Skarp källa:
`src/components/events/atgarder/AtgardsSida.tsx` — `kallor` i alla tre ytorna.

**Klass:** *ny form* — Marcus GO i klartext 2026-09-01 (*"kör vi på din
rekommendation"*) under iterationsloopen på grenen
`fix/hem-betalningskort-marcus-iteration`. Kompletterar utan att motsäga
`AMENDERING-2026-08-31-lasande-kryss-och-betalningsblock.md`, som beskriver
mellansteget denna sidofil river.

---

## FÖRST: samma icke-innehållslåsta läge

**Ingen av manifestets tre ytor bär `referenser`-nyckeln** — mätt på nytt
2026-09-01 (`check-facit.sh` namnger alla tre på stderr som "saknar
innehållslås"). Invariant (d) är därmed inert, och grinden kan inte fälla
denna diff. Mekanik-belägget står i
`s102-hem-konvergens/AMENDERING-2026-08-31-betalningar-kortet.md` § FÖRST och
upprepas inte.

**Vad ytorna ÄNDÅ låser, i prosa:** manifestets `not`-fält pekar ut
ariaSnapshot-referenserna under
`tests/visual/__aria__/atgardssida-promoverings-grind.spec.ts/`. De tolv
`.aria.yml`-filerna täcker eventväljarens tomma läge, mottagar-ytan och
granskningsläget med sina tre utfall — **inte** betalningspanelen.

**Ingen ariaSnapshot-referens är rörd, och det är dubbelt motiverat:** ytan
som ändras ligger utanför referensernas scope, OCH visual-klassen kör med
miljöflaggan **av** (`playwright.config.ts` rad ~384: fixturvärldens
webServer-gren sätter `VITE_FEATURE_BETALNINGAR: 'av'` för visual, acceptance,
webblasarbeteende och manifest-screenshots). I den världen finns fällknappen
"Pricka av och notera" kvar, oförändrad.

```bash
bash scripts/check-facit.sh   # exit 0, före och efter
```

---

## SCOPE: ENDAST flagg-PÅ

Allt nedan gäller **enbart** med `betalningarPa()` sann (`pa` i
`.env.development`/`.env.staging`, frånvarande i `.env.production`). Med
flaggan av — prod i dag — är `AtgardsSida.tsx` byte för byte dagens: kryssen
skriver, "Skicka kvitto" lever, fällknappen står kvar. Den vägen rivs av
`TASK-346.12` efter prod-promoveringen.

## Vad som REVS (`40249ad2`)

Mellansteget från `TASK-346.7` — kryssen gjordes **läsande** (`isReadOnly`) —
prövades och underkändes i bruk. Motiveringen, ordagrant ur commiten:

> En kontroll som ser ut som en kontroll men inte är det är sämre än ingen
> kontroll: Lotta prickade av här i åratal, och ytan bad henne fortsätta göra
> en rörelse som inte gör något.

Rivet i flagg-PÅ-världen:

1. **Fällknappen "Pricka av och notera"** — hela affordansen.
2. **Kryss-vertikalen** (`SkrivKryss`/`SkrivRad`-raderna), läsande sedan
   `TASK-346.7`.
3. **"Ej relevant"-raden i sin gamla form** (radens form utan kryss).

## Vad sektionen BLEV

Samma anatomi som anmälans detaljvy och personkortet redan bär, via den
**DELADE** `PanelBetalningar` — ingen ny form uppfunnen:

- **Statuskort**: kvar att betala, med `Förfallen`- och `Basen släpar`-märken
  när de gäller.
- **Registrera betalning** — samma `RegistreraForm` som inkorgen, personen
  förvald.
- **Registrera återbetalning**.
- **Inbetalningshistorik** i bank-anatomi (se § Historikens form nedan).

Tre följdändringar med egna skäl:

- **"N saknar" flyttade till sektionsrubriken** "Betalningar" i husets
  ` · `-svansform (samma som betalningsinkorgens grupprubriker). Samma
  `obetald`-predikat, som läser ADR-128:s spegel oberoende av panelen.
  `aria-labelledby` pekar på samma `h2` — strukturen består, namnet bär nu
  även talet.
- **"Ej relevant (föreläsning)"** landade direkt under personens namn som
  `text-caption`-kvalificering. Den förklarar varför personen aldrig får en
  slutbetalning; utan den ser frånvaron ut som en lucka.
- **Inbetalningshistorikens fällning per person är KVAR.** Anropsbudgeten
  gäller oförändrat: panelen kan visa tjugo personer, och en läsning per
  person vore tjugo Edge Function-anrop mot ett tak som DELAS med Lottas egna
  klick och automationerna A1–A11 (ADR-063 § S91-not).

## NOTERINGSFÄLTEN ÖVERLEVDE — och kedjan byggdes till slut

Detta är passets tyngsta enskilda punkt, och den gick i tre steg.

**Steg 1 — flytten föll på sin egen grind (`f9ccefd9`).** Marcus dom var
*"det är HÄR lotta noterar något, inte på pricka av-blocket"*. Uppdraget bar
en grind: ren UI-flytt → bygg; EF-/schemakrav → bygg INTE, rapportera.
Mätningen fällde den:

- Panelens noteringsfält skriver **inte** till en inbetalning. Det går via
  `useUpdatePaymentNote` → `update-registration-payment-note` till ANMÄLANS
  Airtable-fält `Notering anmälningsavgift`/`Notering slutbetalning`.
- En notering på själva inbetalningen krävde kolumn + inputfält + EF-insert —
  `grep -rn "notering" supabase/migrations/*.sql` gav noll träffar.

**Steg 2 — fälten BEVARADES i rivningen (`40249ad2`).** De är Lottas ENDA
skrivväg till anmälans två noteringsfält, och de kan inte nås från
registreringsformuläret. De bröts därför ut ur `SkrivRad` till en egen
`NoteringsFalt`-komponent, så att flagg-AV-vägens renderade form är
oförändrad. De ligger nu **under** betalningsytan i stället för bredvid ett
kryss. Ett nytt test vaktar att båda fälten finns och skriver.

**Steg 3 — kedjan byggdes ändå, på rätt ställe (`5bdd7f48`).** Noteringen på
själva inbetalningen finns nu som kod hela vägen: migration
(`20260901111500_inbetalning_notering.sql`, nullable `notering text` +
formcheck), delad modul `_shared/inbetalning-notering.ts`, EF
`registrera-inbetalning`, schema, och ett fält i `RegistreraForm` som visas
på inbetalningsraden. **Inget är deployat** — migration FÖRE EF-deploy är
tvingande, eftersom `notering` står i `INBETALNING_KOLUMNER` som NIO Edge
Functions delar och PostgREST fäller hela select-anropet om en kolumn saknas.

**Steg 4 — fältet blev synligt igen (`776250a8`).** Marcus: *"Varför syns
inte det vita fältet där man skriver noteringen förens man hovrar? Så var det
inte förut."* `TASK-346.14`:s ghost-styling är riven; fältet är husets vanliga
`Input` med sin vanliga kant och placeholdern "Notering…". **A11y-golvet
HÖJS av rivningen** — ghost-formen krävde en egen lapp
(`contrast-more:border-border-strong`) som pekade på `border-strong`
(`p-neutral-300`, 1,55:1), medan primitivens egen
`--mm-input-border = --mm-border-field` (`p-neutral-400`) är dokumenterad
≥ 3:1 mot vit yta (WCAG 1.4.11) i alla kontrastlägen.

## Historikens form — bank-anatomi, fixad vid källan

Panelen ärver `InbetalningsLista`s form, som gjordes om två gånger i samma
loop:

- **`e727fdb7`** gav raderna bilage-kortens grammatik (kortyta per rad,
  ledande glyf, belopp som primärled, handlingar i en ⋯-meny via husets
  `Meny`-primitiv).
- **`cc124b96`** ersatte den efter Marcus jämförelse med hans egen banks
  transaktionslista (*"barnsligt … inte klart"*): EN sammanhängande listyta
  med hårlinjer (`divide-y divide-border rounded-xl … bg-surface px-3`,
  kopierad ordagrant ur `EventinnehallYta`/`PlatserYta`), betalsättet som
  titelled, beloppet i egen högerställd `tabular-nums`-kolumn med datans eget
  tecken, radrytm ≈ 60 px.
- **`b6f36ecd`** gav listan inline scroll (`max-h-96 overflow-y-auto`, samma
  klassuppsättning som `hem/NyaAnmalningar.tsx` och
  `hem/ForfallnaBetalningar.tsx` redan bär) och rev taket "Visar X av Y".
- **`1ccd46f4`** centrerade högerkolumnen mot radens höjd, med panelerna
  utflyttade ur textkolumnen till egna full-bredds-noder.

**PRD berättelse 18 är inte riven utan FLYTTAD**: ordet "Återbetalning" står
först i sekundärledet på exakt de rader där beloppets tecken är negativt —
aldrig ett ensamt minustecken som enda bärare.

**En AVVIKELSE från personkortet, med forensiskt skäl (`2f95d175`):** panelen
fick **INTE** det vita statuskortet de andra två ytorna fick. Panelens ground
är `bg-bg-muted`, och dess nästlade `bg-surface`-kort revs MEDVETET av Marcus
i S93 våg 19 (*"åtta sådana vita väggar radade under varandra"*). Att lägga
tillbaka ett vitt kort där hade rivit det beslutet. Villkoret bakom det gäller
fortfarande: ytan visar upp till tjugo personer, inte en. **Flaggat för
Marcus dom** — innehåll och ordning är personkortets, ytbehandlingen är
panelens egen hårlinje-grammatik.

## Terminologin på ytan

- **"Saknas" → "Kvar att betala"** över alla betalningsytor, panelen inräknad
  (`776250a8`). Böjd efter plats: som ETIKETT står termen först, i LÖPANDE
  TEXT står beloppet först ("1 500 kr kvar att betala").
- **"Inget öppet belopp enligt basen" → "Inget kvar att betala"**. Vad bytet
  kostar står öppet i `PanelBetalningar` § `rad === null`: hedgen mot det
  tvetydiga null-läget är tunnare, men de två lägena har fortfarande olika
  meningar, så ytan påstår aldrig det starkare av dem om ett okänt pris.
- **`Förfallen`-pillen** går sedan `7f2f11a7` genom `StatusBadge ton="warning"`
  med `ikon` — en pill-anatomi i stället för en handrullad span dubblerad i
  två filer. Mätt: `--mm-text` på `#fdf4ee` = 14,30:1.

## Vad som INTE ändrats

- **Mottagar-ytan, åtgärdsmenyn, arbetsytan och hela granskningssidan** —
  orörda. Det är de tre ytor manifestets ariaSnapshots faktiskt låser.
- **Betalningspåminnelsen** — `ATGARDER[1]`s `urvalsfilter: obetald`
  (`atgardsmallar.ts`) läser `anmalningsavgift`/`slutbetalning`, alltså exakt
  de fält som ÄR härledningens spegel sedan ADR-128. Påminnelsen läser den
  härledda statusen utan en kodrad.
- **"Ej relevant"-vaktens semantik** — föreläsningens slutbetalning kan
  fortfarande aldrig skrivas över.
- **Flagg-AV-världen i sin helhet.**

## Testerna

- Helparen `oppnaSidanOchBetalningar` klickar inte längre en knapp som inte
  finns.
- De två `aria-readonly`-testerna (från `TASK-346.7`) är **ersatta** av ett
  strukturellt frånvarotest — kryssen finns inte att pröva längre.
- Nya tester: fällknappens frånvaro, räknaren i sektionsrubriken,
  noteringsfältens överlevnad och skrivning.
- "Ej relevant"-testets slutbevis omskrivet från beteende till struktur.
- Saknas-besked, fällning per person och axe 0 behållna.

**FALSIFIERAD PREMISS I UPPDRAGET (ADR-086):** uppdraget angav att
`atgardssida-promoverings-grind.spec.ts:383/:444` skulle uppdateras.
`playwright.config.ts` har EN global webServer (rad ~307) vars fixturvärlds-gren
sätter flaggan `av` för visual-klassen. Visual kör alltså flagg-AV, där
"Pricka av och notera" finns kvar — **ingen visual-ändring behövdes**.

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-11-kvittens och SHA `efc4091a`
(`scripts/deny-facit-godkand-skrivning.sh` fäller varje agent-skrivning mot
ett stämplat manifest ändå).

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
