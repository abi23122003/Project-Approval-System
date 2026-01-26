import React from 'react';
import Icon from '../../../components/AppIcon';

const DocumentCategoryCard = ({ category, isActive, onClick }) => {
  const getIconColor = () => {
    if (isActive) return 'var(--color-primary-foreground)';
    return 'var(--color-foreground)';
  };

  const getStoragePercentage = () => {
    return (category?.usedStorage / category?.totalStorage) * 100;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-smooth ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-elevation-md'
          : 'bg-card hover:bg-muted'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isActive ? 'bg-primary-foreground/20' : 'bg-primary/10'
          }`}>
            <Icon name={category?.icon} size={20} color={getIconColor()} />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${
              isActive ? 'text-primary-foreground' : 'text-foreground'
            }`}>
              {category?.name}
            </h3>
            <p className={`text-xs mt-1 ${
              isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              {category?.fileCount} files
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className={isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}>
            Storage
          </span>
          <span className={`font-medium ${
            isActive ? 'text-primary-foreground' : 'text-foreground'
          }`}>
            {category?.usedStorage}MB / {category?.totalStorage}MB
          </span>
        </div>
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${
          isActive ? 'bg-primary-foreground/20' : 'bg-muted'
        }`}>
          <div
            className={`h-full rounded-full transition-smooth ${
              isActive ? 'bg-primary-foreground' : 'bg-primary'
            }`}
            style={{ width: `${getStoragePercentage()}%` }}
          />
        </div>
      </div>
    </button>
  );
};

export default DocumentCategoryCard;