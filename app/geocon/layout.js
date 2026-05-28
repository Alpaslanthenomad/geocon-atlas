import GeoconShell from "../../components/geocon/Shell";
import { AuthProvider } from "../../lib/authContext";

export const metadata = {
  title: "GEOCON — Endemic geophyte intelligence",
  description: "Species intelligence, conservation scoring, and program orchestration for geophytic plants.",
};

export default function GeoconLayout({ children }) {
  return (
    <AuthProvider>
      <GeoconShell>{children}</GeoconShell>
    </AuthProvider>
  );
}
