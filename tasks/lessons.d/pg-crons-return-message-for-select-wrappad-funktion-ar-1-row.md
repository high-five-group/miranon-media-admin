# pg_crons `return_message` för en SELECT-wrappad funktion är "1 row", läs funktionens svar med direktanrop

Ett runbook-steg lovade att `cron.job_run_details.return_message` skulle
visa funktionens JSON-svar efter en cron-körning. Mätt 2026-09-02 (S113
Del 16, `tasks/sessions/2026-08-29-session-113.md` rad 1682, 1689 till
1695): fältet visade i stället "1 row", pg_crons egen bokföring av att en
SELECT-wrappad funktion returnerade en rad, aldrig funktionens faktiska
JSON. Funktionens svar lästes i stället med ett direktanrop,
`select public.jobb_cron_tick()`, som gav det förväntade JSON-objektet.
Regel: verifiera aldrig en cron-jobbad funktions svarsinnehåll via
`return_message` när funktionen anropas som `select fn()` i cron-schemat,
eftersom `return_message` då bara bokför radantalet. Kör funktionen direkt
för att läsa dess faktiska svar.
