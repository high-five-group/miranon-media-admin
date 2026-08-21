import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Dialog } from '@/components/primitives/Dialog';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Select, SelectItem } from '@/components/primitives/Select';
import { TextArea } from '@/components/primitives/TextArea';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useSendSegmentMail } from '@/data/mutations/segment';
import { useDataSource } from '@/data/useDataSource';
import type { MailSendResult } from '@/domain/models/MailPayload';
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

  const [selectedId, setSelectedId] = useState('');
  const [amne, setAmne] = useState('');
  const [mailtext, setMailtext] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Skriv-för-att-bekräfta: användaren måste skriva mottagar-antalet för att låsa upp
  // faro-knappen (GitHub type-to-confirm). Nollställs vid varje modal-öppning/-stängning
  // → inget läckage mellan försök. Rör ALDRIG idempotens-nyckeln.
  const [confirmText, setConfirmText] = useState('');

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

  // Mutationen extraherad till `useSendSegmentMail` (TASK-201.15,
  // hemvistsluckan — se hookens docblock i `segment.ts` för aktivitetslogg-
  // designet, prövat mot EF:ens faktiska svar). Beteendet i övrigt
  // oförändrat: samma onSuccess-invalidering av maillogg-cachen.
  const sendMutation = useSendSegmentMail();

  const amneValid = amne.trim() !== '';
  const mailtextValid = mailtext.trim() !== '';
  const segmentValid = selectedId !== '';
  const countReady = recipients.data !== undefined && !recipients.isPending;
  const recipientCount = recipients.data?.count;
  // Ett sparat segment vars regel just nu beräknar 0 medlemmar → ingen att skicka till.
  // Blockeras client-side (slipper round-trip; servern hade ändå svarat 'skipped').
  const noRecipients = countReady && (recipientCount ?? 0) === 0;
  const canSend = segmentValid && amneValid && mailtextValid && (recipientCount ?? 0) > 0;
  // Upplåsnings-villkor: skriven text === mottagar-antalet (exakt). recipientCount är
  // känt när modalen öppnas (gate:at av countReady) → String-jämförelse är säker.
  const confirmMatch =
    recipientCount !== undefined && confirmText.trim() === String(recipientCount);

  function handleOpenConfirm() {
    setSubmitted(true);
    // Klient-validering före send (servern förblir SSOT) + antalet måste vara känt
    // så bekräftelsen kan visa "skicka till N".
    if (!canSend || !countReady || sendMutation.isPending) return;
    setConfirmText(''); // färskt skriv-fält per ny öppning (inget läckage)
    setConfirmOpen(true);
  }

  function handleConfirmSend() {
    sendMutation.mutate(
      {
        amne: amne.trim(),
        mailtext,
        segmentIds: [selectedId],
        idempotencyKey,
        segmentNamn: selectedSegment?.namn ?? null,
      },
      {
        // Ny send-avsikt nästa gång → färsk nyckel (denna sändning är
        // slutförd). Lokal UI-state → call-site onSuccess (samma mönster
        // som `PersonAnteckningar.tsx`/`Anteckningar.tsx` efter sina
        // motsvarande hook-extraktioner), INTE hookens egen onSuccess —
        // `useSendSegmentMail` äger inget komponent-lokalt state.
        onSuccess: () => setIdempotencyKey(crypto.randomUUID()),
      },
    );
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
          {segments.error instanceof Error ? segments.error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      )}

      {/* Mottagar-antal — synligt FÖRE send (annonseras artigt). */}
      {selectedSegment && (
        <div aria-live="polite" aria-busy={recipients.isPending}>
          {recipients.isPending && <p className="text-small text-text-muted">Räknar mottagare…</p>}
          {recipients.isError && !recipients.isPending && (
            <MessageBox intent="error" title="Kunde inte räkna mottagare">
              {recipients.error instanceof Error
                ? recipients.error.message
                : 'Inget felmeddelande angavs.'}
            </MessageBox>
          )}
          {noRecipients && (
            <MessageBox intent="warning" title="Inga mottagare">
              Det här segmentet har inga mottagare just nu - det går inte att skicka ett utskick.
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
        {sendMutation.isPending ? 'Skickar…' : 'Granska och skicka…'}
      </Button>

      {/* Härdad bekräftelse-modal (oåterkallelig handling) — ETT steg, vertikalt:
          granska överst → skriv-för-att-bekräfta → knappar nederst. Kontrollerad
          open-state så validering körs FÖRE öppning; react-aria bär fokus-trap/
          Escape/fokus-retur. Stängning nollställer skriv-fältet (inget läckage). */}
      <Modal
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmText('');
        }}
        isDismissable
      >
        <Dialog
          title="Granska och skicka utskick"
          aria-description="Granska mottagarantal, segment, ämne och förhandsvisning. Skriv mottagarantalet för att låsa upp sändningen. Handlingen kan inte ångras."
          actions={({ close }) => (
            <>
              {/* Avbryt = tryggt förval, spatialt separerat (mr-auto → motsatt ände
                  från faro-knappen, NN/g destruktiv↔benign). Nås först via Tab. */}
              <Button intent="ghost" onPress={close} className="mr-auto">
                Avbryt
              </Button>
              {/* Faro-knapp: LÅST tills confirmMatch. Native isDisabled (Button-
                  primitiven bär ej ren aria-disabled); upptäckbarhet bärs av den
                  synliga knappen + fält-instruktionen + aria-live-aviseringen nedan.
                  Grön-knapp-regeln (task-18.16): utskicket NÅR UTOMSTÅENDE →
                  success, aldrig danger (danger är destruktions-klassens intent);
                  oåterkallelighets-skyddet bärs av skriv-för-att-bekräfta-
                  grinden + separationen, inte av rött (Bekräfta alla-precedenten). */}
              <Button
                intent="success"
                isDisabled={!confirmMatch || !canSend || sendMutation.isPending}
                onPress={() => {
                  handleConfirmSend();
                  close();
                }}
              >
                Skicka till {recipientCount} {recipientCount === 1 ? 'person' : 'personer'}
              </Button>
            </>
          )}
        >
          <div className="flex flex-col gap-4">
            {/* GRANSKA — mottagar-antalet är den konsekvensbärande variabeln (störst
                visuell vikt, NN/g). */}
            <p className="text-lg">
              Det här skickas till{' '}
              <strong className="text-xl">
                {recipientCount} {recipientCount === 1 ? 'person' : 'personer'}
              </strong>
              .
            </p>
            <dl className="flex flex-col gap-1 text-body">
              <div className="flex gap-2">
                <dt className="text-text-muted">Segment:</dt>
                <dd className="font-medium">{selectedSegment?.namn ?? '(namnlöst segment)'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-text-muted">Ämne:</dt>
                <dd className="font-medium">{amne.trim()}</dd>
              </div>
            </dl>

            {/* FÖRHANDSVISNING — plain text (aldrig HTML-render), pre-wrap, bounded +
                scrollbar. "Se exakt vad som går ut." */}
            <div className="flex flex-col gap-1">
              <span className="text-small text-text-muted">Förhandsvisning av meddelandet</span>
              <div className="max-h-40 overflow-auto whitespace-pre-wrap rounded border border-text-muted/20 bg-(--mm-input-bg-disabled) p-3 text-body">
                {mailtext}
              </div>
            </div>

            <p className="text-small text-text-muted">
              Ett skickat utskick går inte att ångra. Mottagare som saknar e-post eller har tackat
              nej tas bort av servern.
            </p>

            {/* SKRIV-FÖR-ATT-BEKRÄFTA — exakta strängen synlig vid fältet (GitHub-mönstret). */}
            <Input
              label={`Skriv antalet mottagare (${recipientCount}) för att låsa upp utskicket.`}
              value={confirmText}
              onChange={setConfirmText}
              autoComplete="off"
              inputMode="numeric"
              isInvalid={confirmText.trim() !== '' && !confirmMatch}
              errorMessage={`Det matchar inte. Skriv ${recipientCount} för att låsa upp.`}
            />

            {/* Upplåsning aviseras artigt för skärmläsare (region alltid i DOM → ändring
                annonseras). Komplement till den synliga faro-knappens tillståndsbyte. */}
            <p aria-live="polite" className="text-small text-text-muted">
              {confirmMatch
                ? `Rätt antal angivet - knappen "Skicka till ${recipientCount} ${recipientCount === 1 ? 'person' : 'personer'}" är nu upplåst.`
                : ''}
            </p>
          </div>
        </Dialog>
      </Modal>

      {/* Sänd-utfall — annonseras för skärmläsare. Pessimistiskt: värden bevaras,
          knapp åter aktiv vid fel (samma nyckel → retry är säker). */}
      <div aria-live="polite" aria-busy={sendMutation.isPending}>
        {sendMutation.isPending && <p className="text-small text-text-muted">Skickar utskicket…</p>}

        {sendMutation.isError && !sendMutation.isPending && (
          <MessageBox intent="error" title="Kunde inte skicka utskicket">
            {sendMutation.error instanceof Error
              ? sendMutation.error.message
              : 'Inget felmeddelande angavs.'}
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
