---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
---

# Åtgärds-sidan — samlat underlag inför bygget

*Konsoliderat 2026-08-07 (S93 Del 7) ur konsoliderings-grillningen, fyra
prototyp-iterationsvågor, två research-pass, ORDLISTA och koden.*

**Vad detta är:** allt som är sagt, beslutat och antecknat om åtgärds-sidan,
samlat på ett ställe. Beslutsmaterialet låg spritt över sessionsdok,
bilagor, research, ordlistan och docblock i produktionskod — och delar av det
fanns bara i kodkommentarer.

**Vad detta INTE är:** en byggorder. Formen är inte låst. Se § 9.

**Kortet:** `TASK-147` (PRD: Åtgärds-sidan — den enda platsen där något
verkställs). Detta dokument är dess bakgrund; kortet är dess spec.

---

## 1. Varför sidan finns

**2026-08-03**, mitt i valfasen för hållplats-prototypen, ringde Roger och
Lotta med ett nytt produktkrav: **valbara PDF-bilagor per utskick, ett
kvitto-klick, och en Dokument-yta**. Marcus bad om en konsolidering av sina
prototyp-kommentarer tillsammans med kravet. Det blev
konsoliderings-grillningen med åtta kvitterade beslut, och åtgärds-sidan föddes
ur beslut 1.

Sidan löser tre problem samtidigt:

1. **Åtgärds-listan består till två tredjedelar av knappar som inte gör
   något.** Fyra av sex rader är grå. Det kan Lotta inte gissa sig till.
2. **Appen ljuger om utskick.** Där något går att avfyra öppnas Lottas
   mailklient, samtidigt som basen antecknar att utskicket är gjort. Stänger
   hon fönstret utan att skicka står posten ändå som skickad —
   *stämplingslögnen*.
3. **Handlingarna är allt-eller-inget.** "Skicka betalningspåminnelse till
   obetalda" träffar alla eller ingen; sex av tjugo går inte att välja.

Sedan 2026-08-07 löser den ett fjärde: **eventsidan skriver ingenting alls
längre**, så allt som verkställer behöver en hemvist.

---

## 2. Kvitterade beslut

Ur konsoliderings-grillningen 2026-08-03 (8/8 kvitterade av Marcus), med
tillägg samma dag.

| # | Beslut |
|---|---|
| 1 | **Alla utskick flyttar till åtgärds-sidan.** Betalningar som toppnivå-block försvinner; avpricknings-arbetsytan integreras i Anmälda deltagare |
| 2 | Eventinfo-signalradens klick går till åtgärds-sidan **förmarkerad** |
| 4 | **Enhetligt riktiga server-utskick.** Mailto-eran stängs och stämplingslögnen dör. `ADR-067` revideras vid bygget |
| 5 | **v1:s innehåll** — se § 4 |
| 7 | Kvittot (dokumentklass C) **tvingas in i v1** av kvitto-klicket |
| 8 | **Sist av tre PRD-kort**, med **eget divergens-pass** |

**Tillägget 2026-08-03 — kvittoserien, Marcus beslut:** appen får en EGEN
kvittonummer-räknare; ingen integration mot Rogers faktureringssystem nu. Tre
principer bokförda:

1. Räknaren bor i basen, **additivt**, och numret allokeras **server-side i
   kvitto-funktionen vid generering** — aldrig i klienten.
2. Formatet avgränsas **synligt** från Rogers serie: eget prefix, löpnummer,
   årssuffix, och **start skild från 1**. Rogers krav var att serien inte får
   börja om från ett bredvid en levande serie (hans egen bär `32771-26`).
3. En betalning kvitteras i exakt **ETT** system. Var den gränsen går är den
   kvarvarande Roger-avstämningen.

**2026-08-07, Marcus (verbatim):**

> *"eventsidan är bara för översyn nu ju, så alla åtgärder flyttar till
> åtgärdssidan. Är ju dessutom inte rimligt att kunna kryssa i på eventsidan
> men inte skriva noteringar, bättre att ha allt på åtgärdssidan."*

