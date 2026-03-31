import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signInWithEmail } from '@/hooks/useAuth';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email, password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-white font-bold text-2xl leading-none mb-6 shadow-lg shadow-accent/30">
            E
          </div>
          <h1 className="text-3xl font-bold font-sans text-text-primary tracking-tight">EngiTrack</h1>
          <p className="text-sm font-sans text-text-secondary mt-2">قم بتسجيل الدخول للوصول إلى لوحة التحكم.</p>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary font-sans block">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-2.5 h-4 w-4 text-text-muted" />
                <Input 
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com" className="pl-3 pr-9 bg-bg-base dir-ltr text-left" dir="ltr" required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary font-sans block">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-text-muted" />
                <Input 
                  type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="px-9 bg-bg-base dir-ltr text-left" dir="ltr" required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-2.5 text-text-muted hover:text-text-primary">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border-default text-accent focus:ring-accent accent-accent"
                />
                <span className="text-sm font-sans text-text-secondary group-hover:text-text-primary transition-colors">تذكرني</span>
              </label>
              <button type="button" className="text-sm font-sans text-accent hover:text-accent-hover transition-colors">نسيت كلمة المرور؟</button>
            </div>

            {error && (
              <div className="bg-status-critical/10 border border-status-critical/30 rounded-lg p-3 text-sm text-status-critical font-sans text-center">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent-hover text-white font-sans h-11 text-base">
              {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : 'تسجيل الدخول'}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
