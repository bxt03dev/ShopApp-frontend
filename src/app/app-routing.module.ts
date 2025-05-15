import {HomeComponent} from "./component/home/home.component";
import {RouterModule, Routes} from "@angular/router";
import {LoginComponent} from "./component/login/login.component";
import {RegisterComponent} from "./component/register/register.component";
import {DetailProductComponent} from "./component/detail-product/detail-product.component";
import {OrderComponent} from "./component/order/order.component";
import {OrderDetailComponent} from "./component/order-detail/order-detail.component";
import {NgModule} from "@angular/core";
import { SearchComponent } from './component/search/search.component';
import { StoreComponent } from './component/store/store.component';
import { AdminComponent } from "./component/admin/admin.component";
import { AuthGuard } from "./guard/auth.guard";
import { AdminGuard } from "./guard/admin.guard";
import {OrderAdminComponent} from "./component/admin/order/order.admin.component";
import {ProductAdminComponent} from "./component/admin/product/product-admin/product.admin.component";
import {ProductDetailAdminComponent} from "./component/admin/product/product-detail-admin/product-detail.admin.component";
import {ProductCreateAdminComponent} from "./component/admin/product/product-create-admin/product-create.admin.component";
import {OrderDetailAdminComponent} from "./component/admin/order/order-detail-admin/order.detail.admin.component";
import { PaymentComponent } from './component/payment/payment.component';
import { PaymentResultComponent } from './component/payment-result/payment-result.component';
import { OrderHistoryComponent } from './component/order-history/order-history.component';

export const routes: Routes = [
  {path: '', component: StoreComponent},
  {path: 'home', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AdminGuard],
    children: [
      {path: '', redirectTo: 'order', pathMatch: 'full'},
      {path: 'order', component: OrderAdminComponent},
      {path: 'orders/:id', component: OrderDetailAdminComponent},
      {path: 'products', component: ProductAdminComponent},
      {path: 'products/create', component: ProductCreateAdminComponent},
      {path: 'products/:id', component: ProductDetailAdminComponent}
    ]
  },
  {path: 'register', component: RegisterComponent},
  {path: 'products/:id', component: DetailProductComponent},
  {path: 'orders', component: OrderComponent, canActivate: [AuthGuard]},
  {path: 'orders/:id', component: OrderDetailComponent, canActivate: [AuthGuard]},
  {path: 'search', component: SearchComponent},
  { path: 'checkout/:id', component: PaymentComponent, canActivate: [AuthGuard] },
  { path: 'payment-result', component: PaymentResultComponent, canActivate: [AuthGuard] },
  { path: 'order-history', component: OrderHistoryComponent, canActivate: [AuthGuard] },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule{

}
