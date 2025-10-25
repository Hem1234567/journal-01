import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Shield, Users, BookOpen, Trophy, BarChart3, Trash2, Edit, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

const Admin: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      // Load community posts
      const postsSnap = await getDocs(collection(db, 'communityJournals'));
      const postsData = postsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCommunityPosts(postsData);

      // Load all journals
      const allJournals: any[] = [];
      for (const userDoc of usersSnap.docs) {
        const journalsSnap = await getDocs(collection(db, 'users', userDoc.id, 'journals'));
        journalsSnap.docs.forEach(doc => {
          allJournals.push({
            id: doc.id,
            userId: userDoc.id,
            userName: userDoc.data().name || userDoc.data().email,
            ...doc.data()
          });
        });
      }
      setJournals(allJournals);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin data",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      toast({
        title: "User deleted",
        description: "User has been removed",
      });
      loadAdminData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      });
    }
  };

  const updateUser = async () => {
    if (!editingUser || !editName.trim()) return;

    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        name: editName.trim()
      });
      toast({
        title: "User updated",
        description: "Changes saved successfully",
      });
      setEditingUser(null);
      setEditName('');
      loadAdminData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user",
      });
    }
  };

  const deleteJournal = async (userId: string, journalId: string) => {
    if (!confirm('Delete this journal?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId, 'journals', journalId));
      toast({
        title: "Journal deleted",
        description: "Journal entry removed",
      });
      loadAdminData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete journal",
      });
    }
  };

  const deleteCommunityPost = async (postId: string) => {
    if (!confirm('Delete this community post?')) return;

    try {
      await deleteDoc(doc(db, 'communityJournals', postId));
      toast({
        title: "Post deleted",
        description: "Community post removed",
      });
      loadAdminData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post",
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-4xl font-bold">
              <Shield className="h-10 w-10 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage all aspects of the platform</p>
          </div>
          <Button onClick={loadAdminData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="journals" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Journals
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <Trophy className="h-4 w-4" />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.xp || 0}</TableCell>
                        <TableCell>{user.streak || 0}</TableCell>
                        <TableCell className="space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditName(user.name || '');
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>Update user information</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name">Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                  />
                                </div>
                                <Button onClick={updateUser}>Save Changes</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journals">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Journal Management</CardTitle>
                <CardDescription>View and moderate all journal entries</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journals.map((journal) => (
                      <TableRow key={journal.id}>
                        <TableCell>{journal.userName}</TableCell>
                        <TableCell>
                          {new Date(journal.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {journal.summary || 'No summary'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteJournal(journal.userId, journal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Community Management</CardTitle>
                <CardDescription>Moderate shared posts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communityPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>{post.userName}</TableCell>
                        <TableCell>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{post.likes || 0}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {post.summary}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteCommunityPost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
