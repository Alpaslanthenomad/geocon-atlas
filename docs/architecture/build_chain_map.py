# Build the interactive radial "neural map" of THE CHAIN's 279 nodes from the
# expansion-workflow output. The dotted link paths already encode the hierarchy.
import json, glob, os, html

# locate the workflow output
cands = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\Temp\claude\*geocon-atlas*\*\tasks\w7efokrzh.output"))
src = cands[0]
raw = json.load(open(src, encoding="utf-8"))
res = raw["result"]
if isinstance(res, str):
    res = json.loads(res)
domains = res["domains"]

DOMAIN_LABELS = {
    "identity-systematics":   "Identity & Systematics",
    "ecology-distribution":   "Ecology & Distribution",
    "conservation-policy":    "Conservation & Policy",
    "propagation-cultivation":"Propagation & Cultivation",
    "chemistry-bioactivity":  "Chemistry & Bioactivity",
    "omics-genetics":         "Omics & Genetics",
    "translation-ethnobotany":"Translation & Value",
}

def prettify(s):
    return s.replace("_", " ")

root = {"name": "Geophyte\nspecies", "kind": "root", "children": []}
leaf_count = 0
for dom in domains:
    dnode = {"name": DOMAIN_LABELS.get(dom["domain"], dom["domain"]), "kind": "domain",
             "domain": dom["domain"], "children": []}
    for l in dom.get("links", []):
        segs = [s for s in l["link"].split(".") if s]
        cur = dnode
        for s in segs:
            child = next((c for c in cur["children"] if c["name"] == s), None)
            if child is None:
                child = {"name": s, "kind": "branch", "children": []}
                cur["children"].append(child)
            cur = child
        cur["kind"] = "leaf"; leaf_count += 1
        cur["tag"] = l.get("tag"); cur["sensitivity"] = l.get("sensitivity")
        cur["data_today"] = l.get("data_today"); cur["full"] = l["link"]
        cur["desc"] = (l.get("description") or "")[:240]
    root["children"].append(dnode)

# collapse redundant single-child chains below the domain level
def collapse(node):
    while node.get("kind") != "leaf" and len(node.get("children", [])) == 1 \
          and node["children"][0].get("kind") != "leaf":
        only = node["children"][0]
        node["children"] = only.get("children", [])
    for c in node.get("children", []):
        collapse(c)
for d in root["children"]:
    collapse(d)

# pretty-print branch/leaf names
def beautify(node):
    if node.get("kind") in ("branch", "leaf"):
        node["name"] = prettify(node["name"])
    for c in node.get("children", []):
        beautify(c)
beautify(root)

DATA = json.dumps(root, ensure_ascii=False)

