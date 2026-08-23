import { createFileRoute } from '@tanstack/react-router';
import { PlatserYta } from '@/components/platser/PlatserYta';

export const Route = createFileRoute('/_authenticated/mer/platser')({
  staticData: { title: 'Platser' },
  component: PlatserYta,
});
