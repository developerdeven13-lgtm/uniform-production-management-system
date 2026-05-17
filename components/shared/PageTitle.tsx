import React from 'react'

interface PageTitleProps {
  count: number | string
  label: string
  title: string
  action?: React.ReactNode
}

export function PageTitle({ count, label, title, action }: PageTitleProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div
        style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 4 }}
        className="gap-[14px] 2xl:gap-[22px]"
      >
        {/* Big number */}
        <div
          style={{
            fontWeight: 700,
            lineHeight: 0.9,
            color: '#0f2416',
            letterSpacing: '-4px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          className="text-[50px] lg:text-[96px] 2xl:text-[128px]"
        >
          {count}
        </div>

        {/* Label stack */}
        <div
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          className="pb-[10px] 2xl:pb-[16px]"
        >
          <span
            style={{
              color: '#888780',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 500,
            }}
            className="text-[11px] 2xl:text-[16px]"
          >
            {label}
          </span>
          <span
            style={{
              fontWeight: 700,
              color: '#2C2C2A',
              letterSpacing: '-1px',
              lineHeight: 1,
              marginTop: 2,
            }}
            className="text-[20px] lg:text-[28px] 2xl:text-[40px]"
          >
            {title}
          </span>
        </div>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
