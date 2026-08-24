---
id: TASK-194
title: >-
  Facit-hooken nekar varje edit mot ett stämplat manifest, inte bara
  godkand-skrivningar
status: Done
assignee: []
created_date: '2026-08-10 18:29'
updated_date: '2026-08-24 14:42'
labels:
  - grind
  - facit
  - hook
dependencies: []
ordinal: 359000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hooken deny-facit-godkand-skrivning.sh låser en övergång som ADR-103:s promoveringsform KRÄVER, och den låsningen träffar varje framtida promovering.

MEKANISMEN (verifierad i koden, S103 2026-08-10): scripts/lib/facit-godkand-skrivning.mjs frågar harIckeNullGodkandEfterEdit(...) — alltså om RESULTATET har ett icke-null godkand, inte om ändringen RÖR fältet (rad 103/111: harIckeNullGodkand(content) resp. harIckeNullGodkandEfterEdit). Följden: varje Edit/Write/Bash mot ett redan stämplat manifest nekas, oavsett vilket fält agenten tar i.

LÅSNINGEN, konkret: manifestets ytor[].kallor måste peka på filer som FINNS (facit-validera.mjs kräver existsSync). Före stämplingen är det prototyp-filen. Rivningen (ADR-103 B2 steg 4) byter namn på den — PersonsListPrototyp.tsx blev PersonsList.tsx i S103 — och då MÅSTE kallor uppdateras, annars är check-facit.sh röd. Ingen agent kan utföra den övergången. S103 fastnade skarpt: Marcus fick köra en sed-rad via !-kanalen för att flytta EN sökväg.

VARFÖR DET ÄR EN BUGG OCH INTE AVSIKTEN: ADR-104:s beslut 2 säger att agenter aldrig SÄTTER godkand. En edit som lämnar fältet byte-identiskt sätter det inte. Kanalseparationen är intakt om jämförelsen sker före/efter i stället för på resultatet.

INGEN PRECEDENT ATT LUTA SIG MOT: S102:s rivning i #1133 (PrototypRigg) rörde inget facit-manifest — den uppdaterade en aria.yml-referens. Väggen är alltså oprövad före S103.

RISKEN MED FIXEN, som ska adresseras i bygget: en delta-jämförelse får INTE öppna för att agenten skriver godkand genom att först sätta det till null och sedan till ett värde i två steg, eller genom replace_all-trick. Tvåsidig testsvit krävs — hooken ska fortfarande neka varje FAKTISK sättning, inklusive heredoc/sed/jq-vägarna Kanal B täcker i dag.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hooken jämför godkand FÖRE mot EFTER och nekar endast när fältet faktiskt ändras
- [ ] #2 En edit mot ett stämplat manifest som lämnar godkand byte-identiskt SLÄPPS IGENOM (t.ex. en kallor-sökväg efter rivningens filnamnsbyte)
- [ ] #3 Hooken nekar fortfarande varje faktisk sättning av godkand via Edit, Write OCH Bash (heredoc/redirect/sed/jq), inklusive tvåstegs-försök via null
- [ ] #4 Tvåsidig testsvit: både nekade och släppta fall, med det skarpa S103-fallet (kallor-flytt efter rivning) som positivt test
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-194 — EJ IMPLEMENTERAD. PREMISSEN ÄR SUPERSEDAD AV ADR-102 § Updates 2026-08-22 (bygg-agent, Sonnet 5, 2026-08-24). Ingen kod ändrad; detta är en dokumentations-only-landning som registrerar fyndet per ADR-086 (premiss-passet).

PREMISS-PASSET (körd FÖRE design, ADR-086). Uppdraget bad om en delta-jämförelse (godkand FÖRE/EFTER) i scripts/deny-facit-godkand-skrivning.sh + scripts/lib/facit-godkand-skrivning.mjs, med kortets AC#1/#2 som mål, och angav att kortet blockerar TASK-241.7 och TASK-243.5. Innan bygge lästes hooken, ADR-102 i sin helhet och de två utpekade blockerade korten. Båda de faktapåståenden kortet/uppdraget vilar på visade sig vara FALSIFIERADE av senare landad arkitektur.

