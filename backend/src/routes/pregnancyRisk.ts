import { Router, Request, Response } from 'express';

const router = Router();

interface PregnancyRiskRequest {
  hemoglobin_g_dl: number;
  ppd_score: number;
  epds_q10_score: number;
  systolic_bp: number;
  diastolic_bp: number;
  gestational_age_weeks: number;
  has_bleeding?: boolean;
  has_severe_headache?: boolean;
  has_reduced_fetal_movement?: boolean;
  has_fever?: boolean;
  has_swelling?: boolean;
}

// WHO/ICMR-based risk classification
function assessPregnancyRisk(data: PregnancyRiskRequest): {
  risk_level: 'low' | 'medium' | 'high';
  reasons: string[];
  recommendations: string[];
} {
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // Danger Signs (Immediate RED FLAGS)
  if (data.has_bleeding) {
    reasons.push('Vaginal bleeding – Obstetric Emergency');
    recommendations.push('IMMEDIATE REFERRAL: Go to FRU/District Hospital immediately. Bleeding in pregnancy is a critical danger sign.');
  }
  
  if (data.has_reduced_fetal_movement && data.gestational_age_weeks >= 24) {
    reasons.push('Decreased fetal movements – Risk of fetal distress');
    recommendations.push('URGENT REFERRAL: Immediate fetal monitoring (NST/Ultrasound) required.');
  }

  if (data.has_severe_headache || data.has_swelling) {
    reasons.push('Severe headache or Swelling (Face/Hands) – Warning signs of Pre-eclampsia');
    recommendations.push('URGENT REFERRAL: Test urine for albumin (protein). Evaluate for pre-eclampsia/eclampsia immediately.');
  }

  if (data.has_fever) {
    reasons.push('High Fever – Infection Risk');
    recommendations.push('Refer to PHC. Screen for Malaria, UTI, or systemic infections.');
  }

  // PPD Score assessment (EPDS thresholds)
  if (data.epds_q10_score > 0) {
    reasons.push('Risk of self-harm identified (EPDS Item 10) – immediate risk');
    recommendations.push('IMMEDIATE REFERRAL: Patient expressed thoughts of self-harm. Do not leave patient alone. Refer to psychiatric emergency.');
  } else if (data.ppd_score >= 13) {
    reasons.push('High PPD score (≥13) – immediate referral indicated');
    recommendations.push('Refer to mental health professional or ASHA supervisor immediately');
  } else if (data.ppd_score >= 10) {
    reasons.push('Moderate PPD score (10-12) – monitoring required');
    recommendations.push('Discuss with supervisor; schedule follow-up counselling');
  }

  // Blood pressure (WHO hypertension in pregnancy thresholds)
  if (data.systolic_bp >= 160 || data.diastolic_bp >= 110) {
    reasons.push('Severe hypertension (BP ≥160/110) – obstetric emergency');
    recommendations.push('Emergency referral to hospital immediately');
  } else if (data.systolic_bp >= 140 || data.diastolic_bp >= 90) {
    reasons.push('Gestational hypertension (BP ≥140/90)');
    recommendations.push('Refer to PHC/district hospital for monitoring and antihypertensive evaluation');
  } else if (data.systolic_bp >= 130 || data.diastolic_bp >= 85) {
    reasons.push('Elevated BP (130-139/85-89) – borderline');
    recommendations.push('Monitor BP closely; reduce salt intake; follow up in 1 week');
  }

  // Anemia (ICMR/WHO classification for pregnancy)
  if (data.hemoglobin_g_dl < 7.0) {
    reasons.push('Severe anemia (Hb < 7.0 g/dL) in pregnancy – risk of preterm birth and maternal mortality');
    recommendations.push('Intravenous iron or blood transfusion may be needed; refer to hospital');
  } else if (data.hemoglobin_g_dl < 10.0) {
    reasons.push('Moderate anemia (Hb 7.0-9.9 g/dL) – requires iron supplementation');
    recommendations.push('Ensure daily iron-folic acid tablets; iron-rich diet; follow-up in 4 weeks');
  } else if (data.hemoglobin_g_dl < 11.0) {
    reasons.push('Mild anemia (Hb 10.0-10.9 g/dL) – monitor and supplement');
    recommendations.push('Iron-folic acid supplementation; dietary advice on iron-rich foods');
  }

  // Gestational age risks (WHO preterm / IUGR risk)
  if (data.gestational_age_weeks < 28) {
    reasons.push('Very preterm gestation (<28 weeks) – high vulnerability period');
    recommendations.push('Regular ANC visits; facility-based delivery recommended');
  } else if (data.gestational_age_weeks < 37) {
    reasons.push('Preterm gestation (<37 weeks)');
    recommendations.push('Monitor fetal movement; plan for facility delivery');
  }

  // Determine overall risk level
  const isHigh =
    data.has_bleeding ||
    data.has_severe_headache ||
    data.has_fever ||
    (data.has_reduced_fetal_movement && data.gestational_age_weeks >= 24) ||
    data.epds_q10_score > 0 ||
    data.ppd_score >= 13 ||
    data.systolic_bp >= 140 ||
    data.diastolic_bp >= 90 ||
    data.hemoglobin_g_dl < 7.0 ||
    data.gestational_age_weeks < 28;

  const isMedium =
    !isHigh &&
    (data.has_swelling ||
      data.ppd_score >= 10 ||
      data.systolic_bp >= 130 ||
      data.diastolic_bp >= 85 ||
      data.hemoglobin_g_dl < 10.0 ||
      data.gestational_age_weeks < 37);

  const risk_level: 'low' | 'medium' | 'high' = isHigh ? 'high' : isMedium ? 'medium' : 'low';

  if (risk_level === 'low') {
    recommendations.push('Continue regular ANC visits; maintain iron-folic acid supplementation; balanced diet');
  }

  return { risk_level, reasons, recommendations };
}

// ─── POST /api/pregnancy-risk ──────────────────────────────────────────────────
router.post('/', (req: Request, res: Response) => {
  const {
    hemoglobin_g_dl,
    ppd_score,
    epds_q10_score,
    systolic_bp,
    diastolic_bp,
    gestational_age_weeks,
    has_bleeding,
    has_severe_headache,
    has_reduced_fetal_movement,
    has_fever,
    has_swelling,
  }: PregnancyRiskRequest = req.body;

  if (
    hemoglobin_g_dl === undefined ||
    ppd_score === undefined ||
    epds_q10_score === undefined ||
    systolic_bp === undefined ||
    diastolic_bp === undefined ||
    gestational_age_weeks === undefined
  ) {
    return res.status(400).json({
      error: 'Required fields: hemoglobin_g_dl, ppd_score, epds_q10_score, systolic_bp, diastolic_bp, gestational_age_weeks',
    });
  }

  const result = assessPregnancyRisk({
    hemoglobin_g_dl: Number(hemoglobin_g_dl),
    ppd_score: Number(ppd_score),
    epds_q10_score: Number(epds_q10_score),
    systolic_bp: Number(systolic_bp),
    diastolic_bp: Number(diastolic_bp),
    gestational_age_weeks: Number(gestational_age_weeks),
    has_bleeding: Boolean(has_bleeding),
    has_severe_headache: Boolean(has_severe_headache),
    has_reduced_fetal_movement: Boolean(has_reduced_fetal_movement),
    has_fever: Boolean(has_fever),
    has_swelling: Boolean(has_swelling),
  });

  return res.json(result);
});

export default router;
