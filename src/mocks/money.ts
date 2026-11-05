import Decimal from 'decimal.js'
const Money = Decimal.clone({ precision: 80, rounding: Decimal.ROUND_HALF_UP })
export const money = (amount: string) => new Money(amount)
export const eth = (amount: Decimal) => amount.toFixed(18).replace(/\.?0+$/, '')
