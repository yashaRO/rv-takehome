import z from "zod";
import { Deal } from "../entities/deals/Deal";
import { DealDataSchema } from "../entities/deals/interface";

export async function validateAndSaveDeal(
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
