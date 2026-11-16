import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";

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

  // 1. Regras de Autenticação Administrativa (Preservadas)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
      const res = NextResponse.next();
      res.headers.set("Vary", "Accept");
      return res;
    }

    const secret = (process.env.ADMIN_PASSWORD || "").trim();
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isAuthenticated = await verifyEdgeSessionToken(token, secret);

    if (!isAuthenticated) {
      if (pathname.startsWith("/api/admin/")) {
        return new NextResponse(
          JSON.stringify({
            type: `${SITE_URL}/erros/nao-autorizado`,
            title: "Acesso não autorizado",
            status: 401,
            detail: "Sessão administrativa ausente ou expirada.",
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/problem+json; charset=utf-8",
              "Vary": "Accept",
            },
          }
        );
      }

      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const res = NextResponse.next();
    res.headers.set("Vary", "Accept");
    return res;
  }

  // 2. Negociação de Conteúdo Markdown (R1)
  const acceptHeader = request.headers.get("accept") || "";
  const isMarkdownRequest = acceptHeader.includes("text/markdown");

  // Exclusão expressa de rotas privadas/internas e arquivos estáticos
  const isExcludedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/carrinho") ||
    pathname.startsWith("/pedido") ||
    pathname.startsWith("/_next");

  if (isMarkdownRequest && !isExcludedRoute) {
    const markdownApiUrl = new URL(
      `/api/markdown?path=${encodeURIComponent(pathname)}`,
      request.url
    );
    const rewriteResponse = NextResponse.rewrite(markdownApiUrl);
    rewriteResponse.headers.set("Vary", "Accept");
    return rewriteResponse;
  }

  // 3. Respostas HTML / padrão incluem header Vary: Accept
  const response = NextResponse.next();
  response.headers.set("Vary", "Accept");
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
