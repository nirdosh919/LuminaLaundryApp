import { Redirect } from "expo-router";
import { dashboardForRole } from "@/lib/auth";
import { useRoleAccess } from "@/providers/role-access-provider";

export default function IndexScreen() {
  const { role } = useRoleAccess();
  return <Redirect href={role ? dashboardForRole(role) as never : "/role-login"} />;
}
