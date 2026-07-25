---
owner: marcus803
updated: 2026-07-25
review_by: 2026-10-22
status: stable
lifecycle: active
---

# T86 — Pocock v1.1-integrationen (korpus-bevakning → arbetssätts-delta)

> Tråd-kort (ADR-053). Född 2026-07-24 ur Marcus korpus-bevakning: fyra nya
> YT-transkript (Matts skills-repo v1.1 + prototyp-filosofi + review-skill-
> genomgång + teach-skillen) analyserade mot vårt arbetssätt med pre-K-
> forensik (T71, ADR-068, throwaway-kontraktets DECLINE-lista lästa FÖRE
> förslag). Marcus-direktiv i samma pass: löpande förbättring av
> arbetssättet är en del av Codes identitet — bevakningen är återkommande,
> inte engångs.

- **Tråd-ID:** `T86-pocock-v11-integrationen`
- **Tillstånd:** se frontmatter `lifecycle`
- **Källor:** rå-transkripten
  [docs/reference/pocock/transkript/2026-07-v1.1/](../../docs/reference/pocock/transkript/2026-07-v1.1/)
  · destillat + gap-analys
  [v1.1-delta-och-gap-analys-2026-07-24.md](../../docs/reference/pocock/v1.1-delta-och-gap-analys-2026-07-24.md)
  · v1.0-korpusen (`docs/reference/pocock/`, fryst referens)
- **Besläktad:** `T71` (dynamic workflows i Pocock-arbetssättet; research-
  formen) · `T85` (riskanpassad CI — metrics-instrumenten är review-pilotens
  förkrav; Codex-punkt 2 pekar på samma granskningshål) · `T56` (djupa
  moduler — filstorleks-/kontextpekar-lärdomen) · `T84` (guidad omgranskning
  — angränsande granskningsyta)
- **Commit-historik:** `git log --grep "\[T86\]"` (gäller även hubben
  marcus-system)

## Beslutsläge (2026-07-24)

<!-- markdownlint-disable MD029 -->
<!-- Numreringen 1–7 LÖPER medvetet över klassrubrikerna (LANDAT →
     BEHOVS-TRIGGAT): beslutslägena är EN räknad serie som § Nästa steg
     refererar per nummer ("beslutsläge 3"). Omstart per rubrik hade
     brutit referenserna. Precedent: processgranskningen 2026-07-23. -->

**LANDAT (denna session):**

1. **Hub del 1** (`d369d99`, plugin 1.18.1 → 1.19.0, update + list
   verifierade): grilling-kärnan får fakta/beslut-distinktionen +
   enact-gaten (Matts v1.1-fixar; själv-grillnings-buggen rapporterad
   särskilt på Fable) · do-work steg 4 får valideringskadensen (typecheck +
   berörd testfil löpande, full svit EN gång sist) · NY skill `/research`
   (bakgrunds-pass: EN nedskriven fråga → primärkällor → durabel
   fil-landning per repo-konvention; T71-A-spårets form).
2. **Korpus-landningen** (denna spoke-PR): fyra rå-transkript + destillat/
   gap-analys + detta tråd-kort.

**AKTIVERAT (i drift under mätperiod):**

3. **Review-piloten** — subagent-review i do-work-skarven (lokalt grönt →
   review → leverans-commit): EN subagent, två axlar (spec-trohet mot
   kortets AC/Testbeslut + standards mot KVALITETSDEFINITIONER/design-
   system-spec/Fowler-smells/T56), fynd åtgärdas inom kortets scope eller
   avfärdas MED motivering i transparens-rapporten; strukturella fynd
   utanför scope → kort/tråd. Piloten mäts från dag ett över ~10–15
   skivor, därefter permanentas (sannolikt ADR) eller rivas öppet.
   Marcus-kvittens på pilotformen: "Okej bra, nu står vi på en bra
   grund" (2026-07-24); planen preciserad + kvitterad samma dag ("Det
   låter ju väldigt bra") — fulltext i § Pilotplanen nedan.
   Start-villkoret ÖPPET REVIDERAT där (ursprungligen "när
   36.x-instrumenten är levererade"). **AKTIVERAD 2026-07-24** (hub
   `291865d`, plugin 1.20.0 — PILOT-blocket i do-work steg
   4→5-skarven, distribuerad + verifierad; L329).

