#!/usr/bin/env node
// scripts/provision-attachments-bucket.mjs
//
// TASK-146.3 — provisionerar bilagornas PRIVATA Supabase Storage-bucket via
// ett incheckat, idempotent skript i stället för konsolklick.
//
// VARFÖR SKRIPT OCH INTE KONSOL (samma skäl som TASK-146.2:s bas-tabell-
// skript gav för sin yta): repot har varken `supabase/migrations/` eller
// någon storage-konfiguration i git idag — Supabase används här bara för
// Edge Functions och Auth (verifierat mot disk: `ls supabase/` visar
// config.toml + functions/ + templates/, ingen migrations/). Görs
// uppsättningen för hand blir den odokumenterad och oupprepbar, och nästa
// miljö får gissa. Ingen extern resurs har alltså en deklarativ hemvist i
// detta repo — det är precis skälet AC #1 kräver detta skript.
//
// BUCKETEN ÄR PRIVAT (`public: false`) — kortets egen motivering:
// "Kursdeltagares kvitton ska aldrig ligga öppet." VALT MEDVETET (kortet):
// signerade URL:er, inte publik bucket, trots att intern precedent för en
// publik bucket finns i ett systerprojekt.
//
// PATH-FORMEN som byggs ovanpå denna bucket prefixar per event:
// `{eventId}/{attachmentId}-{filnamn}` — forskningspassets rekommendation
// (docs/research/utskicks-bilage-arkitektur-2026-08-03.md § Delfråga 2,
// "Bucket-struktur för per-event-kopplade filer"). Detta skript äger bara
// BUCKETEN; path-formen bevisas av test-attachments-storage-funktionen och
// dess staging-test (samma skiva, TASK-146.3 AC #2+#3).
//
// STORLEKSGRÄNS — 25 MB (26 214 400 bytes), motiverat:
//   Resends dokumenterade per-mail-tak är 40 MB EFTER base64-kodning
//   (resend.com/docs/dashboard/emails/attachments, citerat i
//   docs/research/utskicks-bilage-arkitektur-2026-08-03.md § Delfråga 1).
//   Base64 är ~33 % större än källan, så praktiskt RÅ-bytes-utrymme är
//   ~30 MB. 25 MB lämnar medveten marginal under den gränsen (kuvert för
//   mail-headers/andra bilagor i samma sändning) och ligger långt under
//   stagingens Pro-plans globala storage-tak (500 GB — ADR-050, projektet
//   är Pro, inte Free). PRD:ns egen formulering: "Prislappen på storlek är
//   inte vår, den är Resends."
//
// MIME-FILTER — 'application/pdf' ENDAST: PRD:ns tre dokumentklasser
// (uppladdad/event-mallad/person-genererad) är alla PDF:er
// (Implementationsbeslut: "PDF-generering sker inom plattformen"). Detta är
// försvar-i-djupet UTÖVER vad appens egen validering gör — inte en ersättning
// för den. Utökas medvetet den dag en ny dokumenttyp tillkommer.
//
// MILJÖ — STAGING ENDAST. Skriptet är en ALLOWLIST av EN: kör bara mot det
// kända staging-project-ref:et, vägrar allt annat (inklusive det kända
// PROD-ref:et, med ett eget, tydligare felmeddelande). Samma två konstanter
// som src/lib/env-coherence.ts (STAGING/PROD_SUPABASE_REF) — duplicerade
// HÄR MEDVETET: detta är ett fristående Node-skript utanför Vite-bygget och
// kan inte importera den TS-modulen utan en byggkedja för ett tvåradersvärde.
// Prod-körningen är ett Marcus-moment (kortets egen instruktion) — bokförs
// öppet som inte utförd av denna agent, precis som TASK-146.2 gör för sin yta.
//
// SERVICE-ROLE-NYCKELN LEVER ALDRIG PÅ DISK. Hämta engångs, kör, kasta —
// samma mönster som docs/research/
// task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md använde:
//
//   SUPABASE_URL="https://pqtshyierkdgwdnxuirz.supabase.co" \
//   SUPABASE_SERVICE_ROLE_KEY="$(supabase projects api-keys \
//     --project-ref pqtshyierkdgwdnxuirz -o json \
//     | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
//         const k=JSON.parse(s).find(k=>k.name==="service_role");
//         process.stdout.write(k.api_key);
//       })')" \
//   node scripts/provision-attachments-bucket.mjs
//
// Flaggor:
//   --dry-run          Visar önskat vs faktiskt tillstånd. Ändrar ingenting.
//   --kontrollera <ref>  Read-only konvergenskontroll ÄVEN mot PROD (TASK-308).
//                        Se § KONTROLLERA-LÄGET nedan — detta är den ENDA
//                        avsiktliga vägen förbi assertStagingOnly, och den
//                        skriver ALDRIG (tvingar dryRun internt).
//
// IDEMPOTENT: bucketen finns inte → skapas. Bucketen finns och matchar redan
// önskad konfiguration → "redan konvergerad", ingen mutation. Bucketen finns
// men avviker (t.ex. någon råkat ändra den via dashboarden) → konvergeras
// med `updateBucket`. Körs skriptet igen direkt efter är utfallet alltid
// "redan konvergerad" — ingen bucket raderas eller återskapas i onödan.
//
// Exit 0 vid lyckad provisionering (skapad, konvergerad eller redan-OK).
// Exit 1 vid saknad env, fel miljö (icke-staging-ref), eller ett Storage-
// API-fel som inte är "bucket saknas".
//
// ═══ KONTROLLERA-LÄGET (TASK-308) ═══
//
// `--kontrollera <ref>` är skriptets ENDA avsiktliga läsväg mot PROD —
// byggd efter att `preview-receipt` mätte 502 "Bucket not found" i prod
// 2026-08-23 (TASK-308): bucketen provisionerades aldrig där, för att
// assertStagingOnly() by design vägrar allt utom staging. Marcus skapade
// bucketen för hand i dashboarden samma dag; detta läge gör konvergensen
// MÄTBAR efteråt, upprepbart, utan att skriptets skrivväg någonsin öppnas
// mot prod.
//
// SAMMA LÅS-MÖNSTER SOM fas4-prod-deploy.sh: refen är ett ARGUMENT, aldrig
// läst ur env/config villkorslöst — den MÅSTE dessutom matcha den faktiska
// SUPABASE_URL som redan krävs (se main()). Detta är en explicit
// dubbelkontroll, inte en genväg: kommandoraden bär refen synligt (samma
// skäl som scripts/deny-prod-ref.sh § header — en agents Bash-anrop med
// PROD_REF_PROD i kommandosträngen FÄLLS mekaniskt av den hooken), och
// Marcus egen körning (via `!`-prefixet, som passerar PreToolUse) är den
// ENDA vägen detta läge någonsin faktiskt kör mot prod.
//
// LÄSER, SKRIVER ALDRIG: tvingar dryRun=true internt oavsett `--dry-run`.
// Exit 0 = bucketen finns och matchar BUCKET_DESIRED_CONFIG (konvergerad).
// Exit 1 = bucketen saknas, avviker, ref/URL matchar inte, eller ett
//          Storage-API-fel — FAIL-CLOSED, så en anropare (t.ex.
//          fas4-prod-deploy.sh --deploya) kan gata en Storage-beroende
//          EF-deploy på detta exitkod.
//
// Exempel (Marcus, prod):
//   SUPABASE_URL="https://lvjsfnphlauldxqlncpl.supabase.co" \
//   SUPABASE_SERVICE_ROLE_KEY="$(supabase projects api-keys \
//     --project-ref lvjsfnphlauldxqlncpl -o json \
//     | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
//         const k=JSON.parse(s).find(k=>k.name==="service_role");
//         process.stdout.write(k.api_key);
//       })')" \
//   node scripts/provision-attachments-bucket.mjs --kontrollera lvjsfnphlauldxqlncpl

