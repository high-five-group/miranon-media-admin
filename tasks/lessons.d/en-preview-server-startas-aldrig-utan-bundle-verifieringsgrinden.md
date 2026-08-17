# En preview-server startas ALDRIG utan bundle-verifieringsgrinden — annars granskar Marcus fel miljös bundle

**En preview-server serverar den bundle som senast byggdes, inte den miljö man
tror sig ha startat. Startas den utan `verify:staging-bundle` kan hela
granskningen ske mot PROD-bundeln medan man förklarar staging-beteende — och
felet visar sig först som obegripliga symptom (fel data, fel inloggning) långt
in i passet. Grinden körs FÖRE servern, varje gång.**

Instans (S102, 2026-08-17, QA 243.4): preview-servern på port 4173 startades
utan grinden. `verify:staging-bundle` avslöjade i efterhand att bundeln var
prod-byggd; ytan fick byggas om med `build:staging` innan granskningen kunde
göras. Orkestreraren bokförde det öppet som egen miss ("fälla 1 skarp").
Inloggningsstrulet i samma pass var en separat sak —
`TEST_ADMIN_PASSWORD`-raden, egen variabel; auth-beviset var curl 200 före
omdirigering.

**Det generella:** grinden finns för att bundlar är omärkta i sitt eget
gränssnitt. Inget i webbläsaren säger vilken miljö bundeln byggdes för, och
den som startade servern minns sin AVSIKT, inte kommandots utfall. Därför
måste verifieringen ligga i sekvensen före servern, inte som en möjlighet att
plocka fram om något känns fel.