Det beslutet **rev K27-anden** — grillad samsyn beslut 1 hade uttryckligen
bokfört att *"Lotta lämnar inte sidan för avprickning"* skulle överleva
konsolideringen. Det gör den inte. Beslut 1:s formulering är därmed amenderad:
arbetsytan flyttar in i Anmälda deltagare som **läsyta**, inte som
avpricknings-arbetsyta.

---

## 3. De sex åtgärdstyperna

**Bekräftade av Marcus 2026-08-07.**

1. **Manuell anmälan**
2. **Bekräftelse**
3. **Betalningspåminnelse**
4. **Markera betalda**
5. **Eventinfo**
6. **Fritt utskick**

**Bokfört om hur denna lista återfanns:** enumerationen skrevs aldrig ned vid
grillningen. Beslut 5 sade bara *"åtgärdsval (6 typer inkl. Fritt utskick)"*.
Listan rekonstruerades 2026-08-07 ur två oberoende källor på disk — prototypens
egen platshållartext i produktionskod (*"Härifrån går utskicken: bekräftelse,
betalningspåminnelse, eventinfo, fritt utskick — och manuell anmälan"*) och
tabellen över vilka Åtgärds-rader som flyttar — och bekräftades sedan av
Marcus.

**Notera avvikelsen mot ordlistan:** ORDLISTA glossar åtgärdsval som
*"(utskickstyp)"*, men två av de sex — manuell anmälan och markera betalda —
är inte utskick. Glossen är alltså för smal och bör skärpas när sidan byggs.

**Läxan värd att bära vidare:** ett kvitterat beslut som inte skrivs ned i en
filartefakt överlever inte sessionen. Sex typer kvitterades; fyra dagar senare
kostade det ett arkeologiskt pass att få tillbaka dem.

---

## 4. Vad v1 ska innehålla

Grillad samsyn beslut 5, ordagrant utfällt:

- **Mottagare** — de Lotta markerat och dragit med, var och en
  **avmarkeringsbar** på plats. Sista kontrollen sker där handlingen sker.
- **Åtgärdsval** — de sex typerna i § 3.
- **Redigerbar mall-text** — mallens text visas och går att ändra.
- **Bilageväljare UTAN förvals-logik.** En gissad förvald bilaga är farligare
  än en tom väljare.
- **Förhandsvisning** före skick.
- **Pessimistisk bulk med ärligt delutfall** — lyckades fjorton av tjugo står
  det fjorton av tjugo, och de sex som föll ligger kvar markerade så att
  omkörning träffar just dem.

**Bokförd iterationspunkt, ej tagen:** utskickshistorikens kort-visning.

---

## 5. Vad som flyttar hit

### Ur Åtgärds-gruppen på eventsidan

Marcus, iterationsvåg 2026-08-05 punkt 4 (verbatim):

> *"Åtgärdsgruppen högst upp måste in på åtgärdssidan. Vi kanske ska lägga
> till en likadan 'knapp' som 'Gå till check-in' som heter 'Gå till åtgärder'
> direkt under."*

| Rad | Text | Öde |
|---|---|---|
| 1 | Lägg till manuell anmälan | **flyttar** |
| 2 | Skicka bekräftelsemail till obekräftade | **flyttar** (grå idag) |
| 3 | Skicka betalningspåminnelse till obetalda | **flyttar** (grå) |
| 4 | Markera alla obetalda som betalda | **flyttar** (grå) |
| 5 | Skicka eventinfo till alla anmälda | **flyttar** (grå) |
| 6 | Skriv ut denna detaljsida | **STANNAR**, som eget kort |

Marcus om rad 1: *"tänkte väl kolla hur de blir att lägga in den på
åtgärdssidan … vill hon komma snabbt till manuell-anmälan så kommer det senare
finnas direkt knapp på hem-vyn."*

Marcus om rad 6: *"i sidans utskrift kommer ju eventinfo och allt med, det kan
väl vara bra att ha två varianter."* Registrets EGEN utskrift (den filtrerade
listan) är en **annan** utskrift och bor i filterpanelen.

### Ur betalningsytan

