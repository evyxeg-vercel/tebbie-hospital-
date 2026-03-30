import { useQuery } from "@tanstack/react-query";
import NotificationCard from "./NotificationCard";
import NotificationsHeader from "./NotificationsHeader";
import { getNotifications } from "../utlis/https";
import LoaderComponent from "./LoaderComponent";
import getMedicalStatus from "../utlis/get-medical-status";

const Notifications = () => {
  const token = localStorage.getItem("authToken");
  const is_medical_service = getMedicalStatus();
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications({ token }),
    enabled:
      is_medical_service != true ||
      is_medical_service != "true" ||
      !is_medical_service,
  });
  if (isLoading) {
    return <LoaderComponent />;
  }

  if (error) {
    return (
      <div className="h-screen flex justify-center items-center">
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  const getNotificationDate = (createdAt) => {
    const today = new Date();
    const notificationDate = new Date(createdAt);

    const diffInTime = today.getTime() - notificationDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);

    if (diffInDays === 0) {
      return "اليوم";
    } else if (diffInDays === 1) {
      return "أمس";
    } else {
      return notificationDate.toLocaleDateString("ar-EG");
    }
  };
  const sortedNotifications = data ? [...data].reverse() : [];
  return (
    <section className="p-4">
      <NotificationsHeader />

      {is_medical_service === "true" && null}

      <div>
        {sortedNotifications.map((notification) => (
          <div key={notification.id}>
            <h5 className="text-md font-bold text-gray-800 mb-4 text-right">
              {getNotificationDate(notification.created_at)}
            </h5>
            <NotificationCard
              TransactionTitle={notification.title}
              type={notification.type}
              TransactionDetail={notification.body}
              relatable_id={notification.relatable_id}
              specialization_id={notification.specialization_id}
            />
          </div>
        ))}

        {!data?.length && (
          <p className="text-right text-gray-500 text-2xl">
            لا توجد إشعارات حالياً.
          </p>
        )}
      </div>
    </section>
  );
};

export default Notifications;
