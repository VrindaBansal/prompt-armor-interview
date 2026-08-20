import { NextResponse } from "next/server";

export function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function rawFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function authRedirect(request: Request, path: string, error?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export function safeNextPath(value: string | null, fallback = "/submissions") {
  if (!value || !value.startsWith("/") || /[\\\r\n]/.test(value)) return fallback;

  try {
    const safeOrigin = "https://clearpath.invalid";
    const candidate = new URL(value, safeOrigin);
    if (candidate.origin !== safeOrigin) return fallback;
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return fallback;
  }
}

export function rejectCrossOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  try {
    if (
      !origin ||
      origin !== new URL(request.url).origin ||
      fetchSite === "cross-site"
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return null;
}

export function appUrl(path: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) throw new Error("NEXT_PUBLIC_SITE_URL is not set");

  const base = new URL(configured);
  const local = base.hostname === "localhost" || base.hostname === "127.0.0.1";
  if (base.protocol !== "https:" && !(local && base.protocol === "http:")) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS outside local development");
  }

  return new URL(path, base);
}
