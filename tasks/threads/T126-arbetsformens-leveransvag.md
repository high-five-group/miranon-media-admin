---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-06
status: stable
lifecycle: active
---

# T126 — Arbetsformens regler når inte den som kom in genom en annan dörr

> **Registrerad** 2026-08-06 (S93, iterationsvåg 4) på Marcus order:
> *"Det här med att iterations-kadensen inte bet/funka, ska inte vara en
> lesson. Det ska bli en tråd. Rotorsak ska hittas och lösningen ska
> mekaniseras eller fixas så det aldrig blir en fråga igen."*

## Vad som hände, mätt

Marcus, 2026-08-06: *"Varför pushar du varje iterationsrunda? Det är väl inte
standardprocedur? […] Jag har påtalat det här förut men de åtgärder vi införde
då verkar ju inte bita alls."*

Under iterationsvåg 3 pushades och armerades en PR per iterationsvarv, i stället
för lokal commit per varv och EN push när Marcus är nöjd. Det är andra gången
samma sak påtalas.

## Åtgärden fanns — och lästes aldrig

Efter förra instansen (`T116`, S96, `TASK-127.2`) skrevs regeln in i
`prototype`-skillens § 5 *Iterations-kadensen*, verbatim:

> commit/push/CI ger noll under iterationen. **Per varv: lokal commit, ingen
> push** (checkpoint + ångerknapp, ~1 s). **Push + PR EN gång**, när Marcus
> säger klart

Texten bär till och med mätningen som motiverade den — `#664` 15 min i kön,
`#666` 20 min, 10–30 min per varv för sekunders arbete — plus Marcus citat
*"Vad är det som tar sådan tid???? Så här kan vi inte hålla på vid
iteration!!!"*.

**Regeln var alltså korrekt, färsk, mätunderbyggd och specifik. Den lästes
aldrig.**

## Rotorsak — MÄTT (2026-08-07, `TASK-149.2`)

> **Klassning:** HYPOTES → **MÄTT**. Prövad mot fyra oberoende artefakter av en
> aktör skild från den som formulerade hypotesen (kravet i ursprungstexten
> nedan). Ingen av de fyra motsäger hypotesen — samtliga bekräftar den.

Sessionen kom in i arbetet via `session-resume` → HANDOFF-block → Marcus
punktlista. Ingen av de vägarna laddar `prototype`-skillen. Utföraren byggde i
rätt scope, mot rätt fil, med rätt kvalitetsribba — och fel kadens, utan att
någon gång passera texten som definierar kadensen.

Den generella formen, bekräftad nedan: **vi placerar arbetsformens regler i
den skill som STARTAR arbetsformen, men arbete återupptas oftare än det
startas.** Resume, handoff, "fortsätt där vi var", en ny punktlista i en
pågående tråd — varje sådan väg in hoppar över startdörren och därmed över
reglerna. Ju längre ett arbete lever, desto större andel av dess varv körs av
någon som aldrig såg dem.

### Belägg 1 — `session-resume`s SKILL.md refererar aldrig `prototype` eller någon arbetsform-regel

Källa: `~/.claude/plugins/cache/marcus-hub/marcus-system/1.29.0/skills/session-resume/SKILL.md`
(aktiv installerad version, verifierad mot `~/.claude/plugins/installed_plugins.json`:
`marcus-system@marcus-hub` → `1.29.0`). `grep -in "prototype\|arbetsform\|kadens\|iteration"`
mot filen ger **noll träffar på `prototype` eller `arbetsform`**. De tre
träffarna på "kadens" är en ANNAN axel — `todo-kadensraden (L67)` och
`landnings-kadens` — dokets synk-disciplin, inte iterations-kadensen § 5.

Vad resume-proceduren faktiskt läser, verbatim ur skillens `## Procedur`
(steg 1, 2 och 4 av sju totalt — steg 3/5–7 rör numrering/parallellitet/
monitor och är obesläktade, därför uteslutna ur citatet):

> **Steg 1:** "Kör session-startens LÄS-fas (hub-rutin + ev. spoke-utvidgning
> i `session-start`-skillen: läs-ordning, repo-state, audit-grind,
> `git pull`)."
>
> **Steg 2:** "Lokalisera sessionsdoket: doket med `lifecycle: paused` i
> `tasks/sessions/`-roten; läs `## PAUSLÄGE`-rubriken +
> HANDOFF-blocket i sin helhet."
>
> **Steg 4:** "Rekonstruera läget: … korsläs HANDOFF-blocket mot
> todo-kadensraden (L67) och BUILD-LOG."

