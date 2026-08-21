/**
 * Appfel-fallbacken — promoverad ur facit (TASK-285.3, ADR-103 B2/B4).
 *
 * FACIT: `tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json`
 * ytan `appfel-sidan`, formen låst i `AppErrorPrototyp.tsx` (varv 4, samma
 * fil, INTE riven här — ADR-102 B3: rivning väntar Marcus godkännande,
 * TASK-285.11). Denna fil är en byte-för-byte-kopia av den formen, bruten ut
 * ur `AppErrorBoundary`s klasskomponent (`AppError.tsx`) till en egen
 * exporterad komponent så att `/dev/primitives` kan visa den och axe-sviten
 * nå den — utan att krascha appen.
 *
 * DESIGNVILLKORET (oförändrat sedan ursprunget): appfel-sidan är sista
 * skyddslagret och nås när resten av appen — inklusive stylesheetet — kan
 * vara dött. Därför ENDAST inline-stilar med primitivernas FAKTISKA värden
 * (verifierat mot `src/styles/tokens/primitives.css` vid byggtillfället:
 * `--p-neutral-0: #ffffff`, `--p-neutral-900: #242424`,
 * `--p-red-500: #a90000`) — ALDRIG en CSS-variabel, ALDRIG en
 * primitiv-import. Ett test som tar bort alla stylesheets före rendering
 * bevisar detta (`tests/webblasarbeteende/app-error-fallback.test.ts`).
 *
 * `inbaddad` styr ENDAST `role` (och yttre marginal) — samma kontrakt som
 * `AppErrorPrototyp`: `false` (default, vad `AppErrorBoundary` faktiskt
 * använder) behåller `role="alert"`; `true` (demo-bruk på /dev/primitives,
 * jämförelseformen mot prototypen) utelämnar den så en statisk demo-sida
 * inte permanent annonserar en assertiv region utan orsak.
 *
 * COPYN (TASK-285.8, copy-domarna § 5/§ 7.3): brödtexten var tidigare TRE
 * meningar ("Något gick sönder ... Det du redan har sparat finns kvar.
 * Ladda om för att fortsätta."), över AC #3:s tak på två. Kortad till två
 * utan att tappa någon av de tre delarna (problem/vad-hände-med-datan/
 * lösning) genom att slå ihop de två första med "men". Samma sträng är
 * SPEGLAD i `AppErrorPrototyp.tsx` (byte-för-byte, se den filens eget
 * doc-block) för att `ariaSnapshot`-paret (`tests/visual/
 * appfel-promoverings-grind.spec.ts`) ska förbli grönt — de inspelade
 * referenserna (`__aria__/appfel-fallback-visual-{mobile,desktop}.aria.yml`)
 * uppdaterades i SAMMA commit.
 */
export function AppErrorFallback({ inbaddad = false }: { inbaddad?: boolean }) {
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
        /* Ingen kontur — skuggan bär kanten (familjeregeln, s109 varv 4). */
        borderLeft: '4px solid #a90000',
        borderRadius: '4px',
        boxShadow: '0 8px 24px rgba(36, 36, 36, 0.08)',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#a90000' }}>
        Appen kunde inte visas
      </h1>
      <p style={{ margin: '0.5rem 0 0' }}>
        Sidan kunde inte ritas upp, men det du redan har sparat finns kvar. Ladda om för att
        fortsätta.
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
