import { useState, useEffect } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────
const CATEGORIES = [
  "Salon & Beauty","Restaurant & Food","Retail Shop","Pharmacy",
  "Hardware & Construction","Clothing & Fashion","Electronics",
  "Cosmetics","Printing & Stationery","Agriculture & Produce",
  "Transport & Logistics","Real Estate","Other"
];
const ADMIN_EMAIL = "admin@getalead.com";
const ADMIN_PASS  = "Geta@Admin2024";
const TRIAL_DAYS  = 3;
const DB_KEY      = "getalead_db";

// ─── STORAGE HELPERS ─────────────────────────────────────────
const getDB = () => {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || "{}"); } catch { return {}; }
};
const saveDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

const getUsers  = () => getDB().users  || {};
const getLeadsStore = () => getDB().leads || {};

const normalizeId = (id) => id.trim().toLowerCase().replace(/\s+/g,"");

const saveUser = (id, data) => {
  const db = getDB();
  db.users = db.users || {};
  const key = normalizeId(id);
  db.users[key] = { ...db.users[key], ...data };
  // if phone provided, also store alias
  if(data.phone){
    const ph = normalizeId(data.phone);
    if(ph !== key) db.users[ph] = { aliasFor: key };
  }
  saveDB(db);
};

// Resolve phone alias to real key
const resolveUser = (id) => {
  const users = getUsers();
  const key = normalizeId(id);
  const entry = users[key];
  if(!entry) return { key: null, user: null };
  if(entry.aliasFor) return { key: entry.aliasFor, user: users[entry.aliasFor] };
  return { key, user: entry };
};
const saveLeads = (email, leads) => {
  const db = getDB();
  db.leads = db.leads || {};
  db.leads[email] = db.leads[email] || [];
  db.leads[email] = [{ date: new Date().toISOString(), items: leads }, ...db.leads[email]].slice(0, 10);
  saveDB(db);
};

const trialDaysLeft = (user) => {
  if (!user?.trialStart) return 0;
  const elapsed = (Date.now() - user.trialStart) / (1000 * 60 * 60 * 24);
  return Math.max(0, TRIAL_DAYS - Math.floor(elapsed));
};
const subDaysLeft = (user) => {
  if(!user?.paid || !user?.paidUntil) return user?.paid ? 999 : 0;
  const left = (user.paidUntil - Date.now()) / (1000*60*60*24);
  return Math.max(0, Math.ceil(left));
};
const isActive = (user) => {
  if(user?.paid){
    if(!user?.paidUntil) return true; // no expiry set = always active
    return user.paidUntil > Date.now();
  }
  return trialDaysLeft(user) > 0;
};

// ─── STYLES ──────────────────────────────────────────────────
const S = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#080808;--green:#00c853;--gd:#00c85320;--gm:#00c85340;
  --white:#f0f0eb;--g1:#141414;--g2:#1e1e1e;--g3:#282828;
  --muted:#606060;--border:#222;--red:#ff4444;
}
body{background:var(--bg);color:var(--white);font-family:'DM Sans',sans-serif;min-height:100vh}
.app{min-height:100vh;max-width:480px;margin:0 auto}

