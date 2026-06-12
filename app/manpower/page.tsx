'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Worker = { id: string; project_id: string; worker_name: string; role: string; status: string; daily_rate: number; assigned_date: string }
type Registry = { id: string; name: string; role: string; location: string; phone: string; daily_rate: number; rating: number; availability: string; projects_done: number }
type Project = { id: string; name: string }

const ROLES = ['Electrician', 'Technician', 'Engineer', 'Supervisor', 'Labour', 'Plumber', 'Welder']
const STATUSES = ['active', 'idle', 'on-leave']
const AVAIL = ['available', 'on-project', 'unavailable']
const LOCATIONS = ['Hyderabad', 'Secunderabad', 'Warangal', 'Bihar', 'Other']

const statusBadge: Record<string, string> = { active: 'badge-green', idle: 'badge-yellow', 'on-leave': 'badge-red' }
const availBadge: Record<string, string> = { available: 'badge-green', 'on-project': 'badge-blue', unavailable: 'badge-gray' }

export default function ManpowerPage() {
  const [tab, setTab] = useState<'assigned' | 'registry'>('assigned')
  const [workers, setWorkers] = useState<Worker[]>([])
  const [registry, setRegistry] = useState<Registry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [wForm, setWForm] = useState({ project_id: '', worker_name: '', role: 'Technician', status: 'active', daily_rate: '', assigned_date: '' })
  const [rForm, setRForm] = useState({ name: '', role: 'Technician', location: 'Hyderabad', phone: '', daily_rate: '', rating: '5', availability: 'available', projects_done: '0' })

  async function load() {
    const [{ data: w }, { data: p }, { data: r }] = await Promise.all([
      supabase.from('manpower').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
      supabase.from('worker_registry').select('*').order('rating', { ascending: false }),
    ])
    setWorkers(w || [])
    setProjects(p || [])
    setRegistry(r || [])
    if (p && p.length > 0) setWForm(f => ({ ...f, project_id: p[0].id }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addWorker() {
    if (!wForm.worker_name || !wForm.project_id) return
    await supabase.from('manpower').insert([{ ...wForm, daily_rate: Number(wForm.daily_rate) }])
    setWForm(f => ({ ...f, worker_name: '', daily_rate: '', assigned_date: '' }))
    setShowForm(false); load()
  }

  async function addRegistry() {
    if (!rForm.name) return
    await supabase.from('worker_registry').insert([{ ...rForm, daily_rate: Number(rForm.daily_rate), rating: Number(rForm.rating), projects_done: Number(rForm.projects_done) }])
    setRForm({ name: '', role: 'Technician', location: 'Hyderabad', phone: '', daily_rate: '', rating: '5', availability: 'available', projects_done: '0' })
    setShowForm(false); load()
  }

  async function getAI() {
    setAiLoading(true); setAiSummary('')
    const res = await fetch('/api/ai-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'manpower', data: workers }) })
    const json = await res.json()
    setAiSummary(json.summary); setAiLoading(false)
  }

  const projectName = (id: string) => projects.find(p => p.id === id)?.name || '—'
  const active = workers.filter(w => w.status === 'active').length
  const idle = workers.filter(w => w.status === 'idle').length
  const dailyCost = workers.filter(w => w.status === 'active').reduce((s, w) => s + (w.daily_rate || 0), 0)
  const available = registry.filter(r => r.availability === 'available').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manpower</h1>
          <p className="page-subtitle">Site allocation and verified worker registry</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ai" onClick={getAI}>{aiLoading ? '...' : '✦ AI Summary'}</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add {tab === 'assigned' ? 'Worker' : 'to Registry'}</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card-stat">
          <div className="stat-label">On-Site</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{active}</div>
          <div className="stat-sub">active workers</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Idle</div>
          <div className="stat-value" style={{ color: idle > 0 ? 'var(--yellow)' : 'var(--text)' }}>{idle}</div>
          <div className="stat-sub">capacity available</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Daily Burn</div>
          <div className="stat-value">₹{dailyCost.toLocaleString()}</div>
          <div className="stat-sub">active workers only</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Registry</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{available}</div>
          <div className="stat-sub">workers available to hire</div>
        </div>
      </div>

      {aiSummary && (
        <div className="ai-box fade-in">
          <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>✦ AI ANALYSIS</div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{aiSummary}</div>
        </div>
      )}

      {showForm && (
        <div className="form-box fade-in">
          {tab === 'assigned' ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Assign Worker to Project</div>
              {projects.length === 0 ? <p style={{ color: 'var(--yellow)', fontSize: 13 }}>Add a project first.</p> : (
                <>
                  <div className="form-grid">
                    <input className="input" placeholder="Worker name" value={wForm.worker_name} onChange={e => setWForm({ ...wForm, worker_name: e.target.value })} />
                    <select className="input" value={wForm.project_id} onChange={e => setWForm({ ...wForm, project_id: e.target.value })}>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="input" value={wForm.role} onChange={e => setWForm({ ...wForm, role: e.target.value })}>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <select className="input" value={wForm.status} onChange={e => setWForm({ ...wForm, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <input type="number" className="input" placeholder="Daily rate (₹)" value={wForm.daily_rate} onChange={e => setWForm({ ...wForm, daily_rate: e.target.value })} />
                    <input type="date" className="input" value={wForm.assigned_date} onChange={e => setWForm({ ...wForm, assigned_date: e.target.value })} />
                  </div>
                  <div className="form-actions">
                    <button className="btn-primary" onClick={addWorker}>Assign Worker</button>
                    <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Add to Worker Registry</div>
              <div className="form-grid">
                <input className="input" placeholder="Full name" value={rForm.name} onChange={e => setRForm({ ...rForm, name: e.target.value })} />
                <input className="input" placeholder="Phone number" value={rForm.phone} onChange={e => setRForm({ ...rForm, phone: e.target.value })} />
                <select className="input" value={rForm.role} onChange={e => setRForm({ ...rForm, role: e.target.value })}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
                <select className="input" value={rForm.location} onChange={e => setRForm({ ...rForm, location: e.target.value })}>
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
                <input type="number" className="input" placeholder="Daily rate (₹)" value={rForm.daily_rate} onChange={e => setRForm({ ...rForm, daily_rate: e.target.value })} />
                <select className="input" value={rForm.availability} onChange={e => setRForm({ ...rForm, availability: e.target.value })}>
                  {AVAIL.map(a => <option key={a}>{a}</option>)}
                </select>
                <input type="number" className="input" placeholder="Rating (1–5)" min="1" max="5" value={rForm.rating} onChange={e => setRForm({ ...rForm, rating: e.target.value })} />
                <input type="number" className="input" placeholder="Projects completed" value={rForm.projects_done} onChange={e => setRForm({ ...rForm, projects_done: e.target.value })} />
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={addRegistry}>Add to Registry</button>
                <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'assigned' ? 'active' : ''}`} onClick={() => { setTab('assigned'); setShowForm(false) }}>
          Assigned ({workers.length})
        </button>
        <button className={`tab ${tab === 'registry' ? 'active' : ''}`} onClick={() => { setTab('registry'); setShowForm(false) }}>
          Registry ({registry.length})
        </button>
      </div>

      <div className="card">
        {tab === 'assigned' ? (
          <table>
            <thead>
              <tr><th>Name</th><th>Role</th><th>Project</th><th>Status</th><th>Daily Rate</th><th>Since</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="empty-state">Loading...</td></tr>
                : workers.length === 0 ? <tr><td colSpan={6} className="empty-state">No workers assigned yet</td></tr>
                : workers.map(w => (
                  <tr key={w.id}>
                    <td>{w.worker_name}</td>
                    <td>{w.role}</td>
                    <td>{projectName(w.project_id)}</td>
                    <td><span className={`badge ${statusBadge[w.status]}`}>{w.status}</span></td>
                    <td>₹{w.daily_rate?.toLocaleString() || '—'}</td>
                    <td>{w.assigned_date || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Role</th><th>Location</th><th>Rating</th><th>Daily Rate</th><th>Projects</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="empty-state">Loading...</td></tr>
                : registry.length === 0 ? <tr><td colSpan={7} className="empty-state">No workers in registry — build your talent pool</td></tr>
                : registry.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div>{r.name}</div>
                      {r.phone && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{r.phone}</div>}
                    </td>
                    <td>{r.role}</td>
                    <td>{r.location}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(i => (
                          <span key={i} style={{ color: i <= r.rating ? 'var(--yellow)' : 'var(--bg-3)', fontSize: 12 }}>★</span>
                        ))}
                      </div>
                    </td>
                    <td>₹{r.daily_rate?.toLocaleString() || '—'}</td>
                    <td>{r.projects_done}</td>
                    <td><span className={`badge ${availBadge[r.availability]}`}>{r.availability}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
