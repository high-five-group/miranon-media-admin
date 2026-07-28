# S91-restlistan — ordnings- och beroendekarta över allt öppnat i Session 91

> **Syfte.** Marcus order 2026-07-27: *"Allt det här ska lösas ut! […] Ha koll på
> eller skriv ner den här inventeringen så du strukturerat kan bocka av punkt för
> punkt."* Denna fil är den durabla bäraren — chatten är efemär.
>
> **Formen är en ORDNINGS- OCH BEROENDEKARTA, inte ett statusregister.**
> Kort-status ägs av backlog-CLI:t (`npx backlog task list --plain`), trådstatus
> av [`threads/README.md`](threads/README.md), landningar av git och `gh`. De
> pekas ut härifrån med sitt ID — de kopieras aldrig hit.
>
> **Det som ÄR unikt för denna fil:** ordningen · beroendena · **spår-status**
> (*"är A3 klart?"* är en aggregering ingen enskild registerpost bär) · och de
> **poster som inte är kort alls** (grenskulden, listparitets-grinden, de två
> namn-/strukturfrågorna, Eventinfo-motorn, To Do-ryggsäcken, de två
> onumrerade A2-punkterna). *(`A7:1`–`A7:2` stod här till 2026-07-29 men är
> KLARA sedan 2026-07-28 — se § Avbockningslogg.)*
>
> **Skälet till formen är empiriskt, inte principiellt.** Auditen 2026-07-28
> fann tolv statusfel i filen — **samtliga kopior av register som redan hade
> rätt svar.** Filens dåvarande inledning sade *"Kopior driftar; pekare gör det
> inte"* och bröt mot det på tolv ställen. Formen är ändrad så att felklassen
> inte kan uppstå igen.
>
> **Underhåll:** bockas av löpande i takt med landningar, i samma commit som
> arbetet där det är möjligt. Avbockade poster flyttas till § Avbockningslogg —
> **kroppen bär bara öppna `[ ]`.** Filen dör när alla spår är stängda; den är
> en arbetsyta, inte en permanent artefakt.
>
> **Senast verifierad mot disk: 2026-07-29** (audit i trettonde resumen — tre
> läsande agenter med disjunkta linser: kort-påståenden, externa referenser,
> intern koherens). **Uppdatera raden vid varje verifieringspass.**
>
> **Vid konflikt vinner registret, inte denna fil.**

## Beslutade premisser — ändra inte utan Marcus

Dessa styr alla prioriteringar nedan och är fattade 2026-07-27:

1. **Fas 6 stängs INTE.** Appens sidor är inte byggda som Marcus vill ha dem.
2. **Alla fem facit-lösa ytor ska genom samma kedja** som eventsidan fick
   (prototyp → Marcus väljer → facit → PRD → skivor): Personer · Hem ·
   Mer/Intresserade/Maillogg · Segment · Mail-handling.
3. **CI-/grind-arkitekturen görs klar FÖRE app-arbetet och hållplatsfrågan.**
4. **Fas E (Supabase) kommer efter att alla sidor är klara.** Två veckor är
   **önskan, inte deadline** — *"får bli som det blir"*.
5. **90/10-kravet:** CI-arkitekturen ska vara 110 % toppdesignad med väl
   underbyggda Airtable-anpassningar, men **~90 % ska överleva Supabase-bytet**
   oförändrat och lika förstklassigt. Vid övergången ska resultatet vara i
   absolut topp senior frontier-klass.
6. **Airtable-basen bevisas av att appen byggs färdig** — det är ADR-063:s egen
   logik (kontext punkt 3). Därför kan AT-Max inte dekomponeras meningsfullt
   förrän sidorna är klara: milstolpens kravspec *är* defekt-registret.

**Konsekvens av premiss 4 + 5 som måste bäras in i grillningen:** S91:s
grillningsbeslut vilade på att migreringen skulle städa upp de icke-hermetiska
testerna inom två veckor (sessionsdok Del 7 § Grillningens läge, rad 1098 +
**1105** — rättat 2026-07-29: rad 1098 bär "migreringen", tvåveckorspremissen
bor på rad 1105).
Den premissen gäller inte längre, och 90/10-kravet fanns inte när grillningen
kördes. Snittet ska därför **omprövas**, inte kvitteras.

## VAR VI ÄR — vägen till nytt arbetssätt och tillbaka till appen

**Denna sektion äger ORDNINGEN och ingenting annat.** Varje rad bär steg, ID och
pekare — aldrig beskrivning, aldrig status. Detaljen bor i spåren nedan; status
i registren (backlog-CLI:t, `threads/README.md`, git). **Säger en rad här något
som en annan sektion också säger är raden fel, inte den andra.** Regeln finns
för att raderna annars driftar — det var precis felet auditen 2026-07-28 rättade
på tolv ställen.

Kartan skrevs 2026-07-28 på Marcus fråga *"måla ut hela vägen fram till att vi
kan börja jobba med appen igen"*. Den ersätter den tidigare ordningsraden, som
bara täckte Spår A. **Skälet att den behövdes:** hela filen lästes samma dag och
en väg byggdes ändå som tappade tre poster (`TASK-36.8`, Spår B, A2:9). Spåren är
tematiska; sekvensen över spårgränserna fanns ingenstans.

| # | Steg | Bärare | Pekare |
|---|---|---|---|
| **1** | Signalen går att lita på | `TASK-65` `66` `64` `63` `69` · `TASK-72` · `TASK-74` · `TASK-71` · agent-namnet · `TASK-36.8` | § Fynd-kedjans ordning · § A4 · § A5 |
| **2** | Skyddsnätet byggs | `TASK-70.2` · `TASK-70.5` | § A7 (A7:4, A7:7) |
| **3** | Flytten och kön — väntetiden faller | `TASK-70.3` · `TASK-70.1` · `TASK-76` · `TASK-70.4` · `TASK-75` | § A7 (A7:5, A7:3, A7:6, A7:10) · § Kort födda i S91 |
| **4** | Landnings-hygien | `TASK-70.6` | § A7 (A7:8) |
| **4b** | Verktygsskulden | A3 ×1 · A3b ×2 · A2:9 | § A3 · § A3b · § A2 |
| **5** | Aktörerna slutar krocka | A2:7 · A2:8 · A2:11 · `TASK-77` · Spår B | § A2 · § Spår B · § Kort födda i S91 |
| **6** | Kvar utanför räckhåll | `T85` våg 3 · `T87` · `TASK-70.7` | § A6 · § A7 (A7:9) |
| **6b** | Skulden betalas | A2:10 → Spår C ×2 · Spår E ×4 | § Spår C · § Spår E · § A2 |
| **7** | Appen | `TASK-53` · `TASK-56` · hållplats-grillningen · `TASK-18.20` · de tre app-besluten · resten | § Spår D · § Kort födda i S91 · § Beslut |

**Invarianter i ordningen** (allt annat är schemaläggning): steg 1 före 2–3, för
att en flaky svit gör post-merge-larmen otrovärdiga · A7:4 före A7:5–6, kodad som
dep · **A2:10 före Spår C:s konsolidering**, kortet säger det självt ·
`TASK-64` och `TASK-63` tas under egen hand respektive med pilot, se korten.

**SCHEMALÄGGNING, inte invariant — `TASK-70.1` efter `TASK-70.3`.** Raden stod
till 2026-07-29 under Invarianter. Den flyttades hit av auditen samma dag:
kortet har **inga deps** och säger uttryckligen *"kan tas när som helst"*, så att
kalla ordningen invariant är att påstå en bindning registret inte bär — och
rad 31 säger att registret vinner. Skälet är starkt men är ett val: efter `70.3`
är mutex-dubbleringen avväpnad utan en rad villkorings-kod, och `70.1` är det
enda kortet i spåret som tar bort ett *mänskligt* seriellt moment i stället för
maskintid. Marcus flyttade kortet till steg 3 den 2026-07-29; skälen i sin helhet
bor i **`TASK-70.1`** och i sessionsdok S91 **Del 21.5**.

**Steg 6 stängs inte av denna lista.** `T85` våg 3 väntar på Fas E, `T87` på
Marcus trigger, `TASK-70.7` kan stängas av sitt eget steg 0. De står kvar som
öppna för att en tom lista köpt genom förkastande vore en genväg, inte ett mål.

**Steg 7 är inte hårt blockerat av steg 1–6.** Ordningen är en prioritering:
app-arbetet fungerar redan, det är bara dyrt (7,4 min per kod-PR) och signalen
går inte att lita på. Vi gör verktyget vasst innan vi använder det hårt.

**STEG 2–4 OCH STEG 5 ÄR TVÅ HALVOR AV SAMMA MÅL — och A7 ensamt stänger det
inte.** Konsoliderat 2026-07-28 på Marcus fråga *"när vi har genomfört alla
A7-punkter, kan vi jobba parallellt med subagenter utan att CI/grindvakterna
stoppar oss?"* Svaret är **delvis**: A7 tar bort väntan på MASKINEN, A2:7
krockarna mellan AKTÖRERNA. Målbilden — *människan väntar aldrig sysslolös* —
kräver båda. **Vad som bevisligen står kvar efter A7, och vad punkterna 8 och 9
faktiskt bär, står i § A2 punkt 7–9. Räkna inte axlarna härifrån.**

