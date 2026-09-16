# VERDICT runda 1 — umiejscowienie bramek tester/checker (A/B/C × 2)

Workflow `wf_bfef201f-177`, baza `212ee3f`, 48 agentów, role Sailes na modelach z frontmattera (sonnet), bez nadpisań.
Ocena: ukryty test lidera `hidden-acceptance.js` (24 przypadki; sprawdzony na implementacji wzorcowej 24/24, na bazie 3/24).
Koszt i czas z transkryptów (`message.usage` dedup po id; ceny sonnet 2/10, cache read 0,1×, write 1,25×; czas = pierwszy→ostatni timestamp agentów przebiegu).

| Przebieg | Wariant | Ukryty test | Defekty z bramek | Rundy poprawek | Agenci | Tury | USD (budowa / bramki) | Czas |
|---|---|---|---|---|---|---|---|---|
| A1 | na końcu | 24/24 | 0 | 0 | 5 | 87 | 1.35 (0.62 / 0.73) | 10.1 min |
| A2 | na końcu | 24/24 | 0 | 0 | 5 | 86 | 1.39 (0.63 / 0.76) | 9.3 min |
| B1 | per faza szeregowo | 24/24 | 0 | 0 | 9 | 185 | 2.79 (0.60 / 2.20) | 21.2 min |
| B2 | per faza szeregowo | 24/24 | 0 | 0 | 9 | 160 | 2.42 (0.76 / 1.66) | 16.9 min |
| C1 | hybryda | 24/24 | 0 | 0 | 10 | 163 | 2.33 (0.87 / 1.46) | 9.9 min |
| C2 | hybryda | 24/24 | 0 | 0 | 10 | 178 | 2.73 (0.93 / 1.80) | 12.9 min |

Średnio: **A $1.37 / 9.7 min** · **B $2.61 / 19.1 min** · **C $2.53 / 11.4 min**.

## Co ustalono
- Gdy implementacja jest poprawna, bramki per faza kosztują 2,2–2,6× więcej niż jedna bramka na końcu (0.75 vs 1.93 / 1.63 USD).
- B jest ~2× wolniejsze od A; C odzyskuje czas (≈ A + 1,7 min), ale kosztuje prawie jak B.
- Kod A po samym łańcuchu devów (przed bramkami) też 24/24 — w tej rundzie bramki nie dodały jakości.

## Czego NIE ustalono
- **Wykrywalności.** be-dev (sonnet) naprawił wszystkie 4 zaszyte defekty sam, bo F1 kazał „zostawić cały moduł zgodny z regułami”;
  bramki nie miały czego znaleźć w żadnym przebiegu. Porównanie mierzy więc wyłącznie narzut bramek, nie ich wartość.
- Kosztu poprawki defektu znalezionego późno (A) vs wcześnie (B/C) — zero rund poprawek.
