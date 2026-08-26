---
id: TASK-18.20
title: >-
  Skiva: Bekräftade-sektionen till paritet med Obekräftade — markera-läge,
  delmängds-handlingar och Åtgärder-radernas form (review-iteration 6)
status: Done
assignee: []
created_date: '2026-07-26 11:32'
updated_date: '2026-08-24 15:46'
labels:
  - ready-for-human
  - wontfix
  - intentionally-unchecked
dependencies:
  - TASK-48
parent_task_id: TASK-18
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Marcus design-review 2026-07-26 (S91), fynd 4 på task-48: "Nu när bekräftade är med i listan här så ser jag ju att vi måste bygga bekräftade-sektionen på EXAKT samma sätt som Obekräftade. Bekräftade borde också få en markera-knapp, inline-scroll, skicka eventinfo-knapp etc, eller hur?"

Idag är Bekräftade-sektionen ren LÄSYTA: `<DeltagarListan rader={bekraftade} eventId={event.id} />` utan `markering`-prop, utan handling på sin `GruppRubrik`. Obekräftade fick i task-48 hela markera-apparaten (lägesöppnare på rubrikraden, batch-bar med live-count och breddlås, hela kortet som kryssruta). Registret fick ingenting.

### Varför detta är större än paritet

`Åtgärder`-listan (`src/components/events/detail/Atgarder.tsx`) bär idag rader som är ALLT-ELLER-INGET: rad 3 "Skicka betalningspåminnelse till obetalda", rad 4 "Markera alla obetalda som betalda", rad 5 "Skicka eventinfo till alla anmälda" (samtliga fortfarande `aria-disabled` — flödena finns inte). Ett markera-läge på Bekräftade gör dem till DELMÄNGDS-operationer: Lotta kan välja sex av tjugo i stället för att träffa alla eller ingen. Kortet rör alltså Åtgärder-listans VARA, inte bara sektionens form.

### Forsknings-grunden

L353 (S90, `docs/research/checkin-monsterklassen-2026-07-26.md`): noll av fem undersökta produkter (Eventbrite Organizer, Luma, Cvent OnArrival, Splash Host, Sched) bär massmarkering vid dörren — varje funnen massmarkering ligger i REGISTER-klassen. Slutsatsen var explicit att task-48:s markera-läge generaliserar till registret. Bekräftade ÄR registret. Ytan är alltså där mönstret hör hemma, inte en kopia av kön.

### Lösning

Bekräftade-sektionen får markera-läge med SAMMA grammatik som Obekräftade — samma mekanik, inte en andra kopia av den. `useMarkeringsLage`, `MarkeringsBatchBar`, `MarkerbartKort` och `DeltagarListan`s `markering`-prop finns redan (task-48); batch-baren är dock hårdkodad mot bekräftelse-handlingen och måste generaliseras till en handlings-uppsättning (djup-modul-kravet: anroparen säger VAD som ska hända, aldrig HUR). Nya batch-handlingar kopplas per Marcus beslut nedan, och Åtgärder-radernas allt-eller-inget-form omprövas i samma landning.

### Kortets tillstånd — VÄNTAR PÅ FYRA MARCUS-BESLUT

Marcus har beslutat att arbetet utförs DIREKT, inte parkeras — men fyra designfrågor är öppna och kortet är därför INTE plockbart. Oetiketterat plockas aldrig; `ready-for-agent` flippas när besluten är bokförda (18.19-precedenten). Frågorna i sin helhet, med analys och Code:s hållning där sådan finns, står i Implementation Notes:

1. **Inline-scroll på Bekräftade — ja eller nej?** (Code:s hållning: NEJ. Marcus har inte tagit ställning.)
2. **Vilken uppsättning batch-handlingar ska registret bära?**
3. **Vad händer med Åtgärder-radernas allt-eller-inget-form när delmängds-vägen finns?**
4. **Vilka §19-intents bär de nya handlingarna?**

Två ytterligare frågor föll ut ur inventeringen (Code-fynd med rekommendation — Marcus kvitterar eller vänder): två samtidiga markera-lägen, och fällningen × lägesöppnaren.

### Utanför omfattningen

