import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-financial-overview',
  templateUrl: './financial-overview.component.html',
  styleUrls: ['./financial-overview.component.scss']
})
export class FinancialOverviewComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() income: number = 0;
  @Input() expense: number = 0;
  @Input() currency: any = { symbol: '$' };

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  private chart: Highcharts.Chart | null = null;

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['income'] || changes['expense']) && this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (this.chart) {
      // Update title position on resize
      this.chart.setTitle({
        text: `Net Balance<br>${this.currency.symbol}${this.balance.toLocaleString()}`,
        y: this.getTitleYPosition()
      });

      // Update chart center and data label positioning
      this.chart.update({
        plotOptions: {
          pie: {
            center: this.getChartCenter(),
            dataLabels: {
              distance: this.getDataLabelDistance()
            }
          }
        }
      });

      // Trigger chart reflow to handle size changes
      this.chart.reflow();
    }
  }

  get balance(): number {
    return this.income - this.expense;
  }

  private getTitleYPosition(): number {
    // Adjust Y position based on screen size to prevent overlap
    if (window.innerWidth <= 480) {
      return 15; // Closer to center on small mobile
    } else if (window.innerWidth <= 768) {
      return 25; // Medium positioning for tablets
    } else {
      return 35; // Standard positioning for desktop
    }
  }

  private getChartCenter(): [string, string] {
    // Adjust chart center based on screen size
    if (window.innerWidth <= 480) {
      return ['50%', '70%']; // Move chart up slightly on mobile
    } else {
      return ['50%', '75%']; // Standard positioning
    }
  }

  private getDataLabelDistance(): number {
    // Adjust data label distance based on screen size and value length
    if (window.innerWidth <= 480) {
      return -20; // Closer to edge on mobile for better visibility
    } else if (window.innerWidth <= 768) {
      return -25; // Medium distance for tablets
    } else {
      return -30; // Standard distance for desktop
    }
  }

  private getDataLabelFontSize(): string {
    // Responsive font size for data labels
    if (window.innerWidth <= 480) {
      return '0.7rem'; // Smaller on mobile
    } else if (window.innerWidth <= 768) {
      return '0.8rem'; // Medium size for tablets
    } else {
      return '0.9rem'; // Standard size for desktop
    }
  }

  private formatValueForDisplay(value: number): string {
    // Format large numbers more concisely for mobile displays
    if (window.innerWidth <= 480) {
      // On mobile, use abbreviated format for large numbers
      if (Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
      } else if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
      }
    }
    // Default: show full number with locale formatting
    return value.toLocaleString();
  }

  private createChart(): void {
    if (!this.chartContainer) return;

    const options: Highcharts.Options = {
      chart: {
        plotBackgroundColor: undefined,
        plotBorderWidth: 0,
        plotShadow: false,
        height: 400,
        backgroundColor: 'transparent',
        animation: false,
        margin: [10, 10, 60, 10],
        spacing: [10, 10, 10, 10]
      },
      title: {
        text: `Net Balance<br>${this.currency.symbol}${this.balance.toLocaleString()}`,
        align: 'center',
        verticalAlign: 'middle',
        y: this.getTitleYPosition(),
      },
      tooltip: {
        useHTML: true,
        formatter: function () {
          const point = (this as Highcharts.Point);
          const currency = (point.options as any).currency;

          return `
            <b>${point.name}</b><br>
            Amount: <b>${currency}${point.y?.toLocaleString()}</b><br>
            Percentage: <b>${this.percentage?.toFixed(1)}%</b>
          `;
        }
      },
      accessibility: {
        enabled: false
      },
      plotOptions: {
        pie: {
          dataLabels: {
            enabled: true,
            distance: this.getDataLabelDistance(),
            formatter: function () {
              const point = (this as Highcharts.Point);
              const y = point.y;
              const currency = (point.options as any).currency;
              return `${currency}${y?.toLocaleString()}`;
            },
            useHTML: true
          },
          startAngle: -90,
          endAngle: 90,
          center: this.getChartCenter(),
          size: '110%',
          innerSize: '60%',
          borderWidth: 0,
          animation: false,
          tooltip: {
            pointFormatter: function () {
              const point = this as any;
              return `${point.currency}${this.y?.toLocaleString()}`;
            }
          }
        }
      },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal',
        y: -10,
        itemStyle: {
          fontSize: '0.9rem',
          fontWeight: 'normal'
        },
        symbolRadius: 6
      },
      credits: {
        enabled: false
      },
      exporting: {
        enabled: false
      },
      series: [{
        type: 'pie',
        name: 'Financial Overview',
        innerSize: '60%',
        data: [
          {
            name: 'Income',
            y: this.income,
            color: '#4caf50',
            currency: this.currency.symbol
          } as any,
          {
            name: 'Expense',
            y: Math.abs(this.expense),
            color: '#f44336',
            currency: this.currency.symbol
          } as any
        ],
        animation: true
      }]
    };

    this.chart = Highcharts.chart(this.chartContainer.nativeElement, options);
  }

  private updateChart(): void {
    if (!this.chart) return;

    // Update title
    this.chart.setTitle({
      text: `Net Balance<br>${this.currency.symbol}${this.balance.toLocaleString()}`,
      y: this.getTitleYPosition()
    });

    // Update series data
    const series = this.chart.series[0] as Highcharts.Series;
    series.setData([
      {
        name: 'Income',
        y: this.income,
        color: '#4caf50',
        currency: this.currency.symbol
      } as any,
      {
        name: 'Expense',
        y: Math.abs(this.expense),
        color: '#f44336',
        currency: this.currency.symbol
      } as any
    ], true);
  }
}
