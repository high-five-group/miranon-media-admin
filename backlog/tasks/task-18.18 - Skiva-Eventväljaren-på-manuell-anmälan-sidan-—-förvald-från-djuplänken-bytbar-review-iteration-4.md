---
id: TASK-18.18
title: >-
  Skiva: Eventväljaren på manuell anmälan-sidan — förvald från djuplänken,
  bytbar (review-iteration 4)
status: Done
assignee: []
created_date: '2026-07-23 09:56'
updated_date: '2026-07-25 10:47'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.12
parent_task_id: TASK-18
ordinal: 86000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg (2026-07-23), riktnings-beslut kvitterat ('Vi gör så istället'): manuell anmälan-sidan får en EVENTVÄLJARE överst — förvald med eventet man kom ifrån (djuplänks-kontexten), öppningsbar som lista för att byta event, så att Lotta kan stanna på sidan och fortsätta lägga in anmälningar till andra event. Branschledar-precedent: Linear (New issue-teamväljaren) · Stripe (kundväljaren på create-payment) · Notion. Väljarens STÄNGDA läge bär B-formens kontextrad-grammatik (kursfärgs-prick + eventnamn font-medium + ort + kollapsat datumspann) — ersätter den råa eventlabel-raden (punkt 11-fyndet). ÖPPNA DESIGNBESLUT före bygge (Code-rekommendation i parentes): (a) route-semantik — byte navigerar URL:en till /event/$eventId/ny-anmalan (URL:en alltid sann/delbar, samma grammatik som ?vy-kontraktet) (rek. JA); (b) formulär-state vid byte — ifyllda personfält BEHÅLLS (samma person till annat event är ett verkligt flöde; rensa är ett knapptryck) (rek. BEHÅLL); (c) list-innehåll — kommande event, senaste först, sökbar vid många (rek.; efterregistrering på genomförda = öppen fråga); (d) komponent — React Aria Select/ComboBox ur primitiv-biblioteket, 11-ribban (rek. Select först, ComboBox om sök behövs). ready-for-agent flippas på Marcus kvittens av a–d eller grillning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus designbeslut a–d bokförda (kvittens på rek. eller grillnings-utfall)
- [x] #2 Väljaren renderad: förvald från djuplänken, bytbar; stängda läget bär B-formens kontextrad (prick + namn medium + ort + kollapsat spann); rå eventlabel borta ur UI:t
- [x] #3 Route-/state-semantiken per beslut a–b; e2e täcker förval + byte + djuplänk; axe 0 på ytan
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FACIT LÅST 2026-07-24 (S83 pass 4, konvergens mot Marcus i browsern — "Nu är jag väldigt nöjd med allt, vi låser detta nu"). Byggkrav:

**1. Eventet-blocket ligger FÖRST i formuläret** — före Deltagare. Vid djuplänk (kommande hem-vy-knapp) är "är detta rätt event?" Lottas första fråga; den får inte hamna under persondata.

**2. Rubrikfritt kort** (CheckInKort-formen: `rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong` + `divide-y divide-border`). INGEN blockrubrik — väljaren säger själv vad blocket är (Marcus rev "Eventet" och "Vilket event gäller anmälan?"). Kortet har INGEN egen `mx` — DetaljGrupps kort har ingen, och avvikelsen ger 32 px breddskillnad (DOM-mätt 536 vs 568; paritet verifierad 436/568).

**3. Väljaren överst i blocket, VIT** (`border border-border bg-surface`, hover `bg-bg-muted`) — den sitter på grå kortyta och ska lyfta ur den, inte smälta in. Stängt läge = full kontextrad (kursfärgs-prick + namn + ort + kollapsat datumspann): väljaren bär IDENTITETEN, därför upprepar sammanfattningen varken ort eller datum.

**4. Sammanfattningen bär bara det som påverkar HANDLINGEN:** Typ · Platser kvar · Väntelista (villkorad) · Status (endast när ≠ Planerat — Planerat är normen och får inget märke, samma grammatik som Källa-pillen). Rå eventlabel aldrig i UI:t.

**5. Beläggningsstapeln under Platser kvar** — EventCards EGEN form (`h-1.5 rounded-full bg-surface` spår + `bg-success` vid fullt annars `bg-(--p-neutral-400)`, bredd = antalAnmalda/maxPlatser). `aria-hidden` dekor; siffran bär (WCAG 1.4.1). Listkortets enkla stapel, INTE eventsidans segmenterade mätare — den hör hemma där man arbetar med beläggningen.