> **Bantad 2026-07-29 av auditen.** Sektionen bar ~48 rader sakargumentation som
> duplicerade § A2, § A3, § A5 och ADR-080 — och **två av auditens sakfel satt
> just i den duplicerade prosan**: en felräkning av A2:7:s axlar (två olika
> femtal, inget belagt) och ett påstående att den seriella granskningen är
> "punkt 9", när punkt 9 är push-kadensens hemvist och granskningen bärs internt
> av punkt 8. Regeln på rad 65–66 blev därmed empiriskt bekräftad en gång till.
> Argumenten är inte borttagna — de bor i sina sektioner, som raderna nedan
> pekar på:
>
> - **Varför A3 var kritiska vägen** (projektionen 3,8 mot utfallet 1,49, och
>   varför avvikelsen inte bortförklaras) → § A3 och
>   [mätningen](../docs/research/acceptance-utbrytningens-utfall-2026-07-28.md)
> - **Varför `TASK-57`/`TASK-58` sköts in före A5** → § A5 · § Avbockningslogg
> - **Ärlighet om A5:s natur** — hermetisk utbrytning är inte branschens
>   förstahandsval utan en dokumenterad Airtable-kompromiss →
>   [ADR-080](../docs/decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md)
>   § Ärlighet om underlaget
> - **Varför A2:7 medvetet ligger sist** → § A2 punkt 7

## Spår A — CI-/grind-arkitekturen (AKTIVT)

### A1 · Grillningen — AVSLUTAD 2026-07-27 (ADR-080)

Marcus delegerade de fem besluten i klump: *"Du har all kontext samt målbild
från mig för att kunna ta rätt beslut. Kör på det du rekommenderar."* Besluten
är därmed Codes, fattade på delegering — öppet bokfört i ADR-080:s ingress, som
också bär alla fem i sin § Beslut. **Inga öppna poster.**

### A2 · Mekaniseringen (sessionsdok Del 4)

> **Numreringsnot 2026-07-29:** de två första punkterna stod onumrerade medan de
> tre sista hette "Punkt 7/8/9". Kartan pekar per nummer, så det som saknade
> nummer kunde inte bäras — auditen fann att båda saknade bärare i § VAR VI ÄR.
> De har därför fått **A2:10** och **A2:11** (nästa lediga; de behåller sin plats
> i listan — numret är en adress, inte en ordning).

- [ ] **A2:10 ·** `lessons-hub-sync`-skillen (hub) uppdateras med
      konsolideringssteget — kräver plugin-bump (öppen post ur ADR-081).
      **Förkrav för Spår C:s konsolidering** (steg 6b), som annars inte är körbar
- [ ] **A2:11 · Steg 3-beslutet om agent-isolering — VILAR PÅ MÄTNING, ej åsikt.**
      Steg 1 (typade agenter, `#327`) och steg 2 (icke-blockerande mätning,
      `npm run metrics:agents`) är byggda 2026-07-28. **Läs mätningen efter ~en
      vecka skarpt bruk** och avgör då om `permissions.deny` (steg 3) eller en
      korrigerande `updatedInput`-hook (steg 4) behövs — eller om steg 1 räckte.
      Hooken är BEVISAD att fungera (research-passet), så steg 4 är en
      verkställighetsfråga, inte en osäkerhet. Faller mätningen ut som
      "inget läckage" är rätt åtgärd att INTE bygga mer.
- [ ] **Punkt 7 — partitionerings-regeln** (ADR-073 utsträckt till Marcus egna
      parallella sessioner, ej bara agenternas).
      **KONVERGERAR DELVIS med worktree-isoleringen (`#327`, 2026-07-28) — men
      bockas INTE av mot den.** Fil- och gren-partitionen är nu mekanisk
      (`isolation: worktree` i `.claude/agents/`-frontmatter). Kvar står
      nummerserier, delade statusfiler och LÄSANDE agenter (fragmentet
      `partition-maste-omfatta-lasande-agenter`).
      **Och regeln VÄXER i en dimension:** två isolerade agenter som båda
      skriver i `todo.md` ser inte varandra alls — merge-konflikt, eller värre,
      tyst överskrivning vid sekventiell landning. Före isolering delade de
      åtminstone arbetsträd. Isoleringen löser alltså en del av A2:7 och
      förvärrar en annan; det gör regeln mer angelägen, inte mindre.
      **VAD SOM STÅR KVAR EFTER A7 — belagt 2026-07-28, inte antaget:**
      (a) **staging-basen är EN delad resurs** — A7:5 flyttar mutexen ur
      PR-grinden men avvecklar den inte; två parallella spår köar fortfarande,
      bara inte i Marcus väntetid · (b) **`P4`:s 5 req/s-tak är delat per bas**,
      så parallellitet mot samma bas är verkningslös även med perfekt isolering
      (Fas E-fråga via A6/`T85` våg 3 — **inte** en A7-fråga) ·
      (c) **`ACCEPTANCE_DEV_PORT = 5399` + `--strictPort`** ⇒ två agenter kan
      inte köra acceptance-sviten samtidigt · (d) **delade statusfiler** ·
      (e) **läsande agenter**. A7 avlastar alltså EN axel — main, via merge
      queue — och lämnar fem
- [ ] **Punkt 8 — beslutsklassningen: vilka beslut får köa, vilka avbryter
      Marcus.** NY 2026-07-28; saknade hemvist helt. Målbildens punkt 2:
      *"Marcus är enda beslutsfattaren. Sitter han i en annan session när en
      agent behöver ett beslut, så antingen blockerar agenten eller beslutar
      själv."* Det senare gav §19-kollisionen samma dag. **Varken A7 eller A2:7
      rör den** — A7 är maskinlatens, A2:7 är resurskrockar; detta är
      besluts-bandbredd. Hör ihop med målbildens punkt 3: granskning är seriell
      av naturen, och optimeringen där är **förberett material innan Marcus
      sätter sig**. Seed-vägen finns (`npm run seed:review`); vanan att köra den
      före ett granskningsmoment finns inte. **Grillningsklassad ⇒ Marcus
      startar**
- [ ] **Punkt 9 — push-kadensens dom saknar hemvist i levande styrande fil.**
      NY 2026-07-28.
      [Passet](../docs/research/push-kadens-agent-arbetstrad-2026-07-26.md)
      dömde vår kadens **rätt**: en commit per PR och 7–11 PR:er/dag är
      branschrekommendationen med marginal (trunk-based sätter golvet vid en
      integration per dygn; DORA-elit vid högst tre aktiva brancher), och det
      gängse branch→flera-commits→push-flödet är en LÄGRE integrationsfrekvens
      som Fowler klassar som *"semi-integration"*. **Domen bor bara i
      research-doket.** Verifierat 2026-07-28: strängen `push-kadens` finns inte
      i `CONTRIBUTING.md`, `CLAUDE.md`, någon ADR, `lessons.md` eller
      fragmenten. **Slutklämmen rättad 2026-07-29:** posten sade att enda träffen
      utanför passet var en rad i denna fil. `git grep` ger fler — tio rader i
      S91:s sessionsdok, `scripts/check-adr-count.sh` rad 10, `.lycheeignore`
      rad 193 och **tre** rader här. Postens poäng överlever oskadd: ingen av
      dem är en levande STYRANDE fil. Passets
      egen huvudkritik var att regeln är oskriven och därför varken kan
      försvaras när den ifrågasätts eller ärvas av en ny agent; den kritiken
      står ännu obesvarad. Kärnan som ska skrivas ned är **separationen**:
      commit-frekvens är gratis, push-frekvens kostar en full CI-körning plus en
      plats i staging-mutexen. Rätt hemvist är `CONTRIBUTING.md`. **Buntas INTE**
      med A7:7 (`TASK-70.5`) trots samma fil — kort mintas när posten plockas

### A3 · Verktygs-åtgärderna

> **Historiken, förtydligad på Marcus fråga 2026-07-27.** Den ursprungliga
> ordern var *"behåll men INAKTIVERA det byggda, bygg om som proffsen"* — fyra
> egenbyggen där mogna verktyg fanns. **Verktygs-passet rev premissen**, och
> Marcus korrigerade scopet efter belägget: domarna blev BYT · BEHÅLL · BEHÅLL ·
> BEHÅLL-verktyget-LAGA-bristen, med passets egen slutsats ordagrant *"Endast
> punkt 1 är ett äkta försummat verktygsval."* Tabellen och varje doms motivering:
> [verktygsval-fyra-egenbyggen-2026-07-27.md](../docs/research/verktygsval-fyra-egenbyggen-2026-07-27.md)
> § Beslutstabell + § Behåll ändå.

- [ ] **Listparitets-grinden** (dom: LAGA) — ~20 rader skript + policy-fil.
      **Utvidgad räckvidd 2026-07-27:** samma klass gäller **lychee-globarna**,
      som står i BÅDA `ci.yml` och `scripts/check-docs.sh` och hålls synkade för
      hand — ADR-081:s landning ökade duplikationen med en rad
      (`tasks/lessons.d/*.md`). Grinden ska täcka **båda** listparen.
      Passets öppna fråga 3: `PARITY_PATHS` är inte härledd ännu.
      **Ingen kort-hemvist — posten bor här.**
*(De två BEHÅLL-posterna landade 2026-07-29 och är flyttade till
§ Avbockningslogg. De stod kvar som `[x]` i kroppen ett par timmar, vilket bryter
underhållsregeln i ingressen — fångat av samma audit.)*

