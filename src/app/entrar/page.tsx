import { Suspense } from "react";

import { isRegistrationEnabled } from "@/lib/registration";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm registrationEnabled={isRegistrationEnabled()} />
    </Suspense>
  );
}
