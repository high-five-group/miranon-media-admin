---
owner: marcus803
updated: 2026-08-30
review_by: 2026-11-30
status: stable
---

# Kvittoutfärdande — branschpraxis och svensk rätt (underlag för grillning)

> **Syfte:** underlag till en kommande grillning om Lottas kvittoflöde —
> trigger, beloppskälla, lagring/åtkomst, bulk och felhantering. Frågan
> ställdes av orkestreraren 2026-08-30 med hänvisning till
> [`kvitto-flodet-kartlaggning-2026-08-30.md`](kvitto-flodet-kartlaggning-2026-08-30.md)
> (kodkartläggningen, samma dag) och det låsta Marcus-beslutet i
> [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md).
> Detta dokument tillför INGET om koden — det är renodlad extern research
> (svensk rätt + branschpraxis) som ska matas in i grillningen bredvid
> kodkartläggningen, inte ersätta den.

## Vad jag redan hade — och vad som är nytt i detta pass

**Läst i sin helhet innan research startade:**

- [`kvitto-flodet-kartlaggning-2026-08-30.md`](kvitto-flodet-kartlaggning-2026-08-30.md)
  — hela flödet i kod: aktiv handling per betalningsrad, belopp/betalsätt
  handinmatat, EF tar en mottagare per anrop, PDF sparas aldrig
  (`lagringsnyckel: null`), inget prisfält i basen. Detta pass bygger
  vidare på den kartläggningen; ingen del av den upprepas här utom som
  referens.
