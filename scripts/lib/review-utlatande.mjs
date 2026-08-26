// scripts/lib/review-utlatande.mjs — schemat för review-agentens JSON-utlåtande
// (TASK-173.1, ADR-105 beslut 2/5/6/7).
//
// ═══ VAD DETTA ÄR ═══
// Enda sanningskällan för utlåtande-kontraktet: review-agenten (spawnas av
// orkestreraren i FÄRSK kontext, efter push, före armering — ADR-105 beslut 2)
// returnerar JSON som MÅSTE validera mot detta schema. Nedströms-skivorna
// bygger vidare på den utan att duplicera formen:
//   173.3 (risk-rendreraren)  läser `risk` + `fynd[].bevis` → PR-sektionen
//   173.4 (CI-backstoppen)    verifierar att PR:en bär ett giltigt utlåtande
//   173.5 (rundtaks-loopen)   läser `runda` + `fynd[].severity`
//   173.6 (instrumenteringen) läser hela utlåtandet per körning
//
// ═══ VARFÖR ZOD OCH INTE EN HANDSKRIVEN JSON SCHEMA-FIL ═══
// Repot har inget ajv/json-schema-bibliotek, men `zod` (^4.4.3) är redan
// direkt beroende (package.json) och bär sedan v4 inbyggd `z.toJSONSchema()`
// (node_modules/zod/v4/core/to-json-schema.d.ts, verifierat 2026-08-24) — en
// EN sanningskälla ger både runtime-validering (detta modul) och en portabel
// JSON Schema-fil för dokumentation/framtida konsumenter
// (se scripts/generera-review-schema.mjs), i stället för två parallella
// definitioner som kan glida isär. Branschledarnas mönster (zod.dev/json-schema,
// verifierat mot installerad v4.4.3): Zod-schemat är källan, JSON Schema är
// den härledda artefakten.
//
// ═══ FAIL-CLOSED PÅ `action` — INTE PÅ RESTEN (AC #2) ═══
// `action` är det ENDA fältet med `.catch('ask-user')`: saknas fältet, är det
// null, eller bär det ett ogiltigt värde ('approve' t.ex.) — resultatet blir
// 'ask-user' UTAN att hela utlåtandet fälls. Detta är medvetet asymmetriskt:
// ett fynd utan tydlig auto-fix/ask-user-klassning ska aldrig tolkas som
// auto-fix (den farliga riktningen) och ska aldrig heller stoppa hela
// granskningen (en trasig klassning på ETT fynd ska inte dölja de andra
// fynden). Alla ANDRA fält (severity, risk.niva, m.fl.) fäller HELA
// utlåtandet vid ett fel — de har ingen säker default att falla tillbaka på.
// Tvåsidigt bevis: scripts/test-validera-review-utlatande.mjs.
//
// ═══ POLICY-FÄLTEN (TASK-173.2) ═══
// `policySha` + `policyRegler` bokför vilka path-scopade granskningsregler som
// injicerades och ur VILKEN main-commit de lästes (ADR-105 beslut 7). Båda bär
// `.default()`, vilket gör utökningen ICKE-BRYTANDE: ett utlåtande skrivet mot
// 173.1:s form validerar oförändrat och får `null` respektive `[]` — semantiskt
// korrekt för "inga regler injicerades". Därför står SCHEMA_VERSION kvar på
// 1.0; en bump hade tvingat nedströms-skivorna (173.3–173.6) att hantera två
// former utan att någon konsument av den andra formen finns.
// Fältens VÄRDEN fylls ur `npm run review:policy -- --pr <nr> --json`, aldrig
// för hand — skriptet är det enda som läser den trusted källan.
//
// ═══ STRUKTURELLA INVARIANTER (superRefine) ═══
// Fem regler som inte går att uttrycka som ren fält-typning:
//   1. `intentKalla: 'pr-text'` (PR utan kort, ADR-105 beslut 7 / AC #6) MÅSTE
//      bära `intentKonfidens: 'lag'` — en review-agent får aldrig flagga hög
//      konfidens på en PR-text-härledd intent.
//   2. `kortId: null` → `acProvning` måste vara tom (inget kort, ingen AC att
//      pröva som antagande, ADR-086).
//   3. `kortId` satt → `intentKalla` måste vara `'kort'` (ett kort-ID utan att
//      deklarera kortet som intent-källa är en inkonsekvent utsaga).
//   4. Ifyllda `policyRegler` → `policySha` måste vara satt (TASK-173.2 AC #1):
//      regler utan commit-pinning går inte att verifiera mot main i efterhand.
//   5. `policyRegler[].id` måste vara unika — en regel bokförs EN gång, med
//      sitt fulla scope, aldrig uppdelad på flera poster.
// Dessa fäller HELA utlåtandet (`ctx.addIssue`) — de är inte fail-closed-bara
// som `action`, eftersom det inte finns någon säker default för en
// motsägelsefull intent-deklaration.
//
// ═══ additionalProperties: false (z.strictObject) ═══
// Ett okänt/felstavat fält (t.ex. `sevirity`) FÄLLER i stället för att tyst
// strippas — en tyst strip hade gjort ett stavfel i granskarens output
// osynligt tills en nedströms-konsument råkade sakna precis det fältet.

