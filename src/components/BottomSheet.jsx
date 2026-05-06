import { useEffect } from 'react'
import { X } from 'lucide-react'

// ─── BottomSheet — modale qui glisse depuis le bas ──────────
// Pattern iOS classique : backdrop semi-transparent + panneau arrondi en haut.
// Fermeture par tap sur le backdrop ou bouton X.
// Le contenu est scrollable si trop grand (max-height = 90% de l'écran).
export default function BottomSheet({ open, onClose, title, children }) {
  // Empêche le scroll du body quand la sheet est ouverte
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Wrapper de centrage horizontal — le transform du sheet
          ne sert plus qu'à l'animation slide-up, sans conflit. */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div
          className={`w-full max-w-[390px] bg-white rounded-t-3xl flex flex-col max-h-[90vh] transition-transform duration-300 ease-out ${
            open ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Handle (indicateur visuel de glissement) */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-zinc-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4 pt-2">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 -m-1 text-zinc-400 active:text-zinc-600 transition-colors"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Content scrollable */}
          <div className="px-5 pb-8 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
