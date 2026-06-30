# Project Workflow Rules

This is a spec-driven development project. Follow these rules on EVERY task,
no matter how small.

## Working directories

- Backend code lives in `server/`
- Frontend code lives in `client/`
- Specs live in `specs/`. Treat them as the source of truth.
- If the spec is ambiguous, ASK. Do not guess.

## Required workflow for every feature or change

1. **Read the relevant spec** in `specs/` before doing anything else.
2. **Plan first.** Write a plan that includes:
   - Which spec requirements this addresses (quote them by ID, e.g. R7, R7a)
   - Files you will create or modify
   - Edge cases you considered (list them explicitly, not "various edge cases")
   - Test descriptions you will write first
3. **STOP and wait for my explicit approval** of the plan. Do not write
   code, do not create files, do not run commands beyond reading. Wait for
   me to say "approved", "go ahead", or equivalent. A question from me is
   not approval.
4. Once approved:
   - Write tests first (full tests, or named `it()` / `test()` descriptions
     with empty bodies that you fill in after implementation).
   - Then implement the feature.
   - Fill in any stub test bodies.
   - Run the tests. They must pass.
   - Run the linter. Fix all warnings, not just errors.
5. **Clean up** before reporting done:
   - Remove unused imports, variables, functions, and dead code.
   - Remove any `console.log` calls added for debugging.
   - Verify no single-character identifiers exist.
6. Report what you did, which requirements are now satisfied, and which
   tests pass.

## Code style rules

- **No single-character variable names.** Use descriptive words.
  `index` not `i`. `item` not `x`. `error` not `e`. Loop counters included.
  This applies to arrow function parameters too: `items.map(item => ...)`
  not `items.map(i => ...)`.
- Prefer clarity over cleverness.
- Match existing project style once it exists.

## Commit messages

Follow Conventional Commits 1.0.0 per `docs/commits.md`. Commit at the
end of each approved slice, after tests and lint pass. Never commit
partial or pre-approval work.

## What NOT to do

- Do not skip the planning step, even for "trivial" changes.
- Do not begin coding before I approve the plan.
- Do not mark work complete without running tests AND the linter.
- Do not perform the code review yourself in the same session as the build.
  Code review happens in a fresh session via `/review-backend`.
- Do not add features that are not in the spec. If you think something is
  missing from the spec, raise it during planning.

## References

- Backend spec: `specs/backend.md`
- Frontend spec: `specs/frontend.md` (not yet written)
- Workflow detail and examples: `docs/workflow.md`
- Code review: run `/review-backend` in a fresh session
