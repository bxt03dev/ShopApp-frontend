import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { DetailProductComponent } from './detail-product/detail-product.component';
import { OrderComponent } from './order/order.component';
import { OrderConfirmComponent } from './order-confirm/order-confirm.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {HttpClientModule} from "@angular/common/http";

@NgModule({
  declarations: [
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    DetailProductComponent,
    OrderComponent,
    OrderConfirmComponent,
    LoginComponent,
    RegisterComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot([]),

  ],
  providers: [],
  bootstrap: [
    // DetailProductComponent
    // OrderComponent
    //OrderConfirmComponent
    //LoginComponent
    //HomeComponent
    RegisterComponent
  ]
})
export class AppModule { }
