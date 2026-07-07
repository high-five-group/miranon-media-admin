# S59 — DIVERGENS: SYSTEMET.md strukturkandidater

> Bilaga till Session 59 (kartans steg 4b). Producerad i research→divergens-passet
> (S57 Del 5 beslut 5). Innehåll: research-syntes (3 spår) → 3 kompletta
> strukturkandidater (fullt §-skelett + utskriven provsektion var) → jämförelse
> och rekommendation. **Beslutsunderlag för Marcus-val (STOPPA).** Efter valet:
> den valda strukturen blir SYSTEMET.md i konvergens-passet; denna bilaga blir
> besluts-trail.

---

## DEL A — Research-syntes (3 spår, citerat)

Tre oberoende spår kördes parallellt. De **konvergerar** på tre mönster och
avtäcker **en spänning** med en tydlig upplösning.

### Spår A — ramverk (Diátaxis / arc42 / C4)

- **C4** (c4model.com): abstraktions-först zoom (Context→Container→Component→Code),
  "bygg bara nivåer som tillför värde". Enda ramverket byggt för EN topp-till-botten-zoom.
- **arc42** (arc42.org): 12-sektioners tailorbar mall. Relevanta operativa sektioner:
  Introduction & Goals, Constraints, Context & Scope, Runtime View (arbetsflöden),
  Glossary, ADR-länkar, Risks. Släpp Deployment.
- **Diátaxis** (diataxis.fr): läsar*behovs*-ramverk (4 lägen). Opererar på korpus-nivå,
  anti-dogmatiskt ("not four boxes"; "what matters most is the experience of the reader").

**Rekommendation spår A:** C4-nedstigning som **ryggrad**; arc42 som **täcknings-checklista**;
Diátaxis som **per-sektion skrivdisciplin** (led med förklaring/Gunilla → följ med
referens/mekanik, *typografiskt åtskilda*). Fallgropar: (1) C4-i-prosa tappar den spatiala
"vad-pratar-med-vad"-kartan → varje komponent måste ange sina kopplingar; (2) muddling på
*styckenivå* är den verkliga Diátaxis-synden (samlokalisera på sektionsnivå är OK);
(3) över-nesting — tvinga inte varje delsystem till konfig-nivå.

### Spår B — branschledar-precedent

| Precedent | Vad som är mätbart bra | Vad vi lånar |
|---|---|---|
| matklad **ARCHITECTURE.md** | "bird's-eye → codemap → invariants"; "only specify things unlikely to change"; namnge entiteter för symbol-sök | Led med fågelperspektiv-karta före all detalj |
| **rust-analyzer** architecture.md | Levande exempel; inline `Architecture Invariant:`-callouts vid exakt tillämpningspunkt | Greppbar inline-markör (modell för vår färskhetsmarkör) |
| **GitLab Handbook** | SSoT socialt+mekaniskt; per-sida DRI (ägare) + last-updated + review-cadence | Per-sektion ägare/last-verified — färskhet med ansvar |
| **Diátaxis** | Docs tjänar distinkta *behov*, ej publiker | Håll varje "läge" ett visuellt distinkt block |
| **Runbook-praxis** (rootly m.fl.) | Överlever genom verifierbar+exekverbar per steg | Verifierbarhets-primitiv per claim (= vår fil:rad) |

**Tre återkommande mönster:** (1) **top-down map först**; (2) **färskhet är en ägd, markerad
egenskap — aldrig ett hopp**; (3) **explicit scope / "vad detta INTE är"**.

### Spår C — intern inventering (nuläget mot disk)

Alla 9 komponenter verifierade mot primärkällor. **13 drift-punkter** i nuvarande
`docs/reference/systemet.md` — "stämpel-färsk men innehålls-stale" (T16-fenomenet).
De tyngsta (blir KRAV att fixa):

