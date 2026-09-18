// scripts/lib/hermetik-tackning.mjs — täckningskontrollen för det SHARDADE
// hermetik-självtestet (TASK-366 / N6 i CI-djupgranskningens nu-hög, PRD
// TASK-450).
//
// ═══ VARFÖR DEN HÄR FILEN FINNS ═══
// `scripts/hermetik-sjalvtest.mjs` bär acceptance-klassens tvåsidiga bevis
// (ADR-080 beslut 3): normalläget töms och VARJE test måste då fällas av
// hermetik-vakten. Domen är fail-closed på tomhet — "noll tester kördes, en tom
// svit bevisar ingenting" — och den spärren räcker så länge beviset körs i EN
// process över hela klassen.
//
// Delas beviset i skärvor räcker den inte längre. Varje skärva för sig är
// icke-tom, så tomhetsspärren säger grönt i var och en av dem även när de
// TILLSAMMANS inte täckte klassen: faller en skärva bort som jobb, kommer dess
// artefakt inte fram, eller matchar ett filter fel, blir summan mindre än
// klassen utan att någon dom märker det. Ett tvåsidigt bevis som delas i tre är
// inte längre ett bevis om summan inte kontrolleras.
//
// Därför byggdes den här kontrollen FÖRE delningen, i samma ändringsförslag
// (Marcus-beslut via PRD TASK-450): varje skärva skriver ned hur många tester
// den prövade OCH hur många klassen listar, och ett sammanfattande jobb kräver
// att summan går ihop.
//
// ═══ VAD SOM FAKTISKT KONTROLLERAS, OCH VAD SOM INTE GÖR DET ═══
// Den bärande invarianten är EN: summan av skärvornas prövade tester är lika
// med det antal klassen (eller PR-ytans urval) listar. Allt annat här är
// hjälpkontroller vars uppgift är att göra ett brott BEGRIPLIGT — "skärva 3 av
// 3 saknas" i stället för bara "summan är 349, väntat 524".
//
// LÄS DEN GRÄNSEN BOKSTAVLIGT (ADR-083: påstå aldrig mer än mekanismen bär).
// Kontrollen fäller när en skärva INTE RAPPORTERAR: jobbet föll bort, artefakten
// kom inte fram, matrisen krympte utan att nämnaren i `--shard=I/N` följde med,
// eller ett filter matchade fel. Krymps matrisen OCH nämnaren TILLSAMMANS (vilket
// är vad `strategy.job-total` gör i ci-suite.yml) täcker de färre, större
// skärvorna fortfarande hela klassen — summan går ihop och kontrollen fäller
// korrekt INTE. Det är invariantens rätta beteende, inte en lucka: täckningen är
// oskadd, bara topologin är en annan.
//
// DEN SKYDDAR INTE MOT ATT KLASSEN SJÄLV KRYMPER. Både täljaren (summan av
// skärvornas prövade) och nämnaren (`listat`) härleds ur SAMMA Playwright-config
// i samma träd. Ett `testIgnore`, ett omdöpt projekt eller en flyttad testkatalog
// krymper därför BÅDA talen i takt, och summan går ihop precis som förut. Det är
// ingen regression — kontrollen byggdes aldrig för det — men ingen ska läsa den
// som det skyddet. Att klassen innehåller rätt tester vaktas av helt andra ytor
// (ADR-080 beslut 3 och klassens egen kodgranskning), inte här.
//
// Kontrollen prövar TÄCKNING, aldrig DOM. Att varje prövat test faktiskt fälldes
// AV VAKTEN avgörs av `bedomPositivt` i hermetik-sjalvtest.mjs, per skärva, och
// den spärren är oförändrad av delningen.

/** Rapportformatets version. Höjs vid varje bakåtinkompatibel fältändring. */
export const TACKNING_SCHEMA_VERSION = '1.0';

/**
 * Bygger en skärvas täckningsrapport.
 *
 * `provade` och `listat` MÅSTE komma från samma räknefunktion (`plattaTester` i
 * hermetik-sjalvtest.mjs) applicerad på Playwrights JSON-rapport i körnings-
 * respektive `--list`-läge. Se hermetik-sjalvtest.mjs § RÄKNESÄTTET för varför
 * det är en korrekthetsfråga och inte en stilfråga.
 */
export function byggTackningsrapport({ shardIndex, shardTotal, provade, listat, projekt, filter }) {
  return {
    schemaVersion: TACKNING_SCHEMA_VERSION,
    shardIndex,
    shardTotal,
    provade,
    listat,
    projekt,
    filter: [...(filter ?? [])],
  };
}

/**
 * Parsar och formvaliderar EN rapport. Returnerar `{ rapport, fel }` där exakt
 * ett av fälten är satt.
 *
 * Fail-closed på varje formavvikelse: en rapport som inte går att lita på får
 * aldrig tyst räknas som noll, för då hade en trasig skärva sett ut som en
 * skärva utan tester i stället för som ett fel.
 */
