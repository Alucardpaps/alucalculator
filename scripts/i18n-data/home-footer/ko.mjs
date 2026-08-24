/** Home page footer — Korean */
export default {
  whatTitle: "공학 계산기란?",
  whatParagraphs: [
    "공학 계산기는 기계, 구조, 전기, 열 공학에서 사용되는 기술 방정식을 풀는 전문 도구입니다. 일반 계산기와 달리 ISO 281, VDI 2230, ASME PCC-1, 오일러-베르누리 보 이론 등 국제 표준에 기반한 검증된 공식을 구현합니다.",
    "설계 엔지니어, 프로젝트 엔지니어, 생산 엔지니어, 학생들은 수계산 검증, 사전 치수 선정, 시뮬레이션 결과 검증을 위해 매일 이를 사용합니다.",
    "AluCalc OS와 같은 최신 브라우저 기반 공학 계산기는 비싼 데스크톱 라이선스가 필요 없습니다. 엔지니어는 어떤 기기에서든 전 세계적으로 사용되는 동일한 표준으로 검증된 결과를 얻을 수 있습니다.",
  ],
  howTitle: "엔지니어가 이 도구를 사용하는 방법",
  howParagraphs: [
    "전문 엔지니어는 설계 워크플로의 여러 단계에 온라인 계산기를 통합합니다. 개념 설계 단계에서 빠른 치수 선정으로 샤프트 직경, 보 단면, 모터 정격이 적절한 범위에 있는지 확인할 수 있습니다.",
    "제조 및 현장 공학에서 계산기는 즉시 참고 도구로 사용됩니다. 학생들은 숙제 풀이를 확인하고 변수 하나가 전체 시스템에 미치는 영향을 이해합니다.",
  ],
  footerColumns: [
    {
      title: "기계",
      links: [
        { href: "/bolt-torque", label: "볼트 토크 계산기" },
        { href: "/bearings", label: "볪ring 수명 (ISO 281)" },
        { href: "/gears", label: "기어 비 계산기" },
        { href: "/shafts", label: "샤프트 직경" },
        { href: "/hooke-law", label: "스프링 상수" },
        { href: "/motor-selection-std", label: "모터 출력" },
      ],
    },
    {
      title: "구조",
      links: [
        { href: "/beam-deflection", label: "보 척오" },
        { href: "/concrete-reinforcement", label: "간짜 배근" },
        { href: "/simulation-fea", label: "FEA 분석" },
        { href: "/topology-optimization", label: "토폴로지 최적화" },
        { href: "/machine-assembly", label: "기계 조립" },
      ],
    },
    {
      title: "유체 및 열",
      links: [
        { href: "/fluid-dynamics", label: "압력 감소" },
        { href: "/thermal-expansion", label: "열전달" },
        { href: "/pumps", label: "펌프 성능" },
        { href: "/reducer-lubrication", label: "감속기 각진" },
        { href: "/naval-hydrostatics", label: "선박 정수력학" },
      ],
    },
    {
      title: "전기",
      links: [
        { href: "/three-phase-power", label: "전력 계산기" },
        { href: "/ohms-law", label: "오즘의 법칙" },
        { href: "/voltage-drop", label: "전압 감소" },
        { href: "/3-phase-power", label: "3상 전력" },
        { href: "/filter-design", label: "필터 설계" },
      ],
    },
    {
      title: "과학",
      links: [
        { href: "/physics-solver", label: "물리 CAS 솔버" },
        { href: "/failure-prediction", label: "고장 예측" },
        { href: "/failure-diagnosis", label: "고장 진단" },
        { href: "/biology-genetics", label: "군집 유전학" },
        { href: "/digital-logic", label: "디지털 로직 랩" },
      ],
    },
    {
      title: "플랫폼",
      links: [
        { href: "/academy?tab=calculators", label: "모든 계산기" },
        { href: "/workspace", label: "Workspace 열기" },
        { href: "/academy", label: "공학 아카데미" },
        { href: "/", label: "홈" },
      ],
    },
  ],
  copyright: "© 2026 AluCalc Advanced Engineering Systems",
};
