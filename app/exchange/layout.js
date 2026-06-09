import { AuthProvider } from "../../lib/authContext";
import { ThemeProvider } from "../../lib/themeContext";

// Venn Exchange is a BEE platform surface (NOT GeoconShell). The landing is
// auth-aware (admins get a desk entry) and the desk relies on auth + theme
// context — so both live under these providers, without the conservation shell.
export default function ExchangeLayout({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
