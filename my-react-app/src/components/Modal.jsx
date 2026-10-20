import { useEffect } from 'react'
import Button from './Button.jsx'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <Button variant="quiet" type="button" aria-label="Close dialog" onClick={onClose}>×</Button>
        </header>
        {children}
      </section>
    </div>
  )
}
