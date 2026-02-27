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
  notes: string;
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
    pharmacyName: "CVS Pharmacy - Midtown",
    address: "1520 Avenue Pl Ste B-100, Atlanta, GA 30329",
    distance: "0.8 mi",
    medication: "Dotti",
    dose: "0.05mg",
    status: "in-stock",
    reportedAgo: "2 hours ago",
    lat: 33.8015,
    lng: -84.3275,
    upvotes: 12,
    downvotes: 1,
    notes: "Confirmed on shelf this morning.",
  },
  {
    id: "l2",
    pharmacyName: "Walgreens - Piedmont",
    address: "595 Piedmont Ave NE, Atlanta, GA 30308",
    distance: "1.2 mi",
    medication: "Generic Estradiol",
    dose: "0.1mg",
    status: "low-stock",
    reportedAgo: "5 hours ago",
    lat: 33.7712,
    lng: -84.3818,
    upvotes: 8,
    downvotes: 2,
    notes: "Only a few boxes left.",
  },
  {
    id: "l3",
    pharmacyName: "Publix Pharmacy - West Peachtree",
    address: "950 W Peachtree St NW, Atlanta, GA 30309",
    distance: "3.4 mi",
    medication: "Climara",
    dose: "0.075mg",
    status: "in-stock",
    reportedAgo: "1 day ago",
    lat: 33.7805,
    lng: -84.3878,
    upvotes: 5,
    downvotes: 0,
    notes: "Full stock of Climara brands.",
  },
  {
    id: "l4",
    pharmacyName: "Costco Pharmacy - Cumberland",
    address: "2900 Cumberland Pkwy SE, Atlanta, GA 30339",
    distance: "4.1 mi",
    medication: "Generic Estradiol",
    dose: "0.025mg",
    status: "low-stock",
    reportedAgo: "3 hours ago",
    lat: 33.8655,
    lng: -84.4645,
    upvotes: 15,
    downvotes: 3,
    notes: "Great price if you have a membership.",
  },
  {
    id: "l5",
    pharmacyName: "Kroger Pharmacy - Glenwood",
    address: "800 Glenwood Ave SE, Atlanta, GA 30312",
    distance: "2.0 mi",
    medication: "Vivelle-Dot",
    dose: "0.05mg",
    status: "in-stock",
    reportedAgo: "6 hours ago",
    lat: 33.7408,
    lng: -84.3458,
    upvotes: 9,
    downvotes: 1,
    notes: "Recently restocked.",
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
