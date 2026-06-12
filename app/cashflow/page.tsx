'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Entry = { id: string; project_id: string; type: 'inflow' | 'outflow'; amount: number; description: string; date: string; due_date?: string; paid?: boolean; client_phone?: string }
type Project = { id: string; name: string }

function daysDiff(d: string) {
  return Math.floor((new Date().getTime() - new Date(d).getTime()) / 86400000)
}

export default function CashflowPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'all' | 'overdue'>('all')
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({ project_id: '', type: 'inflow', amount: '', description: '', date: '', due_date: '', paid: false, client_phone: '' })

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
    setShowForm(false); load()
  }

  async function togglePaid(id: string, current: boolean) {
    await supabase.from('cashflow').update({ paid: !current }).eq('id', id); load()
  }

  async function getAI() {
    setAiLoading(true); setAiSummary('')
    const res = await fetch('/api/ai-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'cashflow', data: entries }) })
    const json = await res.json()
    setAiSummary(json.summary); setAiLoading(false)
  }

  const pName = (id: string) => projects.find(p => p.id === id)?.name || '—'
  const inflow = entries.filter(e => e.type === 'inflow').reduce((s, e) => s + e.amount, 0)
  const outflow = entries.filter(e => e.type === 'outflow').reduce((s, e) => s + e.amount, 0)
  const net = inflow - outflow
  const overdue = entries.filter(e => e.type === 'inflow' && !e.paid && e.due_date && daysDiff(e.due_date) > 0)
  const overdueAmt = overdue.reduce((s, e) => s + e.amount, 0)
  const display = tab === 'overdue' ? overdue : entries

  const waBtn = (e: Entry) => {
    const msg = encodeURIComponent(`Dear Client,\n\nReminder from Inbiso regarding project "${pName(e.project_id)}".\n\nPayment of ₹${e.amount?.toLocaleString()} is due${e.due_date ? ` since ${e.due_date}` : ''}.\n\n${e.description || ''}\n\nKindly process at your earliest convenience.\n\nThank you,\nInbiso Fire Safety Systems`)
    const ph = e.client_phone?.replace(/\D/g, '') || ''
    return ph ? `https://wa.me/91${ph}?text=${msg}` : `https://wa.me/?text=${msg}`
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cashflow</h1>
          <p className="page-subtitle">Payments, advances, expenses and overdue tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ai" onClick={getAI}>{aiLoading ? '...' : '✦ AI Summary'}</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Entry</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card-stat">
          <div className="stat-label">Total Inflow</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>₹{(inflow / 100000).toFixed(1)}L</div>
          <div className="stat-sub">advances + payments</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Total Outflow</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>₹{(outflow / 100000).toFixed(1)}L</div>
          <div className="stat-sub">materials + labour</div>
        </div>
        <div className="card-stat" style={{ background: net >= 0 ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', borderColor: net >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
          <div className="stat-label">Net Position</div>
          <div className="stat-value" style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{net >= 0 ? '+' : ''}₹{(net / 100000).toFixed(1)}L</div>
          <div className="stat-sub">{net >= 0 ? 'surplus' : 'deficit — attention needed'}</div>
        </div>
        <div className="card-stat" style={{ background: overdue.length > 0 ? 'rgba(239,68,68,0.05)' : undefined, borderColor: overdue.length > 0 ? 'rgba(239,68,68,0.15)' : undefined }}>
          <div className="stat-label">Overdue</div>
          <div className="stat-value" style={{ color: overdue.length > 0 ? 'var(--red)' : 'var(--text)' }}>{overdue.length}</div>
          <div className="stat-sub">₹{(overdueAmt / 100000).toFixed(1)}L uncollected</div>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="alert-banner alert-red fade-in">
          <div>
            <div style={{ color: 'var(--red)', fontWeight: 600, fontSize: 13 }}>⚠ {overdue.length} overdue payment{overdue.length > 1 ? 's' : ''} — ₹{(overdueAmt / 100000).toFixed(1)}L uncollected</div>
            <div style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 3 }}>Use the WhatsApp remind button to follow up in one click</div>
          </div>
          <button className="btn-secondary" onClick={() => setTab('overdue')} style={{ flexShrink: 0 }}>View Overdue</button>
        </div>
      )}

      {aiSummary && (
        <div className="ai-box fade-in">
          <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>✦ AI ANALYSIS</div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{aiSummary}</div>
        </div>
      )}

      {showForm && (
        <div className="form-box fade-in">
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Add Cashflow Entry</div>
          {projects.length === 0 ? <p style={{ color: 'var(--yellow)', fontSize: 13 }}>Add a project first.</p> : (
            <>
              <div className="form-grid">
                <select className="input" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="inflow">Inflow — payment received</option>
                  <option value="outflow">Outflow — expense</option>
                </select>
                <input type="number" className="input" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                {form.type === 'inflow' && <>
                  <input type="date" className="input" placeholder="Due date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                  <input className="input" placeholder="Client phone (WhatsApp)" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} />
                </>}
                <input className="input" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ gridColumn: '1 / -1' }} />
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={addEntry}>Save Entry</button>
                <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All ({entries.length})</button>
        <button className={`tab ${tab === 'overdue' ? 'active' : ''}`} onClick={() => setTab('overdue')}>
          Overdue {overdue.length > 0 && <span style={{ background: 'var(--red)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, marginLeft: 6 }}>{overdue.length}</span>}
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Date</th><th>Project</th><th>Type</th><th>Description</th><th>Due</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="empty-state">Loading...</td></tr>
              : display.length === 0 ? <tr><td colSpan={8} className="empty-state">{tab === 'overdue' ? 'No overdue payments' : 'No entries yet'}</td></tr>
              : display.map(e => {
                const isOverdue = e.type === 'inflow' && !e.paid && e.due_date && daysDiff(e.due_date) > 0
                const dOver = e.due_date ? daysDiff(e.due_date) : 0
                return (
                  <tr key={e.id} style={{ background: isOverdue ? 'rgba(239,68,68,0.03)' : undefined }}>
                    <td>{e.date || '—'}</td>
                    <td>{pName(e.project_id)}</td>
                    <td><span className={`badge ${e.type === 'inflow' ? 'badge-green' : 'badge-red'}`}>{e.type}</span></td>
                    <td>{e.description || '—'}</td>
                    <td style={{ color: isOverdue ? 'var(--red)' : 'var(--text-2)' }}>
                      {e.due_date || '—'}{isOverdue && ` (${dOver}d)`}
                    </td>
                    <td>
                      {e.type === 'inflow' ? (
                        <button
                          className="paid-toggle"
                          onClick={() => togglePaid(e.id, !!e.paid)}
                          style={{ background: e.paid ? 'var(--green-bg)' : 'var(--yellow-bg)', color: e.paid ? 'var(--green)' : 'var(--yellow)' }}
                        >{e.paid ? '✓ Paid' : 'Pending'}</button>
                      ) : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right', color: e.type === 'inflow' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {e.type === 'inflow' ? '+' : '-'}₹{e.amount?.toLocaleString()}
                    </td>
                    <td>
                      {e.type === 'inflow' && !e.paid && (
                        <a href={waBtn(e)} target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Remind
                        </a>
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
