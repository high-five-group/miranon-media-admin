import { appendFile } from 'node:fs/promises';
import { type APIRequestContext, expect, test } from '@playwright/test';
import { getApiConfig, getValidUserJWT } from '../api/helpers';
import { KONTRAKTSFALL } from './kontraktsfall';
import {
  byggLarm,
  granskaKontrakt,
  KontraktsavvikelseError,
  type Kontraktsfall,
  type SkarptSvar,
} from './kontraktsjamforelse';

/**
 * Kontraktsvakten — nattlig fixtur-mot-verklighet (task-59.2, ADR-080 beslut 3).
 *
 * Vakten anropar de skarpa Edge Functions vars svar fixturvärlden påstår sig
 * spegla, parsar BÅDA sidor genom samma zod-schema och jämför formen. Stämmer
 * de händer ingenting synligt utöver en kvittensrad. Divergerar de fälls
 * jobbet med ett larm som namnger vilken endpoint som glidit och hur.
 *
 * ICKE-BLOCKERANDE — OCH DET ÄR EN EGENSKAP HOS PLACERINGEN, INTE HOS KODEN.
 * Projektet `kontraktsvakt` körs ENDAST av `.github/workflows/nightly.yml`.
 * Det ingår inte i `ci-suite.yml` och kan därför strukturellt inte fälla en
 * PR. Lägg det ALDRIG där: `ci-suite.yml` är delad mellan natten och
 * presubmit, så ett steg där blir blockerande samma sekund.
 *
 * MEN DET FÅR HELLER INTE FÖRSVINNA. Jobbet ligger i larm-jobbets `needs`, så
 * en divergens skapar samma tilldelade nattärende som en röd natt — samma
 * kedja som redan bevakas, ingen ny kanal ingen läser (ADR-077).
 *
 * INGEN STAGING-MUTEX. Vakten LÄSER bara (tre GET). Den kan därför köra
 * parallellt med nattens `suite`-jobb, som håller `staging-tests` och skapar
 * och raderar sentinel-rader medan den kör: de raderna ändrar antalet poster
 * i svaret men inte deras FORM, och form är allt vakten jämför. Tar man
 * mutexen i stället betalar natten dubbel serialisering utan att köpa något.
 *
 * TVÅSIDIGT BEVIS. Denna fil är den ena halvan (att vakten är tyst när
 * fixturerna stämmer). Den andra — att den FÄLLER på en medvetet felaktig
 * fixtur — bevisas av `tests/api/kontraktsvakt-jamforelse.test.ts`, som är
 * ren och kör i varje PR utan staging. En grön svit kan aldrig visa att en
 * vakt fäller; samma disciplin som hermetik-vaktens negativa self-test.
 */

/** Kvittens + ev. larm till körningens step-summary. No-op utanför GitHub. */
async function skrivStegsammanfattning(text: string): Promise<void> {
  const fil = process.env.GITHUB_STEP_SUMMARY;
  if (!fil) return;
  await appendFile(fil, `${text}\n`, 'utf-8');
}

async function hamtaSkarpt(
  request: APIRequestContext,
  baseUrl: string,
  jwt: string,
  fall: Kontraktsfall,
): Promise<SkarptSvar> {
  const res = await request.get(`${baseUrl}${fall.sokvag}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const ratext = await res.text();
  try {
    return { status: res.status(), kropp: JSON.parse(ratext) as unknown };
  } catch {
    return { status: res.status(), kropp: null, ratext };
  }
}

test.describe('kontraktsvakten — fixturvärlden mot skarp staging', () => {
  for (const fall of KONTRAKTSFALL) {
    test(`${fall.endpoint} — fixturen speglar fortfarande staging`, async ({ request }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);

      const skarpt = await hamtaSkarpt(request, config.baseUrl, jwt, fall);
      const avvikelser = granskaKontrakt(fall, skarpt);

      if (avvikelser.length > 0) {
        const larm = byggLarm(fall, skarpt, avvikelser);
        await skrivStegsammanfattning(`### 🚨 ${fall.endpoint}\n\n\`\`\`text\n${larm}\n\`\`\``);
        // Fällningen kommer från VAKTEN, inte från en assertion — texten ÄR
        // leveransen och får aldrig kortas av en diff-formaterare.
        throw new KontraktsavvikelseError(larm);
      }

      await skrivStegsammanfattning(
        `### ✅ ${fall.endpoint}\n\nFixturen speglar staging. Inga avvikelser.`,
      );

      // Kvittens också i grönt läge: en vakt som jämförde noll poster ser
      // annars exakt likadan ut som en som jämförde allt (L322-klassen —
      // signalen ska vara success ELLER failure, aldrig frånvaro).
      expect(avvikelser, `${fall.endpoint} ska vara utan avvikelser`).toEqual([]);
    });
  }
});