import { createClient } from '@supabase/supabase-js';

// Samma två konstanter som src/lib/env-coherence.ts — se fil-header § MILJÖ
// för varför de är duplicerade här i stället för importerade.
const STAGING_PROJECT_REF = 'pqtshyierkdgwdnxuirz';
const PROD_PROJECT_REF = 'lvjsfnphlauldxqlncpl';

export const BUCKET_ID = 'bilagor';

// 25 MB — se fil-header § STORLEKSGRÄNS för det fulla resonemanget.
export const BUCKET_FILE_SIZE_LIMIT_BYTES = 25 * 1024 * 1024;

export const BUCKET_DESIRED_CONFIG = {
  public: false,
  fileSizeLimit: BUCKET_FILE_SIZE_LIMIT_BYTES,
  allowedMimeTypes: ['application/pdf'],
};

export function extractProjectRef(url) {
  const match = /^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i.exec((url ?? '').trim());
  if (!match) {
    throw new Error(`Kan inte tolka ett projekt-ref ur SUPABASE_URL: "${url}"`);
  }
  return match[1];
}

/** Fail-closed miljövakt. Kastar med ett förklarande skäl vid varje avvikelse. */
export function assertStagingOnly(url) {
  const ref = extractProjectRef(url);
  if (ref === PROD_PROJECT_REF) {
    throw new Error(
      `VÄGRAR: "${ref}" är PROD-projektets ref. Detta skript kör ENDAST mot ` +
        `staging (${STAGING_PROJECT_REF}). Prod-körningen är ett Marcus-moment ` +
        '(TASK-146.3 § Miljö) — inte något detta skript någonsin gör.',
    );
  }
  if (ref !== STAGING_PROJECT_REF) {
    throw new Error(
      `VÄGRAR: okänt projekt-ref "${ref}" i SUPABASE_URL. Förväntade staging-` +
        `ref "${STAGING_PROJECT_REF}".`,
    );
  }
  return ref;
}

