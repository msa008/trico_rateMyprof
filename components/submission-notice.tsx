"use client";
import {useSearchParams} from "next/navigation";
import {SubmissionCelebration} from "./submission-celebration";

export function SubmissionNotice(){const submitted=useSearchParams().get("submitted");if(submitted!=="review"&&submitted!=="question")return null;return <div className="container pt-8"><SubmissionCelebration kind={submitted}/></div>}
