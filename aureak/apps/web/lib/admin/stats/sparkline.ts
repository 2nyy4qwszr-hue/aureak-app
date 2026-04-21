// Story 93.3 — Helper pur pour générer les paths SVG d'une sparkline
// Retourne 2 paths : ligne + zone remplie (pour gradient sous-courbe).

export function buildSparklinePath(
  data  : number[],
  width : number,
  height: number,
): { linePath: string; areaPath: string } {
  if (data.length < 2) return { linePath: '', areaPath: '' }

  const padding = 4 // marge top/bottom pour que les pics ne touchent pas les bords

  const min  = Math.min(...data)
  const max  = Math.max(...data)
  const span = max - min || 1 // évite division par zéro si toutes valeurs égales

  const stepX = width / (data.length - 1)

  const points = data.map((value, i) => {
    const x = i * stepX
    // y inversé : SVG origin = top-left, on veut min en bas
    const normalized = (value - min) / span
    const y          = height - padding - normalized * (height - padding * 2)
    return { x, y }
  })

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ')

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`

  return { linePath, areaPath }
}
