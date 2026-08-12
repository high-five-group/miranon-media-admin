import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useUpdatePersonFlag } from '@/data/mutations/useUpdatePersonFlag';

interface PersonFlagEditorProps {
  personId: string;
  /** Nuvarande flagga ur detalj-cachen (`null` = ingen satt). */
  flagga: string | null;
  /** Personens visningsnamn (TASK-201.4, AKTIVITETSLOGGEN) — klient-lokalt
   * underlag för `recordActivity`s objekt-namn, aldrig skickat till servern. */
  personNamn: string | null;
}

/**
 * Edit-in-place för `Personer.Flagga` (S103, Marcus GO 2026-08-10 — ordagrant:
 * "det ska vara en flagga som Lotta själv skriver i fritext, som sedan blir en
 * flaggikon på personen då möjligtvis"). Read-by-default; "Redigera" → ett
 * enradigt textfält med explicit Spara/Avbryt. Optimistisk write via
 * `useUpdatePersonFlag` (mall: `PersonNoteEditor`/`useUpdatePersonNote`,
 * ADR-016/050/055), anpassad till samma enskilt-record-cache.
 *
 * FRITEXT MED AVSIKT: `Input` (enradig), inte ett urval — flaggan ska kunna
 * säga vad Lotta vill, inte välja ur en lista (samma skäl `update-person-flag`-
 * operationens kommentar bär). Ersätter `Manuella flagga` (den gamla
 * singleSelect:en med `choices=[]` som aldrig kunde sättas).
 *
 * Tillgänglighet (11/11/11):
 * - `Input`-primitivens EGNA label/aria/fel-wiring (React Aria TextField) —
 *   ingen manuell `useId`/`for`-koppling behövs (till skillnad mot
 *   `PersonNoteEditor`s råa `<textarea>`, som föregick primitiven).
 * - Spara = KNAPP (Enter i fältet skulle annars kunna submitta ett omslutande
 *   formulär oavsiktligt); Esc = Avbryt.
 * - Optimistiskt: Spara lämnar edit-läget direkt → read-vyn visar cache-värdet
 *   utan att vänta på nätverket. Vid fel återgår vi till edit-läget med
 *   användarens text bevarad (ingen input tappas).
 * - Fel-yta: `MessageBox` `role="alert"` (assertiv) ur `mutation.error`.
 * - Fokus-retur (WCAG 2.4.3): edit-start → fältet (`autoFocus`); spara/avbryt/
 *   fel → "Redigera"-knappen respektive fältet igen (via `ref`, S103-tillägget
 *   till `Input`-primitiven).
 */
export function PersonFlagEditor({ personId, flagga, personNamn }: PersonFlagEditorProps) {
  const mutation = useUpdatePersonFlag(personId, personNamn);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const editButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Vart fokus ska flyttas EFTER att `isEditing` ändrats (DOM uppdaterad).
  const focusTarget = useRef<'button' | 'input' | null>(null);

  useEffect(() => {
    if (focusTarget.current === 'input' && isEditing) {
      inputRef.current?.focus();
      focusTarget.current = null;
    } else if (focusTarget.current === 'button' && !isEditing) {
      editButtonRef.current?.focus();
      focusTarget.current = null;
    }
  }, [isEditing]);

  function startEdit() {
    setDraft(flagga ?? '');
    mutation.reset();
    focusTarget.current = 'input';
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
    // cache-värdet, så read-vyn visar nya flaggan utan network-wait.
    focusTarget.current = 'button';
    setIsEditing(false);
    mutation.mutate(attempted, {
      onError: () => {
        // Rollback sker i hooken. Återgå till edit-läget med användarens text
        // bevarad så hen kan försöka igen utan att tappa input.
        setDraft(attempted);
        focusTarget.current = 'input';
        setIsEditing(true);
      },
    });
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      save();
    }
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-2">
        {/* INGEN EGEN ETIKETT HÄR. Läsläget saknade en fram till 2026-08-12
            (en satt flagga renderades som naken textmassa med en
            "Redigera"-knapp under, mitt i "Just nu"-kortet) och fick en
            samma dag — men vid ombyggnaden senare samma dag flyttade
            komponenten till ett EGET block vars `<h2>Flagga</h2>` bär
            etiketten. Två skulle vara en dubblett. Flyttas komponenten
            tillbaka in i ett delat kort måste etiketten återinföras. */}
        {flagga ? (
          <p className="text-small">{flagga}</p>
        ) : (
          <p className="text-small text-text-muted">Ingen flagga.</p>
        )}
        <div>
          {/* `aria-label` bär den fulla handlingen (WCAG 2.5.3: den synliga
              texten "Redigera" ingår i namnet) — en skärmläsare som listar
              sidans knappar får annars ett ensamt "Redigera" utan objekt. */}
          <Button
            ref={editButtonRef}
            intent="secondary"
            size="sm"
            aria-label="Redigera flagga"
            onPress={startEdit}
          >
            Redigera
          </Button>
        </div>
      </div>
    );
  }

  const requestId =
    mutation.error instanceof EdgeFunctionError ? mutation.error.requestId : undefined;
  const errorId = 'person-flag-editor-error';

  return (
    <div className="flex flex-col gap-2">
      <Input
        ref={inputRef}
        label="Flagga"
        value={draft}
        onChange={setDraft}
        onKeyDown={onInputKeyDown}
        isInvalid={mutation.isError}
        aria-describedby={mutation.isError ? errorId : undefined}
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
          <MessageBox intent="error" title="Kunde inte spara flaggan">
            Försök igen.{requestId ? ` Fel-ID: ${requestId}.` : ''}
          </MessageBox>
        </div>
      )}
    </div>
  );
}
