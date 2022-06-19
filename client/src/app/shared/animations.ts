import { animate, state, style, transition, trigger } from '@angular/animations';

export let fade = trigger('fade', [
  state('void', style({ opacity: 0 })),
  transition('void <=> *', [    // alias -> :enter, :leave
    animate(3000),
  ]),
]);
