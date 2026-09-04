---
owner: marcus803
updated: 2026-09-03
review_by: 2026-12-03
status: stable
---

# Kvittot vid ombokning — svensk rätt och branschpraxis (2026-09-03)

> **Fråga:** När en kund som redan betalat och fått kvitto för en
> utbildningsplats bokas om till ett annat event/datum hos samma
> arrangör, vad kräver svensk rätt och branschpraxis av kvittot? Får
> originalkvittot stå oförändrat, ska det makuleras med kreditkvitto och
> nytt kvitto utfärdas, eller ska ett nytt kvitto utfärdas som hänvisar
> till originalet?

## Vad jag redan hade — och vad som är nytt i detta pass

**Läst i sin helhet innan research startade:**

- [`kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md`](kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md)
  — svarar på en ANNAN fråga: om Miranon Media över huvud taget behöver
  utfärda kvitto (svaret där: nej, lagstadgat, det är en servicehandling
  eftersom kassaregisterlagens plikt inte gäller distansavtal, SFL 39 kap.
  5 §), samt tolv systems TRIGGER-mönster för att skicka ett FÖRSTA
  kvitto. Ingen del av det passet undersökte vad som händer med ett REDAN
  utfärdat kvitto när den underliggande affärshändelsen ändras i
  efterhand — det är hela detta pass. Jag upprepar inte SFL/distansavtals-
  slutsatsen här utom som förutsättning (se § 1.4).
- [`kvitto-beslutsunderlag-2026-08-30.md`](kvitto-beslutsunderlag-2026-08-30.md)
  — grillningsunderlaget som ledde fram till PRD `TASK-346`; ingen
  ombokningsfråga fanns med där.
