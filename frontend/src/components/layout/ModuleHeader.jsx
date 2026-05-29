const BADGE_STYLES = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger:  'bg-red-100 text-red-800',
  info:    'bg-blue-100 text-blue-800',
  brand:   'bg-teal-100 text-teal-800'
}

function Badge({ label, value, variant = 'default', icon }) {
  const tone = BADGE_STYLES[variant] || BADGE_STYLES.default
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${tone}`}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{label}</span>
      {value !== undefined && value !== null && value !== '' ? (
        <strong className="font-semibold">{value}</strong>
      ) : null}
    </span>
  )
}

function ActionButton({ label, icon, onClick, variant = 'secondary', disabled, title }) {
  const base =
    'inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
  const tone =
    variant === 'primary'
      ? 'text-white bg-teal-700 hover:bg-teal-800'
      : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${tone}`}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{label}</span>
    </button>
  )
}

export default function ModuleHeader({
  title,
  subtitle,
  badges = [],
  primaryAction,
  secondaryActions = []
}) {
  const hasRightContent = badges.length > 0 || secondaryActions.length > 0 || !!primaryAction

  return (
    <header
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 px-6 py-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-6"
    >
      <div className="flex items-center gap-3 flex-wrap min-w-0">
        {title ? (
          <>
            <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
            {subtitle ? (
              <>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
                <p className="text-sm text-slate-500">{subtitle}</p>
              </>
            ) : null}
          </>
        ) : (
          subtitle ? (
            <p className="text-base font-medium text-slate-700">{subtitle}</p>
          ) : null
        )}
      </div>

      {hasRightContent ? (
        <div className="flex items-center gap-3 flex-wrap">
          {badges.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {badges.map((badge, index) => (
                <Badge key={badge.key ?? `${badge.label}-${index}`} {...badge} />
              ))}
            </div>
          ) : null}

          {secondaryActions.length > 0 || primaryAction ? (
            <div className="flex items-center gap-2">
              {secondaryActions.map((action, index) => (
                <ActionButton
                  key={action.key ?? `${action.label}-${index}`}
                  {...action}
                  variant="secondary"
                />
              ))}
              {primaryAction ? <ActionButton {...primaryAction} variant="primary" /> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
