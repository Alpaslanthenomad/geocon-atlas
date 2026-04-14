"use client";
import { useState, useEffect } from "react";

/* ══════════════════════════════════════════════════════════
   GEOCON ATLAS v2.1 — Global Geophyte Intelligence Platform
   6 Modules: Species · Portfolio · Metabolites · Market · Partners · Sources
   ══════════════════════════════════════════════════════════ */

/* ─── METABOLITE DATABASE ─── */
const METABOLITES = [
  {id:"MET-001",species:"GEO-0001",speciesName:"Fritillaria imperialis",compound:"Imperialine",compClass:"Isosteroidal alkaloid",cas:"466-45-5",formula:"C27H43NO3",mw:429.64,organ:"Bulb",activity:"Antitussive, anti-inflammatory",category:"Pharmacological",therapeutic:"Respiratory",cosmetic:"Anti-aging potential",evidence:"Preclinical",stage:"Phase 0",confidence:0.70,pubchem:441082,ip:"Medium — known compound, novel route",note:"Bei Mu traditional use; Chuan Bei Mu >$500/kg"},
  {id:"MET-002",species:"GEO-0001",speciesName:"Fritillaria imperialis",compound:"Peiminine",compClass:"Isosteroidal alkaloid",cas:"18059-10-4",formula:"C27H43NO4",mw:445.64,organ:"Bulb",activity:"Anti-inflammatory, bronchodilator",category:"Pharmacological",therapeutic:"Respiratory / Oncology",cosmetic:"—",evidence:"Preclinical",stage:"Phase 0",confidence:0.65,pubchem:73399,ip:"High — novel delivery formulation possible",note:"SAR studies needed for optimization"},
  {id:"MET-003",species:"GEO-0001",speciesName:"Fritillaria imperialis",compound:"Verticinone",compClass:"Isosteroidal alkaloid",cas:"18059-09-1",formula:"C27H43NO3",mw:429.64,organ:"Bulb",activity:"Antitussive, expectorant",category:"Pharmacological",therapeutic:"Respiratory",cosmetic:"—",evidence:"Preclinical",stage:"Phase 0",confidence:0.60,pubchem:263388,ip:"Medium",note:"Part of Bei Mu alkaloid complex"},
  {id:"MET-004",species:"GEO-0002",speciesName:"Lilium candidum",compound:"Kaempferol",compClass:"Flavonoid",cas:"520-18-3",formula:"C15H10O6",mw:286.24,organ:"Petals, Bulb",activity:"Antioxidant, anti-inflammatory, UV protection",category:"Cosmeceutical",therapeutic:"Dermatology",cosmetic:"Skin brightening, anti-aging",evidence:"Clinical (general)",stage:"Ingredient stage",confidence:0.85,pubchem:5280863,ip:"Low — well-known; value in source narrative",note:"Mediterranean Lily Complex® anchor compound"},
  {id:"MET-005",species:"GEO-0002",speciesName:"Lilium candidum",compound:"Quercetin",compClass:"Flavonoid",cas:"117-39-5",formula:"C15H10O7",mw:302.24,organ:"Bulb, Leaves",activity:"Antioxidant, anti-inflammatory",category:"Cosmeceutical",therapeutic:"General wellness",cosmetic:"Anti-aging, skin repair",evidence:"Clinical (general)",stage:"Ingredient stage",confidence:0.88,pubchem:5280343,ip:"Low — commodity compound; value in blend",note:"Synergistic with kaempferol in Lily Complex"},
  {id:"MET-006",species:"GEO-0002",speciesName:"Lilium candidum",compound:"\u03B2-sitosterol",compClass:"Phytosterol",cas:"83-46-5",formula:"C29H50O",mw:414.71,organ:"Bulb",activity:"Anti-inflammatory, skin barrier",category:"Cosmeceutical",therapeutic:"Dermatology",cosmetic:"Moisturizing, soothing",evidence:"Clinical (general)",stage:"Ingredient stage",confidence:0.82,pubchem:222284,ip:"Low — ubiquitous; part of standardized blend",note:"Barrier function support in clean beauty"},
  {id:"MET-007",species:"GEO-0003",speciesName:"Orchis italica",compound:"Glucomannan",compClass:"Polysaccharide",cas:"37220-17-0",formula:"(C6H10O5)n",mw:null,organ:"Tuber",activity:"Prebiotic, emollient, thickener",category:"Food / Cosmetic",therapeutic:"GI health",cosmetic:"Hydrating, film-forming",evidence:"Established",stage:"Commercial (salep)",confidence:0.90,pubchem:null,ip:"Low — salep trade; value in sustainable source",note:"Illegal wild harvest >$300/kg; sustainable TC source critical"},
  {id:"MET-008",species:"GEO-0004",speciesName:"Tecophilaea cyanocrocus",compound:"Delphinidin-derivatives",compClass:"Anthocyanin",cas:"528-53-0",formula:"C15H11O7+",mw:303.24,organ:"Petals",activity:"Antioxidant, pigment",category:"Cosmeceutical / Natural dye",therapeutic:"—",cosmetic:"Natural blue pigment",evidence:"Early research",stage:"Discovery",confidence:0.40,pubchem:68245,ip:"High — unique blue from endangered source",note:"One of rarest natural blue pigments; genetic bottleneck limits supply"},
  {id:"MET-009",species:"GEO-0005",speciesName:"Alstroemeria ligtu",compound:"Tuliposide A-derivatives",compClass:"Glycoside / Phenolic",cas:"17390-77-3",formula:"C11H16O7",mw:264.23,organ:"Tuber, Leaves",activity:"Antimicrobial, anti-inflammatory",category:"Pharmacological",therapeutic:"Dermatology",cosmetic:"Preservative potential",evidence:"Preclinical",stage:"Discovery",confidence:0.45,pubchem:5281143,ip:"Medium — Chilean endemic source adds narrative",note:"Contact dermatitis allergen at high conc.; therapeutic window needs study"},
  {id:"MET-010",species:"GEO-0006",speciesName:"Cyclamen coum",compound:"Cyclamin",compClass:"Triterpenoid saponin",cas:"526-95-4",formula:"C36H56O9",mw:636.82,organ:"Tuber",activity:"Anti-inflammatory, cytotoxic",category:"Pharmacological",therapeutic:"Oncology / ENT",cosmetic:"—",evidence:"Preclinical",stage:"Phase 0",confidence:0.55,pubchem:73622,ip:"Medium — Sinupret-type applications",note:"Cyclamen extracts in Sinupret® (sinus); endangered wild source"},
  {id:"MET-011",species:"GEO-0007",speciesName:"Crocus sativus",compound:"Crocin",compClass:"Carotenoid glycoside",cas:"42553-65-1",formula:"C44H64O24",mw:976.96,organ:"Stigma",activity:"Antidepressant, neuroprotective, antioxidant",category:"Nutraceutical / Pharma",therapeutic:"CNS, Ophthalmology",cosmetic:"Skin radiance",evidence:"Clinical trials",stage:"Phase II-III",confidence:0.92,pubchem:5281233,ip:"Low — saffron commodity; value in quality + origin",note:"Meta-analyses support antidepressant efficacy; $2B saffron market"},
  {id:"MET-012",species:"GEO-0007",speciesName:"Crocus sativus",compound:"Safranal",compClass:"Monoterpenoid aldehyde",cas:"116-26-7",formula:"C10H14O",mw:150.22,organ:"Stigma",activity:"Anxiolytic, antioxidant, aroma",category:"Nutraceutical / Pharma",therapeutic:"CNS",cosmetic:"Fragrance, calming",evidence:"Clinical",stage:"Phase II",confidence:0.88,pubchem:61041,ip:"Low — key saffron volatile",note:"Drives saffron aroma and part of therapeutic effect"},
  {id:"MET-013",species:"GEO-0007",speciesName:"Crocus sativus",compound:"Picrocrocin",compClass:"Glycoside",cas:"138-55-6",formula:"C16H26O7",mw:330.37,organ:"Stigma",activity:"Bitter tastant, antitumor",category:"Nutraceutical",therapeutic:"Oncology (emerging)",cosmetic:"—",evidence:"Preclinical",stage:"Phase 0",confidence:0.70,pubchem:5281231,ip:"Low — part of saffron quality triad",note:"Drives bitterness; quality marker ISO 3632"},
  {id:"MET-014",species:"GEO-0008",speciesName:"Leucocoryne purpurea",compound:"Alliin-derivatives",compClass:"Sulfur amino acid",cas:"556-27-4",formula:"C6H11NO3S",mw:177.22,organ:"Bulb",activity:"Antimicrobial, antioxidant",category:"Pharmacological",therapeutic:"Antimicrobial",cosmetic:"Natural preservative",evidence:"Early research",stage:"Discovery",confidence:0.35,pubchem:87310,ip:"Medium — Amaryllidaceae source uncommon for alliin",note:"Related to garlic chemistry; Chilean endemic adds uniqueness"},
];

