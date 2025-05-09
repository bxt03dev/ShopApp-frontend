import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomToastService } from './custom-toast.service';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    CustomToastService
  ]
})
export class ToastModule { } 