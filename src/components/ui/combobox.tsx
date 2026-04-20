import { type ReactNode, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { VoiceSearchButton } from "@/components/ui/voice-search-button"
import { DROPDOWN_MAX_VISIBLE_ITEMS_CLASS } from "@/components/shared/dropdown/constants"
import { releaseRadixBodyPointerAndScrollLock } from "@/lib/radix-body-unlock"
import { useTranslation } from "react-i18next"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  /** When set, shown in the trigger instead of the full option label (short text in compact buttons). */
  triggerValue?: string
  /** When set, shown in the trigger instead of the label (e.g. icon). Takes precedence over triggerValue. */
  triggerContent?: ReactNode
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  modal?: boolean
  disabled?: boolean
  title?: string
  /** Compact trigger: hide the chevron; trigger still opens the popover on click. */
  hideTriggerChevron?: boolean
  /** Merged into `PopoverContent` (e.g. `min-w-[220px] w-auto` when trigger is very narrow). */
  popoverContentClassName?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  triggerValue,
  triggerContent,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  modal = false,
  disabled = false,
  title,
  hideTriggerChevron = false,
  popoverContentClassName,
}: ComboboxProps) {
  const { t } = useTranslation('common')
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const resolvedPlaceholder = placeholder ?? t('common.select')
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('common.search')
  const resolvedEmptyText = emptyText ?? t('common.noResults')

  const selectedOption = options.find((option) => option.value === value)
  const useCompactTrigger = Boolean(
    selectedOption && (triggerValue !== undefined || triggerContent !== undefined)
  )

  useEffect(() => {
    setOpen(false)
    setSearchQuery("")
    releaseRadixBodyPointerAndScrollLock()
  }, [location.pathname, location.search, location.key])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) releaseRadixBodyPointerAndScrollLock()
      }}
      modal={modal}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          title={title}
          className={cn(
            "w-full font-normal",
            useCompactTrigger ? "justify-center gap-0.5" : "justify-between gap-2",
            !value && "text-muted-foreground",
            open && "ring-1 ring-cyan-200/50 ring-offset-0 dark:ring-[#00f7ff]/20",
            className
          )}
        >
          {useCompactTrigger ? (
            <span className="inline-flex min-w-0 max-w-full items-center justify-center gap-0.5">
              {triggerContent !== undefined ? (
                triggerContent
              ) : (
                <span className="shrink-0 text-center text-sm font-semibold leading-none tracking-wide">
                  {triggerValue}
                </span>
              )}
              {!hideTriggerChevron && (
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-slate-500 transition-all duration-200 dark:text-[#5c7c99]",
                    open && "rotate-180 text-cyan-600 dark:text-[#00f7ff]"
                  )}
                />
              )}
            </span>
          ) : (
            <>
              <span className="min-w-0 flex-1 truncate text-left">
                {selectedOption ? selectedOption.label : resolvedPlaceholder}
              </span>
              <ChevronDown
                className={cn(
                  "ml-0.5 h-4 w-4 shrink-0 text-slate-500 transition-all duration-200 dark:text-[#5c7c99]",
                  open && "rotate-180 text-cyan-600 dark:text-[#00f7ff]"
                )}
              />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={8}
        className={cn(
          "relative w-[--radix-popover-trigger-width] overflow-hidden p-0",
          "rounded-2xl border backdrop-blur-2xl",
          // Light: beyazımsı + hafif turkuaz (parlamayan)
          "border-cyan-100/75 bg-gradient-to-b from-white via-cyan-50/28 to-sky-50/38",
          "shadow-[0_0_0_1px_rgba(14,165,233,0.08),0_10px_36px_-10px_rgba(15,23,42,0.09)]",
          // Dark: ilk premium AQUA panel — aydınlıktaki `via-*` koyu modda kalmasın (orta şerit bug’ı)
          "dark:border-white/[0.09] dark:bg-gradient-to-b dark:from-[#0c1a2e]/[0.97] dark:via-[#0a1420] dark:to-[#040a12]/[0.98]",
          "dark:shadow-[0_0_0_1px_rgba(0,247,255,0.07),0_4px_6px_-1px_rgba(0,0,0,0.35),0_24px_48px_-12px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100 duration-200",
          popoverContentClassName
        )}
        align="start"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent dark:via-[#00f7ff]/35"
          aria-hidden
        />
        <Command className="bg-transparent text-slate-800 dark:text-white">
          <CommandInput
            placeholder={resolvedSearchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            wrapperClassName={cn(
              "h-12 items-stretch gap-2.5 border-0 border-b px-3.5 py-0",
              "border-cyan-100/55 bg-cyan-50/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]",
              "dark:border-white/[0.08] dark:bg-[#020712]/50 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
              "[&>svg:first-of-type]:mt-0 [&>svg:first-of-type]:size-[15px] [&>svg:first-of-type]:shrink-0 [&>svg:first-of-type]:self-center",
              "[&>svg:first-of-type]:text-teal-600/70 dark:[&>svg:first-of-type]:text-[#5c7c99]"
            )}
            className="h-12 min-h-0 flex-1 border-0 py-0 pl-0 pr-0 text-[13px] text-slate-800 shadow-none ring-0 placeholder:text-slate-400 focus:ring-0 focus-visible:ring-0 dark:text-[#e8f4ff] dark:placeholder:text-[#5c7c99]"
          >
            <VoiceSearchButton
              onResult={(text) => setSearchQuery(text)}
              className="h-8 w-8 shrink-0 text-teal-600/70 transition-all hover:bg-cyan-100/60 hover:text-teal-800 dark:text-[#5c7c99] dark:hover:bg-[#00f7ff]/12 dark:hover:text-[#00f7ff] dark:hover:shadow-[0_0_12px_rgba(0,247,255,0.2)]"
            />
          </CommandInput>
          <CommandList
            className={cn(
              DROPDOWN_MAX_VISIBLE_ITEMS_CLASS,
              "overflow-y-auto p-1.5 pt-1 custom-scrollbar",
              "space-y-0.5"
            )}
          >
            <CommandEmpty className="rounded-xl py-8 text-center text-[13px] text-slate-500 dark:text-[#5c7c99]">
              {resolvedEmptyText}
            </CommandEmpty>
            <CommandGroup className="p-0">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "min-h-10 items-center gap-0 rounded-xl border border-transparent px-2.5 py-2 text-left text-[13px] antialiased",
                    "text-slate-800 transition-all duration-200 dark:text-[#d0e6ff]",
                    // Light: seçili — hafif turkuaz
                    "data-[selected=true]:border-cyan-200/65 data-[selected=true]:bg-gradient-to-r",
                    "data-[selected=true]:from-cyan-100/50 data-[selected=true]:to-sky-100/35 data-[selected=true]:text-slate-900",
                    "data-[selected=true]:shadow-[inset_0_0_0_1px_rgba(14,165,233,0.12),0_2px_10px_rgba(14,165,233,0.07)]",
                    // Dark: ilk premium seçili satır (gradient + neon gölge)
                    "dark:data-[selected=true]:border-[#00f7ff]/25 dark:data-[selected=true]:bg-gradient-to-r",
                    "dark:data-[selected=true]:from-[#00f7ff]/15 dark:data-[selected=true]:to-[#0088ff]/8 dark:data-[selected=true]:text-white",
                    "dark:data-[selected=true]:shadow-[inset_0_0_0_1px_rgba(0,247,255,0.15),0_4px_20px_rgba(0,247,255,0.1)]"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2.5 h-4 w-4 shrink-0 text-teal-600/90 transition-opacity duration-200 dark:text-[#00f7ff] dark:drop-shadow-[0_0_6px_rgba(0,247,255,0.45)]",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0 flex-1 font-medium leading-snug [overflow-wrap:anywhere]">
                    {option.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
