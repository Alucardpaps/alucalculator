export interface Motor {
    power: number; // kW
    frame: string; // IEC Frame Size
    speed_2p: number; // 3000 synchronous
    speed_4p: number; // 1500 synchronous
    speed_6p: number; // 1000 synchronous
    torque_4p: number; // Nominal Torque at 4 poles (approx)
    efficiency: 'IE1' | 'IE2' | 'IE3' | 'IE4';
}

// Data approximation based on typical Siemens/ABB 400V 50Hz catalogs
export const IEC_MOTORS: Motor[] = [
    { power: 0.12, frame: '63', speed_2p: 2800, speed_4p: 1350, speed_6p: 880, torque_4p: 0.85, efficiency: 'IE1' },
    { power: 0.18, frame: '63', speed_2p: 2820, speed_4p: 1370, speed_6p: 870, torque_4p: 1.25, efficiency: 'IE1' },
    { power: 0.25, frame: '71', speed_2p: 2830, speed_4p: 1380, speed_6p: 890, torque_4p: 1.73, efficiency: 'IE2' },
    { power: 0.37, frame: '71', speed_2p: 2840, speed_4p: 1390, speed_6p: 900, torque_4p: 2.54, efficiency: 'IE2' },
    { power: 0.55, frame: '80', speed_2p: 2850, speed_4p: 1400, speed_6p: 910, torque_4p: 3.75, efficiency: 'IE2' },
    { power: 0.75, frame: '80', speed_2p: 2860, speed_4p: 1410, speed_6p: 920, torque_4p: 5.08, efficiency: 'IE3' },
    { power: 1.1, frame: '90S', speed_2p: 2870, speed_4p: 1420, speed_6p: 930, torque_4p: 7.40, efficiency: 'IE3' },
    { power: 1.5, frame: '90L', speed_2p: 2880, speed_4p: 1430, speed_6p: 940, torque_4p: 10.0, efficiency: 'IE3' },
    { power: 2.2, frame: '100L', speed_2p: 2890, speed_4p: 1440, speed_6p: 950, torque_4p: 14.6, efficiency: 'IE3' },
    { power: 3.0, frame: '100L', speed_2p: 2900, speed_4p: 1450, speed_6p: 960, torque_4p: 19.8, efficiency: 'IE3' },
    { power: 4.0, frame: '112M', speed_2p: 2910, speed_4p: 1460, speed_6p: 960, torque_4p: 26.2, efficiency: 'IE3' },
    { power: 5.5, frame: '132S', speed_2p: 2920, speed_4p: 1465, speed_6p: 965, torque_4p: 35.8, efficiency: 'IE3' },
    { power: 7.5, frame: '132M', speed_2p: 2925, speed_4p: 1470, speed_6p: 970, torque_4p: 48.7, efficiency: 'IE3' },
    { power: 11, frame: '160M', speed_2p: 2935, speed_4p: 1475, speed_6p: 975, torque_4p: 71.2, efficiency: 'IE3' },
    { power: 15, frame: '160L', speed_2p: 2940, speed_4p: 1480, speed_6p: 975, torque_4p: 96.8, efficiency: 'IE3' },
    { power: 18.5, frame: '180M', speed_2p: 2945, speed_4p: 1480, speed_6p: 980, torque_4p: 119, efficiency: 'IE3' },
    { power: 22, frame: '180L', speed_2p: 2950, speed_4p: 1480, speed_6p: 980, torque_4p: 142, efficiency: 'IE3' },
    { power: 30, frame: '200L', speed_2p: 2955, speed_4p: 1485, speed_6p: 985, torque_4p: 193, efficiency: 'IE3' },
    { power: 37, frame: '225S', speed_2p: 2960, speed_4p: 1485, speed_6p: 985, torque_4p: 238, efficiency: 'IE3' },
    { power: 45, frame: '225M', speed_2p: 2965, speed_4p: 1485, speed_6p: 985, torque_4p: 289, efficiency: 'IE3' },
    { power: 55, frame: '250M', speed_2p: 2970, speed_4p: 1488, speed_6p: 988, torque_4p: 353, efficiency: 'IE3' },
    { power: 75, frame: '280S', speed_2p: 2975, speed_4p: 1488, speed_6p: 988, torque_4p: 481, efficiency: 'IE3' },
    { power: 90, frame: '280M', speed_2p: 2975, speed_4p: 1488, speed_6p: 988, torque_4p: 577, efficiency: 'IE3' },
    { power: 110, frame: '315S', speed_2p: 2980, speed_4p: 1490, speed_6p: 990, torque_4p: 705, efficiency: 'IE3' },
    { power: 132, frame: '315M', speed_2p: 2980, speed_4p: 1490, speed_6p: 990, torque_4p: 846, efficiency: 'IE3' },
    { power: 160, frame: '315L', speed_2p: 2982, speed_4p: 1492, speed_6p: 992, torque_4p: 1024, efficiency: 'IE3' },
    { power: 200, frame: '315L', speed_2p: 2982, speed_4p: 1492, speed_6p: 992, torque_4p: 1280, efficiency: 'IE3' },
];
