import { createFileRoute, redirect } from '@tanstack/react-router';

// RIVEN HEMVIST — ÖPPET HANTERAD (task-19.2, PRD task-19 beslut 2): Skapa
// nytt event bor sedan hemvist-flytten (Marcus-kvitterad 2026-07-21) i
// event-familjen på /event/skapa; Mer-ingången är riven. Routen behålls som
// ren omdirigering så PWA-historik och bokmärken aldrig dör (inga döda
// URL:er) — ingen komponent, inget innehåll.
export const Route = createFileRoute('/_authenticated/mer/skapa-event')({
  beforeLoad: () => {
    throw redirect({ to: '/event/skapa', replace: true });
  },
});
