# En serie av bygg-agenter i samma iterationsloop, pensionera proaktivt vid kontextväggen med en självbärande brief till nästa agent

**[UNIVERSAL] En lång, iterativ arbetsform där flera agenter avlöser
varandra seriellt på samma gren kan tillämpa `T179`s lärdom (en session som
kör in i den HÅRDA kontextväggen blir obrukbar mitt i arbetet, utan
förvarning) PROAKTIVT: pensionera varje agent innan den når väggen, och
handa av arbetet till nästa agent i serien via en SJÄLVBÄRANDE brief, i
stället för att förlita sig på att kontexten bär över mellan agenterna.**
Mätt 2026-09-01 (S113 Del 14, `tasks/sessions/2026-08-29-session-113.md`
rad 1520 till 1523): fyra bygg-agenter kördes i serie under en lokal
Marcus-iterationsloop, var och en pensionerad vid ungefär 458k, 452k, 337k
respektive 400k tokens, långt innan ett hårt fel skulle ha inträffat.
Formen fungerade utan en enda kontextvägg-krasch under hela loopen. Regel:
i en planerad serie av agenter på samma arbetsyta, sätt en proaktiv
pensioneringströskel under den hårda gränsen, och skriv varje efterföljande
agents brief som fristående (mål, läge, nästa steg), inte beroende av att
läsa föregångarens konversation.
