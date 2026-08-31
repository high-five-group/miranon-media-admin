# Subagent-leverabler skrivs till fil FÖRE retur — aldrig enbart i svarstexten

**[UNIVERSAL] En subagents slutrapport som ENDAST returneras inline i sitt
svar är en efemär artefakt — den finns bara så länge orkestrerarens egen
tur kan läsa den. Skriver agenten i stället sin durabla leverabel
(granskningsutlåtande, mätdata, rapport) till fil FÖRE retur och låter
notifikationen bära SÖKVÄGEN — och t.ex. risknivån — i stället för hela
innehållet, överlever leveransen även om orkestrerarens nästa tur aldrig
kommer.** Mätt kontrastivt i samma natt (S113→S114, 2026-08-31, `T179`):
review-agenten för PR #2164 skrev sitt utlåtande till disk
(`review-utlatande-pr2164.json` i sin scratchpad) innan den returnerade —
filen överlevde kraschen som följde 73 ms efter nästa notifikation, och
kunde läsas tillbaka av en senare session. Review-agenten för PR #2163
gjorde tvärtom: städade sin temp-fil innan retur. När orkestrerar-sessionen
sedan aldrig fick en läsande tur (samma kontextvägg, se `T179`) fanns det
utlåtandet ENBART kvar i transkriptet — och fick räddas ut i efterhand av
nästa sessions orkestrerare (validerat grönt mot schemat, `granskadSha`
matchade PR:ens head; hade transkriptet saknats eller varit oläsbart hade
utlåtandet varit förlorat). Regel: en subagents durabla leverabel — inte
dess statusrapport, utan resultatet orkestreraren ska AGERA på senare —
skrivs till fil innan agenten returnerar. Notifikationen/svaret bär
sökvägen (plus valfri kort sammanfattning som risknivå), aldrig hela
innehållet som enda kopia. Källa:
`tasks/threads/T179-afk-nattens-orkestrerare-korde-in-i-harda-kontextvaggen.md`.
