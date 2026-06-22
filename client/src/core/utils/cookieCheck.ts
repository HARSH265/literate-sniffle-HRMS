const COOKIE_TEST_KEY = '__hrms_cookie_test__';

export async function areCookiesBlocked(): Promise<boolean> {
  try {
    document.cookie = `${COOKIE_TEST_KEY}=1;SameSite=Lax`;
    const blocked = !document.cookie.includes(COOKIE_TEST_KEY);
    if (blocked) return true;
    document.cookie = `${COOKIE_TEST_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;SameSite=Lax`;
    return false;
  } catch {
    return true;
  }
}

let _blocked: boolean | null = null;

export async function checkCookiesOnce(): Promise<boolean> {
  if (_blocked !== null) return _blocked;
  _blocked = await areCookiesBlocked();
  return _blocked;
}
