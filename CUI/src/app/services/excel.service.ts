import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  name = 'This is XLSX TO JSON CONVERTER';
  willDownload = false;
  downloadElement: HTMLAnchorElement;
  data: any;
  constructor() {
  }

  static toExportFileName(excelFileName: string): string {
    return `${excelFileName}_export_${new Date().getTime()}.xlsx`;
  }

  public exportAsExcelFile(json: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = {Sheets: {data: worksheet}, SheetNames: ['data']};
    XLSX.writeFile(workbook, ExcelService.toExportFileName(excelFileName));
  }
  public onFileChange(ev){
    let workBook = null;
    let jsonData = null;
    const reader = new FileReader();
    const file = ev.target.files[0];
    reader.onload = (event) => {
      const data = reader.result;
      workBook = XLSX.read(data, { type: 'binary' });
      jsonData = workBook.SheetNames.reduce((initial, name) => {
        const sheet = workBook.Sheets[name];
        initial[name] = XLSX.utils.sheet_to_json(sheet);
        return initial;
      }, {});
      const dataString = JSON.stringify(jsonData);
      // document.getElementById('output').innerHTML = dataString.slice(0, 300).concat("...");

      // this.setDownload(dataString);
      // console.log('DATA STRING',dataString);
      this.data = JSON.parse(dataString);

    };
    reader.readAsBinaryString(file);
  }

  setDownloadElement(a: HTMLAnchorElement){
    this.downloadElement=a;
  }
  // setDownload(data) {
  //   this.willDownload = true;
  //   setTimeout(() => {
  //     this.downloadElement.setAttribute("href", `data:text/json;charset=utf-8,${encodeURIComponent(data)}`);
  //     this.downloadElement.setAttribute("download", 'xlsxtojson.json');
  //   }, 1000)
  // }
}
