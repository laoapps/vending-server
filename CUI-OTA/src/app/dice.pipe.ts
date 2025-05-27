import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dice',
    standalone: false
})
export class DicePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
