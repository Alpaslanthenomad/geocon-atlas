import { AuthProvider } from "../../../lib/authContext";
import { ThemeProvider } from "../../../lib/themeContext";

// The Venn Exchange admin desk needs the auth + theme context that the relocated
// VenturesRoute/VentureDetailRoute components rely on — but NOT the GEOCON shell
// (this is a BEE platform surface, not the conservation atlas). The public
// /exchange landing stays a plain static page (no providers needed).
export default function ExchangeDeskLayout({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
