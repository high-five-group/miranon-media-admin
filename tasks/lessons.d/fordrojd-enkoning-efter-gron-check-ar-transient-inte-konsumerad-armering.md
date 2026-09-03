# Fördröjd enköning efter sista gröna check är transient — inte konsumerad armering

**[UNIVERSAL] En armerad PR som står CLEAN + auto-merge-begäran utan att
synas i kön under 1–2 minuter efter sista gröna check är i ett
TRANSIENT tillstånd, inte en konsumerad armering.** Mätt två gånger
2026-09-03 (S114, Del 6, TASK-374-promoveringen): både `#2263` och
`#2273` stod CLEAN med aktiv auto-merge-begäran utan att synas som
köad i 1–2 minuter efter sista gröna check, innan de faktiskt gick in i
`gh-readonly-queue`. Ett andra `gh pr merge --auto` under detta fönster
gav båda gångerna svaret `already queued to merge` (QUEUED) — inte en
ny armering, utan en bekräftelse att den befintliga redan gällde.

**Skillnaden mot den redan kända konsumerad-armering-klassen**
(`CLAUDE.md` § Landning, "Det fjärde läget"): en `failed_checks`-
dequeue konsumerar armeringen TYST och permanent — svaret på ett andra
`gh pr merge --auto` där är en NY armering, inte en bekräftelse. De två
lägena ser identiska ut i ett enda ögonblicksstatiskt API-svar (CLEAN,
`autoMergeRequest: null`), men skiljer sig i vad ett andra
armerings-anrop returnerar.

**Regel:** vid ett CLEAN-läge utan synlig kö-post, vänta inte passivt
och deklarera inte konsumerad armering — kör ett andra `gh pr merge
--auto` inom rimlig tid (någon minut). `already queued to merge`
betyder transient fördröjning, en faktisk ny armering betyder att den
gamla verkligen var konsumerad. Disambiguering, inte gissning.
