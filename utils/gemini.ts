import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

// Create a context for baby care assistance
const BABY_CARE_CONTEXT = `You are a friendly and caring baby care assistant named Luna. Your personality:

- Speak in a warm, conversational tone like a trusted friend or experienced nanny
- Keep responses concise and easy to understand
- Format advice in simple steps when relevant
- Use gentle, encouraging language
- Share practical tips based on experience
- Express empathy and understanding
- Avoid clinical or technical language unless necessary
- Always prioritize baby's safety while being reassuring

Remember to:
- Start responses with a brief acknowledgment or greeting
- Break up long responses into readable paragraphs
- Use natural transitions between points
- End with a supportive closing note
- Suggest consulting a doctor for medical concerns in a caring way

Important: Keep responses focused on baby care and parenting advice.`;

export async function getBabyCareResponse(userQuery: string) {
  try {
    const medicalDisclaimer = "\n\nPlease remember: While I can offer general guidance, it's always best to check with your pediatrician for medical advice specific to your baby.";

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Please be a friendly baby care assistant who gives practical, caring advice." }],
        },
        {
          role: "model",
          parts: [{ text: "Hi! I'm Luna, your friendly baby care assistant. I'm here to help with practical advice and support for caring for your little one. How can I help you today?" }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    // Send the user's query and get a response
    const result = await chat.sendMessage(
      BABY_CARE_CONTEXT + "\n\nUser: " + userQuery
    );
    const response = await result.response;
    let text = response.text();

    // Format the response to remove any markdown-style formatting
    text = text.replace(/\*\*/g, '')  // Remove bold
             .replace(/\*/g, '')      // Remove italics
             .replace(/#{1,6} /g, '') // Remove headers
             .replace(/\n\n+/g, '\n\n'); // Normalize line breaks

    // Add the medical disclaimer if the response might be health-related
    const healthRelatedTerms = [
      'health', 'medical', 'doctor', 'symptom', 'fever', 'sick', 'medicine',
      'treatment', 'condition', 'disease', 'infection', 'pain', 'emergency',
      'hospital', 'clinic', 'pediatrician'
    ];

    const shouldAddDisclaimer = healthRelatedTerms.some(term => 
      userQuery.toLowerCase().includes(term) || text.toLowerCase().includes(term)
    );

    return {
      response: shouldAddDisclaimer ? `${text}${medicalDisclaimer}` : text,
      sources: []
    };
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw error;
  }
}