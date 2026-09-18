# Amendering 2026-09-18 — Bilageväljare per eventgrupp i svepet (TASK-455)

## Skäl för sidofilen

`facit.json` i den här katalogen är **stämplat** (`godkand.av: marcus`,
`godkand.datum: 2026-08-16`, `godkand.citat: "godkänner"`, sha
`10dff531c0aeea572f720483d217723f4aaef605`) och därmed agent-fryst av
`ADR-104`-hooken (`scripts/deny-facit-godkand-skrivning.sh`) — en agent kan
aldrig skriva om manifestet, inte ens ett fält som inte rör `godkand`.
Bokföringen av en ändring mot ett stämplat facit bor därför i en SIDOFIL
bredvid manifestet, per `ADR-102` § "Amenderingsmekaniken för ett STÄMPLAT
facit" (2026-08-22) och dess kanoniska form (§ A3) — samma mönster
`AMENDERING-2026-09-05-detaljvyn-sju-atgarder.md`
(`tasks/sessions/bilagor/s104-segment-divergens/`) och
`AMENDERING-2026-08-17-mallnot-riven.md`
(`tasks/sessions/bilagor/s93-atgardssida-promovering/`) redan etablerat.
`godkand` rörs aldrig av denna skiva.

## Yta / berört manifest

`tasks/sessions/bilagor/s102-svep-konvergens/facit.json`, den enda ytan i
manifestet: **`"Sändytan — bekräftelse-/påminnelsesvepen som OVERLAY ovanpå
Hem (ADR-114, S102 Del 10 beslut 1)"`**. Manifestet stämplades 2026-08-16
med citatet **"godkänner"** (`godkand.citat`, verbatim ur `facit.json`); den
fylligare `lasning`-texten i samma manifest citerar Marcus konvergens-
kvittens *"Jag är nöjd med svep-sidorna nu, blev bra med scrollbaren"*.

Manifestets `kallor`-lista (sex filer under `src/components/dev/
svep-prototyp/` + `src/routes/dev/svep-prototyp.tsx`) är samtliga rivna
sedan promoveringen (TASK-241.7) — accepterat av `check-facit.sh`s
rivnings-klausul (`ADR-102` § "Rivna prototyp-källor", 2026-08-22), verifierat
oförändrat av denna skiva: `bash scripts/check-facit.sh` ser samma sex rivna
källor både före och efter (se § Beviset nedan).

## Avvikelse

**Marcus grund, ordagrant ur kortets Description (`TASK-455`, 2026-09-18):**

> "Jag ser ett stort problem med bulkåtgärderna på hemvyn [...] kan ju inte
> använda dessa funktioner i nuläget eftersom det inte går att lägga till
> bilagor till varje utskick. Detta är ju ett stort problem. [...] För
> bilagor måste ju gå att lägga till eller hur?" — och efter underlaget:
> **"GO på bilageväljaren i svepet."**

