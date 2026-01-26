import React from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const SettingItem = ({ 
  type = 'text',
  label, 
  description, 
  value, 
  onChange,
  options = [],
  placeholder,
  disabled = false,
  icon,
  error
}) => {
  const renderInput = () => {
    switch (type) {
      case 'checkbox':
        return (
          <Checkbox
            checked={value}
            onChange={(e) => onChange(e?.target?.checked)}
            disabled={disabled}
          />
        );
      case 'select':
        return (
          <Select
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e?.target?.value)}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            className="max-w-xs"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e?.target?.value)}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
          />
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-6 py-4 border-b border-border last:border-0">
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted flex-shrink-0 mt-1">
            <Icon name={icon} size={16} color="var(--color-muted-foreground)" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <label className="block font-medium text-sm md:text-base text-foreground mb-1">
            {label}
          </label>
          {description && (
            <p className="text-xs md:text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="w-full md:w-auto md:min-w-[240px] lg:min-w-[320px]">
        {renderInput()}
      </div>
    </div>
  );
};

export default SettingItem;