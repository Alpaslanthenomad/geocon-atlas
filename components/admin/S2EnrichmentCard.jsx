"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function S2EnrichmentCard() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enqueueing, setEnqueueing] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const refresh = async () => {
    try {
      const { data } = await supabase.from("v_s2_enrichment_progress").select("*");
      setProgress(data || []);
    } catch (e) {
      console.warn("S2 progress fetch failed:", e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  const enqueueNow = async (pipeline) => {
    setEnqueueing(pipeline);
    try {
      const fnName = pipeline === "metadata" ? "s2_enqueue_batch" : "s2_embedding_enqueue_batch";
      const { data, error } = await supabase.rpc(fnName, { p_batch_size: 100 });
      if (error) {
        setLastAction({ ok: false, text: `${pipeline}: ${error.message}` });
      } else {
        const r = data?.[0];
        setLastAction({ ok: true, text: `${pipeline}: enqueued ${r?.n_publications || r?.n_requested || 0} publications` });
        setTimeout(refresh, 5000);
      }
    } catch (e) {
      setLastAction({ ok: false, text: e.message });
    }
    setEnqueueing(null);
    setTimeout(() => setLastAction(null), 6000);
  };

  const breakdown = (pipeline) => {
    const rows = progress.filter(r => r.pipeline === pipeline);
    const total = rows.reduce((s, r) => s + Number(r.n), 0);
    const get = (status) => Number(rows.find(r => r.status === status)?.n || 0);
    return {
      total,
      success: get("success"),
      pending: get("pending"),
      notFound: get("not_found"),
      error: get("error"),
      skip: get("skip"),
    };
  };

  const meta = breakdown("metadata");
  const emb = breakdown("embedding");

  const PipelineRow = ({ title, subtitle, icon, accent, bg, b, onEnqueue, btnLabel, isEnqueueing }) => {
    const successPct = b.total > 0 ? (b.success / b.total * 100) : 0;
    const notFoundPct = b.total > 0 ? (b.notFound / b.total * 100) : 0;
    const errorPct = b.total > 0 ? (b.error / b.total * 100) : 0;
    const skipPct = b.total > 0 ? (b.skip / b.total * 100) : 0;

    return (
      <div style={{padding:"10px 12px",background:bg,borderRadius:8,marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:160}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <span style={{fontSize:14}}>{icon}</span>
              <div style={{fontSize:11,fontWeight:700,color:accent}}>{title}</div>
            </div>
            <div style={{fontSize:9,color:"#888"}}>{subtitle}</div>
          </div>
          <button
            onClick={onEnqueue}
            disabled={isEnqueueing || b.pending === 0}
            style={{padding:"4px 10px",background:isEnqueueing||b.pending===0?"#ddd":accent,color:"#fff",border:"none",borderRadius:5,cursor:isEnqueueing||b.pending===0?"default":"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}
          >
            {isEnqueueing ? "..." : btnLabel}
          </button>
        </div>

        <div style={{height:6,background:"#f4f3ef",borderRadius:3,overflow:"hidden",marginBottom:6,display:"flex"}}>
          <div style={{width:`${successPct}%`,background:"#1D9E75",transition:"width 0.4s"}} />
          <div style={{width:`${notFoundPct}%`,background:"#b4b2a9",transition:"width 0.4s"}} />
          <div style={{width:`${errorPct}%`,background:"#A32D2D",transition:"width 0.4s"}} />
          <div style={{width:`${skipPct}%`,background:"#e8e6e1",transition:"width 0.4s"}} />
        </div>

        <div style={{display:"flex",gap:10,fontSize:9,color:"#5f5e5a",flexWrap:"wrap"}}>
          <span><strong style={{color:"#1D9E75"}}>{b.success}</strong> ok</span>
          {b.pending > 0 && <span><strong style={{color:"#854F0B"}}>{b.pending}</strong> pending</span>}
          {b.notFound > 0 && <span><strong style={{color:"#b4b2a9"}}>{b.notFound}</strong> not found</span>}
          {b.error > 0 && <span><strong style={{color:"#A32D2D"}}>{b.error}</strong> err</span>}
          {b.skip > 0 && <span style={{color:"#b4b2a9"}}>{b.skip} skip</span>}
          <span style={{marginLeft:"auto",color:"#999"}}>{b.total} total</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{marginBottom:20,padding:"14px 16px",background:"linear-gradient(135deg,#EEEDFE 0%,#fff 100%)",borderRadius:12,border:"1px solid #534AB744"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>🔬</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#3C3489"}}>Semantic Scholar Enrichment</div>
            <div style={{fontSize:10,color:"#888"}}>Otomatik cron · auto-refresh 30s</div>
          </div>
        </div>
      </div>

      <PipelineRow
        title="Metadata"
        subtitle="TLDR · influential citations · reference count · fields of study"
        icon="📝"
        accent="#534AB7"
        bg="#fff"
        b={meta}
        onEnqueue={() => enqueueNow("metadata")}
        btnLabel="Enqueue 100 →"
        isEnqueueing={enqueueing === "metadata"}
      />

      <PipelineRow
        title="Embedding (SPECTER2)"
        subtitle="768-dim vectors · enables similarity search"
        icon="🧠"
        accent="#185FA5"
        bg="#fff"
        b={emb}
        onEnqueue={() => enqueueNow("embedding")}
        btnLabel="Enqueue 100 →"
        isEnqueueing={enqueueing === "embedding"}
      />

      {lastAction && (
        <div style={{marginTop:8,padding:"6px 10px",borderRadius:6,fontSize:10,background:lastAction.ok?"#E1F5EE":"#FCEBEB",color:lastAction.ok?"#085041":"#A32D2D"}}>
          {lastAction.text}
        </div>
      )}
    </div>
  );
}
