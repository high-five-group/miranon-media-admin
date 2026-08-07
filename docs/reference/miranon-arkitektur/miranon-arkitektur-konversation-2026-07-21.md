# Miranon Media — AI-assistent, publiceringsarkitektur & vägen från Airtable till Supabase

> **Frusen ögonblicksbild av en utforskande konversation, 21 juli 2026 —
> vendoriserad till repot 2026-07-25 (S87).** Rå-transkriptet redigeras
> aldrig efter landning; det är beviskällan bakom
> [`arkitektur-destillat-och-gap-2026-07-25.md`](arkitektur-destillat-och-gap-2026-07-25.md),
> som destillerar innehållet och mappar det mot repots faktiska läge.
> **Konversationen är INPUT, inte beslut** — inget här är mintat som ADR
> eller inskrivet i byggplanen. För nuvarande tolkning och öppna frågor,
> läs destillatet.

**Konversation mellan Marcus och Claude (Anthropic)**
**Datum:** 21 juli 2026
**Ämnen:** In-app AI-assistent, publiceringsmönster, Supabase-migrering, anmälningsflöden, Airtables framtid, vibe coding-säkerhet, Passionslyftet, dataarkitektur för småföretag

---

## Sammanfattning

Konversationen började som en teknisk research-fråga — *hur bygger proffsen en AI-assistent i en app?* — och utvecklades till en komplett arkitekturfilosofi för Miranon Media och en affärsinsikt för Passionslyftet.

**Del 1: AI-assistenten i admin-appen.** Branschmönstret är tool calling i en agentisk loop (à la Shopify Sidekick): assistenten får verktyg som är tunna wrappers runt appens befintliga service-lager. Vercel AI SDK (v7, juni 2026) är standardvalet för TypeScript/React: ToolLoopAgent, inbyggt approval-stöd (`needsApproval`), WorkflowAgent för hållbar exekvering. UI via assistant-ui eller AI Elements. Säkerhetsprinciper: assistenten agerar som den inloggade användaren, allt loggas, human-in-the-loop på destruktiva åtgärder, prompt injection-medvetenhet, börja med få vältestade verktyg (Shopifys "tool complexity"-lärdom).

**Del 2: "Publicera på miranon.se"-knappen.** Kärnmönstret: publicering är en statusändring på en enda källa till sanning, aldrig en kopiering. Idag (Shopify-sajt): push till Shopify metaobjects via Admin GraphQL API med publishable-capability, idempotent upsert. Vid framtida custombygge: pull-modellen — en Postgres-databas, publika sajten läser bara `status='published'`, cache-invalidering via `revalidateTag` (Next.js 16 Cache Components), draft mode för förhandsvisning, cron för schemalagd publicering. Datamodellen (draft/published, visible/bookable) är identisk i båda scenarierna — bara distributionsmekanismen byts.

**Del 3: Anmälningar & Supabase-migrering.** Elfsight och Zapier försvinner helt vid custombygge: formulär postar till en server action → validering, spamskydd, dubblettkoll, transaktionell kapacitetskontroll → INSERT i Supabase → Resend-bekräftelse. Kritisk princip: webbläsaren skriver aldrig direkt till Supabase — allt går via servern; anon-rollen får läsa publicerade event men aldrig skriva i registrations. Miranon planerar full migrering till Supabase.

**Del 4: Airtables framtid & Lius vision.** Airtable är inte en databas utan ett gränssnitt — köpt av team utan utvecklar*allokering* (inte företag utan utvecklare: OpenAI, BlackRock, Wondery är kunder). Efter "Airtable is dead"-cykeln 2023–24 kom AI-omstöpningen: Omni, Hyperagent, Superagent — positionering som "operativsystemet för AI-agenter i företaget": databasen som agenternas runtime (rader = arbetsordrar, behörigheter = kernel, automationer = schemaläggare, interfaces = skärm där människor övervakar). Rättelse under samtalet: 11,7 mdr USD var 2021-toppvärderingen; bolaget handlas nu ~4 mdr på andrahandsmarknaden, men med kassa och positivt kassaflöde.

**Del 5: Gränsen för Airtable.** Fyra frågor avgör: (1) Rör bara anställda datan, eller allmänheten? (2) Skriver människor eller maskiner? (3) Finns utvecklare i loopen varaktigt? (4) Är flödet under utforskning eller stabiliserat? Enradaren: *Airtable så länge alla användare står på lönelistan och varje skrivning kommer från en människa eller ett formulär — custom när allmänheten eller maskinerna ska in.* Förfining senare i samtalet: det avgörande är inte vem som skriver utan **var i flödet Airtable sitter** — kritiska vägen (fel) vs nedströms sänka/cockpit (rätt). Testet: "Kan basen raderas ikväll och byggas om från källorna imorgon utan att en kund märker något?"

**Del 6: Vibe coding-säkerhet & beroendeproblemet.** Faktaunderlag: 40–62 % av AI-genererad kod innehåller sårbarheter; Lovable hade tre stora incidenter på 13 månader (CVE-2025-48757 med saknad RLS och 170+ exponerade appar; april 2026-läckan med källkod, databasuppgifter och 18 697 studentposter). Nyckelcitat: "Lovable är inte unikt osäkert — det är representativt osäkert." Anthropics linje: human-in-the-loop, inget appliceras utan mänskligt godkännande. Lösningen på Roger/Lotta-beroendet: (a) de äger driften till 100 % via admin-appen (begränsad självbetjäning är trygg, obegränsad generering är risken), (b) Marcus gör sig **utbytbar, inte onödig** — tråkig standardstack, managed services, dokumentation, och kunden äger alla konton.

**Del 7: Passionslyftet & massan.** Regeln att lära ut: rekommendera bara verktyg där säkerheten är plattformens jobb, inte användarens. Vertikal SaaS (Luma, Podia, Calendly, Stripe Payment Links, Skool) för allt publikt; Airtable som internt nav nedströms. Trappan: Utforska → Första kunderna → Urvuxen (då anlitar man hjälp — steg tre ska inte läras ut, det ska kännas igen). Roger & Lotta är undantaget som vuxit ur SaaS, inte mallen.

**Del 8: Nödutgången.** Marcus oro: utan Airtable blir admin-appen enda fönstret mot datan. Proffslösningen: skilj transaktions-UI (admin-appen, skrivningar med skyddsräcken) från utforsknings-UI (read-only-lager). NocoDB lägger ett Airtable-liknande rutnät ovanpå samma Supabase-Postgres (read-only); Metabase för dashboards; AI-assistenten från del 1 som det mest Lotta-vänliga fönstret av alla. Regel: titta fritt, röra genom appen.

---

## Nyckelinsikter

1. **Publicering är en statusändring, inte en kopiering.** En källa till sanning; sajten läser bara publicerat; cachen invalideras kirurgiskt vid ändring.
2. **AI-assistentens verktyg = appens befintliga service-lager.** Aldrig en parallell kodväg; assistenten ärver validering och behörigheter automatiskt.
3. **Publik trafik träffar aldrig Airtable (5 req/s) — och aldrig databasen direkt från webbläsaren.** Servern är alltid mellanhand för skrivningar.
4. **Airtable är ett gränssnitt, inte en databas.** Köparen är teamet utan utvecklarallokering — även inne på OpenAI och BlackRock.
5. **Kritiska vägen vs nedströms.** Airtable som motor är felet; Airtable som sänka/cockpit är mönstret. Radera-och-återskapa-testet avgör.
6. **"Allt på ett ställe"-längtan är legitim** — mognaden är att lägga det stället nedströms om transaktionerna (småföretagarens Snowflake).
7. **Vibe coding utan omdöme är dokumenterat farligt.** Incidenterna beror inte på att AI inte kan skriva säkert, utan på att ingen visste vad de skulle be om eller verifiera.
8. **Begränsad självbetjäning är trygg; obegränsad generering är risken.** Ett textfält i admin-appen kan inte råka stänga av RLS.
9. **Lös bus-faktorn genom utbytbarhet, inte genom att avskaffa utvecklarrollen.** Tråkig stack, docs, kundägda konton — vilken utvecklare som helst ska kunna ta över på en dag.
10. **För massan: ingen backend alls.** Vertikal SaaS för det publika, Airtable som internt nav, och kunskapen att känna igen när man vuxit ur det.
11. **Nödutgången går att behålla.** NocoDB/Metabase read-only ovanpå Supabase ger rutnätet tillbaka — och AI-assistenten är det modernaste datafönstret.
12. **AI gör byggandet billigt men inte omdömet.** Rollen förflyttas från den som skriver kod till den som granskar, ramar in och äger arkitekturen.

## Beslut & rekommendationer ur samtalet

- Miranon migrerar fullt till Supabase; Airtable fasas ut eller blir läskopia (aldrig två sanningar).
- Admin-app + publik sajt: monorepo eller en Next.js-app med /admin bakom auth; delat db-paket (Drizzle/Prisma).
- Eventmodell byggs nu efter draft/published + visible/bookable — push till Shopify som distributionssteg idag, byt till revalidateTag vid custombygge.
- Anmälningar: server action → Supabase, Resend-bekräftelse, transaktionell kapacitetskontroll; Elfsight/Zapier avvecklas.
- AI-assistent: Vercel AI SDK + läsverktyg först, skrivverktyg med approval sedan; 8–12 verktyg initialt.
- Roger & Lotta äger Supabase-org, Vercel, domän, GitHub; Marcus är medlem.
- Utforskningslager: NocoDB (read-only) mot städade SQL-vyer med svenska kolumnnamn, alternativt Metabase.
- Passionslyftet lär ut trappan och gränsdragningen — inte "så bygger du", utan "så vet du när du inte ska bygga själv".

---

# Fullständigt transkript

*Anmärkning: Claudes svar byggde genomgående på webbresearch (Vercel, Shopify Engineering, Anthropic, TechCrunch, The Next Web, Airtables kunddokumentation m.fl.). Sökmoment markeras kortfattat i kursiv. Källcitat är återgivna som löptext.*

---

## Tur 1 — AI-assistent i appen

**Marcus:**

> Om jag vill bygga in en ai-assistent/chatt i miranon media appen, som kan göra allt en användare kan göra, hur gör proffsen då? Vercel SDK? Gör deep-research

**Claude:** *(sökte igenom tidigare konversationer om Miranon-stacken samt webben: Vercel AI SDK, CopilotKit/AG-UI, agentsäkerhet, Shopify Sidekick)*

Jag har grävt runt både i vad vi vet om Miranon-uppsättningen (React-frontend, Airtable som datalager, Resend för mail) och i hur branschen faktiskt bygger det här idag. Här är läget.

**Kärnmönstret: chatten är inte grejen — verktygen är**

Det proffsen gör är i princip alltid samma sak, oavsett ramverk. Bästa exemplet är Shopifys Sidekick, som är exakt det du beskriver: en assistent inbäddad i admin-gränssnittet som kan göra det en användare kan göra. Sidekick är byggd runt det Anthropic kallar "the agentic loop" — en cykel där användaren ger input, en LLM bestämmer vilka actions som ska köras, dessa exekveras i miljön, feedback samlas in och cykeln fortsätter. Konkret betyder det:

