---
owner: marcus803
updated: 2026-07-29
review_by: 2027-01-29
status: stable
---

# Reversibilitet som delegeringsaxel — prövning mot primärkällor (Code, 2026-07-29)

> **Proveniens:** avgränsat research-pass, 2026-07-29. Beställt som underlag för ett
> governance-beslut med ADR-permanens. Uppdraget var att PRÖVA en kandidat-regel, inte
> att klä den, och att aktivt söka kritik och dokumenterade misslyckanden.
>
> **Kandidat-regeln som prövas:** *en delegat får besluta ensam exakt när beslutet är
> billigt att återställa efter att det rapporterats.*
>
> **Avgränsning:** ett parallellt pass täcker agentiska kodningssystem specifikt. Detta
> pass täcker beslutsteorin och den bredare organisatoriska praxisen. Agent-specifik
> litteratur är medvetet utelämnad.
>
> **Vad passet gjorde:** läste Bezos 2015 års aktieägarbrev sida för sida i Amazons egen
> PDF; verifierade Jassys 2024-brev mot rå sidkälla; läste Fowlers IEEE-artikel i original;
> extraherade och sökte i CAIB:s Volym I (341 sidor) från NASA:s egen server; hämtade
> SEC:s beslut mot Knight Capital, GitLabs postmortem, AWS:s incidentsammanfattning och
> Sunsteins arbetspapper från Harvard DASH. Delegerade två avgränsade källinsamlingar
> (prejudikat-mekanik, riskklassnings-standarder) till underagenter med explicit krav på
> verbatim-verifiering och EJ BELAGD-märkning.
>
> **Vad passet INTE gjorde:** ingen kod ändrad, ingen fil utanför denna skriven, inget
> beslut fattat. Rekommendationen nedan är märkt som rekommendation.
>
> **Källkritisk varning som gäller hela dokumentet:** citat markerade **[LÄST I ORIGINAL]**
> har jag extraherat och läst i källfilen. Citat markerade **[VIA HÄMTNINGSMODELL]** kommer
> från en webbläsande modell och kan vara oprecist återgivna — de bär inte lika mycket vikt.

---

## Kort svar

**Axeln är verklig och välbelagd — men den är inte etablerad som en fristående
delegeringsaxel, och kandidat-regeln bör inte antas i sin nuvarande form.**

Tre fynd, från oberoende litteraturer, pekar åt samma håll:

1. **Primärkällan bär villkor vi tappat.** Bezos skriver att Type 2-beslut ska fattas
   snabbt *"by high judgment individuals or small groups"*. Reversibilitet delegerar
   aldrig ensam — den paras alltid med en egenskap hos delegaten. Jassy 2024 byter ut
   parametern mot *"fully accountable"*, men parar fortfarande. Kandidat-regelns
   rapporteringskrav är en rimlig motsvarighet till Jassys ansvarsvillkor, men
   omdömesvillkoret finns inte alls.

2. **I mogna, formella riskdiscipliner är återställbarhet i princip aldrig en egen axel.**
   ITIL, ISO 26262, DO-178C/EASA, FMEA och ISMP klassar på konsekvensens STORLEK, ibland
   plus sannolikhet, upptäckbarhet eller kontrollerbarhet. Den enda standard där ordet
   "reversible" alls står i en klassningsrubrik (ISO 13849-1) har det som *underkriterium
   inuti severity*. Sunstein når samma slutsats från juridiken: *"If this is the
   appropriate interpretation of irreversibility, then it is an aspect of seriousness."*
   **Två orelaterade litteraturer konvergerar: reversibilitet är en komponent i
   allvarlighet, inte en axel bredvid den.**

3. **Kritiken håller på tre av fyra punkter, och den fjärde är den farligaste.** Den
   skarpaste dokumenterade skadan kommer inte från felklassade irreversibla beslut, utan
   från korrekt klassade reversibla beslut som blev norm — precis det passet ombads
   undersöka i del D. CAIB:s rapport dokumenterar mekanismen i detalj, med dödlig utgång.

### Beslutstabell

| Delfråga | Dom | Grund på en rad |
|---|---|---|
| A. Är ursprunget som vi trodde? | **Delvis** | Ordalydelsen stämmer exakt, men källan är kortare, försiktigare och mer självkritisk än ryktet — och den handlar hos Bezos om PROCESSVIKT, inte om behörighet |
| A. Har den utvecklats? | **Ja, väsentligt** | Jassy 2024 gör den uttryckligen till en behörighetsregel: *"quickly and locally"*, *"owners … own the two-way door decisions"* |
| A. Publicerad tillämpningsmekanik? | **Nej — ingen funnen** | Amazon opererar den som LEDARSKAPSPRINCIP (kultur, rekrytering), inte som processgrind. Ingen klassningsmekanism publicerad i någon förstapartskälla jag nådde |
| B. Finns axeln under andra namn? | **Ja, brett** | AWS OPS05-BP09 namnger den ordagrant; Fowler bygger hela arkitekturrollen på den; Poppendieck riktar LRM explicit mot irreversibla beslut |
| B. Vilka axlar konkurrerar? | **Storlek vinner överallt** | Severity är den enda axel som förekommer i SAMTLIGA undersökta discipliner. Reversibilitet förekommer i ingen som egen axel |
| C1. Dyr att bedöma, partisk domare | **BELAGD** | Fowler: arkitektur är *"things that people perceive as hard to change"*. GitLab: återställbarheten var tyst trasig, och feldetektionen också |
| C2. Tekniskt ångerbart ≠ socialt ångerbart | **BELAGD** | CAIB: det första beslutet *"established a precedent for accepting, rather than eliminating, these technical deviations"* |
| C3. Ackumulering | **BELAGD, starkt** | CAIB: *"Taken one at a time, each decision seemed correct."* Plus Arthur/David om inlåsning utan låsningsbeslut |
| C4. "Det är ju reversibelt" som ursäkt | **EJ BELAGD som incident** | Ingen primärkällad incident funnen. Närmaste analogi är CAIB:s in-family-klassning som stoppade en bildbeställning |
| D. Skiljs beslut från normerande verkan? | **Ja — och lösningen är enhällig** | Normativ styrka deklareras som EGEN, EXPLICIT EGENSKAP hos artefakten: FRAP/9th Cir., RFC 2119+2026, W3C, Nygards statusfält |

