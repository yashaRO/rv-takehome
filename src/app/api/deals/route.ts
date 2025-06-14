import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initializeDataSource } from "../../../data-source";
import { Deal } from "../../../lib/entities/Deal";

// Define Zod schema for DealData
const DealDataSchema = z.object({
  deal_id: z.string(),
  company_name: z.string(),
  contact_name: z.string(),
  transportation_mode: z.enum(["trucking", "rail", "ocean", "air"]),
  stage: z.enum([
    "prospect",
    "qualified",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ]),
  value: z.number().positive(),
  probability: z.number().min(0).max(100),
  created_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format for created_date",
  }),
  updated_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format for updated_date",
  }),
  expected_close_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format for expected_close_date",
  }),
  sales_rep: z.string(),
  origin_city: z.string(),
  destination_city: z.string(),
  cargo_type: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);

    // Check if the request body is an array for batch processing
    if (Array.isArray(body)) {
      const results: {
        success: number;
        errors: { deal_id: string; error: any }[];
      } = { success: 0, errors: [] };

      for (const deal of body) {
        const result = await validateAndSaveDeal(deal, dealRepository);
        if (result.success) {
          results.success++;
        } else {
          results.errors.push(result);
        }
      }

      return NextResponse.json(results, { status: 207 });
    }

    // Single deal processing
    const result = await validateAndSaveDeal(body, dealRepository);
    if (result.success) {
      return NextResponse.json({ deal_id: result.deal_id }, { status: 201 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in POST /api/deals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const dataSource = await initializeDataSource();
    const dealRepository = dataSource.getRepository(Deal);
    const deals = await dealRepository.find();

    // Group deals by stage
    const dealsByStage = deals.reduce(
      (acc: Record<string, Deal[]>, deal: Deal) => {
        if (!acc[deal.stage]) {
          acc[deal.stage] = [];
        }
        acc[deal.stage].push(deal);
        return acc;
      },
      {} as Record<string, Deal[]>
    );

    // Calculate totals and percentages
    const totalDeals = deals.length;
    const stageAnalytics = Object.entries(dealsByStage).reduce(
      (acc, [stage, stageDeals]) => {
        const count = stageDeals.length;
        const percentage =
          totalDeals > 0 ? Math.round((count / totalDeals) * 100) : 0;

        acc[stage] = {
          deals: stageDeals,
          count,
          percentage,
        };
        return acc;
      },
      {} as Record<string, { deals: Deal[]; count: number; percentage: number }>
    );

    return NextResponse.json({
      totalDeals,
      stageAnalytics,
    });
  } catch (error) {
    console.error("Error fetching deals by stage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Function to validate and save a single deal
async function validateAndSaveDeal(
  deal: any,
  dealRepository: any
): Promise<{ success: boolean; deal_id: string; error: any }> {
  try {
    const dealData = DealDataSchema.parse(deal);

    // Check for duplicate deals
    const existingDeal = await checkForDuplicateDeal(
      dealData.deal_id,
      dealRepository
    );
    if (existingDeal) {
      return {
        success: false,
        error: "Duplicate deal_id",
        deal_id: dealData.deal_id,
      };
    }

    // Save the deal to the database
    const newDeal = dealRepository.create(dealData);
    await dealRepository.save(newDeal);
    return { success: true, deal_id: dealData.deal_id, error: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors,
        deal_id: deal.deal_id,
      };
    }
    return {
      success: false,
      error: "Internal server error",
      deal_id: deal.deal_id,
    };
  }
}

// Function to check for duplicate deals
async function checkForDuplicateDeal(
  deal_id: string,
  dealRepository: any
): Promise<Deal | null> {
  return await dealRepository.findOneBy({ deal_id });
}
