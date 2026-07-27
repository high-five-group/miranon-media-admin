# `lessons.d/` — nummerlösa lesson-kandidater

Numret tilldelas **vid landning**, aldrig vid skrivning. Den här katalogen är
platsen där en kandidat väntar tills dess.

## Varför katalogen finns

2026-07-26 mintade två parallella agenter båda `L354` och `L355`, var och en
omedveten om den andra. Kollisionen löstes för hand vid landningen — hover-grenens
fyra numrerades om. Med fler parallella agenter är kollisionen **garanterad, inte
osannolik**.

Grundfelet är inte slarv. Det är att formen kräver att varje skribent *antar*
nästa lediga nummer genom att läsa en fil som någon annan redan skriver i. Det
antagandet är osäkert per konstruktion i ett parallellt arbetsflöde.

## Så här skördar du en lärdom

1. **Skapa en fil här.** Beskrivande slug, inget nummer:
   `tasks/lessons.d/hover-assertioner-maste-kunna-hovra-om.md`
2. **Ge filen en H1 med läsbar titel, utan nummer** — `# Verifiera med CI:s
   exakta kommando`. Sedan den fetstilta kärnsatsen, precis som en konsoliderad
   post gör efter sin rubrik. Flagga `[UNIVERSAL]` där det gäller.

   H1:n är inte kosmetik: `markdownlint` MD041 kräver att första raden är en
   topprubrik, och fragment lintas som all annan markdown. Att börja direkt med
   fetstil fäller grinden — fångat skarpt när det första fragmentet skrevs.
   Grinden nedan fäller på `### L<nnn>`, inte på en vanlig `#`-rubrik, så en
   titel-H1 är helt förenlig med nummerlösheten. Vid konsolidering byts H1 mot
   `### L<nnn>`.
3. **Landa fragmentet** med det arbete som gav lärdomen. Fragmentet är en
   fullgod leverans — lärdomen är säkrad i fil, vilket är kravet.
4. **Numret sätts vid konsolidering**, av den som flyttar posten in i
   `tasks/lessons.md`. Då — och först då — är ordningen seriell, eftersom
   merge-grinden (ADR-076) släpper in en PR i taget.

## Vad grinden kräver

`scripts/check-lesson-numbers.sh` (config: `.lesson-policy.conf`) håller två
invarianter:

- **Ingen numrerad rubrik förekommer mer än en gång** i `tasks/lessons.md`.
- **Inget fragment här bär en numrerad rubrik.** Skriver du `### L400` i ett
  fragment fälls grinden — numret är inte ditt att välja.

Den här filen är undantagen från den andra kontrollen (`LESSON_EXCLUDE_BASENAMES`),
så den får citera rubrik-former i förklarande syfte.

## Formen är lånad, inte påhittad

**towncrier** (Twisted, pytest, pip, BuildBot, attrs) löser samma problem för
changelogs: i stället för en delad fil som ger merge-konflikter skapar varje
bidrag ett eget *news fragment*, och identiteten sätts vid release. Verktyget
tillåter uttryckligen fragment utan ID — `+`-prefixet — vilket är exakt vår form.

**Rust RFC 0002** tillämpar samma princip på numret självt: *"don't assign an RFC
number yet; this is going to be the PR number and the file will be renamed
accordingly if the RFC is accepted."* Numret kommer från en allokator som inte
kan kollidera.

**ADR-communityn har problemet öppet.** [MADR issue #28](https://github.com/adr/madr/issues/28)
beskriver vårt fall exakt och föreslår en lock-fil, med den erkända svagheten att
*"a Dev may forget to modify the lock file"*. Issuen är obesvarad. Precedent-rymden
för just ADR-numrering är alltså tunn, och det är öppet deklarerat i ADR-081 —
räkningen fejkas inte.

**Vårt eget backlog-substrat** har redan rätt mönster utan att det kallats så:
kort-ID:n kolliderar aldrig eftersom `backlog`-CLI:t äger allokeringen. Lessons
hade inget motsvarande verktyg — den här katalogen ersätter behovet av ett.

## Fullt beslut

[ADR-081](../../docs/decisions/ADR-081-nummer-tilldelas-vid-landning.md)