import { z } from 'zod';

/**
 * Schemats egen version. Bumpas vid varje BRYTANDE formändring så
 * nedströms-konsumenter (173.4 CI-backstoppen, 173.6 instrumenteringen) kan
 * skilja "gammalt utlåtande, okänt schema" från "malformat utlåtande".
 */
export const SCHEMA_VERSION = '1.0';

/** Ett prövat acceptanskriterium — ADR-086: kortets AC är en HYPOTES som
 * prövas, inte en sanning som antas (AC #5). */
const AcProvning = z.strictObject({
  nummer: z.number().int().positive(),
  text: z.string().min(1),
  bedomning: z.enum(['haller', 'felstalld']),
  motivering: z.string().min(1),
});

/** Ett bevis-påstående. Commit-pinning som lag (ADR-105 beslut 6): varje
 * påstående bär ett run-ID eller en SHA, aldrig bara prosa. */
const Bevis = z.strictObject({
  kommando: z.string().min(1),
  utdrag: z.string(),
  exitkod: z.number().int().nullable(),
  runIdEllerSha: z.string().min(1),
});

const Plats = z.strictObject({
  fil: z.string().min(1),
  rad: z.number().int().positive().nullable(),
});

/** Ett enskilt granskningsfynd. `action` är fail-closed — se filhuvudet. */
const Fynd = z.strictObject({
  beskrivning: z.string().min(1),
  severity: z.enum(['error', 'warning', 'info']),
  action: z.enum(['auto-fix', 'ask-user']).catch('ask-user'),
  plats: Plats.nullable(),
  bevis: z.array(Bevis),
});

/** Risknivån styr ORKESTRERAR-regeln (AC #4, dokumenterad i CLAUDE.md
 * § Landning): `hog` blockerar armering till Marcus explicita granskning.
 * `motivering` är avsiktligt kort (soft cap) — "enmenings-motivering" per
 * ADR-105 beslut 5, inte en fri-text-analys. */
const Risk = z.strictObject({
  niva: z.enum(['lag', 'medel', 'hog']),
  motivering: z.string().min(1).max(400),
});

/** En path-scopad granskningsregel som FAKTISKT injicerades i granskningen
 * (TASK-173.2, ADR-105 beslut 7). Formen speglar `matchaRegler()`s utdata i
 * scripts/lib/review-policy.mjs — den fylls i ur `npm run review:policy`, inte
 * för hand.
 *
 * `scope.matchadeFiler` har `.min(1)`: en regel utan matchande fil får ALDRIG
 * stå i ett utlåtande. Det är AC #2 uttryckt som en strukturell invariant i
 * stället för som en konvention — utan den kunde en granskare bokföra en regel
 * som repo-bred, vilket är precis vad scope-etiketten finns för att förhindra. */
const PolicyRegelReferens = z.strictObject({
  id: z.string().min(1),
  scope: z.strictObject({
    monster: z.array(z.string().min(1)).min(1),
    matchadeFiler: z.array(z.string().min(1)).min(1),
  }),
  kalla: z.string().min(1),
});

