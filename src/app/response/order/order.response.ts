import { OrderDetail } from '../../model/order.detail'

export interface OrderResponse {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  note: string;
  orderDate: Date;
  status: string;
  totalMoney: number;
  shippingMethod: string;
  shippingAddress: string;
  shippingDate: Date;
  paymentMethod: string;
  warrantyCode?: string;
  orderDetails: OrderDetail[];
}

