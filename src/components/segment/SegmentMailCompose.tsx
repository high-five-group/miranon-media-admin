import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Dialog } from '@/components/primitives/Dialog';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Select, SelectItem } from '@/components/primitives/Select';
import { TextArea } from '@/components/primitives/TextArea';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { MailPayload, MailSendResult } from '@/domain/models/MailPayload';
import { queryKeys } from '@/queries/keys';

/**
 * Skicka-mail-på-segment-yta (Fas 6h L3, ADR-067) — monterad i SegmentBuilder. Lotta
 * väljer ETT sparat segment, skriver ämne + mailtext, ser mottagar-antalet, bekräftar
 * och skickar. Send är en OÅTERKALLELIG bulk-handling → UI:t är PESSIMISTISKT (ingen
 * optimistisk flip; knapp disabled in-flight; pending → resultat), bakom en
 * bekräftelse-modal, med en STABIL idempotens-nyckel som återanvänds vid retry/
 * dubbelklick och bara byts vid en NY send-avsikt (efter lyckad sändning).
 *
 * KONTRAKT (ADR-067): segmentIds = SPARADE Segment-record-ID — EF:en löser upp
 * mottagarna SERVER-SIDE (aldrig en klient-byggd lista) och äger consent-filtret
 * (D5). Klienten VISAR serverns utfall (sänt / undertryckt-consent / undertryckt-
 * ingen-epost / avvisat), den filtrerar aldrig själv. Mottagar-antalet före send
 * räknas via compute-segment på segmentets egen regel (samma full-walk som
 * SegmentBuilder, on-demand vid val — aldrig per tangenttryck).
 *
 * A11y: egen <h2>, fält-validering via primitivernas isInvalid (aria-invalid +
 * FieldError), resultat/fel i aria-live-region (aria-busy under sändning), modal
 * bär fokus-trap + Escape + fokus-retur (react-aria).
 */
