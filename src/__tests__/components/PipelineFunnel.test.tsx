import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import PipelineFunnel from "../../components/PipelineFunnel";

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("PipelineFunnel", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("renders loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PipelineFunnel />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders pipeline data correctly", async () => {
    const mockData = {
      totalDeals: 10,
      stageAnalytics: {
        prospect: { deals: [], count: 3, percentage: 30 },
        qualified: { deals: [], count: 2, percentage: 20 },
        proposal: { deals: [], count: 2, percentage: 20 },
        negotiation: { deals: [], count: 2, percentage: 20 },
        closed_won: { deals: [], count: 1, percentage: 10 },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    render(<PipelineFunnel />);

    await waitFor(() => {
      expect(screen.getByText("Prospect")).toBeInTheDocument();
    });

    expect(screen.getByText("Prospect")).toBeInTheDocument();
    expect(screen.getByText("3 deals (30%)")).toBeInTheDocument();
    expect(screen.getByText("Qualified")).toBeInTheDocument();
    expect(screen.getByText("2 deals (20%)")).toBeInTheDocument();
    expect(screen.getByText("Proposal")).toBeInTheDocument();
    expect(screen.getByText("Negotiation")).toBeInTheDocument();
    expect(screen.getByText("Closed Won")).toBeInTheDocument();
    expect(screen.getByText("1 deals (10%)")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<PipelineFunnel />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error loading pipeline data/)
      ).toBeInTheDocument();
    });
  });

  it("renders empty state when no data", async () => {
    const mockData = {
      totalDeals: 0,
      stageAnalytics: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    render(<PipelineFunnel />);

    await waitFor(() => {
      expect(
        screen.getByText("No pipeline data available")
      ).toBeInTheDocument();
    });
  });

  it("handles API error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    render(<PipelineFunnel />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error loading pipeline data/)
      ).toBeInTheDocument();
    });
  });

  it("displays correct stage colors", async () => {
    const mockData = {
      totalDeals: 5,
      stageAnalytics: {
        prospect: { deals: [], count: 1, percentage: 20 },
        qualified: { deals: [], count: 1, percentage: 20 },
        proposal: { deals: [], count: 1, percentage: 20 },
        negotiation: { deals: [], count: 1, percentage: 20 },
        closed_won: { deals: [], count: 1, percentage: 20 },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    render(<PipelineFunnel />);

    await waitFor(() => {
      expect(screen.getByText("Prospect")).toBeInTheDocument();
    });

    // Check that stage bars are rendered (they should have specific background colors)
    const prospectBar = screen
      .getByText("Prospect")
      .closest("div")
      ?.querySelector(".bg-blue-500");
    const qualifiedBar = screen
      .getByText("Qualified")
      .closest("div")
      ?.querySelector(".bg-green-500");
    const proposalBar = screen
      .getByText("Proposal")
      .closest("div")
      ?.querySelector(".bg-yellow-500");
    const negotiationBar = screen
      .getByText("Negotiation")
      .closest("div")
      ?.querySelector(".bg-orange-500");
    const closedWonBar = screen
      .getByText("Closed Won")
      .closest("div")
      ?.querySelector(".bg-emerald-500");

    expect(prospectBar).toBeInTheDocument();
    expect(qualifiedBar).toBeInTheDocument();
    expect(proposalBar).toBeInTheDocument();
    expect(negotiationBar).toBeInTheDocument();
    expect(closedWonBar).toBeInTheDocument();
  });
});
