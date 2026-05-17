import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { ClickableOrderRow } from '@/components/orders/ClickableOrderRow'
import { formatDate } from '@/lib/utils/format-date'
import { ORDER_STATUSES } from '@/lib/constants/order-statuses'
import { PageTitle } from '@/components/shared/PageTitle'
import type { Order, OrderStatus } from '@/types/app.types'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; page?: string }>
}) {
  const user = await requireUser()
  const supabase = await createClient()

  const params = await searchParams
  const query = params.q ?? ''
  const statusFilter = params.status ?? ''
  const priorityFilter = params.priority ?? ''
  const page = Number(params.page ?? '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let dbQuery = supabase
    .from('orders')
    .select('*, customer:customers(id, full_name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (statusFilter) dbQuery = dbQuery.eq('status', statusFilter)
  if (priorityFilter === 'urgent') dbQuery = dbQuery.eq('priority', 1)
  if (query) dbQuery = dbQuery.textSearch('search_vector', query, { type: 'plain' })

  const { data: orders, count } = await dbQuery
  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)

  function buildUrl(overrides: { status?: string; priority?: string; page?: number; q?: string }) {
    const p = new URLSearchParams()
    const s = overrides.status !== undefined ? overrides.status : statusFilter
    const pr = overrides.priority !== undefined ? overrides.priority : priorityFilter
    const q2 = overrides.q !== undefined ? overrides.q : query
    const pg = overrides.page ?? 1
    if (s) p.set('status', s)
    if (pr) p.set('priority', pr)
    if (q2) p.set('q', q2)
    if (pg > 1) p.set('page', String(pg))
    const str = p.toString()
    return `/orders${str ? `?${str}` : ''}`
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <PageTitle
        count={total}
        label="Total"
        title={`Order${total !== 1 ? 's' : ''}`}
        action={
          <Link
            href="/orders/new"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#0f2416",
              color: "#fff",
              borderRadius: 9,
              fontWeight: 500,
              textDecoration: "none",
            }}
            className="text-[12px] px-2 py-2 lg:px-4 lg:py-2 2xl:text-[16px] 2xl:px-5 2xl:py-2.5"
          >
            <Plus className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
            New Order
          </Link>
        }
      />

      {/* Search + Filters */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #D3D1C7",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <form method="GET" className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "#888780" }}
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by order number, customer name…"
            className="w-full pl-9 pr-4 py-2.5 text-[13px] 2xl:text-[15px] focus:outline-none"
            style={{
              border: "0.5px solid #D3D1C7",
              borderRadius: 9,
              background: "#F7F5EE",
              color: "#2C2C2A",
            }}
          />
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          {priorityFilter && (
            <input type="hidden" name="priority" value={priorityFilter} />
          )}
        </form>

        {/* Filter chips */}
        <div
          className="flex gap-2 items-center overflow-x-auto"
          style={{ flexWrap: 'nowrap', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 2 } as React.CSSProperties}
        >
          <Link
            href="/orders"
            style={{
              padding: "4px 10px",
              borderRadius: 99,
              // fontSize: 10,
              fontWeight: 500,
              border: "0.5px solid",
              textDecoration: "none",
              ...(!statusFilter && !priorityFilter
                ? {
                    background: "#0f2416",
                    color: "#fff",
                    borderColor: "transparent",
                  }
                : {
                    background: "transparent",
                    color: "#888780",
                    borderColor: "#D3D1C7",
                  }),
            }}
            className="text-[10px] 2xl:text-[15px]"
          >
            All
          </Link>

          <Link
            href={buildUrl({
              priority: priorityFilter === "urgent" ? "" : "urgent",
              status: "",
              page: 1,
            })}
            style={{
              padding: "4px 10px",
              borderRadius: 99,
              // fontSize: 10,
              fontWeight: 500,
              border: "0.5px solid",
              textDecoration: "none",
              ...(priorityFilter === "urgent"
                ? {
                    background: "#FCEBEB",
                    color: "#791F1F",
                    borderColor: "#F7C1C1",
                  }
                : {
                    background: "transparent",
                    color: "#791F1F",
                    borderColor: "#F7C1C1",
                  }),
            }}
            className="text-[10px] 2xl:text-[15px]"
          >
            ⚠ Urgent
          </Link>

          <div
            style={{
              width: "0.5px",
              height: 18,
              background: "#D3D1C7",
              margin: "0 2px",
            }}
          />

          {ORDER_STATUSES.map((s) => (
            <Link
              key={s.value}
              href={buildUrl({
                status: statusFilter === s.value ? "" : s.value,
                page: 1,
              })}
              style={{
                padding: "4px 10px",
                borderRadius: 99,
                // fontSize: 10,
                fontWeight: 500,
                border: "0.5px solid",
                textDecoration: "none",
                ...(statusFilter === s.value
                  ? {
                      background: "#0f2416",
                      color: "#fff",
                      borderColor: "transparent",
                    }
                  : {
                      background: "transparent",
                      color: "#888780",
                      borderColor: "#D3D1C7",
                    }),
              }}
              className="text-[10px] 2xl:text-[15px]"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #D3D1C7",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {!orders || orders.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: "#F1EFE8",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <Plus className="w-5 h-5" style={{ color: "#888780" }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#2C2C2A" }}>
              No orders found
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#888780",
                marginTop: 4,
                marginBottom: 16,
              }}
            >
              {statusFilter || priorityFilter
                ? "Try adjusting your filters."
                : "Get started by creating your first order."}
            </p>
            {!statusFilter && !priorityFilter && (
              <Link
                href="/orders/new"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#0f2416",
                  textDecoration: "none",
                }}
              >
                + Create first order
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <table className="w-full text-sm" style={{ minWidth: 560 }}>
            <thead>
              <tr
                style={{
                  borderBottom: "0.5px solid #F1EFE8",
                  background: "#F7F5EE",
                }}
              >
                {[
                  "Order #",
                  "Customer",
                  "Status",
                  "Items",
                  "Delivery",
                  "Created",
                ].map((h, i) => (
                  <th
                    key={h}
                    // className={
                    //   i >= 3
                    //     ? i === 3
                    //       ? "hidden sm:table-cell"
                    //       : "hidden md:table-cell"
                    //     : ""
                    // }
                    style={{
                      textAlign: "left",
                      padding: "10px 18px",
                      // fontSize: 9,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#888780",
                    }}
                    className="text-[9px] 2xl:text-[12px]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                orders as (Order & {
                  customer: { full_name: string; phone: string } | null;
                })[]
              ).map((order) => (
                <ClickableOrderRow key={order.id} orderId={order.id}>
                  <td style={{ padding: "12px 18px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          // fontSize: 12,
                          fontWeight: 700,
                          color: "#2C2C2A",
                          letterSpacing: "-0.3px",
                        }}
                        className="text-[12px] 2xl:text-[15px]"
                      >
                        {order.order_number}
                      </span>
                      {order.priority === 1 && (
                        <span
                          style={{
                            // fontSize: 9,
                            padding: "2px 7px",
                            // background: "#2C2C2A",
                            color: "#F1EFE8",
                            borderRadius: 99,
                            fontWeight: 500,
                          }}
                          className="bg-red-400 text-[9px] 2xl:text-[12px]"
                        >
                          Urgent
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <p
                      style={{
                        // fontSize: 13,
                        fontWeight: 600,
                        color: "#2C2C2A",
                      }}
                      className="text-[13px] 2xl:text-[16px]"
                    >
                      {order.customer?.full_name ?? "—"}
                    </p>
                    <p style={{ fontSize: 11, color: "#888780" }}>
                      {order.customer?.phone}
                    </p>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <OrderStatusBadge
                      status={order.status as OrderStatus}
                      className="text-[9px] 2xl:text-[15px]"
                    />
                  </td>
                  <td
                    // className="hidden sm:table-cell"
                    style={{
                      padding: "12px 18px",
                      // fontSize: 12,
                      color: "#5F5E5A",
                    }}
                    className="text-[12px] 2xl:text-[15px]"
                  >
                    {order.total_items}
                  </td>
                  <td
                    // className="hidden md:table-cell"
                    style={{
                      padding: "12px 18px",
                      // fontSize: 11,
                      color: "#888780",
                    }}
                    className="text-[12px] 2xl:text-[15px]"
                  >
                    {order.delivery_date
                      ? formatDate(order.delivery_date)
                      : "—"}
                  </td>
                  <td
                    // className="hidden md:table-cell"
                    style={{
                      padding: "12px 18px",
                      // fontSize: 11,
                      color: "#888780",
                    }}
                    className="text-[12px] 2xl:text-[15px]"
                  >
                    {formatDate(order.created_at)}
                  </td>
                </ClickableOrderRow>
              ))}
            </tbody>
          </table>
          </div>
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
                href={buildUrl({ page: page - 1 })}
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
                href={buildUrl({ page: page + 1 })}
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
