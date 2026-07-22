import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/LanguageContext';
import { KeyRound, UserPen, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function AccountSettings() {
  const { user, isAuthenticated, loading, changePassword, updateProfile } = useAuth();
  const [, navigate] = useLocation();
  const { lang } = useLanguage();

  // ── Change-password state ─────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSubmitting,    setPwSubmitting]    = useState(false);
  const [pwSuccess,       setPwSuccess]       = useState('');
  const [pwError,         setPwError]         = useState('');

  // ── Profile-edit state ────────────────────────────────────────────────────
  const [fullName,    setFullName]    = useState('');
  const [mobile,      setMobile]      = useState('');
  const [designation, setDesignation] = useState('');
  const [company,     setCompany]     = useState('');
  const [prSubmitting, setPrSubmitting] = useState(false);
  const [prSuccess,    setPrSuccess]   = useState('');
  const [prError,      setPrError]     = useState('');

  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  // Redirect to login once auth state is resolved
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  // Pre-fill profile fields whenever the user object loads / changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? '');
      setMobile(user.mobile ?? '');
      setDesignation(user.designation ?? '');
      setCompany(user.company ?? '');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwSuccess('');
    setPwError('');

    if (newPassword !== confirmPassword) {
      setPwError(t('New passwords do not match.', 'كلمتا المرور الجديدتان غير متطابقتين.'));
      return;
    }
    if (newPassword.length < 6) {
      setPwError(t('New password must be at least 6 characters.', 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.'));
      return;
    }

    setPwSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwSuccess(t(
        'Password updated successfully. Other devices have been signed out.',
        'تم تحديث كلمة المرور بنجاح. تم تسجيل الخروج من الأجهزة الأخرى.',
      ));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : t('Could not update the password.', 'تعذّر تحديث كلمة المرور.'));
    } finally {
      setPwSubmitting(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setPrSuccess('');
    setPrError('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setPrError(t('Full name must be at least 2 characters.', 'يجب أن يتكون الاسم الكامل من حرفين على الأقل.'));
      return;
    }

    setPrSubmitting(true);
    try {
      await updateProfile({
        fullName:    fullName.trim(),
        mobile:      mobile.trim()      || null,
        designation: designation.trim() || null,
        company:     company.trim()     || null,
      });
      setPrSuccess(t('Profile updated successfully.', 'تم تحديث الملف الشخصي بنجاح.'));
    } catch (err) {
      setPrError(err instanceof Error ? err.message : t('Could not update profile.', 'تعذّر تحديث الملف الشخصي.'));
    } finally {
      setPrSubmitting(false);
    }
  }

  return (
    <div className="min-h-[60vh] bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Page heading */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('Account Settings', 'إعدادات الحساب')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.email}
          </p>
        </div>

        {/* ── Profile card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('Edit Profile', 'تعديل الملف الشخصي')}
              </h2>
              <p className="text-sm text-gray-500">
                {t('Update your name, mobile, and company details.', 'حدّث اسمك ورقم جوالك وبيانات شركتك.')}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">
                {t('Full name', 'الاسم الكامل')}
              </Label>
              <Input
                id="full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                minLength={2}
                disabled={prSubmitting}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mobile">
                {t('Mobile', 'رقم الجوال')}
              </Label>
              <Input
                id="mobile"
                type="tel"
                autoComplete="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                disabled={prSubmitting}
                className="h-11"
                placeholder={t('Optional', 'اختياري')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="designation">
                {t('Job title / designation', 'المسمى الوظيفي')}
              </Label>
              <Input
                id="designation"
                type="text"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                disabled={prSubmitting}
                className="h-11"
                placeholder={t('Optional', 'اختياري')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company">
                {t('Company', 'الشركة')}
              </Label>
              <Input
                id="company"
                type="text"
                autoComplete="organization"
                value={company}
                onChange={e => setCompany(e.target.value)}
                disabled={prSubmitting}
                className="h-11"
                placeholder={t('Optional', 'اختياري')}
              />
            </div>

            {prError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {prError}
              </div>
            )}

            {prSuccess && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                {prSuccess}
              </div>
            )}

            <Button
              type="submit"
              disabled={prSubmitting}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold text-[15px] rounded-xl"
            >
              {prSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t('Saving…', 'جارٍ الحفظ…')}</>
                : t('Save changes', 'حفظ التغييرات')}
            </Button>
          </form>
        </div>

        {/* ── Change-password card ───────────────────────────────────────── */}
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

          <form onSubmit={handleChangePassword} className="space-y-5">
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
                disabled={pwSubmitting}
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
                disabled={pwSubmitting}
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
                disabled={pwSubmitting}
                className="h-11"
              />
            </div>

            {pwError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {pwError}
              </div>
            )}

            {pwSuccess && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                {pwSuccess}
              </div>
            )}

            <Button
              type="submit"
              disabled={pwSubmitting}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold text-[15px] rounded-xl"
            >
              {pwSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t('Updating…', 'جارٍ التحديث…')}</>
                : t('Update password', 'تحديث كلمة المرور')}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
