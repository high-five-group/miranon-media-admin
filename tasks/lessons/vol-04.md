---
owner: marcus803
updated: 2026-08-08
review_by: 2026-11-15
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->
<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk, ärvd från tasks/lessons.md vid volym-splitten (TASK-161.9, ADR-085-formen). Brand-rule-aktivering bevarad — endast Vale.Terms täcks. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# tasks/lessons/vol-04.md — Universella lärdomar, volym 4

> **STÄNGD volym** · 2026-07-08 → 2026-07-26 (L252–L359): Session 59:s H2-block, sedan flat L-nummer-form utan ny H2 per session (konventionsskifte i källan — se indexets not).
>
> Ingång, uppslags- och append-regler: [`tasks/lessons.md`](../lessons.md) (indexet).
> Innehållet nedan är bevarat verbatim från uppdelningen 2026-08-08 (ADR-085,
> precedent-tillämpning av hubbens volym-split). Nya block tillkommer aldrig i en stängd volym.

---

## 2026-07-08 — Session 59 (MIGRERINGS-HUB-SESSION 4: kartans steg 4b — SYSTEMET.md-bygget + konsolidering)

### L252 [UNIVERSAL] — Färsk-agent-testet: en kontextlös agent som mekaniskt självtillräcklighets-bevis för navigerbara dok

Datum: 2026-07-08 | Källa: S59 steg 4b (SYSTEMET.md byggd; en kontextlös subagent fick
ENBART doket + besvarade 8 kontrollfrågor + Gunilla-frågan → PASSERAT; fångade 2 äkta
luckor [§3 regeltyp-pekare, §11 Gunilla-liknelse] som dokets interna konsistens-koll
missade; designat S57 Del 5 beslut 5, "skördas efter 4b om det håller" S57 Del 6) (klass:
dokumentations-kvalitetsgrind; [[L239]]-släkt [självverifierande dok])

När ett dok ska vara självtillräckligt navigerbart (en läsare orienterar sig enbart via
det): bevisa det MEKANISKT, inte via tyckande. Ge en kontextlös agent enbart doket +
kontrollfrågor som spänner nyckelmekaniken; svarar den korrekt utan förkunskap → doket
räcker. Testet fångar det intern konsistens-granskning inte kan: ett dok kan vara internt
motsägelsefritt OCH ofullständigt/otydligt mot en förstagångsläsare. Instruera agenten att
flagga luckor + säga "framgår ej" hellre än att fylla i från egen kunskap. Gräns mot L253:
färsk-agent-testet mäter självtillräcklighet MOT DOKET, inte korrekthet mot världen — den
senare kräver extern källkännedom.

### L253 [UNIVERSAL] — Empiri med medvetet formulerad härkomst citeras från kanonisk källa, aldrig ur minnet

Datum: 2026-07-08 | Källa: S59 steg 4b (SYSTEMET.md §1 skrev "Code:s egen self-review
~9 %"; ~9 % mättes på den då separata Chat-ytan [yt-neutral per L243, härkomst i hub-CLAUDE
§Self-review-disciplin] — Marcus fångade felet; färsk-agent-testet kunde inte, doket var
internt konsistent) (klass: verifiera-mot-källan vid leverans; [[L243]]-släkt [empiri
förvrängs ej])

Empiriska siffror med medvetet formulerad härkomst (t.ex. yt-neutraliserad per L243) citeras
verbatim från sin kanoniska källa — dras aldrig ur minnet. Risken toppar när dokumentets
kontext har skiftat: ett dok OM Code drar lätt felslutet att en yt-neutral "self-review
~9 %" är "Code:s self-review", vilket både förvränger empirin OCH undergräver poängen
(self-review är svag OAVSETT vem — därför extern fångst). Att felet passerade dokets egen
konsistens-koll men fångades av Marcus är L-tesen self-review ~9 % / extern fångst ~27 % i
praktiken: bygg för extern fångst, inte intern självkontroll.

### L254 [UNIVERSAL] — Blanket-markera aldrig ett källkonsumerat sanningsfält på ett antagande — stäm av mot den auktoritativa listan FÖRST

Datum: 2026-07-08 | Källa: S60 Psionautics-avstämning (tidigt beslut "markera alla närvarande"
→ A10-bulk satte alla 220 Deltaganden Närvarande; den faktiska anmälningslistan visade sedan
10 icke-deltagare + 44 orphan/test-poster → 64 fel-markerade; korrigerat via revert) (klass:
data-integritet vid write; [[L189]]-släkt [schema/data är hypotes tills verifierad])

Ett fält vars värde KONSUMERAS nedströms (här: Deltagande-`Status`, källäst av segment) får
aldrig sättas i klump från ett antagande om verkligheten — en blanket-operation
över-inkluderar tyst allt bruset i mängden (avbokade, dubbletter, testdata). Skaffa den
auktoritativa källistan (faktisk närvaro, faktisk roster) och stäm av FÖRE skrivning; klumpen
är bekväm men gör källan osann. När ägaren säger "markera alla" är det en hypotes om listan,
inte listan — be om listan. STOPPA-OCH-FRÅGA innan den korrigerande skrivningen bekräftades
här dubbelt värdefull: den fångade även ett matchningsfel (se [[L255]]) innan det blev en
felaktig revert.

### L255 [UNIVERSAL] — Stäm av på identitets-stabila nycklar, aldrig på visningsnamn — dubblettnamn mis-mappar tyst

Datum: 2026-07-08 | Källa: S60 Psionautics-avstämning (namn-baserad Deltagande-ID-extraktion
kopplade "Stefan Martinsson" till fel anmälan — det fanns TVÅ [nr 843 Bekräftad, nr 844
Avbokad]; en namn-dict skrev över så fel Deltaganden-IDs plockades; fångat genom att korsläsa
CSV-status mot bas-status per person) (klass: reconciliation/dedup-korrekthet; [[L254]]-släkt)

När två datamängder stäms av: matcha på en identitets-stabil nyckel (record-ID, normaliserad
e-post) eller på postens EGNA barn-länkar — aldrig på visningsnamn. Dubblettnamn (två personer
med samma namn) och poster utan unik nyckel (medföljande utan e-post) mis-mappar tyst: en
namn→post-dict behåller bara den sist itererade, så en efterföljande uppslagning kan returnera
FEL posts barn (här: fel persons Deltaganden). Detekteringssignal: när en per-post-jämförelse
plötsligt visar en avvikelse som en tidigare aggregat-jämförelse sa var noll, misstänk
namn-kollision — och byt till identitets-säker extraktion (iterera källposterna direkt, läs
varje posts egna länkar) innan någon skrivning byggs på matchningen.

### L256 [UNIVERSAL] — En entitets identitet kan bo på dess barn, inte på entiteten — sök båda, annars är "inga träffar" ett falskt negativt

Datum: 2026-07-09 | Källa: S60 segment-export (testkonto-kontroll mot `Personer.E-post` gav
"✓ inga testpersoner"; två testidentiteter låg i exportlistorna — deras adress bodde på
`Anmälningar.E-post`, medan Person-recorden var namnlös och e-postlös) (klass:
identitet/uppslagnings-täckning; [[L255]]-syskon)

Ett uppslag på huvudtabellens identitets-fält är inte en identitets-kontroll — det är en
kontroll av att fältet är ifyllt. När skapande-vägen kan producera en förälder utan
identitets-fält (här: A2 Gren 4 kopierar en e-postlös anmälans tomma fält → Person utan
e-post, [[data-model fälla 42]]), måste kontrollen även gå via barnen: slå nyckeln mot
barn-tabellen och följ länken tillbaka. Regel: innan ett negativt svar ("finns inte",
"inga dubbletter", "inga testkonton") får bäras vidare — fråga *var identiteten kan bo*,
inte bara *var den borde bo*. Falskt negativt är farligare än falskt positivt här: det
passerar tyst hela vägen till utskicket. Skärpning av [[L255]]: den sa "matcha på stabil
nyckel"; denna säger "sök nyckeln på alla ytor där den kan finnas".

### L257 [UNIVERSAL] — Korrelera defekt-antalet mot importkällans råa null-antal innan något kallas bugg

Datum: 2026-07-09 | Källa: S60 (186 namnlösa personer med genomförd utbildning antogs vara en
"allvarlig bugg"; 365 namnlösa anmälningar i basen ↔ exakt 365 `firstname: null` i
backfill-källans mapping-fil ↔ källfilens äldre flikar innehöll enbart e-postadresser)
(klass: rotorsaks-diagnos/dataförlust-vs-kodbugg)

När en datamängd saknar ett fält i oroväckande omfattning: räkna fältets null-antal i
IMPORTKÄLLAN innan kodvägarna misstänks. Exakt korrelation (365 ↔ 365) är en signatur —
den säger att importen troget överförde en förlust som redan fanns. Verifiera sedan mot en
ANDRA oberoende källa (här: den ursprungliga xlsx:en, där namn-kolumner saknas helt före ett
visst datum) och mät återvinningsgraden explicit innan en reparation planeras — 0 av 187
betyder att ingen kod kan laga det. Skillnaden är dyr: en kodbugg jagas, en dataförlust vid
källan dokumenteras och bärs. Motsatt riktning gäller också: en kodväg som *kräver* fältet
(`create-registration` kräver Förnamn/Efternamn) är ett bevis för att den vägen INTE är roten.

### L258 [UNIVERSAL] — En klassificering som ska leda till skrivning måste verifieras mot den auktoritativa källan — attribut-match är ingen klassificering

Datum: 2026-07-09 | Källa: S60 segment-export (Person-record klassad som "testkonto" enbart för
att dess anmälan bar en adress användaren kallat testadress; dess 2 `Närvarande`-Deltaganden
reverterades → riktig, betald deltagares närvaro raderades. Adressen hade DUBBELROLL. Den
auktoritativa anmälnings-CSV:n — samma fil som varit facit i ett tidigare steg, liggande i
`~/Downloads/` — lästes aldrig före skrivningen) (klass: klassificering/destruktiv skrivning;
[[L256]]-spegelbild)

[[L256]] varnade för falskt NEGATIVT (identitet gömd på barnet → "hittar inget"). Detta är
dess spegelbild: falskt POSITIVT — ett attribut ("adressen ser ut som test") togs för en
identitet ("detta ÄR test") och motiverade en destruktiv skrivning mot verklig data. Båda har
samma rot: en proxy förväxlades med det den ska mäta.

