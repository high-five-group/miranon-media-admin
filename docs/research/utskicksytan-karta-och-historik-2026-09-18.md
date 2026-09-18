---
owner: marcus803
updated: 2026-09-18
review_by: 2026-12-18
status: draft
---

# Forensik: bulkåtgärder + bilagor, och utskicks-block-ytorna

**Modell:** Sonnet 5 (claude-sonnet-5), read-only forensikpass i `/Users/marcus/Repon/miranon-media-admin`.
**Datum:** 2026-09-18. `git status --porcelain` bekräftat tomt (rent träd) vid start OCH vid avslut. Inga filer ändrade.

---

## A. Kodkarta — vad kan appen i dag

### A1. Hemvyns bulkåtgärder

Två knappar på `/hem` (`src/components/hem/Hem.tsx`), byggda i `BulkAtgardsknapp.tsx`:

- **"Bekräfta alla"** — `NyaAnmalningar.tsx:233`, `onBekraftaAlla` → `Hem.tsx:379` `setAktivtSvep('bekraftelse')`.
- **"Skicka påminnelse till alla"** — `ForfallnaBetalningar.tsx:221-223`, `onSkickaPaminnelseAlla` → `Hem.tsx:419` `setAktivtSvep('paminnelse')`.
- En tredje väg finns men har ingen egen knapp: **Bevakningsraden** (eventinfo-rader) öppnar samma mekanism per event — `Hem.tsx:364-370` `onOppnaEventinfo` → `setAktivtSvep('eventinfo')`.

Alla tre öppnar **samma överlay-komponent**, `SvepOverlay.tsx` (renderad i `Hem.tsx:443-525` inuti ett delat `<Modal>`). Detta är EN egen sändyta ("svepet"), skild från Åtgärds-sidan — se ADR-114.

**Vägen skiljer sig strukturellt från per-event-vägen:** Åtgärds-sidan (`AtgardsSida.tsx`) är per-event; svepet är cross-event men sänder **ett anrop per event-grupp under huven** (ADR-114 beslut 3). Klientkoden för detta: `src/data/mutations/svepSend.ts:64-138`, `useSendSvep()`:

```ts
// svepSend.ts:70-81
mutationFn: async ({ svepTyp, eventGrupper, amne, mailtext }) =>
  Promise.all(
    eventGrupper.map(async (grupp): Promise<SvepGruppUtfall> => {
      const result = await dataSource.sendActionEmail({
        actionType: svepTyp,
        eventId: grupp.event.id,
        registrationIds: grupp.mottagare.map((r) => r.id),
        amne: amne(grupp),
        mailtext: mailtext(grupp),
        idempotencyKey: crypto.randomUUID(),
      });
      ...
```

**Exakt var bilagestödet bryts — det är INTE en EF-vägg.** `SendActionEmailInput` (`src/data/adapters/DataSourceAdapter.ts:23-43`, i `src/domain/schemas/SendActionEmail.schema.ts` konceptuellt) har sedan `TASK-147.5` (2026-08-10) ett valfritt fält `attachmentIds?: string[]`, och EF:en (`supabase/functions/_shared/send-action-email.ts:483-496`, `runActionSend`) väljer AUTOMATISKT den bilage-bärande grenen när listan är icke-tom. **`svepSend.ts` anropet ovan skickar aldrig `attachmentIds` alls** — fältet är utelämnat, inte tomt av misstag utan strukturellt frånvarande eftersom ingenting i sändytan (`SvepOverlay.tsx`, `Forhandsvisning.tsx`, `Adresslista.tsx`) samlar in ett bilageval. Brottet sitter alltså **i klienten, i sändytans UI/state**, inte i EF-kontraktet eller i Airtable/Resend.

**Ytterligare skillnad mot Åtgärds-sidan:** i svepet är ämne/text **inte redigerbara**. `Forhandsvisning.tsx:35-67` renderar `amne`/`mailtext` som ren förhandsvisning (funktionsprops från `SvepOverlay.tsx:171-174`, som fyller mallen via `fyllPlatshallare` men aldrig exponerar ett `<TextArea>`). På Åtgärds-sidan (`AtgardsSida.tsx` `ArbetsYta`, rad ~1212-1362) KAN Lotta redigera ämne/text före sändning. Svepet är alltså mer begränsat på två axlar samtidigt: ingen bilaga, ingen textredigering.

### A2. Åtgärds-sidans bilagor (per-event, enda fungerande vägen i dag)

Fil: `src/components/events/atgarder/AtgardsSida.tsx`.

