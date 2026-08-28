---
id: TASK-137
title: MAIL-LÅS — mekaniskt förbud mot Resend-sändning innan resend-mcp installeras
status: Done
assignee: []
created_date: '2026-08-04 11:29'
updated_date: '2026-08-04 12:08'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 222000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MAIL-LÅSET — mekaniskt förbud mot att Code/agenter skickar mail via Resend, byggt och bevisat FÖRE `resend@claude-plugins-official` installeras.

Beslut: Marcus-GO 2026-08-04 (S96 Del 10, PR #689): Resend-plugin med MEKANISKT mail-lås byggt och bevisat FÖRE aktivering — Rogers krav — deny-regler + hook + nycklar utom räckhåll, aldrig prosa.

## Låsarkitekturen — tre lager

Lager 0 — nycklar utom räckhåll (PRAXIS, ej kod i detta kort). Resend-MCP:t installeras hostat/OAuth-autentiserat (samma mönster som claude.ai-connectorernas Airtable/Gmail/Calendar i denna miljö) — ingen API-nyckel läggs på disk eller i .env*. Ingen nyckel = ingen väg runt lagren nedan ens om de skulle brista. Installationsmomentet ägs av orkestreraren + Marcus, inte av detta kort.

Lager 1 — permissions.deny i .claude/settings.json (den garanterat fail-closed vägen). Anthropics egen hooks-dokumentation (code.claude.com/docs/en/hooks.md, hämtad 2026-08-04) säger rakt ut att om man behöver fail-closed-beteende ska man använda permission-systemet, inte hooks. Permission-systemet är därför förstahandsspärren, inte hooken. Deny-listan täcker de sänd-klassade Resend-MCP-verktygen i BÅDA namnformerna (fristående server mcp__resend__* samt plugin-bunden mcp__plugin_resend_resend__*, mönstret belagt i denna miljö via figma-pluginets mcp__plugin_figma_figma__*).

Lager 2 — PreToolUse-hook scripts/deny-resend-send.sh (dubbel botten). Fäller (a) Bash-kommandon som textuellt träffar Resends sänd-endpoints (api.resend.com/emails, api.resend.com/broadcasts, smtp.resend.com) och (b) samma MCP-sändverktyg som lager 1, som en andra, oberoende spärr. Config-driven via .mail-lock-policy.conf (endpoints + verktygsnamn + prefix som data, logiken universell).

Kritisk mekanik-detalj (verifierad mot förstapartsdokumentationen, inte antagen): en PreToolUse-hook i Claude Code är FAIL-OPEN by design om den kraschar. Dokumenterat exit-kod-kontrakt: exit 0 → verktygsanropet fortsätter (stdout-JSON med permissionDecision läses); exit 2 → verktygsanropet BLOCKERAS ALLTID (stderr blir skälet modellen ser, stdout ignoreras); allt annat nollskilt exit → verktygsanropet fortsätter (fail-open), även om hooken kraschat på saknad jq, timeout eller trasig JSON. Källa: code.claude.com/docs/en/hooks.md § exit-kod-tabellen. scripts/deny-resend-send.sh avviker DÄRFÖR medvetet från deny-sweeping-git-add.sh:s konvention (som failar ÖPPET om jq saknas — rimligt för en arbetsflödesnudge, inte för Rogers hårda krav): varje nekande väg i detta skript slutar i explicit exit 2, aldrig i JSON+exit 0, och varje internt fel (saknad jq, tom/trasig stdin, saknad policyfil) NEKAR också — genuint fail-closed, inte bara till namnet.

## Öppen rest (skarpbevis kräver laddad session — ägs av orkestrerare + Marcus)

Namnen är overifierade mot faktiskt enumererade verktyg. Pluginet är AVSIKTLIGT inte installerat än. Deny-listan och hook-configen är byggda mot källkoden i resend/resend-mcp (GitHub, commit 037c9b15f00ef4aafe3361ab3c7617ec900bd02a, src/tools/*.ts, registerTool(...)-anropen), inte mot en levande MCP-session. Plugin-prefixet mcp__plugin_resend_resend__ är en HYPOTES byggd på figma-precedenset — måste re-verifieras när pluginet faktiskt är installerat och verktygen syns i en riktig sessions deferred-tools-lista.

Skarpt bevis att låset håller mot en RIKTIG MCP-session kräver att pluginet är installerat och en session laddad — det momentet ägs av orkestreraren tillsammans med Marcus, INTE av detta kort.

CI-inwiring av testsviten är INTE gjord (uppdraget sa uttryckligen: registrera frågan här, wire inte in utan explicit AC).

## Sänd-klassificeringen — vad som nekas och varför

Alla resend-mcp-verktyg vars namn börjar med send- (fyra stycken, uttömmande enumererat mot källkoden): send-email, send-batch-emails, send-broadcast, send-event. De tre första är uppenbara. send-event är mindre uppenbart — det avfyrar ett event mot en kontakt som kan trigga en Automation, vilket är en INDIREKT väg till att riktig e-post går ut; namnet matchar dessutom send--mönstret rakt av. Inkluderad medvetet, fail-closed-hållning.

Medvetet INTE nekat: create-broadcast/update-broadcast/list-broadcasts/get-broadcast/remove-broadcast/compose-broadcast (utkast utan sändning), cancel-email/update-email (kontrollerar/avbryter ett REDAN schemalagt mail — ingen ny sändningsväg), samt alla domän/DNS/kontakt/mall/segment/webhook/logg/API-nyckel-läs- och adminverktyg (behövs för Grind 0 och normalt Resend-arbete).

Registrerad öppen fråga (ADR-053-triage: blockerar ej, värdefull — defer): ska create-automation/update-automation också räknas sänd-klassade, eftersom en automation kan skicka riktig e-post autonomt till riktiga kontakter senare, utan ett explicit send--anrop? Uppdragets egen definition (send/broadcast/schedule/batch-email-verktyg) nämner inte automations, så de är INTE nekade i denna leverans — men risken är reell och bör vägas av Marcus vid installationsmomentet.

## Källor

github.com/resend/resend-mcp @ 037c9b15f00ef4aafe3361ab3c7617ec900bd02a, src/tools/*.ts — samtliga registerTool(...)-anrop läst i sin helhet (17 filer, ~90 verktyg).
code.claude.com/docs/en/hooks.md — exit-kod-kontrakt, matcher-syntax.
code.claude.com/docs/en/permissions.md — deny-regler accepterar glob i verktygsnamn; connector-verktyg heter mcp__claude_ai_<server>__<tool>.
tasks/sessions/archive/2026-08/2026-08-02-session-96.md Del 10 — Marcus-GO-citatet.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 permissions.deny i .claude/settings.json listar alla sänd-klassade Resend-MCP-verktyg (send-email, send-batch-emails, send-broadcast, send-event) i båda namnformerna (mcp__resend__* och mcp__plugin_resend_resend__*) — diffen rör ENDAST nya nycklar, inga befintliga hooks/permissions ändras
- [x] #2 scripts/deny-resend-send.sh finns: fail-closed PreToolUse-hook (exit 2 på varje nekande väg, aldrig bara JSON+exit 0) som nekar Bash-kommandon mot Resends sänd-endpoints (api.resend.com/emails, api.resend.com/broadcasts, smtp.resend.com) OCH samma MCP-sändverktyg som AC1, config-driven via .mail-lock-policy.conf
- [x] #3 scripts/test-deny-resend-send.sh bevisar båda riktningarna: planterade sänd-formade inputs (Bash + MCP, båda prefixformerna) NEKAS (exit 2); legitima inputs (domän/DNS/läs-MCP-verktyg, vanlig curl, gh-kommandon) SLÄPPS (exit 0) — körd och rapporterad med faktiskt utfall, ej wired in i CI
- [x] #4 Kortets Description bokför hela låsarkitekturen (lager 0-2) inkl. källmärkning mot resend-mcp-källkoden och Anthropics hooks/permissions-dokumentation, samt den öppna resten (post-installations-reverifiering, automations-frågan)
- [x] #5 Premiss-pass (ADR-086) redovisat i slutrapporten: verktygsnamnen källmärkta mot faktisk källkod (inte antagna), nästa kortnummer verifierat mot disk, settings.json:s faktiska struktur läst före ändring
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #697 (merge-SHA 135a659f), landad på main. CI grön per jobb (CI Passed or Skipped, CodeQL, Docs link check, Lint+Audit+TypeCheck, CodeQL-analyze x2, Test suite: Acceptance/Pure+Build/Webblasarbeteende pass, A11y/Staging/sentinel-purge korrekt skippade). Tre-lagers mail-lås byggt: permissions.deny (lager 1, fail-closed förstahandsspärr) + PreToolUse-hook scripts/deny-resend-send.sh (lager 2, dubbel botten, exit 2 på varje nekande väg inkl. interna fel) config-driven via .mail-lock-policy.conf. scripts/test-deny-resend-send.sh bevisar tvåsidigt (26/26 tester, fail-closed-riktning + legitima verktyg släpps). AC 1-5 avbockade. ÖPPEN REST kvar, ägd av orkestrerare+Marcus: plugin-prefixformen mcp__plugin_resend_resend__ är en HYPOTES byggd på figma-precedens — kräver post-installations-reverifiering mot en riktig laddad session när resend-mcp faktiskt installeras (nycklarna hålls utanför disk/.env, hostat/OAuth). Automations-frågan (ska create/update-automation räknas sänd-klassade) är registrerad som öppen ADR-053-triage-fråga, ej avgjord i denna leverans.
<!-- SECTION:FINAL_SUMMARY:END -->
