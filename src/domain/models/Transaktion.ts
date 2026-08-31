/**
 * [TASK-346.10 AC #1, PRD TASK-346 § Swish-import (beslut 8)] EN rad ur en
 * bankkälla, innan den blivit något i vår bokföring.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EN TYP, INGET RAMVERK
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD beslut 8, ordagrant: "Intern typ *transaktion* (datum, belopp, namn,
 * telefon, meddelande, bankreferens) som Swish-rapport, girofil och framtida
 * bank-API alla fyller - en typ, inget ramverk."
 *
 * De sex fälten nedan är alltså inte en delmängd av något större; de ÄR
 * typen. En Swish-rapport fyller alla sex, en BgMax-fil fyller alla utom
 * `telefon` (formatet saknar telefonnummer helt, verifierat mot Bankgirots
 * tekniska manual i `docs/research/swish-rapport-exportformat-2026-08-30.md`
 * § 5), och ett framtida bank-API fyller dem ur JSON i stället för ur en
 * fil. Ingen av de tre kräver en ny typ, en adapterhierarki eller ett
 * plugin-register - och att bygga något sådant nu vore en abstraktion utan
 * en enda nuvarande användare.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TRANSAKTION ÄR INTE INBETALNING - OCH SKILLNADEN ÄR HELA POÄNGEN
 * ═══════════════════════════════════════════════════════════════════════════
 * En transaktion är BANKENS påstående: en rad i en fil, utan koppling till
 * någon anmälan, utan plats i vår bokföring. En `Inbetalning`
 * (`Betalningar.schema.ts`) är VÅR bokföringspost, och den föds först när
 * Lotta bekräftat vilken anmälan raden gäller.
 *
 * Import-flödet är alltså en funktion från den ena till den andra, med Lotta
 * som den som avgör. Att låta parsern producera `Inbetalning` direkt hade
 * gjort bankens rad till en bokföringspost utan att någon sagt ja - och en
 * omatchad rad hade inte haft någonstans att ta vägen.
 *
 * ORDLISTAN bär båda begreppen sedan denna skiva; se `ORDLISTA.md`
 * § Transaktion respektive § Inbetalning.
 */
export interface Transaktion {
  /**
   * Betalningens datum, ISO `YYYY-MM-DD`. `null` när källan inte bär något
   * läsbart datum.
   *
   * Datumet är INTE valfritt av bekvämlighet: kvittot bär betalningsdatumet
   * (ADR-109 via PRD § Kvittot), så ett saknat datum är något Lotta behöver
   * se och fylla i, inte något som tyst ska bli dagens datum.
   */
  datum: string | null;

  /**
   * Kronor. Positivt för pengar in.
   *
   * Talet är redan normaliserat av parsern (`normaliseraBeloppKlient`), så
   * både `1500.00` (kommaseparerad fil) och `1500,00` (semikolonseparerad)
   * har blivit `1500` här. Vilket decimaltecken källan använde är parserns
   * problem, aldrig matchningens.
   */
  belopp: number;

  /** Avsändarens namn som banken registrerat det. Sällan exakt basens stavning. */
  namn: string | null;

  /**
   * Avsändarens telefonnummer, RÅTT som källan skrev det.
   *
   * Normaliseringen sker i matchningen (`lib/telefon.ts`), inte här. Skälet
   * är spårbarhet: står raden kvar som omatchad ska Lotta kunna se numret
   * precis som banken visade det, inte en omskriven form hon inte känner
   * igen.
   */
  telefon: string | null;

  /** Betalarens meddelande. Ofta det enda som säger vilket event det gäller. */
  meddelande: string | null;

  /**
   * Bankens egen unika referens - DUBBLETTNYCKELN (AC #3).
   *
   * Hos Handelsbanken `BETALNINGSREFERENS`, 16 siffror, satt av
   * Getswish/Riksbanken. Skrivs till `inbetalningar.bankreferens`, som bär
   * ett PARTIELLT unikt index (`inbetalningar_bankreferens_unik_idx`, unikt
   * NÄR SATT). Det indexet, inte någon klientlista, är det som gör en
   * omimport ofarlig.
   *
   * `null` när källan saknar referenskolumn. En sådan rad kan importeras -
   * men den bär då inget dubblettskydd, och det sägs rakt ut i UI.
   */
  bankreferens: string | null;
}
