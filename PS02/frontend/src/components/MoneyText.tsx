interface Props { amountMinor: number; currency: string; className?: string }

const formatters = new Map<string, Intl.NumberFormat>()

function fmt(currency: string) {
  let f = formatters.get(currency)
  if (!f) {
    f = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 })
    formatters.set(currency, f)
  }
  return f
}

export default function MoneyText({ amountMinor, currency, className }: Props) {
  const value = amountMinor / 100
  return <span className={className} title={`${amountMinor} minor units`}>{fmt(currency).format(value)}</span>
}
