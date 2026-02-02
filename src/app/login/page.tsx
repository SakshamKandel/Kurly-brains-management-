"use client";
// Force HMR Update


import workspaceLogo from "../../../public/workspace-logo.png";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const words = [
    {
      text: "Welcome",
      className: "text-white dark:text-white",
    },
    {
      text: "to",
      className: "text-white dark:text-white",
    },
    {
      text: "Kurly",
      className: "text-white dark:text-white",
    },
    {
      text: "Brains",
      className: "text-white dark:text-white",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Access Denied", {
          description: "Invalid email or password. Please try again.",
        });
      } else {
        toast.success("Welcome back", {
          description: "Redirecting to your workspace...",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Connection Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#191919] text-white font-sans overflow-hidden"
      style={{
        backgroundColor: '#191919',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern (Optional subtle texture) */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          pointerEvents: 'none'
        }}
      />

      {/* Centered Login Card */}
      <div
        className="w-full max-w-sm relative z-10 p-6"
        style={{
          width: '100%',
          maxWidth: '24rem',
          position: 'relative',
          zIndex: 10,
          padding: '1.5rem'
        }}
      >
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center flex flex-col items-center"
          style={{ marginBottom: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div className="inline-flex items-center gap-3 mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <img
              src={workspaceLogo.src}
              alt="Kurly Brains"
              className="w-10 h-10 object-contain"
              style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
          </div>

          {/* Typewriter Effect */}
          <div className="mb-2" style={{ marginBottom: '0.5rem' }}>
            <TypewriterEffectSmooth words={words} cursorClassName="bg-white" />
          </div>

          <p className="text-white/50 text-base" style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1rem' }}>
            Please enter your details.
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <label className="block text-xs uppercase font-medium text-white/40 mb-1.5 ml-1" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.375rem', marginLeft: '0.25rem' }}>
              Email Address
            </label>
            <div className={`relative group transition-all duration-200 ${focusedField === 'email' ? 'scale-[1.01]' : ''}`} style={{ position: 'relative' }}>
              <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-white' : 'text-white/30'}`} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: focusedField === 'email' ? '#ffffff' : 'rgba(255, 255, 255, 0.3)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="name@kurlybrains.com"
                required
                autoFocus
                className="w-full h-11 pl-10 pr-4 bg-[#252525] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/5 transition-all duration-200 shadow-sm"
                style={{
                  width: '100%',
                  height: '2.75rem',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  backgroundColor: '#252525',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)'
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <label className="block text-xs uppercase font-medium text-white/40 mb-1.5 ml-1" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.375rem', marginLeft: '0.25rem' }}>
              Password
            </label>
            <div className={`relative group transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.01]' : ''}`} style={{ position: 'relative' }}>
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-white' : 'text-white/30'}`} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: focusedField === 'password' ? '#ffffff' : 'rgba(255, 255, 255, 0.3)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                required
                className="w-full h-11 pl-10 pr-4 bg-[#252525] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/5 transition-all duration-200 shadow-sm"
                style={{
                  width: '100%',
                  height: '2.75rem',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  backgroundColor: '#252525',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)'
                }}
              />
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full h-11 rounded-lg font-medium text-[#191919] bg-white hover:bg-white/90 shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            style={{
              position: 'relative',
              width: '100%',
              height: '2.75rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              color: '#191919',
              backgroundColor: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#191919]/80" style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4 opacity-70" style={{ width: '1rem', height: '1rem', opacity: 0.7 }} />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Items */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-12 text-center"
          style={{ marginTop: '3rem', textAlign: 'center' }}
        >
          <div className="flex items-center justify-center gap-6 text-xs text-white/30" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.3)' }}>
            <a href="#" className="hover:text-white transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>Help Center</a>
            <span style={{ width: '3px', height: '3px', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%' }}></span>
            <a href="#" className="hover:text-white transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>Terms of Service</a>
          </div>
          <p className="mt-4 text-[10px] text-white/20 font-mono" style={{ marginTop: '1rem', fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)', fontFamily: 'monospace' }}>
            SECURE WORKSPACE v2.1.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
