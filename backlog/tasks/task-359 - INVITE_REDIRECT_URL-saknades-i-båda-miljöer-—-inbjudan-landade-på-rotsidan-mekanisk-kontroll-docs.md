---
id: TASK-359
title: >-
  INVITE_REDIRECT_URL saknades i båda miljöer — inbjudan landade på rotsidan;
  mekanisk kontroll + docs
status: Done
assignee: []
created_date: '2026-09-02 08:03'
updated_date: '2026-09-02 12:20'
labels:
  - ready-for-agent
dependencies: []
ordinal: 661000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND: INVITE_REDIRECT_URL saknades i BÅDA Supabase-projekten fram till 2026-09-02. supabase/functions/invite-user/index.ts:260 normaliserar tomt till undefined, ingen redirectTo skickas (rad 269), Supabase faller tillbaka på projektets bara site_url (https://admin.miranon.dev, config.toml rad 459) UTAN sökväg — accept-sidan är /valkommen. Konsekvens: inbjudningslänken landade på rotsidan och hoppade över lösenordssteget. Åtgärdat 2026-09-02 av orkestreraren (S113 resume 8, Marcus-order): variabeln satt i BÅDA Supabase-projekten (staging + prod, se .prod-ref-policy.conf för refer), verifierat i båda via matchande sha256-digest (9b7efb779ddeb80236ff89f3e4aaadf275e86d0ccc2410a2091a59406373330c) mot printf https://admin.miranon.dev/valkommen. TASK-270 (Done 2026-08-17) hade bokfört frågan som KVARSTÅENDE ROBUSTHETS-FRÅGA, INTE BLOCKERANDE (deferrad) — denna skiva stänger den deferrade frågan mekaniskt så avsaknaden aldrig missas igen. Detta kort bygger den mekaniska kontrollen i scripts/fas4-prod-deploy.sh --kontrollera (en config-driven uppräknad mängd krävda hemlighets-namn, ✓/✗ per namn, exit ≠0 vid saknad post) plus tvåsidigt test och docs-rättelser (atkomst-och-nycklar.md, prod-driftsattning-betalningsflodet-runbook.md § Steg 5 return_message-påståendet, TASK-270 notes).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 --kontrollera skriver en ✓/✗-rad per krävd hemlighet ur en config-fil och avslutar ≠ 0 när någon saknas
- [x] #2 Tvåsidigt test i scripts/test-fas4-prod-deploy.sh (finns → grön, saknas → röd)
- [x] #3 Varje krävt namn är belagt med en Deno.env.get-läsning i supabase/functions/**
- [x] #4 Åtkomstregistret + betalningsflödets runbook § Steg 5 rättade per premiss 2 och 5; TASK-270 bär notes-raden
- [x] #5 DoD + testsvit + check:docs + långa-streck + shellcheck gröna, utfall verbatim
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit fc91f0be · PR #2206 (MERGED 2026-09-02T09:03:34Z) · CI-run-familjen grön (Lint+Audit+TypeCheck inkl. shellcheck-strict, Pure+Build, Acceptance ×2, Webblasarbeteende, Docs link, CodeQL — samtliga SUCCESS). Verifierat mot origin/main HEAD 59c3f7e3 vid denna Done-flippbatch: scripts/fas4-prod-deploy.sh --kontrollera anropar scripts/kontrollera-hemlighets-namn.sh mot .hemlighets-namn-policy.conf (10 krävda namn, INVITE_REDIRECT_URL först), skriver ✓/✗ per namn, HEMLIGHETER_NAMN_OK styr exitkoden (AC1) · tvåsidigt test i scripts/test-fas4-prod-deploy.sh (fall 18-22) — kört, 26/26 gröna (AC2) · varje krävt namn grep-verifierat mot en Deno.env.get-läsning i supabase/functions/** (AC3) · docs/reference/atkomst-och-nycklar.md + prod-driftsattning-betalningsflodet-runbook.md § Steg 13 bär den rättade raden (AC4) · shellcheck --severity=style --enable=all på berörda skript exit 0 lokalt, CI:s egen 'Lint + Audit + TypeCheck'-jobb (som kör exakt samma shellcheck-strict-steg) SUCCESS på fc91f0be (AC5). Prod-verifikat (källa: sessionsdok tasks/sessions/2026-08-29-session-113.md Del 16 + § PAUSLÄGE paus 9 → Paushistorik): INVITE_REDIRECT_URL satt i BÅDA Supabase-projekten, sha256-digest 9b7efb779ddeb80236ff89f3e4aaadf275e86d0ccc2410a2091a59406373330c matchar <https://admin.miranon.dev/valkommen> i båda. OBETALT/ej mätt av mig: det fullständiga ände-till-ände-beviset (en riktig inbjudan som faktiskt landar webbläsarens Location på /valkommen) är ett Marcus-moment — ingen agent-körd E2E-verifiering av detta finns bokförd i kortet eller sessionsdoket, endast digest-matchningen mot den avsedda URL:en. Landning: PR #2206. Avvikelse: ingen övrig.
<!-- SECTION:FINAL_SUMMARY:END -->
