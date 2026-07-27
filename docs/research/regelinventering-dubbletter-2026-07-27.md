---
owner: marcus803
updated: 2026-07-27
review_by: 2027-01-27
status: stable
---

# Regelinventering och dubblett-matris — tre instruktionsfiler (2026-07-27)

> **Proveniens:** avgränsad mekanisk disk-analys, S91. Läst i sin helhet:
> `~/Repon/marcus-system/CLAUDE.md` (217 rader),
> `~/Repon/miranon-media-admin/CLAUDE.md` (198 rader),
> `~/Repon/marcus-system/templates/code-role-discipline.md` (249 rader) — 664 rader
> totalt, verifierade med `wc -l`. Kompletterande verifierings-grep mot
> `plugins/marcus-system/skills/do-work/SKILL.md` och hub-repots övriga markdown
> för att avgöra fynd 1 och 3.
>
> Vad passet INTE gjorde: ingen web-research, inga git-kommandon, ingen testsvit,
> ingen ändring i någon av de tre analyserade filerna. Ingenting verkställt —
> snittlistan är ett förslag, inte en utförd operation. Harnessets faktiska
> subagent-kapabiliteter är inte verifierade (utanför uppdraget); fynd 2 avgörs på
> filens egen inre motsägelse.

## Kort svar

### Dubblett-antalet — hypotesen är för hög

Hypotesen "ungefär hälften är dubbletter" håller inte. Mätt:

- **158 regelpunkter** totalt (hub 62, spoke 42, code-role-discipline 54).
- **35 överlappande par** identifierade: 10 EXAKT, 15 NÄRA, 10 ÖVERLAPPANDE.
- **cirka 60 regelpunkter (38 %)** deltar i minst en överlapps-relation.
- **29 regelpunkter (18 %)** kan faktiskt raderas utan att något går förlorat.

Skillnaden mellan 38 % och 18 % är hela poängen: de flesta överlapp är par där
BÅDA sidorna behövs (en princip plus dess spoke-förfining, eller en regel plus dess
operationalisering). Bara 18 % är ren upprepning.

### Men bantnings-utrymmet är mycket större än 18 % — det ligger bara inte i dubbletterna

- **34 % av regelmassan levereras aldrig.** 54 av 158 regelpunkter och 249 av 664
  rader bor i `code-role-discipline.md`, som inte når en session.
- **30 % är inte regler.** 48 punkter är KUNSKAP — fakta, pekare, proveniens.
- **41 % kan mekaniseras.** 65 punkter är TVINGANDE och kan bli deterministiska spärrar.
- **26 % måste vara text.** Endast 41 punkter kräver genuint omdöme.

Flyttas KUNSKAP till uppslag och mekaniseras TVINGANDE, går prosalagret från 158
till 41 punkter — cirka 74 % ned, mot 18 % från avdubblering ensamt.

### Klassnings-fördelning

|Klass|Hub|Spoke|Code-roll|Totalt|Andel|
|---|---|---|---|---|---|
|TVINGANDE|16|16|33|**65**|41 %|
|OMDÖME|27|6|8|**41**|26 %|
|KUNSKAP|17|20|11|**48**|30 %|
|DÖD|2|0|2|**4**|3 %|
|Summa|62|42|54|**158**|100 %|

51 % av allt TVINGANDE material (33 av 65) ligger i den enda fil som aldrig laddas.

### Utfall på de tre kända fynden

|#|Fynd|Utfall|
|---|---|---|
|1|§3.3 commit/push gated bakom kvittens|**BEKRÄFTAT med nyans** — regeln är död som skriven; omtolkningen finns men bara i do-work-skillen, inte i §3.3 själv|
|2|§6.4 "det finns ingen löpande insyn"|**FAKTAFEL** — motbevisas av de två bulletarna direkt intill i samma sektion|
|3|Lovable-guarden|**LOKALISERAD** — hub-CLAUDE.md rad 177, enda förekomsten, fristående, raderas kirurgiskt|

## 1. De tre kända fynden i detalj

### 1.1 Fynd 1 — §3.3 mot faktisk praxis

Regeln, verbatim (`templates/code-role-discipline.md` rad 136–140):

> ### 3.3 STOPPA före irreversibelt
>
> **Checkpunkt:** Är commit/push/borttagning gated bakom Marcus-kvittens?
>
> **Operationalisering:** Skapande/edit i working tree kan göras, verifieras och
> rapporteras; det irreversibla steget väntar på kvittens.

Stöd MOT regeln, inom de tre filerna:

|Källa|Rad|Verbatim|
|---|---|---|
|Hub H22|70|"Code utför LÄS → RAPPORTERA → PLANERA → IMPLEMENTERA → VERIFIERA mot disk **inklusive `git add/commit/push`**"|
|Hub H44|140–143|"/do-work plockar nästa plockbara skiva … och driver den till validerad, pushad commit"|
|Hub H44|144–146|"/work-batch (Marcus-beordrad, **ordern är batch-kvittot**) kör upp till max-kort skivor **autonomt**"|

H22 räknar upp commit och push som normala steg i Code:s egen loop, utan att nämna
någon grind. H44 går längre och deklarerar explicit att en enda order utgör kvittot
för ett helt batch-pass.

Stöd FÖR regeln, inom de tre filerna:

|Källa|Rad|Verbatim|Räckvidd|
|---|---|---|---|
|C20 (§3.2)|132|"Invänta Marcus' kvittens i klartext."|Gäller EFTER en §3.1-trigger, inte generellt|
|C39 (§6.3)|202–204|"Orkestreraren äger commit, branch och push."|Gäller subagenter, inte Code självt|

