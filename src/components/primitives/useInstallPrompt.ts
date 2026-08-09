import { useCallback, useEffect, useState } from 'react';

/**
 * Chromiums installationshändelse (task-126.2). Formen är web.dev:s officiellt
 * dokumenterade kontrakt (`web.dev/learn/pwa/installation-prompt`) — typen bär
 * INTE TypeScripts standard-DOM-lib eftersom `beforeinstallprompt` aldrig
 * standardiserades tvärs motorer: Safari implementerar den inte alls (Apple
 * Developer-forumet, tråd 807603, bekräftar avsaknaden 2026), Firefox inte
 * heller. Att deklarera typen lokalt håller hooken portabel till nästa
 * produkt utan en global `.d.ts`-utökning.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * De fyra installationsvägarna en besökare kan mötas av (AC 1, task-126.2).
 * Plattformsfakta, inte vårt designval: `beforeinstallprompt` finns bara i
 * Chromium-lägret (research 2026-08-02, web.dev + Apple Developer-forumet).
 */
export type InstallPath =
  | 'chromium-prompt'
  | 'ios-manuell'
  | 'macos-safari-dock'
  | 'redan-installerad';

export interface InstallPromptState {
  /** Vilken installationsväg som gäller för besökarens plattform just nu. */
  path: InstallPath;
  /**
   * `true` ENDAST när plattformens installationshändelse faktiskt fångats
   * OCH appen inte redan är installerad (AC 2 — den strukturella garantin:
   * en konsument som gatar sin knapp bakom detta fältet kan aldrig rendera
   * en död knapp, eftersom fältet är den enda vägen till `true`).
   */
  promptAvailable: boolean;
  /**
   * Utlöser plattformens installationsdialog. Kastar om `promptAvailable`
   * är `false` — samma invariant-mönster som `useDataSource`s router-context-
   * kontroll: ett kastat fel i produktion betyder att konsumenten inte gatat
   * anropet, inte att plattformen saknar stöd.
   */
  promptToInstall: () => Promise<'accepted' | 'dismissed'>;
}

/** Standalone-läge: appen KÖRS redan installerad (AC 3). */
function readStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  // Legacy Safari-egen egenskap (iOS + äldre macOS-Safari) — WebKit-specifik,
  // bär inte TS-standardlib. web.dev bekräftar den som den korrekta iOS-vägen.
  const iosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return displayModeStandalone || iosStandalone;
}

/**
 * Plattformens BAS-väg innan standalone-status vägs in (den vägs in av
 * anroparen — se `useInstallPrompt`). Ren funktion av `navigator` — testbar
 * hermetiskt genom att en konsument (test) skriver över `userAgent`/
 * `platform`/`maxTouchPoints` via `page.addInitScript` + reload, exakt så
 * SlideToConfirm-spec:en redan stubbar Web Audio.
 */
function detectBasePath(): Exclude<InstallPath, 'redan-installerad'> {
  if (typeof navigator === 'undefined') return 'chromium-prompt';
  const ua = navigator.userAgent;

  // iPadOS 13+ maskerar sig som "Macintosh" i UA (Apple bytte default 2019
  // för desktop-webbplatskompatibilitet) — branschens dokumenterade knep
  // (research 2026-08-02: aworkinprogress.dev "Detect iPad from Mac",
  // getsentry/sentry-javascript#12127) skiljer en riktig Mac (ingen
  // touchskärm, maxTouchPoints 0) från ett iPad som ljuger om sig själv:
  // navigator.platform === 'MacIntel' OCH maxTouchPoints > 1.
  const isIpadMasqueradingAsMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isIphoneOrIpod = /iPhone|iPod/.test(ua);
  if (isIpadMasqueradingAsMac || isIphoneOrIpod) return 'ios-manuell';

  // Riktig Mac (ingen touch) + Safari. Chrome/Edge/Opera/Firefox på iOS bär
  // ALLA "Safari" sist i sin UA-svans utan att VARA Safari — uteslut deras
  // egna produkt-tokens explicit (samma lista web.dev använder för
  // installability-detektering).
  const isRealSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const isRealMac = /Macintosh/.test(ua) && navigator.maxTouchPoints <= 1;
  if (isRealMac && isRealSafari) return 'macos-safari-dock';

  // Fallback: Chromium-familjen (Chrome/Edge/Brave/Opera/Samsung Internet,
  // valfri plattform) OCH varje annan motor utan känd installationsväg
  // (t.ex. Firefox desktop). `promptAvailable` förblir `false` tills den
  // riktiga händelsen fångas — AC 2 håller strukturellt även här: ingen väg
  // renderar en knapp förrän plattformen bevisligen kan hantera den.
  return 'chromium-prompt';
}

