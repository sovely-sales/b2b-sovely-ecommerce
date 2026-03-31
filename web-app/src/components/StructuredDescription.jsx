import React, { useMemo } from 'react';
import { CheckCircle2, Package, Tag, Layers, Ruler } from 'lucide-react';

const StructuredDescription = ({ htmlContent }) => {
    
    const parsedData = useMemo(() => {
        if (!htmlContent) return null;

        
        const temp = document.createElement('div');
        temp.innerHTML = htmlContent;
        const rawText = temp.innerText || temp.textContent;

        const data = {
            description: '',
            features: [],
            idealFor: [],
            specs: [],
            dimensions: [],
            keywords: [],
            isStructured: false,
        };

        let currentSection = 'intro';
        const lines = rawText
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

        for (let line of lines) {
            const lowerLine = line.toLowerCase();

            
            if (lowerLine.includes('description :-') || lowerLine === 'description:') {
                currentSection = 'description';
                continue;
            }
            if (lowerLine.includes('key features :-') || lowerLine === 'key features:') {
                currentSection = 'features';
                continue;
            }
            if (lowerLine.includes('ideal for :-') || lowerLine === 'ideal for:') {
                currentSection = 'idealFor';
                continue;
            }
            if (lowerLine.includes('specifications :-') || lowerLine === 'specifications:') {
                currentSection = 'specs';
                continue;
            }
            if (lowerLine.includes('dimension :-') || lowerLine === 'dimension:') {
                currentSection = 'dimensions';
                continue;
            }
            if (lowerLine.includes('keywords :-') || lowerLine === 'keywords:') {
                currentSection = 'keywords';
                continue;
            }

            
            if (currentSection === 'description') {
                data.description += line + ' ';
                data.isStructured = true;
            } else if (currentSection === 'features') {
                data.features.push(line.replace(/^[-•*]\s*/, ''));
                data.isStructured = true;
            } else if (currentSection === 'idealFor') {
                data.idealFor.push(line.replace(/^[-•*]\s*/, ''));
            } else if (currentSection === 'specs') {
                const parts = line.split(/[:-]/); 
                if (parts.length >= 2) {
                    data.specs.push({
                        key: parts[0].trim(),
                        value: parts.slice(1).join(':').trim(),
                    });
                }
            } else if (currentSection === 'dimensions') {
                const parts = line.split(':-');
                if (parts.length >= 2) {
                    data.dimensions.push({ key: parts[0].trim(), value: parts[1].trim() });
                }
            } else if (currentSection === 'keywords') {
                data.keywords.push(...line.split(',').map((k) => k.trim()));
            }
        }

        return data;
    }, [htmlContent]);

    
    if (!parsedData?.isStructured) {
        return (
            <div
                className="prose prose-sm sm:prose-base prose-headings:font-bold prose-headings:text-slate-900 max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: htmlContent || '<p>No details provided.</p>' }}
            />
        );
    }

    
    return (
        <div className="space-y-8 text-sm text-slate-700">
            {}
            {parsedData.description && (
                <div className="leading-relaxed">
                    <p>{parsedData.description}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {}
                {parsedData.features.length > 0 && (
                    <div>
                        <h4 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
                            <Layers size={16} className="text-indigo-600" /> Key Features
                        </h4>
                        <ul className="space-y-2.5">
                            {parsedData.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                    <CheckCircle2
                                        size={16}
                                        className="mt-0.5 shrink-0 text-emerald-500"
                                    />
                                    <span className="leading-tight">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {}
                {parsedData.idealFor.length > 0 && (
                    <div>
                        <h4 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
                            <CheckCircle2 size={16} className="text-indigo-600" /> Ideal For
                        </h4>
                        <ul className="space-y-2.5">
                            {parsedData.idealFor.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                                    <span className="leading-tight">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {}
            {parsedData.specs.length > 0 && (
                <div>
                    <h4 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
                        <Package size={16} className="text-indigo-600" /> Specifications
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-slate-200">
                                {parsedData.specs.map((spec, idx) => (
                                    <tr
                                        key={idx}
                                        className="transition-colors even:bg-slate-50 hover:bg-slate-100/50"
                                    >
                                        <th className="w-1/3 border-r border-slate-200 bg-slate-50/50 px-4 py-3 font-semibold text-slate-600">
                                            {spec.key}
                                        </th>
                                        <td className="px-4 py-3 text-slate-800">{spec.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {}
            {parsedData.dimensions.length > 0 && (
                <div>
                    <h4 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
                        <Ruler size={16} className="text-indigo-600" /> Dimensions & Weight
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {parsedData.dimensions.map((dim, idx) => (
                            <div
                                key={idx}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                            >
                                <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                    {dim.key.replace('(Gm)', '').replace('(Cm)', '').trim()}
                                </span>
                                <span className="text-base font-extrabold text-slate-900">
                                    {dim.value}{' '}
                                    {dim.key.includes('(Gm)')
                                        ? 'g'
                                        : dim.key.includes('(Cm)')
                                          ? 'cm'
                                          : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {}
            {parsedData.keywords.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                    <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        <Tag size={12} /> Search Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {parsedData.keywords.map((keyword, idx) => (
                            <span
                                key={idx}
                                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StructuredDescription;
