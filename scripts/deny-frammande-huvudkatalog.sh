#!/usr/bin/env bash
# scripts/deny-frammande-huvudkatalog.sh — ADR-090 beslut 2 som mekanism.
#
# VARFÖR SKRIPTET FINNS: ADR-090 beslut 2 säger "Den senare startande
#   sessionen tar worktreen; den först startade behåller sin plats i
#   huvudträdet." Regeln fanns bara i prosa. Den bröts tre gånger i ETT pass
#   (S96 Del 8, 2026-08-03): två `git merge --ff-only` och en gren skapad i
#   huvudkatalogen medan S93 ägde den. Ingen skada den gången — rena träd,
#   rena fast-forwards — men fel form, och `check-lifecycle.sh` var grön hela
#   tiden eftersom den prövar KONSISTENS, inte SANNING. Samma klass som T116:
#   en grind som prövar formen, inte verkligheten.
#
# VAD DEN PRÖVAR OCH GÖR: "får DENNA session göra en git-skrivning i
#   huvudkatalogen just nu?" — FYRA delfrågor, i denna ordning (billigast
#   först) — PLUS en sidoeffekt: sessionen som klarar prövningen blir också
#   den REGISTRERADE ägaren om ingen redan är det (§ ÄGARSKAP-TAGANDE nedan).
#     1. Är kommandot en git-skrivning?      (mot policyfilens listor)
#     2. Riktas det mot huvudkatalogen?      (cwd-jämförelse ELLER textmönster)
#     3. Äger denna session huvudkatalogen?  (ägarlappen i --git-common-dir)
#     4. Lever den ägande processen fortfarande? (§ LIVENESS-PRÖVNING nedan)
#
# ═══ TVÅ SAKER SOM LÅTER LIKA MEN INTE HAR MED VARANDRA ATT GÖRA ═══
#
#   `session-end` (pluginets disciplin-skill, skriver `lifecycle: closed` i
#   ett sessionsdok) och `SessionEnd` (harnessets hook-event, fyrar när
#   PROCESSEN avslutas) är INTE samma sak — full förklaring i
#   scripts/katalogagarskap-markor.sh § TVÅ SAKER SOM LÅTER LIKA. Kort: denna
#   lapp är knuten till PROCESSEN (det öppna terminalfönstret), inte till
#   `lifecycle`-fältet. En pausad session vars fönster fortfarande är öppet
#   äger fortsatt huvudkatalogen och nekas nedan korrekt; en session vars
#   fönster är stängt äger ingenting och släpps tyst igenom via § LIVENESS-
#   PRÖVNING, oavsett vad dess sessionsdok råkar säga.
#
# ═══ LIVENESS-PRÖVNING (T120-rotorsaken) ═══
#
#   Lappen bar tidigare bara IDENTITET, aldrig LIVSTID, och ingen kodväg tog
#   någonsin bort den — en död sessions lapp blockerade nästa session
#   permanent (skarpt fall 2026-08-04, tre minuter efter att lappen skrevs).
#   Sedan T120 bär lappen (katalogagarskap-markor.sh § PID-LIVENESS)
#   `agare_pid` + `agare_pid_starttid`. Delfråga 4 prövar:
#
#     a) `kill -0 <agare_pid>` — lever processen fortfarande LOKALT?
#     b) `ps -o lstart=` för samma PID === den inspelade starttiden?
#        (PID-ÅTERANVÄNDNINGSGARD — samma teknik som systemd:s `PIDFile` och
#        klassiska /var/run-pidfiler: en död process PID kan hinna återges
#        till en helt annan process innan lappen prövas nästa gång, och utan
#        starttids-jämförelsen skulle den nya processen felaktigt läsas som
#        "samma ägare, fortfarande levande".)
#
#   BEVISLIGEN ÖVERGIVEN (a misslyckas, ELLER b missmatchar) ⇒ SLÄPP TYST.
#   En session som kör I huvudkatalogen TAR ÖVER lappen (skriver sin egen
#   identitet + pid); en worktree-session som bara pekar dit river den
#   övergivna lappen utan att göra anspråk på den. Se § ÄGARSKAP-TAGANDE
#   nedan. Exakt Vims precedent (vimhelp.org/usr_11.txt.html §11.3, redan
#   ADR-090-sanktionerad).
#
#   OSÄKER (lappen saknar `agare_pid` — äldre form — ELLER `ps`/`kill` går
#   inte att köra) ⇒ faller tillbaka på det TIDSBASERADE skälet som gällde
#   FÖRE T120 (KATALOG_STALE_TIMMAR, nu nedskalad till sista-utväg-roll, se
#   .katalogagarskap-policy.conf). Detta är ETT KÄNT, ACCEPTERAT GAP: en lapp
#   satt av en session på en ANNAN maskin (om .git någonsin delas över nät)
#   skulle med hög sannolikhet läsas som "PID finns inte lokalt" och alltså
#   tolkas som (a)-fallet, inte som denna reservväg — det finns inget
#   maskin-identitets-fält i lappen som kan skilja dem åt. Repots faktiska
#   användning (en ensam utvecklare, flera worktrees på SAMMA maskin) gör
#   gapet teoretiskt snarare än en verklig driftrisk, och det löses inte här.
#
# ═══ ÄGARSKAP-TAGANDE: VID SKRIVNING, INTE VID ANKOMST (T120, Marcus-GO) ═══
#
#   Skriptet tog tidigare INGEN lapp alls — den sattes av
#   katalogagarskap-markor.sh vid SessionStart. Den formen reviderades SAMMA
#   DAG, innan den nådde skarp drift: Marcus håller medvetet gamla
#   sessionsfönster öppna som REFERENS (för att kunna läsa chatten om en
#   paus-dokumentation visar sig sakna något) — mätt exempel 2026-08-04, PID
#   56246, öppet sedan 2026-08-02. Ett sådant fönster LÄSER men ARBETAR inte.
#   Med lappen satt vid ankomst (SessionStart) hade VARJE sparat
#   referensfönster ockuperat huvudkatalogen PERMANENT. Se
#   scripts/katalogagarskap-markor.sh § ÄGARSKAP TAS VID SKRIVNING för hela
#   resonemanget — den bär nu bara den kvarvarande RAPPORTERINGEN.
#
#   Beslutstabellen, prövad i denna ordning när kommandot är en git-skrivning
#   mot huvudkatalogen (delfråga 1+2 redan sanna):
#
#     | Läge                                        | Handling                          |
#     |----------------------------------------------|------------------------------------|
#     | Ingen lapp, DENNA session kör i huvudkat.     | TA lappen (egen pid), släpp        |
#     | Ingen lapp, kommandot bara PEKAR dit          | inget att skydda mot, släpp        |
#     | Lappen är min                                 | släpp, orörd                      |
#     | Främmande, ägaren BEVISLIGEN död/återanvänd   | huvudkat.-session: TA ÖVER, släpp  |
#     |                                                | pekande worktree-session: riv, släpp |
#     |                                                | (§ VARNING VID SMUTSIGT ARBETSTRÄD nedan) |
#     | Främmande, ägaren BEVISLIGEN levande          | NEKA — OAVSETT hur länge tyst      |
#     | Främmande, liveness OKÄND                     | NEKA (tidsbaserat, sista utväg)    |
#
#   FÖRKASTAT, ÖPPET BOKFÖRT: ett tidsbaserat ÖVERTAGANDE av en levande men
#   TYST ägare (`senast_skrev` äldre än en tröskel) övervägdes och byggdes
#   som ett tredje designtillägg samma dag — Marcus FÄLLDE det innan det
#   landade, med ett konkret scenario (verbatim): "det kan ju bara vara så
#   att jag behöver gå och bajsa, och när jag kommer tillbaka så har vi
#   ingen katalog att stå på då?" Rotorsaken i det förkastade tänkandet: TID
#   användes som proxy för "ingen arbetar här", men ett arbetsträd med
#   OCOMMITTADE ändringar är upptaget oavsett ägarens tystnad — en session B
#   som "tog över" en tyst-men-levande ägare A hade kunnat skriva
#   (checkout/commit/merge) rätt ovanpå A:s ocommittade arbete medan A bara
#   var borta från tangentbordet. En levande ägare är ALLTID en levande
#   ägare — det enda giltiga övertagande-villkoret är BEVISAD DÖD process
#   (§ LIVENESS-PRÖVNING). Se ADR-090 § Update för hela resonemanget bokfört.
#   Dubbelriktad över-engineering-vakt: ingen spekulativ mekanism utan en
#   faktisk, mätt nuvarande användare — behövs ett övertagande-vid-tystnad
#   någon gång byggs det DÅ, med fällnings-loggens data bakom sig.
#
#   EXPLICIT SLÄPP, ETT SNABBARE LAGER OVANPÅ DÖD-PROCESS-ÖVERTAGANDET:
#   `session-paus` och `session-end` (pluginets disciplin-skills) SKA anropa
#   `katalogagarskap-markor.sh --slapp` som ETT EGET STEG när de stänger en
#   session — snabbare och tydligare än att vänta på att processen faktiskt
#   dör. DET ÄR INTE ENDA VÄGEN: ett skill-steg är prosa, och T119:s hela
#   tes är att prosa bryts. Två lager, bara det UNDERSTA måste vara
#   pålitligt:
#     1. Explicit `--slapp` (skill-steg, prosa — kan glömmas)
#     2. Död-process-övertagande (mekaniskt, kräver bara att processen dött)
#   Se scripts/katalogagarskap-markor.sh § --SLAPP-LÄGE för CLI-kontraktet.
#   Skill-sidans anrop (hub-repot marcus-system) är UTANFÖR denna landning —
#   öppen följdpunkt, se slutrapporten.
#
#   VARFÖR "TA" BARA GÄLLER SESSIONER SOM KÖR I HUVUDKATALOGEN: en
#   worktree-session som råkar peka på huvudkatalogen via `git -C` gör inget
#   anspråk på att BO där — att låta den ta lappen hade gjort en enstaka
#   -C-flagga till en permanent hemvist-registrering. Samma princip som
#   gällde när markor.sh ensamt satte lappen (worktree-sessioner satte aldrig
#   en lapp där heller).
#
#   ATOMÄRITET, MEDVETET VALD FORM (två sessioner kan i teorin nå denna kod
#   inom samma millisekund):
#
#     - "TA" (ingen lapp finns) använder `set -C` (noclobber): `>` FAILAR om
#       filen redan hunnit skapas av en annan session, i stället för att
#       skriva över den — O_EXCL-liknande atomicitet på POSIX. Det är den ENDA
#       av de två skrivvägarna där "finns inte" går att pröva OCH skriva i
#       SAMMA operation, och just DÄRFÖR är den valda formen här: en
#       misslyckad exklusiv skapelse betyder obestridligt att någon annan
#       vann racet, och koden faller då igenom och läser DEN lappen i stället
#       för att anta något.
#     - "TA ÖVER" (en bevisat övergiven lapp ersätts) kan INTE använda
#       noclobber — destinationen finns redan. Formen är temp-fil + `mv`
#       (atomär rename() på samma filsystem, samma idiom som
#       katalogagarskap-markor.sh tidigare använde för sin nu rivna
#       skriv-väg). KVARVARANDE GAP, öppet skrivet, INTE noll: hinner två
#       sessioner BÅDA bevisa samma lapp övergiven och båda skriva sin
#       temp-fil nära nog i tid, vinner den som `mv`:ar sist — förloraren
#       fortsätter tro att den äger trädet fast den inte gör det. Detta
#       byggs INTE bort här: racet kräver att TVÅ sessioner samtidigt hittar
#       en DÖD tredje session ATT ta över, i ett solo-utvecklarflöde med
#       sällsynta krascher — ett teoretiskt fönster, inte en mätt risk. En
#       fullständig låsning (`flock` eller motsvarande) är mer maskineri än
#       det motiverar just nu; ADR-090 beslut 5 sanktionerar samma hållning
#       ("detektionen behöver INTE vara perfekt").
#
# ═══ VARNING VID SMUTSIGT ARBETSTRÄD (Marcus-fångst, sista tillägget) ═══
#
#   Ett dödförklarat ägarskap är INTE detsamma som ett tomt arbetsträd.
#   Processen är borta; ARBETET på disk är det INTE. Marcus fångade detta som
#   ett hål i det redan reviderade förslaget ("en död process kan inte ha
#   ocommittat arbete som går förlorat" var fel — processen är borta,
#   ändringarna ligger kvar). Alternativet — släpp ALDRIG en död lapp — vore
#   permanent låsning vid en enda felkryssning (exakt spöklapp-incidenten
#   2026-08-04, fast som en hård vägg i stället för en klickbar prompt).
#   Rätt form: TA ÖVER som planerat, men VARNA sessionen som tar över om
#   arbetsträdet bär spår av den döda sessionens ofärdiga arbete.
#
#   PRÖVAS (funktionen `arbetstrad_har_ocommittat_arbete` nedan), i
#   huvudkatalogen specifikt (COMMON_DIR är där för huvudträdet):
#     - `git status --porcelain --untracked-files=no` icke-tom → spårade
#       filer är modifierade och/eller staged. OTRACKADE FILER RÄKNAS
#       MEDVETET INTE: `checkout`/`reset`/`stash`/`merge` rör dem inte, och
#       repot bär en långlivad otrackad fil (`package-lock.json.pre-t118`)
#       som annars permanent hade flaggat trädet "smutsigt" — en konstant
#       falsk positiv värre än ingen varning alls.
#     - `.git/MERGE_HEAD`, `.git/CHERRY_PICK_HEAD` finns, eller
#       `.git/rebase-merge`/`.git/rebase-apply` finns → en git-operation
#       (merge/cherry-pick/rebase) står påbörjad men oavslutad.
#
#   LEVERANS TILL AGENTEN, ALDRIG EN PROMPT TILL MARCUS: samma princip som
#   `deny`-skälen — se § DENY, INTE ASK. Mekanismen är
#   `hookSpecificOutput.additionalContext` på ett `permissionDecision: "allow"`-
#   svar. VERIFIERAT mot code.claude.com/docs/en/hooks 2026-08-04 (inte
#   gissat): dokumentationens fälttabell säger att `additionalContext` "is
#   passed into Claude's context window via system reminder" och att detta
#   gäller specifikt när hooken ANDÅ tillåter anropet — `permissionDecisionReason`
#   och `systemMessage` är UTESLUTNA för detta syfte (`permissionDecisionReason`
#   är dokumenterat "shown to Claude when denying, or to the user when
#   asking" — ingetdera gäller `allow`; `systemMessage` är uttryckligen
#   "shown to the user", alltså Marcus, exakt vad som ska undvikas).
#   `additionalContext` är dessutom SAMMA fält katalogagarskap-markor.sh
#   redan använder för sin SessionStart-rapportering — samma mönster,
#   återanvänt på PreToolUse.
#
#   Rent träd, ingen pågående operation ⇒ INGEN varning, tyst övertagande
#   (oförändrat från grundformen).
#
# ═══ FAIL-OPEN-VALET — läs innan du ändrar något här ═══
#
#   Detta skript failar ÖPPET: varje internt fel (jq saknas, tom stdin, ingen
#   policyfil, inte ett git-repo, oläsbar ägarlapp) slutar i `exit 0` =
#   verktygsanropet fortsätter.
#
#   Det AVVIKER medvetet från scripts/deny-resend-send.sh, som nekar vid varje
#   internt fel. Skillnaden är skadans natur, inte slarv:
#     - Mail-låset: skadan är ett SKICKAT MAIL. Irreversibelt. Rogers krav är
#       noll-tolerans, alltså måste "vet inte" neka.
#     - Detta lås: skadan är fel FORM på en git-operation. S96:s tre faktiska
#       överträdelser gav rena träd och rena fast-forwards — noll dataförlust.
#       En trasig hook som nekar allt skulle däremot låsa hela arbetet i alla
#       worktrees samtidigt, vilket är en värre skada än den den skyddar mot.
#   Marcus-kvitterat 2026-08-04. Formen följer scripts/deny-sweeping-git-add.sh
#   i pluginet (`command -v jq >/dev/null 2>&1 || exit 0`).
#
# ═══ DENY, INTE ASK — RIVET 2026-08-04 (S97, T120), MARCUS-GO ═══
#
#   Skriptet returnerade tidigare `permissionDecision: "ask"`. ADR-090
#   beslut 3 valde den formen medvetet: legitima undantag finns (S97 kör
#   själv i huvudkatalogen med kvittens), och en hård spärr utan
#   liveness-vetskap hade kunnat blockera en äkta pågående session lika lätt
#   som en död.
#
#   DET ÄR EXAKT DEN INVÄNDNINGEN T120 TAR BORT. `ask` fanns för att skriptet
#   INTE KUNDE SKILJA en äkta konflikt från en falsk — nu kan det, via
#   § LIVENESS-PRÖVNING ovan. En bevisligen övergiven lapp släpps tyst utan
#   att någon tillfrågas; en bevisligen levande ägare nekar hårt utan att
#   fråga. Samma kriterium som deny-grind-genom-pipe.sh redan formulerade för
#   hela hook-ytan: `ask` bara när Marcus är RÄTT beslutsfattare (irreversibelt,
#   kräver hans mandat) — kan maskinen avgöra saken själv, `deny`.
#
#   ÖPPET BOKFÖRD AVVIKELSE FRÅN EN TIDIGARE REKOMMENDATION: forskningspasset
#   docs/research/hook-beslut-ask-vs-deny-och-begriplighet-2026-08-04.md
#   (skrivet SAMMA DAG, före T120) landade explicit på "Behåll `ask`" för
#   just detta skript, med motiveringen att ADR-090 § Beslut 2 "nämner
#   uttryckligen legitima undantag". Den slutsatsen var rätt GIVET
#   förutsättningarna DÅ (ingen liveness-signal fanns än) — T120 ändrar
#   förutsättningen, inte omdömet. KVARSTÅENDE KOSTNAD, öppet noterad: det
#   legitima undantaget (Marcus MEDVETET låter en session arbeta i
#   huvudkatalogen trots att ägarlappen pekar på en ANNAN, fortfarande
#   levande session) har INGEN in-hook-PROMPT längre — `ask` var den vägen.
#   Kvarvarande väg, ingen fråga i stunden: `rm <lappen>` manuellt, skrivs ut
#   i nekande-meddelandet. Ett tidsbaserat automatiskt övertagande (en
#   levande men TYST ägare ger vika efter en tröskel) övervägdes som ETT
#   TREDJE alternativ och FÖRKASTADES av Marcus — se § ÄGARSKAP-TAGANDE ovan
#   för hela resonemanget. En levande ägare är alltid en levande ägare.
#
#   KÄND RISK, öppet skriven — och SEDAN RÄTTAD: skripthuvudet nämnde tidigare
#   en "opålitlighets-instans" (github.com/anthropics/claude-code/issues/37210)
#   som skäl att hålla kvar `ask`. Ovanstående forskningspass läste ärendet i
#   sin helhet: det var rapportörens egen bugg (blandade `exit 2` med
#   JSON-utdata), stängt som löst på deras sida, INTE en plattformsbugg — och
#   detta skripts mönster (`jq -nc {...}; exit 0`, aldrig `exit 2` blandat med
#   JSON) undvek den redan strukturellt. Ingen risk att bära vidare.
#
#   `deny` hänger INTE i en AFK-batch där ingen svarar — det är hela poängen:
#   en AFK-batch som träffar en bevisligen levande ägare stannar ändå (nekas
#   hårt), men en batch som träffar en DÖD lappen fortsätter utan att någon
#   behöver vakna för att svara på den.
#
# ═══ SCOPE-GRÄNSER, öppet skrivna ═══
#
#   1. ENDAST Bash-verktyget. En session i en worktree kan redigera en fil i
#      huvudkatalogen via Edit/Write med absolut sökväg — samma klass av fel,
#      annan väg in. Det ligger UTANFÖR T119 arbetslista (a), som säger
#      "git-skriv". Noterat som kandidat till egen punkt, inte inbakat här.
#   2. Textmönstren för `git -C <path>` och `cd <path> && git` är
#      APPROXIMATIVA. En shell-sträng går inte att tolka exakt utan att
#      implementera en shell-parser. Väg 1 (cwd-jämförelsen) är exakt; väg 2
#      och 3 är bäst-ansträngning. Samma medvetna grovhet som mail-låsets
#      endpoint-mönster, och av samma skäl.
#   3. Relativa sökvägar mot huvudkatalogen (t.ex. `git -C ../..`) fångas
#      inte. De skulle kräva path-normalisering mot en cwd som kan ha ändrats
#      tidigare i samma kommandokedja.
#
# INPUT: PreToolUse hook-JSON på stdin (`tool_name`, `tool_input.command`,
#   `cwd`, `session_id`) — bekräftat mot code.claude.com/docs/en/hooks.md
#   2026-08-04 och mot att scripts/agent-spawn-log.sh:157-162 redan läser
#   `cwd` och `session_id` i drift.
#
# Fällnings-logg: varje NEKANDE (aldrig ett tyst släpp) appenderar en rad till
#   .claude/hook-fallningar.jsonl — delad med deny-grind-genom-pipe.sh, skild
#   på fältet `hook`. Se § FÄLLNINGS-LOGG nedan.
#
# Testsvit: scripts/test-deny-frammande-huvudkatalog.sh (tvåsidigt bevis).
#
# Källa: T119 arbetslista (a) · T120-rotorsaken · ADR-090 beslut 2/3/5 ·
#        S96 Del 8 · .katalogagarskap-policy.conf ·
#        scripts/katalogagarskap-markor.sh · scripts/katalogagarskap-slapp.sh ·
#        docs/research/hook-beslut-ask-vs-deny-och-begriplighet-2026-08-04.md ·
#        code.claude.com/docs/en/hooks.md
# Etablerad: S97, 2026-08-04. Deny + PID-liveness: S97 (T120).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
KATALOG_POLICY="${KATALOG_POLICY:-${SCRIPT_DIR}/../.katalogagarskap-policy.conf}"
HOOK_LOGG="${HOOK_LOGG:-${SCRIPT_DIR}/../.claude/hook-fallningar.jsonl}"
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/jq-guard.sh"

