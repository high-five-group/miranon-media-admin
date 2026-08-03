/**
 * [PROTOTYP — KASTBAR KOD, TASK-127.2] Divergensfas, hållning B:
 * "KONTEXTRIK OCH VARM".
 *
 * Besvarar EN nedskriven fråga (kortets brief): hur ska login-vyn och
 * inbjudnings-sidan se ut?
 *
 * NUVARANDE FORM (konvergens-omgång 8) — divergensens tvåspalts-hållning
 * är RIVEN, i steg och på Marcus beslut. Kvar är EN spalt för båda
 * skärmarna:
 * - LOGIN: bara formuläret, centrerat på appens vita bakgrund.
 * - INBJUDAN: varm toning över hela ytan, ordmärke + hälsning + roll,
 *   formuläret i ett eget vitt kort (`rounded-2xl`, appens kort-standard),
 *   fotnot om länkens giltighet sist.
 *
 * Vad som revs på vägen och varför: fotot (omgång 5, "testa hur det blir
 * och rensa bort saker") · punktlistan och bekräftelse-lösenordsfältet
 * (omgång 7, research-grundat — se
 * `docs/research/aktiveringssida-branschmonster-2026-08-03.md`) ·
 * tvåspalts-skalet inklusive den delade rubriklinjen (omgång 8, obsolet i
 * en spalt). Löpande prosa gick från 95 ord till 47; branschsnittet i
 * research-passet är ~17.
 *
 * THROWAWAY-KONTRAKT: koden befordras ALDRIG till skarp implementation.
 * Vinnaren (Marcus väljer EN variant per skärm) byggs om nyskriven i
 * TASK-127.3/TASK-127.6 genom leverans-grindarna. Ingen produktions-
 * arkitektur här — bara det Marcus behöver för att bedöma i webbläsaren.
 * "Glömt lösenord?" och submit-flödena simuleras lokalt (ingen backend,
 * inget Supabase-anrop) — kommentarer markerar varje sådant ställe.
 *
 * KONTRAKT mot skarven (kortets brief — ägs av en parallell agent):
 * denna fil exporterar ENDAST `LoginVariantB` + `AcceptVariantB` och rör
 * inget annat. Båda komponenterna är fristående skärmar (egen `min-h-dvh`)
 * som kan importeras och renderas isolerat utan route eller switcher.
 *
 * ATTRAPP-DATA: realistiska svenska namn, inte lorem ipsum. "Marcus
 * Johansson" (avsändare/inbjudare) och "Lotta Gotthardsson" (mottagare) är
 * riktiga, redan dokumenterade namn i repot (BUILD-LOG.md rad ~2010/2017,
 * RESEND_FROM-avsändarnamnet). E-postadressen `lotta@miranonmedia.se` är en
 * plausibel företagsadress för demot — INTE en verklig privat inkorg.
 *
 * GÄLLANDE BESLUT DENNA PROTOTYP RESPEKTERAR:
 * - ADR-092 beslut 2: e-post på accept-sidan är FÖRIFYLLD och OREDIGERBAR
 *   (mottagaren väljer inget själv).
 * - ADR-093 beslut 1: lösenordsvägledningen är ASVS 5.0 V6-golvet uttryckt
 *   på Gunilla-språk (minst 8 tecken, 15 rekommenderat) — ingen
 *   implementation av breach-kontroll/rate limiting i denna kastbara vy.
 * - ADR-093 beslut 3: TOTP-MFA byggs inte — visas inte här heller.
 * - ORDLISTA.md § Användarinbjudan: "invite" undviks i UI-text; "inbjudan"/
 *   "bjudit in" används i stället.
 *
 * A11Y-GOLVET (11/11/11, samma golv som resten av appen):
 * - Tangentbordsnavigering: alla interaktiva element är riktiga
 *   `<button>`/`<input>`/`<label>`-par (via React Aria-primitiven eller
 *   native HTML), ingen `<div onClick>`.
 * - Fokusordning: texten ovanför formuläret bär ENDAST kompletterande
 *   information (aldrig den enda vägen till något) och innehåller inga
 *   interaktiva element — tabbordningen går rakt in i formuläret.
 * - `prefers-reduced-motion`: den enda animationen (`motion-safe:animate-
 *   mm-avsloj`, samma reveal-idiom som resten av systemet, tailwind.css)
 *   är media-gated; en spinnande loader-ikon body är `motion-safe:animate-
 *   spin` — statisk vid reduced motion, texten ("Loggar in …") bär
 *   statusen ändå.
 * - Kontrast: all text står nu på en OPAK fond — appens vita bakgrund
 *   (login) eller den varma toningen respektive det vita kortet
 *   (inbjudan). Kontrasten beror därför aldrig på en bilds ljushet, vilket
 *   var den risk foto-halvans scrim-fråga bar innan bilden revs.
 * - Endast design-tokens (`--mm-*` via Tailwind-temat eller arbiträr
 *   `(--mm-*)`-syntax) — inga hårdkodade färger.
 */
