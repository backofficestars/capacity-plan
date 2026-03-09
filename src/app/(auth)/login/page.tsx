"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            BOS
          </div>
          <CardTitle className="text-xl">Capacity Planner</CardTitle>
          <CardDescription>
            Sign in with your Google account to access the BOS capacity planning
            system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Sign in with Google
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Access is restricted to authorized BOS team members.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
