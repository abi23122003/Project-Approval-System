import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const LoginForm = ({ selectedRole, onLogin, isLoading, error }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberDevice: false
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors?.[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData?.username?.trim()) {
      errors.username = 'Username or email is required';
    }
    if (!formData?.password) {
      errors.password = 'Password is required';
    } else if (formData?.password?.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors)?.length > 0) {
      setValidationErrors(errors);
      return;
    }
    onLogin(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
      <Input
        label="Username or Email"
        type="text"
        placeholder="Enter your username or email"
        value={formData?.username}
        onChange={(e) => handleChange('username', e?.target?.value)}
        error={validationErrors?.username}
        required
        disabled={isLoading}
      />
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={formData?.password}
          onChange={(e) => handleChange('password', e?.target?.value)}
          error={validationErrors?.password}
          required
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-smooth"
          disabled={isLoading}
        >
          <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
        </button>
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
          <Icon name="AlertCircle" size={18} color="var(--color-error)" className="flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <Checkbox
          label="Remember this device"
          checked={formData?.rememberDevice}
          onChange={(e) => handleChange('rememberDevice', e?.target?.checked)}
          disabled={isLoading}
        />
        <button
          type="button"
          className="text-sm text-primary hover:text-primary/80 transition-smooth"
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>
      <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isLoading}
        iconName="LogIn"
        iconPosition="right"
      >
        Sign In as {selectedRole?.label || 'User'}
      </Button>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="Shield" size={14} />
        <span>Secured by institutional authentication</span>
      </div>
    </form>
  );
};

export default LoginForm;