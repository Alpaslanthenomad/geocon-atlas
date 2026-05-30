import GeoconShell from "../../components/geocon/Shell";
import { AuthProvider } from "../../lib/authContext";
import { ThemeProvider } from "../../lib/themeContext";

export const metadata = {
  title: "GEOCON — Endemic geophyte intelligence",
  description: "Species intelligence, conservation scoring, and program orchestration for geophytic plants.",
};

export default function GeoconLayout({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GeoconShell>{children}</GeoconShell>
      </AuthProvider>
    </ThemeProvider>
  );
}
