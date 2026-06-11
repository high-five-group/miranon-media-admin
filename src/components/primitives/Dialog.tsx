import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import {
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
  type DialogRenderProps,
  Heading,
} from 'react-aria-components';
import { cn } from '@/lib/cn';

const dialogVariants = cva('max-w-full p-6 outline-none', {
  variants: {
    size: {
      sm: 'w-(--mm-dialog-width-sm)',
      md: 'w-(--mm-dialog-width-md)',
      lg: 'w-(--mm-dialog-width-lg)',
    },
  },
  defaultVariants: { size: 'md' },
});

type SlotContent = ReactNode | ((opts: DialogRenderProps) => ReactNode);

export interface DialogProps
  extends Omit<AriaDialogProps, 'className' | 'children'>,
    VariantProps<typeof dialogVariants> {
  /** Rubrik — blir aria-labelledby-källa via Heading slot="title". */
  title: string;
  /** Innehåll; funktion får `{ close }` för programmatisk stängning. */
  children?: SlotContent;
  /** Knapprad; funktion får `{ close }` (t.ex. Avbryt-knapp). */
  actions?: SlotContent;
  className?: string;
}

/**
 * Dialog-primitiv (ADR-044) — innehållet i en `<Modal>`. `title` renderas
 * som `<Heading slot="title">` vilket ger `aria-labelledby` automatiskt
 * (checklist §6.1); `role="dialog"`, fokushantering och Escape bärs av
 * react-aria-components. Behöver skärmläsar-kontext utöver rubriken:
 * skicka `aria-description` (ARIA-UPGRADE §1 Dialog).
 *
 * @example
 * ```tsx
 * <Dialog
 *   title="Ta bort anmälan?"
 *   actions={({ close }) => (
 *     <>
 *       <Button intent="ghost" onPress={close}>Avbryt</Button>
 *       <Button intent="danger" onPress={() => { remove(); close(); }}>Ta bort</Button>
 *     </>
 *   )}
 * >
 *   Åtgärden kan inte ångras.
 * </Dialog>
 * ```
 */
export function Dialog({ title, children, actions, size, className, ...props }: DialogProps) {
  const render = (content: SlotContent, opts: DialogRenderProps) =>
    typeof content === 'function' ? content(opts) : content;
  return (
    <AriaDialog {...props} className={cn(dialogVariants({ size }), className)}>
      {(opts) => (
        <>
          <Heading slot="title" className="text-xl">
            {title}
          </Heading>
          {children !== undefined && <div className="mt-3 text-body">{render(children, opts)}</div>}
          {actions !== undefined && (
            <div className="mt-6 flex justify-end gap-3">{render(actions, opts)}</div>
          )}
        </>
      )}
    </AriaDialog>
  );
}

// Öppningsmekanismen är React Arias egen — re-exporteras så konsumenter
// (och Mm Component Library) slipper en direkt react-aria-components-import.
export { DialogTrigger } from 'react-aria-components';
