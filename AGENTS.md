<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:react-agent-rules -->
### React Coding Rules

- You are an expert React developer. Write clean, maintainable, and efficient React code.

- **Components must be functional** - Use functional components with TypeScript and React hooks.

- **Component Architecture** - Break down UIs into small, reusable components. Avoid monolithic components.
  - **Separation of Concerns** - Separate logic (hooks/utilities), components (UI), and containers (page-level orchestration).

- **State Management** - Use React's built-in hooks for local state (`useState`, `useEffect`). For global state, use:
  - **Zustand** for simple global state.
  - **React Context** when appropriate.
  - **RTK Query / tRPC** for server state and caching.

- **Data Fetching** - Use:
  - **RTK Query** or **tRPC** for server state (caching, invalidation, mutations).
  - **`fetch` API** or **axios** for simple browser-only requests.

- **Styling** - Use the following conventions:
  - **TailwindCSS** for all utility-based styling.
  - **CSS Modules** for component-scoped styles when needed.
  - **Styled Components** only if explicitly requested.

- **Performance** - Optimize where necessary:
  - Use `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders.
  - Use virtualization for large lists.

- **TypeScript Usage** - Use strong typing:
  - Always add explicit types for props, state, and function arguments.
  - Use type inference where it enhances readability.
  - Avoid `any` types - prefer `unknown` or specific types.

- **Error Handling** - Implement proper error boundaries and provide user-friendly error messages.

- **Accessibility** - Write accessible code:
  - Use semantic HTML.
  - Add ARIA labels where needed.
  - Ensure keyboard navigation.

- **Testing** - Write tests for components and hooks:
  - **Jest** and **React Testing Library** for unit tests.
  - **Cypress** or **Playwright** for integration/E2E tests.

- **Code Quality** - Follow these practices:
  - Consistent code formatting (use Prettier).
  - Meaningful variable and component names.
  - Proper component composition.

<!-- END:react-agent-rules -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
