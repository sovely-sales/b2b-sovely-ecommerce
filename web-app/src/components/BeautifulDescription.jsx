import React, { useMemo } from 'react';
import { CheckCircle2, Star, Tag, Ruler, Info, Target } from 'lucide-react';

const BeautifulDescription = ({ rawHtml }) => {
    const parsedData = useMemo(() => {
        if (!rawHtml) return null;

        const cleanText = rawHtml
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>?/gm, '')
            .replace(/&amp;/g, '&');

        const extract = (regex) => {
            const match = cleanText.match(regex);
            return match ? match[1].trim() : '';
        };

        const description = extract(/Description\s*:-([\s\S]*?)(?=Key Features\s*:-|Ideal For\s*:-|Specifications\s*:-|Keywords\s*:-|Dimension\s*:-|$)/i);
        const featuresRaw = extract(/Key Features\s*:-([\s\S]*?)(?=Ideal For\s*:-|Specifications\s*:-|Keywords\s*:-|Dimension\s*:-|$)/i);
        const idealForRaw = extract(/Ideal For\s*:-([\s\S]*?)(?=Specifications\s*:-|Keywords\s*:-|Dimension\s*:-|$)/i);
        const specsRaw = extract(/Specifications\s*:-([\s\S]*?)(?=Keywords\s*:-|Dimension\s*:-|$)/i);
        const keywordsRaw = extract(/Keywords\s*:-([\s\S]*?)(?=Dimension\s*:-|$)/i);
        const dimensionsRaw = extract(/Dimension\s*:-([\s\S]*?)(?=SKU:|$)/i);

        const features = featuresRaw.split('\n').map(s => s.trim()).filter(Boolean);
        const idealFor = idealForRaw.split('\n').map(s => s.trim()).filter(Boolean);
        const keywords = keywordsRaw.split(',').map(s => s.trim()).filter(Boolean);

        const specs = specsRaw.split('\n')
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => {
                const [key, ...val] = s.split(':');
                return { key: key?.trim(), value: val.join(':')?.trim() };
            }).filter(s => s.key && s.value);

        const dimensions = [];

        const dimMatches = dimensionsRaw.matchAll(/([A-Za-z. ()\n]+?):-\s*([\d.]+)/g);
        for (const match of dimMatches) {
            dimensions.push({ key: match[1].replace(/\n/g, '').trim(), value: match[2].trim() });
        }

        return { description, features, idealFor, specs, keywords, dimensions };
    }, [rawHtml]);

    if (!parsedData) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '20px', color: '#334155' }}>

            {}
            {parsedData.description && (
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', borderLeft: '4px solid #1b4332' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: '0 0 12px 0', fontSize: '1.2rem' }}>
                        <Info size={20} color="#1b4332" /> About this item
                    </h3>
                    <p style={{ lineHeight: '1.7', fontSize: '0.95rem', margin: 0 }}>{parsedData.description}</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {}
                {parsedData.features.length > 0 && (
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: '0 0 16px 0', fontSize: '1.1rem' }}>
                            <Star size={20} color="#eab308" /> Key Features
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {parsedData.features.map((feat, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.95rem' }}>
                                    <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span>{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {}
                {parsedData.idealFor.length > 0 && (
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: '0 0 16px 0', fontSize: '1.1rem' }}>
                            <Target size={20} color="#3b82f6" /> Ideal For
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {parsedData.idealFor.map((item, i) => (
                                <span key={i} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {}
            {(parsedData.specs.length > 0 || parsedData.dimensions.length > 0) && (
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: 0, padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '1.1rem' }}>
                        <Ruler size={20} color="#475569" /> Specifications & Dimensions
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', padding: '20px 24px', gap: '16px' }}>
                        {}
                        {parsedData.specs.map((spec, i) => (
                            <div key={`spec-${i}`} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{spec.key}</span>
                                <span style={{ color: '#0f172a', fontWeight: '500', fontSize: '0.9rem', textAlign: 'right' }}>{spec.value}</span>
                            </div>
                        ))}
                        {}
                        {parsedData.dimensions.map((dim, i) => (
                            <div key={`dim-${i}`} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{dim.key}</span>
                                <span style={{ color: '#0f172a', fontWeight: '500', fontSize: '0.9rem', textAlign: 'right' }}>{dim.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {}
            {parsedData.keywords.length > 0 && (
                <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 12px 0' }}>
                        <Tag size={16} /> Related Tags
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {parsedData.keywords.map((kw, i) => (
                            <span key={i} style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                                #{kw.replace(/\s+/g, '')}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BeautifulDescription;
