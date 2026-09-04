# Amendering 2026-08-31 — Åtgärds-panelens kryss blir läsande, kvitto-dialogen rivs (TASK-346.7)

**Yta:** `atgarder-granskning` / `atgarder-tomt-lage` / `atgarder-mottagarurval`
i `tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json` (Marcus
2026-08-11: *"ser okej ut"*, stämpel-SHA `efc4091a`). Skarp källa:
`src/components/events/atgarder/AtgardsSida.tsx`.

**Klass:** *ny form, förhandsmandat S113 Del 11 (B3)* — PRD `TASK-346`
§ Ytorna (beslut 10), skivans AC #2.

---

## FÖRST: vad grinden kan se, och vad de tre ytorna faktiskt låser

**Ingen av manifestets tre ytor bär `referenser`-nyckeln** (mätt på denna
gren; `check-facit.sh` namnger alla tre på stderr som "saknar innehållslås").
Invariant (d) är därmed inert här, och `scripts/check-facit.sh` kan inte
fälla denna diff — med eller utan denna sidofil. Se
`s102-hem-konvergens/AMENDERING-2026-08-31-betalningar-kortet.md` § FÖRST för
mekanik-belägget; det upprepas inte här.

**Vad ytorna ÄNDÅ låser, i prosa:** manifestets `not`-fält pekar ut
ariaSnapshot-referenserna under
`tests/visual/__aria__/atgardssida-promoverings-grind.spec.ts/` som "DET
MEKANISKA FACIT". De tolv `.aria.yml`-filerna täcker **eventväljarens tomma
läge, mottagar-ytan och granskningsläget med sina tre utfall** — de täcker
**inte** betalningspanelen. Mätt: ingen av de tolv innehåller strängarna
`Anmälningsavgift`, `Slutbetalning`, `Skicka kvitto` eller `Pricka av och
notera`.

**Ingen ariaSnapshot-referens har därför rörts av denna skiva.** Det är inte
ett förbiseende utan ett mätt utfall: den yta som ändras ligger utanför
referensernas scope.

---

## Vad som ändrades

Allt nedan gäller **enbart med miljöflaggan PÅ** (`betalningarPa()`, `pa` i
`.env.development`/`.env.staging`, frånvarande i `.env.production`). Med
flaggan AV är panelen byte för byte dagens.

### 1. Kryssen blir LÄSANDE (AC #2)

`SkrivKryss` fick en `lasande`-prop. Med den satt renderas React Arias
`<Checkbox isReadOnly>` — krysset visar statusen men kan inte flippas, och
ingen mutation avfyras.

**`isReadOnly`, inte `isDisabled`, och skillnaden är lastbärande.** Ett
inaktiverat kryss tas ur tabordningen och blir osynligt för den som läser
raden med skärmläsare. Statusen ÄR informationen här, så den måste gå att nå
och läsa. React Aria sätter `aria-readonly="true"` och blockerar `onChange`.

**Varför alls:** sedan ADR-128 härleds Anmälningsavgift/Slutbetalning ur
inbetalningarna mot eventets pris, och basens två valfält är en **app-skriven
spegel** av härledningen (ADR-128 beslut 5). Ett kryss som gick att flippa
hade skrivit över härledningen med en gissning, och nästa spegelskrivning
hade tyst skrivit tillbaka den. ADR-109 § Updates beslut 7 är rivet.

### 2. Gamla "Skicka kvitto"-dialogen renderas inte

`{vald && !lasande && <SkickaKvittoKnapp …/>}`. Dialogen byggde på ADR-109
beslut 7-flödet, där Lotta skriver kvittobeloppet för hand i en ruta utan
felmeddelanden. Kvittot avser numera exakt EN inbetalning och bär dess belopp
och datum (ADR-128) — ett handskrivet belopp kan inte längre peka på någon
inbetalning, och Roger hade fått en verifikation utan motpost.

**Villkorad, inte raderad — och det är en avvikelse mot AC #2:s ord "rivs".**
AC #2 säger *rivs*; AC #6 och PRD § Miljöflagga (B2) säger att flaggan AV ska
ge dagens beteende **exakt**. De två kan inte båda hållas bokstavligt.
Uppdragstexten avgör: *"flaggan AV = dagens beteende exakt (prod-beteendet!)"*.
`send-receipt-email` är fortfarande deployad och är Lottas **enda** kvittoväg i
prod tills du slår på flaggan; en ovillkorlig rivning hade tagit bort
funktionen ur prod i natt. Den slutliga rivningen — komponenten,
`useSendReceipt`, deras importer och `atgarder-kvitto.staging.test.ts` — hör
till `TASK-346.12`, som river flaggan och därmed grenen.