export const UtlatandeSchema = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION),
    /** `null` när PR:en saknar kort-ID (AC #6). */
    kortId: z.string().min(1).nullable(),
    prNummer: z.number().int().positive(),
    /** Commit-pinning: den SHA som faktiskt granskades (ADR-105 beslut 6). */
    granskadSha: z.string().min(7),
    /** Rundnumret i rundtaks-loopen (173.5) — loggas från dag ett (ADR-105
     * § Konsekvenser: "findings-per-runda loggas från första skarpa
     * körningen"), även innan 173.5 bygger själva takets logik. */
    runda: z.number().int().positive(),
    intentKalla: z.enum(['kort', 'pr-text']),
    intentKonfidens: z.enum(['hog', 'lag']),
    acProvning: z.array(AcProvning),
    fynd: z.array(Fynd),
    risk: Risk,
    /** Den commit `.review-policy.json` lästes ur — ALLTID en main-SHA
     * (TASK-173.2 AC #1). `null` = inga regler injicerades. Commit-pinning
     * som lag (ADR-105 beslut 6): utan den går det inte att i efterhand
     * verifiera VILKEN regelmängd granskningen faktiskt vilade på. */
    policySha: z.string().min(7).nullable().default(null),
    /** De path-scopade regler som injicerades, med sitt scope (TASK-173.2
     * AC #2). Default `[]` — semantiskt korrekt för "inga regler matchade",
     * och gör utökningen ICKE-BRYTANDE mot 173.1:s form, vilket är varför
     * SCHEMA_VERSION står kvar på 1.0: ett utlåtande skrivet före denna
     * skiva validerar oförändrat. */
    policyRegler: z.array(PolicyRegelReferens).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.intentKalla === 'pr-text' && data.intentKonfidens !== 'lag') {
      ctx.addIssue({
        code: 'custom',
        path: ['intentKonfidens'],
        message:
          "PR utan kort (intentKalla='pr-text') måste flagga intentKonfidens='lag' " +
          '(ADR-105 beslut 7, AC #6) — hög konfidens på en PR-text-härledd intent är inte tillåtet.',
      });
    }
    if (data.kortId === null && data.acProvning.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['acProvning'],
        message: 'Utan kortId finns inget kort vars AC kan prövas — acProvning måste vara tom.',
      });
    }
    if (data.kortId !== null && data.intentKalla !== 'kort') {
      ctx.addIssue({
        code: 'custom',
        path: ['intentKalla'],
        message: "Ett satt kortId kräver intentKalla='kort'.",
      });
    }
    if (data.policyRegler.length > 0 && data.policySha === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['policySha'],
        message:
          'Injicerade policyRegler kräver en policySha — utan commit-pinning går det inte att ' +
          'verifiera att reglerna lästes ur main (TASK-173.2 AC #1, ADR-105 beslut 6).',
      });
    }
    const seddaRegelIdn = new Set();
    for (const [i, regel] of data.policyRegler.entries()) {
      if (seddaRegelIdn.has(regel.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['policyRegler', i, 'id'],
          message: `Regel '${regel.id}' står två gånger — varje injicerad regel bokförs en gång, med sitt fulla scope.`,
        });
      }
      seddaRegelIdn.add(regel.id);
    }
  });

/**
 * Validerar rå (redan JSON.parse:ad) input mot utlåtande-schemat.
 *
 * @param {unknown} raw
 * @returns {{ ok: true, data: z.infer<typeof UtlatandeSchema>, errors: [] } | { ok: false, data: null, errors: string[] }}
 */
export function valideraUtlatande(raw) {
  const result = UtlatandeSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      data: null,
      errors: result.error.issues.map(
        (issue) => `${issue.path.join('.') || '(rot)'}: ${issue.message}`,
      ),
    };
  }
  return { ok: true, data: result.data, errors: [] };
}

/** Genererar den portabla JSON Schema-representationen (Draft 2020-12) ur
 * samma zod-källa. Konsumeras av scripts/generera-review-schema.mjs. */
export function genereraJsonSchema() {
  return z.toJSONSchema(UtlatandeSchema);
}
