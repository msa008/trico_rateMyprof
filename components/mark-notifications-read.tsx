"use client";
import { useState } from "react";
import { markNotificationsReadAction } from "@/app/actions";
import { Button } from "./ui/button";

export function MarkNotificationsRead(){const[done,setDone]=useState(false);return <Button size="sm" variant="secondary" disabled={done} onClick={async()=>{const result=await markNotificationsReadAction();if(result.ok)setDone(true)}}>{done?"Marked as read":"Mark all as read"}</Button>}
