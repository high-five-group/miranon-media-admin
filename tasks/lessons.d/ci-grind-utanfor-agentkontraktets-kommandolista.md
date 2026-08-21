# En CI-grind som saknas i agentkontraktets kommandolista fäller agent efter agent — kontraktet är verifieringens yta, inte ci.yml

**En grind som körs i CI men varken finns i ett npm-script eller i
`.claude/agents/bygg-agent.md`:s verifieringslista är osynlig för varje
bygg-agent som följer kontraktet. Agenten kan då ha ALLA sina föreskrivna
grindar gröna och ändå pusha rött — och felet ser ut som slarv fast det är en
kontraktslucka. Mät alltid en röd CI mot vad agenten FICK i uppdrag att köra
innan den klassas som agentens miss.**

Mätt 2026-08-21 (S109 våg 1, fem parallella bygg-agenter). Fyra av dem rörde
`src/`; **två av de fyra** föll på samma grind i samma runda:

| PR | Kort | Träffar |
|---|---|---|
| `#1707` | `TASK-285.2` | 1 långt streck, `src/components/primitives/MessageBox.tsx:114` (dev-throw-strängen) |
| `#1703` | `TASK-285.3` | 4 långa streck, `src/routes/dev/primitives.tsx` (JSX-text i demo-sektionen) |

Grinden är `node scripts/check-langa-streck.mjs`, wirad direkt i `ci.yml`s
`Lint + Audit + TypeCheck`. Verifierat med `grep`: den finns **varken i
`package.json` eller i `scripts/check-docs.sh`**, och stod inte i
bygg-agent-kontraktets lista (`npm run check:docs` · `typecheck` · `biome
check .` · `build` · `test:api`).

Båda agenternas lokala grindar var faktiskt gröna — orkestreraren mätte om dem
på deras egna grenar (`typecheck` exit 0, `biome check .` exit 0 med noll
errors, `audit-ci` exit 0 på `main`) innan någon slutsats drogs. Utan den
mätningen hade två korrekt arbetande agenter fått en felaktig premiss-rättelse
i sitt uppdrag, och nästa våg hade ärvt den.

**Varför `verify:ci-parity` inte täcker hålet i praktiken:** verktyget hade
fångat det — det YAML-parsar `ci.yml` och kör dess `run:`-block verbatim — men
det är per `ADR-036` § Updates ett DIAGNOSVERKTYG, uttryckligen inte en
per-push-rutin (910,7 s mot CI:s 401,0 s; ~30× kostnaden av besparingen). Ett
verktyg som bara får plockas fram i tre namngivna lägen kan inte vara den
mekanism som håller den dagliga kommandolistan sann.

**Det generella (UNIVERSAL):** när en grind läggs till i CI utan att samtidigt
läggas till i den yta utförarna faktiskt läser, uppstår en tyst
verifieringslucka som skalar med antalet parallella utförare — fem agenter ger
fem chanser att falla på den, inte en. Kostnaden syns först som "agenten
slarvade", vilket är den dyraste feldiagnosen: den lagar fel sak.
Motmedlet är att grindens hemvist är EN yta som både CI och kontraktet läser,
eller — när det inte går — att tillägget i CI och tillägget i kontraktet är
samma landning.
