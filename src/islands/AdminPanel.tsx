import { useState, useEffect } from 'preact/hooks';
import { getFile, saveFile } from '../lib/github-api';
import { sha256 } from '../lib/crypto';

type Tab = 'profile' | 'blog' | 'experience' | 'settings';

interface ProfileData {
  name_zh: string; name_en: string;
  title_zh: string; title_en: string;
  bio_zh: string; bio_en: string;
  avatar: string;
  social: { github: string; scholar: string; email: string; twitter: string; linkedin: string };
  scholar_author_id: string;
}

interface ExpEntry {
  institution?: string; company?: string; name?: string;
  institution_zh?: string; company_zh?: string; name_zh?: string;
  degree?: string; role?: string;
  degree_zh?: string; role_zh?: string;
  start_date: string; end_date: string | null;
  description: string; description_zh?: string;
  tags?: string[]; url?: string; image?: string;
}

interface ExperienceData {
  education: ExpEntry[];
  work: ExpEntry[];
  projects: ExpEntry[];
}

const EMPTY_EDU: ExpEntry = { institution: '', institution_zh: '', degree: '', degree_zh: '', start_date: '', end_date: null, description: '', description_zh: '' };
const EMPTY_WORK: ExpEntry = { company: '', company_zh: '', role: '', role_zh: '', start_date: '', end_date: null, description: '', description_zh: '' };
const EMPTY_PROJ: ExpEntry = { name: '', name_zh: '', description: '', description_zh: '', tags: [], url: '', image: '', start_date: '', end_date: null };

const DEFAULT_PROFILE: ProfileData = {
  name_zh: '', name_en: '', title_zh: '', title_en: '', bio_zh: '', bio_en: '', avatar: '',
  social: { github: '', scholar: '', email: '', twitter: '', linkedin: '' }, scholar_author_id: '',
};

const DEFAULT_EXP: ExperienceData = { education: [], work: [], projects: [] };

