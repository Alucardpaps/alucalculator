/** Home page footer — Japanese */
export default {
  whatTitle: "工学計算機とは？",
  whatParagraphs: [
    "工学計算機は、機械、構造、電気、熱工学で使用される技術的な方程式を解く専門ツールです。一般的な電子計算機と異なり、ISO 281、VDI 2230、ASME PCC-1、オイラー・ベルヌーリの梁理論などの国際規格に基づく検証済みの式を実装しています。",
    "設計エンジニア、プロジェクトエンジニア、生産技術者、学生は手計算の検証、事前サイジング、シミュレーション結果の検証に毎日利用しています。",
    "AluCalc OSのような現代的なブラウザベースの工学計算機は、高額なデスクトップライセンスを不要にします。エンジニアはいつでもどこから精密な計算を行え、世界中で使用される同じ規格に基づいて検証された結果を得られます。",
  ],
  howTitle: "エンジニアはこのツールをどう使うか",
  howParagraphs: [
    "プロのエンジニアは、設計ワークフローの複数の階段でオンライン計算機を組み込みます。概念設計の階段では、軸径、梁断面、モータ定格が適切な範囲にあるかを、詳細なCADモデリングの前に快速サイジングで確認できます。",
    "製造や現場工学では、計算機は即座の参照ツールとして機能します。学生は宿題の確認や、変数を変えるとシステム全体にどう影響するかの理解を深めるために使います。",
  ],
  footerColumns: [
    {
      title: "機械",
      links: [
        { href: "/bolt-torque", label: "ボルトトルク計算機" },
        { href: "/bearings", label: "軸受寿命（ISO 281）" },
        { href: "/gears", label: "歯車比計算機" },
        { href: "/shafts", label: "軸径" },
        { href: "/hooke-law", label: "バネ定数" },
        { href: "/motor-selection-std", label: "モータ出力" },
      ],
    },
    {
      title: "構造",
      links: [
        { href: "/beam-deflection", label: "梁たわみ" },
        { href: "/concrete-reinforcement", label: "鉄筋コンクリート" },
        { href: "/simulation-fea", label: "FEA解析" },
        { href: "/topology-optimization", label: "トポロジー最適化" },
        { href: "/machine-assembly", label: "機械組立" },
      ],
    },
    {
      title: "流体・熱",
      links: [
        { href: "/fluid-dynamics", label: "圧力損失" },
        { href: "/thermal-expansion", label: "熱伝遞" },
        { href: "/pumps", label: "ポンプ性能" },
        { href: "/reducer-lubrication", label: "減速機潤滑" },
        { href: "/naval-hydrostatics", label: "船舶静水力学" },
      ],
    },
    {
      title: "電気",
      links: [
        { href: "/three-phase-power", label: "電力計算機" },
        { href: "/ohms-law", label: "オームの法則" },
        { href: "/voltage-drop", label: "電圧降下" },
        { href: "/3-phase-power", label: "三相電力" },
        { href: "/filter-design", label: "フィルタ設計" },
      ],
    },
    {
      title: "科学",
      links: [
        { href: "/physics-solver", label: "物理CASソルバー" },
        { href: "/failure-prediction", label: "故障予測" },
        { href: "/failure-diagnosis", label: "故障診断" },
        { href: "/biology-genetics", label: "群体遺伝学" },
        { href: "/digital-logic", label: "デジタル逻輯ラボ" },
      ],
    },
    {
      title: "プラットフォーム",
      links: [
        { href: "/academy?tab=calculators", label: "すべての計算機" },
        { href: "/workspace", label: "Workspaceを開く" },
        { href: "/academy", label: "工学アカデミー" },
        { href: "/", label: "ホーム" },
      ],
    },
  ],
  copyright: "© 2026 AluCalc Advanced Engineering Systems",
};
