import { NextResponse } from "next/server";
import { getUnreadNotificationCount } from "@/lib/data";

export async function GET(){
  return NextResponse.json({unread:await getUnreadNotificationCount()},{headers:{"Cache-Control":"private, no-store"}});
}
