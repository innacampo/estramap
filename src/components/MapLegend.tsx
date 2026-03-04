import { motion } from "framer-motion";

const items = [
  { color: "bg-in-stock", label: "In Stock" },
  { color: "bg-low-stock", label: "Low Stock" },
  { color: "bg-out-of-stock", label: "Out of Stock" },
];

const MapLegend = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.6 }}
    className="absolute bottom-4 left-4 z-[1000] glass rounded-xl px-3 py-2 shadow-premium"
  >
    <div className="flex items-center gap-3">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          <span className="text-[11px] font-medium text-foreground/80">{label}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

export default MapLegend;
