# Vänta på sökvägen, inte en substräng — inloggningens redirect-parameter matchar för tidigt

**`page.waitForURL(/passkey|hem/)` returnerade OMEDELBART på
`https://admin.miranon.dev/login?redirect=%2Fhem` — regexen träffade
redirect-parametern, inte destinationen — och skriptet gick vidare oinloggat
tills nästa `waitForSelector` dog efter 20 s.** Mätt 2026-08-30 (S113 resume
3, prod-verifieringen av `TASK-309.43`); ett varv förlorat på ett
inloggningsfel som inte var ett. Regel: vänta på ett predikat över
`url.pathname` (`u => !u.pathname.startsWith('/login')`), aldrig på en
substräng av hela URL:en, och lägg en fångst som skriver ut `p.url()` + en
skärmdump när väntan misslyckas — annars ser ett fel-match ut som ett
nätverksfel.
