'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Referral = { id: string; referred_by: string; referred_company: string; contact_name: string; phone: string; status: string; project_value: number; notes: string; created_at: string }

const STATUSES = ['lead', 'contacted', 'proposal-sent', 'won', 'lost']
const statusBadge: Record<string, string> = { lead: 'badge-gray', contacted: 'badge-blue', 'proposal-sent': 'badge-purple', won: 'badge-green', lost: 'badge-red' }

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ referred_by: '', referred_company: '', contact_name: '', phone: '', status: 'lead', project_value: '', notes: '' })

  async function load() {
    const { data } = await supabase.from('referrals').select('*').order('created_at', { ascending: false })
    setReferrals(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addReferral() {
    if (!form.referred_company) return
    await supabase.from('referrals').insert([{ ...form, project_value: Number(form.project_value) }])
    setForm({ referred_by: '', referred_company: '', contact_name: '', phone: '', status: 'lead', project_value: '', notes: '' })
    setShowForm(false); load()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('referrals').update({ status }).eq('id', id)
    load()
  }

  const won = referrals.filter(r => r.status === 'won')
  const pipeline = referrals.filter(r => !['won', 'lost'].includes(r.status))
  const totalWonValue = won.reduce((s, r) => s + (r.project_value || 0), 0)
  const pipelineValue = pipeline.reduce((s, r) => s + (r.project_value || 0), 0)

  const whatsappReferral = (r: Referral) => {
    const msg = encodeURIComponent(`Hi ${r.contact_name || r.referred_company},\n\nI'm reaching out from Inbiso Fire Safety Systems, Hyderabad. We were referred to you by ${r.referred_by}.\n\nWe specialize in fire safety system installation for industrial and commercial buildings. Would love to connect about your requirements.\n\nRegards,\nInbiso Team`)
    return `https://wa.me/91${r.phone?.replace(/\D/g, '')}?text=${msg}`
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Referrals</h1>
          <p className="page-subtitle">Track word-of-mouth leads and referral pipeline</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Referral</button>
      </div>

      <div className="stats-grid">
        <div className="card-stat">
          <div className="stat-label">Total Leads</div>
          <div className="stat-value">{referrals.length}</div>
          <div className="stat-sub">{pipeline.length} in pipeline</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Won</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{won.length}</div>
          <div className="stat-sub">converted to projects</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Won Value</div>
          <div className="stat-value">₹{(totalWonValue / 100000).toFixed(1)}L</div>
          <div className="stat-sub">from referrals</div>
        </div>
        <div className="card-stat">
          <div className="stat-label">Pipeline Value</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>₹{(pipelineValue / 100000).toFixed(1)}L</div>
          <div className="stat-sub">potential revenue</div>
        </div>
      </div>

      {showForm && (
        <div className="form-box fade-in">
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>New Referral Lead</div>
          <div className="form-grid">
            <input className="input" placeholder="Referred by (person/company)" value={form.referred_by} onChange={e => setForm({ ...form, referred_by: e.target.value })} />
            <input className="input" placeholder="Lead company name" value={form.referred_company} onChange={e => setForm({ ...form, referred_company: e.target.value })} />
            <input className="input" placeholder="Contact person name" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
            <input className="input" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="number" className="input" placeholder="Estimated project value (₹)" value={form.project_value} onChange={e => setForm({ ...form, project_value: e.target.value })} />
            <input className="input" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ gridColumn: '1 / -1' }} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={addReferral}>Save Lead</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr><th>Company</th><th>Referred By</th><th>Contact</th><th>Status</th><th>Value</th><th>Notes</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="empty-state">Loading...</td></tr>
              : referrals.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">
                  No referrals yet — every project Inbiso delivers is a future referral
                </td></tr>
              ) : referrals.map(r => (
                <tr key={r.id}>
                  <td>
                    <div>{r.referred_company}</div>
                    {r.contact_name && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{r.contact_name}</div>}
                  </td>
                  <td>{r.referred_by || '—'}</td>
                  <td>{r.phone || '—'}</td>
                  <td>
                    <select
                      value={r.status}
                      onChange={e => updateStatus(r.id, e.target.value)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: 13 }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className={`badge ${statusBadge[r.status]}`} style={{ marginLeft: 6 }}>{r.status}</span>
                  </td>
                  <td>{r.project_value ? `₹${(r.project_value / 100000).toFixed(1)}L` : '—'}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</td>
                  <td>
                    {r.phone && r.status !== 'won' && r.status !== 'lost' && (
                      <a href={whatsappReferral(r)} target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Reach Out
                      </a>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