Assistenten får en uppsättning **tools** — tunna wrappers runt de funktioner appen redan har. "Allt en användare kan göra" översätts till "varje knapp/flöde i appen finns också som ett verktyg med tydligt schema". För din del: `sok_deltagare`, `lista_grupper`, `skicka_mail_via_resend`, `uppdatera_airtable_rad` osv. Nyckeln är att verktygen anropar **samma service-lager som UI:t använder**, inte en parallell kodväg. Då ärver assistenten automatiskt all validering och behörighetslogik.

**Ja — Vercel AI SDK är default-valet för din stack**

Din instinkt stämmer. Vercel AI SDK har blivit det dominerande TypeScript-verktyget för detta, med över 20 miljoner nedladdningar i månaden, och det har utvecklats snabbt:

ToolLoopAgent-klassen (från v6) hanterar hela verktygsloopen: den anropar LLM:en, exekverar verktygsanrop, lägger tillbaka resultaten i konversationen och upprepar tills klart. Viktigt för dig: det finns inbyggt approval-stöd — du kan skicka en funktion till needsApproval som avgör utifrån input om användaren måste godkänna, och spara godkända mönster för framtida anrop. Det är exakt vad du vill ha innan assistenten t.ex. skickar mail till 416 personer.

AI SDK 7 (släppt i juni) lade till WorkflowAgent för hållbar, återupptagbar agent-exekvering som överlever omstarter, deploys och fördröjda godkännanden, plus stöd för MCP. Och SDK:n är provider-agnostisk — samma kod funkar mot OpenAI, Anthropic, Google m.fl., så du låser dig inte vid en modell.

För UI:t: `useChat`-hooken plus Vercels **AI Elements**-komponenter, eller **assistant-ui** som är en open source React-toolkit för produktionsklara AI-chattupplevelser i ChatGPT-stil och integrerar väldokumenterat med AI SDK:s useChat, generativ UI streamad från servern och thread-persistens i Next.js. Vercels öppna **AI Chatbot**-template är dessutom den officiella referensimplementationen som många team utgår från — bra att sno arkitektur ifrån.

**Det starkaste alternativet: CopilotKit**

Om ambitionen är att assistenten inte bara ska chatta utan *styra appen* — se aktuell sida, fylla formulär, uppdatera UI-state — är CopilotKit byggt precis för det. Det ger React-SDK:er, färdiga chattkomponenter och hooks som låter AI:n läsa app-state, anropa frontend-actions och rendera generativ UI, och riktar sig till team som vill ha en riktig produkt-copilot som kan se aktuell sida, fylla formulär, trigga app-actions och guida användare genom flöden. Tumregeln från en bra genomgång: vill du bara ha en FAQ-bot är CopilotKit för tungt; vill du att AI:n verkligen ska förstå sidans status, operera på affärsobjekt och hjälpa användare slutföra arbetsflöden är det värdefullt. Nackdelen är att det är ett större ramverk med egen arkitektur (AG-UI-protokollet) — mer att lära, mer lock-in i struktur.

Min bedömning för miranon-media-admin: **AI SDK + assistant-ui/AI Elements** är den pragmatiska vägen. Du äger varje rad, det passar din Claude Code-drivna disciplin, och verktygen blir vanliga TypeScript-funktioner i separata filer. CopilotKit är värt att titta på i steg 2 om du vill att assistenten ska kunna navigera/styra själva gränssnittet.

**Säkerheten — det som skiljer proffs från demos**

Det här är den del som oftast slarvas med, och den är extra viktig när assistenten "kan allt":

**Assistenten agerar som den inloggade användaren, aldrig med egen superbehörighet.** Agenten ska bara agera inom behörigheterna hos användaren som auktoriserade den, och behörighetskontrollen sker i service-lagret på servern — aldrig i prompten. Ge bara de behörigheter som behövs för uppgiften — agenter ska aldrig ha mer åtkomst än nödvändigt.

**Allt loggas.** Varje action en AI-agent tar ska loggas och vara spårbar, precis som om en människa gjort den — i din värld en audit-tabell i Airtable eller databasen.

**Human-in-the-loop på destruktiva åtgärder.** Läs-verktyg (sök, sammanfatta, lista) kan köras fritt; skriv-verktyg (skicka mail, radera, ändra) kräver ett godkännande-kort i chatten.

**Prompt injection.** En agent kan bli manipulerad av prompt-injicerat innehåll till att läcka data — du kontrollerar inte längre exekveringsvägen fullt ut. Fritext som assistenten läser (t.ex. formulärsvar i Airtable) ska behandlas som data, aldrig som instruktioner.

**En lärdom från Shopify att bära med sig**

Börja litet. Shopifys största problem var "tool complexity" — när systemet växte från 0–20 verktyg med tydliga gränser till 50+ med överlappande funktionalitet försämrades prestandan, och de löste det med "just-in-time instructions": verktygsspecifik vägledning flyttades in i verktygssvaren istället för systemprompten. Praktiskt för dig: börja med kanske 8–12 väldefinierade verktyg (läsning först, sedan skrivning med approval), och håll systemprompten kort.

Sammanfattat: ja, Vercel AI SDK (v7) är rätt spår, och receptet är API-route på servern → ToolLoopAgent → verktyg som wrappar dina befintliga Airtable/Resend-funktioner → `needsApproval` på allt som skriver → chatt-UI med assistant-ui eller AI Elements. Vill du kan jag skissa den konkreta filstrukturen och de första verktygsdefinitionerna för admin-appen som nästa steg.

---

## Tur 2 — "Publicera på miranon.se"-knappen

**Marcus:**

> Okej. Bra.
>
> En annan grej. I miranon media admin appen kan man skapa event, om man har en knapp på skapa-event-sidan som säger "publicera på miranon.se", alltså deras publika sajt, alltså att eventet syns för allmänheten och öppnar för anmälan, hur skulle en sådan grej gå till rent tekniskt? Vad är det absoluta branschledarmönstret här, hur gör proffsen? Gör deep-research på detta också

**Claude:** *(verifierade att miranon.se kör Shopify via web_fetch; researchade Shopify metaobjects, headless CMS-publiceringsflöden, webhook-driven cache-invalidering, Airtables rate limits)*

Klart. Här är bilden, från det generella branschmönstret ner till exakt hur det mappar på miranon.se (som jag verifierade fortfarande kör Shopify — checkout-token och cdn/shop i källkoden).

**Grundprincipen: publicering är en statusändring, inte en kopiering**

Det absoluta kärnmönstret hos proffsen — Contentful, Sanity, Shopify, alla — är att "publicera" aldrig betyder "kopiera data till sajten". Det betyder att ändra ett tillstånd på **en enda källa till sanning**. Eventet lever som en post i din databas med en livscykel: `draft → published → archived` (ofta med `publish_at` för schemaläggning). Den publika sajten läser *bara* poster med status published. Det är hela idén bakom headless CMS: en source of truth i innehållskaoset, med säker leverans varsomhelst via API. Knappen "Publicera på miranon.se" flippar alltså i grunden ett fält — allt annat är distribution.

Andra halvan av mönstret är hur ändringen når sajten snabbt. Standarden är webhook-driven cache-invalidering: när en redaktör publicerar fyrar systemet en webhook till frontend/CDN — "denna URL är inaktuell, bygg om den" — och bara de berörda sidorna regenereras; så får team uppdateringar på under en sekund utan att bygga om hela sajten. I Next.js-världen är det revalidateTag/revalidatePath i en endpoint som tar emot CMS:ets webhook — exakt rätt route purgas och frontenden uppdateras direkt. Proffsen gör den dessutom finkornig: webhooken fyrar vid publish med dokumenttyp och slug, endpointen verifierar signaturen och purgar cachen för just de berörda URL:erna.

**Två arkitekturer — och vilken som gäller dig**

**Pull-modellen** (sajten hämtar publicerade poster från samma backend via ett publikt läs-API + cache) är det renaste och vad du skulle köra om miranon.se var en egen Next.js-app. **Push-modellen** (admin-appen skriver innehållet in i sajtplattformen via dess API) är vad proffsen gör när sajten är en plattform de inte kontrollerar renderingen på — och det är din situation, eftersom miranon.se är Shopify.

Och här finns ett förstklassigt Shopify-svar: **metaobjects**. Det är Shopifys egna anpassade datastrukturer som appar kommer åt via API, teman via Liquid — i praktiken ett inbyggt headless CMS i Shopify, utan tredjepartsappar. Avgörande för din knapp: din app gör autentiserade anrop till GraphQL Admin API (med read_metaobjects och write_metaobjects-scopes), kan sätta publishable-status redan när posten skapas, och ändrar sedan published-status via API för att styra synligheten på storefronten.

**Så här ser flödet ut för "Publicera på miranon.se"**

Engångsjobb: skapa en metaobject-definition `event` i Shopify (titel, plats, datum, beskrivning, bild, anmälningslänk osv.) med capabilities *publishable* + *storefront access*, och bygg en tema-section som loopar event-entries på eventplanering-sidan. Sedan gör knappen detta, server-side i admin-appen:

1. Validera eventdatan (Airtable förblir source of truth).
2. Upsert:a en metaobject-entry via Admin API, med eventets Airtable-ID som handle — det gör operationen **idempotent**, så dubbelklick eller "uppdatera på sajten" aldrig skapar dubbletter.
3. Sätt publishable-status till aktiv.
4. Skriv tillbaka `shopify_metaobject_id` + `published_at` i Airtable-raden — då kan knappen byta till "Uppdatera på sajten" / "Avpublicera" (avpublicera = sätt status till draft).
5. Klart. Shopify sköter rendering, CDN och cache själva — du slipper hela invalideringskedjan.

Den sista punkten är en verklig fördel. En känd svaghet med egenbyggd headless är att "klicka publicera" blir en kedja: editor sparar → webhook triggar → CI/CD-bygge → redeploy → CDN rensar cache — kraftfullt men skört, och lätt att knäcka när ett steg fallerar. Push-till-Shopify ger dig proffsmönstret utan den skörheten.

En sak till som talar starkt för detta: **publik trafik ska aldrig träffa Airtable direkt.** Airtables API har en hård gräns på 5 requests per sekund per bas, och som communityn uttrycker det: Airtable är inte avsett eller designat som databackend i realtid — lösningen är att eliminera realtidsberoenden på det. Publiceringen är exakt den elimineringen: besökarna läser Shopifys CDN, Airtable rörs bara i publiceringsögonblicket.

**"Öppnar för anmälan" — separera synlighet från bokningsbarhet**

Proffsen modellerar detta som två oberoende saker: *visible* (syns på sajten) och *bookable* (`registration_opens_at`, `registration_closes_at`, `capacity`). Ett event kan vara publicerat som "kommande" innan anmälan öppnat, och stänga anmälan när det är fullt utan att försvinna från sajten. På sikt är proffsuppgraderingen av själva formuläret att ersätta Elfsight→Zapier-kedjan med en endpoint i din egen backend som tar emot anmälan (med eventets ID som dolt fält), gör kapacitetskontrollen server-side, skriver till Airtable och skickar bekräftelsen via Resend — då äger du hela kedjan och kan visa "3 platser kvar" live.