/* NAV */
.nav{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:100}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;letter-spacing:-0.5px}
.logo span{color:var(--green)}
.nav-right{display:flex;gap:8px;align-items:center}
.pill{background:var(--gd);border:1px solid var(--gm);color:var(--green);font-size:10px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:1px;text-transform:uppercase}
.pill.red{background:#ff444420;border-color:#ff444440;color:var(--red)}
.pill.grey{background:var(--g2);border-color:var(--border);color:var(--muted)}

/* BUTTONS */
.btn{width:100%;padding:14px;border-radius:12px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;cursor:pointer;border:none;transition:opacity .2s,transform .1s;letter-spacing:.3px}
.btn:active{transform:scale(.98)}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-green{background:var(--green);color:#000}
.btn-green:hover{opacity:.9}
.btn-outline{background:transparent;border:1px solid var(--border);color:var(--white)}
.btn-outline:hover{border-color:#444}
.btn-sm{width:auto;padding:8px 16px;font-size:12px;border-radius:8px}
.btn-red{background:#ff444420;border:1px solid #ff444440;color:var(--red)}

/* CARDS */
.card{background:var(--g1);border:1px solid var(--border);border-radius:16px;padding:24px 20px;margin:0 16px 16px}
.card-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:18px;display:flex;align-items:center;gap:8px}
.card-title::before{content:'';display:block;width:3px;height:15px;background:var(--green);border-radius:2px}

/* FIELDS */
.field{margin-bottom:14px}
.field label{display:block;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:7px;font-weight:500}
.field input,.field select,.field textarea{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--white);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;appearance:none}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--green)}
.field textarea{resize:none;height:70px}
.field select option{background:var(--bg)}
.err{background:#ff444415;border:1px solid #ff444435;color:#ff7070;border-radius:8px;padding:9px 13px;font-size:12px;margin-top:10px}
.ok{background:var(--gd);border:1px solid var(--gm);color:var(--green);border-radius:8px;padding:9px 13px;font-size:12px;margin-top:10px}

/* LANDING */
.hero{padding:50px 20px 30px;text-align:center;position:relative}
.hero::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:280px;height:280px;background:radial-gradient(circle,#00c85315 0%,transparent 70%);pointer-events:none}
.hero-tag{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:14px;font-weight:500}
.hero h1{font-family:'Syne',sans-serif;font-size:clamp(26px,7vw,38px);font-weight:800;line-height:1.1;letter-spacing:-1px;margin-bottom:14px}
.hero h1 em{font-style:normal;color:var(--green)}
.hero p{color:var(--muted);font-size:14px;line-height:1.6;max-width:320px;margin:0 auto 28px}
.stats{display:flex;justify-content:center;gap:28px;margin-bottom:36px}
.stat-num{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--green)}
.stat-label{font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-top:2px}
.hero-btns{display:flex;flex-direction:column;gap:10px;padding:0 20px}

/* TRIAL BANNER */
.trial-bar{background:var(--gd);border-bottom:1px solid var(--gm);padding:10px 20px;display:flex;justify-content:space-between;align-items:center}
.trial-bar span{font-size:12px;color:var(--green);font-weight:500}
.trial-bar strong{font-family:'Syne',sans-serif;font-size:13px;color:var(--green)}

/* PAYWALL */
.paywall{text-align:center;padding:40px 20px}
.paywall h2{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:10px}
.paywall p{color:var(--muted);font-size:13px;line-height:1.6;margin-bottom:24px}
.price-card{background:var(--g1);border:1px solid var(--gm);border-radius:16px;padding:24px;margin:0 16px 20px;text-align:center}
.price-amount{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;color:var(--green);margin-bottom:4px}
.price-label{font-size:11px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:16px}
.price-features{text-align:left;margin-bottom:20px}
.price-feat{font-size:13px;color:#aaa;padding:5px 0;display:flex;gap:8px;align-items:center}
.price-feat::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0}

/* LEADS */
.section{padding:0 16px 30px}
.section-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.section-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700}
.count-pill{background:var(--gd);color:var(--green);border:1px solid var(--gm);font-size:10px;font-weight:600;padding:3px 9px;border-radius:20px}

