---
id: TASK-160
title: 'PRD: Compact-formen — kontrollerad kompaktering med smal nisch'
status: To Do
assignee: []
created_date: '2026-08-07 16:51'
labels: []
dependencies: []
ordinal: 282000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

När en orkestrerings-session närmar sig kontextfönstrets gräns mitt i en arbetsenhet, med byggare i luften och PR:er i kön, finns i dag två utfall: pausa — vilket kräver att hela pipelinen dräneras (mätt serialiseringskostnad i S99:s båda pauser: "vi landar allt som är i luften och väntar in agenterna") — eller fortsätta tills harnessets auto-compact slår till okontrollerat vid cirka 85–90 %, utan fokus-instruktion och utan att läget säkrats i fil. Status quo är alltså inte "paus alltid" utan "paus när någon råkar se statusraden, annars okontrollerad kompaktering". Uppdrag 8:s grillning (S99 Del 9) fastslog att den verkliga frågan är kontrollerad kontra okontrollerad kompaktering — inte compact kontra paus.

### Lösning

En kontrollerad compact-form med smal, exakt definierad nisch. Tre villkor ska hålla SAMTIDIGT: (1) pipeline i luften, (2) arbetsenheten oavslutad — ingen naturlig landningspunkt, (3) kontexten i zonen (~50 %). Max EN compact per session — en andra impuls är signalen att landa och pausa på riktigt. Kedjan är helt mekaniserad: en lågt satt auto-compact-tröskel gör harnessets eget compact-försök till zonlarmet → PreCompact-grinden nekar okontrollerad kompaktering med anvisning → pre-compact-skillen säkrar läget i fil och producerar fokus-instruktionen → kontrollerad manuell kompaktering med fokus → post-compact-omorientering via SessionStart-igenkänning. Paus/clear förblir default för landningspunkter och scope-byten; ren kontext per arbetsenhet förblir normen (Pocock: Grill → Execute → Clear, sediment-varningen).

### Användarberättelser

1. Som orkestrerare vill jag få ett maskinellt zonlarm när kontexten når zonen, så att compact-eller-paus-beslutet fattas med marginal i stället för vid klippan.
2. Som orkestrerare vill jag att okontrollerad auto-compact nekas fail-closed, så att summarisering aldrig sker utan att läget först säkrats i fil.
3. Som orkestrerare med byggare i luften vill jag kunna kompaktera utan att dränera pipelinen, så att paus-formens serialiseringskostnad inte betalas mitt i en arbetsenhet.
4. Som Marcus i HITL-läge vill jag ge GO i klartext före varje kompaktering, så att oåterkallelig kastning av verbatim-kontext aldrig sker utan mitt beslut.
5. Som orkestrerare i AFK-läge vill jag att agenten själv tar compact-beslutet när alla nisch-villkor är mätta och läget säkrat, så att batchar inte fastnar i väntan på ett GO som inte kan komma.
6. Som session efter kompaktering vill jag mekaniskt känna igen post-compact-läget och omorientera mot disk, så att sammanfattningen aldrig blir sanningsbärare.
7. Som pre-compact-skill-användare vill jag att fokus-instruktionen produceras ur läget (nästa mål, öppna PR-nummer, numrerings-snapshot, monitor-läge), så att sammanfattningen bevarar rätt sak.
8. Som framtida läsare vill jag förstå varför repot nekar harnessets egen auto-compact, så att konventionen inte rivs av misstag.
9. Som mätande session vill jag ha compact-överlevnadens öppna frågor som mätpunkter i det bokade väckningskedjs-protokollet, så att skillens antaganden ersätts av mätdata.
10. Som orkestrerare vill jag att en andra compact-impuls i samma session behandlas som paus-signal, så att sediment-ackumulering aldrig blir arbetsform.

### Implementationsbeslut

