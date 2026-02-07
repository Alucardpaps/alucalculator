import { getDictionary } from "@/get-dictionary";
import { MATERIALS_DB } from "@/data/materialsData";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Aluminum Alloy Database | Material Properties & Datasheets | AluCalculator",
    description: "Complete aluminum alloy database with density, yield strength, thermal properties, weldability, and machinability ratings. ASTM B209 & EN 573-3 compliant.",
};

export default async function MaterialsPage({
    params
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    // Group materials by category
    const categories = MATERIALS_DB.reduce((acc, material) => {
        if (!acc[material.category]) {
            acc[material.category] = [];
        }
        acc[material.category].push(material);
        return acc;
    }, {} as Record<string, typeof MATERIALS_DB>);

    const createSlug = (name: string) =>
        name.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, '-').replace(/\//g, '-');

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Material Database</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Complete engineering material properties database. Click any material for detailed specifications and calculator access.
                </p>
            </header>

            {/* Category Sections */}
            {Object.entries(categories).map(([category, materials]) => (
                <section key={category} className="mb-10">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-3 ${category === 'Aluminum' ? 'bg-blue-500' :
                                category === 'Steel' ? 'bg-gray-500' :
                                    category === 'Stainless' ? 'bg-purple-500' :
                                        category === 'Non-Ferrous' ? 'bg-amber-500' :
                                            category === 'Superalloy' ? 'bg-red-500' :
                                                'bg-green-500'
                            }`} />
                        {category}
                    </h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materials.map(material => (
                            <Link
                                key={material.name}
                                href={`/${lang}/materials/${createSlug(material.name)}`}
                                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-lg transition-all group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                        {material.name}
                                    </h3>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {material.density} g/cm³
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className={`text-xs px-2 py-0.5 rounded ${material.weldability === 'Excellent' ? 'bg-green-100 text-green-700' :
                                            material.weldability === 'Good' ? 'bg-blue-100 text-blue-700' :
                                                material.weldability === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                        }`}>
                                        Weld: {material.weldability}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${material.machinability === 'Excellent' ? 'bg-green-100 text-green-700' :
                                            material.machinability === 'Good' ? 'bg-blue-100 text-blue-700' :
                                                material.machinability === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                        }`}>
                                        Machine: {material.machinability}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-500 flex justify-between">
                                    <span>Yield: {material.yield} MPa</span>
                                    <span>{material.hardness}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}

            {/* Schema.org */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Dataset",
                        "name": "Engineering Materials Database",
                        "description": "Comprehensive engineering materials database including aluminum, steel, stainless, and specialty alloys with mechanical and thermal properties.",
                        "url": `https://www.alucalculator.com/${lang}/materials`,
                        "license": "https://creativecommons.org/licenses/by/4.0/"
                    })
                }}
            />
        </div>
    );
}
