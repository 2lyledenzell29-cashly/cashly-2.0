import React, { useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useDashboard } from '@/contexts/DashboardContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BudgetProgressChartProps {
  walletId?: string;
  height?: number;
}

const BudgetProgressChart: React.FC<BudgetProgressChartProps> = ({
  walletId,
  height = 300
}) => {
  const { chartData, fetchChartData, loading, error } = useDashboard();

  useEffect(() => {
    fetchChartData('budget-progress', { wallet_id: walletId });
  }, [fetchChartData, walletId]);

  const data = chartData['budget-progress'];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Budget Progress by Wallet',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        stacked: true
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
        <p>No budget data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default BudgetProgressChart;