Ingen av dem stödjer en ovillkorlig grind. C20 är villkorad av att en stopp-trigger
redan gått; C39 handlar om delegerade agenter.

Sömmen finns på disk — men utanför de tre filerna. `plugins/marcus-system/skills/do-work/SKILL.md`
rad 14–17, verbatim:

> **Kvitto-sömmen (§3.3):** kortets `ready-for-agent`-etikett (satt vid
> to-issues-godkännandet) + den explicita /do-work-avfyrningen utgör
> tillsammans det durabla förhandskvittot för commit + push INOM kortets
> scope.

**Bedömning.** Praxis motsäger inte regelns *avsikt* — den har omtolkat "kvittens"
från per-steg till stående förhandskvitto. Men omtolkningen är ensidig: do-work
pekar på §3.3, medan §3.3 inte pekar tillbaka och aldrig uppdaterades. Läser man
§3.3 isolerat, som en ny session skulle göra, får man en blanket-grind som ingen
följer. Regeln är därför **DÖD som skriven**. Att defekten inte kostat något beror
enbart på att filen aldrig laddas — vilket gör den till en latent bomb snarare än
ett löst problem: distribueras filen någon gång, aktiveras en grind som motsäger
både hub-konstitutionen och do-work.

Rekommendation: skriv om §3.3 till kvitto-sömmens formulering, ELLER radera §3.3
och låt H22 plus H44 bära ämnet ensamma.

### 1.2 Fynd 2 — §6.4 "det finns ingen löpande insyn"

Påståendet, verbatim (rad 220–221):

> - **En agent som sitter fast är tyst på exakt samma sätt som en som jobbar.** Det
>   finns ingen löpande insyn — planera för det i stället för att tolka tystnad.

**Faktafel — motbevisat av filens egen omgivande text.** Tre motbevis, alla inom
samma sektion:

|#|Källa|Rad|Verbatim|Varför det motbevisar|
|---|---|---|---|---|
|1|C44|217–218|"**Läs aldrig agentens transkript.** Det sväller orkestrerarens fönster"|Ett förbud mot att läsa transkriptet förutsätter att transkriptet ÄR läsbart. Insyn finns — den är dyr, inte obefintlig. Bulleten står direkt ovanför.|
|2|C44|218–219|"Spår i git plus **en riktad statusfråga** är de verktyg som finns."|En riktad statusfråga till en levande agent ÄR löpande insyn. Meningen listar mekanismen; nästa mening förnekar den.|
|3|C42|209–211|"Kontrollera med `git status` i arbetsträdet innan något felsöks"|Ytterligare en löpande insyns-kanal, i sektionen intill.|

Kontexten förklarar felet. Raden kom in i v1.3 (2026-07-26, S91) enligt versions-
loggen rad 246. Den är en erfarenhetsformulering — "vi visste inte vad agenterna
gjorde" — som generaliserats till en kapabilitets-utsaga. Det är två olika
påståenden: *vi valde bort insynen för att den kostar kontext* är sant och
användbart; *insyn existerar inte* är falskt och leder till fel planering.

Flaggat, ej verifierat (utanför uppdraget): harnessets faktiska yta pekar åt samma
håll — subagenter kan köras i bakgrunden med slutförande-notis, och en levande
agent kan tillfrågas. Fyndet vilar dock på den inre motsägelsen, som räcker.

Rekommendation: ersätt "Det finns ingen löpande insyn" med "Insynen är pull-baserad
och kostar kontext — den kommer inte till dig."

### 1.3 Fynd 3 — Lovable-guarden, exakt lokalisering

|Fält|Värde|
|---|---|
|Fil|`/Users/marcus/Repon/marcus-system/CLAUDE.md`|
|Rad|**177** (enda raden — hela regeln ryms på en rad)|
|Sektion|`## Kritiska guards (bryt aldrig dessa)`, rubrik på rad 175|
|Verbatim|`- **Byt ALDRIG namn på ett GitHub-repo via GitHub om Lovable är kopplat.** Byt namn inifrån Lovable.`|

Snittet är rent. Verifierat med grep:

- Rad 177 är den **enda** Lovable-förekomsten i alla tre analyserade filerna.
- Ingen annan rad i någon av filerna refererar guarden.
- Övriga Lovable-omnämnanden i hub-repot ligger i `projects.md`, `README.md`,
  `SYSTEM-INVENTORY.md`, `workflow-manual-v2-spec.md` och `profile.md` — samtliga
  beskrivande inventarie- eller stack-rader, ingen refererar guarden.

Efter borttagning har sektionen tre punkter kvar (H55, H56, H57) och rubrikens
plural håller. Se dock strukturfynd SF2: H54 var sektionens enda punkt med faktisk
guard-form, så borttagningen tömmer sektionen på sin egen genre.

## 2. Regelinventering

### 2.1 Hub-konstitutionen (H1–H62)