**A3:s MSW-punkt är stängd** — alla tre skivorna `TASK-54.1`–`54.3` är Done.
*(PRD-kortet `TASK-54` står kvar som `To Do` tills familjen bokförs, precis som
`TASK-59`; status läses ur backlog. Förbehållet tillagt 2026-07-29 — posten sade
tidigare "stängd" platt, vilket motsades av registret.)* Öppen svans: WebSocket-vägen
är oskyddad tills appen får realtime — bärs av **`TASK-56`**, indexerat under
§ Kort födda i S91.

### A3b · Verktygsvals-prövningen som STÅENDE krav (ny 2026-07-27)

Marcus fråga avtäckte att kravet inte var inskrivet någonstans som återkommande
— bara som en engångs-order mot fyra namngivna egenbyggen.

- [ ] **Skriv in kravet durabelt:** innan ett nytt skript/verktyg byggs ska
      verktygsvals-prövningen göras och **utfallet redovisas** — även när domen
      blir "bygg eget". Hör sannolikt i `CONTRIBUTING.md` eller som hub-regel.
- [ ] **Retroaktiv redovisning för `check-lesson-numbers.sh`** (byggd i ADR-081).
      Prövningen gjordes delvis: towncrier, MADR #28 och Rust RFC 0002 lästes,
      och **mönstret** lånades — men ADR:n redovisar inte explicit varför
      towncrier inte togs som *verktyg*. De ärliga skälen (Python-verktyg i ett
      Node-projekt · genererar changelogs vid release, vår `lessons.md` har inga
      releaser · löser inte kollisionen utan undviker nummer helt, vilket ÄR
      mönstret vi lånade) är ett **resonemang, inte en mätning** — och det ska
      stå i ADR-081 hellre än att antas. Amendera ADR:n.

### A4 · Grindarnas form

**Länkgrinden är delad och verkställd** ([ADR-082](../docs/decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md),
PR `#324`). Formen, de nio branschprojekten, de tre empiriska instanserna och de
tre fynden utöver frågan bor i ADR:n och i
[länkgrinds-doket](../docs/research/lankgrindens-form-2026-07-28.md).

**Merge queue-aktiveringen är A7:3** (`TASK-70.1`) — posten står där, inte här.
Villkoret som föddes i A4 följer med: **lager 1 upphävt 2026-07-27, lager 2 står
— aktivera ej före mätning av `concurrency` × `merge_group`.**

### A5 · Efter grillningen

- [ ] `TASK-36.8` — QA-vandringen (manuell testplan, riskanpassad CI)

Acceptance-klassens arton filer, kontraktsvakten och hermetik-självtestet är
landade (`TASK-59`-familjen + `TASK-60`); utfallet med alla siffror står i
[mätningen](../docs/research/acceptance-utbrytningens-utfall-2026-07-28.md).
PRD-kortet `TASK-59` stängs när familjen bokförs — status läses ur backlog.

### A6 · Schemalagt till AT-Max (ADR-063 S81-not) — rör ej nu

- [ ] `T85` våg 3 — staging-per-run-isolering. **Taket för allt annat.**
- [ ] `T87` — visual-grindens aktivering. **Blockeraren är BORTA sedan
      `TASK-55`** (baselines regenererade, granskade, mergade). **Triggern står
      dock kvar** — Marcus-beslut A från S81 flyttas inte av att ett hinder
      försvinner; grinden aktiveras när UI-takten lugnar sig. Distinktionen är
      inskriven i trådens egen post

### A7 · Arbetsflödes-gapet — NYTT 2026-07-28, ur granskningen

Marcus beställde en evidensbaserad granskning av hela agent-/Git-/CI-flödet mot
en målbild för hur starka team arbetar. Fullt utfall:
[granskningen](../docs/research/arbetsflode-granskning-2026-07-28.md).

**Domen var DELVIS — och det som gör posten nödvändig är dess andra hälft:
restlistan som den såg ut FÖRE denna post stängde INTE gapet.** Merge queue låg
som ett obeslutat beslut, "flytta staging ur den kritiska vägen" fanns inte alls,
och den enda staging-posten (`T85` våg 3) är delvis falsifierad — mutexen går
inte att avveckla med per-run-isolering, eftersom `P4`:s 5 req/s-tak är delat per
bas. Posterna nedan är därför NYA, inte omskrivningar av befintliga.

**Kärnan i gapet:** integrationsläget och verifieringsläget är hoptryckta till en
enda obligatorisk PR-grind. Mätt kritisk väg för en kod-PR är **7,4 min**, varav
`Staging (API + E2E)` ensamt bär **375 s** plus mutexkö — det är kodvägen som
bär allt; docs-klassningen fungerar redan.

**Mintat 2026-07-28:** PRD `TASK-70`, med en skiva per post A7:3–A7:8
(`TASK-70.1`–`TASK-70.6`). **Familjens fulla omfattning räknas i backlog, inte
här** — den har redan växt utöver de sex. **A7:1 och A7:2 mintades medvetet
inte** — de togs utan kort och är klara (§ Avbockningslogg). Korten bär kraven;
posterna nedan står kvar som index.

**ORDNINGEN ÄR EN INVARIANT, INTE EN PREFERENS:** **A7:4** (post-merge-lagret) är
förkrav för **A7:5–A7:6**. Flyttas staging ur grinden innan lagret finns tas en
kontroll bort utan att ersättas — precis det målbilden varnar för
(*"eliten tar inte bort kontrollen — de tar bort väntan"*).

> **Rättat 2026-07-29.** Stycket skrev *"steg 4 … steg 5–6"* och avsåg A7:s egen
> numrering, men efter att kartans steg omnumrerades samma dag fanns en andra
> giltig läsning där påståendet är **falskt**: kartans steg 4 är
> landnings-hygien (`TASK-70.6`), som inte är förkrav för någonting. Detta är
> ett tredje stycke av samma klass som § Filens egna fel post 6 bokför — och det
> uppstod av omnumreringen, alltså efter att posten skrevs. Prefixet `A7:` är nu
> explicit så att kollisionen inte kan återuppstå.

- [ ] **A7:3 · Aktivera merge queue.** Ersätter landnings-ordningen
      (`CONTRIBUTING.md` § Landnings-ordningen) med mekanik. Regeln är korrekt
      skriven men är **frivillig efterlevnad** — den brast två gånger under en
      och samma resume 2026-07-28, nedskriven sedan S81. Trycket ökar dessutom:
      fler isolerade agenter ⇒ fler parallella PR:er ⇒ mer `BEHIND`. Berör
      ruleset `main-skydd` (i dag fyra regler, ingen queue). **Ändrar beteende.**
      Underlaget finns redan i
      [merge queue-passet](../docs/research/merge-queue-mot-staging-mutex-2026-07-26.md)
      → **`TASK-70.1`**
- [ ] **A7:5 · Flytta `Staging (API + E2E)` ur PR-grinden till post-merge.**
      −375 s och den globala mutexen ur kritiska vägen. Berör `ci-suite.yml` +
      rulesetets required check. **Ändrar beteende; kräver A7:4.**
      Detta är den enskilt största posten i hela spåret → **`TASK-70.3`**
- [ ] **A7:6 · Flytta `A11y (axe-runner)` till post-merge.** −103 s. Samma
      förkrav som A7:5 → **`TASK-70.4`**
- [ ] **A7:8 · `delete_branch_on_merge: true`.** Ren hygien; grenar ackumuleras i
      dag. Avbrottsfri → **`TASK-70.6`**
- [ ] **A7:9 · Preview-miljö per PR.** Granskningens förbättring **F2** —
      utforskningsläget saknar delad yta. Posten **föll ur åtgärdsplanens åtta
      steg** och fångades av Marcus 2026-07-28 när han läste förbättringslistan
      mot A7. Glidningen var orkestrerarens, inte en avgränsning; raden står här
      just för att en post utanför kartan är en post som tappas — vilket är exakt
      vad som hände. **Medvetet sist och utan dep:** den ändrar inte den kritiska
      vägen, och för en ensam granskare som redan kör lokalt är vinsten
      bekvämlighet snarare än kapacitet. Kortets steg 0 kräver att nyttan prövas
      mot faktiska blockeringar innan något byggs — är svaret noll är den ärliga
      rekommendationen att stänga kortet → **`TASK-70.7`**

**`TASK-70.1` bär TVÅ skäl till `ready-for-human` — etikett-förslaget adresserade
bara det ena.** Fångat 2026-07-28 vid genomläsning av kortet i sin helhet.
**Skäl 1** (AC 6 kräver två samtidigt armerade PR:er, vilket ingen bygg-agent får
göra) faller med noteringen att **orkestreraren** utför. **Skäl 2 rör inte
armering alls och står kvar:** saknas `merge_group`-triggern kan ingen PR landa —
inklusive fixen — så spärren ska sättas av den som kan ta bort den igen utan att
först behöva landa något. **Etiketten ändrad till `ready-for-agent` 2026-07-28**
per Marcus muntliga kvittens i elfte resumen, med skäl 2 bevarat i kortets plan
som utförande-villkor (revert-vägen klar FÖRE aktivering). Precedenten är
`TASK-64`: `ready-for-agent` betyder *kräver inte Marcus omdöme* — inte *ska
spawnas som skiva*.

