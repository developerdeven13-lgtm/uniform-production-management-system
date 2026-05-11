'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { updateOrder } from '@/actions/orders'
import { PRODUCT_TYPES } from '@/lib/constants/products'
import { PRODUCT_LABEL } from '@/lib/constants/products'

interface OrderItemRow {
  id: string
  sequence_number: number
  product_type: string
  quantity: number
  gender: string | null
  color: string | null
  piping_color: string | null
  has_embroidery: boolean
  embroidery_name: string | null
  special_instructions: string | null
  unit_price: number | null
}

interface OrderRow {
  id: string
  order_number: string
  delivery_date: string | null
  priority: number
  special_instructions: string | null
}

interface EditOrderFormProps {
  order: OrderRow
  items: OrderItemRow[]
}

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export function EditOrderForm({ order, items: initialItems }: EditOrderFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const [deliveryDate, setDeliveryDate] = useState(order.delivery_date ?? '')
  const [priority, setPriority] = useState(String(order.priority))
  const [specialInstructions, setSpecialInstructions] = useState(order.special_instructions ?? '')

  const [items, setItems] = useState(
    initialItems.map(item => ({
      id: item.id,
      product_type: item.product_type,
      quantity: item.quantity,
      gender: item.gender ?? 'unisex',
      color: item.color ?? '',
      piping_color: item.piping_color ?? '',
      has_embroidery: item.has_embroidery,
      embroidery_name: item.embroidery_name ?? '',
      special_instructions: item.special_instructions ?? '',
      unit_price: item.unit_price != null ? String(item.unit_price) : '',
    }))
  )

  const updateItem = (index: number, field: string, value: unknown) => {
    setItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index]!, [field]: value }
      return next
    })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await updateOrder(order.id, {
        delivery_date: deliveryDate || null,
        priority: Number(priority),
        special_instructions: specialInstructions || null,
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          gender: item.gender,
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

      toast.success('Order updated successfully')
      router.push(`/orders/${order.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Order-level fields */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Order Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className={inputCls}
            >
              <option value="1">1 — Urgent</option>
              <option value="2">2 — Normal</option>
              <option value="3">3 — Low</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label>
            <textarea
              rows={3}
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="Any special notes for this order…"
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Item-level fields */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Items</h2>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={item.id} className="border border-slate-200 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">
                Item {i + 1} — {PRODUCT_LABEL[item.product_type as keyof typeof PRODUCT_LABEL] ?? item.product_type}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                  <select
                    value={item.gender}
                    onChange={e => updateItem(i, 'gender', e.target.value)}
                    className={inputCls}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Navy Blue"
                    value={item.color}
                    onChange={e => updateItem(i, 'color', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Piping Color</label>
                  <input
                    type="text"
                    placeholder="e.g. White"
                    value={item.piping_color}
                    onChange={e => updateItem(i, 'piping_color', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.has_embroidery}
                    onChange={e => updateItem(i, 'has_embroidery', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Has Embroidery</span>
                </label>

                {item.has_embroidery && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Embroidery Name / Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Sita Sharma"
                      value={item.embroidery_name}
                      onChange={e => updateItem(i, 'embroidery_name', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Item Special Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="Special notes for this item…"
                    value={item.special_instructions}
                    onChange={e => updateItem(i, 'special_instructions', e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.push(`/orders/${order.id}`)}
          className="px-4 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
