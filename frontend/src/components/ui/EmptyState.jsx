import { Link } from 'react-router-dom';

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionTo }) => {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-state-icon" />}
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
