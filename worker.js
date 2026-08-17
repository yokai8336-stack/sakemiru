export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
    const url = new URL(request.url);
    const keywords = url.searchParams.get("keywords") || "";
    const applicationId = url.searchParams.get("applicationId") || "";
    const affiliateId = url.searchParams.get("affiliateId") || "";
    if (!keywords || !applicationId) {
      return new Response(JSON.stringify({ error: "keywords and applicationId required" }), { status: 400, headers: corsHeaders() });
    }

    const api = new URL("https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601");
    api.searchParams.set("format", "json");
    api.searchParams.set("keyword", keywords);
    api.searchParams.set("applicationId", applicationId);
    if (affiliateId) api.searchParams.set("affiliateId", affiliateId);
    api.searchParams.set("hits", "1");

    try {
      const res = await fetch(api.toString());
      if (!res.ok) return new Response(JSON.stringify({ error: "rakuten api error " + res.status }), { status: 502, headers: corsHeaders() });
      const data = await res.json();
      const item = data.Items && data.Items[0] && data.Items[0].Item;
      if (!item) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: corsHeaders() });
      const out = {
        title: item.itemName,
        image: item.mediumImageUrls && item.mediumImageUrls[0] && item.mediumImageUrls[0].imageUrl,
        price: item.itemPrice ? ("¥" + Number(item.itemPrice).toLocaleString()) : undefined,
        url: item.affiliateUrl || item.itemUrl
      };
      return new Response(JSON.stringify(out), { headers: corsHeaders() });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders() });
    }
  }
};

function corsHeaders() {
  return { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
}
