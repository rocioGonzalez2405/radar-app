import type { Product } from '@/affordai/data/types'

/**
 * Market price is never altered by the platform. `currentPrice` and
 * `recommendedPrice` are what a qualifying household pays once its subsidy is
 * applied. The Market Prices page states this explicitly.
 */
export const PRODUCTS: Product[] = [
  { id: 'milk', label: 'Milk', category: 'Dairy', marketPrice: 4.5, currentPrice: 3.7, recommendedPrice: 3.2 },
  { id: 'eggs', label: 'Eggs', category: 'Protein', marketPrice: 6.2, currentPrice: 5.1, recommendedPrice: 4.4 },
  { id: 'rice', label: 'Rice', category: 'Grains', marketPrice: 8, currentPrice: 6.6, recommendedPrice: 5.8 },
  { id: 'cheese', label: 'Cheese', category: 'Dairy', marketPrice: 7.4, currentPrice: 6.1, recommendedPrice: 5.3 },
  { id: 'chicken', label: 'Chicken', category: 'Protein', marketPrice: 11.8, currentPrice: 9.7, recommendedPrice: 8.4 },
  { id: 'beans', label: 'Beans', category: 'Grains', marketPrice: 5.6, currentPrice: 4.6, recommendedPrice: 4 },
  { id: 'potatoes', label: 'Potatoes', category: 'Produce', marketPrice: 4.9, currentPrice: 4, recommendedPrice: 3.5 },
  { id: 'apples', label: 'Apples', category: 'Produce', marketPrice: 6.7, currentPrice: 5.5, recommendedPrice: 4.8 },
]