- **Väljaren:** `BilageValjare` (rad 1067-1196) — kryssruta + namn + storlek, ingen förvalslogik (`ArbetsYta`, `useState<Set<string>>(new Set())`, rad 1214).
- **Datakälla:** `dataSource.fetchEventAttachments(eventId)` (rad 1231-1234 och igen 1702-1705) → EF `get-event-attachments`. **Bunden till ETT `eventId`** — det är själva grunden till att svepet (cross-event) inte kan återanvända komponenten rakt av.
- **Klasserna A (uppladdad) och B (event-mallad)** är odelbara i datat (ingen dokumentklass-signal i UI-listan, se docblock rad 370-378). **Klass C (kvitto)** finns strukturellt inte i väljaren — kvitto genereras per mottagare vid sändtillfället, inte som en förberedd rad (rad 380-385).
- **Sändning:** `skicka()` (rad 1779-1810) skickar `attachmentIds: granskning.bilagor` rakt in i `sendActionEmail.mutate(...)` (rad 1791).
- **Vad gör det svårt att generalisera till N mottagare över flera event:** attachment-upplösningen på servern är HÅRT bunden till exakt ETT `eventId` per anrop (se A2-serverkoden nedan) — en bilaga kan aldrig bifogas på ett annat events utskick. Eftersom svepet redan gör ett sändanrop PER event-grupp (samma kontrakt), är detta inte en principiell vägg för svepet — men det betyder att en framtida bilageväljare i svepet måste vara **per event-grupp**, inte en global bilagelista för hela sändningen.

**Server-sidan (kontraktet svepet redan skulle kunna återanvända):**

- `supabase/functions/_shared/send-action-email.ts:475-496` — `runActionSend`: `input.attachments` icke-tom ⇒ `runActionSendWithAttachments` (bilage-bärande, loopad singelsändning); annars `runActionSendBatch` (Resend `/emails/batch`).
- `supabase/functions/send-action-email/index.ts:290-329` — `resolveAttachments(rawIds, eventId, corsHeaders)`: för VARJE `attachmentId` läses Bilagor-raden, och **`eventIds.includes(eventId)` MÅSTE hålla** (rad 304-310) — annars 400 `"Attachment X does not belong to event Y"`. Detta är en avsiktlig fail-closed-vägg ("en bilaga från ETT event kan aldrig bifogas på ETT ANNAT events utskick", kommentar rad 282-283).
- Storage-path är deterministisk `${eventId}/${lagringsnyckel}` (`makeRealAttachmentReader`, `send-action-email/index.ts:254-268`).
- Bilagornas Content-Type härleds ur filändelse (`deriveContentType`, `_shared/send-action-email.ts:206-208`) — alla bilagor är PDF i dag.

**Öppen, ej fullt verifierad kant (flaggas, inte påstådd som fakta):** sedan `TASK-338`/ADR-125 kan en bilaga ha `Räckvidd = Gemensam` och matchas mot FLERA event via Kursfamilj/Kursnivå/Plats i `get-event-attachments` (union-hämtning, `data-model.md` rad 457-474). Men `Bilagor.Event`-länken sätts enligt `data-model.md`/ADR-125 alltid till **origin-eventet** vid skapelsen ("Event sätts alltid oavsett räckvidd"). Jag har INTE verifierat om `resolveAttachments`s `eventIds.includes(eventId)`-kontroll (ovan) därmed avvisar en Gemensam-bilaga när den skickas för ett ANNAT event än det den ursprungligen laddades upp mot — det skulle i så fall vara en existerande, odokumenterad spärr mot att sända "delade" bilagor på icke-ursprungseventet, oavsett bulk eller inte. Kräver ett eget, riktat pass (kodläsning av `linkedIds()` + ett skarpt testfall) för att avgöra.

### A3. Varje utskicks-block (ämne + brödtext) i appen

Tre distinkta förekomster, **INTE en delad komponent** — men två av de tre delar en delad MALL-datakälla:

1. **`AtgardsSida.tsx` → `ArbetsYta`** (rad 1201-1378). Fyra åtgärdstyper (`bekraftelse`/`paminnelse`/`eventinfo`/`fritt`), var och en med redigerbar ämnesrad + `TextArea` (rad 1287-1362) + `BilageValjare`. Källa till förval-text: `ATGARDER`-arrayen i `src/components/events/atgarder/atgardsmallar.ts:48-73` — **HÅRDKODAD** ("Prototyp-stubb… Ingen mall-datakälla finns ännu", `atgardsmallar.ts:33-36`). Platshållare (`fyllPlatshallare`, `atgardsmallar.ts:106-130`): `{förnamn}` `{event}` `{datum}` `{ort}` `{deadline}` — FEM stycken, inga fler.
2. **`SvepOverlay.tsx` → `Forhandsvisning.tsx`** (svepet på Hem). **Återanvänder SAMMA `ATGARDER`/`fyllPlatshallare`** ur `atgardsmallar.ts` (importerat `SvepOverlay.tsx:4`), men texten är **inte redigerbar** i denna yta (ren förhandsvisning, se A1).
3. **`src/components/segment/SegmentMailCompose.tsx`** (monterad i SegmentBuilder, "Mer"-sidan/segmentsidan). **HELT FRISTÅENDE FORM** — egen `Input`(ämne)/`TextArea`(meddelande), rad 185-204, ingen platshållar-motor, ingen koppling till `atgardsmallar.ts`, ingen bilageväljare. Sänder till ett SPARAT SEGMENT (inte ett event-bundet urval) via `dataSource.sendEmail`/`useSendSegmentMail` (ADR-067 D2, Resend `/emails/batch`).

