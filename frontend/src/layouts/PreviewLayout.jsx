import { Outlet, useNavigate } from 'react-router-dom'

/**
 * Layout que envuelve las paginas de usuario cuando el admin esta en modo
 * "Vista como usuario". Agrega un banner sticky permanente que informa el
 * estado y permite volver al panel admin.
 *
 * El Layout interior (navbar, links) lo provee cada pagina via su propio
 * <Layout/>; este componente solo agrega el banner externo y el <Outlet/>.
 */
export default function PreviewLayout() {
  const navigate = useNavigate()

  return (
    <>
      <div
        role="region"
        aria-label="Modo vista previa"
        className="sticky top-0 z-50 bg-amber-100 border-b border-amber-300 text-amber-800 px-4 py-2 flex items-center justify-between gap-3 flex-wrap text-sm"
      >
        <p className="m-0 font-medium">
          🔍 <strong>Modo vista previa</strong> · Estás viendo la app como la verá un usuario.
          Los datos personales mostrados son vacíos o de demostración. Ninguna acción de creación está habilitada.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg"
        >
          ← Volver al panel admin
        </button>
      </div>
      <Outlet />
    </>
  )
}
