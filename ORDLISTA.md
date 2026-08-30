---
owner: marcus803
updated: 2026-08-30
review_by: 2027-01-02
status: stable
---

# Ordlista — Miranon Media (produktdomänen)

> **Äger:** produktdomänens BEGREPP (vad något ÄR, på begreppsnivå).
> **Kartlägger:** `docs/reference/data-model.md` (mekaniken — fält-ID:n,
> formler, statusvärde-enumereringar) och hubbens `SYSTEMET.md` §0
> (samarbetssystemets termer). **Vid konflikt vinner:** denna ordlista för
> begreppsdefinitioner; `data-model.md` för mekanik; hubben för
> systemtermer — domänerna överlappar inte, så ingen egentlig konflikt är
> möjlig om avgränsningen nedan hålls.

Kanoniskt domänspråk för produktdomänen — Lottas värld: event, anmälningar,
personer, närvaro, mail. Ordlistan äger BEGREPPEN (vad något ÄR, på begreppsnivå);
mekaniken — fält-ID:n, formler, statusvärde-enumereringar, kända fällor — bor i
[docs/reference/data-model.md](docs/reference/data-model.md). Samarbetssystemets
termer bor i hubbens `SYSTEMET.md` §0 och hör
inte hemma här. Endast projektspecifika domänbegrepp får post — allmänna
programmeringsbegrepp exkluderas, hur ofta de än används. Underhåll: uppdatera
direkt när en term kristalliseras eller skärps — bunta aldrig. Vid flera ord för
samma begrepp: ta ställning, kanonisera ett, lista resten under *Undvik*.
(Mekanismen designad S47 Del 7; format och snitt-regler låsta där.)

## Kärnobjekt

**Person** — en människa i basen: kund, lead eller tidigare deltagare; navet som
anmälningar, deltaganden och engagemang länkar till.
*Undvik:* kund, kontakt, medlem.
*I koden:* `Person`.

**Event** — ett schemalagt kurs- eller föreläsningstillfälle med ort, datum och
platser (Airtable-tabellen heter Eventplanering). Även VALET av vad som ges
benämns Event i UI (Fjärrskådning, RIM 1–3 — "Välj event"; Marcus S73 K78).
*Undvik:* tillfälle, kurs (kursen är taxonomi-axeln; eventet är tillfället),
utbildning (utbildning är en EVENTTYP — se Eventtyp).
*I koden:* `Event`.

**Eventtyp** — klassningen av ett event: Utbildning eller Föreläsning
(Marcus S73 K78; K77:s Utbildning-post var FEL — utbildning är en eventtyp,
inte taxonomi-axeln — och är ersatt av denna, öppet rättat). Namnkrock mot
basen bokförd: basens fält `Typ` bär enumen Utbildning/Föreläsning, medan
basens fält `Eventtyp` är LÄNKEN till Eventformat-tabellen — UI-språket
följer Roger & Lotta; mappningen är PRD-materia.
*Undvik:* typ (ensamt; tekniskt fältnamn, inte domänspråk).
*I koden:* `typ` (basens `Typ`).

**Anmälan** — en persons begäran att delta i ett specifikt event.
*Undvik:* bokning, registrering.
*I koden:* `Registration`.

**Inbetalning** — en betalning som faktiskt kommit in på Miranon Medias konto
(Swish, Bankgiro eller Plusgiro): en post per bankrad, med belopp, betalsätt,
datum och den anmälan den gäller. Inbetalningen är ARBETSENHETEN i Lottas
betalningsflöde (grillad samsyn S113, 2026-08-30): anmälans fack
Anmälningsavgift/Slutbetalning härleds ur inbetalningarna mot eventets
numeriska pris, och ett kvitto avser exakt en inbetalning. Handlingen att
skapa en inbetalning i appen heter *registrera betalning*.
*Undvik:* avstämning (betyder NÄRVARO i basen — se Deltagande), avprickning
(den gamla handlingen att flippa facket för hand), transaktion, betalning
(överbegreppet; säg inbetalning när pengarna kommit in).
*I koden:* `Inbetalning` (tabell `Inbetalningar`, planerad).

**Användarinbjudan** — en engångs- och tidsbegränsad inbjudan som ger en
människa ett konto i appen, med roll och e-postadress låsta av inbjudan
(mottagaren väljer inget själv). Skild från *Anmälan*, som gäller deltagande
i ett event — en person kan ha båda utan samband. Kanoniserad S95
(T95-grillningen, sessionsdok Del 2 beslut 5).
*Undvik:* invite (engelska i UI-text), inbjudan (ensamt, där förväxling med
event-sammanhang är möjlig).
*I koden:* `invite` (EF + routes, byggs under T95 Spår B).

**Deltagande** — en persons närvaropost för ett event; bär närvarostatusen som
driver Insiktskedjan.
*Undvik:* närvaro (närvaron är statusen på posten, inte posten själv).
*I koden:* `Attendance`.

