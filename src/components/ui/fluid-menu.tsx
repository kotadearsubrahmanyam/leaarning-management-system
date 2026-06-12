"use client"

import React, { useState } from "react"
import { ChevronDown } from "lucide-react"

interface MenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
  showChevron?: boolean
}

export function Menu({ trigger, children, align = "left", showChevron = true }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer inline-flex items-center"
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
        {showChevron && (
          <ChevronDown className="ml-2 -mr-1 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-9 focus:outline-none z-50`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  icon?: React.ReactNode
  isActive?: boolean
  title?: string
}

export function MenuItem({ children, onClick, disabled = false, icon, isActive = false, title }: MenuItemProps) {
  return (
    <div className="relative flex items-center w-full h-full">
      <button
        className={`relative flex items-center justify-center w-16 h-16 rounded-full group
          ${disabled ? "text-muted-foreground cursor-not-allowed" : "text-muted-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800/50"}
          ${isActive ? "bg-primary/10 text-primary" : ""}
        `}
        role="menuitem"
        onClick={onClick}
        disabled={disabled}
      >
        {icon && (
          <span className="h-6 w-6 transition-all duration-200 group-hover:[&_svg]:stroke-[2.5]">
            {icon}
          </span>
        )}
      </button>

      {(title || children) && (
        <div className="absolute left-[80px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md border border-slate-200/50 dark:border-white/10 px-4 py-2.5 rounded-xl whitespace-nowrap font-medium text-[14px] text-slate-700 pointer-events-none">
          {title || children}
        </div>
      )}
    </div>
  )
}

export function MenuContainer({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const childrenArray = React.Children.toArray(children)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="relative w-[64px] pointer-events-auto" data-expanded={isExpanded}>
      {/* Spacer to force scroll height for overflowing items */}
      <div 
        className="transition-all duration-300 w-full"
        style={{ height: isExpanded ? `${(childrenArray.length) * 72 + 20}px` : '64px' }}
      />
      
      {/* Container for all items */}
      <div className="absolute top-0 left-0">
        {/* First item - always visible */}
        <div 
          className="relative w-16 h-16 bg-white dark:bg-gray-800 cursor-pointer rounded-full group will-change-transform z-50 shadow-md border border-slate-200/50 dark:border-white/10 backdrop-blur-md"
          onClick={handleToggle}
        >
          {childrenArray[0]}
        </div>

        {/* Other items */}
        {childrenArray.slice(1).map((child, index) => (
          <div 
            key={index} 
            className="absolute top-0 left-0 w-16 h-16 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md border border-slate-200/50 dark:border-white/10 rounded-full will-change-transform"
            style={{
              transform: `translateY(${isExpanded ? (index + 1) * 72 : 0}px)`,
              opacity: isExpanded ? 1 : 0,
              zIndex: 40 - index,
              pointerEvents: isExpanded ? 'auto' : 'none',
              transition: `transform ${isExpanded ? '300ms' : '300ms'} cubic-bezier(0.4, 0, 0.2, 1),
                         opacity ${isExpanded ? '300ms' : '350ms'}`,
              backfaceVisibility: 'hidden',
              perspective: 1000,
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
