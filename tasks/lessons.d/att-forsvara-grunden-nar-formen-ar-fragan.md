# Att försvara grunden när formen är frågan

Marcus dömde ut uppdateringsbannern: *"trycker ner innehållet, en
långtextsträng och en centrerad knapp."* Jag svarade med att bannerns
a11y-grund var gedigen — vilket var sant — och lade formfrågan som en fotnot
("är det rätt plats?").

Han kom tillbaka: *"Detta kan vi ju inte acceptera som 'Proffsigt'. Eller tycker
du verkligen det?"*

**Felet var inte att jag hade fel om a11y.** Det var att jag svarade på en fråga
han inte ställt, och nedgraderade den han ställde. Komponenten hade
`role="status"`, korrekt live-region-hantering, `prefers-reduced-motion`,
`print:hidden` — allt rätt. Och den såg ändå dålig ut.

**Regeln:** när någon dömer ut FORMEN, är ett försvar av FUNKTIONEN inte ett
svar. Två saker kan vara sanna samtidigt: att grunden är gedigen och att
resultatet inte duger. Att peka på den ena för att slippa den andra är att
byta ämne.

Mätningen gav honom rätt i efterhand: CLS 0,0335–0,1469 per visning, och på
390 px spränger en enda visning hela prestandabudgeten.

Instans: S107 2026-08-20.
