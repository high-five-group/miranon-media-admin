---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Leverabel 11 av 12 — Prioriterad migrations- och åtgärdsplan

> **Proveniens.** Skriven 2026-09-17 av agent D11 i CI-djupgranskningens tredje
> våg (Session 126). Modell: Opus 5 (1M kontext) — medvetet vald och bokförd av
> orkestreraren, eftersom planen väger skydd mot väntan och ska tåla ägarens
> granskning. Ögonblicksbild av koden: `origin/main` på `eeca8c72` (2026-09-08),
> läst i worktreen `s126-ci-djupgranskning`. Planen är en SYNTES av nio
> leverabler, tre korsgranskningar och orkestrerarens trettioen stickprov — inte
> en sammanfogning av dem. Varje `fil:rad`-pekare nedan har jag öppnat och läst
> själv denna dag. **Ingenting i planen är verkställt.** Varje åtgärd är ett
> förslag; ägaren beslutar.

## Kort svar

**Nio åtgärder nu, tjugoen senare, elva inte alls.**

Granskningen pekar inte mot "riv testarkitekturen". Den pekar mot tre saker som
går att göra på en till två veckor:

1. **Få kön att röra sig igen.** Huvudgrenen har inte tagit emot en enda
   ändring sedan 2026-09-08. Två kända säkerhetsvarningar i tredjepartskod gör
   en obligatorisk kontroll röd på VARJE ändringsförslag, även rena
   textändringar. Ingenting annat i denna plan kan landa förrän det är löst.
   Det är därför åtgärd 1, och ingen leverabel satte den där. **(Löst samma
   dag som planen skrevs — en parallell session landade lagningen 10:52Z, och
   huvudgrenen rör sig igen; se statusnoten i N1. Åtta åtgärder återstår i
   "nu"-högen, och frågan bakom stilleståndet lever kvar som vägval K1.)**
2. **Ge de två skyddsnäten efter landning en läsbar signal.** Nattkontrollen
   har varit röd 51 nätter av 52, och hälften av de nätterna dolde ett verkligt
   produktfel i bruset. Efterkontrollen hoppar över sitt tyngsta prov när flera
   ändringar landar samtidigt och den översta råkar vara en textändring — 60
   gånger på nitton dagar, senast under denna granskning, orsakat av
   granskningens egen födelse-PR.
3. **Ta bort väntan där den sitter, utan att ta bort skydd.** Ett enda jobb äger
   92–98 procent av väntetiden på varje kodändring. Det skyddar något äkta, och
   det är dyrt av en delning som stannade halvvägs. Kortet finns sedan
   2026-09-02 och är fortfarande oöppnat.

**Vad planen medvetet INTE gör.** Den river inte merge-dedupen (den träffar 32
gånger av 32 där den kan göra nytta). Den tar inte bort körningen på
huvudgrenen vid landning — en live-mätning samma dag som denna plan skrevs
visade att det är just den körningen som fångar kod under en text-topp. Den
bygger inte en nionde grindvakt som svar på ett prosafel. Och den föreslår
ingen ny mekanism alls i "nu"-högen utöver en vakt på trettio rader.

**Två vägval lämnas öppna åt ägaren**, eftersom de är avvägningar och inte
fakta: om beroendegranskningen ska fortsätta blockera rena textändringar (K1),
och i vilken ordning nattkontrollens signal ska lagas (K2). Båda besvaras med
alternativ, konsekvens och min rekommendation längre ned.

**Summan av "nu"-högen, i tal:** väntan på maskinen för en kodändring faller
från cirka 25 minuter till cirka 12; ett skyddsnät som varit blint i sju veckor
blir läsbart; 60 kodlandningar per nitton dagar får tillbaka den kontroll de
saknar; och en säker produktrisk som biter första gången någon planerar ett
event i januari 2027 stängs med tolv klick i databasen.

## Vad jag läste först

Kontraktet kräver att befintlig kunskap inventeras före första egna slutsats.
Planen är sist i kedjan, så min inventering är hela granskningen.

| Källa | Vad den gav mig | Vad jag gjorde med den |
|---|---|---|
| [`underlag/00-agentkontrakt.md`](underlag/00-agentkontrakt.md) | Arbetsformen, evidenskraven, märkningsreglerna | Följd i sin helhet |
| [`underlag/01-orkestrerarens-stickprov.md`](underlag/01-orkestrerarens-stickprov.md) (S1–S31) | Trettioen egna mätningar; loggen går före varje agents fil | **Styrande.** S30 läst först av alla; S31 mottagen under mitt pass och inarbetad i åtgärd 3 och i "senare" |
| [`underlag/kg1-korsgranskning-ci-mekanismer.md`](underlag/kg1-korsgranskning-ci-mekanismer.md) | Fyra mekanismer prövade i koden, med färdiga åtgärdsriktningar och en lagningsordning | **Grunden för åtgärd 2, 3 och 4.** Jag har byggt vidare, inte skrivit om |
| [`underlag/kg2-externa-fakta-och-rattelser.md`](underlag/kg2-externa-fakta-och-rattelser.md) | Fem externa fakta ur leverantörernas egna källor (A1–A5) | Bär åtgärd 9, beslutet om Enterprise-planen och avfärdandet av ett alternativ |
| [`underlag/kg3-konsistens-mellan-underlagen.md`](underlag/kg3-konsistens-mellan-underlagen.md) | De två krockande rekommendationerna K1 och K2, spänningarna T1–T3, de kanoniska talen | Bär § Två vägval; talen rättade enligt uppdragets punkt 5 |
| [`08-risk-redundans-flakighet-tid-och-kostnad.md`](08-risk-redundans-flakighet-tid-och-kostnad.md) | Riskregistret, redundansanalysen, elva rekommendationer, Del 5 "Var gränsen går" | Största enskilda källan till åtgärdslistan |
| [`09-ci-som-ateranvandbar-djupmodul.md`](09-ci-som-ateranvandbar-djupmodul.md) | Migrationsplanens sju steg och dess inträdesvillkor | Stegen 0–5 inarbetade; 6–7 ligger under "senare" med villkoret utskrivet |
| [`05-branschjamforelse.md`](05-branschjamforelse.md) | Sju förbättringspunkter, listan "ska vi INTE kopiera", § 14 om overheadens tre högar | Bär flera "inte alls"-domar och ordningen i "senare" |
| [`07-hermetiska-tester-kontra-realistisk-e2e.md`](07-hermetiska-tester-kontra-realistisk-e2e.md) | Sex rekommendationer om testnivåerna | "Senare", med de realistiska flödena överst |
| [`06-airtable-kompromisser-och-empiriska-fynd.md`](06-airtable-kompromisser-och-empiriska-fynd.md) | Sju rekommendationer om datakällan | "Senare", utom listgränsen som är åtgärd 7 |
| [`02-teknisk-arkitekturkarta.md`](02-teknisk-arkitekturkarta.md), [`03-andringslogg.md`](03-andringslogg.md), [`04-branch-worktree-commit-och-pushflode.md`](04-branch-worktree-commit-och-pushflode.md) | Fyra, tre respektive sex rekommendationer | Inarbetade; en av dem dömdes annorlunda än leverabeln (se § Där jag dömt annorlunda) |
| Kort och trådar: `TASK-366`, `TASK-199`, `TASK-365`, `T166` | Vad som redan är bokfört, och med vilken rotorsak | Lästa i sin helhet med `npm run bl -- task <id> --plain` och `Read`. **Inga kort eller trådar har skapats eller ändrats** |
| Beslut: `ADR-028`, `ADR-076`, `ADR-077`, `ADR-082`, `ADR-097`, `ADR-105`, `ADR-131` | Vad som redan är beslutat, och med vilket skäl | Varje förslag som rör ett beslutat designval är läst mot beslutet innan det dömdes |

**Vad som är nytt i denna fil.** Ingen tidigare fil har (a) satt alla
åtgärdsförslag ur nio leverabler i EN lista och slagit ihop dubbletterna, (b)
pekat ut att kön är mekaniskt blockerad och därför är ett hårt beroende för
varje annan åtgärd, (c) visat att "riv den fjärde körningen" och "byt dedupens
fråga" är samma spak och inte två, (d) läst `TASK-199`:s egen utredning mot det
förslag två leverabler ger om samma sak, eller (e) klassat varje åtgärd efter
om den formellt är en försvagning av grinden och därför kräver ägarens
uttryckliga GO.

## Metod

Fem steg, i ordning.

1. **Samlade varje åtgärdsförslag** ur de nio leverablerna, de tre
   korsgranskningarna och stickprovsloggen. Råmängden blev 61 förslag.
2. **Slog ihop dubbletter.** Samma sak föreslås på upp till fem ställen med
   olika ord — nattkontrollens delning föreslås av leverabel 3, 6, 9, 10 och
   KG1. Efter sammanslagningen: 41 distinkta åtgärder.
3. **Läste varje förslag som rör ett beslutat designval mot beslutet.** Fyra
   förslag visade sig helt eller delvis riva ett medvetet val med skrivet skäl.
   De är märkta och, i tre fall, omdömda.
4. **Prövade varje `fil:rad`-pekare mot koden** innan den skrevs ned. Två
   pekare ur underlagen stämde inte med det jag såg och står rättade nedan; en
   räkning inuti KG1 går inte ihop och är märkt osäker.
5. **Rangordnade** efter (skyddsvärde + sparad väntan) mot (risk + arbete), och
   lade beroendena först.

**Om djupet per hög, sagt öppet.** Uppdraget begär tio fält per åtgärd. Jag ger
alla tio fälten åt "nu"-högens nio åtgärder och åt de fyra tyngsta i
"senare"-högen — de som en läsare faktiskt kommer att plocka härnäst, och de som
formellt är försvagningar. Övriga "senare"-åtgärder får en tabellrad med
problem, förändring, effekt, beroende eller inträdesvillkor och rollback.
Fyrtioen åtgärder à tio fält vore fyra hundra fält, och en plan ingen läser
skyddar ingenting. Det är en proportionerlighetsbedömning, inte en genväg.

**Vad jag INTE gjorde.** Jag har inte kört `npm run check:docs` (kontraktets
förbud), inte rört någon fil utom denna, inte skapat eller ändrat något kort
eller någon tråd, och inte gjort en enda skrivande operation mot GitHub,
Vercel, Supabase eller Airtable.

## Så läses en åtgärd

Varje åtgärd öppnar med ett par meningar på vardagssvenska om vad som ändras
och varför det märks. Sedan följer uppdragets tio fält:

| Fält | Vad det betyder |
|---|---|
| **Prioritet** | Hur bråttom, relativt de andra i samma hög |
| **Problem** | Vad som är fel i dag, med mätningen bakom |
| **Föreslagen förändring** | Den minsta ändring som löser problemet |
| **Förväntad effekt** | I minuter eller antal, där ett tal finns |
| **Risk** | Vad som kan bli sämre, och hur det mildras |
| **Berörda filer** | Var ändringen bor, med rad där det går |
| **Beroenden** | Vad som måste landa före |
| **Verifieringsmetod** | Exakt vilken körning, loggrad eller kommando som visar att det fungerade |
| **Rollback** | Exakt hur man tar tillbaka det |
| **Rekommendation** | nu, senare eller inte alls |

**Två ord som återkommer.** En *PR* (pull request, "ändringsförslag") är den
paketerade ändringen någon vill lägga in i huvudkoden. *Merge-kön* är
maskineriet som tar in godkända ändringsförslag i tur och ordning, upp till tre
åt gången, och testar dem tillsammans innan de släpps in.

**Märkningen "kräver ägarens uttryckliga GO"** sätts på varje åtgärd som till
FORMEN är en försvagning av kvalitetsgrinden. GitHubs egen vägledning för
agentskrivna ändringsförslag säger rakt ut att *"Any CI weakening is a hard
stop"* (verifierad ordagrant, stickprov S29). Regeln gäller en agents
ändringsförslag; skillnaden är vem som beslutar. För varje sådan åtgärd står
utskrivet exakt vilket skydd som består efteråt och var det sitter.

## Nu — nio åtgärder

### Ordningen, och varför just den

| Steg | Åtgärd | Måste ligga före | Skäl |
|---|---|---|---|
| 1 | **N1** Avblockera kön | allt annat | `audit` är obligatorisk och diff-oberoende. Med två öppna säkerhetsvarningar kan ingenting landa — inte heller lagningarna nedan |
| 2 | **N2** Dela nattkontrollens larm | N5, och all senare mätning av natten | Nattkontrollen är det enda nät som ser vad N3:s hål missar. Gör den läsbar innan hålet stängs, annars går effekten av N3 inte att avläsa |
| 3 | **N3** Låt efterkontrollen klassa hela pushen | varje ändring i dedupen eller i körningen på huvudgrenen | Verkligt hål. Inget i "senare"-högen som rör körytorna får göras före denna |
| 4 | **N4** Vakt för paraplyets `needs`-lista | — | Fristående. Billigast av alla och stänger en tyst felklass |
| 5 | **N5** Rätta beroendegranskningens och dedupens falsifierade motivering | K1:s beslut | Ren texträttelse. Måste stå rätt innan någon argumenterar utifrån den |
| 6 | **N6** Dela hermetik-självtestet | — | Största enskilda ledtidsvinsten. Fristående från allt ovan |
| 7 | **N7** Fyll på listan "Månad/år" i databasen | — | Utanför CI. Enda säkra produktrisken i hela registret |
| 8 | **N8** Bokförings- och prosabunten | — | Fristående. Bör ligga sist för att kunna bära resultatet av N2 och N3 |
| 9 | **N9** Skriv rollback-runbooken med steget som saknas | — | Fristående dokumentation. Frågan den besvarar stängdes av KG2 under denna granskning |

**Kritiska vägen är N1 → N2 → N3.** Åtgärd 4 till 9 kan köras parallellt med
dem så snart N1 har landat, av olika agenter, eftersom de rör skilda filer.

---

### N1 — Avblockera kön: två säkerhetsvarningar och en klockbugg

