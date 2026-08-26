// scripts/lib/review-loop.mjs — rundtaks-loopens LOGIK: ett granskningsutlåtande
// (TASK-173.1:s schema) + loop-policyn → ETT deterministiskt nästa-steg-beslut
// (TASK-173.5, ADR-105 beslut 4/5).
//
// ═══ VAD DETTA ÄR ═══
// Den universella halvan av loop-ytan: klassning, prioritetsordning och
// rendering. VÄRDENA — taket, tröskeln per runda, vad som eskalerar — bor i
// `.review-loop-policy.json` och kan bytas per projekt utan att röra en rad här
// (grindvakts-konventionen, ~/.claude/CLAUDE.md § Instruktioner, Lesson #6
// [UNIVERSAL]). Läsningen ur den trusted källan (`git show origin/main:...`)
// ligger INTE här utan i scripts/review-loop-beslut.mjs — denna modul är ren och
// gör ingen I/O, vilket är vad som gör den testbar med syntetiska fixturer.
// Samma lager-snitt som 173.2 (review-policy.mjs mot hamta-review-policy.mjs)
// och 173.3 (review-risk-sektion.mjs mot uppdatera-review-sektion.mjs).
//
// ═══ BESLUTET ÄR EN REN FUNKTION AV DET AKTUELLA UTLÅTANDET ═══
// Loopen bär medvetet INGEN egen rundhistorik. Allt beslutet behöver står i
// utlåtandet för den runda som just kördes:
//   - taket prövas mot `runda` (granskaren får rundnumret av orkestreraren och
//     bokför det — fältet finns sedan 173.1 just för denna skiva),
//   - blockeringen prövas mot `fynd[].severity` i DENNA runda,
//   - routingen mot `fynd[].action`,
//   - risk-eskaleringen mot `risk.niva`,
//   - och diff-basen för NÄSTA runda är detta utlåtandes egen `granskadSha`.
// Det är Gerrits modell för godkännanden: rösterna hör till en patch set, och
// "Whether votes are sticky when a new patch set is created depends on the
// `copyCondition` of the label" — de som inte kopieras blir `outdated`
// (gerrit-review.googlesource.com, Review Labels, verifierat 2026-08-26). Att i
// stället bygga en tredje durabel bokföringsyta (utöver 173.3:s PR-sektion och
// 173.6:s instrumenteringslogg) hade varit spekulativ komplexitet före den
// konsument som skulle läsa den finns (dubbelriktad över-engineering-vakt,
// ~/.claude/CLAUDE.md § Instruktioner).
//
// ═══ RUNDAN ÄR KNUTEN TILL EN SHA — DÄRAV NO_CHANGE-KONTROLLEN ═══
// Tre branschledare knyter granskningens giltighet till att något faktiskt
// pushats, inte till att en granskare kördes igen:
//   - GitHub: "you can choose to dismiss stale pull request approvals when
//     commits are pushed that affect the diff in the pull request" — och då
//     "the pull request cannot be merged until someone approves the work again"
//     (docs.github.com, About protected branches, verifierat 2026-08-26).
//   - Prow/Kubernetes: "The bot retracts the label automatically if someone
//     updates the PR with a new commit" (docs.prow.k8s.io, approve-pluginets
//     approvers-sida, verifierat 2026-08-26).
//   - Gerrit: en ny patch set är själva enheten en röst hör till (samma källa
//     som ovan; `copyCondition` avgör vad som överlever den).
// Motsatsen gäller därför också: körs runda N>1 mot SAMMA `granskadSha` som
// föregående runda har ingen fix pushats, och rundan prövar ingenting nytt.
// `beslutaNastaSteg` fäller det som `eskalera-ingen-andring` i stället för att
// låta en identisk omgranskning se ut som konvergens (`foregaendeSha` är
// valfri — utan den kan kontrollen inte göras, och det står i beslutets
// `varningar`).
//
// ═══ KONVERGENSREGELN ═══
// Runda k+1 granskar diffen SEDAN runda k:s `granskadSha` plus de kvarstående
// öppna fynden — inte hela PR:en på nytt. Branschens egen distinktion:
// "@coderabbitai review does incremental review (new changes), not a full
// review" mot "full review ... Performs a complete review of all files from
// scratch" (docs.coderabbit.ai, review commands, verifierat 2026-08-26).
// Full-diff-omgranskning varje runda är den belagda rotorsaken till förlagans
// 27 rundor på 8,2 timmar utan konvergens (kunchenguid/no-mistakes#683, se
// docs/research/k1-no-mistakes-anatomi-2026-08-09.md § 3) — den incidenten är
// hela skälet till att ADR-105 beslut 4 finns.
//
// ═══ GRINDEN SJÄLVGODKÄNNER ALDRIG VID TAK (AC #4) ═══
// Taket byter AUTOMATIK mot ESKALERING, aldrig automatik mot godkännande. Vid
// `runda >= tak` med kvarstående öppna fynd är utfallet `eskalera-tak` —
// `armeringTillaten: false` — och de öppna fynden renderas som en markeringsbar
// STOPPA-OCH-FRÅGA-lista (~/.claude/CLAUDE.md § Instruktioner: markeringsbar
// text i chatt, aldrig en AskUserQuestion-popup). Ett utlåtande vars `runda`
// ligger ÖVER taket behandlas som taket nått, plus en varning — fail-closed åt
// det håll där ett fel kostar Marcus lästid i stället för en oläst landning.
//
// ═══ ESCAPING: `cell`/`kodcell` ÅTERANVÄNDS, ALDRIG EN EGEN REGEX ═══
// Renderingen importerar scripts/lib/review-risk-sektion.mjs:s `cell`/`kodcell`
// i stället för att normalisera fri text på egen hand. CodeQL fällde
// js/incomplete-sanitization TVÅ gånger på 173.3:s escaping (alert #6, PR
// #1993) innan bakstreck-FÖRST-ordningen satt; en andra, oberoende
// implementation av samma sak hade återinfört exakt den felklassen i en ny fil.
// Kostnaden är synlig och accepterad: en flerradig fynd-beskrivning renderas
// med `<br>` även i den listan som läses i chatt, eftersom `cell` är byggd för
// en GFM-tabellcell. Ett läsbarhets-avkall slår en tredje escaping-yta.

