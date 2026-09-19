# ADR-134: Publik webbplats FÖRE Fas E — ordningen vänds, AT‑Max delas i en migrationsdel och en mall-maxningsdel

- **Status:** Accepted — grillad samsyn S128 (`/grill-me`, arton
  kvitterade beslut; beslut 8 och 13 — de två denna ADR bär — kvitterade
  av Marcus i klartext, Del 3–4: se § Kontext för de ordagranna
  citaten). **ADR-TEXTENS utformning** (kontext, beslut, ADR-bar-
  prövning, alternativ, konsekvenser) är granskad och godkänd av
  ORKESTRERAREN på Marcus DELEGERADE mandat, inte genom Marcus egen
  radgranskning av dokumentet: Marcus, 2026-09-19, ordagrant till
  orkestreraren — _"Du har mandat, anser du att det är GO så är det
  GO."_ Orkestreraren läste hela diffen (denna ADR:s beslutsdel,
  byggplanens rader W/AT‑Max/E + §4-förkrav + versionsrad 1.18,
  ADR-068- och ADR-063-posterna) och gav GO 2026-09-19. Detta är alltså
  ett DELEGERAT GO på formuleringen — ett bevis att den delegerade
  granskningen skedde, inte ett bevis att Marcus själv läst varje rad i
  denna ADR.
- **Datum:** 2026-09-19
- **Fas:** Ny fas i byggplanens §2-tabell, placerad FÖRE Fas E. Namnet
  **"Fas W — Publik webbplats (nya miranon.se)"** är fastställt under
  samma delegerade mandat som Status-fältet ovan (se § Öppna frågor
  punkt 1 för avgörandets form). Fasens scope, DoD och estimat
  dekomponeras separat via PRD-kort (`/to-prd`) när stack-beslutet är
  fattat.
- **Rör:** [`docs/byggplan.md`](../byggplan.md) §2 (fas-tabell, ny rad +
  amendering av raden AT‑Max) och §4 (Fas E:s förkrav, AT‑Max-milstolpens
  block) · [ADR-068](ADR-068-ovnings-ramverket.md) (amenderas, § Updates)
  · [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md)
  (amenderas, § Updates) · `tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md`
  (väckt `paused` → `active` i S128, bär beslutshistoriken) ·
  `tasks/threads/T189-crm-riktningen-tvavags-inkorg-och-persontidslinje.md`
  (systertråd, egen omfattning — rörs inte av detta beslut).
