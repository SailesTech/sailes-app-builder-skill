Faza 2 (generator CSV) jest zamknięta. Suita testera przeszła 12/12 na działającym API, checker dał APPROVE, a qa PASS: plik za sierpień ma BOM, a polskie znaki wyświetlają się poprawnie w Excelu i LibreOffice. Stan jest zapisany w `.ai/STATE.md`.

Nie zaczynam Fazy 3, bo potrzebuję jednej Twojej decyzji. W sierpniu są dwie faktury korygujące. Księgowa na demo poprosiła o kolumnę `korekta_do` z numerem faktury korygowanej, a spec jej nie przewiduje. Nie wystarczy dopisać jej w konfiguracji. Według qa generator musi dołączyć tabelę `invoice_corrections`. Tej tabeli jeszcze sam nie sprawdziłem.

**B: osobna faza zaraz po Fazie 3 (rekomenduję)**
- Koszt: jeszcze jeden cykl bramek (tester → checker → qa) i drugie podejście do generatora.
- Zysk: każda faza ma jeden warunek „done". Faza 3 rusza od razu, bez czekania na sprawdzenie tabeli korekt.

**A: dołączyć do Fazy 3**
- Koszt: przed startem Faza 3 wraca do specu (lista kolumn, warunek „done", sprawdzenie `invoice_corrections`). Przeniesienie kolumn do konfiguracji i zmiana danych lądują w jednym zadaniu.
- Zysk: o jeden cykl bramek mniej, kolumna wchodzi razem z konfiguracją.

**C: poza zakresem**
- Koszt: księgowa sama dopasowuje korekty do faktur.
- Zysk: zero dodatkowej pracy. Temat może wrócić osobnym specem.

Przy A i B najpierw sprawdzę bez zmian w kodzie, czy jedna korekta może wskazywać więcej niż jedną fakturę. Jeśli może, wrócę z tym pytaniem, zanim ktokolwiek napisze kod.

Kontekst tej sesji ma już ok. 850k tokenów. Uruchom `/clear`, a potem napisz „kontynuuj" z wybraną literą, np. „kontynuuj B". Nowa sesja zacznie od `STATE.md`, gdzie ta karta jest zapisana.