**GRILLNINGSKLASS (egen session vid trigger):**

4. **Wayfinder-mönstret på vårt substrat** — kart-kortklass UPPSTRÖMS om
   PRD-kortet (typade besluts-skivor research/grillning/prototyp/task,
   blocking-ordning, utfall ackumuleras på kartan → to-prd). Vidgar
   substrat-kontraktet → grillning + sannolikt ADR. **Namnfrågan buntas
   här** ("PRD-kort" → "spec-kort"? — Matts rename-argument träffar oss;
   våra "skivor" behålls). Trigger: AT-Max-uppstarten (ADR-063) eller nästa
   stora dimmiga initiativ.

**BEHOVS-TRIGGAT (byggs när behovet aktualiseras):**

5. **Teach-piloten** — stateful lärresa för Marcus (mission + learning
   records + interaktiva HTML-lektioner + ZPD), pilotämne väljs av Marcus
   (Code-kandidat: läsa/granska React-koden i admin-appen — höjer
   pushback-fångstens tak ~27 %). Matts teach-SKILL.md hämtas till korpusen
   vid bygget. Distinktion låst: engångsfrågor får engångssvar; "skriv så
   Roger/Lotta förstår" är guide-builder/Gunilla-materia, INTE teach.
6. **Guide-builder-korsbefruktningen** (ZPD + mission-först + quiz) — EFTER
   teach-piloten visat vad som bär.
7. **Lotta-onboarding som teach-instans** — vid drift-horisonten.

<!-- markdownlint-enable MD029 -->

**MEDVETET AVSTÅTT (över-engineering-vakten; omprövning = ny evidens +
öppen rivning):**

- Implement-skillen (vår do-work är strikt superset).
- Prototyp-som-kopieringskälla (throwaway-kontraktets klausul iv +
  utdrags-undantaget står; S47-beslut).
- Judge-paneler/ultrareview per skiva (T71:s analys står).
- Teach-trigger på vanliga frågor; Wayfinder-bygge före grillningen;
  rename som egen landning.

## Pilotplanen — review-piloten preciserad (2026-07-24, Marcus-kvitterad: "Det låter ju väldigt bra")

**Hypotes:** en review-subagent med färsk kontext, mellan lokalt grönt
och leverans-commit, fångar problem de deterministiska grindarna inte
ser — spec-MISSTOLKNINGAR (koden gör vad implementern trodde kortet
menade) och kvalitativa brister (fel abstraktion, smells, brutna
token-/T56-principer) — till kostnad lägre än fångstens värde.
**Nollhypotes** (måste kunna landas i): mest brus eller inget, bara
minuter adderade → rivs. **Baseline-ärlighet:** first-pass-CI ligger
~100 % — värdet måste bevisas i skiktet CI inte mäter.

**Mekanik:** placering do-work steg 5 (efter lokalt grönt, FÖRE
leverans-commiten — EN-commit-normen består); skill-texten får ett
märkt PILOT-block med T86-referens (rivning = ren radering).
Subagentens input: diffen mot main + kortets AC/Testbeslut +
PRD-föräldern + standards-dokumenten (KVALITETSDEFINITIONER-11-REACT ·
DESIGN-SYSTEM-SPEC:ens token-regler · Fowler-smell-listan · T56-kraven)
— ALDRIG implementerns resonemang (oberoende läsning är poängen).
Output-kontraktet (Cursor-lärdomarna): prioriterad fyndlista
(spec-trohet/strukturellt överst) · tak ~7 fynd · plats + varför +
föreslagen åtgärd per fynd · separat "utanför kortets scope"-sektion
för routning. Triagen är implementerns: åtgärda inom scope / avfärda
MED motivering / routa — alla tre synliga i transparens-rapporten
(extern fångst av triagen själv).
Protokoll-skärpningar (Codex-eftergranskningen 2026-07-24, antagna
FÖRE start): (1) granskat träd registreras — diffens HEAD-SHA stämplas
i transparens-rapporten + loggraden; (2) omgranskningsregeln —
materiell kodändring EFTER ett reviewfynd får en fokuserad andra
passering (triviala namn-/kommentarändringar undantas); (3) validering
efter fynd — reviewfixar följs av berörda tester, tvärgående ändring ⇒
full svit om; (4) oberoende-ärlighet: subagenten är en kvalificerad
second opinion (färsk kontext), INTE organisatorisk separation of
duties — samma modellfamilj kan dela systematisk blindhet.