const TOKEN_KEY = 'gh-admin-token';
const AUTH_KEY = 'gh-admin-auth';
const EXP_PATH = 'src/data/experience.json';
const PROFILE_PATH = 'src/data/profile.json';

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [storedHash, setStoredHash] = useState('');
  const [adminSha, setAdminSha] = useState('');
  const [authError, setAuthError] = useState('');
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<Tab>('profile');
  const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error'; msg: string } | null>(null);

  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [profileSha, setProfileSha] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [experience, setExperience] = useState<ExperienceData>(DEFAULT_EXP);
  const [expSha, setExpSha] = useState('');
  const [expLoaded, setExpLoaded] = useState(false);

  const [blogPost, setBlogPost] = useState({ title: '', date: new Date().toISOString().split('T')[0], tags: '', lang: 'zh' as 'zh' | 'en', slug: '', content: '' });
  const [blogMode, setBlogMode] = useState<'create' | 'edit'>('create');
  const [editingFile, setEditingFile] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY); if (t) setToken(t);
    if (sessionStorage.getItem(AUTH_KEY)) setAuthenticated(true);
  }, []);

  // ---- Auth ----
  async function handleLogin() {
    setAuthError('');
    try {
      const file = await getAnonymousFile('src/data/admin.json');
      const admin = JSON.parse(file.content);
      setStoredHash(admin.password_hash); setAdminSha(file.sha);
      if (await sha256(passwordInput) === admin.password_hash) {
        sessionStorage.setItem(AUTH_KEY, '1');
        setAuthenticated(true); setPasswordInput('');
      } else { setAuthError('Incorrect password.'); }
    } catch (e: any) { setAuthError(`Failed: ${e.message}`); }
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 4) { setStatus({ type: 'error', msg: 'Password min 4 chars.' }); return; }
    if (!token) { setStatus({ type: 'error', msg: 'Set GitHub token first.' }); return; }
    setStatus({ type: 'loading', msg: 'Updating...' });
    try {
      const newHash = await sha256(newPassword);
      const content = JSON.stringify({ password_hash: newHash }, null, 2) + '\n';
      await saveFile(token, 'src/data/admin.json', content, adminSha, 'chore: update admin password');
      setStoredHash(newHash); setNewPassword('');
      setStatus({ type: 'success', msg: 'Password updated!' });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  }

  function handleLogout() { sessionStorage.removeItem(AUTH_KEY); setAuthenticated(false); setStatus(null); }

  // ---- Profile ----
  async function loadProfile() {
    setStatus({ type: 'loading', msg: 'Loading...' });
    try {
      const file = await getFile(token, PROFILE_PATH);
      setProfile(JSON.parse(file.content)); setProfileSha(file.sha); setProfileLoaded(true);
      setStatus({ type: 'success', msg: 'Loaded' });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  }

  async function saveProfile() {
    setStatus({ type: 'loading', msg: 'Saving...' });
    try {
      await saveFile(token, PROFILE_PATH, JSON.stringify(profile, null, 2) + '\n', profileSha, 'chore: update profile');
      setStatus({ type: 'success', msg: 'Saved! Rebuilds in 1-2 min.' });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  }

  // ---- Experience ----
  async function loadExperience() {
    setStatus({ type: 'loading', msg: 'Loading...' });
    try {
      const file = await getFile(token, EXP_PATH);
      setExperience(JSON.parse(file.content)); setExpSha(file.sha); setExpLoaded(true);
      setStatus({ type: 'success', msg: 'Loaded' });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  }

  async function saveExperience() {
    setStatus({ type: 'loading', msg: 'Saving...' });
    try {
      await saveFile(token, EXP_PATH, JSON.stringify(experience, null, 2) + '\n', expSha, 'chore: update experience');
      setStatus({ type: 'success', msg: 'Saved! Rebuilds in 1-2 min.' });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  }

  function updateExpEntry(section: 'education' | 'work' | 'projects', idx: number, field: string, value: string | string[] | null) {
    setExperience(prev => {
      const next = { ...prev };
      const list = [...next[section]];
      list[idx] = { ...list[idx], [field]: value };
      next[section] = list;
      return next;
    });
  }

  function addExpEntry(section: 'education' | 'work' | 'projects') {
    const blank = section === 'education' ? { ...EMPTY_EDU } : section === 'work' ? { ...EMPTY_WORK } : { ...EMPTY_PROJ };
    setExperience(prev => ({ ...prev, [section]: [...prev[section], blank] }));
  }

  function removeExpEntry(section: 'education' | 'work' | 'projects', idx: number) {
    setExperience(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== idx) }));
  }

  // ---- Blog ----
  async function saveBlogPost() {
    if (!blogPost.slug || !blogPost.content) { setStatus({ type: 'error', msg: 'Slug and content required.' }); return; }
    setStatus({ type: 'loading', msg: 'Saving...' });
    const dir = blogPost.lang === 'zh' ? 'src/content/blog/zh' : 'src/content/blog/en';
    const fp = `${dir}/${blogPost.slug}.md`;
    const fm = ['---', `title: "${blogPost.title}"`, `date: ${blogPost.date}`, `tags: [${blogPost.tags.split(',').map(t => `"${t.trim()}"`).filter(t => t !== '""').join(', ')}]`, `lang: "${blogPost.lang}"`, `draft: false`, '---', ''].join('\n');
    try {
      let sha = '';
      if (blogMode === 'edit' && editingFile) { try { sha = (await getFile(token, editingFile)).sha; } catch {} }
      await saveFile(token, fp, fm + blogPost.content, sha, `${blogMode === 'edit' ? 'chore: update' : 'feat: add'} "${blogPost.title}"`);
      setStatus({ type: 'success', msg: `Post ${blogMode === 'edit' ? 'updated' : 'published'}!` });
      if (blogMode === 'create') setBlogPost({ title: '', date: new Date().toISOString().split('T')[0], tags: '', lang: 'zh', slug: '', content: '' });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  }

  // ---- Helpers ----
  function updateProfileField(section: keyof ProfileData | 'social', field: string | null, value: string) {
    setProfile(prev => {
      const next = { ...prev };
      if (section === 'social' && field) next.social = { ...next.social, [field]: value };
      else if (section !== 'social') (next as Record<string, string>)[section] = value;
      return next;
    });
  }

  function saveTokenInput() {
    if (tokenInput) { localStorage.setItem(TOKEN_KEY, tokenInput); setToken(tokenInput); setTokenInput(''); setStatus({ type: 'success', msg: 'Token saved.' }); }
  }

  // ---- Login ----
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Admin Login</h2>
        <input type="password" value={passwordInput} onChange={e => setPasswordInput((e.target as HTMLInputElement).value)} onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }} placeholder="Enter admin password" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm mb-3" />
        {authError && <p className="text-sm text-red-500 mb-3">{authError}</p>}
        <button onClick={handleLogin} disabled={!passwordInput} className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80 disabled:opacity-40">Login</button>
      </div>
    );
  }

  // ---- Tabs ----
  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' }, { key: 'experience', label: 'Experience' }, { key: 'blog', label: 'Blog' }, { key: 'settings', label: 'Settings' },
  ];

  const statusBar = status ? (
    <div className={`mb-6 p-4 rounded-lg text-sm ${status.type === 'loading' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : status.type === 'success' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'}`}>{status.msg}</div>
  ) : null;

  const fieldClass = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setStatus(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{t.label}</button>
        ))}
      </div>
      {statusBar}

      {/* ---- Profile ---- */}
      {tab === 'profile' && (
        <div className="space-y-6">
          {!token ? <p className="text-sm text-amber-600">Set GitHub token in Settings first.</p> :
           !profileLoaded ? <button onClick={loadProfile} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80">Load Profile Data</button> : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {(['name_zh','name_en','title_zh','title_en'] as const).map(f => (
                  <div key={f}>
                    <label className={labelClass}>{f.replace('_zh',' (中文)').replace('_en',' (English)')}</label>
                    <input value={(profile as any)[f]} onChange={e => updateProfileField(f, null, (e.target as HTMLInputElement).value)} className={fieldClass} />
                  </div>
                ))}
                <div className="sm:col-span-2"><label className={labelClass}>Bio (中文)</label><textarea value={profile.bio_zh} onChange={e => updateProfileField('bio_zh', null, (e.target as HTMLTextAreaElement).value)} rows={2} className={fieldClass} /></div>
                <div className="sm:col-span-2"><label className={labelClass}>Bio (English)</label><textarea value={profile.bio_en} onChange={e => updateProfileField('bio_en', null, (e.target as HTMLTextAreaElement).value)} rows={2} className={fieldClass} /></div>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white pt-4">Social Links</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(['github','scholar','email','twitter','linkedin'] as const).map(f => (
                  <div key={f}><label className={labelClass}>{f}</label><input value={profile.social[f]} onChange={e => updateProfileField('social', f, (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                ))}
              </div>
              <div><label className={labelClass}>Scholar Author ID</label><input value={profile.scholar_author_id} onChange={e => updateProfileField('scholar_author_id', null, (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
              <button onClick={saveProfile} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80">Save & Deploy</button>
            </>
          )}
        </div>
      )}

      {/* ---- Experience ---- */}
      {tab === 'experience' && (
        <div className="space-y-10">
          {!token ? <p className="text-sm text-amber-600">Set GitHub token in Settings first.</p> :
           !expLoaded ? <button onClick={loadExperience} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80">Load Experience Data</button> : (
            <>
              {(['education','work','projects'] as const).map(section => (
                <div key={section}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{section}</h3>
                    <button onClick={() => addExpEntry(section)} className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-200 dark:bg-gray-700 hover:opacity-80">+ Add</button>
                  </div>
                  {experience[section].length === 0 && <p className="text-sm text-gray-400">No entries yet.</p>}
                  {experience[section].map((entry, idx) => (
                    <div key={idx} className="mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3 relative">
                      <button onClick={() => removeExpEntry(section, idx)} className="absolute top-3 right-3 text-xs text-red-500 hover:underline">Remove</button>
                      {section === 'education' && (<>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div><label className={labelClass}>Institution (中文)</label><input value={entry.institution_zh || ''} onChange={e => updateExpEntry(section, idx, 'institution_zh', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div><label className={labelClass}>Institution (EN)</label><input value={entry.institution || ''} onChange={e => updateExpEntry(section, idx, 'institution', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div><label className={labelClass}>Degree (中文)</label><input value={entry.degree_zh || ''} onChange={e => updateExpEntry(section, idx, 'degree_zh', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div><label className={labelClass}>Degree (EN)</label><input value={entry.degree || ''} onChange={e => updateExpEntry(section, idx, 'degree', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                        </div>
                      </>)}
                      {section === 'work' && (<>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div><label className={labelClass}>Company (中文)</label><input value={entry.company_zh || ''} onChange={e => updateExpEntry(section, idx, 'company_zh', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div><label className={labelClass}>Company (EN)</label><input value={entry.company || ''} onChange={e => updateExpEntry(section, idx, 'company', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div><label className={labelClass}>Role (中文)</label><input value={entry.role_zh || ''} onChange={e => updateExpEntry(section, idx, 'role_zh', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div><label className={labelClass}>Role (EN)</label><input value={entry.role || ''} onChange={e => updateExpEntry(section, idx, 'role', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                        </div>
                      </>)}
                      {section === 'projects' && (<>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div><label className={labelClass}>Name (中文)</label><input value={entry.name_zh || ''} onChange={e => updateExpEntry(section, idx, 'name_zh', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div><label className={labelClass}>Name (EN)</label><input value={entry.name || ''} onChange={e => updateExpEntry(section, idx, 'name', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div><label className={labelClass}>URL</label><input value={entry.url || ''} onChange={e => updateExpEntry(section, idx, 'url', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div><label className={labelClass}>Image URL</label><input value={entry.image || ''} onChange={e => updateExpEntry(section, idx, 'image', (e.target as HTMLInputElement).value)} className={fieldClass} /></div>
                          <div className="sm:col-span-2"><label className={labelClass}>Tags (comma-separated)</label><input value={(entry.tags || []).join(', ')} onChange={e => updateExpEntry(section, idx, 'tags', (e.target as HTMLInputElement).value.split(',').map(t => t.trim()).filter(Boolean))} className={fieldClass} /></div>
                        </div>
                      </>)}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><label className={labelClass}>Start Date (YYYY-MM-DD)</label><input value={entry.start_date || ''} onChange={e => updateExpEntry(section, idx, 'start_date', (e.target as HTMLInputElement).value)} className={fieldClass} placeholder="2020-09" /></div>
                        <div><label className={labelClass}>End Date (empty = present)</label><input value={entry.end_date || ''} onChange={e => updateExpEntry(section, idx, 'end_date', (e.target as HTMLInputElement).value)} className={fieldClass} placeholder="2024-06" /></div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><label className={labelClass}>Description (中文)</label><textarea value={entry.description_zh || ''} onChange={e => updateExpEntry(section, idx, 'description_zh', (e.target as HTMLTextAreaElement).value)} rows={2} className={fieldClass} /></div>
                        <div><label className={labelClass}>Description (EN)</label><textarea value={entry.description || ''} onChange={e => updateExpEntry(section, idx, 'description', (e.target as HTMLTextAreaElement).value)} rows={2} className={fieldClass} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <button onClick={saveExperience} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80">Save & Deploy</button>
            </>
          )}
        </div>
      )}

      {/* ---- Blog ---- */}
      {tab === 'blog' && (
        <div className="space-y-6">
          {!token && <p className="text-sm text-amber-600">Set GitHub token in Settings before publishing.</p>}
          <div className="flex gap-2">
            <button onClick={() => setBlogMode('create')} className={`px-3 py-1.5 rounded text-xs font-medium ${blogMode === 'create' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800'}`}>New Post</button>
            <button onClick={() => setBlogMode('edit')} className={`px-3 py-1.5 rounded text-xs font-medium ${blogMode === 'edit' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800'}`}>Edit Existing</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Title</label><input value={blogPost.title} onChange={e => setBlogPost(p => ({ ...p, title: (e.target as HTMLInputElement).value }))} className={fieldClass} /></div>
            <div><label className={labelClass}>Slug</label><input value={blogPost.slug} onChange={e => setBlogPost(p => ({ ...p, slug: (e.target as HTMLInputElement).value }))} placeholder="my-post" className={fieldClass} /></div>
            <div><label className={labelClass}>Date</label><input type="date" value={blogPost.date} onChange={e => setBlogPost(p => ({ ...p, date: (e.target as HTMLInputElement).value }))} className={fieldClass} /></div>
            <div><label className={labelClass}>Language</label><select value={blogPost.lang} onChange={e => setBlogPost(p => ({ ...p, lang: (e.target as HTMLSelectElement).value as 'zh' | 'en' }))} className={fieldClass}><option value="zh">中文</option><option value="en">English</option></select></div>
            <div className="sm:col-span-2"><label className={labelClass}>Tags (comma-separated)</label><input value={blogPost.tags} onChange={e => setBlogPost(p => ({ ...p, tags: (e.target as HTMLInputElement).value }))} className={fieldClass} /></div>
            <div className="sm:col-span-2"><label className={labelClass}>Content (Markdown)</label><textarea value={blogPost.content} onChange={e => setBlogPost(p => ({ ...p, content: (e.target as HTMLTextAreaElement).value }))} rows={16} className={`${fieldClass} font-mono`} /></div>
          </div>
          <button onClick={saveBlogPost} disabled={!token} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80 disabled:opacity-40">Publish Post</button>
        </div>
      )}

      {/* ---- Settings ---- */}
      {tab === 'settings' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">GitHub Token</h3>
            <p className="text-xs text-gray-500 mb-3">Required for saving changes.{' '}<a href="https://github.com/settings/tokens/new?scopes=repo&description=Site%20Admin" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Create one →</a></p>
            <div className="flex gap-2">
              <input type="password" value={tokenInput} onChange={e => setTokenInput((e.target as HTMLInputElement).value)} placeholder={token ? 'Token is set' : 'ghp_...'} className={`flex-1 ${fieldClass}`} />
              <button onClick={saveTokenInput} disabled={!tokenInput} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80 disabled:opacity-40 text-sm">Save</button>
            </div>
            {token && <p className="text-xs text-green-600 mt-2">Token configured.</p>}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Change Password</h3>
            <div className="flex gap-2">
              <input type="password" value={newPassword} onChange={e => setNewPassword((e.target as HTMLInputElement).value)} placeholder="New password (min 4 chars)" className={`flex-1 ${fieldClass}`} />
              <button onClick={handleChangePassword} disabled={!newPassword || !token} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-80 disabled:opacity-40 text-sm">Update</button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-12 text-xs text-gray-400">After saving, rebuilds in 1-2 min.{' '}<a href="https://github.com/dekumylove/dekumylove.github.io/actions" target="_blank" rel="noopener" className="underline">View progress →</a></p>
    </div>
  );
}

async function getAnonymousFile(path: string): Promise<{ content: string; sha: string }> {
  const res = await fetch(`https://api.github.com/repos/dekumylove/dekumylove.github.io/contents/${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  let binary = atob(data.content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { content: new TextDecoder().decode(bytes), sha: data.sha };
}
