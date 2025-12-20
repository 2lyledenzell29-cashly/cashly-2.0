import React, { useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useDashboard } from '@/contexts/DashboardContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryPieChartProps {
  walletId?: string;
  type?: 'Income' | 'Expense';
  height?: number;
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  walletId,
  type = 'Expense',
  height = 300
}) => {
  const { chartData, fetchChartData, loading, error } = useDashboard();

  useEffect(() => {
    fetchChartData('category-pie', { wallet_id: walletId, type });
  }, [fetchChartData, walletId, type]);

  // Create a unique cache key based on the parameters
  const cacheKey = `category-pie-${type.toLowerCase()}-${walletId || 'all'}`;
  const data = chartData[cacheKey] || chartData['category-pie'];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15
        }
      },
      title: {
        display: true,
        text: `${type} by Category`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-red-600" style={{ height }}>
        <p>Error loading chart: {error}</p>
      </div>
    );
  }

  if (!data || !data.datasets[0] || data.datasets[0].data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default CategoryPieChart;