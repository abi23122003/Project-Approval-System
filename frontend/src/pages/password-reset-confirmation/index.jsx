import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { completePasswordReset } from '../../utils/user-account-management.mjs';

const PasswordResetConfirmation = () => {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await completePasswordReset(apiFetch, { uid, token, newPassword, confirmPassword });
      setComplete(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(requestError?.message || 'The password could not be reset. Request a new link from an administrator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-elevation-sm" aria-labelledby="password-reset-heading">
        <h1 id="password-reset-heading" className="text-xl font-semibold text-foreground">Choose a new password</h1>
        {complete ? (
          <div className="mt-4 space-y-4">
            <p role="status" className="text-sm text-success">Your password has been updated. You can now sign in.</p>
            <Link to="/authentication-role-selection" className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Return to sign in</Link>
          </div>
        ) : !uid || !token ? (
          <div className="mt-4 space-y-4">
            <p role="alert" className="text-sm text-destructive">This password reset link is invalid or incomplete. Ask an administrator to send a new link.</p>
            <Link to="/authentication-role-selection" className="text-sm text-primary underline">Return to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            <p className="text-sm text-muted-foreground">Use a new password that meets the system security requirements.</p>
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-foreground">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-foreground">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {isSubmitting ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default PasswordResetConfirmation;