**Anteckning** — en tidsstämplad post i en antecknings-STRÖM (composer överst, nyast
först) med författare (den inloggade användaren, satt server-side ur den verifierade
identiteten). Bärs av EN delad additiv tabell (`Anteckningar`, ADR-075) för BÅDA
event OCH person — en rad hör till exakt ett av dem (`Event`-länk eller `Person`-länk,
aldrig båda). Eventets ström har en härledd fas-etikett (Under/Efter eventet; Innan
omärkt per tysta normen); personens ström saknar motsvarande begrepp (personer har
ingen eventdags-referens att härleda den ur). Skild från Personers ÄLDRE fria
`Anteckningar`-fält (`update-person-note`, `PersonNoteEditor`) — de två person-ytorna
lever BREDVID varandra sedan S103 (T97-bygg-spåret); migrering av fältets innehåll
till strömmen är en separat, senare handling.
*Undvik:* kommentar; notering (Eventplaneringens `Notering` är den gamla EN-fältsytan
strömmen ersätter, inte utökar).
*I koden:* `EventNote`/`CreateEventNoteInput` (event-sidan), `PersonNote`/
`CreatePersonNoteInput` (person-sidan, S103); basens tabell `Anteckningar`.

**Flagga** — Lottas egen FRITEXT-flagga på en person (S103, Marcus 2026-08-10,
ordagrant: "det ska vara en flagga som Lotta själv skriver i fritext, som
sedan blir en flaggikon på personen då möjligtvis"). Ett fritt textfält, inte
ett urval ur en lista. Ersätter `Manuella flagga` (den gamla singleSelect:en
med `choices=[]` som aldrig kunde sättas — se `data-model.md` §Kända fällor
25); det gamla fältet lämnas kvar tomt (Airtables Meta-API kan varken ändra
fälttyp eller radera fält). Skild från `AI-flagga` (automatiskt härledd
klassificerare, oberörd av detta).
*Undvik:* manuell flagga (namnet på det AVLÖSTA fältet, inte det aktiva).
*I koden:* Airtable-fältet `Flagga`; skrivs via operationen `update-person-flag`
(`field-allowlists.ts`), hooken `useUpdatePersonFlag`.

**Väntelisteplats** — en persons plats i kön till ett fullbokat event, sorterad
på när personen ställde sig.
*Undvik:* reserv, köplats.
*I koden:* `WaitlistEntry`.

**Erbjudande** — gratis material (t.ex. guide eller meditation) en person kan
hämta på miranon.se; lead-magnet-domänens kärna.
*Undvik:* lead-magnet, produkt.

**Engagemang** — aggregatet av en persons hämtningar av ett specifikt erbjudande
(person × erbjudande, med första/senaste hämtning och totalt antal).
*Undvik:* hämtning (hämtningen är händelsen; engagemanget är aggregatet).
*I koden:* `Engagement`.

**Intresserad** — en person som hämtat minst ett erbjudande men inte har någon
anmälan; definitionen låst i Fas 6e L1.
*Undvik:* lead, prospekt.
*I koden:* `Intresserad`.

**Segment** — en sparad regel vars medlemskap beräknas on-demand från
Deltaganden — aldrig en lagrad mottagarlista (ADR-062).
*Undvik:* målgrupp, lista.
*I koden:* `Segment`.

**Grupp** — i segmentdomänen: en av de mängder personer som
"Dela upp i grupper"-generatorn (partition-som-generator) skapar vid EN
körning; varje person hamnar i exakt en grupp (disjunkt fördelning), och
varje grupp blir ett vanligt predikat-segment. Ordet bär sedan S104 ENDAST
denna uppdelnings-betydelse — den tidigare andra betydelsen (en OR-gren i
verkstadens regel) heter numera Alternativ (Marcus 2026-08-16,
begreppsrenheten: två betydelser, ett ord, på ytor man rör sig mellan i
samma arbetspass).
*Undvik:* grupp om verkstadens OR-gren (se Alternativ), villkorsgrupp.
*I koden:* `byggGrupp`/`DelaUppIGrupper` (prototyp,
`src/components/segment/prototyp/VariantD.tsx`).

**Uppsättning** — den samlade omgången Grupper som "Dela upp i
grupper"-generatorn skapar tillsammans vid EN körning (t.ex. de fjorton
kurs-grupperna); bär en delad uppsättnings-identitet (härledd ur id-prefix)
som Täckningsvyn läser för att visa omgången som helhet ("varje person i
exakt en grupp", "N personer i ingen grupp"). Flera uppsättningar kan visas
samtidigt; namnet döljs vid en ensam uppsättning (inget att välja mellan,
brus).
*Undvik:* batch, omgång, sats (informella, ej kanoniserade).
*I koden:* uppsättnings-identitet härledd ur id-prefix (prototyp,
`VariantD.tsx`).

**Alternativ** — i segmentverkstaden: en OR-gren i regelns `med`-sida — en
konjunkt-grupp av villkor som (vid två eller fler villkor) måste uppfyllas
SAMTIDIGT ("och-krav" smalnar av ETT alternativ), medan personen kvalificerar
så fort NÅGOT alternativ är uppfyllt ("Eller: lägg till ett alternativ"
vidgar regeln). Ersätter det interna namnet "villkorsgrupp" i synlig text
sedan S104 — se Grupp för varför ordet "grupp" är ute ur verkstadens copy.
*Undvik:* villkorsgrupp (i synlig text — kvar som intern beskrivning), grupp
(verkstadens sammanhang).
*I koden:* `KonjunktLista`; identifierarna `onLaggTillGrupp`/`gruppEtikett`
är medvetet ORÖRDA trots namnbytet i synlig text (Marcus order — inte synlig
text, ett namnbyte hade breddat diffen utan att flytta en pixel); prototyp,
`VariantD.tsx`.

**Urval av personer** — segmentlistans ingress-definition av vad ett Segment
är för Lotta: "Urval av personer som du kan skicka riktade mail till."
Kanoniserat, begreppsrent ordval (S104) för ytan som möter Lotta — undviker
teknisk regel-/predikat-språk i ingressen.
*Undvik:* regel, predikat, filter (tekniskt språk, inte ingressens ord).
*I koden:* prototyp, `VariantD.tsx` (segmentlistans ingress).

**Utskick** — ett mail som skickas till ett eller flera segments mottagare och
loggas i Utskicksloggen.
*Undvik:* kampanj.
*I koden:* `MailPayload` (send-payload), `BulkMail`; logg-raden är `MailLogEntry`.

**Mentala ankare** — låst kursmaterial i Skool-communityt, åtkomligt endast för dem
som gått motsvarande utbildning. Roger & Lottas egen term, och den används i
plural även om ett enskilt material avses (`Mentala ankare RIM1`) — det är fler än
ett ankare per kurs. Skool kallar dem `courses` och märker dem
`Private: Specific members have access`. Tre finns (Fjärrskådning, RIM1, RIM2);
Psionautics saknar ännu ett. Skiljs från de öppna Skool-kurserna, som alla
medlemmar når.
*Undvik:* mentalt ankare (singular), material, kurs (tvetydigt mot event-domänens
kurs), klassrum.

**Bilaga** — en PDF som Lotta väljer att bifoga i ett utskick. Tre
dokumentklasser (grillad samsyn S93): **A — uppladdad** (statisk fil, t.ex.
hörlursinfo, meny), **B — event-mallad** (systemmall där eventfälten fylls i,
t.ex. deltagarinformations-brevet), **C — person-genererad** (skapas ur
person- + betalningsdata, t.ex. betalningskvittot). Bytesen bor i Storage,
metadatat och eventkopplingen i basen (delad hemvist, ADR vid bygget).
Varje bilaga bär dessutom en **räckvidd** (S108-grillningen; ersätter
ADR-118:s ursprungliga form). Räckvidden är ortogonal mot dokumentklassen:
klassen är innehållets ursprung, räckvidden dess spridning.
*Undvik:* dokument (ytan i Mer heter **Bilagor** sedan 2026-08-29, S113 —
hette Dokument dessförinnan; "dokument" står kvar bara där ordet inte är en
bilaga, t.ex. kvittots förhandsvisning), attachment.

**Räckvidd** — vilka event en bilaga gäller för. Antingen **ett utpekat
event** (en direktlänk), eller ett **filter** över tre valfria axlar:
Familj · Event · Plats (familjen kan smalnas till ett **Steg**). Axlarna
kombineras med OCH — *Familj RIM + Plats
Rönninge* betyder "RIM-event som ligger i Rönninge", aldrig unionen av de
två. En tom axel begränsar inte, så *inga axlar satta* betyder alla event.
Filtret lagras i basen som EN singleSelect-option, **"Gemensam"**
(`Bilagor.Räckvidd`), oavsett hur många av de tre axlarna som är satta —
det är matchningen i kod, inte basvärdet, som avgör om en gemensam bilaga
gäller alla event eller ett smalare urval (`TASK-338`). Kvitterad
S108-grillningen (frågorna 4 och 9); ersätter ADR-118 beslut 1:s "exakt EN
räckvidd, aldrig kombinerbart" och dess separata "alla event"-läge, som blir
"inga filter satta".
*Undvik:* scope, kurstyps-räckvidd (kurstyp är inte ett kanoniskt begrepp —
se Eventinnehåll).

**Gemensam bilaga** — en bilaga vars räckvidd är ett filter snarare än ett
utpekat event: syns automatiskt, märkt med räckviddsbadge, i varje berört
events dokumentlista och i Dokument-ytans egen listning; byts/raderas
ENDAST i sitt räckviddsläge på Dokument-ytan, aldrig ur ett enskilt events
kontext (S107-grillningen, ADR-118 beslut 3 — oförändrat av S108). Badgens
texten beror på vilka axlar som är satta: "Alla event" (inga axlar) ·
"RIM · Steg 1" (familj + steg) · "Rönninge" (bara plats) · "RIM · Rönninge"
(familj + plats) · "RIM · Steg 1 · Rönninge" (alla tre) — Kursnivåns
basfältnamn ("Nivå 1") mappas till "Steg 1" i presentationslagret, se
§ Steg. Badgen visas i Dokument-ytan; sedan `TASK-339` (Marcus 2026-08-29)
INTE längre i Åtgärds-sidans bilageväljare, där den konkurrerade visuellt
med kryssrutan och filnamnet — varifrån dokumentet kommer är inte ett
beslutsunderlag i den ytan.
*Undvik:* universell bilaga (arbetsbegreppet under grillningen), global
bilaga, statisk bilaga (förväxlas med dokumentklass A).

**Steg** — RIM-familjens gradering: Intro, Steg 1, Steg 2, Steg 3. Ordet är
**Steg — aldrig "Nivå" — överallt** (Marcus S108; utvidgar S107:s beslut som
bara gällde Dokument-ytan). Basens fält heter alltjämt `Kursnivå` med
optionsnamnen `Nivå 1`–`Nivå 3`, och EF:ens validering avvisar allt annat, så
bytet lever tills vidare i presentationslagret (`src/components/dokument/
nivaSprak.ts` — enda platsen ordet översätts). När basen byter raderas den
filen. Nivålösa familjer (Fjärrskådning, Psionautics) har inga steg alls.
*Undvik:* nivå, kursnivå (utom när basens fältnamn citeras ordagrant).

**Eventinnehåll** — de redigerbara texterna som hör till en kombination av
**Event** och **Eventtyp**: beskrivningstext och agenda per dag. Kombinationen
är nyckeln eftersom samma Event kan ges som båda eventtyperna med olika
innehåll — Fjärrskådning finns som tvådagars utbildning och som föreläsning
(mätt i prod 2026-08-20: sju kombinationer i hela beståndet). Levererar
standardvärden till de genererade bilagorna; ett enskilt event kan skriva
över dem för sitt eget tillfälle. Kanoniserad S108-grillningen (fråga 9) —
Marcus valde namnet sedan "kurstyp" fallit på ORDLISTA:ns egen avrådan mot
"kurs", och "Eventtyp" visat sig upptaget av Utbildning/Föreläsning.
*Undvik:* kurstyp, kursinnehåll (kursen är taxonomi-axeln — se Event),
eventmall (posten är innehållet i en mall, inte mallen).

**Plats** — orten där ett event hålls, som egen post med de uppgifter som
följer med platsen snarare än med tillfället: adress, parkeringsinformation
och transportinformation. Rönninge är Roger & Lottas hem och har därför
stabila värden; övriga orter är hyrda lokaler där uppgifterna skiljer sig per
tillfälle och normalt skrivs på eventet i stället. Kanoniserad
S108-grillningen (frågorna 5–8).
*Undvik:* ort (basens fältnamn för enbart ortsnamnet — platsen är posten,
orten är dess namn), lokal, adress (adressen är ETT av platsens fält).

**Åtgärds-sida** — den event-knutna sida där Lotta verkställer utskick:
mottagarna hon markerat och "dragit med", åtgärdsval (utskickstyp),
redigerbar meddelandetext, bilageväljare och skick med förhandsvisning.
Ersätter batch-barens direktutskick och Åtgärds-radernas grå löften; alla
utskick är riktiga server-utskick (grillad samsyn S93, fråga 4–5).
*Undvik:* utskickssida, mailsida, compose (engelska).

**Aktivitetslogg** — systemets append-only-register över allt som förändrar
data: varje mutation skriver ett xAPI-statement med aktör, händelse och
objekt (S105-grillningen; lagras i Supabase `activity_log`, inte i basen —
ADR mintas vid bygget). Loggar ATT något hände — aldrig anteckningsinnehåll.
Principen: allt som förändrar data, inget som bara visar.
*Undvik:* logg (ensamt), audit log, händelselogg.
*I koden:* `activityLog`.

**Aktivitetshistorik** — Lottas VY över aktivitetsloggen: hem-vyns högerspalt
(k10-facit) och den fulla historikvyn med filterrad; poster i naturligt språk
("Lotta markerade betalning — …"). Distinktionen: loggen är datan,
historiken är det Lotta ser (S105-grillningen).
*Undvik:* logg (i UI-text), aktivitetsström.

## Flöden och distinktioner

**Insiktskedjan** — beroendekedjan som steg för steg förvandlar närvarostatus på
Deltaganden till Erfarenhetsnivå och Erfarenhetsbadge på Personer.

**Erfarenhetsbadge** — human-läsbar badge på en Person som sammanfattar
genomförd kurserfarenhet; Insiktskedjans slutsteg.
*Undvik:* nivå (Erfarenhetsnivå är det tekniska mellansteget).

**Anmälningskedjan** — det parallella, snabbare flödet från skapad Anmälan via
automatisk event- och person-länkning till personens anmälningsmått; kräver
inte närvaro.

**Spår 1/Spår 2-distinktionen** — modellens viktigaste läsregel: Spår 1-mått
räknar från Anmälningar (kräver INTE närvaro), Spår 2-mått räknar från
Deltaganden (KRÄVER närvaro); vilket spår ett mått tillhör avgör vad det
faktiskt betyder.

**Backfill** — efterimport av historisk data där anmälan skapas utan befintlig
person — omvänt mot designflödet (lead först, anmälan sedan).

**Modalitet** — event-taxonomins andra axel: Utbildning eller Föreläsning
(kurs × modalitet).
*I koden:* `Modalitet`.

**Morgonkoll** — hem-vyns jobb som begrepp: den dagliga genomläsningen där
Lotta ser vad som väntar och gör det direkt på plats. Identiteten låst S102
Del 10 (grillning 4, beslut 1): Hem är ARBETSPLATSEN — handlingar påbörjas
och slutförs utan att lämna vyn (sändflöden som overlay).
*Undvik:* dashboard, översikt (Hem är en arbetsyta, inte en rapport).

**Bevakningsrad** — hem-vyns yta för sällsynta men tidskritiska härledda
uppgifter (först ut: deltagarinfo-utskicket): helt osynlig när inget finns,
klickbar uppgiftsrad vid träff — till skillnad från BLOCK, som alltid står
kvar med positivt kvitto vid noll (S102 Del 10, beslut 2–4).
*Undvik:* larm, notis (raden är en uppgift som står kvar tills åtgärdad,
inte en händelse som blinkar förbi).

**Notistrappan** — appens yttrappa för notis- och felmeddelande-familjen
([ADR-121](docs/decisions/ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md),
grillad samsyn S109/S110): åtta klasser efter två axlar (*orsakade
användaren detta?* · *kräver det handling nu?*) — överlagrad passiv notis
(uppdateringsnotisen) · banner i flödet under app-huvudet (chunk-bannern) ·
inline-fel intill den yta som gick fel · fältfel + felsammanfattning ·
toast (ENDAST uppgiftsgenererade bekräftelser, ännu inte byggd) ·
`SectionError` (delyta kraschade) · `AppError` (hela appen kraschade) ·
modal (kritiskt, kräver beslut nu — ingen instans idag). Formen, låst i
S109-konvergensen (facit): ingen kontur — en vänsterkant 4 px i intent-färg
plus tonad bakgrund bär gränsen i stället, `prefers-contrast: more` tänder
en fullfärgs kontur; knapprad högerställd under texten; kryss-regeln (fel
och varningar bär ALDRIG kryss, kvitto och info får stängas). Ersätter
spec §21:s tidigare avsaknad av en styrande yta för hela familjen (noll
träffar på banner, notis, toast eller `MessageBox` innan `ADR-121`).
*Undvik:* "toast" som ord för ett fel (NN/g: en dålig form för
felmeddelanden — toast är reserverat för bekräftelser); "Uppdatera" för
handlingen att ladda om sidan (skriv "Ladda om" — kolliderar med
domänspråkets "uppdatera en anmälan").

**Åtgärdskö** — samlingen av poster som en maskinell vakt inte kunnat hantera
och som därför väntar på Lottas hand: innehållet, inte ytan. En åtgärdskö har
alltid tre delar — kön själv, en markör på den enskilda posten, och en
resolution-väg som gör att posten LÄMNAR kön genom en handling i appen.
Kön får aldrig vara en återvändsgränd som hänvisar till Airtable
([ADR-122](docs/decisions/ADR-122-eventlankens-vakt-och-atgardskon.md) beslut
7). Först ut: anmälningar vars eventlänk inte gick att verifiera.
*Skiljs från Bevakningsrad:* bevakningsraden är FORMEN på Hem (en osynlig-
vid-noll uppgiftsrad), åtgärdskön är INNEHÅLLET. En åtgärdskö visas som en
bevakningsrad på Hem och som markör i den lista posten bor i — samma kö, två
ytor.
*Skiljs från notis:* notistrappans åtta klasser
([DESIGN-SYSTEM-SPEC](docs/specs/DESIGN-SYSTEM-SPEC.md) § 21) är
händelsebundna — något hände nyss. En åtgärdskös poster är tillståndsbundna
och ligger kvar tills de åtgärdas.
*Undvik:* notiscenter, felkö, inkorg.

**Mina sidor** — HELA den inloggade admin-appen som begrepp: appens
motsvarighet till "Mina sidor" på en myndighetswebb (FK-analogin —
FK-appen ÄR webbens Mina sidor). Allt bakom inloggningen är användarens
personliga yta; termen betecknar appen som helhet, aldrig en plats i den.
Omskriven S64 2026-07-12 (Marcus-realisering, kvitterad): ersätter
destinations-betydelsen från 2026-07-07-samsynen — T69 beslut B/B2 rivna
öppet, se tråd-kortet.
*Undvik:* som namn på en vy, rad eller knapp (destinationen finns inte);
Mina uppgifter (FK-referensens term för data-undersidan), profil, konto.
*I koden:* förekommer inte — ingen route eller komponent ska bära namnet.

**Lugnt laddläge** — appens app-breda laddprincip: skärmen har sin slutliga
geometri från första bildrutan — inget växer, hoppar eller byter plats när
data landar. I första hand syns ingen laddning alls (senast kända data visas
direkt ur persist-cachen); måste laddning ändå synas är den dimensionsstabila
skeleton-block i datakropparna medan riktigt kort-chrome och rubriker
renderas direkt, och under 1 sekund visas ingen indikation alls. Termen var
odefinierad i UB 16 (granskningsfyndet L269); definierad i task-7-grillningen
(S63, grillad samsyn); mekaniken bor i task-7:s PRD.
*Undvik:* "Laddar…"-textrader (mönstret som underkändes i S62). Spinnern är
sedan ADR-113 INTE förbjuden — men bara på Laddtrappans steg 2
(knapp-internt i arbetande knappar), aldrig som sid- eller modulladdning.

**Laddtrappan** — appens yttrappa för laddindikatorer (ADR-113, grillad
samsyn S102 Del 7): skeleton för vyer/moduler med känd geometri ·
spinner ENDAST knapp-internt i arbetande knappar (Button-primitivens
`isLoading`) · determinate progress-bar för längre kända flerstegsförlopp ·
ALDRIG naken "Laddar…"-textrad som enda laddbesked. Ersätter spec §15:s
tidigare ovillkorade indikator-förbud; Lugnt laddläge förblir trappans
överordnade princip (ingen geometriförändring när data landar).
*Undvik:* "skeleton överallt" som regel-citat — det var
agent-generaliseringen, inte beslutet.

**Förberedelseskärmen** — den blockerande startskärm som visas vid kall
appstart (ADR-112): en äkta determinate bar (X av N hämtningar klara) mot
en dov, fönsterfyllande bakgrundsbild (Roger & Lotta-fotot, task-273.6,
Marcus tillägg 2 2026-08-17) — "rensas till enbart loadingbaren", ingen
logotyp längre synlig. Den Marcus-låsta texten "Förbereder ditt
administrationsverktyg" finns kvar i DOM:en (progressbarens tillgängliga
namn) men är sr-only, inte längre visuellt synlig. Visas ALDRIG vid varm
start (tyst väg), aldrig offline; timeout ~8–10 s släpper tyst.
Appnivå-instansen av Laddtrappans steg 3.
*Undvik:* "splash"/"splash-skärm" i användarvänd text och dokumentation —
Förberedelseskärmen är det kanoniska namnet ("splash" är okej som
engelskt branschbegrepp i research-citat).

