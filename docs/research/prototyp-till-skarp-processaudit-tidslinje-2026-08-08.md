---
owner: marcus803
updated: 2026-08-08
review_by: 2027-02-08
status: draft
---

# Prototyp → skarp-processaudit: tidslinjen från hållplats-prototypen till facit-haveriet (Code, 2026-08-08)

> Uppdrag A1 i Marcus fullskaliga processaudit av eventsidans prototyp→skarp-
> förlopp. Frågan: vilka fel, omtag och friktionspunkter inträffade —
> kronologiskt, källmärkta — från hållplats-prototypens start (2026-08-02) till
> facit-haveriets bokföring (2026-08-07), och vilka av dem täcks INTE av
> [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)s
> rotorsaker R1–R9? Denna fil är auditens **substrat** — ett gap-jaktens
> råmaterial, inte själva domen över processen.

## Metod och källor

**Fullständigt lästa primärkällor:**

- `tasks/sessions/archive/2026-08/2026-08-02-session-93.md` — samtliga 1 777 rader, Del 1–11
  plus tillhörande paushistorik-block.
- `docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md` —
  helt, inklusive R1–R9 och B1–B5.
- `docs/research/eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md` —
  helt (avvikelserna A1–A6).
- `tasks/threads/T134-agent-apparatens-genomloppstid-mot-kodens-storlek.md`
  och `T135-post-merge-korningen-avbryts-trots-att-filen-sager-aldrig.md` —
  helt.
- Samtliga åtta filer i `tasks/lessons.d/` — helt.
- `backlog/tasks/task-145.md` (PRD) + `task-145.1`–`.6` — Description, AC och
  DoD lästa i sin helhet (AC-texten citerad verbatim där den styr en
  mappning).
- `docs/decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md`
  — rubriker + amenderingshistorik, för R7:s proveniens.

**Delvis lästa, avgränsat till det instruerade urvalet:**

- `tasks/sessions/archive/2026-08/2026-08-02-session-96.md` — Del 9 (`#678`
  växlar-kontraktet, ADR-074 Amendering 6) samt en grep över hela filen efter
  `hallplats`/`PrototypeSwitcher`/`variant=a`/`ADR-074`/`eventsid`/`Atgarder`.
  Ingen ytterligare eventsida-relevans hittades.
- `tasks/sessions/archive/2026-08/2026-08-07-session-100.md` — Del 1–4 (varv 1–5 på
  åtgärds-sidan). Detta är ett **angränsande, inte samma**, kort (`TASK-147`
  mot eventsidans `TASK-145`) — medtaget som jämförelsepunkt, inte som en del
  av eventsidans egen tidslinje. Del 5 lästes inte (utanför varv 1–4).

**Utvidgning (Marcus-order, mottagen mitt i passet): S93s egna transcript,
inte bara sessionsdokets paraphrasering.** Skälet, ordagrant: *"Om
Tidslinje-agenten går in och läser transcripten för alla S93 sessioner så
kommer han se allt jag skrivit och förstå — han orkar inte återberätta sina
smärtpunkter."* Källorna:

- `~/.claude/projects/-Users-marcus-Repon-miranon-media-admin/*.jsonl`
  (huvudkatalogens sessionslogg — delad med S94–S100; 29 filer i fönstret
  2026-08-02–08, varav 11 identifierade som S93-bärande via innehållsträff på
  sessionsdokets egen rubrikrad).
- `~/.claude/projects/-Users-marcus-Repon-miranon-media-admin--claude-worktrees-s93-resume-2/*.jsonl`
  (1 fil, 1 727 rader).
- `~/.claude/projects/-Users-marcus-Repon-miranon-media-admin--claude-worktrees-s93-agarlapp-regelbarare/*.jsonl`
  (1 fil, 592 rader).

