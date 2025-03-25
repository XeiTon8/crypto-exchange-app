import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExchangeSites, ExchangeTimeData} from '../../models/index';



export function getServerTime(http: HttpClient, selectedSite: ExchangeSites): Observable<ExchangeTimeData> {
    switch (selectedSite) {
        case ExchangeSites.BINANCE: { 
            return http.get<any>("https://api.binance.com/api/v1/time").pipe(
            map(res => ({
                serverTime: new Date(res.serverTime),
                localTime: new Date(),
            }))
            )
        }
    
        case ExchangeSites.BYBIT: {
            return http.get<any>("https://api.bybit.com/v5/market/time").pipe(
            map(res => ({
            serverTime: new Date(parseInt(res.result.timeSecond) * 1000),
            localTime: new Date(),
            }))
            )
        }
    
        case ExchangeSites.OKX: {
            return http.get<any>("https://www.okx.com/api/v5/public/time").pipe(
            map(res => ({
                serverTime: new Date(parseInt(res.data[0].ts)),
                localTime: new Date(),
            }))
            )
        }
    
        default: 
        return http.get<any>("https://api.binance.com/api/v1/time").pipe(
            map(res => ({
            serverTime: new Date(res.serverTime),
            localTime: new Date(),
            }))
        )
    }
}