|ID|Rad|Regel|Klass|
|---|---|---|---|
|H1|10|Filen läses automatiskt vid varje Claude Code-session|KUNSKAP|
|H2|16|Marcus djupprofil bor i profile.md|KUNSKAP|
|H3|18|Systemets identitet bor i IDENTITET.md|KUNSKAP|
|H4|26|Lär bäst via steg-för-steg, instruktionsvideor, wizard-format|KUNSKAP|
|H5|30|Briefing-ton: ärlig och smart|KUNSKAP|
|H6|31|Briefing-format: 15+ minuter, komplett strategisk|KUNSKAP|
|H7|32|Briefing-struktur: lista mål, gå stegvis djupare, framhäv kritiskt|KUNSKAP|
|H8|33|Om bara en sak: skanna verktygsstack och omvärld|KUNSKAP|
|H9|37|Verktygsfilosofi: modulärt framför allt-i-ett|KUNSKAP|
|H10|41|Claude Code körs i VS Code, inte fristående terminal|KUNSKAP|
|H11|47|Code är agent-ytan: loop, rapport, grindar, arkitektur, lessons|OMDÖME|
|H12|47|Marcus äger riktning; rapporten är beslutsunderlag, inte relä-etapp|OMDÖME|
|H13|49|Code tar inte arkitektur- eller scope-beslut på eget bevåg|OMDÖME|
|H14|49|Marcus är inte review-loop för triviala detaljer|OMDÖME|
|H15|49|Fångst-rater: self-review 9 %, transparens 64 %, pushback 27 %|KUNSKAP|
|H16|51|Sömlöst flöde är disciplin, inte slöhet|OMDÖME|
|H17|53|Läs-orientering i session-start; roll-disciplin i templates-filen|KUNSKAP|
|H18|55|Roll-arkitekturen etablerad Session 9 per ADR-041|KUNSKAP|
|H19|61|Alla svar på svenska|TVINGANDE|
|H20|62|Föreslå proffsigaste vägen; research först, bygg sedan|OMDÖME|
|H21|63–69|Gissa aldrig systembeteende; verifiera mot dokumentation eller data först|OMDÖME|
|H22|70|Code är default-utförare mot disk, inklusive git add, commit, push|TVINGANDE|
|H23|71|Vid begynnande hypotes: stoppa och verifiera före leverans|OMDÖME|
|H24|72|Agentens "X är bruten" är hypotes, inte slutsats|OMDÖME|
|H25|73|Fråga aldrig om det som redan står i konversationen|OMDÖME|
|H26|74|Kör alltid git pull före ändringar i ett repo|TVINGANDE|
|H27|75|Kör alltid ls på arbetsmappen före glob eller grep|TVINGANDE|
|H28|76|Code-prompts ska alltid ange fullständig sökväg|TVINGANDE|
|H29|77|Sök i all dokumentation före approach; återanvänd befintlig research|OMDÖME|
|H30|78|Ställ alltid frågan hur ett proffs hade gjort detta|OMDÖME|
|H31|79|Researcha etablerade bibliotek och branschledarnas lösning före egen design|OMDÖME|
|H32|80|Testa nytt bibliotek med minimalt test före full implementation|TVINGANDE|
|H33|81|Prompter till Code ska kräva hela femstegsloopen|DÖD|
|H34|82|Föreslå ny session efter cirka 20–25 meddelanden|TVINGANDE|
|H35|83|Spokes CI-grindvaktslogik är alltid config-driven, aldrig hårdkodad|TVINGANDE|
|H36|84–87|11/10 är golv, inte tak; branschstandard är utgångsläget|OMDÖME|
|H37|88–92|Forensiskt pass före förslag som rör nyligt ändrad infrastruktur|OMDÖME|
|H38|93–108|Web-research obligatorisk före strategi-, arkitektur-, verktygs- och versionsval|OMDÖME|
|H39|109–115|Endast filartefakter överlever sessionsbyte; säkra allt före byte|TVINGANDE|
|H40|116–117|STOPPA-OCH-FRÅGA skrivs som text, aldrig som popup|TVINGANDE|
|H41|118–123|Grillning är normalstart för designarbete; agenten auto-startar aldrig|TVINGANDE|
|H42|124–128|Utmana språk mot ORDLISTA.md; uppdatera vid kristallisering, bunta aldrig|OMDÖME|
|H43|129–135|ADR mintas endast när tre villkor håller samtidigt|OMDÖME|
|H44|136–149|Arbetsspecar bor som kort; kort ändras endast via backlog-CLI|TVINGANDE|
|H45|150|Ingen lathet: hitta grundorsaker, inga temporära fixar|OMDÖME|
|H46|151|Planera före bygge; vid fel, stanna och planera om|OMDÖME|
|H47|152|Verifiera innan klart; det funkar är inte det är rätt|OMDÖME|
|H48|153|Kräv elegans för icke-triviala ändringar|OMDÖME|
|H49|154|Golvet skärs aldrig; spekulativ komplexitet ovanför golvet skärs alltid|OMDÖME|
|H50|155|Lager oberoende; datalagret nås endast via sin adapter|TVINGANDE|
|H51|156|Uppdatera tasks/lessons.md efter varje korrigering; märk universella|TVINGANDE|
|H52|157|Gunilla-principen: allt ska förstås utan tekniska förkunskaper|OMDÖME|
|H53|163–171|Rutiner bor i skills; konstitutionen bär principer, skills bär HUR|KUNSKAP|
|H54|177|Byt aldrig repo-namn via GitHub när Lovable är kopplat|DÖD|
|H55|178–188|Två Airtable-MCP:er med olika räckvidd; prova claude.ai-connectorn först|KUNSKAP|
|H56|189|Projektkunskap indexerar inte filer över cirka 5000 rader|KUNSKAP|
|H57|190|IDENTITET.md är filtret vid tvivel om bygga eller eliminera|OMDÖME|
|H58|196–199|Self-review-sektionen är omtillämpning av hypotes- och forensik-raderna|KUNSKAP|
|H59|201–203|Verifiera repo-egenskaper per prompt mot faktiskt tillstånd|TVINGANDE|
|H60|204–206|Grind-mål ska vara nåbara; vid divergens styr rationale|OMDÖME|
|H61|207–209|Korsläs klassningstabeller; validera inlinat innehåll mot grindvakter|TVINGANDE|
|H62|210–217|Bygg för extern fångst, inte intern självkontroll|OMDÖME|

