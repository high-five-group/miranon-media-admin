// scripts/lib/synka-labels.mjs — RENA funktioner för label-synken: validera
// policyn, beräkna vilka GitHub-labels som ska skapas/uppdateras/lämnas
// orörda, och formatera resultatet läsbart. (GitHub-issue #2298, ADR-131 § 5.)
//
// ═══ VAD DETTA ÄR ═══
// Ingen I/O här — samma lager-snitt som scripts/lib/review-policy.mjs och
// scripts/lib/review-backstopp.mjs. `gh`-anropen bor i scripts/synka-labels.mjs
// (CLI-lagret), som injicerar en `ghKlient` hit. Testerna injicerar en FEJKAD
// klient (funktion) och anropar aldrig riktiga `gh` (scripts/test-synka-labels.mjs).
//
// ═══ ALDRIG RADERA ═══
// `berakDiff` producerar ENDAST skapa/uppdatera/oförändrat — det finns inget
// "radera"-läge. En label som finns i GitHub men inte i policyn (t.ex. en
// skyddad label, eller GitHubs egna defaults) lämnas helt utanför diffen: den
// FINNS INTE i `labelSpecs`, och kan därför per konstruktion aldrig hamna i
// `uppdatera` eller ett tänkt "radera". Samma "aldrig radera"-disciplin som
// scripts/purge-staging-sentinels.mjs (fast där handlar det om Airtable-rader).
//
// ═══ ALIAS SKAPAR ALDRIG EN EGEN LABEL ═══
// `berakLabelSpec` itererar ENDAST `policy.labels` — alias-nycklar (t.ex.
// qa-utredning → utredning) producerar ingen egen spec och syns därför
// aldrig i `skapa`/`uppdatera`. Aliaskartan returneras separat av `synka()`
// för att kunna redovisas i dry-run-utskriften.

/** @typedef {{name: string, color: string, description: string}} GhLabel */
/** @typedef {{name: string, color: string, beskrivning: string}} LabelSpec */

const HEX6 = /^[0-9A-Fa-f]{6}$/;

/**
 * Validerar policyns struktur. Fail-closed: varje avvikelse ger `ok: false`
 * med ett skäl på svenska — aldrig en tyst halverad regelmängd.
 *
 * @param {unknown} policy
 * @returns {{ok: true, data: {version: number, familjer: Record<string,{farg:string,beskrivning:string}>, labels: Record<string,{familj:string,beskrivning:string}>, alias: Record<string,string>, skyddade: string[]}} | {ok: false, fel: string}}
 */
