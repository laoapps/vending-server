import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dice'
})
export class DicePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
