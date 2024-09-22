import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SerialService } from './serial.service';
import { HeaderComponent } from './header/header.component';
import { CommonModule } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { NowComponent } from './now/now.component';
import { HistoryComponent } from './history/history.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    CommonModule,
    MatToolbar,
    MatTabsModule,
    NowComponent,
    HistoryComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private serialService: SerialService;
  isConnected: boolean = false;

  constructor(serialService: SerialService) {
    this.serialService = serialService;

    this.serialService.isConnected$.subscribe((isConnected: boolean) => {
      this.isConnected = isConnected;
    });
  }
}
