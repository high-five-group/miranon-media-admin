---
owner: marcus803
updated: 2026-08-31
review_by: 2026-11-30
status: stable
lifecycle: paused
---

# T179 — AFK-nattens orkestrerare körde in i den hårda kontextväggen

> Registrerad på Marcus explicita order (2026-08-31): S113:s AFK-nattsession
> körde in i kontextväggen och blev obrukbar mitt i pipeline. Detta kort är
> REGISTRERINGEN (durabel bokföring) — lösningsdesignen är ett senare
> grillnings-arbete; inga designbeslut är fattade här.

- **Tråd-ID:** `T179-afk-nattens-orkestrerare-korde-in-i-harda-kontextvaggen`
- **Tillstånd:** se frontmatter `lifecycle`
- **Källa:** transkriptet
  `~/.claude/projects/-Users-marcus-Repon-miranon-media-admin/7b50049b-9e1f-4832-91be-464781283091.jsonl`
  (Claude Code 2.1.251) — verifierat på disk 2026-08-31 (`ls -la`: 5 965 966
  byte ≈ 5,9 MB), analyserat av S114-orkestrerarens transkript-agent
  2026-08-31. Sekundärkälla: raderna nedan är återgivna från den analysen,
  utan egen radgranskning av transkriptet av den agent som skrev detta kort
  (uppdraget bedömde kostnaden att öppna 5,9 MB som ej motiverad för en
  ren registrerings-uppgift). Faktapaketets övriga påståenden (3–6) är
  verifierade separat mot disk/GitHub, se noter per punkt.
- **Besläktad:** [`T111`](T111-autonom-orkestrering-kontexttroskel.md)
  (autonom orkestrering, kontexttröskel, uppstod 2026-07-31, `paused`) —
  samma problemfamilj, annan incident.

## Vad som är mätt (alla tider UTC)

1. **Händelsen.** 2026-08-31T05:59:00.939Z (rad 2989 i transkriptet)
   levererades review-agentens task-notification för PR #2163
   (`TASK-346.9`) till nattorkestreraren. 73 ms senare (rad 2990) kom
   sessionens första `Prompt is too long`-fel (API `invalid_request`). Noll
   lyckade turer därefter — orkestreraren läste aldrig utlåtandet.
2. **Tomgångsloopen.** Heartbeat-monitorn (task `b2ppmsqca`, ~92 s
   intervall) fortsatte väcka den obrukbara sessionen — 71+ förgäves-
   väckningar på 1 h 41 min (05:59→07:38), varje väckning ett fullt
   API-anrop som föll på samma fel. Ingen backoff eller circuit-breaker
   finns i den kedjan.
3. **Auto-compact försöktes aldrig.** 0 auto-trigger i hela transkriptet —
   trots att `TASK-160.5` (tröskel-konfigen, zonen ~50 %, ADR-101 § Beslut
   2) är **Done** sedan 2026-08-08. Verifierat direkt 2026-08-31 (denna
   agent, `npx backlog task 160.5 --plain`): `Status: ✔ Done`, AC #1
   avbockad. **ÖPPEN MÄTFRÅGA:** varför fyrade den proaktiva tröskeln
   aldrig? Avgörs FÖRE designval nedan — svaret kan ändra hela
   designrymden.
4. **Manuellt `/compact` nekades.** Marcus `/compact` 2026-08-31T07:24:53Z
   nekades av `scripts/deny-precompact.sh` (ingen markörfil). Nekandet är
   KORREKT per ADR-101 — men vägen ut ("kör pre-compact-skillen FÖRST")
   kräver en fungerande modelltur, som sessionen inte hade. Detta är
   skriptets öppet bokförda kant: verifierat direkt 2026-08-31 (denna
   agent läste `scripts/deny-precompact.sh` § "VAD DEN INTE TÄCKER") — den
   beskriver exakt recovery-läget: en auto-compact som harnessen triggar
   för att återhämta sig från ett redan returnerat context-limit-fel
   behandlas identiskt med den proaktiva, tröskel-baserade varianten,
   eftersom fältet `trigger` bär samma värde `"auto"` för båda ("trigger:
   auto → neka ALLTID"). Kanten var känd sedan tidigare — denna natt är
   första gången den skarpt mättes.
5. **Skadebilden.** Nattens två sista granskningsutlåtanden (#2163 ·
   #2164, båda `risk.niva: hog`, båda blockerande) blev olästa. Verifierat
   direkt 2026-08-31 (denna agent, `gh pr view`): båda PR:erna står
   `state: OPEN`, `mergedAt: null` — ingen har landat. #2164:s utlåtande
   låg räddningsbart på disk (`review-utlatande-pr2164.json` i
   nattsessionens scratchpad); #2163:s fanns ENBART i transkriptet
   (granskaren städade sin temp-fil) och räddades ut i efterhand av
   S114-orkestreraren (validerat grönt mot schemat, `granskadSha` = PR:ens
   head).
6. **Vad som skyddade.** Allt landat arbete var redan durabelt —
   sessionsdok Del 12 committad t.o.m. våg 5-stängningen (05:01, PR
   #2162). Verifierat direkt 2026-08-31 (denna agent, `git log
   --oneline`): `548d1fc1 Merge pull request #2162 from
   high-five-group/docs/s113-natt-vag-5-stangning`. Förlusten begränsades
   till våg 6:s sluttillstånd + 1 h 41 min brända förgäves-anrop.

## Skadebild i klartext

En session som blir obrukbar MITT I PIPELINE förlorar inte bara sin egen
tur — den fortsätter att kosta (71+ väckningar) utan att kunna agera, och
de sista, mest riskabla besluten i natten (två `hog`-granskningar) är
precis de som riskerar att aldrig nå en läsare.

## Designrymd — KANDIDATER, inga beslut

a) Subagent-/review-agent-kontraktet: utlåtande skrivs ALLTID till fil,
   notifikationen bär sökväg + risknivå — aldrig fullt innehåll enbart
   inline. (Hade ensamt räddat natten: #2164:s fil-skrivning överlevde
   kraschen, #2163:s temp-fil-städning krävde transkript-räddning. Se
   lesson-fragmentet
   `tasks/lessons.d/subagent-leverabler-skrivs-till-fil-fore-retur-inte-bara-i-svaret.md`.)
b) Zonvakt i AFK-drift: kontextfyllnad mäts vid våggräns; pre-compact eller
   session-paus + färsk session som norm när zonen nåtts. Notera att
   pre-compact-skillens nisch är max EN kompaktering per session — en lång
   natt kan behöva paus/resume-rotation i stället.
c) Circuit-breaker i väckningskedjan: N konsekutiva väckningar som faller
   på samma fel → stoppa monitorn + extern signal.
d) Öppen mätfråga (punkt 3 ovan) avgörs FÖRE designval — svaret kan ändra
   hela designrymden.

## Nästa steg

Bärare: obestämd — grillas som eget pass (Marcus-order 2026-08-31). Detta
kort är enbart registreringen; inget av a–d ovan är beslutat.
