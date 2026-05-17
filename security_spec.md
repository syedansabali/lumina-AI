# Security Specification - PDF Summarizer AI

## Data Invariants
1. A document must have a `userId` that matches the authenticated user's UID.
2. Only the owner of a document can read its status, text, or chunks.
3. Users can only see their own document history.
4. Timestamps (`createdAt`, `updatedAt`) must be server-generated.
5. The `status` field must be one of the pre-defined stages.

## The "Dirty Dozen" Payloads

### Identity Spoofing
1. `create` a document with `userId: "target_uid"` while authenticated as `attacker_uid`.
2. `update` a document's `userId` from `attacker_uid` to `target_uid`.

### Integrity Violation
3. `create` a document with a missing `filename`.
4. `create` a document with an invalid `status` (e.g., "admin").
5. `update` a document's `text` field to a 2MB string (exceeding document limits indirectly or causing resource exhaustion).
6. `create` a document with a client-side `createdAt` timestamp.

### Unauthorized Access
7. `get` a document belonging to another user.
8. `list` documents without a filter on `userId`.
9. `update` a document belonging to another user.
10. `delete` a document belonging to another user.

### State Shortcut
11. `update` a document status directly to "completed" without going through "parsing".
12. `update` a document with extra fields not in the schema (Ghost Fields).

## Test Cases (Logic)
- [FAIL] create(/documents/doc1) { userId: 'victim' } as 'attacker'
- [FAIL] get(/documents/doc_of_victim) as 'attacker'
- [FAIL] list(/documents) as 'attacker' (without userId query)
- [FAIL] update(/documents/my_doc) { status: 'completed', secret: 'hacked' } - rejected by affectedKeys().hasOnly()
