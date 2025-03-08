import React, { useState } from 'react';
import { Layout } from '../components/layout';
import { GlassyCard } from '../components/ui/glassy-card';
import { GlassyButton } from '../components/ui/glassy-button';
import { GlassyInput } from '../components/ui/glassy-input';
import { GlassySelect } from '../components/ui/glassy-select';
import { GlassyTextarea } from '../components/ui/glassy-textarea';
import { GlassyBadge } from '../components/ui/glassy-badge';
import { GlassyAvatar } from '../components/ui/glassy-avatar';
import { User, Mail, Book, Calendar, MessageSquare } from 'lucide-react';

export default function FormExample() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    course: '',
    date: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your form submission logic here
  };

  const courseOptions = [
    { value: '', label: 'Select a course' },
    { value: 'math', label: 'Advanced Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'cs', label: 'Computer Science' },
    { value: 'biology', label: 'Biology' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2 neon-text">Course Registration</h1>
          <p className="text-muted-foreground mb-8">
            Register for classes using our Glassmorphism UI
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <GlassyCard variant="primary" className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassyInput
                    label="Full Name"
                    name="fullName"
                    icon={<User size={16} />}
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                  
                  <GlassyInput
                    label="Email Address"
                    name="email"
                    type="email"
                    icon={<Mail size={16} />}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassySelect
                    label="Select Course"
                    name="course"
                    icon={<Book size={16} />}
                    options={courseOptions}
                    value={formData.course}
                    onChange={handleChange}
                    required
                  />
                  
                  <GlassyInput
                    label="Preferred Start Date"
                    name="date"
                    type="date"
                    icon={<Calendar size={16} />}
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <GlassyTextarea
                  label="Additional Comments"
                  name="message"
                  placeholder="Any additional information we should know about..."
                  value={formData.message}
                  onChange={handleChange}
                />
                
                <div className="flex justify-end gap-3">
                  <GlassyButton variant="outline" type="button">
                    Cancel
                  </GlassyButton>
                  <GlassyButton variant="primary" type="submit">
                    Submit Application
                  </GlassyButton>
                </div>
              </form>
            </GlassyCard>
          </div>
          
          <div className="space-y-6">
            <GlassyCard variant="secondary" className="p-6">
              <h2 className="text-xl font-semibold mb-4">Course Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Course Status:</h3>
                  <div className="flex flex-wrap gap-2">
                    <GlassyBadge variant="primary">Enrolling Now</GlassyBadge>
                    <GlassyBadge variant="secondary">Limited Seats</GlassyBadge>
                    <GlassyBadge variant="accent">Online Options</GlassyBadge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Term Dates:</h3>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary"></div>
                      <span>Fall: September 5 - December 15</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-secondary"></div>
                      <span>Winter: January 10 - April 20</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-accent"></div>
                      <span>Summer: May 15 - August 25</span>
                    </li>
                  </ul>
                </div>
              </div>
            </GlassyCard>
            
            <GlassyCard variant="accent" className="p-6">
              <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
              <div className="space-y-4">
                <p className="text-sm">
                  Contact our academic advisors for assistance with course selection and registration.
                </p>
                
                <div className="flex items-center gap-3 p-3 bg-background/20 rounded-lg backdrop-blur-sm">
                  <GlassyAvatar 
                    name="Academic Advisor"
                    variant="primary"
                    size="lg"
                  />
                  <div>
                    <h3 className="font-medium">Academic Advising</h3>
                    <p className="text-sm text-muted-foreground">Available 9AM-5PM</p>
                  </div>
                </div>
                
                <GlassyButton className="w-full" variant="secondary">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Chat
                </GlassyButton>
              </div>
            </GlassyCard>
          </div>
        </div>
      </div>
    </Layout>
  );
} 