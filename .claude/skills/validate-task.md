# Skill: validate-task

## When to use

Use this skill after implementation.

---

## Instructions

1. Read:
   - SPEC.md
   - CLAUDE.md
   - repo-map.md

2. Validate:

- business rules correctness
- duplication
- architecture violations
- misplaced logic
- missing exports
- contract mismatches

---

## Output

- list of issues
- suggested fixes

---

## TDD Validation

Check:

- were tests written before implementation?
- do tests cover business rules?
- are edge cases covered?

If not, report as issue.

---

## Important

DO NOT rewrite everything.
ONLY suggest targeted improvements.