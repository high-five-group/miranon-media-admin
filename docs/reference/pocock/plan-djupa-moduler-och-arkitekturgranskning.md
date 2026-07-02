# Källgrundad arbetsplan: Improve Codebase Architecture

## Syfte

Använd `improve-codebase-architecture` för att synliggöra arkitektonisk friktion och föreslå **möjligheter till fördjupning**: refaktoreringar som omvandlar grunda moduler till djupa. Målet är testbarhet och att AI lättare kan navigera kodbasen.

En djup modul ger mycket beteende bakom ett litet gränssnitt. Den är inte nödvändigtvis en stor fil, och den får inte bli ett allmänt “god object”.

## Källor och trohetskontrakt

Denna plan följer Matts aktuella, officiella skill-källor i `mattpocock/skills`, granskade den 24 juni 2026 vid commit `6eeb81b5fcfeeb5bd531dd47ab2f9f2bbea27461`:

- `skills/engineering/improve-codebase-architecture/SKILL.md`
- `skills/engineering/improve-codebase-architecture/HTML-REPORT.md`
- `skills/engineering/codebase-design/SKILL.md`
- `skills/engineering/codebase-design/DEEPENING.md`
- `skills/engineering/codebase-design/DESIGN-IT-TWICE.md`
- `skills/engineering/domain-modeling/SKILL.md`
- `skills/engineering/grill-with-docs/SKILL.md`
- `skills/engineering/setup-matt-pocock-skills/SKILL.md`

Följande är medvetet **inte** en del av planen, eftersom de aktuella skillsen inte föreskriver dem:

- en egen rollout-, canary-, feature-flag- eller rollbackprocess;
- databasstrategier som expand–migrate–contract;
- automatisk implementation;
- automatisk skapning av RFC eller GitHub-issue.

Kursens cohort-demonstration innehåller en GitHub-RFC som senare steg. Den aktuella `improve-codebase-architecture`-skillen slutar däremot med vald kandidat, grillning och alternativa gränssnitt. Vi blandar inte ihop dessa versioner. Om implementation eller produktionsrelease ska ske skapas ett nytt, uttryckligen godkänt och repo-specifikt uppdrag efter denna plan.

## Arkitekturspråk från `codebase-design`

I själva arkitekturrapporten används skillens fasta vokabulär: **module**, **interface**, **implementation**, **depth**, **seam**, **adapter**, **leverage** och **locality**. Den svenska förklaringen här är bara en läshjälp.

| Term | Betydelse i arbetet |
| --- | --- |
| **Module** | Något med ett interface och en implementation: funktion, klass, paket eller vertikalt snitt. |
| **Interface** | Allt en anropare måste känna till: typer, invariansregler, ordning, fel, konfiguration och prestanda. |
| **Depth** | Leverage vid interfacet: mycket beteende per del av interfacet som anropare och tester måste lära sig. |
| **Seam** | Platsen där beteende kan ändras utan att anropare behöver redigeras. |
| **Adapter** | En konkret implementation av ett interface vid en seam. |
| **Leverage** | Mer förmåga för anropare per sak de behöver lära sig. |
| **Locality** | Ändringar, buggar, kunskap och verifiering samlas i modulen. |

Tre regler styr alla beslut:

1. **Depth är en egenskap hos interfacet, inte mängden kod.**
2. **Interfacet är testytan.** Anropare och tester passerar samma seam.
3. **En adapter är en hypotetisk seam; två motiverade adapters gör den verklig.**

## Förbered repot med `setup-matt-pocock-skills`

Kör setupen en gång före första användning av engineering-skillsen, eller kontrollera att den redan är genomförd.

1. Utforska repots nuvarande tillstånd utan antaganden:
   - `git remote -v` och `.git/config`;
   - `AGENTS.md` och `CLAUDE.md`;
   - `CONTEXT.md`, `CONTEXT-MAP.md`, ADR:er och `docs/agents/`;
   - eventuell lokal issue-konvention under `.scratch/`.
2. Presentera fynden och ta tre beslut **ett i taget**:
   - var issues spåras;
   - vilka triageetiketter som används;
   - om repot har en eller flera domänkontexter.