**6. Sekundär navigering längst ned: "Gå till eventdetaljer"** + chevron 16 px. `text-small text-text-secondary`, INTE font-medium/text-body (läste som primär handling) och INTE text-muted (det är etikett-färgen; en länk som ser ut som en etikett slutar läsas som klickbar). Kontrast mätt 7,25:1 mot kortytan = WCAG AAA.

**7. TVÅ TILLSTÅND, INTE TVÅ SIDOR.** Skillnaden mellan ingångarna är om eventet är känt — efter valet är vyerna identiska. Tomt läge (hem-vy-ingången): väljaren står FRISTÅENDE som sidans enda handling (full bredd, `rounded-2xl border bg-surface px-4 py-4`, kalender-ikon + "Välj event"), och resten av formuläret RENDERAS INTE. Progressive disclosure-regeln: en kontroll som inte är tillämplig förrän ett val gjorts DÖLJS och avslöjas vid valet — disabled-fält användes först och REVS (Marcus: "fruktansvärt bedrövligt"; källor: UXPin/PatternFly/ui-patterns). Avslöjningen glider in (`mm-avsloj`, opacity + 8 px, ENDAST via motion-safe → stum vid prefers-reduced-motion).

**8. Sök i listan från start** — matchar namn ELLER ort, fokus flyttas till fältet när listan öppnas. Fokus sätts PROGRAMMATISKT, aldrig `autoFocus` (a11y/noAutofocus; regeln undertrycks inte när golvet är 11). USWDS sätter combobox-tröskeln vid >15 val; staging har 11 och listan växer monotont — fältet är därför med från start. OBS: USWDS avråder från sin EGEN combobox p.g.a. AT-fynd och rekommenderar Select — vi bygger på React Aria (annan implementation), men sökväljaren kräver skarp AT-testning i bygget, inte bara axe.

**9. Månadsgruppering i listan** — `Augusti 2026` (versal först) i EventsLists EGEN form: `font-semibold text-small text-text-secondary`. Rubrikerna läggs ovanpå ordningen, de sorterar inte om. **SKARPA BYGGET SKA LYFTA `monthLabel`/`groupByMonth` ur EventsList.tsx till delad plats och konsumera dem** — prototypen replikerar dem bara för att förbli kastbar; två grammatiker för samma sak är drift.

**10. Sortering: närmast först** (Marcus-kvittens 2026-07-24).

**11. placeholderData ur listcachen** (INTE initialData — listposten är partiell och får aldrig persisteras som hel; TanStacks anvisning för list→detalj). get-events bär typ · ort · datum · maxPlatser · platserKvar · status — empiriskt verifierat mot svaret. Enda fältet som saknas är `vantelista` (bara get-event aggregerar), därför ligger den raden SIST och glider in mjukt; det som styr handlingen står stilla.

**12. KOMPONENT: React Aria ComboBox** (beslut d omlandat från Select → ComboBox, eftersom sök ingår). Prototypens råa input/lista är EJ förlagan.

**13. ROUTE-BESLUTET (beslut a, utvidgat): alternativ b.** `/event/$eventId/ny-anmalan` behålls oförändrad; hem-vyns kommande knapp får en TUNN `/anmalan/ny` som renderar SAMMA komponent i tomt läge och navigerar in i den nästlade routen när event valts. Branschprecedent (research 2026-07-24): **Linear** har exakt detta — `linear.app/new` (inget team) + `linear.app/team/LIN/new` (team i path), allt annat i query · **Rails-konventionen** `/parent/:id/children/new` för nested creation, query-param-formen uttryckligen INTE konventionen · **Jira** gör projekt till gating-fält i den globala Create-dialogen. Alternativ c (search-param) förkastat: bryter path-param-grammatiken för en enda sida.

**14. Beslut b (formulär-state vid byte): BEHÅLLS** — komponenterna remountas inte vid navigering, ifyllda fält överlever eventbytet.

**BAS-GAP (Marcus 2026-07-24): PRIS saknas helt i `Event`-modellen.** Kan inte visas i sammanfattningen utan additivt bas-fält. Registrerat som bas-gap i ADR-063-klassen, in senare — samma hantering som 18.17:s två (URL/UTM-fångst · noterings-författare).

**Bilagor:** tasks/sessions/bilagor/s83-eventvaljaren-konvergens/

AFK-leverans (batch S86, do-work-agent, ADR-071/ADR-076-landningsform):

