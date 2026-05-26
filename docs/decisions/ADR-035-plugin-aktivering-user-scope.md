# ADR-035: marcus-system-pluginet aktiveras via user-scope install-record

- Status: Accepted (Session 7 K0.0 2026-05-26)
- Datum: 2026-05-26
- Fas: Meta (Session 7 K0.0 — plugin-scope-stängning)

## Kontext

Session 7 K0.0 syftade till att städa bort en redundant plugin-registrering. Efter en re-sync i föregående steg (hub-version-bump `1.0.0` → `1.1.0`, hub-commit `e8aadf0`, som rensade en STOPPA där lokal cache exponerade 6 skills mot hubbens 4) deklarerade **två** scope samma marketplace `marcus-hub` + plugin `marcus-system@marcus-hub`: user-scope (`~/.claude/settings.json`) och project-scope (spoke `.claude/settings.json`). Arbetshypotesen var att project-scope är kanoniskt (spoke-CLAUDE.md mandaterade det) och att user-scope-posten var en artefakt som skulle bort, varefter project-scope skulle ta över.

Två fynd under K0.0 falsifierade den hypotesen och dess underliggande modell.

**Plugin-CLI:t kan inte tillförlitligt migrera plugin-scope.** `claude plugin`-kommandon skriver oavsiktligt om project `.claude/settings.json` — vid ett tidigare K0.0-steg tömdes spoke-filens plugin-config **och** den orelaterade pre-commit-hooken (`anthropics/claude-code` #38271; empiriskt bekräftat Session 7 K0.0, återställt via `git checkout`). CLI:t lämnar dessutom stale cache i flera rapporterade fall (#14061, #46081, #29074). Att köra CLI:t igen för att avregistrera user-scope skulle alltså återinföra en känd klobber-risk mot en committad, governing fil.

**Plugin-state är spritt över flera filer — `settings.json` är inte registret.** Den auktoritativa install-posten bor i `~/.claude/plugins/installed_plugins.json`, som `claude plugin list` härleder scope ur. När user-scope-enable-deklarationen kirurgiskt togs bort ur `~/.claude/settings.json` (Edit, ingen CLI — spoke-filen aldrig öppnad, förblev byte-identisk med HEAD) fortsatte CLI:t att rapportera pluginet som `Scope: user, enabled` — eftersom install-posten i `installed_plugins.json` var orörd. Modellen "`settings.json` är registret" var ofullständig.

Faktisk plugin-state-topologi (verifierad mot disk, Session 7 K0.0):

| Fil | Roll |
|---|---|
| `~/.claude/plugins/installed_plugins.json` | **Auktoritativt install-register** — `claude plugin list` läser scope härifrån (marcus-system: `scope: user`). |
| `~/.claude/plugins/known_marketplaces.json` | Marketplace-register (marcus-hub, user-nivå; delas med project-scope). |
| `~/.claude/settings.json` | User-scope **enable-deklaration** (`enabledPlugins` + `extraKnownMarketplaces`). |
| spoke `.claude/settings.json` | Project-scope enable-deklaration (sekundär/portabilitets-deklaration). |

Att tvinga fram project-scope skulle kräva antingen en oprövad Edit av `installed_plugins.json` (om project-scope inte auto-skapar en egen install-post kan pluginet försvinna) eller den buggiga CLI:n (#38271). Bägge avvisades. User-scope-posten är samtidigt fullt funktionell: pluginet laddas i **varje** Code-session oavsett repo, vilket gör sömlös plugin-tillgång redan uppfylld.

## Beslut

`marcus-system`-pluginet aktiveras via **user-scope install-record** (`~/.claude/plugins/installed_plugins.json`) som kanonisk mekanism. Den kvarvarande frågan — scope-placering — är kosmetisk och löses dokumentärt (denna ADR), inte med fler registry-ingrepp.

Spoke `.claude/settings.json` behåller sin `extraKnownMarketplaces.marcus-hub` + `enabledPlugins`-deklaration som **giltig sekundär portabilitets-deklaration**: den skadar inget, och den dokumenterar avsikten för den som klonar repot på en maskin utan user-scope-installation.

## Alternativ som övervägdes

**Edit av `installed_plugins.json`** — ta bort user-scope-posten manuellt för att tvinga project-scope. Förkastat: oprövat om project-scope auto-aktiverar utan ett eget install-record; pluginet kan försvinna helt. Registry-mutation utan reproducerbar garanti.

**Plugin-CLI-avregistrering** (`claude plugin uninstall -s user`) — låta CLI:t städa install-registret. Förkastat: återinför #38271-klobber-risken mot spoke `.claude/settings.json` (governing, committad fil) samt stale-cache-risk.

**Status quo utan ADR** — lämna bägge scope odokumenterade. Förkastat: lämnar en falsk "settings.json är registret"-modell i CLAUDE.md och ingen kvittens för varför scope-migrering övergavs.

## Konsekvenser

User-scope ger plugin-tillgång i varje Code-session oavsett repo (sömlöst) — kärnegenskapen är uppfylld utan vidare ingrepp. Project-scope-deklarationen i spoke-filen kvarstår som portabilitets-signal, inte primär källa. CLAUDE.md `## Operativ procedur` uppdateras: den tidigare texten mandaterade project-scope-config — den ändras till att user-scope install-record är kanoniskt, med pekare till denna ADR, och spoke-deklarationen beskrivs som portabilitets-deklaration.

Kostnaden: scope-placeringen (`installed_plugins.json` = user) är inte i ett committat repo — den bor i `~/.claude/` och måste återskapas per maskin (engångs plugin-install). Spoke-deklarationen mildrar detta för den som klonar. Plugin-CLI:t förblir otillförlitligt för scope-migrering tills #38271 är åtgärdad upstream; framtida scope-ändringar görs inte via CLI:t medan buggen är öppen.
