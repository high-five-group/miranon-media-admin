# Två CI-blockerare som låser varandra staplas medvetet i en bunt-PR

**När fix A faller i CI på fel B och en fristående fix B skulle falla på
fel A kan ingen av dem landa ensam — då är det rätt att stapla B som andra
commit på A:s gren, med två kort och en öppen motivering i PR-kroppen,
trots regeln "en PR per kort".** Mätt 2026-09-17 (S125, #2491): audit-fixen
(`TASK-444`) föll på acceptance shard 2 (klock-landminan) och en klockfix
skulle ha fallit på audit. Granskningen i runda 2 använde bunt-formen
`kortId: null` med AC-prövningen i fri text (L636). Regel: kalla det bunt,
skriv varför, och lägg AC-prövningen för det andra kortet där granskaren
faktiskt ser den — inte i ett fält schemat inte har.
