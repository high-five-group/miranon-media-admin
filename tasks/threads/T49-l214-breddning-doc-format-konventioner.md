# T49 — L214-breddning: doc-sektion/format-konventioner som distinkt drift-kategori

- **Tillstånd:** `paused` (deferred pekare — verkställs vid L214:s hub-lyft)
- **Uppstod:** Session 42 (tredje empiriska instans av L214:s generella princip)
- **Commit-tagg:** `git log --grep "\[T49\]"`

## Varför denna tråd

[L214](../lessons.md) ([UNIVERSAL], Session 42-H2) säger: Chats forensiska pre-pass
ska validera inlinade specifika mot disk-konventioner FÖRE leverans. Dess exempel-set
namnger två drift-kategorier: (i) markdown-lint (tomrad runt listor; ingen
fortsättningsrad som börjar med listmarkör) och (ii) fil-path/namn mot testMatch-glob
(`*.staging.test.ts`, ej `*.spec.ts`).

En **tredje empirisk instans** dök upp samma session, men i en kategori L214:s text inte
exemplifierade: **doc-sektion/format-konventioner**. Session-end-direktivet angav
todo-format `### Session N ✅ AVSLUTAD`-block; den faktiska disk-konventionen (S37–S41)
är **rad-7 rullande summary**. Att följa direktivet bokstavligt hade lämnat "Senast
uppdaterad"-huvudet ljugande kvar på Session 41 (+ brutit mönstret). Code fångade driften
— L214:s *generella* princip täckte fallet, men *kategorin* var oexemplifierad.

## Vad som väntar

Vid **L213/L214:s hub-lyft** (sker vid FULLT Fas 6-avslut, tillsammans med
L185–L212-backloggen) ska L214:s exempel-set **breddas** till att EXPLICIT inkludera
**doc-sektion/format-konventioner** (vilken sektion/format en post hör i, mot hur
föregående poster faktiskt är strukturerade på disk) som en distinkt drift-kategori vid
sidan av (i) markdown-lint och (ii) testMatch-glob.

**Viktigt:** Detta är en **förfining av L214:s scope vid hub-lyftet**, INTE en ny lesson.
Ingen `lessons.md`-edit nu — T49 är en durabel pekare till den framtida L214-editen.

## Korsref

- [L214](../lessons.md) (Session 42-H2) — lessonen som breddas.
- [L213](../lessons.md) (Session 42-H2) — syskon-lesson (do-confirm scope-korsläsning); lyfts samtidigt.
- ADR-053 — deferred-tråd-capture-disciplinen (registrera, förkasta aldrig tyst).
- Blockerar ej: ren meta-disciplin-förfining; ingen byggprodukt beror på den.
