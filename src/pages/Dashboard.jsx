import { Link } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";
import { useQuery } from "@tanstack/react-query";
import { getSpecializations } from "../utlis/https";
import LoaderComponent from "../components/LoaderComponent";
import { MdEdit, MdLocationOn } from "react-icons/md";
import { CiEdit } from "react-icons/ci";
import DashboardMedical from "./medical-service-pages/DashboardMedical";
import getMedicalStatus from "../utlis/get-medical-status";

const Dashboard = () => {
  const token = localStorage.getItem("authToken");
  const is_medical_service = getMedicalStatus();

  const {
    data: specializationData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["specializations"],
    queryFn: () => getSpecializations({ token }),
    enabled:
      is_medical_service != true ||
      is_medical_service != "true" ||
      !is_medical_service,
  });

  if (is_medical_service == "true") {
    return <DashboardMedical />;
  }

  if (isLoading) {
    return <LoaderComponent />;
  }

  if (error) {
    return (
      <div className="h-screen w-full flex justify-center items-center text-2xl">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <section className="h-full flex flex-col my-8 w-full">
      <div className="w-full flex gap-2 flex-wrap my-4">
        <Link
          to="/home-visit-pricing"
          className="py-1  flex items-center bg-gradient-to-bl from-[#33A9C7] to-[#3AAB95] text-white rounded-md px-2 w-64"
        >
          <IoIosAdd size={30} />
          تسعير خدمات الزيارة المنزلية
        </Link>
        <Link
          to="/edit-service"
          className="py-1  flex gap-2 items-center bg-gradient-to-bl from-[#33A9C7] to-[#3AAB95] text-white rounded-md px-2 w-auto shrink-0"
        >
          <CiEdit size={26} />
          تعديل الخدمات
        </Link>
        <Link
          to="/home-visit-regions"
          className="py-1  flex gap-2 items-center bg-gradient-to-bl from-[#33A9C7] to-[#3AAB95] text-white rounded-md px-2 w-auto shrink-0"
        >
          <MdLocationOn size={26} />
          مناطق الزيارة المنزلية
        </Link>
      </div>

      {specializationData?.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {specializationData.map((data) => (
            <Link
              to={`/specialization/${data.id}`}
              key={data.id}
              state={{ clinicName: data.name, clinicId: data.id }}
              className="col-span-1 w-full bg-[#F3F3F3] flex-col flex gap-2 rounded-lg text-center justify-center items-center py-8 relative"
            >
              <div className="w-16">
                <img
                  src={data.first_image_url}
                  alt="Beauty Icon"
                  className="w-16 rounded-full"
                />
              </div>
              <Link
                state={{ clinicName: data.name }}
                to={`/update-specialization/${data.id}`}
                className="absolute left-4 top-4 bg-gradient-to-bl from-[#33A9C7] to-[#3AAB95] text-white rounded-md p-1 rounded-bl-none"
              >
                <MdEdit size={22} />
              </Link>
              <h2 className="text-black font-[500]">عيادة {data.name}</h2>
            </Link>
          ))}
        </div>
      ) : (
        <div className="h-[60vh] w-full flex justify-center items-center text-2xl">
          عذرًا، لا توجد تخصصات لعرضها
        </div>
      )}
    </section>
  );
};

export default Dashboard;