Tre proffsdetaljer att inte hoppa över: **audit-spår** (vem publicerade vad, när — en logg-rad per publicering), **förhandsvisning** (visa i admin-appen exakt hur eventet kommer se ut innan knappen trycks; i CMS-världen är detta draft/preview-läget), och **schemalagd publicering** (ett publish_date-fält som Liquid-villkoret jämför mot nutid är det enkla Shopify-sättet).

Sammanfattat: status-fält i Airtable + idempotent push till en Shopify metaobject via Admin API + tema-section som renderar publicerade entries. Det är branschledarmönstret för exakt din stack — och skulle ni någon gång bygga om miranon.se till en egen app byter du bara push-steget mot pull + on-demand revalidation, medan datamodellen (draft/published, visible/bookable) står orörd kvar. Vill du ha metaobject-definitionen och GraphQL-mutationerna utskrivna som nästa steg?

---

## Tur 3 — Om båda sidorna custombyggs

**Marcus:**

> Just nu ligger ju miranon.se på shopify, men jag menar om jag custombygger den på nytt alltså, så båda publika sajten och admin appen är custombyggda

**Claude:** *(researchade Next.js 16 Cache Components, revalidateTag, draft mode)*

Då blir det ännu renare — det är faktiskt drömscenariot. När båda sidorna är custombyggda försvinner hela push-steget, och branschmönstret kollapsar till sin kärna: **en databas, två appar, och "publicera" är en radändring plus en cache-invalidering.** Så här ser proffsbygget ut.

**En källa till sanning — och den är inte Airtable**

Publika sajten och admin-appen läser och skriver mot **samma databas** (Postgres via t.ex. Supabase eller Neon). Ingen synk, ingen kopiering, inga webhooks till tredje part. Och här kommer det viktiga skiftet mot din nuvarande setup: publik trafik kan inte gå mot Airtable — 5 requests per sekund per bas, och communityts eget besked är att Airtable inte är avsett eller designat som realtids-databackend; lösningen är att eliminera realtidsberoenden på det. Proffsen lägger alltså den kanoniska `events`-tabellen i Postgres. (Vill Roger och Lotta fortfarande *se* datan i Airtable kan du synka dit envägs som en läskopia — men sanningen bor i Postgres.)

I kod-struktur betyder det oftast ett monorepo: `apps/admin` + `apps/web` + ett delat `packages/db` med schema och queries (Drizzle eller Prisma), så båda apparna använder exakt samma definition av vad ett event är. Alternativt, för er skala, en enda Next.js-app där `/admin` ligger bakom inloggning — ännu enklare, och revalideringen blir ett direkt funktionsanrop istället för ett API-anrop mellan appar.

**Datamodellen: publicering är ett tillstånd**

```
events
  status: draft | scheduled | published | archived
  publish_at, published_at
  registration_opens_at, registration_closes_at, capacity
  slug
```

Publika sajten frågar bara `status = 'published' AND publish_at <= now()`. Och proffsdetaljen: den regeln upprätthålls i **datalagret, inte i UI:t**. Med Supabase gör du det med Row Level Security — anon-rollen *kan* bokstavligen inte läsa opublicerade rader, även om någon anropar API:t direkt. Utkast läcker inte för att en utvecklare glömde ett where-villkor.

**Vad knappen "Publicera på miranon.se" faktiskt gör**

En server action i admin-appen, i princip fyra rader:

1. Validera att eventet är komplett (datum, plats, slug, bild).
2. `UPDATE events SET status='published', published_at=now()`.
3. Skriv en audit-rad (vem, vad, när).
4. Invalidera cachen: `revalidateTag('events')` + `revalidateTag('event:<slug>')`.

Steg 4 är där 2026-års Next.js lyser. Med Cache Components prerendras allt till statiska skal som standard, du cachar datan med `'use cache'` + `cacheTag()`, och `revalidateTag(tag, 'max')` markerar taggen som inaktuell med stale-while-revalidate — besökaren får det cachade svaret medan färskt hämtas i bakgrunden. Invalideringen är kirurgisk: inte sidnivå, inte global, utan riktad — exakt de cacheposter som rör eventet. Det här är mönstret som varje produktionssajt med CMS-innehåll konvergerar mot: tagga dina fetches, spräng taggarna vid publish. Sajten är alltså blixtsnabb statisk 99,9 % av tiden och uppdateras inom sekunder när du trycker på knappen. Jämför med den sköra kedjan i äldre headless-uppsättningar — editor sparar → webhook → CI/CD-bygge → redeploy → CDN-rensning — som helt försvinner här, eftersom det inte finns någon tredje part i mitten.

Två fällor proffsen designar bort direkt: **avpublicera** måste invalidera både listan och detaljsidan, och vid **slug-byte** måste både gamla och nya sluggen invalideras, annars pekar gamla URL:en på cachat innehåll.

**Tre saker som skiljer proffsbygget från hobbybygget**

**Förhandsvisning.** Innan Roger trycker publicera vill han se sidan exakt som den blir. Next.js har draft mode inbyggt: en preview-länk från admin-appen sätter en cookie som gör att sajten renderar opublicerat innehåll, ocachat, bara för den sessionen. Redaktörer behöver motsatsen till en cache — de vill se innehåll som inte publicerats än.

**Schemalagd publicering.** Sätt `status='scheduled'` + `publish_at`. Ett cron-jobb (Vercel Cron, varje minut) flippar till published och kör revalideringen vid exakt rätt ögonblick — det ger sekundprecision på lanseringar, vilket ren query-filtrering inte gör eftersom cachen inte vet att klockan passerat tidpunkten.

**Anmälan i egen regi.** Nu när båda ändarna är dina ersätter du Elfsight→Zapier-kedjan helt: anmälningsformuläret på eventsidan postar till en server action → kapacitetskontroll transaktionellt i databasen (ingen race när två personer tar sista platsen) → bekräftelse via Resend → klart. "3 platser kvar" blir en livesiffra, och `registration_opens_at/closes_at` styr knappens tillstånd oberoende av om eventet syns.

Det fina i kråksången: datamodellen (draft/published, visible/bookable, audit, preview) är identisk med den jag beskrev för Shopify-scenariot. Det enda som byts är distributionsmekanismen — från "push metaobject via Admin API" till "revalidateTag i samma kodbas". Så du kan bygga admin-appens eventmodell efter det här mönstret *redan nu*, köra push-till-Shopify som distributionssteg så länge sajten ligger kvar där, och byta till pull-modellen den dag du custombygger miranon.se, utan att röra datamodellen.

Vill du att jag skissar det konkreta schemat (Drizzle/SQL) och server-actionen för publiceringsknappen?

---

## Tur 4 — Behövs Elfsight och extern formulärtjänst?

**Marcus:**

> Det var precis det jag ville komma till nu, anmälningarna. För att fånga in anmälningarna idag så använder vi ju ett elfsight formulär, och vi använder elfsights eventkalender för eventen, då skulle vi bli av med elfsight helt då eller? Men behöver vi ingen extern formulärtjänst alls?

**Claude:**

Ja — Elfsight åker ut helt, båda delarna, och nej, du behöver ingen extern formulärtjänst alls. Det är värt att förstå *varför*, för det förklarar vad tjänster som Elfsight, Typeform och Tally egentligen är till för.

De existerar för att lösa ett enda problem: människor som inte har en backend. Ett formulär är ju bara HTML-fält plus någonstans att skicka datan — och det "någonstans" är hela produkten de säljer. I ditt nuvarande upplägg är Elfsight-formuläret + Zapier i praktiken en hyrd backend som till slut landar raden i Airtable. Den dag du har en egen custombyggd sajt med databas *är* du backenden. Då blir formulärtjänsten inte bara onödig utan en försämring: en iframe med tredjepartsscript som tynger sidan, data som tar en omväg via Elfsights och Zapiers servrar (två extra personuppgiftsbiträden ur GDPR-synpunkt, helt i onödan), och noll möjlighet till det som gör anmälningar på riktigt — transaktionell kapacitetskontroll, dubblettskydd, live-platsräknare.

Samma sak med eventkalendern. Elfsights kalender är bara en rendering av eventdata — och i det custombyggda scenariot är eventsidan per definition en rendering av din `events`-tabell. Kalendern "ersätts" alltså inte av något nytt verktyg; den blir en komponent du ändå bygger, med exakt den design ni vill ha istället för Elfsights widget-utseende.

Det ärliga svaret innehåller dock en lista på vad formulärtjänsterna gjorde åt er i det tysta, som nu blir ditt ansvar — inget av det är svårt, men det ska med:

**Spamskydd.** Ett publikt formulär utan skydd får botanmälningar. Standardreceptet är honeypot-fält + rate limiting på servern, och vill du ha bältet-och-hängslen lägger du på Cloudflare Turnstile (gratis, osynlig captcha utan Googles kak-cirkus).

**Server-side-validering.** Zod-schema i server actionen — aldrig lita på klienten.

**Dubbletter och kapacitet.** Unik constraint på `(event_id, email)` så samma person inte anmäler sig två gånger, och platskontrollen i samma databastransaktion som inserten så två personer inte kan ta sista platsen samtidigt.

**Bekräftelsen.** Resend har ni redan — anmälan klar → mail direkt, med eventinfo och ev. avbokningslänk. Det är faktiskt *bättre* än idag, där bekräftelselogiken hänger på Zapier-flöden.

Det enda externa som är kvar i bilden är **betalningar**, om anmälan till en utbildning ska betalas direkt vid bokning. Betalflöden bygger man aldrig själv — där är mönstret Stripe Checkout: din server action skapar en checkout-session, Stripe sköter kortsidan, en webhook tillbaka till dig bekräftar betalningen och först då markeras anmälan som betald. (Idag löser Shopify det åt er — det är den biten som kräver en riktig ersättare vid en custombyggnation, inte formulären.)

Så nettoresultatet av custombygget: Elfsight borta, Zapier borta för det här flödet, snabbare sajt, färre GDPR-parter, och anmälningarna landar direkt i samma databas som admin-appen läser — vilket betyder att Roger och Lotta ser anmälningarna trilla in i realtid i appen du redan bygger, istället för i tre olika verktyg.

---

## Tur 5 — Rakt in i Supabase?

**Marcus:**

> Så då går anmälningarna rakt in i supabase då?

**Claude:**

Precis — rakt in i Supabase, i en `registrations`-tabell som ligger vägg i vägg med `events`. Men en viktig proffsdetalj i *hur* den landar där, för det finns två vägar och bara en av dem är rätt:

**Inte** webbläsaren → Supabase direkt. Supabase gör det frestande enkelt att låta frontenden skriva direkt till databasen med anon-nyckeln (det är så många Lovable-byggen gör det), men för ett publikt anmälningsformulär är det fel väg — då sker validering, spamskydd och kapacitetskontroll i klienten, där vem som helst kan kringgå dem med ett enkelt anrop mot ditt API.

