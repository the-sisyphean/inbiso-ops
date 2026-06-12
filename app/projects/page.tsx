'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Project = {
  id: string
  name: string
  client: string
  status: string
  phase: string
  start_date: string
  end_date: string
  budget: number
}

const PHASES = ['Tendering', 'Kickoff', 'Procurement', 'Installation', 'Testing', 'Warranty']
const STATUSES = ['active', 'delayed', 'completed']

const statusColor: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  delayed: 'bg-red-500/20 text-red-400',
  completed: 'bg-gray-500/20 text-gray-400',
}

const phaseColor: Record<string, string> = {
  Tendering: 'bg-purple-500/20 text-purple-400',
  Kickoff: 'bg-blue-500/20 text-blue-400',
  Procurement: 'bg-yellow-500/20 text-yellow-400',
  Installation: 'bg-orange-500/20 text-orange-400',
  Testing: 'bg-cyan-500/20 text-cyan-400',
  Warranty: 'bg-gray-500/20 text-gray-400',
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

  async function getAISummary() {
    setAiLoading(true)
    setAiSummary('')
    const res = await fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'projects', data: projects }),
    })
    const json = await res.json()
    setAiSummary(json.summary)
    setAiLoading(false)
  }

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const delayed = projects.filter(p => p.status === 'delayed').length
  const active = projects.filter(p => p.status === 'active').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">Track all fire safety system projects</p>
        </div>
        <div className="flex gap-3">
          <button onClick={getAISummary} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            {aiLoading ? '...' : '✦ AI Summary'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors">
            + Add Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Projects</p>
          <p className="text-3xl font-bold mt-1">{projects.length}</p>
          <p className="text-xs text-green-400 mt-1">{active} active</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Delayed</p>
          <p className="text-3xl font-bold mt-1 text-red-400">{delayed}</p>
          <p className="text-xs text-gray-500 mt-1">needs attention</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Budget</p>
          <p className="text-3xl font-bold mt-1">₹{(totalBudget / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-500 mt-1">across all projects</p>
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
          <h3 className="font-medium mb-4">New Project</h3>
          <div className="grid grid-cols-2 gap-4">
            <input className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Project name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Client name" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
            <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
              {PHASES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="date" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            <input type="date" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            <input type="number" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Budget (₹)" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={addProject} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium">Save Project</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-4">Project</th>
              <th className="text-left px-6 py-4">Client</th>
              <th className="text-left px-6 py-4">Phase</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="text-left px-6 py-4">Budget</th>
              <th className="text-left px-6 py-4">Start Date</th>
              <th className="text-left px-6 py-4">End Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">No projects yet. Add your first project.</td></tr>
            ) : projects.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4 text-gray-400">{p.client}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-xs font-medium ${phaseColor[p.phase] || 'bg-gray-700 text-gray-300'}`}>{p.phase}</span></td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${statusColor[p.status]}`}>{p.status}</span></td>
                <td className="px-6 py-4 text-gray-300">₹{p.budget ? (p.budget / 100000).toFixed(1) + 'L' : '—'}</td>
                <td className="px-6 py-4 text-gray-400">{p.start_date || '—'}</td>
                <td className="px-6 py-4 text-gray-400">{p.end_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
