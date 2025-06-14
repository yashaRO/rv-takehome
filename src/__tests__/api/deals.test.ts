// Mock Next.js server components before importing
jest.mock("next/server", () => {
  const mockNextRequest = jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || "GET",
    json: jest.fn().mockImplementation(() => {
      try {
        return Promise.resolve(JSON.parse(options?.body || "{}"));
      } catch (error) {
        return Promise.reject(new Error("Invalid JSON"));
      }
    }),
    text: jest.fn().mockResolvedValue(options?.body || ""),
  }));

  const mockNextResponse = {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
    })),
  };

  return {
    NextRequest: mockNextRequest,
    NextResponse: mockNextResponse,
  };
});

// Mock the data source and repository
jest.mock("../../data-source");
jest.mock("../../lib/entities/deals/Deal");

import { NextRequest } from "next/server";
import { GET, POST } from "../../app/api/deals/route";
import { initializeDataSource } from "../../data-source";

const mockInitializeDataSource = initializeDataSource as jest.MockedFunction<
  typeof initializeDataSource
>;

describe("/api/deals", () => {
  let mockRepository: any;
  let mockDataSource: any;

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

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    mockInitializeDataSource.mockResolvedValue(mockDataSource);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/deals", () => {
    describe("Single deal processing", () => {
      it("should successfully create a new deal", async () => {
        mockRepository.findOneBy.mockResolvedValue(null); // No duplicate
        mockRepository.create.mockReturnValue(validDealData);
        mockRepository.save.mockResolvedValue(validDealData);

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(validDealData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toEqual({ deal_id: "DEAL-001" });
        expect(mockRepository.create).toHaveBeenCalledWith(validDealData);
        expect(mockRepository.save).toHaveBeenCalled();
      });

      it("should reject duplicate deal_id", async () => {
        mockRepository.findOneBy.mockResolvedValue(validDealData); // Duplicate found

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(validDealData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Duplicate deal_id");
        expect(mockRepository.save).not.toHaveBeenCalled();
      });

      it("should reject invalid transportation_mode", async () => {
        const invalidDeal = {
          ...validDealData,
          transportation_mode: "invalid_mode",
        };

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(invalidDeal),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
        expect(Array.isArray(data.error)).toBe(true);
      });

      it("should reject invalid stage", async () => {
        const invalidDeal = {
          ...validDealData,
          stage: "invalid_stage",
        };

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(invalidDeal),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });

      it("should reject negative value", async () => {
        const invalidDeal = {
          ...validDealData,
          value: -1000,
        };

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(invalidDeal),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });

      it("should reject probability outside 0-100 range", async () => {
        const invalidDeal = {
          ...validDealData,
          probability: 150,
        };

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(invalidDeal),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });

      it("should reject invalid date formats", async () => {
        const invalidDeal = {
          ...validDealData,
          created_date: "invalid-date",
        };

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(invalidDeal),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });

      it("should reject missing required fields", async () => {
        const incompleteDeal = {
          deal_id: "DEAL-002",
          company_name: "Test Company",
          // Missing other required fields
        };

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(incompleteDeal),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
      });

      it("should accept various date formats", async () => {
        const dealWithDifferentDateFormat = {
          ...validDealData,
          deal_id: "DEAL-003",
          created_date: "2024-01-01",
          updated_date: "01/01/2024",
          expected_close_date: "January 1, 2024",
        };

        mockRepository.findOneBy.mockResolvedValue(null);
        mockRepository.create.mockReturnValue(dealWithDifferentDateFormat);
        mockRepository.save.mockResolvedValue(dealWithDifferentDateFormat);

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(dealWithDifferentDateFormat),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.deal_id).toBe("DEAL-003");
      });
    });

    describe("Batch processing", () => {
      it("should process multiple valid deals", async () => {
        const deals = [
          { ...validDealData, deal_id: "DEAL-001" },
          { ...validDealData, deal_id: "DEAL-002" },
          { ...validDealData, deal_id: "DEAL-003" },
        ];

        mockRepository.findOneBy.mockResolvedValue(null); // No duplicates
        mockRepository.create.mockImplementation((deal: any) => deal);
        mockRepository.save.mockImplementation((deal: any) =>
          Promise.resolve(deal)
        );

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(deals),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(207); // Multi-status
        expect(data.success).toBe(3);
        expect(data.errors).toHaveLength(0);
      });

      it("should handle mixed valid and invalid deals", async () => {
        const deals = [
          { ...validDealData, deal_id: "DEAL-001" }, // Valid
          { ...validDealData, deal_id: "DEAL-002", value: -1000 }, // Invalid value
          { ...validDealData, deal_id: "DEAL-003" }, // Valid
        ];

        mockRepository.findOneBy.mockResolvedValue(null);
        mockRepository.create.mockImplementation((deal: any) => deal);
        mockRepository.save.mockImplementation((deal: any) =>
          Promise.resolve(deal)
        );

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(deals),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(207);
        expect(data.success).toBe(2);
        expect(data.errors).toHaveLength(1);
        expect(data.errors[0].deal_id).toBe("DEAL-002");
      });

      it("should handle large datasets (1000+ deals)", async () => {
        const deals = Array.from({ length: 1000 }, (_, i) => ({
          ...validDealData,
          deal_id: `DEAL-${String(i + 1).padStart(4, "0")}`,
        }));

        mockRepository.findOneBy.mockResolvedValue(null);
        mockRepository.create.mockImplementation((deal: any) => deal);
        mockRepository.save.mockImplementation((deal: any) =>
          Promise.resolve(deal)
        );

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(deals),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(207);
        expect(data.success).toBe(1000);
        expect(data.errors).toHaveLength(0);
      });

      it("should handle some duplicate deals in batch", async () => {
        const deals = [
          { ...validDealData, deal_id: "DEAL-001" },
          { ...validDealData, deal_id: "DEAL-002" },
          { ...validDealData, deal_id: "DEAL-003" },
        ];

        // Mock that DEAL-002 already exists
        mockRepository.findOneBy.mockImplementation((criteria: any) => {
          if (criteria.deal_id === "DEAL-002") {
            return Promise.resolve(validDealData);
          }
          return Promise.resolve(null);
        });

        mockRepository.create.mockImplementation((deal: any) => deal);
        mockRepository.save.mockImplementation((deal: any) =>
          Promise.resolve(deal)
        );

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(deals),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(207);
        expect(data.success).toBe(2);
        expect(data.errors).toHaveLength(1);
        expect(data.errors[0].deal_id).toBe("DEAL-002");
        expect(data.errors[0].error).toBe("Duplicate deal_id");
      });
    });

    describe("Error handling", () => {
      it("should handle database connection errors", async () => {
        mockInitializeDataSource.mockRejectedValue(
          new Error("Database connection failed")
        );

        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: JSON.stringify(validDealData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });

      it("should handle invalid JSON", async () => {
        const request = new NextRequest("http://localhost:3000/api/deals", {
          method: "POST",
          body: "invalid json",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });
    });
  });

  describe("GET /api/deals", () => {
    it("should return deals grouped by stage with analytics", async () => {
      const mockDeals = [
        { ...validDealData, deal_id: "DEAL-001", stage: "prospect" },
        { ...validDealData, deal_id: "DEAL-002", stage: "prospect" },
        { ...validDealData, deal_id: "DEAL-003", stage: "qualified" },
        { ...validDealData, deal_id: "DEAL-004", stage: "closed_won" },
        { ...validDealData, deal_id: "DEAL-005", stage: "closed_lost" },
      ];

      mockRepository.find.mockResolvedValue(mockDeals);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalDeals).toBe(5);
      expect(data.stageAnalytics).toBeDefined();
      expect(data.stageAnalytics.prospect.count).toBe(2);
      expect(data.stageAnalytics.prospect.percentage).toBe(40);
      expect(data.stageAnalytics.qualified.count).toBe(1);
      expect(data.stageAnalytics.qualified.percentage).toBe(20);
      expect(data.stageAnalytics.closed_won.count).toBe(1);
      expect(data.stageAnalytics.closed_won.percentage).toBe(20);
      expect(data.stageAnalytics.closed_lost.count).toBe(1);
      expect(data.stageAnalytics.closed_lost.percentage).toBe(20);
    });

    it("should handle empty database", async () => {
      mockRepository.find.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalDeals).toBe(0);
      expect(data.stageAnalytics).toEqual({});
    });

    it("should handle database errors", async () => {
      mockRepository.find.mockRejectedValue(new Error("Database error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should calculate percentages correctly with rounding", async () => {
      const mockDeals = [
        { ...validDealData, deal_id: "DEAL-001", stage: "prospect" },
        { ...validDealData, deal_id: "DEAL-002", stage: "qualified" },
        { ...validDealData, deal_id: "DEAL-003", stage: "proposal" },
      ];

      mockRepository.find.mockResolvedValue(mockDeals);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalDeals).toBe(3);
      // Each stage should have 33% (rounded from 33.33%)
      expect(data.stageAnalytics.prospect.percentage).toBe(33);
      expect(data.stageAnalytics.qualified.percentage).toBe(33);
      expect(data.stageAnalytics.proposal.percentage).toBe(33);
    });
  });
});
