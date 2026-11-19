import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { BrandIntro } from "./components/BrandIntro";
import { Footer } from "./components/Footer";
import { HomeSections } from "./components/HomeSections";
import { MobileActionBar } from "./components/MobileActionBar";
import { Navbar, type RouteId } from "./components/Navbar";
import { OrderDrawer, type CartEntry } from "./components/OrderDrawer";
import { ReserveModal } from "./components/ReserveModal";
import type { DishItem } from "./data/site";
import {
  AnimationProvider,
  ScrollProgressBar,
  useAnimationSystem,
} from "./lib/animations";

const MenuPage = lazy(() =>
  import("./components/MenuPage").then((m) => ({ default: m.MenuPage }))
);
const BuffetPage = lazy(() =>
  import("./components/BuffetPage").then((m) => ({ default: m.BuffetPage }))
);
const GalleryPage = lazy(() =>
  import("./components/GalleryPage").then((m) => ({ default: m.GalleryPage }))
);
const AboutPage = lazy(() =>
  import("./components/AboutPage").then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import("./components/ContactPage").then((m) => ({ default: m.ContactPage }))
);
const OrderCustomerPage = lazy(() =>
  import("./components/dinein/OrderCustomerPage").then((m) => ({
    default: m.OrderCustomerPage,
  }))
);
const AdminDashboard = lazy(() =>
  import("./components/dinein/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  }))
);

function AppShell() {
  const [route, setRoute] = useState<RouteId>("home");
  const [introReady, setIntroReady] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);

  const { scrollToTop, refreshScrollTriggers } = useAnimationSystem();

  const handleIntroComplete = useCallback(() => {
    setIntroReady(true);
  }, []);

  const handleNavigate = (nextRoute: RouteId) => {
    setRoute(nextRoute);
    scrollToTop(true);
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      refreshScrollTriggers();
    }, 140);
    return () => window.clearTimeout(t);
  }, [route, refreshScrollTriggers]);

  const handleAddToOrder = (dish: DishItem) => {
    setCart((prev) => {
      const existing = prev.find((entry) => entry.dish.id === dish.id);
      if (existing) {
        return prev.map((entry) =>
          entry.dish.id === dish.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((entry) =>
          entry.dish.id === id
            ? { ...entry, quantity: entry.quantity + delta }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((entry) => entry.dish.id !== id));
  };

  const cartCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#10110F] text-[#FFF9F1]">
      <ScrollProgressBar />

      <BrandIntro onIntroComplete={handleIntroComplete} />

      <Navbar
        activeRoute={route}
        onNavigate={handleNavigate}
        onOpenReserve={() => setReserveOpen(true)}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {route === "home" ? (
              <HomeSections
                introReady={introReady}
                onNavigate={handleNavigate}
                onOpenReserve={() => setReserveOpen(true)}
              />
            ) : (
              <Suspense
                fallback={
                  <div className="min-h-[70vh] bg-[#10110F] flex items-center justify-center">
                    <span className="w-8 h-[1px] bg-[#D9B780] animate-pulse" />
                  </div>
                }
              >
                {route === "menu" && (
                  <MenuPage
                    onAddToOrder={handleAddToOrder}
                    cartCount={cartCount}
                    onOpenCart={() => setCartOpen(true)}
                  />
                )}
                {route === "buffet" && (
                  <BuffetPage onOpenReserve={() => setReserveOpen(true)} />
                )}
                {route === "gallery" && <GalleryPage />}
                {route === "about" && (
                  <AboutPage
                    onNavigate={handleNavigate}
                    onOpenReserve={() => setReserveOpen(true)}
                  />
                )}
                {route === "contact" && <ContactPage />}
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer
        onNavigate={handleNavigate}
        onOpenReserve={() => setReserveOpen(true)}
      />

      <MobileActionBar
        onNavigate={handleNavigate}
        onOpenReserve={() => setReserveOpen(true)}
      />

      {cartCount > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-[72px] md:bottom-6 right-4 z-30 inline-flex items-center gap-2 px-4 py-2.5 bg-[#12352B] hover:bg-[#811C36] text-[#FFF9F1] text-[0.76rem] font-medium tracking-[0.08em] uppercase shadow-xl border border-[#D9B780]/55 transition-colors min-h-[44px]"
          aria-label={`Open pickup order bag with ${cartCount} items`}
        >
          <ShoppingBag className="w-4 h-4 text-[#D9B780]" />
          <span>Bag</span>
          <span className="tabular-nums px-1.5 py-0.5 bg-[#811C36] text-[#FFF9F1] text-[0.72rem]">
            {cartCount}
          </span>
        </button>
      )}

      <ReserveModal
        isOpen={reserveOpen}
        onClose={() => setReserveOpen(false)}
      />

      <OrderDrawer
        isOpen={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
      />
    </div>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  if (currentPath.startsWith("/order")) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#10110F] text-[#D9B780] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#D9B780] border-t-transparent animate-spin mb-3" />
            <span className="text-xs tracking-widest uppercase font-serif">
              Deccan Spice Dine-In
            </span>
          </div>
        }
      >
        <OrderCustomerPage />
      </Suspense>
    );
  }

  if (currentPath.startsWith("/admin")) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#10110F] text-[#D9B780] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#D9B780] border-t-transparent animate-spin mb-3" />
            <span className="text-xs tracking-widest uppercase font-serif">
              Deccan Spice Staff Portal
            </span>
          </div>
        }
      >
        <AdminDashboard />
      </Suspense>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimationProvider>
        <AppShell />
      </AnimationProvider>
    </MotionConfig>
  );
}
