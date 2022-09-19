import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], param: string, search: string): any {
    if (!items) {
      return [];
    }
    if (!search) {
      return items;
    }

    search = search.toLocaleLowerCase();

    return items.filter(item => {
      return item[param].toLocaleLowerCase().includes(search);
    });
  }
}
