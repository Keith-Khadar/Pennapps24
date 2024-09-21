import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SerialService } from './serial.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private serialService: SerialService;

  constructor(serialService: SerialService) {
    this.serialService = serialService;
    this.serialService.data$.subscribe((data: number) => {
      this.ProcessData(data);
    });
  }

  Connect() {
    const serialOptions = {
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
    };

    this.serialService.open(serialOptions);
  }

  ProcessData(data: number) {
    console.log(data);
  }
}
