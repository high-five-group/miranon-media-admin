# Verktygsval researchas inte med samma disciplin som arkitekturval

**Web-research-disciplinen tillämpas reflexmässigt på arkitekturfrågor men hoppas
över för verktygsval — trots att konstitutionen inte gör den skillnaden. Frågan
"finns det redan?" ska ställas innan ett skript skrivs, inte efter.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** Marcus fråga *"det du gjort i KOD i denna session —
är det verkligen så proffsen konfigurerar?"* avtäckte mönstret. **Fem
research-pass på ett dygn** hade körts för arkitekturfrågor. **Noll** för
verktygsval, och fyra egenbyggen hade landat där mogna verktyg fanns:
`check-docs.sh` · `ci-wait.sh` · hermetik-vakten · två handsynkade
`changed-files`-listor. Verifierat: inget av `npm-run-all`, `concurrently`,
`msw`, `turbo` eller `nx` fanns i `package.json`.

**Skärpningen — och den är viktig:** research-passet som beställdes **rev tre av
fyra anklagelser**. `check-docs.sh` och `ci-wait.sh` är motiverade egenbyggen
(inget verktyg ger tri-state grön/röd/**skippad**; `gh run watch` fäller på
topp-nivåns conclusion och `gh pr checks --watch` är fail-open på `CANCELLED`
och `SKIPPED`), och `changed-files`-uppställningen satt redan på den säkra raden
— ett byte hade gått **in** i fällan, inte ur den. Endast MSW var ett äkta
försummat verktygsval.

**Lärdomen är därför inte "egenbyggen är fel" utan "valet gjordes utan belägg".**
Att tre av fyra visade sig försvarbara i efterhand ändrar inte att de valdes utan
att frågan ställdes. Utfallet ska redovisas **även när domen blir "bygg eget"** —
annars kan nästa läsare inte skilja ett prövat val från ett oprövat.
