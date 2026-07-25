# Arkitektur-konversationen — destillat och gap-analys

> **Proveniens:** destillat av
> [`miranon-arkitektur-konversation-2026-07-21.md`](miranon-arkitektur-konversation-2026-07-21.md)
> (621 rader, konversation Marcus ↔ Claude 2026-07-21, vendoriserad till repot
> 2026-07-25 i S87). Rå-doket är beviskällan; detta är läsytan.
> Landningsformen speglar Pocock-korpusen (`151817c` + `d619622`).
>
> **Status:** konversationen är **INPUT, inte beslut.** Inget här är mintat som
> ADR eller inskrivet i byggplanen. Placeringsfrågan är ett epok-beslut som
> kräver grillning — se § Vad som INTE är avgjort.

## Varför doket landade

Två spår i konversationen saknade durabel bärare i repot och hade dött med
Marcus minne — precis den tysta förlust ADR-053:s triage finns för att
förhindra:

- **AI-assistenten** var **genuint odokumenterad**. Repo-brett grep på
  "AI-assistent", "AI SDK" och "assistent" som produkt-yta gav noll träffar
  (de enda träffarna avser Claude som utvecklingsverktyg i arkiverade
  lättlästa byggplaner).
- **Custom miranon.se** fanns som tråd `T79` (`paused`, ingen kortfil) — men
  bara som EXISTENS. Arkitekturen bakom (pull-vs-push, livscykel-modellen,
  RLS-golvet, server-action-anmälningarna) fanns ingenstans.

## Spår 1 — AI-assistent i admin-appen

### Vad konversationen säger

Kärnmönstret är **inte chatten — det är verktygen**. Referens: Shopify
Sidekick, byggd runt den agentiska loopen. Assistenten får tools som är tunna
wrappers runt funktioner appen redan har, och de anropar **samma service-lager
som UI:t använder — aldrig en parallell kodväg**. Då ärver assistenten
validering och behörighet automatiskt.

Stack-rekommendation: **Vercel AI SDK** (ToolLoopAgent hanterar hela
verktygsloopen; `needsApproval` ger inbyggd human-in-the-loop; WorkflowAgent
för återupptagbar exekvering). UI via `useChat` + AI Elements eller
assistant-ui. CopilotKit övervägt och nedprioriterat till steg 2 — det är
byggt för att assistenten ska *styra* gränssnittet, vilket är mer ramverk och
mer inlåsning än behovet motiverar.

Säkerhetsprinciper: assistenten agerar **som den inloggade användaren**, aldrig
med egen superbehörighet, och behörighetskontrollen sker i service-lagret på
servern — aldrig i prompten. Allt loggas. Human-in-the-loop på destruktiva
åtgärder (läs fritt, skriv med godkännande). Fritext som assistenten läser
behandlas som **data, aldrig som instruktioner** (prompt injection).

Skalnings-lärdomen från Shopify: börja med **8–12 väldefinierade verktyg**,
läsning först. Deras största problem var "tool complexity" när ytan växte från
20 till 50+ överlappande verktyg.

### Var repot redan står

**Starkare än konversationen antog.** Byggplanens §3.1 beskriver ett
**operations-baserat API med deny-by-default** och fält-allowlist per operation
(`supabase/functions/_shared/field-allowlists.ts`, 13 registrerade operationer
över sju tabeller). Det ÄR det service-lager konversationen säger att
verktygen ska wrappa — det finns redan, är CI-grindat med deny/allow-testpar
per operation, och är prod-deployat.

Det gör AI-assistenten till ett **tvärsnitt över allt redan byggt**, inte en
isolerad fas. Verktygsdefinitionerna blir en tunn mappning mot ett register som
redan existerar.

### Gap

| Fråga | Läge |
|---|---|
| Verktygslager mot operations-registret | Finns ej — men underlaget (registret) är komplett |
| Audit-logg för agent-actions | **Överlappar Fas 6.5 (xAPI-aktivitetsloggen)** — konversationens "allt loggas" och byggplanens aktivitetslogg är samma krav sett från två håll |
| Approval-UI (godkännande-kort i chatt) | Finns ej. Angränsande mönster finns: massmutations-grindens kontrollfråga (PRD task-18 beslut 7) |
| Modell-/leverantörsval | Ej diskuterat mot repots villkor |
| AI SDK-versionen | Konversationen säger v6/v7 omväxlande — **måste verifieras mot aktuell dokumentation innan något byggs**, inte citeras ur ett samtal |

## Spår 2 — Publicering och custom miranon.se

### Vad konversationen säger

**Publicering är en statusändring, inte en kopiering.** En källa till sanning;
den publika sajten läser bara poster med `published`-status. Knappen flippar ett
fält — allt annat är distribution.

Två arkitekturer: **push-modellen** (admin-appen skriver in i sajtplattformen
via dess API) gäller idag eftersom miranon.se är Shopify — konkret via
metaobjects över GraphQL Admin API, idempotent upsert med Airtable-ID:t som
handle. **Pull-modellen** (sajten läser publicerade poster ur samma backend,
cache-invalidering via `revalidateTag`) gäller vid ett framtida custombygge.

**Datamodellen är identisk i båda scenarierna** — bara distributionsmekanismen
byts. Därav konversationens tidsordning: bygg eventmodellen efter mönstret
**redan nu**, kör push-till-Shopify så länge sajten ligger där, byt till pull
den dag sajten byggs om, utan att röra datamodellen.

Modellen: `draft | scheduled | published | archived` + **synlighet skild från
bokningsbarhet** (`visible` vs `registration_opens_at` /
`registration_closes_at` / `capacity`). Ett event kan vara publicerat som
kommande innan anmälan öppnat, och stänga anmälan utan att försvinna.

