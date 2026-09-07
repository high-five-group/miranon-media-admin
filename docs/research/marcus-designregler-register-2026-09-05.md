---
owner: marcus803
updated: 2026-09-05
review_by: 2026-12-05
status: draft
---

# Regelregister — Marcus designpushbacks, sessionsdok och transkript slagna samman (2026-09-05)

> **Fråga.** Vilka konkreta designregler bär BÅDA bankerna tillsammans, hur
> starkt är varje regel belagd (citat och oberoende sessioner över båda
> källorna), och vilka regler är mätbara mekaniskt kontra kräver omdöme?
>
> **Proveniens.** Avgränsat research-pass, S122, kört oisolerat i
> huvudkatalogen (`main`, commit `40d60ff3`). Två källor:
> [`marcus-designpushbacks-bank-sessionsdok-2026-09-05.md`](marcus-designpushbacks-bank-sessionsdok-2026-09-05.md)
> (136 citat, ID `B-nnn`, 27 sessioner) och
> `marcus-designpushbacks-bank-transkript-2026-09-05.md` (182 meddelanden, ID
> `T-nnn`, 25 transkriptfiler). Ingen produktionskod ändrad, ingen commit
> gjord.
>
> **Proveniens-fynd under passets gång:** vid passets start fanns
> transkript-banken INTE på `main` — den låg i en öppen, ännu ej mergad PR
> (`docs/s122-bank-transkript`, PR `#2352`, gren-commit `ae55ce11`), och jag
> läste den med `git show docs/s122-bank-transkript:docs/research/marcus-designpushbacks-bank-transkript-2026-09-05.md`
> (en blob-läsning, inget grenbyte, i linje med "byt aldrig gren"). PR
> `#2352` mergades till `main` UNDER detta pass (`main` rörde sig från
> `40d60ff3` vid start till `38b92044` vid landning — samma `ADR-086`-mönster
> som redan noterats i sessiondok-banken). Verifierat: filen på `main` är
> byte-identisk med den gren-blob jag analyserade (`diff` mot `ae55ce11`,
> noll skillnad) — ingen del av analysen nedan påverkas. Länken i
> källförteckningen är alltså giltig vid leverans, men var det INTE när
> passet startade.

## Kort svar — domen i klartext

Båda bankerna konvergerar starkt på **fyra regler** som tillsammans bär
merparten av bevisstyrkan: **konsekvens mot en namngiven syskonyta** (R-01,
12 av 29 möjliga sessioner, 29 citat), **layout-stabilitet — inget hoppar,
växer eller krymper** (R-02, samma 12 sessioner, 23 citat), **fixtur och
prototyptext ska vara verklighetstrogen** (R-06, 11 sessioner) och
**återanvänd befintlig komponent/formspråk** (R-07, 10 sessioner). R-01 och
R-02 är i praktiken en dead heat på sessionsantal — skiljs bara på
citaträkning.

Den viktigaste enskilda kalibreringen: **R-05 "Prototypen ÄR facit"
(`ADR-102`) rankas SIST av alla tretton regler på sessionsantal (3), trots
att den är den ENDA regeln som redan är mekaniserad som beslut.** Session-
frekvens och konsekvens-allvar är två olika axlar — en regel kan vara sällan
citerad och ändå vara den viktigaste, eftersom den en gång blev så akut att
den blev ett ADR och aldrig behövde upprepas lika ofta därefter.

Mätbarheten delar sig ganska jämnt: **5 regler MEKANISKA**, **4
HALVMEKANISKA** (kräver en referenspunkt), **4 kräver OMDÖME**. Den regel
båda bankernas egna författare oberoende av varandra pekar ut som bästa
grind-kandidat är R-02 (layout-stabilitet) — transkript-banken skriver det
rakt ut: en Playwright-baserad "ingen elementstorlek förändras vid
tillståndsväxling"-grind.

## Vad jag hittade före sökningen — inventeringen

**Läste båda bankerna i sin helhet** (566 rader sessiondok-bank, 843 rader
transkript-bank, samtliga 13 kategoritabeller i vardera). Ingen tredje
befintlig fil sammanställer de två — sökning i `docs/research/` och
`docs/decisions/` gav ingen träff på "regelregister" eller "designregel"
utöver de två källbankerna själva.

**Styrande beslut som redan avgjort delar av frågan, lästa i sin helhet:**
`ADR-102` (prototypen är facit) och `ADR-103` (promoveringsformen) — båda
återges redan i sina egna banker (B-089/B-090 respektive T-001/T-002/T-005/
T-007/T-009/T-010) och blir här regel R-05. Ingen ADR förkastar eller
motsäger något av vad bankerna hittat; det finns alltså inget beslut att
riva, bara ett att bekräfta som redan mekaniserat.