Marcus, punkt 6 (2026-08-06): *"Den lilla mail-ikonen kan vi ta bort, eftersom
vi inte gör några åtgärder här längre."* Påminn-vägen var en mailto-genväg ur
mailto-eran, och beslut 4 stängde den eran.

### Hela skrivvertikalen (2026-08-07)

- Avprickning av **anmälningsavgift**
- Avprickning av **slutbetalning**
- **Noterings-redigering**
- **Påminnelsen**

Detta är den senaste och största utökningen. Innan 2026-08-07 räknade ingen
in den.

---

## 6. Vad prototypen redan visar

**Två ingångar, samma platshållare, samma text** — medvetet, så att Marcus ser
att båda leder till samma kommande yta:

1. Batch-barens **"Åtgärder"**-knapp, efter markering i registret.
2. **"Gå till åtgärder"**-kortet, där Åtgärds-gruppen stod.

Båda fäller ut en text i stället för att navigera. Skälet, ur koden: *"En
chevron hade lovat en navigation som inte finns."* Samma ärlighetsprincip som
check-in-ingången bär.

Platshållartexten (produktionskod idag): *"Åtgärds-sidan — eget
prototyp-pass. Härifrån går utskicken: bekräftelse, betalningspåminnelse,
eventinfo, fritt utskick — och manuell anmälan."*

---

## 7. Den farligaste tekniska detaljen

Research-passet 2026-08-03 fällde att **dagens batch-ändpunkt inte stödjer
bilagor alls** — och att bristen är **TYST**: bilagan försvinner utan
felmeddelande. Att bara lägga till en bilage-parameter på befintlig kod ger ett
utskick som ser lyckat ut och saknar bilagan.

**Följd:** sändvägen måste grenas i två.

| Gren | Väg | Egenskap |
|---|---|---|
| **Bilage-fri** | dagens batch, oförändrad | behåller genomströmningsfördelen |
| **Bilage-bärande** | loopad singelsändning, en mottagare per anrop | ny implementation |

Idempotens-, samtyckes- och spärrlist-mönstren bär rakt över från det
befintliga kontraktet; bara sändmekaniken behöver nytt.

**Avvisade alternativ, bokförda:** lägga ALLA sändningar i singel-loop (ingen
anledning att ge upp batchens fördel för utskick som aldrig bär bilaga) ·
vänta på leverantörsstöd (inget datum eller åtagande finns).

**Testkonsekvens, viktigare än resten av kortet:** ett kontraktstest som
verifierar att rätt anrop skickades bevisar ingenting här — det var precis så
bristen kunde vara tyst. **Beviset måste vara att bilagan kommer fram.**

---

## 8. Öppna frågor

| Fråga | Vem avgör | Blockerar |
|---|---|---|
| Kvitto-gränsen mot Rogers faktureringssystem | Roger, sedan Marcus | kvitto-skivan |
| Hela formen — layout, flöde, ordning | konvergens-passet (S100), sedan Marcus | allt formberoende |
| Utskickshistorikens kort-visning | Marcus | en detalj i formen |
| Namnkollisionen: två "Åtgärder" på samma sida | löses när sidan får sitt namn | namngivningen |

**STÄNGD 2026-08-07 — mottagen-datum i basen.** Frågan stod här som öppen och
var det inte: Marcus tog **väg C** samma dag. Datumet SKA byggas — `TASK-145`
renderar när fältet bär värde, `TASK-147` äger fält + allowlist + skrivväg,
och `PROTO_MOTTAGEN_DATUM` rivs. De två konsekvenserna gäller oförändrat:
av-bocken måste **nolla** datumet, och gamla betalningar får **aldrig** ett
datum retroaktivt. Att gamla betalningar därmed står utan datum för alltid är
en **accepterad** konsekvens, inte en förbisedd.

Bakgrunden, kvar för läsbarhet: basens båda betalningsfält är enkelval **utan
tidsstämpel**, vilket är skälet till att additiva fält krävs.

*(Raden låg kvar som öppen i fyra dagar efter att beslutet togs — beslutet
bokfördes i `tasks/todo.md`:s kadensrad men konsumerades aldrig hit. Fångad
vid S100:s LÄS-fas.)*