import { Clock, Loader2, Lock } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useId, useState } from 'react';
import { Button, Input, MessageBox } from '@/components/primitives';

/* ────────────────────────────────────────────────────────────────
   DELAT: kontext-spalten + formulär-spalten. Delas mellan Login och
   Accept i DENNA FIL ENDAST (ingen export — skarven känner inte till
   dem, per kontraktet ovan).
   ──────────────────────────────────────────────────────────────── */

/**
 * Ordmärket är Marcus riktiga logotyp (konvergens-omgång 9) — EN bild, ingen
 * satt text bredvid. Den tidigare formen (favicon-ikon + "Miranon Media" +
 * "ADMIN" i två textrader) är riven: logotypen bär redan ordmärket, så
 * texten var samma information en gång till.
 *
 * `alt=""` eftersom logotypen är dekorativ HÄR — sidans identitet bärs av
 * `<h1>` och av innehållet. Vore den enda avsändar-signalen skulle den
 * behövt en riktig alt-text.
 *
 * Höjden styr, bredden följer bildförhållandet (626×118,88 ≈ 5,3:1).
 * POSITIONSNEUTRALT — föräldern bestämmer var det sitter.
 */
function Ordmarke() {
  return (
    // `self-start` är INTE kosmetik: föräldern är en flex-kolumn, vars
    // default `align-items: stretch` sträckte bilden till spaltens fulla
    // bredd (mätt 576 px mot naturliga ~211) och förvrängde ordmärket.
    <img
      src="/miranon-media-ordmarke.svg"
      alt=""
      className="h-10 w-auto self-start"
      width={626}
      height={119}
    />
  );
}

/**
 * EN-spalts skal — BÅDA skärmarnas enda layout sedan konvergens-omgång 8.
 * Tvåspalts-formen (`TvaSpalter`/`KontextSpalt`/`FormSpalt`) är riven på
 * Marcus beslut: login möter någon som redan vet vad appen är, och
 * inbjudan fick plats i en spalt när punktlistan försvann.
 *
 * `varm` styr fonden: login står på appens vita bakgrund, inbjudan på den
 * varma toningen över HELA ytan med formuläret i ett eget vitt kort.
 *
 * FULL BREDD: appen reserverar en symmetrisk scrollbar-ränna på ≥640 px
 * (`scrollbar-gutter: stable both-edges !important`, `src/styles/base.css`)
 * som syntes som två vita spalter tvärs fonden. Vyn sätter därför markören
 * `data-full-bredd` på `<html>` vid mount — base.css bär undantaget och
 * motiveringen. Ett tidigare `w-[100vw]`-hack är RIVET: det gav rätt mått
 * i headless men löste inte det Marcus faktiskt såg, eftersom det kringgick
 * rännan i stället för att ta bort den.
 *
 * Markören städas vid unmount så resten av appen behåller sin symmetri.
 */