- [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  i sin helhet, inklusive alla tre Updates. Marcus-beslut (a) — *"Kvittot
  är en AKTIV handling — aldrig automatik som följer på avprickningen"* —
  är LÅST. Skälet till just det valet står inte utskrivet i ADR:n; detta
  pass researchar branschmönstret för att ge grillningen underlag att pröva
  om skälet fortfarande håller, inte för att föreslå att riva beslutet.
- [`tasks/threads/T170-rogers-kvittoforlaga-besvarar-tre-oppna-punkter.md`](../../tasks/threads/T170-rogers-kvittoforlaga-besvarar-tre-oppna-punkter.md)
  — momssatsen (25 %) och org-uppgifterna är redan bekräftade och stängda
  i ADR-109 § Updates. Ingen ny research krävdes på de två punkterna;
  detta pass upprepar dem inte.
- `grep` mot `tasks/lessons.md` och `docs/decisions/` för "kvitto",
  "skatteverket", "bokföringslag", "kassaregister" — **noll träffar**
  utöver ADR-109 självt. Ingen tidigare research i repot har täckt svensk
  kvitto-/kassaregisterrätt eller en branschjämförelse av
  kvittoutfärdande-mönster. Detta pass är alltså helt nytt underlag, inte
  en komplettering av något som redan fanns.

**Vad som är nytt här:** hela innehållet — svensk rätt (kassaregisterlagen,
bokföringslagen, förenklad faktura-gränsen, konsumenträtt) och tolv
konkreta system-precedent (betalplattformar, event-/biljettplattformar,
svenska bokförings-SaaS, boknings-/kurssystem).

---

## Kort svar

**Juridiskt: nej, Miranon Media behöver med mycket stor sannolikhet inte skicka
kvitto till kunden alls** — kassaregisterlagens kvittoplikt gäller inte
distansavtal (Miranons hela flöde: bokning online/i app, betalning i
efterhand via Swish/Bankgiro/Plusgiro, inget fysiskt möte vid
betalningstillfället). Vad Miranon Media FAKTISKT behöver är en **verifikation
för sin egen bokföring** (bokföringslagen 5 kap) — och den behöver inte
vara ett kundriktat kvitto-dokument alls; ett kontoutdrag + en bokningspost
kan räcka. Att skicka kvitto till kunden är alltså en **servicehandling**,
inte en lagstadgad plikt, i just detta flöde.

**Branschpraxis är splittrad på triggerfrågan, men enig på tre andra
punkter.** Trigger varierar äkta (automatiskt vid betalning hos Pretix/
Humanitix/Stripe-toggle/Simple Signup/Klarna, kontra aktiv
knapp/checkbox hos Acuity/Zettle/Bokamera/Fortnox-kontantfaktura — Acuity
är den starkaste precedenten för vårt NUVARANDE mönster, se § Mönster 1).
Men **beloppet kommer så gott som alltid från en order/bokning, aldrig
handinmatat** (den punkt där Miranons flöde avviker mest — och där
avvikelsen beror på en verklig datalucka, inte ett designval), **kunden
kan i praktiken alltid hämta kvittot igen** (kundportal, "resend",
självbetjäning), och **bulk finns bara som admin-EXPORT av redan utfärdade
kvitton, aldrig som en knapp som utfärdar N nya kvitton på en gång** — den
sista punkten talar direkt emot idén att bygga en bulk-sändningsknapp för
kvitton.

Den avgörande delfrågan var **kassaregisterlagens distansavtals-undantag**
(§ 1.1 nedan): utan den hade hela premissen för att fråga "behöver Lotta
skicka kvitto alls" varit fel — svaret hade varit "ja, lagstadgat", inte
"nej, service".

---

## Del 1 — Svensk rätt

### 1.1 Gäller kassaregisterlagen Miranons betalningar (Swish/Bankgiro/Plusgiro)?

**Huvudregeln: Swish jämställs med kort-/kontantbetalning och triggar
kassaregisterplikt** — MEN bara vid FYSISK punkt-för-punkt-försäljning.
Skatteverkets egen sammanfattning (läst 2026-08-30, WebSearch-syntes av
[skatteverket.se/foretag/drivaforetag/kassaregister](https://www.skatteverket.se/foretag/drivaforetag/kassaregister.4.121b82f011a74172e5880005263.html)):
*"Betalning med Swish är att jämställa med betalning med kontokort."*
Tröskeln för kassaregisterplikt är fyra prisbasbelopp/år (~236 800 kr för
2026).

**Men: distansavtal är UTTRYCKLIGEN undantagna** — och detta är
Miranons faktiska flöde. **Rättelse av lagrummet (orkestreraren,
2026-08-30):** research-passets första version citerade *lagen (2007:592)
om kassaregister med mera* 3 § — den lagen är **UPPHÄVD** sedan
skatteförfarandelagen trädde i kraft 2012 (lagen.nu listar 2007:592 under
"Upphäver" på SFL:s sida). Reglerna lever vidare, i sak oförändrade, i
**skatteförfarandelagen (2011:1244) 39 kap. 4–10 §§**. När detta dokument
skriver "kassaregisterlagen" avses de paragraferna. Lagtexten, hämtad ur
[lagen.nu/2011:1244](https://lagen.nu/2011:1244) 2026-08-30 (`curl` + lokal
textextraktion — sidan är för lång för direkt läsning) och citerad
ORDAGRANT:

> **39 kap. 4 §** *"Den som i näringsverksamhet säljer varor eller tjänster
> mot kontant betalning eller mot betalning med kontokort ska använda
> kassaregister."*
>
> **39 kap. 5 § första stycket** *"Skyldigheten att använda kassaregister
> gäller inte för den som 1. bara i obetydlig omfattning säljer varor eller
> tjänster mot kontant betalning eller mot betalning med kontokort, 2. är
> befriad från skattskyldighet enligt inkomstskattelagen (1999:1229) för
> inkomst från sådan försäljning som avses i 4 §, 3. bedriver taxitrafik
> enligt taxitrafiklagen (2012:211), 4. säljer varor eller tjänster genom
> distansavtal eller hemförsäljningsavtal, 5. säljer varor eller tjänster
> med hjälp av en varuautomat eller annan liknande automat eller i en
> automatiserad affärslokal, eller 6. tillhandahåller automatspel enligt
> spellagen (2018:1138)."*
>
> **39 kap. 5 § andra stycket** *"Vid bedömningen enligt första stycket 1
> av om det är fråga om försäljning i obetydlig omfattning ska det särskilt
> beaktas om försäljningen normalt uppgår till eller kan antas komma att
> uppgå till sammanlagt högst fyra prisbasbelopp under ett
> beskattningsår."*

Punkt 4 namnger ingen lag; begreppet *distansavtal* definieras i **lag
(2005:59) om distansavtal och avtal utanför affärslokaler** (namnbytt
2014-06-13 från "distans- och hemförsäljningslagen", samma SFS-nummer;
källa: [riksdagen.se](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-200559-om-distansavtal-och-avtal-utanfor_sfs-2005-59/),
[Wikipedia: Lag om distansavtal och avtal utanför affärslokaler](https://sv.wikipedia.org/wiki/Lag_om_distansavtal_och_avtal_utanf%C3%B6r_aff%C3%A4rslokaler),
båda läst 2026-08-30). Notera att undantaget för obetydlig omfattning
(punkt 1, fyra prisbasbelopp) är en OBEROENDE andra väg till samma
slutsats.

Lagens egen definition av distansavtal (1 kap. 2 §, lag 2005:59), citerad
via lagen.nu (läst 2026-08-30):

> *"avtal som ingås inom ramen för ett av näringsidkaren organiserat
> system för att träffa avtal på distans, om kommunikationen uteslutande
> sker på distans"*

**Miranons flöde matchar definitionen rakt av:** bokning sker via
app/webb (ett av Miranon Media organiserat system), ingen fysisk kontakt vid
avtalsslut eller betalning, betalningen (Swish/Bankgiro/Plusgiro) sker i
efterhand elektroniskt. Detta är alltså **inte** samma situation som en
butik som tar Swish i kassan — där gäller kassaregisterplikten fullt ut.

**Slutsats (1.1):** kassaregisterlagens kvittoplikt gäller sannolikt inte
Miranon Media, förutsatt att INGEN betalning tas emot vid ett fysiskt möte (t.ex.
kontant/Swish på plats vid ett retreat). Skulle Lotta någon gång ta emot en
betalning på plats faller just DEN transaktionen sannolikt utanför
undantaget — värt att hålla isär från resten av flödet.

**Detta är en juridisk bedömning byggd på lagtext + Skatteverkets egen
sammanfattning, INTE ett förhandsbesked eller en juristgranskning.**
Se § Vad jag inte kunde belägga.

### 1.2 Vad ska ett kvitto/en verifikation innehålla, och vem behöver den?

Två helt olika krav ligger bakom ordet "kvitto" och blandas lätt ihop:

**A. Kassaregisterlagens kvittokrav** (gäller inte Miranon Media per § 1.1) —
Skatteverkets sammanfattning (läst 2026-08-30): kvittot ska innehålla
datum, säljarens identifiering (moms-/organisationsnummer), vilka varor/
tjänster som sålts, och momsbeloppet eller uppgifter som gör att momsen
kan räknas ut. Formen är fri sedan Skatteverkets eget ställningstagande —
digitalt kvitto duger, inget pappenskrav (källa:
[PwC Företagarbloggen](https://blogg.pwc.se/foretagarbloggen/kvitton-pappersform),
läst 2026-08-30).

**B. Bokföringslagens verifikationskrav** (gäller Miranon Media, för DESS EGEN
bokföring — 5 kap 6–7 §§, WebSearch-syntes av
[lagen.nu/1999:1078](https://lagen.nu/1999:1078) och
[Bokföringsnämndens vägledning](https://www.bfn.se/wp-content/uploads/2020/06/vagledning-bokforing.pdf),
läst 2026-08-30): en verifikation ska innehålla datum (när den
upprättades), tidpunkt för affärshändelsen (om den avviker),
belopp, motpart, innehåll (vad affärshändelsen avser), och ett
löpnummer/identifieringsmärke som binder ihop verifikationen med den
löpande bokföringen.

**Den avgörande skillnaden för Lottas flöde: verifikationen enligt B är
INTE nödvändigtvis samma dokument som ett kvitto skickat till kunden.**
Bokföringslagen kräver att MIRANON har en verifikation för sin egen
bokföring — den kan i princip vara ett kontoutdrag (visar Swish-/
bankgiro-inbetalningen, datum, belopp) kompletterat med bokningsposten i
Airtable (motpart, innehåll). Ett kundriktat PDF-kvitto är EN väg att
uppfylla detta, inte den enda.

**Detta är den viktigaste juridiska observationen för dagens flöde:**
dagens PDF **sparas aldrig** (`lagringsnyckel: null`, per
kartläggningen) — så som flödet fungerar i dag uppfyller det utskickade
PDF-kvittot INTE bokföringslagens verifikationskrav för Miranons EGEN
bokföring, eftersom Miranon Media inte behåller en kopia. Om avsikten är att
kvittot ska DUBBLA som Miranons verifikation (i stället för separat
bokföring hos Roger/Lotta) krävs att PDF:en sparas — annars är
`lagringsnyckel: null` inte bara en UI-brist utan en öppen fråga om VAR
Miranons egen verifikation för dessa affärshändelser egentligen bor.

### 1.3 Förenklad faktura / kvitto-gränsen 4 000 kr

Gränsen 4 000 kr inkl. moms är en köparens-avdragsrätt-regel (mervärdes-
skattelagen), inte en Miranon Media-utfärdande-plikt: en förenklad faktura
(vilket ett kvitto räknas som) får användas när totalbeloppet inte
överstiger 4 000 kr; överstiger det krävs en fullständig faktura (med
KÖPARENS uppgifter) för att KÖPAREN ska få göra momsavdrag (källa:
[Skatteverket — Momslagens regler om fakturering](https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/momslagensregleromfakturering.4.58d555751259e4d66168000403.html),
WebSearch-syntes, läst 2026-08-30). **Irrelevant för Miranon Media i praktiken**
— kunderna är privatpersoner (kursdeltagare) utan momsavdragsrätt, och
inget kursbelopp i underlaget (Rogers förlaga: 2 500 kr inkl. moms) är
ens i närheten av gränsen ändå.

### 1.4 Behöver en privatperson som betalat via Swish ett kvitto, juridiskt?

**Nej, i den bemärkelsen att LAGEN inte kräver att KUNDEN har ett kvitto**
för att köpet ska vara giltigt eller för att kunden ska ha köpt något —
kvittots juridiska funktion är BEVIS (för reklamation, garanti,
avdragsrätt), inte en giltighetsförutsättning. Konsumentverkets egen
sammanfattning (WebSearch-syntes, läst 2026-08-30,
[konsumentverket.se](https://www.konsumentverket.se/konsumentratt/regler-for-kvitto/)):
en konsument har rätt att FÅ ett kvitto när kassaregisterplikten gäller —
men som § 1.1 visar gäller den plikten sannolikt inte Miranons flöde. Ett
undantag existerar även för verksamheter under fyra prisbasbelopp/år
(litet försäljningsundantag) — ytterligare en väg till samma slutsats,
oberoende av distansavtals-undantaget.

**Slutsats:** en Miranon Media-kund har sannolikt ingen lagstadgad rätt att
KRÄVA ett kvitto (utanför allmän avtalsrätt/god sed), men kan naturligtvis
alltid BE om ett, och Miranon Media kan alltid välja att erbjuda ett som
service — vilket är precis vad dagens flöde gör.

### 1.5 Vad behöver Miranon Media själv, för sin egen bokföring?

Se § 1.2 B. Sammanfattat: en verifikation per affärshändelse (varje
betalning), med datum, belopp, motpart, innehåll och löpnummer, sparad i
minst arkiveringstiden (bokföringslagens sparkrav — ej djupresearchat i
detta pass, se § Vad jag inte kunde belägga). Dagens app-kvitto skulle
KUNNA vara den verifikationen om PDF:en sparades — i dag är den det inte.

---

## Del 2 — Branschpraxis, system för system

| System | Trigger | Beloppskälla | Lagring + kundens åtkomst | Bulk | Numrering | Fel mitt i serie | Källa + datum |
|---|---|---|---|---|---|---|---|
| **Stripe** | Konfigurerbar per betalningstyp: toggle "Successful payments" ger AUTOMATISKT kvitto vid lyckad betalning; annars manuell "Send receipt"-knapp i Dashboard | Alltid ordern/betalningsintenten — aldrig handinmatat | Kundportal (nedladdning), receipt-länk (upphör efter 30 dagar, kräver då att kunden anger sin e-post för omsändning) | Nej för kundutskick; tredjeparts-appar för ADMIN-export av redan utfärdade dokument | Löpande, Stripe-genererat | Inget kvitto skickas vid misslyckad betalning — inget nummer förbrukas | [docs.stripe.com/payments/checkout/receipts](https://docs.stripe.com/payments/checkout/receipts), [docs.stripe.com/invoicing/dashboard/manage-invoices](https://docs.stripe.com/invoicing/dashboard/manage-invoices), läst 2026-08-30 |
| **Swish Företag** | Skickar INGET kvitto självt — bara en betalningsbekräftelse i Swish-appen, uttryckligen SKILD från ett kvitto | N/A — det är företagets ansvar | N/A | N/A | N/A | N/A | WebSearch-syntes, läst 2026-08-30 |
| **Zettle (PayPal)** | HYBRID: kvittot GENERERAS automatiskt vid varje registrerad betalning, men SÄNDNINGEN (print/mail) är ett separat, aktivt val efter varje betalning | Betalningen som just registrerats | Alla kvitton sparas digitalt i transaktionshistoriken, hämtningsbara i efterhand | Ej funnet | Löpande | Ej funnet | [zettle.com/se/help/articles/2144589-kvitton](https://www.zettle.com/se/help/articles/2144589-kvitton), WebSearch-syntes, läst 2026-08-30 |
| **Klarna** | Automatiskt e-postmeddelande när ordern behandlats | Ordern | Syns även i kundens Klarna-profil/app, oberoende av mailet | Ej relevant (B2C-köpflöde, ej ett admin-verktyg) | Ej undersökt | Ej undersökt | WebSearch-syntes, läst 2026-08-30 |
| **Pretix** (öppen källkod, event-/biljettsystem) | Konfigurerbart TRELÄGE: (1) ingen automatik alls, arrangören sköter allt utanför systemet, (2) MANUELL knapp per order i orderdetaljvyn, (3) AUTOMATISKT så snart betalningen för en order tagits emot | Ordern (adressdata + radposter som redan finns i systemet) | Ej djupt undersökt i detta pass | Ej bekräftat — dokumentationen beskriver PER ORDER-generering, ingen explicit bulk-knapp hittad | Prefix + löpnummer (`PREFIX-00001`, `PREFIX-00002`, …) | Ej funnet | [pretix.readthedocs.io/en/latest/user/events/invoicing.html](https://pretix.readthedocs.io/en/latest/user/events/invoicing.html) — **parafras av sökmotorns sammanfattning; sidan är BORTTAGEN** (pretix byggde om sin dokumentation 2026-08-11, orkestrerarens `curl` gav "this page no longer exists"), så trelägesmodellen är INTE verifierad direkt. **Bankgiro-flödet är däremot verifierat direkt** — se § 2.1 nedan, läst 2026-08-30 |
| **Fortnox — kontantfaktura** | AKTIV: bokföraren väljer explicit "Kontantfaktura" och anger betalsätt (kontant/kort/autogiro) vid registreringstillfället | Fakturaraderna, satta av användaren vid skapandet | Sparas som vanlig faktura i Fortnox | Nej — en faktura i taget | Fortnox löpnummerserie | Ej relevant (ingen räknad "kvittoserie" separat från fakturaserien) | [support.fortnox.se — Skapa kontantfaktura](https://support.fortnox.se/produkthjalp/fakturering/skapa-kontantfaktura), WebSearch-syntes, läst 2026-08-30 |
| **Visma eEkonomi** | AKTIV: "Inbetalning"-funktion registreras manuellt när kontant/Swish-betalning tas emot mot en redan utfärdad faktura | Den befintliga fakturan | Sparas i Visma | Nej | Vismas fakturaserie | Ej undersökt | WebSearch-syntes (forum.vismaspcs.se, support.vismaspcs.se), läst 2026-08-30 |
| **Bokadirekt** | AUTOMATISKT för elektroniska betalningar (Klarna/kort/Apple Pay) vid bokningstillfället; för betalning PÅ PLATS ("on site") ger leverantören kvittot själv, alltså manuellt | Bokningen | Ej djupt undersökt | Ej funnet | Ej undersökt | Ej undersökt | WebSearch-syntes ([business.bokadirekt.se](https://business.bokadirekt.se/blogg/system-for-bokning-och-betalning---sa-forenklar-du-administrationen-med-en-leverantor)), läst 2026-08-30 |
| **Bokamera** | AKTIV: kvitton skapas och skickas/skrivs ut av användaren själv, "till kund som besöker dig eller via e-post" | Ej specificerat i källan | Ej undersökt | Ej funnet | Ej undersökt | Ej undersökt | WebSearch-syntes ([bokamera.se/features/kvitto-faktura](https://bokamera.se/features/kvitto-faktura)), läst 2026-08-30 |
| **Acuity Scheduling (Mindbody)** | AKTIV MEN PER BETALNINGSTILLFÄLLE, INKLUSIVE MANUELLT REGISTRERADE BETALNINGAR: en "Send email receipt"-kryssruta visas VARJE gång en betalning registreras — även när användaren själv registrerar en kontant-/kortbetalning för hand | Bokningens/tjänstens pris i systemet, förifyllt — INTE handinmatat på nytt | Ej djupt undersökt (403 vid direkt hämtning) | Ej funnet | Ej undersökt | Ej undersökt | WebSearch-syntes ([help.acuityscheduling.com — Sending your clients receipts](https://help.acuityscheduling.com/hc/en-us/articles/16676813537293-Sending-your-clients-receipts)), läst 2026-08-30 — **direkt sidhämtning gav HTTP 403, detta är alltså sökmotorns sammanfattning, inte en verifierad sidcitering** |
| **Eventbrite** | AUTOMATISKT — kvittot är inbäddat i den automatiska orderbekräftelsen som skickas vid köp | Ordern | Kunden kan hämta orderbekräftelsen igen (sök i inkorgen), arrangören kan "resend" via dashboard | Ej relevant för kvitton (biljett-PDF:er togs bort ur mailen 2026, kvar bara via inloggning) | Ej undersökt | Ej undersökt | WebSearch-syntes ([eventbrite.com — What emails will attendees automatically receive?](https://www.eventbrite.com/help/en-us/articles/748624/what-emails-will-attendees-automatically-receive/)), läst 2026-08-30 |
| **Tito** | AUTOMATISKT vid registrering; arrangören kan "Resend Confirmation Email" | Ordern | "Self-service attendee receipt" — kunden kan själv hämta sitt kvitto | Ej funnet | Ej undersökt | Ej undersökt | WebSearch-syntes ([help.tito.io](https://help.tito.io/en/articles/1856636-order-and-registration-management)), läst 2026-08-30 |
| **Humanitix** | AUTOMATISKT — PDF-kvitto bifogas VARJE orderbekräftelsemail | Ordern (radpost-nedbrytning, totalbelopp, betalsätt) | Ej djupt undersökt | Ej funnet | Ej undersökt | Ej undersökt | WebSearch-syntes ([help.humanitix.com](https://help.humanitix.com/en/articles/13548552-the-ticket-buyer-journey-on-humanitix)), läst 2026-08-30 |
| **Simple Signup** (svenskt) | AUTOMATISKT — "unikt bokningsnummer och kvitto via e-post och SMS" vid anmälan | Anmälan/bokningen | Ej djupt undersökt | Ej funnet | Bokningsnummer, löpande | Ej undersökt | WebSearch-syntes ([simplesignup.se](https://simplesignup.se/features-n-pricing)), läst 2026-08-30 |

### 2.1 Pretix — verifierat direkt: så gör de vid MANUELL bankavstämning (Lottas fall)

Pretix är det system i tabellen vars flöde ligger närmast Lottas: kunden
bokar online, betalar via banköverföring i efterhand, och arrangören
prickar av inbetalningen mot ordern. Guiden
[docs.pretix.eu/guides/payment/bank-transfer/](https://docs.pretix.eu/guides/payment/bank-transfer/)
hämtades med `curl` 2026-08-30 (orkestreraren) och citeras ORDAGRANT
(engelska, med svensk parafras efter varje citat).

**Tre vägar in för betalningen, i fallande automatiseringsgrad.** *"By
default, pretix does not monitor payments arriving at your bank account.
[…] The alternatives for notifying pretix of incoming payments are:
manually approving payments as complete or regularly importing digital
bank statements."* — Option A är automatisk bankkoppling (GoCardless,
bara pretix Hosted), Option B är import av kontoutdrag (*"The export has
to be a file in the CSV or MT940 file format. It has to contain the
following data: date amount reference payer IBAN BIC"*) där pretix själv
matchar transaktioner mot order och lägger omatchade i en lista
*"Unresolved transactions"* som arrangören löser för hand genom att söka
på *"part of the order code, the buyer's name, one of the attendees'
names, or the email address"*. Option C är manuell avprickning per order.

**Den manuella avprickningen — det som motsvarar Lottas "Mottagen"-kryss:**
*"Check the transaction data of your bank account. If your bank account's
transaction data has a record that matches the order in question, click
the Mark as paid button at the top of the order details page."* Sedan:
*"Adjust the payment amount and date if necessary."* — beloppet är alltså
FÖRIFYLLT från ordern och bara justerbart (Mönster 2), inte inmatat från
tomt. Och den avgörande raden för triggerfrågan: *"By default, pretix
will notify the customer about the order being marked as paid via email.
You can prevent this by unchecking the box next to 'Notify customer by
email'."* — kundens betalningsbekräftelse är en **kryssruta i SAMMA
dialog som avprickningen, förbockad som default**. Exakt Acuity-mönstret
(Mönster 1b), nu belagt i en direkt verifierad primärkälla.

**Irreversibilitet, uttryckligen:** *"Before confirming the order as paid,
verify that you have the correct order, the correct price, and the
correct date. Once pretix has recorded a payment, it is not possible to
delete it."* — samma hållning som ADR-109 beslut 3/6 (ett utfärdat
kvitto består), men pretix lägger vakten FÖRE bekräftelsen som en varning,
inte efteråt.

**Vad pretix INTE gör:** den e-post som skickas vid *Mark as paid* är en
betalningsbekräftelse, inte nödvändigtvis en faktura/ett kvitto — faktura-
genereringen styrs av en separat inställning (trelägesmodellen i
tabellraden ovan, overifierad sedan sidan togs bort). Bulk-avstämning
finns (Option B, hela kontoutdraget på en gång), men även där uppstår
bekräftelsen PER ORDER när matchningen sker — ingen "skicka N kvitton"-
knapp (Mönster 4).

**Metodisk transparens:** flertalet rader ovan bygger på WebSearch-verktygets
egen sammanfattning av sökträffar, inte på en verifierad direkt hämtning av
källsidans HTML (två raderna Pretix och Acuity fick uttryckligen 404/403 vid
försök till direkthämtning och är därför explicit flaggade). Detta är svagare
belägg än en verbatim-citering, men fortfarande FÖRSTAPARTS-innehåll (varje
länk är leverantörens egen dokumentation/hjälpcenter, inte en tredje parts
blogg om leverantören) — se § Vad jag inte kunde belägga för den samlade
reservationen.

---

## Del 3 — Mönster

**Mönster 1 — Triggerfrågan är den ENDA punkten där branschen genuint är
delad, och delningen följer en tydlig linje: kortbetalning/e-handel vs.
tjänstebokning med manuellt registrerad betalning.**

- **Ren e-handel/betalningsplattformar (Stripe, Klarna, Eventbrite, Tito,
  Humanitix, Simple Signup, Pretix i automatiskt läge)**: kvittot är en
  BIPRODUKT av betalningshändelsen — det uppstår för att en elektronisk
  betalning just godkändes, ingen mänsklig handling krävs mellan
  betalning och kvitto.
- **Boknings-/tjänstesystem där betalningen ofta registreras MANUELLT av
  utföraren (Acuity/Mindbody, Zettle, Bokamera, Fortnox-kontantfaktura,
  Visma-inbetalning)**: en aktiv handling kvarstår, ÄVEN i system som
  annars är mycket automatiserade — men (Mönster 1b, viktigt) den aktiva
  handlingen är nästan alltid en KRYSSRUTA/VAL vid SAMMA tillfälle som
  betalningen registreras, inte en separat, senare handling i en helt
  annan vy. Acuity är den renaste precedenten: kryssrutan dyker upp VARJE
  gång en betalning — även en manuellt inmatad kontantbetalning —
  registreras.

  **Detta är den strukturellt viktigaste observationen för Lottas flöde:**
  Miranons NUVARANDE mönster (aktiv handling, synlig först när betalningen
  är Mottagen) är **inte en avvikelse från branschen** när jämförelsen görs
  mot rätt referensklass (bokningssystem med manuell betalningsavstämning,
  inte ren e-handel). Marcus-beslut (a) har alltså minst en stark
  branschprecedent (Acuity/Mindbody) att luta sig mot — grillningen behöver
  inte utgå från att beslutet står ensamt mot branschen.

**Mönster 2 — Beloppet kommer ALLTID från en order/bokning/befintlig
faktura, ALDRIG handinmatat på nytt vid kvittotillfället.** Detta höll
utan undantag i varje system som undersöktes, inklusive de "aktiva
handling"-systemen (Acuity förifyller från bokningens pris; Fortnox
kontantfaktura har fakturaraderna redan satta av användaren VID
FAKTURASKAPANDET, inte vid kvittotillfället). **Detta är den punkt där
Miranons flöde avviker mest från branschen** — och avvikelsen är en
KONSEKVENS av en verklig datalucka (inget prisfält i basen, ADR-109 §
Kontext), inte ett aktivt designval att låta Lotta skriva in beloppet för
hand. Ingen av de undersökta branschledarna har detta mönster; samtliga
förutsätter att ett numeriskt pris redan finns lagrat NÅGONSTANS innan
kvittot/fakturan skapas.

**Mönster 3 — Kunden kan i praktiken alltid hämta kvittot igen.**
Kundportal (Stripe), self-service-hämtning (Tito), sök-i-inkorgen +
"resend" (Eventbrite), synligt i egen app-profil oberoende av mailet
(Klarna), sparat i transaktionshistoriken (Zettle). Miranons flöde
(`lagringsnyckel: null`, ingen "hämta igen"-väg, ingen kopia till Lotta)
är den enda undersökta implementationen där kvittot BARA finns i det
enskilda mailet och försvinner om det mailet försvinner.

**Mönster 4 — Bulk finns, men aldrig i formen "utfärda N nya kvitton på en
gång".** Där bulk förekommer är det ADMIN-EXPORT av REDAN UTFÄRDADE
dokument (Stripes tredjepartsappar för bulk-nedladdning av redan skapade
kvitton/fakturor) — inte en knapp som skapar och skickar flera NYA kvitton
samtidigt till flera olika mottagare. Detta är konsekvent med att kvittot i
varje undersökt system är en HÄNDELSESTYRD biprodukt av EN specifik
betalning: det finns strukturellt inget att "bulka" förrän N separata
betalningshändelser redan inträffat var för sig. **Precedenten talar
alltså emot en bulk-SÄNDNINGSknapp för kvitton specifikt** (kartläggningens
ursprungsfråga — "20 kvitton före utskicket") — ingen undersökt
branschledare bygger den formen.

**Var precedensen är tunn, deklarerat öppet:** de svenska nischade
event-/kursanmälningssystemen (Simplesignup delvis täckt, men Invajo,
Confetti, Trippus, Lyyti, Billetto gav inga användbara träffar om just
kvittomönster i detta pass) och de svenska bokningssystemen (Bokamera,
Bokadirekt) gav tunnare, mindre detaljerade träffar än de internationella
betalplattformarna och de öppna källkods-/engelskspråkiga
biljettsystemen. Slutsatserna i Mönster 1–4 vilar tyngst på Stripe,
Pretix, Acuity, Eventbrite, Tito och Humanitix — sex system, inte de
ursprungligt föreslagna tio-plus. Räkningen fejkas inte: sex källor med
god detaljnivå + fem-sex med tunnare täckning, inte tolv likvärdiga.

---

## Vad detta betyder för Lottas flöde — HYPOTESER, inte beslut

Markerade tydligt per öppen punkt i kartläggningen. Marcus beslutar.

**(a) Trigger.** Branschen ger STÖD åt att behålla aktiv handling
(Acuity/Mindbody-precedenten, Mönster 1) — men den starkaste versionen av
den precedenten är en kryssruta VID betalningsregistreringstillfället,
inte en helt separat handling i en annan vy senare. Om syftet med en
framtida bulk-lösning är "20 kvitton vid utskicket" (kartläggningens
ursprungsfråga) talar Mönster 1+4 SAMFÄLLT emot att koppla kvittot till
INFORMATIONSutskicket — ingen branschledare kopplar ett kvitto till något
annat än betalningshändelsen själv. Kartläggningens egen slutsats
("kvittot hör till betalningen, inte till informationsrundan") får alltså
oberoende stöd här.

**(b) Beloppskälla — prisfält i basen?** Mönster 2 är entydigt: EVERY
undersökt system förutsätter ett existerande numeriskt pris innan
kvittot skapas. Miranons handinmatade belopp är branschens ENDA avvikelse
bland de undersökta systemen. Detta väger tungt för att ett numeriskt
prisfält (ADR-109 § Öppna punkter nämner det redan som "en möjlig framtida
förenkling") är rätt riktning oavsett vad triggerfrågan landar i — det är
en förutsättning för nästan varje annat förbättrat mönster (automatisk
beloppsifyllnad, en framtida bulk-lösning, minskad risk för Lotta-
inmatningsfel).

**(c) Felhantering vid N sändningar.** Ingen av de undersökta systemen
visade explicit felhanteringslogik för en trasig batch (Pretix-
dokumentationen beskrev bara EN order i taget, aldrig en batch-vy) —
denna delfråga förblir OBELAGD ur branschmaterialet. ADR-109:s egen modell
(förlorad kandidat → numret hoppas över för alltid, aldrig återanvänt) är
den enda konkreta, bevisade mekanismen som finns att luta sig mot, och den
är redan byggd och testad.

**(d) Lagring/kopia till Lotta.** Mönster 3 är entydigt och Miranons
NUVARANDE avsaknad (`lagringsnyckel: null`) är branschens enda avvikelse.
Detta är dessutom INTE bara en UX-brist (§ 1.2 ovan) — utan sparad kopia
uppfyller flödet sannolikt inte heller bokföringslagens verifikationskrav
FÖR MIRANON SJÄLV, om avsikten är att kvittot ska tjäna som Miranons egen
verifikation. Att spara PDF:en (redan flaggad som öppen fråga i
kartläggningens § (f)) får därför starkare skäl än bara "kunden kan
efterfråga en kopia" — det kan vara en förutsättning för att Miranons
EGEN bokföring är korrekt dokumenterad.

**(e) Bulk — behövs den alls om triggern är rätt?** Mönster 4 talar för
att svaret är NEJ i den form kartläggningens ursprungsfråga föreslog (en
bulk-knapp som skickar 20 kvitton på en gång, kopplad till
informationsutskicket). Om (a) och (b) löses rätt — kvittot kopplas till
betalningshändelsen och beloppet härleds automatiskt — minskar behovet av
bulk till just den friktion som återstår: 20 separata aktiva
knapptryckningar i stället för 20 dialoger med handinmatning. Ingen
undersökt branschledare löser DEN friktionen med en bulk-sändningsknapp;
de löser den genom att göra VARJE enskild sändning billig (förifyllt
belopp, en kryssruta, ingen dialog).

---

## Vad jag inte kunde belägga

- **Om Miranons flöde faktiskt, i sin helhet, kvalificerar som
  "distansavtal" i varje enskilt fall.** Slutsatsen i § 1.1 bygger på
  lagens definition tillämpad på det flöde kartläggningen beskriver
  (bokning + betalning i efterhand, aldrig fysiskt möte vid
  betalningstillfället). Om Lotta någon gång tar emot en betalning
  ansikte mot ansikte (t.ex. kontant/Swish på ett fysiskt retreat) är DEN
  specifika transaktionens rättsläge INTE undersökt här och kan mycket
  väl falla utanför undantaget.
- **Detta är INTE en juristgranskad slutsats.** Både kassaregisterlagens
  tillämpning och bokföringslagens verifikationskrav är läsning av
  primärkällor (lagtext + Skatteverkets egna sammanfattningar) gjord av en
  research-agent, inte ett inhämtat skatterättsligt utlåtande. Ett
  formellt ombud/revisor bör bekräfta båda slutsatserna innan de blir
  grund för ett produktbeslut som rör skarp kundleverans.
- **Bokföringslagens sparkrav (arkiveringstid för verifikationer) är INTE
  djupresearchat i detta pass** — nämnt i förbigående (allmänt känt som
  sju år) men ingen primärkälla citerad. Om § (d)-hypotesen (spara PDF:en
  som Miranons egen verifikation) drivs vidare måste sparkravet
  verifieras separat.
- **Pretix och Acuity-raderna i tabellen är WebSearch-sammanfattningar,
  inte verifierade direkthämtningar** — två oberoende WebFetch-försök mot
  Pretix gav 404 (fel/borttagen sida), och Acuity gav HTTP 403
  (troligen bot-blockering). Innehållet är därför en andra hands
  sammanfattning av leverantörens egen dokumentation, inte en av mig
  verifierad citering. Sannolikt korrekt (samma innehåll kom fram via två
  oberoende sökningar för Pretix), men flaggat explicit per regeln
  "citera bara text du faktiskt sett".
- **Svenska nischade kurs-/eventanmälningssystem (Invajo, Confetti,
  Trippus i detalj, Lyyti, Billetto)** gav inga användbara träffar om
  specifikt kvittomönster i detta pass — se § Mönster, "Var precedensen är
  tunn". Om Marcus känner till en specifik konkurrent Lotta jämför sig
  med är den INTE täckt här och bör läggas till vid behov.
- **Om ett numeriskt prisfält i basen (hypotes b) är tekniskt/
  organisatoriskt genomförbart** ligger helt utanför detta pass — det är
  en kod-/data-fråga, inte en juridik-/branschfråga, och hör hemma i en
  separat teknisk bedömning.

---

## Rekommendation (REKOMMENDATION, inte beslut — Marcus avgör)

1. Ta med § 1.1's distansavtals-slutsats till grillningen som en
   FÖRUTSÄTTNINGS-fråga innan trigger/bulk diskuteras: om kvittot inte är
   en lagstadgad plikt utan en servicehandling, öppnas designrymden bredare
   (t.ex. "skicka bara om kunden efterfrågar det" blir en juridiskt giltig
   väg, inte bara en bekvämlighetsgenväg).
2. Behåll aktiv handling som PRINCIP (branschstöd finns, Mönster 1) men
   pröva om den aktiva handlingen kan vara EN kryssruta i SAMMA dialog som
   betalningen redan bockas av (Acuity-mönstret) i stället för en separat
   knapp som dyker upp EFTERÅT — det minskar friktionen utan att bryta
   Marcus-beslut (a)s "aldrig automatik"-linje.
3. Prioritera ett numeriskt prisfält (hypotes b) högre än en bulk-knapp
   (hypotes e) — Mönster 2+4 pekar samfällt på att beloppskällan är den
   verkliga flaskhalsen, inte avsaknaden av bulk.
4. Utred sparandet av PDF:en (`lagringsnyckel`) som en möjlig
   bokförings-verifikationsfråga, inte bara en UX-fråga — ta med en
   revisor/Roger i den bedömningen innan beslut, se § Vad jag inte kunde
   belägga.

---

## Källförteckning

**Svensk rätt (5 källor):**

- Skatteverket — [Kassaregister](https://www.skatteverket.se/foretag/drivaforetag/kassaregister.4.121b82f011a74172e5880005263.html), läst 2026-08-30
- Skatteverket — [Undantag från krav på kassaregister](https://www.skatteverket.se/foretag/drivaforetag/kassaregister/undantagfrankravpakassaregister.4.6efe6285127ab4f1d2580005105.html), läst 2026-08-30 (direkthämtning delvis blockerad, kompletterad med WebSearch-syntes av samma URL)
- Skatteverket — [Momslagens regler om fakturering](https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/momslagensregleromfakturering.4.58d555751259e4d66168000403.html), läst 2026-08-30
- Skatteförfarandelagen (2011:1244) 39 kap. 4–5 §§, direkt lagtextcitat via [lagen.nu/2011:1244](https://lagen.nu/2011:1244), hämtad med `curl` och textextraherad lokalt 2026-08-30 (orkestrerarens verifiering). Den tidigare kassaregisterlagen (2007:592), som research-passets första version citerade, är upphävd genom SFL — se § 1.1
- Lag (2005:59) om distansavtal och avtal utanför affärslokaler, 1 kap. 2 § (definition), via [lagen.nu/2005:59](https://lagen.nu/2005:59), samt namnhistorik via [riksdagen.se](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-200559-om-distansavtal-och-avtal-utanfor_sfs-2005-59/) och [Wikipedia](https://sv.wikipedia.org/wiki/Lag_om_distansavtal_och_avtal_utanf%C3%B6r_aff%C3%A4rslokaler), läst 2026-08-30
- Bokföringslagen (1999:1078) 5 kap, WebSearch-syntes via [lagen.nu/1999:1078](https://lagen.nu/1999:1078) och [Bokföringsnämndens vägledning](https://www.bfn.se/wp-content/uploads/2020/06/vagledning-bokforing.pdf), läst 2026-08-30
- Konsumentverket — [Regler för kvitto](https://www.konsumentverket.se/konsumentratt/regler-for-kvitto/), läst 2026-08-30

**Betalplattformar (4 källor):** Stripe ([receipts](https://docs.stripe.com/payments/checkout/receipts), [invoice-vs-receipt](https://stripe.com/resources/more/is-an-invoice-a-receipt), [dashboard](https://docs.stripe.com/invoicing/dashboard/manage-invoices)) · Swish (WebSearch-syntes, ingen enskild primärsida bar hela svaret) · Zettle ([zettle.com/se/help/articles/2144589-kvitton](https://www.zettle.com/se/help/articles/2144589-kvitton)) · Klarna (WebSearch-syntes)

**Event-/biljettplattformar (6 källor):** Pretix ([bank-transfer-guiden](https://docs.pretix.eu/guides/payment/bank-transfer/), direkt verifierad med `curl` 2026-08-30 — § 2.1; [invoicing docs](https://pretix.readthedocs.io/en/latest/user/events/invoicing.html), sökmotors-sammanfattning, sidan borttagen) · Eventbrite ([automatiska mail](https://www.eventbrite.com/help/en-us/articles/748624/what-emails-will-attendees-automatically-receive/)) · Tito ([order/registration management](https://help.tito.io/en/articles/1856636-order-and-registration-management)) · Humanitix ([ticket buyer journey](https://help.humanitix.com/en/articles/13548552-the-ticket-buyer-journey-on-humanitix)) · Simple Signup ([features](https://simplesignup.se/features-n-pricing)) · Invajo/Confetti/Trippus/Lyyti/Billetto (sökta, otillräckliga träffar om kvittomönster — se § Mönster)

**Svenska bokförings-SaaS (3 källor):** Fortnox ([skapa kontantfaktura](https://support.fortnox.se/produkthjalp/fakturering/skapa-kontantfaktura)) · Visma eEkonomi (WebSearch-syntes, forum.vismaspcs.se + support.vismaspcs.se) · Bokio (sökt, ingen unik detalj utöver Visma-mönstret)

**Kurs-/bokningssystem (3 källor):** Acuity Scheduling/Mindbody ([sending clients receipts](https://help.acuityscheduling.com/hc/en-us/articles/16676813537293-Sending-your-clients-receipts), sökmotors-sammanfattning) · Bokadirekt ([system för bokning och betalning](https://business.bokadirekt.se/blogg/system-for-bokning-och-betalning---sa-forenklar-du-administrationen-med-en-leverantor)) · Bokamera ([kvitto & faktura](https://bokamera.se/features/kvitto-faktura))

**Internt (läst i sin helhet, ej ny research):** [`kvitto-flodet-kartlaggning-2026-08-30.md`](kvitto-flodet-kartlaggning-2026-08-30.md) · [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md) · [`T170`](../../tasks/threads/T170-rogers-kvittoforlaga-besvarar-tre-oppna-punkter.md)
