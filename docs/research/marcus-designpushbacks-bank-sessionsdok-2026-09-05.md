---
owner: marcus803
updated: 2026-09-05
review_by: 2026-12-05
status: draft
---

# Marcus designinstruktioner och pushbacks — verbatim-bank ur sessionsdoken (Code, 2026-09-05)

> **Fråga.** Vilka designinstruktioner och pushbacks har Marcus gett verbatim
> under prototyp- och konvergensarbete, och vilka regelklasser återkommer
> oftast? Banken ska kunna destilleras till regler som laddas i byggarens
> prompt och granskarens checklista.
>
> **Proveniens.** Avgränsat research-pass S122, kört oisolerat i
> huvudkatalogen. Korpusen lästes vid `main` `6a148263`; `main` rörde sig
> till `888c13dc` under passets gång (`ADR-086`-notering). Diffen rör två
> filer i korpusen — `tasks/sessions/2026-09-05-session-122.md` (+185 rader)
> och `2026-09-04-session-120.md` (+155) — båda tillägg EFTER de rader
> banken citerar; samtliga radnummer omverifierades mot `888c13dc` efter
> rörelsen. Källa: samtliga 150 sessionsdok under `tasks/sessions/` och
> `tasks/sessions/archive/`. Ingen produktionskod och inga andra filer är
> rörda av detta pass.
>
> **Status: BANK, inte beslut.** Tabellerna är råmaterial med
> källmärkning. Frekvensavsnittets tio imperativ är en DESTILLATION jag
> gjort — de är mitt förslag till regelform, inte ett Marcus-kvitterat
> regelverk.

## Kort svar — domen i klartext

**136 verbatim-citat** ur **27 sessioner** faller ut som instruktion,
pushback eller dom om UI-form. Tre klasser dominerar och står tillsammans
för en dryg tredjedel av banken: **konsekvens mot syskonvy** (16),
**beteende-interaktion** (16) och **kortgeometri** (13). Klassen
**fixtur-prototyptext** (11) är den som bär de hårdaste orden, och den är
också den enda vars citat är i stort sett ORDAGRANT desamma över
två månader — från S55 (2026-07-06, *"mycket som är fel och dåligt"*)
till S122 (2026-09-05, *"alltid blir väldigt dåliga och slarvigt byggda"*).

Den avgörande delfrågan visade sig inte vara "vad klagar Marcus på" utan
**"vilken av klagomålstyperna är återkommande snarare än engångs"**. Svaret
är entydigt: klagomålen på ENSKILD smak (en färgnyans, en radie) är nästan
alltid engångsföreteelser, medan klagomålen på **avvikelse från en yta som
redan finns i appen** återkommer i session efter session. Elva av bankens
sexton `konsekvens-syskonvy`-citat namnger en KONKRET annan vy som facit
(*"exakt som på betalnings-sidan"*, *"EXAKT som dem gör på eventdetaljer"*,
*"kopiera exakt var rubriken sitter"*). Det gör klassen mekaniserbar på ett
sätt som smakklasserna inte är: en granskare kan öppna den namngivna
syskonvyn och jämföra.

Näst tyngst, och nästan lika mekaniserbar: **rörelse**. Två citat är
formulerade som absoluta appregler av Marcus själv — *"INGET får hoppa i
denna app under några omständigheter"* (S96) och *"ALLT i denna app ska
vara instant, det ska vara en regel också"* (S83) — och båda har därefter
brutits av prototyper flera gånger.

## Vad jag hittade före första sökningen — inventeringen

Detta pass är passets första handling per research-kontraktet.

**Befintliga research-pass som överlappar, lästa:**

- [`prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md`](prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md)
  § *Marcus egna ord — smärtpunkterna* (rad 858–962) bär **13 verbatim-citat**
  ur S93:s transkript, kronologiskt och mappade mot rotorsaker. **Detta är
  den enda befintliga citat-banken i repot.** Den skiljer sig från min på tre
  sätt: (i) den täcker EN session, (ii) den är hämtad ur transkript, inte
  sessionsdok, (iii) den är PROCESS-orienterad (rotorsaks-mappning), inte
  form-orienterad. Åtta av dess tretton citat är process eller kontext, inte
  UI-form. Två av dess citat är så centrala för UI-form att jag tagit in dem
  här med den filen som källa (B-063, B-100) — resten dubbleras inte.
- [`ui-prototyp-till-produktion-frontier-processer-2026-08-08.md`](ui-prototyp-till-produktion-frontier-processer-2026-08-08.md)
  — branschprecedent för spec-bärare och visuella AC. Ingen citat-bank.
  Åldrat i sin verktygsdel (v0, Chromatic, Figma Dev Mode rör sig snabbt),
  men dess mönster-slutsatser rör inte min fråga.
