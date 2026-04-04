import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

export const chartPalette = {
  emerald: '#00ED64',
  forest: '#023430',
  mint: '#83F0B8',
  lime: '#C1FF72',
  teal: '#13AA52',
  cyan: '#38BDF8',
  navy: '#0B1F1A',
  slate: '#94A3B8',
  rose: '#FB7185',
  amber: '#F59E0B',
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        boxWidth: 12,
        color: '#475569',
        font: {
          family: 'Plus Jakarta Sans',
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: '#08130F',
      titleColor: '#FFFFFF',
      bodyColor: '#E2E8F0',
      padding: 12,
      cornerRadius: 14,
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#64748B',
        font: {
          family: 'Plus Jakarta Sans',
        },
      },
      grid: {
        display: false,
      },
    },
    y: {
      ticks: {
        color: '#64748B',
        font: {
          family: 'Plus Jakarta Sans',
        },
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.18)',
      },
      beginAtZero: true,
      max: 100,
    },
  },
};