# neka <skäl> — T120-formen. Se § DENY, INTE ASK ovan.
neka() {
    jq -nc --arg skal "$1" '{
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: $skal
        }
    }' 2>/dev/null || exit 0
    exit 0
}

# ═══ FÄLLNINGS-LOGG (T120, observerbarhet) ═══
#
# En rad JSONL per NEKANDE — aldrig per tyst släpp — till en delad,
# .gitignore:ad logg (samma fil som deny-grind-genom-pipe.sh skriver till,
# åtskild på fältet `hook`). Skälet: vi vet i dag inte hur ofta spärrarna
# fyrar, och det talet avgör om de sinkar arbetet mer än de skyddar mot fel.
# Kontraktet lånas av scripts/agent-spawn-log.sh: får ALDRIG påverka hookens
# exit eller stdout — varje steg failar tyst mot `|| true`.
logga_fallning() {
    local skalnyckel="$1" kommando_kort
    # Bar presence-check, MEDVETET INTE jq_version_ok (TASK-312): denna
    # helper anropas alltid EFTER huvudgrinden nedan (rad ~435) redan
    # passerat jq_version_ok — en version-koll här vore en redundant
    # andra jq --version-process i en logg-väg som redan ska vara
    # best-effort-billig (§ FÄLLNINGS-LOGG ovan: "får ALDRIG påverka
    # hookens exit eller stdout").
    command -v jq >/dev/null 2>&1 || return 0
    mkdir -p "$(dirname "${HOOK_LOGG}")" 2>/dev/null || return 0
    kommando_kort="${COMMAND:0:120}"
    jq -nc \
        --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" \
        --arg hook "deny-frammande-huvudkatalog" \
        --arg kmd "${kommando_kort}" \
        --arg skal "${skalnyckel}" \
        '{ts: $ts, hook: $hook, kommando: $kmd, skal_nyckel: $skal}' \
        >> "${HOOK_LOGG}" 2>/dev/null || true
    return 0
}

