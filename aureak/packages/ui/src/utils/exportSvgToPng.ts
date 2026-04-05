// Story 59-10 — Export SVG → PNG via Canvas natif (aucune dépendance externe)
// Note : les polices web (Montserrat) ne sont pas disponibles dans le canvas export
//        → le SVG utilise Arial/sans-serif en fallback pour l'export.

/**
 * exportTrophyAsPng — sérialise un élément SVG en PNG et déclenche un téléchargement.
 * Étapes :
 *  1. Sérialise le SVG via XMLSerializer
 *  2. Crée un Blob SVG
 *  3. Charge dans une Image via URL.createObjectURL
 *  4. Dessine sur un <canvas> 600×400
 *  5. canvas.toBlob() → <a download> click
 *  6. cleanup URL.revokeObjectURL
 */
export async function exportTrophyAsPng(
  svgElement: SVGSVGElement,
  filename   : string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const serializer = new XMLSerializer()
      const svgString  = serializer.serializeToString(svgElement)
      const blob       = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url        = URL.createObjectURL(blob)

      const img = new Image()
      img.onload = () => {
        try {
          const canvas    = document.createElement('canvas')
          canvas.width    = 600
          canvas.height   = 400
          const ctx       = canvas.getContext('2d')

          if (!ctx) {
            URL.revokeObjectURL(url)
            reject(new Error('Canvas 2D context unavailable'))
            return
          }

          ctx.drawImage(img, 0, 0, 600, 400)
          URL.revokeObjectURL(url)

          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              if (process.env.NODE_ENV !== 'production')
                console.error('[exportSvgToPng] canvas.toBlob returned null')
              reject(new Error('canvas.toBlob failed'))
              return
            }
            const pngUrl = URL.createObjectURL(pngBlob)
            const a      = document.createElement('a')
            a.href       = pngUrl
            a.download   = filename.endsWith('.png') ? filename : `${filename}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(pngUrl)
            resolve()
          }, 'image/png')
        } catch (err) {
          if (process.env.NODE_ENV !== 'production')
            console.error('[exportSvgToPng] canvas draw error:', err)
          URL.revokeObjectURL(url)
          reject(err)
        }
      }

      img.onerror = (err) => {
        if (process.env.NODE_ENV !== 'production')
          console.error('[exportSvgToPng] image load error:', err)
        URL.revokeObjectURL(url)
        reject(new Error('SVG image load failed'))
      }

      img.src = url
    } catch (err) {
      if (process.env.NODE_ENV !== 'production')
        console.error('[exportSvgToPng] serialization error:', err)
      reject(err)
    }
  })
}
