# Current State Analysis

## Repo Och Stack

`package.json` beskriver projektet som en privat React-admin för Miranon Media ovanpå Airtable och Supabase. Stacken är React 19, Vite, TypeScript, Supabase, TanStack, Tailwind v4, Biome och Playwright.

## Datamodell

`docs/reference/data-model.md` är auktoritativ lokal källa. Den verifierar:

- Airtable base `app8uGPrVCVOm6LfD`.
- 18 tabeller och 358 fält per 2026-04-28.
- Kärntabeller: `Eventplanering`, `Anmälningar`, `Personer`, `Deltaganden`.
- Stödtabeller: `Väntelista`, leads/erbjudanden/engagemang/touchpoints, mail/segment/loggar m.m.
- Statusar för `Anmälningar`, `Eventplanering` och `Deltaganden`.
- Viktig distinktion: Anmälan är löfte; Deltagande är faktisk närvaro.

## Publik Webb

Publik läsning av `miranon.se` visar:

- Shopify-lik webbnärvaro med cart/payment-signaler.
- Eventplanering där besökare reserverar plats och får bekräftelse via e-post.
- Utbildningar: Fjärrskådning och Resor i Medvetandet 1/2/3.
- Föreläsningar och inspelade sessioner.
- Bok/förlag/meditationer och kontaktuppgifter.

## Nuvarande Flöden

Från `hur-systemet-funkar.md`:

1. Webbformulär skapar anmälan.
2. Airtable automation kopplar event och person.
3. Deltaganden-rader skapas per session.
4. Närvaro markeras senare.
5. Rapportering bygger på deltaganden/närvaropoäng.

## Ej Verifierat

- Faktiska aktuella radantal.
- Faktiska Airtable-exporter.
- Faktiska Odoo-appar/fält.
- Formulärens bakomliggande fält och externa tjänster från publik webb.
