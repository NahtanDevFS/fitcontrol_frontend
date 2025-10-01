"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authService } from "@/lib/api";
import "./register.css";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authService.register(email, password, nombre);

    if (result.success) {
      if (result.requiresVerification) {
        setSuccess(
          result.message ||
            "Registro exitoso. Por favor revise su correo para verificar la cuenta"
        );
      } else {
        router.push("/dashboard");
      }
    } else {
      setError(result.error || "Error en el registro");
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-form-box">
        <div className="register-header">
          <Image
            src="/favicon.ico"
            alt="FitControl Logo"
            width={50}
            height={50}
            className="register-logo"
          />
          <h1>FitControl</h1>
        </div>
        <p className="register-description">Gestiona tu vida Fitness</p>

        <h2>Crear Cuenta</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre de Usuario</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Cargando..." : "Registrarse"}
          </button>
        </form>

        <p className="login-link">
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión aquí</a>
        </p>
      </div>
    </div>
  );
}
