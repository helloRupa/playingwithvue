## Commit messages

Follow the Conventional Commits 1.0.0 standard:
https://www.conventionalcommits.org/en/v1.0.0/

Format: `<type>(<scope>): <description>`

**Types used in this project:**

- `feat` — a new feature visible to the user/API
- `fix` — a bug fix
- `test` — adding or correcting tests only
- `refactor` — code change that neither fixes a bug nor adds a feature
- `chore` — tooling, config, dependencies
- `docs` — documentation only

**Scopes used in this project:**

- `server` — backend code
- `client` — frontend code
- `specs` — spec files
- `docs` — workflow/review docs
- Omit scope for repo-wide changes.

**Rules:**

- Description is lowercase, imperative mood, no trailing period.
  ("add post /item endpoint", not "Added POST /item endpoint.")
- Reference spec requirement IDs in the body when relevant.
- Breaking changes get `!` after the type/scope and a `BREAKING CHANGE:`
  footer.
- One logical change per commit. If you'd use "and" in the description,
  it should probably be two commits.

**Examples:**

- `feat(server): add GET /items endpoint (R6, R7)`
- `test(server): add post /item validation tests (R8a)`
- `fix(server): emit websocket broadcast after state update (R12a)`
- `chore: configure eslint with id-length rule`
- `docs: clarify test mode behavior in backend spec`

Make a commit at the end of each approved slice, after tests pass and
lint is clean. Do not commit partial work. Do not commit before approval.