- [`eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md)
  — blockvis avvikelsekarta prototyp mot skarp. Inga Marcus-citat.
- [`first-principles-dekonstruktion-prototyp-till-skarp-2026-08-08.md`](first-principles-dekonstruktion-prototyp-till-skarp-2026-08-08.md)
  — antagande-obduktion av tvåartefakts-modellen. Inga citat.

**Styrande beslut som redan avgjort delar av frågan, lästa i sin helhet:**

- [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
  — prototypen ÄR facit, skarpa ska vara identisk. Nio rotorsaker R1–R9.
- [`ADR-103`](../decisions/ADR-103-promoveringsformen-prototypen-promoveras-skarpa-bygget-avskaffas.md)
  — promoveringsformen; den godkända formen promoveras, bygget avskaffas.
- [`ADR-074`](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md)
  — prototyp-substratets adress och växlar.

**Lärdomar som redan bär delar av svaret:** `L220` (korrekthets-grindar
fångar inte presentationsskuld), `L237` (helhets-missnöje öppnar
konvergens-pass), `L247` (beteende-krav ÄR prototyp-materia), `L269`
(mänsklig grind fångar OSPECAT designutrymme), `L310` (UI som Marcus
konsumerar bär design-review-grind), `L592` (defekt byte-identisk med
facit är facit-nivå-defekt). Trådarna `T65`, `T66`, `T90`, `T143`.

**Vad som därför är NYTT i detta pass:** ingen befintlig artefakt har
samlat Marcus form-citat TVÄRS ÖVER sessioner, och ingen har klassat dem.
`T143` efterfrågar uttryckligen en konkretiserad grund-checklista och
konstaterar att den saknas. Banken nedan är underlaget för den.

**Vad som var ÅLDRAT och därför omprövades riktat:** `T143`-radens hypotes
att fyra av sju konvergenspunkter 2026-08-14 var "grund-avvikelser" är
äldre än S117, S121 och S122. Mätningen håller: andelen grund-avvikelser
har inte sjunkit — S121:s divergens-pass (2026-09-04) fällde *samtliga tre*
varianter på exakt den grunden, tre veckor efter tråden mintades.

## Metod

**Filurval.** `tasks/sessions/*.md` (19 filer) plus
`tasks/sessions/archive/*/*.md` (131 filer) = **150 dok**. Bilagekataloger
(`tasks/sessions/bilagor/`, `tasks/sessions/archive/bilagor/`) ingår INTE —
de bär skärmdumpar och facit-manifest, inte prosa med citat.

**Extraktion, två mönster.** Husets citatform är kursiv med citattecken,
ofta radbruten över tre till fem rader:

```text
mönster 1:  \*"(.{3,2500}?)"\*        DOTALL, över radbrytningar
mönster 2:  "([^"\n]{6,600})"          på rader inom 4 rader från "Marcus"
```

Mönster 1 gav **1 571 träffar** i 75 av 150 dok. Mönster 2 kördes som
komplement eftersom de äldre doken (S52–S83) bär plain-citat utan kursiv;
det gav **306 träffar**. Radbrutna citat normaliserades genom att
blockquote-prefix (`>` plus mellanslag) och radindrag ströks och raderna fogades med ett
mellanslag — **inga ord ändrades**, vilket spot-verifierades mot disk för
tolv citat (S55, S62, S73, S83, S103, S107, S108, S110, S111, S113 och S121).

**Filtrering.** Ett UI-vokabulär om ~70 termer (design, snygg, ful,
bedrövlig, layout, bredd, knapp, rubrik, hjälptext, färg, komponent,
konsekvent, ikon, scroll, hopp, ladd, instant, sidkrom, höjd, hover,
fokusring, slarv, skit, proffs, facit, kort, kolumn, modal, kant, skugga,
radie, avstånd, typsnitt med flera) minskade mönster 1 till **454**
kandidater, och en snävare form till **212**. Samtliga 454 lästes för hand
med fyra raders föregående kontext för attributionsbedömning; de 212 lästes
i sin helhet. Mönster 2:s träffar lästes för sessionerna 40–92, där mönster
1 är tunt.

**Vad som valdes bort, och varför.**

| Bortvalt | Antal (ca) | Skäl |
|---|---|---|
| Citat ur dokument, ADR:er, kod-docblock, felmeddelanden | ~900 | Husets citatform används även för att citera egna filer; inte Marcus röst |
| Marcus process-citat utan koppling till prototyp-processen | ~180 | Uppdragets URVAL utesluter tempo, delegering, git, kö-mekanik |
| Marcus stående paus-/resume-order | ~30 | *"Denna session (91) lever tills…"* återkommer 14 gånger identiskt; ingen designinformation |
| Domän- och datafrågor utan formkonsekvens | ~60 | Betalningslogik, Airtable-fält, backfill |
| Korta kvittenser utan innehåll (*"Kör!"*, *"OK"*, *"Kvitterar"*) | ~120 | Bär ingen regel |
| Citat vars attribution jag inte kunde fastställa | 10 | Se § Osäkerheter |

**Vad metoden strukturellt INTE kan se.** Sessionsdoken är DESTILLAT.
`prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md` mätte att fem av
tretton transkript-citat saknades helt i sessionsdoket och ytterligare fem
var förkortade. Banken nedan är därför ett **golv**, inte en fullständig
räkning — det parallella transkript-passet ska förväntas hitta fler citat
och LÄNGRE former av samma citat.

## Banken

Sökvägar är relativa till repo-roten. Kolumnen *Vad som var fel* är **min
tolkning**, aldrig Marcus ord; citatkolumnen är verbatim och oförkortad
sånär som på de ellipser (`…`) som redan står i källan.

### Klass: sidkrom-bredd (8 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-001 | S122 | prototyper generellt | *"Genom att analysera transkripten kommer vi ju hitta vanliga fel men det är oftast sjukt många fel, inte ens sidkrom/sidmall används liksom. Saker är inte konsekventa, kort och knappar har olika storlekar och rör sig med innehållet, det är för mycket hjälptext, det är 'prototyptexter', komponenter används inte. Det är typ fel på det mesta, det är därför vi måste fixa detta."* | `tasks/sessions/2026-09-05-session-122.md:27` | Paraply-domen: sex separata defektklasser i en mening, sidkrom först |
| B-002 | S121 | bekräftelsesteget, konvergens varv 1 | *"Implementera appens sidkrom och det här, håll appens bredd (!), snygga till ALLT, kontrollera ALLT. Delegera inte, gör detta själv nu, och iterera tills du är helt nöjd."* | `tasks/sessions/2026-09-04-session-121.md:391` | Prototypen saknade sidkrom och bröt appens kolumnbredd |
| B-003 | S111 | undersidornas chevron | *"Alla chevrons vi nu satt dit … sitter ju mycket högre upp än alla andra … Flytta ner alla. Tanken med sidkromet som komponent var ju att alla 'undersidor' skulle se likadana ut i 'grunden'."* | `tasks/sessions/2026-08-22-session-111.md:689` | Sidkromets syfte kringgicks genom att varje undersida bar sin egen topp-luft |
| B-004 | S111 | sidramen, val av form | *"helst av allt vill jag nog C, men då måste jag få se vad det får för konsekvenser rent visuellt."* | `tasks/sessions/2026-08-22-session-111.md:190` | Sidram-valet fick inte avgöras på beskrivning — det krävde bild på riktig data |
| B-005 | S100 | åtgärdssidan, sidhuvudet | *"Titta på sidan 'Manuell anmälan', kopiera exakt var rubriken sitter, och strecket under, det är ju likadant på de flesta sidor och så borde du byggt direkt."* | `tasks/sessions/archive/2026-08/2026-08-07-session-100.md:261` | Sidhuvudet designades om i stället för att kopieras från en befintlig sida |
| B-006 | S55 | hem-vyn, adaptiv navigation | *"mobil-/desktop-/iPad-version?"* | `tasks/sessions/archive/2026-07/2026-07-06-session-55.md:146` | Frågan om enhetsbredder var oadresserad i prototypen |
| B-007 | S76 | prototyp-växlaren | *"skitful … sidebar med ikoner och tooltips … fast plats + dragbar"* | `tasks/sessions/archive/2026-07/2026-07-22-session-76.md:274` | Växlarens egen kromform var underkänd — verktyget syns i granskningen |
| B-008 | S121 | prototypytan generellt | *"Titta och hitta generella principer som tillämpas i appen och tillämpa dem även här, titta på hur olika vyer i appen ser ut, och gör liknande här. … Du måste ju zooma ut ibland."* | `tasks/sessions/2026-09-04-session-121.md:394` | Bygget arbetade lokalt på ytan utan att först kartlägga appens genomgående former |

### Klass: kortgeometri (13 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-009 | S121 | bulkregistrering, kortlistan | *"Skriv ut hela namnet 'Resor i medvetadet 1, Skövde' … ALLA kort måste alltid var exakt lika höga. Ta bort underrubriken 'Swish - 4 sep - kvitto'! Beloppsknappen bör väl öppna EXAKT samma vy som 'Registrera betalning' gör på inkorgen, eller hur?"* | `tasks/sessions/2026-09-04-session-121.md:547` | Kort med olika höjd beroende på innehåll; extra sekundärrad; avvikande destination |
| B-010 | S108 | bilagemallens dialoger | *"Det ABSOLUT värsta jag vet när saker växer och krymper."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:925` | Dialogens nedre kant flöt med innehållet, knappraden hoppade vid varje steg |
| B-011 | S108 | bilagemallens dialoger | *"Varför är modalen så liten?"* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:929` | Dialogmåttet togs ur luften i stället för ur hem-svepets etablerade mått |
| B-012 | S108 | bilagemallens dialoger | *"EXAKT samma modal överallt i bilageediteringen."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:940` | Villkorade dialogmått per innehållstyp i stället för ett enda mått |
| B-013 | S108 | bilagemallens dialoger | *"~500 px tom yta under sitt enda fält"* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:935` | Invändning mot fast höjd som senare upphävdes när fältet fyllde panelen |
| B-014 | S113 | dokumentytans kortlista | *"rundningen på skuggningen i högre nedre hörn täcker inte helt nästa kort när det scrollas fram"* | `tasks/sessions/2026-08-29-session-113.md:903` | Skuggans radie stämde inte med kortets vid scrollpassage |
| B-015 | S113 | dokumentytans listblock | *"flytta ut knapparna ur listblocket … de har en annan rundning än blocket också"* | `tasks/sessions/2026-08-29-session-113.md:804` | Två radier mötte varandra inuti samma block |
| B-016 | S108 | dokumentmallens rader | *"låst höjd med separatorlinje på alla OM vi låser höjden så den fjärde separatorlinjen inte syns"* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:3765` | Radhöjd och separator behandlades som två frågor när de är en |
| B-017 | S121 | beloppsknappen | *"lite kaka på kaka med samma kontur på beloppsrutan som på markeringen. Förslag?"* | `tasks/sessions/2026-09-04-session-121.md:568` | Två konturer med samma grammatik staplades på varandra |
| B-018 | S121 | beloppsknappen | *"nej ingen pill. Vill nog skriva ut beloppet platt direkt på ytan bara, men separera beloppet lite mer från chevronen, och gör chevronen lite större och med hover"* | `tasks/sessions/2026-09-04-session-121.md:569` | Formen bar en behållare den inte behövde; avstånd och träffyta för små |
| B-019 | S121 | beloppsknappen | *"Flytta in chevronen lite mer från kanten och sätt en annan hover färg, passar inte med grått mot det gröna"* | `tasks/sessions/2026-09-04-session-121.md:573` | Chevron för nära kanten; hover-tonen kolliderade med kortets valda tillstånd |
| B-020 | S103 | personlistan | *"aldrig 50 fristående kort per person"* | `tasks/sessions/archive/2026-08/2026-08-10-session-103.md:182` | Kortform föreslogs för en lista där tonal radform är rätt |
| B-021 | S107 | ordmärkets ikon | *"M:et ser lite höger-förskjutet ut."* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:2470` | Geometrisk centrering användes där optisk centrering krävs |

### Klass: knappar (10 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-022 | S107 | dokumentsidans kortknappar | *"alla fyra knappar måste se likadana ut"* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:638` | Fyra knappar med samma funktion bar olika vikt och ton |
| B-023 | S113 | kvitto-utskicket | *"när man trycker på knappen … så växer knappen i bredd … så gör inte proffs"* | `tasks/sessions/2026-08-29-session-113.md:1826` | Laddläget bytte etikett och därmed knappbredd i stället för att reservera måttet |
| B-024 | S113 | dokumentytans handlingar | *"inte konsekventa, och de kan vara ganska många"* | `tasks/sessions/2026-08-29-session-113.md:671` | Högerställda knappar per rad utan gemensam grammatik |
| B-025 | S107 | felmeddelande-ytan | *"Det ser ju skitfult ut, fruktansvärt. trycker ner innehållet, en långtextsträng och en centrerad knapp... Detta kan vi ju inte acceptera som 'Proffsigt'."* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:2509` | Felytan sköt undan innehållet och bar ocentrerad copy med centrerad knapp |
| B-026 | S121 | bulkregistreringens fot | *"Nu har ju Lotta två knappar längst ner. Vad händer när hon trycker på respektive knapp?"* | `tasks/sessions/2026-09-04-session-121.md:592` | Två primärlika knappar utan förklarad skillnad i utfall |
| B-027 | S121 | bulkregistreringens fot | *"Borde vi inte lägga till knappen 'Förhandsgranska samtliga kvitton' längst ner?"* | `tasks/sessions/2026-09-04-session-121.md:589` | Handling som fanns på syskonytan saknades här |
| B-028 | S107 | hemvyns bevakningsrader | *"Bevakningsraderna på hemvyn leder ingenstans. Och hur funkar deras funktion, vilka lägen har dem och vad var vår tanke? Bevakningsraderna bör väl vara knappar och funka som 'bekräfta alla' och 'skicka påminnelse till alla' gör, eller hur? Inte bara länka till eventet."* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:1148` | Raden såg ut som en handling men var en länk |
| B-029 | S108 | bilagemallens agendarad | *"Lotta kommer ju trycka där, men just nu händer ingenting."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:755` | En yta som bär affordans utan att bära handling |
| B-030 | S73 | Skapa nytt event, ingången | *"NEJ NEJ NEJ"* | `tasks/sessions/archive/2026-07/2026-07-19-session-73.md:753` | Primärknapp placerad i titelraden — fel plats för handlingen i husets grammatik |
| B-031 | S121 | markeringens grammatik | *"De bör också vara markerade, alltså gröna, alltså det måste 'funka' på samma sätt som när Lotta markerar på eventdetaljer och 'drar med dem' in i åtgärder."* | `tasks/sessions/2026-09-04-session-121.md:538` | Markeringstillståndet bar egen form i stället för eventdetaljers |

### Klass: typografi-hierarki (8 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-032 | S86 | eventväljaren, rubriken | *"Truncate med '…' räcker INTE ... annars faller hela konceptet med Eventnamnet som rubrik."* | `tasks/sessions/archive/2026-07/2026-07-25-session-86.md:203` | Rubriken klippte sitt eget innehåll och upphävde därmed sin egen idé |
| B-033 | S83 | eventlistans månadsrubriker | *"inte snyggt, här behöver vi vara designers lite"* | `tasks/sessions/archive/2026-07/2026-07-24-session-83.md:336` | Egen uppfunnen rubrikgrammatik (ALL CAPS) i stället för repots befintliga |
| B-034 | S121 | bulkregistrering, titelraden | *"Nej. Detta funkar inte. Titeln är idag 'Registrera betalningar' … Jag vill istället att det ska vara 'Bulkregistrering'. Sedan vill jag flytta upp 'Klara att registrera'-listan överst och döpa om den till 'Registereringsförslag' med underrubrik: 'Baserat på inbetalningshistoriken så föreslår appen inbetalningsbelopp, gå igenom listan och kolla så det stämmer, tryck på beloppet för att ändra.' 'Behöver din hand' behöver ju inte ens visas om det inte finns några rader där."* | `tasks/sessions/2026-09-04-session-121.md:515` | Fel hierarki: den viktigaste listan låg under den sällsynta |
| B-035 | S55 | hem-vyn, historikrutan | *"flytta in rubriken eller ut raderna?"* | `tasks/sessions/archive/2026-07/2026-07-06-session-55.md:439` | Rubrik och rader var inte linjerade mot samma kant |
| B-036 | S107 | dokumentsidans sektioner | *"Man ser ju vad de olika ytorna är för något ändå."* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:953` | Rubriker som förklarar det uppenbara — subtraktionskandidat |
| B-037 | S121 | bulkregistrering, kortets namnrad | *"Du glömde den gröna konturen på 'Inget kvar att betala'-notisen, något mer du glömde? Ta bort sekundärraden '1500 kr kvar att betala' … centrera namnet så det linjerar med initialer-ikonen."* | `tasks/sessions/2026-09-04-session-121.md:562` | Namnet linjerade inte mot sin egen ikon; överflödig sekundärrad |
| B-038 | S108 | kvittots typsnitt | *"Jag misstänker att Roger valt den för att han gillar den. Då borde väl vi ha EXAKT den och inget som liknar den?"* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:1421` | En "liknande" font godtogs där förlagan är facit |
| B-039 | S55 | hem-vyns kortrubriker | *"Ändrade inte tillbaka färgen"* | `tasks/sessions/archive/2026-07/2026-07-06-session-55.md:408` | Upplevd färgändring som i själva verket var vikt- och ytkontext |
| B-040 | S103 | anmälans tidslinje | *"texten bär, tiden mutad under"* | `tasks/sessions/archive/2026-08/2026-08-10-session-103.md:1244` | Formen fanns redan låst i appen; strömmen uppfann en egen |

### Klass: farg-token (7 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-041 | S113 | dokumentytans lista | *"Ta bort hover på korten. Reservera plats för scrollbaren … Scrollbaren ska va den ljusgråa som vi använder i appen … den sitter utanför listytan på den gråa bakgrunden … Skuggningen ska ju bara synas på vita kortet."* | `tasks/sessions/2026-08-29-session-113.md:799` | Scrollbaren bar egen ton och egen plats; skuggan lades på fel yta |
| B-042 | S113 | dokumentytans åtgärdsknapp | *"Borde vi inte också ha en annan grå nyans på åtgärdsknappen … Tror du inte Lotta vill ha något mer sätt att kunna särskilja bilagor som gäller 'Alla event' vs 'Detta event'?"* | `tasks/sessions/2026-08-29-session-113.md:802` | En enda grå bar två olika betydelser |
| B-043 | S108 | bilagemallens tomma fält | *"fult"* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:742` | Fylld varningsyta där kontur var rätt signalstyrka |
| B-044 | S109 | notisfamiljen | *"konturen ... samma ton som bakgrundsfärgen"* | `tasks/sessions/archive/2026-08/2026-08-20-session-109.md:637` | Tonal kontur prövad och senare förkastad av Marcus själv |
| B-045 | S67 | fokusringen | *"Det är inget fel på färgen"* | `tasks/sessions/archive/2026-07/2026-07-18-session-67.md:165` | Foundation-drift i fokusringen flaggades — Marcus förkastade den som dagens fynd |
| B-046 | S92 | färg-atlasen | *"använder vi fler färger än dokumenterat?"* | `tasks/sessions/archive/2026-07/2026-07-26-session-92.md:80` | Misstanke om odokumenterade färger; utfallet blev nej |
| B-047 | S107 | ordmärket | *"vi har ju den som ligger i repot, kan vi inte bara sätta originalfärgerna på den?"* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:1993` | Ett halvt pass gick till export och kalibrering när repots egen SVG räckte |

### Klass: copy-hjalptext (10 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-048 | S108 | bilagemallens dialog | *"Fyll i de 3 som saknas är extremt överflödig."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:931` | Hjälptext som upprepade vad tre andra ytor redan sade |
| B-049 | S107 | personlistans räknare | *"Det står 'Visar 50 personer (fler finns).' och det tycker jag är oproffsigt. Jag vill att det ska stå 'Visar 50 av XXX'. Enkel ändringen eller? Sen vill jag veta hur personlistan filtreras idag och hur den borde filtreras enligt dig?"* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:1085` | Vag copy (*fler finns*) där ett exakt tal var tillgängligt |
| B-050 | S108 | bilagemallarna, ordval | *"Det ska alltid överallt heta Steg, aldrig Nivå"* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:288` | Två ord för samma begrepp i användarsynlig text |
| B-051 | S100 | app-brett | *"Ta bort alla långa bindestreck överallt, jag gillar de korta bindestrecken (-)."* | `tasks/sessions/archive/2026-08/2026-08-07-session-100.md:860` | Långa tankstreck i användarsynlig text |
| B-052 | S105 | app-brett | *"ALLA 15 långa bindestreck i användarsynlig text MÅSTE bort"* | `tasks/sessions/archive/2026-08/2026-08-11-session-105.md:518` | Skärpning sedan ett delvis undantag prövats och avvisats |
| B-053 | S108 | kvittots rader | *"Orginalet tar upp EN rad … Varför har vi fortfarande med ordet 'Slutbetalning'. Det är FEL. Det är bara en betalning, varken slut eller början."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:2165` | Tre rader där förlagan har en; ett ord som påstår fel sak |
| B-054 | S113 | Mer-flikens etikett | *"Mer-fliken 'Dokument' kanske borde heta 'Bilagor'"* | `tasks/sessions/2026-08-29-session-113.md:715` | Substantivet matchade inte vad ytan faktiskt innehåller |
| B-055 | S121 | bulkregistreringens block | *"Jag tror vi kan ta bort 'Ändra för alla'-blocket helt och hållet. Vad ska hon med det till egentligen? Men jag vill behålla summaraderna och de längst ner."* | `tasks/sessions/2026-09-04-session-121.md:578` | Ett block som byggts utan att dess användningsfall prövats |
| B-056 | S113 | dokumentytans metarad | *"ta bort"* | `tasks/sessions/2026-08-29-session-113.md:671` | Metadata (*Event-mallad*) i raden utan läsvärde |
| B-057 | S104 | segmentbyggarens täckningsrad | *"zebra riven, belagt av Marcus öga plus research-pass med fem designsystem"* | `tasks/sessions/archive/2026-08/2026-08-10-session-104.md:362` | Zebra-randning som visuellt brus; tonal yta vann |

### Klass: fixtur-prototyptext (11 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-058 | S122 | prototyper generellt | *"Vi har stora problem med att prototyperna du bygger alltid blir väldigt dåliga och slarvigt byggda."* | `tasks/sessions/2026-09-05-session-122.md:26` | Domen som utlöste detta pass |
| B-059 | S121 | bekräftelsesteget, divergens | *"samtliga prototyper var SJUKT slarvigt byggda, alltså under all kritik. Detta är ett återkommande problem vi har"* | `tasks/sessions/2026-09-04-session-121.md:389` | Alla tre divergens-varianter föll på samma grund |
| B-060 | S121 | bekräftelsesteget, varv 13 | *"Jag vill att prototypen visar exakt vad skarpa vyn kommer visa, allt i prototypen måste vara exakt som i prod-appen, annars kan jag ju inte iterera."* | `tasks/sessions/2026-09-04-session-121.md:596` | Prototypens beteende avvek från skarpa vyns och gjorde iterationen osann |
| B-061 | S117 | check-in-prototypen | *"skarpa vyn är mycket snyggare än prototypen agenten byggt. Så en väldigt dålig prototyp."* | `tasks/sessions/2026-09-03-session-117.md:128` | Prototypen startade sämre än den yta den skulle förbättra |
| B-062 | S96 | prototyp-passet | *"I förra resumen byggdes prototyperna och de byggdes så dåligt och slarvigt så det liknar inget. Väldigt besviken."* | `tasks/sessions/archive/2026-08/2026-08-02-session-96.md:730` | Samma dom, en månad tidigare |
| B-063 | S93 | hållplats-prototypen | *"Fy tusan va slarvigt byggda prototyper!! Under all kritik. Dessutom har vi ju inget staging-event som har några anmälda deltagare, tomt på varje event, så går ju inte kolla något."* | `docs/research/prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md:866` | Tom fixtur gjorde ytan ogranskbar — orsaken till `seed:review` |
| B-064 | S103 | check-in A/B/C | *"under all kritik, SÅ DÅLIGA"* | `tasks/sessions/archive/2026-08/2026-08-10-session-103.md:1626` | Tre varianter underkända i klump |
| B-065 | S55 | hem-vyn K2 | *"mycket som är fel och dåligt"* | `tasks/sessions/archive/2026-07/2026-07-06-session-55.md:222` | Tio konkreta punkter följde — den tidigaste instansen i banken |
| B-066 | S121 | bulkregistreringens fixtur | *"Varför skrev du inte ut 'eventrubrikerna' exakt som det är i inkorgen också?"* | `tasks/sessions/2026-09-04-session-121.md:544` | Markupen var exakt men fixturens eventnamn saknade orten |
| B-067 | S113 | prod-data | *"Sådant här får inte nå prodappen"* | `tasks/sessions/2026-08-29-session-113.md:1804` | Testliknande namn syntes i skarp app |
| B-068 | S100 | åtgärdssidan | *"En ordentlig underleverans Claude! Den här sidan ser ut att vara ihopkastad i panik. Ingen tanke, inget engagemang, ingenting. Var är dokument-ytan?"* | `tasks/sessions/archive/2026-08/2026-08-07-session-100.md:148` | Grindarna var gröna och ytan ändå underkänd i sin helhet |

### Klass: komponent-aterbruk (8 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-069 | S103 | personlistans radform | *"Vi behöver ju återvinna här, inte uppfinna … alla dem korten leder ju till persondetaljer, så därför bör det kortet vara grunden."* | `tasks/sessions/archive/2026-08/2026-08-10-session-103.md:174` | En ny radform ritades där `PersonMiniKort` redan bar idiomet |
| B-070 | S104 | segmentbyggarens dukning | *"duka upp för byggagenterna så de bygger 3 riktigt bra varianter. Vi har idag flera sidar som är 'facit-låsta' och 'färdig-designade' återanvänd struktur, komponenter och mönster. Appen formspråk är ju i grunden satt via de 'färdiga' skärmarna/sidorna."* | `tasks/sessions/archive/2026-08/2026-08-10-session-104.md:40` | Varianter riskerade uppfinna eget formspråk i stället för att ärva |
| B-071 | S100 | åtgärdssidans deltagarlista | *"just nu i prototypen så listas alla deltagare på rader, det är big NO NO, Lotta måste känna igen sig!! Personerna ska listas på sina personkort EXAKT som dem gör på eventdetaljer, när Lotta drar med deltagare från eventdetaljer in i åtgärder så ska korten se exakt likadana ut."* | `tasks/sessions/archive/2026-08/2026-08-07-session-100.md:274` | Rader där appens etablerade personkort skulle använts |
| B-072 | S100 | åtgärdssidans sökträffar | *"När man vill addera personer från eventet in i åtgärder så ska man absolut kunna söka på den, de va bra. Men de ska listas på kort."* | `tasks/sessions/archive/2026-08/2026-08-07-session-100.md:282` | Sökträffar renderades i egen form |
| B-073 | S121 | prototypmandatet | *"Jag anser att du kan klara av att göra sjukt bra prototyper direkt utan mina iterationer. Vi har så etablerat formspråk i appen redan och allting liksom. Rent, snyggt och tydligt."* | `tasks/sessions/2026-09-04-session-121.md:286` | Marcus premiss: formspråket ÄR redan givet, det ska inte återuppfinnas |
| B-074 | S83 | konventionernas hemvist | *"Konventioner måste ju ha ett HEM, det måste ju vara branschpraxis, vi kan absolut inte acceptera att det bara lever i kommentarer!"* | `tasks/sessions/archive/2026-07/2026-07-24-session-83.md:411` | Två egen-uppfunna grammatiker på en timme; konventionen saknade adress |
| B-075 | S108 | bilagemallens formspråk | *"Vi får inte låsa oss vid befintligt formspråk, OM vi behöver etablera något nytt … så gör vi det."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:390` | **Motvikt:** återbruk är golv, inte tak — nytt får etableras med avsikt |
| B-076 | S107 | dokumentsidans omtag | *"vi har ett etablerat formspråk, vi måste kunna få till det här med inspiration från andra sidor."* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:733` | Ytan byggdes utan att andra sidor konsulterades |

### Klass: konsekvens-syskonvy (16 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-077 | S121 | bulkregistrering, princip | *"Lotta måste känna igen sig."* | `tasks/sessions/2026-09-04-session-121.md:533` | Principen bakom tre på varandra följande varv |
| B-078 | S121 | bulkregistreringens lista | *"Vi kan ta bort 'Registreringsförslag'-rubriken och underrubrik. Listan och event-rubrikerna behåller vi men EXAKT som på betalnings-sidan."* | `tasks/sessions/2026-09-04-session-121.md:534` | Egen listgrammatik där betalningssidans redan fanns |
| B-079 | S103 | check-in-prototypen | *"jämför med alla andra klara sidor i appen (facit-sidor)"* | `tasks/sessions/archive/2026-08/2026-08-10-session-103.md:1634` | Prototypen bedömdes isolerat i stället för mot facit-sidorna |
| B-080 | S107 | eventinfo-svepet | *"se till att eventinfo-svepet funkar exakt som de andra svepen då, så Lotta känner igen sig. Alltså att allt blir samma, overlayet och övergångarna också."* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:1515` | Ett svep i familjen bar egna overlay- och övergångsvärden |
| B-081 | S104 | segmentbyggaren | *"hela sidan måste designas om och gå genom promoveringsformen precis som person-vyn, persondetalj och check-in"* | `tasks/sessions/archive/2026-08/2026-08-10-session-104.md:34` | Ytan hade aldrig gått genom samma form som syskonytorna |
| B-082 | S117 | check-in, talen | *"Jag gillar prototyp variant 1 mer än 2. Men jag funderar på om vi kan sätta '3' och '14' i brickor typ som vi har vid påminnelse-blocket på hemvyn"* | `tasks/sessions/2026-09-03-session-117.md:144` | Tal renderades platt där hemvyn redan har en brickform |
| B-083 | S111 | eventväljaren | *"Jag vill ha den andra eventväljaren som har ett annat utseende, den som sitter på dokument-sidan. Och 'Alla event' kan väl få en ikon då precis som 'Delade dokument' har på dokumentsidan, det blir väl snyggt?"* | `tasks/sessions/2026-08-22-session-111.md:554` | Två eventväljare i appen; fel form vald för ytan |
| B-084 | S111 | anmälningslistans radanatomi | *"borde inte den se ut nästan exakt som personslistan? … i anmälningslistan vill man ju se NÄR anmälan kom in och vilket event anmälan är för."* | `tasks/sessions/2026-08-22-session-111.md:198` | Radanatomin uppfanns i stället för att ärvas från personlistans facit |
| B-085 | S64 | Mer-vyn | *"ska Mer-vyn matcha menybaren?"* | `tasks/sessions/archive/2026-07/2026-07-12-session-64.md:203` | Två navigationsytor med olika ordning och namn |
| B-086 | S107 | PWA-ikonerna | *"PWA ikonerna måste vara samma såklart"* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:1974` | Favicon byttes utan att ikonfamiljen följde med |
| B-087 | S110 | åtgärdskö-sidan | *"kommer jag till en 'ny' sida, eller? … den är inte facitstämplad … det har inte genomgått ett konvergenspass. Det är skitful."* | `tasks/sessions/2026-08-21-session-110.md:1217` | En konvergerad rad ledde till en aldrig konvergerad sida |
| B-088 | S111 | åtgärdskö-sidan | *"skitful"* | `tasks/sessions/2026-08-22-session-111.md:40` | Samma dom, upprepad vid nästa sessionsstart |
| B-089 | S93 | eventsidan | *"GUD vad skönt, nu ser jag att den skarpa versionen ser ut exakt som prototypen."* | `tasks/sessions/archive/2026-08/2026-08-02-session-93.md:1953` | Lättnadens formulering — identitet mellan prototyp och skarp är målet |
| B-090 | S55 | hem-vyns facit | *"avslutar detta prototypande … låser K10 som FACIT för hem-vyn. Prod-vyn ska se EXAKT likadan ut."* | `tasks/sessions/archive/2026-07/2026-07-06-session-55.md:498` | Facit-kontraktets tidigaste formulering i banken |
| B-091 | S108 | kvitto mot förlaga | *"Vi ska göra proffsigt men ändå så ska Roger och Lotta knappt se skillnad på denna bilaga och originalet, den vi gör ska till och med vara lite bättre liksom."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:1397` | Ribban: som förlagan, fast bättre — aldrig fritt omtolkad |
| B-092 | S107 | dokumentytans lägen | *"vi kan ju inte ha toggle-valet 'ALLA' i eventläget och även ha knappen 'Visa gemensamma dokument' … detta är inte bra."* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:954` | Två axlar slogs om att vara samma "läge" i samma kort |

### Klass: beteende-interaktion (16 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-093 | S96 | app-brett | *"INGET får hoppa i denna app under några omständigheter."* | `tasks/sessions/archive/2026-08/2026-08-02-session-96.md:792` | En scrollbar-gutter-fix införde ett layouthopp |
| B-094 | S107 | app-brett (ADR-078 beslut 4) | *"hopp i layouten är absolut förbjudet i denna app"* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:2535` | Regeln som avgör där designsystemen tillåter två former |
| B-095 | S109 | app-brett (ADR-078 beslut 4) | *"hopp i layouten är absolut förbjudet i denna app"* | `tasks/sessions/archive/2026-08/2026-08-20-session-109.md:54` | Samma regel, åberopad igen i ett annat pass |
| B-096 | S83 | app-brett | *"ALLT i denna app ska vara instant, det ska vara en regel också"* | `tasks/sessions/archive/2026-07/2026-07-24-session-83.md:349` | INSTANT-kravets födelse |
| B-097 | S86 | eventväljarens sökruta | *"vi ska ha fokusring på sökrutan instant vid öppning"* | `tasks/sessions/archive/2026-07/2026-07-25-session-86.md:230` | Fokus syntes inte omedelbart vid öppning |
| B-098 | S73 | dropdown-menyerna | *"fokusringen kommer in i dropdownmenyerna"* | `tasks/sessions/archive/2026-07/2026-07-19-session-73.md:772` | Fokusring tändes vid musöppning — fel modalitet |
| B-099 | S108 | beskrivningsmodalen | *"Scrollbaren i beskrivningsmodalen är ju inte ens i textrutan!!!"* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:777` | Auto-grow utan tak flyttade rullisten till dialogen |
| B-100 | S113 | dokumentytans lista | *"scrollbaren börjar för högt upp"* | `tasks/sessions/2026-08-29-session-113.md:884` | Rännan startade 8 px fel |
| B-101 | S113 | dokumentytans kort | *"det är fortfarande problem med hovringen … Hur tusan kunde du släppa igenom det? Kolla SJÄLV nu i prod."* | `tasks/sessions/2026-08-29-session-113.md:870` | Hover-defekt nådde prod utan egen kontroll |
| B-102 | S121 | bulkregistreringens kort | *"När jag avmarkerade Fatima så försvann hennes belopp och chevron, bugg?"* | `tasks/sessions/2026-09-04-session-121.md:575` | Avmarkering lämnade kortet i ett tomt mellantillstånd |
| B-103 | S91 | obekräftade-kön | *"den visar ju aldrig mer än 3 kort och du bör alltid markera och tömma listan, varför skulle du vilja gömma den."* | `tasks/sessions/archive/2026-07/2026-07-26-session-91.md:113` | En fällbar sektion byggd för ett problem som inte finns |
| B-104 | S113 | kvitto-utskickets efterläge | *"Kvittot är skickat men jag är 'fast' med denna skärm … den gula rutan förändrades i höjd, olika toastar"* | `tasks/sessions/2026-08-29-session-113.md:1817` | Efterläget saknade utgång; statusytan bytte höjd |
| B-105 | S108 | eventdetaljens inforuta | *"Det är INGEN skillnad."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:1754` | En ändring som mättes som skillnad syntes inte som en |
| B-106 | S108 | kvittots leveransväg | *"det är ju fortfarande det gamla fula kvittot, men det vet du va?"* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:2226` | Ytan visade fortfarande den gamla artefakten efter att den nya landat |
| B-107 | S113 | dokumentytan | *"Det är något som saknas på denna yta liksom som jag inte kan sätta fingret på"* | `tasks/sessions/2026-08-29-session-113.md:673` | Ospecificerat gap — exakt den klass `L269` beskriver |
| B-108 | S73 | beskrivningsrutans grepp | *"bedrövligt"* | `tasks/sessions/archive/2026-07/2026-07-19-session-73.md:707` | Egenbyggt resizer-grepp; lösningsklassen var fel |

### Klass: laddkansla (5 citat)

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-109 | S109 | personlistans sökfält | *"Det är ju sjukt störigt att listan 'Laddas om' vid varje teckeninmatning i sökfältet. Den måste ju vara 'förladdad' eller något. Detta är ju inte proffsigt."* | `tasks/sessions/archive/2026-08/2026-08-20-session-109.md:576` | Serverfiltrering per tangenttryck i stället för klientsök |
| B-110 | S62 | hem-vyns kallstart | *"inget ska röra sig … det ska bara vara där"* | `tasks/sessions/archive/2026-07/2026-07-11-session-62.md:194` | Kollapsade kort plus växande *Laddar…*-rader gav layoutskift |
| B-111 | S62 | hem-vyns polling | *"ser ingen omladdning längre, så det är ju bra"* | `tasks/sessions/archive/2026-07/2026-07-11-session-62.md:187` | Godkännandet av osynlig bakgrundsuppdatering |
| B-112 | S108 | mallens logotyp | *"när jag klickar så visas typ hela deras logotyp på helskärm i en mikrosekund."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:961` | Ett osynkat renderingssteg blinkade förbi |
| B-113 | S113 | bilagegenerering | *"Ett ögonblick Marcus, bilagan skapas och visas här om några sekunder."* | `tasks/sessions/2026-08-29-session-113.md:41` | Väntetiden saknade en yta som talade om vad som händer |