# ═══ ÄGARSKAP-TAGANDE — HELPERS (se § ÄGARSKAP-TAGANDE ovan) ══════════════

# finn_cli_pid <startpid> — härleder Claude Code-CLI:ns egen process genom
# förfaderkedjan. Skriver PID på stdout och returnerar 0 vid träff; skriver
# inget och returnerar icke-noll annars (fail-open, se § PID-LIVENESS).
# Bash 3.2-kompatibel MEDVETET (repots golv, macOS) — ingen ${var,,}.
finn_cli_pid() {
    local barn="$1" niva=0 max="${KATALOG_MAX_FORFADER_NIVAER:-6}"
    local foralder comm comm_lc monster monster_lc
    command -v ps >/dev/null 2>&1 || return 1
    while (( niva < max )); do
        foralder="$(ps -o ppid= -p "${barn}" 2>/dev/null | tr -d '[:space:]')"
        [[ -n "${foralder}" && "${foralder}" != "0" && "${foralder}" != "1" ]] || return 1
        comm="$(ps -o comm= -p "${foralder}" 2>/dev/null)"
        comm_lc="$(printf '%s' "${comm}" | tr '[:upper:]' '[:lower:]')"
        for monster in "${KATALOG_CLI_PROCESSNAMN[@]:-}"; do
            [[ -n "${monster}" ]] || continue
            monster_lc="$(printf '%s' "${monster}" | tr '[:upper:]' '[:lower:]')"
            if [[ "${comm_lc}" == *"${monster_lc}"* ]]; then
                printf '%s' "${foralder}"
                return 0
            fi
        done
        barn="${foralder}"
        niva=$((niva + 1))
    done
    return 1
}

