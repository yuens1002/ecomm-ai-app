Call a tool get-ftc-instructions from a shadcn-studio mcp server with the following prompt # and follow all the instructions provided in the response.

IMPORTANT: After receiving the shadcn response, apply these project code conventions to ALL generated code before writing it:

- Flat cards: `rounded-lg border p-6` divs — NEVER use shadcn `Card`/`CardContent`/`CardHeader` wrappers
- Info sections without border: `rounded-lg bg-muted/30 p-4`
- Empty states: `border-dashed rounded-md p-6 text-center`
- Grid gap: `gap-4` (not gap-6 or gap-8) — matches dashboard
- Desktop content max width: `max-w-[72ch]` on inputs and text content
- Section spacing: `space-y-12` between major sections, `space-y-6` within
- Bottom-aligned CTAs: `flex flex-col` on card + `mt-auto pt-5` on button container
- Buttons: never `w-full` unless explicitly requested
- ExternalLink icons: always `text-muted-foreground`
- Action icons (Send, Calendar, CreditCard): normal color, not muted
- Clickable cards: `transition-shadow hover:shadow-md cursor-pointer`
- No redundant icons on already-clickable elements
- Auto-refresh lists after mutations — lift state to parent
- Config-driven rendering for multi-state UIs