/* ─── MARKET INTELLIGENCE ─── */
const MARKETS = [
  {id:"MKT-001",species:"GEO-0001",speciesName:"Fritillaria imperialis",area:"Dermocosmetics",segment:"Premium anti-aging ingredient",geo:"EU, Japan, US",size:"$41B",cagr:"8.8%",price:"\u20AC80-200/kg extract",premium:"3-5x vs synthetic",buyers:"EU cosmetic houses, K-beauty brands",competitors:"Bakuchiol, Retinol alternatives",diff:"Conservation-origin + traceable supply",demand:"Strong growth",gap:"Significant — no sustainable supply",cert:"COSMOS, Ecocert",claims:'"Conservation-origin", "Traceable"',spinoff:"Fritillaria Dermocosmetics",model:"B2B ingredient + IP license",readiness:"18-24 months",conf:0.55},
  {id:"MKT-002",species:"GEO-0001",speciesName:"Fritillaria imperialis",area:"TCM / Pharma",segment:"Bei Mu respiratory medicine",geo:"China, SE Asia, diaspora",size:"$5B+ (TCM respiratory)",cagr:"12%",price:">$500/kg wild bulb",premium:"10-50x cultivated vs wild",buyers:"TCM distributors, pharma companies",competitors:"Wild-harvested Bei Mu",diff:"Sustainable, traceable, ABS-compliant",demand:"Very strong",gap:"Critical — wild supply declining rapidly",cert:"GMP, TCM quality standards",claims:'"Sustainably cultivated", "Lab-verified alkaloid content"',spinoff:"Fritillaria Dermocosmetics / Pharma",model:"B2B raw material + alkaloid extract",readiness:"24-36 months",conf:0.50},
  {id:"MKT-003",species:"GEO-0002",speciesName:"Lilium candidum",area:"Clean Beauty",segment:"Mediterranean botanical ingredient",geo:"EU, US, Japan",size:"$12B (clean beauty)",cagr:"9.5%",price:"\u20AC50-150/kg extract",premium:"2-3x vs generic botanical",buyers:"Clean beauty brands, formulators",competitors:"Rose, Lavender, Chamomile extracts",diff:"Heritage Mediterranean species + conservation story",demand:"Growing rapidly",gap:"Moderate — some cultivation exists",cert:"COSMOS, Ecocert, Natrue",claims:'"Mediterranean Lily Complex\u00AE", "Heritage plant"',spinoff:"Lilium Clean Beauty",model:"B2B ingredient supply",readiness:"12-18 months",conf:0.70},
  {id:"MKT-004",species:"GEO-0003",speciesName:"Orchis italica",area:"Premium Food / Pharma",segment:"Sustainable salep source",geo:"Turkey, Middle East, EU",size:"$8B (hydrocolloid market)",cagr:"6.2%",price:"\u20AC200-400/kg (salep powder)",premium:"5-10x vs konjac alternative",buyers:"Traditional ice cream makers, pharma",competitors:"Wild-harvested salep, konjac gum",diff:"Only sustainable, legal salep source",demand:"Strong — traditional demand exceeds supply",gap:"Extreme — illegal harvest dominates",cert:"Organic, fair trade",claims:'"Zero wild harvest", "Conservation salep"',spinoff:"Orchid Mucilage / Salep",model:"B2B ingredient + branded retail",readiness:"24-36 months",conf:0.48},
  {id:"MKT-005",species:"GEO-0004",speciesName:"Tecophilaea cyanocrocus",area:"Ultra-premium ornamental",segment:"Collector bulb market",geo:"Netherlands, UK, Japan, US",size:"$2B (specialty bulb niche)",cagr:"4.5%",price:"\u20AC50-200/bulb (collector)",premium:"100x vs common crocus",buyers:"Specialist nurseries, collectors",competitors:"Existing ex situ clones (genetic bottleneck)",diff:"Conservation-multiplied, genetic diversity",demand:"Steady collector demand",gap:"Extreme — near-extinct in wild",cert:"CITES-compliant documentation",claims:'"Conservation-bred", "Chilean origin verified"',spinoff:"Vitalcore Andes",model:"B2C collector + B2B nursery",readiness:"36-48 months",conf:0.40},
  {id:"MKT-006",species:"GEO-0007",speciesName:"Crocus sativus",area:"Spice / Nutraceutical",segment:"Premium origin-verified saffron",geo:"Global",size:"$2B (saffron market)",cagr:"7.3%",price:"\u20AC3,000-15,000/kg",premium:"2-3x for origin-certified",buyers:"Gourmet food, supplement cos, pharma",competitors:"Iran, Spain, Kashmir saffron",diff:"Turkish origin, blockchain-traced, cooperative model",demand:"Very strong — fastest growing spice",gap:"Moderate — production expandable",cert:"ISO 3632, GMP",claims:'"Safranbolu Origin", "QR-traced", "Cooperative"',spinoff:"Anatolia Bulbs",model:"B2B bulk + B2C branded",readiness:"6-12 months",conf:0.88},
  {id:"MKT-007",species:"GEO-0006",speciesName:"Cyclamen coum",area:"Ornamental",segment:"Hardy garden bulb",geo:"EU, UK, US",size:"$68B (global nursery/garden)",cagr:"4.8%",price:"\u20AC2-8/bulb retail",premium:"2x for verified nursery-propagated",buyers:"Garden centers, landscape designers",competitors:"Turkish wild-collected (CITES II)",diff:"Verified propagated, zero wild-harvest",demand:"Steady",gap:"Moderate — wild collection still dominates",cert:"CITES propagation certificate",claims:'"Nursery-bred", "Zero wild harvest"',spinoff:"Anatolia Bulbs",model:"B2B wholesale nursery",readiness:"6-12 months",conf:0.85},
];

