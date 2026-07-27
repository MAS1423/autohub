import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./lib/i18n";
import { CompareProvider } from "./contexts/CompareContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import Home from "./pages/Home";
import Dealers from "./pages/Dealers";
import DealerProfile from "./pages/DealerProfile";
import VehicleDetail from "./pages/VehicleDetail";
import Pricing from "./pages/Pricing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import ReviewsPage from "./pages/ReviewsPage";
import ComparePage from "./pages/ComparePage";
import FavoritesPage from "./pages/FavoritesPage";
import CompareBar from "./components/CompareBar";
import AdminDashboard from "./pages/AdminDashboard";
import VehicleSearch from "./pages/VehicleSearch";
import VehicleRequest from "./pages/VehicleRequest";
import UserDashboard from "./pages/UserDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import About from "./pages/About";
import ContactPage from "./pages/ContactPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dealers" component={Dealers} />
        <Route path="/dealer/:slug" component={DealerProfile} />
        <Route path="/vehicles" component={VehicleSearch} />
        <Route path="/vehicle/:id" component={VehicleDetail} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/map" component={MapPage} />
        <Route path="/dealer/:slug/reviews" component={ReviewsPage} />
        <Route path="/compare" component={ComparePage} />
        <Route path="/favorites" component={FavoritesPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/search" component={VehicleSearch} />
        <Route path="/vehicle-request" component={VehicleRequest} />
        <Route path="/account" component={UserDashboard} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      <CompareBar />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <CompareProvider>
          <FavoritesProvider>
            <ThemeProvider defaultTheme="light">
              <TooltipProvider>
                <Toaster position="top-center" richColors />
                <Router />
              </TooltipProvider>
            </ThemeProvider>
          </FavoritesProvider>
        </CompareProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
