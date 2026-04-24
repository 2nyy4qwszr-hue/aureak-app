// Story 105.1 — Preview miniature d'une carte Panini (canvas)
import { useEffect, useRef, useState } from 'react'
import type { CropArea } from '../../../../lib/panini/types'
import type { ParsedCalque } from '../../../../lib/panini/svg'
import { renderToCanvas } from '../../../../lib/panini/render'
import { enqueueRender } from '../../../../lib/panini/render-queue'
import { paniniStyles } from './styles'

type Props = {
  calque     : ParsedCalque
  photoUrl   : string | null
  cropArea   : CropArea | null
  tokens     : Record<string, string>
  maxHeight? : number
  fitParent? : boolean
}

export function PaniniPreview({
  calque, photoUrl, cropArea, tokens, maxHeight = 400, fitParent = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tokenRef  = useRef(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !photoUrl) return

    const myToken = ++tokenRef.current
    canvas.width  = calque.viewBoxWidth
    canvas.height = calque.viewBoxHeight

    enqueueRender(() =>
      renderToCanvas(canvas, { calque, photoUrl, cropArea, tokens }),
    )
      .then(() => {
        if (myToken !== tokenRef.current) return
        setError(null)
      })
      .catch((err) => {
        if (myToken !== tokenRef.current) return
        if (process.env.NODE_ENV !== 'production') console.error('[PaniniPreview] render error:', err)
        setError(err instanceof Error ? err.message : String(err))
      })
  }, [calque, photoUrl, cropArea, tokens])

  const aspectRatio = calque.viewBoxWidth / calque.viewBoxHeight

  const style: React.CSSProperties = fitParent
    ? { width: '100%', height: '100%', ...paniniStyles.paniniPreview }
    : { height: maxHeight, width: maxHeight * aspectRatio, ...paniniStyles.paniniPreview }

  return (
    <div style={style}>
      {photoUrl
        ? <canvas ref={canvasRef} style={paniniStyles.paniniCanvas} />
        : <div style={paniniStyles.paniniPreviewEmpty}>Pas de photo</div>
      }
      {error && <div style={paniniStyles.paniniPreviewError}>{error}</div>}
    </div>
  )
}
