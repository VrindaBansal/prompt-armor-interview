import { listUsers } from '@/lib/actions/users';
import { requireUser } from '@/lib/supabase/auth';
import { UsersManager } from './users-manager';

export const metadata = { title: 'Users | ClearPath' };

export default async function UsersPage() {
  const admin = await requireUser(['admin']);
  const users = await listUsers();
  const staffCount = users.filter((user) => user.role !== 'submitter').length;

  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-slate-900/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Identity control</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">Users</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Create Supabase Auth accounts, update access, or permanently remove a login while retaining its compliance history.
            </p>
          </div>
          <div className="flex gap-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
            <span>{users.length} active</span>
            <span aria-hidden>·</span>
            <span>{staffCount} staff</span>
          </div>
        </header>

        <div className="mt-8">
          <UsersManager currentUserId={admin.id} initialUsers={users} />
        </div>
      </div>
    </main>
  );
}
