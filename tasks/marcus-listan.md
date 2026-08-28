---
owner: marcus803
updated: 2026-08-28
review_by: 2026-11-28
status: stable
---

# Marcus-listan — allt som väntar på dig, i en lista

> **Vad den är:** en KARTA över de punkter där arbetet står still tills du
> svarar, kör ett kommando, tittar på en yta eller går en vandring. Den är
> aldrig en kopia av korten — kortet, tråden eller PR:en ÄR källan
> (`ADR-100` §2), och varje punkt slutar med en källrad så du kan slå upp
> ursprunget. Står något här som motsäger kortet vinner kortet.
>
> **Så svarar du:** punktnummer plus beslut i chatten — `"3: B"`,
> `"15: paused på alla tre"`, `"19: kör"`. Orkestreraren verkställer:
> bockar AC, mintar skivan, spawnar bygg-agenten, uppdaterar kortet.
> Du behöver aldrig öppna backlog-verktyget själv.
>
> **Underhåll:** orkestreraren uppdaterar listan vid varje landning — en
> avklarad punkt flyttas till avsnitt E med belägg i stället för att
> raderas, så du ser att den inte glömts bort.
>
> **Sektionerna:** A = svar i chatten räcker · B = kommandon i din egen
> terminal · C = granskning i webbläsaren · D = vandringar i appen ·
> E = parkerat med avsikt, inget att göra nu.
>
> **Mätt mot disk och GitHub 2026-08-28.** Punkterna 34–40 är sådant du
> INTE behöver röra just nu.

---

## A. Svar i chatten räcker

### 1. Substratet för arbetskorten — Backlog.md rätt inställt eller byte?

- **Vad det är** — kortskapandet är repots flaskhals. `backlog task create`
  tar ett globalt lås med 30 sekunders budget; en create tar 12–35 sekunder
  med dagens grenpopulation. Vid åtta samtidiga agenter lyckades **två av
  åtta** — resten dog med "Another task create operation is already in
  progress". Ett enskilt kort tog **513 sekunder** att skapa under
  S112:s fleet.
- **Varför det väntar på dig** — substratval ligger över ADR-baren (svårt
  att återställa i koherens; 656 kortidentiteter lever i ADR:er, sessionsdok
  och commit-meddelanden). En agent får inte välja åt dig.
- **Gör så här** — svara fyra frågor, en rad var:
  1. Måste kortets sanning vara en fil i vår git-commit? (ja/nej)
  2. Accepterar vi att en nummerkollision upptäcks vid LANDNING i stället
     för att förhindras vid skapandet? (ja/nej)
  3. Hur många parallella agenter ska substratet bära? (ett tal)
  4. Vad är 656 döda `TASK-N`-referenser värda vid ett byte? (acceptabelt /
     oacceptabelt)
- **Min rekommendation** — alternativ 2 nu (stäng av gren-skanningen, lägg
  en kollisionsgrind vid landning): det är mätt till 8/8 lyckade på 6,5
  sekunder, kräver ingen migrering av 656 kort och är reversibelt med en
  config-rad — behåll GitHub Issues som långsiktig kandidat utan att välja
  den i dag.
- **Vad som låses upp** — hela fleet-driften; varje agent som ska minta ett
  kort betalar i dag den här kostnaden. Låser också upp `TASK-327`
  (uppgradering till 1.50.1) och `TASK-323` (gren-städningen).
- **Källa** — `TASK-328` · underlag
  `docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md`
  (543 rader; § Rekommendation + de fyra styrfrågorna på rad 495–507).

### 2. Nattjobbets `fetch-depth` — ska closure-grinden kunna verifiera i natten?

- **Vad det är** — closure-grinden kontrollerar att varje `Landning: PR #N`
  på ett stängt kort pekar på en commit som faktiskt finns i historiken.
  Nattjobbet checkar ut med `fetch-depth: 1` (bara senaste commiten), så
  grinden kan inte se historiken och rapporterar "11 pekare OPRÖVADE" i
  stället för att fälla ett påhittat PR-nummer.
- **Varför det väntar på dig** — `ADR-127` § B4 skriver ut `fetch-depth: 1`
  som ett medvetet val. Att ändra det är en amendering av en fattad ADR,
  inte en bugfix.
- **Gör så här** — svara **A** (aktivera full historik i nattjobbet och
  amendera `ADR-127` § Updates) eller **B** (behåll degraderat läge —
  "OPRÖVAD"-raden står kvar varje natt).
- **Min rekommendation** — A, men villkorat: låt en agent först mäta
  CI-tiden i ett dispatch-run och aktivera bara om ökningen är försumbar —
  en grind som varje natt rapporterar sin egen blindhet är inte en grind.
  (Talet "+0,08 %" som cirkulerat är en LOKAL mätning och står som OBELAGD
  på kortet; kopiera den inte.)
- **Vad som låses upp** — nattens closure-rapport blir sann i stället för
  delvis oprövad; `TASK-319`:s ancestry-verifiering får verkan där den
  behövs mest.
- **Källa** — `TASK-326` · `docs/decisions/ADR-127-backlog-stangningsformerna-harledd-dod-och-avstadda-krav.md`
  rad 129–132, 193, 232, 236 · mätvärdena bor på `TASK-319`:s kort.

### 3. Review-utlåtandets `kortId` är singulärt — bunt-PR:er tappar AC-prövningen

- **Vad det är** — granskaren hämtar kortets acceptanskriterier verbatim och
  prövar dem. Utlåtandets schema bär ETT `kortId`, så en PR som landar flera
  kort kan bara AC-prövas mot ett av dem. Mätt på fem bunt-PR:er 2026-08-26
  (`#1978`, `#1982`, `#1986`, `#1987`, `#1988`) — där blev AC-prövningen fri
  prosa i stället för struktur.
- **Varför det väntar på dig** — att utvidga `ADR-105` beslut 7 till flera
  kort per PR är ett ADR-beslut plus en bakåtkompatibel schemaändring.
- **Gör så här** — svara **A** (en PR per kort — river bunt-landningsformen),
  **B** (`kortIdn: string[]` med tom default, `kortId` kvar på AC-prövningen)
  eller **C** (låt ligga — bunt-PR:er saknar fortsatt AC-prövning på alla
  kort utom ett).
- **Min rekommendation** — B: den behåller bunt-landningen som redan är
  etablerad praxis och kostar en schemaändring i ett mönster vi redan använt
  en gång (`173.2`:s default-migrering).
- **Vad som låses upp** — review-grindens AC-prövning blir strukturerad på
  varje bunt-PR; vid B mintas en skiva under `TASK-173` och `ADR-105`
  § Updates får ett tillägg.
- **Källa** — `TASK-330` ·
  `tasks/lessons.d/bunt-prer-passar-inte-review-utlatandets-kortid-schema.md`
  · `scripts/lib/review-utlatande.mjs` (schemat).

### 4. Review-loopen eskalerar nästan varje granskning till dig

- **Vad det är** — loop-policyn säger att varje fynd med
  `action: ask-user` skickar PR:en till dig, oavsett hur lindrigt fyndet är.
  Vid det skarpa provet 2026-08-26 bar samtliga fem fynd `severity: info`
  och `action: ask-user` — resultatet blev eskalering, alltså stopp, på en
  PR utan ett enda fel.
- **Varför det väntar på dig** — tröskeln är kodad i
  `.review-loop-policy.json` som `eskaleraVidAction: ["ask-user"]` och är en
  direkt konsekvens av `ADR-105` beslut 5. Att mildra den är ditt beslut,
  aldrig en agents.
- **Gör så här** — svara **JA** (inför en severity-tröskel: `ask-user`
  eskalerar från `warning` och uppåt; `info` + `ask-user` bokförs i
  PR-kroppen utan att stoppa armeringen) eller **NEJ** (behåll som byggt).
- **Min rekommendation** — JA: en grind som eskalerar nästan varje PR blir
  en grind man slutar läsa, och det är exakt det `ADR-105` ville undvika.
- **Vad som låses upp** — review-grinden kan köras i AFK-vågor utan att
  varje PR parkeras på dig; ändringen mintas som en skiva under `TASK-173`
  med en `ADR-105` § Updates-post.
