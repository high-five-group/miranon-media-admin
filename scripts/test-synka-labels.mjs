#!/usr/bin/env node
// scripts/test-synka-labels.mjs — tester för label-synken
// (GitHub-issue #2298: scripts/lib/synka-labels.mjs + scripts/synka-labels.mjs).
//
// Samma konvention som review-familjens sviter (scripts/test-review-policy.mjs
// m.fl.): de PURA funktionerna importeras direkt (sektion A–D), och
// CLI-lagrets `main()` importeras och anropas med en INJICERAD fejkad
// gh-klient (sektion E) — aldrig ett riktigt `gh`-anrop, aldrig en subprocess
// eller PATH-fejkad binär (uppdragets egen instruktion: "injicera en
// funktion, anropa aldrig riktiga gh i testet").
//
// ═══ TVÅSIDIGT BEVIS PER INVARIANT ═══
// Varje invariant prövas i BÅDA riktningar där det är meningsfullt: en trasig
// policy FÄLLER valideraPolicy med rätt skäl, en giltig variant av SAMMA
// policy SLÄPPER igenom.
//
// Kör: node scripts/test-synka-labels.mjs
// Exit 0 = alla gröna, 1 = minst ett rött.

import assert from 'node:assert/strict';
import {
  berakDiff,
  berakLabelSpec,
  formateraTorrkorning,
  synka,
  valideraPolicy,
} from './lib/synka-labels.mjs';
import { main } from './synka-labels.mjs';

let antalKorda = 0;
let antalFel = 0;

/** @param {string} namn @param {() => void | Promise<void>} fn */
async function test(namn, fn) {
  antalKorda += 1;
  try {
    await fn();
    process.stdout.write(`  ok  ${namn}\n`);
  } catch (err) {
    antalFel += 1;
    process.stdout.write(`FEL  ${namn}\n`);
    process.stdout.write(`     ${err.message}\n`);
  }
}

// ═══ FIXTURER ═══

function giltigPolicy() {
  return {
    version: 1,
    familjer: {
      tillstand: { farg: 'FBCA04', beskrivning: 'Livscykel-läge.' },
      klass: { farg: '5319E7', beskrivning: 'Korttyp.' },
      omrade: { farg: '0E8A16', beskrivning: 'Systemdel.' },
    },
    labels: {
      'ready-for-agent': { familj: 'tillstand', beskrivning: 'Redo för agent.' },
      fynd: { familj: 'klass', beskrivning: 'En upptäckt.' },
      grind: { familj: 'omrade', beskrivning: 'En CI-grind.' },
    },
    alias: {
      upptackt: 'fynd',
    },
    skyddade: ['ci-natt', 'wontfix'],
  };
}

function fejkKlient(existerande, opts = {}) {
  const skapade = [];
  const uppdaterade = [];
  return {
    existerande,
    skapade,
    uppdaterade,
    listLabels() {
      if (opts.listLabelsFel) throw new Error(opts.listLabelsFel);
      return existerande;
    },
    createLabel(spec) {
      if (opts.createLabelFel) throw new Error(opts.createLabelFel);
      skapade.push(spec);
      existerande.push({ name: spec.name, color: spec.color, description: spec.beskrivning });
    },
    updateLabel(spec) {
      if (opts.updateLabelFel) throw new Error(opts.updateLabelFel);
      uppdaterade.push(spec);
      const rad = existerande.find((l) => l.name === spec.name);
      if (rad) {
        rad.color = spec.color;
        rad.description = spec.beskrivning;
      }
    },
  };
}

