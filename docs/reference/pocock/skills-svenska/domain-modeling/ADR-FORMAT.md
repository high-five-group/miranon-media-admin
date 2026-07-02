# ADR-format

ADR:er ligger i `docs/adr/` och använder löpande numrering: `0001-slug.md`, `0002-slug.md` och så vidare.

Skapa katalogen `docs/adr/` först när den första ADR:en behövs.

## Mall

```md
# {Kort beslutstitel}

{1–3 meningar: vad är kontexten, vad beslutade vi och varför?}
```

Det räcker. En ADR kan vara ett enda stycke. Värdet ligger i att dokumentera *att* ett beslut fattades och *varför* — inte i att fylla ut avsnitt.

## Valfria avsnitt

Använd bara dessa när de tillför verkligt värde. De flesta ADR:er behöver dem inte.

- Frontmatter för **Status** (`proposed | accepted | deprecated | superseded by ADR-NNNN`) — användbart när beslut återbesöks.
- **Considered Options** — bara när de förkastade alternativen är värda att minnas.
- **Consequences** — bara när icke uppenbara följdeffekter behöver lyftas.

## Numrering

Sök igenom `docs/adr/` efter det högsta befintliga numret och öka det med ett.

## När en ADR ska föreslås

Alla tre villkor måste vara uppfyllda:

1. **Svårt att återställa** — kostnaden för att ändra sig senare är betydande.
2. **Överraskande utan kontext** — en framtida läsare kommer titta på koden och undra ”varför i hela världen gjorde de så här?”.
3. **Resultat av en verklig avvägning** — det fanns genuina alternativ och ett val gjordes av konkreta skäl.

Är ett beslut lätt att återställa, hoppa över det — då gör du bara om det senare. Är det inte överraskande kommer ingen undra varför. Fanns inget verkligt alternativ finns inget att dokumentera utöver ”vi gjorde det uppenbara”.

### Vad som kvalificerar

- **Arkitekturell form.** ”Vi använder ett monorepo.” ”Skrivmodellen är händelsebaserad och läsmodellen projiceras till Postgres.”
- **Integrationsmönster mellan kontextområden.** ”Ordering och Billing kommunicerar via domänhändelser, inte synkron HTTP.”
- **Teknikval som skapar inlåsning.** Databas, meddelandebuss, autentiseringsleverantör och driftsättningsmål. Inte varje bibliotek — bara sådana som skulle ta ett kvartal att byta ut.
- **Gräns- och omfattningsbeslut.** ”Customer-data ägs av Customer-kontexten; andra kontexter refererar bara med ID.” De uttryckliga nej:en är lika värdefulla som ja:en.
- **Medvetna avvikelser från den uppenbara vägen.** ”Vi använder manuell SQL i stället för ett ORM på grund av X.” Allt där en rimlig läsare skulle anta motsatsen. Det hindrar nästa ingenjör från att ”rätta” något som var avsiktligt.
- **Begränsningar som inte syns i koden.** ”Vi kan inte använda AWS på grund av regelefterlevnad.” ”Svarstider måste vara under 200 ms på grund av partner-API:ets avtal.”
- **Förkastade alternativ när förkastandet inte är uppenbart.** Om ni övervägde GraphQL men valde REST av subtila skäl, dokumentera det — annars föreslår någon GraphQL igen om sex månader.
