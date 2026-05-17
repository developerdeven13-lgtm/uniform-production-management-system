import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/server-session'
import Link from 'next/link'
import {
  FileText, CheckCircle, User, Scissors,
  Layers, ShieldCheck, Package, Truck,
  type LucideIcon,
} from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatDate } from '@/lib/utils/format-date'
import type { OrderStatus } from '@/types/app.types'

const PIPELINE_ROWS: {
  status: string
  label: string
  color: string
  icon: LucideIcon
}[] = [
  { status: 'draft',         label: 'Draft',        color: '#B4B2A9', icon: FileText      },
  { status: 'confirmed',     label: 'Confirmed',    color: '#85B7EB', icon: CheckCircle   },
  { status: 'assigned',      label: 'Assigned',     color: '#AFA9EC', icon: User          },
  { status: 'in_tailoring',  label: 'In Tailoring', color: '#EF9F27', icon: Scissors      },
  { status: 'in_embroidery', label: 'Embroidery',   color: '#AFA9EC', icon: Layers        },
  { status: 'quality_check', label: 'QC',           color: '#ED93B1', icon: ShieldCheck   },
  { status: 'ready',         label: 'Ready',        color: '#5DCAA5', icon: Package       },
  { status: 'delivered',     label: 'Delivered',    color: '#1D9E75', icon: Truck         },
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
    <div className="max-w-7xl w-full">
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
              color: urgent > 0 ? "#A32D2D" : "#888780",
              marginTop: 2,
            }}
            className="text-[10px] 2xl:text-[22px]"
          >
            {urgent > 0 ? "Need attention" : "All clear"}
          </div>
        </Link>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
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
                        fontWeight: 700,
                        color: "#2C2C2A",
                        letterSpacing: "-0.3px",
                      }}
                      className="text-[13px] 2xl:text-[17px]"
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
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "0.5px solid #F1EFE8",
            }}
          >
            <span
              className="text-[10px] 2xl:text-[17px]"
              style={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888780" }}
            >
              Pipeline breakdown
            </span>
            <span className="text-[10px] 2xl:text-[14px]" style={{ color: "#B4B2A9" }}>
              {totalOrders} orders total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 2xl:gap-x-16" style={{ padding: "20px 24px" }}>
            {([PIPELINE_ROWS.slice(0, 4), PIPELINE_ROWS.slice(4)] as typeof PIPELINE_ROWS[]).map(
              (group, groupIdx) => (
                <div key={groupIdx}>
                  {group.map((row, localIdx) => {
                    const { status, label, color, icon: Icon } = row
                    const globalIdx = groupIdx * 4 + localIdx
                    const count = orders.filter((o) => o.status === status).length
                    const isActive = count > 0
                    const isLast = localIdx === group.length - 1
                    const nextRow = group[localIdx + 1]
                    const nextCount = nextRow
                      ? orders.filter((o) => o.status === nextRow.status).length
                      : 0
                    const lineGradient = isActive
                      ? `linear-gradient(to bottom, ${color}, ${nextRow && nextCount > 0 ? nextRow.color : "#D3D1C7"})`
                      : "#EDEBE4"

                    return (
                      <Link
                        key={status}
                        href={`/orders?status=${status}`}
                        className="group flex gap-4 2xl:gap-5"
                        style={{ textDecoration: "none" }}
                      >
                        <div className="flex flex-col items-center shrink-0 w-10 2xl:w-14">
                          <div
                            className="w-10 h-10 2xl:w-14 2xl:h-14 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: isActive ? color : "#F1EFE8",
                              border: isActive ? "none" : "0.5px solid #D3D1C7",
                              boxShadow: isActive ? `0 0 0 4px ${color}18` : "none",
                              transition: "box-shadow 0.2s",
                            }}
                          >
                            <Icon className="w-4 h-4 2xl:w-6 2xl:h-6" style={{ color: isActive ? "#fff" : "#C8C6BD" }} />
                          </div>
                          {!isLast && (
                            <div
                              className="w-0.5 2xl:w-[3px] flex-1 my-1 rounded-full"
                              style={{ minHeight: 32, background: lineGradient }}
                            />
                          )}
                        </div>
                        <div
                          className="flex-1 min-w-0"
                          style={{ paddingBottom: isLast ? 0 : 24, paddingTop: 4 }}
                        >
                          <div className="flex items-center gap-1.5 mb-1 2xl:mb-2">
                            <span
                              className="text-[8px] 2xl:text-[11px] font-bold font-mono tracking-[0.05em]"
                              style={{ color: "#D3D1C7" }}
                            >
                              {String(globalIdx + 1).padStart(2, "0")}
                            </span>
                            <span
                              className="text-[9px] 2xl:text-[12px] font-semibold uppercase tracking-[0.1em]"
                              style={{ color: isActive ? "#5F5E5A" : "#B4B2A9" }}
                            >
                              {label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className="text-[30px] 2xl:text-[44px] font-bold leading-none"
                              style={{ letterSpacing: "-1.2px", color: isActive ? "#2C2C2A" : "#D3D1C7" }}
                            >
                              {count}
                            </span>
                            {isActive && (
                              <span
                                className="text-[9px] 2xl:text-[13px]"
                                style={{ color: "#888780", marginBottom: 1 }}
                              >
                                order{count !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