import { z } from 'zod';
import { cell, kodcell } from './review-risk-sektion.mjs';

/** Loop-policyns format-version. `z.literal` gör att en okänd version FÄLLER
 * i stället för att tolkas som dagens form — samma val som POLICY_VERSION i
 * scripts/lib/review-policy.mjs. */
export const LOOP_POLICY_VERSION = 1;

/** Filnamnet i repo-roten. Exporteras så CLI:t och testsviten aldrig har var
 * sin sträng-kopia som kan glida isär. */
export const LOOP_POLICY_FIL = '.review-loop-policy.json';

/** Severity-ordning, låg → hög. En tröskel `t` blockerar varje fynd vars
 * severity-rang är >= rangen för `t`. */
const SEVERITY_RANG = { info: 0, warning: 1, error: 2 };

const Severity = z.enum(['info', 'warning', 'error']);

export const LoopPolicySchema = z
  .strictObject({
    _readme: z.array(z.string()).optional(),
    version: z.literal(LOOP_POLICY_VERSION),
    /** Max antal fulla rundor (ADR-105 beslut 4: startvärde 2, omprövas mot
     * 173.6:s mätdata). */
    tak: z.number().int().positive(),
    /** En post per runda, index 0 = runda 1. Lägsta severity som blockerar. */
    blockeringstroskel: z.array(Severity).min(1),
    /** Risknivåer som eskalerar till Marcus oavsett runda (ADR-105 beslut 5). */
    eskaleraVidRisk: z.array(z.enum(['lag', 'medel', 'hog'])),
    /** Fynd-actions som eskalerar till Marcus oavsett runda (AC #3). */
    eskaleraVidAction: z.array(z.enum(['auto-fix', 'ask-user'])),
    /** Konvergensregeln: granskar runda k+1 bara diffen sedan runda k? */
    granskaDiffSedanForegaendeRunda: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.blockeringstroskel.length !== data.tak) {
      ctx.addIssue({
        code: 'custom',
        path: ['blockeringstroskel'],
        message:
          `blockeringstroskel har ${data.blockeringstroskel.length} post(er) men tak är ${data.tak} — ` +
          'listan måste bära exakt en tröskel per runda. En config där de glidit isär fälls hellre ' +
          'än tolkas med en gissad default (TASK-173.5).',
      });
    }
    if (data.eskaleraVidAction.includes('auto-fix')) {
      ctx.addIssue({
        code: 'custom',
        path: ['eskaleraVidAction'],
        message:
          "'auto-fix' kan inte eskalera till Marcus — det är per definition den klass som routas " +
          'till bygg-agenten för rättning (TASK-173.5 AC #3). Med båda actions eskalerande finns ' +
          'ingen fix-väg kvar och loopen kan aldrig konvergera.',
      });
    }
  });

