---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# miranon.se — intagskedjan idag: formulär → Zapier → Airtable, och vad väg A ärver

> **Uppdrag:** Session 128, avgränsat research-pass. Frågan: vad händer steg för
> steg från att en besökare fyller i ett formulär på miranon.se tills posten
> ligger i Airtable och alla följdeffekter skett — och vilka delar av kedjan
> ska den nya sajtens EF-väg (väg A, `tasks/sessions/2026-09-19-session-128.md`
> Del 1) ersätta, bevara orört, eller låta dö. Tillägg under passet (samma
> orkestrerar-tur): inventera även ljudspelaren på miranon.se. Ingen skarp
> data läst från prod-Airtable (subagent-spärren i `CLAUDE.md` § Verktygsfakta
> gäller — endast statisk repo-läsning + live-läsning av den PUBLIKA sajten).

## Kort svar

**Kedjan är mätbar och till största delen intakt sedan mars 2026, men den
frusna referensen (`schema_reference.md`) ljuger på minst tre konkreta
punkter idag (2026-09-19): en fjärde kursvariant saknas i formulärets
bildval, en fältmappning (`Inskickad`) som referensen påstår fungerar är
bevisat trasig och redan kompenserad med en egen automation (`A12`), och
sajtens registreringsflöde beskriver ett betalningssteg ("Betala
reservationsavgiften") som inte finns dokumenterat någonstans i
data-modellen.** Huvudmekaniken står dock kvar: Elfsight-widgetar →
Zapier → Airtable `Anmälningar`/`Hämtade erbjudanden` → automationerna
A1–A5 (matchning, person-koppling, deltagande, lead-koppling,
engagemang). **Väg A:s EF ska ERSÄTTA hela Elfsight+Zapier-leden** (skriv
direkt till samma Airtable-fält en EF redan vet skriva, `create-registration`
är facit), **BEVARA A1–A11 orörda** (de körs på raden oavsett vem som
skapade den) och **LÅTA DÖ** endast Zapiers egna hjälpmekanismer (statiska
fält, hash-källkoder) som EF:en kan göra bättre själv. Ett helt separat,
**oväntat fynd**: ljudspelaren på `/pages/hypnos` är INTE Elfsight utan
**Common Ninja** ("Audio Player"/`audioplayerninja`), 10 spår varav bara 2
är faktiskt spelbara på miranon.se — resten är låsta och pekar mot en
extern domän (`explor.today`) som INTE är verifierad som Soundwise-appen
basen redan har fält för (`Touchpoints.Typ` = "Soundwise-konto" /
"Soundwise-lyssna").

## Vad jag redan hade innan jag sökte

**Läst före första sökning, i denna ordning:** `docs/research/`-katalogen
(126 filer inventerade via `ls`; ingen fil täcker Elfsight, Zapier,
Soundwise, Common Ninja eller "intagskedja" — genuint ny mark, verifierat
med `grep -rln` mot hela `docs/` + `tasks/` + `supabase/` för dessa termer),
`docs/decisions/`-katalogen (133 ADR:er via `ls`; `ADR-122` är den enda som
rör Elfsight/kalenderlänkar), `tasks/sessions/2026-09-19-session-128.md`
Del 1 (uppdragets egen bakgrund), `tasks/threads/T79-...md` och
`tasks/threads/T159-...md` (uppdragsgivarens pekare), samt
`docs/reference/schema_reference.md`, `docs/reference/data-model.md` och
`docs/reference/airtable-constraints.md` i sin helhet för de avsnitt som rör
formulär, Zapier och A1–A11.

**Vad som redan var avgjort:** `ADR-122` (Accepted, 2026-08-21) beslutade
redan HUR en trasig kalenderlänk ska hanteras — en fail-closed vakt i A1 plus
en åtgärdskö i appen, snarare än att fixa Elfsight-widgeten självt. Det
beslutet **rör jag inte** i detta pass; det är en förutsättning för
klassningen i § 5 (A1:s vakt hör till "bevara orört", inte "ersätt"). `T159`
är ett medvetet BORTVAL (driftdetektor mot Elfsight-kalendern byggs inte,
marginalvinsten är en enda anmälan) — relevant eftersom väg A:s EF-formulär
gör hela den bortvalda risken irrelevant (en EF som skriver `EventKey`
server-side kan inte drabbas av en handskriven-URL-bugg).

**Vad som var åldrat:** `schema_reference.md` deklarerar sig själv som en
**frusen ögonblicksbild från mars 2026** (rad 1–14) och är uttryckligen INTE
auktoritativ för fältdata — det är `data-model.md`. Jag har därför läst
`schema_reference.md` för den strukturella kartan (vilka formulär finns,
vilka Zaps, vilka automationer) och `data-model.md` för fältsanningen, och
**mätt om just de delar där de två källorna kan tänkas divergera** genom att
besöka den publika sajten live (§ 4). Tre konkreta divergenser hittades och
listas i § "Kort svar" och § 4.

**Nytt i detta pass:** hela § 4 (live-mätning av sajten, inklusive
pre-fill-URL:en fångad genom att klicka "Reservera" och läsa resultatets
URL) och hela § "Ljudspelaren i dag" (Common Ninja-widgeten, orelaterad
till Elfsight, upptäckt via nätverksanrop — inte i någon befintlig fil).

---

## 1. Kedjan idag, per formulärtyp

Alla fyra formulär som faktiskt ligger på **miranon.se** (inte
psionautics.se, se § 1.4) är byggda i **Elfsight** och postar via
**Zapier** till Airtable. Källa för hela avsnittets grundkarta:
[`schema_reference.md`](../reference/schema_reference.md) rad 939–1205
(frusen mars 2026) — varje steg nedan är märkt MÄTT där jag verifierat det
live 2026-09-19, annars HYPOTES (ärvd från den frusna referensen).

### 1.1 Anmälan — huvudformulär (Formulär 1) och expressformulär (Formulär 2)

**Detta är den bärande vägen** — den täcks av `ADR-122`s hela
utredning och är den enda vägen A1 explicit designats mot (scope
`Från formulär = Huvudformulär`, `ADR-122` beslut 5).

1. **Besökaren hittar eventet.** MÄTT 2026-09-19: `/pages/eventplanering`
   bär en Elfsight **Event Calendar**-widget (app-typ `event-calendar`,
   skript `eventCalendar.js` v2.52.0) som listar kommande event månad för
   månad med filter (Datum/Typ/Plats/Sök) och en `RESERVERA`-knapp per
   event (§ 4).
2. **Knappen bygger en pre-fill-URL och öppnar den i ny flik.** MÄTT: ett
   klick på "Reservera" för eventet "Fjärrskådning, 17–18 oktober 2026,
   Rönninge" navigerade till
   `miranon.se/pages/anmalan?EventKey=Event-61&Event=Fjärrskådning&Typ=Utbildning&Datum=17–18 oktober 2026&Ort=Rönninge`.
   Detta är EXAKT den mekanism `schema_reference.md` rad 962 beskriver
   ("Pre-fill parametrar: Event, Datum, Ort, Typ, EventKey") och som
   `ADR-122` § Kontext identifierar som roten till kalenderlänk-buggen:
   URL:en är byggd av en MÄNNISKA (Roger/Lotta) som konfigurerar varje
   kalenderpost i Elfsights EGEN adminyta, separat från Airtables
   `Eventplanering`-tabell — inte en levande koppling till basen. Att
   `Event-61` var korrekt formaterat i detta stickprov är alltså EN mätning
   av EN länk, inte ett bevis att hela kalendern är felfri (`ADR-122` §
   Kontext: 64 av 304 var felmatchade 2026-08-21, innan rotfixen).
3. **`/pages/anmalan` (Elfsight Form Builder-widget, `formBuilder.js`
   v1.53.8) visar STEG 1 AV 2.** MÄTT: bildval (Fjärrskådning, Resor i
   medvetandet 1/2/**3** — se § 2 för att RIM 3 är nytt sedan mars) plus
   fyra förifyllda textfält (Event, Typ, Datum, Ort) som speglar
   query-parametrarna exakt. **Expressformuläret** (samma widget-typ,
   nås direkt från startsidan utan pre-fill) frågar i stället användaren
   själv, enligt `schema_reference.md` rad 986–1004 — jag kunde INTE
   visuellt lokalisera det på startsidan 2026-09-19 (se § 4, "Femte
   widget-boot utan synligt formulär" — MÅSTE VERIFIERAS).
4. **STEG 2 samlar persondata** (Förnamn, Efternamn, E-post, Mobilnummer,
   tidigare-kurs-checkbox, motivering-textarea, samtycke). HYPOTES ärvd
   från `schema_reference.md` rad 974–982 — jag klickade INTE vidare till
   steg 2 (uppdragets "fyll inte i något"-regel).
5. **Elfsight postar till Zapier vid submit.** Zap 4 (huvudformulär) eller
   Zap 3 (express) tar emot fälten och POSTar `Create Record` mot
   Airtable `Anmälningar` (`tbloOcrppVoyrHbrq`). Fält-för-fält-mappning:
   § 2. Källa: `schema_reference.md` rad 1125–1172.
6. **Raden landar i Airtable med `Status=Obekräftad`.** Detta triggar
   OMEDELBART tre parallella automationer (A1, A2, A3) på samma
   `record_created`-händelse — se § 3.
7. **A1 sätter `Event`-länken** (matchning på `EventKey`, fallback på
   `Expresslabel` för express-anmälningar). Vid noll träff skriver A1
   **ändå** en tom lista till `Event` — ovillkorligt, inte en utebliven
   skrivning (`schema_reference.md` rad 1288–1309, mätnot 2026-08-21).
8. **A2 söker/skapar Person** via normaliserad e-post och kopplar
   `Anmälningar.Person` (fyra grenar, § 3). **A3 förskapar
   `Deltaganden`-rader** (en per sessionsdag) när både `Person` och
   `Event` är satta.
9. **A11 kedjar** och kopierar `Anmälan.Person`-länken till de nyskapade
   `Deltaganden`-raderna (`data-model.md` rad 1959–1961).
10. **A7 räknar om obetalda per event** vid varje efterföljande uppdatering
    av raden (t.ex. när Lotta senare sätter `Anmälningsavgift=Mottagen`).
11. **A6 skickar fullbokat-mail** till Roger/Lotta om eventets beläggning
    når 100 % — en sidoeffekt av att RADEN existerar, inte av
    submit-händelsen direkt.

### 1.2 Intresseanmälan/lead — Meditationen Kraftfältet och Pyramidernas vajrar (Formulär 5/6)

Detta är den formulärklass som bäst matchar "intresseanmälan" i uppdraget:
en enkel lead-magnet (Förnamn + E-post, eller bara E-post) som INTE skapar
en `Anmälningar`-rad utan en `Hämtade erbjudanden`-rad.

1. **Besökaren fyller i ett minimalt formulär.** MÄTT 2026-09-19:
   "Meditationen Kraftfältet" (Elfsight **Subscription Form**-widget,
   `subscriptionForm.js` v1.53.8) ligger synligt längst ned på
   **startsidan** — två fält, Förnamn + E-post, knapp "Skicka" (§ 4).
   "Pyramidernas vajrar" (samma app-typ, enligt `schema_reference.md` rad
   1052–1059 bara ETT fält, E-post) besöktes INTE i detta pass — HYPOTES,
   se § 7.
2. **Elfsight postar till Zap 5/6.** Airtable-fälten som sätts är
   `E-post (rå)`, `Förnamn (rå)` (endast Zap 5), `Erbjudande (source)`
   (statiskt textnamn) och `Källa (formulärkälla)` — ett SHA256-hash-värde
   hårdkodat i Zappen (`ae9a4975…` för Kraftfältet, `58947ba3…` för
   Pyramiderna). `data-model.md` fälla 26 (rad 2474) flaggar dessa
   hash-strängar som [HYPOTES — EJ VERIFIERAD] ursprung — troligen
   webhook-/formulär-ID:n som råkat bli option-namn.
3. **Raden landar i `Hämtade erbjudanden`** (`tblqFpgxEhJ95AEcM`). Detta
   triggar **A4** (`record_created`).
4. **A4 matchar `Erbjudande` via Source key**, söker Person på e-post
   (samma fyra-grens-mönster som A2, § 3) och skapar en Touchpoint
   ("Angett e-post för erbjudande"). **A5 triggar på den efterföljande
   `record_updated`** (när A4 satt Person-länken) och skapar/uppdaterar en
   `Engagemang`-rad.
5. **Ingen `Anmälningar`-rad skapas i detta flöde.** Personen är nu en
   "lead" i basens mening — namnlös om Elfsight-formuläret bara tog e-post.
   Om samma person SENARE anmäler sig till en kurs (väg 1.1), var A2:s
   gren-ordning historiskt ett dokumenterat hål: Gren 1 (namnlös Person
   hittas) uppdaterade namnet men LÄNKADE INTE anmälan (`data-model.md`
   fälla 21, rad 2188–2198). **Detta är STÄNGT sedan 2026-08-24**
   (`TASK-229.3`, samma källa) — Gren 1 fick två nya noder i prod som
   speglar Gren 2:s beteende, skarpt bevisat med ett testfall. Väg A:s EF
   ärver alltså ett REDAN FIXAT beteende här, inte den gamla buggen.
6. **Soundwise är ett separat, parallellt spår från SAMMA formulär.**
   `schema_reference.md` rad 1195–1197: "Zap 7: Meditationen Kraftfältet"
   och "Zap 8: Pyramidernas vajrar" är EGNA Zaps (samma Elfsight-trigger,
   annan action) som skickar leadens data till **Soundwise** — en tredje
   parts ljud-/kursplattform, INTE Airtable. Detta hänger ihop med
   ljudspelar-fyndet i ett eget avsnitt nedan: basen har redan
   `Touchpoints.Typ`-värdena `"Soundwise-konto"` och `"Soundwise-lyssna"`
   (`schema_reference.md` rad 488, 683) — någon mekanism (ej identifierad i
   detta pass, se § 7) loggar alltså Soundwise-händelser tillbaka till
   Airtable separat från Zap 7/8.

### 1.3 Kontaktformulär (Formulär 4) — utan automations-följd

MÄTT 2026-09-19 på `/pages/kontakt`: Elfsight **Contact Form**-widget med
Förnamn, Efternamn, E-post, Telefon (`+46`-prefix), meddelande-textarea och
filuppladdning ("mindre än 100 MB"), skyddad av reCAPTCHA (§ 4). Enligt
`schema_reference.md` rad 1037 är detta formulärs Zapier-koppling **inte**
bland de 6 aktiva Zaps som listas — antingen en direkt Elfsight-webhook
eller något annat, ospecificerat. Raden landar i `Kontaktlogg (rådata)`
(`tblzg4DsRzCCXH8Vy`). **Ingen av A1–A11 triggar på denna tabell** (verifierat
genom att läsa samtliga 11 automationers trigger-tabeller, § 3) — kontaktmail
är alltså en ren rådata-brevlåda utan automatisk följdeffekt i basen idag.

### 1.4 Formulär som INTE ligger på miranon.se

`schema_reference.md` anger explicit URL per formulär, och två av de sju
ligger på en ANNAN domän: **Formulär 3 "Anmälan - Psionautics"**
(`psionautics.se`, rad 1010) och **Formulär 7 "Väntelista - Psionautics"**
(`psionautics.se`, rad 1064). Dessa postar också till Airtable
(`Anmälningar` respektive `Väntelista`) via egna Zaps (Zap 1, Zap 2) men
uppdragets fråga gäller uttryckligen miranon.se — de tas därför INTE med i
klassningen i § 5, förutom en observation: väg A:s EF-kontrakt (samma
Airtable-fält, samma `create-registration`-logik) skulle kunna återanvändas
av psionautics.se OM den sajten någon gång byggs om, men det är utanför
detta uppdrag.

---

## 2. Fältinventering

Källa för Airtable-sidan: **`data-model.md`** (auktoritativ för fältdata,
`ADR-100` §1) § "Schema cheat sheet" rad 1052–1112. Källa för
Elfsight-sidan (vad som mappas FRÅN): `schema_reference.md` Zap 3/Zap 4
(rad 1125–1172), frusen mars 2026 — märkt där den avviker från vad jag mätte
live.

### Anmälningar — huvudformulär (Zap 4) vs. expressformulär (Zap 3)

| Airtable-fält | Fält-ID | Huvudformulär | Expressformulär |
|---|---|---|---|
| Förnamn | `fldMZAwDbygfYN5WY` | Elfsight: Förnamn | Elfsight: Förnamn |
| Efternamn | `fldUIMY8mjBeem5BE` | Elfsight: Efternamn | Elfsight: Efternamn |
| E-post | `fldVY310IdOIbTkE8` | Elfsight: E-post | Elfsight: E-post |
| Mobilnummer | `fldBLxAN1KnOUxNjG` | Elfsight: Mobilnummer | Elfsight: Mobilnummer |
| Vill anmäla sig till | `fld6RC3r0R9tuKgdF` | Elfsight: Event (pre-fill) | Elfsight: Image Choice |
| Typ | `fldGyYPbxkgS3BqVb` | Elfsight: Typ (pre-fill) | Statiskt: "Utbildning" |
| EventKey | `fldPlPLkpqm0X7Xs2` | Elfsight: EventKey (pre-fill) | *(saknas — matchas via `Expresslabel` i A1:s gren 3)* |
| Från formulär | `fldCLVfJIHcuI1l83` | Statiskt: "Huvudformulär" | Statiskt: "Expressformulär" |
| Status | `fldWr5cCPNx9HEKtL` | Statiskt: "Obekräftad" | Statiskt: "Obekräftad" |
| Anmälningsavgift | `fldJtKQ3qLxRKOvR6` | Statiskt: "Ej mottagen" | Statiskt: "Ej mottagen" |
| Slutbetalning | `fldIImadnJUZHr5Qh` | Statiskt: "Ej mottagen" | Statiskt: "Ej mottagen" |
| Flagga | `fld6DHDYJZeK2r7OE` | Statiskt: "Ny anmälan" | Statiskt: "Ny anmälan" |
| Inskickad | `fldNtSHQivkL26B6L` | **Sätts INTE** (fälla 49) | **Sätts INTE** (fälla 49, latent — 0 rader i prod) |
| Har du gått steg 1? | `fldE9RwOG42yX4oVA` | Elfsight: checkbox (conditional) | Elfsight: checkbox (conditional) |
| Varför vill du gå... | `fldAv80U5ssqOYguK` | Elfsight: textarea | Elfsight: textarea |
| Vilka kurser tidigare | `fldFFRpBJ3Dhs6eFw` | Elfsight: checkbox-grupp | Elfsight: checkbox-grupp |

**Den viktigaste raden i tabellen är `Inskickad`.** `schema_reference.md`
rad 1155 och 1133 påstår att Zapier sätter fältet till "Current time" för
BÅDA formulären. `data-model.md` fälla 49 (rad 2332) motsäger detta rakt
av, MÄTT mot 868 prod-rader: 273 av 302 huvudformulär-rader (90,4 %)
saknade `Inskickad` fram till en backfill 2026-08-17, och roten var aldrig
Zap-mappningen (den finns inte) utan en felläsning av `Rad skapad`
(`createdTime`, kan aldrig skrivas av en Zap). Framåtgarantin löstes med en
NY automation **A12** (`wflVeU33Etsi8g8wh`), inte genom att fixa Zappen —
sätter `Inskickad = getWorkflowExecutionIsoDateTime()` vid varje
`record_created` där fältet är tomt, bekräftat i drift sedan 2026-08-19.
**Detta är ett konkret argument för väg A:** en EF som sätter `Inskickad`
direkt vid create (som `create-registration` redan gör, se § 5) behöver
ingen A12-krycka — felklassen kan inte uppstå.

**`Vill anmäla sig till` bär en känd defekt som väg A ärver om den inte
åtgärdas separat:** optionerna har case-dubletter ("Resor i medvetandet 1"
vs "Resor i Medvetandet 1", `data-model.md` fälla 24, rad 2224–2234).
**Nytt i detta pass:** MÄTT 2026-09-19 att en FJÄRDE kurs, "Resor i
medvetandet 3", nu visas som bildval i huvudformuläret (§ 4) — och
homepage-bannern säger uttryckligen att den *"precis lanserats"*. Fälla 24
listar bara dubletter för RIM 1 och RIM 2; om RIM 3 saknar en kanonisk
option i `fld6RC3r0R9tuKgdF` helt och hållet är detta en NY, oupptäckt
variant av samma felklass. Se § 7, MÅSTE VERIFIERAS post 3.

### Hämtade erbjudanden — lead-formulären (Zap 5/6)

Fält-ID:n för denna tabell finns INTE i `data-model.md`s cheat sheet
(cheat sheeten täcker Anmälningar/Väntelista/Eventplanering/Deltaganden/
Personer/Segment, inte Hämtade erbjudanden) — nedan är fält-NAMN från
`schema_reference.md` rad 1177–1191, plus det enda fält-ID som råkar
finnas dokumenterat på annat håll:

| Airtable-fält | Fält-ID | Kraftfältet (Zap 5) | Pyramiderna (Zap 6) |
|---|---|---|---|
| E-post (rå) | ej i cheat sheet — MÅSTE VERIFIERAS | Elfsight: E-post | Elfsight: E-post |
| Förnamn (rå) | ej i cheat sheet | Elfsight: Förnamn | *(saknas — formuläret har bara E-post)* |
| Erbjudande (source) | ej i cheat sheet | Statiskt: "Meditationen Kraftfältet" | Statiskt: "Pyramidernas Vajrar" |
| Källa (formulärkälla) | `fldF9SgJS1Zv5kmtr` (`data-model.md` rad 2474, fälla 26) | Statiskt hash `ae9a4975…` | Statiskt hash `58947ba3…` |

### Väntelista — write-fält (för fullständighetens skull, ej på miranon.se)

Källa: `data-model.md` rad 1098–1112. Nämns här bara för att § 1.4:s
avgränsning ska vara spårbar — fälten `Event`, `Eventdatum-start/-slut` är
**hårdkodade** i Zap 2 för ETT specifikt event ("Psionautics", 1–3 maj
2026), inte dynamiska. En eventuell framtida väntelista på miranon.se får
INTE ärva det mönstret.

---

## 3. Automationsberoenden — vilka av A1–A11 triggas av en ny anmälan/lead

Källa: `data-model.md` § "Automationssekvenser" rad 1921–2059 och
`schema_reference.md` § "Automationer" rad 1251–1510. Samtliga 11 är
`deployed` (verifierat mars 2026 av tidigare pass, inte omverifierat här —
se § 7).

| Grupp | Automationer | Trigger | Vad den gör | Triggas av en ny `Anmälningar`-rad? | Triggas av en ny `Hämtade erbjudanden`-rad? |
|---|---|---|---|---|---|
| 1 | A1 Matcha event | `record_created` Anmälningar | Sätter `Event`-länk via EventKey/Expresslabel | **Ja, alltid** | Nej |
| 1 | A2 Koppla/skapa person | `record_created` Anmälningar | 4-grens person-matchning + Touchpoint | **Ja, alltid** | Nej |
| 1 | A3 Förskapa deltaganden | `record_matches` (Person+Event satta, Deltaganden tom) | Skapar Deltaganden-rader per session | **Indirekt, om A1+A2 lyckats** | Nej |
| 3 (kedjar på A3) | A11 Koppla deltagande→person | Deltaganden-skapande | Kopierar Person-länk till Deltaganden | **Indirekt** | Nej |
| 2 | A4 Koppla lead till person | `record_created` Hämtade erbjudanden | 4-grens matchning + Touchpoint | Nej | **Ja, alltid** |
| 2 | A5 Skapa/uppdatera engagemang | `record_updated` Hämtade erbjudanden (efter A4) | Skapar/uppdaterar Engagemang | Nej | **Ja, indirekt via A4** |
| 3 | A6 Fullbokat-notis | `record_matches` Eventplanering (beläggning=100%) | Mailar Roger/Lotta | Indirekt (eventets beläggning ändras) | Nej |
| 3 | A7 Synka obetalda | `record_updated` Anmälningar (VARJE fält) | Räknar om `Ej betalda` på eventet | **Ja, vid varje efterföljande ändring** | Nej |
| 3 | A8–A10 Närvaro | Deltaganden/Eventplanering | Tidstämpel + massmarkera närvaro | Nej (körs vid incheckning, inte anmälan) | Nej |
| — | A12 (ny, `TASK-229`) | `record_created` Anmälningar, `Inskickad isEmpty` | Sätter `Inskickad`-tidstämpel | **Ja, alltid** | Nej |

**Detta är skälet att väg A kan bli en liten lansering — eller inte.** Ingen
av A1, A2, A3, A11 eller A12 bryr sig om VEM som skapade raden — de triggar
på `record_created`/`record_matches` mot fälten, oavsett om skrivningen kom
från Zapier eller en Supabase Edge Function. Väg A:s EF kan alltså ersätta
HELA Elfsight+Zapier-leden utan att röra en enda automation, FÖRUTSATT att
EF:en sätter EXAKT samma fält A1–A3 läser (`EventKey`, `Vill anmäla sig
till`, `Person`-sökbar e-post) — vilket `create-registration` redan gör
för den manuella admin-vägen (§ 5). A7 är den enda automationen värd att
notera som en KOSTNAD snarare än ett beroende: den triggar på VARJE
uppdatering av en Anmälningar-rad (`P23`, `airtable-constraints.md` rad
380–393), så en EF som gör flera PATCH-anrop i rad (t.ex. skapa +
efter-sätta ett fält) multiplicerar A7-körningar i onödan — `ADR-014`s
idempotens-mönster (sätt allt i EN skrivning) undviker detta redan.

---

## 4. Sajten idag — mätt live med Playwright-MCP 2026-09-19

**Metod:** `mcp__playwright__browser_navigate` tillsammans med
`browser_network_requests` och `browser_evaluate` (läsning av
DOM/klass-attribut, ALDRIG fyllning av fält), plus ETT kontrollerat klick
på en "Reservera"-länk för att fånga pre-fill-URL:en (ren navigering,
ingen data skickades). Inget formulär
fylldes i eller skickades in. Cookie-samtycke godkändes (`Godkänn`) för att
tredjeparts-widgetar överhuvudtaget skulle ladda — detta är INTE en
personuppgifts-handling.

### Widgetar per sida

| Sida | Widget-app (mätt via skript-URL) | Widget-ID | Vad den visar |
|---|---|---|---|
| `/` (startsida) | testimonials-slider ×2 (troligt — se osäkerhet nedan) | `6ef650ff-…`, en av de fem | Recensioner (Bokus/Adlibris/Amazon-betyg + namngivna kundcitat) |
| `/` | event-calendar (utdrag) | `8d8c059d-05b7-4f64-8468-ab24d7c9cc57` | "Kommande utbildningar" — ETT eventkort |
| `/` | subscription-form | `9d9039fa-…` eller `f6719ab2-…` | "Meditationen Kraftfältet" — Förnamn + E-post |
| `/` | **oidentifierad femte boot** (`formBuilder.js` laddades) | resterande av de 5 ID:na | Ingen multi-fälts-formulär hittades visuellt i full-sides-skärmdumpen — se MÅSTE VERIFIERAS |
| `/pages/eventplanering` | event-calendar (full) | `a3432821-06f3-4085-a62f-0a2863dbc6c1` | Fullständig kalender, filter, `RESERVERA`/`PRIVAT EVENT`-knappar per event |
| `/pages/eventplanering` | **timeline** (ny app-typ, ej i `schema_reference.md`) | `be688c3b-36fe-41b4-8c68-d45c6d00b770` | 5-stegs "så funkar det"-graf: Leta upp event → Reservera → Fyll i uppgifter → **Betala reservationsavgiften** → Klart |
| `/pages/anmalan` | form-builder (huvudformulär) | `66b2c025-80e8-4c55-a5c5-4455931c48bc` | STEG 1 AV 2, bekräftat pre-fill |
| `/pages/kontakt` | contact-form | `d0a84db9-2c17-4dc0-bb35-fd559d1d2934` | Förnamn/Efternamn/E-post/Telefon/Meddelande/Bilaga |
| `/pages/hypnos` | **Common Ninja Audio Player** (ej Elfsight) | `73f069c5-8b59-4eab-a19e-a9d7c369281f` | Se eget avsnitt nedan |

Samtliga Elfsight-widgetar bootar via `elfsightcdn.com/platform.js` och
`core.service.elfsight.com/p/boot/?w=<id>` — samma mekanism `T159`/`ADR-122`
redan beskriver för kalender-widgeten. **Widgetarna är lat-laddade**
(`data-elfsight-app-lazy`-attribut) och renderar först vid scroll-in-view —
ett nätverksboot-anrop sker dock direkt vid sidladdning oavsett synlighet,
vilket förklarar varför nätverksloggen visade 5 boot-anrop på startsidan
innan alla 5 widgetar kunde bekräftas visuellt.

**Pre-fill-URL:en, fångad live (2026-09-19, `Fjärrskådning`-eventet
17–18 oktober):**

```text
https://miranon.se/pages/anmalan?EventKey=Event-61&Event=Fjärrskådning&Typ=Utbildning&Datum=17–18 oktober 2026&Ort=Rönninge
```

Detta MÄTER att pre-fill-mekanismen (`schema_reference.md` rad 962)
fortfarande fungerar och att just detta events `EventKey` har korrekt
"Event-N"-format — konsistent med att `ADR-122`s rotfix (byta
kalenderlänkarna mot basens `AnmälningsURL`) genomfördes eller att
Roger/Lotta manuellt skrivit rätt värde i Elfsights egen
event-konfiguration. Det är INTE ett bevis att ALLA kalenderposter är
korrekta — `ADR-122` § Kontext mätte 64 felmatchade av 304 innan rotfixen,
och länken är fortsatt en MÄNSKLIGT underhållen kopia, inte en levande
koppling till `Eventplanering`.

**Ett "PRIVAT EVENT"** (Resor i medvetandet 2, 19–20 september 2026) hade
ingen `RESERVERA`-knapp alls — en låst kalenderpost. Innebörd okänd, se
§ 7.

**reCAPTCHA** skyddar nu BÅDE huvudformuläret och kontaktformuläret (synlig
text "Den här webbplatsen skyddas av reCAPTCHA" på båda sidor) — inte
dokumenterat i `schema_reference.md` eller `data-model.md`. Relevant för
väg A: en server-side EF-mottagare behöver ett eget spam-skydd (t.ex.
Turnstile/hCaptcha eller rate-limiting) eftersom Elfsights inbyggda
reCAPTCHA försvinner med widgeten.

---

## Ljudspelaren i dag

**Tilläggsuppdrag från orkestreraren, samma pass.** Marcus uppgav att dagens
Shopify-sajt har en ljudspelar-widget som ska custombyggas. MÄTT
2026-09-19, `mcp__playwright__browser_network_request` mot Common Ninjas
egen embed-API (`cdn.commoninja.com/api/v1/embed/<guid>`) — svaret är JSON
och är den mest auktoritativa källan i hela detta research-pass, eftersom
det är leverantörens egen, live serverade konfiguration, inte en tolkning
av en skärmdump.

### 1. Var spelaren finns

**Endast på `/pages/hypnos`** ("Inspelade hypnossessioner"), under
rubriken "Sessioner". Kontrollerat: startsidan, `/pages/eventplanering`,
`/pages/anmalan`, `/pages/kontakt` bär INGEN Common Ninja-widget
(nätverksfilter `commoninja` gav noll träffar på dessa sidor). Övriga sidor
(`/pages/faq`, `/pages/community`, `/pages/utbildningar`,
`/pages/integritetspolicy`, `/pages/kopvillkor`) besöktes INTE i detta
pass — se § 7.

### 2. Leverantör/widget

**Common Ninja, inte Elfsight.** Skriptkällor: `cdn.commoninja.com/sdk/
latest/commonninja.js` + `cdn.commoninja.com/scripts/sdk/main.js` +
~25 numrerade JS-chunkfiler under `cdn.commoninja.com/wr/static/js/`.
Embed-API:t identifierar appen explicit: `"appMeta":{"name":"Audio
Player","type":"audio_player","slug":"audio-player",
"serviceName":"audioplayerninja"}`. Widgetens EGET namn, satt av
Roger/Lotta i Common Ninjas adminyta: **"Ljudspelare"** (`pluginData.name`).
Kontot ligger på planen **"Widgets Bundle 5 Widgets Pro Plan"**
(`planFeatures.planName`, originalvärdets bindestreck normaliserat här
för att inte kollidera med markdown-listsyntax) — tillåter upp till 5
samtidiga widget-instanser, vilket lämnar öppet om ytterligare Common
Ninja-widgetar finns på sidor jag inte besökte (§ 7).

### 3. Antal spår, titlar och längd

**10 spår**, mätt direkt ur embed-API:ts `content.songs`-array:

| # | Titel | Undertext | Spelbar på miranon.se? |
|---|---|---|---|
| 1 | Induktionen | Ljudspår 1 | **Ja** — 9:18 (avläst på progressbaren) |
| 2 | Graven jag ligger i | Ljudspår 2 | **Ja** — 6:09 |
| 3 | Pyramidens vajrar | Ljudspår 3 (tillgänglig i Soundwise-appen) | Nej — låst |
| 4 | Mellanrummet | Ljudspår 4 (tillgänglig i Soundwise-appen) | Nej — låst |
| 5 | Kommunikation och energi | Ljudspår 5 (tillgänglig i Soundwise-appen) | Nej — låst |
| 6 | Övergången | Ljudspår 6 (tillgänglig i Soundwise-appen) | Nej — låst |
| 7 | Tillverkar pyramider | Ljudspår 7 (tillgänglig i Soundwise-appen) | Nej — låst |
| 8 | Förstå tiden | Ljudspår 8 (tillgänglig i Soundwise-appen) | Nej — låst |
| 9 | Tomten som talar | Ljudspår 9 (tillgänglig i Soundwise-appen) | Nej — låst |
| 10 | Uppgången | Ljudspår 10 (tillgänglig i Soundwise-appen) | Nej — låst |

**Längden för spår 1–2 kommer INTE från Common Ninjas config** — API-svaret
saknar ett duration-fält helt. Tiderna (9:18, 6:09) läses av spelaren
client-side ur själva MP3-filens metadata via en HTTP Range-förfrågan (se
punkt 4). En custombyggd spelare måste alltså läsa filens egna metadata
(standard `<audio>`-beteende), inte förvänta sig ett facit-fält någonstans.

### 4. Var ljudfilerna hostas, och i vilket format

**Common Ninjas egen asset-CDN, bakom Cloudflare, med filerna liggande i
AWS S3.** MÄTT via `response-headers` på en av de två spelbara filerna
(`cdn.commoninja.com/asset/d9d253e8-b818-489b-...mp3`):

- `content-type: audio/mpeg` — format bekräftat MP3, inte en streaming-manifest.
- `x-amz-server-side-encryption: AES256`, `x-amz-request-id`,
  `x-amz-meta-fieldname: files[]` — filen ligger i en AWS S3-bucket.
- `via: heroku-router`, `x-powered-by: Express` — S3 nås via en
  Heroku-hostad Express-tjänst (Common Ninjas egen asset-server), inte
  direkt S3-URL.
- `cf-ray`, `server: cloudflare` — Cloudflare cachar lagret ytterst.
- `last-modified: 2025-09-16` — matchar embed-postens `created`-tidsstämpel
  exakt (samma dag).
- `content-length: 22326251` (≈21,3 MB för spår 1, `content-range: bytes
  0-22326250/22326251` — servern stödjer range-requests, standard för
  strömmande uppspelning).

**Låsta spår 3–10 har `audioSrc:""`** — ingen fil alls hostad hos Common
Ninja för dem. I stället bär de `link:"https://explor.today/pages/hypnos"`
och en hänglås-ikon (`website-assets.commoninja.com/.../lock.svg`).
**`explor.today` är en tredje, oidentifierad domän** — varken miranon.se,
psionautics.se, Elfsight, Common Ninja eller (såvitt jag kunnat mäta)
Soundwise självt. MÅSTE VERIFIERAS, se § 7.

**Jag laddade INTE ned filerna** — endast HTTP-headers lästes (`part:
"response-headers"`), och de två nätverksanropen mot spår 1–2 skedde
AUTOMATISKT vid sidladdning (spelarens egen metadata-inläsning för att
kunna visa längd/progressbar), inte via ett `play`-klick jag utförde.

### 5. Funktioner (mätt ur `pluginData.data.settings`, inte gissat)

| Funktion | Aktiverad? | Källa |
|---|---|---|
| Spellista (flera spår, taggad gruppering) | **Ja** — `showAllItemsTag: true`, tagg "Ljudspår 1-2" | embed-API |
| Spola/scrubba (progressbar) | **Ja** — `showProgressBar: true`, synlig och dragbar i skärmdump | embed-API + skärmdump |
| Uppspelningshastighet | **Ja** — `showSpeed: true` | embed-API (INGEN synlig hastighetsknapp i den kompakta "bar"-layouten jag skärmdumpade — troligen dold i "full view", `showFullViewButton: true`) |
| Nedladdning | **Nej, uttryckligen avstängt** — `showDownloadBtn: false` | embed-API |
| Omslagsbild | **Delvis** — `showMainCover`/`showPlaylistCover: true`, men alla 10 spår delar SAMMA generiska ikon-SVG (`asset/20538ced-....svg`), ingen unik bild per spår | embed-API |
| Shuffle/repeat/volym | Ja/Ja/Ja (`initialVolume: 38`) | embed-API |
| Sparar uppspelningsposition mellan besök | **Nej** — `saveTrackProgress: false` | embed-API |

### Vad detta betyder för migreringen

En custombyggd ersättare behöver: (a) egen filhosting för spår 1–2 (MP3,
~21 MB/styck — Supabase Storage eller motsvarande), (b) en medveten
produktfråga om spår 3–10 fortsatt ska peka mot en extern länk eller
byggas in, (c) ingen nedladdningsknapp (matchar dagens medvetna avstängning)
och (d) en riktig `<audio>`-baserad längdavläsning snarare än ett
hårdkodat facit. Detta ligger **utanför uppdragets ursprungliga fråga**
(intagskedjan) men registreras här enligt tilläggsordern.

---

## 5. Klassningen — vad väg A:s EF-väg ska ersätta, bevara eller låta dö

| Del av dagens kedja | Klass | Motivering |
|---|---|---|
| Elfsight Form Builder (huvud-/expressformulär) | **(a) Ersätt** | Väg A:s egna React-formulär tar över UI:t helt — Marcus besked, `tasks/sessions/2026-09-19-session-128.md` Del 1 |
| Elfsight Event Calendar (kalender + Reservera-knappar) | **(a) Ersätt** | Samma sajt-ombyggnad; kalendern blir en egen React-vy mot samma datakälla |
| Zapier (Zap 1–4, formulär→Airtable) | **(a) Ersätt** | `create-registration`-EF:en gör redan exakt detta för admin-vägen (§ nedan) — väg A pekar den publika sajten mot samma mönster i stället för mot Zapier |
| Handskrivna pre-fill-URL:er (Elfsight-adminyta) | **(a) Ersätt (elimineras helt)** | En EF-driven kalender kan hämta `EventKey` server-side ur `Eventplanering` — hela felklassen `ADR-122`/`T158` beskriver kan inte uppstå när länken aldrig är handskriven |
| A1–A5, A7, A11, A12 (Airtable-automationer) | **(b) Bevara orört** | Triggar på `record_created`/`record_matches` oavsett skrivkälla (§ 3) — ingen av dem vet eller bryr sig om att skrivningen kom från en EF i stället för Zapier |
| `ADR-122`:s vakt (fail-closed `Eventmatchning` + åtgärdskö + `relink-registration`) | **(b) Bevara orört** | Byggd och skarp (`supabase/functions/_shared/field-allowlists.ts` rad 656–659) — skyddar ALLA skrivkällor, inte bara Elfsight |
| Zapiers statiska fält (`Status="Obekräftad"`, `Flagga="Ny anmälan"` osv.) | **(b) Bevara orört, som logik i EF:en** | Samma konstanter, bara flyttade från Zap-konfiguration till EF-kod — ingen affärslogik ändras |
| Zap 5/6:s hash-källkoder (`Källa (formulärkälla)`) | **(c) Kan dö** | `data-model.md` fälla 26 flaggar dem redan som oklara/oanvändbara hash-strängar; en EF kan sätta ett läsbart klartextnamn i stället |
| Elfsight Subscription Form (lead-formulären) | **(a) Ersätt** | Samma sajt-ombyggnad som formulären ovan |
| Zap 7/8 (lead→Soundwise) | **(b) Bevara orört — UTANFÖR väg A:s scope** | Detta är en integration mot en TREDJE part (Soundwise), inte mot Airtable. Väg A rör Airtable-skrivvägen; Soundwise-kopplingen är ett separat beslut Marcus inte fattat i detta pass |
| Elfsight Contact Form → `Kontaktlogg` | **(a) Ersätt, lågt prioriterat** | Ingen automation bryr sig (§ 1.3) — enklast av de fyra att bygga om, men lägst värde eftersom inget i Airtable-kedjan påverkas |
| Väntelista/Anmälan-Psionautics (Formulär 3/7, psionautics.se) | **Utanför scope** | Ligger inte på miranon.se (§ 1.4) — klassas inte här |
| Common Ninja-ljudspelaren | **Utanför denna frågas scope, men samma (a)-mönster** | Tilläggsuppdraget — se eget avsnitt. Marcus har redan sagt den ska custombyggas |

---

## 6. Vad jag inte kunde belägga

- **Om expressformuläret (Formulär 2) fortfarande finns kvar och var det
  renderar på startsidan.** `formBuilder.js` laddades (nätverksbevis) men
  jag kunde inte visuellt lokalisera ett andra, fristående multi-fälts-
  formulär i en fullsides-skärmdump av startsidan. Kan bero på att
  formuläret ligger bakom en interaktion jag inte utlöste, eller att det
  faktiskt tagits bort till förmån för kalender-drivna "Reservera"-knappar.
- **Om "PRIVAT EVENT"-låsningen (Resor i medvetandet 2, 19–20 september
  2026) är en avsiktlig produktfunktion eller en Elfsight-inställning utan
  koppling till Airtables `Status`-fält.** Kunde inte verifieras utan
  prod-basåtkomst.
- **Om "Betala reservationsavgiften" (steg 4 i eventplanering-sidans
  5-stegs-graf) motsvarar en verklig, aktiv del av flödet eller är kvarvarande
  generisk widget-text.** Min bästa syntes (§ "Kort svar") är att det
  troligen syftar på en MANUELL Swish/banköverföring som Lotta hanterar
  utanför Elfsight/Zapier — konsekvent med att `Anmälningsavgift` är ett
  manuellt statusfält (§ 2) och att repot redan har en mogen
  kvitto-/betalningsyta (`ADR-109`, `ADR-128`, `ADR-130`,
  `docs/research/kvitto-beslutsunderlag-2026-08-30.md` m.fl.) — men detta
  är SYNTES, inte en mätning, och motsägs inte av Marcus eget besked
  ("ingenting säljs", vilket rimligen syftar på Shopifys egen
  produkt-/checkout-yta, inte en manuell reservationsavgift).
- **Fält-ID:n för `Hämtade erbjudanden`-tabellen** (utom `Källa
  (formulärkälla)`) finns inte i `data-model.md`s cheat sheet — jag har
  bara fältnamn från den frusna referensen.
- **Om ytterligare Common Ninja-widgetar finns på sidor jag inte besökte**
  (`/pages/faq`, `/pages/community`, `/pages/utbildningar`,
  `/pages/integritetspolicy`, `/pages/kopvillkor`) — planen tillåter upp
  till 5 instanser, jag har bara bekräftat 1.
- **Vad `explor.today` faktiskt är** — inte Soundwise verifierat, inte
  miranon.se/psionautics.se, ospecificerad tredje domän.
- **Exakt mekanism bakom `Touchpoints.Typ = "Soundwise-konto"/
  "Soundwise-lyssna"`** — dessa enum-värden existerar i basen
  (`schema_reference.md` rad 488) men VILKEN automation eller webhook som
  sätter dem är inte dokumenterad någonstans jag hittat, och ligger
  utanför detta pass tidsbudget att spåra.
- **Kontaktformulärets exakta postningsväg** (Zapier-webhook eller Elfsight
  direkt) — `schema_reference.md` rad 1037 säger uttryckligen att det är
  okänt, och jag har inte hittat en nyare källa.

---

## 7. MÅSTE VERIFIERAS LIVE AV ORKESTRERAREN

En rad per post — orkestreraren har prod-Airtable-åtkomst denna subagent
saknar (`.prod-airtable-policy.conf`-spärren, `CLAUDE.md` §
Verktygsfakta).

1. Slå upp `Eventplanering`-raden för `EventKey=Event-61` och bekräfta att
   den motsvarar "Fjärrskådning, 17–18 oktober 2026, Rönninge" — verifierar
   att pre-fill-URL:en jag fångade live pekar på rätt event (§ 4).
2. Läs samtliga options i `Anmälningar.Vill anmäla sig till`
   (`fld6RC3r0R9tuKgdF`) och avgör om "Resor i medvetandet 3" finns som
   kanonisk option idag, eller om formuläret skickar ett värde basen inte
   känner igen (§ 2).
3. Läs `Anmälningar.Status`-värdet (eller motsvarande) för eventet "Resor i
   medvetandet 2, 19–20 september 2026" och avgör varför kalender-widgeten
   visar "PRIVAT EVENT" utan `RESERVERA`-knapp (§ 4, § 6).
4. Kör `get_automation` (claude.ai-connectorn, huvudsession/orkestrerare —
   INTE denna subagent, se `.prod-airtable-policy.conf`) mot samtliga
   A1–A12 och bekräfta `deploymentStatus: deployed` för alla, särskilt A12
   (senast bekräftat 2026-08-24, tre veckor gammalt) och att inga nya
   automationer tillkommit sedan dess.
5. Sök i Zapier-kontot (Roger Gotthardssons konto, `schema_reference.md`
   rad 1081) efter en eventuell webhook/Zap som sätter
   `Touchpoints.Typ = "Soundwise-konto"/"Soundwise-lyssna"` — mekanismen är
   odokumenterad (§ 6).
6. Bekräfta om Kontaktformulärets (`/pages/kontakt`) Airtable-postning sker
   via en Zap som inte syns i den frusna listan, eller via en direkt
   Elfsight-webhook (§ 1.3, § 6).
7. Besök `/pages/faq`, `/pages/community`, `/pages/utbildningar`,
   `/pages/integritetspolicy`, `/pages/kopvillkor` och kontrollera
   nätverksanrop mot `commoninja.com` för att avgöra om fler än 1 av de 5
   tillåtna widget-instanserna faktiskt används (§ Ljudspelaren, punkt 1).
8. Klicka (utan att skicka in) på "Lyssna"-knapparna för "Poddar på
   Spotify" och "Meditationen på Spotify" på startsidan och avgör om de
   länkar ut till Spotify eller öppnar ett eget inbäddat element — jag
   kunde inte läsa ut href/onclick-mål via DOM-inspektion (§ 4).
9. Fråga Roger/Lotta direkt vad `explor.today` är och hur den relaterar
   till Soundwise-kontot (§ Ljudspelaren, punkt 4; § 6).
10. Verifiera om Meditationen Kraftfältets Zap 5 fortfarande är aktiv och
    identisk med `schema_reference.md`s mars-2026-mappning, eller om
    Pyramidernas vajrar (Formulär 6) fortfarande finns på en egen
    "erbjudandesida" — jag besökte bara startsidans instans av Kraftfältet
    (§ 1.2).

---

## Dom

**Intagskedjan på miranon.se idag är mätbar, i huvudsak intakt och
välbeskriven i tre lager (frusen mars-referens, mätt live 2026-09-19, samt
den auktoritativa fältdokumentationen i `data-model.md`) — men de tre
lagren motsäger varandra på specifika, namngivna punkter, inte
genomgående.** Väg A:s EF kan ersätta Elfsight+Zapier-leden UTAN att röra
en enda av A1–A12, eftersom samtliga automationer triggar på Airtable-radens
tillstånd, inte på dess ursprung. Den enskilt starkaste delfrågan för
klassningen var § 3 (automationsberoenden): svaret — att A1–A5/A7/A11/A12
är källoberoende — är det som gör väg A:s riskbild liten trots att den byter
ut hela intagskanalen. Den svagaste länken i dagens kedja är
inte automationerna utan den MÄNSKLIGA kopplingen mellan Elfsights
kalender-adminyta och Airtables `Eventplanering` (§ 4, § 1.1 steg 2) —
exakt det `ADR-122` redan identifierat och byggt en vakt mot, och exakt det
väg A strukturellt eliminerar genom att aldrig ha en handskriven länk att
underhålla.

## Rekommendation

**Detta är en rekommendation, inte ett beslut.** Bygg väg A:s EF mot samma
fält-kontrakt `create-registration` redan bevisat (§ 2, § 5) i stället för
att designa ett nytt skrivmönster — det ärver redan A1–A3:s idempotens
(`EventKey`+`Event` i samma skrivning, `fälla 9`) och undviker A12-klassens
efterhandskrycka genom att sätta `Inskickad` direkt vid create. Prioritera
huvudformuläret + kalendern (§ 1.1) före lead-formulären (§ 1.2) och
kontaktformuläret (§ 1.3) i den ordningen, eftersom huvudformuläret är den
enda vägen `ADR-122`s vakt är designad mot och den med störst mätt
felhistorik. Låt Soundwise-integrationen (Zap 7/8) och ljudspelaren vara
ETT separat beslutsspår — de rör en tredje part som inte är Airtable och
blandar in en produktfråga (paywall-modell) som ligger utanför "ersätt
intagskedjan".

## Källförteckning

- [`docs/reference/schema_reference.md`](../reference/schema_reference.md) — frusen ögonblicksbild mars 2026, rad 1–18 (proveniens), 939–1205 (formulär + Zapier), 1251–1510 (automationer A1–A11), 488/683 (Soundwise-touchpointtyper)
- [`docs/reference/data-model.md`](../reference/data-model.md) — auktoritativ för fältdata (ADR-100 §1), rad 1048–1112 (schema cheat sheet), 1768–1818 (anmälningskedjan + A2-decision), 1845–1917 (reverse-flow F.1–F.4), 1921–2059 (automationssekvenser), 2164/2180–2198/2224–2234/2332 (fällor 9, 17–19, 21, 24, 49)
- [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md) — rad 348–393 (P14–P16, P23: formelfördröjning, tyst automations-korruption, trigger-granularitet)
- [`docs/decisions/ADR-122-eventlankens-vakt-och-atgardskon.md`](../decisions/ADR-122-eventlankens-vakt-och-atgardskon.md) — Accepted 2026-08-21, fullständig kontext + beslut 1–8 + Updates
- [`tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md`](../../tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md) — paused, uppdragets bakgrund
- [`tasks/threads/T159-driftdetektor-mot-elfsight-kalendern.md`](../../tasks/threads/T159-driftdetektor-mot-elfsight-kalendern.md) — paused, medvetet bortval, samma kalender-widget
- [`tasks/sessions/2026-09-19-session-128.md`](../../tasks/sessions/2026-09-19-session-128.md) — Del 1, uppdragsgivande sessionsdok
- [`supabase/functions/_shared/field-allowlists.ts`](../../supabase/functions/_shared/field-allowlists.ts) — rad 656–659 (`relink-registration`), 178+ (`create-registration`)
- [`supabase/functions/create-registration/index.ts`](../../supabase/functions/create-registration/index.ts) — befintligt EF-mönster för Airtable-skrivning väg A kan återanvända
- **Live-mätning, Playwright-MCP, 2026-09-19:** `https://miranon.se/`, `/pages/eventplanering`, `/pages/anmalan` (inkl. pre-fill-query), `/pages/kontakt`, `/pages/hypnos` — nätverksloggar, DOM-inspektion, `mcp__playwright__browser_network_request` mot `cdn.commoninja.com/api/v1/embed/73f069c5-8b59-4eab-a19e-a9d7c369281f` (fullständigt JSON-svar) och response-headers för `cdn.commoninja.com/asset/d9d253e8-….mp3`
