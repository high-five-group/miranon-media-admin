# ADR-105: Review-grinden — fyra deltan byggs i bygg-agent-kontraktet, verktyget adopteras inte

- Status: Accepted (grillad samsyn S101, 2026-08-09 — sju kvitterade beslut
  med helhetskvittens, kanonisk trail:
  `tasks/sessions/2026-08-09-session-101.md` Del 6; Marcus slutkvittens
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
