# En bunt-PR med flera kort passar inte review-utlåtandets `kortId`-schema (en nullable sträng, inte en lista)

**Review-agentens utlåtande-kontrakt (`TASK-173`) har `kortId` som en
NULLABLE STRÄNG — ett fält för exakt noll eller ett kort. En PR som
samlar flera kort (en bunt-PR) tvingar granskaren att antingen klassa
hela PR:en under en enda typ (t.ex. `pr-text`/`lag`) och trycka in
AC-prövningen för samtliga kort i det fria `fynd`-fältet, i stället för
att koppla varje AC-prövning till sitt eget kort.**

Instans (S112, orkestrerarens trail, resume 1, 2026-08-26): en
5-korts-PR granskades och klassades av review-agenten som
`pr-text`/`lag`, med AC-prövningen för alla fem korten buntad i
`fynd`-fältet i stället för kopplad per kort. PR:en var `#1978` (fix-våg 4 bunt A: TASK-26/116/138/198/296); samma
klassning upprepades sedan för `#1982` (B1), `#1986`, `#1987` och `#1988`
— fem bunt-PR:er på en dag, alla `kortId: null`.

**Det generella:** schemat kodar ett implicit antagande — en PR
motsvarar ett kort — som inte håller för bunt-landningar, och en
bunt-PR är i sig ett medvetet, återkommande mönster i denna sessions
arbetsform (fix-vågor, småfix-buntar). Detta är en ÖPPEN POLICYFRÅGA
för `173.5`/`173.6`, inte en löst lärdom: antingen styr man mot ETT
kort per PR som konvention (kostar landningstakt), eller utvidgar
schemat till ett listfält för `kortId` (kostar ett schema-brott som
varje konsument av utlåtandet måste hantera). Ingen av vägarna är vald
här.
