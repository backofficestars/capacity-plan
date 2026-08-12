# Financial Cents API Reference

## Base URL

```
https://app.financial-cents.com/api/v1
```

## Authentication

Bearer token in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

The API key is stored in Railway as `FINANCIAL_CENTS_API_KEY`.

Rate limit: 250 requests per minute. Pagination: 100 results per page.

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/clients` | GET | All clients (with nested contacts, groups, custom fields, relationships) |
| `/contacts` | GET | All contacts (includes notes field that /clients doesn't) |
| `/clients/{id}/resources` | GET | Assignees for a specific client |

## How Active/Inactive Works

Financial Cents does **not** use a `status` field. Instead it uses:

| Field | Type | Meaning |
|-------|------|---------|
| `is_archived` | boolean | `false` = active, `true` = archived/inactive |
| `archived_at` | timestamp or null | `null` = active, has a date = archived |

To get only active clients, filter client-side:

```typescript
// Skip archived/inactive clients
if (client.is_archived === true || client.archived_at != null) {
  continue;
}
```

There is **no server-side filter parameter** for active/inactive. You must fetch all clients and filter locally.

## Client Object Key Fields

| Field | Description |
|-------|-------------|
| `company_name` | Primary client/company name |
| `display_name` | Display name (used in Create/Update) |
| `name` | Fallback name field |
| `is_archived` | Active/inactive flag |
| `archived_at` | Archival timestamp |

## Query Parameters for /clients

| Parameter | Description |
|-----------|-------------|
| `search[field]` | One of: `"name"` |
| `search[operation]` | One of: `"equals"`, `"beginswith"`, `"endswith"`, `"contains"` |
| `search[value]` | Search terms |
| `order_by` | One of: `"created_at"`, `"updated_at"`, `"name"` |
| `order_dir` | `"asc"` or `"desc"` |
| `page` | Page number (100 per page) |

## Gotchas

- The `status` field on client objects does **not** indicate active/inactive. Do not use it for filtering.
- The `/clients` endpoint returns both active and archived clients. You must filter using `is_archived`.
- Some records may appear to be individual people rather than companies (e.g. personal names). These are legitimate client records in FC that may need cleanup directly in Financial Cents.