**Svar på "delad komponent eller kopior":** (2) delar mall-DATA med (1) men inte UI-komponent; (3) är en tredje, obesläktad implementation med egen sändväg, eget kontrakt (`MailPayloadSchema`/segment) och egen sändknapp-UX (skriv-för-att-bekräfta-modal). Det finns alltså i dag **tre separata "skriv ämne + brödtext"-ytor**, av vilka två (1 och 2) delar mallinnehåll men olika redigeringsmöjlighet, och en (3) är helt egen.

### A4. Hur mail skickas tekniskt

- **EF:er som anropar Resend:** `send-action-email` (åtgärdsutskick, `_shared/send-action-email.ts`), `send-email` (segment-bulk, ADR-067 D2), `send-registration-confirmation`, `send-receipt-email`. Ingen Resend-mall (template ID) används någonstans — all HTML byggs i kod.
- **HTML-skalet:** server-side `renderFor()` (`_shared/send-action-email.ts:416-436`) → `renderHtml(text)` (enkel text→HTML, ingen React Email, inget rikt mallspråk). Klientens `fyllPlatshallare` (`atgardsmallar.ts`) och serverns `action-mail-template.ts` är **medvetet speglade dubbletter** (samma platshållarlogik, olika runtime — Vite vs Deno — kommenterat i `action-mail-template.ts:1-16`), inte en delad modul.
- **React Email:** inte använt i repot (`grep` för `react-email`/`@react-email` gav noll träffar).
- **Avsändare/reply-to:** ej djupdykt i detta pass (utanför uppdragets kärnfråga) — flaggas som EJ VERIFIERAT.
- **Loggning:** `get-mail-log`/`Utskickslogg` (segment-vägen, ADR-067 D7) samt aktivitetsloggen (`log-activity`, `recordActivity`) — svepet loggar en aktivitetsrad PER FAKTISKT SKICKAD MOTTAGARE (`svepSend.ts:100-119`).
- **Mail-låset:** `.mail-lock-policy.conf` + `scripts/deny-resend-send.sh` — TVÅ lager (settings.json `permissions.deny` + hook) som hindrar **Code/agenter** från att skicka riktigt mail via Resend-MCP eller sänd-endpoints (Marcus-krav, TASK-137, S96 Del 10). Detta är en agent-säkerhetsspärr, INTE en produktionsspärr för appen.
- **`UTSKICK_SPARR`:** `isUtskickSparrat()` (`_shared/send-bulk.ts:46-57`), läses PER ANROP i varje sändväg (`send-action-email.ts:254-258`, `confirm-registrations.ts:97`, `send-bulk.ts:124`, `send-receipt.ts:76`) — en miljövariabel som blockerar ALLA utskick oavsett väg när satt till något annat än `'av'`. Marcus-flippbar spärr, oberoende av bulk/enkel.

---

## B. Historik — "vad har vi sagt om detta innan?"

### B1. Punkt 2 (bilagor i bulk) — svar: **aldrig explicit diskuterat i den kombinationen**, trots att bilage-infrastrukturen fanns innan svepet byggdes

**Tidslinjen är entydig och källmärkt:**

- `TASK-147.5` ("Bilage-bärande sändvägen + bilageväljaren skarp") landade **2026-08-10** (`backlog/tasks/task-147.5 - Skiva-Bilage-bärande-sändvägen-bilageväljaren-skarp.md`, `created_date: '2026-08-10 07:01'`, status **Done**). Attachment-kontraktet (`attachmentIds`, `runActionSendWithAttachments`) existerade alltså redan i `send-action-email` innan svepet ens var speccat.
- `task-241` (PRD "Sveparna") föddes **2026-08-16** — grillad i S102 Del 8 samma dag (`tasks/sessions/archive/2026-08/2026-08-10-session-102.md:559-582`). Grillnings-referatet beskriver trygghetstriaden i detalj ("adresslista grupperad per event · per-event-preview bläddringsbar · testmail") — **bilagor nämns inte en enda gång** i hela Del 8.
- ADR-114 ("Svep-formen — hem pekar, svepet skickar", 2026-08-16, Accepted) — 68 rader, **noll träffar på "bilag"** vid `grep`.
- `task-241` PRD § Utanför omfattningen (rad 47-50) listar explicit: *"Nya mailmallar eller mallredigering."* — men säger **ingenting om bilagor**, varken i scope eller uttryckligen utanför.