> **LÖST 2026-09-17, medan planen skrevs — orkestrerarens statusnot.** Planen
> bygger på ögonblicksbilden `eeca8c72` (2026-09-08). Samma dag landade en
> parallell session lagningen: `#2491` (10:52Z) satte låsen `sharp 0.35.4`
> och `smol-toml 1.7.1` — mätt med `git show origin/main:package.json`, rad
> 134–135 — och klockbuggen i `hem.acceptance.test.ts` är lagad (`TASK-444`,
> `{ time: FROZEN_NOW }`). Huvudgrenen rör sig igen: elva landningar mellan
> 10:52Z och 11:40Z (`git log origin/main --first-parent`, mätt 11:59Z), och
> `CI [push]` på `87aa3dc4` visar `Audit dependencies: success`. **Ingen
> åtgärd återstår i N1.** Texten nedan står kvar som bokföring av läget när
> planen skrevs — och av fyndet att ingen leverabel hade satt avblockeringen
> först. Det som INTE är löst är frågan bakom: nästa gång omvärlden
> publicerar en varning står kön still igen, även för rena textändringar. Den
> frågan är vägval K1. **Kritiska vägen är därmed N2 → N3.**

**I klartext.** Just nu kan ingenting alls läggas in i huvudkoden. En automatisk
kontroll letar efter kända säkerhetshål i den tredjepartskod projektet lånar,
och den hittar två — i paket vi inte själva skrivit. Kontrollen är avsiktligt
byggd så att den fäller VARJE ändring, även en ren textändring, så länge något
är öppet. Följden är att huvudgrenen inte tagit emot en enda ändring på nio
dagar. Det märks för dig som att ingenting rör sig, hur små ändringarna än är.

- **Prioritet:** högst. Detta är inte den viktigaste åtgärden i planen, men den
  är förutsättningen för varje annan.
