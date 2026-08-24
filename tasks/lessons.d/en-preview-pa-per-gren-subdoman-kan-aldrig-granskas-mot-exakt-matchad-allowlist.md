# En preview på per-gren-subdomän kan ALDRIG granskas mot en exakt-matchad CORS-allowlist — det är strukturellt, inte ett konfigfel

**Preview-deployer får ett nytt värdnamn per gren. En CORS-allowlist som
matchar `Origin` exakt kan därför per konstruktion aldrig innehålla det.
Kombinationen "preview-URL plus exakt-matchad allowlist" är ogranskbar oavsett
hur väl listan underhålls — och symptomet (`Failed to fetch`) ser ut som en
trasig yta i stället för en trasig väg.**

Instans (S108, 2026-08-24, Del 19 § B): tre led mättes var för sig.
(a) `npm run build` körs utan `--mode`, alltså Vites production-läge, alltså
`.env.production` — Vercels förhandsvisningar pratar med prod-miljön.
(b) `supabase/functions/_shared/cors.ts` rad 37–40 gör
`allowlist.includes(origin)`, och utan träff sätts ingen
`Access-Control-Allow-Origin`-header alls. (c) Previewens värdnamn är en
per-gren-subdomän av formen `miranon-media-ad-git-<hash>-…`. Slutsats:
granskning av en yta mot den miljön är omöjlig; `ADR-103 B2`:s
gransknings-steg går via dev-servern mot staging, eller efter landning.

**Det generella:** runbooken varnade ordagrant för klassen — *"Saknas
prod-origin här ser appen HELT DÖD ut för användaren — och
deploy-verifieringens curl-test upptäcker det INTE (curl skickar ingen
Origin-header)"* — och raden lästes samma dag utan att kopplas till
granskningen, därför att den var skriven om DEPLOY-verifiering. En varning bär
bara den kontext den skrevs i; grannkontexten måste skrivas ut separat för att
finnas. Två operativa följder: en allowlist med exakt matchning gör varje
efemär värdnamnsgenerator (preview-deploy, tunnel, dynamisk sandlåda)
strukturellt utestängd, och ingen `curl`-baserad kontroll kan upptäcka det
eftersom `curl` inte skickar någon `Origin`-header — bara en webbläsare kan.
