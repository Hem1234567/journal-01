import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateDailyChallenge } from '@/lib/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Trophy, Flame, Zap, Target, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ xp: 0, streak: 0, totalJournals: 0 });
  const [challenge, setChallenge] = useState('');
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Load stats
      const statsDoc = await getDoc(doc(db, 'users', user.uid, 'stats', 'current'));
      if (statsDoc.exists()) {
        setStats(statsDoc.data() as any);
      }

      // Load or generate today's challenge
      const today = new Date().toISOString().split('T')[0];
      const challengesRef = collection(db, 'challenges');
      const q = query(challengesRef, where('date', '==', today), where('userId', '==', user.uid));
      const challengeSnap = await getDocs(q);

      if (!challengeSnap.empty) {
        const challengeData = challengeSnap.docs[0].data();
        setChallenge(challengeData.text);
        setChallengeCompleted(challengeData.completed || false);
      } else {
        const newChallenge = await generateDailyChallenge();
        setChallenge(newChallenge);
      }

      // Load latest weekly report
      const reportsRef = collection(db, 'users', user.uid, 'reports');
      const reportQuery = query(reportsRef, orderBy('createdAt', 'desc'), limit(1));
      const reportSnap = await getDocs(reportQuery);

      if (!reportSnap.empty) {
        setWeeklyReport(reportSnap.docs[0].data().summary);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async () => {
    if (!user || challengeCompleted) return;

    try {
      // Update XP
      const statsRef = doc(db, 'users', user.uid, 'stats', 'current');
      await updateDoc(statsRef, {
        xp: stats.xp + 20
      });

      setStats(prev => ({ ...prev, xp: prev.xp + 20 }));
      setChallengeCompleted(true);

      toast({
        title: "Challenge completed! 🎉",
        description: "+20 XP earned",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete challenge",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  const xpProgress = (stats.xp % 100);
  const level = Math.floor(stats.xp / 100) + 1;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your growth and productivity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                <Zap className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.xp}</div>
                <p className="text-xs text-muted-foreground mt-1">Level {level}</p>
                <Progress value={xpProgress} className="mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Flame className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{stats.streak}</div>
                <p className="text-xs text-muted-foreground mt-1">days in a row</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Journals</CardTitle>
                <TrendingUp className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats.totalJournals}</div>
                <p className="text-xs text-muted-foreground mt-1">entries written</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                <Award className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{Math.floor(stats.xp / 100)}</div>
                <p className="text-xs text-muted-foreground mt-1">badges earned</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Daily Challenge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="shadow-elegant border-accent/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-accent" />
                <CardTitle>Today's Challenge</CardTitle>
              </div>
              <CardDescription>Complete to earn +20 XP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">{challenge}</p>
              <Button
                onClick={completeChallenge}
                disabled={challengeCompleted}
                className="w-full"
              >
                {challengeCompleted ? '✓ Completed' : 'Mark as Complete'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Report */}
        {weeklyReport && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  <CardTitle>Latest Weekly Report</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{weeklyReport}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
