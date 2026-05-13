"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CalendarDropdownProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export const CalendarDropdown = ({ value, onChange, placeholder = "Select Date" }: CalendarDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderHeader = () => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-surface-container rounded-full transition-colors">
        <ChevronLeft className="w-4 h-4 text-outline" />
      </button>
      <span className="font-headline italic text-on-surface text-sm">
        {format(currentMonth, "MMMM yyyy")}
      </span>
      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-surface-container rounded-full transition-colors">
        <ChevronRight className="w-4 h-4 text-outline" />
      </button>
    </div>
  );

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] uppercase tracking-widest text-outline/50 font-bold py-2">
            {day[0]}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isSelected = value && isSameDay(day, new Date(value));
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        days.push(
          <button
            key={day.toString()}
            onClick={() => {
              onChange(format(cloneDay, "yyyy-MM-dd"));
              setIsOpen(false);
            }}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg text-[11px] transition-all duration-300 relative group",
              !isCurrentMonth ? "text-outline/20" : "text-on-surface hover:bg-primary/10",
              isSelected ? "bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 scale-110" : "",
              isToday(day) && !isSelected ? "text-primary border border-primary/30" : ""
            )}
          >
            {format(day, "d")}
            {isToday(day) && !isSelected && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-1 px-2" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div className="pb-4">{rows}</div>;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-full text-[11px] uppercase tracking-wider font-label font-bold text-on-surface hover:border-primary/40 transition-all group"
      >
        <CalendarIcon className={cn("w-4 h-4 transition-colors", value ? "text-primary" : "text-outline")} />
        <span className={cn(value ? "text-on-surface" : "text-outline/50")}>
          {value ? format(new Date(value), "MMM d, yyyy") : placeholder}
        </span>
        {value && (
          <X 
            className="w-3 h-3 ml-auto text-outline hover:text-error transition-colors" 
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 z-50 w-64 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden"
          >
            {renderHeader()}
            <div className="p-2">
              {renderDays()}
              {renderCells()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
