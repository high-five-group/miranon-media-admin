---
owner: marcus803
updated: 2026-07-24
review_by: 2026-10-24
status: stable
lifecycle: active
---

# T89 — S83-transkriptgranskningens förbättringspaket (prototyp-pass-effektivitet)

> Tråd-kort (ADR-053). Född 2026-07-24 ur extern transkriptgranskning (Chat)
> av S83-utdraget startprompt → första stopp, § 6-verifierad av Code mot
> session-JSONL + disk samma dag. Commit-tagg: `[T89]`.

## Ursprung

Marcus beställde en extern granskning (Claude, chat-ytan) av S83:s autonoma
pass — sessionsorder → steg 2-överlämningen (19,5 min, 75 API-turer) — med
frågan vad som händer bakom kulisserna och om det finns förbättringspotential.
Granskningen + Codes verifikation (exakta token-tal ur JSONL, disk-kontroller,
korrigeringar) bor i
[s83-transkriptgranskning-2026-07-24.md](../../docs/research/s83-transkriptgranskning-2026-07-24.md).
Samma genre som T85:s Codex-spår men annan yta: sessions-/skill-mekanik, inte
CI-kedjan — därför egen tråd med T85-fönstret som exekveringsadress för de
mekaniska delarna (källorna hålls separerade).

## Domen (verifierad)

Passet väl exekverat — inga omtag, korrekt parallellisering (PR-vakt async,
research-subagent landade lagom till steg 2). Sex fynd; alla sex
disk-bekräftade. Adresserbart: ~5–7 min + kontext per prototyp-pass.

## Paketet

| Fynd | Vad | Klass | Åtgärd | Fönster |
|---|---|---|---|---|
| F1a | `todo.md` 330,8 KB historikarkiv (megarad rad 7: 13 383 tecken; sessionsnarrativ har idag TRE hemvister: sessionsdok + BUILD-LOG + rad 7) | [B] | historik → arkiv/BUILD-LOG som enda narrativa hemvist; mål < 50 KB; Pre-K-pass på kadensradens roll först | eget litet beslut/pass |
| F1b | session-start-skillen föreskriver oguardad `todo.md`-läsning → 1 garanterat avvisat anrop + ~20 KB per session, varje agent | [M] | föreskriv Read med limit i hub-skillen | T85-korrigeringsfönstret el. hub-sync |
| F2 | engångs-verifieringsskript per prototyp-pass (fem `proto-*.debug.mjs` ackumulerade 2026-07-24); miljöfakta återupptäcks trots att 5173-vägran är dokumenterad task-5-design | [M] | incheckat parametriserat `scripts/proto-verify.mjs` + miljöfakta-pekare i prototype-skillen; lesson-kandidat | T85-korrigeringsfönstret |
| F3 | grindloop utan autofix: check → class-sort-fall → `--write` → recheck (bekräftad sekvens 14:59–15:00) | [M] | autofix före grind som standardsteg i iterationsloopar | T85-korrigeringsfönstret |
| F4 | exakt-kopia-baslinje skrevs som generativ Write (12,9 KB) — drift-risk + ~3–4k output-tokens; prototype-skillen kräver exakt kopia men föreskriver ingen metod | [B] | `cp` + riktade Edits, exakthet by construction; skrivs in i prototype-skillens konvergens-avsnitt | hub-skill-ändring, Marcus-kvittens |
| F6 | ~80 % av fönstrets 68 917 output-tokens var thinking (72 tankeblock, xhigh) | [B, experiment] | ETT återstående prototyp-pass på lägre effort; jämför väggklocka + utfall + grindar mot baslinjen | återstående S83-pass — FÖRE T85 |

**Avstyrkt (bokfört, ej tyst):** F5b "lätt-variant av session-start" —
ceremonin är ~1 min/pass vid flerpass-sessioner (amortering = F5a, redan
praxis) och är ADR-043/L67/L68:s drift-skydd; dok-födelsen fångade dessutom
en räknedrift i själva S83-starten (BUILD-LOG:s föråldrade L-räkning).
Granskningens § 5 bevarandevärden gäller oavkortat: async-disciplinen,
subagent-parallelliseringen och verifieringsambitionen optimeras INTE bort.

## Beslutsläge

Marcus 2026-07-24: paketriktningen kvitterad ("bra förbättringsgrejer", tråd
beordrad; tråd-vs-T85-inbakning delegerad till Code → egen tråd). Per punkt:
F1b/F2/F3 mekaniska — exekveras utan vidare beslut i sina fönster; F1a/F4/F6
tas som små explicita Marcus-beslut vid respektive upptag.

## Relationer

[T85](T85-riskanpassad-ci.md) (samma processgransknings-genre;
korrigeringssessionen är F1b/F2/F3:s naturliga fönster) ·
[T86](T86-pocock-v11-integrationen.md) (S83-passen är körplanens punkt 2–3;
F6-fönstret ligger i dess återstående pass) · hub-skills `session-start` +
`prototype` (F1b/F4-bärare, ändring via hub-repo + plugin-bump).
