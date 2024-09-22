import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { SerialService } from '../serial.service';

PlotlyModule.plotlyjs = PlotlyJS;

@Component({
  selector: 'app-now',
  standalone: true,
  imports: [MatGridListModule, MatIconModule, PlotlyModule, MatCardModule],
  templateUrl: './now.component.html',
  styleUrls: ['./now.component.scss'],
})
export class NowComponent implements OnInit, OnDestroy, AfterViewInit {
  sets: number = 0;
  reps: number = 0;
  bpm: number = 0;

  config = { responsive: true, displayModeBar: false };

  private serial: SerialService;
  constructor(private serialService: SerialService) {
    this.serial = serialService;
    this.serial.data$.subscribe((data) => {
      const newX = this.count++;

      // Add new points to x and y
      const xData = (this.angleGraph.data[0] as PlotlyJS.ScatterData)
        .x as number[];
      const yData = (this.angleGraph.data[0] as PlotlyJS.ScatterData)
        .y as number[];

      xData.push(newX);
      yData.push(data[0]);

      if (this.rangeGraph.data[0].value < data[0]) {
        this.rangeGraph.data[0].value = data[0];
      }

      // Update range to make the graph scroll to the left
      if (newX > this.windowSize) {
        this.angleGraph.layout.xaxis!.range = [newX - this.windowSize, newX];
      }

      const xData2 = (this.effortGraph.data[0] as PlotlyJS.ScatterData)
        .x as number[];
      const yData2 = (this.effortGraph.data[0] as PlotlyJS.ScatterData)
        .y as number[];

      xData2.push(newX);
      yData2.push(data[1]);

      // Update range to make the graph scroll to the left
      if (newX > this.windowSize) {
        this.effortGraph.layout.xaxis!.range = [newX - this.windowSize, newX];
      }
      if (xData.length >= 2) {
        this.fatigueGraph.data[0].value =
          xData[xData.length - 1] - xData[xData.length - 2];
      }
    });
  }

  ngAfterViewInit() {
    this.resizePlots();
    window.addEventListener('resize', this.resizePlots.bind(this));
  }

  resizePlots() {
    const update = {
      'xaxis.autorange': true,
      'yaxis.autorange': true,
    };
    PlotlyJS.relayout('angle', update);
    PlotlyJS.relayout('range', update);
    PlotlyJS.relayout('effort', update);
    PlotlyJS.relayout('fatigue', update);
  }

  public angleGraph: {
    data: Partial<PlotlyJS.ScatterData>[];
    layout: Partial<PlotlyJS.Layout>;
  } = {
    data: [
      {
        x: [1, 2, 3],
        y: [2, 6, 3],
        type: 'scatter',
        mode: 'lines+markers',
        marker: { color: 'blue' },
      },
    ],
    layout: {
      xaxis: {
        range: [0, 5], // Initial range
      },
      yaxis: {
        range: [0, 180],
      },
      title: 'Live Angle Reading',
      autosize: true,
      margin: { l: 40, r: 20, t: 40, b: 30 },
    },
  };

  public rangeGraph: { data: any; layout: Partial<PlotlyJS.Layout> } = {
    data: [
      {
        domain: { x: [0, 1], y: [0, 1] },
        value: 0,
        type: 'indicator',
        mode: 'gauge+number',
        gauge: { axis: { visible: true, range: [0, 100] } },
      },
    ],
    layout: {
      title: 'Range of Motion',
      margin: { l: 40, r: 20, t: 40, b: 30 },
      height: 200,
    },
  };

  public effortGraph: {
    data: Partial<PlotlyJS.ScatterData>[];
    layout: Partial<PlotlyJS.Layout>;
  } = {
    data: [
      {
        x: [1, 2, 3],
        y: [2, 6, 3],
        type: 'scatter',
        mode: 'lines+markers',
        marker: { color: 'blue' },
      },
    ],
    layout: {
      xaxis: {
        range: [0, 5], // Initial range
      },
      yaxis: {
        range: [0, 180],
      },
      title: 'Effort Reading',
      margin: { l: 40, r: 20, t: 40, b: 30 },
    },
  };

  public fatigueGraph: { data: any; layout: Partial<PlotlyJS.Layout> } = {
    data: [
      {
        domain: { x: [0, 1], y: [0, 1] },
        value: 270,
        type: 'indicator',
        mode: 'gauge+number',
        gauge: { axis: { visible: true, range: [0, 100] } },
      },
    ],
    layout: {
      title: 'Fatigue Graph',
      margin: { l: 40, r: 20, t: 40, b: 30 },
      height: 200,
    },
  };

  public bpmGraph: {
    data: Partial<PlotlyJS.ScatterData>[];
    layout: Partial<PlotlyJS.Layout>;
  } = {
    data: [
      {
        x: [1, 2, 3],
        y: [2, 6, 3],
        type: 'scatter',
        mode: 'lines+markers',
        marker: { color: 'blue' },
      },
    ],
    layout: {
      xaxis: {
        range: [0, 5], // Initial range
      },
      yaxis: {
        range: [0, 180],
      },
      title: 'Heartrate Reading',
    },
  };

  private intervalId: any;
  private windowSize = 5; // The x-axis window size to display
  private count = 4; // Start from 4 since we already have x: [1, 2, 3]

  ngOnInit() {
    this.startUpdatingGraph();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  private startUpdatingGraph() {
    this.intervalId = setInterval(() => {
      const newX = this.count++;
      const newY = Math.floor(Math.random() * 10); // Generate random y value

      const xData3 = (this.bpmGraph.data[0] as PlotlyJS.ScatterData)
        .x as number[];
      const yData3 = (this.bpmGraph.data[0] as PlotlyJS.ScatterData)
        .y as number[];

      xData3.push(newX);
      yData3.push(newY * 10);

      // Update range to make the graph scroll to the left
      if (newX > this.windowSize) {
        this.bpmGraph.layout.xaxis!.range = [newX - this.windowSize, newX];
      }

      // Re-plot the graphs
      const angleElement = document.getElementById('angle');
      const rangeElement = document.getElementById('range');
      const effortElement = document.getElementById('effort');
      const fatigueElement = document.getElementById('fatigue');

      if (angleElement && rangeElement && effortElement && fatigueElement) {
        PlotlyJS.newPlot(
          'angle',
          this.angleGraph.data,
          this.angleGraph.layout,
          this.config
        );
        PlotlyJS.newPlot(
          'range',
          this.rangeGraph.data,
          this.rangeGraph.layout,
          this.config
        );
        PlotlyJS.newPlot(
          'effort',
          this.effortGraph.data,
          this.effortGraph.layout,
          this.config
        );
        PlotlyJS.newPlot(
          'fatigue',
          this.fatigueGraph.data,
          this.fatigueGraph.layout,
          this.config
        );
        PlotlyJS.newPlot(
          'bpm',
          this.bpmGraph.data,
          this.bpmGraph.layout,
          this.config
        );
      }
    }, 1000); // Update every second
  }
}
