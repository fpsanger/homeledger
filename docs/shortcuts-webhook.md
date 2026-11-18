# Apple Pay purchases via iOS Shortcuts

An iOS Shortcuts automation can send every Apple Pay purchase to HomeLedger as soon as it happens.
The purchase does not become an expense right away: it lands on the **A revisar** screen, where you
confirm the category and how it was paid. Confirming creates the real expense or credit card
purchase and teaches the app which category that merchant belongs to, so the next purchase there is
suggested correctly.

```
Wallet transaction -> Shortcut -> POST /api/webhooks/shortcuts/transaction -> A revisar -> Confirm -> expense
```

## Access: the tailnet is the boundary

HomeLedger has no login. The iPhone reaches it over Tailscale, through the same
`https://<host>.<tailnet>.ts.net` address described in `docs/deployment.md`.

- The iPhone must be connected to Tailscale when the purchase happens. If the VPN is off, the
  Shortcut fails and that purchase is **not** recorded; enter it by hand. Turn on "Connect on demand"
  in the Tailscale iOS app to make this rare.
- The webhook also requires a personal token, so another device on the tailnet cannot post purchases.
  The token also tells the server **whose** purchase it is, so each person uses their own Shortcut
  and their own token.
- Never expose it with `tailscale funnel`. See `docs/deployment.md`.

## Generate your token

Nothing goes in the server `.env`. Each person generates their own token in the app:

1. Open **Pessoas**, open the actions menu on your row and choose **Gerar token do Atalho**.
2. Copy the token from the dialog. It is shown **once**; only its hash is stored.
3. Paste it into your Shortcut (see below). Generating another token for the same person
   invalidates the previous one; **Revogar token do Atalho** turns it off without replacing it.

Do this on the phone that will run the Shortcut, or send the token over a private channel.

## Request

`POST /api/webhooks/shortcuts/transaction` with `Authorization: Bearer <your token>` and a JSON
body:

| Field      | Required | Notes                                                                                                   |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `amount`   | yes      | A number or text such as `12.50`, `12,50`, `R$ 12,50` or `1.234,56`. Must be positive.                  |
| `merchant` | yes      | Shown on the review screen and used to suggest a category.                                              |
| `card`     | no       | The Wallet card name. It is matched to a registered credit card by name; if none fits, you pick one.    |
| `date`     | yes      | ISO 8601 with the time, e.g. `2026-11-16T22:30:00-03:00`, or just `2026-11-16`. The calendar day is the one written in the string, so a late-night purchase stays on the right day. |

Responses:

| Status | Meaning                                                                        |
| ------ | ------------------------------------------------------------------------------ |
| `201`  | Stored for review. Body: `{ "id": "...", "created": true }`.                   |
| `200`  | The same purchase (person, amount, exact time, merchant, card) was already stored. |
| `400`  | The body is invalid; `error` says why.                                         |
| `401`  | Missing, unknown or revoked token.                                             |

Test it from any device on the tailnet:

```bash
curl -X POST "https://<host>.<tailnet>.ts.net/api/webhooks/shortcuts/transaction" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":"12,50","merchant":"Padaria","card":"Nubank","date":"2026-11-16T22:30:00-03:00"}'
```

## Shortcut setup

The exact action and variable names depend on the iOS version and language, so treat these steps as
a guide rather than a script.

1. In Shortcuts, open **Automation**, tap **+**, and choose the **Transaction** (Wallet) trigger.
   Pick the cards to watch and set it to **Run Immediately**.
2. Add the action **Get Contents of URL**:
   - URL: `https://<host>.<tailnet>.ts.net/api/webhooks/shortcuts/transaction`
   - Method: `POST`
   - Headers: `Authorization` = `Bearer <your token>`
   - Request Body: `JSON`, with `amount`, `merchant` and `card` taken from the transaction details
     the trigger provides, and `date` set to the current date formatted as ISO 8601.
3. Make a real purchase, or run the automation by hand, and check that it appears on **A revisar**.

The trigger covers purchases made with Apple Pay in Wallet only; online purchases made without it
are not reported.

## Reviewing

Open **A revisar** (the nav link shows how many purchases are waiting). For each one:

- **Pago com** starts on the registered credit card that matched, or on debit. Choose another
  option when needed.
- **Categoria** starts on the category learned from earlier purchases at the same merchant, if any.
- **Fatura** appears for variable-closure cards and must be chosen. Fixed-closure cards compute it
  from the closing day.

**Confirmar** creates the expense (or a single-installment credit card purchase) and warns when it
looks like one you already entered. **Descartar** drops the purchase without recording anything.
