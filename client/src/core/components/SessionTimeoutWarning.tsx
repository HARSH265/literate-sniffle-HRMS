import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'antd';
import { useAuthStore } from '../stores/authStore';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_THRESHOLD_MS = 2 * 60 * 1000;

export function SessionTimeoutWarning() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastActivity = useAuthStore((s) => s.lastActivity);
  const [remainingMs, setRemainingMs] = useState<number>(SESSION_TIMEOUT_MS);

  const check = useCallback(() => {
    if (!isAuthenticated) return;
    const elapsed = Date.now() - lastActivity;
    const remaining = SESSION_TIMEOUT_MS - elapsed;
    setRemainingMs(remaining);
  }, [isAuthenticated, lastActivity]);

  useEffect(() => {
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [check]);

  if (!isAuthenticated || remainingMs > WARNING_THRESHOLD_MS) return null;

  const minutes = Math.max(0, Math.ceil(remainingMs / 60000));

  const handleExtend = () => {
    useAuthStore.getState().touchActivity();
  };

  return (
    <Alert
      type="warning"
      showIcon
      closable={false}
      banner
      message={`Your session will expire in ${minutes} minute${minutes === 1 ? '' : 's'}.`}
      action={
        <a onClick={handleExtend} style={{ fontWeight: 600 }}>
          Extend session
        </a>
      }
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}
    />
  );
}
