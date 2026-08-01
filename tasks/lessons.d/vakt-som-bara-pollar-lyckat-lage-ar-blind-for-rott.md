# En vakt som bara pollar efter LYCKAT terminalläge är blind för rött

**Ett terminalvillkor som bara känner igen framgång ("är den mergad än?") ser
aldrig ett misslyckande — det pollar bara vidare, tyst, tills någon annan
märker att inget händer. Ett terminalvillkor måste täcka BÅDA utfallen: lyckat
OCH fällt, annars är vakten strukturellt blind för halva de tillstånd den
finns för att upptäcka.** `[UNIVERSAL]`

**Empiri (S91, tjugoförsta resumen, 2026-08-01, `TASK-115`).** PR `#557` bar
ingenting mer riskabelt än två agent-frontmatter-filer (`gh pr diff 557
--name-only` bekräftar), men föll ändå i merge-kön **två gånger i rad på sex
minuter** (instans 6 kl. 20:37Z, instans 7 kl. 20:43Z) på samma underliggande
signatur — `TASK-91`-vaktens G0-steg fick ett trunkerat/ofullständigt svar
från `playwright --list` i en `cpSync`-sandlåda under parallell last, svarade
fail-closed med exit 64, och kön sparkade ut posten med **konsumerad
armering** vid varje instans (`failed_checks`-dequeue). Tredje försöket
(`merge_group`-run `30717774404`) blev grönt och PR:n landade.

**Orkestrerarens egna vakter pollade enbart efter `MERGED`.** Två fällningar
på samma PR passerade därför osedda — ingen signal gick till orkestreraren när
kön sparkade ut posten, bara tystnad. Marcus fångade det genom att fråga varför
PR:n stod stilla. Kostnaden var inte den röda körningen (`TASK-115` är en känd,
redan bokförd flake-klass) utan den **konsumerade armeringen**: en PR som ser
identisk ut med en aldrig armerad (`autoMergeRequest: null` i båda lägena) och
som annars står stilla på obestämd tid tills en människa märker det — samma
obevakade-tillstånd-klass som `T108`/`T112` beskriver på orkestrerarnivå.

**Fixen samma stund:** tvåvägs-vakts-formen — terminalvillkoret utökat till
att känna igen BÅDA "landat" och "utsparkat/fällt" som avslutande tillstånd,
inte bara det förra. En vakt som bara letar efter det goda utfallet är per
konstruktion en vakt som aldrig larmar.
