# Model kosztu, bramki i provenance

## Bramki (jedna na krok)

Każdy krok kończy się bramką; **sign-off = odpalenie następnego kroku**, nie osobna ceremonia.
Zatrzymanie jest darmowe — kolejkę definiuje **stan na dysku** (manifest + przetłumaczone jednostki
+ kolejka błędów). Wznowienie to ponowne wywołanie, nie recovery.

| Po kroku | Bramka (binary) |
|---|---|
| 0 | judge istnieje **i** failuje na celowo zepsutym źródle |
| 1 | `manifest.tsv` + Rulebook v1 + gap-inventory istnieją na dysku |
| 2 | Rulebook ustabilizowany na pilotach; zero commitów kodu w tym kroku |
| 3 | wszystkie jednostki z manifestu przetłumaczone |
| 4 | survey build czysty |
| 5 | proces startuje + najmniejsza ścieżka end-to-end przechodzi |
| 6 | **wszystkie** testy parzystości zielone **I** oryginalny suite na oryginale bez odziedziczonych porażek |

## Model kosztu

Budżetuj jawnie: **jednostki pracy × koszt/jednostkę**. Jednostka = plik (structure-preserving) lub
moduł/subsystem (redesign) z manifestu. Największym mnożnikiem jest **topologia review** (to ona
łapie większość problemów), nie sam przekład. Produkcyjny port dużego repo to rząd miliardów tokenów
wejścia w skali ~dni–tygodni; przy standardowych limitach te same kroki trwają dłużej w czasie
zegarowym, nie inaczej metodycznie.

Praktyczne cięcie kosztu:
- **Bez kompilatora w Krokach 3–4** poza jednym zbiorczym survey — deny-list to wymusza.
- **Tania weryfikacja przed drogą** (Krok 5 hello-world przed pełną parzystością).
- **Napraw regułę, nie N instancji** — jedna poprawka Rulebooka zamiast N łatek fixerów.

## Provenance i licencja (decyzja człowieka)

Metoda zdestylowana z **`anthropics/code-migration-kit-with-claude-code`** — licencja **Apache-2.0,
© 2026 Anthropic, PBC**. Ten skill to nasza **synteza idei** (idee nie podlegają prawu autorskiemu);
**nie reprodukujemy tekstu ani plików** kitu.

Konkretne skrypty kitu (`depmap_python.py`, `depmap_mjs`, `depmap_c_headers.py`, `make_manifest.py`,
`queue_runner.mjs`, `build_daemon.sh`) oraz szablony (`RULEBOOK.md`, `inventory.tsv`,
deny-`settings.json`) **żyją w tamtym repo**. Domyślnie: **referencja** — sklonuj kit obok repo
migrowanego i użyj jego skryptów.

**Vendorowanie (skopiowanie ich plików do tego repo) jest prawnie dozwolone przez Apache-2.0**, ale
wymaga:
- zachowania nagłówków licencyjnych i dołączenia `NOTICE`/atrybucji (Apache-2.0 §4),
- świadomej decyzji, czy pakować kod innego dostawcy do dystrybucji Sailes (plugin/marketplace).

**To decyzja człowieka, nie agenta.** Dopóki nie zapadnie — trzymamy referencję, nie kopię.
