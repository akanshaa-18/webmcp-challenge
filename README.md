# Creative Community — WebMCP Prototype

Core principles:
- **Discover globally. Execute locally. Resume seamlessly.**
- **Understand globally. Verify authoritatively. Compose across Adobe. Hand off precisely.**

This prototype demonstrates multi-hop WebMCP workflows for **Kaftan** and plan-selection journeys involving publicly described Adobe product capabilities, with live regional pricing and snapshot product metadata.

## Architecture (Milestone 1)

- **Universal Nav / global layer** handles capability discovery and typed handoff creation.
- **Public flow** composes workflow context on `/cc-home` and hands users directly to registry-owned public product destinations (for example `https://firefly.adobe.com/`).
- **Legacy/demo surfaces** (`/project/kaftan`, `/firefly`, `/express`) remain available for compatibility and route-local WebMCP lifecycle regression tests.
- **Plans surface** (`/plans`) remains part of the public flow for pricing/capability exploration.
- **Persistent mission context** is kept in React state and `sessionStorage` so mission/handoff state survives route navigation.
- **Mission/project data is synthetic** (Meera, Kaftan project, files, and generated outputs).
- **Regional pricing** is resolved at request time from an approved public Adobe commerce path (MAS fragment → offer selector → regional commerce response).
- **Public intelligence catalog** (`lib/catalog/*`) is sourced as a **public reference snapshot** and powers global read-only product intelligence tools.
- **Workflow composer** (`build_adobe_workflow`) composes deterministic multi-step Adobe workflows from structured catalog capabilities.

### Capability naming convention (developer-facing)

- Capability registry entries are namespaced IDs (examples: `public.find_product_for_task`, `public.build_adobe_workflow`).
- Runtime WebMCP tools are registered by surface with unprefixed names (examples: `find_product_for_task`, `build_adobe_workflow`).
- This mapping is intentional: registry IDs are for global discovery/catalog; runtime names are the executable tool names shown in WebMCP inspectors.

## Routes

- Public routes: `/cc-home`, `/plans`, `/capabilities`
- Legacy/demo routes: `/project/kaftan`, `/firefly`, `/express`

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
   - `/cc-home`
3. In a WebMCP-capable browser context, verify global discovery tools are available:
   - `get_user_region`
   - `get_current_adobe_context`
   - `discover_adobe_capabilities`
   - `find_tools_for_task`
   - `build_adobe_workflow`
   - `find_product_for_task`
   - `get_product_capabilities`
   - `get_product_system_requirements`
   - `check_device_compatibility`
   - `describe_capability`
   - `prepare_handoff`
   - `resume_workflow`
4. Verify local tools by route:
   - `/plans`: `get_regional_plans`, `get_plan_capabilities`, `get_plan_price`, `compare_plan_options`
5. Verify public workflow handoff behavior on `/cc-home`:
   - compose workflow with `build_adobe_workflow`
   - confirm primary CTA opens the external registry destination URL directly (for example Firefly)
   - confirm no route transition through `/firefly` or `/express` in the public flow
6. Verify legacy/demo route-local tools remain available when those routes are opened explicitly:
   - `/project/kaftan`: `get_project_context`, `search_files`, `get_file_metadata`, `find_duplicates`, `delete_file`
   - `/firefly`: `change_background`
   - `/express`: `create_business_card`
7. Verify `delete_file` requires human UI approval:
   - first call returns `confirmation_required`
   - click **Approve deletion** in UI
   - second call with confirmation ID succeeds

Plans disclosure shown in UI: **Plan information uses a public reference snapshot. Pricing is resolved at request time from live regional pricing.**

Public catalog data source label used by the new intelligence tools: **public_reference_snapshot**.

## Upload handling in this prototype

The workflow may carry asset context (for example, "User-provided image"), but this prototype does **not** transfer binary user uploads into external Adobe surfaces. Handoffs preserve structured intent and workflow context only, and users continue in destination products by adding source assets there.

---

## WebMCP Implementation

This project demonstrates **tool discovery and workflow orchestration** using the WebMCP (Web Model Context Protocol) standard:

