export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/onboarding",
    "/goals",
    "/roadmap",
    "/today",
    "/progress",
    "/learning",
    "/upskill",
    "/calendar",
    "/credentials",
    "/about",
  ],
};