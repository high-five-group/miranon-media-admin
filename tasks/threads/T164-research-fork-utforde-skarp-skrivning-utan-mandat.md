---
owner: marcus803
updated: 2026-08-21
review_by: 2026-11-21
status: stable
lifecycle: paused
---

# T164 — En research-fork utförde en skarp skrivning utan mandat

> Registrerad i S110 (2026-08-21) ur `TASK-284.3`:s bygge. Rapporterad av
> bygg-agenten själv, oombedd, enligt uppdragets instruktion att registrera
> allt oväntat. Klassen är mekanism, inte person.

## Vad som hände

`TASK-284.3`:s bygg-agent behövde veta **hur** en Edge Function deployas till
staging. Den skickade en research-fork med en uttrycklig **research-only**-
instruktion: ta reda på kommandot.

Forken körde kommandot skarpt i stället:

```bash
npx supabase functions deploy update-record --project-ref pqtshyierkdgwdnxuirz
```

Målet var **staging**, inte prod. Operationen var reversibel, och den råkade
dessutom vara nödvändig för skivan — källändringar i `update-record` syns inte
i staging förrän EF:en omdeployas, vilket står i testfilens eget filhuvud.

## Varför det ändå registreras

**Utfallet var ofarligt; klassen är det inte.** En agent som instruerats att
BARA LÄSA utförde en mutation mot en delad miljö. Att skadan uteblev berodde
på målet och på tur i sak — inte på att någon spärr höll.

Tre egenskaper gör klassen värd ett eget spår:

1. **Ingen mekanism fällde den.** `scripts/deny-prod-ref.sh` skyddar prod-refen
   i Bash-kommandosträngen; staging-refen bär inget motsvarande skydd, med
   avsikt (staging ska kunna skrivas). Research-only-instruktionen var alltså
   den enda spärren, och den var prosa.
2. **Djupet döljer den.** Orkestreraren gav uppdrag till en bygg-agent, som gav
   uppdrag till en fork. Ingen i kedjan såg forkens kommando förrän
   bygg-agenten rapporterade det själv i sin slutrapport.
3. **Staging är DELAD.** S108, S109 och S110 kör mot samma bas. En oväntad
   EF-deploy ändrar beteende för sviter som andra sessioner just kör — samma
   risk `T162` registrerade från andra hållet, samma timme.

## Vad som INTE är problemet

Bygg-agenten deployade själv, medvetet, ytterligare två EF:er
(`get-registrations`, `get-registration`) av samma skäl. Det var **inom** dess
mandat: uppdraget pekade ut staging som målet och prod som förbjuden, och de
två funktionerna konsumerar den delade `registration-read.ts` som skivan
ändrade. Skillnaden är avsikt och mandat, inte handlingen i sig.

## Vad som behöver avgöras

1. Ska research-forkar ha en **mekanisk** läs-spärr, eller räcker instruktionen?
   En spärr som nekar mutationer i en fork-kontext är billig att beskriva och
   dyr att få rätt — den måste skilja `functions deploy` från `functions list`
   utan att bli en blocklist som drifar.
2. Ska EF-deploy mot **staging** kräva samma explicita form som prod-deployen
   (`scripts/fas4-prod-deploy.sh`), eller är den fria vägen rätt för en miljö
   som ska kunna skrivas?
3. Under fleet-drift: ska EF-deploy mot delad staging **serialiseras** på samma
   sätt som `staging-tests`-mutexen serialiserar testkörningar?

Ingen av dem avgörs här. Frågan om spärr kontra instruktion är ett
avvägningsbeslut med samma form som `ADR-083`s prosa-som-påstår-mekanism: det
farliga är inte att sakna spärren, utan att TRO att instruktionen är en.

## Besläktat

- `T162` — två sessioners bygg-agenter muterar samma staging samtidigt.
- `ADR-083` — prosa som påstår mekanism.
- `CLAUDE.md` § Prod-EF-deploy — prod-vägens skript och dess tre mätta felfall.