**Åldersbedömning:** båda bankerna skrevs SAMMA dag som detta pass (S122,
2026-09-05) — inget hann bli inaktuellt. Risken är den motsatta: materialet
är för färskt för att ha hunnit prövas mot faktiskt agerande, så detta
register är nästa steg i en kedja, inte en omprövning av gammalt material.

**Vad som därför är nytt i detta pass:** ingen av de två bankerna
korsrefererar den andras enskilda ID:n. Ingen har räknat en verklig UNION av
oberoende sessioner över båda källorna (var och en räknar bara sin egen
korpus — sessiondok 27, transkript 11 DISTINKTA sessioner, se § Metod).
Ingen har avgjort per regel om den är mekanisk, halvmekanisk eller kräver
omdöme. Det är de tre sakerna denna fil levererar.

## Metod

**Sessionskarta för transkript-banken.** Transkript-bankens "25 transkript"
är 25 FILER, inte 25 sessioner — Claude Code startar en ny JSONL-fil vid
varje resume. Jag härledde en fil→session-karta direkt ur bankens egen
Filkarta-tabell och räknade om: de 25 filerna täcker bara **11 distinkta
sessioner** (S93, S102, S103, S104, S107, S108, S109, S110, S111, S113,
S114) — S102 och S113 sprids över fyra filer vardera, S93 och S103 över tre
vardera. Detta är inte ett fel i transkript-banken (dess egen prosa säger
det rakt ut: "Flera filer kan dela samma sessionsnummer"), men det är lätt
att missa om man bara läser "25" i förbifarten, och det påverkar direkt hur
"oberoende sessioner" ska räknas i detta register.

**Universum.** Sessiondok-bankens 27 sessioner ∪ transkript-bankens 11
sessioner ger **29 distinkta sessioner totalt** i den kombinerade korpusen
(9 sessioner finns i båda bankerna: S93, S103, S104, S107, S108, S109, S110,
S111, S113; transkript-banken tillför S102 och S114 som sessiondok-banken
inte har några citat från). Varje regels "oberoende sessioner"-tal nedan är
räknat mot detta universum på 29, aldrig mot en banks egen delmängd.

**Klassificering till regler.** Jag har läst varenda rad i alla 13
kategoritabeller i båda bankerna (ingen skumläsning). Varje B-/T-ID har
tilldelats EN primär regel för att undvika dubbelräkning — flera citat är
flerbottnade (t.ex. B-001 och T-027 nämner sex-sju defektklasser i en enda
mening) och min tilldelning valde den mest framträdande, konkreta axeln.
Där ett citat rimligen kunde höra till en annan regel noterar jag det som
korsreferens i löptexten utan att räkna det två gånger i tabellerna. Detta
ÄR mitt omdöme, byggt ovanpå de två bankernas egen (också omdömesbaserade)
13-klassindelning — en annan bedömare skulle kunna dra några gränser
annorlunda, särskilt inom "konsekvens"-familjen (R-01/R-02/R-03), som
överlappar mest.

**Cross-bank-dubbletter.** Några citat är uppenbart SAMMA yttrande, fångat
oberoende av de två extraktionsmetoderna i samma session (t.ex. B-101/T-145
i S113, B-041/T-143 i S113, B-050/T-083 och B-054/T-140 i S107/S113). Dessa
räknas som EN session i unionen, inte två — men de är ett starkt kvalitets-
kvitto: två olika extraktionspass, olika modeller (Opus för sessiondok,
Sonnet för transkript), fann oberoende av varandra nästan ordagrant samma
formulering.

## Sammanslagningsbeslut — en regel eller flera?

Är "låst korthöjd", "inget får hoppa" och "knappar växer i laddläge" en
regel eller flera?

**Svar: EN regel (R-02, layout-stabilitet).** Tre skäl:

1. **Marcus namnger det själv som EN regel, två gånger, ordagrant likadant.**
   B-094 och B-095 citerar SAMMA mening — "hopp i layouten är absolut
   förbjudet i denna app" — i två olika sessioner (S107, S109), båda
   uttryckligen kopplade till `ADR-078` beslut 4. En regel som Marcus
   upprepar ordagrant som en enda formulering i två separata sessioner är
   per definition en regel, inte flera.
2. **Den mekaniska prövningen är identisk oavsett vad som triggar den.**
   Oavsett om triggern är "innehållet är längre denna gång" (kortgeometri:
   B-009, T-099, T-179), "elementet bytte tillstånd" (knappar i laddläge:
   B-023, T-176) eller "en dialog öppnades" (B-093, T-104) är testet
   detsamma: mät `boundingClientRect` (eller motsvarande) före och efter
   triggern, kräv att deltan är noll. Att splitta upp i tre regler hade
   krävt tre separata granskningssteg för samma mätning.
