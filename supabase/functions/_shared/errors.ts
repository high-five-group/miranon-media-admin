// Generisk felmodell för Edge Functions (M7).
//
// Designprincip:
//   - Operationella fel (4xx, kända, klient-orsakade) loggas på info-
//     nivå med specifik error-message i klient-respons. Brännner inte
//     Sentry-quota.
//   - Oväntade fel (5xx, server-bugg eller infrastruktur-fel) loggas
//     på error-nivå med full stack-trace server-side. Klienten ser
//     bara generic { error: 'Internal error', requestId } — inga
//     stack-detaljer eller intern info läcker.
//   - Alla loggar är structured JSON så Supabase Logs-sökning kan
//     filtrera på requestId, level, function, etc.
//
// K7-respekt: requestId kan kopplas till audit_log (06b §C1) post-
// S-track utan API-ändring av denna helper. Strukturerad logg-format
// matchar redan target-tabellens kolumner (level, request_id,
// actor_type, target_table, metadata).

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends HttpError {
  // `status` är VALFRI (default 400, ADR-066/klient-input-varianten, oförändrat
  // för alla befintliga anrop). TASK-190: en uppströms-klassad Airtable-
  // valideringsavvisning (typiskt 422, se airtable-client.ts §
  // classifyAirtableWriteError) behöver kunna BÄRA Airtables egen status i
  // stället för att hårdkodas till 400 — samma felklass (klient-orsakat,
  // 4xx), men rätt kod för den som faktiskt orsakade avvisningen (Airtable).
  constructor(message = 'Validation failed', status = 400) {
    super(status, message);
    this.name = 'ValidationError';
  }
}

// Klassar fel som "operationellt" (förväntat, klient-orsakat). Sentry
// och felgrafsverktyg kan filtrera bort dessa för att inte trigga
// false-positive larm.
export function isOperationalError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status >= 400 && error.status < 500;
  }
  return false;
}

// Generera ny requestId per request. Används i wrapper i varje Edge
// Function för att binda klient-respons + server-logg + framtida
// audit_log-rad till samma identifier.
export function generateRequestId(): string {
  return crypto.randomUUID();
}

interface LogContext {
  function?: string;
  method?: string;
  url?: string;
  callerUserId?: string;
  [key: string]: unknown;
}

// Mappa godtyckligt fel till HTTP-respons + logga structured JSON.
//
// Klient-respons:
//   - HttpError → { error: <message>, requestId } med error.status
//   - Annan throw → { error: 'Internal error', requestId } med 500
//
// Server-logg (Supabase Logs via console.info/error):
//   - HttpError 4xx → console.info med JSON, ingen stack
//   - Annan throw → console.error med JSON + full stack-trace
export function mapErrorToResponse(
  error: unknown,
  requestId: string,
  corsHeaders: Record<string, string>,
  context: LogContext = {},
): Response {
  const isOp = isOperationalError(error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : 'unknown';
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logRecord = {
    level: isOp ? 'info' : 'error',
    requestId,
    errorName,
    errorMessage,
    stack: isOp ? undefined : errorStack,
    ...context,
  };

  if (isOp) {
    console.info(JSON.stringify(logRecord));
  } else {
    console.error(JSON.stringify(logRecord));
  }

  if (error instanceof HttpError) {
    return new Response(JSON.stringify({ error: error.message, requestId }), {
      status: error.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Oväntat fel — generic body, ingen detail-läckage.
  return new Response(JSON.stringify({ error: 'Internal error', requestId }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
