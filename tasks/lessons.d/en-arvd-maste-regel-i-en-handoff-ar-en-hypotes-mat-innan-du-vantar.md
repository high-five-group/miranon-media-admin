# En ärvd "måste"-regel i en handoff är en hypotes — mät innan du väntar på den

**[UNIVERSAL] En handoff som säger att något MÅSTE vara på ett visst sätt
bär ofta en gammal hypotes vidare som fakta. Kostar mätningen ett
kommando är den alltid billigare än att vänta på villkoret.** Mätt
2026-09-03 (S117, `tasks/sessions/2026-09-03-session-117.md` Del 2):
S114:s handoff sade att dev-servern *måste* köra på port 5173 eftersom
staging-CORS "exakt-matchar origin". Porten hölls av en annan sessions
testkörning, och orkestreraren satte en vakt och väntade. Marcus: *"Eller
så öppnar du en ny port, varför vänta på 5173?"* Mätt på 5174 med
e2e-användaren: inloggning OK, prototypen renderade, och skarpa vyn
hämtade alla EF:er med 200 (`get-segments`, `get-events`, 14 ×
`compute-segment`). Allowlisten täckte porten. Regeln hade aldrig mätts —
den var ett antagande som ärvts genom två sessionsdok. Form: när en
handoff-regel blockerar, kör det kommando som avgör om den håller
(här: starta servern och läs nätverksloggen) innan du bygger en väntan
på den.
