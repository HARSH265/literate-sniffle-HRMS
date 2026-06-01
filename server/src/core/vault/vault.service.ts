/**
 * Minimal Vault client wrapper using the built‑in fetch API.
 *
 * In dev mode the Vault server runs unsealed with the token defined by
 * `VAULT_DEV_ROOT_TOKEN_ID`. We read the token from the `VAULT_TOKEN`
 * environment variable (set automatically by Docker). All secrets are
 * stored under the `secret/data/hrms` path.
 *
 * The secret payload is cached for the lifetime of the process – good
 * enough for a local dev workflow. In production you would likely add a
 * short TTL or reload on demand.
 */
export class VaultService {
  private static cachedSecrets: Record<string, any> | null = null;
  private static endpoint: string | null = null;
  private static token: string | null = null;

  private static init(): void {
    if (this.endpoint && this.token) return;
    const endpoint = process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
    const token = process.env.VAULT_TOKEN;
    if (!token) {
      throw new Error('Vault token not configured (VAULT_TOKEN)');
    }
    this.endpoint = endpoint;
    this.token = token;
  }

  /** Load all secrets from `secret/data/hrms` and cache them */
  static async loadAll(): Promise<Record<string, any>> {
    if (this.cachedSecrets) return this.cachedSecrets;
    this.init();
    const url = `${this.endpoint}/v1/secret/data/hrms`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'X-Vault-Token': this.token as string },
    });
    if (!res.ok) {
      throw new Error(`Vault request failed: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    const secrets = json?.data?.data ?? {};
    this.cachedSecrets = secrets;
    return secrets;
  }

  /** Get a single secret by key (await loadAll under the hood) */
  static async get(key: string): Promise<any> {
    const secrets = await this.loadAll();
    if (!(key in secrets)) {
      throw new Error(`Vault secret '${key}' not found`);
    }
    return secrets[key];
  }
}