**Klassning: ÖPPEN FRÅGA / GENUIN LUCKA, inte ett fattat och sedan glömt beslut.** Ingen tråd (`tasks/threads/README.md`), inget ADR, ingen PRD-rad säger "bilagor i svepet är avsiktligt uteslutna." Grillningen som satte formen hände utan att frågan restes, trots att den tekniska förutsättningen (`attachmentIds`) redan fanns på disk sex dagar tidigare.

**Relaterat men INTE samma fråga — T180 (öppen tråd, `paused`):**

> `tasks/threads/README.md:223`: *"Kvitto som bilagetyp i åtgärdssidans utskicksflöde (Marcus fynd S113 Del 14)**— Lotta lär vilja bifoga deltagarinfo + personlig text när kvitton skickas; orkestrerarens vändning: utskicksmekaniken ska INTE in i inkorgen, kvittot blir bilagetyp i befintligt flöde. Grillnings-kandidat post-promovering."*

Detta handlar om klass C (kvitto) som bilagetyp i det EXISTERANDE per-event-flödet — inte om bulk. Ingen koppling till svepet är bokförd.

**Kostnads-/tröskelresonemang som REDAN finns och är direkt återanvändbart** (inte om svepet specifikt, men om den bilage-bärande sändvägens kostnad generellt):

> ADR-120 (`docs/decisions/ADR-120-e-postleverantoren-resend-medvetet-valt.md`, rad 88-97), "Bytes-triggern": *"Ett bilage-bärande utskick passerar **~200 mottagare** — då börjar loopen kosta på riktigt (~20 s sekventiellt)."* Och: *"Den tysta bilage-förlusten kräver en VAKT, inte ett leverantörsbyte."*
>
> `docs/research/post-send-tillstandet-bulkutskick-2026-08-08.md:231,250`: den bilage-bärande vägen är "ETT `/emails`-anrop per mottagare" och *"regelmässigt gör den bilage-bärande vägen längre än ~10 s"* — resonemang om att UI:t då bör bära ett förklarande textläge, skrivet FÖRE svepet fanns.

Den ursprungliga D9-revisionen av ADR-067 (`docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md:141-225`, 2026-08-10) är den **auktoritativa, source-belagda förklaringen till VARFÖR bilagor och bulk krockar över huvud taget**, citerad ordagrant:

> *"Research-passet bakom `task-147` fällde att Resends `/emails/batch`-ändpunkt … **inte stödjer bilagor** — och bristen är **TYST**: en bilaga i payloaden försvinner utan felmeddelande, mailet går fram, svaret ser accepterat ut."*
>
> backlog task-147 (PRD, rad 77): *"**SÄNDVÄGEN MÅSTE GRENAS I TVÅ. Detta är kortets farligaste detalj.**"*

Detta ÄR svaret på "vad har vi sagt om detta innan" i teknisk mening — men det gäller ARKITEKTUREN bakom attachment-stödet i allmänhet (byggt för Åtgärds-sidan), inte ett beslut om huruvida svepet ska ärva den.

### B2. Punkt 3 (mallväljare/mall-editor) — svar: **JA, explicit uppskjutet minst två gånger, samma formulering ("uttryckligen senare")**

> `backlog/tasks/task-147 - PRD-Åtgärds-sidan…md:119` (§ Utanför omfattningen): *"**Mall-editor** för systemmallar — uttryckligen senare."*
>
> `backlog/tasks/task-147.3 - Skiva-Påminnelse-eventinfo-och-fritt-utskick.md:20`: *"Redigerbar ämnesrad + brödtext följer med per utskick; malltexterna är systemkonstanter (**mall-editor uttryckligen senare**, PRD § Utanför omfattningen)."*
>
> `backlog/tasks/task-273 - PRD-UI-fixpaketet-S107.md:53` (2026-08-17, § Utanför omfattningen): *"Sidbytesindikatorn · **mall-editor (mallarnas fasta innehåll kvarstår)** · universella bilagor (egen grillning) · segment-sändytans wiring (task-271) · utskicks-spärren (eget kort task-274) · bas-datafixarna."*

**Ett konkret, tidigare Marcus-beslut som direkt föregriper dagens fråga — han valde att DÖLJA problemet i stället för att bygga editorn, en gång redan:**

> `task-273`, rad 39: *"Åtgärdssidans 'Mallar.'-not (PrototypNot) tas bort per Marcus order 2026-08-17. Notens sakpåstående är verifierat SANT (**standardmallarnas text är fast i koden**; Ändra-knappen redigerar bara det enskilda utskicket) — borttagningen är ett medvetet val att inte visa metatexten, inte en rättelse av ett felaktigt påstående."*

