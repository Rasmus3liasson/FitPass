# Development Workflow

## Quick Setup

```bash
# Install dependencies (includes prettier, husky, lint-staged)
pnpm install

# Copy environment template
cp .env.example .env
# Edit .env with your values
```

## Commands

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `pnpm format`       | Auto-format all code with Prettier      |
| `pnpm format:check` | Check if code is formatted (used in CI) |
| `pnpm validate`     | Run format check + type check           |
| `pnpm dev:all`      | Start all dev servers                   |

## Pre-commit Hook

Automatically formats staged files when you commit:

```bash
git commit -m "your message"
# ✨ Pre-commit hook auto-formats your code
```

## Before Pushing (Local Validation)

```bash
pnpm validate
```

This runs the same checks as CI/CD:

- ✅ Prettier formatting check
- ✅ TypeScript type checking

## CI/CD

GitHub Actions runs on push/PR:

1. Format check
2. Type check
3. Build validation

Pipeline fails if code is unformatted or has type errors.

## Files

- `.prettierrc` - Formatting rules
- `.prettierignore` - Files to skip
- `.lintstagedrc.js` - Pre-commit config
- `.husky/pre-commit` - Git hook
- `.github/workflows/ci.yml` - CI/CD pipeline
