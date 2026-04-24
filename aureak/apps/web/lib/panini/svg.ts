// Story 105.1 — Parse du calque SVG : extraction zone photo + remplacement tokens
import type { PhotoSlot } from './types'

export type ParsedCalque = {
  viewBoxWidth : number
  viewBoxHeight: number
  photoSlot    : PhotoSlot
  svgText      : string
}

type Matrix = [number, number, number, number, number, number]

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ]
}

function parseTransform(value: string | null): Matrix {
  if (!value) return IDENTITY
  const m = value.match(/matrix\(([^)]+)\)/)
  if (!m) return IDENTITY
  const parts = m[1].split(/[\s,]+/).map(Number)
  if (parts.length !== 6 || parts.some(Number.isNaN)) return IDENTITY
  return parts as Matrix
}

function getAccumulatedTransform(el: Element): Matrix {
  let t: Matrix = IDENTITY
  let node: Element | null = el
  const chain: Matrix[] = []
  while (node && node.nodeName !== 'svg') {
    chain.push(parseTransform(node.getAttribute('transform')))
    node = node.parentElement
  }
  for (let i = chain.length - 1; i >= 0; i--) {
    t = multiply(t, chain[i])
  }
  return t
}

function applyPoint(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

export async function loadCalque(url: string): Promise<ParsedCalque> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Calque introuvable: ${url}`)
  const text = await res.text()

  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'image/svg+xml')
  const svg = doc.documentElement

  const viewBox = (svg.getAttribute('viewBox') || '0 0 0 0').split(/\s+/).map(Number)
  const viewBoxWidth  = viewBox[2]
  const viewBoxHeight = viewBox[3]

  const slotGroup =
    doc.querySelector('[id="id--photo-slot-"]') ||
    doc.querySelector('[serif\\:id*="photo-slot"]')
  if (!slotGroup) throw new Error('Zone #photo-slot introuvable dans le SVG')

  const rect = slotGroup.querySelector('rect')
  if (!rect) throw new Error('Rect manquant dans #photo-slot')

  const rx = parseFloat(rect.getAttribute('x')      || '0')
  const ry = parseFloat(rect.getAttribute('y')      || '0')
  const rw = parseFloat(rect.getAttribute('width')  || '0')
  const rh = parseFloat(rect.getAttribute('height') || '0')

  const m = getAccumulatedTransform(slotGroup)
  const [x1, y1] = applyPoint(m, rx, ry)
  const [x2, y2] = applyPoint(m, rx + rw, ry + rh)

  const photoSlot: PhotoSlot = {
    x     : Math.min(x1, x2),
    y     : Math.min(y1, y2),
    width : Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  }

  slotGroup.parentNode?.removeChild(slotGroup)

  const svgText = new XMLSerializer().serializeToString(doc)

  return { viewBoxWidth, viewBoxHeight, photoSlot, svgText }
}

export function applyTokens(svgText: string, tokens: Record<string, string>): string {
  return svgText.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key) => {
    const value = tokens[key]
    return value !== undefined ? escapeXml(value) : match
  })
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
