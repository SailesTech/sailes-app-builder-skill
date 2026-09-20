import type { Order, Customer } from '../types'

/**
 * Six business rules, resolved in the order the spec fixes.
 * Manual override wins; then partner; then campaign; then volume;
 * then loyalty; then first-order.
 */
export function resolveDiscount(order: Order, customer: Customer): number {
  if (order.manualOverride != null) return order.manualOverride
  if (customer.partnerTier === 'gold') return 0.2
  if (customer.partnerTier === 'silver') return 0.1
  if (order.campaignCode && isCampaignLive(order.campaignCode)) return 0.15
  if (order.itemCount >= 100) return 0.12
  if (customer.ordersPlaced >= 10) return 0.05
  if (customer.ordersPlaced === 0) return 0.08
  return 0
}

function isCampaignLive(code: string): boolean {
  return code.startsWith('LIVE-')
}