### 3. Nytt betalningsblock per person (`PanelBetalningar`)

Sist i varje persons kort, under facken:

- **Saknas-beloppet** ur `rad.kvar` (Postgres-sanningen), med `Förfallen`- och
  `Basen släpar`-märken när de gäller.
- **Registrera betalning** — `RegistreraYta`, som monterar **samma**
  `RegistreraForm` som inkorgen, med personen förvald (PRD § Ytorna: *"samma
  formulär, förvald person"*). Ingen andra implementation av beloppsfältet.
- **Visa inbetalningarna** — en fällning per person med inbetalningsrader,
  kvittostatus och Visa / Skicka igen.

**Fällningen är inte ett extra klick i onödan.** Panelen kan visa tjugo
personer; en läsning per person vid öppning hade blivit tjugo Edge
Function-anrop, var och en med en Airtable-läsning i sig, mot ett tak som
DELAS med Lottas egna klick och automationerna A1–A11 (ADR-063 § S91-not).

**"Inget öppet belopp enligt basen" — inte "Allt betalt".** En anmälan utan
rad i `hamta-oppna-betalningar` kan vara fullbetald ELLER ha okänt pris:
basens `Saknas (kr)` är BLANK när formeln inte kan räkna fram ett pris, och
`BLANK() > 0` är falskt i Airtable. EF:ens eget filhuvud namnger fönstret.
Att påstå det starkare av de två fallen hade varit att hitta på.

## Vad som INTE ändrats

- **Noteringsfälten** — kvar, oförändrade, med samma `aria-label`. De skriver
  ett eget additivt fält (`Notering anmälningsavgift`), inte facken. AC #2
  kräver det uttryckligen.
- **"Ej relevant"-vakten** — föreläsningens slutbetalning renderas
  fortfarande som stilla text, aldrig som ett kryss.
- **Betalningspåminnelsen** — `ATGARDER[1]`s `urvalsfilter: obetald`
  (`atgardsmallar.ts`) läser `anmalningsavgift`/`slutbetalning`, alltså exakt
  de fält som numera ÄR härledningens spegel. Påminnelsen läser därför den
  härledda statusen utan en kodrad — AC #2:s krav är uppfyllt genom ADR-128:s
  spegel, inte genom en ändring här. **Samma sak gäller räknaren
  "N saknar"** på panelens fällknapp.
- **Mottagar-ytan, åtgärdsmenyn, arbetsytan och hela granskningssidan** —
  orörda. Det är de tre ytor manifestets ariaSnapshots faktiskt låser.

## Testerna — en förlust som är synlig, inte tyst

E2E-klassen kör med flaggan **PÅ** (`.env.development`; e2e-webServern sätter
ingen egen flagga, till skillnad från acceptance/visual). Kryss-klicken i
`tests/e2e/atgarder-betalningar.staging.test.ts` kan därför inte längre avfyra
någon skrivning.

**TIO tester är `test.describe.skip`:ade, inte raderade** — räknat, inte
uppskattat: SEX i skrivvertikalens block (avprickning avgift, avprickning
slutbetalning, ångra, aktivitetsloggens två riktningar, log-activity-500-
fallet), ETT rollback-test, ETT taktvakts-test och TVÅ i
`atgarder-kvitto.staging.test.ts`. Var och en har ett docblock som säger
varför och vem som stänger det (`TASK-346.12`).

Skäl: skrivvägen (`useSetPaymentStatus`, taktvakten, aktivitetsloggen,
rollbacken) är **fortfarande levande produktionskod med flaggan av**, alltså i
prod. Att radera bevisen för en väg som fortfarande kör hade tagit bort
täckning utan att ta bort risk. En skip gör förlusten synlig i varje
testrapport.

**Öppen fråga till dig:** med flaggan på finns ingen e2e-täckning kvar för
skrivvägen, eftersom dess enda affordans är borta i den miljö e2e kör i.
Alternativet — att sätta flaggan till `av` på e2e-webServern — hade bevarat de
tio testerna men brutit `mer-index.staging.test.ts` (TASK-346.6 räknar elva
rader i Mer-listan just för att flaggan är på) och gjort hela
betalningsdomänen osynlig för e2e-klassen.

**Nytt i stället:** ett block med fem tester som låser det nya kontraktet —
`aria-readonly` på kryssen, noll skrivningar vid klick, ett mottaget kryss som
inte går att bocka ur, kvitto-knappen borta, saknas-beskedet och fällningen
per person, plus axe 0. Härledningarna prövas hermetiskt i
`tests/api/betalningar-ytor.test.ts` (23 fall, negativ kontroll per regel).

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-11-kvittens och SHA `efc4091a`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
