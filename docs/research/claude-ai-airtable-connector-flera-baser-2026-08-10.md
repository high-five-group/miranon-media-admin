# claude.ai:s Airtable-connector och flera baser

> **Proveniens:** avgränsat research-pass (bakgrundsagent), 2026-08-10, kört
> oisolerat i huvudkatalogen enligt uppdrag från S103-orkestreraren. Skriver
> endast denna fil. **Read-only hela vägen:** inget fält, ingen formel,
> ingen automation och ingen datarad har ändrats i någon Airtable-bas.
> Genomsökning av `docs/research/` och `docs/decisions/` gav ingen tidigare
> post som besvarar frågan direkt. Enda träffen var en rad i
> `~/.claude/CLAUDE.md` § "Verktygsfakta som lätt gissas fel" (S90,
> 2026-07-26) som bokför samma tvåserversituation och uttryckligen lämnar
> frågan öppen: *"den nådde i det fallet endast prod, och pariteten mot
> staging förblir overifierad och får aldrig antas."* Detta pass stänger den
> luckan.

## Frågan

Kan claude.ai:s Airtable-connector (`mcp__claude_ai_Airtable__*`) nås mot mer
än en Airtable-bas, och om ja: hur kopplar man in en bas till som den i dag
inte ser (staging, `apphjj8Q7lkXCMsL4`)?

## Svar upp front

**Ja, det går.** Begränsningen är en OAuth-beviljandegräns satt när
connectorn auktoriserades, inte en synlighetsfilter baserad på senast
besökta baser. Steget för att lägga till fler baser görs på Airtables egen
sida, inte i claude.ai:s connector-inställningar: Airtable-konto → Account →
Integrations → Third-party integrations → välj MCP-integrationen → **Add a
base** → välj staging-basen → spara. Ingen ny inloggning i claude.ai krävs
enligt Airtables egen dokumentation av detta flöde.

Den avgörande delfrågan var (1): är begränsningen behörighet eller
synlighet. Svaret är entydigt behörighet, styrkt av en egen mätning i denna
session (se nedan), inte bara av dokumentation.

## Vad källorna säger

### Delfråga 1: behörighet eller synlighet

Mätt live i denna session, 2026-08-10, mot Marcus Airtable-konto:

| Anrop | Resultat |
|---|---|
| `mcp__claude_ai_Airtable__list_bases` | Returnerar **endast** prod (`app8uGPrVCVOm6LfD`), med `"permissionLevel":"create"`, `"isFavorite":false`, `"recentlyViewedTimestamp":"2026-08-10T09:13:55.493Z"` |
| `mcp__claude_ai_Airtable__search_bases("staging")` | `{"bases":[],"hint":"No bases found matching the search query."}` |
| `mcp__claude_ai_Airtable__list_workspaces` | `Streamable HTTP error: {"error":"FORBIDDEN","message":"Forbidden"}` |

Sökningen på "staging" gav noll träffar, inte en lägre rankad träff. Det
utesluter hypotesen att staging finns i listan men trycks ned av en
relevans-sortering (vilket "senast besökt"-hypotesen skulle förutsäga). Om
basen bara var lågt rankad hade den ändå dykt upp i en riktad sökning på sitt
eget namn.

`list_workspaces` som gav `FORBIDDEN` är ett ytterligare tecken på att
denna connector kör med ett smalt, resurs-scopat OAuth-token snarare än ett
kontoomfattande admin-läge: den kan inte ens lista workspaces, vilket vore
trivialt om den hade generell kontobehörighet.

Airtables egen supportsida för MCP-servern (se källförteckning) beskriver
`list_bases`-verktygets fält på samma sätt som verktygets egen beskrivning i
denna session gör: *"Favorited and recently viewed bases are generally more
relevant."* Den textmässiga matchningen (samma formulering i både
verktygsbeskrivningen vi ser och Airtables supportartikel) är ett starkt
indicium, men inte en explicit bekräftelse från någon förstapart, för att
claude.ai:s Airtable-connector faktiskt kör mot Airtables egna hostade
MCP-server snarare än en Anthropic-egen implementation. Fältet
`recentlyViewedTimestamp` är enligt den formuleringen en
**presentations-/sorteringssignal**, inte en åtkomstgrind: den avgör i
vilken ordning tillgängliga baser listas, inte vilka baser som räknas som
tillgängliga.