Dvs: appen hade tidigare en synlig text på Åtgärds-sidan som ärligt sa "mallarna är hårdkodade", och Marcus lät ta bort den texten (kosmetiskt) snarare än att bygga editorn (funktionellt) — **2026-08-17**, en månad och en dag före dagens fråga.

**Klassning: UPPSKJUTET, upprepat minst två gånger, med en tredje instans där uppskjutandet aktivt förstärktes (metatexten togs bort).** Det finns ingen ADR eller tråd som låser VARFÖR editorn sköts upp — bara den återkommande, korta noteringen "uttryckligen senare" utan motivering utöver att den var utanför respektive skivas omfattning.

**Angränsande, redan REALISERAT "mall"-koncept som INTE är samma sak — risk för sammanblandning:** ADR-125 (2026-08-23) byggde en redigeringsyta för **dokumentinnehåll** (Eventinnehåll/Platser/Agendapunkter — "Mer får två rader", § 7) för PDF-BILAGORNAS text (bekräftelsebilaga/deltagarinformation). Det är en mall-editor, men för **dokumentmallar**, inte för **mail-ämne/brödtext**. `task-146.5` AC#2: *"Mallen är INTE redigerbar i v1 — mall-editorn ligger uttryckligen senare"* — samma "uttryckligen senare"-formulering, men om PDF-mallens layout, en annan yta än den Marcus nu pekar på (utskicks-blocken).

**Ett tredje, angränsande spår — "universella bilagor" (Marcus egna ord, ur S107):**

> `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:54-55`: *"**Spår 3 — grillningar:** universella bilagor (**Marcus svar 7: "behöver vi grilla så får vi grilla"**) · utskicks-spärren/flippen … · segment-sändytan task-271 vid behov."*

Detta blev senare `task-275` ("PRD: Bilagornas räckviddsmodell", byggd via ADR-125 § "Gemensam"-räckvidden) — men den frågan handlar om VILKA EVENT en bilaga gäller för (spridning), inte om huruvida en bilaga kan bifogas på ETT utskick till FLERA mottagare/event samtidigt (bulk). Relaterad terräng, annan fråga.

### B3. Sökningen som INTE gav träff (redovisat ärligt)

Sökte efter (grep, restriktivt till `tasks/`, `docs/`, `backlog/`, exkl. `.claude/worktrees`): `bulk.*bilag`, `svep.*bilag`, `attachmentIds` i sessionsdok/trådar, `universella bilagor`, `mallväljare`, `mall-editor`, `Resend template`/`Resend-mall`. **Ingen tidigare Marcus-formulering av exakt "bulkåtgärderna på hem kan inte användas eftersom bilagor saknas" hittades** — varken i arkiverade sessionsdok (2026-06 till 2026-09-17), i `tasks/marcus-listan.md`, i `tasks/s91-restlistan.md`, eller i trådregistret. Den nu aktuella sessionen (`tasks/sessions/2026-09-17-session-126.md`) innehåller heller ingen sådan diskussion. Slutsats: **Marcus minne av "vi har pratat om detta" pekar sannolikt på de två släktingfrågorna ovan (bilage-arkitekturen/ADR-067 D9, och mall-editorns upprepade uppskjutning) snarare än på en tidigare, ordagrann diskussion om just BULK+BILAGA-kombinationen**, som tycks vara en genuint ny observation — möjliggjord av att TASK-416 (S123, landad 2026-09-07) precis färdigställde prestanda/laddläge för den EXISTERANDE bilageväljaren på Åtgärds-sidan, vilket kan ha gjort kontrasten mot svepets avsaknad synligare för Marcus i prod.

---

## C. Syntes

### C1. Rakt svar: vad har vi sagt om detta innan?

- **Om bilagor i bulk specifikt:** Ingenting. Genuin lucka — aldrig grillad, aldrig i något PRD:s scope-lista (varken in eller ut), trots att den tekniska förutsättningen fanns sex dagar innan svepets PRD föddes.
- **Om mall-editor för mail-ämne/brödtext:** Uppskjutet minst två gånger med identisk formulering ("uttryckligen senare"), och en gång aktivt förstärkt genom att den ärliga "mallarna är hårdkodade"-texten togs bort ur UI:t i stället för att byggas bort (Marcus order 2026-08-17).
- **Angränsande, redan avgjorda/delvis byggda spår som INTE är samma fråga:** dokumentmallarnas (PDF-bilagornas) editor (ADR-125, delvis byggd), bilagornas räckviddsmodell/"universella bilagor" (task-275, byggd), kvitto-som-bilagetyp i per-event-flödet (T180, paused).

### C2. Options-rymd — bilagor i bulk

**Option 1 — Per-event-grupp-bilageväljare i svepet (naturlig förlängning av befintlig arkitektur).**

