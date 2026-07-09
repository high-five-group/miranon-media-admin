---
owner: marcus803
updated: 2026-07-09
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
platser (Airtable-tabellen heter Eventplanering).
*Undvik:* tillfälle, kurs (kursen är taxonomi-axeln; eventet är tillfället).
*I koden:* `Event`.

**Anmälan** — en persons begäran att delta i ett specifikt event.
*Undvik:* bokning, registrering.
*I koden:* `Registration`.

**Deltagande** — en persons närvaropost för ett event; bär närvarostatusen som
driver Insiktskedjan.
*Undvik:* närvaro (närvaron är statusen på posten, inte posten själv).
*I koden:* `Attendance`.

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

**Mina sidor** — den inloggade användarens personliga yta i admin-appen;
kanonisk ingång är Mer-vyns översta rad, Hem-vyns Mina sidor-knapp är genväg
till samma mål (grillad samsyn 2026-07-07; hemvist-beslutet bokförs i
Mer-PRD:n).
*Undvik:* Mina uppgifter (FK-referensens term), profil, konto.
*I koden:* `/mer/mina-sidor` (v1 byggs minimal i Mer-PRD:n).