- Skivning: kortet bryts INTE ned i barn förrän besluten är fattade.
- Bekräftelse-handlingen på Obekräftade (task-48:s leverans) — orörd.
- Check-in-sidan och dörr-write (L353: per-post-write hör till dörren, massmarkering till registret).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus fyra designbeslut (A1 inline-scroll · A2 handlingsuppsättningen · A3 Åtgärds-radernas form · A4 batch-barens intents) plus de två Code-fynden (B1 två samtidiga lägen · B2 fällningen × lägesöppnaren) bokförda på kortet FÖRE bygget; ready-for-agent flippas först då
- [ ] #2 Bekräftade bär markera-läge i SAMMA grammatik som Obekräftade: lägesöppnare solid + Avbryt subtle på rubrikraden (§19 lägesöppnar-undantaget), hela kortet som kryssruta med kanten som WCAG 1.4.1-bärare, batch-bar med live-count och breddlås — DELAD mekanik, ingen andra kopia av useMarkeringsLage/MarkeringsBatchBar/MarkerbartKort
- [ ] #3 MarkeringsBatchBar generaliserad till en handlings-uppsättning (etikett, ikon, intent, dialogtext, mutation som indata) med breddlåset och live-regionen bevarade; bekräftelse-handlingen på Obekräftade oförändrad i renderad form och testkontrakt
- [ ] #4 Batch-handlingarna per A2 utförda som DELMÄNGDS-operationer mot markerade anmälningar: kontrollfråga på varje massmutation, pessimistisk bulk, ärligt delutfall (K53) och urval som överlever ett icke-rent utfall
- [ ] #5 Åtgärds-radernas form per A3 genomförd (inklusive rad 2:s inaktuella 18.6-koppling); varje rivning eller ändring öppet bokförd i Atgarder.tsx och berörd spec, numreringens referentbarhet (18.15) uttryckligen hanterad
- [ ] #6 E2e täcker markera-läget på Bekräftade (öppna, välja, markera alla, rensa, Esc, fokus-återlämning) + varje ny batch-handling + B1/B2-beslutens beteende; axe 0 i både vilande läge och markera-läge
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-24 14:40
---
WONTFIX 2026-08-24 (S112, Marcus-mandat): explicit ersatt av TASK-145 — citat verbatim ur TASK-145 § Implementationsbeslut, rad 138: 'Detta kort ersätter task-18.20. Det kortet stod låst på fyra Marcus-frågor — inline-scroll, batch-handlingarnas uppsättning, Åtgärds-radernas form och batch-barens intents. Alla fyra är besvarade av facit och av läsyte-beslutet.' Ingen kod byggd härifrån; de fyra Marcus-frågorna avgörs i stället av TASK-145:s facit och läsyte-beslut.
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd (L220)
- [ ] #6 Renderad verifiering (computed-style/skärmdump) av registrets markera-läge + batch-barens breddlås före granskning (L245/L246)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
URSPRUNG: Marcus design-review 2026-07-26 (S91), fynd 4 på task-48 (review-våg 2 bar fynd 4:s föregångare — kö-vs-register-distinktionen som rev Obekräftades fällning). Detta kort är NYTT ARBETE, inte en fix på task-48: task-48 levererade markera-läget för KÖN, detta bygger det för REGISTRET och tar med sig Åtgärder-listans form. Marcus-beslut samma dag: utförs direkt, parkeras inte.

FÖRÄLDER: TASK-18 (PRD Eventsidan till S73-facit). BEROENDE: TASK-48 — mekaniken som ska generaliseras föds där, och kortet får inte plockas medan den koden är i rörelse.

## A. DE FYRA MARCUS-FRÅGORNA (avgörs av Marcus; kortet är låst tills dess)

### A1. INLINE-SCROLL PÅ BEKRÄFTADE — JA ELLER NEJ?

Marcus nämnde inline-scroll som en av paritets-delarna. Code:s hållning är: markera-läge + batch-handlingar JA, inline-scroll NEJ. Skälet är KÖ-vs-REGISTER, samma distinktion som review-våg 2 landade i:

- Obekräftade är en KÖ som TÖMS. Byggkrav 4 låser den till ~3 synliga kort (`max-h-[25.5rem]`) just för att kön aldrig ska trycka ned resten av sidan när inflödet är stort — klippet mitt i kort 4 ÄR scroll-affordansen.
- Bekräftade är ett REGISTER som VÄXER mot hela deltagarlistan (20–88 personer) och som dessutom redan ligger bakom en fällning. Ett scroll-fönster inuti en fälld sektion ger TVÅ LAGER AV INNESLUTNING för samma innehåll — Lotta fäller ut för att se registret och möts av ett titthål på tre kort. På mobil tillkommer nästlad touch-scroll (yttre sid-scroll mot inre listscroll), det klassiska scroll-trap-fallet.
- Fällningen är redan den plats-besparing scrollen skulle ge. Att bära båda är att lösa samma problem två gånger.

