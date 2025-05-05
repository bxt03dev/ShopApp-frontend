import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsDate, IsNumber, ArrayMinSize
} from 'class-validator'

export class OrderDTO{
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  note: string;
  address: string;
  totalMoney: number;
  paymentMethod: string;
  shippingMethod: string;
  couponCode: string;
  cartItems: { quantity: number; productId: number }[];

  constructor(data: any) {
    this.userId = data.userId;
    this.fullName = data.fullName;
    this.email = data.email;
    this.phoneNumber = data.phoneNumber;
    this.note = data.note;
    this.address = data.address;
    this.totalMoney = data.totalMoney;
    this.paymentMethod = data.paymentMethod;
    this.shippingMethod = data.shippingMethod;
    this.couponCode = data.couponCode;
    this.cartItems = data.cartItems;
  }
}
