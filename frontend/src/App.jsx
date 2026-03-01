import { useState, useEffect } from 'react'
import axios from 'axios'
import Pipeline from './Pipeline'
import Dashboard from './Dashboard'

const API = 'http://127.0.0.1:8080/api/v1'

function App() {
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: '' })
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('contacts')
  const [config, setConfig] = useState({
    client_name: 'CRM Core',
    primary_color: '#4361ee',
    logo_text: 'CRM'
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    axios.get(`${API}/config`).then(res => setConfig(res.data)).catch(() => {})
  }, [])

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API}/contacts`)
      setContacts(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post(`${API}/contacts`, form)
      setForm({ name: '', email: '', phone: '', company: '', source: '' })
      fetchContacts()
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleDelete = async (contact) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this contact?\n\nName: ${contact.name}\nEmail: ${contact.email}\nCompany: ${contact.company}\n\nThis will also delete all leads associated with this contact.`
    )
    if (!confirmed) return
    try {
      await axios.delete(`${API}/contacts/${contact.id}`)
      fetchContacts()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Nav */}
      <div style={{ background: '#1a1a2e', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: config.primary_color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
            {config.logo_text}
          </div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '20px' }}>{config.client_name}</h1>
        </div>
        <button onClick={() => setView('contacts')}
          style={{ background: view === 'contacts' ? '#4361ee' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Contacts
        </button>
        <button onClick={() => setView('pipeline')}
          style={{ background: view === 'pipeline' ? '#4361ee' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Pipeline
        </button>
        <button onClick={() => setView('dashboard')}
          style={{ background: view === 'dashboard' ? '#4361ee' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Dashboard
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 20px' }}>
        {view === 'contacts' && (
          <>
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginTop: 0 }}>Add Contact</h2>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input placeholder="Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                <input placeholder="Email" required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                <input placeholder="Company" value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                <input placeholder="Source (e.g. Google)" value={form.source} onChange={e => setForm({...form, source: e.target.value})}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                <button type="submit" disabled={loading}
                  style={{ padding: '10px', background: '#4361ee', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {loading ? 'Adding...' : 'Add Contact'}
                </button>
              </form>
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginTop: 0 }}>Contacts ({contacts.length})</h2>
              {contacts.length === 0 ? (
                <p style={{ color: '#888' }}>No contacts yet. Add one above.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a1a2e', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Company</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Source</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, i) => (
                      <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : '#f8f9fa' }}>
                        <td style={{ padding: '12px' }}>{c.name}</td>
                        <td style={{ padding: '12px' }}>{c.email}</td>
                        <td style={{ padding: '12px' }}>{c.phone}</td>
                        <td style={{ padding: '12px' }}>{c.company}</td>
                        <td style={{ padding: '12px' }}>{c.source}</td>
                        <td style={{ padding: '12px' }}>
                          <button onClick={() => handleDelete(c)}
                            style={{ padding: '6px 12px', background: '#ef233c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {view === 'pipeline' && <Pipeline />}
        {view === 'dashboard' && <Dashboard />}
      </div>
    </div>
  )
}

export default App