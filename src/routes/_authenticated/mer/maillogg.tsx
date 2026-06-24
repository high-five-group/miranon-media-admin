import { createFileRoute } from '@tanstack/react-router';
import { MailLog } from '@/components/maillog';

export const Route = createFileRoute('/_authenticated/mer/maillogg')({
  staticData: { title: 'Maillogg' },
  component: MailLogPage,
});

// Mer — Maillogg-vy (Fas 6e L2 Landning 2): /mer/maillogg. LÄS-vy via fetchMailLog
// → get-mail-log-EF (global lista, hela Utskickslogg, createdTime desc). Logiken bor
// i MailLog; routen håller bara montering. Syskon-leafs: index.tsx (Mer-landningen) +
// vantelista.tsx + intresserade.tsx; <Outlet/> bärs av _authenticated via AppShell.
function MailLogPage() {
  return <MailLog />;
}
