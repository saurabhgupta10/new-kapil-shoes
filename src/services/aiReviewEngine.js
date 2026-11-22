import { isNearDuplicate, hashText } from './similarity.js';
import storage from '../db/storage.js';
import { stores, defaultStoreId } from '../config/business.js';

// 6 Required Review Writing Styles
export const REVIEW_STYLES = [
  { id: 'simple', name: 'Simple and natural', description: 'Clean, direct everyday language' },
  { id: 'friendly', name: 'Friendly and conversational', description: 'Warm, relatable, and approachable' },
  { id: 'detailed', name: 'Detailed and descriptive', description: 'Comprehensive feedback on fit, quality & service' },
  { id: 'short', name: 'Short and direct', description: 'Quick, punchy 1-2 sentence recommendation' },
  { id: 'personal', name: 'Personal and expressive', description: 'First-person narrative and genuine reflection' },
  { id: 'professional', name: 'Professional and balanced', description: 'Objective, courteous, structured review' },
];

/**
 * Vocabulary & Sentence Matrix for Footwear Feedback
 */
const VOCABULARY = {
  en: {
    positiveOpeners: [
      'Visited New Kapil Shoes today and had a very pleasant experience.',
      'Purchased footwear from New Kapil Shoes recently.',
      'Really satisfied with my shopping experience at New Kapil Shoes.',
      'New Kapil Shoes is a dependable footwear shop.',
      'Had a wonderful experience buying shoes at New Kapil Shoes.',
      'I was looking for comfortable daily footwear and found exactly what I needed at New Kapil Shoes.',
      'Great local footwear store with a very welcoming environment.',
      'Came to New Kapil Shoes based on recommendations and was not disappointed.',
      'A great place if you are looking for reliable footwear.',
      'Shopping at New Kapil Shoes was quick, convenient, and satisfying.',
      'Glad I visited New Kapil Shoes for my recent footwear purchase.',
      'Found New Kapil Shoes to be one of the best footwear shops around.',
    ],
    neutralOpeners: [
      'Visited New Kapil Shoes recently for footwear shopping.',
      'Checked out the footwear collection at New Kapil Shoes.',
      'Decent local shoe store with regular footwear items.',
      'Purchased a pair from New Kapil Shoes.',
      'Sharing my honest feedback after shopping at New Kapil Shoes.',
      'An average shopping experience at New Kapil Shoes.',
    ],
    criticalOpeners: [
      'Visited New Kapil Shoes recently.',
      'Sharing my honest feedback regarding my experience at New Kapil Shoes.',
      'Purchased footwear from New Kapil Shoes but felt the experience could improve.',
      'Visited the store to buy footwear recently.',
      'A few areas could use improvement at New Kapil Shoes.',
    ],
    qualitySynonyms: ['top quality', 'durable build', 'good material', 'long-lasting finish', 'sturdy build'],
    comfortSynonyms: ['very comfortable to wear', 'cushioned and easy on the feet', 'perfect all-day comfort', 'comfortable fit'],
    collectionSynonyms: ['wide variety of slippers and sandals', 'fresh collection of shoes', 'impressive variety', 'neatly organized footwear display'],
    priceSynonyms: ['pocket-friendly rates', 'fair and reasonable prices', 'great value for money', 'budget-conscious pricing'],
    staffSynonyms: ['patient and attentive staff', 'helpful and polite team', 'well-mannered salespersons', 'supportive staff'],
    positiveClosers: [
      'Definitely worth visiting if you need quality shoes or sandals.',
      'Will surely visit again for my next footwear purchase.',
      'Highly recommend New Kapil Shoes to anyone looking for durable footwear.',
      'Very happy with the overall value and comfort.',
      'Glad to support this local footwear business. Recommended!',
      'Five stars well deserved for great footwear and honest service.',
      'A solid 10/10 shopping experience for footwear.',
    ],
    neutralClosers: [
      'Reasonable place for everyday slippers and sandals.',
      'An okay place for basic footwear needs.',
      'Decent footwear options if you are around the area.',
      'Fair pricing, hope to see more premium collection in the future.',
    ],
    criticalClosers: [
      'Hope the store takes customer feedback positively and improves.',
      'Would appreciate better variety, improved service and attentiveness in future visits.',
      'Room for improvement in customer service and footwear collection.',
    ],
  },

  hi: {
    positiveOpeners: [
      'न्यू कपिल शूज से फुटवेयर खरीदा, बहुत ही बढ़िया अनुभव रहा।',
      'न्यू कपिल शूज में खरीदारी करके मन खुश हो गया।',
      'हाल ही में न्यू कपिल शूज गया था और यहां का अनुभव काफी अच्छा था।',
      'अगर आपको आरामदायक और टिकाऊ जूते चाहिए तो न्यू कपिल शूज एक बेहतरीन दुकान है।',
      'न्यू कपिल शूज पर फुटवेयर की काफी अच्छी रेंज उपलब्ध है।',
      'यहां से जूते और चप्पल खरीदे, क्वालिटी में कोई कमी नहीं है।',
      'न्यू कपिल शूज हमारे क्षेत्र की एक भरोसेमंद जूते-चप्पल की दुकान है।',
      'न्यू कपिल शूज में शॉपिंग करने का अनुभव बहुत सुखद और संतोषजनक रहा।',
      'पहली बार न्यू कपिल शूज गया और बहुत अच्छा लगा।',
      'जूते-सैंडल की खरीदारी के लिए न्यू कपिल शूज एक शानदार विकल्प है।',
    ],
    neutralOpeners: [
      'न्यू कपिल शूज से जूते खरीदे, ठीक-ठाक अनुभव रहा।',
      'दुकान पर सामान्य फुटवेयर की वैरायटी उपलब्ध है।',
      'न्यू कपिल शूज पर रोजमर्रा के फुटवेयर के लिए जा सकते हैं।',
      'हाल ही में न्यू कपिल शूज से खरीदारी की, अनुभव औसत रहा।',
    ],
    criticalOpeners: [
      'न्यू कपिल शूज से खरीदारी की, लेकिन कुछ चीजों में सुधार की जरूरत लगी।',
      'हाल ही में न्यू कपिल शूज गया था, अनुभव उम्मीद के मुताबिक नहीं रहा।',
      'दुकान में फुटवेयर का कलेक्शन और सर्विस बेहतर की जा सकती है।',
      'न्यू कपिल शूज पर मेरा अनुभव मिला-जुला रहा और सुधार की गुंजाइश है।',
    ],
    qualitySynonyms: ['क्वालिटी बहुत मजबूत और टिकाऊ है', 'मटेरियल काफी बढ़िया है', 'जूते काफी मजबूत हैं'],
    comfortSynonyms: ['पहनने में बेहद आरामदायक हैं', 'पैरों के लिए बहुत कम्फर्टेबल हैं', 'आराम और फिटिंग एकदम सही है'],
    collectionSynonyms: ['सैंडल, चप्पल और जूतों का शानदार कलेक्शन है', 'वैरायटी काफी अच्छी है', 'डिजाइन और ऑप्शंस भरपूर हैं'],
    priceSynonyms: ['दाम बिल्कुल वाजिब और किफायती हैं', 'कीमत बजट में है', 'पैसे की पूरी कद्र (वैल्यू फॉर मनी) है'],
    staffSynonyms: ['स्टाफ बहुत विनम्र और मददगार है', 'दुकानदार का स्वभाव काफी अच्छा है', 'स्टाफ ने बड़े प्यार से जूते दिखाए'],
    positiveClosers: [
      'फुटवेयर खरीदने के लिए न्यू कपिल शूज को जरूर रेकमेंड करूंगा।',
      'आगे भी जरूरत पड़ने पर यहीं से खरीदारी करूंगा।',
      'शानदार जूते और अच्छी सेवा के लिए धन्यवाद।',
      'पैसे वसूल खरीदारी, सभी को यहां आने की सलाह दूंगा।',
      'न्यू कपिल शूज को 5 स्टार!',
    ],
    neutralClosers: [
      'सामान्य उपयोग के जूतों-चप्पलों के लिए ठीक दुकान है।',
      'दाम ठीक हैं, भविष्य में और वैरायटी की उम्मीद है।',
      'औसत खरीदारी अनुभव रहा।',
    ],
    criticalClosers: [
      'उम्मीद है कि दुकान प्रबंधन ग्राहकों की राय पर ध्यान देकर सेवा में सुधार करेगा।',
      'क्वालिटी और वैरायटी पर थोड़ा और ध्यान देने की जरूरत है।',
    ],
  },

  hinglish: {
    positiveOpeners: [
      'New Kapil Shoes se shopping karke dil khush ho gaya.',
      'Recently New Kapil Shoes visit kiya, overall experience bohot shandar raha.',
      'Footwear ke liye New Kapil Shoes ek genuine aur reliable shop hai.',
      'New Kapil Shoes se daily wear shoes liye, experience bohot achha raha.',
      'Agar achhe shoes aur slippers chahiye to New Kapil Shoes zaroor visit karein.',
      'First time New Kapil Shoes gaya tha aur service se kaafi impress hua.',
      'New Kapil Shoes par footwear ka collection dekh kar maza aa gaya.',
      'Apne family ke liye footwear New Kapil Shoes se khareeda, full satisfaction mila.',
      'Shoe shopping ke liye New Kapil Shoes sach me ek behtareen jagah hai.',
      'New Kapil Shoes par shopping ka experience smooth aur hassle-free tha.',
    ],
    neutralOpeners: [
      'New Kapil Shoes se footwear liya, theek-thaak experience raha.',
      'Regular footwear ke liye New Kapil Shoes ek decent shop hai.',
      'New Kapil Shoes visit kiya tha, collection okay-okay hai.',
      'Daily slippers ke liye New Kapil Shoes sahi option hai, normal experience raha.',
    ],
    criticalOpeners: [
      'New Kapil Shoes visit kiya tha, par experience kuch khaas nahi raha.',
      'Footwear shopping ki yahan se, service aur variety me improvement ki zaroorat hai.',
      'Expected tha ki better collection milega, thoda disappoint hua.',
      'New Kapil Shoes par overall experience average se thoda kam raha.',
    ],
    qualitySynonyms: ['quality bohot mazboot aur solid hai', 'material ek number hai', 'finishing aur durability top-notch hai'],
    comfortSynonyms: ['pehanne me bohot comfortable hai', 'shoes ka sole aur cushion kaafi soft hai', 'fitting aur comfort perfect hai'],
    collectionSynonyms: ['shoes, sandals aur slippers ka kaafi accha collection hai', 'variety kaafi diverse aur fresh hai', 'latest design mil jaate hain'],
    priceSynonyms: ['prices kaafi reasonable aur pocket-friendly hain', 'rates bilkul genuine hain', 'paisa vasool deal mili'],
    staffSynonyms: ['staff bohot cooperative aur polite hai', 'nature kaafi helpful hai bhaiya ka', 'customer ko achhe se guide karte hain'],
    positiveClosers: [
      'Sabhi ko New Kapil Shoes recommend karunga, zaroor visit karein!',
      'Definitely next time bhi yahi se shoes purchase karunga.',
      'Paisa vasool shopping experience! 5 stars.',
      'Aisi service aur quality har local store par honi chahiye.',
      'Super happy with the footwear and customer care.',
    ],
    neutralClosers: [
      'Basic footwear ke liye sahi jagah hai.',
      'Prices theek hain, aage aur nayi variety aani chahiye.',
      'Average experience, theek-thaak shopping thi.',
    ],
    criticalClosers: [
      'Umeed hai store management customer feedback ko positively lekar improve karega.',
      'Variety aur customer attentiveness par thoda kaam karne ki zaroorat hai.',
    ],
  },
};