### 2.2 Spoke-reglerna (S1–S42)

|ID|Rad|Regel|Klass|
|---|---|---|---|
|S1|14|Admin-app för Miranon Media: event, anmälningar, betalningar, personer|KUNSKAP|
|S2|16|React-konvertering av Vue-systemet; Vue-repot är fryst referens|KUNSKAP|
|S3|18|Styrande dokument är docs/byggplan.md; react-migration är historiskt|KUNSKAP|
|S4|20|Airtable-basen är förstklassig leverabel; defekter löses i basen|KUNSKAP|
|S5|26|Läs byggplan.md före varje fas; avvik aldrig utan uppdatering|TVINGANDE|
|S6|27|Kolla React Aria, TanStack, Radix och FK före egen lösning|OMDÖME|
|S7|28|Konsultera data-model.md före varje Airtable-fältoperation|TVINGANDE|
|S8|29|Systemets mekanik bor i SYSTEMET.md; slå upp on-demand|KUNSKAP|
|S9|30|Testa nytt bibliotek med en komponent och en hook först|TVINGANDE|
|S10|31|Verifiera per komponent mot 11/11/11 eller 11/10/10|TVINGANDE|
|S11|32|Fånga lärdomar i tasks/lessons.md; markera universella|TVINGANDE|
|S12|38–41|Kör triage vid det oväntade; lita inte på omdöme i stunden|OMDÖME|
|S13|43|Blockerar och i scope: hantera nu som enabling-detour|TVINGANDE|
|S14|44|Blockerar och utanför scope: stoppa och eskalera till Marcus|TVINGANDE|
|S15|45|Blockerar ej och värdefullt: defer till tråd-registret|TVINGANDE|
|S16|46|Blockerar ej och lågvärde: förkasta explicit, aldrig tyst|TVINGANDE|
|S17|48–51|Registrera alltid; baren för blockerar hålls hög|OMDÖME|
|S18|53–54|Samma scope ger detour; distinkt scope ger egen session|OMDÖME|
|S19|56–57|Tråd-registreringens HUR bor i tasks/threads/README.md|KUNSKAP|
|S20|63|Stack: React, TypeScript, Vite, TanStack Router, Biome|KUNSKAP|
|S21|71–76|Fyra kanoniska grindar: test:api, typecheck, Biome check, build|TVINGANDE|
|S22|78–93|Bygg aldrig granskningsdata för hand; kör seed:review|TVINGANDE|
|S23|95–97|Raden står i CLAUDE.md för att verktyget annars inte hittas|KUNSKAP|
|S24|103|Aktuell filstruktur hämtas med tree-kommandot|KUNSKAP|
|S25|109–111|Projektkunskapen synkar inte arkiv-mapparna; allt finns i git|KUNSKAP|
|S26|113–117|Noll träffar i projektkunskapen betyder inte att materialet saknas|OMDÖME|
|S27|119–120|docs/research ligger kvar i synken tills Fas 6 avslutats|KUNSKAP|
|S28|126–130|Tre token-lager: primitiv, semantisk, komponent|KUNSKAP|
|S29|134|Inga hårdkodade färger i komponenter|TVINGANDE|
|S30|135|Inga komponentspecifika tokens utanför components.css|TVINGANDE|
|S31|136|Design-foundation bor i hubbens DESIGN-FOUNDATION-v1.md|KUNSKAP|
|S32|137|Varje komponent klarar prefers-contrast, reduced-motion och print|TVINGANDE|
|S33|139|Fullständig design-spec bor i DESIGN-SYSTEM-SPEC.md|KUNSKAP|
|S34|147–152|Verktygstabell: Code, Vite, Playwright, Airtable MCP|KUNSKAP|
|S35|154|Metod: planera, bygg fas för fas, Marcus verifierar i browsern|KUNSKAP|
|S36|156|Fasordning och fas-status styrs av byggplan.md §4|KUNSKAP|
|S37|162–165|Bibliotek 11/11/11; vyer 11/10/10|TVINGANDE|
|S38|167|Tillgänglighet är alltid 11 utan undantag|TVINGANDE|
|S39|169|Fullständiga checklistor bor i KVALITETSDEFINITIONER-11-REACT.md|KUNSKAP|
|S40|175–176|Dubbel output: produkten och komponentbiblioteket|KUNSKAP|
|S41|178–181|Allt bedöms mot både produkt- och biblioteksperspektivet|OMDÖME|
|S42|187–198|Plugin aktiveras via user-scope install-record; flagga om det saknas|KUNSKAP|

### 2.3 code-role-discipline.md (C1–C54)

Hela denna fil är operativt inert — den distribueras inte med pluginet
(`plugins/marcus-system/` innehåller endast `README.md`, `hooks/` och `skills/`;
`templates/` ligger utanför) och importeras inte av någon fil. Klassningen nedan
avser innehållet, inte leveransen.