**Startvärmningen** — warmup-fasen bakom Förberedelseskärmen (ADR-112):
förvärmer samtliga flikars kärndata efter auth-resolution enligt
hämta-en-gång-dela (en hämtning per datamängd, seedas till båda
cache-nyckelfamiljerna; ADR-017:s poll-scope orört). Tyst vid varm cache,
gate:ad mot offline, hård timeout.
*Undvik:* "prefetch" om just denna fas — prefetch är hover/avsikts-mönstret
på eventkorten; Startvärmningen är app-startens engångsfas.

**Sidbytesindikator** — den lätta, route-chunk-medvetna laddindikatorn för
SPA-sidbyten (TASK-233): en tunn balk fäst överst i viewporten, tyst under
1 sekund (Lugnt laddläge) och synlig först vid en genuint sen route-chunk-
nedladdning. Byggd på TanStack Routers `defaultPendingComponent` (routern
väntar med att committa den nya matchen — den GAMLA sidan stannar synlig
hela tystnadsfönstret, ingen DOM avmonteras i onödan), INTE en återanvändning
av Förberedelseskärmen (som förblir startskärmens/app-yta-gatens egen
komponent). Täcker en femte, tidigare oadresserad klass i Laddtrappan
(route hela-vyn-inte-nedladdad-än) som ADR-113:s fyra steg inte uttryckligen
namnger — bokfört öppet som en kandidat för en framtida ADR-113-amendering,
inte en tyst utvidgning.
*Undvik:* Förberedelseskärmen för sidbyten (fel vikt — Marcus-låst text och
helskärms-blockering hör till start/app-yta-gaten, inte in-app-navigation).
*I koden:* `src/components/AppShell/Sidbytesindikator.tsx`, wire:ad i
`src/router.ts` (`defaultPendingComponent`/`defaultPendingMs`/
`defaultPendingMinMs`).

