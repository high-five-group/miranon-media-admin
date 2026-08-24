# En variabel som bär både ett VÄRDE och svaret på "har vi laddat än?" är en söm — och utskriften som namnger källan ljuger först

**Memoisera aldrig på ett värdes eget "är den satt?". Bär en variabel två
informationer — vilket värde som gäller OCH om källan lästs — kan den som
sätter värdet utifrån stänga av inläsningen helt, inte bara påverka dess
resultat. Följdfelet är värre än sömmen: framgångsraden fortsätter namnge
policyfilen som källa när värdet kom ur miljön. Låt memo-flaggan vara egen och
privat, nollställ värdet ovillkorligt före inläsning — och pröva varje
utskrift som namnger sin källa genom att låta källorna säga OLIKA saker.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, granskningen av PR `#1915`): resolvern
`scripts/lib/supabase-cli.sh` bar
`SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-}"` (rad 106 vid `a597fbaa`) och
memoiserade på variabelns eget tillstånd
(`[[ -n "${SUPABASE_CLI_VERSION}" ]] && return 0`, rad 112). En ambient
miljövariabel kortslöt därför hela policyfilen — den lästes aldrig.
Reproducerat förstahands mot `a597fbaa` med stubbad `npx` och en policyfil som
sa `2.115.0`:

```text
PRE-FIX  utan env-var         exit=0  ✓ verifierad: 2.115.0 (pinnad, <policyfil>)
PRE-FIX  env-var 2.75.0       exit=0  ✓ verifierad: 2.75.0  (pinnad, <policyfil>)
EFTER    env-var 2.75.0       exit=0  ✓ verifierad: 2.115.0 (pinnad, <policyfil>)
```

Guarden vars ENDA syfte var att göra `2.75.0` omöjlig bad `npx` om exakt den
CLI-version som fällt prod-deployen — med **exit 0** och en framgångsrad som
ändå skrev `(pinnad, <policyfil>)`. Fixen angrep roten, inte symptomet: en egen
privat `_SUPABASE_CLI_POLICY_LOADED`, versionen nollställd ovillkorligt vid
`source`, och ett värde-nivå-override övervägt och avvisat med skälet
nedskrivet i filen (testisolering täcks redan av att peka om HELA filen via
`SUPABASE_CLI_POLICY_FILE`). Tvåsidigt bevis i
`scripts/test-supabase-cli-policy.sh` T9 — ommätt här: **25/25 PASS, exit 0**.
Fångat av granskningen FÖRE landning.

**Avgränsning mot familjen — den är väl bevakad, men på andra axlar.**
[[L409]] är klassens rot: en regel som PÅSTÅR en mekanism den saknar granskas
inte. Där saknades mekanismen helt; här FANNS den, den läste bara fel källa och
skrev ut fel källnamn. [[L387]] kräver att *varje* led i ett instrument prövar
samma env-flagga — där är felet vilket villkor som grindar rapporten, här att
en variabel bär två informationer, vilket ger en annan åtgärd: dela variabeln,
inte flytta villkoret. [[L336]] riktar sin regel till den som KONSUMERAR en
vakts utsaga (behandla den som hypotes); denna riktar sig till den som SKRIVER
utsagan. [[L478]] har samma kringgång av en config-gräns via en yttre kanal
(kommandoradsargument i stället för miljövariabel) men utan den falska
källattributionen. Fragmentet
`stampel-sha-harleds-ur-ref-som-star-stilla.md` ligger närmast av alla — där
kom värdet från en FÖRÅLDRAD källa, här från en HELT ANNAN källa än den som
namnges, och det är namngivningen som är lögnen. [[L371]] bär redan satsen
*"loggraden ska spegla vad som faktiskt injicerades, inte vad som avsågs"*,
men som bisats i en post om en teckengräns, där ingen som söker detta hittar
den.

**Det generella:** tre saker gör felmoden möjlig, och alla tre är
återanvändbara. (1) **`${VAR:-}` är inte en default, det är en söm** — idiomet
läser som "tomt om osatt" men betyder "vem som helst i omgivningen får
bestämma", och gör en fail-closed policyfil överskrivbar av precis den
omgivning den finns för att stänga ute. (2) **Memoisering på ett värdes eget
tillstånd konflaterar två frågor**, och den som kan sätta värdet utifrån
avaktiverar då inläsningen. (3) **En utskrift är ett starkare sanningsanspråk
än ett dokument**, eftersom den framstår som en mätning av det som just hände i
stället för en beskrivning skriven i förväg — den tar bort granskningen precis
som `ADR-083`:s prosa gör, men i det ögonblick en oåterkallelig operation ska
godkännas. Därav prövningsformen: en grind som bara körs mot ETT tillstånd
mäter att den kan skriva ut ett grönt tecken, inte att den läser det den säger.
Och detta är den ANDRA oberoende instansen av `ADR-083`-felet inuti
`ADR-083`-arbetet — [[L420]] var den första — vilket gör mönstret till en regel
värd att koda: en fix som stänger en felklass ska prövas mot SIN EGEN klass
innan den landar, för den PR som är mest benägen att återinföra ett fel är den
som skrivs av någon som just tänkt på det.
