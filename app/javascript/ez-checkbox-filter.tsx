import * as React from "react"

export const EzCheckboxFilter = ({
  checked,
  setChecked,
  disabledReason = null,
  name,
  title,
}: {
  checked: boolean
  setChecked: (x: boolean) => void
  disabledReason?: null | string
  name: string
  title?: string
}): JSX.Element => {
  const label = name
  const inputId = "ez-" + name.replace(/ /g, "-")
  const disabled = !!disabledReason

  return (
    <div className={disabled ? "hidden-xs" : ""}>
      <label
        className={disabled ? "text-muted" : ""}
        title={disabledReason || title}
      >
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={e => setChecked(e.target.checked)}
          disabled={disabled}
        />
        &nbsp; {label}
      </label>
    </div>
  )
}

export default EzCheckboxFilter