function EnSpalt({ children, varm = false }: { children: ReactNode; varm?: boolean }) {
  useEffect(() => {
    const rot = document.documentElement;
    rot.dataset.fullBredd = 'true';
    return () => {
      delete rot.dataset.fullBredd;
    };
  }, []);

  return (
    <div
      className={`flex min-h-dvh w-full items-center justify-center p-6 sm:p-8 lg:p-12 ${
        varm ? 'bg-linear-to-br from-(--mm-primary-tint) to-(--mm-accent-tint)' : 'bg-bg'
      }`}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   LOGIN
   ──────────────────────────────────────────────────────────────── */

/**
 * Login-vyn, hållning B. Ingen personalisering (vi vet inte vem som
 * loggar in ännu) — kontext-spalten bär allmän, varm vägledning om VAD
 * appen är och att inloggningen är trygg. Formuläret simulerar ett
 * misslyckat login-försök lokalt (ENUMERATION-NEUTRALT språk, ADR-093
 * §6.3.8) så Marcus kan bedöma felets visuella form — ingen riktig
 * autentisering sker i denna kastbara vy.
 */
export function LoginVariantB() {
  const [epost, setEpost] = useState('');
  const [losenord, setLosenord] = useState('');
  const [status, setStatus] = useState<'vila' | 'kontrollerar' | 'fel'>('vila');
  const [visaGlomtNotis, setVisaGlomtNotis] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Prototyp-only: ingen backend finns. Simulerar en kort väntan och visar
    // sedan ett enumeration-neutralt felmeddelande — avslöjar aldrig om
    // adressen finns eller om det var lösenordet som var fel (ADR-093).
    setStatus('kontrollerar');
    window.setTimeout(() => setStatus('fel'), 500);
  };

  return (
    // SPEGLAR INBJUDAN EXAKT (Marcus, konvergens-omgång 10): samma varma
    // fond kant i kant, samma `max-w-xl`, samma ordning ordmärke → hälsning
    // → vitt kort, samma `gap-8`-rytm och samma kort-stil. De två skärmarna
    // är samma familj och ska kännas som ett par, inte som två sidor byggda
    // vid olika tillfällen.
    <EnSpalt varm>
      <div className="flex w-full max-w-xl flex-col gap-8">
        <Ordmarke />

        <div className="flex flex-col gap-3">
          <h1 className="font-semibold text-3xl text-text">Välkommen tillbaka</h1>
          <p className="text-lg text-text-secondary">Logga in och kolla läget.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8"
          noValidate
        >
          <Input
            label="E-postadress"
            type="email"
            autoComplete="email"
            value={epost}
            onChange={setEpost}
            isRequired
            isDisabled={status === 'kontrollerar'}
            placeholder="t.ex. lotta@miranon.se"
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label="Lösenord"
              type="password"
              autoComplete="current-password"
              value={losenord}
              onChange={setLosenord}
              isRequired
              isDisabled={status === 'kontrollerar'}
            />
            <button
              type="button"
              aria-expanded={visaGlomtNotis}
              onClick={() => setVisaGlomtNotis((v) => !v)}
              className="text-(color:--mm-accent) self-end rounded text-small underline-offset-2 hover:underline focus-visible:outline-(--mm-focus-ring) focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Glömt lösenord?
            </button>
            {visaGlomtNotis && (
              <p
                role="status"
                className="text-caption text-text-secondary motion-safe:animate-mm-avsloj"
              >
                Klicka "skicka" nästa gång, så mejlar vi dig en länk för att sätta ett nytt
                lösenord. (Byggs i TASK-127.7 - prototypen visar bara texten.)
              </p>
            )}
          </div>

          {status === 'fel' && (
            <MessageBox
              intent="error"
              title="Kunde inte logga in"
              className="motion-safe:animate-mm-avsloj"
            >
              Kontrollera e-postadress och lösenord och försök igen.
            </MessageBox>
          )}

          <Button type="submit" size="lg" isDisabled={status === 'kontrollerar'}>
            {status === 'kontrollerar' ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                Loggar in …
              </>
            ) : (
              'Logga in'
            )}
          </Button>
        </form>
      </div>
    </EnSpalt>
  );
}

/* ────────────────────────────────────────────────────────────────
   ACCEPT (/valkommen)
   ──────────────────────────────────────────────────────────────── */

/** Attrapp-data för accept-sidan — se filens topp-kommentar för proveniens. */
const INBJUDEN_AV = 'Marcus Johansson';
const MOTTAGARENS_FORNAMN = 'Lotta';
const MOTTAGARENS_EPOST = 'lotta@miranon.se';
const TILLDELAD_ROLL = 'Administratör';

/**
 * Accept-sidan, hållning B. HELA poängen med kontextrik-hållningen visar
 * sig här: mottagaren ska förstå vem som bjudit in dem, vilken roll de
 * får och vad som händer näst — utan att fråga någon (kortets brief).
 * E-postadressen är FÖRIFYLLD och OREDIGERBAR (ADR-092 beslut 2) — byggd
 * som en egen readonly-yta (inte primitivens `Input`) eftersom den
 * behöver ett lås-ikon-tillägg som `Input`-primitiven inte har en prop
 * för; att lägga till en sådan prop vore att ändra delad kod utanför
 * denna fils avgränsning.
 */
