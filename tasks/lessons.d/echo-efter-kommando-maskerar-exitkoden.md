# En efterföljande `echo` maskerar kommandots exit-kod för allt som läser sammansatta anropet

**`cmd; echo "EXIT: $?" >> logg` gör det SAMMANSATTA kommandots exit-kod till
`echo`:s, alltså 0 — oavsett vad `cmd` gjorde. Varje lager som läser den yttre
exit-koden (bakgrundsjobbets notifiering, en CI-step, en wrapper) ser grönt
medan det mätta kommandot föll.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27, orkestreringen av `TASK-59`):** en CI-vakt startades
i bakgrunden med formen

```bash
scripts/ci-wait.sh --commit <sha> > logg 2>&1; echo "VAKT-EXIT: $?" >> logg
```

Vakten föll på timeout efter 1800 s och skrev korrekt `VAKT-EXIT: 2` i loggen.
**Bakgrundsjobbets notifiering rapporterade ändå "exit code 0"** — den läste
`echo`:s utfall, inte skriptets.

Utfallet blev harmlöst bara därför att loggen lästes ändå. Hade orkestreraren
litat på notifieringens exit-kod — vilket är hela poängen med att ha en — hade
en 30-minuters timeout passerat som en grön vakt.

**Varför det är lömskt:** mönstret ser ut som extra omsorg. Man skriver ut
exit-koden *för att* göra den synlig, och gör den därmed osynlig ett lager upp.
Ju mer ambitiös loggningen är, desto tystare blir felet.

**Motmedlet:** fånga exit-koden utan att lägga ett nytt kommando sist.

```bash
cmd > logg 2>&1; rc=$?; echo "EXIT: $rc" >> logg; exit "$rc"
```

Det avslutande `exit "$rc"` är hela skillnaden: det ger tillbaka det mätta
kommandots kod till lagret ovanför, samtidigt som loggen behåller den i klartext.

**Samma felklass som fyndet den upptäcktes under:**
[[gh-run-list-commit-kraver-full-sha]] — ett instrument som svarar tyst i stället
för att säga ifrån. Här är det inte biblioteket som tystnar utan anroparens egen
loggnings-form, vilket gör den svårare att se: koden som döljer felet är den man
skrev för att avslöja det.

**Registrerad som kandidat i scratchpad först** (en agent arbetade i repot och
en ostagead fil hade kunnat svepas med i fel commit), landad tillsammans med
nästa stängning. Se [[lesson-kandidat-som-stikkord-overlever-inte-pausen]] för
varför den skrevs ned direkt i stället för att bäras som minnesbild.
