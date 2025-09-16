import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as Highcharts from 'highcharts';

/**
 * Reusable, configurable Highcharts line chart component.
 * Inputs let you control title, series, categories, axes labels, colors, legend, tooltip, height, and more.
 */
@Component({
    selector: 'app-line-chart',
    templateUrl: './line-chart.component.html',
    styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnChanges {
    Highcharts: typeof Highcharts = Highcharts;

    // Core configuration
    @Input() title: string = '';
    @Input() subtitle?: string;
    @Input() categories: Array<string | number | Date> = [];
    @Input() series: Highcharts.SeriesOptionsType[] = [];

    // Presentation
    @Input() yAxisTitle?: string;
    @Input() xAxisTitle?: string;
    @Input() colors?: string[];
    @Input() legend: Highcharts.LegendOptions | boolean = true;
    @Input() showXAxisLabels: boolean = true;
    @Input() showYAxisLabels: boolean = true;
    @Input() tooltipShared: boolean = true;
    @Input() tooltipFormatter?: Highcharts.TooltipFormatterCallbackFunction;
    @Input() dataLabels: boolean = false;
    @Input() spline: boolean = false; // when true, uses 'spline' type instead of 'line'
    @Input() markers: boolean = false; // show point markers (dots)

    // Behavior
    @Input() exporting: boolean = false; // requires exporting module to be registered in host if enabled
    @Input() credits: boolean = false; // hide Highcharts credits by default
    @Input() gridLines: boolean = true; // toggle yAxis grid lines
    @Input() height?: number; // px

    options: Highcharts.Options = {};
    updateFlag = true; // used to trigger chart update

    ngOnChanges(changes: SimpleChanges): void {
        this.buildOptions();
        this.updateFlag = true;
    }

    private buildOptions(): void {
        // normalize series types to line/spline when not explicitly set
        const normalizedSeries: Highcharts.SeriesOptionsType[] = (this.series || []).map((s: any) => {
            if (!s.type) {
                s.type = this.spline ? 'spline' : 'line';
            }
            return s;
        });

    // Determine final legend enabled state from input
    const legendEnabled = typeof this.legend === 'boolean' ? this.legend : true;

        this.options = {
            chart: {
                type: this.spline ? 'spline' : 'line',
                height: this.height || undefined,
                backgroundColor: 'transparent'
            },
            title: { text: this.title || undefined },
            subtitle: this.subtitle ? { text: this.subtitle } : undefined,
            xAxis: {
                categories: this.categories as any,
                title: this.xAxisTitle ? { text: this.xAxisTitle } : undefined,
                labels: { enabled: this.showXAxisLabels },
                tickmarkPlacement: 'on',
                gridLineWidth: this.gridLines ? 1 : 0,
                lineWidth: this.gridLines ? 1 : 0,
                crosshair: true
            },
            yAxis: {
                title: this.yAxisTitle ? { text: this.yAxisTitle } : undefined,
                labels: { enabled: this.showYAxisLabels },
                gridLineWidth: this.gridLines ? 1 : 0,
                lineWidth: this.gridLines ? 1 : 0
            },
            legend: typeof this.legend === 'boolean' ? { enabled: this.legend } : this.legend,
            colors: this.colors,
            tooltip: {
                shared: this.tooltipShared,
                formatter: this.tooltipFormatter
            },
            plotOptions: {
                series: {
                    dataLabels: { enabled: this.dataLabels },
                    marker: {
                        enabled: this.markers,
                        radius: 2,
                        states: { hover: { enabled: this.markers } }
                    }
                }
            },
            series: normalizedSeries,
            exporting: { enabled: this.exporting },
            credits: { enabled: this.credits },
            responsive: {
                rules: [
                    {
                        condition: { maxWidth: 600 },
                        chartOptions: {
                            // keep legend consistent with input even on small screens
                            legend: { enabled: legendEnabled },
                            yAxis: { title: { text: undefined } },
                            xAxis: { title: { text: undefined } }
                        }
                    }
                ]
            }
        } as Highcharts.Options;
    }
}
