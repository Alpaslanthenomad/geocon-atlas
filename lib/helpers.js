export const iucnC  = s => ({ CR:"#A32D2D",EN:"#854F0B",VU:"#BA7517",NT:"#3B6D11",LC:"#0F6E56" }[s]||"#888");
export const iucnBg = s => ({ CR:"#FCEBEB",EN:"#FAEEDA",VU:"#FFF3CD",NT:"#EAF3DE",LC:"#E1F5EE" }[s]||"#f1efe8");

export const decC  = d => ({ Accelerate:"#0F6E56","Rescue Now":"#A32D2D","Urgent Conserve":"#A32D2D",Develop:"#185FA5",Scale:"#3B6D11",Monitor:"#888","Data Needed":"#534AB7" }[d]||"#888");
export const decBg = d => ({ Accelerate:"#E1F5EE","Rescue Now":"#FCEBEB","Urgent Conserve":"#FCEBEB",Develop:"#E6F1FB",Scale:"#EAF3DE",Monitor:"#f1efe8","Data Needed":"#EEEDFE" }[d]||"#f1efe8");

export const freshC = v => v>0.85?"#0F6E56":v>0.65?"#BA7517":"#A32D2D";
export const flag   = c => c==="TR"?"🇹🇷":c==="CL"?"🇨🇱":"🌍";

export const riskColor = r => ({ high:"#A32D2D",medium:"#BA7517",low:"#0F6E56" }[r?.toLowerCase()]||"#888");
export const riskBg    = r => ({ high:"#FCEBEB",medium:"#FAEEDA",low:"#E1F5EE" }[r?.toLowerCase()]||"#f4f3ef");