function bucketConfigMatches(existing, desired) {
  const existingMime = [...(existing.allowed_mime_types ?? [])].sort();
  const desiredMime = [...desired.allowedMimeTypes].sort();
  return (
    existing.public === desired.public &&
    existing.file_size_limit === desired.fileSizeLimit &&
    existingMime.length === desiredMime.length &&
    existingMime.every((value, index) => value === desiredMime[index])
  );
}

function looksLikeNotFound(error) {
  const message = (error?.message ?? '').toLowerCase();
  return message.includes('not found') || error?.status === 404 || error?.statusCode === '404';
}

export async function provisionAttachmentsBucket({ supabase, dryRun = false, log = console.log }) {
  const { data: existing, error: getError } = await supabase.storage.getBucket(BUCKET_ID);

  if (getError && !looksLikeNotFound(getError)) {
    throw new Error(`Oväntat fel vid getBucket("${BUCKET_ID}"): ${getError.message}`, {
      cause: getError,
    });
  }

  if (!existing) {
    log(`Bucket "${BUCKET_ID}" saknas.`);
    if (dryRun) {
      log('[dry-run] skulle skapa bucket med:', BUCKET_DESIRED_CONFIG);
      return { action: 'would-create', config: BUCKET_DESIRED_CONFIG };
    }
    const { error: createError } = await supabase.storage.createBucket(
      BUCKET_ID,
      BUCKET_DESIRED_CONFIG,
    );
    if (createError) {
      throw new Error(`createBucket("${BUCKET_ID}") misslyckades: ${createError.message}`, {
        cause: createError,
      });
    }
    log(
      `Bucket "${BUCKET_ID}" skapad: privat=${!BUCKET_DESIRED_CONFIG.public}, ` +
        `fileSizeLimit=${BUCKET_DESIRED_CONFIG.fileSizeLimit} bytes, ` +
        `allowedMimeTypes=${BUCKET_DESIRED_CONFIG.allowedMimeTypes.join(',')}.`,
    );
    return { action: 'created', config: BUCKET_DESIRED_CONFIG };
  }

  if (bucketConfigMatches(existing, BUCKET_DESIRED_CONFIG)) {
    log(
      `Bucket "${BUCKET_ID}" redan konvergerad ` +
        `(public=${existing.public}, fileSizeLimit=${existing.file_size_limit}, ` +
        `allowedMimeTypes=${(existing.allowed_mime_types ?? []).join(',')}). Ingen ändring.`,
    );
    return { action: 'noop', config: existing };
  }

  log(`Bucket "${BUCKET_ID}" finns men avviker från önskat tillstånd.`);
  log('  Nuvarande:', {
    public: existing.public,
    fileSizeLimit: existing.file_size_limit,
    allowedMimeTypes: existing.allowed_mime_types,
  });
  log('  Önskat:   ', BUCKET_DESIRED_CONFIG);

  if (dryRun) {
    log('[dry-run] skulle uppdatera bucket till önskat tillstånd.');
    return { action: 'would-update', config: BUCKET_DESIRED_CONFIG };
  }

  const { error: updateError } = await supabase.storage.updateBucket(
    BUCKET_ID,
    BUCKET_DESIRED_CONFIG,
  );
  if (updateError) {
    throw new Error(`updateBucket("${BUCKET_ID}") misslyckades: ${updateError.message}`, {
      cause: updateError,
    });
  }
  log(`Bucket "${BUCKET_ID}" konvergerad till önskat tillstånd.`);
  return { action: 'updated', config: BUCKET_DESIRED_CONFIG };
}

