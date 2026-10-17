import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { ReviewEditor } from "@/components/review-editor";
import { getOwnedReview } from "@/lib/data";

export default async function EditReviewPage({params}:{params:Promise<{id:string}>}){const{id}=await params;const review=await getOwnedReview(id);if(!review)notFound();return <div className="container max-w-3xl py-12"><PageHeading eyebrow="Private to this browser" title="Edit your review" description={`${review.course_code} · ${review.professor_name} · ${review.semester} ${review.year}`}/><ReviewEditor review={review}/></div>}