|ID|Rad|Regel|Klass|
|---|---|---|---|
|C1|13–15|Alltid-på Code-disciplin över alla spokes; HUR:et bor här|KUNSKAP|
|C2|17–19|Empirisk grund: fångst-raterna 9, 64 och 27 procent|KUNSKAP|
|C3|21–22|Status stable; skill-mekanismen falsifierad för denna beteendeklass|KUNSKAP|
|C4|27–29|Gäller alltid för all Code-aktivitet med commit-effekt|KUNSKAP|
|C5|32–36|Sektionerna gäller per fas; Marcus kan inspektera efterlevnaden|KUNSKAP|
|C6|42–46|Läs mot faktisk disk; pre-existing är signal, inte skäl att hoppa|TVINGANDE|
|C7|48–54|RAPPORTERA är egen fas; inget commit-arbete före den är grön|TVINGANDE|
|C8|56–62|Planera mot rapporten; vid divergens stoppa, rationale styr|TVINGANDE|
|C9|64–70|Path-scopad git add; hub och spoke i separata commits|TVINGANDE|
|C10|72–76|Hämta datum live med date; aldrig ur kontext eller minne|TVINGANDE|
|C11|78–84|Kör CI:s exakta kommandon; lokal exit noll är inte grönt|TVINGANDE|
|C12|86–90|Verifiera governing-status mot policy-filen före frontmatter-bump|TVINGANDE|
|C13|94|Transparens-rapporten är 64-procents-mekanismen; systematisk, ej prosa|KUNSKAP|
|C14|98–100|Rapport i numrerade block med faktiska värden per punkt|TVINGANDE|
|C15|104–106|Prefixa avvikelser med AVVIKELSE; faktiskt mot förväntat|TVINGANDE|
|C16|110–114|Vid avslut: rapportera TÄCKT, EJ TILLÄMPLIGT eller SAKNAS per post|TVINGANDE|
|C17|118–120|Ren läsning avslutas med explicit inga-ändringar-rad|TVINGANDE|
|C18|124|Default vid tveksamhet är stopp, inte tolkning|OMDÖME|
|C19|128|Sju stopp-triggers, från tvetydighet till irreversibla handlingar|OMDÖME|
|C20|132|Vid stopp: rör inget, rapportera verbatim, invänta kvittens|TVINGANDE|
|C21|134|Stopp före edit utgör cirka hälften av Code-fångsterna|KUNSKAP|
|C22|136–140|Commit, push och borttagning är gated bakom Marcus-kvittens|DÖD|
|C23|146–150|Rapporten ska vara självbärande; Marcus är enda mänskliga motpart|OMDÖME|
|C24|153–154|Handover bär SHA, utfall, avvikelser, träd-tillstånd, väntan|TVINGANDE|
|C25|158|Code fattar inte arkitektur- eller scope-beslut|OMDÖME|
|C26|159|Skilj strukturellt orörd från värde-fruset; gissa aldrig|OMDÖME|
|C27|160|Aldrig git add -A eller svepande staging|TVINGANDE|
|C28|161|Ingen trail-reflektion i kod-artefakter|TVINGANDE|
|C29|165–168|§6 gäller när Code orkestrerar subagenter; grundad i S91|KUNSKAP|
|C30|172–174|Deklarera delade resurser före parallellstart; serialisera överlapp|TVINGANDE|
|C31|176–179|Utan partitionering krockar spåren; nummerkollision inträffade|KUNSKAP|
|C32|185|Briefen anger uppgiften i en mening plus beslutet den informerar|TVINGANDE|
|C33|186–187|Briefen bär faktisk kontext ur repot|TVINGANDE|
|C34|188–190|Briefen räknar upp hårda förbud explicit|TVINGANDE|
|C35|191|Briefen anger exakt leveransväg med filnamn och plats|TVINGANDE|
|C36|192–193|Briefen anger grindarna agenten själv kör före slutrapport|TVINGANDE|
|C37|194–195|Slutrapporten ska vara kort destillat; filen bär detaljerna|TVINGANDE|
|C38|199–201|Briefen säger rakt ut om agenten får köra git alls|TVINGANDE|
|C39|202–204|Läs- och analysagenter kör inga git-kommandon|TVINGANDE|
|C40|204–207|Rör aldrig en gren vars agent lever; BEHIND efter slutrapport|TVINGANDE|
|C41|208|Måste grenen röras under körning: säg till agenten först|TVINGANDE|
|C42|209–211|Leveransen är det committade; kontrollera arbetsträdet med git status|TVINGANDE|
|C43|215–216|Ingen dubbelbevakning; en aktör äger bevakningen av en körning|TVINGANDE|
|C44|217–219|Läs aldrig transkriptet; git-spår och statusfråga är verktygen|TVINGANDE|
|C45|220–221|Fastnad agent är tyst som arbetande; ingen löpande insyn finns|DÖD|
|C46|222–224|Kör agenter i bakgrunden och arbeta vidare under tiden|TVINGANDE|
|C47|228–229|Ta emot agentresultat som hypotes tills det verifierats|OMDÖME|
|C48|230|Kontrollera att agenten höll sin partition före landning|TVINGANDE|
|C49|231–233|Landa i klump vid parallellt arbete; avvägningen är medveten|OMDÖME|
|C50|237|Per fångst: bekräfta att grinden är representerad, annars flagga|TVINGANDE|
|C51|238|Per sessionsavslut: granska om ny felklass avslöjade saknad checkpunkt|TVINGANDE|
|C52|239|Per spoke-portabilitets-test: verifiera att sektionerna generaliserar|OMDÖME|
|C53|243–246|Versionslogg v1.0 till v1.3|KUNSKAP|
|C54|248–249|Läses som komplement till hubbens roll-arkitektur|KUNSKAP|

