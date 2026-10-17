import { notFound } from "next/navigation";
import { getDepartmentData } from "@/lib/data";
import { DemoBanner } from "@/components/demo-banner";
import { DepartmentDirectory } from "@/components/department-directory";

export default async function DepartmentPage({params}:{params:Promise<{college:string;code:string}>}) {
  const {college,code}=await params;
  const data=await getDepartmentData(college,code);
  if(!data)notFound();
  return <><DemoBanner show={data.demo}/><DepartmentDirectory college={data.college} department={data.department} professors={data.professors} courses={data.courses}/></>;
}
