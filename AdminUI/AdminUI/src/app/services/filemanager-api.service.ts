import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FILEMANAGER_WriteFile } from '../models/filemanager.model';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilemanagerApiService {

  private setHeader = {
    token: localStorage.getItem('lva_token')
  }

  constructor(
    public http: HttpClient,
  ) { }

  writeFile(data: any): Observable<any>{
    return this.http.post(environment.filemanagerurl + 'new', data, { headers: this.setHeader });
  }
  cancelWriteFile(data: any): Observable<any>{
    return this.http.post(environment.filemanagerurl + 'delete', data, { headers: this.setHeader });
  }
}
