import { updateAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';

// Allowlist — bara våra tabeller
const ALLOWED_TABLES = new Set([
  'tblVE3UKWl1CKrphV', // Eventplanering
  'tbloOcrppVoyrHbrq', // Anmälningar
  'tbl6ZyCm3V026iFTU', // Personer
  'tbldWHH6sSHWoQPHH', // Deltaganden
  'tblqFpgxEhJ95AEcM', // Hämtade erbjudanden
  'tbl9H2SoGFfysBj5y', // Engagemang
  'tbl22SCvlHrgcAiZi', // Touchpoints
  'tblcCFGCVrnl1JZfg', // Erbjudanden
  'tblzg4DsRzCCXH8Vy', // Kontaktlogg
  'tblWarzSse85NI1Zx', // Bulkutskick
  'tbl2VxMx7JMkIxD4Q', // Väntelista
  'tblXFJyGRahQDhhqc', // Email Opens
  'tblIesjbuSWNp6oxK', // Utskickslogg
  'tblnnmWswnRp9gFws', // Error-log
  'tbll2N6JKCj4u6y9o', // Segment
  'tbl8qhuJQ5ZWPMRk4', // Eventformat
  'tblor5TK8HeryGXIj', // Path to Conversion
  'tblMpQI1crF521Xsp', // Instagram Posts
]);

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const { tableId, recordId, fields } = await req.json();

    // Validera input
    if (!tableId || !recordId || !fields) {
      return new Response(JSON.stringify({ error: 'tableId, recordId, and fields are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_TABLES.has(tableId)) {
      return new Response(JSON.stringify({ error: `Table ${tableId} not in allowlist` }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!recordId.startsWith('rec')) {
      return new Response(JSON.stringify({ error: 'Invalid recordId format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `[update-record] ${new Date().toISOString()} | caller_user_id=${user.id} | table=${tableId} | record=${recordId} | fields=${JSON.stringify(fields)}`,
    );

    const updated = await updateAirtableRecord(tableId, recordId, fields);

    return new Response(JSON.stringify({ record: { id: updated.id, fields: updated.fields } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('update-record error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
