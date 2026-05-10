import { Suspense } from "react";
import WithdrawList from "./WithdrawList";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WithdrawList />
    </Suspense>
  );
}