**Deltagarinfo** — det andra mailet i Lottas utskicksflöde: den praktiska
informationen inför eventet (plats, tider, medtag), som går ut cirka två
veckor före start. UI-ordet är "deltagarinfo" sedan 2026-08-23 — samma ord
som basens fält `Deltagarinfo skickad`, så basen och UI säger numera samma
sak. Dags-att-skicka-signalen på eventsidan är härledd ur tvåveckorsgränsen
mot tidsstämpeln, aldrig ett lagrat tillstånd.
*Undvik:* eventinfo, eventinformation (UI-ordet fram till 2026-08-23 — se
historiken nedan; lever kvar ENDAST som identifierare, aldrig i UI-text).
*Historik, öppet riven:* fram till 2026-08-23 löd regeln MOTSATT — UI-ordet
var alltid "eventinfo", och "deltagarinfo"/"deltagarinformation" var
uttryckligen förbjudna i UI-text som "basens ord i UI-text" (Marcus-språket
S73 K42; basens fältnamn skulle stå kvar tills bas-maximeringen T16
eventuellt enade dem). Riven av Marcus 2026-08-23, verbatim: "Jag vänder
beslutet." Ordbytets gräns sattes samma dag, verbatim: "4. UI-copy enbart"
— endast synliga UI-strängar bytte ord. Kontrakt och identifierare bär
DÄRFÖR kvar `eventinfo`: `actionType: 'eventinfo'` (SendActionEmail-
kontraktet mot Edge Function), routen `skickade-mail/eventinfo`, test-id:t
`eventinfo-signal-slot`, aktivitetsloggens typnycklar och filter-ID:t
`eventinfo-saknas`. Genomfört i TASK-303 AC #4.
*I koden:* `deltagarinfoSkickad` (Registration-shapen, speglar bas-fältet);
`eventinfoSignal` (eventsidans härledning — identifierare, oberörd av
ordbytet).

