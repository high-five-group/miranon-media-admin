# ADR-083: Prosa som påstår sig vara mekanism — beslutsklassning och grind

- Status: Accepted (Session 91 — 2026-07-30)
- Datum: 2026-07-30
- Fas: Session 91, restlistans spår A2 (grillningens `A2:8`)

## Kontext

2026-07-29 upptäcktes att hub-`CLAUDE.md` på **två** ställen påstod att regler var
*"mekaniserad som spärr — se `settings.json` `permissions.deny`"*. Ingen sådan
lista fanns — inte i `~/.claude/settings.json`, inte i spokets
`.claude/settings.json`, inte i `.claude/settings.local.json`. Husets enda
faktiska spärr var en `PreToolUse`-hook mot `gh run watch` i förgrunden, som
varken är `permissions.deny` eller täcker de två reglerna.

**Båda reglerna hade efterlevts.** Prosan fungerade. Skadan var en annan, och den
är hela skälet till denna ADR: **ingen granskade reglerna på månader, eftersom
filen sade att saken var löst.** Ett dokument som felaktigt påstår mekanisering
tar bort granskningen utan att ge skyddet — det är strikt sämre än att inte
påstå något alls.

Fyndet kom ur ett städpass där Marcus fällde sex av Codes påståenden och ingen
självgranskning fångade något av dem. Det placerar felet i ADR-041:s
fångst-rate-familj: självgranskning ~9 %, extern fångst dominerar.

Frågan grillades som `A2:8` (S91 Del 28). Marcus strök **tre av fyra** föreslagna
spärrar under intervjun — samtliga motiverade med att de var *"gratis"*, vilket
inte är ett skäl. Den fjärde ändrade form.

## Beslut

### 1. Regeln: synden är inte prosa — synden är prosa som påstår sig vara mekanism

Prosa är en fullt legitim bärare av en regel. Huset drivs av prosa, och
`ADR-079`:s mätning (skriven regel ~0 % efterlevnad mot 75 % för borttagen
möjlighet) är ett argument för att **föredra** mekanism där den går, inte ett
förbud mot prosa där den inte gör det.

Det otillåtna är snävare och skarpare: **en text får aldrig påstå att något är
mekaniserat när det inte är det.** En regel som är prosa ska heta prosa.

### 2. Beslutsklassningen: default-neka mot en uppräknad LISTA, inte mot en princip

Möter en agent ett beslut mitt i arbetet gäller default-neka — men mot en
**uppräknad lista** av beslutsklasser, aldrig mot en princip som kräver tolkning
i stunden. Agent-omdöme i stunden är husets svagaste fångst-mekanism.

**Defer-och-fortsätt med informationsplikt** är normalformen: det som inte kan
avgöras registreras durabelt (ADR-053:s triage) och arbetet fortsätter på det som
inte beror av svaret. `ready-for-agent`-etiketten ÄR det namngivna upplåsandet —
den betyder att kortet kan drivas hela vägen utan ett beslut mitt i.

### 3. En grind byggs — och bara en

`scripts/check-permissions-claims.sh`: nämner en styrande fil `permissions.deny`
eller `permissions.ask` **tillsammans med ett existens-påstående**, ska nyckeln
finnas och vara icke-tom i en settings-fil.

Marcus motivering för att just denna fick stå: den **fyrar noll gånger när Code
har rätt, och exakt en gång när Code inte har det.**

Grinden läser medvetet **inte** påståendets innebörd — bara att den åberopade
nyckeln existerar. Att avgöra om en deny-regel faktiskt täcker det prosan påstår
kräver semantik, och en grind som gissar semantik fäller fel. Snävt och mekaniskt
slår brett och ungefärligt.

### 4. `hard_deny` på persondata är en PRINCIP, inte en spärr

`permissions.deny` matchar verktygsmönster. Det finns inget mönster som uttrycker
*"exfiltrera inte persondata"*. Att skriva den som spärr hade varit prosa som
utger sig för att vara mekanism — samma synd, i samma andetag som den beskrevs.