**Mått (loggtabellen nedan, en rad per skiva):** fynd per axel
(spec-trohet/standards) · utfall (åtgärdade/avfärdade[skäl]/routade) ·
klass (blocker = hade gett fel beteende eller brutet AC · kvalitet =
bättre kod, samma beteende · brus) · review-tid i minuter
(väggklocka, stämplad i transparens-rapporten) · OBSERVERADE ESCAPES =
nedströms-fynd av Marcus/QA/CI som reviewn borde sett (medvetet INTE
kallat recall — hela felmängden är okänd; facit: granskningsvågorna +
QA-vandringen) · total leveranslatens lokalt-grönt→merge per skiva
(review-tiden ligger före push och syns inte i CI-måtten).
Nämnar-definitioner: brusandel = avfärdade ÷ alla rapporterade unika
inom-scope-fynd; dubbletter räknas EN gång; routade fynd står utanför
både träff- och brus-nämnaren (egen kategori).

**Beslutskriterier (LÅSTA före start):** PERMANENTA (→ ADR, blocket
blir ordinarie text) om ≥1/3 av skivorna ger ≥1 åtgärdat
blocker-/kvalitetsfynd OCH brusandelen <50 % OCH median-kostnaden
≤5 min/skiva · RIV ÖPPET om träffkvot <1/5 skivor eller brus dominerar
eller >10 min median utan motsvarande fångst · GRÅZON: EXAKT en
justeringsrunda (smalare axel/kortklass, +~5 skivor) → tvingat beslut.
Beslutet är Marcus på Code-rekommendation, bokförs här.
Marcus-momentet under piloten (bekräftelsebias-motmedlet, Codex-
skärpning 4): Marcus kontrollerar ALLA blocker-fynd, alla omtvistade
avfärdanden och ett stickprov av övriga avfärdanden — naturlig hemvist
i morgongranskningen/Done-flippen.

**Omfång + start (ÖPPEN REVIDERING av beslutsläge 3:s ursprungsvillkor):**
10–15 produktkod-skivor (docs-/config-kort deltar inte).
Ursprungsvillkoret "när 36.x-instrumenten är levererade" reviderat:
36.5 är redan i drift, och pilotens bärande mått loggas manuellt per
skiva eftersom review-tiden ligger FÖRE push och inte syns i
PR-ledtiden — verkligt villkor är NÄSTA PRODUKTKOD-BATCH utan att
störa 36.7/36.8; naturlig start är event-familje-arbetet efter
QA-vandringen. **Aktiveringen: UTFÖRD 2026-07-24** (hub `291865d`,
plugin 1.19.0 → 1.20.0, update + list verifierade —
list-verifieringen från huvudkatalogen, L329). Första pilot-skivorna:
nattbyggets kort (§ Körplanen nedan).

**Pilot-loggen (fylls per skiva under piloten):**