TDD rött-först (S80-amenderingen): nya describe-blocket 'Eventväljaren på manuell anmälan-sidan (task-18.18)' (8 tester) + facit-uppdaterat 18.12-rendertest körda FÖRE implementation — observerat utfall 9 failed / 5 passed (3,0 min): samtliga nya föll på saknad väljare, 'Error: element(s) not found … waiting for getByRole(button, name /Välj event/)' (bl.a. 'förval från djuplänken: Eventet-blocket FÖRST …', 'byte navigerar URL:en och BEHÅLLER ifyllda personfält …', 'tomt läge (/anmalan/ny) …', 'axe 0 violations …'); 18.12-rendertestet föll på eventlabel-flippen. Efter implementation: 14/14 gröna i filen; berörd yta events-list + kalender + event-detail 84/84. En cykel (e2e-skarven batchar skivans beteenden; rött+grönt pushas ihop). En defekt under körning: axe definition-list (dl-nästling i Platser kvar-raden) — fångad av eget axe-test, omstrukturerad (dl-grupperna axe-giltiga), 14/14.

KOMPONENTVALET BOKFÖRT (beslut d/punkt 12): byggt på React Arias EGEN dokumenterade sökväljar-form — Select (rik trigger) + Autocomplete + SearchField + ListBox i Popover (react-aria.adobe.com/Select § 'Autocomplete with SearchField'; RAC 1.19-exports verifierade). Inline-ComboBoxens alltid-synliga textfält kan inte rendera facitets stängda läge (rik kontextrad utan fält); Autocomplete-i-Select ÄR combobox-maskineriet i popover-form (virtuell fokus/aria-activedescendant, piltangenter, Enter väljer, Escape stänger) — punkt 12:s rationale (React Aria + sök, 11-ribban) uppfylld, bokstaven 'ComboBox' omlandad öppet här.

BYGGT: EventValjare.tsx (vy-komponent 11/10/10; stängt läge = B-formens kontextrad med kursfärgs-prick [18.17:s Avser-grammatik] + namn font-medium + ort + kollapsat spann; tomt läge = fristående vit kort-trigger med kalender-ikon; sök från start matchar namn ELLER ort via textValue; programmatisk fokus via rAF — aldrig autoFocus; månadsgrupper via DELADE groupByMonth) · manadsgrupp.ts (punkt 9-lyftet: monthLabel/groupByMonth ur EventsList → delad modul, EventsList konsumerar) · ManuellAnmalanForm omskriven (TVÅ TILLSTÅND: ValtLage/TomtLage; Eventet-blocket FÖRST i CheckInKort-formen utan mx [breddparitet DOM-asserted mot grupp-kort]; sammanfattning Typ · Platser kvar + EventCards enkla stapel · Status endast ≠ Planerat · Väntelista SIST villkorad >0 med mm-avsloj; 'Gå till eventdetaljer' i navigeringens nedtonade vikt [14px/vikt<500 computed-asserted]; rå eventlabel-raden RIVEN) · tunn route /anmalan/ny (beslut 13; hem-vyns kommande knapp är ingången — utanför skivan, bokfört i routens kommentar) · mm-avsloj-keyframes (motion-safe-gated, tailwind.css @theme).

INSTANT (ADR-078): sammanfattningen seedas ur listcachen med placeholderData (aldrig initialData); vantelista renderas ALDRIG ur placeholder (?? 0-skyddet — raden villkorad på riktig detalj-data >0, ligger SIST så inga rader ovanför flyttas, glider in motion-safe); kall djuplänk får skeleton i slutgeometri (rader + stapel); byte utan remount → fälten behålls (beslut b/14), mutations-utfall nollställs + idempotensnyckel roteras per skapa-intention vid byte (bekräftelseläge för event A kan aldrig visas för event B).

