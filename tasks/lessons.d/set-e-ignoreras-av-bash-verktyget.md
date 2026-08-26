# `set -e` i ett Bash-verktygskommando propagerar inte som förväntat — en `false` mitt i kedjan stoppar INTE resten

**Ett kommando skickat till Bash-verktyget som börjar med `set -e;
false; echo x` skriver ändå ut `x`. `set -e` ska avsluta ett skript vid
första fallerande kommando, men i den form Bash-verktyget kör
kommandosträngen gäller inte det antagandet pålitligt. En kedja av
kommandon som förlitar sig på `set -e` för att stoppa vid ett fel (t.ex.
ett vale-lint-fel) kan därför fortsätta till commit+push+PR trots att
ett tidigare steg fallerade.**

**[UNIVERSAL]**

Instans (S112, orkestrerarens trail, resume 1, 2026-08-26 — exakt
vilken skarpa kedja/PR detta gällde utöver testkommandot själv står
inte i den del av källan jag haft tillgång till; detalj saknas i
källan): testkommandot `set -e; false; echo x` skrev `x` i stället för
att avbryta vid `false`. En kedja med ett vale-fel gick vidare till
commit, push och PR-skapande.

**Det generella:** lita aldrig på `set -e` ensamt för att bära
felkontroll genom en kommandokedja i Bash-verktyget — kedja med `&&`
explicit, eller fånga varje exitkod och testa den (`|| exit 1`) i
stället för att förlita sig på skalets inbyggda avbrytningsbeteende.
Detta är samma felklass som `L522` i hubben (en pipe utanför ett
skript maskerar skriptets interna `set -o pipefail`) — båda är
instanser av att en skalflaggas räckvidd är snävare än den intuitiva
läsningen antyder, och båda kräver att anroparen bär felkontrollen
explicit i stället för att förlita sig på flaggan.
