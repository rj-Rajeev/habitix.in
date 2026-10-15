# People connection-request data foundation

The `ConnectionRequest` model declares unique partial indexes on the canonical
`pairKey` for pending requests and active (pending or accepted) relationships:

- `unique_pending_connection_request_pair`
- `unique_active_connection_request_pair`
- `unique_chat_connection_request`
- `unique_intro_message_connection_request`

```ts
{ pairKey: 1 }, {
  unique: true,
  partialFilterExpression: { status: "pending" },
}
```

The active-pair index filters on `{ activePair: true }`. This also prevents a
pending request racing with acceptance of an existing request. Declines set
`activePair` to false, so declined records remain in history and a later
request may be inserted.

`pairKey` is computed from the lowercase ObjectId strings sorted lexicographically
and joined with `:`. Both request directions therefore produce the same key. A
declined request no longer matches the partial filter and remains stored as
history without blocking a later pending request for that pair.

The provisional discovery limit is 20 learning interests per user. This phase
does not add interest fields or discovery behavior. Introductory messages are
limited to 500 trimmed characters by the validation schema and model.

Chat and Message have optional `connectionRequestId` references with the named
unique sparse indexes `unique_chat_connection_request` and
`unique_intro_message_connection_request`. They let acceptance retries recover
the same chat and intro message after partial failure without constraining
legacy documents.

The model declarations do not prove that these indexes exist in any database.
Request creation and acceptance verify the four named unique indexes at runtime
and fail closed if they are absent or cannot be inspected. Provision the
ConnectionRequest collection and deploy/verify all four indexes before enabling
these operations; do not drop or alter existing indexes automatically. If
records are imported, resolve conflicting active pair keys before creating the
indexes. No transaction capability is assumed; acceptance uses an intermediate
in-progress flag plus unique request references to resume safely after partial
failure. A process crash can leave a request pending with decline blocked while
`acceptanceInProgress` remains true. Recovery is retry-based: acceptance must be
retried; there is no lease, background worker, or automatic repair process.

Chat authorization requires both the Chat-to-request and request-to-Chat links
to agree, and verifies the persisted introductory Message and its request, chat,
sender, and normalized text links. A chat with no request association is treated
as legacy only when no request points back to it. People messaging is one-to-one;
legacy chats with any participant count other than two are denied. Existing
production records and deployed indexes have not been inspected, so rollout
must verify the indexes and assess compatibility of existing multi-participant
records through an approved deployment process.
