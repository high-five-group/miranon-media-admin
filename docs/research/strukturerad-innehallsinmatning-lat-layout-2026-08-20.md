---
owner: marcus803
updated: 2026-08-20
review_by: 2026-11-20
status: draft
---

# Strukturerad innehållsinmatning i en låst mall-layout — branschmönster för kursagendans rad+attribut (Code, 2026-08-20)

> **Proveniens:** avgränsat research-pass (`marcus-system:research`-skillen),
> kört OISOLERAT i huvudkatalogen på `miranon-media-admin`
> (`.claude/worktrees/s108-bilagesparet`, gren `docs/s108-fodelse`),
> committar aldrig. **Modell:** exakt rad ur egen systemprompt — *"You are
> powered by the model named Sonnet 5. The exact model ID is
> claude-sonnet-5."*
>
> **Läst i sin helhet innan något nytt söktes:** `docs/decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md`
> (renderingsväg, DocRaptor), `ADR-118-bilagors-rackviddsmodell.md`
> (räckvidd, ortogonalt mot denna fråga), `ADR-108-presentationsmeningen-stannar-i-basen.md`
> (angränsande precedent — VAR den sista språkliga sammansättningen hör
> hemma; se § Delfråga 4 nedan för återanvändning), `docs/mallar/bilagor/bekraftelsebilaga.html`
> och `docs/mallar/bilagor/README.md` (`TASK-279`) samt fixture-JSON:en.
> Ingen ADR eller lesson avgör frågan i uppdraget — Session 108:s eget
> sessionsdok (`tasks/sessions/2026-08-20-session-108.md`) har vid
> passets start endast **Del 1** skriven; ingen grillnings-Del med
> kandidaterna A/B/C existerar ännu på disk. Frågan är alltså genuint
> öppen, inte redan avgjord.
>
> **Vad som är nytt i detta pass:** en branschkartläggning av fem
> dokumentmallverktyg (Carbone, CraftMyPDF, APITemplate.io, PandaDoc,
> Documint — vår NÄRMASTE peer-kategori: verktyg vars hela syfte är
> "låst mall + redigerbart innehåll → PDF") och en separat kartläggning
> av precedent/felmoder för AUTOMATISK textbaserad formatering (Notion,
> TipTap/ProseMirror, Excel/gennamn-autokorrigeringen, "magic string"-
> antimönstret, WordPress `wptexturize`). En tredje spårgren (headless-
> CMS-precedent: Sanity Portable Text, WordPress Gutenberg block-API +
> block locking, Storyblok Bloks, Contentful) **uteblev** — se § Vad
> detta pass INTE hann.

## Kort svar

**Ingen av de tre kandidaterna A/B/C stöds branschen exakt som
formulerade — men underlaget pekar tydligt mot en modifierad B.**

Det starkaste, mest samstämmiga fyndet i hela passet: **noll av de fem
undersökta dokumentmallverktygen härleder formatering genom att läsa och
tolka fri text.** Samtliga (Carbone, CraftMyPDF, APITemplate.io,
PandaDoc, Documint) styr villkorad formatering via ett **explicit,
namngivet datafält** — aldrig genom att systemet gissar betydelse ur en
etikett användaren skrivit för att LÄSAS. Detta talar direkt emot vår
föreslagna "Meditation"-regel i dess nuvarande form (rader som börjar med
ordet "Meditation" färgas automatiskt), och stärks oberoende av det
starkaste enskilda beviset i hela passet: den peer-granskade
dokumentationen av att Excel tyst tolkade gennamn (`SEPT2`, `MARCH1`) som
datum, ett fel som var så utbrett och svårupptäckt att HGNC till slut
bytte namn på generna för att fly mönstret (Ziemann et al., *Genome
Biology* 2016).

