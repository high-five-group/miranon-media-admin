import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useUpdatePersonNote } from '@/data/mutations/useUpdatePersonNote';
import { cn } from '@/lib/cn';

interface PersonNoteEditorProps {
  personId: string;
  /** Nuvarande anteckning ur detalj-cachen (`null` = ingen). */
  note: string | null;
}

/**
 * Edit-in-place för `Personer.Anteckningar` (Fas 6a L6c). Read-by-default;
 * "Redigera" → textarea med explicit Spara/Avbryt. Optimistisk write via
 * `useUpdatePersonNote` (mall: `markRegistrationPaid`, ADR-016/049/055),
 * anpassad till enskilt-record-cachen. Speglar `MarkPaidButton`-precedensen:
 * mutationen + fel-ytan inkapslas här, detaljvyn renderar bara komponenten.
 *
 * Tillgänglighet (11/10):
 * - label↔textarea via `for`/`id` (unikt `useId`).
 * - Spara = KNAPP (Enter i textarean = radbrytning); Esc = Avbryt.
 * - Optimistiskt: Spara lämnar edit-läget direkt → read-vyn visar cache-värdet
 *   utan att vänta på nätverket. Vid fel återgår vi till edit-läget med
 *   användarens text bevarad (ingen input tappas).
 * - Fel-yta: `MessageBox` `role="alert"` (assertiv) ur `mutation.error`, kopplad
 *   till textarean via `aria-describedby` + `aria-invalid` ENBART när felet
 *   renderas (danglar aldrig mot icke-existerande element). Ingen
 *   `alertScreenReader` på fel-grenen — role=alert annonserar redan.
 * - Fokus-retur (WCAG): edit-start → textarea; spara/avbryt → "Redigera"-knappen.
 */
export function PersonNoteEditor({ personId, note }: PersonNoteEditorProps) {
  const mutation = useUpdatePersonNote(personId);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const textareaId = useId();
  const errorId = useId();
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Vart fokus ska flyttas EFTER att `isEditing` ändrats (DOM uppdaterad).
  const focusTarget = useRef<'button' | 'textarea' | null>(null);

  useEffect(() => {
    if (focusTarget.current === 'textarea' && isEditing) {
      textareaRef.current?.focus();
      focusTarget.current = null;
    } else if (focusTarget.current === 'button' && !isEditing) {
      editButtonRef.current?.focus();
      focusTarget.current = null;
    }
  }, [isEditing]);

  function startEdit() {
    setDraft(note ?? '');
    mutation.reset();
    focusTarget.current = 'textarea';
    setIsEditing(true);
  }

  function cancelEdit() {
    mutation.reset();
    focusTarget.current = 'button';
    setIsEditing(false);
  }

  function save() {
    const attempted = draft;
    // Optimistiskt: lämna edit-läget direkt — `onMutate` har redan satt
    // cache-värdet, så read-vyn visar nya noten utan network-wait.
    focusTarget.current = 'button';
    setIsEditing(false);
    mutation.mutate(attempted, {
      onError: () => {
        // Rollback sker i hooken. Återgå till edit-läget med användarens text
        // bevarad så hen kan försöka igen utan att tappa input.
        setDraft(attempted);
        focusTarget.current = 'textarea';
        setIsEditing(true);
      },
    });
  }

  function onTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
    // Enter lämnas orört → radbrytning i textarean (Spara är en knapp).
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-2">
        {note ? (
          <p className="whitespace-pre-wrap text-small">{note}</p>
        ) : (
          <p className="text-small text-text-muted">Inga anteckningar.</p>
        )}
        <div>
          <Button ref={editButtonRef} intent="secondary" size="sm" onPress={startEdit}>
            Redigera
          </Button>
        </div>
      </div>
    );
  }

  const requestId =
    mutation.error instanceof EdgeFunctionError ? mutation.error.requestId : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={textareaId} className="text-(color:--mm-input-label-text) text-small">
        Anteckning
      </label>
      <textarea
        ref={textareaRef}
        id={textareaId}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onTextareaKeyDown}
        aria-invalid={mutation.isError || undefined}
        aria-describedby={mutation.isError ? errorId : undefined}
        rows={4}
        className={cn(
          'text-(color:--mm-input-text) w-full rounded border bg-(--mm-input-bg) px-3 py-2 font-sans text-body',
          mutation.isError ? 'border-(--mm-input-border-invalid)' : 'border-(--mm-input-border)',
        )}
      />
      <div className="flex gap-2">
        <Button intent="primary" size="sm" onPress={save} isDisabled={mutation.isPending}>
          Spara
        </Button>
        <Button intent="secondary" size="sm" onPress={cancelEdit}>
          Avbryt
        </Button>
      </div>
      {mutation.isError && (
        <div id={errorId}>
          <MessageBox intent="error" title="Kunde inte spara anteckningen">
            Försök igen.{requestId ? ` Fel-ID: ${requestId}.` : ''}
          </MessageBox>
        </div>
      )}
    </div>
  );
}

// task-36.3 D1-kontrastbevis case 2 — komponentkod i commit → full svit [rivs]
