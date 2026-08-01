/**
 * globalSetup — nollställer hermetik-rapporten före varje körning (S91 steg 1).
 *
 * VARFÖR DEN BEHÖVS: rapporten skrivs med `appendFileSync` från flera
 * Playwright-workers parallellt, vilket är rätt form för samtidiga skrivare men
 * betyder att filen ALDRIG rensar sig själv. Utan detta steg ackumulerar den
 * över körningar och varje ny mätning förorenas tyst av den föregående —
 * verifierat: en full körning gav 865 rader, och ett enda efterföljande
 * isolerat test tog filen till 871 utan att något såg fel ut.
 *
 * Nollställningen hör hemma vid START, inte i teardown: en körning som kraschar
 * innan teardown hinner köra skulle annars lämna kvar data som nästa mätning
 * räknade in i sina siffror. Att rensa först gör varje mätning självständig
 * oavsett hur den föregående slutade.
 *
 * No-op när mätläget inte är påslaget — filen rörs inte alls då.
 */

import { rmSync } from 'node:fs';
import { HERMETIK_RAPPORT_FIL } from './support/hermetik-rapport-fil';

export default function globalSetup(): void {
  if (process.env.PLAYWRIGHT_HERMETIK_RAPPORT !== '1') return;
  rmSync(HERMETIK_RAPPORT_FIL, { force: true });
}
