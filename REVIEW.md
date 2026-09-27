# UI JavaScript hardening

- API requests use the UI's own origin and port instead of a private hardcoded
  address. Deploy the UI alongside WSER on each company's HTTPS origin.
- The API helper returns an explicit success flag and HTTP status. Network,
  invalid-JSON and HTTP failures are distinguished from successful responses.
  POSTs are not automatically retried: a missing response can follow a committed
  write. Request construction is also inside error handling. Other origins and
  redirects are rejected; credentials are limited to the same origin.
- Record/list handlers stop on failed requests. Failed order updates retain the
  form; successful updates retain the existing clear-form behavior.
- The dashboard no longer references an undefined weekRange. It validates list
  responses and displays request errors rather than passing them to renderers.
  The purchase-order endpoint is still a general list; this patch does not
  invent a weekly filter without dates in its response.
- API-derived dashboard/report content uses text nodes and DOM elements rather
  than HTML interpolation. Report actions use event listeners, and only numeric
  order keys receive a clickable action. Report failures retain the old report.
- Removed POST payload logging from the network helper and order submission.

Validation: `node tests/regressions.cjs` (Node with built-in Request/Response).
Tests execute the real helper and UI functions, substituting network replies
and a minimal DOM that rejects HTML-parsing sinks. Cases cover same-origin
routing with a custom HTTPS port, invalid destinations, failed HTTP/JSON/network
responses, no automatic POST retry, both dashboard lists, hostile HTML-like
values and report keys, failed report preservation, and failed/successful order
updates. This is not a full browser or live-backend end-to-end test.

Login and server-side permission enforcement remain separate release work.