/**
 * Validerar en redan JSON.parse:ad loop-policy mot schemat. Fail-closed: allt
 * som inte validerar ger `ok: false` — anroparen ska AVBRYTA, aldrig fortsätta
 * med gissade defaults. Samma disciplin som `parsaPolicy` i
 * scripts/lib/review-policy.mjs.
 *
 * @param {unknown} raw
 * @returns {{ ok: true, policy: z.infer<typeof LoopPolicySchema>, errors: [] }
 *         | { ok: false, policy: null, errors: string[] }}
 */
export function parsaLoopPolicy(raw) {
  const result = LoopPolicySchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      policy: null,
      errors: result.error.issues.map(
        (issue) => `${issue.path.join('.') || '(rot)'}: ${issue.message}`,
      ),
    };
  }
  return { ok: true, policy: result.data, errors: [] };
}

/**
 * Blockeringströskeln för en given runda. Rundor ÖVER listans längd får
 * listans SISTA tröskel — den smalaste rundan upprepas hellre än att en
 * out-of-range-runda tyst faller till en bredare tröskel. (I den skarpa vägen
 * kan det inte inträffa: schemat kräver `blockeringstroskel.length === tak`,
 * och `runda > tak` eskalerar innan tröskeln används för ett rundbeslut.)
 *
 * @param {z.infer<typeof LoopPolicySchema>} policy
 * @param {number} runda  1-baserad.
 * @returns {'info'|'warning'|'error'}
 */
export function troskelForRunda(policy, runda) {
  const index = Math.min(Math.max(runda, 1), policy.blockeringstroskel.length) - 1;
  return policy.blockeringstroskel[index];
}

/**
 * Den severity från och med vilken ett fynd räknas som ÖPPET — härledd, inte
 * en egen config-ratt: den BREDASTE tröskeln någon runda använder. Med
 * `['warning','error']` blir öppet = warning + error, och `info` är bokfört
 * men inte öppet. Ändras tröskellistan följer öppenhets-definitionen
 * automatiskt med, i stället för att glida isär från den.
 *
 * @param {z.infer<typeof LoopPolicySchema>} policy
 * @returns {'info'|'warning'|'error'}
 */
export function oppenhetsTroskel(policy) {
  return policy.blockeringstroskel.reduce((lagst, t) =>
    SEVERITY_RANG[t] < SEVERITY_RANG[lagst] ? t : lagst,
  );
}

function blockerar(fynd, troskel) {
  return SEVERITY_RANG[fynd.severity] >= SEVERITY_RANG[troskel];
}

/**
 * Klassar ett utlåtandes fynd mot policyn för den runda utlåtandet bär.
 *
 * - `blockerande` — fynd som stoppar DENNA runda (severity >= rundans tröskel).
 *   I runda 2 är tröskeln `error`, så warnings/info bokförs utan att stoppa
 *   (ADR-105 beslut 4, AC #1).
 * - `oppna` — kvarstående fynd som ska presenteras för Marcus vid tak:
 *   severity >= `oppenhetsTroskel`, ELLER en action som eskalerar. Ett
 *   `info`-fynd med `ask-user` är alltså öppet — granskaren har per definition
 *   sagt att hen inte kunde avgöra det.
 * - `tillBygg` — fynd med en icke-eskalerande action (`auto-fix`): bygg-agentens
 *   rättningslista (AC #3).
 * - `tillMarcus` — fynd med en eskalerande action (`ask-user`), oavsett
 *   severity och oavsett runda (AC #3).
 *
 * @param {object} u  Ett VALIDERAT utlåtande (`valideraUtlatande(raw).data`).
 * @param {z.infer<typeof LoopPolicySchema>} policy
 */
