# Admin UI - Agent Guidelines

## Available Scripts

### Development

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Type Checking

```bash
npm run check            # Run svelte-check once
npm run check:watch      # Run svelte-check in watch mode
```

### i18n (Paraglide)

```bash
# Compile translation messages from messages/*.json to src/lib/paraglide/
npm run paraglide:compile

# Watch mode - recompiles when translation files change
npm run paraglide:watch
```

### Testing

```bash
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

## Project Structure Notes

### Paraglide i18n Setup

- Translation source files: `messages/en.json`, `messages/tr.json`
- Compiled output: `src/lib/paraglide/` (auto-generated, do not edit)
- Usage: `import * as m from '$lib/paraglide/messages.js'`

### Type Safety

- Shared types: `src/lib/types.ts`
- Blueprint types: `src/lib/components/blueprint/types.ts`
- Note: `BlueprintSummary` (listing) vs `Blueprint` (builder) are different types

### Important Paths

- `$lib` → `src/lib/`
- `$lib/paraglide/*` → `src/lib/paraglide/*`
- `$lib/components/blueprint/*` → `src/lib/components/blueprint/*`

## Common Issues & Solutions

### LSP/TypeScript Errors

If you see errors like `Cannot find module '$lib/paraglide/*'`:

1. Run `npm run paraglide:compile` to generate type declarations
2. Restart TypeScript server in your editor

### Blueprint Type Conflicts

- `BlueprintSummary` (in `src/lib/types.ts`): Used for listing pages with metadata
- `Blueprint` (in `src/lib/components/blueprint/types.ts`): Used for builder with full field definitions

### Date Parsing Safety

Always validate dates before comparing:

```typescript
const dateA = new Date(a.updatedAt).getTime();
if (isNaN(dateA)) { /* handle invalid date */ }
```

## Code Review Notes

When reviewing code, check for:

1. Blueprint type consistency
2. Proper paraglide message imports
3. Safe date parsing
4. Proper error handling in async functions
5. Review comments (marked with `REVIEW NOTE:`)
