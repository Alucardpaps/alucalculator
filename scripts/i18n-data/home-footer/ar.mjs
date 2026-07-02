/** Home page footer — Arabic */
export default {
  whatTitle: "ما هي حاسبات الهندسة؟",
  whatParagraphs: [
    "حاسبات الهندسة أدوات متخصصة تحل المعادلات التقنية المستخدمة في الهندسة الميكانيكية والإنشائية والكهربائية والحرارية. وبخلاف عن الحاسبات العامة، تنفّذ معادلات مدققة من معايير دولية مثل ISO 281 وVDI 2230 وASME PCC-1 ونظرية عرد إيلر-برنولي.",
    "يستخدم مهندسو التصميم والمشاريع والتصنيع والطلاب هذه الأدوات يوميًا للتحقق من الحسابات اليدوية وإجراء تقديرات أولية والتحقق من نتائج المحاكاة.",
    "تعفي حاسبات الهندسة الحديثة عبر المتصفح، مثل AluCalc OS، من الحاجة إلى تراخيص المكتب المكلفة. يمكن للمهندسين إجراء حسابات دقيقة من أي جهاز، مع نتائج مدققة بنفس المعايير المستخدمة عالميًا.",
  ],
  howTitle: "كيف يستخدم المهندسون هذه الأدوات",
  howParagraphs: [
    "يدمج المهندسون المحترفون الحاسبات عبر الإنترنت في مراحل متعددة من سير التصميم. في التصميم المفاهيمي، يساعد التقدير السريع على تحديد ما إذا كان قطر العمود أو قطعة العارضة أو قدرة المحرك ضمن النطاق المناسب قبل النمذج التفصيلي بالـCAD.",
    "في التصنيع والهندسة الميدانية، تعمل الحاسبات كأدوات مرجع فورية. يستخدمها الطلاب للتحقق من حلول الواجبات وفهم كيفية تأثير تغيير متغير واحد على النظام بأسره.",
  ],
  footerColumns: [
    {
      title: "ميكانيكا",
      links: [
        { href: "/bolt-torque", label: "حاسبة عزم البراغي" },
        { href: "/bearings", label: "عمر المحمل (ISO 281)" },
        { href: "/gears", label: "حاسبة نسبة الترس" },
        { href: "/shafts", label: "قطر العمود" },
        { href: "/hooke-law", label: "ثابت الزنبر" },
        { href: "/motor-selection-std", label: "قدرة المحرك" },
      ],
    },
    {
      title: "إنشائي",
      links: [
        { href: "/beam-deflection", label: "انحناء العارضة" },
        { href: "/concrete-reinforcement", label: "تسليح الخرسانة" },
        { href: "/simulation-fea", label: "تحليل FEA" },
        { href: "/topology-optimization", label: "تحسين التوپولوجيا" },
        { href: "/machine-assembly", label: "تركيب الآلات" },
      ],
    },
    {
      title: "السوائل والحرارية",
      links: [
        { href: "/fluid-dynamics", label: "انخفاض الضغط" },
        { href: "/thermal-expansion", label: "نقل الحرارة" },
        { href: "/pumps", label: "أداء المضخة" },
        { href: "/reducer-lubrication", label: "تزييت صندوق الترس" },
        { href: "/naval-hydrostatics", label: "الهيدروستاتيكا البحرية" },
      ],
    },
    {
      title: "كهربائي",
      links: [
        { href: "/three-phase-power", label: "حاسبة القدرة" },
        { href: "/ohms-law", label: "قانون أوم" },
        { href: "/voltage-drop", label: "انخفاض الجهد" },
        { href: "/3-phase-power", label: "القدرة ثلاثية الأطوال" },
        { href: "/filter-design", label: "تصميم المرشحات" },
      ],
    },
    {
      title: "علوم",
      links: [
        { href: "/physics-solver", label: "حالل فيزياء CAS" },
        { href: "/failure-prediction", label: "توقع العطل" },
        { href: "/failure-diagnosis", label: "تشخيص العطل" },
        { href: "/biology-genetics", label: "علم الجينيات السكاني" },
        { href: "/digital-logic", label: "مختبر المنطق الرقمي" },
      ],
    },
    {
      title: "المنصة",
      links: [
        { href: "/academy?tab=calculators", label: "جميع الحاسبات" },
        { href: "/workspace", label: "فتح مساح العمل" },
        { href: "/academy", label: "أكاديمية الهندسة" },
        { href: "/", label: "الرئيسية" },
      ],
    },
  ],
  copyright: "© 2026 AluCalc Advanced Engineering Systems",
};
