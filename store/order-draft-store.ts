import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExtractedOrderFields } from '@/lib/ai/extract-order-fields'
import { AMBIGUITY_THRESHOLD } from '@/lib/ai/extract-order-fields'

export interface DraftOrderItem {
  product_type: string
  quantity: number
  gender: 'male' | 'female' | 'unisex'
  color: string
  piping_color: string
  has_embroidery: boolean
  embroidery_name: string
  special_instructions: string
  unit_price: string
  measurements: Record<string, string>
  // AI metadata
  aiFields: Record<string, { confidence: number; isAiFilled: boolean }>
}

export interface OrderDraftState {
  // Customer
  customerName: string
  customerPhone: string
  customerOrganization: string
  // Order-level
  deliveryDate: string
  specialInstructions: string
  setDeliveryDate: (date: string) => void
  // Items
  items: DraftOrderItem[]
  // AI metadata
  hasAiData: boolean
  aiTranscript: string
  overallConfidence: number
  ambiguousFields: string[]
  confirmedFields: Set<string>
  // Actions
  setFromAI: (fields: ExtractedOrderFields, ambiguous: string[], transcript?: string) => void
  confirmField: (fieldPath: string) => void
  confirmAllAmbiguous: () => void
  updateItem: (index: number, updates: Partial<DraftOrderItem>) => void
  clearDraft: () => void
  allAmbiguousConfirmed: () => boolean
}

const defaultItem = (): DraftOrderItem => ({
  product_type: 'scrubs',
  quantity: 1,
  gender: 'unisex',
  color: '',
  piping_color: '',
  has_embroidery: false,
  embroidery_name: '',
  special_instructions: '',
  unit_price: '',
  measurements: {},
  aiFields: {},
})

export const useOrderDraftStore = create<OrderDraftState>()(
  persist(
    (set, get) => ({
      customerName: '',
      customerPhone: '',
      customerOrganization: '',
      deliveryDate: '',
      specialInstructions: '',
      items: [defaultItem()],
      hasAiData: false,
      aiTranscript: '',
      overallConfidence: 0,
      ambiguousFields: [],
      confirmedFields: new Set<string>(),

      setDeliveryDate: (date) => set({ deliveryDate: date }),

      setFromAI: (fields, ambiguous, transcript = '') => {
        const items: DraftOrderItem[] = fields.items.map(item => {
          const aiFields: Record<string, { confidence: number; isAiFilled: boolean }> = {}

          const setAi = (key: string, f: { value: unknown; confidence: number } | null) => {
            if (f && f.value !== null) {
              aiFields[key] = { confidence: f.confidence, isAiFilled: true }
            }
          }

          setAi('product_type', item.product_type)
          setAi('quantity', item.quantity)
          setAi('gender', item.gender)
          setAi('color', item.color)
          setAi('piping_color', item.piping_color)
          setAi('has_embroidery', item.has_embroidery)
          setAi('embroidery_name', item.embroidery_name)

          const measurements: Record<string, string> = {}
          Object.entries(item.measurements).forEach(([key, field]) => {
            if (field.value !== null) {
              measurements[key] = String(field.value)
              setAi(`measurements.${key}`, field)
            }
          })

          return {
            product_type: item.product_type.value ?? 'scrubs',
            quantity: item.quantity.value ?? 1,
            gender: item.gender.value ?? 'unisex',
            color: item.color.value ?? '',
            piping_color: item.piping_color.value ?? '',
            has_embroidery: item.has_embroidery.value ?? false,
            embroidery_name: item.embroidery_name.value ?? '',
            special_instructions: item.special_instructions.value ?? '',
            unit_price: '',
            measurements,
            aiFields,
          }
        })

        set({
          customerName: fields.customer.name.value ?? '',
          customerPhone: fields.customer.phone.value ?? '',
          customerOrganization: fields.customer.organization.value ?? '',
          deliveryDate: fields.delivery_date.value ?? '',
          specialInstructions: fields.special_instructions.value ?? '',
          items: items.length > 0 ? items : [defaultItem()],
          hasAiData: true,
          aiTranscript: transcript,
          overallConfidence: fields.overall_confidence,
          ambiguousFields: ambiguous,
          confirmedFields: new Set<string>(),
        })
      },

      confirmField: (fieldPath) => {
        const next = new Set(get().confirmedFields)
        next.add(fieldPath)
        set({ confirmedFields: next })
      },

      confirmAllAmbiguous: () => {
        set({ confirmedFields: new Set(get().ambiguousFields) })
      },

      updateItem: (index, updates) => {
        const items = [...get().items]
        items[index] = { ...items[index]!, ...updates }
        set({ items })
      },

      clearDraft: () => set({
        customerName: '',
        customerPhone: '',
        customerOrganization: '',
        deliveryDate: '',
        specialInstructions: '',
        items: [defaultItem()],
        hasAiData: false,
        aiTranscript: '',
        overallConfidence: 0,
        ambiguousFields: [],
        confirmedFields: new Set<string>(),
      }),

      allAmbiguousConfirmed: () => {
        const { ambiguousFields, confirmedFields } = get()
        return ambiguousFields.every(f => confirmedFields.has(f))
      },
    }),
    {
      name: 'order-draft',
      // Don't persist the Set directly — convert to/from array
      partialize: (state) => ({
        ...state,
        confirmedFields: Array.from(state.confirmedFields),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.confirmedFields = new Set(state.confirmedFields as unknown as string[])
        }
      },
    }
  )
)
