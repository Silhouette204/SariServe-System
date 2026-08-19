// src/dashboard-charts.js
import ApexCharts from 'apexcharts';

// References para sa ApexCharts instances
let barChartInstance = null;
let donutChartInstance = null;
let lowStockChartInstance = null;

export function dashboardInitCharts() {
  // --- 1. BAR CHART (Weekly Sales) ---
  const barChartEl = document.getElementById('weekly-sales-chart');
  if (barChartEl) {
    const barOptions = {
      series: [{ name: 'Sales', data: [0, 0, 0, 0, 0, 0, 0] }],
      chart: { 
        type: 'bar', 
        height: 400, 
        toolbar: { show: false }, 
        fontFamily: 'Poppins, sans-serif' 
      },
      colors: ['#176B87'],
      plotOptions: { 
        bar: { 
          borderRadius: 10, 
          columnWidth: '55%' 
        } 
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4
      },
      xaxis: { 
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        labels: { style: { colors: '#94a3b8' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { 
          style: { colors: '#94a3b8' },
          formatter: (val) => `₱${val.toLocaleString()}`
        }
      }
    };

    barChartInstance = new ApexCharts(barChartEl, barOptions);
    barChartInstance.render();
  }

  // --- 2. DONUT CHART (Sales by Category) ---
  const donutChartEl = document.getElementById('category-chart');
  if (donutChartEl) {
    const donutOptions = {
      series: [], 
      labels: [], 
      chart: {
        type: 'donut',
        height: 240,
        fontFamily: 'Poppins, sans-serif'
      },
      noData: {
        text: 'Loading category data...',
        align: 'center',
        verticalAlign: 'middle',
        style: {
          color: '#94a3b8',
          fontSize: '14px',
          fontFamily: 'Poppins, sans-serif'
        }
      },
      colors: [
        '#ea580c', // Beverages
        '#4f46e5', // Food
        '#176B87', // NonFood
        '#60a5fa', // Frozen
        '#dc2626', // Snacks
      ],
      
      legend: { show: false },
      stroke: { 
        show: true, 
        width: 3, 
        colors: ['#ffffff'] 
      },
      plotOptions: {
        pie: {
          donut: { size: '75%' }
        }
      },
      dataLabels: { enabled: false },
      tooltip: {
        y: { formatter: (val) =>
          `₱${Number(val).toLocaleString('en-PH')}`
        }
      }
    };
  
    donutChartInstance = new ApexCharts(donutChartEl, donutOptions);
    donutChartInstance.render();
  }

  // --- 3. HORIZONTAL BAR CHART (Low Stock Alert) ---
  const lowStockChartEl = document.getElementById('low-stock-chart');
  if (lowStockChartEl) {
    const lowStockOptions = {
      series: [{
        name: 'Current Stock',
        data: [] 
      }],
      chart: {
        type: 'bar',
        height: 230,
        fontFamily: 'Poppins, sans-serif',
        toolbar: { show: false }
      },
      noData: {
        text: 'No low stock items found',
        align: 'center',
        verticalAlign: 'middle',
        style: {
          color: '#94a3b8',
          fontSize: '14px',
          fontFamily: 'Poppins, sans-serif'
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '45%',
          borderRadius: 6
        }
      },
      colors: ['#f97316'],
      dataLabels: {
        enabled: true,
        textAnchor: 'start',
        style: { 
          colors: ['#ffffff'],
          fontSize: '12px',
          fontWeight: 600
        },
        formatter: (val) => val,
        offsetX: 5
      },
      grid: { show: false },
      xaxis: {
        categories: [], 
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          style: { 
            colors: '#1e293b',
            fontSize: '13px',
            fontWeight: 600 
          }
        }
      },
      tooltip: {
        y: { formatter: (val) => `${val} pcs left` }
      }
    };
  
    lowStockChartInstance = new ApexCharts(lowStockChartEl, lowStockOptions);
    lowStockChartInstance.render();
  }
}

// --- DATABASE UPDATE FUNCTIONS ---

export function updateWeeklySalesChart(newData, newCategories) {
  if (barChartInstance) {
    barChartInstance.updateOptions({
      series: [{ name: 'Sales', data: newData }],
      xaxis: { categories: newCategories }
    });
  }
}

export function updateCategoryChart(newSeries, newLabels) {
  if (donutChartInstance) {
    donutChartInstance.updateOptions({
      series: newSeries,
      labels: newLabels
    });
  }
}

export function updateLowStockChart(newData, newCategories) {
  if (lowStockChartInstance) {
    lowStockChartInstance.updateOptions({
      series: [{ name: 'Current Stock', data: newData }],
      xaxis: { categories: newCategories }
    });
  }
}