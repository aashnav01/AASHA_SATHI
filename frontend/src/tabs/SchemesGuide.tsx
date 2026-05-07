import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, ChevronUp, BookMarked, Volume2 } from 'lucide-react';

interface Scheme {
  id: string;
  name: string;
  name_hi: string;
  benefit_description: string;
  benefit_description_hi: string;
  who_is_eligible: string;
  who_is_eligible_hi: string;
  what_asha_must_do: string;
  what_asha_must_do_hi: string;
  what_to_tell_patient: string;
  what_to_tell_patient_hi: string;
  category: 'maternal' | 'child' | 'nutrition' | 'immunization' | 'tb' | 'elderly' | 'asha';
}

// ========== 10 HARDCODED GOVERNMENT HEALTH SCHEMES ==========
const SCHEMES: Scheme[] = [
  {
    id: 'jsy',
    name: 'Janani Suraksha Yojana (JSY)',
    name_hi: 'जननी सुरक्षा योजना (जेएसवाई)',
    benefit_description: '₹600 cash to mother for institutional delivery in rural areas. ₹400 in urban areas.',
    benefit_description_hi: 'ग्रामीण क्षेत्रों में संस्थागत प्रसव के लिए माता को ₹600 नकद। शहरी क्षेत्रों में ₹400।',
    who_is_eligible: 'All pregnant women, especially from BPL families, should deliver at registered health facilities.',
    who_is_eligible_hi: 'सभी गर्भवती महिलाएं, विशेषकर बीपीएल परिवारों से, पंजीकृत स्वास्थ्य सुविधाओं में प्रसव करें।',
    what_asha_must_do: 'Register all pregnant women. Counsel them to deliver at government facilities. Verify delivery occurred and help claim cash.',
    what_asha_must_do_hi: 'सभी गर्भवती महिलाओं को पंजीकृत करें। उन्हें सरकारी सुविधाओं में प्रसव के लिए परामर्श दें। प्रसव की जांच करें और नकद दावे में मदद करें।',
    what_to_tell_patient: 'Tell mother: "Deliver at government hospital or PHC to get ₹600 cash and free nutrition for your baby."',
    what_to_tell_patient_hi: 'माता से कहें: "सरकारी अस्पताल या पीएचसी में प्रसव करें ताकि आप ₹600 नकद और अपने बच्चे को मुफ्त पोषण पा सकें।"',
    category: 'maternal'
  },
  {
    id: 'jssk',
    name: 'Janani Shishu Suraksha Karyakram (JSSK)',
    name_hi: 'जननी शिशु सुरक्षा कार्यक्रम (जेएसएसके)',
    benefit_description: 'FREE transport, institutional delivery, medicines, and care for mother & newborn at government facilities.',
    benefit_description_hi: 'सरकारी सुविधाओं में माता और नवजात के लिए मुफ्त परिवहन, संस्थागत प्रसव, दवाएं और देखभाल।',
    who_is_eligible: 'All pregnant women in India, regardless of age, economic status, or residence (urban/rural).',
    who_is_eligible_hi: 'भारत में सभी गर्भवती महिलाएं, उम्र, आर्थिक स्थिति, या निवास की परवाह किए बिना।',
    what_asha_must_do: 'Inform all pregnant women about JSSK benefits. Facilitate free transportation. Ensure 48-hour postpartum stay.',
    what_asha_must_do_hi: 'सभी गर्भवती महिलाओं को जेएसएसके लाभों के बारे में बताएं। मुफ्त परिवहन सुविधा प्रदान करें। प्रसवोत्तर 48 घंटे रहना सुनिश्चित करें।',
    what_to_tell_patient: 'Tell mother: "Your delivery is completely FREE - no transport cost, no medicine cost. Free ambulance and nutrition for you and baby."',
    what_to_tell_patient_hi: 'माता से कहें: "आपका प्रसव पूरी तरह मुफ्त है - कोई परिवहन लागत नहीं, कोई दवा लागत नहीं। आपके और बच्चे के लिए मुफ्त एंबुलेंस और पोषण।"',
    category: 'maternal'
  },
  {
    id: 'pmmvy',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    name_hi: 'प्रधान मंत्री मातृ वंदना योजना (पीएमएमवाई)',
    benefit_description: '₹5000 direct cash benefit for first child to mother. In 3 installments during pregnancy & after delivery.',
    benefit_description_hi: 'पहले बच्चे के लिए गर्भावस्था और प्रसव के बाद माता को ₹5000 सीधे नकद लाभ। 3 किस्तों में।',
    who_is_eligible: 'Pregnant women expecting their first child. Age 19+ years. For children born Jan 2017 onwards.',
    who_is_eligible_hi: 'अपने पहले बच्चे की अपेक्षा करने वाली गर्भवती महिलाएं। 19+ वर्ष की आयु। जनवरी 2017 को या उसके बाद।',
    what_asha_must_do: 'Register eligible pregnant women for PMMVY. Help file application at ANM/health facility. Track installment payments.',
    what_asha_must_do_hi: 'पीएमएमवाई के लिए पात्र गर्भवती महिलाओं को पंजीकृत करें। एएनएम/स्वास्थ्य सुविधा पर आवेदन में मदद करें। किस्त भुगतान ट्रैक करें।',
    what_to_tell_patient: 'Tell mother: "Register now and get ₹5000 directly in your bank account - first now, then after 6 months, then after baby is born."',
    what_to_tell_patient_hi: 'माता से कहें: "अभी पंजीकृत करें और अपने बैंक खाते में ₹5000 प्राप्त करें - पहली किस्त अब, फिर 6 महीने बाद, फिर प्रसव के बाद।"',
    category: 'maternal'
  },
  {
    id: 'pmjay',
    name: 'Ayushman Bharat PMJAY',
    name_hi: 'आयुष्मान भारत पीएमजेएवाई',
    benefit_description: '₹5,00,000 per family per year health cover for hospitalization. Covers 1,393 procedures at empaneled hospitals.',
    benefit_description_hi: 'भर्ती के लिए प्रति परिवार प्रति वर्ष ₹5,00,000 स्वास्थ्य कवर। पैनलबद्ध अस्पतालों में 1,393 प्रक्रियाओं को कवर करता है।',
    who_is_eligible: 'BPL families, SC/ST families, families earning <₹15,000/month. Check eligibility based on SECC 2011.',
    who_is_eligible_hi: 'बीपीएल परिवार, अनुसूचित जाति/जनजाति परिवार, ₹15,000/माह से कम कमाने वाले परिवार।',
    what_asha_must_do: 'Verify eligibility of families. Distribute golden cards. Help register at empaneled hospitals.',
    what_asha_must_do_hi: 'परिवारों की पात्रता सत्यापित करें। स्वर्ण कार्ड वितरित करें। पैनलबद्ध अस्पतालों में पंजीकरण में मदद करें।',
    what_to_tell_patient: 'Tell family: "You have ₹5 lakh free health cover. Any hospital care (surgery, delivery, illness) is FREE. Show your golden card."',
    what_to_tell_patient_hi: 'परिवार से कहें: "आपके पास ₹5 लाख मुफ्त स्वास्थ्य कवर है। कोई भी अस्पताल की देखभाल मुफ्त है। अपना स्वर्ण कार्ड दिखाएं।"',
    category: 'elderly'
  },
  {
    id: 'poshan',
    name: 'POSHAN Abhiyaan',
    name_hi: 'पोषण अभियान',
    benefit_description: 'Free nutrition support: Counseling, micronutrient supplements (IFA, vitamin A), fortified food for children 0-6 years.',
    benefit_description_hi: 'मुफ्त पोषण समर्थन: परामर्श, सूक्ष्म पोषक पूरकता (आईएफए, विटामिन ए), 0-6 वर्ष के बच्चों के लिए गढ़ा हुआ भोजन।',
    who_is_eligible: 'All children 0-6 years. Pregnant women. Mothers of young children. Focus on rural areas.',
    who_is_eligible_hi: 'सभी 0-6 वर्ष के बच्चे। गर्भवती महिलाएं। छोटे बच्चों की माताएं।',
    what_asha_must_do: 'Counsel mothers on nutritious diet (protein, iron, calcium-rich local foods). Distribute IFA tablets & vitamin A. Track child weight.',
    what_asha_must_do_hi: 'माताओं को पौष्टिक आहार पर परामर्श दें। आईएफए टैबलेट और विटामिन ए वितरित करें। बच्चे का वजन ट्रैक करें।',
    what_to_tell_patient: 'Tell mother: "Feed your child eggs, milk, pulses, greens every day. Give vitamin A drops & iron medicine. Monthly check-ups."',
    what_to_tell_patient_hi: 'माता से कहें: "अपने बच्चे को हर दिन अंडे, दूध, दालें, सब्जियां खिलाएं। विटामिन ए की बूंदें और आयरन दें। प्रतिमाह जांच के लिए आएं।"',
    category: 'nutrition'
  },
  {
    id: 'nhmfreedrug',
    name: 'NHM Free Drug Scheme',
    name_hi: 'एनएचएम मुफ्त दवा योजना',
    benefit_description: 'Free essential medicines at PHCs and CHCs: antibiotics, antihistamines, 50+ vital medicines for all.',
    benefit_description_hi: 'पीएचसी और सीएचसी पर मुफ्त आवश्यक दवाएं: एंटीबायोटिक्स, एंटीहिस्टामाइन, 50+ महत्वपूर्ण दवाएं।',
    who_is_eligible: 'All citizens seeking treatment at government PHC/CHC facilities. No restrictions.',
    who_is_eligible_hi: 'सभी नागरिक सरकारी पीएचसी/सीएचसी सुविधाओं पर उपचार की तलाश में।',
    what_asha_must_do: 'Encourage people to seek treatment at PHC. Inform that medicines are FREE. Follow up on treatment adherence.',
    what_asha_must_do_hi: 'लोगों को पीएचसी पर उपचार लेने के लिए प्रोत्साहित करें। सूचित करें कि दवाएं मुफ्त हैं। उपचार पालन पर अनुवर्ती।',
    what_to_tell_patient: 'Tell patient: "Go to our health center (PHC) for medicines. All medicines are FREE. No need to buy from pharmacy."',
    what_to_tell_patient_hi: 'रोगी से कहें: "दवाओं के लिए हमारे स्वास्थ्य केंद्र (पीएचसी) जाएं। सभी दवाएं मुफ्त हैं।"',
    category: 'nutrition'
  },
  {
    id: 'rbsk',
    name: 'Rashtriya Bal Swasthya Karyakram (RBSK)',
    name_hi: 'राष्ट्रीय बाल स्वास्थ्य कार्यक्रम',
    benefit_description: 'FREE health screening & treatment for children 0-18 years: vision, hearing, dental, growth screening.',
    benefit_description_hi: '0-18 वर्ष के बच्चों के लिए मुफ्त स्वास्थ्य जांच और उपचार: दृष्टि, सुनवाई, दंत, वृद्धि जांच।',
    who_is_eligible: 'All children 0-18 years. Special focus on school-age and Anganwadi children.',
    who_is_eligible_hi: 'भारत में 0-18 वर्ष के सभी बच्चे।',
    what_asha_must_do: 'Mobilize children for screening camps. Refer abnormal cases to district hospital. Ensure treatment completion.',
    what_asha_must_do_hi: 'स्क्रीनिंग कैंपों के लिए बच्चों को शामिल करें। असामान्य मामलों को संदर्भित करें। उपचार पूर्ण सुनिश्चित करें।',
    what_to_tell_patient: 'Tell parent: "Bring child to free health check at school. We screen eyes, ears, teeth, weight. If problem, we treat FREE."',
    what_to_tell_patient_hi: 'अभिभावक से कहें: "अपने बच्चे को स्कूल में मुफ्त स्वास्थ्य जांच में लाएं। हम आंखें, कान, दांत, वजन की जांच करते हैं।"',
    category: 'child'
  },
  {
    id: 'mi',
    name: 'Mission Indradhanush',
    name_hi: 'मिशन इंद्रधनुष',
    benefit_description: 'FREE immunization for all children 0-6 years: BCG, Pentavalent, Polio, Rotavirus, PCV, JE vaccine.',
    benefit_description_hi: '0-6 वर्ष के सभी बच्चों के लिए मुफ्त टीकाकरण: बीसीजी, पेंटावैलेंट, पोलियो, रोटावायरस, पीसीवी।',
    who_is_eligible: 'All children 0-6 years regardless of socio-economic status.',
    who_is_eligible_hi: 'सामाजिक आर्थिक स्थिति की परवाह किए बिना 0-6 वर्ष के सभी बच्चे।',
    what_asha_must_do: 'Promote complete immunization. Maintain schedules. Track defaulters. Counsel on vaccine safety.',
    what_asha_must_do_hi: 'पूर्ण टीकाकरण को बढ़ावा दें। शेड्यूल बनाए रखें। चूकों को ट्रैक करें।',
    what_to_tell_patient: 'Tell parent: "Vaccines protect child from measles, polio, whooping cough and more. ALL VACCINES ARE FREE. Bring child on scheduled dates."',
    what_to_tell_patient_hi: 'अभिभावक से कहें: "वैक्सीन बच्चे को खसरा, पोलियो, काली खांसी से बचाते हैं। सभी वैक्सीन मुफ्त हैं।"',
    category: 'immunization'
  },
  {
    id: 'ntep',
    name: 'National TB Elimination Program (NTEP)',
    name_hi: 'राष्ट्रीय टीबी उन्मूलन कार्यक्रम',
    benefit_description: 'FREE TB screening, diagnosis, and 6-month anti-TB drugs. ₹500/month Nikshay Poshan support during treatment.',
    benefit_description_hi: 'मुफ्त टीबी स्क्रीनिंग, निदान, 6 माह की एंटी-टीबी दवाएं। उपचार के दौरान ₹500/माह समर्थन।',
    who_is_eligible: 'All TB suspects and diagnosed TB patients, regardless of economic status.',
    who_is_eligible_hi: 'सभी टीबी संदिग्ध और निदान टीबी रोगी।',
    what_asha_must_do: 'Screen for persistent cough >3 weeks. Refer suspects for sputum test. Ensure daily medicines (DOT). Provide nutrition support.',
    what_asha_must_do_hi: '3 सप्ताह से अधिक खांसी के लिए स्क्रीन करें। संदिग्धों को संदर्भित करें। दैनिक दवा सुनिश्चित करें।',
    what_to_tell_patient: 'Tell patient: "If cough for 3+ weeks, get TB test. TB is CURABLE with FREE medicines for 6 months. You also get ₹500/month for nutrition."',
    what_to_tell_patient_hi: 'रोगी से कहें: "3 सप्ताह से ज्यादा खांसी हो तो टीबी परीक्षण करवाएं। टीबी मुफ्त दवाओं से ठीक हो सकता है। ₹500/माह पोषण सहायता भी मिलेगी।"',
    category: 'tb'
  },
  {
    id: 'pmsym',
    name: 'Pradhan Mantri Shram Yogi Maandhan (PM-SYM)',
    name_hi: 'प्रधान मंत्री श्रम योगी मानधन',
    benefit_description: 'Pension for ASHA workers & informal laborers. ₹3000/month pension after age 60. Contribution: ₹55-200/month.',
    benefit_description_hi: 'एएसएचए कार्यकर्ताओं और श्रमिकों के लिए पेंशन। 60 वर्ष के बाद ₹3000/माह। योगदान: ₹55-200/माह।',
    who_is_eligible: 'ASHA workers, Anganwadi workers, construction/agricultural workers. Age 18-40 at enrollment.',
    who_is_eligible_hi: 'एएसएचए कार्यकर्ता, आंगनवाड़ी कार्यकर्ता, निर्माण/कृषि श्रमिक। नामांकन पर 18-40 वर्ष।',
    what_asha_must_do: 'Self-enroll via bank/CSC or supervisor. Contribute monthly premium. Encourage other ASHA workers to join.',
    what_asha_must_do_hi: 'बैंक/सीएससी या पर्यवेक्षक के माध्यम से स्व-नामांकन करें। मासिक प्रीमियम में योगदान दें।',
    what_to_tell_patient: 'Tell ASHA peer: "Join PM-SYM now. Contribute ₹55-200/month until 60. At 60, get ₹3000/month pension for life. Secure your future!"',
    what_to_tell_patient_hi: 'एएसएचए साथी से कहें: "पीएम-एसवाई में अभी शामिल हों। 60 तक ₹55-200/माह योगदान दें। फिर जीवन भर ₹3000/माह पेंशन पाएं।"',
    category: 'asha'
  }
];

