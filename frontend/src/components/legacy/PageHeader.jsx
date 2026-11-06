const PageHeader = ({ title, description, actions, icon: Icon }) => {
  return (
    <div className="bg-ink-950 border-b border-ink-800 py-10">
      <div className="container-page">
        <div className="flex items-start justify-between gap-4">
          <div>
            {Icon && (
              <div className="inline-flex items-center gap-2 rounded-full border border-ink-800 bg-ink-900 px-4 py-1.5 text-sm text-ink-400 mb-4">
                <Icon className="w-4 h-4 text-primary-400" />
                <span>{title}</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-100 mb-2">{title}</h1>
            {description && <p className="text-ink-400 max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0 pt-1">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