---

## A. Ursprunget och den exakta formuleringen

### Vad primärkällan faktiskt säger

Källan är **Bezos brev till aktieägarna för 2015**, under rubriken **"Invention Machine"**,
sidan 5 i Amazons egen PDF. **[LÄST I ORIGINAL]**

Kandidat-regelns antagande om ordalydelsen stämmer:

> "Some decisions are consequential and irreversible or nearly irreversible – one-way doors
> – and these decisions must be made methodically, carefully, slowly, with great
> deliberation and consultation. If you walk through and don't like what you see on the
> other side, you can't get back to where you were before. We can call these Type 1
> decisions. But most decisions aren't like that – they are changeable, reversible –
> they're two-way doors. If you've made a suboptimal Type 2 decision, you don't have to
> live with the consequences for that long. You can reopen the door and go back through.
> **Type 2 decisions can and should be made quickly by high judgment individuals or small
> groups.**"

**Tre observationer som ryktet tappar bort.**

**Ett — problemet Bezos löser är processvikt, inte behörighet.** Stycket inleds:
*"One common pitfall for large organizations – one that hurts speed and inventiveness – is
'one-size-fits-all' decision making."* Och diagnosen: *"As organizations get larger, there
seems to be a tendency to use the heavy-weight Type 1 decision-making process on most
decisions."* Ordet som bär hela argumentet är **process**, kursiverat i originalet. Frågan
Bezos besvarar är hur mycket apparat ett beslut ska dra — inte vem som får fatta det.

**Två — villkoret "high judgment" är inte dekoration.** Reversibilitet delegerar aldrig
ensam i primärkällan. Den paras med en egenskap hos den som beslutar. Kandidat-regeln har
en enda variabel; källan har två.

**Tre — och detta är passets enskilt viktigaste fynd — Bezos underminerar sitt eget
argument i en fotnot.** Fotnot 1 på samma sida lyder i sin helhet:

> "The opposite situation is less interesting and there is undoubtedly some survivorship
> bias. Any companies that habitually use the light-weight Type 2 decision-making process
> to make Type 1 decisions go extinct before they get large."

Fotnoten erkänner två saker som kandidat-regeln vilar tungt på. **(a) Survivorship bias:**
argumentet formuleras av ett företag som överlevde, om ett fel som bara syns hos överlevare.
**(b) Asymmetrin:** att felklassa ett Type 1-beslut som Type 2 är *utdöende*, medan det
omvända bara är långsamt. Felen är inte lika dyra — och just därför är klassningen den
kritiska operationen.

Brevet erbjuder **ingen mekanism för klassningen**. Det säger uttryckligen
*"We'll have to figure out how to fight that tendency."* Att veta VILKEN dörr man står
framför är hela problemet, och primärkällan lämnar det olöst.

### Hur Amazon faktiskt tillämpar den

2016 års brev upprepar axeln under rubriken "High-Velocity Decision Making":
*"Many decisions are reversible, two-way doors. Those decisions can use a light-weight
process."* Samt: *"If you're good at course correcting, being wrong may be less costly than
you think, whereas being slow is going to be expensive for sure."* **[VIA HÄMTNINGSMODELL]**

Den senare meningen är viktig: den villkorar hela axeln på en förmåga —
*"if you're good at course correcting"* — som antas snarare än mäts.

Operationaliseringen är en **ledarskapsprincip**, inte en processgrind. "Bias for Action"
lyder i sin helhet: *"Speed matters in business. Many decisions and actions are reversible
and do not need extensive study. We value calculated risk taking."* **[VIA HÄMTNINGSMODELL]**
Notera vad reversibilitet styr: *"do not need extensive study"* — alltså återigen
utredningsdjup, inte behörighet. Ledarskapsprinciperna används i rekrytering och befordran;
de är kulturella normer, inte grindar.

**Jag hittade ingen publicerad förstapartsmekanik för hur ett beslut klassas som Type 1
eller Type 2** — varken i breven, i ledarskapsprinciperna eller i AWS Executive Insights.
Det är frånvaro av fynd, inte bevis för frånvaro; jag har inte uttömt Amazons publicerade
material.

### Har den utvecklats? Ja — och just i den riktning frågan gäller

**Jassys brev för 2024** flyttar axeln från processvikt till behörighet, explicit.
**[LÄST I ORIGINAL — verifierat mot rå sidkälla, inte via hämtningsmodell]**

> "We've had this long-held philosophy at Amazon about two-way and one-way door decisions.
> A two-way door decision is one where if you get the decision wrong, you can walk back
> through that door, revert to where you were, and there are few (if any) ramifications.
> **You can make these decisions quickly and locally.** A one-way door decision is one
> where it's quite difficult (if not impossible) to walk back through that door if you get
> the decision wrong, so these decisions are made more methodically."

Och kopplingen till organisationsform:

> "We want flatter organizations where our owners doing the work feel like they own the
> two-way door decisions (which are the vast majority), can move rapidly, and are
> **fully accountable** for solving the Whys of their customer experiences."

**Detta är den starkaste förstapartskällan för kandidat-regeln** — och den är nio år yngre
än den vi trodde att vi citerade. Men mönstret från 2015 upprepas: reversibilitet paras med
ett andra villkor. Bezos parade med *omdöme*; Jassy parar med *fullt ansvar*. Kandidat-regelns
"efter att det rapporterats" är en rimlig mekanisering av Jassys ansvarsvillkor. Omdömes-
villkoret saknas fortfarande.

---

## B. Samma axel under andra namn — och de axlar som konkurrerar

### Där axeln bekräftas

**AWS Well-Architected namnger den ordagrant.** Best practice **OPS05-BP09 "Make frequent,
small, reversible changes"**: *"Frequent, small, and reversible changes reduce the scope and
impact of a change. … When the changes are reversible, there is less risk to implementing
the change, as recovery is simplified."*

Två kalibreringsdetaljer värda att notera. AWS sätter **"Level of risk exposed if this best
practice is not established: Low"** — förstaparten graderar alltså sin egen
reversibilitetsprincip som lågrisk. Och den parade praktiken **OPS06-BP04 "Automate testing
and rollback"** graderas **Medium** — att *pröva* återställningen värderas högre än att
föredra återställbara ändringar.