async function huvud() {
  process.stdout.write('=== A: valideraPolicy — giltiga fall ===\n');

  await test('A1: en fullt giltig policy godkänns', () => {
    const res = valideraPolicy(giltigPolicy());
    assert.equal(res.ok, true);
    assert.equal(Object.keys(res.data.labels).length, 3);
  });

  await test('A2: alias och skyddade får saknas helt (defaultar till tomt)', () => {
    const p = giltigPolicy();
    delete p.alias;
    delete p.skyddade;
    const res = valideraPolicy(p);
    assert.equal(res.ok, true);
    assert.deepEqual(res.data.alias, {});
    assert.deepEqual(res.data.skyddade, []);
  });

  process.stdout.write('=== B: valideraPolicy — fail-closed på trasig struktur ===\n');

  await test('B1: policy som inte är ett objekt fälls', () => {
    assert.equal(valideraPolicy(null).ok, false);
    assert.equal(valideraPolicy('sträng').ok, false);
    assert.equal(valideraPolicy([1, 2]).ok, false);
  });

  await test('B2: saknat version fälls', () => {
    const p = giltigPolicy();
    delete p.version;
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /version/);
  });

  await test('B3: version som inte är heltal fälls', () => {
    const p = giltigPolicy();
    p.version = '1';
    assert.equal(valideraPolicy(p).ok, false);
  });

  await test('B4: saknade familjer fälls', () => {
    const p = giltigPolicy();
    delete p.familjer;
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /familjer/);
  });

  await test('B5: tom familjer-mängd fälls', () => {
    const p = giltigPolicy();
    p.familjer = {};
    assert.equal(valideraPolicy(p).ok, false);
  });

  await test('B6: familj med ogiltig färg (fel längd) fälls', () => {
    const p = giltigPolicy();
    p.familjer.tillstand.farg = 'ABC';
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /farg/);
  });

  await test('B7: familj med icke-hex färg fälls', () => {
    const p = giltigPolicy();
    p.familjer.tillstand.farg = 'GGGGGG';
    assert.equal(valideraPolicy(p).ok, false);
  });

  await test('B8: familj utan beskrivning fälls', () => {
    const p = giltigPolicy();
    p.familjer.tillstand.beskrivning = '';
    assert.equal(valideraPolicy(p).ok, false);
  });

  await test('B9: saknade labels fälls', () => {
    const p = giltigPolicy();
    delete p.labels;
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /labels/);
  });

  await test('B10: tom labels-mängd fälls', () => {
    const p = giltigPolicy();
    p.labels = {};
    assert.equal(valideraPolicy(p).ok, false);
  });

  await test('B11: label som pekar på okänd familj fälls', () => {
    const p = giltigPolicy();
    p.labels.fynd.familj = 'finns-inte';
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /okänd familj/);
  });

  await test('B12: label utan beskrivning fälls', () => {
    const p = giltigPolicy();
    p.labels.fynd.beskrivning = '   ';
    assert.equal(valideraPolicy(p).ok, false);
  });

  await test('B13: alias som pekar på okänd label fälls', () => {
    const p = giltigPolicy();
    p.alias.spoke = 'finns-inte-alls';
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /pekar på "finns-inte-alls"/);
  });

  await test('B14: alias-nyckel som samtidigt är en label-nyckel fälls', () => {
    const p = giltigPolicy();
    p.alias.fynd = 'grind';
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /eget alias/);
  });

  await test('B15: alias-nyckel som samtidigt är skyddad fälls', () => {
    const p = giltigPolicy();
    p.skyddade.push('upptackt');
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /skyddade/);
  });

  await test('B16: label-nyckel som samtidigt är skyddad fälls', () => {
    const p = giltigPolicy();
    p.skyddade.push('fynd');
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /BÅDE `labels` och `skyddade`/);
  });

  await test('B17: dubbletter i skyddade fälls', () => {
    const p = giltigPolicy();
    p.skyddade = ['ci-natt', 'ci-natt'];
    const res = valideraPolicy(p);
    assert.equal(res.ok, false);
    assert.match(res.fel, /dubbletter/);
  });

  await test('B18: skyddade som inte är en array av strängar fälls', () => {
    const p = giltigPolicy();
    p.skyddade = [1, 2];
    assert.equal(valideraPolicy(p).ok, false);
  });

  await test('B19: tom label-nyckel (whitespace) fälls', () => {
    const p = giltigPolicy();
    p.labels['  '] = { familj: 'klass', beskrivning: 'x' };
    assert.equal(valideraPolicy(p).ok, false);
  });

  process.stdout.write('=== C: berakLabelSpec — härledning ur familjens färg ===\n');

  await test('C1: varje label får sin familjs färg och sin egen beskrivning', () => {
    const { data } = valideraPolicy(giltigPolicy());
    const specs = berakLabelSpec(data);
    assert.equal(specs.length, 3);
    const grind = specs.find((s) => s.name === 'grind');
    assert.equal(grind.color, '0E8A16');
    assert.equal(grind.beskrivning, 'En CI-grind.');
  });

  await test('C2: specs är sorterade på namn (deterministisk utskrift)', () => {
    const { data } = valideraPolicy(giltigPolicy());
    const specs = berakLabelSpec(data);
    const namn = specs.map((s) => s.name);
    assert.deepEqual(
      namn,
      [...namn].sort((a, b) => a.localeCompare(b)),
    );
  });

  await test('C3: alias-nycklar producerar ALDRIG en egen spec', () => {
    const { data } = valideraPolicy(giltigPolicy());
    const specs = berakLabelSpec(data);
    assert.equal(
      specs.some((s) => s.name === 'upptackt'),
      false,
    );
  });

  process.stdout.write('=== D: berakDiff — skapa/uppdatera/oförändrat, aldrig radera ===\n');

  await test('D1: label som saknas i GitHub hamnar i skapa', () => {
    const { data } = valideraPolicy(giltigPolicy());
    const specs = berakLabelSpec(data);
    const diff = berakDiff([], specs);
    assert.equal(diff.skapa.length, 3);
    assert.equal(diff.uppdatera.length, 0);
    assert.equal(diff.oforandrat.length, 0);
  });

  await test('D2: identisk färg+beskrivning ⇒ oförändrat', () => {
    const { data } = valideraPolicy(giltigPolicy());
    const specs = berakLabelSpec(data);
    const existerande = specs.map((s) => ({
      name: s.name,
      color: s.color,
      description: s.beskrivning,
    }));
    const diff = berakDiff(existerande, specs);
    assert.equal(diff.oforandrat.length, 3);
    assert.equal(diff.skapa.length, 0);
    assert.equal(diff.uppdatera.length, 0);
  });

  await test('D3: färgen skiljer sig ⇒ uppdatera med tidigare-värden', () => {
    const { data } = valideraPolicy(giltigPolicy());
    const specs = berakLabelSpec(data);
    const existerande = [{ name: 'grind', color: 'FFFFFF', description: 'En CI-grind.' }];
    const diff = berakDiff(existerande, [specs.find((s) => s.name === 'grind')]);
    assert.equal(diff.uppdatera.length, 1);
    assert.equal(diff.uppdatera[0].tidigare.color, 'FFFFFF');
  });

  await test('D4: beskrivningen skiljer sig ⇒ uppdatera', () => {
    const spec = { name: 'grind', color: '0E8A16', beskrivning: 'Ny text.' };
    const existerande = [{ name: 'grind', color: '0E8A16', description: 'Gammal text.' }];
    const diff = berakDiff(existerande, [spec]);
    assert.equal(diff.uppdatera.length, 1);
  });

  await test('D5: färgjämförelsen är skiftlägesokänslig', () => {
    const spec = { name: 'grind', color: '0E8A16', beskrivning: 'x' };
    const existerande = [{ name: 'grind', color: '0e8a16', description: 'x' }];
    const diff = berakDiff(existerande, [spec]);
    assert.equal(diff.oforandrat.length, 1);
    assert.equal(diff.uppdatera.length, 0);
  });

  await test('D6: en skyddad label som redan finns i GitHub syns aldrig i diffen (ej i specs)', () => {
    const existerande = [{ name: 'ci-natt', color: 'B60205', description: 'Larm.' }];
    const diff = berakDiff(existerande, []);
    assert.equal(diff.skapa.length, 0);
    assert.equal(diff.uppdatera.length, 0);
    assert.equal(diff.oforandrat.length, 0);
  });

  await test('D7: diff-objektet saknar helt ett radera-fält (aldrig radera)', () => {
    const diff = berakDiff([{ name: 'okänd-extra-label', color: 'FFFFFF' }], []);
    assert.equal('radera' in diff, false);
    assert.deepEqual(Object.keys(diff).sort(), ['oforandrat', 'skapa', 'uppdatera']);
  });

  process.stdout.write('=== E: formateraTorrkorning — läsbar utskrift ===\n');

  await test('E1: räknar upp skapa/uppdatera/oförändrat/alias med rätt antal', () => {
    const diff = {
      skapa: [{ name: 'a', color: '000000', beskrivning: 'x' }],
      uppdatera: [],
      oforandrat: [{ name: 'b', color: '000000', beskrivning: 'y' }],
    };
    const text = formateraTorrkorning(diff, { alias1: 'b' });
    assert.match(text, /SKAPA \(1\)/);
    assert.match(text, /OFÖRÄNDRAT \(1\)/);
    assert.match(text, /ALIAS \(1/);
    assert.match(text, /alias1 → b/);
  });

  process.stdout.write('=== F: synka — orkestrering med injicerad gh-klient ===\n');

  await test('F1: policyfel propagerar som ok:false utan att röra gh-klienten', async () => {
    const klient = fejkKlient([]);
    const p = giltigPolicy();
    delete p.familjer;
    const res = await synka({ policy: p, ghKlient: klient, utfor: true });
    assert.equal(res.ok, false);
    assert.equal(klient.skapade.length, 0);
  });

  await test('F2: torrkörning (utfor: false) anropar aldrig createLabel/updateLabel', async () => {
    const klient = fejkKlient([]);
    const res = await synka({ policy: giltigPolicy(), ghKlient: klient, utfor: false });
    assert.equal(res.ok, true);
    assert.equal(res.diff.skapa.length, 3);
    assert.equal(klient.skapade.length, 0);
  });

  await test('F3: --utfor skapar exakt de saknade labels', async () => {
    const klient = fejkKlient([], {});
    const res = await synka({
      policy: giltigPolicy(),
      ghKlient: klient,
      utfor: true,
      sleepFn: async () => {},
    });
    assert.equal(res.ok, true);
    assert.equal(klient.skapade.length, 3);
  });

  await test('F4: en paus injiceras mellan varje skrivning (sleepFn anropas N-1 gånger)', async () => {
    const klient = fejkKlient([]);
    let pauser = 0;
    await synka({
      policy: giltigPolicy(),
      ghKlient: klient,
      utfor: true,
      sleepFn: async () => {
        pauser += 1;
      },
    });
    assert.equal(pauser, 2); // 3 skrivningar ⇒ 2 pauser mellan dem
  });

  await test('F5: idempotens — andra körningen ger noll diff mot en muterad existerande-lista', async () => {
    const klient = fejkKlient([], {});
    await synka({ policy: giltigPolicy(), ghKlient: klient, utfor: true, sleepFn: async () => {} });
    const andra = await synka({
      policy: giltigPolicy(),
      ghKlient: klient,
      utfor: true,
      sleepFn: async () => {},
    });
    assert.equal(andra.diff.skapa.length, 0);
    assert.equal(andra.diff.uppdatera.length, 0);
    assert.equal(andra.diff.oforandrat.length, 3);
    assert.equal(klient.skapade.length, 3); // inga NYA skapanden i andra varvet
  });

  await test('F6: gh-fel vid listLabels propagerar (kastas till anroparen)', async () => {
    const klient = fejkKlient([], { listLabelsFel: 'nätverksfel' });
    await assert.rejects(
      () => synka({ policy: giltigPolicy(), ghKlient: klient, utfor: false }),
      /nätverksfel/,
    );
  });

  await test('F7: gh-fel vid createLabel propagerar och stoppar återstående skrivningar', async () => {
    const klient = fejkKlient([], { createLabelFel: 'skapa-fel' });
    await assert.rejects(
      () =>
        synka({
          policy: giltigPolicy(),
          ghKlient: klient,
          utfor: true,
          sleepFn: async () => {},
        }),
      /skapa-fel/,
    );
  });

  await test('F8: aliasKarta returneras oförändrad från policyn', async () => {
    const klient = fejkKlient([]);
    const res = await synka({ policy: giltigPolicy(), ghKlient: klient, utfor: false });
    assert.deepEqual(res.aliasKarta, { upptackt: 'fynd' });
  });

  process.stdout.write(
    '=== G/H: main (CLI-lager) — injicerad klient + verklig temporär policy-fil, aldrig riktig gh ===\n',
  );

  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');

  function skrivTempPolicy(policyObj) {
    const dir = mkdtempSync(join(tmpdir(), 'synka-labels-test-'));
    const path = join(dir, 'policy.json');
    writeFileSync(path, JSON.stringify(policyObj), 'utf8');
    return { dir, path };
  }

  await test('H1: main med drift i torrkörning ⇒ exit 1', async () => {
    const { dir, path } = skrivTempPolicy(giltigPolicy());
    try {
      const klient = fejkKlient([]);
      let ut = '';
      const kod = await main(['--policy', path], {
        ghKlient: klient,
        stdout: (s) => {
          ut += s;
        },
        stderr: () => {},
      });
      assert.equal(kod, 1);
      assert.match(ut, /SKAPA \(3\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('H2: main utan drift i torrkörning ⇒ exit 0', async () => {
    const { data } = valideraPolicy(giltigPolicy());
    const specs = berakLabelSpec(data);
    const existerande = specs.map((s) => ({
      name: s.name,
      color: s.color,
      description: s.beskrivning,
    }));
    const { dir, path } = skrivTempPolicy(giltigPolicy());
    try {
      const klient = fejkKlient(existerande);
      const kod = await main(['--policy', path], {
        ghKlient: klient,
        stdout: () => {},
        stderr: () => {},
      });
      assert.equal(kod, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('H3: main --utfor kör skapa-anrop och returnerar exit 0', async () => {
    const { dir, path } = skrivTempPolicy(giltigPolicy());
    try {
      const klient = fejkKlient([]);
      const kod = await main(['--utfor', '--policy', path], {
        ghKlient: klient,
        stdout: () => {},
        stderr: () => {},
        sleepMs: 0,
      });
      assert.equal(kod, 0);
      assert.equal(klient.skapade.length, 3);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('H13: main FORWARDAR sleepMs/sleepFn till synka() (annars blockar --utfor CI i onödan)', async () => {
    const { dir, path } = skrivTempPolicy(giltigPolicy());
    try {
      const klient = fejkKlient([]);
      let pauser = 0;
      const kod = await main(['--utfor', '--policy', path], {
        ghKlient: klient,
        stdout: () => {},
        stderr: () => {},
        sleepFn: async () => {
          pauser += 1;
        },
      });
      assert.equal(kod, 0);
      assert.equal(pauser, 2); // 3 skrivningar ⇒ 2 pauser — bevisar att deps.sleepFn NÅDDE synka()
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('H4: main --json producerar giltig JSON på stdout', async () => {
    const { dir, path } = skrivTempPolicy(giltigPolicy());
    try {
      const klient = fejkKlient([]);
      let ut = '';
      await main(['--json', '--policy', path], {
        ghKlient: klient,
        stdout: (s) => {
          ut += s;
        },
        stderr: () => {},
      });
      const parsed = JSON.parse(ut);
      assert.equal(parsed.diff.skapa.length, 3);
      assert.equal(parsed.utford, false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('H5: main med ogiltig policy-JSON ⇒ exit 2', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'synka-labels-test-'));
    const path = join(dir, 'policy.json');
    writeFileSync(path, '{ inte giltig json', 'utf8');
    try {
      const klient = fejkKlient([]);
      let felUt = '';
      const kod = await main(['--policy', path], {
        ghKlient: klient,
        stdout: () => {},
        stderr: (s) => {
          felUt += s;
        },
      });
      assert.equal(kod, 2);
      assert.match(felUt, /giltig JSON/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('H6: main med semantiskt ogiltig policy (policyfel) ⇒ exit 2', async () => {
    const p = giltigPolicy();
    p.labels.fynd.familj = 'finns-inte';
    const { dir, path } = skrivTempPolicy(p);
    try {
      const klient = fejkKlient([]);
      let felUt = '';
      const kod = await main(['--policy', path], {
        ghKlient: klient,
        stdout: () => {},
        stderr: (s) => {
          felUt += s;
        },
      });
      assert.equal(kod, 2);
      assert.match(felUt, /Policyfel/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('H7: main med saknad policy-fil ⇒ exit 2', async () => {
    const klient = fejkKlient([]);
    let felUt = '';
    const kod = await main(['--policy', '/finns/definitivt/inte.json'], {
      ghKlient: klient,
      stdout: () => {},
      stderr: (s) => {
        felUt += s;
      },
    });
    assert.equal(kod, 2);
    assert.match(felUt, /Kunde inte läsa/);
  });

  await test('H8: main med okänt argument ⇒ exit 2', async () => {
    const klient = fejkKlient([]);
    let felUt = '';
    const kod = await main(['--vad-är-detta'], {
      ghKlient: klient,
      stdout: () => {},
      stderr: (s) => {
        felUt += s;
      },
    });
    assert.equal(kod, 2);
    assert.match(felUt, /Okänt argument/);
  });

  await test('H9: main --policy utan värde ⇒ exit 2', async () => {
    const klient = fejkKlient([]);
    const kod = await main(['--policy'], {
      ghKlient: klient,
      stdout: () => {},
      stderr: () => {},
    });
    assert.equal(kod, 2);
  });

  await test('H10: main propagerar gh-anropsfel som exit 2 (aldrig 0/1)', async () => {
    const { dir, path } = skrivTempPolicy(giltigPolicy());
    try {
      const klient = fejkKlient([], { listLabelsFel: 'gh är nere' });
      let felUt = '';
      const kod = await main(['--policy', path], {
        ghKlient: klient,
        stdout: () => {},
        stderr: (s) => {
          felUt += s;
        },
      });
      assert.equal(kod, 2);
      assert.match(felUt, /gh-anrop fallerade/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('H11: två körningar i rad via main ger noll diff på andra (idempotens, CLI-nivå)', async () => {
    const { dir, path } = skrivTempPolicy(giltigPolicy());
    try {
      const klient = fejkKlient([]);
      await main(['--utfor', '--policy', path], {
        ghKlient: klient,
        stdout: () => {},
        stderr: () => {},
        sleepMs: 0,
      });
      let andraUt = '';
      const kod = await main(['--policy', path], {
        ghKlient: klient,
        stdout: (s) => {
          andraUt += s;
        },
        stderr: () => {},
      });
      assert.equal(kod, 0);
      assert.match(andraUt, /SKAPA \(0\)/);
      assert.match(andraUt, /OFÖRÄNDRAT \(3\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  await test('H12: skyddad label i GitHubs faktiska lista rörs aldrig av --utfor', async () => {
    const { dir, path } = skrivTempPolicy(giltigPolicy());
    try {
      const klient = fejkKlient([{ name: 'ci-natt', color: 'B60205', description: 'Larm.' }]);
      await main(['--utfor', '--policy', path], {
        ghKlient: klient,
        stdout: () => {},
        stderr: () => {},
        sleepMs: 0,
      });
      assert.equal(
        klient.uppdaterade.some((s) => s.name === 'ci-natt'),
        false,
      );
      const ciNatt = klient.existerande.find((l) => l.name === 'ci-natt');
      assert.equal(ciNatt.color, 'B60205');
      assert.equal(ciNatt.description, 'Larm.');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  process.stdout.write('\n');
  process.stdout.write(`${antalKorda} test körda, ${antalFel} fel.\n`);
  process.exitCode = antalFel === 0 ? 0 : 1;
}

await huvud();
