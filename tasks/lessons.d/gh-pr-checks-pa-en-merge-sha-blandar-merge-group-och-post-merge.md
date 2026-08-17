# `gh pr checks` på en merge-SHA blandar merge_group-runs med post-merge-runs — klassa på merge_group

**Samma SHA bär två olika sorters körningar: `merge_group`-runnen som
avgjorde om posten fick landa, och post-merge-runnen som kör på `main` efteråt.
Frågar man verktyget om "checks" för den SHA:n kommer båda tillbaka blandade,
och en röd post-merge blir då oskiljbar från en röd landningsgrind. Vill du
veta om den PUSHADE COMMITEN var grön — klassa på `merge_group`-runnen, inte
på main-runnen.**

Instans (S102, 2026-08-17, DoD-driftsvepet i PR **#1508**): agenten som
korsverifierade 24 driftande DoD-poster hittade blandningen när CI-instrumentet
användes som belägg för att "pushad commit var grön" på åtta kort. Bokfört som
lesson-kandidat i Del 16-skörden, och den tolkningsburna bockningen redovisades
öppet i PR-beskrivningen för Marcus fällning.

**Det generella:** de två runnerna svarar på olika frågor. `merge_group` svarar
"fick den här diffen landa?" — det är landningsgrinden. Post-merge svarar "är
`main` frisk nu?" — ett rött utfall där kan lika gärna komma från en annan
post i samma batch, eller från en drift-detektor som inte har med diffen att
göra. Att blanda dem ger både falska underkännanden och falska godkännanden,
beroende på vilken som råkar läsas först.
