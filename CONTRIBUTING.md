# 🤝 Contributing to NeuroTime

Thank you for your interest in contributing to NeuroTime! We want to make contributing as easy and transparent as possible.

## ⚖️ Code of Conduct
We are committed to providing a friendly, safe, and welcoming environment for all. Please be respectful of others in all interactions.

## 🛠️ Development Environment

### Prerequisites
- Node.js >= 18.x
- npm or yarn
- Git

### Initial Setup
1. Clone the repo.
2. Run `npm install`.
3. Create `.env.local` based on `.env.example` (or the README instructions).
4. Run `npm run dev` to start the development server.

## 🌿 Branching Strategy
- `main`: Production-ready code only.
- `develop`: Main development branch.
- `feature/*`: New features or enhancements.
- `fix/*`: Bug fixes.

## 📝 Coding Standards

### TypeScript
- All new code must be type-safe. Avoid `any` at all costs.
- Prefer interfaces over types for public-facing object definitions.

### React
- Use Functional Components with Hooks.
- Keep components small and focused on a single responsibility.
- Use `lazy` and `Suspense` for page-level components to improve initial load speed.

### Styling
- Use **Tailwind CSS 4** classes for styling.
- Follow the project's glassmorphism design system (see `index.css` for utility classes like `glass-card`, `neo-aurora`).

### Naming Conventions
- **Components**: PascalCase (e.g., `MissionForm.tsx`).
- **Hooks**: camelCase starting with `use` (e.g., `useMissions.ts`).
- **Services/Utils**: camelCase (e.g., `authService.ts`).
- **CSS Variables**: kebab-case.

## 🧪 Testing
- Write tests for core logic and complex components using **Vitest** and **React Testing Library**.
- Run tests before submitting a PR: `npm run test`.

## 📤 Submission Process
1. Update the documentation if you've added new features.
2. Ensure all tests pass.
3. Open a Pull Request with a clear description of the changes.
4. Reference any related issues in the PR description.

---

Questions? Feel free to reach out to the project maintainers!
