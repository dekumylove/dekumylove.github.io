const REPO_OWNER = 'dekumylove';
const REPO_NAME = 'dekumylove.github.io';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

function fromBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

interface FileInfo {
  content: string;
  sha: string;
}

export async function getFile(token: string, path: string): Promise<FileInfo> {
  const res = await fetch(`${API_BASE}/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    content: fromBase64(data.content),
    sha: data.sha,
  };
}

export async function saveFile(
  token: string,
  path: string,
  content: string,
  sha: string,
  message: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      ...(sha ? { sha } : {}),
      branch: 'main',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to save ${path}: ${res.status}`);
  }
}
