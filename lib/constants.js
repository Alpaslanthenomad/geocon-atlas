export const ROLES = {
  admin:      { label:"Admin",          desc:"Full platform access",               ic:"A", color:"#534AB7", accent:"#EEEDFE" },
  researcher: { label:"Researcher",     desc:"Species, conservation & science",    ic:"R", color:"#1D9E75", accent:"#E1F5EE" },
  investor:   { label:"Venture Builder",desc:"Readiness, pathways & spin-off logic",ic:"V",color:"#D85A30", accent:"#FAECE7" },
  producer:   { label:"Producer",       desc:"Production & compliance",            ic:"P", color:"#639922", accent:"#EAF3DE" },
  policymaker:{ label:"Policymaker",    desc:"Conservation & regulatory",          ic:"K", color:"#185FA5", accent:"#E6F1FB" },
};

export const FAMILY_COLORS = {
  Liliaceae:       { bg:"#EAF3DE", border:"#639922", text:"#27500A", dot:"#639922" },
  Amaryllidaceae:  { bg:"#E6F1FB", border:"#378ADD", text:"#0C447C", dot:"#378ADD" },
  Asparagaceae:    { bg:"#E1F5EE", border:"#1D9E75", text:"#085041", dot:"#1D9E75" },
  Iridaceae:       { bg:"#EEEDFE", border:"#7F77DD", text:"#3C3489", dot:"#7F77DD" },
  Orchidaceae:     { bg:"#FBEAF0", border:"#D4537E", text:"#72243E", dot:"#D4537E" },
  Araceae:         { bg:"#FAECE7", border:"#D85A30", text:"#712B13", dot:"#D85A30" },
  Colchicaceae:    { bg:"#FAEEDA", border:"#BA7517", text:"#633806", dot:"#BA7517" },
  Primulaceae:     { bg:"#FCEBEB", border:"#E24B4A", text:"#791F1F", dot:"#E24B4A" },
  Ranunculaceae:   { bg:"#F1EFE8", border:"#5F5E5A", text:"#2C2C2A", dot:"#5F5E5A" },
  Gentianaceae:    { bg:"#E1F5EE", border:"#0F6E56", text:"#04342C", dot:"#0F6E56" },
  Paeoniaceae:     { bg:"#FBEAF0", border:"#993556", text:"#4B1528", dot:"#993556" },
  Nymphaeaceae:    { bg:"#E6F1FB", border:"#185FA5", text:"#042C53", dot:"#185FA5" },
  Geraniaceae:     { bg:"#FAEEDA", border:"#854F0B", text:"#412402", dot:"#854F0B" },
  Tecophilaeaceae: { bg:"#EEEDFE", border:"#534AB7", text:"#26215C", dot:"#534AB7" },
  Alstroemeriaceae:{ bg:"#EAF3DE", border:"#3B6D11", text:"#173404", dot:"#3B6D11" },
};

export const DEF_FAM = { bg:"#F1EFE8", border:"#888780", text:"#2C2C2A", dot:"#888780" };

export const MODULES = ["Origin","Forge","Mesh","Exchange","Accord"];
export const GATES   = ["Selection","Validation","Protocol","Deployment","Venture","Governance"];

export const MODULE_COLORS = {
  Origin:"#1D9E75", Forge:"#BA7517", Mesh:"#185FA5", Exchange:"#D85A30", Accord:"#5F5E5A"
};
export const MODULE_DESC = {
  Origin:   "Evidence & prioritization",
  Forge:    "Protocol & propagation",
  Mesh:     "Communities & partners",
  Exchange: "Commercial & venture",
  Accord:   "Governance & legitimacy",
};

export const STATUS_COLORS = {
  Active:"#0F6E56", Draft:"#888", Blocked:"#A32D2D", "On Hold":"#BA7517", Completed:"#185FA5", Archived:"#999"
};

export const PROGRAM_TYPES = [
  "Conservation & Propagation",
  "Conservation Rescue",
  "Propagation Program",
  "Metabolite Discovery",
  "Premium Ornamental",
  "Functional Ingredient",
  "Venture Formation",
];

export const STORY_ENTRY_TYPES = [
  "Evidence Added","Gate Passed","Risk Raised","Protocol Updated",
  "Governance Review Opened","Community Signal Added","Decision Made","Milestone Reached",
];

// Shared style tokens
export const S = {
  card:   { background:"#fff", borderRadius:14, border:"1px solid #e8e6e1", overflow:"hidden" },
  pill:   (c,bg) => ({ display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:500,color:c,background:bg,whiteSpace:"nowrap",lineHeight:1.6 }),
  metric: { background:"#f4f3ef", padding:"8px 12px", borderRadius:8 },
  mLabel: { fontSize:9, color:"#999", letterSpacing:0.4, textTransform:"uppercase", marginBottom:2 },
  mVal:   (c) => ({ fontSize:20, fontWeight:700, color:c||"#2c2c2a", fontFamily:"Georgia,serif" }),
  sub:    { fontSize:10, color:"#999" },
  input:  { padding:"8px 12px", border:"1px solid #e8e6e1", borderRadius:8, fontSize:12, background:"#fff", outline:"none", color:"#2c2c2a" },
  pgBtn:  { padding:"5px 10px", border:"1px solid #e8e6e1", borderRadius:7, background:"#fff", cursor:"pointer", fontSize:11, color:"#888" },
};
