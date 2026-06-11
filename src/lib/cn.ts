import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge måste känna projektets egna font-size-utilities
// (@theme-skalan i tailwind.css). Utan detta klassificeras t.ex. `text-small`
// som textfärg och merge:n droppar den riktiga färgklassen
// (`text-(--mm-btn-primary-text)` försvann ur Button — Session 14 K1-fynd).
// Skalans default-namn (lg, xl, 2xl …) är redan kända; bara de egna listas.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['caption', 'small', 'body'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
