# ADR-069: Lifecycle-verbens Code-körbarhet — paus/resume-Code-halvor, start/end-komplettering och coverage-kvittens-grinden

- Status: Accepted (Session 53 — 2026-07-05; grillad samsyn /grill-with-docs,
  7 beslut Marcus-kvitterade; kanonisk samsyns-trail: sessionsdok
  `tasks/sessions/archive/2026-07/2026-07-05-session-53.md` Del 2)
- Datum: 2026-07-05
- Fas: Session 53 — process-fundament (T62; ingen byggfas-status-ändring)

## Kontext

ADR-043 och ADR-051 byggde lifecycle-gittret på premissen att sessioner
DIRIGERAS från Chat-ytan och UTFÖRS av Code: Chat-halvor orkestrerar,
Code-halvor rör disk, Marcus är kanalen mellan dem. Två beslut kodade
premissen som asymmetri: ADR-043 beslut 5 ("session-resume är asymmetrisk:
Chat-skill, ingen ny Code-skill") och ADR-051 beslut 2 ("`session-paus` är
Chat-skill enbart"). ADR-041 beslut 2 byggde på samma premiss från
verifierings-hållet: do-confirm-passets oberoende kommer av att "Confirmen
körs av Code mot ett **Chat-dirigerat** avslut" — dirigent ≠ utförare.

Premissen har skiftat empiriskt. Session 52 kördes i sin helhet på
Code-ytan (grillning, prototyp-pass, PRD-kort, paus-landning) och Session
53 startades, scope-kvitterades och grillades direkt i Code-terminalen —
utan Chat-dirigering. När sessioner körs på Code-ytan är lifecycle-verbens
Chat-enbart-design ett hål: paus/resume kan inte avfyras där sessionen
faktiskt bor, och den asymmetriska axeln är en känd drift-källa (L119: den
saknade riktningen tvingas uttryckas via fel verb — exakt haveriet ADR-051
rev en gång på Chat-sidan).

Samtidigt försvinner en osynlig fångstyta: i Chat-flödet är Marcus i
loopen AV KLIENTARKITEKTUR — varje Chat→Code-handoff passerar honom som
kanal. I Code-körda flöden finns ingen sådan struktur; kvittenspunkter som
Chat-flödet gav gratis (scope-kvittens, vägval, avsluts-bekräftelse)
rullar förbi om de inte kodas explicit.

T62 registrerades i S52-pausen (ADR-053-triage) med öppen flagga: bygget
är en rivning av låsta beslut och prövas mot ADR-baren vid landning.
Prövningen: över baren på alla tre villkor (svår att återställa i koherens
— fyra skill-texter + grind-semantik byggs ovanpå; överraskande — två
ADR:er säger annars motsatsen; verklig avvägning — forkarna nedan hade
genuina alternativ). Grillad samsyn 2026-07-05 (7 beslut, Del 2 i
S53-doket är kanonisk plats; STEG 0-diskpass prövade varje seed-punkt mot
faktisk skill-text före intervjun och falsifierade en av dem —
lessons-läsningen vid start var redan täckt).

## Beslut

### 1. Samexistens — Code-halvorna blir kanonisk mekanik-bärare framåt

`session-paus` och `session-resume` får Code-halvor i hub-pluginet.
Chat-halvorna (hub `claude-app-skills/`) röres INTE och kvarstår giltiga
för Chat-orkestrerade sessioner tills migrerings-spåret
(S47-utfasningskartan) pensionerar dem — pensioneringen ägs av det spåret,
inte av denna ADR. Öppen rivning: ADR-043 beslut 5 och ADR-051 beslut 2
SUPERSEDERAS i sin asymmetri-del (frysta texter röres ej per L53; båda
ADR:er får additiva Updates-noter som pekar hit).

### 2. Topologi: två nya skill-kataloger (13→15)

Egna kataloger per verb — ADR-051 beslut 3:s intentions-gräns-argument
gäller Code-sidan lika (ett resume-läge inuti session-start lämnar
operatören i start-huvudet med skapande-gravitation; A1/A2-forken och
dubbel-födelse-risken var den empiriska driften). DRY-invändningen som bar
ADR-043 beslut 5 löses med REFERENS, inte duplicering: session-resume
refererar session-startens LÄS-fas och bär bara sitt delta
(lokalisera-aldrig-skapa, tillstånds-återställning, numrerings-
re-verifiering, vägvals-grind).

### 3. Invokering: description-triggade som syskonen

Samma klass som session-start/session-end — inte slash-only. Farliga
riktningen för lifecycle är MISSAD trigger (premature-close-driften),
inte fel-avfyrning; lifecycle-verb har omisskännliga kommando-ögonblick
(ADR-041/K8-empirin). Auto-fire-riskerna grindas i skill-TEXTEN
(vägvals-grinden, beslut 5), inte i invokerings-klassen.

### 4. Start/end-kompletteringen (paketet 2–6)

Code-halvorna av start/end bar Chat-yta-antaganden som nu är
yta-medvetna: (2) föreslagen-ingång-mandatet i starts RAPPORTERA (konkret
ingång ur todo-NÄSTA/handoff — L223/L230 håller tillståndsytorna); (3)
scope-kvittensen yta-neutral (dirigenten = Chat ELLER Marcus direkt); (4)
ends trail-säkring generaliserad till "osäkrat material från ANNAN yta?"
som EXPLICIT Marcus-fråga (Code kan inte se Chat-trail); (5)
intentions-grinden N vs N+1 före `lifecycle: closed` (S18/S19-exemplen);
(6) transcript-källan yt-beroende (`/mnt/transcripts/` är
claude.ai-container; Code-ytans rådata är session-JSONL:en under
`~/.claude/projects/`). Lessons-läsningen vid start var redan täckt
(STEG 0-falsifiering) och ingår inte.

### 5. Designprincip (f): Marcus-kvittenspunkter blir explicita STOPPA-grindar

I Chat-flödet är Marcus i loopen av klientarkitektur; i Code-körda flöden
måste varje sådan kvittenspunkt vara EXPLICIT STOPPA-grind i skill-texten.
Tillämpad i alla fyra verb-texter: scope-kvittens (start), vägvals-grinden
"pausat dok funnet ≠ resume-order — Marcus väljer väg" (resume;
S52→S53-precedentet: en auto-resume vid S53-start hade kört förbi Marcus
beslutade mellansession), intentions-grinden (paus/end), coverage-
kvittensen (end, beslut 6). Principen är generativ: varje framtida
Code-portning av ett Chat-flöde ställer frågan "vilka kvittenspunkter
passerade Marcus av arkitektur?" och grindar dem explicit.

### 6. Coverage-kvittens-grinden — amendering av ADR-041 beslut 2

På Code-körda sessioner (dirigent = utförare) presenterar Code
coverage-rapporten (TÄCKT/EJ TILLÄMPLIGT/SAKNAS) och STOPPAR;
`lifecycle: closed` flippas FÖRST efter Marcus-kvittens. Rationalen:
do-confirm-posterna är till största del disk-verifierbara
(rapport-mot-disk-fångsten ~64 % är intakt oavsett dirigent); de
omdömes-tunga posterna är där self-confirm (~9 %) bits — där sätts
Marcus-ytan (~27 %) som hård grind i stället för passiv
efterhandsläsning. Chat-orkestrerade sessioner oförändrade (ADR-041:s
oberoende-premiss håller där). ADR-041 får additiv Updates-not.

### 7. Operativ sekvens (första-bruk)

Bygge → manifest-PARET atomiskt (L228) + MINOR-bump 1.9.0→1.10.0
(L55-precedensen: skill-set-count 13→15) → L55-ritualens (a)–(e) mot
cachen UTAN omstart → S53 session-end med coverage-kvittens-grinden
DOGFOODAD för hand ur den nyskrivna texten (ADR-051-precedentet: paus
dogfoodades på session 19) → omstart (Marcus-moment) →
aktiverings-verifieringen sker i S52-resume-öppningen, som samtidigt är
resume-Code-halvans skarpa första-bruk-test.

## Alternativ som övervägdes

- **Pekar-rad i Chat-halvorna nu / ersättning-radering nu.** Förkastade:
  pensioneringen ägs av migrerings-spåret; "kanonisk" bevisas med
  orienterings-test (L232), inte lös rad; radering är för tidig så länge
  Chat-orkestrerade sessioner är ett giltigt läge.
- **Resume som gren i session-start, paus som gren i session-end.**
  Förkastat: intentions-gränsen (ADR-051 beslut 3) gäller Code-sidan
  lika; grannverbets huvud är driften, inte skalet.
- **Slash-only invokering.** Förkastat: missad trigger är den farliga
  riktningen för lifecycle; kommando-ögonblicken triggar rent (K8).
- **Oberoende subagent-verifierare för avslut (FÖRKASTAD-FÖR-NU).**
  Över-engineering-vakten: spekulativ apparat tills empiri visar att
  disk-korsläsning + Marcus-grinden inte räcker. Rivs öppet vid evidens —
  detta förkastande är decline-rationalen som hindrar tyst återförslag.
- **Tre spridda errata i stället för en ADR.** Förkastat: EN rot-premiss
  (sessioner körs på Code-ytan) driver alla tre ändringarna; spridda
  errata fragmenterar designen och saknar orienterings-punkt.

## Konsekvenser

- Kontinuitets-axeln blir körbar på båda ytor; lifecycle-gittret är
  komplett där sessionerna faktiskt bor. Pluginet 13→15 skill-kataloger,
  1.10.0.
- ADR-043 beslut 5 + ADR-051 beslut 2 superseded (asymmetri-delen);
  ADR-041 beslut 2 amenderat för Code-körda sessioner. Additiva
  Updates-noter i alla tre; frysta texter orörda (L53).
- Designprincip (f) är prejudicerande för framtida Code-portningar av
  Chat-flöden.
- Chat-halvorna är oförändrade och pensioneras av migrerings-spåret;
  fram till dess bär de Chat-orkestrerade sessioner (samexistens utan
  drift-vakt-rad — medvetet, se Alternativ).
- Reversibelt: skills + ADR är repo-källade projektioner; en felaktig
  design kan rivas och om-projiceras.

## Forskningsgrund

Återanvänder ADR-043/ADR-051:s förstaparts-grund (Anthropic multi-agent
research: externminne + noggranna handoffs; harness-design: context reset
med strukturerad handoff skild från completion; cwc-long-running-agents:
commit-on-stop + PROGRESS-läsning vid omstart) — premiss-skiftet ändrar
VAR verben körs, inte forskningsmönstren de implementerar. Empirisk grund:
S52/S53-precedenten (sessioner Code-körda e2e), L119 (asymmetrisk axel =
drift-källa), fångst-raterna ~9/64/27 % (Session 8-empirin, bär ADR-041).

## Relaterade ADR:er

- ADR-043 (lifecycle-arkitektur) — beslut 5 superseded (asymmetrin);
  beslut 2:s två-ytors-modell, beslut 4 (create-session-doc
  start-exklusiv), beslut 7 (kontraktet) och beslut 8 (sessionsdoket =
  externminne) står orörda och bär denna ADR.
- ADR-051 (session-paus) — beslut 2 superseded (Chat-enbart); beslut 1,
  3, 4 (verbet, intentions-gränsen, innehållsgränsen paus vs end) står
  orörda och är Code-halvans kontrakt.
- ADR-041 (session-end do-confirm) — beslut 2 amenderat för Code-körda
  sessioner (coverage-kvittens-grinden); tre-lagers-kadensen orörd.
- ADR-052 (lifecycle-fält) — fält-semantiken active/paused/closed är
  oförändrad; Code-halvorna skriver den.
- ADR-053 (tråd-arkitektur) — T62 är trådens bärare; commit-taggen
  `[T62]`.
