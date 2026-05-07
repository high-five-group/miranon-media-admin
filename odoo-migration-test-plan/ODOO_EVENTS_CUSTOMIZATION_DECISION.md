# Odoo Events Customization Decision

## Rekommendation

Odoo Events verkar tillräckligt anpassningsbart för ett första Miranon-test utan custom code, men inte bevisat som komplett ersättare förrän faktisk Odoo-instans, importfält, mailneutralisering och POC har verifierats.

## Svar

1. Kan Odoo Events skräddarsys? Ja, på flera nivåer: standard, Website, Studio, import/API och custom modules.
2. Vad betyder skräddarsy i Odoo? Oftast konfigurera och ärva/utöka, inte skriva om appen.
3. Hur långt kommer man i Odoo Online? Standardappar, Website, Studio/no-code och import/export; inte custom modules.
4. Hur långt kommer man med Studio? Fält, vyer, automationer, webhooks, PDF/approval/security enligt docs, men plan/access måste verifieras.
5. Hur långt kommer man med API/middleware? Långt för integration och migration om Custom plan/API finns.
6. Vad kräver Odoo.sh? Custom modules, shell/SSH och mer kodnära drift.
7. Behöver man skriva om hela Events? Nej. Det bör undvikas.
8. När bör man inte skriva om Events? När gapet kan lösas med config, Studio, import eller extern middleware.
9. Miranon-strategi: standard Events + Website + templates + gratis anmälan först; Studio/API senare; Odoo.sh bara efter verifierat gap.

## Fem Tester Först

1. Event template.
2. Website publish/SEO.
3. Gratis registration med fake attendee.
4. Registration questions.
5. Manual check-in/barcode.

## Varningssignaler Att Odoo Inte Räcker

- Sessions-/närvaromodellen går inte att representera utan stor custom code.
- Public event page blir klart sämre än Shopify.
- Import/export saknar idempotent och begriplig relationell hantering.
- Mail/fakturering kan inte testas säkert.
- Studio/custom plan blir dyr/komplex innan basflödet är bevisat.

## Varningssignaler Att Hybrid Är Bäst

- Odoo är starkt för backend/registrering men svagt för publik frontend.
- Airtable-historiken är mer komplex än Odoo-standard.
- Custom webappen behövs för Lottas dagliga specialflöden.
- Shopify fortsätter vara bäst som publik butik/content.
- Odoo kan användas som delsystem snarare än total ersättare.