export function SegmentMailCompose() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState('');
  const [amne, setAmne] = useState('');
  const [mailtext, setMailtext] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Stabil idempotens-nyckel: en per send-avsikt, återanvänd över retries (dubbelklick,
  // 5xx-retry). Byts FÖRST vid en ny avsikt (efter lyckad sändning), aldrig per klick.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const segments = useQuery({
    queryKey: queryKeys.segment.saved,
    queryFn: () => dataSource.listSegments(),
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const selectedSegment = segments.data?.find((s) => s.id === selectedId);

  // Mottagar-antal för det valda segmentet (compute-segment på dess egen regel).
  // Enbart aktiv när ett segment är valt; per-segment-cachad så om-val inte re-walkar.
  const recipients = useQuery({
    queryKey: queryKeys.segment.sendRecipients(selectedId),
    queryFn: () => dataSource.computeSegment(selectedSegment?.rule ?? { include: [], exclude: [] }),
    enabled: selectedSegment !== undefined,
    staleTime: 5 * 60_000,
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: MailPayload) => dataSource.sendEmail(payload),
    onSuccess: () => {
      // Utskicksloggen har en ny rad → invalidera så maillogg-vyn refetchar.
      queryClient.invalidateQueries({ queryKey: queryKeys.maillog.all });
      // Ny send-avsikt nästa gång → färsk nyckel (denna sändning är slutförd).
      setIdempotencyKey(crypto.randomUUID());
    },
  });

  const amneValid = amne.trim() !== '';
  const mailtextValid = mailtext.trim() !== '';
  const segmentValid = selectedId !== '';
  const countReady = recipients.data !== undefined && !recipients.isPending;
  const recipientCount = recipients.data?.count;
  // Ett sparat segment vars regel just nu beräknar 0 medlemmar → ingen att skicka till.
  // Blockeras client-side (slipper round-trip; servern hade ändå svarat 'skipped').
  const noRecipients = countReady && (recipientCount ?? 0) === 0;
  const canSend = segmentValid && amneValid && mailtextValid && (recipientCount ?? 0) > 0;

  function handleOpenConfirm() {
    setSubmitted(true);
    // Klient-validering före send (servern förblir SSOT) + antalet måste vara känt
    // så bekräftelsen kan visa "skicka till N".
    if (!canSend || !countReady || sendMutation.isPending) return;
    setConfirmOpen(true);
  }

  function handleConfirmSend() {
    sendMutation.mutate({
      amne: amne.trim(),
      mailtext,
      segmentIds: [selectedId],
      idempotencyKey,
    });
  }

  const result: MailSendResult | undefined = sendMutation.data;

  return (
    <div className="flex flex-col gap-3 border-text-muted/20 border-t pt-4">
      <h2 className="font-medium text-lg">Skicka mail till ett segment</h2>
      <p className="text-small text-text-muted">
        Välj ett sparat segment, skriv ämne och meddelande, och skicka. Du får se hur många
        mottagare segmentet har innan du bekräftar.
      </p>

      <Select
        label="Segment att skicka till"
        placeholder={segments.isPending ? 'Laddar segment…' : 'Välj ett sparat segment'}
        selectedKey={selectedId || null}
        onSelectionChange={(k) => {
          setSelectedId(String(k));
          setSubmitted(false);
        }}
        isRequired
        isDisabled={sendMutation.isPending || segments.isPending}
        isInvalid={submitted && !segmentValid}
        errorMessage="Välj ett segment att skicka till."
      >
        {(segments.data ?? []).map((s) => (
          <SelectItem key={s.id} id={s.id}>
            {s.namn ?? '(namnlöst segment)'}
          </SelectItem>
        ))}
      </Select>

      {segments.isError && (
        <MessageBox intent="error" title="Kunde inte hämta sparade segment">
          {segments.error instanceof Error ? segments.error.message : 'Okänt fel.'}
        </MessageBox>
      )}

      {/* Mottagar-antal — synligt FÖRE send (annonseras artigt). */}
      {selectedSegment && (
        <div aria-live="polite" aria-busy={recipients.isPending}>
          {recipients.isPending && <p className="text-small text-text-muted">Räknar mottagare…</p>}
          {recipients.isError && !recipients.isPending && (
            <MessageBox intent="error" title="Kunde inte räkna mottagare">
              {recipients.error instanceof Error ? recipients.error.message : 'Okänt fel.'}
            </MessageBox>
          )}
          {noRecipients && (
            <MessageBox intent="warning" title="Inga mottagare">
              Det här segmentet har inga mottagare just nu — det går inte att skicka ett utskick.
            </MessageBox>
          )}
          {countReady && !noRecipients && (
            <p className="text-body">
              Det här segmentet har <strong>{recipientCount}</strong>{' '}
              {recipientCount === 1 ? 'person' : 'personer'}. En del kan undertryckas av servern
              (saknar e-post eller har tackat nej till utskick).
            </p>
          )}
        </div>
      )}

      <Input
        label="Ämne"
        value={amne}
        onChange={setAmne}
        isRequired
        isDisabled={sendMutation.isPending}
        isInvalid={submitted && !amneValid}
        errorMessage="Ange ett ämne."
      />

      <TextArea
        label="Meddelande"
        value={mailtext}
        onChange={setMailtext}
        rows={8}
        isRequired
        isDisabled={sendMutation.isPending}
        isInvalid={submitted && !mailtextValid}
        errorMessage="Skriv ett meddelande."
      />

      <Button
        intent="primary"
        onPress={handleOpenConfirm}
        isDisabled={
          sendMutation.isPending || noRecipients || (submitted && (!canSend || !countReady))
        }
      >
        {sendMutation.isPending ? 'Skickar…' : 'Skicka utskick…'}
      </Button>

      {/* Bekräftelse-modal (oåterkallelig handling). Kontrollerad open-state så
          validering körs FÖRE öppning; react-aria bär fokus-trap/Escape/fokus-retur. */}
      <Modal isOpen={confirmOpen} onOpenChange={setConfirmOpen} isDismissable>
        <Dialog
          title="Skicka utskick?"
          aria-description="Bekräfta att mailet ska skickas till segmentets mottagare. Handlingen kan inte ångras."
          actions={({ close }) => (
            <>
              <Button intent="ghost" onPress={close}>
                Avbryt
              </Button>
              <Button
                intent="primary"
                onPress={() => {
                  handleConfirmSend();
                  close();
                }}
              >
                Skicka till {recipientCount} mottagare
              </Button>
            </>
          )}
        >
          <p>
            Du skickar <strong>{amne.trim()}</strong> till{' '}
            <strong>
              {recipientCount} {recipientCount === 1 ? 'person' : 'personer'}
            </strong>{' '}
            i segmentet <strong>{selectedSegment?.namn ?? '(namnlöst segment)'}</strong>. Det går
            inte att ångra. Mottagare som saknar e-post eller har tackat nej tas bort av servern.
          </p>
        </Dialog>
      </Modal>

      {/* Sänd-utfall — annonseras för skärmläsare. Pessimistiskt: värden bevaras,
          knapp åter aktiv vid fel (samma nyckel → retry är säker). */}
      <div aria-live="polite" aria-busy={sendMutation.isPending}>
        {sendMutation.isPending && <p className="text-small text-text-muted">Skickar utskicket…</p>}

        {sendMutation.isError && !sendMutation.isPending && (
          <MessageBox intent="error" title="Kunde inte skicka utskicket">
            {sendMutation.error instanceof Error ? sendMutation.error.message : 'Okänt fel.'}
          </MessageBox>
        )}

        {result && !sendMutation.isPending && !sendMutation.isError && (
          // accepted===0 (noll-leverans: 'skipped' tomt/allt-undertryckt ELLER 'failed'
          // allt-avvisat) renderas ALDRIG som grön framgång — neutral varning + breakdown
          // som visar VARFÖR. accepted>0 behåller sent→success / partial→info oförändrat.
          <MessageBox
            intent={
              result.accepted === 0 ? 'warning' : result.status === 'partial' ? 'info' : 'success'
            }
            title={
              result.accepted === 0
                ? 'Inga mottagare fick mailet'
                : result.status === 'partial'
                  ? 'Utskicket skickades delvis'
                  : 'Utskicket skickades'
            }
          >
            {result.accepted > 0 && (
              <p>
                <strong>{result.accepted}</strong> mottagare fick mailet.
              </p>
            )}
            {result.suppressedConsent > 0 && (
              <p>{result.suppressedConsent} togs bort (har tackat nej till utskick).</p>
            )}
            {result.suppressedNoEmail > 0 && (
              <p>{result.suppressedNoEmail} togs bort (saknar e-post).</p>
            )}
            {result.rejected > 0 && <p>{result.rejected} kunde inte levereras.</p>}
          </MessageBox>
        )}
      </div>
    </div>
  );
}
