# Andra pre-compact-impulsen är paus-signalen, bekräftat i praktiken, även med en odränerad pipeline

`pre-compact`-skillens regel om max en kompaktering per session (ADR-101
beslut 1) höll under verklig press: när en session som redan hade kört en
kontrollerad kompaktering fick en andra impuls att kompaktera, tolkades
impulsen som paus-signalen i stället för ett nytt varv av skillen. Mätt
2026-09-02 (S113 paus 9, `tasks/sessions/2026-08-29-session-113.md` rad
1890 till 1898): Marcus bad om planering för kompaktering vid
kontextfönster 90 procent, men eftersom sessionen redan bar en kontrollerad
kompaktering (Del 13, 2026-08-31) stoppades pre-compact, och sessionen
pausades i stället. Paus-formens normala krav, att pipelinen dräneras innan
paus, kunde INTE följas fullt ut, eftersom tre agenter fortfarande arbetade
och tre PR:er stod i review-loop och kontexten medgav ingen väntan. Löst
genom att bokföra varje pågående tråd fullständigt i handoff-blocket i
stället för att dränera. Regel: vid kritiskt kontextläge (cirka 90 procent
eller högre) kan paus-formens dräneringskrav behöva ge vika för fullständig
bokföring i handoffet, så nästa resume kan ta över utan väntan.
