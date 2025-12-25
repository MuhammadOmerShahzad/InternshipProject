# Contributing to Muawin-v2

Thank you for your interest in contributing to Muawin-v2! This document provides guidelines and workflows to ensure a smooth contribution process.

## Version Control Strategy

We use **GitHub Flow** - a lightweight, branch-based workflow.

### Branching Model

```
main (production-ready)
  └── feature/user-authentication
  └── feature/dashboard-redesign
  └── bugfix/login-error
  └── hotfix/critical-security-patch
```

### Branch Naming Conventions

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New features | `feature/user-management` |
| `bugfix/` | Bug fixes | `bugfix/login-redirect` |
| `hotfix/` | Critical production fixes | `hotfix/auth-bypass` |
| `docs/` | Documentation updates | `docs/api-reference` |
| `refactor/` | Code refactoring | `refactor/auth-module` |

## Development Workflow

### 1. Create a Branch

```bash
# Always start from an updated main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, well-documented code
- Follow existing code patterns and conventions
- Add tests for new functionality

### 3. Commit Changes

Use meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <description>

# Examples
feat(auth): add password reset functionality
fix(dashboard): resolve tile loading issue
docs(readme): update installation instructions
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### PR Checklist

- [ ] Code follows project conventions
- [ ] All tests pass (`npm test`)
- [ ] Lint checks pass (`npm run lint`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] PR description explains the changes
- [ ] Related issue is linked (if applicable)

### CI/CD Pipeline

Your PR will automatically trigger:

1. **Lint Check** - Code style verification
2. **Type Check** - TypeScript compilation
3. **Build** - Production build verification
4. **Tests** - Unit and integration tests
5. **Preview Deploy** - Vercel preview URL

All checks must pass before merging.

## Code Standards

### TypeScript

- Use strict type checking
- Prefer interfaces over type aliases for objects
- Avoid `any` type - use `unknown` if necessary

### React/Next.js

- Use functional components with hooks
- Follow Next.js App Router conventions
- Use Server Components where possible

### Testing

- Write tests for new features
- Maintain test coverage
- Use descriptive test names

## Environment Setup

### Required Environment Variables

See `.env.example` for the complete list of required variables.

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Type check
npx tsc --noEmit
```

## Questions?

If you have questions about contributing, please open an issue with the `question` label.
