# auth.md

You are an agent. This document describes how to use **Exclusiva Sexshop** via MCP.

Specification: https://github.com/workos/auth.md

> **Integration path:** use the MCP server. Catalog, cart, checkout and customer authentication are all exposed as MCP tools. You do **not** need to call the REST API directly.

---

## MCP Server (public)

The MCP endpoint is **public** — no API key or token is required to connect.

| Resource | URL |
|----------|-----|
| MCP endpoint | `https://mcp.exclusivasex.com.br/mcp` |
| MCP Server Card | `https://mcp.exclusivasex.com.br/.well-known/mcp/server-card.json` |
| Agent Skills index | `https://mcp.exclusivasex.com.br/.well-known/agent-skills/index.json` |
| Health check | `https://mcp.exclusivasex.com.br/` |

Example client config:

```json
{
  "mcpServers": {
    "exclusiva-store": {
      "url": "https://mcp.exclusivasex.com.br/mcp"
    }
  }
}
```

---

## Customer login (inside MCP)

Most catalog and cart tools work anonymously. Actions tied to a specific shopper (checkout, orders, profile, addresses) require customer authentication — done **via MCP tools**, not by you directly:

1. **`store_create_session`** — always call first; creates an anonymous store session
2. **Catalog/cart** — `store_search_products`, `store_add_to_cart`, `store_quote_shipping`, … (no login needed)
3. **Customer login** (only when needed):
   - `store_login` — e-mail or CPF + password
   - `store_request_access_key` → `store_login_access_key` — passwordless e-mail code
4. **Checkout** — `store_set_delivery_address`, `store_set_delivery_method`, `store_checkout`
5. **Orders/profile** — `store_list_orders`, `store_get_profile`, `store_list_addresses`, …

The customer session (JWT) is managed internally by the MCP server. You never handle tokens or REST calls.

---

## Registration

No agent registration or API key is required. Connect directly to the MCP endpoint and start using tools.

To integrate or ask questions:

- Site: https://www.exclusivasex.com.br/contato
- E-mail: paulo.gentile@exclusivasex.com.br

---

## Scopes

Scopes describe intended access levels for future OAuth support:

| Scope | MCP tools (examples) |
|-------|---------------------|
| `catalog:read` | `store_get_home`, `store_search_products`, `store_list_categories` |
| `products:read` | `store_get_by_url`, `store_get_product_shipping` |
| `cart:write` | `store_add_to_cart`, `store_apply_coupon`, `store_quote_shipping` |
| `checkout:write` | `store_checkout`, `store_set_delivery_method` |
| `profile:read` | `store_get_profile`, `store_list_addresses` |
| `orders:read` | `store_list_orders`, `store_track_order` |

---

## Discovery Endpoints

| Endpoint | Content |
|----------|---------|
| `https://mcp.exclusivasex.com.br/.well-known/mcp/server-card.json` | MCP Server Card |
| `https://mcp.exclusivasex.com.br/.well-known/agent-skills/index.json` | Agent Skills index |
| `/.well-known/oauth-protected-resource` | OAuth PRM (RFC 9728) |
| `/.well-known/oauth-authorization-server` | OAuth AS metadata with `agent_auth` |
| `/.well-known/api-catalog` | API Catalog (RFC 9727) |
| `/.well-known/mcp/server-card.json` | MCP Server Card mirror on www |
