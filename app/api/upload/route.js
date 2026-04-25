import { createClient } from "@supabase/supabase-js";

// ── Auth kontrolü ───────────────────────────────────────────
function checkAuth(request) {
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return false;
  }
  return true;
}

// ── Rate limiting (in-memory, basit) ────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 dakika
const RATE_LIMIT_MAX = 10; // dakikada max 10 istek

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - record.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  rateLimitMap.set(ip, record);
  return true;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const COLUMN_MAP = {
  "Tür (Latin)": "accepted_name", "Tür": "accepted_name", "Species": "accepted_name",
  "accepted_name": "accepted_name", "Latin Name": "accepted_name", "Tür Adı": "accepted_name",
  "tur": "accepted_name", "tür": "accepted_name", "latin": "accepted_name",
  "Bölge": "region", "Region": "region", "region": "region", "Yayılış": "region", "bolge": "region",
  "Statü": "iucn_status", "Status": "iucn_status", "IUCN": "iucn_status",
  "iucn_status": "iucn_status", "Koruma": "iucn_status", "Conservation": "iucn_status", "statu": "iucn_status",
  "Notlar/Kaynak": "notes", "Notlar": "notes", "Notes": "notes", "notes": "notes", "Kaynak": "notes", "notlar": "notes",
  "Çiçeklenme": "flowering", "Flowering": "flowering", "Bloom": "flowering", "ciceklenme": "flowering",
  "Habitat": "habitat", "habitat": "habitat",
  "Rakım": "elevation", "Altitude": "elevation", "Elevation": "elevation", "rakim": "elevation",
  "Kullanım": "usage", "Use": "usage", "Usage": "usage", "Kullanim": "usage", "kullanim": "usage",
  "Aile": "family", "Family": "family", "family": "family",
  "Cins": "genus", "Genus": "genus", "genus": "genus",
  "Endemik": "endemic", "Endemic": "endemic",
  "Ülke": "country_focus", "Country": "country_focus", "country": "country_focus",
  "Tehdit": "threats", "Threats": "threats", "threats": "threats",
  "CITES": "cites_appendix", "cites": "cites_appendix",
  "Trend": "population_trend", "trend": "population_trend",
  "TRL": "trl_level", "trl": "trl_level",
};

function mapRow(row) {
  const mapped = {};
  for (const [key, val] of Object.entries(row)) {
    const clean = (key || "").toString().trim();
    const cleanLower = clean.toLowerCase();
    const dbCol = COLUMN_MAP[clean] || COLUMN_MAP[cleanLower];
    if (dbCol && val !== undefined && val !== null && val !== "") {
      mapped[dbCol] = val;
    }
  }
  return mapped;
}

function extractGenus(name) {
  if (!name) return null;
  return name.trim().split(" ")[0];
}

function guessFamily(genus) {
  const families = {
    Fritillaria: "Liliaceae", Lilium: "Liliaceae", Tulipa: "Liliaceae",
    Crocus: "Iridaceae", Colchicum: "Colchicaceae",
    Cyclamen: "Primulaceae", Galanthus: "Amaryllidaceae",
    Narcissus: "Amaryllidaceae", Leucojum: "Amaryllidaceae",
    Leucocoryne: "Amaryllidaceae", Alstroemeria: "Alstroemeriaceae",
    Orchis: "Orchidaceae", Ophrys: "Orchidaceae", Dactylorhiza: "Orchidaceae",
    Tecophilaea: "Tecophilaeaceae", Muscari: "Asparagaceae",
    Allium: "Amaryllidaceae", Scilla: "Asparagaceae",
    Sternbergia: "Amaryllidaceae", Iris: "Iridaceae",
    Pancratium: "Amaryllidaceae", Boophone: "Amaryllidaceae",
    Lachenalia: "Asparagaceae", Zephyra: "Tecophilaeaceae",
  };
  return families[genus] || null;
}

function parseIUCN(val) {
  if (!val) return null;
  const s = val.toString().trim().toUpperCase();
  const valid = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];
  if (valid.includes(s)) return s;
  if (s.includes("CRITICALLY") || s.includes("KRİTİK")) return "CR";
  if (s.includes("ENDANGERED") || s.includes("TEHLİKE")) return "EN";
  if (s.includes("VULNERABLE") || s.includes("HASSAS")) return "VU";
  if (s.includes("NEAR")) return "NT";
  if (s.includes("LEAST")) return "LC";
  return s.slice(0, 4);
}