**Granskningens tredje förbättring, `F3`, är RIVEN — ingen post.**
`allow_update_branch: false` såg inkonsistent ut mot flödets bruk av
`gh pr update-branch`, men fältet reglerar bara uppdatering *"even if it is not
required to be up to date before merging"* och vårt ruleset har `strict` — så det
gäller inte oss. Empiriskt kördes kommandot tre gånger 2026-07-28 med
inställningen `false`, samtliga lyckades. Rivningen är bokförd i
[granskningen](../docs/research/arbetsflode-granskning-2026-07-28.md) § Förbättringar.

- [ ] **A7:10 · Urval i acceptance-sviten.** Var kandidat; **spärren föll
      2026-07-28** när post-merge-lagret mättes skarpt (`TASK-70.2` landad,
      exponeringsfönster 453 s). Marcus kvitterade att posten blir kort.
      `Acceptance (hermetisk)` mäts till **422–433 s** mot Stagings 369–390 s och
      blir **ensam bärare** av PR-grindens kritiska väg efter A7:5. **Dep på
      `TASK-70.3`** — designas urvalet dessförinnan optimeras ett led som inte är
      kritiskt → **`TASK-75`**

**MUTEXEN SERIALISERAR — och kostnaden växer med antalet parallella PR:er.**
Marcus gjorde observationen medan PR `#386` låg i kön; de två körningarna nedan
tillhör dock **andra** grenar (`fix/task-72-…` respektive `test/task-63-…`), inte
`#386` — attributionen rättad 2026-07-29. Siffrorna är oförändrade och
verifierade mot jobb-API:t. Två fulla körningar med identiskt svit-innehåll:

| Körning | Acceptance | Staging | Total |
|---|---|---|---|
| `30400021534` | 21:17:47 → 21:24:49 | 21:18:06 → 21:24:15 | **7,8 min** |
| `30400640305` | 21:26:40 → 21:33:46 | **21:39:22** → 21:46:09 | **20,3 min** |

I den första startade jobben 19 s isär och kördes parallellt; i den andra
startade staging **5 min 36 s efter** att acceptance var klar, köande i
`staging-tests`. Hela skillnaden är kö. **Vinsten av A7:5 är därför inte bara de
369–390 s jobbet tar, utan att kritiska vägen slutar VÄXA med antalet parallella
PR:er** — den egenskap ett flöde med flera samtidiga agenter behöver mest, och
den syns inte i en mätning av jobbtider. Noterat i `TASK-70.3`.

**Förbehållet står kvar:** acceptance blir ensam bärare efter flytten, så taket
landar kring 7 min även efteråt. `TASK-75` är det som sänker det.

**Bekräftat starkt — rör inte i detta spår:** main-skyddet (tom bypass-lista,
`strict` required check) · riskklassningen D0/D1/dedup · fail-closed-aggregatorn
med `gate-proof.yml`-beviset · nattnätets larmkedja · worktree-isoleringen ·
acceptance-klassens utbrytning ur mutexen.

## Spår B — Instruktionsleveransen (`T100`)

Åtgärd 1–2 och steg 3 är landade (se § Avbockningslogg); tråden bär hela
diagnosen.

- [ ] Steg 4 — `IDENTITET.md`-destillatet. **Marcus-beslut.** Vad kärnan är kan
      bara han avgöra
- [ ] Hooken täcker CLAUDE.md-lagret men **inte** memory-lagret — `MEMORY.md`
      levererades utan att logga en rad (nytt fynd 2026-07-27)

## Spår C — Lesson-skulden (AVBLOCKERAD 2026-07-27 av ADR-081)

**Vägen är öppen:** skriv varje kandidat som nummerlöst fragment i
`tasks/lessons.d/`, konsolidera sedan. Nästa lediga nummer och antalet
nummerlösa fragment ägs av `tasks/lessons.md` respektive katalogen.
`npm run check:docs` rapporterar fragment-antalet exakt, men det andra talet är
**antal unika poster — inte nästa lediga nummer** (de sammanfaller bara vid
kontinuerlig numrering). Rättat 2026-07-29; läs nästa lediga ur filen. **Summera inte tre
källor i förväg; de räknar olika.** Skörden 2026-07-27 landade sina fragment
(§ Avbockningslogg); utfallet per källa står i sessionsdok Del 11.

- [ ] Hub-lyftet `L284–L359`
- [ ] **Konsolideringen** — fragmenten flyttas in i `tasks/lessons.md` med
      nummer från nästa lediga. Kräver `lessons-hub-sync`-skillens
      konsolideringssteg (öppen post i A2)

### STOPP — en kandidat kunde inte beläggas

Två kandidater bokfördes i PAUSLÄGE **enbart som stikkord**; sökningen var
uttömmande (sessionsdok Del 11 § 11.4) och de skrevs **inte** på gissning — det
vore att uppfinna empiri. **AVGJORT 2026-07-27.** Marcus: *"Jag minns inget om
de obelagda kandidaterna, gör inte du det heller så får du väl låta dem
hänga."* De **hänger som registrerad post** — inte förkastade, inte skrivna,
och posten står kvar som sitt eget kvitto på ADR-053:s *registrera, förkasta
aldrig tyst.*

**Den ena återuppstod samma dag — genom att felet begicks igen** (MD028, exakt
vad stikkordet syftade på; fragmentet
`blockquote-stapling-separeras-med-kolon-inte-tom-rad.md` bär den, sessionsdok
Del 11 § 11.6). **Kvar hängande: endast *"autofix förvärrar en
falsk-positiv"*.** Det gör bokföringen till sin egen empiri: en kandidat utan
nedskriven empiri kostar att den måste återupptäckas genom att felet upprepas.

## Spår D — App-arbetet (efter Spår A)

- [ ] **Fem facit-lösa ytor genom full kedja** (premiss 2). Referens:
      eventsidan tog 20 skivor + sex review-iterationer
- [ ] Hållplats-modellen — åtta öppna frågor, ska grillas. Rek. alternativ C
      (hållplats som etikett)
- [ ] `TASK-18.20` — enda öppna skivan i event-familjen. **Blockeraren rättad
      2026-07-29:** posten sade "blockerad av hållplats-frågan", men kortet
      nämner hållplats med **noll** träffar och dess dep (`TASK-48`) är Done.
      Den faktiska spärren är kortets egen rubrik *"VÄNTAR PÅ FYRA
      MARCUS-BESLUT"*: inline-scroll på Bekräftade · vilken uppsättning
      batch-handlingar registret bär · Åtgärds-radernas allt-eller-inget-form ·
      vilka §19-intents de nya handlingarna bär. Felet skickade en läsare att
      driva hållplats-grillningen för att avblockera fel sak
- [ ] Eventinfo saknar motor — krysset skriver två fält ingen kod läser.
      **Kort ej skapat** — posten bor därför här
- [ ] **To Do-ryggsäcken i backlog.** Volym och prioritet ägs av backlog-CLI:t
      (`npx backlog task list --plain`) och räknas där, aldrig här — den
      räkningen driftade tidigare i denna fil
- [ ] **Färgsystemets migrering ligger parkerad i S92** (egen session, eget dok,
      `lifecycle: paused`). Grunden är landad och **additiv**; **migreringen
      ÄNDRAR appens utseende** och har egna steg där ett kräver Marcus-beslut.
      Noteras här enbart så att Spår D:s app-arbete inte planeras som om
      färgsystemet vore orört — arbetet ägs av S92, inte av denna lista

## Spår E — Hygien och skuld

- [ ] **Grenskulden** — mergade fjärrgrenar på origin **och** lokala grenar,
      samma klass men egen städning vardera. Mätt 2026-07-29: **263 fjärr**,
      **191 lokala** (2026-07-28 var talen 206/128 — **+28 % resp. +49 % på ett
      dygn**; skulden växer snabbare än den städas). **Ingen kort-hemvist — posten bor här;** siffrorna är en
      mätning med datum, inte ett register att kopiera
- [ ] `save-segment`-läckan — `app-segment-test+<uuid>` saknar target i
      `.purge-staging-policy.json`, städas aldrig
- [ ] `ZZ-GRANSKNING-S91` lever i staging (ej självstädande):
      `npm run seed:review:clean -- --ort ZZ-GRANSKNING-S91`.
      Verifierat 2026-07-27: `.purge-staging-policy.json` nämner den inte
- [ ] `person-detail` kontra `TASK-52` — orsakskedjan ej verifierad

## Kort födda i S91 — utanför spåren ovan

Registrerade som backlog-kort. **Här bara som index — status, plan och
acceptanskriterier bor på korten.** Ordningen för fynd-kedjan står i
§ Fynd-kedjans ordning.

- [ ] **`TASK-53`** — 429-backoffen väntar 1 s där Airtable kräver 30 s. Enda
      posten i S91 som är en defekt i **produktionskod**
- [ ] **`TASK-56`** — WebSocket-vägen går förbi hermetik-vakten. Latent tills
      appen får realtime; den enda kvarvarande vägen ut ur fixturvärlden
- [ ] **`TASK-63`** — fixturraderna saknar kompileringstidsbindning till
      zod-schemat. **Bredast av fynd-kedjan; kräver pilot på EN fil först**
- [ ] **`TASK-69`** — kontraktsvakten prövar bara happy-path; felkontrakten
      404 och 400 är osynliga. Fynd-kedjans position 2, förkravet `TASK-68` är
      uppfyllt. **Saknade hemvist här till 2026-07-29** trots att fem av sex
      syskon stod uppräknade
