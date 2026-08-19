import { Link } from "@tanstack/react-router";
import { Home, BarChart3, CalendarDays, Star } from "lucide-react";

const tabs = [
  { to: "/", label: "오늘", Icon: Home, exact: true },
  { to: "/stats", label: "통계", Icon: BarChart3, exact: false },
  { to: "/calendar", label: "캘린더", Icon: CalendarDays, exact: false },
  { to: "/rewards", label: "보상", Icon: Star, exact: false },
] as const;

export function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border/40 bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex w-full max-w-[420px] items-stretch gap-1 px-3 py-2">
        {tabs.map(({ to, label, Icon, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-muted-foreground transition-colors data-[status=active]:bg-lilac data-[status=active]:font-bold data-[status=active]:text-foreground"
            >
              <Icon size={22} strokeWidth={2.2} />
              <span className="text-xs">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}