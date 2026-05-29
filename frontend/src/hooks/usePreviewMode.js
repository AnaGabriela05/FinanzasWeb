import { useLocation } from 'react-router-dom'

/**
 * Retorna true si el path actual corresponde al modo "Vista como usuario"
 * que usa el admin para validar la UI del usuario final sin datos personales.
 */
export function usePreviewMode() {
  const location = useLocation()
  return location.pathname.startsWith('/admin/preview/')
}
