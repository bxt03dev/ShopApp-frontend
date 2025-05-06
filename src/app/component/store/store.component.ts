import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})
export class StoreComponent implements OnInit {
  @ViewChild('productCard') productCard!: ElementRef;

  constructor() { }

  ngOnInit(): void {
  }

  scrollLeft(): void {
    this.productCard.nativeElement.scrollBy({
      left: -400,
      behavior: 'smooth'
    });
  }

  scrollRight(): void {
    this.productCard.nativeElement.scrollBy({
      left: 400,
      behavior: 'smooth'
    });
  }
}
