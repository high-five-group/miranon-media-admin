---
owner: marcus803
updated: 2026-08-02
review_by: 2027-02-02
status: draft
---

# Uppdragsrevision, körning #3 (T110 mätled 3 / T113 mätpunkt 3) — S91:s tjugoandra resume, FÖRSTA Sonnet-datapunkten (Code, 2026-08-02)

> **Proveniens:** beställd explicit av `tasks/threads/T113-sonnet-subagent-matuppfoljning.md`
> § Pausad: *"Väntar sin första Sonnet-datapunkt: nästa `revision:uppdrag`
> riktas mot tjugoandra resumens transcript (`a964302a-…`, ~15
> Sonnet-bygguppdrag)."* Detta är den körningen. Instrumentet
> (`scripts/uppdragsrevision.mjs`, ADR-086), baslinjen (körning #1, session
> `fd0eef00…`, dokumenterad i
> [`tasks/threads/T110-orkestrerarens-felklasser.md`](../../tasks/threads/T110-orkestrerarens-felklasser.md)
> § Första uppdragsrevisionen) och körning #2 (`f1ff4bcd…`+`ae112ab2…`,
> dokumenterad i
> [`uppdragsrevision-korning-2-2026-08-02.md`](uppdragsrevision-korning-2-2026-08-02.md))
> prövas INTE om här — de tas som givna och jämförs mot.
>
> **Denna rapport drar inga effektslutsatser.** T113-tråden är uttrycklig:
> denna körning ger T113:s axel 2 dess **FÖRSTA** Sonnet-datapunkt — n=1 för
> Sonnet-mot-baslinje-jämförelsen, även om det är den TREDJE
> `uppdragsrevision`-körningen totalt. `T110`:s regel ("effektpåståenden
> förbjudna tills revision n≥2", sessionsdok rad 7990–7991/8048) gäller
> alltjämt: en enda Sonnet-punkt kan inte själv avgöra om Sonnet-omställningen
> (PR #557) haft effekt. Alla jämförelser nedan mot baslinjen och körning #2
> redovisas som DATA. Synteser hör till orkestrerarens/Marcus efterföljande
> läsning.

## Målsession — given av uppdraget, verifierad av mig

Uppdraget pekade explicit ut session `a964302a-1c0e-4bb6-ad0f-f6842bb80a21`
(källa: T113-tråden, citerad ovan). Till skillnad från körning #2 (som fick
identifiera rätt sessionsfil ur en lista) behövde denna körning bara
VERIFIERA pekaren, inte söka fram den. Verifierat:

- **Filen existerar** på förväntad plats
  `~/.claude/projects/-Users-marcus-Repon-miranon-media-admin/a964302a-1c0e-4bb6-ad0f-f6842bb80a21.jsonl`
  (2 175 253 byte, 1 149 rader). Uppdraget flaggade självt denna premiss som
  OVERIFIERAD ("filens existens OVERIFIERAD av mig — pröva") — HÖLL.
- **Tidsspannet** är 2026-08-01T21:26:58Z – 2026-08-02T06:43:55Z (~9 h 17 min),
  konsekvent med T113-kortets "2026-08-01→02".
- **Innehållet är rätt korpus, oberoende bekräftat:** de åtta PR-numren
  (`#563`–`#570`, `#574`) som T113-tråden citerar för vågens first-pass-data
  återfinns exakt som åtta av de 16 extraherade uppdragen nedan (Uppdrag 1, 3,
  4, 5, 6, 9, 10, 13) — samma sessionsfil som T113 redan analyserat för sin
  Mätpunkt 2/axel 1.

## Modell-kvalificeringen — premiss-pass-fynd, INTE bara en bekräftelse

Uppdragets punkt 6 instruerade: *"Verifiera med `modell`-fältet per
Agent-anrop i transcriptet (körning #2:s rapport gjorde så, `modell: null` ⇒
pre-Sonnet) att denna session faktiskt bär Sonnet-spawns."* Detta prövades —
och den föreslagna METODEN visade sig vara otillräcklig för DENNA session,
även om den var korrekt för körning #2.

**Naiv tillämpning av regeln hade gett fel svar.** `scripts/uppdragsrevision.mjs`
extraherar `input.model` — den explicita `model`-parametern i
`Agent`-tool-anropet. För denna session är `input.model` **`null` på 15 av 16
uppdrag** (endast Uppdrag 14, ett `general-purpose`-anrop i hub-repot, bar en
explicit override `model: "sonnet"`). En bokstavlig tillämpning av
"`modell: null` ⇒ pre-Sonnet" hade alltså gett **1 av 16** Sonnet-spawns —
under uppdragets egen tröskel för att bygga en datapunkt, vilket skulle ha
krävt att jag STANNADE (uppdragets punkt 6, sista meningen).

**Skälet regeln höll i körning #2 men inte generaliserar hit:** `input.model
== null` betyder bara "ingen explicit override i Agent-anropet" — vilket
subagenten då ärver modellen som står i **agent-DEFINITIONENS frontmatter**
vid spawn-tillfället. I körning #2:s källfiler (`f1ff4bcd`/`ae112ab2`, 2026-07-30→31)
hade `.claude/agents/bygg-agent.md` INGET `model`-fält, så arvet gick till
huvudloopens modell (`claude-fable-5[1m]`) — därför var `modell: null` DÄR en
giltig proxy för "inte Sonnet". PR #557 (landad under tjugoförsta resumen,
`c64f6755`, lördag 2026-08-01, STRAX FÖRE `a964302a` börjar 21:26:58Z samma
dag) satte `model: sonnet` i just `bygg-agent.md` och `research-pass.md`. Från
och med den commiten ärver ett `input.model: null`-anrop **sonnet**, inte
huvudloopens modell — proxyn slutade fungera exakt vid brytpunkten denna
körning måste hantera.

**Verifierad mot grundsanning, inte mot proxyn:** varje av de 16 subagent-
spawnen har en egen transcript-fil under
`a964302a-1c0e-4bb6-ad0f-f6842bb80a21/subagents/agent-<id>.jsonl` plus en
`.meta.json` (agentType + `toolUseId` som länkar tillbaka till orkestrerarens
`Agent`-anrop). Dessa filers EGNA `message.model`-fält (den faktiska modell
API:et körde på) gav facit:

| Uppdrag | Agenttyp | `input.model` (orkestrerarens anrop) | Faktisk modell (subagent-transcript) |
|---|---|---|---|
| 1–6, 9–11, 13, 15–16 (12 st) | `bygg-agent` | `null` | **`claude-sonnet-5`** (samtliga 12) |
| 12 | `research-pass` | `null` | **`claude-sonnet-5`** |
| 7, 8 | `general-purpose` | `null` | `claude-fable-5` (båda) |
| 14 | `general-purpose` | `"sonnet"` (explicit) | **`claude-sonnet-5`** |

**14 av 16 spawns (87,5 %) körde faktiskt på Sonnet** — samtliga 12
`bygg-agent` + den enda `research-pass` (de "byggkaraktärade" uppdragen,
konsekvent med PR #557:s ändringsyta) plus det explicit override:ade
`general-purpose`-anropet. De två som körde `claude-fable-5` var båda
`general-purpose`-spawns UTAN override — konsekvent med att PR #557 aldrig
rörde `general-purpose`-agentens frontmatter.

**Detta är en DIVERGENS värd att bokföra öppet (ADR-086), inte en
bekräftelse av uppdragets metod-tips.** Den underliggande kvalificerande
premissen (bär sessionen Sonnet-spawns?) höll — men via en STRIKTARE metod än
den föreslagna, och den föreslagna metoden hade, bokstavligt tillämpad, gett
fel svar och en oberättigad STOPP. Nästa läsare som ska kvalificera en framtida
session bör läsa subagent-transcriptens eget `message.model`-fält, inte bara
`input.model` på orkestrerarens `Agent`-anrop — särskilt för sessioner nära
en agent-definitions-ändring som PR #557.

## Korpus

**16 uppdrag** (12 `bygg-agent` · 3 `general-purpose` · 1 `research-pass`),
**1 149 rader, 0 trasiga, 0 sidechain-exkluderade**:

```text
$ node scripts/uppdragsrevision.mjs --session a964302a --katalog <transcript-dir>
källa: …/a964302a-1c0e-4bb6-ad0f-f6842bb80a21.jsonl
16 uppdrag (bygg-agent=12 · general-purpose=3 · research-pass=1) · 0 sidechain-exkluderade · 1149 rader (0 trasiga)
```

Ingen omgjord sessionsidentifiering krävdes (till skillnad från körning #2) —
uppdraget pekade rätt.

## Metod

Samma metod som körning #1/#2: läs varje uppdragstext i sin helhet, extrahera
varje prövbart faktapåstående (filsökväg, radnummer, SHA/commit, tal/antal,
direkt citat, tillståndspåstående), pröva mot `git`/`gh`/backlog-CLI:t.
Historiska radnummer prövades mot commiten precis FÖRE respektive uppdrag
kördes (`git show <sha>:<fil>`), inte blint mot dagens HEAD — ett påstående
som höll VID SKRIVTILLFÄLLET men senare legitimt driftat klassas GRÄNSFALL,
inte HÅRT FEL.

Arbetet delegerades till två parallella `general-purpose`-agenter (8 uppdrag
vardera: 1–8, 9–16), identisk metodinstruktion och identisk klassningsskala
(HÖLL / HÅRT FEL / GRÄNSFALL / OPRÖVBAR / OPRÖVAD / OPRÖVAD sandbox-begränsad)
plus en KÄLLMÄRKT J/N-flagga per påstående.

**Synteshantering — samma självupptäckta klass som körning #2, en TREDJE
gång.** Jag varnade uttryckligen båda subagenterna i prompten om körning #2:s
fynd (sammanfattningsrader med räknefel mot egna detaljtabeller) och bad om
radräkning. Batch A:s (uppdrag 1–8) egen sammanräkning stämde exakt mot dess
40 detaljtabellrader vid min oberoende omräkning. **Batch B:s (uppdrag 9–16)
egen sammanräkning innehöll ändå ett fel:** dess slutrad angav "U15 4/4"
källmärkning, men de åtta tabellraderna för Uppdrag 15 visar vid bokstavlig
räkning **6 källmärkta (J), 2 inte (N)** — inte 4/4. Detta ändrar batch B:s
totala källmärkning från agentens egen siffra (31 J / 17 N) till den
FAKTISKA (**33 J / 15 N**), verifierat rad för rad. Verdict-kategorierna
(HÖLL/HÅRT FEL/GRÄNSFALL) var däremot korrekt summerade i båda batcharna.
Denna rapports tal nedan är de OMRÄKNADE (33/15 för batch B), inte agentens
egna. Se § Slutsats punkt 4 för vad detta betyder.

## Resultat — census (omräknat direkt ur de 16 detaljtabellerna)

| | Antal | Andel av 88 |
|---|---:|---:|
| **Totalt prövade påståenden** | **88** | 100 % |
| HÖLL | 80 | 90,9 % |
| HÅRT FEL | 4 | 4,5 % |
| GRÄNSFALL | 3 | 3,4 % |
| OPRÖVAD (lågrisk/extern källa, medvetet ej kollad) | 1 | 1,1 % |
| OPRÖVBAR | 0 | 0 % |
| OPRÖVAD, sandbox-begränsad | 0 | 0 % |

**Avgjorda** (HÖLL + HÅRT FEL + GRÄNSFALL) = 87. **Felrate av avgjorda:**
4/87 = **4,60 %** hårda fel; med gränsfall 7/87 = **8,05 %**.

**Källmärkning:** 68 av 88 påståenden (**77,3 %**, omräknat — se § Metod) bar
en explicit hänvisning i uppdragstexten till varifrån talet/raden/citatet
kom.

**Per uppdrag:** 4 av 16 uppdrag (25 %) bar minst ett hårt fel — Uppdrag 5
(`bygg-agent`, TASK-110), Uppdrag 8 (`general-purpose`, beslutsunderlag),
Uppdrag 9 (`bygg-agent`, TASK-115) och Uppdrag 15 (`bygg-agent`, T110/T113-
syntes). 3 av 12 `bygg-agent`-uppdrag (25 %) och 1 av 3 `general-purpose`-
uppdrag (33 %) bar ≥1 fel. Noll fel i det enda `research-pass`-uppdraget.

## De fyra hårda felen — och en fångst-rate-observation

| # | Uppdrag | Påstående (nära verbatim) | Faktiskt läge | Redan självfångad i vågen? |
|---|---|---|---|---|
| 1 | 5 (TASK-110) | "Kortet mintades 2026-07-31 … källa: sessionsdok rad 810–812" | Rad 810–812 i sessionsdoket är en OREL­ATERAD tabell (staging-svitens tidsbudget). Rätt innehåll bor i `tasks/s91-restlistan.md` rad 810–812 — SAMMA radnummer, FEL fil | **Nej** — slank igenom obemärkt, funnen först av denna revision |
| 2 | 8 (Beslutsunderlag) | "task-111 bär tre åtgärdsvägar … per sessionsdok rad 813–817" | Samma felmönster: rad 813–817 sessionsdok är samma tidsbudget-tabell; rätt innehåll i restlistan.md | **Ja** — redan bokfört i `T110`-tråden rad 410 och sessionsdok rad 8130 ("fångat av mottagaren" via beslutsunderlags-agentens egen premiss-pass) |
| 3 | 9 (TASK-115) | "TASK-83 curl-`--retry`-precedent i restlistan rad ~294–299" | Rad 294 är en orelaterad tabellrad ("Appen"-raden); rätt precedent bor rad 290 (tabell) + rad 315–318 (prosa) | **Nej** — samma ungefärliga citering ("rad ~285–299") står OFÖRÄNDRAD i det landade `task-115`-kortet idag |
| 4 | 15 (T110/T113-syntes) | "Samtliga landade first-pass … noll nya TASK-115-instanser under hela vågen" | En åttonde G0-transient-instans inträffade på PR #572 (run `30721492383`, 2026-08-01T22:33:46Z), INOM vågens tidsram | **Ja** — redan bokfört som `task-115` Instans 8 (tillägg 2026-08-02) med orkestrerarens egen kvittens: "korrigering av ett tidigare uppdrag som felaktigt hävdat 'noll nya instanser'" |

**Fångst-rate-observation:** av de fyra hårda felen denna revision hittar var
**2 av 4 (50 %) redan självupptäckta och rättade i realtid** av mottagande
agenter under samma våg (det andra felet i tabellen ovan av
beslutsunderlags-agentens egen premiss-pass, det fjärde av orkestrerarens
egen efterhandskorrigering på task-115-kortet). **De andra 2 av 4 slank
igenom oupptäckta** in i landade artefakter (kortet
`task-115` bär fortfarande den unprecisa raden; TASK-110-uppdragets
felciterade rad påverkade ingen landad artefakt eftersom uppdraget bara
använde den som bakgrundskontext, inte som skriven text). Detta är ett
sällsynt datapunkt på just den lucka `T110`-tråden själv namnger som sin
"systematiska lucka": *"vi mäter FÅNGADE fel, inte BEGÅNGNA"* — här mäts,
för en gångs skull, BÅDA sidor på samma litet urval (n=4): hälften fångades
av mekanismen (mottagarens premiss-pass / orkestrerarens efterhandskorrigering),
hälften gjorde det inte.

**Ett metodologiskt mönster, samma som körning #2:** #1 och #2 är SAMMA
underliggande slip — sessionsdok och restlistan råkar dela radnumrering i
intervallet ~810–817 för olika innehåll, och orkestreraren pekade fel på BÅDA
ställen. Detta är precis `T110`-trådens klass B ("referens som skickas vidare
utan att ha lästs"), nu med ett konkret exempel på att SAMMA underliggande
förväxling kan träffa två syskonuppdrag samma kväll, och att realtidsfångsten
bara adresserade det ena.

## Gränsfall (3)

- **Uppdrag 1, TASK-56/88/93/95/97/113 "flera … öppna `[ ]`"** — endast
  TASK-88 hade en äkta kroppsrad; TASK-56 var prosa-nämnande, övriga
  frånvarande. "Flera" höll inte bokstavligen (1 av 6), men uppdraget
  flaggade det explicit som HYPOTES att re-verifiera, vilket den mottagande
  agenten gjorde.
- **Uppdrag 11, "PR #565 armerad men inte köad vid nästa svep"** — GitHub-
  timeline bekräftar formen (en `auto_merge_enabled`, TVÅ
  `added_to_merge_queue`/`removed_from_merge_queue`-par), men den exakta
  CLI-textinteraktionen ("strategi-svaret" vs "already queued") går inte att
  styrka retroaktivt ur API-historiken.
- **Uppdrag 15, "`node_modules/.bin/backlog` saknas i huvudträdet"** — höll
  vid kortets skrivtillfälle (2026-08-01 22:50); vid denna revisions
  körtillfälle (2026-08-02) finns filen, med mtime EFTER en mellanliggande
  `npm install`/`npm ci` — legitim drift, inte ett fel vid skrivtillfället.

## Källkrav — fortsatt bakgrundsvariation

77,3 % källmärkning i denna körning mot 64 % i baslinjen och 56,9 % i
körning #2. Samtliga tre körningar föregår ELLER ligger nära ADR-086:s källkrav
(landat under tjugoförsta resumen, `c64f6755`, samma dag som denna körnings
källa startar) — så en riktig mätning av ADR-086:s EFFEKT på källmärkning
kräver att jämföra mot en session som uppstod EFTER kravet fanns i CLAUDE.md
och som författades AV en agent som kände till kravet, inte bara en session
som råkar komma efter i tid. Denna körning är den högsta källmärkningen av
de tre hittills uppmätta — redovisat som DATA, ingen trend dras (n=3 totalt,
n=1 Sonnet-specifikt).

## Jämförelse — DATA, ingen slutsats

| Mätvärde | Körning #1 (baslinje, `fd0eef00`) | Körning #2 (`f1ff4bcd`+`ae112ab2`) | Körning #3 (denna, `a964302a`) |
|---|---:|---:|---:|
| Uppdrag | 34 | 30 | 16 |
| Prövade påståenden | 192 (~5,6/uppdrag) | 188 (~6,3/uppdrag) | 88 (~5,5/uppdrag) |
| Avgjorda | 156 | 176 | 87 |
| Hårda fel | 6 (3,8 % av avgjorda) | 11 (6,25 % av avgjorda) | 4 (4,60 % av avgjorda) |
| Hårda fel + gränsfall | 9 (5,8 %) | 16 (9,09 %) | 7 (8,05 %) |
| Uppdrag med ≥1 hårt fel | 6/28 bygg-agent (21 %) | 10/26 bygg-agent (38,5 %) | 3/12 bygg-agent (25 %) · 4/16 totalt (25 %) |
| Källmärkning | 64 % | 56,9 % | 77,3 % |
| Modell | pre-Sonnet | pre-Sonnet (samma regim) | **14/16 spawns (87,5 %) på `claude-sonnet-5`** — FÖRSTA Sonnet-punkten |

**Denna körnings felrate (4,60 % / 8,05 % med gränsfall) och källmärkning
(77,3 %) ligger BÄTTRE än BÅDA de tidigare pre-Sonnet-körningarna på samtliga
fyra axlar.** Per T110/T113:s uttryckliga regel dras **ingen** slutsats om
Sonnet-omställningens verkan av detta — n=1 för just Sonnet-mot-baslinje-
jämförelsen, ett mindre korpus (16 mot 30/34 uppdrag, vilket i sig gör
enskilda observationer tyngre per capita), och tre olika vågor med olika
uppdragsblandning är inte jämförbara på en enda axel utan fler datapunkter.
Att denna körning RÅKAR vara både bättre OCH den första Sonnet-punkten är en
premiss värd att bära vidare oförändrad, inte en slutsats.

## Premiss-pass — vad som prövades i UPPDRAGET till denna revision

Prövat mot uppdragets egna källmärkta påståenden, innan arbetet påbörjades:

- **Premiss 1** (T113 § Pausad pekar ut exakt denna körning som
  återupptagnings-trigger): läst T113-kortet i sin helhet. HÖLL exakt —
  citatet i uppdraget är ordagrant.
- **Premiss 2** (verktyget är `npm run revision:uppdrag` →
  `scripts/uppdragsrevision.mjs`): verifierat mot `package.json` rad 36 och
  skriptets egen kod/hjälptext, lästa i sin helhet FÖRE körning (script-
  headern dokumenterar exakt anropsformen som användes). HÖLL.
- **Premiss 3** (transcriptet ligger på angiven sökväg, OVERIFIERAT av
  uppdragsgivaren): filen finns, exakt på den angivna sökvägen. HÖLL.
- **Premiss 4** (jämförelsepunkterna: baslinjen 34/192/6/3,8 %/64 % och
  körning #2 30/188/11/6,25 %/56,9 %, båda pre-Sonnet): verifierat DIREKT mot
  `T110`-tråden rad 334–340 (34 uppdrag, 192 påståenden, 6 hårda fel = 3,8 %,
  3 gränsfall = 5,8 %, 64 % källmärkt — exakt match) och mot
  `uppdragsrevision-korning-2-2026-08-02.md` (30/188/11/6,25 %/56,9 % — exakt
  match, läst direkt ur filen, inte returcerat). HÖLL på båda.
- **Premiss 5** (T110-effektregeln: era-effektpåståenden förbjudna): verifierat
  mot sessionsdok rad 7990–7991 och 8048 — exakt ordalydelse "T110-
  effektpåståenden förbjudna tills revision n≥2". Efterlevd i denna rapport
  (inga effektslutsatser dras).
- **Premiss 6** (verifiera med `modell`-fältet att sessionen bär
  Sonnet-spawns; STANNA om inte): prövad — se egen sektion ovan. **Divergens
  funnen och bokförd öppet:** den föreslagna metoden (läsa `input.model` på
  orkestrerarens `Agent`-anrop) hade gett fel svar (1/16 Sonnet, under
  tröskeln för att bygga vidare); grundsanningen (subagent-transcripternas
  egna `message.model`-fält) visar 14/16 (87,5 %) på `claude-sonnet-5`.
  Kvalificeringen HÖLL — sessionen bär verkligen Sonnet-spawns — men via en
  strängare metod än uppdraget föreslog. Ingen STOPP behövdes; datapunkten är
  giltig att bygga.

**Ingen divergens blockerade arbetet.** Modell-kvalificeringens divergens
(premiss 6) hanterades genom att följa den strängare, verifierbara metoden
(subagent-transcripternas grundsanning) i stället för uppdragets föreslagna
proxy, och redovisas öppet ovan i stället för att tystas eller antas bort.

## Avgränsningar

- **Verifieringen gjordes av två parallella subagenter (8 uppdrag vardera),
  inte av mig personligen rad för rad.** Jag spot-verifierade själv de två
  mest laddade fynden direkt: (a) sessionsdok rad 810–812/813–817 mot
  `tasks/s91-restlistan.md` — bekräftat att innehållet bor i restlistan, inte
  sessionsdoket, på BÅDA ställena; (b) `task-115`-kortets Instans 8-tillägg —
  bekräftat ordagrant att "noll nya instanser"-felet redan var
  självdokumenterat med orkestrerarens egen kvittens. Jag litar INTE på
  subagenternas egna sammanfattningsrader (se § Metod) — batch B:s
  källmärknings-summering hade fel, funnet genom omräkning direkt ur dess
  åtta detaljtabeller för Uppdrag 15.
- **Modell-verifieringen (§ ovan) byggde på filsystem-artefakter
  (`subagents/*.jsonl` + `.meta.json`) vars format inte är dokumenterat
  någonstans i repot** — det är en observerad egenskap hos Claude Code-
  harnessets transcript-lagring vid detta tillfälle, inte ett kontrakterat
  API. Framtida körningar bör verifiera att formatet fortfarande finns innan
  de förlitar sig på det.
- **Ingen seeding, ingen capture-recapture** för den bredare nämnaren (hur
  många fel som FANNS men aldrig fångades av vare sig mottagande agent eller
  denna revision) — fångst-rate-observationen ovan (2/4) gäller bara de fel
  DENNA revision faktiskt hittade, inte en skattning av totalt antal fel.
- **n=1 för Sonnet-specifika jämförelser, n=3 för instrumentet totalt.** Ingen
  effektslutsats om Sonnet-omställningen eller premiss-pass-disciplinens
  verkan dras — det är uttryckligen förbjudet (T110-regeln) och hör till
  orkestrerarens/Marcus efterföljande syntes.
- **Uppdrag 14 rörde ett annat repo (`~/Repon/marcus-system`)** — verifierat
  read-only av batch B-agenten, som även bekräftade att uppdraget faktiskt
  utfördes (mergad PR #13 i hub-repot). Ingen sandbox-begränsning uppstod
  denna gång (till skillnad från körning #2:s hub-repo-instanser), eftersom
  denna revision endast behövde LÄSA hub-repot, inte skriva git-historik
  däri.

## Slutsats i fem punkter (data, ingen effekt)

1. **Denna session bär en verklig, kvalificerad Sonnet-datapunkt (n=1) för
   T113:s axel 2** — 14 av 16 spawns (87,5 %) körde på `claude-sonnet-5`,
   verifierat mot subagent-transcripternas grundsanning efter att den
   föreslagna proxy-metoden (`input.model`) visat sig otillräcklig för denna
   specifika session (se § Modell-kvalificeringen). T113 väntar inte längre
   på sin FÖRSTA Sonnet-punkt — den finns nu.
2. **Nämnaren för denna våg är ~5,5 prövbara påståenden per uppdrag** — i
   linje med både baslinjens ~5,6 och körning #2:s ~6,3.
3. **Felraten (4,60 % av avgjorda, 8,05 % med gränsfall) och källmärkningen
   (77,3 %) ligger bättre än BÅDA de tidigare pre-Sonnet-körningarna** på
   samtliga fyra jämförelseaxlar — redovisat som observation på n=1, inte som
   trend eller effekt.
4. **Instrumentets egen felklass (självrapporterade totaler som svagaste
   länk) upprepades en TREDJE gång**, trots en explicit varning i denna
   körnings delegationsprompt: batch B:s sammanfattningsrad angav "4/4"
   källmärkning för Uppdrag 15 där de åtta egna tabellraderna visar 6/2.
   Rättat genom omräkning, inte genom att lita på sammanfattningen — samma
   disciplin som körning #1 (revisorns egna preliminära fynd föll vid
   prövning) och körning #2 (tre batchars räknefel) redan visade.
5. **En sällsynt fångst-rate-datapunkt på T110-trådens egen "systematiska
   lucka":** av de 4 hårda felen denna revision hittar var 2 (50 %) redan
   självupptäckta och rättade i realtid av mottagande agenter under samma
   våg, medan 2 slank igenom oupptäckta in i landade artefakter (ett av dem
   står ännu oförändrat i det landade `task-115`-kortet). n=4 är för litet
   för att generalisera fångst-raten, men det är den första gången denna
   revisionsserie mätt BÅDA sidor (fångat och ofångat) på samma urval i
   stället för bara den ena.