# bygg_lapp_json — bygger en HELT NY lapps JSON på stdout (satt_vid = NU).
# Denna hook skriver ENDAST vid TA (ingen lapp fanns) eller TA ÖVER (bevisad
# död ägare) — aldrig för att förnya en egen, redan levande lapp (§ ÄGARSKAP-
# TAGANDE: "Lappen är min" släpper ORÖRD). Kräver SESSION_ID + HUVUDKATALOG
# redan satta av anroparen.
bygg_lapp_json() {
    local pid="" pidstart="" nu_epoch nu_iso
    nu_epoch="$(date +%s 2>/dev/null)" || return 1
    nu_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" || return 1
    pid="$(finn_cli_pid "$$" 2>/dev/null)" || pid=""
    if [[ -n "${pid}" ]]; then
        pidstart="$(ps -o lstart= -p "${pid}" 2>/dev/null)"
        # Vänster- OCH höger-padding, se katalogagarskap-slapp.sh-syskonets
        # mätning: "Sun Jul 26 11:53:15 2026    ".
        pidstart="${pidstart#"${pidstart%%[![:space:]]*}"}"
        pidstart="${pidstart%"${pidstart##*[![:space:]]}"}"
    fi
    jq -n \
        --arg sid "${SESSION_ID}" \
        --arg huvud "${HUVUDKATALOG}" \
        --arg iso "${nu_iso}" \
        --argjson epoch "${nu_epoch}" \
        --arg pid "${pid}" \
        --arg pidstart "${pidstart}" \
        '{session_id: $sid, huvudkatalog: $huvud, satt_vid: $iso, satt_vid_epoch: $epoch,
          agare_pid: (if $pid == "" then null else ($pid | tonumber) end),
          agare_pid_starttid: (if $pidstart == "" then null else $pidstart end)}' \
        2>/dev/null
}

