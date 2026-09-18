---
owner: bygg-agent
updated: 2026-09-19
status: throwaway
---

# TASK-464.2 — engångsverifikation av D0-hoppet (kastas, mergas aldrig)

Denna fil finns bara för att producera ett rent D0-only-diff mot grenen
`ci/task-464-2-codeql-advanced-setup` (som redan bär `codeql.yml`), så att
AC #2:s kontrastpar ("en ren D0-ändring startar ingen CodeQL-körning; en
kodändring gör det") kan mätas med ett `paths-ignore`-block som INTE också
måste bära resten av PR:ens icke-D0-diff. Grenen och den nästlade PR:en
raderas/stängs utan merge så snart run-ID:t är avläst.
