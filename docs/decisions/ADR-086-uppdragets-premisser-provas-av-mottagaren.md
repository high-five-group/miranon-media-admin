# ADR-086: Uppdragets premisser prövas av mottagaren — premiss-pass, källkrav och retrospektiv uppdragsrevision

- Status: Accepted (2026-08-01)
- Datum: 2026-08-01
- Fas: post-S91 restlista, `T110`

> **Om beslutsvägen — bokförd öppet.** `T110`:s externa prövning (2026-07-31,
> utförd av en granskare som inte skrev klassningen) dömde att empirin räcker
> för exakt två saker: agent-sidigt premiss-pass + källkrav, och mätåtgärden.
> Marcus gav GO 2026-08-01. Formvalet gjordes av bygg-agenten under den
> delegationen. Noteras av samma skäl som i
> [ADR-083](ADR-083-prosa-som-pastar-mekanism.md)–[ADR-085](ADR-085-hubbens-lessons-i-volymer.md):
> en läsare ska kunna se vem som vägde, inte bara vad som beslutades.

## Kontext

`tasks/threads/T110-orkestrerarens-felklasser.md` bär empirin: **13 belagda
orkestrerarfel** över tre resumer (S91), samtliga fångade av agenter och noll
av grindar. Den externa prövningen (trådens § Extern prövning) omklassade dem
efter *vilken grind som skulle ha fällt* och fann att **8 av 13 var "oläst
källa i handen"** — fel radnummer, fel tal, filer som aldrig funnits, en
rapport som sade fem där orkestreraren läste tre. Sanningen fanns varje gång i
en redan tillgänglig artefakt.

