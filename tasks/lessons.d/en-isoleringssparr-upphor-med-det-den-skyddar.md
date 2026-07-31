# En isolerings-spärr som upphör med det den skyddar är fail-open

**En agents worktree tas bort av harnesset när den är oförändrad — och i samma
stund slutar isolerings-spärren fälla. Skyddet försvinner alltså precis när
felet blir möjligt.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-30/31):** `TASK-94`:s bygg-agent checkade ut en gren och
committade i **huvudkatalogen**, vilket dess kontrakt uttryckligen förbjuder.
Agenten utredde det själv och kedjan är belagd led för led:

1. **Mätt:** allt filarbete skedde i *hub-repot*. Det enda agenten skapade i sin
   spoke-worktree var en `node_modules`-symlänk, som är gitignorerad. Dess
   `git status --porcelain` i worktreen gav tom utdata.
2. **Slutsats:** worktreen var därmed oförändrad hela sin livstid och
   kvalificerade för automatisk borttagning. Både katalogen och
   platshållargrenen försvann.
3. **Mätt:** när sessionen bröts av en API-gräns och återupptogs föll
   Bash-verktygets `cwd` tillbaka till sessionens arbetskatalog — huvudträdet.
4. **Mätt:** isolerings-spärren slutade fyra. Tidigare samma session hade den
   vägrat kommandon med *"This agent is isolated in the worktree …"*. Efter
   återupptagningen gick `git switch -c` mot huvudträdet igenom utan invändning.

Exponeringsfönstret var **4 min 13 s**, mätt ur reflogen. Under det stod
huvudträdet på agentens gren i stället för `main` — och reflogen visar att
orkestreraren landar via `checkout main → gren → commit → checkout main` i just
det trädet. Hade sekvenserna överlappat hade nästa gren grenat av från fel bas.

**Tre egenskaper som gör klassen värre än den ser ut.**

- **Spärren är fail-open.** Den skyddade medan worktreen fanns och slutade
  skydda i samma ögonblick worktreen försvann. En spärr som upphör tillsammans
  med det den skyddar ger starkast falskt lugn precis i felläget.
- **En agent vars kod bor i ett ANNAT repo smutsar aldrig ned sin egen
  worktree** och är därför maximalt utsatt för auto-borttagning. Det är
  kortets egen premiss inverterad: uppdraget byggde på att levererande agenter
  *inte* städas automatiskt — vilket inte gäller den som levererar någon
  annanstans.
- **Efter en borttagen worktree finns ingen signal.** `cwd` faller tyst tillbaka
  till den delade checkouten. Inget felmeddelande, inget varningsläge.

**Formen:** mät `git rev-parse --show-toplevel` **före varje git-skrivning**, inte
en gång per session. Agentens egen diagnos av sitt fel är den skarpaste
formuleringen: *"'Verifiera, gissa aldrig' tillämpat på fel tidshorisont — jag
verifierade en gång i stället för vid det tillfälle det gällde."*

**Skärpningen mot närliggande:**
[[osparad-bokforing-ar-en-delad-tillstandsyta]] handlar om tillstånd som är
osynligt för andra. Denna handlar om ett skydd som är osynligt frånvarande för
den det skyddar — och upptäcktes av en syskonagent, inte av den som föll.