/* ─── PARTNER NETWORK ─── */
const PARTNERS = {
  researchers: [
    {id:"RES-001",name:"Prof. Mehmet Elmastaş",inst:"INST-001",country:"TR",expertise:"Plant secondary metabolites, Fritillaria alkaloids",hIndex:28,pubs:95,fit:"WP3 Lead — Metabolite Analysis",priority:"high",species:["GEO-0001"]},
    {id:"RES-002",name:"Prof. Sevil Arabacı",inst:"INST-002",country:"TR",expertise:"Tissue culture, micropropagation of geophytes",hIndex:22,pubs:68,fit:"WP2 Lead — In Vitro Propagation",priority:"high",species:["GEO-0001","GEO-0003","GEO-0006"]},
    {id:"RES-003",name:"Dr. Cristina Ferrrandiz",inst:"INST-004",country:"ES",expertise:"Lilium genetics, ornamental breeding",hIndex:18,pubs:42,fit:"WP4 — Breeding programs",priority:"medium",species:["GEO-0002"]},
    {id:"RES-004",name:"Prof. Jean-Denis Duclercq",inst:"INST-005",country:"FR",expertise:"Plant biotechnology, TIS bioreactors",hIndex:20,pubs:55,fit:"Scale-up and TIS optimization",priority:"high",species:["GEO-0002","GEO-0001"]},
    {id:"RES-005",name:"Dr. Marlene Gebauer",inst:"INST-006",country:"NL",expertise:"Ornamental bulb breeding, Cyclamen genetics",hIndex:15,pubs:38,fit:"WP4 — Ornamental selection",priority:"medium",species:["GEO-0006"]},
    {id:"RES-006",name:"Prof. Patricio Peñailillo",inst:"INST-007",country:"CL",expertise:"Chilean endemic flora, Alstroemeria taxonomy",hIndex:16,pubs:45,fit:"Chilean species expert, CORFO partner",priority:"high",species:["GEO-0005","GEO-0008"]},
    {id:"RES-007",name:"Dr. Marcela Parada",inst:"INST-008",country:"CL",expertise:"Tecophilaea conservation, cryopreservation",hIndex:12,pubs:28,fit:"Cryo campaign lead for Chilean species",priority:"high",species:["GEO-0004"]},
    {id:"RES-008",name:"Dr. Özlem Aydınoğlu",inst:"INST-003",country:"TR",expertise:"Orchid conservation, salep orchid ecology",hIndex:14,pubs:35,fit:"Salep species field ecology + TC",priority:"medium",species:["GEO-0003"]},
  ],
  institutions: [
    {id:"INST-001",name:"Atatürk University",acronym:"AÜ",country:"TR",city:"Erzurum",type:"University",focus:"Phytochemistry, plant secondary metabolites",role:"WP3 Analytical Lab",mou:"Planned"},
    {id:"INST-002",name:"Ankara University",acronym:"AÜ",country:"TR",city:"Ankara",type:"University",focus:"Plant tissue culture, in vitro propagation",role:"WP2 TC Lab",mou:"Planned"},
    {id:"INST-003",name:"Hacettepe University",acronym:"HÜ",country:"TR",city:"Ankara",type:"University",focus:"Orchid ecology, conservation biology",role:"Salep orchid specialist",mou:"Planned"},
    {id:"INST-004",name:"Royal Botanic Gardens Kew",acronym:"Kew",country:"UK",city:"London",type:"Research institute",focus:"Conservation, taxonomy, seed banking",role:"Taxonomy advisor, cryo partner",mou:"To negotiate"},
    {id:"INST-005",name:"INRAE France",acronym:"INRAE",country:"FR",city:"Versailles",type:"Research institute",focus:"Plant biotechnology, bioreactors",role:"TIS scale-up partner",mou:"Planned"},
    {id:"INST-006",name:"Wageningen University & Research",acronym:"WUR",country:"NL",city:"Wageningen",type:"University",focus:"Ornamental breeding, horticulture",role:"Breeding & market access",mou:"Planned"},
    {id:"INST-007",name:"Universidad Austral de Chile",acronym:"UACh",country:"CL",city:"Valdivia",type:"University",focus:"Chilean endemic flora, conservation",role:"CORFO partner, Chilean species lead",mou:"Planned"},
    {id:"INST-008",name:"Universidad de Chile",acronym:"UChile",country:"CL",city:"Santiago",type:"University",focus:"Conservation biology, cryopreservation",role:"Tecophilaea cryo campaign",mou:"Planned"},
    {id:"INST-009",name:"Edinburgh Royal Botanic Garden",acronym:"RBGE",country:"UK",city:"Edinburgh",type:"Research institute",focus:"Taxonomy, ex situ conservation",role:"Tecophilaea genetic assessment",mou:"To negotiate"},
    {id:"INST-010",name:"INIA Chile",acronym:"INIA",country:"CL",city:"Santiago",type:"Government research",focus:"Agricultural R&D, germplasm",role:"Chilean field trials + germplasm",mou:"Planned"},
  ],
  links: [
    {a:"RES-001",b:"INST-001",type:"Affiliated",project:"Fritillaria metabolomics",strength:"strong"},
    {a:"RES-002",b:"INST-002",type:"Affiliated",project:"Geophyte TC program",strength:"strong"},
    {a:"RES-003",b:"INST-004",type:"Collaborator",project:"Lilium breeding",strength:"medium"},
    {a:"RES-004",b:"INST-005",type:"Affiliated",project:"TIS bioreactor R&D",strength:"strong"},
    {a:"RES-005",b:"INST-006",type:"Affiliated",project:"Ornamental breeding",strength:"strong"},
    {a:"RES-006",b:"INST-007",type:"Affiliated",project:"Chilean flora program",strength:"strong"},
    {a:"RES-007",b:"INST-008",type:"Affiliated",project:"Cryo conservation",strength:"strong"},
    {a:"RES-008",b:"INST-003",type:"Affiliated",project:"Orchid conservation",strength:"medium"},
    {a:"INST-002",b:"INST-004",type:"Consortium",project:"Horizon Europe Fritillaria",strength:"planned"},
    {a:"INST-007",b:"INST-008",type:"Consortium",project:"CORFO Geofitas",strength:"planned"},
    {a:"INST-004",b:"INST-009",type:"Consortium",project:"Tecophilaea cryo",strength:"planned"},
    {a:"INST-005",b:"INST-002",type:"Collaboration",project:"TIS tech transfer",strength:"planned"},
  ],
};