/**
 * Helper to pick random item from array
 */
function pickRandom(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Helper to shuffle array (Fisher-Yates)
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Maps selected tag IDs/keys to linguistic descriptors
 */
function getTagPhrases(selectedTags = [], lang = 'en', isPositive = true) {
  const vocab = VOCABULARY[lang] || VOCABULARY.en;
  const phrases = [];

  const tagList = Array.isArray(selectedTags) ? selectedTags : [];

  for (const tag of tagList) {
    const t = String(tag).toLowerCase();
    if (t.includes('quality')) {
      phrases.push(pickRandom(vocab.qualitySynonyms));
    } else if (t.includes('comfort')) {
      phrases.push(pickRandom(vocab.comfortSynonyms));
    } else if (t.includes('collection') || t.includes('variety')) {
      phrases.push(pickRandom(vocab.collectionSynonyms));
    } else if (t.includes('price') || t.includes('value') || t.includes('affordable')) {
      phrases.push(pickRandom(vocab.priceSynonyms));
    } else if (t.includes('staff') || t.includes('service')) {
      phrases.push(pickRandom(vocab.staffSynonyms));
    }
  }

  // Fallback if no specific tags selected
  if (phrases.length === 0) {
    if (isPositive) {
      phrases.push(pickRandom(vocab.qualitySynonyms));
      phrases.push(pickRandom(vocab.comfortSynonyms));
    }
  }

  return phrases;
}

/**
 * Builds a review text using Algorithmic Linguistic Synthesis
 * according to style, rating, language, and custom comment.
 */
export function buildAlgorithmicReview({
  style = 'Simple and natural',
  rating = 5,
  feedbackOptions = [],
  customComment = '',
  language = 'en',
  seedOffset = 0,
}) {
  const lang = ['en', 'hi', 'hinglish'].includes(language) ? language : 'en';
  const vocab = VOCABULARY[lang];
  const isHighRating = rating >= 4;
  const isMidRating = rating === 3;
  const isLowRating = rating <= 2;

  const openers = isHighRating
    ? vocab.positiveOpeners
    : isMidRating
    ? vocab.neutralOpeners
    : vocab.criticalOpeners;

  const closers = isHighRating
    ? vocab.positiveClosers
    : isMidRating
    ? vocab.neutralClosers
    : vocab.criticalClosers;

  const tagPhrases = getTagPhrases(feedbackOptions, lang, isHighRating);
  const trimmedComment = String(customComment || '').trim();

  // Rotate opener based on seedOffset to prevent repetition
  const opener = openers[(Math.floor(Math.random() * openers.length) + seedOffset) % openers.length];
  const closer = closers[(Math.floor(Math.random() * closers.length) + seedOffset) % closers.length];

  let review = '';

  // 1. Style: "Short and direct"
  if (style === 'Short and direct') {
    if (lang === 'en') {
      if (isHighRating) {
        const feature = tagPhrases[0] ? ` ${tagPhrases[0].charAt(0).toUpperCase() + tagPhrases[0].slice(1)}.` : '';
        review = `Great experience at New Kapil Shoes.${feature} ${closer}`;
      } else if (isMidRating) {
        review = `Decent footwear store with affordable options. Okay overall.`;
      } else {
        review = `Experience at New Kapil Shoes was below expectation. Hope they improve.`;
      }
    } else if (lang === 'hi') {
      if (isHighRating) {
        const feature = tagPhrases[0] ? ` ${tagPhrases[0]}।` : '';
        review = `न्यू कपिल शूज से बहुत अच्छी खरीदारी रही।${feature} ${closer}`;
      } else if (isMidRating) {
        review = `रोजमर्रा के उपयोग के लिए ठीक दुकान है। औसत अनुभव रहा।`;
      } else {
        review = `न्यू कपिल शूज पर अनुभव कुछ खास नहीं रहा। सुधार की आवश्यकता है।`;
      }
    } else {
      // Hinglish
      if (isHighRating) {
        const feature = tagPhrases[0] ? ` ${tagPhrases[0]}.` : '';
        review = `New Kapil Shoes par badhiya experience mila.${feature} ${closer}`;
      } else if (isMidRating) {
        review = `Normal footwear ke liye theek shop hai. Average shopping experience.`;
      } else {
        review = `New Kapil Shoes ka experience thoda weak raha. Hope improve hoga.`;
      }
    }
  }

  // 2. Style: "Friendly and conversational"
  else if (style === 'Friendly and conversational') {
    if (lang === 'en') {
      if (isHighRating) {
        const featureText = tagPhrases.length > 1
          ? `Honestly loved both the ${tagPhrases[0]} and ${tagPhrases[1]}.`
          : `Really loved the ${tagPhrases[0] || 'quality and comfort'}.`;
        review = `${opener} ${featureText} The footwear feels super durable and looks great. ${closer}`;
      } else if (isMidRating) {
        review = `${opener} Got what I needed for daily wear. Fair pricing and okay staff behavior. ${closer}`;
      } else {
        review = `${opener} Was hoping for a smoother visit and better service. Hopefully things get better next time.`;
      }
    } else if (lang === 'hi') {
      if (isHighRating) {
        const featureText = tagPhrases.length > 1
          ? `सच कहूं तो ${tagPhrases[0]} और ${tagPhrases[1]} दोनों ने दिल जीत लिया।`
          : `${tagPhrases[0] || 'क्वालिटी और कम्फर्ट'} वाकई तारीफ के काबिल है।`;
        review = `${opener} ${featureText} जूते पहनकर काफी अच्छा लगा। ${closer}`;
      } else if (isMidRating) {
        review = `${opener} सामान्य चप्पल-सैंडल के लिए ठीक है। स्टाफ का व्यवहार भी सामान्य रहा। ${closer}`;
      } else {
        review = `${opener} उम्मीद से कम अच्छा अनुभव रहा। उम्मीद है वे ग्राहक सेवा पर ध्यान देंगे।`;
      }
    } else {
      // Hinglish
      if (isHighRating) {
        const featureText = tagPhrases.length > 1
          ? `Sach me ${tagPhrases[0]} aur ${tagPhrases[1]} dono ekdum mast lage.`
          : `${tagPhrases[0] || 'Quality aur comfort'} sach me bohot sahi hai.`;
        review = `${opener} ${featureText} Footwear pehan kar full comfortable feel hota hai. ${closer}`;
      } else if (isMidRating) {
        review = `${opener} Daily wear ke liye theek hai. Price theek laga par variety aur honi chahiye thi. ${closer}`;
      } else {
        review = `${opener} Jaisa socha tha waisa response nahi mila. Staff aur service me improvement chahiye.`;
      }
    }
  }

  // 3. Style: "Detailed and descriptive"
  else if (style === 'Detailed and descriptive') {
    if (lang === 'en') {
      if (isHighRating) {
        const joinedFeatures = tagPhrases.slice(0, 3).join(', ');
        review = `${opener} Specifically impressed by the ${joinedFeatures || 'comfort, fitting and product finish'}. The footwear feels reliable and well-stitched for everyday use. Staff was courteous throughout the visit. ${closer}`;
      } else if (isMidRating) {
        review = `${opener} They have a standard selection of shoes and sandals. The prices are reasonable, though the collection could include more modern designs. Overall a satisfactory visit.`;
      } else {
        review = `${opener} A few specific aspects fell short during my visit, especially regarding staff attentiveness and available sizes. Hope management takes steps to upgrade customer experience.`;
      }
    } else if (lang === 'hi') {
      if (isHighRating) {
        const joinedFeatures = tagPhrases.slice(0, 3).join(', ');
        review = `${opener} विशेष रूप से ${joinedFeatures || 'जूतों की फिटिंग, कम्फर्ट और बेहतरीन फिनिशिंग'} ने बहुत प्रभावित किया। हर रोज पहनने के लिए जूते काफी टिकाऊ महसूस होते हैं। ${closer}`;
      } else if (isMidRating) {
        review = `${opener} जूतों और सैंडलों का सामान्य कलेक्शन है। दाम तो वाजिब हैं लेकिन कुछ और नए डिजाइनों की कमी महसूस हुई। कुल मिलाकर कामचलाऊ अनुभव रहा।`;
      } else {
        review = `${opener} खरीदारी के दौरान कुछ बातों में कमी महसूस हुई, खासकर साइज उपलब्धता और ग्राहक सेवा में। आशा है दुकान में जल्द सुधार देखने को मिलेगा।`;
      }
    } else {
      // Hinglish
      if (isHighRating) {
        const joinedFeatures = tagPhrases.slice(0, 3).join(', ');
        review = `${opener} Khas taur par ${joinedFeatures || 'fitting, solid build aur comfortable sole'} kaafi achha laga. Daily rough use ke liye bhi footwear durable lag raha hai. ${closer}`;
      } else if (isMidRating) {
        review = `${opener} Normal joote aur chappal ka standard stock hai. Rates theek-thaak hain, lekin nayi varieties aur sizes add hone chahiye. Average shopping rahi.`;
      } else {
        review = `${opener} Footwear shopping ke dauran kuch issues notice hue, especially service aur size options me. Store ko customer satisfaction par aur work karna chahiye.`;
      }
    }
  }

  // 4. Style: "Personal and expressive"
  else if (style === 'Personal and expressive') {
    if (lang === 'en') {
      if (isHighRating) {
        review = `I personally visited New Kapil Shoes to pick up a new pair of footwear. I was pleasantly surprised by how ${tagPhrases[0] || 'comfortable and well-crafted'} they are. Truly happy with my purchase. ${closer}`;
      } else if (isMidRating) {
        review = `Dropped by New Kapil Shoes for routine footwear. It met my basic requirements, though there is potential for a broader collection. ${closer}`;
      } else {
        review = `Personally felt that my visit to New Kapil Shoes could have been much better. Customer care and quality didn't meet my expectations today.`;
      }
    } else if (lang === 'hi') {
      if (isHighRating) {
        review = `मैंने खुद न्यू कपिल शूज जाकर अपने लिए फुटवेयर खरीदा। मुझे यहां ${tagPhrases[0] || 'जूतों की मजबूती और कम्फर्ट'} देखकर बहुत खुशी हुई। अपनी खरीदारी से पूरी तरह संतुष्ट हूं। ${closer}`;
      } else if (isMidRating) {
        review = `मेरी जरूरत के हिसाब से सामान्य फुटवेयर मिल गया। अनुभव ठीक रहा, हालांकि कलेक्शन और बेहतर किया जा सकता है। ${closer}`;
      } else {
        review = `व्यक्तिगत रूप से मुझे न्यू कपिल शूज में खरीदारी का अनुभव उम्मीद से कमजोर लगा। सर्विस और क्वालिटी में सुधार की आशा है।`;
      }
    } else {
      // Hinglish
      if (isHighRating) {
        review = `Maine khud New Kapil Shoes jakar apne liye footwear choose kiya. Joote pehan kar laga ki ${tagPhrases[0] || 'quality aur comfort sach me solid hai'}. Full satisfaction mila. ${closer}`;
      } else if (isMidRating) {
        review = `Mera experience New Kapil Shoes par theek-thaak raha. Daily wear ke hisab se product mil gaya, bas variety thodi aur honi chahiye. ${closer}`;
      } else {
        review = `Personally mujhe lagta hai ki New Kapil Shoes par service thodi better ho sakti thi. Ummeed hai next time better experience milega.`;
      }
    }
  }

  // 5. Style: "Professional and balanced"
  else if (style === 'Professional and balanced') {
    const variant = (seedOffset + Math.floor(Math.random() * 3)) % 3;
    if (lang === 'en') {
      if (isHighRating) {
        if (variant === 0) {
          review = `${opener} The establishment maintains a commendable standard in footwear quality and reasonable pricing. Customer interactions are handled courteously. Highly recommended for footwear needs.`;
        } else if (variant === 1) {
          review = `${opener} A well-managed store with a reliable variety of everyday and formal footwear. Pricing is transparent and product durability is dependable.`;
        } else {
          review = `${opener} Customer assistance is professional and the footwear collection meets high standards of comfort and craftsmanship. A trustworthy footwear destination.`;
        }
      } else if (isMidRating) {
        review = `${opener} The store provides adequate footwear options at standard local pricing. An acceptable shopping experience for essential footwear.`;
      } else {
        review = `${opener} While the store has potential, attention is needed towards customer assistance and product variety to enhance consumer satisfaction.`;
      }
    } else if (lang === 'hi') {
      if (isHighRating) {
        if (variant === 0) {
          review = `${opener} यह प्रतिष्ठान फुटवेयर की गुणवत्ता और उचित मूल्य निर्धारण का अच्छा संतुलन बनाए हुए है। ग्राहकों के साथ व्यवहार अत्यंत सम्मानजनक है। जूतों के लिए उत्कृष्ट दुकान।`;
        } else if (variant === 1) {
          review = `${opener} जूतों और चप्पलों की व्यवस्थित रेंज और उचित मूल्य इस दुकान को विशेष बनाते हैं। समय पर सेवा और गुणवत्ता दोनों संतोषजनक हैं।`;
        } else {
          review = `${opener} व्यावसायिक दृष्टिकोण और ग्राहकों के प्रति सहयोग सराहनीय है। फुटवेयर की मजबूती और डिजाइन दोनों उत्तम हैं।`;
        }
      } else if (isMidRating) {
        review = `${opener} दुकान में बुनियादी आवश्यकताओं के लिए फुटवेयर उपलब्ध हैं। स्थानीय बाजार की दृष्टि से एक संतुलित और औसत अनुभव।`;
      } else {
        review = `${opener} दुकान में रोजमर्रा के उत्पाद हैं, लेकिन ग्राहकों के अनुभव को बेहतर बनाने के लिए सेवा और विकल्पों में सुधार आवश्यक प्रतीत होता है।`;
      }
    } else {
      // Hinglish
      if (isHighRating) {
        if (variant === 0) {
          review = `${opener} Store footwear quality aur genuine pricing dono maintain karta hai. Customer dealing respectful aur professional hai. Definite recommendation.`;
        } else if (variant === 1) {
          review = `${opener} Organized footwear collection aur fair pricing structure hai. Product durable hai aur dealing bilkul transparent hai.`;
        } else {
          review = `${opener} Professional service aur comfortable footwear selection. Reliable local shoe store jahan quality compromise nahi hoti.`;
        }
      } else if (isMidRating) {
        review = `${opener} Essential footwear requirements ke hisab se shop theek hai. Pricing fair hai, overall balanced experience raha.`;
      } else {
        review = `${opener} Shop par regular footwear items hain, par customer service aur product range me improvement ki need hai.`;
      }
    }
  }

  // 6. Style: "Simple and natural" (Default)
  else {
    const variant = (seedOffset + Math.floor(Math.random() * 3)) % 3;
    if (lang === 'en') {
      if (isHighRating) {
        const feature = tagPhrases[0] ? ` The ${tagPhrases[0]} is truly commendable.` : '';
        if (variant === 0) {
          review = `${opener}${feature} Great collection and fair prices. ${closer}`;
        } else if (variant === 1) {
          review = `${opener} Found the footwear selection neatly displayed and prices very reasonable.${feature} ${closer}`;
        } else {
          review = `${opener}${feature} Honest dealings, good product variety, and very comfortable footwear. ${closer}`;
        }
      } else if (isMidRating) {
        review = `${opener} Prices are reasonable and the shoes are okay for daily use. Average shopping trip.`;
      } else {
        review = `${opener} The footwear selection and service could be improved. Sharing my honest feedback.`;
      }
    } else if (lang === 'hi') {
      if (isHighRating) {
        const feature = tagPhrases[0] ? ` ${tagPhrases[0]}।` : '';
        if (variant === 0) {
          review = `${opener}${feature} दाम भी वाजिब हैं और जूते बहुत अच्छे हैं। ${closer}`;
        } else if (variant === 1) {
          review = `${opener} दुकान पर जूतों और चप्पलों की अच्छी रेंज है और दाम भी सही हैं। ${closer}`;
        } else {
          review = `${opener}${feature} सरल और सुखद अनुभव रहा। जूते टिकाऊ और आरामदायक हैं। ${closer}`;
        }
      } else if (isMidRating) {
        review = `${opener} दाम ठीक हैं और जूते रोजमर्रा के हिसाब से ठीक हैं। ठीक-ठाक अनुभव रहा।`;
      } else {
        review = `${opener} फुटवेयर की वैरायटी और ग्राहक सेवा में सुधार की जरूरत है। यह मेरा निष्पक्ष अनुभव है।`;
      }
    } else {
      // Hinglish
      if (isHighRating) {
        const feature = tagPhrases[0] ? ` ${tagPhrases[0]}.` : '';
        if (variant === 0) {
          review = `${opener}${feature} Collection aur rate dono kaafi sahi hain. ${closer}`;
        } else if (variant === 1) {
          review = `${opener} Footwear options ache hain aur rate pocket friendly hai. ${closer}`;
        } else {
          review = `${opener}${feature} Honest dealing aur comfortable shoes mile. Recommended! ${closer}`;
        }
      } else if (isMidRating) {
        review = `${opener} Rates reasonable hain aur regular footwear ke liye theek jagah hai. Decent experience.`;
      } else {
        review = `${opener} Variety aur customer service thodi aur behtar ho sakti thi. Honest feedback share kar raha hoon.`;
      }
    }
  }

  // If customer provided a custom comment, append / weave it authentically without distorting
  if (trimmedComment) {
    if (lang === 'en') {
      review += ` Note: ${trimmedComment}`;
    } else if (lang === 'hi') {
      review += ` विशेष अनुभव: ${trimmedComment}`;
    } else {
      review += ` My note: ${trimmedComment}`;
    }
  }

  return review.trim();
}

/**
 * Server-side Gemini API generation handler
 */
async function generateWithGemini({
  rating = 5,
  feedbackOptions = [],
  customComment = '',
  language = 'en',
  storeName = 'New Kapil Shoes',
  apiKey = process.env.GEMINI_API_KEY,
  targetStyles = [],
}) {
  if (!apiKey) return null;

  try {
    const langLabel = language === 'hi' ? 'Hindi (Devanagari script)' : language === 'hinglish' ? 'Hinglish (Hindi in Roman alphabet)' : 'English';
    const tagList = feedbackOptions.join(', ') || 'Footwear shopping';

    const systemPrompt = `You are an AI assistant generating authentic, genuine customer review suggestions for a footwear store named "${storeName}" (selling shoes, slippers, sandals, and footwear).
CRITICAL RULES:
1. Generate exactly 3 distinct reviews corresponding to these 3 styles:
   - Style 1: "${targetStyles[0] || 'Simple and natural'}"
   - Style 2: "${targetStyles[1] || 'Friendly and conversational'}"
   - Style 3: "${targetStyles[2] || 'Detailed and descriptive'}"
2. Rating is ${rating} out of 5 stars.
   - If rating is 4 or 5: reflect a genuinely positive, satisfied customer experience.
   - If rating is 3: reflect a balanced, honest, mixed/average experience.
   - If rating is 1 or 2: reflect respectful, constructive critical feedback. NEVER invert negative into fake positive!
3. Customer selected tags: [${tagList}].
4. Customer comment: "${customComment || 'None'}".
5. Language: MUST be exclusively in ${langLabel}.
6. Avoid repetitive sentence openings or boilerplate phrases.
7. Output strictly a JSON object with a "suggestions" array containing objects with "style" and "text" keys.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.85,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn('[Gemini API] HTTP Error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    if (Array.isArray(parsed.suggestions) && parsed.suggestions.length >= 3) {
      return parsed.suggestions.slice(0, 3).map((item, idx) => ({
        style: item.style || targetStyles[idx] || REVIEW_STYLES[idx].name,
        text: item.text,
      }));
    }

    return null;
  } catch (err) {
    console.warn('[Gemini API] Fallback to algorithmic generator due to error:', err.message);
    return null;
  }
}

/**
 * Main AI Review Generation Service with Multi-level Deduplication
 *
 * @param {Object} params
 * @param {number} params.rating - 1 to 5 stars
 * @param {Array<string>} params.feedbackOptions - list of chosen options
 * @param {string} params.customComment - optional custom notes
 * @param {string} params.language - 'en' | 'hi' | 'hinglish'
 * @param {Array<string>} params.sessionHistory - review texts already shown in this customer session
 * @param {string} params.storeId - store identifier
 * @returns {Promise<Object>} { suggestions: Array, engine: string, stats: Object }
 */
export async function generateReviewSuggestions({
  rating = 5,
  feedbackOptions = [],
  customComment = '',
  language = 'en',
  sessionHistory = [],
  storeId = defaultStoreId,
}) {
  const store = stores[storeId] || stores[defaultStoreId];
  const lang = ['en', 'hi', 'hinglish'].includes(language) ? language : 'en';

  // Retrieve recent stored reviews for cross-generation duplicate checking
  const globalRecentReviews = storage.getRecentReviews(100);

  // Combine session history and global recent reviews as collision pool
  const historyPool = [
    ...(Array.isArray(sessionHistory) ? sessionHistory : []),
    ...globalRecentReviews,
  ];

  // Pick 3 distinct styles from REVIEW_STYLES for this generation
  const shuffledStyles = shuffle(REVIEW_STYLES);
  const selectedStyleObjects = shuffledStyles.slice(0, 3);
  const targetStyles = selectedStyleObjects.map(s => s.name);

  let rawSuggestions = null;
  let engine = 'algorithmic';

  // Attempt server-side Gemini generation if API key is configured
  if (process.env.GEMINI_API_KEY) {
    const geminiResult = await generateWithGemini({
      rating,
      feedbackOptions,
      customComment,
      language: lang,
      storeName: store.name,
      targetStyles,
    });
    if (geminiResult && geminiResult.length === 3) {
      rawSuggestions = geminiResult;
      engine = 'gemini';
    }
  }

  const finalSuggestions = [];
  const currentBatchTexts = [];
  let duplicateRejectionsCount = 0;

  // Process and validate 3 unique suggestions
  for (let i = 0; i < 3; i++) {
    const desiredStyle = targetStyles[i] || REVIEW_STYLES[i].name;
    let candidateText = '';
    let candidateStyle = desiredStyle;
    let accepted = false;
    let attempts = 0;
    const maxAttempts = 35;

    // First attempt: use Gemini output if available
    if (rawSuggestions && rawSuggestions[i] && rawSuggestions[i].text) {
      const gText = rawSuggestions[i].text.trim();
      const dedupCheck = isNearDuplicate(gText, [...historyPool, ...currentBatchTexts]);
      if (!dedupCheck.isDuplicate) {
        candidateText = gText;
        candidateStyle = rawSuggestions[i].style || desiredStyle;
        accepted = true;
      } else {
        duplicateRejectionsCount++;
      }
    }

    // Algorithmic generation / replacement loop until collision-free candidate is created
    while (!accepted && attempts < maxAttempts) {
      attempts++;
      // If we encounter repeated collisions, rotate through the full set of 6 styles
      const activeStyle = attempts > 2
        ? REVIEW_STYLES[(attempts + i) % REVIEW_STYLES.length].name
        : desiredStyle;

      const candidate = buildAlgorithmicReview({
        style: activeStyle,
        rating,
        feedbackOptions,
        customComment,
        language: lang,
        seedOffset: attempts * 13 + i * 7,
      });

      const dedupCheck = isNearDuplicate(candidate, [...historyPool, ...currentBatchTexts]);
      if (!dedupCheck.isDuplicate) {
        candidateText = candidate;
        candidateStyle = activeStyle;
        accepted = true;
      } else {
        duplicateRejectionsCount++;
      }
    }

    // Safety fallback: ensure absolute uniqueness
    if (!accepted || !candidateText) {
      candidateStyle = REVIEW_STYLES[(attempts + i) % REVIEW_STYLES.length].name;
      candidateText = buildAlgorithmicReview({
        style: candidateStyle,
        rating,
        feedbackOptions,
        customComment,
        language: lang,
        seedOffset: attempts + 99,
      });
    }

    finalSuggestions.push({
      id: `sug-${i + 1}`,
      style: candidateStyle,
      text: candidateText,
      hash: hashText(candidateText),
    });

    currentBatchTexts.push(candidateText);
  }

  return {
    suggestions: finalSuggestions,
    engine,
    duplicateRejectionsCount,
    language: lang,
    rating,
  };
}
