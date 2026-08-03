---
owner: marcus803
updated: 2026-08-03
review_by: 2027-01-02
status: stable
---

# Ordlista — Miranon Media (produktdomänen)

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

**Anteckning** — eventets minne: en tidsstämplad post i eventsidans antecknings-STRÖM
(composer överst, nyast först) med författare (den inloggade användaren, satt server-side
ur den verifierade identiteten) och en härledd fas-etikett (Under/Efter eventet; Innan
omärkt per tysta normen). Skild från *person*-anteckningen (Personers fria
`Anteckningar`-fält, `update-person-note`) — event-anteckningen bor i en EGEN additiv
tabell (`Anteckningar`, ADR-075), en post per rad, aldrig en klumpad fritext-yta.
*Undvik:* kommentar; notering (Eventplaneringens `Notering` är den gamla EN-fältsytan
som strömmen ersätter, inte utökar).
*I koden:* `EventNote` (läs-shape), `CreateEventNoteInput` (skriv-shape); basens tabell
`Anteckningar`.

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
*Undvik:* dokument (tvetydigt — Dokument är YTAN i Mer där bilagor hanteras),
attachment.

**Åtgärds-sida** — den event-knutna sida där Lotta verkställer utskick:
mottagarna hon markerat och "dragit med", åtgärdsval (utskickstyp),
redigerbar meddelandetext, bilageväljare och skick med förhandsvisning.
Ersätter batch-barens direktutskick och Åtgärds-radernas grå löften; alla
utskick är riktiga server-utskick (grillad samsyn S93, fråga 4–5).
*Undvik:* utskickssida, mailsida, compose (engelska).

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
*Undvik:* "Laddar…"-textrader (mönstret som underkändes i S62), spinner.

**Eventinfo** — det andra mailet i Lottas utskicksflöde: den praktiska
informationen inför eventet (plats, tider, medtag), som går ut cirka två
veckor före start. UI-ordet är alltid "eventinfo" — basens fält heter
`Deltagarinfo skickad` och byter INTE namn (Marcus-språket S73 K42; basens
namn står kvar tills bas-maximeringen T16 eventuellt enar dem). Dags-att-
skicka-signalen på eventsidan är härledd ur tvåveckorsgränsen mot
tidsstämpeln, aldrig ett lagrat tillstånd.
*Undvik:* deltagarinfo, deltagarinformation (basens ord i UI-text).
*I koden:* `deltagarinfoSkickad` (Registration-shapen, speglar bas-fältet);
`eventinfoSignal` (eventsidans härledning).

**Auto-utskick** — det SCHEMALAGDA eventinfo-utskicket per event: ett datum
(normalt tvåveckorsgränsen) plus ett opt-out, som Lotta styr med krysset i
eventsidans signal-slot. Två additiva bas-fält bär det (`Deltagarinfo
schemalagd` respektive `Deltagarinfo auto-utskick avstängt` — basens ord, jfr
Eventinfo). Begreppet är STYRNINGEN, inte sändningen: utskicks-motorn som ska
läsa fälten finns ännu inte (PRD task-18 §Utanför omfattningen), och krysset
lovar därför bara vad basen bär. Kristalliserat i task-18.6.
*Undvik:* automatiskt mail (tvetydigt mot bekräftelsemailet), schemaläggning
(mekanismen, inte begreppet).
*I koden:* `deltagarinfoSchemalagd` / `deltagarinfoAutoAvstangt` (Event-shapen);
`AutoKryss` (`detail/Deltagare.tsx`).

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