- Bygger på: `svepSend.ts:70-81` gör redan ETT anrop per `eventGrupper`-post med `eventId: grupp.event.id`. Server-kontraktet (`attachmentIds`, `runActionSend`-grenvalet) är redan generellt. Enda saknade biten är klient-UI: en `BilageValjare`-liknande komponent per event-grupp i `SvepOverlay.tsx`/`Forhandsvisning.tsx`, plus att `svepSend.ts` måste föra igenom ett `attachmentIds`-val PER GRUPP (i dag finns ingen sådan state alls).
- Kostnad: en UI-utökning (bläddringsbar väljare, en per event i triaden) + att `amne`/`mailtext`-funktionerna i `SvepOverlay.tsx:171-174` får en syskonfunktion för bilage-urval per grupp. Ingen ny EF.
- Väggar: `resolveAttachments` (`send-action-email/index.ts:304-310`) kräver att varje vald bilaga är länkad till EXAKT det event-ID gruppen sänder mot — så bilagevalet MÅSTE vara scopat per event, aldrig en global lista för hela svepet. Grupper med bilagor faller automatiskt på den bilage-bärande (långsammare, sekventiella) sändvägen; grupper utan förblir på batch-vägen — det här sker redan automatiskt server-side (`runActionSend`, `attachments.length>0`-grenen).
- Detta är den väg som ligger NÄRMAST golvet (minst ny mekanik, återanvänder ett redan byggt och testat kontrakt) snarare än spekulation.

**Option 2 — Gemensam bilaga för hela svepet (en bilaga, vald en gång, oavsett event).**

- Bygger på: `task-275`/ADR-125s "Gemensam"-räckvidd — en bilaga som redan är avsedd att gälla flera event.
- Kostnad: kräver att den OVERIFIERADE kanten i A2 (Gemensam-bilagans `Bilagor.Event`-länk vs. `resolveAttachments`s hårda eventId-koll) antingen redan fungerar eller löses — annars är detta blockerat av en existerande, odokumenterad EF-vägg för VARJE event utom origin-eventet. Måste verifieras/byggas om innan denna väg är trovärdig.
- Enklare Lotta-UX (ett val, inte N), men mindre flexibel om olika event i svepet egentligen borde ha olika bilagor.

**Option 3 — Begränsa bulk-med-bilaga till "samma event" (produktbeslut, inte bara teknik).**

- Bygger på: inget nytt — om ett svep råkar bara omfatta ETT event (vanligt för eventinfo-svepet, som redan är event-scopat, `Hem.tsx:505-523`/ADR-114 beslut om eventinfo som tredje sveptyp), kan Åtgärds-sidans HELA `BilageValjare`+sändväg återanvändas rakt av utan ny per-grupp-abstraktion.
- Kostnad: löser INTE Marcus kärnklagomål (bekräftelse-/påminnelsesvepen spänner typiskt över FLERA event samtidigt, det är hela poängen med svepet enligt ADR-114 § Kontext — "spänner över FLERA event samtidigt"). Skulle uppfattas som en halv lösning.

**Option 4 — Köad jobbmotor (à la S113:s jobbmotor, ADR-129).**

- Bygger på: `ADR-129-jobbmotorn-ko-cron-och-kick.md` finns redan i repot för ANNAT syfte (kvittojobb, se `KvittojobbBanderoll` i `Hem.tsx:427`, `jobb-konsument`-EF). En bulk-med-bilaga-sändning skulle kunna köas i stället för att köras synkront i en EF-request.
- Kostnad: klart störst — ny konsumtionslogik, nytt UI-tillstånd ("skickas i bakgrunden"), och enligt ADR-120s bytes-trigger (~200 mottagare / ~20s sekventiellt) är detta EXPLICIT bokfört som något att göra **vid en mätt tröskel, inte i förväg** ("Bytes-triggern skrivs ned i förväg … Vi byter när något av detta inträffar, inte tidigare och inte på känsla"). Att bygga en kö nu, innan volymen kräver det, är precis den spekulativa komplexitet över-engineering-vakten (CLAUDE.md) skär bort — FLAGGAS som sannolikt spekulation snarare än golv givet dagens volymer (enstaka–tiotal mottagare per morgonsvep, ej källmärkt exakt i detta pass men konsekvent med `ForfallnaBetalningar`/`NyaAnmalningar`s småskaliga radantal i UI:t).

**Airtable-/Resend-väggar som gäller, samlat:**

