---
owner: marcus803
updated: 2026-08-05
review_by: 2027-02-05
status: draft
---

# Marketplace- vs plugin.json-`description`: vinner samma fält som `version`? (2026-08-05)

> **Proveniens:** avgränsat research-pass, beställt för att pröva Marcus
> observation 2026-08-05 att `plugins[0].description` i
> `marcus-system/.claude-plugin/marketplace.json` är föråldrad mot
> `plugin.json`s — och för att avgöra om den delar `version`-fältets belagda
> "silently ignored"-egenskap (S97 Del 7, hub-commit `7d4bf51`) innan samma
> åtgärd (borttag) appliceras reflexmässigt på ett fält som visade sig bete
> sig annorlunda.

## Kort svar

**Samma vinnare, men INTE samma mekanism.** Empiriskt mätt: `claude plugin
details marcus-system` (installerad-vy) skriver ut `plugin.json`s
beskrivning ordagrant — marketplace-entryns kortare text syns aldrig i den
ytan. Det är samma utfall som för `version`. Men skälet skiljer sig, och det
spelar roll för åtgärden:

- **`version`** har en NAMNGIVEN cross-check i validatorn (`claude plugin
  validate`), ett explicit dokumenterat resolution-kapitel
  ("Version resolution and release channels"), och en varning som fyrar när
  värdena divergerar.
- **`description`** har INGEN av delarna. Validatorn (mätt: `claude plugin
  validate .claude-plugin/marketplace.json --strict`, marcus-system-repot,
  Claude Code 2.1.221) går grön trots att beskrivningarna divergerar kraftigt
  — noll varning. Källkods-strängarna i binären bekräftar att det inte finns
  någon "Entry declares description... but plugin.json says..."-motsvarighet
  någonstans; det finns bara en sådan sträng för `version`.

Divergensen är alltså **osynligare** för description än den var för version
— inte "lika belagd", utan värre: ingen mekanism varnar dig någonsin.

**Marcus observation var korrekt, och konservativ.** Marketplace-entryns
beskrivning saknar inte bara `/research` och `/work-batch` — den saknar hela
styckets om OUTPUT STYLE, de fem HOOKS och det delade skriptet
`stada-worktrees.sh`/`test-stada-worktrees.sh`, samt den fördjupade
lessons-hub-sync- och issue-substrat-detaljen. Två av pluginets 17 skills
(`research`, `work-batch`) nämns inte alls i marketplace-versionen.

## Delfråga 1 — de faktiska filerna och deras description-värden

Läst direkt från disk i `/Users/marcus/Repon/marcus-system` (HEAD
`8683c697664f2c14d7545e654b73396c1778d69f`, gren `main`):

**`plugins/marcus-system/.claude-plugin/plugin.json`** (rad 1–8):

```json
{
  "name": "marcus-system",
  "version": "1.28.2",
  "description": "Operativa disciplin-skills för marcus-systemets sessions-arbetsflöde — sessionsstart, sessionsavslut, session-paus + session-resume (lifecycle-verbens Code-körbarhet per ADR-069: durabel parkering + återupptagning av samma session N), fas-avslut, lessons-hub-sync (bär sedan TASK-104 ADR-081:s fragment-väg: ...
```

— fortsätter i ~5000 tecken, med stycken om `/work-batch`, `/prototype`s
T116/S96-kadens, `/research`, och ett avslutande stycke om OUTPUT STYLE +
fem HOOKS + det delade skriptet `stada-worktrees.sh`.

**`.claude-plugin/marketplace.json`** (hela filen, `plugins[0]`):

```json
{
  "name": "marcus-system",
  "source": "./plugins/marcus-system",
  "description": "Operativa disciplin-skills för marcus-systemets sessions-arbetsflöde — sessionsstart, sessionsavslut, session-paus + session-resume (lifecycle-verbens Code-körbarhet per ADR-069: durabel parkering + återupptagning av samma session N), fas-avslut, lessons-hub-sync, arkitektur-fitness-audit, grillning (grilling med ADR-bar + /grill-me + /grill-with-docs), issue-substrat (/to-prd + /to-issues + /do-work mot Backlog.md), prototyp (/prototype — kastbar kod som besvarar EN nedskriven fråga, LOGIC-/UI-grenarna + throwaway-kontraktet + tvåfas-arbetsformen divergens/konvergens per T66) och felsöknings-loop (diagnosing-bugs — sex-fas-slingan för svåra buggar). Invokerings-mekaniken dokumenterad i pluginets README."
}
```