- **Källa** — sessionsdok `tasks/sessions/2026-08-24-session-112.md` Del 6 ·
  `.review-loop-policy.json` · `scripts/lib/review-loop.mjs`. Inget eget kort
  finns — punkten är bokförd på `TASK-330`-nivå / `173.6`.

- **Instanser 2026-08-28 (AFK-vågen)** — loopen gav exit 20 på tre
  konvergerade PR:er enbart p.g.a. `ask-user` på `info`-nivå (`#2042` två
  gånger, `#2052`); orkestreraren avgjorde under ditt mandat och bokförde i
  Del 8. Utan tröskel blir varje granskning ett Marcus-ärende.

### 5. S113 — Airtable-fönstret: när bokar du det?

- **Vad det är** — hela `TASK-213`-familjen (bas-maxning våg 1) ligger och
  väntar: **12 skivor, samtliga To Do**, noll påbörjade (disk-verifierat
  2026-08-28). Förarbetet är gjort — läs-mätningar, formeltexter,
  automationskod och rollback-förbilder är insamlade per skiva.
- **Varför det väntar på dig** — kortets egen governance-regel säger att
  prod-basen aldrig muteras utan uttalat Marcus-GO per skiva. Det är en
  policy, inte en verktygsbegränsning, så ingen skiva kan omklassas till
  agent-körbar.
- **Gör så här** — svara med ett datum eller "nästa session". Vad du behöver
  ta med: din tid, Airtable-inloggning i webbläsaren, och beredskap att ge
  GO per skiva. Ordningen är redan kodad som beroenden: `213.12` först
  (re-mät!), sedan `213.2` som låser upp resten.
- **Min rekommendation** — boka före **2026-09-05**: `213.7` (RIM 3) har den
  dagen som mjuk deadline och är den enda tidskänsliga posten i familjen.
- **Vad som låses upp** — 12 skivor plus QA-kortet `213.11`; basen är en
  förstklassig leverabel enligt `ADR-063` och defektregistret väntar.
- **Källa** — `docs/reference/s113-basmaxning-dukning.md` (körplanen, inkl.
  två premissdivergenser som ska re-mätas FÖRST: `213.6` "16" är i dag 11,
  och `213.12`:s defekt är sannolikt redan läkt) · `TASK-213`.

### 6. Facit-regimerna — 15 av 27 stämplade ytor kan inte se visuell drift

- **Vad det är** — vi har tre olika sorters facit och de täcker olika saker:
  bild-facit (12 av 27 ytor), innehållslås med sha256 (3 av 27) och
  pixel-baslinjer i testsviten (6 vyer). Överlappet mellan stämplade ytor
  och pixel-baslinjer är **två**. De 15 ytor som bär `bilder: []` har ett
  ARIA-facit — det ser roller och struktur, men en marginal som går från
  16 px till 32 px rör det inte alls.
- **Varför det väntar på dig** — att lyfta 15 ytor från ARIA-regim till
  pixel-regim är ett regimbyte, inte städning. Din utlösare var ordagrant:
  *"vi borde ju för tusan ha bildbaslinjer för alla facitstämplade ytor."*
- **Gör så här** — svara per KLASS, inte per yta. Förslag till svarsform:
  "pixel-regim för de ytor Lotta ser dagligen (Hem, anmälningar, person,
  event); ARIA-facit står kvar för prototyp- och strukturytor" — eller ditt
  eget snitt.
- **Min rekommendation** — just den klassindelningen: ett facit som inte kan
  se en 16-pixels förskjutning är inte ett facit för en yta vars hela poäng
  är hur den ser ut.
- **Vad som låses upp** — `TASK-297` AC #2, och därmed wiringen av de
  stämplade referenserna till en vakt (tråd `T172`). `TASK-288`
  (backfill av `referenser`-fältet i 22 manifest) är nästa steg efter det.
- **Källa** — `TASK-297` · tråd `T172-facit-regimernas-tackning.md` ·
  `scripts/check-facit.sh` (slutraden: 12 manifest, 27 ytor, 11 låsta
  referenser, 24 ytor utan innehållslås).

### 7. Nightly-rödraden har tappat sitt signalvärde

- **Vad det är** — Nightly var röd 19 nätter i rad. Länkkontrollen fällde
  15 av 19, och den är per `ADR-082` MEDVETET nattens hem för extern
  länkröta. Rödraden betyder alltså inte längre "något är trasigt".
- **Varför det väntar på dig** — valet rör `ADR-082`:s implementation och
  är en grillnings-kandidat kortet uttryckligen lämnar till dig.
- **Gör så här** — svara **a** (flytta länk-jobbet till ett eget schemalagt
  workflow med egen larmkedja), **b** (`continue-on-error` plus eget
  larmsnitt inne i Nightly) eller **c** (behåll medvetet som det är).
- **Min rekommendation** — a: en egen körning återger Nightlys rödrad dess
  betydelse utan att göra ett rött jobb grönt på papperet, vilket är vad b
  gör.
- **Vad som låses upp** — nattrapporten blir läsbar igen; nattvaktens
  nuvarande specialfilter för länk-only-nätter kan förenklas.
- **Källa** — `TASK-254` ·
  `docs/decisions/ADR-082-*.md` · `.github/workflows/nightly-watchdog.yml`
  (~rad 165, dagens filter).

### 8. Staging-transienterna i post-merge — mutex eller signalvärdes-varning?

- **Vad det är** — post-merge-sviten föll tre gånger 2026-08-12 med 502/503
  från staging, spritt över fem endpoints i tre orelaterade PR:er och två
  tidsfönster. Bevisligen inte en kodregression. En retry-mitigering på
  idempotenta läsningar har landat (`#1982`), men strategivalet är kvar.
- **Varför det väntar på dig** — valet mellan att bygga en mutex mot staging
  och att klassa det som plattformsbrus är ett arkitektur-/prioriteringsval.
  Steg ett kräver dessutom Supabase-dashboardens statushistorik, som bara du
  når.
- **Gör så här** — svara **mutex** eller **signalvärdes-varning**. Vill du
  ha faktaunderlaget först: öppna Supabase-dashboarden för
  staging-projektet, sök statushistoriken kring 2026-08-12 15:11–17:39 UTC
  och säg vad du ser.
- **Min rekommendation** — signalvärdes-varning: fem orelaterade endpoints i
  två fönster samma kväll är plattformsmönster, och retry-mitigeringen täcker
  redan de idempotenta vägarna — en mutex är dyr infrastruktur mot fel orsak.
- **Vad som låses upp** — `TASK-207` kan stängas; post-merge-larmens
  trovärdighet höjs.
- **Källa** — `TASK-207` (kortfilen heter `task-207 - test-title.md`,
  ett känt malformerat filnamn) · Implementation Notes § "INTE GJORT".

### 9. Deploy-varningen om en fil som aldrig funnits

- **Vad det är** — varje prod-deploy skriver
  `WARN: failed to read file: open supabase/functions/preview-receipt/send-receipt.ts`.
  Filen har aldrig funnits där; Supabase CLI:s scanner löser en relativ
  import mot fel katalog. Koden är korrekt (typecheck grön). Problemet är
  brus: en stående varning gör en ÄKTA varning svår att se.
- **Varför det väntar på dig** — mätningen kräver en riktig deploy-utskrift
  för fem funktioner, och prod-refen är strukturellt otillgänglig för
  agenter (låset i `scripts/deny-prod-ref.sh` fäller varje agent-anrop).
- **Gör så här** — kör punkt 18 (prod-deployen) FÖRST och **spara hela
  utskriften**; alla fem exponerade funktioner ligger i allowlisten, så
  mätningen kommer gratis. Svara sedan **a** (acceptera och dokumentera),
  **b** (flytta typerna så specifikatorn försvinner) eller **c** (rapportera
  uppströms till `supabase/cli`).
- **Min rekommendation** — a, med c som gratis påläggning: varningen är
  redan fullständigt förklarad i kod, och b rör kvittokedjan för noll
  användarvärde.
- **Vad som låses upp** — `TASK-296` stängs; deploy-utskriften blir läsbar
  igen.
