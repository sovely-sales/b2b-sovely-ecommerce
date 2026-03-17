import {
    Laptop, Shirt, Gem, Baby, ShoppingBag, Pill, Sparkles, Utensils, Dog, Package,
    Gamepad2, Factory, TreePine, Printer, Car, Armchair, Church, Heart,
    Wrench, Palette, Camera, Dumbbell
} from 'lucide-react';

export const getCategoryIcon = (categoryName) => {
    if (!categoryName) return { Icon: Package, color: '#F1F5F9', iconColor: '#475569' };

    const name = categoryName.toLowerCase();

    if (name.includes('electronic')) return { Icon: Laptop, color: '#D1FAE5', iconColor: '#059669' };
    if (name.includes('toy') || name.includes('game')) return { Icon: Gamepad2, color: '#E0E7FF', iconColor: '#4F46E5' };
    if (name.includes('business') || name.includes('industrial')) return { Icon: Factory, color: '#F1F5F9', iconColor: '#475569' };
    if (name.includes('home') || name.includes('garden')) return { Icon: TreePine, color: '#DCFCE7', iconColor: '#16A34A' };
    if (name.includes('apparel') || name.includes('clothing') || name.includes('accessor')) return { Icon: Shirt, color: '#FEE2E2', iconColor: '#DC2626' };
    if (name.includes('office') || name.includes('suppli')) return { Icon: Printer, color: '#E0E7FF', iconColor: '#6366F1' };
    if (name.includes('vehicle') || name.includes('part')) return { Icon: Car, color: '#F1F5F9', iconColor: '#64748B' };
    if (name.includes('furniture')) return { Icon: Armchair, color: '#F3E8FF', iconColor: '#7C3AED' };
    if (name.includes('religious') || name.includes('ceremonial')) return { Icon: Church, color: '#FEF3C7', iconColor: '#B45309' };
    if (name.includes('baby') || name.includes('toddler')) return { Icon: Baby, color: '#FCE7F3', iconColor: '#DB2777' };
    if (name.includes('health') || name.includes('beauty')) return { Icon: Heart, color: '#FFE4E6', iconColor: '#E11D48' };
    if (name.includes('hardware')) return { Icon: Wrench, color: '#FEF9C3', iconColor: '#CA8A04' };
    if (name.includes('art') || name.includes('entertainment')) return { Icon: Palette, color: '#EDE9FE', iconColor: '#8B5CF6' };
    if (name.includes('luggage') || name.includes('bag')) return { Icon: ShoppingBag, color: '#FEF3C7', iconColor: '#D97706' };
    if (name.includes('animal') || name.includes('pet')) return { Icon: Dog, color: '#FFEDD5', iconColor: '#C2410C' };
    if (name.includes('camera') || name.includes('optic')) return { Icon: Camera, color: '#DBEAFE', iconColor: '#2563EB' };
    if (name.includes('food') || name.includes('beverage')) return { Icon: Utensils, color: '#FFF7ED', iconColor: '#EA580C' };
    if (name.includes('sport')) return { Icon: Dumbbell, color: '#DCFCE7', iconColor: '#15803D' };
    if (name.includes('jewelry') || name.includes('jewel')) return { Icon: Gem, color: '#FDF4FF', iconColor: '#C026D3' };
    if (name.includes('cosmetic')) return { Icon: Sparkles, color: '#F3E8FF', iconColor: '#9333EA' };
    if (name.includes('medical') || name.includes('care')) return { Icon: Pill, color: '#FCE7F3', iconColor: '#DB2777' };

    return { Icon: Package, color: '#F1F5F9', iconColor: '#475569' };
};
