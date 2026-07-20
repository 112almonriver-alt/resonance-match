import { NavLink } from "react-router-dom";

const items = [
  { to: "/feed", label: "Лента" },
  { to: "/matches", label: "Мэтчи" },
  { to: "/events", label: "События" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-panel border-t border-white/10">
      <div className="max-w-md mx-auto flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 text-center py-3.5 text-sm font-display ${
                isActive ? "text-accent" : "text-text-muted"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
