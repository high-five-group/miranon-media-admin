/**
 * [PROTOTYP · KASTBAR] Variant C — "Snabb och självsäker" (TASK-127.2,
 * divergensfasen). Besvarar EN fråga: hur ska login-vyn och accept-sidan
 * se ut? Denna variant, tillsammans med A och B (byggda av andra agenter i
 * samma pass), ger Marcus tre genuint olika förslag att välja mellan —
 * vinnaren itereras i konvergensfasen (TASK-127.3/127.6); den här filen
 * kasseras eller absorberas då enligt throwaway-kontraktet. Bocka INTE
 * kortets AC härifrån.
 *
 * HÅLLNING (given, inte vald av mig): någon som ska hit gång på gång.
 * Minimal friktion öppnad sida → inloggad. Allt synligt direkt, inga
 * mellansteg, ingen väntan på att förstå. Strukturellt SKILD från de andra
 * två tänkbara hållningarna ("minimal, en sak i taget" och "kontextrik och
 * förklarande") via fem konkreta val:
 *
 *   1. Fullbredds SPLIT-SCREEN (märkespanel + formulär), inte ett centrerat
 *      litet kort — läser som en sammanhållen, bestämd yta direkt.
 *   2. Mörk, hög-kontrast märkespanel — inte ljus/pastell eller
 *      illustrationstung.
 *   3. HELA formuläret synligt på en gång — ingen wizard, ingen
 *      progressive disclosure av fält.
 *   4. Omedelbar återkoppling överallt: visa/dölj-lösenord, lösenordsstyrka
 *      som uppdateras medan man skriver, snabb pending-puls vid submit.
 *   5. Kort, direkt, konstaterande copy — inga hedge-ord, inga
 *      förklarande hjälptexter utöver det som faktiskt krävs
 *      (Gunilla-golvet, se nedan).
 *
 * GUNILLA-GOLVET (icke förhandlingsbart, gäller även denna hållning):
 * "snabb" betyder aldrig "kräver förkunskap". Låsta fält förklaras alltid
 * med text (aldrig bara en hänglås-ikon), lösenordskrav skrivs på ren
 * svenska utan förkortningar (ASVS nämns aldrig i UI-copy), och
 * styrke-mätaren bär alltid en textetikett — färg är aldrig ensam bärare.
 *
 * KONTRAKT: exporterar `LoginVariantC` och `AcceptVariantC`. Båda tar noll
 * obligatoriska props och kan monteras direkt (`<LoginVariantC />`) i valfri
 * route med `RouterProvider` i trädet — ingen import från `VariantA.tsx`,
 * `VariantB.tsx`, växlaren eller routen. Interna hjälpkomponenter (fält,
 * kryssruta, styrke-mätare, märkespanel) bor i den här filen och exporteras
 * inte.
 *
 * PROTOTYP-KONTROLLER: varje skärm bär en egen, tydligt avgränsad
 * (streckad kant + "PROTOTYP"-etikett) tillstånds-växlare byggd på den
 * riktiga `ToggleButtonGroup`-primitiven. Den finns EFTERSOM
 * felläges-/länk-tillstånden är en del av svaret på "hur ska sidan se ut"
 * (TASK-127.6 AC#3 + ADR-093 enumerationsneutralitet) — utan den kan Marcus
 * bara bedöma ETT tillstånd åt gången. Kontrollen är själv en
 * prototyp-artefakt och finns inte i den skarpa sidan.
 *
 * DESIGNBESLUT WÄRT ATT NOTERA (för TASK-127.6-byggaren):
 * - Ingen "bekräfta lösenord"-fält. Visa/dölj-lösenord löser samma problem
 *   ("skrev jag rätt?") snabbare och med ett fält mindre — etablerat
 *   branschmönster (GitHub, Linear) när ett synlighets-tvåläge redan finns.
 * - Utgången/förbrukad länk pekar INTE mot en självbetjänings-"skicka
 *   ny länk"-knapp. Invite-EF:en (ADR-092 beslut 1) anropas aldrig från
 *   klienten och mottagaren har ingen session att autentisera en sådan
 *   begäran med — "vägen framåt" är att kontakta den som bjöd in, som i sin
 *   tur använder EF:ens omskicks-väg. En knapp som låtsas kunna det hade
 *   varit fel facit att bygga vidare på.
 * - Login markerar ALDRIG vilket fält som är fel (varken visuellt eller via
 *   `aria-invalid`) vid felaktiga uppgifter — bara den samlade
 *   `MessageBox` (role="alert") bär felet. Att rödmarkera ETT av de två
 *   fälten hade läckt information om vilket som stämde (samma
 *   enumeration-neutralitet som ADR-093 kräver på svarsnivå, applicerad på
 *   fältnivå).
 */
