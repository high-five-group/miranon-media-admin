---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Gemensamt agentkontrakt — CI-djupgranskningen (S126)

> **Proveniens:** skrivet av orkestreraren för Session 126, 2026-09-17, innan
> första agenten spawnades. Varje agent i granskningen läser denna fil FÖRST.
> Den är samtidigt granskningens metodbeskrivning: en läsare som vill veta
> hur fynden togs fram börjar här.

## Vad granskningen är

Marcus har beställt en fullständig, evidensbaserad djupgranskning av repots
CI-, test-, Git- och grindvaktsarkitektur. Uppdraget finns ordagrant i
`tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md` — läs det avsnitt
ditt uppdrag pekar på. Frågan bakom allt: är detta en välmotiverad
kvalitetsplattform, eller en avancerad maskin vars komplexitet har börjat
motivera sig själv? Svaret ska bäras av evidens, åt vilket håll det än pekar.

Du äger EN delfråga och levererar EN fil. Orkestreraren jämför alla agenters
filer, utreder motsägelser och gör egna stickprov.

## Var du arbetar

- **Arbetskatalog:**
  `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s126-ci-djupgranskning`.
  Kör `pwd` som första kommando. Står du någon annanstans: STOPPA och
  rapportera, skriv ingenting.
- **Avvikelse mot agent-definitionen, medveten:** `research-pass` säger
  "oisolerat i huvudkatalogen" och "en fil under `docs/research/`". Här gäller
  i stället denna worktree och den exakta sökväg uppdraget ger dig, under
  `docs/research/ci-djupgranskning-2026-09-17/`. Skälet: huvudkatalogen
  `/Users/marcus/Repon/miranon-media-admin` ägs just nu av en ANNAN levande
  session (S125).
- **Huvudkatalogen rörs aldrig.** Skriv inte där, kör inte git mot den
  (`git -C`, `cd` dit — harnesset avvisar det dessutom). Allt du behöver
  läsa finns i worktreen, som är en komplett utcheckning.
- **Ögonblicksbilden** är `origin/main` på `eeca8c72` (2026-09-08). Det som
  ligger i öppna PR:er är "pågående, ej landat" och beskrivs så — aldrig som
  nuläge.

## Vad du får och inte får göra

- **Skriv exakt EN fil** — den sökväg uppdraget anger. Rör ingen annan fil.
  Committa aldrig, staga aldrig, byt aldrig gren, skapa ingen worktree.
- **Utåt är du skrivskyddad.** Inga PR-kommentarer, inga ärenden, ingen
  `workflow_dispatch`, ingen omkörning av körningar, inga deployer, inga
  skrivningar mot Airtable eller Supabase. Läsande `gh`-anrop är fria
  (`gh api` med GET, `gh run list/view`, `gh pr list/view`, `gh ruleset`).
- **Var sparsam mot GitHub-API:t.** En annan session använder det
  samtidigt. Hämta en sida i taget, begränsa med `--limit`, och spara ner
  det du hämtat i stället för att fråga igen.
- **Skriv aldrig ut hemligheter.** Namn på hemligheter och variabler är
  evidens; värden är det aldrig. Läs inte `.env*`-filers värden in i din fil.
- **Ingen väntan på bakgrundssignaler.** Kör allt du måste invänta i
  förgrunden. En tur som avslutas med "jag väntar på…" återvänder aldrig.

## Tillägg inför våg 2 och 3 (2026-09-17, efter att våg 1 rapporterat)

- **Spawna inga egna agenter eller forkar.** I våg 1 spawnade två agenter
  egna forkar, vars forkar i sin tur skrev till leverabeln utanför sitt
  uppdrag — och de nästlade agenterna åt upp harnessets tak på 20 samtidiga
  subagenter. Du gör ditt arbete själv, i en tur.
- **Orkestrerarens stickprovslogg går före agenternas filer.**
  `underlag/01-orkestrerarens-stickprov.md` bär arton egna mätningar. Där en
  post säger **föll** eller **skärpt** är det loggens version som gäller, och
  där den säger AVGJORD är motsägelsen mellan två agenter löst. Läs loggen
  i sin helhet innan du bygger på något underlag.
- **Repot är PUBLIKT** (mätt 2026-09-17, stickprov S14). Allt du skriver blir
  läsbart för vem som helst. Skriv aldrig namn på deltagare eller kunder,
  aldrig e-postadresser till verkliga personer. Prod-incidenten som i repot
  bär ett förnamn heter i denna granskning "prod-incidenten 2026-09-03
  (S115)".
- **Underlaget från våg 1** ligger i `underlag/` (`j1a`–`j1f`, `j3`, `j4a`,
  `j8-1`, `j8-4`–`j8-8`) och som fyra färdiga leverabler i katalogens rot
  (`03`, `04`, `06`, `07`). De är källmaterial: citera dem med filnamn och
  avsnitt, och pröva mot koden när ett påstående bär din slutsats.

## Uppdragets premisser är hypoteser

Varje faktapåstående i ditt uppdrag är källmärkt där orkestreraren kunnat
(ADR-086). Det som saknar källa är en HYPOTES — pröva den mot disk innan du
bygger på den. Uppdragsfilen är dessutom sju veckor gammal (2026-07-29):
jobbnamn den citerar kan ha bytt namn. Besvara frågan mot DAGENS arkitektur
och säg vad namnet är i dag.

Hittar du att en styrande text (`CLAUDE.md`, `CONTRIBUTING.md`, en ADR)
påstår något som implementationen inte gör — det är ett FYND, inte ett
fel i din läsning. Registrera det med båda källorna.

