---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Uppdragen i våg 3 — åtgärdsplan, evidensregister, huvudrapport (S126)

> **Proveniens:** skrivet av orkestreraren (Session 126, Claude Fable 5.1),
> 2026-09-17, efter att åtta av våg 2:s nio agenter rapporterat och
> orkestreraren fört trettio egna stickprov. Filen är samtidigt en del av
> granskningens metodbeskrivning: den visar exakt vad de tre sista agenterna
> fick veta, och vad de blev ombedda att INTE göra. Varje faktapåstående nedan
> pekar på en fil i granskningen; det som saknar pekare är en hypotes som
> mottagaren prövar (`ADR-086`).

## Gemensamt för alla tre

1. **Läs först, i sin helhet:** `underlag/00-agentkontrakt.md` (gäller dig)
   och `underlag/01-orkestrerarens-stickprov.md` (S1–S30). Där loggen säger
   **föll** eller **skärpt** gäller loggens version — också mot en leverabel
   från våg 2.
2. **Du skriver exakt EN fil** (namnet står i ditt avsnitt). Inga egna
   agenter eller forkar. Ingen commit, ingen stage. Inga ändringar av
   CI-beteende, workflows, skript, rulesets, backlog-kort eller något utanför
   din fil. Granskningen levererar analys och beslutsunderlag; ingenting
   verkställs utan ägarens uttryckliga GO.
3. **Repot är publikt** (S14). Inga namn på deltagare eller kunder, inga
   e-postadresser. Prod-incidenten heter "prod-incidenten 2026-09-03 (S115)".
4. **Filnamn och leverabelnummer går i otakt — med avsikt.** Skriv alltid
   "leverabel N" i löptext och länka till filen:

   | Leverabel (uppdragets numrering) | Fil |
   |---|---|
   | 1 Huvudrapport | `00-huvudrapport.md` |
   | 2 Inventering | `01-fil-och-komponentinventering.md` + `01-inventering.json` |
   | 3 Arkitekturkarta | `02-teknisk-arkitekturkarta.md` |
   | 4 Ändringslogg | `03-andringslogg.md` |
   | 5 Branch/worktree/commit/push | `04-branch-worktree-commit-och-pushflode.md` |
   | 6 Branschjämförelse | `05-branschjamforelse.md` |
   | 7 Airtable | `06-airtable-kompromisser-och-empiriska-fynd.md` |
   | 8 Hermetiskt kontra E2E | `07-hermetiska-tester-kontra-realistisk-e2e.md` |
   | 9 Risk, redundans, flakighet, tid, kostnad | `08-risk-redundans-flakighet-tid-och-kostnad.md` |
   | 10 Djupmodul och målarkitektur | `09-ci-som-ateranvandbar-djupmodul.md` |
   | 11 Åtgärdsplan | `10-migrations-och-atgardsplan.md` |
   | 12 Evidens- och osäkerhetsregister | `11-evidens-och-osakerhetsregister.md` |

5. **Gällande tal.** `underlag/kg3-konsistens-mellan-underlagen.md` §
   "Kanoniska tal" gäller, med fyra rättelser ur stickprovsloggen:
   - **PR-antal:** 2 216 PR:er (2 118 mergade) och 284 ärenden — inte
     "~2 500 PR:er" (S27).
   - **Merge-dedupen:** träffar 3 av 20 kod-landningar i ett
     40-körningarsfönster; "~30 %" är ett teoretiskt tak ur git-historiken,
     "noll träffar" föll (S20).
   - **Event-listans gräns** biter vid första event med startdatum i januari
     2027, inte "om tre månader" (S26, live-mätt mot produktionsbasen).
   - **Tillägg efter korsgranskningen KG1 (S30, läs den posten först av
     alla):** täckningsluckan efter merge är **60 verkliga hål** av 85
     landningar utan egen efterkontroll; det som uteblev är staging-sviten,
     a11y och städningen — de hermetiska klasserna kördes av `CI [push]`.
     Nattnätet: ett PRODUKTSKYDDANDE jobb var rött **25 av 52 nätter** —
     "rött av processgrindar" (S12) gäller två nätter, inte perioden.
     Diagnosen av luckan fanns redan i tråden `T166`; `TASK-365` bär en
     annan, delvis falsifierad rotorsak.
6. **Uppdraget ordagrant:**
   `tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md`. Läs raderna
   ditt avsnitt pekar på.