1. **Genomgående tre-aktörs-språk** (titel, §1, §4, §4.5, §6, §9) — hela poängen med 4b.
2. **§5 "de fem" disciplin-skills → faktiskt 15** (saknar paus/resume/grilling/grill-me/
   grill-with-docs/to-prd/to-issues/do-work/prototype/diagnosing-bugs).
3. **§5 asymmetri-tabell påstår paus/resume "Chat-only" → FALSKT** (båda är Code-plugin-skills
   nu, ADR-069). Farligaste faktafelet.
4. **MCP-lagret HELT frånvarande** (7 servrar: airtable, playwright, chrome-devtools,
   context7, google-drive, magic, nanobanana).
5. Plugin-version "1.4.0" → källa **1.12.0** / installerad **1.11.0**.
6. governing "12" → **14**; CI "3 jobb" → **5** (changed/lint/test/docs/ci-passed);
   prod-allowlist → **11**.
7. **Live distributions-gap (T18):** 1.12.0 källa ≠ 1.11.0 installerad, ingen 1.12.0-cache
   → källediten har inte propagerat; reinstall-kommandot fortfarande odokumenterat.
8. Saknade komponenter: MCP-lagret, Code-ytans konfiguration, backlog som förstklassigt
   substrat, samt lifecycle-sektionen missar ADR-069-supersessionen.

### Spänningen + upplösningen (styr alla kandidater)

Diátaxis säger "blanda inte lägen". Vi vill medvetet dubbelskikta (Gunilla + teknik) per
sektion (beslut 2). **Upplösning:** samlokalisera på *sektionsnivå*, separera *typografiskt*
(prosa-block vs tabell/ankar-block), muddla aldrig i samma stycke. Progressive disclosure
(NN/g) legitimerar: klartext först, referens on-demand. **Alla tre kandidater nedan bär
detta** + färskhets-kontraktet + §0-ordlista + "vad detta INTE är" + fil:rad-ankare +
ärlig inkonsekvens-lista (de branschledar-drag beslut 5 gjorde till KRAV).

**Fast innehålls-bas (9 komponenter, från spår C)** — samma i alla kandidater; det som
skiljer är ORDNING + organiserande lins: (1) aktörerna Code/Marcus · (2) hub/spoke ·
(3) plugin+15 skills · (4) governing+CI · (5) lifecycle · (6) trådar+backlog · (7) MCP ·
(8) Code-ytans konfig · (9) distribution.

---

## DEL B — De tre kandidaterna

Divergens-axeln = **organiserande princip**: skala (A) vs berättelse (B) vs katalog (C).
Alla tre är top-down (hedrar C4-nedstigning + "map först") och dubbelskiktade.

---

### KANDIDAT A — "GOOGLE MAPS" (C4-zoom som ryggrad)

**Koncept:** Läsaren zoomar från 30 000 fot ner till konfig-detaljen. Organiserande enhet =
*abstraktionsnivå*. Den mest bokstavliga läsningen av beslut 4 ("C4-nedstigning").

**§-skelett:**

- Frontmatter + färskhets-kontrakt + "vad detta är / INTE är / för vem"
- §0 Ordlista
- **§1 Systemvyn** (C4 nivå 1 — Context): hela systemet på en skärm — två aktörer, två träd,
  externa tjänster (GitHub, claude.ai, Airtable, MCP), pilarna mellan. EN karta.
- **§2 Containrarna** (C4 nivå 2): de körande boxarna — (2a) Code-ytan · (2b) hubben ·
  (2c) spoken · (2d) MCP-lagret · (2e) externa tjänster. Vad var + hur de pratar.
- **§3 Komponenterna** (C4 nivå 3): zoom in i varje container. Hub→konstitution/templates/
  plugin/15 skills. Spoke→CLAUDE/docs/governing/tasks/backlog. Code-ytan→loopen/STOPPA/
  skill-triggning. Lifecycle + substrat bor här.
