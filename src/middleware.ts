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

function prefersMarkdown(acceptHeader: string): boolean {
  if (!acceptHeader || !acceptHeader.includes("text/markdown")) return false;
  let mdQ = 0;
  let htmlQ = 0;

  for (const part of acceptHeader.split(",")) {
    const segments = part.trim().split(";");
    const mime = segments[0]?.trim().toLowerCase();
    let q = 1;
    for (const seg of segments.slice(1)) {
      const m = /^q\s*=\s*([0-9.]+)$/i.exec(seg.trim());
      if (m) {
        const parsed = parseFloat(m[1]);
        if (Number.isFinite(parsed)) q = parsed;
      }
    }
    if (mime === "text/markdown") mdQ = Math.max(mdQ, q);
    else if (mime === "text/html") htmlQ = Math.max(htmlQ, q);
  }

  return mdQ > 0 && mdQ >= htmlQ;
}

const VARY_HEADER =
  "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Regras de Autenticação Administrativa (Preservadas)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
      const res = NextResponse.next();
      res.headers.set("Vary", VARY_HEADER);
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
              "Vary": VARY_HEADER,
            },
          }
        );
      }

      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const res = NextResponse.next();
    res.headers.set("Vary", VARY_HEADER);
    return res;
  }

  // 2. Negociação de Conteúdo Markdown (R1)
  const acceptHeader = request.headers.get("accept") || "";
  const isMarkdownRequest = prefersMarkdown(acceptHeader);

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
    try {
      const mdRes = await fetch(markdownApiUrl, {
        headers: { "x-internal-markdown": "1" },
        cache: "no-store",
      });
      const body = await mdRes.text();
      return new NextResponse(body, {
        status: mdRes.status,
        headers: {
          "Content-Type":
            mdRes.headers.get("content-type") || "text/markdown; charset=utf-8",
          "Vary": VARY_HEADER,
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      });
    } catch {
      const rewriteResponse = NextResponse.rewrite(markdownApiUrl);
      rewriteResponse.headers.set("Vary", VARY_HEADER);
      return rewriteResponse;
    }
  }

  // 3. Respostas HTML / padrão incluem tokens RSC + Accept no header Vary
  const response = NextResponse.next();
  response.headers.set("Vary", VARY_HEADER);
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