export function parsaTackningsrapport(raw, kalla) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (orsak) {
    return { rapport: null, fel: `${kalla}: inte giltig JSON (${orsak.message})` };
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { rapport: null, fel: `${kalla}: rotvärdet är inte ett objekt` };
  }

  if (data.schemaVersion !== TACKNING_SCHEMA_VERSION) {
    return {
      rapport: null,
      fel:
        `${kalla}: schemaVersion '${data.schemaVersion}' känns inte igen ` +
        `(väntat '${TACKNING_SCHEMA_VERSION}')`,
    };
  }

  for (const falt of ['shardIndex', 'shardTotal', 'provade', 'listat']) {
    const varde = data[falt];
    if (!Number.isInteger(varde) || varde < 0) {
      return {
        rapport: null,
        fel: `${kalla}: fältet '${falt}' är ${JSON.stringify(varde)} — väntat ett heltal >= 0`,
      };
    }
  }

  if (data.shardTotal < 1) {
    return { rapport: null, fel: `${kalla}: shardTotal är ${data.shardTotal} — väntat >= 1` };
  }
  if (data.shardIndex < 1 || data.shardIndex > data.shardTotal) {
    return {
      rapport: null,
      fel:
        `${kalla}: shardIndex ${data.shardIndex} ligger utanför 1..${data.shardTotal} ` +
        '— indexet och nämnaren hör inte ihop',
    };
  }

  return { rapport: { ...data, kalla }, fel: null };
}

/**
 * Prövar att skärvorna TILLSAMMANS täckte klassen.
 *
 * Returnerar `{ hallbart, avvikelser, summa, listat, shardTotal }`. Varje
 * avvikelse är en färdig rad avsedd att läsas av en människa i en jobblogg.
 */
export function bedomTackning(rapporter) {
  const avvikelser = [];

  // FAIL-CLOSED PÅ TOMHET, samma disciplin som hermetik-sjalvtest.mjs egen
  // tomhetsspärr: noll rapporter uppfyller "summan stämmer" vakuöst. Utan denna
  // rad hade ett tomt artefakt-nedladdningssteg gett grönt besked.
  if (rapporter.length === 0) {
    return {
      hallbart: false,
      avvikelser: [
        'noll täckningsrapporter hittades — utan en enda skärva att summera ' +
          'bevisar kontrollen ingenting (fail-closed)',
      ],
      summa: 0,
      listat: null,
      shardTotal: null,
    };
  }

  // ALLA SKÄRVOR MÅSTE HA KÖRT MOT SAMMA NÄMNARE. Skiljer de sig har jobben
  // körts mot olika matriser, och varken summan eller indexmängden nedan
  // betyder då något.
  const totaler = [...new Set(rapporter.map((r) => r.shardTotal))].sort((a, b) => a - b);
  if (totaler.length > 1) {
    avvikelser.push(
      `skärvorna rapporterar OLIKA shardTotal (${totaler.join(', ')}) — de har inte kört mot ` +
        'samma matris, så summan går inte att tolka',
    );
  }
  const shardTotal = totaler[0];

  // ALLA SKÄRVOR MÅSTE HA SETT SAMMA KLASS. Skiljer `listat` sig åt har trädet
  // divergerat mellan jobben (olika checkout, halvvägs landad ändring) — då är
  // det inte summan som är fel utan förutsättningen.
  const listade = [...new Set(rapporter.map((r) => r.listat))].sort((a, b) => a - b);
  if (listade.length > 1) {
    avvikelser.push(
      `skärvorna rapporterar OLIKA listat antal (${listade.join(', ')}) — de har inte sett ` +
        'samma testmängd, alltså inte samma träd',
    );
  }
  const listat = listade[0];

  // EN TOM KLASS BEVISAR INGENTING, exakt som en tom svit inte gör det. Utan
  // denna rad hade ett felstavat projektnamn gett `listat: 0` och en summa som
  // trivialt går ihop.
  if (listat === 0) {
    avvikelser.push(
      'klassen listar NOLL tester — ett felstavat projektnamn eller ett filter som inte ' +
        'matchar något ger en summa som går ihop trivialt (fail-closed)',
    );
  }

  // INDEXMÄNGDEN MÅSTE VARA EXAKT 1..N. Det är här en borttagen eller bortfallen
  // skärva blir BEGRIPLIG i stället för att bara visa sig som en för liten summa.
  const index = rapporter.map((r) => r.shardIndex);
  const dubbletter = [...new Set(index.filter((i, n) => index.indexOf(i) !== n))].sort(
    (a, b) => a - b,
  );
  if (dubbletter.length > 0) {
    avvikelser.push(
      `skärv-index ${dubbletter.join(', ')} rapporterades FLERA gånger — samma skärva kan ha ` +
        'räknats dubbelt, vilket kan dölja att en annan saknas',
    );
  }

  if (Number.isInteger(shardTotal) && totaler.length === 1) {
    const sedda = new Set(index);
    const saknade = [];
    for (let i = 1; i <= shardTotal; i += 1) if (!sedda.has(i)) saknade.push(i);
    if (saknade.length > 0) {
      avvikelser.push(
        `skärva ${saknade.join(', ')} av ${shardTotal} SAKNAS — bara ${sedda.size} av ` +
          `${shardTotal} rapporter kom fram. Ett skärv-jobb föll bort, dess artefakt nådde ` +
          'aldrig hit, eller matrisen krympte utan att nämnaren följde med.',
      );
    }
  }

  const summa = rapporter.reduce((n, r) => n + r.provade, 0);

  // DEN BÄRANDE INVARIANTEN. Allt ovan finns för att göra ett brott läsbart;
  // detta är kontrollen som gör delningen till ett bevis igen.
  if (Number.isInteger(listat) && listade.length === 1 && summa !== listat) {
    const tecken = summa < listat ? 'FÄRRE' : 'FLER';
    avvikelser.push(
      `summan av skärvornas prövade tester är ${summa}, men klassen listar ${listat} — ` +
        `${Math.abs(listat - summa)} ${tecken} än väntat. Beviset gäller alltså inte hela ` +
        'klassen, hur gröna de enskilda skärvorna än var.',
    );
  }

  return {
    hallbart: avvikelser.length === 0,
    avvikelser,
    summa,
    listat: listade.length === 1 ? listat : null,
    shardTotal: totaler.length === 1 ? shardTotal : null,
  };
}
