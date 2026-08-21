/**
 * [PROTOTYPE — KONVERGENS, S109] Appfel-sidan, startad som EXAKT kopia av
 * `ErrorBoundary/AppError.tsx`:s fallback och itererad mot notis-facit.
 *
 * FRÅGAN: hur ska den sista skyddslagrets sida se ut så att den ser ut som
 * Miranon Media Admin — med bibehållet VILLKOR att den renderar utan
 * stylesheet och utan primitiv-import (inline-stilar, inga tokens)?
 *
 * Varv 1: samma kortform som notis-facit, uttryckt i inline-stilar med
 * primitivernas faktiska värden (p-neutral-200 #e1e3e1 · p-red-500 #a90000 ·
 * p-neutral-900 #242424 · p-neutral-0 #ffffff). Hårdkodning är här
 * DESIGNVILLKORET, inte ett undantag från regeln — se AppError.tsx:s
 * doc-block. Copy per GOV.UK:s systemfels-mönster: vad hände · vad hände med
 * det du skrev · vad du gör nu.
 */
export function AppErrorPrototyp({ inbaddad = false }: { inbaddad?: boolean }) {
  return (
    <div
      role={inbaddad ? undefined : 'alert'}
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: 1.6,
        color: '#242424',
        background: '#ffffff',
        margin: inbaddad ? 0 : '12vh auto 0',
        maxWidth: '28rem',
        padding: '1.25rem 1.5rem',
        border: '1px solid #e1e3e1',
        borderLeft: '4px solid #a90000',
        borderRadius: '4px',
        boxShadow: '0 8px 24px rgba(36, 36, 36, 0.08)',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#a90000' }}>
        Appen kunde inte visas
      </h1>
      <p style={{ margin: '0.5rem 0 0' }}>
        Något gick sönder så att sidan inte kan ritas upp. Det du redan har sparat finns kvar. Ladda
        om för att fortsätta.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            minHeight: '44px',
            padding: '0.5rem 1.25rem',
            border: 0,
            borderRadius: '4px',
            background: '#242424',
            color: '#ffffff',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Ladda om
        </button>
      </div>
    </div>
  );
}
