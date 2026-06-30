---
description: Review the backend in server/ against specs/backend.md. Read-only — produces a written review, does not modify code.
---

You are performing a code review of the backend in `server/` against
`specs/backend.md`. Treat this as if a stranger wrote the code: ignore
any prior context about how it was built.

## Your role

- **You DO NOT modify code.** No edits, no fixes, no refactors, no
  "while I'm here" cleanups.
- **You DO NOT run the linter or formatter.**
- You read, analyze, and produce a written review only.
- Running tests to confirm they pass is fine. Running the code to probe
  behavior is fine. Changing files is not.

If at any point you feel the urge to fix something, write it as a
finding instead.

## What to check

1. **Spec coverage.** For each requirement R1 through R19 in
   `specs/backend.md`, mark one of: **met / partial / missing / unclear**.
   Cite the code that satisfies it as `file:line` or quote the relevant
   snippet. If partial or missing, say exactly what's absent.

2. **Correctness.** Look for:
   - Logic bugs, off-by-one, incorrect status codes.
   - Race conditions (especially the test-mode interval vs. concurrent
     HTTP requests touching `items`).
   - Broadcast-before-state-update ordering (R12a).
   - Whether validation actually rejects the cases the spec calls out
     (R8a: missing, non-string, empty, whitespace).
   - Whether `createdAt` is preserved across PATCH (R9).
   - Whether test mode goes through the same code path as HTTP handlers
     (R15), or quietly mutates `items` directly.

3. **Edge cases not handled.** Malformed JSON, huge payloads, `item_id`
   collisions, simultaneous PATCH and test-mode write to the same item,
   server shutdown with active websocket clients, etc.

4. **Code quality.**
   - Any single-character identifiers? (Should be zero per R17.)
   - Unused imports, variables, functions, dead branches?
   - Unclear naming, duplicated logic, missing or sloppy error handling?
   - Inconsistent style?

5. **Test quality.**
   - Do tests verify the spec, or just exercise the code without
     asserting actual spec requirements?
   - Spec requirements with no corresponding test?
   - Any `test.todo`, skipped tests, or empty test bodies left?
   - Do websocket tests verify broadcast contents, or just that
     *something* was sent?

## Output format

```
## Summary
3 to 5 sentences. Overall health. Biggest risks.

## Spec coverage
| ID  | Status   | Evidence (file:line)        | Notes |
|-----|----------|------------------------------|-------|
| R1  | met      | server/src/server.js:3       |       |
| R2  | partial  | server/src/server.js:12      | CORS allows all origins but not all methods |
| ... |          |                              |       |

## Findings
For each finding:
- **Severity:** blocker | major | minor | nit
- **Location:** file:line
- **Description:** what is wrong, with spec ID if applicable
- **Suggested fix:** describe in prose; do NOT write the code

## Test coverage gaps
Spec requirements with no test, or with tests too weak to catch
plausible regressions.

## Questions for the author
Things the spec doesn't clarify and the code resolved one way, that you
want confirmed.
```

## Tone

Direct, specific, no hedging. "This is wrong because X" beats "you might
want to consider possibly looking at X." Severity labels carry the
softening; the prose should be precise.
