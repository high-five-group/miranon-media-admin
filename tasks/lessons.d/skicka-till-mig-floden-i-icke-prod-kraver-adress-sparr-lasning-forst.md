# "Skicka till mig"-flöden i icke-prod kräver att adress-spärren läses INNAN QA-planen skrivs

**En utskicksyta i staging går inte att QA:a manuellt på det uppenbara sättet,
eftersom miljön bär en adress-spärr som blockerar allt utom vitlistade
mottagare. Skrivs testplanen utan att spärren lästs beskriver den steg som är
strukturellt omöjliga att utföra — och det upptäcks först när Marcus står i
flödet. Läs spärrkonfigurationen först, och klassa om de omöjliga stegen
öppet innan planen lämnas ifrån sig.**

Instans (S102, 2026-08-17, QA 241.6): sändstegen **4/6/7/8** i testplanen var
omöjliga att köra manuellt — `RESEND_TEST_ADDRESSES` gör att staging skickar
noll brev till icke-vitlistade mottagare. Stegen omklassades öppet i PR
**#1530**; täckningen ligger i stället på 241.3/241.4-E2E plus prod-verifikat
i fas 4. En skarp 51-mottagarsändning provades och blockerades **per design** —
vilket i sig blev QA:n av fel-läget. Kortet godkändes och stängdes i PR
**#1533**.

**Det generella:** en miljös skyddsräcken är en del av dess testbarhet, inte
ett hinder man upptäcker på plats. Ett flöde vars kärna är "något lämnar
systemet" har alltid en spärr i icke-prod — läs den, skriv planen mot vad som
FAKTISKT går att göra, och lägg resten som ett uttalat prod-verifikat i stället
för att låta det se ut som en lucka.
