export interface Person {
  id: string;
  namn: string | null;
  fornamn: string | null;
  efternamn: string | null;
  email: string | null;
  telefon: string | null;
  ort: string[];
  manuellFlagga: string | null;
  aiFlagga: string | null;
  anteckningar: string | null;
  antalAnmalningar: number;
  antalDeltaganden: number;
  erfarenhetsniva: string | null;
  erfarenhetsbadge: string | null;
  senasteInteraktion: string | null;
  senasteInteraktionDatum: string | null;
  dagarSedanSenaste: number | null;
  harAktivAnmalan: string | null;
  ejGodkandMail: boolean;
  radSkapad: string | null;
  anmalningIds: string[];
  deltagandeIds: string[];
}