| Skiva | Fynd (spec/std) | Åtgärdade | Avfärdade (skäl) | Routade | Klass | Tid (min) | Missar nedströms |
|---|---|---|---|---|---|---|---|
| 17.7 (diff adb2c614 → ompass. e1e29f45) | 7 (2/5) | 6 | 1 (fynd 5: text-[10px]-badgen — facit-låst form, öppet bokförd mot spec-regeln i kod + kort; 6a-delen likaså bokförd degradering) | 0 | 1 blocker (print-huvud i kalenderläget) / 6 kvalitet | ~10 (två pass) | _fylls i morgongranskningen_ |
| 18.15 (diff e9cff7d8 → ompass. 4839d1bb) | 4 (2/2) | 4 | 0 | 2 (task-39 röststyrnings-gapet · task-40 contrast-more-avgränsningen) | 0 blocker / 2 kvalitet / 2 brus (brusen gratis härdningar, åtgärdade) | ~8 (två pass) | _fylls i morgongranskningen_ |
| 18.16 (diff e8b011bbbb50 → ompass. 91d00ce3232f; F6-skivan, lägre effort) | 7+1 (4/3; ompass. fångade T90-ID-krocken i tråd-registret — S83-kollisionsklassen, rättad till T91) | 7 (inkl. kortfoten → Button-primitiv i stället för handvirade tokens; §19-snävning + form-rationale; color-assertion; ID-krocken) | 0 (fynd 6 = processpåminnelse om AC-bockar, verkställd i stängningsdisciplinen) | 3 (task-41 fokusring-på-success · task-42 Atgarder-kommentaråldring · T91 färg-assertions-filosofin) | 0 blocker / 5 kvalitet / 2 process-nit / 1 bokförings-krock | ~12 (två pass) | _fylls i morgongranskningen_ |
| 18.17 (diff 3df9b42af7da → ompass. 222c69324fde) | 7 (2/5) | 7 (statusLage tre-lägen mot falsk Bekräftad-badge · eventTyp/eventOrt ur EVENTRADEN — anmälans formulär-kopior tomma för app-skapade · aria-label-kontext på Läs mer · contrast-more + clipboard-.catch · RegistrationDetail-typad cache-patch · delat arGenomford-predikat · PaymentStatus-konstanten) | 0 | 0 (Deadline-formelns Ej relevant-bug var redan T16-bokförd, 18.8-bifyndet — utanför scope-sektion, ej nytt) | 1 korrekthet (falsk status-badge på nåbara vägar — URL/+1-länkar förbi arbetsköns arAktiv-filter) / 6 kvalitet | ~14 (två pass) | _fylls i morgongranskningen_ |
| 18.18 (träd 20525690 → ompass. 62203385) | 7+1 (2/5; ompass. 1 nit) | 8 (F1 komponentvals-bokföringen på kortet [spec-konflikt punkt 12 vs 3, Marcus-kvittens i morgonen] · F2 avslöjnings-avsikt → router-history-state [StrictMode-buggen] · F3 AT-kontrakts-e2e aria-activedescendant · F4 synkron utfalls-gating mutationEventIdRef · F5 en dl med dt+dd+dd · F6 SelectItem + BelaggningsStapel-lyft · F7 nyckelrotations-bevis i e2e · F8 reload-fallet i bokföringen) | 0 | 1 (task-45 kommande-filter/sort-dubbleringen) | 0 blocker / 2 spec / 1 struktur / 1 a11y / 3 kvalitet / 1 nit; 3 öppna Marcus-moment bokförda på kortet (F1-kvittens · VoiceOver-pass · bekräftelselägets eventidentitet) | ~7 (två pass) | _fylls i morgongranskningen_ |
| 18.19 (träd f2cea1aa → ompass. 75f66211) | 7+3 (1/6; ompass. 3 nya i F1-omkretsen) | 10 (F1 prefetch-paret → delad useForberedEventDetalj + tangentbords-avsikt via AvsiktVidFokus [virtuell fokus avger inga DOM-event] + e2e-bevis för båda vägarna · F2 RouteAnnouncer-invariantdocen rättad, grundorsaken → task-46 · F3 valjar-lista-helpern + get-events-stub i 7 läckande sviter · F4 eventKey i listraderna + pill-assert före släppet · F5 kommentarstädning · F6 harFokuserat-ref i st.f. boolean-i-förklädnad · F7 kontrakts-defensiv-kommentaren · N1 sök-värmningens breddade avsikts-semantik öppet bokförd i kod · N2 fokus-invänta före ArrowDown i e2e · N3 useCallback-kedjan in i effekt-deps) | 0 | 2 (task-46 dynamisk sidtitel i route-lagret · task-47 e2e-fixture-konsolidering) | 0 blocker / 1 spec / 2 struktur / 4 kvalitet / 3 nit | ~9 (två pass) | _fylls i morgongranskningen_ |