export const SchemesGuide: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { speak } = useTextToSpeech();
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // TTS voice intro on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      speak(t('schemes.voice_intro', 'Government health schemes guide. Learn about 10 major schemes for maternal health, child health, nutrition, and more.'));
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Filter schemes by search query
  const filteredSchemes = useMemo(() => {
    if (!searchQuery.trim()) return SCHEMES;
    const query = searchQuery.toLowerCase();
    return SCHEMES.filter(
      scheme =>
        scheme.name.toLowerCase().includes(query) ||
        scheme.name_hi.toLowerCase().includes(query) ||
        scheme.benefit_description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Get category count
  const getCategoryCount = (category: string) => {
    return SCHEMES.filter(s => s.category === category).length;
  };

  // Speak scheme details
  const handleSpeak = (scheme: Scheme) => {
    const lang = i18n.language;
    const text =
      lang === 'hi'
        ? `${scheme.name_hi}. लाभ: ${scheme.benefit_description_hi}`
        : `${scheme.name}. Benefit: ${scheme.benefit_description}`;
    speak(text);
  };

  // Toggle expand
  const toggleExpand = (schemeId: string) => {
    setExpandedScheme(expandedScheme === schemeId ? null : schemeId);
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('schemes.title', 'Government Schemes')}</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">{t('schemes.subtitle', '10 major health schemes explained')}</p>
        </div>
        <BookMarked size={32} className="text-blue-500" />
      </div>

      {/* Search Bar */}
      <Card className="!p-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder={t('schemes.search', 'Search schemes...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent flex-1 text-sm focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-500 hover:text-gray-700 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </Card>

      {/* Category Info */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="text-xs">
          <p className="font-bold text-pink-600">{getCategoryCount('maternal')}</p>
          <p className="text-gray-600 text-xs">{t('schemes.maternal', 'Maternal')}</p>
        </div>
        <div className="text-xs">
          <p className="font-bold text-blue-600">{getCategoryCount('child')}</p>
          <p className="text-gray-600 text-xs">{t('schemes.child', 'Child')}</p>
        </div>
        <div className="text-xs">
          <p className="font-bold text-green-600">{getCategoryCount('nutrition')}</p>
          <p className="text-gray-600 text-xs">{t('schemes.nutrition', 'Nutrition')}</p>
        </div>
      </div>

      {/* Schemes List */}
      <div className="space-y-3">
        {filteredSchemes.length > 0 ? (
          filteredSchemes.map(scheme => (
            <Card
              key={scheme.id}
              className={`!p-0 overflow-hidden border-l-4 ${
                scheme.category === 'maternal'
                  ? 'border-l-pink-500'
                  : scheme.category === 'child'
                  ? 'border-l-blue-500'
                  : scheme.category === 'nutrition'
                  ? 'border-l-green-500'
                  : scheme.category === 'immunization'
                  ? 'border-l-purple-500'
                  : scheme.category === 'tb'
                  ? 'border-l-red-500'
                  : scheme.category === 'elderly'
                  ? 'border-l-yellow-500'
                  : 'border-l-indigo-500'
              }`}
            >
              {/* Header (Always Visible) */}
              <button
                onClick={() => toggleExpand(scheme.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm line-clamp-1">
                    {i18n.language === 'hi' ? scheme.name_hi : scheme.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                    {i18n.language === 'hi' ? scheme.benefit_description_hi : scheme.benefit_description}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(scheme);
                    }}
                    className="p-1 hover:bg-blue-100 rounded transition-colors"
                    title="Speak details"
                  >
                    <Volume2 size={16} className="text-blue-500" />
                  </button>
                  {expandedScheme === scheme.id ? (
                    <ChevronUp size={20} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-600" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {expandedScheme === scheme.id && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-3 animate-slide-down">
                  {/* Who is Eligible */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">
                      {t('schemes.eligible', 'Who is Eligible?')}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {i18n.language === 'hi' ? scheme.who_is_eligible_hi : scheme.who_is_eligible}
                    </p>
                  </div>

                  {/* What ASHA Must Do */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">
                      {t('schemes.asha_role', 'What ASHA Must Do')}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {i18n.language === 'hi' ? scheme.what_asha_must_do_hi : scheme.what_asha_must_do}
                    </p>
                  </div>

                  {/* What to Tell Patient */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-1">
                      {t('schemes.tell_patient', 'What to Tell the Patient')}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      "{i18n.language === 'hi' ? scheme.what_to_tell_patient_hi : scheme.what_to_tell_patient}"
                    </p>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setExpandedScheme(null)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 mt-2"
                  >
                    {t('common.close', 'Close')}
                  </button>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="!p-6 text-center bg-gray-50 border-gray-200">
            <p className="text-gray-600 font-bold">{t('schemes.no_results', 'No schemes found')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('schemes.try_different', 'Try a different search')}</p>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <Card className="!p-4 bg-blue-50 border-blue-200 space-y-2 text-sm">
        <p className="font-bold text-blue-900">💡 {t('schemes.tip', 'Tip')}</p>
        <p className="text-blue-800 text-xs">
          {t(
            'schemes.tip_text',
            'Memorize the key benefits & eligibility of each scheme. Use the search to quickly find information when talking to beneficiaries. All data is offline—no internet needed.'
          )}
        </p>
      </Card>
    </div>
  );
};
