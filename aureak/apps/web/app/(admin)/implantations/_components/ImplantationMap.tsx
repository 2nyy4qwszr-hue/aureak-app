'use client'
// Story 57-4 — Mini-carte Leaflet pour panneau détail implantation
// Web only — importé en lazy dans index.tsx pour éviter erreur SSR / alourdir bundle
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { colors } from '@aureak/theme'

type Props = {
  lat  : number
  lon  : number
  name : string
}

export function ImplantationMap({ lat, lon, name }: Props) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={15}
      style={{ height: 180, width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker
        center={[lat, lon]}
        radius={10}
        pathOptions={{
          color      : colors.accent.gold,
          fillColor  : colors.accent.gold,
          fillOpacity: 0.9,
        }}
      >
        <Popup>{name}</Popup>
      </CircleMarker>
    </MapContainer>
  )
}
