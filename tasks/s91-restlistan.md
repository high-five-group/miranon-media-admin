# S91-restlistan — ordnings- och beroendekarta över allt öppnat i Session 91

> **Syfte.** Marcus order 2026-07-27: *"Allt det här ska lösas ut! […] Ha koll på
> eller skriv ner den här inventeringen så du strukturerat kan bocka av punkt för
> punkt."* Denna fil är den durabla bäraren — chatten är efemär.
>
> **Formen är en ORDNINGS- OCH BEROENDEKARTA, inte ett statusregister.**
> Kort-status ägs av backlog-CLI:t (`npx backlog task list --plain`), trådstatus
> av [`threads/README.md`](threads/README.md), landningar av git och `gh`. De
> pekas ut härifrån med sitt ID — de kopieras aldrig hit.
>
> **Det som ÄR unikt för denna fil:** ordningen · beroendena · **spår-status**
> (*"är A3 klart?"* är en aggregering ingen enskild registerpost bär) · och de
> **poster som inte är kort alls** (grenskulden, listparitets-grinden, de två
> namn-/strukturfrågorna, Eventinfo-motorn, To Do-ryggsäcken, de två
> onumrerade A2-punkterna). *(`A7:1`–`A7:2` stod här till 2026-07-29 men är
> KLARA sedan 2026-07-28 — se § Avbockningslogg.)*
>
> **Skälet till formen är empiriskt, inte principiellt.** Auditen 2026-07-28
> fann tolv statusfel i filen — **samtliga kopior av register som redan hade
> rätt svar.** Filens dåvarande inledning sade *"Kopior driftar; pekare gör det
> inte"* och bröt mot det på tolv ställen. Formen är ändrad så att felklassen
> inte kan uppstå igen.
>
> **Underhåll:** bockas av löpande i takt med landningar, i samma commit som
> arbetet där det är möjligt. Avbockade poster flyttas till § Avbockningslogg —
> **kroppen bär bara öppna `[ ]`.** Filen dör när alla spår är stängda; den är
> en arbetsyta, inte en permanent artefakt.
>
> **Senast verifierad mot disk: 2026-08-01, TJUGOANDRA resumen** —
> kontrollerna körda FÖRE uppdateringen: **kontroll 1 fällde `TASK-88`** (Done
> sedan `#558`, kvarlämnad som öppen `[ ]` i Spår E — flyttad till loggen med
> motsägelsen mot `TASK-95`:s logg-rad upplöst genom att läsa kortets eget
> final-summary), kontroll 2 ren. Fyra OKLAR-rader lästa per kontrollens egen
> instruktion — samtliga genuint öppna och rätt placerade, oförändrade sedan
> föregående pass. **Uppdragets hypotes prövad mot registret** (`npx backlog
> task list --plain`): `TASK-56` · `TASK-88` · `TASK-93` · `TASK-95` ·
> `TASK-97` · `TASK-113` är samtliga `Done`, men bara **`TASK-88`** hade en
> egen öppen kroppsrad — `TASK-56` var stale prosa i en sektion som redan
> deklarerade sig stängd (A3, rättad), `TASK-93`/`TASK-97` är nämnanden inuti
> ANDRA, fortsatt öppna poster (A2 Punkt 7 respektive A3b — lämnade orörda),
> `TASK-95` låg inuti `TASK-88`:s block och flyttade med det, och `TASK-113`
> förekommer **inte alls** i filen (ingen kroppsrad att flytta — noterat, inte
> uppfunnet). Utöver hypotesen: Spår C:s båda kroppsposter (Hub-lyftet
> `L284–L359` — redan loggat 2026-07-31 men kvarlämnat som duplicerad öppen
> rad — och Konsolideringen, `#545`) samt A2:10 (löst i `#506`) verifierades
> Done mot sessionsdoket och flyttades. Källor: sessionsdok Del 38.3
> (rad ~7442, ~7447–7449), Del 39.6 (rad ~7892–7894), rad ~7676–7678. Kontroll
> 1/2 körda EFTER uppdateringen också: kontroll 1 samma fyra OKLAR och noll
> FEL, kontroll 2 ren. Föregående pass:
> 2026-08-01, TJUGONDE resumen — kontrollerna
> körda före uppdateringen: **kontroll 1 fällde `TASK-53`** (Done i registret,
> kvarlämnad som öppen `[ ]` i kroppen — flyttad till loggen), kontroll 2 ren.
> Fyra OKLAR-rader lästa per kontrollens egen instruktion; samtliga fyra poster
> är genuint öppna och rätt placerade — Done-korten de nämner är nämnanden,
> inte bärare. `TASK-110` och `TASK-111` registrerade i § Kort födda i S91 med
> bärare i kartan (steg 4b respektive steg 7). Parallellitets-försöket AVSTÅTT
> på Codes rekommendation (Marcus-beslut 2026-08-01, sessionsdok Del 39.3) —
> det bar ingen egen kroppsrad, så inget flyttas för det. `TASK-112`
> (testgraf-kortet) registrerat med bärare i steg 6: PR `#532` stod öppen i
> kön när passet började och landade mitt under det (11:18Z) — läst mot `gh`
> före commit, inte gissat. Föregående pass:
> 2026-07-31, NITTONDE resumen — kroppens sista
> två kvarlämnade poster flyttade: `TASK-85` (A3) och `TASK-36.8` (A5), båda
> `Done` och båda verifierade mot backlog-CLI:t före flytten. **A3 och A5 har
> därmed inga öppna poster kvar.** `T87`:s parkerade AC 7–8 i `36.7` följer med
> som öppen bokföring. Elva rader tillagda i § Avbockningslogg för resumens
> landningar.
>
> **Trådregistret är kartlagt** — se
> [`threads/S91-tradkarta-2026-07-31.md`](threads/S91-tradkarta-2026-07-31.md)
> (`TASK-107`). S91-eran är `T100`–`T109`, härledd ur två oberoende källor och
> **inte** ur den numeriska gräns orkestreraren gissade. Noll trådar är
> stängbara; `T87` är kartans nav och väntar på Marcus trigger.
>
> Föregående pass samma dag: `TASK-100` — **kontroll 1 lagad
> efter att ha gett två falska statuspåståenden**, `TASK-52` och `TASK-95`; se
> § Filens egna fel post 9. Lagningen avtäckte en tredje defekt: två ÄKTA fel
> (`TASK-36.8`, `TASK-85`) var osynliga för formen, tredje gången samma klass.
> Kroppen städad — `TASK-86`, `TASK-87` och `TASK-89` flyttade till
> § Avbockningslogg med sitt sakinnehåll, `TASK-88` står kvar öppen med AC #2
> obockad. **Kontroll 2 körd, ren.** Föregående pass: 2026-07-30 (SJUTTONDE resumen — `A2:7`
> DELAD på Marcus beslut och båda halvorna besvarade · `A2:8` KLAR (grind +
> `ADR-083` + hub-raderna) · `TASK-36.8` stängd, backlog-grinden RENT för första
> gången (169 kort, 0 inkonsistenta) · `A2:11` avgjord av en mätning som legat
> oläst i två dygn · harness-genomgången rättade sex poster mot Anthropics
> dokumentation, varav Del 29.3:s tak-påstående. **Kontrollerna 1 och 2 körda,
> båda rena.** Föregående pass: 2026-07-29 (sextonde resumen, FJÄRDE passet —
> **de fem bärarlösa posterna placerade** på Marcus delegering: `TASK-83` + `T107`
> i steg 4b, `TASK-84` + `T108` + `T109` i steg 5; skälen i noten under kartan.
> `T109` saknades helt i § Kort födda i S91 och är tillagd. **Kontroll 2 utökad
> till att räkna trådar** — den var blind för `T107`/`T108`/`T109`, alltså tre av
> de fem poster den skulle ha fångat. Trefaldigt bevisad: ren när allt är
> placerat, fäller när ett KORT tas ur kartan, fäller när en TRÅD tas ur den.
> Trådregistrets tabell lagad: `T74`/`T73` och `T79`/`T78` stod i omkastad
> ordning. TREDJE passet —
> **kontroll 2 byggd och tvåsidigt bevisad** efter att ha stått som en kommentar
> utan kod sedan kartan skrevs; loggens tabell lagad — den var splittrad i SJU
> fragment av tabellbrytande tomrader, och endast det första hade rubrikrad;
> `Spår E ×4` rättad till `×3` [grenskulden bockades av och flyttades till loggen
> utan att räkningen följde med]. Samtliga övriga räkningar omprövade och
> korrekta: `A3 ×1` · `A3b ×2` · `Spår C ×2`. Noll döda kort- eller
> trådreferenser. Föregående pass: femtonde resumen, ANDRA passet — kroppen
> rensad efter åtta kort-stängningar och grenstädningen; kontroll 1 LAGAD efter
> att den visat sig ha en blind fläck, och två inaktuella A7-rader rättade som
> den blinda fläcken dolt).
> **Uppdatera raden vid varje verifieringspass.**
>
> **Kontrollen som ska köras före varje uppdatering av denna fil** — den tar
> sekunder och ersätter ett auditpass:
>
> ```bash
> # 1. Done-kort som ligger kvar i kroppen.
> #
> # Registret läses EN gång — inte ett npx-anrop per kort (den gamla formen
> # timade ut på två minuter när kortmängden vuxit).
> #
> # ID:t måste stå i radens LEDANDE position. Utan den förankringen drar grepen
> # in varje ID som bara NÄMNS i en ANNAN posts titel: raden
> # "TASK-89 - … orsakskedja mot TASK-52 …" bokförde `TASK-52` som Done, fast
> # den står i To Do. Mätt 2026-07-31: 137 ID:n mot 136, och hela skillnaden var
> # det falska. Se § Filens egna fel post 9.
> DONE=$(npx backlog task list --plain \
>   | awk '/^Done:/{f=1;next} /^[A-Za-z ]+:$/{f=0} f' \
>   | grep -oE '^ +(\[[A-Z]+\] )?TASK-[0-9.]+' \
>   | grep -oE 'TASK-[0-9.]+' | sort -u)
>
> # FAIL-CLOSED. Byter CLI:t utdataformat blir DONE tom, och en tom lista matchar
> # ingenting — kontrollen hade då rapporterat RENT på en trasig avläsning.
> # Mätt: den gamla formen gör precis det, tyst och med exit 0.
> #
> # Raden börjar med FEL: med flit. Utfallet läses genom att man letar efter
> # "FEL:" — en avbrytsrad under ett eget nyckelord hade varit osynlig för precis
> # den läsningen, alltså tyst grön en gång till. Inget `exit` här: blocket
> # klistras ibland rakt in i ett skal, och `exit` stänger då terminalen.
> if [ -z "$DONE" ]; then
>   echo "FEL (AVBRYT): DONE-listan är tom — 'task list --plain' har bytt format; kontrollen kan inte avgöra någonting"
> else
>
> # Kroppen = allt före Avbockningsloggen. Flerradiga block slås ihop till en rad,
> # annars ses bara första raden av en post som sträcker sig över flera.
> # `@@R1@@` märker ut var rad 1 slutar — bäraren står där, nämnandena i svansen.
> awk '/^## Avbockningslogg/{exit} {print}' tasks/s91-restlistan.md | awk '
>   /^- \[[ x]\]/ { if (b != "") print b; b = $0 "@@R1@@"; next }
>   /^ +/         { if (b != "") b = b " " $0; next }
>                 { if (b != "") print b; b = "" }
>   END           { if (b != "") print b }
> ' | while IFS= read -r block; do
>   rad1=${block%%@@R1@@*}
>   hela=${block/@@R1@@/}
>
>   # ETT block har EN bärare — inte varje ID i det. Det var defekt B: Spår E:s
>   # ZZ-GRANSKNING-post bärs av **`TASK-88`** (öppen) men nämner **`TASK-95`**
>   # i sin brödtext, och den gamla formen fällde blocket på nämnandet.
>   # Grenarna är fallande, och var och en har en verklig radklass i filen:
>   #  (a) fet kod-span på rad 1  — **`TASK-53`** — …   ·   (**`TASK-88`**, …)
>   #  (b) ledande kod-span rad 1 — `TASK-36.8` — …     ·   `T87` — …
>   #  (c) fet kod-span sist      — A7-klassen: … → **`TASK-70.7`**
>   barare=$(printf '%s' "$rad1" | grep -oE '\*\*`(TASK-[0-9.]+|T[0-9]+)`' \
>              | grep -oE '(TASK-[0-9.]+|T[0-9]+)' | head -1)
>   [ -z "$barare" ] && barare=$(printf '%s' "$rad1" \
>              | grep -oE '^- \[[ x]\] `(TASK-[0-9.]+|T[0-9]+)`' \
>              | grep -oE '(TASK-[0-9.]+|T[0-9]+)')
>   [ -z "$barare" ] && barare=$(printf '%s' "$hela" \
>              | grep -oE '\*\*`(TASK-[0-9.]+|T[0-9]+)`' \
>              | grep -oE '(TASK-[0-9.]+|T[0-9]+)' | tail -1)
>
>   if [ -n "$barare" ]; then
>     printf '%s\n' "$DONE" | grep -qx "$barare" || continue
>     case "$block" in
>       '- [ ]'*) echo "FEL: $barare är Done men står som öppen [ ] i kroppen" ;;
>       '- [x]'*) echo "FEL: $barare är Done och avbockad men ligger kvar i kroppen — flytta till loggen" ;;
>     esac
>   else
>     # RÄCKVIDDEN REDOVISAS, DEN DÖLJS INTE. En bärare som står i fet span utan
>     # asterisk intill backticken — A3-postens "**kortad som `TASK-85`**" — är
>     # syntaktiskt IDENTISK med ett rent nämnande i samma form: posten "Två
>     # namn-/strukturfrågor ur `TASK-59.8`:s QA-vandring" säger uttryckligen att
>     # inget kort bär den. Ingen regex kan skilja dem, så kontrollen gissar inte
>     # — den ber om en mänsklig blick. Post 8:s lärdom, kodad: en radklass som
>     # tyst inte täcks är farligare än ingen kontroll alls.
>     for id in $(printf '%s' "$hela" | grep -oE '(TASK-[0-9.]+|T[0-9]+)' | sort -u); do
>       printf '%s\n' "$DONE" | grep -qx "$id" \
>         && echo "OKLAR: \"$(printf '%s' "$rad1" | cut -c7-50)\" saknar entydig bärare men nämner Done-kortet $id — läs posten"
>     done
>   fi
> done
>
> fi
> # 2. Har varje öppet kort en bärare i kartans nio steg?
> #
> # Stod som EN KOMMENTAR UTAN KOD från 2026-07-28 till 2026-07-29 — och under
> # tiden driftade precis den klass den var skriven för: TASK-83 och TASK-84
> # mintades 2026-07-29, registrerades i § Kort födda i S91 och kom aldrig in i
> # sekvensen. En deklarerad kontroll som inte kan köra är frånvarande.
> #
> # YTAN ÄR § "Kort födda i S91", inte hela registret. Ryggsäcken (TASK-20…47)
> # nämns aldrig individuellt — den bärs KOLLEKTIVT av Spår D:s post
> # "To Do-ryggsäcken i backlog", och den posten ÄR bäraren.
> #
> # INGEN `for id in $LISTA` — zsh word-splittar inte oquoterade expansioner, så
> # loopen kör ETT varv med hela listan som en sträng och kontrollen blir TYST
> # GRÖN. Fällan bet tre gånger under S91 (Del 25.11 punkt 3, samt denna
> # kontrolls första utkast). `while IFS= read -r` kör i båda skalen.
> #
> # TRÅDAR RÄKNAS MED. Sektionen bär både kort och trådar ("(tråd, ej kort)"),
> # och trådarna driftar likadant — T107/T108/T109 var alla bärarlösa 2026-07-29.
> # Kartan bär redan trådar i steg 6 (T85, T87), så formen är etablerad.
> # En tråd är aldrig "Done" i kort-registret; DONE-filtret nedan träffar den
> # därför aldrig, vilket är rätt — trådens stängning bor i threads/README.md.
> MONSTER='\*\*`(TASK-[0-9.]+|T[0-9]+)`'
> FODDA=$(awk '/^## Kort födda i S91/{f=1;next} /^## /{f=0} f' tasks/s91-restlistan.md \
>   | grep -oE "${MONSTER}" | grep -oE '(TASK-[0-9.]+|T[0-9]+)' | sort -u)
> KARTAN=$(sed -n '/^| # | Steg | Bärare | Pekare |/,/^$/p' tasks/s91-restlistan.md \
>   | grep -oE '(TASK-[0-9.]+|T[0-9]+)' | sort -u)
>
> comm -23 <(printf '%s\n' "${FODDA}") <(printf '%s\n' "${KARTAN}") | grep -v '^$' \
>   | while IFS= read -r id; do
>       printf '%s\n' "${DONE}" | grep -qx "${id}" \
>         || echo "FEL: ${id} är öppet, står i § Kort födda i S91, men saknar steg i kartan"
>     done
> ```
>
> **Formen är tvåsidigt bevisad, inte antagen** (femtonde resumen): mot filen som
> den låg vid `02a9517` gav den tre FEL — `TASK-70.1`, `TASK-70.3` och `TASK-70.4`
> — mot noll för den gamla formen; mot den rättade filen ger den tomt. `70.4` är
> det talande fallet: den stod `- [x]` **i kroppen** i strid med filens egen regel
> att kroppen bara bär öppna poster, och varken den gamla kontrollen eller någon
> läsare hade fångat det.
>
> **Bärar-formen ovan är prövad om 2026-07-31** (`TASK-100`), efter att den
> föregående gett två falska statuspåståenden. Beviset går åt båda håll:
> **noll** falska positiva på `TASK-52` och `TASK-95` mot dagens fil, och
> **fortsatt fällning** — fyra äkta FEL, varav `TASK-36.8` var osynligt för den
> gamla formen. Varje bärar-gren är dessutom mutationsprövad var för sig: ett
> `Done`-kort planterat som bärare i (a) fet kod-span på rad 1, (b) ledande
> kod-span och (c) fet kod-span sist i blocket ger FEL i samtliga tre.
> Identiskt utfall i `bash` och `zsh`.
>
> **Vid konflikt vinner registret, inte denna fil.**

## Beslutade premisser — ändra inte utan Marcus

Dessa styr alla prioriteringar nedan och är fattade 2026-07-27:

1. **Fas 6 stängs INTE.** Appens sidor är inte byggda som Marcus vill ha dem.
2. **Alla fem facit-lösa ytor ska genom samma kedja** som eventsidan fick
   (prototyp → Marcus väljer → facit → PRD → skivor): Personer · Hem ·
   Mer/Intresserade/Maillogg · Segment · Mail-handling.
3. **CI-/grind-arkitekturen görs klar FÖRE app-arbetet och hållplatsfrågan.**
4. **Fas E (Supabase) kommer efter att alla sidor är klara.** Två veckor är
   **önskan, inte deadline** — *"får bli som det blir"*.
5. **90/10-kravet:** CI-arkitekturen ska vara 110 % toppdesignad med väl
   underbyggda Airtable-anpassningar, men **~90 % ska överleva Supabase-bytet**
   oförändrat och lika förstklassigt. Vid övergången ska resultatet vara i
   absolut topp senior frontier-klass.
6. **Airtable-basen bevisas av att appen byggs färdig** — det är ADR-063:s egen
   logik (kontext punkt 3). Därför kan AT-Max inte dekomponeras meningsfullt
   förrän sidorna är klara: milstolpens kravspec *är* defekt-registret.

**Konsekvens av premiss 4 + 5 som måste bäras in i grillningen:** S91:s
grillningsbeslut vilade på att migreringen skulle städa upp de icke-hermetiska
testerna inom två veckor (sessionsdok Del 7 § Grillningens läge, rad 1098 +
**1105** — rättat 2026-07-29: rad 1098 bär "migreringen", tvåveckorspremissen
bor på rad 1105).
Den premissen gäller inte längre, och 90/10-kravet fanns inte när grillningen
kördes. Snittet ska därför **omprövas**, inte kvitteras.

## VAR VI ÄR — vägen till nytt arbetssätt och tillbaka till appen

**Denna sektion äger ORDNINGEN och ingenting annat.** Varje rad bär steg, ID och
pekare — aldrig beskrivning, aldrig status. Detaljen bor i spåren nedan; status
i registren (backlog-CLI:t, `threads/README.md`, git). **Säger en rad här något
som en annan sektion också säger är raden fel, inte den andra.** Regeln finns
för att raderna annars driftar — det var precis felet auditen 2026-07-28 rättade
på tolv ställen.

Kartan skrevs 2026-07-28 på Marcus fråga *"måla ut hela vägen fram till att vi
kan börja jobba med appen igen"*. Den ersätter den tidigare ordningsraden, som
bara täckte Spår A. **Skälet att den behövdes:** hela filen lästes samma dag och
en väg byggdes ändå som tappade tre poster (`TASK-36.8`, Spår B, A2:9). Spåren är
tematiska; sekvensen över spårgränserna fanns ingenstans.

| # | Steg | Bärare | Pekare |
|---|---|---|---|
| **1** | Signalen går att lita på | `TASK-72` · `TASK-79` · `TASK-80` · `TASK-81` · `TASK-36.8` | § Fynd-kedjans ordning · § A5 · § Kort födda i S91 |
| **2** | Skyddsnätet byggs | `TASK-70.2` · `TASK-70.5` | § A7 (A7:4, A7:7) |
| **3** | Flytten och kön — väntetiden faller | `TASK-75` · `TASK-76` · `TASK-78` | § A7 (A7:10) · § Kort födda i S91 |
| **4** | Landnings-hygien | `TASK-70.6` | § A7 (A7:8) |
| **4b** | Verktygsskulden | A3 ×1 · A3b ×1 · A2:9 · `TASK-83` · `T107` · `TASK-110` | § A3 · § A3b · § A2 · § Kort födda i S91 |
| **5** | Aktörerna slutar krocka | A2:7 · A2:8 · A2:11 · `TASK-77` · `TASK-84` · `T108` · `T109` · Spår B | § A2 · § Spår B · § Kort födda i S91 |
| **6** | Kvar utanför räckhåll | `T85` våg 3 · `T87` · `TASK-70.7` · `TASK-112` | § A6 · § A7 (A7:9) · § Kort födda i S91 |
| **6b** | Skulden betalas | A2:10 → Spår C ×2 · Spår E ×1 | § Spår C · § Spår E · § A2 |
| **7** | Appen | `TASK-53` · `TASK-56` · `TASK-111` · hållplats-grillningen · `TASK-18.20` · de tre app-besluten · resten | § Spår D · § Kort födda i S91 · § Beslut |

**Invarianter i ordningen** (allt annat är schemaläggning): steg 1 före 2–3, för
att en flaky svit gör post-merge-larmen otrovärdiga · A7:4 före A7:5–6, kodad som
dep · **A2:10 före Spår C:s konsolidering**, kortet säger det självt ·
`TASK-64` och `TASK-63` tas under egen hand respektive med pilot, se korten.

**SCHEMALÄGGNING, inte invariant — `TASK-70.1` efter `TASK-70.3`.** Raden stod
till 2026-07-29 under Invarianter. Den flyttades hit av auditen samma dag:
kortet har **inga deps** och säger uttryckligen *"kan tas när som helst"*, så att
kalla ordningen invariant är att påstå en bindning registret inte bär — och
rad 31 säger att registret vinner. Skälet är starkt men är ett val: efter `70.3`
är mutex-dubbleringen avväpnad utan en rad villkorings-kod, och `70.1` är det
enda kortet i spåret som tar bort ett *mänskligt* seriellt moment i stället för
maskintid. Marcus flyttade kortet till steg 3 den 2026-07-29; skälen i sin helhet
bor i **`TASK-70.1`** och i sessionsdok S91 **Del 21.5**.

**PLACERINGEN AV DE FEM BÄRARLÖSA POSTERNA** (2026-07-29, Marcus-delegerad:
*"Vi kan ju inte ha massa saker utan plats"*). De föll i två familjer, och
familjen — inte födelsedatumet — avgjorde steget:

- **Steg 4b, verktygsförsörjning:** `TASK-83` (`shellcheck`/`actionlint` hämtas
  med `curl` utan `--retry` i den grind som ALDRIG skippas — exit 35 mätt i
  `#430`, `sha256sum` hann aldrig köra, så det är nätverk och inte
  leverantörskedja) och `T107` (backlog-CLI:t odeklarerat förkrav). Båda är
  samma sak: **ett verktyg vars tillgänglighet inte är säkrad.** De hör ihop
  med A3:s listparitets-grind och A3b:s verktygsvals-krav.
- **Steg 5, aktörs-koordinering:** `TASK-84` (tre lokala staging-vägar går förbi
  `TASK-77`:s preflight — och `TASK-77` bor redan i detta steg, så kortet är
  dess otäckta yta), `T108` (notifieringar som aldrig kommer) och `T109` (två
  aktörer i samma sessionsdok). Alla tre är **samma fråga ur olika håll: vad
  händer när mer än en aktör rör samma yta.** De hör ihop med A2:7:s
  partitionerings-regel, som `T109` uttryckligen anger som släkting.

`TASK-83` övervägdes för steg 1, eftersom ett falskt rött i en alltid-på grind
gör signalen otrovärdig. Det förkastades: steg 1 är flake-karaktäriseringen av
SVITEN, och dess invariant handlar om att post-merge-larm ska betyda något. En
opålitlig verktygsnedladdning är verktygsskuld, inte svit-flakighet — att lägga
den i steg 1 hade suddat ut vad steget mäter.

**Steg 6 stängs inte av denna lista.** `T85` våg 3 väntar på Fas E, `T87` på
Marcus trigger, `TASK-70.7` kan stängas av sitt eget steg 0, `TASK-112` på
S91:s slut (Marcus-beslut, sessionsdok Del 39.3 punkt 5). De står kvar som
öppna för att en tom lista köpt genom förkastande vore en genväg, inte ett mål.

**Steg 7 är inte hårt blockerat av steg 1–6.** Ordningen är en prioritering:
app-arbetet fungerar redan, det är bara dyrt (7,4 min per kod-PR) och signalen
går inte att lita på. Vi gör verktyget vasst innan vi använder det hårt.

**STEG 2–4 OCH STEG 5 ÄR TVÅ HALVOR AV SAMMA MÅL — och A7 ensamt stänger det
inte.** Konsoliderat 2026-07-28 på Marcus fråga *"när vi har genomfört alla
A7-punkter, kan vi jobba parallellt med subagenter utan att CI/grindvakterna
stoppar oss?"* Svaret är **delvis**: A7 tar bort väntan på MASKINEN, A2:7
krockarna mellan AKTÖRERNA. Målbilden — *människan väntar aldrig sysslolös* —
kräver båda. **Vad som bevisligen står kvar efter A7, och vad punkterna 8 och 9
faktiskt bär, står i § A2 punkt 7–9. Räkna inte axlarna härifrån.**

> **Bantad 2026-07-29 av auditen.** Sektionen bar ~48 rader sakargumentation som
> duplicerade § A2, § A3, § A5 och ADR-080 — och **två av auditens sakfel satt
> just i den duplicerade prosan**: en felräkning av A2:7:s axlar (två olika
> femtal, inget belagt) och ett påstående att den seriella granskningen är
> "punkt 9", när punkt 9 är push-kadensens hemvist och granskningen bärs internt
> av punkt 8. Regeln på rad 65–66 blev därmed empiriskt bekräftad en gång till.
> Argumenten är inte borttagna — de bor i sina sektioner, som raderna nedan
> pekar på:
>
> - **Varför A3 var kritiska vägen** (projektionen 3,8 mot utfallet 1,49, och
>   varför avvikelsen inte bortförklaras) → § A3 och
>   [mätningen](../docs/research/acceptance-utbrytningens-utfall-2026-07-28.md)
> - **Varför `TASK-57`/`TASK-58` sköts in före A5** → § A5 · § Avbockningslogg
> - **Ärlighet om A5:s natur** — hermetisk utbrytning är inte branschens
>   förstahandsval utan en dokumenterad Airtable-kompromiss →
>   [ADR-080](../docs/decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md)
>   § Ärlighet om underlaget
> - **Varför A2:7 medvetet ligger sist** → § A2 punkt 7

## Spår A — CI-/grind-arkitekturen (AKTIVT)

### A1 · Grillningen — AVSLUTAD 2026-07-27 (ADR-080)

Marcus delegerade de fem besluten i klump: *"Du har all kontext samt målbild
från mig för att kunna ta rätt beslut. Kör på det du rekommenderar."* Besluten
är därmed Codes, fattade på delegering — öppet bokfört i ADR-080:s ingress, som
också bär alla fem i sin § Beslut. **Inga öppna poster.**

### A2 · Mekaniseringen (sessionsdok Del 4)

> **Numreringsnot 2026-07-29:** de två första punkterna stod onumrerade medan de
> tre sista hette "Punkt 7/8/9". Kartan pekar per nummer, så det som saknade
> nummer kunde inte bäras — auditen fann att båda saknade bärare i § VAR VI ÄR.
> De har därför fått **A2:10** och **A2:11** (nästa lediga; de behåller sin plats
> i listan — numret är en adress, inte en ordning).

**A2:10 löst i `#506`** (nittonde resumen, 2026-07-31) — `lessons-hub-sync`-
skillen (hub) bär nu konsolideringssteget och plugin-bumpen är landad. Flyttad
till § Avbockningslogg 2026-08-01; se den raden för källan
(sessionsdok Del 38, "Fragment: 70"-noten).

**A2:11 STÄNGD 2026-08-02 på Marcus kvittens (beslutsbordet punkt 3) — mot den
bokförda slutsatsen:** steg 1 räckte (`bygg-agent` 16/16 · `research-pass` 8/8;
allt läckage i inbyggda, övervägande läsande typer), steg 3/4 är fel hävstång
och byggs INTE (över-engineering-vakten). Scratchpad-kollisionen är ortogonal
mot worktree-isolering och bärs av lesson-fragmentet
`parallella-agenter-delar-scratchpad-namnrymd` + konventionen i `bygg-agent.md`;
kortas vid behov. Flyttad till § Avbockningslogg; fullt underlag: sessionsdok
Del 32.4 + `docs/research/harness-namnrymd-agenter-2026-07-30.md`.
**A2:7 (Punkt 7) STÄNGD 2026-08-02 på Marcus kvittens (beslutsbordet punkt 3).**
Båda halvorna hade svar sedan 2026-07-30: *nummerhalvan* `TASK-93` →
`check_active_branches: true` i drift, dokumenterad i spoke-`CLAUDE.md`
§ Kortnummer; *filnamnshalvan* framkallad, avgränsad och landad som
**deklarerad konvention** i `bygg-agent.md` (ordentlig mekanism finns bara för
Bash-lösa agenttyper — inte våra). Residualerna är dokumenterade väggar med
egna bärare, inte olösta frågor: delade statusfiler + läsande agenter
(fragmentet `partition-maste-omfatta-lasande-agenter`, `T108`/`T109`) ·
staging-basen, `P4`-taket och acceptance-porten (Fas E-frågor via `T85` våg 3).
Kortas vid behov, byggs inte nu (över-engineering-vakten). Flyttad till
§ Avbockningslogg; fullt underlag: sessionsdok Del 32 +
`docs/research/harness-namnrymd-agenter-2026-07-30.md`.
**A2:8 (Punkt 8) — VAR REDAN AVGJORD 2026-07-29; kroppsraden var drift, bruten
2026-08-02.** Grillningens A2:8-halva stängdes i sessionsdok Del 28:
**default-neka mot en uppräknad LISTA**, inte mot en genererande princip
(`ready-for-agent`-etiketten ÄR det namngivna upplåsandet) · vid låst beslut:
**defera och fortsätt, med informationsplikt som villkor** (subagenter kan
strukturellt inte avbryta; ett tyst mellanläge saknar stöd) · ADR-083 + tionde
kontrollen i `check:docs` vaktar prosa-som-påstår-mekanism. § Avbockningslogg
bokförde KLAR 2026-07-30 — men denna checkbox bröts aldrig, och posten
återuppstod därför som beslutsbords-punkt 4 (tjugoandra pausen) tills Marcus
kände igen att beslutet redan fanns. Status bor i EN yta; kroppen bär nu
pekare, inte tillstånd (fragmentet
`stangning-i-en-yta-utan-att-bryta-den-andra`). Seed-vane-residualen
(förberett granskningsmaterial) bärs av review-kadensens stående order
(`T86`, 2026-08-02).

**A2:9 (Punkt 9) STÄNGD 2026-08-02 — domen har hemvist.** Kort `TASK-122`
mintat när posten plockades (postens egen regel); domen + separationen
(commit-frekvens gratis, push-frekvens kostar en full CI-körning plus en
plats i staging-mutexen) inskriven i `CONTRIBUTING.md` § Push-kadensen med
källpekare till
[passet](../docs/research/push-kadens-agent-arbetstrad-2026-07-26.md).
Kortet stängs i stängningsbatchen efter merge_group-verifikat. Flyttad till
§ Avbockningslogg.

### A3 · Verktygs-åtgärderna

> **Historiken, förtydligad på Marcus fråga 2026-07-27.** Den ursprungliga
> ordern var *"behåll men INAKTIVERA det byggda, bygg om som proffsen"* — fyra
> egenbyggen där mogna verktyg fanns. **Verktygs-passet rev premissen**, och
> Marcus korrigerade scopet efter belägget: domarna blev BYT · BEHÅLL · BEHÅLL ·
> BEHÅLL-verktyget-LAGA-bristen, med passets egen slutsats ordagrant *"Endast
> punkt 1 är ett äkta försummat verktygsval."* Tabellen och varje doms motivering:
> [verktygsval-fyra-egenbyggen-2026-07-27.md](../docs/research/verktygsval-fyra-egenbyggen-2026-07-27.md)
> § Beslutstabell + § Behåll ändå.

**A3 har inga öppna poster.** Listparitets-grinden (`TASK-85`) landade 2026-07-30
och är flyttad till § Avbockningslogg 2026-07-31 — den stod kvar i kroppen som
`- [ ]` i ett dygn, osynlig för kontroll 1 eftersom dess form
(`**kortad som \`TASK-85\`**`) inte matchade bärar-mönstret. Det var den tredje
instansen av § Filens egna fel post 8:s klass, och den är bokförd som post 9.

*(De två BEHÅLL-posterna landade 2026-07-29 och är flyttade till
§ Avbockningslogg. De stod kvar som `[x]` i kroppen ett par timmar, vilket bryter
underhållsregeln i ingressen — fångat av samma audit.)*

**A3:s MSW-punkt är stängd** — alla tre skivorna `TASK-54.1`–`54.3` är Done.
*(PRD-kortet `TASK-54` står kvar som `To Do` tills familjen bokförs, precis som
`TASK-59`; status läses ur backlog. Förbehållet tillagt 2026-07-29 — posten sade
tidigare "stängd" platt, vilket motsades av registret.)* Svansen är också stängd:
WebSocket-vägen skyddades av **`TASK-56`** (Done, § Avbockningslogg 2026-07-29
· `#439`/`#442`) — vakten fäller nu med adressen namngiven. *(Rättat
2026-08-01: raden påstod tidigare att svansen var öppen och "indexerad under
§ Kort födda i S91" — TASK-56 har aldrig stått där; kortet lever bara som
denna prosareferens.)*

### A3b · Verktygsvals-prövningen som STÅENDE krav (ny 2026-07-27)

Marcus fråga avtäckte att kravet inte var inskrivet någonstans som återkommande
— bara som en engångs-order mot fyra namngivna egenbyggen.

**A3b STÄNGD 2026-08-02:** kravet inskrivet i `CONTRIBUTING.md` § Verktygsval
före nybygge (spoke-hemvist valdes — kravet är formulerat mot repots egna
byggen; hub-lyft prövas vid hub-sync om klassen visar sig universell).
Flyttad till § Avbockningslogg.

**Svansen var redan landad när posten plockades (verifierat mot ADR-texten
2026-08-02):** ADR-081 bär sedan 2026-07-30 (`TASK-86`) § *"Verktygsvalet:
towncrier som VERKTYG — retroaktiv redovisning"* med exakt de tre skälen,
öppet klassade som resonemang, plus den senare empiriska bekräftelsen
(nummerallokerings-passet § Fynd 1b). Denna kropps-text fortsatte ändå påstå
att redovisningen saknades — samma driftklass som `A2:8`-raden (fragmentet
`stangning-i-en-yta-utan-att-bryta-den-andra`), andra instansen samma dag.

### A4 · Grindarnas form

**Länkgrinden är delad och verkställd** ([ADR-082](../docs/decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md),
PR `#324`). Formen, de nio branschprojekten, de tre empiriska instanserna och de
tre fynden utöver frågan bor i ADR:n och i
[länkgrinds-doket](../docs/research/lankgrindens-form-2026-07-28.md).

**Merge queue-aktiveringen är A7:3** (`TASK-70.1`) — posten står där, inte här.
Villkoret som föddes i A4 följer med: **lager 1 upphävt 2026-07-27, lager 2 står
— aktivera ej före mätning av `concurrency` × `merge_group`.**

### A5 · Efter grillningen

**A5 har inga öppna poster.** `TASK-36.8` (QA-vandringen) stängdes 2026-07-30 och
är flyttad till § Avbockningslogg 2026-07-31. **`T87`:s parkerade AC 7–8 i `36.7`
följer med som öppen bokföring** — de är inte dolda av vare sig stängningen eller
flytten, och `T87` bär dem vidare.

Acceptance-klassens arton filer, kontraktsvakten och hermetik-självtestet är
landade (`TASK-59`-familjen + `TASK-60`); utfallet med alla siffror står i
[mätningen](../docs/research/acceptance-utbrytningens-utfall-2026-07-28.md).
PRD-kortet `TASK-59` stängs när familjen bokförs — status läses ur backlog.

### A6 · Schemalagt till AT-Max (ADR-063 S81-not) — rör ej nu

- [ ] `T85` våg 3 — staging-per-run-isolering. **Taket för allt annat.**
- [ ] `T87` — visual-grindens aktivering. **Blockeraren är BORTA sedan
      `TASK-55`** (baselines regenererade, granskade, mergade). **Triggern står
      dock kvar** — Marcus-beslut A från S81 flyttas inte av att ett hinder
      försvinner; grinden aktiveras när UI-takten lugnar sig. Distinktionen är
      inskriven i trådens egen post

### A7 · Arbetsflödes-gapet — NYTT 2026-07-28, ur granskningen

Marcus beställde en evidensbaserad granskning av hela agent-/Git-/CI-flödet mot
en målbild för hur starka team arbetar. Fullt utfall:
[granskningen](../docs/research/arbetsflode-granskning-2026-07-28.md).

**Domen var DELVIS — och det som gör posten nödvändig är dess andra hälft:
restlistan som den såg ut FÖRE denna post stängde INTE gapet.** Merge queue låg
som ett obeslutat beslut, "flytta staging ur den kritiska vägen" fanns inte alls,
och den enda staging-posten (`T85` våg 3) är delvis falsifierad — mutexen går
inte att avveckla med per-run-isolering, eftersom `P4`:s 5 req/s-tak är delat per
bas. Posterna nedan är därför NYA, inte omskrivningar av befintliga.

**Kärnan i gapet:** integrationsläget och verifieringsläget är hoptryckta till en
enda obligatorisk PR-grind. Mätt kritisk väg för en kod-PR är **7,4 min**, varav
`Staging (API + E2E)` ensamt bär **375 s** plus mutexkö — det är kodvägen som
bär allt; docs-klassningen fungerar redan.

**Mintat 2026-07-28:** PRD `TASK-70`, med en skiva per post A7:3–A7:8
(`TASK-70.1`–`TASK-70.6`). **Familjens fulla omfattning räknas i backlog, inte
här** — den har redan växt utöver de sex. **A7:1 och A7:2 mintades medvetet
inte** — de togs utan kort och är klara (§ Avbockningslogg). Korten bär kraven;
posterna nedan står kvar som index.

**Stängda A7-poster och var de bokförts** (kroppen bär bara öppna, per filens
underhållsregel) — samtliga har en rad i § Avbockningslogg, kort-nycklad:
`A7:1` · `A7:2` (båda utan kort) · `A7:3` (`TASK-70.1`) · `A7:4` (`TASK-70.2`) ·
`A7:5` (`TASK-70.3`) · `A7:6` (`TASK-70.4`) · `A7:7` (`TASK-70.5`) ·
`A7:8` (`TASK-70.6`) · `A7:10` (`TASK-75`).
**Kvar öppna nedan: `A7:9`.**

**ORDNINGEN ÄR EN INVARIANT, INTE EN PREFERENS:** **A7:4** (post-merge-lagret) är
förkrav för **A7:5–A7:6**. Flyttas staging ur grinden innan lagret finns tas en
kontroll bort utan att ersättas — precis det målbilden varnar för
(*"eliten tar inte bort kontrollen — de tar bort väntan"*).

> **Rättat 2026-07-29.** Stycket skrev *"steg 4 … steg 5–6"* och avsåg A7:s egen
> numrering, men efter att kartans steg omnumrerades samma dag fanns en andra
> giltig läsning där påståendet är **falskt**: kartans steg 4 är
> landnings-hygien (`TASK-70.6`), som inte är förkrav för någonting. Detta är
> ett tredje stycke av samma klass som § Filens egna fel post 6 bokför — och det
> uppstod av omnumreringen, alltså efter att posten skrevs. Prefixet `A7:` är nu
> explicit så att kollisionen inte kan återuppstå.

**A7:9 BRUTEN SOM RESTLISTE-POST 2026-08-02 (session-end):** posten bärs i
sin helhet av kortet **`TASK-70.7`** (steg 0 prövar nyttan mot faktiska
blockeringar — är svaret noll stängs kortet; exekvering efter S91). Raden var
kortets dubblett; historiken (F2-glidningen, Marcus-fångsten 2026-07-28) står
kvar i kortet + Del-narrativet.

**`TASK-70.1` bär TVÅ skäl till `ready-for-human` — etikett-förslaget adresserade
bara det ena.** Fångat 2026-07-28 vid genomläsning av kortet i sin helhet.
**Skäl 1** (AC 6 kräver två samtidigt armerade PR:er, vilket ingen bygg-agent får
göra) faller med noteringen att **orkestreraren** utför. **Skäl 2 rör inte
armering alls och står kvar:** saknas `merge_group`-triggern kan ingen PR landa —
inklusive fixen — så spärren ska sättas av den som kan ta bort den igen utan att
först behöva landa något. **Etiketten ändrad till `ready-for-agent` 2026-07-28**
per Marcus muntliga kvittens i elfte resumen, med skäl 2 bevarat i kortets plan
som utförande-villkor (revert-vägen klar FÖRE aktivering). Precedenten är
`TASK-64`: `ready-for-agent` betyder *kräver inte Marcus omdöme* — inte *ska
spawnas som skiva*.

**Granskningens tredje förbättring, `F3`, är RIVEN — ingen post.**
`allow_update_branch: false` såg inkonsistent ut mot flödets bruk av
`gh pr update-branch`, men fältet reglerar bara uppdatering *"even if it is not
required to be up to date before merging"* och vårt ruleset har `strict` — så det
gäller inte oss. Empiriskt kördes kommandot tre gånger 2026-07-28 med
inställningen `false`, samtliga lyckades. Rivningen är bokförd i
[granskningen](../docs/research/arbetsflode-granskning-2026-07-28.md) § Förbättringar.

**MUTEXEN SERIALISERAR — och kostnaden växer med antalet parallella PR:er.**
Marcus gjorde observationen medan PR `#386` låg i kön; de två körningarna nedan
tillhör dock **andra** grenar (`fix/task-72-…` respektive `test/task-63-…`), inte
`#386` — attributionen rättad 2026-07-29. Siffrorna är oförändrade och
verifierade mot jobb-API:t. Två fulla körningar med identiskt svit-innehåll:

| Körning | Acceptance | Staging | Total |
|---|---|---|---|
| `30400021534` | 21:17:47 → 21:24:49 | 21:18:06 → 21:24:15 | **7,8 min** |
| `30400640305` | 21:26:40 → 21:33:46 | **21:39:22** → 21:46:09 | **20,3 min** |

I den första startade jobben 19 s isär och kördes parallellt; i den andra
startade staging **5 min 36 s efter** att acceptance var klar, köande i
`staging-tests`. Hela skillnaden är kö. **Vinsten av A7:5 är därför inte bara de
369–390 s jobbet tar, utan att kritiska vägen slutar VÄXA med antalet parallella
PR:er** — den egenskap ett flöde med flera samtidiga agenter behöver mest, och
den syns inte i en mätning av jobbtider. Noterat i `TASK-70.3`.

**Förbehållet står kvar:** acceptance blir ensam bärare efter flytten, så taket
landar kring 7 min även efteråt. `TASK-75` är det som sänker det.

**Bekräftat starkt — rör inte i detta spår:** main-skyddet (tom bypass-lista,
`strict` required check) · riskklassningen D0/D1/dedup · fail-closed-aggregatorn
med `gate-proof.yml`-beviset · nattnätets larmkedja · worktree-isoleringen ·
acceptance-klassens utbrytning ur mutexen.

## Spår B — Instruktionsleveransen (`T100`)

Åtgärd 1–2 och steg 3 är landade (se § Avbockningslogg); tråden bär hela
diagnosen.

**Steg 4 var AVGJORT AV MARCUS 2026-08-01** (T100-kortet § Steg 4, ordagrant
beslut): inget destillat nu — IDENTITET/profile ska göras om först;
omgörningen är ett hub-/personspår Marcus initierar när han vill; T100
stängd. Raden var stale (L437-klassen) och lurade in beslutsbords-frågan
2026-08-02 en andra gång — fälld av T100-läsningen, inte av minnet.

**Memory-lager-hålet KORTAT → `task-124`** (session-end 2026-08-02,
gränsregeln): hook-täckningen för `MEMORY.md`-leverans prövas som eget kort —
över-engineering-vakten prövas där skarpt (bygg, eller avstå öppet).

## Spår C — Lesson-skulden (AVBLOCKERAD 2026-07-27 av ADR-081)

**Vägen är öppen:** skriv varje kandidat som nummerlöst fragment i
`tasks/lessons.d/`, konsolidera sedan. Nästa lediga nummer och antalet
nummerlösa fragment ägs av `tasks/lessons.md` respektive katalogen.
`npm run check:docs` rapporterar fragment-antalet exakt, men det andra talet är
**antal unika poster — inte nästa lediga nummer** (de sammanfaller bara vid
kontinuerlig numrering). Rättat 2026-07-29; läs nästa lediga ur filen. **Summera inte tre
källor i förväg; de räknar olika.** Skörden 2026-07-27 landade sina fragment
(§ Avbockningslogg); utfallet per källa står i sessionsdok Del 11.

**Spår C:s båda kroppsposter är landade och flyttade till § Avbockningslogg
2026-08-01** — Hub-lyftet `L284–L359` (nittonde resumen, sessionsdok Del 38.3)
och Konsolideringen (`#545`, tjugoförsta resumen, sessionsdok Del 39.6). **Spår
C har inga öppna poster kvar** utöver STOPP-sektionen nedan, som är en
registrerad-men-obelagd post, inte en öppen åtgärd.

### STOPP — en kandidat kunde inte beläggas

Två kandidater bokfördes i PAUSLÄGE **enbart som stikkord**; sökningen var
uttömmande (sessionsdok Del 11 § 11.4) och de skrevs **inte** på gissning — det
vore att uppfinna empiri. **AVGJORT 2026-07-27.** Marcus: *"Jag minns inget om
de obelagda kandidaterna, gör inte du det heller så får du väl låta dem
hänga."* De **hänger som registrerad post** — inte förkastade, inte skrivna,
och posten står kvar som sitt eget kvitto på ADR-053:s *registrera, förkasta
aldrig tyst.*

**Den ena återuppstod samma dag — genom att felet begicks igen** (MD028, exakt
vad stikkordet syftade på; fragmentet
`blockquote-stapling-separeras-med-kolon-inte-tom-rad.md` bär den, sessionsdok
Del 11 § 11.6). **Kvar hängande: endast *"autofix förvärrar en
falsk-positiv"*.** Det gör bokföringen till sin egen empiri: en kandidat utan
nedskriven empiri kostar att den måste återupptäckas genom att felet upprepas.

## Spår D — App-arbetet (efter Spår A)

- [ ] **Fem facit-lösa ytor genom full kedja** (premiss 2). Referens:
      eventsidan tog 20 skivor + sex review-iterationer
- [ ] Hållplats-modellen — åtta öppna frågor, ska grillas. Rek. alternativ C
      (hållplats som etikett)
- [ ] `TASK-18.20` — enda öppna skivan i event-familjen. **Blockeraren rättad
      2026-07-29:** posten sade "blockerad av hållplats-frågan", men kortet
      nämner hållplats med **noll** träffar och dess dep (`TASK-48`) är Done.
      Den faktiska spärren är kortets egen rubrik *"VÄNTAR PÅ FYRA
      MARCUS-BESLUT"*: inline-scroll på Bekräftade · vilken uppsättning
      batch-handlingar registret bär · Åtgärds-radernas allt-eller-inget-form ·
      vilka §19-intents de nya handlingarna bär. Felet skickade en läsare att
      driva hållplats-grillningen för att avblockera fel sak
- [ ] Eventinfo saknar motor — krysset skriver två fält ingen kod läser.
      **Kort ej skapat** — posten bor därför här
- [ ] **To Do-ryggsäcken i backlog.** Volym och prioritet ägs av backlog-CLI:t
      (`npx backlog task list --plain`) och räknas där, aldrig här — den
      räkningen driftade tidigare i denna fil
- [ ] **Färgsystemets migrering ligger parkerad i S92** (egen session, eget dok,
      `lifecycle: paused`). Grunden är landad och **additiv**; **migreringen
      ÄNDRAR appens utseende** och har egna steg där ett kräver Marcus-beslut.
      Noteras här enbart så att Spår D:s app-arbete inte planeras som om
      färgsystemet vore orört — arbetet ägs av S92, inte av denna lista

## Spår E — Hygien och skuld

**Spår E har inga öppna poster.** `TASK-88` (ZZ-GRANSKNING-S91-fixturen) är
`Done` och flyttad till § Avbockningslogg 2026-08-01 — se loggen för
motsägelsens upplösning och den kvarvarande klassvarningen mot `TASK-87`.

## Kort födda i S91 — utanför spåren ovan

Registrerade som backlog-kort. **Här bara som index — status, plan och
acceptanskriterier bor på korten.** Ordningen för fynd-kedjan står i
§ Fynd-kedjans ordning.

**`T108`-raden UPPDATERAD 2026-08-02 (session-end):** form (d) mekaniserad
(`TASK-113`/ADR-087 — Stop-vakten i drift) · heartbeat-mekaniseringen kortad
(`TASK-119`) · trevägs-heartbeaten + svep-vid-väckning i drift (T112-formen,
`CLAUDE.md` § Landning). Tråden satt `paused` med trigger
(TASK-119-exekvering · `T111`-bygget för cron-beslutet); T112-hålet öppet
bokfört i registret.

**`T107`-raden STALE — tråden är STÄNGD** (trådregistret): förkravet är i dag
pinnad devDependency (`backlog.md@1.47.1` i `package.json`), och den
kvarvarande CI-ytan (fail-closed utan `BACKLOG_CMD` när `node_modules`
saknar binären) bärs av `TASK-118`.

**`T109`-raden STALE — tråden STÄNGD 2026-08-01** mot
[ADR-088](../docs/decisions/ADR-088-sessionsdok-single-writer-leveransvag.md)
(single-writer per era med definierad leveransväg) + options-rymds-passet;
hela facit i trådregistrets T109-rad.

**`TASK-79` Done 2026-08-02** (beslutsbordet punkt 2, vägval c på Marcus GO):
residualrisken accepterad mot karaktäriseringen; natt-serien 20/20 PASSED +
CI-basen n=65 med 1 fällning. Nattens två nya former → `task-121`. Fullt
facit på kortet.
**`--mm-btn`-frågan AVGJORD 2026-08-02** (beslutsbordet punkt 7, Marcus):
ägs av S92-spåret. S92:s mätning (alla nio tokens konsumeras — sex via
`components.css`, tre via `CTA.tsx`:s Tailwind-4-syntax; kvarfrågan är
namnklyvningen `btn`/`button`, F16-kandidaten) görs inte om och bor i
S92-doket. Ingen åtgärd i S91.
**Namn-/strukturfrågorna AVGJORDA 2026-08-02** (beslutsbordet punkt 5, Marcus
mot research-underlaget
`docs/research/testklass-namn-och-support-kataloger-2026-08-02.md`):
**(a) GO** — utplattningen kortad som `task-123` (ready-for-agent,
exekvering efter S91 per gränsregeln); **(b) defer** — "acceptance" byts
inte (kostnadsasymmetrin ~255 förekomster/45 filer, ingen kollisionsfri
kandidat; invändningens källstöd öppet redovisat i doket; framtida kandidat
"application", Ember-precedenten).
**Review-pilotens kadens AVGJORD 2026-08-02** (beslutsbordet punkt 6, Marcus):
STÅENDE ORDER — passet körs automatiskt på varje produktkod-skiva under
piloten (Sonnet-subagent); friktionens user-requested-villkor uppfyllt
stående, inte per anrop. Bokfört i `T86`-kortet; uteblivna pass märks
fortsatt i pilotloggen (konsekvens 2).

**`IDENTITET.md`-destillatet — AVGJORT 2026-08-01** (T100 § Steg 4: inget
destillat nu; hub-spår Marcus initierar). Dubblettrad av Spår B-brytningen
ovan, bruten vid session-end.
**`TASK-110` Done 2026-08-01** (S91-vågen, merge_group-verifierad per jobb):
mätinstrumentet till klassdelad hemvist landat; facit på kortet.

**`TASK-111` Done 2026-08-02** (beslutsbordet punkt 1): rotorsaken åtgärdad
(resend@6-bumpen, käll-verifierad; avvikande-fallet hermetiskt bevisat);
prod-deployen DEFERRAD till go-live → `task-120` (INGEN ready-etikett —
Marcus GO sätter den).

- [ ] **`TASK-112`** — testgraf-mätningen: källkods-rotad skuggmätning av
      acceptance-urvalet i post-merge (`ADR-077`-slotten). Mätningen byggs,
      inte urvalet; exekvering efter S91 (Marcus-beslut, sessionsdok Del 39.3
      punkt 5) — därför bärare i steg 6, inte i steg 1

> **Merge queue-posten STRUKEN 2026-07-29 — den var inte längre Marcus beslut.**
> Posten stod som öppet Marcus-beslut med motiveringen *"Beslutet är ditt
> eftersom det ändrar beteende i varje landning"*, men motsades av § A7, där
> kortet fick `ready-for-agent` (= *kräver inte Marcus omdöme*) redan
> 2026-07-28. Marcus rev den kvarvarande tvetydigheten i klartext 2026-07-29:
> *"jag bestämmer inte när 70.1 skall utföras. Det är ett missförstånd. DU är
> senior här."* Så länge raden stod kvar blockerades hela steg 3 på ett beslut
> som inte fanns. Allt sakinnehåll bor i **`TASK-70.1`**; utförande-formen
> (orkestrerarens hand, revert-vägen prövad FÖRE aktivering) är ett
> utförande-villkor i kortets plan, inte ett beslut som väntar här.

**Klartecken räcker — inga beslut:** komponent-token-grinden (R1:s dom C) ·
agentdefinitioner i `.claude/agents/` (plugin-agenter stödjer ej `hooks`) ·
kontext-statuslinjen. *(Raden bar till 2026-07-29 även "de 18 återstående
snitten". Struken: den motsäger § Beslutade premisser, där konsekvensen av
premiss 4 + 5 är att **snittet ska omprövas, inte kvitteras** — och "klartecken"
är just kvittering. Vilka de 18 skulle vara går dessutom inte att belägga ur
filen; rad 298 och avbockningsloggen säger båda att arton filer är LANDADE.)*

## Filens egna fel — bokförda, inte bortstädade

En arbetsyta som döljer sina egna fel ljuger även när varje enskild rad stämmer.
Dessa stod i sina respektive poster och följer med hit när posterna
bantades bort. De raderas inte.

1. **A3-posten föreskrev fel värde på `skipAssetRequests`** eftersom den
   sammanfattade ett pass i stället för att läsa källan. *"Felet var mitt."*
   Slutvärdet på disk är `false`; resan bor i ADR-080 och `TASK-54.2`.
   Fragmentet `uppdrag-kan-peka-pa-fel-adress-verifiera-mot-koden.md`
   `[UNIVERSAL]` bär klassen vidare.
2. **A4-postens underlag bar rubriken *"MOTIVERINGEN NEDAN VAR FEL OCH ÄR
   KORRIGERAD"*.** Påståendet *"17 av 19 undantag blir onödiga"* höll inte:
   `.lycheeignore` bär 22 mönster, 21 externa, 1 internt — och **noll** blir
   onödiga i repot om nattrapporten ska vara läsbar. Uppdelningen tar bort
   PR-blockeringen, inte listan. Rättelsen står i ADR-082 § Konsekvenser.
3. **`CONTRIBUTING.md`-posten stod kvar som öppen i tre dygn efter att den
   stängts** — skivan som stängde den (`TASK-59.3`) var inte den som ägde raden.
   Fångat vid dok-genomgången 2026-07-28. Värt att veta att restlistans poster
   kan stängas av arbete på annat håll.
4. **Klassnings-posten påstod att `ready-for-human` *"uteslutande bär QA-planer
   och PRD:er"*.** Fel åt båda håll: `TASK-36.7` är en CI-skiva som bär
   etiketten, och PRD-korten `TASK-8`/`TASK-9` bär inga alls. Det gemensamma är
   att posten kräver Marcus omdöme, inte dess dokumentklass.

5. **Ordningsraden kunde inte bära sin egen väg.** Hela filen lästes 2026-07-28
   och en väg till app-arbetet byggdes ändå som tappade tre poster
   (`TASK-36.8`, Spår B, A2:9 — den sista mintad samma dag av samma läsare).
   Orsaken var strukturell, inte slarv: spåren A–E är tematiska, och § VAR VI ÄR
   täckte bara Spår A. Åtgärdat samma dag genom att ordningsraden gjordes
   fullständig — det är den nuvarande § VAR VI ÄR.
   **ÅTERINTRÄFFADE, och posten var därför fel bokförd som stängd (2026-07-29).**
   Auditen fann **nio** öppna poster utan bärare i kartan — bland dem `TASK-69`,
   `TASK-72` och `TASK-74`, alla mintade 2026-07-28, samt `TASK-76` som lades in
   2026-07-29 under en sektion kartan bara når via steg 7 trots att kortet självt
   kräver steg 3. Strukturell orsak, nu åtgärdad: § A2:s två första punkter
   saknade nummer medan de tre sista hette "punkt 7/8/9" — och kartan pekar per
   nummer, så det som inte hade nummer kunde inte bäras. De heter nu A2:10 och
   A2:11. **Felklassen är alltså inte stängd av en engångsåtgärd; den måste
   fångas av ett återkommande pass.**
6. **Två stycken bar referenser till en stegnumrering som inte längre finns.**
   När kartan ersatte den gamla ordningsraden pekade de på "steg 2". Det ena
   gick att belägga ur styckets egen text (`TASK-57`/`TASK-58`) och skrevs om.
   Det andra — *"ett problem steg 2 krymper"* i A2:7-motiveringen — går **inte**
   att belägga ur filen; formuleringen står därför kvar med referensen märkt som
   otydlig i stället för att gissas rätt. En gissning här hade skrivit bort ett
   skäl ingen längre kan rekonstruera.

7. **Auditen 2026-07-29 införde ett eget statusfel — samma klass den skulle
   rätta.** Lins 3 rapporterade `TASK-69` som en öppen post utan bärare, med
   motiveringen *"Rad 706 mintar den, ingen DONE-rad finns"*. Slutsatsen var
   **härledd ur denna fil**, inte slagen upp i registret — och kortet var
   `Done` sedan 2026-07-28 17:36 (`#360`). Orkestreraren lade in posten som
   öppen utan att kontrollera. **Två aktörer, samma fel:** frånvaron av en
   DONE-rad i en karta är inte ett påstående om ett korts status; bara
   backlog-CLI:t är det. Fångat 2026-07-29 av en mekanisk kontroll som kördes
   FÖRE nästa uppdatering i stället för efter — vilket är den enda skillnaden
   mot hur det upptäcktes förra gången.

8. **Kontrollen som infördes för att stänga felklassen bar en blind fläck som
   dolde tre fel — och den blinda fläcken var hela A7-klassen.** Formen matchade
   kort-ID:t **först** på raden:

   ```text
   ^- \[ \] \*\*`TASK-N`
   ```

   Men A7-raderna bär sitt ID **sist** på raden — efter pilen, i fet kod-span —
   så ingen av dem kunde någonsin fällas. Konsekvensen låg och väntade i kroppen:
   A7:3 (`TASK-70.1`) och A7:5 (`TASK-70.3`) stod som öppna medan korten var
   `Done` och korrekt bokförda i loggen, och A7:6 (`TASK-70.4`) stod avbockad
   **i kroppen** i strid med filens egen regel att kroppen bara bär öppna
   poster. Fångat 2026-07-29
   (femtonde resumen) vid genomläsning av kontrollens regex mot radernas faktiska
   form — inte av kontrollen själv, som per konstruktion inte kunde se dem.
   **Lärdomen är inte att regexen var slarvig utan att den aldrig prövades mot ett
   känt fel.** Den nya formen är därför tvåsidigt bevisad före den skrevs in:
   tre FEL mot filen vid `02a9517`, tomt mot den rättade, och ingen falsk positiv
   på `A7:10`-raden som nämner ett `Done`-beroende. **En kontroll som tyst inte
   täcker en radklass är farligare än ingen kontroll — den läses som täckande.**

9. **Den lagade kontrollen bar TVÅ nya defekter — och gjorde ett falskt
   påstående om ett korts status, exakt post 7:s felklass.** Körd skarpt
   2026-07-31 gav den **fem FEL**, varav **två falska**. Kortat som
   **`TASK-100`**.

   **Defekt A — DONE-listan förorenades av kort som bara NÄMNS i andra korts
   titlar.** Extraktionen var `grep -oE 'TASK-[0-9.]+'` över hela Done-blockets
   rader, utan förankring. Raden `TASK-89 - … orsakskedja mot TASK-52 …` lade
   därför in **båda** ID:na, och `TASK-52` — som står i `To Do` — rapporterades
   som Done. Mätt: 137 ID:n mot 136 med ledande-position-förankring, och hela
   skillnaden var det falska. Att filen påstår ett korts status *är* det post 7
   bokför; här gjorde **kontrollen som skulle förhindra felklassen** det själv.

   **Defekt B — varje fet kod-span antogs vara blockets bärare.** Spår E:s
   `ZZ-GRANSKNING`-post bärs av **`TASK-88`** (öppen) men nämner **`TASK-95`**
   (Done) i sin brödtext, och blocket fälldes på nämnandet. Ingressens egen
   kommentar hävdade att kort som *"bara NÄMNS"* inte matchar — sant bara för
   nämnanden utan fetstil.

   **Defekt C, funnen först under lagningen: två ÄKTA fel var osynliga.** Formen
   såg bara bärare i FET kod-span. A5-posten bär sitt ID som en **vanlig**
   kod-span först på raden (`TASK-36.8`), och A3-posten bär sitt inuti en fet
   span men utan asterisk intill backticken (`TASK-85`). Båda korten är `Done`,
   och `TASK-36.8` stod dessutom avbockad i kroppen i strid med filens egen
   underhållsregel. **Tredje gången samma klass** — post 8 handlade om precis
   detta, och lagningen som skrevs då införde en ny blind fläck av samma sort.

   **Vad som faktiskt ändrades i tänkandet:** att jaga en regex som *verkar*
   täcka allt är själva felmönstret. `TASK-85`-formen går bevisligen **inte** att
   skilja syntaktiskt från ett rent nämnande — posten *"Två namn-/strukturfrågor
   ur `TASK-59.8`:s QA-vandring"* bär ID:t i identisk form och säger uttryckligen
   att **inget kort bär den**. Kontrollen gissar därför inte längre: den
   rapporterar `OKLAR` för block vars bärare den inte kan avgöra, och redovisar
   sin räckvidd i stället för att dölja den. Den fick också en fail-closed-vakt —
   den gamla formen gick **tyst grön med exit 0** när DONE-listan var tom, alltså
   grönt på en trasig avläsning.

**Och felklassen som gav filen sin nuvarande form:** auditen 2026-07-28 fann
tolv statusfel, samtliga kopior av register som redan hade rätt svar. Det är
skälet till att kort-, tråd- och landningsstatus nu bara pekas ut härifrån.

## Avbockningslogg

| Datum | Post | Landning |
|---|---|---|
| 2026-07-27 | Tillstånds-återställningen (resume 3) | `0cfbc9f` |
| 2026-07-27 | Merge queue-falsifieringen bokförd | `07d766d` |
| 2026-07-27 | Ägarbytets städning (länkar · origin · marketplace) | `49c615a` |
| 2026-07-27 | Spår B åtgärd 1 (`InstructionsLoaded`-hooken) + åtgärd 2 (avvecklingen, **ADR-079**) + steg 3 (mekanisk verifiering grön på alla tre kontroller) | `#262` · `#263` · mätning |
| 2026-07-27 | **A1 grillningen avslutad — ADR-080 mintad.** Alla fem besluten (snittet står · portabilitetsgränsen = 90/10 · vakten i avbrytande läge · klassnamnet **acceptance** · ADR:n mintad) bärs av ADR-080 § Beslut | `#272` |
| 2026-07-27 | **A2:6 nummer-tilldelningen löst — ADR-081; Spår C avblockerat.** Första fragmentet landat i samma PR som byggde mekanismen | `#273` |
| 2026-07-27 | Tillstånds-återställningen (resume 4) + **Spår C: 14 fragment** (Del 8.8 · andra pausens carry · `.claude/**`-luckan · kandidaten född vid skörden) | `8a79987` · `#274` |
| 2026-07-27 | **Airtable-kostnaden dokumenterad** — ADR-063 § S91-not + `airtable-constraints.md` sektion F (P26/P27 + P4-utvidgning) | `bc888d3` · `#275` |
| 2026-07-27 | `CLAUDE.md`-pekare till constraints-katalogen + **`TASK-53`** för 429-backoffen | `8006d54` · `#276` |
| 2026-07-27 | **A3 speccat** — `TASK-54` + två skivor + QA; restlistans `skipAssetRequests`-krav rättat | `920a3ef` · `#277` |
| 2026-07-27 | **`TASK-54.1` levererad** — MSW bär API-lagret; ekvivalens pixel-bevisad A/B | `56e9064` · `#278` |
| 2026-07-27 | `TASK-54.1` stängd (Done efter CI) + **`TASK-55`** registrerat | `34a3ea6` · `#279` |
| 2026-07-27 | **T86-friktionen bokförd** + 54.1:s pilotrad + review-fixarna — **ADR-080 § Konsekvenser riven med öppen rättelse-not** (samma `skipAssetRequests`-felläsning som restlistan bar) | `c5c1dc0` · `#280` |
| 2026-07-27 | Femte pausen — lifecycle paused, handoff, todo-kadens | `4b087bc` · `#281` |
| 2026-07-27 | Tillstånds-återställningen (resume 5) | `85b7c07` · `#282` |
| 2026-07-27 | **`TASK-54.2` levererad** — vakten till `onUnhandledRequest`; `skipAssetRequests` VÄND till `false` efter källkodsmätning; sid-vakt + EF-catch-all rivna; tvåsidigt rött-först | `a1c78f9` · `#283` |
| 2026-07-27 | `TASK-54.2` stängd + **`TASK-56`** (WS-vägen) + fragment `*/`-i-blockkommentar | `d681f3e` · `#284` |
| 2026-07-27 | **`TASK-54.3` QA körd av Code på Marcus delegering** — sex steg; **`TASK-57`** + **`TASK-58`** registrerade. **A3:s MSW-punkt därmed stängd** | `b31fc3b` · `#286` |
| 2026-07-27 | **Baselines regenererade** — 6 bilder, Marcus-granskade och godkända; bevis-dispatch `30297097792` loggar *"Inga baseline-ändringar"* | `37e638d` · `#287` |
| 2026-07-27 | **`TASK-55` löst** + Actions-flaggan satt enterprise→org→repo (låset satt på enterprise, ej repo); workflowens filhuvud faktarättat; fragment *låst tre nivåer upp* | `ed984c1` · `#288` |
| 2026-07-27 | **Sjätte pausen** — A3 stängd, lifecycle paused, VAR VI ÄR omskriven, `T87` avblockerad | `8ee8b34` · `#289` |
| 2026-07-27 | Restlistan genomgången post för post mot resumens faktiska utfall (Marcus-order) | `c1ea2e3` · `#290` |
| 2026-07-27 | Tillstånds-återställningen (resume 7) + **klassningen av `TASK-56`/`57`/`58`** — alla `ready-for-agent`, 13 AC skrivna mot läst kod; klassningen avtäckte att alla befintliga `ready-for-agent`-kort har AC | `a478d1b` · `#291` |
| 2026-07-27 | **`TASK-58` DONE** — överskuggningsmönstret `network.use()` dokumenterat i fixturmodulen; precedens + isolering lästa ur biblioteket, exemplet kört som kastbart bevis | `6910d02` · `#292` |
| 2026-07-27 | **`TASK-57` DONE** — vakten lyfter närmaste träff (Levenshtein, TypeScripts 0,4-tröskel) och skiljer extern adress från omockad EF; **`T101`** registrerad | `59b8391` · `187d4e8` · `#293` |
| 2026-07-27 | **Byggplanen v1.14** — Fas E-horisonten omankrad till *appens sidor klara*, premiss 1 + 2 som överordnat förkrav i Fas 6:s closeout, premiss 5 inskriven; Fas 7-beroendet lämnat OFÖRÄNDRAT och öppet noterat som ej avgjort. **ADR-080:s `skipAssetRequests`-omprövning fick sitt utfall infört** | `277174e` · `ff179d8` · `#294` |
| 2026-07-27 | **A5 SPECCAT — `TASK-59`** (PRD-kort, 14 användarberättelser, 9 DoD). Klassningen omräknad ur rådata → **18/14**, ADR-080 noterad; skarv-valet belagt mot MSW:s och Playwrights primärkällor | `b881c63` · `#295` |
| 2026-07-27 | **A5 NEDBRUTET — sju skivor + QA** (`TASK-59.1`–`59.8`), vågorna delade efter YTA ej antal; linjär beroendekedja, Marcus delegerade uppdelningen | `b881c63` · `#296` |
| 2026-07-27 | **`TASK-59.1` DONE** — fixturvärlden till delad hemvist `tests/support/fixturvarld/`; 24 baselines md5-oförändrade | `d52d6c8` · `#297` |
| 2026-07-27 | **ci-wait härdad** — `--commit` kräver full SHA; fällde direkt två självtest-fall som anropat förkortat | `eaebec6` · `#298` |
| 2026-07-27 | **`TASK-59.2` DONE — kontraktsvakten i drift.** Larmkedjan bevisad skarpt (dispatch `30309427472`: `Kontraktsvakt: success` + `Larm: success`, ärende `#300` stängt med motivering). **Vakten larmade på RIKTIG drift vid första körningen** — 11 fält som `get-registrations` skickar i 43/43 poster saknades i fixturen. Tre enabling-detourer krävdes: fixturen ikapp · `L264`-tidszonsfixen · `danger.systems`-undantaget | `95157a5` · `4644041` · `8728e1f` · `#299` |
| 2026-07-27 | **`TASK-59.3` DONE — acceptance-klassen LEVER.** Eget projekt + mutexfritt jobb (placering, ej flagga) + `mergeTests`-komponerad söm; Hem-ytans två filer flyttade med tvåsidigt bevis (`hem` 28 fällda / 56 vakt-fel när mockarna neutraliserades). **`CONTRIBUTING.md` § Acceptance-klassen inskriven i samma skiva** (`109f846`). **`T102`** + **`T103`** registrerade | `#302` |
| 2026-07-28 | **`TASK-59.4` DONE — Personer-ytan** (3 filer, e2e 30→27). Tvåsidigt bevis per fil; agenten fann ett hål i sin EGEN bevismetod (vakten fäller på `get-person` innan `update-record` nås) och körde ett separat skrivvägs-prov. **`T104`** registrerad. Enabling-detour: död pekare i sessionsdok S23 efter flytten | `#304` |
| 2026-07-28 | **Sjunde pausen** — `lifecycle: paused`, Del 14 (orkestreringen), HANDOFF, todo-kadens | `#306` |
| 2026-07-28 | Restlistan ikapp pausen — steg 3 → PÅGÅR, A5-punkterna avbockade, `T104`-ordningen + A4 skärpta i § Beslut | `767e20e` · `#307` |
| 2026-07-28 | **Åttonde + nionde resumen** — A5:s migrering (`59.5`–`59.7`, alla 18 filer ute), **`TASK-60`** (hermetik-självtestet: `T104` åtgärdad, 51/51 fällda av vakten, kostnaden först felprojicerad och lagad i samma pass) + **`TASK-61`** stängd (`#323`; ärende **`#312`** stängt med åtgärd — permanent anteckning-fixtur, purge-immuniteten prövad mot policyns egna funktioner), **`T105`** stängd i `59.7` (flagg-vakt i teardown, prövad åt båda håll), **ADR-082** (länkgrinden presubmit/postsubmit, tvåsidigt bevisad), worktree-isoleringen mekaniserad till typade agenter | `#308`–`#331` (varav **`#312` är ett ärende**, ej PR), `#333` |
| 2026-07-28 | **Tionde resumen** — `lifecycle: paused → active`, nionde pausens rubrik till historik-form, todo-kadens | `#334` |
| 2026-07-28 | **`TASK-59.8` DONE — QA-vandringen.** Sju steg på Marcus delegering; steg 2 och 4 delegerade till subagenter med genuint färska ögon. Steg 1 gav **AC #3:s positiva gren** som `59.7` inte kunde köra (purge + staging `skipped`, acceptance grön) — **klassningen bekräftad korrekt**. Steg 4:s test blev den äkta ändring `59.7` saknade. **A5-familjen därmed komplett.** Fem fynd → `TASK-62`–`66`; steg 3 och 6 gav inget fynd; ett fynd förkastat explicit | `#335` · `#336` · `#337` |
| 2026-07-28 | **`TASK-67` mintad** ur restlistans steg 4 + `TASK-62` klassad `ready-for-agent`. Ordningsbeslutet (fynden före steg 5; `62` före `64` eftersom vakten sannolikt är diagnosinstrumentet) är Codes, fattat på Marcus delegering: *"Du är senior och vet vad som blir bäst."* | `#338` |
| 2026-07-28 | **`TASK-67` DONE — A2 punkt 5 = VAR VI ÄR steg 4.** Landnings-ordningen kodad i `CONTRIBUTING.md` § Landnings-ordningen med pekare i `CLAUDE.md`, **tillämpad på sin egen landning**; agenten lade till en fjärde form som inte fanns i kortet (`update-branch` aldrig mot arbetande agent). **Konvergerar INTE med worktree-isoleringen** — `BEHIND` är en annan felmekanism | `#339` · `#342` |
| 2026-07-28 | Restlistan ikapp tionde resumen — steg 3 → HELT KLART, steg 4 → `TASK-67`, A2 punkt 5 + `TASK-61` avbockade, fem fynd-kort indexerade, namn-/strukturfrågorna lyfta till § Beslut | `a698ee7` · `#341` |
| 2026-07-28 | **Kontraktsdriften kartlagd** — testerna KAN vara gröna medan en verklig EF svarar annorlunda, och det har hänt två gånger. `TASK-68` + `TASK-69` mintade | `#343` · `#344` · `#348` |
| 2026-07-28 | **`TASK-68` DONE** — kontraktsvakten från **tre till sju** fixturhandlers; grön på alla åtta jobb inkl. staging | `#346` |
| 2026-07-28 | **`TASK-62`:s hypotes FALSIFIERAD av research** (sex ekosystem) — exakt-adress-jämförelse missar stavfelet; branschens form är TVÅ mekanismer. Planen omskriven med fyra steg + mätning FÖRE bygge | `#345` · `#347` |
| 2026-07-28 | **Elfte pausen** — `lifecycle: paused`, Del 18, HANDOFF, todo-kadens | `#349` |
| 2026-07-28 | **Elfte resumen** — tillstånds-återställning + **fynd-kedjan klassad och sekvenserad** (`62`→`69`→`65`→`66`→`64`→`63`, deps kodade bara där de är äkta) | `#350` |
| 2026-07-28 | **`TASK-62`:s mätning körd** — per-fil-aggregering tar **51 → 4** fällningar (92 %). Två överlevare är äkta döda registreringar, två är legitima negativa sensorer | `#351` |
| 2026-07-28 | **Arbetsflödes-granskningen — domen DELVIS.** Restlistan stängde inte gapet; **A7** mintat med åtta poster och ordningen kodad som invariant | `#352` |
| 2026-07-28 | **`TASK-62` DONE** — vakten ombyggd till ivrig + trög, per fil. Kritiska vägen bytte bärare: Acceptance **436 s** mot Stagings 313 s | `#340` · `#353` |
| 2026-07-28 | **`A7:1` KLAR** — nattnätet prövat skarpt efter `TASK-61`-fixen: dispatch `30377576519` **grön på samtliga jobb** (`Kontraktsvakt` 32 s, `Länkkontroll` 20 s), larm-jobbet skippat. Ärende `#332` stängt med åtgärd. **Uppföljningsluckan var den äkta bristen** — inte vakten | dispatch `30377576519` |
| 2026-07-28 | **`A7:2` KLAR** — spawn-loggen mäter **effektiv** isolering (frontmatter-uppslag), inte spawn-parametern; nytt fält `isolation_kalla`, tvåsidigt bevis, egen testsvit wirad i CI. Raderna före rättningen är korrekt historik och lagas inte | `#354` |
| 2026-07-28 | **`TASK-70` mintat** — arbetsflödes-gapets PRD + sex skivor (`70.1`–`70.6`), deps `70.3`/`70.4` → `70.2` + `70.5` | `#355` |
| 2026-07-28 | **Restlistan rättad mot disk** — tio inre motsägelser och tolv statusfel; avbockningsloggen lagad som avlastningsyta; *Senast verifierad mot disk*-raden + regeln att registret vinner vid konflikt införda | `a1d6301` · `#356` |
| 2026-07-28 | **`TASK-66` DONE — tidsdimensionen i sömmen.** Agenten vägrade skriva av kortets `~8–10 s` och härledde talet ur källan, vilket avtäckte att **`TASK-65`:s kort räknade fel**: jittret är konstant 0–100 ms per sleep, inte skalat med delayen ⇒ tak **8200 ms**, ej 9800. Kortets egna fem mätningar bekräftade 8200-modellen | `#364` · `#365` |
| 2026-07-28 | **`TASK-65` DONE — timeout-marginalen mot rättat tak.** 12 → 20 s, räkningen rättad **vid källan** i samma commit. Tvåsidigt bevis: negativkontroll fäller på assertionen efter 21,8 s. **Två av kortets påståenden falsifierade** (marginalen var 3,8 s ej 2,2 s; taket är ingen normalutfall utan kräver tolv höga jitter-drag) | `#368` · `#372` |
| 2026-07-28 | **`TASK-71` byggt** — `.claude/**` docs-klassad OCH täckt av alla tre docs-grindarna, som ett par. **Fyndet under fyndet:** `.claude/**` matchar inte `.claude/.markdownlint.jsonc` — dot-regeln biter en andra gång inuti katalogen, så fixen hade återinfört sitt eget fail-open utan andra posten. AC 1 + 6 utestående: kontrastbeviset kräver en PR som rör enbart `.claude/` | `#366` |
| 2026-07-28 | **Vägkartan in i filen** — ordningsraden gjord fullständig (nio steg), efter att en väg byggts som tappade tre poster trots att hela filen lästs. Formregel: steg, ID och pekare — aldrig beskrivning eller status | `#367` |
| 2026-07-28 | **`TASK-64` steg 0 utfört** — flakigheten mätt till **63 %** (14 av 22 acceptance-jobb i 120 CI-körningar) och orsaken lokaliserad till **tre rader** med mönstret *icke-auto-väntande query + icke-retrying assertion*. `ci-metrics.mjs` kunde inte svara: den räknar jobb-omkörningar, och `retries: 2` döljer flaken inuti ett grönt jobb. Klass B (fokus-testerna) skild ut; `T106`-avgränsningen besvarad | `#369` |
| 2026-07-28 | **`TASK-70.5` DONE — revert-vägen ÖVAD, inte bara beskriven (A7:7).** Agenten körde git-mekaniken i egen worktree; orkestreraren körde kedjan skarpt mot `main` (no-op `#374`/`ed51b95` → revert `#375`/`894a3bd`). **Tre fall reproducerade mot en riktig landning:** utan `-m` exit 128 · `-m 2` exit 0 med NOLL rader stagade och filen kvar (tyst misslyckande) · `-m 1` träd-identiskt. **Mätt: 118 s till revert-commit, 25 min 16 s till landad revert** — det andra talet är mutex-väntan, inte vägens kostnad | `#370` · `#376` |
| 2026-07-28 | **`TASK-70.2` DONE — post-merge-lagret (A7:4, förkrav för A7:5–6).** Alla åtta AC belagda, sex verifierade EFTER landning (dispatch kräver default-grenen). Självtest `30395621766` gav äkta `failure` i larmets needs, svit SKIPPED, ärende `#378` med korrekt `-m 1`-recept — stängt med motivering. **Exponeringsfönster mätt: 453 s** | `#371` |
| 2026-07-28 | **`TASK-64` DONE för KLASS A.** Mätt med retries AV: **3/8 fällningar före → 0/8 efter** (2,3 % sannolikt under oförändrad rat). AC 2 bekräftad med belägg — lokatorn löste till noll element. **Orkestrerarens föreslagna fix var FEL** och rättades av agenten: `toHaveAttribute(…, /.+/)` är no-op eftersom attributet är satt redan före första `ArrowDown` | `#377` |
| 2026-07-28 | **`TASK-71` DONE + agent-namnet utfört** (`bygg-skiva` → `bygg-agent`, Marcus beslut). **Kontrastbeviset mätt i `#380`**, en diff som rör ENBART `.claude/`: `Test suite` SKIPPED, `Docs link check` SUCCESS. Samma diff hade före skivan dragit hela staging-sviten. Referenserna i egen PR — en fil utanför `.claude/` hade upphävt beviset | `#366` · `#380` · `#381` |
| 2026-07-28 | **Tre kort mintade ur dagens arbete, alla funna av mekanismer byggda för annat.** `TASK-72` (CI-vakten kan följa fel workflow och rapportera grönt utan att ha sett CI — funnen av `70.5`:s agent) · `TASK-73` (post-merge ärver inte klassningen; en 8-raders docs-landning blockerade revert-vägen 25 min — funnen av övningen) · `TASK-74` (klass B är sju tester och minst två mekanismer, inte de tre `TASK-64` listade — funnen av dess egen efter-serie) | `#376` · `#379` |
| 2026-07-29 | Tillstånds-återställningen (resume 13) + **merge queue flyttad till steg 3** — `70.3` → `70.1` → `70.4` → `75`; Marcus rev tillbaka schemaläggningen till Code | `#389` |
| 2026-07-29 | **`TASK-73` DONE — AC-svansen tagen av orkestreraren.** Fyra AC krävde post-merge-körningar på `main` efter merge. Ärvd klassning bevisad **fyra gånger** (`Verifierande svit` skipped) · kod-landning kör full svit (`30402869073`) · **mutex-takers per docs-PR 2 → 0** (`ba3eab1`, en enda `.md`-fil, tog `staging-tests` två gånger) · larmet fäller mot ÄKTA `failure` i needs (`30405347512`, ärende `#392` stängt med motivering) | `#393` |
| 2026-07-29 | **A3:s två BEHÅLL-poster stängda.** `ci-wait.sh`:s filhuvud rättat — terminal-kontrollen var FEL skiljelinje mot `gh` (finns sedan `cli/cli#3962`, 2021); skälet utbytt mot de fem uppgifter som saknar `gh`-yta. `check-docs.sh` bär tri-state-argumentet (sju kandidater prövade). Kvar i A3: **listparitets-grinden** | `#394` |
| 2026-07-29 | **`TASK-76` mintat — purge-racet.** TOCTOU mellan `listSentinels()` och `deleteSentinels()`; 404 på redan raderad sentinel fäller jobbet. Funnen av `TASK-70.3`:s egna mät-PR:er. **Fem observationer + ett kontrastbevis** (purge ensam = grön). Blir DYRARE efter `70.3`: post-merge blir primär staging-bärare, så racet ger då ett tilldelat revert-ärende på ett träd som redan ligger i `main` | `#399` |
| 2026-07-29 | **`TASK-63` stängd — fanns kvar som `To Do` medan tre dokument påstod motsatsen.** `PAUSLÄGE`, todo-kadensen och denna fil sade alla "nio kort stängda … 63". DoD #3 (CI grön per jobb) var obockad. CI-belägg: run `30400640305`, nio jobb, samtliga `success`. Bara korsläsning mot registret avslöjade det — tre samstämmiga kopior är osynliga för läsning | — |
| 2026-07-29 | **AUDIT — tre läsande agenter, disjunkta linser** (kort-påståenden · externa referenser · intern koherens). **~20 fynd rättade**, varav **fem skapade samma kväll** av rättelsearbetet självt: `TASK-76` utan bärare i steg 3 · stegkollisionen i A7 efter omnumreringen · `A3 ×3` stale · två `[x]` kvar i kroppen · loggen splittrad i tre tabeller. Tyngsta externa fynd: `--mm-btn-*` var INTE oanvända (`CTA.tsx` använder Tailwind-syntax, inte `var()`) och `TASK-18.20` blockeras av fyra Marcus-beslut, inte av hållplats-frågan | `#400` |
| 2026-07-29 | **`TASK-70.3` DONE — A7-spårets största post (A7:5).** AC #1 godkänd på RATIONALE, ej bokstav: staging-jobben förekommer som skippade placeholders (`runner_id: null`, `steps: 0`), och literal frånvaro hade krävt radering ur `ci-suite.yml` som kortet förbjuder. Kritiska vägen bytte bärare utan att växa: 375 s staging → 429 s Acceptance, total 450 s mot tak 480 | `#395` · `#402` |
| 2026-07-29 | **`TASK-70.1` DONE — MERGE QUEUE AKTIV (A7:3).** Revert-vägen prövad SKARPT före aktivering med tom kö (på → verifierad → av → verifierad); `PUT` ersätter hela rules-arrayen, så vägen tillbaka är en FIL. Triggern landad separat FÖRE regeln, eftersom ingen PR annars kan landa — inklusive fixen. **AC #6 bevisad genom att göra det gamla förbudet:** `#404` och `#405` armerades SAMTIDIGT och båda landade. Aggregatorn rapporterar identiskt namn på båda ytorna (`30410841005` PR / `30410861975`+`30410912068` kö) | `#403` · `#404` · `#405` |
| 2026-07-29 | **`TASK-77` + `TASK-78` mintade.** `77`: staging-mutexen binder bara CI, lokala script går förbi — funnen av en agent som bröt regeln två gånger under ett pass, andra gången med full kännedom. `78`: kön bryter post-merge-klassningen för PR:er som inte är först i kögruppen — **PR-grinden orörd**, Marcus fångade att första formuleringen inte sade var felet satt | `#406` |
| 2026-07-29 | **`TASK-74` klar i parallell session — kortets KÄRNPREMISS falsifierad.** Fokus-tesen håller inte (`hem:437` är inget fokus-test; fällningarna säger *element(s) not found*), och "de sju" stämmer inte (sex av sju gav 0/10 i baslinjen). **Tre mekanismer med belägg:** B1 kall route-chunk mot expect-budgeten · B2 vaktens två observatörer · B3 test-budget vid mättnad. Agenten **deflaterade sitt eget tal**: 12 av arm A:s 13 fällningar kom ur EN körning vid loadavg 125. **`TASK-64`:s diagnos delvis falsifierad** — `person-detail:140` föll sex rader FÖRE `T26`:s data-grind, så grinden vaktar rätt sak av fel skäl; noterat i det stängda kortet. **Tre kort mintade ur rapporten:** `79` `80` `81` | — |
| 2026-07-29 | **`TASK-74` DONE — klass B, tre mekanismer.** Kortets kärnpremiss falsifierad av dess EGET AC om kontrollerad last. Agenten deflaterade sitt eget tal (12 av arm A:s 13 fällningar ur EN körning vid loadavg 125). Betalade dessutom carry-posten om `playwright.config.ts`:s falsifierade retries-skäl — skälet utbytt, beslutet behållet | `#411` |
| 2026-07-29 | **Statusrättelse i denna fil.** `TASK-63` (stängd samma dag) och **`TASK-69`** (stängd redan 2026-07-28 via `#360`) stod som öppna `[ ]` i kroppen. `69`-felet **infördes av auditen samma kväll**: agenten skrev *"ingen DONE-rad finns"* — härlett ur FILEN, inte ur registret — och orkestreraren lade in posten utan att slå upp kortet. Se § Filens egna fel post 7 | `#413` |
| 2026-07-29 | **`TASK-70.4` DONE — a11y ur PR-grinden (A7:6).** Första kod-skivan genom merge queue. Verifierad på BÅDA ytorna: PR (`30412877347`) och `merge_group` (`30413468345`), a11y `skipped` i båda. **AC #1 godkänd på RATIONALE — andra gången i rad**, vilket i sig är ett resultat: formuleringen *"förekommer inte i jobblistan"* är fel för en villkorad reusable-workflow och bör vara *"instansieras inte"* i nästa kort av klassen. Vinsten redovisad i rätt enhet (1,73 runner-min/körning), och de −49 s väggklocka som syntes tillskrevs INTE flytten | `#409` · `#414` |
| 2026-07-29 | **`TASK-74` DONE + ärende `#398` stängt.** Ärendet var `TASK-76`:s purge-race — posten `recidhmfxau0lPUUt` är observation 3, och allt som prövade trädet var grönt. Stängt med belägg i stället för lämnat: ett obesvarat larm devalverar nästa | `#411` · `#414` |
| 2026-07-29 | Tillstånds-återställningen (resume 15) + **kontrollens blinda fläck LAGAD.** Kontrollen matchade kort-ID:t först på raden; A7-raderna bär det sist, så hela A7-klassen var osynlig. Tre fel låg och väntade: `A7:3`, `A7:5` öppna trots Done, och `A7:6` avbockad i kroppen i strid med filens egen regel. Nya formen tvåsidigt bevisad FÖRE den skrevs in (tre FEL mot `02a9517`, tomt mot rättad, ingen falsk positiv på `A7:10`:s Done-beroende). § Filens egna fel post 8 | `#418` |
| 2026-07-29 | **`TASK-70.6` DONE — `delete_branch_on_merge` (A7:8).** Tagen under orkestrerarens egen hand: skivan ändrar noll filer, och `ready-for-agent` betyder *kräver inte Marcus omdöme*, inte *ska spawnas som skiva* (precedent `TASK-64`). **AC #2 bevisad med KONTRASTGRUPP:** `#418`:s gren borta efter merge, medan `#417`:s gren från före inställningen ligger kvar på `b5b2bed`. Grannvärdena verifierade oförändrade före/efter. **De 263 redan ackumulerade grenarna raderas INTE** — retroaktiv städning är Marcus beslut | inställning, ingen fil |
| 2026-07-29 | **`CONTRIBUTING.md` rad 95 rättad** — pekade på `ci.yml` `test-staging`; jobbet bor i `ci-suite.yml` sedan S79:s reusable-extraktion (verifierat mot workflow-filerna, inte mot posten). Registrerad av `TASK-70.4`:s agent som medvetet lät bli att laga den | `#422` |
| 2026-07-29 | **`TASK-56` DONE — WebSocket-vägen stängd ur den hermetiska världen.** Vakten fäller nu med adressen namngiven och egen felklass. **Agenten korrigerade orkestreraren på TRE punkter**, alla verifierade i efterhand (`TASK-57` var Done, inte öppet · vakten bor i `tests/support/fixturvarld/` · `test:visual` körs inte i PR-CI, så AC #4 saknar CI-verifiering). Kortet pekade dessutom på en fil som inte körs — `main` är `build/index.mjs`; agenten verifierade båda. Tvåsidigt bevis i TVÅ oberoende former; baselines **12/12 bitidentiska**. **Riggens första bruk utanför `TASK-79`/`80`:** ett fällt test utreddes med 5 varv / 1 530 resultat och föll i BÅDA armarna → inte ändringens fel, belagt | `#439` · `#442` |
| 2026-07-29 | **`TASK-77` DONE — staging-preflighten (resurskrocken).** Form (b) fail-closed preflight i den BEFINTLIGA semaforen; ingen ny sanningskälla — GitHub Actions är redan auktoritet på sitt eget körningsläge. Wiringen i Playwrights setup-projekt, INTE `package.json` (täcker även rå `--project`-anrop). AC #1 bevisat mot äkta post-merge `30443445340`: lokal körning i purge-fönstret gav `NPM_EXIT=1`, `172 did not run`. Ärlig gräns skriven i CONTRIBUTING: kontroll vid START, inte hållet lås. Tre otäckta ytor → **`TASK-84`** | `#435` |
| 2026-07-29 | **`TASK-78` DONE — kö-körningens klassning ärvs via SHA-IDENTITET.** Kön kör `ci.yml` med `event=merge_group` på EXAKT den commit som landar (verifierat: `30438569547` headSha == `58a1a10` == `#423`:s merge-commit). Den gamla vägen måste BEVISA med träd-jämförelse; VÄG A har det gratis. **Villkoret skärpt: 6 av 14 landningar vänder `false`→`true`, 0 tillbaka.** Bevisat EFTER landning under kötryck: post-merge `30445111977` skrev `docs_only=true`, sviten **skipped** | `#433` |
| 2026-07-29 | **`TASK-82` DONE — de två owirade guard-sviterna wirade.** Hemvisten MÄTTES (båda kördes utan secrets och med `fetch` överskriven till throw → exit 0 ×4), inte antogs. Tvåsidigt bevis med run-ID per svit: `30442765425` RÖTT (purge-vakt inverterad) · `30443253072` RÖTT (seed-guard inverterad) · `30443850689` GRÖNT. **Kortet bar ett faktafel orkestreraren skrivit** — `test-classify-post-merge.sh` är wirad i EN workflow, inte två; `post-merge.yml:101` är en kommentar. En namn-grep räknar omnämnanden som wiring | `#432` |
| 2026-07-29 | **GRENSKULDEN STÄDAD — 282 → 17 fjärr, 222 → 17 lokalt.** 263 mergade fjärrgrenar raderade, var och en maskinellt verifierad som förfader till `main` FÖRE radering med stopp om någon fallerade. Lokalt `git branch -d` (inte `-D`) — sex vägrades av git själv, utcheckade i levande worktrees; säkerheten låg i verktyget, inte i listan. **De sex omergade `proto/`-grenarna orörda.** Ingen återkommande mekanism byggd: `delete_branch_on_merge` täcker framtiden, en cron för ett engångsproblem vore spekulativ komplexitet | inställning + engångsoperation |
| 2026-07-29 | **BACKLOG-STÄNGNINGEN MEKANISERAD + hela drift-skulden städad.** `scripts/check-backlog-closure.sh` + config + 10 testfall i PAR. Två fällande invarianter, fail-closed (noll kort ⇒ exit 2). Skarp körning **21 → 1**. Marcus avvisade baslinje-formen, så alla 20 historiska utreddes individuellt — sex med obockade AC visade sig lösta i sak, två sade det redan själva. **Standarden: en obockad ruta på ett stängt kort är tvetydig för alltid; en bockad ruta med skrivet skäl är entydig.** CI-wiringen blockerad av **`T107`** | `#440` |
| 2026-07-29 | **`TASK-75` DONE — urval i acceptance-sviten (A7:10). STEG 3 STÄNGT.** Kritisk väg **411 s → 57 s** (`−86 %`), båda talen mätta i CI (`30438285427` / `30440413603`) — inget lokalt tal jämfört mot ett CI-tal. Kontrastbevis i båda riktningar. Urvalet är fail-closed per klass (`T5`–`T12`): en giltig spec räcker INTE om sällskapet är kod. **AC #4 omformulerat** — det beskrev en design vi inte byggde; agenten vägrade konstruera ett artificiellt hål för att kunna bocka det, vilket var rätt. Playwrights `--only-changed` förkastad EMPIRISKT (`0 tests in 0 files`) | `#424` · `#430` |
| 2026-07-29 | **`TASK-81` DONE — mätriggen är ett verktyg, `npm run metrics:flake`.** Riggen HÄMTAD ur `TASK-74`-agentens scratchpad, ej omskriven ur minnet. Interfolieringen är KODAD (`byggPlan()` enda vägen till en plan), loadavg skiljer OKÄND från noll, 918 rådata-rader, ingen tröskel kodad. 25 testfall, fällande bevisad med fyra mutationer. **AC #4 stängt av orkestreraren mot agentens medvetna öppna-lämning** — kriteriet bar två skyldigheter med olika ägare; konsumentens halva överlämnad i skrift till `TASK-79`. Riggens hemvist + n-reservationen inskrivna i `CLAUDE.md` | `#420` · `#426` |
| 2026-07-29 | **`TASK-76` DONE — purge-idempotensen.** Form (a) skript-fix; mutex-formen förkastad på tre grunder (täcker ej CI↔lokal · river medvetet designval `L348` · serialiserar). Klassificeraren fail-closed i FEM led och korsläser rec-ID:t mot batchen vi bad om. **AC #4 stängt på rationale: ytan finns inte längre** — kod-PR:er kör inte purge sedan `TASK-70.3` (verifierat i källan). Avsikten bevisad av ett STARKARE test: äkta race mot skarpa API:t, B förlorade alla fyra poster och överlevde. Fyra gröna post-fix-purger i CI | `#421` · `#427` |
| 2026-07-29 | **`TASK-72` DONE — men arbetet var landat sedan 2026-07-28.** Kortet stod `To Do` med samtliga sex AC bockade och DoD obockad, medan disken bar hela lösningen (PR `#383`, `a264a16`, `.ci-wait-policy.conf` config-driven per Lesson #6). Upptäckt när kortet lästes INFÖR EN SPAWN — hade det spawnats hade en agent byggt om det som redan fanns. Alla AC omverifierade mot disk; `test-ci-wait.sh` 27/27 grön, `#383` tolv checkar `pass`. **Samma klass som `TASK-63`** | `#383` (arbetet) · stängning nedan |
| 2026-07-29 | **`TASK-80` DONE — kortets KÄRNPREMISS falsifierad.** Egenlasten är verklig och oberoende replikerad (ffmpeg i 95 % av samplingarna, ≈4,2 av 16 kärnor) — men den **förvärrar inte flakigheten**: körtidsmedian −1 s mot ett brusgolv på ±72 s, och arm A nådde loadavg 105,7 UTAN fällning medan en fällning kom vid 18,5. Form **(c) behåll** vald MOT kortets egen rekommendation, på källbelägg: `shouldPreserveVideo` returnerar ovillkorligt `true` för `on-first-retry`, så en retry som PASSERAR sparar video — och 10 av 13 fällningar reproducerade inte vid retry. Noll beteendeändring; 38 rader kommentar som skriver den mätta kostnaden på raden den gäller. **Stängningen blockerad i sex timmar** av att `#446` och `#447` redigerade samma kortfil — konflikten additiv, löst av orkestreraren med båda sektionerna bevarade | `#446` · `#447` |
| 2026-07-29 | **`TASK-84` DONE — preflighten täcker de tre otäckta ytorna.** `TASK-77`:s form UTVIDGAD, inte en andra mekanism: både Node-haken och Playwright-haken anropar samma `staging-semaphore.sh preflight`, semaforen orörd. `test:preview:staging` fick ett setup-projekt (täcker PROJEKTET, så en ny fil ärver preflighten); `purge:staging` och `seed:review` fick anrop i `main()` — ett kommandonamns-prefix bevakar namnet, inte kodvägen. **Bevis 3 ytor × 4 fall, exitkoder mätta separat:** kollision 76/76/1 · rent 0/0/0 · preflight av 0/0/0 · i CI 0/0/0. Att fällningen sker FÖRE basen nås är mätt — bannern saknas helt i utdatan. **Noll destruktiva staging-operationer** under verifieringen. Agenten rapporterade sin egen lucka (wiringen har inget test) → **`TASK-91`** | `#456` |
| 2026-07-29 | **`TASK-83` DONE — och agenten räddade kortet från sin EGEN rekommendation.** Kortet föreslog `--retry N --retry-connrefused`. curls "transient" är en UPPRÄKNAD mängd, och **exit 35 `CURLE_SSL_CONNECT_ERROR` ingår inte** — kortets bokstavliga fix hade landat grönt, stängt kortet och lämnat felläget intakt. Vald form `--retry-all-errors`. **Mätt:** 1 fällning på 988 avgjorda exekveringar (~0,1 %), n=1 och det breda intervallet utskrivet i kort, PR OCH `ci.yml`. **Tvåsidigt bevis mot lokal TLS-server som bryter handskakningen** — äkta exit 35: dåvarande form fäller · kortets (a) fäller · vald form passerar · korrupt nyttolast fäller ⇒ `sha256sum` intakt. Agentens FÖRSTA falsifieringsförsök gav grönt; den bytte sond i stället för att ta det som kvitto. Tredje instansen (`Install Vale`) rapporterad, ej tyst åtgärdad → **`TASK-92`** | `#457` |
| 2026-07-30 | **`TASK-36.8` DONE — stängd på noteringarna, tre dygn efter att beslutet fattades.** Vandringen genomfördes 2026-07-25 (S88) på Marcus delegation; stängningen stod som egen rad i planens steg 0 (Del 27.5) och verkställdes aldrig. `PAUSLÄGE` instruerade *"kontrollera om det ska stängas"* — instruktionen lästes, citerades i ingångsrapporten och utfördes aldrig; posten rapporterades i stället som *"väntar på Marcus"* i fyra transparens-rapporter. Marcus fångade den. Backlog-grinden RENT för första gången: **169 kort, 0 inkonsistenta** | `ca75ac2` |
| 2026-07-30 | **`A2:7` DELAD på Marcus beslut — båda halvorna besvarade.** *Nummerhalvan* → `TASK-93`: `ADR-081` beslut 4:s *"Kort: redan löst"* är **mätt falskt** (två arbetsträd allokerade båda `task-4`); verktygets eget skydd `check_active_branches` står `false` mot tillverkarens `true`, satt som init-default vid instansens födelse och aldrig omprövat. *Filnamnshalvan* framkallad i kontrollerat försök: två agenter fick samma sökväg, den ena skrev över den andra. `Write` skyddas per agent-kontext, **skalet inte**. Mekanism finns bara där agenten inte behöver Bash — vilket utesluter våra två agenttyper; konventionen landad i `bygg-agent.md` **deklarerad som konvention** | `9a9f73c` · `72cf094` |
| 2026-07-30 | **`A2:8` KLAR — grinden byggd, `ADR-083` mintad, hub-raderna städade.** Grinden fäller när en styrande fil påstår en `permissions`-mekanism som inte finns; self-test **7/7**, tvåsidigt bevisad (grön mot repot, **fäller mot hub-filens faktiska innehåll** inkl. det radbrutna). **Två designfel fångade av self-testen före landning:** för trubbig (fällde en korrekt framtidsreferens → avsikten styr, ej bokstaven) och nästan för snäv (samma-rad-krav hade missat det radbrutna felet den byggdes för). Tionde kontrollen i `check:docs`. Hub-`CLAUDE.md` rad 106 + 129 säger nu **PROSA** rakt ut. **Öppen lucka deklarerad:** hubben saknar CI, så hub-filen är oskyddad — en grind som ingen kör är inte en grind | `#471` · hub `000ceab` |
| 2026-07-30 | **Harness-genomgången — sex poster rättade mot Anthropics dokumentation.** Del 29.3:s *"INGET TAK ÄR FUNNET"* var **falskt**: taket är **20 samtidiga** subagenter (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`), 200/session, djup 3 — verifierat mot changelog + docs på 2.1.220, och Marcus hållning STÄRKS eftersom taket ligger 3× över de sex vi provat. `metrics:agents` byggd 2026-07-28 hade **aldrig körts**: `bygg-agent` 16/16, `research-pass` 8/8 isolerade — steg 1 räckte, steg 3/4 är fel hävstång. Skriptets not *"läsande behöver ingen worktree"* är sann om repot och **missvisande om scratchpad** (worktree-isolering är ORTOGONAL mot den kollisionen) | `9a9f73c` |

**Två dispatcher utöver PR-raderna:** `30295150783` (genererade de sex
bilderna) och `30297097792` (**beviset** — *"Inga baseline-ändringar"*, som
stängde `TASK-54.2` DoD 7 och `TASK-54.3` DoD 5).

### Artonde resumen — vågen (2026-07-30)

| Datum | Vad | Ref |
|---|---|---|
| 2026-07-30 | **Worktree-skulden städad.** 16 avställda agent-worktrees borttagna, var och en verifierad som förfader till `main` och `dirty=0` före borttagning; lokala grenar **32 → 5**. Roten: städ-disciplinen skrevs för GRENAR, medan worktreen är en harness-artefakt vi aldrig modellerade — harnesset tar bara bort en **oförändrad** worktree, och en agent som levererat har per definition ändrat filer. Rutin-ändringen till `session-paus`/`session-end` kortad som **`TASK-94`** på Marcus beslut | `#473` |
| 2026-07-30 | **`bygg-agent.md`:s motivering rättad på Marcus delegering** (*"DU avgör"*). Instruktionen *"armera INTE auto-merge"* står kvar; skälet `BEHIND` var upphävt av vår egen `CLAUDE.md` sedan kön mekaniserades — **en motsägelse inuti agentens egen läs-ordning**. Ny grund: diffen granskas före köning, kön ser inte två diffar som mergar rent men är fel tillsammans, agenten är blind för sina syskon | `#475` |
| 2026-07-30 | **`autoMergeRequest`-regeln skriven fel och rättad öppet.** Påståendet *"alltid `null`"* generaliserades ur två avläsningar som båda mätte fel sak (den ena togs post-merge, då fältet nollas oavsett). Motbevisad av `#475` — PR:en som BAR texten. Svaret stod i `gh pr merge --help` hela tiden. Tillagt i samma sektion: **en köad gren kan inte uppdateras** (`GH006`; `--disable-auto` släpper inte låset, `gh` har ingen dequeue) | `#478` |
| 2026-07-30 | **VÅG 1: sju bygg-agenter, noll röda körningar.** `TASK-86` `87` `89` `91` `92` **DONE**; `TASK-88` öppen med redovisat skäl. Ingen kollision mellan agenterna — `ci.yml` rördes av två kort på hunkar 286 rader isär, purge-policyn av ett enda | `#474` `#476` `#477` `#479` `#480` `#481` |
| 2026-07-30 | **`TASK-87` DONE — `save-segment`-läckan** (kroppens post flyttad hit 2026-07-31). `app-segment-test+<uuid>` saknade target i `.purge-staging-policy.json` och städades aldrig. **665 poster räknade via två oberoende vägar innan något rördes; inget raderades i skivan.** Target ankrad i båda ändar, `linkGuard: true` live-motiverad (0 av 665 bar länken — ingen no-op-broms). Testet läser targeten **ur policyn på disk**, inte som kopia: en kopia hade gått grön även mot en tom `targets`-lista. Läckan bekräftad i realtid — agentens egen `test:api` skapade post 666 under mätningen. **Klassvarningen mot `ZZ-GRANSKNING-*` bor kvar i Spår E**, eftersom svaren är motsatta | `#477` |
| 2026-07-30 | **`TASK-89` DONE — `person-detail`-kedjan mot `TASK-52`** (kroppens post flyttad hit 2026-07-31). Kedjan reproducerad med rad-referenser mot deployad EF och repots eget schema. **`TASK-52`:s diagnos FALSIFIERAD i motsatt riktning:** arrayen uppstår vid FÖRSTA motiveringen, inte vid flera anmälningar — båda observerade personerna har `Antal anmälningar (totalt)` = 1. Roten är att formelns ELSE-gren returnerar rollup-referensen orörd medan fältet deklarerar `singleLineText`. Registrerad som **fälla 46** i `data-model.md` (bas-maximeringens kravspec, ej app-lapp). **Omätt led som INTE stängdes:** flerhet (>1 element) är inte observerad någonstans, så varje rekommendation om "bevarad flerhet" vilar på ett antagande; tre syskonfält bär samma formelmönster. `TASK-52` är fortfarande `To Do` | `#476` |
| 2026-07-30 | **`TASK-86` DONE — retroaktiv verktygsvals-redovisning för `check-lesson-numbers.sh`** (kroppens post flyttad hit 2026-07-31). Ren addition 41/0, byggd i ADR-081. Gav ett nytt kort: **`TASK-97`** — agenten fann att `ADR-081`:s precedent-anspråk *"vår form exakt"* bara håller för **halva** formen, och deklarerade det öppet i stället för att tiga, men fick inte röra sektionen (dess AC #3 förbjöd det). **Öppen svans kvar i § A3b:** varför towncrier valdes bort som *verktyg* står fortfarande inte i ADR:n — en annan fråga än `97`:s precedent-anspråk | `#474` |
| 2026-07-30 | **Fälla 46 registrerad** ur `TASK-89` + **tre lesson-fragment** [UNIVERSAL ×3], samtliga ur orkestrerarens egna fel: fail-open-vakten på ett påhittat SHA · regeln ur två felmätningar · ospårad bokföring som delad tillståndsyta. Fragment **55 → 58** | `#482` |
| 2026-07-30 | **Nummerkollision, framkallad skarpt.** Orkestrerarens `TASK-95`/`96` låg **ospårade** medan en bygg-agent räknade från `main` — båda landade på `task-95`. Agenten gjorde allt rätt (upptäckte föråldrad worktree, ff:ade) och fick ändå ett upptaget nummer. Omnumrerat till **`TASK-97` via CLI:t**, inte för hand. Verktygets skydd hade **inte** hjälpt: konflikten låg mellan huvudträdet och en gren | `#482` |
| 2026-07-30 | **`TASK-90` DONE — och grinden fällde sin egen orkestrerare.** Dess FÖRSTA skarpa körning efter landning fällde `TASK-17`/`19`/`36`, stängda en timme tidigare på en läsning av deras egna AC (noll) **utan att DoD-blocket lästes** — två punkter per kort är Marcus design-review. Substansen höll (samtliga 18 barn: DoD komplett, Done, verifierat mot disk), bokföringen inte. Efter kvittens: **173 kort, 0 inkonsistenta** | `#483` `#484` `#485` |
| 2026-07-30 | **`.backlog-closure-policy.conf` lagd i CI:s shellcheck-scope** med fyrcellsbevis att raden bär (gammalt scope + trasig conf = **exit 0**, nytt scope + trasig conf = **exit 1**). Sidofynd rättat: scope-kommentaren sade *"5 sourced-config-filer"* medan listan bar sex — falsk räkning i just den kommentar som dokumenterar scopet, `ADR-083`-klassen | `#483` |
| 2026-07-30 | **VÅG 2 utskickad:** `TASK-85` (listparitets-grinden) + `TASK-93` (kortnummer-kollisionen, med tre skarpa instanser bakom sig) | `#489` · `#487` |

### Natten 2026-07-30/31 — tvåvågen, fyra research-pass, två API-gränser

| Datum | Vad | Ref |
|---|---|---|
| 2026-07-31 | **Weekly limit slog i TVÅ gånger** — sju respektive fyra agenter dödades mitt i arbetet. **Ingen behövde börja om:** disken lästes före varje väckning och arbetet låg kvar ocommitterat men intakt. Ett besked sparade `TASK-93` en omkörning: `#486` rörde noll filer under `backlog/`, så dess register stod stilla och före/efter-diffen var giltig | — |
| 2026-07-31 | **`TASK-85` DONE** — listparitets-grinden. AC #1 HÄRLEDD, ej listad: 50 rader i 19 filer till 10 synk-plikter, 13 kandidater prövade, 5 intagna, 8 förkastade med skäl. Tvåsidigt bevis med alla fem par desynkade ETT I TAGET, återställning verifierad **bit-identiskt**. Två tysta-gröna-fällor inträffade skarpt under bygget och fångades av fail-closed | `#489` |
| 2026-07-31 | **`TASK-93` DONE** — `check_active_branches` false till true. Flipp-kriteriet avgjordes av **mätning på två oberoende axlar**, båda diffarna tomma, och instrumentet **kontrastbevisades** så nollresultatet inte var blint. **Gränsfallet är det viktiga:** true plus **ocommitterat** arbete ger **kollision kvar**. Gränsen utskriven i `CLAUDE.md` § Kortnummer som riskminskning, ej garanti | `#487` |
| 2026-07-31 | **`TASK-94` DONE** — worktree-städningen mekaniserad i hub-pluginet (1.22.0 till **1.23.0**, `claude plugin update` i samma landning). Fem grindar per worktree, mutationsrunda 22/22. **Agenten bröt sitt eget kontrakt och utredde det:** dess worktree auto-städades under arbetet, varpå `cwd` föll till huvudträdet och **isolerings-spärren slutade fälla**. Exponering 4 min 13 s ur reflogen | `#488` · hub `#8` |
| 2026-07-31 | **`TASK-95` levererad** (`#493`). `ZZ-GRANSKNING-S91` **städad: 33 poster före, 0 efter**, rollup-fixturerna byte-identiska. Formen: `[UTGÅR: YYYY-MM-DD]`-stämpel plus svep via **exakt samma** raderings-väg som manuell clean. Diagnosen: *"granskningen pågår var inte uttryckt NÅGONSTANS i datan."* Verifierat att **ingen purge-target läser `Notering`** | `#493` |
| 2026-07-31 | **`T107`-passet: `npx backlog` kan EXEKVERA FRÄMMANDE KOD.** Paketet heter `backlog.md`, binären `backlog` — och det finns ett annat npm-paket som heter `backlog` (utan provenance). npx auto-installerar i CI. **Premissen i frågan föll:** för npm ÄR låsfilens `integrity` checksumme-mekanismen. Rek: form (a) pinnad `devDependency`, gör grinden **39 procent snabbare** | `#490` |
| 2026-07-31 | **`T108`-passet: `Stop`-hooken MÄTT, inte doc-läst.** Sex mätningar mot v2.1.220: hooken kan **vägra ett turavslut** · `stop_hook_active` finns och vänder false till true · taket är **8** blockeringar · `SubagentStop` fyrar för **både** synkrona och bakgrundsspawnade subagenter. **Diagnosen skärptes:** klassen är inte missade notifieringar utan att en aktör avslutar sin tur med ett påstående ingen mekanism bär | `#491` |
| 2026-07-31 | **`TASK-96`-passet: behovet av kö-företräde är BORTA.** Kö-straffet är **inverterat mot brådskan** — median 16 s, de tre som betalade över 240 s var samtliga docs medan kod-grannarna passerade på 14 till 23 s. **Fynd större än frågan:** § Revert-vägens exponeringsfönster är **dubbelt** så långt som filen påstår — två CI-lopp, kod cirka 15 min mot 8 | `#492` |
| 2026-07-31 | **Två kort mintade ur nattens fynd:** `TASK-98` (HIGH — `ADR-083`:s egen grind körs **0** gånger i `ci.yml` medan de fem syskongrindarna körs 1 var) · `TASK-99` (`CLAUDE.md`:s dequeue-slutsats är för stark; mönstret är **plattformsslutsatser dragna ur CLI-begränsningar**) | — |
| 2026-07-31 | **Fem subagent-rapporter blev hemlösa** — `T108`-passets barn levererade till orkestreraren när föräldern dött. Vidarebefordrat fem gånger för hand. Passet noterade det om sig självt: **samma felklass som det utredde, en nivå ned** | `#494` |
| 2026-07-31 | **`TASK-97` — `ADR-081`:s precedent-anspråk rättat.** towncrier bär HALVA formen (skriv utan nummer) men saknar tilldelningssteget, som är hela beslut 1. Grunden omlagd till merge-grindens serialisering + EIP-1 + Rust RFC 0002, sju källor i förstahandskälla. **Andra felet:** *"tre solida precedenter"* stod efter TVÅ uppräknade poster sedan första commiten — tre månader, två amenderingar och ett research-pass som upprepade talet utan att räkna om | `#497` |
| 2026-07-31 | **`TASK-96` — revert-vägen följer kön.** Behovet av kö-företräde BORTA. Svepet gav **sex** ställen, inte fyra. Exponeringsfönstret var **dubbelt** så långt som filen påstod: kod ≈ 15 min mot påstådda 8, mätt över 45 landade PR:er | `#498` |
| 2026-07-31 | **`TASK-38` — metod-vakt i alla tretton EF:er.** 6 av 13 bar den redan, alla korrekt placerade. Grind byggd, allowlist-driven; fyra negativa kontroller fäller. *(S84-fynd, utanför S91-scopet — slutfört hellre än kastat)* | `#499` |
| 2026-07-31 | **`TASK-53` — 429-backoffen.** S91:s ENDA defekt i produktionskod. 30 s golv, jitter additiv **uppåt** (AWS equal jitter hade kunnat gå under golvet och återinfört defekten). Taket **härlett** ur Supabases 150 s idle-timeout, ej valt. Latent resursläcka lagad på köpet | `#500` |
| 2026-07-31 | **`ADR-084` mintad** — granskningsfixturer blir ALDRIG purge-bara; livstiden bärs av fixturen själv. Agenten prövade ADR-baren och fann villkor 1 felformulerat; det bärs i stället av en kaskad verifierad i kod: en target får `seed:review` att kasta `GuardError` och vägra SKAPA fixturen. **En rad river två.** Precedent: fyra projekt, gränsen utskriven (fyra för principen, noll för domänen) | `#502` |
| 2026-07-31 | **HUB-LYFTET `L284–L359` LANDAT** — Spår C:s största uppskjutna post. 72 poster, 22 sessions-H2:er (S69–S91), verbatim tecken-för-tecken med två negativa kontroller. **Orkestrerarens tal 59 var fel — 13 poster bär markören på egen rad.** Agenten följde regeln i stället för talet | hub `#9` |
| 2026-07-31 | **Staging städat på utvidgat mandat.** Marcus: *"I staging-basen kan du göra vad du vill."* `Skovde-S75` raderad — 6 anmälningar, 3 personer, 1 event, efter-verifiering **0 kvar**. `ZZ-GRANSKNING-S91` verifierad tom | — |
| 2026-07-31 | **`TASK-98` — `ADR-083`:s grind wirad i lint-jobbet.** Kördes **0** gånger, körs nu 1. Tvåsidigt bevis **i CI**: planterat falskt påstående ⇒ steg 16 `failure` med grindens egen logg, revert ⇒ `success`. Fann två grindar till som saknas i uppräkningen | `#496` |
| 2026-07-31 | **`TASK-100` — restlistans kontroll 1 lagad.** Fem defekter, inte tre: DONE-listan förorenades av ID:n i andra korts titlar · varje fet kod-span antogs vara bärare · **och formen såg bara FET kod-span, så `TASK-36.8` och `TASK-85` var helt osynliga**. Tredje instansen av post 8:s klass | `#503` |
| 2026-07-31 | **`TASK-85` och `TASK-36.8` flyttade ur kroppen till denna logg.** Båda `Done`, båda kvarlämnade i strid med underhållsregeln — och båda osynliga för den gamla kontrollen. `T87`:s parkerade AC 7–8 i `36.7` följer med som öppen bokföring | — |
| 2026-07-31 | **Kön hängde sig, och rotorsaken är bokförd.** #496:s kö-ref-körning (`ca3c7741`) blev `cancelled` när kön ombildade gruppen 24 s senare; GitHub startar aldrig om en sådan, så posten väntade på en check som aldrig kom — medan gruppen som innehöll den redan var grön. Löst med `gh run rerun`, **inte** rulesetets nödväg. Åtta PR:er stod bakom | — |

### Tjugonde resumen (2026-08-01)

| Datum | Vad | Ref |
|---|---|---|
| 2026-08-01 | **`TASK-53` flyttad ur kroppen till denna logg.** `Done` i registret — landningen har egen rad ovan (2026-07-31, `#500`) — men kvarlämnad som öppen `[ ]` i strid med underhållsregeln; fälld av kontroll 1 vid tjugonde resumens pass. Kroppsradens anspråk *"enda posten i S91 som är en defekt i produktionskod"* följer med hit som historik: `TASK-111`, registrerad i samma pass, är en andra av samma klass | — |

### Tjugoandra resumen (2026-08-01)

| Datum | Vad | Ref |
|---|---|---|
| 2026-08-01 | **`TASK-88` flyttad ur kroppen till denna logg — motsägelsen upplöst.** `Done` sedan `#558`. Kroppens rad 726 (*"33 poster kvar"*) och loggens `TASK-95`-rad (*"33 poster före, 0 efter"*) var **båda sanna vid sin egen tidpunkt** — 33 var mätningen 2026-07-30, FÖRE städningen; 0 är utfallet EFTER. AC #2 bockades 2026-07-31 (verifierat av `TASK-101` mot basen, två oberoende vägar: skriptets legacy-läge + Airtable-MCP, 0 träffar). Kortet stängdes 2026-08-01 i svans-passet efter nattgrindens första äkta drift-fynd. **Rotorsak bevarad:** `ZZ-GRANSKNING-S91` byggdes för hand 2026-07-26 och bär därför inte skriptets fixtur-markörer — det anvisade städkommandot raderade 0 poster (mätt), fixturen var immun mot BÅDE CI-purgen och sitt eget städkommando. Städningen utfördes i stället av `TASK-95`:s legacy-läge (`#493`). **Klassvarning bevarad:** denna post och `save-segment`-läckan (`TASK-87`, § Avbockningslogg) stod tidigare bokförda som samma klass av lucka i purge-policyn — de har **motsatta** rätta svar. `app-segment-test` SKA ha en purge-target (`TASK-87`); `ZZ-GRANSKNING-*` ska **ALDRIG** ha en (skyddsräcke 2 i `seed-review-fixture.mjs` är avsiktligt — en target som matchade granskningsfixturens markörer hade avvisat dess skapande). En framtida "fix" som ger `ZZ-GRANSKNING-*` en purge-target river skyddet i stället för att laga något | `#480` · `#493` · `#504` · `TASK-88`:s final-summary |
| 2026-08-01 | **Spår C — Konsolideringen landad, flyttad ur kroppen till denna logg.** `#545`: **73 fragment → `tasks/lessons.md` `L360`–`L432`**, **69 UNIVERSAL-flaggade lyfta till hub vol-05 K91.7–K91.75** (hub-PR `#12`, `43e90fb`), byte-diff-verifierat i båda riktningar med fällande negativa kontroller. Källa: sessionsdok Del 39.6 (rad ~7892–7894). **Hub-lyftet `L284–L359` var redan landat och loggat** (2026-07-31, se raden ovan i Artonde resumen-blocket) men kvarlämnat som öppen `[ ]` i kroppen — samma underhållsregel-brott som `TASK-53`; städat i samma pass. **Spår C har nu inga öppna poster** utöver STOPP-sektionens registrerad-men-obelagd-kandidat | `#545` |
| 2026-08-01 | **`A2:10` löst, flyttad ur kroppen till denna logg.** `lessons-hub-sync`-skillen (hub) bär nu konsolideringssteget och plugin-bumpen är landad — `#506`, landat under nittonde resumen (2026-07-31). Källa: sessionsdok rad ~7676–7678 (*"Konsolideringen är fortfarande blockerad — men `A2:10` är löst i `#506`"*). Posten var kroppens uttalade förkrav för Spår C:s konsolidering (steg 6b) — konsolideringen själv (`#545`) landade senare samma resume-kedja, se raden ovan | `#506` |

### Tjugotredje resumen (2026-08-02)

| Datum | Vad | Ref |
|---|---|---|
| 2026-08-02 | **`A2:11` STÄNGD på Marcus kvittens (beslutsbordet punkt 3) mot bokförd slutsats.** Steg 1 räckte — mätningen 2026-07-30: `bygg-agent` 16/16 · `research-pass` 8/8 isolerade; allt läckage i inbyggda, övervägande läsande typer (`general-purpose` 0/18 · `Explore` 0/5 · `claude-code-guide` 0/5). Steg 3/4 fel hävstång — byggs INTE (över-engineering-vakten). Scratchpad-kollisionen ortogonal mot worktree-isolering; bärs av fragmentet `parallella-agenter-delar-scratchpad-namnrymd` + `bygg-agent.md`-konventionen, kortas vid behov | sessionsdok Del 32.4 · `docs/research/harness-namnrymd-agenter-2026-07-30.md` |
| 2026-08-02 | **`A2:7` (Punkt 7) STÄNGD på Marcus kvittens (beslutsbordet punkt 3).** Båda halvorna besvarade sedan 2026-07-30 (`TASK-93` → `check_active_branches: true` i drift + filnamnshalvans deklarerade konvention i `bygg-agent.md`). Residualerna — delade statusfiler · läsande agenter · staging-basen/`P4`-taket/acceptance-porten — är dokumenterade väggar med egna bärare (`T108`/`T109` · fragment · Fas E/`T85` våg 3), kortas vid behov | sessionsdok Del 32 · loggens 2026-07-30-rader |
| 2026-08-02 | **`A2:8`-kroppsraden bruten i efterhand — bokföringsdriften rättad.** Beslutet fanns sedan 2026-07-29 (Del 28: default-neka mot uppräknad lista · defera+informationsplikt vid låst beslut · ADR-083) och loggen bokförde KLAR 2026-07-30, men kroppens checkbox stod kvar öppen — posten återuppstod som beslutsbords-punkt 4 tills Marcus kände igen den (*"jag har svaret på denna fråga tidigare"*). Ingen ny grillning behövdes. Fragment: `stangning-i-en-yta-utan-att-bryta-den-andra` | Del 28 · ADR-083 · denna rättelse |
| 2026-08-02 | **`A2:9` (Punkt 9) STÄNGD — push-kadensens dom har hemvist.** `TASK-122` mintat vid plock (postens egen regel); domen (en commit per PR · 7–11 PR/dag, rätt mot branschgolven) + separationen (commit-frekvens gratis, push-frekvens kostar CI + mutexplats) inskriven i `CONTRIBUTING.md` § Push-kadensen med källpekare till passet. Kortet stängs i stängningsbatchen efter merge_group-verifikat | `TASK-122` · CONTRIBUTING § Push-kadensen · [passet](../docs/research/push-kadens-agent-arbetstrad-2026-07-26.md) |
| 2026-08-02 | **`A3b` STÄNGD — verktygsvals-kravet durabelt.** `CONTRIBUTING.md` § Verktygsval före nybygge bär det stående kravet (prövning + skriftlig redovisning även vid "bygg eget"). Svansen (ADR-081/towncrier) var redan landad sedan 2026-07-30 (`TASK-86`, ADR-081 § Verktygsvalet, verifierat mot ADR-texten) — kropps-texten hade aldrig brutits: andra driftinstansen samma dag, klassen bärs av fragmentet `stangning-i-en-yta-utan-att-bryta-den-andra` | CONTRIBUTING § Verktygsval · ADR-081 § Verktygsvalet |
| 2026-08-02 | **Stängningsbatchen — beslutsbordets sex kropps-rader brutna.** `TASK-79` (vägval c, Done) · `TASK-110`/`TASK-111` (Done i vågen resp. bordet; 111:s deploy-moment → `task-120`) · `--mm-btn` (S92/F16 äger frågan) · namn-/strukturfrågorna ((a) GO → `task-123` · (b) defer) · review-kadensen (stående order, `T86`). `task-122` Done efter `#583`:s merge_group-verifikat per jobb. Besluten i fulltext: sessionsdok Del 42.2 · 42.4 · 42.5 | Del 42 · korten |
| 2026-08-02 | **Session-end-svepet.** L433–L440 konsoliderade (5 fragment + 3 kandidater; hub-lyft väntar hub-sync) · BUILD-LOG S91-post · sex stale rader brutna (A7:9 → `TASK-70.7` · destillat ×2 → T100 § Steg 4 AVGJORT 2026-08-01 · T107/T109 → stängda trådar) · memory-hålet → `task-124` · T108/T113 → `paused` med skäl+trigger · worktree-städning 2 borttagna, grenar 55→51 · Codes egna fel bokförda öppet (destillat-frågan omställd ur stale rad [L437] · tråd-svepets instrumentfel [T110 klass A] · pipe-exit ×2 [L440]) | Del 42.6 · `tasks/lessons.md` L433–L440 |
