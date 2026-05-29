import { useState, useEffect } from 'preact/hooks';
import { getFile, saveFile } from '../lib/github-api';
import { sha256 } from '../lib/crypto';

type Tab = 'profile' | 'blog' | 'settings';

interface ProfileData {
  name_zh: string;
  name_en: string;
  title_zh: string;
  title_en: string;
  bio_zh: string;
  bio_en: string;
  avatar: string;
  social: {
    github: string;
    scholar: string;
    email: string;
    twitter: string;
    linkedin: string;
  };
  scholar_author_id: string;
}

const DEFAULT_PROFILE: ProfileData = {
  name_zh: '',
  name_en: '',
  title_zh: '',
  title_en: '',
  bio_zh: '',
  bio_en: '',
  avatar: '',
  social: { github: '', scholar: '', email: '', twitter: '', linkedin: '' },
  scholar_author_id: '',
};

interface BlogPost {
  title: string;
  date: string;
  tags: string;
  lang: 'zh' | 'en';
  slug: string;
  content: string;
}

const TOKEN_KEY = 'gh-admin-token';
const AUTH_KEY = 'gh-admin-auth';

export default function AdminPanel() {
  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [storedHash, setStoredHash] = useState('');
  const [adminSha, setAdminSha] = useState('');
  const [authError, setAuthError] = useState('');

  // GitHub token (for API calls)
  const [token, setToken] = useState('');

  // UI state
  const [tab, setTab] = useState<Tab>('profile');
  const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error'; msg: string } | null>(null);

  // Profile state
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [profileSha, setProfileSha] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Blog state
  const [blogPost, setBlogPost] = useState<BlogPost>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    lang: 'zh',
    slug: '',
    content: '',
  });
  const [blogMode, setBlogMode] = useState<'create' | 'edit'>('create');
  const [editingFile, setEditingFile] = useState('');

  // Settings state
  const [newPassword, setNewPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  // Load saved state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) setToken(savedToken);
    const savedAuth = sessionStorage.getItem(AUTH_KEY);
    if (savedAuth) setAuthenticated(true);
  }, []);

  // ---- Auth ----
  async function handleLogin() {
    setAuthError('');
    try {
      const file = await getAnonymousFile('src/data/admin.json');
      const admin = JSON.parse(file.content);
      setStoredHash(admin.password_hash);
      setAdminSha(file.sha);

      const inputHash = await sha256(passwordInput);
      if (inputHash === admin.password_hash) {
        sessionStorage.setItem(AUTH_KEY, '1');
        setAuthenticated(true);
        setPasswordInput('');
      } else {
        setAuthError('Incorrect password.');
      }
    } catch (e: any) {
      setAuthError(`Failed to load: ${e.message}`);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 4) {
      setStatus({ type: 'error', msg: 'Password must be at least 4 characters.' });
      return;
    }
    if (!token) {
      setStatus({ type: 'error', msg: 'Please set your GitHub token first (in Settings tab).' });
      return;
    }
    setStatus({ type: 'loading', msg: 'Updating password...' });
    try {
      const newHash = await sha256(newPassword);
      const content = JSON.stringify({ password_hash: newHash }, null, 2) + '\n';
      await saveFile(token, 'src/data/admin.json', content, adminSha, 'chore: update admin password');
      setStoredHash(newHash);
      setNewPassword('');
      setStatus({ type: 'success', msg: 'Password updated! Use the new password next time you log in.' });
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message });
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
    setStatus(null);
  }

  // ---- Profile ----
  async function loadProfile() {
    setStatus({ type: 'loading', msg: 'Loading profile...' });
    try {
      const file = await getFile(token, 'src/data/profile.json');
      const data = JSON.parse(file.content) as ProfileData;
      setProfile(data);
      setProfileSha(file.sha);
      setProfileLoaded(true);
      setStatus({ type: 'success', msg: 'Profile loaded' });
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message });
    }
  }

  async function saveProfile() {
    setStatus({ type: 'loading', msg: 'Saving profile...' });
    try {
      await saveFile(
        token, 'src/data/profile.json',
        JSON.stringify(profile, null, 2) + '\n', profileSha,
        'chore: update profile via admin panel',
      );
      setStatus({ type: 'success', msg: 'Saved! Site rebuilds in 1-2 minutes.' });
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message });
    }
  }

  // ---- Blog ----
  async function saveBlogPost() {
    if (!blogPost.slug || !blogPost.content) {
      setStatus({ type: 'error', msg: 'Slug and content are required.' });
      return;
    }
    setStatus({ type: 'loading', msg: 'Saving blog post...' });
    const dir = blogPost.lang === 'zh' ? 'src/content/blog/zh' : 'src/content/blog/en';
    const filePath = `${dir}/${blogPost.slug}.md`;

    const frontmatter = [
      '---',
      `title: "${blogPost.title}"`,
      `date: ${blogPost.date}`,
      `tags: [${blogPost.tags.split(',').map(t => `"${t.trim()}"`).filter(t => t !== '""').join(', ')}]`,
      `lang: "${blogPost.lang}"`,
      `draft: false`,
      '---',
      '',
    ].join('\n');

    const fullContent = frontmatter + blogPost.content;

    try {
      let sha = '';
      if (blogMode === 'edit' && editingFile) {
        try { const existing = await getFile(token, editingFile); sha = existing.sha; } catch {}
      }
      await saveFile(token, filePath, fullContent, sha,
        `${blogMode === 'edit' ? 'chore: update' : 'feat: add'} blog post "${blogPost.title}" via admin panel`,
      );
      setStatus({ type: 'success', msg: `Post ${blogMode === 'edit' ? 'updated' : 'published'}! Site rebuilds in 1-2 minutes.` });
      if (blogMode === 'create') {
        setBlogPost({ title: '', date: new Date().toISOString().split('T')[0], tags: '', lang: 'zh', slug: '', content: '' });
      }
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message });
    }
  }

  // ---- Helpers ----
  function updateProfileField(section: keyof ProfileData | 'social', field: string | null, value: string) {
    setProfile(prev => {
      const next = { ...prev };
      if (section === 'social' && field) {
        next.social = { ...next.social, [field]: value };
      } else if (section !== 'social') {
        (next as Record<string, string>)[section] = value;
      }
      return next;
    });
  }

  function saveTokenInput() {
    if (tokenInput) {
      localStorage.setItem(TOKEN_KEY, tokenInput);
      setToken(tokenInput);
      setTokenInput('');
      setStatus({ type: 'success', msg: 'GitHub token saved.' });
    }
  }

  // ---- Login screen ----
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Admin Login</h2>
        <input
          type="password"
          value={passwordInput}
          onChange={e => setPasswordInput((e.target as HTMLInputElement).value)}
          onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
          placeholder="Enter admin password"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm mb-3"
        />
        {authError && <p className="text-sm text-red-500 mb-3">{authError}</p>}
        <button
          onClick={handleLogin}
          disabled={!passwordInput}
          className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80 disabled:opacity-40"
        >
          Login
        </button>
      </div>
    );
  }

  // ---- Main admin panel ----
  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'blog', label: 'Blog' },
    { key: 'settings', label: 'Settings' },
  ];

  const statusBar = status ? (
    <div className={`mb-6 p-4 rounded-lg text-sm ${
      status.type === 'loading' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
      status.type === 'success' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' :
      'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
    }`}>
      {status.msg}
    </div>
  ) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
      </div>

      <div className="flex gap-2 mb-8">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setStatus(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {statusBar}

      {/* ---- Profile Tab ---- */}
      {tab === 'profile' && (
        <div className="space-y-6">
          {!profileLoaded ? (
            <button onClick={loadProfile} disabled={!token} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80 disabled:opacity-40">
              {token ? 'Load Profile Data' : 'Set GitHub token in Settings first'}
            </button>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name (中文)</label>
                  <input value={profile.name_zh} onChange={e => updateProfileField('name_zh', null, (e.target as HTMLInputElement).value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name (English)</label>
                  <input value={profile.name_en} onChange={e => updateProfileField('name_en', null, (e.target as HTMLInputElement).value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title (中文)</label>
                  <input value={profile.title_zh} onChange={e => updateProfileField('title_zh', null, (e.target as HTMLInputElement).value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title (English)</label>
                  <input value={profile.title_en} onChange={e => updateProfileField('title_en', null, (e.target as HTMLInputElement).value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bio (中文)</label>
                  <textarea value={profile.bio_zh} onChange={e => updateProfileField('bio_zh', null, (e.target as HTMLTextAreaElement).value)}
                    rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bio (English)</label>
                  <textarea value={profile.bio_en} onChange={e => updateProfileField('bio_en', null, (e.target as HTMLTextAreaElement).value)}
                    rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 dark:text-white pt-4">Social Links</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(['github', 'scholar', 'email', 'twitter', 'linkedin'] as const).map(f => (
                  <div key={f}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{f}</label>
                    <input value={profile.social[f]} onChange={e => updateProfileField('social', f, (e.target as HTMLInputElement).value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Scholar Author ID</label>
                <input value={profile.scholar_author_id} onChange={e => updateProfileField('scholar_author_id', null, (e.target as HTMLInputElement).value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              </div>

              <button onClick={saveProfile}
                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80">
                Save & Deploy
              </button>
            </>
          )}
        </div>
      )}

      {/* ---- Blog Tab ---- */}
      {tab === 'blog' && (
        <div className="space-y-6">
          {!token && (
            <p className="text-sm text-amber-600 dark:text-amber-400">Set your GitHub token in Settings before publishing.</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => setBlogMode('create')}
              className={`px-3 py-1.5 rounded text-xs font-medium ${blogMode === 'create' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              New Post
            </button>
            <button onClick={() => setBlogMode('edit')}
              className={`px-3 py-1.5 rounded text-xs font-medium ${blogMode === 'edit' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
              Edit Existing
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
              <input value={blogPost.title} onChange={e => setBlogPost(p => ({ ...p, title: (e.target as HTMLInputElement).value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Slug (URL name)</label>
              <input value={blogPost.slug} onChange={e => setBlogPost(p => ({ ...p, slug: (e.target as HTMLInputElement).value }))}
                placeholder="my-first-post"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" value={blogPost.date} onChange={e => setBlogPost(p => ({ ...p, date: (e.target as HTMLInputElement).value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
              <select value={blogPost.lang} onChange={e => setBlogPost(p => ({ ...p, lang: (e.target as HTMLSelectElement).value as 'zh' | 'en' }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Tags (comma-separated)</label>
              <input value={blogPost.tags} onChange={e => setBlogPost(p => ({ ...p, tags: (e.target as HTMLInputElement).value }))}
                placeholder="tech, thoughts"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Content (Markdown)</label>
              <textarea value={blogPost.content} onChange={e => setBlogPost(p => ({ ...p, content: (e.target as HTMLTextAreaElement).value }))}
                rows={16}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white font-mono" />
            </div>
          </div>

          <button onClick={saveBlogPost} disabled={!token}
            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80 disabled:opacity-40">
            Publish Post
          </button>
        </div>
      )}

      {/* ---- Settings Tab ---- */}
      {tab === 'settings' && (
        <div className="space-y-8">
          {/* GitHub Token */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">GitHub Token</h3>
            <p className="text-xs text-gray-500 mb-3">
              Required for saving any changes. Create one with <strong>repo</strong> scope at{' '}
              <a href="https://github.com/settings/tokens/new?scopes=repo&description=Site%20Admin" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                GitHub Settings →
              </a>
            </p>
            <div className="flex gap-2">
              <input type="password" value={tokenInput}
                onChange={e => setTokenInput((e.target as HTMLInputElement).value)}
                placeholder={token ? 'Token is set (hidden)' : 'ghp_...'}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              <button onClick={saveTokenInput} disabled={!tokenInput}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80 disabled:opacity-40 text-sm">
                Save Token
              </button>
            </div>
            {token && <p className="text-xs text-green-600 mt-2">Token is configured.</p>}
          </div>

          {/* Change Password */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Change Password</h3>
            <p className="text-xs text-gray-500 mb-3">
              Set a new admin password. This will be updated in the repository.
            </p>
            <div className="flex gap-2">
              <input type="password" value={newPassword}
                onChange={e => setNewPassword((e.target as HTMLInputElement).value)}
                placeholder="New password (min 4 chars)"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              <button onClick={handleChangePassword} disabled={!newPassword || !token}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80 disabled:opacity-40 text-sm">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-12 text-xs text-gray-400 dark:text-gray-600">
        After saving, GitHub Actions rebuilds in 1-2 minutes.{' '}
        <a href="https://github.com/dekumylove/dekumylove.github.io/actions" target="_blank" rel="noopener" className="underline">View progress →</a>
      </p>
    </div>
  );
}

// Fetch a public file without auth (for admin.json during login)
async function getAnonymousFile(path: string): Promise<{ content: string; sha: string }> {
  const res = await fetch(`https://api.github.com/repos/dekumylove/dekumylove.github.io/contents/${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  let binary = atob(data.content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return {
    content: new TextDecoder().decode(bytes),
    sha: data.sha,
  };
}
