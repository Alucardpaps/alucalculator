export interface MaterialProps {
    id: string;
    name: string;
    density: number; // in g/cm³
    pricePerKg: number; // in USD
}

export const ENGINEERING_MATERIALS: MaterialProps[] = [
    { id: 'alu-6061', name: 'Aluminum 6061', density: 2.70, pricePerKg: 3.50 },
    { id: 'alu-7075', name: 'Aluminum 7075', density: 2.81, pricePerKg: 5.20 },
    { id: 'steel-s235', name: 'Steel S235', density: 7.85, pricePerKg: 1.20 },
    { id: 'steel-ss304', name: 'Stainless SS304', density: 8.00, pricePerKg: 4.50 },
    { id: 'titanium-g5', name: 'Titanium Grade 5', density: 4.43, pricePerKg: 35.00 },
    { id: 'brass-c360', name: 'Brass C360', density: 8.50, pricePerKg: 7.00 },
    { id: 'copper-c110', name: 'Copper C110', density: 8.89, pricePerKg: 9.50 },
    { id: 'pom-c', name: 'Acetal (Delrin)', density: 1.41, pricePerKg: 6.00 },
];
