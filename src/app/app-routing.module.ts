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

export const routes: Routes = [
  {path: '', component: StoreComponent},
  {path: 'home', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'admin', component: AdminComponent, canActivate: [AdminGuard]},
  {path: 'admin/order', component: OrderAdminComponent, canActivate: [AdminGuard]},
  {path: 'register', component: RegisterComponent},
  {path: 'products/:id', component: DetailProductComponent},
  {path: 'orders', component: OrderComponent, canActivate: [AuthGuard]},
  {path: 'orders/:id', component: OrderDetailComponent, canActivate: [AuthGuard]},
  {path: 'search', component: SearchComponent},
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule{

}