3. Visa utkast till dokumentation och invänta godkännande innan något skrivs.

Setupen väljer inte åt användaren när viktiga repo-val saknar underlag.

## Fas 1: utforska organiskt

1. Läs först den berörda domänens `CONTEXT.md` och ADR:er.
2. Gå igenom kodbasen organiskt. Följ inte en mekanisk regel om filstorlek, antal imports eller lager.
3. Notera var friktion faktiskt uppstår:
   - Var kräver förståelsen av ett begrepp hopp mellan många små modules?
   - Var är ett module shallow: interfacet är nästan lika komplext som implementationen?
   - Var har rena funktioner brutits ut enbart för testbarhet, medan verkliga buggar döljer sig i hur de anropas—utan locality?
   - Var läcker tätt kopplade modules över sina seams?
   - Vilka delar är otestade eller svåra att testa genom sitt nuvarande interface?
4. Tillämpa **deletion test** på varje misstänkt kandidat:
   - Om komplexiteten försvinner när modulen raderas är den en pass-through.
   - Om komplexiteten återuppstår hos flera anropare koncentrerade modulen verklig komplexitet och kan vara värd att fördjupa.

### Codex-anpassning

Källskillen nämner en `Explore`-subagenttyp. Codex har inte samma namngivna typ. Anpassningen är enbart verktygsteknisk: en eller flera generella utforskningsagenter får exakt samma uppdrag—organisk utforskning och friktionsobservation—utan att ändra metodens beslutskriterier.

## Fas 2: skapa HTML-rapporten

Skriv en ny HTML-fil i operativsystemets temporära katalog: `<tmpdir>/architecture-review-<timestamp>.html`. Den ska inte hamna i repot.

Rapporten ska använda Tailwind via CDN och Mermaid via CDN när graf, flöde eller sekvens förklarar relationerna. Komplettera med handbyggd CSS/SVG när den visuella poängen är modularitetens massa, tvärsnitt eller kollaps från anropsgraf till djup module.

Varje kandidatkort ska innehålla:

- **Files** — berörda files/modules;
- **Problem** — varför dagens arkitektur skapar friktion;
- **Solution** — vad som föreslås förändras;
- **Benefits** — uttryckta genom locality, leverage och förbättrad testyta;
- ett specialritat **Before / After**-diagram;
- rekommendationsstyrka: **Strong**, **Worth exploring** eller **Speculative**;
- en ADR-varning endast om verklig friktion motiverar att en ADR öppnas igen.

Avsluta med **Top recommendation**: den kandidat som bör tas först och varför.

Rapporten ska vara sparsam. Diagrammen bär huvudvikten; texten använder skillens vokabulär och ersätter inte `module`, `interface` eller `seam` med lösare termer som “service”, “API” eller “boundary”.

### Första beslutspunkten

Föreslå inga interfaces i rapporten. När den är klar ställs bara frågan: **”Vilken av dessa vill du utforska?”**

## Fas 3: grilla den valda kandidaten och håll domänmodellen sann

När användaren har valt kandidat genomförs en grillningssession med `/grilling`; för kodbasarbete är `grill-with-docs` den manuella genvägen som kombinerar grillning och `domain-modeling`.

Grillningen går igenom designträdet: begränsningar, beroenden, formen på den fördjupade modulen, vad som ligger bakom seamen och vilka tester som överlever.

Regler från `grilling`:

- intervjua användaren enträget tills en gemensam förståelse finns;
- lös beroenden mellan beslut ett i taget;
- ge ett rekommenderat svar för varje fråga;
- ställ en fråga i taget och invänta svar;
- om en fråga kan besvaras genom kodutforskning, utforska i stället för att fråga.

Regler från `domain-modeling`:

- om en fördjupad module får namn efter ett nytt domänbegrepp, lägg till begreppet i `CONTEXT.md` när det har fastställts;
- skärp en suddig term direkt när den klarnar;
- kontrollera användarens beskrivning mot koden och lyft motsägelser;
- håll `CONTEXT.md` fri från implementationsdetaljer;
- erbjud ADR endast när beslutet både är svårt att återställa, överraskande utan kontext och resultatet av en verklig avvägning;
- om användaren avfärdar en kandidat av ett bärande skäl, fråga om skälet ska dokumenteras som ADR så att framtida granskningar inte föreslår samma sak igen.