- [ ] **`TASK-72`** — CI-vakten kan följa fel workflow och rapportera GRÖNT utan
      att ha sett CI-körningen. Rör signalens trovärdighet direkt. **Saknade
      hemvist till 2026-07-29** — fanns bara som text i en avbockningsloggrad
- [ ] **`TASK-74`** — klass B-flakigheten är bredare än `TASK-64` antog: sju
      tester, minst två mekanismer, ingen med klass A:s kodform. **Detta är
      RESTEN av `TASK-64`**, som bara stängdes för klass A — alltså kärnan i
      steg 1. Saknade hemvist till 2026-07-29. Spärr: kontrollerad last måste
      etableras FÖRE mätning, annars mäts maskinen och inte testerna
- [ ] **`TASK-76`** — purge-jobbet är inte idempotent mot samtidiga körningar:
      TOCTOU mellan `listSentinels()` och `deleteSentinels()` ⇒ 404 på redan
      raderad post ⇒ falskt rött. **Funnen 2026-07-29 av `TASK-70.3`:s egna
      mät-PR:er** (`#390` röd utan att något i diffen var fel); **tre
      observationer**, i varje par faller den som DELETE:ar sist. Blir vanligare
      i exakt takt med att parallelliteten ökar — alltså med A7:s målbild.
      **Och dyrare efter `TASK-70.3`:** när post-merge blir primär staging-bärare
      ger racet en röd post-merge, alltså ett tilldelat ärende med
      revert-förslag på ett träd som redan ligger i `main` — observation 3 är
      det fallet, redan inträffat. **Tas i nära anslutning till `70.3`**, ej
      senare våg. Premissen `P26`/`P27` löses INTE här; kortet gör purge robust
      under den
- [ ] **`TASK-77`** — `staging-tests`-mutexen binder bara CI; lokala
      `test:api:staging` / `test:e2e:staging` / `vakt:kontrakt` går rakt förbi
      den mot samma bas. Verifierat 2026-07-29: strängen finns **inte** i
      `package.json` eller `scripts/*.mjs` — ingen mekanism, bara en outtalad
      konvention. **Funnen 2026-07-29 av `TASK-70.3`:s agent, som bröt regeln
      TVÅ gånger under ETT pass — andra gången med full kännedom om den.** Det
      är kortets bärande argument: en regel som inte efterlevs av den som känner
      till den saknar mekanism (samma slutsatsform som gjorde merge queue till
      svaret på landnings-ordningen). Angränsar `TASK-76` men är en ANNAN
      mekanism — `76` är CI mot CI, detta är CI mot lokalt, och `76`:s fix gör
      inte detta ofarligt

## Fynd-kedjans ordning — klassad och sekvenserad 2026-07-28

Marcus order: *"Relaterar task-63-66 och task-69 till det arbete vi gör här så
ska alla klassas och tas itu med, i rätt ordning."*

**Relationen är bekräftad, inte antagen.** Fem av de sex korten är direkta fynd
ur `TASK-59.8`:s QA-vandring av acceptance-klassen; det sjätte (`TASK-69`) är
nästa lager i den kontraktsdrifts-kedja som `TASK-68` just stängde lager 1 av.
Alla sex rör samma yta — acceptance-klassen och de grindar som ska bevaka den.

**Klassningen:** samtliga fem oetiketterade kort (`63`, `64`, `65`, `66`, `69`)
fick **`ready-for-agent`**. Etikett-rymden i repot är binär; fördelningen räknas
i backlog vid behov och citeras inte här. Kriteriet är att posten kräver
**Marcus** omdöme, inte dess dokumentklass — inget av de fem gör det. Till
skillnad från `TASK-56`–`58`-klassningen behövde inga AC skrivas: alla fem bar
redan acceptanskriterier.

| # | Kort | Varför här | Dep (kodad) |
|---|---|---|---|
| 1 | **`TASK-62`** | Marcus kvitterade ingång. Mätning FÖRE bygge. Är dessutom mätinstrument för `64` och delar fil med `66` — den blockerar två andra kort och måste därför gå först | — |
| 2 | **`TASK-69`** | Kontraktsdriftens **lager 2**. Förkravet (`TASK-68`) är uppfyllt. Egen yta (`kontraktsjamforelse.ts`) — stör inget annat kort | `TASK-68` ✓ |
| 3 | **`TASK-65`** | Kirurgisk och räknad ur källan (9800 ms konstruerat värsta fall mot 12 s tak). Tar bort en **känd** marginal-brist ur brusrymden innan `64` mäter bruset | — |
| 4 | **`TASK-66`** | Skriver ner tidsregeln i sömmen. Väntar på `62` (samma fil, `acceptance-bas.ts`) och läses bäst efter `65` — då är räkningen tillämpad, inte bara beskriven | `TASK-62` |
| 5 | **`TASK-64`** | Diagnosen. Vill ha `62`:s vakt som instrument och `65`:s kända brist undanröjd först. **Allvarligast av de fem** — rör signalens trovärdighet | `TASK-62` |
| 6 | **`TASK-63`** | Bredast (18 filer), kräver pilot på EN fil först. Sist för att inte konflikta med `64`/`65`, som rör samma filer på andra rader | — |

**Deps är kodade bara där beroendet är ÄKTA.** `66→62` (fil-kollision) och
`64→62` (mätinstrument) är tekniska låsningar; `69→68` är förkravet kortet
själv skriver ut. `63` och `65` fick **ingen** dep — deras plats i ordningen är
schemaläggning, inte beroende, och en falsk dep hade blivit skuld som ser ut
som en invariant.

**`TASK-64` är klassad `ready-for-agent` men ska INTE spawnas som skiva** —
den tas som diagnos under orkestrerarens egen hand, eftersom orsaken inte är
lokaliserad och en bygg-agent på ett odiagnostiserat race bygger fel sak.
Anvisningen är skriven i kortets egen plan, inte bara här, så den följer med
kortet när det plockas isolerat. Samma sak för `63`:s pilot-krav.

**Två förkastanden registrerade EXPLICIT** (ADR-053: registrera, förkasta aldrig
tyst — mekanismen står här även när räkningen bor någon annanstans):

1. **Vaktens *"Menade du"*-träff** pekade på `get-person` när `get-persons`
   saknades — en ÄKTA annan EF, inte en felstavning. Tröskeln är lånad och
   källbelagd; utvecklaren har full information. Räkningen: sessionsdok Del 17
   § Fynd.
2. **Uppdelning av `api-staging` efter data-beroende** (Marcus fråga 2026-07-28:
   *"Har vi sett till att vi ENDAST gör det när vi måste?"*). Observationen är
   korrekt i sak — minst 23 tester avvisas av EF:en innan Airtable nås — men
   **förkastas på proportion:** api-steget är ~12 % av ett staging-jobb, så en
   uppdelning sparar sekunder och kostar en permanent klassgräns att underhålla.
   Över-engineering-vakten skär den. Räkningen: sessionsdok Del 18.
   **Den riktiga vägen är en annan:** mutexen avvecklas inte genom att flytta
   fler tester ut ur den, utan genom att göra den onödig — se
   [`T85` § Våg 3](threads/T85-riskanpassad-ci.md), där riktningen dessutom
   korrigerades 2026-07-28. **Rör inte posten igen** utan att först läsa `P4`:s
   andra manifestation: 5 req/s-taket är delat per bas, så parallellitet är
   verkningslös även med perfekt isolering. Noteras just för att den annars
   återkommer som en "ny idé" — 23 tester bakom en mutex de inte behöver ser
   fel ut för den som inte räknat andelen.

## Beslut som väntar på Marcus

- [ ] `--mm-btn-*` eller `--mm-button-*`? Nio tokens i `semantic.css` mot 48
      `--mm-button-*` i `components.css`. **RÄTTAT 2026-07-29 — de nio är INTE
      oanvända**, vilket posten påstod till i dag och som ramade in beslutet som
      en gratis strykning. Samtliga nio konsumeras: **sex** via `components.css`
      (15 `var(--mm-btn-*)`-referenser, t.ex. rad 20
      `--mm-button-primary-bg: var(--mm-btn-primary-bg);`) och **tre** via
      `src/components/hem/CTA.tsx` rad 20, som använder Tailwind-4-syntaxen
      `bg-(--mm-btn-cta-bg)` i stället för `var()` — därför syns de inte i en
      naiv `var(`-sökning. Ett byte går alltså inte gratis; `components.css` och
      `CTA.tsx` följer med. **UNDERLAG FINNS NU:** den parallella sessionen S92
      mätte frågan under sitt färgsystem-arbete (sessionsdok S92, sök
      `--mm-btn-`) — hämta deras räkning innan frågan besvaras, gör inte om
      mätningen
- [ ] **Två namn-/strukturfrågor ur `TASK-59.8`:s QA-vandring 2026-07-28.**
      Lyfta som beslut, INTE mintade som kort: båda är omdöpningar som rör många
      importrader, alltså scope-beslut och inte QA-fynd. **Posterna bor därför
      här — inget kort bär dem.** **(a) Dubbla `support`-kataloger:**
      `tests/support/fixturvarld/` mot `tests/acceptance/support/`, som skiljs
      av ett punkttecken i importraden. **(b) Ordet "acceptance" självt:** i
      ATDD-/Fowler-traditionen betyder det normalt *kör mot ett riktigt deployat
      system* — motsatsen till vad vår klass gör. Empirin bakom båda står i
      sessionsdok Del 17. **Motargument som hör till beslutet:** namnet är redan
      inskrivet i ADR-080, `CONTRIBUTING.md`, CI-jobbets namn och
      klassnings-mekaniken i `ci.yml` — ett byte är inte gratis
