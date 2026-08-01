---
owner: marcus803
updated: 2026-08-02
review_by: 2026-11-01
status: stable
lifecycle: paused
---

# T112 — Väckningskedjan över turgränsen: bakgrundsvakter dog trots vaken maskin

> **Registrerad 2026-08-01 på Marcus order** — *"bokföras och förberedas för
> stabil åtgärd"* — ur orkestreringens förlopp 2026-07-31→08-01. Kortet skiljer
> strikt **MÄTT** från **HYPOTES**: allt nedan är bokfört ur förloppet, och den
> enda hypotes som hann formuleras är öppet riven i sin egen sektion.

## Förloppet

2026-07-31 ~10:45–11:03Z landade 11 PR:er ur en våg om 13 agenter; 11 agenter
parkerade sig därefter på bakgrundsvakter mot merge-kön. Efter 11:03Z nådde
**inga** task-notifikationer orkestrator-sessionen förrän Marcus första
meddelande på förmiddagen 2026-08-01 — allt arbete stod stilla över natten.

## Falsifierat: maskinvila

Orkestrerarens första hypotes var maskinvila. Marcus 2026-08-01:
`caffeinate -dimsu` var aktivt hela tiden. Maskinen var vaken; felet ligger i
orkestrerings-/harness-kedjan.

**Hypotesen rivs här öppet — och rivningen bär en egen lärdom.** Den hann
rapporteras som "troligast" innan den prövats. Det är hypotes-disciplinens
felklass: en oprövad förklaring som får en sannolikhetsstämpel läses som ett
fynd, och nästa läsare bygger vidare på den. Prövningen (en fråga till Marcus)
kostade en mening; den oprövade rapporten hann kosta en felriktad förklaring.

## Mätt

Tre observationer, samtliga bokförda ur förloppet:

1. **En fullbordad vakt väckte ingen.** En agents vakt
   (`gh pr checks 518 --watch`, bakgrundsjobb) fullföljde med exit 0 utan att
   agentens återupptagning nådde sessionen. Agenten väcktes först av
   orkestrerarens `SendMessage` nästa dag — och alla fyra så väckta agenter
   återupptogs då korrekt med bevarad kontext. Kedjan bröts alltså **efter**
   vaktens fullbordan och **före** sessionens väckning; agenternas tillstånd
   var intakt hela tiden.

2. **En "tills merged"-vakt är i praktiken obyggbar för worktree-agenter under
   nuvarande spärr.** Sandbox-spärren avvisade tre vaktformer för
   worktree-isolerade agenter — två sammansatta shell-loopar och
   Monitor-verktyget — med worktree-isolationsfel. Det är varför vakterna blev
   `gh pr checks --watch`, som inte täcker kö-fasen.

3. **Spawnade agenter är osynliga i harnessets task-lista.** På
   orkestrerar-ytan visade TaskList "No tasks found" medan 11 spawnade agenter
   var aktiva — en `T108`-angränsande detektor-lucka: ytan som skulle visa
   väntande arbete visar tomhet.

## Klass

- **`T108`:s tes bekräftad skarpt:** en vakt som bor i den aktör som slutat
  arbeta dör med den. Skärpningen mot `T108`:s egen bokföring: även formen som
  där bokfördes som notifierande — bakgrundsjobb agenten själv startat —
  fullföljde utan att väcka någon över turgränsen (Mätt 1).
- **`T111`:s förutsättning skärpt:** autonom drift kräver extern trigger —
  väckning inifrån räcker inte ens med vaken maskin.

## Åtgärdsriktningar att utreda — INGEN VALD

Förberedelse för stabilt åtgärdsbeslut (Marcus-order 2026-08-01). Fyra
riktningar, öppet bokförda utan val:

1. **Extern trigger som heartbeat** — cron/routines; `T111`:s belagda väg
   (routine-körningar startar i färsk kontext, se
   [T111-kortet](T111-autonom-orkestrering-kontexttroskel.md) § Docs-utredningen).
2. **Orkestrerar-svep som stående rutin vid varje äkta väckning** — verifiera
   PR-/agent-läge mot GitHub före rapport. Det var det som räddade läget
   2026-08-01.
3. **Vakt-design-regel för agenter** — en bakgrundsvakts fullbordan får aldrig
   **antas** väcka någon; agenten lämnar läges-rapport före parkering, och
   verifikat hämtas i efterhand.
4. **Avgränsad harness-mätning** — levereras task-notifikationer till en idle
   huvudsession utan användarinteraktion? Bryts kedjan vid agent-resume eller
   vid notifikations-leverans?

