---
id: TASK-18.18
title: >-
  Skiva: Eventväljaren på manuell anmälan-sidan — förvald från djuplänken,
  bytbar (review-iteration 4)
status: To Do
assignee: []
created_date: '2026-07-23 09:56'
updated_date: '2026-07-24 21:39'
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
- [ ] #2 Väljaren renderad: förvald från djuplänken, bytbar; stängda läget bär B-formens kontextrad (prick + namn medium + ort + kollapsat spann); rå eventlabel borta ur UI:t
- [ ] #3 Route-/state-semantiken per beslut a–b; e2e täcker förval + byte + djuplänk; axe 0 på ytan
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
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
