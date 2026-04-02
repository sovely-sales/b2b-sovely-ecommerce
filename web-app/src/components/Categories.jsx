import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { getCategoryIcon } from '../utils/categoryIcons';

function Categories({ onSelectCategory }) {
    const scrollContainerRef = useRef(null);

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data.data || [];
        },
    });

    const categories = dbCategories
        .filter((cat, index, list) => {
            const normalizedName = cat.name.trim().toLowerCase();
            return (
                index ===
                list.findIndex((item) => item.name.trim().toLowerCase() === normalizedName)
            );
        })
        .map((cat) => {
            const visual = getCategoryIcon(cat.name);
            return {
                _id: cat._id,
                name: cat.name,
                Icon: visual.Icon,
                color: visual.color,
                iconColor: visual.iconColor,
            };
        });

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="border-y border-slate-100 bg-white py-12" id="categories">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                            Explore Wholesale Categories
                        </h2>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                            Source high-margin inventory tailored to your business niche.
                        </p>
                    </div>
                </div>

                <div className="group relative">
                    {}
                    <button
                        onClick={() => scroll('left')}
                        className="flex-h-12 absolute top-1/2 -left-5 z-10 hidden w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 hover:scale-110 hover:bg-white hover:text-slate-900 md:flex"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {}
                    <div
                        ref={scrollContainerRef}
                        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
                    >
                        {categories.map((cat, index) => (
                            <button
                                key={`${cat._id || cat.name}-${index}`}
                                id={`category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                onClick={() => onSelectCategory && onSelectCategory(cat.name)}
                                className="group flex min-w-[140px] shrink-0 snap-start flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 focus:outline-none"
                            >
                                <div
                                    className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                                    style={{
                                        backgroundColor: cat.color,
                                        color: cat.iconColor,
                                    }}
                                >
                                    <cat.Icon size={28} strokeWidth={1.8} />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-center text-sm font-bold text-slate-700 transition-colors group-hover:text-slate-900">
                                        {cat.name}
                                    </span>
                                    <span className="text-center text-[10px] font-bold text-slate-400">
                                        {dbCategories.find(c => c.name === cat.name)?.productCount || 0}+ Products
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {}
                    <button
                        onClick={() => scroll('right')}
                        className="flex-h-12 absolute top-1/2 -right-5 z-10 hidden w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 hover:scale-110 hover:bg-white hover:text-slate-900 md:flex"
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </section>
    );
}

export default Categories;
