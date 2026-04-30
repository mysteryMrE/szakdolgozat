import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Password from "../components/Password";
import { useError } from "../contexts/ErrorContext";

/**
 * Registration page component allowing users to create a new account.
 * @returns {ReactNode} The rendered registration page component.
 */
const RegisterPage = (): ReactNode => {
  const { user, login, register } = useAuth();
  const { addError } = useError();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);

  /**
   * Validates and handles the registration form submission.
   * @param e The form submission event.
   * @returns A promise that resolves when the registration is complete.
   */
  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addError("A jelszavak nem egyeznek meg");
      return;
    }
    if (username) {
      const ok = await register(username, password);
      if (ok) {
        await login(username, password);
      }
    }
  };

  // Redirects to home page if user is logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="content-container min-h-0 h-fit">
      <h1 className="mb-5 md:mb-10">Regisztráció</h1>
      <div className="content-box md:w-4/7">
        <form onSubmit={handleRegister} className="flex flex-col space-y-6">
          <div className="flex flex-col gap-10 justify-center">
            <div>
              <label
                htmlFor="username"
                className="block text-sm text-gray-200 mb-1"
              >
                Név
              </label>
              <div className="relative">
                <input
                  name="username"
                  id="username"
                  autoComplete="new-username"
                  type="text"
                  size={23}
                  placeholder="Add meg a felhasználóneved"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="input-ring"
                  aria-describedby="usernameHint"
                  required
                />
                <p
                  id="usernameHint"
                  className={`${isFocused ? "opacity-100" : "opacity-0"} tooltip`}
                >
                  A felhasználónévnek egyedinek és 3-32 karakter hosszúnak kell
                  lennie, csak számokat és betűket tartalmazhat.
                </p>
              </div>
            </div>
            <Password
              label="Jelszó"
              placeholder="Add meg a jelszavad"
              password={password}
              setPassword={setPassword}
            />
            <Password
              label="Jelszó megerősítése"
              placeholder="Jelszó ismét"
              title="Egyeznie kell az előzőleg megadott jelszóval."
              password={confirmPassword}
              setPassword={setConfirmPassword}
            />
          </div>
          <div className="flex justify-center">
            <button className="btn w-fit" type="submit">
              Regisztráció
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
