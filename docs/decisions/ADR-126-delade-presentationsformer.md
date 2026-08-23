# ADR-126: Delade presentationsformer — en form som bärs av flera ytor bor i biblioteket

- **Status:** Accepted (Marcus GO 2026-08-22 vid grillningens sju beslut,
  `TASK-299` § Implementationsbeslut; ADR-baren prövad öppet i samma pass, se
  § Kontext)
- **Datum:** 2026-08-23
- **Fas:** Fas 6 (go-live-förberedelse)
- **Rör:** `src/components/primitives/SidRam.tsx` ·
  `src/components/primitives/InitialAvatar.tsx` · Mer-familjens fem sidor ·
  `src/components/persons/PersonDetail.tsx` ·
  `src/components/events/EventCheckin.tsx` ·
  `docs/specs/DESIGN-SYSTEM-SPEC.md` § 23 · `TASK-299` (PRD) med skivorna
  `299.1`, `299.6`–`299.9`, `299.11`
- **Relation till tidigare beslut:** supersederar INGET. Kompletterar
  [`ADR-102`](ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md) (prototypen ÄR facit — en
  stämplad form byggs aldrig om, den FLYTTAS; denna ADR säger VART) och
  [`ADR-103`](ADR-103-promoveringsformen-prototypen-promoveras-skarpa-bygget-avskaffas.md) (promoveringskontraktet —
  vägen in, regressionslåset, och rivningen som tar växlar men aldrig form).
  Systerbeslut till [`ADR-121`](ADR-121-notistrappan-form-per-klass-i-notisfamiljen.md)
  och [`ADR-122`](ADR-122-eventlankens-vakt-och-atgardskon.md): samma
  arbetsform — en app-bred formfamilj får en styrande spec-paragraf och en
  utskriven familjegräns. Bygger på
  [`ADR-100`](ADR-100-sanningshierarkin-koden-ager-beteendet.md) §1 (exakt en
  auktoritativ källa per kunskapsklass) genom att tillämpa samma princip på
  presentationsformer i stället för på dokument.

---

## Kontext

### Frågan uppstod ur en mätning, inte ur en idé

Grillningen inför `TASK-299` (S111 Del 2, 2026-08-22) skulle avgöra
anmälningssidans form. Faktainsamlingen före första frågan fällde kortets egen
faktabas på tre punkter och avtäckte något större än sidan:

**Appen bar TVÅ oförenliga sidram-dialekter, BÅDA facit-stämplade.**

| Dialekt | Instanser vid mätningen | Form |
|---|---|---|
| **inset** | `AktivitetsHistorik:756`, `DokumentYta:383` | chevron utan `mx-4`, header utan `px-4` — allt på `<main>`s 16 px |
| **kant-i-kant** | `PersonDetail:1621`, `ManuellAnmalanForm:154/304`, `EventCheckin:942`, `AtgardsSida:1910` | chevron `mx-4`, header `px-4`, kortytan kant i kant |

Mer-familjens fem sidor bar dessutom en **tredje**, äldre form: `p-4` ovanpå
`<main>`s `px-4` (32 px), textlänk i stället för chevron, `text-2xl`.

### Koden bar tre motstridiga SKRIVNA ställningstaganden

Det är detta som lyfter frågan över ADR-baren, inte antalet kopior:

1. `DokumentYta.tsx:58` kallade den andra dialekten ett **`dubbleringsfel`**.
2. `AtgardsSida.tsx` bar Marcus eget citat från 2026-08-07 om att formen
   **ska** kopieras, och beskriver sitt sidhuvud som `ManuellAnmalanForm`
   § `Sidhuvud` *"klass för klass"* — en avsiktlig kopia, nedskriven som
   avsiktlig.
3. `PersonMiniKort` bar villkoret *"promoveras till `primitives/` vid andra
   konsumenten"* och `PersonsList:1046` sade *"Personlistan ÄR den andra"* —
   ett eget uppfyllt villkor som ändå inte utlöst något lyft.

Samma splittring fanns i initialcirkeln: **sju byte-identiska renderingar** av
samma klass-sträng och **sex kopior** av initialer-hjälparen.

Två stämplade ytor läste alltså huset åt motsatt håll, och **`DESIGN-SYSTEM-SPEC.md`
saknade sidram-sektion helt** — § 14 täckte `NavCard`, ingenting täckte
sidramen. Följden, ordagrant ur PRD:n: *varje ny yta väljer sida utan att
frågan ställts.*

### ADR-baren, prövad öppet (S111 Del 2 § C)

Baren (`~/.claude/CLAUDE.md` § ADR-BAR) kräver alla tre villkoren:

