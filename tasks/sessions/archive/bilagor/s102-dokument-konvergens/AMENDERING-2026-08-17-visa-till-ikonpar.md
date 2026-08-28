# Amendering 2026-08-17 — Visa-dialogen ersatt av ikonpar + ny flik (TASK-273.4)

> Denna sidofil finns för att `facit.json` är AGENT-FRUSEN: ADR-104-hooken
> nekar varje agent-Edit mot ett manifest vars `godkand` är satt (samma
> mekanism som `AMENDERING-2026-08-15-verbcopy.md` i
> `tasks/sessions/archive/bilagor/s55-hem-konvergens/` dokumenterar).
> Inbakningen i manifestets not-fält är ett MARCUS-moment via `!`-kanalen
> (ADR-104 beslut 2) — tills den gjorts är DENNA fil amenderingens durabla
> bärare, refererad från TASK-273.4. `godkand`-fältet i `facit.json` är INTE
> rört av denna commit.

**Yta:** Dokument-ytan `/mer/dokument` — listan + Visa-overlayens tre
klasser (`facit.json`s enda `ytor`-post, godkänd 2026-08-16, källor
`src/components/dokument/DokumentYta.tsx` m.fl.).

**Avvikelse (Marcus-grund, `TASK-273` PRD-beskrivningens punkt 5 av fem
prod-granskningsfynd 2026-08-17: *"dokument-ytans inbyggda förhandsvisning
är för liten för att läsa — Lotta behöver full flik eller nedladdning"* —
samma PRD § Implementationsbeslut: *"Dokument-ytans Visa-knapp ersätts av
två ikonknappar per rad: förhandsvisning (öppnar i NY flik …) och
nedladdning"*):

Visa-dialogen (`BilagaVisaKnapp`/`GenereradPdfVisaKnapp`, den `<iframe>`/
`<img>`-inbäddade förhandsvisningen facit-bilderna
`facit-dokument-visa-*-desktop.png` visar) är RIVEN. Varje dokumentrad —
samtliga tre klasser — bär i stället två ikonknappar (`Eye`/`Download`,
`DokumentAtgardsKnappar` i `DokumentYta.tsx`):

- **Förhandsvisa** öppnar dokumentet i en RIKTIG ny webbläsarflik
  (webbläsarens egen PDF-/bildvisare) i stället för i en dialog inbäddad i
  appen. Popup-blockerar-säkert: `window.open('', '_blank')` synkront i
  klick-handlern, adressen sätts när den asynkrona hämtningen (signerad
  URL för klass A, transient PDF-generering för klass B/C) är klar.
  Bevisat i ett skarpt Chrome-beteendetest INNAN huvudbygget
  (TASK-273.4 AC #1, throwaway, kastat efter passet).
- **Ladda ner** sparar filen direkt (ingen flik) — en dold `<a download>`-
  länk klickas programmatiskt. Klass A får en `download`-query-parameter
  klistrad på den redan signerade URL:en (verifierat live mot staging att
  Storage-servern då svarar med en riktig `Content-Disposition:
  attachment`-header, ingen ändring av `get-attachment-download-url`-EF:en
  krävd).

Listformen (filter, radernas namn/meta/klass, "Ersätt"-knappen för
bilagor, uppladdningsknappen) är I ÖVRIGT OFÖRÄNDRAD mot det godkända
facit-manifestet — avvikelsen är avgränsad till Visa-beteendet.

**Vad som INTE är amenderat:** de fem facit-bilderna i denna katalog visar
fortfarande den gamla Visa-dialogen (`facit-dokument-visa-bilaga-desktop.png`
m.fl.) — de blir missvisande för just Visa-beteendet efter denna ändring.
Nya bilder tas INTE av denna skiva (utanför TASK-273.4:s scope); en framtida
facit-omtagning bör ersätta de tre Visa-bilderna med skärmdumpar av
ikonparet, alternativt riva dem om Visa-overlayen inte längre är en egen
visuell yta att facit-låsa.

**Väntar på Marcus omstämpling** (ADR-104 beslut 1–2, `!`-kanalen) —
`godkand`-fältet i `facit.json` rörs INTE av denna agent.
