const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="page-header flex items-start justify-between gap-4">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
