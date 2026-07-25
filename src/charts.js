// src/charts.js
import ApexCharts from 'apexcharts';

export function initCharts() {
  // --- 1. BAR CHART CONFIGURATION (Weekly Sales) ---
  const barOptions = {
    series: [{
      name: 'Sales',
      data: [1, 1, 1, 1, 1, 1, 0] // Mga halaga sa Pundasyon/Figma mo
    }],
    chart: {
      type: 'bar',
      height: 400,
      toolbar: { show: false }, // Tinatago ang download lines button para malinis
      fontFamily: 'Poppins, sans-serif'
    },
    colors: ['#176B87'], // Kulay na malapit sa Figma mo (Indigo/Blue)
    plotOptions: {
      bar: {
        borderRadius: 8, // Rounded corners ng bars gaya ng sa Figma mo!
        columnWidth: '55%',
      }
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4, // Dashed lines sa background grid
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: '#94a3b8' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8' } }
    }
  };

  // Render Bar Chart
  const barChartEl = document.getElementById('weekly-sales-chart');
  if (barChartEl) {
    const barChart = new ApexCharts(barChartEl, barOptions);
    barChart.render();
  }

  // --- 2. DONUT CHART CONFIGURATION (Sales by Category) ---
  // --- DONUT CHART CONFIGURATION (Sales by Category) ---
const donutOptions = {
  series: [45, 25, 20, 10], // Groceries, Beverages, Snacks, Others
  chart: {
    type: 'donut',
    height: 240, // Binawasan ang height para swak sa HTML legend mo sa ibaba
    fontFamily: 'Poppins, sans-serif'
  },
  colors: ['#4f46e5', '#0ea5e9', '#fb923c', '#dc2626'], // Tumatugma sa Tailwind colors mo (indigo-600, sky/secondary, orange-400, red-600)
  labels: ['Groceries', 'Beverages', 'Snacks', 'Others'],
  
  // 1. DITO AALISIN ANG DEFAULT LEGEND NG APEXCHARTS
  legend: {
    show: false 
  },
  
  stroke: { 
    show: true, 
    width: 3, 
    colors: ['#ffffff'] 
  },
  plotOptions: {
    pie: {
      donut: {
        size: '75%', // Kapal o nipis ng ring
      }
    }
  },
  dataLabels: { 
    enabled: false // Malinaw pa rin kahit walang text sa loob ng ring
  },
  tooltip: {
    y: {
      formatter: (val) => `${val}%` // Magpapakita ng % kapag in-hover ang mouse sa ring
    }
  }
};

// Render Donut Chart
const donutChartEl = document.getElementById('category-chart');
if (donutChartEl) {
  const donutChart = new ApexCharts(donutChartEl, donutOptions);
  donutChart.render();
}
}