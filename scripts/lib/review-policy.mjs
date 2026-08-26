// scripts/lib/review-policy.mjs — path-scopade granskningsreglers LOGIK
// (TASK-173.2, ADR-105 beslut 7).
//
// ═══ VAD DETTA ÄR ═══
// Den universella halvan av policy-ytan: parsning, validering och matchning.
// VÄRDENA — reglerna själva — bor i `.review-policy.json` och kan bytas per
// projekt utan att röra en rad här (grindvakts-konventionen,
// ~/.claude/CLAUDE.md § Instruktioner, Lesson #6 [UNIVERSAL]; samma
// separation som .eslintrc/.prettierrc/.vale.ini gör branschmässigt).
//
// Läsningen ur den trusted källan (`git show origin/main:...`) ligger INTE
// här utan i scripts/hamta-review-policy.mjs — denna modul är ren och gör
// ingen I/O, vilket är vad som gör den testbar med syntetiska fixturer.
//
// ═══ ALLA MATCHANDE REGLER ACKUMULERAS (AC #2) ═══
// En fil kan träffas av flera regler; ALLA injiceras. Detta är ett medvetet
// avsteg från GitHubs CODEOWNERS-semantik — "Order is important; the last
// matching pattern takes the most precedence" (docs.github.com, About code
// owners, verifierat 2026-08-26) — som är rätt för ÄGARSKAP (en fil har en
// ägar-uppsättning) men fel för granskningsREGLER: att en a11y-regel skulle
// tysta en Airtable-regel för att den står senare i filen vore en tyst
// försvagning av granskningen. Vi följer i stället Kubernetes/Prow
// OWNERS-modellen, som ackumulerar över katalogträdet: "determine potential
// reviewers of a file by going over all reviewers found in the OWNERS files
// for current and parent directories of the file (deduplication involved)"
// (docs.prow.k8s.io, approve-pluginet, verifierat 2026-08-26).
//
// ═══ SCOPE-ETIKETTEN ÄR REGELNS HALVA VÄRDE (AC #2) ═══
// Varje injicerad regel bär sitt `scope`: mönstren den matchade PÅ och de
// FAKTISKT matchade filerna. Utan den läses en regel som repo-bred — en
// granskare som får "verifiera fält-skrivbarhet" utan att se att regeln bara
// gällde `src/data/adapters/AirtableAdapter.ts` kan skriva ett fynd som låter
// som en repo-bred invändning. `matchadeFiler` är därför aldrig tom i
// utdatan: en regel utan träff injiceras inte alls.
//
// ═══ `dot: true` — MOTSATT VAL MOT verify-ci-parity.mjs, MED AVSIKT ═══
// CI:s diff-klassning använder `{ dot: false }` för att spegla
// tj-actions/changed-files. Här är valet det omvända, för att fail-safe
// pekar åt motsatt håll: i CI-klassningen ger en MISSAD match MER körning
// (säkert), men här ger en missad match FÄRRE regler — alltså en svagare
// granskning. Med `dot: true` kan ett mönster som `**` nå dolda sökvägar
// (`.github/`, `.env.local`) i stället för att tyst hoppa över dem.
//
// ═══ FAIL-CLOSED ═══
// `parsaPolicy` returnerar `{ ok: false }` vid varje strukturfel — okänd
// version, dubblett-id, tomt mönster-fält, okänt fält. Anroparen ska då
// AVBRYTA, aldrig fortsätta med en delmängd. Medvetet strängare än
// CODEOWNERS ("If any line in your CODEOWNERS file contains invalid syntax,
// that line will be skipped", samma källa): en tyst bortfallen regel är
// precis den ADR-083-felklass repot städat bort två gånger.

import mm from 'micromatch';
import { z } from 'zod';

/** Policyfilens format-version. Bumpas vid varje BRYTANDE formändring —
 * `z.literal` gör att en okänd version FÄLLER i stället för att tolkas som
 * dagens form. */
export const POLICY_VERSION = 1;

/** Filnamnet i repo-roten. Exporteras så CLI:t och testsviten aldrig har var
 * sin sträng-kopia som kan glida isär. */
export const POLICY_FIL = '.review-policy.json';

const Regel = z.strictObject({
  /** Stabil identifierare — citeras av granskaren och av `policyRegler` i
   * utlåtandet (scripts/lib/review-utlatande.mjs). Kebab-case krävs så ett
   * id aldrig bär mellanslag som bryter en maskinell uppslagning. */
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id måste vara kebab-case (a-z, 0-9, bindestreck)'),
  rubrik: z.string().min(1),
  /** Minst ett mönster — en regel utan mönster vore repo-bred, vilket är
   * exakt det AC #2 finns för att förhindra. */
  monster: z.array(z.string().min(1)).min(1),
  undantag: z.array(z.string().min(1)),
  provning: z.string().min(1),
  /** Pekare till den styrande ytan som ÄGER regeln, aldrig en kopia av den
   * (ADR-100 §2). Granskaren kan slå upp och pröva den per ADR-086. */
  kalla: z.string().min(1),
});