.lead-card{background:var(--g1);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:10px;animation:fadeUp .3s ease forwards;opacity:0}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.lead-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.lead-name{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;line-height:1.2}
.lead-score{background:var(--gd);color:var(--green);font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;white-space:nowrap;margin-left:6px;flex-shrink:0}
.lead-platform{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:7px;font-weight:500}
.lead-insight{font-size:12px;color:#999;line-height:1.5;margin-bottom:12px}
.lead-actions{display:flex;gap:7px}
.btn-wa{flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:none;background:#25D366;color:#000;font-family:'DM Sans',sans-serif;transition:opacity .2s}
.btn-done{flex:1;padding:8px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--g2);color:var(--white);font-family:'DM Sans',sans-serif;transition:opacity .2s}
.btn-wa:hover,.btn-done:hover{opacity:.8}

/* LOADING */
.loading-card{background:var(--g1);border:1px solid var(--border);border-radius:14px;padding:28px;text-align:center;margin-bottom:10px}
.dots{display:flex;justify-content:center;gap:5px;margin-bottom:14px}
.dot{width:7px;height:7px;background:var(--green);border-radius:50%;animation:bounce 1.2s infinite}
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
@keyframes bounce{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
.loading-text{color:var(--muted);font-size:13px;line-height:1.6}
.loading-step{color:var(--green);font-size:11px;margin-top:7px;font-weight:500}

/* HISTORY */
.history-item{background:var(--g1);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:8px;cursor:pointer;transition:border-color .2s}
.history-item:hover{border-color:#333}
.history-date{font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
.history-count{font-family:'Syne',sans-serif;font-size:13px;font-weight:700}

/* ADMIN */
.admin-stat{background:var(--g1);border:1px solid var(--border);border-radius:12px;padding:16px;flex:1;text-align:center}
.admin-stat-num{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:var(--green)}
.admin-stat-label{font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-top:3px}
.admin-stats{display:flex;gap:8px;margin-bottom:16px}
.user-row{background:var(--g1);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:8px}
.user-email{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;margin-bottom:4px}
.user-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.user-tag{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:500}
.tag-active{background:var(--gd);color:var(--green);border:1px solid var(--gm)}
.tag-expired{background:#ff444415;color:var(--red);border:1px solid #ff444430}
.tag-paid{background:#4488ff20;color:#4488ff;border:1px solid #4488ff40}

/* TABS */
.tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:20px}
.tab{flex:1;padding:12px;text-align:center;font-size:12px;font-weight:600;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;font-family:'Syne',sans-serif;letter-spacing:.5px}
.tab.active{color:var(--green);border-bottom-color:var(--green)}

.footer{border-top:1px solid var(--border);padding:18px 20px;text-align:center;color:var(--muted);font-size:10px;letter-spacing:.5px}
.divider{text-align:center;color:var(--muted);font-size:11px;margin:12px 0;position:relative}
.divider::before,.divider::after{content:'';position:absolute;top:50%;width:40%;height:1px;background:var(--border)}
.divider::before{left:0}.divider::after{right:0}
.link-btn{background:none;border:none;color:var(--green);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:underline}
`;

// ─── MAIN APP ─────────────────────────────────────────────────
export default function GetaLead() {
  const [page, setPage]           = useState("landing"); // landing|login|register|app|admin|paywall
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab]             = useState("find");    // find|history
  const [leads, setLeads]         = useState([]);
  const [history, setHistory]     = useState([]);
  const [aiStep, setAiStep]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [contacted, setContacted] = useState({});
  const [msg, setMsg]             = useState({ text:"", type:"" });
  const [selectedHistory, setSelectedHistory] = useState(null);

  const [form, setForm] = useState({ businessName:"", category:"", location:"", description:"", phone:"" });
  const [auth, setAuth] = useState({ email:"", password:"", name:"", confirmPassword:"", phone:"" });

  const setMessage = (text, type="err") => { setMsg({text,type}); setTimeout(()=>setMsg({text:"",type:""}),4000); };

  // Load user from storage on mount
  useEffect(()=>{
    const saved = localStorage.getItem("getalead_session");
    if(saved){
      const email = saved;
      if(email === ADMIN_EMAIL){ setPage("admin"); return; }
      const users = getUsers();
      if(users[email]){ setCurrentUser({email,...users[email]}); setPage("app"); }
    }
  },[]);

  const login = () => {
    const { email, password } = auth;
    if(!email||!password){ setMessage("Enter your email/phone and password."); return; }
    if(normalizeId(email)===ADMIN_EMAIL && password===ADMIN_PASS){
      localStorage.setItem("getalead_session", ADMIN_EMAIL);
      setPage("admin"); return;
    }
    const { key, user } = resolveUser(email);
    if(!key || !user || user.password !== password){ setMessage("Wrong email/phone or password."); return; }
    localStorage.setItem("getalead_session", key);
    setCurrentUser({email:key,...user});
    loadUserHistory(key);
    if(!isActive(user)){ setPage("paywall"); } else { setPage("app"); }
  };

  const register = () => {
    const { email, password, confirmPassword, name, phone } = auth;
    if(!name||!email||!password){ setMessage("Fill all required fields."); return; }
    if(password !== confirmPassword){ setMessage("Passwords do not match."); return; }
    if(password.length < 6){ setMessage("Password must be at least 6 characters."); return; }
    const key = normalizeId(email);
    const users = getUsers();
    if(users[key] && !users[key].aliasFor){ setMessage("Email already registered."); return; }
    if(phone && users[normalizeId(phone)]){ setMessage("Phone number already registered."); return; }
    const userData = { name, password, phone: phone||"", trialStart: Date.now(), paid: false, registeredAt: Date.now() };
    saveUser(key, userData);
    localStorage.setItem("getalead_session", key);
    setCurrentUser({email:key,...userData});
    setPage("app");
    setMessage("Welcome! Your 3-day free trial has started.", "ok");
  };

  const logout = () => {
    localStorage.removeItem("getalead_session");
    setCurrentUser(null);
    setLeads([]); setHistory([]);
    setPage("landing");
  };

  const loadUserHistory = (email) => {
    const store = getLeadsStore();
    setHistory(store[email] || []);
  };

  useEffect(()=>{ if(currentUser) loadUserHistory(currentUser.email); },[currentUser]);

  const findLeads = async () => {
    if(!form.businessName||!form.category||!form.location){ setMessage("Fill business name, category and location."); return; }
    setLoading(true); setLeads([]); setContacted({});
    const steps = [
      "Scanning Facebook groups in "+form.location+"...",
      "Analysing TikTok & Instagram signals...",
      "Checking Google Maps activity nearby...",
      "Scanning WhatsApp group activity...",
      "AI matching & ranking leads..."
    ];
    for(let s of steps){ setAiStep(s); await new Promise(r=>setTimeout(r,800)); }
    try {
      const prompt = `You are Geta AI, a global lead generation engine for businesses.
Business: ${form.businessName} | Category: ${form.category} | Location: ${form.location}
Description: ${form.description||"Not provided"}

Generate 6 realistic potential client leads. Distribute across: Facebook Group, Instagram, TikTok (at least 1-2), Google Maps, WhatsApp Group, Walk-in Area.

CRITICAL RECENCY RULES — only surface leads whose signal is recent:
- TikTok: posted within last 7 days
- Instagram: posted within last 7 days
- Facebook Group: posted within last 14 days
- WhatsApp Group: posted within last 7 days
- Google Maps: searched or reviewed within last 30 days
- Walk-in Area: active today / real time

In the insight field, always mention HOW RECENTLY they showed the signal e.g. "Posted 2 days ago asking for...", "Searched yesterday for...", "Commented 5 days ago on...". Never reference signals older than the limits above.

Return ONLY a valid JSON array, no markdown:
[{"name":"...","platform":"...","location":"...","insight":"2 sentences including how recently they showed the signal and why they need this service NOW","score":"70-99","phone":"local number","recency":"e.g. 2 days ago"}]

Use local names and locations relevant to ${form.location}. Be specific and realistic.`;

      const res  = await fetch("/api/leads",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1200,
          messages:[{role:"user",content:prompt}] })
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("")||"";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setLeads(parsed);
      saveLeads(currentUser.email, parsed);
      loadUserHistory(currentUser.email);
    } catch(e){ 
      console.error("API Error:", e);
      setMessage("Error: " + (e.message || "AI hit an issue. Try again.")); 
    }
    setLoading(false);
  };

  const daysLeft = currentUser ? trialDaysLeft(getUsers()[currentUser.email]||{}) : 0;
  const userActive = currentUser ? isActive(getUsers()[currentUser.email]||{}) : false;

  // ── PAGES ────────────────────────────────────────────────────

  // LANDING
  if(page==="landing") return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="nav">
          <div className="logo">Geta<span>Lead</span></div>
          <div className="pill">AI Beta</div>
        </div>
        <div className="hero">
          <div className="hero-tag">Powered by AI · Works Anywhere</div>
          <h1>Find clients.<br/><em>Every single day.</em></h1>
          <p>Stop waiting. Geta AI hunts leads across Facebook, TikTok, Instagram, WhatsApp & Google Maps — delivered to your dashboard daily.</p>
          <div className="stats">
            <div className="stat"><div className="stat-num">6+</div><div className="stat-label">Daily Leads</div></div>
            <div className="stat"><div className="stat-num">5</div><div className="stat-label">Platforms</div></div>
            <div className="stat"><div className="stat-num">3</div><div className="stat-label">Day Trial</div></div>
          </div>
        </div>
        <div className="hero-btns">
          <button className="btn btn-green" onClick={()=>setPage("register")}>Start Free 3-Day Trial →</button>
          <button className="btn btn-outline" onClick={()=>setPage("login")}>I Already Have an Account</button>
          <button className="btn btn-outline btn-sm" style={{marginTop:4,fontSize:11,color:"var(--muted)"}} onClick={()=>{ setAuth({email:ADMIN_EMAIL,password:ADMIN_PASS,name:"",confirmPassword:""}); setPage("login"); }}>Admin Access</button>
        </div>
        <div className="footer" style={{marginTop:40}}>GETALEAD · AI Lead Generation · Beta v1.0</div>
      </div>
    </>
  );

  // REGISTER
  if(page==="register") return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="nav">
          <div className="logo">Geta<span>Lead</span></div>
          <button className="btn btn-outline btn-sm" onClick={()=>setPage("landing")}>← Back</button>
        </div>
        <div style={{padding:"30px 0 0"}}>
          <div className="card">
            <div className="card-title">Create Your Account</div>
            <div className="field"><label>Full Name</label><input placeholder="e.g. Grace Nakato" value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})}/></div>
            <div className="field"><label>Email Address</label><input type="email" placeholder="you@email.com" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value.toLowerCase()})}/></div>
            <div className="field"><label>Phone Number (optional — for phone login)</label><input type="tel" placeholder="e.g. 0772123456" value={auth.phone} onChange={e=>setAuth({...auth,phone:e.target.value.trim()})}/></div>
            <div className="field"><label>Password</label><input type="password" placeholder="Min 6 characters" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/></div>
            <div className="field"><label>Confirm Password</label><input type="password" placeholder="Repeat password" value={auth.confirmPassword} onChange={e=>setAuth({...auth,confirmPassword:e.target.value})}/></div>
            {msg.text && <div className={msg.type==="ok"?"ok":"err"}>{msg.text}</div>}
            <button className="btn btn-green" style={{marginTop:14}} onClick={register}>Start Free Trial →</button>
            <div className="divider" style={{marginTop:16}}>or</div>
            <div style={{textAlign:"center",marginTop:8}}><button className="link-btn" onClick={()=>setPage("login")}>Already have an account? Login</button></div>
          </div>
          <div style={{textAlign:"center",padding:"0 20px",color:"var(--muted)",fontSize:11,lineHeight:1.6}}>
            By registering you get a free 3-day trial. No credit card required.<br/>After trial: UGX 100,000/month.
          </div>
        </div>
      </div>
    </>
  );

  // LOGIN
  if(page==="login") return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="nav">
          <div className="logo">Geta<span>Lead</span></div>
          <button className="btn btn-outline btn-sm" onClick={()=>setPage("landing")}>← Back</button>
        </div>
        <div style={{padding:"30px 0 0"}}>
          <div className="card">
            <div className="card-title">Login to Your Account</div>
            <div className="field"><label>Email or Phone Number</label><input placeholder="you@email.com or 0772123456" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value.toLowerCase().trim()})}/></div>
            <div className="field"><label>Password</label><input type="password" placeholder="Your password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/></div>
            {msg.text && <div className={msg.type==="ok"?"ok":"err"}>{msg.text}</div>}
            <button className="btn btn-green" style={{marginTop:14}} onClick={login}>Login →</button>
            <div className="divider" style={{marginTop:16}}>or</div>
            <div style={{textAlign:"center",marginTop:8}}><button className="link-btn" onClick={()=>setPage("register")}>No account? Start free trial</button></div>
          </div>
        </div>
      </div>
    </>
  );

  // PAYWALL
  if(page==="paywall") return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="nav">
          <div className="logo">Geta<span>Lead</span></div>
          <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
        </div>
        <div className="paywall">
          <div style={{fontSize:36,marginBottom:14}}>⏰</div>
          <h2>Your Free Trial<br/>Has Ended</h2>
          <p>You've used your 3-day free trial. Subscribe now to keep receiving daily leads for your business.</p>
        </div>
        <div className="price-card">
          <div className="price-amount">UGX 100,000</div>
          <div className="price-label">per month</div>
          <div className="price-features">
            {["6+ AI-generated leads daily","Facebook, TikTok, Instagram & more","WhatsApp direct contact per lead","Full leads history & dashboard","Priority AI matching"].map(f=>(
              <div className="price-feat" key={f}>{f}</div>
            ))}
          </div>
          <button className="btn btn-green" onClick={()=>setMessage("Payment via MTN/Airtel Mobile Money coming soon. Contact +256 700 000000 to subscribe manually.","ok")}>
            Pay with Mobile Money →
          </button>
        </div>
        <div style={{textAlign:"center",padding:"0 20px 30px",color:"var(--muted)",fontSize:12}}>
          MTN & Airtel Mobile Money accepted.<br/>Contact us: <span style={{color:"var(--green)"}}>+256 700 000000</span>
        </div>
      </div>
    </>
  );

  // ADMIN
  if(page==="admin"){
    const users = getUsers();
    const userList = Object.entries(users).filter(([e])=>e!==ADMIN_EMAIL);
    const paid    = userList.filter(([,u])=>u.paid).length;
    const active  = userList.filter(([,u])=>isActive(u)&&!u.paid).length;
    const expired = userList.filter(([,u])=>!isActive(u)).length;
    return (
      <>
        <style>{S}</style>
        <div className="app">
          <div className="nav">
            <div className="logo">Geta<span>Lead</span> <span style={{fontSize:10,color:"var(--muted)",fontWeight:400}}>Admin</span></div>
            <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
          </div>
          <div style={{padding:"20px 16px 30px"}}>
            <div className="admin-stats">
              <div className="admin-stat"><div className="admin-stat-num">{userList.length}</div><div className="admin-stat-label">Total Users</div></div>
              <div className="admin-stat"><div className="admin-stat-num" style={{color:"#4488ff"}}>{paid}</div><div className="admin-stat-label">Paid</div></div>
              <div className="admin-stat"><div className="admin-stat-num">{active}</div><div className="admin-stat-label">On Trial</div></div>
              <div className="admin-stat"><div className="admin-stat-num" style={{color:"var(--red)"}}>{expired}</div><div className="admin-stat-label">Expired</div></div>
            </div>

            <div className="section-title" style={{marginBottom:12}}>All Users</div>
            {userList.length===0 && <div style={{color:"var(--muted)",fontSize:13,textAlign:"center",padding:"20px 0"}}>No users registered yet.</div>}
            {userList.filter(([,u])=>!u.aliasFor).map(([email,u])=>{
              const left = trialDaysLeft(u);
              const subLeft = subDaysLeft(u);
              const active = isActive(u);
              const expiryDate = u.paidUntil ? new Date(u.paidUntil).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : null;
              return (
                <div className="user-row" key={email}>
                  <div className="user-email">{u.name||email}</div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:8}}>
                    {email}{u.phone ? ` · ${u.phone}` : ""}
                  </div>
                  <div className="user-meta" style={{marginBottom:10}}>
                    {u.paid && active && <span className="user-tag tag-paid">Paid · {expiryDate ? `expires ${expiryDate}` : "no expiry"}</span>}
                    {u.paid && !active && <span className="user-tag tag-expired">Subscription Expired</span>}
                    {!u.paid && left>0 && <span className="user-tag tag-active">Trial · {left}d left</span>}
                    {!u.paid && left===0 && <span className="user-tag tag-expired">Trial Expired</span>}
                    <span style={{fontSize:10,color:"var(--muted)"}}>Joined {new Date(u.registeredAt||Date.now()).toLocaleDateString()}</span>
                  </div>
                  {/* SUBSCRIPTION CONTROL */}
                  {!u.paid || !active ? (
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <select id={"dur-"+email} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 10px",color:"var(--white)",fontSize:11,fontFamily:"DM Sans,sans-serif",flex:1}}>
                        <option value="30">1 Month (30 days)</option>
                        <option value="60">2 Months (60 days)</option>
                        <option value="90">3 Months (90 days)</option>
                        <option value="180">6 Months</option>
                        <option value="365">1 Year</option>
                      </select>
                      <button className="btn btn-green btn-sm" style={{padding:"6px 12px",fontSize:11,whiteSpace:"nowrap"}} onClick={()=>{
                        const days = parseInt(document.getElementById("dur-"+email)?.value||"30");
                        const paidUntil = Date.now() + days*24*60*60*1000;
                        saveUser(email,{paid:true, paidUntil, paidAt:Date.now()});
                        setMsg({text:`✓ Activated for ${days} days. Expires ${new Date(paidUntil).toLocaleDateString()}`, type:"ok"});
                        setTimeout(()=>setMsg({text:"",type:""}),4000);
                      }}>Activate</button>
                    </div>
                  ) : (
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <select id={"ext-"+email} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 10px",color:"var(--white)",fontSize:11,fontFamily:"DM Sans,sans-serif",flex:1}}>
                        <option value="30">Extend 1 Month</option>
                        <option value="60">Extend 2 Months</option>
                        <option value="90">Extend 3 Months</option>
                        <option value="180">Extend 6 Months</option>
                        <option value="365">Extend 1 Year</option>
                      </select>
                      <button className="btn btn-green btn-sm" style={{padding:"6px 12px",fontSize:11,whiteSpace:"nowrap"}} onClick={()=>{
                        const days = parseInt(document.getElementById("ext-"+email)?.value||"30");
                        const base = u.paidUntil && u.paidUntil > Date.now() ? u.paidUntil : Date.now();
                        const paidUntil = base + days*24*60*60*1000;
                        saveUser(email,{paid:true, paidUntil});
                        setMsg({text:`✓ Extended. Now expires ${new Date(paidUntil).toLocaleDateString()}`, type:"ok"});
                        setTimeout(()=>setMsg({text:"",type:""}),4000);
                      }}>Extend</button>
                      <button className="btn btn-red btn-sm" style={{padding:"6px 12px",fontSize:11,whiteSpace:"nowrap"}} onClick={()=>{
                        saveUser(email,{paid:false, paidUntil:null});
                        setMsg({text:"Subscription revoked.",type:"err"});
                        setTimeout(()=>setMsg({text:"",type:""}),3000);
                      }}>Revoke</button>
                    </div>
                  )}
                </div>
              );
            })}
            {msg.text && <div className={msg.type==="ok"?"ok":"err"} style={{marginTop:12}}>{msg.text}</div>}
          </div>
          <div className="footer">GETALEAD ADMIN · All data is local for Beta</div>
        </div>
      </>
    );
  }

  // MAIN APP
  return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="nav">
          <div className="logo">Geta<span>Lead</span></div>
          <div className="nav-right">
            {currentUser && !currentUser.paid && daysLeft>0 && <div className="pill">{daysLeft}d trial</div>}
            {currentUser && getUsers()[currentUser.email]?.paid && isActive(getUsers()[currentUser.email]) && (
              <div className="pill">{getUsers()[currentUser.email]?.paidUntil ? `Pro · ${subDaysLeft(getUsers()[currentUser.email])}d` : "Pro"}</div>
            )}
            <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>

        {!userActive && <div style={{background:"#ff444415",borderBottom:"1px solid #ff444430",padding:"10px 20px",textAlign:"center"}}>
          <span style={{fontSize:12,color:"var(--red)"}}>Trial expired. </span>
          <button className="link-btn" style={{fontSize:12,color:"var(--red)"}} onClick={()=>setPage("paywall")}>Subscribe to continue →</button>
        </div>}

        {userActive && daysLeft>0 && !getUsers()[currentUser.email]?.paid && (
          <div className="trial-bar">
            <span>🎯 Free Trial Active</span>
            <strong>{daysLeft} day{daysLeft!==1?"s":""} remaining</strong>
          </div>
        )}

        <div style={{padding:"16px 0 0"}}>
          <div className="tabs">
            <div className={`tab${tab==="find"?" active":""}`} onClick={()=>{setTab("find");setSelectedHistory(null)}}>Find Leads</div>
            <div className={`tab${tab==="history"?" active":""}`} onClick={()=>setTab("history")}>History ({history.length})</div>
          </div>

          {/* FIND TAB */}
          {tab==="find" && (
            <>
              <div className="card">
                <div className="card-title">Your Business</div>
                <div className="field"><label>Business Name</label><input placeholder="e.g. Grace Beauty Salon" value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})}/></div>
                <div className="field"><label>Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label>Location (City, Country)</label><input placeholder="e.g. Ntinda Kampala, Nairobi Kenya..." value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div>
                <div className="field"><label>What you sell (optional)</label><textarea placeholder="e.g. Hair products, braiding, weaves, nail art..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
                <div className="field"><label>Your WhatsApp Number</label><input placeholder="e.g. 0772123456" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                {msg.text && <div className={msg.type==="ok"?"ok":"err"}>{msg.text}</div>}
                <button className="btn btn-green" style={{marginTop:8}} onClick={userActive?findLeads:()=>setPage("paywall")} disabled={loading}>
                  {loading?"Hunting leads...":"Find My Clients Now →"}
                </button>
              </div>

              {loading && (
                <div className="section">
                  <div className="loading-card">
                    <div className="dots"><div className="dot"/><div className="dot"/><div className="dot"/></div>
                    <div className="loading-text">Geta AI is hunting clients for <strong>{form.businessName}</strong></div>
                    <div className="loading-step">{aiStep}</div>
                  </div>
                </div>
              )}

              {leads.length>0 && !loading && (
                <div className="section">
                  <div className="section-hdr">
                    <div className="section-title">Your Leads</div>
                    <div className="count-pill">{leads.length} Found</div>
                  </div>
                  {leads.map((lead,i)=>(
                    <div className="lead-card" key={i} style={{animationDelay:`${i*0.07}s`}}>
                      <div className="lead-top">
                        <div className="lead-name">{lead.name}</div>
                        <div className="lead-score">⚡{lead.score}%</div>
                      </div>
                      <div className="lead-platform">📍{lead.location} · {lead.platform}{lead.recency ? <span style={{marginLeft:8,background:"#00c85318",color:"var(--green)",borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:600,letterSpacing:"0.5px",border:"1px solid var(--gm)"}}>🕐 {lead.recency}</span> : null}</div>
                      <div className="lead-insight">{lead.insight}</div>
                      <div className="lead-actions">
                        <button className="btn-wa" onClick={()=>{setContacted({...contacted,[i]:true});window.open(`https://wa.me/${lead.phone?.replace(/\D/g,"")}?text=Hello! I'm from ${form.businessName}. I think we can help you.`,'_blank')}}>
                          {contacted[i]?"✓ Sent":"WhatsApp"}
                        </button>
                        <button className="btn-done" onClick={()=>setContacted({...contacted,[i]:true})}>Mark Done</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* HISTORY TAB */}
          {tab==="history" && (
            <div className="section">
              {selectedHistory ? (
                <>
                  <button className="btn btn-outline btn-sm" style={{marginBottom:14}} onClick={()=>setSelectedHistory(null)}>← Back to History</button>
                  <div className="section-hdr">
                    <div className="section-title">Leads from {new Date(selectedHistory.date).toLocaleDateString()}</div>
                    <div className="count-pill">{selectedHistory.items.length}</div>
                  </div>
                  {selectedHistory.items.map((lead,i)=>(
                    <div className="lead-card" key={i} style={{animationDelay:`${i*0.07}s`}}>
                      <div className="lead-top"><div className="lead-name">{lead.name}</div><div className="lead-score">⚡{lead.score}%</div></div>
                      <div className="lead-platform">📍{lead.location} · {lead.platform}{lead.recency ? <span style={{marginLeft:8,background:"#00c85318",color:"var(--green)",borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:600,letterSpacing:"0.5px",border:"1px solid var(--gm)"}}>🕐 {lead.recency}</span> : null}</div>
                      <div className="lead-insight">{lead.insight}</div>
                      <div className="lead-actions">
                        <button className="btn-wa" onClick={()=>window.open(`https://wa.me/${lead.phone?.replace(/\D/g,"")}?text=Hello! I saw you might need our services.`,'_blank')}>WhatsApp</button>
                        <button className="btn-done">Mark Done</button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {history.length===0 && <div style={{textAlign:"center",padding:"30px 0",color:"var(--muted)",fontSize:13}}>No lead history yet.<br/>Find your first leads to see them here.</div>}
                  {history.map((h,i)=>(
                    <div className="history-item" key={i} onClick={()=>setSelectedHistory(h)}>
                      <div className="history-date">{new Date(h.date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short',year:'numeric'})}</div>
                      <div className="history-count">{h.items.length} leads found →</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <div className="footer">GETALEAD · AI Lead Generation · Beta v1.0</div>
      </div>
    </>
  );
}