Rätt väg är webbläsaren → **din server** → Supabase. Formuläret postar till en server action i Next.js, och där händer allt det jag räknade upp: Zod-validering, honeypot/rate limit, dubblettkoll och kapacitetskontrollen i samma transaktion som inserten. Servern skriver sedan raden med sin egen serverklient. I RLS-termer: anon-rollen får läsa publicerade event men får *inte* skriva i `registrations` alls — bara din server får det. Så är dörren stängd även om någon pratar direkt med Supabase-API:t.

Flödet i sin helhet:

```
Besökare fyller i → server action → validering + kapacitet →
INSERT i Supabase → Resend-bekräftelse → "Tack, du är anmäld!"
```

Och här kommer en fin bonus för admin-appen: Supabase har Realtime inbyggt, så admin-appen kan prenumerera på inserts i `registrations` — Roger och Lotta ser bokstavligen anmälningarna dyka upp i appen i samma sekund de skickas, utan att ladda om. Deltagarlistan per event, "12 av 20 platser tagna", allt är bara queries mot samma databas.

Frågan det här väcker — och som är värd ett eget beslut — är vad som händer med **personregistret i Airtable**. Två rimliga lägen: antingen blir Supabase sanningen även för personer och Airtable fasas ut (renast på sikt), eller så behåller ni Airtable som Rogers och Lottas bekväma vy och du synkar nya anmälningar dit envägs, server → Airtable, som en läskopia. Båda funkar; det enda du inte vill ha är två ställen som *båda* räknas som sanning.

---

## Tur 6 — Har Airtable en framtid?

**Marcus:**

> Vi planerar en full migrering till supabase.
>
> Alltså vad har folk Airtable till egentligen när supabase finns och enkeltheten att bygga egna interna verktyg och webbplatser med ai? Har Airtable en framtid?

**Claude:** *(researchade Airtables AI-pivot: Omni, Hyperagent, Cobuilder, marknadsläge)*

Bra fråga, och den träffar mitt i ett skifte som pågår just nu — Airtable själva höll på att dö på det, faktiskt.

Först det ärliga svaret på vad folk *egentligen* har Airtable till: det är inte en databas. Det är ett **gränssnitt**. Postgres i Supabase är sanningen, men den har inget ansikte för civilister — någon måste bygga vyer, formulär, behörigheter, filter, mobilanpassning. Airtable *är* allt det där ur kartongen: grid, kanban, kalender, formulär, automationer, delning på fältnivå, och noll underhåll. Ingen deploy, inga dependency-uppdateringar, ingen server som går ner en söndag. Produkten köps inte av utvecklare utan av ops-människor som inte har någon utvecklare — och det avgörande är inte att de inte *kan* få ett verktyg byggt, utan att de med Airtable inte behöver **vänta på någon** för att lägga till ett fält eller ändra en vy. Självbetjäningen är hela grejen.

Men din intuition stämmer: den vallgraven eroderar snabbt, och det vet Airtable. De gick igenom en "Airtable is dead"-cykel 2023–2024 med två varselrundor på totalt 491 anställda, precis eftersom kategorin "bygg interna verktyg utan ingenjörer" började attackeras från två håll samtidigt — AI-appbyggare som Lovable, Bolt, Replit och v0 underifrån, och utvecklare som du från sidan, för vilka custom plötsligt blev billigt. Ditt eget arbetsflöde är beviset: när en person med Claude Code kan bygga miranon-media-admin på Supabase försvinner Airtables raison d'être för just det användningsfallet.

Deras svar blev en fullständig AI-omstöpning: VD:n Howie Liu blev "IC-CEO" som kodar dagligen, de skeppade Cobuilder 2024 (naturligt språk-appbyggare som blev företagets snabbast adopterade funktion någonsin), sedan Omni i juni 2025 — en konversations-AI som bygger kompletta appar med tabeller, gränssnitt och automationer utifrån en beskrivning — och Hyperagent, autonoma agenter med egna beräkningsmiljöer. Och det har funkat, åtminstone finansiellt: vid mitten av 2026 har de återställt över 100 miljoner dollar i fritt kassaflöde. *(Not: Claudes ursprungliga påstående om en Series F på 11,7 mdr rättades i tur 8 — det var 2021-värderingen.)*

Men lägg märke till *vart* de flyttar sig. Positioneringen Liu nu artikulerar är Airtable som "operativsystemet för AI-agenter inom enterprise" — i konkurrens med Salesforce Agentforce och Microsoft Copilot Studio, inte med Supabase. De trycker på att enterprise-kunder väljer vilka AI-modeller som är aktiverade, att admins slår på AI på workspace-nivå och att modelleverantörer aldrig behåller datan — och de sitter i 80 % av Fortune 100. Deras bet är alltså: ja, AI bygger apparna nu — men stora organisationer vill att det sker *inne i en styrd plattform* med behörigheter, granskning och compliance, inte som femtio vildvuxna Lovable-appar som IT-avdelningen inte känner till.

Så har Airtable en framtid? Min bedömning: ja, men en smalare och tråkigare än den de hade. Det blir ett enterprise-governance-verktyg för organisationer med tusentals icke-tekniska anställda — där är "någon vibe-kodar ett verktyg" ett mardrömsscenario, inte en lösning. För **er** situation — litet team, en utvecklare med AI-verktyg, behov av att äga datan och flödena — pekar allt åt Supabase-hållet, och migrationen ni planerar är rätt läst i tiden.

En sak bara, som är värd att säga högt eftersom den är priset för flytten: i Airtable-världen var plattformen underhållsfri och Lotta kunde själv lägga till en kolumn. I custom-världen **är du plattformen** — varje nytt fält, varje ny vy går genom dig, och bus-faktorn är 1. Det är helt hanterbart, men det ska vara ett medvetet val: bygg admin-appen så att de vanligaste "jag vill bara ändra en grej"-behoven är självbetjäning i UI:t, och håll schema-ändringar disciplinerade (migrations i git, som du redan jobbar). Då får ni Supabases ägande utan att förlora det Airtable faktiskt var bra på.

---

## Tur 7 — Utveckla "operativsystemet för AI-agenter"

**Marcus:**

> Utveckla positioneringen "operativsystemet för AI-agenter inom enterprise". Vad menar Liu?

**Claude:** *(researchade Howie Liu-intervjuer, Superagent-lanseringen, TechCrunch-rapportering)*

Först en rättelse från min sida: jag skrev tidigare att Airtable rest en Series F på ~11,7 miljarder — det var en sekundärkällas hopblandning. TechCrunchs rapportering är att 11,7 miljarder var toppvärderingen under nollränteyran 2021, och att bolaget nu handlas på andrahandsmarknader kring 4 miljarder — men med 1,4 miljarder totalt rest, hälften kvar i kassan och positivt kassaflöde. Det gör faktiskt positioneringen *mer* begriplig: det här är ett moget bolag som satsar sin framtid på en ny arkitektur, inte ett bolag som firar.

Så vad menar Liu? Ta OS-metaforen på allvar. Ett operativsystem är lagret mellan program och hårdvara: det ger program minne, processorkraft, filsystem och — avgörande — **behörigheter**. Ett program får inte läsa en annan användares filer; kerneln säger nej. Lius tes är att AI-agenter behöver ett motsvarande lager mellan sig och företaget, och att ingen sådan plats finns idag. Agenter i dagens företag är hemlösa: de bor i en chattruta, saknar beständigt strukturerat minne, har antingen inga behörigheter eller alldeles för många, och lämnar inga granskningsbara spår. Airtables bet är att deras plattform redan råkar innehålla OS:ets fyra komponenter:

**Minnet** — strukturerad, relationell, typad data. En agent som agerar mot en governerad databas med länkade poster är pålitlig och granskningsbar; en agent som agerar mot en hög dokument och webbläsarflikar är det inte. **Behörighetssystemet** — samma fältnivå-permissions som styr vad Lotta får se styr vad agenten får se; i deras egen formulering analyserar AI:n bara den data användaren har behörighet till i det specifika gränssnittet, och admins aktiverar AI på workspace-nivå med modellval och garantier om att data aldrig tränas på. Det är kernelns åtkomstkontroll, applicerad på agenter — och exakt det Fortune 100-inköpare kräver. **Schemaläggaren** — automationer och workflows: agenter triggas av händelser i datan, kör, skriver tillbaka resultat, och human-in-the-loop-steg fungerar som interrupts. **Skärmen** — interfaces där människor övervakar och korrigerar agenternas arbete i samma vyer som sitt eget.

Ovanpå det har de nu byggt själva "processerna": Superagent — deras första fristående produkt på 13 år — bygger på "multi-agent coordination": du ställer en fråga och får inte en AI som fumlar sig igenom sekventiella uppgifter, utan en koordinerande agent som skickar ut specialister som arbetar parallellt, med Lius formulering "you're not prompting an AI". Och Hyperagent: autonoma agenter med egna beräkningsmiljöer som kan lära sig färdigheter och deployas i Slack.

Den strategiska läsningen har två lager. Utåt är det en kamp om vem som äger agentlagret i företaget — mot Salesforce Agentforce och Microsoft Copilot Studio — för den som äger det lagret kommoditerar all SaaS under sig. Inåt är det självkannibalisering med öppna ögon: Liu säger själv att Superagent på sikt kan komma att överskugga Airtable — för om agenter gör jobbet tappar det klassiska per-seat-gränssnittet värde, och då är det bättre att äta sin egen affär än att låta någon annan göra det.

Den skeptiska motbilden ska också sägas: *alla* gör anspråk på OS-positionen just nu (Microsoft, Salesforce, OpenAI, Anthropic via MCP), OS-positioner är vinnaren-tar-mest, och öppna protokoll som MCP riskerar att göra själva substratet till en råvara — kan agenter prata med vilken datakälla som helst är det oklart varför just Airtables lager är OS:et och inte bara ännu en ansluten enhet. Deras verkliga vallgrav är installbasen och governance-UX:en, inte tekniken.

Och lägg märke till det roliga: det Liu beskriver i enterprise-skala är strukturellt *exakt* det du håller på att bygga i miniatyr. Supabase är det strukturerade minnet, RLS är behörighetskerneln, admin-appen är skärmen där människor övervakar, och AI-assistenten med verktyg + approvals från vår första diskussion är agenten. "OS för agenter" är inte en abstrakt vision — det är samma arkitektur du redan skissar, fast såld till Fortune 100 istället för till Roger och Lotta.

---

## Tur 8 — OS för AI-agenter: HUR, rent praktiskt?

**Marcus:**

> Förstår fortfarande inte. Hur menar Liu/Airtable att deras produkt skall användas rent praktiskt? OS för AI-agenter - HUR?

**Claude:**

Okej, glöm metaforen. Här är vad det betyder i praktiken, med händerna på tangentbordet.

