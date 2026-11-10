import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "admin_session";

async function verifyEdgeSessionToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiresStr, providedSig] = parts;
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`admin:${expiresAt}`)
  );
  const expectedSig = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expectedSig.length !== providedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    diff |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i);
  }
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  const secret = (process.env.ADMIN_PASSWORD || "").trim();
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyEdgeSessionToken(token, secret);

  if (!isAuthenticated) {
    if (pathname.startsWith("/api/admin/")) {
      return new NextResponse(
        JSON.stringify({
          type: "https://marianecosmeticos.com.br/erros/nao-autorizado",
          title: "Acesso não autorizado",
          status: 401,
          detail: "Sessão administrativa ausente ou expirada.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/problem+json; charset=utf-8" },
        }
      );
    }

    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
