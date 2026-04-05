// Story 58-5 — Utilitaire génération QR code pour les situations pédagogiques
// Utilise la librairie `qrcode` (pure JS, aucun appel réseau)

import QRCode from 'qrcode'

/**
 * Génère un QR code encodant l'URL fournie.
 * Retourne un data URL PNG base64 prêt à être utilisé dans un <Image source={{ uri }}>
 */
export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width               : 200,
    margin              : 2,
    color               : { dark: '#1A1A1A', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  })
}
