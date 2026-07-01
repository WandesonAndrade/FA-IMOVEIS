import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  ShieldAlert,
  LogIn,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  auth,
  isConfigured,
  fetchAdminUsersFromFirebase,
} from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  language: "pt" | "en";
}

export default function LoginScreen({
  onLoginSuccess,
  language,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPt = language === "pt";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(
        isPt
          ? "Por favor, preencha todos os campos."
          : "Please fill in all fields.",
      );
      return;
    }

    setLoading(true);
    setError("");

    // 1. Procura e valida as credenciais administrativas diretamente do ficheiro .env
    const adminFallbackEmail = import.meta.env.VITE_ADMIN_FALLBACK_EMAIL;
    const adminFallbackPassword = import.meta.env.VITE_ADMIN_FALLBACK_PASSWORD;

    const isEnvAdmin =
      adminFallbackEmail &&
      email.trim().toLowerCase() === adminFallbackEmail.toLowerCase() &&
      password === adminFallbackPassword;

    // Se coincidir com o Admin Master definido no .env, concede o acesso de imediato
    if (isEnvAdmin) {
      setLoading(false);
      onLoginSuccess({
        uid: "env_master_admin",
        email: adminFallbackEmail,
        displayName: "Administrador Master (.env)",
        role: "admin",
        isAnonymous: false,
      });
      return;
    }

    // 2. Caso não seja o admin do .env, tenta realizar a validação via Firebase
    if (isConfigured && auth) {
      try {
        // Verifica primeiro na coleção personalizada de administradores no Firestore
        const firestoreAdmins = await fetchAdminUsersFromFirebase();
        const matchedFirestoreAdmin = firestoreAdmins.find(
          (u: any) =>
            u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
            u.password === password,
        );

        if (matchedFirestoreAdmin) {
          setLoading(false);
          onLoginSuccess({
            uid: matchedFirestoreAdmin.id,
            email: matchedFirestoreAdmin.email,
            displayName: matchedFirestoreAdmin.name,
            role: matchedFirestoreAdmin.role || "admin",
            isAnonymous: false,
          });
          return;
        }

        // Tenta a autenticação padrão do Firebase Auth (utilizadores registados no Authentication)
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        setLoading(false);
        onLoginSuccess(userCredential.user);
        return;
      } catch (err: any) {
        console.error("Firebase Login Error:", err);
        setLoading(false);
        let firebaseErrorMsg = err.message;

        if (err.code === "auth/invalid-credential") {
          firebaseErrorMsg = isPt
            ? "E-mail ou senha inválidos. Verifique as credenciais."
            : "Invalid email or password. Please verify your credentials.";
        } else if (err.code === "auth/user-not-found") {
          firebaseErrorMsg = isPt
            ? "Utilizador não encontrado."
            : "User not found.";
        } else if (err.code === "auth/wrong-password") {
          firebaseErrorMsg = isPt ? "Senha incorreta." : "Incorrect password.";
        } else if (err.code === "auth/operation-not-allowed") {
          firebaseErrorMsg = isPt
            ? "O login com E-mail/Senha está desativado no console do Firebase."
            : "Email/Password sign-in is disabled in your Firebase console.";
        } else {
          firebaseErrorMsg = isPt
            ? "Credenciais inválidas ou erro no servidor."
            : "Invalid credentials or server error.";
        }

        setError(firebaseErrorMsg);
        return;
      }
    }

    // Se o Firebase não estiver ativo/configurado e não coincidir com as credenciais do .env
    setLoading(false);
    setError(
      isPt
        ? "Credenciais incorretas ou falha na configuração do servidor."
        : "Invalid credentials or server configuration error.",
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
      >
        {/* Barra Superior da Marca Visual */}
        <div className="bg-gray-950 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-600/10 via-transparent to-transparent opacity-50" />

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mx-auto mb-4 relative z-10"
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight relative z-10">
            {isPt ? "Painel Administrativo" : "Admin Dashboard"}
          </h2>
          <p className="text-gray-400 font-sans text-xs mt-1.5 tracking-wider uppercase font-semibold relative z-10">
            Faimóveis Exclusive
          </p>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-8 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-xs flex gap-3 items-start"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Campo de E-mail */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">
                {isPt ? "E-mail do Administrador" : "Admin Email"}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@faimoveis.com.br"
                  className="w-full bg-gray-50/50 border border-gray-200/80 focus:border-yellow-600 focus:bg-white rounded-2xl py-3 px-4 pl-11 text-xs text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-600/10"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              </div>
            </div>

            {/* Campo de Senha */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">
                {isPt ? "Senha de Acesso" : "Access Password"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50/50 border border-gray-200/80 focus:border-yellow-600 focus:bg-white rounded-2xl py-3 px-4 pl-11 text-xs text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-600/10"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
              </div>
            </div>

            {/* Botão de Submissão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black hover:bg-yellow-600 text-white font-sans text-xs font-bold uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4 hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {isPt ? "Entrar no Painel" : "Sign In"}
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
