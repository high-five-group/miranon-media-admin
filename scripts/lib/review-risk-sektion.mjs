// scripts/lib/review-risk-sektion.mjs — risk-rendreraren: review-agentens
// JSON-utlåtande → den fasta Riskbedömnings-sektionen i PR-kroppen
// (TASK-173.3, ADR-105 beslut 5/6/7).
//
// ═══ VAD DETTA ÄR ═══
// Den deterministiska halvan av 173.3: ett giltigt, redan VALIDERAT
// utlåtande (scripts/lib/review-utlatande.mjs:s `valideraUtlatande(...).data`
// — alltså EFTER zods `.default()`-normalisering, aldrig rå JSON) renderas
// till exakt samma markdown för exakt samma indata (AC #2). Ren funktion:
// ingen I/O, inget klockberoende, ingen slumpkälla. I/O (hämta/skriva
// PR-kroppen via `gh`) ligger i scripts/uppdatera-review-sektion.mjs — samma
// lager-snitt som 173.2:s scripts/lib/review-policy.mjs (matchning/
// rendering, ren) mot scripts/hamta-review-policy.mjs (I/O).
//
// ═══ MARKÖR-DESIGNEN (idempotent uppdatering) ═══
// Danger.js identifierar och uppdaterar sin egen tidigare PR-kommentar genom
// att bädda in en dold identifierare och sedan filtrera kommentarer på om de
// INNEHÅLLER den: "Looking at N comments for ${dangerIDMessage}" /
// `.filter((comment) => comment.body.includes(dangerIDMessage))`
// (danger/danger-js, source/platforms/github/GitHubAPI.ts, verifierat
// 2026-08-26). Markören själv är `DangerID: danger-id-${id};`, inbäddad i en
// `<!-- ... -->`-HTML-kommentar runt det genererade innehållet
// (source/runner/templates/githubIssueTemplate.ts, samma repo).
//
// Vår situation skiljer sig på en punkt som ändrar mekaniken: Danger
// uppdaterar en KOMMENTAR (ett eget API-objekt som kan sökas upp och PATCHas
// för sig) medan vi skriver in i PR-KROPPEN — ett enda textfält som alltid
// skrivs över i sin HELHET. GitHubs REST-referens är entydig om `body`-
// fältet i `PATCH /repos/{owner}/{repo}/pulls/{pull_number}`: "The contents
// of the pull request" (docs.github.com, REST API — Pulls, verifierat
// 2026-08-26) — ingen delvis-patch-semantik finns för det fältet. `gh pr
// edit` bekräftar samma sak i sin egen hjälptext: "-b, --body string  Set
// the new body." (gh CLI, verifierat 2026-08-26 via `gh pr edit --help`).
// Idempotent uppdatering är därför ALLTID läs-ändra-skriv: hämta hela
// kroppen, hitta (eller inte hitta) våra markörer, ersätt/lägg till
// sektionen, skriv tillbaka HELA kroppen — se `uppdateraPrKropp` nedan.
//
// Markören är medvetet VERSIONS-OBEROENDE (`review-grinden:riskbedomning:
// start/end` — ingen schemaVersion i själva markören): en framtida BRYTANDE
// schemaändring (SCHEMA_VERSION-bump i review-utlatande.mjs) ska fortfarande
// HITTA och ERSÄTTA föregående sektion, aldrig lämna en föräldralös gammal
// sektion kvar medan en ny läggs till bredvid. `schemaVersion` syns i
// stället som synlig TEXT i sektionens fotnot.
//
// ═══ FAIL-CLOSED PÅ MARKÖR-KORRUPTION (AC #3-disciplinen utsträckt till
// PR-kroppen) ═══
// Hittar `uppdateraPrKropp` EN start- och EN slut-markör i rätt ordning:
// ersätt mellan dem. Hittar den NOLL av båda: lägg till sektionen sist.
// Hittar den NÅGOT ANNAT — bara en av de två, flera av samma, eller slut
// FÖRE start (en människa som redigerat kroppen för hand, eller två
// körningar som kapplöper) — vägrar funktionen att gissa. Den returnerar
// `ok: false` med ett tydligt skäl i stället för att antingen duplicera
// sektionen eller skriva över för mycket/för lite av kroppen. Samma
// "hellre stanna än gissa"-linje som review-policy.mjs:s fail-closed.

