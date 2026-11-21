"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formUrlQuery, removeKeysFromQuery } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { DollarSign } from "lucide-react"

const PriceFilter = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onSelectPrice = (price: string) => {
    let newUrl = ''

    if (price && price !== 'all') {
      newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: 'price',
        value: price
      })
    } else {
      newUrl = removeKeysFromQuery({
        params: searchParams.toString(),
        keysToRemove: ['price']
      })
    }

    router.push(newUrl, { scroll: false })
  }

  return (
    <div>
      <Select onValueChange={onSelectPrice}>
        <SelectTrigger className="min-h-14 w-full rounded-full border-2 border-gray-200 bg-white px-5 py-2.5 text-gray-700 placeholder:text-gray-400 hover:border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <SelectValue placeholder="All Prices" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-gray-200 bg-white shadow-lg">
          <SelectItem
            value="all"
            className="rounded-lg py-3 px-4 hover:bg-purple-50 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700 cursor-pointer transition-colors"
          >
            All Prices
          </SelectItem>
          <SelectItem
            value="free"
            className="rounded-lg py-3 px-4 hover:bg-purple-50 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700 cursor-pointer transition-colors"
          >
            Free Events
          </SelectItem>
          <SelectItem
            value="paid"
            className="rounded-lg py-3 px-4 hover:bg-purple-50 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700 cursor-pointer transition-colors"
          >
            Paid Events
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default PriceFilter