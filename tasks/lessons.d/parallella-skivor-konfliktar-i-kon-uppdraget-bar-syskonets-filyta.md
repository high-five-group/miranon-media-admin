# Parallella skivor med gemensam filyta konfliktar i KÖN, inte i bygget — uppdraget mot en olandad syskongren bär syskonets filyta och ancestor-testet

**Två agenter som rör samma filer bygger båda grönt och märker ingenting;
kollisionen dyker upp först när den andra posten ska mergas. Startas ett
uppdrag medan en syskonskiva ännu inte landat ska uppdraget bära två saker:
syskonets FILYTA namngiven, och instruktionen att utgå från syskongrenen om
`git merge-base --is-ancestor` faller. Då löser agenten kollisionen själv,
före kön.**
`[UNIVERSAL]`

Instans (S108, 2026-08-23, Del 15 § C punkt 3): skiva 3 (`#1877`) och skiva 2
(`#1874`) delade `field-allowlists`, `CONTRIBUTING.md` och purge-policyn.
Agenten löste det på egen hand med rebase och `--force-with-lease`, eftersom
uppdraget pekade ut den parallella skivans filyta. Formen användes **tre
gånger** i samma pass (skivorna 4, 5 och 6) med **noll omstarter**.

**Det generella:** merge-kön bygger varje post mot `main` plus posterna före
den, så den löser mekaniska konflikter — men den löser dem SENT, en post i
taget, och en fällning där kostar en hel köcykel plus en väckt agent som redan
rapporterat klart. Informationen som krävs för att lösa dem tidigt är gratis
att ge: orkestreraren VET vilka skivor som är i luften och vilka filer de rör,
agenten kan omöjligt veta det — den ser varken sina syskon eller deras grenar.
Ancestor-testet är det billiga beslutskriteriet, för det svarar "ligger
syskonets arbete redan under mig?" utan att agenten behöver förstå syskonets
innehåll. Regeln generaliserar till varje fan-out där posterna delar filyta:
namnge ytan i uppdraget, och ge ett mekaniskt test för när basen ska bytas.