HTML = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>THE CHAIN - neural map of a geophyte's knowledge & value</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<style>
 :root{ --bg:#0f1410; --ink:#e9e6dc; --muted:#9aa39a; }
 *{box-sizing:border-box} html,body{margin:0;height:100%;background:radial-gradient(circle at 50% 45%, #16201a, #0c100d 70%);color:var(--ink);font-family:-apple-system,Segoe UI,Roboto,sans-serif;overflow:hidden}
 #chart{width:100vw;height:100vh}
 .link{fill:none}
 text{paint-order:stroke;stroke:#0c100d;stroke-width:2.2px;stroke-linejoin:round}
 #hud{position:fixed;top:16px;left:18px;max-width:330px;pointer-events:none}
 #hud h1{font-size:15px;letter-spacing:.5px;margin:0 0 4px;font-weight:700}
 #hud p{font-size:11px;line-height:1.5;color:var(--muted);margin:0 0 10px}
 .legend{font-size:11px;line-height:1.7}
 .sw{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px}
 #tip{position:fixed;pointer-events:none;background:#0c100dEE;border:1px solid #2c3a30;border-radius:8px;padding:8px 10px;font-size:11px;max-width:300px;opacity:0;transition:opacity .12s;color:var(--ink);box-shadow:0 6px 22px #0008}
 #tip b{color:#fff} #tip .meta{color:var(--muted);font-size:10px;margin-top:3px}
 #count{position:fixed;bottom:14px;right:18px;font-size:11px;color:var(--muted)}
 .hint{position:fixed;bottom:14px;left:18px;font-size:10.5px;color:var(--muted)}
</style></head><body>
<div id="hud">
  <h1>THE CHAIN &mdash; the neural map</h1>
  <p>Every thread of knowledge &amp; value radiating from one geophyte. 7 great branches, __LEAFCOUNT__ nodes. Scroll to zoom, drag to pan, hover a node.</p>
  <div class="legend">
    <div><span class="sw" style="background:#1D9E75"></span>conservation (protect the wild plant)</div>
    <div><span class="sw" style="background:#7E57C2"></span>value (academic + end-product)</div>
    <div><span class="sw" style="background:#90A4AE"></span>neutral / core knowledge</div>
  </div>
</div>
<div id="tip"></div>
<div id="count">__LEAFCOUNT__ leaf nodes &middot; 7 branches</div>
<div class="hint">scroll = zoom &middot; drag = pan &middot; click a branch hub to fold/unfold</div>
<div id="chart"></div>
<script>
const DATA = __DATA__;
const W = innerWidth, H = innerHeight, R = Math.min(W,H)/2 - 60;
const tagColor = {conservation_only:'#1D9E75', translational:'#7E57C2', neutral:'#90A4AE'};
const domColor = d3.scaleOrdinal()
  .domain(DATA.children.map(d=>d.name))
  .range(['#4FB477','#3FA7C4','#E0A458','#8C7AE6','#E06C75','#56B6C2','#C678DD']);
const svg = d3.select('#chart').append('svg').attr('width',W).attr('height',H);
const g = svg.append('g');
svg.call(d3.zoom().scaleExtent([0.25,5]).on('zoom',e=>g.attr('transform',e.transform)))
   .call(d3.zoom().transform, d3.zoomIdentity.translate(W/2,H/2));
g.attr('transform',`translate(${W/2},${H/2})`);
const tree = d3.tree().size([2*Math.PI, R]).separation((a,b)=>(a.parent===b.parent?1:2)/Math.max(a.depth,1));
const root = d3.hierarchy(DATA);
function domainName(d){let n=d;while(n.depth>1)n=n.parent;return n.data.name;}
const tip = d3.select('#tip');
function color(d){
  if(d.depth===0) return '#f4f1e4';
  if(d.data.kind==='leaf') return tagColor[d.data.tag]||'#90A4AE';
  return domColor(domainName(d));
}
function render(){
  tree(root);
  const nodes=root.descendants(), links=root.links();
  g.selectAll('.link').data(links,d=>d.target.data.full||d.target.data.name+d.target.depth)
    .join('path').attr('class','link')
    .attr('d', d3.linkRadial().angle(d=>d.x).radius(d=>d.y))
    .attr('stroke', d=> domColor(domainName(d.target)))
    .attr('stroke-opacity', d=> d.target.depth<=1?0.55: d.target.depth===2?0.35:0.18)
    .attr('stroke-width', d=> d.target.depth<=1?2.2: d.target.depth===2?1.1:0.6);
  const gn = g.selectAll('.node').data(nodes, d=>d.data.full||d.data.name+d.depth)
    .join('g').attr('class','node')
    .attr('transform',d=>`rotate(${d.x*180/Math.PI-90}) translate(${d.y},0)`);
  gn.selectAll('circle').data(d=>[d]).join('circle')
    .attr('r', d=> d.depth===0?9 : d.data.kind==='leaf'?3 : (d._children?6:5))
    .attr('fill', color).attr('stroke','#0c100d').attr('stroke-width',1)
    .style('cursor', d=> d.children||d._children?'pointer':'default')
    .on('mouseover',(e,d)=>{ tip.style('opacity',1).html(
        '<b>'+d.data.name+'</b>'+(d.data.kind==='leaf'?
        '<div class="meta">'+(d.data.full||'')+'<br>'+(d.data.tag||'')+' &middot; '+(d.data.sensitivity||'')+' &middot; '+(d.data.data_today||'')+'</div>'+
        (d.data.desc?'<div class="meta" style="margin-top:5px;color:#cfcabb">'+d.data.desc+'</div>':'')
        : '<div class="meta">'+( (d.children||d._children||[]).length||((d._children||d.children||{}).length||'') )+' sub-nodes</div>')); })
    .on('mousemove',e=>tip.style('left',(e.clientX+14)+'px').style('top',(e.clientY+14)+'px'))
    .on('mouseout',()=>tip.style('opacity',0))
    .on('click',(e,d)=>{ if(d.children){d._children=d.children;d.children=null;} else if(d._children){d.children=d._children;d._children=null;} render(); });
  gn.selectAll('text').data(d=> d.depth<=2 && d.depth>0 ?[d]:[]).join('text')
    .attr('dy','0.31em')
    .attr('x', d=> d.x<Math.PI?9:-9)
    .attr('text-anchor', d=> d.x<Math.PI?'start':'end')
    .attr('transform', d=> d.x>=Math.PI?'rotate(180)':null)
    .attr('font-size', d=> d.depth===1?12.5:10)
    .attr('font-weight', d=> d.depth===1?700:500)
    .attr('fill', d=> d.depth===1? domColor(domainName(d)) : '#c9c4b6')
    .text(d=> d.data.name);
  // root label
  g.selectAll('.rootlbl').data([root]).join('text').attr('class','rootlbl')
    .attr('text-anchor','middle').attr('dy','0.31em').attr('font-size',13).attr('font-weight',800)
    .attr('fill','#f4f1e4').text('GEOPHYTE');
}
render();
</script></body></html>"""

out_html = HTML.replace("__DATA__", DATA).replace("__LEAFCOUNT__", str(leaf_count))
for dest in [r"C:\Users\Alpaslan\Desktop\THE-CHAIN-neural-map.html",
             os.path.join(os.path.dirname(__file__), "the-chain-map.html")]:
    open(dest, "w", encoding="utf-8").write(out_html)
open(os.path.join(os.path.dirname(__file__), "the-chain-map.json"), "w", encoding="utf-8").write(
    json.dumps(root, ensure_ascii=False, indent=1))
print("leaves:", leaf_count, "domains:", len(root["children"]))
print("wrote Desktop + docs/architecture/the-chain-map.html (+ .json)")
