# ADR-051: session-paus — lifecycle-verbet som komplettar kontinuitets-axeln

- Status: Accepted (Session 19 — 2026-06-13; ratificerad av Marcus i direktion
  samma session, byggs omedelbart)
- Datum: 2026-06-13
- Fas: Session 19 — lifecycle-fundament (parallellt med staging-bygget; ingen
  byggfas-status-ändring)

## Kontext

ADR-043 gav Chat-ytan tre lifecycle-verb (start/end/resume) grundade i externminne- +
handoff-research. Men kontinuitets-axeln byggdes halv: `session-resume` föddes som
LÄS-sidan ("rekonstruera parkerat läge") utan sin SKRIV-motpart. Det fanns ingen
procedur för att STOPPA en session som inte är klar.

Empirisk drift (Session 18 + 19): båda behövde stoppa arbete durabelt utan att
slutföra det. Utan ett paus-verb ramades den oavslutade sessionen in mot en
*nästa-session-N+1*-fortsättning — sessionsdoket fick en framåt-handoff
("Session 20-ingång") och lessons fördes in i en "Del — Lessons + status" som vid
ett sessionsslut, fast staging-bygget var oavslutat. Det skapade A1/A2-forken vid
återupptagning: fortsätter session N eller startar N+1? (Forensisk läsning
bekräftade att inget dok felaktigt hävdade att N+1 redan fanns eller var stängt —
driften var inramnings-modellen, inte en falsk stängning.)

Research (förstaparts-Anthropic) namnger haveriet och mönstret: *premature
completion* är ett känt haveriläge; mitigeringen är *context reset med strukturerad
handoff*, uttryckligen skild från completion och från compaction. Vår arkitektur
ägde mönstrets läs-sida men inte dess skriv-sida.

## Beslut

### 1. Fjärde lifecycle-verbet: `session-paus`

Lifecycle-gittret har två axlar:

- Ny-session-axeln: `session-start` (öppna, föd dok) ↔ `session-end` (stäng,
  finalisera).
- Samma-session-kontinuitets-axeln: `session-resume` (öppna igen, LÄS parkerat
  läge) ↔ `session-paus` (parkera, SKRIV läget).

`session-paus` är den deliberata "context reset med strukturerad handoff"-
skrivningen; `session-resume` är dess läsning. Tillsammans bär de kontinuitet över
Chat-kontext-död utan completion-påstående.

### 2. Asymmetrisk — Chat-halva, ingen ny Code-skill (speglar beslut 5)

`session-paus` är Chat-skill enbart. Den durabla PAUS-skrivningen är inte en ny
disk-primitiv: den ÄR landnings-kadens-skrivningen Code redan utför vid varje
landning (L67), med en PAUS-markör i stället för en Del-completion. Pluginet förblir
4 skill-kataloger. En symmetrisk Code-paus-skill vore duplicering utan DRY-grund
(beslut 4 + 5).

### 3. Distinkt verb, inte ett läge i `session-end`

Splitten går på INTENTION (parkera vs avsluta), exakt som resume splittades från
start på intention (återuppta vs starta). Ett eget `/`-verb skapar den
intentions-gräns som hindrar `session-end`:s completion-gravitation (vars killer
items — BUILD-LOG, Marcus-Update, lessons-finalskörd — är stäng-semantik) från att
återinducera premature-close. Ett läge inuti session-end skulle lämna operatören
kvar i avsluts-huvudet — själva driften vi rivit.

### 4. Innehållsgräns paus vs end

`session-paus` SKRIVER:

- sessionsdokets status → PAUSED (ej stable-closed);
- ett strukturerat HANDOFF-block (nuläge: inkrement/fas, carry, öppna trådar, nästa
  konkreta steg) — INTE en "nästa session N+1"-handoff;
- todo-kadens-synk (landnings-status, L67);
- verifierat rent + pushat arbetsträd (commit-on-stop-skydd: inget ocommittat
  strandas).

`session-paus` FINALISERAR INTE: ingen hub-sync lessons-skörd, ingen arkivering,
ingen CHANGELOG, ingen status-stängning. Sessionsnumret BEVARAS (paus→resume
fortsätter session N; bara `session-end` öppnar N+1). Provisoriska lessons FÅR
antecknas som kandidater i doket, men hub-lyfts inte.

