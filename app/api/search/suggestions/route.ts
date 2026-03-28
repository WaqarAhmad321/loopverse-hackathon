import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length === 0) {
    return NextResponse.json({ suggestions: [], popular: [] });
  }

  const supabase = await createServerClient();

  const isShortQuery = query.length < 3;
  const limit = 8;

  // Fetch suggestions
  const suggestionsResult = await supabase.rpc("get_search_suggestions", {
    search_term: query,
    limit_count: limit,
  });

  // Fetch popular searches for short queries
  const popularResult = isShortQuery
    ? await supabase.rpc("get_popular_searches", { limit_count: 6 })
    : { data: null, error: null };

  const suggestions: string[] = (
    (suggestionsResult.data ?? []) as { suggestion: string; similarity_score: number }[]
  ).map((s) => s.suggestion);

  const popular: string[] = (
    (popularResult.data ?? []) as { query: string; search_count: number }[]
  ).map((p) => p.query);

  // Track the search query asynchronously (fire-and-forget)
  if (query.length >= 2) {
    void (async () => {
      try {
        await supabase
          .from("search_queries")
          .upsert(
            { query: query.toLowerCase(), search_count: 1 },
            { onConflict: "query" }
          );
      } catch {
        // Non-critical — silently fail
      }
    })();
  }

  return NextResponse.json({ suggestions, popular });
}
