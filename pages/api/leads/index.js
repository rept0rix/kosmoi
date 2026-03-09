import { createClient } from "@supabase/supabase-js";

/**
 * Draft endpoint generated during autonomous run.
 * Not wired by default in this Vite-only project, but kept as a ready template.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({
      error: "Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY",
    });
  }

  const supabase = createClient(url, key);

  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 200);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("crm_leads")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }

    if (req.query.q) {
      const q = String(req.query.q).trim();
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`,
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return res.status(200).json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
