import { cn } from "@/lib/utils";
import * as React from "react";
import { TouchableOpacity, View } from "react-native";

interface TabsProps extends React.ComponentPropsWithoutRef<typeof View> {
  value: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
}

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const Tabs = React.forwardRef<React.ElementRef<typeof View>, TabsProps>(
  ({ className, value, onValueChange, defaultValue = "", children, ...props }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(value || defaultValue);

    React.useEffect(() => {
      setSelectedValue(value);
    }, [value]);

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        setSelectedValue(newValue);
        onValueChange(newValue);
      },
      [onValueChange]
    );

    return (
      <TabsContext.Provider value={{ value: selectedValue, onValueChange: handleValueChange }}>
        <View ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </View>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs component");
  }
  return context;
};

const TabsList = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-accentGray p-1",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
  value: string;
}

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, TabsTriggerProps>(
  ({ className, value, onPress, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isSelected = value === selectedValue;

    return (
      <TouchableOpacity
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentGray focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isSelected && "bg-white text-textSecondary shadow-sm",
          className
        )}
        onPress={() => onValueChange(value)}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  value: string;
}

const TabsContent = React.forwardRef<React.ElementRef<typeof View>, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isSelected = value === selectedValue;

    if (!isSelected) return null;

    return (
      <View
        ref={ref}
        className={cn(
          "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentGray focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsContent, TabsList, TabsTrigger };

