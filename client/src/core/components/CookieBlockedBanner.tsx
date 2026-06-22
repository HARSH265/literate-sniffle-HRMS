import { useState, useEffect } from 'react';
import { Alert } from 'antd';
import { checkCookiesOnce } from '../utils/cookieCheck';

export function CookieBlockedBanner() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    checkCookiesOnce().then(setBlocked);
  }, []);

  if (!blocked) return null;

  return (
    <Alert
      type="error"
      showIcon
      banner
      closable
      message="Cookies are blocked or not supported by your browser."
      description="Please enable third-party cookies or add this site to your allowlist to use the application."
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999 }}
    />
  );
}