Detta stämmer också med det redan bokförda faktumet i `CLAUDE.md`: PAT-servern
(`mcp__airtable__*`, personal access token) ser **båda** baserna, eftersom
ett PAT skapas med en explicit lista av baser vid skapandet och inte går
via något efterhandsval. OAuth-connectorn har en annan beviljandemodell
(se nästa delfråga), och de två servrarna kan därför ha helt olika
bas-uppsättningar trots att de pekar mot samma Airtable-konto.

**Källa:** Airtable, "Using the Airtable MCP server",
<https://support.airtable.com/docs/using-the-airtable-mcp-server> (hämtad
2026-08-10).

### Delfråga 2: hur beviljar man åtkomst till ytterligare en bas

Airtables egen dokumentation för tredjeparts-OAuth-integrationer beskriver
ett separat administrationssteg, skilt från själva OAuth-auktoriseringen:

> "users can also grant access by clicking **Add a base** and **Save
> changes**."

Menyvägen anges så här:

> "Click **Account** in the top right corner and select **Integrations**.
> Choose **Third-party integrations**."

Den MCP-specifika supportsidan ger en konkret URL för samma yta:

> "Navigate to <https://airtable.com/?integrations=thirdParty>, or click on
> your user profile in Airtable and click **Integrations** and then
> **Third-party Integrations**."
>
> "Select your MCP integration. Add or remove bases/apps as needed. You can
> also add apps where you have interface-only access."

Detta är alltså **inte** samma sak som att omauktorisera hela connectorn i
claude.ai. Det är en fristående admin-yta på Airtables sida som utökar en
redan befintlig OAuth-token med fler resurser, utan att i sig kräva ett nytt
inloggnings-/samtyckessteg i claude.ai.

**Källor:**

- Airtable, "Third-party integrations via OAuth overview",
  <https://support.airtable.com/docs/third-party-integrations-via-oauth-overview>
  (hämtad 2026-08-10).
- Airtable, "Using the Airtable MCP server",
  <https://support.airtable.com/docs/using-the-airtable-mcp-server> (hämtad
  2026-08-10).

Anthropics egen dokumentation beskriver den ursprungliga
anslutningsceremonin (inte tillägget av fler baser till en befintlig
anslutning) så här: gå till Connectors-menyn i Claude (plus-knappen eller
"/"), välj "Manage connectors", hitta Airtable, klicka "Connect" eller
"Install", och följ Airtables autentiseringsprompt. Vid problem hänvisar
supportartikeln till att koppla bort och koppla om:

> "If authentication fails, try disconnecting and reconnecting from
> Customize > Connectors."

Dokumentationen uttalar sig **inte** om huruvida en bas som läggs till via
Airtables "Add a base"-flöde slår igenom automatiskt i en redan ansluten
claude.ai-session, eller om ett nytt handslag (frånkoppling/ny anslutning,
eller åtminstone en ny konversation) krävs för att verktygslistan ska
uppdateras. Det är den enskilt viktigaste luckan i källäget, se "Vad som är
obelagt" nedan.

**Källa:** Claude Help Center, "Use connectors to extend Claude's
capabilities",
<https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities>
(hämtad 2026-08-10). Anthropics produktsida för connectorn:
<https://claude.com/connectors/airtable> (hämtad 2026-08-10), som pekar
vidare till Airtables egen dokumentation för basvalet i stället för att
beskriva det själv.

### Delfråga 3: känd gräns på antal baser

Airtables dokumentation nämner en gräns, men den är inte den gräns frågan
gissade på. Verbatim:

> "The OAuth limit is 20 for a single user."

