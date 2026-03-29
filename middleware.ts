import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/products", "/login", "/register"];
const AUTH_ROUTES = ["/login", "/register"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/products")) return true;
  if (pathname.startsWith("/sellers")) return true;
  if (pathname.startsWith("/register")) return true;
  if (pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow public routes without auth
  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  // Allow cart for guests
  if (pathname === "/cart") {
    return supabaseResponse;
  }

  // Redirect logged-in users away from auth routes
  if (isAuthRoute(pathname) && user) {
    // Get user roles to redirect to appropriate dashboard
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roles?.map((r) => r.role) ?? [];

    if (userRoles.includes("admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (userRoles.includes("seller")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Require auth for protected routes
  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based route protection
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const userRoles = roles?.map((r) => r.role) ?? [];

  // Check seller routes
  if (pathname.startsWith("/seller")) {
    if (!userRoles.includes("seller")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Check admin routes
  if (pathname.startsWith("/admin")) {
    if (!userRoles.includes("admin")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