Kärninsikten är denna: **i Airtables modell bor agenterna inne i databasen — varje rad är en arbetsorder, varje kolumn kan vara en agent, och statusfälten är löpande bandet.** Låt mig visa med ett scenario ur Rogers och Lottas egen värld.

Säg att de vill pitcha Roger till 200 poddar. Tabellen `Poddar` har raderna. Så här används plattformen:

**Steg 1 — agent som kolumn.** Du lägger till en kolumn "Research", men istället för en formel är kolumnen en *field agent* med en prompt: "Ta reda på poddens målgrupp, lyssnarstorlek och kontaktväg." Airtables field agents analyserar och kategoriserar poster baserat på prompts — agenten kör en gång per rad, automatiskt även för nya rader, och skriver resultatet i cellen. 200 rader = 200 agent-körningar. Ingen chatt inblandad; jobbkön *är* tabellen. *(Not: nyanserades i tur 9 — field agents arbetar på befintlig raddata, extern webbresearch är Hyperagent-territorium.)*

**Steg 2 — agent som steg i automation.** En automation triggas när Status ändras till "Redo att pitcha": ett AI-steg skriver ett personligt pitchmail baserat på radens fält (poddens inriktning + Rogers bakgrund) och lägger utkastet i fältet "Utkast". Inget skickas.

**Steg 3 — människan i gränssnittet.** Lotta öppnar ett interface som visar alla rader med status "Väntar på godkännande", läser utkastet, klickar Godkänn — då skickar automationen mailet och flyttar status till "Pitchad". Det är human-in-the-loop som en vy, inte som ett chattfönster.

**Steg 4 — fråga datan.** Roger klickar på Omni-ikonen och frågar på vanlig svenska "vilka tre poddar borde vi prioritera och varför?" — och Omni analyserar bara den data han har behörighet att se i det gränssnittet.

**Steg 5 — de stora jobben.** "Gå igenom alla 200 poddar, hitta vilka som bytt kontaktperson, uppdatera fälten" ges till Hyperagent — autonoma agenter med egna beräkningsmiljöer (inklusive webbläsare) som jobbar parallellt, och Superagent-modellen är att en koordinerande agent skickar ut specialister som arbetar parallellt istället för en AI som fumlar sig igenom uppgifterna i tur och ordning. Resultaten landar som — just det — uppdaterade rader.

Ser du mönstret nu? Jämför med alternativet, en ChatGPT-flik: där gör AI:n ett jobb vars resultat *avdunstar i chattloggen*. I Airtable-modellen landar varje agentresultat som strukturerad data som (a) alla i teamet ser, (b) triggar nästa steg i kedjan, (c) har versionshistorik, och (d) lyder under samma behörigheter som människorna. Det är därför Liu kallar det ett OS: databasen är agenternas **runtime** — den ger dem arbetsuppgifter (rader), minne (fält), schemaläggning (automations-triggers), rättigheter (permissions) och en skärm där människor övervakar dem (interfaces). "Appen" du bygger i Airtable är numera i praktiken en fabrik där människor och agenter jobbar i samma tabeller.

Det är också därför pitchen riktar sig till företag utan utvecklare: en ops-person kan sätta upp hela poddflödet ovan utan en rad kod. Du behöver det inte — du kan bygga exakt samma sak själv med Supabase (rader), pg_cron/edge functions (schemaläggning), Claude-anrop (agenterna), RLS (rättigheter) och admin-appen (skärmen). Vilket är poängen jag landade i sist: Airtable säljer färdigmonterat det du bygger på beställning.

---

## Tur 9 — Faktakoll: field agents, datainmatning

**Marcus:**

> Är det du säger baserat på fakta?
>
> Men hur kommer datan till Airtable då? Hur kommer de 200 poddarna dit?
>
> Är det field-agenterna Liu menar är AI agenterna?

**Claude:**

Bra att du synar. Låt mig dela upp det ärligt i tre högar: vad som är dokumenterat, vad som var min illustration, och en sak jag faktiskt överdrev.

**Vad som är belagt.** Byggstenarna finns på riktigt och är dokumenterade: Airtables AI-förmågor 2026 spänner över fyra distinkta användningsfall — bygga databaser med Omni, analysera poster med field agents, generera innehåll i automationer, och fråga datan inne i interfaces. Att Omni bara analyserar data användaren har behörighet till i det aktuella gränssnittet är också deras dokumenterade beteende, liksom att Hyperagent är autonoma agenter med egna beräkningsmiljöer och att Superagent bygger på en koordinerande agent som skickar ut specialister parallellt.

**Vad som var min illustration.** Podd-scenariot är *mitt* pedagogiska exempel, hopmonterat av de dokumenterade delarna — det är inte ett exempel Airtable själva ger. Och där överdrev jag på en punkt: jag lät en field agent "ta reda på poddens lyssnarstorlek", alltså researcha på webben. Det dokumenterade om AI-fält är blygsammare — de genererar text, sammanfattar länkade poster eller kategoriserar baserat på prompts, alltså arbetar på datan som redan finns i raden. Extern webbresearch är Hyperagent/Omni-territorium, och på enterprise-nivå. Så den korrekta bilden: field agents förädlar data som finns, de hämtar den inte.

**Hur kommer datan dit då?** Precis som den alltid gjort — det finns ingen magi i det ledet, och det är faktiskt en svaghet i OS-berättelsen. De 200 poddarna hamnar i tabellen via någon av de klassiska vägarna: någon skriver in dem, en CSV-import, ett formulär, eller synk — Airtable trycker själva på pre-built connectors och öppna API:er som anslutningsvägen. Det nya är att agenter börjar kunna vara ingest-kanalen också: ett Hyperagent/Superagent-jobb med webbläsare kan i princip få uppgiften "hitta 200 svenska poddar inom andlighet och skapa en rad per podd". Men grundsvaret är: OS:et matar inte sig självt — datan måste kopplas in, och det är därför konnektorerna är en så central del av deras pitch.

**Är field agents "AI-agenterna" Liu menar?** Nej — de är den minsta kuggen. Lius vision är en hierarki i stigande autonomi: AI-fält (per cell) → AI-steg i automationer (per flöde) → Omni (konversation, bygger och analyserar) → Hyperagent (autonoma, egna datorer, lär sig färdigheter, deployas i Slack) → Superagent, den fristående produkten där en koordinator styr parallella specialister med native-integrationer och browser-automation. När han säger "OS för agenter" menar han främst de övre lagren — och en sak till som gör metaforen konkret: Airtable har en MCP-server, vilket betyder att *externa* agenter kan operera på baserna. Du sitter bokstavligen på beviset just nu — din Airtable-koppling till mig i den här chatten går via mcp.airtable.com. Jag är i den meningen en tredjepartsagent som kan läsa och skriva era baser under era behörigheter. *Det* är OS-tanken i sin renaste form: plattformen spelar ingen roll vems agenten är — den erbjuder data, rättigheter och spårbarhet till vilken agent som helst som ansluter.

Så din skepsis var berättigad på en punkt (field agents researchar inte), och kärnbilden står: raderna är arbetsordrarna, agenterna i olika storlekar förädlar och agerar på dem, människor övervakar i interfaces — men datan måste fortfarande komma in genom dörren som vanligt.

---

## Tur 10 — Vad hade Liu sagt till Miranon?

**Marcus:**

> Känns väldigt omständigt, det kan ju inte vara så här de säljer in Airtable till folk.
>
> Hur skulle jag/Miranon media använda AirTable för att maxa det liksom, vad hade Liu sagt till mig?

**Claude:**

Haha, nej, exakt — min genomgång var maskinrummet. Säljpitchen är en enda mening. Airtables egen formulering är ordagrant: "Building a custom solution is as easy as having a conversation." Så här hade Liu låtit i ett möte med dig och Miranon:

*"Ni har byggt en admin-app i månader. Ge mig en eftermiddag. Öppna Airtable, välj 'Build an app with Omni', och beskriv verksamheten i klartext: 'Vi driver ett utbildningsföretag. Vi har event med datum, plats och kapacitet. Deltagare som anmäler sig. Ett personregister med 417 personer och deras kurshistorik. Poddmedverkanden. Mailutskick.' Klart. Omni bygger tabellerna, relationerna, gränssnitten — och fyller i exempeldata så ni ser hur det fungerar."* Det är den dokumenterade produkten: Omni konstruerar tabeller, fält, relationer och interfaces automatiskt från en enda prompt, med sampledata så du kan visualisera systemet direkt.

Sedan hade han fortsatt, riktat mot Roger och Lotta snarare än mot dig: *"Anmälningsformuläret? Inbyggt — dela en formulärlänk, svaren blir rader. Bekräftelsemail? En automation. 'Vilka har gått både Fjärrskådning och RIM1 men inte RIM2?' — fråga Omni i sidopanelen, på svenska.* Och det avgörande: *när Lotta vill ha en ny kolumn eller en ny vy nästa vecka ber hon Omni om det. Hon väntar inte på Marcus."* Det är hela pitchen. Den är inte omständlig — den är "prata med din databas, få en app". Omständligheten jag beskrev är vad som händer under huven; kunden ser aldrig den.

Och för att vara rättvis: för **80 % av Miranons interna behov hade det räckt.** Personregistret, kurshistoriken, podd-trackern, eventplaneringen som internt arbetsverktyg, gruppindelningarna inför utskick — allt det är Airtables hemmaplan, och du vet det, för det är ju där ni har det idag.

Men här är varför pitchen ändå inte vinner hela matchen hos er, och det är värt att se klart: Lius pitch är kalibrerad för företag vars behov *slutar vid det interna*. Miranons behov gör inte det. Den publika sajten, anmälningsflödet med kapacitetskontroll i realtid, betalningar, community-integrationen, en kundportal med Roger och Lottas varumärke — inget av det kan Airtable leverera, och det är precis de bitarna som är affärskritiska för er. Ni har dessutom redan känt på gränserna i praktiken: API-taket som gör att publik trafik aldrig kan gå mot basen, och beroendet av Zapier/Elfsight som tejp runt kanterna.

Så det ärliga svaret på "vad hade Liu sagt" är: han hade sålt in Airtable som **hela huset**, och för hans kärnkund — ett ops-team utan utvecklare — är det sant. För er är Airtable i bästa fall *bakkontoret*, aldrig skyltfönstret. Och när du ändå måste custombygga skyltfönstret (sajt, anmälan, betalning, portal) blir frågan om bakkontoret ska ligga i en separat hyrd plattform eller i samma Supabase som allt annat — och då faller kalkylen åt det håll ni redan bestämt er för. Det enda Liu-argumentet som biter kvar efter migreringen är självbetjäningen: att Lotta kan ändra själv utan dig. Det är, som jag sa tidigare, det ni ska designa in i admin-appen medvetet — för det är den enda delen av hans pitch ni faktiskt förlorar.

---

## Tur 11 — Vem är målgruppen? Faktabaserade case

**Marcus:**

> Finns väl knappt inga större ops-team utan utvecklare? Är deras målgrupp små/singelföretagare?
>
> Jag vill ha fler faktabaserade case på hur företag använder Airtable liksom

