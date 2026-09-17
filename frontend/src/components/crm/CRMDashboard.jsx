import React, { useState, useEffect, useMemo } from "react";
import {
  getLeads, getCRMStats, updateLead, addLead, deleteLead, addActivity,
  getActivities, STAGES, COUNTRIES, INDUSTRIES, SOURCES, REQUIREMENTS,
  PRIORITIES, STAGE_COLORS, PRIORITY_COLORS, fmtCurrency
} from "../../services/crmService.js";
import {
  BarChart3, Users, TrendingUp, AlertTriangle, CheckCircle2, FileText,
  Trophy, XCircle, Search, Plus, Eye, Trash2, Phone, Mail, MessageSquare,
  Calendar, Globe, Briefcase, Target, Clock, X, Send, RefreshCw, Layers
} from "lucide-react";

function KPICard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-black text-slate-900 tabular-nums">{value}</div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onSaved }) {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    company:"",industry:INDUSTRIES[0],country:COUNTRIES[0],city:"",linkedIn:"",
    contactName:"",contactDesignation:"",email:"",phone:"",whatsapp:"",
    requirement:REQUIREMENTS[0],description:"",requiredCount:"",salaryRange:"",
    source:SOURCES[0],owner:"",priority:"High",stage:"New",
    dealValue:"",followUpDate:new Date().toISOString().split("T")[0],
  });
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const STEPS=["Company Info","Contact Person","Requirement","Sales Info"];

  const handleSave = () => {
    if(!form.company||!form.contactName||!form.email){alert("Fill Company, Contact Name, and Email.");return;}
    onSaved(form); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-950 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
          <div><h3 className="font-black text-lg">Add New Lead</h3><p className="text-blue-300 text-xs mt-0.5">{STEPS[step]} ({step+1}/4)</p></div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"><X size={18}/></button>
        </div>
        <div className="flex border-b border-slate-100">
          {STEPS.map((s,i)=>(<button key={i} onClick={()=>setStep(i)} className={`flex-1 py-2.5 text-xs font-bold transition-all cursor-pointer ${step===i?"text-blue-600 border-b-2 border-blue-600":"text-slate-400 hover:text-slate-600"}`}>{s}</button>))}
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {step===0&&<div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="lbl">Company Name *</label><input value={form.company} onChange={e=>f("company",e.target.value)} placeholder="e.g. Al Futtaim Group" className="inp"/></div>
            <div><label className="lbl">Industry</label><select value={form.industry} onChange={e=>f("industry",e.target.value)} className="inp">{INDUSTRIES.map(x=><option key={x}>{x}</option>)}</select></div>
            <div><label className="lbl">Country</label><select value={form.country} onChange={e=>f("country",e.target.value)} className="inp">{COUNTRIES.map(x=><option key={x}>{x}</option>)}</select></div>
            <div><label className="lbl">City</label><input value={form.city} onChange={e=>f("city",e.target.value)} placeholder="e.g. Dubai" className="inp"/></div>
            <div><label className="lbl">LinkedIn</label><input value={form.linkedIn} onChange={e=>f("linkedIn",e.target.value)} placeholder="linkedin.com/company/..." className="inp"/></div>
          </div>}
          {step===1&&<div className="grid grid-cols-2 gap-3">
            <div><label className="lbl">Contact Name *</label><input value={form.contactName} onChange={e=>f("contactName",e.target.value)} placeholder="Full name" className="inp"/></div>
            <div><label className="lbl">Designation</label><input value={form.contactDesignation} onChange={e=>f("contactDesignation",e.target.value)} placeholder="HR Director" className="inp"/></div>
            <div><label className="lbl">Email *</label><input type="email" value={form.email} onChange={e=>f("email",e.target.value)} placeholder="name@company.com" className="inp"/></div>
            <div><label className="lbl">Phone</label><input value={form.phone} onChange={e=>f("phone",e.target.value)} placeholder="+971-50-..." className="inp"/></div>
            <div><label className="lbl">WhatsApp</label><input value={form.whatsapp} onChange={e=>f("whatsapp",e.target.value)} placeholder="+971-50-..." className="inp"/></div>
          </div>}
          {step===2&&<div className="space-y-3">
            <div><label className="lbl">Requirement Type</label><select value={form.requirement} onChange={e=>f("requirement",e.target.value)} className="inp">{REQUIREMENTS.map(x=><option key={x}>{x}</option>)}</select></div>
            <div><label className="lbl">Description</label><textarea rows={3} value={form.description} onChange={e=>f("description",e.target.value)} placeholder="Describe the requirement..." className="inp resize-none"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl">Worker Count</label><input type="number" value={form.requiredCount} onChange={e=>f("requiredCount",e.target.value)} placeholder="e.g. 100" className="inp"/></div>
              <div><label className="lbl">Salary Range</label><input value={form.salaryRange} onChange={e=>f("salaryRange",e.target.value)} placeholder="e.g. AED 1,800-2,500" className="inp"/></div>
            </div>
          </div>}
          {step===3&&<div className="grid grid-cols-2 gap-3">
            <div><label className="lbl">Lead Source</label><select value={form.source} onChange={e=>f("source",e.target.value)} className="inp">{SOURCES.map(x=><option key={x}>{x}</option>)}</select></div>
            <div><label className="lbl">Owner (Sales Rep)</label><input value={form.owner} onChange={e=>f("owner",e.target.value)} placeholder="Your name" className="inp"/></div>
            <div><label className="lbl">Priority</label><select value={form.priority} onChange={e=>f("priority",e.target.value)} className="inp">{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></div>
            <div><label className="lbl">Pipeline Stage</label><select value={form.stage} onChange={e=>f("stage",e.target.value)} className="inp">{STAGES.map(x=><option key={x}>{x}</option>)}</select></div>
            <div><label className="lbl">Deal Value</label><input type="number" value={form.dealValue} onChange={e=>f("dealValue",e.target.value)} placeholder="e.g. 1200000" className="inp"/></div>
            <div><label className="lbl">Follow-up Date</label><input type="date" value={form.followUpDate} onChange={e=>f("followUpDate",e.target.value)} className="inp"/></div>
          </div>}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-bold disabled:opacity-40 cursor-pointer">Back</button>
          <div className="flex gap-2">
            {step<3
              ?<button onClick={()=>setStep(s=>s+1)} className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 cursor-pointer">Next</button>
              :<button onClick={handleSave} className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5"><CheckCircle2 size={15}/>Save Lead</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadDrawer({ lead, onClose, onUpdate }) {
  const [note, setNote] = React.useState("");
  const [noteType, setNoteType] = React.useState("Call");
  const [stage, setStage] = React.useState(lead.stage);
  const [activities, setActivities] = React.useState(getActivities(lead.id));

  const handleStageChange = (s) => { setStage(s); onUpdate(lead.id,{stage:s}); };
  const handleAddNote = () => {
    if(!note.trim())return;
    const act=addActivity({leadId:lead.id,type:noteType,note,date:new Date().toISOString()});
    setActivities(a=>[act,...a]); setNote("");
  };
  const actIcon = (t) => ({Call:<Phone size={13}/>,Meeting:<Calendar size={13}/>,Email:<Mail size={13}/>,Note:<FileText size={13}/>}[t]||<FileText size={13}/>);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-950 to-indigo-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-lg leading-tight">{lead.company}</h3>
              <p className="text-blue-300 text-xs mt-0.5">{lead.contactName} · {lead.contactDesignation}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-0.5 bg-white/10 rounded-lg text-[10px] font-bold">{lead.country}</span>
                <span className="px-2 py-0.5 bg-white/10 rounded-lg text-[10px] font-bold">{lead.industry}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${PRIORITY_COLORS[lead.priority]}`}>{lead.priority}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer shrink-0"><X size={18}/></button>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Pipeline Stage</label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map(s=>(<button key={s} onClick={()=>handleStageChange(s)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${stage===s?STAGE_COLORS[s]+" border-current":"bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400"}`}>{s}</button>))}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Contact Details</div>
            {lead.email&&<div className="flex items-center gap-2 text-xs"><Mail size={13} className="text-blue-500 shrink-0"/><a href={`mailto:${lead.email}`} className="text-slate-700 hover:text-blue-600 font-medium">{lead.email}</a></div>}
            {lead.phone&&<div className="flex items-center gap-2 text-xs"><Phone size={13} className="text-emerald-500 shrink-0"/><span className="text-slate-700 font-medium">{lead.phone}</span></div>}
            {lead.whatsapp&&<div className="flex items-center gap-2 text-xs"><MessageSquare size={13} className="text-green-500 shrink-0"/><span className="text-slate-700 font-medium">{lead.whatsapp}</span></div>}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Requirement</div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Type</span><span className="font-bold text-slate-800">{lead.requirement}</span></div>
            {lead.requiredCount&&<div className="flex justify-between text-xs"><span className="text-slate-500">Workers Needed</span><span className="font-bold text-slate-800">{lead.requiredCount}</span></div>}
            {lead.salaryRange&&<div className="flex justify-between text-xs"><span className="text-slate-500">Salary Range</span><span className="font-bold text-slate-800">{lead.salaryRange}</span></div>}
            {lead.dealValue&&<div className="flex justify-between text-xs"><span className="text-slate-500">Deal Value</span><span className="font-black text-emerald-700">{fmtCurrency(Number(lead.dealValue))}</span></div>}
            {lead.description&&<p className="text-[11px] text-slate-500 leading-relaxed pt-1">{lead.description}</p>}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Log Activity</div>
            <div className="flex gap-1.5 mb-2">
              {["Call","Email","Meeting","Note"].map(t=>(<button key={t} onClick={()=>setNoteType(t)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${noteType===t?"bg-blue-600 text-white border-blue-600":"bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400"}`}>{t}</button>))}
            </div>
            <div className="flex gap-2">
              <textarea rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note or outcome..." className="flex-1 inp resize-none text-xs"/>
              <button onClick={handleAddNote} className="px-3 py-2 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 shrink-0 flex items-center"><Send size={14}/></button>
            </div>
          </div>
          {activities.length>0&&(<div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Activity Timeline</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activities.map(a=>(<div key={a.id} className="flex gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">{actIcon(a.type)}</div>
                <div><div className="text-[10px] font-bold text-slate-500 uppercase">{a.type} - {new Date(a.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                <p className="text-xs text-slate-700 mt-0.5">{a.note}</p></div>
              </div>))}
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

export default function CRMDashboard({ user }) {
  const [leads, setLeads] = React.useState(getLeads);
  const [stats, setStats] = React.useState(getCRMStats);
  const [view, setView] = React.useState("dashboard");
  const [search, setSearch] = React.useState("");
  const [filterCountry, setFilterCountry] = React.useState("All");
  const [filterStage, setFilterStage] = React.useState("All");
  const [filterPriority, setFilterPriority] = React.useState("All");
  const [showAdd, setShowAdd] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState(null);

  const refresh = () => { setLeads(getLeads()); setStats(getCRMStats()); };
  const handleAddLead = (form) => { addLead(form); refresh(); };
  const handleUpdate = (id, patch) => { updateLead(id,patch); refresh(); };
  const handleDelete = (id) => { if(window.confirm("Delete this lead?")){ deleteLead(id); refresh(); } };

  const filtered = React.useMemo(()=>leads.filter(l=>{
    const q=search.toLowerCase();
    return (!q||l.company.toLowerCase().includes(q)||l.contactName.toLowerCase().includes(q)||l.country.toLowerCase().includes(q))
      &&(filterCountry==="All"||l.country===filterCountry)
      &&(filterStage==="All"||l.stage===filterStage)
      &&(filterPriority==="All"||l.priority===filterPriority);
  }),[leads,search,filterCountry,filterStage,filterPriority]);

  const today = new Date().toISOString().split("T")[0];
  const todayFollowUps = leads.filter(l=>l.followUpDate===today&&!["Won","Lost"].includes(l.stage));
  const overdueLeads = leads.filter(l=>l.followUpDate&&l.followUpDate<today&&!["Won","Lost"].includes(l.stage));

  return (
    <div className="space-y-6">
      <style>{`.inp{width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 14px;font-size:13px;color:#1e293b;outline:none;display:block}.inp:focus{border-color:#3b82f6;background:#fff}.inp:hover{border-color:#cbd5e1}.lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;display:block;margin-bottom:4px}`}</style>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Briefcase size={22} className="text-blue-600"/>Lead Management CRM</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">immiGo International Recruitment Pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-slate-500"><RefreshCw size={15}/></button>
          {["dashboard","pipeline","leads"].map(v=>(
            <button key={v} onClick={()=>setView(v)} className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${view===v?"bg-slate-900 text-white border-slate-900":"bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {v==="dashboard"?<span className="flex items-center gap-1"><BarChart3 size={13}/>Dashboard</span>:v==="pipeline"?<span className="flex items-center gap-1"><Layers size={13}/>Pipeline</span>:<span className="flex items-center gap-1"><Users size={13}/>All Leads</span>}
            </button>
          ))}
          <button onClick={()=>setShowAdd(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"><Plus size={14}/>Add Lead</button>
        </div>
      </div>

      {view==="dashboard"&&(<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Leads" value={stats.total} icon={<Users size={18}/>} color="bg-blue-50 text-blue-600"/>
          <KPICard label="New Leads" value={stats.newLeads} icon={<TrendingUp size={18}/>} color="bg-indigo-50 text-indigo-600"/>
          <KPICard label="Qualified" value={stats.qualified} icon={<Target size={18}/>} color="bg-violet-50 text-violet-600"/>
          <KPICard label="Follow-ups Today" value={stats.followUpsToday} sub={`${stats.overdue} overdue`} icon={<Clock size={18}/>} color={stats.followUpsToday>0?"bg-amber-50 text-amber-600":"bg-slate-50 text-slate-400"}/>
          <KPICard label="Proposals Sent" value={stats.proposalSent} icon={<FileText size={18}/>} color="bg-sky-50 text-sky-600"/>
          <KPICard label="Deals Won" value={stats.won} sub={fmtCurrency(stats.wonValue)} icon={<Trophy size={18}/>} color="bg-emerald-50 text-emerald-600"/>
          <KPICard label="Deals Lost" value={stats.lost} icon={<XCircle size={18}/>} color="bg-rose-50 text-rose-600"/>
          <KPICard label="Pipeline Value" value={fmtCurrency(stats.totalPipelineValue)} icon={<BarChart3 size={18}/>} color="bg-teal-50 text-teal-600"/>
        </div>

        {(todayFollowUps.length>0||overdueLeads.length>0)&&(<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayFollowUps.length>0&&(<div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="text-sm font-black text-amber-900 mb-3 flex items-center gap-2"><Clock size={16}/>Today Follow-ups ({todayFollowUps.length})</h3>
            <div className="space-y-2">{todayFollowUps.slice(0,4).map(l=>(
              <div key={l.id} onClick={()=>setSelectedLead(l)} className="bg-white rounded-xl p-3 border border-amber-100 cursor-pointer hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-800">{l.company}</span><span className={`text-[10px] font-black px-2 py-0.5 rounded ${STAGE_COLORS[l.stage]}`}>{l.stage}</span></div>
                <div className="text-xs text-slate-500 mt-0.5">{l.contactName} - {l.country}</div>
              </div>
            ))}</div>
          </div>)}
          {overdueLeads.length>0&&(<div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <h3 className="text-sm font-black text-rose-900 mb-3 flex items-center gap-2"><AlertTriangle size={16}/>Overdue ({overdueLeads.length})</h3>
            <div className="space-y-2">{overdueLeads.slice(0,4).map(l=>(
              <div key={l.id} onClick={()=>setSelectedLead(l)} className="bg-white rounded-xl p-3 border border-rose-100 cursor-pointer hover:border-rose-300 transition-all">
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-slate-800">{l.company}</span><span className="text-[10px] font-bold text-rose-600">{l.followUpDate}</span></div>
                <div className="text-xs text-slate-500 mt-0.5">{l.contactName} - {l.country}</div>
              </div>
            ))}</div>
          </div>)}
        </div>)}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800">Recent Leads</h3>
            <button onClick={()=>setView("leads")} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[700px]">
            <thead><tr>{["Company","Country","Contact","Requirement","Stage","Value","Action"].map(h=>(<th key={h} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">{h}</th>))}</tr></thead>
            <tbody>{leads.slice(0,8).map(l=>(<tr key={l.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0 cursor-pointer" onClick={()=>setSelectedLead(l)}>
              <td className="px-4 py-3"><div className="font-bold text-slate-900 text-sm">{l.company}</div><div className="text-[10px] text-slate-400">{l.industry}</div></td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap"><Globe size={11} className="inline mr-1 text-slate-400"/>{l.country}</td>
              <td className="px-4 py-3"><div className="text-xs font-semibold text-slate-700">{l.contactName}</div><div className="text-[10px] text-slate-400">{l.email}</div></td>
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{l.requirement}</td>
              <td className="px-4 py-3 whitespace-nowrap"><span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${STAGE_COLORS[l.stage]}`}>{l.stage}</span></td>
              <td className="px-4 py-3 text-xs font-black text-emerald-700 whitespace-nowrap">{fmtCurrency(l.dealValue)}</td>
              <td className="px-4 py-3"><button onClick={e=>{e.stopPropagation();setSelectedLead(l);}} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg cursor-pointer"><Eye size={14}/></button></td>
            </tr>))}</tbody>
          </table></div>
        </div>
      </>)}

      {view==="pipeline"&&(<div className="overflow-x-auto pb-4"><div className="flex gap-4 min-w-max">
        {["New","Contacted","Qualified","Meeting Scheduled","Proposal Sent","Negotiation"].map(stage=>{
          const sl=leads.filter(l=>l.stage===stage);
          return (<div key={stage} className="w-64 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between"><span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${STAGE_COLORS[stage]}`}>{stage}</span><span className="text-xs font-black text-slate-500">{sl.length}</span></div>
              <div className="text-xs text-slate-400 mt-1">{fmtCurrency(sl.reduce((s,l)=>s+(l.dealValue||0),0))}</div>
            </div>
            <div className="p-3 space-y-2.5 max-h-[520px] overflow-y-auto flex-1">
              {sl.map(l=>(<div key={l.id} onClick={()=>setSelectedLead(l)} className="bg-white rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="font-bold text-slate-900 text-sm truncate">{l.company}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{l.contactName} - {l.country}</div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[l.priority]}`}>{l.priority}</span>
                  <span className="text-[10px] font-bold text-emerald-700">{fmtCurrency(l.dealValue)}</span>
                </div>
                {l.followUpDate&&<div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1"><Calendar size={9}/>{l.followUpDate}</div>}
              </div>))}
              {sl.length===0&&<div className="text-center text-xs text-slate-400 py-6">No leads</div>}
            </div>
          </div>);
        })}
      </div></div>)}

      {view==="leads"&&(<>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company, contact, country..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"/></div>
            <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-slate-50 cursor-pointer"><option value="All">All Countries</option>{COUNTRIES.map(x=><option key={x}>{x}</option>)}</select>
            <select value={filterStage} onChange={e=>setFilterStage(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-slate-50 cursor-pointer"><option value="All">All Stages</option>{STAGES.map(x=><option key={x}>{x}</option>)}</select>
            <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-slate-50 cursor-pointer"><option value="All">All Priorities</option>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select>
            <span className="text-xs text-slate-500 font-bold">{filtered.length} leads</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[900px]">
          <thead><tr>{["Company & Industry","Country","Contact","Requirement","Stage","Priority","Deal Value","Follow-up","Action"].map(h=>(<th key={h} className="px-4 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">{h}</th>))}</tr></thead>
          <tbody>{filtered.map(l=>(<tr key={l.id} className="hover:bg-blue-50/30 border-b border-slate-100 last:border-0 cursor-pointer transition-colors" onClick={()=>setSelectedLead(l)}>
            <td className="px-4 py-3.5"><div className="font-bold text-slate-900 text-sm">{l.company}</div><div className="text-[10px] text-slate-400">{l.industry}</div></td>
            <td className="px-4 py-3.5 whitespace-nowrap"><div className="text-xs font-semibold text-slate-700 flex items-center gap-1"><Globe size={11} className="text-slate-400"/>{l.country}</div><div className="text-[10px] text-slate-400">{l.city}</div></td>
            <td className="px-4 py-3.5"><div className="text-xs font-semibold text-slate-700">{l.contactName}</div><div className="text-[10px] text-slate-400">{l.contactDesignation}</div></td>
            <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">{l.requirement}</td>
            <td className="px-4 py-3.5 whitespace-nowrap"><span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${STAGE_COLORS[l.stage]}`}>{l.stage}</span></td>
            <td className="px-4 py-3.5 whitespace-nowrap"><span className={`text-[9px] font-black px-2 py-0.5 rounded border ${PRIORITY_COLORS[l.priority]}`}>{l.priority}</span></td>
            <td className="px-4 py-3.5 text-xs font-black text-emerald-700 whitespace-nowrap">{fmtCurrency(l.dealValue)}</td>
            <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">{l.followUpDate||"--"}</td>
            <td className="px-4 py-3.5"><div className="flex gap-1">
              <button onClick={e=>{e.stopPropagation();setSelectedLead(l);}} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg cursor-pointer" title="View"><Eye size={14}/></button>
              <button onClick={e=>{e.stopPropagation();handleDelete(l.id);}} className="p-1.5 hover:bg-rose-50 text-rose-400 rounded-lg cursor-pointer" title="Delete"><Trash2 size={14}/></button>
            </div></td>
          </tr>))}
          {filtered.length===0&&<tr><td colSpan="9"><div className="text-center py-12 text-slate-400 font-semibold text-sm">No leads found.</div></td></tr>}
          </tbody>
        </table></div></div>
      </>)}

      {showAdd&&<AddLeadModal onClose={()=>setShowAdd(false)} onSaved={handleAddLead}/>}
      {selectedLead&&<LeadDrawer lead={selectedLead} onClose={()=>setSelectedLead(null)} onUpdate={handleUpdate}/>}
    </div>
  );
}