Lokala grindar: typecheck 0 fel · typecheck:tests 0 fel · biome 0 errors (5 warnings/26 infos pre-existerande i orörda filer) · build grön · test:api 381/381 · e2e event-ny-anmalan 14/14 + events-list/kalender/event-detail 84/84 · axe 0 (stängt läge helsides · öppen väljare scopad per ComboBox-mönstermallens ariaHideOutside-not · tomt läge helsides). Renderad verifiering: breddparitet eventet-block = grupp-kort (0-diff boundingBox) · stapelbredd 67 % (8/12) · länkvikt 14px/<500 · mm-avsloj-keyframes + utility verifierade i byggd CSS · blockordning före Deltagare (boundingBox-y).
Review-piloten (T86): granskat träd 20525690 (bas main 1ccd5a1) — 7 fynd (2 spec / 5 std); fokuserad ompassering på fix-diffen (träd 62203385) — 1 nytt nit-fynd (F8, bokförings-kommentaren). Triage: 8 åtgärdade (F1 komponentvals-bokföringen HÄR på kortet — spec-konflikten punkt 12 [ComboBox] vs punkt 3 [rik trigger utan fält] omlandad till React Arias dokumenterade Select+Autocomplete-form, Marcus-kvittens i morgongranskningen · F2 avslöjnings-avsikten till router-history-state, StrictMode-dubbelinvokering gjorde modulflaggan opålitlig i dev · F3 mekaniskt AT-kontrakts-e2e [DOM-fokus kvar i fältet + aria-activedescendant-förflyttning] · F4 synkron utfalls-gating via mutationEventIdRef — utfall från event A målas aldrig under B:s URL, inte ens en frame före reset-effekten · F5 EN dl med giltig dt+dd+dd-grupp — en skärmläsar-grammatik i stället för tre syskonstrukturer · F6 SelectItem-konsumtion + BelaggningsStapel-lyft ur EventCard, dubblett-driften eliminerad · F7 e2e-bevis för nyckelrotation + utfalls-nollställning vid byte · F8 reload-fallet i F2-bokföringen), 0 avfärdade, 1 routad (task-45: kommande-filter/sort-dubbleringen — utanför skivans mandat, samma lyft-klass som punkt 9). Reviewfixarna validerade: e2e-filen 16/16 · berörd yta events-list/kalender/event-detail 84/84 · test:api 381/381 omkört (EventCard tvärgående; en transient staging-409-flaky klassad via isolerad 12/12-omkörning) · typecheck/typecheck:tests/biome/build gröna. Review-tid ~7 min (två pass); +3 havererade CLI-starter före passen (headless claude -p hänger på MCP-server-laddning — löst med --strict-mcp-config; driftnot i T86).

ÖPPNA MARCUS-MOMENT (morgongranskningen): (1) F1-kvittensen — komponentvals-omlandningen ComboBox→Select+Autocomplete; (2) manuellt VoiceOver-pass på sökväljaren (facit punkt 8:s AT-krav utöver det mekaniska e2e-kontraktet); (3) bekräftelseläget visar inte längre vilket event anmälan gällde (eventidentiteten bor i väljaren, som inte renderas i bekräftelseläget — arv från 18.12, ompasseringens observation).

## Granskningsvågens FIX + FACIT-KOMPLETTERING (S86 morgongranskning, Marcus-beslut 2026-07-25)

FYND: eventväljarens stängda trigger på manuell anmälan-sidan VÄXTE i bredd med innehållet. FACIT-KOMPLETTERING: bredden var ALDRIG låst i S83-facitet (punkt 3 låste färg/innehåll, inte bredden) — Marcus-beslutet kompletterar facitet: FAST bredd, triggern sträcker sig hela vägen över sitt block med samma marginal mot blockkanten på höger sida som på vänster (symmetrin bärs av kortets px-4; full blockbredd).

FIX (branch fix/s86-granskningsvag): stängda kontextrad-triggern w-auto max-w-full self-start → w-full; chevronen alltid ml-auto (högerkanten). K54-vakten respekterad (ingen -mx-2 i formen). Tomt läge (/anmalan/ny) var redan full bredd — konsekvent. Fil: src/components/events/EventValjare.tsx.

E2E-LÅS (event-ny-anmalan.staging.test.ts, 18.18-blocket): nytt test 'fast bredd (facit-komplettering, Marcus-beslut 2026-07-25)' — vänster-inset 16 px (px-4) = höger-inset (symmetri-lås) + chevron 14 px (px-3.5) från triggerns högerkant. Rött-först ej observerbart lokalt (5173 bärs av Marcus levande dev-server; hård vägran by-design) — PR-CI är beviset, bokfört i PR-bodyn.

FIXUP (samma PR): PR-CI:ts första pass föll på symmetri-låsets absolutvärde — insetten är 17 px, inte 16 (kortets 1 px transparenta kant ingår i boundingBox; likaså triggerns egen kant → chevron-insetten 15, inte 14). Symmetrin (Marcus-beslutet) höll; absoluta förväntningar korrigerade med kant-förklaring i testet. Klassad testdefekt, inte produktdefekt.