export function valideraPolicy(policy) {
  if (policy === null || typeof policy !== 'object' || Array.isArray(policy)) {
    return { ok: false, fel: 'Policyn är inte ett JSON-objekt.' };
  }
  if (typeof policy.version !== 'number' || !Number.isInteger(policy.version)) {
    return { ok: false, fel: '`version` saknas eller är inte ett heltal.' };
  }

  const familjer = policy.familjer;
  if (familjer === null || typeof familjer !== 'object' || Array.isArray(familjer)) {
    return { ok: false, fel: '`familjer` saknas eller är inte ett objekt.' };
  }
  const familjeNamn = Object.keys(familjer);
  if (familjeNamn.length === 0) {
    return { ok: false, fel: '`familjer` är tomt — minst en familj krävs.' };
  }
  for (const namn of familjeNamn) {
    const f = familjer[namn];
    if (f === null || typeof f !== 'object') {
      return { ok: false, fel: `Familjen "${namn}" är inte ett objekt.` };
    }
    if (typeof f.farg !== 'string' || !HEX6.test(f.farg)) {
      return {
        ok: false,
        fel: `Familjen "${namn}" har ogiltig \`farg\` (kräver 6 hex-tecken utan '#'): ${JSON.stringify(f.farg)}.`,
      };
    }
    if (typeof f.beskrivning !== 'string' || f.beskrivning.trim() === '') {
      return { ok: false, fel: `Familjen "${namn}" saknar en icke-tom \`beskrivning\`.` };
    }
  }

  const labels = policy.labels;
  if (labels === null || typeof labels !== 'object' || Array.isArray(labels)) {
    return { ok: false, fel: '`labels` saknas eller är inte ett objekt.' };
  }
  const labelNamn = Object.keys(labels);
  if (labelNamn.length === 0) {
    return { ok: false, fel: '`labels` är tomt — minst en label krävs.' };
  }
  for (const namn of labelNamn) {
    if (namn.trim() === '') {
      return { ok: false, fel: 'En label-nyckel är tom eller enbart whitespace.' };
    }
    const l = labels[namn];
    if (l === null || typeof l !== 'object') {
      return { ok: false, fel: `Labeln "${namn}" är inte ett objekt.` };
    }
    if (typeof l.familj !== 'string' || !Object.hasOwn(familjer, l.familj)) {
      return {
        ok: false,
        fel: `Labeln "${namn}" pekar på okänd familj ${JSON.stringify(l.familj)}.`,
      };
    }
    if (typeof l.beskrivning !== 'string' || l.beskrivning.trim() === '') {
      return { ok: false, fel: `Labeln "${namn}" saknar en icke-tom \`beskrivning\`.` };
    }
  }

  const alias = policy.alias ?? {};
  if (alias === null || typeof alias !== 'object' || Array.isArray(alias)) {
    return { ok: false, fel: '`alias` finns men är inte ett objekt.' };
  }
  const skyddade = policy.skyddade ?? [];
  if (!Array.isArray(skyddade) || skyddade.some((s) => typeof s !== 'string' || s.trim() === '')) {
    return { ok: false, fel: '`skyddade` finns men är inte en array av icke-tomma strängar.' };
  }
  const skyddadeSet = new Set(skyddade);
  if (skyddadeSet.size !== skyddade.length) {
    return { ok: false, fel: '`skyddade` innehåller dubbletter.' };
  }

  for (const [aliasNamn, mal] of Object.entries(alias)) {
    if (aliasNamn.trim() === '') {
      return { ok: false, fel: 'En alias-nyckel är tom eller enbart whitespace.' };
    }
    if (typeof mal !== 'string' || mal.trim() === '') {
      return { ok: false, fel: `Aliaset "${aliasNamn}" har ett tomt mål.` };
    }
    if (!Object.hasOwn(labels, mal)) {
      return {
        ok: false,
        fel: `Aliaset "${aliasNamn}" pekar på "${mal}", som inte finns i \`labels\`.`,
      };
    }
    if (Object.hasOwn(labels, aliasNamn)) {
      return {
        ok: false,
        fel: `Aliaset "${aliasNamn}" är även en nyckel i \`labels\` — en label kan inte vara sitt eget alias.`,
      };
    }
    if (skyddadeSet.has(aliasNamn)) {
      return {
        ok: false,
        fel: `Aliaset "${aliasNamn}" står även i \`skyddade\` — motsägelsefull deklaration.`,
      };
    }
  }

  for (const namn of labelNamn) {
    if (skyddadeSet.has(namn)) {
      return {
        ok: false,
        fel: `Labeln "${namn}" står i BÅDE \`labels\` och \`skyddade\` — motsägelsefull deklaration.`,
      };
    }
  }

  return {
    ok: true,
    data: {
      version: policy.version,
      familjer,
      labels,
      alias,
      skyddade,
    },
  };
}

/**
 * Bygger den kanoniska label-specen ur en REDAN validerad policy. Alias
 * itereras inte — de får ingen egen GitHub-label (se filhuvudet).
 *
 * @param {ReturnType<typeof valideraPolicy> extends {ok: true, data: infer D} ? D : never} data
 * @returns {LabelSpec[]} sorterad på namn för deterministisk utskrift
 */
