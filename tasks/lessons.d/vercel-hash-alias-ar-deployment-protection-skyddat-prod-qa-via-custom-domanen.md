# Vercel-hash-aliaset är Deployment-Protection-skyddat — prod-QA går via custom-domänen

**[UNIVERSAL] En Vercel-produktionsdeployments hash-alias-URL
(`<hash>.vercel.app`, från API-svaret eller PR-kommentaren) är
Deployment-Protection-skyddad och kräver Vercel-inloggning en agent
inte har — custom-domänen (t.ex. `admin.miranon.dev`) är den
rättvisande, öppna vägen för prod-QA.** Mätt 2026-09-03 (S114, Del 6,
TASK-374.5 QA-vandringen): en kastbar QA-agent kunde inte utföra
prod-punkterna som kräver inloggning via hash-aliaset — Deployment
Protection blockerade. De punkter som INTE kräver inloggning (t.ex. en
utloggad redirect-kontroll) gick att verifiera mot BÅDA vägarna och gav
identiskt resultat i staging och prod via custom-domänen.

**Regel:** en QA-agent eller ett skript som ska verifiera mot prod
pekar mot custom-domänen, aldrig mot deployment-URL:ens hash-alias.
Kräver punkten inloggning och agenten saknar prod-credentials, bokförs
den som öppen handover-punkt åt en människa — den löses inte genom att
byta URL-form, eftersom skyddet sitter på deploymentet, inte på
domänen som pekar dit.