export function klassaFynd(u, policy) {
  const troskel = troskelForRunda(policy, u.runda);
  const oppetFran = oppenhetsTroskel(policy);
  const eskalerande = new Set(policy.eskaleraVidAction);

  const blockerande = u.fynd.filter((f) => blockerar(f, troskel));
  const oppna = u.fynd.filter((f) => blockerar(f, oppetFran) || eskalerande.has(f.action));
  const tillMarcus = u.fynd.filter((f) => eskalerande.has(f.action));
  const tillBygg = u.fynd.filter((f) => !eskalerande.has(f.action));

  return { troskel, oppetFran, blockerande, oppna, tillBygg, tillMarcus };
}

/**
 * Loopens hela beslut för EN runda. Deterministisk: samma utlåtande + samma
 * policy + samma `foregaendeSha` ⇒ samma beslut, alltid.
 *
 * ═══ PRIORITETSORDNINGEN (fast, i denna ordning) ═══
 *  1. `eskalera-risk`          risk.niva ∈ policy.eskaleraVidRisk (ADR-105
 *                              beslut 5 är hårdast: armering väntar på Marcus)
 *  2. `eskalera-ask-user`      något fynd bär en eskalerande action (AC #3,
 *                              "oavsett runda")
 *  3. `eskalera-ingen-andring` runda > 1 och samma granskadSha som föregående
 *                              runda — inget pushades, rundan prövade inget
 *  4. `eskalera-tak`           runda >= tak och öppna fynd kvarstår (AC #2/#4)
 *  5. `ny-runda`               blockerande fynd och runda < tak
 *  6. `konvergerad`            inget av ovanstående
 *
 * Endast `konvergerad` sätter `armeringTillaten: true`, och även då gäller
 * orkestrerarens övriga regler oförändrat (CLAUDE.md § Landning) — beslutet är
 * ett grind-utfall, inte en armerings-order.
 *
 * @param {object} args
 * @param {object} args.utlatande      Ett VALIDERAT utlåtande.
 * @param {z.infer<typeof LoopPolicySchema>} args.policy
 * @param {string|null} [args.foregaendeSha]  Föregående rundas `granskadSha`,
 *   om orkestreraren har den (PR-sektionen från 173.3 bär den för senaste
 *   rundan). Utan den hoppas NO_CHANGE-kontrollen över, och det står i
 *   `varningar`.
 */
