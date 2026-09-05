# Eventets `base.sha` är stale mot merge-refens bas när main rör sig

**[UNIVERSAL] `pull_request.base.sha` fryses vid EVENTET, men checkouten
(`refs/pull/N/merge`) byggs mot main vid CHECKOUT-tid — ett skript som diffar
mot `base.sha` ser main:s mellanliggande commits som om de vore PR:ens egna
ändringar.** Mätt run `33869798369` (PR `#2316`, 2026-09-04): eventets
`base.sha` var `21a76d6b`, men checkoutens faktiska merge-bas var `72bbeb80`
— emellan de två landade `c3008757` och lade en rad i `package.json`. En
lockfile-diff mot det stale `base.sha` såg alltså en ändring som inte hörde
till PR:en. Rätt bas är merge-commitens FÖRSTA FÖRÄLDER, läst med `git
cat-file commit HEAD` — INTE `git rev-list --parents`/`git log --format=%P`,
som ger NOLL föräldrar i en `--depth=1`-klon eftersom merge-commiten där är
shallow-boundary och git graftar bort dess föräldrar (mätt i fixtur,
`scripts/test-audit-degradering.sh` T21). Rå objekt-läsning (`cat-file`) går
förbi graftningen; de graf-traverserande formerna gör det inte.