export const PolicySchema = z
  .strictObject({
    _readme: z.array(z.string()).optional(),
    version: z.literal(POLICY_VERSION),
    regler: z.array(Regel),
  })
  .superRefine((data, ctx) => {
    const sedda = new Set();
    for (const [i, regel] of data.regler.entries()) {
      if (sedda.has(regel.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['regler', i, 'id'],
          message: `dubblett-id '${regel.id}' — varje regel-id måste vara unikt (utlåtandets policyRegler slås upp på id).`,
        });
      }
      sedda.add(regel.id);
    }
  });

/**
 * Validerar en redan JSON.parse:ad policy mot schemat. Fail-closed: allt
 * som inte validerar ger `ok: false` — anroparen ska avbryta, aldrig
 * fortsätta med en delmängd av reglerna.
 *
 * @param {unknown} raw
 * @returns {{ ok: true, policy: z.infer<typeof PolicySchema>, errors: [] }
 *         | { ok: false, policy: null, errors: string[] }}
 */
export function parsaPolicy(raw) {
  const result = PolicySchema.safeParse(raw);
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
 * Matchar en lista ändrade filer mot policyns regler.
 *
 * Returnerar ENDAST regler med minst en faktiskt matchad fil (AC #2) — en
 * regel utan träff injiceras inte alls, så granskaren aldrig får en regel
 * hen kan läsa som repo-bred. Varje returnerad regel bär sitt `scope`:
 * mönstren den matchade på plus de matchade filerna, sorterade för
 * determinism (samma indata ⇒ byte-identisk utdata, så ett utlåtande kan
 * jämföras mellan rundor).
 *
 * @param {string[]} filer  Sökvägar relativa till repo-roten.
 * @param {z.infer<typeof PolicySchema>} policy
 * @returns {Array<{id: string, rubrik: string, provning: string, kalla: string,
 *   scope: {monster: string[], undantag: string[], matchadeFiler: string[]}}>}
 */
export function matchaRegler(filer, policy) {
  const traffar = [];
  for (const regel of policy.regler) {
    const matchade = mm(filer, regel.monster, { dot: true });
    const kvar =
      regel.undantag.length > 0
        ? matchade.filter((fil) => !mm.isMatch(fil, regel.undantag, { dot: true }))
        : matchade;
    if (kvar.length === 0) continue;
    traffar.push({
      id: regel.id,
      rubrik: regel.rubrik,
      provning: regel.provning,
      kalla: regel.kalla,
      scope: {
        monster: [...regel.monster],
        undantag: [...regel.undantag],
        matchadeFiler: [...new Set(kvar)].sort(),
      },
    });
  }
  return traffar;
}

/**
 * Renderar matchade regler som det block orkestreraren klistrar in i
 * review-agentens prompt. Deterministisk: samma träffar ⇒ samma text.
 *
 * Scope-etiketten skrivs ut PER REGEL och före prövningstexten — läsordningen
 * är avsiktlig: granskaren ska se hur smal regeln är innan hen läser vad den
 * kräver.
 *
 * @param {ReturnType<typeof matchaRegler>} traffar
 * @param {string} policySha  Den commit reglerna lästes ur (commit-pinning
 *   som lag, ADR-105 beslut 6).
 * @returns {string}
 */
export function renderaRegler(traffar, policySha) {
  if (traffar.length === 0) {
    return `Inga path-scopade granskningsregler matchade denna PR:s ändrade filer (policy läst ur ${policySha}).`;
  }
  const rader = [
    `Path-scopade granskningsregler (${traffar.length} st) — lästa ur ${POLICY_FIL} @ ${policySha}.`,
    '',
    'Varje regel gäller ENDAST de filer som listas under "Scope". En regel är',
    'aldrig repo-bred: skriv aldrig ett fynd som om regeln gällde hela repot.',
    '',
  ];
  for (const t of traffar) {
    rader.push(`### ${t.rubrik}  [id: ${t.id}]`);
    rader.push(`- Scope — mönster: ${t.scope.monster.join(', ')}`);
    if (t.scope.undantag.length > 0) {
      rader.push(`- Scope — undantag: ${t.scope.undantag.join(', ')}`);
    }
    rader.push(`- Scope — matchade filer i denna PR: ${t.scope.matchadeFiler.join(', ')}`);
    rader.push(`- Pröva: ${t.provning}`);
    rader.push(`- Källa: ${t.kalla}`);
    rader.push('');
  }
  return rader.join('\n').trimEnd();
}
