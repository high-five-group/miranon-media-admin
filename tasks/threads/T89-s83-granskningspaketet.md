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
| F2 | engångs-verifieringsskript per prototyp-pass (**sex**, ej fem — `proto-*.debug.mjs` ackumulerade 2026-07-24); miljöfakta återupptäcks trots att 5173-vägran är dokumenterad task-5-design | [M] | ✅ **DELVIS ÅTGÄRDAD S88, verktygs-halvan AVSTYRKT** — se nedan | T85-korrigeringsfönstret |
| F3 | grindloop utan autofix: check → class-sort-fall → `--write` → recheck (bekräftad sekvens 14:59–15:00) | [M] | autofix före grind som standardsteg i iterationsloopar | T85-korrigeringsfönstret |
| F4 | exakt-kopia-baslinje skrevs som generativ Write (12,9 KB) — drift-risk + ~3–4k output-tokens; prototype-skillen kräver exakt kopia men föreskriver ingen metod | [B] | `cp` + riktade Edits, exakthet by construction; skrivs in i prototype-skillens konvergens-avsnitt | hub-skill-ändring, Marcus-kvittens |
| F6 | ~80 % av fönstrets 68 917 output-tokens var thinking (72 tankeblock, xhigh) | [B, experiment] | ETT prototyp-pass på lägre effort; jämför väggklocka + utfall + grindar mot baslinjen | **omlandat 2026-07-24 → ett av nattbyggets pilot-fönster** (se Beslutsläge) |

**Avstyrkt (bokfört, ej tyst):** F5b "lätt-variant av session-start" —
ceremonin är ~1 min/pass vid flerpass-sessioner (amortering = F5a, redan
praxis) och är ADR-043/L67/L68:s drift-skydd; dok-födelsen fångade dessutom
en räknedrift i själva S83-starten (BUILD-LOG:s föråldrade L-räkning).
Granskningens § 5 bevarandevärden gäller oavkortat: async-disciplinen,
subagent-parallelliseringen och verifieringsambitionen optimeras INTE bort.

## F2 — utfall S88 (2026-07-25): dokument ja, verktyg nej

**Verktygs-halvan avstyrkt, öppet bokförd.** Förslaget var ett incheckat
parametriserat `scripts/proto-verify.mjs`. Kartläggningen av de faktiska
skripten (sex, inte fem — `3c95acf` på `proto/s83-18-18-19-eventvaljaren`)
visar att abstraktionen inte är motiverad:

- Gemensam kärna är **~16 rader bootstrap** (auth-state, viewport, felsamlare,
  screenshot). Allt annat är *påståendet*, och det var olika i varje skript:
  element-scopad screenshot · hover + computed style · URL-assertion efter
  combobox-val · print-media-emulering · loop över demo-anmälningar.
- Ett parametriserat skript hade behövt återexponera Playwrights API som
  CLI-flaggor.
- **Alla sex konsumenter är redan raderade** per throwaway-kontraktet ⇒
  över-engineering-vaktens "ingen abstraktion utan faktisk nuvarande
  användare" faller rakt av.
- Ett `scripts/`-skript är permanent kod under Biome + typecheck, som skulle
  betjäna efemära konsumenter.

**Miljöfakta-halvan levererad** som
[`docs/reference/prototyp-verifiering-runbook.md`](../../docs/reference/prototyp-verifiering-runbook.md)
— portkarta, 5173-vägran som design (task-5), auth-state, DEV-gejten, och den
bärande faktan som stod **ingenstans**: plain node + `chromium.launch()` läser
aldrig `playwright.config.ts`, vilket är hela skälet att ett pass kan koppla
upp mot Marcus levande 5173 utan att döda den.

**Uppgraderings-trigger** om ett senare pass faktiskt återanvänder bootstrappen
oförändrad: formen är en ~20-raders `withProtoPage(fn)`, aldrig en flagg-CLI —
och byggs då, inte i förväg.

