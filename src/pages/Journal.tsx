import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateDailyQuestions, generateJournalSummary } from '@/lib/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Mic, MicOff, Sparkles, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

const Journal: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    loadDailyQuestions();
    initVoiceRecognition();
  }, []);

  const initVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        setAnswers(prev => {
          const newAnswers = [...prev];
          newAnswers[currentQuestionIndex] = transcript;
          return newAnswers;
        });
      };

      recognitionInstance.onerror = () => {
        toast({
          variant: "destructive",
          title: "Voice input error",
          description: "Unable to process voice input",
        });
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    } else {
      toast({
        variant: "destructive",
        title: "Voice not supported",
        description: "Your browser doesn't support voice recognition",
      });
    }
  };

  const toggleVoiceRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      toast({
        title: "Listening...",
        description: "Speak your thoughts",
      });
    }
  };

  const loadDailyQuestions = async () => {
    try {
      const dailyQuestions = await generateDailyQuestions();
      setQuestions(dailyQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const submitJournal = async () => {
    if (!user) return;

    const journalText = answers.filter(a => a.trim()).join('\n\n');
    if (!journalText.trim()) {
      toast({
        variant: "destructive",
        title: "Empty journal",
        description: "Please write something first",
      });
      return;
    }

    setLoading(true);

    try {
      // Generate AI summary
      const summary = await generateJournalSummary(journalText);

      // Save journal
      const journalData = {
        text: journalText,
        questions,
        answers,
        summary,
        createdAt: new Date().toISOString(),
        shared: shareToCommunity,
        userId: user.uid
      };

      await addDoc(collection(db, 'users', user.uid, 'journals'), journalData);

      // Update stats
      const statsRef = doc(db, 'users', user.uid, 'stats', 'current');
      const statsSnap = await getDoc(statsRef);
      const currentStats = statsSnap.data() || { xp: 0, streak: 0, totalJournals: 0 };

      await updateDoc(statsRef, {
        xp: currentStats.xp + 10,
        totalJournals: currentStats.totalJournals + 1,
        lastJournalDate: new Date().toISOString()
      });

      // Add to community if shared
      if (shareToCommunity) {
        await addDoc(collection(db, 'communityJournals'), {
          ...journalData,
          userName: user.displayName || user.email,
          likes: 0
        });
      }

      toast({
        title: "Journal saved! 🎉",
        description: "+10 XP earned",
      });

      // Reset
      setAnswers(['', '', '']);
      setShareToCommunity(false);
      loadDailyQuestions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving journal",
        description: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Daily Journal</h1>
          <p className="text-muted-foreground">Answer today's reflective questions</p>
        </div>

        {questions.map((question, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Question {index + 1}
                </CardTitle>
                <CardDescription>{question}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={answers[index]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = e.target.value;
                    setAnswers(newAnswers);
                    setCurrentQuestionIndex(index);
                  }}
                  placeholder="Write or speak your thoughts..."
                  className="min-h-[120px]"
                />
                <Button
                  variant={isRecording && currentQuestionIndex === index ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCurrentQuestionIndex(index);
                    toggleVoiceRecording();
                  }}
                  className="gap-2"
                >
                  {isRecording && currentQuestionIndex === index ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Voice Input
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <Card className="shadow-elegant">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="share">Share to Community</Label>
              <Switch
                id="share"
                checked={shareToCommunity}
                onCheckedChange={setShareToCommunity}
              />
            </div>

            <Button
              onClick={submitJournal}
              disabled={loading}
              className="w-full gap-2"
              size="lg"
            >
              <Send className="h-5 w-5" />
              {loading ? 'Saving...' : 'Submit Journal'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Journal;
