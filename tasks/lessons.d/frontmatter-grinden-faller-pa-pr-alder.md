# Frontmatter-grinden (`updated:` mot `git log -1 --format=%cs`) kan fälla på en PR:s ÅLDER, och på mätning mitt i en ocommittad merge

**En docs-frontmatter-grind som jämför ett dokuments egna
`updated:`-fält mot dess senaste commit-datum (`git log -1
--format=%cs`) kan fälla av två orelaterade skäl som ser identiska ut
utifrån: (1) PR:en har legat öppen så länge att merge-referensens datum
hunnit gå om `updated:`-fältet, och (2) grinden mäts MITT I en
ocommittad merge — `git log` ser då ännu inte `main`s slutgiltiga
commit, vilket ger ett falskt rött resultat som försvinner så fort
mergen committas.**

**[UNIVERSAL]**

Instans (S112 resume 1, 2026-08-26, PR `#1932` ADR-127: grinden fällde
`docs/decisions/README.md — Check 2 (updated): '2026-08-24' driftar från
git log '2026-08-26'`; den falska rödan mitt i mergen var
`CONTRIBUTING.md '2026-08-24' vs '2026-08-23'`, borta efter merge-commiten): en docs-PR som legat två dygn
fick sitt merge-ref-datum att avvika från `updated:`-fältet, och en
mätning som kördes mitt i en ocommittad merge gav falskt rött innan
mergen committats.

**Det generella:** en grind som härleder "sanning" ur `git log` mäter
KOMMITTAT tillstånd — inte avsett, inte pågående. Två distinkta
felklasser döljer sig bakom samma symptom (rött): en genuin drift
mellan dokument och verklighet (åtgärdas genom att uppdatera
`updated:`), och ett mättillfälle som helt enkelt kom för tidigt
(åtgärdas genom att committa mergen FÖRST, mäta sedan). Att blanda
ihop dem riskerar antingen en onödig dokumentändring eller ett
bortförklarat äkta rött — committa mergen, mät sedan, är den billiga
disambigueringen.