- [ ] **Review-pilotens kadens** (T86-friktionen) — passet uteblev även på
      `TASK-54.2`, märkt i pilotloggen. Beslutskriterierna räknar skivor, inte
      pass, så varje omärkt uteblivet pass underskattar träffkvoten
- [ ] `IDENTITET.md`-destillatet (= Spår B steg 4)

> **Merge queue-posten STRUKEN 2026-07-29 — den var inte längre Marcus beslut.**
> Posten stod som öppet Marcus-beslut med motiveringen *"Beslutet är ditt
> eftersom det ändrar beteende i varje landning"*, men motsades av § A7, där
> kortet fick `ready-for-agent` (= *kräver inte Marcus omdöme*) redan
> 2026-07-28. Marcus rev den kvarvarande tvetydigheten i klartext 2026-07-29:
> *"jag bestämmer inte när 70.1 skall utföras. Det är ett missförstånd. DU är
> senior här."* Så länge raden stod kvar blockerades hela steg 3 på ett beslut
> som inte fanns. Allt sakinnehåll bor i **`TASK-70.1`**; utförande-formen
> (orkestrerarens hand, revert-vägen prövad FÖRE aktivering) är ett
> utförande-villkor i kortets plan, inte ett beslut som väntar här.

**Klartecken räcker — inga beslut:** komponent-token-grinden (R1:s dom C) ·
agentdefinitioner i `.claude/agents/` (plugin-agenter stödjer ej `hooks`) ·
kontext-statuslinjen. *(Raden bar till 2026-07-29 även "de 18 återstående
snitten". Struken: den motsäger § Beslutade premisser, där konsekvensen av
premiss 4 + 5 är att **snittet ska omprövas, inte kvitteras** — och "klartecken"
är just kvittering. Vilka de 18 skulle vara går dessutom inte att belägga ur
filen; rad 298 och avbockningsloggen säger båda att arton filer är LANDADE.)*

## Filens egna fel — bokförda, inte bortstädade

En arbetsyta som döljer sina egna fel ljuger även när varje enskild rad stämmer.
Dessa stod i sina respektive poster och följer med hit när posterna
bantades bort. De raderas inte.

1. **A3-posten föreskrev fel värde på `skipAssetRequests`** eftersom den
   sammanfattade ett pass i stället för att läsa källan. *"Felet var mitt."*
   Slutvärdet på disk är `false`; resan bor i ADR-080 och `TASK-54.2`.
   Fragmentet `uppdrag-kan-peka-pa-fel-adress-verifiera-mot-koden.md`
   `[UNIVERSAL]` bär klassen vidare.
2. **A4-postens underlag bar rubriken *"MOTIVERINGEN NEDAN VAR FEL OCH ÄR
   KORRIGERAD"*.** Påståendet *"17 av 19 undantag blir onödiga"* höll inte:
   `.lycheeignore` bär 22 mönster, 21 externa, 1 internt — och **noll** blir
   onödiga i repot om nattrapporten ska vara läsbar. Uppdelningen tar bort
   PR-blockeringen, inte listan. Rättelsen står i ADR-082 § Konsekvenser.
3. **`CONTRIBUTING.md`-posten stod kvar som öppen i tre dygn efter att den
   stängts** — skivan som stängde den (`TASK-59.3`) var inte den som ägde raden.
   Fångat vid dok-genomgången 2026-07-28. Värt att veta att restlistans poster
   kan stängas av arbete på annat håll.
4. **Klassnings-posten påstod att `ready-for-human` *"uteslutande bär QA-planer
   och PRD:er"*.** Fel åt båda håll: `TASK-36.7` är en CI-skiva som bär
   etiketten, och PRD-korten `TASK-8`/`TASK-9` bär inga alls. Det gemensamma är
   att posten kräver Marcus omdöme, inte dess dokumentklass.

5. **Ordningsraden kunde inte bära sin egen väg.** Hela filen lästes 2026-07-28
   och en väg till app-arbetet byggdes ändå som tappade tre poster
   (`TASK-36.8`, Spår B, A2:9 — den sista mintad samma dag av samma läsare).
   Orsaken var strukturell, inte slarv: spåren A–E är tematiska, och § VAR VI ÄR
   täckte bara Spår A. Åtgärdat samma dag genom att ordningsraden gjordes
   fullständig — det är den nuvarande § VAR VI ÄR.
   **ÅTERINTRÄFFADE, och posten var därför fel bokförd som stängd (2026-07-29).**
   Auditen fann **nio** öppna poster utan bärare i kartan — bland dem `TASK-69`,
   `TASK-72` och `TASK-74`, alla mintade 2026-07-28, samt `TASK-76` som lades in
   2026-07-29 under en sektion kartan bara når via steg 7 trots att kortet självt
   kräver steg 3. Strukturell orsak, nu åtgärdad: § A2:s två första punkter
   saknade nummer medan de tre sista hette "punkt 7/8/9" — och kartan pekar per
   nummer, så det som inte hade nummer kunde inte bäras. De heter nu A2:10 och
   A2:11. **Felklassen är alltså inte stängd av en engångsåtgärd; den måste
   fångas av ett återkommande pass.**
6. **Två stycken bar referenser till en stegnumrering som inte längre finns.**
   När kartan ersatte den gamla ordningsraden pekade de på "steg 2". Det ena
   gick att belägga ur styckets egen text (`TASK-57`/`TASK-58`) och skrevs om.
   Det andra — *"ett problem steg 2 krymper"* i A2:7-motiveringen — går **inte**
   att belägga ur filen; formuleringen står därför kvar med referensen märkt som
   otydlig i stället för att gissas rätt. En gissning här hade skrivit bort ett
   skäl ingen längre kan rekonstruera.

**Och felklassen som gav filen sin nuvarande form:** auditen 2026-07-28 fann
tolv statusfel, samtliga kopior av register som redan hade rätt svar. Det är
skälet till att kort-, tråd- och landningsstatus nu bara pekas ut härifrån.

## Avbockningslogg

