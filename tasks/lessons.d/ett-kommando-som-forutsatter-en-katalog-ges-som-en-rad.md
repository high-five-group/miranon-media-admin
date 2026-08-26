# Ett kommando som förutsätter en katalog ges som EN rad — mottagarens skal startar i en katalog du inte styr

**Ger du en människa `cd <katalog>` på en rad och kommandot på nästa, körs de
som två fristående anrop, och det andra startar i sessionens arbetskatalog i
stället för i din. Varje kommando som förutsätter en plats bär därför sin `cd`
i SAMMA rad, sammanbunden med `&&`. Det gäller särskilt `!`-prefixets skal,
som kör ett kommando per anrop.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 18 § H punkt 3): prod-deployens instruktion
gavs som två rader. `!`-anropet körde deploy-kommandot i sessionens
arbetskatalog — som stod kvar i dokträdet efter orkestrerarens egna commits —
och skriptets preflight fällde på fel gren. Preflighten gjorde sitt jobb;
instruktionen var fel.

**Det generella:** den som skriver instruktionen ser sin egen mentala katalog,
mottagarens skal ser sin. Två rader ser ut som en sekvens utan att vara det —
bindningen finns bara i läsarens huvud. `&&` flyttar bindningen in i
kommandot, där den blir mekanisk: faller `cd`, körs ingenting. En kant värd
att känna till: enradsformen löser BINDNINGEN men inte driften — cwd står kvar
efter anropet, så nästa instruktion måste bära sin egen `cd` på samma sätt.
Besläktat men med annan mottagare: `cwd-persisterar-mellan-bash-anrop-och-driftar-tyst.md`
handlar om agentens egna Bash-anrop, där `-C <mål>` är motmedlet. Här kan du
inte ens mäta katalogen du skickar till, vilket gör enradsformen till enda
tillgängliga försvaret.