## 3. Dubblett-matris

### 3.1 EXAKT — samma regel, ingen betydelseskillnad

|#|Par|Överlevare|Varför|
|---|---|---|---|
|E1|H51 ↔ S11|**H51**|Identisk sökväg (`tasks/lessons.md`), identisk flagga, identisk trigger. Spoke tillför noll — ingen förfining av vare sig plats eller villkor.|
|E2|H47 ↔ S10 (andra halvan)|**H47**|Meningen "det funkar ≠ det är rätt" står ordagrant i båda. Spoke-halvan om 11/11/11 är däremot förfining och överlever separat.|
|E3|H12 ↔ C23|**H12**|Nästan verbatim samma två satser: Marcus enda mänskliga motpart, rapporten är beslutsunderlag ej relä-etapp. C23 åberopar dessutom H12 som sin egen empiriska grund.|
|E4|H13 ↔ C25|**H13**|Samma innebörd: Code fattar inte arkitektur- eller scope-beslut. C25 tillför bara en korsreferens till §3.1.|
|E5|H37 ↔ C6 (andra halvan)|**H37**|Samma sats i två ordval: "pre-existing är inte ursäkt utan signal att läsa varför state ser ut som det gör". H37 laddas; C6 gör det inte.|
|E6|H60 ↔ C8 (andra halvan)|**H60**|"vid divergens styr rationale, inte bokstaven" står ordagrant i båda, med samma empiriska grund (S6.7 K6).|
|E7|C9 ↔ C27|**C9**|`git add -A`-förbudet står två gånger i samma fil, och §5 pekar själv tillbaka på §1.4. Ren självupprepning.|
|E8|C8 ↔ C19|**C19**|Divergens-triggern listas i §1.3 och §3.1, var och en pekande på den andra. §3.1 är trigger-listans rätta hem.|
|E9|H53 ↔ S42 (första meningen)|**H53**|Meningen om att rutiner bor i plugin-skills och triggas via `description` är verbatim identisk. Spoke-resten (user-scope, ADR-035) är förfining och överlever.|
|E10|S3 ↔ S5|**S5**|"Styrande dokument för byggandet: docs/byggplan.md" står två gånger i samma fil, åtta rader isär. S5 bär dessutom villkoren.|

### 3.2 NÄRA — samma ämne, en av dem är strikt rikare

|#|Par|Överlevare|Varför|
|---|---|---|---|
|N1|H15 ↔ C2 ↔ H62 ↔ C13|**H15**|Fångst-raterna 9/64/27 står på fyra ställen (plus ett femte delcitat i S12). Siffrorna är KUNSKAP och behöver ett hem, inte fyra.|
|N2|H21 ↔ H23|**H21**|H23 är H21 formulerad som inre trigger i stället för utåtriktad regel. Samma krav, två gånger, nio rader isär i samma sektion.|
|N3|H24 ↔ C47|**H24**|C47 utvidgar från agent-rapport till subagent-resultat men citerar själv hub-CLAUDE.md som källa. Utvidgningen ryms i en bisats i H24.|
|N4|H20 ↔ H31|**H31**|"Research först, bygg sedan" är H31 utan innehåll. H31 anger dessutom var man letar (källkod, issues, discussions).|
|N5|H30 ↔ H36|**H36**|"Hur hade ett proffs gjort?" är en retorisk fråga utan utfall. H36 gör samma sak operationaliserbart: verifierad branschstandard är golvet.|
|N6|H29 ↔ H38|**H38**|Båda säger "återanvänd befintlig research". H38 bär hela research-disciplinen; H29 är dess första led ensamt.|
|N7|H11 ↔ H22 ↔ H33|**H22**|Femstegsloopen står tre gånger i samma fil. H22 är den enda som tillför något utöver uppräkningen (utföraren plus git-omfånget).|
|N8|H48 ↔ H49|**H49**|H49 deklarerar sig själv som "komplement till Kräv elegans" men är strikt rikare — den bär både golv-halvan och spekulations-halvan.|
|N9|H39 ↔ C23 (empirisk grund)|**H39**|C23 återciterar kontinuitet-arkitekturen som stödargument för sin egen regel. Citatet bär ingen ny norm.|
|N10|H59 ↔ C12|**Slå ihop till H59**|Omvänt fall: C12 är den KONKRETA operationaliseringen (`.frontmatter-policy.conf`, governing-hook-beteendet) medan H59 bara räknar upp abstrakta kategorier. H59 ensam är för vag att följa — lyft in C12:s innehåll.|
|N11|S10 ↔ S37+S38|**S37+S38**|Samma siffror (11/11/11, 11/10/10) i två sektioner 130 rader isär i samma fil. Tabellen bär dessutom checklist-pekaren.|
|N12|C24 ↔ C14+C15+C17|**C14–C17**|§4.2 räknar upp samma poster som §2 redan kontrakterar. Unikt i C24: commit-SHA och "vad Code väntar på" — allt annat är upprepning.|
|N13|H21 (underpunkterna) ↔ S7|**S7**|Hub-underpunkten "Airtable-struktur → använd MCP" och S7 kräver samma sak. S7 är precisare OCH ligger i repot där Airtable faktiskt används.|
|N14|C20 ↔ C22|**Ingendera slås ihop**|Ser lika ut men skiljer sig i räckvidd: C20 gäller EFTER en §3.1-trigger, C22 ovillkorligt. Just den skillnaden är fynd 1. Slå aldrig ihop dem — omtolka C22 separat.|
|N15|H44 ↔ do-work SKILL.md|**Skillen**|Konstitutionen återger skillens HUR (tvåstegs-stängning, final-summary, CI-ordning) nästan ordagrant. Se SF4 — det bryter mot H53.|