**Filerna lästes ALDRIG råa** — de är JSONL med fulla tool-anrop och
tool-resultat inbakade (628 KB extraherat innehåll enbart för
user-turerna). Metoden var ett Python-filter körligt via Bash: (1) parsa
varje rad, behåll endast `type: "user"` med `message.role: "user"`; (2)
inom `content`, behåll endast textblock — kasta `tool_result`-block och
allt med `tool_use_id`; (3) kasta harness-injicerad text
(`<task-notification>`, `<local-command-stdout>`, heartbeat-svep-eko) —
detta är monitorn som pratar med sig själv, inte Marcus; (4) sortera
kronologiskt på `timestamp`. Utfall: **469 genuina Marcus-userturer** över
de 13 filerna. Av dessa granskades: samtliga 5 träffar på en snäv
ordlista av starka svenska affekt-markörer (*"vad fan"*, *"för helvete"*,
*"SNÄLLA"*, *"jävla"*, *"besviken"*, *"underleverans"*, m.fl.), samtliga 14
träffar på ≥2 versal-betonade ord (VARFÖR, ALDRIG, EXAKT — ett svenskt
skriftspråks-emfas-mönster, inte en gissning: Marcus egen skrivstil bär
detta genomgående) i texter 20–900 tecken, plus riktade `grep`-sökningar på
kända ankarfraser (*"designmässigt är det skit"*, *"Lås som facit"*, *"Bor
över"*) för att fånga citat sessionsdoket redan sammanfattat men inte
återgett fullständigt. **Detta är INTE samtliga 469 turer manuellt lästa**
— se § Vad jag inte kunde belägga för vad urvalet kan ha missat.

**Verifierat mot git/GitHub, inte antaget ur prosan:**

```bash
git log --oneline --since=2026-08-02 --until=2026-08-08 main
gh pr list --state merged --search "merged:2026-08-02..2026-08-08" --limit 200 \
  --json number,title,mergedAt,mergeCommit
```

Samtliga SHA:er och PR-nummer som citeras nedan är kontrollerade mot detta
utdrag (200 mergade PR:er i fönstret, plus fem äldre `#603`/`#613`/`#639`/
`#660`/`#667` slagna upp direkt i `git log --all`). Där ett tal i
sessionsdoket och git-loggen skilde sig hade git-loggen företräde; ingen
sådan avvikelse hittades.

**Ej lästa/ej granskade:** `tasks/todo.md`s kadensblock (rad ~297–1100) lästes
via grep — det visade sig genomgående vara en förkortad spegling av
sessionsdoket ("HANDOFF: sessionsdok S93 § …") utan självständiga fakta utöver
det som redan fanns i Del 1–11. Ingen post nedan är hämtad enbart därifrån.

**Vad "täcks av R1–R9" betyder här:** en post mappas till ett R-nummer när den
observerade mekanismen är samma som R-numrets text beskriver — inte bara när
ämnet är likartat. Där en post delar tema med ett R-nummer men inte dess
specifika mekanism är den märkt **OMAPPAD** med en förklarande rad.

---

## Tidslinjen

### Fas 1 — Divergens och fix-vågor (Del 2, 2026-08-02 → 2026-08-03)

**F1 — 2026-08-02, PR #603 (14:46) → underkänt samma dag.**
Divergens-passet (`?variant=a/b/c` på skarpa eventsidan) landade och
orkestreraren handövade utan att själv granska renderat resultat. Marcus:
*"slarvigt byggd"*. Egen okulär granskning bekräftade defekterna: proto-data
nådde bara två block, Anteckningar skrivbar, dubbel-etikettering, variant B
utan rail-form, eventinfo oavskild.
*Källa:* Del 2, git `b269b2d9` (2026-08-02 14:46).
*Konsekvens:* hela review-fix-vågen (F2) krävdes för att laga en yta som
aldrig skulle ha handövats i det skicket.
*Mappning:* **OMAPPAD** — detta rör granskningsdisciplin (T99-klassen: se
egna renderade resultatet före handover), inte facit-mekanik. R1–R9
förutsätter att ett facit redan existerar; här fanns inget facit ännu.

**F2 — 2026-08-02, PR #613 (15:52).** Kvalitetsfix-vågen fann en tredje
ogrindad skrivväg (Beläggnings Ändra-knapp) utanför den kända defektlistan,
och fällde en falsk orkestrerar-premiss om seederns betalningsspridning
(9/16 + 3/16).
*Källa:* Del 2.
*Konsekvens:* fångad före landning, låg kostnad — men premissfelet visar att
orkestrerarens egna antaganden om testdata inte var verifierade innan de
styrde granskningen.
*Mappning:* **OMAPPAD**.

**F3 — 2026-08-03, nattens röda CI-körning (30784851472), fixad i PR #639
(10:40).** Två rotorsaker: (a) en K6-regression ur `#613`s
Beläggning-omstrukturering (null-rader läckte), (b) länkröta (2 döda URL:er).
*Källa:* Del 2, git `ca350397`.
*Konsekvens:* en extra fix-PR, hittad automatiskt av nattgrinden, ingen
mänsklig kostnad utöver lagningen.
*Mappning:* **OMAPPAD**.

**F4 — 2026-08-02/03, seed-skriptets `--help` kördes skarpt.** Skriptet
saknar hjälpflagga; ett `--help`-försök skapade ett riktigt seed-event i
stället för att visa hjälptext. Samtliga skrivvakter höll.
*Källa:* Del 2 § Bokfört i övrigt.
*Konsekvens:* obetydlig — bokfört öppet som skript-hygien-kandidat, aldrig
åtgärdad i detta fönster.
*Mappning:* **OMAPPAD**, trivial.

### Fas 2 — Konsoliderings-grillningen (Del 3, 2026-08-03)

Grillningen själv (8/8 kvitterade beslut) producerade inga fel i den
mening frågan efterfrågar — den är den friktionsfria delen av processen och
tas därför inte upp radvis. Ett fynd är värt att notera som **bakgrund** för
senare poster:

**F5 — 2026-08-03, byggkravsvågen (PR #660) fann en produktionsbugg.**
`Betalningar`-blockets `slutMottagna` och `slutSaknasAntal` räknade
"Ej relevant"-poster olika (två definitioner sedan `task-18.8`,
2026-07-22), fångat av orkestrerar-granskningen och enat i
`betalningsSplit()`.
*Källa:* Del 3 § Tillägg.
*Konsekvens:* en verklig bugg fixad som en bieffekt av prototyp-arbetet —
inte en processkostnad, men värd att notera eftersom den visar att
granskningslagret redan här fångade sådant en snabbare process hade missat.
*Mappning:* ej tillämpligt (ingen processfel; medtagen för fullständighet).

### Fas 3 — Första resumen: iterationsvåg 1–2 (Del 4, 2026-08-05 → 2026-08-06)

**F6 — 2026-08-05, handoffens samtliga fem numreringsaxlar hade drivit.**
Resumen fann ADR/lesson/tråd/kort/fälla-numren i pausdoket obsoleta —
parallella sessioner (S95/S96) hade förbrukat dem alla under pausen.
*Källa:* Del 4 § Ingången.
*Konsekvens:* omedelbar men låg — re-derivering mot disk krävs vid VARJE
resume (mönstret upprepas, se F17 nedan för dess systerklass).
*Mappning:* **OMAPPAD** — detta är en generell parallell-session-kostnad
(ADR-090s regim), inte facit-relaterad.

**F7 — 2026-08-05, PR #812: en radbrytning skapade en fantomlista.**
Kadensraden bröts så en rad började med `+ båda modulerna`; markdownlint
läste det som en listpunkt, MD004 låste facit till `+`, och **527 orörda
`-`-listor** fälldes i samma fil. Rättat i `3dccadaf`.
*Källa:* Del 4.
*Konsekvens:* en hel dokumentationsgrind rödfärgades av ett tecken — snabb
men skrämmande lagning.
*Mappning:* **OMAPPAD**.

**F8 — 2026-08-05, iterationsvåg 1 (PR #818): breddlåset höll inte första
gången.** Orkestreraren valde "längsta etikett" på `.length()` och mätte
143,69 mot 142,33 px — teckenantal är fel proxy för renderad bredd. Fångat
själv, före handover.
*Källa:* Del 4.
*Konsekvens:* noll — självfångst, ingen skada nådde Marcus.
*Mappning:* **OMAPPAD**.

**F9 — 2026-08-05, CI-fångsten på egna a11y-rubriker (larm-ärenden #821 · #824 · #825, PR `6f1d8c1a`).** Orkestrerarens egna sr-only-zonrubriker i
`BetalningsPersonRad` rev BÅDE axe heading-order OCH Playwrights strict
mode — en orsak, två fel. Rubrikerna revs helt (bar ingenting krysset redan
inte bar via `aria-label`).
*Källa:* Del 4.
*Konsekvens:* tre fällda tester (`mark-paid.staging.test.ts`), en extra
lagnings-runda.
*Mappning:* **OMAPPAD**.

**F10 — 2026-08-05, heartbeat-svepets delade `/tmp`-state (öppet, ej
fixat).** Två svep-processer utan `HEARTBEAT_STATE_DIR` delar
`/tmp/mm-heartbeat-svep/last-main-sha`: (a) endast EN session ser en given
landning, (b) icke-atomär skrivning ger falska kallstarter. Belagt tre
gånger under passet.
*Källa:* Del 4 § sista.
*Konsekvens:* landningar upptäcktes bara för att varje väckning
re-verifierades med `git log` — en tur, inte en garanti. Fixen är formulerad
men aldrig utförd (kräver Marcus-ord + skriptet körs av en annan levande
session).
*Mappning:* **OMAPPAD** — infrastruktur för landningsdetektion, orört av
facit-frågan.

### Fas 4 — Andra resumen: iterationsvåg 3–9 (Del 5, 2026-08-06)

**F11 — "Avbokade"-raden byggd på en falsk premiss (rekommendation-kräver-
hela-ytan).** Orkestreraren rekommenderade en ny "Avbokade 2"-rad i toppen
utifrån att ha läst EN komponentfil (`HallplatsToppA`); raden fanns redan i
logistik-gruppen (`Deltagare.tsx`). DOM-mätning visade två identiska
"Avbokade 2"-knappar 197 px isär. Fångat själv före handover.
*Källa:* `tasks/lessons.d/en-rekommendation-kraver-hela-ytan-inte-bara-filen-du-oppnade.md`,
Del 5.
*Konsekvens:* en byggd, dubblerad komponent som fick rivas — låg kostnad
(fångad före handover) men en instans av att en rekommendation byggdes på en
ofullständig läsning av ytan.
*Mappning:* **OMAPPAD**.

**F12 — Registrets fot bröt inuti sig själv när texten växte
(mät-det-ändringen-påverkar).** Knappgeometri mättes noggrant (32 px, 4 px
radie) men i FEL tillstånd (tomt filter) — när "Rensa filter"-knappen väl
renderades bröt både den och "Skriv ut" inuti sig själva ("Rensa / filter",
"Skriv / ut"). Marcus skärmavbild avslöjade det.
*Källa:* `tasks/lessons.d/mat-det-andringen-paverkar-inte-det-du-andrade.md`.
*Konsekvens:* extra lagningsrunda, fångad av Marcus (inte av mätningen som
skulle ha fångat den).
*Mappning:* **OMAPPAD**.

**F13 — Processfelet: iterationskadensen, och åtgärden bet inte.** Marcus:
*"Varför pushar du varje iterationsrunda? […] de åtgärder vi införde då
verkar ju inte bita alls."* Regeln fanns ordagrant i `prototype`-skillens
§ 5, skriven efter en TIDIGARE instans (`T116`), men lästes aldrig eftersom
sessionen kom in via `session-resume` → HANDOFF, en kedja där skillen inte
laddas.
*Källa:* Del 5.
*Konsekvens:* Marcus avvisade lesson-formen och krävde mekanisering —
registrerat som `T126` (rotorsak märkt HYPOTES). Kadensen lades om (lokal
commit per varv). Mekaniserades först ~36 timmar senare (`TASK-149.3`,
push-hooken, 2026-08-07 12:13).
*Mappning:* **OMAPPAD** — detta är arbetsformens leveransväg, helt orelaterat
till facit. Värt att notera: samma mönster (en regel som finns skriven men
inte når fram) ÄR den generella klass R1–R6 tillhör, men R1–R9 beskriver bara
facit-instansen av den, inte kadens-instansen.

**F14 — Draft-fyndet: heartbeat-svepet larmade på avsiktligt parkerad
`#838`.** Korrekt larm (level-triggered, kan inte skilja parkerad från
glömd); löst med `isDraft`-filter i kandidat-villkoret i stället för
författar-undantag.
*Källa:* Del 5.
*Konsekvens:* ingen — korrekt beteende, snabbt löst.
*Mappning:* **OMAPPAD**.

**F15 — Hover-fixen bet inte första gången.** `hover:bg-bg-emphasized`
lämnade hovern oförändrad eftersom `cn()`s tailwind-merge inte såg
`hover:`-klassen som konflikt med primitivens `data-[hovered]:`-klass. Löst
med primitivens egen variant-mekanism.
*Källa:* Del 5.
*Konsekvens:* en extra iteration för en enda CSS-regel.
*Mappning:* **OMAPPAD**.

### Fas 5 — Tredje resumen: facit låst (Del 6, 2026-08-06)

**F16 — Resumen fortsatte på en STALE dokumentkopia (instans 1 av minst
4).** Huvudkatalogens kopia av sessionsdoket bar `lifecycle: active` utan
PAUSLÄGE — den formella pausen efter våg 9 hade inte landat i den kopia som
lästes. Arbetet fortsatte ändå (i rätt worktree, tur snarare än system).
*Källa:* Del 6 § Ingången.
*Konsekvens:* ingen skada denna gång, men detta är FÖRSTA instansen av ett
mönster som upprepas explicit namngivet tre gånger till (F23, F28, F35) —
se konsoliderad post nedan.
*Mappning:* **OMAPPAD** — se § Sammanställning för varför detta är den mest
underskattade luckan i tidslinjen.

**F17 — `mt-*`/`mb-*` på `<p>` är tysta no-ops i denna kodbas (två vågor
verkningslösa).** En global OSKIKTAD `p { margin: 0 }` slår Tailwinds
utilities. Våg 12:s "förbättring" kom helt från andra klasser
(`leading-relaxed`, `pb-1`) och rapporterades felaktigt som tre verksamma
mått innan `pt-4` löste det i våg 14.
*Källa:* Del 6 § Processfynd 1.
*Konsekvens:* **2 av de totalt 20 iterationsvågorna i denna fas var
verkningslösa** — ~10 % av hela iterationsarbetet i just den delen av
passet gick åt utan effekt, och rapporterades dessutom felaktigt som
lyckat.
*Mappning:* **OMAPPAD**.

**F18 — Grenen låg 4 commits bakom `main` genom HELA passet, upptäckt
först vid facit-låsningen.** Den formella S93-pausen (`#839`) landade i
`main` medan arbetet pågick i worktreen; upptäcktes när sessionsdoket skulle
skrivas och visade sig ha 680 rader i `main` mot 497 i grenen. Löst med
`git merge origin/main`, en konflikt, ingen bokföring förlorad.
*Källa:* Del 6 § Processfynd 2.
*Konsekvens:* Del 5s beskrivning av "facit EJ låst" stod olöst-motsagd i
`main` genom hela passets aktiva arbete — ren tur att ingen läste fel kopia
under tiden.
*Mappning:* **OMAPPAD**.

**F19 — En facitbild-städning kollapsade layouten.** Försöket att dölja
dev-overlays gissade fel på `parentElement.parentElement` och träffade
`main`; dokumentet gick 3523 → 907 px och tre bilder blev tomma. Fångat
genom att LÄSA den sparade filen, inte anta att den blev rätt.
*Källa:* Del 6 § Processfynd 3.
*Konsekvens:* facitbilderna fick tas om — direkt risk mot facit-artefaktens
egen integritet, i det ögonblick de skapades.
*Mappning:* **OMAPPAD** — detta är särskilt anmärkningsvärt eftersom R1–R9
uttömmande behandlar vad som händer EFTER facit finns (hur det bärs,
förväxlas, granskas), men ingenting om att FRAMSTÄLLNINGEN av facit-bilder
själv kan korrumpera dem. En nära krasch i facit-artefaktens egen
tillkomst, oadresserad av ADR:n.

**Facit-låsningen:** Marcus, efter elva vågor (10–17 betalningsyta, 18–19
gruppdynamik, 20 tvärs-över): *"Jag är nöjd. Lås som facit."* (2026-08-06).

### Fas 6 — Fjärde resumen: Actions-avbrottet och PRD × 3 (Del 7, 2026-08-07)

**F20 — Resumen fortsatte på en STALE dokumentkopia (instans 2 av minst
4).** Explicit bokfört som "en fälla värd att minnas": huvudkatalogens
kopia bar fortfarande Del 5s PAUSLÄGE (681 rader) eftersom Del 6 låg
olandad på en annan gren.
*Källa:* Del 7 § Ingången.
*Konsekvens:* ingen skada — worktree-kopian lästes i stället — men detta är
FÖRSTA gången mönstret själv namnges ("en fälla värd att minnas").
*Mappning:* **OMAPPAD**, se konsoliderad post i § Sammanställning.

**F21 — GitHub Actions `major_outage` fällde `#838`s required check, och
TVÅ vaktar larmade falskt samtidigt.** (a) Heartbeat-svepet larmade
level-triggered på en rollup som strukturellt inte kunde tystna. (b) Den
riktade vakten som ersatte den bröt på `Actions=operational` — och när
förgrundsverifieringen kördes stod statussidan på `major_outage` igen
(sidan hade flaxat mitt i incidenten).
*Källa:* Del 7 § Två vaktar som ljög.
*Konsekvens:* två felaktiga signaler på en timme; båda räddade av
förgrundsverifiering i stället för att litas på.
*Mappning:* **OMAPPAD** — orsaken var extern (GitHub), men vaktkonstruktionen
förvärrade signalen.

**F22 — Omkörningen materialiserades aldrig.** `gh run rerun --failed` gav
`EXIT 0`, men körningen stod queued i **13 timmar med noll jobb**. CodeQL
svarade rakt ut att den inte kunde köras om. Under natten föll alla
CI-checkar ur `#838`s rollup helt.
*Källa:* Del 7 § Omkörningen som aldrig materialiserades.
*Konsekvens:* löstes till slut som bieffekt av en annan åtgärd (merge av
`origin/main` triggade en färsk körning) — inte av den avsedda
omkörnings-vägen, som visade sig obrukbar.
*Mappning:* **OMAPPAD**.

**F23 — Nummerkollisionen: S93s lokalt mintade `T127` kolliderade med S96s
landade `T127`.** Disk-facit-regeln avgjorde: S93s tråd omnumrerades till
`T130`. Krävde ändringar i minst sex platser (indexrad, trådfil + rubrik,
Del 6s rubrik och narrativ, PAUSLÄGE-referenser, bilagans spec-tabell,
`todo.md`s kadensrad).
*Källa:* Del 7 § Nummerkollisionen, merge-commit `dc6251c4`.
*Konsekvens:* en administrativ omtagsrunda över sex+ filer, orsakad av att
Actions-avbrottet höll S93s gren ute medan S96 landade parallellt.
*Mappning:* **OMAPPAD**.

**F24 — Sex kvitterade åtgärdstyper (grillad samsyn beslut 5) fanns
ingenstans nedskrivna.** Enumerationen ("6 typer inkl. Fritt utskick")
överlevde aldrig transkriptet till någon filartefakt. Genomsökt:
sessionsdok, båda research-passen, ORDLISTA, specar, kod — noll träffar.
*Källa:* Del 7 § Fyndet.
*Konsekvens:* registrerad som öppen DoD-punkt i `TASK-147` (#9) i stället
för att gissas — ledde direkt till Del 8s fullskaliga arkeologi (F25).
*Mappning:* **OMAPPAD** — nära släkt med R1 (materiał som borde ha burits
vidare av processen försvann), men R1 gäller specifikt facit-BILDER i
skill-kedjan, inte produktbeslut i allmänhet. Samma underliggande princip
(*"bara filartefakter överlever en session"*) men en annan instans av den.

### Fas 7 — Åtgärds-sidans underlag, skivningen och datum-beslutet (Del 8, 2026-08-07)

**F25 — Arkeologin blev en fil: elva filer genomsökta för beslutsmaterial
som "mest låg i produktionskoden".** Marcus: *"Har du koll på ALLT vi
pratat om och planerat för åtgärds-sidan?"* Genomsökningen fann
beslutsunderlag i `Atgarder.tsx`s docblock (Marcus verbatim-motiveringar per
rad) och i prototypens platshållartext — ingenting av det stod i
sessionsdoket. Resultatet landade som ett tio-avsnitts underlagsdokument
(`ATGARDSSIDAN-UNDERLAG.md`).
*Källa:* Del 8 § Arkeologin blev en fil.
*Konsekvens:* ett helt arkeologiskt pass (kostnad ej separat mätt, men
tillräckligt stort för att bli sitt eget dokument) krävdes för att
återfinna beslut som redan var fattade men aldrig bokförda där de skulle
sökas.
*Mappning:* **OMAPPAD** — direkt fortsättning av F24, samma kontinuitets-gap,
inte facit-specifikt.

**F26 — En dependency-missuppfattning rättades i Del 8, men den KORREKTA
kunskapen förhindrade inte att gränsen ändå drogs fel senare.** Orkestreraren
noterade explicit: *"Rättade ett beroende jag själv fått fel: Markera-läget
beror på filtreringen, inte bara på registret — `markeringKandidatIds` ÄR
den filtrerade listan (`Deltagare.tsx`:1652)."*
*Källa:* Del 8 § Tre skiv-beslut, punkt 2.
*Konsekvens:* **den vunna kunskapen skyddade inte skivningen** — `/to-issues`
skar ändå `TASK-145.1` och `TASK-145.3` isär rakt genom just denna symbol
(bekräftat i F33/F37 nedan, och i lessons.d-fragmentet
`skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan.md`, som
kallar det "ironin som gör lärdomen skarp": *"samma sessions Del 8 bokförde
redan kopplingen … och skivade ändå isär dem"*).
*Mappning:* **OMAPPAD** — detta är en skivnings-korrekthetsfråga (kod-
kopplingar), inte en facit-fråga. R9 rör facit-ÄGARSKAP per skiva, inte
symbol-koppling mellan skivor.

**F27 — Klassnings-omprövning: bilage-fundamentets skivor bytte från
`ready-for-human` till AFK-bara.** Fyndet om provisionering (repot saknar
`supabase/migrations`/storage-config) visade att båda skivorna krävde
incheckade idempotenta skript, vilket samtidigt gjorde dem AFK-bara — en
initial felklassning rättad före byggstart.
*Källa:* Del 8 § Fyndet om provisionering.
*Konsekvens:* ingen — fångad och rättad utan att något byggdes fel.
*Mappning:* ej tillämpligt (ingen skada; medtagen för fullständighet).

### Fas 8 — Femte resumen, första halvan: två agenter ut (Del 9, 2026-08-07)

**F28 — Resumen fortsatte på en STALE dokumentkopia (instans 3 av minst
4).** *"Del 7 § Ingången bokförde en fälla; den slog till igen samma
dygn."* Huvudkatalogen stod på en annan sessions gren, saknade Del 8 +
PAUSLÄGE, läste `lifecycle: active`.
*Källa:* Del 9 § Ingången.
*Konsekvens:* ingen skada (worktree-kopian användes), men detta är ANDRA
namngivna instansen SAMMA DYGN.
*Mappning:* **OMAPPAD**, se § Sammanställning.

**F29 — `TASK-145.1` (första försöket) raderade 1 310 rader E2E-täckning,
varav minst en rad ingen skiva ägde.** `event-bor-over.staging.test.ts`
(359 rader) raderades; agenten flaggade det själv, och orkestreraren
verifierade: `grep` över samtliga `145.*`/`146.*`/`147`-kort gav NOLL
träffar på "Bor över" — trots att grillad samsyn beslut 2 uttryckligen
kvitterat raden som överlevande.
*Källa:* Del 9 § `TASK-145.1`: fungerar, men…
*Konsekvens:* PR `#862` stannade **draft, oarmerad**, med tre öppna frågor
till Marcus — 145.1 kunde inte landas förrän en hel extra resume-runda
(Del 10) löste frågorna.
*Mappning:* **R9** (utvidgad instans). R9:s text nämner uttryckligen bara
att "Åtgärds-ytan fick ingen egen skiva" — men "Bor över"-raden är en
STRUKTURELLT IDENTISK instans av samma mekanism (en facit-kvitterad rad
utan skiv-ägare), inte omnämnd i ADR-texten trots att den upptäcktes samma
dag och i samma korthög.

**F30 — Samma skiva raderade `event-bekraftelse.staging.test.ts` (951
rader) på ett belägg som inte räckte.** PRD §Testbeslut säger att
avprickningens skarv *"ärvs inte hit och skrivs inte om här"* — det
belägger att den inte ÄRVS, inte att den ska RADERAS. Subjektet landar i
`TASK-147`, som vid detta tillfälle inte var skivad ännu.
*Källa:* Del 9, samma avsnitt.
*Konsekvens:* ytterligare en av de tre öppna frågorna i den parkerade
`#862`.
*Mappning:* **OMAPPAD** — detta är en instans av "förbud som svalde
skyldighet"-mönstret (se lessons.d
`uppdragets-kallmarkning-maste-avse-gallande-text.md` § 3), en
spec-tolkningsfråga, inte en facit-fråga.

**F31 — Skivgränsen tolkades om: `main` visade en TUNNARE eventsida mellan
`145.1` och `145.3`s landning.** Produktionsvyn tömdes på räknare, filter
och markera-läge (nästa skivors AC-yta) medan `?variant=a` lämnades
byte-identisk — ett medvetet men oflaggat scope-beslut.
*Källa:* Del 9, samma avsnitt.
*Konsekvens:* under mellantiden var `main` i ett läge som varken var
prototypen ELLER den slutgiltiga skarpa formen — ett tredje, temporärt
tillstånd, strukturellt likt det tredje läget som senare (F41) blev en av
facit-haveriets utlösande faktorer.
*Mappning:* **R8** (delvis) — ingen mekanisk kontroll existerade som kunde
flagga att `main` tillfälligt avvek från BÅDA referenspunkterna under en
flerskive-landning. R8 talar om avsaknaden av prototyp-mot-skarp-jämförelse
i allmänhet; detta är en specifik, tidsbunden instans av just den luckan.

**F32 — Andra instansen av "parkerad PR utan draft": `#862` lämnades
oarmerad UTAN draft-flagga, av samma person som skrivit lärdomen om exakt
detta dagen innan.** Heartbeat-svepet larmade ordagrant samma text som
tidigare. Draft sattes i efterhand.
*Källa:* `tasks/lessons.d/parkerad-pr-utan-draft-ar-oskiljbar-fran-glomd.md`
§ Andra instansen, Del 9.
*Konsekvens:* ett upprepat larm, löst med samma kända åtgärd — men
lärdomens egen poäng bekräftad: *"en regel som misslyckas för sin egen
författare, en dag efter att den skrevs, är inte ett läsnings-problem."*
*Mappning:* **OMAPPAD** — arbetsform, inte facit.

**F33 — Numreringen rörde sig UNDER passet: `ADR-096`, `task-148` +
sju skivor, senare `task-152`/`task-153` konsumerade av S99 medan S93
arbetade.** Ren parallellitets-kostnad.
*Källa:* Del 9 § Numreringen rörde sig.
*Konsekvens:* kräver `git fetch` + omkontroll vid varje `task create` —
disciplinär overhead, ingen felaktig minting inträffade denna gång.
*Mappning:* **OMAPPAD**.

### Fas 9 — Femte resumen, andra halvan: sex skivor, fem spec-fel (Del 10, 2026-08-07)

**F34 — Marcus underkände takten (första gången): "Vad fan, jag fattar
inte vad det är som tar sådan tid."** Jämförelse med prototyp-takten
gjorde observationen mätbar.
*Källa:* Del 10.
*Konsekvens:* utlöste den första mätningen (tabellen nedan) och
registreringen av `T134`.
*Mappning:* **OMAPPAD** — genomloppstid, inte facit.

**F35 — MÄTT: `TASK-145.1` kostade 150 minuter totalt, varav 72 minuter
rent slöseri.** Försök 1 (63 min, kastat) + återställning (9 min, kastad) +
försök 3 (55 min) + E2E-uppföljning (23 min). Övriga skivor: `145.2` 45
min, `145.4` 68 min, `146.1` 28 min, `146.2` 39 min, `146.3` 39 min,
grind-fixen 14 min.
*Källa:* Del 10 § Marcus underkände takten.
*Konsekvens:* **den enskilt dyraste, mest precist kvantifierade posten i
hela tidslinjen** — se § Sammanställning.
*Mappning:* **OMAPPAD** — genomloppstid/apparat-kostnad. De 72 spillda
minuterna orsakades av F29–F31 (E2E-raderingar, oägd rad, omtolkad
skivgräns) — själva ROTORSAKERNA till spillet mappar delvis till R9 (se
F29), men tidsförlusten som SÅDAN mäts inte av något R-nummer.

**F36 — Fem spec-fel, samtliga orkestrerarens, samtliga fångade externt
(noll av självgranskning):**

1. **Logistik-gruppen oägd.** `145.2` specades som "fyra steg-räknare";
   blocket har åtta rader. Bor över och Avbokade hamnade utanför varje
   kort trots att grillad samsyn beslut 2 kvitterat dem. → samma R9-instans
   som F29.
2. **Gräns rakt genom en delad symbol.** `145.1` och `145.3` var en skiva i
   koden (`Deltagare.tsx:1652` + `:2103`) men två kort. → samma OMAPPAD-post
   som F26/F31.
3. **Förbud som svalde skyldighet.** `145.1` AC #9 "Inga E2E-filer raderas"
   lästes symmetriskt som "rör dem inte alls" — 13 tester lämnades röda.
   → **OMAPPAD**, spec-kvalitet, inte facit. (Rättad i efterhand: verifierat
   via `git log`-grep att AC #9 i den landade kortfilen nu lyder *"Ingen
   fil RADERAS. Assertioner … SKA däremot uppdateras"* — se `task-145.1`s
   AC #11 ovan.)
4. **Delmängd namngiven där klass avsågs.** "Personkorten-blocket" i
   uppdraget löste 0/8 → 8/8, men ett ANNAT block i samma fil
   (Markera-läget — batch-bekräftelse) stod kvar rött och slog igenom på
   `main`. → **OMAPPAD**.
5. **Föråldrat citat som gällande facit.** `145.2`s uppdrag citerade
   bilagans rad 131 ("Eventinfo-raden + Bor över-raden … ORÖRDA") medan
   samma fils rad 681 river `AutoKryss`, och grillad samsyn beslut 2
   (citerad i SAMMA uppdrag) namnger den som rivning nr 1. → **R2/R3-närliggande
   men OMAPPAD**: detta rör en föråldrad CITERING av bilagan, inte att AC
   beskrev en defekt (R2) eller att granskningen var obockad (R3). Det är
   en tredje, distinkt spec-kvalitetsbrist ADR:n inte namnger.

*Källa:* Del 10 § Fem spec-fel; `tasks/lessons.d/skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan.md`;
`tasks/lessons.d/uppdragets-kallmarkning-maste-avse-gallande-text.md`.
*Konsekvens:* se F35 — dessa fem är den direkta orsaken till en betydande
del av de 72 spillda minuterna, plus egna omtag i efterföljande vågor.

**F37 — `main` blev röd av `145.1`s landning (larm `#895`), och
karantän-beslutet stod obesvarat i flera resumes.** 12 fallerade / 167
passerade, samtliga väntat beteende (medvetet borttagna funktioner) plus en
pre-existing Gruppdynamik-flake. Tre vägar lades fram (karantän, låt vara
röd, prioritera om) — inget svar gavs förrän `145.3` (F45 nedan) råkade
lösa frågan som bieffekt.
*Källa:* Del 10 § `main` blev röd.
*Konsekvens:* `main` stod rött i den verifierande sviten i minst en hel
paus-cykel utan bokfört beslut om varför det var okej.
*Mappning:* **OMAPPAD**.

**F38 — En agentrapport som inte stämde: `145.4` påstod `biome` EXIT=0,
omkörning gav EXIT=1.** `tests/e2e/mark-paid.staging.test.ts` (filen
skivan skrev om) var oformaterad. Diagnosen tog två steg eftersom en
till synes trolig root cause (`biome.json`-varning) fanns även på `main`
där Biome gav exit 0.
*Källa:* Del 10 § En agentrapport som inte stämde.
*Konsekvens:* rättad mekaniskt, men bekräftar mönstret: "en agents
grind-påstående är en hypotes tills det körts om" — som återkommer i F44
(shellcheck-rapporten på #949).
*Mappning:* **OMAPPAD**.

### Fas 10 — Sjätte resumen: facit-haveriet (Del 11, 2026-08-07)

**F39 — Resumen fortsatte på en STALE dokumentkopia (instans 4 av minst
4, explicit "tredje gången samma dygn" i källan).** `SessionStart`-hooken
rapporterade fel gren; huvudkatalogens kopia läste `lifecycle: active` utan
PAUSLÄGE-rubrik. Läst rakt av hade det betytt "S93 är inte pausad".
*Källa:* Del 11 § Ingången.
*Konsekvens:* ingen skada (worktree-kopian bar sanningen och lästes), men
detta är FJÄRDE totala/TREDJE namngivna instansen av mönstret på EN dag.
*Mappning:* **OMAPPAD** — se § Sammanställning, denna post ensam motiverar
att mönstret listas som egen dyr post.

**F40 — Marcus underkände takten (andra gången), och mätningen vände på
frågan.** *"Startade agenterna från NOLL … eventdetalj-sidan fanns ju sedan
innan i skarp version?"* Mätt per merge-commit: **netto i `src/` över sex
skivor: +519 / −653 = −134 rader.** Ingenting byggdes från noll —
diagnosen blev "kontexten byggs från noll, inte koden" (500–620k tokens per
kall agentstart).
*Källa:* Del 11 § Marcus underkände takten.
*Konsekvens:* registrerad som `T134` med fyra oprövade hypoteser.
*Mappning:* **OMAPPAD**.

**F41 — Ett-agent-svepet bekräftade hypotes 1: ~3× lägre kontextkostnad.**
`145.3`+`145.5`+`145.6` i EN agent: 510k tokens totalt (mot 500–620k PER
SKIVA tidigare) och 62,5 min (mot `145.1`s ensamma 150 min).
*Källa:* Del 11 § Ett-agent-svepet.
*Konsekvens:* positivt fynd, inte ett fel — men bekräftar att en stor del
av F35s kostnad var strukturell (kall kontext), inte facit-relaterad.
*Mappning:* ej tillämpligt (fynd, ingen skada).

**F42 — `TASK-145.6` byggdes INTE, och AC #1s källtal gick inte att
återfinna (sjätte spec-felet i serien).** "104 förekomster över sex filer"
finns "ingenstans utanför kortets egen rad" — agenten mätte 128 symboler
över sju filer alternativt 90 markörer över tio, ingen matchning.
*Källa:* Del 11 § `TASK-145.6` byggdes inte.
*Konsekvens:* agenten VÄGRADE bygga på en overifierbar siffra och
återställde i stället ett halvfärdigt bygge — rätt beslut (verifierat: en
halv rivning hade tyst flippat betalningsytan tillbaka till skrivbar
form). `#935` bar enbart kortfilen med kartan.
*Mappning:* **R6** (delvis) — `TASK-145.6` schemalades ursprungligen som en
vanlig skiva i beroendekön (R6:s exakta beskrivning: "frågan är besvarad"
var odefinierat i `/prototype`, så rivningen kördes som vilken skiva som
helst). Att agenten själv stannade var tur/omdöme, inte en mekanism — det
var FÖRST efter denna incident som `ADR-102` B3 mekaniserade blockeringen.

**F43 — FACIT-HAVERIET: orkestreraren öppnade fel skärmdump, kallade den
facit inför Marcus, byggde en slutsats på den.** `konvergens-a-markera-atgarder.png`
(2026-08-05, ett PASSERAT mellansteg) förväxlades med det verkliga facit
(`facit-*.png`, 2026-08-06) — **tjugo minuter** efter att ha beskrivit
exakt den felklassen för Marcus, och **en dag** efter att ha skrivit
lärdomen om precis detta (`uppdragets-kallmarkning-maste-avse-gallande-text.md`).
Marcus: *"Vad fan är det här, titta på facit-bilderna för helvete så ser ju
alla hur det ska bli med knapparna, SNÄLLA förklara VARFÖR detta blir en
fråga?"*
*Källa:* Del 11 § FACIT-HAVERIET;
`tasks/lessons.d/facit-maste-baras-av-mekanism-inte-av-minne.md`.
*Konsekvens:* utlöste hela resten av passet — `ADR-102` (5 beslut, 9
rotorsaker), en ny CI-grind (`facit.json` + `check-facit.sh`), ett fullt
research-pass (facitkartan, F45), och `TASK-145.6` blockerad tills vidare.
Se § Sammanställning för varför detta rankas som näst dyraste posten trots
att ingen enskild minuträkning finns för just detta ögonblick.
*Mappning:* **R4** — exakt R4:s beskrivna mekanism ("facit går att förväxla
med icke-facit … tretton `.png` i EN katalog, utan åtskillnad annat än ett
prefix"), här inträffad hos orkestreraren personligen, inte hos en
byggagent.

**F44 — Underliggande kod-divergensen: `EventDetail.tsx:284-290`
renderade varken rent-prototyp eller rent-skarpa, utan ett TREDJE läge.**
Prototypen: `AtgarderKort` ("Gå till åtgärder"). Skarpa: den gamla
`Atgarder`-listan. Vad som faktiskt låg på `main`: fyra rader rivna och
omnumrerade — varken det ena eller det andra.
*Källa:* Del 11, `ADR-102` § Kontext.
*Konsekvens:* detta ÄR den mätta divergens ADR-102 skrevs för att förklara.
*Mappning:* täcks kollektivt av R1–R9 (detta är symptomet ADR:n
diagnostiserar, inte en gap i diagnosen).

**F45 — ADR-102s EGEN rotorsaksanalys hade fyra fel, fångade av agenten
som mekaniserade den.** Marcus order: *"agenten måste tänka lite själv
också."* Fyra korrigeringar: (1) R1 underskattad — `/prototype` bär inte
heller begreppet facit, kedjan hade det aldrig, tappade det inte; (2) R3
feldiagnostiserad — `145.3`s utförare hoppade INTE över granskningen,
kortet dokumenterar öppet att bilderna "inte fanns i uppdraget" (**detta ÄR
en ren R1-instans**, se nedan); (3) R4s tabell listade bara 2 av 4
namnklasser i facit-katalogen; (4) R5 delvis fel — README rad 785–857
deklarerar redan bilderna, fast som prosa utan begreppet "förväntad
täckning".
*Källa:* Del 11 § Mekaniseringen.
*Konsekvens:* ADR-102s text korrigerades innan mekaniseringen byggdes —
ett meta-fynd: även den ADR som SKA fånga gap:et i processen hade egna gap
vid första skrivningen, fångade av samma disciplin (extern granskning) som
resten av dokumentet beskriver.
*Mappning:* **ej ett R-nummer** — detta ÄR korrigeringar TILL R1/R3/R4/R5,
redan inbakade i den ADR-102-text som lästes för denna audit. Notera dock
korrigering (2) explicit: `145.3`s uppdrag saknade en facit-hänvisning helt
— det är **en ren, tidsmässigt TIDIGARE instans av R1** (byggagentens
uppdrag, inte bara skill-mallen abstrakt), inträffad före `ADR-102` ens
existerade.

**F46 — `#949` (facit-mekanismen) blev själv röd.** Tre fel: SC2154
(variabel läst utan synlig tilldelning för shellcheck), SC2312 × 9
(falsk-positiv, behövde fil-nivå-disable FÖRE första kommandot), och —
viktigast — **`.facit-policy.conf` var ALDRIG wirad in i `ci.yml`s
shellcheck-lista**, bara nämnd i en kommentar. Fångades enbart som bieffekt
av att skriptet självt hade orelaterade fel.
*Källa:* Del 11 § `#949` blev röd;
`tasks/lessons.d/ny-conf-fil-maste-wiras-in-i-grindens-egen-lista.md`.
*Konsekvens:* "hade skriptet varit rent hade conf-filen glidit igenom
osedd" — en lucka i själva REMEDIERINGS-mekanismen för facit-problemet,
upptäckt bara genom tur.
*Mappning:* **OMAPPAD** — detta är en implementationsbugg i mekaniseringen
AV R3–R6, inträffad EFTER ADR-102 skrevs. Den är alltså per definition
utanför vad R1–R9 kan beskriva (de beskriver orsaken till haveriet, inte
kvaliteten på dess egen lagning) — men hör hemma i denna tidslinje eftersom
den visar att även facit-FIXEN var skör vid första försöket.

**F47 — Agenten som byggde `#949` rapporterade "shellcheck 0" utan CI:s
faktiska flaggor.** CI kör `--severity=style --enable=all`; agentens
körning gjorde det inte. De två äkta felen (F46) var default-disabled
optional checks som därför missades av agentens egen verifiering.
*Källa:* samma lesson som F46.
*Konsekvens:* samma mönster som F38 — en grönt rapporterad grind var inte
CI:s grind.
*Mappning:* **OMAPPAD**.

**F48 — Facitkartan (`#950`) hittade FEM YTTERLIGARE avvikelser utöver
den ADR-102 redan kände till.** A1 (åtgärds-ytan) var känd. A2 (registrets
navigering — filterpanel mot tre flikar), A3 (avbokade i registrets bas),
A4 (avdelaren, 1px), A5 (Bor över-ramen) och A6 (batch-baren vid noll
träffar) var det INTE. Fem av sex avvikelser sitter i registret — den yta
Marcus itererade MEST på (vågorna 5, 6, 8, 9).
*Källa:* `docs/research/eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`.
*Konsekvens:* utan detta pass hade `ADR-102` bara känt till 1 av 6
verkliga avvikelser — 83 % av den faktiska divergensen var osynlig vid
ADR:ns mintning.
*Mappning:* **R5 + R8**. R5 (facit-täckningens luckor osynliga — det finns
`facit-*.png` för fyra ytor men INGEN för åtgärds-ytan eller registret,
just de två block avvikelserna sitter i) och R8 (ingen mekanisk
prototyp-mot-skarp-jämförelse existerade förrän detta pass byggde en
tillfällig sådan för handen).

**F49 — Mottagen-datumets påstådda "drift" var delvis felaktig och
delvis overifierad.** Agenten rapporterade att prototypen "driftat" från
facit-bilderna på två punkter. Marcus invände: *"ingen ändringar har ju
gjorts sen vi tog bilderna?"* Punkt 1 höll (men var Marcus egen väg C, inte
drift). **Punkt 2 kunde INTE bekräftas** — agenten skrev att `145.5` rörde
`Deltagare.tsx` (betalningskrysset); `145.5` (`52614d0f`) rörde i själva
verket `Atgarder.tsx` + två testfiler. Orkestreraren blandade dessutom ihop
punkt 2 med AutoKryss (K44, en HELT ANNAN, avsiktlig rivning).
*Källa:* Del 11 § Mottagen-datumet.
*Konsekvens:* ett overifierat påstående nästan blev bokfört som fakta;
räddat av att Marcus ifrågasatte det direkt i stunden.
*Mappning:* **OMAPPAD** — ett agent-rapport-tillförlitlighetsfel, samma
klass som F38/F47, inte facit-mekanik.

**F50 — Dev-servern felaktigt tillskriven en annan session i handoffen.**
5173 påstods tillhöra "en annan session" i en tidigare paus; visade sig
vara S93s EGEN kvarleva (PID 19612, startad 2026-08-06 11:40).
*Källa:* Del 11 § Miljöfynd.
*Konsekvens:* ingen skada (Marcus granskningsyta förblev intakt), men
handoff-informationen var fel i minst en paus-cykel.
*Mappning:* **OMAPPAD**, minor.

**F51 — Orkestreraren arbetade oavsiktligt i huvudkatalogen utan att
kontrollera var han stod (self-reported near-miss).** Skadan blev noll
eftersom katalogen råkade stå övergiven på en mergad gren — men kontrollen
gjordes i efterhand, inte i förväg.
*Källa:* Del 11 § Miljöfynd.
*Konsekvens:* ingen skada denna gång; explicit bokfört som ett beteende
som INTE ska upprepas.
*Mappning:* **OMAPPAD**.

**F52 — `T135`: post-merge-körningen avbryts trots att filens egen
kommentar säger att den "avbryts ALDRIG".** Reproducerat **två av två**
dispatch-försök plus en tredje instans utan dispatch. Larmkedjan fungerar
korrekt (fyrar även på `cancelled`), men rotorsaken är EJ fastställd — den
mest sannolika misstänkta (en samtidig skippad körning) uteslöts explicit.
*Källa:* `T135`, Del 11 § Miljöfynd.
*Konsekvens:* sex öppna post-merge-larm på ETT dygn, flera `cancelled`
snarare än genuint röda — svårare att triera än de behöver vara.
*Mappning:* **OMAPPAD**.

**`ADR-102` mintas** (PR `#944`, `9ff0bb59`, 18:21:42Z) med B1–B5 och R1–R9.
Detta är slutpunkten för uppdragets tidslinje.

### Angränsande spår, utanför `TASK-145` men samma process (session-100, före ADR-102)

**F53 — Åtgärds-sidans FÖRSTA prototyp-varv underlevererade grovt, av
samma generiska orsak som eventsidans facit-gap: facit lästes inte in i
utförandet.** Marcus dom (2026-08-07, FÖRE ADR-102 minades samma dag,
`#882` pausades 12:46:44Z mot `#944`s 18:21:42Z): *"En ordentlig
underleverans Claude! Den här sidan ser ut att vara ihopkastad i panik.
Ingen tanke, inget engagemang, ingenting."* Grammatiken (facit-bilder för
BETALNINGSARBETSYTAN) lästes men omsattes inte i den nya ytan; Dokument-
ytan byggdes inte alls trots att den stod i scope.
*Källa:* `tasks/sessions/archive/2026-08/2026-08-07-session-100.md` Del 2.
*Konsekvens:* en hel bygg-varv kastades, ytan gjordes om från grunden i
Del 3–4 med fyra EXPLICITA Marcus-formkrav.
*Mappning:* **HYPOTES, inte fastställt** att detta delar rotorsak med
eventsidans facit-haveri. Det ÄR en oberoende, samtida instans av "facit
finns men omsätts inte i det byggda" på ett SYSTERKORT (`TASK-147`), men
den hände FÖRE `ADR-102` fanns att pröva mot — så den kan varken räknas
som ett bevis FÖR eller EMOT att `ADR-102`s mekanisering hjälper. Ett
verkligt test av det kräver ett `TASK-147`-bygge EFTER `#949`/facit.json
landade (2026-08-07 19:09Z) — utanför denna tidslinjes fönster.

**F54 — En sekundär orsak till F53 bokfördes explicit: heartbeat-larm om
ANDRA sessioners PR:er konsumerade granskningsfönstret.** *"Under Marcus
granskningsfönster svarade orkestreraren på heartbeat-larm om ANDRA
sessioners PR:er, tur efter tur, i stället för att bygga Dokument-ytan."*
*Källa:* Session 100 Del 2.
*Konsekvens:* Dokument-ytan byggdes inte trots att den stod i scope —
tiden gick åt att kvittera larm som "var korrekta och inte åtgärdbara av
denna session."
*Mappning:* **OMAPPAD** — helt vid sidan av facit-frågan; en
uppmärksamhets-/väntefönster-fråga (jfr F17s heartbeat-friktion i
eventsidans egen tidslinje).

### Två poster som ENDAST transkriptet avslöjade (session-93.md nämner dem inte)

**F55 — 2026-08-05, "ägarlapp-fury": en helt odokumenterad Marcus-explosion
i en egen worktree (`s93-agarlapp-regelbarare`), 16:30–16:33.** Verbatim:
*"Va fan är det här!? Vi har jobbat så mycket med ägarlappen för att detta
ska funka. Nu låter ju du förvirrad, du vet inte vad ägarlappen är eller
hur du ska göra liksom. Det är TVÄRTOM mot vad vi försökt åstadkomma!!! …
UPPENBARLIGEN funkar det inte... Och DU ska reda ut VARFÖR, och det är
NU!!!!!!!!!!!!!!!!!!!!!!!!!"* — följt tre minuter senare av *"FIXA snälla
Claude!!!! Ordentligt så detta VERKLIGEN funkar som de ska sen!!!!!!"*
*Källa:* `~/.claude/projects/…s93-agarlapp-regelbarare/89a5c755-e006-4c0b-a520-77c87400460a.jsonl`.
Sökt i `tasks/sessions/archive/2026-08/2026-08-02-session-93.md` i sin helhet: ordet
"ägarlapp" förekommer nio gånger, samtliga i den rutinmässiga
"Huvudkatalogens ägarlapp tillhör session X"-formen — **noll referenser**
till denna incident, denna worktree, eller detta citat.
*Konsekvens:* okänd — transkriptet för denna worktree (592 rader) är inte
läst i sin helhet, så vad som föranledde utbrottet eller hur det löstes är
**inte utrett här**, bara att det INTRÄFFADE och att det är helt frånvarande
ur den skriftliga historiken.
*Mappning:* **OMAPPAD**, och en distinkt processklass från R1–R9: detta rör
ägarlapp-mekanismen (parallell-session-låset), inte facit. Men det delar
STRUKTUR med den mest underskattade OMAPPADE klassen i denna audit
(stale-huvudkatalog-mönstret, F16/F20/F28/F39): båda är instanser av att
Claude Codes egen SessionStart-rapport om "vem äger huvudkatalogen" gav
Marcus fel eller förvirrande information. Värt att undersöka vidare, men
INTE i denna audits läsfönster.

**F56 — 2026-08-07, 18:05, mitt i facit-haveriets utredning: ett ANDRA,
tidigare oupptäckt felaktigt påstående om facit-bildens innehåll.** Femton
minuter efter att felskärmdumpen (F43) upptäckts, och sex minuter innan
"SKRIV NER ALLA ROTORSAKER"-ordern, gav orkestreraren Marcus ett nytt
felaktigt påstående — att facitbilden visade **"SEX åtgärds-rader"**.
Marcus, verbatim (trippel-upprepningen är hans egen, för emfas — citerad
ordagrant, inte en skrivning härifrån):

<!-- vale Vale.Repetition = NO --> <!-- legitim repetition: Marcus egen emfas-trippel i ett direkt verbatim-citat -->

> *"VÄNTA VÄNTA VÄNTA. 1. Varför sa du först att facitbilden hade SEX
> åtgärds-rader? HUR ÄR DET ENS MÖJLIGT?????? 2. HUR kan vi ha byggt i fel
> ordning? Är det fel på skillen? Alltså hur fan blev det så här stökigt?
> Hur kan det blivit så fel???"*

<!-- vale Vale.Repetition = YES -->
*Källa:* `~/.claude/projects/…/c91a05a2-ea83-41d8-a38c-1e800b227992.jsonl`,
2026-08-07T18:05:42.400Z. Ej nämnt i `tasks/sessions/archive/2026-08/2026-08-02-session-93.md`
Del 11 — den skrivna narrativen går direkt från felskärmdumpen (F43) till
Marcus dom och ADR-mintningen, utan denna mellanliggande, andra felkälla.
*Konsekvens:* okänt exakt vad som orsakade felpåståendet — men den mest
sannolika kandidaten (HYPOTES, ej verifierad häri) är samma sammanblandning
som redan bokförd i F24: grillad samsyn beslut 5s **"åtgärdsval (6 typer
inkl. Fritt utskick)"** (en specifikation för den FRAMTIDA Åtgärds-sidan,
`TASK-147`) förväxlad med vad den FAKTISKA facit-bilden för eventsidans
`AtgarderKort` visar (en enda rad, "Gå till åtgärder" + en fristående
"Skriv ut"-knapp — se facitkartans § A1). Om hypotesen stämmer är detta
INTE en isolerad miss utan samma rot-förvirring som F24 som slår till en
andra gång, i ett läge där Marcus förtroende redan var som lägst denna dag.
*Mappning:* **OMAPPAD** (nytt, distinkt whackboard-fel om facit-INNEHÅLL,
inte facit-IDENTITET som R4 beskriver) — men **närbesläktat med R1/R4**:
samma bristande koppling mellan var facit bor och vad den faktiskt visar,
nu i orkestrerarens EGET minne/rapportering snarare än i en skill-kedja
eller en filkatalog.

---

### Marcus egna ord — smärtpunkterna

Kronologisk lista över de tyngsta verbatim-citaten ur transkriptet, var och
en mappad. Citat som redan fanns ordagrant i sessionsdoket eller `ADR-102`
markeras **[bekräftat]**; citat som INTE fanns där, eller fanns bara
delvis/paraphraserat, markeras **[NYTT]**.

1. **2026-08-02T15:01:08Z** — *"Fy tusan va slarvigt byggda prototyper!!
   Under all kritik. Dessutom har vi ju inget staging-event som har några
   anmälda deltagare, tomt på varje event, så går ju inte kolla något."*
   **[NYTT]** — sessionsdoket paraphraserar bara till *"slarvigt byggd"*
   (Del 2). Andra meningen (tomt staging-event, omöjligt att granska) är
   HELT frånvarande i skriven form — trots att den sannolikt är den direkta
   orsaken till att `ZZ-GRANSKNING-FIXTUR`-seedeventet skapades samma Del.
   → F1, **OMAPPAD**.
2. **2026-08-03T09:54:56Z** — *"Den skarpa versionen visar inte den
   senaste skarpa versionen. Markera-knappen och inline-scroll och de är
   borta."* **[bekräftat, delvis]** — matchar Del 2s "Marcus punkt … FRIAD i
   kod" men utan att sessionsdoket citerar frågan ordagrant. → Del 2,
   **OMAPPAD** (en falsk oro, senare friad — ingen skada).
3. **2026-08-05T16:30–16:33Z** — ägarlapp-furyn. **[NYTT, helt]** → F55,
   **OMAPPAD**.
4. **2026-08-05T18:44:55Z** — *"Åtgärdsgruppen högst upp måste in på
   åtgärdssidan. Vi kanske ska lägga till en likadan 'knapp' som 'Gå till
   check-in' som heter 'Gå till åtgärder' direkt under."* **[bekräftat]** —
   detta ÄR ordern `ADR-102` citerar (§ Kontext) som roten till hela
   divergensen. → F44, täcks kollektivt av R1–R9 (den utlösande ordern,
   inte en gap i sig).
5. **2026-08-06T10:22:15Z** — *"Varför pushar du varje iterationsrunda? …
   Annars måste vi ju vänta så jävla länge … Jag har påtalat det här förut
   men de åtgärder vi införde då verkar ju inte bita alls."* **[bekräftat,
   nu med fullständig svordom och exakt tidsstämpel]** — sessionsdoket
   återger kärnan men mjukar bort *"så jävla länge"*. → F13/`T126`,
   **OMAPPAD**.
6. **2026-08-06T14:07:34Z** — *"innehållet som det behöver ha, men
   designmässigt är det skit alltså … Jag behöver ditt bästa här Claude!"*
   **[bekräftat, delvis]** — Del 6 citerar bara första halvan
   ("innehållet … skit"). Vädjan i sista meningen är **[NYTT]** — visar att
   detta var en besvikelse med en uttalad förhoppning, inte bara en
   nedgörande dom. → Del 6 vågorna 10–17, kontext (ej ett fel i sig).
7. **2026-08-06T14:45:22Z** — *"Att bara ha 'Mottagen' och säger ju bara
   exakt samma sak som kryssrutan, eller hur?"* **[bekräftat]**, matchar
   Del 6 nästan ordagrant. → mottagen-datum-beslutet, kontext.
8. **2026-08-06T16:41:29Z** — *"Jag är nöjd. Lås som facit. Vi måste få
   med allt vi har gjort nu ju, eller hur!? Ta facitbilderna och gör
   enligt procedur liksom."* **[bekräftat, delvis]** — Del 6 citerar bara
   *"Jag är nöjd. Lås som facit."* Uppföljningsmeningen (*"få med allt …
   enligt procedur"*) är **[NYTT]** och bekräftar att en känd procedur för
   facit-fångst redan existerade vid denna tidpunkt — vilket gör F19s
   layoutkollaps under just den proceduren mer anmärkningsvärd, inte mindre.
   → FACIT LÅST, kontext.
9. **2026-08-07T11:24:46Z** — *"Va fan har vi tagit bort 'Bor över' och
   'Avbokade' helt ur eventdetaljer? Hur är det möjligt? De är ju med på
   facit-bilderna? LÖS vad det än är du ställt till med!! … allt ska vara
   så som jag låste facit-prototypen givetvis!!"* **[NYTT, helt]** —
   sessionsdoket dokumenterar UPPTÄCKTEN (Del 9, "grep gav noll träffar")
   och FIXEN (`#872`, 11:38:54Z) men **återger aldrig Marcus egen reaktion
   i ord**. Detta är den starkaste enskilda belägget för att R9s mekanism
   (facit-kvitterad rad utan skiv-ägare) inte är en teoretisk lucka utan
   en som Marcus själv, i realtid, identifierade som ett brutet löfte om
   facit-trohet. → F29/F30, **R9** (utvidgad instans, förstärkt av citat).
10. **2026-08-07T14:25:37Z** — *"Vad fan, jag fattar inte vad det är som
    tar sådan tid. Vi kodar ju inte ett nytt Google liksom."* **[bekräftat]**,
    exakt matchning mot Del 10. → F34, **OMAPPAD**.
11. **2026-08-07T17:56:21Z** — facit-haveriets fyra punkter. **[bekräftat,
    men UFULLSTÄNDIGT]** — Del 11 citerar bara punkt 2 (*"Vad fan är det
    här … VARFÖR detta blir en fråga"*). Punkterna 1 ("A", sannolikt en
    avbruten/oavsiktlig rad), 3 och 4 är **[NYTT]**: punkt 3 —
    *"VARFÖR sitter prototypen ihop med skarpa versionen? VARFÖR uppstår
    det här problemet?"* — är Marcus egen, tidigare artikulering av exakt
    R7s spänningsfält (delad kod), ställd som en öppen fråga innan
    `ADR-102` fanns för att svara på den. Punkt 4 — *"Koppla ihop dem,
    varför inte?"* — rör åtgärds-sidans länkning, utanför denna tidslinje.
    Efterföljande mening — *"Stänger du 5173 så kan jag ju inte se
    prototypen. Varför stör webbservern agenten?"* — är ett **HELT NYTT,
    ospårat pain point**: dev-server-porten som Marcus granskar på (5173)
    och agenternas eget bruk av samma resurs KROCKAR ur Marcus perspektiv,
    en spänning F50 (dev-server-missattribution) bara delvis fångar.
    → F43/F44, **R4** (huvudpunkten) + **R7-artikulering** (punkt 3, ny) +
    **OMAPPAD** (dev-server-krocken, punkt efter punkt 4).
12. **2026-08-07T18:05:42Z** — "VÄNTA VÄNTA VÄNTA"-utbrottet. **[NYTT,
    helt]** → F56, **OMAPPAD**.
13. **2026-08-07T18:12:03Z** — *"SKRIV NER ALLA ROTORSKAR TILL VARFÖR DET
    BLEV SÅ HÄR, det får ALDRIG hända igen. Ja, prototypen ÄR facit, finns
    ju inget annat som skulle kunna vara facit. Prototypen och skarpa
    version ska vara IDENTISKA det är ju för tusan hela poängen med att
    bygga en prototyp."* **[bekräftat, delvis]** — `ADR-102` § Kontext
    citerar bara de två sista meningarna ("Prototypen ÄR facit…" och,
    separat, "INGEN prototyp raderas…" från punkt 3 i citat 11 ovan). Den
    INLEDANDE ordern — *"SKRIV NER ALLA ROTORSKAR … det får ALDRIG hända
    igen"* — är **[NYTT]** i den meningen att den aldrig citeras ordagrant
    någonstans i skriven form, trots att den är den EXPLICITA ordern som
    utlöste hela R1–R9-analysen. → ADR-102s tillkomst, kontext.

**Läsanvisning för gap-jakten:** av tretton citat ovan är **fem [NYTT]
i sin helhet** (3, 4-delvis→se not, 5-delvis, 9, 12) och ytterligare
**fem delvis nya** (1, 6, 8, 11, 13) — sammantaget bär transkriptet
väsentligt mer råmaterial än sessionsdokets egna citat, vilket bekräftar
Marcus egen premiss för utvidgningen. De två citat som är HELT nya och
INTE redan mappade till ett F-nummer i huvudtidslinjen (F55 ägarlapp-fury,
F56 sex-åtgärds-rader-felet) är, tillsammans med dev-server-krock-punkten
i citat 11, de tre STARKASTE kandidat-rotorsakerna denna utvidgning
tillför utöver den ursprungliga tidslinjen.

---

## Sammanställning

### Antal poster per rotorsak (denna audits klassificering)

| Rotorsak | Antal direkta instanser i tidslinjen | Poster |
|---|---|---|
| R1 — facit försvinner i skill-kedjan | 1 (ren instans) | F45 (145.3s uppdrag) |
| R2 — AC beskriver problem, inte mål | 1 (verifierad mot faktisk AC-text) | task-145.5 AC #4, citerad i Metod-avsnittet |
| R3 — facit-granskningen är en bock utan spärr | 1 (bekräftad: 145.3 + 145.5 landade med boxen okryssad) | Del 10/11 paus-carry |
| R4 — facit förväxlingsbart | 1 | F43 (facit-haveriets kärna) |
| R5 — facit-täckningens luckor osynliga | 1 | F48 (facitkartan) |
| R6 — "frågan är besvarad" odefinierat | 1 (delvis) | F42 (145.6) |
| R7 — delad kod (ADR-074:s val) | 0 direkta timeline-fel (accepterad kostnad, ej ett processfel) | — |
| R8 — ingen mekanisk jämförelse | 2 | F31 (temporär divergens), F48 (facitkartan) |
| R9 — skivsnitt följde funktionsyta | 2 (förstärkt av ett direkt Marcus-citat, se § Marcus egna ord punkt 9) | F29/F36-1 (Bor över/Avbokade) |
| **OMAPPAD** | **~46 poster** | F1–F42 (majoriteten), F44 (delvis), F46–F56 |

**Läsanvisning:** summan överstiger antalet F-poster eftersom flera poster
mappar till flera R-nummer eller ingen alls; några poster (F5, F27, F41, F44)
är inte fel/friktion utan neutrala fynd, medtagna för fullständighet men inte
räknade i OMAPPAD-nämnaren.

### Fullständig OMAPPAD-lista

F1, F2, F3, F4, F6, F7, F8, F9, F10, F11, F12, F13, F14, F15, F16, F17, F18,
F19, F20, F21, F22, F23, F24, F25, F26, F28, F30, F32, F33, F34, F35, F36-2,
F36-3, F36-4, F36-5, F37, F38, F39, F46, F47, F49, F50, F51, F52, F54, **F55**,
**F56**, samt dev-server-krock-punkten i § Marcus egna ord punkt 11.

**F55 och F56 (funna enbart via transkriptet) förtjänar särskild vikt i
gap-jakten** — de är de två posterna i hela audit som INTE ens finns som
antydan i sessionsdoket. F55 (ägarlappfuryn) pekar mot en helt egen
processklass (parallell-session-lås-mekanismen) som denna audit inte har
underlag att utreda vidare. F56 (det andra felpåståendet mitt i
facit-haveriets egen utredning) visar att osäkerheten om facit-innehåll
INTE var begränsad till den enda, redan kända skärmdumps-förväxlingen
(F43) — den upprepades, i en annan form, femton minuter senare, i samma
samtal.

**Den mest underskattade OMAPPADE klassen: stale-huvudkatalog-dokumentkopian
(F16 → F20 → F28 → F39).** Detta mönster inträffade **minst fyra gånger på
sex dagar, tre av dem uttryckligen namngivna i källan som samma fälla**
("en fälla värd att minnas" → "slog till igen samma dygn" → "fällan slog
till en tredje gången"). Ingen mekanisering byggdes för den under hela
tidslinjens fönster — varje instans löstes genom tur (worktree-kopian
råkade läsas i stället) eller manuell vaksamhet, aldrig genom ett
strukturellt hinder. `ADR-102` nämner den inte, eftersom den inte är en
facit-fråga — men den är den enskilt mest RECIDIVERANDE processluckan i
hela tidslinjen, och den delar en STRUKTURELL likhet med R4 (fel artefakt
läst som gällande, i en katalog/kontext där två versioner samexisterar
åtskilda bara av var de fysiskt bor).

**Den näst mest underskattade klassen: arbetsformens leveransväg (F13,
`T126`).** Marcus egen observation — *"de åtgärder vi införde då verkar ju
inte bita alls"* — pekar på att detta INTE är en engångshändelse i denna
tidslinje utan ett känt, återkommande mönster som föregår hela S93. Det är
lika strukturellt orelaterat till facit-frågan som stale-doc-mönstret, men
delar dess grundform: en regel skriven i en fil som en viss inträdesväg
(här: `session-resume`) inte läser.

### De 3–5 dyraste posterna, mätt i omtag/tid

1. **F35 — `TASK-145.1`: 150 minuter, 72 minuter rent slöseri.** Den enda
   posten i hela tidslinjen med en EXAKT tidsmätning kopplad till ett
   specifikt spec-fel-kluster (F26, F29–F31, F36). Rankas #1 på
   mätbarhetens egna villkor.
2. **F43 — Facit-haveriet** (inklusive F56, det andra felpåståendet mitt i
   utredningen 15 minuter senare). Ingen enskild minuträkning finns, men
   nedströms-kostnaden är störst i hela tidslinjen: en ny ADR (5 beslut, 9
   rotorsaker, självkorrigerad fyra gånger i F45), en ny CI-grind som
   själv blev röd vid första försöket (F46–F47), ett fullt research-pass
   som avslöjade 5x fler avvikelser än kända (F48), och `TASK-145.6`
   blockerad på obestämd tid — plus, mätt i transkriptet, minst tre
   distinkta Marcus-utbrott på 26 minuter (17:56, 18:05, 18:12). Rankas #2
   på total nedströms-omfattning OCH på mätt emotionell kostnad.
3. **F17 — `mt-*`/`mb-*`-no-ops: 2 av 20 iterationsvågor (~10 %)
   verkningslösa,** och felaktigt RAPPORTERADE som tre lyckade mått innan
   upptäckten. Konkret, kvantifierad andel av ett helt arbetspass.
4. **F21–F23 — GitHub Actions-avbrottet:** 13 timmars felaktigt queued
   omkörning, en hel natts CI-churn, plus en tvingad nummerkollisions-fix
   (`T127`→`T130`) över minst sex filer. Delvis extern orsak (GitHub), men
   den interna vakt-konstruktionen (två falska larm) förvärrade signalen.
5. **Stale-huvudkatalog-mönstret (F16/F20/F28/F39), som recidiv.** Ingen
   enskild instans var dyr (alla löstes utan skada), men FYRA instanser på
   sex dagar utan mekanisering är i sig en processkostnad — varje instans
   är en verifieringsrunda som en mekanism hade kunnat eliminera helt.

---

## Vad jag inte kunde belägga

- **Transkriptet är INTE fullständigt manuellt läst.** 469 genuina
  Marcus-userturer extraherades ur 13 JSONL-filer; jag granskade en
  keyword-/versal-filtrerat urval (~275 turer, se § Metod) plus riktade
  ankarsökningar. Turer som INTE innehåller något av mina sökord eller
  ≥2 versal-betonade ord, och som inte matchade någon känd ankarfras, är
  **overifierade** — det kan finnas ytterligare smärtpunkter i de
  återstående ~194 turerna jag inte manuellt bedömde.
- **`s93-agarlapp-regelbarare`-worktreens fulla transkript (592 rader)**
  lästes bara genom filtren ovan, inte i sin helhet. F55 (ägarlapp-furyn)
  fångades, men VAD som föranledde den, och hur den löstes, är okänt här.
- **Om `s93-agarlapp-regelbarare`-tråden (F55) hör till samma
  processklass som hela `T121`-hooksPath-buggen** (CLAUDE.md §
  Worktree-isoleringens gräns) är en **HYPOTES**, inte verifierad —
  namnlikheten ("ägarlapp"/"regelbärare") är suggestiv men inte bevisad.
- **`T135`s rotorsak (post-merge-avbrotten).** Reproducerad två av två,
  men den bakomliggande mekanismen (global `staging-tests`-concurrency
  kontra GitHubs enkelplats-kö för väntande körningar) är uttryckligen
  **EJ fastställd** i källan. Jag har inte gjort någon egen utredning av
  detta — det ligger utanför uppdragets frågeställning (processaudit av
  prototyp→skarp, inte CI-infrastruktur).
- **Facit-mekanismens (`facit.json`/`check-facit.sh`) faktiska
  förebyggande effekt.** Mekanismen landades sist i tidslinjens fönster
  (`#949`, 2026-08-07 19:09Z). Ingen efterföljande `TASK-145`-relaterad
  händelse i mitt läsfönster prövar om den faktiskt förhindrar en ny
  instans av R3–R6 — det kräver observationer efter denna audits
  slutdatum.
- **Om session-100s "underleverans" (F53–F54) delar rotorsak med
  eventsidans facit-haveri.** Uttryckligen märkt HYPOTES ovan. Den
  inträffade före `ADR-102` fanns, så den kan inte tjäna som bevis för
  eller emot ADR:ns verkan.
- **Exakt kostnad (minuter/tokens) för facit-haveriets EGEN hanteringstid**
  (Del 11, från Marcus fråga till `ADR-102`s landning). Källan ger
  artefakt-räkning (antal PR:er, antal rotorsaker) men ingen sammanhållen
  tidsmätning motsvarande `T134`s tabell för de sex skivorna.
- **Ursprunget till `145.6` AC #1s tal "104 förekomster över sex filer".**
  Källan säger uttryckligen att talet "finns ingenstans utanför kortets
  egen rad" — jag har inte kunnat spåra det bakåt till någon mätning.
- **Aggregerad total kostnad (tid/tokens) för HELA arcen 2026-08-02 →
  2026-08-07.** `T134` mäter bara de sex sista skivornas landning
  (Del 10–11); ingen källa summerar hela hållplats-prototypens och
  konvergens-passens tidsåtgång från Del 2–8 i jämförbara enheter.
- **Om `session-96` bär ytterligare eventsida-relevant material utanför
  Del 9.** Jag grep:ade hela filen efter specifika sökord (se § Metod) men
  läste inte varje Del i sin helhet — en indirekt referens utan dessa
  exakta termer kan i teorin ha undgått sökningen.

## Rekommendation

**Detta är en rekommendation, inte ett beslut.**

1. **Mekanisera stale-huvudkatalog-mönstret innan nästa flerdagars-session.**
   Fyra instanser på sex dagar, tre explicit namngivna som samma fälla,
   noll mekanisering — det är den mest kostnadseffektiva luckan att stänga
   av allt som är OMAPPAT här, eftersom lösningen sannolikt är enkel (ett
   `SessionStart`-hook-villkor som jämför huvudkatalogens dok-hash mot
   senaste kända worktree-hash och varnar vid avvikelse) och frekvensen är
   hög.
2. **Bygg ett R10-liknande tillägg till `ADR-102` för facit-FRAMSTÄLLNING,
   inte bara facit-BÄRANDE.** F19 (layoutkollaps under bildstädning) är en
   nära-krasch mot facit-artefaktens egen integritet som ADR:ns nio
   rotorsaker inte täcker, eftersom de alla förutsätter att facit redan
   existerar korrekt.
3. **Utvidga R9:s formulering explicit till "varje rad/yta grillad samsyn
   kvitterat som överlevande", inte bara "åtgärds-ytan".** F29 visar att
   samma mekanism upprepade sig inom loppet av en session utan att
   räknas som samma rotorsak.
4. **Pröva om `T126`s hypotes (arbetsformens leveransväg) delar
   mekanism med stale-doc-mönstret.** Båda är instanser av "en regel
   finns skriven, men når inte fram genom en viss inträdesväg
   (`session-resume`)" — en gemensam fix kan vara billigare än två
   separata.
5. **Utred F55 (ägarlapp-furyn) som eget spår, inte som en fotnot här.**
   Denna audit hittade den bara som en bieffekt av ett bredare
   transkript-svep; den förtjänar en egen läsning av hela
   `s93-agarlapp-regelbarare`-transkriptet (592 rader) för att avgöra vad
   som brast och om det redan är åtgärdat.

## Källförteckning

- `tasks/sessions/archive/2026-08/2026-08-02-session-93.md` (Del 1–11 + paushistorik, 1 777
  rader)
- `docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md`
- `docs/research/eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`
- `docs/decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md`
- `tasks/threads/T134-agent-apparatens-genomloppstid-mot-kodens-storlek.md`
- `tasks/threads/T135-post-merge-korningen-avbryts-trots-att-filen-sager-aldrig.md`
- `tasks/lessons.d/en-rekommendation-kraver-hela-ytan-inte-bara-filen-du-oppnade.md`
- `tasks/lessons.d/facit-maste-baras-av-mekanism-inte-av-minne.md`
- `tasks/lessons.d/grillnings-substrat-kodverifieras-fore-fragorna.md`
- `tasks/lessons.d/mat-det-andringen-paverkar-inte-det-du-andrade.md`
- `tasks/lessons.d/ny-conf-fil-maste-wiras-in-i-grindens-egen-lista.md`
- `tasks/lessons.d/parkerad-pr-utan-draft-ar-oskiljbar-fran-glomd.md`
- `tasks/lessons.d/skivning-provas-mot-kodens-kopplingar-inte-mot-funktionsytan.md`
- `tasks/lessons.d/uppdragets-kallmarkning-maste-avse-gallande-text.md`
- `backlog/tasks/task-145.md` + `task-145.1`–`.6`
- `tasks/sessions/archive/2026-08/2026-08-02-session-96.md` (Del 9, grep-svept Del 1–17)
- `tasks/sessions/archive/2026-08/2026-08-07-session-100.md` (Del 1–4)
- `tasks/todo.md` (grep över kadensraderna, rad ~297–1100)
- `git log --oneline --since=2026-08-02 --until=2026-08-08 main`
- `gh pr list --state merged --search "merged:2026-08-02..2026-08-08" --limit 200`
- Claude Code-transkript (JSONL, filtrerat via Bash/Python — se § Metod),
  11 S93-bärande filer i
  `~/.claude/projects/-Users-marcus-Repon-miranon-media-admin/*.jsonl`
  (identifierade: `885b7ec8-cfaa-4079-94bc-c6a9287bd03e`,
  `8d8f13ae-7286-4b97-997c-ac34e60c385a`,
  `437c3b06-c002-48a8-9029-70aba9d01c25`,
  `892c622c-1d5e-45f5-8f86-55988b56b4a7`,
  `ac06f63e-b0d9-423e-9d9e-32f1f89a3a7b`,
  `c91a05a2-ea83-41d8-a38c-1e800b227992`,
  `b44c2e24-0d37-4ed7-863d-851ed16cd8e0`,
  `87440216-fc19-4eb0-9383-6c325dbe10a9`,
  `1b96ca38-3a65-4ec1-9af9-c82757769f39`,
  `1d537e60-d802-4418-b8cd-89b80f5b7f6b`,
  `1001ad1d-9a17-4195-9b59-8f57667d2a87`) plus
  `~/.claude/projects/-Users-marcus-Repon-miranon-media-admin--claude-worktrees-s93-resume-2/b98d62e3-08e9-48b5-a197-f43680fe1a2f.jsonl`
  och
  `~/.claude/projects/-Users-marcus-Repon-miranon-media-admin--claude-worktrees-s93-agarlapp-regelbarare/89a5c755-e006-4c0b-a520-77c87400460a.jsonl`
