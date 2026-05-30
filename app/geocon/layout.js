import GeoconShell from "../../components/geocon/Shell";
import { AuthProvider } from "../../lib/authContext";
import { ThemeProvider } from "../../lib/themeContext";
import PWARegister from "../../components/PWARegister";
import AnalyticsProvider from "../../components/AnalyticsProvider";

export const metadata = {
  title: "GEOCON — Endemic geophyte intelligence",
  description: "Species intelligence, conservation scoring, and program orchestration for geophytic plants.",
};

export default function GeoconLayout({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GeoconShell>{children}</GeoconShell>
        <PWARegister />
        <AnalyticsProvider />
      </AuthProvider>
    </ThemeProvider>
  );
}
