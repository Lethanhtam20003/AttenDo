# Project Instructions & Agent Directives

## 1. Agent Directives (Token & Cost Optimization)
- ONLY output the necessary code and comments. NO long explanations, NO greetings.
- Get straight to the point. If fixing a bug, output ONLY the modified code blocks; do not print the entire file unless explicitly requested.

## 2. Stack and Commands
- App lives in `checkin-qr-app/` and uses Bun, Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, and Supabase (`@supabase/ssr`, `@supabase/supabase-js`).
- Run commands from `checkin-qr-app/`: `bun install`, `bun run dev`, `bun run lint`, and `bun run build`.
- TypeScript alias: `@/*` maps to `src/*`. There is no test script in `package.json`.
- DO NOT manually import third-party libraries (e.g., axios, moment, lodash, redux) unless explicitly requested by the user. Always use `lucide-react` for icons.

## 3. Architecture & State Management
- Routes and layouts live in `src/app/`; shared UI in `src/components/`; hooks in `src/hooks/`; Supabase clients in `src/lib/supabase/`; server actions in `src/actions/`; shared types in `src/types/`; Zustand stores in `src/store/`.
- **Server-First:** Prefer Server Components. Use Client Components only where browser APIs, event handlers, or client-side state are needed. Keep the client boundary as small/deep as practical.
- **State Hierarchy:**
  1. **URL State:** Use URL parameters (`?step=qr`) for shareable or navigable state.
  2. **Server State:** Rely on Next.js cache and Supabase instead of duplicating data in client state.
  3. **Local State:** Use `useState` for temporary UI toggles/inputs.
  4. **Global State (Zustand):** STRICTLY PROHIBITED to use Redux or React Context. Only use Zustand. Split into small, modular store files (e.g., `useCheckinStore.ts`). When using a store in a component, select specific state slices to prevent unnecessary re-renders (e.g., `const code = useStore(state => state.code)`).

## 4. Supabase & Data Flow
- ALWAYS inject TypeScript definitions (generated types) into the Supabase client (e.g., `createClient<Database>()`). Never execute untyped queries.
- Keep database mutations (Insert/Update/Delete) in Server Actions and authorize them on the server.
- Reuse the existing Supabase client helpers and `verifyAuth` where authentication is required.
- Handle Supabase errors explicitly. Catch exceptions when an API can throw; do not wrap every call in a blanket `try/catch`.

## 5. Coding Patterns & Naming Conventions
- **Naming:** 
  - `kebab-case` for directories and route files (`[eventId]/page.tsx`).
  - `PascalCase` for React Components (`QRScanner.tsx`).
  - `camelCase` for variables, custom hooks (`useLocation.ts`), and utilities (`geo.ts`).
- **Booleans:** Prefix with `is`, `has`, `should`, or `can` (e.g., `isCheckingIn`, `hasPermission`).
- **Handlers:** Prefix with `handle` for internal functions, `on` for event props (e.g., `onScanSuccess`).
- **Clean Code:** Apply **Early Return** to avoid deeply nested `if/else` blocks. Do not use the `any` type. Extract repetitive logic into Custom Hooks or Utils.

## 6. Hardware & Environment Fallbacks (Crucial)
- Camera and Geolocation APIs can be unavailable or blocked in iOS/Safari and in-app browsers (Zalo, Messenger, Facebook).
- **Mandatory Fallback:** ALWAYS provide a clear, user-friendly **Vietnamese** recovery message or Soft-Prompt UI when these features fail.
- Instruct users on specific troubleshooting steps (e.g., "Vui lòng nhấn vào dấu ... ở góc phải và chọn Mở bằng trình duyệt Safari/Chrome").
- Wrap all hardware Web API calls (Camera, GPS) in `try/catch` blocks.

## 7. UI & Comments Guidelines
- Use Tailwind CSS 4 and existing project dependencies. Do not impose a fixed visual style when the current UI patterns already fit.
- Keep comments concise and in **Vietnamese**. 
- Only comment to explain "WHY" (business logic, reasons for Zalo/iOS workarounds), not "WHAT" the code is doing.
- Use JSDoc for shared utility functions and services.