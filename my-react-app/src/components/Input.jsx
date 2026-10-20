import { useState } from 'react'

export default function Input({ label, error, hint, id, ...props }) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const inputId = id || props.name
  const isPassword = props.type === 'password'
  const descriptionId = `${inputId}-description`

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={`field__input${error ? ' field__input--error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? descriptionId : undefined}
        {...props}
        type={isPassword && passwordVisible ? 'text' : props.type}
      />
      {(error || hint) && (
        <span id={descriptionId} className={error ? 'field__error' : 'field__hint'}>
          {error || hint}
        </span>
      )}
      {isPassword && (
        <button
          className="password-toggle"
          type="button"
          aria-pressed={passwordVisible}
          onClick={() => setPasswordVisible((visible) => !visible)}
        >
          {passwordVisible ? 'Hide password' : 'Show password'}
        </button>
      )}
    </div>
  )
}
