# ADR-085: Hubbens tasks/lessons.md delas i volymer — tunt index + frysta volymer + en aktiv volym

- Status: Accepted (2026-08-01)
- Datum: 2026-08-01
- Fas: post-S91 restlista, `TASK-105`

> **Om beslutsvägen — bokförd öppet.** Marcus beslutade 2026-08-01 att
> uppdelningen skulle utföras och delegerade formvalet explicit: *"Du avgör vad
> som blir bäst och mest branschledarmässigt."* Formvalet gjordes av
> `TASK-105`:s bygg-agent under den delegationen, prövat mot web-researchade
> precedenter (§ Precedenter). Noteras av samma skäl som i
> [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md),
> [ADR-081](ADR-081-nummer-tilldelas-vid-landning.md) och
> [ADR-084](ADR-084-granskningsfixturens-livstid-aldrig-purge-bar.md): en
> läsare ska kunna se vem som vägde, inte bara vad som beslutades.
>
> **Varför denna ADR bor här och inte i hubben:** universella ADR:er bor i
> spokens `docs/decisions/` trots att de styr hub-artefakter — hubben har noll
> egna ADR:er (SYSTEMET.md § pre-existing-noteringen, S47).

## Kontext

`marcus-system/tasks/lessons.md` — hubbens enda lessons-artefakt — passerade
claude.ai-projektkunskapens ~5 000-radersgräns i **ett** lyft: 3 744 → 5 507
rader när spoke-raderna L284–L359 (72 poster, 22 sessioner) hub-lyftes
2026-07-31. Registrerat med full mätning i `TASK-105`: 110 H2-sessionsblock,
342 H3-poster, 40 `[[Lnnn]]`-wikilänkar + 500 `Knn.n`-referenser = 540 interna
pekare.

