# Amendering 2026-08-31 — Mer-listan får raden Betalningar (TASK-346.6)

**Yta:** Mer-landningen (`/mer`), M6-facitet låst i S64 Del 3
(`tasks/sessions/archive/2026-07/2026-07-12-session-64.md`, Marcus: *"Vi kör på
detta. Vi låser."*). Källa: `src/routes/_authenticated/mer/index.tsx`.

**Klass:** *ny form, förhandsmandat S113 Del 11 (B3)* — PRD `TASK-346`
§ Ytorna, beslut 10.

---

## FÖRST: en divergens mot uppdraget, som ändrar vad detta dokument ÄR

`TASK-346.6` AC #1 och DoD #9 säger båda att amenderingen ska skrivas mot
`tasks/sessions/bilagor/s64-mer-konvergens/facit.json`, och DoD #9 kräver
dessutom att *"övriga ytor i manifestet"* är identiska med facit.

**Den filen finns inte, och har aldrig funnits.** Mätt 2026-08-31 på denna
gren:

```bash
find tasks -name 'facit.json'       # 16 träffar, ingen under s64-mer-konvergens
ls tasks/sessions/bilagor/s64-mer-konvergens/
# m6-facit-desktop.png  m6-facit-mobil.png  steg-m1-baslinje.png … steg-m6.png
```

Katalogen bär NIO PNG-dumpar från S64 (2026-07-12) och ingenting annat.
Skälet är kronologiskt: konvergens-passet gjordes innan facit-manifestets
mekanik (`ADR-102`/`ADR-104`) fanns, så Mer-ytan blev aldrig ett STÄMPLAT
facit i den mekanismens mening.

**Grinden ser det, och släpper med rätta.** `.facit-policy.conf` sätter
`FACIT_BILD_GLOB="facit-*"` (prefix-matchning). Bilderna här heter
`m6-facit-desktop.png` och `m6-facit-mobil.png` — de BÖRJAR inte med
`facit-`, så invariant (a) ("en katalog med minst en facit-bild bär också ett
manifest") fyrar aldrig för denna katalog. Mätt före ändringen på denna gren:

```bash
bash scripts/check-facit.sh   # exit 0
```

**Följderna, öppet bokförda i stället för utjämnade:**

1. Det finns **inget manifest att amendera**, ingen `godkand`-stämpel att
   respektera och ingen `referenser`-hash att uppdatera. `ADR-104`-hooken
   (`deny-facit-godkand-skrivning.sh`) har ingenting att neka här.
2. DoD #9:s krav "övriga ytor i manifestet identiska med facit" är därför
   **inte prövbart** som det är formulerat. Det som FINNS att pröva är att
   ingen annan rad i Mer-listan ändrats — och det gör
   `tests/e2e/mer-index.staging.test.ts`, mekaniskt (se § Vad som INTE ändrats).
3. Detta dokument är alltså **ren bokföring**, inte den grind-tvingade sidofil
   `ADR-102` § A3 beskriver. Formen följs ändå, därför att nästa läsare av den
   här katalogen ska hitta ändringen där den letar.

**Inget manifest har skapats av denna skiva.** Att minta ett stämplat facit
för Mer-ytan vore ett eget beslut med Marcus stämpel som förutsättning
(`ADR-104` beslut 1–2), inte något en bygg-agent avgör i förbifarten.

---

## Vad som ändrades

En ELFTE `NavCard`-rad, **sist i grupp 1 (listorna)**:

```tsx
{betalningarPa() && (
  <li>
    <NavCard to="/mer/betalningar" icon={Banknote} label="Betalningar" />
  </li>
)}
```

**Grunden:** PRD `TASK-346` § Inkorgen och formuläret, ordagrant — *"Sidan
Betalningar under Mer"*. Skivans AC #1.

**Placeringen** följer husets egen konvention för tillskott, som
`index.tsx` redan skriver ut för Aktivitetshistoriken: *"Sist i
listorna-gruppen — nyaste tillskottet."* Betalningar är en LISTA (en inkorg
över öppna betalningar), inte ett material-verktyg, så grupp 1 är rätt hink.
Att lägga raden FÖRST — vilket vore försvarbart, eftersom PRD:n gör ytan till
Lottas nya morgonstart — hade flyttat på fem rader vars inbördes ordning är
M6-låst. Det är ett formbeslut som hör till morgongranskningen, inte till en
nattbyggd skiva.

**Ikonen är `Banknote`, och valet är domänbegrepps-mappat** enligt samma
disciplin som bar Bygg segment till `Filter` i stället för `Users`.
`Receipt` — lucides egen kvittoikon — är REDAN TAGEN för just kvitton
(`src/components/dokument/DokumentYta.tsx` § T176, verifierat med `grep` på
denna gren). Ytan handlar om INBETALNINGAR; kvittot är en följd av en
betalning, inte samma sak (`ORDLISTA.md` § Inbetalning). `Wallet`
(privat plånbok) och `CreditCard` (kortbetalning — Lotta tar Swish och giro)
avfärdades av samma skäl.

## Raden är MILJÖFLAGGAD — vilket är en del av formen, inte en detalj

`betalningarPa()` (`src/lib/funktionsflaggor.ts`, `TASK-346.4`) är `pa` i
`.env.development` och `.env.staging`, och FRÅNVARANDE i `.env.production`.

- **I prod renderas raden inte alls.** Mer-listan är där oförändrad, tio
  rader, byte för byte samma form som M6 låste. Facit-ytan är alltså orörd
  för den enda användare som finns i prod, tills Marcus slår på flaggan.
- **I dev och staging är raden synlig**, och det är där Marcus granskar.

Routen är gatad SEPARAT (`src/routes/_authenticated/mer/betalningar.tsx`,
`beforeLoad` → `throw redirect({ to: '/mer' })`), så en bokmärkt eller gissad
adress leder ingen vart i prod heller. Att bara dölja länken hade lämnat
adressen öppen.

`TASK-346.12` river flaggan efter promovering; raden blir då ovillkorlig.

## Klassning: **(c)** — formen ändras faktiskt, användar-synligt

`ADR-102` § A2 steg 1: ytan bär ingen `godkand`-stämpel (det finns inget
manifest), så den mekaniska ingången till klass (a) saknas.

Steg 2 — **påverkar ändringen vad en användare ser?** **Ja, i dev och
staging**: en elfte rad monteras permanent i nav-landmärket och syns vid varje
besök på `/mer`. Det är en **utvidgning av formen** (`ADR-102` § A4), inte en
renderings- eller fixturartefakt, och osäkerhetsregeln ("osäkert ⇒ klass (c)")
hade gett samma svar även om gränsdragningen varit tveksam.

Att raden är osynlig i PROD gör den inte till klass (b): klass (b) kräver att
skillnaden mot prod är en ARTEFAKT. Här är den ett medvetet, deklarerat
miljöval — och det är precis vad `TASK-346`s förhandsmandat (B3) täcker.

## Vad som INTE ändrats — mekaniskt mätt, inte resonerat

`tests/e2e/mer-index.staging.test.ts` låser Mer-listans form och är
uppdaterad i samma commit. Det som står kvar orört, och som testet fortsätter
hävda:

- **Tre grupper** i nav (`grupper).toHaveCount(3)`) — ingen ny grupp.
- **Grupp 1:s inbördes ordning**: Anmälningar, Väntelista, Intresserade,
  Maillogg, Aktivitetshistorik — oförändrad; Betalningar läggs EFTER dem.
- **Grupp 2** (Bygg segment, Bilagor, Eventinnehåll, Platser) — orörd.
- **Grupp 3** (Installera appen) — orörd.
- **Radanatomin**: exakt två `aria-hidden`-svg per rad (radikon + chevron),
  etiketten ensam bär länknamnet.
- **Måtten**: radikonen 20×20 renderade px; sidmarginalen skalets 16 px
  (sektionen har ingen egen sidopadding — dubbelkants-fyndet); 32 px vertikal
  rytm; 10 px radgap. Alla computed-verifierade av testets AC 2-block, orört.
- **Chevron per rad** — regeln gäller lika för den nya raden.
- **Logga ut** centrerad UTANFÖR nav — orörd.
- **Ingen Inställningar-post** — orörd; "Betalningar" innehåller inte
  substrängen "inställning".

De tre räknar-assertionerna som MÅSTE följa med en ny rad är höjda från
10 till 11 (`nav.getByRole('link')`, `svg.lucide-chevron-right`) och
grupp 1:s `toHaveText`-lista har fått `'Betalningar'` som sjätte post.
Testets fil-huvud bär motiveringen och miljöflagg-förbehållet.

**PNG-dumparna i denna katalog är en generation bakom** vad gäller den elfte
raden. `m6-facit-desktop.png` och `m6-facit-mobil.png` visar fortfarande tio
rader (respektive sex, i M6:s egen era — se S64-dokets radhistorik). De
förblir korrekta referenser för allt annat: grupperingen, radanatomin,
chevron-regeln, typografin och måtten.

## Omstämplings-läge

**Inget att stämpla om.** Ytan bär inget manifest och därmed ingen stämpel
(se § FÖRST ovan). `scripts/check-facit.sh` är oförändrat grön efter denna
ändring — mätt på denna gren:

```bash
bash scripts/check-facit.sh   # exit 0
```

Vill Marcus att Mer-ytan ska bli ett riktigt stämplat facit är det ett eget
kort: manifestet skrivs medan det är OGODKÄNT (`ADR-102` § A5 punkt 2 kräver
att `referenser` deklareras då), och stämpeln sätts därefter i hans egen
`!`-kanal med `npm run facit:godkann`. En agent sätter aldrig `godkand`
(`ADR-104` beslut 2).
