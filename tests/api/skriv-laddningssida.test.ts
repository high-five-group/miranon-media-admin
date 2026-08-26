// Enhetstest (api-pure, ingen staging-koppling) för `escapeHtml`
// (`src/lib/skriv-laddningssida.ts`, TASK-309.26 review-runda 3).
//
// GRANSKARENS FYND: `titel`/`text` interpolerades tidigare rakt in i
// `document.write`-markupen utan sanering — en anropare som (nu eller i
// framtiden) skickar in något HTML-liknande hade fått det tolkat som riktig
// markup i stället för text. Ingen av dagens två anropssajter
// (`GenereringsVy.tsx`, `DokumentYta.tsx`) skickar attacker-/användarstyrd
// text i dag, men `skrivLaddningssida` ska vara säker OAVSETT — anroparen
// ska ALDRIG behöva komma ihåg att sanera själv.
//
// Detta test bevisar STRÄNGTRANSFORMEN (den pure funktionen). Att en
// webbläsare sedan renderar HTML-entiteter (`&lt;`, `&gt;` osv.) som
// LITERAL TEXT i stället för markup är väletablerat, universellt
// webbläsarbeteende — inte något denna kodbas behöver bevisa på nytt — men
// den fulla kedjan (skriven sträng → riktig DOM, ingen `<b>`-nod skapas)
// verifieras ändå separat i en Playwright-acceptance-test, se
// `tests/acceptance/dokument-yta-fonster-direkt.acceptance.test.ts`.
import { expect, test } from '@playwright/test';
import { escapeHtml } from '../../src/lib/skriv-laddningssida';

test.describe('escapeHtml — skriv-laddningssida.ts (TASK-309.26 review-runda 3)', () => {
  test('escapar de fem HTML-särskiljande tecknen', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#39;');
  });

  test('granskarens exempel: <b>x</b> escapas helt, ingen del lämnas som markup', () => {
    expect(escapeHtml('<b>x</b>')).toBe('&lt;b&gt;x&lt;/b&gt;');
  });

  test('en sträng utan särtecken lämnas oförändrad', () => {
    expect(escapeHtml('Skapar bekräftelsebilagan.')).toBe('Skapar bekräftelsebilagan.');
  });

  test('& escapas FÖRST — en redan escapad sekvens dubbel-escapas inte till nonsens', () => {
    // Om "&" escapades EFTER "<"/">" skulle "&lt;" bli "&amp;lt;" — fel.
    // Ordningen i implementationen (& före <, >, ", ') förhindrar det.
    expect(escapeHtml('&lt;redan-escapad&gt;')).toBe('&amp;lt;redan-escapad&amp;gt;');
  });

  test('flera särtecken i samma sträng escapas alla, oberoende av varandra', () => {
    expect(escapeHtml(`<img src="x" onerror='alert(1)'> & mer`)).toBe(
      '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt; &amp; mer',
    );
  });

  test('tom sträng ger tom sträng', () => {
    expect(escapeHtml('')).toBe('');
  });
});