Motargumentet som ska vägas: ett utfällt 88-personers-register gör sidan mycket lång, och markera-lägets batch-bar hamnar då långt från de kort som markeras längst ned (baren scrollar bort). Om Marcus väljer scroll är det den kostnaden som köps bort. Alternativ som INTE är scroll: sticky batch-bar inom sektionen, eller att registret får sin egen sida/vy vid stora antal.

MARCUS AVGÖR. Faller beslutet på scroll måste `DeltagarListan` parametriseras: `rullande` bär idag `aria-label="Obekräftade anmälningar"` hårdkodat (rad ~997) — etiketten måste följa sektionen, annars ljuger tabb-stoppet för skärmläsaren.

### A2. VILKEN UPPSÄTTNING BATCH-HANDLINGAR SKA REGISTRET BÄRA?

Kandidater ur Åtgärder-listan: skicka eventinfo · skicka betalningspåminnelse · markera anmälningsavgift som betald · markera slutbetalning som betald. Frågan är vilka som är faktiskt VETTIGA på ett urval — och inventeringen visar att de tre skiljer sig kraftigt i vad de kostar att bygga. Detta är beslutsunderlag, inte ett beslut:

- **Markera betald (avgift / slutbetalning)** — BILLIGAST. `useSetPaymentStatus` (`src/data/mutations/registrationPayments.ts:78`) finns per anmälan med optimistisk cache-patch och `update-registration-*`-operationen. En batch är N upprepningar av en befintlig operation. Vakt: Airtable-takten (5 req/s, samma gräns som noterades i 18.19) och att `Ej relevant` aldrig skrivs av UI:t — urvalet får inte råka platta till föreläsnings-semantiken. Öppen delfråga: en knapp per betalningstyp, eller en knapp med typval?
- **Betalningspåminnelse** — INTE en trivial batch. Dagens väg (`useLogPaymentReminder`, rad 195) är MAILTO: Påminn-klicket öppnar Lottas mailklient och antecknar samtidigt tidsstämpeln i betalningens additiva fält. Sex markerade personer kan inte bli sex mailto-öppningar, och en mailto med sex mottagare bryter person-adresseringen och gör påminnelsen till ett massutskick. En delmängds-påminnelse förutsätter alltså server-side-utskick (18.6:s EF-mönster, som mutations-docblocket redan pekar ut som den framtida vägen) — det är en write-vertikal, inte en UI-koppling. Marcus bör veta att detta val är det dyra.
- **Skicka eventinfo** — mitt emellan. Bulk-utskicks-EF:en finns (`supabase/functions/send-email`, ADR-067, allowlist + idempotensnyckel + nonprod-guard, byggd för segment-utskick), men det finns ingen eventinfo-operation: varken mall/innehåll eller skrivningen av `Deltagarinfo skickad`-tidsstämpeln. PRD task-18 lägger auto-utskickets MOTOR utanför omfattningen (§Utanför omfattningen, beslut 14) — en MANUELL "skicka eventinfo till markerade" är inte samma sak som motorn, men gränsen måste dras öppet och inte antas.

Not: "skicka bekräftelse" hör INTE hemma i registret — bekräftelsen är per definition redan skickad för alla i det (ORDLISTA-semantiken, K53).

### A3. VAD HÄNDER MED ÅTGÄRDS-RADERNAS ALLT-ELLER-INGET-FORM?

`Atgarder.tsx` bär sex numrerade rader; nummer 2–5 är `aria-disabled` (facit-form utan flöde). När delmängds-vägen finns i sektionen är radernas status oklar:

- (a) **KVAR som de är** — "till alla obetalda" är en egen, snabbare handling än att markera tjugo kort.
- (b) **GENVÄGAR** — raden öppnar markera-läget på Bekräftade med rätt urval förvalt (t.ex. alla obetalda markerade), och Lotta avmarkerar det som inte ska med. Delmängden blir default-vägen; raden blir en start-punkt i stället för en avfyrning. Detta bevarar Åtgärder-listans referentbarhet (numrerade rader, Gunilla-principen, 18.15) utan att duplicera write-vägen.
- (c) **RIVS** — handlingarna bor där urvalet syns, punkt.