7. **Ägarens styrning under granskningen (ordagrant, 2026-09-17):** *"Du
   behöver ju förstå EXAKT hur allt funkar och sitter ihop på detaljnivå så
   du därefter kan lära mig."* — *"det enda jag ser och märker av är ju väntan
   på alla tester, omkörningar och fel som uppkommer och som måste få en
   resurs."* — *"Jag har länge funderat på om jag gjort rätt eller fel genom
   att bygga upp en sådan här test-arkitektur så tidigt i projektet, jag ser
   att många proffs liksom kör direkt-PR väldigt långt in i projekten och kan
   därför jobba mycket snabbare och 'produkt-effektivare', vi har ju ganska
   stor fast overhead som tar mycket resurser, och ganska (som jag uppfattar
   det i alla fall) lång ledtid."*

## D11 — Prioriterad migrations- och åtgärdsplan (leverabel 11)

**Fil:** `10-migrations-och-atgardsplan.md`. **Uppdragets krav:** rad 423–436
(tio fält per åtgärd) och kvalitetsgrinden rad 448–452 (proportionerligt,
konsoliderar styrkor, varken överbyggt eller för aggressivt förenklat,
nu/senare/inte alls).

**Indata, läs rekommendationsavsnitten i:** leverabel 3, 5, 6, 7, 8, 9 (särskilt
Del 5 "Var gränsen går") och 10 (migrationsplanen); `underlag/kg1-…`
(korsgranskningen av post-merge-luckan, dedupen, "vem vaktar vakten" och
nattnätets signal), `underlag/kg2-…` (externa fakta), `underlag/kg3-…`
(krockande rekommendationer K1 och K2); stickprovsloggen.

**Vad planen ska göra:**

1. **Samla ALLA åtgärdsförslag** ur indatan i en lista, slå ihop dubbletter,
   och döm varje förslag: **nu / senare / inte alls**. "Inte alls" är lika
   obligatorisk som de andra — uppdraget kräver skydd mot BÅDE överbyggnad
   och för aggressiv förenkling. Ett förslag som river ett medvetet designval
   ska läsas mot den ADR som fattade valet innan det döms.
2. **Håll "nu"-högen liten** — sju till tio åtgärder som en ensam ägare med
   agenter rimligen landar på en till två veckor. Rangordna efter
   (skyddsvärde + sparad väntan) mot (risk + arbete). Ange ordning och
   beroenden: vad måste landa före vad.
3. **Varje åtgärd i uppdragets tio fält:** prioritet · problem · föreslagen
   förändring · förväntad effekt (i minuter eller antal där leverabel 9 har
   tal) · risk · berörda filer och externa inställningar (`fil:rad` där det
   går) · beroenden · verifieringsmetod (KONKRET: vilken körning, vilken
   loggrad, vilket kommando visar att det fungerade) · rollback (KONKRET:
   revert-PR, eller exakt inställning tillbaka) · rekommendation.
4. **Varje åtgärd liten och reversibel.** En åtgärd som inte går att backa
   med en revert delas upp tills den går.
5. **Knyt till det som redan finns.** Finns ett backlog-kort eller en
   Accepted ADR för saken — peka på det i stället för att föreslå nytt.
   Kända: `TASK-366` (självtestets delning, S25), `TASK-199` (ingen vakt på
   stale produktion, S6), tråden `T166` (RÄTT diagnos av täckningsluckan
   efter merge, med tre vägval) och `TASK-365` (samma lucka, delvis fel
   rotorsak — S18, S30),
   `ADR-131` (Accepted, ej verkställd — river backlog-stängningsgrinden,
   S15). Läs kort med `npm run bl -- task <id> --plain`. Skapa och ändra
   aldrig kort.
6. **Två vägval ska presenteras som ägarens beslut, med alternativ,
   konsekvens och din rekommendation** (ur KG3): **K1** — ska
   beroendegranskningen (`audit`) fortsätta blockera även rena textändringar
   (medvetet sedan `TASK-395`, S3), eller villkoras mot beroendeträdet?
   **K2** — nattnätets första steg: skilja processgrindarna från testsviten,
   ge larmet en dubblettspärr (S19), eller en veckosammanfattning — ORDNING,
   inte alla tre på en gång.
7. **Regeln "att försvaga CI är ett hårt stopp"** (GitHub, S29) gäller en
   agent-PR. Flera förslag här är till formen en försvagning (ta bort
   körningen vid landning, villkora `audit`, byta dedupens fråga). För VARJE
   sådan åtgärd: skriv ut exakt vilket skydd som består efteråt och var det
   sitter, och märk åtgärden "kräver ägarens uttryckliga GO — landas aldrig
   av en agent på eget bevåg".