/* ─── SPECIES (same as before) ─── */
const SPECIES=[
  {id:"GEO-0001",name:"Fritillaria imperialis",family:"Liliaceae",genus:"Fritillaria",type:"Bulbous",country:"TR",region:"E. Mediterranean",endemic:true,iucn:"VU",cites:"II",trend:"Decreasing",trl:3,decision:"Accelerate",rationale:"High market demand + critical conservation — flagship Fritillaria Dermocosmetics",scores:{conservation:82,science:68,production:55,governance:45,venture:78},composite:67,climate:0.65,regDrag:-0.15,spinoff:"Fritillaria Dermocosmetics",market:"Dermocosmetics",marketSize:"$41B",habitat:"Montane steppe · 1200-2800m",threats:["Illegal collection","Overgrazing","Habitat loss"],tc:"Pilot — bulb scale micropropagation",conf:0.75,partners:["Ankara Uni","Kew Gardens"],verified:"2026-04-13"},
  {id:"GEO-0002",name:"Lilium candidum",family:"Liliaceae",genus:"Lilium",type:"Bulbous",country:"TR",region:"Mediterranean",endemic:false,iucn:"LC",cites:"—",trend:"Stable",trl:4,decision:"Accelerate",rationale:"Strong cosmetic potential + established TIS — Lilium Clean Beauty anchor",scores:{conservation:45,science:72,production:70,governance:65,venture:85},composite:68,climate:0.40,regDrag:-0.05,spinoff:"Lilium Clean Beauty",market:"Clean Beauty",marketSize:"$12B",habitat:"Mediterranean scrubland · 200-1000m",threats:["Urbanization","Over-collection"],tc:"Established — TIS compatible",conf:0.82,partners:["Ege Uni","INRAE France"],verified:"2026-04-10"},
  {id:"GEO-0003",name:"Orchis italica",family:"Orchidaceae",genus:"Orchis",type:"Tuberous",country:"TR",region:"Mediterranean",endemic:false,iucn:"NT",cites:"II",trend:"Decreasing",trl:2,decision:"Develop",rationale:"Salep market demand; conservation urgency rising",scores:{conservation:75,science:60,production:35,governance:40,venture:70},composite:57,climate:0.55,regDrag:-0.20,spinoff:"Orchid Mucilage / Salep",market:"Premium Food/Pharma",marketSize:"$8B",habitat:"Grasslands · 300-1500m",threats:["Illegal salep harvest","Habitat degradation"],tc:"Challenging — asymbiotic germination",conf:0.55,partners:["Hacettepe Uni"],verified:"2026-04-08"},
  {id:"GEO-0004",name:"Tecophilaea cyanocrocus",family:"Tecophilaeaceae",genus:"Tecophilaea",type:"Cormous",country:"CL",region:"Chilean Mediterranean",endemic:true,iucn:"CR",cites:"—",trend:"Decreasing",trl:2,decision:"Urgent Conserve",rationale:"Critically endangered; genetic bottleneck — cryo campaign needed",scores:{conservation:95,science:55,production:30,governance:50,venture:60},composite:61,climate:0.80,regDrag:-0.10,spinoff:"Vitalcore Andes",market:"Ultra-premium ornamental",marketSize:"$2B niche",habitat:"Chilean matorral · 400-900m",threats:["Habitat loss","Wildfire","Over-collection"],tc:"Preliminary — needs cryopreservation",conf:0.45,partners:["U Chile","Edinburgh RBG","Kew"],verified:"2026-04-05"},
  {id:"GEO-0005",name:"Alstroemeria ligtu",family:"Alstroemeriaceae",genus:"Alstroemeria",type:"Rhizomatous",country:"CL",region:"Chilean Mediterranean",endemic:true,iucn:"VU",cites:"—",trend:"Decreasing",trl:3,decision:"Accelerate",rationale:"Chilean endemic — ideal for CORFO + ornamental market",scores:{conservation:70,science:65,production:60,governance:55,venture:75},composite:65,climate:0.70,regDrag:-0.08,spinoff:"Vitalcore Andes",market:"Ornamental + cosmetic",marketSize:"$15B",habitat:"Central Chilean forests · 200-1200m",threats:["Deforestation","Fire","Urbanization"],tc:"Moderate — rhizome + TC protocols",conf:0.62,partners:["U Austral","INIA Chile"],verified:"2026-04-11"},
  {id:"GEO-0006",name:"Cyclamen coum",family:"Primulaceae",genus:"Cyclamen",type:"Tuberous",country:"TR",region:"Pontic / Caucasus",endemic:false,iucn:"LC",cites:"II",trend:"Stable",trl:5,decision:"Scale",rationale:"Commercial-ready; lowest regulatory drag",scores:{conservation:40,science:70,production:80,governance:70,venture:72},composite:66,climate:0.30,regDrag:-0.05,spinoff:"Anatolia Bulbs",market:"Ornamental",marketSize:"$68B",habitat:"Deciduous woodland · 0-1500m",threats:["Wild collection"],tc:"Commercial — somatic embryogenesis",conf:0.88,partners:["Wageningen","Düzce Uni"],verified:"2026-04-12"},
  {id:"GEO-0007",name:"Crocus sativus",family:"Iridaceae",genus:"Crocus",type:"Cormous",country:"TR",region:"Multi-region",endemic:false,iucn:"—",cites:"—",trend:"Cultivated",trl:6,decision:"Scale",rationale:"Most valuable spice — advanced corm multiplication",scores:{conservation:30,science:85,production:90,governance:80,venture:90},composite:77,climate:0.35,regDrag:-0.02,spinoff:"Anatolia Bulbs",market:"Spice / Pharma",marketSize:"$2B saffron",habitat:"Semi-arid steppe · cultivated",threats:["Climate shift","Market competition"],tc:"Advanced — well documented",conf:0.92,partners:["Safranbolu Coop","Uni Kashmir"],verified:"2026-04-13"},
  {id:"GEO-0008",name:"Leucocoryne purpurea",family:"Amaryllidaceae",genus:"Leucocoryne",type:"Bulbous",country:"CL",region:"Atacama / Coquimbo",endemic:true,iucn:"VU",cites:"—",trend:"Decreasing",trl:2,decision:"Develop",rationale:"Chilean Glory-of-the-Sun; untapped ornamental + fragrance",scores:{conservation:72,science:50,production:40,governance:55,venture:65},composite:57,climate:0.60,regDrag:-0.08,spinoff:"Vitalcore Andes",market:"Cut flower / fragrance",marketSize:"$5B specialty",habitat:"Coastal desert · 100-600m",threats:["Mining","Urbanization","Drought"],tc:"Early — seed germination only",conf:0.40,partners:["U La Serena"],verified:"2026-04-06"},
];

const SOURCES=[
  {id:"SRC-001",name:"BGCI ThreatSearch",type:"Conservation",freq:"Monthly",status:"active",fresh:0.85,last:"2026-04-01",feeds:"Conservation"},
  {id:"SRC-002",name:"GBIF Occurrence",type:"Occurrence",freq:"Weekly",status:"active",fresh:0.92,last:"2026-04-10",feeds:"Locations"},
  {id:"SRC-003",name:"POWO (Kew)",type:"Taxonomy",freq:"Monthly",status:"active",fresh:0.88,last:"2026-03-28",feeds:"Species, Synonyms"},
  {id:"SRC-004",name:"KNApSAcK",type:"Metabolites",freq:"Monthly",status:"active",fresh:0.78,last:"2026-03-15",feeds:"Metabolites"},
  {id:"SRC-005",name:"OpenAlex",type:"Literature",freq:"Weekly",status:"active",fresh:0.95,last:"2026-04-12",feeds:"Publications"},
  {id:"SRC-006",name:"IUCN Red List",type:"Conservation",freq:"Annual",status:"active",fresh:0.70,last:"2025-12-10",feeds:"Conservation"},
  {id:"SRC-007",name:"CITES Species+",type:"Regulatory",freq:"Event",status:"active",fresh:0.82,last:"2026-02-20",feeds:"Regulatory"},
  {id:"SRC-008",name:"PubChem",type:"Chemistry",freq:"Continuous",status:"active",fresh:0.97,last:"2026-04-13",feeds:"Compounds"},
  {id:"SRC-009",name:"PubMed / PMC",type:"Literature",freq:"Daily",status:"active",fresh:0.96,last:"2026-04-13",feeds:"Biomedical pubs"},
  {id:"SRC-010",name:"SANBI Red List",type:"Conservation",freq:"Annual",status:"scheduled",fresh:0.55,last:"2025-08-01",feeds:"S. Africa"},
  {id:"SRC-011",name:"CONAF Chile",type:"Regulatory",freq:"Event",status:"active",fresh:0.72,last:"2026-01-15",feeds:"Chile regulation"},
  {id:"SRC-012",name:"ChEBI (EBI)",type:"Chemistry",freq:"Monthly",status:"active",fresh:0.90,last:"2026-04-02",feeds:"Ontology"},
];

const ROLES={admin:{label:"Admin",desc:"Full platform access",ic:"A",color:"#534AB7",accent:"#EEEDFE"},researcher:{label:"Researcher",desc:"Species, conservation & science",ic:"R",color:"#1D9E75",accent:"#E1F5EE"},investor:{label:"Investor",desc:"Commercial, market & scoring",ic:"I",color:"#D85A30",accent:"#FAECE7"},producer:{label:"Producer",desc:"Production & compliance",ic:"P",color:"#639922",accent:"#EAF3DE"},policymaker:{label:"Policymaker",desc:"Conservation & regulatory",ic:"K",color:"#185FA5",accent:"#E6F1FB"}};
const USERS={admin:{name:"Alpaslan",role:"admin"},researcher:{name:"Dr. Ayşe Kaya",role:"researcher"},investor:{name:"Henrik Larsson",role:"investor"},producer:{name:"Mehmet Çelik",role:"producer"},policymaker:{name:"Elena Rodriguez",role:"policymaker"}};