**Claude:** *(researchade Airtables publicerade kundcase)*

Din slutsats är logisk men premissen är fel åt andra hållet — och det bästa motexemplet är brutalt: **OpenAI är en Airtable-kund** ("OpenAI scales product operations with AI-powered Airtable" är en av deras publicerade kundcase). Världens mest utvecklartäta företag kör alltså sin produktops i Airtable. Det avslöjar den verkliga målgruppen: det är inte *företag* utan utvecklare — det är *team* utan utvecklar**allokering**. BlackRock har tusentals ingenjörer, men alla sitter i produktionskön för kärnprodukten. Marknadsteamet som behöver en intern tracker får aldrig en sprint. Det är gapet Airtable lever i.

Här är dokumenterade case, med siffror:

- **BlackRock (Aladdin Wealth):** En senior produktdirektör byggde själv en app som kopplar ihop teknologer och seniora stakeholders kring produktledning, affärsutveckling, engineering och design — tidigare var kommunikationen utspridd över wikis, mail, chatt och kalkylark. Plus en feedback-app där kundansvariga skickar in synpunkter via formulär live under betatester, rakt in i basen. Resultat: 2× snabbare deployment av nya funktioner, 580 sparade timmar per månad, 300+ anslutna teammedlemmar.

- **Wondery (Amazons poddstudio)** — närmast er egen bransch: Airtable som centralnav för produktionsdata, kalendrar och scheman; AI-automatisering av veckomailen om nya avsnitt sparar 4–5 timmar i veckan, minskar manuellt arbete med poddmetadata, och AI-funktionerna hjälpte dem hitta nya intäktsmöjligheter för annonsförsäljning.

- **Radio France:** hanterar 3,5 miljoner on-demand-innehållstillgångar, ersatte kalkylark och frånkopplade system, centraliserade rättighetsdata och redaktionella/juridiska flöden — handläggningstiden för redaktionella förfrågningar föll 66 %.

- **Vimeo:** kundupplevelseteamet byggde 46 egna appar som kopplar 7 team och konsoliderade 15+ arbetsflöden i en plattform.

- **Schaeffler AG** (tysk industrikoncern): halverade global tid för innehållsproduktion och ersatte sex verktyg med ett.

- **Pottery Barn & Riot Games:** från att strömlinjeforma publiceringen av tiotusentals bilder till Pottery Barns webbplats till storytelling-arbetet hos Riot Games spelutvecklare. Även AWS egna marknadsteam använder Airtable för sina marknadsflöden, med Airtable AI på Bedrock.

Ser du mönstret i vilka *köparna* är? Aldrig IT, aldrig kärnprodukt-engineering. Det är produktops, marknadsops, content-/produktionsteam, kundupplevelse — funktioner vars arbetsflöden är för nischade för färdig SaaS och för lågprioriterade för den interna utvecklarkön. Och notera vad som är frånvarande i *varje* case: inget kundvänt, ingen publik trafik, ingen kärnprodukt (BlackRock påpekar uttryckligen att appen inte innehåller klientdata). Airtable är de storas bakkontor — exakt den roll jag argumenterade att den skulle ha haft hos er.

Småföretagare och soloanvändare finns förstås i basen — men de är säljtratten, inte affären. Motorn är klassisk bottom-up: ett team adopterar gratis/Team-nivån på egen hand, det sprider sig, och sedan kommer enterprise-avtalet med governance ovanpå. Intäkterna bor i toppen: 80 % av Fortune 100. Så svaret på din fråga är nästan det omvända — Airtables verkliga målgrupp är de *största* företagen i världen, fast de säljer till avdelningarna som ingenjörerna aldrig hinner hjälpa.

---

## Tur 12 — Var går gränsen?

**Marcus:**

> Jag försöker hitta var gränsen går, när används Airtable och när gör det inte det, i mitt fall, i fall för småföretag.

**Claude:**

Ingen research behövs här — allt material ligger redan på bordet, det handlar bara om att dra linjen. Och den går skarpare än man tror. Här är gränsen, formulerad som fyra frågor att ställa per projekt:

**1. Vem rör datan — bara anställda, eller kunder/allmänhet?**
Detta är den hårdaste gränsen. Så länge varje människa som läser och skriver i basen sitter *på insidan* av verksamheten fungerar Airtable. I samma ögonblick som allmänheten ska interagera — publik sajt, anmälningar, kundinloggning, betalning — är du utanför, tekniskt (5 req/s, ingen kundauth) och designmässigt (widgets, ingen varumärkeskontroll). Notera att detta är exakt mönstret i storföretagscasen: BlackRock, Vimeo, Wondery — allihop internt, noll kundvänt. Regeln skalar rakt ner till småföretag.

**2. Skriver människor eller maskiner?**
Airtable är byggt för mänsklig takt: någon fyller i ett formulär, någon drar ett kort, en automation skickar ett mail. Behöver du maskintakt — transaktioner, kapacitetskontroll där två anmälningar tävlar om sista platsen, realtid, tiotusentals rader som system läser och skriver — då behöver du en riktig databas. Tumregel: **Airtable är en whiteboard, Postgres är en maskin.** Whiteboards är utmärkta så länge det är människor som står vid dem.

**3. Finns en utvecklare i loopen — varaktigt?**
Här ändrar AI kalkylen, men bara på ena sidan. Om kunden efter leverans ska klara sig *själv* utan dig vinner Airtable stort: noll underhåll, självbetjäning, inget som går sönder. Om du finns kvar i relationen (som med Miranon) försvinner det argumentet — då är du ändå underhållet, och custom kostar numera timmar istället för veckor. Så: engångsleverans till kund utan teknikperson → Airtable. Pågående relation där du äger stacken → custom lönar sig allt oftare.

**4. Är arbetsflödet färdigtänkt eller under utforskning?**
Ett flöde som ändras varje vecka ("ska vi ha ett statusfält till? testa en annan gruppering?") hör hemma i Airtable, där schemaändringar är drag-and-drop och gratis. Ett flöde som stabiliserats och blivit affärskritiskt förtjänar kod: migrations i git, tester, audit. Airtable är alltså också ett utmärkt **prototypstadium** — ni bevisade hela Miranons datamodell (personer, kurser, grupper, anmälningar) i Airtable innan en rad Supabase-schema skrevs. Det var inte omvägen, det var rätt ordning.

Applicerat på dina egna projekt blir kartan tydlig. **Fraktteams rekryteringsflöde** (Typeform → Make → Airtable): internt, lågvolym, människor granskar varje kandidat — rätt verktyg, låt det vara. **MarcusOS**, din privata databas: en användare, mänsklig takt, noll underhållsbudget — Airtable är rationellt, migrera bara om du vill, inte för att du bör. **Miranon**: började som rent bakkontor (rätt i Airtable) men växte kundvända tentakler — publika anmälningar, sajtdata, snart portal — och korsade därmed gräns 1 och 2. Det är *därför* migrationen känns rätt: inte för att Airtable är dåligt, utan för att projektet bytte kategori.

Så om du vill ha hela gränsen i en enda mening: **Airtable så länge alla användare står på lönelistan och varje skrivning kommer från en människa eller ett formulär — custom i samma stund som allmänheten eller maskinerna ska in.** Och den finaste versionen av arbetssättet är inte antingen/eller utan en pipeline: nya idéer och flöden föds i Airtable där de är billiga att ändra, och de som visar sig bära verksamheten graderas upp till Supabase-stacken där de får integritet, hastighet och ett publikt ansikte.

---

## Tur 13 — Beroendet av Marcus & vibe coding-säkerhet

**Marcus:**

> Det klarnar allt mer.
>
> Jag vet att Roger och Lotta blir beroende av mig med denna custom lösning på appen och webbsidan, men jag försöker jobba bort det, jag vill lösa det. Jag vill bygga det så att de kan ta över och förvalta det. Det är klurigt. Man måste ha lite kunskap om sakerna, eller? Lovable och liknande, förlitar man sig på en AI-chatt för att lösa allt kan det ju gå hur som helst, hur ser lovable och liknande, och Anthropic typ på detta? Vem som helst kan sätta upp vilken app som helst genom att chatta, men för gemene man blir det ju aldrig riktigt bra och säkert om man har noll kunskap, eller hur?

**Claude:** *(researchade Lovable-säkerhetsincidenterna, vibe coding-statistik, Anthropics human-in-the-loop-position)*

Din magkänsla är inte bara rätt — den är dokumenterad i incidentrapporter. Låt mig ge dig faktaunderlaget först, sedan hur jag tycker du löser Roger/Lotta-problemet, för det *går* att lösa — men inte på det sätt Lovables marknadsföring antyder.

**Vad facit säger om noll-kunskaps-byggande**

Termen "vibe coding" myntades av Karpathy i februari 2025, blev Collins ord för året, och Gartner förutspår att 60 % av all ny kod är AI-genererad vid slutet av 2026. Men säkerhetsdatan över hela kategorin är konsekvent: mellan 40 och 62 % av AI-genererad kod innehåller sårbarheter beroende på studie, och AI-skriven kod producerar brister i 2,74 gånger högre takt än mänsklig kod.

Och Lovable specifikt är ett skräckexempel just nu — tre stora incidenter på 13 månader. CVE-2025-48757: saknade RLS-policies i Lovable-genererade projekt gjorde att angripare utan inloggning kunde dumpa hela tabeller — användarlistor, betalningsdata, API-nycklar — via den publika anon-nyckeln; över 170 appar exponerades. Sedan april 2026-haveriet: en behörighetsbrist lät vilket gratiskonto som helst läsa andra användares källkod, databasuppgifter, Stripe-ID:n och hela AI-chatthistoriker; buggen rapporterades 3 mars och ignorerades i 48 dagar, och bland det exponerade fanns 18 697 studentposter varav 4 538 minderåriga. Mitt favoritexempel på kärnproblemet: Moltbook, ett AI-socialt nätverk vars grundare offentligt sa att han inte skrivit någon kod alls — Wiz Research hittade Supabase-nyckeln exponerad i klient-JavaScript och RLS helt avstängt, vilket gav full läs- och skrivåtkomst till produktionsdatabasen. En scanning av 20 000 indie-lanseringar fann att 11 % exponerar Supabase-uppgifter i frontend-koden.

Den viktigaste meningen i hela materialet är dock denna: Lovable är inte unikt osäkert — det är *representativt* osäkert. Problemet är inte verktyget. Problemet är exakt det du satte fingret på: personen som chattar vet inte vad den ska be om, och känner inte igen när något saknas. Ingen av incidenterna hände för att AI *inte kan* skriva RLS-policies — de hände för att ingen visste att fråga efter dem eller verifiera dem.

**Hur branschen själv ser på det**

