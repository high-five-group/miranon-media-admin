---
owner: marcus803
updated: 2026-08-08
review_by: 2026-11-08
status: stable
---

# Post-send-tillståndet för manuellt bulk-utskick — vart hamnar användaren, och hur visas ett ärligt delutfall? (2026-08-08)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> oisolerat i huvudkatalogen. Committar inget.
>
> **Inventering FÖRE första sökningen** (per passets kontrakt):
> `grep` över `docs/research/`, `docs/decisions/` och `tasks/lessons.md` för
> `bulk|utskick|delutfall|partiellt|aria-live|toast|resultat` gav **inga
> tidigare research-pass** som täcker POST-SEND-tillståndet specifikt. Två
> träffar var relevanta men om andra frågor: `ADR-015` (superseded, aldrig
> byggd enkel-sänd) och `ADR-067` (bulk-mail-kontraktet, D3 om
> partial-failure-statusen — läst i sin helhet, se nedan, eftersom den styr
> vilka utfallsklasser servern överhuvudtaget KAN returnera).
>
> **Det som INTE saknades var internt precedent på KLIENT-sidan** — tre
> källor lästes i sin helhet som styrande kontext, inte som research att
> duplicera:
>
> - **`src/components/segment/SegmentMailCompose.tsx`** (rad 1–350) — den
>   enda LEVANDE bulk-sänd-ytan i appen idag. Uttryckligen kallad "baslinje,
>   aldrig genomdesignad" i uppdraget, men den bär redan en fungerande
>   `MessageBox`-baserad resultatyta med intent styrd av utfallsklass,
>   `aria-live="polite"` + `aria-busy` runt hela sänd-blocket, och stannar på
>   samma sida efter sänd (§ 1, § 3, § 5, § 6 nedan).
> - **`src/data/mutations/registrationConfirmation.ts`** (hela filen,
>   203 rader) — `useConfirmAll` + `bekraftelseUtfall`, den historiska
>   batch-bekräftelsen från eventsidan (task-48). Riven ur produktion vid
>   `TASK-145.3` (eventsidan skriver inte längre), men mönstret den kodar är
>   **exakt** task-147:s "ärligt delutfall"-krav: servern patchar bara de
>   ID:n den själv rapporterar som lyckade, resten ligger kvar. Detta är den
>   direkta koden bakom `tasks/lessons.md` L350 och L355 (§ 3, § 4 nedan).
> - **`docs/specs/ATGARDSSIDAN-UNDERLAG.md`** § 4 och § 9 — det styrande
>   underlaget för sidan. § 4 slår fast kravet ordagrant men uttalar sig
>   ALDRIG om den visuella/strukturella FORMEN på resultatet — det är precis
>   den lucka detta pass fyller.
>
> **`src/components/events/atgarder/AtgardsSida.tsx`** lästes för att
> verifiera uppdragets premiss — och den läsningen träffade FEL TRÄD.
> Passet körde oisolerat i huvudkatalogen och läste därför den version som
> ligger i `main`, där granska-steget mycket riktigt saknas. Passet skrev
> ursprungligen att knappen *"gör ANNARS ingenting — den ska öppna ett
> granska-steg som inte finns i koden än"* och kallade det verifierat.
>
> **Rättat 2026-08-08 av orkestreraren mot faktisk disk:** gransknings-vyn
> ÄR byggd, i sessionens egen worktree (`.claude/worktrees/s100-atgardssidan`,
> gren `docs/s100-paus-3`) — `GranskningsSida` landade i varv 19
> (`20bfae9c`, 2026-08-07) och justerades i varv 20 (`e9cb356b`). Båda är
> lokala commits, opushade per iterations-kadensen (`T126`), vilket är
> precis varför huvudkatalogen inte kunde se dem.
>
> **Slutsatserna påverkas inte,** och det är värt att säga varför i klartext
> hellre än att antyda det: passets fråga gäller vad som händer EFTER att
> sändningen avfyrats, och det steget saknas i BÅDA träden. Det som föll var
> premiss-verifikationen, inte underlaget för domen. Radhänvisningar till
> `AtgardsSida.tsx` i denna fil avser genomgående `main`-versionen och är
> alltså inte giltiga mot sessionens gren.
>
> **Klassen är värd att minnas:** ett research-pass som kör i huvudkatalogen
> kan inte se en sessions opushade arbete, och en "verifiering" mot fel träd
> läser som en verifiering i efterhand. Uppdrag som ber en agent pröva en
> premiss om KODENS TILLSTÅND måste peka ut vilket träd som är facit.
>
> Alla externa källor nedan är hämtade **2026-08-08** mot respektive källas
> nuvarande publicerade version — inga versioner pinnade i förväg.

## Frågan + beslutet den informerar

