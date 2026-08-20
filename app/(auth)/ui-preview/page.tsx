import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  EmptyState,
  Field,
  Select,
  SeverityTag,
  Spinner,
  StatusPill,
  TextArea,
} from "@/components/ui";

const statuses = [
  "draft",
  "pending_ai",
  "ai_screened",
  "in_review",
  "approved",
  "changes_requested",
  "rejected",
] as const;

export default function UiPreviewPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-12 text-slate-950">
      <div className="mx-auto grid max-w-5xl gap-8">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">ClearPath system preview</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Regulatory work, without visual noise.</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">A working inventory of the controls used across submission, review, and reporting workflows.</p>
        </header>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Actions and labels</h2>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex flex-wrap gap-3">
              <Button>Submit for review</Button>
              <Button variant="secondary">Save draft</Button>
              <Button variant="danger">Reject</Button>
              <Button variant="ghost">Cancel</Button>
              <Button loading>Screening</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => <StatusPill key={status} status={status} />)}
            </div>
            <div className="flex flex-wrap gap-2">
              <SeverityTag severity="blocker" />
              <SeverityTag severity="warning" />
              <SeverityTag severity="advisory" />
              <Badge tone="success">Verified</Badge>
            </div>
          </CardContent>
          <CardFooter><Spinner label="Refreshing queue" /></CardFooter>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Submission fields</h2></CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <Field hint="Use the campaign name reviewers will recognize." label="Campaign title" name="preview-title" placeholder="Summer rate campaign" />
            <Select label="Channel" name="preview-channel" defaultValue="">
              <option disabled value="">Select a channel</option>
              <option value="email">Email</option>
              <option value="social">Social</option>
            </Select>
            <div className="md:col-span-2"><TextArea error="Content is required before review." label="Marketing content" name="preview-content" /></div>
          </CardContent>
        </Card>

        <EmptyState action={<Button size="sm">Create submission</Button>} description="New submissions will appear here as soon as a campaign owner sends one for review." title="The queue is clear" />
      </div>
    </main>
  );
}