**Vad som landade:** varje event-grupp i svepets "Utskicket"-sektion
(`Forhandsvisning.tsx`, bläddringsbar per event) fick en egen bilageväljare
— samma delade `BilageValjare`-komponent Åtgärds-sidan använder (nu utbruten
till `src/components/attachments/BilageValjare.tsx`, ren kodrelokering, se
PR-kroppen), utan förvalslogik. Urvalet ägs av `SvepOverlay.tsx`
(`bilagorPerGrupp: Map<eventId, Set<attachmentId>>`), scopat PER event-grupp
— ett val i en grupp påverkar aldrig en annan, och överlever bläddring bort
och tillbaka. En ny, teknikfri textrad ("Den här gruppen har bilagor och tar
lite längre tid att skicka.") visas i `Forhandsvisning.tsx` när den aktuellt
bläddrade gruppen har minst en vald bilaga. Bilagevalet förs vidare till
sändningen (`svepSendGrupper.ts`s `attachmentIds`-funktion, samma
`sendActionEmail`-kontrakt Åtgärds-sidan redan använder) — en grupp utan val
går exakt samma batch-väg som i dag (ADR-067 D9, oförändrad).

## Klassning: (c) — utskriven, med mätning

`ADR-102` § A2 testet: *"Påverkar ändringen vad en användare ser i prod?"*

**Ja, otvetydigt.** Detta är inte en revidering av en befintlig detalj utan
en TILLAGD, synlig UI-yta på en redan låst form: en ny "Bilagor"-rad
(kryssrutor + namn + storlek) och en ny villkorad textrad i varje
event-grupps förhandsvisning — element som inte fanns i den stämplade
2026-08-16-formen. `ADR-102` § A4 säger det uttryckligen: *"En utvidgning AV
formen är klass (c) och avgörs av Marcus, inte av B1."* Osäkerhets-regeln i
§ A2 ("Osäkert ⇒ klass (c)") är inte ens nödvändig här — svaret är inte
osäkert, det är ett obestridligt JA.

**Auktorisationen `ADR-102` § A2 kräver för en klass (c)-motivering:**
Marcus explicita GO ovan är en förhandsauktorisation att BYGGA utvidgningen
— inte en granskning av den FÄRDIGA formen. Det är därför denna PR landar
som DRAFT och väntar hans stämpel (se § Omstämplings-läge) i stället för att
behandla GO:et som en redan avslutad granskning.

## Vad som INTE är amenderat

- **Adresslistan** (`Adresslista.tsx`, "Mottagare"-sektionen) — helt orörd,
  ingen kod ändrad.
- **Ämnesraden och förhandsvisningstexten** i `Forhandsvisning.tsx` — samma
  klasser, samma "Förhandsvisningsexempel"-etikett, samma
  `fyllPlatshallare`-källa. Bilageväljaren är infogad SOM ETT NYTT BLOCK
  mellan förhandsvisningstexten och testmail-raden — den flyttar eller
  ändrar inget befintligt block.
- **Testmailet** ("Skicka till min inkorg") — oförändrad kod, oförändrad
  placering, oförändrat kontrakt.
- **Bläddringsmekaniken** (föregående/nästa event, "N av M") — oförändrad;
  bilageväljaren och den nya textraden bläddrar med, de introducerar ingen
  ny bläddringslogik.
- **Armeringen** (`SlideToConfirm`, "Dra för att bekräfta") och
  knappraden/`skicka()`-flödet — oförändrad form; bilagevalet FÖRS BARA
  VIDARE till ett redan existerande sändkontrakt (`attachmentIds`), inget
  nytt UI-steg lagt till där.
- **Resultatläget** (`ResultatVy`, delutfall per grupp) — helt orört, ingen
  kod ändrad.
- **Bekräftelse-/påminnelse-/eventinfo-svepens tre lägen** delar samma
  `SvepOverlay`/`Forhandsvisning`-yta (ADR-114 beslut 4) — utvidgningen
  gäller identiskt för alla tre, ingen av dem har en egen, avvikande form.
- **De 18 låsta facit-bilderna** (`facit-svep-*.png`) är nu en generation
  BAKOM den skarpa formen — de visar sändytan UTAN bilageväljare. De rörs
  inte av denna skiva och representerar fortfarande den STÄMPLADE formen
  korrekt (stämpeln gällde den formen, inte den utvidgade).

## Omstämplings-läge

**Väntar Marcus omstämpling.** `godkand`-fältet i
`s102-svep-konvergens/facit.json` rörs INTE av denna commit — mekaniskt
förhindrat under alla omständigheter av `scripts/deny-facit-godkand-
skrivning.sh` (`ADR-104` § Beslut 2), oavsett vad denna sidofil säger.
Stämpeln (`av: marcus`, `datum: 2026-08-16`, sha `10dff531…`) står kvar
oförändrad och gäller den ÖVRIGA, orörda formen (se § Vad som INTE är
amenderat). Marcus granskar den utvidgade formen i dev-server/staging (se
PR-kroppens "Så här tittar Marcus på formen") och omstämplar via sin egen
kanal om han godkänner den — inte via denna sidofil eller denna agent.

## Bilder — KANDIDAT, inte facit

Fyra nya skärmdumpar av den UTVIDGADE formen (bilageväljare vald i en
grupp), tagna mot den hermetiska acceptance-fixturvärlden:

- `KANDIDAT-svep-bilageval-desktop-ljus.png` — 1280×1000, ljust läge.
- `KANDIDAT-svep-bilageval-desktop-kontrast-more.png` — 1280×1000,
  `prefers-contrast: more`-emulering.
- `KANDIDAT-svep-bilageval-mobil-ljus.png` — 390×1200, ljust läge.
- `KANDIDAT-svep-bilageval-mobil-kontrast-more.png` — 390×1200,
  `prefers-contrast: more`-emulering.

Dessa är **KANDIDATER för Marcus granskning**, uttryckligen INTE facit och
INTE stämplade — de är inte deklarerade i manifestets `bilder`-lista (som
fortsatt bara räknar upp de 18 `facit-svep-*.png`-filerna för den ORIGINALA,
oförändrade formen) och Marcus har inte sett eller godkänt dem ännu.

**Namngivning, avsiktligt UTAN `facit-`-prefix** (samma precedent-disciplin
som `AMENDERING-2026-09-05-detaljvyn-sju-atgarder.md` § "Namngivning,
avvikelse…" och `s114-segmentlistan-konvergens/AMENDERING-2026-09-04-
tomlagets-yta.md`): `.facit-policy.conf`s `FACIT_BILD_GLOB="facit-*"`
flaggar varje fil som börjar på `facit-` som en föräldralös facit-bild om
den inte är deklarerad i manifestets `bilder`-lista (`check-facit.sh`
invariant R4). Verifierat: `grep -n FACIT_BILD_GLOB .facit-policy.conf` →
`"facit-*"`; ingen av de fyra KANDIDAT-filerna matchar mönstret, så R4
tripplas inte av deras närvaro.

## Referens + hash

Ytan **saknar nyckeln `referenser`** — verifierat direkt mot manifestet:

```bash
python3 -c "
import json
d = json.load(open('tasks/sessions/bilagor/s102-svep-konvergens/facit.json'))
print('referenser' in d['ytor'][0])
"
# → False
```

Samma täckningslucka `ADR-102` § "Täckningsluckan i invariant (d)"
(2026-08-28) namnger men medvetet INTE fäller på
(`FACIT_VARNA_ODEKLARERAD_REFERENS`, `.facit-policy.conf`) — `check-facit.sh`
skriver ut denna yta bland de ytor som saknar innehållslås på VARJE körning
(se § Beviset), men exitkoden påverkas inte. **Det finns alltså inget låst
hash-par att uppdatera här.** Ingen `ariaSnapshot`-referens är deklarerad för
denna yta i något manifest — det MEKANISKA facit-låset (`ADR-103` B4) är
inte byggt för svepet, så check-facit.sh kan strukturellt inte se skillnaden
mellan den gamla och den utvidgade formen. Det är Marcus öga (§
Omstämplings-läge) som avgör den skillnaden, inte en grind.

## Beviset

```bash
bash scripts/check-facit.sh
```

körd i denna landning: **exit 0**, oförändrat mot läget före denna commit.
Grinden namnger `s102-svep-konvergens`s enda yta bland de ytor som saknar
`referenser` (se § Referens + hash) och räknar upp samtliga sex rivna
`kallor`-källor som accepterade frånvaron (se § Yta / berört manifest) — i
båda fallen exakt samma utdata som innan denna sidofil och de fyra
KANDIDAT-bilderna tillkom. Ingen invariant föll, ingen ny varning tillkom.
