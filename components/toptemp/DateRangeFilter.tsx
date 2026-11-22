"use client"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { formUrlQuery, removeKeysFromQuery } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { DateRange } from "react-day-picker"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

const DateRangeFilter = () => {
  const [date, setDate] = useState<DateRange | undefined>()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    if (startDateParam || endDateParam) {
      setDate({
        from: startDateParam ? new Date(startDateParam) : undefined,
        to: endDateParam ? new Date(endDateParam) : undefined,
      })
    } else {
      setDate(undefined)
    }
  }, [searchParams])

  const onSelectRange = (range: DateRange | undefined) => {
    setDate(range)
    
    if (range?.from || range?.to) {
      let newUrl = searchParams.toString()
      
      if (range?.from) {
        newUrl = formUrlQuery({
          params: newUrl,
          key: 'startDate',
          value: range.from.toISOString()
        })
      } else {
        newUrl = removeKeysFromQuery({
          params: newUrl,
          keysToRemove: ['startDate']
        })
      }
      
      if (range?.to) {
        newUrl = formUrlQuery({
          params: newUrl,
          key: 'endDate',
          value: range.to.toISOString()
        })
      } else {
        newUrl = removeKeysFromQuery({
          params: newUrl,
          keysToRemove: ['endDate']
        })
      }
      
      router.push(newUrl, { scroll: false })
    } else {
      const newUrl = removeKeysFromQuery({
        params: searchParams.toString(),
        keysToRemove: ['startDate', 'endDate']
      })
      router.push(newUrl, { scroll: false })
    }
  }

  const clearDates = () => {
    setDate(undefined)
    const newUrl = removeKeysFromQuery({
      params: searchParams.toString(),
      keysToRemove: ['startDate', 'endDate']
    })
    router.push(newUrl, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-h-14 w-full justify-start rounded-full border-2 border-gray-200 bg-white px-5 py-2.5 text-left font-normal text-gray-700 hover:border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Filter by date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-h-[420px] overflow-y-auto rounded-2xl border-gray-200 bg-white p-2 shadow-xl"
          align="start"
          sideOffset={8}
        >
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onSelectRange}
            numberOfMonths={2}
            className="rounded-xl bg-white"
          />
        </PopoverContent>
      </Popover>
      
      {(date?.from || date?.to) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearDates}
          className="h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default DateRangeFilter