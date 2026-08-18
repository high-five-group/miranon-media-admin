import {
  eventinfoMottagare,
  type ForfallenRad,
  forfallenGrupp,
  forfallnaBetalningar,
  obekraftadeAnmalningar,
} from '@/components/hem/hem-derivations';
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

/**
 * [TASK-241.4 AC #1] Påminnelsesvepets urvalskälla — SAMMA urvalskälla som
 * Morgonkollens "Att påminna"-sektion (`ForfallnaBetalningar.tsx`):
 * `forfallnaBetalningar` (`hem-derivations.ts`, TASK-243.1) filtrerad genom
 * `forfallenGrupp` till en-påminnelse-modellens LÄGE 1 ("Att påminna")
 * ENDAST (S102 Del 10 beslut 7). MEKANISKT SPAMSÄKERT: en rad i läge 2
 * ("Väntar") eller läge 3 ("Dags att ringa") kan ALDRIG nå denna funktions
 * retur — det är precis den grind `forfallenGrupp !== 'att-paminna'` nedan
 * utgör, inte en efterhandskontroll.
 *
 * INGEN EGEN FILTRERING UTÖVER DETTA (samma disciplin som
 * `bekraftelsesvepUrval`): grupperingen sker EFTER, aldrig i stället för,
 * `forfallnaBetalningar`s eget urval + `forfallenGrupp`s tillståndsgräns.
 *
 * SORTERINGEN ÄRVS: `forfallnaBetalningar` sorterar mest-förfallna (äldsta
 * deadline) först — samma ordning `ForfallnaBetalningar.tsx`s "Att
 * påminna"-sektion visar, ärvd rakt av här.
 */
export function paminnelseRader(
  regs: Registration[] | undefined,
  eventsMap: Map<string, Event>,
  nuMs: number,
): ForfallenRad[] {
  const { rows } = forfallnaBetalningar(regs, eventsMap, nuMs);
  return rows.filter((rad) => forfallenGrupp(rad, nuMs) === 'att-paminna');
}

/**
 * [TASK-241.4] Påminnelsesvepets event-grupper, byggda ur `paminnelseRader`.
 *
 * DEDUP PER REGISTRERING (skiljer sig medvetet från raka rad-listan): en
 * registrering som saknar BÅDA avgifterna ger TVÅ `ForfallenRad`-rader (en
 * per avgiftstyp, `hem-derivations.ts`), men sändningen sker per
 * REGISTRERING — `dataSource.sendActionEmail` tar `registrationIds: string[]`
 * och servern (`send-action-email/index.ts` § `stampFieldsFor`) stämplar
 * REDAN båda avgiftsfälten på EN mottagare när båda är obetalda. En
 * odedupad mottagarlista hade skickat SAMMA mail två gånger till samma
 * person och skickat `registrationIds` med en dubblett — "per-rad-undantag
 * inuti svepet" är därutöver explicit UTANFÖR PRD:ns omfång (task-241 §
 * Utanför omfattningen), så sändningsgranulariteten förblir registrering,
 * inte rad.
 */
export function paminnelsesvepUrval(
  rader: ForfallenRad[],
  eventsMap: Map<string, Event>,
): SvepEventGrupp[] {
  const grupper = new Map<string, SvepEventGrupp>();
  for (const rad of rader) {
    const reg = rad.reg;
    if (!reg.eventId) continue;
    let grupp = grupper.get(reg.eventId);
    if (!grupp) {
      // `rad.eventNamn` bär redan namnet, men `SvepEventGrupp` kräver det
      // FULLA `Event`-objektet (adresslistans ort/förhandsvisningens
      // platshållare) — samma lookup-disciplin som `bekraftelsesvepUrval`.
      // Registreringar utan matchande event i `eventsMap` hoppas över, samma
      // redan bokförda gräns (se `bekraftelsesvepUrval`s docblock).
      const event = eventsMap.get(reg.eventId);
      if (!event) continue;
      grupp = { event, mottagare: [] };
      grupper.set(reg.eventId, grupp);
    }
    if (!grupp.mottagare.some((m) => m.id === reg.id)) {
      grupp.mottagare.push(reg);
    }
  }
  return [...grupper.values()];
}

/**
 * [TASK-241.8 AC #1] Eventinfo-svepets urval — det ENDA av de tre som är
 * ETT event, inte cross-event: bevakningsraden pekar redan på exakt vilket
 * event Lotta klickade, så det finns inget att gruppera. Mottagarna är
 * `eventinfoMottagare` (`hem-derivations.ts`) — SAMMA predikat
 * bevakningsradens räknare/läge bygger på, aldrig härlett en andra gång.
 * Tom array (inte en engrupps-array med noll mottagare) när urvalet är
 * tomt — `SvepOverlay`s `kanSkicka`/`totalMottagare` läser grupp-längden,
 * samma tomt-kontrakt som `bekraftelsesvepUrval`/`paminnelsesvepUrval`.
 */
export function eventinfoSvepUrval(
  event: Event,
  regs: Registration[] | undefined,
): SvepEventGrupp[] {
  const mottagare = eventinfoMottagare(regs, event.id);
  return mottagare.length === 0 ? [] : [{ event, mottagare }];
}

/**
 * [TASK-241.4 AC #2] Adresslistans avgiftstyp-suffix-källa (facit:
 * "camilla.ost@example.se · Anmälningsavgift", `facit-svep-paminnelse-
 * granska-adresslista-desktop.png`) — EN karta registrering-ID → den
 * kommaseparerade texten av samtliga avgiftstyper i läge 1 för just den
 * registreringen (normalt en, men BÅDA om en registrering saknar båda
 * avgifterna samtidigt, se `paminnelsesvepUrval`s dedup-motiv).
 */
export function paminnelseAvgiftstyperByRegId(rader: ForfallenRad[]): Map<string, string> {
  const typer = new Map<string, string[]>();
  for (const rad of rader) {
    const lista = typer.get(rad.reg.id) ?? [];
    if (!lista.includes(rad.avgiftstyp)) lista.push(rad.avgiftstyp);
    typer.set(rad.reg.id, lista);
  }
  return new Map([...typer].map(([id, lista]) => [id, lista.join(', ')]));
}
