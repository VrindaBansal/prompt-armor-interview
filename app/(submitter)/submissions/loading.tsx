import { Card, CardContent, Spinner } from "@/components/ui";

export default function SubmissionsLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f3f1eb]"><Card><CardContent><Spinner label="Loading your submissions" /></CardContent></Card></main>;
}
