# ADR-043: Session-lifecycle som två-ytors skill-par + Project Instructions bas/delta-mall

- Status: Proposed (Session 10 — 2026-05-30). Arkitekturen är ratificerad av Marcus i direktion; flippas till Accepted vid första inkrementets landning (se Implementationsplan).
- Datum: 2026-05-30
- Fas: Session 10 — process-fundament (efter ADR-042, före Fas 2.5)

## Kontext

Session 10 öppnade på `code-roll-disciplin` (landad som alltid-på regel, ADR-042). Under sessionen avtäcktes empiriskt tre process-haverier som inte var enskilda misstag utan symptom på ett strukturellt hål:

1. **Inget sessionsdok skapades vid sessionsstart.** Sessionsdokets *födelse* är inte inkodad någonstans: `session-start`-skillen (Code-sidan) *läser och rapporterar* men skapar inget dok; Project Instructions SESSIONSSTART-sekvens (Chat-sidan) saknar steget; `session-end` gör do-confirm mot ett *befintligt* dok. Födelsen hängde på konvention och minne — den empiriskt svagaste mekanismen (Chat-self ~9 %).

2. **Levande statusartefakter uppdaterades inte i takt med förändring.** `tasks/todo.md` förblev "pending" efter att en arbetspunkt landat, pushats och blivit CI-grön. Uppdaterings-kadensen var bunden till sessionsavslut i stället för till landnings-ögonblicket.

3. **En ny chatt kunde inte rekonstruera sessionens läge.** När arbetet fortsatte i en ny Chat-kontext visste Chat varken sessionsnummer eller var i arbetet vi stod. Eftersom Chat orienterar mot det ETL-batch-synkade projektkunskaps-indexet (ej live-HEAD, per lesson om projektkunskaps-färskhet) och varken sessionsdok eller todo speglade mitt-i-sessionen-läget, fanns ingen durabel källa att rekonstruera ur.

**Rot-asymmetrin.** Code-sidan styrs av plugin-skills (session-start/-end auto-upptäckta vid Code-start). Chat-sidan styrs av Project Instructions. Lifecycle-HUR:et bor i en skill som bara Code ser; Chat *instrueras att dirigera* lifecycle men rekonstruerar proceduren ur ofullständig prosa och saknar varje mekanism för att utlösa den. Den alltid-på regeln "skapa sessionsdok" fanns dessutom redan som universell lesson (P1, 2026-05-04: "Sessionsdokument från första klunga") men var aldrig inkodad i den operativa sekvensen.

**Research bekräftade att haverierna har namn.** Anthropics egen multi-agent-research (orchestrator-worker) namnger två haveri-lägen för långkörande agenter: kontext-förlust-inducerad inkoherens och för-tidig wrap-up nära kontextgränsen — exakt haveri 1/3 och haveri 3 ovan. Mitigeringen i samma research: lagra det väsentliga i *externt minne* innan man går vidare, och föra över kontinuitet till en färsk agent via *noggranna handoffs*. Vårt sessionsdok ÄR det externa minnet; det fanns bara inte.

Frågan blev: hur ger vi Chat-ytan en pålitlig lifecycle-mekanism utan att (a) återinföra det discovery-beroende ADR-034 + K8 falsifierade, eller (b) skapa drift mot hub-en-sanningskälla som Session 6.7 etablerade?

## Beslut

### 1. Tre-lagers leveransmodell efter *när innehållet måste vara aktivt*

Disciplin-innehåll klassas efter aktiverings-tidpunkt, och leveransmekanismen väljs därefter (samma princip som ADR-034 p.8: mekanism mot beteende-klass, inte mot trigger-ordval):

- **Alltid-på** — gäller varje meddelande, inget trigger-ögonblick (grundregler, self-review, research-mandat, roll-arkitektur-princip, 4-zoners-format). Bor i alltid-laddad yta: Project Instructions (Chat) / CLAUDE.md (Code). Flyttar *aldrig* till en anropad skill.
- **Kommando-utlöst lifecycle** — gäller vid ett specifikt ögonblick (sessionsstart, sessionsavslut, session-återupptagning). Bor i skills.
- **Externminnes-substrat** — den durabla artefakt som bär kontinuitet över Chat-kontext-död: sessionsdoket.

Testet för klassning: *"Vill jag att den här regeln är aktiv under ett slumpmässigt arbetsmeddelande mitt i sessionen?"* Ja → alltid-på (PI/CLAUDE.md). Bara meningsfull vid ett lifecycle-ögonblick → skill.

