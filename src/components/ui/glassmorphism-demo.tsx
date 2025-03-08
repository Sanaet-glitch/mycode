import React, { useState } from 'react';
import { GlassContainer } from './glass-container';
import { GlassyCard } from './glassy-card';
import { GlassyInput } from './glassy-input';
import { motion } from 'framer-motion';

interface GlassmorphismDemoProps {
  theme?: 'light' | 'dark';
}

export function GlassmorphismDemo({ theme = 'light' }: GlassmorphismDemoProps) {
  const [selectedVariant, setSelectedVariant] = useState<'default' | 'premium' | 'frosted' | 'smooth'>('premium');
  const [showParticles, setShowParticles] = useState(true);
  const [showGlowOrbs, setShowGlowOrbs] = useState(true);
  const [highlightEffect, setHighlightEffect] = useState(true);
  const [borderGlow, setBorderGlow] = useState(false);
  const [floatingEffect, setFloatingEffect] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState<'none' | 'xs' | 'sm' | 'medium' | 'lg' | 'xl'>('medium');

  return (
    <div className="p-8 min-h-screen w-full">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Premium Glassmorphism Demo</h1>
        
        {/* Controls */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GlassyCard theme={theme} className="p-4">
            <h2 className="text-lg font-semibold mb-3">Variant</h2>
            <div className="flex flex-wrap gap-2">
              {(['default', 'premium', 'frosted', 'smooth'] as const).map((variant) => (
                <button
                  key={variant}
                  className={`px-3 py-1 rounded-md ${
                    selectedVariant === variant
                      ? 'bg-primary text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  onClick={() => setSelectedVariant(variant)}
                >
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </button>
              ))}
            </div>
          </GlassyCard>

          <GlassyCard theme={theme} className="p-4">
            <h2 className="text-lg font-semibold mb-3">Blur Intensity</h2>
            <div className="flex flex-wrap gap-2">
              {(['none', 'xs', 'sm', 'medium', 'lg', 'xl'] as const).map((intensity) => (
                <button
                  key={intensity}
                  className={`px-3 py-1 rounded-md ${
                    blurIntensity === intensity
                      ? 'bg-primary text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  onClick={() => setBlurIntensity(intensity)}
                >
                  {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                </button>
              ))}
            </div>
          </GlassyCard>

          <GlassyCard theme={theme} className="p-4">
            <h2 className="text-lg font-semibold mb-3">Effects</h2>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showParticles}
                  onChange={(e) => setShowParticles(e.target.checked)}
                  className="rounded"
                />
                <span>Show Particles</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showGlowOrbs}
                  onChange={(e) => setShowGlowOrbs(e.target.checked)}
                  className="rounded"
                />
                <span>Show Glow Orbs</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={highlightEffect}
                  onChange={(e) => setHighlightEffect(e.target.checked)}
                  className="rounded"
                />
                <span>Highlight Effect</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={borderGlow}
                  onChange={(e) => setBorderGlow(e.target.checked)}
                  className="rounded"
                />
                <span>Border Glow</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={floatingEffect}
                  onChange={(e) => setFloatingEffect(e.target.checked)}
                  className="rounded"
                />
                <span>Floating Effect</span>
              </label>
            </div>
          </GlassyCard>
        </div>

        {/* Main Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Container Demo */}
          <div className="lg:col-span-2">
            <GlassContainer
              theme={theme}
              variant={selectedVariant}
              blurIntensity={blurIntensity}
              showParticles={showParticles}
              showGlowOrbs={showGlowOrbs}
              highlightEffect={highlightEffect}
              borderGlow={borderGlow}
              floatingEffect={floatingEffect}
              className="p-6 h-[400px]"
            >
              <h2 className="text-2xl font-bold mb-4">Glass Container</h2>
              <p className="mb-4 opacity-80">
                This is a premium glassmorphism container with customizable effects.
                You can adjust the settings using the controls above.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <GlassyCard
                  theme={theme}
                  variant={selectedVariant === 'default' ? 'primary' : 'premium'}
                  highlightEffect={highlightEffect}
                  borderGlow={borderGlow}
                  floatingEffect={floatingEffect}
                  className="p-4"
                >
                  <h3 className="text-lg font-semibold mb-2">Card Example</h3>
                  <p className="text-sm opacity-80">
                    This is a nested glassy card component with the same theme.
                  </p>
                </GlassyCard>
                
                <div className="space-y-4">
                  <GlassyInput
                    theme={theme}
                    variant={selectedVariant === 'premium' ? 'premium' : 'default'}
                    placeholder="Glass Input Example"
                    highlightOnFocus={true}
                  />
                  
                  <button className="w-full glass-button py-2 px-4 rounded-md hover:shadow-lg transition-all duration-300">
                    Glass Button
                  </button>
                </div>
              </div>
            </GlassContainer>
          </div>

          {/* Card Variants */}
          <div className="space-y-4">
            <GlassyCard
              theme={theme}
              variant="premium"
              highlightEffect={highlightEffect}
              borderGlow={borderGlow}
              floatingEffect={floatingEffect}
              className="p-4"
            >
              <h3 className="text-lg font-semibold mb-2">Premium Card</h3>
              <p className="text-sm opacity-80">
                This premium card features special effects and styling.
              </p>
            </GlassyCard>
            
            <GlassyCard
              theme={theme}
              variant="primary"
              highlightEffect={highlightEffect}
              borderGlow={borderGlow}
              floatingEffect={floatingEffect}
              className="p-4"
            >
              <h3 className="text-lg font-semibold mb-2">Primary Card</h3>
              <p className="text-sm opacity-80">
                A card with primary accent styling.
              </p>
            </GlassyCard>
            
            <GlassyCard
              theme={theme}
              variant="success"
              highlightEffect={highlightEffect}
              borderGlow={borderGlow}
              floatingEffect={floatingEffect}
              className="p-4"
            >
              <h3 className="text-lg font-semibold mb-2">Success Card</h3>
              <p className="text-sm opacity-80">
                A card with success accent styling.
              </p>
            </GlassyCard>
            
            <GlassyCard
              theme={theme}
              variant="warning"
              highlightEffect={highlightEffect}
              borderGlow={borderGlow}
              floatingEffect={floatingEffect}
              className="p-4"
            >
              <h3 className="text-lg font-semibold mb-2">Warning Card</h3>
              <p className="text-sm opacity-80">
                A card with warning accent styling.
              </p>
            </GlassyCard>
          </div>
        </div>
        
        {/* Admin Dashboard Example */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Admin Dashboard Example</h2>
          
          <GlassContainer
            theme={theme}
            variant={selectedVariant}
            blurIntensity={blurIntensity}
            showParticles={showParticles}
            showGlowOrbs={showGlowOrbs}
            highlightEffect={highlightEffect}
            borderGlow={borderGlow}
            className="p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { title: 'Total Users', value: '5,234', icon: '👥' },
                { title: 'Active Accounts', value: '4,385', icon: '✓' },
                { title: 'Active Courses', value: '128', icon: '📚' },
                { title: 'System Uptime', value: '99.9%', icon: '⚡' },
              ].map((stat, index) => (
                <GlassyCard
                  key={index}
                  theme={theme}
                  variant={selectedVariant === 'premium' ? 'premium' : 'default'}
                  highlightEffect={highlightEffect}
                  className="p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm opacity-70">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className="text-2xl">{stat.icon}</div>
                  </div>
                </GlassyCard>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassyCard
                theme={theme}
                variant={selectedVariant === 'premium' ? 'premium' : 'primary'}
                highlightEffect={highlightEffect}
                className="p-4 lg:col-span-2"
              >
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { user: 'John Doe', action: 'logged in', time: '2 minutes ago' },
                    { user: 'Jane Smith', action: 'updated profile', time: '15 minutes ago' },
                    { user: 'Bob Johnson', action: 'enrolled in course', time: '1 hour ago' },
                    { user: 'Alice Williams', action: 'completed assignment', time: '3 hours ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-white/5">
                      <div>
                        <span className="font-medium">{activity.user}</span>
                        <span className="opacity-70"> {activity.action}</span>
                      </div>
                      <span className="text-sm opacity-50">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </GlassyCard>
              
              <GlassyCard
                theme={theme}
                variant={selectedVariant === 'premium' ? 'premium' : 'secondary'}
                highlightEffect={highlightEffect}
                className="p-4"
              >
                <h3 className="text-lg font-semibold mb-4">System Health</h3>
                <div className="space-y-4">
                  {[
                    { label: 'CPU', value: 23.5, color: 'bg-blue-500' },
                    { label: 'Memory', value: 41.2, color: 'bg-purple-500' },
                    { label: 'Disk', value: 57.8, color: 'bg-green-500' },
                  ].map((metric, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{metric.label}</span>
                        <span>{metric.value}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${metric.color} rounded-full`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="text-sm opacity-70 pt-2">
                    Last backup: Mar 5, 2025, 1:48 PM
                  </div>
                </div>
              </GlassyCard>
            </div>
          </GlassContainer>
        </div>
      </div>
    </div>
  );
}
