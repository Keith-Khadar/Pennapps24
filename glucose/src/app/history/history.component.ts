import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { BackendService } from '../backend.service';

PlotlyModule.plotlyjs = PlotlyJS;

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [PlotlyModule, MatIconModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit, OnDestroy {
  sets: number = 0;
  reps: number = 0;
  bpm: number = 0;

  rangeData: number[] = [];
  xData: number[] = [];
  effortData: number[] = [];

  response: string = 'Thinking...';

  private backend: BackendService;

  constructor(private backendService: BackendService) {
    this.backend = backendService;
    this.loadData();
    this.loadInsight();
  }

  loadData(): void {
    this.backend.getData().subscribe((data) => {
      data.forEach((item) => {
        // Push range and effort values into their respective arrays
        this.xData.push(Object.values(item).map(Number)[0]);
        this.rangeData.push(Object.values(item).map(Number)[1]);
        this.effortData.push(Object.values(item).map(Number)[2]);
      });
    });
  }
  loadInsight(): void {
    this.backend.getInsight().subscribe((response) => {
      this.response = JSON.parse(response).choices[0].message.content;
    });
  }

  addData(): void {
    const newData = { id: '2', name: 'example2', value: '200' };
    this.backend.addData(newData).subscribe(() => {
      this.loadData(); // Reload data after adding
    });
  }

  public rangeGraph: {
    data: Partial<PlotlyJS.ScatterData>[];
    layout: Partial<PlotlyJS.Layout>;
  } = {
    data: [
      {
        x: this.xData,
        y: this.rangeData,
        type: 'scatter',
        mode: 'lines+markers',
        marker: { color: 'blue' },
      },
    ],
    layout: {
      yaxis: {
        range: [0, 180],
      },
      title: 'Live Angle Reading',
    },
  };

  public effortGraph: {
    data: Partial<PlotlyJS.ScatterData>[];
    layout: Partial<PlotlyJS.Layout>;
  } = {
    data: [
      {
        x: this.xData,
        y: this.effortData,
        type: 'scatter',
        mode: 'lines+markers',
        marker: { color: 'blue' },
      },
    ],
    layout: {
      yaxis: {
        range: [0, 180],
      },
      title: 'Effort Reading',
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
      // const newX = this.count++;
      // const newY = Math.floor(Math.random() * 10); // Generate random y value
      // // Add new points to x and y
      // const xData = (this.rangeGraph.data[0] as PlotlyJS.ScatterData)
      //   .x as number[];
      // const yData = (this.rangeGraph.data[0] as PlotlyJS.ScatterData)
      //   .y as number[];
      // xData.push(newX);
      // yData.push(newY);
      // // Update range to make the graph scroll to the left
      // if (newX > this.windowSize) {
      //   this.rangeGraph.layout.xaxis!.range = [newX - this.windowSize, newX];
      // }
      // const xData2 = (this.effortGraph.data[0] as PlotlyJS.ScatterData)
      //   .x as number[];
      // const yData2 = (this.effortGraph.data[0] as PlotlyJS.ScatterData)
      //   .y as number[];
      // xData2.push(newX);
      // yData2.push(newY * 5.4);
      // // Update range to make the graph scroll to the left
      // if (newX > this.windowSize) {
      //   this.effortGraph.layout.xaxis!.range = [newX - this.windowSize, newX];
      // }
      // Re-plot the graphs
      const rangeElement = document.getElementById('rangehistory');
      const effortElement = document.getElementById('efforthistory');
      if (rangeElement && effortElement) {
        PlotlyJS.newPlot(
          'rangehistory',
          this.rangeGraph.data,
          this.rangeGraph.layout
        );
        PlotlyJS.newPlot(
          'efforthistory',
          this.effortGraph.data,
          this.effortGraph.layout
        );
      }
    }, 1000); // Update every second
  }
}