**Rekommendation (se § Rekommendation för fullt resonemang och
konfidensgrad):** en rad-lista med fasta, namngivna fält per rad (B:s
grundstruktur: text + valfri tid) — men **ersätt textsniffnings-
mekanismen** för färgning med ett tredje, EXPLICIT fält (t.ex. en
kryssruta "Är detta en meditation?" eller en enkel typ-väljare), i stället
för att låta systemet läsa ordet "Meditation" ur fritexten. Detta lånar B:s
fasta radschema (låser layouten — ingen fri typväljare som i C) men
adopterar den explicithet C:s "typval per rad" är ute efter, fast
begränsad till EN liten, namngiven flagga snarare än en full editor.
**Konfidensgraden på denna rekommendation är MODERAT, inte hög** — den
vilar helt på dokumentmallverktygens precedent (Delfråga 1–2 är endast
DELVIS täckta; se nedan) eftersom den bredare headless-CMS-halvan av
underlaget (Sanity, Gutenberg, Storyblok, Contentful) aldrig kom in i
detta pass.

## Delfråga 1 — Dominerande inmatningsform per innehållsklass (DELVIS besvarad)

**Dokumentmallverktygens halva: BESVARAD, fem system.**

- **Carbone** — listor byggs som JSON-array-loopar i mallen
  (`{d.list[i].namn}`), stöds i DOCX/HTML/MD. Ingen no-code-inmatningsyta
  för icke-tekniska slutanvändare hittades i förstapartsdokumentationen —
  datan är utvecklarstyrd JSON, mallen är den låsta layouten.
  <https://carbone.io/documentation/design/repetitions/with-arrays.html>
- **CraftMyPDF** — en "Simple Table"-komponent binds till en JSON-array;
  celler nås via `row["fältnamn"]`, konfigureras i en visuell
  egenskapspanel (header/cell-inställningar). <https://support.craftmypdf.com/component-simple-table>
- **APITemplate.io** — loopar via Jinja2 (`{% for item in items %}`) i
  HTML-mallen, plus en visuell mall-editor riktad mot icke-utvecklare.
  <https://apitemplate.io/docs/pdf-generation/html-template-editor/>
- **PandaDoc** — villkorat innehåll ("Smart Content Block") konfigureras
  via en GUIDAD DROPDOWN-yta mot explicita variabler/pristabellkolumner
  (`equal`/`contains`/`empty` m.fl.) — ingen kod, inget fritt fält.
  <https://support.pandadoc.com/en/articles/9714634-smart-content-block-conditional-content>
- **Documint** — dynamiska tabeller + en visuell "Conditions Editor"/
  "Logic Editor": användaren pekar ut elementet (rad, text, sektion) och
  sätter ett villkor mot ETT namngivet datafält via en "Edit Logic"-knapp.
  Fields Editor är uttryckligen byggd för att icke-tekniska användare
  ska slippa röra JSON/schema-syntax. <https://docs.documint.me/templates/page-elements/conditional-logic>

**Mönster (fem av fem):** den underliggande datan är alltid strukturerad
(JSON-array med namngivna fält), och den icke-tekniska inmatningsytan är
alltid ett FORMULÄR eller en visuell konfigurationsyta ovanpå den
strukturen — aldrig fri prosa som mallen sedan tolkar.

**Headless-CMS-halvan (Sanity Portable Text, WordPress Gutenberg block-
API + block locking, Storyblok Bloks-fält, Contentful array-fält):
OTÄCKT.** Den fork som skulle undersöka detta returnerade aldrig ett
resultat innan passet avslutades på orkestrerarens direktiv — se § Vad
detta pass INTE hann. Detta är den enskilt viktigaste luckan i passet,
eftersom den skulle ha gett den andra halvan av "vad är dominerande
efter användargrupp" — särskilt frågan om WordPress `templateLock`/
block-nivå-lås är ett namngivet, etablerat sätt att låsa LAYOUT medan
INNEHÅLL förblir redigerbart, vilket är exakt vår situation.

## Delfråga 2 — Valfria attribut per rad utan teknisk inmatning (DELVIS besvarad)

**Dokumentmallverktygens halva: BESVARAD.**

- Carbone hanterar ett valfritt fält (t.ex. vår `tid`) via en explicit,
  NAMNGIVEN fält-check: `{d.tid:ifEM():show('N/A'):elseShow(d.tid)}` —
  villkoret pekar på fältnamnet, aldrig på textinnehållet.
  <https://carbone.io/documentation/design/conditions/overview.html>
- Documints Conditions Editor löser samma sak visuellt: villkoret
  skrivs mot ett namngivet datafält (exempel ur dokumentationen:
  `grand_total >= 15000`), inte mot fri text. <https://docs.documint.me/templates/page-elements/conditional-logic>
