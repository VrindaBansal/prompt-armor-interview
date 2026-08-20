"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, deleteUser, updateUser } from "@/lib/actions/users";
import type { ManagedUser, ManagedUserInput, Role } from "@/lib/types";
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, Field, Select } from "@/components/ui";

const ROLES: Role[] = ["submitter", "reviewer", "admin"];
const emptyForm: Required<ManagedUserInput> = {
  email: "",
  full_name: "",
  role: "submitter",
  password: "",
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

export function UsersManager({ currentUserId, initialUsers }: { currentUserId: string; initialUsers: ManagedUser[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Required<ManagedUserInput>>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function beginEdit(user: ManagedUser) {
    setEditingId(user.id);
    setForm({ email: user.email, full_name: user.full_name, role: user.role, password: "" });
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) await updateUser(editingId, form);
        else await createUser(form);
        resetForm();
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to save user");
      }
    });
  }

  function remove(user: ManagedUser) {
    if (!window.confirm(`Delete the login for ${user.email}? This cannot be reversed.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteUser(user.id);
        if (editingId === user.id) resetForm();
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to delete user");
      }
    });
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(19rem,.72fr)_minmax(0,1.28fr)]">
      <Card className="lg:sticky lg:top-28">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{editingId ? "Edit account" : "New account"}</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field
            disabled={pending}
            label="Full name"
            maxLength={120}
            name="user-full-name"
            onChange={(event) => setForm((value) => ({ ...value, full_name: event.target.value }))}
            required
            value={form.full_name}
          />
          <Field
            autoComplete="email"
            disabled={pending}
            label="Email"
            maxLength={320}
            name="user-email"
            onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
            required
            type="email"
            value={form.email}
          />
          <Select
            disabled={pending}
            label="Role"
            name="user-role"
            onChange={(event) => setForm((value) => ({ ...value, role: event.target.value as Role }))}
            value={form.role}
          >
            {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
          </Select>
          {!editingId ? (
            <Field
              autoComplete="new-password"
              disabled={pending}
              hint="At least 12 characters. Send it through a secure channel."
              label="Temporary password"
              maxLength={1024}
              minLength={12}
              name="user-password"
              onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
              required
              type="password"
              value={form.password}
            />
          ) : null}
          {error ? <p className="text-sm font-medium text-red-700" role="alert">{error}</p> : null}
        </CardContent>
        <CardFooter>
          <Button loading={pending} onClick={save}>{editingId ? "Save changes" : "Create user"}</Button>
          {editingId ? <Button disabled={pending} onClick={resetForm} variant="ghost">Cancel</Button> : null}
        </CardFooter>
      </Card>

      <div className="grid gap-3">
        {initialUsers.map((user) => {
          const isCurrent = user.id === currentUserId;
          return (
            <Card key={user.id}>
              <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-slate-950">{user.full_name || "Unnamed user"}</h2>
                    <Badge tone={user.role === "admin" ? "warning" : user.role === "reviewer" ? "info" : "neutral"}>{user.role}</Badge>
                    {isCurrent ? <Badge tone="success">You</Badge> : null}
                    {!user.email_confirmed ? <Badge tone="danger">Unconfirmed</Badge> : null}
                  </div>
                  <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
                  <p className="mt-2 text-xs text-slate-500">Created {formatDate(user.created_at)} · Last sign-in {formatDate(user.last_sign_in_at)}</p>
                </div>
                <div className="flex gap-2 sm:justify-end">
                  <Button disabled={pending} onClick={() => beginEdit(user)} size="sm" variant="secondary">Edit</Button>
                  <Button disabled={pending || isCurrent} onClick={() => remove(user)} size="sm" variant="danger">Delete</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
