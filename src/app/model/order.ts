import { OrderDetail } from './order.detail'

export interface Order {
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
  trackingNumber: string;
  paymentMethod: string;
  active: boolean;
  warrantyCode?: string;
  orderDetails: OrderDetail[];
}
