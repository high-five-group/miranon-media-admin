# ADR-042: Code-roll-disciplin levereras alltid-på, inte som skill

- Status: Superseded av ADR-079 (2026-07-27) — ursprungligen Accepted (Session 10, 2026-05-30)
- Datum: 2026-05-30
- Fas: Session 10 — process-fundament inför Fas 2.5

## Kontext

Session 9 etablerade roll-arkitekturen Chat/Code/Marcus explicit i båda ytor (DEL 3 Chat-side Project Instructions, DEL 3.5a Code-side hub-CLAUDE.md `## Roll-arkitektur`). Principen pekade framåt: hub-CLAUDE.md angav att full code-roll-disciplin (handover-protokoll, transparens-rapport-format, STOPPA-grindar som procedursteg) "etableras i kommande session som egen skill". Session 9:s sessionsdok flaggade samtidigt att skillen skulle designas med eget research-pass och discovery-test innan landning — mekanismvalet var en hypotes att pröva, inte ett verkställt beslut.

ADR-034 p.8 fastställde kriteriet för mekanismval, empiriskt avgjort av K8 (Session 6.7): skill-mekanismen levererar för kommando-utlösta operativa rutiner (session-start, session-end, phase-end-verify, lessons-hub-sync — var och en med ett trigger-ögonblick). Den levererar inte för meta-disciplin — beteende modellen redan utför nativt från konstitutionen. K8 gav 4/6: chat-self-review och web-research-discipline missade i båda lägen, saknade ett kommando-ögonblick att upptäckas på, och flyttades till alltid-på regler. Principen ordagrant: leveransmekanism väljs mot beteende-klass, inte mot trigger-ordval.

Code-roll-disciplinen prövad mot kriteriet: den gäller allt Code gör, kontinuerligt — operativ loop, transparens-rapport vid varje leverans, STOPPA-OCH-FRÅGA som default. Den har inget kommando-ögonblick och är redan alltid-på via hub-CLAUDE.md `## Roll-arkitektur`, läst vid varje Code-sessionsstart. Samma beteende-klass som de två meta-discipliner K8 falsifierade som skills. Att bygga den som skill skulle med hög empirisk sannolikhet upprepa K8:s miss — och vore ett fall av L_AAA-klassen (slutsats utan empirisk grund) att göra det ändå enbart för att handoffen sa "egen skill".

## Beslut

1. Code-roll-disciplin levereras alltid-på, inte som skill. Principen bor i hub-CLAUDE.md `## Roll-arkitektur` (Session 9); den fulla HUR-detaljen bor i `marcus-system/templates/code-role-discipline.md` (ny), parallellt med Chats HUR i `chat-prompt-design-checklist.md` per ADR-034 p.9 — konstitutionen bär principen, templaten bär stegen.

2. Hub-pluginet förblir 4 skills. Ingen ny skill, ingen ny `skills/`-katalog för code-roll-disciplin.

3. Discovery-test utgår för denna disciplin. Testet validerar trigger-tillförlitlighet för kommando-utlösta skills; en alltid-på regel har inget trigger-ögonblick att testa. Mekanismvalet avgörs av beteende-klass (p.8), inte av ett discovery-utfall.

4. Öppen rivning med kvittens. Session 9-handoffens "egen skill"-formulering och hub-CLAUDE.md:s mening om att etablera den som egen skill rivs och ersätts med en pekare till templaten. Rivningen är öppen (denna ADR), inte tyst, per principen att ett låst beslut inte är immunt mot evidens. Falsifierad mot p.8-kriteriet och K8-empirin innan bygge — samma teardown-mönster som ADR-034 p.8 tillämpade på chat-self-review.

## Alternativ som övervägdes

**A — Bygg som skill (handoffens formulering).** Förkastat: K8 ger stark empirisk prior att meta-disciplin i denna klass missar discovery; en `description`-revidering vinner inte mot nativt beteende (ADR-034 p.8).

**C — Hybrid (kommando-utlöst skiva som skill, resten alltid-på).** Förkastat: ingen genuin kommando-utlöst skiva kunde identifieras — disciplinen är kontinuerlig, inte händelse-bunden. En konstruerad trigger vore trigger-ordval-optimering, exakt det p.8 varnar för.

**Status quo (inline-princip utan nedskrivet HUR).** Förkastat: handoffen kräver att HUR:et skrivs ner; anti-bloat (hub-CLAUDE.md kring 118 rader) hindrar inline-placering, vilket motiverar templaten.

## Konsekvenser

Code-roll-HUR får en sanningskälla, portabel över alla spokes via `templates/`. Hub-CLAUDE.md hålls tunn — princip inline, HUR delegerat, konsekvent med ADR-034:s anti-bloat-tes. Ingen trigger-tillförlitlighets-risk. Kostnaden: en alltid-på template auto-upptäcks inte som en skill — den pekas på från konstitutionen (hub-CLAUDE.md-pekaren, denna sessions edit) och refereras i arbetet, precis som `chat-prompt-design-checklist.md` refereras från Project Instructions. Leveransen spänner över båda repon: ADR-042, katalog och räkning i spoken (CI-grind-bunden via ADR-039), template och hub-CLAUDE.md-edit i hubben; separata commits per K0c.

## Updates

### 2026-07-27 — Superseded i sin helhet av ADR-079 (Session 91, T100)

Beslut 1:s konstruktion — *"konstitutionen bär principen, templaten bär stegen"* —
förutsätter att båda når fram. Stegen gjorde det aldrig. Verifierat i tre kontroller:
filen finns i ingen plugin-cache, konstitutionen importerar den inte, och
plugin-manifestet nämner inte `templates/`.

Denna ADR:s egen konsekvens-rad (rad 35) formulerade kostnaden korrekt — *"en alltid-på
template auto-upptäcks inte som en skill — den pekas på från konstitutionen … och
refereras i arbetet"* — men antog att pekaren räcker. Det antagandet är falsifierat:
filen underhölls v1.0 → v1.3 utan att läsas en enda gång.

Två ytterligare fynd som beslutet inte kunde förutse:

- Formen saknar precedent. Noll av nio undersökta agent-uppsättningar bär en separat,
  alltid-gällande processfil utpekad i prosa.
- Filen bar en **död grind** (§3.3, kvittens före varje commit) som hade stoppat
  arbetsflödet om leveransen någonsin börjat fungera. Beslutet var alltså skyddat från
  sin egen konsekvens av att det inte verkställdes.

[ADR-079](ADR-079-instruktionsleverans-barare-per-lager.md) ersätter hela beslutet:
leveransbärare väljs per innehållsklass, och roll-disciplin-filen avvecklas till
`archive/code-roll-disciplinen/`. Rivningen är öppen med Marcus-kvittens, per principen
att ett låst beslut inte är immunt mot evidens.