export function berakLabelSpec(data) {
  return Object.entries(data.labels)
    .map(([name, l]) => ({
      name,
      color: data.familjer[l.familj].farg,
      beskrivning: l.beskrivning,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** @param {string} color */
function normColor(color) {
  return String(color ?? '')
    .trim()
    .toUpperCase();
}

/**
 * Diffar önskad label-spec mot GitHubs faktiska lista. ALDRIG ett
 * "radera"-fält — en label utanför `labelSpecs` (skyddad, GitHub-default,
 * eller okänd) syns inte alls här.
 *
 * @param {GhLabel[]} existerande
 * @param {LabelSpec[]} labelSpecs
 * @returns {{skapa: LabelSpec[], uppdatera: (LabelSpec & {tidigare: {color: string, description: string}})[], oforandrat: LabelSpec[]}}
 */
export function berakDiff(existerande, labelSpecs) {
  const byName = new Map(existerande.map((l) => [l.name, l]));
  const skapa = [];
  const uppdatera = [];
  const oforandrat = [];
  for (const spec of labelSpecs) {
    const nuvarande = byName.get(spec.name);
    if (!nuvarande) {
      skapa.push(spec);
      continue;
    }
    const fargLika = normColor(nuvarande.color) === normColor(spec.color);
    const beskrivningLika = (nuvarande.description ?? '') === spec.beskrivning;
    if (fargLika && beskrivningLika) {
      oforandrat.push(spec);
    } else {
      uppdatera.push({
        ...spec,
        tidigare: { color: nuvarande.color ?? '', description: nuvarande.description ?? '' },
      });
    }
  }
  return { skapa, uppdatera, oforandrat };
}

/**
 * Läsbar svensk dry-run-utskrift av diffen + aliaskartan.
 *
 * @param {ReturnType<typeof berakDiff>} diff
 * @param {Record<string,string>} aliasKarta
 * @returns {string}
 */
export function formateraTorrkorning(diff, aliasKarta) {
  const rader = [];
  rader.push(`SKAPA (${diff.skapa.length}):`);
  for (const s of diff.skapa) {
    rader.push(`  + ${s.name}  [#${s.color}]  ${s.beskrivning}`);
  }
  rader.push(`UPPDATERA (${diff.uppdatera.length}):`);
  for (const s of diff.uppdatera) {
    rader.push(`  ~ ${s.name}`);
    rader.push(`      färg:        #${s.tidigare.color}  →  #${s.color}`);
    rader.push(
      `      beskrivning: ${JSON.stringify(s.tidigare.description)}  →  ${JSON.stringify(s.beskrivning)}`,
    );
  }
  rader.push(`OFÖRÄNDRAT (${diff.oforandrat.length}):`);
  for (const s of diff.oforandrat) {
    rader.push(`  = ${s.name}`);
  }
  const aliasEntries = Object.entries(aliasKarta ?? {});
  rader.push(`ALIAS (${aliasEntries.length}, ingen egen label skapas):`);
  for (const [fran, till] of aliasEntries) {
    rader.push(`  ${fran} → ${till}`);
  }
  return `${rader.join('\n')}\n`;
}

/**
 * Orkestrerar en synk-körning: validerar policyn, hämtar nuvarande labels via
 * `ghKlient.listLabels()`, beräknar diffen, och — bara om `utfor` är sant —
 * skapar/uppdaterar via `ghKlient.createLabel`/`ghKlient.updateLabel` med en
 * paus (`sleepFn`, default `setTimeout`) mellan varje skrivning.
 *
 * @param {object} args
 * @param {unknown} args.policy
 * @param {{listLabels: () => Promise<GhLabel[]> | GhLabel[], createLabel: (spec: LabelSpec) => Promise<void> | void, updateLabel: (spec: LabelSpec) => Promise<void> | void}} args.ghKlient
 * @param {boolean} [args.utfor]
 * @param {number} [args.sleepMs]
 * @param {(ms: number) => Promise<void>} [args.sleepFn]
 * @returns {Promise<{ok: true, diff: ReturnType<typeof berakDiff>, aliasKarta: Record<string,string>} | {ok: false, fel: string}>}
 */
export async function synka({ policy, ghKlient, utfor = false, sleepMs = 1000, sleepFn }) {
  const valid = valideraPolicy(policy);
  if (!valid.ok) {
    return { ok: false, fel: valid.fel };
  }
  const specs = berakLabelSpec(valid.data);
  const existerande = await ghKlient.listLabels();
  const diff = berakDiff(existerande, specs);

  if (utfor) {
    const sleep = sleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    const skrivningar = [
      ...diff.skapa.map((s) => ({ akt: 'skapa', spec: s })),
      ...diff.uppdatera.map((s) => ({ akt: 'uppdatera', spec: s })),
    ];
    for (let i = 0; i < skrivningar.length; i += 1) {
      if (i > 0) await sleep(sleepMs);
      const { akt, spec } = skrivningar[i];
      if (akt === 'skapa') {
        await ghKlient.createLabel(spec);
      } else {
        await ghKlient.updateLabel(spec);
      }
    }
  }

  return { ok: true, diff, aliasKarta: valid.data.alias };
}