# ta_lappen_ny — EXKLUSIV skapelse när ingen lapp finns. Se § ATOMÄRITET.
ta_lappen_ny() {
    local json
    json="$(bygg_lapp_json)" || return 1
    [[ -n "${json}" ]] || return 1
    (
        set -C
        printf '%s' "${json}" > "${MARKOR}"
    ) 2>/dev/null
}

# ta_over_lappen — ERSÄTTER en bevisat övergiven (död) lapp. temp+mv, se
# § ATOMÄRITET för det kvarvarande racet denna form INTE stänger.
ta_over_lappen() {
    local json
    json="$(bygg_lapp_json)" || return 1
    [[ -n "${json}" ]] || return 1
    printf '%s' "${json}" > "${MARKOR}.tmp" 2>/dev/null || return 1
    mv -f "${MARKOR}.tmp" "${MARKOR}" 2>/dev/null || return 1
    return 0
}

# arbetstrad_har_ocommittat_arbete — se § VARNING VID SMUTSIGT ARBETSTRÄD.
# Prövar HUVUDKATALOGENS eget träd (COMMON_DIR är dess --git-dir). Otrackade
# filer räknas MEDVETET INTE — se skälet i § VARNING VID SMUTSIGT ARBETSTRÄD.
arbetstrad_har_ocommittat_arbete() {
    local status
    status="$(git -C "${HUVUDKATALOG}" status --porcelain --untracked-files=no 2>/dev/null)"
    [[ -n "${status}" ]] && return 0
    [[ -e "${COMMON_DIR}/MERGE_HEAD" ]] && return 0
    [[ -e "${COMMON_DIR}/CHERRY_PICK_HEAD" ]] && return 0
    [[ -d "${COMMON_DIR}/rebase-merge" ]] && return 0
    [[ -d "${COMMON_DIR}/rebase-apply" ]] && return 0
    return 1
}

