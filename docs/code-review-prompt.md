# Code Review Session

**Paste this as your first message in a FRESH Claude Code session** once
the backend is built. Do not reuse the session that built the code — the
point is to review without prior context biasing the result.

---

You are performing a code review of the backend in `server/` against
`specs/backend.md`. This is a fresh session: you have no memory of how
this code came to exist. Treat it as if a stranger wrote it.

## Your role

- **You DO NOT modify code.** No edits, no fixes, no refactors.
- **You DO NOT run the linter or formatter to "clean things up".**
- You read, analyze, and produce a written review only.
- Running tests to confirm they pass is fine. Running the code to probe
  behavior is fine. Changing files is not.

## What to check

1. **Spec coverage.** For each requirement R1 through R19 in
   `specs/backend.md`, mark one of: **met / partial / missing / unclear**.
   Cite the code that satisfies it as `file:line` or quote the relevant
   snippet. If a requirement is partial or missing, say exactly what's
   absent.

2. **Correctness.** Look for:
   - Logic bugs, off-by-one, incorrect status codes.
   - Race conditions (especially around the test-mode interval and
     concurrent HTTP requests touching `items`).
   - Broadcast-before-state-update ordering (R12a).
   - Whether validation actually rejects the cases the spec calls out
     (R8a edge cases: missing, non-string, empty, whitespace).
   - Whether `createdAt` is preserved across PATCH (R9).
   - Whether test mode goes through the same code path as HTTP handlers
     (R15), or quietly mutates `items` directly.

3. **Edge cases not handled.** What inputs would break this? Malformed
   JSON, huge payloads, `item_id` collisions, simultaneous PATCH and
   test-mode write to the same item, server shutdown with active
   websocket clients, etc.

4. **Code quality.**
   - Any single-character identifiers? (Should be zero per R17.)
   - Unused imports, variables, functions, dead branches?
   - Unclear naming, duplicated logic, missing or sloppy error handling?
   - Inconsistent style?

5. **Test quality.**
   - Do tests verify the spec, or do they just exercise the code without
     asserting the spec's actual requirements?
   - Are there spec requirements with no corresponding test?
   - Any `test.todo`, skipped tests, or empty test bodies left behind?
   - Do the websocket tests actually verify broadcast contents, or just
     that *something* was sent?

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
- **Description:** what is wrong, with reference to spec ID if applicable
- **Suggested fix:** describe in prose; do NOT write the code

## Test coverage gaps
List spec requirements with no test, or with tests too weak to catch
plausible regressions.

## Questions for the author
Things the spec doesn't clarify and the code resolved one way, that you
want confirmed.
```

## Tone

Direct, specific, no hedging. "This is wrong because X" beats "you might
want to consider possibly looking at X." Severity labels carry the
softening; the prose should be precise.
