---
owner: marcus803
updated: 2026-08-24
review_by: 2027-02-24
status: draft
---

# Markörformernas re-mätning — hur många UNIVERSAL-former bär korpusen faktiskt, och hur mycket missar skillens grep

> **Proveniens:** avgränsat mätpass 2026-08-24 (S112 fix-våg 3), beställt av
> orkestreraren för att verifiera S111:s påstående *"minst ÅTTA former — 12
> poster osynliga"* mot en oberoende räkning, sedan ett tidigare hub-agent-pass
> (S112, samma dag) sökte efter en dedikerad artefakt för den åttonde formen
> och inte hittade en. Kört som REN LÄSNING i worktree
> `.claude/worktrees/agent-ab42ca4e2d1956911` mot repots arbetsträd vid
> mättillfället. Modell: **Claude Sonnet 5** (`claude-sonnet-5`) — denna
> uppgift kräver explicit modell-identitet i rapporten (lärdomen
> [[L591]]).
> Inga skills ändrade, inga beslut fattade — mätfakta, inget annat.

## Svaret, kort

**Den åttonde formen LANDADE — som prosa i `tasks/lessons.md` (indexet),
commit `bb38774b` (S111, 2026-08-23 21:19:20 +0200), inte som en fristående
`docs/research/`-fil.** Premissen i uppdraget — att den "ALDRIG landade som
artefakt" — är alltså **falsifierad**: indexets egen text (rader 55–65)
namnger Form 7 (`**Det generella (UNIVERSAL):**`, parenteser) och Form 8
(`**[UNIVERSAL] <kroppstext fortsätter>**`, markören inuti den feta tesen)
med exakt samma L-nummer och exakt samma räkning (12 = 6+6) som denna
oberoende mätning återfinner. S112:s hub-agent sökte sannolikt efter en
fristående forskningsfil och missade att fyndet redan bor i indexets egen
löptext.

**Men "minst åtta" är i sig en underskattning.** Denna mätning hittar **minst
tio** strukturellt distinkta former i den aktiva L-numrerade korpusen (utöver
skillens sex) — två som S111 aldrig namngav:

- **Form 9** — rubrik med bokstavssuffix i stället för sifferserie:
  `### L_A [UNIVERSAL] — Titel` … `### L_L [UNIVERSAL] — Titel` (12 poster,
  `vol-02.md`, Session 6.6.7-omgången).
- **Form 10** — fristående, oformaterad markör helt utan fetstil/backticks på
  egen rad: `[UNIVERSAL]` (1 post, `L414`, `vol-05.md`).

Och en helt SEPARAT population existerar utanför den L-numrerade korpusen:
**stängda, pre-numrerings-eran** (`vol-01.md` i sin helhet, plus
`vol-02.md`:s första ~515 rader före `L1`) bär minst **fyra egna**
strukturella varianter av markören (bar radslutande punktlista, punktlista
utan L-nummer, rubrik utan L-nummer, tabellcell) — redan historiskt hub-lyfta
under en äldre process, utanför skillens mandat per dess egen
`L[0-9]+`-baserade räkne-invariant.

## Metod

1. Läste båda `SKILL.md`-versionerna (cache `1.34.0/skills/lessons-hub-sync/`
   och hubbens källrepo) — **byte-identiska** (`diff` exit 0), ingen drift
   mellan cache och källa.