Detta är en gräns på **distinkta auktoriseringar per tjänst och användare**
(hur många gånger samma integration kan auktoriseras separat), inte en
gräns på hur många baser en enskild auktorisering får omfatta. Ingen
dokumenterad övre gräns på antal baser inom en auktorisering hittades.
Frånvaro av fynd redovisas här som just det: inget belägg för en sådan
gräns hittades, vilket inte är detsamma som ett bevis för att ingen gräns
finns.

Hypotesen om ett "senast besökta"-beteende (fråga 3 i uppdraget) är
falsifierad av mätningen i delfråga 1 ovan: `search_bases` på basens eget
namn gav noll träffar, inte en lågt rankad träff.

**Källa:** Airtable, "Third-party integrations via OAuth overview",
<https://support.airtable.com/docs/third-party-integrations-via-oauth-overview>
(hämtad 2026-08-10).

### Delfråga 4: går det att tvinga fram synligheten på annat sätt

Att öppna basen i Airtable-webben eller favoritmarkera den bedöms som
**osannolikt verkningslöst**, grundat i slutledning snarare än en explicit
källa som säger nej: Airtables egen dokumentation beskriver "Add a base"
som den enda dokumenterade mekanismen för att utöka en OAuth-integrations
åtkomst, och nämner varken visning eller favoritmarkering som en väg dit.
De två mekanismerna (kontots UI-historik kontra en integrations beviljade
scope) är strukturellt separata i Airtables egen modell: den ena styr vad
som visas för användaren själv i Airtables gränssnitt, den andra styr vad
en tredjepartsapp får läsa via API.

Att återauktorisera hela connectorn (koppla bort och koppla om i claude.ai)
skulle sannolikt fungera, eftersom en ny OAuth-auktorisering innebär ett
nytt val av baser från grunden, men det är en tyngre väg än nödvändigt
eftersom Airtable har byggt "Add a base" som en uttrycklig genväg för att
undvika just det: att slippa auktorisera om från noll varje gång man vill
lägga till en bas. Ett allmänt sökresultat om OAuth-appar bekräftar mönstret
för det tyngre alternativet: att koppla bort och koppla om en app är den
generella vägen att ge den nya scopes, men det är inte specifikt verifierat
mot just claude.ai:s Airtable-connector.

**Källor:** samma två Airtable-sidor som ovan. Ingen förstapartskälla tar
uttryckligen ställning till om visning/favoritmarkering påverkar OAuth-scope
(se "Vad som är obelagt").

## Konkreta steg att pröva

Ordnade efter sannolikhet att fungera och kostnad att pröva, lägst kostnad
och högst sannolikhet först.

1. **Airtables Third-party integrations-sida (rekommenderad väg).** Gå till
   <https://airtable.com/?integrations=thirdParty> (eller Account →
   Integrations → Third-party integrations) i det Airtable-konto som äger
   både prod och staging. Hitta MCP-integrationen som representerar
   Claude/claude.ai i listan, öppna den, klicka **Add a base**, välj
   staging-basen (`apphjj8Q7lkXCMsL4`), spara.
2. **Verifiera i Claude.** Kör `mcp__claude_ai_Airtable__list_bases` på
   nytt. Om listan inte uppdateras direkt i den pågående sessionen: pröva i
   en ny konversation eller session (verktygsytan kan vara bestämd vid
   sessionsstart, samma strukturella klass som andra
   sessionsstart-bundna resurser i detta repo, se
   [`CLAUDE.md`](../../CLAUDE.md) § "En ny hooks skarpbevis kan inte
   FÖRLITAS på i sessionen som byggde den" för det generella mönstret,
   dock ej mätt specifikt för denna connector).
3. **Om steg 1 till 2 inte räcker: koppla om hela connectorn i claude.ai.**
   Customize → Connectors → Airtable → koppla bort → koppla om, och välj
   vid den nya OAuth-prompten antingen "alla nuvarande och framtida baser"
   i workspacet, eller markera prod och staging explicit. Detta är den
   tyngre men mer dokumenterat sanna vägen om steg 1 av någon anledning
   inte slår igenom.
