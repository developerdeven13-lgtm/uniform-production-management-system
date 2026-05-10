export const PRODUCT_TYPES = [
  { value: 'scrubs', label: 'Scrubs' },
  { value: 'apron', label: 'Apron' },
  { value: 'head_cap', label: 'Head Cap' },
  { value: 'card_holder', label: 'Card Holder' },
] as const

export type ProductTypeValue = (typeof PRODUCT_TYPES)[number]['value']

export const PRODUCT_LABEL: Record<ProductTypeValue, string> = {
  scrubs: 'Scrubs',
  apron: 'Apron',
  head_cap: 'Head Cap',
  card_holder: 'Card Holder',
}

export const MEASUREMENT_FIELDS: Record<ProductTypeValue, string[]> = {
  scrubs: ['chest', 'waist', 'hip', 'shoulder', 'sleeve_length', 'body_length', 'inseam', 'neck'],
  apron: ['chest', 'waist', 'hip', 'body_length'],
  head_cap: ['head_circumference'],
  card_holder: ['card_size'],
}
