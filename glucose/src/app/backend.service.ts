import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface DataEntry {
  id: string;
  name: string;
  value: string;
}

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private apiUrl = 'http://localhost:5000/data'; // Flask API URL
  private tuneUrl = 'http://localhost:5000/insight';

  constructor(private http: HttpClient) {}

  // Method to get data from the CSV
  getData(): Observable<DataEntry[]> {
    return this.http.get<DataEntry[]>(this.apiUrl);
  }

  getInsight(): Observable<any> {
    return this.http.get(this.tuneUrl);
  }

  // Method to add new data to the CSV
  addData(data: DataEntry): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.apiUrl, data, { headers });
  }
}