/* ─── STYLE HELPERS ─── */
const S={card:{background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",overflow:"hidden"},pill:(c,bg)=>({display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:500,color:c,background:bg,whiteSpace:"nowrap",lineHeight:1.6}),metric:{background:"#f4f3ef",padding:"8px 12px",borderRadius:8},mLabel:{fontSize:9,color:"#999",letterSpacing:0.4,textTransform:"uppercase",marginBottom:2},mVal:(c)=>({fontSize:20,fontWeight:700,color:c||"#2c2c2a",fontFamily:"Georgia,serif"}),sub:{fontSize:10,color:"#999"},input:{padding:"8px 12px",border:"1px solid #e8e6e1",borderRadius:8,fontSize:12,background:"#fff",outline:"none",color:"#2c2c2a"}};
const iucnC=s=>({CR:"#A32D2D",EN:"#854F0B",VU:"#BA7517",NT:"#3B6D11",LC:"#0F6E56"}[s]||"#888");
const iucnBg=s=>({CR:"#FCEBEB",EN:"#FAEEDA",VU:"#FFF3CD",NT:"#EAF3DE",LC:"#E1F5EE"}[s]||"#f1efe8");
const decC=d=>({Accelerate:"#0F6E56","Urgent Conserve":"#A32D2D",Develop:"#185FA5",Scale:"#3B6D11",Monitor:"#888"}[d]||"#888");
const decBg=d=>({Accelerate:"#E1F5EE","Urgent Conserve":"#FCEBEB",Develop:"#E6F1FB",Scale:"#EAF3DE",Monitor:"#f1efe8"}[d]||"#f1efe8");
const freshC=v=>v>0.85?"#0F6E56":v>0.65?"#BA7517":"#A32D2D";
const flag=c=>c==="TR"?"\uD83C\uDDF9\uD83C\uDDF7":c==="CL"?"\uD83C\uDDE8\uD83C\uDDF1":"\uD83C\uDF0D";

function Pill({children,color,bg}){return<span style={S.pill(color,bg)}>{children}</span>}
function Dot({color,size=6}){return<span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",background:color,flexShrink:0}}/>}
function MiniBar({value,max=100,color,h=5}){return<div style={{height:h,background:"#eae8e3",borderRadius:h/2,overflow:"hidden",flex:1}}><div style={{height:"100%",width:`${(value/max)*100}%`,background:color,borderRadius:h/2,transition:"width 0.6s ease"}}/></div>}

function RadarChart({scores,size=100}){const keys=Object.keys(scores),n=keys.length,cx=size/2,cy=size/2,r=size*0.36;const ang=i=>(Math.PI*2*i)/n-Math.PI/2;const pt=(i,v)=>{const a=ang(i),d=(v/100)*r;return[cx+d*Math.cos(a),cy+d*Math.sin(a)]};const cols={conservation:"#E24B4A",science:"#534AB7",production:"#1D9E75",governance:"#D85A30",venture:"#185FA5"};const dp=keys.map((k,i)=>pt(i,scores[k]));return<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{[25,50,75,100].map(lv=>{const pts=keys.map((_,i)=>pt(i,lv)).map(p=>`${p[0]},${p[1]}`).join(" ");return<polygon key={lv} points={pts} fill="none" stroke="#e8e6e1" strokeWidth="0.5"/>})}{keys.map((_,i)=>{const[ex,ey]=pt(i,100);return<line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e8e6e1" strokeWidth="0.5"/>})}<polygon points={dp.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="rgba(29,158,117,0.12)" stroke="#1D9E75" strokeWidth="1.5"/>{keys.map((k,i)=>{const[px,py]=pt(i,scores[k]);return<circle key={k} cx={px} cy={py} r={2.5} fill={cols[k]}/>})}{keys.map((k,i)=>{const[lx,ly]=pt(i,118);return<text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" style={{fontSize:8,fill:"#999"}}>{k.slice(0,4).toUpperCase()}</text>})}</svg>}

/* ─── LOGIN ─── */
function LoginScreen({onLogin}){const[sel,setSel]=useState("admin");const[ready,setReady]=useState(false);useEffect(()=>{setTimeout(()=>setReady(true),100)},[]);return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#f8f7f4"}}><div style={{width:"100%",maxWidth:440,opacity:ready?1:0,transform:ready?"translateY(0)":"translateY(16px)",transition:"all 0.6s ease"}}><div style={{textAlign:"center",marginBottom:32}}><div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:60,height:60,borderRadius:16,background:"linear-gradient(145deg,#085041,#1D9E75)",marginBottom:14,boxShadow:"0 6px 24px rgba(8,80,65,0.25)"}}><span style={{color:"#fff",fontSize:26,fontWeight:700,fontFamily:"Georgia,serif"}}>A</span></div><h1 style={{fontSize:28,fontWeight:700,letterSpacing:-1,color:"#2c2c2a",margin:"0 0 4px",fontFamily:"Georgia,serif"}}>GEOCON <span style={{fontWeight:400,letterSpacing:3,fontSize:22}}>ATLAS</span></h1><p style={{fontSize:13,color:"#888",margin:0}}>Global geophyte intelligence platform</p><p style={{fontSize:10,color:"#b4b2a9",margin:"6px 0 0",letterSpacing:1}}>POWERED BY VENN BIOVENTURES</p></div><div style={{...S.card,padding:"24px 24px 20px"}}><p style={{fontSize:11,color:"#b4b2a9",margin:"0 0 14px",letterSpacing:0.5,textTransform:"uppercase"}}>Select your role</p><div style={{display:"flex",flexDirection:"column",gap:6}}>{Object.entries(ROLES).map(([k,r])=><button key={k} onClick={()=>setSel(k)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",border:sel===k?`2px solid ${r.color}`:"1px solid #e8e6e1",borderRadius:10,background:sel===k?r.accent:"#fff",cursor:"pointer",transition:"all 0.15s",textAlign:"left"}}><div style={{width:34,height:34,borderRadius:8,background:r.color,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:14,fontWeight:600}}>{r.ic}</span></div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:"#2c2c2a"}}>{r.label}</div><div style={{fontSize:10,color:"#b4b2a9"}}>{r.desc}</div></div>{sel===k&&<Dot color={r.color} size={8}/>}</button>)}</div><button onClick={()=>onLogin(USERS[sel])} style={{width:"100%",padding:"12px 0",border:"none",borderRadius:10,marginTop:18,background:ROLES[sel].color,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}onMouseEnter={e=>e.target.style.opacity="0.9"}onMouseLeave={e=>e.target.style.opacity="1"}>Enter as {ROLES[sel].label}</button></div></div></div>}

/* ─── SPECIES CARD (compact) ─── */
function SpeciesCard({sp,role,expanded,onToggle}){const sc={conservation:"#E24B4A",science:"#534AB7",production:"#1D9E75",governance:"#D85A30",venture:"#185FA5"};return<div onClick={onToggle} style={{...S.card,cursor:"pointer",border:expanded?"2px solid #85B7EB":"1px solid #e8e6e1",transition:"all 0.2s"}}><div style={{height:3,background:`linear-gradient(90deg,${iucnC(sp.iucn)}88,${decC(sp.decision)}88)`}}/><div style={{padding:"12px 14px 10px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:8}}><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:13}}>{flag(sp.country)}</span><span style={{fontSize:13,fontWeight:600,fontStyle:"italic",color:"#2c2c2a",fontFamily:"Georgia,serif"}}>{sp.name}</span></div><div style={{fontSize:9,color:"#b4b2a9",marginTop:1}}>{sp.family} · {sp.type} · {sp.region}</div></div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}><Pill color={iucnC(sp.iucn)} bg={iucnBg(sp.iucn)}>{sp.iucn||"NE"}</Pill><Pill color={decC(sp.decision)} bg={decBg(sp.decision)}>{sp.decision}</Pill></div></div><div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{flex:1}}>{Object.entries(sp.scores).map(([k,v])=><div key={k} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><span style={{fontSize:8,color:"#b4b2a9",width:32,textAlign:"right"}}>{k.slice(0,5)}</span><MiniBar value={v} color={sc[k]} h={4}/><span style={{fontSize:8,fontWeight:600,color:"#5f5e5a",width:16,textAlign:"right"}}>{v}</span></div>)}</div><RadarChart scores={sp.scores} size={85}/></div><div style={{display:"flex",gap:4,marginTop:8}}>{[{l:"Comp.",v:sp.composite},{l:"TRL",v:sp.trl},{l:"Conf.",v:`${Math.round(sp.conf*100)}%`}].map(m=><div key={m.l} style={{flex:1,...S.metric,textAlign:"center",padding:"4px 6px"}}><div style={{fontSize:7,color:"#999",textTransform:"uppercase"}}>{m.l}</div><div style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{m.v}</div></div>)}</div></div>{expanded&&<div style={{padding:"0 14px 14px",borderTop:"1px solid #e8e6e1",paddingTop:12}}><p style={{fontSize:11,color:"#5f5e5a",margin:"0 0 8px",lineHeight:1.5}}>{sp.rationale}</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px",fontSize:10}}>{[{l:"Spin-off",v:sp.spinoff},{l:"Market",v:`${sp.market} (${sp.marketSize})`},{l:"Habitat",v:sp.habitat},{l:"TC",v:sp.tc}].map(({l,v})=><div key={l}><span style={{color:"#b4b2a9",fontSize:9}}>{l}</span><div style={{color:"#2c2c2a",fontWeight:500}}>{v}</div></div>)}</div><div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:6}}>{sp.threats.map(t=><Pill key={t} color="#791F1F" bg="#FCEBEB">{t}</Pill>)}{sp.partners.map(p=><Pill key={p} color="#0C447C" bg="#E6F1FB">{p}</Pill>)}</div><div style={{fontSize:8,color:"#b4b2a9",marginTop:6}}>Verified: {sp.verified} · {sp.id}</div></div>}</div>}

/* ─── METABOLITE EXPLORER ─── */
function MetaboliteExplorer({role}){
  const[search,setSearch]=useState("");
  const[catFilter,setCatFilter]=useState("all");
  const[expanded,setExpanded]=useState(null);
  const restricted=role==="producer";
  const cats=[...new Set(METABOLITES.map(m=>m.category))];
  const filtered=METABOLITES.filter(m=>{if(search&&!m.compound.toLowerCase().includes(search.toLowerCase())&&!m.speciesName.toLowerCase().includes(search.toLowerCase())&&!m.activity.toLowerCase().includes(search.toLowerCase()))return false;if(catFilter!=="all"&&m.category!==catFilter)return false;return true;});
  const classColors={"Isosteroidal alkaloid":"#534AB7","Flavonoid":"#1D9E75","Phytosterol":"#639922","Polysaccharide":"#D85A30","Anthocyanin":"#185FA5","Triterpenoid saponin":"#993556","Carotenoid glycoside":"#BA7517","Monoterpenoid aldehyde":"#854F0B","Glycoside":"#0F6E56","Glycoside / Phenolic":"#3B6D11","Sulfur amino acid":"#5F5E5A"};

  return<div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <input type="text" placeholder="Search compound, species, or activity..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:"1 1 200px",minWidth:150,...S.input}}/>
      <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={S.input}><option value="all">All categories</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      {[{l:"Total compounds",v:METABOLITES.length},{l:"Pharma pipeline",v:METABOLITES.filter(m=>m.category==="Pharmacological").length},{l:"Cosmeceutical",v:METABOLITES.filter(m=>m.category.includes("Cosmeceutical")).length},{l:"Clinical stage",v:METABOLITES.filter(m=>m.evidence.includes("Clinical")).length}].map(s=><div key={s.l} style={{flex:"1 1 100px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}
    </div>
    <p style={S.sub}>{filtered.length} compounds · Click to expand</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:8}}>
      {filtered.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{...S.card,padding:14,cursor:"pointer",border:expanded===m.id?"2px solid #85B7EB":"1px solid #e8e6e1"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div><div style={{fontSize:14,fontWeight:600,color:"#2c2c2a"}}>{m.compound}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888"}}>{m.speciesName}</div></div>
          <Pill color={classColors[m.compClass]||"#888"} bg={(classColors[m.compClass]||"#888")+"18"}>{m.compClass}</Pill>
        </div>
        <div style={{fontSize:11,color:"#5f5e5a",marginBottom:6}}>{m.activity}</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          <Pill color="#0C447C" bg="#E6F1FB">{m.category}</Pill>
          <Pill color="#085041" bg="#E1F5EE">{m.evidence}</Pill>
          {m.therapeutic!=="—"&&<Pill color="#3C3489" bg="#EEEDFE">{m.therapeutic}</Pill>}
          {m.cosmetic!=="—"&&<Pill color="#993556" bg="#FBEAF0">{m.cosmetic}</Pill>}
        </div>
        <div style={{display:"flex",gap:6,marginTop:8}}>
          <div style={{flex:1,...S.metric,padding:"3px 6px",textAlign:"center"}}><div style={{fontSize:7,color:"#999",textTransform:"uppercase"}}>Conf.</div><div style={{fontSize:12,fontWeight:700,color:"#2c2c2a"}}>{Math.round(m.confidence*100)}%</div></div>
          {m.mw&&<div style={{flex:1,...S.metric,padding:"3px 6px",textAlign:"center"}}><div style={{fontSize:7,color:"#999",textTransform:"uppercase"}}>MW</div><div style={{fontSize:12,fontWeight:700,color:"#2c2c2a"}}>{m.mw}</div></div>}
          <div style={{flex:1,...S.metric,padding:"3px 6px",textAlign:"center"}}><div style={{fontSize:7,color:"#999",textTransform:"uppercase"}}>Stage</div><div style={{fontSize:12,fontWeight:700,color:"#2c2c2a"}}>{m.stage}</div></div>
        </div>
        {expanded===m.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1",fontSize:11}}>
          {!restricted&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px"}}>{[{l:"Formula",v:m.formula},{l:"CAS",v:m.cas},{l:"Organ",v:m.organ},{l:"IP potential",v:m.ip},{l:"PubChem CID",v:m.pubchem||"—"},{l:"Extraction",v:m.organ+" extraction"}].map(({l,v})=><div key={l}><span style={{color:"#b4b2a9",fontSize:9}}>{l}</span><div style={{color:"#2c2c2a"}}>{v}</div></div>)}</div>}
          <div style={{fontSize:10,color:"#5f5e5a",marginTop:6,fontStyle:"italic"}}>{m.note}</div>
          {restricted&&<div style={{marginTop:6,padding:"6px 10px",borderRadius:8,background:"#FFF3CD",fontSize:10,color:"#854F0B"}}>Compound details restricted. Contact admin for full access.</div>}
        </div>}
      </div>)}
    </div>
  </div>;
}

/* ─── MARKET INTELLIGENCE ─── */
function MarketView({role}){
  const[expanded,setExpanded]=useState(null);
  const restricted=role==="policymaker";
  const totalTAM=MARKETS.reduce((a,m)=>{const n=parseFloat(m.size.replace(/[^0-9.]/g,""));return a+(isNaN(n)?0:n)},0);
  return<div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      {[{l:"Market hypotheses",v:MARKETS.length},{l:"Spin-offs linked",v:[...new Set(MARKETS.map(m=>m.spinoff))].length},{l:"Near-ready (< 12mo)",v:MARKETS.filter(m=>m.readiness.includes("6-12")).length},{l:"Highest confidence",v:`${Math.round(Math.max(...MARKETS.map(m=>m.conf))*100)}%`}].map(s=><div key={s.l} style={{flex:"1 1 110px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:10}}>
      {MARKETS.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{...S.card,padding:16,cursor:"pointer",border:expanded===m.id?"2px solid #85B7EB":"1px solid #e8e6e1"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><div style={{fontSize:14,fontWeight:600,color:"#2c2c2a"}}>{m.area}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888"}}>{m.speciesName} — {m.segment}</div></div>
          <Pill color="#085041" bg="#E1F5EE">{m.spinoff}</Pill>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
          <div style={{...S.metric,textAlign:"center",padding:"6px"}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase"}}>Market size</div><div style={{fontSize:14,fontWeight:700,color:"#1D9E75"}}>{m.size}</div></div>
          <div style={{...S.metric,textAlign:"center",padding:"6px"}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase"}}>CAGR</div><div style={{fontSize:14,fontWeight:700,color:"#534AB7"}}>{m.cagr}</div></div>
          <div style={{...S.metric,textAlign:"center",padding:"6px"}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase"}}>Price</div><div style={{fontSize:11,fontWeight:700,color:"#D85A30"}}>{m.price}</div></div>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          <Pill color="#0C447C" bg="#E6F1FB">{m.geo}</Pill>
          <Pill color={m.demand.includes("Very")?"#085041":"#3B6D11"} bg={m.demand.includes("Very")?"#E1F5EE":"#EAF3DE"}>{m.demand}</Pill>
          <Pill color="#854F0B" bg="#FAEEDA">{m.readiness}</Pill>
        </div>
        {expanded===m.id&&!restricted&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1",fontSize:11}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px"}}>{[{l:"Key buyers",v:m.buyers},{l:"Competitors",v:m.competitors},{l:"Differentiation",v:m.diff},{l:"Supply gap",v:m.gap},{l:"Certification",v:m.cert},{l:"Revenue model",v:m.model},{l:"Premium",v:m.premium},{l:"Labels/Claims",v:m.claims}].map(({l,v})=><div key={l}><span style={{color:"#b4b2a9",fontSize:9}}>{l}</span><div style={{color:"#2c2c2a",fontWeight:500}}>{v}</div></div>)}</div>
          <div style={{marginTop:6}}><MiniBar value={m.conf*100} color="#1D9E75" h={4}/><span style={S.sub}> Confidence: {Math.round(m.conf*100)}%</span></div>
        </div>}
        {expanded===m.id&&restricted&&<div style={{marginTop:10,padding:"6px 10px",borderRadius:8,background:"#FFF3CD",fontSize:10,color:"#854F0B"}}>Market details restricted for Policymaker role.</div>}
      </div>)}
    </div>
  </div>;
}

/* ─── PARTNER NETWORK ─── */
function PartnerView(){
  const[tab,setTab]=useState("researchers");
  const[expanded,setExpanded]=useState(null);
  const priorityColor={high:"#0F6E56",medium:"#BA7517",candidate:"#888"};
  const priorityBg={high:"#E1F5EE",medium:"#FAEEDA",candidate:"#f1efe8"};
  return<div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      {[{l:"Researchers",v:PARTNERS.researchers.length},{l:"Institutions",v:PARTNERS.institutions.length},{l:"Active links",v:PARTNERS.links.length},{l:"Countries",v:[...new Set([...PARTNERS.researchers.map(r=>r.country),...PARTNERS.institutions.map(i=>i.country)])].length}].map(s=><div key={s.l} style={{flex:"1 1 100px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}
    </div>
    <div style={{display:"flex",gap:2,marginBottom:12}}>
      {["researchers","institutions","links"].map(t=><button key={t} onClick={()=>{setTab(t);setExpanded(null)}} style={{padding:"6px 14px",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,background:tab===t?"#f4f3ef":"transparent",color:tab===t?"#2c2c2a":"#888",fontWeight:tab===t?600:400}}>
        {t.charAt(0).toUpperCase()+t.slice(1)}
      </button>)}
    </div>
    {tab==="researchers"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>
      {PARTNERS.researchers.map(r=><div key={r.id} onClick={()=>setExpanded(expanded===r.id?null:r.id)} style={{...S.card,padding:14,cursor:"pointer",border:expanded===r.id?"2px solid #85B7EB":"1px solid #e8e6e1"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{r.name}</div><div style={{fontSize:10,color:"#888"}}>{r.expertise}</div></div>
          <Pill color={priorityColor[r.priority]} bg={priorityBg[r.priority]}>{r.priority}</Pill>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
          <Pill color="#0C447C" bg="#E6F1FB">{flag(r.country)} {r.country}</Pill>
          <Pill color="#3C3489" bg="#EEEDFE">h-index: {r.hIndex}</Pill>
          <Pill color="#085041" bg="#E1F5EE">{r.pubs} pubs</Pill>
        </div>
        <div style={{fontSize:10,color:"#5f5e5a"}}>{r.fit}</div>
        {expanded===r.id&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #e8e6e1"}}>
          <div style={{fontSize:10,color:"#888"}}>Institution: {PARTNERS.institutions.find(i=>i.id===r.inst)?.name||"—"}</div>
          <div style={{fontSize:10,color:"#888",marginTop:2}}>Species: {r.species.map(s=>SPECIES.find(sp=>sp.id===s)?.name).join(", ")}</div>
        </div>}
      </div>)}
    </div>}
    {tab==="institutions"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>
      {PARTNERS.institutions.map(i=><div key={i.id} onClick={()=>setExpanded(expanded===i.id?null:i.id)} style={{...S.card,padding:14,cursor:"pointer",border:expanded===i.id?"2px solid #85B7EB":"1px solid #e8e6e1"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{i.name}</div><div style={{fontSize:10,color:"#888"}}>{i.city}, {i.country} · {i.type}</div></div>
          <Pill color="#0C447C" bg="#E6F1FB">{i.acronym}</Pill>
        </div>
        <div style={{fontSize:11,color:"#5f5e5a",marginBottom:4}}>{i.focus}</div>
        <div style={{display:"flex",gap:4}}>
          <Pill color="#085041" bg="#E1F5EE">{i.role}</Pill>
          <Pill color={i.mou==="Planned"?"#BA7517":"#888"} bg={i.mou==="Planned"?"#FAEEDA":"#f1efe8"}>MOU: {i.mou}</Pill>
        </div>
      </div>)}
    </div>}
    {tab==="links"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>
      {PARTNERS.links.map((lk,idx)=>{
        const aName=PARTNERS.researchers.find(r=>r.id===lk.a)?.name||PARTNERS.institutions.find(i=>i.id===lk.a)?.name||lk.a;
        const bName=PARTNERS.researchers.find(r=>r.id===lk.b)?.name||PARTNERS.institutions.find(i=>i.id===lk.b)?.name||lk.b;
        return<div key={idx} style={{...S.card,padding:14}}>
          <div style={{fontSize:12,color:"#2c2c2a",marginBottom:4}}><strong>{aName}</strong> <span style={{color:"#888"}}>\u2194</span> <strong>{bName}</strong></div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            <Pill color="#3C3489" bg="#EEEDFE">{lk.type}</Pill>
            <Pill color={lk.strength==="strong"?"#0F6E56":"#BA7517"} bg={lk.strength==="strong"?"#E1F5EE":"#FAEEDA"}>{lk.strength}</Pill>
            <Pill color="#0C447C" bg="#E6F1FB">{lk.project}</Pill>
          </div>
        </div>
      })}
    </div>}
  </div>;
}

/* ─── SOURCES PANEL ─── */
function SourcesPanel(){return<div><div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Total",v:SOURCES.length},{l:"Active",v:SOURCES.filter(s=>s.status==="active").length},{l:"Freshness",v:`${Math.round(SOURCES.reduce((a,s)=>a+s.fresh,0)/SOURCES.length*100)}%`}].map(s=><div key={s.l} style={{flex:"1 1 100px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>{SOURCES.map(src=><div key={src.id} style={{...S.card,padding:"10px 12px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{src.name}</span><div style={{display:"flex",alignItems:"center",gap:3}}><Dot color={freshC(src.fresh)}/><span style={{fontSize:10,fontWeight:600,color:freshC(src.fresh)}}>{Math.round(src.fresh*100)}%</span></div></div><div style={{display:"flex",gap:3,marginBottom:4}}><Pill color="#0C447C" bg="#E6F1FB">{src.type}</Pill><Pill color={src.status==="active"?"#085041":"#854F0B"} bg={src.status==="active"?"#E1F5EE":"#FAEEDA"}>{src.status}</Pill></div><div style={S.sub}>Feeds: {src.feeds} · {src.freq} · {src.last}</div><div style={{marginTop:3}}><MiniBar value={src.fresh*100} color={freshC(src.fresh)} h={3}/></div></div>)}</div></div>}

/* ─── PORTFOLIO VIEW ─── */
function PortfolioView(){return<div><p style={S.sub}>Composite vs. conservation — bubble size = venture score</p><div style={{position:"relative",width:"100%",height:320,background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",overflow:"hidden",marginTop:8}}>{[25,50,75].map(v=><div key={v} style={{position:"absolute",left:0,right:0,bottom:`${v}%`,borderBottom:"1px dashed #eae8e3"}}/>)}<span style={{position:"absolute",left:6,bottom:4,...S.sub}}>Low conservation</span><span style={{position:"absolute",left:6,top:4,...S.sub}}>High conservation</span><span style={{position:"absolute",right:6,bottom:4,...S.sub}}>High composite &rarr;</span>{SPECIES.map(sp=>{const x=((sp.composite-40)/50)*82+9,y=100-((sp.scores.conservation-20)/80)*88,sz=16+(sp.scores.venture/100)*28;return<div key={sp.id} title={`${sp.name}\nComp:${sp.composite} Cons:${sp.scores.conservation} Vent:${sp.scores.venture}`} style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:sz,height:sz,borderRadius:"50%",background:iucnC(sp.iucn),opacity:0.75,transform:"translate(-50%,-50%)",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"default",transition:"transform 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translate(-50%,-50%) scale(1.3)";e.currentTarget.style.opacity="1"}} onMouseLeave={e=>{e.currentTarget.style.transform="translate(-50%,-50%) scale(1)";e.currentTarget.style.opacity="0.75"}}><span style={{fontSize:7,color:"#fff",fontWeight:700}}>{sp.genus.slice(0,3)}</span></div>})}</div><div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap",justifyContent:"center"}}>{SPECIES.map(sp=><div key={sp.id} style={{display:"flex",alignItems:"center",gap:3,...S.sub}}><Dot color={iucnC(sp.iucn)} size={5}/><span style={{fontStyle:"italic"}}>{sp.name.split(" ").slice(0,2).join(" ")}</span></div>)}</div></div>}

/* ═══ MAIN APP ═══ */
export default function Home(){
  const[user,setUser]=useState(null);const[view,setView]=useState("species");const[search,setSearch]=useState("");const[fC,setFC]=useState("all");const[fD,setFD]=useState("all");const[sort,setSort]=useState("composite");const[exp,setExp]=useState(null);const[side,setSide]=useState(true);
  if(!user)return<LoginScreen onLogin={setUser}/>;
  const role=ROLES[user.role];
  const filtered=SPECIES.filter(s=>{if(search&&!s.name.toLowerCase().includes(search.toLowerCase())&&!s.genus.toLowerCase().includes(search.toLowerCase()))return false;if(fC!=="all"&&s.country!==fC)return false;if(fD!=="all"&&s.decision!==fD)return false;return true}).sort((a,b)=>{if(sort==="composite")return b.composite-a.composite;if(sort==="conservation")return b.scores.conservation-a.scores.conservation;if(sort==="venture")return b.scores.venture-a.scores.venture;if(sort==="trl")return b.trl-a.trl;return a.name.localeCompare(b.name)});
  const countries=[...new Set(SPECIES.map(s=>s.country))],decisions=[...new Set(SPECIES.map(s=>s.decision))];
  const navItems=[{key:"species",label:"Species",icon:"\uD83C\uDF3F"},{key:"metabolites",label:"Metabolites",icon:"\uD83E\uDDEA"},{key:"market",label:"Market",icon:"\uD83D\uDCB0"},{key:"partners",label:"Partners",icon:"\uD83E\uDD1D"},{key:"portfolio",label:"Portfolio",icon:"\uD83D\uDCCA"},{key:"sources",label:"Sources",icon:"\uD83D\uDD17"}];
  const avgComp=Math.round(SPECIES.reduce((a,s)=>a+s.composite,0)/SPECIES.length);
  const threatened=SPECIES.filter(s=>["CR","EN","VU"].includes(s.iucn)).length;
  return<div style={{display:"flex",minHeight:"100vh",background:"#f8f7f4"}}>
    {/* SIDEBAR */}
    <div style={{width:side?220:0,flexShrink:0,overflow:"hidden",background:"#fff",borderRight:"1px solid #e8e6e1",transition:"width 0.25s ease",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"18px 14px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}><div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(145deg,#085041,#1D9E75)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:14,fontWeight:700,fontFamily:"Georgia,serif"}}>A</span></div><div><div style={{fontSize:14,fontWeight:700,letterSpacing:-0.5,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>ATLAS</div><div style={{fontSize:7,color:"#b4b2a9",letterSpacing:1.5,textTransform:"uppercase"}}>GEOCON v2.1</div></div></div>
        <div style={{display:"flex",flexDirection:"column",gap:1}}>{navItems.map(n=><button key={n.key} onClick={()=>{setView(n.key);setExp(null)}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",border:"none",borderRadius:7,cursor:"pointer",fontSize:11,background:view===n.key?"#f4f3ef":"transparent",color:view===n.key?"#2c2c2a":"#888",fontWeight:view===n.key?600:400,transition:"all 0.15s"}}><span style={{fontSize:13}}>{n.icon}</span>{n.label}</button>)}</div>
      </div>
      <div style={{padding:"0 14px",marginTop:4}}><div style={{padding:10,background:"#f4f3ef",borderRadius:8,fontSize:9,color:"#888",lineHeight:1.8}}><div><strong style={{color:"#2c2c2a"}}>{SPECIES.length}</strong> species · <strong style={{color:"#2c2c2a"}}>{METABOLITES.length}</strong> compounds</div><div><strong style={{color:"#2c2c2a"}}>{MARKETS.length}</strong> market hypotheses</div><div><strong style={{color:"#2c2c2a"}}>{PARTNERS.researchers.length}</strong> researchers · <strong style={{color:"#2c2c2a"}}>{PARTNERS.institutions.length}</strong> institutions</div></div></div>
      <div style={{marginTop:"auto",padding:"14px",borderTop:"1px solid #e8e6e1"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:26,height:26,borderRadius:6,background:role.color,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:10,fontWeight:600}}>{role.ic}</span></div><div><div style={{fontSize:11,fontWeight:600,color:"#2c2c2a"}}>{user.name}</div><div style={{fontSize:8,color:"#b4b2a9"}}>{role.label}</div></div></div><button onClick={()=>{setUser(null);setView("species")}} style={{width:"100%",padding:"5px 0",fontSize:9,color:"#888",background:"none",border:"1px solid #e8e6e1",borderRadius:6,cursor:"pointer"}}>Logout</button></div>
    </div>
    {/* MAIN */}
    <div style={{flex:1,minWidth:0,padding:"16px 20px 28px",overflow:"auto"}}>
      <button onClick={()=>setSide(!side)} style={{fontSize:16,background:"none",border:"none",cursor:"pointer",color:"#888",marginBottom:10,padding:0}}>{side?"\u25C0":"\u25B6"}</button>
      {/* Top metrics */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Species",v:SPECIES.length,c:"#1D9E75"},{l:"Compounds",v:METABOLITES.length,c:"#534AB7"},{l:"Markets",v:MARKETS.length,c:"#D85A30"},{l:"Partners",v:PARTNERS.researchers.length+PARTNERS.institutions.length,c:"#185FA5"},{l:"Threatened",v:threatened,c:"#E24B4A"}].map(s=><div key={s.l} style={{flex:"1 1 100px",...S.card,padding:"10px 14px",border:"1px solid #e8e6e1"}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal(s.c)}>{s.v}</div></div>)}</div>

      {view==="species"&&<><div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}><input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:"1 1 160px",minWidth:130,...S.input}}/><select value={fC} onChange={e=>setFC(e.target.value)} style={S.input}><option value="all">All countries</option>{countries.map(c=><option key={c} value={c}>{c==="TR"?"Türkiye":"Chile"}</option>)}</select><select value={fD} onChange={e=>setFD(e.target.value)} style={S.input}><option value="all">All decisions</option>{decisions.map(d=><option key={d} value={d}>{d}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)} style={S.input}><option value="composite">Composite</option><option value="conservation">Conservation</option><option value="venture">Venture</option><option value="trl">TRL</option><option value="name">Name</option></select></div><p style={{...S.sub,margin:"0 0 8px"}}>{filtered.length}/{SPECIES.length} species</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:8}}>{filtered.map(sp=><SpeciesCard key={sp.id} sp={sp} role={user.role} expanded={exp===sp.id} onToggle={()=>setExp(exp===sp.id?null:sp.id)}/>)}</div></>}
      {view==="metabolites"&&<MetaboliteExplorer role={user.role}/>}
      {view==="market"&&<MarketView role={user.role}/>}
      {view==="partners"&&<PartnerView/>}
      {view==="portfolio"&&<PortfolioView/>}
      {view==="sources"&&<SourcesPanel/>}

      <div style={{marginTop:32,paddingTop:10,borderTop:"1px solid #e8e6e1",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4,fontSize:8,color:"#b4b2a9"}}><span>GEOCON ATLAS v2.1 · 6 modules · {SPECIES.length} species · {METABOLITES.length} compounds · {MARKETS.length} markets</span><span>Venn BioVentures OÜ · Estonia</span></div>
    </div>
  </div>;
}
