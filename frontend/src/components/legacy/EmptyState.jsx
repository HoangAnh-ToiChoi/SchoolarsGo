import { Link } from 'react-router-dom';

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionTo }) => {
  return (
    <div className="emptyState">
      {Icon && <Icon className="emptyStateIcon" />}
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btnPrimary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
