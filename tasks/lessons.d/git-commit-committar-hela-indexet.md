# `git commit` committar hela indexet, inte det du senast lade till

**Ett tidigare svepande `git add` förorenar en senare, till synes path-scopad,
commit. Scopet sitter i indexet — inte i den sista `add`-raden.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** ett svepande tillägg låg kvar i indexet när en
senare commit gjordes med en noggrant path-scopad `git add`. Commiten tog med
allt som låg i indexet, inklusive det tidigare svepet. Kommandoraden såg
disciplinerad ut; resultatet var det inte.

Detta är varför husets regel är **path-scopad `git add`, hub och spoke i separata
commits** — och varför `git add -A` är mekaniskt spärrad i `settings.json`
`permissions.deny`. Spärren tar det vanligaste fallet, men inte ett svep som
redan hunnit landa i indexet.

**Motmedlet är `git status --short` före `git commit`, varje gång.** Inte
`git diff` — den visar arbetsträdet, inte indexet. En rad output som inte hör
till commiten är hela signalen, och den kostar en tool-call.