/** De två markörerna som ramar in sektionen. Version-oberoende — se filhuvudet. */
export const MARKER_START = '<!-- review-grinden:riskbedomning:start -->';
export const MARKER_END = '<!-- review-grinden:riskbedomning:end -->';

/** Övre gräns för fri text-innehåll i en tabellcell/bullet innan den
 * trunkeras (med synlig "…"). Satt ÖVER schemats `risk.motivering`-tak (400
 * tecken, scripts/lib/review-utlatande.mjs) så ett giltigt utlåtande ALDRIG
 * trunkeras där — bara genuint obegränsade fält (fynd.beskrivning,
 * acProvning[].text/motivering) kan träffa taket. */
const CELL_MAX = 500;

const RISK_LABEL = {
  hog: '🔴 HÖG',
  medel: '🟡 MEDEL',
  lag: '🟢 LÅG',
};

const SEVERITY_LABEL = {
  error: '🔴 error',
  warning: '🟡 warning',
  info: 'ℹ️ info',
};

/** Escapar en fri textsträng för säker plats i en GFM-tabellcell/bullet:
 * radbrytningar → `<br>`, pipe-tecken escapas, och innehåll över CELL_MAX
 * trunkeras SYNLIGT (aldrig tyst — samma "aldrig tyst partiell" disciplin
 * som AC #3 kräver av hela sektionen, utsträckt till enskilda fält). */
function cell(varde) {
  if (varde === null || varde === undefined || varde === '') return '—';
  const text = String(varde).replace(/\r?\n/g, '<br>').replace(/\|/g, '\\|');
  return text.length > CELL_MAX ? `${text.slice(0, CELL_MAX)}…` : text;
}

/** Som `cell`, men för värden som ska visas som inline-kod (kommando, SHA,
 * fil:rad). Backticks byts mot raka citattecken — kommandon/SHA:n i denna
 * kodbas innehåller aldrig backtick i praktiken, och en fullständig
 * nästlad-kodspann-eskapering vore spekulativ komplexitet utan nuvarande
 * användare (dubbelriktad över-engineering-vakt). */