- Nischen: tre samtidiga villkor (pipeline i luften · oavslutad arbetsenhet · zonen); max EN compact per session; andra impulsen = landa + pausa. Compact ersätter aldrig paus vid scope-byte.
- Zonen: auto-compact-tröskeln sätts lågt (~50 %) via harnessets dokumenterade tröskel-miljövariabel i settings-miljöblocket. Det nekade auto-compact-försöket ÄR zonlarmet — statusradens procent går inte att läsa programmatiskt (dokumenterat förstapartsläge), så kedjan kräver inga ögon.
- PreCompact-grinden byggs i deny-familjen med config-driven policy: trigger auto → neka alltid med anvisning som pekar på skillen; trigger manual → neka om markörfilen saknas eller är äldre än ~15 min.
- Markörfilens krav (sätts endast av skillen): rent arbetsträd där LOKALA COMMITS RÄCKER — push krävs inte, en medveten divergens mot paus-formen motiverad av push-ekonomin (sessionen lever vidare i samma arbetsträd); sessionsdok-carry uppdaterad om olandat resonemang finns; todo-kadensraden synkad; fokus-instruktionen skriven i markören; monitor- och task-läge noterat för omstart. Engångsbiljett: rensas av post-compact-steget.
- Beslutsrätten är tudelad: HITL = Marcus GO i klartext; AFK = agentens eget beslut när villkoren är mätta.
- pre-compact-skillen bor i hub-pluginet som egen skill — INTE en gren i session-paus, vars kontrakt (lifecycle-flipp, dränerad pipeline, pushat träd) är compact-formens motsats på just de punkterna.
- Post-compact: SessionStart-igenkänning av compact-källan injicerar omorienteringen — re-läs kärnytor (todo-kadensrad, sessionsdokets senaste Del, git-status), starta om monitorn, rensa markören.
- Robusthet: skillen planerar monitor-omstart som om ingenting överlever kompakteringen; faller mätningen annorlunda justeras skillen, inte arkitekturen.

### Testbeslut

Externt beteende, aldrig implementationsdetaljer. Hook-grindarna testas i deny-familjens tvåsidiga form: fäller/släpper/fail-closed mot fixtur, shellcheck-strict mot CI:s pinnade version — förebilder är arbetsform-push-grindens och tråd-index-grindens sviter. Skarpbeviset (laddad hook fäller i levande session) kan ALDRIG tas i byggsessionen — bokförs som öppen skuld i hook-skivorna med differentialreceptet, betalas i nästa session. Hub-skillen verifieras i hub-integrationsformen: plugin-bump + reinstall-innehållsbevis. ADR och dokumentation bär docs-grindarna. Mätpunkterna läggs i väckningskedjs-protokollet — ingen egen mätrigg.

### Utanför omfattningen

- Ändringar i session-paus- eller session-resume-kontrakten.
- Automatisk kompaktering utan skill-vägen; flera compacts per session.
- Programmatisk statusrads-läsning (existerar inte förstaparts).
- Compact som ersättning för paus vid scope-byte eller naturliga landningspunkter.

### Estimat

7 skivor: ADR (S) · PreCompact-grinden (S) · hub-skillen (M) · post-compact-igenkänningen (S) · tröskel-konfigen (XS) · mätpunkts-tillägget (XS) · QA (S).

### ADR-koppling

Ny ADR (compact-formen) mintas i ADR-skivan — baren prövad i grillningen, alla tre villkor håller; decline-rationale för ersättnings- och avvisnings-alternativen bokförs där. Styrande i området: subagentens väntekontrakt, arbetsformens tillståndsbärare + push-ekonomin, paus-verbet och lifecycle-semantiken, triage-regeln.

### Ytterligare anteckningar

Primärkällor, källmärkta i grillningen (S99 Del 9): Pocock-korpusens sediment-varning och kontextdisciplin; förstapartsfakta via guide-agent-pass 2026-08-07 — fokus-instruktioner till manuell kompaktering, PreCompact-grindens block-förmåga och trigger-fält, SessionStart-källfältet, tröskel-miljövariabeln, samt att bakgrundstasks sannolikt inte överlever kompaktering (hypotes → mätpunkt). Fem kvitterade grillnings-frågor + Marcus GO 2026-08-07.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
