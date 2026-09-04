# React Arias fokusåterställning efter musstängning tänder webbläsarens `:focus-visible`

**[UNIVERSAL] När en React Aria-popover stängs med musklick utanför återställs
fokus PROGRAMMATISKT till triggern — och webbläsarens `:focus-visible`-heuristik
matchar programmatiskt fokus, så en global `*:focus-visible`-ring målas fast
RAC:s egen modalitetsspårning säger "pekare" (`data-focus-visible: null`).**
Mätt 2026-08-29 (S113, `e99a5aee`) på `Skapa dokument ▾`, radens ⋯ och
eventväljaren: `outline: solid 2px rgb(27,73,101)` efter musstängning i alla
tre; efter tangentbords-Escape `data-focus-visible="true"` + ring (korrekt).
Lösning: lita på RAC:s modalitet där RAC äger fokusflytten —
`[data-rac][aria-haspopup]:focus-visible:not([data-focus-visible]) { outline:
none }` scopat till popover-triggers; `:not([data-focus-visible])` bevarar
tangentbordsringen. Samma defektklass som släckaren för `[role=listbox]` /
`[role=menu]`-behållare (S73 K85/TASK-134). Pröva alltid BÅDA modaliteterna
(mus-öppna + musklick utanför · mus-öppna + Escape · Tab till triggern) innan
en fokusfix kallas klar.
