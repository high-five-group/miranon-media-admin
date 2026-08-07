---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T134 — Agent-apparatens genomloppstid står inte i proportion till kodens storlek

> Tråd-kort (ADR-053), fött i S93 Del 10/11 efter att Marcus underkände takten
> och den efterföljande mätningen visade att kodmängden inte förklarar tiden.
> Registrerad som **defer** i triagen: den blockerar inte pågående arbete, men
> den är för substantiell för att bära som en rad.

## Vad som observerades

Marcus underkände takten i `TASK-145`/`146`-passet, verbatim:

> *"Vad fan, jag fattar inte vad det är som tar sådan tid. Vi kodar ju inte ett
> nytt Google liksom. Det är några förändringar på eventdetalj-sidan…"*

Och med den jämförelse som gör observationen mätbar:

> *"När vi byggde prototypen så gick alla ändringar, alltså själva kodandet
> mycket snabbare än detta. […] Vid den här tiden trodde jag ALLT skulle vara
> klart för länge sedan."*

Följdfrågan Marcus ställde — och som utlöste mätningen — var om agenterna
**byggde om allt från noll** trots att eventdetalj-sidan redan fanns i skarp,
testad form.

## Vad mätningen visade

**Svaret på frågan är nej.** Ingenting byggdes från noll. Mätt per merge-commit
över de sex landade skivorna:

| Skiva | Merge-SHA | `src/` | `tests/` |
|---|---|---|---|
| `TASK-145.1` registret som EN lista | `9be1ada4` | +186 / −219 | +204 / −82 |
| `TASK-145.2` summeringsblocket | `0682a5b0` | +224 / −324 | +64 / −43 |
| `TASK-145.4` betalningsytan | `1af3299d` | +109 / −110 | +253 / −312 |
| `TASK-146.1` PDF-runtime-beviset | `38565ae8` | **0** | +213 |
| `TASK-146.2` Bilagor-tabellen | `2f280d58` | **0** | 0 |
| `TASK-146.3` privat bucket | `ba4a8259` | **0** | +194 |

**Netto över samtliga sex skivor i `src/`: +519 / −653 = −134 rader.** Koden
blev mindre, inte större.

Eventsidans tre skivor rörde uteslutande BEFINTLIGA filer —
`src/components/events/detail/Deltagare.tsx` (2 136 rader på `main`) och
`Betalningar.tsx` (1 232 rader). De tre `146`-skivorna rörde inte `src/` alls.
De två E2E-filer som ett tidigt byggförsök raderade (`event-bekraftelse` 953
rader, `event-bor-over` 378 rader) finns kvar på `main` — granskningslagret
fångade det.

## Hypoteser om vart tiden tar vägen

Ingen av dem är verifierad; det är trådens uppgift.

1. **Kontexten byggs från noll även när koden inte gör det.** Varje skiva
   startade en kall agent som läste 500–620k tokens innan första raden skrevs.
   Tre skivor mot samma `Deltagare.tsx` läser samma 2 136 rader tre gånger.
   *Detta är den starkaste kandidaten och den enda som redan har en delvis
   åtgärd:* Marcus beslut att ta `145.3`+`145.5`+`145.6` med EN agent i ett
   svep.
2. **Felaktiga uppdrag kostar mer än långsamma agenter.** `TASK-145.1` ensam
   kostade 2,5 timmar, varav **72 minuter var rent slöseri** — försök 1 (63
   min) plus återställningen (9 min), båda kastade, båda orsakade av
   orkestrerarens egna spec-fel. Fem spec-fel bokfördes i samma pass (S93
   Del 10), samtliga fångade externt, inget av self-review.
3. **Apparaten runt koden är inte prisad.** AC med beviskrav, DoD-poster,
   E2E-sviter som ska uppdateras, CI-cykel per ändring, facit-review som eget
   steg. Prototypen hade inget av det och upplevdes snabb. Frågan är inte om
   lagret är värt något — det fångade tre verkliga fel detta pass — utan om
   dess kostnad är rätt fördelad över skivor.
4. **Skivsnittet kan generera arbete.** `145.1` och `145.3` såg ut som två
   skivor men var en i koden (`Deltagare.tsx:1652` + `:2103`). Ett snitt som
   inte följer kodens kopplingar tvingar fram överlapp och omtag.

## Vad tråden ska utreda

- **Mät var tiden faktiskt går.** Per skiva: kontextinläsning · planering ·
  kodskrivning · lokala grindar · CI-väntan · review/omtag. Utan den
  fördelningen är varje åtgärd en gissning. Överväg om `agent-spawn-log.jsonl`
  redan bär tillräckligt för en första fördelning.
- **Pröva om hypotes 1 håller** genom att jämföra det kommande
  `145.3`+`145.5`+`145.6`-svepet (en agent, tre skivor) mot passets
  per-skiva-siffror. Samma filer, samma klass av arbete — ovanligt ren
  jämförelse.
- **Avgör om något ska ändras i skill eller agentinstruktion.** Kandidater,
  ingen beslutad:
  - `bygg-agent.md` — kan en agent som ska ta flera skivor i samma filer få
    en explicit form för det, i stället för att varje skiva antas vara ett
    eget kallt uppdrag?
  - `/to-issues` — skivsnittet prövas idag mot funktionsytan; hypotes 4 och
    `tasks/lessons.d/skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan.md`
    pekar på att det också måste prövas mot kodens kopplingar.
  - `/do-work` — om DoD/AC-lagrets kostnad är ojämnt fördelad, är frågan om
    beviskravens tyngd ska skalas med skivans risk i stället för att vara
    uniform.
  - Orkestrerarens uppdragsskrivning — fem spec-fel i ett pass, alla fångade
    externt, är en mätpunkt i sig. `ADR-086` (premisserna prövas av
    mottagaren) finns redan; frågan är om den räcker.

## Vad tråden INTE är

Den är inte ett förslag att riva granskningslagret. Passet som utlöste tråden
är samtidigt beviset för lagrets värde: tre verkliga fel fångade (Bor över som
försvann ur specen, markera-läget som satt fast i rubriken, `hallplatsMarke`
som tyst dolde utskicksraderna) plus 1 331 rader E2E räddade. Vilken åtgärd som
än faller ut ska den sänka kostnaden utan att sänka fångsten.

## Ingång

- S93 sessionsdok Del 10 (takt-underkännandet, mätt agent-tid per skiva, de fem
  spec-felen) och Del 11 (diffmätningen ovan).
- Fragment: `tasks/lessons.d/skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan.md`
  och `tasks/lessons.d/uppdragets-kallmarkning-maste-avse-gallande-text.md`.
- Relaterade trådar: `T110` (orkestrerarens felklasser) · `T113`
  (Sonnet-subagent-mätuppföljning).
