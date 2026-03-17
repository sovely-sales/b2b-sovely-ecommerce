import { useQuery } from '@tanstack/react-query';
import { productApi } from '../features/products/api/productApi';
import { getCategoryIcon } from '../utils/categoryIcons';

function Categories({ onSelectCategory }) {
    const { data: dbCategories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: productApi.getCategories
    });

    const categories = dbCategories
    .filter((cat, index, list) => {
        const normalizedName = cat.name.trim().toLowerCase();
        return index === list.findIndex(item => item.name.trim().toLowerCase() === normalizedName);
    })
    .map(cat => {
        const visual = getCategoryIcon(cat.name);
        return {
            _id: cat._id,
            name: cat.name,
            Icon: visual.Icon,
            color: visual.color,
            iconColor: visual.iconColor
        };
    });

    const duplicatedCategories = [...categories, ...categories];

    return (
        <section className="categories-section" id="categories">
            <div className="section-container">
                <div className="section-header">
                    <h2 className="section-title">Shop Our Top Categories</h2>
                    <p className="section-subtitle">Discover products across all major niches</p>
                </div>

                {}
                <div className="categories-marquee-wrapper">
                    <div className="categories-marquee-track">
                        {duplicatedCategories.map((cat, index) => (
                            <button
                                key={`${cat._id || cat.name}-${index}`}
                                className="category-card"
                                id={`category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                onClick={() => onSelectCategory && onSelectCategory(cat.name)}
                                style={{ border: 'none', cursor: 'pointer', textAlign: 'center' }}
                            >
                                <div className="category-icon" style={{ backgroundColor: cat.color, color: cat.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <cat.Icon size={24} strokeWidth={1.8} />
                                </div>
                                <span className="category-name">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Categories;
