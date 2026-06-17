/**
 * Thrown by `callEdgeFunction`/`postEdgeFunction` (supabase-client.ts) vid
 * non-2xx-svar från en Edge Function.
 *
 * Bär `status` + en **strukturerad** `requestId`, extraherad ur EF:ns fel-kropp
 * `{ error, requestId }` (supabase/functions/_shared/errors.ts). Tidigare låg
 * requestId bara begravd i ett rått message-string; nu kan UI surfa den (Fas 5.5
 * K2 MessageBox) och binda frontend-felet mot backend-loggen via
 * `reportEdgeFunctionError` (src/observability/sentry.ts).
 *
 * **Bakåtkompatibel:** `extends Error`, så `instanceof Error` och `.message`
 * håller för alla befintliga callers — tillägget är additivt (status + requestId).
 */
export class EdgeFunctionError extends Error {
  readonly status: number;
  readonly requestId: string | undefined;
  readonly endpoint: string;

  constructor(params: {
    endpoint: string;
    status: number;
    message: string;
    requestId: string | undefined;
  }) {
    super(params.message);
    this.name = 'EdgeFunctionError';
    this.status = params.status;
    this.requestId = params.requestId;
    this.endpoint = params.endpoint;
    // Krävs för att `instanceof EdgeFunctionError` ska hålla över alla TS
    // transpilation targets (speglar AuthError; ES5-output tappar annars
    // prototyp-kedjan).
    Object.setPrototypeOf(this, EdgeFunctionError.prototype);
  }
}