**Fowler bygger arkitekturrollen på axeln.** I "Who Needs an Architect?" (IEEE Software,
juli/aug 2003, s. 4) **[LÄST I ORIGINAL]**:

> "One aspect I found particularly interesting was his comment that *irreversibility* was
> one of the prime drivers of complexity. … I think that one of an architect's most
> important tasks is to remove architecture by finding ways to eliminate irreversibility in
> software designs."

Två sourcing-nyanser: idén tillskrivs **Enrico Zaninotto, en ekonom**, på XP 2002 — inte
Fowler. Och Fowler definierar arkitektur som *"things that people **perceive** as hard to
change"* (s. 3). Ordet *perceive* är ingen slarvighet; det gör svårighetsgraden till en
bedömning, vilket är exakt kritikpunkt C1.

**Poppendieck riktar "last responsible moment" uttryckligen mot irreversibla beslut.** I
*Implementing Lean Software Development* (2006) står principen som fyra punkter, varav tre
handlar om att GÖRA saker reversibla och den fjärde om timing: *"**Schedule Irreversible
Decisions at the Last Responsible Moment** — Learn as much as possible before making
irreversible decisions."* LRM är alltså restposten för det som inte gick att göra
reversibelt — inte ett alternativ till reversibilitet.

**Och det starkaste PRO-argumentet, som ligger utanför skade-resonemanget helt.** Staw (1976)
visar att irreversibelt åtagande är ett *förvillkor* för eskalerande engagemang, och att
reversibilitet upphäver det (s. 28):

> "First, the individual must have committed himself to behavioral consequences which are
> irrevocable or at least not easily changed. **If it is readily possible to reverse one's
> own behavior, then this course of action may often be taken to reduce negative
> consequences** rather than any biasing of behavioral outcomes."

Reversibilitet skyddar alltså inte bara mot skadan — den bevarar förmågan att erkänna felet.
Det är ett argument som inte handlar om kostnad alls, utan om kognition, och det är det mest
underskattade stödet för axeln.

### Där axeln uteblir — och vad som står där i stället

En underagent kartlade sju formella riskdiscipliner. Resultatet är entydigt:

| Axel | ITIL 4 | ISO 26262 | DO-178C/EASA | FMEA | ISMP | ISO 13849-1 |
|---|---|---|---|---|---|---|
| Konsekvensens storlek | implicit | **S** | **enda axeln** | **S** | **enda axeln** | **S** |
| Sannolikhet/exponering | implicit | **E** | separat krav | **O** | nej | **F** |
| Upptäckbarhet | nej | nej | nej | **D** | nej | nej |
| Kontrollerbarhet | nej | **C** | nej | nej | nej | **P** |
| **Återställbarhet** | **nej** | **nej** | **nej** | **nej** | **nej** | *inuti S* |

**ITIL:s "standard change" klassas på risk, inte ångerbarhet.** Officiell AXELOS-ordlista:
*"A low-risk, pre-authorized change that is well understood and fully documented, and which
can be implemented without needing additional authorization."* Tre kriterier — låg risk,
välförstådd, dokumenterad. Återställbarhet nämns inte.

**ISMP klassar rena severity och avvisar sannolikhet uttryckligen:** *"High-alert medications
are drugs that bear a heightened risk of causing significant patient harm when they are used
in error. Although mistakes may or may not be more common with these drugs, the consequences
of an error are clearly more devastating to patients."*

**ISO 13849-1 är den enda som har ordet i rubriken** — S1 = *"slight (normally reversible
injury)"*, S2 = *"serious (normally irreversible injury or death)"*. Alltså ett
underkriterium som skiljer två severity-nivåer, inte en axel. *(Standarden är betalvägg;
riskgrafen är verifierad mot sekundärkälla — se § Vad jag inte kunde belägga.)*

### Den viktigaste strukturella observationen i hela passet

Där reversibilitet ÄR förstklassig i praktiken hanteras den som en **förutberäknad tröskel**,
aldrig som en bedömning i stunden.

**Flygets V1** är den renaste formen (14 CFR § 1.2): *"V₁ means the maximum speed in the
takeoff at which the pilot must take the first action … to stop the airplane within the
accelerate-stop distance."* Och 14 CFR § 25.107(a): *"V₁, in terms of calibrated airspeed,
**is selected by the applicant**"*. Tröskeln mellan ångerbart och oåterkalleligt räknas fram
under typcertifieringen och slås upp före rullning. **Piloten kallar ut V1 — bedömer den
inte.** Beslutet är flyttat ut ur stunden och in i förberäkningen.

**ITIL gör exakt samma sak organisatoriskt:** riskbedömningen för en standard change görs
**en gång, när proceduren skapas**, och upprepas inte per körning. *"This risk assessment
does not need to be repeated each time the standard change is implemented; it only needs to
be done if there is a modification to the way it is carried out."*

Detta är motmedlet mot kritikpunkt C1, och det kommer från två oberoende domäner: **den som
vill agera bedömer aldrig sin egen ångerbarhet i stunden — klassen är avgjord i förväg, av
någon annan.**

**Google SRE argumenterar dessutom inte alls från återställbarhet**, utan från
exponeringsmatematik: *"impact on the budget is directly proportional to the amount of
traffic exposed to defects."* Det är samma axel som ISO 26262:s E och FMEA:s O —
sannolikhet/exponering, inte ångerbarhet.

---

## C. Kritiken

### C1 — Återställbarhet är dyr att bedöma, och domaren är partisk — BELAGD

Invändningen håller, och den håller i flera oberoende former.

**Bedömningen är per definition subjektiv.** Fowler definierar arkitektur som *"things that
people perceive as hard to change"* — han placerar svårighetsgraden i betraktarens öga, inte
i systemet.

**Och den mäts sällan.** GitLabs postmortem från 2017-01-31 är det renaste dokumenterade
fallet. Fyra separata återställningsmekanismer fanns på papperet. Vid behov visade sig
`pg_dump`-backuperna aldrig ha körts: **[LÄST I ORIGINAL]**

> "When we went to look for the pg_dump backups we found out they were not there. The S3
> bucket was empty, and there was no recent backup to be found anywhere."

Orsaken var en versionsmissmatchning som fick backupen att avbrytas med fel. Och — den
avgörande detaljen — **felrapporteringen var också trasig**:

> "While notifications are enabled for any cronjobs that error, these notifications are sent
> by email. … Unfortunately DMARC was not enabled for the cronjob emails, resulting in them
> being rejected by the receiver. **This means we were never aware of the backups failing,
> until it was too late.**"

Återställbarheten var alltså inte bara frånvarande — dess frånvaro var osynlig. Ett beslut
som klassats "reversibelt" på basis av "vi har backup" hade varit felklassat under okänt lång
tid, utan att någon kunde veta det.

**Cockburn gör samma invändning mot LRM, och formulerar den skarpare än vi gjorde.** I "Last
Responsible Moment reconsidered" (2011):

> "Second, it is not actionable. By this I mean that you can't apply it. **You can't know
> when the actual Last such moment is until after the fact, when it is too late. You can
> tell you missed it, but you can't tell in advance when it will be.** … In my experience
> LRM is mostly used to hit someone over the head later when wishing to blame them for not
> deciding well. Bad tool."

Det är strukturellt identiskt med vår C1: en regel vars utlösande villkor bara går att
fastställa i efterhand är inte en operativ regel. Wirfs-Brock (2011) gör samma invändning
kortare: *"I'm not a good enough of a designer … to know when the last responsible moment
is."*

**Motmedlet finns och är belagt** — förutberäknad tröskel i stället för bedömning i stunden
(V1, ITIL standard change), plus **prövad** återställning i stället för påstådd
(AWS OPS06-BP04, som graderas högre än själva reversibilitetsprincipen).

### C2 — Tekniskt billigt att ångra, socialt dyrt — BELAGD

Sunstein angriper begreppet direkt, och hans slutsats är mer radikal än invändningen som
formulerades: **[LÄST I ORIGINAL]**

> "In one sense, the idea is unhelpful: All losses are irreversible, simply because time is
> linear."

Och, längre fram i samma essä, den precisering som träffar kandidat-regelns form:

> "Under the first interpretation, the initial question is whether a clear line separates
> the reversible from the irreversible. **Perhaps we have a continuum, not a dichotomy. The
> question is not whether some effect can be reversed, but instead at what cost.** … If
> this is the appropriate interpretation of irreversibility, then **it is an aspect of
> seriousness**."

Tre påståenden med direkt bäring på kandidat-regeln: (a) dikotomin dörr/inte-dörr är falsk,
(b) den relevanta frågan är kostnad, inte möjlighet, och (c) på den vanliga tolkningen är
irreversibilitet inte en egen axel utan **en aspekt av allvarlighet**. Det sista sammanfaller
med hela tabellen i del B — två litteraturer som inte känner till varandra.

Sunstein lägger till att skadan kan ligga åt båda hållen: *"significant and even irreversible
harms may well be on all sides of risk-related problems, and a focus on one set of risks will
give rise to others."* Att avstå är också ett beslut, och det kan vara det oåterkalleliga.

Den skarpaste illustrationen av "tekniskt ångerbart, socialt inte" hör hemma i del D nedan.

### C3 — Ackumulering — BELAGD, starkt

CAIB-rapporten ger meningen som bär hela invändningen (Volym I, kap. 8, s. 201)
**[LÄST I ORIGINAL]**:

> "Each time an incident occurred, the Flight Readiness process declared it safe to continue
> flying. **Taken one at a time, each decision seemed correct.**"

Och mekanismen (s. 196):

> "Engineers and managers incorporated worsening anomalies into the engineering experience
> base, **which functioned as an elastic waistband, expanding to hold larger deviations from
> the original design**. Anomalies that did not lead to catastrophic failure were treated as
> a source of valid engineering data that justified further flights. These anomalies were
> translated into a safety margin that was extremely influential, allowing engineers and
> managers to **add incrementally** to the amount and seriousness of damage that was
> acceptable."

Ekonomisk litteratur ger samma resultat formellt. David (1985) om QWERTY-inlåsningen:
*"the larger system of production was **nobody's design**"* — och om aktörerna:
*"while they are, as we now say, perfectly 'free to choose,' their behavior, nevertheless, is
held fast in the grip of events long forgotten."* Arthur (1989) visar formellt att inlåsning
uppstår ur *"historical 'small events' [that] are not averaged away and 'forgotten' by the
dynamics"*, där varje aktör bara gör ett lokalt rationellt val.

**Poängen som är belagd: ett system kan bli låst utan att någon fattade ett låsningsbeslut.**
Hundra individuellt reversibla beslut behöver därför inte vara reversibla tillsammans — och
ingen av de hundra klassningarna var fel var för sig.

Ett samtida tredjepartsvittnesmål pekar på samma sak i mjukvara: en teknisk valfrihet
förfaller i takt med att andra bygger vidare — *"That might have been true the day it was
written, but it's probably not true now."* *(Blogginlägg, 2026-07-27 — åsikt, inte belägg;
tas med som formulering, inte som evidens.)*

### C4 — "Det är ju reversibelt" som ursäkt för att kringgå beslutsrätt — EJ BELAGD som incident

**Jag hittade ingen primärkällad, dokumenterad incident där återställbarhet uttryckligen
åberopades för att kringgå en beslutsrätt.** Det betyder inte att sådana saknas — jag har
inte uttömt sökrymden. Frånvaron rapporteras som frånvaro.

Två närliggande fall är dokumenterade och relevanta:

**Klassning som stoppade eskalering (CAIB, s. 179).** När en säkerhetsansvarig kontaktades om
en bildbeställning: *"Erminger said that he was told this was an 'in-family' event. O'Connor
stated he would defer to Shuttle management … Despite two safety officials being contacted,
one of whom was NASA's highest-ranking safety official, safety personnel took no actions to
obtain imagery."* Klassningen — inte sakfrågan — avgjorde att ingen eskalering skedde.

**Rutinstämpel utan andra ögon (SEC mot Knight Capital, ¶15).** **[LÄST I ORIGINAL]**

> "During the deployment of the new code, however, one of Knight's technicians did not copy
> the new code to one of the eight SMARS computer servers. **Knight did not have a second
> technician review this deployment** and no one at Knight realized that the Power Peg code
> had not been removed from the eighth server, nor the new RLP code added. **Knight had no
> written procedures that required such a review.**"

