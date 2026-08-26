# Playwright-bevis för "fönstret navigerar till URL X" — servera INTE `application/pdf`

**Ska ett Playwright-test bevisa att ett fönster/en flik NAVIGERAR till en
given URL (`page.url()`/`waitForURL`), och destinationen i skarp drift är en
PDF: mocka svaret med en ofarlig content-type (`text/plain`/`text/html`),
aldrig `application/pdf` — och läs `.url()` via `expect.poll`, inte
`waitForURL`s `load`-event.** `[UNIVERSAL]`

Mätt konkret (TASK-309.26, `dokument-generering-fonster-direkt.acceptance.
test.ts`): ett test som öppnade ett fönster synkront (`window.open('',
'_blank')`) och sedan satte dess `location.href` till en MSW-mockad URL som
svarade med `content-type: application/pdf` föll deterministiskt med
`page.waitForURL: net::ERR_ABORTED; maybe frame was detached?` — och även
efter att `waitForURL` byttes mot `expect.poll(() => nyFlik.url())` stod
`.url()` fortfarande kvar på `about:blank`, aldrig destinationen.

**Orsaken är Chromes inbyggda PDF-visare, inte testkoden eller appkoden.**
En navigering till en `application/pdf`-resurs hanteras av en egen
MimeHandlerView (samma mekanism som gör att en vanlig flik "byter om" till
PDF-visarens UI) — det avbryter den normala navigationslivscykeln Playwright
följer via CDP, och varken `load`-eventet eller `Page.url()` uppdateras
tillförlitligt för den ursprungliga frame:n. Detta är samma felklass som
gör att riktiga PDF-nedladdningar ofta hanteras som `download`-events i
Playwright i stället för navigeringar — men den kopplingen syns inte förrän
man faktiskt provar, eftersom felmeddelandet ("frame was detached") pekar på
frame-livscykeln, inte på content-type.

**Fixen kostade två misslyckade körningar innan den hittades:** första
försöket bytte content-type till `application/pdf` med en fejk-PDF-kropp
(föll på `waitForURL`); andra försöket bytte `waitForURL` mot `expect.poll`
men behöll `application/pdf` (föll fortfarande, samma orsak — problemet var
aldrig eventet, det var content-typen). Tredje försöket bytte content-type
till `text/plain` och behöll `expect.poll` — grönt direkt, tre gånger i rad.

**Vad testet FAKTISKT ska bevisa avgör om detta är en genväg eller ett
fusk.** Ett UI-test som verifierar "fönstret navigerar till rätt URL" bryr
sig om navigeringen, inte om PDF-renderingen — den delen hör hemma i
EF-/API-sviten (samma dokumentklass-gräns som `acceptance-bas.ts` § VAD
KLASSEN BEVISAR redan drar). Att servera `text/plain` i stället för en riktig
PDF-kropp är alltså inte att testa fixturen — det är att undvika en
webbläsar-egenhet som inte hör till det testade beteendet.
