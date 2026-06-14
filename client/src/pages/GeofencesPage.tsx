import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Filter, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMapEvents, Marker, Polygon } from 'react-leaflet'
import { useGeofences, useCreateGeofence, useUpdateGeofence, useDeleteGeofence } from '../hooks/useGeofences'
import { BaseMap } from '../components/map/BaseMap'
import { GeofenceLayer } from '../components/map/GeofenceLayer'
import { Modal } from '../components/ui/Modal'
import { Badge, categoryVariant } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import type { CreateGeofenceRequest, UpdateGeofenceRequest, Geofence, GeofenceCategory } from '../types'

const CATEGORIES: GeofenceCategory[] = ['delivery_zone', 'restricted_zone', 'toll_zone', 'customer_area']
const categoryLabel = (c: string) => c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

type ModalConfig = { mode: 'create' } | { mode: 'edit'; geofence: Geofence }

export function GeofencesPage() {
  const [filter, setFilter] = useState<GeofenceCategory | undefined>()
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null)
  const [selected, setSelected] = useState<Geofence | null>(null)

  const { data: geofences = [], isLoading } = useGeofences(filter)
  const { mutateAsync: deleteGeo } = useDeleteGeofence()

  const handleDelete = async (g: Geofence) => {
    if (!confirm(`Delete "${g.name}"? Related alerts and violations will also be removed.`)) return
    try {
      await deleteGeo(g.id)
      if (selected?.id === g.id) setSelected(null)
      toast.success('Geofence deleted')
    } catch {
      toast.error('Failed to delete geofence')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="w-80 flex flex-col border-r bg-white">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="font-semibold text-gray-900">Geofences</h1>
          <button
            onClick={() => setModalConfig({ mode: 'create' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} /> New
          </button>
        </div>
        {/* Category filter */}
        <div className="px-4 py-2 border-b">
          <div className="flex items-center gap-1 flex-wrap">
            <Filter size={12} className="text-gray-400" />
            <button
              onClick={() => setFilter(undefined)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${!filter ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(filter === c ? undefined : c)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${filter === c ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {categoryLabel(c)}
              </button>
            ))}
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center mt-8"><Spinner /></div>
          ) : geofences.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-12">No geofences found</p>
          ) : (
            <ul className="divide-y">
              {geofences.map((g) => (
                <li
                  key={g.id}
                  className={`p-3 hover:bg-gray-50 transition-colors ${selected?.id === g.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelected(g)}>
                      <p className="text-sm font-medium text-gray-900 truncate">{g.name}</p>
                      {g.description && <p className="text-xs text-gray-500 truncate">{g.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">{g.coordinates.length} points</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant={categoryVariant(g.category)}>{categoryLabel(g.category)}</Badge>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setModalConfig({ mode: 'edit', geofence: g })}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(g)}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <BaseMap zoom={10} className="h-full w-full">
          <GeofenceLayer geofences={geofences} onSelect={setSelected} />
        </BaseMap>
      </div>

      {modalConfig && (
        <GeofenceModal config={modalConfig} onClose={() => setModalConfig(null)} />
      )}
    </div>
  )
}

// Draws markers + polygon outline as the user clicks on the map
function DrawingLayer({ points, onAdd }: { points: [number, number][]; onAdd: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onAdd(e.latlng.lat, e.latlng.lng) })
  return (
    <>
      {points.map((pt, i) => <Marker key={i} position={pt} />)}
      {points.length >= 3 && (
        <Polygon positions={points} pathOptions={{ color: '#3b82f6', fillOpacity: 0.15, weight: 2 }} />
      )}
    </>
  )
}

function GeofenceModal({ config, onClose }: { config: ModalConfig; onClose: () => void }) {
  const isEdit = config.mode === 'edit'
  const existing = isEdit ? config.geofence : null

  const { register, handleSubmit, formState: { errors } } = useForm<{ name: string; description: string; category: string }>({
    defaultValues: existing
      ? { name: existing.name, description: existing.description, category: existing.category }
      : {},
  })

  const [points, setPoints] = useState<[number, number][]>(existing ? existing.coordinates : [])

  const { mutateAsync: create, isPending: isCreating } = useCreateGeofence()
  const { mutateAsync: update, isPending: isUpdating } = useUpdateGeofence()
  const isPending = isCreating || isUpdating

  const addPoint = (lat: number, lng: number) => setPoints((prev) => [...prev, [lat, lng]])
  const undoLast = () => setPoints((prev) => prev.slice(0, -1))
  const clearAll = () => setPoints([])

  const onSubmit = handleSubmit(async (values) => {
    if (points.length < 3) {
      toast.error('Add at least 3 points by clicking on the map')
      return
    }
    const closed =
      points[0][0] === points[points.length - 1][0] && points[0][1] === points[points.length - 1][1]
        ? points
        : [...points, points[0]]

    try {
      if (isEdit) {
        const payload: UpdateGeofenceRequest = {
          name: values.name,
          description: values.description,
          category: values.category as GeofenceCategory,
          coordinates: closed,
        }
        await update({ id: existing!.id, data: payload })
        toast.success('Geofence updated')
      } else {
        const payload: CreateGeofenceRequest = {
          name: values.name,
          description: values.description,
          category: values.category as GeofenceCategory,
          coordinates: closed,
        }
        await create(payload)
        toast.success('Geofence created')
      }
      onClose()
    } catch {
      toast.error(isEdit ? 'Failed to update geofence' : 'Failed to create geofence')
    }
  })

  const mapCenter: [number, number] = points.length > 0 ? points[0] : [20.5937, 78.9629]
  const mapZoom = points.length > 0 ? 13 : 10

  return (
    <Modal title={isEdit ? `Edit: ${existing!.name}` : 'New Geofence'} onClose={onClose} wide>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input
              {...register('name', { required: true })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">Required</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
            <select
              {...register('category', { required: true })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-0.5">Required</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <input
            {...register('description')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-700">
              Boundary points
              <span className="text-gray-400 font-normal ml-1">
                — click map to add ({points.length} added
                {points.length >= 3 ? ', polygon ready ✓' : `, need ${3 - points.length} more`})
              </span>
            </label>
            {points.length > 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={undoLast} className="text-xs text-gray-500 hover:text-gray-700 underline">
                  Undo
                </button>
                <button type="button" onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 underline">
                  Clear all
                </button>
              </div>
            )}
          </div>
          <BaseMap center={mapCenter} zoom={mapZoom} className="h-72 w-full rounded-lg overflow-hidden border">
            <DrawingLayer points={points} onAdd={addPoint} />
          </BaseMap>
          {points.length > 0 && (
            <p className="text-xs text-gray-400 font-mono mt-1 truncate">
              {points.slice(0, 3).map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join(' → ')}
              {points.length > 3 ? ` +${points.length - 3} more` : ''}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isPending && <Spinner size="sm" />}
            {isEdit ? 'Update Geofence' : 'Create Geofence'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
