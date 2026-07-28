# En grind som inte prövar orsaken tar emot fel bevis [UNIVERSAL]

**Ett negativt bevis måste kräva att fällningen kom från rätt mekanism. Kräver
det bara att något föll, godkänner det varje trasig assertion, timeout och
syntaxfel som bevis för det som skulle bevisas.**

**Empiri (S91, 2026-07-28, `TASK-60`):** hermetikens andra led — att fixturens
svar faktiskt bär testerna — skulle mekaniseras. Den självklara formen var
Playwrights `test.fail()`, och tråden som beställde arbetet pekade dit. Den
förkastades: annotationen kontrollerar **att** ett test fälls, aldrig **varför**.
Ett test som gick sönder av ett stavfel i en selektor hade passerat grinden och
räknats som bevis för att appen hänger på fixturvärlden.

Grinden kräver i stället `OmockadRequestError` — vaktens egen felklass — i vart
och ett av de 51 testerna. Skillnaden är inte teoretisk: mätningen som föregick
beslutet visade 51 fällda **och** 51 med vakten som primär orsak, noll timeouts.
Först den andra siffran gör utfallet till ett hermetik-bevis.

**Samma form finns redan i repot:** `gate-proof.yml` bevisar merge-grindens
FAIL-gren genom att göra grindens utfall till leveransen — och bär en negativ
kontroll, eftersom ett grönt besked från en grind som inte kan fälla är
oskiljbart från ett äkta.

**Två följdregler som föll ur samma arbete:**

- **Fail-closed på tomhet.** Villkoret *"alla tester fälldes"* är vakuöst sant
  för noll tester. Ett felstavat projektnamn eller en flyttad testkatalog hade
  gett grönt utan att ett enda test kört. Tomhet ska vara rött.
- **Mät före du väljer form.** Att *alla* tester fälls var inte en förhoppning
  utan ett mätt utfall. Hade något test överlevt legitimt vore villkoret fel
  form från början — och det hade upptäckts först när grinden var byggd.

**Motmedlet:** när ett negativt bevis konstrueras, fråga inte *"blev det rött?"*
utan *"kan detta bli rött av fel skäl och ändå passera?"*