2. Extraherade skillens dokumenterade sexforms-grep verbatim (§ "Markörens
   SEX former") och körde den mot HELA korpusen i denna spoke: `tasks/lessons/
   vol-01.md`…`vol-07.md` + samtliga 66 filer i `tasks/lessons.d/` +
   `tasks/lessons.md` (indexet).
3. Körde en oberoende, case-insensitive rå-räkning (`grep -rniE universal`)
   mot samma filmängd och beräknade mängddifferensen (rå träff MINUS
   skill-matchad träff) via nyckel-join på `fil:radnummer` — inte
   textsök, för att undvika falska överlapp.
4. Läste varje osynlig rad i kontext (post-tillhörighet, L-nummer, volym-
   status) och klassade den i en av: (a) genuint ny markörform, (b) redan
   känd falsk-positiv-klass (mall-fras, meta-referens till markören som
   begrepp), (c) legitimt utanför skillens `L[0-9]+`-scope (pre-numrerings-
   era, stängd volym).
5. Verifierade varje ny forms exakta instansantal mot L-nummer-rubriker med
   riktade grep-mönster, inte uppskattning.
6. Källmärkte S111-fyndets landningscommit via `git log -S`/`git show` mot
   `tasks/lessons.md`.

## Mätdata — formtabell

### Skillens sex dokumenterade former (baseline, oförändrade)

| Form | Mönster | Status denna mätning |
|---|---|---|
| A | `### L281 [UNIVERSAL] — Titel` | Fångas av skillens grep |
| B | `### L342 — [UNIVERSAL] Titel` | Fångas |
| C | `### L<nnn> [UNIVERSAL, hub-lyft]` | Fångas |
| D | `` `[UNIVERSAL]` `` (backtick, efter fet titel) | Fångas (men bär 24 kända falska positiver bland 105 råa träffar, oförändrat sedan S97-mätningen) |
| E | `- [UNIVERSAL] **L103 — Titel**` (punktlista) | Fångas |
| F | `**[UNIVERSAL]**` (fristående fetstil, sluten direkt) | Fångas |

### Nya former funna i denna mätning — aktiv L-numrerad korpus

| Form | Mönster | Instanser | Exempelrad | Osynlig för skillens grep? |
|---|---|---|---|---|
| **7** | `**Det generella (UNIVERSAL):**` (parenteser, inuti en fetstilssats mitt i posten) | **1** — `L514`, `vol-06.md:3110` | `**Det generella (UNIVERSAL):** när en grind läggs till i CI utan att samtidigt läggas till i den yta utförarna faktiskt läser…` | Ja — redan dokumenterat i `tasks/lessons.md` (commit `bb38774b`) |
| **8** | `**[UNIVERSAL] <kroppstext fortsätter i SAMMA fetstilsspann>**` — skiljer sig från F genom att stängningen `**` kommer efter flera meningar, inte direkt efter `]` | **12** i numrerade poster: `L516`–`L521` (`vol-06.md`, S109-skörd) + `L527`–`L528`–`L529`–`L530`–`L531`–`L532` (`vol-07.md`, S111-skörd). **+6 till** i ännu onumrerade `tasks/lessons.d/`-fragment (framtida risk, ej ännu poster) | `**[UNIVERSAL] En bild som tas för att LÅSA en yta är samtidigt den sista…**` (`vol-07.md:323`) | Ja — redan dokumenterat i `tasks/lessons.md` (commit `bb38774b`) |
| **9 — NY, ej tidigare dokumenterad** | `### L_A [UNIVERSAL] — Titel` … `### L_L [UNIVERSAL] — Titel` (bokstavssuffix i stället för sifferserie efter `L`) | **12** — `L_A`…`L_L`, `vol-02.md:606`–`678` (Session 6.6.7-omgången, före den slutgiltiga sekventiella `L<nnn>`-konventionen stabiliserades) | `### L_A [UNIVERSAL] — JSON-räkning över grep-räkning för shellcheck-output` | Ja — `^### L[0-9]+` kräver siffra direkt efter `L`, `_A` matchar aldrig. **Ny upptäckt denna mätning.** |
| **10 — NY, ej tidigare dokumenterad** | Fristående `[UNIVERSAL]` helt utan fetstil/backtick, ensam på egen rad direkt efter `### L<nnn>`-rubriken | **1** — `L414`, `vol-05.md:1837` | (rad 1835–1837: `### L414 — …` / tom rad / `[UNIVERSAL]`) | Ja — matchar ingen av skillens fyra `-e`-mönster (inget backtick, ingen fetstil, ingen punktlista, ingen text i rubrikraden). **Ny upptäckt denna mätning.** |

### Falska positiver — genuint tvetydiga men INTE nya markörformer

| Mönster | Instanser | Skäl till exkludering |
|---|---|---|
| `#### Varför den är [UNIVERSAL]` (rubrik, brackets) | 1 (`L523`, `vol-07.md:145`) | Rationale-underrubrik i en post som redan bär en genuin Form-D-tagg (`` `[UNIVERSAL]` `` rad 104) — täcker ingen ny post. Samma funktion som skillens redan dokumenterade mall-fraser ("Varför `[UNIVERSAL]`:"), bara realiserad som `####`-rubrik med hakparentes i stället för inline-prosa med backtick. |
| `[UNIVERSAL]-kandidat` / `**[UNIVERSAL]-kandidat**` | 2 (`tasks/lessons.d/ci-rod-felsokning-…md`, `tasks/lessons.d/autofix-scopet-…md`) | Explicit **ej bekräftad** — "kandidat" signalerar att posten INTE ännu är en beslutad UNIVERSAL-tagg. Semantiskt samma klass som skillens redan dokumenterade "Kandidat för `[UNIVERSAL]`"-mallfras, men bracket- i stället för backtick-realiserad. Relevant för framtida konsolidering (dessa två fragment saknar fortfarande L-nummer), inte för dagens osynlighetsräkning. |
| `> Antal poster: N, alla [UNIVERSAL] (Lxx–Lyy)` — aggregerade sammanfattningsrader | 8 (samtliga `vol-02.md`, rader 602–1156) | Beskriver en RANGE, inte en enskild post — de individuella posterna i intervallet bär redan sina egna, separat matchade markörer. Räknas inte som ytterligare osynliga poster. |
| Meta-referenser till markören som BEGREPP (självbeskrivande prosa) | 3 (`tasks/lessons.md:57,59`, `vol-06.md:1301`) | Detta är just den prosa i indexet som DOKUMENTERAR formerna 7/8, plus en post som beskriver Form E som exempel. Nämner markören, bär den inte. |

### Population helt utanför skillens `L[0-9]+`-scope (stängd pre-numrerings-era)

| Källa | Rå "universal"-träffar | Karaktär |
|---|---|---|
| `vol-01.md` (2026-03-19 → 2026-05-04, **Stängd**, "före L-numreringen") | 187 | Fyra egna strukturella former: bar punktlista med markör i slutet (`- text… [UNIVERSAL]`), punktlista med fet titel men UTAN L-nummer (`- [UNIVERSAL] **Titel**`), rubrik utan L-nummer med markör i slutet (`### Titel [UNIVERSAL]`), tabellcell (`\| datum \| kategori \| [UNIVERSAL] text \|`) |
| `vol-02.md`, rader 1–515 (före `### L1` på rad 516) | 96 av vol-02:s 116 osynliga rader | Samma pre-numrerings-generation: `K1.1`–`K9.1`-rubrikformer, bar punktlista utan L-nummer, `L_A`–`L_L` (se Form 9 ovan — denna specifika underform ÄR inom L-serien och räknas separat) |

Denna population är redan historiskt hub-lyft under en äldre process (posternas
egna sammanfattningsrader dokumenterar leveranserna, t.ex. *"Alla 14 hub-lyfts
… vid K-sista #5"*), och volymerna är låsta (*"Nya block tillkommer aldrig i en
stängd volym"*). Skillens egen räkne-invariant (§ "Räkna alltid posterna i
BÅDA rubriknivåerna…", 452 rubrik + 17 listpost = 469 = högsta `L469`) är
uttryckligen `L[0-9]+`-baserad och omfattade aldrig denna population. Den
räknas här för fullständighetens skull, inte som en lucka i skillens mandat.

## Osynlighetsräkningen — sammanställt

| Storhet | Värde | Källa |
|---|---|---|
| Rå "universal"-träffar, hela korpusen (case-insensitive) | **885** | `grep -rniE universal` mot vol-01…07 + lessons.d + lessons.md |
| Rader fångade av skillens sexforms-grep | **556** | Skillens exakta `-e`-uttryck, samma filmängd |
| Rader INTE fångade | **329** | Mängddifferens, `fil:rad`-join |
| — varav pre-numrerings-era, utanför scope (vol-01 helt + vol-02 rad 1–515) | **283** | 187 (vol-01) + 96 (vol-02 pre-`L1`) |
| — varav Form 9 (`L_A`–`L_L`, inom L-serien men bokstavssuffix) | **12** | `vol-02.md:606–678` |
| — varav Form 7 (parentes) | **1** | `L514` |
| — varav Form 8 (fetstil-fuserad) i redan numrerade poster | **12** | `L516`–`L521`, `L527`–`L532` |
| — varav Form 8 i ännu onumrerade fragment | **6** | `tasks/lessons.d/*.md` |
| — varav Form 10 (bar fristående markör) | **1** | `L414` |
| — varav rationale-rubrik, redan täckt post (ej ny lucka) | **1** | `L523` |
| — varav kandidat-suffix, ej bekräftad post | **2** | två `lessons.d`-fragment |
| — varav aggregerade sammanfattningsrader (ej individuell post) | **8** | `vol-02.md` |
| — varav meta-referenser till begreppet | **3** | `tasks/lessons.md` ×2, `vol-06.md` ×1 |
| **Summa kontroll** | 283+12+1+12+6+1+1+2+8+3 = **329** | Stämmer mot mängddifferensen ovan |

**Antal POSTER (inte rader) osynliga för skillens grep, inom dess egna
`L[0-9]+`-mandat:** `L414` (1) + `L514` (1) + `L516`–`L521` (6) +
`L527`–`L532` (6) + `L_A`–`L_L` (12) = **26 poster**. Av dessa är 12
(`L_A`–`L_L`) i en stängd, redan hub-lyft volym — de tillför inget nytt
lyft-behov men bevisar att formdriften har pågått längre och brett bredare
än S111 kände till. De **akut relevanta** posterna för nästa hub-lyft (redan
identifierade i S111, oförändrat av denna mätning) är de **12** i `L514` och
`L516`–`L532`-spannet.

## Falsifieringsutfallet

Två separata påståenden prövades:

1. **"Den åttonde formen landade ALDRIG som artefakt."** — **FALSIFIERAT.**
   Den landade i `tasks/lessons.md` rad 55–65, commit `bb38774b`
   (2026-08-23 21:19:20 +0200, S111). Texten namnger både Form 7 och Form 8
   med exakt L-nummer och exakt räkning (12 = 6+6), identiskt med denna
   mättnings oberoende fynd för dessa två former. S112:s hub-agent-sökning
   hittade den sannolikt inte för att den letade efter en fristående
   `docs/research/`-fil snarare än prosa i indexets löptext.
2. **"Minst ÅTTA former — 12 poster osynliga."** — **BELAGT för Form 7+8
   specifikt (räkningen 1+12=13 poster, varav 12 är den "akuta" S111-siffran
   för Form 8 allena — S111:s "12" avsåg Form 8:s instanser, inte summan
   över alla nya former), men UNDERSKATTAT som helhetsbild.** Denna mätning
   hittar minst **tio** strukturellt distinkta former i den aktiva
   L-numrerade korpusen (sex kända + Form 7 + Form 8 + de två nya: Form 9 och
   Form 10) och **26** osynliga poster totalt inom skillens eget
   `L[0-9]+`-mandat — mer än dubbelt "12" om man räknar alla nyupptäckta
   former, inte bara den mest akuta.

## Uppdaterad kostnadsbild för konvergens till kandidat 1 (fristående `**[UNIVERSAL]**`-rad)

Skillens tidigare kostnadstabell (§ "Konvergens till EN form") anger **444**
berörda poster och **470** råa markör-textträffar, mätt 2026-08-05 mot 469
poster totalt i filen. Denna mätning är mot en STÖRRE och ANNORLUNDA
strukturerad korpus (volym-splitten `TASK-161.9` hände 2026-08-08, EFTER den
mätningen; högsta numret är nu `L532`, inte `L469`), så talen är inte direkt
jämförbara utan omräkning. Vad DENNA mätning tillför kostnadsbilden,
specifikt:

| Post-population | Antal | Normaliseringskaraktär vid full konvergens |
|---|---|---|
| Form 7 (`L514`) | 1 | Flytta markören från en parentetisk mening mitt i kroppen till en fristående rad direkt efter rubriken — L514s rubrik bär i dag INGEN markör alls, så detta är en STRUKTURELL tillägg, inte bara en teckensubstitution |
| Form 8, numrerade (`L516`–`L521`, `L527`–`L532`) | 12 | Klippa ut `[UNIVERSAL]` ur den fuserade fetstilssatsen och lägga den på egen rad — kräver att resten av den ursprungliga tesen (som förlorar sin inledande ord) omformuleras grammatiskt, inte ren flytt |
| Form 8, onumrerade fragment | 6 | Samma ändring, men sker naturligt vid konsolidering till L-nummer (ADR-081-flödet) — ingen extra kostnad om normaliseringen görs SAMTIDIGT som numrering |
| Form 9 (`L_A`–`L_L`) | 12 | I en STÄNGD volym — "Nya block tillkommer aldrig i en stängd volym" gäller tillägg, inte nödvändigtvis rättning av befintlig markörform; om konvergens tolkas som "rör aldrig en stängd volym" adderar detta 0 till kostnaden, annars +12 poster med samma flytt-karaktär som A/B/C i skillens ursprungliga tabell |
| Form 10 (`L414`) | 1 | Enklaste fallet — redan en fristående rad, byter bara `[UNIVERSAL]` mot `**[UNIVERSAL]**` (ren teckentillägg, ingen flytt) |

**Kända falska positiva-klasser att INTE normalisera vid en migreringsskript-
körning** (samma varningsklass som skillens redan dokumenterade
D-backtick-kontaminering): de 8 aggregerade sammanfattningsraderna, de 3
meta-referenserna till begreppet, `L523`s rationale-rubrik (redan täckt via
sin egna Form-D-tagg) och de 2 kandidat-suffix-fragmenten (ej bekräftade —
en migrering som "normaliserar" en `-kandidat`-tagg till en bekräftad
`[UNIVERSAL]`-tagg skulle tysta ändra postens status).

**Vad denna mätning INTE gör:** räkna om skillens ursprungliga 444/470-tal
mot dagens fulla `L1`–`L532`-korpus (det kräver att köra om hela dess
metodik, inte bara osynlighets-diffen denna uppgift beställde), eller föreslå
vilken konvergensväg som ska väljas. Ingen migrering är körd. Inget beslut är
fattat.

## Källor

- `SKILL.md` (identisk i cache `1.34.0` och hubbens källrepo,
  `diff` exit 0) — § "Markörens SEX former", § "Konvergens till EN form".
- `tasks/lessons.md` (denna spoke), rad 40–78, commit `bb38774b3255bd63b862ca18bcc8c95c6a75b821`.
- `tasks/lessons/vol-01.md`…`vol-07.md`, `tasks/lessons.d/*.md` (66 filer) —
  fulltext-grep denna mätning.
- `git log -S`/`git show` mot `tasks/lessons.md` för landningscommitens
  tidsstämpel och budskap.