- **Problem:** `audit` (`ci.yml:2097`, jobbnamn *"Audit dependencies
  (audit-ci)"*) saknar både `if:` och `needs:` — ett medvetet val sedan
  `TASK-395` (2026-09-04), bokfört i paraplyets eget kommentarsblock
  (`ci.yml:2545-2550`), och jobbet står i den obligatoriska kontrollens
  `needs`-lista (`ci.yml:2551`). Två öppna varningar av hög allvarlighetsgrad
  fäller det: `sharp` (`GHSA-rgj7-g3m4-5g8c`, sårbart `<0.35.4`) som är
  **låst till exakt 0.35.3** i `package.json:135`, och `smol-toml`
  (`GHSA-7w5x-hrqm-74c2`, sårbart `<=1.7.0`) som kommer in transitivt via
  `markdownlint-cli2` och saknar lås (`package-lock.json:8189`,
  `smol-toml@1.7.0`). Mätt: 14 av 14 körningar på ändringsförslag röda
  2026-09-09 till mätdagen; `main` orörd sedan 2026-09-08 (KG3 § Kanoniska
  tal, oberoende bekräftat av J1f som körde verktyget skarpt). Därutöver en
  **deterministisk klockbugg** i `tests/acceptance/hem.acceptance.test.ts:274`
  (testet *"refetchInterval (60s) triggar polling-refetch — falsk klocka"*,
  som installerar en låtsasklocka på rad 281) som fällde 4 av 15 röda
  körningar i J8.6:s mätserie och slog till i nattkontrollen 2026-09-17.
  **Verifierad** (jag har läst alla fyra raderna).
- **Föreslagen förändring:** tre små, åtskilda ändringar, i den ordning de
  blockerar:
  1. Höj `sharp`-låset i `package.json:135` från `"0.35.3"` till den rättade
     versionen (`>=0.35.4`), kör `npm install` och committa `package-lock.json`.
  2. Lägg ett lås för `smol-toml` över `1.7.0` i samma `overrides`-block, eller
     uppgradera `markdownlint-cli2` till en version som drar en rättad
     `smol-toml`. Låset är den mindre ändringen och bör prövas först.
  3. Laga klockbuggen i testfilen.
  **Om ingen rättad version finns publicerad** för endera paketet är
  alternativet `ADR-028`:s femstegs-konventionsflöde: posten läggs i
  `audit-ci.jsonc`:s i dag tomma `allowlist` med skriven motivering och ett
  utskrivet rivningsvillkor, exakt som `esbuild`-posten hanterades 2026-06-13
  och revs 2026-07-19. **Den vägen är en försvagning och kräver GO.**
- **Förväntad effekt:** kön rör sig igen. Ingen tidsvinst per körning —
  vinsten är att de åtta övriga åtgärderna över huvud taget kan landa. Utan
  den är hela planen teoretisk.
- **Risk:** låg för väg 1 och 2. En versionshöjning av `sharp` kan i teorin
  påverka bildgenereringen för appens ikoner (`@vite-pwa/assets-generator`);
  det märks i så fall som ett rött bygge, inte som ett tyst fel. För
  allowlist-vägen: risken är den skrivna — en känd sårbarhet får passera tills
  villkoret uppfylls, och det ska bokföras i `ADR-028` § Updates som
  konventionen kräver.
- **Berörda filer och externa inställningar:** `package.json:128-136`
  (`overrides`-blocket), `package-lock.json`,
  `tests/acceptance/hem.acceptance.test.ts:274-281`, vid behov
  `audit-ci.jsonc` (`"allowlist": []`, sista raden) och
  `docs/decisions/ADR-028-*.md` § Updates. Inga externa inställningar.
- **Beroenden:** inga. Allt annat beror på denna.
- **Verifieringsmetod:** lokalt `npx audit-ci --config audit-ci.jsonc` ⇒ exit
  0. Därefter, på ett skarpt ändringsförslag: jobbet *"Audit dependencies
  (audit-ci)"* grönt i `gh run view <id> --json jobs`, och den obligatoriska
  kontrollen `CI Passed or Skipped` grön. För klockbuggen: `Acceptance
  (hermetisk)` grön i tre körningar i rad, och att `hem.acceptance.test.ts` inte
  längre förekommer bland röda i `gh run view --log-failed`.
- **Rollback:** revert-PR. Varje del är en egen rad i en egen fil.
- **Rekommendation: NU.** GO krävs **endast** om allowlist-vägen väljs; då är
  det skydd som består att nattkontrollens `Bredare sårbarhetsgranskning`
  (`nightly.yml:67-90`, som kör `npx audit-ci --moderate` och alltså är BREDARE
  än dagsvitens `high`) fortsätter se samma advisory varje natt, och att
  rivningsvillkoret står skrivet i konfigurationsfilen.

---

### N2 — Dela nattkontrollens larm i två kanaler

**I klartext.** Varje natt kör maskinen ett större testpass och rapporterar
"grönt" eller "rött". Den har varit röd 51 nätter av 52. Skälet är att åtta helt
olika kontroller delar samma lampa: fyra som prövar att appen fungerar, och
fyra som prövar att projektets egen bokföring är i ordning (att kort är stängda,
att sessionsanteckningar ligger rätt). När bokföringen är slarvig lyser lampan
rött, och då syns det inte att ett verkligt test också gick sönder. Förslaget
är att ge bokföringen en egen lampa. Efter det betyder ett rött nattlarm en
enda sak.

- **Prioritet:** högst av de mekaniska åtgärderna.
- **Problem:** `nightly.yml:699` blandar åtta poster i ETT larmjobb — fyra
  produktskyddande (`suite`, `kontraktsvakt`, `nightly-audit`,
  `nightly-metrics`) och fyra bokförande (`backlog-closure`,
  `pausade-sessioner`, `obesvarade-larm`, `sessionsdok-fonster`) — som alla
  matar en och samma etikett `ci-natt` (`nightly.yml:863-868`). Mätt av KG1
  över 56 nätter, jobb för jobb: bokföringsgrindarna stod för 44, 39, 30 och 28
  röda nätter, medan de produktskyddande stod för 15 (staging), 9
  (kontraktsvakten, varav sex i följd 2026-08-22 till 08-27), 3 (tillgänglighet)
  och 1 (acceptance). **På 25 av 52 nätter — 48 procent — var ett
  produktskyddande jobb rött, och ingen kunde se det.** Priset är mätt på ett
  kort: `TASK-239` kräver "tre gröna nätter i rad" och fick **31 i följd** utan
  att kunna bockas, eftersom "grön natt" läses på hela körningens nivå.
  **Verifierad** av KG1 mot 56 körningar; jag har själv läst `needs`-raden och
  larmjobbets `gh issue create` utan föregående sökning.
- **Föreslagen förändring:** `ADR-082`-mönstret i sin andra tillämpning —
  samma mönster som redan finns byggt och motiverat i SAMMA fil för
  länkkontrollen (`nightly.yml:195-260`, etikett `lankrota`, ett stående ärende
  som kommenteras i stället för att dupliceras):
  1. Flytta de fyra bokföringsposterna ut ur `alarm.needs` (`nightly.yml:699`).
  2. Ge dem ett eget jobb i `links-arende`:s exakta form — ETT stående ärende på
     en egen etikett, nya fynd som kommentarer, icke-blockerande, med samma
     stängningsregel.
  3. `alarm` behåller de fyra produktjobben, etiketten `ci-natt`, sin
     tilldelning och sin stängningsregel — orörd i form.
  4. Undanta den nya etiketten i `.sanningsavstamning-policy.conf` på samma
     grund som `ci-natt` redan är undantagen (`:145-158`, den självförstärkande
     loopen), annars byggs loopen in på nytt.
  Jobbstatus-listan bör fortsätta redovisa alla åtta jobbens resultat i BÅDA
  ärendena; det som ändras är vilka jobb som utlöser vilken kanal.
  **Om K1 besvaras med "villkora"** (se § Två vägval) bör
  `nightly-audit` samtidigt få en tredje, egen kanal — den blir då
  lastbärande för hela beroendesäkerheten.
- **Förväntad effekt:** mätt mot historiken hade produktkanalen fyrat 35 av 52
  nätter med `nightly-audit` inräknad, och 25 av 52 med säkerheten som egen
  kanal. Antalet öppna `ci-natt`-ärenden faller från 21 till en handfull, och
  `TASK-239`:s kriterium blir avläsbart. **Var ärlig om vad det INTE gör:**
  natten blir inte grön. Hälften av nätterna bär ett verkligt produktfel, och
  det arbetet återstår efteråt. Delningen gör signalen läsbar, inte tyst.
- **Risk:** låg, men inte noll. Den verkliga risken är att bokföringskanalen
  blir en kyrkogård ingen läser — precis vad `ADR-077` § Beslut 3 varnar för.
  Mildring: stängningsregeln följer med, och det stående ärendet är per
  konstruktion ETT, inte sjuttio.
- **Berörda filer och externa inställningar:** `.github/workflows/nightly.yml`
  (en ändrad `needs`-rad på `:699`, ett nytt jobb i `links-arende`:s form),
  `.sanningsavstamning-policy.conf` (undantagsnot vid `:145-164`),
  `.label-policy.json` (ny etikett), `CONTRIBUTING.md` § Nattnätet
  (stängningsregeln gäller båda kanalerna), och en kort amendering av
  `ADR-082` som bokför att mönstret nu har två tillämpningar. Extern
  inställning: den nya etiketten måste finnas i repot på GitHub.
- **Beroenden:** N1 (annars kan ändringen inte landa).
- **Verifieringsmetod:** tvåsidigt, med workflowens egen `simulate_failure`-
  ingång: (a) en manuell körning som gör en BOKFÖRINGSGRIND röd ⇒ ett ärende
  på den nya etiketten, `ci-natt` tyst; (b) en körning som gör `suite` röd ⇒
  `ci-natt` får sitt tilldelade ärende, bokföringskanalen tyst. Städa
  testärendena med den motivering workflowens egen ingångsbeskrivning kräver.
  Därefter, efter första skarpa natten: `gh run view <id> --json jobs` och
  `gh issue list --label ci-natt --state open`.
- **Rollback:** flytta tillbaka de fyra posterna till `alarm.needs` och ta bort
  det nya jobbet. Ingen datamigrering. Den nya etiketten kan ligga kvar oanvänd.
- **Rekommendation: NU.** Ingen försvagning av någon merge-grind — natten
  blockerar inga landningar. Vad som består: samtliga åtta kontroller kör
  oförändrat, båda kanalerna bär stängningsregel, och
  `nightly-watchdog.yml` fortsätter vakta att natten över huvud taget kört.

---

### N3 — Låt efterkontrollen klassa hela det pushade spannet

**I klartext.** När flera ändringar släpps in samtidigt tittar efterkontrollen
bara på den översta av dem. Är den översta en ren textändring drar den
slutsatsen "inget att testa här" och hoppar över hela provet — trots att riktig
kod låg under. Det som då aldrig körs är just de två prov som kräver en riktig
databas och en riktig inloggning. Det hände 60 gånger på nitton dagar, och det
hände igen under denna granskning: den textändring som skapade sessionens eget
anteckningsdokument blev locket över en kodfix. Varje session föder ett sådant
dokument, så mekanismen utlöses av arbetsformens egen rutin.

- **Prioritet:** hög. Den enskilt mest värdefulla fixen i hela granskningen
  enligt både KG1 och leverabel 10.
- **Problem:** `post-merge.yml:228` skickar `SHA: ${{ github.sha }}` — en enda
  commit, pushens topp — till `scripts/classify-post-merge.sh` (`:229`), och
  skriptet ser aldrig något annat (`classify-post-merge.sh:199`,
  `MERGE_SHA="${1:-}"`). Klassas toppen som en textändring hoppas hela sviten
  (`post-merge.yml:238`). Merge-kön landar upp till tre ändringsförslag i EN
  push (`max_entries_to_merge: 3` i rulesetet, mätt tre gånger oberoende), och
  GitHubs egen dokumentationskälla säger att en push-händelses `GITHUB_SHA` är
  *"Tip commit pushed to the ref"* (KG2 A4, hämtat ur `github/docs`). Mätt av
  KG1 över 601 pushar och 686 landningar: 73 pushar bar mer än en landning, och
  i **60 av dem var toppen en textändring medan spannet bar kod** — hål. Prövat
  mot verkligheten: 15 av 15 stickprov visar *"Verifierande svit på det mergade
  trädet: skipped"* med grön körning; kontrollgruppen 6 av 6 med kodtopp visar
  sviten körd. Exponeringen stängdes alltid av nästa kodlandning: median 0,57
  timmar, längst 33,2 timmar, fyra fall över fyra timmar.
  **Vad som faktiskt gick förlorat är smalare än underlagen först sa:** de
  hermetiska (isolerade) testklasserna kördes ändå, av körningen på huvudgrenen
  — den klassar hela spannet. Det som uteblev är `Staging (API + E2E)`, `A11y
  (axe-runner)` och de två städjobben. **Verifierad** (KG1, 14 av 14; bekräftad
  live i stickprov S31 samma dag som denna plan skrevs).
  **Bakgrunden är viktig: repot hade redan rätt diagnos.** Tråden
  `tasks/threads/T166-post-merge-klassningen-laser-sista-pr-en-i-ko-batchen.md`
  beskrev mekanismen korrekt 2026-08-21 med tre vägval, och står `lifecycle:
  paused`. Kortet `TASK-365` (High, To Do) beskriver samma symptom med en
  ANNAN rotorsak som kortets egen rättelsenot delvis falsifierar, och de två
  pekar inte på varandra.
- **Föreslagen förändring:** `T166`:s vägval 2, den minsta som stänger luckan
  och den som ligger närmast mekanismens egen deklarerade fail-closed-princip:
  1. `post-merge.yml` skickar `BEFORE: ${{ github.event.before }}` vid sidan av
     `SHA` (en rad i `env`-blocket, `:224-228`).
  2. `classify-post-merge.sh` går från `MERGE_SHA` bakåt via första föräldern —
     med det commits-API-anrop skriptet **redan gör** (`:245`) — och räknar
     stegen till `BEFORE`. Mer än ETT steg ⇒ `docs_only=false`, full svit, med
     skälet utskrivet i loggen. Exakt ett steg ⇒ dagens logik orörd.
  3. Fail-closed på varje kant: `BEFORE` tom eller noll-SHA (ny gren eller
     första push), `BEFORE` inte nådd inom ett tak på tio steg (omskriven
     historik), eller API-fel under vandringen ⇒ full svit.
  Detta är ingen ny klassnings-implementation: ingen filmönsterlista kopieras,
  och `ADR-077` § Beslut 1 är orörd. Det är samma ärvning med en räkning framför.
  **I samma andetag** föreslås att `TASK-365`:s beskrivning ersätts med den
  mätta mekanismen och att kortet pekas mot `T166` — ett högprioriterat kort med
  fel rotorsak riktar arbete åt fel håll. (Den kortändringen ligger i N8, som är
  den bokförande bunten.)
- **Förväntad effekt:** de 60 hålen försvinner. **Kostnaden, med en öppen
  räknefråga:** KG1 anger *"73 extra post-merge-sviter på nitton dagar, cirka
  3,8 per dygn"*, à cirka 16 minuter, var och en tar den globala
  `staging-tests`-mutexen. Räknat mot KG1:s EGEN fördelningstabell borde det
  tillkommande antalet vara **60**, eftersom de 13 pushar vars topp redan är
  kodklassad kör sviten i dag. Jag kan inte lösa upp skillnaden mot KG1:s "73
  extra" och dess parallella påstående att vägval 1 *"sparar 13"*.
  **Märkt osäker** — talet bör räknas om innan kostnaden används som argument.
  Riktningen är oomtvistad: ungefär tre till fyra fler tunga efterkontroller
  per dygn.
- **Risk:** medel, och det är en kö-risk, inte en korrekthets-risk. Fler
  mutex-tagningar gör revert-vägen långsammare — samma led `TASK-73` en gång
  mätte till 25 minuter 16 sekunder när den var blockerad. Mildring: bygg
  `T166`:s vägval 1 (klassa varje commit i spannet och vik ihop utfallen) om
  mutex-trycket visar sig, eller lägg ett tak.
- **Berörda filer och externa inställningar:** `.github/workflows/post-merge.yml`
  (en `env`-rad kring `:228`), `scripts/classify-post-merge.sh` (cirka 25 rader
  kring `:199` och `:245`), `scripts/test-classify-post-merge.sh` (fem nya
  fall). Inga externa inställningar. `.ci-parity-policy.json` berörs inte —
  `post-merge.yml` ingår inte i paritetsgrindens ytor.
- **Beroenden:** N1. Och omvänt: **ingen åtgärd som rör merge-dedupen eller
  körningen på huvudgrenen får göras före denna** (se § Senare, SE1).
- **Verifieringsmetod:** tvåsidig, i två led.
  1. **Enhetsnivå:** fem nya fall i den befintliga sviten — en push med två
     merge-commitar och texttopp ⇒ `false` (**detta fall fäller mot dagens
     skript och passerar efter fixen, alltså tvåsidighetsbeviset**); en push med
     en merge-commit ⇒ oförändrat `true`; `BEFORE` = noll-SHA ⇒ `false`;
     `BEFORE` onåbar inom taket ⇒ `false`; `BEFORE` osatt ⇒ `false`.
  2. **Skarpt**, som skriptets eget filhuvud kräver: kör klassningen mot två
     verkliga SHA:n ur KG1:s mätning — `269f6d476a` (texttopp, kodspann, ska ge
     `false` efter fixen och gav `true` före) och en enkelposts textlandning som
     ska förbli `true`. Därefter, på nästa verkliga grupplandning: `gh run view
     <post-merge-id> --json jobs` ska visa *"Verifierande svit på det mergade
     trädet"* som körd, inte `skipped`.
- **Rollback:** ta bort `BEFORE`-raden i `post-merge.yml`. Skriptet faller då
  till dagens beteende utan ändring, eftersom steg-räkningen är grindad av att
  variabeln finns.
- **Rekommendation: NU.** Ingen försvagning — åtgärden lägger till körningar,
  den tar inte bort någon.

---

### N4 — En vakt för paraplyets `needs`-lista

**I klartext.** Hela kvalitetskontrollen hänger på ett enda "paraply" som
rapporterar grönt eller rött till GitHub. Paraplyet listar vilka jobb det ska
bry sig om. Lägger någon till ett nytt testjobb men glömmer att skriva upp det
i listan, blir jobbet osynligt för paraplyet — det kan bli hur rött som helst
utan att stoppa något. Ingen mekanism kontrollerar den listan i dag. Förslaget
är ett skript på ungefär trettio rader som gör det.

- **Prioritet:** medel, men billigast av alla nio.
- **Problem:** `ci-passed` (`ci.yml:2537-2566`, namnet *"CI Passed or Skipped"*)
  är repots ENDA obligatoriska kontroll, och dess `needs`-lista (`:2551`) räknar
  upp de sex övriga toppnivåjobben. Ett nytt toppnivåjobb som glöms i listan
  kan inte blockera en landning, hur rött det än blir. **Halvvägs vaktat, och
  KG1 fann halvan ingen annan såg:** `scripts/verify-ci-parity.mjs:202`
  (`verifieraJobbmangd`) fäller fail-closed om ett toppnivåjobb saknas i
  `.ci-parity-policy.json` — men den kontrollerar att jobbet är KLASSAT i
  policyn, inte att det står i paraplyets `needs`, och skriptet är **inte wirat
  i någon workflow** (bara dess egen testsvit körs, `ci.yml:917`-klassens
  gatekeeper-steg). Den styrande texten avråder dessutom uttryckligen från att
  köra det som rutin. Nuläget är korrekt — KG1 verifierade mekaniskt att sju
  toppnivåjobb finns och sex står i listan. **Verifierad.**
- **Föreslagen förändring:** ett litet CI-wirat invariant-skript i exakt den
  form `scripts/check-fetch-depth-invariant.sh` redan har: läs `ci.yml` med
  `js-yaml`, hävda att varje toppnivåjobb utom `ci-passed` finns i
  `ci-passed.needs`, fäll med jobbets namn annars. Medvetna undantag hanteras
  med en uttrycklig lista med skrivet skäl, i samma form som
  `.listparitet-policy.conf` använder, och ett onödigt undantag ska också fälla.
  Att lägga hävdelsen i `verify-ci-parity.mjs` vore fel hemvist: den filen körs
  inte i CI.
- **Förväntad effekt:** felklassen blir omöjlig i stället för osannolik. Ingen
  tidsvinst; körtiden är ett par sekunder i ett jobb som ändå kör.
- **Risk:** mycket låg. Skriptet läser en fil och jämför två mängder.
- **Berörda filer och externa inställningar:** nytt
  `scripts/check-aggregator-needs.mjs`, ny
  `scripts/test-check-aggregator-needs.mjs`, en rad i `ci.yml`:s
  gatekeeper-steg (samma steg som `ci.yml:917` redan kör ett tjugotal sviter
  från), och en rad i `ci.yml:786`-klassens invariant-block. Eventuellt en post
  i `.ci-parity-policy.json` om den ytan berörs. Inga externa inställningar.
- **Beroenden:** N1.
- **Verifieringsmetod:** tvåsidig — testsviten kör mot en sandlådekopia av
  `ci.yml` med ett jobb borttaget ur `needs` (**ska fälla**) och mot den
  riktiga filen (**ska passera**). Därefter: steget grönt i ett skarpt
  ändringsförslags `lint`-jobb.
- **Rollback:** ta bort raden i gatekeeper-steget. Skriptet ligger kvar oanvänt.
- **Rekommendation: NU.**

---

### N5 — Rätta två motiveringar som inte längre håller

**I klartext.** Två ställen i den styrande texten förklarar varför en
besparings-mekanism är säker med ett argument som inte gäller längre: det
villkor argumentet lutar sig mot stängdes av 2026-08-05. Mekanismen är
fortfarande säker, men av ett ANNAT skäl. Att låta den gamla förklaringen stå
kvar är farligt på ett stillsamt sätt: nästa person som vill ändra mekanismen
resonerar utifrån ett villkor som inte finns.

- **Prioritet:** låg i arbete, hög i konsekvens.
- **Problem:** `ADR-077` § Beslut 2 (`docs/decisions/ADR-077-*.md:78`) och
  `ci.yml:458` motiverar båda merge-dedupens sundhet med *"merge-grindens
  strict up-to-date-krav (ADR-076)"*. Det kravet är **avstängt** —
  `strict_required_status_checks_policy: false`, mätt i rulesetet och oförändrat
  sedan 2026-08-05 (KG1 fynd 2a; S5). Konsekvensen är mildare än en tidigare
  läsning drog: dedupen är fail-closed på trädavvikelse, så en falsifierad
  sundhetspremiss kostar **besparing**, aldrig säkerhet. **Verifierad** (jag har
  läst båda raderna).
- **Föreslagen förändring:** rätta båda ställena öppet, i den
  korrigeringsform `ADR-076` redan använder: sundheten vilar inte på
  `strict`, utan på att steget är fail-closed på varje avvikelse. Skriv ut att
  premissen föll och när. Rör ingen kod.
- **Förväntad effekt:** ingen mätbar i minuter. Effekten är att nästa läsare
  inte bygger på ett villkor som inte finns — precis den felklass `ADR-083`
  finns för, och den fjärde mätta instansen i denna granskning.
- **Risk:** ingen. Ändringen är text.
- **Berörda filer och externa inställningar:**
  `docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md:78`
  (plus ett `## Updates`-block), `.github/workflows/ci.yml:458`. Inga externa
  inställningar.
- **Beroenden:** N1. Och: **K1:s svar bör vara känt först**, eftersom samma
  ADR-amendering med fördel bär både denna rättelse och K1:s beslut.
- **Verifieringsmetod:** `npx markdownlint-cli2 --no-globs` och `vale` på den
  rättade ADR-filen, båda exit 0; sökning på `strict up-to-date-krav` i repot
  ger noll kvarvarande träffar som påstår att kravet gäller.
- **Rollback:** revert-PR.
- **Rekommendation: NU.**

---

### N6 — Dela hermetik-självtestet, som den klass det speglar redan är delad

**I klartext.** Det som avgör hur länge du väntar på varje kodändring är ETT
jobb. Det jobbet är vakten som bevisar att de övriga testerna är ärliga: den
kör alla 524 tester en gång till med låtsasvärlden avstängd och kräver att de då
faller. Det skyddet är äkta och ska behållas. Problemet är att jobbet kör alla
524 testerna i en enda följd, medan de vanliga testerna sedan 2026-09-02 körs
uppdelat på tre parallella maskiner. Därför tar vakten 13,7 minuter medan
originalet tar 5,5. Delningen infördes för den ena och följde aldrig med till
den andra.

- **Prioritet:** hög — största ledtidsvinsten i hela granskningen, och den
  kräver inget borttaget skydd.
- **Problem:** `ci-suite.yml:516-593` (`acceptance-sjalvtest`, jobbnamnet
  *"Acceptance — tvåsidigt bevis (hermetik-självtest)"*) har **ingen
  `strategy`** och anropar `npm run test:acceptance:sjalvtest` rakt av
  (`:567-577`), medan klassen den speglar har `strategy.matrix.shard =
  [1,2,3]` (`ci-suite.yml:366-372`). Egen mätning i leverabel 9, 3 av 3
  körningar: självtestet tar 12,8–13,7 minuter av en total på 13,6–14,0 —
  alltså **92–98 procent av väntetiden**, på två ytor i följd (ändringsförslaget
  och kön). Jobbets eget kommentarsblock (`ci-suite.yml:526-536`) bokför att
  taket **höjdes 12→20 minuter 2026-09-03** efter fyra avbrott samma dag, och
  pekar på ett uppföljningskort. Kortet är `TASK-366`: **High, To Do, skapat
  2026-09-02, etikett `ready-for-agent`**, med acceptanskriteriet *"Självtest-
  jobbet har >2 min marginal till sitt tak ... utan takhöjning"*. Femton dagar
  senare är det oöppnat. **Verifierad** (jag har läst jobbet, matrisen och
  kortet).
- **Föreslagen förändring:** ge `acceptance-sjalvtest` samma `shard`-matris som
  `acceptance`, och lös den designfråga som är det egentliga arbetet:
  **hur skärvornas domar slås ihop.** Dagens dom bor i
  `scripts/hermetik-sjalvtest.mjs:163-191` och är fail-closed på tomhet —
  *"noll tester kördes — en tom svit bevisar ingenting"* (`:170`). Varje skärva
  för sig är icke-tom, så den spärren fungerar per skärva. Det som INTE finns
  i dag är en kontroll av att de tre skärvorna TILLSAMMANS täckte hela klassen:
  faller en skärva bort som jobb, eller matchar ett filter fel, blir summan
  mindre än klassen utan att någon dom märker det. Den minsta hederliga formen
  är att varje skärva skriver ned antalet prövade tester och att ett litet
  sammanfattande steg kräver att summan är lika med `npx playwright test
  --project=acceptance --list`. **Det är designfrågan, inte en flagga** — och
  den är skälet till att kortet inte bör plockas utan att den besvaras först.
- **Förväntad effekt:** kritiska vägen faller från cirka 13,7 minuter till
  cirka 5–6. Eftersom jobbet betalas på två ytor i följd blir vinsten **cirka
  16 minuter per landad kodändring**. Väntan före landning faller därmed från
  cirka 25 minuter till cirka 12 — ungefär halva den väntan ägaren beskriver
  som det enda han märker av maskinen.
- **Risk:** medel, och den ligger i beviset, inte i tiden. Ett tvåsidigt bevis
  som delas i tre är inte längre ett bevis om summan inte kontrolleras. Blir
  täckningskontrollen slarvig byter man 16 minuter mot ett skydd som ser ut att
  finnas. Mildring: bygg täckningskontrollen FÖRST och delningen sedan, i samma
  ändringsförslag, och behåll kortets eget krav på att det tvåsidiga beviset
  består.
- **Berörda filer och externa inställningar:** `.github/workflows/ci-suite.yml`
  (`:516-536` taket och kommentarsblocket, ett nytt `strategy`-block i
  `:366-372`:s form, `:567-577` anropet), `scripts/hermetik-sjalvtest.mjs`
  (summakontrollen, kring `:163-191`), `package.json` (`test:acceptance:sjalvtest`
  om den behöver ett skärv-argument), `.ci-parity-policy.json` (jobbmängden
  ändras inte, men paritetsvakten läser filen). Inga externa inställningar.
- **Beroenden:** N1. Ingen annan.
- **Verifieringsmetod:** `TASK-366`:s egna tre acceptanskriterier, som redan är
  skrivna och konkreta: (1) självtest-jobbet har mer än två minuters marginal
  till sitt tak i en körning på ett ändringsförslag, mätt ur `gh api
  .../jobs`, **utan takhöjning**; (2) det tvåsidiga beviset består — grönt när
  allt är rätt, och ett planterat fel ska fortfarande fälla; (3) `npm run
  verify:ci-parity` och paritetspolicyn gröna, workflow-lintarna gröna.
  Därutöver: summakontrollen ska fälla om en skärva tas bort ur matrisen.
- **Rollback:** ta bort `strategy`-blocket. Jobbet faller tillbaka till en
  process. Summakontrollen kan ligga kvar, den är oberoende.
- **Rekommendation: NU.** Ingen försvagning: samma 524 tester körs, samma dom
  krävs. Kortet är redan märkt `ready-for-agent`, men designfrågan bör
  besvaras i planeringen innan en agent plockar det.

---

### N7 — Fyll på listan "Månad/år" i produktionsdatabasen

**I klartext.** Appen kan i dag inte skapa ett event med startdatum i januari
2027. Databasens fält "Månad/år" är en fast lista som slutar vid december 2026,
och serverfunktionen svarar med ett tekniskt fel i stället för att tyst hitta
på ett värde. Att den felar är ett medvetet och riktigt val. Det som saknas är
att någon fyller på listan. Felet utlöses av EVENTETS startdatum, inte av dagens
datum — så det biter första gången någon planerar vårens event, vilket kan vara
i dag.

- **Prioritet:** hög. Detta är den enda risken i hela granskningens register som
  är SÄKER att inträffa.
- **Problem:** `supabase/functions/create-event/index.ts:233-236` säger
  ordagrant: *"Basens options-lista är ändlig (Nov 2025 – Dec 2026); ett datum
  utanför den FELAR (typecast:false → 500) i stället för att tyst skapa en
  option — medvetet, §Kända fällor 36 + 45."* Live-mätt mot produktionsbasen
  2026-09-17 via ett läsande schemaanrop: **fjorton val, november 2025 till
  december 2026 — listan är oförändrad.** Känt och dokumenterat sedan
  2026-07-24. **Ingen** av repots cirka 35 CI-jobb skyddar mot det.
  **Verifierad** (stickprov S26; jag har läst kodkommentaren).
- **Föreslagen förändring:** två saker, i den ordningen.
  1. **Nu:** lägg till tolv listval (januari–december 2027) i fältet
     `Månad/år` i produktionsbasen. Ett handgrepp på ungefär en minut för den
     som äger basen.
  2. **Senare, den riktiga lösningen** som datamodellens egen fällpost 36 redan
     pekar ut: härled fältet med en formel ur startdatumet, så listan aldrig kan
     ta slut. Det är en egen ändring med eget beslut (se § Senare, SE14).
- **Förväntad effekt:** en säker produktstörning uteblir. Ingen effekt på
  väntetid eller CI.
- **Risk:** mycket låg. Att LÄGGA TILL val i en enkelvalslista påverkar inga
  befintliga poster. (Att ta bort ett val som används skulle däremot tömma
  fältet i de posterna — därav rollbackens villkor nedan.)
- **Berörda filer och externa inställningar:** ingen fil i repot.
  **Extern inställning:** fältet `Månad/år` (`fld2BjFdBd964TzVb`) i tabellen
  `tblVE3UKWl1CKrphV` i produktionsbasen. Därefter bör
  `docs/reference/data-model.md` § Kända fällor post 45 noteras med det nya
  slutdatumet.
- **Beroenden:** inga. Kan göras i dag, oberoende av N1.
- **Verifieringsmetod:** läs om fältets schema och räkna valen (fjorton ⇒
  tjugosex). Därefter, skarpt i staging: skapa ett event med startdatum
  2027-01-15 via `create-event` och bekräfta att det lyckas i stället för att
  ge ett tekniskt fel.
- **Rollback:** ta bort de tolv tillagda valen — men **endast så länge inget
  event använder dem**. Används ett av dem redan är rätt väg framåt, inte
  tillbaka.
- **Rekommendation: NU — och detta är ägarens eget handgrepp.**
  Produktionsbasen är mekaniskt låst för agenter sedan `TASK-419`; en skrivning
  där är hans beslut och hans kanal. **Kräver ägarens uttryckliga GO.**

---

### N8 — Bokförings- och prosabunten

**I klartext.** Fem små saker som var och en tar minuter och tillsammans stänger
den felklass granskningen hittade flest gånger: text som var sann när den skrevs
och blev falsk av en senare landning. Ingen av dem rör hur maskinen kör. Alla
kan landa i ett enda ändringsförslag.

- **Prioritet:** låg i risk, hög i värde per minut.
- **Problem:** granskningen mätte fyra oberoende instanser av samma felklass —
  styrande text som bär ett TAL eller påstår en FRÅNVARO och har blivit falsk
  genom tillväxt, åt båda håll. `ADR-083` vaktar prosa som påstår en MEKANISM;
  ingenting vaktar de två andra formerna. Konkret, allt verifierat av mig i dag:
  - `CONTRIBUTING.md:380` säger att en push kostar *"en full CI-körning plus en
    plats i staging-mutexen"*. Ytan på ändringsförslag tar inte
    staging-mutexen alls — `ci.yml:2271` skickar `run_staging: false`
    villkorslöst. Enrads-fix.
  - `CONTRIBUTING.md:1074` och `scripts/acceptance-urval.sh:12` säger *"alla 18
    spec-filer"*. Det är 61 filer och 524 tester.
  - `tests/kontraktsvakt/kontraktsfall.ts:25-26` säger *"ALLA SJU
    FIXTURHANDLERS BEVAKAS"*. Låtsasvärlden registrerar arton; sju bevakas.
    Filen säger dessutom själv, två rader ned, att pariteten *"är i dag en
    konvention, inte en grind"*.
  - Hubbens `~/.claude/CLAUDE.md` säger om regeln att aldrig ställa en fråga
    som popup att *"Detta är PROSA, inte en spärr"* — men pluginet bär en hook
    som nekar verktyget (`deny-askuserquestion.sh`, registrerad sedan
    2026-08-22). Samma felklass spegelvänd.
  Därutöver två bokföringsposter som granskningen tog fram och som annars går
  förlorade: `TASK-365` bär fel rotorsak bredvid `T166`:s rätta, och
  `TASK-239`:s acceptanskriterium #3 ("tre gröna nätter i rad") kan bockas på
  mätt belägg — **31 gröna acceptance-nätter i följd** 2026-08-17 till 09-16.
- **Föreslagen förändring:** ett ändringsförslag som (a) rättar de fyra
  textställena — och för de två talen ersätter talet med en hänvisning till
  kommandot som räknar (`npx playwright test --project=acceptance --list`), så
  påståendet aldrig kan bli inaktuellt igen; (b) ersätter `TASK-365`:s
  rotorsaksbeskrivning med den mätta mekanismen och pekar den mot `T166`; (c)
  bockar `TASK-239` AC #3 med run-ID:n som belägg; och (d) börjar använda
  review-grindens kalibreringskanal (`npm run review:kalibrering`) — den
  bokföring av fel granskaren MISSADE som är det enda sättet att veta hur
  träffsäker den är. Loggen bär i dag 262 körningar och **noll**
  kalibreringsposter, medan sju produktionsfel hittades av ägaren själv.
  Hubbens fil ligger utanför detta repo och rättas i hubbens egen kanal.
- **Förväntad effekt:** fyra falska påståenden i styrande text försvinner, två
  av dem permanent (talet ersatt av ett kommando). Ett högprioriterat kort
  slutar rikta arbete åt fel håll. Ett avslutat kort kan stängas. Och
  review-grindens missrat blir mätbar i stället för obedömbar — vilket är
  förutsättningen för att någonsin kunna säga om dess 42 procent eskaleringar
  är rätt nivå eller överförsiktighet.
- **Risk:** ingen på textsidan. På kortsidan: kort ändras **endast** via
  backlog-verktyget, aldrig genom direktredigering av kortfilerna — regeln är
  mekaniserad med en hook som nekar `Edit`/`Write` mot `backlog/tasks/`.
- **Berörda filer och externa inställningar:** `CONTRIBUTING.md:380`,
  `CONTRIBUTING.md:1074`, `scripts/acceptance-urval.sh:12`,
  `tests/kontraktsvakt/kontraktsfall.ts:25-26`, korten `TASK-365` och
  `TASK-239` (via `npm run bl -- task edit …`),
  `docs/reference/review-instrumentering.jsonl` (append via
  `npm run review:kalibrering`). Utanför repot: `~/.claude/CLAUDE.md`.
- **Beroenden:** N1. Punkt (b) blir bäst efter N3, så att beskrivningen kan
  citera den landade mekanismen.
- **Verifieringsmetod:** `grep` på de fyra fraserna ger noll kvarvarande
  träffar; `npm run bl -- task 365 --plain` visar den nya beskrivningen;
  `npm run bl -- task 239 --plain` visar AC #3 bockad; `npm run review:metrics`
  summerar loggen och visar minst en `kalibrering`-rad.
- **Rollback:** revert-PR för textdelen. För korten: samma CLI-väg tillbaka.
- **Rekommendation: NU.**

---

### N9 — Skriv rollback-runbooken, med steget som saknas

**I klartext.** Om en ny version av appen visar sig trasig finns ett kommando
som tar tillbaka den förra på sekunder. Det kommandot har aldrig körts här och
står inte i någon instruktion. Och det har en bieffekt som är lätt att missa:
efter en tillbakarullning slutar plattformen automatiskt lägga ut nya versioner.
Huvudkoden fortsätter alltså ta emot ändringar som ser gröna ut, medan
användarna tyst står kvar på den gamla — tills en människa märker det. Just den
fällan sitter bredvid den enda kontroll som helt saknas: ingenting vakar över
att koden faktiskt når användaren.

- **Prioritet:** medel i risk, låg i arbete.
- **Problem:** ett tidigare underlag skrev att frontenden saknar *"ingen
  kommandoväg"* för tillbakarullning. Det föll: vägen finns (`vercel rollback`,
  `vercel rollback status`, `vercel promote`, `vercel bisect`). Det som STÅR
  KVAR är att vägen aldrig körts hos oss och aldrig dokumenterats. KG2 stängde
  därefter den öppna frågan med leverantörens egen text, ordagrant: *"After a
  rollback, Vercel turns off auto-assignment of production domains. This means
  new pushes to your production branch won't replace the rolled-back
  deployment."* Vägen tillbaka är knappen "Undo Rollback" eller `vercel promote`.
  Ytterligare två mätta bieffekter: miljövariabler ändras INTE av en
  tillbakarullning (den återställda versionen behåller sina egna, inbakade
  värden — en tillbakarullning förbi en funktionsflagga återinför det gamla
  flaggvärdet), och eventuella schemalagda jobb återställs till den gamla
  versionens tillstånd. **Verifierad** mot leverantörens dokumentation
  2026-09-17 (stickprov S22, KG2 A2).
