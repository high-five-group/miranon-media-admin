# Omstämpling av en granskad PR efter `update-branch`: bevisa diff-identitet mekaniskt, bär fynden oförändrade

**En merge av `main` in i en färdiggranskad PR ger ny head och stale
sektion. Rätt form är inte en ny adversarial granskning och inte en
handredigerad SHA, utan en granskare i färsk kontext som (1) verifierar att
nya headen är en merge-commit med `origin/main` som andra förälder, (2)
visar att tre-punkts-diffen mot `main` är byte-identisk före/efter, (3)
grep:ar konfliktmarkörer, och (4) utfärdar ett utlåtande runda+1 som bär
föregående rundas fynd och risk oförändrade plus ett `info`-fynd som
bokför omstämplingen.** Mätt 2026-09-17 (S125): fyra PR:er (#2474, #2495,
PR #2497, #2498) omstämplade i ett agentpass på ~15 min; loop-beslutet gav
exit 20 på #2474 (bärd warning vid rundtak) och #2498 (bärd hög risk) —
båda redan avgjorda av Marcus på identisk diff, bokfört i PR-kommentar
före armering. Avarmera kod-PR:erna (eller sätt draft) under tiden, annars
konsumeras armeringen på backstoppen i kön.
