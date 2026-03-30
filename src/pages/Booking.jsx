import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
  getDate,
} from "date-fns";
import { IoChevronForward, IoChevronBack } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBooking } from "../utlis/https";
import LoaderComponent from "../components/LoaderComponent";
import BookingData from "../components/BookingData";

const Booking = () => {
  const { BookId } = useParams();
  const token = localStorage.getItem("authToken");
  const [selectedRange, setSelectedRange] = useState({
    start: new Date(),
    end: null,
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const handleDayClick = (day) => {
    if (!isSelecting) {
      setSelectedRange({ start: day, end: null });
      setIsSelecting(true);
    } else {
      setSelectedRange((prev) => ({
        ...prev,
        end: day,
      }));
      setIsSelecting(false);
    }
  };

  const {
    data: DataBooking,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bookings", selectedRange.start, selectedRange.end],
    enabled: true,
    queryFn: () =>
      getBooking({
        token,
        id: BookId,
        start: selectedRange.start
          ? format(selectedRange.start, "yyyy-MM-dd")
          : null,
        end: selectedRange.end ? format(selectedRange.end, "yyyy-MM-dd") : null,
      }),
  });

  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const startDay = startOfMonth(currentDate);
  const endDay = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: startDay, end: endDay });

  const prevMonthEnd = endOfMonth(subMonths(currentDate, 1));
  const emptyDays = Array(getDay(startDay))
    .fill(null)
    .map((_, i) => getDate(prevMonthEnd) - (getDay(startDay) - 1) + i);

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  if (isLoading) {
    return <LoaderComponent />;
  }

  if (error) {
    return (
      <div className="h-screen w-full flex justify-center items-center text-md text-red-400">
        <p>{error.message}</p>
      </div>
    );
  }

  const bookings = DataBooking?.bookings || [];
  const filteredBookings =
    selectedRange.start && selectedRange.end
      ? bookings.filter((booking) => {
          const bookingDate = booking.date;
          const startDate = format(selectedRange.start, "yyyy-MM-dd");
          const endDate = format(selectedRange.end, "yyyy-MM-dd");
          return bookingDate >= startDate && bookingDate <= endDate;
        })
      : bookings;

  const handleBookingClick = (booking) => {
    localStorage.setItem("selectedDate", JSON.stringify(booking));
    navigate(`/specialization/booking/details/${BookId}`);
  };

  return (
    <div className="flex flex-col overflow-scroll">
      <div className="flex flex-col h-screen">
        <div className="w-full bg-white z-10 my-4">
          <div className="flex justify-between items-center mb-4">
            <button
              className="w-10 h-10 flex items-center justify-center border rounded-lg text-gray-600 hover:bg-gray-200"
              onClick={handlePrevMonth}
            >
              <IoChevronForward className="text-xl" />
            </button>
            <h5 className="text-lg font-bold text-gray-800">
              {format(currentDate, "MMMM yyyy")}
            </h5>
            <button
              className="w-10 h-10 flex items-center justify-center border rounded-lg text-gray-600 hover:bg-gray-200"
              onClick={handleNextMonth}
            >
              <IoChevronBack className="text-xl" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center font-bold text-gray-600 text-xs">
            {[
              "الأحد",
              "الاثنين",
              "الثلاثاء",
              "الأربعاء",
              "الخميس",
              "الجمعة",
              "السبت",
            ].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 mt-4">
            {emptyDays.map((day, i) => (
              <div key={`prev-${i}`} className="text-gray-400">
                {day}
              </div>
            ))}

            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const bookingsForDay = bookings.filter(
                (booking) => booking.date === dayKey,
              );

              const isStartDay =
                selectedRange.start &&
                format(day, "yyyy-MM-dd") ===
                  format(selectedRange.start, "yyyy-MM-dd");
              const isEndDay =
                selectedRange.end &&
                format(day, "yyyy-MM-dd") ===
                  format(selectedRange.end, "yyyy-MM-dd");
              const isInRange =
                selectedRange.start &&
                selectedRange.end &&
                format(day, "yyyy-MM-dd") >
                  format(selectedRange.start, "yyyy-MM-dd") &&
                format(day, "yyyy-MM-dd") <
                  format(selectedRange.end, "yyyy-MM-dd");

              return (
                <div
                  key={dayKey}
                  className={`relative h-12 flex flex-col items-center justify-center rounded-lg cursor-pointer
                    ${bookingsForDay.length > 0 ? "bg-green-100" : ""}
                    ${isStartDay ? "bg-blue-200 border-2 border-blue-300" : ""}
                    ${isEndDay ? "bg-blue-200 border-2 border-blue-300" : ""}
                    ${isInRange ? "bg-blue-100" : ""}
                    ${
                      bookingsForDay.length > 0 && (isStartDay || isEndDay)
                        ? "border-green-500"
                        : ""
                    }
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="font-bold text-gray-800">
                    {format(day, "d")}
                  </span>
                  {bookingsForDay.length > 0 && (
                    <div className="absolute bottom-1 flex gap-1">
                      {bookingsForDay.slice(0, 3).map((_, i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-green-500 rounded-full"
                        ></span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto my-4">
          <BookingData
            handleBookingClick={handleBookingClick}
            filteredBookings={filteredBookings}
          />
        </div>
      </div>
    </div>
  );
};

export default Booking;
