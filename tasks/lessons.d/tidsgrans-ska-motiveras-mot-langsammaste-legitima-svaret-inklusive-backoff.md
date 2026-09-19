# En tidsgräns ska motiveras mot det långsammaste LEGITIMA svaret i lagret under, inte mot normal-latens

`[UNIVERSAL]`

**En tidsgräns i ett lager ska motiveras mot det långsammaste LEGITIMA
svaret i lagret under, inklusive felvägarnas backoff — inte mot uppmätt
normal-latens.** Instans (`TASK-451.4`/PR #2551): klientens föreslagna
20 s-gräns underkände serverns egen 429-återhämtning
(`_shared/airtable-retry.ts`: golv 30 000 ms, 2 omförsök, värsta fall
112,5 s). Bygg-agenten hade motiverat talet enbart mot happy-path-latens;
granskaren fångade att den slog för hårt mot en helt legitim, om än
långsam, serverrespons.

Varför `[UNIVERSAL]`: timeout/retry-budgetdesign är ett generellt
mönster i varje flerlagers-arkitektur med nätverksanrop — regeln "räkna
med det långsammaste LEGITIMA svaret, inklusive backoff" gäller oavsett
domän.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 6, Lesson-kandidat 13
och "Fångster värda att minnas" #1.
