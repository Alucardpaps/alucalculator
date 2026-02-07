import { getDictionary } from "@/get-dictionary";
import { MATERIALS_DB } from "@/data/materialsData";
import Link from "next/link";
import { Metadata } from "next";

// Generate static paths for all aluminum alloys
export async function generateStaticParams() {
    const aluminumAlloys = MATERIALS_DB.filter(m => m.category === 'Aluminum');

    return aluminumAlloys.map(alloy => {
        // Create URL-safe slug from alloy name
        const slug = alloy.name
            .toLowerCase()
            .replace(/[()]/g, '')
            .replace(/\s+/g, '-')
            .replace(/\//g, '-');

        return { slug };
    });
}

// Dynamic metadata
export async function generateMetadata({
    params
}: {
    params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
    const { lang, slug } = await params;

    const alloy = findAlloyBySlug(slug);

    if (!alloy) {
        return { title: 'Material Not Found' };
    }

    return {
        title: `${alloy.name} Weight Calculator | Density ${alloy.density} g/cm³ | AluCalculator`,
        description: `Calculate ${alloy.name} weight with accurate ${alloy.density} g/cm³ density. Yield: ${alloy.yield} MPa, Hardness: ${alloy.hardness}. ${alloy.weldability === 'Poor' ? 'Not recommended for welding.' : ''}`,
    };
}

function findAlloyBySlug(slug: string) {
    return MATERIALS_DB.find(m => {
        const alloySlug = m.name
            .toLowerCase()
            .replace(/[()]/g, '')
            .replace(/\s+/g, '-')
            .replace(/\//g, '-');
        return alloySlug === slug;
    });
}

export default async function MaterialPage({
    params
}: {
    params: Promise<{ lang: string; slug: string }>
}) {
    const { lang, slug } = await params;
    const dict = await getDictionary(lang);

    const alloy = findAlloyBySlug(slug);

    if (!alloy) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-gray-800">Material Not Found</h1>
                <Link href={`/${lang}/aluminum`} className="text-blue-600 hover:underline mt-4 inline-block">
                    ← Back to Calculator
                </Link>
            </div>
        );
    }

    // Get related alloys (same category, different material)
    const relatedAlloys = MATERIALS_DB
        .filter(m => m.category === alloy.category && m.name !== alloy.name)
        .slice(0, 3);

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-6">
                <Link href={`/${lang}`} className="hover:text-blue-600">Home</Link>
                <span className="mx-2">/</span>
                <Link href={`/${lang}/aluminum`} className="hover:text-blue-600">Calculator</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-800">{alloy.name}</span>
            </nav>

            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{alloy.name}</h1>
                <p className="text-lg text-gray-600">
                    {alloy.category} Alloy | Standard Reference: {alloy.name.includes('6061') || alloy.name.includes('7075') ? 'ASTM B209' : 'EN 573-3'}
                </p>
            </header>

            {/* Warning/Tip Banner */}
            {alloy.weldability === 'Poor' && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
                    <div className="flex items-center">
                        <span className="text-amber-600 text-xl mr-3">⚠️</span>
                        <p className="text-amber-800">
                            <strong>Not recommended for welding.</strong> Use mechanical fasteners or consider 6061-T6 for weldable applications.
                        </p>
                    </div>
                </div>
            )}

            {alloy.name.includes('5083') && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
                    <div className="flex items-center">
                        <span className="text-green-600 text-xl mr-3">✅</span>
                        <p className="text-green-800">
                            <strong>Excellent for marine environments.</strong> H116 temper provides optimal corrosion resistance for hull applications.
                        </p>
                    </div>
                </div>
            )}

            {/* Properties Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Physical Properties */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-blue-600">⚖️</span>
                        </span>
                        Physical Properties
                    </h2>
                    <table className="w-full">
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="py-2 text-gray-600">Density</td>
                                <td className="py-2 text-right font-mono font-semibold text-gray-900">{alloy.density} g/cm³</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-600">Melting Point</td>
                                <td className="py-2 text-right font-mono font-semibold text-gray-900">{alloy.meltingPoint}°C</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-600">Thermal Conductivity</td>
                                <td className="py-2 text-right font-mono font-semibold text-gray-900">{alloy.thermalCond} W/(m·K)</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-600">Thermal Expansion</td>
                                <td className="py-2 text-right font-mono font-semibold text-gray-900">{alloy.thermalExp} µm/(m·K)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Mechanical Properties */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-purple-600">💪</span>
                        </span>
                        Mechanical Properties
                    </h2>
                    <table className="w-full">
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="py-2 text-gray-600">Yield Strength</td>
                                <td className="py-2 text-right font-mono font-semibold text-gray-900">{alloy.yield} MPa</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-600">Tensile Strength</td>
                                <td className="py-2 text-right font-mono font-semibold text-gray-900">{alloy.tensile} MPa</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-600">Hardness</td>
                                <td className="py-2 text-right font-mono font-semibold text-gray-900">{alloy.hardness}</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-600">Young's Modulus</td>
                                <td className="py-2 text-right font-mono font-semibold text-gray-900">{alloy.youngsModulus} GPa</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Workability */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-green-600">🔧</span>
                        </span>
                        Workability
                    </h2>
                    <table className="w-full">
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="py-2 text-gray-600">Weldability</td>
                                <td className="py-2 text-right">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${alloy.weldability === 'Excellent' ? 'bg-green-100 text-green-800' :
                                            alloy.weldability === 'Good' ? 'bg-blue-100 text-blue-800' :
                                                alloy.weldability === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                        }`}>
                                        {alloy.weldability}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-600">Machinability</td>
                                <td className="py-2 text-right">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${alloy.machinability === 'Excellent' ? 'bg-green-100 text-green-800' :
                                            alloy.machinability === 'Good' ? 'bg-blue-100 text-blue-800' :
                                                alloy.machinability === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                        }`}>
                                        {alloy.machinability}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Quick Calculator CTA */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
                    <h2 className="text-lg font-semibold mb-2">Calculate {alloy.name} Weight</h2>
                    <p className="text-blue-100 text-sm mb-4">
                        Use our calculator with the accurate {alloy.density} g/cm³ density for precise weight calculations.
                    </p>
                    <Link
                        href={`/${lang}/aluminum?material=${encodeURIComponent(alloy.name)}`}
                        className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                    >
                        Open Calculator →
                    </Link>
                </div>
            </div>

            {/* Related Alloys */}
            {relatedAlloys.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Compare with Similar Alloys</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {relatedAlloys.map(related => {
                            const relatedSlug = related.name
                                .toLowerCase()
                                .replace(/[()]/g, '')
                                .replace(/\s+/g, '-')
                                .replace(/\//g, '-');

                            return (
                                <Link
                                    key={related.name}
                                    href={`/${lang}/materials/${relatedSlug}`}
                                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                                >
                                    <h3 className="font-semibold text-gray-800">{related.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {related.density} g/cm³ • {related.yield} MPa
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Schema.org Dataset */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Dataset",
                        "name": `${alloy.name} Material Properties`,
                        "description": `Engineering properties for ${alloy.name} including density, yield strength, and thermal characteristics.`,
                        "url": `https://www.alucalculator.com/${lang}/materials/${slug}`,
                        "variableMeasured": [
                            { "@type": "PropertyValue", "name": "Density", "value": alloy.density, "unitCode": "GM" },
                            { "@type": "PropertyValue", "name": "Yield Strength", "value": alloy.yield, "unitCode": "MPA" },
                            { "@type": "PropertyValue", "name": "Tensile Strength", "value": alloy.tensile, "unitCode": "MPA" }
                        ],
                        "license": "https://creativecommons.org/licenses/by/4.0/"
                    })
                }}
            />
        </div>
    );
}
