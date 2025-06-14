export interface DealData {
  deal_id: string;
  company_name: string;
  contact_name: string;
  transportation_mode: "trucking" | "rail" | "ocean" | "air";
  stage:
    | "prospect"
    | "qualified"
    | "proposal"
    | "negotiation"
    | "closed_won"
    | "closed_lost";
  value: number; // in USD
  probability: number; // 0-100
  created_date: string; // ISO date
  updated_date: string; // ISO date
  expected_close_date: string; // ISO date
  sales_rep: string;
  origin_city: string;
  destination_city: string;
  cargo_type?: string;
}
