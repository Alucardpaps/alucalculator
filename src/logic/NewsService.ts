
export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    link: string;
    image?: string;
    source: string;
    date: string;
    isBreaking?: boolean;
}

const CACHE_KEY_PREFIX = 'alu_news_data_v2_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const NewsService = {
    async getNews(lang: string = 'en'): Promise<NewsItem[]> {
        const cacheKey = `${CACHE_KEY_PREFIX}${lang}`;

        // 1. Check Cache
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    if (Date.now() - data.timestamp < CACHE_TTL) return data.items;
                } catch { /* ignore parse errors */ }
            }
        }

        // Static export mode: Use mock data directly (API routes not available)
        const articles = getMockNews(lang);

        // Add breaking flag to first item
        if (articles.length > 0) articles[0].isBreaking = true;

        // Cache the mock data
        if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                items: articles
            }));
        }

        return articles;
    }
};

// Mock News Data with full localization and images
function getMockNews(lang: string): NewsItem[] {
    const baseDate = new Date();

    // Helper for date formatting
    const formatDate = (daysAgo: number) => {
        const d = new Date(baseDate.getTime() - daysAgo * 86400000);
        return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : lang === 'de' ? 'de-DE' : 'en-US');
    };

    // Translation Dictionaries
    const content: Record<string, any> = {
        en: {
            industry: { title: "Industry 5.0 Revolution", summary: "AI-driven autonomous factories are boosting production efficiency by 40% with human-centric technologies." },
            materials: { title: "Next-Gen Composites", summary: "Ultra-light carbon-aluminum alloys developed for aerospace are now entering the automotive market." },
            energy: { title: "Green Energy Manufacturing", summary: "Sustainable production facilities powered entirely by renewable wind and solar energy sources." },
            robotics: { title: "Robotic Efficiency", summary: "New servo motor technologies reduce energy consumption of industrial robots by 25%." },
            digital: { title: "Digital Twin Rise", summary: "Real-time factory simulations are reducing production errors to near zero levels." },
            logistics: { title: "Autonomous Logistics", summary: "AGV fleets are transforming warehouse management and supply chain transparency." }
        },
        tr: {
            industry: { title: "Endüstri 5.0 Devrimi", summary: "Yapay zeka destekli otonom fabrikalar, insan odaklı teknolojilerle üretim verimliliğini %40 artırıyor." },
            materials: { title: "Yeni Nesil Kompozitler", summary: "Havacılık için geliştirilen ultra hafif karbon-alüminyum alaşımları artık otomotiv pazarına giriyor." },
            energy: { title: "Yeşil Enerjili Üretim", summary: "Tamamen yenilenebilir rüzgar ve güneş enerjisi kaynaklarıyla çalışan sürdürülebilir üretim tesisleri." },
            robotics: { title: "Robotik Verimlilik", summary: "Yeni servo motor teknolojileri, endüstriyel robotların enerji tüketimini %25 oranında azaltıyor." },
            digital: { title: "Dijital İkiz Yükselişi", summary: "Gerçek zamanlı fabrika simülasyonları üretim hatalarını neredeyse sıfıra indiriyor." },
            logistics: { title: "Otonom Lojistik", summary: "AGV filoları depo yönetimini ve tedarik zinciri şeffaflığını dönüştürüyor." }
        },
        de: {
            industry: { title: "Industrie 5.0 Revolution", summary: "KI-gesteuerte autonome Fabriken steigern die Produktionseffizienz um 40% mit menschenzentrierten Technologien." },
            materials: { title: "Verbundwerkstoffe der Zukunft", summary: "Für die Luftfahrt entwickelte ultraleichte Carbon-Aluminium-Legierungen erobern den Automobilmarkt." },
            energy: { title: "Grüne Energiefertigung", summary: "Nachhaltige Produktionsstätten, die vollständig mit erneuerbarer Wind- und Solarenergie betrieben werden." },
            robotics: { title: "Robotereffizienz", summary: "Neue Servomotortechnologien senken den Energieverbrauch von Industrierobotern um 25%." },
            digital: { title: "Aufstieg des Digitalen Zwillings", summary: "Echtzeit-Fabriksimulationen reduzieren Produktionsfehler auf nahezu Null." },
            logistics: { title: "Autonome Logistik", summary: "FTS-Flotten transformieren das Lagermanagement und die Transparenz der Lieferkette." }
        },
        es: {
            industry: { title: "Revolución Industria 5.0", summary: "Las fábricas autónomas impulsadas por IA aumentan la eficiencia de producción en un 40%." },
            materials: { title: "Compuestos de Próxima Generación", summary: "Las aleaciones de carbono-aluminio ultraligeras entran ahora en el mercado automotriz." },
            energy: { title: "Manufactura de Energía Verde", summary: "Instalaciones de producción sostenible alimentadas totalmente por energía renovable." },
            robotics: { title: "Eficiencia Robótica", summary: "Nuevas tecnologías de servomotores reducen el consumo de energía en un 25%." },
            digital: { title: "Auge del Gemelo Digital", summary: "Las simulaciones de fábrica en tiempo real reducen los errores de producción a casi cero." },
            logistics: { title: "Logística Autónoma", summary: "Las flotas de AGV están transformando la gestión de almacenes." }
        },
        fr: {
            industry: { title: "Révolution Industrie 5.0", summary: "Les usines autonomes augmentent l'efficacité de la production de 40%." },
            materials: { title: "Composites Nouvelle Génération", summary: "Les alliages carbone-aluminium ultra-légers entrent sur le marché automobile." },
            energy: { title: "Fabrication Énergie Verte", summary: "Installations de production durable alimentées par des énergies renouvelables." },
            robotics: { title: "Efficacité Robotique", summary: "Les nouvelles technologies de servomoteurs réduisent la consommation d'énergie de 25%." },
            digital: { title: "Essor du Jumeau Numérique", summary: "Les simulations d'usine en temps réel réduisent les erreurs presque à zéro." },
            logistics: { title: "Logistique Autonome", summary: "Les flottes d'AGV transforment la gestion des entrepôts." }
        },
        pt: {
            industry: { title: "Revolução Indústria 5.0", summary: "Fábricas autônomas impulsionadas por IA aumentam a eficiência em 40%." },
            materials: { title: "Compósitos de Nova Geração", summary: "Ligas ultraleves de carbono-alumínio entram no mercado automotivo." },
            energy: { title: "Manufatura de Energia Verde", summary: "Instalações sustentáveis alimentadas inteiramente por energia renovável." },
            robotics: { title: "Eficiência Robótica", summary: "Novas tecnologias de servomotores reduzem o consumo de energia em 25%." },
            digital: { title: "Ascensão do Gêmeo Digital", summary: "Simulações de fábrica em tempo real reduzem erros a quase zero." },
            logistics: { title: "Logística Autônoma", summary: "Frotas de AGV estão transformando a gestão de armazéns." }
        },
        ru: {
            industry: { title: "Революция Индустрии 5.0", summary: "Автономные фабрики с ИИ повышают эффективность производства на 40%." },
            materials: { title: "Композиты Нового Поколения", summary: "Сверхлегкие углеродно-алюминиевые сплавы выходят на автомобильный рынок." },
            energy: { title: "Зеленая Энергетика", summary: "Устойчивые производства, работающие полностью на возобновляемой энергии." },
            robotics: { title: "Роботизированная Эффективность", summary: "Новые серводвигатели снижают энергопотребление роботов на 25%." },
            digital: { title: "Рост Цифровых Двойников", summary: "Симуляции фабрик в реальном времени сводят ошибки к нулю." },
            logistics: { title: "Автономная Логистика", summary: "Парки AGV трансформируют управление складами." }
        },
        ja: {
            industry: { title: "インダストリー5.0革命", summary: "AI主導の自律型工場が、人間中心の技術で生産効率を40％向上させています。" },
            materials: { title: "次世代複合材料", summary: "航空宇宙用に開発された超軽量炭素アルミニウム合金が自動車市場に参入しています。" },
            energy: { title: "グリーンエネルギー製造", summary: "再生可能な風力および太陽エネルギー源によって完全に電力供給される持続可能な生産施設。" },
            robotics: { title: "ロボット効率", summary: "新しいサーボモーター技術により、産業用ロボットのエネルギー消費が25％削減されます。" },
            digital: { title: "デジタルツインの台頭", summary: "リアルタイムの工場シミュレーションにより、生産ミスがほぼゼロになります。" },
            logistics: { title: "自律ロジスティクス", summary: "AGVフリートは、倉庫管理とサプライチェーンの透明性を変革しています。" }
        },
        zh: {
            industry: { title: "工业 5.0 革命", summary: "人工智能驱动的自主工厂利用以人为本的技术将生产效率提高了 40%。" },
            materials: { title: "下一代复合材料", summary: "为航空航天开发的超轻碳铝合金目前正在进入汽车市场。" },
            energy: { title: "绿色能源制造", summary: "完全由可再生风能和太阳能供电的可持续生产设施。" },
            robotics: { title: "机器人效率", summary: "新型伺服电机技术将工业机器人的能耗降低了 25%。" },
            digital: { title: "数字孪生兴起", summary: "实时工厂模拟正在将生产误差降至接近零的水平。" },
            logistics: { title: "自主物流", summary: "AGV 车队正在改变仓库管理和供应链透明度。" }
        }
    };

    // Fallback to English if lang not found
    const c = content[lang] || content['en'];

    return [
        {
            id: 'news-1',
            title: c.industry.title,
            summary: c.industry.summary,
            link: 'https://news.google.com/search?q=industry+5.0',
            date: formatDate(0),
            source: 'Tech Engineering',
            image: '/images/news/industry.png',
            isBreaking: true
        },
        {
            id: 'news-2',
            title: c.materials.title,
            summary: c.materials.summary,
            link: 'https://news.google.com/search?q=composite+materials',
            date: formatDate(1),
            source: 'Material Science',
            image: '/images/news/materials.png'
        },
        {
            id: 'news-3',
            title: c.energy.title,
            summary: c.energy.summary,
            link: 'https://news.google.com/search?q=green+manufacturing',
            date: formatDate(2),
            source: 'Energy Tech',
            image: '/images/news/energy.png'
        },
        {
            id: 'news-4',
            title: c.robotics.title,
            summary: c.robotics.summary,
            link: 'https://news.google.com/search?q=robotic+automation',
            date: formatDate(3),
            source: 'Robotics Daily',
            image: undefined
        },
        {
            id: 'news-5',
            title: c.digital.title,
            summary: c.digital.summary,
            link: 'https://news.google.com/search?q=digital+twin',
            date: formatDate(4),
            source: 'Industrial AI',
            image: undefined
        },
        {
            id: 'news-6',
            title: c.logistics.title,
            summary: c.logistics.summary,
            link: 'https://news.google.com/search?q=autonomous+logistics',
            date: formatDate(5),
            source: 'Logistics World',
            image: undefined
        }
    ];
}
