import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = "AIzaSyBxGRWSoSUUrN5uvT2s9SyDGv4GVKW-yi0";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateDailyQuestions = async (): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Generate 3 short, unique reflective questions for a student's daily journal focusing on mindfulness, learning, and productivity. Return only the questions, one per line.";
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    return text.split('\n').filter(q => q.trim().length > 0).slice(0, 3);
  } catch (error) {
    console.error('Error generating daily questions:', error);
    return [
      "What's one thing you learned today that you're proud of?",
      "How did you practice mindfulness or self-care today?",
      "What's your biggest win today, big or small?"
    ];
  }
};

export const generateJournalSummary = async (journalText: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Summarize and reflect on this journal entry in 2-3 sentences. Focus on key emotions, insights, and growth: "${journalText}"`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating summary:', error);
    return "Unable to generate summary at this time.";
  }
};

export const generateWeeklyReport = async (journalData: any[], userData: any): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this student's weekly journal and progress data to create a motivational summary report:
    
Journals: ${journalData.length} entries this week
XP Earned: ${userData.xp || 0}
Current Streak: ${userData.streak || 0} days

Key themes and emotions from journals:
${journalData.map(j => j.text).join('\n')}

Provide a brief, encouraging weekly summary focusing on growth, patterns, and actionable insights (4-5 sentences).`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return "Unable to generate weekly report at this time.";
  }
};

export const generateDailyChallenge = async (): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Generate one simple, actionable daily productivity challenge for students to improve focus and discipline. Keep it brief (one sentence) and inspiring.";
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating challenge:', error);
    return "Try the Pomodoro technique: 25 minutes of focused work, then a 5-minute break.";
  }
};

export const chatWithAI = async (message: string, chatHistory: Array<{role: string; content: string}>): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const context = "You are a motivational mentor helping students improve their journaling and productivity habits. Be encouraging, insightful, and concise.";
    
    const fullPrompt = `${context}\n\nConversation history:\n${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}\n\nAssistant:`;
    
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error in chat:', error);
    return "I'm having trouble connecting right now. Please try again.";
  }
};