## Inventera vad vi redan vet — före första sökningen

`ls docs/research/` och läs filnamnen; öppna det som kan överlappa. Sök
`docs/decisions/` på ditt ämne och läs varje styrande ADR i sin helhet
innan du föreslår något — ett förslag som en ADR redan förkastat med skäl
river ett medvetet designval. Bedöm åldern på det du hittar, och bygg
vidare hellre än att skriva om. Din fil öppnar med vad du läste och vad
som därför är nytt.

## Evidenskravet

Varje bärande påstående pekar på något en läsare kan kontrollera:
`fil:rad`, workflow- och jobbnamn, commit-SHA, PR-nummer, run-ID, eller det
exakta kommando du körde (med datum). Påståenden utan belägg märks
uttryckligen som obelagda.

**Märk varje slutsats** med exakt en av:

- **verifierad** — du har själv sett implementationen eller mätt beteendet
- **starkt indikerad** — flera oberoende spår pekar dit, men du har inte
  sett själva mekanismen
- **osäker** — spåren är tunna eller motsägande
- **ej verifierbar** — du saknar åtkomst; skriv exakt vad som krävs för att
  fylla luckan (vilken behörighet, vilket kommando, vem som kan köra det)

**Håll isär sex slags sanning** och säg vilken du talar om: dokumenterad
avsikt · faktisk implementation · tekniskt framtvingad regel · frivilligt
arbetssätt · empiriskt observerat beteende · ej verifierat. En regel som
bara står i prosa är ett arbetssätt, inte en spärr — hur väl den än är
skriven.

Mät hellre än citera. Går ett påstående att pröva utan att ändra något —
pröva det, och rapportera mätningen med version och datum.

Frånvaro av bevis är inte bevis: "jag hittade ingen" är inte "det finns
ingen". Var kritisk åt BÅDA håll — mot överbyggnad och mot alltför
aggressiv förenkling.

## Så skrivs filen

- **Frontmatter** överst, exakt: `owner: marcus803`, `updated: 2026-09-17`,
  `review_by: 2026-12-17`, `status: draft`.
- **Struktur:** H1 · proveniens-blockquote (vem, när, vilken modell, vilken
  ögonblicksbild) · *Kort svar* (domen i klartext, max en skärm) · *Vad jag
  läste först* · *Metod* · *Fynd* (ett avsnitt per delfråga, med evidens) ·
  *Osäkerheter och vad jag inte kunde belägga* · *Risker* ·
  *Rekommendationer* (märkta som rekommendation, aldrig som beslut) ·
  *Källor*.
- **Begripligt för en läsare utan teknisk bakgrund** — referenspersonen är
  Gunilla, 56, förskollärare. Förklara varje tekniskt begrepp första gången
  det används, i en bisats eller en mening. Men utelämna ingen teknisk
  detalj: förklara den i stället.
- **Destillat, aldrig rådumpar.** Tabeller där de gör jämförelsen läsbar.
  Svenska.
- **Hänvisa till repo-filer som `kod`, inte som länkar** —
  `.github/workflows/ci.yml:412`. Relativa länkar från denna djupa katalog
  blir lätt fel och fäller länkgrinden. Länka bara till syskonfiler i samma
  granskning, och kontrollera att målet finns.
- **Webbkällor** anges med full URL i källförteckningen.

## Grindar du kör — och en du inte kör

Kör riktat mot DIN fil, i förgrunden, och läs exitkoden direkt (pipa aldrig
till `tail`/`head` — då är det pipens exitkod du läser):

```bash
npx markdownlint-cli2 --no-globs "<din fil>" > "<scratch>/mdl.log" 2>&1; echo "exit: $?"
vale "<din fil>" > "<scratch>/vale.log" 2>&1; echo "exit: $?"
```

Rätta tills båda är rena. **`--no-globs` är obligatorisk** (rättat
2026-09-17 under våg 1): utan flaggan slår `markdownlint-cli2` ihop din fil
med configens globbar och lintar omkring 650 filer — cirka två minuter per
körning. Mätt under våg 1: fyra sådana körningar samtidigt, plus övrig
agentlast, gav en belastning på 269 på en maskin med 16 kärnor, medan en
annan session körde tidskänsliga Playwright-tester. Med flaggan lintas en
fil på tre sekunder. Skriv utdata till fil och läs filen — en hook i repot
fäller varje försök att pipa en grind till `grep`, `tail` eller `head`.

**Maskinen är delad.** Kör tunga kommandon (`npx playwright test --list`,
`npm run metrics:ci`, breda `find`/`wc` över hela disken) EN gång, spara
utdata till scratch och räkna på filen. **Kör INTE `npm run check:docs`** — ett tjugotal
agenter skriver samtidigt, och helgrinden skulle fälla på någon annans
halvskrivna fil. Orkestreraren kör helgrinden en gång när alla är klara.

## Din slutrapport till orkestreraren

Ett returvärde, inte ett meddelande till en människa:

- din faktiska modell-identitet (exakta raden ur din systemprompt)
- domen i klartext
- de tre till sju viktigaste fynden, vart och ett med sin evidenspekare och
  sin märkning
- varje motsägelse du såg mellan styrande text och implementation
- vad du inte kunde belägga, och vad som krävs för att fylla luckan
- oväntade fynd utanför din fråga — registrera dem, förkasta aldrig tyst
- filens fulla sökväg och utfallet av de två grindarna
