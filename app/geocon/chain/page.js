// The Chain — radial rings render (ChainRingsRoute, get_chain_rings RPC).
// The earlier 3D tree (ChainGalaxyRoute) is preserved in the repo but no longer mounted.
import ChainRingsRoute from "../../../components/geocon/ChainRingsRoute";

export const metadata = { title: "The Chain — GEOCON" };

export default function ChainPage() {
  return <ChainRingsRoute />;
}
