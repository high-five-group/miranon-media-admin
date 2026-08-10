export interface Person {
  id: string;
  namn: string | null;
  fornamn: string | null;
  efternamn: string | null;
  email: string | null;
  telefon: string | null;
  /**
   * ROLLUP över personens ANMÄLNINGAR av `Anmälningar.Ort` (en post per
   * anmälan, inklusive tomma) — INTE personens hemort. Mätt i prod-basen
   * 2026-08-10: 27 personer har två eller fler olika orter (t.ex. Roger
   * Mukka: Falköping, Rönninge, Varberg). Fältet är fortsatt legitimt för
   * SÖKNING (`get-persons` SEARCH_FIELDS) och stannar av det skälet — men
   * visas MEDVETET INTE i person-kontext (personlistan/persondetaljen), där
   * det skulle läsas som "var personen bor". Rör aldrig detta fält utan att
   * först ha läst varför (Marcus 2026-08-10, ordagrant): "vi frågar inte
   * efter ort i anmälningsformuläret... Ja då måste ju ort bort helt och
   * hållet i de sammanhang där det ser ut att visa var personen bor."
   */
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
