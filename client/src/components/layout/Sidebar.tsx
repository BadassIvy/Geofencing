import { NavLink } from 'react-router-dom'
import { Map, Truck, Bell, History, LayoutDashboard } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/geofences', icon: Map, label: 'Geofences' },
  { to: '/vehicles', icon: Truck, label: 'Vehicles' },
  { to: '/alerts', icon: Bell, label: 'Alert Rules' },
  { to: '/violations', icon: History, label: 'History' },
]

export function Sidebar() {
  return (
    <aside className="flex flex-col w-56 min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-700">
        <Map size={22} className="text-blue-400" />
        <span className="font-bold text-sm tracking-wide">GeoFence</span>
      </div>
      <nav className="flex-1 py-4 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        Geofence System v1.0
      </div>
    </aside>
  )
}