- PandaDocs Smart Content-block stödjer `empty`/`contains` som
  jämförelseoperator, men regeln är alltid en av användaren SYNLIGT vald
  och redigerbar konfiguration i en dropdown — inte en dold
  systemheuristik. <https://support.pandadoc.com/en/articles/9714634-smart-content-block-conditional-content>

**Mönster:** ett valfritt attribut hanteras som ett fält som FÅR VARA
TOMT, med en explicit visningsregel för det tomma fallet — aldrig genom
att systemet gissar om attributet "finns" genom att söka i texten.

**CMS-halvan (hur Sanity/Contentful UI:t visar/döljer ett valfritt fält i
ett objekt-schema för en icke-teknisk redaktör): OTÄCKT**, av samma skäl
som Delfråga 1.

## Delfråga 3 — Automatisk formatering härledd ur textens innehåll (BESVARAD)

Detta är den bäst täckta delfrågan i passet — två oberoende forskningsspår
(dokumentmallverktygen ovan + ett dedikerat spår om text-baserad
auto-formatering) pekar samstämmigt åt samma håll.

**Zoll dokumenterad förekomst av mönstret i vår peer-kategori.** Det
starkaste enskilda beviset här är Carbones eget dokumenterade
kodexempel för färgning: `{d.tests[i].result:ifEQ(ok):show(#000000):...
:color(row,text)}` — det jämför ett STRUKTURERAT `result`-fält mot ett
explicit värde, aldrig en textsniffning av en fritextetikett.
<https://carbone.io/documentation/design/advanced-features/colors.html>

**Precedent som ÄR text-triggad, men i en annan riskklass:**

- **Notion — markdown-genvägar** (`#`, `**text**`, `-` …): en omedelbar,
  SYNLIG transformation medan användaren skriver. Skiljer sig strukturellt
  från vår regel: Notions triggers är syntax-tecken användaren AKTIVT
  skriver för att BE om formatering (ett kommando maskerat som text) — inte
  en tolkning av ett vanligt ord ("Meditation") som råkar förekomma i
  innehållet. <https://www.notion.com/help/writing-and-editing-basics>
- **TipTap/ProseMirror InputRules** — samma mönsterklass (regex-triggrad
  transformation medan man skriver), men dokumentationen är rent teknisk
  och tar INGEN ställning till förutsägbarhet, synlighet eller falska
  träffar. Tunn precedent — biblioteket löser HUR, aldrig OM.
  <https://tiptap.dev/docs/editor/api/input-rules>
- **WordPress `wptexturize`** — samma mönsterklass (textbaserad
  transformation, raka→krokiga citattecken med mera) men i en LÄGRE
  riskklass (kosmetisk typografi, inte semantisk färgning/betydelse) och
  med UTTRYCKLIGA undantagszoner (`<pre>`, `<code>`) plus ett globalt
  av-läge. Branschmönstret här är "auto-transformera, men ge en explicit
  väg att stänga av eller undanta" — vår regel har ingen sådan väg.
  <https://developer.wordpress.org/reference/functions/wptexturize/>