- **Föreslagen förändring:** skriv in KG2:s åttastegs-sekvens i
  `docs/reference/prod-driftsattning-runbook.md` som ett eget avsnitt, med
  **två tillägg som är vårt eget, inte leverantörens:** (1) ett uttryckligt
  sista steg som kontrollerar att automatisk produktionstilldelning är PÅ igen
  efter incidenten, och (2) en rad om att funktionsflaggan
  `VITE_FEATURE_BETALNINGAR` bakas in vid bygget och därför följer med bakåt.
  **Öva vägen en gång** i en lugn stund, mot en känd god version, och skriv ned
  vad som faktiskt hände.
- **Förväntad effekt:** en oövad återställningsväg blir en övad. Ingen
  tidsvinst; risken som stängs är att en incident hanteras med ett kommando
  ingen kört, i ett läge där ett andra fel är dyrt.
- **Risk:** låg i skrivandet. Övningen i sig rör produktion och bör göras med
  öppna ögon, i en period utan pågående landningar — en tillbakarullning stänger
  av automatiken tills den aktivt slås på igen, och just det är vad övningen
  ska lära ut.
- **Berörda filer och externa inställningar:**
  `docs/reference/prod-driftsattning-runbook.md`, och en pekare från
  `TASK-199`:s kort. **Externa:** Vercel-projektets produktionstillstånd under
  själva övningen. Inget i CI.
