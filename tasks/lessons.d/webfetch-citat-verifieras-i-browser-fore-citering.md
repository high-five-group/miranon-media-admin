# WebFetch kan fabricera verbatim-citat — verifiera i browser innan du citerar

**[UNIVERSAL] Ett research-pass fick ett "verbatim"-citat ur WebFetch (en
Visma-mening) som inte fanns på sidan; det fångades först genom
browser-kontroll.** Mätt 2026-08-29 (S113, research-passet om skapa-flödet).
WebFetch sammanfattar via en modell och kan skriva citationstecken runt en
parafras. Regel för varje pass som citerar via WebFetch: öppna sidan i
browser-verktyget (eller `curl` + `grep` på den exakta strängen) innan
citatet bokförs som källa; ett citat som inte går att `grep` fram är en
parafras och märks som sådan.
