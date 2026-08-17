import { obekraftadeAnmalningar } from '@/components/hem/hem-derivations';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import type { SvepEventGrupp } from './types';

/**
 * [TASK-241.2 AC #2] Bekräftelsesvepets urval, grupperat per event — ur
 * SAMMA urvalskälla som Morgonkollens räknare ("N nya anmälningar att
 * bekräfta"): `obekraftadeAnmalningar` (`hem-derivations.ts`, TASK-243.1).
 *
 * INGEN EGEN FILTRERING HÄR. En avvikande urvalsregel i sändytan hade gjort
 * adresslistan och Morgonkollens räknare inkonsekventa — exakt det AC #2
 * förbjuder ("samma urvalskälla"). Grupperingen sker EFTER, aldrig i
 * stället för, `obekraftadeAnmalningar`s eget filter.
 *
 * GRUPP-ORDNINGEN är FÖRSTA-SEDD: `obekraftadeAnmalningar` sorterar sina
 * rader senast-inskickad-först, och den ordningen ärvs rakt av när grupper
 * byggs upp — eventet med den senast inskickade obekräftade anmälan hamnar
 * alltså överst. Inom varje grupp bevaras samma radordning.
 *
 * KÄND, DOKUMENTERAD GRÄNS (bokförd öppet, inte tyst): en `Registration`
 * utan `eventId`, eller vars `eventId` inte matchar något event i
 * `eventsMap` (referentiell integritet i basen, inte ett UX-designval),
 * kan inte grupperas per event och HOPPAS ÖVER — sådana rader syns alltså i
 * Morgonkollens totalräkning men saknas i sändytans adresslista. Detta är
 * en pre-existing data-integritetsfråga (en `Registration` ska alltid peka
 * på ett giltigt event), inte ett nytt hål den här skivan öppnar, och
 * omfånget för denna skiva är sändytans FORM — inte en Airtable-
 * datastädning. Se slutrapporten för TASK-241.2.
 */
export function bekraftelsesvepUrval(
  regs: Registration[] | undefined,
  eventsMap: Map<string, Event>,
): SvepEventGrupp[] {
  const { rows } = obekraftadeAnmalningar(regs, eventsMap);
  const grupper = new Map<string, SvepEventGrupp>();
  for (const { reg } of rows) {
    if (!reg.eventId) continue;
    let grupp = grupper.get(reg.eventId);
    if (!grupp) {
      const event = eventsMap.get(reg.eventId);
      if (!event) continue;
      grupp = { event, mottagare: [] };
      grupper.set(reg.eventId, grupp);
    }
    grupp.mottagare.push(reg);
  }
  return [...grupper.values()];
}

/** Totalräkning över samtliga grupper — sändytans "till N personer i M
    event"-mening (samma tal som `SvepOverlay`s sammanfattning). */
export function totalMottagare(eventGrupper: SvepEventGrupp[]): number {
  return eventGrupper.reduce((sum, g) => sum + g.mottagare.length, 0);
}
