import { type FormEvent, useRef, useState } from 'react';
import { Form } from 'react-aria-components';
import { Button, Dialog, DialogTrigger, Input, Modal } from '@/components/primitives';
import { MessageBox } from '@/components/primitives/MessageBox';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useCreateRegistration } from '@/data/mutations/useCreateRegistration';

// Samma format-grind som EF:en (medvetet enkel — server är slutgiltig validator).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  fornamn?: string;
  efternamn?: string;
  email?: string;
}

/**
 * "Lägg till anmälan" — modal-formulär som skapar en MANUELL anmälan
 * (Fas 6c Leverabel 4). ADDITIV affordans i Anmälda-vyns header; bryter inte
 * den read-only rostern (den refetchar bara via cache-invalidering vid success).
 *
 * Overlay-mönstret (Modal + Dialog, ADR-044): fokus-trap, Escape, klick-utanför,
 * fokus-retur till triggern och inert bakgrund bärs av react-aria-components.
 * Fält via Input-primitiven (Label/FieldError/aria-describedby id-wiras av React
 * Aria, ADR-046). Validering är kontrollerad (isInvalid + errorMessage); vid
 * submit-fel flyttas fokus till första ogiltiga fält.
 *
 * Idempotens (ADR-059): en klient-UUID genereras när modalen öppnas och är STABIL
 * över retries av samma submission (regenereras vid ny öppning). submit
 * isDisabled={isPending} är den primära dubbel-submit-grinden.
 *
 * Fel-ytor: 409 (dubblett) → inline form-fel (role=alert); övriga (5xx m.fl.) →
 * MessageBox med requestId. On success: stäng modal + rostern refetchar +
 * aria-live-annons (i useCreateRegistration).
 */
export function AddRegistrationModal({ eventId }: { eventId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [fornamn, setFornamn] = useState('');
  const [efternamn, setEfternamn] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const mutation = useCreateRegistration(eventId);

  function resetForm() {
    setFornamn('');
    setEfternamn('');
    setEmail('');
    setTelefon('');
    setErrors({});
    mutation.reset();
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open) {
      // Färsk idempotensnyckel + rent formulär per öppning.
      setIdempotencyKey(crypto.randomUUID());
      resetForm();
    }
  }

  function focusFirstInvalid(errs: FieldErrors) {
    const order: (keyof FieldErrors)[] = ['fornamn', 'efternamn', 'email'];
    const first = order.find((k) => errs[k]);
    if (first) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const f = fornamn.trim();
    const en = efternamn.trim();
    const em = email.trim();
    const errs: FieldErrors = {};
    if (!f) errs.fornamn = 'Förnamn får inte vara tomt.';
    if (!en) errs.efternamn = 'Efternamn får inte vara tomt.';
    if (!em) errs.email = 'E-post får inte vara tom.';
    else if (!EMAIL_RE.test(em))
      errs.email = 'Ange en giltig e-postadress (t.ex. namn@exempel.se).';

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstInvalid(errs);
      return;
    }

    mutation.mutate(
      { fornamn: f, efternamn: en, email: em, telefon: telefon.trim() || null, idempotencyKey },
      { onSuccess: () => handleOpenChange(false) },
    );
  }

  // Fel-klassning: 409 = affärs-dubblett (inline); övrigt = oväntat (MessageBox + requestId).
  const err = mutation.error;
  const isDuplicate = err instanceof EdgeFunctionError && err.status === 409;
  const otherError = mutation.isError && !isDuplicate ? err : null;

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button intent="primary" size="md">
        Lägg till anmälan
      </Button>
      <Modal isDismissable>
        <Dialog
          title="Lägg till anmälan"
          size="md"
          aria-description="Skapa en manuell anmälan till det här eventet."
        >
          {({ close }) => (
            <Form
              ref={formRef}
              validationBehavior="aria"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <Input
                label="Förnamn"
                name="fornamn"
                isRequired
                autoFocus
                value={fornamn}
                onChange={setFornamn}
                isInvalid={!!errors.fornamn}
                errorMessage={errors.fornamn}
                autoComplete="given-name"
              />
              <Input
                label="Efternamn"
                name="efternamn"
                isRequired
                value={efternamn}
                onChange={setEfternamn}
                isInvalid={!!errors.efternamn}
                errorMessage={errors.efternamn}
                autoComplete="family-name"
              />
              <Input
                label="E-post"
                name="email"
                type="email"
                isRequired
                value={email}
                onChange={setEmail}
                isInvalid={!!errors.email}
                errorMessage={errors.email}
                autoComplete="email"
              />
              <Input
                label="Telefon (valfritt)"
                name="telefon"
                type="tel"
                value={telefon}
                onChange={setTelefon}
                autoComplete="tel"
              />

              {/* 409: inline affärs-fel (role=alert via MessageBox). */}
              {isDuplicate && (
                <MessageBox intent="error" title="Redan anmäld">
                  Personen är redan anmäld till det här eventet.
                </MessageBox>
              )}

              {/* Övriga fel: requestId för spårbarhet (Fas A M7). */}
              {otherError && (
                <MessageBox intent="error" title="Kunde inte skapa anmälan">
                  {otherError instanceof Error ? otherError.message : 'Inget felmeddelande angavs.'}
                </MessageBox>
              )}

              {/* aria-live för submit-state (ingen visuell spinner krävs för SR). */}
              <p className="sr-only" role="status" aria-live="polite">
                {mutation.isPending ? 'Sparar anmälan…' : ''}
              </p>

              <div className="mt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  intent="ghost"
                  onPress={close}
                  isDisabled={mutation.isPending}
                >
                  Avbryt
                </Button>
                <Button type="submit" intent="primary" isDisabled={mutation.isPending}>
                  {mutation.isPending ? 'Sparar…' : 'Skapa anmälan'}
                </Button>
              </div>
            </Form>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