**Auto-utskick** — det SCHEMALAGDA deltagarinfo-utskicket per event: ett datum
(normalt tvåveckorsgränsen) plus ett opt-out, som Lotta styr med krysset i
eventsidans signal-slot. Två additiva bas-fält bär det (`Deltagarinfo
schemalagd` respektive `Deltagarinfo auto-utskick avstängt` — basens ord, jfr
Deltagarinfo). Begreppet är STYRNINGEN, inte sändningen: utskicks-motorn som ska
läsa fälten finns ännu inte (PRD task-18 §Utanför omfattningen), och krysset
lovar därför bara vad basen bär. Kristalliserat i task-18.6.
*Undvik:* automatiskt mail (tvetydigt mot bekräftelsemailet), schemaläggning
(mekanismen, inte begreppet).
*I koden:* `deltagarinfoSchemalagd` / `deltagarinfoAutoAvstangt` (Event-shapen);
`AutoKryss` (`detail/Deltagare.tsx`).

**Delutfall** — resultatet när ett utskick till flera mottagare lyckas för
NÅGRA men inte alla: fjorton av tjugo fick sitt mail, sex fick det inte. Det
är varken "skickat" eller "misslyckat" utan ett tredje, eget tillstånd — och
det ska sägas som det är, med båda talen och skälet per fallen mottagare
("saknar e-post", "har tackat nej till utskick", "kunde inte levereras").
Kravet är att ett halvt utfall aldrig visas som helt: en yta som säger
"Utskicket är skickat" när sex inte fick något ljuger, och en som säger att
allt gick fel får Lotta att skicka om till alla — varpå fjorton får dubbla
mail. De fallna ligger därför kvar markerade så omkörningen träffar just dem.
Serverns fyra klasser bär begreppet (`ADR-067` D3): `sent` (alla gick fram),
`partial` (delutfallet), `failed` (ingen gick fram), `skipped` (ingen fanns
kvar att skicka till efter serverns filter). Kristalliserat i task-147.
*Undvik:* fel (ett delutfall är inte ett fel — fjorton mail gick fram),
delvis misslyckat (samma slagsida), partiellt (engelska-kalkering).
*I koden:* `MailSendResult` (`status`, `accepted`, `suppressedConsent`,
`suppressedNoEmail`, `rejected`); `bekraftelseUtfall`
(`data/mutations/registrationConfirmation.ts`).