Kopplat: rad 2 ("Skicka bekräftelsemail till obekräftade") är i praktiken redan ersatt av task-48:s markera-läge, och docblockets not "kopplas i 18.6" är inaktuell. Oavsett vilket beslut som fattas för 3–5 behöver rad 2 sin form avgjord i samma landning — annars står en aria-disabled rad kvar som pekar på ett flöde som redan finns någon annanstans. RIVNINGAR BOKFÖRS ÖPPET (18.3/18.15-precedenten).

Numreringen 1–6 är byggkrav i 18.15 och "ändras ej" — rivs eller ändras rader måste numren och deras referentbarhet hanteras uttryckligen.

### A4. VILKA §19-INTENTS BÄR DE NYA HANDLINGARNA?

§19:s grön-knapp-regel: NÅR UTOMSTÅENDE ⇒ `success`; INTERNT (skriver bara i systemet) ⇒ `primary`. Obekräftades bar bär `success` SOLID eftersom bekräftelsen når utomstående och baren är blockets primära handlingsyta (emphasis följer YTAN, inte handlingen — inget undantag, regeln tillämpad).

Tillämpad på kandidaterna faller det ut så här — Marcus kvitterar eller vänder:

- Markera betald ⇒ `primary` (ren intern statusskrivning, ingen mottagare).
- Skicka eventinfo ⇒ `success` (mail till deltagare).
- Skicka betalningspåminnelse ⇒ `success` (mail till deltagare) — men om mailto-vägen består är avfyrningen "öppna Lottas mailklient", vilket är en gränsform: den NÅR utomstående först när Lotta trycker skicka i klienten. Dynamisk-intent-mönstret (§19: intenten följer vad trycket GÖR) är det som ska vägas här.
- Markera alla / Rensa ⇒ oförändrat `secondary` respektive `ghost` (står utanför emphasis-dimensionen).

BLANDAD BAR ÄR DEN VERKLIGA FRÅGAN: bär registret både en `success`- och en `primary`-handling står två solida knappar bredvid varandra i samma bar, och §19:s "max EN solid per yta" träffar. Möjliga upplösningar: en solid (den primära handlingen) + övriga `outline`/`subtle` i sin egen intent · eller en handlings-meny i stället för en knapprad. Detta är designfråga, inte implementationsdetalj.

## B. TVÅ FRÅGOR UR INVENTERINGEN (Code-fynd — rekommendation lämnad, Marcus kvitterar eller vänder)

### B1. TVÅ SAMTIDIGA MARKERA-LÄGEN?

`useMarkeringsLage` registrerar sin Esc-lyssnare på DOKUMENT-nivå (Deltagare.tsx ~394) — medvetet, eftersom läget äger hela kön och fokus kan stå på vilket kort som helst. Två aktiva lägen ger då två lyssnare: ett Escape stänger BÅDA, och Lotta tappar ett urval hon inte rörde. Dessutom står två batch-barer samtidigt på sidan med var sin live-region.

REKOMMENDATION: ömsesidig uteslutning — att öppna det ena stänger det andra (samma regel som `vaxlaFilter` redan tillämpar: läget är bundet till sin yta, försvinner ytan stängs det). Alternativet, ett gemensamt läge över båda sektionerna med ETT urval, är en annan produkt: då blandas kö och register i samma batch och handlingsuppsättningen blir tvetydig.

### B2. FÄLLNINGEN × LÄGESÖPPNAREN — FORCE-OPEN-LAPPEN ÅTERVÄNDER

Review-våg 2 rev en lapp: Markera-knappen force-öppnade Obekräftade-panelen (`setOppna(... obekraftade: true)`) eftersom läget annars kunde startas i en kollapsad yta. Lappen kunde rivas för att kön inte längre går att stänga. Bekräftade ÄR fortfarande fällbar — samma lapp uppstår alltså på nytt här, med samma dolda kostnad. `GruppRubrik` klarar formen (handling-sloten är syskon till toggle-knappen, L303 hålls), men beteendet måste avgöras.

REKOMMENDATION: Markera-knappen renderas ENDAST när sektionen är utfälld. Läget kan då aldrig startas i en osynlig yta, ingen lapp behövs, och lägesöppnaren står bredvid chevronen först när det finns något att markera. Alternativ: force-open vid aktivering (lappen tillbaka), eller att fällningen rivs även här (men den betalar för sig i registret — det var hela review-våg 2:s poäng).

