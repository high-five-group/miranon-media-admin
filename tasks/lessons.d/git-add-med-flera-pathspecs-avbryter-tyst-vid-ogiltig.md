# `git add` med flera pathspecs kan lämna hälften ostagat när en pathspec är ogiltig — verifiera committens INNEHÅLL, inte dess existens

**Ett `git add` som får flera pathspecs där en inte matchar (t.ex. en sökväg
som just försvunnit i ett `git mv`) kan avbryta innan senare pathspecs
processats — committen som följer ser lyckad ut men bär bara halva
ändringen. Stage:a en pathspec i taget, och verifiera efter commit att
innehållet är det avsedda (`git show <sha>:<fil>` mot arbetsträdet).**
`[UNIVERSAL]`

Två mätta instanser samma natt (2026-08-14/15, S103): (1) TASK-214.7 —
`git add` med gamla filnamnet (borta efter `git mv`) + nya; kommandot föll
på den första och den andra stagades aldrig; committen `570c5951` saknade
rename-filens innehållsändringar. Fångat av agentens egen post-commit-
verifiering (`git show` mot working tree), rättat i `27303f60` FÖRE push,
alla grindar omkörda mot rätt HEAD. (2) TASK-214.7:s kort-notes — samma
mönster i samma skiva, bokfört i commit-meddelandet.

**Tredje instansen (2026-08-16, S102, samma mönster i ett `git mv`-liknande
läge):** facit-arkivflytten under Morgonkollens landning (`task-243.1`, PR
**#1426**) bar ett tyst `git add`-pathspec-avbrott — bilagekatalogen flyttades
till `tasks/sessions/archive/bilagor/s55-hem-konvergens/` och en pathspec
pekade på den gamla, nu borta sökvägen. Självfångat av orkestreraren i samma
pass och rättat öppet, tillsammans med en pipe-dold checkout-exitkod
(`L440`-klassen). Bokfört i sessionsdok S102 Del 14 och buret som
carry-kandidat genom tre pauser.

**Det generella:** "committen finns och grindarna var gröna" bevisar inte
att committen BÄR ändringen — grindarna kan ha mätt arbetsträdet medan
committen bär en delmängd. Post-commit-verifiering av innehåll är den
billiga försäkringen; path-scopad add EN pathspec i taget gör felklassen
strukturellt omöjlig.
