/**
 * Business Configuration for New Kapil Shoes
 * Designed with multi-shop expansion support.
 */

export const stores = {
  'new-kapil-shoes': {
    id: 'new-kapil-shoes',
    name: 'New Kapil Shoes',
    tagline: 'Step into Comfort & Elegance',
    categories: ['Shoes', 'Slippers', 'Sandals', 'Footwear'],
    categorySummary: 'Shoes • Slippers • Sandals • Footwear',
    googlePlaceId: 'ChIJNbz9Kt95hDkRLJ6YP07O1Wg',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJNbz9Kt95hDkRLJ6YP07O1Wg',
    instagram: {
      handle: '@new_kapil_shoes',
      url: 'https://www.instagram.com/new_kapil_shoes/',
      appUri: 'instagram://user?username=new_kapil_shoes',
    },
    supportedLanguages: ['en', 'hi', 'hinglish'],
    defaultLanguage: 'en',
    feedbackCategories: [
      { id: 'quality', key: 'good_quality', en: 'Good product quality', hi: 'अच्छी प्रोडक्ट क्वालिटी', hinglish: 'Good product quality' },
      { id: 'comfort', key: 'comfortable_shoes', en: 'Comfortable shoes', hi: 'आरामदायक जूते', hinglish: 'Comfortable shoes' },
      { id: 'collection', key: 'great_collection', en: 'Great collection', hi: 'शानदार कलेक्शन', hinglish: 'Great collection' },
      { id: 'prices', key: 'affordable_prices', en: 'Affordable prices', hi: 'किफायती दाम', hinglish: 'Affordable prices' },
      { id: 'variety', key: 'good_variety', en: 'Good variety of footwear', hi: 'फुटवेयर की बेहतरीन वैरायटी', hinglish: 'Footwear ki achhi variety' },
      { id: 'staff', key: 'helpful_staff', en: 'Helpful staff', hi: 'मददगार स्टाफ', hinglish: 'Helpful staff' },
      { id: 'service', key: 'good_service', en: 'Good customer service', hi: 'बेहतरीन ग्राहक सेवा', hinglish: 'Achhi customer service' },
      { id: 'satisfied', key: 'satisfied_purchase', en: 'Satisfied with my purchase', hi: 'खरीदारी से संतुष्ट', hinglish: 'Kharidari se santusht' },
      { id: 'value', key: 'value_for_money', en: 'Value for money', hi: 'पैसा वसूल', hinglish: 'Paisa vasool' },
      { id: 'experience', key: 'good_experience', en: 'Good shopping experience', hi: 'अच्छा शॉपिंग अनुभव', hinglish: 'Achha shopping experience' },
    ],
  },
};

export const defaultStoreId = 'new-kapil-shoes';

export function getStore(storeId = defaultStoreId) {
  return stores[storeId] || stores[defaultStoreId];
}

export default getStore();
