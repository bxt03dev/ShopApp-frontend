import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HomeComponent } from './component/home/home.component';
import { HeaderComponent } from './component/header/header.component';
import { FooterComponent } from './component/footer/footer.component';
import { DetailProductComponent } from './component/detail-product/detail-product.component';
import { OrderComponent } from './component/order/order.component';
import { OrderDetailComponent } from './component/order-detail/order-detail.component';
import { LoginComponent } from './component/login/login.component';
import { RegisterComponent } from './component/register/register.component';
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { TokenInterceptor } from "./interceptor/token.interceptor";
import { LogInterceptor } from "./interceptor/log.interceptor";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app-routing.module';
import { SearchComponent } from './component/search/search.component';
import { StoreComponent } from './component/store/store.component';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AdminComponent } from './component/admin/admin.component';
import { OrderAdminComponent } from './component/admin/order/order.admin.component';
import { ProductAdminComponent } from './component/admin/product/product-admin/product.admin.component';
import { ProductDetailAdminComponent } from './component/admin/product/product-detail-admin/product-detail.admin.component';
import { ProductCreateAdminComponent } from './component/admin/product/product-create-admin/product-create.admin.component';
import { OrderDetailAdminComponent } from './component/admin/order/order-detail-admin/order.detail.admin.component';
import { CustomToastService } from './service/custom-toast.service';
import { ToastModule } from './service/toast.module';

@NgModule({
  declarations: [
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    DetailProductComponent,
    OrderComponent,
    OrderDetailComponent,
    LoginComponent,
    RegisterComponent,
    AppComponent,
    SearchComponent,
    StoreComponent,
    AdminComponent,
    OrderAdminComponent,
    ProductAdminComponent,
    ProductDetailAdminComponent,
    ProductCreateAdminComponent,
    OrderDetailAdminComponent
  ],
  imports: [
    ReactiveFormsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot([]),
    CommonModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ToastModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      enableHtml: true,
      tapToDismiss: true,
      newestOnTop: true,
      extendedTimeOut: 1000,
      easeTime: 300,
      progressAnimation: 'decreasing'
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LogInterceptor,
      multi: true
    },
    CustomToastService
  ],
  bootstrap: [
    // DetailProductComponent
    // OrderComponent
    // OrderDetailComponent
    // LoginComponent
    // HomeComponent
    //RegisterComponent
    AppComponent
  ]
})
export class AppModule { }
