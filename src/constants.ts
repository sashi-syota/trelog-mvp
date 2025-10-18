export const EXERCISES = [
  { group: "Compound", items: [
  "Back Squat", "Front Squat", "Deadlift (Conv)", "Deadlift (Sumo)",
  "Bench Press", "Incline Bench Press", "Overhead Press", "Row (Barbell)", "Pull-up"
  ]},
  { group: "Olympic / Power", items: [
  "Power Clean", "Power Snatch", "Clean & Jerk"
  ]},
  { group: "Judo / GPP", items: [
  "Sprints", "Shiko (四股)", "Neck Bridge (Back)", "Neck Bridge (Front)", "Push-up", "Ring Row"
  ]},
  { group: "Arms / Isolation", items: [
  "Biceps Curl (DB)", "Triceps Extension (Cable)", "Lateral Raise"
  ]}
  ] as const;
  
  
  export const REPS_OPTIONS = [1,2,3,4,5,6,7,8,9,10,12,15,20] as const;
  export const RPE_OPTIONS: (number)[] = [6,6.5,7,7.5,8,8.5,9,9.5,10];
  export const INTERVAL_OPTIONS_SEC = [30,45,60,75,90,120,150,180,210,240,300];