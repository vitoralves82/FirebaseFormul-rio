import { type NextRequest, NextResponse } from "next/server";

export const createClient = (request: NextRequest) => {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
};