3. **Transkript-bankens egen rekommendation drar samma slutsats oberoende.**
   Dess § Rekommendation grupperar uttryckligen "regel 1, 2, 3, 6 och 10"
   (höjd, komponent-identitet, sidkrom, layout-hopp, laddtillstånd) som
   "alla varianter av SAMMA underliggande krav (layout-stabilitet)" och
   föreslår EN Playwright-grind för alla.

**Var jag DRAR gränsen annorlunda än transkript-bankens egen gruppering:**
jag har INTE slagit ihop "komponent-identitet" (mina R-04) eller
"sidkrom-identitet" (R-03) in i R-02, trots att transkript-banken gjorde
det. Skälet: R-02 testar att ETT element inte ändrar sig över tid/tillstånd
(en egenskap hos elementet självt), medan R-03/R-04 testar att TVÅ element
matchar VARANDRA (en referensjämförelse). Det förra kräver bara
före/efter-mätning på en instans; det senare kräver en namngiven
referenspunkt att jämföra mot. Mekaniskt är det två olika testformer, och en
granskningschecklista blir tydligare av att hålla isär "ändrar sig inte" och
"matchar sin referens" som separata bockrutor.

## Regelregistret

Rangordnat efter antal oberoende sessioner (av 29 möjliga), i andra hand
antal citat totalt. **R-05 är ett medvetet undantag att läsa mot** — se
§ Kort svar för varför lågt sessionsantal inte betyder lågt allvar.

| R-ID | Regel (imperativ) | Klass(er) | Citat totalt | Citat (B / T) | Oberoende sessioner | Mätbarhet |
|---|---|---|---|---|---|---|
| R-01 | Kopiera den befintliga vy du pekar ut som förebild — klass för klass, inte fritt efter minnet | konsekvens-syskonvy | 29 | 16 / 13 | **12** | HALVMEKANISK |
| R-02 | Låt ingenting hoppa, växa eller krympa när innehåll eller tillstånd ändras — reservera platsen i förväg | kortgeometri, knappar, beteende-interaktion, laddkänsla | 23 | 10 / 13 | **12** | MEKANISK |
| R-06 | Fyll testdata med riktiga namn, orter och lägen — ta bort all kvarvarande platshållartext | fixtur-prototyptext | 14 | 10 / 4 | **11** | MEKANISK |
| R-07 | Återanvänd en komponent eller ett mönster som redan finns i appen — bygg nytt bara med uttrycklig avsikt | komponent-återbruk | 14 | 7 / 7 | **10** | OMDÖME |
| R-12 | Hämta färger och konturer från de befintliga design-tokens — samma ton för samma betydelse, i hela appen | färg-token | 23 | 8 / 15 | **8** | HALVMEKANISK |
| R-13 | Gör tydlig skillnad mellan rubrik och innehåll — inget viktigt får klippas av eller smälta ihop | typografi-hierarki | 11 | 8 / 3 | **8** | OMDÖME |
| R-11 | Låt allt kännas omedelbart — ingen väntan per tangenttryckning, inget synligt skelett, inget som blinkar till | laddkänsla | 10 | 6 / 4 | **7** | HALVMEKANISK |
| R-04 | Knappar och element med samma roll ska se identiska ut och sitta enligt husets vanliga mönster | knappar | 20 | 9 / 11 | **6** | MEKANISK |
| R-08 | Ta bort text och hjälptext som bara upprepar det ytan redan visar | copy-hjälptext | 11 | 6 / 5 | **6** | OMDÖME |
| R-09 | Använd exakt de ord och skrivregler som är bestämda — aldrig en egen variant | copy-hjälptext | 6 | 4 / 2 | **5** | MEKANISK |
| R-10 | Titta själv på den körda, renderade ytan innan du rapporterar eller visar upp den — anta att första försöket är dåligt tills motsatsen är bevisad | process | 12 | 5 / 7 | **5** | OMDÖME |
| R-03 | Använd exakt samma sidram (bakåtchevron, rubrikplacering, kolumnbredd) på varje sida, från första utkastet | sidkrom-bredd | 8 | 3 / 5 | **3** | MEKANISK |
| R-05 | Prototypen är facit — det skarpa bygget ska bli EXAKT identiskt, och prototypen raderas inte förrän Marcus godkänt matchningen | konsekvens-syskonvy, knappar | 9 | 3 / 6 | **3**⚠️ | MEKANISK (redan `ADR-102`) |

⚠️ Se § Kort svar — lågt sessionsantal, högsta allvarsgrad.

## Spårbarhet och starkaste citat per regel

### R-01 — Kopiera den namngivna syskonytan

