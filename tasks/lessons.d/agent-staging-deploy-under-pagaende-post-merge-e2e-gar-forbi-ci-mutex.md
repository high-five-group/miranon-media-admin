# En agents manuella staging-deploy under pågående post-merge-E2E går förbi CI:s staging-mutex

Repots staging-mutex skyddar mot att flera CI-jobb muterar staging samtidigt,
men skyddar inte mot en agent som manuellt kör en Edge-Function-deploy mot
staging medan ett post-merge-E2E-jobb redan läser samma miljö, eftersom
deployen sker utanför den concurrency-grupp mutexen styr. Mätt 2026-09-02
(S113 Del 16, `tasks/sessions/2026-08-29-session-113.md` rad 1838 till 1843):
en `TASK-363`-agent deployade tre EF:er till staging 09:09:29 till 09:09:39
UTC medan post-merge-sviten E2E-steg körde på huvudgrenen, och ett test i
`persondetalj-betalningar-fellage.staging.test.ts` föll strax därefter.
Utfallet avgjorde inte definitivt om det var race eller regression, men
möjligheten för en agent att deploya förbi mutexen under en pågående
verifiering är i sig en lucka. Regel: en agent som ska deploya mot staging
bör kontrollera `gh run list` för pågående staging-berörande jobb innan
deployen körs, inte bara innan den egna PR:en pushas.
