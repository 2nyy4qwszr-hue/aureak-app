// Story 105.1 — Rendu canvas des cartes Panini (web only)
import type { CropArea, PhotoSlot } from './types'
import { applyTokens, type ParsedCalque } from './svg'

export type RenderInput = {
  calque   : ParsedCalque
  photoUrl : string
  cropArea : CropArea | null
  tokens   : Record<string, string>
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export function defaultCoverCrop(img: HTMLImageElement, slot: PhotoSlot): CropArea {
  const slotRatio = slot.width / slot.height
  const imgRatio  = img.width  / img.height
  let w: number
  let h: number
  if (imgRatio > slotRatio) {
    h = img.height
    w = h * slotRatio
  } else {
    w = img.width
    h = w / slotRatio
  }
  return {
    x     : (img.width  - w) / 2,
    y     : (img.height - h) / 2,
    width : w,
    height: h,
  }
}

export async function renderToCanvas(
  canvas: HTMLCanvasElement,
  input : RenderInput,
): Promise<void> {
  const { calque, photoUrl, cropArea, tokens } = input

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const photoImg = await loadImage(photoUrl)
  const area = cropArea ?? defaultCoverCrop(photoImg, calque.photoSlot)
  ctx.drawImage(
    photoImg,
    area.x, area.y, area.width, area.height,
    calque.photoSlot.x, calque.photoSlot.y, calque.photoSlot.width, calque.photoSlot.height,
  )

  const svgWithTokens = applyTokens(calque.svgText, tokens)
  const svgBlob = new Blob([svgWithTokens], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl  = URL.createObjectURL(svgBlob)
  try {
    const svgImg = await loadImage(svgUrl)
    ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

export async function renderCard(input: RenderInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width  = input.calque.viewBoxWidth
  canvas.height = input.calque.viewBoxHeight
  await renderToCanvas(canvas, input)
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob returned null'))
      },
      'image/jpeg',
      0.95,
    )
  })
}

export function safeFilename(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
