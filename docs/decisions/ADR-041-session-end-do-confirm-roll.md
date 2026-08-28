# ADR-041: session-end:s roll — do-confirm-verifiering, inte read-do-motor

- Status: Accepted (Session 9 2026-05-28)
- Datum: 2026-05-28
- Fas: Meta (Session 9 — syskon till ADR-034, ADR-023, ADR-039)

## Kontext

session-end-skillen arkitekterades ([ADR-034](ADR-034-skill-arkitektur.md),
Session 6.7) som en autonom Code-discovery-motor: Code möter avslutsögonblicket,
laddar skillen, kör 15 steg. Session 7 + 8 visade empiriskt en annan användning:
Chat designar och dirigerar avslutet ur internaliserad flow, Code utför.
Session 8 K0c korsläste det faktiska avslutet mot skillen — 13 av 15 steg var
TÄCKT eller EJ TILLÄMPLIGT utan att skillen kördes, 2 föll (BUILD-LOG-entry;
Marcus-Update-påminnelse). Antagen funktion (autonom motor) ≠ faktisk
användning (Chat bär avslutet) — samma fynd-klass som hela
Session 8-retrospektiven.

K8 (ADR-034) visade samtidigt att session-end triggar rent (1 av 4 rena
discovery-träffar) och har ett kommando-ögonblick ("vi avslutar"). Det skiljer
den från web-research-discipline/chat-self-review, som K8 flyttade till
alltid-på just för att de saknade kommando-ögonblick. session-end ska alltså
inte flyttas till alltid-på — det är inte en description-svaghet utan en
roll-fråga.

Parallellt kvarstår [ADR-023](ADR-023-sessions-arkivering.md)-tvetydigheten:
ADR-023 § "Konvention för framtida sessions" punkt 2 säger generiskt att
arkivering sker vid "sessionsavslut", medan skillens steg 13 säger "fas-avslut
endast". Session 7 + 8 följde skillen (arkiverade ej, mellan-fas), men
ADR-023:s text kvarstår ospecifik.

Research gav frågan ett etablerat namn och ett svar (källor nedan).

## Beslut

1. **session-end omdefinieras från read-do-motor till do-confirm-verifiering.**
   Per Gawandes checklist-taxonomi: read-do körs steg-för-steg medan arbetet
   utförs (recept); do-confirm körs vid en paus EFTER att arbetet gjorts ur
   flow, för att bekräfta att inget kritiskt förbisetts. session-end ska vara
   do-confirm — den matchar erfaren utförare + rutinmässigt arbete, vilket är
   varför 13/15 steg redan sätts utan skillen.

2. **Confirmen körs av Code mot ett Chat-dirigerat avslut, med rapport
   TÄCKT / EJ TILLÄMPLIGT / SAKNAS.** Do-confirms värde kräver att
   verifieringen är oberoende av utföraren (self-confirm ~9 % fångst;
   Code-transparens ~64 %). Det Code gjorde i K0c efterhands blir standard,
   inte efterhandstillägg.

3. **Ansvars-split mellan ytor (löser placerings-frågan):**
   - Project Instructions (Chat, governing, alltid-på): att Chat dirigerar
     avslutet och KRÄVER Code:s do-confirm-pass innan sessionen stängs.
   - session-end-skillen (Code, kommando-triggad, i hub-pluginet): själva
     do-confirm-checklistan + rapport-formatet.

   Detta bevarar [ADR-034](ADR-034-skill-arkitektur.md):s klassning
   (session-end har kommando-ögonblick → förblir skill) och respekterar att
   Project Instructions är Chat-side (Code läser dem inte).

4. **Tre-lagers-kadens** (förenar
   [ADR-039](ADR-039-konsistens-grindar-kadens.md) +
   [ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md)):
   - Lager 1 — per-push automatiserade CI-grindar (ADR-039): deterministiska
     mekaniska konsistens-checks. "Automatisera det du kan."
   - Lager 2 — phase-end-verify: cross-doc-konsekvens vid fas-gränser.
   - Lager 3 — session-end do-confirm: killer items + omdömes-steg som ej är
     mekaniskt grind-bara.

   session-end ska INTE manuellt kontrollera det Lager 1 redan grindar.

5. **Killer items i förgrunden.** Do-confirm hålls kort (Gawandes 5–9-regel)
   och foregrundar de steg som empiriskt faller (BUILD-LOG, Marcus-Update),
   inte en re-enumerering av alla 15.

