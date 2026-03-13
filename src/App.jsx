import { useState, useEffect, useRef } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// REEMPLAZÁ estos dos valores con los tuyos de Supabase
// Los encontrás en: Supabase → tu proyecto → Settings → API
const SUPABASE_URL = "https://jnmbftanbytarnv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_w4GKw4GKzdDILyD8czhn0g_fVxfxG_I";

// Cliente Supabase liviano (sin instalar paquete)
const sb = {
  from: (table) => ({
    _table: table,
    select: (cols="*") => fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}&order=box_numbers`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" }
    }).then(r=>r.json()),
    selectWhere: (cols="*", filter="") => fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}&${filter}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" }
    }).then(r=>r.json()),
    insert: (data) => fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method:"POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type":"application/json", Prefer:"return=representation" },
      body: JSON.stringify(data)
    }).then(r=>r.json()),
    update: (data, filter) => fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method:"PATCH", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type":"application/json", Prefer:"return=representation" },
      body: JSON.stringify(data)
    }).then(r=>r.json()),
    delete: (filter) => fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method:"DELETE", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    }),
    upload: (bucket, path, file) => fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method:"POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: file
    }).then(r=>r.json()),
  }),
  storage: (bucket) => ({
    publicUrl: (path) => `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`,
  })
};

const IG  = "https://www.instagram.com/boxshop.sanrafael";
const MAP = "https://maps.google.com/?q=Av+Rivadavia+135+San+Rafael+Mendoza";
const ADMIN_EMAIL = "admin@boxshop.com";
const ADMIN_PASS  = "admin1234";

// ─── PALETA ───────────────────────────────────────────────────────────────────
const C = {
  electric:"#00C2FF", deep:"#0044AA", navy:"#001B4E",
  gold:"#FFD200", goldDark:"#C9A800",
  white:"#FFFFFF", offwhite:"#F4F8FF",
  glass:"rgba(255,255,255,0.08)", border:"rgba(0,194,255,0.25)",
  light:"rgba(255,255,255,0.9)", muted:"rgba(255,255,255,0.5)", dim:"rgba(255,255,255,0.3)",
  success:"#00E676", danger:"#FF1744", warn:"#FFB300",
};

const CAT_COLORS = {
  "Deportes":["#00C2FF","#0044AA"],"Lencería":["#FF6B9D","#C2185B"],
  "Gastronomía":["#FF9800","#E65100"],"Belleza":["#E040FB","#6A1B9A"],
  "Tecnología":["#00E5FF","#006064"],"Hogar":["#69F0AE","#1B5E20"],
  "Moda":["#FFD740","#FF6D00"],"Calzado":["#FF6E40","#BF360C"],
};
const catGrad = cat => CAT_COLORS[cat] || ["#00C2FF","#0044AA"];
const fmt = n => "$" + Number(n).toLocaleString("es-AR");
const boxLabel = nums => {
  if(!nums?.length) return "Box ?";
  const s=[...nums].sort((a,b)=>a-b);
  return s.length===1?"Box "+s[0]:"Box "+s.join(" y ");
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Outfit',sans-serif;background:#000B1E;color:#fff;min-height:100vh;}
.bebas{font-family:'Bebas Neue',sans-serif;}
::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#001B4E;} ::-webkit-scrollbar-thumb{background:#00C2FF;border-radius:4px;}
.btn{border:none;cursor:pointer;font-family:'Outfit',sans-serif;font-weight:700;border-radius:12px;transition:all .2s cubic-bezier(.34,1.56,.64,1);letter-spacing:.3px;}
.btn:hover{transform:translateY(-2px);} .btn:active{transform:scale(.95);} .btn:disabled{opacity:.35!important;cursor:not-allowed;transform:none!important;}
.inp{width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid rgba(0,194,255,0.3);font-size:14px;font-family:'Outfit',sans-serif;outline:none;color:#fff;transition:border .18s,box-shadow .18s;background:rgba(255,255,255,0.06);}
.inp:focus{border-color:#00C2FF;box-shadow:0 0 0 3px rgba(0,194,255,0.15);} .inp::placeholder{color:rgba(255,255,255,0.3);} select.inp option{background:#001B4E;color:#fff;}
.glass{background:rgba(255,255,255,.05);backdrop-filter:blur(20px);border:1px solid rgba(0,194,255,.2);}
.overlay{position:fixed;inset:0;background:rgba(0,5,20,0.8);backdrop-filter:blur(8px);z-index:600;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}
.modal{background:linear-gradient(145deg,#001533,#000D28);border:1px solid rgba(0,194,255,.3);border-radius:24px;padding:32px;width:100%;max-width:460px;box-shadow:0 40px 80px rgba(0,0,0,.6);max-height:92vh;overflow-y:auto;}
.ig{background:linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:'Outfit',sans-serif;font-weight:700;display:inline-flex;align-items:center;gap:7px;text-decoration:none;transition:all .2s;}
.ig:hover{opacity:.88;transform:translateY(-2px);}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,194,255,.3)}50%{box-shadow:0 0 40px rgba(0,194,255,.7)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;}
.sg>*{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;}
.sg>*:nth-child(1){animation-delay:.05s}.sg>*:nth-child(2){animation-delay:.1s}.sg>*:nth-child(3){animation-delay:.15s}
.sg>*:nth-child(4){animation-delay:.2s}.sg>*:nth-child(5){animation-delay:.25s}.sg>*:nth-child(6){animation-delay:.3s}
.box-card{transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s;cursor:pointer;}
.box-card:hover{transform:translateY(-8px) scale(1.01);box-shadow:0 30px 60px rgba(0,0,0,.5),0 0 40px rgba(0,194,255,.15);}
@media(max-width:640px){.hm{display:none!important}}
`;

// ─── SPINNER ──────────────────────────────────────────────────────────────────
function Spinner({size=40,label=""}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:"48px 24px"}}>
      <div style={{width:size,height:size,border:`3px solid rgba(0,194,255,.2)`,borderTop:`3px solid #00C2FF`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      {label&&<p style={{color:C.muted,fontSize:13}}>{label}</p>}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({msg}){
  if(!msg) return null;
  const ok=!msg.startsWith("❌");
  return(<div style={{position:"fixed",top:76,right:16,zIndex:999,animation:"fadeUp .3s ease",background:ok?"linear-gradient(135deg,#00C2FF,#0044AA)":"linear-gradient(135deg,#FF1744,#C62828)",borderRadius:14,padding:"12px 20px",fontWeight:700,fontSize:13,boxShadow:"0 8px 32px rgba(0,0,0,.4)",display:"flex",alignItems:"center",gap:8}}>{msg}</div>);
}

function Lbl({children}){return <label style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.5)",letterSpacing:1.2,display:"block",marginBottom:5,textTransform:"uppercase"}}>{children}</label>;}

function Field({label,value,onChange,type="text",placeholder="",help=""}){
  return(
    <div style={{marginBottom:14}}>
      {label&&<Lbl>{label}</Lbl>}
      <input className="inp" type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||label||""}/>
      {help&&<p style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:4,lineHeight:1.5}}>{help}</p>}
    </div>
  );
}

function IgSvg({s=15}){return(<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>);}