- **Beroenden:** inga för skrivandet. Övningen bör ligga efter N1, så att en
  ny version kan landa igen efteråt.
- **Verifieringsmetod:** efter övningen — `vercel rollback status` visar det
  förväntade läget, och en efterföljande landning på huvudgrenen når
  produktionsdomänen igen (jämför utrullad commit mot `main`). Skriv ned båda
  utfallen i runbooken.
- **Rollback:** dokumentet kan revertas. Övningens tillstånd återställs med
  `vercel promote` eller genom att landa nästa ändring.
- **Rekommendation: NU** för dokumentet. Övningen är ägarens beslut om när.

---

## Senare

Tjugoen åtgärder. Fyra av dem får alla tio fälten, eftersom de är de närmaste i
tur och de som formellt rör grindens styrka. Övriga sjutton står i tabellform
med sitt inträdesvillkor utskrivet.

### SE1 — Låt körningen på huvudgrenen sluta köra om en svit som redan körts

**I klartext.** Samma tester körs i dag upp till fyra gånger på exakt samma kod
per landning. En av de fyra tillför i normalfallet ingenting — men den är
samtidigt det enda som just nu fångar kod som ligger under en textändring i en
grupplandning. Därför får den inte röras förrän efterkontrollen lagats (N3).
Efter det är den genuint överflödig, och den bör slås av med den befintliga
besparingsmekanismen i stället för att rivas.

- **Prioritet:** låg — ingen ledtidsvinst, bara lägre maskinlast.
- **Problem:** merge-dedupen (`ci.yml:452-499`) frågar om det landade trädet är
  IDENTISKT med ändringsförslagets träd. Det är det bara när huvudgrenen stått
  still sedan grenen senast uppdaterades. Mätt av KG1 över 601 pushar: dedupen
  träffade **32 av 32** gånger där den kan göra nytta (5,3 procent av
  pusharna), medan **225 pushar körde hela sviten en gång till i onödan** —
  cirka 47 timmars körtid på nitton dagar. Kön har redan testat EXAKT det
  landade trädet. **Verifierad.**
- **Föreslagen förändring:** byt dedupens fråga från trädjämförelse mot
  ändringsförslagets huvud till identitet på det landade SHA:t: *"har
  `github.sha` en grön `merge_group`-körning av `ci.yml` **där `Test suite`
  faktiskt KÖRDE**?"* SHA-identitet är strikt starkare än trädidentitet.
  **Fällan, som måste namnges:** villkoret får ALDRIG vara "körningen är grön".
  På exakt de hål N3 stänger är kö-körningen grön **med sviten hoppad** — ett
  naivt "grön körning på samma SHA" skulle alltså släppa igenom precis där det
  gör mest skada. Signalen måste vara *"sviten körde och var grön"*, samma
  binära signal `scripts/classify-post-merge.sh` redan läser.
  **Notera att detta ÄR "riv den fjärde körningen".** Två leverabler listar
  dem som skilda åtgärder; de är samma spak. Att i stället ta bort `push:`-
  utlösaren för huvudgrenen ur `ci.yml` vore en större och mindre reversibel
  ändring som dessutom tar bort själva ytan dedupen lever på — den avråds.
- **Förväntad effekt:** cirka 225 färre hermetiska sviter per nitton dagar.
  **Ingen ledtidsvinst** — körningen på huvudgrenen tar inte staging-mutexen
  och fördröjer ingen landning. Vinsten är maskinlast och samtidighet, inte
  minuter och inte pengar (repot är publikt; minuterna är gratis).
- **Risk:** **hög om den görs före N3**, låg efter. Görs den före förlorar 60
  pushar per nitton dagar sitt sista nät, och en besparing blir ett hål — exakt
  det `ADR-077` § Beslut 2 förbjuder ordagrant.
- **Berörda filer och externa inställningar:** `.github/workflows/ci.yml:452-499`
  (villkorskedjan), `ci.yml:81` (utdatan), `ci.yml:2163`-klassens `if:` i
  `suite`-jobbet, samt en delad hjälpfunktion tillsammans med
  `scripts/classify-post-merge.sh` med egen testsvit. Inga externa
  inställningar.
- **Beroenden:** **hård — N3 måste ha landat och verifierats.**
- **Verifieringsmetod:** kontrastpar på en verklig landning (dedup-miss före,
  träff efter, avläst ur `changed`-jobbets logg: raden *"Dedup-TRÄFF"* mot
  *"Dedup-miss"*), plus tvåsidiga enhetsfall där kö-körningen är grön med
  hoppad svit och ska ge `dedup_hit=false`.
- **Rollback:** villkorskedjan är ett enda steg; återställ steget.
- **Rekommendation: SENARE, aldrig före N3. Kräver ägarens uttryckliga GO —
  landas aldrig av en agent på eget bevåg.** Vad som består efteråt: kö-ytans
  fullständiga körning av varje ändringsförslag (oförändrad), efterkontrollens
  svit på hela spannet (efter N3), nattkontrollen, och dedupens
  fail-closed-beteende på varje avvikelse.

### SE2 — Flytta de tio alltid-på dokumentationsgrindarna till dokumentvillkoret

**I klartext.** Fjorton kontroller vakar över projektets egen dokumentation.
Tio av dem kör på VARJE ändring, även en ren kodändring som inte rör ett enda
dokument. De kostar sekunder, men de ger fel signal: en kodändring kan bli röd
för att en lärdomsnumrering är fel.

- **Prioritet:** låg.
- **Problem:** leverabel 9 mätte att tio av de fjorton dokumentationsgrindarna
  kör i det **alltid-på** `lint`-jobbet (regionen `ci.yml:643-836`, inramad av
  paritetsmarkörerna `paritet:start docs-grindar-ci` och dess slutmarkör),
  medan bara fyra sitter i det villkorade `docs`-jobbet. Grindarna har egna
  dokumenterade incidenter bakom sig och ska behållas — de skyddar bara aldrig
  appen. **Starkt indikerad** (jag har verifierat regionens gränser och att
  `scripts/check-docs.sh` bär elva `run_gate`-poster; den exakta uppdelningen
  tio mot fyra är leverabel 9:s räkning, som jag inte räknat om).
- **Föreslagen förändring:** flytta de tio in i `docs`-jobbets villkor.
  Paritetsgrinden `scripts/check-listparitet.sh` vaktar att `lint`-jobbets
  `bash scripts/check-*.sh`-körningar hålls mängd-lika med
  `check-docs.sh`:s `run_gate`-lista — den listan måste följa med, annars
  fäller grinden. Det är en fördel: flytten kan inte göras halvt.
- **Förväntad effekt:** sekunder per kodändring, och rätt signal.
- **Risk:** låg, men detta är formellt en försvagning: en kodändring granskas
  efter flytten av tio kontroller färre.
- **Berörda filer och externa inställningar:** `.github/workflows/ci.yml:643-836`,
  `scripts/check-docs.sh`, `.listparitet-policy.conf`. Inga externa.
- **Beroenden:** N1, N4 (paraplyets `needs` bör vaktas innan jobbmängden rörs).
- **Verifieringsmetod:** en ren kodändring ⇒ de tio grindarna `skipped`; en ren
  textändring ⇒ samtliga fjorton körda; `scripts/check-listparitet.sh` grön i
  båda fallen.
- **Rollback:** revert-PR.
- **Rekommendation: SENARE. Kräver ägarens uttryckliga GO.** Vad som består:
  samtliga fjorton grindar kör oförändrat på varje dokumentändring, och
  `docs`-jobbet står kvar i paraplyets `needs`, så ett rött dokumentjobb
  blockerar fortfarande landning.

### SE3 — En vakt på att huvudgrenen faktiskt når användaren

**I klartext.** Hela apparaten vakar över vägen fram till huvudkoden. Att
huvudkoden sedan blir den app som faktiskt körs är obevakat. Det har hänt minst
en gång att appen stod gammal i över tjugo timmar utan att någon mekanism
märkte det; en människa upptäckte det. Det låter som en självklar sak att bygga
— och det är precis därför den här posten är intressant, för projektet har redan
utrett saken och sagt nej med mätta skäl.

- **Prioritet:** medel. Hög i risk, men frågan är inte avgjord.
- **Problem:** `TASK-199` (High, To Do, etikett `ready-for-human`, öppet sedan
  2026-08-11) bokför händelsen. Ingen mekanism upptäcker en produktion som står
  still. Efter KG2:s fynd om tillbakarullningens bieffekt (N9) blir luckan
  viktigare, inte mindre viktig: efter en tillbakarullning slutar automatiken
  helt tills någon aktivt slår på den igen.
- **Föreslagen förändring — och läs kortets egen utredning först.** Två
  leverabler föreslår att bygga kortets verifikationskommando som en nattlig
  vakt. **Kortets egen utredning avvisade uttryckligen en CI-grind**, med
  mätta skäl: *"CI-GRIND: NEJ. ... En grind som diffar deployad bundle mot HEAD
  kapplöper med sig själv (merges 2–5 min, byggen 7–10 min) och blir TASK-128:s
  falsklarm om igen (sju på en natt)."* Golvet behölls medvetet som
  verifiering på begäran vid driftsättning. Den formen leverabel 6 föreslår är
  en ANNAN mekanism — händelsedriven (`repository_dispatch` från plattformen när
  en produktionsversion är klar) i stället för pollande — och den är därmed inte
  det kortet avvisade. Men den är inte heller prövad mot kortets invändning.
  **Förslaget är därför att avgöra frågan, inte att bygga vakten:** läs kortets
  utredning och den händelsedrivna formen mot varandra, och besluta. Kortets
  redan skarpt prövade tvåändade instrument (jämförelse av utrullad commit mot
  huvudgrenen, plus en kontroll av svarets innehållstyp) är byggstenen oavsett
  vilken form som väljs.
- **Förväntad effekt:** stänger den enda felklassen i granskningen där
  ingenting alls vakar. Ingen tidsvinst.
- **Risk:** medel — och risken är namngiven och mätt: falsklarm. Sju på en natt
  är den historiska instansen.
- **Berörda filer och externa inställningar:** ett nytt jobb i
  `.github/workflows/nightly.yml` eller en ny workflow; kortets instrument.
  **Externa:** en webhook från Vercel till GitHub om den händelsedrivna formen
  väljs, plus ett `repository_dispatch`-hemligt värde.
- **Beroenden:** N1. Bör ligga efter N2, så att larmet hamnar i en läsbar kanal.
- **Verifieringsmetod:** tvåsidig — vakten ska fälla när utrullad commit är en
  förfader till huvudgrenens topp med mer än N landningar emellan, och vara tyst
  i normalläget. Mät falsklarmsfrekvensen i två veckor innan den får larma
  skarpt.
- **Rollback:** ta bort jobbet.
- **Rekommendation: SENARE**, och som ett BESLUT före ett bygge. Att bygga den
  pollande formen utan att läsa kortet vore att riva ett medvetet designval.

### SE4 — Lyft ut CI till en delad modul

**I klartext.** Testmaskineriet skulle kunna bo i ett eget litet projekt som
flera repon lånar, i stället för att bo här. Leverabel 10 ritar hela den
arkitekturen — och landar i att den inte ska byggas än, eftersom det bara finns
en kund: detta repo. Villkoret för när den blir rätt bör stå skrivet, inte
kännas efter.

- **Prioritet:** låg.
- **Problem:** ingen i dag. Frågan är ställd och ritad i leverabel 10; risken är
  att målarkitekturen läses som en beställning.
- **Föreslagen förändring:** skriv ned inträdesvillkoret och lämna tråden
  pausad. Villkoret, i tre delar som alla måste hålla: (1) ett andra
  produktrepo finns och har landat kod i minst två veckor; (2) nattkontrollen
  har varit grön eller läsbart röd i två veckor (efter N2); (3) de sex mogna
  komponenterna är fortfarande orörda. Två veckor är en öppet deklarerad
  startbedömning, inte en mätning.
- **Förväntad effekt:** ingen i dag. Effekten är att ett utlyft inte görs för
  tidigt, och att det går att göra när villkoret väl håller.
- **Risk:** att "vänta" läses som "gör ingenting". Stegen 0–5 i leverabel 10 är
  arbete som bör göras nu, och de motsvarar N2, N3, SE10, SE11, SE12 och SE13
  i denna plan.
- **Berörda filer och externa inställningar:** trådregistret. Vid ett framtida
  utlyft: ett nytt publikt repo i organisationen.
- **Beroenden:** hela "nu"-högen, plus ett andra repo som inte finns.
- **Verifieringsmetod:** villkoret prövas mot verkligheten, inte mot en känsla:
  finns repot, har det landat kod i två veckor, är natten läsbar.
- **Rollback:** inget att backa.
- **Rekommendation: SENARE, med villkoret skrivet.**

### De övriga sjutton

