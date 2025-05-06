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

export const routes: Routes = [
  {path: '', component: StoreComponent},
  {path: 'home', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'products/:id', component: DetailProductComponent},
  {path: 'orders', component: OrderComponent},
  {path: 'orders/:id', component: OrderDetailComponent},
  {path: 'search', component: SearchComponent},
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule{

}
