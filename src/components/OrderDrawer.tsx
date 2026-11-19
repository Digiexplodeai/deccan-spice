import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { SITE_INFO, type DishItem } from "../data/site";

export interface CartEntry {
  dish: DishItem;
  quantity: number;
}

interface OrderDrawerProps {
  isOpen: boolean;
  items: CartEntry[];
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function OrderDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: OrderDrawerProps) {
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [pickupWindow, setPickupWindow] = useState("25–30 mins (ASAP)");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const subtotal = items.reduce(
    (sum, entry) => sum + entry.dish.price * entry.quantity,
    0
  );
  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  const handlePlaceOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || items.length === 0) return;
    setOrderNumber(`DS-${Math.floor(1000 + Math.random() * 9000)}`);
    onClearCart();
  };

  const handleClose = () => {
    setOrderNumber(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="order-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Pickup Order Bag"
          onClick={handleClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md h-full bg-[#10110F] text-[#FFF9F1] border-l border-[#D9B780]/35 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#12352B] border-b border-[#D9B780]/25 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#D9B780]" />
                <div>
                  <h2 className="font-display text-xl text-[#FFF9F1]">
                    Pickup Order
                  </h2>
                  <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#D9B780]">
                    {SITE_INFO.center}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-11 h-11 border border-[#D9B780]/35 flex items-center justify-center hover:border-[#D9B780] transition-colors"
                aria-label="Close order drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
              {orderNumber ? (
                <div className="space-y-5">
                  <div className="p-5 bg-[#12352B]/70 border border-[#D9B780]/40 flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#D9B780] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-display text-xl text-[#FFF9F1]">
                        Order {orderNumber} Confirmed
                      </p>
                      <p className="text-[0.84rem] text-[#F7F2E9]">
                        Estimated pickup: {pickupWindow} at {SITE_INFO.address}. Pay
                        in person upon pickup.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-3 bg-[#D9B780] text-[#10110F] text-[0.78rem] uppercase tracking-[0.1em] font-medium min-h-[44px]"
                  >
                    Return to Menu
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <p className="font-display text-2xl text-[#FFF9F1]">
                    Your pickup bag is empty
                  </p>
                  <p className="text-[0.86rem] text-[#F7F2E9]/75 max-w-xs mx-auto">
                    Add biryanis, tandoori sizzlers, or regional curries from the
                    menu.
                  </p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-[#D9B780]/20">
                    {items.map(({ dish, quantity }) => (
                      <li
                        key={dish.id}
                        className="py-3.5 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="font-display text-[1.12rem] text-[#FFF9F1]">
                            {dish.name}
                          </p>
                          <p className="text-[0.78rem] text-[#D9B780] tabular-nums">
                            ${dish.price.toFixed(2)} each
                          </p>
                          <div className="inline-flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(dish.id, -1)}
                              className="w-10 h-10 border border-[#D9B780]/35 flex items-center justify-center hover:border-[#D9B780]"
                              aria-label={`Decrease quantity of ${dish.name}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[0.84rem] font-medium tabular-nums w-6 text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(dish.id, 1)}
                              className="w-10 h-10 border border-[#D9B780]/35 flex items-center justify-center hover:border-[#D9B780]"
                              aria-label={`Increase quantity of ${dish.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[0.9rem] font-medium tabular-nums">
                            ${(dish.price * quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(dish.id)}
                            className="text-[#F7F2E9]/70 hover:text-[#D9B780] p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                            aria-label={`Remove ${dish.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <form
                    id="pickup-order-form"
                    onSubmit={handlePlaceOrder}
                    className="space-y-3.5 pt-4 border-t border-[#D9B780]/20"
                  >
                    <p className="text-[0.7rem] uppercase tracking-[0.14em] text-[#D9B780] font-medium">
                      Pickup Details (Pay at Counter)
                    </p>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3.5 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    />
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="Mobile phone number"
                      className="w-full px-3.5 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] tabular-nums focus:outline-none focus:border-[#D9B780]"
                    />
                    <select
                      value={pickupWindow}
                      onChange={(e) => setPickupWindow(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    >
                      <option value="25–30 mins (ASAP)" className="bg-[#10110F]">
                        25–30 mins (ASAP)
                      </option>
                      <option value="Lunch Pickup (12:30 PM)" className="bg-[#10110F]">
                        Lunch Pickup (12:30 PM)
                      </option>
                      <option value="Dinner Pickup (6:00 PM)" className="bg-[#10110F]">
                        Dinner Pickup (6:00 PM)
                      </option>
                      <option value="Dinner Pickup (7:30 PM)" className="bg-[#10110F]">
                        Dinner Pickup (7:30 PM)
                      </option>
                    </select>
                  </form>
                </>
              )}
            </div>

            {items.length > 0 && !orderNumber && (
              <div className="p-6 border-t border-[#D9B780]/25 bg-[#12352B]/75 space-y-4">
                <div className="space-y-1.5 text-[0.84rem] tabular-nums">
                  <div className="flex justify-between text-[#F7F2E9]">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#F7F2E9]">
                    <span>Estimated FL Tax (7%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[1rem] font-medium text-[#FFF9F1] pt-2 border-t border-[#D9B780]/20">
                    <span>Total Due at Pickup</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  form="pickup-order-form"
                  className="w-full py-3.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/55 text-[#FFF9F1] text-[0.78rem] font-medium tracking-[0.1em] uppercase transition-colors min-h-[44px]"
                >
                  Submit Pickup Order
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