jq_version_ok > /dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0
[[ -f "${KATALOG_POLICY}" ]] || exit 0
# shellcheck source=/dev/null
source "${KATALOG_POLICY}" 2>/dev/null || exit 0

[[ -n "${KATALOG_GIT_SKRIVKOMMANDON[*]:+x}" ]] || exit 0

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || exit 0

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2>/dev/null)"
[[ "${TOOL_NAME}" = "Bash" ]] || exit 0

COMMAND="$(printf '%s' "${INPUT}" | jq -r '.tool_input.command // empty' 2>/dev/null)"
[[ -n "${COMMAND}" ]] || exit 0

SESSION_ID="$(printf '%s' "${INPUT}" | jq -r '.session_id // empty' 2>/dev/null)"
[[ -n "${SESSION_ID}" ]] || exit 0

HOOK_CWD="$(printf '%s' "${INPUT}" | jq -r '.cwd // empty' 2>/dev/null)"
# Går katalogbytet inte igenom vet vi inte vilket repo vi står i, och varje
# slutsats härifrån vore om fel träd. Fail-open enligt § FAIL-OPEN-VALET.
if [[ -n "${HOOK_CWD}" && -d "${HOOK_CWD}" ]]; then
    cd "${HOOK_CWD}" 2>/dev/null || exit 0
fi

# ── Delfråga 1: är kommandot en git-skrivning? ────────────────────────────
#
# Ett kommando kan bära FLERA git-anrop (`git merge && git status`), så varje
# segment prövas för sig — annars hade bara det sista undersökts, och en
# skrivning följd av en läsning hade sluppit igenom.
#
# Globala flaggor som står FÖRE underkommandot och själva bär ett värde
# (`-C <path>`, `-c <k=v>`, `--git-dir <path>` …) hoppas över med sitt
# värde; annars skulle `git -C foo merge` läsas som underkommandot "-C".

_prova_segment() {
    local seg="$1" sub="" wsub=""
    # shellcheck disable=SC2086
    set -- ${seg}
    # Täcker `git`, `/usr/bin/git` och `sudo git` (sudo hoppas över nedan).
    [[ "${1:-}" = "sudo" ]] && shift
    case "${1:-}" in
        git|*/git) shift ;;
        *) return 1 ;;
    esac

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -C|-c) shift 2 2>/dev/null || return 1 ;;
            --git-dir|--work-tree|--namespace|--exec-path) shift 2 2>/dev/null || return 1 ;;
            --*=*) shift ;;
            -*) shift ;;
            *) sub="$1"; break ;;
        esac
    done
    [[ -n "${sub}" ]] || return 1

    # `git worktree list` är en läsning; add/remove/… är skrivningar.
    if [[ "${sub}" = "worktree" ]]; then
        wsub="${2:-}"
        for w in "${KATALOG_WORKTREE_SKRIVKOMMANDON[@]:-}"; do
            [[ "${wsub}" = "${w}" ]] && { GIT_SUBKOMMANDO="worktree ${wsub}"; return 0; }
        done
        return 1
    fi

    for k in "${KATALOG_GIT_SKRIVKOMMANDON[@]}"; do
        if [[ "${sub}" = "${k}" ]]; then
            GIT_SUBKOMMANDO="${sub}"
            return 0
        fi
    done
    return 1
}

ar_git_skrivning() {
    local cmd="$1" segment
    # Dela på shell-separatorer (; | & och radbrytning). `&&` och `||` blir
    # två newlines med en tom rad emellan, som hoppas över.
    # `printf '%s\n'` — den avslutande radbrytningen är INTE kosmetisk: utan
    # den returnerar `read` icke-noll på sista raden och while-loopen hoppar
    # över den. Med ett endradskommando (normalfallet) betyder det att INGET
    # prövas och hooken släpper allt. Fångat av testsviten 2026-08-04.
    local segmenterade
    # `tr`:s returvärde är ointressant här och maskeras medvetet i en
    # kommandosubstitution (SC2312) — därför fångas det i en variabel först,
    # så loopen nedan matar från en här-sträng i stället.
    #
    # SC2020 varnar för duplicerade tecken i tr:s ersättningsset. Här är det
    # avsikten: tre separator-TECKEN ska var för sig bli en radbrytning. Det
    # är teckenvis ersättning, inte ordvis — precis vad tr gör.
    # shellcheck disable=SC2020
    segmenterade="$(printf '%s\n' "${cmd}" | tr ';|&' '\n\n\n')" || return 1
    while IFS= read -r segment; do
        [[ -n "${segment//[[:space:]]/}" ]] || continue
        _prova_segment "${segment}" && return 0
    done <<< "${segmenterade}"
    return 1
}

GIT_SUBKOMMANDO=""
ar_git_skrivning "${COMMAND}" || exit 0

# ── Delfråga 2: riktas den mot huvudkatalogen? ────────────────────────────
COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || exit 0
GIT_DIR="$(git rev-parse --path-format=absolute --git-dir 2>/dev/null)" || exit 0
[[ -n "${COMMON_DIR}" && -n "${GIT_DIR}" ]] || exit 0