- **Källa** — `TASK-296` (AC #1–#4) ·
  `supabase/functions/preview-receipt/index.ts` rad 34–42 (mekanismen redan
  beskriven i kod) · `.prod-functions-allowlist.conf` (alla fem funktioner
  verifierade närvarande 2026-08-28).

### 10. UNIVERSAL-markörens tio former — vilken form gäller framåt?

- **Vad det är** — lärdomarnas `[UNIVERSAL]`-markör skrivs på **tio**
  strukturellt olika sätt i den levande korpusen. Skillen som lyfter
  lärdomar till hubben känner bara sex av dem, så 26 poster är osynliga för
  dess egen sökning.
- **Varför det väntar på dig** — konvergensen kostar arbete i historiskt
  material och är en formfråga om husets egen dokumentation. Ingen migrering
  är körd, inget beslut fattat.
- **Gör så här** — svara **framåt** (ny form gäller från och med nu, stängda
  volymer rörs aldrig), **allt** (normalisera hela korpusen) eller **vänta**.
- **Min rekommendation** — framåt, med kandidat 1 (en fristående rad
  `**[UNIVERSAL]**` direkt under rubriken): nästan hela normaliseringskostnaden
  ligger i den historiska korpusen, och en framåtregel ger konvergens utan
  att röra en enda stängd volym.
- **Vad som låses upp** — skillens grep blir sann; hub-lyftet slutar tappa
  poster tyst.
- **Källa** — `docs/research/markorformernas-rematning-2026-08-24.md`
  (210 rader; kostnadstabellen + listan över falska positiva som INTE ska
  normaliseras) · PR `#1938`.

### 11. Fokusringen klipper kapselradier i hela appen

- **Vad det är** — en global CSS-regel sätter `border-radius: 2px` hårt på
  allt som får tangentbordsfokus. Följden: rundade ytor (piller,
  slide-to-confirm-rännan) tappar sin form så fort man tabbar dit.
  Verifierat live på main: `src/styles/base.css` rad 244–248.
- **Varför det väntar på dig** — kortet är ett fynd utan acceptanskriterier
  och bär `ready-for-human`. Det rör redan granskade och godkända ytor, så
  ändringen är en designdom, inte en bugfix någon får ta på eget bevåg.
- **Gör så här** — svara **GO** (fixa så ringen följer elementets egen radie)
  eller **behåll**.
- **Min rekommendation** — GO: en fokusring som ändrar elementets form är en
  tillgänglighetsbrist, och tillgänglighet är 11 utan undantag i vår
  kvalitetsribba.
- **Vad som låses upp** — ett kort med `priority: high` som legat sedan
  2026-07-21; bygg-agenten kan ta det direkt vid GO.
- **Källa** — `TASK-25` · `src/styles/base.css` rad 244–248 · bilagan
  `tasks/sessions/bilagor/s67-fokusring-klipp/`.

### 12. Passkey går inte att aktivera inifrån appen

- **Vad det är** — `/passkey`-ytan nås bara som ett engångserbjudande efter
  lösenordsinloggning. Har kontot en gång markerats som "har sett
  erbjudandet" finns ingen väg tillbaka i appen. Din egen formulering:
  *"vart i hela friden aktiverar jag passkey i appen?"*
- **Varför det väntar på dig** — kortet är fyndet, inte facit; ytans scope
  och form är ett designbeslut.
- **Gör så här** — svara **JA** (bygg en "Inloggning och säkerhet"-yta under
  Mer med aktivera / visa / ta bort passkey) eller **NEJ** (låt
  engångserbjudandet vara enda vägen).
- **Min rekommendation** — JA: i dag stänger ett förbiklickat erbjudande
  passkey permanent för Lotta, utan att hon har någon väg tillbaka.
- **Vad som låses upp** — en skiva under auth-familjen; server-sidan är
  redan klar (`TASK-231` Done, prod-aktiveringen utförd).
- **Källa** — `TASK-230` · `src/routes/passkey.tsx` + `login.tsx`
  (PASSKEY-blocket) · `ADR-093`.

### 13. Lärdomslagrets utnyttjande-mekanik — grillning eller avböj?

- **Vad det är** — `TASK-161.10` (QA för styrande-docs-auditen) har ett enda
  kriterium som blockerar allt annat: du ska ha läst research-rapporten om
  lärdomslager och sagt om utnyttjande-mekaniken ska få ett eget spår.
- **Varför det väntar på dig** — kriteriet är formulerat som "grillning bokas
  eller avböjs explicit". Ett avböjande måste komma från dig.
- **Gör så här** — läs
  `docs/research/lardomslager-branschpraxis-2026-08-07.md` (518 rader) och
  svara **boka** eller **avböj**.
- **Min rekommendation** — avböj nu och boka om när fleet-driften lugnat sig:
  ett explicit avböjande stänger kriteriet utan att låsa något, och vi har
  fyra öppna processpår redan.
- **Vad som låses upp** — `161.10` kan gå vidare till sina tre återstående
  stickprovskriterier, och `TASK-161`-familjen kan stängas.
- **Källa** — `TASK-161.10` AC #1 ·
  `docs/research/lardomslager-branschpraxis-2026-08-07.md`.

### 14. Kvittera verktygs-pinningens gh-avvägning

- **Vad det är** — `TASK-312` pinnade jq, yamllint och 45 GitHub
  Actions-anrop. För `gh` blev utfallet blandat: två vakter wirade, tre
  ställen öppet deklarerade som medvetet opinnade
  (`classify-post-merge.sh` som redan är fail-closed, CI-inbäddade
  `gh pr create` / `gh issue create` på GitHub-hostad runner, och den
  nattliga `ci-metrics.mjs`).
- **Varför det väntar på dig** — agenten bokförde avvägningen öppet och
  markerade den som väntande på din kvittens. Kortet är i övrigt Done.
- **Gör så här** — svara **kvitterat** eller **pinna även de tre**.
- **Min rekommendation** — kvitterat: de tre öppna ställena kör antingen på
  en runner där GitHub själv äger versionen, eller i en väg som redan är
  fail-closed.
- **Vad som låses upp** — inget blockerat arbete; punkten stänger en öppen
  bokföringspost så den inte ligger kvar som obesvarad.
- **Källa** — `TASK-312` (Done, alla AC bockade) · PR `#1942` kroppens
  punkt 4.

### 15. Tre trådar står som `active` men har inte rörts på 67–75 dagar

- **Vad det är** — trådregistret säger att `active` betyder "pågår/öppen".
  Mätt 2026-08-28 mot senaste commit taggad med respektive tråd-ID:
  `T01` 2026-06-14 (**75 dagar**), `T17` 2026-06-21 (**68**), `T19`
  2026-06-22 (**67**). Varje agent som orienterar sig i registret läser dem
  som pågående.
- **Varför det väntar på dig** — integritetskontrollen som mätte detta
  vägrade medvetet gissa: att skriva om någon annans tråd till `paused` är
  ett tillståndsbeslut, inte en städning.
- **Gör så här** — svara ett av tre för alla eller per tråd: **stäng** ·
  **paused** · **uppfriska** (skriv en ny rad om vad nästa steg är).
- **Min rekommendation** — `paused` på alla tre: det är sant, det river
  ingenting, och `T67` fick redan exakt den behandlingen i samma mätning.
- **Vad som låses upp** — registret slutar ljuga för varje agent som läser
  det; `check-thread-index.sh` fortsätter grönt oavsett val.
- **Källa** — `tasks/threads/README.md` § OAVGJORT (blocket efter T56-noten)
  · `T01-system-legibility.md` · `T172`-radens grannar i tabellen rad 44/60/62.

### 16. Harness-mätsessionen — boka eller skjut?

- **Vad det är** — `TASK-148.5` är en dedikerad mätsession där du är
  observatör: vi mäter var kedjan bryts när en subagent ska väckas ur
  vila (notifikations-leverans eller agent-resume). Den måste köras som
  EGEN session — pågående arbete maskerar felet.
- **Varför det väntar på dig** — kriteriet kräver dig som observatör, och
  sessionen kan inte samsas med annat arbete.
- **Gör så här** — svara **boka** (med ungefärlig tid) eller **skjut**.
- **Min rekommendation** — skjut tills fleeten ändå står still: mätobjektet
  är idle-väckning, så en session mitt i en aktiv våg mäter fel sak.
- **Vad som låses upp** — `TASK-148.6` (uppströms-issue) och `148.7` (QA)
  är båda blockerade av den här; tråd `T112`:s öppna rotorsaksfråga stängs
  med mätdata i stället för hypotes.
- **Källa** — `TASK-148.5` (beroende `TASK-148.4`, Done) ·
  `ADR-096` (subagentens väntekontrakt).

### 17. Vilket terminalfönster visade godkännande-prompten kring 04:40?

- **Vad det är** — du fick godkänna ett anrop "från en agent" 2026-08-28
  ~04:40. Ingen av de två sessioner som körde kan tala om vilken den var:
  både S108 och S112 kör i `bypassPermissions`-läge och ser därför inga
  prompter alls.
- **Varför det väntar på dig** — bara du satt framför fönstren, och
  utredningen har redan uteslutit det mesta. Förstapartskällan räknar upp
  exakt fem klasser som promptar under bypass. Våra deny-regler och
  deny-hookar promptar ALDRIG, repot har noll ask-regler, och frågeverktyget
  tas ALLTID bort från subagenter — en fråga från en agent är alltså
  strukturellt omöjlig. Kvar står tre vägar: ett MCP-verktyg från en
  connector (GitHub, Airtable, Resend, Vercel, Google Drive), ett
  `rm`-kommando mot en skyddad sökväg, eller ett godkännande som en ANNAN
  session begärde.
- **Gör så här** — svara med vad du minns: vilket fönster stod prompten i,
  och vad frågade den om? Minns du inte, sök i fönstrens scrollback och
  klistra in raden.
- **Min rekommendation** — svara även "vet inte": spärren byggs ändå, och
  ditt svar avgör bara om vi kan bekräfta VILKEN av de tre vägarna som
  fyrade.
- **Vad som låses upp** — `TASK-336` AC #4, den enda av kortets fyra punkter
  som kräver dig — resten är agent-körbart (`disallowedTools` i de tre
  agentdefinitionerna plus ett tvåsidigt skarpbevis). Fram tills dess gäller
  bara den interimsregel orkestreraren broadcastade till nio körande agenter
  (gh-CLI före MCP, `rm` bara i egen worktree), och den överlever inte nästa
  agent-start.
- **Källa** — `TASK-336` (PR `#2046`, öppen, `ready-for-agent`) ·
  `code.claude.com/docs/en/permission-modes.md` § Actions no mode
  auto-approves · `code.claude.com/docs/en/sub-agents.md` § Available tools ·
  **oklart: prompt-texten och det utlösande kommandot.** Varken
  `.claude/hook-fallningar.jsonl` eller `.claude/agent-spawn-log.jsonl`
  loggar prompter — den ena loggar nekanden, den andra agent-starter — och
  båda löper 02:39Z–03:50Z, alltså 04:39–05:50 lokal tid.

---

### 41. Post-merge-driftvakten — ska staging-sviten köras på tid, inte bara vid kodlandning?

- **Vad det är** — post-merge-lagret ärver den landande PR:ens klassning
  (ADR-077): på en docs-only-landning hoppas staging-sviten. Följden i dag:
  staging-drift upptäcktes först vid nästa kodklass-landning och larmet pekade
  ut fel PR (`#2043`, `#2047`). `TASK-334` (PR `#2059`) rättar attributionen —
  larmet pekar nu på senaste körning som faktiskt körde sviten. Kvar är
  frågan om en TIDSBASERAD vakt (alternativ B: kör sviten om det gått mer än
  N timmar sedan senaste staging-körning på `main`).
- **Varför det väntar på dig** — nattnätet kör redan staging-sviten varje
  natt (`nightly.yml` → `ci-suite.yml` med `run_staging: true`), så B är en
  kadensfråga: kostar en tredje daglig tagning av `staging-tests`-mutexen mot
  ett jobb med ~1,8× marginal som redan slagit i sitt 12-minuterstak.
- **Gör så här** — svara `"41: A"` (nej, nattnätet räcker — status quo) eller
  `"41: B"` (bygg driftvakten, N = 12 h) eller `"41: B, N = <timmar>"`.
- **Min rekommendation** — **A**: nattnätet täcker driften inom 24 h och
  attributionen är rättad; en tredje mutex-tagning köper timmar, inte
  signalvärde.
- **Vad som låses upp** — inget blockeras; B blir ett kort om du vill ha den.
- **Källa** — `TASK-334` § Implementation Notes (options A–D) · `ADR-077`
  § Updates 2026-08-28 · `TASK-73` (revert-blockeringen 25 min) · PR `#2059`.

## B. Kommandon i din terminal

Alla tre körs av dig, **i ett eget terminalfönster — inte via `!`-prefixet i
Claude Code.** `!`-kanalen har ett tak på två minuter och dödar skriptet med
SIGKILL när det passeras; då körs ingen EXIT-trap, och det var exakt så
deploy-katalogen lämnades länkad mot prod i natt (2026-08-28, återlänkad
manuellt av S108). Prod-refen skrivs som `<prod-ref>`; värdet står i
`.prod-ref-policy.conf` som `PROD_REF_PROD`. Efter varje körning:
`cat supabase/.temp/project-ref` ska visa **staging**, aldrig prod. Står
prod-refen där, återlänka innan du gör något annat i katalogen — formen är
den skriptet självt skriver ut när återlänkningen fallerar (vid SIGKILL
hinner det aldrig göra det): `echo "" | npx supabase@<pinnad version> link
--project-ref <staging-ref>`, där versionen står i
`scripts/lib/supabase-cli.sh` och refen i `.prod-ref-policy.conf` som
`PROD_REF_STAGING`. Kontrollerat 2026-08-28 05:53 utan att värdet skrevs ut:
filen pekar på **staging** — S108:s återlänkning höll.

- **Läge 2026-08-28 ~12:00** — AC #1/#2/#4 byggda: PR `#2064` (under
  granskning) lägger `disallowedTools` mot nio connector-familjer i alla tre
  agentdefinitionerna. Skarpbeviset (AC #3) betalas av orkestreraren efter
  landning. Bara fönsterfrågan ovan är kvar hos dig.

### 18. Prod-deploy: `update-event` kör fortfarande 500-buggen

- **Vad det är** — appen svarar i dag **500** i prod när någon försöker
  uppdatera ett event som inte finns (raderat eller felstavat ID). Fixen som
  gör svaret till ett korrekt **404** landade i main 2026-08-26 (PR `#1988`)
  och är deployad till staging — men inte till prod.
- **Varför det väntar på dig** — prod-refen får aldrig förekomma i en agents
  kommandosträng; `scripts/deny-prod-ref.sh` fäller varje sådant anrop.
  Det är avsiktligt och prövat skarpt.
- **Gör så här** — två kommandon, i den här ordningen:

  ```bash
  bash scripts/fas4-prod-deploy.sh --kontrollera <prod-ref>
  bash scripts/fas4-prod-deploy.sh --deploya     <prod-ref>
  ```

  Kör dem i ett eget terminalfönster (se varningen ovan — `!`-kanalens
  tvåminuterstak avbröt nattens försök mitt i). `--kontrollera` läser
  prod-läget och ÄNDRAR INGET — läs utfallet först.
  `--deploya` gör hela sekvensen: länka → deploya allowlisten (45 rader) →
  verifiera → länka tillbaka till staging.
  **Spara hela utskriften** — den innehåller mätningen punkt 9 behöver.
  Godkänt ser ut så här: `UPDATED_AT` för `update-event` är nyare än
  deployen (läs `UPDATED_AT`, inte `VERSION` — `VERSION` bumpar +1 på ALLA
  funktioner oavsett vilka som rördes), och ett anrop mot ett okänt
  rec-ID ger 404.
- **Min rekommendation** — kör den: buggen träffar en yta Lotta använder,
  och skriptet kodar bort de tre fel som fällt handkörningar (hängande
  lösenordsprompt, fel projekt länkat, glömd återlänkning).
- **Vad som låses upp** — `TASK-325` stängs · mätningen till `TASK-296`
  (punkt 9) kommer gratis · `TASK-269` AC #3 kan gås i appen (punkt 31).
- **Källa** — `TASK-325` · `CLAUDE.md` § Prod-EF-deploy ·
  `scripts/fas4-prod-deploy.sh` (filhuvudet förklarar varje skyddsräcke).

### 19. Allowlist-audit mot prod — det sista kriteriet på `TASK-37`

- **Vad det är** — deploy-skriptet hindrar nya funktioner från att smita in
  i prod, men såg inte historiska rester. `test-auth` låg i prod i 81 dagar
  trots förbud. Audit-läget stänger den luckan: hämtar live-listan, diffar
  mot allowlisten, avslutar med felkod om något ligger där det inte ska.
- **Varför det väntar på dig** — samma prod-refs-lås som punkt 18. Agenten
  har byggt och tvåsidigt testat funktionen; bara det skarpa anropet
  återstår.
- **Gör så här**:

  ```bash
  bash scripts/deploy-prod-functions.sh --audit --project-ref <prod-ref>
  ```

  Godkänt = "0 icke-allowlistade" och exit 0. Kommandot deployar inget.
- **Min rekommendation** — kör den direkt efter punkt 18, i samma sittning:
  då auditerar du det läge du precis skapade.
- **Vad som låses upp** — `TASK-37` AC #1, sista obockade kriteriet; kortet
  kan flippas till Done.
- **Källa** — `TASK-37` (AC #2 redan bockat, 10/10 testfall) ·
  `scripts/deploy-prod-functions.sh` rad 19 + 28.

### 20. Omstämpla två facit som beskriver en form appen inte längre bär

- **Vad det är** — aktivitetshistoriken och dokumentytan fick sin nya sidram
  2026-08-23. Deras facit-manifest är stämplade 2026-08-15 respektive
  2026-08-16 — alltså FÖRE ändringen — och bilderna visar den gamla
  chevron-positionen och den gamla vänstermarginalen. Amenderings-sidofilerna
  är skrivna; bara omstämplingen återstår.
- **Varför det väntar på dig** — en hook fryser ett stämplat manifest i sin
  helhet. Ingen agent kan skriva i det; bara du, via `!`-kanalen.
- **Gör så här** — titta först på de två ytorna i appen (Mer →
  Aktivitetshistorik och Mer → Dokument) så du vet vad du stämplar. Sedan:

  ```bash
  npm run facit:godkann -- --pass s106-aktivitetslogg --citat "..." --ersatt
  npm run facit:godkann -- --pass s102-dokument-konvergens --citat "..." --ersatt
  ```

  Byt `...` mot dina egna ord. Kör kommandot utan argument om du vill se
  hjälpen och listan över kända pass-namn.
- **Min rekommendation** — kör båda: ett facit som beskriver en form ytan
  inte längre bär är värre än inget facit, eftersom nästa granskare tror att
  det stämmer.
- **Vad som låses upp** — `TASK-299.11` AC #5/#6 och därmed hela
  `TASK-299`-familjens sidram-promovering.
- **Källa** — `TASK-299.11` Implementation Notes ·
  `tasks/sessions/bilagor/s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md`
  · samma fil under `s102-dokument-konvergens/` · `ADR-104` ·
  `scripts/facit-godkann.mjs` (filhuvudet = din dokumentation).

---

## C. Granskning i webbläsaren

### 21. Två baseline-PR:er med bilder som definierar vad som är "rätt"

- **Vad det är** — `#1883` (14 bilder) och `#1926` (24 bilder) är CI-födda
  referensbilder. Varje bild i diffen definierar vad som hädanefter räknas
  som korrekt utseende för den vyn.
- **Varför det väntar på dig** — CI på båda står i "Approve workflows to
  run"-läge, avsiktligt: samma blick som godkänner bilderna släpper grinden.
  Ingen agent kan klicka det.
- **Gör så här** — öppna
  [PR #1883](https://github.com/high-five-group/miranon-media-admin/pull/1883)
  och sedan
  [PR #1926](https://github.com/high-five-group/miranon-media-admin/pull/1926),
  i den ordningen. **Ordningen är inte kosmetisk:** fyra bildfiler finns i
  BÅDA (aktivitetshistorik desktop/mobil, dokumentytan desktop/mobil), så
  mergas `#1926` först skrivs de fyra tillbaka till en äldre generation.
  Godkänt = bilden visar vyn som den SKA se ut.
- **Min rekommendation** — beställ nya bilder i stället: grenarna ligger
  **334** respektive **270** commits efter main (mätt 2026-08-28), så
  bilderna är fotografier av en app som inte finns längre. Ett kommando ger
  en färsk körning mot dagens main:

  ```bash
  gh workflow run visual-baselines.yml --ref main
  ```

  Lämna filtret tomt — det är normalvägen och täcker hela sviten. Stäng
  sedan `#1883` och `#1926` med hänvisning hit. Vill du hellre göra som
  planerat: granska och merga `#1883` först, `#1926` sedan.
- **Vad som låses upp** — en sann uppsättning referensbilder; tråd `T87`
  (aktivering av den visuella grinden som PR-blockerare) blir meningsfull
  att ta upp. Ingen av PR:erna kan göra CI röd i dag — PR-grinden är
  medvetet inaktiv.
- **Källa** — PR-kropparna (`#1883`, `#1926`) · `CONTRIBUTING.md`
  § Visuell regression rad 1180–1187 · `.github/workflows/visual-baselines.yml`
  · tråd `T87`.

### 22. Konstitutionsdiffen efter claude.ai-avvecklingen

- **Vad det är** — du sa 2026-08-24: *"Kör inte med Claude.ai längre."* PR
  `#1957` skriver om `CLAUDE.md` § Synk-horisont och lägger en
  `§ Updates`-post i `ADR-048`. 56 tillagda och 14 borttagna rader i tre
  filer. Den ligger som utkast eftersom kortets första kriterium kräver att
  du granskar diffen innan något landar.
- **Varför det väntar på dig** — det är husets konstitution. Ingen agent
  landar en ändring i den utan att du sett den.
- **Gör så här** — öppna
  [PR #1957](https://github.com/high-five-group/miranon-media-admin/pull/1957),
  läs de tre filerna, och ta dessutom ställning till två saker agenten
  flaggade UTANFÖR diffen: (a) `ADR-043`-familjen är byggd kring en
  "Chat-halva (claude.ai)" som inte längre finns — en egen arkitekturfråga,
  redan mintad som `TASK-320`; (b) `CONTRIBUTING.md` rad 25 beskriver dig
  som arbetande i "terminal (Code) + claude.ai (läsyta)".
- **Min rekommendation** — godkänn diffen som den står och ta `ADR-043`-frågan
  separat: PR:en gör exakt vad kortet ber om, och att dra in
  lifecycle-arkitekturen i samma landning gör den ogranskbar.
- **Vad som låses upp** — `TASK-318` stängs; `TASK-320` (Chat-halvans
  arkitektur) kan grillas som egen fråga.
- **Källa** — `TASK-318` · PR `#1957` · `docs/decisions/ADR-048-synk-horisont-arkiv-atkomst.md`.

### 23. Tre Dependabot-PR:er, alla gröna och redo

- **Vad det är** — tre grupperade beroendeuppdateringar. Samtliga står
  `CLEAN` med grön CI (mätt 2026-08-28):
  - `#1878` (utvecklingsberoenden, 6 paket): axe-core 4.12.1→4.13.0,
    Biome 2.5.7→2.5.9, **backlog.md 1.49.1→1.50.1**, js-yaml 5.2.3→5.3.0,
    Vite 8.2.0→8.2.2. Enbart minor/patch.
  - `#1826` (produktionsberoenden, 5 paket): Sentry 10.69→10.70,
    `supabase-js` 2.111→2.112.3, lucide-react 1.28→1.31, nuqs 2.9.5→2.9.6,
    web-vitals 6.0.1→6.1.1. Enbart minor/patch.
  - `#1487` (TanStack-gruppen, 3 paket): react-router 1.170.21→1.170.31 plus
    plugin och cli. Enbart patch.
- **Varför det väntar på dig** — bot-PR:er armeras aldrig av en agent utan
  din order. `#1878` bär dessutom en kollision: backlog.md-bumpen ÄR
  `TASK-327`, som har fyra egna mätkriterier (wrapperns testsvit,
  byte-identiskt closure-utfall, före/efter-mätning) som skulle hoppas över
  om PR:en bara mergades rakt av.
- **Gör så här** — svara per PR: **merga** / **vänta** / **stäng**. En
  granskning i färsk kontext kan köras på begäran innan du svarar — säg
  bara till.
- **Min rekommendation** — merga `#1826` och `#1487` (rena patch/minor med
  grön svit), men **vänta** med `#1878` tills `TASK-327` körts som eget kort:
  1.50.1 fixar tyst dataförlust vid samtidiga kortändringar och förtjänar de
  före/efter-mätningar kortet kräver.
- **Vad som låses upp** — beroendeskulden slutar växa; `#1487` har legat
  sedan 2026-08-17.
- **Källa** — PR-kropparnas paketlistor · `TASK-327` (AC #1–#4) ·
  `docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md` § Rekommendation
  steg 1.2.

---

## D. Vandringar i appen (QA-kort)

Grupperade efter yta så flera kort kan stängas i samma vandring. Prod-appen
ligger på `https://admin.miranon.dev`. Vill du gå mot staging i stället:
`npm run preview:staging` och öppna `http://localhost:4173` i en färsk
webbläsarkontext.

- **Läge 2026-08-28 ~08:30** — `#1878` är nu **konfliktad** (`DIRTY`):
  `TASK-327` landade samma backlog.md-bump via `#2041` (`ef2e0522`).
  Dependabot rebasar själv eller stänger; ny rekommendation: **stäng `#1878`**
  med kommentaren att bumpen landade i `#2041`, och låt nästa Dependabot-
  körning ta de övriga fem dev-paketen i en färsk grupp-PR. `#1826`/`#1487`
  oförändrade.

### 24. Åtgärdssidan — hela Lotta-flödet (9 steg, ~45 min)

- **Vad det är** — den sista stora vandringen före go-live: markera
  deltagare, skicka bekräftelsemail, betalningspåminnelse till bara de
  obetalda, fritt utskick med redigerad text, utskick med bilaga (kolla att
  bilagan är FRAMME i en riktig mailklient, både iPad och dator),
  avprickning med anmälningsavgift och slutbetalning och ångra, kvitto med
  löpande nummer, skärmläsarpass, och att ingen åtgärd öppnar en mailklient.
- **Varför det väntar på dig** — det är ett go/no-go-kriterium i
  go-live-planen (steg 3) och kan bara bedömas av en människa i verklig
  miljö.
- **Gör så här** — öppna ett event i appen, markera två deltagare, gå till
  Åtgärder och följ de nio stegen i kortets beskrivning. Godkänt = varje
  steg gör det du förväntar dig; varje avvikelse blir ett nytt fynd-kort
  (säg bara vad du såg, så mintar orkestreraren det).
- **Min rekommendation** — ta den här först av vandringarna: den och punkt 25
  är de två sista obockade kriterierna innan Lotta kan bjudas in.
- **Vad som låses upp** — go-live-planens steg 3; `TASK-147`-familjen kan
  stängas.
- **Källa** — `TASK-147.9` (beroende `147.10` Done) ·
  `tasks/go-live-plan.md` § Go/no-go-kriterier.

### 25. Inbjudningsvandringen skarpt (9 steg, ~30 min)

- **Vad det är** — du bjuder in dig själv på en testadress och går hela
  vägen: mailet på iPad (brandad avsändare, svensk text, rätt domän),
  headers (SPF/DKIM/DMARC alignerat), acceptera och sätt lösenord, logga in,
  aktivera passkey, logga ut och in med passkey, glömt-lösenord hela vägen,
  en utgången länk, och att en okänd adress ger samma svar som en känd.
- **Varför det väntar på dig** — go/no-go-kriterium (go-live-planens steg 5)
  och det andra av två som återstår. Ingen skarp inbjudan får gå till Roger
  eller Lotta före denna.
- **Gör så här** — utlös inbjudan till din egen adress och följ de nio
  stegen. **Passkey-steget är inte längre blockerat** — `TASK-231` är Done
  med prod-aktiveringen utförd, trots att go-live-planens rad från
  2026-08-17 fortfarande säger att steg 6 är spärrat.
- **Min rekommendation** — kör den direkt efter punkt 24, samma kväll: båda
  är go/no-go och den ena utan den andra flyttar ingenting.
- **Vad som låses upp** — go-live-planens steg 5 och därmed steg 8 (bjud in
  Lotta). Samtliga nio byggskivor under `TASK-127` är redan Done.
- **Källa** — `TASK-127.10` · `TASK-231` (Done, AC #3 bockat) ·
  `tasks/go-live-plan.md` steg 5.

### 26. Hem / Morgonkollen — en vandring som stänger fyra kort

- **Vad det är** — fyra kort sitter på samma yta:
  - `TASK-243.4` — jämför skarpa Hem sida vid sida mot facit-bilderna
    (verkligt läge och tomt läge, desktop och mobil). Stämpeln är redan satt;
    kvar är att verifiera blockordning, tomma läget, bevakningsradens villkor
    och de disablade bulk-knapparnas skärmläsarmotivering.
  - `TASK-247` — två avvikelser du själv hittade: tid-kolumnen ("för N tim
    sedan") saknas på vissa Nya anmälningar-rader, och bevakningsradernas
    text ska delas i kolumner som alignar mellan rader.
  - `TASK-284.4` — åtgärdskön på Hem: raden ska vara HELT borta vid noll
    träffar och klickbar med räknare vid träff.
  - `TASK-241.5` — WOW-domen på övergången Hem → sändyta.
- **Varför det väntar på dig** — `284.4` och `241.5` är de **två enda röda**
  posterna i closure-grinden (2 av 663, mätt 2026-08-26). Båda kräver din
  visuella dom, och facit-amenderingen får ske FÖRST efter den.
- **Gör så här** — öppna Hem, jämför mot
  `tasks/sessions/bilagor/s102-hem-konvergens/` (bilderna
  `facit-hem-v1-verklig-desktop.png`, `-mobil.png`, `facit-hem-v1-tom-*.png`),
  gå igenom de fyra punkterna ovan, och svep sedan Hem → sändyta och
  tillbaka. Godkänt för `241.5` = svepet känns som en fortsättning av
  Morgonkollen, aldrig som ett sidbyte.
- **Min rekommendation** — ta den här som andra vandring: den stänger
  closure-grindens sista två röda och släpper `243.4`:s B3-spärr som
  blockerar en rivningsskiva.
- **Vad som låses upp** — closure-grinden går till noll röda ·
  `TASK-284.4` DoD #6 (facit-amenderingen) · `TASK-243.4` AC #2 ·
  `TASK-247` AC #1/#3.
- **Källa** — `TASK-243.4` · `TASK-247` · `TASK-284.4` (status Done, DoD #6
  öppen) · `TASK-241.5` (alla AC bockade, DoD #5 facit-granskning öppen mot
  `tasks/sessions/bilagor/s102-svep-konvergens/facit.json`, 18 bilder).

### 27. UI-fixpaketets vandring (6 steg, ~15 min)

- **Vad det är** — sex kontroller: Förberedelseskärmens bar är 6 px sage
  (jämför mot nästa event-kortets bar på Hem) · genvägarna får en
  bakgrundsplatta vid hovring · etiketten "Gå till åtgärder" leder till
  åtgärdssidan · ingen mall-not längst ned på åtgärdssidan ·
  förhandsvisnings-ikonen på Dokument öppnar läsbart dokument i ny flik för
  alla tre klasser (uppladdad bilaga, mall, kvitto) och
  nedladdnings-ikonen sparar filen.
- **Varför det väntar på dig** — steg 6 är tre facit-omstämplingar som bara
  du kan göra (samma `!`-kanal som punkt 20).
- **Gör så här** — gå de fem första stegen i appen, kör sedan
  `npm run facit:godkann -- --pass <namn> --citat "..." --ersatt` för de tre
  amenderade faciten (hem, dokument, åtgärdssidan). Kör kommandot utan
  argument om du vill se vilka pass-namn som finns.
- **Min rekommendation** — slå ihop med punkt 26: fyra av sex steg ligger på
  Hem och åtgärdssidan, som du ändå är inne på.
- **Vad som låses upp** — `TASK-273`-familjen stängs (alla fyra byggskivor
  Done).
- **Källa** — `TASK-273.5` (beroenden `273.1`–`273.4`, samtliga Done).

### 28. Ladda upp Roger och Lottas riktiga dokumentbestånd (7 steg)

- **Vad det är** — uppladdningen ÄR testplanen. Ett kurstyps-dokument ska
  synas med badge på alla event av den kurstypen; ett alla-event-dokument
  överallt; ett event-specifikt bara där. Byt en gemensam bilaga och se att
  nya versionen slår igenom direkt. Försök radera en gemensam bilaga ur ett
  events kontext — det ska inte gå, och badgen ska förklara varför. Bifoga
  en gemensam bilaga i ett utskick från åtgärdssidan. Omstämpla
  dokument-facitet till sist.
- **Varför det väntar på dig** — det är riktiga dokument och riktig data;
  `ADR-118` beslut 5 säger uttryckligen att uppladdningen är testplanen.
- **Gör så här** — följ de sju stegen i kortets beskrivning, i ordning.
  Godkänt = varje dokument dyker upp exakt där räckvidden säger.
- **Min rekommendation** — kör den efter punkt 27 (dokumentytan är då
  redan kontrollerad) och lägg undan en timme: du hanterar skarpa filer.
- **Vad som låses upp** — `TASK-275`-familjen · dokumentbeståndet finns i
  appen för Lotta.
- **Källa** — `TASK-275.4` (beroenden `275.1`–`275.3`, samtliga Done) ·
  `ADR-118` beslut 5.

### 29. Uppstartsupplevelsen och laddtrappan (två korta stickprov)

- **Vad det är** — två kort på samma tema:
  - `TASK-218.5`: kall start (logga ut, rensa site-data, logga in) — skärmen
    ska visa logotyp, bar och exakt texten "Förbereder ditt
    administrationsverktyg", och när den släpper ska Hem vara FÄRDIGT utan
    skeletons. Sedan flikbyten utan laddindikatorer, varm start utan skärm,
    offline-läge direkt in på sparad data, och skärmen får aldrig hålla
    längre än ~10 sekunder.
  - `TASK-219.4`: en mutation (spara en anteckning) ska visa arbetar-läge
    och inte gå att dubbelklicka; listorna ska visa skeleton i stället för
    "Laddar…"-text utan att layouten hoppar; samma ytor med
    `prefers-reduced-motion` och `prefers-contrast: more` påslaget.
- **Varför det väntar på dig** — båda är stickprov på upplevelse, inte på
  kod.
- **Gör så här** — logga ut och in en gång, klicka runt i sju flikar, slå
  på reducerad rörelse och förstärkt kontrast i systeminställningarna och gå
  samma runda igen. **Läs `218.5`:s notering först:** du observerade
  2026-08-17 att logotypen och baren INTE var centrerade vid inloggning —
  kontrollera om det står kvar.
- **Min rekommendation** — gör dem tillsammans, de tar ~10 minuter ihop och
  delar hela uppstartsvägen.
- **Vad som låses upp** — `TASK-218`- och `TASK-219`-familjerna
  (samtliga byggskivor Done).
- **Källa** — `TASK-218.5` (inkl. Implementation Notes om centreringen) ·
  `TASK-219.4` · `DESIGN-SYSTEM-SPEC` §15 · `ADR-078`.

### 30. Tre färdiga kort som väntar på ett godkännande-klick

- **Vad det är** — tre ändringar är landade och gröna, men står kvar som
  pågående tills du tittat:
  - `TASK-22`: Tailwind skannade tidigare docs-mappen och släppte in
    skräpklasser i produktions-CSS:en. Fixat: 64 klasser bort, CSS:en −6,1 %,
    **noll klasser tillkomna**, varje borttagen klass verifierat frånvarande
    i `src/`. Rör global CSS och har ingen visuell CI-grind — därav klicket.
  - `TASK-222`: inputfältens bakgrund pekade på sidbakgrunden i stället för
    kontrollytan. Visuellt identisk i dag (båda är vitt, mätt i webbläsaren),
    strukturellt rätt framåt.
  - `TASK-223`: glömt-lösenord saknade den gyllene auth-fonden som de fyra
    syskonytorna har. Nu lagd.
- **Varför det väntar på dig** — `ADR-071` beslut 3: en landad UI-ändring
  utan visuell grind sätts i granskningsfärdigt läge och flippas till klar
  först efter din blick.
- **Gör så här** — klicka igenom 3–4 vyer i appen (Hem, en eventsida,
  Personer, ett formulär med inputfält) och besök `/glomt-losenord`.
  Godkänt = inget ser fel ut och glömt-lösenord har samma varma fond som
  inloggningssidan. Svara `"29: godkänt"`.
- **Min rekommendation** — godkänn: `#1988`:s röda post-merge-körning var
  **inte** dessa korts fel — jobbet föll på CLS-mätningen i
  `app-update-banner.test.ts` (`expect(cls).toBe(0)`), alltså exakt den flake
  vars rotorsak sedan hittades och fixades i `TASK-307` (PR `#2009`).
- **Vad som låses upp** — tre kort flippas till Done; `TASK-223`:s
  granskning avtäckte dessutom att auth-fonden saknar
  `prefers-contrast`/print-fallback på alla fem auth-ytor — det bor på
  `TASK-324`.
- **Källa** — `TASK-22`, `TASK-222`, `TASK-223` (alla `In Progress`,
  Landning PR `#1987`/`#1988`) · körning 32929746452 jobb 98059621388
  (den röda posten, verifierad 2026-08-28) · `TASK-307` · `ADR-071` beslut 3.

- **Läge 2026-08-28 ~12:00** — `TASK-223` sattes Done av orkestreraren
  (PR `#2061`): fixen landade i `#1988`, det röda post-merge-jobbet var
  CLS-flaken (`TASK-307`), inte diffen. Din blick på glömt-lösenord-sidan är
  nu frivillig, inte blockerande. `22` och `222` står kvar.

### 31. Check-in-dörrens reservväg i prod (5 min)

- **Vad det är** — möter Lotta en anmälan utan förskapad deltagarrad ska
  raden skapas automatiskt när hon prickar av. Funktionen är deployad till
  prod sedan 2026-08-17 och svarar korrekt på anrop, men själva beteendet
  har aldrig prövats skarpt.
- **Varför det väntar på dig** — prövningen kräver riktig data i prod och en
  människa vid dörrlistan.
- **Gör så här** — öppna ett event i prod, gå till dörrlistan, hitta (eller
  skapa) en anmälan utan deltagarrad och pricka av den. Godkänt = raden
  skapas, en gång, utan felmeddelande — och en andra avprickning skapar
  ingen dubblett.
- **Min rekommendation** — kör den i samma sittning som punkt 18
  (prod-deployen): du är ändå i prod-läge då.
- **Vad som låses upp** — `TASK-269` AC #3, sista obockade kriteriet.
- **Källa** — `TASK-269` Implementation Notes (deploy-utfallet 39 funktioner
  ACTIVE, deny-triplen 401/401/405 — men beteendet oprövat).

### 32. Helenas historikrad (10 sekunder + ett GO)

- **Vad det är** — Helena Skoglunds anmälan till RIM 3 saknar länk till sin
  personpost i prod. Följden i appen: hennes deltagarkort visar ingen
  historikrad, trots att hon har tre tidigare event. Svepet och rotorsaken
  är redan avklarade; kvar är själva datafixen.
- **Varför det väntar på dig** — det är en skrivning i prod-basen och kräver
  ditt GO enligt `ADR-063`.
- **Gör så här** — svara **GO** i chatten. Agenten länkar anmälan till rätt
  personpost. Öppna sedan Helenas personkort i appen — godkänt = historikraden
  syns. Tar tio sekunder.
- **Min rekommendation** — ge GO: kortet har `priority: high`, felet syns för
  Lotta, och två av tre kriterier är redan bockade.
- **Vad som låses upp** — `TASK-229` stängs.
- **Källa** — `TASK-229` AC #1 (anmälan `rec1ft7CDqLJwZw9V`, personpost
  `recoFAXvbggTQ8WrL`) · `ADR-063`.

### 33. Två sista steg på anmälningssidans vandring (30 sek per yta)

- **Vad det är** — `TASK-299.10` är nästan klar. Du gjorde steg 1–8 och sa
  *"Ser bra ut."* två gånger. Steg 9 (mobil) och steg 10 (förstärkt
  kontrast) gjorde du aldrig — och agenten vägrade bocka dem åt dig.
- **Varför det väntar på dig** — kriteriet kräver att stegen faktiskt är
  gjorda, inte att någon bedömer att de sannolikt är gröna.
- **Gör så här** — öppna Mer-familjens fem sidor plus anmälningssidan på
  mobil, och en gång till med förstärkt kontrast påslagen i
  systeminställningarna. Godkänt = inget bryts.
- **Min rekommendation** — gör det i samma pass som punkt 29, där du ändå
  slår på kontrastläget.
- **Vad som låses upp** — `TASK-299.10` AC #1 och därmed `TASK-299`-familjen.
  Alternativet, om du hellre vill: mynta ett eget kort för
  `prefers-contrast`-täckning av Mer-familjen med
  `dorrlista-promoverings-grind.spec.ts` rad 736–812 som färdig förebild.
- **Källa** — `TASK-299.10` Implementation Notes (stängningspasset
  2026-08-23).

---

## E. Parkerat med avsikt — inget att göra nu

Punkterna här kräver ingenting av dig i dag. De står med så att du ser att
de inte glömts bort.

### 34. Historik-normaliseringen — LÖST, inget beslut behövs

- **Vad det är** — elva kort med historisk stängningsskuld låg röda i
  closure-grinden och du skulle välja mellan retroaktiv verifiering och
  normalisering med den nya formen.
- **Varför den är parkerad** — den är gjord. PR `#1986` (merge `6067b5c7`)
  normaliserade alla elva till `ADR-127` form 2 — och fann på vägen att
  `TASK-283.1` aldrig ens byggdes, varför samtliga 15 rader avstods i
  stället för att bockas falskt. Closure-grinden gick från 15 röda av 650
  till 2 av 663.
- **Källa** — sessionsdok `tasks/sessions/2026-08-24-session-112.md` Del 5
  (raden "Normalisering `#1986` `6067b5c7`").

### 35. `TASK-288` — backfill av referens-fältet i 22 manifest

- **Vad det är** — 24 av 27 stämplade facit-ytor saknar innehållslås. Bara
  du kan skriva i ett stämplat manifest (hooken nekar varje agent-skrivning).
- **Varför den är parkerad** — det agent-görbara förarbetet är inte gjort:
  kartan yta → fil + sha256 för samtliga 22 ytor. Utan den blir din
  `!`-körning handpåläggning på 22 ställen.
- **Vad som händer härnäst** — punkt 6 (regimbeslutet) avgör vilka ytor som
  ens ska ha fältet; därefter producerar en agent kartan, och först då blir
  detta en fyra-minuters `!`-körning för dig.
- **Källa** — `TASK-288` AC #1/#2 · `scripts/deny-facit-godkand-skrivning.sh`
  · `ADR-104` beslut 2.

### 36. `TASK-309.11` — bilagespårets prod-QA

- **Vad det är** — en manuell testplan i nio steg för bilagespåret i prod
  (bekräftelsebilaga, deltagarinformation, platsstandarder, kvitto).
- **Varför den är parkerad** — den är mekaniskt blockerad: skivorna `309.8`
  (promoveringen), `309.9` (prod) och `309.10` (facit låses) står alla
  `To Do` och byggs i en parallell session just nu.
- **Vad som händer härnäst** — den blir plockbar när de tre skivorna landat.
- **Källa** — `TASK-309.11` (beroenden `309.1`–`309.10`; `.1`–`.7` Done,
  `.8`/`.9`/`.10` To Do, mätt 2026-08-28).

### 37. `TASK-126.5` — installationsvandringen på riktiga enheter

- **Vad det är** — installera appen på iPad, i Mac Safaris Dock och via
  Chromiums installationsdialog, och kontrollera att den öppnas i eget
  fönster.
- **Varför den är parkerad** — blockerad av `TASK-126.3` (install-ytan under
  Mer-fliken), som står `To Do`. Utan den ytan finns ingen väg i appen att
  följa.
- **Vad som händer härnäst** — `126.3` är agent-körbar; vandringen dukas när
  den landat.
- **Källa** — `TASK-126.5` (beroende `126.3`, To Do) · tråd `T47`.

### 38. `TASK-160.7` — compact-formens ände-till-ände-QA

- **Vad det är** — pröva hela kedjan när en session närmar sig
  kontextgränsen: larm → skill → säkrat läge → ditt GO → kontrollerad
  kompaktering → omorientering efteråt.
- **Varför den är parkerad** — den kräver ett TILLFÄLLE, inte ett beslut:
  kedjan måste prövas i en verklig orkestrerings-session med byggare i
  luften och kontexten faktiskt i zonen. Den går inte att beställa fram.
- **Vad som händer härnäst** — orkestreraren flaggar när läget uppstår, och
  du får frågan då.
- **Källa** — `TASK-160.7` AC #1–#3 · `ADR-101`.

### 39. Resten av `ready-for-human`-inventeringen

- **Vad det är** — repot bär **75** kort med etiketten `ready-for-human` som
  inte är klara (mätt mot disk 2026-08-28). Listan ovan täcker dem som
  faktiskt står och väntar på dig nu.
- **Varför resten inte står här** — de fördelar sig så här: **12** är
  PRD-/föräldrakort som stängs när sina barn stängs (`54`, `59`, `70`, `126`,
  `127`, `145`, `146`, `147`, `148`, `149`, `173`, `213`); **19** är skivor
  som är mekaniskt blockerade av öppna beroenden (bland dem hela
  `213.3`–`213.11`, `309.9`–`309.11`, `148.6`/`148.7`, `173.7`, `158.6`,
  `126.5`); resten är fynd-kort där etiketten betyder "en människa ska klassa
  det", inte "Marcus står och väntar" — de dyker upp i den här listan när de
  blir aktuella.
- **Vad som händer härnäst** — orkestreraren triagerar dem löpande och
  lyfter in nya punkter här när något faktiskt kräver dig.
- **Källa** — `grep -l "ready-for-human" backlog/tasks/*.md` korsat mot
  frontmatterns `status` och `dependencies`, kört 2026-08-28 ·
  sessionsdok `tasks/sessions/2026-08-24-session-112.md` Del 4
  § A-klass-inventeringen.

### 40. De sex pausade sessionsdoken — stängda, resterna lever i `TASK-332`

- **Vad det är** — S92, S96, S98, S99, S101 och S107 stod `paused` i upp till
  fem veckor. Du sade att varje öppet dok bär något i sitt scope som du ville
  få klart, och föreslog att samla punkterna på ett ställe. Det är gjort: en
  Opus-agent djupläste alla sex (7 644 rader), klassade varje scope-punkt som
  klar (24, med belägg) eller öppen (55), och la de öppna i PRD-kortet
  `TASK-332` — varje punkt med `sessionsdok § rubrik (rad N–M)` och de
  kort/trådar/PR:er den redan pekar på. Doken stängdes via en ny, bokförd
  form ("scope-överföring", ADR-052 § Updates) med en K/Ö-tabell sist i
  varje dok.
- **Varför du inte behöver göra något nu** — inget förkastades; allt öppet
  har adress. När du vill jobba på resterna: starta en session med `TASK-332`
  som scope, så bryts kortet ned med `/to-issues`.
- **Värt att veta** — fyra av sex "absorberad"-hypoteser i S112 Del 7 föll vid
  djupläsningen: S92:s rollmigrering är INTE gjord (`primitives.css` rad
  149–155 säger det själv), S98:s UNIVERSAL-form är fortfarande oavgjord
  (punkt 10 ovan), S101 saknar `173.4`, S107 bar tolv punkter, inte en.
- **Källa** — `TASK-332` · PR `#2045` (**landad** `ecc324b1`, 2026-08-28 —
  två granskningsrundor; runda 1 fångade en tappad S107-post, nu 28 K / 56 Ö)
  · `ADR-052` § Updates 2026-08-28 · sessionsdok S112 Del 7 Fynd 3 + Del 8.