## Åtgärdsval (2026-08-01)

Marcus GO 2026-08-01 (klass A): riktningarna **(ii)** och **(iii)** är LÅSTA
som stabil åtgärd — de var i drift sedan 2026-08-01 ~12:15 (S91 Del 39.5) och
är nu kodifierade i denna landning:

- **(ii) Orkestrerar-svep vid varje väckning + persistent heartbeat** —
  kodifierad i `CLAUDE.md` § Landning, stycket *"Svep vid varje väckning —
  passiv väntan är avskaffad som arbetsläge"*: notifikation eller
  heartbeat-event → verifiera mot git/REST → armera oarmerat → väck
  ägar-agenter → starta nästa post.
- **(iii) Vakt-design-regeln** — kodifierad i `.claude/agents/bygg-agent.md`
  § *"Parkera aldrig på en landnings-vakt"*: agenter parkerar aldrig på
  landnings-vakter, slutrapporten lämnas vid armerad PR (PR-nummer + SHA),
  landnings-/merge_group-verifikat ägs av orkestrerarens svep, och vakt-event
  är väckarklocka — aldrig fakta.
- **(iv) Harness-mätningen** — KVARSTÅR ÖPPEN; kort-kandidat post-S91.
- **(i) Cron-heartbeat** — VILANDE tills `T111`-bygget.

**ADR-bar-prövningen, bokförd:** UNDER baren. Villkor 1 (svårt att återställa
i kod eller koherens) håller inte — åtgärden är en operativ rutin, reverterbar
med en diff, och skälet bärs durabelt av detta kort + S91 Del 39.5 +
registerraden, så koherensen överlever en revert. Villkor 3 är dessutom svagt:
(i) och (iv) förkastades inte utan står vilande/öppna — ingen options-rymd
stängdes. Ingen ADR mintas; under-bar-ADR kräver explicit Marcus-beslut.

**Lifecycle-prövning mot registrets regler:** tråden stängs INTE — `closed`
betyder avslutad, och (iv) är oprövad samt (i) vilande. Tråden förblir
`paused` med uppdaterad registerrad.

Sandbox-observationen i § Mätt (2) fick f.ö. en ny instans vid själva
kodifieringen: även en enkel `gh pr view`-poll-loop i bakgrund avvisades för
en worktree-isolerad agent (*"too complex to verify"*), 2026-08-01.

## Ny instans, § Mätt (1) — stängningsbatch-agenten (2026-08-02)

> Orkestrerar-empiri, märkt som sådan — inte oberoende verifierad av
> mottagaren mot en loggartefakt (skiljer sig därmed från kortets övriga
> § Mätt-poster, som samtliga är förloppsbokförda). Registreras ändå per
> ADR-053 (registrera, förkasta aldrig tyst) och för att den är ytterligare
> en instans av EXAKT § Mätt (1):s mönster, om den håller.

Stängningsbatch-agenten (PR #574, `stangning/s91-tjugoandra-fyra-pr-batch-done`)
dead-parkade på sin egen bakgrundsgrind: grinden fullbordades utan att väcka
agenten (`SendMessage` gav *"no active task"* vid orkestrerarens första
väckningsförsök). Agenten återupptogs korrekt från transcript via ett andra
`SendMessage`, med bevarad kontext — samma räddningsmönster som § Mätt (1):s
fyra tidigare instanser (*"alla fyra väckta agenter återupptogs då korrekt med
bevarad kontext"*). **Skärpning:** detta inträffade EFTER (ii)/(iii) i
§ Åtgärdsval låstes i drift (2026-08-01 ~12:15) — vakt-design-regeln
(iii, "parkera aldrig på en landnings-vakt") var alltså redan kodifierad i
`.claude/agents/bygg-agent.md` när detta hände, vilket antingen betyder att
regeln inte hann verka för just denna agent-spawn, eller att kedjebrottet satt
någon annanstans än i agentens egen vakt-vana. Ingen av dessa två möjligheter
är prövad här — nästa läsare bör avgöra vilken.

## Släktskap

`T108` (orkestreraren väntar på notifieringar som strukturellt aldrig kommer —
denna tråd är dess skarpaste empiri hittills) ·
[`T111`](T111-autonom-orkestrering-kontexttroskel.md) (autonom orkestrering —
extern-trigger-vägen som inte kunde uteslutas är nu också den enda som håller) ·
[`T110`](T110-orkestrerarens-felklasser.md) (orkestrerarens felklasser —
maskinvila-hypotesen är en klass D-instans: slutsats ur för få observationer).
