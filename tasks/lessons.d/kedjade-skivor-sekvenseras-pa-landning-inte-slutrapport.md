# Kedjade skivor sekvenseras på LANDNING, inte på agentens slutrapport

**En agents "klart"-rapport är inte samma händelse som skivans faktiska
landning på `main`. En efterföljande, beroende skiva som spawnas mot
"rapporterat klart" i stället för mot en verifierad landning riskerar att
starta mot fel bas — sekvensera nästa skiva när FÖREGÅENDES commit
faktiskt finns på `main` (eller dess merge-kö-post är bekräftad), inte
när agenten säger sig vara färdig.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24, Paushistorik 1 § Lesson-KANDIDATER punkt 1):
kortet `TASK-243.5` gav upphov till vad sessionsdoket kallar
"243.5-felspawnen" — en kedjad efterföljande skiva spawnades innan
föregångarens landning var verifierad. Agenten själv fångade felet;
rättelsen landade som dokumentations-PR `#1917`. (Den exakta tekniska
mekanismen bakom felspawnen — vilket antagande som gjordes om
föregångarens tillstånd — står inte utskriven i källan; detalj saknas i
källan.)

**Det generella:** merge-kön (ADR-076) sekvenserar landningar seriellt,
men en orkestrerare som spawnar nästa skiva i en kedja tidigare — mot
agentens egen slutrapport — kopplar bort sig från den mekaniska
garantin kön ger. "Rapporterat klart" och "landat" är två olika
händelser med olika tidpunkter, och skillnaden mellan dem är exakt
fönstret där en kedjad skiva kan spawnas mot fel bas.
