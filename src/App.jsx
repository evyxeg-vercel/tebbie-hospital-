import "./global.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Login from "./login/Login";
import Dashboard from "./pages/Dashboard";
import WalettDetails from "./pages/WalettDetails";
import { AuthMiddleware, GuestMiddleware } from "./middlewares/authMiddleware";
import MainLayout from "./pages/MainNaviagtion";
import Speizlization from "./components/Speizlization";
import HomeVisit from "./pages/HomeVisit";
import Walett from "./pages/Walett";
import SecondLayout from "./components/SecondLayout";
import Notification from "./components/Notification";
import Booking from "./pages/Booking";
import Refunds from "./pages/Refunds";
import BookingDetails from "./components/BookingDetails";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddsSecialization from "./pages/AddsSecialization";
import Search from "./pages/Search";
import Reviews from "./pages/Reviews";
import HomeVisitPricing from "./components/HomeVisitPricing";
import HomeVisitRegions from "./pages/HomeVisitRegions";
import Doctors from "./pages/Doctors";
import DoctorBooking from "./pages/DoctorBooking";
import NotFound from "./components/NotFound";
import EditService from "./pages/EditService";
import { useEffect } from "react";
import { setupForegroundNotifications } from "./firebase/fcm";
import BookingsPage from "./pages/bookings-page";
import SettingsPage from "./pages/Settings";
import EmployeesPage from "./pages/employees-page";
import AddRolePage from "./pages/AddRolePage";
import AddNewRolePage from "./pages/AddNewRolePage";
import ServiceSlots from "./pages/ServiceSlots";
import Services from "./pages/Services";
import ServiceBookings from "./pages/ServiceBookings";
import OldWallet from "./components/OldWallet";
import NewWallet from "./components/NewWallet";
import PermissionWrapper from "./components/PermissionWrapper";
import MedicalBookings from "./pages/medical-service-pages/medical-bookings";
import MedicalReviews from "./pages/medical-service-pages/MedicalReviews";
import MedicalWallet from "./pages/medical-service-pages/MedicalWallet";
import MedicalPackages from "./pages/medical-service-pages/MedicalPackages";
import MedicalItems from "./pages/medical-service-pages/MedicalItems";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthMiddleware />,
    children: [
      {
        path: "",
        element: <MainLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          {
            path: "home-visit",
            element: (
              <PermissionWrapper permissionName="get-home-visit">
                <HomeVisit />
              </PermissionWrapper>
            ),
          },
          { path: "edit-service", element: <EditService /> },
          {
            path: "services",
            element: (
              <PermissionWrapper permissionName="view-home-visit-service">
                <Services />
              </PermissionWrapper>
            ),
          },
          { path: "service-slots/:serviceId", element: <ServiceSlots /> },
          { path: "service-bookings/:serviceId", element: <ServiceBookings /> },
          {
            path: "bookings",
            element: (
              <PermissionWrapper permissionName="get-booking-for-all">
                <BookingsPage />
              </PermissionWrapper>
            ),
          },
          {
            path: "employees",
            element: (
              <PermissionWrapper permissionName="view-employees">
                <EmployeesPage />
              </PermissionWrapper>
            ),
          },
          {
            path: "add-role",
            element: (
              <PermissionWrapper permissionName="add-employees">
                <AddRolePage />
              </PermissionWrapper>
            ),
          },
          {
            path: "add-new-role",
            element: (
              <PermissionWrapper permissionName="add-employees">
                <AddNewRolePage />
              </PermissionWrapper>
            ),
          },
          { path: "settings", element: <SettingsPage /> },

          {
            path: "wallet",
            children: [
              {
                index: true,
                element: (
                  <PermissionWrapper permissionName="get-wallet-total">
                    <Walett />
                  </PermissionWrapper>
                ),
              },
              {
                path: "old",
                children: [
                  { index: true, element: <OldWallet /> },
                  { path: "details", element: <WalettDetails /> },
                ],
              },
              {
                path: "new",
                children: [
                  { index: true, element: <NewWallet /> },
                  { path: "details", element: <WalettDetails /> },
                ],
              },
            ],
          },
          {
            path: "search",
            element: <Search />,
          },

          // medical service routes
          {
            path: "medical-bookings",
            element: <MedicalBookings />,
          },
          {
            path: "medical-wallet",
            element: <MedicalWallet />,
          },
          {
            path: "medical-packages",
            element: <MedicalPackages />,
          },
          {
            path: "medical-items",
            element: <MedicalItems />,
          },
          {
            path: "medical-reviews",
            element: <MedicalReviews />,
          },
        ],
      },
      { path: "reviews", element: <Reviews /> },
      {
        path: "home-visit-pricing",
        element: <HomeVisitPricing />,
      },
      {
        path: "home-visit-regions",
        element: <HomeVisitRegions />,
      },
      {
        path: "/specialization",
        element: <SecondLayout />,
        children: [
          {
            path: ":speizId",
            element: (
              <PermissionWrapper permissionName="view-specializations">
                <Speizlization />
              </PermissionWrapper>
            ),
          },
          { path: "refunds", element: <Refunds /> },
          {
            path: "booking",
            children: [
              { path: ":BookId", element: <Booking /> },
              { path: "details/:doctorId", element: <BookingDetails /> },
            ],
          },
        ],
      },
      {
        path: "/update-specialization/:sId",
        element: <AddsSecialization />,
      },
      {
        path: "doctors/:Id",
        children: [
          { index: true, element: <Doctors /> },
          { path: ":doctorId", element: <DoctorBooking /> },
        ],
      },

      {
        path: "/notification",
        element: <Notification />,
      },
    ],
  },

  {
    path: "/login",
    element: <GuestMiddleware />,
    children: [{ index: true, element: <Login /> }],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  useEffect(() => {
    setupForegroundNotifications();
  }, []);
  return (
    <main
      className="max-w-md container mx-auto relative min-h-screen "
      dir="rtl"
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </main>
  );
}

export default App;
