import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    birthDate: "",
    city: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate("/onboarding/genres");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 max-w-md mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-1">Resonance</h1>
      <p className="text-text-muted text-sm mb-8">
        {mode === "register" ? "Создайте аккаунт" : "Войдите в аккаунт"}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "register" && (
          <>
            <input
              className="input"
              placeholder="Имя"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="input"
              type="date"
              placeholder="Дата рождения"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Город"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </>
        )}
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <p className="text-accent-2 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Подождите…" : mode === "register" ? "Продолжить" : "Войти"}
        </button>
      </form>

      <button
        className="text-text-muted text-sm mt-6 underline"
        onClick={() => setMode(mode === "register" ? "login" : "register")}
      >
        {mode === "register" ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Создать"}
      </button>
    </div>
  );
}