Steg 1 pekar vidare till `session-start`s LÄS-fas — kontrollerad separat:
samma `grep` mot `session-start/SKILL.md` ger noll träffar på `prototype`
eller `arbetsform` (enda träffen på "iteration" gäller en formaterings-/
lint-grindloop, obesläktad). Läskedjan `session-resume` → `session-start`s
LÄS-fas → HANDOFF/todo/BUILD-LOG innehåller alltså **ingen nod** som läser
eller laddar `prototype`-skillen.

### Belägg 2 — `prototype`-skillens trigger matchar inte en resume-prompt strukturellt

Källa: samma pluginversions `skills/prototype/SKILL.md`-frontmatter,
verbatim:

> "Bygg en kastbar prototyp som besvarar EN specifik, nedskriven fråga —
> frågan avgör formen. LOGIC-grenen är en interaktiv terminal-app som driver
> en tillståndsmodell genom svåra fall; UI-grenen är TVÅFAS (stående
> arbetsform, T66) — divergens (tre radikalt olika varianter växlingsbara på
> en route → Marcus väljer EN) + konvergens (vinnaren itereras till helt
> nöjd; befintlig yta startar som EXAKT kopia av faktiska vyn), återkommande
> vid senare ändringsbehov. Svaret är produkten, koden kastas eller
> absorberas per throwaway-kontraktet. **Körs som eget litet pass FÖRE
> spec** — svaret matar PRD-kortet/grillningen."

Till skillnad från t.ex. `first-principles`/`llm-council` bär beskrivningen
INGEN explicit `MANDATORY TRIGGERS`-lista med fraser. Skill-laddning matchar
den löpande beskrivningen mot den AKTUELLA prompten. Beskrivningens implicita
avfyrnings-kontext är **att starta** ett nedskrivet-fråga-pass FÖRE en spec
— inte att fortsätta ett redan pågående. En resume-prompt av S93:s form
("ta emot Marcus nästa iteration", en punktlista i en redan etablerad
divergens/konvergens-våg) ber INTE om att "bygga en kastbar prototyp som
besvarar EN fråga körd FÖRE spec" — den ber om att fortsätta ett facit som
redan existerar. Strukturellt matchar den alltså inte beskrivningens
triggerytor, och skulle inte ha laddat om skillen ens om systemet försökt
matcha på fri text. Detta är samma mekanism-gap som Belägg 1 visar på
skill-referens-nivå, bekräftat på trigger-matchnings-nivå.

### Belägg 3 — S93-sessionsdokets egen bokföring

Källa: `tasks/sessions/archive/2026-08/2026-08-02-session-93.md`, `grep -n "kadens"`,
rad 585–588 (sessionens EGEN, samtida bokföring — inte en efterhandskonstruktion):

> "Regeln fanns ordagrant i `prototype`-skillens § 5 *Iterations-kadensen*,
> skriven efter förra instansen (`T116`, `TASK-127.2`) och komplett med
> mätningen som motiverade den. **Den lästes aldrig** — sessionen kom in via
> `session-resume` → HANDOFF → punktlista, en kedja där skillen inte
> laddas."

Sessionen som begick felet bokförde alltså SJÄLV, i realtid, samma kedja
som Belägg 1–2 verifierar strukturellt mot disk i efterhand. Tre oberoende
källor (skillens egen text, dess trigger-mekanik, sessionens samtidiga
loggföring) konvergerar på samma orsak.

### Generalisering — prövad mot två andra arbetsform-regler (AC 2)

Frågan: bor `prototype` § 5 ensam på detta sätt, eller är mönstret bredare?
Två andra regler, båda föreslagna i uppdraget, kontrollerade mot disk:

**Grilling-kärnans regler (ADR-baren, STOPPA-OCH-FRÅGA, GRILLNING-normalstart)
— INTE startdörrs-bundna, har en ANDRA bärare.** Källa:
`skills/grilling/SKILL.md` § "ADR-baren": *"Hemvist (S47 Del 10 beslut 5):
denna sektion är barens kanoniska fulltext. Kortformen bor som NÄR-rad i
hub-CLAUDE.md § 'Instruktioner — Alltid gäller'."* Samma dubbel-bärarmönster
gäller STOPPA-OCH-FRÅGA-konventionen och GRILLNING-normalstart-regeln — båda
finns ordagrant i hub-`CLAUDE.md`. Skillnaden mot `prototype` § 5: `CLAUDE.md`
laddas av HARNESSET vid varje sessionsstart, oavsett vilken skill (om någon)
som matchar prompten — det är INTE en skill-trigger-matchning. **Belägg
förstahand:** denna byggagent-session invokerade aldrig `session-start` eller
`grilling`, och fick ändå hub- + spoke-`CLAUDE.md` i sin helhet som
system-reminder vid sessionsstart (synligt i denna sessions egen
konversationshistorik). Reglerna når alltså en resume:ad (eller vilken som
helst) utförare via en bärare som är oberoende av skill-trigger-matchning.

