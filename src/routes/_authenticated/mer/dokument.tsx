import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import {
  PrototypeSwitcher,
  type PrototypeVariant,
  type PrototypeVy,
} from '@/components/dev/PrototypeSwitcher';
import { DokumentYta } from '@/components/dokument/DokumentYta';
import { GenereringsPrototyp } from '@/components/dokument/prototyp/GenereringsPrototyp';

export const Route = createFileRoute('/_authenticated/mer/dokument')({
  staticData: { title: 'Dokument' },
  component: DokumentPage,
});

// [PROTOTYPE, S108] Genereringsvyn — KONVERGENS. Den ENDA läspunkten för
// prototyp-flaggan (ADR-103 B3): `?variant=a` bakom `import.meta.env.DEV`.
// Utan flagga renderas den skarpa ytan orörd. Växlaren är dev-komponenten
// (ADR-074) — en variant (kolvikon), två vyer: Dokument-listan och
// genereringsvyn.
const PROTO_VARIANTER: PrototypeVariant[] = [
  {
    key: 'a',
    label: 'Genereringsvyn',
    steg: 1,
    stegLabel: 'Steg 1 - exakt kopia + genereringsvy',
  },
];
const PROTO_VYER: PrototypeVy[] = [
  { key: 'lista', label: 'Dokument-listan' },
  { key: 'generering', label: 'Genereringsvyn' },
];

// Mer — Dokument-ytan (`T131`): /mer/dokument. Ytan där bilagor förvaltas
// (ORDLISTA § Bilaga: "Dokument är YTAN i Mer där bilagor hanteras").
// Logiken bor i DokumentYta; routen håller bara montering — samma form som
// syskon-leafsen (maillogg.tsx, vantelista.tsx, intresserade.tsx).
// <Outlet/> bärs av _authenticated via AppShell.
function DokumentPage() {
  const [variant] = useQueryState('variant');
  const protoAktiv = import.meta.env.DEV && variant === 'a';

  return (
    <>
      {protoAktiv ? <GenereringsPrototyp /> : <DokumentYta />}
      {import.meta.env.DEV && <PrototypeSwitcher variants={PROTO_VARIANTER} vyer={PROTO_VYER} />}
    </>
  );
}
