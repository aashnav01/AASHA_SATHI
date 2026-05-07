/**
 * April 2024 NHM Incentive Task List (India)
 * Source: Official NRHM Guidelines & State Implementation Protocols
 * 
 * Note: Some tasks have variable rates based on state classification:
 * - High Focus States (tier 1): Higher incentive rates
 * - Regular States: Standard rates
 * - Urban vs Rural: Different rates for delivery/JSY tasks
 * 
 * This export uses standard/average rates with variants noted in description.
 */

export interface NHMTask {
  id: string;
  name: string;
  category: 'maternal' | 'immunization' | 'family_planning' | 'nutrition' | 'tb' | 'ncd';
  amount: number; // in Indian Rupees (₹)
  description: string;
}

export const NHM_TASKS: NHMTask[] = [
  {
    id: 'safe_delivery_escort',
    name: 'Safe Delivery Escort',
    category: 'maternal',
    amount: 600,
    description: 'Escort pregnant woman to facility for institutional delivery. High Focus States: ₹600. Regular States: ₹300.'
  },
  {
    id: 'immunization_complete',
    name: 'Immunization Complete (up to 2 years)',
    category: 'immunization',
    amount: 100,
    description: 'Ensure complete immunization schedule (BCG, DPT 1-3, Polio, Measles, etc.) for children up to 2 years.'
  },
  {
    id: 'anc_first_trimester',
    name: 'ANC Registration in First Trimester',
    category: 'maternal',
    amount: 100,
    description: 'Register pregnant woman for Antenatal Care before 12 weeks of pregnancy.'
  },
  {
    id: 'jsy_institutional_delivery',
    name: 'JSY Institutional Delivery',
    category: 'maternal',
    amount: 1000,
    description: 'Promote and escort mother for JSY institutional delivery. Urban: ₹600. Rural: ₹1400.'
  },
  {
    id: 'ppiucd_escort',
    name: 'PPIUCD Insertion Escort',
    category: 'family_planning',
    amount: 150,
    description: 'Escort postpartum woman to facility for IUD insertion within 48 hours of delivery.'
  },
  {
    id: 'tb_presumptive_referral',
    name: 'TB Presumptive Patient Referral',
    category: 'tb',
    amount: 500,
    description: 'Identify and refer TB presumptive cases (cough >2 weeks) for diagnostic confirmation.'
  },
  {
    id: 'tb_treatment_completion',
    name: 'TB Treatment Completion',
    category: 'tb',
    amount: 5000,
    description: 'Ensure TB patient completes full 6-month DOTS treatment and achieves cure.'
  },
  {
    id: 'ifa_distribution',
    name: 'IFA Supplementation (Monthly)',
    category: 'nutrition',
    amount: 25,
    description: 'Distribute Iron-Folic Acid tablets to pregnant women and adolescent girls. Monthly incentive.'
  },
  {
    id: 'anemia_screening',
    name: 'Anemia Screening',
    category: 'nutrition',
    amount: 50,
    description: 'Screen pregnant women and children for anemia using HemoCue or clinical methods.'
  },
  {
    id: 'sam_referral',
    name: 'SAM Child Referral',
    category: 'nutrition',
    amount: 300,
    description: 'Identify and refer Severely Acute Malnourished (SAM) children to nutrition rehabilitation center.'
  },
  {
    id: 'family_planning_sterilization',
    name: 'Family Planning - Sterilization',
    category: 'family_planning',
    amount: 300,
    description: 'Motivate and escort client for voluntary sterilization (tubectomy/vasectomy). High Focus: ₹300. Regular: ₹200.'
  },
];

// Utility function to get task by ID
export const getTaskById = (id: string): NHMTask | undefined => {
  return NHM_TASKS.find(task => task.id === id);
};

// Utility function to get tasks by category
export const getTasksByCategory = (category: NHMTask['category']): NHMTask[] => {
  return NHM_TASKS.filter(task => task.category === category);
};

// Utility function to get total eligible incentive (e.g., for a month)
export const calculateMonthlyIncentive = (tasks: string[]): number => {
  return tasks.reduce((sum, taskId) => {
    const task = getTaskById(taskId);
    return sum + (task?.amount || 0);
  }, 0);
};
