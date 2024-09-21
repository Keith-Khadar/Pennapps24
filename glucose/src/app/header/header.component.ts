import { Component } from '@angular/core';
import { SerialService } from '../serial.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
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