### 3.3 ÖVERLAPPANDE — rör samma yta, båda behövs

|#|Par|Bedömning|
|---|---|---|
|O1|H22 ↔ C1/C4|H22 anger VEM som utför, C4 anger NÄR disciplinen gäller. Olika frågor.|
|O2|H17 ↔ C1/C54|Rena korsreferenser fram och tillbaka. Båda är döda i praktiken eftersom C-filen aldrig laddas.|
|O3|H58 ↔ H21+H37|H58 deklarerar SJÄLV att sektionen är "inte en ny disciplin utan dessa raders tillämpning vid leverans". Preamblen kan strykas; H59 och H61 bär eget innehåll.|
|O4|H27 ↔ H21|"ls före grep" är en instans av verifiera-först, formulerad för en verktygsyta där sökning var dyr.|
|O5|H35 ↔ C12|C12 är en instans av H35:s config-driven-mönster. Båda överlever.|
|O6|H45 ↔ H46 ↔ H47|Tre angränsande arbetsdygder (grundorsak, planera, verifiera). Distinkta men tätt packade.|
|O7|S26 ↔ H21|Spoke preciserar verifiera-först mot synk-horisontens specialfall. Förfining, inte dubblett.|
|O8|H61 ↔ C11|Olika nivå: H61 validerar inlinat innehåll före leverans, C11 kör CI:s exakta kommandon efter.|
|O9|C7 ↔ C4|Båda använder "commit-effekt" som tröskel. Kompatibla.|
|O10|H55 ↔ S7|H55 är MCP-räckvidds-kunskap, S7 är skrivdisciplin. Komplement.|

### 3.4 Förfining — ser ut som dubblett, är det inte

Dessa par ska INTE slås ihop. Spoke preciserar hub på ett sätt som tillför verklig
information.

|Par|Vad spoke tillför|
|---|---|
|H32 → S9|"2 noder, 1 linje" översatt till React-domänen: 1 komponent, 1 hook. Notera dock att hub-parentesen i sig är domänspecifik i en global fil.|
|H31 → S6|Namnger de faktiska biblioteken: React Aria, TanStack, Radix, FK Designsystemet.|
|H36 → S37/S38|Abstrakt golv-princip blir konkret ribba-tabell per artefakttyp.|
|H53 → S42|Abstrakt "skills laddas via plugin" blir konkret aktiveringsmekanism plus felsökningsflagga.|
|H21 → S26|Verifiera-först applicerat på synk-horisontens specialfall: frånvaro i projektkunskapen är inte bevis.|
|H13/H23 → S12–S17|Abstrakt "stoppa vid tveksamhet" blir en tvåaxlig beslutstabell med fyra bestämda utfall. Detta är den starkaste förfiningen i hela materialet.|
|H50 → projektets fitness-ADR|Lager-invarianten delegeras till en checkbar audit.|

## 4. Strukturfynd

|ID|Fynd|Var|Konsekvens|
|---|---|---|---|
|SF1|34 % av regelmassan levereras aldrig|`templates/code-role-discipline.md`|54 av 158 regelpunkter och 249 av 664 rader når inte en session. Filen bär samtidigt 33 av systemets 65 TVINGANDE regler — majoriteten av det mest mekaniserbara materialet ligger i den enda fil som är osynlig. Referens från H17 och SYSTEMET.md är inte laddning.|
|SF2|Rubrik matchar inte innehåll|Hub 175–190|"Kritiska guards (bryt aldrig dessa)" innehåller elva rader Airtable-MCP-kunskap med caveats, en indexerings-gräns och en omdömesregel. Endast H54 hade guard-form — och den ska bort. Sektionen töms på sin egen genre av borttagningen.|
|SF3|En bullet, åtta regler|Hub 93–108 (H38)|Web-research-raden buntar: research före fem beslutstyper, citera källan, återanvänd befintlig research, förstapartskälla först, researcha mönstret ej mekanismen, 3+ precedent vid ADR-permanens, deklarera tunn precedent öppet, läs styrande ADR i helhet, riv låst beslut öppet vid falsifiering. Sexton rader, oåtkomligt för både efterlevnad och grindning. Samma mönster i H44 (14 rader, cirka 5 regler).|
|SF4|Konstitutionen bryter mot sin egen H53|Hub 136–149 mot 170–171|H53 säger "Konstitutionen slår fast PRINCIPER; HUR-stegen bor i skillsen". H44 återger sedan do-work-skillens HUR nästan ordagrant, och H41 återger grillnings-skillens trigger-mekanik. Regeln och överträdelsen står 30 rader isär i samma fil.|
|SF5|Hälften av spokes bindande regler ligger utanför "Alltid gäller"|Spoke|Sektionen "Instruktioner — Alltid gäller" bär 7 punkter. Ytterligare 9 TVINGANDE regler (S21, S22, S29, S30, S32, S37, S38, S13–S16) bor i sektioner som ser ut som referens. Den som skummar rubriken missar hälften av det bindande.|
|SF6|Projektspecifikt material i den globala konstitutionen|Hub 64–67, 178–188|H21:s underpunkter namnger `miranon_automations_COMPLETE.json`, `schema_reference.md`, `field_lookup.json` och "A1–A11". H55 är elva rader Airtable-detalj med S90-proveniens ur miranon-media-admin. Allt laddas i VARJE repo.|
|SF7|Cirkulära korsreferenser där ingen bär innehållet|C8↔C19, C9↔C27, H17↔C54|Fyra par pekar på varandra. En läsare som följer referensen landar där den kom ifrån.|
|SF8|Proveniens som brödtext|Cirka 25 regelpunkter|"Session 6.6.5 K1.5, L1", "S47 fork 2", "migrerad ur prompt-design-checklistans §4.4 vid rigor-migreringen, S54", "K61.1/T75". Arkiv-metadata i en fil vars kostnad betalas i tokens varje session. Ingen parentesreferens påverkar hur en regel följs.|