**B-ID:n:** B-005, B-012, B-077, B-078, B-079, B-080, B-081, B-082, B-083,
B-084, B-085, B-086, B-087, B-088, B-091, B-092.
**T-ID:n:** T-015, T-016, T-043, T-053, T-074, T-078, T-102, T-113, T-126,
T-130, T-137, T-144, T-146.
**Sessioner (12 st):** S64, S100, S102, S103, S104, S107, S108, S110, S111,
S113, S117, S121.

**Starkaste citat:** *"Lotta måste känna igen sig."* (B-077, S121,
`tasks/sessions/2026-09-04-session-121.md:533`) — hela regelns motivering i
fyra ord, från Marcus själv.

Halvmekanisk eftersom prövningen kräver att någon FÖRST namnger
referensytan (fältet transkript-bankens rekommendation efterlyser); när den
är namngiven är jämförelsen (rubrikposition, layoutklasser, komponentval)
görbar av en granskare utan gissning.

### R-02 — Layout-stabilitet

**B-ID:n:** B-001, B-009, B-010, B-016, B-023, B-093, B-094, B-095, B-104,
B-110.
**T-ID:n:** T-027, T-031, T-034, T-036, T-090, T-099, T-103, T-104, T-119,
T-138, T-175, T-176, T-179.
**Sessioner (12 st):** S62, S96, S102, S103, S107, S108, S109, S111, S113,
S114, S121, S122.

**Starkaste citat:** *"INGET får hoppa i denna app under några
omständigheter."* (B-093, S96,
`tasks/sessions/archive/2026-08/2026-08-02-session-96.md:792`). Näst
starkast, ordagrant upprepad i två sessioner: *"hopp i layouten är absolut
förbjudet i denna app"* (B-094/B-095, S107/S109).

Mekanisk: mät boundingbox/dimension på ett element före och efter en
trigger (innehåll ändras, tillstånd växlar, dialog öppnas), kräv delta≈0.
Ingen referenspunkt behövs — testet är själv-relativt.

### R-06 — Fixtur och prototyptext verklighetstrogen

**B-ID:n:** B-058, B-059, B-061, B-062, B-063, B-064, B-065, B-066, B-067,
B-068.
**T-ID:n:** T-035, T-042, T-052, T-073.
**Sessioner:** S55, S93, S96, S100, S102, S103, S104, S113, S117, S121,
S122 (11 st).

**Starkaste citat:** *"Prototyp. Inget sparas, inget skickas"*-texten kvar
på FYRA olika sidor samtidigt, *"TA BORT!!"* upprepat tre gånger i samma
meddelande (T-073, `e9b60a0a`, S104, 2026-08-17 09:32:17Z). Mekaniskt
enklast av alla regler: `grep` efter kända platshållarsträngar
("Prototyp. Inget sparas", "Ej tillgänglig" i produktionssyftande vyer,
etc.) i renderad HTML.

### R-07 — Återanvänd komponent/formspråk (med motvikt B-075, se § Motvikter)

**B-ID:n:** B-069, B-070, B-071, B-072, B-073, B-074, B-076.
**T-ID:n:** T-061, T-068, T-100, T-127, T-139, T-171, T-178.
**Sessioner:** S83, S100, S103, S104, S107, S108, S111, S113, S114, S121
(10 st).

**Starkaste citat:** *"just nu i prototypen så listas alla deltagare på
rader, det är big NO NO, Lotta måste känna igen sig!! Personerna ska listas
på sina personkort EXAKT som dem gör på eventdetaljer"* (B-071, S100,
`tasks/sessions/archive/2026-08/2026-08-07-session-100.md:274`).

Kräver omdöme: att avgöra OM ett mönster redan finns i appen, och om det är
tillräckligt likt för att räknas som "samma", är inte grep-bart.

### R-12 — Färg/kontur/ton från tokens

**B-ID:n:** B-041, B-042, B-043, B-044, B-045, B-046, B-047, B-057.
**T-ID:n:** T-017, T-018, T-028, T-067, T-106, T-107, T-143, T-152, T-154,
T-155, T-157, T-164, T-166, T-168, T-170.
**Sessioner:** S67, S92, S103, S104, S107, S108, S109, S113 (8 st).

**Starkaste citat:** *"Ta bort hover på korten. Reservera plats för
scrollbaren … Scrollbaren ska va den ljusgråa som vi använder i appen …
Skuggningen ska ju bara synas på vita kortet."* (B-041, S113,
`tasks/sessions/2026-08-29-session-113.md:799`) — nästan ordagrant
bekräftat oberoende av T-143 (samma session, transkript-extraherat).

