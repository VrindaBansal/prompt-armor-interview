import { Card, CardContent, Spinner } from "@/components/ui";

export default function SubmissionDetailLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f3f1eb]"><Card><CardContent><Spinner label="Loading submission record" /></CardContent></Card></main>;
}