### 2. Lifecycle levereras som två-ytors skill-par med explicit handoff-kontrakt

Varje lifecycle-händelse manifesteras i två halvor som delar *en* definition men kör på sin yta — i linje med leveransyte-modellen (ADR-034 p.9) och orchestrator-worker-mönstret:

- **Chat-halva** (claude.ai-skill, konto-nivå, `/`-anropad av Marcus): orkestrerar — orienterar, föreslår, *dirigerar* Code, skördar.
- **Code-halva** (hub-plugin-skill): utför mot disk — verifierar repo-state, skapar/uppdaterar artefakter, rapporterar transparens.

Halvorna behöver *inte* vara symmetriska (se beslut 5). Det bärande är inte halvorna utan **kontraktet mellan dem** (se beslut 7).

### 3. Lifecycle-skill-set

- **Chat-sidan (claude.ai, konto-nivå, hub-källad):** `session-start`, `session-end`, `session-resume`.
- **Code-sidan (hub-plugin):** befintliga `session-start`, `session-end`, `phase-end-verify`, `lessons-hub-sync` — plus utökning av `session-start` med create-session-doc (beslut 4). Ingen ny Code-skill för resume (beslut 5). Pluginet förblir 4 skill-kataloger.

### 4. create-session-doc bor i session-starts Code-halva

Sessionsdok skapas exakt en gång per session, vid start, och har ingen annan anropare. Det finns därför inget DRY-skäl att bryta ut det som egen skill (det ursprungligen scopade `session-handoff.skill` / "sessionsdok-skapande-skill" utgår som självständig skill). Skapande-steget bor i session-starts Code-halva. Den utförliga skapande-proceduren (13-stegs inkl. post-skapelse-forensik, empirisk referens: Session 6.6.6 mini-5) läggs som **referensfil ett steg ned** (progressive disclosure per Agent-Skills-standarden), så SKILL.md-kroppen hålls mager och proceduren laddas bara när den behövs.

### 5. session-resume är asymmetrisk: Chat-skill, ingen ny Code-skill

`session-resume` är en egen Chat-skill (annan användarintention än start: "rekonstruera mitt-i-sessionen-läge", inte "starta nytt"). På Code-sidan kräver resume bara read-only-primitiver (live repo-state + *lokalisera och rapportera* det befintliga sessionsdoket) — ~80 % identiskt med vad session-starts Code-halva redan gör i sin LÄS→RAPPORTERA-fas, minus skapande-grenen. Chat-sidans `session-resume` pekar därför Code mot session-startens LÄS-fas i stället för att kräva en ny Code-skill. Resume *lokaliserar*, skapar aldrig — create-session-doc anropas inte av resume.

### 6. Project Instructions blir bas + tunn per-spoke-delta

Per branschstandard för config-arv (bas + overlay), grund hierarki, per-sektion-override:

- **Bas (hub, delad över alla spokes):** `marcus-system/templates/project-instructions-base.md` — den alltid-på gemensamma meta-disciplinen (grundregler, self-review, research-mandat, roll-arkitektur-princip, 4-zoner). Klistras in i varje spokes Project Instructions; alltid-laddad-kravet uppfylls eftersom PI alltid laddas.
- **Lifecycle-HUR flyttar UT ur PI** in i Chat-lifecycle-skillsen. PI behåller en pekare ("session-lifecycle: använd `/session-start`, `/session-end`, `/session-resume`").
- **Per-spoke-delta (overlay):** projekt-unika instruktioner (denna spokes scope, grindar, domän). Tunn.

Slutlig PI per spoke = bas (gemensam) + delta (unik). Två lager, ingen djup hierarki, per-sektion-override (ej allt-eller-inget). Repot förblir enda sanningskällan: basen och deltan är versionshanterade repo-filer; claude.ai-rutan är en projektion som aldrig redigeras direkt.

### 7. Handoff-kontrakt mellan halvorna (det bärande)

Kontraktet operationaliserar Anthropics subagent-kontrakt (mål, output-format, verktyg/käll-vägledning, uppgiftsgränser) plus handoff-mönstrets status-fält och validering-vid-varje-steg:

- **Code → Marcus → Chat** (Code-halvans output): code-role-discipline §4 (handover-protokoll) är redan detta kontrakt — faktiska värden, verbatim där begärt, AVVIKELSE-flaggor, kvarvarande tillstånd, explicit nästa-steg, avslutande status-rad.
- **Chat → Code** (Chat-halvans direktiv): speglar de fyra delarna — explicit mål, exakt output-format (transparens-rapport-krav), käll-/verktygsvägledning, och tydliga gränser (LÄS-only vs skriv; STOPPA-villkor). Status-fält obligatoriskt i varje Code-output så fel blir synliga vid checkpoints i stället för att fortplanta sig tyst.

Bägge halvor läser/skriver kontinuitet genom sessionsdoket (beslut 8). Det är så halvorna "funkar tillsammans" — genom kontrakt + delat substrat, inte genom god vilja.

### 8. Sessionsdoket är externminnes-substratet

Sessionsdoket är den enda durabla bäraren av sessions-tillstånd över Chat-kontext-död (per Anthropics "lagra i externt minne innan du går vidare" + lesson "Chat-kontext lever inte över sessionsbyte"). create-session-doc föder det vid start; lifecycle-skillsen uppdaterar det i takt med förändring (landnings-kadens, inte avsluts-kadens); session-resume läser det för att rekonstruera läget.

### 9. Öppen rivning med kvittens

Session 9:s hub-CLAUDE.md `## Roll-arkitektur` och flaggor i sessionsdok antog att lifecycle-disciplin bara bor på Code-sidan (plugin). Det rivs öppet: lifecycle bor nu på *båda* ytor som skill-par, och Chat-ytan får för första gången en explicit lifecycle-mekanism. Rivningen är öppen (denna ADR), inte tyst — ett låst antagande är inte immunt mot evidens, och evidensen är denna sessions tre haverier + research.

## Alternativ som övervägdes

**Lifecycle som auto-upptäckt claude.ai-skill (description-matchad).** Förkastat: auto-upptäckt är discovery-beroende, exakt den felklass K8 falsifierade (2/6 missade). Explicit `/`-anrop (valt) har inget upptäcktsmoment att missa.

**Allt-i-Project-Instructions (status quo).** Förkastat: prosa-only gav denna sessions haverier; lifecycle-HUR i alltid-laddad yta är dessutom bloat som laddas onödigt varje meddelande. Lifecycle ska bara vara aktiv i sitt ögonblick.

**Flytta alltid-på meta-disciplin in i skills.** Förkastat — och detta är den bärande begränsningen: en skill laddas bara vid anrop/match, inte varje meddelande. Self-review, research och roll-arkitektur måste vara aktiva *varje* tur; i en anropad skill vore de borta de turer skillen inte anropas. Det är precis varför ADR-034 drog ut self-review + research till alltid-på regler. Endast lifecycle (som ska vara ögonblicks-aktiv) flyttar till skill.

**create-session-doc som fristående skill.** Förkastat: en enda anropare (session-start), ingen återanvändning → inget DRY-skäl. Storleks-oron löses med referensfil (progressive disclosure), inte med egen skill.

**Symmetrisk Code-side session-resume-skill.** Förkastat: resume-behovet på disk är read-only och ~80 % täckt av session-starts LÄS-fas. En ny Code-skill skulle duplicera befintliga läs-primitiver. Halvorna får vara asymmetriska.

**Separat per-spoke PI utan gemensam bas.** Förkastat: duplicerar den gemensamma meta-disciplinen per spoke (samma anti-mönster som "allt-i-spoke" i ADR-034). Bas + delta är branschstandard och håller en sanningskälla för det gemensamma.

## Konsekvenser

**Vinster.** Chat-ytan får en pålitlig, deterministisk lifecycle-mekanism (`/`-anrop av Marcus) — enforcement flyttas från ~9 %-Chat-self till Marcus-trigger + Code-disk-verifiering (~64 %). Sessionsdok-födelse, todo-kadens och ny-chatt-rekonstruktion (denna sessions tre haverier) får var sin inkodad väg. PI hålls tunn och portabel via bas/delta; den gemensamma disciplinen har en sanningskälla. Lifecycle-skillsen kan anta alltid-på-basen och slipper duplicera den, så de blir magra och sitter ovanpå basen.

**Kostnader och risker.** Fler skills = mer yta att hålla i synk: (a) hub → claude.ai-uppladdning är manuell (samma driftklass som PI redan accepterar; hanteras med "repot är sanning, redigera aldrig i UI"); (b) Chat-halva och Code-halva kan glida isär semantiskt. Mitigering, grundad i researchen: håll antalet lifecycle-skills lågt (tre), håll basen genuint gemensam (över-abstrahera inte; grund hierarki), och definiera handoff-kontraktet stramt (beslut 7). En verifierings-punkt kvarstår: huruvida claude.ai stödjer att *tvinga* en skill till rent manuellt läge (motsvarande Claude Codes `disable-model-invocation`) är dokumenterat för Claude Code men ej bekräftat för konsument-appen; för lifecycle-skills är ev. auto-trigger sannolikt ofarligt men bör verifieras mot appens faktiska skill-inställningar före låsning.

