import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SerialService } from './serial.service';
import { HeaderComponent } from './header/header.component';
import * as d3 from 'd3';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  //@ViewChild('chart') private chartContainer!: ElementRef;

  isConnected: boolean = false;
  angleData: number[] = [];
  currentAngle: number | null = null;


  constructor(
    private serialService: SerialService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    console.log('AppComponent constructor');
    this.serialService.isConnected$.subscribe((isConnected) => {
      console.log('Connection status changed:', isConnected);
      this.ngZone.runOutsideAngular(() =>{
        this.isConnected = isConnected;
        //this.cdr.detectChanges();
      });
      //this.isConnected = isConnected;
      //this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    console.log('ngOnInit');
  }

  onDataProcessed(data: number) {
    console.log('Data received in AppComponent:', data);
    this.ngZone.run(() => {
      this.currentAngle = data;
      this.angleData.push(data);
      if (this.angleData.length > 10) {  // Keep only the last 10 readings
        this.angleData.shift();
      }
      console.log('Current angle data:', this.angleData);
      this.cdr.detectChanges();
    });
  }
}