/**
 * Läser --kontrollera <ref> ur argv. Returnerar `undefined` om flaggan inte
 * finns, annars refen som stod direkt efter (kan vara en tom sträng om
 * flaggan angavs sist utan värde — main() behandlar det som "saknas").
 */
export function parseKontrolleraRef(argv) {
  const index = argv.indexOf('--kontrollera');
  if (index === -1) {
    return undefined;
  }
  return argv[index + 1] ?? '';
}

async function main() {
  const argv = process.argv.slice(2);
  const angivenRef = parseKontrolleraRef(argv);
  const kontrollera = angivenRef !== undefined;
  const dryRun = argv.includes('--dry-run') || kontrollera;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error('❌ SUPABASE_URL saknas i miljön.');
    process.exit(1);
  }
  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY saknas i miljön.');
    process.exit(1);
  }

  if (kontrollera) {
    // § KONTROLLERA-LÄGET — hoppar MEDVETET över assertStagingOnly. Detta är
    // den enda avsiktliga läsvägen mot prod (Marcus-moment, se fil-header).
    if (!angivenRef) {
      console.error(
        '❌ --kontrollera kräver en ref som argument (anges explicit, aldrig ur config).',
      );
      process.exit(1);
    }
    let faktiskRef;
    try {
      faktiskRef = extractProjectRef(url);
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
    if (faktiskRef !== angivenRef) {
      console.error(
        `❌ VÄGRAR: angiven ref "${angivenRef}" matchar inte SUPABASE_URL:s ref ` +
          `"${faktiskRef}". Refen anges explicit för att aldrig råka kontrollera fel miljö.`,
      );
      process.exit(1);
    }
  } else {
    try {
      assertStagingOnly(url);
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  }

  const supabase = createClient(url, serviceRoleKey);

  try {
    const result = await provisionAttachmentsBucket({ supabase, dryRun });
    if (kontrollera) {
      if (result.action === 'noop') {
        console.log(`✅ Bucket "${BUCKET_ID}" konvergerad mot BUCKET_DESIRED_CONFIG.`);
        process.exit(0);
      }
      console.error(
        `❌ Bucket "${BUCKET_ID}" INTE konvergerad (utfall: ${result.action}). ` +
          'Provisionera via dashboarden (prod) eller detta skript utan --kontrollera (staging).',
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

// Körs bara som CLI-entrypoint — inte när modulen importeras (t.ex. av ett
// framtida test av `provisionAttachmentsBucket`/`assertStagingOnly` direkt).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