1. KORTETS MOTIVERANDE EXEMPEL (S103:s kallor-flytt efter rivning) ÄR REDAN LÖST — via en ANNAN mekanism än kortets AC ber om. ADR-102 § Updates 2026-08-22 "Rivna prototyp-källor: invariant (b):s rivnings-klausul" (R1) lade en git-härledd invariant i scripts/lib/facit-validera.mjs (fannsVidStampeln, rad 247) + scripts/check-facit.sh: en kallor-sökväg som saknas på disk i ett STÄMPLAT manifest accepteras UTAN manifest-edit om filen fanns i stämpel-commitens träd (godkand.sha) och är riven därefter. Ingen skrivning mot manifestet krävs alls längre.

   EMPIRISKT VERIFIERAT (denna session, 2026-08-24, i egen worktree, återställt efteråt): flyttade undan samtliga sex källor i tasks/sessions/bilagor/s102-svep-konvergens/facit.json (TASK-241.7:s yta) och samtliga sex källor i s102-hem-konvergens/facit.json (TASK-243.5:s yta), körde bash scripts/check-facit.sh — exit 0 BÅDA gångerna, varje riven fil uppräknad som "NOT: … riven efter stämpeln <sha>" (10dff531 resp. 8044e5b6). git status --short tomt efter återställning.

2. UPPDRAGETS BLOCKERINGS-PÅSTÅENDE ÄR DÄRMED FALSIFIERAT FÖR FACIT-HOOK-DELEN. TASK-241.7:s egen Implementation Notes-blockering (mätt 2026-08-17, "SEX fel … kallor … som inte finns") föregår R1-fixen (2026-08-22) och är omsprungen — grinden släpper nu igenom rivningen utan att kallor rörs. ADR-102 § Updates R5 säger det rakt ut: "De fyra kvarvarande rivningarna är avblockerade utan att något manifest behöver röras — hem, svep, segment och hållplats." TASK-243.5 har KVAR en egen, orelaterad blockering (svep-routens src/routes/dev/svep-prototyp.tsx importerar ur hem-prototypkatalogen, dess egna Implementation Notes 2026-08-17) — ett kod-beroendeordnings-beslut (241.7 före 243.5, eller ompekning av importen), INTE en facit-hook-fråga. TASK-194 rör inte den blockeringen.

