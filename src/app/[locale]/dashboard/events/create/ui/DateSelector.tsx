"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EventFormValues } from "./EventForm";

interface DateSelectorProps {
  form: UseFormReturn<EventFormValues>;
}

export default function DateSelector({ form }: DateSelectorProps) {
  const t = useTranslations("events.artistSelector");
  const [selectedDates, setSelectedDates] = useState<Date[]>(form.getValues().dates || []);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Check if the date is already selected
    const dateExists = selectedDates.some((d) => d.toDateString() === date.toDateString());

    if (dateExists) {
      // Remove the date if already selected
      const newDates = selectedDates.filter((d) => d.toDateString() !== date.toDateString());
      setSelectedDates(newDates);
      form.setValue("dates", newDates, { shouldValidate: true });
    } else {
      // Add the date if not selected
      const newDates = [...selectedDates, date];
      setSelectedDates(newDates);
      form.setValue("dates", newDates, { shouldValidate: true });
    }
  };

  return (
    <FormField
      control={form.control}
      name="dates"
      render={() => (
        <FormItem>
          <FormLabel>{t("selectDate")}</FormLabel>
          <div className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDates.length && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDates.length
                    ? `${selectedDates.length} ${
                        selectedDates.length > 1 ? t("removeDates") : t("addDate")
                      }`
                    : t("selectDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="multiple"
                  onSelect={(dates) => {
                    if (Array.isArray(dates)) {
                      setSelectedDates(dates);
                      form.setValue("dates", dates, { shouldValidate: true });
                    } else if (dates) {
                      handleDateSelect(dates);
                    }
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  selected={selectedDates}
                />
              </PopoverContent>
            </Popover>

            {selectedDates.length > 0 && (
              <div className="mt-2 space-y-2">
                <h4 className="text-sm font-medium">{t("selectDate")}:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((date, index) => (
                    <div
                      key={index}
                      className="bg-muted flex items-center rounded-md px-3 py-1 text-sm"
                    >
                      {format(date, "dd/MM/yyyy")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
