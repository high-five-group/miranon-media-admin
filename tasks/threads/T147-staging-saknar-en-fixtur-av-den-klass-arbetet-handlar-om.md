---
owner: marcus803
updated: 2026-08-19
review_by: 2026-11-19
status: stable
lifecycle: active
---

# T147 — Staging saknar en fixtur av den klass `TASK-277`/`TASK-278` finns för

> Registrerad i S107 (2026-08-19) ur `TASK-278`s bygge, där bygg-agenten
> flaggade att AC #4 inte kunde bevisas skarpt. Triagerad enligt `ADR-053`:
> blockerar inte — koden är korrekt och verifierad på andra sätt — men den
> lämnar hela arbetets kärnklass otäckt i staging.

## Luckan

`TASK-277` (filtret) och `TASK-278` (visningsfältet) finns båda för EN klass
av person:

```text
Totalt antal hämtningar (erbjudande) > 0     (hon HAR hämtat)
Antal hämtningar (COUNTA(Engagemang))  = 0    (men Engagemang-raden saknas)
Antal anmälningar (totalt)             = 0    (hon är en ren lead)
```

I prod är klassen **33 personer** (mätt 2026-08-19). I staging finns den
**inte alls** — ingen post matchar alla tre villkoren samtidigt.

Följden: ingen staging-test kan skilja den gamla mappningen från den nya.
Båda ger samma svar på all data som finns där.

## Varför luckan finns — och min egen del i den

De permanenta fixturerna `ZZ-Lead-person-01/02` hade före `T146`
`COUNTA = 1, rollup = 0`. `T146`s fix gav dem **en `Touchpoints`-rad
vardera** så rollupen blev 1 — men `Engagemang`-raden lämnades kvar, med
avsikt, så att fixturen skulle överleva BÅDA formlerna.

Det var rätt för `T146`s syfte (deploy-landminan) och det gjorde fixturen
robust. Men det gjorde den samtidigt **icke-diskriminerande**: med
`COUNTA = rollup = 1` säger gammal och ny mappning exakt samma sak om den.

Bygg-agenten hittade en post i staging med rätt divergens — Sofia Isaksson
(`recxF88ZKUbP9JUs1`, rollup = 3, COUNTA = 0) — men hon **har anmälningar**
och är därför ingen lead. Hon bevisar att fältdivergensen finns i staging,
inte att lead-ytan hanterar den.

## Varför den INTE kan lagas nu — ordningen är hela poängen

Den uppenbara åtgärden är en tredje fixtur, `ZZ-Lead Person 03`, med en
`Touchpoints`-rad men **ingen** `Engagemang`-rad.

**Skapas den före deployen fäller den staging-testerna.** Den EF som ligger
i staging just nu mappar fortfarande `antalHamtningar` från `Antal
hämtningar`. En fixtur med `COUNTA = 0` skulle ge `antalHamtningar: 0` och
fälla assertionen `antalHamtningar ≥ 1` i `get-leads.staging.test.ts` —
alltså exakt samma klass av landmina som `T146` var, bara åt andra hållet.

**Fixturen måste följa deployen, aldrig föregå den.**

## Rätt ordning

1. `TASK-278` landar (PR `#1621`) — ✅ armerad 2026-08-19
2. `get-leads` deployas till **staging** med den nya mappningen
3. **Då** skapas `ZZ-Lead Person 03` (Touchpoints-rad, ingen Engagemang-rad,
   noll anmälningar)
4. Staging-testerna verifierar därefter den klass arbetet faktiskt finns för

Steg 3 bör i samma andetag lägga en assertion som **fäller** om klassen
tappas igen — annars är fixturen bara data, inte en vakt.

## Vad luckan lär

En fixtur som är robust mot både gammal och ny logik är bekväm vid
migreringen och **blind efteråt**. `T146` valde robusthet med öppna ögon och
det var rätt i stunden; kostnaden är att diskrimineringsförmågan måste
återskapas separat. Nästa gång en fixtur lagas mitt i en formeländring är
frågan värd att ställa direkt: *ska den överleva båda världarna, eller ska
den bevisa skillnaden mellan dem?* Det går sällan att få båda i samma post.

## Belägg

- PR [`#1621`](https://github.com/high-five-group/miranon-media-admin/pull/1621)
  — `TASK-278`s bygge, AC #4:s öppna brasklapp i kortets Implementation Notes
- `tasks/threads/T146-lead-filtrets-staging-fixturer-bar-fel-falt.md`
  § Åtgärd — fixturernas nuvarande form och varför de ser ut så
- Fälla 47 + fälla 50 i `docs/reference/data-model.md`
