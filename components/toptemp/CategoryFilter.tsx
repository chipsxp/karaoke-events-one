"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAllCategories } from "@/lib/actions/category.actions";
import { ICategory } from "@/lib/database/models/category.model";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";


import { Tag } from "lucide-react";

const CategoryFilter = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const getCategories = async () => {
      try {
        const categoryList = await getAllCategories();
        categoryList && setCategories(categoryList as ICategory[]);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    getCategories();
  }, [])

  const onSelectCategory = (category: string) => {
      let newUrl = '';

      if(category && category !== 'All') {
        newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: 'category',
          value: category
        })
      } else {
        newUrl = removeKeysFromQuery({
          params: searchParams.toString(),
          keysToRemove: ['category']
        })
      }

      router.push(newUrl, { scroll: false });
  }

  return (
    <div>
      <Select
        onValueChange={(value: string) => onSelectCategory(value)}
        disabled={isLoading}
      >
        <SelectTrigger className="min-h-[56px] w-full rounded-full border-2 border-gray-200 bg-white px-5 py-2.5 text-gray-700 placeholder:text-gray-400 hover:border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <SelectValue placeholder={isLoading ? "Loading..." : "All Categories"} />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-gray-200 bg-white shadow-lg">
          <SelectItem
            value="All"
            className="rounded-lg py-3 px-4 hover:bg-purple-50 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700 cursor-pointer transition-colors"
          >
            All Categories
          </SelectItem>
          {categories.map((category) => (
            <SelectItem
              key={category._id}
              value={category.name}
              className="rounded-lg py-3 px-4 hover:bg-purple-50 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default CategoryFilter