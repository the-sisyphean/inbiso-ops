'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Project = {
  id: string; name: string; client: string; status: string
  phase: string; start_date: string; end_date: string; budget: number
}

const PHASES = ['Tendering', 'Kickoff', 'Procurement', 'Installation', 'Testing', 'Warranty']
const STATUSES = ['active', 'delayed', 'completed']

const phaseBadge: Record<string, string> = {
  Tendering: 'badge-purple', Kickoff: 'badge-blue', Procurement: 'badge-yellow',
  Installation: 'badge-yellow', Testing: 'badge-green', Warranty: 'badge-gray',
}
const statusBadge: Record<string, string> = {
  active: 'badge-green', delayed: 'badge-red', completed: 'badge-gray',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({ name: '', client: '', phase: 'Kickoff', status: 'active', start_date: '', end_date: '', budget: '' })

  async function load() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addProject() {
    if (!form.name || !form.client) return
    await supabase.from('projects').insert([{ ...form, budget: Number(form.budget) }])
    setForm({ name: '', client: '', phase: 'Kickoff', status: 'active', start_date: '', end_date: '', budget: '' })
    setShowForm(false)
    load()
  }

  async function getAI() {
    setAiLoading(true); setAiSummary('')
    const res = await fetch('/api/ai-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'projects', data: projects }) })
    const json = await res.json()
    setAiSummary(json.summary); setAiLoading(false)
  }

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const delayed = projects.filter(p => p.status === 'delayed').length
  const active = projects.filter(p => p.status === 'active').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Track every fire safety installation from bid to warranty</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ai" onClick={getAI}>{aiLoading ? '...' : '✦ AI Summary'}</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ New Project</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card-stat">
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-sub" style={{ color: 'var(--green)' }}>{active} active</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Delayed</div>
          <div className="stat-value" style={{ color: delayed > 0 ? 'var(--red)' : 'var(--text)' }}>{delayed}</div>
          <div className="stat-sub">need attention</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Total Budget</div>
          <div className="stat-value">₹{(totalBudget / 100000).toFixed(1)}L</div>
          <div className="stat-sub">across all projects</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{projects.filter(p => p.status === 'completed').length}</div>
          <div className="stat-sub">delivered</div>
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
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>New Project</div>
          <div className="form-grid">
            <input className="input" placeholder="Project name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Client name" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
            <select className="input" value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
              {PHASES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="date" className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            <input type="date" className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            <input type="number" className="input" placeholder="Budget (₹)" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={addProject}>Save Project</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Project</th><th>Client</th><th>Phase</th><th>Status</th><th>Budget</th><th>Start</th><th>End</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="empty-state">Loading...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">No projects yet — add your first one above</td></tr>
            ) : projects.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.client}</td>
                <td><span className={`badge ${phaseBadge[p.phase] || 'badge-gray'}`}>{p.phase}</span></td>
                <td><span className={`badge ${statusBadge[p.status]}`}>{p.status}</span></td>
                <td>₹{p.budget ? (p.budget / 100000).toFixed(1) + 'L' : '—'}</td>
                <td>{p.start_date || '—'}</td>
                <td>{p.end_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
