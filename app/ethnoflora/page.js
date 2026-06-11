// ETHNOFLORA is RETIRED as a separate atlas (a "nave" / parallel building). The decision:
// medicinal / ethnobotanical use is a CROSS-CUTTING property of any plant (a gear + the ABS
// consent firewall), not its own vertical; the 361 non-geophyte species live on as a neutral
// "Wider flora" shelf (verticals.id='medicinal_plants', display_name='Wider flora'). The route
// is kept alive (never deleted) and redirects into GEOCON. The old landing + EthnofloraLive
// component are preserved in the repo for reuse if the ethnobotany gear is built.

import { redirect } from "next/navigation";

export const metadata = {
  title: "Wider flora — moved into GEOCON",
};

export default function EthnofloraRetired() {
  redirect("/geocon");
}