Och en hård gräns värd att bära: **publik trafik ska aldrig träffa Airtable
direkt** — 5 requests/sekund per bas.

### Var repot redan står — och divergensen

Basen har fältet `Publicerad på miranon.se`
(`fldrjj61ovL3Zv1mN`) — en **checkbox**, inte en livscykel. Begreppen
`scheduled`, `archived`, `bookable`, `registration_opens_at` finns inte i
`docs/reference/data-model.md`, i `byggplan.md` eller i `ORDLISTA.md`.

Det är en **konkret divergens mot något som just byggts** (19.4), och den
berör ett kort som redan står öppet: **TASK-32** — publiceringsflaggan saknar
LÄS-väg i appen, är osynlig efter skapande och går inte att ändra.

**Hemvist-frågan är öppen** och tas inte här: livscykel-modellen är antingen
ett **AT-Max-krav** (ADR-063 — bas-maximeringen löser det I BASEN), ett
**T79-krav** (publicerings-kontraktet), eller ett eget kort ihop med TASK-32.
Låt den inte glida in i byggplanen tyst.

## Spår 3 — Airtables framtid, Supabase och nödutgången

Konversationen landar i att **Miranon Media migrerar fullt till Supabase; Airtable
fasas ut eller blir läskopia (aldrig två sanningar)**, och att gränsdragningen
avgörs av **var i flödet Airtable sitter** — kritiska vägen (fel) mot nedströms
sänka/cockpit (rätt). Testet den formulerar: *"Kan basen raderas ikväll och
byggas om från källorna imorgon utan att en kund märker något?"*

Som nödutgång föreslås ett **read-only utforskningslager** (NocoDB mot städade
SQL-vyer, alternativt Metabase) skilt från transaktions-UI:t — *titta fritt,
röra genom appen*. NocoDB finns i repot enbart som research-stickprov i
arkiverad datamodell-research; Metabase har noll träffar.

**Detta rör vid ett låst beslut.** [ADR-063](../../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)
slår fast att Airtable-basen är en **förstklassig leverabel nu** — den maxas
till 11/10 och blir mall i Passionslyftet — och att Supabase-migrationen är ett
separat senare spår, inte en ersättning. Byggplanens **Fas E** bär migrationen
med `DEFER`.

Konversationen **falsifierar inte** ADR-063; den beskriver ett sluttillstånd
ADR-063 redan förutsätter. Men den flyttar tyngdpunkten, och det är precis
klassen av evidens som ska mötas **öppet med kvittens** — aldrig genom tyst
drift.

## Spår 4 — Passionslyftet (annan produkts material)

Cirka 15 % av doket (Del 7 + trappan Utforska → Första kunderna → Urvuxen +
vertikal-SaaS-regeln) pekar mot **Passionslyftet, inte mot detta repo**. Det
följer med råmaterialet men konsumeras inte här. ADR-063 nämner Passionslyftet
som mall-mottagare, men repot har ingen Passionslyft-yta att landa det i.

## Vad som INTE är avgjort — och medvetet lämnas öppet

Ingen ADR mintas ur detta. Prövat mot **ADR-baren**: villkor 3 (resultat av en
verklig avvägning) håller inte ännu — konversationen är input, avvägningen är
inte gjord.

Ingen byggplans-edit görs heller. Skälet är strukturellt, inte försiktighet:
**ingen befintlig fas rymmer spåren.** Fas 7 är production-hardening, Fas 8 är
Background Sync, Fas E är datalager-bytet. Och
[ADR-068](../../decisions/ADR-068-ovnings-ramverket.md) punkt 5 gör **Fas E till
Övning 2:s namngivna slutfas, "sist av alla byggplans-delar"** — och avvisade
uttryckligen att skapa nya faser för det spåret. Därmed:

> **En AI-assistent EFTER Supabase är per definition Övning 3.** En
> AI-assistent FÖRE Supabase kräver ett svar på varför den byggs mot ett
> datalager som ska bytas. Det svaret finns inte i konversationen.

Det är ett **ramverks-beslut, inte en tabellrad**. Öppna frågor till
grillningen:

1. Är AI-assistenten Övning 2 (ny fas före Fas E) eller Övning 3 (efter
   Supabase)? Det senare kräver amendering av ADR-068.
2. Samma fråga för custom miranon.se — pull-modellen förutsätter Postgres,
   vilket binder den till efter Fas E. Beslutas de två spåren ihop eller var
   för sig?
3. Var hör livscykel-modellen hemma: AT-Max, T79, eller ett eget kort ihop
   med TASK-32?
4. Ska Fas 6.5:s aktivitetslogg designas så den redan bär agent-actions
   (konversationens "allt loggas"), eller hålls de isär?

**Lämpligt tillfälle för byggplans-editen är Fas 6-avslutet**, som ändå öppnar
§2-tabellen (Fas 6 → KLAR + AT-Max-dekomponering). Att öppna det styrande
dokumentet två gånger för samma tabell är slöseri.

## Framtida korpus

Marcus går **Matt Pococks AI SDK v6 Crash Course**, avsedd som kunskapskälla
när assistenten byggs — samma roll Pocock-korpusen har för arbetssättet.
Materialet finns ännu inte på disk och blir en separat landning i samma form
(sannolikt `docs/reference/ai-sdk/`).

**Namn-rättelse värd att bära:** filen `ai-coding-for-real-engineers-svenska.md`
existerar inte någonstans på disk (sökt över `~/Repon`, `~/Downloads`,
`~/.claude`). Precedenten som åberopas är **Pocock-korpusen** i
[`docs/reference/pocock/`](../pocock/). Bygg ingen referens på det namnet.
