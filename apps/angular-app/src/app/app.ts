import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly count = signal(0);

  increment(): void {
    this.count.update((c) => c + 1);
  }
}