### 4.1 Regler som är för vaga att följa eller verifiera

|ID|Rad|Problem|
|---|---|---|
|H16|51|"Sömlöst flöde är disciplin, inte slöhet" — ingen handling, inget testbart utfall, ingen mottagare.|
|H34|82|"Föreslå ny session efter ca 20–25 meddelanden" — mäter meddelanden, inte kontextförbrukning. "ca" gör den ogrindbar.|
|H27|75|"Kör alltid ls före glob/grep" — formulerad för en verktygsyta där sökning var dyr. Ingen verifierbar effekt i dag.|
|S41|178–181|"Allt som byggs bedöms utifrån båda perspektiven" — inget kriterium, ingen artefakt, ingen grind.|
|C52|239|"Per spoke-portabilitets-test: verifiera att sektionerna generaliserar" — inget sådant test är definierat någonstans. Regeln pekar på en mekanism som inte finns.|

## 5. Snittlista — 29 raderbara instanser

Ordnad efter fil. Detta är förslaget; ingenting är verkställt.

|#|Instans|Rad|Åtgärd|Grund|
|---|---|---|---|---|
|1|H20|62|Absorbera i H31|N4|
|2|H21 underpunkter|64–67|Flytta till spoke|N13 + SF6|
|3|H23|71|Absorbera i H21|N2|
|4|H29|77|Absorbera i H38|N6|
|5|H30|78|Absorbera i H36|N5|
|6|H33|81|Radera|DÖD + N7|
|7|H44 do-work-HUR|140–148|Ersätt med pekare till skillen|N15 + SF4|
|8|H48|153|Absorbera i H49|N8|
|9|H54|177|**Radera** (Marcus-beslut)|Fynd 3|
|10|H58|196–199|Radera preambeln|O3|
|11|H62 sifferhalvan|211–213|Absorbera i H15|N1|
|12|S3|18|Absorbera i S5|E10|
|13|S10 citat-halvan|31|Absorbera i H47|E2|
|14|S10 ribba-halvan|31|Absorbera i S37/S38|N11|
|15|S11|32|Radera|E1|
|16|S42 första meningen|187–189|Radera|E9|
|17|C2|17–19|Absorbera i H15|N1|
|18|C6 pre-existing-meningen|44|Absorbera i H37|E5|
|19|C8 rationale-meningen|60|Absorbera i H60|E6|
|20|C8 divergens-hänvisningen|60|Absorbera i C19|E8|
|21|C13 sifferdelen|94|Absorbera i H15|N1|
|22|C21|134|Radera (proveniens, ej regel)|SF8|
|23|C22|136–140|**Skriv om eller radera**|Fynd 1|
|24|C23|146–150|Absorbera i H12 och H39|E3 + N9|
|25|C24|153–154|Reducera till pekare plus två unika poster|N12|
|26|C25|158|Absorbera i H13|E4|
|27|C27|160|Radera|E7|
|28|C45|220–221|**Skriv om**|Fynd 2|
|29|C47|228–229|Absorbera i H24|N3|

## 6. Vad mätningen betyder för bantningen

Avdubblering ensamt ger 29 av 158 punkter, alltså 18 %. Det räcker inte mot ett
textlager som är fem gånger för stort. De tre lager som faktiskt bär volymen:

1. **Leverera eller retirera code-role-discipline.md.** 249 rader som ingen läser
   är inte 249 rader man kan spara — de sparas redan. Men de 33 TVINGANDE reglerna
   där är arbete som antas ske och inte sker. Antingen distribueras filen, eller så
   flyttas dess unika innehåll (C10 datum-invarianten, C12 governing-verifieringen,
   C30–C42 delegerings-disciplinen) in i något som laddas — och resten retireras.

2. **Skilj KUNSKAP från REGEL.** 48 punkter är fakta och pekare. De behöver vara
   sökbara, inte närvarande. Ett uppslag som läses on-demand kostar noll tokens per
   session; samma rad i CLAUDE.md kostar varje gång.

3. **Mekanisera TVINGANDE.** 65 punkter är deterministiska. Varje sådan som blir en
   hook, en CI-grind eller en lint-regel slutar konkurrera om modellens
   uppmärksamhet — och blir samtidigt strikt mer tillförlitlig än prosa.

Kvar blir 41 OMDÖMES-punkter. Det är den regelmängd som genuint måste vara text —
och den ligger redan under leverantörens rekommenderade storlek.