---

## 9. Proceduren för nästa session

### Dokument-ytan tas i SAMMA session (Marcus 2026-08-07)

Dokument-ytan i Mer — där bilagor förvaltas — bryts ut ur bilage-fundamentet
(`T131`) men **ingår i denna sessions arbete**, inte i ett eget spår.

**Skälet är inte att båda är nya ytor.** Det är att **bilageväljaren på
åtgärds-sidan visar det Dokument-ytan förvaltar**. Designas väljaren utan att
biblioteket är designat — vilken metadata som finns, hur bilagor grupperas per
event, hur en ersatt version syns — designas den baklänges. De två ytorna är
två vyer av samma objekt.

**Bieffekt värd att veta:** utbrytningen lämnade `TASK-146` utan UI-konsument
(klass A gick inte att ladda upp någonstans ifrån). Tas Dokument-ytan här får
fundamentet sin konsument tillbaka, och den sekvenserings-invändningen faller.

**Två prototyp-pass, inte ett.** Ytorna är distinkta — en event-knuten
åtgärds-sida och en Mer-yta — och ska ha var sin form. Det som delas är
domänen och därmed metadatats vokabulär.

### Parallellitet mot byggspåret — tre krockytor

Körs denna session parallellt med agenter som bygger `TASK-145`
(eventsidans konsolidering), möts spåren på exakt tre ställen:

| Krockyta | Varför |
|---|---|
| De två platshållarna — batch-barens Åtgärder-knapp och Gå-till-åtgärder-kortet | ligger i filer som `TASK-145.3` och `145.6` skriver om, men är åtgärds-sidans skarv |
| Prototyp-växlarens registrering i eventdetaljen | båda spåren vill lägga till respektive ta bort poster där |
| Hållplats-prototypens substrat | `TASK-145.6` **river** det; en åtgärds-prototyp som lutar sig mot samma mekanism får mattan bortdragen |

**Reglerna som gör det riskfritt:**

1. **Åtgärds-sessionen bygger i EGNA filer och EGEN route.** Den rör inte
   eventsidans komponenter.
2. **Platshållarna lämnas orörda av båda spåren** tills åtgärds-sidans facit är
   låst. Kopplingen platshållare → riktig navigation blir ett eget kort EFTER
   båda.
3. **`TASK-145.6` tas allra sist** — den beror redan på alla andra skivor, men
   det ska vara medvetet, inte en tillfällighet.

Plus kortnummer-regeln: `git fetch` före varje `task create`, och committa
kortet i samma andetag. `T127` blev `T130` 2026-08-07 för att den regeln inte
räckte till under ett Actions-avbrott.

Marcus 2026-08-07: sidan tas i en **egen ny session** som kör hela kedjan.

```text
(ev. grillning)  →  prototyp/divergens  →  Marcus väljer variant
                 →  konvergens-pass     →  Marcus itererar till facit
                 →  PRD uppdateras      →  /to-issues  →  skivor
```

**Grillningen är valfri och agentens bedömning.** Marcus: *"möjligtvis
grillning också men mycket har vi ju koll på redan."* Underlaget i detta
dokument täcker produktbesluten; det som saknas är **formen**, och den kommer
ur prototyp-passen — inte ur en intervju.

**Divergens-passet var enligt beslut 8 inte valfritt** — det föreskrev
uttryckligen tre radikalt olika varianter på en route → Marcus väljer EN,
följt av konvergens.

#### RIVET 2026-08-07 (S100) — beslut 8:s divergens-pass ersatt av strukturskisser

**Marcus rev det öppet vid sessionsstarten**, ordagrant: *"Jag föreslår att du
enbart bygger EN variant. Jag tycker att vi har tillräckligt många klara sidor
i appen som fått facit låsta … du kan ge allt du har i en enda variant och den
kommer bli riktigt bra om du FÖRST tittar på ALLA klara sidor i appen."*

