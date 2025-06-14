import React from "react";
import DealList from "./DealList";
import PerformanceMetrics from "./PerformanceMetrics";
import PipelineFunnel from "./PipelineFunnel";

const PipelineDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Pipeline Analytics Dashboard
        </h1>

        <div className="grid gap-6">
          {/* Pipeline Overview Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Pipeline Overview
            </h2>
            <PipelineFunnel />
          </div>

          {/* Performance Metrics Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Performance Metrics
            </h2>
            <PerformanceMetrics />
          </div>

          {/* Deal List Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Deal List
            </h2>
            <DealList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineDashboard;
