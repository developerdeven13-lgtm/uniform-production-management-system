'use client'

import { PRODUCT_LABEL } from '@/lib/constants/products'

const FIELD_LABELS: Record<string, string> = {
  chest: 'Chest (cm)',
  waist: 'Waist (cm)',
  hip: 'Hip (cm)',
  shoulder: 'Shoulder (cm)',
  sleeve_length: 'Sleeve Length (cm)',
  body_length: 'Body Length (cm)',
  inseam: 'Inseam (cm)',
  neck: 'Neck (cm)',
  head_circumference: 'Head Circumference (cm)',
  card_size: 'Card Size',
}

interface MeasurementFormProps {
  itemIndex: number
  productType: string
  fields: string[]
  values: Record<string, string>
  onChange: (field: string, value: string) => void
}

export function MeasurementForm({
  itemIndex,
  productType,
  fields,
  values,
  onChange,
}: MeasurementFormProps) {
  const label = PRODUCT_LABEL[productType as keyof typeof PRODUCT_LABEL] ?? productType

  return (
    <div className="border border-slate-200 rounded-xl p-5">
      <h3 className="font-medium text-slate-900 mb-4">
        Item {itemIndex + 1} — {label}
      </h3>

      {fields.length === 0 ? (
        <p className="text-sm text-slate-500">No measurements required for this product type.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {fields.map(field => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {FIELD_LABELS[field] ?? field}
              </label>
              {field === 'card_size' ? (
                <input
                  type="text"
                  placeholder="e.g. CR80"
                  value={values[field] ?? ''}
                  onChange={e => onChange(field, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="250"
                  placeholder="0.0"
                  value={values[field] ?? ''}
                  onChange={e => onChange(field, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