- **Svår att återställa** — i koherens, inte i kod. Varje framtida yta byggs
  ovanpå svaret; en yta som valt fel dialekt blir en stämplad yta som måste
  amenderas för att rättas (vilket `TASK-299.11` och `TASK-299.6` fick göra
  för fyra ytor).
- **Överraskande utan kontext** — koden bar tre motstridiga skrivna positioner
  (ovan). En läsare som bara hittar en av dem drar fel slutsats med gott
  samvete.
- **Verklig avvägning** — två dialekter levde parallellt med DOKUMENTERAD
  oenighet, och den ena hade fler bärare medan den andra hade den nyare
  kodkommentaren på sin sida.

Marcus kvitterade grillningens sju beslut samma dag. **Initialcirkeln får
INGEN egen ADR** — den är samma beslut i en andra skepnad, och det är just
generaliteten som gör posten värd ett nummer.

### Numreringens historia, bokförd för att den varit fel tre gånger

Både `TASK-299`s PRD, `TASK-299.2`s notes och `SidRam.tsx`s docblock kallar
detta beslut **`ADR-124`**. Det numret var ledigt när de skrevs — `ADR-102`
§ Updates 2026-08-22 slår uttryckligen fast det två gånger (*"`ADR-124` är
därmed inte mintad — nästa lediga nummer är oförbrukat"*). Under tiden mintade
S108 `ADR-124` för förhandsgranskningens leveransväg och S108 därefter
`ADR-125` för bilagornas modell. Numret här är **disk-verifierat mot
`origin/main` 2026-08-23** (`git ls-tree --name-only origin/main
docs/decisions/` → högsta `ADR-125`). De hängande `ADR-124`-referenserna i
`SidRam.tsx` och `src/routes/dev/primitives.tsx` rättas i samma landning som
denna ADR; referenser i sessionsdok och kortnotes lämnas som historik.

---

## Beslut

### B1. En presentationsform som bärs av mer än en yta bor i biblioteket

**Regeln, i en mening:** *bär två eller flera ytor samma presentationsform,
har formen en hemvist i `src/components/primitives/` — inte en kopia per yta.*

Tröskeln är **två**, inte tre, och avvikelsen från branschnormen är medveten —
se § Alternativ, alternativ 2. Skälet är husets storlek: `EightShapes`
rule-of-three är skriven för ett designsystem som betjänar flera PRODUKTER med
egna team, medan detta hus är en app plus ett bibliotek som ännu inte har en
andra konsument. Vid tre hade sidramen fått vänta tills sex kopior fanns —
vilket är exakt vad som hände.

### B2. Kopiering är tillåtet, men aldrig TYST

En kopia får finnas — men den ska bära ett skrivet skäl på plats, och skälet
ska vara ett annat än "det gick fortare". Motsatsen är det som mättes: tre
skrivna ställningstaganden som pekade åt olika håll, alla i god tro.

**En kodkommentar som förklarar duplicering av en presentationsform som
avsiktlig är ett FYND, inte en förklaring.** Den ska prövas mot B1 när den
påträffas, och rivas öppet i samma landning som lyftet om den inte håller —
aldrig lämnas kvar bredvid en delad primitiv och påstå motsatsen. Detta
utfördes i `TASK-299.1` (PRD `TASK-299` beslut 8).

### B3. Det som lyfts är KÄRNAN, inte hela formen

En delad primitiv smalnas till den del som faktiskt är gemensam. Den delen som
bara en yta behöver stannar hos den ytan.

Tillämpat på sidramen: Marcus låste **bara sidkromet** (chevronen); rubriken
lever kvar i varje sida (`TASK-299.2`, 2026-08-22). Grunden var mätt, inte
tyckt — den rubrik-ägande grenen hade **noll konsumenter**, och att bredda en
primitiv senare är billigt medan att smalna av den betyder att plocka isär
varje konsument. Samma asymmetri gäller generellt och är därför regel, inte
ett engångsval.

Följden är att en primitiv kan bära en gren som ingen skarp yta använder. Den
grenen ska då renderas och tillgänglighetsprövas på `/dev/primitives`, aldrig
enbart existera otestad.

### B4. Lyftet är en FLYTT, inte en ombyggnad

Formen som lyfts är den som redan lever — klass för klass, samma DOM, samma
tillgängliga namn. En stämplad ytas form byggs aldrig om i lyftet
(`ADR-102` B1); den flyttar hemvist.

Det gör lyftet **mekaniskt bevisbart**: promoverings-grindens
`ariaSnapshot`-referenser (`ADR-103` B4) fångas ur den gamla formen och ska
vara gröna mot den nya UTAN om-baselinjering. Mätt på båda de rena
lyften — `TASK-299.6` gav 8/8 + 26/26 gröna, exit 0, mot orörda referenser.

Är formen inte identisk är det inte ett lyft utan en formändring, och då
gäller `ADR-102` § A1 klass (c): Marcus omstämpling, inte agentens omdöme.

### B5. Familjegränsen skrivs ned SAMTIDIGT som formen delas

En delad form utan utskriven gräns sprider sig till ytor den inte hör hemma
på. Varje delad presentationsform ska därför ha en paragraf i
`DESIGN-SYSTEM-SPEC.md` som säger **vilka ytklasser som bär den och vilka som
inte gör det, med skälet**.

Detta är inte en administrativ extrauppgift utan beslutets bärande halva:
frånvaron av en sådan paragraf är den DIAGNOSTISERADE orsaken till att två
dialekter kunde divergera obemärkt. Sidramens paragraf är
`DESIGN-SYSTEM-SPEC.md` § 23, skriven i samma landning som denna ADR.

---

## Alternativ som övervägdes

**1. Låt dialekterna leva; välj per yta.** Förkastat. Det är status quo, och
status quo hade producerat två stämplade ytor med motsatt skriven läsning av
samma fråga. Att lägga till anmälningssidan hade gjort den till en tredje
konsument av den ena dialekten — defekten hade fått sällskap i stället för att
lösas (`TASK-299.2`s egen formulering av valet).

**2. Rule of three — lyft först vid tredje konsumenten.** Branschnormen
(EightShapes/Nathan Curtis: *"if a component is useful to 3 products, it's a
good candidate for the system"*). Förkastat SOM TRÖSKEL men behållet som
princip: dess andra halva — *"reduce scope to a relevant essence useful across
products"* — är precis B3. Skälet att sänka till två är mätt i detta hus:
sidramen nådde SEX kopior innan någon lyfte den, och initialcirkeln SJU. En
tröskel som inte utlöser är ingen tröskel.

**3. En bredare `<Layout>`-komponent som äger hela sidan.** Förkastat mot
`~/.claude/CLAUDE.md` § dubbelriktad över-engineering-vakt: ingen abstraktion
utan faktisk nuvarande användare. Marcus låste bara sidkromet, och ytorna
under kromet är genuint olika (en scanlista, ett formulär, en dörrlista med
kvittensfönster). `PersonDetail.tsx`s eget docblock hade redan dragit samma
slutsats i prototypfasen: *"Allt under headern är variantens eget: ingen delad
`<Layout>`."*

**4. Lös det i en kodstandard i stället för en ADR.** Förkastat mot
ADR-baren ovan — punkt 2 (överraskande utan kontext) och punkt 3 (verklig
avvägning) håller båda, och en kodstandard bär inte VARFÖR-et som gör en
framtida läsare kapabel att avgöra ett nytt fall.

---

## Precedent — fyra externa, sökta och citerade

Hub-CLAUDE.md kräver 3+ branschledar-precedent för en arkitektur-ADR.
Rymden är här **inte** tunn; fyra hittades, och två av dem talar direkt till
tröskelfrågan.

1. **IBM Carbon Design System — UI Shell.** *"A shell is a collection of
   components shared by all products within a platform. It provides a common
   set of interaction patterns that persist between and across products."*
   Sidkromet är exakt en sådan delad ram, och Carbon behandlar den som EN
   komponentfamilj i systemet, inte som en form varje produkt återskapar.
   ([carbondesignsystem.com](https://carbondesignsystem.com/components/UI-shell-header/usage/))

2. **Shopify Polaris — `Page`.** Komponenten *"is used to build the outer
   wrapper of a page, including the page title and associated actions"*, med
   **`backAction`** som en förstklassig prop. Tillbaka-navigeringen är alltså
   systematiserad i sidramen hos en branschledare, inte lämnad åt varje sida —
   samma val som B1 gör här. Polaris skiljer dessutom `backAction` från
   `title` som separata props, vilket är precis den axel B3 delar på.
   ([polaris-react.shopify.com](https://polaris-react.shopify.com/components/layout-and-structure/page))

3. **GOV.UK Design System — bidragskriterierna.** För att tas in krävs
   **Useful** (*"There is evidence that this component or pattern would be
   useful for many teams or services"*) och **Unique** (*"It does not
   replicate something already in the Design System"*). Unique-kriteriet är
   B1:s spegelbild: två parallella dialekter av samma form är per definition
   en replikering, och GOV.UK stänger dörren för den. Publiceringskriteriet
   **Consistent** (*"reuses existing Design System styles and components"*)
   bär B4:s flytt-över-ombyggnad.
   ([design-system.service.gov.uk](https://design-system.service.gov.uk/community/contribution-criteria/))

4. **EightShapes / Nathan Curtis — bidragskriterier och rule of three.**
   Tröskeln *"useful to 3 products"*, med tillägget att bidraget ofta måste
   *"reduce scope to a relevant essence useful across products"*. Denna ADR
   **avviker medvetet** på tröskeln (två, inte tre — § Alternativ 2) och
   **följer** på essensen (B3).
   ([medium.com/eightshapes-llc](https://medium.com/eightshapes-llc/i-made-this-does-it-go-in-the-system-3b67b9894531))

**Vad precedenten INTE ger:** ingen av de fyra uttalar sig om vad man gör med
en form som redan är GODKÄND och stämplad på flera ytor när lyftet sker. Den
frågan är husets egen och besvaras av `ADR-102` § A1–A3 (amenderings-mekaniken)
plus B4 ovan, inte av branschen. Det är utskrivet i stället för att döljas i
en citatlista.

---

## Konsekvenser

### Vad som gäller framåt

- **Vid andra konsumenten av en presentationsform: lyft, inte kopiera.**
  Träffar du en form du är på väg att kopiera en andra gång är B1 utlöst.
- **En kopia kräver ett skrivet skäl** som inte är bekvämlighet (B2).
- **Ett lyft ska bevisas som flytt** med promoverings-grindens orörda
  referenser (B4); är de inte gröna är det en formändring och `ADR-102`
  § A1 gäller.
- **Varje delad form får sin spec-paragraf med familjegräns** (B5).

### Vad som är gjort

| Instans | Hemvist | Landning |
|---|---|---|
| Sidkromet (`SidRam`) | `primitives/SidRam.tsx` | `TASK-299.1` (`24238b1c`) |
| Initialcirkeln (`InitialAvatar`) | `primitives/InitialAvatar.tsx` | `TASK-299.1` (`24238b1c`) |
| Promovering, Mer-familjens fem sidor | — | `TASK-299.7`/`.8`/`.9` |
| Promovering, de två dialekt-ytorna | — | `TASK-299.11` (`cbe2a8d4`) |
| Promovering, persondetalj + check-in | — | `TASK-299.6` |
| Spec-paragrafen | `DESIGN-SYSTEM-SPEC.md` § 23 | `TASK-299.6` |

### Kvarvarande kopior — mätt 2026-08-23, medvetet INTE lösta här

Klass-strängen `mx-4 flex size-11 shrink-0 items-center justify-center
self-start rounded-full bg-bg-muted` finns i **sju** filer på denna commit.
En är primitiven själv. De sex övriga är:

| Fil | Läge |
|---|---|
| `src/components/events/EventDetail.tsx` | skarp, inline `sidRam`-hjälpare |
| `src/components/events/ManuellAnmalanForm.tsx` | skarp, via `Sidhuvud` |
| `src/components/events/atgarder/AtgardsSida.tsx` | skarp, via EGEN `Sidhuvud` — *"klass för klass"* kopierad från föregående rad |
| `src/components/event/CreateEventForm.tsx` | skarp, inline |
| `src/components/registrations/AnmalanDetail.tsx` | skarp, inline |
| `src/components/segment/prototyp/VariantD.tsx` | prototypyta med en EGEN lokal `function SidRam` + `TILLBAKA_KLASS`-konstant, som aldrig importerar primitiven |

Dessa är **utanför `TASK-299`s omfattning** och rivs inte här, av det skäl PRD
`TASK-299` beslut 7 anger för initialcirkelns sex inline-renderingar: de sitter
i facit-stämplade filer, och migreringen blir riskfri först när de fått
visuella vakter. **Att de står uppräknade är poängen** — B2 kräver att en
kvarvarande kopia är synlig och motiverad, inte tyst.

Två av raderna förtjänar en anmärkning. `AtgardsSida`s `Sidhuvud` är en
NEDSKRIVEN kopia av `ManuellAnmalanForm`s — den kopia B2 talar om. Och
`VariantD`s lokala `SidRam` delar namn med primitiven utan att vara den, vilket
är den värsta varianten: en grep efter `SidRam` ger en falsk träff som ser ut
som en konsument.

### Vad detta beslut INTE gör

- Det säger ingenting om **beteende-abstraktioner** (hooks, datavägar).
  Datalagrets regler bor i `ADR-055`/`ADR-057`; detta är presentationsformer.
- Det inför **ingen mekanisk grind**. Ingen check fäller på en sjunde kopia av
  en klass-sträng, och prosan påstår därför inte att någon gör det
  (`ADR-083`). Det som finns är promoverings-grindarna, som bevisar att ett
  UTFÖRT lyft är en flytt — inte att ett lyft borde ha skett. Regeln är
  konvention, buren av diff-granskningen och av § 23:s familjegräns.
- Det avgör inte **`text-2xl` mot `text-3xl`** i familjens rubriker — en mätt
  divergens som § 23 skriver ut som en öppen punkt.
