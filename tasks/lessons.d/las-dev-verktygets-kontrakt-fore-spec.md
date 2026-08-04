# Fragment — läs ett stående dev-verktygs kontrakt före du skriver en spec mot det, anta det aldrig

**[UNIVERSAL]**

**Fångad:** 2026-08-02–2026-08-03, Session 93, PR #639.

**Vad som hände:** `PrototypeSwitcher`-devtoolet bär ett stående kontrakt
sedan S90/[ADR-074](../../docs/decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md):
i variant-läge (`?variant=`) är FIXTUR-data default, och `?data=verklig` är
den explicita opt-in-vägen till riktig data — inte tvärtom. En spec skriven
under sessionen hade INVERTERAT det antagandet utan att kontrollera det
dokumenterade kontraktet. Felet krävde en egen rättning i PR #639
("data-kontraktet rättvänt").

**Lärdomen:** innan en spec eller ett byggkrav skrivs som förlitar sig på
hur ett stående internt dev-verktyg beter sig, LÄS det dokumenterade
kontraktet (ADR, källkodskommentar eller motsvarande) — anta det aldrig
utifrån minnet eller vad som "verkar rimligt". Kostnaden av att anta fel var
inte trivial: en felaktig spec-premiss satte sig i byggkravsvågen och
krävde en egen fix-commit att upptäcka och rätta, i stället för att kosta
noll genom att läsas i förväg.

**Instans vs princip:** den specifika kontraktskällan (`PrototypeSwitcher`
/`ADR-074`) är repo-lokal, men principen den illustrerar — verifiera ett
verktygs dokumenterade kontrakt innan en spec bygger på ett antagande om
dess beteende — är allmängiltig och gäller varje kodbas med stående interna
dev-verktyg (feature-flaggor, test-switchar, miljöväxlare, prototyp-rigger).
Flaggas därför `[UNIVERSAL]` på principnivå, trots att den enskilda instansen
är lokal.

**Släktskap:** samma klass som `CLAUDE.md`s "Airtable-schema före write" och
"Research före implementation"-reglerna i det här repot — kontraktet ska
LÄSAS före designbeslutet fattas, aldrig antas. Den här instansen visar att
regeln gäller lika mycket internt byggda devtools som externa API:er/basar.
