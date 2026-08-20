# Ett tyst verktyg ser likadant ut som ett verktyg utan fynd

**[UNIVERSAL]**

Sentry visade noll fel i 3,5 månader. Det lästes som "appen är stabil". Det
betydde att `initSentry()` returnerade direkt vid varje sidladdning, eftersom
DSN:en låg i fel system (Supabase-hemlighet i stället för Vercel-byggvariabel).

**Felklassen:** ett övervakningsverktyg som inte når fram producerar exakt samma
utdata som ett verktyg som inte hittar något. Noll är tvetydigt, och tvetydigheten
löses inte av att titta längre.

Samma dag träffade samma klass två gånger till:

- **Flake-riggen** (`T148`) körde mot fel dev-server och producerade 66 falska
  fällningar — en komplett, välformad mätserie utan någon signal om att servern
  aldrig nåddes.
- **Chromes ikoncache** såg ut som en app utan uppdatering, medan den i själva
  verket aldrig laddade ner något att jämföra med.

**Regeln:** för varje verktyg som rapporterar frånvaro — noll fel, noll träffar,
inga avvikelser — måste det finnas ett sätt att skilja "inget att rapportera"
från "rapporteringen är trasig". Ett röktest som medvetet framkallar det
verktyget ska fånga är den billigaste formen.

Utan röktestet hade vi gissat "stabil app" och haft fel i tre månader till.

Instans: S107 2026-08-20, `T151`. Röktestet avgjorde på trettio sekunder vad två
timmars resonemang inte kunde.
