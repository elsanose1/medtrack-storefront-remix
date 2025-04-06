import { Outlet } from "@remix-run/react";
import AuthLayout from "~/components/Layout/AuthLayout";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "MedTrack - Patient Portal" }];
};

export default function AppLayout() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
