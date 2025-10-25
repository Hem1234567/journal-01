import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateWeeklyReport } from '@/lib/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface Report {
  id: string;
  summary: string;
  createdAt: string;
  xpData: any[];
  moodData: any[];
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'users', user.uid, 'reports'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      // Fetch last 7 days of journals
      const journalsRef = collection(db, 'users', user.uid, 'journals');
      const journalsSnap = await getDocs(journalsRef);
      const journals = journalsSnap.docs.map(doc => doc.data());

      // Get user stats
      const statsSnap = await getDocs(collection(db, 'users', user.uid, 'stats'));
      const stats = statsSnap.docs[0]?.data();

      // Generate AI report
      const summary = await generateWeeklyReport(journals, stats);

      // Create mock chart data
      const xpData = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        xp: Math.floor(Math.random() * 50) + 10
      }));

      const moodData = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        mood: Math.floor(Math.random() * 5) + 1
      }));

      // Save report
      await addDoc(collection(db, 'users', user.uid, 'reports'), {
        summary,
        xpData,
        moodData,
        createdAt: new Date().toISOString()
      });

      toast({
        title: "Report generated! 📊",
        description: "Your weekly insights are ready",
      });

      loadReports();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate report",
      });
    } finally {
      setGenerating(false);
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

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Weekly Reports</h1>
            <p className="text-muted-foreground">AI-powered insights into your progress</p>
          </div>
          <Button onClick={generateReport} disabled={generating} className="gap-2">
            <Sparkles className="h-5 w-5" />
            {generating ? 'Generating...' : 'Generate New Report'}
          </Button>
        </div>

        {reports.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reports yet. Generate your first weekly report!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-primary" />
                      Weekly Report
                    </CardTitle>
                    <CardDescription>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="mb-2 font-semibold">AI Summary</h3>
                      <p className="text-muted-foreground">{report.summary}</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="mb-4 font-semibold">XP Progress</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={report.xpData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="xp" fill="hsl(var(--accent))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div>
                        <h3 className="mb-4 font-semibold">Mood Trend</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={report.moodData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
