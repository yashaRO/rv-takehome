import { Deal } from "../../entities/deals/Deal";

export function getStageAnalytics(deals: Deal[]): {
  totalDeals: number;
  stageAnalytics: Record<
    string,
    { deals: Deal[]; count: number; percentage: number }
  >;
} {
  const dealsByStage = getDealsByStage(deals);
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
  return { totalDeals, stageAnalytics };
}

function getDealsByStage(deals: Deal[]): Record<string, Deal[]> {
  return deals.reduce((acc: Record<string, Deal[]>, deal: Deal) => {
    if (!acc[deal.stage]) {
      acc[deal.stage] = [];
    }
    acc[deal.stage].push(deal);
    return acc;
  }, {} as Record<string, Deal[]>);
}
