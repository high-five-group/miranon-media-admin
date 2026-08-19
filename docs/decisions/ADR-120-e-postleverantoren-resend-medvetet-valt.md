# ADR-120: E-postleverantören — Resend behålls, nu som ett medvetet val i stället för ett arv

- **Status:** Accepted (Marcus GO 2026-08-19, efter att han frågat varför vi
  valt Resend och konstaterat att psionautics dör med denna app)
- **Datum:** 2026-08-19
- **Rör:** `send-email`-familjen · `_shared/resend-batch.ts` · `ADR-067`s
  bulk-kontrakt · `ADR-119` beslut 8 · bilage-lanen för
  bekräftelsebilagan/deltagarinformationen
- **Relation till tidigare beslut:** supersederar INGET. `ADR-015` (som bar
  det ursprungliga leverantörsvalet) är sedan Session 39 superseded av
  `ADR-067`, men leverantörsvalet i sig följde tyst med utan att omprövas.
  Detta kort fyller den luckan.

## Kontext

Marcus frågade 2026-08-19: *"Jag vet inte egentligen varför vi valt Resend.
Har vi tillräckliga argument för att byta?"*

**Frågan hade inget bra svar.** `ADR-015` Alt 4, verbatim:

> *"Använd extern mail-tjänst (Mailgun, SendGrid) istället för Resend.
> **Avvisat:** Resend är redan etablerat i psionautics + outsidereality-domänen
> är verifierad i Resend. Byta tjänst för Miranon Media Admin är onödig
> kostnad."*

Ingen leverantörsjämförelse gjordes någonsin. Resend **ärvdes** från
psionautics, Roger & Lottas systerprojekt. `ADR-015` blev dessutom aldrig
implementerat i sin egen form och superseded av `ADR-067`, som byggde vidare
ovanpå leverantören utan att röra valet. Leverantörsvalet har alltså stått
oprövat sedan 2026-05-05.

Två saker tvingade fram omprövningen samma dag:

**(1) Resends batch-ändpunkt bär inte bilagor.** Bekräftat verbatim mot TVÅ
oberoende förstapartssidor 2026-08-19:

- `resend.com/docs/api-reference/emails/send-batch-emails`:
  *"The `attachments` field is not supported yet."*
- `resend.com/docs/dashboard/emails/attachments`:
  *"Emails with attachments cannot be sent using our batching endpoint."*

Konsekvensen är känd sedan `utskicks-bilage-arkitektur-2026-08-03.md`:
bilagan försvinner **tyst** — samma payload, inget felmeddelande
(`resend/resend-node#409`).

**(2) Resend är outlier, inte representant för branschen.**
`pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md` § delfråga 4 mätte fem
leverantörer mot deras egna API-referenser: Amazon SES (`SendBulkEmail`),
SendGrid (toppnivå-`attachments` över upp till 1000 `personalizations`) och
Postmarks nya Bulk-API bär alla EN delad bilaga i ETT anrop. Resend är den
enda vars batch-ändpunkt inte kan bära en bilaga alls.

