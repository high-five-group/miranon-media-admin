# Läs det egna beslutsarkivet före ett arkitekturförslag

**Innan en arkitektur-rekommendation formuleras: sök det EGNA beslutsarkivet
efter frågan. Den kan redan vara besvarad — ibland på användarens egen tidigare
fråga, i samma ämne, med research bakom sig. Att rekommendera utan den
sökningen är att kasta bort arbete som redan är betalt.** `[UNIVERSAL]`

Datum: 2026-08-05 (S96, femte resumen) | Klass: förslag utan förankring

## Instansen

`TASK-127.9` (rundturs-e2e för inbjudningsflödet) blockerades av att
`generateLink`/`deleteUser` kräver `service_role`, otillgängligt i CI. Jag lade
fram två vägar och rekommenderade **A** — en snäv, staging-only Edge Function —
med motiveringen att repot redan bär `test-auth` som fail-closed-precedent.

Marcus svarade med en fråga, inte ett val:

> *"Om alternativ A är hur branschledare gör så väljer jag det, är de det?"*

Jag hade inte belagt det. Rekommendationen vilade på ett INTERNT mönster, inte
på branschpraxis — och jag hade inte sagt det.

## Vad sökningen hittade

Två saker, i den ordningen:

1. **Förstapartskällan pekade åt ett annat håll.** Supabases egen guide säger
   *"Start Supabase locally in CI with `supabase start`"*, och den lokala
   stacken kör en mail-catcher med API avsett för just automatiserad testning.
   Det löser samtidigt alla tre luckor som blockerade kortet — ingen av dem
   krävde en ny Edge Function.

2. **Vårt eget arkiv hade redan svaret.** `ADR-063` § S91-not, skriven
   2026-07-27, slår fast att *"branschen köper determinism genom att duplicera
   backend per körning"*, citerar Googles SUT-ranking och Thoughtworks
   HOLD-lista mot delad muterbar testmiljö, och konstaterar att de tvång som
   stänger den dörren gäller **Airtable** — inte Supabase.

Noten skrevs dessutom som svar på **Marcus egen fråga**, ordagrant nästan
densamma: *"Vi tvingas att frångå branschledande mönster/config för att
Airtable tvingar oss, är det rätt tolkat?"*

Flödet i `TASK-127.9` rör bara Supabase Auth. Det låg alltså i precis den del
där vårt eget arkiv redan sagt att branschmönstret är öppet för oss.

## Regeln fanns — den efterlevdes inte

Konstitutionen säger det uttryckligen: *"Inför ett arkitekturförslag: läs den
styrande ADR:n i sin helhet och kartlägg hela options-rymden innan förslaget
formuleras."* Jag hoppade båda leden och byggde på det första mönster jag råkade
känna igen i repot.

Det som gör instansen värd att skriva ned är inte att en regel bröts, utan
**vad som maskerade brottet**: förslaget var internt konsistent, byggde på en
äkta precedent i repot (`test-auth`), och lät välgrundat. Ingenting i formen
avslöjade att en hel options-gren saknades. Bara den externa frågan gjorde det.

## Regeln

Innan du lägger fram ett arkitekturval:

1. **Sök arkivet på ämnet** — ADR:er, research-filer, trådkort. En träff är
   ofta ett färdigt svar med belägg.
2. **Deklarera grunden explicit.** "Detta vilar på ett internt mönster, inte på
   branschbelägg" är en helt annan rekommendation än en källbelagd — och
   mottagaren kan bara väga den om skillnaden syns.
3. **Ett internt mönster är inte precedent.** Att repot gör något på ett visst
   sätt säger att det är möjligt, inte att det är rätt.

Se även [[bokforing-kan-bli-falsk-utan-att-nagon-andrar-den]] — motsatt
felriktning: där ljög arkivet, här lästes det aldrig.
