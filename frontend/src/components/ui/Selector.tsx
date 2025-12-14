import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface SelectorOption {
    value: string
    label: string
    icon?: React.ReactNode
}

interface SelectorProps {
    value: string
    options: SelectorOption[]
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function Selector({
    value,
    options,
    onChange,
    placeholder = "Select...",
    className,
}: SelectorProps) {
    const selectedOption = options.find((opt) => opt.value === value)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg transition-all text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedOption?.icon && <span className="text-gray-500 shrink-0">{selectedOption.icon}</span>}
                        <span className={cn("truncate", !selectedOption && "text-gray-400")}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400 shrink-0 ml-2" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px] p-1">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md cursor-pointer",
                            value === option.value ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                        )}
                    >
                        {option.icon && <span className={cn("shrink-0", value === option.value ? "text-blue-500" : "text-gray-500")}>{option.icon}</span>}
                        <span>{option.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
