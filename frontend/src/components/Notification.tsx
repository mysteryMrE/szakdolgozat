import { motion, AnimatePresence } from "framer-motion";
import type { NotificationMessage } from "../types";
import type { ReactNode } from "react";

interface NotificationProps {
  messages: NotificationMessage[];
}

const messageMap: Record<string, string> = {
  "Password must contain at least one uppercase letter":
    "A jelszónak tartalmaznia kell legalább egy nagybetűt",
  "Password must contain at least one lowercase letter":
    "A jelszónak tartalmaznia kell legalább egy kisbetűt",
  "Password must contain at least one number":
    "A jelszónak tartalmaznia kell legalább egy számot",
  "Password is too long": "A jelszó túl hosszú",
  "Password must be at least 8 characters long":
    "A jelszónak legalább 8 karakter hosszúnak kell lennie",
  "Username taken": "A felhasználónév foglalt",
  "Invalid username": "Érvénytelen felhasználónév",
  "Invalid layers: must be a list with at least two elements, input layer must have 18 neurons and output layer must have 9 neurons":
    "Érvénytelen rétegek: legalább két elemet tartalmazó listának kell lennie, a bemeneti rétegnek 18 neuronnal, a kimeneti rétegnek pedig 9 neuronnal kell rendelkeznie.",
  "Maximum number of networks reached. Please delete an existing network before creating a new one.":
    "Elérted a neuronhálók maximális számát. Kérlek, törölj egy meglévő neuronhálót, mielőtt újat hozol létre.",
  "Session revoked": "A munkamenet lejárt, kérlek, jelentkezz be újra.",
  "User has no active session":
    "A munkamenet lejárt, kérlek, jelentkezz be újra.",
  "Invalid refresh token": "Érvénytelen token.",
  "Invalid credentials": "Érvénytelen felhasználónév vagy jelszó.",
  "Invalid access token": "Érvénytelen token.",
  "You already have a job running": "Már fut egy tanításod.",
  "Network not found or not yours":
    "A neuronháló nem található vagy nem a sajátod.",
  "Server busy, try again later": "A szerver elfoglalt, próbáld újra később.",
  "Job not found": "A tanítás nem található.",
  "Not your job": "Nem hozzád tartozó tanítás.",
  "Missing access token": "Hiányzó token.",
  "Job already finished": "A tanítás már befejeződött.",
  "not your turn": "Nem te következel!",
  "Network not found": "Neuronháló nem található",
  "Internal server error": "Szerverhiba",
  "Missing token for non-guest user":
    "Hiányzó token nem vendég WebSocket-kapcsolatához.",
  "Missing refresh token": "Hiányzó token.",
  "Database timed out, please try again":
    "Az adatbázis elfoglalt, kérlek, próbáld újra.",
  "Resource already exists or constraint failed.":
    "Az erőforrás már létezik vagy egy megszorítás megsértve.",
  "Database unavailable": "Az adatbázis nem elérhető.",
  "no active game session": "A játék nem található.",
  "Failed to find network after creation, failed to create network.":
    "Nem sikerült megtalálni a hálót létrehozás után, nem sikerült létrehozni a hálót.",
};

const getTranslation = (msg: any): string => {
  const safeMsg =
    typeof msg === "string" ? msg : msg ? JSON.stringify(msg) : ""; // should always be string, but just in case

  if (messageMap[safeMsg]) {
    return messageMap[safeMsg];
  }

  const limitMatch = safeMsg.match(
    /total number of neurons must not exceed (\d+)/,
  );

  if (limitMatch) {
    const maxNodes = limitMatch[1];
    return `Érvénytelen formátum: a neuronok teljes száma nem haladhatja meg a ${maxNodes}-t.`;
  }

  return safeMsg;
};

/**
 * Notification component to display error messages.
 *
 * Shows a pop up notification for each message in the messages array.
 *
 * @param {NotificationProps} props
 * @returns A component containing the notifications.
 */
const Notification = ({ messages }: NotificationProps): ReactNode => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg select-none"
            role="alert"
          >
            {getTranslation(msg.message)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
export default Notification;
