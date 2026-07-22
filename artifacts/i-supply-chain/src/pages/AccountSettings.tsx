import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/LanguageContext';
import { KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function AccountSettings() {
  const { user, isAuthenticated, loading, changePassword } = useAuth();
  const [, navigate] = useLocation();
  const { lang } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [successMsg,      setSuccessMsg]      = useState('');
  const [errorMsg,        setErrorMsg]        = useState('');

  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  // Redirect to login once auth state is resolved — must be in an effect to
  // avoid updating state while rendering (React anti-pattern).
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg(t('New passwords do not match.', 'كلمتا المرور الجديدتان غير متطابقتين.'));
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg(t('New password must be at least 6 characters.', 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.'));
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMsg(t('Password updated successfully. Other devices have been signed out.', 'تم تحديث كلمة المرور بنجاح. تم تسجيل الخروج من الأجهزة الأخرى.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('Could not update the password.', 'تعذّر تحديث كلمة المرور.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[60vh] bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('Account Settings', 'إعدادات الحساب')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.email}
          </p>
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('Change Password', 'تغيير كلمة المرور')}
              </h2>
              <p className="text-sm text-gray-500">
                {t('Other devices will be signed out after a successful change.', 'سيتم تسجيل الخروج من الأجهزة الأخرى بعد التغيير بنجاح.')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">
                {t('Current password', 'كلمة المرور الحالية')}
              </Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                disabled={submitting}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">
                {t('New password', 'كلمة المرور الجديدة')}
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={submitting}
                className="h-11"
              />
              <p className="text-xs text-gray-400">{t('Minimum 6 characters', 'الحد الأدنى 6 أحرف')}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">
                {t('Confirm new password', 'تأكيد كلمة المرور الجديدة')}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={submitting}
                className="h-11"
              />
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                {successMsg}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold text-[15px] rounded-xl"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t('Updating…', 'جارٍ التحديث…')}</>
                : t('Update password', 'تحديث كلمة المرور')}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