| # | Åtgärd | Problem den löser | Effekt | Beroende eller inträdesvillkor | Rollback |
|---|---|---|---|---|---|
| **SE5** | Kuratera en namngiven lista över 5–15 kritiska realistiska flöden, med utskickskedjan överst | Av 34 filer i `tests/e2e/` är två genuint realistiska; utskicken (bekräftelse, påminnelse, eventinfo) saknar test genom hela kedjan på NÅGON nivå. Den mest oåterkalleliga handlingen appen gör | Stänger produktrisken med störst konsekvens. Kostar körtid i staging-mutexen | N1. Bör ligga efter N2 så att nya röda tester syns | Ta bort de nya testerna |
| **SE6** | Bind fler av de elva obundna låtsassvaren till kontraktsvakten, och mekanisera pariteten | Låtsasvärlden efterliknar arton serverfunktioner; nattvakten jämför sju mot verkligheten. Elva kan glida utan att något märks | Stänger den tystaste risken i testarkitekturen | N1, N2 (vakten är röd nio nätter av 56 — den måste vara läsbar först) | Ta bort de nya fallen |
| **SE7** | Flytta de filer i `tests/e2e/` som redan är hermetiska till `tests/acceptance/`, och sätt ett tak eller larm på acceptance-klassens storlek | Katalognamnet bär en trovärdighet innehållet inte håller; klassen växte 18 → 61 filer och fällde CI en gång | Ingen funktionsförlust; katalognamnet blir sant igen | N6 (delningen ändrar vad ett tak ska mätas mot) | Flytta tillbaka |
| **SE8** | Ge skrivvägen mot datakällan samma omförsök vid 429 som läsvägen redan har | `airtable-client.ts` anropar `withAirtable429Retry` på rad 121, 196 och 241 (läsning) men aldrig i de sex skrivande funktionerna (`:266`, `:308`, `:353`, `:411`, `:448`, `:497`). Ingen bokförd motivering finns | En registrering eller betalning kan annars falla för att en testkörning samtidigt använde kvoten | Kräver en idempotens-genomgång per funktion först — flera är redan säkra att göra om | Ta bort omslaget per funktion |
| **SE9** | Bygg sentinel-städningen i staging-testernas setup-purge | En delad testrad driftar; inträffat tre gånger, senast 2026-09-07. Efterkontrollen blir röd av fel skäl | Tar bort en återkommande falsk rödhet | N1 | Revert |
| **SE10** | Parametrisera layouten i de fjorton skript som hårdkodar sökvägar (`.grind-layout.conf`) | Konventionen "config-driven" är i dag ungefärlig, inte sann | Gör skillnaden mellan "kan kopieras med anpassning" och "kan anropas oförändrad" | N1. Leverabel 10:s billigaste enskilda steg | Revert; filen kan ligga kvar oanvänd |
| **SE11** | Lyft de fem mogna agent-hookarna till pluginet | Den enda centraliseringen som har kunder i dag — tretton andra repon | Fem skydd börjar verka utanför detta repo | Kräver eget verifieringssteg: en flyttad hook ska fälla skarpt i ett annat repo INNAN den tas bort lokalt | Ta bort ur pluginet, återregistrera lokalt |
| **SE12** | Flytta huvudskyddet till ett organisations-ruleset | Nästa repo ärver skyddet utan konfiguration | En inställning i stället för en per repo | **Fälla som måste lösas först:** ett organisations-ruleset gäller ALLA repon, och två av organisationens fyra saknar CI som rapporterar den obligatoriska kontrollen. Läs `conditions.repository_name`-mekanismen först | Rulesetet är API-togglabart; vägen tillbaka är prövad skarpt |
| **SE13** | Underhåll modulens kontrakt — EN fil som beskriver hela flödet | Ingen fil beskriver helheten; minsta säkra läsmängd är cirka 5 900 rader | Sänker läsbördan för varje ny agent | **Omdefinierad:** leverabel 1 (huvudrapporten) levererar första versionen. Steget blir att peka styrande dokument dit och hålla den aktuell | Det är en fil |
| **SE14** | Härled fältet "Månad/år" med en formel i stället för en fast lista | Listan kan ta slut igen om två år | Felklassen försvinner permanent | N7 (fyll listan först — formeln är en egen ändring med eget beslut) | Återgå till listfältet; kräver omskrivning av befintliga poster |
| **SE15** | Koppla in Denos egna verktyg för serverfunktionerna | 24 av 135 filer typkontrolleras via en genväg byggd för en annan körmiljö; `ADR-010` lovade Deno-verktygen i maj 2026 | Stänger en obetald skuld på appens enda skrivväg mot databaserna | N1. Sannolikt eget kort — ytan är stor | Ta bort steget |
| **SE16** | En tidsregel och en namngiven ägare för rött efter landning, plus att svepet rapporterar nattens och efterkontrollens rött | 16 larm stod obesvarade i 10–11 dygn; `TASK-365` AC #3 begär just detta och `scripts/heartbeat-svep.sh` bevakar i dag bara öppna ändringsförslags kontrollstatus | Gör N2:s läsbara signal till ett svar | N2 (annars rapporteras en signal som inte betyder något) | Ta bort raden ur svepet |
| **SE17** | Ett förfallodatum för obeslutade grenar | En gren med 40 commits har passerat fem sessionsavslut utan att frågan "landa eller kasta?" besvarats | Ingenting går förlorat i dag, men frågan kan åldras obegränsat | Bygg in i det befintliga worktree-svepet | Ta bort kontrollen |
| **SE18** | Byte-identitet mellan paraplyets logik och dess replik i bevis-workflowen | Repliken är en handhållen kopia som kan glida utan att något märks | Replik-drift blir omöjlig; en grön körning från förr bevisar fortfarande dagens logik | Bunta med N4 om det är billigt | Ta bort hävdelsen |
| **SE19** | Klarlägg vilket konto som äger respektive nyckel mot datakällan, och bokför det | En tidigare obokförd gräns på 50 anrop per sekund delas över alla nycklar från SAMMA konto, oavsett databas. Namnen på variablerna är bevisat opålitliga som vägledning | Stänger en osynlig delad resurs mellan test och produktion | Kräver en titt i leverantörens kontoinställningar — ägarens kanal | Det är en anteckning |
| **SE20** | Lås de fyra externa byggstenarna i `ci-suite.yml` till exakta versioner (`:903`, `:945`, `:950`, `:963`) | Filens övriga sju referenser är låsta; det sist tillagda jobbet bröt formen utan att något märkte det | Ingen policy är bruten (alla fyra är GitHubs egna), men formen blir konsekvent | N1 | Revert |
| **SE21** | En ADR-karta över de trettio CI-besluten, och CI-avsnittet ut ur den alltid-laddade filen | Varje färsk agent laddar ett CI-avsnitt den oftast inte behöver; cirka 1 589 spawns på 51 dagar | Lägre fast kostnad per agent, lägre tröskel för att förstå helheten | Efter SE13, som är kartan den ska peka på | Revert |

---

## Inte alls

Elva förslag som granskningen bar och som jag avråder från. **"Inte alls" är
lika obligatorisk som de andra två högarna:** uppdraget kräver skydd mot både
överbyggnad och mot alltför aggressiv förenkling, och sju av de elva nedan är
förenklingar.

| # | Förslag | Varför inte |
|---|---|---|
| **I1** | **Riv merge-dedupen** | Den mäter **32 av 32** träffar där den kan göra nytta. Underlaget som kallade den *"i praktiken utan verkan"* föll: dess stickprov var inte begränsat till den enda yta mekanismen är tillämplig på. Man river inte något som träffar hundra procent |
| **I2** | **Godkännandekrav eller ägarbunden granskning på `ci.yml`** | Återvändsgränd, inte avvägning. GitHub tillåter inte att man godkänner sin egen ändring, och det finns en ägare — varje ändringsförslag skulle fastna. Risken bärs redan: `ci.yml` är alltid kodklassad, så granskningsspärren i kön gäller den |
| **I3** | **En `paths:`-utlösare på bevis-workflowen `gate-proof.yml`** | Mekaniserar konventionen utan att laga problemet — repliken förblir en kopia. Den lägger en grön kontroll på varje `ci.yml`-ändring som ingen läser. SE18 löser det som faktiskt kan gå fel |
| **I4** | **Sätt gruppstorleken i merge-kön till en** | Skulle stänga samma hål som N3, men genom att ta bort köns gruppering. Priset: efterkontrollens dyra svit (16–56 minuter, global mutex) körs en gång per ändringsförslag i stället för en gång per grupp om upp till tre. N3 är 25 rader med en revert; detta är en plattformsinställning med en mångdubblad kostnad. **Nämns som reservväg om N3 visar sig omöjlig, inte som alternativ** |
| **I5** | **En veckovis sammanfattning av nattlarmet** | Ett presentationslager ovanpå ett signalproblem. K2:s alternativ 1 ändrar VAD som räknas som rött; detta ändrar bara hur det visas. Att svara på ett signalproblem med ännu en mekanism gör problemet värre |
| **I6** | **En ny grindvakt mot prosa som bär ett TAL eller påstår en FRÅNVARO** | Rätt diagnos, fel motmedel. Av sju historiskt funna hål hittades **ett** av en maskin; två av incidenter och fyra av manuell granskning. Det som hittar hål är genomlysningar, inte vakter. Den minsta formen — ersätt talet med kommandot som räknar — ligger i N8 och kostar inget |
| **I7** | **Mallrepo, sammansatta åtgärder, generator eller ett `.github`-specialrepo** | Alla fyra förutsätter fler än ett konsumerande repo. Ett mallrepo löser dessutom fel problem: felet är inte att kopiering är svårt, utan att kopior driver isär |
| **I8** | **Sänka push-frekvensen eller bunta pushar per session** | Redan avvisat i `ADR-097` § Decline-rationale med fyra namngivna, mätta skäl. Ingen mätning i denna granskning ger nytt skäl att ompröva |
| **I9** | **Flytta CI till en egen maskin** | Mätt fel för oss: 910,7 sekunder lokalt mot 401,0 i CI, en belastning på 269 på sexton kärnor av enbart textlintning, och molnminuterna är gratis eftersom repot är publikt. Principen håller; åtgärden vänder tecken vid en agentflotta |
| **I10** | **Maskininlärt testurval, spekulativ kö-parallellism, kanarie-utrullning, beroendegrafverktyg, en testmatris-instrumentpanel, en sheriff-ORGANISATION** | Samtliga förutsätter en datamängd, en organisationsstorlek eller en testmatris vi inte har. Sheriff-FUNKTIONEN är däremot rätt, och ligger i SE16 |
| **I11** | **Produktifiera eller frys de trasiga delarna i en delad modul** | Ett kit gör ett lokalt fel till ett spritt fel. Ordningen laga → stabilisera → lyft ut är inte en artighet |

---

## Två vägval som är ägarens

Båda är genuina avvägningar. Ingen av dem har ett svar som följer av mätningen
ensam, och båda måste besvaras explicit — det går inte att göra lite av båda
utan att förlora poängen med endera.

### K1 — Ska beroendegranskningen fortsätta blockera även rena textändringar?

**Vad frågan gäller.** `audit` letar efter kända säkerhetshål i den
tredjepartskod projektet lånar. Sedan 2026-09-04 kör den på VARJE ändring, utan
undantag — ett medvetet val, utskrivet i koden. Följden är den situation repot
står i just nu: två öppna varningar låser varje landning, inklusive rena
textändringar.

**Alternativen:**

| Väg | Vad som händer | Vad det kostar |
|---|---|---|
| **(a) Behåll diff-oberoendet** (dagens läge, `TASK-395`) | En ny säkerhetsvarning blockerar VARJE landning inom minuter | En textändring väntar på en granskning som per definition inte kan hitta något nytt i den diffen. Och en varning i en byggsten vi inte äger fryser hela flödet tills någon agerar — mätt: nio dagar |
| **(b) Villkora mot beroendeträdet** | `audit` kör bara när `package.json`, `package-lock.json` eller låsningarna ändrats | En ny varning mot ett OFÖRÄNDRAT träd upptäcks först av nattkontrollen, alltså inom ett dygn i stället för inom minuter |

**Det som gör frågan avgörbar, och som ingen leverabel skrev ut.** Jobbet gör
i dag TVÅ saker som är olika till sin natur:

1. *"Introducerade den här ändringen ett sårbart beroende?"* — hör hemma på
   ändringsförslaget, och kan villkoras mot beroendeträdet utan förlust.
2. *"Har omvärlden publicerat en ny varning mot vårt befintliga träd?"* — är
   inte en granskning av ändringen alls. Det är en daglig avläsning av
   varningsdatabasen, i ett jobb som råkar se ut som en grind.

**Och funktion 2 finns redan byggd.** `nightly.yml:67-90`
(*"Bredare sårbarhetsgranskning"*) kör `npx audit-ci --moderate` — alltså
BREDARE än dagsvitens `high`. Jag har läst båda stegen.

**Min rekommendation: (b), men inte förrän N2 har landat.** Skälet är en hård
koppling som gör frågan sekventiell i stället för öppen: väg (b) flyttar
lastbärandet till nattkontrollen, och nattkontrollen har varit oläslig i sju
veckor. Att villkora `audit` i dag vore att lämna över ansvaret till en kanal
som ingen kan läsa. Efter N2 — och med `nightly-audit` i en egen, tredje kanal,
vilket är en liten utvidgning av samma ändring — är bytet *"inom minuter"* mot
*"inom ett dygn"* en avvägning som går att försvara i klartext.

**Kräver ägarens uttryckliga GO — landas aldrig av en agent på eget bevåg.**
Vad som består efteråt, konkret: (i) varje ändring som rör beroendeträdet
granskas som i dag, på ändringsförslaget, med blockerande verkan; (ii) hela
trädet granskas varje natt med en STRÄNGARE tröskel än dagsviten; (iii)
`audit` står kvar i paraplyets `needs`, så ett rött resultat blockerar
fortfarande; (iv) `ADR-028`:s konventionsflöde för undantag är orört.

