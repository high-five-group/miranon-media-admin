import { createFileRoute, redirect } from '@tanstack/react-router';
import { InstalleraAppen } from '@/components/installera-appen';

export const Route = createFileRoute('/dev/installera-appen')({
  // Dev-only hermetisk måltavla (ADR-044-mönstret utökat till en produktvy,
  // task-126.3). "Installera appen" är produktspecifik (11/10/10) men har
  // NOLL databeteende — samma egenskap som InstallPrompt/useInstallPrompt
  // (11/11/11, task-126.2), som just därför fick sin egen testklass
  // (webblasarbeteende, ADR-094) i stället för acceptance: `hermetik-
  // sjalvtest.mjs` fäller varje acceptance-test som "överlever utan
  // fixturens svar" (ADR-080 beslut 3), och en yta utan nätverksanrop gör
  // det per definition.
  //
  // Den ÄKTA routen (/mer/installera-appen) ligger bakom _authenticated,
  // vars beforeLoad kräver en riktig session. Att seeda en fejkad session
  // (samma teknik som tests/support/fixturvarld/hermetic.ts) hade dragit in
  // acceptance-klassens fixturvärld-maskineri i en klass som per konstruktion
  // ska vara oberoende av den (ADR-094 §4: "UTAN MSW och utan en fixturvärld
  // att komponera med"). Denna route monterar därför SAMMA komponent som den
  // äkta routen, utan AppShell/auth-ceremonin runt den — precis som
  // /dev/primitives monterar InstallPrompt utan Mer-flikens skal.
  //
  // INTE i /dev/primitives (reserverad för bibliotekets primitiver, ADR-044)
  // och INTE i /dev/patterns (React Aria-referensmönster, ADR-020/045) — att
  // lägga produktspecifik svensk pedagogisk text i någon av dem hade varit
  // en kategori-sammanblandning av samma sort ADR-094 varnade för när den
  // drog gränsen mellan webblasarbeteende och a11y.
  //
  // Render-guardad till dev-läge (import.meta.env.DEV), onåbar i produktion.
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  staticData: { title: 'Installera appen — dev-demo' },
  component: InstalleraAppen,
});