import { CheckCircle2, Circle, Eye, EyeOff, Lock, TriangleAlert } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import {
  Input as AriaInput,
  Checkbox,
  FieldError,
  Form,
  Label,
  Text,
  TextField,
} from 'react-aria-components';
import {
  Button,
  Input,
  MessageBox,
  ToggleButton,
  ToggleButtonGroup,
} from '@/components/primitives';
import { cn } from '@/lib/cn';

// ═══════════════════════════════════════════════════════════════════════
// Prototyp-kontroller (EJ del av skarp vy) — delad tillstånds-växlare
// ═══════════════════════════════════════════════════════════════════════

function PrototypVaxlare<K extends string>({
  namn,
  vald,
  onByt,
  alternativ,
}: {
  namn: string;
  vald: K;
  onByt: (k: K) => void;
  alternativ: { key: K; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 self-start rounded-full border border-border-strong border-dashed bg-bg-subtle px-3 py-1.5">
      <span className="font-semibold text-caption text-text-muted uppercase tracking-wide">
        Prototyp
      </span>
      <ToggleButtonGroup
        label={`Visa tillstånd: ${namn}`}
        selectedKey={vald}
        onSelectionChange={onByt}
      >
        {alternativ.map((a) => (
          <ToggleButton key={a.key} id={a.key} size="sm">
            {a.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Märkespanel — delad mellan Login och Accept (mörk, hög kontrast, terse)
// ═══════════════════════════════════════════════════════════════════════

function Markespanel({
  rubrik,
  ingress,
  brodtext,
}: {
  rubrik: string;
  ingress: string;
  brodtext: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-10 bg-(--mm-surface-inverse) px-6 py-8 text-text-inverse md:px-12 md:py-16">
      <img src="/miranon-logo.svg" alt="Miranon Media" className="size-10 md:size-12" />
      <div className="flex max-w-sm flex-col gap-4">
        <span aria-hidden className="block h-1 w-12 rounded-full bg-(--mm-accent)" />
        <p className="text-caption text-text-inverse uppercase tracking-[0.2em]">{ingress}</p>
        <p className="font-bold text-3xl leading-tight md:text-4xl">{rubrik}</p>
        <p className="text-body text-text-inverse">{brodtext}</p>
      </div>
      <footer className="text-caption text-text-inverse">
        © {new Date().getFullYear()} Miranon Media
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Lösenordsfält — TextField med visa/dölj-knapp (Input-primitiven saknar
// en trailing-slot, därför en egen komposition på samma tokens/mönster).
// ═══════════════════════════════════════════════════════════════════════

function LosenordsFalt({
  label,
  value,
  onChange,
  autoComplete,
  description,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: 'current-password' | 'new-password';
  description?: string;
  autoFocus?: boolean;
}) {
  const [visas, setVisas] = useState(false);

  return (
    <TextField
      value={value}
      onChange={onChange}
      isRequired
      autoFocus={autoFocus}
      className="flex w-full flex-col gap-1"
    >
      <Label className="text-(color:--mm-input-label-text) text-small">{label}</Label>
      <div className="relative">
        <AriaInput
          type={visas ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) min-h-12 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) py-0 pr-11 pl-4 font-sans text-lg transition-colors data-[invalid]:border-(--mm-input-border-invalid)"
        />
        <button
          type="button"
          onClick={() => setVisas((v) => !v)}
          aria-pressed={visas}
          aria-label={visas ? 'Dölj lösenordet' : 'Visa lösenordet'}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-text-muted transition-colors hover:text-text"
        >
          {visas ? (
            <EyeOff aria-hidden className="size-5" />
          ) : (
            <Eye aria-hidden className="size-5" />
          )}
        </button>
      </div>
      {description && (
        <Text slot="description" className="text-(color:--mm-input-description-text) text-caption">
          {description}
        </Text>
      )}
      <FieldError className="text-(color:--mm-input-error-text) text-caption" />
    </TextField>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Kom ihåg mig — react-aria Checkbox, samma data-attribut-mönster som
// RadioGroup-primitivens Radio (group-data-[selected]).
// ═══════════════════════════════════════════════════════════════════════

function KomIhagKryssruta({
  isSelected,
  onChange,
}: {
  isSelected: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Checkbox
      isSelected={isSelected}
      onChange={onChange}
      className="group flex cursor-pointer select-none items-center gap-2 text-body text-text"
    >
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-bg) transition-colors group-data-[selected]:border-(--mm-text) group-data-[selected]:bg-(--mm-text) group-data-[focus-visible]:outline group-data-[focus-visible]:outline-(--mm-focus-ring) group-data-[focus-visible]:outline-2 group-data-[focus-visible]:outline-offset-2"
      >
        <CheckCircle2
          aria-hidden
          className="size-3.5 text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      Kom ihåg mig på den här enheten
    </Checkbox>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LOGIN — Variant C
// ═══════════════════════════════════════════════════════════════════════

type LoginLage = 'standard' | 'fel';

export function LoginVariantC() {
  const [lage, setLage] = useState<LoginLage>('standard');
  const [epost, setEpost] = useState('');
  const [losenord, setLosenord] = useState('');
  const [kommerIhag, setKommerIhag] = useState(false);
  const [skickar, setSkickar] = useState(false);
  const [visaGlomtInfo, setVisaGlomtInfo] = useState(false);
  const felRef = useRef<HTMLDivElement>(null);
  const skickarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lage === 'fel') {
      felRef.current?.focus();
    }
  }, [lage]);

  useEffect(() => {
    return () => {
      if (skickarTimeout.current) clearTimeout(skickarTimeout.current);
    };
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSkickar(true);
    // Prototyp-puls: ingen verklig auth i denna kastbara komponent.
    skickarTimeout.current = setTimeout(() => setSkickar(false), 600);
  };

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[minmax(0,42%)_1fr]">
      <Markespanel
        ingress="Miranon Media Admin"
        rubrik="Rakt in. Inga omvägar."
        brodtext="Anmälningar, betalningar och närvaro samlade på ett ställe — redo när du är det."
      />

      <div className="flex items-center justify-center px-6 py-10 md:px-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <PrototypVaxlare
            namn="inloggning"
            vald={lage}
            onByt={setLage}
            alternativ={[
              { key: 'standard', label: 'Vanligt läge' },
              { key: 'fel', label: 'Felaktiga uppgifter' },
            ]}
          />

          <div className="flex flex-col gap-1">
            <h1 className="font-bold text-2xl text-text">Logga in</h1>
            <p className="text-body text-text-secondary">
              Ange e-post och lösenord — du är inne på några sekunder.
            </p>
          </div>

          {lage === 'fel' && (
            <div ref={felRef} tabIndex={-1}>
              <MessageBox intent="error" title="Vi känner inte igen uppgifterna">
                Kontrollera e-post och lösenord och försök igen.
              </MessageBox>
            </div>
          )}

          <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="E-post"
              type="email"
              size="lg"
              autoComplete="email"
              autoFocus
              isRequired
              value={epost}
              onChange={setEpost}
            />
            <LosenordsFalt
              label="Lösenord"
              value={losenord}
              onChange={setLosenord}
              autoComplete="current-password"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <KomIhagKryssruta isSelected={kommerIhag} onChange={setKommerIhag} />
              <button
                type="button"
                onClick={() => setVisaGlomtInfo((v) => !v)}
                aria-expanded={visaGlomtInfo}
                className="text-accent text-small underline decoration-1 underline-offset-2 hover:no-underline"
              >
                Glömt lösenord?
              </button>
            </div>

            {visaGlomtInfo && (
              <MessageBox intent="info" title="På väg">
                Lösenordsåterställning byggs just nu. Hör av dig till Roger eller Lotta så hjälper
                de dig direkt under tiden.
              </MessageBox>
            )}

            <p className="sr-only" role="status" aria-live="polite">
              {skickar ? 'Loggar in…' : ''}
            </p>

            <Button type="submit" size="lg" isDisabled={skickar} className="w-full">
              {skickar ? 'Loggar in…' : 'Logga in'}
            </Button>
          </Form>

          <p className="text-center text-caption text-text-muted">
            Problem att logga in? Kontakta Roger eller Lotta.
          </p>
        </div>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ACCEPT — Variant C (/valkommen)
// ═══════════════════════════════════════════════════════════════════════

type AcceptLage = 'giltig' | 'utgangen' | 'forbrukad';

// ATTRAPP-DATA — verklig payload kommer från invite-token-valideringen i
// TASK-127.6; realistiska svenska namn/adresser per uppdragets krav.
const INBJUDEN = {
  fornamn: 'Sara',
  epost: 'sara.lindgren88@gmail.com',
  bjodInAv: 'Lotta',
  bjodInEpost: 'lotta@miranon.se',
  roll: 'Administratör',
} as const;

type Styrka = 'tomt' | 'svagt' | 'bra' | 'starkt';

function berakraStyrka(losenord: string): Styrka {
  if (!losenord) return 'tomt';
  if (losenord.length < 8) return 'svagt';
  const blandat = /[a-zA-ZåäöÅÄÖ]/.test(losenord) && /[0-9\W]/.test(losenord);
  if (losenord.length >= 15 && blandat) return 'starkt';
  return 'bra';
}

const STYRKA_KONFIG: Record<Exclude<Styrka, 'tomt'>, { etikett: string; andel: number }> = {
  svagt: { etikett: 'Svagt', andel: 33 },
  bra: { etikett: 'Bra', andel: 66 },
  starkt: { etikett: 'Starkt', andel: 100 },
};

const STYRKA_FARG: Record<Exclude<Styrka, 'tomt'>, string> = {
  svagt: 'bg-error',
  bra: 'bg-warning',
  starkt: 'bg-success',
};

function Styrkematare({ losenord }: { losenord: string }) {
  const styrka = berakraStyrka(losenord);
  if (styrka === 'tomt') return null;
  const { etikett, andel } = STYRKA_KONFIG[styrka];

  return (
    <div className="flex flex-col gap-1">
      <div
        aria-hidden
        className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted contrast-more:border contrast-more:border-border-strong"
      >
        <div
          className={cn('h-full rounded-full transition-[width]', STYRKA_FARG[styrka])}
          style={{ width: `${andel}%` }}
        />
      </div>
      <span className="text-caption text-text-secondary">Lösenordsstyrka: {etikett}</span>
    </div>
  );
}

function Losenordskrav({ losenord }: { losenord: string }) {
  const krav = [
    { uppfyllt: losenord.length >= 8, text: 'Minst 8 tecken' },
    {
      uppfyllt: losenord.length >= 15,
      text: '15 tecken eller fler ger bäst skydd (rekommenderas)',
    },
    {
      uppfyllt: /[a-zA-ZåäöÅÄÖ]/.test(losenord) && /[0-9\W]/.test(losenord),
      text: 'Blanda bokstäver med siffror eller tecken',
    },
  ];

  return (
    <ul aria-label="Krav på lösenordet" className="flex flex-col gap-1">
      {krav.map((k) => (
        <li key={k.text} className="flex items-center gap-2 text-caption">
          {k.uppfyllt ? (
            <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />
          ) : (
            <Circle aria-hidden className="size-4 shrink-0 text-text-muted" />
          )}
          <span className={k.uppfyllt ? 'text-text' : 'text-text-secondary'}>
            {k.text}
            <span className="sr-only">{k.uppfyllt ? ' — uppfyllt' : ' — inte uppfyllt än'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Vänligt läge för en länk som gått ut eller redan använts (AC#3, TASK-127.6). */
function LankTillstand({ lage }: { lage: Exclude<AcceptLage, 'giltig'> }) {
  const rubrik = lage === 'utgangen' ? 'Länken har gått ut' : 'Länken är redan använd';
  const brodtext =
    lage === 'utgangen'
      ? `Den här inbjudningslänken slutade gälla 24 timmar efter att den skickades. Be ${INBJUDEN.bjodInAv} om en ny länk så är du igång direkt.`
      : `Den här länken har redan använts för att skapa ett konto. Försök logga in i stället — eller be ${INBJUDEN.bjodInAv} om en ny inbjudan om kontot inte fungerar.`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-full bg-warning-bg text-warning"
        >
          <TriangleAlert className="size-6" />
        </span>
        <h1 className="font-bold text-2xl text-text">{rubrik}</h1>
        <p className="text-body text-text-secondary">{brodtext}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          className="w-full"
          size="lg"
          onPress={() => {
            window.location.href = `mailto:${INBJUDEN.bjodInEpost}`;
          }}
        >
          Kontakta {INBJUDEN.bjodInAv}
        </Button>
        <a
          href="/login"
          className="text-center text-accent text-small underline decoration-1 underline-offset-2 hover:no-underline"
        >
          Gå till inloggning
        </a>
      </div>
    </div>
  );
}

export function AcceptVariantC() {
  const [lage, setLage] = useState<AcceptLage>('giltig');
  const [losenord, setLosenord] = useState('');
  const [skickar, setSkickar] = useState(false);
  const skickarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (skickarTimeout.current) clearTimeout(skickarTimeout.current);
    };
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSkickar(true);
    skickarTimeout.current = setTimeout(() => setSkickar(false), 700);
  };

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[minmax(0,42%)_1fr]">
      {/* Märkespanelen hålls MEDVETET konstant oavsett länk-tillstånd (samma
          princip som login: systemets identitet ändras aldrig, bara
          innehållet till höger). En personlig "Välkommen"-rubrik här hade
          känts fel bredvid ett "länken har gått ut"-meddelande — den
          personliga hälsningen hör hemma i sidans faktiska h1 i stället,
          som redan uppdateras per tillstånd. */}
      <Markespanel
        ingress="Miranon Media Admin"
        rubrik="Ett konto, redo på sekunder."
        brodtext="En personlig inbjudan väntar. Sätt ett lösenord och du är inne direkt."
      />

      <div className="flex items-center justify-center px-6 py-10 md:px-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <PrototypVaxlare
            namn="accept-länk"
            vald={lage}
            onByt={setLage}
            alternativ={[
              { key: 'giltig', label: 'Giltig länk' },
              { key: 'utgangen', label: 'Länk utgången' },
              { key: 'forbrukad', label: 'Länk använd' },
            ]}
          />

          {lage !== 'giltig' ? (
            <LankTillstand lage={lage} />
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="font-bold text-2xl text-text">Välkommen, {INBJUDEN.fornamn}!</h1>
                <p className="text-body text-text-secondary">
                  Din inbjudan väntar. Sätt ett lösenord så är du inne direkt.
                </p>
                <p className="text-caption text-text-muted">
                  Bjöds in av {INBJUDEN.bjodInAv} · Roll: {INBJUDEN.roll}
                </p>
              </div>

              <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="valkommen-epost"
                    className="text-(color:--mm-input-label-text) text-small"
                  >
                    E-postadress
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-text-muted"
                    >
                      <Lock className="size-5" />
                    </span>
                    <input
                      id="valkommen-epost"
                      type="email"
                      readOnly
                      value={INBJUDEN.epost}
                      autoComplete="email"
                      aria-describedby="valkommen-epost-beskrivning"
                      className="text-(color:--mm-input-text) min-h-12 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg-disabled) py-0 pr-4 pl-11 font-sans text-lg"
                    />
                  </div>
                  <p
                    id="valkommen-epost-beskrivning"
                    className="text-(color:--mm-input-description-text) text-caption"
                  >
                    Adressen kommer från din inbjudan och kan inte ändras här.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <LosenordsFalt
                    label="Välj ett lösenord"
                    value={losenord}
                    onChange={setLosenord}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <Losenordskrav losenord={losenord} />
                  <Styrkematare losenord={losenord} />
                </div>

                <p className="text-caption text-text-muted">
                  Vi kontrollerar automatiskt att lösenordet inte förekommit i ett känt dataintrång
                  innan det sparas.
                </p>

                <p className="sr-only" role="status" aria-live="polite">
                  {skickar ? 'Skapar konto…' : ''}
                </p>

                <Button type="submit" size="lg" isDisabled={skickar} className="w-full">
                  {skickar ? 'Skapar konto…' : 'Skapa konto och logga in'}
                </Button>
              </Form>

              <p className="text-center text-caption text-text-muted">
                Länken är personlig och giltig i 24 timmar efter att den skickades.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