**Frågan:** vad händer i gränssnittet EFTER att ett manuellt bulk-utskick
avfyrats på åtgärds-sidan, och var hamnar Lotta?

**Beslutet:** formen på `GranskningsSida`/resultat-steget som ännu inte är
byggt — destination, in-flight-visning, delutfalls-presentation, urvalets
öde, beständighet och tillgänglighet. `TASK-147`:s § Estimat lägger
"förhandsvisning, pessimistisk körning och ärligt delutfall" i samma skiva
(7 av 11), så alla sex delfrågor hör till SAMMA formbeslut.

## Kort svar

**Stanna kvar på åtgärds-sidan; ersätt inte ytan och navigera inte bort.**
Detta är den entydiga slutsatsen av att korsa (a) GOV.UK Design Systems egen,
explicit formulerade regel för när en dedikerad bekräftelse-SIDA används
kontra en notifikations-BANNER på samma sida, (b) vårt eget send-kontrakts
tekniska verklighet (`ADR-067` D3: status är synkron vid SUBMIT, aldrig
leverans — det finns inget "fylls i över tid" att visa på en separat
rapportsida), och (c) den storleksklass task-147 opererar i (dussintal
mottagare, inte tusental). De sex delfrågornas svar, i korthet:

1. **Destination:** stanna kvar, ersätt formuläret med resultatet PÅ SAMMA
   yta (matchar redan `SegmentMailCompose`).
2. **Under körningen:** spärrad knapp + `aria-live="polite"`/`aria-busy`-text,
   ingen fokusflytt under själva väntan.
3. **Partiellt utfall:** återanvänd `MessageBox`-mönstret
   (intent per utfallsklass, ALDRIG grönt vid noll lyckade) + en text byggd ur
   räknarna, inte antagen — mönstret finns redan kodat två gånger i repot.
4. **Urvalets öde:** patcha ENDAST de ID:n servern rapporterar som lyckade;
   de fallna ligger kvar markerade. Redan PRD-krav (berättelse 12) och redan
   byggt en gång (`useConfirmAll`).
5. **Beständighet:** UI-resultatet får vara efemärt SÅ LÄNGE skrivningen är
   beständig (revisionslogg). En dedikerad historik-sida löser en fråga
   (engagemang över tid) vårt system ännu inte ens mäter.
6. **Tillgänglighet:** live-region under körning (ingen fokusflytt); vid
   UTFALL rekommenderar två oberoende källor (GOV.UK, Cloudscape) att även
   flytta VISUELL fokus till resultatet — det är NY konvention för denna
   kodbas, inte en bekräftad befintlig.

## 1. Destinationen — stannar Lotta kvar, eller flyttas hon?

**Branschen delar sig skarpt i två klasser, och variabeln är inte
"e-post kontra annat" utan om SÄNDNINGEN SJÄLV är synkron och avgränsad
eller asynkron och obegränsad över tid.**

### Klass A — kampanjverktyg: redirect till en dedikerad rapport-sida

Sex oberoende, förstaparts-källor bekräftar samma mönster för
marknadsförings-utskick till segment/listor:

- **Klaviyo:** "Click into a specific sent campaign and you will arrive at
  the overview page where you can see an overview of performance, recipient
  engagement, a deliverability snapshot" —
  [Understanding available campaign analytics](https://help.klaviyo.com/hc/en-us/articles/115005258568).
- **HubSpot:** "you can analyze the results... on the email performance
  page", nådd via Marketing → Email → klick på det skickade mailet —
  [Analyze your marketing email campaign performance](https://knowledge.hubspot.com/marketing-email/analyze-your-marketing-email-campaign-performance).
- **Brevo:** "access its report to check how it performed by going to
  Marketing > Emails" —
  [Analyze and export your email campaign report](https://help.brevo.com/hc/en-us/articles/19764406559506-Analyze-and-export-your-email-campaign-report).
- **SendGrid (Twilio):** "After you send a Single Send, you can review its
  performance analytics" via Marketing → Single Sends —
  [Single Sends](https://www.twilio.com/docs/sendgrid/ui/sending-email/single-sends).
- **Resend:** "View the details of any sent Broadcast in the Broadcasts
  Dashboard Page" med "real-time deliverability metrics, open and click
  tracking" —
  [Managing Broadcasts](https://resend.com/docs/dashboard/broadcasts/introduction).
- **Salesforce:** "The List Email object displays a list of all List Email
  processes that have been triggered, along with their current status"
  (Sent/Cancelled/Draft) — och ENGAGEMANG (öppningar) kräver ett SEPARAT
  "HTML Email Status Report" byggt i Rapport-modulen —
  [View the Status of "List Emails" (Mass Emails)](https://help.salesforce.com/s/articleView?id=000381424&language=en_US&type=1).

**Varför just den klassen redirectar:** det de visar är inte "gick det
iväg" utan "hur presterar det" — öppningar, klick, bounces, avvisade — mätvärden
som fylls i över TIMMAR eller DAGAR efter att sändningen initierats. En sida
som bara visade sub­mit-kvittensen skulle vara tom av innehåll minuter senare.

### Klass B — arbetsflödes-verktyg: stanna kvar, inline-resultat

- **Gmail (Google, officiellt):** bulk-radering visar "an Undo prompt at the
  top of your inbox for a short time" — användaren stannar i samma
  listvy — [Gmail Community/Google Support, bulk-deleting-in-gmail](https://support.google.com/mail/community-guide/242352517/bulk-deleting-in-gmail?hl=en).
  Samma mönster för Undo Send: en "Message sent"-toast med Undo-knapp,
  ingen navigation.
- **Intercom (officiellt, verifierat med direkt hämtning 2026-08-08):**
  bulk-åtgärder på konversationer körs SOM BAKGRUNDSJOBB över tröskeln, men
  "A 'started' notification appears immediately... For jobs over 1,000
  conversations, a 'completed' notification appears when the job finishes"
  och "The results list refreshes automatically when the job completes" —
  användaren FORTSÄTTER ARBETA I SAMMA LISTA —
  [Get started with Intercom Inbox](https://www.intercom.com/help/en/articles/6274899-get-started-with-intercom-inbox).
  **Tröskeln är explicit 1 000** — långt över task-147:s dussintal.
- **Linear/generellt bulk-edit-mönster (sekundär källa, Eleken-bloggen):**
  "for simple bulk edits, use a Flash Message... for complex edits, display
  the completed changes" — [Bulk action UX: 8 design guidelines](https://www.eleken.co/blog-posts/bulk-actions-ux)
  (blogg, lägre vikt — se § Källförteckning).

### GOV.UK Design Systems egen kriterium för VILKEN klass ett flöde tillhör

Detta är den STARKASTE källan i hela passet, eftersom den ger en EXPLICIT,
namngiven regel i stället för att bara observera vad andra produkter råkar
göra:

> "Use a Confirmation page in a linear service to tell users that they've
> finished using the service instead of a notification banner."
>
> Notification banners passar för "intermediate outcomes of an action
> within an ongoing journey" — inte det sista steget i en linjär tjänst.
>
> "Using a notification banner is unlikely to be the right approach in a
> linear service."

Källa: [GOV.UK Design System — Confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/)
och [Notification banner](https://design-system.service.gov.uk/components/notification-banner/).

**Applicerat på åtgärds-sidan:** `ATGARDSSIDAN-UNDERLAG.md` § 9 slår fast att
sidan är en STÅENDE arbetsyta — mottagar-urvalet är redigerbart på plats,
Lotta kan "hämta tillbaka 1 person och hämta in 2 nya... utan att lämna
åtgärdssidan", och sidan bär en egen eventväljare för flera besök över tid.
Det är per definition en "ongoing journey", inte en engångstjänst som TAR
SLUT vid sändning. GOV.UK:s eget kriterium pekar därför entydigt mot
**notification-banner-klassen (stanna kvar), inte confirmation-page-klassen
(navigera bort)** — oavsett att sändningen är oåterkallelig, vilket annars
hade kunnat tala för motsatsen (se § Vad som talar emot nedan).

### Vår egen tekniska verklighet gör Klass A mekaniskt otillämplig

`ADR-067` D3, citerat ordagrant ur filen: *"Synkron status =
**ACCEPTANS vid submit** (Resend tog emot), **ej leverans**... Leverans /
bounce / öppning ligger **UTANFÖR** 6h-scope (kräver webhook-ingestion →
DEFERRAD)."* Vårt system samlar alltså inte in de mätvärden
(öppning/klick/bounce över tid) som är HELA anledningen till att
kampanjverktygens rapport-sidor existerar som en EGEN sida. En redirect till
en "rapport-sida" hade i dagsläget bara kunnat visa exakt samma information
som redan finns synkront vid submit — noll mervärde av navigationen.

**Dom för § 1:** stanna kvar på åtgärds-sidan. Tre konvergerande skäl
(GOV.UK:s explicita kriterium, vårt eget tekniska kontrakt, storleksklassen)
pekar samma väg, och husstilen (`SegmentMailCompose`) gör det redan.

## 2. Under körningen — hur visas "pågår"?

**Nielsen (NN/g)s tre svarstids-gränser**, hämtade direkt ur artikeln:

> "0.1 second... no special feedback is necessary except to display the
> result." "1.0 second... the limit for maintaining the user's flow of
> thought." "10 seconds... the maximum for keeping the user's attention
> focused on the dialogue" — därefter krävs "a clearly signposted way for
> the user to interrupt the operation" och helst ett procent-baserat mått,
> eftersom "a graphic progress bar" gör väntan mindre plågsam än ett rent
> siffer-estimat.

Källa: [Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/).

**Vad det betyder tekniskt för OSS specifikt:** task-147:s § Implementationsbeslut
säger att den bilage-BÄRANDE sändvägen är "loopad singelsändning, en
mottagare per anrop" — till skillnad från den bilage-fria vägen som är ETT
batch-anrop. En loopad väg SKALAR med antal mottagare på ett sätt ett enda
batch-anrop inte gör, och kan därför realistiskt passera Nielsens 10-sekunders
gräns redan vid modesta urvalsstorlekar — **detta är INTE MÄTT i detta pass**
(ingen faktisk latensmätning mot `send-email`-funktionen gjordes; se
§ Vad jag inte kunde belägga).

**Cloudscape (AWS officiella designsystem)** ger en skarp regel för HUR
in-flight-läget ska annonseras, verifierad med direkt hämtning:

> "Info, in Progress, progress bar" flashbar-typer → "Do not move focus, use
> a live region component to announce the message."

Källa: [Cloudscape — Focus management principles](https://cloudscape.design/foundation/core-principles/accessibility/focus-management-principles/).

**Konkret rekommendation:** spärra "Granska och skicka"/sänd-knappen under
in-flight (samma mönster som `sendMutation.isPending` i
`SegmentMailCompose.tsx` rad 309), visa en text i en `aria-live="polite"
aria-busy`-region ("Skickar utskicket…") UTAN fokusflytt. Om urvalsstorleken
regelmässigt gör den bilage-bärande vägen längre än ~10 s bör texten bära ett
räknat mått ("Skickar 8 av 20…") snarare än en oföränderlig sträng — men det
kravet ska LÅSAS mot en faktisk latensmätning, inte mot detta antagande.

## 3. Partiellt utfall — hur presenteras "14 av 20 lyckades" konkret?

Detta är den delfråga där internt precedent är STARKAST — mönstret finns
redan kodat två gånger i repot, oberoende av varandra.

**`SegmentMailCompose.tsx` rad 306–347**, verbatim ur koden:

```tsx
<MessageBox
  intent={
    result.accepted === 0 ? 'warning' : result.status === 'partial' ? 'info' : 'success'
  }
  title={
    result.accepted === 0
      ? 'Inga mottagare fick mailet'
      : result.status === 'partial'
        ? 'Utskicket skickades delvis'
        : 'Utskicket skickades'
  }
>
  {result.accepted > 0 && <p><strong>{result.accepted}</strong> mottagare fick mailet.</p>}
  {result.suppressedConsent > 0 && <p>{result.suppressedConsent} togs bort (har tackat nej till utskick).</p>}
  {result.suppressedNoEmail > 0 && <p>{result.suppressedNoEmail} togs bort (saknar e-post).</p>}
  {result.rejected > 0 && <p>{result.rejected} kunde inte levereras.</p>}
</MessageBox>
```

Kodkommentaren bredvid är lika viktig som koden: *"accepted===0 (noll-leverans:
'skipped' tomt/allt-undertryckt ELLER 'failed' allt-avvisat) renderas ALDRIG
som grön framgång — neutral varning + breakdown som visar VARFÖR."*

**`registrationConfirmation.ts`s `bekraftelseUtfall`**, verbatim:

```ts
export function bekraftelseUtfall(result: ConfirmRegistrationsResult): string {
  const antal = result.confirmed.length;
  if (antal > 0 && result.failed.length === 0) {
    return antal === 1 ? 'Bekräftelsen är skickad.' : `${antal} bekräftelser är skickade.`;
  }
  if (antal > 0) {
    return `${antal} bekräftelser skickade, ${result.failed.length} misslyckades.`;
  }
  if (result.skipped.length > 0 && result.failed.length === 0) {
    return 'Inget skickades — anmälningarna var redan bekräftade eller saknar e-post.';
  }
  return 'Ingen bekräftelse kunde skickas.';
}
```

Regeln bakom, ur `tasks/lessons.md` **L350** (universell lärdom, verifierad
mot filen): *"när ett API modellerar flera utfallsklasser i ett lyckat
HTTP-svar är `try/catch` bara halva grenen. Läs klassen ur kroppen och låt den
styra tillståndet."* **`ADR-067` D3** definierar exakt de klasser servern kan
returnera: `status` härleds `failed` = 0 accepted, `partial` = ≥1 accepted ∧
≥1 rejected, `sent` = alla attempted accepted — plus `skipped` (tillagd i
D3-tillägget 2026-06-28).

**Extern branschbekräftelse (sekundär, Eleken-bloggen, lägre vikt):**
*"Users always know exactly what succeeded, what failed, and why"* —
konsekvent med kravet att VARJE fallen mottagare får en FÖRSTÅELIG anledning,
inte bara en räknare. Task-147:s eget Testbeslut säger samma sak med Marcus
egna ord (§ Ytterligare krav): *"sidan säger vad som gick fel på mitt
språk."*

**Dom för § 3:** återanvänd `MessageBox`-mönstret rakt av, med intent- och
titel-logiken från `SegmentMailCompose` och text-härledningen från
`bekraftelseUtfall`. Detta är inte en ny design — det är en sammanslagning av
två redan validerade mönster i samma kodbas.

## 4. Urvalets öde — töms markeringen, eller ligger de fallna kvar?

**Redan ett explicit PRD-krav** (berättelse 12: *"Som Lotta vill jag att de
som föll ligger kvar markerade, så att jag kan köra om just dem."*), och
**redan byggt en gång** i `useConfirmAll` (`registrationConfirmation.ts`,
riven ur produktion men mönstret oförändrat värdefullt):

```ts
onSuccess: async (result) => {
  alertScreenReader(bekraftelseUtfall(result));
  if (result.confirmed.length === 0) return;
  const bekraftade = new Set(result.confirmed);
  queryClient.setQueryData<Registration[]>(listan, (old) =>
    old?.map((r) =>
      bekraftade.has(r.id) ? { ...r, status: RegistrationStatus.BEKRAFTAD, /* ... */ } : r,
    ),
  );
},
```

Docblocket ovanför hooken, verbatim: *"Ett partiellt utfall flyttar exakt de
kort som faktiskt gick igenom och lämnar resten i kön — ett halvt utfall kan
alltså fortfarande aldrig visas som helt."* Detta är källan bakom
`tasks/lessons.md` **L355** (verifierad mot filen): *"Serverns svar ÄR facit —
kasta det inte och vänta på en omhämtning."* Distinktionen L355 gör explicit
är viktig att bära vidare: detta är INTE en optimistisk mutation (som skriver
FÖRE svaret, med klientens gissning) — det är en skrivning EFTER svaret, med
serverns egen lista. Pessimismen (byggkrav i task-147) är därmed intakt:
det halva utfallet visas aldrig som helt, det bara UPPDATERAS effektivt utan
en extra refetch-runda.

**Läget stängs BARA vid RENT utfall** — L350 igen, verbatim: *"rent utfall
stänger läget, allt annat behåller urvalet så att användaren kan försöka igen
på resten."*

**Branschbekräftelse:** Eleken-riktlinje #5 (sekundär källa) nämner
"clickable failed items" som en del av feedback-nivåerna för bulk actions —
konsekvent med att de fallna posterna förblir INTERAKTIVA (kvar markerade,
redo för omkörning), inte bara passivt listade i en logg.

**Dom för § 4:** samma mönster som `useConfirmAll` — patcha bara de ID:n
servern rapporterar som lyckade, lämna resten markerade, stäng
gransknings-/resultat-läget bara vid ett 100 %-utfall.

## 5. Beständighet — efemärt eller en post man kan gå tillbaka till?

**`SegmentMailCompose`s resultat lever bara i lokal React-state** (`useState`,
inte i en cache-nyckel) — försvinner vid navigation eller refresh. MEN
sändningen den beskriver är INTE efemär: `onSuccess` invaliderar
`queryKeys.maillog.all`, så en Utskickslogg-vy (om öppnad) refetchar och
speglar den nya raden. UI-tillståndet är efemärt; SKRIVNINGEN är beständig.

**`ADR-067` D7** (revisionslogg via write-vertikal-mönstret) formaliserar
detta för hela bulk-sänd-kontraktet — varje utskick loggas oavsett om någon
UI-yta råkar visa den enskilda körningens resultat efteråt.

**Task-147 bokför explicit att en dedikerad historik-VY är UTANFÖR v1-scope:**
*"Utskickshistorikens kortvisning — bokförd som iterationspunkt, tas i
formfasen."* Detta är alltså redan ett medvetet, dokumenterat val — inte en
lucka detta pass upptäcker.

**Varför det håller mot branschen:** Salesforce delar isär EXAKT samma
distinktion i sin egen produkt — "did it send"-status lever i List Email-
objektet (en enkel, alltid tillgänglig lista), medan "hur presterade det"
(öppningar) kräver ett SEPARAT rapport-objekt byggt on-demand. Vårt system
har ingen "hur presterade det"-dimension ännu (§ 1), så en beständig
resultat-SIDA hade bara varit en persistens-mekanism för information som
redan finns i revisionsloggen. Värdet av en dedikerad historik-vy uppstår
FÖRST den dagen webhook-ingestion (bounce/öppning) byggs — precis den
gränsen ADR-067 D3 redan drar.

**Dom för § 5:** UI-resultatet får vara efemärt. Den beständiga posten är
redan säkrad via revisionsloggen (D7); bygg inte en historik-vy för v1 —
task-147 har redan avgjort detta, detta pass bara bekräftar att beslutet
håller mot branschargumenten.

## 6. Tillgänglighet — aria-live kontra fokusflytt

**Under körningen:** `aria-live="polite"` + `aria-busy` på ett omslutande
block, INGEN fokusflytt. Källbelagt av Cloudscape (§ 2 ovan: "Info, in
Progress... Do not move focus"). Matchar redan `SegmentMailCompose` rad 308:
`<div aria-live="polite" aria-busy={sendMutation.isPending}>`.

**Vid utfall (framgång/fel/varning):** vår egen `MessageBox`-primitiv
(`src/components/primitives/MessageBox.tsx` rad 63, verifierad direkt i
källkoden) sätter redan rollen automatiskt: `role = intent === 'error' ||
intent === 'warning' ? 'alert' : 'status'`. Det ger korrekt SR-annonsering
UTAN extra kod: **`role="alert"` är per MDN implicit likvärdigt med
`aria-live="assertive"` + `aria-atomic="true"`** — verifierad ordagrant:

> "Setting `role='alert'` is equivalent to setting `aria-live='assertive'`
> and `aria-atomic='true'`."

Källa: [MDN — ARIA: alert role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role).
Detta är exakt regeln bakom vår egen `tasks/lessons.md` **L138**: stapla
ALDRIG en separat assertiv announcer ovanpå en yta som redan bär
`role="alert"`. `SegmentMailCompose`s ytterhölje (`aria-live="polite"`) och
den inre `MessageBox` (`role="alert"` VID fel/varning, `role="status"` vid
framgång/info) är inte samma överträdelse L138 varnar för (ingen SEPARAT
`alertScreenReader()`-ropning ovanpå), men det ÄR en nästlad
live-region-konstruktion värd att vara medveten om vid byggetet: den yttre
`aria-live="polite"` finns för att bära "Skickar…"-texten (som saknar egen
roll) — så länge resultat-blocket alltid går via `MessageBox` behövs ingen
ändring, men en framtida refaktor som lägger fri text direkt i
ytterhöljet riskerar att dubbel-annonsera.

**W3C APG bekräftar** kravet på att en alert INTE försvinner automatiskt (för
att inte fälla WCAG 2.2.3): *"Alerts should not disappear automatically, as
this risks failing WCAG 2.0 success criterion 2.2.3."* Källa:
[W3C WAI-ARIA APG — Alert Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/).
Vår `MessageBox` har ingen auto-timeout (verifierat i primitivens kod) —
kravet är redan uppfyllt strukturellt.

**Fokusflytt till resultatet — den delen som är NY för denna kodbas.** Två
oberoende designsystem går längre än ren live-region-annonsering för
UTFALLET (till skillnad från "pågår"):

- **Cloudscape:** *"Success, error, and warning alerts/flashbars: Set focus
  on the element that contains the icon and the header and/or content."*
- **GOV.UK:** *"Since you're using the notification banner to tell the user
  about the outcome of something they've just done, add `role='alert'`"* —
  och dokumenterar explicit att detta *"automatically moves keyboard focus to
  the banner on page load"* i deras egen implementation.

Källor: [Cloudscape — Focus management principles](https://cloudscape.design/foundation/core-principles/accessibility/focus-management-principles/),
[GOV.UK — Notification banner](https://design-system.service.gov.uk/components/notification-banner/).

**Detta är genuint NY mark för vårt repo.** Den grep-sökning detta pass
gjorde hittar EN befintlig fokus-konvention i hela kodbasen, och den är en
ANNAN sak: `Deltagare.tsx` rad 1518–1522 flyttar fokus TILLBAKA till
Markera-knappen när markera-LÄGET STÄNGS (fokus-retur vid ett lägesbyte,
dokumenterat som "review-fynd 1" i sin egen kommentar). Ingen befintlig kod i
repot flyttar fokus TILL en resultat-yta. Att införa det här är alltså ett
äkta, källgrundat TILLÄGG till husstilen — inte en bekräftelse av något som
redan finns. GitHub Primers mer generella regel (*"focus should return to a
logical spot"* vid content-ändringar) stödjer riktningen utan att specificera
FRAMGÅNG/FEL-fallet lika skarpt som Cloudscape/GOV.UK gör.

**Dom för § 6:** live-region räcker under körning (ingen fokusflytt);
`MessageBox`s befintliga `role="alert"`/`role="status"`-logik räcker för
SR-annonsering av utfallet UTAN ny kod; **lägg till en EXPLICIT fokusflytt
till resultat-elementet när utfallet är känt** — källgrundat i två
designsystem, men flaggat öppet som ny konvention (se § Vad som talar emot).

## Dom

**Åtgärds-sidans resultatsteg ska vara en INLINE-ersättning på samma sida —
inte en navigation, inte en separat historik-vy — byggd genom att
sammanslå två mönster som redan finns validerade i repot:**
`SegmentMailCompose`s `MessageBox`-baserade utfalls-yta (intent per
utfallsklass, aldrig grönt vid noll lyckade) och `useConfirmAll`/
`bekraftelseUtfall`s server-är-facit-patchning (bara lyckade ID:n flyttas,
resten ligger kvar markerat, läget stängs bara vid rent utfall). Under
körning: spärrad knapp + `aria-live="polite"`/`aria-busy`, ingen fokusflytt.
Vid utfall: samma `MessageBox`-roll-logik som redan finns, PLUS en ny,
källgrundad fokusflytt till resultat-elementet. Historik-vyn förblir
medvetet utanför v1, precis som task-147 redan bokfört.

Tre oberoende linjer konvergerar mot "stanna kvar": GOV.UK:s egna namngivna
kriterium (ongoing journey → banner, inte confirmation-page), vårt eget
tekniska send-kontrakt (ADR-067 D3: ingen leverans-/engagemangsdata att visa
på en separat sida ännu) och storleksklassen (dussintal, långt under varje
funnen branschtröskel för asynkront bakgrundsjobb-mönster, t.ex. Intercoms
1 000).

## Vad som talar emot rekommendationen, öppet

- **Oåterkallelighet talar för en tyngre bekräftelse-YTA, om än inte en egen
  SIDA.** GOV.UK:s eget kriterium handlar om "linjär tjänst kontra pågående
  resa", inte om reversibilitet i sig — men ett oåterkalleligt utskick är
  objektivt en allvarligare händelse än de flesta "intermediate outcomes"
  banner-mönstret annars täcker. Det talar för att resultat-ytan ska vara
  visuellt TUNG (vilket `MessageBox`+fokusflytt redan ger) snarare än en
  försvinnande toast — men INTE för en egen sida. Detta är redan
  inbyggt i rekommendationen, inte en olöst spänning.
- **In-flight-förloppsmåttet ("skickar X av Y") är INTE mätt.** Rekommendationen
  att lägga till ett räknat mått vid längre körningar vilar på ett
  resonemang om den loopade attachment-sändvägens skalning, inte på en
  uppmätt latens. Om faktisk latens visar sig ligga under Nielsens 10 s-gräns
  även för de största realistiska urvalen (ett enskilt Miranon Media-event
  har sannolikt inte tusentals deltagare) räcker ett rent `aria-busy` utan
  räknare, och den extra komplexiteten är onödig — det är
  precis den typen av spekulativ komplexitet över-engineering-vakten ska
  fånga. **Mät innan den delen låses.**
- **Fokusflytt-tillägget är ny mark utan intern konvention att luta sig mot.**
  Två externa designsystem rekommenderar det, men ingen befintlig kod i repot
  gör det för ett RESULTAT (bara för lägesbyten). Det finns en risk för
  krock med den befintliga fokus-retur-konventionen (`Deltagare.tsx`s
  Markera-knapp-fokus vid lägesstängning) om resultatet visas OCH läget
  stängs i samma ögonblick — vilken av de två vinner måste beslutas explicit
  vid byggetet, inte ärvas tyst.
- **Precedent-räkningen för "stanna kvar"-klassen är tunnare på PRIMÄRKÄLLOR
  än för "redirect"-klassen.** Gmail och Intercom är solida förstaparts-
  belägg, men Linear/Jira-exemplen kommer via en sekundär blogg (Eleken) som
  inte är verifierad mot Linears/Jiras egen dokumentation i detta pass. Om
  Marcus vill ha ett tredje FÖRSTAPARTS-belägg för "stanna kvar,
  dussintals-skala" utöver Gmail och Intercom, är det inte inhämtat här.

## Vad jag inte kunde belägga

- **Faktisk latens för `send-email`-funktionen** (batch- eller
  attachment-grenen) mot verkliga urvalsstorlekar. Ingen mätning gjordes i
  detta pass — rekommendationen om ett räknat förloppsmått i § 2 vilar på
  ett resonemang om den loopade sändvägens skalning, INTE på en uppmätt
  siffra. Detta måste mätas separat innan den delen av formen låses.
- **Linear och Jiras EGEN dokumentation** för bulk-edit-feedback prövades
  inte direkt mot deras primärkällor — informationen i § 1 Klass B kommer
  via en sekundär blogg (Eleken) och är därför märkt med lägre vikt.
- **GitHub:s exakta gränssnitts-mekanik för bulk-labelling/closing av issues**
  (stannar man kvar på listan med en toast, eller sker något annat?) gick
  inte att bekräfta mot en enskild, entydig primärkälla i detta pass —
  sökningarna gav bara allmän dokumentation om ATT bulk-funktionen finns,
  inte HUR resultatet visas. GitHub utelämnas därför som citerad precedent
  i slutrekommendationen, trots att uppdraget föreslog det som exempel.
  (Se `docs.github.com/en/issues/using-labels-and-milestones-to-track-work`
  för den allmänna dokumentationen, om vidare verifiering önskas.)
- **Om `npm run check:docs` (alla tretton dokumentations-grindar) är grön
  mot filen.** Se § Grindar nedan för vad som faktiskt kördes i förgrunden.
- **Om den nästlade `aria-live="polite"` (ytterhölje) + `role="alert"/
  "status"` (inre `MessageBox`)-konstruktionen faktiskt läses korrekt av
  verkliga skärmläsare (NVDA/JAWS/VoiceOver) i vår specifika DOM-form.**
  MDN och APG bekräftar teorin (role=alert är en egen assertiv annonsering
  oberoende av förälderns `aria-live`-nivå), men ingen skärmläsar-testning
  gjordes i detta pass — det är ett läsning-av-dokumentation-belägg, inte
  ett uppmätt beteende.

## Källförteckning

**Auktoritativa förstapartskällor — designsystem, produktdokumentation:**

- [GOV.UK Design System — Confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/)
- [GOV.UK Design System — Notification banner](https://design-system.service.gov.uk/components/notification-banner/)
- [Cloudscape (AWS) — Focus management principles](https://cloudscape.design/foundation/core-principles/accessibility/focus-management-principles/)
- [GitHub Primer — Focus management](https://primer.style/accessibility/design-guidance/focus-management/)
- [W3C WAI-ARIA APG — Alert Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)
- [MDN — ARIA: alert role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)
- [Nielsen Norman Group — Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- [Nielsen Norman Group — Bulk Actions: 3 Design Guidelines](https://www.nngroup.com/videos/bulk-actions-design-guidelines/)
- [Nielsen Norman Group — Confirmation Dialogs Can Prevent User Errors](https://www.nngroup.com/articles/confirmation-dialog/)
- [Klaviyo Help — Understanding available campaign analytics](https://help.klaviyo.com/hc/en-us/articles/115005258568)
- [HubSpot Knowledge Base — Analyze your marketing email campaign performance](https://knowledge.hubspot.com/marketing-email/analyze-your-marketing-email-campaign-performance)
- [Brevo Help — Analyze and export your email campaign report](https://help.brevo.com/hc/en-us/articles/19764406559506-Analyze-and-export-your-email-campaign-report)
- [Twilio SendGrid Docs — Single Sends](https://www.twilio.com/docs/sendgrid/ui/sending-email/single-sends)
- [Resend Docs — Managing Broadcasts](https://resend.com/docs/dashboard/broadcasts/introduction)
- [Salesforce Help — View the Status of "List Emails" (Mass Emails)](https://help.salesforce.com/s/articleView?id=000381424&language=en_US&type=1)
- [Customer.io Docs — Failed and attempted messages](https://docs.customer.io/journeys/message-failed/)
- [Intercom Help — Get started with Intercom Inbox](https://www.intercom.com/help/en/articles/6274899-get-started-with-intercom-inbox)
- [Google Support — Bulk-deleting in Gmail (Undo)](https://support.google.com/mail/community-guide/242352517/bulk-deleting-in-gmail?hl=en)

**Sekundära källor (bloggar, lägre vikt — ej primärkälle-verifierade utöver vad som citeras explicit ovan):**

- [Eleken — Bulk action UX: 8 design guidelines with examples for SaaS](https://www.eleken.co/blog-posts/bulk-actions-ux)
- [LogRocket — UI patterns for async workflows, background jobs, and data pipelines](https://blog.logrocket.com/ux-design/ui-patterns-for-async-workflows-background-jobs-and-data-pipelines/)

**Internt refererat (kontext, inte extern källa):**

- [`docs/specs/ATGARDSSIDAN-UNDERLAG.md`](../specs/ATGARDSSIDAN-UNDERLAG.md) § 4, § 9
- [`docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md`](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) D3, D7
- `backlog/tasks/task-147` — PRD "Åtgärds-sidan", berättelse 11/12/26, § Estimat
- `src/components/segment/SegmentMailCompose.tsx` rad 1–350
- `src/data/mutations/registrationConfirmation.ts` (hela filen)
- `src/components/events/atgarder/AtgardsSida.tsx` rad 1341–1510 (`ArbetsYta`)
  — radnumren avser `main`-versionen passet läste, INTE sessionens gren där
  varv 19–20 ligger. Se proveniens-noten överst.
- `src/components/events/detail/Deltagare.tsx` rad 1460–1540 (riven
  `useConfirmAll`-konsumtion + fokus-retur-mönstret)
- `src/components/primitives/MessageBox.tsx`
- `tasks/lessons.md` L138, L350, L355
