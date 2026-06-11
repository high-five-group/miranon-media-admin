import { Modal as AriaModal, ModalOverlay, type ModalOverlayProps } from 'react-aria-components';
import { cn } from '@/lib/cn';

export interface ModalProps extends Omit<ModalOverlayProps, 'className'> {
  className?: string;
}

/**
 * Modal-primitiv (ADR-044): overlay + positionering. Komponeras med
 * `<Dialog>` som innehåll och `DialogTrigger` (re-export ur Dialog.tsx)
 * som öppningsmekanism.
 *
 * Inbyggt via react-aria-components (checklist §6.1 — ingen egen
 * implementation): fokus flyttas in vid open, fokus-trap, Escape stänger,
 * klick utanför stänger vid `isDismissable`, fokus-retur till trigger,
 * inert bakgrund. In-/ut-animation via `data-entering`/`data-exiting` +
 * CSS-transitions; `prefers-reduced-motion` nollar duration via base.css
 * globala regel.
 *
 * @example
 * ```tsx
 * <DialogTrigger>
 *   <Button>Öppna</Button>
 *   <Modal isDismissable>
 *     <Dialog title="Rubrik">Innehåll</Dialog>
 *   </Modal>
 * </DialogTrigger>
 * ```
 */
export function Modal({ className, children, ...props }: ModalProps) {
  return (
    <ModalOverlay
      {...props}
      className="fixed inset-0 z-50 flex items-center justify-center bg-(--mm-dialog-overlay-bg) p-4 transition-opacity duration-200 data-[entering]:opacity-0 data-[exiting]:opacity-0"
    >
      <AriaModal
        className={cn(
          'max-h-[85vh] w-fit max-w-full overflow-auto rounded bg-(--mm-dialog-bg) shadow-xl outline-none transition-transform duration-200 data-[entering]:scale-95 data-[exiting]:scale-95',
          className,
        )}
      >
        {children}
      </AriaModal>
    </ModalOverlay>
  );
}