De två texterna är **ordagrant identiska** för de första ~200 tecknen (fram
till "...samma session N),") och divergerar sedan helt. Marketplace-versionen
stannar vid `felsöknings-loop` och avslutas; plugin.json-versionen fortsätter
med betydligt djupare detalj för samma punkter (lessons-hub-sync,
issue-substrat) och lägger sedan till fyra hela nya avsnitt som saknas helt i
marketplace-entryn:

1. AFK-batch (`/work-batch`)
2. Prototypens iterations-kadens (T116, S96)
3. Research-pass (`/research`)
4. OUTPUT STYLE + fem HOOKS + det delade skriptet

**Viktigt att inte blanda ihop:** marketplace-filens `metadata.version` är
`"1.12.0"` — det är marketplace-**manifestets egen** version (en helt
separat axel), inte kvarlevan av det borttagna `plugins[0].version`-fältet.
Det fältet är bekräftat borttaget: `git show 7d4bf51` visar en ren
enrads-diff som tar bort `"version": "1.12.0",` ur `plugins[0]` och lämnar
`metadata.version` orörd. `plugins[0]` har idag inget `version`-fält alls —
bara `name`, `source`, `description`.

## Delfråga 2 — var visas respektive description i praktiken?

Mätt, inte antaget, mot Claude Code **2.1.221** (`BUILD_TIME
2026-08-03T03:19:26Z`, `GIT_SHA 6efaf12e8b43dc7dbe50e0955c76dc4174a15876`,
läst ur binärens egna inbäddade konstanter):

| Yta | Kommando | Vad som visades | Källa |
|---|---|---|---|
| Installerad-detaljvy | `claude plugin details marcus-system` | **`plugin.json`s fulla ~5000-teckens text, ordagrant** — marketplace-entryns kortare text syns aldrig | Mätt direkt, denna session |
| Installationslista | `claude plugin list` | Ingen description alls — bara namn, version, scope, status | Mätt direkt |
| Marketplace-lista | `claude plugin marketplace list` | Ingen plugin-description alls — bara marketplace-namn och källa | Mätt direkt |
| `/plugin` Discover-fliken (bläddring FÖRE install) | interaktiv TUI | **EJ TESTAD** — kan inte drivas headless från Bash | — |

**Rotorsaken till varför installerad-vyn läser `plugin.json`, inte
entry:** `~/.claude/plugins/installed_plugins.json` (install-recordet) lagrar
**ingen description över huvud taget** — bara `scope`, `installPath`,
`version`, `installedAt`, `lastUpdated`, `gitCommitSha`. Description måste
alltså läsas live vid varje `details`-anrop, och den lästes bevisligen ur den
CACHADE `plugin.json`-filen: `/Users/marcus/.claude/plugins/cache/marcus-hub/
marcus-system/1.28.2/.claude-plugin/plugin.json` innehåller exakt samma text
som `claude plugin details` skrev ut (verifierat byte för byte på de första
raderna). Marketplace-entryns värde används alltså inte ens som fallback i
den här ytan — det ignoreras helt, tyst.

**Discover-flikens beteende förblir okänt** och är den enda luckan i detta
pass. Dokumentationen (`code.claude.com/docs/en/plugin-marketplaces`,
avsnittet "Plugin entries") säger att en entry "can include any field from
the plugin manifest schema, such as `description`, `version`, `author`" —
formuleringen antyder att entry-fälten finns för att låta bläddring visa
information UTAN att först hämta hela plugin-paketet, vilket är relevant för
marketplaces vars entries pekar på externa repon. **Men vårt fall har annan
topologi:** `marcus-system`s `source` är `"./plugins/marcus-system"` — en
relativ sökväg INUTI samma repo som marketplace.json redan bor i
(`high-five-group/marcus-system`, bekräftat av `claude plugin marketplace
list`). Så fort marketplace-repot är klonat/uppdaterat ligger
`plugin.json` redan lokalt på disk utan extra nätverksanrop — kostnads-
argumentet för att duplicera `description` i entryn (undvik en dyr hämtning
före install-beslut) väger därför svagt just för DENNA marketplace, oavsett
vad Discover-fliken faktiskt gör.

