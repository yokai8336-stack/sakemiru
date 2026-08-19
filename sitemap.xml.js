// /sitemap.xml へのアクセスを処理する Cloudflare Pages Function
// Supabaseの sake テーブルから全銘柄IDを取得し、/sake/{id} を含むサイトマップを動的に生成する

const SITE_URL = "https://sakemiru.jp";
const SUPABASE_URL = "https://shblhsbcnmdengmbbpmx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYmxoc2Jjbm1kZW5nbWJicG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTcxOTMsImV4cCI6MjEwMjU3MzE5M30.Tv2hmRucmBztILkBOhRO94Tg-EqqVle5d2zInCIaIIk";

function escapeXml(str) {
  return String(str).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;"
  }[c]));
}

export async function onRequestGet() {
  let sakeRows = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sake?select=id,updated_at`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    if (res.ok) {
      sakeRows = await res.json();
    }
  } catch (e) {
    // Supabaseに到達できない場合はトップページのみのサイトマップを返す
  }

  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" }
  ];

  const sakeUrls = (sakeRows || []).map((row) => ({
    loc: `${SITE_URL}/sake/${encodeURIComponent(row.id)}`,
    lastmod: row.updated_at ? new Date(row.updated_at).toISOString().slice(0, 10) : undefined,
    changefreq: "weekly",
    priority: "0.8"
  }));

  const allUrls = staticUrls.concat(sakeUrls);

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    allUrls
      .map((u) => {
        let entry = `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n`;
        if (u.lastmod) entry += `    <lastmod>${u.lastmod}</lastmod>\n`;
        if (u.changefreq) entry += `    <changefreq>${u.changefreq}</changefreq>\n`;
        if (u.priority) entry += `    <priority>${u.priority}</priority>\n`;
        entry += `  </url>\n`;
        return entry;
      })
      .join("") +
    `</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