Halvmekanisk: att INGEN hårdkodad hex-färg förekommer är redan mekaniserad
(CLAUDE.md § Design-system, "Inga hårdkodade färger i komponenter"); att
RÄTT semantiska token valts för rätt roll kräver omdöme.

### R-13 — Typografisk hierarki särskiljd

**B-ID:n:** B-032, B-033, B-034, B-035, B-037, B-038, B-039, B-040.
**T-ID:n:** T-069, T-105, T-150.
**Sessioner:** S55, S83, S86, S103, S104, S108, S113, S121 (8 st).

**Starkaste citat:** *"Truncate med '…' räcker INTE ... annars faller hela
konceptet med Eventnamnet som rubrik."* (B-032, S86,
`tasks/sessions/archive/2026-07/2026-07-25-session-86.md:203`).

### R-11 — Allt ska kännas instant

**B-ID:n:** B-096, B-097, B-098, B-109, B-112, B-113.
**T-ID:n:** T-043, T-074, T-076, T-079.
**Sessioner:** S73, S83, S86, S102, S108, S109, S113 (7 st).

**Starkaste citat:** *"ALLT i denna app ska vara instant, det ska vara en
regel också"* (B-096, S83,
`tasks/sessions/archive/2026-07/2026-07-24-session-83.md:349`) —
INSTANT-kravets födelse, Marcus namnger det själv som en regel i samma
andetag han formulerar den.

Halvmekanisk: svarstid går att mäta (nätverksanrop, tid till render), men
"instant" behöver ett referensvärde (t.ex. <100 ms upplevd fördröjning) för
att bli en grind snarare än ett ögonmått.

### R-04 — Knappar/komponenter pixel-identiska + knapp-grammatik

**B-ID:n:** B-022, B-024, B-025, B-026, B-027, B-028, B-029, B-030, B-031.
**T-ID:n:** T-064, T-065, T-066, T-085, T-093, T-137, T-146, T-159, T-160,
T-161, T-163.
**Sessioner:** S73, S104, S107, S108, S113, S121 (6 st).

**Starkaste citat, dubbelt bekräftat oberoende:** *"alla fyra knappar måste
se likadana ut"* (B-022, S107) och *"alla fyra knappar måste se likadana
ut och sitta i rad"* (T-085, samma session S107, transkript-extraherat) —
nästan ordagrant, oberoende funna av två olika extraktionspass.

### R-08 — Ta bort värdelös hjälptext

**B-ID:n:** B-036, B-048, B-049, B-053, B-055, B-056.
**T-ID:n:** T-039, T-059, T-082, T-149, T-158.
**Sessioner:** S102, S104, S107, S108, S113, S121 (6 st).

**Starkaste citat:** *"Fyll i de 3 som saknas är extremt överflödig."*
(B-048, S108, `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:931`).

### R-09 — Terminologi och skrivregler exakt

**B-ID:n:** B-050, B-051, B-052, B-054.
**T-ID:n:** T-083, T-140.
**Sessioner:** S100, S105, S107, S108, S113 (5 st).

**Starkaste citat:** *"ALLA 15 långa bindestreck i användarsynlig text
MÅSTE bort"* (B-052, S105,
`tasks/sessions/archive/2026-08/2026-08-11-session-105.md:518`) — kvantifierat,
mekaniskt grep-bart (sök `—`/`–` i användarsynliga strängar).

### R-10 — Självgranska den renderade ytan innan rapport

**B-ID:n:** B-101, B-115, B-116, B-121, B-125.
**T-ID:n:** T-023, T-041, T-050, T-098, T-121, T-145, T-148.
**Sessioner:** S102, S103, S108, S111, S113 (5 st).

**Starkaste citat, dubbelt bekräftat oberoende (samma session S113):**
*"det är fortfarande problem med hovringen … Hur tusan kunde du släppa
igenom det? Kolla SJÄLV nu i prod."* (B-101,
`tasks/sessions/2026-08-29-session-113.md:870`), nästan ordagrant matchat av
T-145: *"Hur tusan kunde du släppa igenom det? Kolla SJÄLV nu i prod."*

### R-03 — Sidkrom identiskt på varje sida

**B-ID:n:** B-002, B-003, B-008.
**T-ID:n:** T-124, T-125, T-133, T-134, T-135.
**Sessioner:** S111, S121 (2 st — se nedan; T-042 flyttades till R-06
eftersom dess kärninnehåll är kvarvarande prototyptext, inte chevron, vilket
sänker denna regels sessionsantal från vad en grövre klassning skulle ge).

**Starkaste citat:** *"Tanken med sidkromet som komponent var ju att alla
'undersidor' skulle se likadana ut i 'grunden'."* (T-135, S111, `112a333c`,
2026-08-23 17:52:19Z) — nästan ordagrant B-003 (samma session, sessiondok-
extraherat): *"Tanken med sidkromet som komponent var ju att alla
'undersidor' skulle se likadana ut i 'grunden'."*