Utfallet: 45 minuter, 4 miljoner exekveringar, *"Knight realized a $460 million loss"*.
Beslutet att deploya var rutin och betraktat som ofarligt. Det var inte klassat som
irreversibelt — men det saknade den andra granskaren, och den saknaden var det SEC fällde.

**AWS S3-avbrottet 2017-02-28** visar samma mönster i ren form: *"an authorized S3 team member
using an established playbook executed a command … one of the inputs to the command was
entered incorrectly and a larger set of servers was removed than intended."* Åtgärden efteråt
angriper inte omdömet utan mekanismen: *"We have modified this tool to remove capacity more
slowly and added safeguards to prevent capacity from being removed when it will take any
subsystem below its minimum required capacity level."* Alltså: gör den farliga operationen
långsam och strukturellt omöjlig, i stället för att lita på klassningen.

### En invändning som inte stod i briefen, men som källorna reser

**Universell reversibilitet är inte gratis.** Ralph Johnson, citerad av Fowler (s. 4)
**[LÄST I ORIGINAL]**:

> "There is no theoretical reason that anything is hard to change about software. If you pick
> any one aspect of software then you can make it easy to change, but we don't know how to
> make everything easy to change. **Making something easy to change makes it a little more
> complex, and making *everything* easy to change makes the entire system very complex.**"

"Gör allt till en tvåvägsdörr" är alltså ingen sammanhängande strategi. Reversibilitet
tillverkas, och den kostar komplexitet — vilket i sin tur är det Zaninotto pekar ut som det
irreversibilitet driver. Axeln bär en spänning mot sig själv.

---

## D. Prejudikat-problemet

Detta var passets svåraste och mest givande del. Frågan var om det finns litteratur eller
praxis för att skilja *beslutet* från *dess normerande verkan*. **Svaret är ja, och lösningen
är påfallande enhällig över fyra orelaterade institutionella traditioner.**

### Det dokumenterade haveriet

CAIB-rapporten beskriver exakt vår incidentklass: ett beslut som var försvarbart i sitt fall
blev norm och lästes därefter som gällande regel (Volym I, s. 196) **[LÄST I ORIGINAL]**:

> "These engineers decided to implement a temporary fix and/or accept the risk, and fly. For
> both O-rings and foam, **that first decision was a turning point. It established a
> precedent for accepting, rather than eliminating, these technical deviations. As a result
> of this new classification, subsequent incidents … were not defined as signals of danger,
> but as evidence that the design was now acting as predicted.**"

Det mest avslöjande är NASA:s **formella definition** av klassen. Ur samma rapport:

> "**In Family:** A reportable problem that was **previously experienced**, analyzed, and
> understood. Out of limits performance or discrepancies that **have been previously
> experienced** may be considered as in-family when specifically approved by the Space
> Shuttle Program or design project."

Klassningskriteriet ÄR prejudikat. "Vi har gjort det förut" är inte en biverkning av regeln —
det är regelns text. CAIB kommenterar torrt: *"'In-family' was a strange term indeed for a
violation of system requirements."*

Och styrelsens formella fynd F6.1−2: *"Foam-shedding, which had initially raised serious
safety concerns, evolved into 'in-family' or 'no safety-of-flight' events or were deemed an
'accepted risk.'"*

**Bevisbördan vände som följd.** Först observationen, s. 169:

> "The engineers found themselves in the unusual position of having to prove that the
> situation was unsafe – **a reversal of the usual requirement to prove that a situation is
> safe**."

Och sedan styrelsens egen dom över det, s. 190:

> "Organizations that deal with high-risk operations must always have a healthy fear of
> failure – operations must be proved safe, rather than the other way around. **NASA inverted
> this burden of proof.**"

Detta är prejudikat-problemets verkningsmekanism i klartext: normen ändrade inte bara vad man
trodde, utan **vem som måste bevisa vad**.

### Lösningen: normativ styrka som deklarerad, separat egenskap

Fyra traditioner har oberoende landat i samma konstruktion — normativ kraft är **inte** en
följd av att beslutet fattades, utan en **egenskap som märks ut explicit på artefakten**.

**Juridiken.** Ninth Circuit Rule 36-3(a): *"**Not Precedent.** Unpublished dispositions and
orders of this Court are not precedent, except when relevant under the doctrine of law of the
case or rules of claim preclusion or issue preclusion."* Regeln är tvådelad: (a) deklarerar
normativ status, (b) reglerar citerbarhet — separat. FRAP 32.1 tillåter citering av allt, och
kommentaren säger uttryckligen: *"**It says nothing about what effect a court must give to
one of its unpublished opinions.**"* Läsbarhet och bindande verkan är alltså två oberoende
egenskaper.

Kozinski formulerar i *Hart v. Massanari* (9th Cir. 2001) vad ett icke-prejudicerande beslut
faktiskt är:

> "What it does mean is that **the disposition is not written in a way that will be fully
> intelligible to those unfamiliar with the case, and the rule of law is not announced in a
> way that makes it suitable for governing future cases.** … An unpublished disposition is,
> more or less, a letter from the court to parties familiar with the facts."

**Skrivsättet avgör om något normerar.** Det är den direkta lärdomen för vår incident: ett
beslut som skrivs som en generell regel normerar, oavsett vad beslutsfattaren avsåg.

Att detta är omtvistat hör till bilden. *Anastasoff* (8th Cir. 2000) hävdade motsatsen — att
prejudikatverkan följer automatiskt av att döma och inte kan väljas bort: *"such a statement
exceeds the judicial power, which is based on reason, not fiat."* *Hart* vann i praktiken, men
tvisten visar att avnormering är en aktiv, kontroversiell handling — inte en självklarhet.

Besläktat: **ratio decidendi vs obiter dicta**. Marshall i *Cohens v. Virginia* (1821):
*"general expressions, in every opinion, are to be taken in connection with the case in which
those expressions are used. If they go beyond the case, they may be respected, but ought not
to control the judgment in a subsequent suit."* Räckvidden är begränsad till vad beslutet
krävde.

Och att ett **avslag** inte är ett ställningstagande — Holmes i *United States v. Carver*
(1923): *"The denial of a writ of certiorari imports no expression of opinion upon the merits
of the case, as the bar has been told many times."* Frankfurter, 1950: *"again and again the
admonition has to be repeated."* Även med uttrycklig, upprepad deklaration läser omvärlden
in normativitet där ingen finns. Det är en nykter kalibrering av hur mycket en deklaration
ensam orkar.