Ingen vid fronten påstår längre att noll kunskap räcker. Anthropics linje är konsekvent human-in-the-loop: Claude Code Security skannar kodbaser och föreslår patchar *för mänsklig granskning* — "ingenting appliceras utan mänskligt godkännande; utvecklare fattar alltid beslutet", och även i de mest autonoma lägena varnar Anthropic att människor ska vara sista grindvakten för kritisk affärslogik. TechCrunchs sammanfattning av läget: vibe coding har snabbat upp utvecklingen men infört nya buggar, säkerhetsrisker och dåligt förstådd kod — och Anthropics svar är AI-granskare som fångar det innan det når kodbasen. Lovable och Supabase har svarat på sitt håll: Supabase har publicerat en säkerhetschecklista och AI-prompts specifikt för vibe coders, och deras CISO:s formulering är talande — RLS är "enkelt, kraftfullt och alltför ofta ignorerat". Branschens samlade slutsats, från en av analyserna: disruptionen är verklig, men ansvaret förblir mänskligt.

**Så löser du Roger och Lotta-beroendet — på riktigt**

Här är omramningen som löser upp knuten: **målet är inte att göra dem till systemförvaltare. Målet är två helt olika saker, och båda går att nå.**

**Ett: de ska äga driften till 100 %, du ska äga systemet.** Varje återkommande vardagsbehov — skapa event, publicera, se anmälningar, skicka utskick, ändra texter, priser och bilder på sajten — ska vara självbetjäning i admin-appen. Detta är den legitima kärnan i Lovable-löftet, och du kan leverera den *säkert*, för skillnaden är att deras frihet rör sig inom ramar du byggt: ett textfält i admin-appen kan inte råka stänga av RLS. Begränsad självbetjäning är trygg; obegränsad generering är hur incidentlistan ovan skrevs. Praktisk regel: varje gång de behöver ringa dig för något återkommande är det en designbugg i admin-appen — bygg bort den.

**Två: gör dig utbytbar istället för onödig.** Bus-faktor 1 löses inte genom att lekmän tar över underhållet — det löses genom att *vilken kompetent utvecklare som helst* kan ta över på en dag. Det betyder: tråkigaste möjliga stack (Next.js + Supabase + Vercel är den mest överlämningsbara kombination som finns — varje frilansare kan den), managed services som sköter patchning och backuper åt er, få beroenden, ingen fyndig kod, README + driftrunbook (dina Scribe/Loom-vanor är redan halva jobbet), och — viktigast och oftast missat — **ägarskap**: Roger och Lotta ska stå som ägare på Supabase-organisationen, Vercel-kontot, domänen och GitHub-repot, med dig som medlem. Då är beroendet inte av *Marcus* utan av *en roll*, och rollen kan fyllas av vem som helst om du blir påkörd av en buss eller bara vill vidare.

Så, svar på din direkta fråga: ja, man måste ha kunskap — men den kunskap som krävs är inte att skriva kod (det gör AI:n), utan omdöme: veta vad man ska be om, känna igen när något är fel, förstå konsekvenser. Den kunskapen chattar man sig inte till, och det är därför din roll inte försvinner utan förflyttas — från den som bygger till den som granskar, ramar in och äger arkitekturen. Det du bygger åt Miranon blir bra just *för att* det finns en person med omdöme i loopen. Ditt jobb är inte att avskaffa den personen — det är att se till att den personen inte måste vara du för evigt.

---

## Tur 14 — Passionslyftet & vibe-kaoset i världen

**Marcus:**

> Alltså jag vet inte ens om jag kan rekommendera Lovable eller supabase (eller liknande) i Passionslyftet. Alltså till vanliga otekniska personer som bara vill utforska idén om att ge något till andra genom sin passion. Det kan bli totalt kaos. Där är Airtable den enda datakällan man vågar rekommendera ju.
>
> Det måste ju finnas miljontals vibe-kodade sidor och appar och databaser som är fullständigt kaos i världen just nu.

**Claude:**

Du har just formulerat den insikt som halva branschen fortfarande inte vågar säga högt. Och ja — för Passionslyftets målgrupp är slutsatsen rätt. Men låt mig ge dig den skarpaste versionen av regeln, för den handlar inte om verktyg utan om en enda fråga.

Frågan är inte "kan de bygga det?" — det kan alla numera, det är hela problemet. Frågan är: **vems data ligger i det när det blir fel?** Där går linjen. En passionsutforskare som vibe-kodar en receptsamling, en portfolio, en prototyp för att testa en idé — värsta fallet är en trasig sida, ingen skadad. Men i samma sekund som *andra människors uppgifter* ska lagras — anmälningar, kunder, medlemmar, betalningar — är personen plötsligt personuppgiftsansvarig enligt GDPR med en databas den inte förstår. Moltbook-grundaren som stolt inte skrivit en rad kod och fick hela produktionsdatabasen öppen för läsning *och skrivning* är inte ett undantag — 11 % av 20 000 skannade indie-lanseringar exponerade sina databasuppgifter rakt i frontend-koden.

Så regeln du kan ge Passionslyftet-deltagare är denna: **rekommendera bara verktyg där säkerheten är plattformens jobb, inte användarens.** Det är den egentliga skillnaden mellan kategorierna. I Airtable finns ingen RLS att glömma — plattformen äger inloggning, behörigheter och drift, och felkonfigurationsutrymmet är minimalt. Samma sak med Squarespace för sajten, Tally för formulär, Skool eller Circle för community, Shopify för försäljning. Det är inhägnade trädgårdar. Lovable + Supabase är motsatsen: motorsågar utan klingskydd, där säkerheten är en *konfiguration användaren måste veta att be om* — och det är precis den vetskapen målgruppen per definition saknar. Så Airtable är inte "den enda datakällan man vågar rekommendera" av en slump — den är det för att den tillhör rätt kategori. Vibe-verktygen kan fortfarande få plats i Passionslyftet, men i sin trygga zon: utforska, prototypa, visualisera idén, bygga saker utan andras data. Enkel gräns att lära ut: *chatta fram allt du vill — tills någon annans namn ska sparas. Då byter du till färdig SaaS eller tar in hjälp.*

Och din andra tanke — ja, den stämmer och är kvantifierbar. Lovable ensamt har 8 miljoner användare, 40–62 % av AI-genererad kod innehåller sårbarheter, och det som byggs överges dessutom: appar utan ägare med kunskap, beroenden som ruttnar, databaser som ingen minns lösenordet till. Det är 2000-talets WordPress-plugin-träsk igen, fast med tusen gånger högre byggtakt. En hel innehållsgenre har redan uppstått kring det — artiklar i stil med "din Lovable-app har slagit i väggen, här är vad du gör nu" är bokstavligen en egen kategori, och säkerhetsfirmor granskar nu tusentals vibe-kodade appar och hittar samma tre fel i nästan varenda en.

Vilket leder till den konstruktiva vändningen, för det här är inte bara ett träsk — det är en våg som skapar efterfrågan på exakt din profil. Varje kaosapp därute är en framtida kund åt någon som kan *städa, säkra och ta över* — och varje Passionslyftet-deltagare som lär sig gränsen i förväg slipper bli en. Så insikten du just hade är inte en fotnot i programmet. Den är en av de mest värdefulla sakerna du kan lära ut: inte "så bygger du", utan "så vet du när du inte ska bygga själv". Det är, ironiskt nog, samma omdömeskunskap vi landade i förra svaret — och den blir bara mer värd ju billigare byggandet blir.

---

## Tur 15 — Knuten: trygga verktyget klarar inte målet

**Marcus:**

> Men det jobbiga för mig nu är ju att jag känner att Airtable är den enda datakälla/backend som jag kan med att rekommendera, men samtligt vet jag ju om Airtables begränsningar, som du också berättat för mig. Jag hade ju inte behövt bygga någon admin app om Airtable hade kunnat göra allt jag vill. Om gränsen du drog att så fort allmänheten och maskiner ska skriva in data och uppgifter så är Airtable inte rätt verktyg. Förstår du mitt dilemma? Känner du knuten jag känner.
>
> Jag kan inte lära ut det jag gjort för Roger och Lotta till massan, det är alldeles för svårt och tidskrävande liksom.
>
> Vad säger du? Vad har du för tankar?

**Claude:**

Jag känner knuten, och jag ska försöka lossa den — för jag tror den sitter på ett annat ställe än där du drar.

Knuten som du beskriver den: det trygga verktyget klarar inte målet, och verktyget som klarar målet är inte tryggt att rekommendera. Och en passionsverksamhet korsar ju gränsen *per definition* — hela poängen med "ge något till andra" är att allmänheten kommer: anmäler sig, bokar, betalar. Så det rekommenderade verktyget havererar exakt i det ögonblick passionsprojektet lyckas. Det är en genuint obekväm tanke.

Men här är felet i premissen, och det är ett glädjande fel: **du ställer frågan som om valet står mellan Airtable och Supabase — två horisontella verktyg där man bygger själv. För massan är svaret inget av dem. Svaret är vertikal SaaS.**

Tänk på vad en passionsutforskare faktiskt behöver: en sida, ett sätt att ta emot anmälningar, ett sätt att få betalt, ett sätt att leverera. Vartenda ett av de behoven har färdiga produkter där just det är *hela produkten* — och där leverantören äger säkerheten, kapaciteten och betalflödet. Event med anmälan och platstak? Luma. Sälja kurser och digitalt material? Podia eller Kajabi. Bokningar? Calendly. Betalningar utan webbshop? Stripe Payment Links. Community? Skool, som ni själva valde. Ingen av dessa personer behöver en "backend" överhuvudtaget — och det är poängen. Allmänheten skriver aldrig i deras databas, för det finns ingen databas; allmänheten skriver i Lumas databas, och Luma har ett säkerhetsteam.

Och märk var Airtable då hamnar: precis innanför gränsen du drog, som **det interna navet**. Anmälningarna från Luma, kunderna från Stripe, svaren från Tally — allt kan rinna in i en Airtable-bas där passionsägaren, ensam, har sin överblick: vilka har varit på vad, vem ska följas upp, hur går det. Bara ägaren skriver där (plus formulär, som är Airtables sanktionerade ventil för publik *inmatning* — envägs, begränsad, ofarlig). Din gränsregel bryts alltså aldrig. Airtable är inte den enda datakällan du vågar rekommendera — den är den enda *interna* datakällan de behöver, medan de publika delarna hyrs färdiga.

Så var passar Miranon in? Det är det som löser upp resten av knuten: **Roger och Lotta är inte mallen — de är undantaget.** De hade vuxit *ur* vertikal SaaS: 417 alumner med kurskombinationer, egna varumärkeskrav på sajten, publiceringsflöden, portalplaner. Det är därför du behövde bygga. Men det är ett framgångsproblem som kommer efter år av verksamhet, och när en Passionslyftet-deltagare någon gång når dit är svaret inte "nu ska du lära dig det Marcus kan" — det är "nu anlitar du någon som Marcus". Precis som de anlitar en revisor när bokföringen växer ur Excel. Du känner skuld över att du inte kan lära ut steg tre till massan, men steg tre ska inte läras ut. Det ska *kännas igen*.

