import { createSign } from "node:crypto";
import { promises as fs } from "node:fs";
const tokenCache = new Map();
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
export function detectGitHubAppEnv(env = process.env) {
    return Boolean(env.GITHUB_APP_ID && (env.GITHUB_APP_PRIVATE_KEY || env.GITHUB_APP_PRIVATE_KEY_PATH));
}
export async function loadGitHubAppConfigFromEnv(env = process.env) {
    if (!hasAnyGitHubAppEnv(env)) {
        return null;
    }
    const appId = env.GITHUB_APP_ID?.trim();
    if (!appId) {
        throw new Error("GitHub App auth is incomplete: GITHUB_APP_ID is required.");
    }
    const privateKey = await readPrivateKey(env);
    if (!privateKey.trim()) {
        throw new Error("GitHub App auth is incomplete: private key is empty.");
    }
    return { appId, privateKey };
}
function hasAnyGitHubAppEnv(env) {
    return Boolean(env.GITHUB_APP_ID || env.GITHUB_APP_PRIVATE_KEY || env.GITHUB_APP_PRIVATE_KEY_PATH);
}
export function createGitHubAppJwt(config, nowSeconds = Math.floor(Date.now() / 1000)) {
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iat: nowSeconds - 60,
        exp: nowSeconds + 9 * 60,
        iss: config.appId
    };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    try {
        const signature = createSign("RSA-SHA256").update(unsignedToken).end().sign(config.privateKey);
        return `${unsignedToken}.${base64UrlEncode(signature)}`;
    }
    catch (error) {
        throw new Error(`Failed to sign GitHub App JWT. Check GITHUB_APP_PRIVATE_KEY: ${formatError(error)}`);
    }
}
export async function getInstallationAccessToken(parts, config, fetchFn = fetch) {
    const cacheKey = `${config.appId}:${parts.owner}/${parts.repo}`;
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.expiresAtMs - TOKEN_REFRESH_SKEW_MS > Date.now()) {
        return cached.token;
    }
    const jwt = createGitHubAppJwt(config);
    const installationId = await discoverInstallationId(parts, jwt, fetchFn);
    const tokenResponse = await createInstallationToken(installationId, jwt, fetchFn);
    tokenCache.set(cacheKey, tokenResponse);
    return tokenResponse.token;
}
export function clearGitHubAppTokenCache() {
    tokenCache.clear();
}
async function readPrivateKey(env) {
    if (env.GITHUB_APP_PRIVATE_KEY?.trim()) {
        return normalizePrivateKey(env.GITHUB_APP_PRIVATE_KEY);
    }
    if (env.GITHUB_APP_PRIVATE_KEY_PATH?.trim()) {
        return fs.readFile(env.GITHUB_APP_PRIVATE_KEY_PATH, "utf8");
    }
    throw new Error("GitHub App auth is incomplete: set GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_PATH.");
}
function normalizePrivateKey(value) {
    return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}
async function discoverInstallationId(parts, jwt, fetchFn) {
    const url = `https://api.github.com/repos/${parts.owner}/${parts.repo}/installation`;
    const response = await fetchFn(url, {
        headers: githubApiHeaders(jwt)
    });
    if (response.status === 404) {
        throw new Error(`GitHub App is not installed on repository or repository was not found: ${parts.owner}/${parts.repo}`);
    }
    if (!response.ok) {
        throw new Error(`Failed to discover GitHub App installation (${response.status} ${response.statusText}): ${url}`);
    }
    const body = (await response.json());
    if (typeof body.id !== "number") {
        throw new Error(`GitHub installation response did not include a numeric installation id: ${parts.owner}/${parts.repo}`);
    }
    return body.id;
}
async function createInstallationToken(installationId, jwt, fetchFn) {
    const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;
    const response = await fetchFn(url, {
        method: "POST",
        headers: githubApiHeaders(jwt)
    });
    if (response.status === 403) {
        throw new Error("GitHub App installation lacks required repository Contents: Read-only permission.");
    }
    if (response.status === 404) {
        throw new Error(`GitHub App installation was not found: ${installationId}`);
    }
    if (!response.ok) {
        throw new Error(`Failed to create GitHub App installation token (${response.status} ${response.statusText}): ${url}`);
    }
    const body = (await response.json());
    if (typeof body.token !== "string" || typeof body.expires_at !== "string") {
        throw new Error("GitHub installation token response did not include token and expires_at.");
    }
    return {
        token: body.token,
        expiresAtMs: Date.parse(body.expires_at)
    };
}
export function githubApiHeaders(token) {
    return {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "user-agent": "okf-atlas-mcp",
        "x-github-api-version": "2022-11-28"
    };
}
function base64UrlEncode(value) {
    return Buffer.from(value).toString("base64url");
}
function formatError(error) {
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=githubApp.js.map