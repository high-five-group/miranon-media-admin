import * as Sentry from '@sentry/react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/data/config/supabase-client';

/**
 * Passkey-abstraktionen (TASK-127.8, ADR-093 beslut 2 + AC #3).
 *
 * ISOLERAR BETA-RISKEN TILL DENNA FIL: Supabase Auth Passkeys gick i BETA
 * maj 2026 och är uttryckligen markerad experimentell — "kan ändras utan
 * förvarning" (plattformens eget changelog, citerat i ADR-093). Varje
 * anrop mot `supabase.auth.passkey.*`/`registerPasskey`/`signInWithPasskey`
 * går via funktionerna här; ingen annan fil i appen importerar dem direkt.
 * En framtida API-ändring träffar därför EN fil, inte hela
 * inloggnings-/erbjudandeflödet (AC #3).
 *
 * VERIFIERAT LÄGE PÅ STAGING (2026-08-05, denna byggsession — källmärkt
 * per ADR-086, inte antaget): `GET /v1/projects/<staging-ref>/config/auth`
 * (Supabase Management API) svarar `passkey_enabled: false`. Ett direkt,
 * oautentiserat probe-anrop mot
 * `POST {VITE_SUPABASE_URL}/auth/v1/passkeys/authentication/options`
 * bekräftar samma sak på HTTP-nivå:
 * `404 {"code":404,"error_code":"passkey_disabled","msg":"Passkeys are disabled"}`.
 * Plattformens Passkeys-yta är dessutom märkt BETA i dashboarden
 * (skärmdump 2026-08-05, uppdragets premiss). Funktionen är alltså
 * AVSTÄNGD på servern i skrivande stund — varje funktion nedan är byggd
 * för att degradera snyggt till "otillgänglig" i det läget (AC #4), inte
 * för att anta att den är påslagen. Den dag `passkey_enabled` blir `true`
 * på staging fungerar samma kod utan ändring — probet (`probaPasskeyTillganglighet`)
 * läser serverns FAKTISKA svar varje gång, inte ett cachat antagande.
 */

/**
 * user_metadata-nyckeln som minns att kontot redan sett erbjudandet
 * (avböjt ELLER registrerat en passkey). Self-service via
 * `updateUser({ data })` — kräver ingen admin-rättighet, och värdet följer
 * kontot mellan enheter (till skillnad från en lokal localStorage-flagga,
 * som hade tvingat användaren se erbjudandet igen på varje ny enhet/
 * webbläsare — precis den nagg-effekt AC #1 uttryckligen utesluter).
 *
 * MEDVETET ALDRIG SATT när passkey är otillgängligt (webbläsarstöd saknas
 * ELLER servern svarar `passkey_disabled`) — se `login.tsx`s
 * anropsplats-kommentar. Skulle flaggan sättas permanent i det läget hade
 * ett konto som loggade in EN gång innan funktionen aktiverades aldrig sett
 * erbjudandet igen, ens efter att Supabase slår på `passkey_enabled`.
 */
const ERBJUDANDE_SETT_NYCKEL = 'passkey_erbjudande_sett';

/**
 * Synkron klient-capability-check — samma kontrollpunkter som SDK:ns egen
 * interna `browserSupportsWebAuthn()`
 * (`@supabase/auth-js/src/lib/webauthn.ts`), som inte är exporterad ur
 * paketets publika yta och därför dupliceras här. Inget nätverksanrop.
 */
export function webblasarenStodjerPasskey(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    window.PublicKeyCredential &&
    typeof navigator !== 'undefined' &&
    'credentials' in navigator &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  );
}

/** Läser den kontobundna "redan sedd"-flaggan ur en session. Ren
 * synkron avläsning — inget nätverksanrop, ingen mutation. */
export function harSettErbjudandeTidigare(session: Session | null): boolean {
  return session?.user?.user_metadata?.[ERBJUDANDE_SETT_NYCKEL] === true;
}

export interface PasskeyProbe {
  /** Webbläsaren har WebAuthn-API:erna (klient-check, inget nätverksanrop). */
  webblasarstod: boolean;
  /**
   * Servern besvarade en autentiserad probe UTAN "avstängd"-fel. `false` om
   * `webblasarstod` redan är `false` (probet görs då aldrig — se koden) ELLER
   * om servern svarade med vilket fel som helst (avstängt, nätverksfel,
   * sessionsfel). Samma "vet inte exakt varför, bara att det inte fungerar
   * just nu"-hållning som resten av auth-ytans enumeration-neutrala fel
   * (ADR-093 §6.3.8) — ingen konsument ska gissa sig till VARFÖR, bara agera
   * på ATT.
   */
  servertillgangligt: boolean;
  /** Kontot har redan minst en registrerad passkey. */
  harRedanPasskey: boolean;
}

/**
 * Probar tillgänglighet FÖR EN INLOGGAD ANVÄNDARE via `passkey.list()` — ett
 * rent GET-anrop mot `/passkeys`, ingen WebAuthn-ceremoni triggas (ingen
 * `navigator.credentials`-prompt), så probet kräver ingen användargest och
 * kan köras direkt vid sidladdning. Kräver en aktiv session (samma krav som
 * `list()` självt har server-side) — anropa aldrig detta oautentiserat.
 *
 * Görs ALDRIG något nätverksanrop om webbläsaren saknar WebAuthn-stöd
 * (`webblasarstod: false`) — degraderingen är då redan klar utan att fråga
 * servern i onödan.
 */
