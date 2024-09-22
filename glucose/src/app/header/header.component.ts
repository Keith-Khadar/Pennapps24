import { Component, Output, EventEmitter } from '@angular/core';
import { SerialService } from '../serial.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private serialService: SerialService;
  isConnected: boolean = false;

  constructor(serialService: SerialService) {
    this.serialService = serialService;
    this.serialService.data$.subscribe((data: number) => {
      this.ProcessData(data);
    });
    this.serialService.isConnected$.subscribe((isConnected: boolean) => {
      this.isConnected = isConnected;
    });
  }

  toggleConnection() {
    const serialOptions = {
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
    };

    if (!this.isConnected) {
      this.serialService.open(serialOptions);
    } else {
      this.serialService.close();
    }
  }

  ProcessData(data: number) {
    console.log(data);
  }
}
