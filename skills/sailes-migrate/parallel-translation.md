# Fan-out przekładu — playbook orkiestracji

Kroki 3 (tłumaczenie) i 4 (fixerzy) to praca równoległa na wielu jednostkach. Reużywamy nasz zespół
i guardraile — nie budujemy nowego runnera od zera.

## Role (reużyte, bez nowych TOML-i)

- **`team-lead`** — orkiestruje fan-out: czyta `manifest.tsv`, przydziela jednostki, integruje
  wyniki, pilnuje bramek. Każdy brief niesie klauzulę raportu (pusty zwrot = porażka, nie
  „nic nie znalazłem").
- **`be-dev` / `fe-dev`** — tłumacze (Krok 3) i fixerzy (Krok 4), po jednej jednostce z manifestu.
- **`checker` / `tester` / `qa`** — bramka parzystości (Krok 6), niezależny kontekst.

## Krok 3 — tłumaczenie

1. Kolejność z `manifest.tsv` (liście→korzeń — z mapy zależności, Krok 1).
2. Równolegli tłumacze, **jedna jednostka = jeden agent**, ściśle wg Rulebooka.
3. **Bez kompilatora** — nie kompilujemy per-jednostka; survey build zbiorczo w Kroku 4.
4. Guardrail deny-list aktywny (niżej).

## Krok 4 — survey build + fixerzy

1. **Jeden** zbiorczy build po całości.
2. Błędy → maszynowa kolejka cięta po module, liście→korzeń.
3. Równolegli fixerzy **bez dostępu do kompilatora** (inaczej każdy odpala drogi build → zapętlenie);
   daemon przebudowuje, gdy drzewo się zmienia.
4. Powtarzaj aż build czysty. Powtarzalny błąd → poprawka **reguły**, nie N łatek.

## Guardrail deny-list (obowiązkowy przed fan-outem)

Fan-out bez guardraila potrafi spalić budżet na drogich operacjach (per-plikowy typecheck, pełne
buildy w pętli). Każde repo generowane przez `sailes-bootstrap` ma już `.claude/settings.json` +
twin `.codex/config.toml` na wspólnych skryptach hooków — dołóż deny na drogie operacje migracji
(np. `typecheck`, pełny `build`) na czas Kroków 2–4, i **reaktywuj** je na Krok 6.

> **KRYTYCZNE:** jeśli deny-list **nie jest zainstalowany**, blokady nie działają — fan-out
> pobiegnie „nieuzbrojony". Zainstaluj przed pilotem (Krok 2). To dokładnie ta pułapka, którą kit
> Anthropic odnotował jako realny incydent.

## Konkretne skrypty runnera

`queue_runner` / `build_daemon` / `depmap_*` / `make_manifest` żyją w kicie Anthropic
(`anthropics/code-migration-kit-with-claude-code`, Apache-2.0). Czy vendorować je do naszego repo —
decyzja licencyjna człowieka; patrz `cost-and-gates.md`. Domyślnie: sklonuj kit obok repo
migrowanego i użyj jego skryptów; nasza warstwa to orkiestracja ról + bramki + Rulebook.
