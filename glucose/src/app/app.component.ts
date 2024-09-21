import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SerialService } from './serial.service';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  serialService: SerialService;
  isConnected: boolean = false;

  constructor(serialService: SerialService){
    this.serialService = serialService;
    this.serialService.isConnected$.subscribe((isConnected) => {
      this.isConnected = isConnected
    })
  }
}
