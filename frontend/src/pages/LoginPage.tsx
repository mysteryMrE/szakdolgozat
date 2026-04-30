import React, { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Password from "../components/Password";

/**
 * Component for the login page, allowing users to log in to their accounts.
 * @returns The login page component.
 */
const LoginPage = (): ReactNode => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      await login(username, password);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="content-container min-h-0 h-fit">
      <h1 className="mb-5 md:mb-10">Bejelentkezés</h1>
      <div className="content-box md:w-4/7">
        <form onSubmit={handleLogin} className="flex flex-col space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm text-gray-200 mb-1"
            >
              Név
            </label>
            <input
              name="username"
              id="username"
              autoComplete="username"
              type="text"
              size={23}
              placeholder="Add meg a felhasználóneved"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-ring relative"
              required
            />
          </div>
          <Password
            label="Jelszó"
            placeholder="Add meg a jelszavad"
            title=""
            password={password}
            setPassword={setPassword}
          />

          <div className="flex justify-center">
            <button className="btn w-fit" type="submit">
              Bejelentkezés
            </button>
          </div>
        </form>
      </div>

      <div className="content-box mt-5 w-fit flex flex-col">
        <p className="mb-2">Nincs még fiókod?</p>
        <Link className="btn" to="/register">
          Regisztrálj itt!
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
