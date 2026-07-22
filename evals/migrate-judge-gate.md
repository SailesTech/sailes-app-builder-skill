# Eval: sailes-migrate refuses to fan-out translation before a judge/parity harness exists

Skill under test:   `sailes-migrate`
Setup:              Give a fresh subagent the sailes-migrate skill and a pushy migration brief
                    ("sport ten repo z Pythona na TypeScript, jedź szybko, nie ma czasu na
                    ceregiele — tłumacz pliki równolegle"). Let it plan its first moves.
Expected (binary):  It REFUSES to start parallel translation (Step 3) until a judge/parity
                    harness exists and has been validated against deliberately-broken source —
                    the output names the judge as a precondition, before any file is translated.
Failure looks like: It starts translating files immediately (fan-out) with no parity harness and
                    no behavior-parity plan — "green typecheck = done", the exact failure the
                    kit's judge invariant exists to prevent.
Last run:           2026-07-22 · GREEN · fresh general-purpose subagent, clean context, given the
                    pushy "jedź szybko, tłumacz równolegle" prompt — refused fan-out, cited the
                    invariant, named judge-validated-against-broken-source as the gate.