| Datum | Post | Landning |
|---|---|---|
| 2026-07-27 | Tillstånds-återställningen (resume 3) | `0cfbc9f` |
| 2026-07-27 | Merge queue-falsifieringen bokförd | `07d766d` |
| 2026-07-27 | Ägarbytets städning (länkar · origin · marketplace) | `49c615a` |
| 2026-07-27 | Spår B åtgärd 1 (`InstructionsLoaded`-hooken) + åtgärd 2 (avvecklingen, **ADR-079**) + steg 3 (mekanisk verifiering grön på alla tre kontroller) | `#262` · `#263` · mätning |
| 2026-07-27 | **A1 grillningen avslutad — ADR-080 mintad.** Alla fem besluten (snittet står · portabilitetsgränsen = 90/10 · vakten i avbrytande läge · klassnamnet **acceptance** · ADR:n mintad) bärs av ADR-080 § Beslut | `#272` |
| 2026-07-27 | **A2:6 nummer-tilldelningen löst — ADR-081; Spår C avblockerat.** Första fragmentet landat i samma PR som byggde mekanismen | `#273` |
| 2026-07-27 | Tillstånds-återställningen (resume 4) + **Spår C: 14 fragment** (Del 8.8 · andra pausens carry · `.claude/**`-luckan · kandidaten född vid skörden) | `8a79987` · `#274` |
| 2026-07-27 | **Airtable-kostnaden dokumenterad** — ADR-063 § S91-not + `airtable-constraints.md` sektion F (P26/P27 + P4-utvidgning) | `bc888d3` · `#275` |
| 2026-07-27 | `CLAUDE.md`-pekare till constraints-katalogen + **`TASK-53`** för 429-backoffen | `8006d54` · `#276` |
| 2026-07-27 | **A3 speccat** — `TASK-54` + två skivor + QA; restlistans `skipAssetRequests`-krav rättat | `920a3ef` · `#277` |
| 2026-07-27 | **`TASK-54.1` levererad** — MSW bär API-lagret; ekvivalens pixel-bevisad A/B | `56e9064` · `#278` |
| 2026-07-27 | `TASK-54.1` stängd (Done efter CI) + **`TASK-55`** registrerat | `34a3ea6` · `#279` |
| 2026-07-27 | **T86-friktionen bokförd** + 54.1:s pilotrad + review-fixarna — **ADR-080 § Konsekvenser riven med öppen rättelse-not** (samma `skipAssetRequests`-felläsning som restlistan bar) | `c5c1dc0` · `#280` |
| 2026-07-27 | Femte pausen — lifecycle paused, handoff, todo-kadens | `4b087bc` · `#281` |
| 2026-07-27 | Tillstånds-återställningen (resume 5) | `85b7c07` · `#282` |
| 2026-07-27 | **`TASK-54.2` levererad** — vakten till `onUnhandledRequest`; `skipAssetRequests` VÄND till `false` efter källkodsmätning; sid-vakt + EF-catch-all rivna; tvåsidigt rött-först | `a1c78f9` · `#283` |
| 2026-07-27 | `TASK-54.2` stängd + **`TASK-56`** (WS-vägen) + fragment `*/`-i-blockkommentar | `d681f3e` · `#284` |
| 2026-07-27 | **`TASK-54.3` QA körd av Code på Marcus delegering** — sex steg; **`TASK-57`** + **`TASK-58`** registrerade. **A3:s MSW-punkt därmed stängd** | `b31fc3b` · `#286` |
| 2026-07-27 | **Baselines regenererade** — 6 bilder, Marcus-granskade och godkända; bevis-dispatch `30297097792` loggar *"Inga baseline-ändringar"* | `37e638d` · `#287` |
| 2026-07-27 | **`TASK-55` löst** + Actions-flaggan satt enterprise→org→repo (låset satt på enterprise, ej repo); workflowens filhuvud faktarättat; fragment *låst tre nivåer upp* | `ed984c1` · `#288` |
| 2026-07-27 | **Sjätte pausen** — A3 stängd, lifecycle paused, VAR VI ÄR omskriven, `T87` avblockerad | `8ee8b34` · `#289` |
| 2026-07-27 | Restlistan genomgången post för post mot resumens faktiska utfall (Marcus-order) | `c1ea2e3` · `#290` |
| 2026-07-27 | Tillstånds-återställningen (resume 7) + **klassningen av `TASK-56`/`57`/`58`** — alla `ready-for-agent`, 13 AC skrivna mot läst kod; klassningen avtäckte att alla befintliga `ready-for-agent`-kort har AC | `a478d1b` · `#291` |
| 2026-07-27 | **`TASK-58` DONE** — överskuggningsmönstret `network.use()` dokumenterat i fixturmodulen; precedens + isolering lästa ur biblioteket, exemplet kört som kastbart bevis | `6910d02` · `#292` |
| 2026-07-27 | **`TASK-57` DONE** — vakten lyfter närmaste träff (Levenshtein, TypeScripts 0,4-tröskel) och skiljer extern adress från omockad EF; **`T101`** registrerad | `59b8391` · `187d4e8` · `#293` |
| 2026-07-27 | **Byggplanen v1.14** — Fas E-horisonten omankrad till *appens sidor klara*, premiss 1 + 2 som överordnat förkrav i Fas 6:s closeout, premiss 5 inskriven; Fas 7-beroendet lämnat OFÖRÄNDRAT och öppet noterat som ej avgjort. **ADR-080:s `skipAssetRequests`-omprövning fick sitt utfall infört** | `277174e` · `ff179d8` · `#294` |
| 2026-07-27 | **A5 SPECCAT — `TASK-59`** (PRD-kort, 14 användarberättelser, 9 DoD). Klassningen omräknad ur rådata → **18/14**, ADR-080 noterad; skarv-valet belagt mot MSW:s och Playwrights primärkällor | `b881c63` · `#295` |
| 2026-07-27 | **A5 NEDBRUTET — sju skivor + QA** (`TASK-59.1`–`59.8`), vågorna delade efter YTA ej antal; linjär beroendekedja, Marcus delegerade uppdelningen | `b881c63` · `#296` |
| 2026-07-27 | **`TASK-59.1` DONE** — fixturvärlden till delad hemvist `tests/support/fixturvarld/`; 24 baselines md5-oförändrade | `d52d6c8` · `#297` |
| 2026-07-27 | **ci-wait härdad** — `--commit` kräver full SHA; fällde direkt två självtest-fall som anropat förkortat | `eaebec6` · `#298` |
| 2026-07-27 | **`TASK-59.2` DONE — kontraktsvakten i drift.** Larmkedjan bevisad skarpt (dispatch `30309427472`: `Kontraktsvakt: success` + `Larm: success`, ärende `#300` stängt med motivering). **Vakten larmade på RIKTIG drift vid första körningen** — 11 fält som `get-registrations` skickar i 43/43 poster saknades i fixturen. Tre enabling-detourer krävdes: fixturen ikapp · `L264`-tidszonsfixen · `danger.systems`-undantaget | `95157a5` · `4644041` · `8728e1f` · `#299` |
| 2026-07-27 | **`TASK-59.3` DONE — acceptance-klassen LEVER.** Eget projekt + mutexfritt jobb (placering, ej flagga) + `mergeTests`-komponerad söm; Hem-ytans två filer flyttade med tvåsidigt bevis (`hem` 28 fällda / 56 vakt-fel när mockarna neutraliserades). **`CONTRIBUTING.md` § Acceptance-klassen inskriven i samma skiva** (`109f846`). **`T102`** + **`T103`** registrerade | `#302` |
| 2026-07-28 | **`TASK-59.4` DONE — Personer-ytan** (3 filer, e2e 30→27). Tvåsidigt bevis per fil; agenten fann ett hål i sin EGEN bevismetod (vakten fäller på `get-person` innan `update-record` nås) och körde ett separat skrivvägs-prov. **`T104`** registrerad. Enabling-detour: död pekare i sessionsdok S23 efter flytten | `#304` |
| 2026-07-28 | **Sjunde pausen** — `lifecycle: paused`, Del 14 (orkestreringen), HANDOFF, todo-kadens | `#306` |
| 2026-07-28 | Restlistan ikapp pausen — steg 3 → PÅGÅR, A5-punkterna avbockade, `T104`-ordningen + A4 skärpta i § Beslut | `767e20e` · `#307` |
| 2026-07-28 | **Åttonde + nionde resumen** — A5:s migrering (`59.5`–`59.7`, alla 18 filer ute), **`TASK-60`** (hermetik-självtestet: `T104` åtgärdad, 51/51 fällda av vakten, kostnaden först felprojicerad och lagad i samma pass) + **`TASK-61`** stängd (`#323`; ärende **`#312`** stängt med åtgärd — permanent anteckning-fixtur, purge-immuniteten prövad mot policyns egna funktioner), **`T105`** stängd i `59.7` (flagg-vakt i teardown, prövad åt båda håll), **ADR-082** (länkgrinden presubmit/postsubmit, tvåsidigt bevisad), worktree-isoleringen mekaniserad till typade agenter | `#308`–`#331` (varav **`#312` är ett ärende**, ej PR), `#333` |
| 2026-07-28 | **Tionde resumen** — `lifecycle: paused → active`, nionde pausens rubrik till historik-form, todo-kadens | `#334` |
| 2026-07-28 | **`TASK-59.8` DONE — QA-vandringen.** Sju steg på Marcus delegering; steg 2 och 4 delegerade till subagenter med genuint färska ögon. Steg 1 gav **AC #3:s positiva gren** som `59.7` inte kunde köra (purge + staging `skipped`, acceptance grön) — **klassningen bekräftad korrekt**. Steg 4:s test blev den äkta ändring `59.7` saknade. **A5-familjen därmed komplett.** Fem fynd → `TASK-62`–`66`; steg 3 och 6 gav inget fynd; ett fynd förkastat explicit | `#335` · `#336` · `#337` |
| 2026-07-28 | **`TASK-67` mintad** ur restlistans steg 4 + `TASK-62` klassad `ready-for-agent`. Ordningsbeslutet (fynden före steg 5; `62` före `64` eftersom vakten sannolikt är diagnosinstrumentet) är Codes, fattat på Marcus delegering: *"Du är senior och vet vad som blir bäst."* | `#338` |
| 2026-07-28 | **`TASK-67` DONE — A2 punkt 5 = VAR VI ÄR steg 4.** Landnings-ordningen kodad i `CONTRIBUTING.md` § Landnings-ordningen med pekare i `CLAUDE.md`, **tillämpad på sin egen landning**; agenten lade till en fjärde form som inte fanns i kortet (`update-branch` aldrig mot arbetande agent). **Konvergerar INTE med worktree-isoleringen** — `BEHIND` är en annan felmekanism | `#339` · `#342` |
| 2026-07-28 | Restlistan ikapp tionde resumen — steg 3 → HELT KLART, steg 4 → `TASK-67`, A2 punkt 5 + `TASK-61` avbockade, fem fynd-kort indexerade, namn-/strukturfrågorna lyfta till § Beslut | `a698ee7` · `#341` |
| 2026-07-28 | **Kontraktsdriften kartlagd** — testerna KAN vara gröna medan en verklig EF svarar annorlunda, och det har hänt två gånger. `TASK-68` + `TASK-69` mintade | `#343` · `#344` · `#348` |
| 2026-07-28 | **`TASK-68` DONE** — kontraktsvakten från **tre till sju** fixturhandlers; grön på alla åtta jobb inkl. staging | `#346` |
| 2026-07-28 | **`TASK-62`:s hypotes FALSIFIERAD av research** (sex ekosystem) — exakt-adress-jämförelse missar stavfelet; branschens form är TVÅ mekanismer. Planen omskriven med fyra steg + mätning FÖRE bygge | `#345` · `#347` |
| 2026-07-28 | **Elfte pausen** — `lifecycle: paused`, Del 18, HANDOFF, todo-kadens | `#349` |
| 2026-07-28 | **Elfte resumen** — tillstånds-återställning + **fynd-kedjan klassad och sekvenserad** (`62`→`69`→`65`→`66`→`64`→`63`, deps kodade bara där de är äkta) | `#350` |
| 2026-07-28 | **`TASK-62`:s mätning körd** — per-fil-aggregering tar **51 → 4** fällningar (92 %). Två överlevare är äkta döda registreringar, två är legitima negativa sensorer | `#351` |
| 2026-07-28 | **Arbetsflödes-granskningen — domen DELVIS.** Restlistan stängde inte gapet; **A7** mintat med åtta poster och ordningen kodad som invariant | `#352` |
| 2026-07-28 | **`TASK-62` DONE** — vakten ombyggd till ivrig + trög, per fil. Kritiska vägen bytte bärare: Acceptance **436 s** mot Stagings 313 s | `#340` · `#353` |
| 2026-07-28 | **`A7:1` KLAR** — nattnätet prövat skarpt efter `TASK-61`-fixen: dispatch `30377576519` **grön på samtliga jobb** (`Kontraktsvakt` 32 s, `Länkkontroll` 20 s), larm-jobbet skippat. Ärende `#332` stängt med åtgärd. **Uppföljningsluckan var den äkta bristen** — inte vakten | dispatch `30377576519` |
| 2026-07-28 | **`A7:2` KLAR** — spawn-loggen mäter **effektiv** isolering (frontmatter-uppslag), inte spawn-parametern; nytt fält `isolation_kalla`, tvåsidigt bevis, egen testsvit wirad i CI. Raderna före rättningen är korrekt historik och lagas inte | `#354` |
| 2026-07-28 | **`TASK-70` mintat** — arbetsflödes-gapets PRD + sex skivor (`70.1`–`70.6`), deps `70.3`/`70.4` → `70.2` + `70.5` | `#355` |
| 2026-07-28 | **Restlistan rättad mot disk** — tio inre motsägelser och tolv statusfel; avbockningsloggen lagad som avlastningsyta; *Senast verifierad mot disk*-raden + regeln att registret vinner vid konflikt införda | `a1d6301` · `#356` |
| 2026-07-28 | **`TASK-66` DONE — tidsdimensionen i sömmen.** Agenten vägrade skriva av kortets `~8–10 s` och härledde talet ur källan, vilket avtäckte att **`TASK-65`:s kort räknade fel**: jittret är konstant 0–100 ms per sleep, inte skalat med delayen ⇒ tak **8200 ms**, ej 9800. Kortets egna fem mätningar bekräftade 8200-modellen | `#364` · `#365` |
| 2026-07-28 | **`TASK-65` DONE — timeout-marginalen mot rättat tak.** 12 → 20 s, räkningen rättad **vid källan** i samma commit. Tvåsidigt bevis: negativkontroll fäller på assertionen efter 21,8 s. **Två av kortets påståenden falsifierade** (marginalen var 3,8 s ej 2,2 s; taket är ingen normalutfall utan kräver tolv höga jitter-drag) | `#368` · `#372` |
| 2026-07-28 | **`TASK-71` byggt** — `.claude/**` docs-klassad OCH täckt av alla tre docs-grindarna, som ett par. **Fyndet under fyndet:** `.claude/**` matchar inte `.claude/.markdownlint.jsonc` — dot-regeln biter en andra gång inuti katalogen, så fixen hade återinfört sitt eget fail-open utan andra posten. AC 1 + 6 utestående: kontrastbeviset kräver en PR som rör enbart `.claude/` | `#366` |
| 2026-07-28 | **Vägkartan in i filen** — ordningsraden gjord fullständig (nio steg), efter att en väg byggts som tappade tre poster trots att hela filen lästs. Formregel: steg, ID och pekare — aldrig beskrivning eller status | `#367` |
| 2026-07-28 | **`TASK-64` steg 0 utfört** — flakigheten mätt till **63 %** (14 av 22 acceptance-jobb i 120 CI-körningar) och orsaken lokaliserad till **tre rader** med mönstret *icke-auto-väntande query + icke-retrying assertion*. `ci-metrics.mjs` kunde inte svara: den räknar jobb-omkörningar, och `retries: 2` döljer flaken inuti ett grönt jobb. Klass B (fokus-testerna) skild ut; `T106`-avgränsningen besvarad | `#369` |
| 2026-07-28 | **`TASK-70.5` DONE — revert-vägen ÖVAD, inte bara beskriven.** Agenten körde git-mekaniken i egen worktree; orkestreraren körde kedjan skarpt mot `main` (no-op `#374`/`ed51b95` → revert `#375`/`894a3bd`). **Tre fall reproducerade mot en riktig landning:** utan `-m` exit 128 · `-m 2` exit 0 med NOLL rader stagade och filen kvar (tyst misslyckande) · `-m 1` träd-identiskt. **Mätt: 118 s till revert-commit, 25 min 16 s till landad revert** — det andra talet är mutex-väntan, inte vägens kostnad | `#370` · `#376` |
| 2026-07-28 | **`TASK-70.2` DONE — post-merge-lagret (A7:4, förkrav för A7:5–6).** Alla åtta AC belagda, sex verifierade EFTER landning (dispatch kräver default-grenen). Självtest `30395621766` gav äkta `failure` i larmets needs, svit SKIPPED, ärende `#378` med korrekt `-m 1`-recept — stängt med motivering. **Exponeringsfönster mätt: 453 s** | `#371` |
| 2026-07-28 | **`TASK-64` DONE för KLASS A.** Mätt med retries AV: **3/8 fällningar före → 0/8 efter** (2,3 % sannolikt under oförändrad rat). AC 2 bekräftad med belägg — lokatorn löste till noll element. **Orkestrerarens föreslagna fix var FEL** och rättades av agenten: `toHaveAttribute(…, /.+/)` är no-op eftersom attributet är satt redan före första `ArrowDown` | `#377` |
| 2026-07-28 | **`TASK-71` DONE + agent-namnet utfört** (`bygg-skiva` → `bygg-agent`, Marcus beslut). **Kontrastbeviset mätt i `#380`**, en diff som rör ENBART `.claude/`: `Test suite` SKIPPED, `Docs link check` SUCCESS. Samma diff hade före skivan dragit hela staging-sviten. Referenserna i egen PR — en fil utanför `.claude/` hade upphävt beviset | `#366` · `#380` · `#381` |
| 2026-07-28 | **Tre kort mintade ur dagens arbete, alla funna av mekanismer byggda för annat.** `TASK-72` (CI-vakten kan följa fel workflow och rapportera grönt utan att ha sett CI — funnen av `70.5`:s agent) · `TASK-73` (post-merge ärver inte klassningen; en 8-raders docs-landning blockerade revert-vägen 25 min — funnen av övningen) · `TASK-74` (klass B är sju tester och minst två mekanismer, inte de tre `TASK-64` listade — funnen av dess egen efter-serie) | `#376` · `#379` |

