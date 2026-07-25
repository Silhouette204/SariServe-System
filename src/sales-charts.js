import ApexCharts from 'apexcharts';

export function salesInitCharts() {
  const options = {
    // Dummy Hourly Data (Nakasunod sa wave ng screenshot mo)
    series: [{
      name: 'Sales Trend',
      data: [450, 800, 1250, 980, 1600, 1120, 890, 1350, 1700, 2150, 1900]
    }],
    chart: {
      type: 'line',
      height: 300,
      fontFamily: 'Poppins, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#176B87'], // Indigo/Purple color na katulad sa screenshot
    stroke: {
      curve: 'smooth', // Gagawing curved/smooth ang linya
      width: 3        // Nipis/kapal ng linya
    },
    markers: {
      size: 6,                 // Lalabas ang bilog na tuldok sa bawat point
      colors: ['#176B87'],
      strokeColors: '#ffffff', // Puting border sa palibot ng tuldok
      strokeWidth: 2,
      hover: { size: 8 }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 3      // Dashed background grid lines
    },
    xaxis: {
      categories: ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'],
      labels: {
        style: { colors: '#94a3b8', fontSize: '12px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      max: 2200,
      tickAmount: 4, // Magpapakita ng 0, 550, 1100, 1650, 2200 na pagitan
      labels: {
        style: { colors: '#94a3b8', fontSize: '12px' }
      }
    },
    tooltip: {
      y: {
        formatter: (val) => `₱${val}`
      }
    }
  };

  const chartEl = document.getElementById('sales-trend-chart');
  if (chartEl) {
    const chart = new ApexCharts(chartEl, options);
    chart.render();
  }
}