- **Relation:** Bygger på [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md)
  ("gränsen går vid protokollet, inte vid läs/skriv") — det är den
  principen som gör Väg A möjlig: sajten talar bara med Edge Function-
  lagret, aldrig direkt med datakällan, så datakällan kan bytas ut bakom
  funktionerna utan att sajten rörs. Besvarar
  [`docs/reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md`](../reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md)
  § "Vad som INTE är avgjort" fråga 2 ("binder pull-modellen custom
  miranon.se till efter Fas E?") — svaret är NEJ, under Väg A. Amenderar
  [ADR-068](ADR-068-ovnings-ramverket.md) punkt 5 (en tolkningsfråga, inte
  sakbeslutet — se § Updates i den ADR:n) och
  [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) (AT‑Max-
  milstolpens interna timing, inte dess sakbeslut — se § Updates i den
  ADR:n).

## Kontext

Marcus idé, ordagrant (2026-09-19,
[`tasks/sessions/2026-09-19-session-128.md`](../../tasks/sessions/2026-09-19-session-128.md)
Del 1):

> Vi har kommit ganska långt med appen och jag vill göra en full migrering
> till Supabase asap, men innan vi gör det så tänker jag att vi måste bygga
> "om" miranon.se. Vi behöver bygga en custom webbplats i detta repo, en ny
> miranon.se.
>
> Jag tänker att vi måste göra det INNAN migreringen till Supabase eftersom
> vi vill undvika att behöva krångla med Zapier och Elfsight. Vi vill ha
> egna formulär på nya miranon.se som skriver direkt till Supabase.

Tråd `T79` (custom miranon.se) hade sedan tidigare landat i slutsatsen att
_"pull-modellen förutsätter Postgres och binds därmed till efter Fas E"_ —
den slutsatsen upprepades så sent som i
[arkitektur-destillatet](../reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md)
(2026-07-25) som en av fyra medvetet olösta frågor: _"Samma fråga för
custom miranon.se — pull-modellen förutsätter Postgres, vilket binder den
till efter Fas E. Beslutas de två spåren ihop eller var för sig?"_ Marcus
nya premiss vänder direkt på den slutsatsen.

**Motsägelsen löses av VÄG A**, kvitterad i grillningen (S128 Del 1, fem
förhandsbesked): formulären på sajten postar till en Supabase Edge
Function som — fram till Fas E — lagrar i Airtable, precis som appens
befintliga skrivvägar redan gör. Sajten talar aldrig direkt med
datakällan. Det är exakt gränsdragningen [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md)
redan etablerat för testarkitekturen ("gränsen går vid protokollet, inte
vid läs/skriv") — här appliceras samma princip på PRODUKTIONS­arkitekturen:
när Fas E byter lagring bakom Edge Function-kontraktet är det bytet som
rör sig, inte sajten. Datakällans identitet blir därmed irrelevant för
NÄR sajten kan byggas.

**Grillningen (S128, `/grill-me`, arton kvitterade beslut) landade i två
beslut som denna ADR bär** — Marcus kvittens på samtliga arton:
_"Låter bra. Jag kvitterar."_ (Del 5):

- **Beslut 8 (Del 3):** _"Allt parallellt nu — sajten blir en tredje ström
  bredvid CI-arbetet (S126) och app-ytorna (S127)."_ Marcus ordagrant:
  _"A. Allt parallellt nu. Jag har tid."_ Sessionsdoket noterar
  uttryckligen att detta kräver denna ADR plus en rad i byggplanens
  fas-tabell, eftersom en sajt-fas före Fas E river
  [ADR-068](ADR-068-ovnings-ramverket.md) punkt 5:s formulering "sist av
  alla byggplans-delar" öppen.
- **Beslut 13 (Del 4):** _"AT‑Max delas: den smala migrationsdelen
  (registrens korrekthet, kända fällor) görs FÖRE Fas E; maxningen av
  basen som mall löper efter."_ Byggplanens premiss att AT‑Max-ytan är
  "klar efter Fas 6.5" rivs öppet, eftersom sajten lägger nya fält och en
  ny skrivväg till just den yta milstolpen ska auditera. Marcus
  ordagrant: _"Vi kör på din rek."_

**Känt undantag, mätt live 2026-09-19** (skrivskyddad läsning mot
produktionsbasen, huvudsessionen via claude.ai-connectorn — se
`~/.claude/CLAUDE.md` § Verktygsfakta): automationen A12:s egen
beskrivning nämner _"Zap 1 Anmälan-Psionautics.se"_ — en annan sajt
(`psionautics.se`) matar samma bas via en separat Zapier-koppling. Marcus:
_"psionautics kan vi hålla utanför detta tillsvidare."_ Källa:
`tasks/sessions/2026-09-19-session-128.md` Del 6 — **denna del av
sessionsdoket var, vid författandet av denna ADR, INTE landad på
`origin/main`** (endast Del 1–5 hade landat, via `#2592`/`#2593`); koden
citeras därför som filsökväg, inte som klickbar länk, för att inte fälla
länkkontrollen. Den här raden ÄR källan tills Del 6 landar. Konsekvensen:
Zappen mot `psionautics.se` lever kvar vid sajtlanseringen och blir ett
namngivet Fas E-krav (den måste dras om mot den nya datakällan när Fas E
byter lagring) — se § Konsekvenser.

## Beslutet

### 1. En ny fas — "Fas W — Publik webbplats (nya miranon.se)" — läggs in FÖRE Fas E, körs PARALLELLT med pågående arbete

Byggplanens §2-tabell får en ny rad, placerad omedelbart före raden för
Fas E (raden AT‑Max, 7, 8 och B ligger — som i dag — mellan). Fasen
byggs **parallellt** med de två redan pågående strömmarna, inte i
sekvens efter dem:

1. **CI-/grindarkitekturen** (Session 126, `TASK-464`-serien) —
   oberoende av sajten, rör inte dess kod.
2. **Fas 6:s återstående facit-lösa ytor** (Session 127) — oberoende av
   sajten, samma skäl.
3. **Fas W:s spec-arbete** — stack- och repo-form-beslutet, PRD-kort via
   `/to-prd`, skivor via `/to-issues` — startar nu, byggs när specen är
   klar.

Fasens namn är fastställt under det delegerade mandatet i § Status ovan
— se § Öppna frågor punkt 1 för avgörandets form. Att en ny fas läggs
in framför Fas E ÄR kvitterat av Marcus själv (beslut 8 ovan); namnet
är orkestrerarens förslag, godkänt under samma delegation.

### 2. AT‑Max delas: en migrationsdel blir ett Fas E-förkrav, en mall-maxningsdel löper efter Fas E

AT‑Max-milstolpen ([ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md)
§ Updates 2026-08-14) omfattar i dag tre delar: **(a)** audit av att ALLA
app↔Airtable-interaktioner är registrerade korrekt, **(b)** audit av att
HELA Airtable-skatten (`data-model.md` §Kända fällor) är registrerad
korrekt och komplett, och **(c)** en dedikerad slutgenomlysning för att
hitta kvarvarande förbättringspotential utöver vad den kontinuerliga
bas-maxningen redan fångat.

**Delningen, per beslut 13:**

- **Migrationsdelen — (a) + (b), "registrens korrekthet, kända fällor"**
  — flyttas till ett **Fas E-förkrav**. Skälet är strukturellt, inte ett
  nytt omdöme: Fas E:s migration behöver en KORREKT och KOMPLETT karta
  över app↔Airtable-interaktionsytan för att veta vad som faktiskt
  flyttar. Milstolpens nuvarande placering ("efter Fas 6.5, då hela
  ytan är byggd av Fas 6:s EF ensamt") höll fram till denna ADR — Fas W
  lägger NYA app↔Airtable-interaktioner via Väg A:s Edge Function-lager
  (se nedan), vilket gör kartan ofullständig förrän Fas W är byggd.
- **Mall-maxningsdelen — (c), slutgenomlysningen** — löper **efter**
  Fas E, oförändrat i sak från 2026-08-14-beslutet: en pedagogisk "en
  gång till"-titt på Airtable-basen som mall för Passionslyftet, en
  aktivitet som inte är beroende av datakällans roll i appen längre.

**Vad som konkret utvidgar interaktionsytan** (exempel, inte en
uttömmande lista — den uttömmande listan ÄR precis vad audit (a) ska
producera): den publika anmälningsvägens Edge Function skriver nya
`Anmälningar`-poster från en ANONYM avsändare i stället för en
autentiserad Lotta-session (beslut 11); publicerings-kontraktets två nya
valfria datumfält `Anmälan öppnar`/`Anmälan stänger` samt
`Tidigare startdatum` (beslut 3); "Nära dig"-kartans additiva
koordinatfält på `Platser` (beslut 12); och EF-skrivvägar som skapar
eller uppdaterar `Personer`/`Leads`-poster från kontaktformuläret och
ljudspelarens mail-insamling (beslut 5, 16). Ingen av dessa är byggda av
denna ADR — de är exempel på VARFÖR migrationsdelens audit måste vänta
in Fas W, inte en komplett kravlista.

### 3. Den nya ordningsföljden, utskriven

1. **Nu:** de tre parallella strömmarna (§ Beslut 1) — CI-arkitekturen,
   Fas 6:s återstående ytor, och Fas W:s spec-arbete (stack-beslut →
   PRD → skivor).
2. **Fas W byggs och lanseras** enligt sin egen lanseringskedja (S128
   beslut 15: dold testadress → omdirigeringslista → integritetspolicy
   → DNS-byte, då Elfsight stängs av OCH miranon.se:s EGNA
   Zapier-kopplingar in i basen stängs av (enligt den frusna referensen
   `docs/reference/schema_reference.md` Zap 3–6: express- och
   huvudformuläret samt de två lead-formulären — exakt lista verifieras
   mot Zapier före lansering, se § Öppna frågor punkt 7); **Zap 1**
   (`psionautics.se`) rörs INTE och ärvs av Fas E (§ Konsekvenser); Zap
   7–8 (Soundwise) byggs om till den tunna bryggan enligt beslut 6 →
   fyra veckors reservperiod → Shopify/Elfsight/Common Ninja sägs upp).
   GO ges av Marcus tillsammans med Roger och Lotta.
3. **AT‑Max:s migrationsdel** ((a)+(b) ovan) körs när Fas W:s
   Airtable-berörande skrivvägar är BYGGDA — denna ADR tar INTE
   ställning till om det kräver fullständig DNS-lansering eller räcker
   med att koden finns; se § Öppna frågor.
4. **Fas E aktualiseras** när samtliga tre villkor håller: appens sidor
   är klara (befintligt ankare, [byggplan.md](../byggplan.md) §4 Fas E
   § Horisont, S91 premiss 4 — OFÖRÄNDRAT av denna ADR), AT‑Max:s
   migrationsdel är avslutad (NYTT villkor, denna ADR), och Fas W är
   lanserad (NYTT villkor, denna ADR).
5. **Efter Fas E:** AT‑Max:s mall-maxningsdel ((c) ovan) — den
   dedikerade slutgenomlysningen för Passionslyft-mallen — fortsätter
   som ett fristående, icke-blockerande pass.

## ADR-baren — prövad

Tre villkor (`~/.claude/CLAUDE.md` § ADR-BAR), samtliga tre måste hålla:

1. **Svår att återställa — i kod ELLER koherens?** Ja. I koherens: utan
   denna ADR säger [ADR-068](ADR-068-ovnings-ramverket.md) att Fas E är
   slutfasen och byggplanens §2-tabell har ingen plats för en fas som
   ligger FÖRE den men EFTER AT‑Max/7/8/B i tabellordningen — en agent
   som senare läser byggplanen utan denna ADR ser en fas som inte passar
   in i ramverket och kan antingen rada in den fel eller riva den
   tyst. I kod: Väg A:s protokollgräns (sajten talar bara med
   EF-lagret) är den enda anledningen ordningen går att vända utan att
   bryta [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md) —
   glöms det bort designas sajten lätt om till att läsa datakällan
   direkt, vilket permanent skulle binda den till Fas E-tajmingen igen.
2. **Överraskande utan kontext?** Ja. En ny fas insprängd framför en
   namngiven "slutfas" ser ut som en regel som bröts, inte ett beslut —
   precis den typ av förvirring [ADR-068](ADR-068-ovnings-ramverket.md)
   punkt 5 själv varnar för ("ingen ny fas skapas" för
   Supabase-migrationens EGEN roll; frånvaron av kontext gör det lätt
   att läsa punkten bredare än den sakligt är). Likaså: att
   AT‑Max-milstolpens beroenden plötsligt inkluderar en fas som inte
   fanns när milstolpen skrevs (2026-06-25) är obegripligt utan denna
   ADR:s motivering.
3. **Resultat av en verklig avvägning?** Ja. Alternativet "vänta till
   efter Fas E" var T79:s egen, tidigare, medvetna slutsats — den
   omprövas här med skäl (Marcus vill inte dubbelbygga
   Elfsight/Zapier-kedjan mot två datakällor i rad), och tre andra
   alternativ vägdes och avvisades öppet (§ Alternativ som övervägdes).
   Ingen av vägarna var en gratislunch: parallellt-nu-beslutet kostar
   koordinering över tre samtidiga strömmar i samma repo, och den delade
   AT‑Max-milstolpen kostar att en tidigare odelad, enhetlig milstolpe nu
   har två separata avstämningspunkter.

## Alternativ som övervägdes

| Alternativ | Status | Skäl |
|---|---|---|
| Sajten byggs EFTER Fas E (T79:s ursprungliga slutsats — pull-modellen "binds till efter Fas E") | Avvisad | Var grundad i antagandet att sajten måste läsa/skriva datakällan direkt. Väg A upphäver antagandet: EF-lagret gör datakällans identitet irrelevant för sajtens byggordning. Att vänta hade dessutom tvingat fram en extra ombyggnad av Elfsight/Zapier-kedjan mot Supabase — exakt det Marcus vill undvika (Kontext, ordagrant citat) |
| Sajtlansering SAMTIDIGT med Fas E:s datakälle-byte | Avvisad | Kopplar ihop två stora, oberoende risker (en ny publik yta + ett datalager-byte) i samma fönster, och omintetgör själva poängen med att bygga sajten nu: hela motivet är att UNDVIKA att koppla sajtens tajming till migrationens. Ingen del av grillningen (S128) föreslog detta — det är ett alternativ som konstruerades och avfärdades under denna ADR:s författning, inte ett Marcus prövat och avvisat förslag |
| Sajtens formulär skriver till en NY Supabase-tabell som sedan synkas till Airtable | Avvisad | Två sanningskällor för samma data (arkitektur-destillatets egen varningslinje, spår 3: "aldrig två sanningar") — exakt det mönster [ADR-110](ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md) och [ADR-128](ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md) noggrant undviker för andra domäner. Väg A håller EN sanning (Airtable, tills Fas E) skriven genom EF-lagret, ingen synk-mekanism att hålla konsistent |
| Sajten som lanseringskrav FÖR den fulla tvåvägs-CRM-inkorgen (`T189`) | Avvisad — explicit i grillningen (S128 beslut 18) | Marcus valde alternativ "B": inkorgen grindar INTE sajtlanseringen. Kontaktformuläret mailar Lotta som i dag OCH lagrar meddelandet i den slutliga modellen vid lansering; gränssnittet är ett EGET spår med eget PRD, `T189`, oberoende av denna ADR:s ordning |

**Precedent-rymden är deklarerat TOM, inte tunn, på just denna
avvägningsfråga.** Detta är ett beslut om PROJEKTETS EGEN fasordning —
när en organisations interna roadmap-sekvens ska omprövas — inte ett
tekniskt biblioteks- eller arkitekturval med en extern branschpraxis att
mäta mot (`~/.claude/CLAUDE.md` § Instruktioner, precedent-kravet vid
ADR-permanens). Ingen sökning genomfördes efter "hur andra företag
sekvenserar en marknadsförings-webbplats mot en intern datamigrering",
eftersom frågan är specifik för DETTA repos två parallella spår
(byggplanens fas-ramverk, [ADR-068](ADR-068-ovnings-ramverket.md)) och
ett sådant fynd — om det ens går att hitta — vore svagt jämförbart. De
TEKNISKA delbesluten som följer av detta ordningsbeslut (Väg A:s
EF-protokoll, publicerings-kontraktets datamodell, den publika
anmälningsvägens botskydd, filuppladdningens sanering) VILAR var för sig
på egna, källbelagda research-pass — se `docs/research/*-2026-09-19.md`
och `~/.claude/CLAUDE.md` § Instruktioner, web-research-disciplinen —
men själva ORDNINGSFRÅGAN denna ADR avgör är inte en teknisk form och
prövas inte mot extern precedent.

## Konsekvenser

**Positiva:** Elfsight/Zapier-kedjan dras om EN gång, mot Supabase-
protokollet direkt, aldrig mot Airtable som ett mellansteg som sedan
måste göras om igen vid Fas E. Arkitektur-destillatets fråga 2 (2026-07-25)
är besvarad, inte längre öppen. Tre samtidiga strömmar (CI, Fas 6,
sajten) utnyttjar Marcus uttalade kapacitet ("Jag har tid") utan att
någon av dem blockerar de andra — ingen delar kod eller datamodell på
ett sätt som tvingar sekvensering.

**Negativa/skuld, öppet burna:**

- **AT‑Max-audit (a) kan inte slutföras förrän Fas W:s Airtable-
  berörande skrivvägar är byggda** — migrationsdelen bär därför en
  BEROENDE-kedja den inte hade innan (Fas 6 → Fas W → migrationsdel →
  Fas E), i stället för den tidigare enkla (Fas 6 → Fas 6.5 →
  milstolpe).
- **Fas E ärver `psionautics.se`-Zappen som ett namngivet krav.** Zappen
  (`Zap 1 Anmälan-Psionautics.se`, A12) matar samma bas som Miranon Medias
  egna formulär och hålls medvetet UTANFÖR denna sajtlansering
  (Marcus: _"psionautics kan vi hålla utanför detta tillsvidare"_) —
  men den måste dras om den dag Fas E byter lagringen bakom EF-lagret,
  eftersom Zapier i dag skriver direkt mot Airtable, inte genom
  protokollet. Ingen lösning föreslås här; kravet bokförs för Fas E:s
  egen planering.
- **Fas E ärver Soundwise-bryggan som ett namngivet krav**, av samma
  skäl: ljudspelarens Soundwise-integration (S128 beslut 5, 6) går via
  en tunn Zap (vår EF → Zapier → Soundwise; Soundwise → Zapier → vår
  EF) eftersom Soundwise dokumenterat bara nås via Zapier i dag (invite
  only). Bryggan lever kvar vid sajtlansering med avsikt (beslut 6) och
  blir ett Fas E-krav att antingen dra om eller ersätta med en direkt
  integration om Soundwise öppnar ett API.
- **Byggplanens tidigare enkla linjal — "AT‑Max efter Fas 6.5, sedan
  Fas E" — gäller inte längre oförändrad.** Den nya kedjan (§ Beslut 3)
  är LÄNGRE och har fler villkor. Det är priset för att lösa upp
  T79:s ursprungliga bindning, inte en kostnadsfri omskrivning.
- **Denna ADR bygger ingen kod och avgör inget stack-/repo-formsval.**
  Fasens faktiska DoD, estimat och arkitektur kommer i ett separat
  PRD-kort, efter ett eget stack-beslut. Fram till dess är § Beslut 3
  en ORDNING, inte en byggd plan.

**Vad som INTE ändras, uttryckligen:** [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md)
beslut 1–4 och 6 (basen som förstklassig leverabel, resolution i basen,
defekt-registret som kravspec, "beräkna från källan", Supabase-
migrationen som separat senare spår för allt utom betalningsdomänen)
står oförändrade — denna ADR rör enbart TIMINGEN för AT‑Max-milstolpens
DELAR, inte något av dessa sakbeslut. [ADR-068](ADR-068-ovnings-ramverket.md)
punkterna 1–4, 6 och 7 (epok-linjalen, nivå-hierarkin, terminologin,
Vue-repots frysning, lins-noten, målytorna) står likaså oförändrade —
enbart en snävare tolkning av punkt 5 omprövas (se § Updates i den
ADR:n).

## Öppna frågor

Numreringen nedan är stabil (interna hänvisningar, t.ex. § Beslut 3
steg 2, pekar på specifika nummer). Punkt 1 och 6 är sedan 2026-09-19
**AVGJORDA** under det delegerade mandatet (§ Status) och bevaras här
som historik, inte som öppna punkter; punkterna 2–5 och 7 avgör denna
ADR fortsatt INTE.

1. **Fasens NAMN — AVGJORT 2026-09-19.** "Fas W — Publik webbplats (nya
   miranon.se)" var orkestrerarens förslag i denna ADR:s ursprungliga
   utkast; fastställt under det delegerade Marcus-mandatet (§ Status)
   samma dag. Kontrollerat mot `ORDLISTA.md` (inga "Fas"-relaterade
   termer där — domänordlistan omfattar Miranon Medias produktdomän,
   inte byggplanens fas-namn) och mot byggplanens egen numreringsnot
   (§2, "Det 'saknas' en Fas 4...") — ingen krock; bokstaven W var
   oanvänd i tabellen vid mintningen (0, 1, A, 2, 2.5, 3, 3.5, 5, 5.5, 6,
   6.5, AT‑Max, 7, 8, B, E).
2. **Stack och repo-form.** Öppen — eget research-pass pågick vid denna
   ADR:s författning (`docs/research/miranon-se-stack-och-repoform-2026-09-19.md`,
   samt ett omprövande andra varv registrerat i sessionsdokets Del 6,
   INTE landat på `origin/main` vid denna ADR:s författning — se
   § Kontext). Avgörs som en egen beslutsfråga till Marcus, oberoende av
   denna ADR.
3. **Fasens DoD och estimat.** Sätts vid PRD-dekomponeringen
   (`/to-prd` → `/to-issues`), samma mönster som AT‑Max-milstolpens eget
   estimat ("sätts vid milstolpens dekomponering", [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md)).
   Ingen provisorisk siffra injiceras här.
4. **Förhållandet till Fas 7.** Byggplanen bär redan detta som en öppen
   fråga för Fas E ([byggplan.md](../byggplan.md) §4 Fas E, blockquoten
   "ÖPPEN, MEDVETET EJ AVGJORD" — Fas 7-beroendet och det omankrade
   horisont-ankaret "sidorna klara" är inte försonade). Denna ADR
   tillför ETT NYTT villkor till Fas E:s aktualisering (§ Beslut 3, steg
   4) men löser INTE den redan öppna Fas 7-frågan; den förblir öppen,
   oförändrad av detta beslut.
5. **Migrationsdelens exakta triggerpunkt** (§ Beslut 3, steg 3): räcker
   det att Fas W:s Airtable-berörande EF-kod är BYGGD för att
   AT‑Max-audit (a) ska kunna starta, eller krävs fullständig
   DNS-lansering (steg 2)? Denna ADR tar inte ställning — frågan avgörs
   praktiskt när Fas W närmar sig sitt slut.
6. **`Status`-fältets enum — AVGJORT 2026-09-19, via det snabbare av de
   två föreslagna alternativen.** ADR:ns ursprungliga utkast använde
   `Proposed`, ett värde [`docs/decisions/README.md`](README.md)
   § Format inte dokumenterar (`Accepted | Superseded | Deprecated`);
   utkastet flaggade två vägar — utvidga enumet, eller byt ADR:n direkt
   till `Accepted` utan mellansteg. Denna ADR bytte direkt till
   `Accepted` (§ Status) under det delegerade mandatet. README:s
   format-spec är alltså ORÖRD av detta beslut — `Proposed` finns
   fortfarande inte som dokumenterat enum-värde, men frågan är moot för
   DENNA ADR eftersom den aldrig behövde bära värdet i sin landade form.
7. **Den exakta listan av vilka Zapier-kopplingar som stängs av vid
   DNS-bytet är OVERIFIERAD.** § Beslut 3, steg 2 pekar ut Zap 3–6
   (express- och huvudformuläret samt de två lead-formulären för
   "Meditationen Kraftfältet" och "Pyramidernas vajrar") som miranon.se:s
   EGNA kopplingar, enligt den frusna referensen
   [`schema_reference.md`](../reference/schema_reference.md) § Zapier-
   kopplingar (10 Zaps) — men den referensen är en ögonblicksbild från
   mars 2026, och orkestreraren saknar Zapier-åtkomst för att verifiera
   den mot dagens läge. **Ett sidofynd vid denna verifiering:** referensen
   listar ÄVEN **Zap 2** ("väntelista-psionautics.se → Airtable") som en
   TREDJE `psionautics.se`-koppling, utöver Zap 1 — Marcus besked
   ("psionautics kan vi hålla utanför detta tillsvidare") nämnde bara
   Zap 1 explicit. Om Zap 2 delar samma undantag som Zap 1 (rimligt, då
   den också matar `psionautics.se`) eller ska stängas av är INTE avgjort
   här. Den exakta listan — vilka Zaps som faktiskt stängs, vilka som
   ärvs av Fas E — måste verifieras direkt mot Zapier innan lansering,
   inte härledas ur en frusen referens.

## Relaterat

- `tasks/sessions/2026-09-19-session-128.md` Del 1 (syfte, Marcus idé),
  Del 3 (beslut 3, 8), Del 4 (beslut 11–18), Del 5 (samsyn kvitterad,
  ADR-bar-prövningen i kortform), Del 6 (live-läsning, `psionautics.se`
  — ej landad vid denna ADR:s författning, citerad som filsökväg).
- `tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md`
  — trådens fulla historik, väckt `paused` → `active` i S128.
- `tasks/threads/T189-crm-riktningen-tvavags-inkorg-och-persontidslinje.md`
  — systertråden (CRM/inkorg-riktningen), egen omfattning.
- [`docs/reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md`](../reference/miranon-arkitektur/arkitektur-destillat-och-gap-2026-07-25.md)
  § "Vad som INTE är avgjort" — frågorna 1–4 som denna ADR delvis
  besvarar (fråga 2, custom miranon.se) och delvis lämnar öppna (fråga 1,
  AI-assistenten — utanför denna ADR:s scope; fråga 3, livscykel-
  modellens hemvist — avgjord i S128 beslut 3, hör till PRD-arbetet, ej
  till denna ADR; fråga 4, aktivitetsloggens agent-actions — ej berörd).
- [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md) — protokoll­-
  gränsen som gör Väg A möjlig.
- [ADR-110](ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md),
  [ADR-128](ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md) —
  precedent för "en sanning, aldrig en synkad kopia", samma princip som
  avvisar "ny Supabase-tabell synkad till Airtable" i § Alternativ.
- `docs/research/publicerings-kontrakt-event-synlighet-bokningsbarhet-2026-09-19.md`,
  `docs/research/publik-anmalningsvag-utan-inloggning-2026-09-19.md`,
  `docs/research/event-nara-dig-och-karta-2026-09-19.md` — de tekniska
  delbesluten (§ Beslut 2) vilar på dessa, landade, research-pass.

## Updates

Inga än.