export function beslutaNastaSteg({ utlatande: u, policy, foregaendeSha = null }) {
  const klass = klassaFynd(u, policy);
  const varningar = [];

  if (u.runda > policy.tak) {
    varningar.push(
      `Utlåtandet bär runda ${u.runda}, ÖVER taket ${policy.tak} — loopen ska aldrig producera en ` +
        'sådan runda. Behandlas som att taket nåtts; kontrollera hur granskaren spawnades.',
    );
  }
  if (u.runda > 1 && foregaendeSha === null) {
    varningar.push(
      `Ingen föregående granskadSha angavs för runda ${u.runda} — kontrollen av att något faktiskt ` +
        'pushats mellan rundorna kunde inte göras.',
    );
  }

  const bas = {
    runda: u.runda,
    tak: policy.tak,
    troskel: klass.troskel,
    oppetFran: klass.oppetFran,
    granskadSha: u.granskadSha,
    prNummer: u.prNummer,
    kortId: u.kortId,
    risk: u.risk,
    blockerande: klass.blockerande,
    oppna: klass.oppna,
    tillBygg: klass.tillBygg,
    tillMarcus: klass.tillMarcus,
    varningar,
  };

  const takNatt = u.runda >= policy.tak;
  const nastaRunda = takNatt ? null : u.runda + 1;
  const nastaTroskel = nastaRunda === null ? null : troskelForRunda(policy, nastaRunda);
  const diffBas =
    nastaRunda !== null && policy.granskaDiffSedanForegaendeRunda ? u.granskadSha : null;

  if (policy.eskaleraVidRisk.includes(u.risk.niva)) {
    return {
      ...bas,
      beslut: 'eskalera-risk',
      skal:
        `Risknivå '${u.risk.niva}' eskalerar till Marcus oavsett runda (ADR-105 beslut 5) — ` +
        'armering väntar på hans explicita granskning.',
      nastaRunda: null,
      nastaTroskel: null,
      diffBas: null,
      armeringTillaten: false,
    };
  }

  if (klass.tillMarcus.length > 0) {
    return {
      ...bas,
      beslut: 'eskalera-ask-user',
      skal:
        `${klass.tillMarcus.length} fynd är klassade '${policy.eskaleraVidAction.join("'/'")}' och ` +
        'eskalerar till Marcus oavsett runda (AC #3) — bygg-agenten får inte gissa sig förbi dem.',
      nastaRunda: null,
      nastaTroskel: null,
      diffBas: null,
      armeringTillaten: false,
    };
  }

  if (u.runda > 1 && foregaendeSha !== null && foregaendeSha === u.granskadSha) {
    return {
      ...bas,
      beslut: 'eskalera-ingen-andring',
      skal:
        `Runda ${u.runda} granskade samma SHA som föregående runda (${u.granskadSha}) — inget ` +
        'pushades emellan, så rundan prövade ingen fix. En omgranskning utan ny commit är inte en ' +
        'ny runda (GitHub dismissar godkännanden på pushade commits; Prow återkallar lgtm vid ny ' +
        'commit) och räknas därför aldrig som konvergens.',
      nastaRunda: null,
      nastaTroskel: null,
      diffBas: null,
      armeringTillaten: false,
    };
  }

  if (takNatt && klass.oppna.length > 0) {
    return {
      ...bas,
      beslut: 'eskalera-tak',
      skal:
        `Rundtaket ${policy.tak} är nått och ${klass.oppna.length} öppet/öppna fynd kvarstår — taket ` +
        'byter automatik mot eskalering, aldrig mot godkännande (ADR-105 beslut 4, AC #2/#4).',
      nastaRunda: null,
      nastaTroskel: null,
      diffBas: null,
      armeringTillaten: false,
    };
  }

  if (klass.blockerande.length > 0) {
    return {
      ...bas,
      beslut: 'ny-runda',
      skal:
        `${klass.blockerande.length} fynd på/över tröskeln '${klass.troskel}' blockerar runda ` +
        `${u.runda} — bygg-agenten rättar, därefter körs runda ${nastaRunda} i FÄRSK kontext.`,
      nastaRunda,
      nastaTroskel,
      diffBas,
      armeringTillaten: false,
    };
  }

  return {
    ...bas,
    beslut: 'konvergerad',
    skal:
      `Inga fynd på/över tröskeln '${klass.troskel}' i runda ${u.runda} — loopen har konvergerat. ` +
      'Orkestrerarens övriga armerings-regler gäller oförändrat (CLAUDE.md § Landning).',
    nastaRunda: null,
    nastaTroskel: null,
    diffBas: null,
    armeringTillaten: true,
  };
}

function fyndrad(f, prefix) {
  const plats = f.plats
    ? ` (${kodcell(f.plats.rad !== null ? `${f.plats.fil}:${f.plats.rad}` : f.plats.fil)})`
    : '';
  return `${prefix} **${f.severity}** / \`${f.action}\` — ${cell(f.beskrivning)}${plats}`;
}

/**
 * Renderar beslutet som den text orkestreraren agerar på — och, vid en
 * eskalering, som den MARKERINGSBARA STOPPA-OCH-FRÅGA-lista Marcus svarar i
 * (~/.claude/CLAUDE.md § Instruktioner: markeringsbar text i chatt, aldrig en
 * AskUserQuestion-popup; TASK-173.5 AC #2).
 *
 * Ren funktion: samma beslut ⇒ byte-identisk text.
 *
 * @param {ReturnType<typeof beslutaNastaSteg>} b
 * @returns {string}
 */