**Synk-frågan (kortets AC #1), mätt mot disk:** hubbens `README.md` § Två
läsare utpekar claude.ai-projektkunskapen som Marcus läsyta för hubben, och
hubbens `CLAUDE.md` § Verktygsfakta bär ~5 000-radersregeln som hub-fakta.
Ingen ADR-048-motsvarande exkluderingshorisont finns i hubben — ingen
dokumenterad undantagslista tar `tasks/` ur synken. Live-fillistan i
claude.ai-projektet är inte nåbar från byggmiljön (ingen MCP mot
claude.ai-projekt); det är mätningens gräns och skrivs ut i stället för att
antas bort. Marcus beslut 2026-08-01 att utföra uppdelningen stängde
nej-grenen oavsett.

**Tillväxten, mätt ur git-historiken** (`git log --numstat`, 2026-05→07):
normaltakt 400–800 rader/månad; värsta enskilda lyft +1 764 rader
(skuld-lyftet 2026-07-31). Dimensioneringen måste tåla ett lyft i den klassen
utan att spränga gränsen.

## Beslut

Volymmodellen — Node.js-changelogens form:

1. **`tasks/lessons.md` blir ett tunt index** (~60 rader): volymtabell (span,
   innehåll, K-rymd, status), uppslagsregel, append-regel, rotationsregel.
   Ingen lärdomstext bor i indexet.
2. **Innehållet bor i `tasks/lessons/vol-NN.md`**, delat vid H2-gränser i
   befintlig ordning, kroppar bevarade **verbatim**: vol-01 (775 r,
   ursprungs-eran före K-numreringen), vol-02 (1 890 r, `K6.5.1`→`K51.2`),
   vol-03 (1 126 r, `K35.1`→`K67.3`), vol-04 (1 782 r, `K69.1`→`K91.6` —
   hub-lyftet L284–L359).
3. **Stängda volymer är frysta** — nya block tillkommer aldrig; rättelser görs
   i posten där den bor, som synlig ändring.
4. **En aktiv volym tar emot alla nya lyft** (vol-05 från 2026-08-01, startar
   tom). Hub-lyft skriver H2-block SIST i den aktiva volymen — aldrig i
   indexet, aldrig i en stängd volym.
5. **Rotation:** är den aktiva volymen > 3 000 rader när ett lyft börjar
   skapas nästa volym FÖRE lyftet. 3 000 + 1 764 (värsta mätta lyft) < ~5 000.
   Normala lyft rör aldrig indexet — bara rotation gör det, vilket minimerar
   driftrisken index↔delar som kortet flaggade för alternativ 4.
6. **Volymfiler byter aldrig namn** — därför `vol-NN`, inte datumspann i
   filnamnet (den aktiva volymens slutdatum är okänt tills rotation; ett
   namnbyte vid stängning hade rivit länkar).
7. **Proceduren följer med i samma landning:** `lessons-hub-sync` (lyft-mål =
   aktiv volym + rotationssteg, § Hub-sync-format, § Källor) och
   `phase-end-verify` uppdaterade, plugin 1.24.0 → **1.25.0**, installerat via
   `claude plugin update` i landningen. Nästa-lediga-nummer-regeln och
   fragment-vägen (ADR-081) rör spokens fil och är opåverkade.

Implementation: hub-PR #11, merge-SHA `f3ab954caa1282304d5e5623e28e8cf0fe2a107c`.

## Precedenter (web-research 2026-08-01)

1. **Node.js** — huvudprecedenten: rot-`CHANGELOG.md` är index; innehållet bor
   i `doc/changelogs/CHANGELOG_V*.md`; historiska poster pekas ut med *"Moved
   to doc/changelogs/…"*-länkar; nya poster skrivs i den aktuella versionens
   fil (`github.com/nodejs/node`, `CHANGELOG.md`).
2. **ADR-praxis** (Nygard 2011, adr-tools, `adr.github.io`): en fil per record +
   index, sekventiell numrering. Prövad som helhetsform och förkastad — se
   Alternativ 6.
3. **Keep a Changelog** discussion #529 + issue #7: stora projekt delar per
   version/år och behåller huvudfilen som index; Symfony (`CHANGELOG-x.y.md`)
   och GitLab (gitlab-org/gitlab#18526) citeras som skarpa exempel.

## Alternativ som övervägdes

Kortets fem registrerade, plus formvarianten som precedent 2 väcker:

1. **Kronologisk delning utan index** (arkivfil + aktiv fil) — förkastad:
   lämnar "vilken fil ligger K67.1 i?" obesvarad. Indexets volymtabell med
   K-rymd-kolumn ÄR svaret; utan den betalas uppslagskostnaden vid varje
   läsning i stället för en gång vid delningen.
2. **Domändelning** (CI, prompt-design, arkitektur, …) — förkastad:
   omdömes-snitt per 342 poster med suddiga, driftande klassgränser; river
   dessutom H2-sessionsblocken som är lyft-procedurens append-enhet och
   commit-trail-bärare.
3. **Fragment-katalog i hubben** (spegla ADR-081:s `lessons.d/`) — förkastad
   med kortets eget skäl: löser skrivkonflikt, inte filstorlek — den
   konsoliderade filen växer ändå.
4. **Index + delfiler** — **vald**, i volymform med driftrisken hanterad:
   indexet bär endast volymmetadata (aldrig per-post-data), och normala lyft
   rör det inte alls.
5. **Acceptera oindexerbarheten + rätta hubbens CLAUDE.md** — prövad på
   riktigt, som kortet krävde, inte avfärdad: mätningen ovan visar att hubbens
   dokumenterade läsmodell har två läsare, och claude.ai-projektkunskapen är
   Marcus-sidans yta. Att göra hubbens enda lessons-artefakt oläsbar för den
   ena läsaren bryter README-regeln *"Claude Code ska veta minst lika mycket
   som Marcus"* i dess spegelriktning. Marcus avgjorde dessutom vägvalet
   explicit 2026-08-01: uppdelning utförs.
6. **En fil per lesson** (ADR-formens direktöversättning, 342 filer) —
   förkastad: systemets append-enhet är H2-sessionsblocket (H2 + källrad +
   commit-trail + posterna, per lessons-hub-sync § Hub-sync-format), inte den
   enskilda posten. Per-post-filer river blockformatet och dess commit-trail,
   gör varje lyft till 5–15 filskapelser + indexunderhåll, och K-numren är
   sessionsbundna (`K91.3`), inte en monoton global sekvens som ADR-formen
   förutsätter. En fil per RECORD i det här systemet vore en fil per
   H2-block — 110 mikrofiler — vilket är volymmodellen med sämre
   granularitet och utan dess läsbarhet.

## ADR-bar-prövningen

1. **Svårt att återställa i koherens** — ja: append-målet och rotationsregeln
   styr varje framtida hub-lyft cross-repo (skill 1.25.0); efter några lyft i
   volymform är en återkonsolidering både arbete och en regression mot
   gränsen.
2. **Överraskande utan kontext** — ja: ett `tasks/lessons.md` vars innehåll
   "försvunnit" till volymer är obegripligt utan record, och risken utan ADR
   är att en framtida session "städar ihop" filen igen.
3. **Verklig avvägning** — ja: fem registrerade alternativ plus formvarianten,
   med precedent-research åt båda håll.

Alla tre håller ⇒ ADR mintas.

## Konsekvenser

- Nya hub-lyft landar i den aktiva volymen; indexet rörs bara vid rotation.
- **Referens-invarianten verifierad vid delningen:** volymkropparna är
  byte-identiska med källutdragen (`diff` per volym), och 110 H2 + 342 H3 +
  40 `[[Lnnn]]` + 500 `Knn.n` summerar exakt per volymkropp. `Knn.n`- och
  `[[Lnnn]]`-uppslag är grep-baserade och fil-oberoende — volymgränser bryter
  inga pekare (kortets AC #3).
- Hubbens CLAUDE.md-påstående om ~5 000-radersgränsen står oförändrat och
  hubben uppfyller det igen — varje fil är ≤ 1 890 rader (kortets AC #4).
- Spokens `tasks/lessons.md` och dess maskineri (ADR-081, L-nummer,
  `check-lesson-numbers.sh`) är helt opåverkade; `[[Lnnn]]`-länkarna i hubbens
  volymer pekar som förut på spoke-rader.
- Kostnaden är ett extra uppslag (index → volym) för den som läser hubbens
  lessons från noll — priset för att båda läsytorna ser allt.
