import React, { useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useDashboard } from '@/contexts/DashboardContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SpendingTrendsChartProps {
  walletId?: string;
  period?: 'monthly' | 'weekly';
  months?: number;
  height?: number;
}

const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({
  walletId,
  period = 'monthly',
  months = 6,
  height = 300
}) => {
  const { chartData, fetchChartData, loading, error } = useDashboard();

  useEffect(() => {
    fetchChartData('spending-trends', { wallet_id: walletId, period, months });
  }, [fetchChartData, walletId, period, months]);

  const data = chartData['spending-trends'];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Income vs Expense Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.1
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

  if (!data) {
    return (
      <div className="flex items-center justify-center text-gray-500" style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default SpendingTrendsChart;