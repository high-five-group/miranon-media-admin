// storage-kopiera — server-side kopiering av ETT objekt INOM en Storage-bucket,
// via Storage-API:ts egen `POST /storage/v1/object/copy` (TASK-340.1,
// PRD `TASK-340` § Implementationsbeslut A).
//
// ── VARFÖR RÅ REST OCH INTE `supabaseAdmin.storage.from(b).copy(a, b)` ────
// Detta är en MÄTT avvikelse från research-passets § 4, inte ett bekvämlighets-
// val. Passet belade att `copy(fromPath, toPath)` finns i `storage-js` ≥ 2.6.0
// och fungerar inom en bucket — sant, men det säger ingenting om en
// destination som REDAN FINNS, vilket är exakt vårt vanligaste fall: ersatt-
// vägen skriver över eventets befintliga fil på SAMMA lagringsnyckel
// (`ADR-125` § 3, `upsert: true` sedan `TASK-309.4`).
//
// Mätt skarpt mot STAGING (`pqtshyierkdgwdnxuirz`, Storage-server v1.71.0,
// 2026-08-29), tre armar i EN körning:
//
//   | Arm                                          | Utfall                       |
//   |----------------------------------------------|------------------------------|
//   | `copy()` → FRI destination                   | 200, byte-identisk kopia     |
//   | `copy()` → BEFINTLIG destination             | **409 "The resource already exists"** |
//   | `POST /object/copy` + header `x-upsert: true` | **200**, destinationen bar källans bytes |
//
// Orsaken syns i SDK:ns egen kod: `copy()` POST:ar `{ bucketId, sourceKey,
// destinationKey, destinationBucket }` med klientens standard-headers och
// sätter ALDRIG `x-upsert` (verifierat i den installerade `storage-js`
// 2.111.0:s källa OCH i den bundlade 2.112.4 som EF:erna faktiskt kör —
// `esm.sh/@supabase/supabase-js@2` löste till 2.112.4 vid mätningen).
// `DestinationOptions` bär bara `destinationBucket`. SERVERN stödjer alltså
// upsert på copy; SDK:n exponerar det bara inte — samma klass av lucka som
// research § 4 redan bokförde för `copyMetadata` (*"finns i REST men
// exponeras inte av storage-js"*).
//
// Alternativen som vägdes och förkastades:
//   - `remove(dest)` + `copy()` — två anrop, ICKE-atomärt: fallerar det
//     andra står Bilagor-raden kvar och pekar på en fil som inte finns.
//   - `download(utkast)` + `upload(dest, bytes, { upsert: true })` — hade
//     fungerat, men skickar hela PDF:en genom EF:en i BÅDA riktningarna för
//     att åstadkomma en operation servern redan kan göra själv, och gör
//     "promoveringen" till en om-uppladdning. Kortets och PRD:ns ordalydelse
//     är Storage copy; den är också den billigare och mer korrekta.
//
// ── VARFÖR EN EGEN, BEROENDEFRI FIL ──────────────────────────────────────
// Samma skäl som `_shared/promoveringsbeslut.ts` och
// `_shared/attachment-filename.ts`: filen importerar INGENTING, så
// `tests/api/promoveringsbeslut.test.ts` kan köra den mot en INJICERAD
// `fetch` och bevisa anropsformen (headern, kroppen, felhanteringen) i
// `api-pure` — utan nätverk, utan creds, mot produktionskoden.

/** Den delmängd av Storage-svaret vi faktiskt läser. Servern returnerar hela
 *  objektets metadata vid en lyckad copy (mätt: `{"Key": "...", "name": "...",
 *  "metadata": { "size": 28, "mimetype": "application/pdf", ... }}`). */
interface KopieringsSvar {
  Key?: unknown;
  metadata?: { size?: unknown } | null;
}

export interface KopieringsResultat {
  /** Destinationens fulla nyckel som servern rapporterar den (`<bucket>/<path>`). */
  nyckel: string | null;
  /** Objektets storlek i bytes: serverns egna `metadata.size` när den finns
   *  (den beskriver DESTINATIONEN), annars `forvantadStorlek`. ALLTID ett tal
   *  — se `forvantadStorlek`s docblock för varför `null` inte längre är ett
   *  möjligt utfall. */
  storlek: number;
  /** Sant när serverns svar bar en egen `metadata.size`; falskt när värdet
   *  är `forvantadStorlek` (källans redan kända storlek). Enbart för
   *  loggning/diagnos — båda fallen är korrekta, eftersom en copy är
   *  byte-identisk. */
  storlekFranServern: boolean;
}