| 2026-07-29 | Tillstånds-återställningen (resume 13) + **merge queue flyttad till steg 3** — `70.3` → `70.1` → `70.4` → `75`; Marcus rev tillbaka schemaläggningen till Code | `#389` |
| 2026-07-29 | **`TASK-73` DONE — AC-svansen tagen av orkestreraren.** Fyra AC krävde post-merge-körningar på `main` efter merge. Ärvd klassning bevisad **fyra gånger** (`Verifierande svit` skipped) · kod-landning kör full svit (`30402869073`) · **mutex-takers per docs-PR 2 → 0** (`ba3eab1`, en enda `.md`-fil, tog `staging-tests` två gånger) · larmet fäller mot ÄKTA `failure` i needs (`30405347512`, ärende `#392` stängt med motivering) | `#393` |
| 2026-07-29 | **A3:s två BEHÅLL-poster stängda.** `ci-wait.sh`:s filhuvud rättat — terminal-kontrollen var FEL skiljelinje mot `gh` (finns sedan `cli/cli#3962`, 2021); skälet utbytt mot de fem uppgifter som saknar `gh`-yta. `check-docs.sh` bär tri-state-argumentet (sju kandidater prövade). Kvar i A3: **listparitets-grinden** | `#394` |
| 2026-07-29 | **`TASK-76` mintat — purge-racet.** TOCTOU mellan `listSentinels()` och `deleteSentinels()`; 404 på redan raderad sentinel fäller jobbet. Funnen av `TASK-70.3`:s egna mät-PR:er. **Fem observationer + ett kontrastbevis** (purge ensam = grön). Blir DYRARE efter `70.3`: post-merge blir primär staging-bärare, så racet ger då ett tilldelat revert-ärende på ett träd som redan ligger i `main` | `#399` |
| 2026-07-29 | **`TASK-63` stängd — fanns kvar som `To Do` medan tre dokument påstod motsatsen.** `PAUSLÄGE`, todo-kadensen och denna fil sade alla "nio kort stängda … 63". DoD #3 (CI grön per jobb) var obockad. CI-belägg: run `30400640305`, nio jobb, samtliga `success`. Bara korsläsning mot registret avslöjade det — tre samstämmiga kopior är osynliga för läsning | — |
| 2026-07-29 | **AUDIT — tre läsande agenter, disjunkta linser** (kort-påståenden · externa referenser · intern koherens). **~20 fynd rättade**, varav **fem skapade samma kväll** av rättelsearbetet självt: `TASK-76` utan bärare i steg 3 · stegkollisionen i A7 efter omnumreringen · `A3 ×3` stale · två `[x]` kvar i kroppen · loggen splittrad i tre tabeller. Tyngsta externa fynd: `--mm-btn-*` var INTE oanvända (`CTA.tsx` använder Tailwind-syntax, inte `var()`) och `TASK-18.20` blockeras av fyra Marcus-beslut, inte av hållplats-frågan | `#400` |

**Två dispatcher utöver PR-raderna:** `30295150783` (genererade de sex
bilderna) och `30297097792` (**beviset** — *"Inga baseline-ändringar"*, som
stängde `TASK-54.2` DoD 7 och `TASK-54.3` DoD 5).
