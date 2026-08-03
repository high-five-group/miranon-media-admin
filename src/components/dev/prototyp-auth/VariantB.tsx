/**
 * [PROTOTYP — KASTBAR KOD, TASK-127.2] Divergensfas, hållning B:
 * "KONTEXTRIK OCH VARM".
 *
 * Besvarar EN nedskriven fråga (kortets brief): hur ska login-vyn och
 * accept-sidan se ut? Denna hållning testar en skärm som förklarar sig
 * själv innan mottagaren ombeds göra något — vem har bjudit in dig, vad
 * är det här, vad händer härnäst. Strukturellt: en varm kontext-spalt
 * (vänster på desktop, överst på mobil) + en neutral formulär-spalt,
 * tydligt skild från en minimal "en sak i taget"-hållning (ingen
 * berättande text, ett fält synligt åt gången).
 *
 * KONVERGENS-OMGÅNG 2 (Marcus facit): kontext-spalten delas i sin tur i två
 * EXAKT lika höga halvor på desktop (`grid-rows-2` — den faktiska
 * spalthöjden, ingen gissad pixelhöjd) — en bild-halva (Roger och Lottas
 * foto, platshållare tills fotot finns) med logotyp + ordmärke flytande
 * OVANPÅ bilden, och en text-halva därunder med rubrik, brödtext och
 * punktlistan. Vid smal vy (< lg) ersätts halva-höjden-regeln av ett fast
 * bildförhållande så bilden inte blir absurd hög eller platt när
 * kolumnerna staplas.
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
 * - Fokusordning: kontext-spalten bär ENDAST dekorativ/kompletterande text
 *   (aldrig den enda vägen till information) och innehåller inga
 *   interaktiva element — tabbordningen går rakt in i formuläret.
 * - `prefers-reduced-motion`: den enda animationen (`motion-safe:animate-
 *   mm-avsloj`, samma reveal-idiom som resten av systemet, tailwind.css)
 *   är media-gated; en spinnande loader-ikon body är `motion-safe:animate-
 *   spin` — statisk vid reduced motion, texten ("Loggar in …") bär
 *   statusen ändå.
 * - `prefers-contrast: more`: panel-avdelaren mellan kontext- och
 *   formulär-spalten är osynlig i vila och tänds via `contrast-more:`
 *   (samma border-transparent-idiom som DashboardCard/NastaEventCard).
 * - Logotyp + namn flyter på en OPAK yta (`--mm-surface-inverse`, samma
 *   par som VariantC:s Märkespanel) ovanpå bild-halvan — kontrasten mot
 *   vit text (`--mm-text-inverse`) beror därför ALDRIG på fotots ljushet,
 *   till skillnad från en transparent gradient-scrim. Uppmätt:
 *   `#ffffff` mot `#242424` (`--p-neutral-0` mot `--p-neutral-900`) ⇒
 *   kontrastkvot ≈15,52:1 (mätt i webbläsaren mot renderade
 *   `rgb(36,36,36)`/`rgb(255,255,255)`) — WCAG AA-golvet för normal text är
 *   4,5:1,
 *   AAA-golvet 7:1. Se PR-beskrivningen för uträkningen.
 * - Endast design-tokens (`--mm-*` via Tailwind-temat eller arbiträr
 *   `(--mm-*)`-syntax) — inga hårdkodade färger.
 */
import {
  CircleCheck,
  Clock,
  KeyRound,
  Loader2,
  Lock,
  type LucideIcon,
  ShieldCheck,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useState } from 'react';
import { Button, Input, MessageBox } from '@/components/primitives';

/* ────────────────────────────────────────────────────────────────
   DELAT: kontext-spalten + formulär-spalten. Delas mellan Login och
   Accept i DENNA FIL ENDAST (ingen export — skarven känner inte till
   dem, per kontraktet ovan).
   ──────────────────────────────────────────────────────────────── */

/**
 * Ordmärke: logotyp (`/miranon-logo.svg`, finns redan i `public/` — ersätter
 * omgång 1:s runda profilplatshållare per Marcus instruktion) + textnamn,
 * på en OPAK mörk yta som flyter ovanpå foto-halvan. Kontrasten mot ytan är
 * därför oberoende av fotots ljushet — se A11Y-GOLVET-kommentaren ovan för
 * den uppmätta kontrastkvoten.
 */
/**
 * Ordmärket är POSITIONSNEUTRALT — föräldern bestämmer var det sitter.
 * Tidigare bar det `absolute top-4 left-4` för att flyta ovanpå bild-halvan;
 * när bilden togs bort (Marcus, konvergens-omgång 5) följde positioneringen
 * med bort. Ett absolut-positionerat barn i ett flöde utan `relative`-förälder
 * ankras mot närmaste positionerade förfader — tyst fel som syns först vid
 * scroll.
 */
function Ordmarke() {
  return (
    <div className="flex items-center gap-3">
      <img src="/favicon/favicon.svg" alt="" className="size-12 shrink-0 rounded-lg" />
      <div className="leading-tight">
        <p className="font-semibold text-lg text-text">Miranon Media</p>
        <p className="text-caption text-text uppercase tracking-wide">Admin</p>
      </div>
    </div>
  );
}

/** En rad i kontext-spaltens punktlista: ikon + varm, konkret mening. */
function KontextRad({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Icon aria-hidden="true" className="text-(color:--mm-accent) mt-0.5 size-5 shrink-0" />
      <span className="text-body text-text-secondary">{children}</span>
    </li>
  );
}

