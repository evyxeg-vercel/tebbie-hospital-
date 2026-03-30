import { useState } from "react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAllBooking, getSpecializations } from "../utlis/https";
import LoaderComponent from "../components/LoaderComponent";
import BookingData from "../components/BookingData";
import CustomSelect from "../components/CustomSelect";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { arSA } from "date-fns/locale";
import getMedicalStatus from "../utlis/get-medical-status";

const BookingsPage = () => {
  const { BookId } = useParams();
  const token = localStorage.getItem("authToken");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [pendingSearch, setPendingSearch] = useState("");
  const [search, setSearch] = useState("");

  // ✅ New state for specialization filter
  const [activeSpecialization, setActiveSpecialization] = useState(null);
  const is_medical_service = getMedicalStatus();
  const {
    data: DataBooking,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bookings", startDate, endDate, search],
    // enabled: true,
    enabled:
      is_medical_service != true ||
      is_medical_service != "true" ||
      !is_medical_service,
    queryFn: () => {
      const startYMD = startDate ? format(startDate, "yyyy-MM-dd") : null;
      const endYMD = endDate
        ? format(endDate, "yyyy-MM-dd")
        : startYMD
          ? format(new Date(), "yyyy-MM-dd")
          : null;

      return getAllBooking({
        token,
        id: BookId,
        start: startYMD,
        end: endYMD,
        search: search || undefined,
      });
    },
  });

  console.log("DataBooking DataBooking", DataBooking);

  const { data: SpecializationsData } = useQuery({
    queryKey: ["AllSpecializations"],
    enabled: true,
    queryFn: () => getSpecializations({ token }),
  });

  const navigate = useNavigate();

  const handleExportCSV = () => {
    const rows = (filteredBookings || []).map((b) => ({
      id: b.id,
      date: b.date,
      doctor_name: b.doctor?.name || "",
      hospital_name: b.hospital?.name || "",
      patient_name: b.is_for_self ? b.user?.name || "" : b.patient?.name || "",
      phone: b.is_for_self ? b.user?.phone || "" : b.patient?.phone || "",
      status: b.status || "",
      payment_status: b.payment_status || "",
      price: b.price || "",
    }));

    const headers = [
      "رقم الحجز",
      "التاريخ",
      "اسم الطبيب",
      "اسم المستشفى",
      "اسم المريض",
      "الهاتف",
      "الحالة",
      "حالة الدفع",
      "السعر",
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.date,
          `"${r.doctor_name}"`,
          `"${r.hospital_name}"`,
          `"${r.patient_name}"`,
          `"${r.phone}"`,
          r.status,
          r.payment_status,
          r.price,
        ].join(","),
      ),
    ].join("\n");

    // Add BOM for Arabic in Excel
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <LoaderComponent />;
  if (error) {
    return (
      <div className="h-screen w-full flex justify-center items-center text-md text-red-400">
        <p>{error.message}</p>
      </div>
    );
  }

  const bookings = DataBooking?.bookings || [];
  let filteredBookings =
    startDate && endDate
      ? bookings.filter((booking) => {
          const bookingDate = booking.date;
          const startDateStr = format(startDate, "yyyy-MM-dd");
          const endDateStr = format(endDate, "yyyy-MM-dd");
          return bookingDate >= startDateStr && bookingDate <= endDateStr;
        })
      : bookings;

  if (activeSpecialization) {
    filteredBookings = filteredBookings.filter(
      (b) => b.doctor?.specialization_id === activeSpecialization,
    );
  }

  const handleBookingClick = (booking) => {
    localStorage.setItem("selectedDate", JSON.stringify(booking));
    navigate(
      `/specialization/booking/details/${booking.doctor.specialization_id}`,
    );
    console.log(booking);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arSA}>
      <div className="flex flex-col overflow-scroll">
        <div className="flex flex-col h-screen">
          <div className="w-full bg-white z-10 my-4 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-4">
              <CustomSelect
                options={SpecializationsData || []}
                value={activeSpecialization}
                onChange={setActiveSpecialization}
                placeholder="كل التخصصات"
                searchable={true}
              />
            </div>

            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex-1" />
              <input
                type="text"
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder="بحث في الحجوزات"
                className="w-full max-w-md rounded-lg border border-gray-300 bg-[#f8f9fa] px-4 py-2 text-[14px] font-medium text-[#495057] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setSearch(pendingSearch)}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
              >
                بحث
              </button>
            </div>
            <button
              onClick={handleExportCSV}
              className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 w-full my-5"
            >
              تصدير Excel
            </button>

            <h5 className="text-lg font-bold text-gray-800 mb-4">
              اختر الفترة الزمنية
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  من تاريخ
                </label>
                <DatePicker
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  format="dd/MM/yyyy"
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      "&:hover": {
                        borderColor: "#007bff",
                      },
                      "&.Mui-focused": {
                        borderColor: "#007bff",
                        boxShadow: "0 0 0 2px rgba(0, 123, 255, 0.25)",
                      },
                    },
                    "& .MuiInputBase-input": {
                      padding: "12px 16px",
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "#495057",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#6c757d",
                      marginRight: "12px",
                    },
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  إلى تاريخ
                </label>
                <DatePicker
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  format="dd/MM/yyyy"
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      "&:hover": {
                        borderColor: "#007bff",
                      },
                      "&.Mui-focused": {
                        borderColor: "#007bff",
                        boxShadow: "0 0 0 2px rgba(0, 123, 255, 0.25)",
                      },
                    },
                    "& .MuiInputBase-input": {
                      padding: "12px 16px",
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "#495057",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#6c757d",
                      marginRight: "12px",
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bookings list */}
          <div className="flex-1 overflow-y-auto my-4">
            <BookingData
              handleBookingClick={handleBookingClick}
              filteredBookings={filteredBookings}
              SpecializationsData={SpecializationsData}
            />
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default BookingsPage;