export function renderaBeslut(b) {
  const rader = [];
  const rubrik = {
    konvergerad: '✅ KONVERGERAD',
    'ny-runda': '🔁 NY RUNDA',
    'eskalera-tak': '🛑 STOPPA-OCH-FRÅGA — rundtaket nått',
    'eskalera-risk': '🛑 STOPPA-OCH-FRÅGA — HÖG risk',
    'eskalera-ask-user': '🛑 STOPPA-OCH-FRÅGA — fynd kräver Marcus beslut',
    'eskalera-ingen-andring': '🛑 STOPPA-OCH-FRÅGA — ingen ändring mellan rundorna',
  };

  rader.push(`## Review-loop — ${rubrik[b.beslut] ?? b.beslut}`);
  rader.push('');
  rader.push(
    `PR #${b.prNummer}${b.kortId ? ` · ${b.kortId}` : ' · inget kort länkat'} · runda ${b.runda}/${b.tak} · ` +
      `granskad SHA ${kodcell(b.granskadSha)} · blockeringströskel \`${b.troskel}\``,
  );
  rader.push('');
  rader.push(`> ${cell(b.skal)}`);

  if (b.varningar.length > 0) {
    rader.push('');
    rader.push('**Varningar:**');
    for (const v of b.varningar) rader.push(`- ⚠️ ${cell(v)}`);
  }

  if (b.beslut === 'ny-runda') {
    rader.push('');
    rader.push(`### Till bygg-agenten (${b.tillBygg.length})`);
    rader.push('');
    if (b.tillBygg.length === 0) {
      rader.push('Inga auto-fix-klassade fynd.');
    } else {
      for (const f of b.tillBygg) rader.push(fyndrad(f, '-'));
    }
    rader.push('');
    rader.push(`### Instruktion för runda ${b.nastaRunda}`);
    rader.push('');
    rader.push(
      '- Spawna `review-agent` i **FÄRSK kontext** — aldrig ett meddelande till bygg-agentens ' +
        'session (ADR-105 beslut 2).',
    );
    rader.push(`- Skicka \`runda: ${b.nastaRunda}\`.`);
    if (b.diffBas !== null) {
      rader.push(
        `- **Konvergensregeln:** granska diffen SEDAN ${kodcell(b.diffBas)} plus de kvarstående ` +
          'öppna fynden nedan — inte hela PR:en på nytt.',
      );
    } else {
      rader.push('- Konvergensregeln är AV i policyn: granska hela PR-diffen på nytt.');
    }
    rader.push(
      `- Runda ${b.nastaRunda} blockerar på \`${b.nastaTroskel}\` och uppåt — allt under den tröskeln ` +
        'bokförs i utlåtandet utan att stoppa (ADR-105 beslut 4, AC #1).',
    );
    if (b.oppna.length > 0) {
      rader.push('');
      rader.push(
        `### Kvarstående öppna fynd att bära in i runda ${b.nastaRunda} (${b.oppna.length})`,
      );
      rader.push('');
      for (const f of b.oppna) rader.push(fyndrad(f, '-'));
    }
  }

  if (b.beslut.startsWith('eskalera')) {
    rader.push('');
    rader.push(`### Öppna fynd — markera det du vill ha åtgärdat (${b.oppna.length})`);
    rader.push('');
    if (b.oppna.length === 0) {
      rader.push(
        'Inga öppna fynd — eskaleringen beror på beslutet ovan, inte på ett enskilt fynd.',
      );
    } else {
      b.oppna.forEach((f, i) => {
        rader.push(fyndrad(f, `- [ ] **${i + 1}.**`));
      });
    }
    rader.push('');
    rader.push('**Beslut som väntar på dig:**');
    rader.push('');
    rader.push('- [ ] Armera PR:en som den är (de markerade fynden avskrivs medvetet)');
    rader.push('- [ ] Rätta de markerade fynden först — bygg-agenten får dem som order');
    rader.push('- [ ] Något annat (skriv fritt)');
    rader.push('');
    rader.push(
      '_Grinden självgodkänner aldrig: ingen ytterligare automatisk runda körs, och armeringen ' +
        'väntar på ditt beslut (ADR-105 beslut 4, TASK-173.5 AC #2/#4)._',
    );
  }

  if (b.beslut === 'konvergerad' && b.tillBygg.length > 0) {
    rader.push('');
    rader.push(`### Bokfört utan att stoppa (${b.tillBygg.length})`);
    rader.push('');
    rader.push(
      `_Under tröskeln \`${b.troskel}\` för runda ${b.runda} — information, ingen rättnings-order._`,
    );
    rader.push('');
    for (const f of b.tillBygg) rader.push(fyndrad(f, '-'));
  }

  return rader.join('\n').trimEnd();
}