- [`ADR-128`](../decisions/ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md)
  och [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  (inkl. § Updates 2026-08-30) i sin helhet — datamodellen (`inbetalningar`,
  `kvitton`, ögonblicksbild, makulera/kreditkvitto-mekaniken byggd i
  `TASK-346.9`).
- `backlog/tasks/task-346*` (PRD + alla 15 skivor) och
  `supabase/migrations/20260830195728_betalningsdomanen_inbetalningar_kvitton.sql`
  (den faktiska schema-koden, läst rad för rad — se § "Vad repot redan
  garanterar mekaniskt", det viktigaste enskilda fyndet i detta pass) samt
  `supabase/functions/hantera-inbetalning/index.ts` (radera/makulera-EF:en).
- `grep -r "ombok"` mot hela repot (utom `node_modules`) gav TRE träffar,
  ingen av dem handlar om betalningsdomänens ombokning av en redan betald
  plats (en sessionsrad från S110, ett `EventCheckin`/`Deltagare`-UI-ord
  och en schema-referens) — **ingen tidigare research eller något ADR i
  repot har täckt just denna fråga.** Detta pass är alltså helt nytt
  underlag.

**Vad som är nytt här:** hela innehållet — BFL:s rättelseparagrafer
(verifierade direkt mot lagtexten och mot BFN:s egen vägledning, inte
bara sammanfattningar), Skatteverkets kassaregisterregler om
returkvitto/produktbyte (analogt, inte direkt tillämpligt), sju
branschsystems hantering av "byte av vara/tjänst på en redan bokförd
affärshändelse" specifikt (skilt från "första kvittots trigger", som
förra passet redan täckte), och — det starkaste enskilda fyndet — vad
den FAKTISKA databasschemat i detta repo redan mekaniskt garanterar om
ett utfärdat kvittos föränderlighet.

---

## Kort svar

**Originalkvittot ska stå oförändrat, alltid — och gör det redan
strukturellt garanterat i vår kod.** `kvitton`-tabellens
grant-konfiguration ger `service_role` INSERT + SELECT plus en
**kolumn-scopad** UPDATE (bara `lagringsnyckel`, `skickad_nar`,
`mottagare`, `status`) och ALDRIG DELETE — kopplingen till sin
inbetalning (`inbetalning_id`), löpnumret, året och typen kan **inte**
ändras efter utfärdandet, oavsett vad ombokningskoden gör. Den frågan är
alltså redan avgjord av schemat, inte bara av praxis (§ "Vad repot redan
garanterar mekaniskt").

**Kreditkvitto + nytt kvitto är fel mekanism för en ombokning till SAMMA
PRIS.** Kreditkvittot är byggt (`TASK-346.9`) för när PENGAR faktiskt
rör sig tillbaka (en återbetalning). En ombokning där ingen krona byter
riktning är ingen sådan händelse — att tvinga den genom
makulera+kreditera+nytt-kvitto-vägen skapar två kvittonummer i serien
som inte svarar mot någon verklig betalning, exakt den typ av
seriedrift `ADR-109`/`ADR-128` är byggda för att förhindra.

**Rätt modell är en variant av "originalkvittot står oförändrat" (i),
med prisdelta hanterat genom den REDAN BYGGDA mekaniken, inte en ny:**

1. Inbetalningsraden flyttas (`anmalan_record_id` byter, S115-beslutet)
   — det är en **rättelse av bokföringspost** (BFL 5 kap. 5 §), inte en
   rättelse av verifikation (5 kap. 9 §), och kräver bara vem/när-
   spårbarhet (aktivitetsloggen, redan byggd).
2. Ögonblicksbilden (`ogonblicksbild_event`/`_eventdatum`) på
   inbetalningsraden bör uppdateras till det NYA eventet — men det redan
   **utskickade** kvittots PDF och dess rad i `kvitton` rörs aldrig,
   oavsett (garanterat av schemat, ej av disciplin).
3. Samma pris: ingen ny kvittotransaktion. En vanlig bekräftelse (mail,
   inte ett numrerat kvitto) om det nya datumet räcker — inget undersökt
   branschsystem (Billetto, Eventbrite) utfärdar ett nytt finansiellt
   dokument för en ren datum-/produktväxling utan prisdelta.
4. Dyrare nytt event: en vanlig **tilläggsinbetalning** (positiv rad) med
   sitt EGET kvitto, nästa nummer i serien — det är en genuin ny
   betalning, ingen kreditering.
5. Billigare nytt event: en **återbetalning** (negativ rad) med
   **kreditkvitto som hänvisar till originalet** — exakt den mekanik
   `task-346.9` redan implementerat för vanliga återbetalningar, ingen ny
   kod behövs.

Den avgörande delfrågan var **schemats grant-nivå** (§ "Vad repot redan
garanterar mekaniskt") — utan den hade svaret varit en ren
policyrekommendation ("bör aldrig ändras"); med den är svaret en
**mätt egenskap hos koden** ("kan inte ändras").

---

## Del 1 — Svensk rätt

### 1.1 Bokföringslagen — verifikationens innehåll och rättelse (rätt paragrafnumrering, verifierad direkt)

**Rättelse (orkestreraren, 2026-09-03):** kontextens fråga skrev "BFL 5
kap. 7 § om rättelse av verifikation" — det är fel paragraf. Jag hämtade
lagtexten direkt från
[riksdagen.se/.../bokforingslag-19991078_sfs-1999-1078](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/bokforingslag-19991078_sfs-1999-1078/)
med `curl` 2026-09-03 och extraherade kapitel 5 lokalt (HTML-taggar
strippade, ingen AI-sammanfattning i mellanledet). Ordagrant:

> **5 kap. 5 §** (Rättelse av bokföringspost) *"Om en bokföringspost
> rättas, skall det anges när rättelsen har skett och vem som har gjort
> den. Sker rättelsen genom en särskild rättelsepost, skall det
> samtidigt säkerställas att det vid en granskning av den rättade
> bokföringsposten utan svårighet går att få kännedom om rättelsen."*
>
> **5 kap. 7 §** (Verifikationens INNEHÅLL, inte rättelse) *"Verifikationen
> skall innefatta uppgift om när den har sammanställts, när
> affärshändelsen har inträffat, vad denna avser, vilket belopp den
> gäller och vilken motpart den berör. […] I verifikationen skall det
> ingå ett verifikationsnummer eller annat identifieringstecken samt
> sådana övriga uppgifter som är nödvändiga för att sambandet mellan
> verifikationen och den bokförda affärshändelsen utan svårighet skall
> kunna fastställas."*
>
> **5 kap. 9 §** (Rättelse av VERIFIKATION — rätt paragraf för frågan)
> *"Om en verifikation rättas, skall det anges när rättelsen har skett
> och vem som har gjort den."*

Två OLIKA saker rättas alltså av två OLIKA paragrafer: en
**bokföringspost** (5 §, ledger-raden/den bokförda händelsen) och en
**verifikation** (9 §, källdokumentet — här: kvittot). Den distinktionen
är den analytiska nyckeln till hela svaret (se § "Vad repots datamodell
faktiskt speglar").

### 1.2 BFN:s vägledning till BFNAR 2013:2 — den operativa regeln, citerad ordagrant

Lagtexten säger BARA att en rättelse ska vara spårbar (vem/när). Den
OPERATIVA regeln för HUR — särskilt om originalet får skrivas över — står
i Bokföringsnämndens egen vägledning till BFNAR 2013:2, hämtad direkt som
PDF och extraherad lokalt med `pdftotext` 2026-09-03 (mirror:
[ekobrottsmyndigheten.se/.../vl13-2-bokforing-1.pdf](https://www.ekobrottsmyndigheten.se/wp-content/uploads/2024/03/vl13-2-bokforing-1.pdf),
identisk med `bfn.se`s egen PDF som förra passet redan pekade ut). Sidan
53–54, avsnittet "Rättelse av verifikation", ordagrant:

> **Allmänt råd 5.15** *"Rättas en verifikation ska det göras på sådant
> sätt att den ursprungliga uppgiften klart framgår."*
>
> **Allmänt råd 5.16** *"Rättas en verifikation genom att den ersätts med
> en ny, utgör även fortsättningsvis den ersatta verifikationen
> räkenskapsinformation."*
>
> **Kommentar** *"De uppgifter som framgår av och som verifikationerna
> förses med ska vara varaktiga och får inte raderas eller göras
> oläsliga […] Behöver ändringar eller tillägg göras i en verifikation
> efter det att den mottagits eller upprättats och ändringen inte utgör
> komplettering, ska ändringen göras genom en rättelse. Verifikationen
> kan också ersättas med en ny. I så fall ska det säkerställas, genom
> anteckning på den tidigare verifikationen eller på annat sätt, att det
> vid granskning utan svårighet går att få kännedom om att
> verifikationen ersatts."*

**Detta är den mest direkt bärande primärkällan i hela passet.** Den
beskriver exakt TVÅ lagliga vägar när en verifikations innehåll behöver
ändras:

1. **Rättelse in-place** — men på ett sätt där "den ursprungliga
   uppgiften klart framgår" (dvs. en synlig anteckning om vad som
   ändrats, aldrig en tyst overskrivning).
2. **Ersättning med en ny verifikation** — där DEN GAMLA "utgör även
   fortsättningsvis räkenskapsinformation" (den kastas eller döljs
   ALDRIG) och ersättningen är SPÅRBAR ("anteckning… att det vid
   granskning utan svårighet går att få kännedom om att verifikationen
   ersatts").

**Vad lagen INTE tillåter, läst e contrario:** att skriva över ett redan
utfärdat kvittos innehåll (belopp, datum, motpart/event) utan spår och
utan att originalet finns kvar läsbart. Det är den läsning som gör
alternativ (i) i sin NAIVA form ("skriv om ögonblicksbilden på det
utfärdade kvittot") juridiskt tveksam — men som § "Vad repot redan
garanterar mekaniskt" visar är den formen strukturellt omöjlig i vårt
schema ändå, så frågan är i praktiken redan stängd av koden.

### 1.3 Skatteverkets kassaregisterregler — returkvitto och "byte av vara" (analogt, INTE direkt tillämpligt)

Som förra passet fastslog (§ 1.1 där) gäller kassaregisterlagens
kvittoplikt sannolikt inte Miranon Media (distansavtals-undantaget, SFL
39 kap. 5 §). Reglerna nedan är alltså **inte bindande** för oss — men de
är den enda svenska myndighetstexten som specifikt reglerar "vad händer
med ett kvitto när innehållet i en försäljning ändras i efterhand", och
därför värdefull ANALOGT branschmönster.

**Returkvittots definition**, SKVFS 2014:9 2 kap. 19 §, hämtad via
[lagen.nu/skvfs/2014:9](https://lagen.nu/skvfs/2014:9) (WebFetch, 2026-09-03), citerad:

> *"Med returkvitto avses i dessa föreskrifter utskrift från ett
> kassaregister med uppgifter som utvisar att tidigare uttaget
> kassakvitto innehåller felaktiga uppgifter. Med returkvitto avses även
> utskrift av uppgifter om återbetalning för returnerade eller
> prisnedsatta varor eller tjänster."*

Returkvittot ska (7 kap. 1 § tredje stycket) bära SAMMA
innehållskrav som ett vanligt kassakvitto — det är alltså inte en
förenklad handling, utan ett fullvärdigt kvitto i sig.

**Retur + ny försäljning på SAMMA kvitto är uttryckligen förbjudet.**
Sekundärkälla (JobOffice, en svensk kassaregister-/redovisningsblogg),
som anger primärkällan SKV M 2012:8 avsnitt 5.22 — jag har INTE
verifierat det meddelandet direkt (se § Vad jag inte kunde belägga; SKV
M-serien är Skatteverkets egna "meddelanden", vägledande snarare än
bindande föreskrift, och jag kunde inte fastställa om just 2012:8 är
aktuellt eller ersatt). Citerat sekundärt:

> *"Ett företag [får] inte registrera en retur som en delpost på ett
> kassakvitto. Om en kund i samband med ett köp även vill returnera en
> tidigare köpt vara ska företaget därför behandla detta var för sig på
> ett kassakvitto respektive ett returkvitto."*

**Byte av vara** (samma text): kunden kan lägga till/byta artiklar, men
det sker på ett NYTT kassakvitto för den nya varan — returen av den gamla
varan går på sitt EGET returkvitto. Termen "byte av vara" definieras
alltså inte som en tredje kvittotyp — Skatteverkets modell känner bara
till TVÅ dokument (kassakvitto för en försäljning, returkvitto för en
retur/prisnedsättning), och ett "byte" är i praktiken alltid EN retur +
EN ny försäljning, aldrig en redigering av det gamla kvittot.

**Slutsatsen som ÄR relevant för oss trots att lagen inte binder oss:**
den svenska myndighetsmodellen för fysisk handel bygger konsekvent på
"en affärshändelse, ett dokument — aldrig redigera det gamla" — samma
princip som BFN:s vägledning (§ 1.2) och som varenda undersökt
branschsystem (§ Del 3). Det är tre oberoende källor som pekar samma
väg.

### 1.4 SFL 39 kap. 5 § — undantaget täcker ombokningen också

Ombokningen ändrar inte betalningens karaktär (fortsatt Swish/Bankgiro/
Plusgiro i efterhand, aldrig ett fysiskt möte) — distansavtals-
undantaget som förra passet fastslog (§ 1.1 där, citerat ordagrant ur
lagen.nu/2011:1244) gäller därför oförändrat. Ingen ny forskning krävdes
här; jag upprepar inte lagtexten.

---

## Del 2 — Konsumentskydd

### 2.1 Distansavtalslagen — bekräftelseplikten gäller INGÅENDET, inte ändringen (negativt fynd)

Hämtat direkt från [lagen.nu/2005:59/konsolidering/2016:1028](https://lagen.nu/2005:59/konsolidering/2016:1028)
(WebFetch, 2026-09-03). **2 kap. 4 §** ålägger näringsidkaren att ge
konsumenten en bekräftelse "inom rimlig tid… senast när varan levereras
eller tjänsten börjar utföras", i "läsbar och varaktig form", med den
information som inte redan givits i sådan form (2 kap. 2 §).

**Lagen har ingen egen bestämmelse om ÄNDRING av ett redan ingånget
avtal.** Den reglerar avtalets ingående, förhandsinformation,
bekräftelse efter ingåendet, samt ångerrätt — INGEN av dessa paragrafer
omfattar en ombokning i efterhand. Det är ett **negativt fynd**, inte en
utebliven sökning: distansavtalslagen ger alltså inget formkrav på hur
en ombokning ska dokumenteras till kunden. Skyldigheten att skicka NÅGOT
alls vid en ombokning vilar därmed helt på god sed/service, inte på
denna lag.

### 2.2 Konsumenttjänstlagen — täcker sannolikt inte kurser/utbildning alls (negativt fynd, sekundärkälla)

WebSearch-syntes 2026-09-03 (flera sekundärkällor, ingen enskild
primärtext citerad ordagrant här — se § Vad jag inte kunde belägga):
konsumenttjänstlagens 1 § avgränsar lagen till "materiellt arbete" —
arbete på lösa saker, fast egendom och förvaringstjänster (hantverk,
byggarbeten, reparationer). **Kursverksamhet och undervisning räknas
genomgående som ett av de klassiska UNDANTAGEN** från lagens
tillämpningsområde. En sekundärkälla nämner att Högsta domstolen
tillämpat lagens avbeställningsregler ANALOGT på kursundervisningsavtal
i minst ett fall — jag har inte kunnat verifiera det rättsfallet direkt
och markerar det som obelagt.

**Slutsats för vår fråga:** konsumenttjänstlagen ger med stor
sannolikhet INGET direkt tillämpligt krav på Miranon Medias
kvittohantering vid ombokning av en kursplats. Konsumentköplagen är
irrelevant (den gäller köp av LÖSA SAKER, inte tjänster/kursplatser).

**Slutsats för hela Del 2:** konsumenträtten ger inget dokumentations-
krav som pekar mot något av de tre alternativen — hela avgörandet vilar
på bokföringsrätten (Del 1) och branschpraxis (Del 3), inte på
konsumentskyddet.

---

## Del 3 — Branschsystem, ordagrant där det går

|System|Vad som händer med ORIGINALdokumentet|Ny dokumenttyp vid ändring|Prisdelta|Källa + datum|
|---|---|---|---|---|
|**Pretix** (öppen källkod, event-/biljettsystem)|Fakturor är i praktiken **immutabla** efter utfärdande — API-fältet `is_cancellation` markerar en faktura som "annulleringen av en annan faktura", och `refers` pekar ut "fakturanumret för en faktura denna faktura refererar till (t.ex. en annullering refererar till fakturan den annullerar)"|`reissue_invoice=true` (default) vid en `patch_positions`-ändring: **annullerar** den gamla fakturan och skapar en NY — men API-dokumentationen säger uttryckligen: *"Changing parameters such as `item` or `price` will **not** automatically trigger creation of a new invoice, you need to take care of that yourself"* — alltså AKTIVT val, aldrig tyst redigering|Ny faktura räknar om totalen; ingen delad "mellanskillnads"-faktura beskriven|[docs.pretix.eu/en/latest/api/resources/invoices.html](https://docs.pretix.eu/en/latest/api/resources/invoices.html), [GitHub: pretix/pretix orders.rst](https://raw.githubusercontent.com/pretix/pretix/master/doc/api/resources/orders.rst), läst 2026-09-03|
|**Fortnox**|En BOKFÖRD kundfaktura kan inte redigeras eller makuleras direkt|"När en kundfaktura är bokförd så går den inte att makulera, utan då behöver man skapa en **kreditfaktura**." Rekommendationen för en felaktig BOKFÖRINGSVERIFIKATION (skapad ur en faktura) är likaså: skapa en kreditfaktura i stället för att redigera verifikationen, "eftersom det innebär att det uppstår en differens mellan huvudboken och reskontralistan"|Separat ny faktura efter kreditering|[support.fortnox.se — Skapa kreditfaktura](https://support.fortnox.se/produkthjalp/fakturering/kundfaktura-skapa-kreditfaktura), [Ta bort eller ändra felaktig verifikation](https://support.fortnox.se/produkthjalp/bokforing/ta-bort-eller-andra-felaktig-verifikation), läst 2026-09-03|
|**Visma eEkonomi**|Samma mönster: kreditera, sedan ny faktura|*"Om du behöver byta vara på en faktura kan du således: 1. Kreditera den ursprungliga fakturan. 2. Skapa en ny faktura med korrekt vara."* Beloppsregeln: "Det totala beloppet på kreditfakturan kan dock inte överstiga den ursprungliga fakturans totalbelopp"|Ny faktura, separat från krediteringen|WebSearch-syntes ([help.visma.net](https://help.visma.net/se_sv/control/content/online-help/forsaljning/kreditera-kopiera-bokford-faktura.htm)), läst 2026-09-03|
|**Bokio**|Kan inte redigeras direkt — grundas explicit i bokföringslagen: *"Enligt Bokföringslagen (1999:1078) kan man inte radera eller skriva om en redan bokförd faktura"* (Bokios egen formulering, ej ett direkt lagcitat)|Kreditera hela fakturan, skapa en ny med rätt vara/pris — Bokios EGEN rekommendation vid artikelbyte: *"vi rekommenderar att du krediterar hela fakturan och skapar en ny med nytt aktuellt pris"*|Ny faktura med nytt pris, ingen delad mellanskillnads-hantering beskriven|[bokio.se — hur krediterar man en faktura?](https://www.bokio.se/hjalp/fakturera-kunder/hantera-faktura/hur-krediterar-man-en-faktura/), läst 2026-09-03|
|**Eventbrite**|Ej dokumenterat i hjälpcentret hur kvittot/orderbekräftelsen hanteras — dokumentationen är TYST om detta (se § Vad jag inte kunde belägga)|Ingen ny kvittotyp beskriven för ett rent biljettbyte|Uppgradering: kunden betalar mellanskillnaden direkt ("enter billing information for the price difference"). Nedgradering: **INGEN automatisk återbetalning** — *"Changing to a lower-priced ticket will not issue a refund automatically"*|[eventbrite.com — Change your ticket](https://www.eventbrite.com/help/en-us/articles/337796/how-to-transfer-to-a-different-event-or-ticket-type/), läst 2026-09-03|
|**Billetto**|Den gamla biljetten AVBOKAS ("den gamla biljetten kommer att avbokas, vilket frigör platsen"); köparen får ett nytt mail om nytt event/ny biljettyp — men **prisskillnaden hanteras uttryckligen UTANFÖR plattformens finansiella flöde**: *"eventuella prisskillnader måste hanteras utanför Billetto"* (Swish eller liknande, direkt mellan arrangör och köpare)|Nytt bekräftelsemail, ingen ny numrerad kvittotransaktion i systemet för prisdeltat|Utanför plattformen — INGEN egen faktura-/kvittomekanism för mellanskillnaden|[support.billetto.com — Kan jag byta biljetter](https://support.billetto.com/sv/hc/5732151289), läst 2026-09-03|
|**Nortic/Tickster** (svenska system)|**Otillräckligt undersökt** — arrangörssidans guide gav HTTP 403 (bot-blockering), kundsidans FAQ-sida gav ingen detalj om kvitto-/dokumenthantering. Tunn precedens, deklarerat öppet|Ej fastställt|Ej fastställt|[b2b.nortic.se/faq-biljett](https://b2b.nortic.se/faq-biljett) (403 på arrangörssidan), läst 2026-09-03|

**Mönstret, samfällt över alla sex system som gav användbart svar:**
**ingen** redigerar det utfärdade dokumentet in-place. Var och en väljer
mellan (a) kreditera + ny faktura (Fortnox, Visma, Bokio — alla tre
bokförings-SaaS, alla tre motiverar det direkt eller indirekt med att en
bokförd verifikation inte får skrivas om), eller (b) annullera + ny med
en explicit referenskedja (Pretix `is_cancellation`/`refers` — precis
`kvitton.original_kvitto_id`-mönstret vi redan byggt). Och **två av tre
biljettsystem (Eventbrite, Billetto) utfärdar INGEN ny finansiell
handling alls för en ren produkt-/datumväxling utan prisdelta** — bara en
kommunikations-bekräftelse. Prisdeltat hanteras som en EGEN,
fristående transaktion i samtliga fall där det beskrivs (Eventbrite:
betala mellanskillnad / ingen auto-återbetalning; Billetto: helt utanför
plattformens bokföring).

---

## Del 4 — Prisskillnad

Ingen av de sex användbara källorna beskriver ett mönster där
prisdeltat "vävs in" i en redigering av originaldokumentet. Två
distinkta vägar, konsekventa mellan bokförings-SaaS och biljettsystem:

- **Dyrare nytt event → tilläggsbetalning som EGEN transaktion.**
  Eventbrite: kunden betalar mellanskillnaden separat vid
  bytestillfället. I bokförings-SaaS-mönstret (Fortnox/Visma/Bokio)
  motsvaras detta av en helt vanlig NY faktura/kvitto för
  mellanskillnaden — ingen kreditering inblandad, eftersom inga pengar
  går tillbaka.
- **Billigare nytt event → återbetalning som EGEN transaktion, med
  hänvisning till originalet.** Eventbrite utfärdar uttryckligen INGEN
  automatisk återbetalning (kräver aktiv hantering); Billetto lägger
  hela ansvaret utanför plattformen. Bokförings-SaaS-mönstret
  (Fortnox/Visma/Bokio, samt Pretix `refers`) är entydigt: en
  kreditfaktura/kreditnota som pekar ut vilket original den avser.

**Detta mönster kartläggs exakt av vår redan byggda kreditkvitto-
mekanik** (`task-346.9`, `kvitton.original_kvitto_id`,
`constraint kvitton_kreditkvitto_har_original`): en negativ inbetalning
och ett kreditkvitto som hänvisar till originalet. Ingen ny mekanism
krävs för prisdeltat — bara att ombokningsflödet ANROPAR den vägen när
`Saknas (kr)`/`Avtalat pris` visar en skillnad, i stället för att bygga
en parallell "ombokningskreditering".

---

## Vad repot redan garanterar mekaniskt — det viktigaste enskilda fyndet

Läst direkt ur
`supabase/migrations/20260830195728_betalningsdomanen_inbetalningar_kvitton.sql`
(schemat som faktiskt körs i staging, inte en beskrivning av det),
citerat ordagrant ur filens egen kommentar på `kvitton`-tabellen:

> *"APPEND-ONLY FÖR IDENTITETEN: service_role har INSERT + SELECT plus en
> KOLUMN-SCOPAD UPDATE på utfallskolumnerna (lagringsnyckel, skickad_nar,
> mottagare, status) och ALDRIG DELETE — numret, året, löpnumret,
> kopplingen och typen kan därför aldrig ändras efter utfärdandet."*

Det betyder, som en **mätt egenskap hos GRANT-satserna**, inte en
konvention som kan glömmas i en framtida rad kod:

- `kvitton.inbetalning_id` (kopplingen till VILKEN inbetalning kvittot
  avser) kan aldrig skrivas om av någon Edge Function, oavsett vad en
  ombokning gör med `inbetalningar.anmalan_record_id`.
- `kvitton.ar`/`lopnummer`/`typ` kan aldrig ändras — serien kan inte
  drifta.
- Den enda skrivbara ytan på en utfärdad kvittorad är UTFALLET av
  sändningen (skickat/misslyckat, vem det gick till, var PDF:en ligger)
  — aldrig VAD kvittot avser.
- Den sparade PDF:en (`lagringsnyckel`, en fil i en privat bucket) är
  själv en frusen rendering från sändningstillfället; ingenting i
  ombokningsflödet skriver om den filen.

**Den centrala analytiska distinktionen, byggd av mig i detta pass (ej
uttryckligen skriven i någon källa) — men direkt grundad i BFL:s egen
tvådelning (§ 1.1):** `inbetalningar` är BOKFÖRINGSPOSTEN (BFL 5 kap.
5 §, får rättas/omdisponeras med spårbarhet), medan `kvitton` + den
sparade PDF:en är VERIFIKATIONEN (5 kap. 9 §, ska förbli oförändrad
eller ERSÄTTAS av en ny med hänvisning — aldrig tyst redigeras).
Ombokningens beslut att flytta `anmalan_record_id` är alltså en
LEDGER-nivå-rättelse, inte en verifikations-rättelse — och exakt DÄRFÖR
kräver den INTE ett nytt kvitto för att vara juridiskt ren, så länge
flytten är spårbar (vem/när) och priset är oförändrat.

---

## Options-rymd för vår modell

### (i) Originalkvittot står oförändrat, inbetalningen flyttas, ögonblicksbilden uppdateras (eller inte)

**För, mot rätten.** Starkast juridiskt stöd av de tre: BFL 5 kap. 9 §
och BFN allmänna råd 5.15/5.16 kräver INTE ett nytt dokument för varje
ändring — bara spårbarhet. Eftersom kvittots identitet/koppling redan är
strukturellt oföränderlig (§ ovan) är "originalkvittot rörs inte" inget
val vi gör — det är en egenskap koden redan har. Frågan reduceras till
OM `ogonblicksbild_*` på inbetalningsraden ska uppdateras. Uppdateras
den, är det en ren BOKFÖRINGSPOST-rättelse (5 kap. 5 §) — kräver
vem/när, inget nytt dokument. Rörs den INTE, blir inbetalningsraden
missvisande för framtida läsning (radens egen "vad avser detta" pekar
på det gamla eventet trots att `anmalan_record_id` pekar på det nya) —
sämre spårbarhet, inte bättre.

**För, mot Lottas arbetsbörda.** Lägst friktion av de tre — inget nytt
kvittonummer, ingen ny PDF att generera/skicka för en ren datumväxling.
Matchar direkt Billetto/Eventbrite-mönstret: en bekräftelse, inte ett
nytt kvitto.

**För, mot vår ledger-modell.** Håller kvittoserien ren — den motsvarar
fortfarande exakt de FAKTISKA betalningarna, ingen konstgjord
kreditering/omutfärdande för en händelse där ingen krona rörde sig.
Återanvänder `anmalan_record_id`-flytten som S115 redan beslutat, utan
att lägga på en parallell kvitto-mekanism ovanpå den.

**Mot.** Om `ogonblicksbild_*` uppdateras UTAN att någon läser radens
`skapad_av`/aktivitetslogg vid en framtida granskning, kan en
utomstående (Roger, en revisor) läsa inbetalningsraden och tro att det
UTFÄRDADE kvittot alltid avsett det NYA eventet — det gjorde det inte.
Kräver disciplin: aktivitetsloggen (redan byggd, samma mönster som
`hantera-inbetalning`s makulera/radera) måste bära ombokningen som en
egen rad, annars är rättelsen inte "utan svårighet" spårbar (5 kap. 5 §s
eget krav).

### (ii) Kreditkvitto + nytt kvitto i samma operation

**För, mot rätten.** Vattentätast av de tre — genererar alltid en
komplett, självständig verifikationskedja (precis Pretix
`is_cancellation`/`refers`-mönstret). Ingen tvekan om vad som gäller
när.

**För, mot Lottas arbetsbörda.** Ingen — detta är den TYNGSTA vägen: två
extra dokument (kreditkvitto + nytt kvitto) att generera och skicka för
en händelse där, vid samma pris, INGEN krona faktiskt rör sig. Bryter
mot branschmönstret i § Del 3/4, där INGET undersökt system utfärdar en
kreditering för en ren produktväxling utan prisdelta.

**Mot, mot vår ledger-modell.** Förbrukar TVÅ kvittonummer i serien
(`MM-2026-NNNN`, `NNNN+1`) för en transaktion utan motsvarande
pengarörelse — exakt den seriedrift `ADR-109`/`ADR-128` byggdes för att
undvika (numren är en bokföringsserie för Roger, inte en UI-räknare).
Kreditkvittots hela existensberättigande i vår modell (`TASK-346.9` AC #3,
PRD berättelse 18/33) är en ÅTERBETALNING — att återanvända den för
en icke-återbetalning är en semantisk felanvändning av mekanismen, inte
bara en kostnad.

**Rätt användning:** ENDAST när ombokningen medför en faktisk
prisskillnad (§ Del 4) — då är det korrekt, inte en överreaktion.

### (iii) Nytt kvitto som hänvisar till originalet ("ersätter MM-2026-NNNN") utan kreditkvitto

**För, mot rätten.** Matchar BFN allmänt råd 5.16:s ANDRA väg
("verifikationen ersätts med en ny… den ersatta [består] som
räkenskapsinformation… anteckning… att verifikationen ersatts"). Juridiskt
helt godtagbart FÖR EN VERKLIG INNEHÅLLSÄNDRING (fel event/datum på det
ursprungliga kvittot skulle vara ett sådant fall).

**Mot, mot rätten — och mot vår modell specifikt.** Ett "ersättande"
kvitto utan motsvarande PENGARÖRELSE är svårt att förena med BFL 5 kap.
6 § ("för varje AFFÄRSHÄNDELSE ska det finnas en verifikation") — vilken
affärshändelse skulle det andra kvittot dokumentera, om ingen ny betalning
och ingen återbetalning skett? Risken är en kvittorad som ser ut som en
dubblettbetalning för den som läser serien utan sammanhang (Roger,
revisor) — sämre än (i), som håller EN rad per FAKTISK krona.

**Mot, mot vår ledger-modell.** Kräver en HELT NY typ i
`kvitton.typ`-check-constrainten (i dag bara `'kvitto'`/`'kreditkvitto'`)
och en ny relation utöver `original_kvitto_id` (som redan är hårdkopplad
till `typ = 'kreditkvitto'` via `kvitton_kreditkvitto_har_original`) —
mer schemaarbete än (i), för ett scenario (ii) redan täcker när det
verkligen behövs (prisdelta) och (i) redan täcker när det inte gör det
(samma pris).

**Rätt användning:** svag i vårt scenario. Den vore rätt VERKTYG om
kvittots ursprungliga INNEHÅLL varit FELAKTIGT redan vid utfärdandet
(fel belopp skrivet, fel namn) — inte för en ombokning som sker efteråt
och som redan har sin egen, prisrena mekanik i (i)+(ii) tillsammans.

---

## Dom

**Ingen av de tre alternativen vinner ensam — frågan har egentligen
TVÅ svar beroende på om priset ändras:**

- **Samma pris → (i).** Originalkvittot rörs inte (redan garanterat av
  schemat). Inbetalningsraden flyttas med spårbarhet
  (aktivitetslogg). Ingen ny kvittotransaktion. En vanlig bekräftelse,
  inte ett nytt kvitto.
- **Prisdelta → (i) för det som redan betalats, PLUS befintlig
  kreditkvitto/nykvitto-mekanik för DELTAT ENDAST** — inte hela beloppet
  omutfärdat. Dyrare: ny tilläggsinbetalning med eget kvitto. Billigare:
  negativ inbetalning + kreditkvitto som hänvisar till originalet.

**(ii) i sin fulla form (kreditera hela originalet + utfärda ett helt
nytt) och (iii) är fel för DENNA fråga** — de är rätt verktyg för andra
scenarier (en genuin återbetalning respektive ett felaktigt
ursprungskvitto), och att tvinga en ren ombokning genom dem bryter mot
tre oberoende observationer: BFN:s vägledning (en rättelse av
bokföringspost kräver inte ett nytt dokument), branschmönstret (inget
undersökt system omutfärdar för en ren produktväxling) och vår egen
seriedisciplin (kvittonummer motsvarar fakta betalningar).

---

## Rekommendation (REKOMMENDATION, inte beslut — Marcus avgör)

1. **Vid ombokning till SAMMA pris:** flytta `anmalan_record_id`
   (redan S115-beslutat), uppdatera `ogonblicksbild_event`/
   `_eventdatum` på inbetalningsraden, logga flytten i aktivitetsloggen
   med vem/när (samma mönster som makulera/radera i
   `hantera-inbetalning`). Inget nytt kvittonummer. En enkel
   bekräftelse till kunden om det nya datumet (mail, ej numrerat
   dokument) är god sed men inget lagkrav (§ 2.1).
2. **Vid PRISDELTA:** låt ombokningsflödet räkna ut skillnaden mot
   `Saknas (kr)`/`Avtalat pris` och ANROPA den befintliga
   inbetalnings-/kreditkvitto-vägen för just DELTAT — inte hela
   originalbeloppet. Ingen ny databasmekanism; en ny anropspunkt i
   ombokningsflödet.
3. **Bygg ALDRIG en väg som skriver om `kvitton.inbetalning_id` eller
   någon identitetskolumn på en utfärdad kvittorad** — schemat hindrar
   det redan (§ "Vad repot redan garanterar mekaniskt"), men om
   ombokningsflödet någonsin behöver "peka om" ett kvitto direkt i
   stället för via inbetalningsraden är det en signal att designen gått
   fel, inte något att arbeta runt med en migration som luckrar upp
   grant-satserna.
4. Ta med denna doms tvådelning (samma pris / prisdelta) till en
   eventuell grillning eller ADR-uppdatering explicit — den nuvarande
   ADR-128/ADR-109-texten beskriver makulera/kreditkvitto för
   ÅTERBETALNING och radera/makulera för FELREGISTRERING, men nämner
   inte ombokning som en egen tredje klass. Om S115-beslutet
   (`anmalan_record_id` flyttas) kodifieras i en skiva bör den skivan
   peka hit för kvittologiken.

---

## Vad jag inte kunde belägga

- **SKV M 2012:8 avsnitt 5.22** (retur+ny försäljning-förbudet, § 1.3) är
  citerat via en sekundärkälla (JobOffice-bloggen), inte verifierat mot
  Skatteverkets egen text. Jag kunde inte fastställa om just det
  meddelandet är aktuellt eller ersatt av senare SKVFS-versioner (2014:9,
  2021:17). Den KVALITATIVA slutsatsen (retur och ny försäljning hålls
  isär, aldrig samma kvitto) styrks dock oberoende av BFN:s vägledning
  och branschmönstret, så själva DOMEN vilar inte på denna enskilda
  källa.
- **Konsumenttjänstlagens undantag för kurser/utbildning** (§ 2.2) och
  det påstådda HD-avgörandet om analog tillämpning av
  avbeställningsreglerna är läst ur sekundärkällor (WebSearch-syntes),
  inte ur lagtext eller ett specifikt rättsfall jag själv läst. Om
  Marcus vill luta ett beslut tungt på just den analogitillämpningen bör
  rättsfallet identifieras och läsas separat.
- **Nortic/Tickster** (§ Del 3) gav otillräcklig träff — arrangörssidans
  guide (`arrangor.nortic.se`) svarade HTTP 403 vid direkthämtning, och
  kundsidans FAQ gav ingen detalj om dokumenthantering. Två svenska
  biljettsystem täcks alltså inte konkret i detta pass; om Marcus
  specifikt vill jämföra med en svensk branschkollega återstår den
  research.
- **Eventbrites egen kvittohantering vid biljettbyte** är explicit
  odokumenterad i deras hjälpcenter (§ Del 3-tabellen) — jag vet att
  prisdeltat hanteras separat, men inte om något NYTT kvitto/order-
  bekräftelse alls genereras vid ett rent bytesscenario.
- **Om `original_kvitto_id`-kolumnen (byggd för kreditkvitto) skulle
  återanvändas för en hypotetisk "ersättningskvitto"-typ (iii)** utan
  schemaändring är en kod-/datamodell-fråga jag inte har utrett tekniskt
  — bedömningen ovan (§ (iii)) är juridisk/praxis-baserad, inte en
  bekräftad omöjlighet i SQL.
- **Om priset FAKTISKT alltid är känt vid ombokningstillfället** i den
  kommande skivans UI (dvs. om `Avtalat pris`/`Pris (kr)` alltid är
  ifyllt för båda eventen) är en produktfråga utanför detta pass —
  rekommendationens punkt 2 förutsätter att prisdeltat GÅR att räkna ut
  automatiskt, vilket är sant per ADR-128 beslut 7 men inte verifierat
  här mot den faktiska omboknings-UI:n (den är inte byggd än).

---

## Källförteckning

**Svensk rätt — bokföring (3 primärkällor):**

- Bokföringslag (1999:1078) 5 kap. — direkt lagtext, hämtad med `curl`
  och extraherad lokalt (HTML-taggar strippade, ingen AI-mellanledd
  sammanfattning) 2026-09-03 från
  [riksdagen.se/.../bokforingslag-19991078_sfs-1999-1078](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/bokforingslag-19991078_sfs-1999-1078/)
- Bokföringsnämndens vägledning till BFNAR 2013:2 (Bokföring), sidan
  53–54 "Rättelse av verifikation", hämtad som PDF och extraherad lokalt
  med `pdftotext` 2026-09-03 från
  [ekobrottsmyndigheten.se/.../vl13-2-bokforing-1.pdf](https://www.ekobrottsmyndigheten.se/wp-content/uploads/2024/03/vl13-2-bokforing-1.pdf)
  (identisk med BFN:s egen `bfn.se`-PDF)
- Skatteförfarandelagen (2011:1244) 39 kap. 4–5 §§ — återanvänd ur
  förra passet, ej omresearchad (§ 1.4)

**Svensk rätt — kassaregister/kvitto (2 källor, 1 primär + 1 sekundär):**

- Skatteverkets föreskrifter SKVFS 2014:9, 2 kap. 19 § (returkvitto,
  definition) och 7 kap. 1 § (innehållskrav), via
  [lagen.nu/skvfs/2014:9](https://lagen.nu/skvfs/2014:9), läst 2026-09-03
- JobOffice — [Retur och försäljning på samma kvitto?](https://joboffice.se/blogg/retur-och-forsaljning-pa-samma-kvitto-vad-sager-skatteverket/),
  citerar SKV M 2012:8 avsnitt 5.22 (ej direkt verifierat, se § Vad jag
  inte kunde belägga), läst 2026-09-03

**Konsumenträtt (2 källor):**

- Lag (2005:59) om distansavtal och avtal utanför affärslokaler, 2 kap.
  2 och 4 §§, via [lagen.nu/2005:59/konsolidering/2016:1028](https://lagen.nu/2005:59/konsolidering/2016:1028),
  läst 2026-09-03
- Konsumenttjänstlagens tillämpningsområde och kursundantaget —
  WebSearch-syntes, flera sekundärkällor, läst 2026-09-03 (se § Vad jag
  inte kunde belägga)

**Bokförings-SaaS — byte av vara på bokförd försäljning (3 källor):**

- Fortnox — [Skapa kreditfaktura](https://support.fortnox.se/produkthjalp/fakturering/kundfaktura-skapa-kreditfaktura),
  [Ta bort eller ändra felaktig verifikation](https://support.fortnox.se/produkthjalp/bokforing/ta-bort-eller-andra-felaktig-verifikation),
  läst 2026-09-03
- Visma eEkonomi — [Kreditera eller kopiera bokförd faktura](https://help.visma.net/se_sv/control/content/online-help/forsaljning/kreditera-kopiera-bokford-faktura.htm),
  WebSearch-syntes, läst 2026-09-03
- Bokio — [Kreditfaktura — hur krediterar man en faktura?](https://www.bokio.se/hjalp/fakturera-kunder/hantera-faktura/hur-krediterar-man-en-faktura/),
  läst 2026-09-03

**Event-/biljettsystem — ombokning specifikt (3 källor + 1 otillräcklig):**

- Pretix — [Invoices API](https://docs.pretix.eu/en/latest/api/resources/invoices.html)
  (`is_cancellation`, `refers`), [Order change API](https://raw.githubusercontent.com/pretix/pretix/master/doc/api/resources/orders.rst)
  (`reissue_invoice`), läst 2026-09-03
- Eventbrite — [Change your ticket to a different event or ticket type](https://www.eventbrite.com/help/en-us/articles/337796/how-to-transfer-to-a-different-event-or-ticket-type/),
  läst 2026-09-03
- Billetto — [Kan jag byta biljetter åt en biljettköpare?](https://support.billetto.com/sv/hc/5732151289),
  läst 2026-09-03
- Nortic — [b2b.nortic.se/faq-biljett](https://b2b.nortic.se/faq-biljett)
  (arrangörssidan 403-blockerad, kundsidan otillräcklig detalj), läst
  2026-09-03

**Internt i repot (läst i sin helhet, ej ny research):**

- [`ADR-128`](../decisions/ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md),
  [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  (inkl. § Updates)
- `backlog/tasks/task-346*` (PRD + 15 skivor)
- `supabase/migrations/20260830195728_betalningsdomanen_inbetalningar_kvitton.sql`
  (schemat, källan till det viktigaste fyndet i detta pass)
- `supabase/functions/hantera-inbetalning/index.ts`
- [`kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md`](kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md),
  [`kvitto-beslutsunderlag-2026-08-30.md`](kvitto-beslutsunderlag-2026-08-30.md)
