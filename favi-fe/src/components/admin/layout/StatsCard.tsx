"use client";

import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  subtext?: string;
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  icon,
  iconColor = "text-primary",
  subtext,
  loading = false,
  trend,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className="shadow-lg border border-white/5 bg-[#0f172a]">
        <div className="flex items-center gap-4">
          <Skeleton width="3rem" height="3rem" borderRadius="50%" />
          <div className="flex-1">
            <Skeleton width="40%" height="1rem" className="mb-2" />
            <Skeleton width="60%" height="1.5rem" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-white/5 overflow-hidden bg-[#0f172a] group">
      <div className="flex items-center gap-6 p-1">
        <div className={`w-16 h-16 rounded-[2rem] bg-primary/20 flex items-center justify-center ${iconColor} border border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner`}>
          <i className={`${icon} text-3xl`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">{title}</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
            {trend && (
              <div
                className={`flex items-center text-[11px] font-black px-2 py-1 rounded-full ${trend.isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                  } border border-current/10`}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </div>
            )}
          </div>
          {subtext && (
            <p className="text-[11px] text-slate-500 mt-2 font-bold uppercase tracking-wider">{subtext}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
