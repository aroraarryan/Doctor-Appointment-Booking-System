/**
 * Calculates BMI and provides category and healthy range.
 * @param {number} weight_kg 
 * @param {number} height_cm 
 * @returns {object} { bmi, category, healthy_range }
 */
const calculateBMI = (weight_kg, height_cm) => {
  if (!weight_kg || !height_cm) return null;
  const height_m = height_cm / 100;
  const bmi = (weight_kg / (height_m * height_m)).toFixed(1);
  const bmiNum = parseFloat(bmi);

  let category = '';
  if (bmiNum < 18.5) category = 'Underweight';
  else if (bmiNum < 25) category = 'Normal weight';
  else if (bmiNum < 30) category = 'Overweight';
  else category = 'Obese';

  const minHealthyWeight = (18.5 * height_m * height_m).toFixed(1);
  const maxHealthyWeight = (24.9 * height_m * height_m).toFixed(1);

  return {
    bmi: bmiNum,
    category,
    healthy_range: `${minHealthyWeight}kg - ${maxHealthyWeight}kg`
  };
};

/**
 * Gets diet and lifestyle recommendations based on BMI and profile.
 * @param {string} bmi_category 
 * @param {number} age 
 * @param {string} activity_level 
 * @returns {string[]} recommendations
 */
const getDietRecommendations = (bmi_category, age, activity_level) => {
  const recommendations = {
    'Underweight': [
      'Eat more frequently. Slowly start adding 5-6 smaller meals during the day.',
      'Choose nutrient-rich foods like whole-grain breads, pastas, and cereals.',
      'Try smoothies and shakes instead of coffee or diet soda.',
      'Add calorie-dense snacks like nuts, peanut butter, cheese, and dried fruits.'
    ],
    'Normal weight': [
      'Maintain a balanced diet rich in fruits, vegetables, and whole grains.',
      'Stay hydrated and aim for at least 8 glasses of water a day.',
      'Include lean proteins like fish, poultry, beans, and lentils.',
      'Engage in at least 150 minutes of moderate aerobic activity weekly.'
    ],
    'Overweight': [
      'Focus on portion control and mindful eating.',
      'Reduce intake of processed foods and sugary drinks.',
      'Increase fiber intake with more vegetables and whole grains.',
      'Aim for at least 30 minutes of physical activity most days of the week.'
    ],
    'Obese': [
      'Consult with a healthcare provider for a personalized weight management plan.',
      'Prioritize high-protein, high-fiber, and low-calorie-density foods.',
      'Reduce sedentary time and gradually increase physical activity.',
      'Monitor progress and seek support from a nutritionist or support group.'
    ]
  };

  const activityTips = {
    'sedentary': 'Try to incorporate 10-minute walks after each meal.',
    'moderate': 'Great job! Consider adding some strength training twice a week.',
    'active': 'Excellent activity level. Ensure you are getting enough recovery time.'
  };

  const results = [...(recommendations[bmi_category] || recommendations['Normal weight'])];
  if (activityTips[activity_level]) {
    results.push(activityTips[activity_level]);
  }

  return results;
};

module.exports = {
  calculateBMI,
  getDietRecommendations
};
