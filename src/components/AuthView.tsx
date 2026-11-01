import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, Lock, Mail, ArrowRight, Sparkles, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مستخدم بالفعل مسجّل مسبقاً.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة. يجب أن تتكون من 6 خانات على الأقل.');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError('تعذر تسجيل الدخول بواسطة حساب Google. يرجى المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-white flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-black font-['Readex_Pro',sans-serif]">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-[110px]"></div>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fadeIn">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-emerald-500/30 border border-slate-700/80 shadow-2xl mb-2">
            <Wallet className="w-8 h-8 text-blue-400 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            مركز الإدارة المالية الشخصية
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            لوحة تحكم ذكية ومؤمنة لحساباتك، أقساطك، وصافيك المتاح
          </p>
        </div>

        {/* Main Glassmorphic Auth Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/90 bg-[rgba(15,23,42,0.75)] backdrop-blur-2xl shadow-2xl space-y-6">
          
          {/* Tab Switcher */}
          <div className="flex p-1 bg-[#090e1a] border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                !isSignUp 
                  ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isSignUp 
                  ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Auth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full bg-[#0d1527] hover:bg-[#131f38] border border-slate-700/80 text-slate-200 hover:text-white text-xs font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2.5 cursor-pointer shadow-sm active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>المتابعة باستخدام Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-[#0c1322] px-3 text-[11px] text-slate-500 absolute font-bold">
              أو بالبريد الإلكتروني
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>البريد الإلكتروني</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-[#090e1a] border border-slate-800 focus:border-blue-500/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition dir-ltr text-right"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>كلمة المرور</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#090e1a] border border-slate-800 focus:border-blue-500/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition dir-ltr text-right"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-xs font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 ${
                isSignUp
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30'
              }`}
            >
              <span>{isSignUp ? 'إنشاء حساب واستبدال البيانات' : 'تسجيل الدخول للوحة التحكم'}</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>بياناتك المالية معزولة بشكل آمن ومحفوظة سحابياً عبر Cloud Firestore</span>
        </div>

      </div>
    </div>
  );
};
