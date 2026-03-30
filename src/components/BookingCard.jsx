/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmDoctorAttendance,
  cancelDoctorAttendance,
  approveBooking,
  cancelMedicalBooking,
  confirmMedicalBooking,
  uploadMedicalPdfs,
} from "../utlis/https";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import {
  Snackbar,
  Alert,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
} from "@mui/material";
import RescheduleBooking from "./RescheduleBooking";
import getMedicalStatus from "../utlis/get-medical-status";

// WhatsApp Icon Component
const WhatsAppIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

const BookingCard = ({ booking, showSwitch = true, doctorId, type }) => {
  console.log("booking booking", booking);

  const queryClient = useQueryClient();
  const is_medical_service = getMedicalStatus();
  const token = localStorage.getItem("authToken");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showReschedule, setShowReschedule] = useState(false);
  const [showUploadPdfs, setShowUploadPdfs] = useState(false);
  const hasUploadedPdfs =
    Array.isArray(booking?.lab_results_files) &&
    booking?.lab_results_files?.length > 0;

  const canUploadLabResults =
    booking.status === "confirmed" ||
    booking.status === "completed" ||
    booking.status === "finished";

  // Check booking date status
  const getBookingDateStatus = () => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return "past";
    } else if (bookingDate.getTime() === today.getTime()) {
      return "today";
    } else {
      return "future";
    }
  };

  // Confirm attendance mutation
  const confirmAttendanceMutation = useMutation({
    mutationFn: ({ bookingId }) => {
      if (type) {
        confirmMedicalBooking({ token, bookingId });
        return;
      }
      // Use different endpoint based on booking date
      const dateStatus = getBookingDateStatus();
      if (dateStatus === "today") {
        return confirmDoctorAttendance({ token, bookingId });
      } else if (dateStatus === "future") {
        return approveBooking({ token, bookingId });
      } else {
        // This shouldn't happen as past dates won't show buttons
        return confirmDoctorAttendance({ token, bookingId });
      }
    },
    onSuccess: () => {
      if (type) {
        queryClient.invalidateQueries(["medical-bookings"]);
        setSnackbar({
          open: true,
          message: "تم تأكيد الحجز بنجاح",
          severity: "success",
        });
      } else {
        queryClient.invalidateQueries(["specialization"]);
        queryClient.invalidateQueries(["doctor-attendance"]);
        queryClient.invalidateQueries(["bookings"]);
        queryClient.invalidateQueries(["all-home-visits"]);
        const dateStatus = getBookingDateStatus();
        setSnackbar({
          open: true,
          message:
            dateStatus === "today"
              ? "تم تأكيد حضور الطبيب بنجاح"
              : "تم تأكيد الحضور بنجاح",
          severity: "success",
        });
      }
    },
    onError: (error) => {
      const dateStatus = getBookingDateStatus();
      setSnackbar({
        open: true,
        message:
          error.message ||
          (dateStatus === "today"
            ? "فشل في تأكيد حضور الطبيب"
            : "فشل في تأكيد الحضور"),
        severity: "error",
      });
    },
  });

  // Cancel attendance mutation
  const cancelAttendanceMutation = useMutation({
    mutationFn: ({ bookingId }) =>
      type
        ? cancelMedicalBooking({ token, bookingId })
        : cancelDoctorAttendance({ token, bookingId }),
    onSuccess: () => {
      if (type) {
        queryClient.invalidateQueries(["medical-bookings"]);
        setSnackbar({
          open: true,
          message: "تم إلغاء الحجز بنجاح",
          severity: "success",
        });
      } else {
        queryClient.invalidateQueries(["specialization"]);
        queryClient.invalidateQueries(["doctor-attendance"]);
        queryClient.invalidateQueries(["bookings"]);
        queryClient.invalidateQueries(["all-home-visits"]);
        setSnackbar({
          open: true,
          message: "تم إلغاء حضور الطبيب بنجاح",
          severity: "success",
        });
      }
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || "فشل في إلغاء حضور الطبيب",
        severity: "error",
      });
    },
  });

  const { mutate: uploadPdfsMutation, isPending: isUploadingPdfs } =
    useMutation({
      mutationFn: ({ bookingId, data }) => {
        return uploadMedicalPdfs({ token, bookingId, data });
      },
      onSuccess: () => {
        alert("تم رفع التحاليل الطبية بنجاح");
        queryClient.invalidateQueries(["medical-bookings"]);
        setShowUploadPdfs(false);
        setSelectedFiles([]);
      },
    });

  const handleConfirmAttendance = () => {
    confirmAttendanceMutation.mutate({ bookingId: booking.id });
  };

  const handleUploadPdfs = async () => {
    if (!selectedFiles.length) {
      alert("من فضلك اختر ملفات PDF أولاً");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((fileObj) => formData.append("pdf", fileObj.file));

    try {
      setIsUploading(true); // حالة loading
      await uploadMedicalPdfs({ token, bookingId: booking.id, data: formData });
      setSnackbar({
        open: true,
        message: "تم رفع جميع الملفات بنجاح",
        severity: "success",
      });
      queryClient.invalidateQueries(["medical-bookings"]);
      setShowUploadPdfs(false);
      setSelectedFiles([]);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "فشل في رفع الملفات",
        severity: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelAttendance = () => {
    cancelAttendanceMutation.mutate({ bookingId: booking.id });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleReschedule = () => {
    setShowReschedule(true);
  };

  const handleRescheduleSuccess = () => {
    setShowReschedule(false);
    setSnackbar({
      open: true,
      message: "تم إعادة جدولة الحجز بنجاح",
      severity: "success",
    });
  };

  const handleRescheduleCancel = () => {
    setShowReschedule(false);
  };

  // Generate WhatsApp URL with welcome message
  const generateWhatsAppUrl = (phoneNumber, patientName) => {
    // Remove any non-numeric characters from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "");

    // Create welcome message
    const welcomeMessage = `مرحباً ${
      patientName || "عزيزي المريض"
    }، شكراً لك على حجزك معنا. نحن سعداء بخدمتك ونتمنى لك الشفاء العاجل.`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(welcomeMessage);

    // Return WhatsApp URL
    return `https://wa.me/+218${cleanPhone}?text=${encodedMessage}`;
  };

  // Handle WhatsApp click
  const handleWhatsAppClick = (phoneNumber, patientName) => {
    const whatsappUrl = generateWhatsAppUrl(phoneNumber, patientName);
    window.open(whatsappUrl, "_blank");
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  // Format time range function
  function formatTimeRange(from, to) {
    const format = (time) => {
      let [hours, minutes] = time.split(":").map(Number);

      const period = hours >= 12 ? "م" : "ص";

      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
    };

    return `${format(from)} - ${format(to)}`;
  }
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "مؤكد";
      case "cancelled":
        return "ملغي";
      case "pending":
        return "في الانتظار";
      case "completed":
        return "مكتمل";
      case "finished":
        return "مكتمل";
      default:
        return status;
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get payment status text
  const getPaymentStatusText = (status) => {
    switch (status) {
      case "paid":
        return "مدفوع";
      case "unpaid":
        return "غير مدفوع";
      case "pending":
        return "في الانتظار";
      default:
        return status;
    }
  };

  console.log("booking booking booking", booking);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Booking Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">حجز رقم #{booking.id}</h3>
          <p className="text-sm text-gray-500">
            {formatDate(booking?.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              booking?.status,
            )}`}
          >
            {getStatusText(booking?.status)}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
              booking?.payment_status,
            )}`}
          >
            {getPaymentStatusText(booking?.payment_status)}
          </span>
        </div>
      </div>
      {console.log("is_medical_service is_medical_service", is_medical_service)}
      {/* Doctor and Hospital Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        {/* {!is_medical_service && ( */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">تفاصيل الطبيب</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-500">الاسم:</span>{" "}
              {booking?.doctor?.name || "غير محدد"}
            </p>
            <p>
              <span className="text-gray-500">المستشفى:</span>{" "}
              {booking?.hospital?.name || "غير محدد"}
            </p>
          </div>
        </div>
        {/* )} */}
        {/* {is_medical_service && ( */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">تفاصيل الخدمة</h4>
          <div className="space-y-1 text-sm">
            {booking?.items?.map((item) => (
              <p key={item.id}>
                <span className="text-gray-500">الاسم:</span>{" "}
                {item?.name || "غير محدد"}
              </p>
            ))}
          </div>
        </div>
        {/* )} */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">تفاصيل الموعد</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-500">التاريخ:</span>{" "}
              {!is_medical_service
                ? formatDate(booking?.date)
                : formatDate(booking?.appointment?.date)}
            </p>
            <p>
              <span className="text-gray-500">الوقت:</span>{" "}
              {!is_medical_service
                ? formatTimeRange(booking?.slot?.from, booking?.slot?.to)
                : booking?.appointment?.time}
            </p>
          </div>
        </div>
      </div>
      {/* Patient Details */}
      {booking?.user && (
        <div className="border-t pt-3">
          <h4 className="font-medium text-gray-700 mb-2">تفاصيل المريض</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <span className="text-gray-500">الاسم:</span>{" "}
                {booking?.is_for_self
                  ? booking?.user?.name || "غير محدد"
                  : booking?.patient?.patient_name || "غير محدد"}
              </p>
              <p className="flex items-center text-sm gap-2">
                <span className="text-gray-500 text-xs">رقم الهاتف:</span>{" "}
                <span>
                  {booking?.is_for_self
                    ? booking?.user?.phone || "غير محدد"
                    : booking?.patient?.patient_phone || "غير محدد"}
                </span>
                {(booking?.is_for_self
                  ? booking?.user?.phone
                  : booking?.patient?.patient_phone) && (
                  <Tooltip title="إرسال رسالة واتساب" arrow>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleWhatsAppClick(
                          booking?.is_for_self
                            ? booking?.user?.phone
                            : booking?.patient?.patient_phone,
                          booking?.is_for_self
                            ? booking?.user?.name
                            : booking?.patient?.patient_name,
                        )
                      }
                      sx={{
                        color: "#25D366",
                        "&:hover": {
                          backgroundColor: "rgba(37, 211, 102, 0.1)",
                        },
                      }}
                    >
                      <WhatsAppIcon size={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </p>
            </div>
            <div>
              <p>
                <span className="text-gray-500">نوع الحجز:</span>{" "}
                {booking?.is_for_self ? "لنفسه" : "لشخص آخر"}
              </p>
              {booking?.is_for_self ? (
                <p>
                  <span className="text-gray-500">العمر:</span>{" "}
                  {booking?.user?.age ?? "غير محدد"}
                </p>
              ) : (
                <>
                  <p>
                    <span className="text-gray-500">تاريخ الميلاد:</span>{" "}
                    {booking?.patient?.patient_date_of_birth
                      ? formatDate(booking?.patient?.patient_date_of_birth)
                      : "غير محدد"}
                  </p>
                  <p>
                    <span className="text-gray-500">الجنس:</span>{" "}
                    {booking?.patient?.patient_gender
                      ? booking?.patient?.patient_gender === "female"
                        ? "أنثى"
                        : booking?.patient?.patient_gender === "male"
                          ? "ذكر"
                          : booking?.patient?.patient_gender
                      : "غير محدد"}
                  </p>
                </>
              )}
              <p>
                <span className="text-gray-500">حالة الاسترداد:</span>{" "}
                {booking?.is_refunded === "true"
                  ? "تم الاسترداد"
                  : "لم يتم الاسترداد"}
              </p>
            </div>
          </div>
        </div>
      )}
      {booking?.patient && (
        <div className="border-t pt-3">
          <h4 className="font-medium text-gray-700 mb-2">تفاصيل المريض</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <span className="text-gray-500">الاسم:</span>{" "}
                {booking?.patient?.name || "غير محدد"}
              </p>
              <p className="flex items-center text-sm gap-2">
                <span className="text-gray-500 text-xs">رقم الهاتف:</span>{" "}
                <span>{booking?.patient?.phone || "غير محدد"}</span>
              </p>
            </div>
            <div>
              <p>
                <span className="text-gray-500">نوع الحجز:</span>{" "}
                {booking?.is_for_self ? "لنفسه" : "لشخص آخر"}
              </p>
              {booking?.is_for_self ? (
                <p>
                  <span className="text-gray-500">العمر:</span>{" "}
                  {booking?.patient?.age ?? "غير محدد"}
                </p>
              ) : (
                <>
                  <p>
                    <span className="text-gray-500"> العمر:</span>{" "}
                    {booking?.patient?.age ? booking?.patient?.age : "غير محدد"}
                  </p>
                  <p>
                    <span className="text-gray-500">الجنس:</span>{" "}
                    {booking?.patient?.gender
                      ? booking?.patient?.gender === "female"
                        ? "أنثى"
                        : booking?.patient?.gender === "male"
                          ? "ذكر"
                          : booking?.patient?.gender
                      : "غير محدد"}
                  </p>
                </>
              )}
              <p>
                <span className="text-gray-500">حالة الاسترداد:</span>{" "}
                {booking?.is_refunded ? "تم الاسترداد" : "لم يتم الاسترداد"}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Lab Results Files */}
      {hasUploadedPdfs && (
        <div className="border-t pt-3 mt-3">
          <h4 className="font-medium text-gray-700 mb-2">التحاليل المرفوعة</h4>

          <div className="space-y-2">
            {booking.lab_results_files.map((file, index) => {
              const fileName = file.split("/").pop();

              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 border rounded-md px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>📄</span>
                    <span className="truncate max-w-[200px]">{fileName}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => window.open(file, "_blank")}
                    >
                      عرض
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Action Section */}
      <div className="border-t pt-3 mt-3">
        <div className="flex gap-2 justify-between items-center">
          {booking.status === "pending" &&
            getBookingDateStatus() !== "past" && (
              <ButtonGroup
                size="small"
                variant="contained"
                className="flex gap-3 items-center"
              >
                <Button
                  onClick={handleCancelAttendance}
                  disabled={
                    confirmAttendanceMutation.isPending ||
                    cancelAttendanceMutation.isPending
                  }
                  color="error"
                  sx={{ fontSize: "0.75rem", minWidth: "120px" }}
                >
                  {cancelAttendanceMutation.isPending
                    ? "جاري الإلغاء..."
                    : "إلغاء الحجز"}
                </Button>
                <Button
                  onClick={handleConfirmAttendance}
                  disabled={
                    confirmAttendanceMutation.isPending ||
                    cancelAttendanceMutation.isPending
                  }
                  color="success"
                  sx={{ fontSize: "0.75rem", minWidth: "120px" }}
                >
                  {confirmAttendanceMutation.isPending
                    ? "جاري التأكيد..."
                    : getBookingDateStatus() === "today"
                      ? "تأكيد الحجز"
                      : "تأكيد الحضور"}
                </Button>
              </ButtonGroup>
            )}

          {booking.status === "finished" && (
            <div className="text-sm text-green-600 font-medium">
              تم إكمال الحجز
            </div>
          )}

          {getBookingDateStatus() === "past" && (
            <div className="text-sm text-gray-500 font-medium">
              لا يمكن اتخاذ أي إجراء للحجوزات السابقة
            </div>
          )}

          {canUploadLabResults && (
            <Button
              onClick={() => setShowUploadPdfs(true)}
              disabled={hasUploadedPdfs}
              color="success"
              variant="contained"
              size="small"
              sx={{ fontSize: "0.75rem", minWidth: "140px" }}
            >
              {hasUploadedPdfs ? "تم رفع التحاليل" : "رفع التحاليل الطبية"}
            </Button>
          )}
        </div>
      </div>
      {/* Reschedule Button Row */}
      {booking?.status === "pending" && doctorId && !showReschedule && (
        <div className="border-t pt-3 mt-3 flex justify-center">
          <div className="flex justify-start">
            <Button
              onClick={handleReschedule}
              variant="outlined"
              size="small"
              color="secondary"
              sx={{ fontSize: "0.75rem", minWidth: "100px" }}
            >
              إعادة جدولة
            </Button>
          </div>
        </div>
      )}
      {/* Reschedule Component */}
      {showReschedule && doctorId && (
        <div className="mt-4">
          <RescheduleBooking
            bookingId={booking.id}
            doctorId={doctorId}
            onSuccess={handleRescheduleSuccess}
            onCancel={handleRescheduleCancel}
          />
        </div>
      )}
      {/* MUI Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        dir="rtl"
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog
        open={showUploadPdfs}
        onClose={() => setShowUploadPdfs(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>رفع التحاليل الطبية (PDF فقط)</DialogTitle>

        <DialogContent>
          <Button variant="outlined" component="label" fullWidth>
            اختر ملفات PDF
            <input
              type="file"
              hidden
              accept="application/pdf"
              multiple
              onChange={(e) => {
                const MAX_SIZE_MB = 10;
                const files = Array.from(e.target.files)
                  .filter((file) => file.type === "application/pdf")
                  .map((file) => {
                    if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
                      return {
                        file,
                        status: "error",
                        errorMsg:
                          "حجم الملف أكبر من 10 ميجابايت يرجى اختيار ملف أصغر",
                      };
                    }
                    return { file, status: "pending" };
                  });
                setSelectedFiles(files);
              }}
            />
          </Button>

          {selectedFiles?.length > 0 && (
            <div style={{ marginTop: "10px", fontSize: "14px" }}>
              {selectedFiles?.map((file, index) => (
                <div key={index}>{file.name}</div>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div style={{ marginTop: "10px", fontSize: "14px" }}>
              {selectedFiles.map((fileObj, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center gap-2"
                >
                  <span>{fileObj.file.name}</span>
                  {fileObj.status === "error" && (
                    <span className="text-red-600 text-xs">
                      {fileObj.errorMsg}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                    }}
                    className="text-red-500 text-2xl font-bold hover:text-red-700 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowUploadPdfs(false)} color="error">
            إلغاء
          </Button>

          <Button
            onClick={handleUploadPdfs}
            disabled={isUploading}
            color="success"
            variant="contained"
          >
            {isUploading ? "جاري الرفع..." : "رفع الملفات"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BookingCard;