function kodcell(varde) {
  if (varde === null || varde === undefined || varde === '') return '—';
  const text = String(varde).replace(/\r?\n/g, ' ').replace(/`/g, "'");
  const trunkerad = text.length > CELL_MAX ? `${text.slice(0, CELL_MAX)}…` : text;
  return `\`${trunkerad}\``;
}

function renderaPlats(plats) {
  if (!plats) return '—';
  return plats.rad !== null ? kodcell(`${plats.fil}:${plats.rad}`) : kodcell(plats.fil);
}

function renderaBevis(bevisLista) {
  if (bevisLista.length === 0) return '—';
  return bevisLista
    .map((b) => {
      const exitDel = b.exitkod === null ? 'exit —' : `exit ${b.exitkod}`;
      return `${kodcell(b.kommando)} (${exitDel}, ${kodcell(b.runIdEllerSha)})`;
    })
    .join('<br>');
}

function renderaFyndTabell(fynd) {
  if (fynd.length === 0) {
    return 'Inga fynd.';
  }
  const rader = [
    '| # | Severity | Action | Beskrivning | Plats | Bevis |',
    '|---|---|---|---|---|---|',
  ];
  fynd.forEach((f, i) => {
    rader.push(
      `| ${i + 1} | ${SEVERITY_LABEL[f.severity] ?? f.severity} | ${f.action} | ${cell(f.beskrivning)} | ${renderaPlats(f.plats)} | ${renderaBevis(f.bevis)} |`,
    );
  });
  return rader.join('\n');
}

function renderaAcProvning(acProvning) {
  if (acProvning.length === 0) return null;
  const rader = ['### AC-prövning', ''];
  for (const ac of acProvning) {
    const status = ac.bedomning === 'haller' ? '✅ håller' : '⚠️ felställd';
    rader.push(`- **AC #${ac.nummer}** — ${status}: ${cell(ac.text)} — ${cell(ac.motivering)}`);
  }
  return rader.join('\n');
}

function renderaPolicyFotnot(policyRegler, policySha) {
  if (policyRegler.length === 0) return null;
  const ider = policyRegler.map((r) => r.id).join(', ');
  return `_${policyRegler.length} path-scopad(e) granskningsregel(er) injicerad(e) (${ider}) — policy läst ur ${kodcell(policySha)}._`;
}

/**
 * Renderar ETT giltigt, redan validerat utlåtande (dvs
 * `valideraUtlatande(raw).data` — EFTER zods `.default()`-normalisering) till
 * markdown-INNEHÅLLET för Riskbedömnings-sektionen, UTAN de omgivande
 * markörerna (se `byggSektion` för den fulla, injicerbara sektionen).
 *
 * Ren funktion: identisk indata ⇒ identisk utdata, alltid (AC #2). Inget
 * `Date.now()`, ingen slumpkälla, inget miljöberoende — varje bevis-
 * påstående kommer redan från utlåtandets egna `bevis[].runIdEllerSha`.
 *
 * Bakåtkompatibilitet med 173.1-formade utlåtanden (finding (a) ur
 * 173.2-granskningen): `policySha`/`policyRegler` bär zod `.default(null)`/
 * `.default([])` i scripts/lib/review-utlatande.mjs, så ett utlåtande UTAN
 * dessa fält validerar ändå och når hit som `policySha: null`,
 * `policyRegler: []` — `renderaPolicyFotnot` returnerar då `null` och ingen
 * fotnot skrivs. Denna funktion konsumerar ALDRIG rå, ovaliderad JSON direkt
 * (den docs/reference/review-utlatande.schema.json-genererade filen listar
 * felaktigt `policySha`/`policyRegler` som `required` trots defaults — se
 * filhuvudets kommentar i review-utlatande.mjs — men den divergensen berör
 * en STRIKT JSON-Schema-konsument utan defaults, inte denna väg).
 *
 * @param {import('./review-utlatande.mjs').UtlatandeSchema['_output']} u
 * @returns {string}
 */
export function renderaRiskbedomning(u) {
  const rader = [];
  rader.push('## Riskbedömning');
  rader.push('');
  const metaDelar = [
    `**Nivå:** ${RISK_LABEL[u.risk.niva] ?? u.risk.niva}`,
    `**Runda:** ${u.runda}`,
    `**Granskad SHA:** ${kodcell(u.granskadSha)}`,
  ];
  rader.push(metaDelar.join(' · '));
  const intentDel =
    u.intentKalla === 'kort'
      ? `**Intent:** kort ${kodcell(u.kortId)} (${u.intentKonfidens === 'hog' ? 'hög konfidens' : 'LÅG konfidens'})`
      : '**Intent:** PR-text (inget kort länkat) — **LÅG konfidens**';
  rader.push(intentDel);
  rader.push('');
  rader.push(`> ${cell(u.risk.motivering)}`);
  if (u.risk.niva === 'hog') {
    rader.push('');
    rader.push(
      '⚠️ **HÖG risk — armering väntar på Marcus explicita granskning** (ADR-105 beslut 5).',
    );
  }
  rader.push('');
  rader.push(`### Fynd (${u.fynd.length})`);
  rader.push('');
  rader.push(renderaFyndTabell(u.fynd));

  const acBlock = renderaAcProvning(u.acProvning);
  if (acBlock) {
    rader.push('');
    rader.push(acBlock);
  }

  const policyFotnot = renderaPolicyFotnot(u.policyRegler, u.policySha);
  if (policyFotnot) {
    rader.push('');
    rader.push(policyFotnot);
  }

  rader.push('');
  rader.push(
    `<sub>Genererat av review-agent · schemaVersion ${u.schemaVersion} · PR #${u.prNummer}${u.kortId ? ` · ${u.kortId}` : ''}</sub>`,
  );

  return rader.join('\n').trimEnd();
}

/**
 * Slår in `renderaRiskbedomning(u)` mellan MARKER_START/MARKER_END — den
 * fulla, injicerbara sektionen som `uppdateraPrKropp` skriver in i kroppen.
 *
 * @param {import('./review-utlatande.mjs').UtlatandeSchema['_output']} u
 * @returns {string}
 */
export function byggSektion(u) {
  return `${MARKER_START}\n${renderaRiskbedomning(u)}\n${MARKER_END}`;
}

/** Räknar förekomster och positioner av start-/slut-markörer — hjälpfunktion
 * för `uppdateraPrKropp`s fail-closed-logik. */
function analyseraMarkorer(kropp) {
  const startPos = [];
  const endPos = [];
  let i = kropp.indexOf(MARKER_START);
  while (i !== -1) {
    startPos.push(i);
    i = kropp.indexOf(MARKER_START, i + 1);
  }
  i = kropp.indexOf(MARKER_END);
  while (i !== -1) {
    endPos.push(i);
    i = kropp.indexOf(MARKER_END, i + 1);
  }
  return { startPos, endPos };
}

/**
 * Beräknar den NYA PR-kroppen: ersätter en befintlig markörsektion in-place,
 * eller lägger till en ny sist i kroppen om ingen finns. Fail-closed vid en
 * KORRUPT markörsituation — se filhuvudet § Fail-closed.
 *
 * Ren funktion (ingen I/O): anroparen (scripts/uppdatera-review-sektion.mjs)
 * äger hämtningen/skrivningen av den faktiska PR-kroppen via `gh`.
 *
 * @param {string} nuvarandeKropp  Kan vara tom sträng eller `null`/`undefined`
 *   (en PR utan kropp).
 * @param {import('./review-utlatande.mjs').UtlatandeSchema['_output']} u
 * @returns {{ok: true, kropp: string, agerande: 'ersatte'|'lade-till'}
 *         | {ok: false, kropp: null, agerande: null, fel: string}}
 */
export function uppdateraPrKropp(nuvarandeKropp, u) {
  const kropp = nuvarandeKropp ?? '';
  const { startPos, endPos } = analyseraMarkorer(kropp);
  const nySektion = byggSektion(u);

  if (startPos.length === 0 && endPos.length === 0) {
    const separator = kropp.trim().length === 0 ? '' : '\n\n';
    return { ok: true, kropp: `${kropp}${separator}${nySektion}\n`, agerande: 'lade-till' };
  }

  if (startPos.length === 1 && endPos.length === 1 && startPos[0] < endPos[0]) {
    const slutIndex = endPos[0] + MARKER_END.length;
    const fore = kropp.slice(0, startPos[0]);
    const efter = kropp.slice(slutIndex);
    return { ok: true, kropp: `${fore}${nySektion}${efter}`, agerande: 'ersatte' };
  }

  return {
    ok: false,
    kropp: null,
    agerande: null,
    fel:
      `PR-kroppen bär en KORRUPT markörsituation för Riskbedömnings-sektionen ` +
      `(${startPos.length} startmarkör(er), ${endPos.length} slutmarkör(er)) — vägrar gissa. ` +
      `Städa kroppen manuellt (ta bort alla ${MARKER_START} / ${MARKER_END}-par) och kör om.`,
  };
}
