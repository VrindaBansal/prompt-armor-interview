import { Card, CardContent } from "./card";
import { Spinner } from "./spinner";

export function PageLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f3f1eb] px-5">
      <Card>
        <CardContent>
          <Spinner label={label} />
        </CardContent>
      </Card>
    </main>
  );
}