- **§4 Konfigurationsdetaljen** (C4 nivå 4 — [TILLSTÅND]-tabeller): versioner, exakta listor,
  radnummer, distributions-gapet — allt flyktigt samlat på ETT ställe.
- §5 Appendix: slå-upp-karta + inkonsekvenser + ändringslogg
- Per §: "Vy uppifrån" (Gunilla) → "Mekaniken" (ankar-block).

**Styrka:** Arkitektoniskt renast; "var är jag" alltid besvarbar; allt flyktigt isolerat i §4
→ färskheten lätt att underhålla på ETT ställe. **Svaghet:** en komponent splittras över
nivåer (lifecycle-mekaniken i §3, dess config i §4) — vill man ha "allt om lifecycle" måste
man hoppa. C4-i-prosa-risken (spår A fallgrop 1) störst här.

**Provsektion (distribution), A-röst — bor i §4 som config-lager:**

> **§4.7 Distribution — hur en hub-ändring når Code-ytan**
>
> *Vy uppifrån.* Reglerna Code lyder bor i hubben. När vi ändrar en regel där måste
> ändringen "flyttas ut" till den kopia Code faktiskt läser — det sker inte automatiskt.
> Tills utflytten körts lyder Code den gamla kopian.
>
> *Mekaniken.* Marketplace = hub-repot självt (`marcus-system/.claude-plugin/marketplace.json`,
> `source: ./plugins/marcus-system`) [STABIL MEKANIK]. Käll-version och installerad version är
> två skilda tal:
>
> | Fält | Bor i | Värde | Markör |
> |---|---|---|---|
> | Käll-version | `plugin.json` | 1.12.0 | [AKTUELLT TILLSTÅND → via Code] |
> | Installerad | `~/.claude/plugins/installed_plugins.json` | 1.11.0 | [AKTUELLT TILLSTÅND → via Code] |
> | Cache på disk | `~/.claude/plugins/cache/marcus-hub/…` | 1.4.0–1.11.0 (ingen 1.12.0) | [AKTUELLT TILLSTÅND → via Code] |
>
> ⚠️ **Ärlig lucka (tråd T18):** käll ≠ installerad just nu → 1.12.0-ändringen har INTE
> propagerat, och det exakta reinstall-kommandot är inte disk-dokumenterat. Gå till T18 —
> gissa inte kommandot. [AKTUELLT TILLSTÅND.]

---

### KANDIDAT B — "EN DAG I SYSTEMET" (arbetsflöde-narrativ som ryggrad)

**Koncept:** Följ en session från födelse till stängning; varje komponent introduceras när
den först dyker upp i flödet. Organiserande enhet = *tid/berättelse*. Berättelsen ÄR
Gunilla-lagret.

**§-skelett:**

- Frontmatter + färskhets-kontrakt + "vad / INTE / för vem"
- §0 Ordlista
- **§1 Rollistan:** vad systemet är + de två aktörerna (innan berättelsen).
- **§2 Före arbetet:** de två träden laddas (symlänk, plugin, hub-bas + spoke-delta) — "var
  bor reglerna Code lyder".
- **§3 En session föds:** session-start → orientering → RAPPORTERA → sessionsdok-födelse.
- **§4 Arbetet körs:** Code-loopen (LÄS→…→VERIFIERA) → STOPPA-grindar → grindvakterna/CI som
  fångar fel → MCP-lagret Code når ut till.
- **§5 Kunskap fångas:** lessons → trådar → backlog-substratet → ADR:er.
- **§6 Sessionen stängs:** session-end → lifecycle-verben → paus/resume.
- **§7 Ändringen sprids:** hub→spoke-distribution → version-bump → T18-gapet.
- **§8 Appendix:** komponent-karta (alla delar oavsett var i berättelsen) + config-tabeller +
  inkonsekvenser + ändringslogg.
- Per steg: berättande prosa (Gunilla) → "Mekaniken bakom" (ankar-block).

