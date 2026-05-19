import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface AutocompleteItem {
  value: string;
  label: string;
  description?: string;
}

interface AutocompleteProps {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  items: AutocompleteItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  /** Renders a "None" option at the top to clear the value */
  clearable?: boolean;
  clearLabel?: string;
}

export function Autocomplete({
  value,
  onValueChange,
  items,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  clearable = false,
  clearLabel = "None",
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);

  const selectedItem = items.find((i) => i.value === value);

  function handleSelect(val: string) {
    onValueChange(val === value ? "" : val);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          !selectedItem && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent
        className="w-(--anchor-width) min-w-48 p-0"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {clearable && (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                  }}
                  data-checked={!value}
                >
                  <span className="text-muted-foreground">{clearLabel}</span>
                </CommandItem>
              )}
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => handleSelect(item.value)}
                  data-checked={item.value === value}
                >
                  {item.label}
                  {item.description && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
