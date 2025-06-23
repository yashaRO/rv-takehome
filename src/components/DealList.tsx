"use client";
import React, { useEffect, useMemo, useState } from "react";

interface Deal {
  id: number;
  deal_id: string;
  company_name: string;
  contact_name: string;
  transportation_mode: string;
  stage: string;
  value: number;
  probability: number;
  created_date: string;
  updated_date: string;
  expected_close_date: string;
  sales_rep: string;
  origin_city: string;
  destination_city: string;
  cargo_type?: string;
}

interface PipelineData {
  totalDeals: number;
  stageAnalytics: Record<
    string,
    { deals: Deal[]; count: number; percentage: number }
  >;
}

type SortField = keyof Deal;
type SortDirection = "asc" | "desc";

const DealList: React.FC = () => {
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedDeals, setSelectedDeals] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSalesRep, setNewSalesRep] = useState("");

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch("/api/deals");
        if (!response.ok) {
          throw new Error("Failed to fetch deals");
        }
        const data = await response.json();
        setPipelineData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Flatten all deals from all stages
  const allDeals = useMemo(() => {
    if (!pipelineData) return [];

    const deals: Deal[] = [];
    Object.values(pipelineData.stageAnalytics).forEach((stageData) => {
      deals.push(...stageData.deals);
    });
    return deals;
  }, [pipelineData]);

  // Calculate unique sales reps
  const uniqueSalesReps = useMemo(() => {
    const salesRepsSet = new Set<string>();
    allDeals.forEach((deal) => {
      if (deal.sales_rep && deal.sales_rep.trim()) {
        salesRepsSet.add(deal.sales_rep.trim());
      }
    });
    return Array.from(salesRepsSet).sort();
  }, [allDeals]);

  // Filter and sort deals
  const filteredAndSortedDeals = useMemo(() => {
    const filtered = allDeals.filter(
      (deal) =>
        deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.deal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.sales_rep.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.transportation_mode
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === "asc" ? -1 : 1;
      if (bValue === undefined) return sortDirection === "asc" ? 1 : -1;

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [allDeals, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allDealIds = new Set(filteredAndSortedDeals.map(deal => deal.id));
      setSelectedDeals(allDealIds);
    } else {
      setSelectedDeals(new Set());
    }
  };

  const handleSelectDeal = (dealId: number, checked: boolean) => {
    const newSelectedDeals = new Set(selectedDeals);
    if (checked) {
      newSelectedDeals.add(dealId);
    } else {
      newSelectedDeals.delete(dealId);
    }
    setSelectedDeals(newSelectedDeals);
  };

  const isAllSelected = filteredAndSortedDeals.length > 0 && 
    filteredAndSortedDeals.every(deal => selectedDeals.has(deal.id));
  const isIndeterminate = selectedDeals.size > 0 && !isAllSelected;

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setNewSalesRep("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewSalesRep("");
  };

  const handleBulkUpdateSalesRep = async () => {
    if (!newSalesRep.trim() || selectedDeals.size === 0 || !pipelineData) return;

    try {
      // Here you would typically make an API call to update the deals
      // For now, we'll just update the local state
      const updatedData = { ...pipelineData };
      Object.values(updatedData.stageAnalytics).forEach((stageData) => {
        stageData.deals.forEach((deal) => {
          if (selectedDeals.has(deal.id)) {
            deal.sales_rep = newSalesRep.trim();
          }
        });
      });
      setPipelineData(updatedData);

      // Clear selection and close modal
      setSelectedDeals(new Set());
      handleCloseModal();
    } catch (error) {
      console.error("Failed to update sales rep:", error);
      // You could add error handling here
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStageColor = (stage: string) => {
    const colors = {
      prospect: "bg-blue-100 text-blue-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-yellow-100 text-yellow-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed_won: "bg-emerald-100 text-emerald-800",
      closed_lost: "bg-red-100 text-red-800",
    };
    return colors[stage as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading deals: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleOpenModal}
          disabled={selectedDeals.size === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedDeals.size === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}
        >
          {`Change Sales Rep${selectedDeals.size ? ` (${selectedDeals.size} selected)` : ''}`}
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedDeals.length} of {allDeals.length} deals
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              {[
                { key: "deal_id", label: "Deal ID" },
                { key: "company_name", label: "Company" },
                { key: "contact_name", label: "Contact" },
                { key: "stage", label: "Stage" },
                { key: "transportation_mode", label: "Mode" },
                { key: "value", label: "Value" },
                { key: "probability", label: "Probability" },
                { key: "sales_rep", label: "Sales Rep" },
                { key: "expected_close_date", label: "Expected Close" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(key as SortField)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    {sortField === key && (
                      <span className="text-blue-500">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedDeals.map((deal) => (
              <tr key={deal.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedDeals.has(deal.id)}
                    onChange={(e) => handleSelectDeal(deal.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {deal.deal_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deal.company_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deal.contact_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(
                      deal.stage
                    )}`}
                  >
                    {deal.stage.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {deal.transportation_mode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(deal.value)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deal.probability}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deal.sales_rep}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(deal.expected_close_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedDeals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No deals found matching your search criteria.
        </div>
      )}

      {/* Modal for bulk sales rep update */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Sales Representative
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Update the sales representative for {selectedDeals.size} selected deals.
            </p>
            <div className="mb-6">
              <label htmlFor="salesRep" className="block text-sm font-medium text-gray-700 mb-2">
                New Sales Representative
              </label>
              <div className="space-y-3">
                {/* Dropdown for existing sales reps */}
                {uniqueSalesReps.length > 0 && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Select from existing:
                    </label>
                    <select
                      value={uniqueSalesReps.includes(newSalesRep) ? newSalesRep : ""}
                      onChange={(e) => setNewSalesRep(e.target.value)}
                      className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">-- Select existing sales rep --</option>
                      {uniqueSalesReps.map((salesRep) => (
                        <option key={salesRep} value={salesRep}>
                          {salesRep}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Text input for custom value */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Or enter new name:
                  </label>
                  <input
                    type="text"
                    id="salesRep"
                    value={newSalesRep}
                    onChange={(e) => setNewSalesRep(e.target.value)}
                    placeholder="Enter sales representative name"
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdateSalesRep}
                disabled={!newSalesRep.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !newSalesRep.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Update Sales Rep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealList;
