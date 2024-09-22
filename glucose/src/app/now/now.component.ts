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

  private maxRangeTimer: number = 0; // Keeps track of how long since max value was reached
  private rangeDecayRate: number = 0.1; // Decay rate for the range over time
  private lastAngle: number | null = null;
  private lastRepTime: number | null = null;
  private repThresholdLow = 10; // Near 0 degrees (arm down)
  private repThresholdHigh = 80; // Near 90 degrees (arm bent)
  private setTimeout = 10000; // 10 seconds without a rep = new set
  private fatigue: number = 0; // Track fatigue directly
  private fatigueDecayRate: number = 0.01; // How quickly fatigue decays over time
  private fatigueEffortThreshold: number = 70; // Threshold above which fatigue increases significantly
  private fatigueIncreaseRate: number = 0.05; // Base rate for increasing fatigue
  repCounted: any;

  constructor(private serialService: SerialService) {
    this.serial = serialService;
    this.serial.data$.subscribe((data) => {
      const newX = this.count++;

      const xData = (this.angleGraph.data[0] as PlotlyJS.ScatterData)
        .x as number[];
      const yData = (this.angleGraph.data[0] as PlotlyJS.ScatterData)
        .y as number[];

      xData.push(newX);
      yData.push(data[0]);

      this.trackRepsAndSets(data[0], Date.now());
      this.calculateEffort(data[0], Date.now());

      // Check if current value is the new max
      if (this.rangeGraph.data[0].value < data[0]) {
        this.rangeGraph.data[0].value = data[0];
        this.maxRangeTimer = 0; // Reset the timer when the max is updated
      } else {
        // Increment the timer if the max isn't reached
        this.maxRangeTimer++;
      }

      // Decrease the range if the max hasn't been reached for a while
      if (this.maxRangeTimer > 20) {
        // Arbitrary threshold, adjust as needed
        this.rangeGraph.data[0].value -= this.rangeDecayRate;
        if (this.rangeGraph.data[0].value < 0) {
          this.rangeGraph.data[0].value = 0; // Prevent going below zero
        }
      }

      // Update range to make the graph scroll to the left
      if (newX > this.windowSize) {
        this.angleGraph.layout.xaxis!.range = [newX - this.windowSize, newX];
      }

      if (xData.length >= 2) {
        const effortChange = Math.abs(
          yData[yData.length - 1] - yData[yData.length - 2]
        );

        if (effortChange > 0) {
          // Increase fatigue based on effort change, faster for larger changes
          const effortFactor = effortChange / 100; // Normalize effort change
          this.fatigue += this.fatigueIncreaseRate * effortFactor;

          // If effort is high, increase fatigue more significantly
          if (yData[yData.length - 1] > this.fatigueEffortThreshold) {
            this.fatigue += this.fatigueIncreaseRate * 2 * effortFactor; // Increase faster for high effort
          }
        } else {
          // Decay fatigue slowly if no significant effort is being exerted
          this.fatigue -= this.fatigueDecayRate;
          if (this.fatigue < 0) {
            this.fatigue = 0; // Ensure fatigue doesn't go below zero
          }
        }

        // Update the fatigue graph
        this.fatigueGraph.data[0].value = this.fatigue;
      }
    });
  }

  trackRepsAndSets(currentAngle: number, currentTime: number) {
    // Track reps based on angle change
    if (currentAngle < this.repThresholdLow) {
      this.lastAngle = currentAngle;
    }
    if (this.lastAngle === null) {
      return;
    }

    // Flag to indicate if a rep has been counted in the current cycle
    if (currentAngle >= this.repThresholdHigh) {
      // Rep is counted only if it hasn't been counted already in this cycle
      if (!this.repCounted) {
        this.reps++;
        this.lastRepTime = currentTime;
        this.lastAngle = null;
        this.repCounted = true; // Set the flag to true after counting a rep
      }
    } else if (currentAngle < this.repThresholdLow) {
      // Reset rep counting when angle goes below low threshold
      this.repCounted = false;
    }

    // Check if enough time has passed without a rep to count as a set
    if (
      this.lastRepTime !== null &&
      currentTime - this.lastRepTime > this.setTimeout &&
      this.reps > 0
    ) {
      this.sets++;
      this.reps = 0; // Reset reps for the next set
    }
  }

  private lastEffortTime: number | null = null;
  private effortScale: number = 0.1; // Scale factor for effort calculation

  calculateEffort(currentAngle: number, currentTime: number) {
    // Ensure we have a previous angle and time to compare against
    if (this.lastAngle !== null && this.lastEffortTime !== null) {
      const angleDiff = Math.abs(currentAngle - this.lastAngle);
      const timeDiff = (currentTime - this.lastEffortTime) / 1000; // Convert to seconds
      const effort = (angleDiff / timeDiff) * this.effortScale;

      // Add effort to the graph
      const xDataEffort = (this.effortGraph.data[0] as PlotlyJS.ScatterData)
        .x as number[];
      const yDataEffort = (this.effortGraph.data[0] as PlotlyJS.ScatterData)
        .y as number[];

      const newEffortX = this.count++;
      xDataEffort.push(newEffortX);
      yDataEffort.push(effort);

      // Update graph range to scroll left if needed
      if (newEffortX > this.windowSize) {
        this.effortGraph.layout.xaxis!.range = [
          newEffortX - this.windowSize,
          newEffortX,
        ];
      }
    }

    // Update last known angle and time for the next calculation
    this.lastAngle = currentAngle;
    this.lastEffortTime = currentTime;
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
        value: 0,
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
        range: [0, 5 * 25], // Initial range
      },
      yaxis: {
        range: [0, 180],
      },
      title: 'Heartrate Reading',
    },
  };

  private intervalId: any;
  private windowSize = 20; // The x-axis window size to display
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
      if (newX > this.windowSize * 25) {
        this.bpmGraph.layout.xaxis!.range = [newX - this.windowSize * 25, newX];
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
    }, 500); // Update every second
  }
}
