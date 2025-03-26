import { Component, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, map, Observable, of, finalize, tap, BehaviorSubject, Subject, takeUntil } from 'rxjs';

// API
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// UI
import {CdkVirtualScrollViewport, ScrollingModule} from '@angular/cdk/scrolling';

import {MatTableModule} from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models
import { ExchangeSites, Instrument, ExchangeTimeData } from '../models';
import { TimeDisplayComponent } from "./components/time-display/time-display.component";

// Utils
import { getServerTime } from './utils/api.utils';
import { SearchBarComponent } from "./components/search-bar/search-bar.component";
import { LoadingBarComponent } from './components/loading-bar/loading-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, ScrollingModule, CommonModule, FormsModule,
    MatTableModule, MatTooltipModule,
    TimeDisplayComponent,
    SearchBarComponent,
    LoadingBarComponent,
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'exchange-app';

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  // viewport for scrolling
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;

  public sites = ExchangeSites;
  public selectedSite: ExchangeSites = ExchangeSites.BINANCE;
  public siteUrl: string = "https://api.binance.com/api/v3/ticker/24hr"; // Default URL for fetching from Binance
  public isLoading = signal(false)
  
  // Time
  public timeData$: Observable<ExchangeTimeData>

  // Table
  public instruments$: BehaviorSubject<Instrument[]> = new BehaviorSubject<Instrument[]>([]);
  public filteredData$: Observable<Instrument[]> = this.instruments$.asObservable();

  public displayedColumns: string[] = ['symbol', 'price', 'volume', 'percentageChange', 'highestPrice', 'lowestPrice']
  public sortAsc: boolean | null = null;

  totalItems = 0; // 0 by default until fetching's done, +100 per fetch

  public sortPrice() {
    const data = this.instruments$.getValue();

    data.sort((a, b) => {
      if (this.sortAsc) {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });
  
    this.instruments$.next([...data]);
  
    this.sortAsc = !this.sortAsc;
  }

  // Search
  public searchValue: string = "";

  public handleSearch(searchValue: string) {
    this.searchValue = searchValue;
    this.filteredData$ = this.instruments$.pipe(
      map(items => {
        if (!this.searchValue) return items;
        return items.filter(item => item.symbol.toLowerCase().includes(this.searchValue.toLowerCase()))
      })
    )
  }

  // Updating data
  public selectSite = (site: ExchangeSites) => {
    if (this.isLoading()) return;

    this.selectedSite = site;
    
    // Reset instruments before fetching
    this.searchValue = "";
    this.instruments$.next([])
    this.totalItems = 0;
    this.viewport.scrollToIndex(0); // move cursor to top of the table

    this.getUrl();
    this.timeData$ = getServerTime(this.http, this.selectedSite);
    this.fetchData(this.siteUrl);

  }

  public getUrl () {
    switch (this.selectedSite) {
      case ExchangeSites.BINANCE: { this.siteUrl = "https://api.binance.com/api/v3/ticker/24hr"; break; }

      case ExchangeSites.BYBIT: { this.siteUrl = "https://api.bybit.com/v5/market/tickers?category=spot"; break; }

      case ExchangeSites.OKX: { this.siteUrl = "https://www.okx.com/api/v5/market/tickers?instType=SPOT"; break; }

      default: { this.siteUrl = "https://api.binance.com/api/v3/ticker/24hr" }
    }
  }

  public fetchData (url: string): void {
    if (this.isLoading()) return;
    
    this.isLoading.set(true);
  
    this.http.get<any[]>(this.siteUrl).pipe(
        takeUntil(this.destroy$),
          map((data: any) => this.transformData(data)),
          tap(newData => {
            if (url === this.siteUrl) {
              const currentData = this.instruments$.getValue();
              this.instruments$.next([...currentData, ...newData]) // Keep lazy loading and add more instruments to the array
            } else {
              this.instruments$.next(newData); // Start loading from the beginning if we select another site
            }

            this.totalItems += newData.length; // Increase total items' number for lazy loading
            
          }),
          catchError(err => {
            alert("Error while fetching data")
            console.error(err);
            return of([])
          }),
          finalize(() => {
            this.isLoading.set(false)
          }),
        ).subscribe()
  }

  // Creating array for rendering from different APIs
  public transformData (data: any): Instrument[] {
    switch (this.selectedSite) {
      case "Binance": {
        return data.slice(0, 100).map((item: any) => ({
          symbol: item.symbol,
          price: parseFloat(item.openPrice).toFixed(4),
          high: parseFloat(item.highPrice),
          low: parseFloat(item.lowPrice),
          volume: this.formatVolume(item.volume),
          change: parseFloat(item.priceChangePercent),
    
        }))
      }

      case 'Bybit': {
        return data.result.list.slice(0, 100).map((item: any) => ({
          symbol: item.symbol,
          price: parseFloat(item.lastPrice).toFixed(4),
          high: parseFloat(item.highPrice24h),
          low: parseFloat(item.lowPrice24h),
          volume: this.formatVolume(item.volume24h),
          change: parseFloat(item.price24hPcnt),
        }))
      }

      case 'OKX': {
        return data.data.slice(0, 100).map((item: any) => ({
          symbol: item.instId,
          price: parseFloat(item.last).toFixed(4),
          high: parseFloat(item.high24h),
          low: parseFloat(item.low24h),
          volume: this.formatVolume(item.vol24h),
          change:((item.last - item.open24h) / item.open24h) * 100
        }))
      }

      default: 
      return data.slice(0, 100).map((item: any) => ({
        symbol: item.symbol,
        price: parseFloat(item.openPrice).toFixed(4),
        high: parseFloat(item.highPrice),
        low: parseFloat(item.lowPrice),
        volume: this.formatVolume(item.volume),
        change: parseFloat(item.priceChangePercent),
  
      }))
    }
  }

  formatVolume(volume: number): string {
    if (volume >= 1000000) return (volume / 1_000_000).toFixed(1) + 'M';
    if (volume >= 1000) return (volume / 1_000).toFixed(1) + 'K';
    return String(volume);
  }

  // Scroll + lazy loading
  onScroll(index: number) {
    const threshold = 10  // Load more data when there's 10 or less instruments left

    if (this.totalItems > 0 && this.totalItems - index <= threshold) { 
      this.fetchData(this.siteUrl) }
  }

  ngOnInit(): void {
    this.fetchData(this.siteUrl)
    this.timeData$ = getServerTime(this.http, this.selectedSite).pipe(takeUntil(this.destroy$))
  }

  ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
  }
}
