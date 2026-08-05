# Agent-parkeringen överlevde dubbel instruktion — empiri, inte ny lärdom

**En regel som står BÅDE i agentens egen definition OCH ordagrant i dess
uppdrag efterlevs ändå inte. Instansen är inte ett nytt fenomen — den är
mätdata på att instruktions-lagret inte bär den här klassen.**

Datum: 2026-08-05 (S96, fjärde resumen) | Klass: `L340`-familjen
(agent-parkering på asynkron signal)

## Instansen

`TASK-127.8`-agenten (passkey-skivan) avslutade sin tur med, verbatim:

```text
Waiting for the monitor's completion notification before proceeding.
```

Den hade då byggt **åtta filer** — `src/lib/auth/passkey.ts`,
`src/routes/passkey.tsx`, fyra testfiler samt ändringar i
`src/data/config/supabase-client.ts` och `src/routes/login.tsx` — och
committat **noll** av dem. Ingen gren, ingen PR. Worktreen stod kvar på
spawn-tidens SHA. Förbrukat: ~390k tokens, 202 verktygsanrop, 43 minuter.

Arbetet var inte förlorat (orkestreraren väckte agenten med `SendMessage`), men
utan den väckningen hade det dött med worktreen.

## Varför instansen är värd att bokföra

Det som skiljer den från S98:s tre instanser är **täckningen**. Regeln fanns på
två ställen samtidigt:

1. `.claude/agents/bygg-agent.md` § *"Ingen asynkron signal når dig — kör allt
   du måste invänta i FÖRGRUNDEN"* (rad 141–162), som dessutom citerar `L340`
   och skriver rakt ut: *"Skriver du 'jag väntar på notifikationen' och
   avslutar din tur är du inte i väntan — du är parkerad i evighet, med färdigt
   oredovisat arbete."*
2. Orkestrerarens uppdragstext: *"**Parkera ALDRIG på en landnings-vakt.**
   Pusha, öppna PR, rapportera — orkestreraren äger armering och merge-kön."*

Agenten producerade ändå exakt den mening definitionen förbjuder, nästan
ordagrant.

S98 rättade `bygg-agent.md` och `research-pass.md` med instruktionstext, och
bokförde samtidigt i sin egen handoff att **"fixen är instruktion, inte
mekanism, och mätningen är konfunderad"**. Denna instans är belägget för att
den självbedömningen var korrekt: mätningen är inte längre konfunderad, och
instruktionen räckte inte.

## Vad instansen INTE säger

Den säger ingenting om vilken mekanism som är rätt. Marcus uppger 2026-08-05
att en mekanisk lösning finns, och har uttryckligen bordlagt frågan — den tas
upp om klassen återkommer. Denna post är därför ren empiri-bokföring, inte ett
åtgärdsförslag: raden finns för att nästa mätning ska ha en fjärde datapunkt
med känd täckning, inte för att driva ett beslut.

Besläktat: `L340` (grundfyndet) · S98:s tre instanser · `T119`
(mekaniserings-programmet — *"regler i prosa bryts av färska kontexter; det som
håller är mekaniserat"*, vars tes den här instansen stärker).
