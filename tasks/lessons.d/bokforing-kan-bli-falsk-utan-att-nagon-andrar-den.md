# Bokföring kan bli falsk utan att någon ändrar den

**En anteckning som var korrekt när den skrevs kan bli osann av att VÄRLDEN
ändras runt den — inte texten. Ett namn som pekade rätt 2026-05 kan peka på ett
annat objekt 2026-08, utan att en enda tecken redigerats.** `[UNIVERSAL]`

Datum: 2026-08-05 (S96, femte resumen) | Klass: tillståndsytor som ljuger

## Instansen

Jakten på stagings CORS-allowlist (se
[[write-only-secret-bevisas-mot-digest]]) hittade exakt en dokumenterad post,
i `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md`:

```text
Staging-secret satt: CORS_ALLOWED_ORIGINS=https://admin.miranon.se,
http://localhost:5173,http://localhost:4173 (per Marcus Gate A1-svar).
```

Den strängen hashade till **produktionens** digest, inte stagings.

Förklaringen är kronologisk, inte slarv: 2026-05-04 fanns bara ETT projekt —
det som skapades 2026-03-30 och i dag är prod. Staging föddes först
2026-06-13. Dokumentet beskrev alltså helt korrekt "det projekt vi jobbar mot",
och ordet *staging* syftade på en miljöroll som senare flyttade till en annan
databas.

## Varför det är lurigt

Detta är svårare att upptäcka än en vanlig stale rad, eftersom texten läser som
sann och **är** internt konsistent. Det finns inget att korrekturläsa bort. Bara
en oberoende mätning — här digest-jämförelsen — kunde visa att namnet bytt
referent.

Samma familj som `T121`-klassen: en konfigurationsrad som fortsätter gälla
bokstavligt medan dess innebörd flyttat.

## Regeln

Läser du en historisk anteckning om en miljö, ett projekt eller en resurs:
**kontrollera att objektet den namnger är samma objekt i dag.** Fråga när
anteckningen skrevs och vad som fanns då. Vid minsta tvekan — mät mot systemet
i stället för att lita på namnet.

Praktisk följd för oss: bokför miljöer med sitt **projekt-ref**
(`pqtshyierkdgwdnxuirz`), inte bara med rollnamnet "staging". Ref:en byter
aldrig referent.
