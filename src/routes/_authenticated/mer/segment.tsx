import { createFileRoute } from '@tanstack/react-router';
import { SegmentBuilder } from '@/components/segment';

export const Route = createFileRoute('/_authenticated/mer/segment')({
  staticData: { title: 'Segment' },
  component: SegmentPage,
});

// Mer — Segment-byggar-yta (Fas 6g L2): /mer/segment. Bygger include/exclude-regel
// över event-domänens taxonomi (deriveTaxonomy(get-events)) och räknar matchande
// personer on-demand via compute-segment-EF (L1). Logiken bor i SegmentBuilder;
// routen håller bara montering. <Outlet/> bärs av _authenticated via AppShell.
function SegmentPage() {
  return <SegmentBuilder />;
}
