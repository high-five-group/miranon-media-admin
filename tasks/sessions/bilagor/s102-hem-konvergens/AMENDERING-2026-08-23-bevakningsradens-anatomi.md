# Amendering 2026-08-23 — bevakningsradens nya anatomi (TASK-291 + TASK-303)

**Pass:** TASK-291 (Fynd: åtgärdskö-raden på Hem är visuellt identisk med
eventinfo-raden) + TASK-303 (Fynd: bevakningsradens höjd varierar med
copyns längd), stängda av ADR-103 B2:s promoverings- och rivningspass
(`836c23a3`…`7a0575ab`, merge `b78651db`; rivningen `de810bc5`/`b8e1f30d`
på `wip/s111-marcus-iteration`).

**Berört manifest:** `tasks/sessions/bilagor/s102-hem-konvergens/facit.json`,
ytan `hem-vyn V1 "Lugna morgonen"` (godkänd 2026-08-17, citat "Hem-vyn ser
bra ut, precis som prototypen.", sha `8044e5b655dad5b3a12a4eba7fe682f88705f8e4`).

**Skäl för sidofilen, inte ett fält i manifestet:** ett stämplat manifest är
agent-fruset i sin helhet — `scripts/deny-facit-godkand-skrivning.sh`
(`ADR-104` § Beslut 2) prövar det simulerade RESULTATET av en `Edit`/`Write`
och nekar varje skrivning mot ett manifest vars resulterande `godkand` är
icke-null, oavsett om fältet självt rörs. Formen följer `ADR-102` § A3 och
precedenten `AMENDERING-2026-08-22-visuella-grinden-mot-faktisk-form.md` i
samma katalog. `godkand` är inte rörd av denna skiva.

## Föreslagen klass: **(c)** — synlig formändring i prod

`ADR-102` § A2 steg 2 ställer EN fråga: **påverkar ändringen vad en
användare ser i prod?**

**Ja, tydligt.** Bevakningsradens hela anatomi bytte form på den skarpa
`/hem`-ytan (`src/components/hem/Bevakningsrad.tsx`), inte bara en stale
testreferens:

| Egenskap | Facit 2026-08-17 (bilderna) | Skarpt läge efter TASK-291/303 |
|---|---|---|
| Radform | kolumn-grid (namn/dagar/status som tre kolumner), `line-clamp-2` + `min-h-12`, höjd kan variera | `RadInnehall` — rubrikrad + undertext, CSS-grid, höjd LÅST 70 px konstant |
| Talets placering | inbakat i meningen, ingen reserverad badge | eventinfo: kvar i meningen ("N nya saknar deltagarinfo"); åtgärdskö: flyttat till RUBRIKEN ("N kräver åtgärd") |
| Åtgärdskö-radens markör | ingen ikon, ingen visuell särskiljning mot eventinfo-raden (TASK-284.5-fyndet) | ledande `Link2Off` i fylld cirkel, tokens `--mm-atgardsko-markor-bg/-text` |
| Chevron/tid | ej centrerade mot hela raden | chevron centrerad, tid i vit pill (PersonsList `Pill`-formen) |

Detta är ADR-102 § A2 skärpning 2 ("tar ändringen bort eller döper om en
nod som finns i prod, är det klass (c) — även när borttagningen ser
harmlös ut") i sin renaste form: kolumn-griden och `line-clamp-2`-noden
som facit-bilderna visar finns inte längre i DOM:en. Klassningen är därför
inte osäker — och även om den vore det gäller "osäkerhet eskalerar
uppåt, aldrig till en gissad delmängd" (samma § A2).

## Vad som ändrades, och Marcus-grunden

**Bakgrund:** QA-fyndet TASK-284.5 (Marcus, 2026-08-22, staging) noterade
att åtgärdskö-raden var visuellt identisk med eventinfo-raden. TASK-303
(samma granskning) noterade att radens höjd varierade med copyns längd.
Båda löstes i ett kombinerat prototyp-/promoveringspass på
`wip/s111-marcus-iteration` (TASK-291-kortets Implementation Notes bär
hela mätmatrisen; upprepas inte här).

**Prototyp-godkännande** (TASK-291 kortets notes, verbatim, S111 Del 5,
2026-08-23): *"Ser bra ut. Jag godkänner bevakningsraden och
åtgärdskö-raden nu."* — läst och verifierat direkt på
`backlog/tasks/task-291`.

**Promoverad-yta-godkännande** (orkestrerarens uppdragstext till denna
skiva, fönster 3-QA, 2026-08-23, verbatim): *"Ser bra ut."* — detta citat
är KÄLLMÄRKT via orkestrerarens egen relä av en Marcus-interaktion i ett
separat konversationsfönster; till skillnad från Del 5-citatet ovan har
denna agent inte kunnat verifiera det mot en fil eller commit (inget
sessionsdok för fönster 3-QA fanns tillgängligt i denna worktree). Noteras
öppet som en HYPOTES enligt `ADR-086` tills orkestreraren själv kan peka ut
en källa för den.

**Ikonens fyllda cirkel** är Marcus egen amendering av variant A
(TASK-291 kortets notes, 2026-08-22, verbatim): *"jag tittade på
åtgärdsraden/knappen och jag tycker A är bäst, men ikonen bakgrundsfärg
kanske skulle vara knappens bakgrundsfärg istället? Så särskiljningen
blir kraftigare?"* — implementerad som tokens `--mm-atgardsko-markor-bg/-text`
(alias mot `--mm-btn-primary-bg/-text`), mätt 13,38:1 mot kortytan och
14,60:1 mot ikonen (se `src/styles/tokens/components.css`).

**Höjdlåset** (TASK-303): 70 px konstant, mätt (Playwright) vid 375/390/
768/1280 px och vid 1–4-siffriga tal, med negativkontroll (mätinstrumentet
fäller när reserveringen medvetet bryts).

## Vilka facit-bilder som blivit inaktuella, och varför

- `facit-hem-v1-demo-desktop.png`, `facit-hem-v1-demo-mobil.png`
- `facit-hem-v1-verklig-desktop.png`, `facit-hem-v1-verklig-mobil.png`

Samtliga fyra visar bevakningsraden i sin FÖRE-form (kolumn-grid,
`line-clamp-2`, ingen åtgärdskö-markör) och är därmed en generation bakom
den skarpa koden på exakt den yta TASK-291/303 rörde — samma klass
avvikelse `AMENDERING-2026-08-17-hover-och-etikett.md` redan bokförde för
genvägskortens hover.

**`facit-hem-v1-tom-desktop.png` och `facit-hem-v1-tom-mobil.png` är
OPÅVERKADE.** Det tomma läget (`?data=tom`) renderar noll bevakningsrader
(`Bevakningsrad`-komponentens "HELT OSYNLIG vid noll träffar"-kontrakt,
se dess docblock) — det finns ingen bevakningsrad-DOM i de bilderna att
bli inaktuell.

**Sidonot, upptäckt men INTE del av denna amendering:** `wip`-grenen bär
sedan `f371f02b` (landad EFTER denna skivas branch-punkt, upptäckt vid
premiss-passets `git fetch`) ett separat, redan registrerat fynd
(`TASK-311`, ADR-053-deferrad) om att `narrow-hem.png` (en PWA-skärmbild,
inte en del av detta manifest) också är inaktuell efter samma promovering.
Nämns här för fullständighet — hanteras av sitt eget kort, inte av denna
sidofil.

## Vad som INTE är amenderat

Samtliga övriga formbeslut manifestets `not`-fält låser är oberörda:
blockordningen, den vertikala rytmen, det tomma lägets copy i övrigt,
tidsformerna, "Senaste aktivitet"-blocket och genvägskorten (bortsett
från den redan bokförda hover/etikett-amenderingen 2026-08-17). Ingen ny
visuell granskning av dessa ytor krävs av denna skiva.

**Manifestets `ytor[0]` deklarerar i dagsläget ingen `referenser`-nyckel**
(verifierat: `facit.json` innehåller inget `referenser`-fält på ytan) —
`ADR-102` § A5:s sha256-lås gäller därför inte här, och denna skiva bryter
inget sådant lås. Det MEKANISKA facitet för bevakningsradens nya form bärs
i stället av den nya promoverings-grinden
(`tests/visual/hem-bevakningsrad-promoverings-grind.spec.ts`, ADR-103 B4)
med fyra `ariaSnapshot`-referenser under
`tests/visual/__aria__/hem-bevakningsrad-promoverings-grind.spec.ts/`:

| referens | sha256 |
|---|---|
| `bevakningsrad-deltagarinfo-visual-desktop.aria.yml` | `d7ae6777952e1c3bcfcba7bf93e2d3d3d12b55b0787705803c228dbd04736e52` |
| `bevakningsrad-deltagarinfo-visual-mobile.aria.yml` | `d7ae6777952e1c3bcfcba7bf93e2d3d3d12b55b0787705803c228dbd04736e52` |
| `bevakningsrad-atgardsko-visual-desktop.aria.yml` | `e6d5ad1885805c1632a62e3315994dd236b0122ef10ca7fd1086989de3162ae7` |
| `bevakningsrad-atgardsko-visual-mobile.aria.yml` | `e6d5ad1885805c1632a62e3315994dd236b0122ef10ca7fd1086989de3162ae7` |

Hasharna ovan är räknade av denna agent (`shasum -a 256`), INTE hämtade
ur TASK-291-kortets notes — kortet nämner att grinden är 8/8 grön men bär
ingen sha256-rad. Uppdragstextens påstående att hasharna finns
"i 291-rapporten på kortet" är därmed en DIVERGENS, öppet bokförd: kortet
verifierades (`npm run bl -- task 291 --plain`) och innehåller ingen
`sha256`-sträng. Att de fyra desktop/mobile-paren delar hash parvis är ett
RESULTAT (samma ARIA-träd oavsett vyport), inte slarv — samma mönster
`AMENDERING-2026-08-22-visuella-grinden-mot-faktisk-form.md` bokförde för
sina egna par.

Eftersom `facit.json` redan var stämplat (`godkand` satt 2026-08-17) INNAN
denna promovering ägde rum kan `referenser`-fältet inte längre läggas till
retroaktivt av en agent (`ADR-102` § A5 punkt 2 — deklarationen måste ske
MEDAN manifestet ännu är ogodkänt). Tabellen ovan är alltså bokföring för
den som senare beslutar om manifestet ska amenderas med ett `referenser`-
fält (Marcus egen kanal), inte ett mekaniskt lås i sig självt.

## Bilderna är INTE omtagna

`facit-hem-v1-*-desktop/mobil.png` är inte omtagna av denna skiva — de
visar den ÄLDRE bevakningsrads-formen och blir en känd, dokumenterad
avvikelse mellan bild och skarp kod tills en ny bildtagning görs. De fyra
avsteg som tabellen ovan radar upp (radform, talets placering, markören,
chevron/tid) är de ENDA avsiktliga avvikelserna från facit-bilderna i
denna skiva.

**Skäl för att INTE ta om bilderna nu:** bilderna är av
`/dev/hem-prototyp?variant=1` (S102:s hem-prototyp, en ANNAN prototyp än
den TASK-291/303 rörde och som inte är rörd av denna rivning). En ny
bildtagning skulle alltså kräva att den prototypen själv uppdateras med
den nya bevakningsrads-formen först, vilket ligger utanför denna skivas
scope.

## Föreslagen omstämpling

Klass (c): stämpeln (`godkand`, 2026-08-17) representerar inte längre den
fulla, aktuella formen av `/hem`-ytan. Marcus väg framåt (via
`!`-kanalen, `npm run facit:godkann`): antingen (a) godkänna en ny
generation av samma yta med `--ersatt` (fältet `lasning` kan uppdateras
för att notera att bilderna nu är en generation bakom bevakningsradens
kod), eller (b) beställa en ny bildtagning av `/dev/hem-prototyp?variant=1`
med den uppdaterade bevakningsrads-formen innan omstämpling. Orkestreraren
tar detta beslut med Marcus — denna agent stämplar aldrig om.

`godkand`-blocket är inte rört av denna sidofil.
