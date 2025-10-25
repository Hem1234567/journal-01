import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Flame, Zap } from 'lucide-react';
import Layout from '@/components/Layout';

interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  streak: number;
}

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const leaderboardData: LeaderboardEntry[] = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const statsSnap = await getDocs(collection(db, 'users', userDoc.id, 'stats'));
        const statsData = statsSnap.docs[0]?.data();

        leaderboardData.push({
          id: userDoc.id,
          name: userData.name || userData.email,
          xp: statsData?.xp || 0,
          streak: statsData?.streak || 0,
        });
      }

      leaderboardData.sort((a, b) => b.xp - a.xp);
      setEntries(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-accent" />;
    if (index === 1) return <Medal className="h-6 w-6 text-secondary" />;
    if (index === 2) return <Award className="h-6 w-6 text-success" />;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getRankGradient = (index: number) => {
    if (index === 0) return 'bg-gradient-accent';
    if (index === 1) return 'bg-gradient-primary';
    if (index === 2) return 'bg-gradient-success';
    return '';
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

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">Top performers ranked by XP</p>
        </div>

        <div className="space-y-3">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`shadow-card hover:shadow-elegant transition-all ${getRankGradient(index)}`}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center">
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{entry.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-accent" />
                          <span>{entry.xp} XP</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="h-4 w-4 text-destructive" />
                          <span>{entry.streak} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      Level {Math.floor(entry.xp / 100) + 1}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
