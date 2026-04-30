import { Eye, EyeClosed } from "lucide-react";
import { useState } from "react";

interface PasswordProps {
  password: string;
  setPassword: (password: string) => void;
  label?: string;
  placeholder?: string;
  title?: string;
}

const Password = ({
  label = "Jelszó",
  placeholder = "Add meg a jelszavad",
  title = "A jelszónak legalább 8 karakter hosszúnak kell lennie, és tartalmaznia kell legalább egy nagybetűt, és egy számot.",
  password,
  setPassword,
}: PasswordProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const id = `${label}-hint`;
  return (
    <div>
      <label htmlFor={label} className="block text-sm text-gray-200 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="relative">
          <input
            name="password"
            autoComplete="current-password"
            id={label}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            size={20}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="input-ring pr-9"
            required
            aria-describedby={id}
          />
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-200"
            onClick={() => setShowPassword(!showPassword)}
            data-testid="password-toggle"
          >
            {showPassword ? <Eye /> : <EyeClosed />}
          </div>
        </div>
        {title && (
          <p
            id={id}
            className={`${isFocused ? "opacity-100" : "opacity-0"} tooltip`}
          >
            {title}
          </p>
        )}
      </div>
    </div>
  );
};

export default Password;
