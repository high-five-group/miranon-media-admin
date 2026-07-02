# Kursnoteringar **AIHero** 

* /context \- för att se förbrukning

* Shared **Design Concept** \- ett designkoncept som du och agenten delar

* Markdownlänkar till referensdokument kan man benämna som **kontextpekare**

* Control \+ o \- för att se agentens arbete  
    
* @ \- för att referera en eller flera filer direkt in i kontext  
    
* Nyckelord som triggar sub-agenter: *Plan*, *Explore*

## **Bygga en ny funktion börjar med:**  

(ref: Write Great PRDs With This Skill Solution)

**1\.** **/grill-me** \- Målet är att nå gemensam förståelse, genom frågor och svar. När du jobbar i ett befintligt repo/projekt och återkommande kör grill-me kan agenten ha svårt att förstå varför saker är som de är och varför kodbasen ser ut som den gör, därför kan du använda **/grill-with-docs** skillen.  **/grill-with-docs** tar en grill-me-session och skapar ett ADR-dokument och en delad ordlista (shared glossary), vilket underlättar för framtida grill-me sessioner.   
**2\.** **/to-prd** \- Strukturera grill-me-session till spec \- redan här etablerar man konceptet med deep modules.  
**~~3\.~~** ~~**/prd-to-plan (struken)**~~. Multi-phase plan, **vertikalt** (vertical slices) med **tracer bullets**.   
Inte plan direkt (Naiv plan approach), för horisontell och för mycket implementationsmanual, du vet sällan exakt hur allt kommer implementeras innan du börjat implementera.

Tracer bullets

**3\.** **/prd-to-issues** (**/to-issues**) \- Istället för en sekventiell plan så är **Kanban**\-approachen mycket bättre. **/prd-to-issues** är en Kanban-skill.

Göra **research** och **prototyper** baserat på researchen. Testa **/prototype** skillen.

**4\.** Implementera \- **/do-work**  
Feedback-loops (automatiska kontroller/**tester**), olika test-scripts, pre-commit hooks. RGR (Red/Green Refactor) loop. Allt detta bör finnas med och vara en del av **/do-work** skillen.

**5\.** AFK agents (Away-From-Keyboard). Istället för att du ska behöva sitta och övervaka och prompta “Kör fas 1”, “Kör fas 2”, “Kör fas 3” så automatiserar du det i en Ralph-loop. Men grejen är att agenten ska jobba med endast EN uppgift i taget, inte alla faser i ett och samma kontextfönster.

Säker miljö \- Kör inuti en **Sandbox** via en docker. Matt använder sin egen “Sandcastle”.

Integrera **Github Issues** i AFK-loopen. Istället för att du har en lista av uppgifter agenten ska göra i ett dokument eller i en prompt så kan du arrangera så den plockar från Issues på Github istället, med de viktigaste uppgifterna först. Du kan sätta etiketter på issues så det blir lättare för agenten att välja. Github Issues funkar som din backlog.

Göra **research** och **prototyper** baserat på researchen, ofta i planeringsfasen.

## Designing Codebases Ai Loves \- **deep modules**

Deep modules \-\> Services

Du måste etablera ett **gemensamt språk** med agenten tidigt (i planeringsfasen) om deep modules. Det handlar om att skapa **Module Awareness**.

Använd **/improve-codebase-architecture** skillen.

## **Final workflow** 

**1\. The Grill Interview**  
The first step is the grill. This is where you interview yourself (or get interviewed) about an idea to harden it before turning it into a PRD.

**2\. Research**  
Grilling often surfaces the need for research. You might need to explore third-party APIs, investigate tooling options, or see what's available in the ecosystem.

**3\. Prototyping**  
Sometimes research requires prototyping. You might pause the grilling session, build something quickly, then return to grilling with better information about where you're heading.

**4\. Creating the PRD**  
These first three steps culminate in a product requirements document (PRD). This is your destination document: a spec file that lives in your issues and can be reviewed by your team.

**5\. Breaking Down Into Issues**  
Once you know where you're going (the PRD), you need to figure out how to get there. Turn the PRD into individual tickets with blocking relationships.

**6\. Implementation**  
Now you implement. Choose between human-in-the-loop (watching the agent work) or totally AFK (the agent works through all issues autonomously).

**7\. Review and Continuous Improvement**

Finally, review the agent's work:

Check that the destination was reached correctly  
Verify all PRD requirements were implemented  
Validate against your coding standards  
Review the process for improvements

**Summary**  
This is my current approach to AI development. You're free to adapt these phases, reorder them, or rename them to fit your workflow.

The goal is to bring these techniques to your organization or personal projects and build things you wouldn't have thought possible before.

AI coding gives you permission to build bigger. Enjoy the process.

## Egna övriga anteckningar:  

En Ralph-loop är ett AI-kodningsmönster där man låter en AI-agent, till exempel Claude Code, jobba i en upprepad loop mot samma mål tills jobbet är klart.

**TDD** betyder **Test-Driven Development**, på svenska ungefär **testdriven utveckling**.

Det innebär att man skriver **testet först**, innan man skriver själva koden.

Grundidén är:

1. **Skriv ett test** för något koden ska klara.  
2. **Kör testet** och se att det misslyckas, eftersom funktionen inte finns än.  
3. **Skriv minsta möjliga kod** som gör att testet klarar sig.  
4. **Städa/förbättra koden** utan att testet slutar fungera.

Det brukar beskrivas som:

**Red → Green → Refactor**

Alltså:

**Red:** Testet failar.  
**Green:** Du skriver kod så testet passerar.  
**Refactor:** Du snyggar till koden men behåller funktionen.