/**
 * Varm kontext-spalt (vänster/topp). Bär ALDRIG den enda vägen till
 * information den innehåller är kompletterande — och innehåller inga
 * interaktiva element (tabbordningen ska gå rakt in i formuläret). Delas i
 * två exakt lika höga halvor på desktop (`lg:grid-rows-2`, samma faktiska
 * spalthöjd — inte en gissad pixelhöjd); staplas normalt på smal vy.
 */
function KontextSpalt({ children, fotnot }: { children?: ReactNode; fotnot?: ReactNode }) {
  // Konvergens-omgång 5 (Marcus): BILDEN ÄR BORTA — "för att testa hur det
  // blir och för att rensa bort lite saker". Spalten bär därför bara innehåll,
  // och ordmärket flyttar in hit eftersom det tidigare flöt ovanpå bilden.
  // FotoHalva/InnehallHalva-tvådelningen utgår med bilden; kvar är en spalt.
  return (
    <div className="flex flex-col justify-between gap-10 bg-linear-to-br from-(--mm-primary-tint) to-(--mm-accent-tint) p-8 lg:p-12">
      <div className="flex flex-col gap-10">
        <Ordmarke />
        <div className="flex flex-col gap-6">{children}</div>
      </div>
      <div className="text-caption text-text-muted">{fotnot}</div>
    </div>
  );
}

/** Neutral formulär-spalt (höger/under) — bär sidans `<h1>` och all handling. */
function FormSpalt({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center bg-bg p-8 lg:p-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

/**
 * EN-spalts skal (login, Marcus konvergens-omgång 5): bara formuläret,
 * centrerat i både ledd. Ingen kontext-spalt, ingen bild — login-vyn möter
 * någon som redan vet vad appen är och ska in, inte någon som ska övertygas.
 */
function EnSpalt({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-8 lg:p-12">{children}</div>
  );
}

/** Två-spalts skal: delare osynlig i vila, tänds under `prefers-contrast: more`. */
function TvaSpalter({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh divide-y divide-transparent contrast-more:divide-border-strong lg:grid-cols-2 lg:divide-x lg:divide-y-0">
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
    <EnSpalt>
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Ordmarke />
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-3xl text-text">Välkommen tillbaka</h1>
            <p className="text-body text-text-secondary">Logga in och kolla läget.</p>
          </div>

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
  const [bekrafta, setBekrafta] = useState('');
  const [status, setStatus] = useState<'vila' | 'sparar' | 'fel'>('vila');

  const langdOk = losenord.length >= 8;
  const matchar = bekrafta.length === 0 || bekrafta === losenord;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!langdOk || losenord !== bekrafta) {
      setStatus('fel');
      return;
    }
    // Prototyp-only: ingen backend finns — visar bara "sparar"-tillståndet
    // en kort stund så Marcus kan bedöma dess visuella form.
    setStatus('sparar');
    window.setTimeout(() => setStatus('vila'), 600);
  };

  return (
    <TvaSpalter>
      <KontextSpalt
        fotnot={
          <span className="flex items-center gap-2">
            <Clock aria-hidden="true" className="size-4 shrink-0" />
            Länken gäller i 24 timmar. Har den gått ut? Be {INBJUDEN_AV.split(' ')[0]} skicka en ny.
          </span>
        }
      >
        {/* H1 → BRÖDTEXT, inte H1 → H2 (Marcus: "kaka på kaka"). Meningen är
            information, inte en rubrik — den behöver ingen rubrikvikt för att
            läsas först. Som ledande brödtext får hälsningen andas, och ögat
            får EN tyngdpunkt i spalten i stället för två som konkurrerar. */}
        <div className="flex flex-col gap-3">
          <h1 className="font-semibold text-3xl text-text">Välkommen, {MOTTAGARENS_FORNAMN}</h1>
          <p className="text-lg text-text-secondary">
            {INBJUDEN_AV} har bjudit in dig till Miranon Media Admin. Du får rollen{' '}
            <strong className="font-semibold text-text">{TILLDELAD_ROLL.toLowerCase()}</strong>.
          </p>
        </div>
        <ol className="flex flex-col gap-4">
          <KontextRad icon={KeyRound}>Sätt ett lösenord här bredvid</KontextRad>
          <KontextRad icon={CircleCheck}>Logga in och upptäck ditt nya verktyg</KontextRad>
          <KontextRad icon={ShieldCheck}>
            Senare kan du frivilligt lägga till ett ännu enklare sätt att logga in
          </KontextRad>
        </ol>
      </KontextSpalt>

      <FormSpalt>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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

          <Input
            label="Lösenord"
            type="password"
            autoComplete="new-password"
            value={losenord}
            onChange={setLosenord}
            isRequired
            isDisabled={status === 'sparar'}
            description="Minst 8 tecken. Vi rekommenderar 15 eller fler för extra trygghet."
          />

          <Input
            label="Bekräfta lösenord"
            type="password"
            autoComplete="new-password"
            value={bekrafta}
            onChange={setBekrafta}
            isRequired
            isDisabled={status === 'sparar'}
            isInvalid={!matchar}
            errorMessage="Lösenorden stämmer inte överens."
          />

          {status === 'fel' && (
            <MessageBox
              intent="error"
              title="Något stämmer inte"
              className="motion-safe:animate-mm-avsloj"
            >
              Kontrollera att lösenordet är minst 8 tecken och att båda fälten är lika.
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
      </FormSpalt>
    </TvaSpalter>
  );
}
