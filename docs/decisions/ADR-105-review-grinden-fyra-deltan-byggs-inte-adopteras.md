# ADR-105: Review-grinden — fyra deltan byggs i bygg-agent-kontraktet, verktyget adopteras inte

- Status: Accepted (grillad samsyn S101, 2026-08-09 — sju kvitterade beslut
  med helhetskvittens, kanonisk trail:
  `tasks/sessions/archive/2026-08/2026-08-09-session-101.md` Del 6; Marcus slutkvittens
  verbatim: *"Kvitterar samsynen i sin helhet, kör vidare"*)
- Datum: 2026-08-09
- Fas: Session 101 — processform, K1 i L8-transformationsplanen (ingen
  byggfas-status-ändring)

## Kontext

L8-kartläggningen
([`l8-workflow-kartlaggningen-2026-08-09.md`](../research/l8-workflow-kartlaggningen-2026-08-09.md)
§ Fas C.1-2) identifierade fyra deltan mellan Kun Chens bevisade
`no-mistakes`-pipeline och vår landningskedja: intent-analys ·
obligatorisk adversarial review i färsk kontext · bevis-artefakt per
ändring · risk-bedömning i PR-kroppen. Vår fångstrats-empiri pekar åt
samma håll som hans incident-historik: self-review ~9 %, extern fångst
dominerar — och `no-mistakes` färsk-kontext-mekanik byggdes som svar på
en verklig skeppad defekt där en granskare som återanvände sin session
godkände sin egen förskrivning (citerad kodkommentar,
[`k1-no-mistakes-anatomi-2026-08-09.md`](../research/k1-no-mistakes-anatomi-2026-08-09.md) § 3).

Research-passet gav också motbilderna som formade vägvalet: verktygets
daemon äger rebase/push/CI-babysitting — samma jobb vår merge-kö
(`ADR-076`) + heartbeat-svep redan gör; dess transkript-mining är en
svagare intent-källa än våra backlog-korts acceptanskriterier; och
uppströms bär öppna strukturella buggar (#694) samt en olöst
konvergensbrist — 27 fulla omgranskningsrundor på 8,2 timmar utan
konvergens (#683). Ledstjärnan (kartläggningen § Ledstjärnan) kräver att
Kuns flöde importeras utan att golvet offras: extern fångst före
ribb-flytt.

## Beslut

1. **Vägen: BYGG deltana, adoptera inte verktyget.** De fyra deltana
   byggs i bygg-agent-kontraktet + PR-mallen på våra primitiver;
   merge-kön och heartbeat-svepet behåller sina roller orörda.
   `no-mistakes` är referensdesign, inte beroende.
2. **Placering och ägare.** Review-agenten spawnas av orkestreraren i
   FÄRSK kontext, efter bygg-agentens push, före armering. Driv-agent
   och granskare är aldrig samma agent. Efterlevnaden mekaniseras med en
   deterministisk CI-backstopp som verifierar att PR:en bär ett
   granskningsutlåtande — ingen LLM i CI (`ADR-036`-linjen: CI är enda
   mekaniska enforcement; en regel utan mekanism efterlevs inte).
3. **Räckvidd: progressiv härdning på befintlig klassning.** Obligatorisk
   för allt utanför D0-klassen (samma allowlist-glob CI:s
   `changed`-jobb redan kör — ingen ny klassningslogik). D0/docs-only
   undantagen tills mätdata visar missad felklass. Prototyp-läget
   undantaget; promovering av prototyp går alltid genom grinden.
4. **Rundtak 2 med konvergensregel.** Max två fulla rundor (initial +
   verifiering av fixar i färsk kontext). Runda 2 blockerar endast på
   error-klass; warnings/info bokförs utan att stoppa. Vid tak:
   STOPPA-OCH-FRÅGA till Marcus med öppna fynd — grinden självgodkänner
   aldrig. Findings-per-runda loggas från dag ett; taket omprövas mot
   egen data (siffran 2 är startbedömning, inte mätning — öppet
   deklarerat).
5. **Risk med asymmetrisk formalitet.** Fast `## Riskbedömning`-sektion i
   varje PR (nivå låg/medel/hög + enmenings-motivering + fynd +
   bevislänkar, deterministiskt renderad ur granskarens JSON). HÖG styr
   formellt från dag ett: armering väntar på Marcus explicita
   granskning. LÅG är endast informativ tills fångstrate-mätningen bär
   data; varje Marcus-fångst på en låg-stämplad PR bokförs som
   grind-miss. Flytt av Marcus gransknings-ribba är ett SEPARAT framtida
   Marcus-beslut mot siffror — aldrig en tyst konsekvens av denna ADR.
6. **Bevis-kontraktet.** Logik/EF: riktad testkörning inline (kommando +
   utdrag + exitkod). UI: visuella riggens baseline-diff + axe-utdrag.
   Commit-pinning som lag: varje bevis-påstående bär run-ID/SHA.
   Binärlagringsfrågan (orphan-gren vs repo-katalog vs CI-artifact) är
   öppet skjuten till mätdata — text-först i fas 1.
7. **Intent-kontraktet.** Backlog-kortets acceptanskriterier VERBATIM är
   intenten (CLI-view; kort-ID ankrar PR:en); granskaren prövar dem per
   `ADR-086` och flaggar fel-ställda AC. Path-scopade granskningsregler
   läses ENDAST ur main (trusted), config-drivet per
   grindvakts-konventionen. PR utan kort: PR-text som intent med öppet
   flaggad lägre konfidens.

## Konsekvenser

- Fångstrate-instrumenteringen är en del av BYGGET, inte ett tillägg:
  findings-per-runda, risk-kalibrering (Marcus-fångst vs stämpel) och
  grind-missar loggas från första skarpa körningen. C.4-2-sekvensen
  (mät före ribb-flytt) är kontraktets hårdaste regel.
- PRD-kort + skivor specas via `/to-prd`/`/to-issues` direkt efter
  mintningen (S101).
- Termerna *review-grinden*, *risk-rad* och *rundtak* är processdomän
  och lyfts till hubbens `SYSTEMET.md` §0 vid nästa hub-sync —
  `ORDLISTA.md` är produktdomän (samma snitt som *kanalseparation*,
  `ADR-104` § Konsekvenser).
- Falsifieras rundtaket eller D0-undantaget av egen mätdata ändras de
  öppet mot mätningen — startvärdena är beslutets empiriska
  utgångsläge, inte eviga sanningar.

## Updates

### 2026-08-30 — Nattmandat: orkestreraren får armera `hog` när loopen konvergerat, natten 2026-08-30 (Marcus-mandat, EN natt — inte ny norm)

**Beslut 5 ovan står oförändrat som norm.** Denna post bokför ett
tidsavgränsat avsteg, så att det inte sker tyst. Beslutstexten rörs inte.

**Vad beslut 5 säger.** *"HÖG styr formellt från dag ett: armering väntar
på Marcus explicita granskning."* Konsekvensen för PRD `TASK-346` (Lottas
betalningsflöde) mättes i förväg av den adversariella verifieringen
([`verifiering-kvittoskivning-afk-natt-2026-08-30.md`](../research/verifiering-kvittoskivning-afk-natt-2026-08-30.md)
§ 2 B4): review-agentens eget kontrakt sätter `hog` på bland annat
*betalningsflöden* och schemaändringar, och skivorna 346.3, 346.4, 346.8,
346.9 och 346.10 är per definition båda. Utan mandat hade fyra till fem
färdiga PR:er stått som drafts på morgonen.

**Marcus mandat, verbatim.** Frågan ställdes som markeringsbar text i
chatten (S113 Del 11 § Öppet vid landning), och svaret kom ~18:35 UTC
2026-08-30: *"B4 ja, B3 ja — kör vidare."*

**Mandatets exakta räckvidd** (S113 § NATTENS MANDAT, verbatim):
*"`hog` får armeras i natt ENDAST när loopen konvergerat (exit 0: alla
fynd åtgärdade, inget `ask-user`, ingen kvarstående `error`); nivån
bokförs i Del-texten per PR."*

