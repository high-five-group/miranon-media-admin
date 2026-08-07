---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T96 — Systemmeddelande-taxonomin — Marcus-order ur två skärmavbilder (S87). …

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Systemmeddelande-taxonomin — Marcus-order ur två skärmavbilder (S87). Båda visade samma yta: `AppErrorBoundary`-fallbacken, som renderar som naken brödtext därför att komponenten är MEDVETET beroende-snål (inline-stilar utan tokens, "ska rendera även när designsystemet är trasigt") medan Tailwind Preflight alltid laddas och nollställer knappen. Men den verkliga bilden är större: appen har EN meddelande-primitiv (`MessageBox`, ~48 call-sites i 27 filer, 41 av 47 `intent="error"`), **noll toast-lager** — seende användare får ingen synlig bekräftelse där skärmläsare får 17 `alertScreenReader`-anrop — ad hoc-tomtillstånd på minst 9 ställen, och TVÅ governing-dokument som uttryckligen förbjuder rubriken "Något gick fel" som båda fel-lagren bär. Kontrasten håller (5,1–7,8:1); problemet är att meddelande-systemet aldrig fått en designad grammatik: 3 av 4 bakgrundstoner är råa Tailwind-defaults, radien är 4 px i en app där kort kör 16 px, ingen ikon-bärare, ingen emphasis-dimension trots att §19 etablerat den. Föreslagen form: fem-lagers taxonomi + `§20` i DESIGN-SYSTEM-SPEC, prototyp-pass först (frågan är visuell). **KROCK-VILLKOR: får inte starta medan Personer-konvergensen är i luften** — MessageBox rör 27 filer inklusive `src/components/persons/`

**Ursprunglig Ingång-cell:**
_(inget kort än); uppstod S87-spaningen, [`bilagor/s87-spaning/a8-systemmeddelanden-design.md`](../sessions/bilagor/s87-spaning/a8-systemmeddelanden-design.md) — bär web-research mot React Aria, GOV.UK, USWDS, Polaris, M3, FK och Soueidans live-region-regler. Överlappar `T77` (notis-centret — samma systemröst, får inte få konkurrerande form) och `T90` (laddupplevelsen). Toast-lagret passerar ADR-baren om det införs_
