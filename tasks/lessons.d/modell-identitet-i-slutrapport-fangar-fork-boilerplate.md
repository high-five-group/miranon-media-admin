# Att kontrollera modell-identiteten i en forks slutrapport fångar en fork som läst fel boilerplate

**En spawnad forks slutrapport bör innehålla vilken modell (identitet)
forken faktiskt kör som. Divergerar den från vad som förväntades kan
det vara ett tecken på att forken missläst sin egen uppstarts-
boilerplate — en billig kontrollpunkt som avslöjar ett strukturellt fel
i hur forken initierades, inte bara ett innehållsfel i dess svar.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24, Paushistorik 1 § Lesson-KANDIDATER punkt 6):
fångat i "triage-halva 2:s forkar" — modell-identiteten i slutrapporten
avslöjade att forkarna hade missläst fork-boilerplate. (Exakt vad
missläsningen bestod i, och vilken modell som förväntades kontra
rapporterades, står inte utskrivet i källan; detalj saknas i källan.)

**Det generella:** en fork ärver hela avsändarens kontext men körs
alltid på avsändarens egen modell — så en fork som rapporterar FEL
modell-identitet har per definition antingen förväxlat sin egen
identitet i rapporten eller läst en generisk mall i stället för det
faktiska uppdraget. Modell-identiteten är därmed ett billigt, mekaniskt
lackmustest för uppdrags-läsningens integritet, inte bara metadata.