**Obekräftad/Bekräftad** — anmälans bekräftelsestatus: Bekräftad ⟺
anmälningsbekräftelsen (mail 1, bär betalningsinstruktionerna) är skickad;
Obekräftade är Lottas att-göra-kö på eventsidan. Språket ligger exakt på
basens Status-ord ("Obekräftad"/"Bekräftad (mail skickat)") — Marcus-beslut
S73 K53, som ersatte konvergensens arbetsord. Arbetsköns gruppering läser
`Status` (anmälans tillstånd); summeringsraden "Anmälningsbekräftelse
skickad" läser utskicks-tidsstämpeln (`Bekräftelse skickad`) — samma
begrepp, två källor som visas var för sig när de divergerar (task-18.4).
*Undvik:* ohanterad, hanterad (S73 K39–K52-arbetsorden, rivna K53).
*I koden:* `arBekraftad` (eventsidans arbetskö, `detail/Deltagare.tsx`);
basens fält `Status`.

**Bor över** — markeringen per anmälan att deltagaren sover över på eventet
(hemma-hos-eventen är normalfallet med övernattande gäster). Ett eget
ADDITIVT checkbox-fält per Anmälan (`Bor över`, staging-fött task-18.7); dess
antal HÄRLEDS alltid ur kryssen (både eventsidans summeringsrad och
listkortets rad), aldrig ur ett lagrat räknefält. **Kryss-läget** är
arbetsformen: eventsidans Bor över-rad öppnar en enkolumnslista med ALLA
anmälda och ett säng-kryss per person (ikryssade överst, stabil ordning under
markeringen, live-räknare) — en ARBETSRAD, inte en filterlista (S73 K50/K52).
Obockad är NEUTRAL (att inte bo över är normalläge, inte avvikelse — skilt
från betalkryssets röda obetalt-semantik).
*I koden:* `borOver` (anmälans läs-shape); `borOverAntal` (eventets läs-shape —
listkortets härledda summering, `EventCard`, task-17.5); write-operationen
`set-registration-lodging`; `BorOverRad` (`detail/Deltagare.tsx`); basens fält
`Bor över`.

