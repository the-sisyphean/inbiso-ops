'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Entry = {
  id: string
  project_id: string
  type: 'inflow' | 'outflow'
  amount: number
  description: string
  date: string
  due_date?: string
  paid?: boolean
  client_phone?: string
}

type Project = { id: string; name: string }

function daysDiff(dateStr: string) {
  const today = new Date()
  const due = new Date(dateStr)
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function WhatsAppButton({ entry, projectName }: { entry: Entry; projectName: string }) {
  const message = encodeURIComponent(
    `Dear Client,\n\nThis is a reminder from Inbiso regarding project "${projectName}".\n\nPayment of ₹${entry.amount?.toLocaleString()} is due${entry.due_date ? ` since ${entry.due_date}` : ''}.\n\nDescription: ${entry.description || 'Project payment'}\n\nKindly process at your earliest convenience.\n\nThank you,\nInbiso Fire Safety Systems`
  )
  const phone = entry.client_phone?.replace(/\D/g, '') || ''
  const url = phone
    ? `https://wa.me/91${phone}?text=${message}`
    : `https://wa.me/?text=${message}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium text-white transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      Remind
    </a>
  )
}

export default function CashflowPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'overdue'>('all')
  const [form, setForm] = useState({
    project_id: '', type: 'inflow', amount: '', description: '',
    date: '', due_date: '', paid: false, client_phone: ''
  })

  async function load() {
    const [{ data: e }, { data: p }] = await Promise.all([
      supabase.from('cashflow').select('*').order('date', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ])
    setEntries(e || [])
    setProjects(p || [])
    if (p && p.length > 0) setForm(f => ({ ...f, project_id: p[0].id }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addEntry() {
    if (!form.amount || !form.project_id) return
    await supabase.from('cashflow').insert([{ ...form, amount: Number(form.amount) }])
    setForm(f => ({ ...f, amount: '', description: '', date: '', due_date: '', client_phone: '', paid: false }))
    setShowForm(false)
    load()
  }

  async function togglePaid(id: string, current: boolean) {
    await supabase.from('cashflow').update({ paid: !current }).eq('id', id)
    load()
  }

  async function getAISummary() {
    setAiLoading(true)
    setAiSummary('')
    const res = await fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cashflow', data: entries }),
    })
    const json = await res.json()
    setAiSummary(json.summary)
    setAiLoading(false)
  }

  const projectName = (id: string) => projects.find(p => p.id === id)?.name || '—'
  const totalInflow = entries.filter(e => e.type === 'inflow').reduce((s, e) => s + e.amount, 0)
  const totalOutflow = entries.filter(e => e.type === 'outflow').reduce((s, e) => s + e.amount, 0)
  const netCashflow = totalInflow - totalOutflow

  const overdueEntries = entries.filter(e =>
    e.type === 'inflow' && !e.paid && e.due_date && daysDiff(e.due_date) > 0
  )
  const overdueAmount = overdueEntries.reduce((s, e) => s + e.amount, 0)

  const displayEntries = activeTab === 'overdue' ? overdueEntries : entries

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Cashflow</h1>
          <p className="text-gray-400 text-sm mt-1">Track payments, advances, and expenses</p>
        </div>
        <div className="flex gap-3">
          <button onClick={getAISummary} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
            {aiLoading ? '...' : '✦ AI Summary'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors">
            + Add Entry
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Inflow</p>
          <p className="text-3xl font-bold mt-1 text-green-400">₹{(totalInflow / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-500 mt-1">advances + payments</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Outflow</p>
          <p className="text-3xl font-bold mt-1 text-red-400">₹{(totalOutflow / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-500 mt-1">materials + labour</p>
        </div>
        <div className={`border rounded-xl p-5 ${netCashflow >= 0 ? 'bg-green-950/30 border-green-800/40' : 'bg-red-950/30 border-red-800/40'}`}>
          <p className="text-gray-400 text-sm">Net Position</p>
          <p className={`text-3xl font-bold mt-1 ${netCashflow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netCashflow >= 0 ? '+' : ''}₹{(netCashflow / 100000).toFixed(1)}L
          </p>
          <p className="text-xs text-gray-500 mt-1">{netCashflow >= 0 ? 'surplus' : 'deficit'}</p>
        </div>
        <div className={`border rounded-xl p-5 ${overdueEntries.length > 0 ? 'bg-red-950/30 border-red-800/40' : 'bg-gray-900 border-gray-800'}`}>
          <p className="text-gray-400 text-sm">Overdue Payments</p>
          <p className={`text-3xl font-bold mt-1 ${overdueEntries.length > 0 ? 'text-red-400' : 'text-white'}`}>{overdueEntries.length}</p>
          <p className="text-xs text-gray-500 mt-1">₹{(overdueAmount / 100000).toFixed(1)}L pending</p>
        </div>
      </div>

      {/* Overdue alert banner */}
      {overdueEntries.length > 0 && (
        <div className="mb-6 bg-red-950/40 border border-red-800/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-red-400 font-medium text-sm">⚠ {overdueEntries.length} overdue payment{overdueEntries.length > 1 ? 's' : ''} — ₹{(overdueAmount / 100000).toFixed(1)}L uncollected</p>
            <p className="text-gray-400 text-xs mt-1">Use the WhatsApp remind button to follow up instantly</p>
          </div>
          <button onClick={() => setActiveTab('overdue')} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium">
            View Overdue
          </button>
        </div>
      )}

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
          <h3 className="font-medium mb-4">Add Cashflow Entry</h3>
          {projects.length === 0 ? (
            <p className="text-sm text-yellow-400">Add a project first.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="inflow">Inflow (payment received)</option>
                  <option value="outflow">Outflow (expense)</option>
                </select>
                <input type="number" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                <input type="date" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Transaction date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                {form.type === 'inflow' && (
                  <>
                    <input type="date" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Payment due date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                    <input className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Client phone (for WhatsApp)" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} />
                  </>
                )}
                <input className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm col-span-2" placeholder="Description (e.g. 20% advance from ABC Corp)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={addEntry} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium">Save Entry</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
          All Entries ({entries.length})
        </button>
        <button onClick={() => setActiveTab('overdue')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'overdue' ? 'bg-red-900/50 text-red-300' : 'text-gray-400 hover:text-white'}`}>
          Overdue
          {overdueEntries.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{overdueEntries.length}</span>}
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-4">Date</th>
              <th className="text-left px-6 py-4">Project</th>
              <th className="text-left px-6 py-4">Type</th>
              <th className="text-left px-6 py-4">Description</th>
              <th className="text-left px-6 py-4">Due Date</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="text-right px-6 py-4">Amount</th>
              <th className="text-left px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-500">Loading...</td></tr>
            ) : displayEntries.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-500">{activeTab === 'overdue' ? 'No overdue payments.' : 'No entries yet.'}</td></tr>
            ) : displayEntries.map(e => {
              const isOverdue = e.type === 'inflow' && !e.paid && e.due_date && daysDiff(e.due_date) > 0
              const daysOver = e.due_date ? daysDiff(e.due_date) : 0
              return (
                <tr key={e.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${isOverdue ? 'bg-red-950/10' : ''}`}>
                  <td className="px-6 py-4 text-gray-400">{e.date || '—'}</td>
                  <td className="px-6 py-4 text-gray-300">{projectName(e.project_id)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${e.type === 'inflow' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{e.description || '—'}</td>
                  <td className="px-6 py-4">
                    {e.due_date ? (
                      <span className={isOverdue ? 'text-red-400 font-medium' : 'text-gray-400'}>
                        {e.due_date} {isOverdue && `(${daysOver}d overdue)`}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {e.type === 'inflow' ? (
                      <button onClick={() => togglePaid(e.id, !!e.paid)} className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${e.paid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400 hover:bg-green-500/20 hover:text-green-400'}`}>
                        {e.paid ? '✓ Paid' : 'Pending'}
                      </button>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${e.type === 'inflow' ? 'text-green-400' : 'text-red-400'}`}>
                    {e.type === 'inflow' ? '+' : '-'}₹{e.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {e.type === 'inflow' && !e.paid && (
                      <WhatsAppButton entry={e} projectName={projectName(e.project_id)} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
