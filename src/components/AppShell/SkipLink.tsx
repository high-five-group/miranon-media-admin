/**
 * Skip-länk (WCAG 2.4.1 Bypass Blocks) — första fokuserbara elementet i det
 * inloggade skalet. Visuellt dold tills den får tangentbordsfokus; hoppar
 * förbi tab bar-navigationen genom att flytta fokus programmatiskt till
 * `<main id="main" tabIndex={-1}>` (inte bara hash-navigation — Safari m.fl.
 * flyttar inte fokus på enbart fragment-hopp).
 *
 * Placeras i AppShell (inloggade skalet), inte __root: blocken den hoppar
 * förbi finns bara där (Session 16 K3 STOPPA-utfall A).
 */
export function SkipLink() {
  return (
    // biome-ignore lint/a11y/useValidAnchor: skip-länken SKA vara en länk (WCAG 2.4.1 — annonseras som länk, syns i skärmläsarens länklista); onClick adderar programmatisk fokus eftersom enbart hash-hopp inte flyttar fokus i alla browsers
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:px-4 focus:py-2 focus:font-medium focus:text-text"
      onClick={(event) => {
        event.preventDefault();
        document.getElementById('main')?.focus();
      }}
    >
      Hoppa till innehåll
    </a>
  );
}
