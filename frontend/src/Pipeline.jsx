import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import axios from 'axios'
import Loading from './components/Loading'

const API = 'http://127.0.0.1:8080/api/v1'

const STAGES = ['new', 'contacted', 'qualified', 'lost']

const STAGE_COLORS = {
  new: '#4361ee',
  contacted: '#f77f00',
  qualified: '#2dc653',
  lost: '#ef233c'
}

const STAGE_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  lost: 'Lost'
}

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [contacts, setContacts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ contact_id: '', value_estimate: '', notes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
    fetchContacts()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/leads`)
      const leadsData = res.data
      try {
        const scoresRes = await axios.get(`${API}/leads/score/all`)
        const scoresMap = {}
        scoresRes.data.forEach(s => {
          scoresMap[s.lead_id] = s
        })
        const leadsWithScores = leadsData.map(lead => ({
          ...lead,
          ...scoresMap[lead.id]
        }))
        setLeads(leadsWithScores)
      } catch {
        setLeads(leadsData)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API}/contacts`)
      setContacts(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const getContactName = (id) => {
    const c = contacts.find(c => c.id === id)
    return c ? c.name : 'Unknown'
  }

  const getLeadsByStage = (stage) => {
    return leads.filter(l => l.status === stage)
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return
    const leadId = parseInt(result.draggableId)
    const newStage = result.destination.droppableId
    try {
      const lead = leads.find(l => l.id === leadId)
      await axios.put(`${API}/leads/${leadId}`, { ...lead, status: newStage })
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStage } : l))
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddLead = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API}/leads`, {
        contact_id: parseInt(form.contact_id),
        value_estimate: parseFloat(form.value_estimate) || 0,
        notes: form.notes,
        status: 'new'
      })
      setForm({ contact_id: '', value_estimate: '', notes: '' })
      setShowForm(false)
      fetchLeads()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ padding: '24px', position: 'relative' }}>
      {loading && <Loading message="Loading Pipeline..." />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Lead Pipeline</h2>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: '#4361ee', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Add Lead
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0 }}>New Lead</h3>
          <form onSubmit={handleAddLead} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <select required value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <option value=''>Select Contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Value Estimate ($)" type="number" value={form.value_estimate}
              onChange={e => setForm({...form, value_estimate: e.target.value})}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <button type="submit"
              style={{ padding: '10px', background: '#2dc653', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Save Lead
            </button>
          </form>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {STAGES.map(stage => (
            <div key={stage} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', minHeight: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {STAGE_LABELS[stage]}
                </h3>
                <span style={{ marginLeft: 'auto', background: STAGE_COLORS[stage], color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '12px' }}>
                  {getLeadsByStage(stage).length}
                </span>
              </div>
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    style={{ minHeight: '300px', background: snapshot.isDraggingOver ? '#e8ecff' : 'transparent', borderRadius: '6px', transition: 'background 0.2s', padding: '4px' }}>
                    {getLeadsByStage(stage).map((lead, index) => (
                      <Draggable key={lead.id} draggableId={String(lead.id)} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            style={{ background: 'white', borderRadius: '6px', padding: '12px', marginBottom: '8px',
                              boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
                              cursor: 'grab', ...provided.draggableProps.style }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{getContactName(lead.contact_id)}</div>
                            {lead.value_estimate > 0 && (
                              <div style={{ color: '#2dc653', fontWeight: 'bold', fontSize: '14px' }}>
                                ${lead.value_estimate.toLocaleString()}
                              </div>
                            )}
                            {lead.notes && <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>{lead.notes}</div>}
                            {lead.score && (
                              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ 
                                  background: lead.score >= 70 ? '#2dc653' : lead.score >= 40 ? '#f77f00' : '#ef233c',
                                  color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold' 
                                }}>
                                  {lead.score}/100
                                </div>
                                <div style={{ fontSize: '11px', color: '#888' }}>{lead.priority?.toUpperCase()}</div>
                              </div>
                            )}
                            {lead.recommended_action && (
                              <div style={{ fontSize: '11px', color: '#4361ee', marginTop: '4px', fontStyle: 'italic' }}>
                                → {lead.recommended_action}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}