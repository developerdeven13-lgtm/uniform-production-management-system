import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils/format-date'
import type { Customer } from '@/types/app.types'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireUser()
  const supabase = await createClient()

  const params = await searchParams
  const query = params.q ?? ''
  const page = Number(params.page ?? '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let dbQuery = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (query) {
    dbQuery = dbQuery.textSearch('search_vector', query, { type: 'plain' })
  }

  const { data: customers, count } = await dbQuery
  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 14,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                // fontSize: 96,
                fontWeight: 700,
                lineHeight: 0.9,
                color: "#0f2416",
                letterSpacing: "-4px",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
              className="text-[96px] 2xl:text-[120px]"
            >
              {total}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                paddingBottom: 10,
              }}
            >
              <span
                style={{
                  //  fontSize: 11,
                  color: "#888780",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 500,
                }}
                className="text-[11px] 2xl:text-[15px]"
              >
                Total
              </span>
              <span
                style={{
                  // fontSize: 28,
                  fontWeight: 700,
                  color: "#2C2C2A",
                  letterSpacing: "-1px",
                  lineHeight: 1,
                  marginTop: 2,
                }}
                className="text-[28px] 2xl:text-[35px]"
              >
                Customer
                {/* <br />
                this year */}
              </span>
            </div>
          </div>
        </div>
        <Link
          href="/customers/new"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "#0f2416",
            color: "#fff",
            borderRadius: 9,
            fontWeight: 500,
            textDecoration: "none",
          }}
          className="text-[12px] 2xl:text-[15px]"
        >
          <Plus className="w-3.5 h-3.5" /> New Customer
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
          style={{ color: "#888780" }}
        />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name, phone, email, or organization…"
          className="w-full pl-9 pr-4 py-2.5 text-xs focus:outline-none"
          style={{
            border: "0.5px solid #D3D1C7",
            borderRadius: 9,
            background: "#fff",
            color: "#2C2C2A",
          }}
        />
      </form>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #D3D1C7",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {!customers || customers.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#5F5E5A" }}>
              No customers found.
            </p>
            <Link
              href="/customers/new"
              style={{
                display: "inline-block",
                marginTop: 12,
                fontSize: 12,
                fontWeight: 500,
                color: "#0f2416",
                textDecoration: "none",
              }}
            >
              Add your first customer →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "0.5px solid #F1EFE8",
                  background: "#F7F5EE",
                }}
              >
                {["Name", "Phone", "Organization", "Added", ""].map((h, i) => (
                  <th
                    key={i}
                    className={
                      i === 2
                        ? "hidden sm:table-cell"
                        : i === 3
                          ? "hidden md:table-cell"
                          : ""
                    }
                    style={{
                      textAlign: i === 4 ? "right" : "left",
                      padding: "10px 18px",
                      fontSize: 9,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#888780",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(customers as Customer[]).map((c, idx) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom:
                      idx < customers.length - 1
                        ? "0.5px solid #F1EFE8"
                        : "none",
                  }}
                  className="hover:bg-[#F7F5EE] transition-colors"
                >
                  <td
                    style={{
                      padding: "12px 18px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#2C2C2A",
                    }}
                  >
                    {c.full_name}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      fontSize: 12,
                      color: "#5F5E5A",
                    }}
                  >
                    {c.phone}
                  </td>
                  <td
                    className="hidden sm:table-cell"
                    style={{
                      padding: "12px 18px",
                      fontSize: 12,
                      color: "#888780",
                    }}
                  >
                    {c.organization ?? "—"}
                  </td>
                  <td
                    className="hidden md:table-cell"
                    style={{
                      padding: "12px 18px",
                      fontSize: 11,
                      color: "#888780",
                    }}
                  >
                    {formatDate(c.created_at)}
                  </td>
                  <td style={{ padding: "12px 18px", textAlign: "right" }}>
                    <Link
                      href={`/customers/${c.id}`}
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#0f2416",
                        textDecoration: "none",
                      }}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11, color: "#888780" }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {page > 1 && (
              <Link
                href={`/customers?page=${page - 1}${query ? `&q=${query}` : ""}`}
                style={{
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 500,
                  border: "0.5px solid #D3D1C7",
                  borderRadius: 9,
                  background: "#fff",
                  color: "#2C2C2A",
                  textDecoration: "none",
                }}
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/customers?page=${page + 1}${query ? `&q=${query}` : ""}`}
                style={{
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 500,
                  border: "0.5px solid #D3D1C7",
                  borderRadius: 9,
                  background: "#fff",
                  color: "#2C2C2A",
                  textDecoration: "none",
                }}
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
