import { Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExchangeSites, ExchangeTimeData } from '../../../models';
import { CommonModule } from '@angular/common';
import { Observable, map, pipe } from 'rxjs';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-time-display',
  standalone: true,
  imports: [MatTooltipModule, CommonModule],
  templateUrl: './time-display.component.html',
  styleUrl: './time-display.component.scss'
})
export class TimeDisplayComponent {

  @Input() timeData?: Observable<ExchangeTimeData>;
  @Input() selectedSite: ExchangeSites = ExchangeSites.BINANCE;

  constructor(private http: HttpClient) {}
}