Denna regel har lägst sessionsantal av de "mekaniska" trots att den känns
central — förklaringen är att mycket av dess bevis (T-027, T-042, T-113,
T-119) delar innehåll med R-01/R-02/R-06 och tilldelades dit i stället för
att undvika dubbelräkning (se § Sammanslagningsbeslut). Läs alltså R-03:s
tal tillsammans med R-01:s, inte isolerat.

### R-05 — Prototypen ÄR facit (`ADR-102`)

**B-ID:n:** B-060, B-089, B-090.
**T-ID:n:** T-001, T-002, T-005, T-007, T-009, T-010.
**Sessioner:** S55, S93, S121 (3 st — alla sex T-citat kommer från EN och
samma session, S93, vilket är väntat: detta är grundhändelsen som blev ett
ADR och som därför sällan behövde upprepas lika ofta som de andra reglerna).

**Starkaste citat:** *"Prototypen ÄR facit... Prototypen och skarpa version
ska vara IDENTISKA det är ju för tusan hela poängen med att bygga en
prototyp."* (T-007, S93, `c91a05a2`, 2026-08-07 18:12:03Z) — grundcitatet
bakom `ADR-102`, oberoende återfunnet av sessiondok-banken som B-089/B-090.

## Motvikter Marcus själv formulerat

Fyra motvikter, var och en balanserar en specifik regel ovan — utan dem blir
registret hårdare än Marcus faktiskt avsett:

1. **B-075 (S108) balanserar R-07 (återanvänd komponent).** *"Vi får inte
   låsa oss vid befintligt formspråk, OM vi behöver etablera något nytt …
   så gör vi det."* En checklista som bara kräver "återanvänd" utan denna
   rad skapar nästa klagomålsklass i stället för att stänga den nuvarande —
   sessiondok-bankens egen slutsats, och jag delar den.
2. **T-115 (S110, `1cda1aa7`, 2026-08-22 11:24:48Z) balanserar R-01/R-05
   (konsekvens/facit).** *"Det stämmer exakt. Eller egentligen är det en
   avvikelse men den är medveten, tror även den ska vara dokumenterad. Den
   är också önskad."* En MEDVETEN, DOKUMENTERAD avvikelse från
   syskonytan/facit är alltså tillåten — konsekvenskravet gäller
   oavsiktliga avvikelser, inte varje avvikelse.
3. **T-031 (S102, `9b9d8dbf`, 2026-08-15 21:29:16Z) nyanserar R-07/R-01.**
   *"jag vill INTE kopiera över de grejerna rakt av"* — när Marcus jämför
   tre varianter och gillar drag från flera, avvisar han uttryckligen att
   kopiera in dem rakt av i vinnaren. Återbruk ska alltså vara ett medvetet
   VAL, inte en mekanisk sammanslagning av allt som fanns i tidigare försök.
4. **T-150 (S113, `aad9eb70`, 2026-09-01 07:46:46Z) balanserar R-11
   (instant).** *"Sedan behöver väl inte texten var 'instant' utan kanske 1
   sekunds fördröjning?"* — INSTANT-kravet (B-096) är alltså inte
   undantagslöst; för viss återkoppling föredrar Marcus själv en kort,
   medveten fördröjning framför omedelbarhet.

## Citat som INTE täcks av någon regel

### Sessiondok-banken — 40 av 136 B-ID:n

Exakt lista, grupperad efter tema:

- **Rena domar utan enskild formaxel ("annat"-klassen, per bankens egen
  definition):** B-126–B-136 (11 st) — t.ex. B-133 *"För första gången i
  detta projekt är jag imponerad"*, B-136 *"72 iterationer"*. Dessa
  kalibrerar TON, inte en handling.
- **Arbetsform/process, inte designaxel:** B-114, B-117, B-118, B-119,
  B-120, B-122, B-123, B-124 (8 st) — delegeringsordrar, grillningsfrågor,
  "kolla ens du på hur det ser ut"-metaklagan som redan täcks narrativt i
  Kort svar men inte gav en egen imperativ regel.
- **Funktionella buggar, inte visuell design:** B-102 (avmarkering lämnar
  tomt mellantillstånd), B-105 ("Det är INGEN skillnad"), B-106 (gammal
  artefakt kvar efter deploy), B-107 (ospecificerat gap, `L269`-klassen),
  B-108 (bedrövligt resizer-grepp), B-111 (positiv bekräftelse, ingen
  åtgärd).