Fyra villkor måste alltså hålla SAMTIDIGT för att en `hog`-PR ska få
armeras utan Marcus:

1. `scripts/review-loop-beslut.mjs` returnerar **exit 0** (konvergerad).
2. Inget `ask-user`-fynd finns kvar — ett sådant eskalerar oavsett runda
   enligt beslut 5 och `TASK-173.5` AC #3, och mandatet upphäver inte det.
3. Ingen kvarstående `error`.
4. Risknivån **bokförs per PR** i sessionens Del-text.

**Vad mandatet INTE upphäver.**

- **Rundtaket (beslut 4).** Exit 20 är fortsatt STOPPA-OCH-FRÅGA. Ett
  `hog` vid exit 20 armeras aldrig — mandatet gäller uteslutande det
  konvergerade fallet.
- **`ask-user` om pengar, prod eller data.** Nattmandatet är uttryckligt:
  ett sådant fynd ger draft plus en STOPPA-rad i handoffen. Endast ett
  `ask-user` som rör *smak* avgörs av orkestreraren (B3) och bokförs.
- **CI-backstoppen (`TASK-173.4`).** Den kräver att ett utlåtande FINNS
  och är FÄRSKT (`granskadSha` = PR:ens head), aldrig att det bär en viss
  nivå. Den är oberörd av denna post och fäller i kön precis som förut.
- **Placeringen (beslut 2).** Granskaren spawnas fortsatt i FÄRSK
  kontext, av orkestreraren, aldrig av bygg-agenten och aldrig i samma
  session som byggde.
- **Instrumenteringen (`TASK-173.6`).** Varje beslut loggas som förut, och
  en Marcus-fångst på en `hog`-PR som armerades under detta mandat bokförs
  som grind-miss på vanligt sätt. Mandatet är alltså mätbart i efterhand.

**Prejudikat i båda riktningar, bokförda.** Motsatt utfall: S108 Del 25
(`#1983`) parkerade en `hog`-PR som draft med skälet *"risk hög per
prod-EF-klassen … Marcus granskar → armera"*. Samma riktning som denna
post: S113 Del 2/4 bokförde mandat-beslut på loop-exit 20 under Marcus
explicita mandat (*"Du har mandat att ta besluten"*), och `#2094` runda 1
med nivå **hög** avgjordes av orkestreraren. Formen — mandat i klartext,
avsteg bokfört i ADR:n — är alltså etablerad; det som är nytt här är att
mandatet skrivs ned som en **tidsavgränsad** post i stället för att bara
leva i ett sessionsdok.

**Detta är ingen ny norm.** Mandatet gäller natten 2026-08-30 och PRD
`TASK-346`. Nästa `hog` utanför den natten möter beslut 5 som det står.
Flytt av ribban är fortsatt ett SEPARAT framtida Marcus-beslut mot
siffror ur instrumenteringen — aldrig en tyst konsekvens av att ett
nattmandat en gång getts.