## Delfråga 3 — säger validatorn något om description-avvikelse?

**Nej — mätt, inte antaget.**

```console
$ cd /Users/marcus/Repon/marcus-system && claude plugin validate .claude-plugin/marketplace.json --strict
Validating marketplace manifest: /Users/marcus/Repon/marcus-system/.claude-plugin/marketplace.json

✔ Validation passed
```

Detta med `--strict` påslaget ("Treat warnings as errors... unrecognized
fields, missing metadata, and other issues that the runtime tolerates") och
med den nuvarande, kraftiga divergensen på plats. Noll varningar.

Jämfört med `version`, där samma validator (körd i S97 Del 7, samma binär)
fällde exakt: *"the entry version is silently ignored"* + *"Update this
entry to \"X\" to match."* — en NAMNGIVEN cross-check-funktion.

Sökning i den kompilerade binären (`strings` mot
`@anthropic-ai/claude-code@2.1.221`s `bin/claude.exe`) bekräftar strukturellt
varför: cross-check-logiken för version är en egen kodväg med sina egna
strängar —

```text
Could not parse
 for version cross-check:
plugins[
].version
Entry declares version "
" but
 says "
Update this entry to "
" to match.
```

— och det finns **ingen motsvarande sträng** för description någonstans i
binären. De enda description-relaterade valideringsmeddelandena som existerar
är två helt andra kontroller:

1. `"No description provided. Adding a description helps users understand
   what your plugin does"` — varnar om `plugin.json` **saknar** description
   helt (inte om den avviker från något).
2. `"No marketplace description provided. Adding a description helps users
   understand what this marketplace offers"` — varnar om marketplace-filens
   **egen toppnivå-`metadata.description`** saknas (marknadsplatsens egen
   beskrivning, inte per-plugin-entryns).

Ingendera rör `plugins[].description` mot `plugin.json`s `description`.

Dokumentationen bekräftar samma asymmetri på prosanivå.
`plugin-marketplaces`-sidan har ett helt namngivet avsnitt, **"Version
resolution and release channels"**, med en explicit 3-stegs
prioritetsordning och en `<Warning>`-ruta: *"Avoid setting version in both
`plugin.json` and the marketplace entry. Claude Code always uses the
`plugin.json` value without warning, so a stale manifest version can mask a
version you set in `marketplace.json`."* `plugins-reference`-sidan upprepar
samma sak under `plugin.json`s `version`-fält: *"If also set in the
marketplace entry, `plugin.json` wins."*

**Description har ingen sådan sektion.** Fältet listas i tabellform på båda
ställena ("Brief plugin description" / "Brief marketplace description")
utan ett enda ord om vad som händer när båda är satta. Det enda fält som
DOKUMENTERAT beskrivs som "shown in ... UI surfaces" är `displayName`
("Human-readable name shown in the `/plugin` picker and other UI surfaces.
Falls back to `name` when omitted.") — `description` nämns aldrig i den
rollen i dokumentationen. Att `claude plugin details` ändå visar den (mätt
ovan) är alltså ett beteende vi har fastställt empiriskt, inte ett vi kunnat
belägga i prosan.

## Dom

`plugin.json`s `description` vinner i den enda ytan som gick att mäta
headless (`claude plugin details`), på exakt samma sätt som för `version`.
Men **description är strukturellt sämre bevakad än version var**:

- `version` hade en dedikerad cross-check-funktion i validatorn (som ändå
  inte förhindrade femton versioners drift innan någon körde den — S97 Del
  7). `description` har ingen cross-check alls, i någon form.
- `version` har ett eget dokumenterat resolution-kapitel med en uttrycklig
  varningsruta. `description` har inget motsvarande kapitel.
- `version` ändras en gång per release. `description` i det här pluginet
  ändras i praktiken vid nästan VARJE feature-commit (git-loggen visar
  manifest-beskrivningen växa löpande, `sessions-parallellitet-...`,
  `T116/S96`-tillägget, hooks-stycket — allt bakat in som prosa i samma
  fält över tid). Det gör description till ett SNABBARE-drivande fält än
  version, med SÄMRE bevakning.

Slutsatsen "silently ignored på samma sätt som version" är därför **delvis
sann och delvis för snäll mot description**: samma vinnare, ja — men
description saknar den enda mekanism (valideringsvarningen) som gjorde att
version-driften överhuvudtaget upptäcktes och kunde åtgärdas i S97 Del 7.
Utan detta pass hade description-driften kunnat fortsätta obemärkt
på obestämd tid.

## Vad jag inte kunde belägga

- **`/plugin`-menyns Discover-flik** (bläddring i marcus-hubs katalog INNAN
  ett plugin är installerat) är en interaktiv TUI som inte går att driva
  headless från Bash i den här sessionen. Jag kunde alltså inte mäta om den
  läser `plugins[].description` direkt ur marketplace.json (utan att någonsin
  konsultera `plugin.json`), eller om den — likt `details`-kommandot — på
  något sätt hämtar/cachar plugin.json även för denna vy. Detta är den enda
  ytan där en borttagning av fältet skulle kunna få ett SYNLIGT negativt
  utfall (en tom eller kort description i Discover-listan för ett plugin som
  inte redan är installerat).
- Jag har inte hittat och kunde därför inte läsa den faktiska
  Zod/valideringsschema-källkoden (bara minifierade strängar ur binären) —
  slutsatsen "ingen cross-check-funktion finns för description" vilar på
  frånvaro av matchande strängar i en fullständig `strings`-dump av binären,
  inte på att ha läst schemat rad för rad. Frånvaro av bevis i en
  strängtabell är starkt men inte absolut bevis för frånvaro av logik (t.ex.
  om kontrollen vore villkorad bakom en flagga som aldrig når produktion,
  eller om felmeddelandet konstrueras dynamiskt utan en unik literal-sträng
  — osannolikt givet hur `version`-kontrollen är byggd, men inte uteslutet).
- Huruvida Claude Desktop-appens plugin-bläddrare (skild kodbas från CLI:t,
  nämnd i dokumentationen som `/docs/en/desktop#install-plugins`) har samma
  eller annat beteende är helt otestat och låg utanför detta pass scope.

## Rekommendation

Det som följer är en rekommendation, inte ett beslut — Marcus/orkestreraren
avgör.

**Rekommenderar (b): ta bort `plugins[0].description` ur
marketplace-entryn**, med samma motivering som bar `7d4bf51` för `version`,
förstärkt av att description-fallet är svagare på precis den punkt som talar
FÖR att behålla en synkad kopia:

- **(a) Synka** — kopiera plugin.json:s fulla text in i marketplace-entryn.
  Avvisas. Det är exakt den "symptomfix" som `7d4bf51`s commit-meddelande
  redan avvisade för version ("tystar varningen men återskapar driften vid
  nästa bump") — och för description är återfallet SNABBARE: fältet ändras i
  praktiken vid varje ny skill/mekanism, så en synkad kopia skulle vara
  utdaterad igen inom en commit eller två. Den enda uppmätta konsumenten av
  värdet (`claude plugin details`) läser ändå aldrig marketplace-kopian —
  synkning köper alltså noll observerad nytta i den enda ytan vi kunnat mäta.
- **(b) Ta bort fältet.** Motivering: (i) plugin.json vinner empiriskt i den
  enda mätbara ytan — precis som för version; (ii) till skillnad från version
  finns här ingen validator-varning att förlora genom borttagning (version
  hade åtminstone en varning som körningen kunde fånga; description har
  aldrig haft någon — att ta bort fältet ändrar alltså validator-utfallet
  från "tyst grönt trots fel" till "tyst grönt utan fel att dölja", en ren
  förbättring); (iii) käll-topologin gör kostnadsargumentet för att behålla
  entryns kopia (undvik dyr hämtning i Discover-fliken) svagt just här,
  eftersom `source` är en relativ sökväg i SAMMA redan klonade repo som
  marketplace.json. Risken är den ena luckan ovan (Discover-flikens
  otestade beteende) — men konsekvensen om den slår fel är begränsad till en
  saknad/kort beskrivningsrad i en bläddringsvy för en hub som redan är
  personlig/team-intern, inte en publikt marknadsförd marketplace där
  förstaintrycket avgör installationsbeslut i stor skala.
- **(c) Låt stå.** Avvisas. Garanterar fortsatt, växande drift (fältet är
  redan konkret fel — saknar 2 av 17 skills och ett helt fjärde stycke) utan
  någon uppmätt motprestation. En stale beskrivning i en bläddringsvy är
  om något VÄRRE än ingen alls: den kan aktivt leda någon att avstå
  installation på felaktiga grunder (t.ex. tror att `/research` eller
  `/work-batch` saknas).

**Skillnaden mot version-fallet, uttryckligen:** version-borttagningen var
"beteendemässigt neutral" (S97 Del 7:s egen formulering) eftersom fältet
redan var ignorerat och ingen ny risk tillkom. Description-borttagningen är
**inte lika garanterat neutral** — den bär den otestade Discover-flik-luckan
ovan. Om Marcus vill stänga den luckan innan borttagning: det billigaste
beviset vore att köra `/plugin` interaktivt, gå till Discover-fliken, hitta
`marcus-system`-entryn och notera vilken text som visas där, före och efter
en testborttagning på en skräputmatad gren — ett experiment den här
sessionen inte kunde utföra (ingen interaktiv TUI-åtkomst), men som är
billigt för en människa vid tangentbordet.

## Källförteckning

- `code.claude.com/docs/en/plugin-marketplaces` — avsnitten "Marketplace
  schema" / "Plugin entries" (fälttabeller för `description`/`version` på
  båda nivåer) och "Version resolution and release channels" (3-stegs
  precedens + varningsruta, citerad ovan verbatim).
- `code.claude.com/docs/en/plugins-reference` — `plugin.json`-manifestets
  fälttabell, `version`-radens *"If also set in the marketplace entry,
  `plugin.json` wins."* och `displayName`-radens *"shown in the `/plugin`
  picker and other UI surfaces"*.
- `code.claude.com/docs/en/discover-plugins` — Discover/Installed-flikarnas
  beskrivning (ingen precisering av description-källa vid divergens).
- Claude Code CLI, lokalt installerad binär `@anthropic-ai/claude-code
  @2.1.221` (`BUILD_TIME 2026-08-03T03:19:26Z`, `GIT_SHA
  6efaf12e8b43dc7dbe50e0955c76dc4174a15876`) — körda kommandon:
  `claude plugin validate .claude-plugin/marketplace.json --strict`,
  `claude plugin details marcus-system`, `claude plugin list`,
  `claude plugin marketplace list`, samt `strings` mot
  `bin/claude.exe` för validator-meddelande-strängarna.
- `/Users/marcus/Repon/marcus-system/.claude-plugin/marketplace.json` och
  `/Users/marcus/Repon/marcus-system/plugins/marcus-system/.claude-plugin/
  plugin.json`, lästa direkt på disk, HEAD
  `8683c697664f2c14d7545e654b73396c1778d69f`.
- `git show 7d4bf51` i `marcus-system`-repot — commit-meddelandet och
  enrads-diffen som tog bort `plugins[0].version` (S97 Del 7-åtgärden denna
  utredning jämför sig mot).
- `~/.claude/plugins/installed_plugins.json` och den cachade
  `~/.claude/plugins/cache/marcus-hub/marcus-system/1.28.2/.claude-plugin/
  plugin.json` — verifierar att install-recordet inte lagrar description
  och att den cachade plugin.json-filen är källan `details`-kommandot läser.
