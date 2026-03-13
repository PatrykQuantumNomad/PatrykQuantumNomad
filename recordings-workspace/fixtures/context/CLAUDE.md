# Project Conventions

## Code Style
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Always add JSDoc comments to exported functions
- Prefer `const` over `let`

## Testing
- Use Node.js built-in test runner (`node --test`)
- Every new endpoint must have at least one test
- Test files go in `test/` with `.test.js` extension

## Architecture
- Routes go in `src/routes/`
- Middleware goes in `src/middleware/`
- Type definitions go in `src/types/`
- Business logic should be separated from route handlers