HUVUDKATALOG="${COMMON_DIR%/.git}"
[[ -n "${HUVUDKATALOG}" && "${HUVUDKATALOG}" != "${COMMON_DIR}" ]] || exit 0

# Alternativa skrivformer av samma katalog. macOS symlinkar /var -> /private/var
# och /tmp -> /private/tmp, så `git rev-parse` kan svara `/private/tmp/...`
# medan kommandot och `cwd` bär `/tmp/...` — en ren strängjämförelse missar då.
# Det är inte hypotetiskt: detta repo har worktrees under /private/tmp/claude-501/.
HUVUD_FORMER=("${HUVUDKATALOG}")
[[ "${HUVUDKATALOG}" == /private/* ]] && HUVUD_FORMER+=("${HUVUDKATALOG#/private}")
if command -v realpath >/dev/null 2>&1; then
    HUVUD_REAL="$(realpath "${HUVUDKATALOG}" 2>/dev/null)"
    [[ -n "${HUVUD_REAL}" && "${HUVUD_REAL}" != "${HUVUDKATALOG}" ]] && HUVUD_FORMER+=("${HUVUD_REAL}")
fi

TRAFFVAG=""
# Väg 1 (exakt): sessionens cwd ÄR huvudkatalogen.
if [[ "${GIT_DIR}" = "${COMMON_DIR}" ]]; then
    TRAFFVAG="arbetskatalogen är huvudkatalogen"
else
    # Väg 2+3 (approximativ, se § SCOPE-GRÄNSER): kommandot pekar dit explicit.
    for form in "${HUVUD_FORMER[@]}"; do
        if [[ "${COMMAND}" == *"${form}"* ]]; then
            TRAFFVAG="kommandot pekar explicit på huvudkatalogen"
            break
        fi
    done
    [[ -n "${TRAFFVAG}" ]] || exit 0
fi

# ── Delfråga 3: äger denna session huvudkatalogen — eller ska den TA den? ──
# Se § ÄGARSKAP-TAGANDE ovan. Bara en session som faktiskt KÖR i
# huvudkatalogen får ta eller ta över — en worktree-session som pekar dit via
# `-C` gör inget hemvist-anspråk (§ VARFÖR "TA" BARA GÄLLER...).
AR_HUVUDKAT_SESSION="false"
[[ "${TRAFFVAG}" = "arbetskatalogen är huvudkatalogen" ]] && AR_HUVUDKAT_SESSION="true"

MARKOR="${COMMON_DIR}/${KATALOG_MARKOR_FILNAMN:-katalogagarskap-agare.json}"

if [[ ! -f "${MARKOR}" ]]; then
    if [[ "${AR_HUVUDKAT_SESSION}" = "true" ]]; then
        if ta_lappen_ny; then
            exit 0
        fi
        # Exklusiv skapelse (§ ATOMÄRITET, noclobber) misslyckades —
        # obestridligt tecken på att en ANNAN session hann skriva mellan
        # kollen ovan och detta försök. Fortsätt nedan och läs DEN lappen i
        # stället för att anta något om vem som vann.
    else
        # Pekande worktree-session mot ett tomt läge: inget att skydda mot,
        # och inget hemvist-anspråk att göra härifrån.
        exit 0
    fi
fi

# Fortfarande ingen lapp (t.ex. skrivfel utan att det var ett race) →
# fail-open, släpp.
[[ -f "${MARKOR}" ]] || exit 0

AGARE="$(jq -r '.session_id // empty' "${MARKOR}" 2>/dev/null)"
[[ -n "${AGARE}" ]] || exit 0

AGARE_EPOCH="$(jq -r '.satt_vid_epoch // 0' "${MARKOR}" 2>/dev/null)"
AGARE_ISO="$(jq -r '.satt_vid // "okänt"' "${MARKOR}" 2>/dev/null)"

if [[ "${AGARE}" = "${SESSION_ID}" ]]; then
    # Egen lapp → släpp, ORÖRD. "Behålls så länge processen lever" (ADR-090
    # § Update) — ingen uppdatering, ingen tystnads-klocka. Se § ÄGARSKAP-
    # TAGANDE för varför ett tidsbaserat spår MEDVETET förkastades här.
    exit 0
fi

AGARE_PID="$(jq -r '.agare_pid // empty' "${MARKOR}" 2>/dev/null)"
AGARE_PID_STARTTID="$(jq -r '.agare_pid_starttid // empty' "${MARKOR}" 2>/dev/null)"
NU_EPOCH="$(date +%s 2>/dev/null || echo 0)"

# ── Delfråga 4: lever den ägande processen fortfarande? ───────────────────
# Se § LIVENESS-PRÖVNING ovan för hela resonemanget. LIVENESS landar i ett av
# tre lägen: "levande" (NEKAR alltid, oavsett tystnad — se § ÄGARSKAP-
# TAGANDE), "dod"/"atervand" (TAS ÖVER eller rivs TYST — aldrig via neka()),
# eller "okand" (varken pid-fältet eller ps/kill kunde avgöra saken → faller
# igenom till samma tidsbaserade skäl som gällde FÖRE T120).
LIVENESS="okand"
if [[ -n "${AGARE_PID}" ]] && command -v kill >/dev/null 2>&1 && command -v ps >/dev/null 2>&1; then
    if kill -0 "${AGARE_PID}" 2>/dev/null; then
        NUVARANDE_START="$(ps -o lstart= -p "${AGARE_PID}" 2>/dev/null)"
        NUVARANDE_START="${NUVARANDE_START#"${NUVARANDE_START%%[![:space:]]*}"}"
        NUVARANDE_START="${NUVARANDE_START%"${NUVARANDE_START##*[![:space:]]}"}"
        if [[ -n "${NUVARANDE_START}" && -n "${AGARE_PID_STARTTID}" ]]; then
            if [[ "${NUVARANDE_START}" = "${AGARE_PID_STARTTID}" ]]; then
                LIVENESS="levande"
            else
                # Samma PID, ANNAN starttid — PID-återanvändningsgarden slog
                # till. Den ursprunglige ägaren är inte längre denna process.
                LIVENESS="atervand"
            fi
        fi
        # NUVARANDE_START eller AGARE_PID_STARTTID tom (ps kunde inte svara,
        # eller lappen saknar fältet) → LIVENESS förblir "okand", medvetet.
    else
        LIVENESS="dod"
    fi
fi

if [[ "${LIVENESS}" = "dod" || "${LIVENESS}" = "atervand" ]]; then
    # BEVISLIGEN ÖVERGIVEN — släpp, ingen fällnings-logg (ingen nekande
    # skedde). Huvudkatalogs-session TAR ÖVER (skriver sin egen identitet);
    # en pekande worktree-session river bara den övergivna lappen utan att
    # göra anspråk på den (§ VARFÖR "TA" BARA GÄLLER...). I BÅDA fallen:
    # varna om arbetsträdet bär spår av den döda sessionens ofärdiga arbete
    # (§ VARNING VID SMUTSIGT ARBETSTRÄD) — kommandot släpps igenom oavsett.
    if [[ "${AR_HUVUDKAT_SESSION}" = "true" ]]; then
        ta_over_lappen || true
    else
        rm -f "${MARKOR}" 2>/dev/null
    fi
    if arbetstrad_har_ocommittat_arbete; then
        jq -nc --arg v "Katalogägarskapet i ${HUVUDKATALOG} togs över från en DÖD session (process ${AGARE_PID:-okänd} kör inte längre) — men arbetsträdet har OCOMMITTADE ändringar (modifierade eller staged filer) eller en pågående git-operation (merge/cherry-pick/rebase) som kan tillhöra den döda sessionens ofärdiga arbete. Kör 'git status' INNAN du gör något destruktivt (checkout, reset, stash, merge) — det kan vara arbete som aldrig committades och som går förlorat om du skriver över det utan att kolla först." \
            '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "allow", additionalContext: $v}}' \
            2>/dev/null || true
    fi
    exit 0
fi

if [[ "${LIVENESS}" = "levande" ]]; then
    # Levande — NEKAR ALLTID, oavsett hur länge tyst. Ett tidsbaserat
    # övertagande övervägdes och FÖRKASTADES (§ ÄGARSKAP-TAGANDE, "FÖRKASTAT"):
    # ett arbetsträd med ocommittat arbete är upptaget oavsett ägarens
    # tystnad, och risken (skriva ovanpå ocommittat arbete) är för hög för
    # att motivera vinsten (en session slipper vänta i en worktree).
    logga_fallning "FRAMMANDE_AGARE_LEVANDE"
    neka "KATALOGÄGARSKAP (ADR-090 beslut 2, T120): kommandot är en git-skrivning (${GIT_SUBKOMMANDO}) mot huvudkatalogen ${HUVUDKATALOG} — ${TRAFFVAG} — men huvudkatalogen ägs av en ANNAN session vars process BEVISLIGEN kör fortfarande (satt ${AGARE_ISO}, process ${AGARE_PID}). Regeln: den först startade sessionen behåller huvudträdet, den senare arbetar i en worktree — S96 Del 8 bröt detta tre gånger i ett pass. ARBETA I DIN EGEN WORKTREE I STÄLLET: kör om kommandot där, mot din egen katalog, inte mot huvudkatalogen. Detta är ett maskinellt beslut riktat till dig som skrev kommandot — eskalera det INTE till Marcus, du har all information som krävs för att välja rätt katalog. (Vill Marcus MEDVETET åsidosätta den levande ägaren: rm ${MARKOR} — men det är hans val att göra manuellt, inte ditt att fråga om.)"
fi

# ── Fallback: LIVENESS = "okand" — samma tidsbaserade skäl som FÖRE T120 ──
# Lappen är antingen äldre form (inget agare_pid) eller ps/kill gick inte att
# köra. .katalogagarskap-policy.conf § Stale-tröskel förklarar varför detta
# nu är en SISTA UTVÄG, inte primärt försvar.
STALE_GRANS="${KATALOG_STALE_TIMMAR:-1}"
STALE_NOT=""
if (( AGARE_EPOCH > 0 && NU_EPOCH > 0 )); then
    ALDER_TIMMAR=$(( (NU_EPOCH - AGARE_EPOCH) / 3600 ))
    if (( ALDER_TIMMAR >= STALE_GRANS )); then
        STALE_NOT=" Lappen är ${ALDER_TIMMAR} timmar gammal, över stale-tröskeln ${STALE_GRANS} h — sannolikt en session som dog utan att städa. Är den bevisligen död: rm ${MARKOR}"
    fi
fi

logga_fallning "FRAMMANDE_AGARE_OKAND_LIVENESS"
neka "KATALOGÄGARSKAP (ADR-090 beslut 2, T120): kommandot är en git-skrivning (${GIT_SUBKOMMANDO}) mot huvudkatalogen ${HUVUDKATALOG} — ${TRAFFVAG} — men huvudkatalogen ägs av en ANNAN session enligt ägarlappen (satt ${AGARE_ISO}), och liveness kunde INTE fastställas för den (äldre lappform utan process-ID, eller ps/kill otillgängligt just nu).${STALE_NOT} Regeln: den först startade sessionen behåller huvudträdet, den senare arbetar i en worktree. ARBETA I DIN EGEN WORKTREE I STÄLLET: kör om kommandot där. Detta är ett maskinellt beslut riktat till dig som skrev kommandot — eskalera det INTE till Marcus."
