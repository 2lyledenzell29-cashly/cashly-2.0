'use client';

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

interface IncomeExpenseBarChartProps {
  walletId?: string;
  months?: number;
  height?: number;
}

const IncomeExpenseBarChart: React.FC<IncomeExpenseBarChartProps> = ({
  walletId,
  months = 6,
  height = 300
}) => {
  const { chartData, fetchChartData, loading, error } = useDashboard();

  useEffect(() => {
    fetchChartData('income-expense-bar', { wallet_id: walletId, months });
  }, [fetchChartData, walletId, months]);

  const data = chartData['income-expense-bar'];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses',
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
      <Bar data={data} options={options} />
    </div>
  );
};

export default IncomeExpenseBarChart;