import { createFileRoute } from '@tanstack/react-router';
import { EventinnehallYta } from '@/components/eventinnehall/EventinnehallYta';

export const Route = createFileRoute('/_authenticated/mer/eventinnehall')({
  staticData: { title: 'Eventinnehåll' },
  component: EventinnehallYta,
});