**Om ägaren väljer (a)** — vilket är ett fullt försvarbart val, och det som
gäller tills han säger annat — bör beslutet ändå bära en följd: en varning i en
byggsten vi inte äger måste då ha en snabbare åtgärdsväg än nio dagar, eftersom
den fryser allt. `ADR-028`:s femstegsflöde ÄR den vägen; den behöver bara
användas.

### K2 — I vilken ordning ska nattkontrollens signal lagas?

**Vad frågan gäller.** Tre olika första-steg har föreslagits, av tre olika
agenter, mot samma problem: att 21 identiska obesvarade larm i rad har
normaliserat rött.

| Alternativ | Vad det ändrar | Vad det inte löser |
|---|---|---|
| **(1) Skilj bokföringsgrindarna från testsviten** | VAD som räknas som rött | Löser inte att larmen hopar sig i den kanal som blir kvar |
| **(2) Ge nattlarmet en dubblettspärr** | HUR OFTA ett nytt ärende skapas | Löser inte att rött betyder två olika saker |
| **(3) Bygg en veckovis sammanfattning** | HUR informationen presenteras | Löser ingetdera |

**Min rekommendation: (1) först, med (2) inbyggt där den hör hemma, och (3)
inte alls.**

Skälet är att (1) är den enda som gör rött meningsfullt igen, och att den
levererar (2) på köpet för den kanal som behöver den: mönstret från
länkkontrollen (`nightly.yml:195-260`) ÄR ett stående ärende som kommenteras i
stället för att dupliceras, och det är den formen bokföringskanalen ska få. Det
är precis N2:s förslag.

**Vad jag medvetet INTE föreslår: att också ge produktkanalen en dubblettspärr,
i samma steg.** Ett produktfel som återkommer natt efter natt är ett verkligt
besked, och ett stående ärende skulle dämpa just det. Mät fyra veckor efter
N2. Producerar `ci-natt` fortfarande närmast identiska ärenden natt efter natt
är en dubblettspärr rätt även där — men som ett andra steg, fattat på data.

**(3) döms inte alls**, av samma skäl som I6: svaret på ett signalproblem ska
inte vara ännu en mekanism som ska läsas.

**Sekvensfråga som hör ihop med K2, och som är ägarens:** `ADR-131` § beslut 7
river bokföringskanalens största bidragsgivare — grinden Backlog-stängning stod
för 44 av 56 röda nätter. Sätts en brytdag före delningen krymper problemet av
sig självt. Se nästa avsnitt.

## Tre beslut till som är ägarens

### B1 — Brytdagen för `ADR-131`

`ADR-131` är **Accepted sedan 2026-09-04** (grillad samsyn, nio beslut
kvitterade) och dess `## Updates` säger *"Inga än."* Beslut 7 namnger vad som
ska rivas, bland annat nattjobbet Backlog-stängning och
`scripts/check-backlog-closure.sh` — som fortfarande ligger på disk. Under
tiden underhålls grinden aktivt: två ändringsförslag städade 30 inkonsistenta
kort tretton dagar efter beslutet.

**Ett Accepted-beslut utan brytdag är en stående kostnad.** Alternativen är
tre: sätt ett datum; lyft grinden ur nattkontrollens rött/grönt under tiden
(vilket N2 gör ändå, som en sidoeffekt); eller ompröva beslutet öppet. Det som
inte är ett alternativ är att låta det stå. **Min rekommendation: sätt ett
datum.** Det är billigt, och det gör N2 lättare att motivera, eftersom
bokföringskanalens tyngsta post då har ett slutdatum.

### B2 — Listan "Månad/år" i produktionsdatabasen

Se N7. Skrivning i produktionsbasen är ägarens kanal; agenter är mekaniskt
spärrade. Beslutet är bara **när**, och svaret bör vara i dag: felet biter på
eventets startdatum, inte på dagens.

### B3 — Enterprise-planens syfte

**Fakta, inget förslag.** Merge-kön krävde aldrig Enterprise-planen. GitHubs egen
källtext, hämtad ur dokumentationens källkod 2026-09-17: *"Pull request merge
queues are available in any public repository owned by an organization, or in
private repositories owned by organizations using GitHub Enterprise Cloud."*
Repot är och förblev publikt, och organisations-ägandet — som verkligen krävdes
— hade räckt på vilken plan som helst.

**Men det finns ett kvarstående, verifierat skäl att behålla planen** som inte
var det ursprungliga: samtidighetstaket för CI-jobb är 500 på Enterprise mot 60
(Team), 40 (Pro) och 20 (Free). En agentflotta som kör fem samtidiga fulla
körningar ligger kring 80 jobb. **Det skälet är i dag obevisat, inte
motbevisat** — ingen mätning i granskningen isolerar vårt faktiska
samtidighetsbehov från vår EGEN interna mutex-kö.

**Två saker väger dessutom åt planens håll och är inte mätta här:**
organisationens tre privata repon (för vilka Enterprise faktiskt krävs om de
ska ha merge-kö), och organisations-rulesets, som SE12 föreslår men som i dag är
oanvända.

**Min rekommendation: behåll planen tills samtidighetsbehovet är mätt.**
Kostnaden är liten (i storleksordningen 11–21 USD i månaden) och kostnaden av
att nedgradera för tidigt — en agentflotta som plötsligt köar mot ett
60-jobbstak mitt i en session — är operativt värre. Mätningen som avgör:
jobb-nivåns kötid jämförd med antalet samtidiga körningar under en mätt intensiv
session.

## Där jag dömt annorlunda än en leverabel eller än KG1

Kontraktet kräver att motsägelser registreras öppet. Tio ställen.

1. **Leverabel 9: "Riv körningen på huvudgrenen vid landning" som LÅG risk.**
   Jag flyttar den till "senare" med hård beroendekedja och GO-krav. Skälet är
   S31, live-mätt 2026-09-17 medan denna plan skrevs: vid en grupplandning är
   det just den körningen som klassar hela spannet och kör de hermetiska
   klasserna för kod som ligger under en text-topp. Orkestrerarens egen
   invändning — att "det enda nätet" kunde vara för starkt — prövades och väger
   lättare än den såg ut.
2. **Leverabel 9 D1 och D2 som TVÅ åtgärder.** De är samma spak. Att byta
   dedupens fråga ÄR mekanismen genom vilken den fjärde körningen slutar kosta.
   Att räkna dem som två inbjuder till att göra båda och därmed också ta bort
   ytan dedupen lever på.
3. **Leverabel 6:s tabellrad "Riv eller omformulera dedupen".** "Riv" döms inte
   alls (32 av 32). "Omformulera" är SE1.
4. **Leverabel 3 rek 3 och leverabel 6 punkt 4: bygg `TASK-199`:s
   verifikationskommando som nattlig vakt.** Jag flyttar den till "senare" och
   omformulerar den till ett BESLUT före ett bygge. Skälet: kortets egen,
   redan gjorda utredning avvisar uttryckligen en CI-grind med mätta skäl
   (*"CI-GRIND: NEJ"*, falsklarmsrisken sju på en natt). Ett förslag som river
   ett medvetet designval ska läsas mot beslutet först.
5. **Ingen leverabel satte avblockeringen av kön först som ett HÅRT
   beroende.** Leverabel 9 listar den som punkt två under "Först". Jag gör den
   till åtgärd 1 och till förutsättning för varje annan åtgärd, eftersom
   `audit` är obligatorisk och diff-oberoende: med två öppna varningar kan
   ingenting landa, inte heller lagningarna.
6. **KG1:s ordning 4 → 1 → 3 → 2 behålls, men med N1 inskjutet före allt.**
   KG1:s inbördes ordning står oemotsagd; den saknade bara den mekaniska
   förutsättningen.
