import { NextResponse } from "next/server";

export function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function authRedirect(request: Request, path: string, error?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export function safeNextPath(value: string | null, fallback = "/submissions") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
