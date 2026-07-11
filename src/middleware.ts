import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const roleForPath = (pathname: string): string[] | null => {
  if (pathname.startsWith("/department/3d")) return ["admin", "dept_3d"];
  if (pathname.startsWith("/department/mold")) return ["admin", "dept_mold"];
  if (pathname.startsWith("/department/sales")) return ["admin", "dept_sales"];
  if (pathname.startsWith("/admin")) return ["admin"];
  if (pathname.startsWith("/dashboard")) return ["admin", "dept_3d", "dept_mold", "dept_sales"];
  return null;
};

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;
    const allowed = roleForPath(req.nextUrl.pathname);
    if (allowed && role && !allowed.includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/department/:path*", "/admin/:path*"],
};