### Klass: process (12 citat)

Endast process som rör prototyp- och konvergensarbetet direkt.

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-114 | S100 | metod-skiftet | *"Skit i strukturskisser. Det gav ingenting. Bygg direkt efter instruktion bara."* | `tasks/sessions/archive/2026-08/2026-08-07-session-100.md:377` | Ett mellanled som inte bar information |
| B-115 | S103 | check-in-rapporten | *"har du ens tittat på hur det ser ut?"* | `tasks/sessions/archive/2026-08/2026-08-10-session-103.md:1633` | UI bedömdes ur källkod, inte ur renderad yta |
| B-116 | S108 | dokumentmallarna | *"Du behöver verkligen kolla UI:t nu, både kod och rendering."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:237` | Samma klass, uttryckt som stående order |
| B-117 | S121 | prototyp-processen | *"Vi får gräva i varför det generellt blir så dåliga prototyper"* | `tasks/sessions/2026-09-04-session-121.md:619` | Processfrågan lyft till egen grillning |
| B-118 | S121 | prototyp-processen | *"varför blir prototyper så slarviga"* | `tasks/sessions/2026-09-04-session-121.md:795` | Samma fråga, bokförd i handoffen |
| B-119 | S111 | formgivningen | *"DU gör följande ändringar SJÄLV och committar lokalt tills jag är nöjd."* | `tasks/sessions/2026-08-22-session-111.md:445` | Delegering av formarbete gav sämre utfall än direkt arbete |
| B-120 | S113 | dokumentytans design | *"Gör ändringarna i designen och comitta lokalt … Vi pushar allt när jag är nöjd. Pajja inte det här med höjdlåset"* | `tasks/sessions/2026-08-29-session-113.md:702` | Samma arbetsform: lokala varv, push när formen sitter |
| B-121 | S111 | facit-bevisen | *"vi borde ju för tusan ha bildbaslinjer för alla facitstämplade ytor. Det är väl det som är hela grejen."* | `tasks/sessions/2026-08-22-session-111.md:218` | Facit-stämpling utan bildbaslinje bevisar inte formtrohet |
| B-122 | S113 | dokumentytan | *"Jag behöver ditt designöga på detta"* | `tasks/sessions/2026-08-29-session-113.md:672` | Marcus ber explicit om självständigt formomdöme, inte om utförande |
| B-123 | S52 | hem-skelettet | *"inte helt nöjd med skelettet"* | `tasks/sessions/archive/2026-07/2026-07-05-session-52.md:673` | AC-match kvitterad och ytan ändå underkänd — `T65`-instansen |
| B-124 | S81 | visuell grind | *"MÄNGDER av förändringar av utseendet i kommande sessioner"* | `tasks/sessions/archive/2026-07/2026-07-24-session-81.md:326` | Skälet att visuell regressionsgrind INTE aktiverades i tidig UI-fas |
| B-125 | S113 | perfektionströskeln | *"När ditt perfektionsöga sägar 'Detta är perfekt nu', då går du mot paus."* | `tasks/sessions/2026-08-29-session-113.md:2288` | Tröskeln för "klart" är Codes eget omdöme, inte en checklista |

### Klass: annat — domar och godkännanden utan enskild formaxel (11 citat)

Dessa bär inte en enskild regel men kalibrerar tonen: de visar vad som
räknas som godkänt och vad som räknas som underkänt.

| ID | Session | Yta/vy | Citat verbatim | Fil:rad | Vad som var fel (min tolkning) |
|---|---|---|---|---|---|
| B-126 | S83 | anmälningsvyn | *"rent design-mässigt ser det fruktansvärt bedrövligt ut, skamligt att du ens presenterar det"* | `tasks/sessions/archive/2026-07/2026-07-24-session-83.md:314` | Den hårdaste enskilda domen i banken |
| B-127 | S93 | personblocken | *"innehållet som det behöver ha, men designmässigt är det skit"* | `tasks/sessions/archive/2026-08/2026-08-02-session-93.md:695` | Innehåll rätt, form fel — axlarna är oberoende |
| B-128 | S100 | previewn | *"Jävlar vilken ful preview, vad använder vi den till? Den är oanvändbar och måste göras om."* | `tasks/sessions/archive/2026-08/2026-08-07-session-100.md:323` | Ytan var byggd utan att dess syfte prövats |
| B-129 | S107 | dokumentsidan | *"Fan dokumentsidan är skitdålig alltså, jag är inte alls nöjd. Lotta kommer inte gilla detta."* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:710` | Underkännande med användaren som referens |
| B-130 | S108 | agenda-modalen | *"Agenda-modalen är SKIT asså."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:748` | Radhöjd rätt men listan gles av tomma metarader |
| B-131 | S108 | kvittot | *"det fulaste gräsligaste kvittot jag någonsin sett, det ska göras om fullständigt för att mer likna Rogers nuvarande kvitto."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:1089` | Egen mall där förlagan fanns |
| B-132 | S76 | prototyp-växlarens rail | *"Nu är det skitbra"* | `tasks/sessions/archive/2026-07/2026-07-22-session-76.md:403` | Godkänd efter lösningsklassbyte |
| B-133 | S83 | eventväljaren 18.19 | *"För första gången i detta projekt är jag imponerad över vad du levererar som baslinje."* | `tasks/sessions/archive/2026-07/2026-07-24-session-83.md:321` | Låst i FÖRSTA visningen — den enda instansen i banken |
| B-134 | S107 | dokumentsidan efter omtag | *"Bra jobb! Nu är jag jättenöjd med hur det ser ut och funkar och jag vill ha detta till prodappen så fort som möjligt."* | `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:930` | Godkännandeform: *ser ut* OCH *funkar* nämns tillsammans |
| B-135 | S108 | bekräftelsebilagan | *"Bra. Nu är jag helt nöjd med hur detta ser ut för bekräftelsebilagan."* | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:711` | Godkänd efter tolv konvergensvarv |
| B-136 | S73 | eventdetaljsidan | *"Jag är nöjd med eventdetalj-sidan nu efter 72 iterationer … Detta ska ju bli facit nu"* | `tasks/sessions/archive/2026-07/2026-07-19-session-73.md:718` | 72 iterationer till facit — bankens högsta uppmätta varvtal |

## Frekvens

### Per klass

| Klass | Antal citat | Andel |
|---|---|---|
| konsekvens-syskonvy | 16 | 11,8 % |
| beteende-interaktion | 16 | 11,8 % |
| kortgeometri | 13 | 9,6 % |
| process | 12 | 8,8 % |
| fixtur-prototyptext | 11 | 8,1 % |
| annat | 11 | 8,1 % |
| knappar | 10 | 7,4 % |
| copy-hjalptext | 10 | 7,4 % |
| typografi-hierarki | 9 | 6,6 % |
| sidkrom-bredd | 8 | 5,9 % |
| komponent-aterbruk | 8 | 5,9 % |
| farg-token | 7 | 5,1 % |
| laddkansla | 5 | 3,7 % |
| **Summa** | **136** | |

ID-serien `B-001`–`B-136` är sammanhängande: inga hopp, inga dubbletter
(maskinellt kontrollerat mot filen). Ett citat, `B-063`, har sin fil:rad i
ett research-dok i stället för i sessionsdoket — det är den enda posten vars
källa är en transkript-härledd sekundärkälla, och den är märkt som sådan.

### Per session

| Session | Citat | Session | Citat | Session | Citat |
|---|---|---|---|---|---|
| S108 | 21 | S121 | 21 | S113 | 17 |
| S107 | 14 | S100 | 7 | S111 | 7 |
| S103 | 6 | S55 | 5 | S83 | 5 |
| S73 | 4 | S93 | 3 | S104 | 3 |
| S109 | 3 | S62 | 2 | S76 | 2 |
| S86 | 2 | S96 | 2 | S117 | 2 |
| S122 | 2 | S52 | 1 | S64 | 1 |
| S67 | 1 | S81 | 1 | S91 | 1 |
| S92 | 1 | S105 | 1 | S110 | 1 |

### De tio oftast återkommande konkreta reglerna

Formulerade som imperativ. Detta är **min destillation**, inte Marcus ord —
citat-ID:n är belägget, formuleringen är min.

1. **Namnge den befintliga vyn du ärver formen från, och kopiera den klass
   för klass i stället för att designa om den.** Elva citat namnger en
   konkret syskonyta som facit. Belägg: B-005, B-071, B-072, B-078, B-080,
   B-081, B-082, B-083, B-084, B-091, B-069.
2. **Ingenting får hoppa, växa eller krympa när innehållet ändras — reservera
   måttet i förväg.** Belägg: B-001, B-009, B-010, B-023, B-093, B-094,
   B-095, B-104, B-110.
3. **Använd appens sidkrom och appens kolumnbredd på varje prototypyta, från
   första commit.** Belägg: B-001, B-002, B-003, B-005, B-008.
4. **Alla kort i en lista har exakt samma höjd, oavsett hur mycket data raden
   bär.** Belägg: B-001, B-009, B-016, B-010.
5. **Knappar med samma roll ser likadana ut, och en yta som ser klickbar ut
   måste göra något.** Belägg: B-022, B-023, B-024, B-026, B-028, B-029.
6. **Ta bort hjälptext som upprepar något ytan redan visar.** Belägg: B-001,
   B-048, B-036, B-055, B-056.
7. **Fixturen ska visa vad skarpa vyn kommer visa — riktiga namn, riktiga
   orter, riktiga tillstånd, inga platshållare.** Belägg: B-060, B-063,
   B-066, B-067, B-009.
8. **Återanvänd komponenten som redan finns; uppfinn bara ny form när du
   uttryckligen deklarerar att du gör det.** Belägg: B-069, B-070, B-071,
   B-073, B-074, B-076, med B-075 som motvikt.
9. **Titta på den renderade ytan innan du rapporterar om den — aldrig på
   koden enbart.** Belägg: B-115, B-116, B-101, B-121.
10. **Allt ska kännas instant: ingen omladdning per tangenttryck, ingen
    synlig skelett-fas, inget blinkande mellansteg.** Belägg: B-096, B-097,
    B-109, B-110, B-112, B-113.

Regel 1 och 2 är de enda som är **mekaniskt prövbara utan Marcus** — den
första genom en namngiven referensvy, den andra genom mätning av
boundingbox före och efter innehållsändring. Regel 3, 4 och 5 är
halvmekaniska (mätbara, men kräver att någon anger vad rätt värde är).
Resten kräver omdöme.

## Sessioner rankade — prioritering för transkript-passet

Rankad efter antal citat i sessionsdoket. Kolumnen *Förväntad transkript-vinst*
är min bedömning av hur mycket MER som sannolikt finns i transkriptet än i
doket, grundad på hur destillerat doket är och hur många varv passet bar.

| Rang | Session | Citat i dok | Ämne | Förväntad transkript-vinst |
|---|---|---|---|---|
| 1 | S108 | 21 | Bilagemallar, kvitto, 16+ konvergensvarv | **Mycket hög** — 13 dialogvarv sammanfattade gruppvis |
| 2 | S121 | 21 | Bekräftelsesteget: divergens + 13 konvergensvarv | **Mycket hög** — varv 4–12 återges som en rad vardera |
| 3 | S113 | 17 | Dokumentyta, kvittoflöde, röktest | **Hög** — nio pauser, kraftigt komprimerat |
| 4 | S107 | 14 | Dokumentsidans omtag, QA-vandring | **Hög** — vandringens restlista är komprimerad |
| 5 | S100 | 7 | Åtgärdssidan: fyra varv plus preview | **Hög** — `ADR-102`-eran, känt underdokumenterad |
| 6 | S111 | 7 | Sidram, anmälningslistan, chevrons | Medel |
| 7 | S103 | 6 | Personlistan, check-in A/B/C/D | Medel–hög |
| 8 | S55 | 5 | Hem-vyn K1–K10 | Medel — tio steg, doket bär bara utfallen |
| 9 | S83 | 5 | Eventväljaren, anmälningsvyn, INSTANT-kravet | **Hög** — externt granskningsdok visar hur destillerat doket är |
| 10 | S73 | 4 | Eventdetaljsidan, 72 iterationer | **Mycket hög** — 72 varv mot 4 bevarade citat |
| 11 | S93 | 3 | Hållplats-prototypen, facit-haveriet | Redan delvis skördat (se § inventering) |
| 12 | S104 | 3 | Segmentbyggarens dukning | Låg–medel |
| 13 | S109 | 3 | Notisfamiljen, personlistans sök | Medel |
| 14–27 | S52, S62, S64, S67, S76, S81, S86, S91, S92, S96, S105, S110, S117, S122 | 1–2 vardera | Spridda | Låg |

**Rekommenderad ordning för transkript-passet:** S108 → S121 → S113 → S107 →
S73 → S100 → S83. De sju bär **89 av bankens 136 citat** (65 %) och innehåller
varenda session med tvåsiffrigt varvtal. S73 ligger på plats fem trots bara
fyra bevarade citat, eftersom kvoten varv-till-citat där är den sämsta i hela
korpusen (72 iterationer, 4 citat) — det är den starkaste enskilda indikatorn
på destillationsförlust jag kunde mäta.

## Vad jag inte kunde belägga

- **Att banken är fullständig.** Den är ett golv. Sessionsdoken är destillat,
  och den enda mätning som finns av destillationsförlusten
  (`prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md` § Läsanvisning)
  visade att fem av tretton transkript-citat saknades HELT i sessionsdoket.
  Extrapolerat vore den sanna volymen väsentligt högre — men jag har inte mätt
  förlusten för någon annan session än S93, så jag anger ingen siffra.
- **Att klass-frekvensen speglar Marcus faktiska prioritering.** Frekvens i
  ett destillat mäter vad SKRIBENTEN valde att bevara, inte vad Marcus sade
  oftast. En klass som är lätt att sammanfatta (*"alla kort lika höga"*) kan
  vara överrepresenterad mot en som är svår (*"det är något som saknas"*).
- **Attributionen för tio citat.** Se § Osäkerheter.
- **Att någon av de tio reglerna faktiskt minskar defekterna.** Ingen mätning
  finns. Reglerna är härledda ur klagomål, inte prövade mot utfall.
- **Datum och tidpunkt för de enskilda citaten.** Sessionsdoken daterar
  Delar och pass, sällan enskilda repliker. Jag har därför ingen tidsaxel
  inom en session — bara sessionsordningen.
- **Om `T143`:s hypotes om grund-checklistan har prövats.** Tråden står
  `paused` utan kort och utan resultat; jag hittade inget belägg för att någon
  checklista byggts eller mätts.

## Osäkerheter — citat jag inte kunde klassa entydigt

| Citat | Fil:rad | Varför osäkert |
|---|---|---|
| *"Genom att analysera transkripten … komponenter används inte."* (B-001) | `tasks/sessions/2026-09-05-session-122.md:27` | Bär **sex** klasser samtidigt (sidkrom, konsekvens, kortgeometri, knappar, copy, komponent). Klassad på sin första namngivna defekt; varje annan klass har lika god anspråksgrund |
| *"Ett ögonblick Marcus, bilagan skapas och visas här om några sekunder."* (B-113) | `tasks/sessions/2026-08-29-session-113.md:41` | Doket skriver *"Marcus vill ha"* — det är alltså önskad COPY som Marcus formulerat, inte en pushback. Kan lika gärna höra till `copy-hjalptext` |
| *"fast mycket snyggare"* | `tasks/sessions/archive/2026-08/2026-08-10-session-103.md:991` | Citatet är inbäddat i en mening som blandar dokets egen prosa med Marcus ord; jag kunde inte avgränsa var citatet börjar. UTELÄMNAT ur banken |
| *"Det är INGEN skillnad."* (B-105) | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:1754` | Kan vara en mätobservation (tomrummet flyttade) eller en dom om att ändringen var meningslös |
| *"Ändrade inte tillbaka färgen"* (B-039) | `tasks/sessions/archive/2026-07/2026-07-06-session-55.md:408` | Doket förklarar det som en UPPLEVELSE Marcus hade, inte en instruktion. Klassad som typografi eftersom förklaringen är vikt- och ytkontext, inte färg |
| *"zebra riven, belagt av Marcus öga plus research-pass med fem designsystem"* (B-057) | `tasks/sessions/archive/2026-08/2026-08-10-session-104.md:362` | Detta är en kadensrad SKRIVEN AV CODE som refererar Marcus dom, inte Marcus ord. Behållen för att domen är otvetydig, men den är **inte verbatim Marcus** |
| *"det är inte vad jag ser, vilken personlista tittar du på?"* | `tasks/sessions/archive/2026-08/2026-08-10-session-103.md:198` | Process eller form? Den fångar att Code beskrev en yta han inte sett — samma klass som B-115. UTELÄMNAD som dubblett |
| *"Det ska alltid överallt heta Steg, aldrig Nivå"* (B-050) | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:288` | Copy eller ordlista? Kan höra hemma i `ORDLISTA.md`-disciplinen snarare än i en designcheck |
| *"aldrig 50 fristående kort per person"* (B-020) | `tasks/sessions/archive/2026-08/2026-08-10-session-103.md:182` | Doket skriver *"k03:s Marcus-lås säger"* — citatformen är plain, inte kursiv, och kan vara Codes sammanfattning av låset snarare än Marcus ord |
| *"Vi får inte låsa oss vid befintligt formspråk, OM vi behöver etablera något nytt … så gör vi det."* (B-075) | `tasks/sessions/archive/2026-08/2026-08-20-session-108.md:390` | Är en MOTVIKT mot klassens övriga citat. Om banken används som checklista måste denna rad följa med, annars blir regel 8 hårdare än Marcus avsett |

## Rekommendation

**Detta är en rekommendation, inte ett beslut.**

1. **Dela banken i två artefakter, inte en.** Reglerna 1–5 (mekaniska eller
   halvmekaniska) hör hemma i **granskarens checklista**, där de kan prövas
   mot en namngiven referensvy eller en mätning. Reglerna 6–10 hör hemma i
   **byggarens prompt**, där de påverkar vad som produceras. En enda lista
   som ska göra båda blir för lång för att laddas och för vag för att grinda.
2. **Ge regel 1 en obligatorisk fältform i prototyp-uppdraget.** Varje
   UI-prototyp bör tvingas namnge sin referensyta (*"denna yta ärver form
   från X"*) innan bygget startar. Elva av sexton citat i klassens tyngsta
   kategori hade förebyggts av det fältet ensamt.
3. **Låt B-075 stå bredvid regel 8 i varje form banken tar.** En checklista
   som bara bär *"återanvänd"* utan *"nytt får etableras med avsikt"* skapar
   nästa klagomålsklass i stället för att stänga den nuvarande.
4. **Kör transkript-passet i ordningen S108 → S121 → S73** och slå ihop
   utfallet med denna bank på ID-nivå. Klassnamnen i denna fil är valda för
   att vara mekaniskt sammanslagbara.
5. **Mät före och efter.** Banken är härledd ur klagomål. Om regelmängden
   laddas i byggarens prompt bör antalet konvergensvarv per prototyp mätas
   före och efter — det är den enda siffra som säger om destillationen
   fungerade. Bankens egna tal ger baslinjen: 72 varv (S73), 16 varv (S108),
   13 varv (S121), 10 varv (S55).

## Källförteckning

**Primärkällor — sessionsdok (34 filer bidrar med citat).** Samtliga citat
bär fil och radnummer i sin bankrad; sökvägarna är relativa till repo-roten
och listas inte om här.

**Repo-interna beslut och lärdomar, lästa i sin helhet:**

- [`ADR-102` — prototypen är facit, skarpa ska vara identisk](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
- [`ADR-103` — promoveringsformen](../decisions/ADR-103-promoveringsformen-prototypen-promoveras-skarpa-bygget-avskaffas.md)
- [`ADR-074` — prototyp-substratets adress, struktur och växlar](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md)
- [`tasks/lessons/vol-03.md`](../../tasks/lessons/vol-03.md) — `L220`, `L237`, `L247`
- [`tasks/lessons/vol-04.md`](../../tasks/lessons/vol-04.md) — `L269`, `L310`
- [`tasks/lessons/vol-07.md`](../../tasks/lessons/vol-07.md) — `L592`
- [`tasks/threads/README.md`](../../tasks/threads/README.md) — `T65` (rad 108), `T66` (rad 109), `T90` (rad 133), `T143` (rad 186)

**Befintliga research-pass, lästa:**

- [`prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md`](prototyp-till-skarp-processaudit-tidslinje-2026-08-08.md) — den enda befintliga citat-banken; § *Marcus egna ord* rad 858–962
- [`ui-prototyp-till-produktion-frontier-processer-2026-08-08.md`](ui-prototyp-till-produktion-frontier-processer-2026-08-08.md)
- [`first-principles-dekonstruktion-prototyp-till-skarp-2026-08-08.md`](first-principles-dekonstruktion-prototyp-till-skarp-2026-08-08.md)
- [`eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md)

**Externa källor:** inga. Detta pass är en intern korpusundersökning; varje
påstående vilar på repots egna filer. Ingen branschprecedent har hämtats och
ingen sådan påstås.
