import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import Link from 'next/link'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatDate } from '@/lib/utils/format-date'
import type { OrderStatus } from '@/types/app.types'

const PIPELINE_ROWS = [
  { status: 'draft',         label: 'Draft',        color: '#B4B2A9' },
  { status: 'confirmed',     label: 'Confirmed',    color: '#85B7EB' },
  { status: 'assigned',      label: 'Assigned',     color: '#AFA9EC' },
  { status: 'in_tailoring',  label: 'In Tailoring', color: '#EF9F27' },
  { status: 'in_embroidery', label: 'Embroidery',   color: '#AFA9EC' },
  { status: 'quality_check', label: 'QC',           color: '#ED93B1' },
  { status: 'ready',         label: 'Ready',        color: '#5DCAA5' },
  { status: 'delivered',     label: 'Delivered',    color: '#1D9E75' },
]

export default async function DashboardPage() {
  await requireUser()
  const supabase = await createClient()

  const [ordersResult, customersResult, recentResult] = await Promise.all([
    supabase.from('orders').select('status, priority', { count: 'exact' }),
    supabase.from('customers').select('id', { count: 'exact' }),
    supabase
      .from('orders')
      .select('id, order_number, status, priority, delivery_date, customer:customers(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalOrders = ordersResult.count ?? 0
  const totalCustomers = customersResult.count ?? 0
  const orders = ordersResult.data ?? []
  const recentOrders = recentResult.data ?? []

  const inProduction = orders.filter(o =>
    ['assigned', 'in_tailoring', 'in_embroidery', 'quality_check'].includes(o.status)
  ).length
  const delivered = orders.filter(o => o.status === 'delivered').length
  const urgent = orders.filter(o => o.priority === 1).length
  const completionRate = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0

  const maxPipelineCount = Math.max(
    1,
    ...PIPELINE_ROWS.map(r => orders.filter(o => o.status === r.status).length)
  )

  return (
    <div className="max-w-6xl">
      {/* Hero stat */}
      <div className="mb-0">
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
            {totalOrders}
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
              Total orders
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
              production
              <br />
              this year
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{ height: "0.5px", background: "#D3D1C7", margin: "16px 0" }}
      />

      {/* KPI strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderBottom: "0.5px solid #D3D1C7",
          marginBottom: 24,
        }}
      >
        <Link
          href="/orders?status=delivered"
          style={{
            padding: "16px 0",
            borderRight: "0.5px solid #D3D1C7",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              // fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-1.5px",
              lineHeight: 1,
              color: "#0F6E56",
            }}
            className="text-[36px] 2xl:text-[45px]"
          >
            {delivered}
          </div>
          <div
            style={{
              // fontSize: 10,
              color: "#888780",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 4,
            }}
            className="text-[10px] 2xl:text-[22px]"
          >
            Delivered
          </div>
          <div
            style={{
              // fontSize: 10,
              color: "#0F6E56",
              marginTop: 2,
            }}
            className="text-[10px] 2xl:text-[22px]"
          >
            ↑ {completionRate}% rate
          </div>
        </Link>
        <Link
          href="/orders?status=in_tailoring"
          style={{
            padding: "16px 0 16px 16px",
            borderRight: "0.5px solid #D3D1C7",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              // fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-1.5px",
              lineHeight: 1,
              color: "#854F0B",
            }}
            className="text-[36px] 2xl:text-[45px]"
          >
            {inProduction}
          </div>
          <div
            style={{
              // fontSize: 10,
              color: "#888780",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 4,
            }}
            className="text-[10px] 2xl:text-[22px]"
          >
            In production
          </div>
          <div
            style={{
              //  fontSize: 10,
              color: "#888780",
              marginTop: 2,
            }}
            className="text-[10px] 2xl:text-[22px]"
          >
            Active now
          </div>
        </Link>
        <Link
          href="/orders?priority=urgent"
          style={{ padding: "16px 0 16px 16px", textDecoration: "none" }}
        >
          <div
            style={{
              // fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-1.5px",
              lineHeight: 1,
              color: urgent > 0 ? "#A32D2D" : "#2C2C2A",
            }}
            className="text-[36px] 2xl:text-[45px]"
          >
            {urgent}
          </div>
          <div
            style={{
              // fontSize: 10,
              color: "#888780",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 4,
            }}
            className="text-[10px] 2xl:text-[22px]"
          >
            Urgent
          </div>
          <div
            style={{
              // fontSize: 10,
              color: urgent > 0 ? "#A32D2D" : "#888780",
              marginTop: 2,
            }}
            className="text-[10px] 2xl:text-[22px]"
          >
            {urgent > 0 ? "Need attention" : "All clear"}
          </div>
        </Link>
      </div>

      {/* Two-column body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Left: recent orders + pipeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Recent orders */}
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #D3D1C7",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "0.5px solid #F1EFE8",
              }}
            >
              <span
                style={{
                  // fontSize: 10,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#888780",
                }}
                className="text-[10px] 2xl:text-[17px]"
              >
                Recent orders
              </span>
              <Link
                href="/orders"
                style={{
                  // fontSize: 11,
                  color: "#0F6E56",
                  textDecoration: "none",
                }}
                className="text-[11px] 2xl:text-[17px]"
              >
                View all →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div
                style={{
                  padding: "32px 18px",
                  textAlign: "center",
                  color: "#888780",
                  fontSize: 12,
                }}
                className="text-[12px] 2xl:text-[24px]"
              >
                No orders yet.{" "}
                <Link
                  href="/orders/new"
                  style={{ color: "#0f2416", fontWeight: 500 }}
                >
                  Create one →
                </Link>
              </div>
            ) : (
              recentOrders.map((order, idx) => {
                const customer = Array.isArray(order.customer)
                  ? (order.customer[0] as { full_name: string } | undefined)
                  : (order.customer as { full_name: string } | null);
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      alignItems: "center",
                      padding: "11px 18px",
                      borderBottom:
                        idx < recentOrders.length - 1
                          ? "0.5px solid #F1EFE8"
                          : "none",
                      textDecoration: "none",
                      transition: "background 0.1s",
                      gap: 10,
                    }}
                    className="hover:bg-[#F7F5EE]"
                  >
                    <div>
                      <div
                        style={{
                          // fontSize: 13,
                          fontWeight: 700,
                          color: "#2C2C2A",
                          letterSpacing: "-0.3px",
                        }}
                        className="text-[13px] 2xl:text-[20px]"
                      >
                        {order.order_number}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#888780", marginTop: 1 }}
                      >
                        {customer?.full_name ?? "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {order.priority === 1 && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "3px 8px",
                            borderRadius: 99,
                            // fontSize: 10,
                            fontWeight: 500,
                            background: "#2C2C2A",
                            color: "#F1EFE8",
                          }}
                          className="text-[10px] 2xl:text-[12px]"
                        >
                          Urgent
                        </span>
                      )}
                      <OrderStatusBadge
                        status={order.status as OrderStatus}
                        className="text-[10px] 2xl:text-[12px]"
                      />
                    </div>
                    <div
                      style={{
                        // fontSize: 11,
                        color: "#888780",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                      className="text-[11px] 2xl:text-[12px]"
                    >
                      {order.delivery_date
                        ? `Due ${formatDate(order.delivery_date)}`
                        : "—"}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Pipeline breakdown */}
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #D3D1C7",
              borderRadius: 14,
              padding: "14px 18px",
            }}
          >
            <div
              style={{
                // fontSize: 10,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#888780",
                marginBottom: 14,
              }}
              className="text-[10px] 2xl:text-[17px]"
            >
              Pipeline breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PIPELINE_ROWS.map(({ status, label, color }) => {
                const count = orders.filter((o) => o.status === status).length;
                const pct =
                  count > 0 ? Math.round((count / maxPipelineCount) * 100) : 0;
                return (
                  <Link
                    key={status}
                    href={`/orders?status=${status}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        // fontSize: 10,
                        color: "#5F5E5A",
                        width: 100,
                        flexShrink: 0,
                      }}
                      className="text-[10px] 2xl:text-[17px]"
                    >
                      {label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: "#D3D1C7",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 2,
                          background: color,
                          width: `${pct}%`,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 500,
                        color: "#2C2C2A",
                        width: 18,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: stats panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #D3D1C7",
              borderRadius: 14,
              padding: "18px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {/* Completion */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  // fontSize: 9,
                  fontWeight: 500,
                  color: "#888780",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
                className="text-[10px] 2xl:text-[17px]"
              >
                Completion
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  letterSpacing: "-2px",
                  color: "#2C2C2A",
                  lineHeight: 1,
                }}
              >
                {completionRate}
                <span
                  style={{ fontSize: 28, color: "#888780", fontWeight: 500 }}
                >
                  %
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#888780", marginTop: 4 }}>
                {delivered} of {totalOrders} delivered
              </div>
              <div
                style={{
                  height: 4,
                  background: "#F1EFE8",
                  borderRadius: 2,
                  marginTop: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${completionRate}%`,
                    height: "100%",
                    background: "#1D9E75",
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                height: "0.5px",
                background: "#F1EFE8",
                margin: "4px 0 16px",
              }}
            />

            {/* Urgent */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  // fontSize: 9,
                  fontWeight: 500,
                  color: "#888780",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
                className="text-[10px] 2xl:text-[17px]"
              >
                Urgent
              </div>
              <Link
                href="/orders?priority=urgent"
                style={{
                  display: "block",
                  background: urgent > 0 ? "#FCEBEB" : "#F1EFE8",
                  border: `0.5px solid ${urgent > 0 ? "#F7C1C1" : "#D3D1C7"}`,
                  borderRadius: 10,
                  padding: "12px",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 700,
                    letterSpacing: "-2px",
                    color: urgent > 0 ? "#791F1F" : "#2C2C2A",
                    lineHeight: 1,
                  }}
                >
                  {urgent}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: urgent > 0 ? "#A32D2D" : "#888780",
                    marginTop: 3,
                    fontWeight: 500,
                  }}
                >
                  {urgent > 0 ? "Need attention now" : "No urgent orders"}
                </div>
              </Link>
            </div>

            <div
              style={{
                height: "0.5px",
                background: "#F1EFE8",
                margin: "4px 0 16px",
              }}
            />

            {/* Customers */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  // fontSize: 9,
                  fontWeight: 500,
                  color: "#888780",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 4,
                }}
                className="text-[10px] 2xl:text-[17px]"
              >
                Customers
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: "#2C2C2A",
                  letterSpacing: "-1.5px",
                  lineHeight: 1,
                }}
              >
                {totalCustomers}
              </div>
              <div style={{ fontSize: 10, color: "#888780", marginTop: 4 }}>
                Registered clients
              </div>
            </div>

            <div
              style={{
                height: "0.5px",
                background: "#F1EFE8",
                margin: "4px 0 16px",
              }}
            />

            {/* Quick actions */}
            <div>
              <div
                style={{
                  // fontSize: 9,
                  fontWeight: 500,
                  color: "#888780",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 10,
                }}
                className="text-[10px] 2xl:text-[17px]"
              >
                Quick actions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Link
                  href="/orders/new"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 14px",
                    background: "#0f2416",
                    color: "#fff",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  + New Order
                </Link>
                <Link
                  href="/customers/new"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 14px",
                    background: "#F1EFE8",
                    color: "#2C2C2A",
                    border: "0.5px solid #D3D1C7",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  + New Customer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