export function AcceptVariantB() {
  const emailFaltId = useId();
  const emailBeskrivningId = useId();
  const [losenord, setLosenord] = useState('');
  const [visaLosenord, setVisaLosenord] = useState(false);
  const [status, setStatus] = useState<'vila' | 'sparar' | 'fel'>('vila');

  // ETT lösenordsfält, inte två (konvergens-omgång 7, research-grundad).
  // NN/g avråder uttryckligen från bekräftelsefält, och GitLabs skarpa
  // produktionskod för invite-accept använder ett enda fält — mottagaren
  // verifierar sin inmatning genom att SE den, inte genom att skriva om den.
  // Valideringen enkelspåras därmed till en enda regel.
  const langdOk = losenord.length >= 8;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!langdOk) {
      setStatus('fel');
      return;
    }
    // Prototyp-only: ingen backend finns — visar bara "sparar"-tillståndet
    // en kort stund så Marcus kan bedöma dess visuella form.
    setStatus('sparar');
    window.setTimeout(() => setStatus('vila'), 600);
  };

  return (
    <EnSpalt varm>
      <div className="flex w-full max-w-xl flex-col gap-8">
        <Ordmarke />

        {/* H1 → BRÖDTEXT, inte H1 → H2 (Marcus: "kaka på kaka"). Meningen är
            information, inte en rubrik — den behöver ingen rubrikvikt för att
            läsas först. Som ledande brödtext får hälsningen andas, och ögat
            får EN tyngdpunkt i stället för två som konkurrerar. */}
        <div className="flex flex-col gap-3">
          <h1 className="font-semibold text-3xl text-text">Välkommen, {MOTTAGARENS_FORNAMN}</h1>
          <p className="text-lg text-text-secondary">
            {INBJUDEN_AV} har bjudit in dig till Miranon Media Admin. Du får rollen{' '}
            <strong className="font-semibold text-text">{TILLDELAD_ROLL.toLowerCase()}</strong>.
          </p>
        </div>

        {/* Formuläret i eget vitt kort mot den varma fonden (Marcus,
            konvergens-omgång 8). `rounded-2xl` är appens kort-standard —
            samma radie som DashboardCard och 38 andra ytor, inte ett värde
            uppfunnet för prototypen. */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-border-light bg-surface p-6 shadow-sm sm:p-8"
          noValidate
        >
          <h2 className="font-semibold text-2xl text-text">Sätt ditt lösenord</h2>

          <div className="flex flex-col gap-1">
            <label htmlFor={emailFaltId} className="text-(color:--mm-input-label-text) text-small">
              E-postadress
            </label>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
              />
              <input
                id={emailFaltId}
                type="email"
                value={MOTTAGARENS_EPOST}
                readOnly
                aria-describedby={emailBeskrivningId}
                className="text-(color:--mm-input-text) w-full cursor-default rounded border border-(--mm-input-border) bg-bg-muted py-2.5 pr-3 pl-9 text-body"
              />
            </div>
            <p
              id={emailBeskrivningId}
              className="text-(color:--mm-input-description-text) text-caption"
            >
              Den här adressen hör till din inbjudan och går inte att ändra.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Input
              label="Lösenord"
              type={visaLosenord ? 'text' : 'password'}
              autoComplete="new-password"
              value={losenord}
              onChange={setLosenord}
              isRequired
              isDisabled={status === 'sparar'}
              description="Minst 8 tecken. Vi rekommenderar 15 eller fler för extra trygghet."
            />
            {/* Ersätter bekräftelsefältet: mottagaren kontrollerar sin
                inmatning genom att se den. `aria-pressed` bär tillståndet;
                knappen ligger UNDER fältet i stället för inuti, så den aldrig
                överlappar text eller krymper träffytan. */}
            <button
              type="button"
              aria-pressed={visaLosenord}
              onClick={() => setVisaLosenord((v) => !v)}
              className="text-(color:--mm-accent) self-end rounded text-small underline-offset-2 hover:underline focus-visible:outline-(--mm-focus-ring) focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {visaLosenord ? 'Dölj lösenord' : 'Visa lösenord'}
            </button>
          </div>

          {status === 'fel' && (
            <MessageBox
              intent="error"
              title="Något stämmer inte"
              className="motion-safe:animate-mm-avsloj"
            >
              Lösenordet behöver vara minst 8 tecken.
            </MessageBox>
          )}

          <Button type="submit" size="lg" isDisabled={status === 'sparar'}>
            {status === 'sparar' ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                Skapar konto …
              </>
            ) : (
              'Skapa mitt konto'
            )}
          </Button>
        </form>

        <p className="flex items-center gap-2 text-caption text-text-muted">
          <Clock aria-hidden="true" className="size-4 shrink-0" />
          Länken gäller i 24 timmar. Har den gått ut? Be {INBJUDEN_AV.split(' ')[0]} skicka en ny.
        </p>
      </div>
    </EnSpalt>
  );
}
