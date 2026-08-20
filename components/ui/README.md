# ClearPath UI

ClearPath uses a restrained **regulatory dossier** aesthetic: ink-dark actions, paper-white surfaces, precise borders, and amber accents for items requiring attention. Components are keyboard accessible and expose native HTML props.

## Public API

- `Button` — `variant: primary | secondary | danger | ghost`, `size: sm | md | lg`, and `loading`.
- `Card`, `CardHeader`, `CardContent`, `CardFooter` — composable content containers.
- `Badge` — `tone: neutral | info | success | warning | danger`.
- `StatusPill` — accepts the frozen submission `status` values.
- `SeverityTag` — accepts `blocker | warning | advisory`.
- `Field`, `TextArea`, `Select` — require `label` and `name`; support `hint` and `error`.
- `EmptyState` — requires `title` and `description`; accepts `eyebrow` and an `action` node.
- `Spinner` — accepts an accessible `label`.

Import public components from `@/components/ui`. Avoid deep imports so the implementation can evolve without changing consumers.

```tsx
import { Button, Card, CardContent, StatusPill } from "@/components/ui";

<Card>
  <CardContent className="flex items-center justify-between">
    <StatusPill status="in_review" />
    <Button variant="secondary">Open review</Button>
  </CardContent>
</Card>
```
