# React Defensive Props & Multi-Parent Navigation Invariants

## 1. Defensive Prop Handling in Shared Views
- Shared sub-views (components mounted in multiple parent workspaces, e.g., `StrategyWorkspace`, `InstagramWorkspace`) must treat context-dependent props (like `activeSkill`, `account`, `user`) as optional (`activeSkill?: AISkillRecord`, `account: InstagramAccount | null`).
- Always use optional chaining (`?.`) and fallback defaults when reading nested properties in template rendering (e.g., `{activeSkill?.version ?? 1}`).
- Never allow a component to crash if an account is null or loading; render a dedicated zero-state prompt directing the user to connect or select an account.

## 2. Multi-Parent Prop Audit
- When updating or adding props to a child component, search the codebase for all parent containers mounting that component (`grep -rn "<ChildComponent"`).
- Ensure all parent workspaces pass the required props, callbacks, and types consistently.
- Support fallback callback chains (e.g., `handleSendToTopics = onSendToTopics || onGenerateTopicsFromAudit`).

## 3. Browser-Based Headless Smoke Verification
- After modifying navigation, routing, or sub-view props, run a headless browser test (using Playwright listening to `pageerror` and `console` error events) to verify that navigating to the view succeeds with 0 unhandled exceptions before declaring the task complete.
