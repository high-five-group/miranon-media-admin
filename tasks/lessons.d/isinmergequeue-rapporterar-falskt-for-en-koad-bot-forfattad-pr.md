# `isInMergeQueue` rapporterar falskt för en köad bot-författad PR, mutationens felsvar är tredje disambiguatorn

CLAUDE.md dokumenterar redan att `isInMergeQueue` ska frågas i samma
GraphQL-query för att skilja "korrekt köad" från "aldrig armerad", men för
en PR författad av en bot-identitet kan fältet rapportera `false` trots att
PR:en faktiskt ligger i kön. Mätt 2026-09-01 (S113 resume 7,
`tasks/sessions/2026-08-29-session-113.md` rad 2093 till 2095): en köad
bot-författad PR visade `isInMergeQueue: false`, vilket enligt den
befintliga regeln borde betyda "larma". Disambigueringen krävde ett tredje
steg: ett andra armeringsförsök via `enqueuePullRequest`-mutationen, vars
felsvar "already in the queue" bekräftade att PR:en faktiskt var köad.
Regel: för en bot-författad PR, lita inte på `isInMergeQueue` ensamt när det
visar `false`, kör en `enqueuePullRequest`-mutation och läs felsvaret som
en tredje disambiguator innan du drar slutsatsen att PR:en inte är köad.
