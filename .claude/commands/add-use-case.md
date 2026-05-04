# Add Use Case

Scaffold an Application layer use case following clean architecture rules.

## Usage
`/add-use-case <UseCaseName>`

## Steps

1. **Create use case file** — `src/application/use-cases/<UseCaseName>.ts`

   Required structure:
   ```typescript
   // Input/output DTOs in same file or separate dto/ files
   export interface <UseCaseName>Input { ... }
   export interface <UseCaseName>Output { ... }

   export class <UseCaseName> {
     constructor(
       // Inject only domain interfaces (IXxxRepository), never concrete classes
     ) {}

     async execute(input: <UseCaseName>Input): Promise<<UseCaseName>Output> { ... }
   }
   ```

2. **Verify layer rules**
   - Imports ONLY from `src/domain/` (entities, repositories interfaces, services)
   - Never import from `src/infrastructure/` or `src/app/`

3. **Write tests** (optional but recommended)
   - Place in `tests/application/use-cases/<UseCaseName>.test.ts`
   - Mock repository interfaces, never concrete implementations

## Rules
- Use case class has single `execute()` method
- Constructor receives only domain interfaces
- No direct DB calls — all persistence through repository interfaces