**(3) Psionautics dör med denna app** (Marcus 2026-08-19: *"Psionautics var
lite som ett experiment/MVP för den här appen"*). Därmed faller det ena av
`ADR-015`s två motiveringsled helt.

## Beslut

1. **Resend behålls** — men som ett MEDVETET val, inte ett arv.

2. **Det som bär beslutet nu är domänverifieringen, inte delningen.**
   SPF/DKIM/DMARC på **`miranon.dev`** är uppsatt och fungerar (se
   § Amendering nedan — detta stod först felaktigt som "outsidereality"). Att
   flytta den är inte konfiguration: det är en period där utgående mail kan
   hamna i skräpkorgen medan DNS propagerar och mottagarnas rykte-system
   omvärderar avsändaren. För en verksamhet vars affär är att nå deltagare
   inför en kurs är det verklig risk för noll mätbar vinst.

3. **Vinsten av ett byte är mätt och den är noll i praktiken.** Loopen kostar
   ~2,4 sekunder för det största eventet i prod (24 anmälda, Resends 10
   req/s). Bytet kostar veckor: `ADR-067`s bulk-kontrakt, idempotens-
   mekaniken med sitt 24-timmarsfönster och sin nyckelform,
   `_shared/resend-batch.ts`, `send-email`-EF:erna, mallarna, webhooks,
   suppression-listorna.

4. **Loopen är en LEVERANTÖRSKOMPENSATION** — så ska den förstås och
   dokumenteras, aldrig som ett branschvillkor. Kodifierat i `ADR-119`
   beslut 8; upprepas här eftersom det är leverantörsvalets direkta följd.

5. **Den tysta bilage-förlusten kräver en VAKT, inte ett leverantörsbyte.**
   Ett mail som ser skickat ut men saknar sin bilaga är sämre än ett mail som
   fallerar högljutt: avsändaren tror att deltagaren fått sin
   bekräftelsebilaga, deltagaren fick den inte, och ingenting säger ifrån.
   Vakten kostar en dag; bytet kostar veckor.

6. **Bytes-triggern skrivs ned i förväg** — samma disciplin `ADR-015` själv
   använde för mail-event-pattern. Vi byter när något av detta inträffar,
   inte tidigare och inte på känsla:

   - **(a)** Ett bilage-bärande utskick passerar **~200 mottagare** — då
     börjar loopen kosta på riktigt (~20 s sekventiellt).
   - **(b)** Resend släpper något **tyst en gång till.** En andra
     korruptionsklass gör det till ett mönster, inte en egenhet.
   - **(c)** Vi behöver en funktion Resend saknar och en granskad konkurrent
     har.
   - **(d)** Ordet **"yet"** i Resends egen mening står fortfarande oinfriat
     den dag villkor (a) inträffar. Resend signalerar själva att
     batch-bilagor är en lucka de kan täppa — den signalen är ett skäl att
     vänta, inte att byta.

   **Punkt (d) ersätter `ADR-015`-erans outtalade "psionautics delar
   leverantör"-antagande, som är dött.**

## Två obelagda fynd som går till `ADR-119`s minimaltest, inte hit

Verifikationen 2026-08-19 avslöjade två saker som kan förenkla bygget men som
INTE kunde beläggas mot förstapartskällan. De registreras här öppet och
avgörs av mätning, aldrig av antagande:

- **`attachments.path`** — parametern accepterar enligt send-email-referensen
  *"Path where the attachment file is hosted"*. Om Resend hämtar en fjärr-URL
  själv slipper vi base64-koda filen genom vår Edge Function. Dokumentationen
  bekräftar **inte** att en URL hämtas. **Mät det i `ADR-119`s minimaltest.**
- **Attachments API med signerade nedladdnings-URL:er** för redan skickade
  bilagor. Om den gör vad översiktssidan antyder kan den täcka
  "bifoga + länka"-komplementet utan att vi bygger en egen signerad
  Storage-länk. Detaljsidan kunde inte nås (404 på den gissade URL:en).
  **Obelagt.**

## Alternativ som vägdes

- **Byt till Amazon SES.** Bär delad bilaga i ett anrop
  (`DefaultContent.Template.Attachments`). Förkastat: bytet löser ett problem
  som kostar 2,4 sekunder, till priset av veckors arbete och en
  domänverifierings-risk.
- **Byt till SendGrid.** Toppnivå-`attachments` över upp till 1000
  `personalizations` — den renaste lösningen på papperet. Förkastat av samma
  skäl.
- **Byt till Postmark.** Nya Bulk-API:t bär delad bilaga men är **early
  access**, inte allmänt tillgängligt. Förkastat: att byta till en väg som
  ännu inte är GA byter en känd lucka mot en okänd.
- **Behåll Resend utan att skriva ned något** (status quo). Förkastat: det är
  precis det tillstånd som gjorde Marcus fråga obesvarbar, och som lät ett
  arv passera som ett beslut i tre månader.

## Konsekvenser

- (+) Nästa person som frågar *"varför Resend?"* får ett svar som är ett
  beslut, med en mätt grund och en nedskriven trigger.
- (+) Noll arbete idag — beslutet bekräftar det som redan körs.
- (+) Triggern gör omprövningen billig: när (a)–(d) inträffar finns
  jämförelsen redan gjord i
  `pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md` § delfråga 4.
- (−) Vi behåller en leverantör som är **outlier** på en axel branschen löst.
  Det är ett medvetet val, inte en okunnighet — men det förblir sant tills
  Resend infriar sitt "yet".
- (−) Vakten mot tyst bilage-förlust är nu ett KRAV, inte en möjlighet. Utan
  den bär beslutet en känd korruptionsklass utan bevakare.

## ADR-bar

Alla tre villkor håller: (1) ett leverantörsval är svårt att återställa i
koherens — kontrakt, idempotens-mekanik, domänverifiering och mallar byggs
ovanpå det; (2) att vi medvetet behåller en leverantör som är outlier på en
axel branschen löst är överraskande utan denna kontext; (3) tre namngivna
alternativ vägdes mot mätta tal och förkastades av konkreta skäl.

**Att beslutet inte ändrar någon kod gör det inte mindre ADR-bart.** Ett arv
som aldrig prövats och ett val som prövats och bekräftats ser identiska ut i
kodbasen — och helt olika ut för den som ska fatta nästa beslut.

## Amendering 2026-08-19 (samma dag) — domänen var FEL i beslut 2

**Beslut 2 påstod ursprungligen att SPF/DKIM/DMARC var uppsatt på
"outsidereality-domänen". Det är falskt.**

Felet uppstod genom att `ADR-015`s citat lästes som ett påstående om
NULÄGET. `ADR-015` skrevs 2026-05-05, och den tidens research
(`docs/research/datamodell-research/01-extraction.md:474`) bokförde domänen
som **öppen fråga**, ordagrant: *"Domän pending | outsidereality.se eller
psionautics.se i Resend (kvarstår)"*. Något beslut i den frågan nådde aldrig
denna ADR — jag ärvde ett tre månader gammalt "pending" och skrev ned det som
verifierat faktum.

**Vad som faktiskt gäller, mätt mot en DMARC-rapport från Google
(2026-08-19, rapportfönster 2026-08-17):**

| Post | Faktiskt värde |
|---|---|
| Rapporterad domän | **`miranon.dev`** |
| Publicerad policy | `p=quarantine`, `sp=quarantine`, `np=quarantine`, `pct=100` |
| Header-from | `send.miranon.dev` |
| DKIM (selector `resend`) | **pass** på `send.miranon.dev` |
| SPF | **pass** på `send.send.miranon.dev` |
| Disposition | `none` på samtliga poster — inget karantänerades |
| Volym i fönstret | **3 mail** |

`outsidereality.se` förekommer i kodbasen enbart som **reply-to-adress**
(`lotta@outsidereality.se`), aldrig som sändande domän.

**Beslutet står oförändrat.** Domänverifieringen bär det fortfarande — det är
bara en annan domän än den jag skrev. Att flytta `miranon.dev`s
SPF/DKIM/DMARC till en ny leverantör bär exakt samma propagerings-risk som
beslut 2 beskriver.

**Ett fynd som STÄRKER beslutet, upptäckt i samma rapport:** posterna bär en
andra godkänd DKIM-signatur från **`amazonses.com`**. Resend kör alltså
ovanpå Amazon SES. Alternativet "byt till SES" i § Alternativ ovan vore
därmed inte ett leverantörsbyte utan ett lager-byte till **samma
underliggande infrastruktur** — man skulle ge upp Resends API och behålla
SES leveransväg. Det gör alternativet svagare än det såg ut när det
förkastades, inte starkare.

**Felklassen är känd och namngiven i detta repo:** ett citat som var sant när
det skrevs, läst som ett påstående om nuläget. Samma klass som `S107` Del 13
§ E dokumenterade för kodkommentarer (`RackviddBadge`-prosan,
`PersonsList.tsx:443-448`, `Bevakningsrad.tsx:13-14`) — och begången här av
den som skrev ned den lärdomen, tre timmar senare, i en ADR.