### Core WebMCP Features Used

1. **Global Tool Discovery** — Agents discover tools registered by Adobe surfaces (Photoshop, Firefly, Express, Premiere Pro, Illustrator)
2. **Problem-to-Tool Matching** — Keyword-based semantic matching finds relevant tools for user problems
3. **Workflow Composition** — Multi-step creative workflows are suggested based on user goals and available tools
4. **Seamless Handoff** — Context-aware URLs redirect users to surfaces with full intent/problem information

### WebMCP Tools Registered

**Global Discovery Tools:**
- `discover_surface_tools` — List all WebMCP tools available from a specific Adobe surface
- `recommend_tools_for_problem` — Find tools that solve a user's specific problem (with relevance scoring)
- `suggest_workflow_from_goal` — Break down creative goals into multi-step workflows across surfaces
- `get_tool_redirect_url` — Generate redirect URLs to tools with user context

**Surface-Local Tools:**
- Plans Surface: `get_regional_plans`, `get_plan_capabilities`, `get_plan_price`, `compare_plan_options`
- Kaftan Demo: `get_project_context`, `search_files`, `get_file_metadata`, `find_duplicates`, `delete_file`
- Firefly Surface: `change_background`
- Express Surface: `create_business_card`

### Testing WebMCP Tools

In **ChatGPT's in-app browser** or **Chrome 149+** with WebMCP enabled (chrome://flags/#enable-webmcp-testing):

```
Example agent interactions:
1. "What tools does Photoshop have for lighting adjustments?"
   → Uses discover_surface_tools("Photoshop")

2. "I need to fix mismatched lighting in my composite photo"
   → Uses recommend_tools_for_problem("lighting mismatch")
   → Returns: Harmonize tool with 95% relevance match

3. "Clean up product photos, enhance them for a campaign, and create an Instagram post"
   → Uses suggest_workflow_from_goal(...)
   → Suggests: Photoshop → Firefly → Express workflow

4. "Take me to the Harmonize tool"
   → Uses get_tool_redirect_url("harmonize", "Photoshop", context)
   → Redirects to Photoshop with tool context
```

### Technical Implementation

- **Tool Registration:** Uses standard WebMCP API (`document.modelContext.registerTool()` and `navigator.modelContext.registerTool()`)
- **Tool Schema:** Structured `inputSchema` for LLM reasoning about tool capabilities
- **Security:** Read-only annotations and untrusted content hints on user-input tools
- **Registry:** Mock registry demonstrates tool discovery pattern (production would query live registry from browser WebMCP API)

### Architecture Highlights

- Tools are registered by **surface** (not globally) — Photoshop registers its own tools, Firefly registers its own, etc.
- Discovery layer **matches problems to tool descriptions** — no complex ML, just keyword-based matching with relevance scoring
- Workflows are **composed from available tools** — suggests sequences based on what tools each surface exposes
- Handoffs include **full context** — user's problem statement and workflow goals passed to destination surface via URL parameters

### Demo Flow (Meera's Story)

1. **[0:55–1:05]** Student asks: "How do I match this lighting in my composite?"
   - Agent uses `recommend_tools_for_problem("lighting doesn't match")`
   - Discovers Harmonize in Photoshop (95% relevance)
   
2. **[2:07–2:25]** Student says: "Clean up photos → premium campaign look → Instagram"
   - Agent uses `suggest_workflow_from_goal(...)`
   - Recommends: Photoshop (cleanup) → Firefly (campaign background) → Express (social format)
   
3. **[2:25–2:34]** Student clicks "Try Harmonize"
   - Agent uses `get_tool_redirect_url("harmonize", "Photoshop", context)`
   - Opens Photoshop with Harmonize tool pre-selected

### Production Readiness

- ✅ All tools follow WebMCP specification
- ✅ Proper input validation and error handling
- ✅ Security annotations for untrusted content
- ✅ Signal-based cancellation for clean cleanup
- ✅ Context preservation across handoffs
- ⚠️ Mock registry — production would query live Adobe WebMCP registry