Regel: innan en klassificering får driva en skrivning måste den (a) ha en **diskriminant som
faktiskt bär semantiken** — här: `Anmälan`-länkens existens skiljer skräp från verklighet,
adressen gör det inte — och (b) stämmas av mot den auktoritativa källan. Skärpning: när en
entitet kan ha DUBBELROLL (en människas adress som både är riktig identitet och testverktyg),
kan ingen attribut-match ensam avgöra saken; rollen måste slås upp, inte härledas. Signal att
stanna: klassificeringen härrör från något en människa *sagt i förbifarten* ("den använder jag
för tester") snarare än ur ett fält i datan. Fråga då: *kan samma sträng betyda två saker?*

Kostsam bikostnad: felet passerade en godkänd plan, eftersom planen presenterade den felaktiga
premissen som verifierad fakta. Ett godkännande legitimerar inte premissen — den som skriver
underlaget äger dess sanning.

### L259 [UNIVERSAL] — En konserveringskontroll är invariant under felklassificering — summan går ihop även när kategorin är fel

Datum: 2026-07-09 | Källa: S60 (Event-17-avstämningen `156 + 64 = 220` användes som bevis för att
närvaro-korrektionen var riktig; när 2 rader felaktigt flyttades från `Närvarande` till
`Ej avstämt` blev det `154 + 66 = 220` — summan stämde fortfarande, och kontrollen tuggade grönt
medan en betalande deltagare tyst förvandlades till no-show) (klass: verifieringsdesign;
[[L258]]-följeslagare)

En kontroll som verifierar att en TOTAL bevaras (`Σ kategorier = N`) mäter att inga poster
tappats, dubblerats eller fått tom status. Den säger **ingenting** om huruvida en post ligger i
rätt kategori: varje felflyttning mellan två kategorier bevarar summan exakt. Konserverings-
kontroller är därför starka mot *luck*-fel och blinda för *klassificerings*-fel — och den blindheten
är farlig just för att kontrollen ser ut att bekräfta arbetet.

Regel: en förflyttning mellan kategorier måste verifieras mot en EXTERN auktoritativ källa som
bär kategorin (här: Lottas anmälnings-CSV med `Status`/`Betalning` per person), inte mot en
intern summa. Fråga vid varje "det stämmer": *vilken felklass skulle den här kontrollen inte
kunna se?* Om svaret är "fel i den dimension jag just ändrade" — då är kontrollen fel verktyg.
Praktiskt komplement: räkna även per-post-diff mot källan (vem bytte kategori, och står det i
källan?), inte bara aggregat. [[L255]] pekade på samma sak från ett annat håll: en aggregat-
jämförelse som säger noll avvikelser kan dölja per-post-fel.

### L260 [UNIVERSAL] — En extern tjänsts UI-bindning utan skriftlig dokumentation: triangulera källorna och bevisa med ett minimalt SKARPT test

Datum: 2026-07-10 | Källa: S60 Del 6 (Resend broadcast-editorns variabel-chip: egenskapade
`contact_first_name` matchade ingen kontakt-egenskap → fallback åt alla 416; mekaniken visas
endast i video; `FIRST_NAME` vägrades som "reserved for internal use" — ledtråden att
bindningen redan var inbyggd; rätt namn = egenskapsnyckeln `first_name`; bevisat via skarpt
mini-utskick till 2-kontakters testsegment) (klass: extern-tjänst-integration/
verifieringsdesign; [[L189]]-släkt [beteende är hypotes tills verifierat])

När en tjänsts UI-mekanik inte står i text: (a) triangulera det skriftliga som finns —
API-referens, feature-sida, blogg; legacy-token-former avslöjar ofta modellen; (b) läs
spärrar som LEDTRÅDAR — "reserverat namn" betyder att bindningen redan existerar: leta
systemets nyckelnamn i stället för att skapa egna; (c) BEVISA med ett minimalt skarpt test
mot riktiga poster. Test-knappar utan riktig kontext (Test Email utan kontakt-koppling)
bevisar layout, aldrig bindning. Felklassen är tyst: allt ser felfritt ut i editorn och
avslöjas först i mottagarens inkorg — efter utskicket.

### L261 [UNIVERSAL] — Certifikatfel eller evigt hängande uppladdning mot EN domän: diffa DNS mot en öppen resolver FÖRE all app-/browser-felsökning

Datum: 2026-07-10 | Källa: S60 Del 6 (Resend-bilduppladdningen pulserade för evigt;
DevTools: `net::ERR_CERT_AUTHORITY_INVALID` på uppladdnings-CDN:et; `dig` → 146.112.61.108 =
`hit-phish.opendns.com` med Cisco Umbrella-utfärdat cert — operatörsledets OpenDNS hade
felstämplat domänen som nätfiske; via `@1.1.1.1` → äkta CloudFront/Amazon-cert) (klass:
nätverks-triage/rotorsak)

"Allt annat fungerar" kombinerat med fel på EXAKT en domän är signaturen för en
kategori-/filterspärr i DNS-ledet — inte en lokal bugg. Triage före all annan felsökning:
`dig <domän>` mot `dig <domän> @1.1.1.1` — divergens = interceptor i kedjan; svar i
`146.112.0.0/16` = OpenDNS/Umbrella; certutfärdaren i felmeddelandet NAMNGER interceptorn.
Filen, webbläsaren och appen felsöks först EFTER att DNS-svaret verifierats äkta — annars
jagas spöken i fel lager. Fixen är DNS-val eller filter-konfiguration, aldrig kod. Bikostnad
värd att bära vidare: mottagare bakom samma filterklass ser resurser på den stämplade
domänen trasiga (mailbilder) — alt-text är därför funktion, inte kosmetika.

### L262 [UNIVERSAL] — Strukturer överlever tyst sina motiv — när ett senare beslut tar bort skälet för en struktur, ompröva strukturen explicit

Datum: 2026-07-11 | Källa: S60 Del 6 (två Resend-segment [personlig/namnlös] skapades för
planens TVÅ mailtexter; när utkastet blev EN text med fallback-variabel försvann skälet —
men strukturen red vidare genom import, riggning och bevis tills Marcus ifrågasatte den;
konsoliderad till ETT segment + nytt minitest) (klass: design-hygien/fossil-detektering)

En struktur motiveras av ett beslut; när ett SENARE beslut tar bort motivet försvinner
strukturen inte av sig själv — den blir en fossil som ser avsiktlig ut. Disciplin: vid varje
beslut som ändrar en premiss, fråga explicit "vilka befintliga strukturer motiverades av den
gamla premissen?" och ompröva dem i samma andetag. Granskningsfråga åt andra hållet: "varför
har vi X?" — kan motivet inte längre pekas ut är X en fossil, inte ett val. Extra vikt när
fossilen bär drift-lägen den nya världen saknar (två disjunkta listor kan divergera vid
re-import; en lista kan inte). Fossilen här överlevde dessutom ett bevispass — verifiering
bevisar att något FUNGERAR, aldrig att det BEHÖVS.

### L263 [UNIVERSAL] — Avslutsartefakt som refererar sin egen commit kräver tvåstegs-stängning — självreferensen är fysik, inte slarv

Datum: 2026-07-11 | Källa: S61 AFK-batch (batch-kontraktets "EN commit med
final-summary [leverans-SHA + CI-run-id]" visade sig fysiskt omöjlig — SHA:n
existerar inte förrän commiten är gjord, och "CI grön på pushad commit" kan
inte bockas före CI kört; pilot-agenten hittade task-2-precedenten
självständigt, följde den och bokförde avvikelsen öppet; T75 bär
skill-text-förtydligandet) (klass: process-design/leverans-mekanik)

En leveransartefakt som ska BÄRA referensen till sin egen commit (SHA,
CI-run-id) kan inte bo i den commiten, och en grind som kräver
post-push-utfall (CI grön per jobb) kan inte bockas pre-push. Design-regeln:
separera LEVERANS (kod + allt som är känt före push) från STÄNGNING
(referenser + post-push-utfall) som två commits — och skriv specen så.
Annars tvingas varje utförare (människa eller agent) härleda undantaget
själv, och specens bokstav ("EN commit") ljuger mot sin egen mekanik.
Generellt spec-test: "kan detta steg känna till värdet det ska skriva vid
den tidpunkt det ska skriva det?"

### L264 [UNIVERSAL] — Tidsformaterande tester byggs i SUT:ens tidszon, inte i runnerns — lokalt-grönt/CI-rött på klockslag är tidszons-signaturen

Datum: 2026-07-11 | Källa: S61 batch 2 (AC1-testets "igår HH:MM"-förväntning
byggdes i runnerns värdzon [UTC på CI] medan appen renderar i
Playwright-configens timezoneId Europe/Stockholm → deterministiskt 3/3-fel
"igår 14:02" vs "igår 16:02"; lokalt osynligt eftersom zonerna sammanfaller
där; agenten klassade korrekt TESTDEFEKT ej produktkod och fixade genom att
härleda förväntningen ur samma absoluta ögonblick med explicit timeZone)
(klass: test-determinism/miljöparitet)

Ett test som formaterar tid för sin förväntning använder implicit
processens värdzon — men SUT:en renderar i browserns/configens zon.
Sammanfaller zonerna lokalt är felet osynligt; CI:s UTC avslöjar det
deterministiskt. Regeln: härled förväntade tidssträngar ur samma absoluta
ögonblick med EXPLICIT tidszon (samma som SUT-configens), aldrig via
värd-default. Signaturen att känna igen: klockslags-diffen i felet är exakt
zonskillnaden, på ett test som är grönt lokalt.

### L265 [UNIVERSAL] — `gh run list --commit <sha>` kan returnera tomt fast run:et finns — headSha-matchning på plain list är den pålitliga uppslagsvägen

Datum: 2026-07-11 | Källa: S61 (tre oberoende tillfällen samma dag:
dok-födelsens run fanns + var grönt men `--commit` gav tomt även efter
minuter och med retry-loop; workflow-agenterna instruerades om quirken och
verifierade via headSha-match utan problem) (klass:
verktygs-quirk/CI-verifiering)

`gh run list --commit <sha>` kan ge tomt svar trots existerande run
(indexerings-/filterglapp i gh/API-ledet). Pålitlig form:
`gh run list -L N --json databaseId,headSha` + match på headSha-prefix.
Följdregel för skript och agent-instruktioner: bygg aldrig en vänta-loop på
`--commit`-filtret — "run ej funnet" den vägen är INTE bevis för att run
saknas. Observerad konsekvent i detta repo; verifiera per repo innan
beroende, men anta aldrig att filtret är tillförlitligt.

### L266 [UNIVERSAL] — Substrat-buren kunskapsöverföring: durabla fynd-artefakter fungerar agent-till-agent — skriv fynd för NÄSTA utförare, inte för minnet

Datum: 2026-07-11 | Källa: S61 batch 2 (agent 1 registrerade TASK-5 [stale
dev-server → falsk-rött] + TASK-6 [parallell-contention] som oetiketterade
fynd-kort med symptom + mitigering; agent 2 — helt frisk kontext utan delat
minne — läste korten och TILLÄMPADE mitigations [färsk dev-server-kontroll,
sekventiella kanoniska sviter] och undvek därmed båda fällorna i sin egen
körning) (klass: kontinuitets-arkitektur/multi-agent)

Kontinuitets-principen (filartefakter är enda sanningskällan) höll i sin
skarpaste form: två agenter utan gemensamt minne, och kunskapen gick via
substratet. Designkonsekvensen: skriv varje fynd som en INSTRUKTION till en
okänd nästa utförare — exakt symptom + rotorsak + vilken mitigering DU
använde i din körning — inte som en anteckning till dig själv. Då blir
fyndet exekverbart av vem som helst, människa eller agent, oavsett
kontextfönster. Detta är också beviset för att sekventiell AFK-drift inte
kräver delad session-kontext: substratet bär kontinuiteten.

### L267 [UNIVERSAL] — Plugin-omstart laddar cachen, inte hubben — en hub-landning når sessionen först efter `claude plugin update`

Datum: 2026-07-11 | Källa: S62 (omstartsverifieringen efter hub-landningen
`3174a1e` [1.13.0] visade 1.12.0: marketplace-cachen [GitHub-hämtad, stale
sedan 2026-07-08] laddades om av omstarten; remedierad via `claude plugin
update marcus-system@marcus-hub` → install-record 1.13.0 @ hub-HEAD;
skill-invokering i pågående session gav ändå "Unknown skill" → NY omstart
krävdes) (klass: plugin-distribution/verifieringskedja)

Distributionskedjan har TRE länkar, inte två: hub-repo → GitHub →
marketplace-cache (`~/.claude/plugins/cache/`) → session. En pushad
hub-landning + omstart hoppar över länk tre — omstarten läser
install-recordets frysta installPath och uppdaterar ingenting. Regeln för
varje hub-landning som ska brukas direkt: (1) push, (2) `claude plugin
update <plugin>@<marketplace>`, (3) omstart, (4) verifiera att
install-recordets gitCommitSha == hub-HEAD (inte bara versionssträngen).
Skill-registryn i en körande session låses vid sessionsstart —
plugin-update mitt i en session gör INTE nya skills nåbara där.

### L268 [UNIVERSAL] — Marcus-avfyrade skills har EN nåbar väg in: slash-kommandot FÖRST i meddelandet

Datum: 2026-07-11 | Källa: S62 batch 3-avfyrningen ("Lets go. /work-batch" →
ingen harness-expansion; Skill-verktyget → hårt tool-fel "cannot be used
with Skill tool due to disable-model-invocation") (klass:
plugin-mekanik/harness)

En skill med `disable-model-invocation: true` kan bara laddas av harnessen
när användarens meddelande BÖRJAR med /kommandot — inledande text gör
ordern till vanlig text, och Skill-verktygsvägen är hårt stängd av flaggan
oavsett att användaren uttryckligen bad om skillen. Kontraktsenlig fallback
när ordern är otvetydig: ordern är det durabla kvittot (ADR-071-klassen)
och skill-filen läses verbatim från plugin-cachen och följs — samma
innehåll, samma kontrakt, öppet bokfört i trailen. Ren avfyrning framåt:
kommandot först i meddelandet, inget före.

### L269 [UNIVERSAL] — Mänsklig granskningsgrind fångar OSPECAT designutrymme — mekaniska grindar vaktar bara det specade

Datum: 2026-07-11 | Källa: S62 granskningsvåg 4.5 (Marcus underkände
kallstartens laddläges-design; "lugnt laddläge" [UB 16] var odefinierat och
K10-facit täcker bara laddat läge; samtliga tekniska grindar var gröna →
design-kort task-7) (klass: kvalitetsgrindar/extern fångst)

AC, DoD och CI vaktar bara det som är specat — ett ospecat designutrymme
passerar varje mekanisk grind obesett (first-pass-CI och 8-punkters
facit-avprickning sa ingenting om laddlägets utseende). Den mänskliga
design-review-grinden prövar HELHETEN den ser, inte diffen: "pre-existerande
design" skyddar inte mot underkännande, och det är grindens styrka
(extern-fångst-klassen). Designkonsekvens: ett värdeladdat men odefinierat
ord i en spec ("lugnt", "diskret", "snabbt") är en granskningsyta i väntan —
definiera det, eller förvänta fyndet vid människo-grinden och planera för
det som eget kort.

### L270 [UNIVERSAL] — Pipe:ad grind-output maskerar exit-koden — grinda på grindens exit, inte på dess text

Datum: 2026-07-11 | Källa: S62 Del 3-landningen (`markdownlint | tail` →
exit 0 trots "Summary: 1 error(s)"; `&&`-kedjan släppte igenom commit+push
av `588e29b` → CI RÖD; rättad `d8d5e4f`) (klass:
shell-disciplin/lokal-CI-paritet)

`grind | filter && commit` committar på FILTRETS exit-kod, inte grindens —
en lokal grind är bara en grind om dess exit-kod styr beslutet. Kör grinden
ogrindat och läs utfallet, eller villkora direkt på grind-kommandots exit
(if/&& utan pipe, alternativt pipefail). Lokala grindkörningar ska ha
CI-paritet även i exit-semantiken — CI:s jobb fälls av exit-koden, inte av
att någon läser texten.

### L271 [UNIVERSAL] — Dygnsgräns-fönstret gör runner-zon-buggar latenta — first-pass-grön CI bevisar inte frånvaron av tidszons-fel

Datum: 2026-07-12 | Källa: S63 Del 3 (pill-testet task-4.3 AC 1 föll i run
29170540541 kl 22:27Z — datumsträngar räknade i runnerns UTC medan browsern
kör Europe/Stockholm per playwright-konfigen; testet gick FIRST-PASS-GRÖNT
i S61 kl ~20Z och i alla körningar däremellan; TZ=UTC-repro RÖD lokalt
medan fönstret var öppet → fix `c4c52b2` → CI grön I fönstret, run
29170841109) (klass: test-disciplin/tidszons-paritet; skärper L264)

L264 täckte KLOCKSLAG (formatering); samma rot fäller DATUMSTRÄNGAR till
mockar: en dagens-datum-sträng härledd med runnerns lokala getters hamnar en
dag BAKOM SUT:ens zon i fönstret mellan UTC-midnatt-förskjutningen och
midnatt (22:00Z–00:00Z för Stockholm sommartid) — "Idag"-data blir gårdag
och filtreras bort, N-dagar-aritmetik blir N−1. Det lömska är latensen:
felet existerar bara ~2 h/dygn, så varje grön körning utanför fönstret är
ett icke-bevis — first-pass-grön CI kan inte skilja "rätt" från "latent
fönster-fel". Disciplinen: (1) ALLA värden som korsar runner→SUT-gränsen
(datumsträngar, klockslag, epoch-avrundningar) härleds i SUT:ens zon (Intl
med explicit timeZone — sv-SE ger ISO-form för datum); (2) röd-kapabel
repro finns alltid: forcera runner-zonen (`TZ=UTC`) lokalt — den simulerar
fönstret oavsett klockan; (3) vid tidsrelaterade testfynd: grep:a filen
efter FLER runner-zon-getters innan fixen deklareras klar (svepet är
billigt, klassen återkommer).

### L272 [UNIVERSAL] — Dev-serverns transformerade modulvariant kan serva GAMMAL komponent efter filändring — verifiera renderat läge med computed-assertioner, aldrig pixel-titt

Datum: 2026-07-12 | Källa: S64 T69-konvergenspasset (vites
`?tsr-split=component`-variant [TanStack Routers code-split-modul]
invaliderades inte vid filändring — browsern renderade föregående stegs
komponent efter tre olika edits medan PLAIN-modulen servade färsk kod;
avslöjat av computed-assertioner [ikonbredd 22 ≠ förväntade 20], fix =
dev-server-omstart) (klass: dev-miljö/stale-moduler; TASK-5-grannskapet)

En transformerad dev-modul är en EGEN cache-nyckel: att plain-modulen
serverar färsk kod bevisar inte att den transformerade varianten
(code-split-suffix, virtuella moduler) gör det — HMR-kedjan kan
invalidera den ena och missa den andra, och en pixel-titt ser "rätt
form" men fel VERSION. Disciplinen: (1) verifiera renderat läge mot
FÖRVÄNTADE värden med computed-assertioner (getComputedStyle,
boundingBox) efter varje iterationssteg; (2) vid divergens: hämta BÅDA
modul-URL:erna (plain + transformerad) direkt från dev-servern — pekar
de olika är modulgrafen stale → omstart, jaga inte browserns cache;
(3) roten är per-modul-invalidering, inte server-livslängd — klassen
angränsar TASK-5 (stale dev-server) men fixas per omstart, inte per
flagga.

### L273 [UNIVERSAL] — Falsifikations-passet: varje skyddsräcke RÖD-bevisas två vägar — grön TDD bevisar inte att räcket kan fälla

Datum: 2026-07-12 | Källa: S65 Del 4 (task-8.3 persist-lagret, T76-pilot
agent A2: varje skyddsräcke RÖD-bevisat före implementation OCH via
temporärt urkopplat räcke; passet fann en äkta test-svaghet — full
omladdning omhydrerar query-cachen med DEFAULT-options, så
override-prövning kräver klient-side-nav; rekommendationen kodifierad i
/work-batch 1.14.0) (klass: test-disciplin/TDD; skärper rött-före-grönt)

Rött-före-grönt bevisar att testet KAN bli rött — inte att det blir rött
av RÄTT ORSAK, och inte att det förblir röd-kapabelt när implementationen
är på plats. Falsifikations-passet: när räcket är byggt och sviten grön,
koppla temporärt ur räcket (eller injicera exakt det fel räcket ska
stoppa) och verifiera att EXAKT det testet fäller. Ett test som överlever
urkopplat räcke är dekoration — passet hittar dem medan kontexten är
färsk, till en kostnad av minuter per räcke. 8.3-beviset: test-vägen gick
via full omladdning som återställer bootstrap-defaults — själva
override-beteendet prövades aldrig, och bara urkopplings-varvet avslöjade
det.

### L274 [UNIVERSAL] — Playwright clock.fastForward fyrar inte timers som schemaläggs UNDER hoppet — timer-kedjor kräver flera klocksteg

Datum: 2026-07-12 | Källa: S65 Del 4 (task-8.3:s persist-e2e, en av 5
agent-fångade defekter i testbygget: ett enda fastForward-hopp missade
timern som callbacken själv schemalade — två klocksteg krävdes) (klass:
test-teknik/fake-timers)

fastForward fyrar timers som var schemalagda när hoppet startade; en
callback som i sin tur armerar en NY timer inom samma fönster får den
planerad men inte avfyrad. Beteenden byggda på timer-kedjor
(retry-backoff, poll-loopar som armerar om sig, throttle-synkar) når
aldrig steg 2 på ett hopp — testet blir grönt utan att kedjan prövats.
Disciplinen: stega klockan i lika många steg som kedjan har länkar och
assertera mellanlägena; ett grönt en-hopps-test på en timer-kedja är ett
icke-bevis.

### L275 [UNIVERSAL] — Merge som ändrar dependency-manifestet lämnar andra levande arbetsytor stale — install per arbetsyta, omstart för processer med resolutions-cache

Datum: 2026-07-12 | Källa: S65 Del 7 (TASK-10 fälla 4: batch-agenterna
körde npm ci i sina worktrees men main:s node_modules fick aldrig 8.3:s
två nya paket → dev-servern spydde Pre-transform error och browsern
visade stale bundle; npm install i efterhand räckte INTE för den
igångkörda Vite-processen — config-touch prövad utan effekt, hård omstart
krävdes; `d0b17de`) (klass: dev-miljö/stale; TASK-5/L272-grannskapet)

I varje flöde med flera arbetsytor (worktrees, parallella agenter,
människans huvud-checkout) är dependency-installationen PER ARBETSYTA —
en merge till main som ändrar package.json uppdaterar ingens
node_modules. Disciplinen: (1) efter batch/merge med manifest-diff:
install i varje levande arbetsyta som ska användas — orkestratorns
post-batch-steg för människans huvud-yta (skyddsräckes-kandidat,
TASK-10); (2) redan igångkörda processer med egen modul-resolutions-cache
(Vite, TS-server, watchers) litar inte på disken — omstarta dem efter
installen; (3) symptomet är lömskt: appen ser OFÖRÄNDRAD ut (gammal
bundle renderar vidare), inte trasig.

### L276 [UNIVERSAL] — En byggd service worker på ett dev-origin servar gammal bundle för evigt — dev-servern kan varken uppdatera eller avregistrera den

Datum: 2026-07-12 | Källa: S65 Del 7 (TASK-10 fälla 5: preview-/QA-byggen
på 5173 registrerade den byggda SW:n i browserprofilen; sw.ts
NavigationRoute servar alla navigationer cache-first ur precachen →
batchens leveranser osynliga trots frisk server och färsk kod;
dev-serverns /sw.js = SPA-fallback 200 text/html → uppdatering
misslyckas på MIME men avregistrering kräver 404; empiriskt
kontrast-bevis: Playwright-MCP-profilen hade samma registrering men TOM
precache → nätverket vann — precache-tillståndet avgör symptomet;
`07b17e8`) (klass: dev-miljö/stale-servering; L272-klassen)

Delar dev-servern origin med byggda appar (preview/QA på samma port)
ligger SW-registreringen kvar i VARJE browserprofil som besökt bygget:
precache-first-navigationer visar gamla appen även när servern är nere
("appen funkar" utan server = rykande pistol), och dev-läget kan inte
läka det — /sw.js-fallbacken svarar 200 HTML så registreringen varken
uppdateras eller dör. Diagnos-kedjan när "ingen skillnad syns":
(1) curl:a modulen ur dev-servern — färsk? (2) färsk browserkontext —
renderar nytt? (3) ja+ja ⇒ SW/lagrat tillstånd i profilen: DevTools →
Application → Clear site data. Skyddsräckes-kandidater
(TASK-10-klassningen): byggd app på EGEN port/origin ·
selfDestroying-SW i icke-prod-byggen · unregister-steg i QA-runbooken.
Fällan åter-armeras vid varje nytt bygg-besök.

[KORRIGERING S66 2026-07-12, spec-verifierad: käll-parentesens
"avregistrering kräver 404" var FÖR MILD — enligt gällande spec
avregistrerar INTE ENS en 404 en aktiv registrering (web.dev
service-worker-lifecycle: non-ok status ⇒ "the new worker is thrown
away, but the current one remains active"; W3C ServiceWorker #204 =
wontfix). Ingen passiv självläkning existerar; sanering är alltid
aktiv (Clear site data · getRegistrations→unregister ·
no-op-/selfDestroying-SW på SAMMA URL). Runbooken
docs/reference/staging-verifiering-runbook.md bär korrekt semantik;
skyddsräckena levererade i task-10, S66.]

### L277 [UNIVERSAL] — Verifierings-grindar ska mäta invarianten, inte proxyn — "tom port" är inte "agenten städade efter sig"

Datum: 2026-07-12 | Källa: S66 batch 4 (falsk-röd-halten: orkestratorns
verifierings-grind krävde tom port 5173; Marcus levande dev-server —
startad före batchen, öppet bokförd av agenten som främmande/orörd —
fällde batchen trots korrekt agent-beteende; grinden omskriven till
starttids-korskoll mot agentens arbetsfönster, resume via
workflow-cachen) (klass: orkestrering/grind-design)

En mekanisk grind som mäter en PROXY (portens tillstånd, filens
existens, processantal) i stället för INVARIANTEN (gjorde AGENTEN
rätt: inga EGNA processer kvar) ger falsk-röd så fort omvärlden delar
ytan — och falsk-röd i halt-first-system stoppar friskt arbete.
Disciplinen: (1) formulera grinden som invariantens fråga INNAN du
mekaniserar den; (2) ingår en delad yta: skilj agentens delta från
världens tillstånd (starttider, ägar-filer, före/efter-jämförelse);
(3) en verifierare som själv flaggar "hårda villkoret föll men
evidensen talar emot" har rätt design — avgörandet är orkestratorns,
öppet bokfört.

### L278 [UNIVERSAL] — Worktree-familjen delar .git: origin/main-refen är delad rörlig yta — diffa mot förgrenings-SHA, aldrig mot refen

Datum: 2026-07-12 | Källa: S66 parallell-batch 2 (orkestratorns
9.2-merge flyttade origin/main mitt i 8.4-agentens körning →
agentens claims-diff origin/main..HEAD förorenades med 9.2:s filer;
agenten löste rätt själv: diff mot förgrenings-SHA:t) (klass:
git/parallella worktrees; kodifierad i ADR-073-amenderingen +
/work-batch 1.15.0)

Git-worktrees delar EN .git — fetch/merge i en yta flyttar remote-refs
för ALLA. I parallella flöden är origin/main-refen därför en rörlig
delad yta: varje diff-, claims- eller bas-jämförelse en agent gör mot
refen kan ändras under körningen av en annan aktörs merge.
Disciplinen: förankra jämförelser i det SHA du förgrenade från (spara
det vid branch-skapelsen); refen används bara för färskhets-check vid
setup och av orkestratorns integrations-steg mot FÄRSK main.

### L279 [UNIVERSAL] — Lokal grind-verifiering kräver CI:ns EXAKTA grind-form — verktygets default är ett icke-bevis, och lint-scheman släpar efter plattformsfeatures

Datum: 2026-07-12 | Källa: S66 ×2 samma session (blank `shellcheck`
lokalt grön → CI:s `--severity=style --enable=all` röd på
SC2250/SC2292/SC2312 · actionlint 1.7.12 fäller `queue: max` som
Actions-runtimen bevisligen accepterar — Test+Build körde grönt med
nyckeln aktiv i samma run; schema-släp efter plattformsrelease
2026-05-07; åtgärd: smal -ignore på exakt feltext + lift-villkor i
kommentar) (klass: grind-disciplin; granne till L147)

"Samma verktyg" är inte "samma grind": flaggor, severity, scope och
schema-version ändrar utfallet. Disciplinen: (1) läs CI:ns exakta
anrop (workflow-filen) och kör BYTE-SAMMA form lokalt — ladda CI:ns
binär om versionen skiljer; (2) när en schema-baserad linter fäller
en nyckel plattformen bevisligen kör (runtime-grönt är beviset): smal
ignore på EXAKT feltext + daterat lift-villkor, aldrig bred
avstängning och aldrig riven feature; (3) grind-form-avvikelser
upptäcks billigast FÖRE push — en röd CI-cykel kostar mer än att
öppna workflow-filen.

### L280 [UNIVERSAL] — En läst exit-kod som inte BINDER kedjan är dekoration — grind-utfall är exekverings-villkor, inte trail-utskrift (skärper L270)

Datum: 2026-07-12 | Källa: S66 (orkestratorns Del 3-commit gick ut
trots markdownlint-exit=1: kommandot SKREV exit-koden med echo men
fortsatte med `;` till git add && commit && push — grinden lästes,
band inget; L270-klassens frekvens i sessionen ×4: därtill blank
actionlint-form i en commit-trail + två agent-snubblingar
[pipe/tail], alla fångade + rättade i stunden) (klass:
grind-disciplin; skärper L270)

L270 säger grinda på exit-kod, inte pipe-maskad utskrift.
Skärpningen: att LÄSA exit-koden räcker inte — kedjans fortsättning
måste VILLKORAS av den (`grind && nästa-steg`, aldrig
`grind; echo $?; nästa-steg`). En trail som visar exit=1 följt av
lyckad push är värre än ingen avläsning: den ser ut som disciplin men
är teater. Formen: verifierings- och landnings-kedjor skrivs som
&&-kedjor hela vägen från första grind till push; ska utfallet
loggas, logga EFTER att kedjan brutit.

### L281 [UNIVERSAL] — En verktygsbump ändrar grind-utfall på ORÖRD kod — felträffar klassas semantiskt mot kravets källtext, aldrig lyds kosmetiskt

Datum: 2026-07-18 | Källa: S67 dependabot-passet, två oberoende
instanser samma pass (Biome 2.4→2.5 började linta STATISKA SVG-FILER →
noSvgWithoutTitle [JSX-semantik] felträffade public/-assets — favicon
läses av browser-chrome, logotypens a11y ägs av img-alt → smal
path-scopad override, dubbelverifierad under BÅDA binärerna ·
markdownlint-bumpen skärpte MD036-heuristiken → flaggade en orörd
ADR-rad → rad-inline-disable per repo-mönstret, beslutstext orörd)
(klass: grind-disciplin; granne till L279)

L279 sa att samma verktyg inte är samma grind (flaggor/schema/binär).
Utvidgningen: samma verktyg + samma kod är inte samma UTFALL över en
versionsbump — nya versioner lintar nya filklasser och skärper
heuristiker, och flaggorna landar på kod som inte ändrats på månader.
Disciplinen: (1) klassa varje ny flagga SEMANTISKT — gäller regelns
underliggande krav faktiskt denna yta? Verifiera mot kravets källtext
(spec/standard), inte mot verktygets auktoritet. (2) Äkta träff →
fixa koden; felträff → SMALASTE undantaget (path-scopad override
eller rad-inline-disable) med motiv och källa i undantaget.
(3) Aldrig bred avstängning, aldrig kosmetisk lydnad — en meningslös
title i en favicon är lydnad, inte tillgänglighet. (4) När main ska
vara grön före och efter bumpen: verifiera undantaget under båda
versionerna.

### L282 [UNIVERSAL] — Bumpar av binär-bärande verktyg kräver verktygets EGET install-steg per arbetsyta — npm install räcker inte (kompletterar L275)

Datum: 2026-07-18 | Källa: S67 post-deps-verifieringen (Playwright
1.59→1.61 via deps-PR: npm install kördes korrekt per L275 men
a11y-sviten föll BRETT — 31/31 på 2–3 ms per test med "Executable
doesn't exist … chromium_headless_shell-1228"; `npx playwright
install` hämtade 1.61:s browser-binärer → 31/31 grön) (klass:
dev-miljö/deps; kompletterar L275)

L275 täcker node_modules-synken; denna klass är verktyg vars runtime
bor UTANFÖR node_modules (Playwrights browser-cache i användarens
cache-katalog; motsvarande för andra binär-hämtande verktyg).
Signaturen: hela sviter faller på millisekunder med "executable
doesn't exist"-klassens fel direkt efter en bump — det är inte
testfel utan binär-glapp. Disciplinen: efter bump av binär-bärande
verktyg körs verktygets eget install-steg i varje arbetsyta som ska
köra det. CI gör det redan i sina steg — lokala ytor gör det inte av
sig själva, och npm install rör inte den externa cachen.

### L283 [UNIVERSAL] — Dependabot-gruppdesign: en stack-grupp måste äga sina paket OAVSETT dependency-type — annars föds korsberoende grupp-PR:er som inte kan bli gröna var för sig

Datum: 2026-07-18 | Källa: S67 (PR #53 dev-deps ERESOLVE:
router-devtools-bumpen krävde peer react-router ^1.170 som reste
i PR #56 [tanstack-gruppen]; rotorsak: dev-catch-all-gruppen exkluderade
bara @types/* — tanstack- OCH tailwind-DEV-paketen föll dit,
separerade från sina prod-syskon; fix: dev-gruppen speglar hela
stack-exkluderingslistan) (klass: deps-konfiguration/supply-chain)

Catch-all-grupper per dependency-type (production/development) är
rätt riskprofilsnitt — men stack-grupper (paket som versioneras i
lås) skär TVÄRS över typerna: en stacks dev-verktyg (devtools, CLI,
plugin) peer-beror på stackens prod-kärna. Exkluderar inte varje
catch-all-grupp stackmönstren hamnar syskonen i olika PR:er, och den
ena kan inte bli grön förrän den andra mergats. Invarianten vid
gruppdesign: varje stack-mönster ligger i exclude-patterns på
SAMTLIGA catch-all-grupper, oavsett dependency-type. Signaturen att
känna igen: ERESOLVE i en grupp-PR där "Conflicting peer dependency"
pekar på ett paket som ligger i en ANNAN öppen grupp-PR.

### L284 [UNIVERSAL] — Miljö-delad latens-anomali diagnostiseras som anropskedja × RTT × exekverings-region — CI-grön/lokal-röd kan vara geografi, inte kod

Datum: 2026-07-19 | Källa: S69 TASK-14 (väg D stabilt ~32 s lokalt
men grön i CI på SAMMA fall: 180 seriella Airtable-anrop × ~177 ms
EU→Airtable-RTT; EF:n exekverar i ANROPARENS region
[`x-sb-edge-region: eu-central-1` lokalt, US-region för CI-runnern]
→ samma kod, samma data, olika väggklocka) (klass:
diagnostik/prestanda)

När samma operation är långsam i en miljö och snabb i en annan på
identisk kod och data: räkna FÖRST anropskedjans längd (antal
sekventiella nätverksanrop) och VAR exekveringen faktiskt sker —
edge-runtimes (Deno Deploy/Supabase Edge m.fl.) följer anroparen,
så "serverns" RTT till tredje part beror på VEM som frågar.
Väggklocka = antal anrop × per-anrops-RTT; en kedja om N anrop
förstorar varje geografisk millisekundskillnad N gånger. Mät med
`curl -w '%{time_total}'` + läs region-headern innan hypoteser om
throttling/last/regression får fäste — och notera att en
tidsgräns (test-timeout) då kan falla på ren geografi.

### L285 [UNIVERSAL] — Ett medvetet tolererat interim utan kvantifierad horisont falsifieras tyst — sätt gräns + trigger vid beslutet, inte vid incidenten

Datum: 2026-07-19 | Källa: S69 TASK-14/TASK-15 dubbelinstans
(ADR-060 "bounded sentinel-ackumulering tolereras" utan gräns →
tröskel-incident ×2 [S52 get-attendance 47 s; S69 väg D 32 s,
~250 rader/månad] · K1.17 UTF-8-glob-buggen dokumenterad 2026-05-14
med "reproducerbarhet bör testas separat" utan kort/bevakning →
träffade varje stängnings-commit i två månader) (klass:
beslutsdisciplin/teknisk skuld)

"Bounded", "tolereras tills vidare" och "bör testas separat" är
obundna interim utan definierad gräns: ingen vet NÄR premissen
brister, så den brister som incident i stället för som planerat
arbete. Disciplinen: ett medvetet accepterat interim föds ALLTID med
(1) en kvantifierad horisont (takt × tröskel → datum/volym, t.ex.
"~250 rader/månad ⇒ ~6 veckor") och (2) en durabel trigger —
backlog-kort med horisonten som deadline-signal, eller mekanisk
vakt — aldrig bara en prosa-notering i beslutet. Ett interim vars
enda bevakning är att någon minns det är en schemalagd incident.

### L286 [UNIVERSAL] — En CI-vakt identifierar sin run på commit-identitet OCH workflow-identitet — headSha ensam räcker inte när en push spawnar flera workflows

Datum: 2026-07-19 | Källa: S70 (dependabot.yml-pushen `fd3b628`
spawnade SJU runs på samma headSha — sex "Dependabot Updates" +
en CI; headSha-vakten utan workflow-filter tog första träffen och
rapporterade "TOPP: success" från fel workflow medan CI-runnen ännu
var in_progress; upptäckt på en-jobbs-signaturen [1 jobb "Dependabot"
≠ CI:ns förväntade 5]) (klass: CI-verifiering; skärper L265)

L265 gav headSha-formen (aldrig `--commit` på kort SHA); denna klass
är nästa förväxlingsyta: samma commit kan bära flera workflow-runs
(config-re-parse, schedulerade workflows, tredjeparts-appar). En vakt
matchar därför på (headSha OCH workflow-namn), och per-jobb-läsningen
är kontrollen att RÄTT run lästs — en jobbuppsättning som inte
matchar workflowens förväntade form (fel antal, främmande jobbnamn)
betyder fel run, inte grönt. Topp-status utan jobbform-verifiering
är otillräcklig som stängningsvillkor.

### L287 [UNIVERSAL] — Post-merge-synk av node_modules görs med `npm ci` — `npm install` muterar lockfilen och förorenar arbetsytan (kompletterar L275)

Datum: 2026-07-19 | Källa: S70 dependabot-merge-kedjan (tre
`npm install` efter #59/#60/#64-mergarna skrev om lokala
package-lock.json → nästa `git pull --ff-only` blockerades mitt i
kedjan av odiffad lockfil; åtgärd: lockfilen återställdes med
`git checkout` följt av `npm ci`) (klass: dev-miljö/deps;
kompletterar L275/L282)

L275 etablerade ATT node_modules synkas efter manifest-merge; denna
lesson preciserar FORMEN: när lockfilen ägs av fjärr-commits
(deps-PR-merges, pulls) är `npm ci` synk-verbet — det installerar
exakt ur lockfilen och rör den aldrig. `npm install` LÖSER OM
beroendegrafen och kan skriva lockfilen (npm-versionens
format-nyanser, metadata-drift) fast inget manifest ändrats lokalt —
en tyst mutation som blockerar ff-pulls och riskerar smyg-committas.
`npm install` reserveras för avsiktliga manifest-ändringar där
lockfil-skrivning är MÅLET.

### L288 [UNIVERSAL] — En strukturell fail-safe-vakt måste skilja konstruktions-obligatoriska referenser från verkliga data-kopplingar — annars guardar den 100 % och mekanismen blir en no-op

Datum: 2026-07-19 | Källa: S71 TASK-16 (länk-guarden [alla icke-tomma
rec-ID-arrayer ⇒ hoppa över] trippade på SAMTLIGA 288 event-sentineler —
fältet Eventtyp är create-EF:ns OBLIGATORISKA utgående typ-referens
[ADR-066 b5] och sitter på varje rad by design; run 29685010681
log-verifierad 288/288 EXAKT det fältet → smal config-driven
exkludering `linkGuardExcludeFields` + test åt båda hållen → run
29685680050 288/288 raderade) (klass: skyddsräckes-design)

En vakt som klassar på strukturell form (länk-arrayer, foreign keys,
icke-tomma relationer) träffar två semantiskt olika klasser: verkliga
data-kopplingar (raden är refererad av/kopplad till riktig data — rör
ej) och konstruktions-obligatoriska referenser (raden KAN inte existera
utan dem — de bevisar inget). Skiljs de inte åt guardar vakten allt och
mekanismen blir en tyst no-op — som upptäcks först i drift. Disciplinen:
(1) fail-safe-riktningen (hellre skippa+rapportera än agera fel) gör
felläget till en ofarlig no-op i stället för en skada — den designen
bevisade sig; (2) undantaget görs SMALT (exakt fältnamn, aldrig klass),
config-drivet och testat åt BÅDA hållen (undantaget släpper igenom +
undantaget-är-smalt: verklig koppling bredvid referensen skippar
fortfarande).

### L289 [UNIVERSAL] — En förkontroll måste ställa vaktens FAKTISKA fråga — en smalare förkontroll ger falsk trygghet exakt där mekanismen avviker

Datum: 2026-07-19 | Källa: S71 (MCP-förkollen före push testade två
NAMNGIVNA länk-fält ["Anmälningar (länkat fält)", "Närvaro (records)"]
⇒ "0 länkade, fritt fram" — men länk-guarden var NAMN-AGNOSTISK över
ALLA fält och trippade på Eventtyp, som förkollen aldrig frågade om;
first-pass-rött som förkollen var byggd att förhindra) (klass:
verifikations-disciplin)

När en mekanism ska förhandsbevisas mot verklig data måste förkontrollen
exekvera SAMMA predikat som mekanismen — inte en handplockad delmängd av
det. En förkontroll som frågar smalare än vakten godkänner exakt de fall
vakten kommer fälla, och tryggheten den ger är omvänt proportionell mot
avvikelsen. Bästa formen: kör mekanismens egen kod i dry-run-läge mot
verklig data (planen utan verkan) i stället för att återimplementera
frågan för hand — varje handbyggd spegling av ett predikat är en
divergensyta.

### L290 [UNIVERSAL] — En vakts fråga måste BEVISAS besvarbar innan den armeras — en obesvarbar fråga ger evig tystnad, oskiljbar från "kör fortfarande"

Datum: 2026-07-19 | Källa: S72 (bakgrundsvakten pollade `gh run list
--commit <kort-SHA>` — GitHubs filter kräver FULL SHA och svarar tomt
för evigt på kort form; until-loopen kunde aldrig fyra, runen var grön
sedan länge, och Marcus fick knuffa: "Notisen borde ha kommit") (klass:
verifikations-disciplin)

En vakt är bara ett skal runt en fråga — kan frågan aldrig matcha sitt
mål är vakten strukturellt blind, och dess tystnad ser identisk ut som
"inget har hänt än". Innan en vakt armeras måste dess fråga bevisas
kunna träffa: kör frågan EN gång förhand mot ett känt existerande mål
(eller efter målets förväntade uppdykande) och kräv träff innan loopen
får äga väntandet. Skärper L286 (vaktens identitet = commit ×
workflow) med ett steg FÖRE: identiteten måste vara STÄLLBAR i
API:ets faktiska frågespråk. Samma rot som L289 — frågan som ställs
måste vara mekanismens verkliga fråga — här i vakt-skepnad: en fråga
som aldrig KAN besvaras är den yttersta smalare-frågan.

### L291 [UNIVERSAL] — Lokal förkontroll av en CI-grind måste köra grindens HELA form — det kända röda testet bevisar bara det kända

Datum: 2026-07-19 | Källa: S72 (scrollbar-sagan: `stable` fällde
hem-e2e:ns centrerings-lås i CI → fixen `both-edges` röd→grön-bevisades
lokalt mot EXAKT det fällda testet → pushen föll på ETT ANNAT
computed-lås [mer-e2e:ns absoluta 16 px-mobilmått] som both-edges bröt;
först full svit-körning i CI:ns form — `npm run test:e2e:staging`, 156
passed — avslöjade hela ytan och gav den hållbara formen [lg-scopad
gutter]) (klass: verifikations-disciplin)

Ett globalt ingrepp (skal-CSS, delad config, gemensam token) har en
påverkans-yta som inte begränsas av det test som råkade fälla det
först. Röd→grön på det KÄNDA testet bevisar den kända regressionen —
inte frånvaron av okända. Förkontrollen före läknings-push är grindens
HELA form i CI:ns exakta åkallan (jfr L279: verktygets default är ett
icke-bevis), med kända lokala flakes klassade via isolation-körning
innan de avfärdas. Instansierar L289:s princip på grind-nivån: sviten
ÄR vaktens faktiska fråga; enskilda tester är handplockade delmängder.

### L292 [UNIVERSAL] — En precedens-ändring aktiverar latent DÖD konfiguration — inventera vad som VINNER efteråt, inte bara det du ändrade

Datum: 2026-07-19 (administrativ skörd i S73) | Källa: S56 task-4.1
(@layer base-flytten aktiverade DashboardCards latenta
`text-text-muted` — tyst förlorad styling före flytten — som oväntad
synlig diff; fångad av exhaustiv rubrik-inventering; kandidaten
antecknad i S56:s paus-block, skördad vid S73:s administrativa
S56-stängning) (klass: verifikations-disciplin)

En ändring av precedens-ordning (CSS-lager, import-ordning, MRO,
config-lager) ändrar inte bara det avsedda målet — den kan väcka
regler som varit tyst överskuggade och därmed DÖDA. Blast-radius-
analysen efter en precedens-ändring är därför en inventering av vad
som VINNER under den nya ordningen över hela ytan, inte en diff av
det man rörde. Distinkt från L246 (verifieringsmetoden: renderad
yta): detta är analys-OBJEKTET — den latenta regelmängd som byter
utfall när precedensen flyttas.

### L293 [UNIVERSAL] — "Min diff är grön" ≠ "min run är grön" — CI dömer HELA trädet vid din SHA, inklusive ärvd grind-rödhet

Datum: 2026-07-19 (administrativ skörd i S73) | Källa: S56 (ren
docs-commit `74366f4` blev CI-röd: den byggde PÅ en parallell sessions
grind-röda push [`cc6ec61`, Vale.Repetition]; grinden lintar hela
trädet vid commitens SHA, inte diffen; kandidaten antecknad i S56:s
paus-block, skördad vid S73:s administrativa S56-stängning) (klass:
verifikations-disciplin)

En CI-run verifierar tillståndet vid din SHA — hela trädet, inte din
diff. Rödhet i din run kan därför vara ÄRVD från förälder-commiten,
och diagnosen börjar i trädet, inte i den egna ändringen. Följdregel
för parallella ytor (T67-domänen): en stängd eller parallell sessions
grind-röda är fair att rätta för att avblockera — trädet ska vara
rent, och den sessionen svarar inte längre. Släkt med [[L248]]
(git-formernas semantik) och [[L235]] (grind-maskering); distinkt
axel: ärvd rödhet över commit-gränsen.

### L294 [UNIVERSAL] — En selektiv referens kan inte bevisa FRÅNVARO — "finns ej"-slutsatser kräver live-verifiering mot källsystemet

Datum: 2026-07-20 (S73-skörd) | Källa: S73 K63/K65 (Marcus-fångst:
"fältet finns ej"-claimen byggde på data-model-läsning; basen HAR
fältet + tre systerfält) + K76 (publiceringsflaggan verifierades
live INNAN frånvaro-claimen) (klass: verifikations-disciplin)

En referens (dokumentation, schema-spegel, cache) bevisar vad den
INNEHÅLLER — aldrig vad källsystemet SAKNAR. Referensen kan släpa,
vara selektiv eller aldrig ha täckt ytan. En frånvaro-slutsats
("fältet/flaggan/endpointen finns inte") kräver live-introspektion av
källsystemet; en närvaro-slutsats kan referensen bära. Positiv
tillämpning K76: describe_table FÖRE claimen. Släkt med [[L293]]
(vad verifieringen faktiskt dömer); distinkt axel: referensens
bevisriktning.

### L295 [UNIVERSAL] — Ögat är inget mätinstrument: visuell paritet MÄTS i DOM, visuella defekter DIAGNOSTISERAS i förstoring

Datum: 2026-07-20 (S73-skörd) | Källa: S73 K13 (morf-sömlöshet:
DOM-mätning fann 65 px-hoppet ögat missade) · K67/K68 (padding
"kändes ojämn" — mätningen visade 17/17, orsaken var radie-krock;
kant-inseten 13 vs 17 fångades av mått, ej öga) · K79→K80
("lågupplöst"-cirkeln: TVÅ kant/skugga-hypoteser föll; 4x-zoomad
skärmdump fann fransen — den gröna fyllnadens kantutjämning bakom
handtaget) (klass: verifikations-disciplin)

Två former, samma princip: (a) paritet/geometri verifieras med
DOM-mätning (getBoundingClientRect, y-diff == 0, inset-siffror) —
aldrig okulärt; (b) en UPPLEVD visuell defekt diagnostiseras genom
att FÖRSTORA evidensen (zoomad hög-DPI-skärmdump av det exakta
elementet) INNAN fix-hypoteser formuleras — annars fixar man fel
orsak med självförtroende. Instrumentet före hypotesen.

### L296 [UNIVERSAL] — Levande-men-döv dev-server: verifiera den SERVERADE artefakten, inte bara disken

Datum: 2026-07-20 (S73-skörd) | Källa: S73 K82–K84 (Vite-watchern
tappade filen i TVÅ servrar i rad: servern svarade 200 och HMR-loggen
såg normal ut, men modulen som serverades var gammal; touch hjälpte
ej; disk-grep visade rätt kod → falsk trygghet) (klass:
verifikations-disciplin)

En dev-server kan vara levande (svarar, loggar) men DÖV (watchern
följer inte filen) — då verifierar du gammal kod i browsern hur rätt
disken än är. Formen: vid varje misstanke om utebliven effekt,
curl:a den SERVERADE modulen och grep:a efter ändringens signatur —
matchar den inte disken är watchern död och servern startas om
(varpå samma curl-verifiering görs FÖRE beteende-verifieringen).
Skärper [[L275]]/[[L282]] (stale server-processer): även en FÄRSK
process kan vara döv från start.

### L297 [UNIVERSAL] — Grind-stopp är EXIT-KODAD KEDJA, aldrig output läst med ögat

Datum: 2026-07-20 (S73-skörd) | Källa: S73 TRE instanser i EN
session: K11 (biome --write applicerar aldrig unsafe-fixar →
nursery-fel kvar trots "fixat") · K56 (`tail -1` åt "Found 1
error"-raden) · K69 (grep-räkningen stod FÖRE ett semikolon —
"Found 1 error" skrevs ut och commiten gick ändå)
(klass: grind-disciplin)

En förkontroll som inte STYR exekveringsflödet är dekoration: allt
som avgör pass/fail måste vara en exit-kodad kedja där rött
mekaniskt STOPPAR (`if grep -q …; then exit 1; fi &&` — aldrig `;`),
och fix-läget måste täcka grindens HELA regeluppsättning (unsafe/
nursery-regler kräver explicit räkning efter fix). Tre återfall i
samma session bevisar att klassen inte hålls med disciplin utan med
FORM. Instansierar och skärper [[L280]]/[[L291]] till en byggregel.

### L298 [UNIVERSAL] — CI-efterkontrollens form: EN gles list-sväng; 403 med full kvot = SEKUNDÄR throttling som kräver backoff

Datum: 2026-07-20 (S73-skörd) | Källa: S73 K63-driften (parallella
gh run watch → 403 på hela ytan) · resume-fyndet (`gh run list
--commit <sha>` gav TOM lista för existerande run; branch-lista +
SHA-match band runnet) · K85-passet (403 trots rate_limit-endpointens
4982/5000 kvar — sekundära mönster-limiten på upprepade identiska
actions-anrop; nya försök förlängde bara throttlingen)
(klass: verktygs-disciplin)

Formen för CI-efterkontroll: ETT `gh run list --branch`-anrop som
täcker ALLA väntande SHA:n via SHA-match (aldrig per-SHA-svep,
aldrig `--commit`-filtret [opålitligt], aldrig parallella watchers) —
och vid 403: kontrollera `gh api rate_limit` (kvot-fri); är kvoten
FULL är det den SEKUNDÄRA abuse-limiten som triggats av
anrops-MÖNSTRET — svaret är lång backoff eller verifiering vid nästa
naturliga landning, aldrig tätare polling. Skärper kandidat-trailen
ur [[L297]]-klassen på API-ytan.

### L299 [UNIVERSAL] — Två underkännanden på samma detalj = byt LÖSNINGSKLASS, lappa inte en tredje gång

Datum: 2026-07-20 (S73-skörd) | Källa: S73 resize-trailen (K68 grepp
rivet → K70 eget grepp "bedrövligt" → K71 LÖSNINGSKLASSBYTE till
auto-grow = nöjd) · publicerings-trailen (K76 toggle "inte en
Resend-grej" → K77 slide-to-confirm = rätt klass direkt efter
research) (klass: design-konvergens)

När beställaren underkänt två varianter av SAMMA lösningsklass är
sannolikheten hög att KLASSEN är fel, inte utförandet — tredje
försöket ska vara en annan klass (eller föregås av research på vad
förebilden faktiskt gör), inte en tredje lappning. Kompletterar
prövad-och-riven-mönstret med en eskalationsregel.

### L300 [UNIVERSAL] — Kontinuerligt interaktions-tillstånd bor i en REF — event-handlers läser annars förra renderns state

Datum: 2026-07-20 (S73-skörd) | Källa: S73 K77 (drag-handtaget:
pointermove-handlern läste dragPos ur render-closuren → moves i
samma frame såg stale null/gammalt värde; draget dog. Ref-buret
tillstånd + state enbart för rendern löste det, DOM-verifierat
före/efter) (klass: react-mönster)

Högfrekventa händelseströmmar (pointermove, scroll, resize-observers)
hinner leverera flera events mellan React-renders — handlers som
läser interaktions-tillstånd ur closure-state opererar då på förra
renderns värden. Mönstret: det LEVANDE tillståndet bor i en ref
(synkron sanning), medan useState endast speglar det för rendern.
Gäller varje drag/gesture-implementation.

### L301 [UNIVERSAL] — Browserns :focus-visible-heuristik klassar skript-fokus som tangentbord — komponentbibliotekets modalitets-attribut är facit

Datum: 2026-07-20 (S73-skörd) | Källa: S73 K85 (Marcus-fångst:
fokusring runt HELA dropdown-menyn vid MUS-öppning; React Aria
autofokuserar listboxen vid popover-öppning och native
:focus-visible tänder på skript-fokus; RAC sätter
data-focus-visible ENDAST vid tangentbord →
`[data-rac]:focus-visible:not([data-focus-visible])` släcker den
falska ringen, tangentbordsindikationen intakt)
(klass: a11y-mönster)

Native :focus-visible kan inte skilja "skriptet flyttade fokus åt
mus-användaren" från äkta tangentbordsnavigation — bibliotek som
spårar interaktionsmodalitet (React Arias data-focus-visible) vet.
Globala fokusring-regler behöver därför en modalitets-brygga för
bibliotekets ägda element; ringen styrs av bibliotekets attribut,
inte av heuristiken. Tangentbordsindikationen får aldrig offras —
verifiera BÅDA modaliteterna.

### L302 [UNIVERSAL] — Skript-transformation av källfiler: trasigt utfall åtgärdas återställ-från-git, aldrig auto-fix på korrupt fil

Datum: 2026-07-20 (S73-skörd) | Källa: S73 K41 (skript-ersättning
producerade oparsead kod; auto-fix ovanpå förvärrade) · K53 (perl
utan -Mutf8 dubbelkodade svenska tecken) · K84 (positiv tillämpning:
rent ASCII-mönster valdes medvetet + mojibake-grep efteråt = 0)
(klass: verktygs-disciplin)

Batch-transformationer (sed/perl/kodmods) kan korrumpera subtilt
(encoding, parse-brott). Är utfallet trasigt: återställ filen från
git och applicera om kirurgiskt/med korrigerat verktyg — kör ALDRIG
auto-fix/formatterare på en korrupt fil (det cementerar skadan).
Förebyggande: håll mönstret i ren ASCII när målet är icke-ASCII-text,
och verifiera encoding-signaturer (mojibake-grep) direkt efter.

### L303 [UNIVERSAL] — Interaktivt bor aldrig i interaktivt — slot-ytor läggs som syskon utanför den klickbara ytan

Datum: 2026-07-20 (S73-skörd) | Källa: S73 K44 (signal-slotten med
kryssruta lades UTANFÖR filter-knappen) · K46 (hantera-knappen i
personkortet: kortet gjordes till wrapper-div, länken + knappen
syskon) (klass: a11y-mönster)

Nästlade interaktiva element (knapp i länk, kryssruta i knapp) ger
trasig semantik för tangentbord/skärmläsare och odefinierade
klickytor. Formen: den yttre ytan slutar vara interaktiv (wrapper),
och varje interaktivt element blir SYSKON med egen yta — slot-ytor
för framtida interaktion placeras utanför redan vid designen.

### L304 [UNIVERSAL] — Fristående Playwright med e2e-svitens storageState = credentials-fri browser-verifiering i prototyp-takt

Datum: 2026-07-20 (S73-skörd) | Källa: S73 K14–K85 (mönstret bar
alla fem konvergens-passen: skript/MCP-driven browser mot dev-servern
återanvände e2e-svitens sparade auth-state — mätning, interaktion
och skärmdumpar utan att hantera inloggningsuppgifter i
verifieringsflödet) (klass: verktygs-mönster)

En e2e-svits `storageState` (auth-setup-projektets sparade session)
är en återanvändbar nyckel för AD-HOC-browserverifiering: fristående
skript och browser-MCP kan verifiera autentiserade ytor i
iterationstakt utan credentials i flödet. Gör DOM-mätning och
tillståndstester till standardverktyg under konvergens, inte bara i
sviten.

### L305 [UNIVERSAL] — Avstämningsfrågor ställs i domän-klartext med explicita svarsalternativ

Datum: 2026-07-21 (S74) | Källa: S74 skiv-godkännandet (Marcus:
"Frågorna till mig är alldeles för diffusa, vad är frågorna till mig
i klartext?" — omformuleringen till tre direkt svarbara frågor gav
tre omedelbara svar, varav ett låste betalningsdeadline-regeln som
annars blivit ett HITL-hål i batchen) (klass: samarbets-form)

En buntad avstämning är värdelös om frågorna ställs i processens
metaspråk (granularitet, beroenderelationer, skarv-klasser) — det
språket är agentens bokföring, inte beslutsfattarens fråga. Formen:
varje fråga formuleras i domänens klartext, bär sin konsekvens
synlig ("betyder att X blir klar först efter Y — okej?") och slutar
i explicita svarsalternativ som kan besvaras med ett ord eller en
rad. Gunilla-principens tillämpning på beslutsytor: beslutsfattaren
ska FÖRSTÅ frågan — inte tolka tabellen den står i.

### L306 [UNIVERSAL] — User-invocable-only-skill beordrad i löptext: läs skillen ur cachen och följ den — text-ordern är kvittot

Datum: 2026-07-21 (S74) | Källa: S74 /to-prd ("Kör! /to-prd" skrivet
i löptext → Skill-verktyget vägrade per disable-model-invocation;
SKILL.md + referensfiler lästes ur plugin-cachen och följdes
stegvis; /to-issues kom senare som äkta slash-invokering — samma
procedur, två ingångar) (klass: harness-mekanik)

Skills med `disable-model-invocation` kan inte startas av agenten
via Skill-verktyget ens på uttrycklig order — spärren är per design
(invokerings-kvittot ska vara användarens egen handling). Skrivs
ordern i löptext i stället för som slash-kommando är den ändå samma
konsent-klass: formen är att läsa skillens SKILL.md (+ referensfiler)
ur plugin-cachen och följa stegen ordagrant — aldrig improvisera
fram skillens jobb utan dess instruktioner, aldrig studsa ordern
som "kan inte köras".

### L307 [UNIVERSAL] — Side effects hör i event-handlern, aldrig i setState-updatern

Datum: 2026-07-22 (S76) | Källa: TASK-29 rail-dragningen
(persistens-skrivningen låg i setPos-updatern; React kör updaters vid
flush EFTER senare synkrona handlers — dubbelklickets removeItem
kördes först, varpå updaterns setItem ÅTERSKREV nyckeln;
rött-först-fångad i L304-skriptet, läkt med ref-speglad position +
synkron persistens i pointerup-handlern) (klass: React-mekanik)

En setState-updater är en REN beräkning som React schemalägger — den
kan köras efter andra handlers i samma interaktionskedja (och
dubbel-köras i StrictMode). Side effects i updatern (localStorage,
API-anrop, DOM) exekverar därför i fel ordning relativt synkrona
handlers. Formen: spegla interaktionstillståndet i en ref (L300-
grannmönstret) och utför side effecten SYNKRONT i event-handlern;
updatern får bara returnera nästa tillstånd.

### L308 [UNIVERSAL] — Dev-överlägg namnges UTANFÖR appens namn-rymd — frånvaro-assertions ser även dev-UI

Datum: 2026-07-22 (S76) | Källa: TASK-29 leverans 1 CI-röd
(run 29933197540: pill-knappen "Visa prototyp-växlaren" träffade
appens frånvaro-assertion `getByRole('button', { name: /^Visa/ })
.toHaveCount(0)` — testet asserterar att GAMLA app-kontroller är
borta, men dev-växlaren monteras i dev-läge där e2e kör; rail-formen
läkte strukturellt genom ikon-knappar utan app-verb) (klass:
test-kontrakt)

E2E-sviter kör i dev-läge → dev-grindade överlägg (växlare,
debug-paneler) EXISTERAR i testets tillgänglighetsträd. Varje
frånvaro-assertion (toHaveCount(0) på namn-regex) är därmed ett
KONTRAKT även mot dev-verktygens accessible names. Namnge dev-UI
utanför appens verb-/namnrymd (ikoner + beskrivande fraser, inte
app-kommandon som "Visa …"), och sväng regex-namn-assertions mot
dev-överläggens namn vid varje ny dev-yta.

### L309 [UNIVERSAL] — Bakgrundstaskens exit är WRAPPERNS exit — vaktens kod skrivs till fil och läses därifrån

Datum: 2026-07-22 (S76) | Källa: TASK-29 CI-vakten (bakgrundstasken
rapporterade "completed exit 0" medan output-FILEN bar
`CI_VAKT_EXIT=1` — kommandot slutade med echo/view som åt vaktens
kod; run 29933197540 var RÖD; fångad vid fil-läsningen, halt-first
tillämpad; pipe-klassens femte skepnad men EGEN mekanism:
efterföljande kommandon, inte pipe) (klass: shell-mekanik)

Ett bakgrundskommando med flera steg rapporterar SISTA stegets exit
som task-status — varje echo/vy-kommando efter vakten maskerar
grindens utfall. Formen: vakten skriver sin exit-kod till EGEN fil
(`echo "EXIT=$?" > vaktfil` direkt efter grind-kommandot) och
konsumenten LÄSER filen före beslut; task-notifikationens "exit 0"
är aldrig grind-bevis. Samma disciplin som L297 (exit-kodad kedja)
och L280 (exit binder steget) — utsträckt till bakgrunds-formen.

### L310 — UI som Marcus konsumerar bär design-review-grind — även dev-verktyg; Done före hans blick är för tidig

Datum: 2026-07-22 (S76) | Källa: TASK-29 (kortet saknade mänsklig
DoD-grind → Code flippade Done efter grön CI; Marcus granskning kom
EFTER och gav tre vågor [rail-formen · polervågen · mikrocopy-vågen]
— kortet fick återöppnas per våg; session-end hann dessutom köras
före godkännandet) (klass: process/DoD-design)

ADR-071:s granskningsfärdig-läge är villkorat på att kortet BÄR en
mänsklig DoD-grind — men grinden måste SÄTTAS när kortet föds. Regeln:
varje kort vars leverans är UI som en människa ska ANVÄNDA (inklusive
dev-verktyg med Marcus som användare) får design-review som
DoD-extra-rad vid födseln → kortet stannar i granskningsfärdig-läge
och Done-flippen är människans. Auto-Done reserveras för ytor utan
mänsklig konsumtion (API-kontrakt, skript, docs). End-pass körs inte
förrän sessionens UI-leveranser är granskade eller uttryckligen
defererade.

### L311 — [UNIVERSAL] CI:s headless-browser bär overlay-scrollbars: VISUELLA hopp-asserts är strukturellt vakuösa där

Datum: 2026-07-23 (S75 review-våg 2) | Källa: vy-växlingshoppet — ett
x-koordinat-assert stod STILLA mot ofixad kod i CI, bevisat av
rött-först-runnet 29993773642 (klass: test-design/miljö)

Overlay-scrollbars tar noll layoutplats, så ett test som mäter om
innehållet flyttar sig i sidled kan aldrig falla i CI — oavsett hur
trasig regeln är. Ett grönt sådant test är alltså inget bevis.
`scrollbar-gutter` RESERVERAR däremot plats även i den miljön, vilket
gör COMPUTED STYLE till den bevisbara formen för skal-CSS-regler.
Regeln: kontrakt på en CSS-regel mäts på regeln (computed), inte på
dess visuella konsekvens; den visuella mätningen får stå kvar som
skydd i klassisk-scrollbar-miljöer men räknas aldrig som CI-beviset.

### L312 — [UNIVERSAL] Tredjeparts-bibliotek sätter INLINE-stilar som river skal-CSS — author-`!important` är den specificerade motmedicinen

Datum: 2026-07-23 (S75 review-våg 6) | Källa: React Arias
`usePreventScroll` satte inline `scrollbar-gutter: stable` på `<html>`
vid varje overlay-öppning och rev vår symmetriska `both-edges` →
sidan hoppade 5,5 px (centrerat) / 11 px (vänsterställt) i varje
select, popover och modal i appen (klass: arkitektur/CSS-kaskad)

En riven skal-regel ser ut som en ny bugg men är en KASKAD-konflikt:
inline-deklarationer slår all vanlig author-CSS. Enda nivån som
besegrar dem är author-`!important` — det är exakt vad undantaget
finns till för i CSS Cascade, inte en lukt. Regeln: när en skal-regel
mystiskt "slutar gälla" i vissa lägen, LÄS BIBLIOTEKETS KÄLLA efter
inline-stilsättning innan du felsöker din egen CSS; och försvara
invarianten med scoped `!important` + dokumenterat motiv i stället för
att bygga runt symptomet. Fixa aldrig ett kaskadproblem med mer
specificitet — det förlorar mot inline varje gång.

### L313 — [UNIVERSAL] "Död yta" måste verifieras mot HELA konsument-grafen — inte mot den yta man råkar titta från

Datum: 2026-07-23 (S75 TASK-18.13) | Källa: rivnings-kortet listade tre
ytor som döda; typecheck fällde borttagningen med tre TS-fel — alla tre
hade levande konsumenter (klass: refaktorering/scope)

Kortets noter var skrivna ur EVENTSIDANS perspektiv ("oåtkomliga från
eventsidan") — sant, men inte hela bilden: närvaro-routen var
check-in-ingångens medvetet valda interim-mål, och anmälda-routen var
länkmål för varje rad i en helt annan vy. Regeln: innan en yta rivs,
sök hela repot efter dess route-sträng OCH dess komponentnamn, och läs
varje träff — "ingen länkar hit längre" är en hypotes tills grafen är
genomsökt. Typkontroll är den billigaste mekaniska fångsten: riv först,
låt kompilatorn tala, återställ vid protest.

### L314 — [UNIVERSAL] `gh run list --commit` matchar bara FULLSTÄNDIG SHA — förkortad ger noll träffar

Datum: 2026-07-23 (S75) | Källa: CI-vakten rapporterade "ingen run
skapad" på en commit vars run existerade och var grön; vakten matades
med 7-teckens SHA (klass: verktyg/falsklarm)

Filtret jämför mot `head_sha` exakt. En förkortad SHA ger tom lista,
vilket läser precis som "workflowen triggade aldrig" — och den
felläsningen är dyr, eftersom den ser ut som en infrastruktur-incident.
Regeln: alla skript och vakter som frågar efter runs använder
`git rev-parse <ref>`, aldrig den korta formen. Vid noll träffar:
verifiera SHA-formen FÖRE du drar slutsatsen att runnet saknas.

### L315 — [UNIVERSAL] Bakgrundsvakters git-operationer måste vara BRANCH-EXPLICITA

Datum: 2026-07-23 (S75 våg 4–5) | Källa: två parallella fix-vågor med
bakgrundsvakter som körde `git push`/`checkout` utan branch-argument
medan förgrundsarbetet bytte branch (klass: automation/race)

En vakt som lever över tid delar arbetsträd med det arbete den vaktar.
Plain `git push` betyder "nuvarande branch" — vilket är en annan branch
än när vakten startade. Regeln: varje git-operation i en bakgrundsvakt
namnger sin branch/remote explicit (`git push origin <branch>`), och
vakten läser hellre tillstånd via `gh`-API än via arbetsträdet.

### L316 — [UNIVERSAL] Primitivens EGNA defaults är del av kontraktsytan

Datum: 2026-07-23 (S75 p15) | Källa: ett kontrakt mätte font-weight 500
där konsumenten inte satt någon vikt alls — värdet kom ur primitivens
inbyggda stil, så "fixen" i konsumenten kunde aldrig få testet grönt
(klass: test-design/komponentbibliotek)

När ett kontrakt mäter en computed egenskap på en komponent mäter det
SUMMAN av primitivens default och konsumentens override. Regeln:
inventera primitivens egen stil FÖRE du skriver toleransen eller
förväntan — annars skriver du ett kontrakt mot fel lager, och fixen
måste landa i primitiven även när felet observerades i konsumenten.

### L317 — Tvåcommit-SHA-formens röda varv uteblir om PR:en öppnas EFTER fix-committen

Datum: 2026-07-23 (S75 review-våg 7) | Källa: kontrakt-commit och
fix-commit pushades i följd, PR öppnades sist → CI startade först på
fix-committen; rödheten finns bara lokalt (klass: process/bevisform)

Rött-först-beviset i CI hänger på att ett run FAKTISKT kör den röda
committen. På en ny branch triggar bara PR-eventet — så ordningen är:
pusha kontraktet → ÖPPNA PR:en → invänta det röda runnet → pusha
fixen. Görs det i fel ordning är SHA-separationen kvar i historiken men
CI-beviset saknas, och det ska då sägas rakt ut i leveransen i stället
för att låta formen se komplett ut.

### L318 — [UNIVERSAL] Deploy-verifiering är en EGEN grind: mockade e2e döljer drift mellan kod och deployad backend

Datum: 2026-07-23 (S75 STALE LÄGE) | Källa: batchen ändrade 10 Edge
Functions men bara 3 deployades; granskningen skedde mot gamla
svars-shapes och CI var grönt hela tiden (klass: leverans/miljö)

E2e som mockar nätverkslagret bevisar klientens beteende mot ett
KONTRAKT — aldrig att kontraktet är utrullat. Regeln: när en leverans
ändrar server-kod hör "deployad i den miljö granskningen sker mot" till
leveransens definition av klar, och verifieras mot miljön (versions-
eller shape-läsning), inte mot testsvitens färg.

### L319 — Actions-instabilitet uppträder i KLUSTER — vakter behöver rerun-medvetenhet, inte bara röd/grön-läsning

Datum: 2026-07-23 (S75) | Källa: tre anomaliformer samma dygn —
fördröjd run-skapelse (~8 min), jobb-API som släpade efter run-avslut,
och en cancelled körning; dessutom en jobb-timeout som RAPPORTERAS som
`cancelled` (klass: CI/observabilitet)

En vakt som bara läser slutstatus feltolkar infrastruktur som
leveransfel. Två konkreta läsregler: `cancelled` kan betyda
jobb-timeout (jämför jobbets start/slut mot `timeout-minutes` innan du
tror på "avbruten"), och röda tester som retryas tre gånger med
spårfångst kan ensamma skjuta ett jobb över taket. Vakter ska kunna
skilja infrastruktur från innehåll och föreslå `gh run rerun --failed`
i stället för att larma.

### L320 — [UNIVERSAL] Kontrakt på visuell likhet, inte på tal-identitet

Datum: 2026-07-23 (S75 p15 + skal-kontraktet) | Källa: en udda
containerhöjd kan aldrig ge exakt symmetri — ett assert på exakt
likhet fälldes av en halv pixel (klass: test-design)

Layout räknas i subpixlar och avrundas per browser. Ett kontrakt som
kräver `a === b` på renderade mått är därför skört utan att vara
strängare. Regeln: mät mot en TOLERANS som uttrycker kravet
("visuellt omärkbart" ≈ ≤ 1 px) och skriv motivet i testet, så att
nästa läsare inte "skärper" det tillbaka till identitet.

### L321 — [UNIVERSAL] En deferral utan återbesöks-bärare är en tyst permanent

Datum: 2026-07-23 (S77) | Källa: ADR-029 § Medvetna utelämningar #5
(branch protection) stod 2026-05-13→2026-07-23 med färdigbyggd
landningsbana (aggregatorn döpt "branch-protection-required-stable")
och återupptogs först av en EXTERN processanalys (klass:
process/deferral)

En medveten utelämning som bara dokumenteras i ADR-prosa ("kan
utvidgas vid framtida aktivering") har ingen mekanism som tar den
tillbaka till ytan: frusen beslutstext läses inte om, och till
skillnad från LIFT-noter i kod — som återses varje gång filen rörs —
passerar inget framtida arbete genom en ADR:s utelämningslista.
Priset här: repots största säkerhetslucka stod öppen i två månader
medan allt som krävdes för att stänga den redan var byggt. Regeln:
varje deferral får en DURABEL återbesöks-bärare vid födseln — en
tråd-rad, en todo-post eller en lift-trigger med konkret villkor i en
yta som faktiskt passeras. "Vid framtida X" utan bärare är ingen
trigger; det är en önskan.

### L322 — [UNIVERSAL] En required check som kan skippas är fail-open — paraply-checken måste ALLTID köra och explicit faila

Datum: 2026-07-23 (S77 end-pass-incidenten) | Källa: PR nr 101
auto-mergades trots RÖTT docs-jobb — aggregatorn skippades av sitt
if-villkor och GitHub räknar en skippad required check som UPPFYLLD
(run 30023934304 → main-rött 30024005788, fångat av backstopen inom
minuter) (klass: CI/merge-grind)

GitHubs required status checks blockerar på failure och väntar på
expected — men en check-run med conclusion `skipped` uppfyller
kravet. En aggregator med `if: always() && !contains(needs.*.result,
'failure')` failar därför ALDRIG: vid rött skippas den, och skip är
grönt ljus för mergen. Regeln: en paraply-check som är required ska
ha `if: always()` ENSAMT och läsa needs-resultaten i ett steg som
exit:ar 1 vid failure/cancelled — signalen ska vara success ELLER
failure, aldrig frånvaro. Följdregel (L321-förstärkning): när en
medveten utelämning stängs, konsumera HELA dess text — utelämning #5
bar både "aktivera branch protection" och dual-signal-behovet
("explicit failure-signal överflödig utan automation som läser
den"); halva stängdes, andra halvan blev hålet. Fail-grenens
gate-proof är öppen bevis-skuld (T85 våg 2a). → BETALD S78 (task-36.1,
gate-proof.yml; positivt bevis + negativ self-test; se L323-not + T85).

### L323 — [UNIVERSAL] En do-work-subagent bär inte den asynkrona CI-svansen över sin kontext-livslängd — orkestratorn äger den

Datum: 2026-07-23 (S78, work-batch 36.1) | Källa: första do-work-subagenten
byggde gate-proof.yml + öppnade leverans-PR #107 + armerade auto-merge, men
RETURNERADE före CI-grön → gate-proof-avfyrningen + stängnings-PR:n nåddes
aldrig; kortet stod korrekt In Progress (inget halt) (klass: process/orkestrering)

do-work:s tvåstegs-stängning (leverans-commit → asynkron bakgrunds-CI-vakt →
stängnings-commit, L280) förutsätter en PERSISTENT session som kan återuppta
efter vakten. En engångs-subagent har ingen sådan återkomst: när den returnerar
sin schema-status avslutas kontexten, och allt bortom leverans-PR:n (CI-vänta,
merge-verifiering, ev. gate-proof-avfyrning, stängning) faller. Regeln för
work-batch i sekventiell form: subagenten bygger + lokal-verifierar + öppnar
leverans-PR + armerar auto-merge + RAPPORTERAR — och STOPPAR där; orkestratorn
(persistent session) äger CI-vänta + merge + stängning. Det är parallell-formens
ADR-073-steg-4-rollfördelning tillämpad SERIELLT. do-work-skillens "driv till
stängd commit" gäller alltjämt — men i batch ligger svansen hos orkestratorn,
inte hos den friska subagenten. Kontraktets "oberoende disk-verifiering per kort"
räddade läget: orkestratorn litade aldrig på agentens ord, disk-verifierade det
faktiska tillståndet och slutförde svansen.

### L324 — [UNIVERSAL] En skivas risk-klass bestäms av vad den MÅSTE röra eller duplicera — inte av var dess fil bor

Datum: 2026-07-23 (S78, batch-planeringen) | Källa: 36.2 (nattnätet) klassades
"additiv lågrisk, fil-disjunkt" ihop med 36.1/36.5 — men nightly måste köra
ci.yml:s FULLA jobb-uppsättning, så den kräver antingen ci.yml-reusable-refaktor
(en källa) eller jobb-duplicering (andra-källa-drift), och är därmed ci.yml-klass
oavsett att den kan bo i egen fil (klass: process/skivning)

Att en skiva får en EGEN fil säger inget om dess risk-klass. Fil-hemvisten är en
placerings-fråga; risk-klassen bestäms av vad skivan är TVUNGEN att röra eller
hålla i synk för att fungera. En "egen fil" som måste duplicera eller anropa den
mest känsliga delade filens innehåll ärver den filens känslighet. Klassa en skiva
efter dess tvingade beroenden (vad den måste röra/duplicera/hålla-i-synk), inte
efter var dess primära artefakt hamnar — annars hamnar en känslig skiva i fel
batch-fack. Praktisk följd: nattnäts-/dedup-/klassnings-arbetet (36.2/36.3/36.4)
är ETT sammanhängande ci.yml-arbete under direkt hand, inte en additiv subagent-batch.

### L325 — [UNIVERSAL] GitHub Actions pull_request-cache är merge-ref-scopad och osynlig för main-push-runs — cache-baserad cross-trigger-dedup fungerar inte

Datum: 2026-07-23 (S78, cache-dedupen falsifierad) | Källa: design-dokets
merge-dedup byggde på "gröna PR-runs skriver cache-nyckel, main-push-runs läser"
— web-research mot GitHub Docs (*Restrictions for accessing a cache*) falsifierade
den FÖRE bygget (klass: CI/plattform)

GitHub Docs verbatim: "When a cache is created by a workflow run triggered on a
pull request, the cache is created for the merge ref (refs/pull/.../merge) …
can only be restored by re-runs of the pull request" + "Workflow runs cannot
restore caches created for child branches or sibling branches." En cache skriven
av en pull_request-run är alltså OSYNLIG för main-push-runnen som skulle läsa den
— en cache-baserad dedup mellan de två triggrarna ger PERMANENT cache-miss: noll
besparing, en onödig skrivning per PR, och INGET synligt fel (grön CI, tyst
utebliven vinst). Regeln: verifiera cache-branch-scoping mot förstapartsdok före
varje cache-baserad cross-trigger-design; en overifierad extern-plattforms-antagelse
kan se grön ut och tyst utebli (web-research-disciplinen i praktiken). Ersättaren
här är innehållsadresserad utan lagring: main-runnen läser `HEAD^2` (mergade
PR-headen), verifierar tree-ekvivalens och frågar `gh run list --commit <full SHA>`
om den redan har en grön run — bevisad mot disk + API före förslag (task-36.4).

### L326 — [UNIVERSAL] Ett anropat reusable workflow kan inte eskalera anroparens token-permissions — varje anropare måste sätta taket, och en spike måste spegla den VERKLIGA säkerhets-posturen

Datum: 2026-07-23 (S79, task-36.2 reusable-refaktorn) | Källa: två skarpa
`startup_failure` när `ci.yml` + `nightly.yml` anropade nyextraherade
`ci-suite.yml` — verifierat mot GitHub Docs *Reuse workflows* (klass:
CI/plattform + spike-metodik)

GitHub Docs verbatim: "Permissions can only be maintained or reduced—not
elevated—throughout the chain." Ett anropande jobb (`uses: ./…/reusable.yml`)
ärver anroparens token-permissions (jobb-nivå, annars workflow-topp-nivå), och
det anropade workflowets jobb kan bara BEHÅLLA eller MINSKA — aldrig eskalera.
Konsekvens med least-privilege-golvet (`permissions: {}` på topp-nivå, ADR-029
§4): ett anropat jobb som deklarerar `contents: read` (för checkout) blir en
ESKALERING → `startup_failure`. Fixen är att anropar-JOBBET grantar taket
(`permissions: { contents: read }`) — normala jobb får åsidosätta topp-nivån
fritt (`lint` gör det redan), men reusable-KEDJAN cappas.

Tre lärdomar i en, alla dyrköpta samma session:

1. **Diagnos-blindheten är total.** `startup_failure` skapar INGA check-runs,
   INGA jobb-logs, och API-annotationerna är 404/tomma. Varken
   `run --log`, `/annotations`, `check-runs` eller GraphQL gav feltexten. Det
   som knäckte rotorsaken var SPIKE-KONTRASTEN (working vs failing) +
   dokumentations-verifiering — inte log-läsning. Regeln: när en workflow dör
   före jobb-skapelse, jämför mot en känd-grön minimal-variant och läs
   plattformsdoket; jaga inte icke-existerande logs.

2. **En av-riskande spike måste spegla den VERKLIGA säkerhets-posturen.**
   Spiken (run 30036119790) bevisade `workflow_call` + `secrets: inherit` +
   job-nivå `queue: max` i reusable-kontext — men dess reusable-jobb bar
   `permissions: {}`, exakt förenklingen som MASKERADE buggen. En spike med
   förenklad postur ger falsk trygghet: den bevisar mekaniken men döljer den
   klass av fel den skulle fånga. Spikens jobb ska bära samma permissions,
   samma secrets-behov och samma checkout som det skarpa målet.

3. **Fixen måste appliceras på VARJE anropare — self-review missar den andra.**
   `ci.yml`-fixen (PR #112) täckte första anroparen; `nightly.yml` (andra
   anroparen, samma reusable) hade identiskt fel och gav ett andra
   `startup_failure` på första nightly-dispatchen. Self-review-fångst är ~9 %
   (konstitutionen); det var CI (nightly-dispatchen) som fångade det. Regeln
   vid en reusable-extraktion: greppa ALLA `uses: ./…/<reusable>` och verifiera
   permissions-taket på var och en i samma pass — behandla anropar-mängden som
   en checklista, inte en punkt.

Komplement: L322 (fail-closed genom refaktorn — jq-logiken byte-identisk, bara
`needs`-listan omkopplad; gate-proof-repliken förblev giltig) + L325 (samma
våg, cache-rivningen).

### L327 — [UNIVERSAL] Bot-PR-kedjan har TVÅ plattformsgrindar utöver koden — repo-inställningen och event-beteendet — och båda måste bevisas empiriskt, inte bara doc-läsas

Datum: 2026-07-24 (S81, task-36.7 baseline-workflowen) | Källa: två skarpa
run-utfall (30079692827 fail + 30081586584 direkt-kö) mot GitHub Docs
GITHUB_TOKEN-sidan (klass: CI/plattform + verifikations-metodik)

Ett workflow som ska öppna en PR med `GITHUB_TOKEN` möter två grindar som
inte syns i workflow-koden:

1. **Repo-inställningen** "Allow GitHub Actions to create and approve pull
   requests" (API: `actions/permissions/workflow` →
   `can_approve_pull_request_reviews`) är AV per GitHub-default. Utan den
   failar `gh pr create` med "GitHub Actions is not permitted to create or
   approve pull requests" — EFTER att generering + push lyckats (halvvägs-
   utfall: branch utan PR). Minsta vidgning: slå på flaggan men behåll
   `default_workflow_permissions: read`; i ett repo vars ruleset kräver 0
   approvals är approve-halvan verkningslös och create-halvan allt som ges.
2. **Event-beteendet:** förstapartsdok säger att GITHUB_TOKEN-skapade PR:er
   får sina pull_request-runs i approval-required-läge ("Approve workflows
   to run"). EMPIRIN visade annat: runnen gick direkt till kö utan banner
   (trolig interaktion med inställningen i punkt 1). Designen som förlitade
   sig på approval-bannern som mänsklig grind bar därför fel mekanism —
   den verkliga grinden är ruleset + merge-beslutet.

Regeln: en plattformsmekanism som ska BÄRA en processgrind bevisas med en
skarp körning innan designen bokförs som färdig — doc-läsning räcker inte
ens när dokumentet är förstaparts och färskt (jfr L325: samma klass, cache-
scoping). Avvikelsen dokumenteras öppet där mekanismen beskrivs.
Bikupa-fynd i samma kedja: `git status --porcelain` kollapsar en helt
ospårad katalog till EN rad — räkna filer med `-uall`.

### L328 — [UNIVERSAL] Strict required checks + heterogena CI-tider + parallella landningar = BEHIND-svält för långsamma PR:er

Datum: 2026-07-24 (S81, PR nr 133) | Källa: tre BEHIND-varv mot parallella
docs-landningar (PR nr 132/134/135, ~15 min-kadens) innan konvergens på
fjärde försöket (klass: CI/process)

Med "require branches to be up to date" (strict) på required-checken måste
en PR:s branch innehålla main-toppen vid merge. En PR vars svit tar ~10 min
(full klass, staging-mutex) förlorar då RACET mot varje parallell docs-PR
(~1 min CI): main flyttar sig under sviten → BEHIND → `gh pr update-branch`
→ ny 10-min-svit → main har flyttat sig igen. Tre varv i S81 innan den
parallella strömmen sinade.

Mönstret är strukturellt, inte otur: svält-risken växer med (svit-tid ×
parallell landnings-frekvens). Mitigering i stigande styrka: (a) acceptera
loopen när parallellströmmen är ändlig (S81-fallet — kostnaden är väntetid,
inte fel), (b) sekvensera medvetet: landa snabba docs-PR:er FÖRE eller
EFTER den långsamma, inte under dess svit-fönster (parallell-sessioners
landningsdisciplin), (c) om klassen blir kronisk: GitHub merge queue är
branschverktyget byggt för exakt detta. Strict-kravet är RÄTT (grinden
bevisar main+PR-kombinationen) — lösningen är landnings-koordinering,
aldrig att släppa strict.

### L329 — [UNIVERSAL] `claude plugin list` läser enable-status per projekt-path — distributions-verifiering körs från huvudkatalogen

Datum: 2026-07-24 (S82-konversationen, T86-aktiveringen) | Källa:
1.20.0-distributionen visade `✘ disabled` när list kördes med cwd i en
git-worktree under `.claude/worktrees/`, men `✔ enabled` från
huvudkatalogen (klass: plugin-distribution, T18)

Install-recordet är user-scope (ADR-035) men enable-flaggan läses per
projekt-identitet = path; en worktree-path räknas som eget projekt utan
enable-post. S76-praxisens list-verifiering efter versionsbump ger
därför falskt larm om den körs från en worktree. Regeln:
verifierings-steget (`claude plugin update` + `claude plugin list`)
körs alltid med huvudkatalogen som cwd; en `✘ disabled` från en
worktree är en läs-artefakt, inte ett distributions-fel — verifiera
från huvudkatalogen innan åtgärd (samma anti-hypotes-disciplin som all
felsökning).

### L330 — [UNIVERSAL] Select-fält med tidsbundna optioner är en tickande skrivgräns — verifiera write-mål mot select-OPTIONERNA, inte bara fält-existensen

Datum: 2026-07-24 (S84, T40-prod-smoken) | Källa: create-event 500:ade
i prod på 2027-datum — `Månad/år` är singleSelect vars optioner slutar
"December 2026"; server-koden härleder värdet ur Startdatum och skriver
utan typecast → okänd option avvisas (fälla 45; klass:
datamodell/write-verifiering)

Pre-flighten korsverifierade att alla FÄLT som EF-koden skriver FINNS i
prod — men ett select-fälts skrivbarhet beror också på att VÄRDET finns
bland optionerna, och tidsbundna optioner (månader, år, terminer) gör
gränsen rörlig: koden är korrekt idag och 500:ar när kalendern passerar
options-horisonten. Regel: en write-mål-verifiering av select-fält
omfattar options-rymden (describe_table), och varje select vars
optioner är tidsserier flaggas som designdefekt (rätt form: härledd
formel eller fritext). Staging kan dölja fällan — testdatum väljs
typiskt inom nuvarande horisont.

### L331 — [UNIVERSAL] Deny-kontraktets form per endpoint härleds ur källkoden, inte ur klass-mallen — samma svit kan bära olika vakt-ordning per funktion

Datum: 2026-07-24 (S84, deny-triplen ×13) | Källa: "fel metod→405"
gällde 6 av 13 EF:er; övriga 7 saknar egen metod-vakt och auth-vägrar
först (401) — förväntans-mallen från 6f/6g-precedenten gav 7 falska
röda tills källkoden lästes (klass: verifiering/smoke-design)

En bevisform etablerad på en delmängd (create-event/save-segments
deny-triple) är inte automatiskt hela svitens kontrakt — vakt-ordning
(metod-check före/efter auth) är per-funktions-kod, inte klass-egenskap.
Regel: innan en förväntan skrivs per endpoint, läs vaktens faktiska
ordning i källan och koda förväntan därifrån; en avvikelse klassas
sedan medvetet (här: 401 är fortfarande korrekt DENY — asymmetrin blev
hygien-kort, inte smoke-fel). Generaliserar L204-familjen: kontraktet
bor i artefakten, inte i mallen.

### L332 — [UNIVERSAL] Diff mot nedladdad deployad artefakt kräver bundlings-klassning — "Only in disk" är oftast artefakt av selektiv bundling, inte drift

Datum: 2026-07-24 (S84, T39-pre-flighten) | Källa: rå fil-räkning gav
"4–12 _shared-filer diffade" per EF; efter klassning (DIFFAR vs
BARA-PÅ-DISK) var verklig drift 0–2 filer — bundlern inkluderar endast
importerade filer, så disk-filer utanför funktionens import-graf är
inte deployad-kod-skillnad (klass: deploy-forensik)

När deployad kod hämtas och diffas mot disk-HEAD måste diffen delas i
tre klasser: (a) filer i BÅDA som skiljer = verklig drift, (b) bara i
artefakten = borttaget/ej längre importerat, (c) bara på disk = utanför
import-grafen ELLER nytt beroende som nästa deploy tar med. Utan
klassningen överskattas drift grovt (här: versionsgapet antydde "allt
driftat", innehållet visade 4 EF:er + två delade filer, tre rena
no-ops) — och sync-beslut fattas då på fel riskbild. Verktygsoberoende:
gäller varje selektivt bundlad artefakt (EF, lambda, container-lager).

### L333 — [UNIVERSAL] Prototypkod committas per ITERATION, inte per pass — arbetsträdet är ingen förvaring

Datum: 2026-07-24 (S83 pass 4) | Källa: dagens 18.18-iterationer skrevs
över av `git restore --source=<proto-branch>` och gick förlorade;
arbetsträdet var enda kopian (klass: dataförlust, kastbar kod)

"Kastbar" betyder att koden kastas NÄR PASSET ÄR KLART — inte att den
får förloras mitt i. Passets egen konvention var redan rätt (SHA per
iteration: 17.7 `0eba03b`, 18.15 `eda160f`, 18.17 `5437fb1`), men
efterlevdes inte efter en session-paus. Under ett pass som blandar
prototyp-iteration med PR-arbete på skarpa filer sker branch-växlingar
löpande, och varje växling är ett tillfälle att förlora ocommittat
arbete.

Regeln: **varje Marcus-kvitterad iteration får en commit på
proto-branchen innan nästa påbörjas**, och agenten står PÅ
proto-branchen under passet i stället för på main — då hamnar commits
rätt utan att någon behöver komma ihåg det. Bonus: prototyp-SHA:erna
blir en gratis iterationslogg för fångst-sekvensen.

### L334 — [UNIVERSAL] `git restore --source` / `git checkout <ref> -- <path>` är destruktivt — ett kommando som var rätt i ett tidigare läge kan vara fel nu

Datum: 2026-07-24 (S83 pass 4) | Källa: TVÅ dataförluster samma pass —
handoffens återställningskommando kördes om senare (skrev över dagens
iterationer), och `git checkout proto/... -- tasks/ backlog/` skrev över
hela fångst-arbetet (klass: dataförlust, handoff-artefakter)

Det första kommandot kom ur ett HANDOFF-block och var korrekt vid
resume-tillfället — arbetsträdet var då tomt. Senare i samma session,
med timmar av ocommittat arbete i trädet, var samma kommando
destruktivt. Det andra var Codes eget, och gjorde samma sak igen inom
en timme trots att L333/L334 just formulerats — vilket i sig är
bevisningen: en lesson som bara är NEDSKRIVEN ändrar inte beteende
under pågående pass.

Regeln: före `git restore --source` eller `git checkout <ref> -- <path>`
— kör `git status` och verifiera att det som skrivs över antingen är
committat eller avsiktligt kastbart. Ett kommando kopierat ur ett
handoff-block ärver inte sin säkerhet. Och: dessa två kommandon har
ingen ångra-väg — reflog räddar commits, inte arbetsträd.

### L335 — [UNIVERSAL] HTTP 500 på en icke-idempotent POST betyder INTE att skrivningen uteblev

Datum: 2026-07-24 (S83 pass 4) | Källa: GitHub-incident — `POST /pulls`
svarade 500 samtidigt som PR:en faktiskt skapades; retry-loopen
fortsatte försöka (klass: extern-API-robusthet)

Vakten rapporterade "GAV UPP efter 60 min" medan PR #160 låg skapad och
mergad. Att GitHub avvisade de senare försöken med "No commits between
main and…" var tur — mot ett API utan den dedupen hade loopen skapat
dubbletter.

Regeln: en retry mot en icke-idempotent skrivning måste **läsa tillbaka
tillståndet först** (finns resursen redan?) i stället för att blint
försöka igen. 5xx säger att svaret uteblev, inte att operationen gjorde
det.

### L336 — [UNIVERSAL] Ett vaktskript som kan rapportera framgång utan att ha verifierat den är värre än ingen vakt

Datum: 2026-07-24 (S83 pass 4) | Källa: CI-vakt returnerade exit 0 vid
timeout → notifieringen sa "completed" fast PR:en låg OPEN; separat vakt
sa "GAV UPP" fast arbetet var klart (klass: verifierings-disciplin)

Två vakter i samma session gav motsatta felaktiga besked. Gemensam
nämnare: vaktens utsaga behandlades som fakta i stället för som en
hypotes om verkligheten.

Regeln: vaktens exitkod och filutdata är en SIGNAL, aldrig facit —
tillståndet verifieras mot auktoritativ källa (`gh pr view --json
state,mergedAt`) innan det rapporteras vidare. Och: timeout ska alltid
ge non-zero exit, aldrig 0. Detta är hypotes-verifierings-disciplinen
tillämpad på egna verktyg, inte bara på andras påståenden.

### L337 — Konventioner som bara lever i kodkommentarer överlever inte in i nästa agent-fönster

Datum: 2026-07-24 (S83 pass 4) | Källa: Code uppfann egen grammatik TVÅ
gånger inom en timme för mönster repot redan hade (månadsrubrikens form,
länkens vikt) — båda fångade av Marcus, ingen av self-review (klass:
kunskapsarkitektur; Marcus-order: "konventioner måste ju ha ett HEM")

Formklassen, chevron-grammatiken, slot-modellen och märkningsregeln bor
alla som JSDoc i enskilda komponenter. Det räcker så länge samma agent
med färsk kontext bygger — men inte över pass-gränser, och definitivt
inte för nattbyggets subagenter som saknar passets kontext.

Branschskiktningen (research 2026-07-24): design system-doc = SSOT för
visuellt språk · ADR = beslut + rationale · Storybook = SSOT för kodade
komponenter · kodkommentarer = "hur" för lokal logik, uttryckligen INTE
konventionsbärare. Hemvist-valet är ADR-bar klass och grillas i egen
session — men principen står: **en konvention utan hem är en konvention
som kommer att brytas.**

### L338 — [UNIVERSAL] En grön PR-run är en ögonblicksbild av omvärlden — main kan gå röd utan att repot ändrats

Datum: 2026-07-25 (S85) | Källa: S83:s stängnings-PR #168 — PR-runnen
grön, merge-runnen ~20 minuter senare röd på SAMMA träd (advisoryn
GHSA-mh99-v99m-4gvg publicerades 21:53Z, mellan körningarna; andra
advisory-blockaden på samma dygn efter js-yaml 16:47Z)

Audit-grinden slår upp beroendeträdet i en levande extern databas vid
VARJE körning. Grindens utfall är därför en funktion av (träd, omvärld,
tidpunkt) — inte av trädet ensamt. Konsekvenser: (1) röd main efter en
grön PR är inte automatiskt en trasig merge — läs VILKET jobb som föll
före felklassning (här: enbart audit-jobbet på en docs-only-diff); (2)
"samma innehåll var grönt nyss" är inget motbevis; (3) läkningen är en
framåt-landning (override/bump; allowlist-flödet endast när patch
saknas, ADR-028), aldrig re-run — databasen glömmer inte.
Sessionsstart-rutinens audit-status-koll är designad för exakt denna
klass: verifiera grinden FÖRE sessionens första landning.

### L339 — [UNIVERSAL] Asynkron URL-skrivning gör page.url() till en race i e2e — polla URL:en före strikt läsning

Datum: 2026-07-25 (S86 nattbygget, task-17.7) | Källa: review-pilotens fynd 4 +
tangentbordstestets flake under bygget

nuqs (och varje URL-state-bibliotek med throttlad/batchad history-skrivning)
uppdaterar React-state synkront men skriver URL:en asynkront (~50 ms throttle).
En e2e-assert som läser page.url() direkt efter en DOM-poll (toHaveCount et al.)
blir sann på state-uppdateringen FÖRE URL-flushen — intermittent rött i exakt
den skarv som bär URL-kontraktet. Mönstret: polla URL:en först
(await expect(page).toHaveURL(...) eller await expect.poll(() => new URL(page.url())...))
och läs strikt därefter. DOM-tillstånd och URL-tillstånd är två klockor;
testet måste vänta in den klocka det assertar.

### L340 — [UNIVERSAL] En workflow-subagent nås aldrig av asynkrona callbacks — väntan är bakgrundsvakt + blockerande avläsning i egen tur

Datum: 2026-07-25 (S86 nattbatchen) | Källa: v1-batchens enda fel — 17.7:s
do-work-agent parkerade sig på en Monitor-callback för CI-väntan och
avslutade sin tur; callbacken når aldrig en workflow-subagent, schema-returen
uteblev och orkestreringen felade trots att leveransen (PR #174) var komplett
(klass: orkestrerings-design; L323-repris — lessons konsulteras vid DESIGN,
inte bara vid retrospektiv)

Två miljöfakta om workflow-subagenter, båda empiriskt bevisade i natten:
(1) Monitor-verktygets callback levereras aldrig till dem; (2) TaskOutput
finns inte i deras verktygslista (fyra oberoende svans-agenter ToolSearch:ade
förgäves). En subagent som måste vänta på extern signal (CI-run, merge) får
därför ALDRIG avsluta sin tur i väntan — den håller sig aktiv med
bakgrundsvakt (gh run watch till loggfil, run_in_background) + avgränsad
foreground-avläsning på loggen/API:t och verifierar varje vakt-utsaga mot
auktoritativ källa (L336) innan den agerar. Dess sista handling är alltid
retur-kontraktet (StructuredOutput), även vid abort.

**AMENDERING 2026-07-25 (S87 städ-vågen) — `tail/grep -m1`-formen RIVS ÖPPET.**
Ursprungstexten erbjöd "tail/grep -m1 **eller** bounded poll" som likvärdiga
avläsningsformer. Den förra är trasig och lärdomen spred därmed felet: S86:s
fix-vågs-agent följde den och brände **23 min 30 s av 71 min** på död väntan.
`tail -f LOGG | grep -m1 MÖNSTER` kan aldrig avsluta i tid — `tail -f` släpper
aldrig pipen även när grep matchat, så en alarm-/timeout-wrapper brinner av hela
budgeten varje gång (bevis: `grep-exit: 142` i alla tre anropen TROTS att
`WATCH-EXIT: 0` syns i utdatan). Värst blev cykel 3: nio minuters väntan på en
körning som varit grön i sju minuter innan vakten ens startade.

Använd **`scripts/ci-wait.sh`** — inte ett handvirat idiom. Den gör bounded poll
mot `gh run view --json`, kontrollerar terminal-state **före första sömnen**
(cykel-3-buggen), och levererar **per-jobb-verdikt** som ADR-071 §2(iii)
faktiskt kräver, med skippade jobb explicit märkta som icke-bevis (L322).
Fail-closed: allt som inte är `success` eller `skipped` fäller. Testsvit:
`scripts/test-ci-wait.sh` (13 fall; T1 är regressionsvakten mot cykel-3-buggen
— rött-först-bevisad: trasig form 30 s, läkt form 0 s).

Generaliseringen bortom CI: **en väntemekanism vars avslutsvillkor inte kan
observeras av mekanismen själv är ingen väntemekanism — den är en timeout med
extra steg.** Kontrollera alltid om villkoret redan är uppfyllt innan du sover.

Orkestrerings-regeln (L323-formen i workflow-skript): dela kortet i
BYGG-agent (slutar vid armerad auto-merge, returnerar direkt — noll väntan)
och SVANS-agent (äger hela CI-kedjan: PR-run → merge → main-run per jobb →
bokförings-PR). v2-batchen körde 17 agenter i den formen: 0 fel, CI grön
första pass i samtliga led.

### L341 — [UNIVERSAL] Styla aldrig ett until-found-dolt element direkt — content-visibility döljer innehållet, inte elementets egen låda

Datum: 2026-07-25 (S86 granskningsvågen) | Källa: 17.7-fixen — filterpanelen
syntes som tom grå rand i stängt läge trots "dold" panel (klass:
biblioteks-mekanik; Marcus-fynd i morgongranskningen)

React Aria (useDisclosure) döljer stängd DisclosurePanel med
hidden="until-found" ⇒ content-visibility: hidden — INNEHÅLLET skippas ur
rendering, men elementets EGEN bakgrund, padding och kant renderas kvar som
en tom låda (skillnaden mot display: none). Visuella stilar
(bg/padding/rounded) direkt på panel-elementet ger därför en synlig rand i
stängt läge. Formen: panel-elementet lämnas ostylat och allt visuellt bor på
en INRE wrapper (försvinner med innehållet); rytm-avstånd bärs av wrapperns
margin — inte av gap på föräldern (gap:et står kvar runt det 0 px höga
panel-elementet). Gäller varje until-found-/content-visibility-mekanism,
inte bara RAC. E2e-låset: stängt läge assertas visuellt frånvarande
(not.toBeVisible + boundingBox-höjd 0), inte bara "innehållet borta".

### L342 — [UNIVERSAL] scrollbar-gutter på html förskjuter canvas-origo — body-portalerade absoluta overlays dubbelräknar offseten; positionerad body är läkningen

Datum: 2026-07-25 (S86 granskningsvåg 2) | Källa: Marcus-fyndet "väljar-
popovern högerförskjuten utanför innehållet" — grundorsaken isolerad
empiriskt i preview-mätloop (klass: CSS-canvas-geometri × overlay-
positionering; drabbar VARJE RAC-overlay i appen, inte bara väljaren)

`scrollbar-gutter: stable both-edges` på html flyttar canvas-origo åt höger
med rännstensbredden vid KLASSISKA scrollbars (Linux/Windows; uppmätt
+11 px i Playwright-chromium — html-boxens boundingClientRect.x ≠ 0).
React Aria (och varje bibliotek som mäter trigger via boundingClientRect
och sätter absolut `left` på en body-portalerad overlay) räknar i
VIEWPORT-koordinater — men browsern tolkar `left` från det förskjutna
canvas-origot → overlayn renderar +rännstensbredden fel. macOS
overlay-scrollbars maskerar felet (offset 0) — klassen syns först i CI
eller på Windows/Linux. Läkningen är EN rad: `body { position: relative }`
— body blir overlayernas containing block och positionerings-bibliotekets
container-gren kompenserar offseten korrekt (RAC calculatePosition tar
container-vägen i stället för viewport-vägen). Verifikationsform:
A/B-mätning av popover.x − trigger.x på bred (klassisk scrollbar) OCH smal
(gutter frånvarande) viewport — båda ska vara 0. Följdlärdom i samma pass:
mät ALDRIG textbredd (scrollWidth-klipptester) före `document.fonts.ready`
— fallback-metriken är bredare och ger falska klipp i CI.

### L343 — [UNIVERSAL] En linter körd med default-flaggor är inte grinden — grindens ANROP är kontraktet

Datum: 2026-07-25 (S87 städ-vågen) | Källa: PR #195 gick röd på
`shellcheck` trots att jag rapporterat "shellcheck GRÖN" tio minuter
tidigare (klass: falsk-grön verifiering; kostnad: en röd CI-cykel + en
fix-runda)

Jag körde `shellcheck scripts/ci-wait.sh` och fick tyst grönt. CI kör
`shellcheck --severity=style --enable=all`. Skillnaden är inte kosmetisk:
`--enable=all` slår på de OPTIONAL-checkar (SC2310, SC2312, SC2249) som
default-läget håller avstängda — och alla sex fynden låg i den mängden.
Min lokala körning var strukturellt oförmögen att se det grinden ser.

Det gäller varje verktyg med konfigurerbar stränghet: `shellcheck`
(`--enable`), `eslint`/`biome` (config-fil + `--max-warnings`), `vale`
(`MinAlertLevel`), `tsc` (`-p` mot rätt tsconfig), `markdownlint`
(globs + ignores). **Läs grindens faktiska anropsrad ur workflow-filen
och kör den, verbatim.** En parafras av grinden är ett antagande om
grinden.

Skärpning som gäller även när man tror sig ha kollat: jag HADE greppat
`ci.yml` efter "shellcheck" och sett raden `Install shellcheck (pinned
v0.11.0)` — men läste installations-steget, inte kör-steget. Att ha
träffat rätt fil är inte att ha läst rätt rad.

Formen som håller: kopiera grindens kommando till en lokal körning över
grindens FULLA fil-mängd (här: `scripts/*.sh .githooks/*
.checklist-policy.conf .frontmatter-policy.conf` — inte bara de filer man
själv rört, eftersom grinden inte är diff-scopad). Rapportera "grön" först
då.

### L344 — [UNIVERSAL] Orkestratorn får inte röra den delade arbetsytan medan en agent arbetar i den — branch-byten är kollisioner, inte bokföring

Datum: 2026-07-25 (S86 granskningsvågen; bärgad i S88) | Källa: under våg 2
checkade orkestratorn ut docs-brancher i huvudrepot (svar-fångstens landning)
medan fix-agenten arbetade där; agenten fann "arbetsträdet stod plötsligt på
main" och felattribuerade det till Marcus (klass: orkestrerings-disciplin;
ofarligt utfall denna gång — allt var pushat — men ren tur)

Sekventiell agent-form delar EN arbetsyta. Orkestratorns git checkout,
commit eller städning mitt i en agents körning är samma kollisionsklass
som två agenter i samma träd — agentens diff-, status- och branch-antaganden
invalideras tyst, och felattribueringen förorenar dess rapport. Regeln:
under en agents arbetsyte-fönster gör orkestratorn ENDAST läsningar mot
ytan; egna landningar går i EGEN worktree (docs-landningar är också
landningar) eller väntar tills agentens fönster stängt. Parallell-formens
worktree-disciplin (ADR-073) gäller alltså ÄVEN orkestratorn själv i
sekventiell form.

**Bärgnings-not (S88 2026-07-25) — och den sekundära lärdomen:** posten
mintades i S86:s stängning som `L343`, men landade aldrig. PR #192 fastnade,
S87 skrev om hela stängningen från main-sidan via PR #193, och numret `L343`
återanvändes då för shellcheck-lärdomen. Repo-brett grep på
`delade arbetsyt|arbetsyte-miss|felattribuerade` gav noll träffar i main
förrän denna bärgning — lärdomen var alltså osäkrad i tio timmar utan att
någon räkning visade det, eftersom L-serien såg obruten ut. Sekundär lärdom:
**en fastnad PR är osäkrat material tills dess delta är korsläst.** En
omskrivning från main-sidan bevarar inte automatiskt det som bara fanns i
grenen, och numren avslöjar det inte — bara innehålls-diffen gör det. Stäng
aldrig en övergiven PR utan att först diffa den mot det som faktiskt landade.

### L345 — [UNIVERSAL] Ett grönt grind-kvitto gäller en commit, inte en session — och ett jobb är alla sina grindar

Datum: 2026-07-25 (S88) | Källa: PR #202 gick röd på Vale sedan jag ändrat
ett trådkort efter min senaste prosa-körning (klass: föråldrat kvitto;
kostnad: en röd CI-cykel)

Jag hade kört `markdownlint-cli2` efter ändringen och `lint:prose` **före**
den. Båda var gröna — men den ena grönskan var från fel tidpunkt. CI kör
dem i **samma jobb** (`Docs link check`, som dessutom rymmer lychee), så
"jag körde grindarna" var sant om mängden och falskt om ögonblicket.

Två skärpningar, båda i L343:s släkt men distinkta:

1. **Kvittot är bundet till innehållet, inte till sessionen.** Varje ny
   redigering ogiltigförklarar alla tidigare grindkvitton på den filen.
   Kör om efter sista ändringen — inte efter den näst sista.
2. **Ett CI-jobb är alla sina steg.** Att ha kört *en* av jobbets grindar är
   inte att ha kört jobbet. Ta reda på vilka verktyg som delar jobb innan du
   rapporterar det grönt: här låg lychee, markdownlint och Vale under samma
   namn, och bara ett av tre var faktiskt aktuellt.

Formen som håller: kör hela jobbets grindmängd som sista handling före
`git add`, efter att alla filer är i sitt slutliga skick.

### L346 — [UNIVERSAL] En testplan som frågar "hände det?" mäter mekanismen; frågar den "räcker resultatet?" mäter värdet

Datum: 2026-07-25 (S88, QA-vandringen task-36.8) | Källa: punkt 7 avslöjade
att nattlarmets commit-spann aldrig fungerat — en bugg som överlevt sedan
larmet byggdes två dagar tidigare (klass: testplans-design)

Larmkedjan hade "bevisats" en gång tidigare (ärende #114, S79) och betraktats
som verifierad. Den kontrollen frågade i praktiken *skapades ett ärende?* —
och svaret var ja. QA-punkt 7 ställde i stället frågan:

> "Läs ärendet som om du vaknat till det: räcker informationen för att veta
> var man börjar?"

Svaret var nej. Ärendets mest värdefulla fält — commit-spannet sedan senaste
gröna natt — sade "ingen tidigare grön nattkörning" trots att fem fanns.
Grundorsak: jobbet saknade `actions: read`, `gh run list` failade 403, och
ett `|| echo ""` svalde felet så att den mest alarmerande grenen valdes.
Samma text stod i #114 hela tiden; ingen hade läst den kritiskt.

Generaliserbart: **acceptanskriterier som beskriver mekanismen ("ett ärende
skapas", "jobbet blir rött", "mailet skickas") passerar även när innehållet
är värdelöst.** Kriterier som beskriver *mottagarens situation* ("räcker det
för att agera?", "vet man var man börjar?") kan bara passera om kedjan
fungerar hela vägen ut. Skriv minst ett sådant per mekanism som ska bära ett
mänskligt beslut.

Följdregel bekräftad i samma pass: **en simulering som ingen läser kritiskt
är inte ett bevis, den är en ritual.** Bevis-lägen (`simulate_failure`,
`simulate_missing`) är bara värda något om utfallet granskas som om det vore
skarpt.

---

### L347

**Ett fynd-korts SYMPTOM är observation — dess GRUNDORSAK är nästan alltid en
härledning. Skriv acceptanskriterier mot SKARPT UTFALL, aldrig mot mekanism.**
`[UNIVERSAL]`

**Empiri (S89, 2026-07-25):** tre fynd-kort ur samma QA-vandring byggdes i
följd. **Alla tre hade fel grundorsak.** Symptomen var korrekt observerade i
samtliga fall; det var steget från symptom till orsak som brast. Två av korten
bar dessutom stämpeln `GRUNDORSAK (bevisad)` — de var härledningar.

| Kort | Kortet sa | Verkligheten |
|---|---|---|
| TASK-51 | 403 för att `actions: read` saknas | Saknad `--repo` — anropet dog på repo-härledningen före behörighetsprövningen |
| TASK-49 | Ytkvoten 4,26× gäller generellt | 4,26× är *maxvärdet*; bilderna är fullPage, så ytan följer sidans höjd (2,37–4,26×) |
| TASK-50 | Två purges kolliderar utan mutex | Transient nätverksfel 1,5 s in, vid första listanropet, före någon delete |

**Vad som avgjorde skillnaden var AC-formuleringen, inte noggrannheten:**

- TASK-51 AC #1 — *"gh run list returnerar en SHA i skarp körning"* = **utfall**.
  Räddade fixen. En fix byggd på kortets diagnos passerade actionlint, yamllint,
  biome OCH ett eget gren-test — och löste ändå ingenting; den hade bara bytt
  lögnen mot ett ärligt *"kunde inte hämta spannet"*. Hade AC:t lytt "lägg till
  `actions: read`" vore kortet avbockat med buggen kvar.
- TASK-49 AC #3 — *"fångas av BÅDE desktop och mobil"* = **utfall**. Höll även
  när premissen om ytkvoten visade sig vara fel, eftersom kriteriet mätte
  resultatet och inte antagandet.
- TASK-50 AC #1 — *"alla jobb som muterar staging delar samma concurrency-grupp"*
  = **mekanism**. Att bocka av det hade byggt mutexen, rivit ett medvetet
  designval, och lämnat det verkliga felet kvar. Kriteriet var uppfyllbart utan
  att problemet var löst.

**Regeln:** ett AC som beskriver en ÅTGÄRD kan bockas av med buggen i behåll —
det ärver kortets diagnos som premiss. Ett AC som beskriver ett UTFALL kan bara
bockas av om problemet faktiskt är borta, oavsett om diagnosen var rätt.

**Följdregel:** när ett kort stämplar sin grundorsak "bevisad", kontrollera vad
beviset var. Symptom-observation + plausibel mekanism är inte bevis. Skarp
körning som visar felet är det.

Släkt: [[L346]] (testplaner som frågar "räcker resultatet?" mäter värdet;
"hände det?" mäter ritualen) — L347 är samma princip flyttad ett steg uppströms,
från testplan till acceptanskriterium.

---

### L348

**En kommentar som förklarar varför något SAKNAS är ett designval — läs den
före du "fixar" frånvaron.** `[UNIVERSAL]`

**Empiri (S89, TASK-50):** kortet ville lägga en concurrency-mutex på
purge-jobbet. Jobbet bar redan en kommentar som besvarade exakt den frågan:

> `# Ålders-guarden (60 min, .purge-staging-policy.json) skyddar in-flight-`
> `# körningar — därför behöver jobbet INTE staging-tests-mutexen.`

Åtgärden hade rivit valet utan att veta varför det fattades, inte löst det
observerade felet, och förlängt mutex-kön för allt annat — precis vad kortets
eget AC #3 oroade sig för.

Detta är CLAUDE.md:s pre-K-forensik tillämpad på en specifik och lätt missad
form: **frånvaro med motivering**. En saknad rad ser ut som en lucka, och en
lucka inbjuder till att fyllas. Skillnaden mellan lucka och designval står ofta
i koden intill — men bara om man läser den innan man skriver.

Operativt: innan du lägger till något som "saknas", greppa filen efter en
motivering till frånvaron. Finns den, är bevisbördan omvänd — det är nu du som
ska visa varför valet inte längre håller.

Släkt: [[L347]] (kortets diagnos är en härledning), [[L325]] (falsifiera öppet
i stället för att bygga vidare på ett antagande).

---

### L349

**En RAC-komponents ROLL bor på det dolda `<input>`, inte på träffytan — mät
form på ytan, tillstånd på inputen.** `[UNIVERSAL]`

**Empiri (S90, `task-48`, 2026-07-26):** markera-lägets kort byggdes som rå
React Aria Components-`Checkbox` (BorOverRad-precedenten). Testerna asserterade
`role` och `aria-checked` på det element `getByTestId('markerbart-kort')`
returnerar och gick **röda trots korrekt kod**. RAC renderar träffytan som en
`<label>` och lägger checkbox-rollen på en visuellt gömd `<input>` inuti:
labeln bär formen (bakgrund, kant, tillgängligt namn), inputen bär tillståndet.
Kostnaden var en hel testomgång innan formen förstods.

**Regeln, båda leden:**

- **Form** mäts på träffytan — `toHaveCSS('background-color', …)` på kortet.
- **Tillstånd** mäts på rollbäraren — `kort.getByRole('checkbox')` följt av
  `toBeChecked()`. Aldrig `aria-checked` på labeln.

**Generaliserar till varje RAC-komponent med dold input** (`Checkbox`, `Radio`,
`Switch`, `CheckboxGroup`-barn) och till alla bibliotek som bygger på samma
visually-hidden-input-mönster. Diagnos-signalen är specifik och värd att känna
igen: **ett rött roll-/tillstånds-assert på en komponent vars axe-körning är
grön betyder nästan alltid att selektorn pekar på fel nod** — inte att
a11y-wiringen är trasig. Axe läser trädet; selektorn läste bara ytan.

Släkt: [[L203]] (ankra e2e-selektorer i stället för att lita på att en
substring träffar rätt nod), [[L94]] (axe och DOM-forensik är skilda
evidenslinjer — de svarar på olika frågor).

---

### L350

**Ett 200-svar som inte är RENT är inte ett lyckat svar — grena på
utfallsklassen, aldrig på frånvaron av exception.** `[UNIVERSAL]`

**Empiri (S90, `task-48`, review-fynd 2):** batch-bekräftelsens Edge Function
svarar med fyra utfallsklasser i samma 200-kropp — `sent`, `partial`,
`failed`, `skipped`. Klientkoden skilde bara på "kastade fel" och "kastade inte
fel", så ett `partial`-svar behandlades som fullständig framgång: markera-läget
stängdes och urvalet nollades. För Lotta betydde det att tolv kort hade behövt
markeras om från början för att göra ett nytt försök på de som faktiskt
misslyckades — det värsta möjliga läget att kasta bort urvalet i.

**Regeln:** när ett API modellerar flera utfallsklasser i ett lyckat
HTTP-svar är `try/catch` bara halva grenen. Läs klassen ur kroppen och låt den
styra tillståndet: rent utfall stänger läget, allt annat behåller urvalet så
att användaren kan försöka igen på resten. `catch` bär fortfarande sin egen,
femte gren.

**Operativt kännetecken att leta efter:** ett svarsschema med en `failed`-,
`errors`- eller `skipped`-lista är en deklaration om att servern kan lyckas
delvis. Finns listan i kontraktet ska den finnas i klientens grenar och i ett
eget test — annars är den delvisa vägen otestad per konstruktion.

Släkt: [[L208]] (permissive-batch-svar: `errors` är frånvarande, inte tom, vid
noll rad-fel — samma familj av tysta delutfall), [[L347]] (mät utfallet, inte
mekanismen).

---

### L351

**En kategorisk guard som är fel i halva sitt tillämpningsområde kostar mer än
den skyddar — den får agenten att sluta leta.** `[UNIVERSAL]`

**Empiri (S90, 2026-07-26):** hubbens konstitution bar guarden *"Airtable MCP
kan INTE se automationer, interfaces, vyer, formulär eller extensions"*.
Påståendet är sant för `mcp__airtable__*`-servern och **falskt för
claude.ai-connectorn**, som exponerar `list_automations` och `get_automation`.
Följden var mätbar: A8:s ägarskap av `Avstämt` stod som öppen fråga i två
sessioner, och prototyp-passets divergens-README bokförde det som
referens-grundat i stället för live-verifierat — trots att verifieringen tog
minuter och var read-only. Guarden korrigerades i marcus-system PR nr 2.

**Varför just kategoriska guarder är dyra:** en guard är skriven för att stoppa
ett letande. Det är hela poängen. Men samma egenskap gör en felaktig guard till
en osynlig kostnad — den producerar inget rött, ingen varning och ingen
avvikelse. Den producerar bara frågor som stannar öppna, och ingen mekanism i
systemet upptäcker det.

**Regeln:** en guard som handlar om ett VERKTYGS förmåga ska bära sitt
giltighetsområde i själva texten — vilken server, vilken version, vilken
åtkomstnivå. Skriv "server X kan inte", aldrig "MCP kan inte". Och när en guard
råkar blockera exakt det du behöver: **pröva den en gång mot verkligheten innan
du accepterar den.** En guard är dokumentation, och dokumentation är en
hypotes med samma bevisbörda som alla andra.

Släkt: [[L294]] (en selektiv referens kan inte bevisa frånvaro — "finns ej"
kräver live-verifiering), [[L189]] (ett förbyggt schema är ett antagande tills
det korsats mot live).

---

### L352

**En Tailwind-variant i bas-strängen vinner över en villkorad grundklass —
tillstånds-signaler måste bära sin variant i VARDERA grenen.** `[UNIVERSAL]`

**Empiri (S90, `task-48`, review-fynd 6):** kortets bas-sträng bar
`contrast-more:border-(--mm-navcard-border-contrast)` och den villkorade grenen
bar `border-(--mm-success)` för valt tillstånd. Under `prefers-contrast: more`
vann varianten, och **valda kort fick den neutrala kortkanten** — exakt de
användare regeln finns för tappade urvals-signalen. Läkningen var att flytta
`contrast-more`-kanten in i båda grenarna, så att varje tillstånd bär sin egen
förhöjda kontrast.

**Varför den är svår att fånga:** defekten är osynlig för hela vår
grindapparat. Axe granskar inte tillstånds-differentiering under
media-preferenser, e2e läser den villkorade klassen och ser rätt token, och de
visuella snapshottarna körs utan `prefers-contrast: more`. Den syns bara för en
människa i rätt läge — eller genom att man vet regeln.

**Regeln:** en villkorad klass som ska överleva en media-variant måste
upprepa varianten i varje gren. Bas-strängen får bära det som gäller ALLA
tillstånd; så snart ett tillstånd ändrar samma egenskap är bas-varianten en
tyst överskrivning. Gäller varje Tailwind-variant med samma egenskaps-yta som
en villkorad klass — `contrast-more:`, `dark:`, `motion-reduce:`, `print:`.

Släkt: [[L94]] (a11y-beslut kräver korsning av flera evidenslinjer — den här
klassen syns i noll av de automatiska), [[L348]] (läs varför något ser ut som
det gör innan du ändrar det).

---

### L353

**När den öppna frågan är "vilken mönsterklass tillhör problemet" går
research-passet FÖRE prototyp-passet — annars divergerar man inom fel klass.**
`[UNIVERSAL]`

**Empiri (S90, check-in-passet, 2026-07-26):** de tre planerade
divergens-varianterna för check-in-sidan bar write-forken som axel — A =
event-nivå "markera alla", B = per-person-toggle, C = dörr-optimerad sök.
Research-passet
(`docs/research/checkin-monsterklassen-2026-07-26.md`) kördes först och **vände
forken helt**: noll av fem undersökta produkter (Eventbrite Organizer, Luma,
Cvent OnArrival, Splash Host, Sched) bär massmarkering vid dörren; varje funnen
massmarkering ligger i register-klassen. Premissen "de flesta har samma
tillstånd" är sann EFTER eventet och falsk UNDER insläppet. Konsekvensen var
att forken upplöstes i stället för att väljas — A9/A10 hör till registret,
per-post-write till dörren, en skrivväg per situation — och att `task-48`:s
markera-läge generaliserar till registret, inte till dörren.

**Vad ordningen kostade och sparade:** research-passet är ett bakgrunds-pass
som löper parallellt med annat arbete. Divergens-passet är tre byggda ytor plus
Marcus granskningstid. Hade ordningen varit den omvända hade tre varianter
byggts inom en mönsterklass som inte matchar situationen, och valet mellan dem
hade varit ett val mellan tre fel svar — ett fel som inte syns i granskningen,
eftersom varianterna ser rimliga ut var för sig.

**Regeln:** skilj på de två frågeklasserna innan ett prototyp-pass beställs.

- **"Vilken FORM ska den här ytan ha?"** → divergens-pass direkt. Formen är
  smaksak grundad i vårt eget facit, och Marcus blick är instrumentet.
- **"Vilken MÖNSTERKLASS tillhör det här problemet?"** → research först.
  Klassen är en empirisk fråga om hur problemet lösts av andra, och prototypen
  ärver svaret som axel.

Signalen att man står i den andra klassen: divergens-axeln ÄR den öppna frågan.
Bär varianterna själva ett ospecificerat arkitektur- eller domänval, är det
valet inte moget för bild ännu.

Släkt: [[L58]] (research ska peka ut vilken mekanism-familj som matchar, inte
bekräfta den mest tilltalande hypotesen), [[L161]] (research kan VÄNDA en
rekommendation — belägget före, inte efter), [[L237]] (prototyp-svaret är
grillningen; varianterna itereras aldrig i valfasen).

---

### L354

**En orsaks-hypotes om layout MÄTS innan den byggs — dimensionen man tror bär
är sällan den som bär.** `[UNIVERSAL]`

**Empiri (S91, `task-48`, fynd (e), 2026-07-26):** deltagarkorten sågtandade
21 px på 430 px beroende på om kategori-pillen "Manuellt tillagd" fanns.
Beställningen löd "reservera pill-radens HÖJD". Mätningen före bygget
falsifierade den: pill-kolumnen mäter 22 px (en rad) resp. 50 px (två) mot
identitetskolumnens 67 px — den är aldrig radens högsta element och kan inte
driva korthöjden. Bäraren var BREDDEN: `max-w-[45%]` lät slottens bredd följa
innehållet, identitetskolumnen (`flex-1`) ärvde variationen (157,95 px med
pill mot 214,33 utan), och e-posten radbröts bara i det smala fallet. Hade
höjden reserverats enligt hypotesen hade sågtanden stått kvar, med en ny
tom reserv ovanpå.

**Bonusfyndet mätningen gav gratis:** samma mekanism dolde en INOM-kort-
instabilitet som ingen hade sett — när Obekräftad-pillen viker vid val krympte
slotten 139,05 → 107,42 px, e-posten fick plats igen och kortet hoppade
166 → 145 px mitt under fingret. Den var osynlig i den ursprungliga
observationen och hade överlevt varje fix som utgick från hypotesen.

**Regeln:** en rapporterad symtom-korrelation ("hoppar när pillen finns") är
data; den medföljande orsaksförklaringen ("för att pill-raden är högre") är en
hypotes med samma bevisbörda som vilken annan. Reproducera symtomet med
mätvärden per delelement FÖRST — bredd, höjd och radantal per kolumn — och låt
siffrorna peka ut bäraren. Fixen adresserar det mätta, och divergensen mot
hypotesen bokförs öppet i stället för att tigas ihjäl.

Släkt: [[L325]] (falsifiera öppet i stället för att bygga vidare på ett
antagande), [[L245]]/[[L246]] (renderad verifiering — mät, påstå inte),
[[L347]] (kortets diagnos är en härledning, inte facit).

---

### L355

**Serverns svar ÄR facit — kasta det inte och vänta på en omhämtning.**
`[UNIVERSAL]`

**Empiri (S91, `task-48`, fynd (a), 2026-07-26):** batch-bekräftelsen var
pessimistisk enligt ett Marcus-låst byggkrav, och pessimismen tolkades som "vyn
uppdateras av nästa `get-registrations`". Uppmätt mot staging: kön stod
oförändrad i 5 488 ms efter att läget stängt — åtta kort låg kvar som om
knappen inte gjort något. Mutationen returnerade hela tiden `confirmed:
string[]` + `bekraftelseSkickad`, alltså exakt vad som hänt och när, och den
informationen slängdes. Att skriva svaret till listcachen i `onSuccess` (med
`cancelQueries` före, så en omhämtning i luften inte skriver tillbaka gammalt)
tog samma flöde till 486 ms utan att röra pessimismen.

**Distinktionen som gör det lagligt:** optimistisk mutation = skriv FÖRE svaret,
med klientens gissning. Detta = skriv EFTER svaret, med serverns egen lista. Ett
partiellt utfall flyttar exakt de poster servern rapporterade och lämnar resten
— halv-utfallet kan fortfarande aldrig visas som helt, vilket var hela skälet
till pessimismen. Invalideringen står kvar och konvergerar i bakgrunden.

**Regeln:** när en mutation returnerar tillräckligt för att beskriva sin egen
effekt är väntan på en refetch inte försiktighet utan spill. Fråga vid varje
`invalidateQueries`-only-mutation: "bär svaret redan det vyn behöver?" Gör det
— skriv in det. Testvakten är deterministisk utan klocka: fördröj omhämtningen
och räkna landade svar, så faller fallet om koden börjar vänta igen.

Släkt: [[L356]] (mät före), [[L245]] (renderad verifiering).

---

### L356

**`transition-colors` tonar in fokusringen — Tailwind v4:s egenskapslista
innehåller `outline-color`.** `[UNIVERSAL]`

**Empiri (S91, ToggleButtonGroup-hovern, 2026-07-26):** hover-plattan skulle
följa repots precedent `motion-safe:transition-colors` (EventValjare, TabBar).
Primitivens computed-låsta fokus-test föll direkt: ringens `outlineColor`
mättes till `rgb(80, 81, 82)` i stället för `--mm-focus-ring`s
`rgb(27, 73, 101)` — ett mellanvärde mitt i en 150 ms-övergång. Tailwind v4
expanderar `transition-colors` till `color, background-color, border-color,
outline-color, text-decoration-color, fill, stroke` + gradient-stoppen.
Fokusringen kommer från en GLOBAL `:focus-visible`-regel (base.css), så ingen
lokal klass avslöjar kopplingen — utilityn på pillen fjärrstyr en ring som
deklareras någon annanstans. Läkningen var `transition-[background-color]`:
exakt den egenskap hovern faktiskt ändrar.

**Varför den är svår att fånga:** ögat läser en 150 ms-intoning som "ringen
kom direkt", och en flake-tolkning ligger nära till hands när ett
färg-assertion faller på ett mellanvärde. Den fångades bara för att repot
redan hade ett computed-lås på ringens EXAKTA färg i fokusögonblicket — utan
det låset hade en långsammare fokusindikator glidit in tyst.

**Regeln:** `transition-colors` är en bred lista, inte "färgerna jag råkar
ändra". Bär ytan en fokusring — egen eller global — smalna av till de
egenskaper övergången faktiskt gäller. Fokusindikatorn ska stå omedelbart;
den är inte en yta att animera. Kontrollera samma sak för `transition-all`.

Släkt: [[L352]] (en variant i bas-strängen överskriver tyst en villkorad
gren — samma klass av osynlig egenskaps-kollision), [[L246]] (renderad
verifiering: mät computed, påstå inte).

---

---

### L357

**Hover är ÅTERKOPPLING, inte ett tillstånd — likvärdiga kanaler är inte
identiska kanaler.** `[UNIVERSAL]`

**Empiri (S91, Marcus design-review 2026-07-26):** "borde inte 'Manuella' och
'Medföljande' i översta togglen där ha hover?" `ToggleButtonGroup` saknade
hover helt, med en motivering i koden som lät principfast: states bärs av
React Arias data-attribut "inte `:hover`/`:active` — så pekare, tangentbord
och touch får identisk semantik". Den meningen blandar ihop två ting.
TILLSTÅND (vald/disabled) ska mycket riktigt vara identiska över alla
kanaler. ÅTERKOPPLING på att ytan går att klicka ska vara LIKVÄRDIG, inte
identisk: pekaren får hover, tangentbordet får focus-visible, touch får
ingenting (fingret täcker ytan ändå). Att kräva identisk återkoppling
betyder i praktiken att den svagaste kanalen sätter taket — och alla tappar
affordansen. Repot hade 56 `hover:`-användningar; flikarna var undantaget,
inte regeln.

**Varför den är svår att fånga:** motiveringen var skriven, självsäker och
låg i koden på rätt ställe. Pre-K-forensiken ("läs varför state ser ut som
det gör") returnerar en förklaring som LÅTER som ett medvetet designval, och
det stannar granskningen. En felaktig motivering är farligare än ingen
motivering.

**Regeln:** när en kod-kommentar motiverar en FRÅNVARO, pröva om den
motiveringen faktiskt bär — särskilt när den generaliserar över
inmatningskanaler. Fråga: är det här ett tillstånd eller en återkoppling?
Håller vi samma regel på jämförbara ytor i repot? Bär den inte, RIVS
motiveringen och skrivs om — den kompletteras inte, för då står felet kvar
bredvid rättelsen.

Släkt: [[L348]] (läs varför något ser ut som det gör innan du ändrar det —
den här är dess baksida: förklaringen kan vara fel), [[L352]] (a11y-regler
som ser rätt ut i koden och är fel i renderat läge).

---

---

### L358

**Återkoppling på en yta vars bakgrund du inte äger måste vara ett
ALFA-LAGER, aldrig en fast ton.** `[UNIVERSAL]`

**Empiri (S91, ToggleButtonGroup-hovern, 2026-07-26):** hover-plattan sattes
till `bg-bg-emphasized` — en opak ton, uppmätt ΔE00 2,31 mot primitivens
standard-track, alltså precis lika urskiljbar som komponentens egen
vald/ovald-skillnad. Korrekt på fyra av fem konsument-ytor. På den femte satte
`Betalningar.tsx` `className="bg-bg-emphasized"` på SITT track — samma ton — och
hovern mätte då **ΔE00 0,00**. Den fanns i DOM:en, hade rätt data-attribut,
passerade varje token-assertion och var totalt osynlig. Läkningen var ett
genomskinligt skrim (`--mm-state-hover`, 6 % av `--mm-text`) som mörknar vilken
bakgrund som helst med konstant steg: uppmätt ΔE00 2,77 / 2,60 / 2,63 mot
bg-muted, bg-emphasized respektive vit.

**Varför den är svår att fånga:** primitiven exponerar `className` mot gruppen,
så tracket är en ÖPPEN parameter — men den designas som om den vore fast,
eftersom demo-ytan och de flesta konsumenter använder default. Assertionen
"plattan === förväntad token" är grön i exakt det ögonblick defekten uppstår:
det är kollisionen mellan två korrekta tokens som är felet, inte fel token.
Fyndet krävde att varje konsument-yta mättes RENDERAT, en i taget — inventeringen
`grep -rn "ToggleButton" src/` var det som gjorde det möjligt.

**Regeln:** när en primitiv låter konsumenten sätta bakgrunden är varje
återkoppling som ritas mot den bakgrunden ett alfa-lager. Fast ton är bara
tillåtet när ytan under är stängd. Assertionen ska mäta det KOMPOSITERADE
resultatet mot den faktiska underliggande ytan, inte token-identitet — och
minst två olika underlag ska finnas i vaktande demo-yta. Branschmönstret är
Material 3:s state layers och Radix alpha-skalor; båda finns av exakt detta
skäl.

Släkt: [[L352]] (samma familj: två regler som var för sig är rätt och
tillsammans släcker en signal), [[L246]] (renderad verifiering per yta —
en token-assertion är inte en verifiering), [[L94]] (a11y-beslut kräver
korsning av flera evidenslinjer).

---

---

### L359

**Hover-assertioner måste kunna HOVRA OM — ett engångs-`hover()` kan tappas av
en layout-omläggning efteråt.** `[UNIVERSAL]`

**Empiri (S91, ToggleButtonGroup-hovern, 2026-07-26):** hover-sviten var grön i
isolerad körning (74/74) och rött ungefär vart trettionde test under last
(4 workers × 6 repeats, respektive a11y+e2e samtidigt). Felet var svårläst —
det pekade ut ett KONTRAST-fel, inte ett hover-fel. Playwrights spårning visade
vad som faktiskt hände:

```text
oklab(… / 0.06) → oklab(… / 0.058) → oklab(… / 0.018) → rgba(0, 0, 0, 0)
```

Det är en fade-UT. Hovern tändes, `data-hovered` sattes, och sedan la sidan om
sig (font-laddning/hydrering under CPU-last) så att pekaren hamnade utanför
pillen. Playwrights `hover()` gör actionability-kontroll FÖRE musflytten —
inget skydd finns mot att elementet flyttar sig EFTER. Ett väntande
`expect().toHaveCSS()` kan bara polla, aldrig hovra om, så det pollade en
transparent yta till timeout.

Två sidofynd ur samma spår, båda återanvändbara:

- **Mitt i en transition rapporterar Chrome interpolerade värden i `oklab(…)`,
  inte i den deklarerade formen.** En computed-färg-assertion mot
  `color(srgb …)` matchar därför först när övergången är KLAR — vilket gör
  assertionen till en gratis settle-grind, men samtidigt värdelös som
  "har hovern börjat"-test. En `alfa > 0`-poll är motsatsen: den svarar direkt
  och mäter en halvfärdig platta.
- **DOM-probar som mäter tokens ska tas ur flödet** (`position: absolute`,
  dolt). En prob som appendas till `body` kan knuffa sidhöjden över
  scrollbar-tröskeln och flytta layouten i sidled — exakt det som slår bort en
  pågående hover.

**Regeln:** allt som ska hållas hovrat medan det asserteras körs i ett
`expect(async () => { await x.hover(); await expect(...); }).toPass()` — så
återställs hovern vid varje försök. Assertera mot det RESOLVERADE
token-värdet (settle-grinden), och hämta token-värdet FÖRE hovern.

Släkt: [[L246]] (renderad verifiering — mät computed), [[L356]] (samma
komponent: `transition-colors` drog med `outline-color`), [[L94]] (a11y-fynd
kräver flera evidenslinjer — här var felmeddelandet direkt vilseledande).
