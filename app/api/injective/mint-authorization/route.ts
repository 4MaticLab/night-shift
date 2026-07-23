import { NextResponse } from "next/server";
import { createInjectiveMintAuthorizationHandler, getInjectiveMintStatus } from "@/src/lib/injective/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getInjectiveMintStatus());
}

export const POST = createInjectiveMintAuthorizationHandler();
