# Arbetsformens regel når inte den som kom in genom en annan dörr

**En regel som bor i en skill levereras bara till den som anropar skillen. Kommer
sessionen in i samma arbete via en ANNAN väg — en resume, en handoff, en
Marcus-punktlista — så gäller regeln fortfarande men når aldrig utföraren.**
`[UNIVERSAL]`

Mätt 2026-08-06 (S93, iterationsvåg 3). Marcus: *"Varför pushar du varje
iterationsrunda? […] Jag har påtalat det här förut men de åtgärder vi införde då
verkar ju inte bita alls."*

Åtgärden fanns, ordagrant, i `prototype`-skillens § 5 *Iterations-kadensen*:

> commit/push/CI ger noll under iterationen. **Per varv: lokal commit, ingen
> push**. **Push + PR EN gång**, när Marcus säger klart

Den skrevs efter förra instansen (`T116`, S96, `TASK-127.2`) och bär till och med
mätningen som motiverade den — `#664` 15 min i kön, `#666` 20 min — plus Marcus
citat *"Vad är det som tar sådan tid???? Så här kan vi inte hålla på vid
iteration!!!"*.

**Rotorsaken är inte att regeln var otydlig eller bortglömd. Den lästes aldrig.**
Sessionen kom in via `session-resume` → handoff → Marcus punktlista, och
ingenstans i den kedjan laddas `prototype`-skillen. Utföraren byggde alltså i
rätt scope, mot rätt fil, med rätt kvalitetsribba — och fel kadens, utan att
någon gång passera texten som definierar kadensen.

**Det generella mönstret:** vi placerar arbetsformens regler i den skill som
STARTAR arbetsformen. Men arbete återupptas oftare än det startas — resume,
handoff, "fortsätt där vi var", en ny punktlista i en pågående tråd. Varje sådan
väg in hoppar över startdörren och därmed över regeln. Ju längre ett arbete
lever, desto större andel av dess varv körs av någon som aldrig såg reglerna.

**Testet innan en regel läggs i en skill:** *kommer varje aktör som utför detta
arbete garanterat att ha laddat denna fil?* Är svaret nej måste regeln antingen
(a) bo på en yta som alltid laddas (spoke-`CLAUDE.md`, output style), (b) bäras
vidare av handoffen som en explicit rad, eller (c) mekaniseras så den fäller vid
handlingen i stället för att informera i förväg.

Denna instans har en ovanligt bra mekaniseringsyta: arbetet skedde i en fil
märkt `[PROTOTYPE]`, på en gren med prototyp-commits, med en dev-server igång.
En `PreToolUse`-spärr på `git push` under de villkoren hade fällt korrekt.

Samma familj som `T119` (regler i prosa bryts av färska kontexter) och
`CLAUDE.md` § *Varför raden står här och inte bara i CONTRIBUTING* — men med en
annan rotorsak än båda: inte att regeln saknade mekanism, utan att den saknade
**leveransväg till den faktiska utföraren**.