**Standardiseringen.** RFC 2119 innehåller den skarpaste enskilda meningen i hela underlaget:

> "**Note that the force of these words is modified by the requirement level of the document
> in which they are used.**"

Ett MUST i ett Informational-RFC är inte ett MUST i en standard. Normativ styrka har alltså
**två nivåer**: nyckelordet i meningen, och dokumentets deklarerade status. RFC 2026:
*"The documents bearing these labels are not Internet Standards in any sense."* W3C skiljer
likaledes Recommendation från Note: *"they have no standing as a recommendation of W3C but
are simply documents preserved for historical reference."* RFC 2119 varnar dessutom för
inflation: *"Imperatives of the type defined in this memo **must be used with care and
sparingly**."*

**Arkitekturbeslut.** Nygards ADR-mönster (2011) bär samma konstruktion i miniatyr:

> "**If a decision is reversed, we will keep the old one around, but mark it as superseded.
> (It's still relevant to know that it was the decision, but is no longer the decision.)**"

Artefakten består; dess normerande kraft upphör. Notera att upphävandet hos Nygard alltid är
en **explicit handling** — kontextskifte är signalen som gör omprövning påkallad, inte något
som automatiskt avnormerar.

### Vad detta betyder för kandidat-regeln

**Prejudikat-verkan är en andra, oberoende dimension som reversibilitets-axeln inte kan se.**
Ett beslut kan vara billigt att tekniskt återställa och samtidigt normera dyrt — och axeln
mäter bara den första storheten. Det är inte en svaghet man kalibrerar bort; det är en
storhet regeln saknar variabel för.

Källorna pekar entydigt mot att lösningen ligger i **artefakten, inte i beslutet**: märk ut
normativ status explicit, skilj "detta gällde här" från "detta gäller hädanefter", och gör
avnormering till en aktiv handling med kvittens.

---

## Dom

### Vad som STÖDER axeln

- **Den har genuin förstapartsförankring för delegering — men i Jassy 2024, inte i Bezos
  2015.** *"You can make these decisions quickly and locally."*
- **Den har en rigorös teoretisk grund.** Arrow & Fisher (1974) och Pindyck (1991): en
  irreversibel handling *"kills"* optionen att vänta, och den förlorade optionen är en verklig
  alternativkostnad. Formuleringen är exakt och avgränsad — Arrow & Fisher betonar själva att
  *"Just because an action is irreversible does not mean that it should not be undertaken.
  Rather, the effect of irreversibility is to reduce the benefits."* Axeln är en **avdragspost
  i en avvägning**, inte ett veto och inte en grind.
- **Den namnges som designprincip av en branschledare.** AWS OPS05-BP09.
- **Den bär en kognitiv fördel utöver skadebegränsning.** Staw (1976): reversibilitet upphäver
  förvillkoret för eskalerande engagemang. En reversibel felhandling går att erkänna.
- **Arkitekturlitteraturen behandlar irreversibilitet som något man aktivt eliminerar**, inte
  bara sorterar efter (Fowler/Zaninotto).

### Vad som MOTSÄGER axeln

- **Ingen mogen riskdisciplin använder den som egen axel.** Sex av sju undersökta standarder
  nämner återställbarhet inte alls i sin klassning; den sjunde har den som underkriterium
  inuti severity.
- **Två oberoende litteraturer säger att den ÄR severity.** Sunstein: *"it is an aspect of
  seriousness."* ISO 13849-1: reversibel/irreversibel skiljer S1 från S2.
- **Dikotomin är falsk.** Sunstein: *"Perhaps we have a continuum, not a dichotomy. The
  question is not whether some effect can be reversed, but instead at what cost."*
- **Primärkällan erkänner själv survivorship bias och en asymmetrisk, fatal feltyp — utan att
  erbjuda någon klassningsmekanism.**
- **Klassningen görs av den som vill agera, och bedömningen är per konstruktion subjektiv**
  (Fowler: *perceive*). Cockburns LRM-kritik är samma invändning i annan domän: en regel vars
  villkor bara går att fastställa i efterhand är inte operativ.
- **Ackumulering upphäver den.** *"Taken one at a time, each decision seemed correct."*
- **Axeln är blind för normerande verkan** — vår faktiska incidentklass.
- **Universell reversibilitet kostar komplexitet** (Johnson via Fowler), så "gör allt
  reversibelt" är inte en utväg.

### Skyddsmekanismer som källorna faktiskt föreslår

| Mot | Mekanism | Källa |
|---|---|---|
| C1 partisk domare | **Förutberäkna klassen off-line; den som agerar bedömer aldrig i stunden** | V1 (14 CFR 25.107: *"selected by the applicant"*); ITIL standard change (risk bedöms en gång, vid procedurens skapande) |
| C1 påstådd återställbarhet | **Pröva rollbacken automatiskt — anta den aldrig** | AWS OPS06-BP04 (graderas Medium, dvs. högre än reversibilitetsprincipen själv); GitLab som motexempel |
| C1 tyst förfall | **Övervaka att återställningsvägen fortfarande finns** | GitLab: både backupen och dess felrapport var trasiga |
| C2/C3 | **Begränsa exponeringen i stället för att lita på ångerknappen** | Google SRE: skada ∝ trafik × tid; partitionering mot smitta; AWS S3-åtgärden: gör operationen långsam och strukturellt begränsad |
| C3 ackumulering | **Håll bevisbördan vid "bevisa att det är säkert" — vänd den aldrig** | CAIB s. 190: *"NASA inverted this burden of proof."* |
| C3 prejudikat-som-kriterium | **Låt aldrig "vi gjorde det förut" vara klassningsgrund** | CAIB:s in-family-definition är det dokumenterade antimönstret |
| D normerande verkan | **Deklarera normativ status som egen, explicit egenskap på artefakten** | 9th Cir. R. 36-3(a); RFC 2119 (*"force … is modified by the requirement level of the document"*) + RFC 2026; W3C Note vs Recommendation; Nygards `superseded` |
| D räckvidd | **Begränsa normen till vad beslutet faktiskt krävde** | *Cohens v. Virginia*: uttryck som går bortom fallet *"ought not to control the judgment in a subsequent suit"* |
| D skrivsättet | **Ett beslut skrivet som generell regel normerar — oavsett avsikt** | *Hart v. Massanari* |

---

## Vad jag inte kunde belägga

Denna sektion är obligatorisk och är sannolikt passets mest användbara del: den visar var
nästa beslut vilar på antaganden.

1. **Ingen dokumenterad incident där "det är reversibelt" uttryckligen åberopades för att
   kringgå beslutsrätt.** Jag sökte specifikt och hittade ingen primärkälla. Det närmaste är
   CAIB:s in-family-klassning som stoppade en bildbeställning. **Frånvaro av fynd, inte bevis
   för frånvaro.**
2. **Ingen publicerad Amazon-mekanik för HUR ett beslut klassas Type 1/Type 2.** Sökt i
   aktieägarbreven, ledarskapsprinciperna och AWS Executive Insights. Jag har inte uttömt
   Amazons publicerade material.
3. **Claude Henry (1974), "The Irreversibility Effect"** — AER/JSTOR-betalvägg, ingen fri
   version funnen. Ej citerad någonstans i detta dokument.
4. **RPN = Severity × Occurrence × Detection är inte verbatim-belagd mot primärstandard**
   (SAE J1739 / IEC 60812 är betalvägg). Formeln är okontroversiell men jag rapporterar den
   inte som verifierat citat. AIAG-VDA:s övergång från RPN till Action Priority ÄR belagd via
   AIAG:s egen kanal; **motiveringen till bytet är EJ BELAGD**.
5. **ISO 26262:s severity-definition och klasserna S0–S3/E0–E4/C0–C3** — utanför den fria
   preview-texten. Tre-axel-modellen (S, E, C) är däremot verbatim-belagd ur ISO 26262-10:2012.
6. **DO-178C:s egen mappning Level A–E mot Catastrophic–No Effect** — betalvägg. Att nivån
   sätts av severity är belagt via FAA AC 20-115D och EASA AMC 25.1309.
7. **ISO 13849-1:s riskgraf (S1/S2-formuleringen)** — verifierad mot sekundärkälla, inte mot
   standardtexten. Standarden är betald.
8. **ICAO:s formella "point of no return"-definition** — betal-/inloggningsgrind. Mönstret är
   i stället belagt via EU:s Air OPS-regelverk, som kräver att PNR beräknas och att en
   checklista är avbetad före passage.
9. **Poppendiecks bokdefinition av LRM (2003)** — boken är betalvägg; definitionen är
   verifierad mot Mary Poppendiecks egen samtida essä (2003-08-01) med identisk lydelse.
10. **2016 års Bezos-brev och Amazons ledarskapsprinciper är hämtade via hämtningsmodell**,
    inte lästa i rå källa. Citaten är sannolikt korrekta men bär mindre vikt än 2015-brevet
    och Jassy 2024, som båda är verifierade i original.
11. **Akademisk, peer-reviewad kritik av LRM** — jag hittade endast Cockburn (blogg, 2011,
    hämtad ur Wayback då originalet ger 404) och Wirfs-Brock (blogg, 2011). Ingen akademisk
    behandling funnen; sökrymden är inte uttömd.
12. **Två sökmotorsammanfattningar höll inte vid verifiering** och används därför inte:
    påståendet att "blast radius" förekommer i SRE Workbook kap. 16 / SRE Book kap. 27
    (termen finns inte i något av kapitlen), och att V1 definieras i 14 CFR 1.1 (den står i
    **1.2**). Två W3C-citat kunde inte återfinnas i processdokumentet och är uteslutna.

---

## Rekommendation

*Detta är en rekommendation, inte ett beslut. Beslutsrätten är Marcus'.*

**1. Anta inte kandidat-regeln i nuvarande lydelse.** Den faller på tre punkter: den har en
variabel där varje primärkälla har två, den låter den som vill agera vara sin egen domare, och
den saknar variabel för normerande verkan — vilket är vår faktiska incidentklass.

**2. Byt förstahandsaxel till konsekvensens storlek, och behåll reversibilitet som
modifierare.** Detta är det enda som samtliga mogna discipliner gör, och det är vad Sunstein
argumenterar för filosofiskt. Formuleringen som källorna bär: *storleken avgör klassen;
återställbarhet kan sänka den ett steg, aldrig upphäva den.*

**3. Förklassa i förväg i stället för att bedöma i stunden.** Det är den enda belagda
motmedicinen mot den partiska domaren, och den finns i två oberoende domäner (V1, ITIL
standard change). Konkret form: en uppräknad lista över operationsklasser som är
förauktoriserade, beslutad utanför det ögonblick då någon vill agera — inte ett omdöme per
tillfälle.

**4. Kräv att återställningsvägen är prövad, inte påstådd.** AWS graderar detta högre än
reversibilitetsprincipen själv, och GitLab visar varför. En klass får kallas reversibel bara
om återställningen körts skarpt och dess funktion övervakas.

**5. Inför en separat, explicit norm-status på allt som skrivs ned.** Detta är passets
tydligaste och mest överförbara fynd, och det angriper vår faktiska incident direkt. Fyra
orelaterade traditioner har landat i samma konstruktion. Minimiformen: varje nedskriven
artefakt bär en uttrycklig markering av om den normerar eller bara redovisar ett enskilt fall,
och avnormering sker genom en aktiv, kvitterad handling — aldrig genom tyst glidning.
Konstruktionen finns redan i repots ADR-maskineri (`superseded`); det som saknas är att den
gäller *allt nedskrivet*, inte bara ADR:er.

**6. Håll bevisbördan.** Skriv in att den som vill klassa ned ett beslut ska visa att det är
säkert — aldrig att den som invänder ska visa att det är farligt. CAIB:s dyraste mening är
*"NASA inverted this burden of proof."*

**7. Bevaka ackumuleringen explicit.** Ingen enskild klassning fångar den. Källorna erbjuder
ingen automatik här; det som finns är periodisk omprövning av om summan av tidigare
reversibla beslut fortfarande är reversibel. **Detta är den svagast belagda av mina sju
punkter** och bör märkas som sådan i ett eventuellt ADR.

---

## Källförteckning

### Primärkällor — lästa i original

- Jeff Bezos, *2015 Letter to Shareholders*, Amazon.com Inc., § "Invention Machine", s. 5 inkl. fotnot 1 — <https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF>
- Andy Jassy, *2024 Letter to Shareholders*, Amazon.com Inc., § "A Why Culture" — <https://www.aboutamazon.com/news/company-news/amazon-ceo-andy-jassy-2024-letter-to-shareholders>
- Martin Fowler, "Who Needs an Architect?", *IEEE Software*, juli/aug 2003, s. 2–4 — <https://martinfowler.com/ieeeSoftware/whoNeedsArchitect.pdf>
- *Columbia Accident Investigation Board Report, Volume I*, augusti 2003 — särskilt s. 169, 179, 190, 196, 201 samt fynd F6.1−2 — <https://www.nasa.gov/wp-content/uploads/static/history/columbia/reports/CAIBreportv1.pdf>
- Cass R. Sunstein, *Two Conceptions of Irreversible Environmental Harm*, Olin Working Paper No. 407, 2008 — <https://dash.harvard.edu/server/api/core/bitstreams/7312037d-4051-6bd4-e053-0100007fdf3b/content>
- SEC, *In the Matter of Knight Capital Americas LLC*, Admin. Proc. 34-70694, 2013-10-16, ¶15–17 — <https://www.sec.gov/files/litigation/admin/2013/34-70694.pdf>
- GitLab, *Postmortem of database outage of January 31*, 2017-02-10 — <https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/>
- Amazon Web Services, *Summary of the Amazon S3 Service Disruption in the Northern Virginia (US-EAST-1) Region*, 2017-02-28 — <https://aws.amazon.com/message/41926/>
- Kenneth J. Arrow & Anthony C. Fisher, "Environmental Preservation, Uncertainty, and Irreversibility", *Quarterly Journal of Economics* 88(2), 1974, s. 312–319
- Robert S. Pindyck, "Irreversibility, Uncertainty, and Investment", *Journal of Economic Literature* XXIX, 1991 — <https://web.mit.edu/rpindyck/www/Papers/IrreverUncertInvestmentJEL1991.pdf>
- W. Brian Arthur, "Competing Technologies, Increasing Returns, and Lock-In by Historical Events", *Economic Journal* 99(394), 1989, s. 116–131
- Paul A. David, "Clio and the Economics of QWERTY", *American Economic Review* 75(2), 1985, s. 332–337 — <https://fbaum.unc.edu/teaching/articles/David_AER_1985.pdf>
- Barry M. Staw, "Knee-Deep in the Big Muddy", *Organizational Behavior and Human Performance* 16, 1976, s. 27–44

### Standarder, regelverk och förstapartsdokumentation

- AWS Well-Architected, *OPS05-BP09 Make frequent, small, reversible changes* — <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_freq_sm_rev_chg.html>
- AWS Well-Architected, *OPS06-BP04 Automate testing and rollback* — <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_mit_deploy_risks_auto_testing_and_rollback.html>
- 14 CFR § 1.2 (definition av V₁) — <https://www.law.cornell.edu/cfr/text/14/1.2>
- 14 CFR § 25.107 (fastställande av V₁) — <https://www.law.cornell.edu/cfr/text/14/25.107>
- *ITIL® 4 Foundation Glossary*, AXELOS, januari 2019 — <https://www.meriroos.ee/Stuff/ITIL%204%20Foundation%20Glossary%20Estonian%20January%202019%20D.pdf>
- ISO 26262-10:2012, *Guidelines on ISO 26262* (fri ISO-preview) — <https://cdn.standards.iteh.ai/samples/54591/44e99bd4cb9a400890cde055cf733aa6/ISO-26262-10-2012.pdf>
- FAA Advisory Circular AC 20-115D — <https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_20-115D.pdf>
- ISMP, *List of High-Alert Medications in Acute Care Settings* — <https://www.ismp.org/sites/default/files/attachments/2018-01/highalertmedications(1).pdf>
- Google, *The Site Reliability Workbook*, kap. 16 "Canarying Releases" — <https://sre.google/workbook/canarying-releases/>

### Prejudikat-mekanik

- Federal Rule of Appellate Procedure 32.1 med Committee Notes (2006) — <https://www.law.cornell.edu/rules/frap/rule_32.1>
- Ninth Circuit Rule 36-3 — <https://cdn.ca9.uscourts.gov/datastore/uploads/rules/frap.pdf>
- *Hart v. Massanari*, 266 F.3d 1155 (9th Cir. 2001) — <https://law.resource.org/pub/us/case/reporter/F3/266/266.F3d.1155.99-56472.html>
- *Anastasoff v. United States*, 223 F.3d 898 (8th Cir. 2000) — <https://law.resource.org/pub/us/case/reporter/F3/223/223.F3d.898.99-3917.html>
- *Cohens v. Virginia*, 19 U.S. (6 Wheat.) 264, 399–400 (1821) — <https://tile.loc.gov/storage-services/service/ll/usrep/usrep019/usrep019264/usrep019264.pdf>
- *United States v. Carver*, 260 U.S. 482, 490 (1923) — <https://tile.loc.gov/storage-services/service/ll/usrep/usrep260/usrep260482/usrep260482.pdf>
- RFC 2119 / BCP 14 — <https://www.rfc-editor.org/rfc/rfc2119.txt>
- RFC 2026 / BCP 9 — <https://www.rfc-editor.org/rfc/rfc2026.txt>
- W3C Process Document — <https://www.w3.org/policies/process/>
- Michael Nygard, "Documenting Architecture Decisions", 2011-11-15 — <https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions>

### Tredjepartskällor (lägre i hierarkin, märkta i texten)

- Alistair Cockburn, "Last Responsible Moment reconsidered", 2011-10-07 (via Wayback) — <http://web.archive.org/web/20170619152304/http://alistair.cockburn.us/Last+Responsible+Moment+reconsidered>
- Rebecca Wirfs-Brock, "Agile Architecture Myths #2", 2011-01-18 — <https://wirfs-brock.com/rebecca/blog/2011/01/18/agile-architecture-myths-2-architecture-decisions-should-be-made-at-the-last-responsible-moment/>
- Mary Poppendieck, "Concurrent Development", 2003-08-01 — <https://www.leanessays.com/2003/08/concurrent-development.html>
