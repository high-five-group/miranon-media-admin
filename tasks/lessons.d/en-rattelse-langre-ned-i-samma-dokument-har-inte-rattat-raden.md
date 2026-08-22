# En rättelse som står längre ned i samma dokument har inte rättat raden

**[UNIVERSAL] Ett dokument som bokför en korrigering i ett senare avsnitt men
lämnar den felaktiga raden orörd är inte rättat — det är självmotsägande.
Läsaren, människa eller agent, landar på raden och citerar den; ingen söker
igenom resten av dokumentet efter en dementi. Rättelsen hör hemma VID raden. En
not någon annanstans är en anteckning om felet, inte en åtgärd mot det.**

Instans (S109, 2026-08-22): Del 7 utpekade `ADR-122` som personregistrets
beslut. Numret hade en parallell session redan tagit för eventlänkens vakt
(`#1684`); personregistret blev `ADR-123`. Samma dokument bokförde kollisionen
**två gånger längre ned** — Del 9 § Numrering, verbatim: *"`ADR-122` togs av
S110 under passet; registret blev 123"* — men Del 7:s rad rättades aldrig. En
agent som stängde `TASK-283.1` hämtade raden och var på väg att skriva in en ADR
om Airtable-automation A1 i ett kort som stängs för gott. Den mätte mot
git-historiken, upptäckte förväxlingen och flaggade i stället för att bygga
vidare.

**Varför formen är särskilt förrädisk:** dokumentet var inte okunnigt om felet.
Det VISSTE, och skrev ned det. Kunskapen fanns i artefakten och saknade ändå
verkan, eftersom den låg på fel rad. Ett självmotsägande dokument är farligare
än ett felaktigt, för det ser granskat ut.

**Kontexten stärker regeln:** samma pass räknade **fem** fel i bokföringen och
**noll** i koden — ett manifest som citerade en text koden ersatt, `kallor` som
pekade på boundaryn i stället för formen, copy låst på fel yta. Koden var rätt
hela tiden; kartan över koden drev. Ju mer arbete som bärs av kartor — manifest,
kort, sessionsdok — desto större andel av kvalitetsarbetet ligger i att hålla
kartorna sanna, inte i att hålla koden rätt. Det är en resursfördelning värd att
göra medvetet.

**Operativt:** upptäcker du att en tidigare rad är fel — rätta raden, i samma
commit som du noterar felet. Är raden historik som inte får skrivas om, låt den
bära rättelsen på plats (*"Rättat ÅÅÅÅ-MM-DD: raden ovan sade X; det är Y, och
här är skälet"*), aldrig bara en not i ett senare avsnitt. Det var precis den
formen som slutligen användes här, och den kostade en rad.

Släkt: `L437` (en stängning som inte bryter ALLA ytor som bär posten återuppstår
som öppen) — samma rot, där mellan ytor, här inom en enda.