Det strukturella skälet: **grindarna kör på commits, men uppdragstexten
committas aldrig** — den går direkt till en agent och försvinner med
sessionen. Uppdrags-ögonblicket saknar yta helt. Samtidigt är varje hittills
gjord fångst **agent-sidig**: en agent som prövade referensen i stället för
att bygga på den (*"följde regeln i stället för talet"*). Embryot fanns redan
i agent-kontraktet som reaktiv regel (*"avviker det faktiska tillståndet:
stanna och flagga"*) — men en regel som bara triggar när avvikelsen råkar
upptäckas är inte ett pass.

Prövningen skärpte också mätfrågan: klass I:s nämnare (antalet verifierbara
referenser i uppdragstexterna) är **ologgad, inte omätbar** — orkestrerarens
transcript-JSONL bär redan varje uppdragstext. Och spawn-loggen
(`scripts/agent-spawn-log.sh` → `.claude/agent-spawn-log.jsonl`) bär medvetet
bara metadata, aldrig prompten — verifierat mot loggens faktiska fält
2026-08-01.

### ADR-bar-prövningen — alla tre villkor håller

1. **Svårt att återställa i koherens:** kontraktet spänner över två aktörer
   (orkestrerarens uppdragsformat ↔ agentens premiss-pass) och över
   sessionsgränser. Tappas skälet är passet lätt att "städa bort" som
   paranoia — exakt den drift `L328` och `ADR-081` redan uppvisat: en regel
   vars grund glömts efterlevs inte.
2. **Överraskande utan kontext:** en obligatorisk misstro mot uppdragsgivarens
   egna siffror är kontraintuitiv utan empirin 8/13 — och källkravet
   (HYPOTES-märkning av obelagda påståenden) likaså.
3. **Verklig avvägning:** options-rymden kartlades i den externa prövningen —
   spawn-hook-preflight, generell korsmätningsregel och orkestrerar-sidig
   grind prövades och förkastades med skäl (se § Vad som inte byggs). Valet
   lägger kostnaden i agent-tid, parallellt, i stället för i orkestrerarens
   latens.

## Beslut

### 1. Agent-sidigt premiss-pass — obligatoriskt, i agentdefinitionen

`.claude/agents/bygg-agent.md` bär ett obligatoriskt pass tidigt i
arbetsgången: **varje verifierbar premiss i uppdraget — fil-adress, radnummer,
citat, SHA, tal, tillståndspåstående — prövas mot faktiskt tillstånd innan
design.** Divergens rapporteras öppet i stället för att byggas på; regeln i
uppdraget slår talet i uppdraget. `git fetch` ingår (en worktree skapas ur ett
ögonblicks-`main`; en "saknad" referens kan vara en olandad framtid).
Slutrapporten bär passets utfall — *"inga divergenser"* är ett mätt resultat
som skrivs ut, aldrig antas.

Formen bor **per repo** i agentdefinitionen: `T108`:s distributionshinder
(hooks tappas tyst vid plugin-distribution) gäller inte filer som redan lever
i repot.

### 2. Källkrav i uppdragsformatet — asymmetriskt förlagt hos mottagaren

Uppdragens faktapåståenden ska bära källa: fil, commit eller kommandot som
producerade talet. Kravet binder **orkestreraren** — men mekanismen bor hos
**mottagaren**: ett påstående utan källa behandlas som HYPOTES, prövas av
agenten innan det byggs på, och bokförs som obelagt i slutrapporten.
Asymmetrin är poängen: empirin visar att agent-sidan fångar (13 av 13) och
orkestrerar-sidan inte gör det (~9 % self-review), så kravet placeras där
efterlevnaden mäts av någon annan än den som ska efterleva det. Samma krav
gäller framåt: agentens slutrapport är nästa uppdrags källmaterial och
källmärks likadant.

### 3. Mätåtgärden: retrospektiv revision ur transcript — ingen ny loggmekanism

`scripts/uppdragsrevision.mjs` (`npm run revision:uppdrag`) extraherar en
sessions samtliga Agent-spawns med full uppdragstext ur transcript-JSONL —
read-only, fail-loud, sidechains exkluderade och räknade. Det gör den
retrospektiva revisionen körbar i dag: extrahera uppdragen, räkna
referenserna (nämnare), pröva var och en mot disk (täljare) — den första
äkta felfrekvensen. **Ingen ny logg-mekanism byggs**: transcripten bär redan
texterna, och spawn-loggen förblir metadata. Skriptet räknar medvetet INTE
referenser själv — en regex som "hittar referenser" vore instrumentblindheten
(klass A/II) i det instrument som ska mäta den.

## Vad som inte byggs — durabelt, så det inte återföreslås

- **Spawn-hook-preflight** (validera uppdragets referenser mekaniskt före
  spawn): fel yta (hook-familjen kör vid landning/verktygsanrop, inte i
  uppdragsförfattandet), känt distributionshinder, och latenskostnad i
  orkestrerarens kritiska väg. Prövningens dom: NEJ.
- **Generell korsmätningsregel** ("två oberoende metoder innan ett tal skickas
  vidare"): regel utan mekanism — `L328`-klassen. Mekaniseras endast per
  återkommande mätklass när en sådan identifierats (jfr `check:docs` som
  räknar sina egna grindar).
- **Effektpåståenden om mekanismen**: förbjudna tills revisionen gett en
  nämnare OCH mönstret mätts om över minst en session till — n = 1
  orkestrerare, 1 session, är empirins hårdaste tak.

## Precedenter

- **Closed-loop communication / read-back–hear-back** (flygets Crew Resource
  Management → sjukvårdens TeamSTEPPS): mottagaren repeterar den
  säkerhetskritiska instruktionen och avsändaren verifierar, innan handling —
  mottagar-sidig verifiering som obligatoriskt protokoll, inte som omdöme
  ([StatPearls/NCBI NBK549899](https://www.ncbi.nlm.nih.gov/books/NBK549899/)).
- **SLSA/in-toto provenance**: påståenden om en artefakt bär signerad,
  maskinverifierbar proveniens (källa, byggprocess, byggare), och
  **konsumenten** verifierar attestationen innan artefakten används
  ([slsa.dev-ramverket](https://www.legitsecurity.com/blog/slsa-provenance-blog-series-part-2-deeper-dive-into-slsa-provenance)) —
  källkravets form: claims utan proveniens behandlas som overifierade.
- **NASA IV&V / zero-trust**: verifiering utförd av en part oberoende av den
  som gjorde påståendet; "never trust, always verify". Kunskapsbaserad
  referens utan enskild webbkälla i denna landning — deklarerat öppet.

Precedent-rymden för exakt vår domän (LLM-orkestrerare → LLM-agent-uppdrag)
är tunn och deklareras tunn; de tre ovan är analogier från angränsande
säkerhetskritiska domäner, inte direkta prejudikat.

## Konsekvenser

- Varje bygg-agent betalar en premiss-pass-kostnad i egen tid, parallellt.
  Kostnaden är **omätt i population**; första mätpunkt (denna landnings eget
  pass, lokal, en observation): ~7 verktygsanrop varav ett fångade en skarp
  divergens — worktreen var bakom `main` och "saknade" uppdragets
  spec-sektion, exakt fetch-fallet passet kodifierar.
- Rapportformatet växer med en obligatorisk premiss-pass-rad — orkestreraren
  får divergenser serverade i stället för att upptäcka dem i efterhand.
- Källkravet binder orkestreraren utan att någon fil i orkestrerarens
  auto-lästa yta ännu bär det (`CLAUDE.md`-raden är en uppföljning, medvetet
  utanför denna landning — parallell våg äger angränsande filer).
  Övergångsläget är designat: agenter behandlar obelagda påståenden som
  HYPOTES oavsett om orkestreraren sett kravet.
- Revisionen av en resume är beställbar som eget arbete; först därefter får
  effektpåståenden formuleras.

## Relaterat

`T110` (empirin + extern prövning — beslutets hela underlag) ·
[ADR-083](ADR-083-prosa-som-pastar-mekanism.md) (prosa som påstår mekanism —
klass B/I är dess syskon) · `TASK-90` (stängnings-grinden, commit-sidig
förebild) · `TASK-93` (klass IV:s partiella mekanism) · `L328` (en regel utan
mekanism efterlevs inte) · `scripts/agent-spawn-log.sh` (metadata-loggen som
medvetet inte bär prompten).