export async function probaPasskeyTillganglighet(): Promise<PasskeyProbe> {
  const webblasarstod = webblasarenStodjerPasskey();
  if (!webblasarstod) {
    return { webblasarstod: false, servertillgangligt: false, harRedanPasskey: false };
  }
  try {
    const { data, error } = await supabase.auth.passkey.list();
    if (error || !data) {
      return { webblasarstod: true, servertillgangligt: false, harRedanPasskey: false };
    }
    return { webblasarstod: true, servertillgangligt: true, harRedanPasskey: data.length > 0 };
  } catch (error) {
    // Försvar i djupet: `assertPasskeyExperimentalEnabled` kastar synkront
    // om klient-flaggan (supabase-client.ts) någonsin skulle saknas — ska
    // inte kunna hända, men ett kastat fel här ska degradera precis som ett
    // returnerat, aldrig krascha erbjudande-ytan.
    Sentry.captureException(error, { tags: { auth: 'passkey-proba' } });
    return { webblasarstod: true, servertillgangligt: false, harRedanPasskey: false };
  }
}

export type PasskeyAtgardUtfall =
  | { ok: true }
  | {
      ok: false;
      /**
       * `true` = användaren själv avbröt/stängde plattformens WebAuthn-
       * prompt (eller den tog time-out) — ett NORMALT, ovärderat utfall,
       * inte ett fel. UI:t ska INTE visa felmeddelande-ton här, bara
       * återgå tyst till erbjudandet (samma "avböjande är förstklassigt"
       * -princip som kortets ram uttrycker för det uttryckliga
       * "Inte nu"-valet).
       */
      anvandarenAvbrot: boolean;
      /** Tom sträng när `anvandarenAvbrot` är true — inget att visa. */
      meddelande: string;
    };

/** SDK:ns `NotAllowedError`-passthrough-kod (webauthn.errors.ts): täcker
 * både "användaren avbröt", "time-out" och "ingen matchande passkey
 * hittades" — plattformarna överlastar samma DOMException, och SDK:n
 * medvetet skiljer INTE dem åt ("we don't want to overwrite potentially
 * useful error messages"). Vi följer samma linje: alla tre är "inget att
 * larma om", inte ett fel att förklara. */
const ANVANDARAVBROTT_KOD = 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY';

function tolkaPasskeyFel(error: unknown): PasskeyAtgardUtfall {
  const kod =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: unknown }).code
      : undefined;
  if (kod === ANVANDARAVBROTT_KOD) {
    return { ok: false, anvandarenAvbrot: true, meddelande: '' };
  }
  Sentry.captureException(error, { tags: { auth: 'passkey-atgard' } });
  return {
    ok: false,
    anvandarenAvbrot: false,
    // Medvetet GENERISKT (samma enumeration-neutrala hållning som
    // login.tsx/valkommen.tsx): avslöjar aldrig OM orsaken var "servern har
    // stängt av passkey", "nätverksfel" eller "ingen matchande
    // autentiserare" — bara att lösenordet fortsatt fungerar.
    meddelande: 'Det gick inte att använda passkey just nu. Lösenordet fungerar som vanligt.',
  };
}

/** Registrerar en passkey för den AKTUELLT INLOGGADE användaren. Triggar
 * webbläsarens native WebAuthn-prompt (`navigator.credentials.create()`)
 * — kräver en färsk användargest (knapptryckning) för att fungera i de
 * flesta webbläsare. */
export async function registreraPasskey(): Promise<PasskeyAtgardUtfall> {
  try {
    const { error } = await supabase.auth.registerPasskey();
    if (error) return tolkaPasskeyFel(error);
    return { ok: true };
  } catch (error) {
    return tolkaPasskeyFel(error);
  }
}

/** Loggar in med en tidigare registrerad passkey. Triggar webbläsarens
 * native WebAuthn-prompt (`navigator.credentials.get()`). Lösenordet
 * kvarstår alltid som fallback (ADR-093 beslut 2) — denna funktion
 * kompletterar `useAuth().login`, ersätter den aldrig. */
export async function loggaInMedPasskey(): Promise<PasskeyAtgardUtfall> {
  try {
    const { error } = await supabase.auth.signInWithPasskey();
    if (error) return tolkaPasskeyFel(error);
    return { ok: true };
  } catch (error) {
    return tolkaPasskeyFel(error);
  }
}

/**
 * Markerar kontot som "har sett erbjudandet" — kallas vid uttryckligt
 * avböjande ELLER lyckad registrering, ALDRIG vid otillgänglighet (se
 * modulens topp-kommentar). Fail-open: en misslyckad markering blockerar
 * ingenting, den läcker bara en extra visning av erbjudandet nästa
 * inloggning — ofarligt, observability i stället för att kasta.
 */
export async function markeraErbjudandeSett(): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { [ERBJUDANDE_SETT_NYCKEL]: true },
  });
  if (error) {
    Sentry.captureException(error, { tags: { auth: 'passkey-markera-sett' } });
  }
}
