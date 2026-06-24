import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/mer/')({
  staticData: { title: 'Mer' },
  component: MerPage,
});

// Mer-landning (Fas 6c Leverabel 3): statisk länklista (spec bekräftar statisk
// Mer-vy — ingen URL-state). Väntelistan är den första riktiga Mer-ytan; övriga
// (leads, mailutskick m.m.) byggs i Fas 6e. <Outlet/> bärs av _authenticated.
function MerPage() {
  return (
    <section className="flex flex-col gap-6 p-4">
      <h1 className="font-semibold text-2xl">Mer</h1>
      <nav aria-label="Mer-sidor">
        <ul className="flex flex-col gap-2">
          <li>
            <Link to="/mer/vantelista" className="underline">
              Väntelista
            </Link>
          </li>
          <li>
            <Link to="/mer/intresserade" className="underline">
              Intresserade
            </Link>
          </li>
        </ul>
      </nav>
      <p className="text-small text-text-muted">Fler vyer byggs i Fas 6e.</p>
    </section>
  );
}