**Reserverad plats** — en plats som hålls av en anmälan i väntan på betalning
(anmälningsavgift och/eller slutbetalning); uteblir betalningen frigörs
platsen — därför "X av Y platser reserverade" på event- och Hem-korten,
aldrig "bokade" (bokad låter definitiv; reservationen är villkorad).
Marcus-kristalliserad i review-våg 1 (S75, 2026-07-22). Skilj från basens
fält **Extra platser** ("Extra platser reserverade av Roger och Lotta") —
manuellt hållna platser utanför anmälningsflödet, visade under
beläggningsuppdelningens etikett "Extra platser" — basens eget fältnamn
(Marcus-beslut 2026-07-22, PR #79). Beläggningssummans "upptagna"
(inkluderar båda slagen) är en medveten tredje term och står kvar.
*Undvik:* bokad (platser), belagd (som kort-copy).
*I koden:* strängen "platser reserverade" (`EventCard`, `NastaEventCard`).

**Period** — event-listans tidsaxel: Kommande eller Tidigare, härledd ur
eventets startdatum mot idag — ALDRIG ur Status-fältet. Skild från eventets
**status** (planeringstillstånd: Planerat/Genomfört/Inställt/Flyttat), som i
listan visas endast vid avvikelse (Inställt/Flyttat — badge på kortet).
De två axlarna korsar fritt: ett inställt event i framtiden är Kommande +
Inställt. Skärpningen reconcilierar T14:s begreppsgrumlighet (S72-grillningen,
statusbadge-beslutet).
*Undvik:* status som namn på tidsfiltret (T14-grumligheten; gäller även
URL-parametern).
*I koden:* `?period=upcoming|past` (event-listans URL-state).

**Publicerad på miranon.se** — eventets publiceringsflagga: markerar att
eventet ska synas på miranon.se. Armeras i skapa-flödet med dra-till-bekräfta-
handtaget (aldrig ett råkat klick) och bärs av basens likanämnda checkbox på
Eventplanering. Flaggan säger enbart ATT eventet är publicerat — vad
publiceringen STYR på webben (kalender-synlighet, anmälningsformulär,
event-sida) är webbplatsens kontrakt, inte appens (tråd T79).
*Undvik:* publik, live, synlig (otydliga om vad som blir synligt var).
*I koden:* `publicera` (create-event-inputen); basfältet
`Publicerad på miranon.se`.

**Steg-räknare** — de klickbara raderna i Anmälda deltagares topp som räknar
personer per hållplats-steg (Väntar på bekräftelse · Anmälningsavgifter ·
Slutbetalningar · Klara) och filtrerar registret vid klick. Räknarna ÄR
Lottas att-göra-lista, i hennes arbetsordning (grillad samsyn S93).
*Undvik:* summeringsrad (den äldre fem-raders-formen), statistikrad.

**Steg-märke** — etiketten på ett deltagarkort som visar personens längst bak
liggande ofärdiga hållplats-steg — en person, ett märke, även när datat är
ett nät. Undantagen bär egna ärliga märken (Avbokad, Inställt, På väg till
väntelistan). Märket är härlett, aldrig lagrat (hållplats-modellen,
alternativ C).
*Undvik:* status-pill (den ersatta formen), badge (upptaget av
Erfarenhetsbadge).

**Incheckning** — handlingen att vid dörren markera en deltagare Närvarande
för en session; uppdaterar Deltagandet, eller skapar det om raden mot
förmodan saknas i basen (backup-vägen — rotorsaken läks alltid i basen,
grillad samsyn S103 Del 15). Skild från *Deltagande* (posten) och närvaro
(statusen).
*Undvik:* närvaromarkering, avprickning.
*I koden:* `checkin` (operationerna byggs under promoverings-PRD:t).

**Dörrlista** — incheckningsytan för ett events session: arbetslistan visar
BARA dem som återstår att checka in, med sök och sessionsval (endast vid
flera sessioner); incheckade flyttar till Klargruppen. Formen är variant D:s
stämplade facit (S103, 2026-08-14).
*Undvik:* närvarolista (den ersatta läs-vyns form), deltagarlista
(registervyn på eventsidan).
*I koden:* `EventCheckin` (efter promoveringen; `CheckinPrototyp` före).

**Kvittensfönster** — de 1,2 sekunder efter incheckningstrycket då raden
visar grönt kvitto ("Incheckad HH:MM") INNAN flytt till Klargruppen; ångra
inom fönstret avbryter helt — ingen skrivning har då skett, eftersom
skrivningen går först när fönstret löpt ut (grillad samsyn S103 Del 15).
*Undvik:* undo-fönster, grace period.

**Klargrupp** — den kollapsade gruppen längst ned i dörrlistan med redan
incheckade; ångra efter kvittensfönstret bor här (bocka ur = vanlig
statusskrivning tillbaka).
*Undvik:* klarlista, historik (upptaget av andra ytor).