## Granskningsvåg 2 (S86, Marcus omgranskning av PR #188 — 2026-07-25)

(2) FIX, prototyp-regression: autofocus på sökrutan saknades vid öppning i verklig användning. UTREDNING (ordern: befintligt fokus-test var GRÖNT — varför missar verkligheten?): skarpa byggets form var EXTERN rAF-fokus en frame efter SokFalt-mount — ett race mot RAC:s egen öppnings-fokusering (FocusScope/Autocomplete-maskineriet); racets utfall är timing-beroende → e2e-grönt men fokus-tapp i verkligheten. Prototypen (proto/s83-18-18-19-eventvaljaren-iter, git show-läst) fokuserade DIREKT vid öppning utan konkurrerande maskineri — regressionen uppstod när skarpa bygget lade fokusen UTANFÖR RAC:s system. LÄKNING: autoFocus-PROPEN på SearchField — React Arias EGEN dokumenterade form för Select+Autocomplete (react-aria.adobe.com/Select § 'Autocomplete with SearchField' OCH /Autocomplete § 'with Select' bär båda <SearchField autoFocus>; propen registreras INUTI RAC:s fokusmaskineri = deterministisk). Facit punkt 8:s 'programmatiskt, aldrig autoFocus' REVS ÖPPET (Marcus våg 2-order): noAutofocus-golvet gäller sidladdnings-autofokus, inte fokus i en just-öppnad popover som svar på användarens egen handling; biome flaggar inte (verifierat). E2E-lås: nytt test låser BÅDA öppningsvägarna (mus-klick + tangentbord/Enter → sökfältet fokuserat). Gäller båda ytorna (delad SokFalt).

(3) FACIT-KOMPLETTERING — FORMVAL B (Marcus-beslut efter research 2026-07-25): POPOVERN MATCHAR TRIGGERNS BREDD. Fyndet: default placement 'bottom' centrerade den innehållsbreda popovern under triggern → högerförskjuten utanför innehållet. Mekanik (verifierad i installerad react-aria-components 1.19.0): RAC Popover sätter --trigger-width automatiskt (uppdaterad via resize observer) → width: var(--trigger-width) (w-(--trigger-width)) + min-w-72-golv (18rem — smal trigger ger aldrig oanvändbar söklista) + placement='bottom start'; containerPadding/shouldFlip = RAC-default. RESEARCH-REFERENS: React Aria Select-docs använder exakt --trigger-width; Radix --radix-select-trigger-width; Material exposed dropdown menu = fältets bredd. På denna yta blir popovern = våg 1:s fasta full-bredds-trigger; på eventdetaljsidan rubrik-triggerns bredd med min-golvet som hängsle. E2E-lås i båda sviterna (bredd + vänsterkant ±1 px).

Rött-först ej observerbart lokalt (tre levande servrar 5173/5174/5175; portlåst svit) — PR-CI är beviset.

VÅG 2-ITERATION 2: delade väljar-maskineriets popover-förskjutning (form B-låsets 11-px-diff i CI) visade sig vara pre-existing app-bred defekt (scrollbar-gutter × RAC-overlay-origo) — läkt med body { position: relative } i base.css (grundorsak + A/B-bevis i 18.19-notes; L342). 18.18-ytans egna lås (fast bredd · fokus båda vägarna · popover-bredd/kant) gröna i den nya lokala preview-loopen: event-ny-anmalan 16/16.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 744b8c0b56c46cb57afa8b61b8d0248233d85589 · CI-run: PR-run 30145610730 grön per jobb (8/8 success, attempt 1) + main-run 30145869389 grön per jobb (Test suite dedup-SKIPPAD by-design, 36.4; merge-SHA 9877662e) · CI-grön-första-pass: ja · defekter under körning: 1+8 (bygget: axe definition-list-defekten i Platser kvar-raden fälld av eget axe-test, omstrukturerad → 14/14; review-piloten T86: 8 fynd åtgärdade [7 första pass + F8-nit i ompasseringen], 0 avfärdade, 1 routad till task-45) · TDD: rött-först per S80-amenderingen — nytt describe-block (8 tester) + facit-uppdaterat 18.12-rendertest körda FÖRE implementation (observerat 9 failed/5 passed), efter implementation 14/14, en cykel (e2e-skarven batchar skivans beteenden; rött+grönt pushas ihop) · AFK-proveniens: batch S86, do-work-agent
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