6. **ADR-023 harmoniseras additivt.** Arkivering fastställs som
   fas-avslut-bunden (praktiken). ADR-023 får en additiv korrigerings-not som
   pekar på ADR-041 (frusen besluts-text skrivs ej om — L53). De fas-bundna
   stegen (skillens 11–13, 15) hör i phase-end-verify; session-end refererar
   dit utan att duplicera.

## Alternativ som övervägdes

- **Do-confirm-verifiering (VALT).** Branschpraxis: Gawande / WHO Safe Surgery
  och flyg-checklistor (do-confirm valt för erfaren utförare, flexibilitet,
  paus-bekräftelse); deployment/runbook-praxis (checklistan = sista manuella
  grinden, "automatisera det du kan", autonom exekvering medvetet undantag ej
  default); SRE postmortem-action-spårning (redan L52).
- **Status quo: read-do autonom motor (avvisad).** Falsifierad av empirin —
  motorn utförs inte; 13/15 sätts utan skillen.
- **Flytta till alltid-på (avvisad).** session-end har kommando-ögonblick +
  triggar rent (K8 1/4); K8-flytten gällde discipliner UTAN
  kommando-ögonblick. Förstaparts-evidens (Agent Skills discovery-modell)
  utesluter denna.

## Konsekvenser

- session-end krymper från 15-stegs read-do till en kort do-confirm av
  Lager 3.
- Flödet blir sömlöst: varje lager gör det som empiriskt är bäst; inget
  lager låtsas göra ett annats jobb.
- Project Instructions växer med en governing-rad (källfil + manuell paste i
  claude.ai → Marcus).
- ADR-023:s text konvergerar mot praktiken via additiv korrigerings-not;
  spårbarhet bevarad.
- Lesson→grind-beroendet (Lager 1) stängs: test-check-frontmatter +
  test-check-public-checklists wiras i CI.
- Research-källor citerade per research-före-arkitektur-disciplinen.

## Research-källor

- Anthropic Agent Skills — discovery/activation-modell (agentskills.io;
  Anthropic engineering). En skill förbereder agenten, laddas vid
  description-match; triggar på kommando-ögonblick.
- A. Gawande, The Checklist Manifesto — read-do vs do-confirm; WHO Safe
  Surgery valde do-confirm; "killer items" / 5–9-regeln.
- Deployment/runbook/quality-gate-praxis — checklistan som sista manuella
  grind; automatisera det automatiserbara; human-in-loop vs autonomt som
  medvetet val; objektiv automatiserad grind vs subjektiv
  projektnivå-checklista.

## Updates

### 2026-07-05 — Beslut 2 amenderat för Code-körda sessioner (ADR-069, Session 53, T62)

Beslut 2:s oberoende ("Confirmen körs av Code mot ett **Chat-dirigerat**
avslut") förutsätter dirigent ≠ utförare. På Code-körda sessioner
(S52/S53-precedentet) är Code båda, och oberoende-axeln kollapsar.
[ADR-069](ADR-069-lifecycle-verbens-code-korbarhet.md) beslut 6 amenderar:
där presenterar Code coverage-rapporten och STOPPAR — `lifecycle: closed`
flippas först efter Marcus-kvittens (de disk-verifierbara posterna behåller
rapport-mot-disk-fångsten ~64 %; de omdömes-tunga posterna grindas av
Marcus-ytan ~27 % i stället för self-confirm ~9 %). Chat-orkestrerade
sessioner oförändrade — där håller beslut 2 som skrivet. Besluts-texten
ovan är fryst (L53).

### 2026-08-07 — Beslut 6 rivet: fas-avslut-bindningen ersatt av rullande fönster (ADR-099, PRD TASK-158)

Beslut 6 ("ADR-023 harmoniseras additivt … Arkivering fastställs som
fas-avslut-bunden") **rivs ÖPPET, inte tyst.** Premissen — att faser är
korta nog att en fas-gräns ger en rimlig arkiveringskadens — visade sig
falsk: Fas 6 har varat 30+ sessioner, och `tasks/sessions/`-roten växte
under tiden till 86 dokument utan att kadensen någonsin utlöstes.
[ADR-099](ADR-099-sessionsdok-rotens-rullande-fonster.md) ersätter
fas-avslut-bindningen med ett rullande fönster: roten behåller de N senast
stängda dokumenten (N som konfig-värde, startvärde ~10) plus samtliga
`active`/`paused`-dokument; äldre stängda dokument arkiveras. Grillad
samsyn: `tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 5 (2026-08-07,
"Uppdrag 5"). Beslut 6:s ursprungstext ovan bevaras oförändrad
(immutabilitet, L53) — denna not styr tolkningen framåt. Övriga beslut i
denna ADR (1–5) är helt opåverkade.
