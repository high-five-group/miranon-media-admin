import { Bell, Inbox, Mail, UserPlus } from 'lucide-react';
import type { Registration } from '@/domain/models/Registration';
import { RegistrationSource } from '@/domain/types/Status';
import type { TidslinjeIkon } from './Tidslinje';

/**
 * [TASK-436] EN anmälans händelser, härledda ur basens tidsstämplar — den
 * enda härledningen, delad av anmälans detaljvy ("Händelser") och
 * eventdetaljens "Öppna detaljer" (Händelseloggen per person).
 *
 * VARFÖR EN MODUL: fram till 2026-09-08 bar de två ytorna varsin kopia av
 * samma härledning med OLIKA ordval för samma händelse ("Bekräftelse
 * skickad" mot "Bekräftelsemail skickat") och olika ordning (Lottas
 * utskicksordning mot senast överst). Samma sak ska heta samma sak var
 * Lotta än står (Marcus dom 2026-09-01, `AnmalansBetalningar.tsx` §
 * ORDVALET), och ADR-126 lägger en form som bärs av två ytor i biblioteket.
 * Ordvalen här är detaljvyns — de var de mer precisa av de två.
 *
 * KONTRAKTET: bara tidsstämplar som FINNS blir noder (RÅ-disciplinen:
 * ingenting fabriceras, inte ens en ordning). Senast överst — Shopify/
 * Stripe-formen `Tidslinje` är byggd för. Tiden lämnas som ISO: callern
 * formaterar, eftersom detaljvyn vill ha år och klockslag medan eventdetaljen
 * står i eventets egen datumkontext och klarar sig utan år.
 *
 * `HandelseUnderlag` är list-modellen `Registration` plus de fält som bara
 * detaljvyn bär, alla valfria — så räcker eventdetaljens listrader utan att
 * någon behöver hämta detaljformen för sjutton personer.
 */

export interface AnmalanHandelse {
  /** Stabil list-nyckel. */
  id: string;
  /** ISO-tidpunkt — callern äger formatet. */
  nar: string;
  text: string;
  ikon: TidslinjeIkon;
}

export type HandelseUnderlag = Registration & {
  franFormular?: string | null;
  medfoljandeTillNamn?: string | null;
  plusOneForfraganSkickad?: string | null;
};

/** Hur anmälan kom in — ordvalet ur anmälans detaljvy (byggkrav 11). */
export function inkomText(reg: HandelseUnderlag): string {
  if (reg.kalla === RegistrationSource.MEDFOLJANDE) {
    return `Anmälan skapad som medföljande (+1)${
      reg.medfoljandeTillNamn ? ` till ${reg.medfoljandeTillNamn}` : ''
    }`;
  }
  if (reg.kalla === RegistrationSource.MANUELL) return 'Anmälan tillagd manuellt';
  if (reg.kalla === RegistrationSource.VANTELISTA) return 'Anmälan skapad från väntelistan';
  return reg.franFormular ? `Anmälan inkom via ${reg.franFormular}` : 'Anmälan inkom';
}

function giltigTid(iso: string | null | undefined): iso is string {
  return iso != null && !Number.isNaN(Date.parse(iso));
}

/** Senast överst. Rader utan tidsstämpel finns inte i loggen. */
export function harledHandelser(reg: HandelseUnderlag): AnmalanHandelse[] {
  const kandidater: { nar: string | null | undefined; text: string; ikon: TidslinjeIkon }[] = [
    {
      nar: reg.inskickad,
      text: inkomText(reg),
      ikon: reg.kalla === RegistrationSource.MEDFOLJANDE ? UserPlus : Inbox,
    },
    { nar: reg.bekraftelseSkickad, text: 'Bekräftelsemail skickat', ikon: Mail },
    { nar: reg.plusOneForfraganSkickad, text: 'Plus-one-förfrågan skickad', ikon: Mail },
    { nar: reg.deltagarinfoSkickad, text: 'Deltagarinfo skickad', ikon: Mail },
    { nar: reg.betalningspaminnelseSkickad, text: 'Betalningspåminnelse skickad', ikon: Bell },
    {
      nar: reg.paminnelseAnmalningsavgiftSkickad,
      text: 'Påminnelse om anmälningsavgift skickad',
      ikon: Bell,
    },
    {
      nar: reg.paminnelseSlutbetalningSkickad,
      text: 'Påminnelse om slutbetalning skickad',
      ikon: Bell,
    },
  ];
  return kandidater
    .flatMap((k) => (giltigTid(k.nar) ? [{ nar: k.nar, text: k.text, ikon: k.ikon }] : []))
    .sort((a, b) => Date.parse(b.nar) - Date.parse(a.nar))
    .map((k) => ({ id: `${k.nar}-${k.text}`, nar: k.nar, text: k.text, ikon: k.ikon }));
}
