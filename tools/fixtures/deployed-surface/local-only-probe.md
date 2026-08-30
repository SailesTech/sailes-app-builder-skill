# Spec: signed download links

## Phase 1 — expired link answers 410

Done-when: the endpoint responds 410 Gone for an expired token.
Deployed-probe: curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/d/expired → 410
