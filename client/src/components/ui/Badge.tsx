import type { ReactNode } from 'react'

const variants = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-gray-100 text-gray-700',
}

export function Badge({ children, variant = 'gray' }: { children: ReactNode; variant?: keyof typeof variants }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function categoryVariant(cat: string): keyof typeof variants {
  const map: Record<string, keyof typeof variants> = {
    delivery_zone: 'blue',
    restricted_zone: 'red',
    toll_zone: 'yellow',
    customer_area: 'green',
  }
  return map[cat] ?? 'gray'
}

export function eventVariant(type: string): keyof typeof variants {
  return type === 'entry' ? 'green' : 'red'
}
