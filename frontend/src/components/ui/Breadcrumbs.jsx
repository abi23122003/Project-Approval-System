import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const Breadcrumbs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routeMap = {
    '/authentication-role-selection': 'Authentication',
    '/student-dashboard': 'Dashboard',
    '/student-project-proposal-form': 'Project Proposal',
    '/student-document-management': 'Document Management',
    '/guide-dashboard': 'Dashboard',
    '/guide-project-review-interface': 'Project Review'
  };

  const generateBreadcrumbs = () => {
    const pathSegments = location?.pathname?.split('/')?.filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    pathSegments?.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = routeMap?.[currentPath] || segment?.split('-')?.map(word => 
        word?.charAt(0)?.toUpperCase() + word?.slice(1)
      )?.join(' ');
      breadcrumbs?.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleNavigate = (path) => {
    if (path !== location?.pathname) {
      navigate(path);
    }
  };

  return (
    <nav className="flex items-center gap-2 py-4 text-sm">
      {breadcrumbs?.map((crumb, index) => {
        const isLast = index === breadcrumbs?.length - 1;
        const isClickable = !isLast && crumb?.path !== '/';

        return (
          <React.Fragment key={crumb?.path}>
            {index > 0 && (
              <Icon name="ChevronRight" size={14} color="var(--color-muted-foreground)" />
            )}
            {isClickable ? (
              <button
                onClick={() => handleNavigate(crumb?.path)}
                className="text-muted-foreground hover:text-foreground transition-smooth"
              >
                {crumb?.label}
              </button>
            ) : (
              <span className={isLast ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                {crumb?.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;