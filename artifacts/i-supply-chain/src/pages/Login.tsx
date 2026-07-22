import React, { useState } from 'react';
import { motion  } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, User, Lock, Mail, Phone, Briefcase, Building2, ChevronRight, CheckCircle2, Shield , ChevronLeft } from 'lucide-react';

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '').replace('/i-supply-chain', '') + '/api-server/api';

export function Login() {
  const { login } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration fields
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', mobile: '', designation: '', company: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.email || !form.password || !form.mobile || !form.designation || !form.company) {
      setError(ar ? 'جميع الحقول مطلوبة.' : 'All fields are required.');
      return;
    }
    if (form.password.length < 6) {
      setError(ar ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);

    // Save to auth context
    const profile = {
      fullName: form.fullName,
      email: form.email,
      mobile: form.mobile,
      designation: form.designation,
      company: form.company,
      registeredAt: new Date().toISOString(),
    };

    // Send lead notification email
    try {
      await fetch(`${API_BASE}/notify/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, source: 'Website Registration' }),
      });
    } catch {}

    // Store credentials in localStorage (simple auth)
    const users = JSON.parse(localStorage.getItem('isc_users') || '[]');
    const exists = users.find((u: any) => u.email === form.email);
    if (exists) {
      setLoading(false);
      setError(ar ? 'يوجد حساب مسجّل بهذا البريد الإلكتروني بالفعل. يُرجى تسجيل الدخول.' : 'An account with this email already exists. Please sign in.');
      return;
    }
    users.push({ ...profile, password: form.password });
    localStorage.setItem('isc_users', JSON.stringify(users));

    login(profile);
    setLoading(false);
    navigate('/');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = JSON.parse(localStorage.getItem('isc_users') || '[]');
    const found = users.find((u: any) => u.email === form.email && u.password === form.password);
    if (!found) { setError(ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.'); return; }
    const { password: _, ...profile } = found;
    login(profile);
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-gradient-to-br from-[#082C6B] via-[#0B3D91] to-[#1a4fa8] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#082C6B] px-8 py-7 text-center">
            <div className="w-16 h-16 bg-[#C9A84C]/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#C9A84C]/30">
              <Shield className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">I Supply Chain</h1>
            <p className="text-white/70 text-sm mt-1">
              {mode === 'register'
                ? (ar ? 'أنشئ حساب العميل الخاص بك' : 'Create your client account')
                : (ar ? 'سجّل الدخول إلى حسابك' : 'Sign in to your account')}
            </p>
          </div>

          {/* Toggle tabs */}
          <div className="flex border-b border-border">
            {(['register', 'login'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-bold transition-colors ${mode === tab ? 'text-primary border-b-2 border-primary bg-primary/3' : 'text-muted-foreground hover:text-primary'}`}
              >
                {tab === 'register'
                  ? (ar ? 'إنشاء حساب' : 'Create Account')
                  : (ar ? 'تسجيل الدخول' : 'Sign In')}
              </button>
            ))}
          </div>

          <div className="px-8 py-7">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {mode === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <Field label={ar ? 'الاسم الكامل *' : 'Full Name *'} icon={<User className="w-4 h-4" />}>
                  <Input placeholder={ar ? 'مثال: أحمد الراشد' : 'e.g. Ahmed Al-Rashid'} value={form.fullName} onChange={set('fullName')} />
                </Field>
                <Field label={ar ? 'البريد الإلكتروني *' : 'Email Address *'} icon={<Mail className="w-4 h-4" />}>
                  <Input type="email" placeholder={ar ? 'you@company.com' : 'you@company.com'} value={form.email} onChange={set('email')} />
                </Field>
                <Field label={ar ? 'كلمة المرور *' : 'Password *'} icon={<Lock className="w-4 h-4" />}
                  suffix={<button type="button" onClick={() => setShowPass(v => !v)} className="text-muted-foreground hover:text-primary">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}>
                  <Input type={showPass ? 'text' : 'password'} placeholder={ar ? '6 أحرف على الأقل' : 'Min. 6 characters'} value={form.password} onChange={set('password')} />
                </Field>
                <Field label={ar ? 'رقم الجوال *' : 'Mobile Number *'} icon={<Phone className="w-4 h-4" />}>
                  <Input placeholder="+966 5XX XXX XXXX" value={form.mobile} onChange={set('mobile')} />
                </Field>
                <Field label={ar ? 'المسمى الوظيفي *' : 'Designation / Job Title *'} icon={<Briefcase className="w-4 h-4" />}>
                  <Input placeholder={ar ? 'مثال: مدير سلسلة الإمداد' : 'e.g. Supply Chain Manager'} value={form.designation} onChange={set('designation')} />
                </Field>
                <Field label={ar ? 'اسم الشركة *' : 'Company Name *'} icon={<Building2 className="w-4 h-4" />}>
                  <Input placeholder={ar ? 'مثال: أرامكو السعودية' : 'e.g. Saudi Aramco'} value={form.company} onChange={set('company')} />
                </Field>

                <Button type="submit" disabled={loading}
                  className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-white font-bold h-12 text-[15px] rounded-xl mt-2">
                  {loading
                    ? (ar ? 'جارٍ إنشاء الحساب…' : 'Creating Account…')
                    : (ar ? 'إنشاء الحساب والمتابعة' : 'Create Account & Continue')}
                  {!loading && (ar ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />)}
                </Button>

                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  {ar
                    ? 'بتسجيلك فإنك توافق على شروط الخدمة الخاصة بنا. تُحفظ معلوماتك بسرية تامة.'
                    : 'By registering you agree to our Terms of Service. Your information is kept strictly confidential.'}
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <Field label={ar ? 'البريد الإلكتروني *' : 'Email Address *'} icon={<Mail className="w-4 h-4" />}>
                  <Input type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} />
                </Field>
                <Field label={ar ? 'كلمة المرور *' : 'Password *'} icon={<Lock className="w-4 h-4" />}
                  suffix={<button type="button" onClick={() => setShowPass(v => !v)} className="text-muted-foreground hover:text-primary">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}>
                  <Input type={showPass ? 'text' : 'password'} placeholder={ar ? 'كلمة المرور الخاصة بك' : 'Your password'} value={form.password} onChange={set('password')} />
                </Field>
                <Button type="submit"
                  className="w-full bg-[#082C6B] hover:bg-[#0B3D91] text-white font-bold h-12 text-[15px] rounded-xl mt-2">
                  {ar ? 'تسجيل الدخول' : 'Sign In'} {ar ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {ar ? 'ليس لديك حساب بعد؟' : 'No account yet?'}{' '}
                  <button type="button" onClick={() => setMode('register')} className="text-primary font-semibold hover:underline">
                    {ar ? 'سجّل من هنا' : 'Register here'}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Why register */}
        {mode === 'register' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-6 bg-white/10 rounded-2xl p-5 text-white border border-white/15">
            <p className="text-sm font-bold text-[#C9A84C] mb-3">{ar ? 'لماذا التسجيل؟' : 'Why register?'}</p>
            <div className="space-y-2">
              {(ar
                ? [
                    'الوصول الكامل إلى التشخيص الذكي وتقييم النضج',
                    'حجز المواعيد مع مَعِن مباشرةً',
                    'استلام تقارير سلسلة الإمداد المخصّصة لك',
                    'تلقّي إشعارات بأحدث الرؤى ودراسات الحالة',
                  ]
                : [
                    'Access the full AI Diagnostic & Maturity Assessment',
                    'Book appointments with Ma\'in directly',
                    'Receive personalised supply chain reports',
                    'Get notified on new insights and case studies',
                  ]
              ).map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function Field({ label, icon, suffix, children }: { label: string; icon: React.ReactNode; suffix?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-muted-foreground">{icon}</span>
        <div className="w-full [&_input]:pl-9 [&_input]:pr-9">{children}</div>
        {suffix && <span className="absolute right-3">{suffix}</span>}
      </div>
    </div>
  );
}
