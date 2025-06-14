import { DealDataSchema } from "../../lib/entities/deals/interface";

describe("Deal Data Validation", () => {
  const validDealData = {
    deal_id: "DEAL-001",
    company_name: "Test Company",
    contact_name: "John Doe",
    transportation_mode: "trucking" as const,
    stage: "prospect" as const,
    value: 50000,
    probability: 75,
    created_date: "2024-01-01T00:00:00Z",
    updated_date: "2024-01-01T00:00:00Z",
    expected_close_date: "2024-03-01T00:00:00Z",
    sales_rep: "Jane Smith",
    origin_city: "New York",
    destination_city: "Los Angeles",
    cargo_type: "Electronics",
  };

  describe("Valid data validation", () => {
    it("should validate correct deal data", () => {
      const result = DealDataSchema.safeParse(validDealData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deal_id).toBe("DEAL-001");
        expect(result.data.company_name).toBe("Test Company");
        expect(result.data.value).toBe(50000);
      }
    });

    it("should accept different date formats", () => {
      const dealWithDifferentDates = {
        ...validDealData,
        created_date: "2024-01-01",
        updated_date: "01/01/2024",
        expected_close_date: "January 1, 2024",
      };

      const result = DealDataSchema.safeParse(dealWithDifferentDates);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid data validation", () => {
    it("should reject invalid transportation_mode", () => {
      const invalidDeal = {
        ...validDealData,
        transportation_mode: "invalid_mode",
      };

      const result = DealDataSchema.safeParse(invalidDeal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("transportation_mode");
      }
    });

    it("should reject missing required fields", () => {
      const incompleteDeal = {
        deal_id: "DEAL-002",
        company_name: "Test Company",
        // Missing other required fields
      };

      const result = DealDataSchema.safeParse(incompleteDeal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Pipeline analytics logic", () => {
    it("should correctly group deals by stage", () => {
      const mockDeals = [
        { ...validDealData, deal_id: "DEAL-001", stage: "prospect" },
        { ...validDealData, deal_id: "DEAL-002", stage: "prospect" },
        { ...validDealData, deal_id: "DEAL-003", stage: "qualified" },
        { ...validDealData, deal_id: "DEAL-004", stage: "closed_won" },
        { ...validDealData, deal_id: "DEAL-005", stage: "closed_lost" },
      ];

      // Simulate the grouping logic from the API
      const dealsByStage = mockDeals.reduce(
        (acc: Record<string, any[]>, deal: any) => {
          if (!acc[deal.stage]) {
            acc[deal.stage] = [];
          }
          acc[deal.stage].push(deal);
          return acc;
        },
        {} as Record<string, any[]>
      );

      expect(dealsByStage.prospect).toHaveLength(2);
      expect(dealsByStage.qualified).toHaveLength(1);
      expect(dealsByStage.closed_won).toHaveLength(1);
      expect(dealsByStage.closed_lost).toHaveLength(1);
    });

    it("should calculate correct percentages", () => {
      const mockDeals = [
        { stage: "prospect" },
        { stage: "prospect" },
        { stage: "qualified" },
        { stage: "closed_won" },
        { stage: "closed_lost" },
      ];

      const totalDeals = mockDeals.length;
      const dealsByStage = mockDeals.reduce(
        (acc: Record<string, any[]>, deal: any) => {
          if (!acc[deal.stage]) {
            acc[deal.stage] = [];
          }
          acc[deal.stage].push(deal);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Calculate percentages like the API does
      const stageAnalytics = Object.entries(dealsByStage).reduce(
        (acc, [stage, stageDeals]) => {
          const count = stageDeals.length;
          const percentage =
            totalDeals > 0 ? Math.round((count / totalDeals) * 100) : 0;
          acc[stage] = { count, percentage };
          return acc;
        },
        {} as Record<string, { count: number; percentage: number }>
      );

      expect(stageAnalytics.prospect.count).toBe(2);
      expect(stageAnalytics.prospect.percentage).toBe(40);
      expect(stageAnalytics.qualified.count).toBe(1);
      expect(stageAnalytics.qualified.percentage).toBe(20);
    });
  });
});
