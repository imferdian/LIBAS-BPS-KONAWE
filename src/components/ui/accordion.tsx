import * as React from "react"
import { cn } from "cn"
import { ChevronDown } from "lucide-react"

const AccordionContext = React.createContext<{
  value: string[];
  onChange: (value: string) => void;
}>({ value: [], onChange: () => {} });

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  collapsible?: boolean;
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, type = "single", collapsible = false, value, onValueChange, ...props }, ref) => {
    const [openItems, setOpenItems] = React.useState<string[]>(
      Array.isArray(value) ? value : value ? [value] : []
    );

    const handleChange = (itemValue: string) => {
      let newOpenItems: string[];
      if (type === "single") {
        newOpenItems = openItems.includes(itemValue) && collapsible ? [] : [itemValue];
      } else {
        newOpenItems = openItems.includes(itemValue)
          ? openItems.filter((v) => v !== itemValue)
          : [...openItems, itemValue];
      }
      setOpenItems(newOpenItems);
      onValueChange?.(type === "single" ? newOpenItems[0] || "" : newOpenItems);
    };

    return (
      <AccordionContext.Provider value={{ value: openItems, onChange: handleChange }}>
        <div ref={ref} className={cn("space-y-0", className)} {...props} />
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, ...props }, ref) => (
    <div ref={ref} className={cn("border-b border-border/50", className)} data-state={useAccordionContext().value.includes(value) ? "open" : "closed"} {...props} />
  )
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { value: openItems, onChange } = useAccordionContext();
    const itemValue = React.useContext(CurrentAccordionItemContext);

    return (
      <button
        ref={ref}
        className={cn(
          "flex w-full items-center justify-between py-3 text-sm font-medium transition-all hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        onClick={() => onChange(itemValue)}
        data-state={openItems.includes(itemValue) ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { value: openItems } = useAccordionContext();
    const itemValue = React.useContext(CurrentAccordionItemContext);
    const isOpen = openItems.includes(itemValue);

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[1000px]" : "max-h-0",
          className
        )}
        {...props}
      >
        <div className="pb-4 pt-0">{children}</div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

const CurrentAccordionItemContext = React.createContext<string>("");

// Wrapper to provide current item value
const AccordionItemInner = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, children, ...props }, ref) => (
    <AccordionItem ref={ref} value={value} {...props}>
      <CurrentAccordionItemContext.Provider value={value}>
        {children}
      </CurrentAccordionItemContext.Provider>
    </AccordionItem>
  )
);
AccordionItemInner.displayName = "AccordionItemInner";

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("Accordion components must be used within <Accordion>");
  return context;
}

export { Accordion, AccordionItemInner as AccordionItem, AccordionTrigger, AccordionContent };
