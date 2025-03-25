import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [MatProgressBarModule, CommonModule],
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.scss'
})
export class LoadingBarComponent {

  @Input() isLoading: boolean;
}