**Styrka:** Mest Gunilla-vänlig — en berättelse lär ut genom att följa det verkliga arbetet;
starkast främlingstest. **Svaghet:** referens-uppslagning svårast (för "governing" måste man
veta att det dyker upp i §4); MCP + Code-konfig känns inklämda i tidslinjen → appendix bär
uppslags-bördan. Färskhet svårare (en komponent kan nämnas på flera ställen i flödet).

**Provsektion (distribution), B-röst — §7 som berättelse-steg:**

> **§7 Ändringen sprids — Code ändrade en regel i hubben. Vad händer nu?**
>
> Säg att vi förbättrar en disciplin-regel i hubben mitt i en session. Frestelsen är att tro
> att Code genast lyder den nya regeln. Det gör den inte. Code läser en *installerad kopia*,
> inte hubbens källa — och kopian uppdateras först när vi aktivt "flyttar ut" ändringen
> (bumpar versionen + installerar om). Tills dess kör Code den gamla regeln, helt omedvetet.
>
> Just nu är systemet mitt i ett sådant glapp: hubbens källa säger version 1.12.0, men den
> kopia Code kör är 1.11.0, och 1.12.0 finns inte ens nedladdad än.
>
> *Mekaniken bakom.* Marketplace = hub-repot (`marketplace.json`) [STABIL MEKANIK].
> Käll-version `plugin.json` = 1.12.0; installerad (`installed_plugins.json`) = 1.11.0; cache
> saknar 1.12.0 [AKTUELLT TILLSTÅND → via Code]. ⚠️ Det exakta reinstall-kommandot är
> odokumenterat — bärs av **tråd T18**, gissa inte. [AKTUELLT TILLSTÅND.]

---

### KANDIDAT C — "SYSTEMKARTAN" (komponent-katalog, arc42/rust-analyzer)

**Koncept:** Fågelperspektiv först, sedan EN sektion per komponent — en systematisk
referens-karta. Organiserande enhet = *komponent*. Evolution av nuvarande systemet.md
(bevarar dess beprövade drag, fixar drift, utökar).

**§-skelett:**