**Överlappet mot [`T92`](README.md) punkt (a) — registrerad i tråd-registret,
inget eget kort än — är avfärdat med ett hårt faktum:** T92(a):s recept bygger på `vite preview`, alltså
produktionsbygge, där `import.meta.env.DEV` är falskt ⇒ `/dev/prototyper` finns
inte och `?variant=` är dött. **Preview-loopen kan aldrig bära ett
prototyp-pass.** Kraven är dessutom motsatta: T92(a) behöver isolation *från*
5173, F2 anslutning *till* den. Delad yta är exakt en artefakt —
miljöfakta-dokumentet. Ett dokument, två recept.

**Bifynd:** städkontraktet höll inte — sex `[DEBUG-S83]`-skript ligger kvar på
två proto-branch-tippar trots headern "Städas efter passet". Noterat i
runbookens § Städkontraktet.

## Beslutsläge

Marcus 2026-07-24: paketriktningen kvitterad ("bra förbättringsgrejer", tråd
beordrad; tråd-vs-T85-inbakning delegerad till Code → egen tråd). Per punkt:
F1b/F2/F3 mekaniska — exekveras utan vidare beslut i sina fönster; F1a/F4/F6
tas som små explicita Marcus-beslut vid respektive upptag.

**F6 — upptaget taget vid S83-resumen 2026-07-24, fönstret OMLANDAT.** Det
anvisade fönstret ("återstående S83-pass") föll på pass 4 (eventväljar-paret
18.18+18.19) — sessionens tyngsta kvarvarande designarbete: två kort, ny
komponentfamilj, A/B-val på 18.19. Code-rek: kör passet oförändrat och lägg
F6 på ett av nattbyggets pilot-fönster i stället, där utfallet mäts mekaniskt
mot skivans AC + grindar i stället för mot Marcus-omdöme i browsern —
experimentet blir jämförbart först när utfallsmåttet är objektivt. Marcus:
"vi skjuter på F6, kör oförändrat." Nytt fönster: nattbygget (T86 § Körplanen
punkt 4), fortfarande FÖRE T85-korrigeringssessionen.

## F6-mätningen (S86 nattbygget 2026-07-25 — rådata, slutsatsen är upptagets)

F6-fönstret föll på **task-18.16** (Code-förslag i batch-ordern, inget
Marcus-veto vid "go"): bygg-agenten kördes på effort **low**; batchens
övriga fyra byggen (default effort) är baslinjen. Mekaniskt utfall:

| Skiva | Effort | Bygg-väggklocka | Review-fynd (blocker) | CI första pass | Slutstatus |
|---|---|---|---|---|---|
| 18.16 (F6) | low | 28,7 min | 8 (0) | ja | Done |
| 18.15 | default | 28,1 min | 4 (0) | ja | REVIEW_READY |
| 18.17 | default | 73,6 min | 7 (1 korrekthet, pilot-fångad) | ja | Done |
| 18.18 | default | 89,8 min | 8 (0) | ja | Done |
| 18.19 | default | 79,5 min | 10 (0) | ja | Done |

Läsnot: skivstorlekarna är olika — närmast jämförbar i omfång är 18.15.
F6-skivan avvek inte i utfall (0 blocker, grön första pass, alla grindar,
Done) och låg i väggklocka i nivå med 18.15 trots scope-utökningen
(spec-§19-kodifiering + app-audit + 2 flippar). Full rådata:
sessionsdok S86 Del 2 + T86 § Pilot-loggen. Jämförelsen mot
Marcus-morgongranskningens escapes-facit återstår innan F6-beslutet tas.

## Relationer

[T85](T85-riskanpassad-ci.md) (samma processgransknings-genre;
korrigeringssessionen är F1b/F2/F3:s naturliga fönster) ·
[T86](T86-pocock-v11-integrationen.md) (S83-passen är körplanens punkt 2–3;
F6-fönstret ligger i dess återstående pass) · hub-skills `session-start` +
`prototype` (F1b/F4-bärare, ändring via hub-repo + plugin-bump).