Den står därför som princip, med uttrycklig not om att den **inte är
mekaniserbar med våra medel**.

### 5. Tre föreslagna spärrar förkastade — durabelt, så de inte återföreslås

- **`ask`-grind på `CLAUDE.md`.** Marcus: *"Ni vet ju oftast bättre än jag vad
  som bör finnas i `CLAUDE.md`."* Invändningen avtäckte att grinden träffade fel
  sak — felet var inte att Code skrev i filen, utan att Code skrev ett påstående
  om en mekanism som ingen kontrollerade.
- **Backlog-spärr.** Inget belagt felläge.
- **AskUserQuestion-spärr.** *"Har inte varit ett problem på flera månader."*

Samtliga tre motiverades med att de var gratis. **Att något är gratis är inte ett
skäl att bygga det** — att bygga mot ett fel som inte inträffar är att bygga
"ifall", och den dubbelriktade över-engineering-vakten säger nej.

## Villkoret för `Accepted` — uppfyllt

Marcus satte villkoret: **minst en post mekaniserad OCH prövad skarpt.**

Grinden är byggd, inkopplad som tionde kontroll i `check:docs`, och dess self-test
(7 fall) körs i `ci.yml` bredvid husets övriga grindvakts-sviter per `ADR-039`
§ lesson→grind. Beviset är tvåsidigt: den är **grön mot detta repo** och **fäller
mot hub-`CLAUDE.md`:s faktiska innehåll** när det används som fixtur — båda
raderna, inklusive den radbrutna.

**Två designfel fångades av self-testen före landning**, och de står här för att
de säger något om grind-design i allmänhet:

1. **För trubbig.** Första skarpa körningen fällde `CONTRIBUTING.md:921` — *"Läs
   den innan `permissions.deny` … övervägs"*, en referens till en framtida åtgärd
   och helt korrekt skriven. `A2:8`:s bokstav (*"varje referens"*) fällde den;
   avsikten gör det inte. **Vid divergens styr avsikten.**
2. **Nästan för snäv.** Markör-kravet gjorde först att grinden krävde markören på
   samma rad — men det verkliga felet är **radbrutet**. Grinden hade missat exakt
   det fall den byggdes för.

## Alternativ som övervägdes

- **Ingen grind, bara städa raderna.** Förkastad: raderna hade städats en gång
  och felet hade kunnat återuppstå osynligt. Grinden kostar en `grep` per körning.
- **Grind som läser påståendets innebörd.** Förkastad — kräver semantik, se
  beslut 3.
- **Grind i hub-repot också.** Förkastad **med öppen lucka**: hubben har ingen CI,
  ingen `scripts/`-katalog och ingen settings-fil. En grind som ingen kör är inte
  en grind, utan just den sortens artefakt denna ADR handlar om. Hub-`CLAUDE.md`
  är oskyddad tills hubben får CI.

## Konsekvenser

**Positiva:** ett dokument kan inte längre tyst påstå en mekanism som inte finns ·
granskningen återförs på regler som är prosa · den förkastade trion är durabelt
bokförd så den inte återföreslås.

**Negativa / skuld:** grinden täcker `permissions.*`, inte varje tänkbart
mekanism-påstående (*"hooken fångar detta"*, *"CI stoppar det"* är oadresserade) ·
hub-filen är oskyddad, se ovan · `CLAIM_MARKERS` är en ändlig lista och ett nytt
sätt att hävda mekanisering på passerar tills listan utökas.

## Relaterat

- [ADR-079](ADR-079-instruktionsleverans-barare-per-lager.md) — mätningen som
  motiverar mekanism före skriven regel, och som denna ADR avgränsar
- [ADR-039](ADR-039-konsistens-grindar-kadens.md) — lesson→grind-kravet på
  fortlöpande verifiering av fyrningen
- [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) — triagen som defer-och-fortsätt
  lutar sig mot
- [ADR-041](ADR-041-session-end-do-confirm-roll.md) — fångst-raterna som gör extern fångst
  till huvudmekanismen
- S91 Del 28 (grillningens `A2:8`) · Del 30.2 (de sex fällda påståendena)