- Frontmatter + färskhets-kontrakt + "vad / INTE / för vem" (fågelperspektiv)
- §0 Ordlista
- **§1 Översikt** (bird's-eye: ett system, två aktörer + fångst-empirin)
- **§2 De två registren** (operativt vs identitet — bevarar tredelningen)
- **§3 Hub & spoke** (de två träden, EN konstitution i två lager)
- **§4 Rollerna i detalj** (Code-loopen, Marcus, STOPPA) + en arbetscykel-vinjett *(B:s
  berättelse injicerad här, där den lär mest)*
- **§5 Plugin & disciplin-skills** (15) + kapabilitets-skills (andra familjen)
- **§6 Lifecycle** (fyra verb, ADR-069) + **§7 Backlog-substratet** (eget, jämbördigt) +
  trådar
- **§8 Governing & CI** (tre lager) · **§9 MCP-lagret** (nytt) · **§10 Code-ytans
  konfiguration** (nytt) · **§11 Distribution** (+T18)
- **§12 Cross-cutting / invarianter**
- **§13 Appendix:** slå-upp-karta + inkonsekvenser + ändringslogg
- Per §: "I klartext" (Gunilla) → "Mekaniken" (ankar-block).

**Styrka:** Bäst för referens-uppslagning (en komponent = en sektion); lägst migrations-risk
(bygger på beprövad struktur); lättast att hålla färsk (komponent=sektion=ägare, GitLab-DRI-
mönstret); hedrar C4 via §1 bird's-eye + per-komponent-nedstigning. **Svaghet:** mindre
narrativt sug för en förstagångsläsare; fler sektioner (13) kan kännas som katalog snarare än
resa (mildras av §1 + §4-vinjetten).

**Provsektion (distribution), C-röst — §11 som fristående komponent:**

> **§11 — Distributions-mekaniken**
>
> *I klartext.* Hubben är källan till reglerna; Code läser en installerad kopia. En ändring i
> källan når inte Code av sig själv — någon måste "flytta ut" den (bumpa version + installera
> om). Tills dess lyder Code den gamla kopian. Det är därför en hub-förbättring kan kännas
> "osynlig" ända tills utflytten körts.
>
> *Mekaniken.* Marketplace = hub-repot självt (`marcus-system/.claude-plugin/marketplace.json`,
> `name: marcus-hub`, `source: ./plugins/marcus-system`) [STABIL MEKANIK]. Tre versionstal
> lever separat [AKTUELLT TILLSTÅND → via Code]: källa `plugin.json`=1.12.0 · installerad
> `installed_plugins.json`=1.11.0 · cache saknar 1.12.0.
>
> ⚠️ **Ärlig lucka (tråd T18).** Käll ≠ installerad → 1.12.0 har inte propagerat; det exakta
> reinstall-kommandot är inte disk-dokumenterat (`spoke-CLAUDE.md` noterar bara att
> scope-migrering inte går via plugin-CLI:t, Anthropic-issue #38271). Gå till T18 — gissa
> inte. [AKTUELLT TILLSTÅND.]

---

## DEL C — Jämförelse + rekommendation

| Dimension | A — Google Maps | B — En dag | C — Systemkartan |
|---|---|---|---|
| Organiserande enhet | Abstraktionsnivå (zoom) | Tid (berättelse) | Komponent (katalog) |
| Bokstavlig mot beslut 4 (C4) | ★★★ (mest) | ★ | ★★ (via §1 + nedstigning) |
| Främlingstest / Gunilla | ★★ | ★★★ (starkast) | ★★ |
| Referens-uppslagning | ★★ | ★ | ★★★ (starkast) |
| Färskhets-underhåll | ★★★ (config isolerad §4) | ★ (utspridd) | ★★★ (komponent=sektion) |
| Migrations-risk (från nuvarande) | ★★ | ★ (störst omskrivning) | ★★★ (lägst) |
| Risk för C4-i-prosa-tapp | störst | minst | medel |

**Min rekommendation: KANDIDAT C**, av tre skäl grundade i research + inventering:

1. **Felläget vi bekämpar är drift, inte obegriplighet.** Spår C fann 13 stale-punkter — det
   verkliga hotet är att doket åldras osant. C:s komponent=sektion=ägare (GitLab-DRI-mönstret,
   spår B) gör färskhet underhållbar; en drivande drift-punkt landar i exakt en sektion.
2. **Användningen är referens.** spoke-CLAUDE säger "slå upp on-demand när du behöver systemets
   mekanik". Det är uppslags-bruk → C:s per-komponent-sektioner vinner (spår A: Diátaxis =
   tjäna *behovet*; behovet här är reference).
3. **Lägst risk, hedrar ändå C4 + Gunilla.** C bevarar nuvarande doks beprövade drag (noll
   rigor-förlust, L250-vakten), fixar de 13 drift-punkterna, hedrar C4 via §1 bird's-eye +
   per-komponent-nedstigning, och injicerar B:s berättelse där den lär mest (§4-vinjetten).

**A** är det renaste valet om du värderar arkitektonisk elegans över uppslags-ergonomi.
**B** är djärvast och bäst om främlingstestet/Gunilla är det överordnade målet — men betalar i
uppslagning + färskhets-underhåll. **C** tar B:s bästa (berättelse-vinjett) och A:s bästa
(bird's-eye + isolerbar färskhet) utan deras svagheter.

**Öppen not (beslut 4):** beslut 4 sa "C4-nedstigning" — det pekar bokstavligt mot A. C hedrar
C4 men underordnar det komponent-katalogen. Om C väljs förfinar vi beslut 4 öppet (ett låst
beslut är inte immunt mot evidens; rivs med kvittens, ej tyst). Detta är ditt val.