function BoxAvatar({box,size=54,radius=12}){
  const [err,setErr]=useState(false);
  if(box.logo_url&&!err) return <img src={box.logo_url} alt={box.business_name} onError={()=>setErr(true)} style={{width:size,height:size,borderRadius:radius,objectFit:"cover",flexShrink:0}}/>;
  const [c1,c2]=catGrad(box.cat);
  return(<div style={{width:size,height:size,borderRadius:radius,background:`linear-gradient(135deg,${c1},${c2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.44,flexShrink:0,boxShadow:"0 4px 16px rgba(0,0,0,.4)"}}>{box.emoji||"🏪"}</div>);
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav({view,setView,setActiveBox,cartN,user,onLogout,onLoginClick}){
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{const h=()=>setScrolled(window.scrollY>20);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
  return(
    <nav style={{position:"sticky",top:0,zIndex:200,background:scrolled?"rgba(0,11,30,0.95)":"rgba(0,11,30,0.7)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,194,255,.15)",transition:"background .3s"}}>
      <div style={{maxWidth:1280,margin:"0 auto",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>{setView("home");setActiveBox(null);}}>
          <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#00C2FF,#0044AA)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,194,255,.4)",animation:"glow 3s ease infinite"}}>
            <span className="bebas" style={{fontSize:10,color:"#fff",lineHeight:1.1,textAlign:"center",letterSpacing:.5}}>BOX<br/>SHOP</span>
          </div>
          <div>
            <span className="bebas" style={{fontSize:22,color:"#fff",letterSpacing:2,lineHeight:1,display:"block"}}>BOX <span style={{color:C.electric}}>SHOP</span></span>
            <span style={{fontSize:8,color:C.muted,letterSpacing:3,textTransform:"uppercase",display:"block",marginTop:1}}>PASEO DE COMPRAS</span>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <a className="ig hm" href={IG} target="_blank" rel="noreferrer" style={{padding:"8px 14px",fontSize:12}}><IgSvg s={13}/>Instagram</a>
          <button className="btn" onClick={()=>setView("home")} style={{padding:"8px 14px",fontSize:12,background:view==="home"?"rgba(0,194,255,0.15)":"transparent",color:view==="home"?C.electric:C.muted,border:`1.5px solid ${view==="home"?"rgba(0,194,255,0.4)":"rgba(255,255,255,0.1)"}`,display:"flex",alignItems:"center",gap:6}}>🏬 <span className="hm">Boxes</span></button>
          <button className="btn" onClick={()=>setView("cart")} style={{padding:"8px 14px",fontSize:12,background:view==="cart"?"rgba(0,194,255,0.15)":"transparent",color:view==="cart"?C.electric:C.muted,border:`1.5px solid ${view==="cart"?"rgba(0,194,255,0.4)":"rgba(255,255,255,0.1)"}`,position:"relative",display:"flex",alignItems:"center",gap:6}}>
            🛒 <span className="hm">Carrito</span>
            {cartN>0&&<span style={{position:"absolute",top:-6,right:-6,background:`linear-gradient(135deg,${C.gold},${C.goldDark})`,color:"#000",borderRadius:"50%",width:18,height:18,fontSize:10,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{cartN}</span>}
          </button>
          {!user
            ?<button className="btn" onClick={onLoginClick} style={{padding:"8px 16px",fontSize:12,background:"linear-gradient(135deg,rgba(0,194,255,0.2),rgba(0,68,170,0.2))",color:C.electric,border:"1.5px solid rgba(0,194,255,0.3)",display:"flex",alignItems:"center",gap:6}}>🔑 <span className="hm">Acceso</span></button>
            :<div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(0,194,255,0.08)",border:"1.5px solid rgba(0,194,255,0.2)",borderRadius:12,padding:"6px 12px"}}>
              <BoxAvatar box={user.is_admin?{emoji:"🛡️",cat:""}:user} size={28} radius={8}/>
              <span className="hm" style={{fontSize:12,fontWeight:700,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.light}}>{user.is_admin?"Admin":user.business_name}</span>
              {user.is_admin
                ?<button className="btn" onClick={()=>setView("admin")} style={{background:"linear-gradient(135deg,#6D28D9,#4C1D95)",color:"#fff",padding:"4px 10px",fontSize:11}}>Panel</button>
                :<button className="btn" onClick={()=>setView("box-panel")} style={{background:"linear-gradient(135deg,#00C2FF,#0044AA)",color:"#fff",padding:"4px 10px",fontSize:11}}>Mi Box</button>
              }
              <button className="btn" onClick={onLogout} style={{background:"transparent",color:C.muted,padding:"3px 8px",fontSize:11,border:"1px solid rgba(255,255,255,.1)"}}>✕</button>
            </div>
          }
        </div>
      </div>
    </nav>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginModal({onClose,onLogin,setToast}){
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const handle=async()=>{
    if(!email||!pass) return setErr("Completá email y contraseña");
    setLoading(true); setErr("");
    if(email.trim()===ADMIN_EMAIL&&pass===ADMIN_PASS) return onLogin({email:ADMIN_EMAIL,is_admin:true,business_name:"Administrador",id:"admin"});
    try{
      const boxes=await sb.from("boxes").selectWhere("*",`email=eq.${encodeURIComponent(email.trim())}`);
      const box=Array.isArray(boxes)&&boxes[0];
      if(box&&box.password_plain===pass) return onLogin({...box,is_admin:false});
      setErr("Email o contraseña incorrectos");
    }catch(e){setErr("Error de conexión. Verificá tu configuración de Supabase.");}
    setLoading(false);
  };
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal fade" onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:10,animation:"float 3s ease infinite"}}>🔑</div>
          <h2 className="bebas" style={{fontSize:38,letterSpacing:2,background:"linear-gradient(135deg,#fff,#00C2FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ACCESO</h2>
          <p style={{color:C.muted,fontSize:13,marginTop:4}}>Boxes · Administración</p>
        </div>
        {err&&<div style={{background:"rgba(255,23,68,0.15)",border:"1.5px solid rgba(255,23,68,0.4)",borderRadius:10,padding:"10px 14px",color:"#FF6B6B",fontSize:12,fontWeight:700,marginBottom:16}}>{err}</div>}
        <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="tubox@boxshop.com"/>
        <Field label="Contraseña" value={pass} onChange={setPass} type="password" placeholder="••••••••"/>
        <button className="btn" onClick={handle} disabled={loading} style={{width:"100%",background:"linear-gradient(135deg,#00C2FF,#0044AA)",color:"#fff",padding:"14px",fontSize:15,marginBottom:10,marginTop:4,boxShadow:"0 4px 20px rgba(0,194,255,.35)"}}>
          {loading?<><span style={{display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 1s linear infinite",marginRight:8}}/> Ingresando...</>:"Ingresar →"}
        </button>
        <button className="btn" onClick={onClose} style={{width:"100%",background:"rgba(255,255,255,0.06)",color:C.muted,padding:"11px",fontSize:13,border:"1px solid rgba(255,255,255,.1)"}}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function Home({boxes,shopConfig,setView,setActiveBox,loading}){
  const [cat,setCat]=useState("Todos");
  const cats=["Todos",...[...new Set(boxes.filter(b=>b.active&&b.cat).map(b=>b.cat))]];
  const visible=boxes.filter(b=>b.active).filter(b=>cat==="Todos"||b.cat===cat);
  const available=boxes.filter(b=>!b.active);
  const activeBanners=(shopConfig?.banners||[]).filter(b=>b.active);
  const [bannerIdx,setBannerIdx]=useState(0);
  useEffect(()=>{if(activeBanners.length<=1)return;const t=setInterval(()=>setBannerIdx(i=>(i+1)%activeBanners.length),4000);return()=>clearInterval(t);},[activeBanners.length]);

  return(
    <div>
      {activeBanners.length>0&&(
        <div style={{background:activeBanners[bannerIdx]?.color||"linear-gradient(135deg,#FFD200,#FF6F00)",transition:"background .6s",padding:"10px 24px",textAlign:"center",fontSize:13,fontWeight:700,color:"#fff",letterSpacing:.3,boxShadow:"0 2px 16px rgba(0,0,0,.3)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.04) 40px,rgba(255,255,255,0.04) 41px)",pointerEvents:"none"}}/>
          <span style={{position:"relative"}}>{activeBanners[bannerIdx]?.text}</span>
          {activeBanners.length>1&&<div style={{display:"flex",gap:5,justifyContent:"center",marginTop:5}}>{activeBanners.map((_,i)=><div key={i} onClick={()=>setBannerIdx(i)} style={{width:i===bannerIdx?18:6,height:6,borderRadius:3,background:i===bannerIdx?"rgba(255,255,255,.9)":"rgba(255,255,255,.3)",transition:"all .3s",cursor:"pointer"}}/>)}</div>}
        </div>
      )}
      {/* HERO */}
      <div style={{position:"relative",height:"clamp(360px,52vw,560px)",overflow:"hidden",background:"linear-gradient(135deg,#001B4E,#000B1E)"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 30% 60%,rgba(0,194,255,.15),transparent 60%),radial-gradient(circle at 80% 30%,rgba(0,68,170,.2),transparent 50%)"}}/>
        <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,194,255,0.015) 2px,rgba(0,194,255,0.015) 4px)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 24px 48px",textAlign:"center"}}>
          <div style={{display:"inline-block",marginBottom:20}}>
            <div style={{background:"rgba(255,255,255,0.97)",borderRadius:16,padding:"12px 28px",boxShadow:"0 0 60px rgba(0,194,255,.5),0 20px 40px rgba(0,0,0,.4)",border:"3px solid #0044AA",position:"relative",display:"inline-block"}}>
              <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",width:"60%",height:8,background:"#0044AA",borderRadius:"4px 4px 0 0"}}/>
              <div className="bebas" style={{fontSize:"clamp(44px,9vw,88px)",color:"#001B4E",lineHeight:.9,letterSpacing:3}}>BOX<br/>SHOP</div>
              <div style={{fontSize:"clamp(7px,1.2vw,11px)",color:"#0044AA",fontWeight:800,letterSpacing:4,textTransform:"uppercase",textAlign:"center",marginTop:6}}>PASEO DE COMPRAS</div>
            </div>
          </div>
          <p style={{color:"rgba(255,255,255,.85)",fontSize:"clamp(14px,2.2vw,18px)",fontWeight:500,marginBottom:24,textShadow:"0 2px 10px rgba(0,0,0,.5)"}}>Todo lo que necesitás en un solo lugar</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <a href={MAP} target="_blank" rel="noreferrer" style={{background:"rgba(255,255,255,0.1)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff",padding:"9px 18px",borderRadius:12,fontSize:13,fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",gap:7,transition:"all .2s"}}>📍 Av. Rivadavia 135 · San Rafael</a>
            <a className="ig" href={IG} target="_blank" rel="noreferrer" style={{padding:"9px 18px",fontSize:13}}><IgSvg s={14}/> @boxshop.sanrafael</a>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{background:"linear-gradient(135deg,#001B4E,#000B1E)",borderBottom:"1px solid rgba(0,194,255,.15)"}}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"14px 24px",display:"flex",gap:32,justifyContent:"center",flexWrap:"wrap"}}>
          {[[boxes.filter(b=>b.active).length+"","Boxes activos","⚡"],[boxes.filter(b=>b.delivery&&b.active).length+"","Con envío","🚚"],["31","Boxes totales","🏬"]].map(([n,l,ic])=>(
            <div key={l} style={{textAlign:"center",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{ic}</span><div><div className="bebas" style={{fontSize:26,color:C.electric,lineHeight:1}}>{n}</div><div style={{fontSize:10,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>{l}</div></div></div>
          ))}
        </div>
      </div>

      {/* HORARIOS + MAPA */}
      <div style={{maxWidth:1280,margin:"0 auto",padding:"28px 24px 0",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(0,194,255,.15)",borderRadius:18,padding:"22px 24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <span style={{fontSize:26}}>🕐</span>
            <div><p style={{fontWeight:800,fontSize:15}}>Horarios del Shopping</p><p style={{color:C.muted,fontSize:11}}>Av. Rivadavia 135, San Rafael</p></div>
          </div>
          {(shopConfig?.hours||[]).map((h,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<(shopConfig.hours.length-1)?"1px solid rgba(255,255,255,.06)":"none"}}>
              <span style={{color:C.muted,fontSize:13}}>{h.day}</span>
              <span style={{fontWeight:700,fontSize:13,color:C.electric}}>{h.time}</span>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(0,194,255,.15)",borderRadius:18,overflow:"hidden",minHeight:200,position:"relative"}}>
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3317.5!2d-68.3332!3d-34.6178!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sAv.+Rivadavia+135%2C+San+Rafael%2C+Mendoza!5e0!3m2!1ses!2sar!4v1" width="100%" height="100%" style={{border:0,display:"block",minHeight:200,filter:"invert(90%) hue-rotate(180deg)"}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Ubicación Box Shop"/>
          <a href={MAP} target="_blank" rel="noreferrer" style={{position:"absolute",bottom:12,right:12,background:"linear-gradient(135deg,#00C2FF,#0044AA)",color:"#fff",padding:"8px 14px",borderRadius:10,fontSize:12,fontWeight:700,textDecoration:"none",boxShadow:"0 4px 16px rgba(0,0,0,.4)"}}>📍 Abrir en Maps</a>
        </div>
      </div>

      {/* GRID */}
      <div style={{maxWidth:1280,margin:"0 auto",padding:"36px 24px 64px"}}>
        <div style={{display:"flex",gap:8,marginBottom:32,flexWrap:"wrap",alignItems:"center"}}>
          <span className="bebas" style={{fontSize:18,color:C.muted,letterSpacing:2,marginRight:4}}>FILTRAR:</span>
          {cats.map(c=>{const active=cat===c;const [c1,c2]=c==="Todos"?[C.electric,C.deep]:catGrad(c);return(
            <button key={c} className="btn" onClick={()=>setCat(c)} style={{padding:"7px 16px",fontSize:12,fontWeight:700,background:active?`linear-gradient(135deg,${c1},${c2})`:"rgba(255,255,255,.05)",color:active?"#fff":C.muted,border:`1.5px solid ${active?"transparent":"rgba(255,255,255,.1)"}`,boxShadow:active?"0 4px 16px rgba(0,0,0,.3)":"none"}}>{c}</button>
          );})}
        </div>
        {loading?<Spinner label="Cargando boxes..."/>
        :<div className="sg" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20}}>
          {visible.map(box=>{const [c1,c2]=catGrad(box.cat);return(
            <div key={box.id} className="box-card" onClick={()=>{setActiveBox(box.id);setView("catalog");}}
              style={{background:"linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.03))",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,overflow:"hidden",position:"relative"}}>
              <div style={{height:120,background:`linear-gradient(135deg,${c1}33,${c2}55)`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 70% 50%,${c1}44,transparent 60%)`}}/>
                {box.logo_url?<img src={box.logo_url} alt={box.business_name} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>
                  :<span style={{fontSize:56,position:"relative",filter:"drop-shadow(0 4px 12px rgba(0,0,0,.4))",animation:"float 4s ease infinite"}}>{box.emoji}</span>}
                <div style={{position:"absolute",top:12,left:12,background:`linear-gradient(135deg,${c1},${c2})`,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:900}}>{boxLabel(box.box_numbers)}</div>
                {box.cat&&<div style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,.5)",backdropFilter:"blur(8px)",borderRadius:8,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>{box.cat}</div>}
              </div>
              <div style={{padding:"18px 18px 16px"}}>
                <h3 style={{fontSize:17,fontWeight:800,marginBottom:5,lineHeight:1.2}}>{box.business_name}</h3>
                {box.hours&&<p style={{color:C.muted,fontSize:12,fontWeight:500,marginBottom:6}}>🕐 {box.hours}</p>}
                <p style={{color:"rgba(255,255,255,.45)",fontSize:12,lineHeight:1.5,marginBottom:14}}>{box.description}</p>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  {box.delivery?<span style={{fontSize:11,fontWeight:700,color:C.success,background:"rgba(0,230,118,.12)",padding:"4px 10px",borderRadius:8,border:"1px solid rgba(0,230,118,.2)"}}>{box.delivery_cost===0?"🚚 Envío gratis":`🚚 Envío ${fmt(box.delivery_cost)}`}</span>
                    :<span style={{fontSize:11,fontWeight:600,color:C.muted,background:"rgba(255,255,255,.05)",padding:"4px 10px",borderRadius:8}}>📦 Solo retiro</span>}
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {box.whatsapp&&<a href={"https://wa.me/549"+box.whatsapp.replace(/\D/g,"")} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{background:"#25D366",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,textDecoration:"none",flexShrink:0,boxShadow:"0 2px 8px rgba(37,211,102,.4)",transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>💬</a>}
                    <span style={{fontSize:12,fontWeight:700,color:C.electric,display:"flex",alignItems:"center",gap:4}}>Ver catálogo <span style={{fontSize:16}}>→</span></span>
                  </div>
                </div>
              </div>
              <div style={{height:2,background:`linear-gradient(90deg,transparent,${c1},transparent)`}}/>
            </div>
          );})}
        </div>}
        {available.length>0&&<div style={{marginTop:32,padding:"16px 24px",background:"rgba(255,255,255,.03)",border:"1px dashed rgba(255,255,255,.1)",borderRadius:16,textAlign:"center"}}><p style={{color:C.dim,fontSize:13,fontWeight:600}}>🏪 {available.map(b=>boxLabel(b.box_numbers)).join(" · ")} — Disponibles para alquilar</p></div>}
      </div>
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({p,box,qty,addToCart}){
  const [c1,c2]=catGrad(box.cat);
  const q=qty(p.id);
  return(
    <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,overflow:"hidden",transition:"transform .2s,box-shadow .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.4)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
      {p.img_url
        ?<img src={p.img_url} alt={p.name} style={{width:"100%",height:140,objectFit:"cover"}}/>
        :<div style={{height:140,background:`linear-gradient(135deg,${c1}33,${c2}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:60}}>{p.emoji}</div>}
      <div style={{padding:"14px"}}>
        {p.subcategory&&<span style={{fontSize:10,fontWeight:800,color:C.electric,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:4}}>{p.subcategory}</span>}
        <p style={{fontWeight:700,fontSize:14,marginBottom:3,lineHeight:1.3}}>{p.name}</p>
        <p style={{color:C.muted,fontSize:11,lineHeight:1.4,marginBottom:12}}>{p.description}</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
          <span className="bebas" style={{fontSize:24,color:C.electric,letterSpacing:1}}>{fmt(p.price)}</span>
          {q===0
            ?<button className="btn" onClick={()=>addToCart(p,box)} style={{background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",padding:"7px 13px",fontSize:12}}>+ Agregar</button>
            :<div style={{display:"flex",alignItems:"center",gap:6}}>
              <button className="btn" onClick={()=>addToCart({...p,_dec:true},box)} style={{background:"rgba(255,255,255,.1)",color:"#fff",width:28,height:28,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <span style={{fontWeight:800,color:C.electric,minWidth:20,textAlign:"center"}}>{q}</span>
              <button className="btn" onClick={()=>addToCart(p,box)} style={{background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",width:28,height:28,borderRadius:8,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            </div>}
        </div>
      </div>
    </div>
  );
}

// ─── CATALOG ──────────────────────────────────────────────────────────────────
function Catalog({boxId,boxes,products,cart,addToCart,setView,setActiveBox,loadingProds}){
  const box=boxes.find(b=>b.id===boxId); if(!box) return null;
  const prods=products[boxId]||[];
  const qty=id=>cart.find(i=>i.id===id)?.qty||0;
  const [c1,c2]=catGrad(box.cat);

  // Categorías internas del box (subcategorías de productos)
  const subcats=["Todos",...[...new Set(prods.filter(p=>p.subcategory).map(p=>p.subcategory))]];
  const hasSubcats=subcats.length>1;
  const [activeSub,setActiveSub]=useState("Todos");

  // Productos filtrados por subcategoría activa
  const filtered=activeSub==="Todos"?prods:prods.filter(p=>p.subcategory===activeSub);

  // Agrupar por subcategoría para mostrar secciones
  const grouped=[];
  if(hasSubcats&&activeSub==="Todos"){
    // Primero los sin categoría, luego cada grupo
    const sinCat=prods.filter(p=>!p.subcategory);
    const conCat=[...new Set(prods.filter(p=>p.subcategory).map(p=>p.subcategory))];
    if(sinCat.length>0) grouped.push({title:null,items:sinCat});
    conCat.forEach(sc=>grouped.push({title:sc,items:prods.filter(p=>p.subcategory===sc)}));
  } else {
    grouped.push({title:null,items:filtered});
  }

  if(box.catalog_link) return(
    <div className="fade" style={{maxWidth:600,margin:"0 auto",padding:"48px 24px",textAlign:"center"}}>
      <button className="btn" onClick={()=>{setView("home");setActiveBox(null);}} style={{background:"rgba(255,255,255,.06)",color:C.muted,border:"1px solid rgba(255,255,255,.1)",padding:"8px 16px",fontSize:12,marginBottom:36}}>← Volver</button>
      <BoxAvatar box={box} size={90} radius={18}/>
      <h2 className="bebas" style={{fontSize:44,marginTop:16,marginBottom:6,letterSpacing:2,background:`linear-gradient(135deg,${c1},${c2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{box.business_name}</h2>
      <p style={{color:C.muted,marginBottom:32}}>{boxLabel(box.box_numbers)} · {box.cat}</p>
      <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:32}}>
        <div style={{fontSize:48,marginBottom:16}}>🛍️</div>
        <p style={{fontWeight:700,fontSize:16,marginBottom:8}}>Este box tiene su tienda propia</p>
        <p style={{color:C.muted,fontSize:13,marginBottom:28,lineHeight:1.6}}>Vas a ver todos sus productos en su catálogo online.</p>
        <a href={box.catalog_link} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",padding:"14px 28px",borderRadius:14,fontWeight:800,fontSize:15,textDecoration:"none"}}>Ver catálogo ↗</a>
      </div>
    </div>
  );

  return(
    <div className="fade" style={{maxWidth:1280,margin:"0 auto",padding:"28px 24px 64px"}}>
      <button className="btn" onClick={()=>{setView("home");setActiveBox(null);}} style={{background:"rgba(255,255,255,.06)",color:C.muted,border:"1px solid rgba(255,255,255,.1)",padding:"8px 16px",fontSize:12,marginBottom:24}}>← Volver a boxes</button>

      {/* Header del box */}
      <div style={{background:`linear-gradient(135deg,${c1}22,${c2}11)`,border:`1px solid ${c1}33`,borderRadius:24,padding:"28px",marginBottom:hasSubcats?20:28,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,background:`radial-gradient(circle,${c1}22,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",position:"relative"}}>
          <BoxAvatar box={box} size={80} radius={16}/>
          <div style={{flex:1,minWidth:200}}>
            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <span style={{background:`linear-gradient(135deg,${c1},${c2})`,borderRadius:8,padding:"3px 12px",fontSize:11,fontWeight:800}}>{boxLabel(box.box_numbers)}</span>
              {box.cat&&<span style={{background:"rgba(255,255,255,.1)",borderRadius:8,padding:"3px 12px",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase"}}>{box.cat}</span>}
              <span style={{background:"rgba(255,255,255,.07)",borderRadius:8,padding:"3px 12px",fontSize:11,fontWeight:600,color:C.dim}}>{prods.length} productos</span>
            </div>
            <h1 className="bebas" style={{fontSize:42,letterSpacing:2,marginBottom:6,lineHeight:1}}>{box.business_name}</h1>
            <p style={{color:C.muted,fontSize:14}}>{box.description}</p>
            {box.hours&&<p style={{color:C.muted,fontSize:12,marginTop:6,fontWeight:600}}>🕐 {box.hours}</p>}
            {box.whatsapp&&<a href={"https://wa.me/549"+box.whatsapp.replace(/\D/g,"")} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(37,211,102,.12)",border:"1px solid rgba(37,211,102,.25)",borderRadius:10,padding:"7px 14px",fontSize:13,fontWeight:700,color:"#25D366",textDecoration:"none",marginTop:8}}>💬 Consultar por WhatsApp</a>}
          </div>
          <div>{box.delivery?<span style={{background:"rgba(0,230,118,.12)",color:C.success,fontWeight:800,fontSize:13,padding:"10px 16px",borderRadius:12,display:"block",border:"1px solid rgba(0,230,118,.2)"}}>🚚 {box.delivery_cost===0?"Envío gratis":`Envío ${fmt(box.delivery_cost)}`}</span>:<span style={{background:"rgba(255,255,255,.06)",color:C.muted,fontWeight:600,fontSize:13,padding:"10px 16px",borderRadius:12,display:"block"}}>📦 Solo retiro en box</span>}</div>
        </div>
      </div>

      {/* Filtros de subcategoría */}
      {hasSubcats&&<div style={{display:"flex",gap:8,marginBottom:28,flexWrap:"wrap",alignItems:"center",padding:"16px 20px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16}}>
        <span style={{fontSize:11,fontWeight:800,color:C.dim,letterSpacing:1.5,textTransform:"uppercase",marginRight:4}}>VER:</span>
        {subcats.map(sc=>{
          const active=activeSub===sc;
          const count=sc==="Todos"?prods.length:prods.filter(p=>p.subcategory===sc).length;
          return(
            <button key={sc} className="btn" onClick={()=>setActiveSub(sc)}
              style={{padding:"8px 18px",fontSize:13,fontWeight:700,
                background:active?`linear-gradient(135deg,${c1},${c2})`:"rgba(255,255,255,.06)",
                color:active?"#fff":C.muted,
                border:`1.5px solid ${active?"transparent":"rgba(255,255,255,.1)"}`,
                display:"flex",alignItems:"center",gap:7}}>
              {sc}
              <span style={{fontSize:10,fontWeight:900,background:active?"rgba(255,255,255,.25)":"rgba(255,255,255,.1)",borderRadius:20,padding:"2px 7px"}}>{count}</span>
            </button>
          );
        })}
      </div>}

      {/* Productos */}
      {loadingProds?<Spinner label="Cargando productos..."/>
      :prods.length===0
        ?<div style={{textAlign:"center",padding:"72px 24px",background:"rgba(255,255,255,.03)",border:"1px dashed rgba(255,255,255,.1)",borderRadius:20}}>
          <div style={{fontSize:64,marginBottom:16,animation:"float 3s ease infinite"}}>📦</div>
          <p style={{fontWeight:800,fontSize:18}}>Este box no tiene productos todavía</p>
        </div>
        :<div>
          {grouped.map((group,gi)=>(
            <div key={gi} style={{marginBottom:group.title?36:0}}>
              {/* Título de sección */}
              {group.title&&<div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{height:2,flex:1,background:`linear-gradient(90deg,${c1}66,transparent)`}}/>
                <span className="bebas" style={{fontSize:22,letterSpacing:2,color:C.electric,whiteSpace:"nowrap"}}>{group.title}</span>
                <span style={{fontSize:11,color:C.dim,fontWeight:700,background:"rgba(255,255,255,.07)",padding:"3px 10px",borderRadius:20}}>{group.items.length} artículos</span>
                <div style={{height:2,flex:1,background:`linear-gradient(270deg,${c1}66,transparent)`}}/>
              </div>}
              <div className="sg" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
                {group.items.map(p=><ProductCard key={p.id} p={p} box={box} qty={qty} addToCart={addToCart}/>)}
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}

// ─── CART ─────────────────────────────────────────────────────────────────────
function Cart({cart,addToCart,setView,clearCart}){
  const [paid,setPaid]=useState({});
  const byBox=cart.reduce((acc,item)=>{if(!acc[item.boxId])acc[item.boxId]={box:item.box,items:[]};acc[item.boxId].items.push(item);return acc;},{});
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const allPaid=Object.keys(byBox).length>0&&Object.keys(byBox).every(id=>paid[id]);
  const waMsg=(box,items)=>{const sub=items.reduce((s,i)=>s+i.price*i.qty,0);const lines=items.map(i=>`• ${i.name} x${i.qty} — ${fmt(i.price*i.qty)}`).join("\n");return `https://wa.me/?text=${encodeURIComponent(`Hola ${box.business_name} 👋\nPedido desde Box Shop:\n\n${lines}\n\nTotal: ${fmt(sub)}\n\n¿Me compartís tu link de pago?`)}`;}
  if(allPaid)return(<div className="fade" style={{maxWidth:520,margin:"52px auto",padding:"0 24px",textAlign:"center"}}><div style={{background:"linear-gradient(145deg,#001B4E,#000B1E)",border:"1px solid rgba(0,194,255,.3)",borderRadius:24,padding:"48px 32px",marginBottom:20}}><div style={{fontSize:72,marginBottom:16,animation:"float 2s ease infinite"}}>🎉</div><h2 className="bebas" style={{fontSize:52,letterSpacing:3,background:"linear-gradient(135deg,#00C2FF,#FFD200)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>¡LISTO!</h2><p style={{color:C.muted,fontSize:15}}>Tus pedidos fueron enviados.</p></div><button className="btn" onClick={()=>{clearCart();setView("home");setPaid({});}} style={{background:"linear-gradient(135deg,#00C2FF,#0044AA)",color:"#fff",padding:"14px",fontSize:15,width:"100%",borderRadius:14}}>Seguir comprando</button></div>);
  if(cart.length===0)return(<div className="fade" style={{textAlign:"center",padding:"80px 24px"}}><div style={{fontSize:80,marginBottom:16,animation:"float 3s ease infinite"}}>🛒</div><h2 className="bebas" style={{fontSize:46,letterSpacing:3,marginBottom:12,background:"linear-gradient(135deg,#fff,#00C2FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CARRITO VACÍO</h2><p style={{color:C.muted,marginBottom:32}}>Explorá los boxes de Box Shop</p><button className="btn" onClick={()=>setView("home")} style={{background:"linear-gradient(135deg,#00C2FF,#0044AA)",color:"#fff",padding:"13px 32px",fontSize:15}}>Ver boxes →</button></div>);
  return(
    <div className="fade" style={{maxWidth:820,margin:"0 auto",padding:"28px 24px 64px"}}>
      <h1 className="bebas" style={{fontSize:48,letterSpacing:3,marginBottom:6,background:"linear-gradient(135deg,#fff,#00C2FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TU CARRITO</h1>
      <p style={{color:C.muted,fontSize:13,marginBottom:24}}>Pagás directamente a cada box — sin comisiones extra.</p>
      <div style={{background:"rgba(0,194,255,.06)",border:"1px solid rgba(0,194,255,.2)",borderRadius:14,padding:"12px 16px",marginBottom:24,display:"flex",gap:10,fontSize:13}}><span style={{fontSize:20}}>💡</span><p style={{color:C.light,lineHeight:1.6}}>Hacé click en <b style={{color:C.electric}}>"Pagar a [box]"</b>, pagás con Mercado Pago, después tocás <b style={{color:C.electric}}>"Ya pagué"</b>.</p></div>
      {Object.values(byBox).map(({box,items})=>{
        const sub=items.reduce((s,i)=>s+i.price*i.qty,0);const isPaid=paid[box.id];const [c1,c2]=catGrad(box.cat);const deliv=box.delivery?(box.delivery_cost===0?0:box.delivery_cost):null;
        return(<div key={box.id} style={{background:isPaid?"rgba(0,230,118,.04)":"rgba(255,255,255,.04)",border:`1px solid ${isPaid?"rgba(0,230,118,.3)":"rgba(255,255,255,.08)"}`,borderRadius:18,padding:20,marginBottom:14,transition:"all .3s"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.06)"}}>
            <BoxAvatar box={box} size={46} radius={12}/>
            <div style={{flex:1}}><p style={{fontWeight:800,fontSize:15}}>{box.business_name}</p><p style={{color:C.dim,fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>{boxLabel(box.box_numbers)} · PAGO DIRECTO SIN COMISIÓN</p></div>
            {isPaid?<span style={{background:"rgba(0,230,118,.15)",color:C.success,fontWeight:800,fontSize:13,padding:"7px 14px",borderRadius:10,border:"1px solid rgba(0,230,118,.3)"}}>✓ Pagado</span>:<span className="bebas" style={{fontSize:26,color:C.electric,letterSpacing:1}}>{fmt(sub+(deliv||0))}</span>}
          </div>
          {items.map(item=>(<div key={item.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,opacity:isPaid?.5:1}}>
            <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${c1}33,${c2}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{item.img_url?<img src={item.img_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:10}}/>:item.emoji}</div>
            <div style={{flex:1}}><p style={{fontWeight:700,fontSize:13}}>{item.name}</p><p style={{color:C.dim,fontSize:11}}>{fmt(item.price)} c/u</p></div>
            {!isPaid&&<div style={{display:"flex",alignItems:"center",gap:5}}><button className="btn" onClick={()=>addToCart({...item,_dec:true},box)} style={{background:"rgba(255,255,255,.08)",color:"#fff",width:26,height:26,borderRadius:7,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button><span style={{fontWeight:800,color:C.electric,minWidth:18,textAlign:"center",fontSize:13}}>{item.qty}</span><button className="btn" onClick={()=>addToCart(item,box)} style={{background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",width:26,height:26,borderRadius:7,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button></div>}
            <span className="bebas" style={{fontSize:20,color:isPaid?C.muted:C.electric,minWidth:80,textAlign:"right",letterSpacing:1}}>{fmt(item.price*item.qty)}</span>
          </div>))}
          {deliv!==null&&!isPaid&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.06)",marginTop:4}}><span>Envío</span><span style={{fontWeight:700,color:deliv===0?C.success:"#fff"}}>{deliv===0?"GRATIS":fmt(deliv)}</span></div>}
          {!isPaid?<div style={{borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:14,marginTop:8,display:"flex",gap:9,flexWrap:"wrap"}}>
            <button className="btn" onClick={()=>window.open(box.mp_link||waMsg(box,items),"_blank")} style={{flex:1,background:"linear-gradient(135deg,#009EE3,#003087)",color:"#fff",padding:"12px 16px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,minWidth:160}}>💳 Pagar a {box.business_name}</button>
            <button className="btn" onClick={()=>setPaid(p=>({...p,[box.id]:true}))} style={{background:"rgba(0,230,118,.1)",color:C.success,border:"1.5px solid rgba(0,230,118,.3)",padding:"11px 18px",fontSize:13}}>✓ Ya pagué</button>
          </div>:<div style={{borderTop:"1px solid rgba(0,230,118,.15)",paddingTop:10,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><p style={{color:C.success,fontSize:13,fontWeight:700}}>✓ Pago realizado</p><button className="btn" onClick={()=>setPaid(p=>{const n={...p};delete n[box.id];return n;})} style={{background:"transparent",color:C.muted,fontSize:11,padding:"3px 9px",border:"1px solid rgba(255,255,255,.1)"}}>Deshacer</button></div>}
        </div>);
      })}
      <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:20,marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontWeight:600,fontSize:13,color:C.muted}}>Progreso</span><span style={{fontWeight:800,fontSize:13,color:C.electric}}>{Object.keys(paid).length}/{Object.keys(byBox).length} boxes</span></div>
        <div style={{background:"rgba(255,255,255,.08)",borderRadius:8,height:6,overflow:"hidden",marginBottom:16}}><div style={{height:"100%",background:"linear-gradient(90deg,#00C2FF,#00E676)",borderRadius:8,width:`${(Object.keys(paid).length/Math.max(Object.keys(byBox).length,1))*100}%`,transition:"width .5s cubic-bezier(.34,1.56,.64,1)"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:900}}><span style={{fontSize:15,color:C.muted}}>Total estimado</span><span className="bebas" style={{color:C.electric,fontSize:32,letterSpacing:1}}>{fmt(total)}</span></div>
      </div>
    </div>
  );
}

// ─── BOX PANEL ────────────────────────────────────────────────────────────────
function BoxPanel({user,boxes,setBoxes,products,setProducts,setToast}){
  const box=boxes.find(b=>b.id===user.id)||user;
  const prods=products[box.id]||[];
  const [tab,setTab]=useState("productos");
  const [editing,setEditing]=useState(null);
  const [adding,setAdding]=useState(false);
  const [saving,setSaving]=useState(false);
  const [blank,setBlank]=useState({name:"",price:"",emoji:"📦",description:"",subcategory:""});
  const [info,setInfo]=useState({business_name:box.business_name,description:box.description,hours:box.hours||"",delivery:box.delivery,delivery_cost:box.delivery_cost,delivery_note:box.delivery_note,mp_link:box.mp_link||""});
  const [passForm,setPassForm]=useState({current:"",newp:"",confirm:""});
  const [c1,c2]=catGrad(box.cat);
  const showT=msg=>{setToast(msg);setTimeout(()=>setToast(""),2500);};
  const imgRef=useRef(); const prodImgRef=useRef();

  const uploadLogo=async(e)=>{
    const file=e.target.files[0]; if(!file) return;
    setSaving(true);
    try{
      const ext=file.name.split(".").pop();
      const path=`logos/${box.id}.${ext}`;
      const res=await fetch(`${SUPABASE_URL}/storage/v1/object/box-images/${path}`,{method:"POST",headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Content-Type":file.type},body:file});
      const url=`${SUPABASE_URL}/storage/v1/object/public/box-images/${path}`;
      await sb.from("boxes").update({logo_url:url},`id=eq.${box.id}`);
      setBoxes(p=>p.map(b=>b.id===box.id?{...b,logo_url:url}:b));
      showT("✓ Logo actualizado");
    }catch(e){showT("❌ Error subiendo imagen");}
    setSaving(false);
  };

  const saveInfo=async()=>{
    setSaving(true);
    try{
      await sb.from("boxes").update(info,`id=eq.${box.id}`);
      setBoxes(p=>p.map(b=>b.id===box.id?{...b,...info}:b));
      showT("✓ Información actualizada");
    }catch(e){showT("❌ Error guardando");}
    setSaving(false);
  };

  const addProd=async()=>{
    if(!blank.name||!blank.price) return showT("❌ Nombre y precio obligatorios");
    setSaving(true);
    try{
      const res=await sb.from("products").insert({box_id:box.id,name:blank.name,price:Number(blank.price),emoji:blank.emoji,description:blank.description,subcategory:blank.subcategory||null});
      const newProd=Array.isArray(res)?res[0]:res;
      setProducts(p=>({...p,[box.id]:[...(p[box.id]||[]),newProd]}));
      setBlank({name:"",price:"",emoji:"📦",description:""});setAdding(false);
      showT("✓ Producto agregado");
    }catch(e){showT("❌ Error guardando");}
    setSaving(false);
  };

  const saveProd=async()=>{
    setSaving(true);
    try{
      await sb.from("products").update({name:editing.name,price:editing.price,emoji:editing.emoji,description:editing.description,subcategory:editing.subcategory||null},`id=eq.${editing.id}`);
      setProducts(p=>({...p,[box.id]:p[box.id].map(x=>x.id===editing.id?editing:x)}));
      setEditing(null);showT("✓ Guardado");
    }catch(e){showT("❌ Error guardando");}
    setSaving(false);
  };

  const delProd=async(id)=>{
    if(!window.confirm("¿Eliminar producto?")) return;
    await sb.from("products").delete(`id=eq.${id}`);
    setProducts(p=>({...p,[box.id]:p[box.id].filter(x=>x.id!==id)}));
    showT("✓ Eliminado");
  };

  const changePass=async()=>{
    if(!passForm.current||!passForm.newp||!passForm.confirm) return showT("❌ Completá todos los campos");
    if(passForm.current!==box.password_plain) return showT("❌ La contraseña actual no es correcta");
    if(passForm.newp.length<6) return showT("❌ Mínimo 6 caracteres");
    if(passForm.newp!==passForm.confirm) return showT("❌ Las contraseñas no coinciden");
    setSaving(true);
    try{
      await sb.from("boxes").update({password_plain:passForm.newp},`id=eq.${box.id}`);
      setBoxes(p=>p.map(b=>b.id===box.id?{...b,password_plain:passForm.newp}:b));
      setPassForm({current:"",newp:"",confirm:""});
      showT("✓ Contraseña actualizada");
    }catch(e){showT("❌ Error guardando");}
    setSaving(false);
  };

  const TABS=[["productos","📦 Productos"],["info","🏪 Mi Box"],["envio","🚚 Envío"],["pago","💳 Pago"],["pass","🔑 Contraseña"]];

  return(
    <div className="fade" style={{maxWidth:900,margin:"0 auto",padding:"28px 24px 64px"}}>
      <div style={{background:`linear-gradient(135deg,${c1}22,${c2}11)`,border:`1px solid ${c1}33`,borderRadius:22,padding:"24px",marginBottom:24,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,background:`radial-gradient(circle,${c1}22,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",position:"relative"}}>
          <div style={{position:"relative",cursor:"pointer"}} onClick={()=>imgRef.current.click()}>
            <input ref={imgRef} type="file" accept="image/*" style={{display:"none"}} onChange={uploadLogo}/>
            <BoxAvatar box={box} size={80} radius={16}/>
            <div style={{position:"absolute",bottom:-4,right:-4,background:`linear-gradient(135deg,${c1},${c2})`,borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>📷</div>
          </div>
          <div style={{flex:1}}>
            <p style={{color:C.dim,fontSize:10,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",marginBottom:4}}>PANEL DE BOX</p>
            <h1 className="bebas" style={{fontSize:36,letterSpacing:2,lineHeight:1}}>{box.business_name}</h1>
            <p style={{color:C.muted,fontSize:12,marginTop:4}}>{boxLabel(box.box_numbers)} · {box.email}</p>
          </div>
          <div style={{textAlign:"center",background:"rgba(255,255,255,.06)",borderRadius:14,padding:"12px 20px",border:"1px solid rgba(255,255,255,.08)"}}>
            <div className="bebas" style={{fontSize:36,color:C.electric,letterSpacing:1}}>{prods.length}</div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Productos</div>
          </div>
        </div>
      </div>
      <p style={{color:C.dim,fontSize:11,textAlign:"center",marginTop:-16,marginBottom:20}}>📷 Tocá tu logo para cambiarlo</p>
      <div style={{display:"flex",gap:0,marginBottom:24,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,overflow:"hidden",width:"fit-content",flexWrap:"wrap"}}>
        {TABS.map(([t,lb],i)=><button key={t} className="btn" onClick={()=>setTab(t)} style={{padding:"11px 20px",fontSize:12,fontWeight:700,background:tab===t?`linear-gradient(135deg,${c1},${c2})`:"transparent",color:tab===t?"#fff":C.muted,borderRadius:0,borderRight:i<TABS.length-1?"1px solid rgba(255,255,255,.06)":"none"}}>{lb}</button>)}
      </div>
      {saving&&<div style={{background:"rgba(0,194,255,.08)",border:"1px solid rgba(0,194,255,.2)",borderRadius:10,padding:"10px 16px",marginBottom:14,fontSize:12,color:C.electric,display:"flex",alignItems:"center",gap:8}}><span style={{display:"inline-block",width:12,height:12,border:"2px solid rgba(0,194,255,.3)",borderTop:"2px solid #00C2FF",borderRadius:"50%",animation:"spin 1s linear infinite"}}/> Guardando en Supabase...</div>}

      {tab==="productos"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <p style={{color:C.muted,fontSize:13}}>{prods.length} productos en tu catálogo</p>
          <button className="btn" onClick={()=>{setAdding(true);setEditing(null);}} style={{background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",padding:"9px 18px",fontSize:13}}>+ Nuevo producto</button>
        </div>
        {adding&&<div className="fade" style={{background:"rgba(0,194,255,.06)",border:"1px solid rgba(0,194,255,.2)",borderRadius:16,padding:22,marginBottom:16}}>
          <h4 style={{fontWeight:800,fontSize:15,marginBottom:14,color:C.electric}}>➕ Nuevo producto</h4>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <Field label="Nombre *" value={blank.name} onChange={v=>setBlank({...blank,name:v})}/>
            <Field label="Precio $" value={blank.price} onChange={v=>setBlank({...blank,price:v})} type="number"/>
            <Field label="Categoría del producto" value={blank.subcategory} onChange={v=>setBlank({...blank,subcategory:v})} placeholder="Ej: Remeras, Jeans, Buzos..." help="Agrupará los productos por tipo en el catálogo"/>
            <Field label="Emoji" value={blank.emoji} onChange={v=>setBlank({...blank,emoji:v})}/>
            <Field label="Descripción" value={blank.description} onChange={v=>setBlank({...blank,description:v})}/>
          </div>
          <div style={{display:"flex",gap:9}}><button className="btn" onClick={addProd} disabled={saving} style={{background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",padding:"9px 20px",fontSize:13}}>Guardar</button><button className="btn" onClick={()=>setAdding(false)} style={{background:"rgba(255,255,255,.06)",color:C.muted,padding:"9px 18px",fontSize:13}}>Cancelar</button></div>
        </div>}
        {prods.length===0&&!adding&&<div style={{textAlign:"center",padding:"48px",background:"rgba(255,255,255,.03)",border:"1px dashed rgba(255,255,255,.1)",borderRadius:16}}><div style={{fontSize:52,marginBottom:12}}>📦</div><p style={{fontWeight:700,fontSize:15}}>Todavía no tenés productos</p><p style={{color:C.muted,fontSize:13,marginTop:5}}>Tocá "+ Nuevo producto" para empezar</p></div>}
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {prods.map(p=>(<div key={p.id} style={{background:editing?.id===p.id?"rgba(0,194,255,.08)":"rgba(255,255,255,.04)",border:`1px solid ${editing?.id===p.id?"rgba(0,194,255,.3)":"rgba(255,255,255,.08)"}`,borderRadius:14,padding:"14px 18px"}}>
            {editing?.id===p.id?<div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:11}}>
                <Field label="Nombre" value={editing.name} onChange={v=>setEditing({...editing,name:v})}/>
                <Field label="Precio" value={editing.price} onChange={v=>setEditing({...editing,price:Number(v)})} type="number"/>
                <Field label="Emoji" value={editing.emoji} onChange={v=>setEditing({...editing,emoji:v})}/>
                <Field label="Descripción" value={editing.description} onChange={v=>setEditing({...editing,description:v})}/>
              </div>
              <div style={{display:"flex",gap:8}}><button className="btn" onClick={saveProd} disabled={saving} style={{background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",padding:"9px 20px",fontSize:13}}>Guardar</button><button className="btn" onClick={()=>setEditing(null)} style={{background:"rgba(255,255,255,.06)",color:C.muted,padding:"9px 18px",fontSize:13}}>Cancelar</button></div>
            </div>:<div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:48,height:48,borderRadius:12,background:`linear-gradient(135deg,${c1}33,${c2}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,overflow:"hidden"}}>{p.img_url?<img src={p.img_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:p.emoji}</div>
              <div style={{flex:1}}><p style={{fontWeight:700,fontSize:14}}>{p.name}</p><p style={{color:C.muted,fontSize:11}}>{p.description}</p></div>
              <span className="bebas" style={{fontSize:22,color:C.electric,minWidth:90,textAlign:"right",letterSpacing:1}}>{fmt(p.price)}</span>
              <div style={{display:"flex",gap:7}}><button className="btn" onClick={()=>{setEditing({...p});setAdding(false);}} style={{background:"rgba(0,194,255,.1)",color:C.electric,padding:"7px 11px",fontSize:12}}>✏️</button><button className="btn" onClick={()=>delProd(p.id)} style={{background:"rgba(255,23,68,.1)",color:C.danger,padding:"7px 11px",fontSize:12}}>🗑️</button></div>
            </div>}
          </div>))}
        </div>
      </>}
      {tab==="info"&&<div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:24}}>
        <Field label="Nombre del negocio" value={info.business_name} onChange={v=>setInfo({...info,business_name:v})}/>
        <Field label="Descripción" value={info.description} onChange={v=>setInfo({...info,description:v})}/>
        <Field label="Horario" value={info.hours} onChange={v=>setInfo({...info,hours:v})} placeholder="Lun-Sáb 9:00-20:00"/>
        <button className="btn" onClick={saveInfo} disabled={saving} style={{background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",padding:"11px 24px",fontSize:14}}>Guardar cambios</button>
      </div>}
      {tab==="envio"&&<div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:24}}>
        <div style={{display:"flex",gap:12,marginBottom:18}}>
          {[true,false].map(v=><div key={String(v)} onClick={()=>setInfo({...info,delivery:v})} style={{flex:1,padding:"18px",borderRadius:14,border:`2px solid ${info.delivery===v?c1:"rgba(255,255,255,.1)"}`,cursor:"pointer",background:info.delivery===v?`${c1}18`:"rgba(255,255,255,.03)",textAlign:"center",transition:"all .18s"}}><div style={{fontSize:32,marginBottom:8}}>{v?"🚚":"📦"}</div><p style={{fontWeight:800,fontSize:14,color:info.delivery===v?C.electric:C.muted}}>{v?"Ofrezco envío":"Solo retiro"}</p></div>)}
        </div>
        {info.delivery&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><Lbl>Costo ($0 = gratis)</Lbl><input className="inp" type="number" value={info.delivery_cost} onChange={e=>setInfo({...info,delivery_cost:Number(e.target.value)})}/></div>
          <div><Lbl>Nota de envío</Lbl><input className="inp" value={info.delivery_note} onChange={e=>setInfo({...info,delivery_note:e.target.value})}/></div>
        </div>}
        <button className="btn" onClick={saveInfo} disabled={saving} style={{background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",padding:"11px 24px",fontSize:14}}>Guardar</button>
      </div>}
      {tab==="pago"&&<div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:24}}>
        <h3 style={{fontWeight:800,fontSize:17,marginBottom:6}}>Link de Mercado Pago</h3>
        <p style={{color:C.muted,fontSize:13,marginBottom:20,lineHeight:1.6}}>Pegá acá tu link de MP para que los clientes puedan pagarte directamente.</p>
        <Field label="Tu link de Mercado Pago" value={info.mp_link} onChange={v=>setInfo({...info,mp_link:v})} placeholder="https://mpago.la/..."/>
        <button className="btn" onClick={saveInfo} disabled={saving} style={{background:info.mp_link?"linear-gradient(135deg,#00E676,#00C853)":`linear-gradient(135deg,${c1},${c2})`,color:"#fff",padding:"11px 24px",fontSize:14,marginBottom:20}}>{info.mp_link?"✓ Link guardado":"Guardar link"}</button>
        <div style={{background:"rgba(0,194,255,.06)",border:"1px solid rgba(0,194,255,.15)",borderRadius:12,padding:"14px 16px",fontSize:12,color:C.muted,lineHeight:1.8}}><b style={{color:C.electric}}>¿Cómo generar tu link?</b><br/>1. Abrí la app de Mercado Pago<br/>2. Tocá "Cobrar"<br/>3. Dejá el monto en blanco<br/>4. Tocá "Compartir link" y copialo</div>
      </div>}
      {tab==="pass"&&<div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:24,maxWidth:440}}>
        <h3 style={{fontWeight:800,fontSize:17,marginBottom:6}}>🔑 Cambiar contraseña</h3>
        <p style={{color:C.muted,fontSize:13,marginBottom:22,lineHeight:1.6}}>Cambiá la contraseña que te dieron por una que solo vos conozcas.</p>
        <Field label="Contraseña actual" value={passForm.current} onChange={v=>setPassForm({...passForm,current:v})} type="password" placeholder="La que te dieron"/>
        <Field label="Nueva contraseña" value={passForm.newp} onChange={v=>setPassForm({...passForm,newp:v})} type="password" placeholder="Mínimo 6 caracteres"/>
        <Field label="Repetir nueva contraseña" value={passForm.confirm} onChange={v=>setPassForm({...passForm,confirm:v})} type="password" placeholder="Igual que la anterior"/>
        <button className="btn" onClick={changePass} disabled={saving} style={{background:`linear-gradient(135deg,${c1},${c2})`,color:"#fff",padding:"12px 28px",fontSize:14,marginTop:4}}>Guardar nueva contraseña</button>
        <div style={{marginTop:18,background:"rgba(255,179,0,.06)",border:"1px solid rgba(255,179,0,.2)",borderRadius:12,padding:"12px 16px",fontSize:12,color:"rgba(255,179,0,.8)",lineHeight:1.7}}><b>⚠️ Importante:</b> Anotá tu nueva contraseña. Si la olvidás, el admin del shopping te puede generar una nueva.</div>
      </div>}
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({boxes,setBoxes,products,setProducts,shopConfig,setShopConfig,setToast}){
  const [tab,setTab]=useState("boxes");
  const [editingBox,setEditingBox]=useState(null);
  const [saving,setSaving]=useState(false);
  const [newBox,setNewBox]=useState({box_numbers_str:"",business_name:"",cat:"",emoji:"🏪",description:"",hours:"",email:"",password_plain:"",delivery:false,delivery_cost:0,delivery_note:"Solo retiro en box"});
  const [editHours,setEditHours]=useState(null);
  const [newBanner,setNewBanner]=useState({text:"",color:"linear-gradient(135deg,#FFD200,#FF6F00)",active:true});
  const showT=msg=>{setToast(msg);setTimeout(()=>setToast(""),2500);};
  const CATS=["Moda","Gastronomía","Tecnología","Belleza","Deportes","Calzado","Hogar","Lencería","Otra"];

  const saveEdit=async()=>{
    setSaving(true);
    try{
      await sb.from("boxes").update({business_name:editingBox.business_name,cat:editingBox.cat,emoji:editingBox.emoji,description:editingBox.description,hours:editingBox.hours,email:editingBox.email,password_plain:editingBox.password_plain,whatsapp:editingBox.whatsapp||"",box_numbers:editingBox.box_numbers},`id=eq.${editingBox.id}`);
      setBoxes(p=>p.map(b=>b.id===editingBox.id?editingBox:b));
      setEditingBox(null);showT("✓ Box actualizado");
    }catch(e){showT("❌ Error guardando");}
    setSaving(false);
  };

  const toggleActive=async(id,val)=>{
    await sb.from("boxes").update({active:val},`id=eq.${id}`);
    setBoxes(p=>p.map(b=>b.id===id?{...b,active:val}:b));
    showT("✓ Estado actualizado");
  };

  const deleteBox=async(id)=>{
    const b=boxes.find(x=>x.id===id);
    if(!window.confirm("¿Eliminar \""+b.business_name+"\" ("+boxLabel(b.box_numbers)+")? No se puede deshacer.")) return;
    await sb.from("boxes").delete(`id=eq.${id}`);
    setBoxes(p=>p.filter(x=>x.id!==id));
    setProducts(p=>{const n={...p};delete n[id];return n;});
    showT("✓ Box eliminado");
  };

  const resetTenant=async(id)=>{
    if(!window.confirm("¿Reiniciar para nuevo inquilino?")) return;
    const reset={business_name:"(Disponible)",cat:"",emoji:"🏪",logo_url:null,description:"Box disponible para alquilar",hours:"",active:false,email:"",password_plain:"",mp_link:"",catalog_link:null,delivery:false,delivery_cost:0,delivery_note:"Solo retiro en box",whatsapp:""};
    await sb.from("boxes").update(reset,`id=eq.${id}`);
    await sb.from("products").delete(`box_id=eq.${id}`);
    setBoxes(p=>p.map(b=>b.id===id?{...b,...reset}:b));
    setProducts(p=>({...p,[id]:[]}));
    showT("✓ Box reiniciado");
  };

  const createBox=async()=>{
    if(!newBox.business_name||!newBox.email||!newBox.password_plain) return showT("❌ Nombre, email y contraseña obligatorios");
    const nums=newBox.box_numbers_str.split(",").map(n=>parseInt(n.trim())).filter(n=>!isNaN(n));
    if(!nums.length) return showT("❌ Ingresá al menos un número de box");
    setSaving(true);
    try{
      const res=await sb.from("boxes").insert({...newBox,box_numbers:nums,logo_url:null,mp_link:"",catalog_link:null,active:true});
      const created=Array.isArray(res)?res[0]:res;
      setBoxes(p=>[...p,created]);setProducts(p=>({...p,[created.id]:[]}));
      setNewBox({box_numbers_str:"",business_name:"",cat:"",emoji:"🏪",description:"",hours:"",email:"",password_plain:"",delivery:false,delivery_cost:0,delivery_note:"Solo retiro en box"});
      setTab("boxes");showT("✓ Box creado");
    }catch(e){showT("❌ Error creando box");}
    setSaving(false);
  };

  const saveConfig=async(cfg)=>{
    setShopConfig(cfg);
    await sb.from("shopping_config").update({hours:cfg.hours,banners:cfg.banners},`id=eq.1`);
  };

  return(
    <div className="fade" style={{maxWidth:1000,margin:"0 auto",padding:"28px 24px 64px"}}>
      <div style={{background:"linear-gradient(135deg,#4C1D95,#2D1B69)",border:"1px solid rgba(139,92,246,.3)",borderRadius:22,padding:"24px 28px",marginBottom:24,display:"flex",alignItems:"center",gap:18,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,background:"radial-gradient(circle,rgba(139,92,246,.2),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{fontSize:48,animation:"float 3s ease infinite"}}>🛡️</div>
        <div>
          <p style={{color:"rgba(167,139,250,.7)",fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:2}}>PANEL DE ADMINISTRACIÓN · SUPABASE CONECTADO</p>
          <h1 className="bebas" style={{fontSize:38,letterSpacing:2,background:"linear-gradient(135deg,#fff,#A78BFA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>BOX SHOP · ADMIN</h1>
          <p style={{color:"rgba(167,139,250,.6)",fontSize:13,marginTop:2}}>{boxes.length} boxes · {boxes.filter(b=>b.active).length} activos · {boxes.filter(b=>!b.active).length} disponibles</p>
        </div>
      </div>
      <div style={{display:"flex",gap:0,marginBottom:24,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,overflow:"hidden",width:"fit-content"}}>
        {[["boxes","🏬 Boxes"],["crear","➕ Crear"],["shopping","⚙️ Shopping"]].map(([t,lb],i,a)=><button key={t} className="btn" onClick={()=>setTab(t)} style={{padding:"11px 22px",fontSize:13,background:tab===t?"linear-gradient(135deg,#6D28D9,#4C1D95)":"transparent",color:tab===t?"#fff":C.muted,borderRadius:0,borderRight:i<a.length-1?"1px solid rgba(255,255,255,.06)":"none"}}>{lb}</button>)}
      </div>

      {tab==="boxes"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {boxes.map(box=>{const [c1,c2]=catGrad(box.cat);return(
          <div key={box.id} style={{background:box.active?"rgba(255,255,255,.04)":"rgba(255,23,68,.04)",border:`1px solid ${box.active?"rgba(255,255,255,.08)":"rgba(255,23,68,.2)"}`,borderRadius:16,overflow:"hidden"}}>
            {editingBox?.id===box.id?<div style={{padding:22}}>
              <h4 style={{fontWeight:800,fontSize:15,color:C.electric,marginBottom:18}}>✏️ Editando: {box.business_name}</h4>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
                <div><Lbl>Números de box</Lbl><input className="inp" value={editingBox.box_numbers.join(", ")} onChange={e=>{const n=e.target.value.split(",").map(x=>parseInt(x.trim())).filter(x=>!isNaN(x));setEditingBox({...editingBox,box_numbers:n});}}/></div>
                <Field label="Nombre" value={editingBox.business_name} onChange={v=>setEditingBox({...editingBox,business_name:v})}/>
                <Field label="Email" value={editingBox.email||""} onChange={v=>setEditingBox({...editingBox,email:v})} type="email"/>
                <Field label="WhatsApp" value={editingBox.whatsapp||""} onChange={v=>setEditingBox({...editingBox,whatsapp:v})} placeholder="2604123456"/>
                <div><Lbl>Categoría</Lbl><select className="inp" value={editingBox.cat} onChange={e=>setEditingBox({...editingBox,cat:e.target.value})}><option value="">Sin categoría</option>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                <Field label="Horario" value={editingBox.hours||""} onChange={v=>setEditingBox({...editingBox,hours:v})}/>
                <Field label="Descripción" value={editingBox.description||""} onChange={v=>setEditingBox({...editingBox,description:v})}/>
              </div>
              <div style={{background:"rgba(255,179,0,.08)",border:"1px solid rgba(255,179,0,.25)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
                <p style={{fontWeight:700,fontSize:13,color:C.warn,marginBottom:10}}>🔑 Nueva contraseña</p>
                <div style={{display:"flex",gap:9,alignItems:"flex-end"}}>
                  <div style={{flex:1}}><Lbl>Nueva contraseña</Lbl><input className="inp" type="text" id={"np-"+box.id} placeholder="Mínimo 6 caracteres"/></div>
                  <button className="btn" onClick={()=>{const np=document.getElementById("np-"+box.id).value;if(np.length<6)return showT("❌ Mínimo 6 caracteres");setEditingBox({...editingBox,password_plain:np});showT("✓ Contraseña lista");}} style={{background:"linear-gradient(135deg,#FFB300,#FF6F00)",color:"#fff",padding:"10px 16px",fontSize:13,flexShrink:0}}>Establecer</button>
                </div>
              </div>
              <div style={{display:"flex",gap:9}}>
                <button className="btn" onClick={saveEdit} disabled={saving} style={{background:"linear-gradient(135deg,#00C2FF,#0044AA)",color:"#fff",padding:"9px 22px",fontSize:13}}>Guardar cambios</button>
                <button className="btn" onClick={()=>setEditingBox(null)} style={{background:"rgba(255,255,255,.06)",color:C.muted,padding:"9px 18px",fontSize:13}}>Cancelar</button>
              </div>
            </div>:<div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
              <BoxAvatar box={box} size={48} radius={12}/>
              <div style={{flex:1,minWidth:180}}>
                <div style={{display:"flex",gap:7,marginBottom:5,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{background:`linear-gradient(135deg,${c1},${c2})`,borderRadius:7,padding:"2px 10px",fontSize:11,fontWeight:800}}>{boxLabel(box.box_numbers)}</span>
                  {box.cat&&<span style={{background:"rgba(255,255,255,.08)",borderRadius:7,padding:"2px 10px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase"}}>{box.cat}</span>}
                  <span style={{background:box.active?"rgba(0,230,118,.12)":"rgba(255,23,68,.12)",color:box.active?C.success:C.danger,borderRadius:7,padding:"2px 10px",fontSize:10,fontWeight:800}}>{box.active?"● Activo":"○ Disponible"}</span>
                </div>
                <p style={{fontWeight:800,fontSize:15}}>{box.business_name}</p>
                <p style={{color:C.dim,fontSize:11,marginTop:2}}>{box.email||"Sin email"} · {(products[box.id]||[]).length} productos</p>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",flexShrink:0}}>
                <button className="btn" onClick={()=>setEditingBox({...box})} style={{background:"rgba(0,194,255,.1)",color:C.electric,padding:"7px 13px",fontSize:12,border:"1px solid rgba(0,194,255,.2)"}}>✏️ Editar</button>
                <button className="btn" onClick={()=>toggleActive(box.id,!box.active)} style={{background:box.active?"rgba(255,23,68,.1)":"rgba(0,230,118,.1)",color:box.active?C.danger:C.success,padding:"7px 13px",fontSize:12,border:`1px solid ${box.active?"rgba(255,23,68,.2)":"rgba(0,230,118,.2)"}`}}>{box.active?"Desactivar":"Activar"}</button>
                {box.active&&<button className="btn" onClick={()=>resetTenant(box.id)} style={{background:"rgba(255,179,0,.1)",color:C.warn,padding:"7px 13px",fontSize:12,border:"1px solid rgba(255,179,0,.2)"}}>🔄 Nuevo inquilino</button>}
                <button className="btn" onClick={()=>deleteBox(box.id)} style={{background:"rgba(255,23,68,.1)",color:C.danger,padding:"7px 13px",fontSize:12,border:"1px solid rgba(255,23,68,.2)"}}>🗑️</button>
              </div>
            </div>}
          </div>
        );})}
      </div>}

      {tab==="shopping"&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:24}}>
          <h3 style={{fontWeight:800,fontSize:16,marginBottom:18}}>🕐 Horarios del shopping</h3>
          {(shopConfig.hours||[]).map((h,i)=>(<div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"center"}}>
            {editHours===i?<><input className="inp" value={h.day} onChange={e=>{const hs=[...shopConfig.hours];hs[i]={...hs[i],day:e.target.value};saveConfig({...shopConfig,hours:hs});}} style={{flex:1}}/><input className="inp" value={h.time} onChange={e=>{const hs=[...shopConfig.hours];hs[i]={...hs[i],time:e.target.value};saveConfig({...shopConfig,hours:hs});}} style={{flex:1}}/><button className="btn" onClick={()=>setEditHours(null)} style={{background:"linear-gradient(135deg,#00C2FF,#0044AA)",color:"#fff",padding:"8px 14px",fontSize:12}}>✓</button></>
            :<><div style={{flex:1,background:"rgba(255,255,255,.04)",borderRadius:9,padding:"10px 14px",fontSize:13}}>{h.day}</div><div style={{flex:1,background:"rgba(0,194,255,.08)",borderRadius:9,padding:"10px 14px",fontSize:13,fontWeight:700,color:C.electric}}>{h.time}</div><button className="btn" onClick={()=>setEditHours(i)} style={{background:"rgba(0,194,255,.1)",color:C.electric,padding:"8px 11px",fontSize:12}}>✏️</button><button className="btn" onClick={()=>saveConfig({...shopConfig,hours:shopConfig.hours.filter((_,j)=>j!==i)})} style={{background:"rgba(255,23,68,.1)",color:C.danger,padding:"8px 11px",fontSize:12}}>🗑️</button></>}
          </div>))}
          <button className="btn" onClick={()=>saveConfig({...shopConfig,hours:[...shopConfig.hours,{day:"",time:""}]})} style={{background:"rgba(0,194,255,.1)",color:C.electric,padding:"8px 16px",fontSize:12,marginTop:6,border:"1px solid rgba(0,194,255,.2)"}}>+ Agregar horario</button>
        </div>
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:24}}>
          <h3 style={{fontWeight:800,fontSize:16,marginBottom:6}}>📢 Banners de novedades</h3>
          <p style={{color:C.muted,fontSize:12,marginBottom:18}}>Aparecen arriba de la página, rotan automáticamente.</p>
          {shopConfig.banners.map((b,i)=>(<div key={b.id} style={{display:"flex",gap:10,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{width:16,height:16,borderRadius:4,background:b.color,flexShrink:0}}/>
            <div style={{flex:1,fontSize:13,color:b.active?C.light:C.dim,textDecoration:b.active?"none":"line-through"}}>{b.text}</div>
            <button className="btn" onClick={()=>{const bs=[...shopConfig.banners];bs[i]={...bs[i],active:!bs[i].active};saveConfig({...shopConfig,banners:bs});}} style={{background:b.active?"rgba(255,23,68,.1)":"rgba(0,230,118,.1)",color:b.active?C.danger:C.success,padding:"6px 12px",fontSize:11}}>{b.active?"Ocultar":"Mostrar"}</button>
            <button className="btn" onClick={()=>saveConfig({...shopConfig,banners:shopConfig.banners.filter(x=>x.id!==b.id)})} style={{background:"rgba(255,23,68,.1)",color:C.danger,padding:"6px 10px",fontSize:11}}>🗑️</button>
          </div>))}
          <div style={{marginTop:14,display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{flex:1,minWidth:200}}><Lbl>Texto del banner</Lbl><input className="inp" value={newBanner.text} onChange={e=>setNewBanner({...newBanner,text:e.target.value})} placeholder="🎉 ¡Novedad del shopping!"/></div>
            <div><Lbl>Color</Lbl><div style={{display:"flex",gap:6}}>
              {[["linear-gradient(135deg,#FFD200,#FF6F00)","🟡"],["linear-gradient(135deg,#00C2FF,#0044AA)","🔵"],["linear-gradient(135deg,#FF1744,#C62828)","🔴"],["linear-gradient(135deg,#00E676,#00A152)","🟢"]].map(([g,ic])=>(
                <div key={g} onClick={()=>setNewBanner({...newBanner,color:g})} style={{width:28,height:28,borderRadius:7,background:g,cursor:"pointer",border:newBanner.color===g?"3px solid #fff":"3px solid transparent",transition:"border .15s"}}/>
              ))}
            </div></div>
            <button className="btn" onClick={()=>{if(!newBanner.text)return;saveConfig({...shopConfig,banners:[...shopConfig.banners,{...newBanner,id:Date.now()}]});setNewBanner({text:"",color:"linear-gradient(135deg,#FFD200,#FF6F00)",active:true});}} style={{background:"linear-gradient(135deg,#6D28D9,#4C1D95)",color:"#fff",padding:"10px 18px",fontSize:13}}>+ Agregar</button>
          </div>
        </div>
      </div>}

      {tab==="crear"&&<div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:26}}>
        <h3 style={{fontWeight:800,fontSize:17,marginBottom:20}}>➕ Crear nuevo box</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <Field label="Números de box *" value={newBox.box_numbers_str} onChange={v=>setNewBox({...newBox,box_numbers_str:v})} placeholder="Ej: 12  o  5, 6" help="Si ocupa varios separalos con coma"/>
          <Field label="Nombre del negocio *" value={newBox.business_name} onChange={v=>setNewBox({...newBox,business_name:v})}/>
          <div><Lbl>Categoría</Lbl><select className="inp" value={newBox.cat} onChange={e=>setNewBox({...newBox,cat:e.target.value})}><option value="">Seleccionar...</option>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          <Field label="Emoji" value={newBox.emoji} onChange={v=>setNewBox({...newBox,emoji:v})} placeholder="🏪"/>
          <Field label="Horario" value={newBox.hours} onChange={v=>setNewBox({...newBox,hours:v})} placeholder="Lun-Sáb 9:00-20:00"/>
          <Field label="Descripción" value={newBox.description} onChange={v=>setNewBox({...newBox,description:v})}/>
        </div>
        <div style={{background:"rgba(0,230,118,.06)",border:"1px solid rgba(0,230,118,.2)",borderRadius:12,padding:"16px 18px",marginBottom:16}}>
          <p style={{fontWeight:700,fontSize:13,color:C.success,marginBottom:12}}>🔑 Credenciales de acceso</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Email *" value={newBox.email} onChange={v=>setNewBox({...newBox,email:v})} type="email" placeholder="box10@boxshop.com"/>
            <Field label="Contraseña *" value={newBox.password_plain} onChange={v=>setNewBox({...newBox,password_plain:v})} type="text" placeholder="Mínimo 6 caracteres" help="Anotala antes de guardar"/>
          </div>
        </div>
        <button className="btn" onClick={createBox} disabled={saving} style={{background:"linear-gradient(135deg,#6D28D9,#4C1D95)",color:"#fff",padding:"13px 30px",fontSize:15}}>Crear box →</button>
      </div>}
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App(){
  const [view,setView]         = useState("home");
  const [activeBox,setActiveBox] = useState(null);
  const [cart,setCart]         = useState([]);
  const [user,setUser]         = useState(null);
  const [showLogin,setShowLogin] = useState(false);
  const [boxes,setBoxes]       = useState([]);
  const [products,setProducts] = useState({});
  const [shopConfig,setShopConfig] = useState({hours:[],banners:[]});
  const [toast,setToast]       = useState("");
  const [loading,setLoading]   = useState(true);
  const [loadingProds,setLoadingProds] = useState(false);

  // ── Cargar datos de Supabase al iniciar ──
  useEffect(()=>{
    (async()=>{
      try{
        const [boxesData,configData]=await Promise.all([
          sb.from("boxes").select("*"),
          sb.from("shopping_config").select("*"),
        ]);
        if(Array.isArray(boxesData)) setBoxes(boxesData);
        if(Array.isArray(configData)&&configData[0]){
          const cfg=configData[0];
          setShopConfig({hours:cfg.hours||[],banners:cfg.banners||[]});
        }
      }catch(e){console.error("Error cargando datos:",e);}
      setLoading(false);
    })();
  },[]);

  // ── Cargar productos cuando se abre un catálogo ──
  useEffect(()=>{
    if(!activeBox||products[activeBox]) return;
    setLoadingProds(true);
    sb.from("products").selectWhere("*",`box_id=eq.${activeBox}&active=eq.true`)
      .then(data=>{if(Array.isArray(data))setProducts(p=>({...p,[activeBox]:data}));})
      .finally(()=>setLoadingProds(false));
  },[activeBox]);

  const addToCart=(product,box)=>{
    setCart(prev=>{
      const dec=product._dec;
      const base=dec?{...product,_dec:undefined}:product;
      const exists=prev.find(i=>i.id===base.id);
      if(dec){if(!exists||exists.qty<=1)return prev.filter(i=>i.id!==base.id);return prev.map(i=>i.id===base.id?{...i,qty:i.qty-1}:i);}
      if(exists)return prev.map(i=>i.id===base.id?{...i,qty:i.qty+1}:i);
      return[...prev,{...base,qty:1,boxId:box.id,box}];
    });
  };

  const showT=msg=>{setToast(msg);setTimeout(()=>setToast(""),2500);};

  return(
    <>
      <style>{CSS}</style>
      {toast&&<Toast msg={toast}/>}
      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)} onLogin={u=>{setUser(u);setShowLogin(false);setView(u.is_admin?"admin":"box-panel");}} setToast={showT}/>}
      <div style={{minHeight:"100vh",background:"#000B1E"}}>
        <Nav view={view} setView={setView} setActiveBox={setActiveBox} cartN={cart.reduce((s,i)=>s+i.qty,0)} user={user} onLogout={()=>{setUser(null);setView("home");}} onLoginClick={()=>setShowLogin(true)}/>
        {view==="home"      &&<Home boxes={boxes} shopConfig={shopConfig} setView={setView} setActiveBox={setActiveBox} loading={loading}/>}
        {view==="catalog"   &&activeBox&&<Catalog boxId={activeBox} boxes={boxes} products={products} cart={cart} addToCart={addToCart} setView={setView} setActiveBox={setActiveBox} loadingProds={loadingProds}/>}
        {view==="cart"      &&<Cart cart={cart} addToCart={addToCart} setView={setView} clearCart={()=>setCart([])}/>}
        {view==="box-panel" &&user&&!user.is_admin&&<BoxPanel user={user} boxes={boxes} setBoxes={setBoxes} products={products} setProducts={setProducts} setToast={showT}/>}
        {view==="admin"     &&user?.is_admin&&<AdminPanel boxes={boxes} setBoxes={setBoxes} products={products} setProducts={setProducts} shopConfig={shopConfig} setShopConfig={setShopConfig} setToast={showT}/>}
        <footer style={{background:"rgba(0,0,0,.5)",borderTop:"1px solid rgba(0,194,255,.1)",textAlign:"center",padding:"24px",fontSize:12,marginTop:64,color:C.dim}}>
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <span><span className="bebas" style={{color:C.electric,fontSize:16,letterSpacing:2}}>BOX SHOP</span> · <a href={MAP} target="_blank" rel="noreferrer" style={{color:C.dim,textDecoration:"none"}}>Av. Rivadavia 135 · San Rafael, Mendoza</a></span>
            <a className="ig" href={IG} target="_blank" rel="noreferrer" style={{padding:"6px 14px",fontSize:12,borderRadius:10}}><IgSvg s={12}/> @boxshop.sanrafael</a>
          </div>
        </footer>
      </div>
    </>
  );
}
