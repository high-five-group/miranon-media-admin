# Ett CI-jobb som checkar ut PR-headen ser aldrig basens fix: varken rerun eller stäng/återöppna hjälper, bara en ny head

**[UNIVERSAL] När en fix landar i `main` som ska göra väntande PR:er gröna
måste man veta VILKEN commit varje jobb kör mot. `gh run rerun --failed`
återanvänder händelsens ursprungliga merge-commit (gammal `main`), och
stäng/återöppna ger visserligen en färsk merge-ref men hjälper inte ett
jobb som checkar ut `pull_request.head.sha` — det ser fortfarande PR:ens
egen lockfile. Enda vägen är en ny head (`gh pr update-branch`), och för
kod-PR:er gör den nya headen granskningssektionen stale, så planera en
omstämpling.** Mätt 2026-09-17 (S125): efter att #2491 landat audit-fixen
gjorde rerun av #2490 (run 35202459345, attempt 2 kl 11:07Z) och sedan
reopen (run 35214576214) samma två advisories röda; `ci.yml` rad 2146 sätter
`AUDIT_HEAD_SHA: github.event.pull_request.head.sha`. Kostnad: två extra
varv över nio PR:er innan `update-branch` + omstämpling av fyra kod-PR:er.
Regel: läs jobbets checkout-ref i workflowen INNAN du väljer metod för att
få väntande PR:er gröna.
