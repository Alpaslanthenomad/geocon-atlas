import DealRoom from "../../../../components/exchange/DealRoom";

export const metadata = {
  title: "Venn Exchange — example deal room",
  robots: { index: false, follow: false },
};

// A clearly-labelled LAYOUT ILLUSTRATION of the VC-facing deal room, shown while
// the system is empty. No real data, no fabricated numbers — fields a real
// listing would carry are [EKLE:] placeholders. The example=true banner makes the
// non-real status unmistakable.
const EXAMPLE = {
  title: "Örnek: tehdit altındaki bir geofitten doğrulanmış değer çıktısı",
  vertical: "geophytes",
  ask: "[EKLE: yatırım türü + miktar + kullanım] — örn. ölçeklenebilir üretim için ön-tohum",
  evidence: [
    { k: "IUCN status", v: "[EKLE: tier]" },
    { k: "Verification", v: "venn_verified" },
    { k: "Endorsements", v: "[EKLE: N]" },
    { k: "Source", v: "[EKLE: DOI]" },
  ],
  thesis: "[EKLE: alıcı segmentleri + uygulama] — örn. kozmetik aktif bileşen / klinik-öncesi materyal",
  team: "[EKLE: ekip — yalnızca kamuya açık atıf, ORCID; özel iletişim yok]",
};

export default function ExampleDealPage() {
  return <DealRoom payload={EXAMPLE} example={true} />;
}
