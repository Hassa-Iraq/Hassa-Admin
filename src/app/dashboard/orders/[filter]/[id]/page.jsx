'use client';

import { useParams, useRouter } from 'next/navigation';
import Topbar from '@/app/components/Topbar';
import {
  Utensils,
  Printer,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  // 🔴 MOCK DATA (later API se replace karna)
  const order = {
    id,
    date: "16 Jan 2026, 03:40 pm",
    restaurant: "Rose Restaurant",
    customer: "Rida Ali",
    ordersCount: 21,
    phone: "+1**********",
    email: "R*******@example.com",
    status: "Delivered",
    paymentStatus: "Paid",
    paymentMethod: "COD",
    reference: "1234",
    cutlery: "No",
    total: "$123.34",
  };

  const items = [
    {
      name: "Beef Stroganoff",
      size: "Medium",
      qty: 1,
      addons: "",
      price: "$123.34",
      img: "https://picsum.photos/60"
    }
  ];

  return (
    <>
      <Topbar
        title="Order Details"
        subtitle="Manage all active and scheduled orders"
        rightContent={
          <button className="bg-[#7C3AED] text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-[#6D28D9]">
            + New Order
          </button>
        }
      />

      <div className="pt-36 px-6 pb-10">
        <div className="grid grid-cols-12 gap-6">

          {/* ================= LEFT BIG ================= */}
          <div className="col-span-8 bg-white rounded-xl p-6">

            {/* TOP */}
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Order ID # {order.id}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Placed Date : {order.date}
                </p>

                <p className="mt-3 text-sm flex items-center gap-2">
                  <Utensils size={16} className="text-gray-500" />
                  Restaurant :
                  <span className="ml-1 text-purple-600 font-medium">
                    {order.restaurant}
                  </span>
                </p>

                <button className="text-purple-600 text-xs mt-1 underline">
                  Show Location On Map
                </button>
              </div>

              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 h-fit">
                <Printer size={16} />
                Print Invoice
              </button>
            </div>

            {/* ORDER META */}
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
              <p>Order Type : Delivery</p>
              <p>Payment Method : {order.paymentMethod}</p>

              <p>
                Payment Status :
                <span className="text-green-600 font-medium ml-1">
                  {order.paymentStatus}
                </span>
              </p>

              <p>Reference Code : {order.reference}</p>

              <p>
                Status :
                <span className="text-green-600 font-medium ml-1">
                  {order.status}
                </span>
              </p>

              <p>
                Cutlery :
                <span className="bg-red-100 text-red-500 font-medium ml-1 px-2 py-0.5 rounded text-xs">
                  {order.cutlery}
                </span>
              </p>
            </div>

            {/* ITEMS TABLE */}
            <div className="mt-8 rounded-lg overflow-hidden">

              <div className="grid grid-cols-12 bg-purple-50 px-4 py-2 text-xs font-semibold text-gray-600">
                <span className="col-span-1">Sl</span>
                <span className="col-span-5">Item Details</span>
                <span className="col-span-4">Addons</span>
                <span className="col-span-2 text-right">Price</span>
              </div>

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 px-4 py-4 items-center text-sm">

                  <span className="col-span-1 text-gray-500">{i + 1}</span>

                  <div className="col-span-5 flex gap-3 items-center">
                    <img
                      src={item.img}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">Size : {item.size}</p>
                      <p className="text-xs text-gray-500">Qty : {item.qty}</p>
                    </div>
                  </div>

                  <span className="col-span-4 text-gray-300">—</span>

                  <span className="col-span-2 text-right font-semibold">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>

            {/* PRICE BREAKDOWN */}
            <div className="mt-8 w-72 ml-auto text-sm space-y-1">

              <div className="flex justify-between">
                <span className="text-gray-600">Item Price :</span>
                <span>$100.98</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Addon Cost :</span>
                <span>$0.00</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal :</span>
                <span>$100.098</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Discount :</span>
                <span>-$12.98</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Coupon Discount :</span>
                <span>-$0.00</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">VAT/Tax :</span>
                <span>+$10.05</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee :</span>
                <span>+$8.05</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Service Charges :</span>
                <span>+$12.65</span>
              </div>

              <div className="flex justify-between font-semibold pt-2 mt-2">
                <span>Total :</span>
                <span>{order.total}</span>
              </div>
            </div>

          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="col-span-4 space-y-4">

            {/* CUSTOMER */}
            <div className="bg-white rounded-xl p-5">
              <h3 className="font-semibold mb-4">Customer Info</h3>

              <div className="flex gap-3 items-center">
                <img
                  src="https://i.pravatar.cc/100?img=47"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{order.customer}</p>
                  <p className="text-xs text-gray-500">
                    {order.ordersCount} Orders
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-600 mt-4 space-y-2">
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-500" />
                  {order.phone}
                </p>

                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-500" />
                  {order.email}
                </p>
              </div>
            </div>

            {/* DELIVERY INFO */}
            <div className="bg-white  rounded-xl p-5">
              <h3 className="font-semibold mb-4">Delivery Info</h3>

              <div className="text-xs text-gray-600 space-y-1.5">
                <p>Name : {order.customer}</p>
                <p>Contact : +1*********</p>
                <p>House # :</p>
                <p>Road # :</p>
                <p>Floor # :</p>

                <p className="pt-2 flex items-center gap-1">
                  <MapPin size={14} className="text-gray-500" />
                  House no.123, road no.4
                </p>
              </div>
            </div>

            {/* DELIVERY PROOF */}
            <div className="bg-white rounded-xl p-5">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Delivery Proof</h3>
                <button className="bg-[#7C3AED] text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-[#6D28D9]">
                  Add
                </button>
              </div>
            </div>

            {/* RESTAURANT */}
            <div className="bg-white  rounded-xl p-5">
              <h3 className="font-semibold mb-4">Restaurant Info</h3>

              <div className="flex gap-3 items-center">
                <img
                  src="https://picsum.photos/80?random=5"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <p className="font-semibold text-base">{order.restaurant}</p>
                  <p className="text-xs text-gray-500">
                    {order.ordersCount} Orders
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-3 space-y-1.5">
                <p className="flex items-center gap-1">
                  <Phone size={14} />
                  +1**********
                </p>

                <p className="flex items-center gap-1">
                  <MapPin size={14} />
                  House no.123, road no.4
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
