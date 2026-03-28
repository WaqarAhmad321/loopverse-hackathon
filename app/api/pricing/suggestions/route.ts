import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("category_id");

  if (!categoryId) {
    return NextResponse.json(
      { error: "category_id is required" },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc("get_pricing_suggestions", {
    p_category_id: categoryId,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch pricing data" },
      { status: 500 }
    );
  }

  // The RPC returns an array with a single row
  const pricing = Array.isArray(data) && data.length > 0 ? data[0] : data;

  if (!pricing || pricing.product_count === 0) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    data: {
      avg_price: pricing.avg_price,
      median_price: pricing.median_price,
      min_price: pricing.min_price,
      max_price: pricing.max_price,
      p25_price: pricing.p25_price,
      p75_price: pricing.p75_price,
      product_count: pricing.product_count,
    },
  });
}
