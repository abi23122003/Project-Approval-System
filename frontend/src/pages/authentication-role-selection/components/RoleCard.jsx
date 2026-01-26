import React from 'react';
import Icon from '../../../components/AppIcon';

const RoleCard = ({ role, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-6 rounded-lg border-2 transition-smooth text-left ${
        isSelected
          ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 bg-card'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <Icon 
            name={role?.icon} 
            size={24} 
            color={isSelected ? 'var(--color-primary-foreground)' : 'var(--color-foreground)'} 
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1">
            {role?.label}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {role?.description}
          </p>
        </div>
        {isSelected && (
          <Icon name="CheckCircle2" size={20} color="var(--color-success)" />
        )}
      </div>
    </button>
  );
};

export default RoleCard;