**Skälet håller:** divergens finns för att utforska en OKÄND formrymd. Appens
grammatik är inte okänd — eventdetaljen, anmälningsdetaljen, login och
inbjudan bär låsta facit. Tre radikalt olika varianter mot en känd grammatik
hade gjort två av dem döda vid ankomst.

**Men strukturvalet behölls**, eftersom grammatiken ger stilen och inte
strukturen: åtgärds-sidan är den enda sidan som tar emot ett urval från en
annan sida, den bär två olikartade vertikaler (utskick + betalningarnas
skrivvertikal) och har ett flödesmoment (förhandsvisning → körning →
delutfall) som ingen befintlig sida har. Formen blev därför **tre
strukturskisser i text** (A staplad · B hubb-med-arbetsytor · C urvalet i
centrum med arbetslåda) → Marcus valde **B** → EN byggd variant som itereras
till facit.

**Kedjan blir alltså:**

```text
sid-inventering  →  tre strukturskisser (text)  →  Marcus väljer struktur
                 →  EN byggd variant           →  konvergens till facit
                 →  PRD uppdateras             →  /to-issues  →  skivor
```

#### Två krav som tillkom 2026-08-07 och formade B

**1. Mottagar-urvalet är REDIGERBART på sidan, inte medtaget-och-låst.**
Marcus: *"hon kanske drar in 7 stycken från eventdetaljsidan in på
åtgärdssidan, men sen vill skicka tillbaka 1 person och hämta in 2 nya, det
ska hon kunna göra utan att lämna åtgärdssidan."* Följd: mottagar-ytan är
permanent och förstklassig — varje rad avmarkeringsbar, plus en sökbar
plockare över eventets övriga anmälda. Urvalet från registret är därmed bara
ett **startvärde**, inte ett kontrakt.

**2. Sidan står på egna ben, med eventväljare.** Marcus: *"hon ska kunna gå
direkt dit från hem-vyn och välja vilka event hon vill hantera … Funktionen
för sidan liknar väl den vi har idag för hennes Manuella-anmälningssida, hon
kan komma till den från flera håll."* Formen är ärvd verbatim ur manuell
anmälan (`task-18.18`, S83 pass 4-facit): **TVÅ TILLSTÅND, INTE TVÅ SIDOR** —
`/atgarder` renderar samma komponent i tomt läge med eventväljaren fristående
som sidans enda handling, och valet navigerar in i
`/event/$eventId/atgarder`. Branschprecedent: Linear `linear.app/new` +
`/team/LIN/new`, Rails `/parent/:id/children/new`. Hem-vyns knapp är denna
routes tänkta ingång och byggs inte i detta pass — samma avgränsning manuell
anmälan gjorde.

### Beroenden

```text
TASK-146 (bilage-fundamentet)  ──┐
                                 ├──> TASK-147 skiva "bilage-bärande sändväg"
divergens-pass ──────────────────┤
Roger-avstämningen ──────────────┘──> TASK-147 skiva "kvittogenerering"
```

`TASK-147` konsumerar `TASK-146`:s fundament och `TASK-145`:s urval.

---

## 10. Källor

| Vad | Var |
|---|---|
| Konsoliderings-grillningen, åtta beslut + Tillägget | sessionsdok S93 Del 3 |
| Iterationsvågorna och Marcus verbatim-punkter | sessionsdok S93 Del 4–6 |
| Arkeologin som återfann de sex typerna | sessionsdok S93 Del 7 |
| Sändvägens grening, bilage-hemvisten, PDF-kapabiliteten | `docs/research/utskicks-bilage-arkitektur-2026-08-03.md` |
| Åtgärds-radernas nuläge (fyra av sex grå) | `docs/research/hallplats-modellen-eventsidan-2026-07-26.md` § 1.4 |
| Vad som flyttar och varför, med Marcus ord | docblock i eventsidans Åtgärds-komponent |
| Termerna Åtgärds-sida, Bilaga A/B/C, Steg-räknare, Steg-märke | `ORDLISTA.md` |
| Specen | `TASK-147` |
| Bilage-fundamentet | `TASK-146` |
| Eventsidans konsolidering (urvalets ursprung) | `TASK-145` |
