---
owner: marcus803
updated: 2026-07-31
review_by: 2026-10-31
status: stable
lifecycle: paused
---

# T111 — Autonom orkestrering med kontext-tröskel

> **Registrerad 2026-07-31 (S91, nittonde pausen) på Marcus fråga:** en
> nattkörning där orkestreraren själv mäter sin kontextförbrukning, vid **40 %**
> initierar `session-paus`, nollställer kontexten och återupptar via
> `session-resume` — *"Vore ju skitbra om du kunde sköta det automatiskt, är det
> möjligt?"* Marcus föreslog själv tråd nu, skill senare.
>
> **En verifiering kördes samma dag** (`claude-code-guide` mot dokumentation och
> CLI). Denna fil bär dess utfall så att en framtida utredning inte gör om det.

## Frågan delar sig i två halvor med olika svar

### Halva A — mät och pausa vid tröskel: LÖST i princip

**Mätningen är bevisad 2026-07-31.** Kontextförbrukningen går att läsa ur
sessionens transcript-JSONL i
`~/.claude/projects/<projekt-slug>/<session-id>.jsonl`: fältet
`cache_read_input_tokens` i senaste assistant-radens `usage` **är** kontexten som
lästes in. Mätt utfall vid registreringen: **532 411 av 1 000 000 tokens (~53 %)**
efter 15 agenter och 551 turns.

`session-paus` är redan Code-körbar (ADR-069) och kördes skarpt samma dag, sju
steg, grindar gröna. **Det som saknas är bara regeln om när mätningen körs** —
rimligen i orkestrerarens kadens: efter varje agent-våg, före nästa utskick.

Halva A är alltså litet arbete och **kan byggas oberoende av halva B.**

### Halva B — nollställ kontexten automatiskt: BELAGT OMÖJLIG i dag

| Väg | Utfall | Belägg |
|---|---|---|
| `/clear` programmatiskt | **NEJ** — enbart interaktivt slash-kommando, exponeras inte som API, hook eller flagga | `sessions.md` |
| `claude -p --continue` | **NEJ** — *"Resuming a session restores the conversation … the full history, including tool calls and results"* | `headless.md` |
| `--resume <id>` / `--fork-session` | **NEJ** — forking kopierar historiken | `sessions.md` |
| Agent SDK (`continue_conversation` / `resume`) | **NEJ** — identisk session-mekanik, ärver full historik | `agent-sdk/sessions.md` |
| `--no-session-persistence` | **NEJ** — sessionen sparas inte, men kontexten växer ändå under körningen | CLI-hjälp |
| Hook på kontext-tröskel eller kompaktering | **FINNS INTE** — ingen `PreCompact`, `PostCompact` eller `ContextThreshold` bland de dokumenterade hooksen | `hooks.md` |

**Rotorsaken är en designpremiss, inte en lucka:** sessioner är byggda för
*konversations-kontinuitet*, inte för *kontext-återställning*. Varje väg som
återupptar arbete ärver per konstruktion historiken.

## ⚠️ Verifieringens egen lucka — läs denna före utredningen börjar

**Agenten hade inte orkestrerarens verktygsyta.** Den skrev att schemalagda
agenter *"inte är något du kan starta från en session"* — men orkestreraren har
`CronCreate` / `CronDelete` / `CronList` som deferred tools, plus `/schedule`-skillen
(*"Create, update, list, or run scheduled cloud agents (routines) that execute on
a cron schedule"*).

**Det gör cron-vägen till den enda som verifieringen INTE kunde utesluta**, och
den avgörande frågan är obesvarad: **startar varje cron-körning i färsk kontext?**
Gör den det, är den i praktiken lösningen på halva B — utan att någon
kontext-reset behöver existera. Agenten noterade själv att *"inget om
kontexthantering dokumenteras"* för routines.

**Detta är utredningens första fråga.** Mät den; härled den inte.

## Det tredje spåret — och det billigaste

Vid registreringen låg orkestreraren på 53 % efter femton agenter. **Men det var
inte agent-rapporterna som drev det.** Femton rapporter är storleksordningen
30k tokens. Resten är orkestrerarens **egna** läsningar: restlistan (965 rader),
sessionsdoket i delar, trådregistret (142 KB), kortregistret, PR-diffar — plus
551 turns med tool-resultat.

Verifieringen landade oberoende i samma slutsats som sin första rekommendation:
**gör orkestrerarens kontext ITERATIV i stället för monotont växande.** Delegera
all tung läsning till agenter som har egen färsk kontext, och håll bara en tunn
tillståndsyta plus föregående stegs utfall.

**Det kräver ingen ny mekanism — bara disciplin om vad orkestreraren läser
själv.** Det är den billigaste åtgärden och kan tillämpas omedelbart, oavsett vad
utredningen kommer fram till om halva B.

## Autokompakteringen — vad som händer om inget görs

Dokumenterat: *"Claude Code manages context automatically as you approach the
limit. It clears older tool outputs first, then summarizes the conversation if
needed."* Regler, skills och memory-filer bevaras; konversationen kondenseras.

**Odokumenterat:** exakt tröskel, granularitet, vad som överlever, och om det
finns någon signal när det sker.

**Det är i sig ett argument för halva A:** en medveten paus vid en vald tröskel,
med disk-skriven handoff, är överlägsen en okänd kompaktering vid ett okänt tak.
En handoff på disk är läsbar och granskningsbar; en kondenserad konversation är
det inte.

## Kopplingen till `T110` — läs dem tillsammans

Autonom drift **tar bort den sista externa fångst-mekanismen.** Under nittonde
resumen gjorde orkestreraren fem fel, samtliga fångade av agenter och noll av
Marcus. Det fungerade — men `T110` slår fast att vi mäter *fångade* fel, inte
*begångna*, och att nämnaren är okänd.

**En autonom nattkörning förlitar sig helt på att agenterna fortsätter gå på
regeln i stället för på orkestrerarens tal.** Det är ett argument för att `T110`
utreds före autonom drift blir rutin — inte för att avstå, men för att veta vad
man kör på.

## Vad en utredning bör avgöra

1. **Startar en cron-/routine-körning i färsk kontext?** Mät. Detta avgör om
   halva B har en väg alls.
2. **Bygg halva A oberoende** — mätning + tröskel + paus. Vilken tröskel? Marcus
   föreslog 40 %; talet är ett val, inte en mätning.
3. **Formalisera det tredje spåret** som en regel för orkestrerarens läsning.
   Vilka ytor får orkestreraren läsa själv, och vilka ska alltid delegeras?
4. **Är en skill rätt form**, eller hör detta i `bygg-agent`-familjens
   kontrakt? Marcus skisserade *"autonom-orkestrering"* som skill körbar
   tillsammans med `work-batch` och på nätter.
5. **Vad kostar mätningen?** Att läsa transcript-JSONL vid varje våg har en
   kostnad ingen mätt.

## Släktskap

`T110` (orkestrerarens felklasser — autonomi förstärker dem) · `T108`
(hook-familjen och dess distributionshinder) · `work-batch`-skillen (AFK-batch,
den befintliga formen närmast detta) · `ADR-069` (lifecycle-verbens
Code-körbarhet, som gör halva A möjlig alls).
