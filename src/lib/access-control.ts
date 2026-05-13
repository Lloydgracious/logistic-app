import {
  Bell,
  FileText,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
  Receipt,
  ScrollText,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ModuleKey =
  | "dashboard"
  | "incoming"
  | "orders"
  | "customers"
  | "inventory"
  | "extract"
  | "logs"
  | "invoices"
  | "notifications";

export type AppRole = "admin" | "staff";
export type AccountStatus = "active" | "disabled";

export type AppProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
};

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  href: string;
  icon: LucideIcon;
  accent: string;
};

export const MODULES: ModuleDefinition[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, accent: "indigo" },
  { key: "incoming", label: "Incoming", href: "/incoming", icon: Truck, accent: "rose" },
  { key: "orders", label: "Orders", href: "/orders", icon: ShoppingCart, accent: "indigo" },
  { key: "customers", label: "Customers", href: "/customers", icon: Users, accent: "rose" },
  { key: "inventory", label: "Inventory", href: "/inventory", icon: Package, accent: "cyan" },
  { key: "extract", label: "Extract", href: "/extract", icon: FileSpreadsheet, accent: "emerald" },
  { key: "logs", label: "Logs", href: "/logs", icon: ScrollText, accent: "slate" },
  { key: "invoices", label: "Billing", href: "/invoices", icon: Receipt, accent: "cyan" },
  { key: "notifications", label: "Notifications", href: "/notifications", icon: Bell, accent: "amber" },
];

export const ADMIN_MODULE = {
  key: "admin",
  label: "Admin",
  href: "/admin",
  icon: FileText,
};

export const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

export function getModuleForPath(pathname: string): ModuleKey | "admin" | "profile" | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/profile")) return "profile";

  const match = MODULES.find((module) => pathname === module.href || pathname.startsWith(`${module.href}/`));
  return match?.key || null;
}

export function getAllowedModules(role: AppRole | undefined, enabledModules: ModuleKey[]) {
  if (role === "admin") return MODULES;
  const enabled = new Set(enabledModules);
  return MODULES.filter((module) => enabled.has(module.key));
}

export function canAccessModule(role: AppRole | undefined, enabledModules: ModuleKey[], moduleKey: ModuleKey | "admin" | "profile" | null) {
  if (!moduleKey || moduleKey === "profile") return true;
  if (role === "admin") return true;
  if (moduleKey === "admin") return false;
  return enabledModules.includes(moduleKey);
}

export function getDefaultLanding(role: AppRole | undefined, enabledModules: ModuleKey[]) {
  if (role === "admin") return "/dashboard";
  return getAllowedModules(role, enabledModules)[0]?.href || "/workspace";
}
