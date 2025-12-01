import type { Category } from "@/data/static";
import { cn } from "@/lib/utils";
import {
  BeanIcon,
  CandyIcon,
  CroissantIcon,
  DrumstickIcon,
  EggFriedIcon,
  FishIcon,
  HamIcon,
  IceCreamConeIcon,
  MartiniIcon,
  PizzaIcon,
  SaladIcon,
  SandwichIcon,
  ShellIcon,
  SoupIcon,
  TorusIcon,
  UtensilsIcon,
} from "lucide-react";

const sizes = {
  sm: "size-5",
  md: "size-8",
};

type Size = keyof typeof sizes;

const iconStyles = "text-primary text-center";

export function CategoryIcon({
  category,
  size = "md",
}: {
  category: Category;
  size?: Size;
}) {
  switch (category) {
    case "bread & bakery":
      return <CroissantIcon className={cn(iconStyles, sizes[size])} />;
    case "breakfast":
      return <EggFriedIcon className={cn(iconStyles, sizes[size])} />;
    case "burger":
      return <BurgerIcon className={cn(iconStyles, sizes[size])} />;
    case "chicken":
      return <DrumstickIcon className={cn(iconStyles, sizes[size])} />;
    case "dessert":
      return <IceCreamConeIcon className={cn(iconStyles, sizes[size])} />;
    case "drinks":
      return <MartiniIcon className={cn(iconStyles, sizes[size])} />;
    case "grill & barbecue":
      return <HamIcon className={cn(iconStyles, sizes[size])} />;
    case "doener":
      return <BeanIcon className={cn(iconStyles, sizes[size])} />;
    case "noodles":
      return <ShellIcon className={cn(iconStyles, sizes[size])} />;
    case "pizza":
      return <PizzaIcon className={cn(iconStyles, sizes[size])} />;
    case "salad":
      return <SaladIcon className={cn(iconStyles, sizes[size])} />;
    case "sandwich":
      return <SandwichIcon className={cn(iconStyles, sizes[size])} />;
    case "seafood":
      return <FishIcon className={cn(iconStyles, sizes[size])} />;
    case "snack":
      return <CandyIcon className={cn(iconStyles, sizes[size])} />;
    case "soup":
      return <SoupIcon className={cn(iconStyles, sizes[size])} />;
    case "sushi":
      return <TorusIcon className={cn(iconStyles, sizes[size])} />;
    default:
      return <UtensilsIcon className={cn(iconStyles, sizes[size])} />;
  }
}

function BurgerIcon({ className }: { className?: string }) {
  return (
    <svg
      height="200px"
      width="200px"
      version="1.1"
      className={cn(className, "fill-primary")}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      enableBackground="new 0 0 512 512"
    >
      <g strokeWidth="0"></g>
      <g strokeLinecap="round" strokeLinejoin="round"></g>
      <g>
        <path d="m480.7,228.6h-449.2c-11.3,0-20.4-9.1-20.4-20.4v-29.7c-1.77636e-15-92.4 75.1-167.5 167.4-167.5h155.1c92.3,0 167.5,75.1 167.5,167.5v29.7c0,11.2-9.2,20.4-20.4,20.4zm-428.8-40.9h408.3v-9.3c0-69.8-56.8-126.6-126.6-126.6h-155.1c-69.8,0-126.6,56.8-126.6,126.6v9.3z"></path>
      </g>
      <g>
        <path d="M435.4,501H76.7c-36.2,0-65.6-29.4-65.6-65.6v-54.2c0-11.3,9.1-20.4,20.4-20.4h449.1c11.3,0,20.4,9.1,20.4,20.4v54.2 C501.1,471.6,471.6,501,435.4,501z M51.9,401.6v33.8c0,13.7,11.1,24.8,24.8,24.8h358.7c13.7,0,24.8-11.1,24.8-24.8v-33.8H51.9z"></path>
      </g>
      <g>
        <path d="m31.5,334.7c-7.2,0-14.2-3.8-17.9-10.6-5.4-9.9-1.8-22.3 8.1-27.7l42-23c25.1-13.8 56.3-13.8 81.5,0 13,7.1 29.2,7.1 42.2,0l18.9-10.4c25.1-13.8 56.4-13.8 81.5,0l17.5,9.6c13,7.1 29.2,7.1 42.2,0l20.5-11.3c25.1-13.8 56.3-13.8 81.5,0l41.1,22.6c9.9,5.4 13.5,17.8 8.1,27.7-5.4,9.9-17.8,13.5-27.7,8.1l-41.1-22.5c-13-7.1-29.2-7.1-42.2,0l-20.5,11.3c-25.1,13.8-56.3,13.8-81.5,0l-17.5-9.6c-13-7.1-29.2-7.1-42.2,0l-19,10.2c-25.1,13.8-56.4,13.8-81.5,0-13-7.1-29.2-7.1-42.2,0l-42,23c-3.1,1.8-6.5,2.6-9.8,2.6z"></path>
      </g>
    </svg>
  );
}