8. **Åtgärder utanför CI hör också hit** när granskningen hittat dem:
   event-listans gräns (S26 — tolv listval i basen, ägarens handgrepp, inte
   en kodändring), prosa som blivit falsk genom tillväxt (S4, S10, S16, S17 —
   och förslaget att vakta prosa som bär ett TAL eller påstår en FRÅNVARO),
   review-grindens omätta missar (S28), rollback-runbooken med steget
   "promota igen" (S22), Enterprise-planens syfte (S21 — fakta åt ägaren,
   inget förslag om uppsägning utan att org-rulesets och de privata repona
   är vägda).
9. **Djupmodulen (leverabel 10):** respektera ordningen laga → stabilisera →
   lyft ut. Migrationsstegen hör hemma under "senare", med sitt
   inträdesvillkor utskrivet.
10. **Avsluta med en tabell på en skärm:** alla åtgärder, en rad var — nummer,
    en mening, nu/senare/inte alls, sparad väntan eller stängd risk, kräver
    GO (ja/nej). Den tabellen lyfts in i huvudrapporten.

**Ingenting i planen verkställs.** Skriv aldrig "gjort" — skriv "föreslås".

## D12 — Evidens- och osäkerhetsregister (leverabel 12)

**Fil:** `11-evidens-och-osakerhetsregister.md`. **Uppdragets krav:**
kvalitetsgrinden rad 444 (*"alla påståenden har evidens eller tydlig
osäkerhetsmarkering"*) och rad 447 (*"dokumenten inte motsäger varandra"*).

**Vad registret är:** platsen där en läsare slår upp ETT påstående ur
granskningen och ser vad det vilar på. Inte en rådump av allt agenterna
skrev — de bärande påståendena, alltså dem som en slutsats eller en
rekommendation i leverabel 2–11 faktiskt lutar sig mot.

1. **Huvudtabellen** (sikta på 80–150 rader, grupperade per område: grinden
   före merge · nätet efter merge · testnivåerna och hermetiken · Airtable ·
   branch-/pushflödet · tid och kostnad · underhåll och återanvändning ·
   branschjämförelsen). Kolumner: ID · påstående i EN mening · märkning
   (**verifierad / starkt indikerad / osäker / ej verifierbar**) · slags
   sanning (dokumenterad avsikt · faktisk implementation · tekniskt
   framtvingad regel · frivilligt arbetssätt · empiriskt observerat beteende ·
   ej verifierat) · evidens (`fil:rad`, run-ID, PR-nummer eller kommando med
   datum) · var det står (leverabel/underlag + avsnitt) · orkestrerarens
   stickprov (S-nummer och dom, om det prövats).
2. **Gällande tal** — KG3:s tabell med rättelserna i punkt 5 ovan inarbetade,
   varje tal med mätfönster och källa. Säg uttryckligen vilka tal som är
   ögonblicksmätningar som rör sig (nattnätets rödhet, öppna larm,
   täckningsluckans andel) och bör mätas om före nästa användning.
3. **Påståenden som FÖLL eller SKÄRPTES under granskningen** — vad som
   påstods, av vem (agentbeteckning, aldrig personnamn), vad som gäller i
   stället, och var rättelsen gjordes. Ta med orkestrerarens egna fel (S14,
   S20, S27 och tidsangivelserna i sessionsdoket) — registret är också
   granskningens självkritik.
4. **Åtkomstluckor** — varje **ej verifierbar**-märkning i granskningen, med
   EXAKT vad som krävs för att fylla den: vilken behörighet, vilket kommando,
   vem som kan köra det.
5. **Kvarstående motsägelser mellan dokument.** Sök aktivt: jämför "Kort
   svar" och rekommendationerna i leverabel 2–10 parvis på de punkter där de
   rör samma sak. Hittar du en motsägelse som stickprovsloggen inte redan
   avgjort — registrera den med båda källorna; rätta ingenting. Kända
   spänningar att pröva: leverabel 6 säger att ledtiden *"inte är vårt
   problem"* mätt med DORA:s mått, leverabel 9 säger att upplevelsen av lång
   ledtid är *"korrekt, och underskattad"* — är det en motsägelse eller två
   måttstockar?

Pröva stickprovsvis att dina `fil:rad`-pekare träffar (minst var tionde
rad i huvudtabellen) — ett register med döda pekare är sämre än inget.

## D1 — Huvudrapport och exekutiv sammanfattning (leverabel 1)

**Fil:** `00-huvudrapport.md`. **Spawnas EFTER D11 och D12.** **Uppdragets
krav:** rad 401 och 414 (*"ingång för både tekniska och otekniska läsare"*,
länkar till samtliga underdokument), rad 383–393 (de fem viktigaste frågorna,
*"särskilt tydliga och fristående svar"*), rad 452 (*"tydligt anger vad som
bör göras nu, senare eller inte alls"*).

**Läsaren.** Ägaren är inte programmerare. Han har byggt detta tillsammans
med agenter och säger själv att det enda han ser av maskinen är väntan. Han
lär sig bäst av extremt pedagogiska steg-för-steg-dokument och föredrar
guidad form framför långa texter. Referensläsaren för begripligheten är en
förskollärare utan teknisk bakgrund: hon ska FÖRSTÅ, inte få en känsla.
Varje tekniskt ord förklaras första gången — i en bisats, inte i en fotnot.
Men ingen teknisk detalj utelämnas; den förklaras i stället.

**Byggd i denna ordning:**

1. **Läs detta först** (högst en skärm): domen i två meningar, tre tal, och
   de tre saker som bör göras först.
2. **Så fungerar det — följ en ändring från tangentbord till användare.**
   Den guidade genomgången, steg för steg, i den ordning saker faktiskt
   händer. Varje steg: *vad händer · varför finns steget (vilket verkligt
   fel byggdes det mot) · vad det kostar i väntan · vad som kan gå fel här ·
   "så ser du det själv" (var i GitHub, eller vilket kommando)*. Bygg på
   leverabel 3 och 5; diagrammet i leverabel 3 § 1 får återanvändas.
   Nyckelinsikten ska inte gå att missa: **före `main` är allt en spärr;
   efter `main` är allt ett rop som någon måste höra.**
3. **Gjorde jag rätt som byggde detta så tidigt?** Ett rakt svar på ägarens
   fråga, byggt på leverabel 9 Del 5 och leverabel 6 § 14 — och som
   uttryckligen reder ut de två måttstockarna (DORA:s ledtid mot den upplevda
   väntan; se D12 punkt 5). Overheaden i tal, vad den köpt, vad den inte
   fångat, och varför jämförelsen med "proffs som kör direkt-PR" mäter fel
   storhet. Ärligt åt båda håll.
4. **De fem viktigaste frågorna** — fem fristående svar, vart och ett läsbart
   utan resten, med märkning och pekare till den leverabel som bär beviset.
5. **Vad som är starkt** — och bör bevaras och konsolideras. Får INTE bli
   tunnare än avsnittet om felen: uppdraget ber lika mycket om att se det
   byggda som en tillgång (rad 217–269, 449).
6. **Var det läcker** — nätet efter merge (S1, S7, S12, S18, S19), vägen från
   `main` till användaren (S6, S22), och var produkten är tunt skyddad (S9,
   S10, S13, S16, S26).
7. **Nu, senare, inte alls** — D11:s sluttabell, med en mening per åtgärd om
   VARFÖR, och länk till planen.
8. **Beslut som är dina** — K1, K2, brytdagen för `ADR-131`, event-listan
   (S26), Enterprise-planens syfte (S21). Varje beslut: alternativen,
   konsekvensen, rekommendationen.
9. **Karta över granskningen** — tabellen leverabel → fil → en mening om vad
   den svarar på, plus underlagen. Relativa länkar till syskonfiler;
   kontrollera att varje mål finns (`ls`).
10. **Hur granskningen gjordes, och vad den inte kunde belägga** — tre vågor,
    agentpassen, trettio egna stickprov; de påståenden som föll, inklusive
    orkestrerarens egna; åtkomstluckorna ur D12.
11. **Förslag på fortsättning** — en fristående guidad wizard över
    arkitekturen är en möjlig nästa leverans; den FÖRESLÅS här, byggs inte.
12. **Ordlista** — de femton till tjugo begrepp rapporten använder, en till
    två meningar var, på vardagssvenska.

**Form:** 500–900 rader. Tabeller där de gör jämförelsen läsbar. Inga
rådumpar — destillera och länka. Skriv aldrig att något är "gjort" som bara
är föreslaget. Domen ska vara densamma som leverablerna bär; där du märker
att två leverabler drar åt olika håll — säg det öppet i stället för att
släta över.
