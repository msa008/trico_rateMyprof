import{notFound}from"next/navigation";
import{colleges}from"@/lib/config";
import{getCollegeData}from"@/lib/data";
import{CollegeDirectory}from"@/components/college-directory";
import{DemoBanner}from"@/components/demo-banner";

export default async function CollegePage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const meta=colleges.find(college=>college.slug===slug);const data=await getCollegeData(slug);if(!meta||!data)notFound();return <><DemoBanner show={data.demo}/><CollegeDirectory college={meta} departments={data.departments} professors={data.professors} courses={data.courses}/></>}
