import { useState, useEffect } from 'react'
import axios from 'axios'
import Loading from './components/Loading'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const API = 'http://127.0.0.1:8080/api/v1'

const COLORS = {
  new: '#4361ee',
  contacted: '#f77f00',
  qualified: '#2dc653',
  lost: '#ef233c'
}

export default function Dashboard() {
  const [contacts, setContacts] = useState([])
  const [leads, setLeads] = useState([])
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [contactsRes, leadsRes, scoresRes] = await Promise.all([
        axios.get(`${API}/contacts`),
        axios.get(`${API}/leads`),
        axios.get(`${API}/leads/score/all`)
      ])
      setContacts(contactsRes.data)
      setLeads(leadsRes.data)
      setScores(scoresRes.data)
    } catch (err) {
      console.error(err)
      setError(true)
    }
    setLoading(false)
  }

  // Pipeline breakdown data
  const pipelineData = ['new', 'contacted', 'qualified', 'lost'].map(stage => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: leads.filter(l => l.status === stage).length,
    value: leads.filter(l => l.status === stage).reduce((sum, l) => sum + (l.value_estimate || 0), 0)
  }))

  // Pie chart data
  const pieData = pipelineData.filter(d => d.count > 0).map(d => ({
    name: d.stage,
    value: d.count
  }))

  // Score distribution
  const scoreData = [
    { range: '0-25', count: scores.filter(s => s.score <= 25).length },
    { range: '26-50', count: scores.filter(s => s.score > 25 && s.score <= 50).length },
    { range: '51-75', count: scores.filter(s => s.score > 50 && s.score <= 75).length },
    { range: '76-100', count: scores.filter(s => s.score > 75).length },
  ]

  // Key metrics
  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.value_estimate || 0), 0)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0
  const highPriorityLeads = scores.filter(s => s.priority === 'high').length
  const conversionRate = leads.length > 0 ? Math.round((leads.filter(l => l.status === 'qualified').length / leads.length) * 100) : 0

  if (loading) return <Loading message="Loading Dashboard..." onRetry={fetchAll} />
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', 
      justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ color: '#ef233c', fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>
          Could not connect to server
        </div>
        <div style={{ color: '#888', marginBottom: '24px' }}>
          Make sure the backend is running on port 8080.
        </div>
        <button onClick={() => { setError(false); setLoading(true); fetchAll(); }}
          style={{ padding: '10px 24px', background: '#4361ee', color: 'white', 
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Try Again
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}>Performance Dashboard</h2>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Contacts', value: contacts.length, color: '#4361ee' },
          { label: 'Pipeline Value', value: `$${totalPipelineValue.toLocaleString()}`, color: '#2dc653' },
          { label: 'Avg Lead Score', value: `${avgScore}/100`, color: '#f77f00' },
          { label: 'High Priority Leads', value: highPriorityLeads, color: '#ef233c' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: `4px solid ${kpi.color}` }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>{kpi.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Pipeline by Stage */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Leads by Stage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4361ee" radius={[4, 4, 0, 0]}>
                {pipelineData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[entry.stage.toLowerCase()]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Distribution Pie */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Pipeline Distribution</h3>
          {pieData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', paddingTop: '80px' }}>No leads yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[entry.name.toLowerCase()]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Score Distribution */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>AI Score Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreData.map((entry, index) => (
                  <Cell key={index} fill={['#ef233c', '#f77f00', '#4361ee', '#2dc653'][index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Value by Stage */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Pipeline Value by Stage ($)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {pipelineData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[entry.stage.toLowerCase()]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Leads Table */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '24px' }}>
        <h3 style={{ marginTop: 0 }}>Top Scored Leads</h3>
        {scores.length === 0 ? (
          <p style={{ color: '#888' }}>No scored leads yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a1a2e', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Contact</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Score</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Priority</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={s.lead_id} style={{ background: i % 2 === 0 ? 'white' : '#f8f9fa' }}>
                  <td style={{ padding: '12px' }}>{s.contact_name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: s.score >= 70 ? '#2dc653' : s.score >= 40 ? '#f77f00' : '#ef233c',
                      color: 'white', borderRadius: '12px', padding: '2px 10px', fontWeight: 'bold'
                    }}>
                      {s.score}/100
                    </span>
                  </td>
                  <td style={{ padding: '12px', textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold',
                    color: s.priority === 'high' ? '#ef233c' : s.priority === 'medium' ? '#f77f00' : '#888' }}>
                    {s.priority}
                  </td>
                  <td style={{ padding: '12px', color: '#555', fontSize: '13px' }}>{s.recommended_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}