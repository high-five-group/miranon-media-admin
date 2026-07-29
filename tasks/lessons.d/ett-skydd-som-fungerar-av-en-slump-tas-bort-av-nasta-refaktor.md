# Ett skydd som fungerar av en slump tas bort av nästa refaktor

**Att en farlig konfiguration råkar vara ofarlig i dag är inte samma sak som att
den är säker. Skriv ut skälet explicit, annars är skyddet osynligt för den som
ändrar nästa gång.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-29, merge queue-aktiveringen):** `ci.yml` bar

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.number || github.sha }}
  cancel-in-progress: true
```

`cancel-in-progress: true` tillsammans med merge queue är en **dokumenterad
fälla**: avbryts en kö-körning rapporteras dess required check aldrig, PR:en
faller ur kön, och i värsta fall fälls hela kön (community-discussion #137976).

Vi var skyddade — men av en slump. På `merge_group`-ytan saknas
`github.event.number`, så uttrycket faller till `github.sha`, som är unik per
merge group. Varje kö-körning fick därmed sin egen concurrency-grupp och kunde
inte avbryta någon annan.

**Ingen hade skrivit det.** Skyddet vilade på en fallback som fanns där av ett
helt annat skäl (PR-nummer för PR-ytan), och på en egenskap hos ett event som
inte existerade när raden skrevs. En framtida refaktor som "städar" uttrycket —
eller som lägger till en till fallback — hade tagit bort skyddet utan att någon
märkt det förrän kön gick sönder.

Åtgärden blev att göra båda leden explicita:

```yaml
group: ${{ github.workflow }}-${{ github.event.number || github.event.merge_group.head_sha || github.sha }}
cancel-in-progress: ${{ github.event_name != 'merge_group' }}
```

Det andra ledet ändrar faktiskt beteendet — men första ledet ändrar ingenting
alls i dag. Det skrevs ändå, eftersom **en rad som dokumenterar varför den finns
överlever en refaktor; en tyst fallback gör det inte.**

**Formen:** när research visar att en känd fälla inte träffar oss — fråga alltid
*varför inte*, och om svaret är "av en slump" eller "för att ett fält råkar vara
tomt": skriv ut det. Kostnaden är en rad. Alternativet är ett skydd som ingen
kan se att de tar bort.