/**
 * Äger install-logiken för PWA:n (task-126.2; PRD task-126 användarberättelse
 * 8 + 10): fångar Chromiums `beforeinstallprompt`, exponerar prompt-anropet
 * gated bakom `promptAvailable`, detekterar plattform och lyssnar på
 * `appinstalled` för en omedelbar övergång till `redan-installerad` — utan
 * att kräva en omladdning (webbläsarens egen installationsväg, t.ex. via
 * adressfältets ikon, skjuter samma händelse oavsett vilken UI som utlöste
 * den).
 *
 * Ren bibliotekskod: ingen produktspecifik text, ingen kännedom om Mer-fliken
 * (task-126.3, som konsumerar denna hook direkt för sina plattforms-grenar).
 *
 * @example
 * ```tsx
 * const { path, promptAvailable, promptToInstall } = useInstallPrompt();
 * if (path === 'chromium-prompt' && promptAvailable) {
 *   return <Button onPress={() => void promptToInstall()}>Installera appen</Button>;
 * }
 * ```
 */
export function useInstallPrompt(): InstallPromptState {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(readStandalone);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // preventDefault stoppar webbläsarens egen anonyma infobar (web.dev-
      // kontraktet) — vi äger presentationen i stället.
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredEvent(null);
    };
    const media = window.matchMedia?.('(display-mode: standalone)');
    const handleMediaChange = () => setInstalled(readStandalone());

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    media?.addEventListener?.('change', handleMediaChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      media?.removeEventListener?.('change', handleMediaChange);
    };
  }, []);

  const promptToInstall = useCallback(async (): Promise<'accepted' | 'dismissed'> => {
    if (!deferredEvent) {
      throw new Error(
        'promptToInstall anropad utan fångad plattformshändelse - konsumenten måste gata anropet bakom promptAvailable (AC 2, task-126.2)',
      );
    }
    try {
      await deferredEvent.prompt();
      const { outcome } = await deferredEvent.userChoice;
      // Engångshändelse (web.dev-kontraktet): nollställs oavsett utfall så ett
      // andra klick aldrig återanvänder en redan spenderad händelse.
      setDeferredEvent(null);
      if (outcome === 'accepted') setInstalled(true);
      return outcome;
    } catch {
      // Flera monterade `InstallPrompt`-instanser (t.ex. en default-knapp +
      // en render-prop-inspektör på samma sida) delar INTE state — vardera
      // `useInstallPrompt()`-anrop har sin egen lokala `deferredEvent`, men
      // en gemensamt fångad `beforeinstallprompt`-referens kan peka på SAMMA
      // underliggande engångshändelse i flera instanser samtidigt (review-
      // fynd, task-126.2: klickar A först och sedan B, kallar B `.prompt()`
      // på ett redan förbrukat event — riktiga Chromium-implementationer
      // kastar `InvalidStateError` då, per web.dev:s engångskontrakt). Utan
      // denna fångst blir B:s klick en osynkad rejection (`void
      // handlePress()` i InstallPrompt.tsx) — precis den döda knappen AC 2
      // förbjuder. Nollställ lokalt och rapportera 'dismissed' (den ärliga
      // praktiska utkomsten: det finns inget kvar att installera via DENNA
      // instans) i stället för att låta felet tysta bort klicket utan
      // resultat.
      setDeferredEvent(null);
      return 'dismissed';
    }
  }, [deferredEvent]);

  const path: InstallPath = installed ? 'redan-installerad' : detectBasePath();

  return {
    path,
    promptAvailable: !installed && deferredEvent !== null,
    promptToInstall,
  };
}