Och där ligger, tror jag, det verkliga kursinnehållet — en trappa i tre steg som är fullständigt lärbar: **Utforska** (bygg vad som helst med vad som helst, även vibe-kodat, så länge ingen annans data är inblandad). **Första kunderna** (vertikal SaaS för allt publikt, Airtable som internt nav, betalningar via Stripe/Shopify — noll egen säkerhet att ansvara för). **Urvuxen** (tecknen: du slåss mot verktygens gränser varje vecka, du vill äga upplevelsen, volymerna växer — då tar du in hjälp). Att lära ut trappan, och framför allt *känsla för var man befinner sig på den*, är exakt den omdömeskunskap vi pratade om — och den kan du lära ut just för att du själv gått hela vägen med Miranon.

Så mitt svar på knuten: du behöver inte kunna rekommendera en backend till massan. Du behöver befria dem från idén att de behöver en. Det du byggt åt Roger och Lotta är inte kursmaterialet — det är meriteringen som gör att du kan rita kartan.

---

## Tur 16 — Varför ska allt rinna in i en Airtable-bas?

**Marcus:**

> Sant. Men varför ska allt rinna in i en Airtable bas? Det va väl det du sa inte skulle ske? Det är ju det man vill ska ske, man vill få in allt på ett ställe, men det var ju de vi sa inte Airtable var byggt för? Det var inte så andra företag använder Airtable? Men det är ju ändå så folk håller på, använder Zapier för att skriva/skicka data kors och tvärs.

**Claude:**

Du har fångat mig i en formulering som var för trubbig — och det är en bra fångst, för den tvingar fram den skarpare versionen av regeln. Min enradare "så fort maskiner skriver är Airtable fel" är inte exakt sann. Det som avgör är inte *vem* som skriver. Det är **var i flödet Airtable sitter.**

Skillnaden är denna: det farliga är Airtable i **kritiska vägen** — som systemet som måste svara rätt, direkt, under belastning, medan en kund väntar. Kapacitetskontrollen när två personer tar sista platsen. Sidan som allmänheten läser. Betalningen. Där är 5 req/s, avsaknad av transaktioner och kundauth dödande. Det ofarliga är Airtable **nedströms** — som mottagare av fakta *efter* att de redan hänt någon annanstans. När Luma-anmälan rinner in via Zapier har transaktionen redan ägt rum: Luma kollade kapaciteten, Stripe tog betalningen, kunden fick sin bekräftelse. Airtable får bara ett kvitto på ett faktum. Skrivvolymen är mänsklig i sitt ursprung (en rad per människa som gjorde något), synken är asynkron (om Zapier ligger nere en timme kommer datan ikapp och ingen kund märker något), och kopian är återuppbyggbar (blir basen korrupt exporterar du om från Luma och Stripe — sanningen bor kvar hos dem). Airtable som *server* är felet. Airtable som *sänka* är mönstret.

Och det är faktiskt exakt så storföretagen använder det — titta på casen igen med de här glasögonen. BlackRock synkar in feedback via formulär och koordinerar ovanpå; Wondery samlar produktionsdata från källsystem till ett nav; hela Airtables enterprise-pitch är pre-built connectors och öppna API:er som matar baser med data från Salesforce, Jira, Snowflake. Inflödena är produktens ytterdörr. Det ingen av dem gör är att låta *kunderna* stå i basen och vänta på svar.

Här är analogin som knyter ihop allt: du beskrev själva längtan — "man vill få in allt på ett ställe". Det vill *varje* företag i världen, och de stora har löst det på precis ett sätt: datalagret. Salesforce, Stripe och affärssystemen är sanningskällorna som gör jobbet i kritiska vägen, och allt rinner *nedströms* in i ett Snowflake där ledningen får sin överblick. Men ingen serverar kunder från datalagret — det vore vansinne. **Airtable är småföretagarens Snowflake plus cockpit.** Överblicksplatsen, inte maskinen. Längtan efter "allt på ett ställe" är helt legitim; mognaden ligger i att det stället placeras nedströms om transaktionerna, inte mitt i dem.

Sedan har du rätt i att "folk håller på med Zapier kors och tvärs" — och *kors och tvärs* är exakt där det ruttnar. Enkelriktade pilar från få källor in i ett nav är hanterbart och robust. Det som blir kaos är tvåvägssynk (konflikter, loopar, vems version vinner?) och många-till-många-nät där ingen längre vet vilken koppling som skriver vad. Så reglerna att lära ut i Passionslyftet är tre: **ett nav, enkelriktade pilar, navet ska kunna raderas och byggas om från källorna utan att något går sönder.** Klarar upplägget det testet — "kan jag slänga min Airtable-bas ikväll och återskapa den imorgon utan att en enda kund påverkas?" — då sitter Airtable på rätt plats. Klarar det inte testet har basen smugit sig in i kritiska vägen.

Vilket, som avslutande poäng, är precis vad som hände hos Miranon. Elfsight → Zapier → Airtable började som kvittoflöde men gled mot kritiska vägen: bekräftelser, gruppindelningar och utskick började *bero* på basen, och sajtplanerna ville läsa den. Det var därför det knakade — inte för att mönstret var fel från början, utan för att basen sakta befordrades från cockpit till motor. Din Supabase-migrering är i den meningen inte ett underkännande av Airtable-mönstret. Den är återställandet av det: motorn får bli en riktig motor, och överblicken får vara överblick.

---

## Tur 17 — Nödutgången: att se datan utan Airtable

**Marcus:**

> Nja. Okej.
>
> Jag är ju lite tveksam till att lämna Airtable och gå till supabase, då blir admin appen enda stället där man enkelt kan se datan, Lotta går ju inte in i supabase och kollar liksom. För svårt. Jobbigt att allt blir beroende av admin-appen.
>
> Hur tänker proffs här?

**Claude:** *(researchade NocoDB, Metabase, spreadsheet-UI ovanpå befintlig Postgres)*

Din tvekan är helt legitim, och den har ett namn: det du är rädd att förlora är **nödutgången** — rutnätet där man alltid kan se och peta i datan även när ingen byggt en vy för exakt det man undrar. I Airtable är nödutgången gratis och inbyggd. I Supabase-världen är Studio-tabellredigeraren tekniskt sett en sådan, men du har rätt: Lotta ska inte vara där, det är produktionsdata utan skyddsräcken.

Så här tänker proffs, och det är två sanningar som håller ihop:

**Sanning ett: i professionella system tittar ingen i databasen — appen är gränssnittet.** Ingen på ett Salesforce-drivet företag öppnar den underliggande databasen; varje vy någon behöver är byggd. Det är "rätt" men dyrt, och det är exakt det du känner obehag inför: att varje "jag vill bara kolla en grej" blir ett utvecklingsärende hos dig.

**Sanning två: därför förlitar sig proffs aldrig på transaktionsappen ensam.** De skiljer på två sorters gränssnitt och bygger dem olika. *Arbetsflödena* — publicera, skicka, anmäla, allt som skriver och har konsekvenser — bor i admin-appen med validering och skyddsräcken. *Utforskandet* — bläddra, filtrera, "hur många kom från Göteborg egentligen?" — bor i ett separat, ofta läs-endast lager som bultas fast ovanpå databasen och kräver noll utveckling per fråga. Klassikern där är Metabase-typen av BI-verktyg: icke-tekniska personer klickar ihop egna frågor och dashboards utan SQL.

Och här kommer det som löser din knut på riktigt: **du behöver inte välja bort rutnätet — det finns som ett lager man lägger ovanpå Supabase.** NocoDB, öppen källkod med 50 000+ GitHub-stjärnor, kopplas till en befintlig Postgres-databas och lägger ett kollaborativt kalkylarksgränssnitt ovanpå — det introspekterar schemat och ger dig en spreadsheet-vy direkt, med grid-, kanban-, galleri-, kalender- och formulärvyer, länkade poster, lookups och rollups. Det beskrivs träffande som verktygets killer-funktion: att ge ops-teamet en kalkylarksvy in i data de inte kan nå via SQL — och det kan sättas som read-only för säkerhets skull. Med andra ord: Lotta behåller sitt Airtable-liknande rutnät, men rutnätet pekar på *samma* databas som sajten och admin-appen kör på. En sanning, två fönster.

Så proffsuppsättningen för Miranon blir tre lager ovanpå en databas: **admin-appen** för de ~20 arbetsflöden som betyder något (skrivningar, med skyddsräcken) — **NocoDB read-only** (eller Metabase) för hela svansen av spontana titta-behov, gärna pekad mot städade SQL-vyer med svenska kolumnnamn så Lotta ser "Namn, Kurs, Anmäld datum" istället för råa tabeller — och **exporter** som sista utväg. Då försvinner "allt beror på admin-appen": appen behöver bara täcka flödena, aldrig varje tänkbar vy. En viktig disciplinregel bara: skrivningar går *alltid* genom appen, aldrig genom rutnätet — annars kringgår man valideringen och är tillbaka i att fri redigering i produktionsdata är själva risken. Titta fritt, röra genom appen.

Och så den fina cirkeln: den tredje nödutgången är den vi började hela den här konversationen med. AI-assistenten i admin-appen med läsverktyg mot databasen *är* ett datautforskningsgränssnitt — det mest Lotta-vänliga som finns. "Hur många är anmälda till RIM3? Vilka har inte betalat?" — svar på svenska, noll vyer att bygga, noll rutnät att lära sig. Så det som såg ut som ett skäl att tveka inför Supabase är i själva verket ett av de starkaste skälen för assistent-planen från ditt första meddelande.

---

# Centrala källor som användes under konversationen

- Vercel: AI SDK 5, AI SDK 6 och AI SDK 7 (officiella releasebloggar) — agenter, ToolLoopAgent, needsApproval, WorkflowAgent
- Shopify Engineering: "Building production-ready agentic systems" (Sidekick, tool complexity, just-in-time instructions)
- Auth0/Okta, Stytch, WorkOS, Curity, Nango — auktorisering och behörigheter för AI-agenter
- CopilotKit-dokumentation & AG-UI-protokollet; assistant-ui; jämförelser av AI-chatt-UI-bibliotek 2026
- Shopify dev-docs: Metaobjects (definitioner, entries, publishable capability, Admin GraphQL API)
- Next.js-dokumentation: revalidateTag, Cache Components, draft mode; Contentful/Sanity-integrationsguider
- Airtable: officiell dokumentation (Omni, field agents, enterprise), kundcase (BlackRock, Wondery, Radio France, Vimeo, Schaeffler, Pottery Barn, Riot Games, OpenAI), supportdokument om API-limits
- TechCrunch: Superagent-lanseringen och Airtables värderingsläge (jan 2026)
- The Next Web, Bastion, Superblocks m.fl.: Lovable-säkerhetsincidenterna (CVE-2025-48757, april 2026-läckan), vibe coding-statistik
- CyberScoop, CSO Online, The Hacker News: Anthropic Claude Code Security & Code Review (human-in-the-loop)
- NocoDB-dokumentation och jämförelser av open source-verktyg för spreadsheet-UI ovanpå Postgres

---

*Dokument genererat av Claude (Anthropic) på Marcus begäran, 21 juli 2026. Transkriptet återger konversationens samtliga meddelanden; sökmoment och rättelser är markerade i kursiv där de förekom.*