**Reversibilitet.** Skill-paren och PI-basen är repo-källade projektioner; en felaktig design kan rivas och om-projiceras utan dataförlust. Beslutet är inte enkelriktat.

## Forskningsgrund

- **Anthropic, multi-agent research system (orchestrator-worker).** Lead-agent koordinerar, subagenter utför; kontinuitet över kontextgräns bevaras via externt minne + noggranna handoffs. Subagent-kontraktet = mål + output-format + verktyg/käll-vägledning + uppgiftsgränser; missas någon driftar agenten. Källa: anthropic.com/engineering/multi-agent-research-system + Anthropic-blueprint-analyser.
- **Långkörande-agent-haverilägen.** Kontext-förlust-inkoherens + för-tidig wrap-up nära kontextgränsen; mitigering = kontext-reset med strukturerad handoff till färsk agent. (Anthropic-vägledning, refererad i multi-agent-orchestrerings-litteratur.)
- **Agent-handoff-mönster.** Status-fält i varje output, validera vid varje steg, designa output för att konsumeras av nästa steg (ej bara läsbart för människa); kortare kedjor med handoffs ger naturliga checkpoints där fel ytar i stället för att snöbolla.
- **Config-arv (bas + overlay).** Kustomize base/overlay, hierarkisk config-inheritance: håll hierarkin grund (≤3 lager), använd inte basen som mall-motor, override per sektion (ej allt-eller-inget). Branschstandard för DRY config över miljöer/projekt.
- **Produktfaktum (förstapartskälla).** claude.ai stödjer explicit `/`-anrop av skills (Claude Help Center, "Use skills in Claude"): skriv `/` i sidofältet och välj skill, eller beskriv uppgiften naturligt. Konto-nivå-skills är tillgängliga över chattar/projekt; uppladdning via Settings > Customize > Skills.

## Implementationsplan (flersessioners — ej one-shot)

Sekvenserad så varje inkrement är landningsbart och verifierbart för sig. Status flippas till Accepted vid inkrement 1:s landning.

1. **PI bas/delta-mall.** Skapa `templates/project-instructions-base.md` (hub) ur nuvarande PI:s alltid-på-sektioner; definiera per-spoke-delta-strukturen; uppdatera miranon-media-admins PI till bas + delta. Verifiera att alltid-på-innehåll inte tappas.
2. **Code-halva: session-start + create-session-doc.** Utöka hub-pluginets `session-start` med skapande-grenen + 13-stegs-referensfil; bumpa plugin-version; re-installera; verifiera aktiv.
3. **Chat-halvor: session-start, session-end, session-resume.** Författa som hub-källade SKILL.md (`marcus-system/claude-app-skills/` eller motsv.); ladda upp till claude.ai (konto-nivå); verifiera `/`-anrop.
4. **Handoff-kontrakt.** Formalisera Chat→Code-direktiv-formatet (spegel till code-role-discipline §4) som template-fil.
5. **Discovery-/dogfood-test.** Verifiera att `/session-start`, `/session-end`, `/session-resume` laddar och kör korrekt; bekräfta att session-resume rekonstruerar mitt-i-sessionen-läge ur sessionsdok + todo + BUILD-LOG.

Det omedelbara: detta ADR + recovery av Session 10-doket (separat, oberoende av bygget — allt arbete ligger durabelt i git och kan backfill:as exakt).

## Relaterade ADR:er

- **ADR-034** (skill-arkitektur, leveransyte-modell p.9) — denna ADR utökar leveransyte-modellen till att ge Chat-ytan lifecycle-skills och bekräftar att alltid-på meta-disciplin stannar i alltid-laddad yta.
- **ADR-041** (session-end do-confirm-roll) — session-ends Code-halva är do-confirm-verifieraren; oförändrad.
- **ADR-042** (code-roll-disciplin alltid-på) — samma alltid-på-vs-skill-skiljelinje, här tillämpad på lifecycle vs meta-disciplin.
- **ADR-040** (sessions-numreringskonvention) — session-resume och create-session-doc refererar konventionen vid numrerings-verifiering.
