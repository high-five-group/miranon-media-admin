/**
 * [TASK-346.7] Dagens datum som ISO - det ENDA stället i betalningsdomänen
 * som läser klockan.
 *
 * Härledningarna (`inkorg-harledningar.ts`, `panel-harledningar.ts`) tar
 * `idag` som argument och läser aldrig `new Date()` själva, av det uttalade
 * skälet att "en härledning som läser klockan går inte att testa två dagar i
 * rad". Den regeln kräver att någon ändå läser klockan EN gång, och att den
 * platsen är lätt att peka på.
 *
 * TASK-346.6 hade funktionen privat i `BetalningsInkorg.tsx`. TASK-346.7 ger
 * formuläret fyra ingångar till, och en kopia per yta hade varit fyra
 * ställen där ett tidszons-misstag kan uppstå oberoende av de andra.
 *
 * LOKAL TID, INTE UTC. `toISOString()` hade gett fel dag för Lotta varje
 * kväll efter kl 22 (svensk sommartid), eftersom hon då redan passerat
 * midnatt i UTC. Datumet som förvalt värde i formuläret ska vara den dag hon
 * själv ser på kalendern.
 */
export function idagIso(): string {
  const nu = new Date();
  const manad = `${nu.getMonth() + 1}`.padStart(2, '0');
  const dag = `${nu.getDate()}`.padStart(2, '0');
  return `${nu.getFullYear()}-${manad}-${dag}`;
}
