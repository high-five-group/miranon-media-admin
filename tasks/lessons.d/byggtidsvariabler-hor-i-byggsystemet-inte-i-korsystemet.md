# Byggtidsvariabler hör i byggsystemet, inte i körsystemet

**[UNIVERSAL]**

`VITE_SENTRY_DSN` lades som hemlighet i Supabase. Men `VITE_`-variabler bakas
in i JavaScript-bundlen av Vite **vid bygget**, och bygget görs av Vercel.
Supabase-hemligheter är runtime-variabler för Edge Functions som kör på servern.
De två miljöerna möts aldrig.

**Varför det är tyst i båda ändar:** Supabase klagar inte på att ingen läser
variabeln. Bundlen klagar inte på att den saknas — den får bara `undefined`.
Ingen av parterna har anledning att säga ifrån.

**Regeln:** placera en variabel efter NÄR den läses, inte efter var den känns
hemma. Läses den när koden byggs hör den i byggsystemet. Läses den när koden kör
hör den i körsystemet. En variabel med byggverktygets prefix (`VITE_`, `NEXT_PUBLIC_`,
`REACT_APP_`) i ett runtime-hemlighetssystem är alltid fel plats.

**Och verifiera i den miljö som räknas.** Maj-sessionens checklista tillät
`npm run preview` LOKALT som verifiering — och lokalt fungerade det, eftersom
`.env.local` bar värdet. En grön verifiering i fel miljö är värre än ingen, för
den stänger frågan.

Instans: S107 2026-08-20, `T151`. 3,5 månaders tyst blindhet.
