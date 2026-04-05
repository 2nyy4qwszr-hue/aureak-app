/**
 * compress-image.ts — Story 57-1
 * Compresse une image côté client à maxWidth px maximum (sans agrandir).
 * Retourne un Blob JPEG à qualité 0.85.
 * Web only — utilise HTMLCanvasElement + canvas.toBlob.
 */

export async function compressImage(file: File, maxWidth = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const width  = Math.min(img.naturalWidth, maxWidth)
      const height = Math.round(img.naturalHeight * (width / img.naturalWidth))
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = reject
    img.src = objectUrl
  })
}