> **Driftnot (S86-batchen, 18.18-agenten):** headless review-subagent via
> `claude -p` hänger på MCP-server-laddningen i denna miljö (3 havererade
> starter à 10 min). Botemedlet är `--mcp-config '{"mcpServers":{}}'
> --strict-mcp-config` — review-passet behöver inga MCP-verktyg. Gäller
> alla framtida pilot-spawns i repot.

## Körplanen 2026-07-24 → nattbygget (kvitterad i S82-konversationen)

1. **Codex-uppföljningsrapporten inväntas** (Marcus-beställd
   omgranskning efter T85-utlösningen): läses + disk-verifieras
   påstående-för-påstående i S82-konversationen före dess stängning;
   flödespåverkande fynd triageas före nattbygget.
2. **Prototyp-pass per yta** (HITL, konvergens från exakt kopia per
   standardformen): 17.7 filtervyn · 18.15 numrerade boxar · 18.17
   per-anmälan-detaljvyn · 18.18 + 18.19 eventväljar-paret (troligen
   ETT pass — samma komponentfamilj). Svar-fångst → byggkrav in i
   korten (utdrags-undantaget) → `ready-for-agent`.
3. **AVGJORT (Marcus 2026-07-24): 18.16 MED i nattbygget.** Grön
   knapp-regeln är låst → kortet ready-for-agent:as i facit-passet
   UTAN prototyp, tillsammans med de prototypade kortens etikettering.
4. **Nattbygget:** work-batch-order i frisk session (max-kort 6,
   inkl. 18.16) → varje produktkod-skiva = pilot-skiva med loggrad i
   tabellen ovan; UI-skivor stannar i granskningsfärdigt läge.
5. **Morgonen:** Marcus granskningsvåg = escapes-facit för
   pilot-loggen + pilot-triagens Marcus-moment (blocker-fynd +
   avfärdande-stickprov). OBS 36.8: körs först när QA-planens punkt 11
   (rött visual-jobb) synkats mot verkligheten — punkten förutsätter
   T87-aktivering (Codex-eftergranskningen; Marcus-beslut om
   ordningen).
6. **Nästa processfönster (SEKVENS LÅST, Marcus 2026-07-24):**
   T85-korrigeringssessionen — mätardefinitions-verifiering + fix,
   nattlarms-observatören, Vale-SHA256, cron-timezone +
   beslutsfrågorna (36.7-formalian · 36.8-ordningen ·
   nightly-visual-grillningen · merge-only). BINDANDE före
   pilot-beslutet och före all vidare CI-utbyggnad (T85-kortets
   § Eftergranskningen bär fulltexten).

Parallell-landningsdisciplinen (L328) gäller: docs-PR:er landas inte
under en långsam svits fönster.

## Varför tråden finns

Arbetssättet ÄR Pocock-härlett (S47–S50) och Matts repo utvecklas snabbt
(v1.1). Bevakningen fångar deltat; gap-analysen skiljer äkta nyheter från
sådant vi redan har i starkare form; pre-K-forensiken hindrar att medvetna
designval (DECLINE-listor, T71-avvägningar) återföreslås som "nyheter".
Sekvensen mot T85 är designad: processhastighets-spåret (Codex-vågorna)
äger ci.yml/merge-ytan; detta spår äger hub-skills + korpus — noll
överlapp, parallellt körbara.

## Nästa steg

- **A.** Review-piloten är AKTIV sedan 2026-07-24 (hub `291865d`,
  plugin 1.20.0) — första pilot-skivorna är nattbyggets kort
  (§ Körplanen); loggtabellen fylls per skiva och beslutet tvingas
  efter 10–15 rader per de låsta kriterierna.
- **B.** Wayfinder-grillningen vid AT-Max-uppstart eller nästa dimmiga
  initiativ (beslutsläge 4).
- **C.** Marcus väljer teach-pilotämne när han vill öppna det spåret
  (beslutsläge 5).
- **D.** Nästa transkript-släpp från Marcus → samma analysform (gap-analys
  med pre-K-forensik; se memory `kaizen-i-samarbetet`).
