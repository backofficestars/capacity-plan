"use client";

import Image from "next/image";
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
          <Image
            src="/backofficestars.svg"
            alt="Back Office Stars"
            width={180}
            height={62}
            className="mx-auto mb-4"
            priority
          />
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
