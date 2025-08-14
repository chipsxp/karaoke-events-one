
"use client"

import { useEffect, useState } from 'react'
import { Input } from '../ui/input';
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon, X } from 'lucide-react';
const Search = ({ placeholder = 'Search events...' }: { placeholder?: string }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      let newUrl = '';

      if(query) {
        newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: 'query',
          value: query
        })
      } else {
        newUrl = removeKeysFromQuery({
          params: searchParams.toString(),
          keysToRemove: ['query']
        })
      }

      router.push(newUrl, { scroll: false });
    }, 300)

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchParams, router])

  const clearSearch = () => {
    setQuery('');
    const newUrl = removeKeysFromQuery({
      params: searchParams.toString(),
      keysToRemove: ['query']
    });
    router.push(newUrl, { scroll: false });
  };

  return (
    <div
      className={`relative flex-center min-h-[56px] w-full overflow-hidden rounded-full bg-white border-2 transition-all duration-300 ${
        isFocused ? 'border-purple-500 shadow-lg shadow-purple-500/20 scale-102' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex-center pl-4 pr-2">
        <SearchIcon className={`h-5 w-5 transition-colors ${
          isFocused ? 'text-purple-500' : 'text-gray-400'
        }`} />
      </div>

      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="flex-1 border-0 bg-transparent outline-offset-0 placeholder:text-gray-400 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-100 pr-10"
      />

      {query && (
        <button
          onClick={clearSearch}
          className="absolute right-3 p-1 text-gray-100 hover:text-gray-400 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default Search;