- **En-gångs visuella pixeldetaljer, för smala för en generell regel:**
  B-004 (sidram-val kräver bild), B-006 (mobil/desktop-fråga), B-007
  (prototyp-växlarens egen kromform), B-011 (dialogstorlek), B-013 (tom yta
  under fält, senare upphävd), B-014, B-015 (skuggradie/rundning-mismatch),
  B-017, B-018, B-019 (beloppsknappens iterationer), B-020 (kortform för
  personlista, källan själv osäker på attribution), **B-021 ("M:et ser lite
  höger-förskjutet ut", optisk centrering — värt att notera att T-092/T-095
  bekräftar EXAKT samma pixelfynd i samma session S107, men det är för
  smalt/en-gångs för att bli en egen regel).**
- **Statusfrågor, ej pushback:** B-099, B-100 (dokumentsidan skitdålig —
  redan täckt narrativt via R-10:s "titta själv"-tema men för generellt för
  att räknas dit), B-103.

### Transkript-banken — cirka 87 av 182 T-ID:n

Given skalan (182 meddelanden) listar jag INTE alla 87 individuellt — det
vore en ID-vägg utan nytt informationsvärde. Den dominerande orsaken är
identisk med sessiondok-bankens egen filtrering: **"process"-klassen (60
meddelanden) är till över hälften `<bash-input>`-loggade
`facit:godkann`-kommandon, sessionsplanering, statusfrågor och
delegeringsordrar** (T-003, T-012–T-014, T-020–T-022, T-025, T-026, T-029,
T-032, T-033, T-037, T-040, T-044, T-047, T-051, T-054, T-070–T-072,
T-075, T-077, T-080, T-081, T-091, T-097, T-108–T-112, T-114, T-116–T-118,
T-122, T-123, T-131, T-132, T-136, T-141, T-142, T-147, T-151, T-156,
T-162, T-165, T-167, T-169, T-172–T-174, T-177, T-180–T-182) samt hela
**"annat"-klassen (22 meddelanden)** som per bankens egen definition är
domar/godkännanden utan enskild formaxel (T-011, T-037, T-054, T-055,
T-060, T-063, T-071, T-077, T-088, T-091, T-093–T-096, T-112, T-115, T-123,
T-142, T-151, T-173, T-174 — de sistnämnda två om DATAkvalitet, inte
UI-design, uttryckligen flaggat som sådant redan i källan).

**Notabla enskilda undantag jag valde bort trots designnärhet** (var och en
för smal eller för unik för en egen regel): T-004/T-057 (tempo-frustration
över byggfasens hastighet), T-030 (staging-data trasig, blockerar
granskning), T-058/T-081 (förvirring om NÄR facit-stämpling faktiskt sker —
processmekanik, inte formregel), T-092 (samma optiska M-centrering som
B-021 ovan, plus en separat "appen behöver uppdateras"-banner-kritik),
T-102 (alla dialoger ska hålla samma nivå — nära R-01/R-04 men för vagt för
att särskilja), T-108 (ber om tydligare beslutsfrågor), T-120/T-121 (variant
oförändrad sedan förra rundan — processfeedback, ej en formregel), T-147/
T-148 (ifrågasätter om Codes eget "redo för Marcus ögon"-omdöme
verkligen höll — nära R-10 men riktat mot omdömets TILLFÖRLITLIGHET snarare
än mot en specifik yta), T-156 (funktionsbugg, kan ej ta bort en rad),
T-169 (enskild rubrik-copy).

## Dom

Registret bekräftar att de två bankernas oberoende metoder (Opus mot
destillerade sessionsdok, Sonnet mot rå JSONL) landar i samma kärna: **två
regler — konsekvens mot namngiven syskonyta (R-01) och layout-stabilitet
(R-02) — bär hälften av all sessionsbelagd tyngd i registret (12 av 29
sessioner vardera)**, och flera av de starkaste enskilda citaten är
oberoende, nära ordagrant bekräftade i BÅDA bankerna från samma session
(R-04, R-10, R-12, R-03). Det är starkare belägg än vad någon av bankerna
ensam kunde ge.

Den regel som redan är kodifierad som beslut (R-05, `ADR-102`) är INTE den
mest citerade — ett bra påminnelse om att detta registrets ranking mäter
FREKVENS av pushback, inte VIKT av konsekvens. En regel som en gång blev så
akut att den blev ett ADR behöver inte upprepas lika ofta som en regel som
återkommer varje session för att den saknar mekanisk grind.

## Vad jag inte kunde belägga

- **Att min bucketing av gränsfall (särskilt inom R-01/R-02/R-03) är den
  enda rimliga.** Flera citat är flerbottnade och tilldelningen till EN
  primär regel är mitt omdöme; en annan granskare kunde rimligen flytta
  enstaka ID:n mellan dessa tre.