**Det starkaste beviset MOT mönstret, oberoende av dokumentmallverktygen:**
Ziemann, Eren & El-Osta, *"Gene name errors are widespread in the
scientific literature"*, Genome Biology 2016 — Excel tolkade gennamn som
`SEPT2`/`MARCH1` som datum ("2-Sep") TYST, utan varning. Cirka en femtedel
av granskade genomik-artiklar med Excel-bilagor bar felet vid
förstamätningen; en uppföljning fann det i ~31 % av urvalet några år
senare — problemet VÄXTE trots att det var känt. HGNC bytte till slut namn
på de drabbade generna (`MARCH1`→`MARCHF1`, `SEPT1`→`SEPTIN1`) för att fly
mönstret. <https://genomebiology.biomedcentral.com/articles/10.1186/s13059-016-1044-7>
(även <https://pubmed.ncbi.nlm.nih.gov/27552985/>). Detta är den starkast
belagda varningen mot att låta systemet gissa betydelse ur fri text:
felet är **tyst, kumulativt och syns inte förrän någon aktivt letar** —
exakt den felmod en oskyddad "Meditation"-regel bär (en framtida
kursagenda-rad med ordet "meditation" i en annan böjningsform, gemener,
eller i ett sammanhang där färgningen INTE var avsedd, skulle tystas
färgas eller inte färgas utan att någon märker det förrän dokumentet är
skickat).

**Namngivet antimönster:** Wikipedias "Magic string"-artikel namnger
exakt detta som ett antimönster — systembeteende styrt av att matcha på
oskyddad text är en genväg under tidspress, inte robust design; risk för
oavsiktlig aktivering. Rekommendationen däri är genomgående explicit
strukturerad data/flagga i stället för textmatchning.
<https://en.wikipedia.org/wiki/Magic_string>

**Visbarhet/ångra:** ingen förstapartskälla hittades som uttryckligen
FÖRESKRIVER "visa alltid vad regeln gjorde" som namngiven designprincip
— men praxis är konsekvent i den riktningen (Google Docs/Word visar en
hover-tillgänglig ångra-kontroll exakt vid den plats texten just
ändrades, <https://support.google.com/docs/answer/12022089>) och mappar
mot den allmänt vedertagna "Principle of Least Astonishment"
(<https://en.wikipedia.org/wiki/Principle_of_least_astonishment>). Vår
"Meditation"-regel körs vid RENDERING (PDF-genereringen), långt efter att
Lotta skrivit texten — hon har ingen inmatningsvy där hon ser att ordet
just färgade raden, vilket är precis den egenskap Notion och WordPress
(i sina respektive riskklasser) HAR och vår regel saknar.

## Delfråga 4 — Gränsen mellan "innehåll" och "formatering" (DELVIS, delvis återanvänd)

**Ny research för detta pass: OTÄCKT** — samma uteblivna fork som
Delfråga 1–2 skulle ha sökt efter ett namngivet mönster hos Sanity,
Gutenberg, Storyblok och Contentful specifikt för denna gräns.

**Återanvänt från befintlig, redan källbelagd intern research** (inte
nytt för detta pass, men direkt relevant och redan verifierat 2026-08-10
i `docs/research/presentationsmening-bas-eller-app-2026-08-10.md`, som
ligger bakom `ADR-108`): branschen namnger denna gräns som
**`PresentationDomainDataLayering`** (Martin Fowler, ThoughtWorks —
primärkälla) — en arkitekturprincip om att den SISTA, ytliga
sammansättningen/formateringen hör hemma närmast presentationslagret,
skild från domän- och datalagret.
<https://martinfowler.com/eaaDev/uiArchs.html> ·
<https://martinfowler.com/eaaDev/SeparatedPresentation.html>. Unicode ICU
MessageFormat (branschstandarden bakom `react-intl`/`vue-i18n`) bygger på
samma princip: en mening är EN översättningsbar/formaterbar enhet, aldrig
en konkat-kedja av rå data. <https://unicode-org.github.io/icu/userguide/format_parse/messages/>.
Contentfuls egen headless-cms-sida artikulerar samma linje för
strukturerat innehåll rakt av (förstaparts-produktsida, inte en
tredjepartsblogg): <https://www.contentful.com/headless-cms/>. GitHubs
Events API komponerar sin händelsetext i KLIENTEN, aldrig i API-svaret —
branschens mest konkreta precedent för att låta konsumenten (appen) göra
den sista, formaterande sammansättningen: <https://docs.github.com/en/rest/using-the-rest-api/github-event-types>.

**Applicerat på vår fråga:** dessa källor talar om VEM som gör den sista
formateringen (data/domän vs presentation), inte specifikt om HUR en
icke-teknisk användare matar in strukturerad listdata — det är därför
denna återanvändning ger DELVIS, inte fullt, stöd för Delfråga 4. Den
bekräftar dock indirekt samma linje som Delfråga 1–3: en "regel" (vår
färgningslogik) hör hemma som en EXPLICIT, namngiven regel i
presentationslagret (mallens CSS/logik, styrd av ett fält), inte gissad
ur datan (den fria texten) själv.

## Dom

Underlaget — även med en tredjedel av det ursprungliga uppdraget otäckt
— är samstämmigt och tillräckligt starkt på EN punkt: **"härled
formatering genom att läsa fri text" har noll dokumenterad branschprecedent
i vår peer-kategori och ETT starkt dokumenterat, allvarligt felfall
utanför den (Excel/gennamn).** Det är inte en svag slutsats trots den
uteblivna forken — den vilar på fem oberoende system i precis vår
verktygsklass plus en peer-granskad källa, inte på en enda leverantörs
dokumentation.

Underlaget är SVAGARE på den bredare frågan "vad är den dominerande
inmatningsformen för icke-tekniska användare rent generellt" (Delfråga 1),
eftersom den halva av bevisningen som skulle ha täckt allmänna
innehållshanteringssystem (till skillnad från renodlade
dokumentmallverktyg) saknas.

## Vad detta pass INTE hann

- **Sanity Portable Text** — array-av-objekt-fälttypen och dess faktiska
  redigeringsyta i Sanity Studio för en icke-teknisk redaktör. Otäckt.
- **WordPress Gutenberg Block API** — särskilt block locking
  (`templateLock`, block-nivå-lås) som en möjlig namngiven mekanism för
  "lås layouten, tillåt innehållsredigering" — direkt relevant för vårt
  krav, och OTÄCKT. Detta är den enskilt mest värdefulla luckan att
  stänga i ett uppföljande pass.
- **Storyblok Bloks-fält (nestable components)** — hur de skiljer
  redaktörens innehållsroll från utvecklarens komponent-design. Otäckt.
- **Contentful** — array-/referensfält för repeterbar strukturerad lista,
  och deras egen artikulering (utöver den enda återanvända
  produktsides-URL:en ovan) av "structured content vs. fri text"-
  filosofin. Otäckt.
- Namngivet mönster specifikt för "var går gränsen mellan innehåll och
  formatering" HOS EN HEADLESS-CMS-LEVERANTÖR SJÄLV (i motsats till
  Fowler/DDD/ICU, som är arkitektur-litteratur snarare än en
  CMS-leverantörs egen ståndpunkt) — otäckt.

**Orsak:** tre research-forks kördes parallellt (dokumentmallverktyg,
automatisk textformatering, headless-CMS-precedent). De två första
returnerade fullständiga, källbelagda resultat. Den tredje (headless-CMS)
hade inte återkommit när orkestreraren beordrade omedelbar landning med
befintligt underlag i stället för fortsatt väntan — i linje med repots
disciplin att en tunn precedent-rymd deklareras öppet snarare än väntas ut
eller fejkas. **Rekommenderat nästa steg:** ett uppföljande, smalt pass
riktat ENBART mot Sanity/Gutenberg/Storyblok/Contentful (samma
frågeställning som gavs till den uteblivna forken) skulle stänga denna
lucka utan att upprepa något av det redan klara underlaget ovan.

## Rekommendation

**Detta är en REKOMMENDATION, inte ett beslut** — grillningsbeslutet fattas
av Marcus.

1. **Avvisa A** (fritext, formatering härledd ur texten) rakt av. Noll
   branschprecedent för att en hel rads FORM (färg, kursivering) ska
   härledas genom att systemet läser och tolkar fri prosa, och det
   starkaste externa beviset (Excel/gennamn) visar att mönstret ger
   tysta, kumulativa fel.
2. **Behåll B:s radschema** (text + valfritt attribut som EGET, namngivet
   fält) — det matchar exakt mönstret i samtliga fem undersökta
   dokumentmallverktyg: strukturerad data, formulär-inmatning, inget
   fritt tolkningslager.
3. **Ersätt B:s "färg härledd automatiskt ur textinnehåll"-mekanism** med
   ett tredje, EXPLICIT fält — en kryssruta eller en liten typ-väljare
   ("Är detta en meditation?" eller en dropdown med de få kategorier som
   faktiskt förekommer: vanlig punkt / meditation). Detta är den punkt
   där uppdragets egen "Meditation"-regel (mätt hålla på 30 av 30 punkter
   i EN kurstyp, uttryckligen ett litet stickprov) bör bytas ut INNAN den
   möter fler kurstyper — stickprovets litenhet är exakt den situation
   Excel-fallet visar blir farlig i skala.
4. **C i sin renodlade form (full editor, fritt typval per rad) stöds
   INTE** av det underlag som finns — ingen av de fem dokumentmallverktygen
   ger slutanvändaren fri formvalsfrihet per rad; PandaDoc/Documints
   "explicita per-rad-logik" är en KONFIGURATIONSYTA ovanpå ett fast
   fältschema, inte en editor där användaren väljer visuell typ. Att ge
   Lotta fritt typval per rad riskerar dessutom precis det layouten ska
   skyddas mot.
5. **Konfidensgrad: MODERAT.** Punkt 1 och 3 (avvisa textsniffning) vilar
   på starkt, brett underlag (fem system + en peer-granskad källa) och
   hålls med HÖG konfidens. Punkt 2 och 4 (B:s radschema är rätt bas,
   C är fel) vilar ENDAST på dokumentmallverktygens halva av underlaget —
   den bredare CMS-precedensen som skulle ha stärkt eller nyanserat detta
   (särskilt WordPress block locking, som är den mekanism som mest direkt
   liknar "läs innehåll, lås layout") är otäckt. Ett beslut som stannar
   vid MODERAT konfidens här, snarare än att vänta in täckningen, är
   rimligt givet hur samstämmigt det befintliga underlaget redan är — men
   det är inte samma sak som fullt underlag.

## Källförteckning

- Carbone — repetitioner/arrayer: <https://carbone.io/documentation/design/repetitions/with-arrays.html>
- Carbone — villkor (`ifEM`/`elseShow`): <https://carbone.io/documentation/design/conditions/overview.html>
- Carbone — villkorad färgning: <https://carbone.io/documentation/design/advanced-features/colors.html>
- CraftMyPDF — Simple Table-komponenten: <https://support.craftmypdf.com/component-simple-table>
- APITemplate.io — HTML-mallredigeraren: <https://apitemplate.io/docs/pdf-generation/html-template-editor/>
- PandaDoc — Smart Content Block (villkorat innehåll): <https://support.pandadoc.com/en/articles/9714634-smart-content-block-conditional-content>
- Documint — villkorad logik (Conditions/Logic Editor): <https://docs.documint.me/templates/page-elements/conditional-logic>
- Notion — skrivgenvägar: <https://www.notion.com/help/writing-and-editing-basics>
- TipTap — Input Rules API: <https://tiptap.dev/docs/editor/api/input-rules>
- Ziemann, Eren, El-Osta, "Gene name errors are widespread in the scientific literature", Genome Biology 2016: <https://genomebiology.biomedcentral.com/articles/10.1186/s13059-016-1044-7> (även <https://pubmed.ncbi.nlm.nih.gov/27552985/>)
- Wikipedia — "Magic string": <https://en.wikipedia.org/wiki/Magic_string>
- WordPress Developer Reference — `wptexturize()`: <https://developer.wordpress.org/reference/functions/wptexturize/>
- Google Docs Hjälp — ångra-kontroll: <https://support.google.com/docs/answer/12022089>
- Wikipedia — "Principle of least astonishment": <https://en.wikipedia.org/wiki/Principle_of_least_astonishment>
- Martin Fowler — PresentationDomainDataLayering (återanvänd, redan verifierad 2026-08-10): <https://martinfowler.com/eaaDev/uiArchs.html>
- Martin Fowler — Separated Presentation (återanvänd): <https://martinfowler.com/eaaDev/SeparatedPresentation.html>
- Unicode ICU — MessageFormat (återanvänd): <https://unicode-org.github.io/icu/userguide/format_parse/messages/>
- Contentful — Headless CMS-produktsida (återanvänd): <https://www.contentful.com/headless-cms/>
- GitHub Docs — Events API (återanvänd): <https://docs.github.com/en/rest/using-the-rest-api/github-event-types>
- Intern: `docs/decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md`
- Intern: `docs/decisions/ADR-118-bilagors-rackviddsmodell.md`
- Intern: `docs/decisions/ADR-108-presentationsmeningen-stannar-i-basen.md`
- Intern: `docs/research/presentationsmening-bas-eller-app-2026-08-10.md`
- Intern: `docs/mallar/bilagor/bekraftelsebilaga.html`, `docs/mallar/bilagor/README.md` (`TASK-279`)

---

Arbetsträdet bär vid avslut endast denna nya fil under `docs/research/` —
inget annat rört, inget stagat, inget committat. Delfråga 1, 2 och 4 är
DELVIS täckta (headless-CMS-halvan uteblev, se § Vad detta pass INTE
hann); Delfråga 3 är fullt täckt.
