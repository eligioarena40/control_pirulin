import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import api from "../services/api";

export default function Login({
  onLoginSuccess,
  fondoPirulinUrl = "",
  logoUrl = "",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setCargando(true);
    try {
      const { data } = await api.post("/api/usuarios/login", {
        email: email.trim(),
        password,
      });

      if (data?.token) {
        localStorage.setItem("token", data.token);
        if (recordarSesion) {
          localStorage.setItem("pirulin_recordar", "true");
        } else {
          localStorage.removeItem("pirulin_recordar");
        }
      }

      if (data?.usuario) {
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
      }

      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(data);
      }
    } catch (error) {
      setErrorMsg(
        error?.response?.data?.mensaje ||
          "No se pudo iniciar sesión. Verifica tus credenciales."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-200 dark:from-stone-950 dark:via-amber-950/30 dark:to-stone-950">
      {/* Fondo con imagen del producto Pirulín */}
      {fondoPirulinUrl && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-20 scale-105 pointer-events-none"
          style={{ backgroundImage: `url(${fondoPirulinUrl})` }}
        />
      )}

      {/* Decoración cálida lateral inspirada en Pirulín */}
      <div
        aria-hidden="true"
        className="hidden lg:flex items-center justify-center w-64 h-64 rounded-full bg-amber-400/25 blur-2xl absolute -left-12 top-1/2 -translate-y-1/2 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="hidden lg:flex items-center justify-center w-72 h-72 rounded-full bg-orange-500/20 blur-2xl absolute -right-14 top-1/2 -translate-y-1/2 pointer-events-none"
      />

      {/* Tarjeta principal de Login */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-amber-100 dark:border-gray-800 p-6 sm:p-8 space-y-6">
        {/* Encabezado / Marca */}
        <div className="space-y-1 text-center sm:text-left">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Control Pirulín"
              className="h-10 w-auto mx-auto sm:mx-0 mb-2 object-contain"
            />
          ) : (
            <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 mb-1">
              Control Pirulín
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Login
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Ingresa con tu cuenta para gestionar ventas, abonos y clientes
          </p>
        </div>

        {/* Mensaje de error */}
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold"
          >
            {errorMsg}
          </div>
        )}

        {/* Formulario Email + Contraseña */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-amber-50/50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-medium text-gray-900 dark:text-white transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={mostrarPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-11 rounded-xl bg-amber-50/50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-medium text-gray-900 dark:text-white transition"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400 font-medium select-none">
              <input
                type="checkbox"
                checked={recordarSesion}
                onChange={(e) => setRecordarSesion(e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              Recordar sesión
            </label>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] disabled:opacity-60 text-white font-extrabold text-sm shadow-md inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{cargando ? "Ingresando..." : "Sign in"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}