4. **Om staging fortfarande saknas efter omkoppling: verifiera
   collaborator-access.** Kontrollera att Marcus Airtable-användare
   faktiskt har åtkomst till staging-basen (inte bara till ett workspace
   den ligger i). `permissionLevel`-fältet i `list_bases`-svaret avslöjar
   nivån per bas när basen väl syns, som jämförelsepunkt: prod visar i dag
   `"create"`.
5. **Lägst sannolikhet, ren spekulation: besöka eller favoritmarkera basen
   i Airtable-webben.** Kostnadsfritt att pröva som sista utväg eftersom
   det inte kan skada något, men inget i källorna stödjer att det påverkar
   OAuth-scope.

## Vad som är obelagt

- **Om en bas som läggs till via Airtables "Add a base" slår igenom
  omedelbart i en redan öppen claude.ai-session**, eller om ett nytt
  handslag (ny konversation, ny session, eller frånkoppling/ny anslutning)
  krävs. Varken Airtables eller Anthropics dokumentation uttalar sig om
  detta. Detta är den punkt som avgör om steg 1 eller steg 3 ovan är rätt
  första försök, och den går inte att lösa genom fortsatt dokumentläsning:
  den kräver att Marcus provar steg 1 och sedan ett nytt anrop.
- **Exakt namn på MCP-integrationen i Airtables Third-party
  integrations-lista** för claude.ai specifikt (till exempel om den listas
  som "Claude", "Claude MCP" eller ett generiskt namn). Kräver inloggning i
  Airtables gränssnitt, vilket detta pass inte har åtkomst till.
- **Om claude.ai:s Airtable-connector faktiskt kör mot Airtables egna
  hostade MCP-server.** Starkt antytt av att verktygsbeskrivningarna vi ser
  i denna session ordagrant matchar Airtables egen supportartikel om MCP-
  servern, men ingen förstapartskälla bekräftar det explicit i klartext.
- **Om det finns en övre gräns på antal baser inom en enskild
  auktorisering.** Ingen sådan gräns hittades i dokumentationen. Frånvaro av
  fynd, inte ett bevis för frånvaro.
- **Om att besöka eller favoritmarkera en bas i Airtable-webben har någon
  effekt på OAuth-scope.** Ingen källa berör detta i någon riktning. Bedömd
  osannolik av strukturella skäl (se delfråga 4), inte av ett direkt belägg.

## Rekommendation

Prova steg 1 och 2 i "Konkreta steg att pröva" först: de är dokumenterat
korrekta, billigast, och river inget befintligt (staging-basens nuvarande
icke-åtkomst är ett resultat av att den aldrig beviljades, inte av ett
medvetet designval som ska respekteras). Detta är en rekommendation, inte
ett beslut: Marcus äger både Airtable-kontot och claude.ai-anslutningen och
är den enda som kan utföra stegen.

## Källförteckning

- Airtable, "Third-party integrations via OAuth overview",
  <https://support.airtable.com/docs/third-party-integrations-via-oauth-overview>
  (hämtad 2026-08-10).
- Airtable, "Using the Airtable MCP server",
  <https://support.airtable.com/docs/using-the-airtable-mcp-server> (hämtad
  2026-08-10).
- Claude Help Center, "Use connectors to extend Claude's capabilities",
  <https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities>
  (hämtad 2026-08-10).
- Anthropic, "Airtable Connector", <https://claude.com/connectors/airtable>
  (hämtad 2026-08-10).
- Egen live-mätning, 2026-08-10, mot `mcp__claude_ai_Airtable__list_bases`,
  `mcp__claude_ai_Airtable__search_bases` och
  `mcp__claude_ai_Airtable__list_workspaces` i denna session.
- `~/.claude/CLAUDE.md` § "Verktygsfakta som lätt gissas fel" (bakgrund,
  S90-fyndet som denna fråga bygger vidare på).
