# Adobe Creative Mission Control (P0)

Core principle: **Discover globally. Execute locally. Resume seamlessly.**

This prototype demonstrates multi-hop WebMCP workflows for **Kaftan** and **Adobe Plans** using synthetic data only.

## Architecture (Milestone 1)

- **Universal Nav / global layer** handles capability discovery and typed handoff creation.
- **Product surfaces** (`/project/kaftan`, `/firefly`, `/express`, `/plans`) register their own local WebMCP tools for execution.
- **Persistent mission context** is kept in React state and `sessionStorage` so mission/handoff state survives route navigation.
- **Data is synthetic only** (Meera, Kaftan project, files, and generated outputs). No production Adobe APIs or customer data are used.

## Routes

- `/cc-home`
- `/project/kaftan`
- `/firefly`
- `/express`
- `/plans`
- `/capabilities`

## Local setup

Use Node **20.19.0+** (see `.nvmrc`):

```bash
nvm use
```

```bash
npm install
npm run dev
```

## Verification commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deployment to Vercel (prepared steps)

If you have Vercel access configured locally:

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npx vercel login
npx vercel
npx vercel --prod
```

No local-only filesystem paths are required for runtime behavior.

## Production WebMCP testing (Chrome/WebMCP-capable browser)

1. Open the deployed app and first click **Reset Demo** in the top nav.
2. Confirm routes are directly loadable by URL:
   - `/plans`
   - `/project/kaftan`
   - `/firefly`
   - `/express`
3. In a WebMCP-capable browser context, verify global discovery tools are available:
   - `get_user_region`
   - `get_current_adobe_context`
   - `discover_adobe_capabilities`
   - `find_tools_for_task`
   - `describe_capability`
   - `prepare_handoff`
   - `resume_workflow`
4. Verify local tools by route:
   - `/plans`: `get_regional_plans`, `get_plan_capabilities`, `get_plan_price`, `compare_plan_options`
   - `/project/kaftan`: `get_project_context`, `search_files`, `get_file_metadata`, `find_duplicates`, `delete_file`
   - `/firefly`: `change_background`
   - `/express`: `create_business_card`
5. Verify `delete_file` requires human UI approval:
   - first call returns `confirmation_required`
   - click **Approve deletion** in UI
   - second call with confirmation ID succeeds

Plans dataset label shown in UI: **Demo plan data for WebMCP prototype**.
