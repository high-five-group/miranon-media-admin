import { createFileRoute } from '@tanstack/react-router';
import { DokumentYta } from '@/components/dokument/DokumentYta';

export const Route = createFileRoute('/_authenticated/mer/dokument')({
  staticData: { title: 'Dokument' },
  component: DokumentPage,
});

// [PROTOTYPE] [S100] Mer — Dokument-ytan (`T131`): /mer/dokument. Ytan där
// bilagor förvaltas (ORDLISTA § Bilaga: "Dokument är YTAN i Mer där bilagor
// hanteras"). Logiken bor i DokumentYta; routen håller bara montering — samma
// form som syskon-leafsen (maillogg.tsx, vantelista.tsx, intresserade.tsx).
// <Outlet/> bärs av _authenticated via AppShell.
function DokumentPage() {
  return <DokumentYta />;
}
