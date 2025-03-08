import React from 'react';
import { GlassyCard } from '../components/ui/glassy-card';
import { GlassyButton } from '../components/ui/glassy-button';
import { Layout } from '../components/layout';

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold mb-2 neon-text">Dashboard</h1>
          <p className="text-muted-foreground mb-8">Welcome back to Campus Connect!</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GlassyCard variant="primary">
            <h2 className="text-xl font-semibold mb-4">Course Progress</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Advanced Mathematics</span>
                  <span className="neon-text">78%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Physics</span>
                  <span className="neon-text">65%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Computer Science</span>
                  <span className="neon-text">92%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>
          </GlassyCard>

          <GlassyCard variant="secondary">
            <h2 className="text-xl font-semibold mb-4">Upcoming Classes</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-secondary/20 backdrop-blur-sm">
                  <span className="text-lg font-bold">AM</span>
                </div>
                <div>
                  <h3 className="font-medium">Advanced Mathematics</h3>
                  <p className="text-sm text-muted-foreground">10:00 AM - 11:30 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-primary/20 backdrop-blur-sm">
                  <span className="text-lg font-bold">PH</span>
                </div>
                <div>
                  <h3 className="font-medium">Physics Lab</h3>
                  <p className="text-sm text-muted-foreground">1:00 PM - 3:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-accent/20 backdrop-blur-sm">
                  <span className="text-lg font-bold">CS</span>
                </div>
                <div>
                  <h3 className="font-medium">Computer Science</h3>
                  <p className="text-sm text-muted-foreground">4:00 PM - 5:30 PM</p>
                </div>
              </div>
            </div>
          </GlassyCard>

          <GlassyCard variant="accent">
            <h2 className="text-xl font-semibold mb-4">Attendance Summary</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-accent/10 rounded-lg backdrop-blur-sm">
                <h3 className="text-sm text-muted-foreground">Present</h3>
                <p className="text-2xl font-bold neon-text">94%</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg backdrop-blur-sm">
                <h3 className="text-sm text-muted-foreground">Absences</h3>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">You've maintained excellent attendance this semester.</p>
          </GlassyCard>
        </div>

        <GlassyCard className="gradient-overlay">
          <h2 className="text-xl font-semibold mb-4">Upcoming Assignments</h2>
          <div className="space-y-4">
            <div className="p-4 bg-background/30 rounded-lg backdrop-blur-sm flex justify-between items-center">
              <div>
                <h3 className="font-medium">Mathematics Problem Set</h3>
                <p className="text-sm text-muted-foreground">Due Tomorrow, 11:59 PM</p>
              </div>
              <GlassyButton variant="primary" size="sm">Start</GlassyButton>
            </div>
            <div className="p-4 bg-background/30 rounded-lg backdrop-blur-sm flex justify-between items-center">
              <div>
                <h3 className="font-medium">Physics Lab Report</h3>
                <p className="text-sm text-muted-foreground">Due in 3 days</p>
              </div>
              <GlassyButton variant="primary" size="sm">Start</GlassyButton>
            </div>
            <div className="p-4 bg-background/30 rounded-lg backdrop-blur-sm flex justify-between items-center">
              <div>
                <h3 className="font-medium">Programming Project</h3>
                <p className="text-sm text-muted-foreground">Due in 1 week</p>
              </div>
              <GlassyButton variant="primary" size="sm">Start</GlassyButton>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <GlassyButton variant="outline">View All Assignments</GlassyButton>
          </div>
        </GlassyCard>
      </div>
    </Layout>
  );
} 