/**
 * Kopierar `franPath` → `tillPath` inom `bucket`, med `x-upsert: true` så en
 * BEFINTLIG destination skrivs över i stället för att ge 409 (se filhuvudet).
 *
 * Kastar `Error` med serverns statuskod och kropp i meddelandet om anropet
 * inte lyckas — anroparen mappar det till sitt eget felkontrakt
 * (`mapErrorToResponse`), precis som `laggUtkast` gör för sina Storage-fel.
 *
 * @param forvantadStorlek Källobjektets REDAN KÄNDA storlek i bytes.
 *   OBLIGATORISK, och kontrollerad INNAN något nätverksanrop görs.
 *
 *   [REVIEW-RUNDA 2] Detta är en ORDNINGS-spärr, inte en bekvämlighet. Den
 *   promoverande skrivvägen skriver destinationen FÖRE Bilagor-raden
 *   uppdateras. Tog vi storleken ur kopieringens SVAR och den saknades, var
 *   den enda ärliga utvägen att fela — men då hade filen redan bytts ut
 *   medan raden stod kvar med gammal `Källhash` och gammal storlek mot ett
 *   nytt innehåll (i ersätt-fallet: en rad som beskriver fel fil). Genom att
 *   kräva storleken FÖRE anropet kan det fönstret inte uppstå: saknas den
 *   kopieras ingenting alls. Serverns egen `metadata.size` används fortsatt
 *   när den finns — en copy är byte-identisk, så de två talen ska vara lika,
 *   och en avvikelse loggas av anroparen.
 *
 * @param fetchImpl Injicerbar för enhetstest; default är global `fetch`
 *   (finns i både Deno och Node ≥ 18).
 */
export async function kopieraInomBucket(params: {
  supabaseUrl: string;
  serviceRoleKey: string;
  bucket: string;
  franPath: string;
  tillPath: string;
  forvantadStorlek: number;
  fetchImpl?: typeof fetch;
}): Promise<KopieringsResultat> {
  const { supabaseUrl, serviceRoleKey, bucket, franPath, tillPath, forvantadStorlek } = params;
  const doFetch = params.fetchImpl ?? fetch;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('kopieraInomBucket: supabaseUrl och serviceRoleKey krävs');
  }
  // FÖRE fetch — se `forvantadStorlek`s docblock. Ingen kopiering utan känd
  // storlek, någonsin.
  if (typeof forvantadStorlek !== 'number' || !Number.isFinite(forvantadStorlek) || forvantadStorlek < 0) {
    throw new Error(
      'kopieraInomBucket: forvantadStorlek måste vara ett känt, icke-negativt tal — ' +
        'ingen kopiering får ske innan källans storlek är känd',
    );
  }

  const res = await doFetch(`${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/copy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
      // DEN ENDA anledningen till att detta anrop inte går via storage-js.
      'x-upsert': 'true',
    },
    body: JSON.stringify({
      bucketId: bucket,
      sourceKey: franPath,
      destinationKey: tillPath,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Storage-kopiering misslyckades (${res.status}): ${raw}`);
  }

  let parsed: KopieringsSvar;
  try {
    parsed = JSON.parse(raw) as KopieringsSvar;
  } catch {
    // Lyckad status men oparsbar kropp: kopieringen ÄR gjord. Storleken är
    // känd ändå — det är hela poängen med `forvantadStorlek`.
    return { nyckel: null, storlek: forvantadStorlek, storlekFranServern: false };
  }

  const rapporterad = parsed.metadata?.size;
  const franServern = typeof rapporterad === 'number' && Number.isFinite(rapporterad);
  return {
    nyckel: typeof parsed.Key === 'string' ? parsed.Key : null,
    storlek: franServern ? (rapporterad as number) : forvantadStorlek,
    storlekFranServern: franServern,
  };
}