- Resend `/emails/batch` saknar TYST bilagestöd → grenad sändväg är obligatorisk för ALLA bilage-bärande vägar, bulk eller ej (ADR-067 D9). Detta är GOLV, inte förhandlingsbart.
- `resolveAttachments` kräver exakt event-match per bilaga (fail-closed) → bilageurval måste vara per-event-grupp i en cross-event-yta. GOLV, avsiktligt satt (rad 282-283).
- ~200 mottagare / ~20s-tröskeln (ADR-120) för den sekventiella singel-loopen — gäller identiskt oavsett om anropet initieras från Åtgärds-sidan eller svepet, eftersom det är SAMMA EF-mekanism.
- `docs/reference/airtable-constraints.md` gav inga direkta bulk-specifika bilage-gränser utöver de redan kända (5 GB/fil generellt, 5 MB direkt-uppladdning via API, 2h-utgående attachment-URL:er) — dessa är redan arkitekturellt kringgångna via Supabase Storage-hemvisten (ADR vid TASK-146), så de träffar inte sändvägen.
- Resends EGNA storleksgränser (per bilaga / total mailstorlek) är **INTE dokumenterade någonstans i detta repo** — jag har inte verifierat dem mot en auktoritativ källa i detta pass och flaggar dem som en öppen kunskapslucka, inte en känd vägg.

### C3. Hur punkt 2 och punkt 3 hänger ihop

**Ja, en mallväljare/mall-editor skulle direkt kunna påverka bilagefrågan — men bara om den designas för det, det följer inte automatiskt.**

- Nuvarande arkitektur (`atgardsmallar.ts`) blandar redan mall-TEXT (ämne/brödtext) och bilage-URVAL i SAMMA `Granskning`-typ (`atgardsmallar.ts:132-138`: `{ atgard, amne, text, bilagor }`) — men `bilagor` där är Lottas VAL vid sändtillfället (record-ID:n valda i `BilageValjare`), inte en egenskap HOS mallen. I dag "bär mallen inte sina bilagor" — Lotta väljer bilagor separat, varje gång, oavsett vilken av de fyra `ATGARDER`-typerna hon kör.
- Om Marcus mallväljare/mall-editor (punkt 3) byggs så att en SPARAD mall kan deklarera "bifoga alltid X" (t.ex. bekräftelsemallen bär alltid deltagarinformationen), skulle det:
  - Lösa en DELMÄNGD av punkt 2 (bulk-bekräftelse skulle automatiskt kunna bära rätt bilaga UTAN att Lotta väljer den varje gång) — men fortfarande inom samma per-event-grupp-vägg (mallen måste ändå resolvas mot varje event-grupps egna Bilagor-rader, se `resolveAttachments`).
  - INTE lösa fallet där Lotta vill välja EN GÅNGS-bilaga till ETT specifikt svep (t.ex. en tillfällig PDF som inte hör till någon mall).
- **Vad i nuvarande arkitektur talar FÖR sammankoppling:** `atgardsmallar.ts` är redan den delade källan för BÅDA Åtgärds-sidan och svepet (`SvepOverlay.tsx` importerar den rakt av) — en mall-editor som skriver till en riktig datakälla i stället för hårdkodade strängar skulle per automatik nå båda ytorna samtidigt, EXAKT som `atgardsmallar.ts`s eget docblock förutspår (rad 12-15: *"den dagen mallarna flyttar till en riktig datakälla byter BÅDA konsumenterna källa samtidigt, eftersom de delar denna fil"*). Det är alltså redan ett medvetet arkitektoniskt löfte att de två ytorna ska hänga ihop.
- **Vad som talar EMOT att lösa punkt 2 via punkt 3 allena:** `SegmentMailCompose.tsx` (den tredje utskicksytan) delar INTE `atgardsmallar.ts` alls — en mallväljare byggd bara ovanpå `ATGARDER` skulle inte nå segment-utskicket. Och: bilage-URVALET är i dag en Lotta-tidpunkts-handling (`BilageValjare`), inte en malldeklaration — att göra bilagor till en mall-egenskap är ett NYTT designbeslut, inte en implikation av att bara bygga en mallväljare för TEXT.

**Sammanfattning av kopplingen:** en mallväljare/mall-editor (punkt 3) är en förutsättning som KAN förenkla punkt 2 (särskilt om mallar får bära standardbilagor), men löser inte punkt 2:s kärnproblem (UI för att välja/resolva bilagor per event-grupp i en cross-event-yta) på egen hand. De bör grillas ihop om målet är "mallen bär sina bilagor", men kan också byggas oberoende av varandra: punkt 2 (per-event-grupp-bilageväljare i svepet) är byggbar OAVSETT om punkt 3 någonsin blir av, eftersom hela den tekniska förutsättningen (attachmentIds-kontraktet) redan finns och är oberoende av var mall-texten kommer ifrån.

---

## Läst material (fil:rad-nivå, urval av det viktigaste)

**Kod:**

