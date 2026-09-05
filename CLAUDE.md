# HomeLedger implementation guide

See `AGENTS.md` for repository structure, architecture rules, sources of truth, the completion
contract, and PR/git conventions — this file only adds Claude-Code-specific workflow notes.

## Development workflow

1. Clarify acceptance criteria and inspect the smallest relevant code surface.
2. For new behavior or bug fixes, write a failing direct test, implement the minimum change, and
   refactor while green.
3. Obtain human approval before material financial-rule, architecture, or schema decisions that
   are not already explicit in the request.
4. Avoid unrelated refactors and scope expansion.
5. Run `npm run agent:check` before declaring the task complete (see `AGENTS.md`'s completion
   contract).
6. Update `CHANGELOG.md` for user-visible, domain, schema, or operational changes.

## Commands

```bash
npm run dev
npm run agent:check     # required: tests, quality ratchet, build, Prisma validation
npm test -- --runInBand # focused Jest runs while iterating
npm run verify           # agent:check plus Playwright; requires Postgres + installed browsers
```
