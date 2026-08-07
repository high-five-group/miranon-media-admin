---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T129 — Stagings mail-tak står på 2 per timme medan rundturs-e2e skickar inbjudningar — trolig framtida flake-källa i CI

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Stagings mail-tak står på 2 per timme medan rundturs-e2e skickar inbjudningar — trolig framtida flake-källa i CI.** Registrerad 2026-08-07 (S96) ur mall-deployens före/efter-diff — triage: blockerar ej, värdefullt, defereras (CLAUDE.md § Triage). **MÄTT:** staging `rate_limit_email_sent = 2`, prod `30` (höjt 2026-08-06 tillsammans med SMTP-fixen, Supabases dokumenterade default med custom SMTP). `TASK-127.9`:s rundtur skickar en användarinbjudan per körning, och 2026-08-06 gick två inom **25 sekunder** (`07:58:58` + `07:59:23`, Resend-loggen) — alltså exakt på taket. En tredje körning inom samma timme hade avvisats av GoTrue. **VARFÖR DET ÄR LÖMSKT:** felet syns i testet som ett auth-fel vid inbjudningssteget, inte som "rate limit" — samma diagnos-avstånd som `535`-felet i Del 17, där den verkliga orsaken bara fanns i plattformens logg och inte i vårt eget felmeddelande. **EJ ÅTGÄRDAD:** en höjning av stagings tak är en miljöändring och ska ses av Marcus först; den är dessutom en avvägning, eftersom ett lågt tak i staging är ett verkligt skydd mot att en trasig testrigg spammar. Besläktad: `TASK-127.9` (rundturen) · Del 17 (SMTP-fixen som avslöjade talen)

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad; miljöändring kräver Marcus)_