## C. TEKNISK INVENTERING — VAD FINNS, VAD MÅSTE GENERALISERAS

Allt i `src/components/events/detail/Deltagare.tsx` om inget annat anges.

- `useMarkeringsLage(kandidatIds)` — REDAN GENERISK. Tar kandidat-ID:n, äger läge + urval + sanering + Esc. En instans per sektion räcker (se B1).
- `MarkeringsBatchBar` — HÅRDKODAD mot bekräftelse-handlingen: knapptext "Bekräfta N anmälningar", `Mail`-ikon, `intent="success"`, dialog-titel "Skicka bekräftelse?", brödtext om bekräftelsemail, och breddlåsets osynliga platshållare "Bekräfta 99 anmälningar". Måste generaliseras till en HANDLINGS-uppsättning (etikett-funktion, ikon, intent, dialogtext, mutation) — Marcus SKA-krav på djupa moduler gäller: anroparen säger vad som ska hända, aldrig hur. Breddlåset (osynlig tvåsiffrig maxform + `tabular-nums`) och live-regionen är generiska och ska ÖVERLEVA generaliseringen, inte skrivas om per handling.
- `MarkerbartKort` / `KortInnehall` — generiska. `vald` styr att Obekräftad-pillen viker; på ett bekräftat kort finns ingen sådan pill, så grenen är no-op där. WCAG 1.4.1-bäraren är KANTEN (`--mm-success`, mätt 5,6:1 mot vitt; `contrast-more` i vardera grenen) — den bär oförändrat även utan pill-växling. RÖR INTE kanten.
- `DeltagarListan` — `markering`-propen finns. `rullande` bär hårdkodad `aria-label="Obekräftade anmälningar"` och `testId` — båda måste följa sektionen om A1 faller på scroll.
- `GruppRubrik` — två former sedan review-våg 2 (FAST utan `onToggle` för kön, FÄLLBAR för registret). `handling`-sloten fungerar i BÅDA formerna; ingen ändring krävs för att sätta en lägesöppnare på den fällbara raden.
- Filtergrenen (`traffar != null`) renderar en platt `DeltagarListan` utan gruppering och `vaxlaFilter` stänger markera-läget. Den invarianten ÄRVS oförändrad — inget markera-läge i filtrerad vy.
- Mutationer: `useSetPaymentStatus` · `useUpdatePaymentNote` · `useLogPaymentReminder` (mailto) i `registrationPayments.ts` · `useConfirmAll` (enda äkta bulk-operationen, `registrationConfirmation.ts:142`) · ingen eventinfo-operation finns.
- §19 (`docs/specs/DESIGN-SYSTEM-SPEC.md` rad 1391–1512) är nyligen amenderad med LÄGESÖPPNAR-UNDANTAGET: en knapp som försätter sektionen i ett annat läge är sektionens primära kontroll och bär `solid`; utgången bär `subtle` på samma plats. Markera/Avbryt på Bekräftade ärver exakt den formen — ingen ny regel behövs för själva lägesöppnaren.

## D. LEVERANSFORM

- Skivning görs EFTER besluten (`/to-issues` på detta kort). Blir handlingsuppsättningen i A2 stor — särskilt om påminnelsen kräver en egen write-vertikal — är det två skivor: (1) markera-läget + generaliserad batch-bar + de billiga handlingarna, (2) den dyra write-vertikalen.
- Design-review MOT S73-facit gäller (DoD #5) — men facit har ingen bild av det här läget: markera-läget föddes i S86-prototypen efter S73. Bedömningsunderlaget är därför S86-facitets form ÖVERFÖRD till registret, inte en facit-bild. Avvikelser bokförs öppet, som i task-48.
- Visual-baselines driftar avsiktligt → refresh i T87:s aktiveringssteg (samma läge som task-48).
- Tvåstegs-stängningen (K61.1/T75) och path-scopad add gäller som vanligt.

Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112. Motiv: explicit ersatt av TASK-145 (citat i dess text, verifierat verbatim mot disk, rad 138). Ingen divergens funnen — belägget håller exakt som uppdraget beskrev.

OBOCKAT MED AVSIKT: förkastat (wontfix) — explicit ersatt av TASK-145; AC ogiltigförklarade av dess text.
<!-- SECTION:NOTES:END -->
