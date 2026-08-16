// @ts-nocheck — Deno Edge Function shared module (esm.sh-import + Deno-
// globaler; typas vid deploy av `deno check`/`deno lint`, se ADR-010 § Fas
// 7-åtagande). Samma undantags-mönster som övriga _shared-filer som körs i
// Deno-runtimen.
//
// Kvittots PDF-RENDERING (TASK-246) — bruten ut ur send-receipt-email/
// index.ts § makeRealPdfBuilder (TASK-147.7) så att förhandsvisnings-EF:en
// (preview-receipt, klass C) kan ÅTERANVÄNDA EXAKT samma pdf-lib-layout i
// stället för att duplicera pdf-lib-anropen — samma "gissa aldrig, kopiera
// aldrig det som redan finns"-disciplin som resten av bilage-fundamentet
// (t.ex. `toBase64`s egen utbrytningshistorik, se _shared/attachments.ts §
// docblock).
//
// `_shared/receipt-content.ts` (kvittoRader) FÖRBLIR REN och Node+Deno
// dual-importable (den filens eget filhuvud: "ingen Deno-global, inget
// pdf-lib-beroende här") — pdf-lib (Deno-only, esm.sh) hör hemma HÄR, i en
// EGEN fil, inte där. `renderKvittoPdf` nedan tar de FÄRDIGA raderna
// (kvittoRader-utdata) och vet ingenting om VAR de kom ifrån — en riktig
// sändning (send-receipt-email) och en sidoeffektsfri förhandsvisning
// (preview-receipt) delar SAMMA renderare, olika indata.

import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

/**
 * Renderar kvittots rader (i visningsordning, `kvittoRader`-utdata) till
 * PDF-bytes. REN funktion — inget I/O, ingen Airtable/Storage/Resend-
 * beröring. Layouten är IDENTISK med den som tidigare låg inline i
 * send-receipt-email/index.ts § makeRealPdfBuilder (samma sidstorlek,
 * samma Helvetica-font, samma rad-1-är-rubrik-storlek).
 */
export async function renderKvittoPdf(rader: readonly string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 420]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  let y = 380;
  const draw = (text: string, size: number, dy: number) => {
    if (text.length > 0) {
      page.drawText(text, { x: 40, y, size, font });
    }
    y -= dy;
  };

  for (const [i, rad] of rader.entries()) {
    draw(rad, i === 0 ? 18 : 12, i === 0 ? 26 : 18);
  }

  return doc.save();
}