## Fas 4: Design It Twice

Först när användaren vill jämföra alternativa interfaces används `DESIGN-IT-TWICE.md`.

1. Rama in problemområdet för användaren:
   - begränsningarna som varje nytt interface måste uppfylla;
   - beroenden och deras kategori;
   - en grov kodskiss som gör begränsningarna konkreta, utan att vara ett förslag.
2. Starta minst tre parallella designagenter med separata tekniska underlag: filvägar, kopplingsdetaljer, beroendekategori och vad som ligger bakom seamen.
3. Ge dem radikalt olika uppdrag:
   - minimera interfacet: högst 1–3 ingångspunkter, maximal leverage per ingångspunkt;
   - maximera flexibilitet för fler användningsfall och utbyggnad;
   - optimera för den vanligaste anroparen så att standardfallet blir trivialt;
   - vid behov: använd ports & adapters för beroenden över seams.
4. Varje design ska visa:
   - interface med typer, metoder, parametrar, invariansregler, ordning och fellägen;
   - ett användningsexempel;
   - vad implementationen döljer bakom seamen;
   - beroendestrategi och adapters;
   - avvägningar där leverage är hög eller låg.
5. Presentera alternativen en i taget. Jämför sedan depth, locality och seam placement.
6. Ge en egen, tydlig rekommendation. Föreslå en hybrid om delar från flera designalternativ hör ihop.

## Beroenden och testning vid fördjupning

Klassificera beroenden enligt `DEEPENING.md`:

| Kategori | Källans testform |
| --- | --- |
| In-process | Slå ihop och testa direkt genom det nya interfacet. Ingen adapter behövs. |
| Local-substitutable | Använd en lokal testdubblett, till exempel PGLite eller in-memory-filssystem. Seamen är intern. |
| Remote but owned | Definiera en port vid seamen; produktion använder transportadapter och tester en in-memory-adapter. |
| True external | Ta emot den externa beroendeporten och använd mock-adapter i tester. |

Teststrategin är **replace, don’t layer**:

- gamla enhetstester för grunda modules blir överflödiga när nya tester passerar den fördjupade modulens interface;
- skriv de nya testerna vid interfacet;
- testa observerbara resultat, inte internt tillstånd;
- låt tester överleva interna refaktoreringar.

## Avslutning och uttrycklig gräns

Detta skill-arbete är klart när följande finns:

- en HTML-rapport med evidensbaserade kandidater och en topprankning;
- ett användarvalt område;
- en genomgrillad förståelse av ansvar, beroenden och domänspråk;
- dokumenterade `CONTEXT.md`- eller ADR-uppdateringar endast där beslut faktiskt har kristalliserats;
- minst tre alternativa interfaces när användaren begär dem;
- en motiverad rekommendation eller hybrid;
- tester formulerade vid den valda modulens interface.

Här stannar den aktuella metodens formella scope. Ett separat uppdrag behövs innan någon bygger om produktionskod, skapar ett issue eller gör en release. Det uppdraget ska följa repots egna instruktioner och godkännas uttryckligen; det ska inte låtsas vara en del av Matts `improve-codebase-architecture`-skill.

## Källtrohetskontroll före leverans

- Har rapporten läst `CONTEXT.md` och relevanta ADR:er först?
- Bygger varje kandidat på observerad friktion och deletion test, inte på kosmetisk filstruktur?
- Använder rapporten `module`, `interface`, `depth`, `seam`, `adapter`, `leverage` och `locality` konsekvent?
- Har rapporten väntat med interface-design tills användaren valt kandidat?
- Har grillningen ställt en fråga i taget och undersökt kod när svaret funnits där?
- Har domänordlistan och ADR:er ändrats endast enligt `domain-modeling`-reglerna?
- Har alternativa designer varit radikalt olika och jämförts utifrån depth, locality och seam placement?
- Har tester placerats vid interfacet och ersatt—inte staplats ovanpå—gamla tester?
- Har vi markerat varje Codex- eller språk-anpassning öppet i stället för att tillskriva den Matt?