- **Att sessionsantalet mäter vad det ser ut att mäta.** Som med båda
  källbankernas egna reservationer: frekvens i en destillation (sessiondok)
  eller i ett designordsfilter (transkript) mäter vad som BEVARADES/
  MATCHADE mönstret, inte nödvändigtvis vad Marcus sa oftast i absoluta tal.
- **Fullständigheten i "otäckta citat"-listan för transkript-banken.** Jag
  har läst alla 182 meddelanden men presenterar inte alla ~87 otäckta
  individuellt (se motivering i det avsnittet) — en läsare som vill ha den
  fullständiga listan får gå till källbankens egna tabeller.
- **Att någon av de tretton reglerna faktiskt minskar defekterna om den
  laddas i en prompt eller grind.** Ingen mätning finns ännu — reglerna är
  härledda ur klagomål, inte prövade mot utfall. Samma reservation som
  sessiondok-bankens egen.
- **Redan löst under passet, inte kvarstående:** PR `#2352` mergades
  oförändrad (`diff` mot `ae55ce11` visar noll skillnad) — vad som stod som
  en öppen risk vid inventeringen behövde inte längre bäras vidare.

## Rekommendation — Vad som blir tre listor

**Detta är ett förslag till Marcus grillning, inte ett beslut.** Sortering
av registrets tretton regler i de tre kategorierna sessiondok-banken
efterlyste (mätbara → granskarens checklista, omdöme → byggarens prompt),
plus en tredje kategori jag lägger till: regler mogna nog för en automatisk
grind som fäller en PR.

**1) Till granskarens checklista** (mätbara mot en referens, men kräver
ett mänskligt öga eller ett halvautomatiskt verktyg — inte säkra nog för en
blockerande grind ännu):

- R-01 Konsekvens mot namngiven syskonyta
- R-03 Sidkrom identiskt
- R-04 Knappar/komponenter pixel-identiska
- R-11 Allt instant
- R-12 Färg/token konsekvent

**2) Till byggarens prompt** (kräver omdöme, formar vad som produceras
FRÅN BÖRJAN snarare än att kontrolleras efteråt):

- R-07 Återanvänd komponent/formspråk (med B-075 som motvikt bredvid)
- R-08 Ta bort värdelös hjälptext
- R-10 Självgranska renderad yta innan rapport
- R-13 Typografisk hierarki särskiljd

**3) Kandidater för en automatisk grind som FÄLLER en PR** (redan
tillräckligt mekaniska för att köras utan mänskligt öga, enligt både min
och transkript-bankens egen bedömning):

- **R-02 Layout-stabilitet** — Playwright-baserad boundingbox-diff;
  transkript-bankens egen rekommendation.
- **R-06 Fixtur/prototyptext verklighetstrogen** — `grep` efter kända
  platshållarsträngar i renderad HTML.
- **R-09 Terminologi/skrivregler** — `grep` mot en bannlista (långa
  bindestreck, förbjudna ord), samma mekanism som `ORDLISTA.md`-disciplinen
  redan etablerat på annat håll i repot.
- **R-05 Prototypen är facit** — redan mekaniserad (`ADR-102`,
  `facit:godkann` + visuell diff); listas här för fullständighetens skull,
  inte som ett nytt förslag.

Denna tredelning är MIN sortering, inte Marcus kvitterade regelverk — precis
som sessiondok-bankens egen "detta är en rekommendation, inte ett beslut."

## Källförteckning

- [`marcus-designpushbacks-bank-sessionsdok-2026-09-05.md`](marcus-designpushbacks-bank-sessionsdok-2026-09-05.md)
  — 136 citat, `B-001`–`B-136`, 27 sessioner. På `main`.
- [`marcus-designpushbacks-bank-transkript-2026-09-05.md`](marcus-designpushbacks-bank-transkript-2026-09-05.md)
  — 182 meddelanden, `T-001`–`T-182`, 25 filer / 11 distinkta sessioner. Låg
  vid passets START endast i öppen PR `#2352` (gren-commit `ae55ce11`), läst
  via `git show` utan grenbyte; PR:n mergades till `main` under passets
  gång (se § Proveniens ovan) — länken är giltig vid leverans.
- [`ADR-102` — prototypen är facit, skarpa ska vara identisk](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
  — grundbeslutet bakom R-05.
- [`ADR-103` — promoveringsformen](../decisions/ADR-103-promoveringsformen-prototypen-promoveras-skarpa-bygget-avskaffas.md)
  — refererad av båda bankerna, rör inte reglernas sakinnehåll direkt.
- **Externa källor:** inga. Detta pass är en syntes av två interna
  förstahandskällor; inget branschprecedent har hämtats och inget sådant
  påstås.
