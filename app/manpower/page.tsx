'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Worker = {
  id: string
  project_id: string
  worker_name: string
  role: string
  status: string
  daily_rate: number
  assigned_date: string
}

type Project = { id: string; name: string }

const ROLES = ['Electrician', 'Technician', 'Engineer', 'Supervisor', 'Labour', 'Plumber']
const STATUSES = ['active', 'idle', 'on-leave']

const statusColor: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  idle: 'bg-yellow-500/20 text-yellow-400',
  'on-leave': 'bg-red-500/20 text-red-400',
}

export default function ManpowerPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({ project_id: '', worker_name: '', role: 'Technician', status: 'active', daily_rate: '', assigned_date: '' })

  async function load() {
    const [{ data: w }, { data: p }] = await Promise.all([
      supabase.from('manpower').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ])
    setWorkers(w || [])
    setProjects(p || [])
    if (p && p.length > 0) setForm(f => ({ ...f, project_id: p[0].id }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addWorker() {
    if (!form.worker_name || !form.project_id) return
    await supabase.from('manpower').insert([{ ...form, daily_rate: Number(form.daily_rate) }])
    setForm(f => ({ ...f, worker_name: '', daily_rate: '', assigned_date: '' }))
    setShowForm(false)
    load()
  }

  async function getAISummary() {
    setAiLoading(true)
    setAiSummary('')
    const res = await fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'manpower', data: workers }),
    })
    const json = await res.json()
    setAiSummary(json.summary)
    setAiLoading(false)
  }

  const projectName = (id: string) => projects.find(p => p.id === id)?.name || '—'
  const active = workers.filter(w => w.status === 'active').length
  const idle = workers.filter(w => w.status === 'idle').length
  const totalDailyCost = workers.filter(w => w.status === 'active').reduce((s, w) => s + (w.daily_rate || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Manpower</h1>
          <p className="text-gray-400 text-sm mt-1">Track workers and site allocation</p>
        </div>
        <div className="flex gap-3">
          <button onClick={getAISummary} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
            {aiLoading ? '...' : '✦ AI Summary'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors">
            + Add Worker
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Workers</p>
          <p className="text-3xl font-bold mt-1">{workers.length}</p>
          <p className="text-xs text-green-400 mt-1">{active} on-site</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Idle / Unassigned</p>
          <p className="text-3xl font-bold mt-1 text-yellow-400">{idle}</p>
          <p className="text-xs text-gray-500 mt-1">capacity available</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Daily Labour Cost</p>
          <p className="text-3xl font-bold mt-1">₹{totalDailyCost.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">active workers only</p>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="mb-6 bg-purple-950/50 border border-purple-800/50 rounded-xl p-5">
          <p className="text-xs text-purple-400 font-medium mb-2">✦ AI ANALYSIS</p>
          <p className="text-sm text-gray-200 leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="mb-6 bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="font-medium mb-4">Add Worker</h3>
          {projects.length === 0 ? (
            <p className="text-sm text-yellow-400">Add a project first before assigning workers.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Worker name" value={form.worker_name} onChange={e => setForm({ ...form, worker_name: e.target.value })} />
                <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
                <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <input type="number" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Daily rate (₹)" value={form.daily_rate} onChange={e => setForm({ ...form, daily_rate: e.target.value })} />
                <input type="date" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.assigned_date} onChange={e => setForm({ ...form, assigned_date: e.target.value })} />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={addWorker} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium">Save Worker</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-4">Name</th>
              <th className="text-left px-6 py-4">Role</th>
              <th className="text-left px-6 py-4">Project</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="text-left px-6 py-4">Daily Rate</th>
              <th className="text-left px-6 py-4">Since</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td></tr>
            ) : workers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">No workers yet.</td></tr>
            ) : workers.map(w => (
              <tr key={w.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-medium">{w.worker_name}</td>
                <td className="px-6 py-4 text-gray-400">{w.role}</td>
                <td className="px-6 py-4 text-gray-400">{projectName(w.project_id)}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${statusColor[w.status]}`}>{w.status}</span></td>
                <td className="px-6 py-4 text-gray-300">₹{w.daily_rate?.toLocaleString() || '—'}</td>
                <td className="px-6 py-4 text-gray-400">{w.assigned_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