**Session-paus-kravet — DELAT utfall, en del mekaniserad, en del inte.**
Källa: `skills/session-paus/SKILL.md` § 2, den FÖRANKRADE rubrik-formen
(`## PAUSLÄGE — Session <N> pausad`) + `lifecycle:`-enum-kravet. Denna del
HAR en mekanisk bärare oberoende av skill-laddning:
`scripts/check-lifecycle.sh`, invokerad som grind 6 ("Lifecycle på
sessionsdok + trådkort") i `scripts/check-docs.sh:232` och därmed körd av
`npm run check:docs` samt i `.github/workflows/ci.yml` och `nightly.yml` —
en felformaterad paus-skrivning FÄLLS vid landning oavsett om
`session-paus`-skillen någonsin lästes. **Men** samma skills operativa steg
— stoppa heartbeat-monitorn (`TaskStop`), släpp ägarlappen
(`katalogagarskap-markor.sh --slapp`), städa worktrees
(`stada-worktrees.sh`) — saknar VARJE mekanisk eller CLAUDE.md-bärare; de
existerar ENBART som prosa i skillens `## Procedur`. Dessa steg är i SAMMA
riskklass som `prototype` § 5: nås bara av den väg som explicit laddar
`session-paus`. Skillnaden mot T126:s ursprungsfall är att ingen instans av
detta ännu är OBSERVERAD (session-paus triggas av "pausa"-verbet, inte av
resume) — men den strukturella sårbarheten är identisk, och bokförs här som
fynd snarare än ny tråd (se `tasks/threads/README.md`-noten om att status
inte ändras av detta kort).

**Slutsats av generaliseringen:** mönstret är INTE unikt för `prototype` § 5,
men det är heller inte universellt — det uppstår specifikt när en regels
ENDA bärare är prosa i en skill vars trigger inte matchar
återupptagnings-vägen. Regler med en ANDRA bärare (alltid-laddad `CLAUDE.md`,
eller en mekanisk CI-/lokal grind) undviker klassen strukturellt. Detta
matchar `TASK-149`-PRD:ns "facit-modell": grindklassens dubbla bärare
(kort-DoD + agentfil) är precis den formen som gör en regel oberoende av
inträdesväg. En fullständig inventering av ALLA arbetsform-regler efter
bärarklass är `TASK-149.6`, utanför denna skivas scope (AC 2 kräver
"minst två", inte en fullständig katalog).

## Varför detta INTE är en lesson

Marcus beslut, och det är rätt klassning: en lesson dokumenterar ett mönster för
den som råkar läsa den. Men läsning är exakt det som fallerade — en lesson om
att regler inte nås är självmotsägande som åtgärd. `T119` har redan visat att
regler i prosa bryts av färska kontexter; att lägga till ännu en prosa-post är
att upprepa det den posten beskriver.

Kravet är därför **mekanisering eller strukturell fix**, inte dokumentation.

## Åtgärdsriktningar (EJ beslutade, EJ designade)

- **(a) Spärr vid handlingen.** `PreToolUse`-hook som nekar `git push` när
  villkoren för ett pågående iterationsvarv är uppfyllda. Denna instans har
  ovanligt tydliga signaler att haka på: filer märkta `[PROTOTYPE]`, commits med
  prototyp-prefix på grenen, och en körande dev-server. Klass: `T119`-lagret (1),
  icke-kringgåbar exekveringspunkt som prövar FORM billigt.
- **(b) Leveransväg via handoffen.** Paus-/resume-blocket bär en explicit
  ARBETSFORM-rad som resume läser upp. Billigare än (a), men fortfarande prosa —
  den flyttar bara leveransen, mekaniserar den inte.
- **(c) Skill-laddning som del av resume.** Resume identifierar pågående
  arbetsform ur handoffen och laddar motsvarande skill. Löser klassen bredare än
  (a), men kräver att arbetsformen är maskinläsbart deklarerad någonstans.
- **(d) Flytta regeln till en alltid-laddad yta** (spoke-`CLAUDE.md` eller output
  style). Enklast, men den ytan har en budget — allt kan inte bo där, och varje
  tillägg gör resten mindre läst.

Ingen av dem är vald. Riktningarna är dessutom inte ömsesidigt uteslutande:
(a)+(b) är en trolig kombination om `T119`s tre-lagers-doktrin följs.

## Nästa steg

1. ✅ **KLART (`TASK-149.2`, 2026-08-07).** Hypotesen prövad mot faktiskt
   tillstånd av en aktör skild från den som formulerade den — se
   § "Rotorsak — MÄTT" ovan. `prototype` laddas verkligen aldrig av
   `session-resume` (eller den `session-start`-LÄS-fas den anropar); ingen
   annan väg in i samma arbetsform hittad som når regeln.
2. **Delvis klart.** Två andra arbetsform-regler (grilling-kärnan,
   session-paus-kravet) kontrollerade för samma leveransgap — se
   § "Generalisering" ovan. Mönstret är verkligt men inte universellt: det
   uppstår när en regels ENDA bärare är en skills prosa och den skillens
   trigger inte matchar återupptagnings-vägen. En FULLSTÄNDIG inventering av
   alla arbetsform-regler efter bärarklass är utanför denna skivas scope —
   se `TASK-149.6`.
3. **Välj mekanism** (Marcus) och bygg den — `TASK-149.1` (ADR-097),
   `TASK-149.3` (tillståndsfil + push-hook), `TASK-149.4`
   (hub-integrationen).
4. **Bevisa tvåsidigt** — och kom ihåg `CLAUDE.md` § *En ny hook kan ALDRIG
   skarpbevisas i sessionen som byggde den*, om (a) väljs.

## Öppen skuld i samma familj, ej åtgärdad

En parkerad PR måste sättas till draft för att inte larma som armerings-kandidat
var 90:e sekund. Den regeln lever nu i exakt samma form som den denna tråd
handlar om: prosa, i ett lessons-fragment
(`tasks/lessons.d/parkerad-pr-utan-draft-ar-oskiljbar-fran-glomd.md`), utan
mekanism. Den bör tas med när formen väljs.

## Besläktad

`T119` (mekaniserings-programmet — regler i prosa bryts av färska kontexter;
denna tråd är en instans med en identifierad leveransväg-orsak) ·
`T116`/`TASK-127.2` (förra instansen av samma kadens-fel, vars åtgärd är den som
inte bet) · `T110` (orkestrerarens felklasser) · `ADR-090` (samma klass: regel
utan leveransväg till utföraren, senare mekaniserad som hook).

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
**Arbetsformens regler når inte den som kom in genom en annan dörr.** Registrerad 2026-08-06 (S93) på Marcus order: *"Det här med att iterations-kadensen inte bet/funka, ska inte vara en lesson. Det ska bli en tråd. Rotorsak ska hittas och lösningen ska mekaniseras eller fixas så det aldrig blir en fråga igen."* **ANDRA INSTANSEN av samma fel:** en PR pushades och armerades per iterationsvarv i stället för lokal commit per varv + EN push när Marcus är nöjd. Marcus: *"Jag har påtalat det här förut men de åtgärder vi införde då verkar ju inte bita alls."* **ÅTGÄRDEN FANNS OCH LÄSTES ALDRIG:** efter förra instansen (`T116`, S96, `TASK-127.2`) skrevs regeln in i `prototype`-skillens § 5 *Iterations-kadensen*, komplett med mätningen som motiverade den (`#664` 15 min i kön, `#666` 20 min, 10–30 min per varv för sekunders arbete). Den var korrekt, färsk, mätunderbyggd och specifik. **ROTORSAKS-HYPOTES (ej bekräftad):** sessionen kom in via `session-resume` → HANDOFF → Marcus punktlista, en kedja där `prototype`-skillen aldrig laddas — vi placerar arbetsformens regler i den skill som STARTAR arbetsformen, men arbete ÅTERUPPTAS oftare än det startas, och varje sådan väg in hoppar över startdörren. Hypotesen är formulerad av samma aktör som begick felet och ska prövas mot disk innan något byggs. **VARFÖR INTE EN LESSON:** läsning är exakt det som fallerade, så en prosa-post om att prosa inte nås är självmotsägande som åtgärd — kravet är mekanisering eller strukturell fix. **ÅTGÄRDSRIKTNINGAR (ej beslutade):** (a) `PreToolUse`-spärr på `git push` under pågående iterationsvarv — ovanligt tydliga signaler finns (`[PROTOTYPE]`-märkta filer, prototyp-commits på grenen, körande dev-server) · (b) explicit ARBETSFORM-rad i handoffen som resume läser upp · (c) resume laddar skill utifrån deklarerad arbetsform · (d) flytta regeln till alltid-laddad yta. **ÖPPEN SKULD I SAMMA FAMILJ:** draft-regeln för parkerade PR:er lever nu i exakt samma form (prosa i ett lessons-fragment, ingen mekanism) och bör tas med när formen väljs. Besläktad: `T119` (mekaniserings-programmet — denna är en instans med identifierad leveransväg-orsak) · `T116` (förra instansen, vars åtgärd inte bet) · `T110` · `ADR-090`

**Ingång (fullständig, ursprunglig):**
[`T126-arbetsformens-leveransvag.md`](T126-arbetsformens-leveransvag.md)
