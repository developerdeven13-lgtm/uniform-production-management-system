'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { createOrder } from '@/actions/orders'
import { PRODUCT_TYPES, MEASUREMENT_FIELDS } from '@/lib/constants/products'
import type { Customer } from '@/types/app.types'
import { CustomerSearchCombobox } from '@/components/customers/CustomerSearchCombobox'
import { MeasurementForm } from '@/components/measurements/MeasurementForm'

interface OrderItem {
  product_type: string
  quantity: number
  color: string
  piping_color: string
  has_embroidery: boolean
  embroidery_name: string
  special_instructions: string
  unit_price: string
  measurements: Record<string, string>
}

const defaultItem = (): OrderItem => ({
  product_type: 'scrubs',
  quantity: 1,
  color: '',
  piping_color: '',
  has_embroidery: false,
  embroidery_name: '',
  special_instructions: '',
  unit_price: '',
  measurements: {},
})

const STEPS = ['Customer', 'Items', 'Measurements', 'Review']

export function OrderForm({ prefillCustomer }: { prefillCustomer?: Customer }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [customer, setCustomer] = useState<Customer | null>(prefillCustomer ?? null)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [priority, setPriority] = useState('2')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [items, setItems] = useState<OrderItem[]>([defaultItem()])

  const addItem = () => setItems(prev => [...prev, defaultItem()])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const updateItem = useCallback((index: number, field: keyof OrderItem, value: unknown) => {
    setItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index]!, [field]: value }
      return next
    })
  }, [])

  const updateMeasurement = useCallback((itemIndex: number, field: string, value: string) => {
    setItems(prev => {
      const next = [...prev]
      const item = next[itemIndex]!
      next[itemIndex] = { ...item, measurements: { ...item.measurements, [field]: value } }
      return next
    })
  }, [])

  const canNext = () => {
    if (step === 0) return Boolean(customer)
    if (step === 1) return items.length > 0 && items.every(i => i.product_type && i.quantity > 0)
    return true
  }

  const handleSubmit = async () => {
    if (!customer) return
    setSubmitting(true)

    try {
      const result = await createOrder({
        customer_id: customer.id,
        delivery_date: deliveryDate || null,
        priority: Number(priority),
        special_instructions: specialInstructions || null,
        items: items.map(item => ({
          product_type: item.product_type,
          quantity: item.quantity,
          color: item.color || null,
          piping_color: item.piping_color || null,
          has_embroidery: item.has_embroidery,
          embroidery_name: item.embroidery_name || null,
          special_instructions: item.special_instructions || null,
          unit_price: item.unit_price ? Number(item.unit_price) : null,
        })),
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`Order ${result.data.order_number} created successfully`)
      router.push(`/orders/${result.data.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                i < step ? 'bg-blue-600 border-blue-600 text-white' :
                i === step ? 'border-blue-600 text-blue-600 bg-white' :
                'border-slate-200 text-slate-400 bg-white'
              }`}>
                {i + 1}
              </span>
              <span className="text-sm font-medium hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Step 0: Customer */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Select Customer</h2>
          <CustomerSearchCombobox
            value={customer}
            onChange={setCustomer}
          />
          {customer && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="font-medium text-slate-900">{customer.full_name}</p>
              <p className="text-sm text-slate-600 mt-0.5">{customer.phone}</p>
              {customer.organization && (
                <p className="text-sm text-slate-500">{customer.organization}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 — Urgent</option>
                <option value="2">2 — Normal</option>
                <option value="3">3 — Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Special Instructions
            </label>
            <textarea
              rows={3}
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="Any special notes for this entire order…"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 1: Items */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Order Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {items.map((item, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900">Item {i + 1}</h3>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={item.product_type}
                    onChange={e => updateItem(i, 'product_type', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRODUCT_TYPES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Navy Blue"
                    value={item.color}
                    onChange={e => updateItem(i, 'color', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Piping Color</label>
                  <input
                    type="text"
                    placeholder="e.g. White"
                    value={item.piping_color}
                    onChange={e => updateItem(i, 'piping_color', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Embroidery */}
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.has_embroidery}
                    onChange={e => updateItem(i, 'has_embroidery', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Has Embroidery</span>
                </label>

                {item.has_embroidery && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Embroidery Name / Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Sita Sharma"
                      value={item.embroidery_name}
                      onChange={e => updateItem(i, 'embroidery_name', e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Item Special Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Special notes for this item…"
                  value={item.special_instructions}
                  onChange={e => updateItem(i, 'special_instructions', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2: Measurements */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Measurements</h2>
          <p className="text-sm text-slate-500">
            Enter measurements for each item. All values in centimetres (cm).
          </p>
          {items.map((item, i) => {
            const fields = MEASUREMENT_FIELDS[item.product_type as keyof typeof MEASUREMENT_FIELDS] ?? []
            return (
              <MeasurementForm
                key={i}
                itemIndex={i}
                productType={item.product_type}
                fields={fields}
                values={item.measurements}
                onChange={(field, value) => updateMeasurement(i, field, value)}
              />
            )
          })}
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Review & Submit</h2>

          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
            <div className="px-5 py-4">
              <p className="text-xs text-slate-500 mb-1">Customer</p>
              <p className="font-medium text-slate-900">{customer?.full_name}</p>
              <p className="text-sm text-slate-600">{customer?.phone}</p>
            </div>
            {deliveryDate && (
              <div className="px-5 py-4">
                <p className="text-xs text-slate-500 mb-1">Delivery Date</p>
                <p className="text-sm text-slate-900">{deliveryDate}</p>
              </div>
            )}
            <div className="px-5 py-4">
              <p className="text-xs text-slate-500 mb-2">Items ({items.length})</p>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-medium capitalize">
                        {PRODUCT_TYPES.find(p => p.value === item.product_type)?.label}
                      </span>
                      {' '}&times; {item.quantity}
                      {item.color && <span className="text-slate-500"> · {item.color}</span>}
                      {item.has_embroidery && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          Embroidery
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {specialInstructions && (
              <div className="px-5 py-4">
                <p className="text-xs text-slate-500 mb-1">Special Instructions</p>
                <p className="text-sm text-slate-700">{specialInstructions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Creating…' : 'Create Order'}
          </button>
        )}
      </div>
    </div>
  )
}