export const dynamic = "force-dynamic";

// GET: Sadece "route alive" — hiç veri dönme
export async function GET() {
  return Response.json({ status: "ok" });
}

export async function POST(request) {
  // ── 1. Auth kontrolü ──────────────────────────────────────
  if (!checkAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Rate limit ─────────────────────────────────────────
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // ── 3. Body size kontrolü (max 5MB) ───────────────────────
  const contentLength = parseInt(request.headers.get("content-length") || "0");
  if (contentLength > 5 * 1024 * 1024) {
    return Response.json({ error: "Payload too large (max 5MB)" }, { status: 413 });
  }

  const db = getSupabase();

  try {
    const body = await request.json();
    const { rows, headers, filename, mode } = body;

    if (!rows || !rows.length) {
      return Response.json({ error: "No data rows provided" }, { status: 400 });
    }

    const firstRowKeys = Object.keys(rows[0] || {});
    let added = 0, updated = 0, skipped = 0, errors = 0;
    const results = [];

    for (const row of rows) {
      try {
        const mapped = mapRow(row);

        if (!mapped.accepted_name) {
          results.push({ status: "skipped", reason: "no accepted_name", keys: Object.keys(row) });
          skipped++;
          continue;
        }

        const genus = mapped.genus || extractGenus(mapped.accepted_name);
        const family = mapped.family || guessFamily(genus);
        const id = `GEO-UPL-${mapped.accepted_name.replace(/\s+/g, "-").slice(0, 20)}-${Date.now().toString(36).slice(-4)}`;

        const { data: existing } = await db
          .from("species")
          .select("id")
          .ilike("accepted_name", mapped.accepted_name.trim())
          .single();

        const habitatParts = [
          mapped.habitat,
          mapped.elevation ? `${mapped.elevation}` : null,
          mapped.flowering ? `Flowering: ${mapped.flowering}` : null,
        ].filter(Boolean).join(" · ");

        const notesParts = [
          mapped.notes,
          mapped.usage ? `Usage: ${mapped.usage}` : null,
          mapped.threats ? `Threats: ${mapped.threats}` : null,
          `Source: ${filename || "Excel upload"}`,
        ].filter(Boolean).join(" | ");

        const speciesData = {
          accepted_name: mapped.accepted_name.trim(),
          family, genus,
          geophyte_type: "Bulbous",
          country_focus: mapped.country_focus || "TR",
          region: mapped.region || null,
          endemic: mapped.endemic === "Yes" || mapped.endemic === "Evet",
          iucn_status: parseIUCN(mapped.iucn_status),
          cites_appendix: mapped.cites_appendix || null,
          population_trend: mapped.population_trend || null,
          habitat: habitatParts || null,
          notes: notesParts,
          confidence: 0.5,
          decision: "Monitor",
          last_verified: new Date().toISOString().split("T")[0],
        };

        if (existing) {
          if (mode === "skip_existing") { skipped++; continue; }
          await db.from("species").update(speciesData).eq("id", existing.id);
          updated++;
          results.push({ name: mapped.accepted_name, status: "updated" });
        } else {
          speciesData.id = id;
          const { error } = await db.from("species").insert(speciesData);
          if (error) {
            errors++;
            results.push({ name: mapped.accepted_name, status: "error", msg: error.message });
          } else {
            added++;
            results.push({ name: mapped.accepted_name, status: "added", id });
          }
        }
      } catch (err) {
        errors++;
        results.push({ status: "error", msg: err.message });
      }
    }

    await db.from("change_log").insert({
      table_name: "species",
      record_id: "bulk_upload",
      field_changed: "Excel upload",
      old_value: null,
      new_value: JSON.stringify({ filename, added, updated, skipped, errors, firstRowKeys }),
      change_source: "excel_upload",
    });

    return Response.json({
      success: true, filename,
      total_rows: rows.length,
      added, updated, skipped, errors,
      firstRowKeys,
      results: results.slice(0, 20),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
