'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Loader2, RotateCcw, FileText, UserPlus, X } from 'lucide-react'
import { useOrderDraftStore } from '@/store/order-draft-store'
import { AIFieldHighlight } from './AIFieldHighlight'
import { AmbiguityAlert } from './AmbiguityAlert'
import { PRODUCT_TYPES } from '@/lib/constants/products'
import { createOrder } from '@/actions/orders'
import { createCustomerQuick } from '@/actions/customers'
import type { Customer } from '@/types/app.types'
import { CustomerSearchCombobox } from '@/components/customers/CustomerSearchCombobox'

interface TranscriptReviewFormProps {
  onReset: () => void
  prefillCustomer?: Customer
}

export function TranscriptReviewForm({ onReset, prefillCustomer }: TranscriptReviewFormProps) {
  const router = useRouter()
  const store = useOrderDraftStore()
  const [submitting, setSubmitting] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(prefillCustomer ?? null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickCreateForm, setQuickCreateForm] = useState({ full_name: '', phone: '', organization: '' })
  const [quickCreateLoading, setQuickCreateLoading] = useState(false)

  const {
    customerName, customerPhone, customerOrganization,
    deliveryDate, specialInstructions, items,
    hasAiData, aiTranscript, overallConfidence,
    ambiguousFields, confirmedFields,
    confirmField, confirmAllAmbiguous, updateItem, setDeliveryDate,
    allAmbiguousConfirmed, clearDraft,
  } = store

  useEffect(() => {
    if (prefillCustomer && !selectedCustomer) {
      setSelectedCustomer(prefillCustomer)
    }
  }, [prefillCustomer])

  const confirmedCount = ambiguousFields.filter(f => confirmedFields.has(f)).length

  const isAmbiguous = (fieldPath: string) => ambiguousFields.includes(fieldPath)
  const isConfirmed = (fieldPath: string) => confirmedFields.has(fieldPath)

  const getItemAiConfidence = (itemIndex: number, field: string): number | null => {
    const item = items[itemIndex]
    if (!item) return null
    const aiField = item.aiFields[field]
    return aiField?.isAiFilled ? aiField.confidence : null
  }

  const openQuickCreate = () => {
    setQuickCreateForm({
      full_name: customerName ?? '',
      phone: customerPhone ?? '',
      organization: customerOrganization ?? '',
    })
    setShowQuickCreate(true)
  }

  const handleQuickCreate = async () => {
    if (!quickCreateForm.full_name.trim() || !quickCreateForm.phone.trim()) {
      toast.error('Name and phone are required')
      return
    }
    setQuickCreateLoading(true)
    try {
      const result = await createCustomerQuick({
        full_name: quickCreateForm.full_name.trim(),
        phone: quickCreateForm.phone.trim(),
        organization: quickCreateForm.organization.trim() || null,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setSelectedCustomer(result.data)
      setShowQuickCreate(false)
      toast.success(`Customer "${result.data.full_name}" created and linked`)
    } finally {
      setQuickCreateLoading(false)
    }
  }

  const canSubmit = selectedCustomer && allAmbiguousConfirmed()

  const handleSubmit = async () => {
    if (!selectedCustomer) { toast.error('Please select a customer'); return }
    if (!allAmbiguousConfirmed()) { toast.error('Please confirm all flagged fields first'); return }

    setSubmitting(true)
    try {
      const result = await createOrder({
        customer_id: selectedCustomer.id,
        delivery_date: deliveryDate || null,
        special_instructions: specialInstructions || null,
        ai_intake_used: true,
        ai_confidence: overallConfidence,
        items: items.map(item => ({
          product_type: item.product_type,
          quantity: item.quantity,
          gender: item.gender,
          color: item.color || null,
          piping_color: item.piping_color || null,
          has_embroidery: item.has_embroidery,
          embroidery_name: item.embroidery_name || null,
          special_instructions: item.special_instructions || null,
        })),
      })

      if (!result.success) { toast.error(result.error); return }

      clearDraft()
      toast.success(`Order ${result.data.order_number} created via AI intake`)
      router.push(`/orders/${result.data.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6">
      {/* AI confidence header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Review Extracted Order</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            AI confidence: <span className={`font-medium ${overallConfidence >= 0.8 ? 'text-green-600' : overallConfidence >= 0.6 ? 'text-amber-600' : 'text-red-600'}`}>
              {Math.round(overallConfidence * 100)}%
            </span>
            {' '}· Review highlighted fields before submitting
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Re-record
        </button>
      </div>

      {/* Ambiguity banner */}
      <AmbiguityAlert
        ambiguousCount={ambiguousFields.length}
        confirmedCount={confirmedCount}
        onConfirmAll={confirmAllAmbiguous}
      />

      {/* Original transcript (collapsible) */}
      {aiTranscript && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTranscript(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Original Transcript
            </span>
            {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showTranscript && (
            <div className="px-4 py-3 text-sm text-slate-600 bg-white leading-relaxed">
              {aiTranscript}
            </div>
          )}
        </div>
      )}

      {/* Customer section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Customer</h3>
          {!selectedCustomer && !showQuickCreate && (
            <button
              type="button"
              onClick={openQuickCreate}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              New customer
            </button>
          )}
        </div>

        {customerName || customerPhone ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">AI heard name</p>
              <p className="font-medium text-slate-900">{customerName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">AI heard phone</p>
              <p className="font-medium text-slate-900">{customerPhone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">AI heard org</p>
              <p className="font-medium text-slate-900">{customerOrganization || '—'}</p>
            </div>
          </div>
        ) : null}

        {/* Inline quick-create panel */}
        {showQuickCreate && (
          <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Create new customer</p>
              <button
                type="button"
                onClick={() => setShowQuickCreate(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickCreateForm.full_name}
                  onChange={e => setQuickCreateForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="e.g. Dr. Sita Sharma"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={quickCreateForm.phone}
                  onChange={e => setQuickCreateForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. 9841000000"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Organization</label>
                <input
                  type="text"
                  value={quickCreateForm.organization}
                  onChange={e => setQuickCreateForm(f => ({ ...f, organization: e.target.value }))}
                  placeholder="e.g. Midas Health Services"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowQuickCreate(false)}
                className="px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickCreate}
                disabled={quickCreateLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {quickCreateLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {quickCreateLoading ? 'Creating…' : 'Create & Link'}
              </button>
            </div>
          </div>
        )}

        {!showQuickCreate && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Link to Customer Record <span className="text-red-500">*</span>
            </label>
            <CustomerSearchCombobox
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              onCreateNew={openQuickCreate}
            />
            <p className="text-xs text-slate-400 mt-1">
              Search by the name or phone AI detected, then select the correct customer.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date</label>
            {isAmbiguous('delivery_date') ? (
              <AIFieldHighlight
                fieldPath="delivery_date"
                confidence={0.5}
                isConfirmed={isConfirmed('delivery_date')}
                onConfirm={() => confirmField('delivery_date')}
              >
                <input type="date" value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputCls} />
              </AIFieldHighlight>
            ) : (
              <input type="date" value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={inputCls} />
            )}
          </div>
        </div>

        {specialInstructions && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label>
            <textarea rows={2} value={specialInstructions} readOnly className={`${inputCls} bg-slate-50`} />
          </div>
        )}
      </div>

      {/* Items */}
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Item {i + 1}</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Product Type</label>
              <AIFieldHighlight
                fieldPath={`items.${i}.product_type`}
                confidence={getItemAiConfidence(i, 'product_type')}
                isConfirmed={isConfirmed(`items.${i}.product_type`)}
                onConfirm={() => confirmField(`items.${i}.product_type`)}
              >
                <select
                  value={item.product_type}
                  onChange={e => updateItem(i, { product_type: e.target.value })}
                  className={inputCls}
                >
                  {PRODUCT_TYPES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </AIFieldHighlight>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
              <AIFieldHighlight
                fieldPath={`items.${i}.gender`}
                confidence={getItemAiConfidence(i, 'gender')}
                isConfirmed={isConfirmed(`items.${i}.gender`)}
                onConfirm={() => confirmField(`items.${i}.gender`)}
              >
                <select
                  value={item.gender}
                  onChange={e => updateItem(i, { gender: e.target.value as 'male' | 'female' | 'unisex' })}
                  className={inputCls}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unisex">Unisex</option>
                </select>
              </AIFieldHighlight>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
              <AIFieldHighlight
                fieldPath={`items.${i}.quantity`}
                confidence={getItemAiConfidence(i, 'quantity')}
                isConfirmed={isConfirmed(`items.${i}.quantity`)}
                onConfirm={() => confirmField(`items.${i}.quantity`)}
              >
                <input
                  type="number" min={1} value={item.quantity}
                  onChange={e => updateItem(i, { quantity: Number(e.target.value) })}
                  className={inputCls}
                />
              </AIFieldHighlight>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
              <AIFieldHighlight
                fieldPath={`items.${i}.color`}
                confidence={getItemAiConfidence(i, 'color')}
                isConfirmed={isConfirmed(`items.${i}.color`)}
                onConfirm={() => confirmField(`items.${i}.color`)}
              >
                <input type="text" value={item.color}
                  onChange={e => updateItem(i, { color: e.target.value })}
                  placeholder="e.g. Navy Blue"
                  className={inputCls}
                />
              </AIFieldHighlight>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Piping Color</label>
              <input type="text" value={item.piping_color}
                onChange={e => updateItem(i, { piping_color: e.target.value })}
                placeholder="e.g. White"
                className={inputCls}
              />
            </div>
          </div>

          {/* Embroidery */}
          <div className="flex items-center gap-3">
            <AIFieldHighlight
              fieldPath={`items.${i}.has_embroidery`}
              confidence={getItemAiConfidence(i, 'has_embroidery')}
              isConfirmed={isConfirmed(`items.${i}.has_embroidery`)}
              onConfirm={() => confirmField(`items.${i}.has_embroidery`)}
            >
              <label className="flex items-center gap-2 px-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.has_embroidery}
                  onChange={e => updateItem(i, { has_embroidery: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm text-slate-700">Has Embroidery</span>
              </label>
            </AIFieldHighlight>

            {item.has_embroidery && (
              <div className="flex-1">
                <AIFieldHighlight
                  fieldPath={`items.${i}.embroidery_name`}
                  confidence={getItemAiConfidence(i, 'embroidery_name')}
                  isConfirmed={isConfirmed(`items.${i}.embroidery_name`)}
                  onConfirm={() => confirmField(`items.${i}.embroidery_name`)}
                >
                  <input
                    type="text"
                    value={item.embroidery_name}
                    onChange={e => updateItem(i, { embroidery_name: e.target.value })}
                    placeholder="Name / text to embroider"
                    className={inputCls}
                  />
                </AIFieldHighlight>
              </div>
            )}
          </div>

          {/* Measurements */}
          {Object.keys(item.measurements).length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Measurements (cm)</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {Object.entries(item.measurements).map(([field, value]) => (
                  <div key={field}>
                    <label className="block text-[10px] text-slate-400 capitalize mb-1">
                      {field.replace(/_/g, ' ')}
                    </label>
                    <AIFieldHighlight
                      fieldPath={`items.${i}.measurements.${field}`}
                      confidence={getItemAiConfidence(i, `measurements.${field}`)}
                      isConfirmed={isConfirmed(`items.${i}.measurements.${field}`)}
                      onConfirm={() => confirmField(`items.${i}.measurements.${field}`)}
                    >
                      <input
                        type="number" step="0.5" min="0"
                        value={value}
                        onChange={e => {
                          const updated = { ...item.measurements, [field]: e.target.value }
                          updateItem(i, { measurements: updated })
                        }}
                        className={`${inputCls} text-center`}
                      />
                    </AIFieldHighlight>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Submit */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-xs text-slate-500">
          {!canSubmit && !selectedCustomer && 'Select a customer to continue'}
          {!canSubmit && selectedCustomer && !allAmbiguousConfirmed() && (
            <span className="text-amber-600">
              {ambiguousFields.length - confirmedCount} field{ambiguousFields.length - confirmedCount !== 1 ? 's' : ''} still need confirmation
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Creating Order…' : 'Create Order'}
        </button>
      </div>
    </div>
  )
}
