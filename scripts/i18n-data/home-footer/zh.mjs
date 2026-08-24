/** Home page footer — Chinese */
export default {
  whatTitle: "什么是工程计算器？",
  whatParagraphs: [
    "工程计算器是专门用于解决机械、结构、电气和热工程领域技术方程的专业工具。与通用计算器不同，它们实现了经国际标准（如 ISO 281、VDI 2230、ASME PCC-1 和欧拉-伯努利梁理论）验证的公式。",
    "设计工程师、项目工程师、制造工程师和学生每天都使用这些工具来验证手算结果、进行预设计尺寸并验证仿真结果。",
    "像 AluCalc OS 这样的现代浏览器工程计算器可免除昂贵的桌面软件许可费用。工程师可从任何设备进行精确计算，结果按全球通用的同一标准验证。",
  ],
  howTitle: "工程师如何使用这些工具",
  howParagraphs: [
    "专业工程师在设计流程的多个阶段集成在线计算器。在概念设计阶段，快速尺寸可判断轴径、梁截面或电机功率是否在合理范围内，然后再进行详细 CAD 建模。",
    "在制造和现场工程中，计算器是即时参考工具。学生用于检查作业解答，并理解变量改变如何影响整个系统。",
  ],
  footerColumns: [
    {
      title: "机械",
      links: [
        { href: "/bolt-torque", label: "螺栓扭矩计算器" },
        { href: "/bearings", label: "轴承寿命（ISO 281）" },
        { href: "/gears", label: "齿轮比计算器" },
        { href: "/shafts", label: "轴径" },
        { href: "/hooke-law", label: "弹簧常数" },
        { href: "/motor-selection-std", label: "电机功率" },
      ],
    },
    {
      title: "结构",
      links: [
        { href: "/beam-deflection", label: "梁挫度" },
        { href: "/concrete-reinforcement", label: "混凝土配筋" },
        { href: "/simulation-fea", label: "FEA 分析" },
        { href: "/topology-optimization", label: "拓扑优化" },
        { href: "/machine-assembly", label: "机械装配" },
      ],
    },
    {
      title: "流体与热工",
      links: [
        { href: "/fluid-dynamics", label: "压力降" },
        { href: "/thermal-expansion", label: "热传递" },
        { href: "/pumps", label: "泵性能" },
        { href: "/reducer-lubrication", label: "减速箱润滑" },
        { href: "/naval-hydrostatics", label: "船舶静水力学" },
      ],
    },
    {
      title: "电气",
      links: [
        { href: "/three-phase-power", label: "功率计算器" },
        { href: "/ohms-law", label: "欧姆定律" },
        { href: "/voltage-drop", label: "电压降" },
        { href: "/3-phase-power", label: "三相功率" },
        { href: "/filter-design", label: "滤波器设计" },
      ],
    },
    {
      title: "科学",
      links: [
        { href: "/physics-solver", label: "物理 CAS 求解器" },
        { href: "/failure-prediction", label: "故障预测" },
        { href: "/failure-diagnosis", label: "故障诊断" },
        { href: "/biology-genetics", label: "群体遗传学" },
        { href: "/digital-logic", label: "数字逻辑实验室" },
      ],
    },
    {
      title: "平台",
      links: [
        { href: "/academy?tab=calculators", label: "全部计算器" },
        { href: "/workspace", label: "打开工作区" },
        { href: "/academy", label: "工程学院" },
        { href: "/", label: "首页" },
      ],
    },
  ],
  copyright: "© 2026 AluCalc Advanced Engineering Systems",
};