3. KORTETS EGEN AC-ANSATS (AC#1/#2: smalna av hooken via delta-jämförelse, släpp igenom byte-identiska godkand-editer) MOTSÄGS EXPLICIT AV EN SENARE, ACCEPTED ARKITEKTURBESLUT. ADR-102 § Updates 2026-08-22 "Amenderings-mekaniken för ett STÄMPLAT facit" (T157) § A3, verbatim: "Ett stämplat manifest är agent-fruset i SIN HELHET… Bredden är hookens egen, medvetna design (dess § HELLRE FÖR BRETT ÄN FÖR SMALT) och rivs INTE här." Beslutet valde MEDVETET en annan väg: legitima ändringar av ett stämplat manifest bokförs i en sidofil (AMENDERING-<datum>-<slug>.md) i stället för att öppna manifestet för agent-edits, med en tvåstegs klassning (b)/(c) där en agent föreslår och Marcus/orkestreraren dömer (A2). Kortets egen motivering ("VARFÖR DET ÄR EN BUGG OCH INTE AVSIKTEN") är alltså numera motsagd ordagrant av den nyare ADR-texten, som kallar exakt samma bredd "hookens egen, medvetna design".

4. ADR-102 SJÄLV KÄNNER TILL TASK-194 OCH LÄMNAR DESS ÖDE UTTRYCKLIGEN ÖPPET. § Updates "Rivna prototyp-källor" § R5 tredje punkten, verbatim: "Rivnings-skivan behöver inte längre röra kallor efter en rivning, och därmed inte heller kringgå ADR-104-hooken som 570c5951 gjorde. Det avgör INTE TASK-194:s öde — kortet bär mer än detta fall — men det tar bort kallor-trycket ur det." ADR-uppdateringens författare hade alltså TASK-194 i åtanke och lämnade frågan om kortets vara-eller-inte-vara explicit olöst.

VARFÖR AC#1/#2 INTE BYGGDES ÄNDÅ (STOPPA-OCH-FLAGGA, inte ett scope-beslut på eget bevåg). Att smalna av hooken enligt kortets AC hade direkt återinfört den bredd ADR-102 A3 uttryckligen valde bort — det är en reversering av ett Accepted arkitekturbeslut, inte en bugg-fix inom givet scope. Valet mellan (a) stänga TASK-194 som superseded av ADR-102, (b) skriva om kortets AC mot den sidofils-mekanism ADR-102 redan valt (t.ex. om något täcknings-hål ändå kvarstår i AMENDERING-mekaniken — se ADR-102 § Updates A6, öppna luckor: klass (b)/(c) är konvention utan spärr, referenser-täckningen är 0/22 vid ADR-postens skrivning), eller (c) ett explicit beslut att riva ADR-102 A3 och bygga kortets ursprungliga delta-ansats ändå — är Marcus/orkestrerarens att fatta, inte bygg-agentens.

VAD SOM ÄR OFÖRÄNDRAT: scripts/deny-facit-godkand-skrivning.sh, scripts/lib/facit-godkand-skrivning.mjs — noll rader ändrade i detta pass. Ingen AC nedan är avbockad: AC#3 beskriver befintligt, redan verifierat beteende (ingen ny mekanism byggd för den); AC#1/#2/#4 förutsätter en mekanism (delta-jämförelse) som INTE byggdes eftersom den skulle strida mot ADR-102 A3 — att bocka dem hade intygat ett arbete som aldrig utfördes.

ÖVRIGT: kortet bär inte labeln "ready-for-agent" (Labels: grind, facit, hook) trots att uppdragstexten beskrev det som ready-for-agent — status är "To Do" utan dependencies, så det var ändå plockbart. Mindre avvikelse, bokförd för fullständighetens skull.

REKOMMENDATION: Marcus/orkestreraren avgör kortets vidare öde mot underlaget: docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md § Updates 2026-08-22 (båda posterna, särskilt A3 och R1/R5), tasks/threads/T157-adr-102-saknar-amenderings-mekanik-for-stamplat-facit.md (stängd 2026-08-22, samma fråga för det generella fallet).

STÄNGNING 2026-08-24 (S112 mandatpasset). Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112: kortet stängs som superseded av ADR-102 § Updates 2026-08-22 — beslutspunkt (a) ur föregående bygg-agents egen REKOMMENDATION ovan (2026-08-24, samma dag). ADR-102 § Updates A3 valde uttryckligen en ANNAN mekanism (AMENDERING-<datum>-<slug>.md-sidofiler) för legitima ändringar av ett stämplat manifest i stället för att smalna av hooken (kortets AC#1/#2-ansats); R1/R5 löste dessutom kortets motiverande exempel (S103:s kallor-flytt efter rivning) via en git-härledd rivnings-klausul (fannsVidStampeln) UTAN att manifestet någonsin behöver röras. Att bygga kortets ursprungliga AC hade återinfört den bredd ADR-102 A3 medvetet valde bort — en reversering av ett Accepted arkitekturbeslut, inte en bugg-fix. Kvarvarande täckningsluckor (referenser-fältets 0/22-täckning för stämplade ytor, ADR-102 § Updates A6) bor i TASK-297 (Facit-regimernas täckning: kartlägg 27 stämplade ytor) — verifierat att TASK-297 AC#4 uttryckligen äger just detta ('24 av 27 ytor saknar referenser-fältet och är inte sha256-låsta — beslut om fältet ska vara obligatoriskt'). Ingen AC nedan bockas: arbetet AC#1/#2/#4 kräver (delta-jämförelse-mekanismen) byggdes aldrig, eftersom det hade motsagt ADR-102; AC#3 beskriver redan existerande, oförändrat beteende. Att bocka någon AC hade intygat ett arbete som aldrig utfördes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd 2026-08-24 (S112 mandatpasset, Marcus-mandat/GO) som superseded av ADR-102 § Updates 2026-08-22. Ingen kod ändrad — scripts/deny-facit-godkand-skrivning.sh och scripts/lib/facit-godkand-skrivning.mjs orörda. Kortets AC-ansats (smalna av hooken via delta-jämförelse) motsägs av ADR-102 A3:s medvetna designval (AMENDERING-sidofiler i stället). Kvarvarande täckningsluckor spårade i TASK-297.
<!-- SECTION:FINAL_SUMMARY:END -->
