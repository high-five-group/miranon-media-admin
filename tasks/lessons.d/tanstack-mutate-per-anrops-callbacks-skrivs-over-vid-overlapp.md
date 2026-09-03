# TanStack Querys `mutate(vars, { onSuccess })` tappar callbacks vid överlappande anrop — använd `mutateAsync`

**[UNIVERSAL] Per-anrops-callbacks till `mutate(vars, { onSuccess, onError
})` lagras på observatören (`MutationObserver#mutateOptions`), ett fält som
skrivs över vid nästa anrop på samma hook-instans. Två överlappande anrop
betyder att det FÖRSTA anropets callbacks aldrig körs — dess fönster får
aldrig sin adress, dess fel visas aldrig. `mutateAsync()` returnerar ett
löfte per anrop och är immun.** Verifierat mot installerad
`@tanstack/query-core` 5.101.4 (S116, `TASK-369`, PR `#2237`): buggen låg
under den synliga (delat `isPending` mellan rader) — kortets diagnos
"delad laddningsvisning" var sann men grund; bygg-agenten läste källkoden
och fann att även resultatet försvann. Granskaren verifierade premissen
oberoende mot samma källa. Regel: en mutation som kan anropas flera gånger
innan svaret kommit (listor med per-rad-knappar, fönster-först-mönster) ska
använda `mutateAsync` + lokalt per-id-läge, aldrig `mutate` med
per-anrops-callbacks. Och: när en bugg har en enkel synlig förklaring, läs
biblioteket ändå — den djupare orsaken satt i samma rad.
