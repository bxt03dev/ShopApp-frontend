import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {environment} from "../common/environment";
import {HttpClient} from "@angular/common/http";
import {ApiResponse} from "../dto/response/api.response";

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiGetRoles = `${environment.apiBaseUrl}/roles`

  constructor(private http: HttpClient) {
  }

  getRoles(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any[]>>(this.apiGetRoles)
  }
}
