# Code Quality Tools

This project uses ESLint and Prettier to ensure code quality and consistent formatting.

## Tools Installed

- **ESLint**: JavaScript/React linter to catch errors and enforce code quality
- **Prettier**: Code formatter to maintain consistent code style

## Available Commands

### Frontend (`/frontend`)

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is formatted correctly
npm run format:check
```

### Backend (`/backend`)

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is formatted correctly
npm run format:check
```

## Editor Integration

### VS Code

Install these extensions for the best experience:

1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier - Code formatter** (`esbenp.prettier-vscode`)

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Configuration Files

### ESLint

- Frontend: `frontend/.eslintrc.cjs` - React/JSX specific rules
- Backend: `backend/.eslintrc.cjs` - Node.js specific rules

### Prettier

- Frontend: `frontend/.prettierrc`
- Backend: `backend/.prettierrc`
- Ignore: `.prettierignore` (root level)

## Current Issues

Run `npm run lint` in the frontend to see current linting issues that need to be fixed.

## Pre-commit Hook (Optional)

Consider using `husky` and `lint-staged` to automatically lint and format code before commits:

```bash
npm install --save-dev husky lint-staged
npx husky install
```
