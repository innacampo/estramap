export type StockStatus = "in-stock" | "low-stock";

export interface LocalReport {
  id: string;
  pharmacyName: string;
  address: string;
  distance: string;
  medication: string;
  dose: string;
  status: StockStatus;
  reportedAgo: string;
  lat: number;
  lng: number;
  upvotes: number;
  downvotes: number;
}

export interface OnlineReport {
  id: string;
  pharmacyName: string;
  medication: string;
  dose: string;
  dateReported: string;
  url: string;
}

export const localReports: LocalReport[] = [
  {
    id: "l1",
    pharmacyName: "CVS Pharmacy",
    address: "1402 N Highland Ave, Los Angeles, CA 90028",
    distance: "0.8 mi",
    medication: "Dotti",
    dose: "0.05mg",
    status: "in-stock",
    reportedAgo: "2 hours ago",
    lat: 34.0985,
    lng: -118.3388,
    upvotes: 12,
    downvotes: 1,
  },
  {
    id: "l2",
    pharmacyName: "Walgreens",
    address: "6201 Sunset Blvd, Los Angeles, CA 90028",
    distance: "1.2 mi",
    medication: "Generic Estradiol",
    dose: "0.1mg",
    status: "low-stock",
    reportedAgo: "5 hours ago",
    lat: 34.0978,
    lng: -118.3245,
    upvotes: 8,
    downvotes: 2,
  },
  {
    id: "l3",
    pharmacyName: "Rite Aid",
    address: "300 N Canon Dr, Beverly Hills, CA 90210",
    distance: "3.4 mi",
    medication: "Climara",
    dose: "0.075mg",
    status: "in-stock",
    reportedAgo: "1 day ago",
    lat: 34.0696,
    lng: -118.3979,
    upvotes: 5,
    downvotes: 0,
  },
  {
    id: "l4",
    pharmacyName: "Costco Pharmacy",
    address: "2901 Los Feliz Blvd, Los Angeles, CA 90039",
    distance: "4.1 mi",
    medication: "Generic Estradiol",
    dose: "0.025mg",
    status: "low-stock",
    reportedAgo: "3 hours ago",
    lat: 34.1186,
    lng: -118.2614,
    upvotes: 15,
    downvotes: 3,
  },
  {
    id: "l5",
    pharmacyName: "Ralph's Pharmacy",
    address: "170 N La Brea Ave, Los Angeles, CA 90036",
    distance: "2.0 mi",
    medication: "Vivelle-Dot",
    dose: "0.05mg",
    status: "in-stock",
    reportedAgo: "6 hours ago",
    lat: 34.0717,
    lng: -118.3448,
    upvotes: 9,
    downvotes: 1,
  },
];

export const onlineReports: OnlineReport[] = [
  {
    id: "o1",
    pharmacyName: "Amazon Pharmacy",
    medication: "Generic Estradiol Patch",
    dose: "0.05mg",
    dateReported: "Feb 25, 2026",
    url: "https://pharmacy.amazon.com",
  },
  {
    id: "o2",
    pharmacyName: "Cost Plus Drugs",
    medication: "Generic Estradiol Patch",
    dose: "0.1mg",
    dateReported: "Feb 24, 2026",
    url: "https://costplusdrugs.com",
  },
  {
    id: "o3",
    pharmacyName: "Honeybee Health",
    medication: "Estradiol Transdermal Patch",
    dose: "0.075mg",
    dateReported: "Feb 26, 2026",
    url: "https://www.honeybeehealth.com",
  },
];
