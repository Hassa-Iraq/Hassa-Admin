
export const stats = [
  {
    title: "Delivered orders",
    value: 24,
    color: "border-[#00C49A]",
    bg: "bg-[#00C49A1A]",
    icon: <img src="/images/streamline.png" className="w-6 h-6" alt="Delivered" />
  },
  {
    title: "Cancelled orders",
    value: 8,
    color: "border-[#FF6B6B]",
    bg: "bg-[#FF6B6B1A]",
    icon: <img src="/images/canel.png" className="w-6 h-6" alt="Cancelled" />
  },
  {
    title: "Refunded orders",
    value: 0,
    color: "border-[#FF9F43]",
    bg: "bg-[#FF9F431A]",
    icon: <img src="/images/refund.png" className="w-6 h-6" alt="Refunded" />
  },
  {
    title: "Payment failed orders",
    value: 3,
    color: "border-[#FF6B6B]",
    bg: "bg-pink-50",
    icon: <img src="/images/paymentFailed.png" className="w-6 h-6" alt="Payment Failed" />
  },
  {
      title: "Unassigned orders",
      value: 0,
    color: "border-[#FF9F43]",
    bg: "bg-yellow-50",
    icon: <img src="/images/assigned.png" className="w-6 h-6" alt="Unassigned" />
  },
  {
      title: "Accepted by Rider",
      value: 0,
    color: "border-[#00C49A]",
    bg: "bg-teal-50",
    icon: <img src="/images/rider.png" className="w-6 h-6" alt="Accepted" />
  },
  {
      title: "Cooking in Restaurants",
      value: 0,
    color: "border-violet-400",
    bg: "bg-[#00C49A1A]",
    icon: <img src="/images/box-return.png" className="w-6 h-6" alt="Cooking" />
  },
  {
      title: "Picked up by Rider",
      value: 0,
    color: "border-[#00C49A]",
    bg: "bg-[#00C49A1A]",
    icon: <img src="/images/pickedup.png" className="w-6 h-6" alt="Picked up" />
  }
];



export const revenue = [3, 6, 4, 8, 10, 7, 9, 11, 10, 12, 9, 13];

export const users = [
  { label: "Customers", value: 35 },
  { label: "Restaurants", value: 25 },
  { label: "Delivery Boy", value: 40 },
];

export const orders = [
  { id: "#10421", name: "Ali", status: "Delivered", amount: "$24" },
  { id: "#10422", name: "Ahmed", status: "Cancelled", amount: "$18" },
  { id: "#10423", name: "Sara", status: "Pending", amount: "$32" },
];
