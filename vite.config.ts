import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const allowedHosts = ["https://crm.v3rii.com"];

function resolveVendorChunk(id: string): string | undefined {
  if (id.includes("/src/layouts/")) return "app-shell";
  if (
    id.includes("/src/components/shared/") &&
    !id.includes("/src/components/shared/RouteErrorFallback.tsx")
  ) {
    return "app-shell";
  }
  if (id.includes("/src/components/ui/")) return "app-ui";
  if (id.includes("/src/stores/")) return "app-state";
  if (id.includes("/src/lib/") || id.includes("/src/utils/")) return "app-core";
  if (id.includes("/src/hooks/")) return "app-hooks";
  if (id.includes("/src/features/user-management/components/UserManagementPage.tsx")) return "page-user-management";
  if (id.includes("/src/features/user-detail-management/components/ProfilePage.tsx")) return "page-profile";
  if (id.includes("/src/features/stock/components/StockListPage.tsx")) return "page-stock-list";
  if (id.includes("/src/features/stock/components/StockDetailPage.tsx")) return "page-stock-detail";
  if (id.includes("/src/features/access-control/components/PermissionGroupsPage.tsx")) return "page-permission-groups";
  if (id.includes("/src/features/aqua/definitions/components/CagesPage.tsx")) return "page-aqua-cages";
  if (id.includes("/src/features/aqua/definitions/components/WeatherSeveritiesPage.tsx")) return "page-aqua-weather-severities";
  if (id.includes("/src/features/aqua/definitions/components/WeatherTypesPage.tsx")) return "page-aqua-weather-types";
  if (id.includes("/src/features/aqua/definitions/components/NetOperationTypesPage.tsx")) return "page-aqua-net-operation-types";
  if (id.includes("/src/features/aqua/settings/pages/AquaSettingsPage.tsx")) return "page-aqua-settings";
  if (id.includes("/src/features/aqua/operations/quick-setup/QuickSetupPage.tsx")) return "page-aqua-quick-setup";
  if (id.includes("/src/features/aqua/operations/quick-daily-entry/QuickDailyEntryPage.tsx")) return "page-aqua-quick-daily-entry";
  if (id.includes("/src/features/aqua/operations/opening-import/OpeningImportPage.tsx")) return "page-aqua-opening-import";
  if (id.includes("/src/features/aqua/operations/project-merges/pages/ProjectMergesPage.tsx")) return "page-aqua-project-merges";
  if (id.includes("/src/features/aqua/operations/components/TransfersPage.tsx")) return "page-aqua-transfers";
  if (id.includes("/src/features/aqua/operations/components/NetOperationsPage.tsx")) return "page-aqua-net-operations";
  if (id.includes("/src/features/aqua/reports/components/CageBalancesPage.tsx")) return "page-aqua-cage-balances";
  if (id.includes("/src/features/aqua/reports/components/ProjectDetailReportPage.tsx")) return "page-aqua-project-detail";
  if (id.includes("/src/features/aqua/reports/components/BusinessKpiReportPage.tsx")) return "page-aqua-business-kpi";
  if (id.includes("/src/features/auth/")) return "feature-auth";
  if (id.includes("/src/features/user-management/")) return "feature-user-management";
  if (id.includes("/src/features/user-detail-management/")) return "feature-user-detail";
  if (id.includes("/src/features/mail-settings/")) return "feature-mail-settings";
  if (id.includes("/src/features/stock/")) return "feature-stock";
  if (
    id.includes("/src/features/access-control/components/RoutePermissionGuard.tsx") ||
    id.includes("/src/features/access-control/hooks/useMyPermissionsQuery.ts") ||
    id.includes("/src/features/access-control/utils/filterNavItems") ||
    id.includes("/src/features/access-control/utils/hasPermission") ||
    id.includes("/src/features/access-control/types/")
  ) {
    return "feature-access-control-core";
  }
  if (id.includes("/src/features/access-control/")) return "feature-access-control";
  if (id.includes("/src/features/hangfire-monitoring/")) return "feature-hangfire-monitoring";
  if (id.includes("/src/features/welcome/")) return "feature-welcome";
  if (id.includes("/src/features/aqua/definitions/")) return "feature-aqua-definitions";
  if (id.includes("/src/features/aqua/settings/")) return "feature-aqua-settings";
  if (id.includes("/src/features/aqua/shared/")) return "feature-aqua-shared";
  if (id.includes("/src/features/aqua/operations/quick-setup/")) return "feature-aqua-quick-setup";
  if (id.includes("/src/features/aqua/operations/quick-daily-entry/")) return "feature-aqua-quick-daily-entry";
  if (id.includes("/src/features/aqua/operations/opening-import/")) return "feature-aqua-opening-import";
  if (id.includes("/src/features/aqua/operations/project-merges/")) return "feature-aqua-project-merges";
  if (id.includes("/src/features/aqua/operations/")) return "feature-aqua-operations";
  if (
    id.includes("/src/features/aqua/reports/components/AquaDashboardPage.tsx") ||
    id.includes("/src/features/aqua/reports/api/aqua-dashboard-api.ts")
  ) {
    return "aqua-dashboard";
  }
  if (id.includes("/src/features/aqua/reports/")) return "feature-aqua-reports";

  if (!id.includes("node_modules")) return undefined;

  if (id.includes("powerbi-client")) return "vendor-powerbi";
  if (id.includes("@tiptap")) return "vendor-tiptap";
  if (id.includes("xlsx")) return "vendor-xlsx";
  if (id.includes("pptxgenjs") || id.includes("jspdf")) return "vendor-doc-export";
  if (id.includes("three") || id.includes("@react-three")) return "vendor-three";
  if (id.includes("recharts")) return "vendor-recharts";
  if (id.includes("html2canvas")) return "vendor-html2canvas";

  if (
    id.includes("/react-dom/") ||
    id.includes("/react/") ||
    id.includes("/scheduler/") ||
    id.includes("/react-is/")
  ) {
    return "vendor-react-core";
  }

  if (id.includes("react-router") || id.includes("@remix-run/router")) {
    return "vendor-router";
  }

  if (id.includes("@tanstack/react-query")) {
    return "vendor-query";
  }

  if (id.includes("i18next") || id.includes("react-i18next")) {
    return "vendor-i18n";
  }

  if (id.includes("lucide-react") || id.includes("hugeicons-react")) {
    return "vendor-icons";
  }

  if (id.includes("/motion/") || id.includes("framer-motion")) {
    return "vendor-motion";
  }

  if (
    id.includes("@radix-ui") ||
    id.includes("cmdk") ||
    id.includes("embla-carousel") ||
    id.includes("vaul") ||
    id.includes("sonner")
  ) {
    return "vendor-ui";
  }

  if (
    id.includes("axios") ||
    id.includes("zod") ||
    id.includes("date-fns") ||
    id.includes("zustand") ||
    id.includes("clsx") ||
    id.includes("tailwind-merge") ||
    id.includes("class-variance-authority")
  ) {
    return "vendor-app";
  }

  return "vendor-misc";
}

export default defineConfig({
  // base: "/crm-ui/",
  base: "/",
  build: {
    modulePreload: {
      resolveDependencies: (_url, deps) => deps.filter((dep) => {
        return !(
          (dep.includes("feature-") &&
            !dep.includes("feature-access-control-core") &&
            !dep.includes("aqua-dashboard")) ||
          dep.includes("vendor-doc-export") ||
          dep.includes("vendor-tiptap") ||
          dep.includes("vendor-three") ||
          dep.includes("vendor-xlsx") ||
          dep.includes("vendor-recharts") ||
          dep.includes("vendor-html2canvas") ||
          dep.includes("vendor-misc")
        );
      }),
    },
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          return resolveVendorChunk(id);
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: allowedHosts,
    host: "0.0.0.0",
  },
})