- `src/components/hem/Hem.tsx` (hela, 1-533)
- `src/components/hem/BulkAtgardsknapp.tsx` (hela)
- `src/components/hem/NyaAnmalningar.tsx:5,105-116,233`
- `src/components/hem/ForfallnaBetalningar.tsx:4,89-119,221-223`
- `src/components/svep/SvepOverlay.tsx` (hela, 1-313)
- `src/components/svep/Forhandsvisning.tsx:1-80`
- `src/data/mutations/svepSend.ts` (hela, 1-139)
- `src/components/events/atgarder/AtgardsSida.tsx:1-489,1040-1378,1670-1810` (utdrag ur 2537 rader totalt)
- `src/components/events/atgarder/atgardsmallar.ts` (hela)
- `src/components/segment/SegmentMailCompose.tsx` (hela)
- `src/data/adapters/DataSourceAdapter.ts:320-420` (adapter-kontraktet, `sendActionEmail`/`sendActionTestEmail`/`sendReceipt`)
- `src/domain/schemas/SendActionEmail.schema.ts` (hela)
- `supabase/functions/_shared/send-action-email.ts:130-436,475-714` (utdrag ur 714 rader)
- `supabase/functions/send-action-email/index.ts:254-329` (utdrag ur 607 rader)
- `supabase/functions/_shared/send-bulk.ts:46-124` (utdrag)
- `.mail-lock-policy.conf` (huvud)

**Historik:**

- `docs/decisions/ADR-114-svep-formen-hem-pekar-svepet-skickar.md` (hela)
- `docs/decisions/ADR-125-bilagornas-modell-och-promoveringsvag.md` (hela)
- `docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md` (hela)
- `docs/decisions/ADR-120-e-postleverantoren-resend-medvetet-valt.md:70-100` (utdrag)
- `docs/research/post-send-tillstandet-bulkutskick-2026-08-08.md:1-60,220-260` (utdrag ur 590 rader)
- `docs/research/utskicks-bilage-arkitektur-2026-08-03.md:330-390` (utdrag)
- `tasks/sessions/archive/2026-08/2026-08-10-session-102.md:515-610` (Del 8, grillning 3) + rad 1-1800 grep-svept för "bilag"
- `tasks/sessions/archive/2026-08/2026-08-17-session-107.md:1-80`
- `tasks/sessions/2026-09-17-session-126.md` (grep-svept, ingen relevant träff)
- `tasks/threads/README.md` (grep-svept för "bilag"/"Sveparna"/"svepet"/"Bekräfta alla")
- `backlog/tasks/task-241 - PRD-Sveparna…md` (hela)
- `backlog/tasks/task-241.6 - QA…md` (grep-svept)
- `backlog/tasks/task-147 - PRD-Åtgärds-sidan…md` (utdrag, § Utanför omfattningen + implementationsbeslut)
- `backlog/tasks/task-147.1`, `task-147.3`, `task-147.5` (utdrag)
- `backlog/tasks/task-273 - PRD-UI-fixpaketet-S107.md` (hela)
- `backlog/tasks/task-275 - PRD-Bilagornas-räckviddsmodell.md` (metadata + grep)
- `docs/reference/data-model.md:151,171,254,321-474,2490-2498` (utdrag ur ~2500 rader)
- `ORDLISTA.md:276-305` (Bilaga, Räckvidd)
- `docs/reference/airtable-constraints.md:520-650` (utdrag, attachment-relaterade väggar)
- `tasks/todo.md` — grep med radnummer + selektiv Read (ALDRIG helfilsläsning, filen är för stor)

## Vad jag INTE hann/kunde verifiera

1. **Gemensam-bilagans faktiska sändbarhet på icke-ursprungsevent** (§ A2/C2 Option 2) — kräver läsning av `linkedIds()`-implementationen plus ett skarpt/mockat testfall mot `resolveAttachments`. Flaggat som öppen fråga, inte påstått som fakta.
2. **Resends egna gränser för bilagestorlek/total mailstorlek** — inte dokumenterade i repot; skulle kräva ett eget web-research-pass mot Resends förstapartsdokumentation (per CLAUDE.md-disciplinen "web-research är operationell 11/10-disciplin").
3. **Avsändare/reply-to-hantering** i sändvägarna — lästes inte djupt, utanför uppdragets kärnfråga.
4. **Fullständig genomläsning av `AtgardsSida.tsx`** (2537 rader) — endast riktade sektioner lästa (huvuddocblock, BilageValjare, ArbetsYta, GranskningsSida/skicka()); resten (t.ex. `PrototypRigg`-historik, ResultatVy-detaljer) skummades via grep, inte radläst.
5. **`tasks/todo.md`** (mycket stor fil, rad 7 ensam ~25 000 tecken) — endast grep-träffar och de senaste sessionsraderna lästa, ingen fullständig genomläsning.
6. **Exakt Marcus-citat "vi har pratat om detta tidigare"** kunde inte spåras till en specifik tidigare konversation i sessionsdoken — se § B3 för den ärliga nollträff-redovisningen och min bästa tolkning (sannolikt syftar han på de två släktfrågorna, inte en identisk tidigare diskussion).

## Git-status

`git status --porcelain` gav tomt resultat (rent arbetsträd) både vid passets start och vid dess slut. Inga filer skapade, ändrade eller committade i repot.