7. **KG1 rek 5 och 6 (knyt `TASK-365` till `T166`; bocka `TASK-239` AC #3)
   buntas.** De rör inga körytor och delar granskningsväg. Tre separata
   ändringsförslag för tre bokföringsposter är onödig ceremoni.
8. **Leverabel 9: "Bygg en vakt mot prosa som bär ett TAL eller påstår en
   FRÅNVARO".** Döms **inte alls** i sin vakt-form, och ersätts av den
   minsta formen (ersätt talet med kommandot som räknar), som redan låg i
   leverabel 8 rek 5 och nu ligger i N8. Skälet är leverabel 6:s egen mätning:
   av sju historiskt funna hål hittades ett av en maskin.
9. **KG2 A4: gruppstorlek ett i merge-kön.** Döms inte alls som väg till
   täckningsluckan, och bokförs i stället som reservväg om N3 visar sig omöjlig.
10. **Leverabel 10 steg 5 ("skriv modulens kontrakt") omdefinieras.**
    Huvudrapporten (leverabel 1) levererar första versionen av just det
    dokumentet under denna granskning. Steget blir att underhålla den och peka
    styrande dokument dit, inte att skriva den från noll.

**En rättelse inuti ett underlag, registrerad men inte löst:** KG1 anger
kostnaden för N3 till *"73 extra post-merge-sviter"* och skriver samtidigt att
ett alternativt vägval *"sparar 13 av de 73 körningarna"*. Mot KG1:s egen
fördelningstabell (60 hål plus 13 pushar vars topp redan är kodklassad, av 73
flerpostspushar) borde det TILLKOMMANDE antalet vara 60, och de två vägvalen
borde ge samma tal i detta mätfönster, eftersom tabellen anger noll
flerpostspushar där hela spannet är text. Jag har inte kunnat räkna om det.
**Märkt osäker**; riktningen (tre till fyra fler tunga efterkontroller per
dygn) är oomtvistad.

## Osäkerheter och vad jag inte kunde belägga

| Påstående | Märkning | Vad som krävs för att fylla luckan |
|---|---|---|
| Kostnaden för N3 i antal extra efterkontroller | **osäker** — KG1:s 73 mot dess egen tabells 60 | Räkna om mot KG1:s rådata, eller mät en vecka efter att N3 landat med `npm run metrics:ci` |
| Att `audit` är det ENDA som blockerar kön i dag | **starkt indikerad** | Jag har läst jobbets oberoende av klassningen och dess plats i paraplyets `needs`, och KG3:s mätning av 14 av 14 röda körningar. Jag har inte själv kört `gh run list` i dag — kontraktet ber om sparsamhet mot API:t och en annan session använder det |
| Att en rättad version av `sharp` och `smol-toml` finns publicerad | **ej verifierad** | `npm view sharp versions` och `npm view smol-toml versions`. Jag har läst de sårbara intervallen (`<0.35.4` respektive `<=1.7.0`) men inte prövat att en rättad version går att installera |
| Uppdelningen tio mot fyra av dokumentationsgrindarna | **starkt indikerad** | Leverabel 9:s räkning. Jag har verifierat regionens gränser (`ci.yml:643-836`) och att `scripts/check-docs.sh` bär elva `run_gate`-poster, men inte räknat om fördelningen |
| Att en delning av självtestet i tre bevarar det tvåsidiga beviset | **ej verifierad** | Det är åtgärdens designfråga, inte dess förutsättning. Måste avgöras i planeringen: den saknade delen är en kontroll av att skärvornas summa är lika med hela klassen |
| Att den händelsedrivna formen av stale-vakten undgår kortets falsklarms-invändning | **osäker** | Kortets invändning gäller en pollande grind som kapplöper med byggtiden. En händelsedriven form fyrar efter bygget — men det är ett resonemang, inte en mätning. Mät falsklarmsfrekvensen i två veckor innan den får larma |
| Vårt faktiska samtidighetsbehov mot GitHubs jobbtak | **ej verifierbar** i denna granskning | Ett nytt, riktat mått: jobb-nivåns kötid jämförd med antalet samtidiga körningar under en mätt intensiv session |
| Om nyckeln mot teststället och nyckeln mot produktionen delar konto | **ej verifierbar** av mig | Leverantörens egen sida över nycklar, eller en riktad fråga till ägaren om vilket konto som skapade respektive nyckel |
| Att de 60 hålen faktiskt DOLDE ett fel | **ej verifierbar** | KG1 mätte att kontrollen uteblev, inte att något var trasigt. En bakåtkörning mot de 60 träden vore möjlig men dyr och sannolikt inte värd det |

**Två saker jag medvetet inte gjorde:** jag körde inte `npm run check:docs`
(kontraktets förbud, en helgrind på delad maskin med ett tjugotal samtidiga
skribenter), och jag rörde ingen annan fil än denna.

## Risker

1. **Att "nu"-högen läses som en beställning till en agent.** Fyra av de nio
   åtgärderna bär ett designbeslut eller ett GO-krav i sig. N6:s värde ligger i
   att designfrågan besvaras först; N7 är ägarens handgrepp; N1:s
   reservväg och K1 kräver GO. En agent som plockar dem som rena arbetsspecar
   bygger fel sak.
2. **Att SE1 görs för tidigt.** Den viktigaste meningen i denna plan är inte
   ett tal utan en ordning: en förbättrad dedup före N3 förvandlar 60 fördröjda
   kontroller till 60 permanenta hål. Den risken är namngiven av KG1 och
   bekräftad live av S31.
3. **Att N2 läses som att problemet försvinner.** Delningen gör signalen
   läsbar; den gör inte natten grön. Hälften av nätterna bär ett verkligt
   produktfel, och det arbetet — staging-fällningarna och kontraktsvakten —
   återstår efteråt. Det är SE5 och SE6, och de är större än en vecka.
4. **Att "senare" läses som "aldrig".** Sjutton av de tjugoen posterna i
   "senare" är verkligt arbete med verkligt värde. De ligger där för att
   "nu"-högen ska vara liten nog att faktiskt bli gjord, inte för att de är
   oviktiga.
5. **Att granskningen slutar med ett tillägg.** Det starkaste argumentet för
   att komplexiteten börjat motivera sig själv är inte något tal — det är att
   ingen mekanism någonsin frågar om SUMMAN av alla välmotiverade tillägg
   fortfarande är proportionerlig. Denna plan innehåller **en** ny mekanism
   (N4:s vakt på trettio rader) och tar bort eller flyttar sju. Blir utfallet
   det omvända har mönstret bekräftats.
6. **Att `T166` förblir oanvänd en tredje gång.** Tråden har haft rätt sedan
   2026-08-21 och är pausad. Denna plan är dess tredje läsning. Sker ingenting
   är sannolikheten hög att en femte fix på samma yta skrivs av någon som inte
   hittade den.

## Rekommendationer

**Detta är rekommendationer, inte beslut. Ägaren äger prioriteringen.**

1. **Börja med N1, och betrakta den som en förutsättning, inte en åtgärd.**
   Ingenting i denna plan kan landa medan kön står stilla, och den har stått
   stilla i nio dagar.
2. **Gör sedan N2 och N3, i den ordningen, och ensamma.** De är de två
   billigaste åtgärder som stänger den felklass hela granskningen pekar mot: ett
   grönt som inte betyder något. Att göra dem ensamma är ett metodval — då går
   effekten att mäta.
3. **Låt N6 gå parallellt.** Den rör andra filer, den har ett kort som väntar,
   och den är den enda åtgärden i planen som ägaren kommer att MÄRKA: halva
   väntan försvinner.
4. **Besvara K1 och K2 i klartext innan någon rör `audit` eller
   nattkontrollen.** Båda är avvägningar, och båda blir fel om de görs "lite av
   varje".
5. **Sätt ett datum på `ADR-131`.** Det är det billigaste beslutet i hela
   granskningen och det som gör mest för att bokföringslagret ska sluta växa.
6. **Skär i bokföringen, inte i testarkitekturen.** Den fasta overheaden är
   verklig och stor — men den sitter till största delen i arbetsformens egen
   bokföring, inte i testerna. Att skära i testarkitekturen skulle kosta
   säkerhet utan att ge tillbaka den tid som faktiskt går förlorad.
7. **Ställ summfrågan igen på `review_by`-datumet.** Denna fils frontmatter
   säger 2026-12-17. Det behövs ingen ny mekanism — det behövs att frågan
   faktiskt ställs: *är summan av alla dessa välmotiverade tillägg fortfarande
   proportionerlig?*

## Alla åtgärder på en skärm

| # | Åtgärd, en mening | Hög | Sparad väntan eller stängd risk | Kräver GO |
|---|---|---|---|---|
| N1 | Höj beroendelåsen och laga klockbuggen så att kön kan röra sig igen | **LÖST 2026-09-17** (`#2491`, `TASK-444` — se statusnoten i N1) | Låste upp nio dagars stillestånd; frågan bakom lever kvar som K1 | — |
| N2 | Ge bokföringsgrindarna en egen larmkanal så att rött betyder en sak | **nu** | Gör ett skyddsnät läsbart som varit blint 51 av 52 nätter | nej |
| N3 | Låt efterkontrollen klassa hela det pushade spannet, inte bara toppen | **nu** | 60 kodlandningar per nitton dagar får tillbaka staging- och tillgänglighetskontroll | nej |
| N4 | Vakta att varje toppnivåjobb står i den obligatoriska kontrollens lista | **nu** | Gör en tyst felklass omöjlig i stället för osannolik | nej |
| N5 | Rätta den falsifierade motiveringen på två ställen | **nu** | Stänger den fjärde mätta instansen av "sann när den skrevs" | nej |
| N6 | Dela hermetik-självtestet som den klass det speglar redan är delad | **nu** | ~16 minuter per landning; väntan faller från ~25 till ~12 min | nej |
| N7 | Fyll på listan "Månad/år" med tolv val för 2027 | **nu** | Den enda säkra produktrisken i registret | **ja** (produktionsdatabas) |
| N8 | Rätta fyra falska påståenden, två kort, och börja bokföra granskarens missar | **nu** | Gör review-grindens träffsäkerhet mätbar; stoppar felriktat arbete | nej |
| N9 | Skriv rollback-runbooken med steget som slår på automatiken igen | **nu** | Gör en oövad återställningsväg övad | nej |
| SE1 | Byt dedupens fråga till SHA-identitet med villkoret "sviten körde" | senare | ~225 färre sviter per nitton dagar; ingen ledtidsvinst | **ja** |
| SE2 | Flytta de tio alltid-på dokumentgrindarna till dokumentvillkoret | senare | Sekunder, och rätt signal på en kodändring | **ja** |
| SE3 | Avgör formen för en vakt på att huvudgrenen når användaren | senare | Stänger den enda felklass där ingenting alls vakar | nej |
| SE4 | Skriv ned villkoret för att lyfta ut CI till en delad modul | senare | Hindrar ett utlyft som görs för tidigt | nej |
| SE5 | Kuratera 5–15 realistiska flöden, med utskickskedjan överst | senare | Stänger produktrisken med störst konsekvens | nej |
| SE6 | Bind fler av de elva obundna låtsassvaren till nattvakten | senare | Stänger testarkitekturens tystaste risk | nej |
| SE7 | Flytta de hermetiska filerna ur e2e-katalogen och sätt ett tak | senare | Gör katalognamnet sant; hindrar nästa takfällning | nej |
| SE8 | Ge skrivvägen mot datakällan samma omförsök som läsvägen | senare | En registrering kan annars falla på en testkörning | nej |
| SE9 | Bygg sentinel-städningen i teststället | senare | Tar bort en återkommande falsk rödhet | nej |
| SE10 | Parametrisera layouten i de fjorton skript som hårdkodar sökvägar | senare | Gör konventionen "config-driven" sann | nej |
| SE11 | Lyft de fem mogna agent-hookarna till pluginet | senare | Fem skydd börjar verka i tretton andra repon | nej |
| SE12 | Flytta huvudskyddet till ett organisations-ruleset | senare | Nästa repo ärver skyddet — men läs fällan först | nej |
| SE13 | Underhåll modulens kontrakt — den fil huvudrapporten nu ger | senare | Sänker läsbördan för varje ny agent | nej |
| SE14 | Härled fältet "Månad/år" med en formel | senare | Felklassen försvinner permanent | **ja** (produktionsdatabas) |
| SE15 | Koppla in Denos egna verktyg för serverfunktionerna | senare | 111 av 135 filer på appens enda skrivväg får kontroll | nej |
| SE16 | Tidsregel och ägare för rött efter landning; svepet rapporterar natten | senare | Gör N2:s läsbara signal till ett svar | nej |
| SE17 | Förfallodatum för obeslutade grenar | senare | En fråga kan inte åldras obegränsat | nej |
| SE18 | Byte-identitet mellan paraplyets logik och dess replik | senare | Replik-drift blir omöjlig | nej |
| SE19 | Klarlägg vilket konto som äger respektive nyckel mot datakällan | senare | Stänger en osynlig delad resurs mellan test och produktion | nej |
| SE20 | Lås de fyra externa byggstenarna i testsviten till exakta versioner | senare | Konsekvent form; ingen policy är bruten i dag | nej |
| SE21 | ADR-karta, och CI-avsnittet ut ur den alltid-laddade filen | senare | Lägre fast kostnad per agent-spawn | nej |
| I1 | Riv merge-dedupen | **inte alls** | Den träffar 32 av 32 där den kan göra nytta | — |
| I2 | Godkännandekrav eller ägarbunden granskning på `ci.yml` | **inte alls** | Låser repot; risken bärs redan av granskningsspärren i kön | — |
| I3 | `paths:`-utlösare på bevis-workflowen | **inte alls** | Mekaniserar konventionen utan att laga problemet | — |
| I4 | Sätt gruppstorleken i merge-kön till en | **inte alls** | Mångdubblar den dyraste körningen; N3 gör samma sak för 25 rader | — |
| I5 | Veckovis sammanfattning av nattlarmet | **inte alls** | Presentationslager ovanpå ett signalproblem | — |
| I6 | Ny grindvakt mot prosa som bär ett tal eller påstår en frånvaro | **inte alls** | Rätt diagnos, fel motmedel; den minsta formen ligger i N8 | — |
| I7 | Mallrepo, sammansatta åtgärder, generator, `.github`-specialrepo | **inte alls** | Förutsätter fler än ett konsumerande repo | — |
| I8 | Sänka push-frekvensen eller bunta pushar | **inte alls** | Redan avvisat i `ADR-097` med fyra mätta skäl | — |
| I9 | Flytta CI till en egen maskin | **inte alls** | Mätt fel för oss: 910,7 s lokalt mot 401,0 s i CI | — |
| I10 | Maskininlärt testurval, kanarie, testmatris-panel, sheriff-organisation | **inte alls** | Förutsätter en skala vi inte har; funktionen ligger i SE16 | — |
| I11 | Produktifiera eller frys de trasiga delarna i en delad modul | **inte alls** | Ett kit gör ett lokalt fel till ett spritt fel | — |

**Nio nu, tjugoen senare, elva inte alls.** Fem åtgärder kräver ägarens
uttryckliga GO: N1 (endast om undantagsvägen väljs), N7, SE1, SE2 och SE14 —
plus K1 om vägen "villkora" väljs.

## Källor

**Syskonfiler i denna granskning, lästa i sin helhet eller i de avsnitt som
anges** (samtliga 2026-09-17):

- [`underlag/00-agentkontrakt.md`](underlag/00-agentkontrakt.md) — hela
- [`underlag/01-orkestrerarens-stickprov.md`](underlag/01-orkestrerarens-stickprov.md) — hela, S30 och S31 först
- [`underlag/02-uppdrag-vag-3.md`](underlag/02-uppdrag-vag-3.md) — § Gemensamt, § D11
- [`underlag/kg1-korsgranskning-ci-mekanismer.md`](underlag/kg1-korsgranskning-ci-mekanismer.md) — hela
- [`underlag/kg2-externa-fakta-och-rattelser.md`](underlag/kg2-externa-fakta-och-rattelser.md) — § Kort svar, A1–A5, § Rekommendation
- [`underlag/kg3-konsistens-mellan-underlagen.md`](underlag/kg3-konsistens-mellan-underlagen.md) — § Motsägelsetabellen, § Spänningar, § Krockande rekommendationer, § Kanoniska tal
- [`02-teknisk-arkitekturkarta.md`](02-teknisk-arkitekturkarta.md) — § Dom, § Rekommendationer
- [`03-andringslogg.md`](03-andringslogg.md) — § Risker, § Rekommendationer
- [`04-branch-worktree-commit-och-pushflode.md`](04-branch-worktree-commit-och-pushflode.md) — § Riskerna, § Undantagen, § Rekommenderat arbetssätt per roll
- [`05-branschjamforelse.md`](05-branschjamforelse.md) — § 14, § Sammanfattande tabell, § Det här gör vi starkt, § Det här bör förbättras, § Det här ska vi INTE kopiera, § Risker, § Rekommendationer
- [`06-airtable-kompromisser-och-empiriska-fynd.md`](06-airtable-kompromisser-och-empiriska-fynd.md) — § Risker, § Rekommendationer
- [`07-hermetiska-tester-kontra-realistisk-e2e.md`](07-hermetiska-tester-kontra-realistisk-e2e.md) — § Risker, § Rekommendationer
- [`08-risk-redundans-flakighet-tid-och-kostnad.md`](08-risk-redundans-flakighet-tid-och-kostnad.md) — § Kort svar, Del 2, Del 3, Del 5, § Rekommendationer
- [`09-ci-som-ateranvandbar-djupmodul.md`](09-ci-som-ateranvandbar-djupmodul.md) — Fynd 10, Fynd 11, § Risker, § Rekommendationer
- [`underlag/j1f-test-bygg-och-lintkonfiguration.md`](underlag/j1f-test-bygg-och-lintkonfiguration.md) — § advisory-tabellen
- [`underlag/j8-6-stabilitet-flakighet-och-felsokning.md`](underlag/j8-6-stabilitet-flakighet-och-felsokning.md) — § Fynd 1, § felkällstabellen

**Kod och konfiguration i detta repo, öppnad och läst av mig 2026-09-17** (alla
på `eeca8c72` om inget annat anges):

`.github/workflows/ci.yml` (rad 73, 78, 452–499, 643, 786, 836, 917, 2085–2129,
2205–2274, 2535–2566) · `.github/workflows/ci-suite.yml` (360–379, 516–593) ·
`.github/workflows/post-merge.yml` (176–245) ·
`.github/workflows/nightly.yml` (33, 67–115, 195–260, 688–717, 852–868) ·
`.github/workflows/gate-proof.yml` (25–35) · `scripts/classify-post-merge.sh`
(190–209) · `scripts/hermetik-sjalvtest.mjs` (88–114, 150–191) ·
`scripts/verify-ci-parity.mjs` (39, 202, 739–740) ·
`scripts/check-fetch-depth-invariant.sh` (existens) ·
`.sanningsavstamning-policy.conf` (142–166) · `.label-policy.json` (existens) ·
`audit-ci.jsonc` (hela) · `package.json` (51, 62–63, 128–136) ·
`package-lock.json` (8175–8195, 10220–10223) · `CONTRIBUTING.md` (376–384,
1074) · `scripts/acceptance-urval.sh` (12) ·
`tests/kontraktsvakt/kontraktsfall.ts` (20–30) ·
`tests/acceptance/hem.acceptance.test.ts` (270–290) ·
`supabase/functions/_shared/airtable-client.ts` (funktionskartan) ·
`supabase/functions/create-event/index.ts` (228–240) ·
`docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md` (70–90) ·
`docs/decisions/ADR-131-work-item-substratet-github-issues.md` (1–5, 168–176,
293–299) ·
`tasks/threads/T166-post-merge-klassningen-laser-sista-pr-en-i-ko-batchen.md`
(hela)

**Kort lästa med `npm run bl -- task <id> --plain`** (aldrig ändrade):
`TASK-366`, `TASK-199`, `TASK-365`.

**Externa källor, citerade via KG2 och stickprovsloggen, inte hämtade om av
mig:** GitHubs dokumentationskällkod för merge-kö, push-händelser och
Actions-fakturering; Vercels dokumentation om tillbakarullning; Airtables
gränsdokumentation; GitHubs vägledning om agentskrivna ändringsförslag.