`session-end` finaliserar (oförändrat, ADR-041): do-confirm, killer items, lessons
hub-sync, och vid fas-avslut arkivering/phase-end-verify/CHANGELOG.

### 5. Öppen rivning av ADR-043 beslut 3 (additiv)

ADR-043 beslut 3 räknar upp tre Chat-skills. Listan utökas till fyra. Per L53
(fryst besluts-text skrivs inte om) ändras inte ADR-043:s text; ADR-051 utökar
beslut 3 additivt (samma mönster som ADR-041 förfinade ADR-023 additivt). Antagandet
att kontinuitets-axeln var komplett med enbart resume falsifierades av Session
18/19-driften.

## Alternativ som övervägdes

- **Paus som läge i `session-end`.** Förkastat: intentions-gräns; completion-
  gravitation återinducerar driften; samma skäl som höll resume från att bli ett
  start-läge.
- **Symmetrisk Code-paus-skill.** Förkastat: PAUS-skrivningen återanvänder
  landnings-kadensen; ingen DRY-grund; pluginet hålls vid 4 kataloger (beslut 4+5).
- **Passiv kontext-död + resume utan paus.** Förkastat: lämnar parkeringen
  oavsiktlig (dirty/unpushed-risk, carry ej deliberat fångad). Research: handoff-
  artefakten måste bära nog tillstånd för ren återupptagning — det kräver en
  deliberat skriv-procedur, inte att kontexten bara dör.

## Konsekvenser

- Kontinuitets-axeln blir komplett (läs + skriv); premature-close-driften får en
  inkodad väg bort.
- `session-paus`-skillen bor i hub `claude-app-skills/`; denna ADR i spoke
  `docs/decisions/`. Pluginet oförändrat (4 kataloger).
- PI-basens lifecycle-pekare utökas med `/session-paus` (Marcus re-paste:ar PI).
- Reversibelt: skill + ADR är repo-källade projektioner.
- Första skarpa användning: att pausa session 19 självt (dogfood, jfr ADR-043
  inkrement 5).

## Forskningsgrund

- Anthropic, "Harness design for long-running application development"
  (anthropic.com/engineering/harness-design-long-running-apps): context reset +
  strukturerad handoff skilt från compaction; handoff-artefakten måste bära nog
  tillstånd för ren återupptagning.
- Anthropic, `cwc-long-running-agents` (<https://github.com/anthropics/cwc-long-running-agents>):
  strukturerad PROGRESS.md läst vid varje omstart + commit-on-stop-skydd.
- Anthropic, "How we built our multi-agent research system": externminne före
  vidaregång; färsk kontext + noggranna handoffs; premature completion som
  haveriläge.

## Relaterade ADR:er

- ADR-043 (lifecycle-arkitektur) — denna ADR utökar beslut 3 additivt och speglar
  beslut 5 (asymmetri) + beslut 8 (sessionsdok = externminne).
- ADR-041 (session-end do-confirm) — innehållsgränsen i beslut 4 avgränsar paus mot
  end; end oförändrad.
- ADR-040 (numreringskonvention) — beslut 4: paus bevarar N, end öppnar N+1.

## Updates

### 2026-07-05 — Beslut 2 superseded av ADR-069 (Session 53, T62)

Beslut 2:s asymmetri ("`session-paus` är Chat-skill enbart — ingen ny
Code-skill") föll med samma premiss-skifte som ADR-043 beslut 5: sessioner
körs numera även i sin helhet på Code-ytan (S52-precedentet), där
paus-verbet inte kunde avfyras.
[ADR-069](ADR-069-lifecycle-verbens-code-korbarhet.md) superseder
asymmetri-delen: `session-paus` får en Code-halva i hub-pluginet, med denna
ADR:s beslut 1, 3 och 4 (verbet, intentions-gränsen, innehållsgränsen paus
vs end) orörda som dess kontrakt. Ironiskt nog är detta L119-klassen igen —
en axel som är körbar på en yta men inte den andra är samma halva-axel-drift
denna ADR rev på verb-nivån. Besluts-texten ovan är fryst (L53).
