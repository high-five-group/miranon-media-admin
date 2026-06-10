import type { EventStatusValue } from '../types/Status';

export interface Event {
  id: string;
  eventlabel: string | null;
  eventNamn: string | null;
  typ: string | null;
  ort: string | null;
  startdatum: string | null;
  slutdatum: string | null;
  tidKvarTillEvent: string | null;
  maxPlatser: number | null;
  antalAnmalda: number;
  platserKvar: number | null;
  anmaldBelaggning: number | null;
  bekraftadBelaggning: number | null;
  antalNyaAnmalningar: number;
  antalAnmalningsavgifter: number;
  antalSlutbetalningar: number;
  antalSlutbetalningFelande: number;
  status: EventStatusValue | null;
}
